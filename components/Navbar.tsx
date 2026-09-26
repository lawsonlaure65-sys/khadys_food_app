import React, { useState, useEffect, useRef } from 'react';
import { Home, ScrollText, ShoppingBag, Image as ImageIcon, Video, MessageSquare, UserRound } from 'lucide-react';
import { Page } from '../types';
import { playSound } from '../utils/audio';

interface NavbarProps {
  currentPage: Page;
  setPage: (page: Page) => void;
  cartCount: number;
}

const Navbar: React.FC<NavbarProps> = ({ currentPage, setPage, cartCount }) => {
  const [isBouncing, setIsBouncing] = useState(false);
  const [isLandingImpact, setIsLandingImpact] = useState(false);
  const prevCount = useRef(cartCount);

  useEffect(() => {
    if (cartCount > prevCount.current) {
      setIsBouncing(true);
      const timer = setTimeout(() => setIsBouncing(false), 600);
      return () => clearTimeout(timer);
    }
    prevCount.current = cartCount;
  }, [cartCount]);

  // Listen for flying cart item arrival
  useEffect(() => {
    const handleCartLanded = () => {
      setIsLandingImpact(true);
      setIsBouncing(true);
      const timer = setTimeout(() => {
        setIsLandingImpact(false);
        setIsBouncing(false);
      }, 700);
      return () => clearTimeout(timer);
    };

    window.addEventListener('khadys_cart_item_landed', handleCartLanded);
    return () => window.removeEventListener('khadys_cart_item_landed', handleCartLanded);
  }, []);

  const navItems = [
    { page: Page.HOME, icon: Home, label: 'Accueil' },
    { page: Page.MENU, icon: ScrollText, label: 'Menu' },
    { page: Page.GALLERY, icon: ImageIcon, label: 'Galerie' },
    { page: Page.VIDEO, icon: Video, label: 'Démo 4K' },
    { page: Page.WHATSAPP, icon: MessageSquare, label: 'WhatsApp' },
    { page: Page.CART, icon: ShoppingBag, label: 'Panier', badge: cartCount },
    { page: Page.COMPTE, icon: UserRound, label: 'Moi' },
  ];

  return (
    <div className="fixed bottom-4 sm:bottom-6 left-0 right-0 z-50 px-2 sm:px-3 flex justify-center">
      <nav className="bg-brand-brown/95 backdrop-blur-2xl border-2 border-brand-gold/30 shadow-[0_20px_50px_rgba(0,0,0,0.4)] flex justify-between items-center h-20 px-2 sm:px-3 rounded-[2.5rem] w-full max-w-lg">
          {navItems.map((item) => {
            const isActive = currentPage === item.page;
            const isCart = item.page === Page.CART;
            const Icon = item.icon;
            
            return (
              <button 
                key={item.label}
                id={isCart ? 'nav-cart-btn' : undefined}
                onClick={() => { playSound('pop'); setPage(item.page); }} 
                className="relative flex flex-col items-center justify-center flex-1 h-full group"
                title={item.label}
              >
                <div 
                  id={isCart ? 'nav-cart-icon' : undefined}
                  className={`relative p-2 sm:p-2.5 rounded-2xl transition-all duration-300 ${
                    isActive 
                      ? 'bg-brand-orange text-white shadow-lg shadow-brand-orange/40 scale-110' 
                      : 'text-white/40 group-hover:text-brand-gold'
                  } ${isCart && (isBouncing || isLandingImpact) ? 'animate-bounce-subtle scale-125' : ''} ${
                    isCart && isLandingImpact ? 'ring-4 ring-brand-gold/80 shadow-[0_0_25px_rgba(255,183,3,0.8)]' : ''
                  }`}
                >
                  <Icon size={17} strokeWidth={isActive ? 2.2 : 1.5} />
                  
                  {item.badge ? (
                    <span className={`absolute -top-1 -right-1 bg-brand-gold text-brand-brown text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-brand-brown shadow-md transition-transform ${
                      (isBouncing || isLandingImpact) && isCart ? 'scale-150 bg-amber-400' : 'scale-100'
                    }`}>
                      {item.badge}
                    </span>
                  ) : null}

                  {isCart && isLandingImpact && (
                    <span className="absolute -inset-1 rounded-2xl bg-brand-gold/40 animate-ping pointer-events-none" />
                  )}
                </div>
                <span className={`text-[6.5px] sm:text-[7px] font-black uppercase tracking-tighter mt-1 transition-colors ${isActive ? 'text-brand-gold' : 'text-white/30'}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
      </nav>
    </div>
  );
};

export default Navbar;
