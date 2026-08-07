
import React, { useState, useEffect, useRef } from 'react';
import { Home, ScrollText, ShoppingBag, Sparkles, UserRound, BookOpen, Camera } from 'lucide-react';
import { Page } from '../types';
import { playSound } from '../utils/audio';

interface NavbarProps {
  currentPage: Page;
  setPage: (page: Page) => void;
  cartCount: number;
}

const Navbar: React.FC<NavbarProps> = ({ currentPage, setPage, cartCount }) => {
  const [isBouncing, setIsBouncing] = useState(false);
  const prevCount = useRef(cartCount);

  useEffect(() => {
    if (cartCount > prevCount.current) {
      setIsBouncing(true);
      const timer = setTimeout(() => setIsBouncing(false), 600);
      return () => clearTimeout(timer);
    }
    prevCount.current = cartCount;
  }, [cartCount]);

  const navItems = [
    { page: Page.HOME, icon: Home, label: 'Accueil' },
    { page: Page.MENU, icon: ScrollText, label: 'Menu' },
    { page: Page.GALLERY, icon: Camera, label: 'Galerie' },
    { page: Page.BLOG, icon: BookOpen, label: 'Blog' },
    { page: Page.TRAITEUR, icon: Sparkles, label: 'Event' },
    { page: Page.CART, icon: ShoppingBag, label: 'Panier', badge: cartCount },
    { page: Page.COMPTE, icon: UserRound, label: 'Moi' },
  ];

  return (
    <div className="fixed bottom-3 sm:bottom-6 left-0 right-0 z-50 px-2 sm:px-4 flex justify-center pointer-events-none">
      <nav className="pointer-events-auto bg-white/95 backdrop-blur-2xl border border-gray-100 shadow-[0_20px_50px_rgba(0,0,0,0.15)] flex justify-around items-center h-16 sm:h-20 px-1.5 sm:px-3 rounded-[2rem] sm:rounded-[2.5rem] w-full max-w-[96%] xs:max-w-md sm:max-w-lg">
          {navItems.map((item) => {
            const isActive = currentPage === item.page;
            const isCart = item.page === Page.CART;
            const Icon = item.icon;
            
            return (
              <button 
                key={item.label} 
                onClick={() => { playSound('pop'); setPage(item.page); }} 
                className="relative flex flex-col items-center justify-center flex-1 h-full group py-1"
                title={item.label}
              >
                <div className={`relative p-1.5 sm:p-2.5 rounded-xl sm:rounded-2xl transition-all duration-300 ${isActive ? 'bg-brand-brown text-brand-gold shadow-md shadow-brand-brown/20 scale-105' : 'text-gray-400 group-hover:text-brand-brown'} ${isCart && isBouncing ? 'animate-bounce-subtle' : ''}`}>
                  <Icon size={16} className="sm:w-[18px] sm:h-[18px]" strokeWidth={isActive ? 2 : 1.5} />
                  
                  {item.badge ? (
                    <span className={`absolute -top-1 -right-1 bg-brand-orange text-white text-[7px] sm:text-[8px] font-black w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full flex items-center justify-center border-2 border-white shadow-md transition-transform ${isBouncing && isCart ? 'scale-150' : 'scale-100'}`}>
                      {item.badge}
                    </span>
                  ) : null}
                </div>
                <span className={`text-[6.5px] sm:text-[7.5px] font-black uppercase tracking-tight mt-0.5 truncate max-w-full ${isActive ? 'text-brand-brown' : 'text-gray-400'}`}>
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
