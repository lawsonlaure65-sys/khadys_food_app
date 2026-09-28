import React from 'react';
import { MenuItem } from '../types';
import { Sparkles, Clock, ShoppingBag, ArrowRight, CheckCircle2, Crown, Utensils } from 'lucide-react';
import { playSound } from '../utils/audio';

interface HomeSpecialSectionsProps {
  items: MenuItem[];
  onSelectItem: (item: MenuItem) => void;
  onAddToCart: (item: MenuItem, quantity: number, instructions: string) => void;
  onNavigateToMenu: (category?: string) => void;
}

export const HomeSpecialSections: React.FC<HomeSpecialSectionsProps> = ({
  items,
  onSelectItem,
  onAddToCart,
  onNavigateToMenu
}) => {
  // 1. Plats Signature de Khady (hors Doukounou / Attiéké qui ont leur section dédiée)
  const signatureDishes = React.useMemo(() => {
    const filtered = items.filter((it) => {
      if (!it) return false;
      const n = (it.name || '').toLowerCase();
      if (n.includes('doukounou') || n.includes('attiéké') || n.includes('attieke')) return false;
      return it.isSpécialitéMaison || it.category === 'Spécialité Maison';
    });
    return filtered.slice(0, 3);
  }, [items]);

  // 2. Formules "Déjeuner Complet" du Midi (Entrée + Plat + Boisson)
  const dejeunerFormulas: MenuItem[] = React.useMemo(() => {
    const fromMenu = items.filter((it) => it && it.category === 'Déjeuner').slice(0, 3);
    if (fromMenu.length >= 3) return fromMenu;
    return [
      {
        id: 'formule-midi-tiep',
        name: 'Formule Midi Tiep Royal + Pastels + Bissap',
        description: '4 Pastels croustillants en entrée + Tiep Rouge au Capitaine braisé + 1 Jus de Bissap glacé 50cl.',
        price: 5500,
        category: 'Déjeuner',
        image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800',
        rating: 5,
        isAvailable: true,
        isPromo: true
      },
      {
        id: 'formule-midi-yassa',
        name: 'Formule Midi Poulet Yassa + Alloco + Gingembre',
        description: 'Portion d\'Alloco doré + Poulet fermier braisé Yassa aux oignons confits + 1 Jus de Gingembre frais 50cl.',
        price: 5000,
        category: 'Déjeuner',
        image: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=800',
        rating: 5,
        isAvailable: true,
        isPromo: true
      },
      {
        id: 'formule-midi-dibi',
        name: 'Formule Midi Dibi d\'Agneau + Frites d\'Igname + Bouye',
        description: 'Salade fraîcheur + Dibi d\'agneau grillé au feu de bois & épices kankankan + 1 Jus de Baobab Bouye 50cl.',
        price: 6500,
        category: 'Déjeuner',
        image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800',
        rating: 5,
        isAvailable: true,
        isPromo: true
      }
    ];
  }, [items]);

  return (
    <div className="space-y-8 mb-10 w-full min-w-0">
      {/* 1. LES PLATS SIGNATURE DE KHADY */}
      {signatureDishes.length > 0 && (
        <section className="rounded-[2.2rem] sm:rounded-[2.5rem] bg-gradient-to-b from-[#1E1410] via-[#160E0B] to-[#120A08] border-2 border-brand-gold/30 p-4 sm:p-6 shadow-2xl space-y-5 w-full min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-brand-orange text-white text-[9px] sm:text-[10px] font-black uppercase tracking-wider shadow flex items-center gap-1">
                  <Crown size={12} className="shrink-0" /> Savoir-Faire Royal
                </span>
                <span className="text-[10px] font-bold text-brand-gold flex items-center gap-1">
                  <Sparkles size={12} className="shrink-0" /> Secrets des Marmites
                </span>
              </div>
              <h3 className="text-lg sm:text-2xl font-black italic uppercase text-white mt-1.5 leading-tight">
                LES PLATS <span className="text-brand-gold">SIGNATURE DE KHADY</span>
              </h3>
              <p className="text-[11px] sm:text-xs text-white/70 mt-1 max-w-xl">
                Nos créations emblématiques mijotées au feu de bois avec des produits nobles frais de Niamey.
              </p>
            </div>
            <button
              onClick={() => {
                playSound('pop');
                onNavigateToMenu('Spécialité Maison');
              }}
              className="text-[10px] sm:text-xs font-black italic uppercase text-brand-gold hover:text-brand-orange transition-colors flex items-center gap-1 self-start sm:self-end shrink-0"
            >
              <span>Voir toutes les spécialités</span>
              <ArrowRight size={14} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
            {signatureDishes.map((dish) => (
              <div
                key={dish.id}
                onClick={() => {
                  playSound('pop');
                  onSelectItem(dish);
                }}
                className="rounded-3xl bg-[#221612] hover:bg-[#2A1B16] border border-brand-gold/25 p-3.5 sm:p-4 space-y-3 cursor-pointer transition-all shadow-xl group flex flex-col justify-between min-w-0"
              >
                <div className="space-y-2.5 min-w-0">
                  <div className="relative rounded-2xl overflow-hidden h-36 bg-black/40">
                    <img
                      src={dish.image}
                      alt={dish.name}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <span className="absolute top-2 left-2 px-2.5 py-0.5 rounded-full bg-black/80 backdrop-blur-sm text-brand-gold border border-brand-gold/30 text-[8px] font-black uppercase">
                      👑 Signature
                    </span>
                    <div className="absolute bottom-2 right-2 px-2.5 py-1 rounded-xl bg-brand-orange text-white font-black text-[10px] shadow-md">
                      {dish.price.toLocaleString('fr-FR')} F CFA
                    </div>
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-black italic uppercase text-white text-xs sm:text-sm group-hover:text-brand-gold transition-colors truncate">
                      {dish.name}
                    </h4>
                    <p className="text-[10px] text-white/70 mt-1 line-clamp-2 leading-relaxed">
                      {dish.description}
                    </p>
                  </div>
                </div>

                <div className="pt-2.5 border-t border-white/10 flex items-center justify-between gap-2">
                  <span className="text-[9px] text-white/60 font-bold flex items-center gap-1">
                    <Clock size={11} className="text-brand-gold shrink-0" /> 25 min
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddToCart(dish, 1, '');
                    }}
                    className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-brand-orange to-amber-500 text-white font-black text-[9px] uppercase tracking-wider flex items-center gap-1 shadow active:scale-95 transition-transform shrink-0"
                  >
                    <ShoppingBag size={12} />
                    <span>+ Panier</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 2. LES FORMULES "DÉJEUNER COMPLET" DU MIDI */}
      <section className="rounded-[2.2rem] sm:rounded-[2.5rem] bg-gradient-to-b from-[#1E1915] via-[#17120E] to-[#110D0A] border-2 border-brand-gold/35 p-4 sm:p-6 shadow-2xl space-y-5 w-full min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-brand-gold text-brand-brown text-[9px] sm:text-[10px] font-black uppercase tracking-wider shadow">
                ☀️ FORMULES DU MIDI (11H30 - 15H00)
              </span>
              <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                <CheckCircle2 size={12} className="shrink-0" /> Entrée + Plat + Boisson
              </span>
            </div>
            <h3 className="text-lg sm:text-2xl font-black italic uppercase text-white mt-1.5 leading-tight">
              LES "DÉJEUNER COMPLET" <span className="text-brand-gold">DU SAHEL</span>
            </h3>
            <p className="text-[11px] sm:text-xs text-white/70 mt-1 max-w-xl">
              Votre formule tout-en-un pour la pause déjeuner au bureau ou à domicile : entrée dorée, plat chaud mijoté et boisson naturelle 50cl.
            </p>
          </div>
          <button
            onClick={() => {
              playSound('pop');
              onNavigateToMenu('Déjeuner');
            }}
            className="text-[10px] sm:text-xs font-black italic uppercase text-brand-orange hover:text-brand-gold transition-colors flex items-center gap-1 self-start sm:self-end shrink-0"
          >
            <span>Voir les formules midi</span>
            <ArrowRight size={14} />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
          {dejeunerFormulas.map((formula) => (
            <div
              key={formula.id}
              onClick={() => {
                playSound('pop');
                onSelectItem(formula);
              }}
              className="rounded-3xl bg-[#1C1613] hover:bg-[#241B17] border border-brand-gold/25 p-3.5 sm:p-4 space-y-3 cursor-pointer transition-all shadow-xl flex flex-col justify-between min-w-0"
            >
              <div className="space-y-2.5 min-w-0">
                <div className="relative rounded-2xl overflow-hidden h-36 bg-black/40">
                  <img
                    src={formula.image}
                    alt={formula.name}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 left-2 px-2.5 py-0.5 rounded-full bg-emerald-950/90 text-emerald-300 border border-emerald-500/40 text-[8px] font-black uppercase">
                    🍱 Entrée + Plat + Boisson
                  </div>
                </div>
                <div className="min-w-0">
                  <h4 className="font-black italic uppercase text-white text-xs sm:text-sm line-clamp-1">
                    {formula.name}
                  </h4>
                  <p className="text-[10px] text-white/70 mt-1 line-clamp-2 leading-relaxed">
                    {formula.description}
                  </p>
                </div>
                <div className="p-2.5 rounded-xl bg-black/40 border border-white/10 space-y-1 text-[9px] text-white/80">
                  <span className="font-black uppercase text-brand-gold block">Inclus dans la formule :</span>
                  <div className="truncate">🥗 Entrée : Pastels ou Alloco doré</div>
                  <div className="truncate">🍲 Plat : Cuisiné frais du jour</div>
                  <div className="truncate">🍹 Boisson : Bissap ou Gingembre 50cl</div>
                </div>
              </div>

              <div className="pt-2.5 border-t border-white/10 flex items-center justify-between gap-2">
                <span className="text-xs sm:text-sm font-black text-brand-gold truncate">
                  {formula.price.toLocaleString('fr-FR')} F CFA
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddToCart(formula, 1, 'Formule Déjeuner Complet');
                  }}
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-brand-orange to-amber-500 text-white font-black text-[9px] uppercase tracking-wider flex items-center gap-1 shadow active:scale-95 transition-transform shrink-0"
                >
                  <Utensils size={12} />
                  <span>Commander</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default HomeSpecialSections;
