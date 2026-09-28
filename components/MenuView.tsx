
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
           item.id === 'attieke-royal' ||
           item.id === 'af3';
  };

  // Helper: Attiéké & Doukounou must NEVER become automatic Plat du Jour
  const isDishPlatDuJour = (item: MenuItem) => {
    if (isDishIncontournable(item)) return false;
    return Boolean(item.isPlatDuJour || item.category === 'Menu du Jour' || item.category === 'Plat du Jour');
  };

  // Permanent specialties & Incontournables (Part 2 of the Menu)
  const permanentSpecialties = useMemo(() => {
    return items.filter(item =>
      item.category !== 'Box Sauce' &&
      item.category !== 'Pack-Buffet' &&
      (isDishIncontournable(item) || item.isSpécialitéMaison || item.category === 'Spécialité Maison')
    ).slice(0, 8);
  }, [items]);

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
      if (isDishPlatDuJour(item)) counts.PLAT_DU_JOUR++;
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
        matchesTag = isDishPlatDuJour(item);
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
    <div className="animate-fade-in pt-5 sm:pt-6 pb-36 w-full max-w-full min-w-0 overflow-x-hidden">
      <header className="px-3.5 sm:px-6 mb-6 sm:mb-8 w-full min-w-0">
        {!navigator.onLine && (
          <div className="mb-4 bg-amber-500/10 border border-amber-500/30 text-amber-800 px-3 py-2 rounded-2xl text-[8px] sm:text-[9px] font-black uppercase tracking-wider flex flex-wrap items-center justify-between gap-2 shadow-sm">
            <span className="flex items-center gap-1.5 min-w-0 truncate"><WifiOff size={13} className="text-amber-600 animate-pulse shrink-0" /> Mode Hors-ligne : Carte chargée via IndexedDB</span>
            <span className="text-[8px] bg-amber-500/20 text-amber-900 px-2 py-0.5 rounded-lg font-mono font-bold flex items-center gap-1 shrink-0"><Database size={10}/> {items.length} Plats</span>
          </div>
        )}

        <div className="flex items-center justify-between mb-5 sm:mb-6">
          <h2 className="text-2xl sm:text-3xl font-black italic uppercase text-brand-brown leading-tight">
            Notre <br/>
            <span className="text-brand-orange text-base sm:text-lg tracking-[0.25em] sm:tracking-[0.3em]">Univers</span>
          </h2>
          <div className="bg-brand-gold/20 p-3 rounded-2xl shrink-0">
            <Utensils size={22} className="text-brand-brown" />
          </div>
        </div>

        {/* Main Sections Tabs */}
        <div className="flex bg-gray-100 p-1 sm:p-1.5 rounded-[1.8rem] sm:rounded-[2rem] mb-5 sm:mb-6 shadow-inner w-full min-w-0">
          {MAIN_SECTIONS.map(section => (
            <motion.button
              key={section.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => { playSound('pop'); onSectionChange(section.id); setSelectedCategory('TOUT'); }}
              className={`flex-1 min-w-0 flex items-center justify-center gap-1 sm:gap-2 py-3.5 sm:py-4 px-1.5 rounded-[1.4rem] sm:rounded-[1.6rem] text-[8px] sm:text-[9px] font-black uppercase tracking-tighter transition-all relative ${activeSection === section.id ? 'bg-white text-brand-brown shadow-md' : 'text-gray-400 hover:text-brand-brown'}`}
            >
              {activeSection === section.id && (
                <motion.div
                  layoutId="activeSectionBg"
                  className="absolute inset-0 bg-white rounded-[1.4rem] sm:rounded-[1.6rem] shadow-md z-0"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1 sm:gap-2 truncate">
                <span className="shrink-0">{section.icon}</span>
                <span className="truncate">{section.label}</span>
              </span>
            </motion.button>
          ))}
        </div>

        {/* Barre de Recherche & Commande Vocale */}
        <div className="flex gap-2.5 sm:gap-3 mb-5 w-full min-w-0">
           <div className="flex-1 min-w-0 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center px-3.5 sm:px-4 gap-2.5 sm:gap-3">
              <Search size={17} className="text-gray-300 shrink-0" />
              <input 
                type="text" 
                placeholder="Rechercher un plat, ingrédient..." 
                className="w-full min-w-0 py-3.5 sm:py-4 text-xs font-bold outline-none bg-transparent"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-gray-400 hover:text-gray-600 shrink-0">
                  <X size={16} />
                </button>
              )}
           </div>
           {onOpenVoiceModal && (
             <motion.button
               whileHover={{ scale: 1.05 }}
               whileTap={{ scale: 0.9 }}
               onClick={() => { playSound('pop'); onOpenVoiceModal(); }}
               className="bg-brand-orange text-white p-3.5 sm:p-4 rounded-2xl shadow-lg hover:bg-brand-gold hover:text-brand-brown transition-all flex items-center justify-center shrink-0"
               title="Commande Vocale 🎙️"
             >
               <Mic size={19} className="animate-pulse" />
             </motion.button>
           )}
        </div>

        {/* Filtres par Tags Spéciaux (Plat du jour, Spécialité, Épicé, Végétarien, Promos) */}
        <div className="mb-5 sm:mb-6 w-full min-w-0">
           <div className="flex items-center justify-between mb-2 gap-2">
              <span className="text-[9px] font-black uppercase text-brand-brown/50 tracking-widest flex items-center gap-1 truncate">
                 <Filter size={11} className="text-brand-orange shrink-0" /> Filtres Rapides :
              </span>
              {selectedTagFilter !== 'ALL' && (
                 <button 
                   onClick={() => { playSound('pop'); setSelectedTagFilter('ALL'); }}
                   className="text-[9px] font-black text-rose-600 hover:text-rose-700 flex items-center gap-1 uppercase tracking-wider bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200 shrink-0"
                 >
                    <X size={10} /> Réinitialiser
                 </button>
              )}
           </div>

           <div className="flex gap-2 overflow-x-auto no-scrollbar w-full max-w-full pb-1">
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
                    className={`px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-2xl text-[9px] sm:text-[10px] font-black uppercase tracking-wider whitespace-nowrap transition-all flex items-center gap-1.5 sm:gap-2 border shrink-0 ${
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
          <div className="flex gap-2 overflow-x-auto no-scrollbar w-full max-w-full pb-2">
             {CARTE_CATEGORIES.map(cat => {
               const isSelected = selectedCategory === cat;
               return (
                 <motion.button 
                   key={cat}
                   whileHover={{ scale: 1.04 }}
                   whileTap={{ scale: 0.94 }}
                   onClick={() => { playSound('pop'); setSelectedCategory(cat); }}
                   className={`relative px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-full text-[8px] sm:text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-colors shrink-0 ${
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

      {/* NOTIFICATION PRÉCOMMANDE WHATSAPP & CATALOGUE SÉPARÉ */}
      <div className="px-3.5 sm:px-6 mb-6 space-y-2 w-full min-w-0">
        <div 
          onClick={() => {
            playSound('pop');
            const url = `https://wa.me/${RESTAURANT_INFO.whatsappClean}?text=${encodeURIComponent("Salam Khady's Food ! Je souhaite précommander sur WhatsApp : ")}`;
            window.open(url, '_blank');
          }}
          className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-[#12261A] text-white p-3.5 sm:p-4 rounded-3xl border border-emerald-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:border-emerald-400 active:scale-98 transition-all shadow-lg"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-md">
              <MessageSquare size={18} className="animate-pulse" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[8px] font-black uppercase text-emerald-300 tracking-wider block">Commande Directe WhatsApp</span>
              <h4 className="text-[11px] sm:text-xs font-black uppercase italic text-white leading-tight">Précommande sur le numéro WhatsApp du restaurant</h4>
              <p className="text-[9px] text-emerald-200/80 font-bold mt-0.5 truncate">
                Contact direct : <span className="text-brand-gold font-mono">{RESTAURANT_INFO.whatsapp}</span>
              </p>
            </div>
          </div>
          <span className="bg-emerald-500 hover:bg-emerald-400 text-white text-[8px] font-black uppercase tracking-wider px-3 py-2 rounded-xl transition-colors shrink-0 flex items-center justify-center gap-1 self-end sm:self-auto">
            Commander <ArrowRight size={10} />
          </span>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 px-1 text-[8px] sm:text-[9px] text-brand-brown/70 font-bold">
          <span>Ligne directe : <strong className="font-mono text-brand-brown">{RESTAURANT_INFO.whatsapp}</strong></span>
          <a
            href={RESTAURANT_INFO.whatsappCatalogUrl}
            target="_blank"
            rel="noreferrer"
            className="text-emerald-700 hover:text-emerald-600 underline font-black uppercase"
          >
            Catalogue WhatsApp séparé →
          </a>
        </div>
      </div>

      {/* PARTIE 1 : PLAT DU JOUR */}
      {platDuJour && platDuJour.isActive && (selectedTagFilter === 'ALL' || selectedTagFilter === 'PLAT_DU_JOUR') && selectedCategory === 'TOUT' && searchQuery === '' && (
        <div className="px-3.5 sm:px-6 mb-8 w-full min-w-0">
          <div className="flex items-center gap-2 mb-3 px-1">
            <span className="bg-brand-orange text-white text-[9px] font-black uppercase px-2.5 py-1 rounded-full shrink-0">1</span>
            <h3 className="text-xs sm:text-base font-black italic uppercase text-brand-brown tracking-wide truncate">
              Plat du Jour & Sélection Quotidienne
            </h3>
          </div>
          <MenuDuJourTrio
            items={items}
            onSelectItem={onSelectItem}
            isHomeView={false}
          />
        </div>
      )}

      {/* PARTIE 2 : INCONTOURNABLES & SPÉCIALITÉS PERMANENTES (Doukounou, Attiéké, Spécialités) */}
      {activeSection === 'CARTE' && selectedTagFilter === 'ALL' && selectedCategory === 'TOUT' && searchQuery === '' && permanentSpecialties.length > 0 && (
        <div className="px-3.5 sm:px-6 mb-10 w-full min-w-0">
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-2 min-w-0">
              <span className="bg-amber-600 text-white text-[9px] font-black uppercase px-2.5 py-1 rounded-full shrink-0">2</span>
              <div className="min-w-0">
                <h3 className="text-xs sm:text-base font-black italic uppercase text-brand-brown tracking-wide leading-tight">
                  Incontournables & Spécialités Permanentes
                </h3>
                <p className="text-[9px] sm:text-[10px] text-brand-brown/60 font-bold leading-snug">
                  Doukounou, Attiéké & grands classiques maison — toujours disponibles à la carte
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 sm:gap-4 w-full min-w-0">
            {permanentSpecialties.map((item) => {
              const isIncontournable = isDishIncontournable(item);
              return (
                <div
                  key={`perm-${item.id}`}
                  onClick={() => { playSound('pop'); onSelectItem(item); }}
                  className="min-w-0 bg-gradient-to-b from-amber-50/80 to-white rounded-[1.7rem] sm:rounded-[2rem] p-2.5 sm:p-3.5 border-2 border-amber-500/40 shadow-sm hover:shadow-md cursor-pointer flex flex-col justify-between transition-all active:scale-95"
                >
                  <div className="min-w-0">
                    <div className="relative h-24 sm:h-28 w-full mb-2 overflow-hidden rounded-xl sm:rounded-2xl">
                      <img src={item.image} className="w-full h-full object-cover" alt={item.name} />
                      <span className="absolute top-1.5 left-1.5 max-w-[calc(100%-0.75rem)] truncate bg-gradient-to-r from-amber-600 to-orange-600 text-white text-[7px] sm:text-[8px] font-black uppercase px-1.5 sm:px-2 py-0.5 rounded-full shadow flex items-center gap-1">
                        <Crown size={8} className="text-yellow-200 fill-yellow-200 shrink-0" />
                        <span className="truncate">{isIncontournable ? 'Carte Permanente' : 'Spécialité'}</span>
                      </span>
                    </div>
                    <h4 className="text-[10px] sm:text-[11px] font-black text-brand-brown uppercase italic leading-tight line-clamp-2 break-words">
                      {item.name}
                    </h4>
                  </div>
                  <div className="flex justify-between items-center gap-1.5 mt-2 pt-2 border-t border-amber-500/10 min-w-0">
                    <span className="text-[11px] sm:text-xs font-black text-brand-orange truncate">{item.price.toLocaleString('fr-FR')} F</span>
                    <div className="w-7 h-7 shrink-0 bg-brand-brown text-brand-gold rounded-xl flex items-center justify-center shadow">
                      <Plus size={14} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* PARTIE 3 : CARTE COMPLÈTE PAR CATÉGORIE */}
      <div className="px-4 sm:px-6 mb-3 flex items-center justify-between gap-2 w-full min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className="bg-brand-brown text-brand-gold text-[9px] font-black uppercase px-2.5 py-1 rounded-full shrink-0">3</span>
          <h3 className="text-xs sm:text-base font-black italic uppercase text-brand-brown tracking-wide truncate">
            {selectedCategory === 'TOUT' ? 'Carte Complète par Catégorie' : `Catégorie : ${selectedCategory}`}
          </h3>
        </div>
        <span className="text-[10px] font-mono font-bold text-brand-brown/60 shrink-0">{filteredItems.length} plats</span>
      </div>

      {/* Grid of Dishes with fluid scale and opacity animations */}
      <motion.div 
        layout
        className="px-3.5 sm:px-6 grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-5 w-full min-w-0"
      >
        <AnimatePresence mode="popLayout">
          {filteredItems.map((item, index) => {
             const isIncontournable = isDishIncontournable(item);
             const isPlatDuJour = isDishPlatDuJour(item);
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
                className={`min-w-0 bg-white rounded-[1.8rem] sm:rounded-[2.5rem] p-3 sm:p-4 shadow-sm relative group cursor-pointer h-full flex flex-col transition-all ${
                  isIncontournable 
                    ? 'border-2 border-amber-500/60 shadow-md ring-2 ring-amber-400/20 hover:border-amber-500 bg-gradient-to-b from-amber-500/[0.03] to-white' 
                    : 'border border-brand-brown/5'
                }`}
              >
                 <div className="relative h-28 sm:h-32 w-full mb-3 sm:mb-4 overflow-hidden rounded-[1.3rem] sm:rounded-[1.8rem] flex-shrink-0">
                    <img src={item.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={item.name} />
                    
                    {/* Top Left Tag Badge */}
                    <div className="absolute top-1.5 left-1.5 max-w-[calc(100%-2.5rem)] flex flex-col gap-1 items-start">
                       {isIncontournable && (
                          <span className="max-w-full truncate bg-gradient-to-r from-amber-600 via-orange-500 to-amber-600 text-white text-[7px] sm:text-[8px] font-black uppercase px-2 py-0.5 rounded-full shadow-lg flex items-center gap-1 border border-white/60">
                             <Crown size={8} className="text-yellow-200 fill-yellow-200 shrink-0" />
                             <span className="truncate">Incontournable</span>
                          </span>
                       )}
                       {isPlatDuJour && !isIncontournable && (
                          <span className="bg-amber-500/90 backdrop-blur-md text-white text-[7px] sm:text-[8px] font-black uppercase px-2 py-0.5 rounded-full shadow-md flex items-center gap-1 border border-white/40">
                             <Sun size={8} className="shrink-0" /> Jour
                          </span>
                       )}
                       {isSpecialite && !isPlatDuJour && !isIncontournable && (
                          <span className="bg-purple-600/90 backdrop-blur-md text-white text-[7px] sm:text-[8px] font-black uppercase px-2 py-0.5 rounded-full shadow-md flex items-center gap-1 border border-white/40">
                             <Sparkles size={8} className="shrink-0" /> Chef
                          </span>
                       )}
                       {isPromo && !isPlatDuJour && !isSpecialite && !isIncontournable && (
                          <span className="bg-amber-600/90 backdrop-blur-md text-white text-[7px] sm:text-[8px] font-black uppercase px-2 py-0.5 rounded-full shadow-md flex items-center gap-1 border border-white/40">
                             <Tag size={8} className="shrink-0" /> Éco
                          </span>
                       )}
                    </div>

                    {/* Top Right Badges (Spicy & Vegetarian) */}
                    <div className="absolute top-1.5 right-1.5 flex items-center gap-1">
                       {item.isSpicy && (
                          <div className="bg-rose-500 text-white p-1 sm:p-1.5 rounded-full shadow-lg border border-white" title="Épicé">
                             <Flame size={10} fill="white" />
                          </div>
                       )}
                       {item.isVegetarian && (
                          <div className="bg-emerald-500 text-white p-1 sm:p-1.5 rounded-full shadow-lg border border-white" title="Végétarien">
                             <Leaf size={10} fill="white" />
                          </div>
                       )}
                    </div>

                    {/* Rating or Best Badge */}
                    {item.rating === 5 && (
                      <div className="absolute bottom-1.5 left-1.5 bg-brand-gold text-brand-brown px-1.5 sm:px-2 py-0.5 rounded-lg text-[7px] sm:text-[8px] font-black flex items-center gap-1 border border-white shadow-md">
                         <Star size={8} fill="currentColor" /> BEST
                      </div>
                    )}
                 </div>
                 
                 <h4 className="text-[10px] sm:text-[11px] font-black text-brand-brown uppercase italic leading-tight mb-2 line-clamp-2 break-words flex-1">{item.name}</h4>
                 
                 <div className="flex justify-between items-center gap-1.5 mt-2 min-w-0">
                    <span className="text-[11px] sm:text-xs font-black text-brand-orange truncate">{item.price.toLocaleString('fr-FR')} F</span>
                    <div className="w-7 h-7 sm:w-8 sm:h-8 shrink-0 bg-brand-brown text-brand-gold rounded-xl flex items-center justify-center shadow-lg transition-transform group-hover:bg-brand-orange group-hover:text-white">
                       <Plus size={15} />
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
