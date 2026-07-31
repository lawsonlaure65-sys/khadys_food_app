import React, { useState } from 'react';
import { GalleryItem } from '../types';
import { 
  Camera, Heart, ShoppingBag, Eye, X, Sparkles, Filter, Share2, Check
} from 'lucide-react';
import { playSound } from '../utils/audio';

interface GalleryViewProps {
  items: GalleryItem[];
  onSelectDish: (dishId: string) => void;
  onGoToMenu: () => void;
}

export const GalleryView: React.FC<GalleryViewProps> = ({ items, onSelectDish, onGoToMenu }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('TOUS');
  const [activePhoto, setActivePhoto] = useState<GalleryItem | null>(null);
  const [likesMap, setLikesMap] = useState<Record<string, number>>({});
  const [likedMap, setLikedMap] = useState<Record<string, boolean>>({});

  const categories = ['TOUS', 'Plat Africain', 'Traiteur & Event', 'Entrée', 'Box Sauce', 'Boisson Naturelle', 'Dîner & Grillades'];

  const handleLike = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    playSound('pop');
    setLikedMap(prev => ({ ...prev, [id]: !prev[id] }));
    setLikesMap(prev => {
      const current = prev[id] ?? items.find(i => i.id === id)?.likes ?? 0;
      return { ...prev, [id]: likedMap[id] ? current - 1 : current + 1 };
    });
  };

  const filteredItems = selectedCategory === 'TOUS' 
    ? items 
    : items.filter(i => i.category === selectedCategory);

  return (
    <div className="animate-fade-in space-y-8 pb-32">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-brand-brown via-[#2A1510] to-[#1A0F0D] p-8 sm:p-12 rounded-[3.5rem] border border-brand-gold/20 shadow-2xl relative overflow-hidden text-white">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Camera size={200} className="text-brand-gold" />
        </div>

        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 bg-brand-gold/20 text-brand-gold px-4 py-1.5 rounded-full border border-brand-gold/30 text-[9px] font-black uppercase tracking-widest">
            <Sparkles size={14} /> Galerie Gastronomique HD
          </div>
          <h2 className="text-3xl sm:text-4xl font-black italic uppercase text-brand-gold tracking-tight">
            L'Art Culinaire en Images
          </h2>
          <p className="text-xs text-white/70 font-medium leading-relaxed">
            Explorez les créations visuelles de la Chef Khady : présentations festives, plats du jour fumants et cocktails naturels.
          </p>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => { setSelectedCategory(cat); playSound('pop'); }}
            className={`px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-wider italic whitespace-nowrap transition-all border ${
              selectedCategory === cat
                ? 'bg-brand-orange text-white border-brand-orange shadow-lg scale-105'
                : 'bg-white text-brand-brown/60 border-gray-100 hover:bg-gray-50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Photo Grid (Masonry feel) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map((item) => {
          const likesCount = likesMap[item.id] ?? item.likes;
          const isLiked = likedMap[item.id];

          return (
            <div
              key={item.id}
              onClick={() => { setActivePhoto(item); playSound('pop'); }}
              className="group relative bg-white rounded-[2.5rem] overflow-hidden border border-gray-100 shadow-sm hover:shadow-2xl transition-all duration-300 cursor-pointer h-80"
            >
              <img
                src={item.image}
                alt={item.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />

              <span className="absolute top-4 left-4 bg-brand-gold text-brand-brown text-[8px] font-black uppercase px-3 py-1 rounded-full shadow-lg">
                {item.tag || item.category}
              </span>

              <button
                onClick={(e) => handleLike(item.id, e)}
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/40 backdrop-blur-md text-white flex items-center justify-center hover:scale-110 transition-all"
              >
                <Heart size={16} className={isLiked ? 'fill-red-500 text-red-500' : ''} />
              </button>

              <div className="absolute bottom-6 left-6 right-6 text-white space-y-1">
                <span className="text-[8px] font-black uppercase tracking-widest text-brand-gold">
                  {item.category}
                </span>
                <h3 className="text-base font-black uppercase italic line-clamp-1">
                  {item.title}
                </h3>
                {item.description && (
                  <p className="text-[10px] text-white/70 line-clamp-1 font-medium">
                    {item.description}
                  </p>
                )}

                <div className="pt-2 flex justify-between items-center text-[9px] font-black uppercase text-white/80">
                  <span className="flex items-center gap-1">
                    <Heart size={12} className="text-red-400" /> {likesCount} coups de cœur
                  </span>
                  <span className="text-brand-gold underline flex items-center gap-1">
                    <Eye size={12} /> Agrandir
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* FULLSCREEN LIGHTBOX MODAL */}
      {activePhoto && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 sm:p-8 animate-fade-in">
          <div className="relative max-w-4xl w-full max-h-[90vh] flex flex-col md:flex-row bg-[#1A0F0D] rounded-[3rem] overflow-hidden border border-white/20 shadow-2xl">
            <button
              onClick={() => setActivePhoto(null)}
              className="absolute top-6 right-6 z-10 w-12 h-12 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-red-500 transition-all"
            >
              <X size={24} />
            </button>

            {/* Photo Container */}
            <div className="md:w-3/5 relative bg-black flex items-center justify-center overflow-hidden min-h-[300px] md:min-h-[500px]">
              <img
                src={activePhoto.image}
                alt={activePhoto.title}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Photo Details Sidebar */}
            <div className="md:w-2/5 p-8 flex flex-col justify-between text-white space-y-6">
              <div className="space-y-4">
                <span className="bg-brand-gold text-brand-brown text-[8px] font-black uppercase px-3 py-1 rounded-full inline-block">
                  {activePhoto.category}
                </span>

                <h2 className="text-2xl font-black italic uppercase text-brand-gold">
                  {activePhoto.title}
                </h2>

                <p className="text-xs text-white/70 font-medium leading-relaxed">
                  {activePhoto.description || 'Création gastronomique préparée à la commande dans nos ateliers centraux de Niamey.'}
                </p>

                <div className="flex items-center gap-2 text-xs font-black text-red-400 bg-red-500/10 p-3 rounded-2xl w-fit">
                  <Heart size={16} className="fill-red-400" />
                  <span>{(likesMap[activePhoto.id] ?? activePhoto.likes)} personnes adorent cette création</span>
                </div>
              </div>

              {/* Order Button */}
              <div className="space-y-3 pt-6 border-t border-white/10">
                {activePhoto.dishId ? (
                  <button
                    onClick={() => {
                      const dishId = activePhoto.dishId!;
                      setActivePhoto(null);
                      onSelectDish(dishId);
                    }}
                    className="w-full bg-brand-orange text-white py-4 rounded-2xl font-black uppercase italic shadow-xl hover:bg-brand-gold hover:text-brand-brown transition-all flex items-center justify-center gap-2 text-xs"
                  >
                    <ShoppingBag size={18} /> Commander ce plat maintenant
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setActivePhoto(null);
                      onGoToMenu();
                    }}
                    className="w-full bg-brand-gold text-brand-brown py-4 rounded-2xl font-black uppercase italic shadow-xl hover:bg-brand-orange hover:text-white transition-all flex items-center justify-center gap-2 text-xs"
                  >
                    <ShoppingBag size={18} /> Voir le Menu Complet
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
