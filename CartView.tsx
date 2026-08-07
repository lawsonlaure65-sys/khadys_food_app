
import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { CartItem, Order, PaymentMethod, UserProfile } from '../types';
import { 
  Trash2, ShoppingBag, ArrowRight, MapPin, Smartphone, ChevronLeft, 
  ShieldCheck, Wallet, CreditCard, Banknote, Sparkles, Upload, Image as ImageIcon, 
  CheckCircle2, AlertCircle, FileText, Check, MessageCircle, Send, Bike, Phone
} from 'lucide-react';
import { PhoneInput } from './PhoneInput';
import { playSound } from '../utils/audio';
import { BILLO_INFO, DISTRICTS, DISCOUNT_PER_100_POINTS, PAYMENT_ACCOUNTS } from '../constants';

interface CartViewProps {
  cart: CartItem[];
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  onOrderPlace: (order: Order) => void;
  onClose: () => void;
  userProfile: UserProfile;
  onConsumePoints: (pts: number) => void;
}

const CartView: React.FC<CartViewProps> = ({ cart, setCart, onOrderPlace, onClose, userProfile, onConsumePoints }) => {
  const [paymentType, setPaymentType] = useState<'MOBILE_MONEY' | 'CASH'>('CASH');
  const [transactionId, setTransactionId] = useState('');
  const [paymentProofUrl, setPaymentProofUrl] = useState('');
  const [isUploadingProof, setIsUploadingProof] = useState(false);
  const [usePoints, setUsePoints] = useState(false);
  const [payment, setPayment] = useState<PaymentMethod>('CASH');
  const [submittedOrder, setSubmittedOrder] = useState<Order | null>(null);
  const [customer, setCustomer] = useState({
    name: userProfile.name || '',
    phone: userProfile.phone || '',
    address: '',
    district: DISTRICTS[0]?.name || 'Plateau'
  });

  const handleProofFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploadingProof(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPaymentProofUrl(reader.result as string);
        setIsUploadingProof(false);
        playSound('pop');
      };
      reader.readAsDataURL(file);
    }
  };

  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  
  // Points max utilisables : soit tous les points, soit le montant du panier / conversion
  const maxRedeemablePoints = Math.min(userProfile.points, Math.floor(subtotal / DISCOUNT_PER_100_POINTS) * 100);
  const discount = usePoints ? (maxRedeemablePoints / 100) * DISCOUNT_PER_100_POINTS : 0;

  const getDeliveryFee = () => {
    const district = DISTRICTS.find(d => d.name === customer.district);
    const hour = new Date().getHours();
    const isNight = hour >= 21 || hour < 6;

    if (!district) return 0;

    if (district.zone === 'center') {
      return isNight ? BILLO_INFO.tarifs.center.night : BILLO_INFO.tarifs.center.day;
    } else {
      return isNight ? BILLO_INFO.tarifs.periphery.night : BILLO_INFO.tarifs.periphery.day;
    }
  };

  const deliveryFee = cart.length > 0 ? getDeliveryFee() : 0;
  const total = Math.max(0, subtotal - discount + deliveryFee);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer.name || !customer.name.trim()) {
      alert("Veuillez renseigner votre nom pour la livraison.");
      return;
    }
    const digitsOnly = (customer.phone || '').replace(/\D/g, '');
    if (!customer.phone || digitsOnly.length < 6) {
      alert("Veuillez saisir un numéro de téléphone valide.");
      return;
    }

    if (paymentType === 'MOBILE_MONEY') {
      if (!transactionId.trim()) {
        alert("Paiement Mobile Money : Veuillez saisir le N° / ID de transaction du dépôt.");
        return;
      }
      if (!paymentProofUrl) {
        alert("Paiement Mobile Money OBLIGATOIRE : Veuillez ajouter la capture d'écran / photo du reçu de dépôt avant de valider.");
        return;
      }
    }

    const newOrder: Order = {
      id: `KH-${Math.floor(1000 + Math.random() * 9000)}`,
      customerName: customer.name,
      phone: customer.phone,
      address: customer.address,
      district: customer.district,
      items: [...cart],
      total: subtotal - discount,
      deliveryFee: deliveryFee,
      status: 'RECEIVED',
      paymentMethod: payment,
      paymentType: paymentType,
      paymentTransactionId: paymentType === 'MOBILE_MONEY' ? transactionId : undefined,
      paymentProofUrl: paymentType === 'MOBILE_MONEY' ? paymentProofUrl : undefined,
      paymentValidated: paymentType === 'CASH', // Cash auto validated on delivery, Mobile Money requires admin proof check
      timestamp: new Date().toISOString()
    };

    if (usePoints && maxRedeemablePoints > 0) {
      onConsumePoints(maxRedeemablePoints);
    }

    // Festive confetti animation launch
    try {
      const count = 200;
      const defaults = {
        origin: { y: 0.7 },
        colors: ['#FF6F00', '#FFD700', '#2C1810', '#FFFFFF', '#FF8F00']
      };

      function fire(particleRatio: number, opts: confetti.Options) {
        confetti({
          ...defaults,
          ...opts,
          particleCount: Math.floor(count * particleRatio)
        });
      }

      fire(0.25, {
        spread: 26,
        startVelocity: 55,
      });
      fire(0.2, {
        spread: 60,
      });
      fire(0.35, {
        spread: 100,
        decay: 0.91,
        scalar: 0.8
      });
      fire(0.1, {
        spread: 120,
        startVelocity: 25,
        decay: 0.92,
        scalar: 1.2
      });
      fire(0.1, {
        spread: 120,
        startVelocity: 45,
      });
    } catch (err) {
      console.warn("Confetti error:", err);
    }

    onOrderPlace(newOrder);
    setSubmittedOrder(newOrder);
    setCart([]);
    playSound('notification');
  };

  const getWhatsAppText = (order: Order) => {
    const itemsText = order.items.map(i => `• ${i.quantity}x ${i.name} (${i.price * i.quantity} F CFA)`).join('\n');
    const paymentInfo = order.paymentType === 'MOBILE_MONEY' 
      ? `MOBILE MONEY (${order.paymentMethod}) - TRX: ${order.paymentTransactionId || 'Joint'}` 
      : `ESPÈCES À LA LIVRAISON (${order.total + order.deliveryFee} F CFA)`;

    return `👑 *KHADY'S FOOD - DOUBLE VALIDATION DE COMMANDE* 👑\n\n` +
      `📋 *Code Commande :* ${order.id}\n` +
      `👤 *Nom Client :* ${order.customerName}\n` +
      `📞 *Téléphone :* ${order.phone}\n` +
      `📍 *Quartier / Adresse :* ${order.district} ${order.address ? `(${order.address})` : ''}\n\n` +
      `🥘 *DETAILS DU FESTIN :*\n${itemsText}\n\n` +
      `💵 *Sous-total :* ${order.total} F CFA\n` +
      `🛵 *Livraison Billo Express :* ${order.deliveryFee} F CFA\n` +
      `💰 *TOTAL À PAYER :* ${order.total + order.deliveryFee} F CFA\n` +
      `💳 *Mode de Règlement :* ${paymentInfo}\n\n` +
      `⚡ *Commande déjà enregistrée en ligne. Merci de valider la réception !*`;
  };

  const paymentMethods = [
    { id: 'CASH', label: 'Espèces', icon: Banknote, sub: 'À la livraison' },
    { id: 'CARD', label: 'CB / Mobile', icon: CreditCard, sub: 'Sécurisé' },
    { id: 'AIRTEL_MONEY', label: 'Airtel Money', icon: Smartphone, sub: 'Paiement direct' },
    { id: 'MOOV_MONEY', label: 'Moov / Flooz', icon: Smartphone, sub: 'Paiement direct' },
    { id: 'ZAMANY', label: 'Zamany Money', icon: Wallet, sub: 'Paiement direct' },
    { id: 'NITA', label: 'Nita', icon: Smartphone, sub: 'Transfert' },
    { id: 'MYNITA', label: 'MyNita', icon: Smartphone, sub: 'App direct' },
    { id: 'AMANA', label: 'Amana', icon: Wallet, sub: 'Transfert' },
    { id: 'AMANATA', label: 'Amanata', icon: Wallet, sub: 'Transfert' },
    { id: 'ALLIZA', label: 'Alliza', icon: Smartphone, sub: 'Transfert' },
    { id: 'ZEYNA', label: 'Zeyna', icon: Smartphone, sub: 'Transfert' },
  ];

  return (
    <div className="animate-fade-in p-6">
      <header className="mb-10 flex items-center gap-4">
        <button onClick={onClose} className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center text-brand-brown">
           <ChevronLeft size={24} />
        </button>
        <h2 className="text-3xl font-black italic uppercase text-brand-brown leading-none">Mon <span className="text-brand-orange">Panier</span></h2>
      </header>

      {cart.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center opacity-20 grayscale">
           <ShoppingBag size={80} className="mb-6 text-brand-brown" />
           <p className="font-black uppercase text-[10px] tracking-widest text-brand-brown mb-8 italic">Votre panier est vide</p>
           <button onClick={onClose} className="text-brand-orange font-black uppercase text-[10px] underline tracking-widest">Retour au menu</button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-8 pb-32">
          <div className="space-y-4">
             {cart.map((item, idx) => (
               <div key={idx} className="bg-white p-5 rounded-[2.5rem] flex items-center gap-5 shadow-sm border border-brand-brown/5 group transition-all hover:shadow-lg">
                  <div className="relative w-16 h-16 rounded-2xl overflow-hidden shadow-md">
                     <img src={item.image} className="w-full h-full object-cover" alt={item.name} />
                  </div>
                  <div className="flex-1">
                     <h4 className="font-black text-[10px] text-brand-brown uppercase italic truncate mb-1">{item.name}</h4>
                     <p className="text-[10px] font-black text-brand-orange bg-brand-orange/5 px-2 py-1 rounded-lg inline-block">{item.quantity} x {item.price} F</p>
                  </div>
                  <button type="button" onClick={() => { playSound('pop'); setCart(cart.filter((_, i) => i !== idx)); }} className="p-3 text-red-400 transition-transform active:scale-90"><Trash2 size={20}/></button>
               </div>
             ))}
          </div>

          <div className="bg-[#1A0F0D] p-10 rounded-[3.5rem] shadow-2xl border-4 border-white text-white relative overflow-hidden">
             <div className="absolute top-0 right-0 p-8 opacity-5 rotate-12"><MapPin size={100} /></div>
             <h3 className="text-brand-gold font-black uppercase italic text-xs tracking-widest mb-8 flex items-center gap-2 relative z-10"><MapPin size={16}/> Livraison Billo Express</h3>
             <div className="space-y-4 relative z-10">
                <input type="text" required placeholder="Votre Nom" className="w-full p-5 bg-white/5 rounded-2xl text-white text-xs font-bold outline-none border border-white/10 focus:border-brand-gold" value={customer.name} onChange={e => setCustomer({...customer, name: e.target.value})} />
                <PhoneInput value={customer.phone} onChange={(v) => setCustomer({...customer, phone: v})} required />
                <div className="relative">
                  <select className="w-full p-5 bg-white/10 rounded-2xl text-white text-xs font-bold outline-none border border-white/10 appearance-none cursor-pointer" value={customer.district} onChange={e => setCustomer({...customer, district: e.target.value})}>
                     <optgroup label="Centre-Ville (1000f)" className="bg-brand-brown">
                        {DISTRICTS.filter(d => d.zone === 'center').map(d => <option key={d.name} value={d.name}>{d.name}</option>)}
                     </optgroup>
                     <optgroup label="Périphérie (1500f)" className="bg-brand-brown">
                        {DISTRICTS.filter(d => d.zone === 'periphery').map(d => <option key={d.name} value={d.name}>{d.name}</option>)}
                     </optgroup>
                  </select>
                </div>
                <input type="text" placeholder="Précisions adresse (Villa n°, Rue...)" className="w-full p-5 bg-white/5 rounded-2xl text-white text-xs font-bold outline-none border border-white/10 focus:border-brand-gold" value={customer.address} onChange={e => setCustomer({...customer, address: e.target.value})} />
             </div>
          </div>

          <div className="bg-white p-10 rounded-[3.5rem] shadow-xl border border-gray-100">
             <h3 className="text-brand-brown font-black uppercase italic text-xs tracking-widest mb-8 flex items-center gap-3"><Sparkles size={16} className="text-brand-orange"/> Programme Fidélité</h3>
             <div className="bg-brand-cream/30 p-6 rounded-3xl border-2 border-dashed border-brand-orange/20">
                <div className="flex items-center justify-between mb-4">
                   <div className="flex flex-col">
                      <span className="text-[10px] font-black text-brand-brown uppercase italic">Vos Points : {userProfile.points}</span>
                      <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Equivaut à {Math.floor(userProfile.points / 100) * DISCOUNT_PER_100_POINTS} F</span>
                   </div>
                   <button 
                    type="button"
                    disabled={userProfile.points < 100}
                    onClick={() => { playSound('pop'); setUsePoints(!usePoints); }}
                    className={`px-6 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all ${usePoints ? 'bg-brand-orange text-white shadow-lg' : 'bg-white text-brand-brown border border-brand-brown/10'}`}
                   >
                      {usePoints ? 'ANNULER' : 'APPLIQUER'}
                   </button>
                </div>
                {usePoints && (
                  <div className="animate-fade-in flex items-center gap-2 text-brand-orange text-[9px] font-black uppercase italic">
                    <Sparkles size={14} /> Réduction de {discount} F appliquée !
                  </div>
                )}
             </div>
          </div>

          <div className="bg-white p-8 sm:p-10 rounded-[3.5rem] shadow-xl border border-gray-100 space-y-6">
             <div className="flex items-center justify-between">
                <h3 className="text-brand-brown font-black uppercase italic text-xs tracking-widest flex items-center gap-3">
                  <Smartphone size={18} className="text-brand-orange"/> Option de Règlement
                </h3>
                <span className="text-[9px] font-black uppercase px-3 py-1 rounded-full bg-brand-gold/20 text-brand-brown border border-brand-gold/30">
                  Obligatoire
                </span>
             </div>

             {/* Selector Tabs: Cash vs Mobile Money */}
             <div className="grid grid-cols-2 gap-3 p-1.5 bg-gray-100 rounded-3xl">
                <button
                  type="button"
                  onClick={() => { playSound('pop'); setPaymentType('CASH'); setPayment('CASH'); }}
                  className={`py-4 rounded-2xl text-[10px] font-black uppercase italic tracking-wider transition-all flex items-center justify-center gap-2 ${
                    paymentType === 'CASH'
                      ? 'bg-brand-brown text-white shadow-lg scale-102'
                      : 'text-gray-400 hover:text-brand-brown'
                  }`}
                >
                  <Banknote size={16} /> En Espèces
                </button>

                <button
                  type="button"
                  onClick={() => { playSound('pop'); setPaymentType('MOBILE_MONEY'); setPayment('MYNITA'); }}
                  className={`py-4 rounded-2xl text-[10px] font-black uppercase italic tracking-wider transition-all flex items-center justify-center gap-2 ${
                    paymentType === 'MOBILE_MONEY'
                      ? 'bg-brand-orange text-white shadow-lg scale-102'
                      : 'text-gray-400 hover:text-brand-brown'
                  }`}
                >
                  <Smartphone size={16} /> Mobile Money
                </button>
             </div>

             {/* CASH FLOW */}
             {paymentType === 'CASH' && (
                <div className="p-6 bg-brand-cream/40 rounded-3xl border border-brand-brown/10 space-y-3 animate-fade-in">
                  <div className="flex items-center gap-3 text-brand-brown">
                    <CheckCircle2 size={20} className="text-green-600 shrink-0" />
                    <div>
                      <h4 className="text-xs font-black uppercase italic">Paiement Main à Main à la Livraison</h4>
                      <p className="text-[10px] text-gray-500 font-medium mt-0.5">
                        Vous règlerez la somme exacte de <strong className="text-brand-brown">{total} F</strong> directement au livreur Billo Express lors de la remise de votre commande.
                      </p>
                    </div>
                  </div>
                </div>
             )}

             {/* MOBILE MONEY FLOW */}
             {paymentType === 'MOBILE_MONEY' && (
                <div className="space-y-6 animate-fade-in">
                  {/* Choice of Mobile Provider */}
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-widest text-brand-brown">Sélectionnez votre opérateur</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { id: 'AIRTEL_MONEY', name: 'Airtel Money', num: PAYMENT_ACCOUNTS.airtelMoney.number },
                        { id: 'MOOV_MONEY', name: 'Moov / Flooz', num: PAYMENT_ACCOUNTS.moovFlooz.number },
                        { id: 'ORANGE_MONEY', name: 'Orange Money', num: PAYMENT_ACCOUNTS.orangeMoney.number },
                        { id: 'MYNITA', name: 'Mynita / Amanata', num: PAYMENT_ACCOUNTS.mynitaAmana.number },
                        { id: 'ALLIZA', name: 'All-Iza', num: PAYMENT_ACCOUNTS.allIza.number },
                      ].map((prov) => (
                        <button
                          key={prov.id}
                          type="button"
                          onClick={() => { playSound('pop'); setPayment(prov.id as any); }}
                          className={`p-3 rounded-2xl text-[9px] font-black uppercase border-2 text-left transition-all ${
                            payment === prov.id
                              ? 'border-brand-orange bg-brand-orange/10 text-brand-orange shadow-md'
                              : 'border-gray-100 bg-gray-50 text-gray-400'
                          }`}
                        >
                          <p className="font-black italic">{prov.name}</p>
                          <p className="text-[8px] font-mono opacity-80 mt-1">{prov.num}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Account Instructions Box */}
                  <div className="p-5 bg-brand-brown text-white rounded-3xl space-y-2 border-2 border-brand-gold/30">
                    <div className="flex items-center gap-2 text-brand-gold text-[10px] font-black uppercase italic">
                      <AlertCircle size={16} /> Instructions de Dépôt OBLIGATOIRE
                    </div>
                    <p className="text-xs text-white/90 font-bold leading-relaxed">
                      1. Effectuez un transfert / dépôt de <strong className="text-brand-gold text-sm font-black">{total} F</strong> au numéro correspondant.<br />
                      2. Saisissez ci-dessous le <strong>N°/ID de transaction</strong> puis <strong>importez la capture d'écran du reçu</strong>.<br />
                      3. L'administrateur Khady's IA vérifiera le dépôt pour valider définitivement la commande.
                    </p>
                  </div>

                  {/* Inputs for Transaction ID & Proof Upload */}
                  <div className="space-y-4 pt-2">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase text-brand-brown ml-1">
                        Numéro / ID de Transaction (OBLIGATOIRE) *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: TRX981240192 ou NITA-8821"
                        value={transactionId}
                        onChange={(e) => setTransactionId(e.target.value)}
                        className="w-full p-4 bg-gray-50 rounded-2xl text-xs font-mono font-bold text-brand-brown border border-gray-200 outline-none focus:border-brand-orange"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase text-brand-brown ml-1">
                        Capture d'écran / Reçu de Dépôt (OBLIGATOIRE) *
                      </label>

                      {paymentProofUrl ? (
                        <div className="relative rounded-3xl overflow-hidden border-2 border-green-500 p-2 bg-green-50 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <img src={paymentProofUrl} alt="Reçu" className="w-14 h-14 object-cover rounded-xl border border-green-200" />
                            <div>
                              <span className="text-[9px] font-black uppercase text-green-700 flex items-center gap-1">
                                <CheckCircle2 size={12} /> Reçu joint avec succès
                              </span>
                              <p className="text-[8px] text-gray-500 font-mono">Image prête pour contrôle admin</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setPaymentProofUrl('')}
                            className="text-xs font-black uppercase text-red-500 px-3 py-1 bg-white rounded-xl shadow-sm border border-red-200"
                          >
                            Changer
                          </button>
                        </div>
                      ) : (
                        <label className="w-full border-2 border-dashed border-brand-orange/40 bg-brand-orange/5 hover:bg-brand-orange/10 transition-colors rounded-3xl p-6 flex flex-col items-center justify-center cursor-pointer gap-2 text-center">
                          <Upload size={28} className="text-brand-orange" />
                          <span className="text-xs font-black uppercase italic text-brand-brown">
                            {isUploadingProof ? 'Chargement en cours...' : 'Ajouter la capture du reçu Mobile Money'}
                          </span>
                          <span className="text-[9px] text-gray-400 font-bold">Format JPG, PNG ou Capture d'écran WhatsApp/SMS</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleProofFileUpload}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  </div>
                </div>
             )}
          </div>

          <div className="bg-brand-brown p-10 rounded-[4rem] text-brand-gold shadow-2xl relative overflow-hidden border-4 border-white">
             <div className="space-y-4 mb-8">
                <div className="flex justify-between text-white/40 text-[9px] font-black uppercase tracking-widest"><span>Sous-total Festin</span><span>{subtotal} F</span></div>
                {discount > 0 && <div className="flex justify-between text-brand-orange text-[9px] font-black uppercase tracking-widest"><span>Réduction Fidélité</span><span>- {discount} F</span></div>}
                <div className="flex justify-between text-brand-gold text-[9px] font-black uppercase tracking-widest"><span>Service Billo (Zone {DISTRICTS.find(d => d.name === customer.district)?.zone})</span><span>{deliveryFee} F</span></div>
                <div className="pt-6 border-t border-white/10 flex justify-between items-end"><span className="text-white font-black italic uppercase text-sm">Net à Payer</span><span className="text-4xl font-black">{total} F</span></div>
             </div>
             <button type="submit" className="w-full bg-brand-orange text-white py-6 rounded-[2.5rem] font-black uppercase shadow-[0_20px_50px_rgba(255,111,0,0.3)] flex items-center justify-center gap-4 active:scale-95 transition-all italic tracking-widest">Confirmer le Festin <ArrowRight size={22}/></button>
             <p className="text-center text-[8px] text-white/20 font-black uppercase tracking-widest mt-6">Sécurisé par Khady's Payment Terminal</p>
          </div>
        </form>
      )}

      {/* MODAL DOUBLE COMMANDE : EN LIGNE & WHATSAPP */}
      {submittedOrder && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-fade-in">
          <div className="bg-gradient-to-b from-[#2C1810] via-[#3E2723] to-[#1C0D08] rounded-[3.5rem] p-6 sm:p-10 max-w-lg w-full text-white border-2 border-brand-gold/50 shadow-2xl space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-gold/10 rounded-full blur-2xl pointer-events-none"></div>

            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-brand-gold/20 text-brand-gold rounded-3xl border border-brand-gold/40 flex items-center justify-center mx-auto shadow-inner text-3xl animate-bounce">
                🎉
              </div>
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[9px] font-black uppercase px-4 py-1.5 rounded-full inline-block italic tracking-widest">
                100% Enregistrée En Ligne
              </span>
              <h3 className="text-2xl font-black italic text-brand-gold uppercase tracking-tighter leading-none pt-1">
                COMMANDE {submittedOrder.id}
              </h3>
              <p className="text-[10px] text-white/70 font-medium">
                Votre festin a été sauvegardé dans le système central.
              </p>
            </div>

            {/* Recap box */}
            <div className="p-5 bg-white/5 rounded-3xl border border-white/10 space-y-2.5 text-xs font-bold">
              <div className="flex justify-between text-brand-gold">
                <span>Client :</span>
                <span>{submittedOrder.customerName} ({submittedOrder.phone})</span>
              </div>
              <div className="flex justify-between text-white/80">
                <span>Livraison Zone :</span>
                <span>{submittedOrder.district}</span>
              </div>
              <div className="flex justify-between text-white/80">
                <span>Total Festin + Billo :</span>
                <span className="text-brand-gold font-black">{submittedOrder.total + submittedOrder.deliveryFee} F CFA</span>
              </div>
              <div className="flex justify-between text-emerald-400 text-[10px]">
                <span>Paiement :</span>
                <span className="uppercase font-mono">{submittedOrder.paymentType === 'MOBILE_MONEY' ? 'Mobile Money (Dépôt Ref)' : 'Espèces au livreur'}</span>
              </div>
            </div>

            {/* Banner info double commande */}
            <div className="p-4 bg-emerald-950/80 border border-emerald-500/40 rounded-2xl space-y-1">
              <div className="flex items-center gap-2 text-emerald-400 text-[10px] font-black uppercase italic">
                <MessageCircle size={16} /> Double Validation WhatsApp Immédiate
              </div>
              <p className="text-[10px] text-emerald-100/80 font-medium leading-relaxed">
                Transmettez votre reçu directement sur WhatsApp pour une confirmation instantanée en cuisine et l'envoi immédiat de votre livreur !
              </p>
            </div>

            {/* WhatsApp Buttons */}
            <div className="space-y-3 pt-1">
              <a
                href={`https://wa.me/22796000000?text=${encodeURIComponent(getWhatsAppText(submittedOrder))}`}
                target="_blank"
                rel="noreferrer"
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white p-4.5 rounded-2xl font-black uppercase text-[10px] italic tracking-wider flex items-center justify-center gap-2.5 shadow-xl active:scale-95 transition-all text-center"
              >
                <MessageCircle size={18} /> 1. Transmettre au Restaurant Khady's Food
              </a>

              <a
                href={`https://wa.me/22792080822?text=${encodeURIComponent(getWhatsAppText(submittedOrder))}`}
                target="_blank"
                rel="noreferrer"
                className="w-full bg-[#1A0F0D] hover:bg-black text-brand-gold p-4 rounded-2xl font-black uppercase text-[10px] italic tracking-wider flex items-center justify-center gap-2.5 border border-brand-gold/40 shadow-lg active:scale-95 transition-all text-center"
              >
                <Bike size={18} /> 2. Transmettre au Livreur Billo Express
              </a>

              <button
                type="button"
                onClick={() => {
                  setSubmittedOrder(null);
                  onClose();
                }}
                className="w-full bg-white/10 hover:bg-white/20 text-white p-3.5 rounded-2xl font-black uppercase text-[9px] italic tracking-widest text-center transition-all"
              >
                Suivre Ma Commande En Direct ➔
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartView;
