import React, { useEffect, useState } from 'react';
import { Order } from '../types';
import { 
  Bell, CheckCircle2, MessageSquare, Volume2, Sparkles, 
  ChefHat, Bike, Send, ShieldCheck, X, ArrowRight, PhoneCall, UserCheck
} from 'lucide-react';
import { playSound } from '../utils/audio';
import { RESTAURANT_INFO, BILLO_INFO } from '../constants';
import { 
  buildCustomerConfirmationMessage, 
  buildKitchenOrderMessage, 
  buildBilloDispatchMessage, 
  openWhatsApp,
  getStoredRestaurantWhatsApp
} from '../utils/whatsapp';

interface OrderNotificationModalProps {
  order: Order | null;
  onClose: () => void;
  onTrackOrder?: () => void;
  onOpenPushNotification?: () => void;
}

export const OrderNotificationModal: React.FC<OrderNotificationModalProps> = ({ 
  order, 
  onClose, 
  onTrackOrder, 
  onOpenPushNotification 
}) => {
  const [customerNotified, setCustomerNotified] = useState(false);
  const [kitchenNotified, setKitchenNotified] = useState(false);
  const [billoNotified, setBilloNotified] = useState(false);

  if (!order) return null;

  const currentRestaurant = getStoredRestaurantWhatsApp();

  useEffect(() => {
    // Play dual notification sounds on mount
    playSound('orderAlert');
    const timer = setTimeout(() => {
      playSound('cash');
    }, 400);
    return () => clearTimeout(timer);
  }, [order]);

  const replaySound = () => {
    playSound('orderAlert');
  };

  const handleNotifyCustomer = () => {
    playSound('pop');
    const msg = buildCustomerConfirmationMessage(order);
    openWhatsApp(order.phone, msg);
    setCustomerNotified(true);
  };

  const handleNotifyKitchen = () => {
    playSound('pop');
    const msg = buildKitchenOrderMessage(order);
    openWhatsApp(currentRestaurant.clean, msg);
    setKitchenNotified(true);
  };

  const handleNotifyBillo = () => {
    playSound('pop');
    const msg = buildBilloDispatchMessage(order);
    openWhatsApp(BILLO_INFO.whatsappClean, msg);
    setBilloNotified(true);
  };

  const handleSendAll = () => {
    playSound('pop');
    // First open customer notification
    handleNotifyCustomer();
    // Then open kitchen notification after short delay
    setTimeout(() => {
      handleNotifyKitchen();
    }, 600);
  };

  const handleDirectCall = () => {
    playSound('pop');
    window.location.href = `tel:${RESTAURANT_INFO.directLineClean}`;
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 sm:p-6 animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-lg bg-[#160D0A] rounded-[3.5rem] border-4 border-brand-gold/40 p-6 sm:p-8 shadow-[0_25px_60px_rgba(255,179,0,0.3)] text-white overflow-hidden my-auto">
        
        {/* Animated Background Rays */}
        <div className="absolute -top-20 -left-20 w-60 h-60 bg-brand-orange/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-20 -right-20 w-60 h-60 bg-brand-gold/20 rounded-full blur-3xl animate-pulse"></div>

        {/* Close Button */}
        <button 
          onClick={onClose} 
          className="absolute top-6 right-6 w-10 h-10 bg-white/10 text-white/60 hover:text-white hover:bg-white/20 rounded-full flex items-center justify-center transition-all z-20"
        >
          <X size={20} />
        </button>

        {/* Header Alert Badge */}
        <div className="text-center relative z-10 mb-6">
          <div className="relative inline-block mb-3">
            {/* Animated Pulsing Rings */}
            <div className="absolute inset-0 bg-brand-orange/40 rounded-full animate-ping opacity-75"></div>
            <div className="relative w-20 h-20 rounded-full bg-gradient-to-tr from-brand-orange to-brand-gold flex items-center justify-center text-brand-brown shadow-2xl mx-auto border-4 border-white">
              <ChefHat size={38} className="animate-bounce-subtle" />
            </div>
            <div className="absolute -bottom-1 -right-1 bg-green-500 text-white p-1.5 rounded-full border-2 border-white shadow-lg">
              <CheckCircle2 size={16} />
            </div>
          </div>

          <span className="bg-brand-gold/20 text-brand-gold px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.25em] inline-flex items-center gap-2 border border-brand-gold/30">
            <Sparkles size={12} className="animate-spin" /> Double Notification Active !
          </span>

          <h3 className="text-2xl font-black italic uppercase text-white mt-2 leading-none">
            Commande Confirmée
          </h3>
          <p className="text-[11px] text-brand-gold font-mono font-bold mt-1">
            Réf : #{order.id} • {order.customerName}
          </p>
        </div>

        {/* Action Rapide : Double Notification Directe */}
        <div className="mb-5 relative z-10">
          <button 
            onClick={handleSendAll}
            className="w-full bg-gradient-to-r from-emerald-600 via-green-500 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white py-3.5 px-4 rounded-2xl font-black uppercase text-xs tracking-wider shadow-[0_10px_25px_rgba(16,185,129,0.35)] flex items-center justify-center gap-2.5 active:scale-95 transition-all border border-emerald-400/40"
          >
            <MessageSquare size={18} />
            <span>Envoyer la Double Notification WhatsApp 📲</span>
          </button>
        </div>

        {/* 3 Notification Cards */}
        <div className="space-y-3 relative z-10 mb-6">
          
          {/* 1. NOTIFICATION CLIENT WHATSAPP AUTOMATIQUE */}
          <div className="bg-emerald-950/60 p-4 rounded-3xl border border-emerald-500/40 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shrink-0">
                  <UserCheck size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h4 className="font-black text-xs text-emerald-300 uppercase italic">1. Notification WhatsApp Client</h4>
                    {customerNotified && <span className="text-[8px] bg-emerald-500 text-white px-2 py-0.5 rounded-full font-bold">Envoyé</span>}
                  </div>
                  <p className="text-[9px] text-emerald-100 font-mono font-bold">{order.phone} ({order.customerName})</p>
                </div>
              </div>
              <button 
                onClick={handleNotifyCustomer}
                className="bg-emerald-500 hover:bg-emerald-400 text-white px-3.5 py-2 rounded-xl text-[9px] font-black uppercase flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
              >
                <Send size={12} /> Confirmer au Client
              </button>
            </div>
            <p className="text-[9px] text-emerald-200/80 italic pl-13 border-t border-emerald-500/20 pt-1.5">
              💬 Message : « Vos Cheffes s'activent pour la préparation... »
            </p>
          </div>

          {/* 2. NOTIFICATION CUISINE / RESTAURANT */}
          <div className="bg-green-950/60 p-4 rounded-3xl border border-green-500/40 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-green-600 text-white flex items-center justify-center shadow-lg shrink-0">
                  <ChefHat size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h4 className="font-black text-xs text-green-300 uppercase italic">2. Transmettre à la Cuisine</h4>
                    {kitchenNotified && <span className="text-[8px] bg-green-500 text-white px-2 py-0.5 rounded-full font-bold">Envoyé</span>}
                  </div>
                  <p className="text-[9px] text-green-200/90 font-mono font-bold">{currentRestaurant.display}</p>
                </div>
              </div>
              <button 
                onClick={handleNotifyKitchen}
                className="bg-green-600 hover:bg-green-500 text-white px-3.5 py-2 rounded-xl text-[9px] font-black uppercase flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
              >
                <Send size={12} /> Cuisine
              </button>
            </div>
          </div>

          {/* 3. NOTIFICATION LIVREUR BILLO EXPRESS */}
          <div className="bg-orange-950/60 p-4 rounded-3xl border border-brand-orange/40 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-brand-orange text-white flex items-center justify-center shadow-lg shrink-0">
                  <Bike size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h4 className="font-black text-xs text-brand-gold uppercase italic">3. Livreur Billo Express</h4>
                    {billoNotified && <span className="text-[8px] bg-brand-orange text-white px-2 py-0.5 rounded-full font-bold">Envoyé</span>}
                  </div>
                  <p className="text-[9px] text-brand-gold/90 font-mono font-bold">{BILLO_INFO.whatsapp}</p>
                </div>
              </div>
              <button 
                onClick={handleNotifyBillo}
                className="bg-brand-orange hover:bg-brand-orange/80 text-white px-3.5 py-2 rounded-xl text-[9px] font-black uppercase flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
              >
                <Send size={12} /> Livreur
              </button>
            </div>
          </div>

          {/* 4. ALERTE SONORE & VOCAL */}
          <div className="bg-white/5 p-3 rounded-2xl border border-white/10 flex items-center justify-between text-[10px]">
            <div className="flex items-center gap-2">
              <Volume2 size={16} className="text-brand-gold" />
              <span className="text-white/80 font-bold">Sonnette carillon & vibreur activés</span>
            </div>
            <button
              onClick={replaySound}
              className="text-brand-gold hover:underline font-black uppercase text-[9px]"
            >
              Rejouer son
            </button>
          </div>

        </div>

        {/* Order Details Preview */}
        <div className="bg-black/40 p-4 rounded-3xl border border-white/10 space-y-2 mb-6 relative z-10 text-[10px]">
          <div className="flex justify-between text-white/50 uppercase font-black text-[8px]">
            <span>Client : {order.customerName}</span>
            <span>Tél : {order.phone}</span>
          </div>
          <div className="flex justify-between text-white font-bold border-b border-white/5 pb-2">
            <span>Destination ({order.district}) :</span>
            <span className="text-white/70 truncate max-w-[180px]">{order.address || 'Au restaurant'}</span>
          </div>
          <div className="pt-1">
            <p className="text-[8px] font-black text-brand-gold uppercase mb-1">Articles commandés :</p>
            <div className="space-y-1">
              {order.items.map((it, idx) => (
                <div key={idx} className="flex justify-between text-white/80 font-mono text-[9px]">
                  <span>• {it.quantity}x {it.name}</span>
                  <span>{it.price * it.quantity} F CFA</span>
                </div>
              ))}
            </div>
          </div>
          <div className="pt-3 border-t border-white/10 flex justify-between items-center">
            <span className="font-black uppercase text-white">Total Net à Payer :</span>
            <span className="text-sm font-black text-brand-gold">{order.total + order.deliveryFee} F CFA</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 relative z-10">
          <button 
            onClick={() => {
              playSound('pop');
              onClose();
              if (onTrackOrder) onTrackOrder();
            }}
            className="w-full bg-brand-orange text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest italic shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            Suivre ma commande en direct <ArrowRight size={16} />
          </button>

          {onOpenPushNotification && (
            <button 
              onClick={() => {
                playSound('pop');
                onOpenPushNotification();
              }}
              className="w-full bg-brand-gold/20 hover:bg-brand-gold text-brand-gold hover:text-brand-brown py-3 rounded-2xl font-black uppercase text-[9px] tracking-widest flex items-center justify-center gap-2 border border-brand-gold/30 active:scale-95 transition-all"
            >
              <Bell size={14} className="animate-bounce" /> S'abonner aux Notifications Push Livreur 🔔
            </button>
          )}
          
          <button 
            onClick={onClose}
            className="w-full bg-white/10 text-white/60 hover:text-white py-3 rounded-2xl font-black uppercase text-[9px] tracking-widest transition-colors"
          >
            Fermer la fenêtre
          </button>
        </div>

      </div>
    </div>
  );
};

export default OrderNotificationModal;
