import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, X, Sparkles, Flame, ShieldCheck, Utensils, Award, RotateCcw, Tv, Film, Image as ImageIcon } from 'lucide-react';
import { playSound } from '../utils/audio';

interface VideoDemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateMenu: () => void;
}

// Fallback high-speed video URLs with guaranteed CORS accessibility
const RELIABLE_MP4_SOURCES = [
  {
    id: "v1",
    title: "Préparation & Grillades au Feu de Bois",
    url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
  },
  {
    id: "v2",
    title: "Savoir-Faire & Gastronomie Africaine",
    url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
  },
  {
    id: "v3",
    title: "Service Événementiel & Traiteur Niamey",
    url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
  },
];

// Embedded Food & Restaurant Showreel YouTube Videos (Nocookie)
const YOUTUBE_COOKING_VIDEOS = [
  {
    id: "yt1",
    title: "Recette Tiep Penda Mbaye - Chef Khady's Food",
    embedUrl: "https://www.youtube-nocookie.com/embed/5a22U7Xw22E?autoplay=1&mute=1&controls=1&rel=0",
  },
  {
    id: "yt2",
    title: "Art des Grillades & Suya au Sahel",
    embedUrl: "https://www.youtube-nocookie.com/embed/8yC37-G3W9E?autoplay=1&mute=1&controls=1&rel=0",
  },
];

const DISH_SHOWCASE = [
  {
    title: "TIEP ROYAL AU CAPITAINE",
    subtitle: "Riz rouge au poisson frais & légumes du fleuve Niger",
    image: "https://images.unsplash.com/photo-1627308595229-7830a5c91f9f?w=1000",
  },
  {
    title: "GIGA PLATEAU DE GRILLADES",
    subtitle: "Poulet braisé, dibiterie & aloco croustillant",
    image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=1000",
  },
  {
    title: "DAMBOU & TCHOUBALY D'ÉLITE",
    subtitle: "Spécialités traditionnelles mijotées par le Chef Khady",
    image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=1000",
  },
];

export const VideoDemoModal: React.FC<VideoDemoModalProps> = ({ isOpen, onClose, onNavigateMenu }) => {
  const [playerMode, setPlayerMode] = useState<'youtube' | 'mp4' | 'slideshow'>('youtube');
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [mp4Index, setMp4Index] = useState(0);
  const [ytIndex, setYtIndex] = useState(0);
  const [slideIndex, setSlideIndex] = useState(0);

  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (isOpen && playerMode === 'mp4' && videoRef.current) {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {
        setIsPlaying(false);
      });
    }
  }, [isOpen, playerMode, mp4Index]);

  // Diaporama automatique pour le mode 'slideshow'
  useEffect(() => {
    if (playerMode === 'slideshow') {
      const interval = setInterval(() => {
        setSlideIndex((prev) => (prev + 1) % DISH_SHOWCASE.length);
      }, 3500);
      return () => clearInterval(interval);
    }
  }, [playerMode]);

  if (!isOpen) return null;

  const togglePlay = () => {
    playSound('pop');
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play();
        setIsPlaying(true);
      }
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    playSound('pop');
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
    }
    setIsMuted(!isMuted);
  };

  const handleMp4Error = () => {
    console.warn("MP4 source failed, switching source or fallback");
    if (mp4Index < RELIABLE_MP4_SOURCES.length - 1) {
      setMp4Index((prev) => prev + 1);
    } else {
      setPlayerMode('youtube');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-2xl flex items-center justify-center p-3 sm:p-6 animate-fade-in">
      <div className="relative w-full max-w-4xl bg-[#1A0F0D] border-2 border-brand-gold/60 rounded-[2.5rem] sm:rounded-[3.5rem] overflow-hidden shadow-[0_0_90px_rgba(255,184,0,0.3)] flex flex-col my-auto max-h-[95vh]">
        
        {/* Header de la Modal */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-black/95 via-[#2A1710] to-[#1C0D08] flex items-center justify-between border-b border-brand-gold/30 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-brand-gold to-amber-500 rounded-2xl flex items-center justify-center text-brand-brown font-black shadow-lg">
              <Sparkles size={20} />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-black uppercase italic text-brand-gold tracking-tight">
                Khady's Food - Démo Vidéo Interactive
              </h3>
              <p className="text-[9px] sm:text-[10px] text-white/70 font-medium">Immersif 4K • Cuisine Sahélienne & Cloud Kitchen</p>
            </div>
          </div>

          <button
            onClick={() => { playSound('pop'); onClose(); }}
            className="w-10 h-10 bg-white/10 hover:bg-white/20 text-white rounded-2xl flex items-center justify-center transition-transform active:scale-90 border border-white/10 shrink-0"
            title="Fermer la vidéo"
          >
            <X size={20} />
          </button>
        </div>

        {/* Barre de sélection de la source vidéo (YouTube HD vs MP4 Direct vs Diaporama) */}
        <div className="bg-[#120A08] px-4 py-2.5 border-b border-white/10 flex items-center justify-between gap-2 overflow-x-auto no-scrollbar shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => { playSound('pop'); setPlayerMode('youtube'); }}
              className={`px-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase italic tracking-wider flex items-center gap-1.5 transition-all ${
                playerMode === 'youtube'
                  ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                  : 'bg-white/5 text-gray-400 hover:text-white border border-white/10'
              }`}
            >
              <Tv size={14} /> Stream YouTube
            </button>

            <button
              onClick={() => { playSound('pop'); setPlayerMode('mp4'); }}
              className={`px-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase italic tracking-wider flex items-center gap-1.5 transition-all ${
                playerMode === 'mp4'
                  ? 'bg-brand-gold text-brand-brown shadow-lg shadow-brand-gold/20'
                  : 'bg-white/5 text-gray-400 hover:text-white border border-white/10'
              }`}
            >
              <Film size={14} /> Lecteur MP4 HD
            </button>

            <button
              onClick={() => { playSound('pop'); setPlayerMode('slideshow'); }}
              className={`px-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase italic tracking-wider flex items-center gap-1.5 transition-all ${
                playerMode === 'slideshow'
                  ? 'bg-brand-orange text-white shadow-lg shadow-brand-orange/30'
                  : 'bg-white/5 text-gray-400 hover:text-white border border-white/10'
              }`}
            >
              <ImageIcon size={14} /> Showreel Photos
            </button>
          </div>

          <span className="text-[9px] font-mono text-brand-gold bg-black/60 px-2.5 py-1 rounded-full border border-brand-gold/30 shrink-0 hidden sm:inline-block">
            LIVE 1080p
          </span>
        </div>

        {/* Zone d'affichage du lecteur vidéo */}
        <div className="relative aspect-video w-full bg-black flex items-center justify-center overflow-hidden group">
          
          {/* MODE 1 : STREAM YOUTUBE INTEGRÉ */}
          {playerMode === 'youtube' && (
            <div className="w-full h-full relative">
              <iframe
                src={YOUTUBE_COOKING_VIDEOS[ytIndex].embedUrl}
                title={YOUTUBE_COOKING_VIDEOS[ytIndex].title}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              ></iframe>
            </div>
          )}

          {/* MODE 2 : LECTEUR MP4 HD NATIF */}
          {playerMode === 'mp4' && (
            <div className="relative w-full h-full flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                loop
                muted={isMuted}
                playsInline
                onError={handleMp4Error}
                src={RELIABLE_MP4_SOURCES[mp4Index].url}
                className="w-full h-full object-cover"
              />

              {/* Contrôles superposés MP4 */}
              <div className="absolute bottom-4 right-4 flex items-center gap-2 z-30">
                <button
                  onClick={togglePlay}
                  className="p-3 bg-black/80 hover:bg-black text-brand-gold rounded-2xl border border-brand-gold/30 backdrop-blur-md transition-all active:scale-90"
                  title={isPlaying ? "Pause" : "Lecture"}
                >
                  {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                </button>

                <button
                  onClick={toggleMute}
                  className="p-3 bg-black/80 hover:bg-black text-brand-gold rounded-2xl border border-brand-gold/30 backdrop-blur-md transition-all active:scale-90"
                  title={isMuted ? "Activer le son" : "Couper le son"}
                >
                  {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                </button>
              </div>
            </div>
          )}

          {/* MODE 3 : DIAPORAMA PHOTOS SHOWREEL */}
          {playerMode === 'slideshow' && (
            <div className="relative w-full h-full">
              {DISH_SHOWCASE.map((slide, idx) => (
                <div
                  key={idx}
                  className={`absolute inset-0 transition-opacity duration-1000 ${
                    idx === slideIndex ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
                  }`}
                >
                  <img
                    src={slide.image}
                    alt={slide.title}
                    className="w-full h-full object-cover animate-zoom-dezoom"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent"></div>
                  <div className="absolute bottom-12 left-6 right-6 space-y-1 text-white">
                    <span className="text-[9px] font-black uppercase text-brand-gold bg-brand-gold/20 border border-brand-gold/40 px-3 py-1 rounded-full italic">
                      Showreel Khady's Food Niamey
                    </span>
                    <h4 className="text-lg sm:text-2xl font-black italic uppercase text-white tracking-tight">
                      {slide.title}
                    </h4>
                    <p className="text-xs text-white/90 italic">{slide.subtitle}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Badge Live Overlay */}
          <div className="absolute top-4 left-4 z-20 pointer-events-none">
            <span className="bg-red-600/90 backdrop-blur-md text-white text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-lg flex items-center gap-1.5 border border-red-400">
              <span className="w-2 h-2 rounded-full bg-white animate-ping"></span> NIAMEY CLOUD KITCHEN
            </span>
          </div>
        </div>

        {/* Selector pour changer les sous-vidéos selon le mode */}
        {playerMode === 'youtube' && (
          <div className="px-4 py-2 bg-[#140C0A] border-t border-white/5 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
            {YOUTUBE_COOKING_VIDEOS.map((item, idx) => (
              <button
                key={item.id}
                onClick={() => { playSound('pop'); setYtIndex(idx); }}
                className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase italic whitespace-nowrap transition-all border ${
                  ytIndex === idx
                    ? 'bg-brand-gold text-brand-brown border-brand-gold'
                    : 'bg-white/5 text-gray-400 border-white/10 hover:text-white'
                }`}
              >
                {item.title}
              </button>
            ))}
          </div>
        )}

        {playerMode === 'mp4' && (
          <div className="px-4 py-2 bg-[#140C0A] border-t border-white/5 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
            {RELIABLE_MP4_SOURCES.map((item, idx) => (
              <button
                key={item.id}
                onClick={() => { playSound('pop'); setMp4Index(idx); }}
                className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase italic whitespace-nowrap transition-all border ${
                  mp4Index === idx
                    ? 'bg-brand-gold text-brand-brown border-brand-gold'
                    : 'bg-white/5 text-gray-400 border-white/10 hover:text-white'
                }`}
              >
                {item.title}
              </button>
            ))}
          </div>
        )}

        {/* Grille d'Engagements de Qualité */}
        <div className="p-4 sm:p-5 bg-[#1A0F0D] border-t border-white/10 grid grid-cols-3 gap-2 text-center shrink-0">
          <div className="p-2 sm:p-3 bg-white/5 rounded-2xl border border-white/5 flex flex-col items-center">
            <Utensils size={18} className="text-brand-gold mb-1" />
            <span className="text-[9px] font-black uppercase text-white">100% Frais & Bio</span>
            <span className="text-[7px] text-gray-400 font-bold">Produits du Sahel</span>
          </div>
          <div className="p-2 sm:p-3 bg-white/5 rounded-2xl border border-white/5 flex flex-col items-center">
            <Award size={18} className="text-brand-orange mb-1" />
            <span className="text-[9px] font-black uppercase text-white">Chef Khady</span>
            <span className="text-[7px] text-gray-400 font-bold">Gastronomie Élite</span>
          </div>
          <div className="p-2 sm:p-3 bg-white/5 rounded-2xl border border-white/5 flex flex-col items-center">
            <ShieldCheck size={18} className="text-emerald-400 mb-1" />
            <span className="text-[9px] font-black uppercase text-white">Livraison Fast</span>
            <span className="text-[7px] text-gray-400 font-bold">Billo Express</span>
          </div>
        </div>

        {/* Footer Action */}
        <div className="p-4 sm:p-5 bg-black/60 flex justify-between items-center border-t border-white/10 shrink-0">
          <span className="text-[9px] sm:text-[10px] font-black text-brand-gold/80 uppercase italic tracking-wider">
            Savourer ces spécialités en direct
          </span>
          <button
            onClick={() => {
              playSound('pop');
              onClose();
              onNavigateMenu();
            }}
            className="px-6 py-3 bg-gradient-to-r from-brand-orange to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white rounded-2xl font-black uppercase italic text-xs tracking-wider shadow-lg active:scale-95 transition-all"
          >
            Commander au Menu →
          </button>
        </div>

      </div>
    </div>
  );
};


