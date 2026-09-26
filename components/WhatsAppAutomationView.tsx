import React, { useState } from 'react';
import { MessageSquare, Send, CheckCircle2, PhoneCall, Copy, ShieldCheck, Zap, Bike } from 'lucide-react';
import { CartItem, UserProfile } from '../types';
import { playSound } from '../utils/audio';
import { RESTAURANT_INFO, BILLO_INFO } from '../constants';

interface WhatsAppAutomationProps {
  cart: CartItem[];
  userProfile: UserProfile;
  onNavigateToCart: () => void;
  onNavigateToMenu: () => void;
}

export const WhatsAppAutomationView: React.FC<WhatsAppAutomationProps> = ({ cart, userProfile }) => {
  const [district, setDistrict] = useState('Grande Mosquée / Zongo');
  const [paymentType, setPaymentType] = useState('Mynita');
  const [copied, setCopied] = useState(false);

  const totalCart = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

  // Generate automated message for Khady's Food
  const generateWhatsAppText = () => {
    let msg = `*Salam Khady's Food ! Je souhaite passer commande sur WhatsApp :*\n\n`;
    if (cart.length > 0) {
      msg += `*MON PANIER :*\n`;
      cart.forEach((i) => {
        msg += `• ${i.quantity}x ${i.name} (${i.price * i.quantity} F)\n`;
      });
      msg += `\n*TOTAL PANIER :* ${totalCart} F CFA\n`;
    } else {
      msg += `*DEMANDE :* Je souhaite recevoir le menu du jour et passer commande.\n`;
    }
    msg += `*CLIENT :* ${userProfile.name || 'Client Khady'}\n`;
    msg += `*TÉLÉPHONE :* ${userProfile.phone || '+227 90 00 00 00'}\n`;
    msg += `*QUARTIER :* ${district}\n`;
    msg += `*MODE DE PAIEMENT :* ${paymentType} (Preuve / Capture de dépôt prête)\n\n`;
    msg += `Merci de confirmer ma commande ! 🥘`;
    return msg;
  };

  const handleOpenRestaurantWhatsApp = () => {
    playSound('cash');
    const text = encodeURIComponent(generateWhatsAppText());
    const url = `https://wa.me/${RESTAURANT_INFO.whatsappClean}?text=${text}`;
    window.open(url, '_blank');
  };

  const handleOpenBilloWhatsApp = () => {
    playSound('pop');
    let msg = `*Bonjour Billo Express ! Demande d'information livraison Khady's Food*\n\n`;
    msg += `*Quartier client :* ${district}\n`;
    msg += `*Téléphone client :* ${userProfile.phone || '+227'}\n`;
    msg += `Merci de me donner les détails de livraison ! 🏍️`;
    const url = `https://wa.me/${BILLO_INFO.whatsappClean}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  const handleCopyText = () => {
    playSound('pop');
    navigator.clipboard.writeText(generateWhatsAppText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="animate-fade-in p-4 sm:p-6 pb-36 max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <header className="flex justify-between items-center">
        <div>
          <span className="text-[9px] font-black uppercase text-green-600 tracking-[0.3em] flex items-center gap-1.5 mb-1">
            <Zap size={14} className="animate-pulse text-green-500" /> Commande WhatsApp Directe
          </span>
          <h2 className="text-3xl font-black italic uppercase text-brand-brown leading-none">
            COMMANDE <span className="text-green-600">WHATSAPP</span>
          </h2>
        </div>
        <div className="w-12 h-12 bg-green-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/20">
          <MessageSquare size={24} />
        </div>
      </header>

      {/* Official Contact Info Box */}
      <div className="bg-gradient-to-r from-[#1A0F0D] to-[#2B1814] text-white p-6 rounded-[2.5rem] border-2 border-brand-gold/30 shadow-xl space-y-4">
        <h3 className="text-brand-gold font-black uppercase italic text-xs tracking-widest flex items-center gap-2">
          <ShieldCheck size={18} /> Contacts Officiels Khady's & Billo Express
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[10px]">
          <div className="bg-white/5 p-3 rounded-2xl border border-white/10">
            <span className="text-white/50 font-black uppercase text-[8px] block">WhatsApp Cuisine</span>
            <span className="font-mono font-black text-green-400 text-xs">{RESTAURANT_INFO.whatsapp}</span>
          </div>
          <div className="bg-white/5 p-3 rounded-2xl border border-white/10">
            <span className="text-white/50 font-black uppercase text-[8px] block">Ligne Directe Appels</span>
            <span className="font-mono font-black text-brand-gold text-xs">{RESTAURANT_INFO.directLine}</span>
          </div>
          <div className="bg-white/5 p-3 rounded-2xl border border-white/10">
            <span className="text-white/50 font-black uppercase text-[8px] block">Livreur Billo Express</span>
            <span className="font-mono font-black text-brand-orange text-xs">{BILLO_INFO.whatsapp}</span>
          </div>
        </div>
      </div>

      {/* Bot Automation Card */}
      <div className="bg-[#0B141A] text-white p-8 rounded-[3.5rem] shadow-2xl border-4 border-green-500/20 relative overflow-hidden">
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-white/10">
          <div className="w-12 h-12 bg-green-500 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg">
            K
          </div>
          <div>
            <h3 className="font-black text-sm italic uppercase text-white flex items-center gap-2">
              Khady's WhatsApp Official <CheckCircle2 size={16} className="text-green-400" />
            </h3>
            <span className="text-[9px] font-bold text-green-400 uppercase tracking-widest flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span> {RESTAURANT_INFO.whatsapp}
            </span>
          </div>
        </div>

        {/* Live Message Preview */}
        <div className="bg-[#121B22] p-6 rounded-3xl border border-white/5 font-mono text-[11px] leading-relaxed text-green-200 whitespace-pre-line mb-6">
          {generateWhatsAppText()}
        </div>

        {/* Options controls */}
        <div className="space-y-4 mb-8">
          <div>
            <label className="text-[9px] font-black uppercase tracking-widest text-white/50 block mb-2">Quartier de livraison</label>
            <select 
              value={district} 
              onChange={(e) => setDistrict(e.target.value)}
              className="w-full bg-[#1F2C34] p-4 rounded-2xl text-white font-bold text-xs outline-none border border-white/10"
            >
              <option value="Grande Mosquée / Zongo">Grande Mosquée / Zongo (Quartier Proche - 1000f)</option>
              <option value="Boukoki">Boukoki (Quartier Proche - 1000f)</option>
              <option value="Wadata">Wadata (Quartier Proche - 1000f)</option>
              <option value="Plateau">Plateau (Quartier Proche - 1000f)</option>
              <option value="Kouara Kano">Kouara Kano (Périphérie / Lointain - 1500f)</option>
              <option value="Goudel">Goudel (Périphérie / Lointain - 1500f)</option>
              <option value="Niamey 2000">Niamey 2000 (Périphérie / Lointain - 1500f)</option>
              <option value="Aéroport">Aéroport (Périphérie / Lointain - 1500f)</option>
            </select>
          </div>

          <div>
            <label className="text-[9px] font-black uppercase tracking-widest text-white/50 block mb-2">Mode de Paiement Préféré</label>
            <select 
              value={paymentType} 
              onChange={(e) => setPaymentType(e.target.value)}
              className="w-full bg-[#1F2C34] p-4 rounded-2xl text-white font-bold text-xs outline-none border border-white/10"
            >
              <option value="Mynita">Mynita (Mobile Money)</option>
              <option value="Amanata">Amanata (Mobile Money)</option>
              <option value="All-Iza">All-Iza (Mobile Money)</option>
              <option value="Zeynab">Zeynab (Mobile Money)</option>
              <option value="Airtel Money">Airtel Money</option>
              <option value="Moov Money">Moov / Flooz</option>
              <option value="Espèces">Espèces à la livraison</option>
            </select>
          </div>
        </div>

        {/* Main Actions */}
        <div className="space-y-3">
          <button 
            onClick={handleOpenRestaurantWhatsApp}
            className="w-full bg-green-500 hover:bg-green-600 text-white py-5 rounded-2xl font-black uppercase italic shadow-[0_10px_30px_rgba(34,197,94,0.4)] flex items-center justify-center gap-3 active:scale-95 transition-all text-xs tracking-wider"
          >
            <Send size={20} /> Commander au Restaurant ({RESTAURANT_INFO.whatsapp})
          </button>

          <button 
            onClick={handleOpenBilloWhatsApp}
            className="w-full bg-brand-orange hover:bg-brand-orange/90 text-white py-4 rounded-2xl font-black uppercase italic shadow-md flex items-center justify-center gap-3 active:scale-95 transition-all text-xs tracking-wider"
          >
            <Bike size={20} /> Contacter Livreur Billo Express ({BILLO_INFO.whatsapp})
          </button>

          <button 
            onClick={handleCopyText}
            className="w-full bg-white/10 text-white py-4 rounded-2xl font-black uppercase italic text-[10px] flex items-center justify-center gap-2 hover:bg-white/20 transition-all"
          >
            <Copy size={16} /> {copied ? 'Texte copié !' : 'Copier le message pour plus tard'}
          </button>
        </div>
      </div>

      {/* Benefits */}
      <div className="grid grid-cols-2 gap-4 text-center">
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <ShieldCheck size={28} className="text-green-500 mx-auto mb-2" />
          <h4 className="font-black text-xs text-brand-brown uppercase italic">Paiement Sécurisé</h4>
          <p className="text-[9px] text-gray-400 font-bold mt-1">Validation immédiate par capture de reçu</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <PhoneCall size={28} className="text-brand-orange mx-auto mb-2" />
          <h4 className="font-black text-xs text-brand-brown uppercase italic">Appel Vocal Direct</h4>
          <p className="text-[9px] text-gray-400 font-bold mt-1">Ligne Directe : {RESTAURANT_INFO.directLine}</p>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppAutomationView;
