import React, { useState, useEffect } from 'react';
import { Order } from '../types';
import { Bike, MapPin, Navigation, Phone, MessageSquare, Clock, ShieldCheck, X, Zap, RefreshCw, Bell } from 'lucide-react';
import { playSound } from '../utils/audio';
import { BILLO_INFO, RESTAURANT_INFO } from '../constants';

interface LiveDriverMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  onOpenPushNotification?: () => void;
}

export const LiveDriverMapModal: React.FC<LiveDriverMapModalProps> = ({ isOpen, onClose, order, onOpenPushNotification }) => {
  const [driverPos, setDriverPos] = useState(25); // percentage along route
  const [etaMinutes, setEtaMinutes] = useState(14);
  const [speed, setSpeed] = useState(38); // km/h

  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setDriverPos(prev => {
        if (prev >= 95) {
          return 95;
        }
        return prev + 1.5;
      });

      setEtaMinutes(prev => (prev > 2 ? prev - 0.2 : 2));
      setSpeed(Math.floor(32 + Math.random() * 12));
    }, 1500);

    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen || !order) return null;

  const handleCallDriver = () => {
    playSound('pop');
    window.location.href = `tel:${BILLO_INFO.whatsappClean}`;
  };

  const handleWhatsAppDriver = () => {
    playSound('pop');
    const msg = `Bonjour Moussa (Billo Express) ! Je suis le destinataire de la commande Khady's #${order.id} à ${order.district}. Je voulais vérifier la position. Merci !`;
    window.open(`https://wa.me/${BILLO_INFO.whatsappClean}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-[#0F172A] text-white w-full max-w-lg rounded-[3.5rem] p-6 sm:p-8 shadow-2xl border-2 border-brand-orange/30 relative overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-brand-orange text-white flex items-center justify-center shadow-lg">
              <Bike size={22} className="animate-pulse" />
            </div>
            <div>
              <span className="text-[8px] font-black uppercase text-brand-gold tracking-[0.25em] block">SUIVI GPS EN DIRECT</span>
              <h3 className="text-lg font-black italic uppercase text-white leading-tight">
                Trajet Billo Express 🏍️
              </h3>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-9 h-9 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Live Vector Map View (Niamey Styled) */}
        <div className="relative w-full h-56 bg-[#1E293B] rounded-3xl overflow-hidden border border-white/10 shadow-inner mb-4 flex-shrink-0">
          
          {/* Simulated Map Grid / Roads */}
          <svg className="absolute inset-0 w-full h-full opacity-30" viewBox="0 0 400 200">
            {/* River Niger curve */}
            <path d="M 0,160 Q 150,110 400,180" fill="none" stroke="#38BDF8" strokeWidth="24" opacity="0.4" />
            <path d="M 0,160 Q 150,110 400,180" fill="none" stroke="#0284C7" strokeWidth="12" opacity="0.6" />

            {/* Main Roads */}
            <path d="M 50,20 Q 180,90 350,180" fill="none" stroke="#64748B" strokeWidth="8" strokeDasharray="6 4" />
            <path d="M 20,100 L 380,100" fill="none" stroke="#475569" strokeWidth="6" />
            <path d="M 200,10 L 200,190" fill="none" stroke="#475569" strokeWidth="6" />

            {/* Delivery Route Polyline */}
            <path d="M 60,60 C 150,60 220,120 340,140" fill="none" stroke="#F97316" strokeWidth="5" strokeDasharray="4 2" className="animate-pulse" />
          </svg>

          {/* Restaurant Marker (Khady's Food - Plateau) */}
          <div className="absolute left-[12%] top-[22%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10">
            <div className="bg-brand-brown text-brand-gold px-2 py-0.5 rounded-full text-[7px] font-black uppercase shadow-md border border-brand-gold/40 mb-1">
              Khady's (Grande Mosquée Kadafi)
            </div>
            <div className="w-8 h-8 rounded-full bg-brand-gold text-brand-brown flex items-center justify-center shadow-lg border-2 border-white animate-bounce">
              <MapPin size={16} />
            </div>
          </div>

          {/* Customer Destination Marker */}
          <div className="absolute left-[82%] top-[68%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10">
            <div className="bg-green-600 text-white px-2 py-0.5 rounded-full text-[7px] font-black uppercase shadow-md border border-white/40 mb-1">
              {order.district}
            </div>
            <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center shadow-lg border-2 border-white">
              <Navigation size={16} />
            </div>
          </div>

          {/* Moving Delivery Driver Icon */}
          <div 
            className="absolute top-[45%] -translate-x-1/2 -translate-y-1/2 transition-all duration-1000 ease-linear z-20 flex flex-col items-center"
            style={{ left: `${Math.min(82, Math.max(12, driverPos))}%` }}
          >
            <div className="bg-brand-orange text-white text-[7px] font-black px-2 py-0.5 rounded-md shadow-md whitespace-nowrap mb-1 animate-pulse border border-white/30">
              Moussa ({speed} km/h)
            </div>
            <div className="w-10 h-10 rounded-full bg-brand-orange text-white flex items-center justify-center shadow-[0_0_20px_rgba(249,115,22,0.8)] border-2 border-white">
              <Bike size={20} className="animate-bounce" />
            </div>
          </div>

          {/* Live Overlay Badge */}
          <div className="absolute top-3 right-3 bg-red-600/90 text-white px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-lg border border-red-400/30">
            <span className="w-2 h-2 rounded-full bg-white animate-ping"></span> Live GPS Niamey
          </div>

        </div>

        {/* ETA & Metrics */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-white/5 p-3 rounded-2xl border border-white/10 text-center">
            <span className="text-[7px] font-black uppercase text-white/50 block">Arrivée estimée</span>
            <span className="text-sm font-black text-brand-gold font-mono">{Math.ceil(etaMinutes)} min</span>
          </div>
          <div className="bg-white/5 p-3 rounded-2xl border border-white/10 text-center">
            <span className="text-[7px] font-black uppercase text-white/50 block">Vitesse</span>
            <span className="text-sm font-black text-green-400 font-mono">{speed} km/h</span>
          </div>
          <div className="bg-white/5 p-3 rounded-2xl border border-white/10 text-center">
            <span className="text-[7px] font-black uppercase text-white/50 block">Frais Livraison</span>
            <span className="text-sm font-black text-brand-orange font-mono">{order.deliveryFee} F</span>
          </div>
        </div>

        {/* Driver Profile & Actions */}
        <div className="bg-white/5 p-4 rounded-3xl border border-white/10 space-y-3 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img 
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100" 
                alt="Driver" 
                className="w-12 h-12 rounded-2xl object-cover border-2 border-brand-orange"
              />
              <div>
                <h4 className="font-black text-xs text-white uppercase italic">Moussa Diop</h4>
                <p className="text-[8px] text-white/60 font-mono">Billo Express • Moto Yam #227</p>
                <div className="flex items-center gap-1 text-[8px] text-brand-gold font-bold mt-0.5">
                  ★ 4.9 (120+ livraisons réussies)
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button 
                onClick={handleCallDriver}
                className="w-10 h-10 rounded-2xl bg-brand-gold text-brand-brown flex items-center justify-center shadow-lg active:scale-95 transition-all"
                title="Appeler le livreur"
              >
                <Phone size={18} />
              </button>
              <button 
                onClick={handleWhatsAppDriver}
                className="w-10 h-10 rounded-2xl bg-green-500 text-white flex items-center justify-center shadow-lg active:scale-95 transition-all"
                title="WhatsApp Livreur"
              >
                <MessageSquare size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Push Notification Subscribe Button */}
        {onOpenPushNotification && (
          <button
            onClick={() => { playSound('pop'); onOpenPushNotification(); }}
            className="w-full bg-brand-orange hover:bg-brand-gold text-white hover:text-brand-brown py-3 rounded-2xl font-black uppercase text-[9px] tracking-widest shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all mb-2 border border-brand-orange/40 shrink-0"
          >
            <Bell size={14} className="animate-bounce" /> Activer Notifications Push Delivery 🔔
          </button>
        )}

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full bg-white/10 hover:bg-white/20 text-white py-3.5 rounded-2xl font-black uppercase text-[9px] tracking-widest transition-all mt-auto shrink-0"
        >
          Fermer le suivi carte
        </button>

      </div>
    </div>
  );
};
