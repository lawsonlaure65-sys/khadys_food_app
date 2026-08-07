import React, { useState } from 'react';
import { Play, Pause, Volume2, VolumeX, X, Sparkles, Flame, ShieldCheck, Utensils, Award } from 'lucide-react';
import { playSound } from '../utils/audio';
import { LOGO_VIDEO_URL } from '../constants';

interface VideoDemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateMenu: () => void;
}

export const VideoDemoModal: React.FC<VideoDemoModalProps> = ({ isOpen, onClose, onNavigateMenu }) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 animate-fade-in">
      <div className="relative w-full max-w-3xl bg-[#1A0F0D] border-2 border-brand-gold/40 rounded-[3.5rem] overflow-hidden shadow-[0_0_80px_rgba(255,184,0,0.25)] flex flex-col">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-black/80 to-brand-brown/80 flex items-center justify-between border-b border-white/10 relative z-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-gold rounded-2xl flex items-center justify-center text-brand-brown font-black shadow-lg">
              <Sparkles size={20} />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase italic text-brand-gold tracking-tight">
                Khady's Food - Démo Restaurant Africain
              </h3>
              <p className="text-[9px] text-white/60 font-medium">Immersif 4K Cloud Kitchen & Gastronomie Sahélienne</p>
            </div>
          </div>
          <button
            onClick={() => { playSound('pop'); onClose(); }}
            className="w-10 h-10 bg-white/10 hover:bg-white/20 text-white rounded-2xl flex items-center justify-center transition-transform active:scale-90"
          >
            <X size={20} />
          </button>
        </div>

        {/* Video Player Container */}
        <div className="relative aspect-video w-full bg-black flex items-center justify-center overflow-hidden group">
          {/* Simulated HD African Cuisine Showreel Video stream */}
          <video
            autoPlay
            loop
            muted={isMuted}
            playsInline
            src={LOGO_VIDEO_URL}
            className="w-full h-full object-cover"
          />

          {/* Video Overlay Info */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none flex flex-col justify-between p-6">
            <div className="flex justify-between items-center">
              <span className="bg-red-600 text-white text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-lg animate-pulse flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-white"></span> DIRECT NIAMEY CLOUD KITCHEN
              </span>
              <span className="text-[9px] font-mono text-brand-gold bg-black/60 px-3 py-1 rounded-full border border-brand-gold/30">
                HD 1080p 60FPS
              </span>
            </div>

            <div className="space-y-1">
              <span className="text-[9px] font-black uppercase tracking-widest text-brand-gold flex items-center gap-1">
                <Flame size={12} className="text-brand-orange" /> Recettes Authentiques du Sahel
              </span>
              <h4 className="text-lg sm:text-2xl font-black italic text-white uppercase tracking-tight">
                Tchoubaly, Dambou & Box Sauces Khady's
              </h4>
            </div>
          </div>

          {/* Video Controls overlay */}
          <div className="absolute bottom-4 right-4 flex items-center gap-2 z-30">
            <button
              onClick={() => { playSound('pop'); setIsMuted(!isMuted); }}
              className="p-3 bg-black/70 hover:bg-black text-brand-gold rounded-2xl border border-white/20 backdrop-blur-md transition-all active:scale-90"
              title={isMuted ? "Activer le son" : "Couper le son"}
            >
              {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
          </div>
        </div>

        {/* Highlights Grid */}
        <div className="p-6 bg-[#1A0F0D] border-t border-white/10 grid grid-cols-3 gap-3 text-center">
          <div className="p-3 bg-white/5 rounded-2xl border border-white/5 flex flex-col items-center">
            <Utensils size={18} className="text-brand-gold mb-1" />
            <span className="text-[9px] font-black uppercase text-white">100% Frais & Bio</span>
            <span className="text-[7px] text-gray-400 font-bold">Produits du Niger</span>
          </div>
          <div className="p-3 bg-white/5 rounded-2xl border border-white/5 flex flex-col items-center">
            <Award size={18} className="text-brand-orange mb-1" />
            <span className="text-[9px] font-black uppercase text-white">Chef Khady</span>
            <span className="text-[7px] text-gray-400 font-bold">Gastronomie Élite</span>
          </div>
          <div className="p-3 bg-white/5 rounded-2xl border border-white/5 flex flex-col items-center">
            <ShieldCheck size={18} className="text-green-400 mb-1" />
            <span className="text-[9px] font-black uppercase text-white">Livraison Fast</span>
            <span className="text-[7px] text-gray-400 font-bold">Billo Express</span>
          </div>
        </div>

        {/* Footer Action */}
        <div className="p-6 bg-black/40 flex justify-between items-center border-t border-white/5">
          <span className="text-[9px] font-bold text-white/50 uppercase tracking-widest">
            Prêt à savourer ?
          </span>
          <button
            onClick={() => {
              playSound('pop');
              onClose();
              onNavigateMenu();
            }}
            className="px-6 py-3 bg-brand-orange hover:bg-brand-orange/90 text-white rounded-2xl font-black uppercase italic text-xs tracking-wider shadow-lg active:scale-95 transition-all"
          >
            Découvrir la Carte →
          </button>
        </div>
      </div>
    </div>
  );
};
