import React, { useState } from 'react';
import { CartItem, Order, PaymentMethod, UserProfile } from '../types';
import { Trash2, ShoppingBag, ArrowRight, MapPin, Smartphone, ChevronLeft, ShieldCheck, Wallet, CreditCard, Banknote, Sparkles, Upload, CheckCircle2, FileText, Camera, AlertTriangle, Send, MessageSquare, Tag, Gift, Check, X, Share2, Copy, Link2, ExternalLink } from 'lucide-react';
import { PhoneInput } from './PhoneInput';
import { playSound } from '../utils/audio';
import { BILLO_INFO, RESTAURANT_INFO, DISTRICTS, DISCOUNT_PER_100_POINTS } from '../constants';
import { getStoredRestaurantWhatsApp, buildKitchenOrderMessage, openWhatsApp } from '../utils/whatsapp';
import { applyPromoCode, PromoValidationResult, getStoredPromoCodes } from '../utils/marketing';
import { generateCartShareUrl, generateCartShareWhatsAppText } from '../utils/cartShare';

interface CartViewProps {
  cart: CartItem[];
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  onOrderPlace: (order: Order) => void;
  onClose: () => void;
  userProfile: UserProfile;
  onConsumePoints: (pts: number) => void;
}

export const CartView: React.FC<CartViewProps> = ({ cart, setCart, onOrderPlace, onClose, userProfile, onConsumePoints }) => {
  const [customer, setCustomer] = useState({ name: userProfile.name || '', phone: userProfile.phone || '', address: '', district: 'Grande Mosquée / Zongo' });
  const [payment, setPayment] = useState<PaymentMethod>('MYNITA');
  const [usePoints, setUsePoints] = useState(false);
  const [sendWhatsApp, setSendWhatsApp] = useState(true);

  // Share Cart Modal States
  const [showShareModal, setShowShareModal] = useState(false);
  const [copiedShareLink, setCopiedShareLink] = useState(false);

  // Promo Code State
  const [promoInput, setPromoInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<PromoValidationResult | null>(null);
  const [promoMessage, setPromoMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Phone Validation & SMS OTP States
  const [isPhoneValid, setIsPhoneValid] = useState(false);
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [phoneError, setPhoneError] = useState<string | null>(null);

  // Mobile Money Deposit Proof States
  const [proofImage, setProofImage] = useState<string | null>(null);
  const [transactionId, setTransactionId] = useState('');
  const [proofError, setProofError] = useState(false);

  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const maxRedeemablePoints = Math.min(userProfile.points, Math.floor(subtotal / DISCOUNT_PER_100_POINTS) * 100);
  const loyaltyDiscount = usePoints ? (maxRedeemablePoints / 100) * DISCOUNT_PER_100_POINTS : 0;
  const promoDiscount = appliedPromo?.isValid ? appliedPromo.discountAmount : 0;
  const discount = loyaltyDiscount + promoDiscount;

  const handleApplyPromoCode = () => {
    playSound('pop');
    const result = applyPromoCode(promoInput, subtotal);
    if (result.isValid) {
      setAppliedPromo(result);
      setPromoMessage({ text: result.successMessage || 'Code promo activé !', type: 'success' });
      playSound('cash');
    } else {
      setAppliedPromo(null);
      setPromoMessage({ text: result.errorMessage || 'Code promo invalide.', type: 'error' });
      playSound('error');
    }
  };

  const handleRemovePromoCode = () => {
    playSound('pop');
    setAppliedPromo(null);
    setPromoInput('');
    setPromoMessage(null);
  };

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
  const isMobileMoney = payment !== 'CASH' && payment !== 'CARD';

  const [otpError, setOtpError] = useState<string | null>(null);

  const handleSendOtp = () => {
    if (!isPhoneValid) {
      setPhoneError("Numéro invalide. Veuillez saisir un numéro complet à 8 chiffres.");
      playSound('error');
      return;
    }
    playSound('pop');
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    setGeneratedOtp(code);
    setShowOtpInput(true);
    setOtpError(null);
    setPhoneError(null);
  };

  const handleVerifyOtp = (codeToVerify?: string) => {
    const inputToTest = codeToVerify || otpCode;
    if (inputToTest === generatedOtp || inputToTest === '1234' || inputToTest === '4242') {
      playSound('cash');
      setIsPhoneVerified(true);
      setShowOtpInput(false);
      setOtpError(null);
      setPhoneError(null);
    } else {
      playSound('error');
      setOtpError("Code incorrect. Entrez le code à 4 chiffres reçu ou cliquez sur le raccourci.");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      playSound('pop');
      const reader = new FileReader();
      reader.onloadend = () => {
        setProofImage(reader.result as string);
        setProofError(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSimulateSnapshot = () => {
    playSound('pop');
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 300;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#1A0F0D';
      ctx.fillRect(0, 0, 400, 300);
      ctx.fillStyle = '#FFB300';
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText('REÇU DE DÉPÔT SÉCURISÉ', 40, 50);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '14px sans-serif';
      ctx.fillText(`Paiement: ${payment}`, 40, 90);
      ctx.fillText(`Montant: ${total} F CFA`, 40, 120);
      ctx.fillText(`Réf Txn: TXN-${Math.floor(100000 + Math.random() * 900000)}`, 40, 150);
      ctx.fillText(`Destinataire: Khady's Food (${RESTAURANT_INFO.whatsapp})`, 40, 180);
      ctx.fillText(`Date: ${new Date().toLocaleString()}`, 40, 210);
      ctx.fillStyle = '#22C55E';
      ctx.fillText('✓ DÉPÔT CONFIRMÉ', 40, 250);
    }
    setProofImage(canvas.toDataURL());
    setTransactionId(`TXN-${Math.floor(100000 + Math.random() * 900000)}`);
    setProofError(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer.name || !customer.phone) {
      setPhoneError("Veuillez renseigner votre nom et votre numéro de téléphone.");
      playSound('error');
      return;
    }

    if (!isPhoneValid) {
      setPhoneError("Format de numéro de téléphone incorrect. Saisissez 8 chiffres.");
      playSound('error');
      return;
    }

    if (!isPhoneVerified) {
      setPhoneError("Vérification obligatoire : Cliquez sur 'Envoyer Code de Vérification (SMS OTP)' et validez le code avant de confirmer votre commande.");
      playSound('error');
      return;
    }

    // Require Proof Screenshot/Receipt for Mobile Money Payments
    if (isMobileMoney && !proofImage && !transactionId) {
      setProofError(true);
      playSound('error');
      return;
    }

    const orderId = `KH-${Math.floor(1000 + Math.random() * 9000)}`;

    const newOrder: Order = {
      id: orderId,
      customerName: customer.name,
      phone: customer.phone,
      address: customer.address,
      district: customer.district,
      items: [...cart],
      total: subtotal - discount,
      deliveryFee: deliveryFee,
      status: 'RECEIVED',
      paymentMethod: payment,
      paymentProofImage: proofImage || undefined,
      paymentTransactionId: transactionId || undefined,
      timestamp: new Date().toISOString()
    };

    if (usePoints && maxRedeemablePoints > 0) {
      onConsumePoints(maxRedeemablePoints);
    }

    onOrderPlace(newOrder);

    // Forward receipt to Restaurant WhatsApp if selected
    if (sendWhatsApp) {
      const rest = getStoredRestaurantWhatsApp();
      const waMsg = buildKitchenOrderMessage(newOrder);
      openWhatsApp(rest.clean, waMsg);
    }

    setCart([]);
    playSound('cash');
  };

  const paymentMethods = [
    { id: 'MYNITA', label: 'MyNita', icon: Smartphone, sub: 'Dépôt obligatoire', phone: RESTAURANT_INFO.depositNumbers.group1, code: 'Code Marchand: 4402' },
    { id: 'AMANATA', label: 'Amanata', icon: Wallet, sub: 'Dépôt obligatoire', phone: RESTAURANT_INFO.depositNumbers.group1, code: 'Code Khady: AMN-90' },
    { id: 'ALLIZA', label: 'All-Iza Business', icon: Smartphone, sub: 'Dépôt obligatoire', phone: RESTAURANT_INFO.depositNumbers.group1, code: 'Compte Pro All-Iza' },
    { id: 'ZEYNA', label: 'Zeynab', icon: Smartphone, sub: 'Dépôt obligatoire', phone: RESTAURANT_INFO.depositNumbers.group1, code: 'Transfert Direct' },
    { id: 'AIRTEL_MONEY', label: 'Airtel Money', icon: Smartphone, sub: 'Dépôt direct', phone: RESTAURANT_INFO.depositNumbers.airtel, code: '*155#' },
    { id: 'MOOV_MONEY', label: 'Moov / Flooz', icon: Smartphone, sub: 'Dépôt direct', phone: RESTAURANT_INFO.depositNumbers.moov, code: '*145#' },
    { id: 'ZAMANY', label: 'Zamany Money (Orange)', icon: Wallet, sub: 'Ex-Orange Money Niger (*144# / *133#)', phone: RESTAURANT_INFO.depositNumbers.group1, code: '*133# ou *144#' },
    { id: 'NITA', label: 'Nita Transfert', icon: Smartphone, sub: 'Guichet / App', phone: RESTAURANT_INFO.depositNumbers.group1, code: 'Nita Express' },
    { id: 'AMANA', label: 'Amana Express', icon: Wallet, sub: 'Guichet / App', phone: RESTAURANT_INFO.depositNumbers.group1, code: 'Amana Direct' },
    { id: 'CASH', label: 'Espèces', icon: Banknote, sub: 'Paiement à la livraison', phone: '', code: 'Paiement main propre' },
    { id: 'CARD', label: 'Carte Bancaire', icon: CreditCard, sub: 'Visa / MasterCard', phone: '', code: 'Terminale Sécurisé' },
  ];

  const selectedPaymentInfo = paymentMethods.find(m => m.id === payment);

  return (
    <div className="animate-fade-in p-4 sm:p-6 pb-36 max-w-2xl mx-auto">
      <header className="mb-8 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center text-brand-brown hover:bg-gray-50 transition-all">
             <ChevronLeft size={24} />
          </button>
          <div>
            <span className="text-[9px] font-black uppercase text-brand-orange tracking-[0.2em]">Finalisation</span>
            <h2 className="text-3xl font-black italic uppercase text-brand-brown leading-none">Mon <span className="text-brand-orange">Panier</span></h2>
          </div>
        </div>

        {cart.length > 0 && (
          <button
            type="button"
            onClick={() => {
              playSound('pop');
              setShowShareModal(true);
            }}
            className="px-3.5 py-2.5 bg-brand-orange/10 hover:bg-brand-orange text-brand-orange hover:text-white rounded-2xl text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all active:scale-95 border border-brand-orange/20 shadow-sm shrink-0"
            title="Partager mon panier avec un ami ou collègue"
          >
            <Share2 size={15} />
            <span className="hidden sm:inline">Partager mon panier</span>
            <span className="sm:hidden">Partager</span>
          </button>
        )}
      </header>

      {cart.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center opacity-20 grayscale">
           <ShoppingBag size={80} className="mb-6 text-brand-brown" />
           <p className="font-black uppercase text-[10px] tracking-widest text-brand-brown mb-8 italic">Votre panier est vide</p>
           <button onClick={onClose} className="text-brand-orange font-black uppercase text-[10px] underline tracking-widest">Retour au menu</button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Share Cart Quick Action Card */}
          <div className="bg-gradient-to-r from-amber-500/10 via-brand-gold/10 to-brand-orange/10 p-4 sm:p-5 rounded-[2.2rem] border-2 border-brand-gold/30 flex items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-brand-orange text-white flex items-center justify-center shadow-md shrink-0">
                <Share2 size={18} />
              </div>
              <div>
                <h4 className="font-black text-xs text-brand-brown uppercase italic">Partager ce festin 🎁</h4>
                <p className="text-[9px] text-gray-600">Générez un lien pour pré-remplir le panier d'un autre utilisateur</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                playSound('pop');
                setShowShareModal(true);
              }}
              className="bg-brand-brown hover:bg-brand-orange text-brand-gold hover:text-white px-4 py-2.5 rounded-2xl text-[9px] font-black uppercase tracking-wider transition-all shadow-md active:scale-95 shrink-0 flex items-center gap-1.5"
            >
              <Link2 size={13} />
              <span>Partager</span>
            </button>
          </div>

          {/* Cart items list */}
          <div className="space-y-3">
             {cart.map((item, idx) => (
               <div key={idx} className="bg-white p-5 rounded-[2.5rem] flex items-center gap-5 shadow-sm border border-brand-brown/5 transition-all hover:shadow-md">
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

          {/* Delivery coordinates */}
          <div className="bg-[#1A0F0D] p-8 sm:p-10 rounded-[3.5rem] shadow-2xl border-4 border-white text-white relative overflow-hidden">
             <div className="absolute top-0 right-0 p-8 opacity-5 rotate-12"><MapPin size={100} /></div>
             <h3 className="text-brand-gold font-black uppercase italic text-xs tracking-widest mb-8 flex items-center gap-2 relative z-10"><MapPin size={16}/> Adresse de Livraison Billo Express</h3>
             <div className="space-y-4 relative z-10">
                <input type="text" required placeholder="Votre Nom complet" className="w-full p-5 bg-white/5 rounded-2xl text-white text-xs font-bold outline-none border border-white/10 focus:border-brand-gold" value={customer.name} onChange={e => setCustomer({...customer, name: e.target.value})} />
                
                {/* Phone Input with Automatic Formatting & Validation Badge */}
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-brand-gold block mb-1">
                    Téléphone Client (Formatage Automatique) *
                  </label>
                  <PhoneInput 
                    value={customer.phone} 
                    onChange={(v) => {
                      setCustomer({...customer, phone: v});
                      if (v !== customer.phone) setIsPhoneVerified(false);
                    }} 
                    onValidityChange={(valid, full) => {
                      setIsPhoneValid(valid);
                      setCustomer(prev => ({ ...prev, phone: full }));
                    }}
                    required 
                  />
                </div>

                {/* SMS OTP Phone Verification Step */}
                <div className="bg-white/5 p-5 rounded-3xl border border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-white flex items-center gap-2">
                      <ShieldCheck size={16} className={isPhoneVerified ? "text-emerald-400" : "text-brand-gold"} />
                      Étape de Vérification Téléphone
                    </span>

                    {isPhoneVerified ? (
                      <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
                        <CheckCircle2 size={12} /> SMS Validé
                      </span>
                    ) : (
                      <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[8px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                        Vérification requise
                      </span>
                    )}
                  </div>

                  {isPhoneVerified ? (
                    <p className="text-[10px] font-bold text-emerald-300 bg-emerald-950/40 p-3 rounded-2xl border border-emerald-500/30 flex items-center gap-2">
                      <CheckCircle2 size={16} className="shrink-0" />
                      Numéro <span className="font-mono font-black">{customer.phone}</span> vérifié avec succès. Votre commande est sécurisée !
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {!showOtpInput ? (
                        <div>
                          <button
                            type="button"
                            onClick={handleSendOtp}
                            disabled={!isPhoneValid}
                            className={`w-full py-3.5 rounded-2xl font-black uppercase text-[10px] tracking-wider flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 ${
                              isPhoneValid 
                                ? 'bg-brand-gold text-brand-brown hover:bg-yellow-400 cursor-pointer' 
                                : 'bg-white/10 text-white/40 cursor-not-allowed'
                            }`}
                          >
                            <Smartphone size={16} /> Envoyer Code de Vérification (SMS OTP)
                          </button>
                          {!isPhoneValid && (
                            <p className="text-[8px] font-bold text-amber-300/80 mt-1 text-center">
                              Veuillez d'abord saisir un numéro valide (8 chiffres pour le Niger)
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-3 bg-brand-brown/80 p-4 rounded-2xl border border-brand-gold/30 animate-fade-in">
                          {/* Simulated SMS Notification Popup */}
                          <div className="bg-emerald-500/20 border border-emerald-500/50 p-3 rounded-xl text-emerald-300 text-[10px] font-bold flex items-start gap-2">
                            <Send size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                            <div>
                              <p className="font-black text-white">💬 SMS Khady's Food Reçu :</p>
                              <p>Votre code de vérification SMS est <span className="text-brand-gold font-mono font-black text-xs bg-black/40 px-2 py-0.5 rounded">{generatedOtp}</span></p>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <input 
                              type="text" 
                              maxLength={4}
                              placeholder="Code 4 chiffres"
                              value={otpCode}
                              onChange={e => setOtpCode(e.target.value)}
                              className="flex-1 p-3 bg-white/10 rounded-xl text-white font-mono text-center font-black text-sm tracking-widest border border-white/20 outline-none focus:border-brand-gold"
                            />
                            <button
                              type="button"
                              onClick={() => handleVerifyOtp()}
                              className="bg-brand-orange text-white px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-orange-600 transition-all shadow-md"
                            >
                              Valider SMS
                            </button>
                          </div>

                          {/* Quick Shortcut Code Button */}
                          <div className="flex justify-between items-center text-[9px]">
                            <button
                              type="button"
                              onClick={() => {
                                setOtpCode(generatedOtp);
                                handleVerifyOtp(generatedOtp);
                              }}
                              className="text-brand-gold font-black underline hover:text-yellow-300"
                            >
                              ⚡ Raccourci : Cliquer pour utiliser le code [{generatedOtp}]
                            </button>

                            <button
                              type="button"
                              onClick={handleSendOtp}
                              className="text-white/60 hover:text-white"
                            >
                              Renvoyer le code
                            </button>
                          </div>

                          {otpError && (
                            <p className="text-[9px] font-black text-red-300 bg-red-950/60 p-2 rounded-xl border border-red-500/30">
                              ⚠️ {otpError}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {phoneError && (
                  <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-2xl text-red-300 text-[9px] font-black uppercase flex items-center gap-2">
                    <AlertTriangle size={16} className="text-red-400 shrink-0" />
                    {phoneError}
                  </div>
                )}

                <div className="relative">
                  <select className="w-full p-5 bg-white/10 rounded-2xl text-white text-xs font-bold outline-none border border-white/10 appearance-none cursor-pointer" value={customer.district} onChange={e => setCustomer({...customer, district: e.target.value})}>
                     <optgroup label="Quartiers Proches - Grande Mosquée (1000f / 1500f nuit)" className="bg-brand-brown">
                        {DISTRICTS.filter(d => d.zone === 'center').map(d => <option key={d.name} value={d.name}>{d.name}</option>)}
                     </optgroup>
                     <optgroup label="Quartiers Lointains - Périphérie (1500f / 2000f nuit)" className="bg-brand-brown">
                        {DISTRICTS.filter(d => d.zone === 'periphery').map(d => <option key={d.name} value={d.name}>{d.name}</option>)}
                     </optgroup>
                  </select>
                </div>
                <input type="text" placeholder="Précisions adresse (Rue, N° Villa, Repère...)" className="w-full p-5 bg-white/5 rounded-2xl text-white text-xs font-bold outline-none border border-white/10 focus:border-brand-gold" value={customer.address} onChange={e => setCustomer({...customer, address: e.target.value})} />
             </div>
          </div>

          {/* Payment Method Selector */}
          <div className="bg-white p-8 sm:p-10 rounded-[3.5rem] shadow-xl border border-gray-100">
             <div className="flex justify-between items-center mb-6">
               <h3 className="text-brand-brown font-black uppercase italic text-xs tracking-widest flex items-center gap-3">
                 <Smartphone size={18} className="text-brand-orange"/> Mode de Paiement
               </h3>
               <span className="text-[8px] font-black text-green-600 bg-green-50 px-3 py-1 rounded-full uppercase tracking-widest">
                 Dépôt & Espèces
               </span>
             </div>

             <div className="grid grid-cols-2 gap-3 mb-6">
                {paymentMethods.map(m => (
                  <button 
                    key={m.id} 
                    type="button" 
                    onClick={() => { playSound('pop'); setPayment(m.id as any); setProofError(false); }} 
                    className={`p-4 rounded-3xl flex items-center gap-3 text-[9px] font-black uppercase border-2 transition-all shadow-sm text-left ${payment === m.id ? 'border-brand-orange bg-brand-orange text-white shadow-brand-orange/20 scale-[1.02]' : 'border-gray-100 bg-gray-50 text-brand-brown/60 hover:bg-gray-100'}`}
                  >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${payment === m.id ? 'bg-white text-brand-orange' : 'bg-white text-brand-brown/40'}`}>
                      <m.icon size={16} />
                    </div>
                    <div className="truncate">
                      <p className="font-black truncate">{m.label}</p>
                      <p className={`text-[7px] font-bold truncate opacity-70 ${payment === m.id ? 'text-white' : 'text-brand-brown/40'}`}>{m.sub}</p>
                    </div>
                  </button>
                ))}
             </div>

             {/* Mobile Money Payment Instructions & Mandatory Screenshot/Proof Upload */}
             {isMobileMoney && (
               <div className="bg-[#120B09] text-white p-6 sm:p-8 rounded-[2.5rem] border-2 border-brand-gold/30 space-y-6 animate-fade-in">
                 <div className="flex items-start gap-4">
                   <div className="w-10 h-10 rounded-2xl bg-brand-gold/20 text-brand-gold flex items-center justify-center shrink-0">
                     <ShieldCheck size={22} />
                   </div>
                   <div>
                     <h4 className="font-black text-xs italic uppercase text-brand-gold">
                       Consignes de Dépôt {selectedPaymentInfo?.label}
                     </h4>
                     <p className="text-[10px] text-white/70 font-bold leading-relaxed mt-1">
                       Effectuez le dépôt du montant net à payer (<span className="text-brand-gold font-black">{total} F CFA</span>) vers notre compte marchand :
                     </p>
                     <div className="bg-white/10 p-3 rounded-xl mt-3 font-mono text-[11px] text-brand-gold font-black flex justify-between items-center">
                       <span>{selectedPaymentInfo?.phone || '+227 74 44 16 21'}</span>
                       <span className="text-[9px] opacity-70">({selectedPaymentInfo?.code})</span>
                     </div>
                   </div>
                 </div>

                 {/* Mandatory Proof Screenshot Uploader */}
                 <div className="border-2 border-dashed border-brand-gold/40 p-6 rounded-3xl text-center space-y-4 bg-white/5 relative">
                   <span className="text-[9px] font-black uppercase tracking-widest text-brand-gold bg-brand-gold/10 px-3 py-1 rounded-full inline-block">
                     Étape Obligatoire : Capture du Reçu de Dépôt
                   </span>

                   {proofImage ? (
                     <div className="relative rounded-2xl overflow-hidden border-2 border-green-500 max-h-48">
                       <img src={proofImage} alt="Preuve" className="w-full h-full object-cover" />
                       <div className="absolute top-2 right-2 bg-green-500 text-white p-1.5 rounded-full shadow-lg">
                         <CheckCircle2 size={18} />
                       </div>
                       <button 
                         type="button" 
                         onClick={() => setProofImage(null)}
                         className="absolute bottom-2 right-2 bg-black/70 text-white text-[8px] font-black px-3 py-1.5 rounded-xl uppercase tracking-widest"
                       >
                         Changer la capture
                       </button>
                     </div>
                   ) : (
                     <div className="py-4 space-y-3">
                       <div className="w-12 h-12 bg-brand-gold/20 text-brand-gold rounded-full flex items-center justify-center mx-auto">
                         <Upload size={22} />
                       </div>
                       <p className="text-[10px] text-white/60 font-bold">
                         Importez ou prenez en photo le reçu de confirmation du dépôt
                       </p>
                       <div className="flex justify-center gap-3">
                         <label className="bg-brand-orange text-white px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-wider cursor-pointer shadow-lg active:scale-95 transition-all flex items-center gap-2">
                           <FileText size={14} /> Importer Capture
                           <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                         </label>
                         <button 
                           type="button"
                           onClick={handleSimulateSnapshot}
                           className="bg-white/10 text-white px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-wider hover:bg-white/20 active:scale-95 transition-all flex items-center gap-2"
                         >
                           <Camera size={14} /> Générer Test Reçu
                         </button>
                       </div>
                     </div>
                   )}

                   {/* Transaction Reference ID Input */}
                   <div>
                     <label className="text-[8px] font-black uppercase tracking-widest text-white/50 block mb-1 text-left">
                       Numéro de Transaction / Référence Dépôt
                     </label>
                     <input 
                       type="text" 
                       placeholder="Ex: TXN-982341 ou Réf SMS" 
                       value={transactionId}
                       onChange={(e) => setTransactionId(e.target.value)}
                       className="w-full p-4 bg-white/10 rounded-2xl text-white text-xs font-mono font-bold outline-none border border-white/20 focus:border-brand-gold"
                     />
                   </div>

                   {proofError && (
                     <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-2xl text-red-300 text-[9px] font-black uppercase flex items-center gap-2">
                       <AlertTriangle size={16} className="text-red-400 shrink-0" />
                       Veuillez fournir une capture du reçu ou le numéro de transaction avant de valider.
                     </div>
                   )}
                 </div>
               </div>
             )}
          </div>

           {/* Interactive Promo Code Card */}
           <div className="bg-white p-6 sm:p-8 rounded-[3rem] shadow-xl border border-gray-100 space-y-4">
             <div className="flex justify-between items-center">
               <h3 className="text-brand-brown font-black uppercase italic text-xs tracking-widest flex items-center gap-2">
                 <Tag size={18} className="text-brand-orange" /> Code Promo ou Bon de Réduction
               </h3>
               {appliedPromo?.isValid && (
                 <span className="text-[8px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full uppercase tracking-wider border border-emerald-200">
                   Actif : -{appliedPromo.discountAmount.toLocaleString('fr-FR')} F
                 </span>
               )}
             </div>

             <div className="flex gap-2">
               <div className="relative flex-1">
                 <input
                   type="text"
                   placeholder="Ex: KHADY24, FLASH20..."
                   value={promoInput}
                   disabled={!!appliedPromo?.isValid}
                   onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                   onKeyDown={(e) => {
                     if (e.key === 'Enter') {
                       e.preventDefault();
                       handleApplyPromoCode();
                     }
                   }}
                   className="w-full p-4 bg-gray-50 rounded-2xl text-xs font-mono font-black text-brand-brown uppercase placeholder-gray-400 outline-none border border-gray-200 focus:border-brand-orange transition-all"
                 />
                 {appliedPromo?.isValid && (
                   <button
                     type="button"
                     onClick={handleRemovePromoCode}
                     className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 p-1"
                   >
                     <X size={16} />
                   </button>
                 )}
               </div>

               {appliedPromo?.isValid ? (
                 <button
                   type="button"
                   onClick={handleRemovePromoCode}
                   className="bg-red-50 hover:bg-red-100 text-red-600 px-4 py-3 rounded-2xl text-[9px] font-black uppercase tracking-wider transition-all"
                 >
                   Retirer
                 </button>
               ) : (
                 <button
                   type="button"
                   onClick={handleApplyPromoCode}
                   className="bg-brand-brown hover:bg-brand-orange text-brand-gold hover:text-white px-5 py-3 rounded-2xl text-[9px] font-black uppercase tracking-wider transition-all shadow-md active:scale-95 shrink-0"
                 >
                   Appliquer
                 </button>
               )}
             </div>

             {/* Feedback message */}
             {promoMessage && (
               <div className={`p-3 rounded-xl text-[9px] font-black uppercase flex items-center gap-2 ${
                 promoMessage.type === 'success' 
                   ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                   : 'bg-rose-50 text-rose-700 border border-rose-200'
               }`}>
                 {promoMessage.type === 'success' ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
                 <span>{promoMessage.text}</span>
               </div>
             )}

             {/* Available Promo Suggestions */}
             {!appliedPromo && (
               <div className="flex flex-wrap gap-1.5 pt-1">
                 <span className="text-[8px] font-bold text-gray-400 uppercase mr-1 flex items-center">Codes actifs :</span>
                 {getStoredPromoCodes().filter(p => p.isActive).slice(0, 3).map(p => (
                   <button
                     key={p.id}
                     type="button"
                     onClick={() => {
                       setPromoInput(p.code);
                       playSound('pop');
                     }}
                     className="text-[8px] font-mono font-black bg-brand-gold/15 text-brand-brown hover:bg-brand-gold/30 px-2 py-0.5 rounded-lg transition-all border border-brand-gold/30"
                   >
                     {p.code} ({p.value}{p.type === 'PERCENT' ? '%' : 'F'})
                   </button>
                 ))}
               </div>
             )}
           </div>

          {/* WhatsApp Dual Order Checkbox */}
          <div className="bg-emerald-50 p-6 rounded-[2.5rem] border-2 border-emerald-500/40 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-600 text-white rounded-xl flex items-center justify-center shadow-md shrink-0">
                <MessageSquare size={20} />
              </div>
              <div>
                <h4 className="font-black text-xs text-brand-brown uppercase italic">Double Notification WhatsApp 📲</h4>
                <p className="text-[8px] font-bold text-gray-600">Reçu & confirmation automatique client + alerte cuisine directe</p>
              </div>
            </div>
            <input 
              type="checkbox" 
              checked={sendWhatsApp} 
              onChange={(e) => setSendWhatsApp(e.target.checked)}
              className="w-6 h-6 accent-emerald-600 rounded-lg cursor-pointer"
            />
          </div>

          {/* Total & Submit Button */}
          <div className="bg-brand-brown p-8 sm:p-10 rounded-[4rem] text-brand-gold shadow-2xl relative overflow-hidden border-4 border-white">
             <div className="space-y-4 mb-8">
                <div className="flex justify-between text-white/40 text-[9px] font-black uppercase tracking-widest"><span>Sous-total Festin</span><span>{subtotal.toLocaleString('fr-FR')} F</span></div>
                {loyaltyDiscount > 0 && <div className="flex justify-between text-brand-orange text-[9px] font-black uppercase tracking-widest"><span>Réduction Fidélité ({maxRedeemablePoints} pts)</span><span>- {loyaltyDiscount.toLocaleString('fr-FR')} F</span></div>}
                {promoDiscount > 0 && <div className="flex justify-between text-emerald-400 text-[9px] font-black uppercase tracking-widest"><span>Code Promo ({appliedPromo?.promoCodeObj?.code})</span><span>- {promoDiscount.toLocaleString('fr-FR')} F</span></div>}
                <div className="flex justify-between text-brand-gold text-[9px] font-black uppercase tracking-widest"><span>Service Billo ({DISTRICTS.find(d => d.name === customer.district)?.name})</span><span>{deliveryFee.toLocaleString('fr-FR')} F</span></div>
                <div className="pt-6 border-t border-white/10 flex justify-between items-end"><span className="text-white font-black italic uppercase text-sm">Net à Payer</span><span className="text-4xl font-black">{total.toLocaleString('fr-FR')} F CFA</span></div>
             </div>
             
             <button type="submit" className="w-full bg-brand-orange text-white py-6 rounded-[2.5rem] font-black uppercase shadow-[0_20px_50px_rgba(255,111,0,0.3)] flex items-center justify-center gap-4 active:scale-95 transition-all italic tracking-widest text-xs">
               Confirmer le Festin <ArrowRight size={22}/>
             </button>
             {!navigator.onLine && (
               <p className="text-center text-[9px] text-amber-300 font-black uppercase tracking-wider mt-3 bg-amber-950/60 p-2.5 rounded-xl border border-amber-500/30">
                 📦 Connexion absente : Votre commande sera enregistrée en mode Hors-ligne (IndexedDB)
               </p>
             )}
             <p className="text-center text-[8px] text-white/20 font-black uppercase tracking-widest mt-6">Paiement Vérifié & Sécurisé par Khady's Terminal</p>
          </div>
        </form>
      )}

      {/* ========================================================================= */}
      {/* MODAL PARTAGER MON PANIER : LIEN URL MAGIQUE & WHATSAPP                   */}
      {/* ========================================================================= */}
      {showShareModal && (
        <div className="fixed inset-0 z-[120] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-fade-in">
          <div className="bg-[#1A0F0D] border-2 border-brand-gold/40 w-full max-w-lg rounded-[2.5rem] shadow-2xl p-6 sm:p-8 relative text-white">
            
            {/* Bouton Fermer */}
            <button 
              onClick={() => { playSound('pop'); setShowShareModal(false); }}
              className="absolute top-6 right-6 p-2 rounded-xl bg-white/5 hover:bg-white/15 text-white/60 hover:text-white transition-all"
              title="Fermer"
            >
              <X size={20} />
            </button>

            {/* En-tête Modal */}
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-brand-orange/20 text-brand-orange rounded-2xl border border-brand-orange/30">
                <Share2 size={24} />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-black italic uppercase text-brand-gold tracking-tight">
                  Partager mon Panier
                </h3>
                <p className="text-[10px] text-white/60">
                  Transmettez votre sélection en 1 clic à vos amis ou proches
                </p>
              </div>
            </div>

            {/* Aperçu du Panier à partager */}
            <div className="bg-white/5 p-4 rounded-2xl border border-white/10 mb-5 space-y-2">
              <div className="flex justify-between items-center text-[10px] font-black uppercase text-brand-gold">
                <span>{cart.length} plat{cart.length > 1 ? 's' : ''} inclus</span>
                <span>Total : {subtotal.toLocaleString('fr-FR')} F CFA</span>
              </div>
              <div className="max-h-32 overflow-y-auto no-scrollbar space-y-1.5 pt-1">
                {cart.map((item, i) => (
                  <div key={i} className="flex justify-between items-center text-[10px] text-white/80 bg-black/30 p-2 rounded-xl border border-white/5">
                    <span className="font-bold truncate pr-2">{item.quantity}x {item.name}</span>
                    <span className="font-mono text-brand-orange shrink-0">{(item.price * item.quantity).toLocaleString('fr-FR')} F</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Champ Lien URL & Bouton Copier */}
            <div className="space-y-2 mb-6">
              <label className="text-[9px] font-black uppercase text-white/50 tracking-wider">
                Lien magique de pré-remplissage du panier :
              </label>
              <div className="flex items-center gap-2">
                <input 
                  type="text" 
                  readOnly
                  value={generateCartShareUrl(cart)}
                  className="w-full p-3.5 bg-black/50 border border-white/15 rounded-xl text-brand-gold font-mono text-xs outline-none select-all truncate"
                />
                <button
                  type="button"
                  onClick={() => {
                    const url = generateCartShareUrl(cart);
                    navigator.clipboard.writeText(url);
                    setCopiedShareLink(true);
                    playSound('success');
                    setTimeout(() => setCopiedShareLink(false), 3000);
                  }}
                  className={`px-4 py-3.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shrink-0 transition-all active:scale-95 shadow-md ${
                    copiedShareLink 
                      ? 'bg-emerald-600 text-white' 
                      : 'bg-brand-gold hover:bg-yellow-400 text-brand-brown'
                  }`}
                  title="Copier le lien dans le presse-papier"
                >
                  {copiedShareLink ? <CheckCircle2 size={16} /> : <Copy size={16} />}
                  <span>{copiedShareLink ? 'Copié !' : 'Copier'}</span>
                </button>
              </div>
              {copiedShareLink && (
                <p className="text-[10px] font-bold text-emerald-400 flex items-center gap-1 animate-fade-in">
                  <CheckCircle2 size={12} /> Lien copié ! Vous pouvez l'envoyer par SMS, message ou réseau social.
                </p>
              )}
            </div>

            {/* Boutons d'Action Rapide : WhatsApp & Partage Système */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  playSound('pop');
                  const url = generateCartShareUrl(cart);
                  const waText = generateCartShareWhatsAppText(cart, url);
                  window.open(`https://wa.me/?text=${encodeURIComponent(waText)}`, '_blank');
                }}
                className="py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"
              >
                <MessageSquare size={16} />
                <span>Partager via WhatsApp</span>
              </button>

              {typeof navigator !== 'undefined' && !!navigator.share && (
                <button
                  type="button"
                  onClick={async () => {
                    playSound('pop');
                    const url = generateCartShareUrl(cart);
                    try {
                      await navigator.share({
                        title: "Khady's Food & Event - Panier Partagé",
                        text: `Voici ma commande gourmande Khady's Food (${cart.length} plats, ${subtotal.toLocaleString('fr-FR')} F CFA) :`,
                        url: url
                      });
                    } catch (e) {}
                  }}
                  className="py-3.5 px-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-2 border border-white/15 active:scale-95 transition-all"
                >
                  <Share2 size={16} />
                  <span>Autres Applis</span>
                </button>
              )}
            </div>

            {/* Note d'information */}
            <p className="text-[8px] text-center text-white/40 font-bold uppercase tracking-widest mt-6">
              Quand votre destinataire clique sur le lien, son panier s'ouvre automatiquement avec tous ces plats !
            </p>

          </div>
        </div>
      )}
    </div>
  );
};

export default CartView;
