
import React, { useState, useEffect } from 'react';
import { Order, OrderStatus } from '../types';
import { playSound } from '../utils/audio';
import { 
  Clock, CheckCircle2, ChefHat, Bike, PackageCheck, Box, Bell, MapPin, Navigation, 
  Zap, MessageSquare, AlertTriangle, PhoneCall, ShieldCheck, FileCheck, Smartphone
} from 'lucide-react';

interface OrderTrackingProps {
  order: Order;
  onComplete: () => void;
  onUpdateOrder?: (updated: Order) => void;
}

const steps: { status: OrderStatus; label: string; icon: any; sound: any }[] = [
  { status: 'RECEIVED', label: 'Reçue', icon: Box, sound: 'pop' },
  { status: 'CONFIRMED', label: 'Confirmée', icon: CheckCircle2, sound: 'notification' },
  { status: 'PREPARING', label: 'En Cuisine', icon: ChefHat, sound: 'notification' },
  { status: 'READY', label: 'Emballée !', icon: PackageCheck, sound: 'success' },
  { status: 'DELIVERING', label: 'En Livraison', icon: Bike, sound: 'delivery' },
  { status: 'DELIVERED', label: 'Livrée 🍽️', icon: Zap, sound: 'success' }
];

const OrderTracking: React.FC<OrderTrackingProps> = ({ order, onComplete, onUpdateOrder }) => {
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [billoPos, setBilloPos] = useState(0);
  const [showDriverIssueModal, setShowDriverIssueModal] = useState(false);
  const [issueText, setIssueText] = useState('');

  useEffect(() => {
    const actualIdx = steps.findIndex(s => s.status === order.status);
    if (actualIdx !== -1) {
      setCurrentStepIdx(actualIdx);
      if (order.status === 'DELIVERED') onComplete();
    }
  }, [order.status]);

  useEffect(() => {
    if (steps[currentStepIdx]?.status === 'DELIVERING') {
      const interval = setInterval(() => {
        setBilloPos(prev => (prev < 100 ? prev + 1 : 100));
      }, 300);
      return () => clearInterval(interval);
    }
  }, [currentStepIdx]);

  const handleValidateDelivery = () => {
    playSound('delivery');
    const updated: Order = {
      ...order,
      status: 'DELIVERED',
      driverStatus: 'LIVRAISON_VALIDEE',
      driverNote: 'Livraison effectuée avec succès au client par Billo Express.'
    };
    if (onUpdateOrder) onUpdateOrder(updated);
    onComplete();
  };

  const handleReportIssue = () => {
    if (!issueText.trim()) return;
    playSound('pop');
    const updated: Order = {
      ...order,
      driverStatus: 'PROBLEME_LIVRAISON',
      driverIssue: issueText
    };
    if (onUpdateOrder) onUpdateOrder(updated);
    setShowDriverIssueModal(false);
    alert("⚠️ Le problème a été signalé à l'administrateur Khady's Food.");
  };

  const isDelivered = order.status === 'DELIVERED';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Payment Proof Badge */}
      {order.paymentType === 'MOBILE_MONEY' && (
        <div className={`p-5 rounded-3xl border-2 flex items-center justify-between ${
          order.paymentValidated 
            ? 'bg-green-50 border-green-500 text-green-900' 
            : 'bg-amber-50 border-amber-400 text-amber-900 animate-pulse'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-2xl ${order.paymentValidated ? 'bg-green-500 text-white' : 'bg-amber-500 text-white'}`}>
              <Smartphone size={20} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase italic">
                {order.paymentValidated ? '✅ Dépôt Mobile Money Validé' : '⏳ Vérification du Dépôt par Admin'}
              </p>
              <p className="text-[9px] font-mono font-bold opacity-80">
                Transaction Ref: {order.paymentTransactionId || 'N/A'}
              </p>
            </div>
          </div>
          {order.paymentProofUrl && (
            <a 
              href={order.paymentProofUrl} 
              target="_blank" 
              rel="noreferrer" 
              className="text-[9px] font-black uppercase underline px-3 py-1.5 bg-white rounded-xl shadow-sm border"
            >
              Voir Reçu
            </a>
          )}
        </div>
      )}

      {order.paymentType === 'CASH' && (
        <div className="p-4 bg-brand-cream rounded-3xl border border-brand-brown/10 flex items-center justify-between text-brand-brown">
          <div className="flex items-center gap-3">
            <CheckCircle2 size={18} className="text-brand-orange" />
            <span className="text-[10px] font-black uppercase italic">Paiement en Espèces à la livraison ({order.total + order.deliveryFee} F)</span>
          </div>
          <span className="text-[8px] font-bold bg-white px-2.5 py-1 rounded-full uppercase">Main à Main</span>
        </div>
      )}

      <div className="bg-white p-8 sm:p-10 rounded-[4rem] shadow-2xl border border-brand-brown/5 relative overflow-hidden">
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

      {/* Driver Interaction Panel */}
      <div className="bg-[#1A0F0D] p-6 sm:p-8 rounded-[3.5rem] text-white shadow-2xl border-4 border-white space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-gold/20 rounded-2xl flex items-center justify-center text-brand-gold border border-brand-gold/30">
              <Bike size={20} />
            </div>
            <div>
              <h4 className="text-xs font-black uppercase italic text-brand-gold">Espace Interaction Livreur Billo</h4>
              <p className="text-[9px] text-gray-400 font-medium">Livreur: Mahamadou Diallo (+227 90 12 34 56)</p>
            </div>
          </div>
          <a
            href={`https://wa.me/22790123456?text=${encodeURIComponent(`Salam Mahamadou, concernant ma commande ${order.id} Khady's Food:`)}`}
            target="_blank"
            rel="noreferrer"
            className="p-3 bg-green-500 text-white rounded-2xl flex items-center justify-center shadow-lg active:scale-95 transition-transform"
            title="Contacter sur WhatsApp"
          >
            <PhoneCall size={18} />
          </a>
        </div>

        {order.driverIssue && (
          <div className="p-4 bg-red-500/20 border border-red-500/40 rounded-2xl text-red-200 text-xs font-bold flex items-center gap-2">
            <AlertTriangle size={18} className="text-red-400 shrink-0" />
            <span>Signalement Livreur : {order.driverIssue}</span>
          </div>
        )}

        {/* Action Buttons for Driver/Admin/User */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            onClick={handleValidateDelivery}
            disabled={isDelivered}
            className="py-4 bg-green-600 hover:bg-green-500 text-white rounded-2xl font-black uppercase text-[9px] italic tracking-wider flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all disabled:opacity-50"
          >
            <CheckCircle2 size={16} /> {isDelivered ? 'Livraison Validée' : 'Valider Livraison'}
          </button>

          <button
            onClick={() => setShowDriverIssueModal(true)}
            className="py-4 bg-red-600/30 hover:bg-red-600/50 text-red-200 border border-red-500/30 rounded-2xl font-black uppercase text-[9px] italic tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            <AlertTriangle size={16} /> Signaler Problème
          </button>
        </div>
      </div>

      {/* Modal for reporting delivery issues */}
      {showDriverIssueModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] p-8 max-w-md w-full space-y-6 text-brand-brown">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-black uppercase italic flex items-center gap-2 text-red-600">
                <AlertTriangle size={18} /> Signaler un problème de livraison
              </h3>
              <button onClick={() => setShowDriverIssueModal(false)} className="text-gray-400 font-bold">✕</button>
            </div>

            <p className="text-xs text-gray-600 font-medium">
              Précisez le problème rencontré (ex: Client injoignable, Adresse incomplète, Retard de circulation...)
            </p>

            <textarea
              rows={3}
              className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-bold outline-none focus:border-brand-orange"
              placeholder="Ex: Le client ne répond pas au téléphone après 3 appels..."
              value={issueText}
              onChange={(e) => setIssueText(e.target.value)}
            />

            <div className="flex gap-3">
              <button
                onClick={() => setShowDriverIssueModal(false)}
                className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-2xl text-xs font-black uppercase"
              >
                Annuler
              </button>
              <button
                onClick={handleReportIssue}
                className="flex-1 py-3 bg-red-600 text-white rounded-2xl text-xs font-black uppercase italic shadow-lg"
              >
                Envoyer au Staff
              </button>
            </div>
          </div>
        </div>
      )}

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

      {(steps[currentStepIdx]?.status === 'DELIVERING' || steps[currentStepIdx]?.status === 'READY') && (
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

           <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.2em] text-white/40 relative z-10">
              <span className="flex items-center gap-2 text-brand-gold italic"><MapPin size={14}/> Khady's</span>
              <span className="flex items-center gap-2 italic"><MapPin size={14}/> Chez Vous</span>
           </div>
        </div>
      )}
    </div>
  );
};

export default OrderTracking;
