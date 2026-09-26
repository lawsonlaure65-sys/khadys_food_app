import React, { useState, useEffect, useMemo } from 'react';
import { Zap, Flame, Clock, ShoppingBag, Sparkles, ArrowRight, ShieldAlert, Tag, CheckCircle2 } from 'lucide-react';
import { MenuItem } from '../types';
import { playSound } from '../utils/audio';
import { getStoredFlashDeal, FlashDealConfig } from '../utils/marketing';

interface FlashOfferProps {
  onAddToCart: (item: MenuItem, quantity: number, instructions: string) => void;
  onSelectItem?: (item: MenuItem) => void;
}

export const FLASH_ITEMS: (MenuItem & { originalPrice: number; discountPercent: number; remainingStock: number; totalStock: number })[] = [
  {
    id: 'flash-1',
    name: 'Pack Duo Grillades Suya + 2 Jus Bissap',
    description: 'Suya d’Agneau tendre grillé au feu de bois avec 2 boissons artisanales au hibiscus faites maison offertes.',
    price: 5500,
    originalPrice: 8500,
    discountPercent: 35,
    remainingStock: 4,
    totalStock: 20,
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=1000',
    category: 'Spécialité Maison',
    rating: 4.9,
    isAvailable: true,
    isPromo: true,
    isSpicy: true
  },
  {
    id: 'flash-2',
    name: 'Box Sauce Gombo Royal + Viande Braisée',
    description: 'Gombo frais battu à la main, morceaux de viande de boeuf fondante et accompagnement au choix (Riz / Foutou).',
    price: 4000,
    originalPrice: 6000,
    discountPercent: 33,
    remainingStock: 7,
    totalStock: 15,
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=1000',
    category: 'Box Sauce',
    rating: 4.8,
    isAvailable: true,
    isPromo: true
  }
];

export const FlashOffer: React.FC<FlashOfferProps> = ({ onAddToCart, onSelectItem }) => {
  const [flashConfig, setFlashConfig] = useState<FlashDealConfig>(() => getStoredFlashDeal());
  const [activeOfferIndex, setActiveOfferIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number }>({
    hours: 3,
    minutes: 42,
    seconds: 15
  });
  const [addedSuccess, setAddedSuccess] = useState(false);

  useEffect(() => {
    const handleUpdate = (e: any) => {
      if (e.detail && e.detail.dishName) {
        setFlashConfig(e.detail);
      }
    };
    window.addEventListener('khadys_flash_deal_updated', handleUpdate);
    return () => window.removeEventListener('khadys_flash_deal_updated', handleUpdate);
  }, []);

  const itemsList = useMemo(() => {
    if (flashConfig && flashConfig.isEnabled && flashConfig.dishName) {
      const customItem: MenuItem & { originalPrice: number; discountPercent: number; remainingStock: number; totalStock: number } = {
        id: 'flash-custom',
        name: flashConfig.dishName,
        description: `Offre Flash Exclusive configurée par le restaurant : remise immédiate de ${flashConfig.discountPercent}% !`,
        price: flashConfig.promoPrice,
        originalPrice: flashConfig.dishPrice,
        discountPercent: flashConfig.discountPercent,
        remainingStock: flashConfig.remainingStock,
        totalStock: flashConfig.totalStock,
        image: flashConfig.dishImage || FLASH_ITEMS[0].image,
        category: 'Spécialité Maison',
        rating: 5.0,
        isAvailable: true,
        isPromo: true,
        isSpicy: false
      };
      return [customItem, ...FLASH_ITEMS.filter(f => f.name !== flashConfig.dishName)];
    }
    return FLASH_ITEMS;
  }, [flashConfig]);

  const currentFlash = itemsList[activeOfferIndex] || itemsList[0] || FLASH_ITEMS[0];

  // Dynamic countdown effect
  useEffect(() => {
    // Set target time 3 hours 42 mins from now or compute remaining time to end of 4h cycle
    const getRemainingSeconds = () => {
      const now = new Date();
      const cycleSeconds = 4 * 3600; // 4 hour cycle
      const currentSeconds = (now.getHours() % 4) * 3600 + now.getMinutes() * 60 + now.getSeconds();
      return Math.max(0, cycleSeconds - currentSeconds);
    };

    const updateTimer = () => {
      const totalSec = getRemainingSeconds();
      const hours = Math.floor(totalSec / 3600);
      const minutes = Math.floor((totalSec % 3600) / 60);
      const seconds = totalSec % 60;
      setTimeLeft({ hours, minutes, seconds });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleOrderNow = () => {
    playSound('cash');
    onAddToCart(currentFlash, 1, 'Commande Offre Flash du Jour');
    setAddedSuccess(true);
    setTimeout(() => setAddedSuccess(false), 3000);
  };

  const formatTwoDigits = (num: number) => String(num).padStart(2, '0');

  return (
    <div className="relative overflow-hidden rounded-[3rem] bg-gradient-to-br from-[#1C0D09] via-[#2A140F] to-[#120705] p-6 sm:p-8 text-white border-2 border-brand-gold/40 shadow-2xl my-8">
      {/* Glow background accent */}
      <div className="absolute -top-24 -right-24 w-60 h-60 bg-brand-orange/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-brand-gold/15 rounded-full blur-3xl pointer-events-none"></div>

      {/* Top Header Badge */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-orange to-amber-500 text-white flex items-center justify-center shadow-lg shadow-brand-orange/40 animate-pulse">
            <Zap size={22} fill="currentColor" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase text-brand-gold tracking-[0.25em] italic">
                PROMOTION EXCLUSIVE
              </span>
              <span className="bg-red-600 text-white text-[8px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider animate-bounce">
                -{currentFlash.discountPercent}% OFF
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black italic uppercase text-white tracking-tight leading-none mt-0.5">
              OFFRE FLASH <span className="text-brand-orange">DU JOUR</span>
            </h3>
          </div>
        </div>

        {/* Dynamic Countdown Timer Widget */}
        <div className="bg-black/60 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-brand-gold/30 flex items-center gap-3 shadow-inner self-stretch sm:self-auto justify-center">
          <div className="flex items-center gap-1 text-brand-gold">
            <Clock size={16} className="animate-spin-slow" />
            <span className="text-[9px] font-black uppercase tracking-wider hidden sm:inline">Expire dans :</span>
          </div>

          <div className="flex items-center gap-1.5 font-mono font-black text-sm text-white">
            <div className="bg-brand-brown/80 text-brand-gold px-2.5 py-1 rounded-xl border border-brand-gold/30 shadow">
              {formatTwoDigits(timeLeft.hours)}
              <span className="text-[8px] block font-sans text-white/60 -mt-1 font-bold text-center">HRS</span>
            </div>
            <span className="text-brand-orange font-bold text-base animate-pulse">:</span>
            <div className="bg-brand-brown/80 text-brand-gold px-2.5 py-1 rounded-xl border border-brand-gold/30 shadow">
              {formatTwoDigits(timeLeft.minutes)}
              <span className="text-[8px] block font-sans text-white/60 -mt-1 font-bold text-center">MIN</span>
            </div>
            <span className="text-brand-orange font-bold text-base animate-pulse">:</span>
            <div className="bg-brand-orange text-white px-2.5 py-1 rounded-xl border border-white/20 shadow animate-pulse">
              {formatTwoDigits(timeLeft.seconds)}
              <span className="text-[8px] block font-sans text-white/90 -mt-1 font-bold text-center">SEC</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Flash Offer Content */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center relative z-10">
        {/* Product Image & Offer Switcher */}
        <div className="md:col-span-5 relative group cursor-pointer" onClick={() => onSelectItem && onSelectItem(currentFlash)}>
          <div className="relative h-56 sm:h-64 rounded-[2.5rem] overflow-hidden border-2 border-brand-gold/30 shadow-2xl bg-black">
            <img 
              src={currentFlash.image} 
              alt={currentFlash.name} 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20"></div>

            {/* Top Left Badge */}
            <div className="absolute top-3 left-3 bg-brand-orange text-white text-[8px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1">
              <Flame size={12} className="animate-bounce" /> STOCK LIMITÉ
            </div>

            {/* Price Badge */}
            <div className="absolute bottom-3 right-3 bg-black/80 backdrop-blur-md px-4 py-2 rounded-2xl border border-brand-gold/40 text-right">
              <span className="text-[9px] text-gray-400 line-through block font-bold">
                {currentFlash.originalPrice.toLocaleString()} F
              </span>
              <span className="text-lg font-black text-brand-gold leading-none">
                {currentFlash.price.toLocaleString()} F CFA
              </span>
            </div>
          </div>

          {/* Offer switcher tabs if multiple offers */}
          {itemsList.length > 1 && (
            <div className="flex gap-2 mt-3">
              {itemsList.map((item, idx) => (
                <button
                  key={item.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    playSound('pop');
                    setActiveOfferIndex(idx);
                  }}
                  className={`flex-1 py-1.5 px-3 rounded-xl text-[8px] font-black uppercase tracking-wider transition-all border ${
                    activeOfferIndex === idx
                      ? 'bg-brand-gold text-brand-brown border-brand-gold shadow-md'
                      : 'bg-white/10 text-white/70 border-white/10 hover:bg-white/20'
                  }`}
                >
                  Offre #{idx + 1}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details & CTA */}
        <div className="md:col-span-7 space-y-4">
          <div>
            <span className="text-[9px] font-black text-brand-gold uppercase tracking-widest block mb-1">
              {currentFlash.category}
            </span>
            <h4 className="text-xl sm:text-2xl font-black italic uppercase text-white leading-tight">
              {currentFlash.name}
            </h4>
            <p className="text-xs text-white/80 font-medium mt-2 leading-relaxed italic">
              "{currentFlash.description}"
            </p>
          </div>

          {/* Stock Progress Bar */}
          <div className="space-y-1.5 bg-black/40 p-3.5 rounded-2xl border border-white/10">
            <div className="flex justify-between items-center text-[10px] font-bold">
              <span className="text-brand-gold flex items-center gap-1">
                <ShieldAlert size={12} className="text-brand-orange" /> Quantité restante :
              </span>
              <span className="text-white font-mono font-black">
                {currentFlash.remainingStock} / {currentFlash.totalStock} portions
              </span>
            </div>
            <div className="w-full bg-white/20 h-2.5 rounded-full overflow-hidden p-0.5 border border-white/10">
              <div 
                className="bg-gradient-to-r from-amber-500 to-brand-orange h-full rounded-full transition-all duration-500"
                style={{ width: `${(currentFlash.remainingStock / currentFlash.totalStock) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Pricing CTA & Add button */}
          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              onClick={handleOrderNow}
              className={`flex-1 py-4 px-6 rounded-2xl font-black uppercase italic text-xs tracking-wider flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-all ${
                addedSuccess
                  ? 'bg-emerald-600 text-white border-2 border-emerald-400'
                  : 'bg-gradient-to-r from-brand-orange to-amber-500 hover:from-amber-500 hover:to-brand-orange text-white shadow-brand-orange/40 border-2 border-white/30'
              }`}
            >
              {addedSuccess ? (
                <>
                  <CheckCircle2 size={18} className="animate-bounce" /> AJOUTÉ AU PANIER !
                </>
              ) : (
                <>
                  <ShoppingBag size={18} /> PROFITER DE L'OFFRE FLASH ({currentFlash.price.toLocaleString()} F)
                </>
              )}
            </button>

            {onSelectItem && (
              <button
                onClick={() => onSelectItem(currentFlash)}
                className="px-4 py-4 rounded-2xl bg-white/10 hover:bg-white/20 text-brand-gold border border-brand-gold/30 text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all"
              >
                Détails <ArrowRight size={14} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlashOffer;
