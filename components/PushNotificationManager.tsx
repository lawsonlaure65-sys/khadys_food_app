import React, { useState, useEffect } from 'react';
import { Bell, ShieldCheck, Zap, Sparkles, CheckCircle2, X, Volume2, AlertCircle } from 'lucide-react';
import { playSound } from '../utils/audio';

interface PushNotificationManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const PushNotificationManager: React.FC<PushNotificationManagerProps> = ({
  isOpen,
  onClose,
  onShowToast
}) => {
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default'
  );
  const [notifyOrders, setNotifyOrders] = useState(true);
  const [notifyPromos, setNotifyPromos] = useState(true);
  const [notifyLoyalty, setNotifyLoyalty] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const requestPushPermission = async () => {
    playSound('pop');
    if (!('Notification' in window)) {
      onShowToast('Les notifications ne sont pas supportées sur ce navigateur.', 'error');
      return;
    }

    try {
      const res = await Notification.requestPermission();
      setPermission(res);
      if (res === 'granted') {
        playSound('notification');
        onShowToast('Notifications PUSH OWA activées avec succès ! 🔔', 'success');
        triggerTestNotification('Abonnement PUSH Validé !', 'Vous recevrez les alertes de cuisson et de livraison en direct.');
      } else {
        onShowToast('Permission Push refusée par le navigateur.', 'error');
      }
    } catch {
      onShowToast('Erreur lors de la demande de permission PUSH.', 'error');
    }
  };

  const triggerTestNotification = (title?: string, body?: string) => {
    playSound('notification');
    const notifTitle = title || "Khady's Food Niamey 🥘";
    const notifBody = body || "Votre commande #KH-2026 est en cours de cuisson par le Chef ! 👨‍🍳";

    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.ready.then(reg => {
            reg.showNotification(notifTitle, {
              body: notifBody,
              icon: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=128',
              badge: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=64',
              vibrate: [200, 100, 200]
            } as any);
          });
        } else {
          new Notification(notifTitle, { body: notifBody });
        }
      } catch {
        onShowToast(`🔔 PUSH: ${notifTitle} - ${notifBody}`, 'info');
      }
    } else {
      onShowToast(`🔔 Demo PUSH: ${notifTitle} - ${notifBody}`, 'info');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-[#140C0A] text-white w-full max-w-lg rounded-[3.5rem] p-6 sm:p-8 shadow-2xl border-2 border-brand-orange/30 relative overflow-hidden">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 w-9 h-9 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-all"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="text-center mb-6 pt-2">
          <div className="w-16 h-16 bg-brand-orange/20 text-brand-orange rounded-3xl flex items-center justify-center mx-auto mb-3 border border-brand-orange/30 shadow-lg">
            <Bell size={32} className="animate-bounce" />
          </div>
          <span className="text-[9px] font-black uppercase text-brand-gold tracking-[0.3em] inline-block mb-1">
            PWA & WEB PUSH SERVICE
          </span>
          <h3 className="text-2xl font-black italic uppercase text-white leading-none">
            OWA PUSH Notifications 🔔
          </h3>
          <p className="text-[10px] text-white/60 font-bold mt-1">
            Restez informé en temps réel du suivi de cuisson et de livraison !
          </p>
        </div>

        {/* Status Badge */}
        <div className="bg-white/5 p-4 rounded-3xl border border-white/10 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${permission === 'granted' ? 'bg-green-500 shadow-[0_0_10px_#22C55E]' : 'bg-amber-500'}`}></div>
            <div>
              <span className="text-[8px] font-black uppercase text-white/40 block">Statut Permission</span>
              <span className="text-xs font-black uppercase tracking-wider text-white">
                {permission === 'granted' ? 'PUSH Activé 🟢' : permission === 'denied' ? 'Bloqué 🔴' : 'Non configuré 🟡'}
              </span>
            </div>
          </div>

          {permission !== 'granted' && (
            <button
              onClick={requestPushPermission}
              className="bg-brand-orange hover:bg-brand-gold text-white hover:text-brand-brown px-4 py-2 rounded-2xl text-[9px] font-black uppercase shadow-lg active:scale-95 transition-all"
            >
              Autoriser PUSH
            </button>
          )}
        </div>

        {/* Preferences Toggles */}
        <div className="space-y-3 mb-6">
          <p className="text-[8px] font-black uppercase tracking-widest text-white/40">Catégories d'alertes :</p>

          {[
            { label: 'Suivi de Commande & Livreur Billo', state: notifyOrders, setter: setNotifyOrders, desc: 'Alerte cuisson, départ du livreur & arrivée.' },
            { label: 'Offres Flash & Menu du Jour (12h)', state: notifyPromos, setter: setNotifyPromos, desc: 'Réductions exclusives du Chef.' },
            { label: 'Gain de Points & Récompenses VIP', state: notifyLoyalty, setter: setNotifyLoyalty, desc: 'Multiplicateurs de points et cadeaux.' },
          ].map((item, idx) => (
            <div key={idx} className="bg-white/5 p-3.5 rounded-2xl border border-white/5 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-white uppercase">{item.label}</h4>
                <p className="text-[8px] text-white/50">{item.desc}</p>
              </div>
              <button
                type="button"
                onClick={() => { playSound('pop'); item.setter(!item.state); }}
                className={`w-12 h-6 rounded-full transition-colors relative p-1 ${item.state ? 'bg-brand-orange' : 'bg-white/20'}`}
              >
                <div className={`w-4 h-4 rounded-full bg-white transition-transform ${item.state ? 'translate-x-6' : 'translate-x-0'}`}></div>
              </button>
            </div>
          ))}
        </div>

        {/* Test Button */}
        <button
          onClick={() => triggerTestNotification()}
          className="w-full bg-white/10 hover:bg-white/20 text-brand-gold py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 border border-brand-gold/30 active:scale-95 transition-all italic mb-2"
        >
          <Sparkles size={16} /> Tester une notification PUSH en direct
        </button>

      </div>
    </div>
  );
};
