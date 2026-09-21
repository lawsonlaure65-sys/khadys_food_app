
import React, { useState, useMemo } from 'react';
import { MenuItem, MenuCategory } from '../types';
import { Search, SlidersHorizontal, Flame, Star, Plus, Utensils, ShoppingBag, Sparkles, Share2 } from 'lucide-react';
import { playSound } from '../utils/audio';

interface MenuViewProps {
  items: MenuItem[];
  onSelectItem: (item: MenuItem) => void;
  activeSection: string;
  onSectionChange: (section: string) => void;
  isLoading?: boolean;
  onOpenShareApp?: () => void;
}

const MAIN_SECTIONS = [
  { id: 'CARTE', label: 'LA CARTE', icon: <Utensils size={16} /> },
  { id: 'BOX', label: 'BOX SAUCES', icon: <ShoppingBag size={16} /> },
  { id: 'PACK', label: 'PACK-BUFFET', icon: <Sparkles size={16} /> }
];

interface CategoryFilter {
  id: string;
  label: string;
  badge?: string;
}

const CARTE_CATEGORIES: CategoryFilter[] = [
  { id: 'TOUT', label: 'TOUT LE MENU' },
  { id: 'Plat du Jour', label: '⭐ PLAT DU JOUR', badge: 'Jour' },
  { id: 'Spécialité Maison', label: '👑 SPÉCIALITÉ MAISON', badge: 'Maison' },
  { id: 'Petit-déjeuner', label: '☕ PETIT-DÉJEUNER' },
  { id: 'Déjeuner', label: '☀️ DÉJEUNER' },
  { id: 'Dîner', label: '🌙 DÎNER' },
  { id: 'Plat Africain', label: '🥘 PLAT AFRICAIN' },
  { id: 'Entrée', label: '🥗 ENTRÉE & PASTELS' },
  { id: 'Boisson Naturelle', label: '🍹 BOISSON NATURELLE' },
  { id: 'Dessert', label: '🍨 DESSERT' },
];

const MenuView: React.FC<MenuViewProps> = ({ items, onSelectItem, activeSection, onSectionChange, isLoading = false, onOpenShareApp }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('TOUT');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           item.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      if (activeSection === 'BOX') {
        return item.category === 'Box Sauce' && matchesSearch;
      }
      
      if (activeSection === 'PACK') {
        return item.category === 'Pack-Buffet' && matchesSearch;
      }
      
      // CARTE SECTION
      const isCarteItem = item.category !== 'Box Sauce' && item.category !== 'Pack-Buffet';
      
      let matchesCategory = false;
      if (selectedCategory === 'TOUT') {
        matchesCategory = true;
      } else if (selectedCategory === 'Plat du Jour') {
        matchesCategory = item.category === 'Plat du Jour' || item.category === 'Menu du Jour' || item.isPlatDuJour === true;
      } else if (selectedCategory === 'Spécialité Maison') {
        matchesCategory = item.category === 'Spécialité Maison' || item.isSpécialitéMaison === true;
      } else {
        matchesCategory = item.category === selectedCategory;
      }
      
      return isCarteItem && matchesCategory && matchesSearch;
    });
  }, [items, activeSection, selectedCategory, searchQuery]);

  return (
    <div className="animate-fade-in pt-6 pb-20">
      <header className="px-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-black italic uppercase text-brand-brown leading-tight">
              Notre <br/>
              <span className="text-brand-orange text-lg tracking-[0.3em]">Univers</span>
            </h2>
          </div>
          <div className="flex items-center gap-3">
            {onOpenShareApp && (
              <button 
                onClick={() => { playSound('pop'); onOpenShareApp(); }}
                className="bg-brand-orange text-white p-3.5 rounded-2xl shadow-md hover:bg-brand-brown transition-all active:scale-90 flex items-center gap-1.5 text-xs font-black uppercase"
                title="Partager le Menu"
              >
                <Share2 size={18} /> Partager
              </button>
            )}
            <div className="bg-brand-gold/20 p-3.5 rounded-2xl">
              <Utensils size={24} className="text-brand-brown" />
            </div>
          </div>
        </div>

        {/* Main Sections Tabs */}
        <div className="flex bg-gray-100 p-1.5 rounded-[2rem] mb-8 shadow-inner">
          {MAIN_SECTIONS.map(section => (
            <button
              key={section.id}
              onClick={() => { playSound('pop'); onSectionChange(section.id); setSelectedCategory('TOUT'); }}
              className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-[1.6rem] text-[9px] font-black uppercase tracking-tighter transition-all ${activeSection === section.id ? 'bg-white text-brand-brown shadow-md scale-[1.02]' : 'text-gray-400'}`}
            >
              {section.icon}
              {section.label}
            </button>
          ))}
        </div>

        <div className="flex gap-3 mb-8">
           <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center px-4 gap-3">
              <Search size={18} className="text-gray-300" />
              <input 
                type="text" 
                placeholder="Rechercher un délice..." 
                className="w-full py-4 text-xs font-bold outline-none bg-transparent"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
           </div>
        </div>

        {activeSection === 'CARTE' && (
          <div className="flex gap-2.5 overflow-x-auto no-scrollbar -mx-6 px-6 pb-2">
             {CARTE_CATEGORIES.map(cat => {
               const isSelected = selectedCategory === cat.id;
               const isSpecial = cat.id === 'Plat du Jour' || cat.id === 'Spécialité Maison';
               return (
                 <button 
                   key={cat.id}
                   onClick={() => { playSound('pop'); setSelectedCategory(cat.id); }}
                   className={`px-4 sm:px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-wider whitespace-nowrap transition-all flex items-center gap-1.5 shadow-sm active:scale-95 ${
                     isSelected
                       ? 'bg-gradient-to-r from-brand-orange to-amber-600 text-white shadow-lg shadow-brand-orange/20 scale-[1.03]'
                       : isSpecial
                       ? 'bg-amber-50 text-brand-brown border-2 border-brand-gold/60 hover:bg-amber-100/80'
                       : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'
                   }`}
                 >
                   {cat.label}
                 </button>
               );
             })}
          </div>
        )}
      </header>

      {isLoading ? (
        <div className="px-4 sm:px-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4 sm:gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((idx) => (
            <div 
              key={idx}
              className="bg-white rounded-[2rem] sm:rounded-[2.5rem] p-3.5 sm:p-4 shadow-sm border border-brand-brown/5 relative animate-pulse flex flex-col h-full"
            >
              <div className="relative h-28 sm:h-36 w-full mb-3 bg-gray-200/80 rounded-[1.5rem] flex-shrink-0" />
              <div className="h-3 bg-gray-200/80 rounded-md w-3/4 mb-2" />
              <div className="h-2.5 bg-gray-200/60 rounded-md w-1/2 mb-3" />
              <div className="flex justify-between items-center mt-auto pt-2">
                <div className="h-3.5 bg-gray-200/80 rounded-md w-12" />
                <div className="w-7 h-7 bg-gray-200/80 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="px-4 sm:px-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4 sm:gap-6">
           {filteredItems.map(item => {
             const isPlatJour = item.isPlatDuJour || item.category === 'Menu du Jour' || item.category === 'Plat du Jour';
             const isSpecialite = item.isSpécialitéMaison || item.category === 'Spécialité Maison';

             return (
              <div 
                key={item.id} 
                onClick={() => { playSound('pop'); onSelectItem(item); }}
                className="bg-white rounded-[2rem] sm:rounded-[2.5rem] p-3.5 sm:p-4 shadow-sm border border-brand-brown/5 relative group cursor-pointer active:scale-95 transition-all h-full flex flex-col hover:shadow-xl"
              >
                 <div className="relative h-28 sm:h-36 w-full mb-3 overflow-hidden rounded-[1.5rem] sm:rounded-[1.8rem] flex-shrink-0">
                    <img src={item.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={item.name} />
                    
                    {/* Badge Plat du Jour ou Spécialité */}
                    {isPlatJour && (
                      <div className="absolute top-2 left-2 bg-gradient-to-r from-amber-500 to-brand-orange text-white text-[7.5px] sm:text-[8.5px] font-black uppercase px-2 py-0.5 rounded-full shadow-md border border-white/40 flex items-center gap-1 italic">
                        ⭐ Plat du Jour
                      </div>
                    )}
                    {!isPlatJour && isSpecialite && (
                      <div className="absolute top-2 left-2 bg-gradient-to-r from-[#2C1810] to-[#4A281B] text-brand-gold text-[7.5px] sm:text-[8.5px] font-black uppercase px-2 py-0.5 rounded-full shadow-md border border-brand-gold/50 flex items-center gap-1 italic">
                        👑 Spécialité
                      </div>
                    )}

                    {item.isSpicy && (
                      <div className="absolute top-2 right-2 bg-red-500 text-white p-1 sm:p-1.5 rounded-full shadow-lg border-2 border-white">
                         <Flame size={10} fill="white" className="sm:w-3 sm:h-3" />
                      </div>
                    )}
                    {item.rating === 5 && (
                      <div className="absolute bottom-2 left-2 bg-brand-gold text-brand-brown px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-lg text-[7px] sm:text-[8px] font-black flex items-center gap-1 border border-white">
                         <Star size={8} fill="currentColor" /> BEST
                      </div>
                    )}
                 </div>
                 
                 <h4 className="text-[10px] sm:text-[11px] font-black text-brand-brown uppercase italic leading-tight mb-2 line-clamp-2 flex-1">{item.name}</h4>
                 
                 <div className="flex justify-between items-center mt-2">
                    <span className="text-xs font-black text-brand-orange">{item.price} F</span>
                    <div className="w-7 h-7 sm:w-8 sm:h-8 bg-brand-brown text-brand-gold rounded-xl flex items-center justify-center shadow-lg transition-transform active:scale-90">
                       <Plus size={14} className="sm:w-4 sm:h-4" />
                    </div>
                 </div>
              </div>
             );
           })}
        </div>
      )}

      {!isLoading && filteredItems.length === 0 && (
        <div className="py-20 text-center opacity-20 italic flex flex-col items-center">
           <Search size={40} className="mb-4" />
           <p>Aucun plat trouvé pour votre recherche.</p>
        </div>
      )}
    </div>
  );
};

export default MenuView;
