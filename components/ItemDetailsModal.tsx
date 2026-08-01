
import React, { useState } from 'react';
import { MenuItem } from '../types';
import { X, Plus, Minus, MessageSquare, Flame, Leaf, CheckCircle2, Clock, ShieldCheck, Users, Info, Box, Share2 } from 'lucide-react';
import { playSound } from '../utils/audio';

interface ItemDetailsModalProps {
  item: MenuItem | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (item: MenuItem, quantity: number, instructions: string) => void;
  onShareItem?: (item: MenuItem) => void;
}

const ItemDetailsModal: React.FC<ItemDetailsModalProps> = ({ item, isOpen, onClose, onAddToCart, onShareItem }) => {
  const [quantity, setQuantity] = useState(1);
  const [instructions, setInstructions] = useState('');

  if (!isOpen || !item) return null;

  const handleAdd = () => {
    onAddToCart(item, quantity, instructions);
    setQuantity(1);
    setInstructions('');
    onClose();
  };

  const isSpecial = item.category === 'Pack-Buffet' || item.category === 'Box Sauce' || item.category === 'Pack';

  return (
    <div className="fixed inset-0 z-[110] flex items-end justify-center bg-black/80 backdrop-blur-md animate-fade-in" onClick={onClose}>
      <div 
        className="bg-white w-full h-[94vh] rounded-t-[4rem] shadow-[0_50px_150px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col relative animate-slide-up border-x-4 border-t-4 border-white"
        onClick={e => e.stopPropagation()}
      >
        <div className="relative h-80 w-full flex-shrink-0">
            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>
            
            <div className="absolute top-8 left-8 flex flex-wrap gap-3">
               {item.minPeople && (
                 <div className="bg-brand-brown text-brand-gold px-5 py-2 rounded-full text-[11px] font-black flex items-center gap-2 shadow-2xl border border-brand-gold/30 backdrop-blur-md">
                    <Users size={14} /> Dès {item.minPeople} convives
                 </div>
               )}
            </div>

            <div className="absolute top-8 right-8 flex items-center gap-3">
               {onShareItem && (
                 <button 
                   onClick={() => { playSound('pop'); onShareItem(item); }} 
                   className="bg-brand-brown/80 backdrop-blur-xl text-brand-gold p-3.5 rounded-3xl transition-all shadow-2xl border border-brand-gold/30 hover:bg-brand-orange hover:text-white"
                   title="Partager ce plat"
                 >
                   <Share2 size={24} />
                 </button>
               )}
               <button onClick={onClose} className="bg-white/10 backdrop-blur-xl text-white p-3.5 rounded-3xl transition-all shadow-2xl border border-white/20"><X size={28} /></button>
            </div>
            
            <div className="absolute bottom-10 left-10 right-10">
               <h2 className="text-4xl font-black text-white leading-none italic uppercase tracking-tighter mb-4 drop-shadow-2xl">{item.name}</h2>
               <div className="flex items-center justify-between">
                  <span className="text-3xl font-black text-brand-gold drop-shadow-2xl">{item.price} F</span>
               </div>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto p-10 bg-white rounded-t-[4rem] -mt-10 relative z-10 no-scrollbar">
            <p className="text-gray-500 text-base mb-12 leading-relaxed italic font-medium border-l-4 border-brand-orange/30 pl-6">"{item.description}"</p>

            <div className="mb-10">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-5 flex items-center gap-3 ml-4">
                  <MessageSquare size={18} className="text-brand-orange" /> 
                  Personnalisez votre commande
                </label>
                <textarea 
                  className="w-full bg-gray-50 border-2 border-transparent focus:border-brand-orange/30 rounded-[2.5rem] p-8 text-sm text-brand-brown font-bold resize-none shadow-inner outline-none transition-all placeholder:text-gray-300" 
                  placeholder="Ex: Pas trop épicé, livraison pour 13h précise..." 
                  rows={4} 
                  value={instructions} 
                  onChange={(e) => setInstructions(e.target.value)}
                ></textarea>
            </div>
        </div>

        <div className="p-8 border-t border-gray-100 bg-white shadow-[0_-20px_50px_rgba(0,0,0,0.05)] flex-shrink-0">
            <div className="flex items-center gap-6">
                <div className="flex items-center gap-6 bg-gray-50 rounded-[2.5rem] px-6 py-4 border-2 border-gray-100 shadow-inner">
                    <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-12 h-12 flex items-center justify-center bg-white rounded-3xl shadow-lg text-brand-brown active:scale-90 transition-all"><Minus size={24} /></button>
                    <span className="font-black text-3xl w-12 text-center text-brand-brown italic tracking-tighter">{quantity}</span>
                    <button onClick={() => setQuantity(quantity + 1)} className="w-12 h-12 flex items-center justify-center bg-brand-brown text-white rounded-3xl shadow-lg active:scale-90 transition-all hover:bg-brand-orange"><Plus size={24} /></button>
                </div>
                <button onClick={handleAdd} className="flex-1 bg-brand-orange text-white py-6 rounded-[3rem] font-black text-xl shadow-[0_20px_50px_rgba(255,111,0,0.3)] active:scale-95 transition-all flex flex-col items-center justify-center leading-none">
                    <span className="uppercase tracking-tighter italic">Ajouter</span>
                    <span className="text-[10px] opacity-80 font-black mt-2 uppercase tracking-[0.4em] italic">{(item.price * quantity).toLocaleString()} F CFA</span>
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ItemDetailsModal;
