
import React from 'react';
import { MenuItem } from '../types';
import { Plus, X, ArrowRight, Sparkles } from 'lucide-react';

interface UpsellModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (item: MenuItem) => void;
  onProceed: () => void;
  suggestions: MenuItem[];
}

const UpsellModal: React.FC<UpsellModalProps> = ({ isOpen, onClose, onAdd, onProceed, suggestions }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl animate-fade-in">
      <div className="bg-white rounded-[3.5rem] shadow-[0_20px_80px_rgba(0,0,0,0.6)] w-full max-w-sm overflow-hidden relative animate-slide-up border-4 border-white">
        
        <div className="bg-brand-brown p-10 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/food.png')] opacity-10"></div>
          
          <button onClick={onClose} className="absolute top-6 right-6 text-white/40 hover:text-white bg-white/5 rounded-full p-2 transition-colors">
            <X size={20} />
          </button>
          
          <div className="relative inline-block mb-6">
             <div className="text-7xl animate-wave origin-center filter drop-shadow-2xl">🤩</div>
             <div className="absolute -top-2 -right-2 bg-brand-gold text-brand-brown w-9 h-9 rounded-full flex items-center justify-center shadow-lg border-4 border-white animate-pulse">
                <Sparkles size={16} />
             </div>
          </div>

          <h3 className="text-2xl font-black text-brand-gold leading-tight uppercase italic tracking-tighter mb-2">
            "Le Bonheur en Plus !"
          </h3>
          <p className="text-white/60 text-[10px] font-black uppercase tracking-[0.3em]">
             Un accompagnement ? 🍹
          </p>
        </div>

        <div className="p-8 space-y-5 bg-white max-h-[45vh] overflow-y-auto no-scrollbar">
          {suggestions.map((item) => (
            <div key={item.id} className="flex items-center gap-5 p-4 bg-gray-50 rounded-[2rem] border border-gray-100 group shadow-sm cursor-pointer active:scale-95" onClick={() => onAdd(item)}>
              <div className="relative flex-shrink-0">
                 <img src={item.image} alt={item.name} className="w-18 h-18 rounded-2xl object-cover shadow-md group-hover:scale-105 transition-transform duration-500" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-black text-[11px] text-brand-brown uppercase truncate mb-1">{item.name}</h4>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] text-white bg-brand-orange font-black px-3 py-1 rounded-xl shadow-md italic">+{item.price} F</span>
                </div>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); onAdd(item); }}
                className="bg-brand-brown text-brand-gold w-11 h-11 rounded-[1.2rem] flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:bg-brand-orange group-hover:text-white transition-all"
              >
                <Plus size={22} />
              </button>
            </div>
          ))}
        </div>

        <div className="p-8 pt-0 flex flex-col gap-4 bg-white">
          <button 
            onClick={onProceed}
            className="w-full bg-brand-orange text-white py-6 rounded-3xl font-black text-xs uppercase shadow-2xl flex items-center justify-center gap-3 active:scale-95 italic tracking-widest"
          >
            Passer à la Caisse <ArrowRight size={18} />
          </button>
          <button 
            onClick={onClose}
            className="w-full text-gray-400 py-2 font-black uppercase text-[8px] tracking-[0.3em]"
          >
            Non merci, je valide 🍽️
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpsellModal;
