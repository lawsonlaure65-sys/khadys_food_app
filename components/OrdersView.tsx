import React from 'react';
import { Order } from '../types';
import OrderTracking from './OrderTracking';
import { PackageCheck, ArrowRight, Utensils, Clock, CheckCircle2, ChevronRight, ShoppingBag, Truck } from 'lucide-react';
import { playSound } from '../utils/audio';

interface OrdersViewProps {
  orders: Order[];
  onUpdateOrder?: (updatedOrder: Order) => void;
  onGoToMenu: () => void;
}

export const OrdersView: React.FC<OrdersViewProps> = ({ orders, onUpdateOrder, onGoToMenu }) => {
  const activeOrders = orders.filter(o => o.status !== 'DELIVERED' && o.status !== 'CANCELLED');
  const pastOrders = orders.filter(o => o.status === 'DELIVERED' || o.status === 'CANCELLED');

  return (
    <div className="animate-fade-in p-4 sm:p-6 pb-36 max-w-3xl mx-auto space-y-6">
      {/* Header View */}
      <div className="bg-gradient-to-r from-brand-brown via-[#3D2116] to-[#1C0D08] p-6 sm:p-8 rounded-[2.5rem] text-white shadow-2xl border-2 border-brand-gold/40 relative overflow-hidden">
        <div className="relative z-10 flex items-center justify-between">
          <div className="space-y-1">
            <span className="bg-brand-gold/20 text-brand-gold border border-brand-gold/30 text-[8px] sm:text-[9px] font-black px-3 py-1 rounded-full uppercase italic tracking-widest">
              Espace Client Niamey
            </span>
            <h2 className="text-2xl sm:text-3xl font-black italic uppercase text-white tracking-tight">
              Mes Commandes & Suivi
            </h2>
            <p className="text-[10px] sm:text-xs text-amber-100/80 font-medium italic">
              Consultez l'état de préparation et suivez le livreur Billo en direct.
            </p>
          </div>
          <div className="w-12 h-12 sm:w-14 sm:h-14 bg-brand-gold text-brand-brown rounded-2xl flex items-center justify-center font-black shadow-lg shrink-0">
            <PackageCheck size={26} />
          </div>
        </div>
      </div>

      {/* Empty State */}
      {orders.length === 0 && (
        <div className="bg-white p-8 sm:p-12 rounded-[3rem] text-center shadow-xl border border-gray-100 space-y-4">
          <div className="w-20 h-20 bg-brand-cream/80 text-brand-brown rounded-3xl flex items-center justify-center mx-auto shadow-inner border border-brand-brown/10">
            <ShoppingBag size={36} />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-black italic uppercase text-brand-brown">
              Aucune commande enregistrée
            </h3>
            <p className="text-xs text-gray-400 font-medium max-w-sm mx-auto">
              Vous n'avez pas encore passé de commande. Découvrez notre menu savoureux et faites-vous livrer en un clic !
            </p>
          </div>
          <button
            onClick={() => { playSound('pop'); onGoToMenu(); }}
            className="px-8 py-4 bg-brand-orange hover:bg-orange-600 text-white rounded-2xl font-black uppercase italic text-xs tracking-wider shadow-lg active:scale-95 transition-all inline-flex items-center gap-2"
          >
            <Utensils size={16} /> Parcourir la Carte →
          </button>
        </div>
      )}

      {/* Commandes En Cours (Active Orders) */}
      {activeOrders.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center gap-2 px-2">
            <div className="p-2 bg-brand-orange/10 rounded-xl text-brand-orange">
              <Truck size={20} className="animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase text-brand-brown italic tracking-wider">
                Commandes En Cours ({activeOrders.length})
              </h3>
              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">
                Mise à jour en temps réel par la cuisine
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {activeOrders.map((order) => (
              <OrderTracking
                key={order.id}
                order={order}
                onUpdateOrder={onUpdateOrder}
                onComplete={() => {}}
              />
            ))}
          </div>
        </div>
      )}

      {/* Historique des Commandes Passées */}
      {pastOrders.length > 0 && (
        <div className="space-y-4 pt-4">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-gray-100 rounded-xl text-brand-brown">
                <Clock size={18} />
              </div>
              <h3 className="text-xs font-black uppercase text-brand-brown italic tracking-wider">
                Historique ({pastOrders.length})
              </h3>
            </div>
          </div>

          <div className="space-y-3">
            {pastOrders.map((order) => (
              <div
                key={order.id}
                className="bg-white p-5 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:shadow-md transition-shadow"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-brand-brown uppercase italic">
                      #{order.id}
                    </span>
                    <span className={`text-[8px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                      order.status === 'DELIVERED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {order.status === 'DELIVERED' ? 'Livrée 🍽️' : 'Annulée'}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-500 font-bold">
                    {order.timestamp || 'Commande complétée'}
                  </p>
                  <div className="text-xs font-bold text-gray-700 line-clamp-1">
                    {order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                  <span className="text-sm font-black text-brand-orange">
                    {order.total + order.deliveryFee} F CFA
                  </span>
                  <button
                    onClick={() => { playSound('pop'); onGoToMenu(); }}
                    className="px-4 py-2 bg-brand-cream hover:bg-brand-brown hover:text-brand-gold text-brand-brown rounded-xl text-[9px] font-black uppercase italic transition-all flex items-center gap-1"
                  >
                    Recommander <ChevronRight size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
