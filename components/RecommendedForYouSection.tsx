import React, { useState, useEffect, useMemo } from 'react';
import { 
  Sparkles, RefreshCw, ShoppingBag, Heart, Flame, 
  ChefHat, ArrowRight, Zap, Check, Star, Utensils, Info
} from 'lucide-react';
import { MenuItem, Order } from '../types';
import { playSound } from '../utils/audio';
import { getPersonalizedRecommendations, RecommendationResult } from '../services/geminiService';

interface RecommendedForYouSectionProps {
  orders: Order[];
  items: MenuItem[];
  onSelectItem: (item: MenuItem) => void;
  onAddToCart?: (item: MenuItem) => void;
}

export const RecommendedForYouSection: React.FC<RecommendedForYouSectionProps> = ({
  orders,
  items,
  onSelectItem,
  onAddToCart
}) => {
  const [data, setData] = useState<RecommendationResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [addedItemId, setAddedItemId] = useState<string | null>(null);

  // Clé de cache stable pour éviter des requêtes répétées inutiles
  const cacheKey = useMemo(() => {
    return `khadys_gemini_recs_v1_${orders.length}_${items.length}`;
  }, [orders.length, items.length]);

  const fetchRecommendations = async (forceRefresh: boolean = false) => {
    setIsLoading(true);
    if (forceRefresh) {
      playSound('pop');
    }

    try {
      // Vérifier le cache de session
      if (!forceRefresh) {
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            if (parsed && Array.isArray(parsed.recommendations) && parsed.recommendations.length > 0) {
              setData(parsed);
              setIsLoading(false);
              return;
            }
          } catch {
            // cache invalide, continuer
          }
        }
      }

      const result = await getPersonalizedRecommendations(orders, items);
      setData(result);
      try {
        sessionStorage.setItem(cacheKey, JSON.stringify(result));
      } catch {
        // quota stockage
      }
    } catch (err) {
      console.error("Erreur lors de la génération des recommandations:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations(false);
  }, [cacheKey]);

  const handleAddToCart = (e: React.MouseEvent, dish: MenuItem) => {
    e.stopPropagation();
    playSound('pop');
    if (onAddToCart) {
      onAddToCart(dish);
      setAddedItemId(dish.id);
      setTimeout(() => setAddedItemId(null), 1800);
    } else {
      onSelectItem(dish);
    }
  };

  const hasOrders = orders.length > 0;

  return (
    <section className="px-4 sm:px-6 space-y-4 animate-fade-in" aria-label="Recommandé pour vous">
      {/* EN-TÊTE DE LA SECTION */}
      <div className="bg-gradient-to-r from-[#24130E] via-[#351A11] to-[#1C0B06] border-2 border-brand-gold/40 rounded-[2.5rem] p-5 sm:p-7 text-white shadow-2xl relative overflow-hidden backdrop-blur-md">
        
        {/* Lueur subtile en arrière-plan */}
        <div className="absolute top-0 right-0 w-56 h-56 bg-brand-gold/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-40 h-40 bg-brand-orange/15 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="p-1.5 rounded-xl bg-brand-gold/20 text-brand-gold border border-brand-gold/40 flex items-center justify-center">
                <Sparkles size={14} className="animate-spin-slow" />
              </span>
              <span className="text-[10px] font-black uppercase text-brand-gold tracking-[0.2em] italic">
                {data?.isAiGenerated ? "Propulsé par Gemini IA" : "Sélection Personnalisée"}
              </span>
              <span className="text-[8px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-black uppercase tracking-wider">
                {hasOrders ? `${orders.length} commande(s) analysée(s)` : "Découverte"}
              </span>
            </div>

            <h3 className="text-xl sm:text-2xl font-black italic uppercase tracking-tight text-white drop-shadow-sm flex items-center gap-2">
              Recommandé pour vous
            </h3>

            <p className="text-xs text-amber-100/80 font-medium max-w-xl mt-1">
              {hasOrders 
                ? "Plats sélectionnés sur-mesure d'après vos préférences culinaires et vos précédentes commandes."
                : "Les incontournables les plus plébiscités par nos clients pour débuter votre expérience gourmande."}
            </p>
          </div>

          {/* Bouton de rafraîchissement IA */}
          <button
            type="button"
            onClick={() => fetchRecommendations(true)}
            disabled={isLoading}
            className="self-start sm:self-center px-4 py-2.5 bg-brand-gold/15 hover:bg-brand-gold hover:text-brand-brown text-brand-gold border border-brand-gold/40 rounded-2xl text-[9px] font-black uppercase italic tracking-wider flex items-center gap-2 shadow-md active:scale-95 transition-all disabled:opacity-50"
            title="Générer de nouvelles suggestions"
          >
            <RefreshCw size={13} className={isLoading ? "animate-spin" : ""} />
            {isLoading ? "Analyse IA..." : "Rafraîchir"}
          </button>
        </div>

        {/* Profil gustatif identifié */}
        {data?.flavorProfile && !isLoading && (
          <div className="mt-4 pt-3.5 border-t border-brand-gold/20 flex items-center gap-2 text-[10px] sm:text-xs text-amber-200/90 font-medium italic">
            <span className="shrink-0 text-brand-gold font-black uppercase tracking-wider not-italic text-[9px] bg-black/40 px-2.5 py-1 rounded-lg border border-brand-gold/20">
              Profil Goût
            </span>
            <span className="truncate">
              « {data.flavorProfile} »
            </span>
          </div>
        )}
      </div>

      {/* GRILLE DES PLATS RECOMMANDÉS */}
      {isLoading ? (
        // SQUELETTE DE CHARGEMENT
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
          {[1, 2, 3].map((n) => (
            <div 
              key={n} 
              className="bg-[#1C0D08] border border-brand-gold/20 rounded-[2rem] p-4 space-y-3 animate-pulse"
            >
              <div className="w-full h-40 bg-white/5 rounded-2xl" />
              <div className="w-2/3 h-4 bg-white/10 rounded-md" />
              <div className="w-full h-8 bg-white/5 rounded-md" />
              <div className="w-1/3 h-4 bg-brand-gold/20 rounded-md" />
            </div>
          ))}
        </div>
      ) : data?.recommendations && data.recommendations.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
          {data.recommendations.map(({ dish, similarityReason, tag }) => (
            <div
              key={dish.id}
              onClick={() => {
                playSound('pop');
                onSelectItem(dish);
              }}
              className="group bg-gradient-to-b from-[#22120C] to-[#150A06] border border-brand-gold/30 hover:border-brand-gold/80 rounded-[2rem] p-3.5 sm:p-4 text-white shadow-xl hover:shadow-2xl transition-all duration-300 flex flex-col justify-between cursor-pointer relative overflow-hidden"
            >
              {/* Badge supérieur (Tag personnalisé de similitude) */}
              <div className="flex items-center justify-between gap-2 mb-2.5">
                <span className="bg-brand-orange text-white text-[8px] font-black uppercase px-2.5 py-1 rounded-full tracking-wider shadow-sm flex items-center gap-1">
                  <Sparkles size={10} /> {tag}
                </span>
                
                <span className="text-[10px] font-black text-brand-gold font-mono bg-black/40 px-2.5 py-0.5 rounded-full border border-brand-gold/30">
                  {dish.price.toLocaleString()} F CFA
                </span>
              </div>

              {/* Photo du plat avec zoom */}
              <div className="relative h-44 sm:h-48 rounded-2xl overflow-hidden mb-3 border border-white/10 bg-black/40">
                <img
                  src={dish.image}
                  alt={dish.name}
                  className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />

                {dish.rating && (
                  <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-md px-2 py-0.5 rounded-lg flex items-center gap-1 text-[9px] font-black text-amber-300 border border-white/10">
                    <Star size={10} fill="currentColor" /> {dish.rating}
                  </div>
                )}

                {dish.isSpicy && (
                  <div className="absolute bottom-2 right-2 bg-red-600/90 text-white px-2 py-0.5 rounded-lg text-[8px] font-black uppercase flex items-center gap-0.5 shadow-md">
                    <Flame size={10} /> Épicé
                  </div>
                )}
              </div>

              {/* Infos du plat */}
              <div className="space-y-1.5 flex-1">
                <span className="text-[9px] font-bold uppercase text-brand-gold/90 tracking-wider">
                  {dish.category}
                </span>
                <h4 className="text-sm font-black italic uppercase tracking-tight text-white group-hover:text-brand-gold transition-colors line-clamp-1">
                  {dish.name}
                </h4>
                <p className="text-[10px] text-gray-300 font-medium line-clamp-2 leading-relaxed">
                  {dish.description}
                </p>
              </div>

              {/* Explication personnalisée de l'IA Gemini */}
              <div className="my-3 p-2.5 bg-black/40 rounded-xl border border-brand-gold/20 text-[9.5px] text-amber-100/90 italic leading-snug">
                <span className="text-brand-gold font-bold not-italic block text-[8px] uppercase tracking-wider mb-0.5">
                  💡 Pourquoi pour vous :
                </span>
                « {similarityReason} »
              </div>

              {/* Bouton d'action rapide */}
              <div className="pt-1 flex items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => handleAddToCart(e, dish)}
                  className="w-full py-2.5 px-3 bg-brand-gold hover:bg-amber-300 text-brand-brown rounded-xl font-black text-[9px] uppercase italic tracking-wider flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all"
                >
                  {addedItemId === dish.id ? (
                    <>
                      <Check size={12} className="text-brand-brown" />
                      Ajouté !
                    </>
                  ) : (
                    <>
                      <ShoppingBag size={12} />
                      Commander
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-[#1C0D08] p-6 rounded-3xl text-center text-xs text-gray-400 border border-white/10">
          Consultez notre carte pour découvrir toutes les saveurs de Khady's Food.
        </div>
      )}
    </section>
  );
};
