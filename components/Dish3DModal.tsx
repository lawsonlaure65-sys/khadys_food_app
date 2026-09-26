import React, { useState } from 'react';
import { MenuItem } from '../types';
import { X, Sparkles, RotateCw, ShoppingBag, Eye, Maximize2, Layers } from 'lucide-react';
import { playSound } from '../utils/audio';

interface Dish3DModalProps {
  item: MenuItem;
  onClose: () => void;
  onAddToCart: (item: MenuItem, quantity: number, instructions: string) => void;
}

export const Dish3DModal: React.FC<Dish3DModalProps> = ({ item, onClose, onAddToCart }) => {
  const [rotation, setRotation] = useState(0);
  const [isTableProjection, setIsTableProjection] = useState(false);

  const handleRotate = () => {
    playSound('pop');
    setRotation(prev => (prev + 90) % 360);
  };

  const handleAdd = () => {
    onAddToCart(item, 1, 'Projeté en 3D');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[120] bg-black/90 backdrop-blur-2xl flex items-center justify-center p-4 animate-fade-in">
      <div className="relative w-full max-w-lg bg-[#120B09] text-white rounded-[3.5rem] overflow-hidden border-4 border-brand-gold/20 shadow-2xl animate-scale-up">
        
        {/* Header */}
        <div className="p-6 flex justify-between items-center border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-brand-gold/20 text-brand-gold flex items-center justify-center">
              <Sparkles size={16} />
            </div>
            <div>
              <h3 className="font-black text-xs uppercase italic text-brand-gold">Simulateur 3D / AR</h3>
              <p className="text-[8px] font-bold text-white/50 uppercase tracking-widest">Aperçu Réaliste Portions</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2.5 bg-white/10 rounded-2xl hover:bg-white/20 transition-all">
            <X size={20} />
          </button>
        </div>

        {/* 3D Canvas Stage */}
        <div className="relative h-80 w-full bg-gradient-to-b from-black via-[#1E110D] to-black flex items-center justify-center overflow-hidden">
          
          {/* Table Backdrop simulation */}
          {isTableProjection && (
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1000')] bg-cover opacity-30 filter blur-xs"></div>
          )}

          {/* Glowing pedestal */}
          <div className="absolute w-64 h-64 bg-brand-gold/10 rounded-full filter blur-2xl animate-pulse"></div>
          <div className="absolute bottom-10 w-56 h-8 bg-black/80 rounded-[100%] filter blur-md"></div>

          {/* Dish Image Rotatable */}
          <div 
            className="relative w-64 h-64 rounded-full overflow-hidden border-4 border-brand-gold/40 shadow-[0_20px_50px_rgba(255,179,0,0.3)] transition-transform duration-700 ease-out cursor-grab active:cursor-grabbing"
            style={{ transform: `rotate(${rotation}deg) scale(${isTableProjection ? 1.1 : 1})` }}
          >
            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
          </div>

          {/* AR Projection badge */}
          <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-[8px] font-black uppercase text-brand-gold tracking-widest border border-brand-gold/30">
            {isTableProjection ? 'Projection Table Activée' : 'Vue 360° Studio'}
          </div>
        </div>

        {/* Controls */}
        <div className="p-8 space-y-6">
          <div className="flex justify-center gap-3">
            <button 
              onClick={handleRotate}
              className="px-5 py-3 bg-white/10 rounded-2xl text-[10px] font-black uppercase italic tracking-wider flex items-center gap-2 hover:bg-white/20 active:scale-95 transition-all"
            >
              <RotateCw size={14} className="text-brand-gold" /> Tourner (90°)
            </button>

            <button 
              onClick={() => { playSound('pop'); setIsTableProjection(!isTableProjection); }}
              className={`px-5 py-3 rounded-2xl text-[10px] font-black uppercase italic tracking-wider flex items-center gap-2 transition-all ${
                isTableProjection ? 'bg-brand-gold text-brand-brown font-black shadow-lg' : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <Layers size={14} /> Mode Sur Ma Table
            </button>
          </div>

          <div className="text-center">
            <h4 className="text-xl font-black italic uppercase text-brand-gold">{item.name}</h4>
            <p className="text-2xl font-black text-white mt-1">{item.price} F CFA</p>
          </div>

          <button 
            onClick={handleAdd}
            className="w-full bg-brand-orange text-white py-5 rounded-2xl font-black uppercase italic shadow-[0_15px_40px_rgba(255,111,0,0.4)] flex items-center justify-center gap-3 active:scale-95 transition-all text-xs tracking-wider"
          >
            <ShoppingBag size={18} /> Valider & Ajouter au Panier
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dish3DModal;
