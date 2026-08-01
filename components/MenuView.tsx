
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

const CARTE_CATEGORIES: (MenuCategory | 'TOUT')[] = [
  'TOUT', 'Petit-déjeuner', 'Déjeuner', 'Dîner', 'Boisson Naturelle', 'Entrée', 'Spécialité Maison', 'Menu du Jour', 'Plat Africain', 'Dessert'
];

const MenuView: React.FC<MenuViewProps> = ({ items, onSelectItem, activeSection, onSectionChange, isLoading = false, onOpenShareApp }) => {
  const [selectedCategory, setSelectedCategory] = useState<MenuCategory | 'TOUT'>('TOUT');
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
      const matchesCategory = selectedCategory === 'TOUT' || item.category === selectedCategory;
      
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
          <div className="flex gap-4 overflow-x-auto no-scrollbar -mx-6 px-6 pb-2">
             {CARTE_CATEGORIES.map(cat => (
               <button 
                 key={cat}
                 onClick={() => { playSound('pop'); setSelectedCategory(cat); }}
                 className={`px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${selectedCategory === cat ? 'bg-brand-orange text-white shadow-lg' : 'bg-white text-gray-400 border border-gray-100'}`}
               >
                 {cat}
               </button>
             ))}
          </div>
        )}
      </header>

      {isLoading ? (
        <div className="px-6 grid grid-cols-2 gap-5">
          {[1, 2, 3, 4, 5, 6].map((idx) => (
            <div 
              key={idx}
              className="bg-white rounded-[2.5rem] p-4 shadow-sm border border-brand-brown/5 relative animate-pulse flex flex-col h-full"
            >
              <div className="relative h-32 w-full mb-4 bg-gray-200/80 rounded-[1.8rem] flex-shrink-0" />
              <div className="h-3.5 bg-gray-200/80 rounded-md w-3/4 mb-2" />
              <div className="h-3 bg-gray-200/60 rounded-md w-1/2 mb-4" />
              <div className="flex justify-between items-center mt-auto pt-2">
                <div className="h-4 bg-gray-200/80 rounded-md w-14" />
                <div className="w-8 h-8 bg-gray-200/80 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="px-6 grid grid-cols-2 gap-5">
           {filteredItems.map(item => (
             <div 
               key={item.id} 
               onClick={() => { playSound('pop'); onSelectItem(item); }}
               className="bg-white rounded-[2.5rem] p-4 shadow-sm border border-brand-brown/5 relative group cursor-pointer active:scale-95 transition-all h-full flex flex-col"
             >
                <div className="relative h-32 w-full mb-4 overflow-hidden rounded-[1.8rem] flex-shrink-0">
                   <img src={item.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={item.name} />
                   {item.isSpicy && (
                     <div className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full shadow-lg border-2 border-white">
                        <Flame size={12} fill="white" />
                     </div>
                   )}
                   {item.rating === 5 && (
                     <div className="absolute bottom-2 left-2 bg-brand-gold text-brand-brown px-2 py-1 rounded-lg text-[8px] font-black flex items-center gap-1 border border-white">
                        <Star size={8} fill="currentColor" /> BEST
                     </div>
                   )}
                </div>
                
                <h4 className="text-[11px] font-black text-brand-brown uppercase italic leading-tight mb-2 line-clamp-2 flex-1">{item.name}</h4>
                
                <div className="flex justify-between items-center mt-2">
                   <span className="text-xs font-black text-brand-orange">{item.price} F</span>
                   <div className="w-8 h-8 bg-brand-brown text-brand-gold rounded-xl flex items-center justify-center shadow-lg transition-transform active:scale-90">
                      <Plus size={16} />
                   </div>
                </div>
             </div>
           ))}
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
