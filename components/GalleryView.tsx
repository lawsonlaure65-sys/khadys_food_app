import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { MenuItem } from '../types';
import { 
  Sparkles, ShoppingBag, Eye, X, ChevronLeft, ChevronRight, 
  Heart, ArrowRight, Share2, Check, Smartphone, Play, Pause, 
  Maximize2, Zap, Flame, Clock, Award, Layers, Volume2
} from 'lucide-react';
import { playSound } from '../utils/audio';

interface GalleryViewProps {
  items: MenuItem[];
  onAddToCart: (item: MenuItem, quantity: number, instructions: string) => void;
  onNavigateToMenu: () => void;
}

export const GALLERY_IMAGES = [
  {
    id: 'g1',
    title: 'Tiep Royal Khady',
    category: 'Spécialités',
    image: 'https://images.unsplash.com/photo-1627308595229-7830a5c91f9f?w=1200',
    description: 'Le chef-d\'œuvre Khady\'s avec son capitaine braisé aux aromates du Niger, riz rouge mijoté et légumes fondants.',
    price: 5500,
    likes: 142
  },
  {
    id: 'g2',
    title: 'Plateau Prestige Event',
    category: 'Traiteur',
    image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=1200',
    description: 'Giga assortiment royal de brochettes Suya, pastels dorés, alloco croustillant et ailes de poulet fermier braisées.',
    price: 15000,
    likes: 289
  },
  {
    id: 'g3',
    title: 'Soupou Kandia aux Crabes & Crevettes',
    category: 'Plats',
    image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=1200',
    description: 'Ragoût traditionnel d\'okra mijoté à l\'huile de palme rouge fine du Sahel, poisson fumé et crustacés frais.',
    price: 5000,
    likes: 98
  },
  {
    id: 'g4',
    title: 'Bissap Rouge & Bouye Onctueux',
    category: 'Boissons Naturelles',
    image: 'https://images.unsplash.com/photo-1556881286-fc6915169721?w=1200',
    description: 'Nectars naturels préparés chaque matin avec des calices d\'hibiscus sauvage du Sahel et pulpe de baobab.',
    price: 1000,
    likes: 310
  },
  {
    id: 'g5',
    title: 'Pastels Dorés Piquants',
    category: 'Entrées',
    image: 'https://images.unsplash.com/photo-1601050638917-3f80bc61a4bb?w=1200',
    description: 'Petits chaussons ultra-croustillants farcis au thon et herbes fraîches, accompagnés de leur sauce pimentée maison.',
    price: 1500,
    likes: 215
  },
  {
    id: 'g6',
    title: 'Brochettes Suya Kankankan',
    category: 'Spécialités',
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=1200',
    description: 'Filet de bœuf tendre mariné au mélange secret d\'épices Kankankan et grillé à la flamme au feu de bois.',
    price: 4000,
    likes: 178
  },
  {
    id: 'g7',
    title: 'Buffet d\'Exception Khady\'s',
    category: 'Traiteur',
    image: 'https://images.unsplash.com/photo-1555244162-803834f70033?w=1200',
    description: 'Mise en scène gastronomique élégante pour vos mariages, réceptions d\'entreprises et banquets VIP à Niamey.',
    price: 180000,
    likes: 412
  },
  {
    id: 'g8',
    title: 'Dambou du Jour au Moringa',
    category: 'Plats',
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=1200',
    description: 'Couscous traditionnel de feuilles de moringa frais parfumé à l\'huile d\'arachide et graines d\'arachides pilées.',
    price: 2500,
    likes: 165
  }
];

export const GalleryView: React.FC<GalleryViewProps> = ({ items, onAddToCart, onNavigateToMenu }) => {
  const [activeCategory, setActiveCategory] = useState<string>('TOUT');
  const [selectedPhoto, setSelectedPhoto] = useState<typeof GALLERY_IMAGES[0] | null>(null);
  const [likedPhotos, setLikedPhotos] = useState<Record<string, boolean>>({});

  // Mode Portrait / Diaporama Fullscreen State
  const [isPortraitMode, setIsPortraitMode] = useState<boolean>(false);
  const [portraitIndex, setPortraitIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [slideProgress, setSlideProgress] = useState<number>(0);
  const [slideDuration, setSlideDuration] = useState<number>(5000); // 5 seconds per slide
  const [isHoldingPause, setIsHoldingPause] = useState<boolean>(false);
  const [showThumbnails, setShowThumbnails] = useState<boolean>(true);
  const [shareToast, setShareToast] = useState<string | null>(null);
  const [addedDishId, setAddedDishId] = useState<string | null>(null);

  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const progressTimerRef = useRef<number | null>(null);

  // Map dynamic menu items into gallery photos
  const dynamicPhotos = useMemo(() => {
    const existingIds = new Set(GALLERY_IMAGES.map(g => g.id));
    const convertedItems = items
      .filter(item => item.image)
      .map(item => ({
        id: item.id,
        title: item.name,
        category: (item.category || 'Plats') as string,
        image: item.image,
        description: item.description || 'Spécialité cuisinée avec des ingrédients frais du marché de Niamey.',
        price: item.price,
        likes: Math.floor((item.rating || 5) * 35) + 50
      }));

    const uniqueConverted = convertedItems.filter(item => !existingIds.has(item.id));
    return [...uniqueConverted, ...GALLERY_IMAGES];
  }, [items]);

  // Extract unique categories dynamically
  const categories = useMemo(() => {
    const set = new Set<string>(['TOUT']);
    dynamicPhotos.forEach(p => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [dynamicPhotos]);

  const filteredPhotos = useMemo(() => {
    return activeCategory === 'TOUT' 
      ? dynamicPhotos 
      : dynamicPhotos.filter(p => p.category === activeCategory);
  }, [activeCategory, dynamicPhotos]);

  const activePortraitPhoto = filteredPhotos[portraitIndex] || filteredPhotos[0];

  // Navigation handlers
  const handleNextSlide = useCallback(() => {
    playSound('pop');
    setSlideProgress(0);
    setPortraitIndex(prev => (prev + 1) % filteredPhotos.length);
  }, [filteredPhotos.length]);

  const handlePrevSlide = useCallback(() => {
    playSound('pop');
    setSlideProgress(0);
    setPortraitIndex(prev => (prev - 1 + filteredPhotos.length) % filteredPhotos.length);
  }, [filteredPhotos.length]);

  const openPortraitMode = (index = 0) => {
    playSound('pop');
    setPortraitIndex(Math.min(index, filteredPhotos.length - 1));
    setSlideProgress(0);
    setIsPlaying(true);
    setIsPortraitMode(true);
    setSelectedPhoto(null);
  };

  const closePortraitMode = () => {
    playSound('pop');
    setIsPortraitMode(false);
    setSlideProgress(0);
  };

  // Diaporama progress interval loop
  useEffect(() => {
    if (!isPortraitMode || !isPlaying || isHoldingPause) {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
      return;
    }

    const intervalStep = 50; // Update progress every 50ms
    const progressIncrement = (intervalStep / slideDuration) * 100;

    progressTimerRef.current = window.setInterval(() => {
      setSlideProgress(prev => {
        if (prev >= 100) {
          handleNextSlide();
          return 0;
        }
        return prev + progressIncrement;
      });
    }, intervalStep);

    return () => {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    };
  }, [isPortraitMode, isPlaying, isHoldingPause, slideDuration, handleNextSlide]);

  // Keyboard navigation for portrait slideshow
  useEffect(() => {
    if (!isPortraitMode) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        handleNextSlide();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        handlePrevSlide();
      } else if (e.key === ' ') {
        e.preventDefault();
        setIsPlaying(prev => !prev);
        playSound('pop');
      } else if (e.key === 'Escape') {
        closePortraitMode();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPortraitMode, handleNextSlide, handlePrevSlide]);

  // Touch Swipe Handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    setIsHoldingPause(true);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    setIsHoldingPause(false);
    if (touchStartX.current === null || touchStartY.current === null) return;

    const diffX = touchStartX.current - e.changedTouches[0].clientX;
    const diffY = touchStartY.current - e.changedTouches[0].clientY;

    // Horizontal swipe detection (> 45px)
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 45) {
      if (diffX > 0) {
        handleNextSlide(); // Swiped left -> next
      } else {
        handlePrevSlide(); // Swiped right -> prev
      }
    } else if (diffY < -90) {
      // Swiped down heavily -> close
      closePortraitMode();
    }

    touchStartX.current = null;
    touchStartY.current = null;
  };

  const toggleLike = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    playSound('pop');
    setLikedPhotos(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleOrderPhotoDish = (photo: typeof GALLERY_IMAGES[0]) => {
    playSound('success');
    setAddedDishId(photo.id);
    setTimeout(() => setAddedDishId(null), 2000);

    const match = items.find(i => i.id === photo.id) || 
      items.find(i => i.name.toLowerCase().includes(photo.title.toLowerCase().substring(0, 5))) || {
      id: photo.id,
      name: photo.title,
      description: photo.description,
      price: photo.price,
      image: photo.image,
      category: photo.category as any,
      rating: 5,
      isAvailable: true
    };

    onAddToCart(match, 1, 'Commande directe depuis le Mode Portrait HD');
    if (selectedPhoto) setSelectedPhoto(null);
  };

  const handleSharePhoto = async (photo: typeof GALLERY_IMAGES[0], e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    playSound('pop');
    const shareText = `🔥 Découvrez le plat gourmand "${photo.title}" chez Khady's Food & Event Niamey ! (${photo.price.toLocaleString('fr-FR')} F CFA)\n👉 Commandez dès maintenant en ligne sur notre app !`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: photo.title,
          text: shareText,
          url: window.location.href,
        });
      } catch {
        // Fallback to clipboard
        await navigator.clipboard.writeText(shareText);
        setShareToast('Lien et description copiés dans le presse-papier !');
        setTimeout(() => setShareToast(null), 3000);
      }
    } else {
      await navigator.clipboard.writeText(shareText);
      setShareToast('Lien et description copiés dans le presse-papier !');
      setTimeout(() => setShareToast(null), 3000);
    }
  };

  return (
    <div className="animate-fade-in p-4 sm:p-6 pb-36 max-w-2xl mx-auto">
      {/* Toast Notification */}
      {shareToast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[250] bg-brand-gold text-brand-brown px-5 py-3 rounded-2xl shadow-2xl font-black text-xs flex items-center gap-2 border-2 border-white animate-scale-up">
          <Check size={16} /> {shareToast}
        </div>
      )}

      {/* Header */}
      <header className="mb-6 space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <span className="text-[9px] font-black uppercase text-brand-orange tracking-[0.3em] flex items-center gap-1.5 mb-1">
              <Sparkles size={14} className="animate-pulse" /> Galerie Haute Définition
            </span>
            <h2 className="text-3xl font-black italic uppercase text-brand-brown leading-none">
              NOS <span className="text-brand-orange">CHEF-D'ŒUVRES</span>
            </h2>
          </div>
          <button 
            onClick={onNavigateToMenu}
            className="px-4 py-2.5 bg-brand-brown text-brand-gold rounded-2xl text-[9px] font-black uppercase tracking-wider flex items-center gap-2 active:scale-95 transition-all shadow-md hover:bg-black"
          >
            Menu complet <ArrowRight size={14} />
          </button>
        </div>

        {/* Action Hero Bar: Mode Portrait Button */}
        <div className="bg-gradient-to-r from-brand-brown via-[#221310] to-[#1A0F0D] p-4 rounded-[2.2rem] border-2 border-brand-gold/30 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3 relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 text-brand-gold/10 pointer-events-none">
            <Smartphone size={110} />
          </div>

          <div className="flex items-center gap-3 relative z-10">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-brand-orange to-amber-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-brand-orange/30 animate-pulse">
              <Smartphone size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase text-white tracking-wider">
                  Expérience Plein Écran
                </span>
                <span className="bg-brand-gold text-brand-brown text-[8px] font-black px-2 py-0.5 rounded-full uppercase">
                  Diaporama HD
                </span>
              </div>
              <p className="text-[10px] text-white/70 font-medium">
                Défilement automatique format Stories & Reels
              </p>
            </div>
          </div>

          <button
            onClick={() => openPortraitMode(0)}
            className="w-full sm:w-auto relative z-10 bg-gradient-to-r from-brand-gold via-amber-400 to-brand-orange hover:from-amber-300 hover:to-orange-500 text-brand-brown px-6 py-3.5 rounded-2xl font-black text-xs uppercase italic tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-brand-gold/20 active:scale-95 transition-all group"
          >
            <Play size={15} className="fill-brand-brown group-hover:scale-110 transition-transform" />
            <span>Lancer le Mode Portrait</span>
          </button>
        </div>
      </header>

      {/* Categories Filter */}
      <div className="flex gap-2 overflow-x-auto pb-4 mb-6 no-scrollbar">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => { playSound('pop'); setActiveCategory(cat); }}
            className={`px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-wider whitespace-nowrap transition-all ${
              activeCategory === cat 
                ? 'bg-brand-orange text-white shadow-lg shadow-brand-orange/20 scale-105' 
                : 'bg-white text-brand-brown/60 hover:bg-gray-50 border border-gray-100 shadow-sm'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid Photos */}
      <div className="grid grid-cols-2 gap-4">
        {filteredPhotos.map((photo, index) => {
          const isLiked = !!likedPhotos[photo.id];
          return (
            <div 
              key={photo.id}
              onClick={() => { playSound('pop'); setSelectedPhoto(photo); }}
              className="group relative h-64 rounded-[2.5rem] overflow-hidden shadow-lg border-2 border-white/80 cursor-pointer transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl bg-black"
            >
              <img 
                src={photo.image} 
                alt={photo.title} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent"></div>

              {/* Top Badges */}
              <div className="absolute top-3 left-3 flex items-center gap-1.5">
                <span className="bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full text-white text-[7px] font-black uppercase tracking-widest border border-white/20">
                  {photo.category}
                </span>
              </div>

              {/* Direct Fullscreen Portrait Trigger on Each Card */}
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  openPortraitMode(index);
                }}
                title="Ouvrir en Mode Portrait"
                className="absolute top-3 right-12 w-8 h-8 rounded-full bg-brand-gold/90 text-brand-brown hover:bg-brand-gold backdrop-blur-md flex items-center justify-center transition-all shadow-md active:scale-90"
              >
                <Smartphone size={14} />
              </button>

              {/* Like Button */}
              <button 
                onClick={(e) => toggleLike(photo.id, e)}
                className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                  isLiked ? 'bg-red-500 text-white shadow-lg' : 'bg-black/40 backdrop-blur-md text-white/80 hover:bg-black/60'
                }`}
              >
                <Heart size={14} fill={isLiked ? 'currentColor' : 'none'} />
              </button>

              {/* Bottom Info */}
              <div className="absolute bottom-4 left-4 right-4 text-white">
                <h3 className="font-black text-xs italic uppercase tracking-tight text-white leading-tight mb-1.5 group-hover:text-brand-gold transition-colors line-clamp-1">
                  {photo.title}
                </h3>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-mono font-black text-brand-gold bg-black/50 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10">
                    {photo.price.toLocaleString('fr-FR')} F
                  </span>
                  <span className="text-[8px] font-black text-white/80 flex items-center gap-1 bg-white/10 backdrop-blur-md px-2 py-1 rounded-lg">
                    <Eye size={12} /> Vue HD
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* 📱 MODE PORTRAIT / DIAPORAMA PLEIN ÉCRAN (STORIES & REELS IMMERSIF) */}
      {/* ========================================================================= */}
      {isPortraitMode && activePortraitPhoto && (
        <div 
          className="fixed inset-0 z-[200] bg-black text-white flex flex-col justify-between overflow-hidden select-none animate-fade-in"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onMouseDown={() => setIsHoldingPause(true)}
          onMouseUp={() => setIsHoldingPause(false)}
        >
          {/* Ambient Blurred Background */}
          <div 
            className="absolute inset-0 bg-cover bg-center filter blur-3xl opacity-35 scale-125 transform transition-all duration-700 pointer-events-none"
            style={{ backgroundImage: `url(${activePortraitPhoto.image})` }}
          />

          {/* Central 9:16 Portrait Canvas (Mobile Native & Desktop Framed) */}
          <div className="relative w-full h-full max-w-md mx-auto flex flex-col justify-between overflow-hidden shadow-2xl bg-[#120B09]">
            
            {/* Background Main Dish Image */}
            <div className="absolute inset-0 z-0">
              <img 
                key={activePortraitPhoto.id}
                src={activePortraitPhoto.image} 
                alt={activePortraitPhoto.title}
                className="w-full h-full object-cover transition-transform duration-1000 ease-out scale-100"
              />
              {/* Top & Bottom Cinematic Gradient Shadows */}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-black/70 pointer-events-none" />
            </div>

            {/* Tap Navigation Zones (Left 30% = Prev, Right 30% = Next) */}
            <div 
              onClick={(e) => { e.stopPropagation(); handlePrevSlide(); }}
              className="absolute left-0 top-24 bottom-48 w-1/3 z-10 cursor-w-resize"
              title="Précédent"
            />
            <div 
              onClick={(e) => { e.stopPropagation(); handleNextSlide(); }}
              className="absolute right-0 top-24 bottom-48 w-1/3 z-10 cursor-e-resize"
              title="Suivant"
            />

            {/* ================= TOP HEADER & PROGRESS BARS ================= */}
            <div className="relative z-30 p-4 pt-5 space-y-3">
              
              {/* Segmented Progress Bars (Instagram Stories Style) */}
              <div className="flex items-center gap-1.5 w-full">
                {filteredPhotos.map((photo, idx) => {
                  let fillPercent = 0;
                  if (idx < portraitIndex) fillPercent = 100;
                  else if (idx === portraitIndex) fillPercent = slideProgress;

                  return (
                    <div 
                      key={photo.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        playSound('pop');
                        setPortraitIndex(idx);
                        setSlideProgress(0);
                      }}
                      className="flex-1 h-1.5 rounded-full bg-white/25 overflow-hidden cursor-pointer backdrop-blur-md"
                    >
                      <div 
                        className="h-full bg-gradient-to-r from-brand-orange to-brand-gold transition-all duration-75 ease-linear rounded-full"
                        style={{ width: `${fillPercent}%` }}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Controls Bar */}
              <div className="flex items-center justify-between bg-black/40 backdrop-blur-xl px-4 py-2.5 rounded-2xl border border-white/10 shadow-lg">
                
                {/* Left: Chef Avatar & Counter */}
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-brand-gold/20 border border-brand-gold flex items-center justify-center text-brand-gold font-black text-xs shadow-sm">
                    👩‍🍳
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase text-white tracking-wider block">
                      Khady's Galerie
                    </span>
                    <span className="text-[8px] font-mono text-brand-gold/90 font-bold block">
                      {portraitIndex + 1} sur {filteredPhotos.length}
                    </span>
                  </div>
                </div>

                {/* Right Actions: Speed, Play/Pause, Close */}
                <div className="flex items-center gap-2">
                  
                  {/* Speed Selector */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      playSound('pop');
                      const speeds = [3000, 5000, 8000];
                      const nextSpeed = speeds[(speeds.indexOf(slideDuration) + 1) % speeds.length];
                      setSlideDuration(nextSpeed);
                    }}
                    title="Vitesse du diaporama"
                    className="px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-brand-gold text-[9px] font-black flex items-center gap-1 border border-white/10 transition-all"
                  >
                    <Zap size={11} /> {slideDuration / 1000}s
                  </button>

                  {/* Play / Pause Toggle */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      playSound('pop');
                      setIsPlaying(prev => !prev);
                    }}
                    title={isPlaying ? "Mettre en pause" : "Lancer le diaporama"}
                    className={`w-8 h-8 rounded-xl flex items-center justify-center text-white transition-all ${
                      isPlaying ? 'bg-white/10 hover:bg-white/20' : 'bg-brand-orange text-white shadow-md'
                    }`}
                  >
                    {isPlaying ? <Pause size={14} /> : <Play size={14} className="fill-white" />}
                  </button>

                  {/* Close Fullscreen */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      closePortraitMode();
                    }}
                    title="Fermer le mode portrait"
                    className="w-8 h-8 rounded-xl bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-all"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Quick Pause Indicator overlay when holding */}
              {isHoldingPause && (
                <div className="text-center animate-fade-in">
                  <span className="bg-black/70 backdrop-blur-md text-white/90 text-[9px] font-black uppercase px-3 py-1 rounded-full border border-white/10">
                    ⏸️ Diaporama en Pause
                  </span>
                </div>
              )}
            </div>

            {/* Navigation Side Arrows (Desktop & Clickable) */}
            <button
              onClick={(e) => { e.stopPropagation(); handlePrevSlide(); }}
              className="absolute left-3 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-md border border-white/20 flex items-center justify-center shadow-xl active:scale-90 transition-all"
            >
              <ChevronLeft size={22} />
            </button>

            <button
              onClick={(e) => { e.stopPropagation(); handleNextSlide(); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-md border border-white/20 flex items-center justify-center shadow-xl active:scale-90 transition-all"
            >
              <ChevronRight size={22} />
            </button>

            {/* ================= BOTTOM INTERACTIVE CARD ================= */}
            <div className="relative z-30 p-4 space-y-3">
              
              {/* Glassmorphism Dish Details Card */}
              <div className="bg-black/75 backdrop-blur-2xl p-5 rounded-[2.5rem] border-2 border-white/15 shadow-2xl space-y-3">
                
                {/* Header Tag & Price */}
                <div className="flex items-center justify-between">
                  <span className="bg-brand-orange text-white text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-md flex items-center gap-1">
                    <Flame size={12} /> {activePortraitPhoto.category}
                  </span>
                  
                  <span className="text-xl font-black font-mono text-brand-gold bg-white/10 px-3.5 py-1 rounded-2xl border border-brand-gold/30 shadow-inner">
                    {activePortraitPhoto.price.toLocaleString('fr-FR')} F CFA
                  </span>
                </div>

                {/* Dish Title */}
                <div>
                  <h3 className="text-xl font-black italic uppercase text-white tracking-tight leading-tight drop-shadow-md">
                    {activePortraitPhoto.title}
                  </h3>
                  <p className="text-[11px] text-white/80 font-medium leading-snug mt-1 line-clamp-2">
                    {activePortraitPhoto.description}
                  </p>
                </div>

                {/* Action Buttons Row */}
                <div className="flex items-center gap-2 pt-1">
                  
                  {/* Primary Order Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOrderPhotoDish(activePortraitPhoto);
                    }}
                    className={`flex-1 py-3.5 px-4 rounded-2xl font-black uppercase text-xs italic tracking-wider flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-all ${
                      addedDishId === activePortraitPhoto.id
                        ? 'bg-emerald-500 text-white'
                        : 'bg-gradient-to-r from-brand-orange via-amber-500 to-brand-orange text-white shadow-brand-orange/40 hover:brightness-110'
                    }`}
                  >
                    {addedDishId === activePortraitPhoto.id ? (
                      <>
                        <Check size={16} className="animate-bounce" />
                        <span>Ajouté au Panier !</span>
                      </>
                    ) : (
                      <>
                        <ShoppingBag size={16} />
                        <span>Commander ce Plat</span>
                      </>
                    )}
                  </button>

                  {/* Like Button */}
                  <button
                    onClick={(e) => toggleLike(activePortraitPhoto.id, e)}
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all border shrink-0 ${
                      likedPhotos[activePortraitPhoto.id]
                        ? 'bg-red-500 text-white border-red-400 shadow-lg shadow-red-500/30 scale-105'
                        : 'bg-white/10 text-white hover:bg-white/20 border-white/10'
                    }`}
                  >
                    <Heart size={18} fill={likedPhotos[activePortraitPhoto.id] ? 'currentColor' : 'none'} />
                  </button>

                  {/* Share Button */}
                  <button
                    onClick={(e) => handleSharePhoto(activePortraitPhoto, e)}
                    className="w-12 h-12 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/10 flex items-center justify-center shrink-0 active:scale-90 transition-all"
                  >
                    <Share2 size={18} />
                  </button>
                </div>
              </div>

              {/* Bottom Thumbnail Strip for Direct Jumping */}
              {showThumbnails && (
                <div className="flex gap-2 overflow-x-auto no-scrollbar py-1 px-1">
                  {filteredPhotos.map((photo, idx) => (
                    <button
                      key={photo.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        playSound('pop');
                        setPortraitIndex(idx);
                        setSlideProgress(0);
                      }}
                      className={`relative w-11 h-11 rounded-xl overflow-hidden shrink-0 border-2 transition-all ${
                        idx === portraitIndex 
                          ? 'border-brand-gold scale-110 shadow-lg shadow-brand-gold/40' 
                          : 'border-white/20 opacity-50 hover:opacity-100'
                      }`}
                    >
                      <img src={photo.image} alt={photo.title} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STANDARD LIGHTBOX PHOTO MODAL */}
      {/* ========================================================================= */}
      {selectedPhoto && !isPortraitMode && (
        <div className="fixed inset-0 z-[120] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 animate-fade-in">
          <div className="relative w-full max-w-lg bg-[#1A0F0D] text-white rounded-[3.5rem] overflow-hidden border-4 border-white/10 shadow-2xl animate-scale-up">
            
            {/* Close */}
            <button 
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-4 right-4 z-20 w-12 h-12 bg-black/50 backdrop-blur-md text-white rounded-full flex items-center justify-center hover:bg-black transition-all"
            >
              <X size={22} />
            </button>

            {/* Photo HD */}
            <div className="relative h-72 sm:h-80 w-full overflow-hidden">
              <img src={selectedPhoto.image} alt={selectedPhoto.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1A0F0D] via-transparent to-transparent"></div>
              
              <div className="absolute bottom-4 left-6 flex items-center gap-2">
                <span className="bg-brand-orange text-white text-[8px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg">
                  Khady's Signature
                </span>
                <button
                  onClick={() => {
                    const idx = filteredPhotos.findIndex(p => p.id === selectedPhoto.id);
                    openPortraitMode(idx >= 0 ? idx : 0);
                  }}
                  className="bg-brand-gold text-brand-brown text-[8px] font-black px-3.5 py-1.5 rounded-full uppercase tracking-wider shadow-lg flex items-center gap-1 active:scale-95"
                >
                  <Smartphone size={12} /> Diaporama Plein Écran
                </button>
              </div>
            </div>

            {/* Details */}
            <div className="p-8 space-y-6">
              <div>
                <h3 className="text-2xl font-black italic uppercase text-brand-gold tracking-tight mb-2">
                  {selectedPhoto.title}
                </h3>
                <p className="text-xs text-white/70 leading-relaxed font-bold">
                  {selectedPhoto.description}
                </p>
              </div>

              <div className="flex justify-between items-center bg-white/5 p-5 rounded-3xl border border-white/10">
                <div>
                  <span className="text-[8px] font-black uppercase tracking-widest text-white/40 block">Prix Portion Recommandée</span>
                  <span className="text-2xl font-black text-brand-gold">{selectedPhoto.price.toLocaleString('fr-FR')} F CFA</span>
                </div>
                <div className="flex items-center gap-2 text-brand-orange text-[9px] font-black uppercase">
                  <Sparkles size={14} /> Préparé à la minute
                </div>
              </div>

              <button 
                onClick={() => handleOrderPhotoDish(selectedPhoto)}
                className="w-full bg-brand-orange text-white py-5 rounded-2xl font-black uppercase italic shadow-[0_15px_40px_rgba(255,111,0,0.4)] flex items-center justify-center gap-3 active:scale-95 transition-all text-xs tracking-wider"
              >
                <ShoppingBag size={18} /> Commander Directement ce Plat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GalleryView;
