
import React, { useState, useEffect } from 'react';
import { Order, OrderStatus } from '../types';
import { playSound } from '../utils/audio';
import { Clock, CheckCircle2, ChefHat, Bike, PackageCheck, Box, Bell, MapPin, Navigation, Zap, MessageSquare } from 'lucide-react';

interface OrderTrackingProps {
  order: Order;
  onComplete: () => void;
  onOpenLiveDriverMap?: () => void;
  onOpenPushNotification?: () => void;
}

const steps: { status: OrderStatus; label: string; icon: any; sound: any }[] = [
  { status: 'RECEIVED', label: 'Reçue', icon: Box, sound: 'pop' },
  { status: 'CONFIRMED', label: 'Confirmée', icon: CheckCircle2, sound: 'notification' },
  { status: 'PREPARING', label: 'En Cuisine', icon: ChefHat, sound: 'notification' },
  { status: 'READY', label: 'Emballée !', icon: PackageCheck, sound: 'success' },
  { status: 'DELIVERING', label: 'En Livraison', icon: Bike, sound: 'delivery' },
  { status: 'DELIVERED', label: 'Livrée 🍽️', icon: Zap, sound: 'success' }
];

const OrderTracking: React.FC<OrderTrackingProps> = ({ order, onComplete, onOpenLiveDriverMap, onOpenPushNotification }) => {
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [billoPos, setBilloPos] = useState(0);

  useEffect(() => {
    const actualIdx = steps.findIndex(s => s.status === order.status);
    if (actualIdx !== -1) {
      setCurrentStepIdx(actualIdx);
      if (order.status === 'DELIVERED') onComplete();
    }
  }, [order.status]);

  useEffect(() => {
    if (steps[currentStepIdx].status === 'DELIVERING') {
      const interval = setInterval(() => {
        setBilloPos(prev => (prev < 100 ? prev + 1 : 100));
      }, 300);
      return () => clearInterval(interval);
    }
  }, [currentStepIdx]);

  const isDelivered = order.status === 'DELIVERED';

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-white p-10 rounded-[4rem] shadow-2xl border border-brand-brown/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-brand-orange/5 rounded-full -mr-20 -mt-20"></div>
        
        <div className="flex justify-between items-center mb-10 relative z-10">
           <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] mb-1 italic">Statut Khady's</p>
              <h3 className="text-2xl font-black italic text-brand-brown uppercase tracking-tighter">{order.id}</h3>
           </div>
           <div className="w-14 h-14 bg-brand-brown rounded-[1.8rem] flex items-center justify-center text-brand-gold shadow-xl border-4 border-white animate-pulse">
              {isDelivered ? <CheckCircle2 size={28} /> : <Navigation size={28} />}
           </div>
        </div>

        <div className="space-y-8 relative z-10">
           {steps.map((step, idx) => {
              const isCompleted = idx < currentStepIdx;
              const isCurrent = idx === currentStepIdx;
              const Icon = step.icon;

              return (
                 <div key={idx} className={`flex items-center gap-6 transition-all duration-1000 ${isCurrent ? 'scale-110 opacity-100' : isCompleted ? 'opacity-40' : 'opacity-10'}`}>
                    <div className="relative">
                       {idx < steps.length - 1 && (
                         <div className={`absolute left-1/2 -translate-x-1/2 top-full w-0.5 h-8 ${isCompleted ? 'bg-brand-orange' : 'bg-gray-100'}`}></div>
                       )}
                       <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border-4 transition-all duration-500 ${isCurrent || isCompleted ? 'bg-brand-orange text-white border-white shadow-2xl' : 'bg-gray-50 text-gray-300 border-gray-100'}`}>
                          <Icon size={24} className={isCurrent ? 'animate-bounce' : ''} />
                       </div>
                    </div>
                    <div>
                       <p className="text-[8px] font-black uppercase tracking-[0.3em] text-gray-400 mb-0.5">Étape {idx + 1}</p>
                       <p className={`text-base font-black italic uppercase tracking-tighter ${isCurrent ? 'text-brand-brown' : 'text-gray-400'}`}>{step.label}</p>
                    </div>
                 </div>
              );
           })}
        </div>
      </div>

      {isDelivered && (
        <div className="bg-green-500 p-8 rounded-[3rem] text-white shadow-2xl animate-slide-up border-4 border-white">
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-white/20 p-3 rounded-2xl">
              <MessageSquare size={20} />
            </div>
            <h4 className="font-black uppercase italic text-xs">Message du Livreurs Billo</h4>
          </div>
          <p className="text-sm font-bold italic leading-relaxed">
            "Votre festin Khady's a été livré ! Bon appétit et merci de votre confiance. Barka !"
          </p>
        </div>
      )}

      {(steps[currentStepIdx].status === 'DELIVERING' || steps[currentStepIdx].status === 'READY') && (
        <div className="bg-brand-brown p-10 rounded-[4rem] shadow-2xl border-4 border-white animate-slide-up relative overflow-hidden">
           <div className="absolute top-0 left-0 w-full h-full opacity-5 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
           <div className="flex items-center justify-between mb-8 relative z-10">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-brand-orange rounded-xl flex items-center justify-center text-white shadow-lg"><Bike size={22}/></div>
                 <h4 className="text-brand-gold font-black uppercase italic text-xs tracking-[0.2em]">Billo Express Live</h4>
              </div>
              <span className="text-[9px] bg-red-500 text-white px-3 py-1 rounded-full animate-pulse font-black uppercase tracking-widest shadow-lg">En Route</span>
           </div>
           
           <div className="h-4 bg-white/10 rounded-full relative overflow-hidden mb-8 shadow-inner">
              <div className="absolute left-0 top-0 h-full bg-gradient-to-r from-brand-orange to-brand-gold shadow-[0_0_20px_rgba(255,111,0,0.6)] transition-all duration-1000" style={{ width: `${billoPos}%` }}></div>
              <div className="absolute top-1/2 -translate-y-1/2 transition-all duration-1000 flex items-center justify-center" style={{ left: `calc(${billoPos}% - 12px)` }}>
                 <div className="bg-white p-1 rounded-full shadow-2xl border-2 border-brand-orange">
                    <Bike size={18} className="text-brand-orange" />
                 </div>
              </div>
           </div>

           <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.2em] text-white/40 relative z-10 mb-6">
              <span className="flex items-center gap-2 text-brand-gold italic"><MapPin size={14}/> Khady's</span>
              <span className="flex items-center gap-2 italic"><MapPin size={14}/> Chez Vous</span>
           </div>

           {onOpenLiveDriverMap && (
             <button
               onClick={() => { playSound('pop'); onOpenLiveDriverMap(); }}
               className="w-full bg-brand-gold text-brand-brown py-3.5 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-all relative z-10 italic mb-2"
             >
               <Navigation size={16} /> Ouvrir la Carte GPS Live 🗺️
             </button>
           )}

           {onOpenPushNotification && (
             <button
               onClick={() => { playSound('pop'); onOpenPushNotification(); }}
               className="w-full bg-brand-orange text-white py-3.5 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-all relative z-10 italic border border-white/20 hover:bg-brand-gold hover:text-brand-brown"
             >
               <Bell size={16} className="animate-bounce" /> Activer Notifications Push Delivery 🔔
             </button>
           )}
        </div>
      )}
    </div>
  );
};

export default OrderTracking;
