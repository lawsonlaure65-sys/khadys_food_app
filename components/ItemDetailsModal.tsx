import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'motion/react';
import { MenuItem } from '../types';
import { X, Plus, Minus, MessageSquare, Flame, Leaf, CheckCircle2, Clock, ShieldCheck, Users, Info, Box, Sparkles, Eye, Share2, Check, Share, PhoneCall, ShoppingBag } from 'lucide-react';
import Dish3DModal from './Dish3DModal';
import { playSound } from '../utils/audio';
import { RESTAURANT_INFO } from '../constants';

interface ItemDetailsModalProps {
  item: MenuItem | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (item: MenuItem, quantity: number, instructions: string) => void;
}

interface FlyingItemData {
  startX: number;
  startY: number;
  midX: number;
  peakY: number;
  endX: number;
  endY: number;
  item: MenuItem;
  quantity: number;
  instructions: string;
}

const ItemDetailsModal: React.FC<ItemDetailsModalProps> = ({ item, isOpen, onClose, onAddToCart }) => {
  const [quantity, setQuantity] = useState(1);
  const [instructions, setInstructions] = useState('');
  const [is3DOpen, setIs3DOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isFlying, setIsFlying] = useState(false);
  const [flyingData, setFlyingData] = useState<FlyingItemData | null>(null);
  const [impactRipple, setImpactRipple] = useState<{ x: number; y: number } | null>(null);
  const addButtonRef = useRef<HTMLButtonElement>(null);

  // Safety fallback in case animation completion is interrupted
  useEffect(() => {
    if (!isFlying || !flyingData) return;
    const safetyTimer = setTimeout(() => {
      handleFlightLanding(flyingData);
    }, 1400);
    return () => clearTimeout(safetyTimer);
  }, [isFlying, flyingData]);

  if (!isOpen || !item) return null;

  const handleFlightLanding = (data: FlyingItemData) => {
    setImpactRipple({ x: data.endX, y: data.endY });
    playSound('success');

    // Trigger visual impact in Navbar
    window.dispatchEvent(new CustomEvent('khadys_cart_item_landed', {
      detail: { count: data.quantity, x: data.endX, y: data.endY }
    }));

    // Add item to cart
    onAddToCart(data.item, data.quantity, data.instructions);

    // Let the landing impact burst show briefly before closing modal cleanly
    setTimeout(() => {
      setQuantity(1);
      setInstructions('');
      setFlyingData(null);
      setIsFlying(false);
      setImpactRipple(null);
      onClose();
    }, 220);
  };

  const handleAdd = () => {
    if (isFlying) return;

    // Source coordinates: center of the Add to Cart button
    const btnRect = addButtonRef.current?.getBoundingClientRect();
    const startX = btnRect ? btnRect.left + btnRect.width / 2 : window.innerWidth / 2;
    const startY = btnRect ? btnRect.top + btnRect.height / 2 : window.innerHeight - 80;

    // Destination coordinates: cart icon in bottom navigation bar
    const cartEl = document.getElementById('nav-cart-icon') || document.getElementById('nav-cart-btn');
    const cartRect = cartEl?.getBoundingClientRect();
    const endX = cartRect ? cartRect.left + cartRect.width / 2 : (window.innerWidth * 0.72);
    const endY = cartRect ? cartRect.top + cartRect.height / 2 : (window.innerHeight - 44);

    // Parabolic arc: leap up towards the upper-center viewport, then curve down to navbar
    const midX = (startX + endX) / 2;
    const peakY = Math.max(90, Math.min(startY, endY) - Math.min(280, window.innerHeight * 0.42));

    const flightData: FlyingItemData = {
      startX,
      startY,
      midX,
      peakY,
      endX,
      endY,
      item,
      quantity,
      instructions,
    };

    setFlyingData(flightData);
    setIsFlying(true);
    playSound('pop');
  };

  const handleShare = async () => {
    playSound('pop');
    const shareText = `🍽️ *${item.name}* (${item.price.toLocaleString()} F CFA)\n${item.description}\n👉 Commandez sur Khady's Food & Event :`;
    const shareUrl = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title: item.name,
          text: shareText,
          url: shareUrl,
        });
        playSound('success');
      } catch (err) {
        console.log('Partage annulé ou échoué:', err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
        setCopied(true);
        playSound('success');
        setTimeout(() => setCopied(false), 2500);
      } catch (e) {
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText}\n${shareUrl}`)}`;
        window.open(whatsappUrl, '_blank');
      }
    }
  };

  const handleWhatsAppShare = () => {
    playSound('pop');
    const shareText = `🍽️ *${item.name}* (${item.price.toLocaleString()} F CFA)\n${item.description}\n👉 Découvrir chez Khady's Food : ${window.location.href}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <>
      <div 
        className={`fixed inset-0 z-[110] flex items-end justify-center transition-all duration-300 ${
          isFlying ? 'bg-black/0 pointer-events-none' : 'bg-black/80 backdrop-blur-md animate-fade-in'
        }`} 
        onClick={!isFlying ? onClose : undefined}
      >
        <div 
          className={`bg-white w-full h-[94vh] rounded-t-[4rem] shadow-[0_50px_150px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col relative border-x-4 border-t-4 border-white transition-all duration-300 ${
            isFlying ? 'opacity-0 scale-95 translate-y-16 pointer-events-none' : 'opacity-100 animate-slide-up'
          }`}
          onClick={e => e.stopPropagation()}
        >
          <div className="relative h-64 sm:h-80 w-full flex-shrink-0">
              <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent"></div>
              
              <div className="absolute top-4 sm:top-8 left-4 sm:left-8 flex flex-wrap gap-2 max-w-[calc(100%-90px)]">
                 {item.minPeople && (
                   <div className="bg-brand-brown text-brand-gold px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-[10px] sm:text-[11px] font-black flex items-center gap-1.5 shadow-2xl border border-brand-gold/30 backdrop-blur-md">
                      <Users size={13} /> Dès {item.minPeople} convives
                   </div>
                 )}

                 {/* 3D AR Simulator Button */}
                 <button 
                   onClick={() => setIs3DOpen(true)}
                   className="bg-brand-gold text-brand-brown px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-[10px] sm:text-[11px] font-black flex items-center gap-1.5 shadow-2xl active:scale-95 transition-all border border-white"
                 >
                   <Sparkles size={13} /> Aperçu 3D
                 </button>

                 {/* Share Button Top Overlay */}
                 <button 
                   onClick={handleShare}
                   className="bg-brand-orange hover:bg-orange-600 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-[10px] sm:text-[11px] font-black flex items-center gap-1.5 shadow-2xl active:scale-95 transition-all border border-white"
                   title="Partager ce plat"
                 >
                   {copied ? <Check size={13} className="text-white" /> : <Share2 size={13} />} 
                   {copied ? 'Lien Copié !' : 'Partager'}
                 </button>
              </div>

              <button 
                onClick={onClose} 
                disabled={isFlying}
                className="absolute top-4 sm:top-8 right-4 sm:right-8 bg-white/10 backdrop-blur-xl text-white p-2.5 sm:p-3.5 rounded-2xl sm:rounded-3xl transition-all shadow-2xl border border-white/20 hover:bg-white/20 disabled:opacity-50"
              >
                <X size={24} />
              </button>
              
              <div className="absolute bottom-12 left-5 right-5 sm:left-10 sm:right-10">
                 <h2 className="text-xl sm:text-3xl font-black text-white leading-tight italic uppercase tracking-tight mb-2 drop-shadow-2xl line-clamp-2">{item.name}</h2>
                 <div className="flex items-center justify-between">
                    <span className="text-xl sm:text-3xl font-black text-brand-gold drop-shadow-2xl">{item.price.toLocaleString('fr-FR')} F CFA</span>
                 </div>
              </div>
          </div>

          <div className="flex-1 overflow-y-auto p-5 sm:p-10 bg-white rounded-t-[3rem] sm:rounded-t-[4rem] -mt-8 relative z-10 no-scrollbar space-y-6">
              <p className="text-gray-500 text-sm sm:text-base leading-relaxed italic font-medium border-l-4 border-brand-orange/30 pl-4 sm:pl-6">"{item.description}"</p>

              {/* Share & Recommend Box */}
              <div className="bg-amber-500/10 border border-amber-500/20 p-4 sm:p-5 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-brand-orange text-white flex items-center justify-center shrink-0 shadow-md">
                    <Share2 size={20} />
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-tight text-brand-brown">Partager ce délice avec vos proches</h4>
                    <p className="text-[10px] text-gray-500 font-medium">Recommandez ce plat sur WhatsApp ou réseaux sociaux !</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={handleWhatsAppShare}
                    className="flex-1 sm:flex-initial bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all"
                  >
                    <Share size={14} /> WhatsApp
                  </button>
                  <button
                    onClick={handleShare}
                    className="flex-1 sm:flex-initial bg-brand-brown hover:bg-black text-white px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all"
                  >
                    {copied ? <Check size={14} className="text-green-400" /> : <Share2 size={14} />}
                    {copied ? 'Copié !' : 'Partager'}
                  </button>
                </div>
              </div>

              {/* Notification Précommande WhatsApp & Liens Officiels */}
              <div className="bg-emerald-950/95 text-white p-4 rounded-3xl border border-emerald-500/30 space-y-3 shadow-sm">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-md">
                      <MessageSquare size={18} />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[8px] font-black uppercase text-emerald-300 tracking-wider block">Service Rapide & Vitrine Officielle</span>
                      <h5 className="text-[11px] font-black uppercase italic text-white truncate">Khady’s Food & Event</h5>
                      <p className="text-[9px] text-emerald-200/70 font-mono font-bold">{RESTAURANT_INFO.whatsapp}</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <a
                    href="https://khadysfood.vercel.app"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => playSound('pop')}
                    className="flex-1 sm:flex-initial bg-brand-gold/20 hover:bg-brand-gold/30 text-brand-gold border border-brand-gold/40 px-3.5 py-2.5 rounded-2xl text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg transition-all active:scale-95"
                  >
                    <span>Site Khady’s Food ↗</span>
                  </a>
                  <a
                    href={RESTAURANT_INFO.whatsappCatalogUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => playSound('pop')}
                    className="flex-1 sm:flex-initial bg-brand-gold/20 hover:bg-brand-gold/30 text-brand-gold border border-brand-gold/40 px-3.5 py-2.5 rounded-2xl text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg transition-all active:scale-95"
                  >
                    <ShoppingBag size={12} />
                    <span>Catalogue WhatsApp ↗</span>
                  </a>
                  <a
                    href={RESTAURANT_INFO.whatsappOrderUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => playSound('pop')}
                    className="flex-1 sm:flex-initial bg-emerald-500 hover:bg-emerald-400 text-white px-3.5 py-2.5 rounded-2xl text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg transition-all active:scale-95"
                  >
                    <MessageSquare size={12} />
                    <span>Commander sur WhatsApp</span>
                  </a>
                </div>
              </div>

              <div>
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2 ml-2">
                    <MessageSquare size={16} className="text-brand-orange" /> 
                    Note ou préférence piment / cuisson
                  </label>
                  <textarea 
                    className="w-full bg-gray-50 border-2 border-transparent focus:border-brand-orange/30 rounded-3xl p-4 sm:p-6 text-xs sm:text-sm text-brand-brown font-bold resize-none shadow-inner outline-none transition-all placeholder:text-gray-300" 
                    placeholder="Ex: Peu pimenté, sans oignon, livraison pour 13h précise..." 
                    rows={2} 
                    value={instructions} 
                    onChange={(e) => setInstructions(e.target.value)}
                  ></textarea>
              </div>
          </div>

          <div className="p-4 sm:p-8 border-t border-gray-100 bg-white shadow-[0_-20px_50px_rgba(0,0,0,0.05)] flex-shrink-0">
              <div className="flex items-center gap-3 sm:gap-6">
                  <div className="flex items-center gap-2.5 sm:gap-6 bg-gray-50 rounded-3xl sm:rounded-[2.5rem] px-3 py-2.5 sm:px-6 sm:py-4 border-2 border-gray-100 shadow-inner shrink-0">
                      <button 
                        onClick={() => setQuantity(Math.max(1, quantity - 1))} 
                        disabled={isFlying}
                        className="w-9 h-9 sm:w-12 sm:h-12 flex items-center justify-center bg-white rounded-2xl sm:rounded-3xl shadow-md text-brand-brown active:scale-90 transition-all disabled:opacity-50"
                      >
                        <Minus size={18} />
                      </button>
                      <span className="font-black text-xl sm:text-3xl w-7 sm:w-12 text-center text-brand-brown italic tracking-tighter">{quantity}</span>
                      <button 
                        onClick={() => setQuantity(quantity + 1)} 
                        disabled={isFlying}
                        className="w-9 h-9 sm:w-12 sm:h-12 flex items-center justify-center bg-brand-brown text-white rounded-2xl sm:rounded-3xl shadow-md active:scale-90 transition-all hover:bg-brand-orange disabled:opacity-50"
                      >
                        <Plus size={18} />
                      </button>
                  </div>
                  <button 
                    ref={addButtonRef}
                    onClick={handleAdd} 
                    disabled={isFlying}
                    className="flex-1 min-w-0 bg-brand-orange text-white py-3.5 sm:py-6 px-3 rounded-3xl sm:rounded-[3rem] font-black text-sm sm:text-xl shadow-[0_20px_50px_rgba(255,111,0,0.3)] active:scale-95 transition-all flex flex-col items-center justify-center leading-none disabled:opacity-90 relative overflow-hidden"
                  >
                      {isFlying ? (
                        <div className="flex items-center gap-2 text-white">
                          <Sparkles size={16} className="animate-spin text-brand-gold shrink-0" />
                          <span className="uppercase tracking-tight italic text-xs sm:text-base truncate">Ajout...</span>
                        </div>
                      ) : (
                        <>
                          <span className="uppercase tracking-tight italic">Ajouter au panier</span>
                          <span className="text-[10px] opacity-90 font-black mt-1.5 uppercase tracking-wider italic">{(item.price * quantity).toLocaleString('fr-FR')} F CFA</span>
                        </>
                      )}
                  </button>
              </div>
          </div>
        </div>
      </div>

      {/* FLYING ITEM PORTAL TO NAVBAR CART */}
      {flyingData && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 pointer-events-none z-[9999]">
          <motion.div
            initial={{
              x: flyingData.startX - 36,
              y: flyingData.startY - 36,
              scale: 0.6,
              opacity: 0.2,
              rotate: -12,
            }}
            animate={{
              x: [flyingData.startX - 36, flyingData.midX - 36, flyingData.endX - 18],
              y: [flyingData.startY - 36, flyingData.peakY - 36, flyingData.endY - 18],
              scale: [0.6, 1.25, 0.22],
              opacity: [0.2, 1, 0.95, 0.4, 0],
              rotate: [-12, 14, 0],
            }}
            transition={{
              duration: 0.8,
              times: [0, 0.42, 0.82, 0.96, 1],
              ease: ["easeOut", "easeInOut"],
            }}
            onAnimationComplete={() => handleFlightLanding(flyingData)}
            className="absolute top-0 left-0 w-[72px] h-[72px] flex items-center justify-center"
          >
            {/* Outer Golden Glow Halo */}
            <div className="absolute -inset-3 bg-gradient-to-tr from-brand-orange via-amber-400 to-brand-gold rounded-full blur-md opacity-80 animate-pulse" />
            
            {/* Floating Dish Avatar */}
            <div className="relative w-full h-full rounded-full border-2 border-brand-gold shadow-[0_15px_35px_rgba(255,111,0,0.6),0_0_20px_rgba(217,119,6,0.5)] overflow-hidden bg-brand-brown">
              <img 
                src={flyingData.item.image} 
                alt={flyingData.item.name} 
                className="w-full h-full object-cover" 
              />
            </div>

            {/* Quantity Pill Badge */}
            <div className="absolute -top-2 -right-2 bg-gradient-to-r from-brand-orange to-red-500 text-white text-[11px] font-black px-2.5 py-0.5 rounded-full border-2 border-white shadow-xl flex items-center justify-center">
              +{flyingData.quantity}
            </div>

            {/* Sparkle Icon Badge */}
            <div className="absolute -bottom-1 -left-1 bg-brand-brown text-brand-gold p-1.5 rounded-full border border-brand-gold shadow-md">
              <Sparkles size={12} className="animate-spin" />
            </div>
          </motion.div>

          {/* Impact Shockwave Ring upon landing */}
          {impactRipple && (
            <motion.div
              initial={{ scale: 0.3, opacity: 1 }}
              animate={{ scale: 2.8, opacity: 0 }}
              transition={{ duration: 0.45, ease: 'easeOut' }}
              style={{ left: impactRipple.x - 28, top: impactRipple.y - 28 }}
              className="absolute w-14 h-14 rounded-full border-2 border-brand-gold bg-amber-400/30 shadow-[0_0_20px_rgba(255,183,3,0.8)]"
            />
          )}
        </div>,
        document.body
      )}

      {is3DOpen && (
        <Dish3DModal 
          item={item} 
          onClose={() => setIs3DOpen(false)} 
          onAddToCart={onAddToCart} 
        />
      )}
    </>
  );
};

export default ItemDetailsModal;
