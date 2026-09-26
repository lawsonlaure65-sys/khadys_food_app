
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MenuItem, MenuCategory } from '../types';
import { Search, SlidersHorizontal, Flame, Leaf, Sun, Tag, Sparkles, Star, Plus, Utensils, ShoppingBag, WifiOff, Database, Mic, X, Filter, Gift, ArrowRight, MessageSquare, Crown } from 'lucide-react';
import { playSound } from '../utils/audio';
import { getStoredPlatDuJour } from '../utils/marketing';
import { RESTAURANT_INFO } from '../constants';
import { MenuDuJourTrio } from './MenuDuJourTrio';

interface MenuViewProps {
  items: MenuItem[];
  onSelectItem: (item: MenuItem) => void;
  activeSection: string;
  onSectionChange: (section: string) => void;
  onOpenVoiceModal?: () => void;
}

type TagFilterType = 'ALL' | 'INCONTOURNABLE' | 'PLAT_DU_JOUR' | 'SPECIALITE' | 'EPICE' | 'VEGETARIEN' | 'PROMO';

const MAIN_SECTIONS = [
  { id: 'CARTE', label: 'LA CARTE', icon: <Utensils size={16} /> },
  { id: 'BOX', label: 'BOX SAUCES', icon: <ShoppingBag size={16} /> },
  { id: 'PACK', label: 'PACK-BUFFET', icon: <Sparkles size={16} /> }
];

const CARTE_CATEGORIES: (MenuCategory | 'TOUT')[] = [
  'TOUT', 'Petit-déjeuner', 'Déjeuner', 'Dîner', 'Boisson Naturelle', 'Entrée', 'Spécialité Maison', 'Menu du Jour', 'Plat Africain', 'Dessert'
];

const TAG_FILTERS: { id: TagFilterType; label: string; icon: React.ReactNode; activeBg: string }[] = [
  { id: 'ALL', label: 'Tous les plats', icon: <SlidersHorizontal size={13} />, activeBg: 'bg-brand-brown text-white shadow-brand-brown/20' },
  { id: 'INCONTOURNABLE', label: 'Incontournables', icon: <Crown size={13} className="text-amber-400 fill-amber-400" />, activeBg: 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-amber-500/30' },
  { id: 'PLAT_DU_JOUR', label: 'Plat du Jour', icon: <Sun size={13} className="text-amber-400" />, activeBg: 'bg-amber-500 text-white shadow-amber-500/30' },
  { id: 'SPECIALITE', label: 'Spécialité Maison', icon: <Sparkles size={13} className="text-purple-300" />, activeBg: 'bg-purple-600 text-white shadow-purple-600/30' },
  { id: 'EPICE', label: 'Épicé', icon: <Flame size={13} className="text-rose-400" />, activeBg: 'bg-rose-500 text-white shadow-rose-500/30' },
  { id: 'VEGETARIEN', label: 'Végétarien', icon: <Leaf size={13} className="text-emerald-300" />, activeBg: 'bg-emerald-600 text-white shadow-emerald-600/30' },
  { id: 'PROMO', label: 'Promos & Éco', icon: <Tag size={13} className="text-amber-300" />, activeBg: 'bg-amber-600 text-white shadow-amber-600/30' },
];

const MenuView: React.FC<MenuViewProps> = ({ items, onSelectItem, activeSection, onSectionChange, onOpenVoiceModal }) => {
  const [selectedCategory, setSelectedCategory] = useState<MenuCategory | 'TOUT'>('TOUT');
  const [selectedTagFilter, setSelectedTagFilter] = useState<TagFilterType>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [platDuJour, setPlatDuJour] = useState(() => getStoredPlatDuJour());

  // Listen to real-time Plat du Jour updates from Admin
  React.useEffect(() => {
    const handlePlatUpdate = (e: any) => {
      if (e?.detail) {
        setPlatDuJour(e.detail);
      } else {
        setPlatDuJour(getStoredPlatDuJour());
      }
    };
    window.addEventListener('khadys_plat_du_jour_updated', handlePlatUpdate);
    window.addEventListener('storage', handlePlatUpdate);
    return () => {
      window.removeEventListener('khadys_plat_du_jour_updated', handlePlatUpdate);
      window.removeEventListener('storage', handlePlatUpdate);
    };
  }, []);

  // Helper to determine if dish is one of the Incontournables (Attiéké or Doukounou)
  const isDishIncontournable = (item: MenuItem) => {
    const name = (item.name || '').toLowerCase();
    return name.includes('doukounou') || 
           name.includes('attiéké') || 
           name.includes('attieke') ||
           item.id === 'douk-royal' || 
           item.id === 'attieke-royal';
  };

  // Dynamically calculate match counts for each tag filter
  const tagCounts = useMemo(() => {
    const counts: Record<TagFilterType, number> = {
      ALL: items.length,
      INCONTOURNABLE: 0,
      PLAT_DU_JOUR: 0,
      SPECIALITE: 0,
      EPICE: 0,
      VEGETARIEN: 0,
      PROMO: 0,
    };

    items.forEach(item => {
      if (isDishIncontournable(item)) counts.INCONTOURNABLE++;
      if (item.isPlatDuJour || item.category === 'Menu du Jour' || item.category === 'Plat du Jour') counts.PLAT_DU_JOUR++;
      if (item.isSpécialitéMaison || item.category === 'Spécialité Maison') counts.SPECIALITE++;
      if (item.isSpicy) counts.EPICE++;
      if (item.isVegetarian) counts.VEGETARIEN++;
      if (item.isPromo || item.isLowPrice) counts.PROMO++;
    });

    return counts;
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           item.description.toLowerCase().includes(searchQuery.toLowerCase());

      let matchesTag = true;
      if (selectedTagFilter === 'INCONTOURNABLE') {
        matchesTag = isDishIncontournable(item);
      } else if (selectedTagFilter === 'PLAT_DU_JOUR') {
        matchesTag = Boolean(item.isPlatDuJour || item.category === 'Menu du Jour' || item.category === 'Plat du Jour');
      } else if (selectedTagFilter === 'SPECIALITE') {
        matchesTag = Boolean(item.isSpécialitéMaison || item.category === 'Spécialité Maison');
      } else if (selectedTagFilter === 'EPICE') {
        matchesTag = Boolean(item.isSpicy);
      } else if (selectedTagFilter === 'VEGETARIEN') {
        matchesTag = Boolean(item.isVegetarian);
      } else if (selectedTagFilter === 'PROMO') {
        matchesTag = Boolean(item.isPromo || item.isLowPrice);
      }
      
      if (activeSection === 'BOX') {
        return item.category === 'Box Sauce' && matchesTag && matchesSearch;
      }
      
      if (activeSection === 'PACK') {
        return item.category === 'Pack-Buffet' && matchesTag && matchesSearch;
      }
      
      // CARTE SECTION
      const isCarteItem = item.category !== 'Box Sauce' && item.category !== 'Pack-Buffet';
      const matchesCategory = selectedCategory === 'TOUT' || item.category === selectedCategory;
      
      return isCarteItem && matchesCategory && matchesTag && matchesSearch;
    });
  }, [items, activeSection, selectedCategory, selectedTagFilter, searchQuery]);

  return (
    <div className="animate-fade-in pt-6 pb-20">
      <header className="px-6 mb-8">
        {!navigator.onLine && (
          <div className="mb-4 bg-amber-500/10 border border-amber-500/30 text-amber-800 px-3.5 py-2 rounded-2xl text-[9px] font-black uppercase tracking-wider flex items-center justify-between shadow-sm">
            <span className="flex items-center gap-1.5"><WifiOff size={14} className="text-amber-600 animate-pulse" /> Mode Hors-ligne : Carte chargée via IndexedDB</span>
            <span className="text-[8px] bg-amber-500/20 text-amber-900 px-2 py-0.5 rounded-lg font-mono font-bold flex items-center gap-1"><Database size={10}/> {items.length} Plats</span>
          </div>
        )}

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-black italic uppercase text-brand-brown leading-tight">
            Notre <br/>
            <span className="text-brand-orange text-lg tracking-[0.3em]">Univers</span>
          </h2>
          <div className="bg-brand-gold/20 p-3 rounded-2xl">
            <Utensils size={24} className="text-brand-brown" />
          </div>
        </div>

        {/* Main Sections Tabs */}
        <div className="flex bg-gray-100 p-1.5 rounded-[2rem] mb-6 shadow-inner">
          {MAIN_SECTIONS.map(section => (
            <motion.button
              key={section.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => { playSound('pop'); onSectionChange(section.id); setSelectedCategory('TOUT'); }}
              className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-[1.6rem] text-[9px] font-black uppercase tracking-tighter transition-all relative ${activeSection === section.id ? 'bg-white text-brand-brown shadow-md' : 'text-gray-400 hover:text-brand-brown'}`}
            >
              {activeSection === section.id && (
                <motion.div
                  layoutId="activeSectionBg"
                  className="absolute inset-0 bg-white rounded-[1.6rem] shadow-md z-0"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                {section.icon}
                {section.label}
              </span>
            </motion.button>
          ))}
        </div>

        {/* Barre de Recherche & Commande Vocale */}
        <div className="flex gap-3 mb-5">
           <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center px-4 gap-3">
              <Search size={18} className="text-gray-300" />
              <input 
                type="text" 
                placeholder="Rechercher un plat, ingrédient..." 
                className="w-full py-4 text-xs font-bold outline-none bg-transparent"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-gray-400 hover:text-gray-600">
                  <X size={16} />
                </button>
              )}
           </div>
           {onOpenVoiceModal && (
             <motion.button
               whileHover={{ scale: 1.05 }}
               whileTap={{ scale: 0.9 }}
               onClick={() => { playSound('pop'); onOpenVoiceModal(); }}
               className="bg-brand-orange text-white p-4 rounded-2xl shadow-lg hover:bg-brand-gold hover:text-brand-brown transition-all flex items-center justify-center shrink-0"
               title="Commande Vocale 🎙️"
             >
               <Mic size={20} className="animate-pulse" />
             </motion.button>
           )}
        </div>

        {/* Filtres par Tags Spéciaux (Plat du jour, Spécialité, Épicé, Végétarien, Promos) */}
        <div className="mb-6">
           <div className="flex items-center justify-between mb-2">
              <span className="text-[9px] font-black uppercase text-brand-brown/50 tracking-widest flex items-center gap-1">
                 <Filter size={11} className="text-brand-orange" /> Filtres Rapides :
              </span>
              {selectedTagFilter !== 'ALL' && (
                 <button 
                   onClick={() => { playSound('pop'); setSelectedTagFilter('ALL'); }}
                   className="text-[9px] font-black text-rose-600 hover:text-rose-700 flex items-center gap-1 uppercase tracking-wider bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200"
                 >
                    <X size={10} /> Réinitialiser
                 </button>
              )}
           </div>

           <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-6 px-6 pb-1">
              {TAG_FILTERS.map(tag => {
                const isSelected = selectedTagFilter === tag.id;
                const count = tagCounts[tag.id];

                return (
                  <motion.button
                    key={tag.id}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.94 }}
                    onClick={() => {
                      playSound('pop');
                      setSelectedTagFilter(isSelected && tag.id !== 'ALL' ? 'ALL' : tag.id);
                    }}
                    className={`px-3.5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-wider whitespace-nowrap transition-all flex items-center gap-2 border ${
                      isSelected 
                        ? `${tag.activeBg} shadow-md border-transparent` 
                        : 'bg-white text-brand-brown/70 border-gray-100 hover:border-brand-brown/20'
                    }`}
                  >
                    {tag.icon}
                    <span>{tag.label}</span>
                    {tag.id !== 'ALL' && (
                       <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-mono font-bold ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
                       }`}>
                          {count}
                       </span>
                    )}
                  </motion.button>
                );
              })}
           </div>
        </div>

        {/* Catégories de la Carte */}
        {activeSection === 'CARTE' && (
          <div className="flex gap-2.5 overflow-x-auto no-scrollbar -mx-6 px-6 pb-2">
             {CARTE_CATEGORIES.map(cat => {
               const isSelected = selectedCategory === cat;
               return (
                 <motion.button 
                   key={cat}
                   whileHover={{ scale: 1.04 }}
                   whileTap={{ scale: 0.94 }}
                   onClick={() => { playSound('pop'); setSelectedCategory(cat); }}
                   className={`relative px-4 py-2.5 rounded-full text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-colors ${
                     isSelected 
                       ? 'bg-brand-orange text-white shadow-lg shadow-brand-orange/30' 
                       : 'bg-white text-gray-400 border border-gray-100 hover:text-brand-brown'
                   }`}
                 >
                   {isSelected && (
                     <motion.div
                       layoutId="activeCategoryPill"
                       className="absolute inset-0 bg-brand-orange rounded-full z-0 shadow-lg shadow-brand-orange/30"
                       transition={{ type: "spring", stiffness: 350, damping: 28 }}
                     />
                   )}
                   <span className="relative z-10">{cat}</span>
                 </motion.button>
               );
             })}
          </div>
        )}
      </header>

      {/* NOTIFICATION PRÉCOMMANDE WHATSAPP */}
      <div className="px-6 mb-6">
        <div 
          onClick={() => {
            playSound('pop');
            const url = `https://wa.me/${RESTAURANT_INFO.whatsappClean}?text=${encodeURIComponent("Salam Khady's Food ! Je souhaite précommander sur WhatsApp : ")}`;
            window.open(url, '_blank');
          }}
          className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-[#12261A] text-white p-4 rounded-3xl border border-emerald-500/40 flex items-center justify-between cursor-pointer hover:border-emerald-400 active:scale-98 transition-all shadow-lg"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-md">
              <MessageSquare size={20} className="animate-pulse" />
            </div>
            <div>
              <span className="text-[8px] font-black uppercase text-emerald-300 tracking-wider block">Service Restaurant</span>
              <h4 className="text-xs font-black uppercase italic text-white">Précommande sur le numéro WhatsApp du restaurant</h4>
              <p className="text-[9px] text-emerald-200/80 font-bold mt-0.5">
                WhatsApp : <span className="text-brand-gold font-mono">{RESTAURANT_INFO.whatsapp}</span>
              </p>
            </div>
          </div>
          <span className="bg-emerald-500 hover:bg-emerald-400 text-white text-[8px] font-black uppercase tracking-wider px-3 py-2 rounded-xl transition-colors shrink-0 flex items-center gap-1">
            Précommander <ArrowRight size={10} />
          </span>
        </div>
      </div>

      {/* MENU DU JOUR SPOTLIGHT BANNER — LE TRIO GOURMAND (PLAT DU JOUR + DOUKOUNOU + ATTIÉKÉ) */}
      {platDuJour && platDuJour.isActive && (selectedTagFilter === 'ALL' || selectedTagFilter === 'PLAT_DU_JOUR') && selectedCategory === 'TOUT' && searchQuery === '' && (
        <div className="px-4 sm:px-6 mb-8">
          <MenuDuJourTrio
            items={items}
            onSelectItem={onSelectItem}
            isHomeView={false}
          />
        </div>
      )}

      {/* Grid of Dishes with fluid scale and opacity animations */}
      <motion.div 
        layout
        className="px-4 sm:px-6 grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5"
      >
        <AnimatePresence mode="popLayout">
          {filteredItems.map((item, index) => {
             const isIncontournable = isDishIncontournable(item);
             const isPlatDuJour = item.isPlatDuJour || item.category === 'Menu du Jour' || item.category === 'Plat du Jour';
             const isSpecialite = item.isSpécialitéMaison || item.category === 'Spécialité Maison';
             const isPromo = item.isPromo || item.isLowPrice;

             return (
              <motion.div 
                layout
                key={item.id} 
                initial={{ opacity: 0, scale: 0.85, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.85, y: -10 }}
                transition={{ 
                  duration: 0.28, 
                  delay: Math.min(index * 0.03, 0.18),
                  ease: [0.21, 0.85, 0.35, 1] 
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => { playSound('pop'); onSelectItem(item); }}
                className={`bg-white rounded-[2.5rem] p-4 shadow-sm relative group cursor-pointer h-full flex flex-col transition-all ${
                  isIncontournable 
                    ? 'border-2 border-amber-500/60 shadow-md ring-2 ring-amber-400/20 hover:border-amber-500 bg-gradient-to-b from-amber-500/[0.03] to-white' 
                    : 'border border-brand-brown/5'
                }`}
              >
                 <div className="relative h-32 w-full mb-4 overflow-hidden rounded-[1.8rem] flex-shrink-0">
                    <img src={item.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={item.name} />
                    
                    {/* Top Left Tag Badge */}
                    <div className="absolute top-2 left-2 flex flex-col gap-1 items-start">
                       {isIncontournable && (
                          <span className="bg-gradient-to-r from-amber-600 via-orange-500 to-amber-600 text-white text-[8px] font-black uppercase px-2.5 py-0.5 rounded-full shadow-lg flex items-center gap-1 border border-white/60 animate-pulse">
                             <Crown size={9} className="text-yellow-200 fill-yellow-200" /> Incontournable
                          </span>
                       )}
                       {isPlatDuJour && !isIncontournable && (
                          <span className="bg-amber-500/90 backdrop-blur-md text-white text-[8px] font-black uppercase px-2 py-0.5 rounded-full shadow-md flex items-center gap-1 border border-white/40">
                             <Sun size={9} /> Jour
                          </span>
                       )}
                       {isSpecialite && !isPlatDuJour && !isIncontournable && (
                          <span className="bg-purple-600/90 backdrop-blur-md text-white text-[8px] font-black uppercase px-2 py-0.5 rounded-full shadow-md flex items-center gap-1 border border-white/40">
                             <Sparkles size={9} /> Chef
                          </span>
                       )}
                       {isPromo && !isPlatDuJour && !isSpecialite && !isIncontournable && (
                          <span className="bg-amber-600/90 backdrop-blur-md text-white text-[8px] font-black uppercase px-2 py-0.5 rounded-full shadow-md flex items-center gap-1 border border-white/40">
                             <Tag size={9} /> Éco
                          </span>
                       )}
                    </div>

                    {/* Top Right Badges (Spicy & Vegetarian) */}
                    <div className="absolute top-2 right-2 flex items-center gap-1">
                       {item.isSpicy && (
                          <div className="bg-rose-500 text-white p-1.5 rounded-full shadow-lg border border-white" title="Épicé">
                             <Flame size={11} fill="white" />
                          </div>
                       )}
                       {item.isVegetarian && (
                          <div className="bg-emerald-500 text-white p-1.5 rounded-full shadow-lg border border-white" title="Végétarien">
                             <Leaf size={11} fill="white" />
                          </div>
                       )}
                    </div>

                    {/* Rating or Best Badge */}
                    {item.rating === 5 && (
                      <div className="absolute bottom-2 left-2 bg-brand-gold text-brand-brown px-2 py-0.5 rounded-lg text-[8px] font-black flex items-center gap-1 border border-white shadow-md">
                         <Star size={8} fill="currentColor" /> BEST
                      </div>
                    )}
                 </div>
                 
                 <h4 className="text-[11px] font-black text-brand-brown uppercase italic leading-tight mb-2 line-clamp-2 flex-1">{item.name}</h4>
                 
                 <div className="flex justify-between items-center mt-2">
                    <span className="text-xs font-black text-brand-orange">{item.price.toLocaleString()} F</span>
                    <div className="w-8 h-8 bg-brand-brown text-brand-gold rounded-xl flex items-center justify-center shadow-lg transition-transform group-hover:bg-brand-orange group-hover:text-white">
                       <Plus size={16} />
                    </div>
                 </div>
              </motion.div>
             );
          })}
        </AnimatePresence>
      </motion.div>

      {filteredItems.length === 0 && (
        <AnimatePresence>
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.25 }}
            className="py-20 text-center opacity-60 italic flex flex-col items-center px-6"
          >
             <Search size={40} className="mb-4 text-brand-orange animate-pulse" />
             <p className="text-xs font-bold text-brand-brown">Aucun plat ne correspond à vos critères de recherche.</p>
             {selectedTagFilter !== 'ALL' && (
                <button
                  onClick={() => setSelectedTagFilter('ALL')}
                  className="mt-3 text-[10px] bg-brand-orange text-white px-4 py-2 rounded-full font-black uppercase tracking-wider shadow-md"
                >
                   Effacer le filtre "{TAG_FILTERS.find(t => t.id === selectedTagFilter)?.label}"
                </button>
             )}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
};

export default MenuView;
