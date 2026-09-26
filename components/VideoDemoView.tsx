import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Sparkles, ChefHat, Flame, Award, Clock, ArrowRight, ShieldCheck, Heart, Volume1, RefreshCw, Maximize, Music, Tv, CheckCircle2, Star } from 'lucide-react';
import { playSound } from '../utils/audio';

interface VideoDemoViewProps {
  onNavigateToMenu: () => void;
  onNavigateToTraiteur: () => void;
}

export interface VideoSlide {
  id: string;
  title: string;
  category: string;
  image: string;
  videoUrl?: string;
  durationSec: number;
  description: string;
  badge: string;
  chefQuote: string;
}

export const VIDEO_SLIDES: VideoSlide[] = [
  {
    id: 'slide-1',
    title: 'Grillades Suya & Dibi au Feu de Bois',
    category: 'Spécialité Grillades',
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=1200',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    durationSec: 12,
    description: 'Cuisson lente au charbon de bois naturel et assaisonnement exclusif avec notre piment Kankan authentique de Niamey.',
    badge: 'LEADER DU GOÛT',
    chefQuote: '« La viande est marinée 24h avant d’être saisie au feu de bois à haute température. »'
  },
  {
    id: 'slide-2',
    title: 'Préparation des Sauces Traditionnelles',
    category: 'Cuisine en Direct',
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=1200',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    durationSec: 10,
    description: 'Ingrédients frais du marché local de Niamey : arachide dorée, gombo frais et viande braisée juteuse.',
    badge: '100% NATUREL',
    chefQuote: '« Nos sauces mijotent pendant 3 heures pour révéler toute leur richesse aromatique. »'
  },
  {
    id: 'slide-3',
    title: 'Service Traiteur & Buffet Royal VIP',
    category: 'Événements & Mariages',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    durationSec: 14,
    description: 'Mise en place haut de gamme pour réceptions d’entreprise, mariages et fêtes de famille à Niamey.',
    badge: 'PRESTIGE VIP',
    chefQuote: '« Un dressage moderne qui allie l’élégance occidentale et l’authenticité africaine. »'
  },
  {
    id: 'slide-4',
    title: 'Dressage Tchep & Plats Signature',
    category: 'Spécialités Maison',
    image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=1200',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoypasses.mp4',
    durationSec: 12,
    description: 'Chaque assiette est dressée à la commande avec légumes croquants, bananes aloko dorées et riz parfumé.',
    badge: 'FAIT MAISON',
    chefQuote: '« La qualité d’un grand plat commence par le respect du produit brut. »'
  }
];

export const VideoDemoView: React.FC<VideoDemoViewProps> = ({ onNavigateToMenu, onNavigateToTraiteur }) => {
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [useNativeVideo, setUseNativeVideo] = useState(false);
  const [videoError, setVideoError] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<number | null>(null);

  const currentSlide = VIDEO_SLIDES[activeSlideIndex];

  // Speech Narration Helper
  const speakSlideNarration = (slideIndex: number) => {
    if (isMuted) return;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const slide = VIDEO_SLIDES[slideIndex];
        const textToSpeak = `${slide.title}. ${slide.description}`;
        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        utterance.lang = 'fr-FR';
        utterance.rate = 0.95;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        window.speechSynthesis.speak(utterance);
      } catch (e) {
        console.warn("Speech synthesis unavailable:", e);
      }
    }
  };

  const stopNarration = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }
  };

  // Auto-advance loop when playing in Interactive Reel Mode
  useEffect(() => {
    if (isPlaying && !useNativeVideo) {
      // Speak initial slide narration when playback starts
      speakSlideNarration(activeSlideIndex);

      timerRef.current = window.setInterval(() => {
        setCurrentTime(prev => {
          if (prev >= currentSlide.durationSec) {
            // Next slide
            const nextIndex = (activeSlideIndex + 1) % VIDEO_SLIDES.length;
            setActiveSlideIndex(nextIndex);
            speakSlideNarration(nextIndex);
            playSound('pop');
            return 0;
          }
          return prev + 0.1;
        });
      }, 100);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      stopNarration();
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      stopNarration();
    };
  }, [isPlaying, useNativeVideo, activeSlideIndex, isMuted]);

  // Handle Play/Pause
  const togglePlay = () => {
    playSound('pop');

    if (isPlaying) {
      setIsPlaying(false);
      stopNarration();
      if (videoRef.current) {
        videoRef.current.pause();
      }
    } else {
      setIsPlaying(true);
      if (useNativeVideo && videoRef.current && !videoError) {
        videoRef.current.muted = isMuted;
        videoRef.current.play()
          .then(() => setIsPlaying(true))
          .catch(() => {
            setVideoError(true);
            setUseNativeVideo(false);
            setIsPlaying(true);
          });
      } else {
        speakSlideNarration(activeSlideIndex);
      }
    }
  };

  // Switch Slide
  const handleSelectSlide = (index: number) => {
    playSound('pop');
    setActiveSlideIndex(index);
    setCurrentTime(0);
    setVideoError(false);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
    }
    if (isPlaying && !isMuted) {
      speakSlideNarration(index);
    }
  };

  // Toggle Sound FX & Speech
  const toggleMute = () => {
    playSound('pop');
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    if (newMuted) {
      stopNarration();
    } else if (isPlaying) {
      speakSlideNarration(activeSlideIndex);
    }
    if (videoRef.current) {
      videoRef.current.muted = newMuted;
    }
  };

  const progressPercent = (currentTime / currentSlide.durationSec) * 100;

  return (
    <div className="animate-fade-in p-4 sm:p-6 pb-36 max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <header className="flex justify-between items-center">
        <div>
          <span className="text-[9px] font-black uppercase text-brand-orange tracking-[0.3em] flex items-center gap-1.5 mb-1">
            <Sparkles size={14} className="animate-pulse" /> Démo Interactive Haute Définition
          </span>
          <h2 className="text-3xl font-black italic uppercase text-brand-brown leading-none">
            EXPÉRIENCE <span className="text-brand-orange">KHADY'S</span>
          </h2>
        </div>
        <div className="bg-brand-brown text-brand-gold px-3.5 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest border border-brand-gold/20 flex items-center gap-1 shadow-md">
          <Award size={12} /> Niamey Elite
        </div>
      </header>

      {/* Slide / Playlist Selector */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[9px] font-black uppercase tracking-widest text-brand-brown/70 flex items-center gap-1.5">
            <Tv size={14} className="text-brand-orange" /> Séquences de la Démo :
          </span>
          <span className="text-[8px] font-black uppercase tracking-wider text-brand-orange bg-brand-orange/10 px-2.5 py-1 rounded-full">
            {activeSlideIndex + 1} / {VIDEO_SLIDES.length}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {VIDEO_SLIDES.map((slide, idx) => (
            <button
              key={slide.id}
              onClick={() => handleSelectSlide(idx)}
              className={`p-3 rounded-2xl text-left border transition-all flex flex-col justify-between ${
                activeSlideIndex === idx
                  ? 'bg-brand-brown text-brand-gold border-brand-gold shadow-lg font-black scale-[1.02]'
                  : 'bg-white text-brand-brown border-gray-200 hover:bg-gray-50'
              }`}
            >
              <span className="text-[8px] font-black uppercase tracking-wider block opacity-70">
                {slide.category}
              </span>
              <span className="text-[10px] font-bold line-clamp-1 mt-1">
                {slide.title}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Audio Status & Voice Banner */}
      <div className="bg-brand-brown text-white p-3.5 rounded-2xl flex items-center justify-between border border-brand-gold/30 shadow-lg">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-brand-orange text-white flex items-center justify-center shrink-0">
            <Volume2 size={16} className={isPlaying && !isMuted ? "animate-pulse" : ""} />
          </div>
          <div>
            <span className="text-[9px] font-black uppercase text-brand-gold tracking-widest block">
              AUDIO & NARRATION VOCALE EN FRANÇAIS
            </span>
            <p className="text-[10px] text-white/80 font-medium">
              {isMuted ? "Audio actuellement en sourdine" : "Narration et effets sonores activés"}
            </p>
          </div>
        </div>

        <button
          onClick={toggleMute}
          className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
            isMuted
              ? "bg-brand-orange text-white hover:bg-orange-600"
              : "bg-white/10 text-brand-gold border border-brand-gold/40 hover:bg-white/20"
          }`}
        >
          {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
          {isMuted ? "Activer le Son" : "Sourdine"}
        </button>
      </div>

      {/* Main Video Showcase Frame */}
      <div className="relative rounded-[3rem] overflow-hidden shadow-2xl border-4 border-brand-brown/10 bg-black group">
        <div className="relative h-80 sm:h-96 w-full overflow-hidden bg-black flex items-center justify-center">
          
          {/* Background Visual (Image Reel / Video) */}
          {useNativeVideo && currentSlide.videoUrl && !videoError ? (
            <video
              key={currentSlide.videoUrl}
              ref={videoRef}
              src={currentSlide.videoUrl}
              poster={currentSlide.image}
              playsInline
              crossOrigin="anonymous"
              className="w-full h-full object-cover"
              onTimeUpdate={() => {
                if (videoRef.current) setCurrentTime(videoRef.current.currentTime);
              }}
              onError={() => {
                setVideoError(true);
                setUseNativeVideo(false);
              }}
              onEnded={() => {
                setIsPlaying(false);
              }}
            />
          ) : (
            <div className="relative w-full h-full overflow-hidden">
              <img
                src={currentSlide.image}
                alt={currentSlide.title}
                className={`w-full h-full object-cover transition-transform duration-1000 ${
                  isPlaying ? 'scale-110' : 'scale-100'
                }`}
              />
              
              {/* Flame Particles Animation during Play */}
              {isPlaying && (
                <div className="absolute inset-0 bg-gradient-to-t from-brand-orange/30 via-transparent to-black/40 pointer-events-none animate-pulse"></div>
              )}
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/40 pointer-events-none"></div>

          {/* Top Badges */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-20">
            <div className="bg-brand-orange text-white text-[8px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full shadow-lg border border-white/20 flex items-center gap-1.5">
              <Flame size={12} className="animate-bounce" /> {currentSlide.badge}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={toggleMute}
                className="bg-black/60 backdrop-blur-md text-white p-2 rounded-full border border-white/20 hover:bg-black transition-all"
                title={isMuted ? "Activer le son" : "Couper le son"}
              >
                {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} className="text-brand-gold animate-pulse" />}
              </button>
            </div>
          </div>

          {/* Playing Status Pill */}
          {isPlaying && (
            <div className="absolute top-16 left-4 bg-red-600 text-white px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5 animate-pulse shadow-lg z-20">
              <span className="w-2 h-2 rounded-full bg-white animate-ping"></span> EN LECTURE HD
            </div>
          )}

          {/* Center Big Play/Pause Button */}
          <button
            onClick={togglePlay}
            className="absolute inset-0 m-auto w-20 h-20 bg-brand-orange/95 hover:bg-brand-orange text-white rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(255,111,0,0.7)] backdrop-blur-md transition-all duration-300 hover:scale-110 active:scale-95 border-4 border-white z-30"
            title={isPlaying ? "Pause" : "Lancer la démonstration"}
          >
            {isPlaying ? (
              <Pause size={36} fill="white" />
            ) : (
              <Play size={36} fill="white" className="ml-1.5" />
            )}
          </button>

          {/* Bottom Info Overlay inside Video Frame */}
          <div className="absolute bottom-0 left-0 right-0 p-5 space-y-3 z-20">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[9px] font-black uppercase text-brand-gold tracking-widest block">
                  {currentSlide.category}
                </span>
                <h3 className="text-lg font-black italic uppercase text-white tracking-tight drop-shadow-md">
                  {currentSlide.title}
                </h3>
              </div>

              <div className="text-[10px] font-mono font-bold text-white/90 bg-black/60 px-3 py-1 rounded-xl border border-white/10">
                {Math.floor(currentTime)}s / {currentSlide.durationSec}s
              </div>
            </div>

            {/* Custom Progress Bar */}
            <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden backdrop-blur-md">
              <div
                className="bg-gradient-to-r from-brand-gold to-brand-orange h-full rounded-full transition-all duration-200"
                style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Description Banner below player */}
        <div className="bg-[#1A0F0D] p-5 sm:p-6 text-white space-y-3 border-t border-white/10">
          <p className="text-xs font-bold text-white/90 leading-relaxed italic">
            {currentSlide.chefQuote}
          </p>
          <p className="text-[11px] text-white/70 font-medium">
            {currentSlide.description}
          </p>
        </div>
      </div>

      {/* Chapters & Highlights */}
      <div className="bg-white p-6 sm:p-8 rounded-[3rem] shadow-xl border border-gray-100 space-y-4">
        <h3 className="font-black italic uppercase text-xs text-brand-brown tracking-wider flex items-center gap-2">
          <Clock size={16} className="text-brand-orange" /> Toutes les séquences vidéo
        </h3>

        <div className="space-y-3">
          {VIDEO_SLIDES.map((slide, idx) => (
            <div
              key={slide.id}
              onClick={() => handleSelectSlide(idx)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                activeSlideIndex === idx
                  ? 'bg-brand-brown text-white border-brand-brown shadow-lg'
                  : 'bg-gray-50 hover:bg-gray-100 text-brand-brown border-gray-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs ${
                  activeSlideIndex === idx ? 'bg-brand-orange text-white' : 'bg-gray-200 text-brand-brown'
                }`}>
                  0{idx + 1}
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase italic">{slide.title}</h4>
                  <p className={`text-[10px] font-medium line-clamp-1 ${activeSlideIndex === idx ? 'text-white/70' : 'text-gray-500'}`}>
                    {slide.category} • {slide.durationSec} secondes
                  </p>
                </div>
              </div>

              {activeSlideIndex === idx && (
                <span className="text-[8px] font-black uppercase tracking-wider text-brand-gold bg-brand-gold/20 px-2.5 py-1 rounded-full border border-brand-gold/30 shrink-0">
                  En Lecture
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Call to Action Buttons */}
      <div className="grid grid-cols-2 gap-4">
        <button 
          onClick={onNavigateToMenu}
          className="bg-brand-orange text-white p-6 rounded-[2.5rem] font-black uppercase italic shadow-xl flex flex-col justify-between h-32 active:scale-95 transition-all text-left hover:bg-orange-600"
        >
          <span className="text-[8px] tracking-widest text-white/80">COMMANDE EXPRESS</span>
          <span className="text-sm tracking-tight flex items-center justify-between">
            COMMANDER <ArrowRight size={18} />
          </span>
        </button>

        <button 
          onClick={onNavigateToTraiteur}
          className="bg-brand-brown text-brand-gold p-6 rounded-[2.5rem] font-black uppercase italic shadow-xl flex flex-col justify-between h-32 active:scale-95 transition-all text-left border-2 border-brand-gold/20 hover:bg-stone-900"
        >
          <span className="text-[8px] tracking-widest text-brand-gold/80">ÉVÉNEMENTS & MARIAGES</span>
          <span className="text-sm tracking-tight flex items-center justify-between">
            DEVIS TRAITEUR <ArrowRight size={18} />
          </span>
        </button>
      </div>
    </div>
  );
};

export default VideoDemoView;
