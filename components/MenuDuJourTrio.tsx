import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Sun, Sparkles, Gift, ArrowRight, MessageSquare, Flame, 
  Utensils, CheckCircle2, ShoppingBag, Clock, Heart, Award
} from 'lucide-react';
import { MenuItem, MenuCategory } from '../types';
import { 
  getStoredPlatDuJour, MenuDuJourConfig, MenuDuJourDishItem, 
  DEFAULT_MENU_DU_JOUR_DISHES 
} from '../utils/marketing';
import { RESTAURANT_INFO } from '../constants';
import { playSound } from '../utils/audio';

interface MenuDuJourTrioProps {
  items: MenuItem[];
  onSelectItem: (item: MenuItem) => void;
  onAddToCart?: (item: MenuItem, quantity?: number, instructions?: string) => void;
  isHomeView?: boolean;
}

export const MenuDuJourTrio: React.FC<MenuDuJourTrioProps> = ({
  items,
  onSelectItem,
  onAddToCart,
  isHomeView = false
}) => {
  const [menuDuJour, setMenuDuJour] = useState<MenuDuJourConfig>(() => getStoredPlatDuJour());
  const [selectedSlot, setSelectedSlot] = useState<number>(0);

  // Écoute en temps réel des mises à jour faites par l'Administrateur
  useEffect(() => {
    const handleUpdate = (e: any) => {
      if (e?.detail) {
        setMenuDuJour(e.detail);
      } else {
        setMenuDuJour(getStoredPlatDuJour());
      }
    };
    window.addEventListener('khadys_plat_du_jour_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('khadys_plat_du_jour_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  if (!menuDuJour || !menuDuJour.isActive) {
    return null;
  }

  const dishesList: MenuDuJourDishItem[] = (menuDuJour.dishes && menuDuJour.dishes.length >= 3)
    ? menuDuJour.dishes
    : [
        {
          id: 'dish-1-spotlight',
          type: 'PLAT_DU_JOUR',
          dishName: menuDuJour.dishName || DEFAULT_MENU_DU_JOUR_DISHES[0].dishName,
          badgeLabel: '🍲 Plat Cuisiné du Jour',
          badgeColor: 'bg-brand-orange text-white',
          tagline: menuDuJour.tagline || DEFAULT_MENU_DU_JOUR_DISHES[0].tagline,
          description: menuDuJour.description || DEFAULT_MENU_DU_JOUR_DISHES[0].description,
          accompaniments: menuDuJour.accompaniments || DEFAULT_MENU_DU_JOUR_DISHES[0].accompaniments,
          price: menuDuJour.price || DEFAULT_MENU_DU_JOUR_DISHES[0].price,
          promoPrice: menuDuJour.promoPrice || DEFAULT_MENU_DU_JOUR_DISHES[0].promoPrice,
          dishImage: menuDuJour.dishImage || DEFAULT_MENU_DU_JOUR_DISHES[0].dishImage,
          remainingStock: menuDuJour.remainingStock || 25,
          isDailyPermanent: false,
          isAvailable: true
        },
        DEFAULT_MENU_DU_JOUR_DISHES[1],
        DEFAULT_MENU_DU_JOUR_DISHES[2]
      ];

  const handleDishClick = (dish: MenuDuJourDishItem, index: number) => {
    playSound('pop');
    setSelectedSlot(index);
    const effectivePrice = dish.promoPrice || dish.price;
    
    // Rechercher dans les items du menu ou fabriquer un item complet
    const match = items.find(i => i.name.toLowerCase().includes(dish.dishName.toLowerCase())) || {
      id: `menu-du-jour-${dish.id || index}`,
      name: dish.dishName,
      description: `${dish.description}${dish.accompaniments ? ` • Accompagnement : ${dish.accompaniments}` : ''}`,
      price: effectivePrice,
      category: 'Menu du Jour' as MenuCategory,
      image: dish.dishImage || 'https://images.unsplash.com/photo-1544025162-d76694265947?w=1000',
      isPlatDuJour: true,
      isAvailable: true,
      rating: 4.9,
      reviewsCount: 42
    };

    onSelectItem(match);
  };

  const handleWhatsAppOrder = (e: React.MouseEvent, dish: MenuDuJourDishItem) => {
    e.stopPropagation();
    playSound('pop');
    const priceText = (dish.promoPrice || dish.price).toLocaleString('fr-FR');
    const message = `Salam Khady's Food ! Je souhaite commander votre Menu du Jour : *${dish.dishName}* (${priceText} F CFA). Merci de me confirmer la disponibilité et le délai de livraison à Niamey !`;
    const url = `https://wa.me/${RESTAURANT_INFO.whatsappClean}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <section className="mb-10 w-full" id="section-menu-du-jour-trio">
      <div className="bg-gradient-to-br from-[#1C0D09] via-[#2A130D] to-[#120704] rounded-[2.5rem] p-5 sm:p-7 border-2 border-brand-gold/40 shadow-2xl relative overflow-hidden">
        {/* Glow ambient de fond */}
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-brand-orange/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-brand-gold/15 rounded-full blur-3xl pointer-events-none" />

        {/* En-tête du Menu du Jour */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 mb-5 border-b border-brand-gold/20 relative z-10">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-brand-orange text-white text-[9px] font-black uppercase px-3 py-1 rounded-full shadow-lg flex items-center gap-1.5 animate-pulse">
                <Sun size={12} className="animate-spin-slow" /> Menu du Jour
              </span>
              <span className="bg-brand-gold/20 text-brand-gold text-[9px] font-black uppercase px-3 py-1 rounded-full border border-brand-gold/30 flex items-center gap-1">
                👑 Le Trio Gourmand Quotidien
              </span>
              <span className="text-[10px] text-white/70 font-mono font-bold bg-white/5 px-2.5 py-0.5 rounded-lg border border-white/10">
                {menuDuJour.targetDayLabel || (menuDuJour.publicationTiming === 'TONIGHT_FOR_TOMORROW' ? 'Demain Midi' : "Aujourd'hui Midi")}
              </span>
            </div>

            <h3 className="text-xl sm:text-2xl font-black italic uppercase text-white tracking-wide">
              {menuDuJour.title || 'Notre Menu du Jour — 3 Plats d\'Exception'}
            </h3>
            <p className="text-xs text-white/75 font-medium max-w-xl">
              {menuDuJour.tagline || 'Chaque jour, savourez notre plat cuisiné maison + nos deux incontournables Doukounou & Attiéké !'}
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto bg-black/50 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-brand-gold/30 text-[10px] font-bold text-brand-gold">
            <Gift size={14} className="text-brand-orange animate-bounce" />
            <span>3 Emplacements Cuisinés Frais</span>
          </div>
        </div>

        {/* Grille des 3 Emplacements Distincts (Plat Cuisiné + Doukounou + Attiéké) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 relative z-10">
          {dishesList.map((dish, index) => {
            const effectivePrice = dish.promoPrice || dish.price;
            const hasPromo = dish.promoPrice && dish.promoPrice < dish.price;
            const isFirstDish = index === 0;

            return (
              <motion.div
                key={dish.id || index}
                whileHover={{ y: -4, scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleDishClick(dish, index)}
                className={`rounded-[2rem] p-4 border transition-all cursor-pointer flex flex-col justify-between group relative overflow-hidden backdrop-blur-md ${
                  isFirstDish 
                    ? 'bg-gradient-to-b from-[#2A140E]/90 to-[#1A0C08]/90 border-brand-orange/50 shadow-xl shadow-brand-orange/10 hover:border-brand-orange' 
                    : 'bg-black/45 border-brand-gold/25 hover:border-brand-gold shadow-lg hover:bg-black/60'
                }`}
              >
                {/* Visual Accent Top Bar */}
                <div className={`h-1 w-16 rounded-full mb-3 ${
                  index === 0 ? 'bg-brand-orange' : index === 1 ? 'bg-amber-500' : 'bg-emerald-500'
                }`} />

                <div className="space-y-3">
                  {/* Photo avec Badges */}
                  <div className="relative h-36 sm:h-40 w-full rounded-2xl overflow-hidden border border-white/10 bg-black/40">
                    <img
                      src={dish.dishImage || 'https://images.unsplash.com/photo-1544025162-d76694265947?w=1000'}
                      alt={dish.dishName}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />

                    {/* Emplacement Badge */}
                    <div className={`absolute top-2 left-2 text-[9px] font-black uppercase px-2.5 py-1 rounded-full shadow-md backdrop-blur-md ${
                      dish.badgeColor || (index === 0 ? 'bg-brand-orange text-white' : index === 1 ? 'bg-amber-600 text-white' : 'bg-emerald-600 text-white')
                    }`}>
                      {dish.badgeLabel || (index === 0 ? '🍲 Plat Cuisiné du Jour' : index === 1 ? '🌽 Doukounou Quotidien' : '🐟 Attiéké Royal')}
                    </div>

                    {/* Stock restant */}
                    {dish.remainingStock && (
                      <div className="absolute bottom-2 right-2 bg-black/75 backdrop-blur-md text-brand-gold text-[8px] font-mono font-black px-2 py-0.5 rounded-lg border border-brand-gold/30">
                        {dish.remainingStock} restants
                      </div>
                    )}

                    {/* Numéro Emplacement 1, 2, 3 */}
                    <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/70 border border-white/20 text-white text-[10px] font-black flex items-center justify-center">
                      #{index + 1}
                    </div>
                  </div>

                  {/* Titre & Descriptions */}
                  <div>
                    <h4 className="text-sm sm:text-base font-black italic uppercase text-white leading-snug group-hover:text-brand-gold transition-colors line-clamp-1">
                      {dish.dishName}
                    </h4>

                    {dish.tagline && (
                      <p className="text-[10px] text-brand-gold/90 font-semibold italic mt-0.5 line-clamp-1">
                        "{dish.tagline}"
                      </p>
                    )}

                    <p className="text-[10px] text-white/75 line-clamp-2 leading-relaxed mt-1.5">
                      {dish.description}
                    </p>

                    {dish.accompaniments && (
                      <div className="mt-2 p-2 bg-white/5 rounded-xl border border-white/10 text-[9px] text-brand-gold font-bold flex items-center gap-1.5">
                        <Gift size={12} className="text-brand-orange shrink-0" />
                        <span className="truncate">Inclus : {dish.accompaniments}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Pied de Carte : Prix & Boutons d'Action */}
                <div className="pt-3 mt-4 border-t border-white/10 flex items-center justify-between gap-2">
                  <div>
                    {hasPromo && (
                      <span className="text-[9px] text-white/45 line-through block font-mono">
                        {dish.price.toLocaleString('fr-FR')} F
                      </span>
                    )}
                    <span className="text-sm sm:text-base font-black text-brand-orange font-mono">
                      {effectivePrice.toLocaleString('fr-FR')} F CFA
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Bouton WhatsApp direct */}
                    <button
                      type="button"
                      onClick={(e) => handleWhatsAppOrder(e, dish)}
                      className="w-8 h-8 rounded-xl bg-emerald-600/30 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/40 flex items-center justify-center active:scale-90 transition-all"
                      title="Commander sur WhatsApp"
                    >
                      <MessageSquare size={14} />
                    </button>

                    {/* Bouton Voir / Choisir */}
                    <button
                      type="button"
                      className="bg-brand-orange hover:bg-orange-600 text-white px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider shadow-md active:scale-95 transition-all flex items-center gap-1 group-hover:bg-brand-gold group-hover:text-brand-brown"
                    >
                      <span>Commander</span>
                      <ArrowRight size={11} />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Footer info & Citation de la Cheffe */}
        {menuDuJour.chefQuote && (
          <div className="mt-5 pt-4 border-t border-brand-gold/15 flex flex-col sm:flex-row items-center justify-between gap-3 text-white/70 text-[10px] relative z-10">
            <div className="flex items-center gap-2">
              <span className="text-base">👩🏾‍🍳</span>
              <span className="italic font-medium">"{menuDuJour.chefQuote}" — <strong>Cheffe Khady</strong></span>
            </div>
            <div className="flex items-center gap-2 text-brand-gold font-mono font-bold">
              <Clock size={12} />
              <span>Livraison express à Niamey de 11h30 à 15h00</span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
