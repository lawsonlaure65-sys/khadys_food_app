import React, { useState, useEffect, useMemo } from 'react';
import { Order, OrderStatus } from '../types';
import { playSound } from '../utils/audio';
import { RESTAURANT_INFO, BILLO_INFO } from '../constants';
import { db } from '../lib/supabase';
import { 
  Bell, MessageCircle, Clock, Bike, ChefHat, CheckCircle2, 
  ChevronDown, ChevronUp, Copy, Check, Play, Pause, Plus, 
  AlertCircle, Sparkles, MapPin, Phone, Volume2, X
} from 'lucide-react';

interface OrderNotificationBannerProps {
  order: Order;
  onClose: () => void;
  onUpdateOrder?: (updated: Order) => void;
  onViewReceipt?: () => void;
}

const DELIVERY_STEPS: { status: OrderStatus; label: string; icon: any; color: string; bg: string }[] = [
  { status: 'RECEIVED', label: 'Reçue', icon: Bell, color: 'text-amber-400', bg: 'bg-amber-400/20' },
  { status: 'PREPARING', label: 'En Préparation', icon: ChefHat, color: 'text-orange-400', bg: 'bg-orange-500/20' },
  { status: 'DELIVERING', label: 'En Livraison', icon: Bike, color: 'text-cyan-400', bg: 'bg-cyan-500/20' },
  { status: 'DELIVERED', label: 'Livrée', icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/20' }
];

export const OrderNotificationBanner: React.FC<OrderNotificationBannerProps> = ({
  order,
  onClose,
  onUpdateOrder,
  onViewReceipt
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [currentStatus, setCurrentStatus] = useState<OrderStatus>(order.status || 'RECEIVED');
  
  // MINUTEUR (Timer) - Par défaut 35 minutes (2100 secondes)
  const initialSeconds = 35 * 60;
  const [totalDurationSeconds, setTotalDurationSeconds] = useState(initialSeconds);
  const [secondsRemaining, setSecondsRemaining] = useState(initialSeconds);
  const [isTimerRunning, setIsTimerRunning] = useState(true);

  // RÉPONSE RAPIDE WHATSAPP
  // Choix de la réponse rapide : par défaut l'option demandée explicitement
  const [selectedQuickReplyKey, setSelectedQuickReplyKey] = useState<'CONFIRMED_PREPARING' | 'ON_THE_WAY' | 'DELIVERED'>('CONFIRMED_PREPARING');
  const [sendTarget, setSendTarget] = useState<'CUSTOMER' | 'RESTAURANT'>('CUSTOMER');
  const [isCopied, setIsCopied] = useState(false);

  // Synchronisation du statut avec la prop order
  useEffect(() => {
    if (order.status) {
      setCurrentStatus(order.status);
    }
  }, [order.status]);

  // Décompte du Minuteur
  useEffect(() => {
    if (!isTimerRunning) return;

    const timer = setInterval(() => {
      setSecondsRemaining(prev => {
        if (prev <= 1) {
          playSound('success');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isTimerRunning]);

  // Formatage mm:ss
  const formattedTime = useMemo(() => {
    const mins = Math.floor(secondsRemaining / 60);
    const secs = secondsRemaining % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, [secondsRemaining]);

  // Calcul du pourcentage écoulé pour la barre de progression
  const progressPercent = Math.min(
    100,
    Math.max(0, Math.round(((totalDurationSeconds - secondsRemaining) / totalDurationSeconds) * 100))
  );

  // Ajustement rapide du minuteur
  const addMinutes = (extraMinutes: number) => {
    playSound('pop');
    setSecondsRemaining(prev => prev + extraMinutes * 60);
    setTotalDurationSeconds(prev => prev + extraMinutes * 60);
  };

  const toggleTimer = () => {
    playSound('pop');
    setIsTimerRunning(prev => !prev);
  };

  // Mise à jour du Statut Livraison
  const handleStatusChange = async (newStatus: OrderStatus) => {
    playSound(newStatus === 'DELIVERING' ? 'delivery' : newStatus === 'DELIVERED' ? 'success' : 'notification');
    setCurrentStatus(newStatus);
    
    // Si on passe en livraison, adapter le message rapide recommandé
    if (newStatus === 'DELIVERING') {
      setSelectedQuickReplyKey('ON_THE_WAY');
    } else if (newStatus === 'DELIVERED') {
      setSelectedQuickReplyKey('DELIVERED');
      setSecondsRemaining(0);
      setIsTimerRunning(false);
    } else if (newStatus === 'PREPARING') {
      setSelectedQuickReplyKey('CONFIRMED_PREPARING');
    }

    const updatedOrder: Order = {
      ...order,
      status: newStatus
    };

    if (onUpdateOrder) {
      onUpdateOrder(updatedOrder);
    }

    // Persistance dans Supabase si connecté
    try {
      await db.updateOrderStatus(order.id, newStatus);
    } catch {
      // mode hors-ligne
    }
  };

  // Numéro WhatsApp propre
  const cleanPhoneNumber = (phoneStr: string) => {
    let cleaned = phoneStr.replace(/\D/g, '');
    if (!cleaned.startsWith('227') && cleaned.length === 8) {
      cleaned = '227' + cleaned;
    }
    return cleaned;
  };

  const customerCleanPhone = cleanPhoneNumber(order.phone || '');
  const restaurantCleanPhone = cleanPhoneNumber(RESTAURANT_INFO.whatsapp);

  const targetPhone = sendTarget === 'CUSTOMER' && customerCleanPhone 
    ? customerCleanPhone 
    : restaurantCleanPhone;

  // Modèles de Réponses Rapides WhatsApp
  const quickReplies = {
    CONFIRMED_PREPARING: {
      label: '👨‍🍳 Commande confirmée, préparation en cours',
      shortTitle: 'Préparation en cours',
      text: `Bonjour ${order.customerName} 👋,\n\n✅ Commande confirmée, préparation en cours aux fourneaux de Khady's Food !\n\n📦 Réf: #${order.id}\n💰 Montant: ${(order.total + order.deliveryFee).toLocaleString()} F CFA\n📍 Destination: ${order.district || 'Niamey'}\n⏱️ Minuteur estimé: ~${Math.max(1, Math.round(secondsRemaining / 60))} minutes\n\nVotre festin sera prêt et emballé avec soin. Merci de votre confiance !`
    },
    ON_THE_WAY: {
      label: '🛵 Prise en charge par le livreur, en route',
      shortTitle: 'Livreur en route',
      text: `Bonjour ${order.customerName} 🛵,\n\nVotre commande Khady's Food #${order.id} est prête et emballée ! Le coursier Billo Express est en route pour la livraison vers ${order.district || 'votre adresse'}.\n\nMerci de garder votre téléphone (${order.phone}) à portée de main !`
    },
    DELIVERED: {
      label: '✨ Commande livrée avec succès',
      shortTitle: 'Commande livrée',
      text: `Bonjour ${order.customerName} 🍽️,\n\nVotre festin Khady's Food #${order.id} a été livré avec succès. Nous vous souhaitons un excellent appétit !\n\nN'hésitez pas à nous laisser votre avis sur l'application. À très bientôt chez Khady's Food & Event ✨`
    }
  };

  const activeMessageText = quickReplies[selectedQuickReplyKey].text;
  const whatsappUrl = `https://wa.me/${targetPhone}?text=${encodeURIComponent(activeMessageText)}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(activeMessageText);
    setIsCopied(true);
    playSound('pop');
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="fixed top-3 left-3 right-3 sm:left-6 sm:right-6 z-50 max-w-2xl mx-auto animate-slide-up">
      <div className="bg-gradient-to-br from-[#24130E] via-[#351A11] to-[#1C0B06] border-2 border-brand-gold/60 text-white rounded-[2rem] shadow-2xl overflow-hidden backdrop-blur-md">
        
        {/* BANNIÈRE HAUTE : EN-TÊTE & ALERTE */}
        <div className="p-4 sm:p-5 flex items-center justify-between gap-3 border-b border-brand-gold/20">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-brand-orange to-amber-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-brand-orange/30 animate-pulse">
              <Bell size={20} />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-[10px] font-black uppercase text-brand-gold tracking-widest italic">
                  Alerte Commande Active
                </span>
                <span className="text-[9px] font-mono font-bold bg-white/10 px-2 py-0.5 rounded text-amber-200">
                  #{order.id}
                </span>
              </div>
              <h4 className="text-xs sm:text-sm font-black italic uppercase text-white mt-0.5 tracking-tight flex items-center gap-2">
                {order.customerName} 
                <span className="text-brand-gold font-normal">
                  ({(order.total + order.deliveryFee).toLocaleString()} F CFA)
                </span>
              </h4>
              <p className="text-[10px] text-gray-300 font-medium flex items-center gap-1">
                <MapPin size={11} className="text-brand-orange shrink-0" />
                {order.district || 'Niamey'} • {order.phone}
              </p>
            </div>
          </div>

          {/* BOUTONS ACTIONS SUPÉRIEURS */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => playSound('notification')}
              className="p-2 bg-white/10 hover:bg-white/20 text-brand-gold rounded-xl transition-all"
              title="Sonnerie alerte"
            >
              <Volume2 size={16} />
            </button>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all flex items-center gap-1 text-[10px] font-bold"
              title={isExpanded ? 'Réduire' : 'Agrandir'}
            >
              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            <button
              onClick={onClose}
              className="p-2 bg-white/10 hover:bg-red-500/30 text-white/70 hover:text-white rounded-xl transition-all"
              title="Fermer"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* CORPS DE LA BANNIÈRE (DÉTAILLÉ) */}
        {isExpanded && (
          <div className="p-4 sm:p-5 space-y-4 text-xs">
            
            {/* 1. SECTION STATUT LIVRAISON */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-wider text-brand-gold">
                <span className="flex items-center gap-1.5">
                  <Bike size={13} className="text-brand-orange" /> Statut de la Livraison
                </span>
                <span className="bg-brand-gold/15 text-brand-gold px-2 py-0.5 rounded-full border border-brand-gold/30">
                  {DELIVERY_STEPS.find(s => s.status === currentStatus)?.label || currentStatus}
                </span>
              </div>

              {/* Boutons interactifs pour basculer le statut en 1 clic */}
              <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                {DELIVERY_STEPS.map((step) => {
                  const Icon = step.icon;
                  const isActive = currentStatus === step.status;
                  return (
                    <button
                      key={step.status}
                      type="button"
                      onClick={() => handleStatusChange(step.status)}
                      className={`p-2.5 rounded-2xl flex flex-col items-center justify-center gap-1 text-center transition-all border ${
                        isActive
                          ? 'bg-gradient-to-b from-brand-gold to-amber-500 text-brand-brown font-black border-white shadow-lg scale-102'
                          : 'bg-white/5 hover:bg-white/10 text-gray-300 border-white/10'
                      }`}
                    >
                      <Icon size={16} className={isActive ? 'text-brand-brown' : step.color} />
                      <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-tight leading-none mt-0.5">
                        {step.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. SECTION MINUTEUR DE LIVRAISON */}
            <div className="bg-black/30 p-3.5 rounded-2xl border border-white/10 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg ${isTimerRunning ? 'bg-amber-500/20 text-amber-400' : 'bg-gray-500/20 text-gray-400'}`}>
                    <Clock size={16} className={isTimerRunning ? 'animate-spin-slow' : ''} />
                  </div>
                  <div>
                    <span className="text-[9px] font-black uppercase tracking-wider text-gray-300 block">
                      Minuteur de Livraison
                    </span>
                    <span className="text-xl sm:text-2xl font-black font-mono tracking-tight text-brand-gold">
                      {formattedTime}
                    </span>
                  </div>
                </div>

                {/* Contrôles du Minuteur */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => addMinutes(5)}
                    className="px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-brand-gold rounded-xl text-[9px] font-black uppercase flex items-center gap-0.5 border border-white/10"
                    title="Ajouter 5 minutes"
                  >
                    <Plus size={10} /> 5 min
                  </button>
                  <button
                    type="button"
                    onClick={() => addMinutes(10)}
                    className="px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-brand-gold rounded-xl text-[9px] font-black uppercase flex items-center gap-0.5 border border-white/10"
                    title="Ajouter 10 minutes"
                  >
                    <Plus size={10} /> 10 min
                  </button>
                  <button
                    type="button"
                    onClick={toggleTimer}
                    className={`p-1.5 rounded-xl border ${
                      isTimerRunning 
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' 
                        : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    }`}
                    title={isTimerRunning ? 'Mettre en pause' : 'Démarrer le minuteur'}
                  >
                    {isTimerRunning ? <Pause size={14} /> : <Play size={14} />}
                  </button>
                </div>
              </div>

              {/* Barre de progression du Minuteur */}
              <div className="space-y-1">
                <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden p-0.5">
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 via-orange-500 to-emerald-400 rounded-full transition-all duration-500 shadow-sm"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <div className="flex justify-between text-[8px] text-gray-400 font-bold uppercase">
                  <span>
                    {secondsRemaining === 0 
                      ? '⏱️ Temps estimé atteint !' 
                      : `En cours (~${Math.ceil(secondsRemaining / 60)} min restantes)`}
                  </span>
                  <span>{progressPercent}% écoulé</span>
                </div>
              </div>
            </div>

            {/* 3. SECTION BOUTON WHATSAPP AMÉLIORÉ AVEC RÉPONSE RAPIDE PRÉ-REMPLIE */}
            <div className="bg-gradient-to-r from-emerald-950/40 to-black/40 p-3.5 rounded-2xl border border-emerald-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-[9px] font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <MessageCircle size={14} /> Réponse Rapide WhatsApp Pré-remplie
                </label>
                <div className="flex items-center gap-1 bg-black/40 p-0.5 rounded-xl border border-white/10">
                  <button
                    type="button"
                    onClick={() => setSendTarget('CUSTOMER')}
                    className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase transition-all ${
                      sendTarget === 'CUSTOMER' ? 'bg-emerald-600 text-white' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Client ({order.phone || 'Tél'})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSendTarget('RESTAURANT')}
                    className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase transition-all ${
                      sendTarget === 'RESTAURANT' ? 'bg-emerald-600 text-white' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Cuisine / Billo
                  </button>
                </div>
              </div>

              {/* Puces de choix de réponse rapide (Chips) */}
              <div className="flex flex-wrap gap-1.5">
                {(Object.keys(quickReplies) as Array<keyof typeof quickReplies>).map((key) => {
                  const item = quickReplies[key];
                  const isSelected = selectedQuickReplyKey === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => { playSound('pop'); setSelectedQuickReplyKey(key); }}
                      className={`px-2.5 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-tight transition-all border text-left ${
                        isSelected
                          ? 'bg-emerald-500 text-white border-emerald-400 shadow-md scale-102'
                          : 'bg-white/5 hover:bg-white/10 text-gray-300 border-white/10'
                      }`}
                    >
                      {item.shortTitle}
                    </button>
                  );
                })}
              </div>

              {/* Aperçu du message pré-rempli */}
              <div className="p-2.5 bg-black/50 rounded-xl border border-white/10 text-[10px] text-gray-200 font-mono leading-relaxed line-clamp-3 select-all">
                {activeMessageText}
              </div>

              {/* Bouton d'envoi WhatsApp principal & Copie */}
              <div className="flex items-center gap-2 pt-1">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => playSound('pop')}
                  className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white font-black text-[10px] uppercase italic tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/40 active:scale-95 transition-all"
                >
                  <MessageCircle size={16} /> 
                  Envoyer via WhatsApp ({quickReplies[selectedQuickReplyKey].shortTitle})
                </a>

                <button
                  type="button"
                  onClick={copyToClipboard}
                  className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all border border-white/10"
                  title="Copier le message pré-rempli"
                >
                  {isCopied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                </button>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
