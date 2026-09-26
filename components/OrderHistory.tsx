import React, { useState } from 'react';
import { Order, CartItem } from '../types';
import { 
  ShoppingBag, Clock, MapPin, ChevronRight, ChevronLeft, 
  X, CheckCircle2, Bike, CreditCard, ChevronDown, ChevronUp, 
  Utensils, Sparkles, AlertCircle, FileText, Printer, ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { playSound } from '../utils/audio';

interface OrderHistoryProps {
  orders: Order[];
  onNavigateToMenu?: () => void;
  onOpenLiveDriverMap?: () => void;
  itemsPerPage?: number;
}

// Helper to provide realistic ingredients for any dish if `includes` is missing
export const getDishIngredients = (item: CartItem): string[] => {
  if (item.includes && item.includes.length > 0) {
    return item.includes;
  }

  const nameLower = item.name.toLowerCase();
  const descLower = item.description ? item.description.toLowerCase() : '';

  if (nameLower.includes('tiep') || nameLower.includes('thiéboudienne') || nameLower.includes('riz au gras')) {
    return ['Riz parfumé au bouillon', 'Capitaine / Poisson frais', 'Sauce tomate cuisinée', 'Manioc, Carotte & Chou', 'Oignons & Ail', 'Piment vert & Citron'];
  }
  if (nameLower.includes('dambou') || descLower.includes('moringa')) {
    return ['Couscous de Moringa frais', 'Arachides pilonnées', 'Poulet fermier / Bœuf', 'Huile végétale fine', 'Piment vert & Oignons'];
  }
  if (nameLower.includes('alloco') || nameLower.includes('aloco')) {
    return ['Bananes plantains bien mûres', 'Huile de friture végétale', 'Sauce pimentée tomate-oignon', 'Sel fin du Niger'];
  }
  if (nameLower.includes('garba') || nameLower.includes('attiéké')) {
    return ['Attiéké de manioc vapeur', 'Thon rouge frit croustillant', 'Piment frais haché', 'Oignons blancs en dés', 'Huile de friture parfumée'];
  }
  if (nameLower.includes('yassa')) {
    return ['Poulet fermier mariné', 'Sauce oignons caramélisés', 'Moutarde & Citron vert', 'Riz cassé blanc parfumé', 'Poivre noir de Niamey'];
  }
  if (nameLower.includes('pastel')) {
    return ['Pâte dorée croustillante', 'Farce thon émietté ou bœuf', 'Persil & Oignons', 'Sauce piquante de la Chef'];
  }
  if (nameLower.includes('soupou') || nameLower.includes('gombo') || nameLower.includes('kandia')) {
    return ['Gombo frais pilonné', 'Crevettes & Poissons fumés', 'Morceaux de bœuf tendre', 'Huile de palme rouge fine', 'Riz blanc royal'];
  }
  if (nameLower.includes('bissap') || nameLower.includes('bouye') || nameLower.includes('gingembre') || nameLower.includes('tamarin')) {
    return ['Infusion naturelle bio', 'Feuilles de menthe fraîche', 'Jus d\'ananas ou miel sauvage', 'Sucre de canne', 'Eau purifiée glacée'];
  }
  if (nameLower.includes('dégué') || nameLower.includes('thiacry')) {
    return ['Granulés de mil vapeur', 'Lait caillé crémeux', 'Extrait de vanille & Miel', 'Noix de coco râpée'];
  }
  if (nameLower.includes('brochette') || nameLower.includes('suya') || nameLower.includes('grillade')) {
    return ['Filet de bœuf de Niamey', 'Épices Kankankan (Arachide & Piment)', 'Oignons crus croquants', 'Huile d\'arachide'];
  }

  // Fallback default ingredients
  return [
    'Ingrédients frais sélectionnés du marché',
    'Assaisonnement maison du Chef Khady',
    'Épices douces de la région',
    'Accompagnement traditionnel'
  ];
};

export const OrderHistory: React.FC<OrderHistoryProps> = ({ 
  orders, 
  onNavigateToMenu, 
  onOpenLiveDriverMap,
  itemsPerPage = 3 
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [expandedItemIds, setExpandedItemIds] = useState<Record<string, boolean>>({});

  const totalPages = Math.ceil(orders.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentOrders = orders.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      playSound('pop');
      setCurrentPage(newPage);
    }
  };

  const toggleExpandItem = (itemId: string) => {
    playSound('pop');
    setExpandedItemIds(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  const getStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'DELIVERED':
        return <span className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-[9px] font-black uppercase px-2.5 py-1 rounded-full flex items-center gap-1"><CheckCircle2 size={10} /> Livrée</span>;
      case 'DELIVERING':
        return <span className="bg-blue-500/10 text-blue-600 border border-blue-500/20 text-[9px] font-black uppercase px-2.5 py-1 rounded-full flex items-center gap-1 animate-pulse"><Bike size={10} /> En cours de livraison</span>;
      case 'PREPARING':
      case 'READY':
        return <span className="bg-amber-500/10 text-amber-600 border border-amber-500/20 text-[9px] font-black uppercase px-2.5 py-1 rounded-full flex items-center gap-1"><Utensils size={10} /> En cuisine</span>;
      case 'CONFIRMED':
      case 'RECEIVED':
        return <span className="bg-brand-orange/10 text-brand-orange border border-brand-orange/20 text-[9px] font-black uppercase px-2.5 py-1 rounded-full flex items-center gap-1"><Clock size={10} /> Reçue</span>;
      case 'CANCELLED':
        return <span className="bg-rose-500/10 text-rose-600 border border-rose-500/20 text-[9px] font-black uppercase px-2.5 py-1 rounded-full flex items-center gap-1"><AlertCircle size={10} /> Annulée</span>;
      default:
        return <span className="bg-gray-100 text-gray-600 text-[9px] font-black uppercase px-2.5 py-1 rounded-full">{status}</span>;
    }
  };

  if (orders.length === 0) {
    return (
      <div className="bg-white rounded-[2.8rem] p-8 text-center border border-gray-100 shadow-sm my-4">
        <div className="w-16 h-16 bg-brand-orange/10 text-brand-orange rounded-3xl flex items-center justify-center mx-auto mb-4">
          <ShoppingBag size={28} />
        </div>
        <h4 className="text-base font-black uppercase italic text-brand-brown">Aucune commande enregistrée</h4>
        <p className="text-[11px] text-gray-400 mt-1 max-w-xs mx-auto">
          Vous n'avez pas encore passé de commande. Découvrez notre carte gourmande pour goûter au festin des rois !
        </p>
        {onNavigateToMenu && (
          <button
            onClick={() => { playSound('pop'); onNavigateToMenu(); }}
            className="mt-5 bg-brand-brown text-brand-gold px-6 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-brand-orange hover:text-white active:scale-95 transition-all italic inline-flex items-center gap-2"
          >
            Découvrir le Menu <ArrowRight size={14} />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header section */}
      <div className="flex items-center justify-between px-2">
        <div>
          <h3 className="text-sm font-black uppercase italic text-brand-brown tracking-wider">
            Historique des Commandes 📜
          </h3>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            {orders.length} commande(s) au total • Cliquez pour voir le détail & les ingrédients
          </p>
        </div>
        
        {totalPages > 1 && (
          <div className="text-[10px] font-black text-brand-orange bg-brand-orange/10 px-3 py-1 rounded-full">
            Page {currentPage} / {totalPages}
          </div>
        )}
      </div>

      {/* Paginated Orders List */}
      <div className="space-y-3">
        {currentOrders.map((ord) => {
          const formattedDate = ord.timestamp 
            ? new Date(ord.timestamp).toLocaleDateString('fr-FR', {
                day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
              }) 
            : 'Date récente';

          return (
            <motion.div
              key={ord.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => { playSound('pop'); setSelectedOrder(ord); }}
              className="bg-white p-5 rounded-[2.2rem] shadow-sm border border-gray-100 hover:border-brand-orange/30 hover:shadow-md cursor-pointer active:scale-[0.98] transition-all group relative overflow-hidden"
            >
              {/* Top Row: Order ID & Status */}
              <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-brand-brown uppercase italic tracking-tight">
                    Commande #{ord.id}
                  </span>
                  <span className="text-[9px] font-bold text-gray-400">• {ord.items.reduce((sum, i) => sum + i.quantity, 0)} plat(s)</span>
                </div>
                {getStatusBadge(ord.status)}
              </div>

              {/* Items Summary preview */}
              <div className="space-y-1.5 mb-3">
                {ord.items.slice(0, 3).map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs font-bold text-gray-700">
                    <span className="truncate pr-2">• {item.quantity}x {item.name}</span>
                    <span className="text-brand-brown shrink-0">{item.price.toLocaleString()} F</span>
                  </div>
                ))}
                {ord.items.length > 3 && (
                  <p className="text-[9px] font-bold text-brand-orange italic">
                    + {ord.items.length - 3} autre(s) article(s)...
                  </p>
                )}
              </div>

              {/* Footer Row: Date, Payment method, Total */}
              <div className="flex items-center justify-between pt-2 text-[10px] font-bold text-gray-500">
                <div className="flex items-center gap-1 text-gray-400">
                  <Clock size={12} />
                  <span>{formattedDate}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-gray-50 text-brand-brown px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase border border-gray-100">
                    {ord.paymentMethod}
                  </span>
                  <span className="text-xs font-black text-brand-orange">
                    {ord.total.toLocaleString()} F CFA
                  </span>
                  <ChevronRight size={14} className="text-gray-300 group-hover:text-brand-orange transition-colors" />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2 px-2">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase flex items-center gap-1 transition-all ${
              currentPage === 1 
                ? 'bg-gray-100 text-gray-300 cursor-not-allowed' 
                : 'bg-white text-brand-brown border border-gray-200 shadow-sm hover:border-brand-orange active:scale-95'
            }`}
          >
            <ChevronLeft size={14} /> Précédent
          </button>

          <span className="text-xs font-black text-brand-brown italic">
            {currentPage} / {totalPages}
          </span>

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase flex items-center gap-1 transition-all ${
              currentPage === totalPages 
                ? 'bg-gray-100 text-gray-300 cursor-not-allowed' 
                : 'bg-white text-brand-brown border border-gray-200 shadow-sm hover:border-brand-orange active:scale-95'
            }`}
          >
            Suivant <ChevronRight size={14} />
          </button>
        </div>
      )}

      {/* Detailed Order Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <div 
            className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md p-0 sm:p-4 animate-fade-in"
            onClick={() => setSelectedOrder(null)}
          >
            <motion.div 
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white w-full max-w-xl rounded-t-[3rem] sm:rounded-[3.5rem] p-6 sm:p-8 shadow-2xl border border-gray-100 max-h-[88vh] overflow-y-auto space-y-6"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-black italic uppercase text-brand-brown tracking-tight">
                      Commande #{selectedOrder.id}
                    </h3>
                    {getStatusBadge(selectedOrder.status)}
                  </div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                    {selectedOrder.timestamp ? new Date(selectedOrder.timestamp).toLocaleString('fr-FR') : 'Commande enregistrée'}
                  </p>
                </div>

                <button 
                  onClick={() => { playSound('pop'); setSelectedOrder(null); }}
                  className="w-10 h-10 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-2xl flex items-center justify-center transition-colors shrink-0"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Customer & Address Card */}
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-2 text-xs">
                <div className="flex items-center justify-between text-brand-brown font-bold">
                  <span>Client : {selectedOrder.customerName}</span>
                  <span>{selectedOrder.phone}</span>
                </div>
                <div className="flex items-center gap-1.5 text-gray-500 font-medium">
                  <MapPin size={14} className="text-brand-orange shrink-0" />
                  <span>Quartier {selectedOrder.district} {selectedOrder.address ? `• ${selectedOrder.address}` : ''}</span>
                </div>
                <div className="flex items-center justify-between text-[11px] font-bold text-gray-600 pt-1 border-t border-gray-200/50">
                  <span>Paiement : <strong className="text-brand-brown uppercase">{selectedOrder.paymentMethod}</strong></span>
                  {selectedOrder.paymentTransactionId && (
                    <span className="text-brand-orange font-mono font-bold">Réf: {selectedOrder.paymentTransactionId}</span>
                  )}
                </div>
              </div>

              {/* Dishes & Detailed Ingredients Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-[11px] font-black uppercase text-brand-brown tracking-wider flex items-center gap-1.5">
                    <Utensils size={14} className="text-brand-orange" /> Plats Commandés & Ingrédients
                  </h4>
                  <span className="text-[9px] font-bold text-gray-400 uppercase">
                    Cliquez sur un plat pour ses ingrédients
                  </span>
                </div>

                <div className="space-y-3">
                  {selectedOrder.items.map((item, idx) => {
                    const ingredients = getDishIngredients(item);
                    const isExpanded = !!expandedItemIds[item.id || idx];

                    return (
                      <div 
                        key={item.id || idx} 
                        className="bg-brand-cream/30 p-4 rounded-2xl border border-brand-orange/15 space-y-2"
                      >
                        <div 
                          onClick={() => toggleExpandItem(item.id || `${idx}`)}
                          className="flex items-center justify-between cursor-pointer group"
                        >
                          <div className="flex items-center gap-3">
                            {item.image ? (
                              <img src={item.image} alt={item.name} className="w-12 h-12 rounded-xl object-cover shrink-0 border border-gray-200" />
                            ) : (
                              <div className="w-12 h-12 rounded-xl bg-brand-orange/10 text-brand-orange flex items-center justify-center shrink-0">
                                <Utensils size={18} />
                              </div>
                            )}
                            <div>
                              <h5 className="text-xs font-black uppercase text-brand-brown group-hover:text-brand-orange transition-colors">
                                {item.quantity}x {item.name}
                              </h5>
                              <p className="text-[10px] font-medium text-gray-500 line-clamp-1">
                                {item.description || 'Spécialité cuisinée avec soin par le Chef Khady'}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs font-black text-brand-orange">
                              {(item.price * item.quantity).toLocaleString()} F
                            </span>
                            {isExpanded ? <ChevronUp size={16} className="text-brand-orange" /> : <ChevronDown size={16} className="text-gray-400" />}
                          </div>
                        </div>

                        {/* Ingredients Breakdown */}
                        <AnimatePresence>
                          {(isExpanded || selectedOrder.items.length === 1) && (
                            <motion.div 
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="pt-2 border-t border-brand-orange/10 space-y-2"
                            >
                              <div className="flex items-center gap-1 text-[9px] font-black uppercase text-brand-orange tracking-widest">
                                <Sparkles size={11} /> Composition & Ingrédients du plat :
                              </div>

                              <div className="flex flex-wrap gap-1.5">
                                {ingredients.map((ing, ingIdx) => (
                                  <span 
                                    key={ingIdx}
                                    className="bg-white text-brand-brown border border-brand-brown/15 text-[9px] font-bold px-2.5 py-1 rounded-full shadow-2xs"
                                  >
                                    🌿 {ing}
                                  </span>
                                ))}
                              </div>

                              {item.instructions && (
                                <p className="text-[10px] font-bold text-amber-700 bg-amber-50 p-2 rounded-xl border border-amber-200">
                                  📝 Instruction client : "{item.instructions}"
                                </p>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Order Financial Summary */}
              <div className="bg-[#1A0F0D] text-white p-5 rounded-2xl space-y-2 text-xs">
                <div className="flex justify-between text-white/70">
                  <span>Sous-total plats</span>
                  <span className="font-bold">{selectedOrder.items.reduce((s, i) => s + i.price * i.quantity, 0).toLocaleString()} F</span>
                </div>
                <div className="flex justify-between text-white/70">
                  <span>Frais de livraison ({selectedOrder.district})</span>
                  <span className="font-bold">+{selectedOrder.deliveryFee?.toLocaleString() || 0} F</span>
                </div>
                <div className="pt-2 border-t border-white/10 flex justify-between items-center text-sm font-black text-brand-gold">
                  <span>TOTAL REGLÉ</span>
                  <span className="text-base">{selectedOrder.total.toLocaleString()} F CFA</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                {onOpenLiveDriverMap && selectedOrder.status !== 'DELIVERED' && selectedOrder.status !== 'CANCELLED' && (
                  <button
                    onClick={() => { playSound('pop'); setSelectedOrder(null); onOpenLiveDriverMap(); }}
                    className="flex-1 bg-brand-orange text-white py-3.5 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"
                  >
                    <Bike size={16} /> Suivre Livreur GPS 🗺️
                  </button>
                )}
                
                <button
                  onClick={() => { playSound('pop'); setSelectedOrder(null); }}
                  className="flex-1 bg-brand-brown text-brand-gold py-3.5 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all"
                >
                  Fermer
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OrderHistory;
