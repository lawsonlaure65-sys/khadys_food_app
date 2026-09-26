import React from 'react';
import { CartItem, MenuItem } from '../types';
import { ShoppingBag, MessageSquare, Zap, ArrowRight, ShieldCheck, Phone, CheckCircle2, Utensils } from 'lucide-react';
import { playSound } from '../utils/audio';

interface CommandeHubViewProps {
  cart: CartItem[];
  onOpenOnlineCart: () => void;
  onOpenWhatsAppCart: () => void;
  onNavigateToMenu: () => void;
}

export const CommandeHubView: React.FC<CommandeHubViewProps> = ({
  cart,
  onOpenOnlineCart,
  onOpenWhatsAppCart,
  onNavigateToMenu
}) => {
  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
  const totalPrice = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

  return (
    <div className="animate-fade-in p-4 sm:p-6 pb-36 max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <header className="flex justify-between items-center">
        <div>
          <span className="text-[9px] font-black uppercase text-brand-orange tracking-[0.3em] flex items-center gap-1.5 mb-1">
            <Zap size={14} className="animate-pulse" /> Espace Commande Express
          </span>
          <h2 className="text-3xl font-black italic uppercase text-brand-brown leading-none">
            PASSER MA <span className="text-brand-orange">COMMANDE</span>
          </h2>
        </div>
        <div className="w-12 h-12 bg-brand-orange text-white rounded-2xl flex items-center justify-center shadow-lg">
          <ShoppingBag size={22} />
        </div>
      </header>

      {/* Cart Summary Banner if items exist */}
      {totalItems > 0 ? (
        <div className="bg-brand-brown text-white p-6 rounded-[2.5rem] shadow-2xl border-2 border-brand-gold/30 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[8px] font-black uppercase text-brand-gold tracking-widest block">Votre Panier Actuel</span>
            <h3 className="text-xl font-black italic uppercase text-white">
              {totalItems} article{totalItems > 1 ? 's' : ''} • {totalPrice.toLocaleString()} F CFA
            </h3>
            <p className="text-[9px] text-white/60 font-bold uppercase">Choisissez votre mode de finalisation ci-dessous</p>
          </div>
          <button 
            onClick={onNavigateToMenu}
            className="bg-white/10 text-brand-gold px-4 py-2 rounded-2xl text-[9px] font-black uppercase hover:bg-white/20 transition-all border border-brand-gold/20"
          >
            Modifier
          </button>
        </div>
      ) : (
        <div className="bg-orange-50/60 p-6 rounded-[2.5rem] border border-orange-100 flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="font-black text-xs uppercase italic text-brand-brown">Votre panier est encore vide</h3>
            <p className="text-[9px] text-gray-500 font-medium">Explorez notre carte gourmande pour ajouter de délicieux plats</p>
          </div>
          <button 
            onClick={() => { playSound('pop'); onNavigateToMenu(); }}
            className="bg-brand-orange text-white px-5 py-2.5 rounded-2xl text-[9px] font-black uppercase italic shadow-md active:scale-95 transition-all flex items-center gap-1.5"
          >
            <Utensils size={14} /> Voir le Menu
          </button>
        </div>
      )}

      {/* Dual Command Modes Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Mode 1: Commande en Ligne Directe */}
        <div 
          onClick={() => { playSound('pop'); onOpenOnlineCart(); }}
          className="bg-white rounded-[3rem] p-8 shadow-xl border-2 border-transparent hover:border-brand-orange cursor-pointer group active:scale-95 transition-all flex flex-col justify-between space-y-6 relative overflow-hidden"
        >
          <div className="absolute -right-8 -top-8 w-28 h-28 bg-brand-orange/10 rounded-full blur-xl group-hover:bg-brand-orange/20 transition-colors"></div>
          
          <div className="space-y-4 relative z-10">
            <div className="w-14 h-14 bg-brand-orange text-white rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <Zap size={28} />
            </div>

            <div>
              <span className="bg-brand-orange/10 text-brand-orange text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-widest inline-block mb-2">
                Paiement & Suivi Intégré
              </span>
              <h3 className="text-xl font-black italic uppercase text-brand-brown leading-snug">
                1. Commande Directe en Ligne
              </h3>
              <p className="text-xs text-gray-500 font-medium mt-2 leading-relaxed">
                Validez sur l'application avec calcul automatique des frais de livraison Billo Express, suivi de statut et dépôt Mobile Money (MyNita, Amanata, Airtel, Moov, etc.).
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-brand-orange font-black text-xs uppercase italic group-hover:translate-x-1 transition-transform relative z-10">
            <span>Commander en Ligne</span>
            <ArrowRight size={18} />
          </div>
        </div>

        {/* Mode 2: Commande via WhatsApp Direct */}
        <div 
          onClick={() => { playSound('pop'); onOpenWhatsAppCart(); }}
          className="bg-white rounded-[3rem] p-8 shadow-xl border-2 border-transparent hover:border-green-500 cursor-pointer group active:scale-95 transition-all flex flex-col justify-between space-y-6 relative overflow-hidden"
        >
          <div className="absolute -right-8 -top-8 w-28 h-28 bg-green-500/10 rounded-full blur-xl group-hover:bg-green-500/20 transition-colors"></div>

          <div className="space-y-4 relative z-10">
            <div className="w-14 h-14 bg-green-500 text-white rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <MessageSquare size={28} />
            </div>

            <div>
              <span className="bg-green-100 text-green-700 text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-widest inline-block mb-2">
                Discussion Directe WhatsApp
              </span>
              <h3 className="text-xl font-black italic uppercase text-brand-brown leading-snug">
                2. Commande via WhatsApp
              </h3>
              <p className="text-xs text-gray-500 font-medium mt-2 leading-relaxed">
                Générez un message pré-rempli instantané avec le détail de votre commande et discutez en direct avec le service client Khady's Food (+227 74 44 16 21).
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-green-600 font-black text-xs uppercase italic group-hover:translate-x-1 transition-transform relative z-10">
            <span>Commander sur WhatsApp</span>
            <ArrowRight size={18} />
          </div>
        </div>
      </div>

      {/* Security & Speed guarantees */}
      <div className="bg-gray-50 p-6 rounded-[2.5rem] border border-gray-100 flex items-center gap-4">
        <ShieldCheck size={28} className="text-brand-orange shrink-0" />
        <div className="text-[10px] text-gray-600 font-bold uppercase space-y-0.5">
          <p className="text-brand-brown">Garantie Livraison Rapide Billo Express (25-45 mn)</p>
          <p className="text-gray-400">Paiement à la livraison ou dépôt Mobile Money avec reçu sécurisé</p>
        </div>
      </div>
    </div>
  );
};

export default CommandeHubView;
