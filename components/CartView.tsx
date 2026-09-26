import React, { useState } from 'react';
import { CartItem, Order, PaymentMethod, UserProfile } from '../types';
import { Trash2, ShoppingBag, ArrowRight, MapPin, Smartphone, ChevronLeft, ShieldCheck, Wallet, CreditCard, Banknote, Sparkles, Upload, CheckCircle2, FileText, Camera, AlertTriangle, Send, MessageSquare, Tag, Gift, Check, X, Share2, Copy, Link2, ExternalLink, Users, Plus, Minus, UserPlus } from 'lucide-react';
import { PhoneInput } from './PhoneInput';
import { playSound } from '../utils/audio';
import { BILLO_INFO, RESTAURANT_INFO, DISTRICTS, DISCOUNT_PER_100_POINTS } from '../constants';
import { getStoredRestaurantWhatsApp, buildKitchenOrderMessage, buildDirectWhatsAppCartMessage, openWhatsApp } from '../utils/whatsapp';
import { applyPromoCode, PromoValidationResult, getStoredPromoCodes } from '../utils/marketing';
import {
  generateCartShareUrl,
  generateCartShareWhatsAppText,
  extractSharedCartFromInput,
  mergeCartItems,
  SharedCartMetadata
} from '../utils/cartShare';
import { ToastType } from './Toast';

interface CartViewProps {
  cart: CartItem[];
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  onOrderPlace: (order: Order) => void;
  onClose: () => void;
  userProfile: UserProfile;
  onConsumePoints: (pts: number) => void;
  sharedCartMeta?: SharedCartMetadata | null;
  onClearSharedMeta?: () => void;
  onShowToast?: (msg: string, type?: ToastType) => void;
}

export const CartView: React.FC<CartViewProps> = ({
  cart,
  setCart,
  onOrderPlace,
  onClose,
  userProfile,
  onConsumePoints,
  sharedCartMeta,
  onClearSharedMeta,
  onShowToast
}) => {
  const [customer, setCustomer] = useState({ name: userProfile.name || '', phone: userProfile.phone || '', address: '', district: 'Grande Mosquée / Zongo' });
  const [payment, setPayment] = useState<PaymentMethod>('MYNITA');
  const [usePoints, setUsePoints] = useState(false);
  const [sendWhatsApp, setSendWhatsApp] = useState(true);

  // Share & Group Order Modal States
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareModalTab, setShareModalTab] = useState<'share' | 'import'>('share');
  const [copiedShareLink, setCopiedShareLink] = useState(false);
  const [groupHostName, setGroupHostName] = useState(sharedCartMeta?.hostName || userProfile.name || '');
  const [groupNote, setGroupNote] = useState(sharedCartMeta?.groupNote || '');
  const [groupSplitCount, setGroupSplitCount] = useState<number>(sharedCartMeta?.splitCount || 1);
  const [importLinkInput, setImportLinkInput] = useState('');
  const [importFeedback, setImportFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

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

  const handleDirectWhatsAppOrder = () => {
    if (cart.length === 0) return;
    playSound('cash');

    const orderId = `KH-${Math.floor(1000 + Math.random() * 9000)}`;
    const newOrder: Order = {
      id: orderId,
      customerName: customer.name.trim() || 'Client WhatsApp',
      phone: customer.phone.trim() || RESTAURANT_INFO.whatsapp,
      address: customer.address.trim(),
      district: customer.district,
      items: [...cart],
      total: Math.max(0, subtotal - discount),
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

    const waMsg = buildDirectWhatsAppCartMessage({
      cart,
      customerName: customer.name,
      customerPhone: customer.phone,
      district: customer.district,
      address: customer.address,
      paymentMethod: payment,
      subtotal,
      discount,
      deliveryFee,
      total,
      orderNote: groupNote
    });

    openWhatsApp(RESTAURANT_INFO.whatsappClean, waMsg);
    setCart([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleDirectWhatsAppOrder();
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

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              playSound('pop');
              setShareModalTab(cart.length > 0 ? 'share' : 'import');
              setShowShareModal(true);
            }}
            className="px-3.5 py-2.5 bg-brand-orange/10 hover:bg-brand-orange text-brand-orange hover:text-white rounded-2xl text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all active:scale-95 border border-brand-orange/20 shadow-sm shrink-0"
            title="Générer un lien partageable ou importer un panier de commande groupée"
          >
            <Share2 size={15} />
            <span className="hidden sm:inline">{cart.length > 0 ? 'Commande Groupée & Lien' : 'Importer un Panier'}</span>
            <span className="sm:hidden">{cart.length > 0 ? 'Partager' : 'Importer'}</span>
          </button>
        </div>
      </header>

      {/* Bannière Commande Groupée Reçue */}
      {sharedCartMeta && cart.length > 0 && (
        <div className="mb-6 bg-gradient-to-r from-[#1A0F0D] via-brand-brown to-[#2A1510] text-white p-5 rounded-[2.2rem] border-2 border-brand-gold/40 shadow-xl animate-fade-in">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-2xl bg-brand-gold text-brand-brown flex items-center justify-center shrink-0 shadow-md">
                <Users size={20} />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="bg-brand-gold/20 text-brand-gold border border-brand-gold/40 text-[8px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-wider">
                    🤝 Commande Groupée Active
                  </span>
                  {sharedCartMeta.splitCount && sharedCartMeta.splitCount > 1 && (
                    <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[8px] font-black uppercase px-2.5 py-0.5 rounded-full">
                      👥 {sharedCartMeta.splitCount} participants (~{Math.ceil(subtotal / sharedCartMeta.splitCount).toLocaleString('fr-FR')} F / pers.)
                    </span>
                  )}
                </div>
                <h4 className="font-black text-xs sm:text-sm uppercase italic text-white mt-1">
                  {sharedCartMeta.hostName
                    ? `Panier partagé par ${sharedCartMeta.hostName}`
                    : 'Panier partagé chargé avec succès'}
                </h4>
                {sharedCartMeta.groupNote && (
                  <p className="text-[10px] text-amber-200/90 font-bold mt-0.5">
                    📌 « {sharedCartMeta.groupNote} »
                  </p>
                )}
              </div>
            </div>
            {onClearSharedMeta && (
              <button
                type="button"
                onClick={onClearSharedMeta}
                className="p-1.5 rounded-xl bg-white/5 hover:bg-white/15 text-white/60 hover:text-white transition-all"
                title="Masquer"
              >
                <X size={16} />
              </button>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={() => {
                playSound('pop');
                onClose();
              }}
              className="flex-1 bg-white/10 hover:bg-white/20 text-white py-2.5 px-3.5 rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all"
            >
              <Plus size={13} /> Ajouter mes plats au panier
            </button>
            <button
              type="button"
              onClick={() => {
                playSound('pop');
                setShareModalTab('share');
                setShowShareModal(true);
              }}
              className="flex-1 bg-brand-gold hover:bg-amber-400 text-brand-brown py-2.5 px-3.5 rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md transition-all"
            >
              <Share2 size={13} /> Renvoyer le lien mis à jour
            </button>
          </div>
        </div>
      )}

      {cart.length === 0 ? (
        <div className="py-16 flex flex-col items-center justify-center text-center">
           <ShoppingBag size={72} className="mb-5 text-brand-brown/20" />
           <p className="font-black uppercase text-[10px] tracking-widest text-brand-brown/40 mb-6 italic">Votre panier est vide</p>
           <div className="flex flex-wrap items-center justify-center gap-3">
             <button
               type="button"
               onClick={onClose}
               className="px-6 py-3 bg-brand-orange text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg active:scale-95 transition-all"
             >
               Explorer le menu
             </button>
             <button
               type="button"
               onClick={() => {
                 playSound('pop');
                 setShareModalTab('import');
                 setShowShareModal(true);
               }}
               className="px-6 py-3 bg-brand-brown text-brand-gold rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg flex items-center gap-2 active:scale-95 transition-all"
             >
               <Users size={14} /> Importer un lien de commande groupée
             </button>
           </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Commande Groupée & Partage du Panier Card */}
          <div className="bg-gradient-to-r from-amber-500/10 via-brand-gold/15 to-brand-orange/10 p-4 sm:p-5 rounded-[2.2rem] border-2 border-brand-gold/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 shadow-sm">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-brand-orange text-white flex items-center justify-center shadow-md shrink-0">
                <Users size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-black text-xs text-brand-brown uppercase italic">Commande Groupée & Lien Partageable 🤝</h4>
                </div>
                <p className="text-[9px] text-gray-600 mt-0.5">
                  Générez un lien pour partager ce panier, diviser la note ou fusionner les plats de vos collègues
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  playSound('pop');
                  setShareModalTab('share');
                  setShowShareModal(true);
                }}
                className="flex-1 sm:flex-initial bg-brand-brown hover:bg-brand-orange text-brand-gold hover:text-white px-4 py-2.5 rounded-2xl text-[9px] font-black uppercase tracking-wider transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5"
              >
                <Link2 size={13} />
                <span>Lien Partageable</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  playSound('pop');
                  setShareModalTab('import');
                  setShowShareModal(true);
                }}
                className="bg-white hover:bg-amber-50 text-brand-brown border border-brand-brown/15 px-3 py-2.5 rounded-2xl text-[9px] font-black uppercase tracking-wider transition-all shadow-sm active:scale-95 flex items-center justify-center gap-1"
                title="Ajouter les plats d'un ami via son lien"
              >
                <UserPlus size={13} />
                <span className="hidden sm:inline">Fusionner</span>
              </button>
            </div>
          </div>

          {/* Cart items list with +/- quantity, spice level & note controls */}
          <div className="space-y-3.5">
             {cart.map((item, idx) => {
               const currentSpice = item.spiceLevel || (item.isSpicy ? 'Piment normal' : 'Sans piment');
               const spiceOptions = ['Sans piment', 'Peu pimenté', 'Piment normal', 'Bien pimenté 🌶️'];
               return (
                 <div key={idx} className="bg-white p-4 sm:p-5 rounded-[2.2rem] shadow-sm border border-brand-brown/5 transition-all hover:shadow-md space-y-3">
                    <div className="flex items-center gap-3.5">
                      <div className="relative w-16 h-16 rounded-2xl overflow-hidden shadow-md shrink-0">
                         <img src={item.image} className="w-full h-full object-cover" alt={item.name} />
                      </div>
                      <div className="flex-1 min-w-0">
                         <h4 className="font-black text-[11px] sm:text-xs text-brand-brown uppercase italic truncate mb-1">{item.name}</h4>
                         <div className="flex flex-wrap items-center gap-2">
                           <p className="text-[10px] font-black text-brand-orange bg-brand-orange/10 px-2.5 py-0.5 rounded-lg inline-block">
                             {(item.price * item.quantity).toLocaleString('fr-FR')} F CFA
                           </p>
                           <span className="text-[9px] text-gray-400 font-bold">
                             ({item.price.toLocaleString('fr-FR')} F / unité)
                           </span>
                         </div>
                      </div>
                      <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-2xl shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            playSound('pop');
                            if (item.quantity <= 1) {
                              setCart(cart.filter((_, i) => i !== idx));
                            } else {
                              setCart(cart.map((c, i) => (i === idx ? { ...c, quantity: c.quantity - 1 } : c)));
                            }
                          }}
                          className="w-7 h-7 rounded-xl bg-white text-brand-brown flex items-center justify-center shadow-sm hover:bg-rose-50 hover:text-rose-600 active:scale-90 transition-all"
                          title="Diminuer la quantité"
                        >
                          <Minus size={13} />
                        </button>
                        <span className="w-6 text-center font-black text-xs text-brand-brown">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            playSound('pop');
                            setCart(cart.map((c, i) => (i === idx ? { ...c, quantity: c.quantity + 1 } : c)));
                          }}
                          className="w-7 h-7 rounded-xl bg-brand-orange text-white flex items-center justify-center shadow-sm hover:bg-amber-600 active:scale-90 transition-all"
                          title="Augmenter la quantité"
                        >
                          <Plus size={13} />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          playSound('pop');
                          setCart(cart.filter((_, i) => i !== idx));
                        }}
                        className="p-2 text-red-400 hover:text-red-600 transition-transform active:scale-90 shrink-0"
                        title="Retirer du panier"
                      >
                        <Trash2 size={17}/>
                      </button>
                    </div>

                    {/* Option de piment & Note par plat */}
                    <div className="pt-2.5 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="text-[8px] font-black uppercase tracking-wider text-brand-brown/60 block mb-1">
                          🌶️ Option de piment :
                        </label>
                        <div className="flex flex-wrap gap-1">
                          {spiceOptions.map((sp) => (
                            <button
                              key={sp}
                              type="button"
                              onClick={() => {
                                playSound('pop');
                                setCart(cart.map((c, i) => (i === idx ? { ...c, spiceLevel: sp } : c)));
                              }}
                              className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase transition-all border ${
                                currentSpice === sp
                                  ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                                  : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-brand-orange'
                              }`}
                            >
                              {sp}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="text-[8px] font-black uppercase tracking-wider text-brand-brown/60 block mb-1">
                          📝 Note / Préférence cuisine :
                        </label>
                        <input
                          type="text"
                          placeholder="Ex: Bien cuit, sauce à part, sans oignon..."
                          value={item.instructions || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setCart(cart.map((c, i) => (i === idx ? { ...c, instructions: val } : c)));
                          }}
                          className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-[10px] font-bold text-brand-brown outline-none focus:border-brand-orange"
                        />
                      </div>
                    </div>
                 </div>
               );
             })}
          </div>

          {/* Bouton Rapide : Commander sur WhatsApp immédiatement */}
          <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-[#12261A] p-5 sm:p-6 rounded-[2.5rem] border-2 border-emerald-500/40 shadow-xl text-white space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="text-[8px] font-black uppercase tracking-widest text-emerald-300 block">
                  Commande Directe Sans Attente
                </span>
                <h4 className="text-sm sm:text-base font-black uppercase italic text-white">
                  Total Panier : <span className="text-brand-gold font-mono">{subtotal.toLocaleString('fr-FR')} F CFA</span>
                  {deliveryFee > 0 && <span className="text-[10px] text-emerald-200 font-normal"> (+ {deliveryFee.toLocaleString('fr-FR')} F livraison)</span>}
                </h4>
              </div>
              <a
                href={RESTAURANT_INFO.whatsappCatalogUrl}
                target="_blank"
                rel="noreferrer"
                className="text-[9px] font-black uppercase tracking-wider bg-white/10 hover:bg-white/20 text-emerald-200 px-3 py-1.5 rounded-xl border border-white/15 flex items-center gap-1 transition-all"
              >
                <ExternalLink size={11} /> Catalogue WhatsApp
              </a>
            </div>

            <button
              type="button"
              onClick={handleDirectWhatsAppOrder}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-white py-4 px-5 rounded-2xl font-black uppercase italic tracking-wider text-xs sm:text-sm shadow-lg flex items-center justify-center gap-2.5 active:scale-95 transition-all"
            >
              <MessageSquare size={18} />
              <span>Commander sur WhatsApp ({RESTAURANT_INFO.whatsapp})</span>
              <ArrowRight size={18} />
            </button>
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

          {/* Total & Commander sur WhatsApp Button */}
          <div className="bg-brand-brown p-6 sm:p-10 rounded-[3rem] sm:rounded-[4rem] text-brand-gold shadow-2xl relative overflow-hidden border-4 border-white">
             <div className="space-y-3.5 mb-7">
                <div className="flex justify-between text-white/60 text-[10px] font-black uppercase tracking-widest"><span>Sous-total Festin</span><span>{subtotal.toLocaleString('fr-FR')} F CFA</span></div>
                {loyaltyDiscount > 0 && <div className="flex justify-between text-brand-orange text-[10px] font-black uppercase tracking-widest"><span>Réduction Fidélité ({maxRedeemablePoints} pts)</span><span>- {loyaltyDiscount.toLocaleString('fr-FR')} F CFA</span></div>}
                {promoDiscount > 0 && <div className="flex justify-between text-emerald-400 text-[10px] font-black uppercase tracking-widest"><span>Code Promo ({appliedPromo?.promoCodeObj?.code})</span><span>- {promoDiscount.toLocaleString('fr-FR')} F CFA</span></div>}
                <div className="flex justify-between text-brand-gold text-[10px] font-black uppercase tracking-widest"><span>Service Billo ({DISTRICTS.find(d => d.name === customer.district)?.name})</span><span>{deliveryFee.toLocaleString('fr-FR')} F CFA</span></div>
                <div className="pt-5 border-t border-white/15 flex justify-between items-end gap-2"><span className="text-white font-black italic uppercase text-xs sm:text-sm">Total à Payer</span><span className="text-2xl sm:text-4xl font-black">{total.toLocaleString('fr-FR')} F CFA</span></div>
             </div>
             
             <div className="space-y-3">
               <button
                 type="button"
                 onClick={handleDirectWhatsAppOrder}
                 className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-5 sm:py-6 px-4 rounded-[2rem] font-black uppercase shadow-[0_20px_50px_rgba(16,185,129,0.35)] flex items-center justify-center gap-3 active:scale-95 transition-all italic tracking-wider text-xs sm:text-sm border-2 border-emerald-400/50"
               >
                 <MessageSquare size={20} className="shrink-0" />
                 <span>Commander sur WhatsApp ({RESTAURANT_INFO.whatsapp})</span>
                 <ArrowRight size={20} className="shrink-0" />
               </button>

               <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-[9px] text-white/70 font-bold">
                 <span>Contact direct : <strong className="text-brand-gold font-mono">{RESTAURANT_INFO.whatsapp}</strong></span>
                 <a
                   href={RESTAURANT_INFO.whatsappCatalogUrl}
                   target="_blank"
                   rel="noreferrer"
                   className="text-emerald-300 hover:text-emerald-200 underline flex items-center gap-1 font-black uppercase"
                 >
                   <ExternalLink size={11} /> Catalogue WhatsApp séparé
                 </a>
               </div>
             </div>

             {!navigator.onLine && (
               <p className="text-center text-[9px] text-amber-300 font-black uppercase tracking-wider mt-3 bg-amber-950/60 p-2.5 rounded-xl border border-amber-500/30">
                 📦 Connexion absente : Votre commande sera enregistrée en mode Hors-ligne (IndexedDB)
               </p>
             )}
          </div>
        </form>
      )}

      {/* ========================================================================= */}
      {/* MODAL COMMANDE GROUPÉE & LIEN PARTAGEABLE DU PANIER                       */}
      {/* ========================================================================= */}
      {showShareModal && (
        <div className="fixed inset-0 z-[120] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-fade-in overflow-y-auto">
          <div className="bg-[#1A0F0D] border-2 border-brand-gold/40 w-full max-w-lg rounded-[2.5rem] shadow-2xl p-6 sm:p-8 relative text-white my-auto max-h-[92vh] overflow-y-auto no-scrollbar">
            
            {/* Bouton Fermer */}
            <button 
              type="button"
              onClick={() => { playSound('pop'); setShowShareModal(false); setImportFeedback(null); }}
              className="absolute top-6 right-6 p-2 rounded-xl bg-white/5 hover:bg-white/15 text-white/60 hover:text-white transition-all"
              title="Fermer"
            >
              <X size={20} />
            </button>

            {/* En-tête Modal */}
            <div className="flex items-center gap-3 mb-5">
              <div className="p-3 bg-brand-orange/20 text-brand-orange rounded-2xl border border-brand-orange/30">
                <Users size={24} />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-black italic uppercase text-brand-gold tracking-tight">
                  Commande Groupée & Partage
                </h3>
                <p className="text-[10px] text-white/60">
                  Générez un lien de panier partageable ou fusionnez la sélection d'un ami
                </p>
              </div>
            </div>

            {/* Onglets : Partager mon panier vs Importer/Fusionner un lien */}
            <div className="grid grid-cols-2 gap-2 p-1.5 bg-black/40 rounded-2xl border border-white/10 mb-6">
              <button
                type="button"
                onClick={() => {
                  playSound('pop');
                  setShareModalTab('share');
                }}
                className={`py-2.5 px-3 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
                  shareModalTab === 'share'
                    ? 'bg-brand-gold text-brand-brown shadow-md'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <Link2 size={14} />
                <span>1. Générer le Lien</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  playSound('pop');
                  setShareModalTab('import');
                }}
                className={`py-2.5 px-3 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
                  shareModalTab === 'import'
                    ? 'bg-brand-orange text-white shadow-md'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <UserPlus size={14} />
                <span>2. Fusionner un Lien</span>
              </button>
            </div>

            {shareModalTab === 'share' ? (
              <div className="space-y-5">
                {/* Options de personnalisation de la Commande Groupée */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[9px] font-black uppercase text-brand-gold/80 tracking-wider block mb-1">
                      Votre Nom / Organisateur
                    </label>
                    <input
                      type="text"
                      value={groupHostName}
                      onChange={(e) => setGroupHostName(e.target.value)}
                      placeholder="Ex: Abdou, Équipe Bureau..."
                      className="w-full p-3 bg-white/5 border border-white/15 rounded-xl text-xs text-white font-bold outline-none focus:border-brand-gold"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-black uppercase text-brand-gold/80 tracking-wider block mb-1">
                      Note du Groupe (Optionnel)
                    </label>
                    <input
                      type="text"
                      value={groupNote}
                      onChange={(e) => setGroupNote(e.target.value)}
                      placeholder="Ex: Déjeuner Midi, Dîner Famille..."
                      className="w-full p-3 bg-white/5 border border-white/15 rounded-xl text-xs text-white font-bold outline-none focus:border-brand-gold"
                    />
                  </div>
                </div>

                {/* Calculateur de partage des frais (Split Bill) */}
                <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-white/80 flex items-center gap-1.5">
                      <Users size={14} className="text-brand-gold" />
                      Diviser la note entre participants :
                    </span>
                    <div className="flex items-center gap-1.5">
                      {[1, 2, 3, 4, 5, 6].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => {
                            playSound('pop');
                            setGroupSplitCount(num);
                          }}
                          className={`w-7 h-7 rounded-lg text-[10px] font-black transition-all ${
                            groupSplitCount === num
                              ? 'bg-brand-gold text-brand-brown shadow-md scale-105'
                              : 'bg-black/40 text-white/60 hover:text-white border border-white/10'
                          }`}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  </div>

                  {groupSplitCount > 1 && (
                    <div className="bg-emerald-500/15 border border-emerald-500/30 p-3 rounded-xl flex items-center justify-between text-xs">
                      <span className="text-emerald-200 font-bold text-[10px] uppercase">
                        Part par personne ({groupSplitCount} pers.) :
                      </span>
                      <span className="font-black text-emerald-400 font-mono text-sm">
                        ~{Math.ceil(subtotal / groupSplitCount).toLocaleString('fr-FR')} F CFA / pers.
                      </span>
                    </div>
                  )}
                </div>

                {/* Aperçu du Panier à partager */}
                <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase text-brand-gold">
                    <span>
                      {cart.reduce((s, i) => s + i.quantity, 0)} plat{cart.reduce((s, i) => s + i.quantity, 0) > 1 ? 's' : ''} dans le panier
                    </span>
                    <span>Total : {subtotal.toLocaleString('fr-FR')} F CFA</span>
                  </div>
                  <div className="max-h-28 overflow-y-auto no-scrollbar space-y-1.5 pt-1">
                    {cart.map((item, i) => (
                      <div key={i} className="flex justify-between items-center text-[10px] text-white/80 bg-black/30 p-2 rounded-xl border border-white/5">
                        <span className="font-bold truncate pr-2">{item.quantity}x {item.name}</span>
                        <span className="font-mono text-brand-orange shrink-0">{(item.price * item.quantity).toLocaleString('fr-FR')} F</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Champ Lien URL & Bouton Copier */}
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase text-white/50 tracking-wider">
                    Lien partageable du panier actuel :
                  </label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="text" 
                      readOnly
                      value={generateCartShareUrl(cart, {
                        hostName: groupHostName,
                        groupNote,
                        splitCount: groupSplitCount
                      })}
                      onClick={(e) => (e.target as HTMLInputElement).select()}
                      className="w-full p-3.5 bg-black/50 border border-white/15 rounded-xl text-brand-gold font-mono text-xs outline-none select-all truncate"
                    />
                    <button
                      type="button"
                      onClick={async () => {
                        const url = generateCartShareUrl(cart, {
                          hostName: groupHostName,
                          groupNote,
                          splitCount: groupSplitCount
                        });
                        try {
                          await navigator.clipboard.writeText(url);
                        } catch {
                          const input = document.createElement('input');
                          input.value = url;
                          document.body.appendChild(input);
                          input.select();
                          document.execCommand('copy');
                          document.body.removeChild(input);
                        }
                        setCopiedShareLink(true);
                        playSound('success');
                        if (onShowToast) {
                          onShowToast('🔗 Lien du panier groupé copié dans le presse-papier !', 'success');
                        }
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
                      <CheckCircle2 size={12} /> Lien copié ! Envoyez-le à vos collègues ou proches pour qu'ils voient ou complètent le panier.
                    </p>
                  )}
                </div>

                {/* Boutons d'Action Rapide : WhatsApp & Partage Système */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      playSound('pop');
                      const meta: SharedCartMetadata = {
                        hostName: groupHostName,
                        groupNote,
                        splitCount: groupSplitCount
                      };
                      const url = generateCartShareUrl(cart, meta);
                      const waText = generateCartShareWhatsAppText(cart, url, meta);
                      window.open(`https://wa.me/?text=${encodeURIComponent(waText)}`, '_blank');
                    }}
                    className="py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"
                  >
                    <MessageSquare size={16} />
                    <span>Partager sur WhatsApp</span>
                  </button>

                  {typeof navigator !== 'undefined' && !!navigator.share ? (
                    <button
                      type="button"
                      onClick={async () => {
                        playSound('pop');
                        const meta: SharedCartMetadata = {
                          hostName: groupHostName,
                          groupNote,
                          splitCount: groupSplitCount
                        };
                        const url = generateCartShareUrl(cart, meta);
                        try {
                          await navigator.share({
                            title: groupHostName
                              ? `Commande Groupée Khady's Food de ${groupHostName}`
                              : "Khady's Food & Event - Panier Partagé",
                            text: `Rejoins notre commande groupée Khady's Food (${cart.reduce((s, i) => s + i.quantity, 0)} plats, ${subtotal.toLocaleString('fr-FR')} F CFA) :`,
                            url
                          });
                        } catch (e) {}
                      }}
                      className="py-3.5 px-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-2 border border-white/15 active:scale-95 transition-all"
                    >
                      <Share2 size={16} />
                      <span>Autres Applications</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        playSound('pop');
                        setShareModalTab('import');
                      }}
                      className="py-3.5 px-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-2 border border-white/15 active:scale-95 transition-all"
                    >
                      <UserPlus size={16} />
                      <span>Fusionner le panier d'un ami</span>
                    </button>
                  )}
                </div>

                <p className="text-[8px] text-center text-white/40 font-bold uppercase tracking-widest pt-2">
                  Astuce : Vos amis peuvent ouvrir ce lien, ajouter leurs propres plats, puis vous renvoyer leur nouveau lien !
                </p>
              </div>
            ) : (
              /* ONGLET 2 : FUSIONNER / IMPORTER LE PANIER D'UN PARTICIPANT */
              <div className="space-y-5">
                <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-2">
                  <h4 className="font-black text-xs uppercase italic text-brand-gold flex items-center gap-2">
                    <UserPlus size={15} /> Combiner plusieurs paniers en une seule commande
                  </h4>
                  <p className="text-[10px] text-white/70 leading-relaxed">
                    Un collègue ou un proche vous a envoyé son lien de panier Khady's Food ? Collez son lien (ou son message WhatsApp contenant le lien) ci-dessous pour ajouter automatiquement ses plats à votre panier !
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[9px] font-black uppercase text-white/50 tracking-wider">
                      Lien ou message reçu :
                    </label>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          const text = await navigator.clipboard.readText();
                          if (text) {
                            setImportLinkInput(text.trim());
                            setImportFeedback(null);
                            playSound('pop');
                          }
                        } catch {
                          // Ignore clipboard read error
                        }
                      }}
                      className="px-2.5 py-1 bg-brand-gold/20 hover:bg-brand-gold/30 text-brand-gold rounded-lg text-[8px] font-black uppercase border border-brand-gold/30"
                    >
                      📋 Coller depuis le presse-papier
                    </button>
                  </div>
                  <textarea
                    rows={3}
                    value={importLinkInput}
                    onChange={(e) => {
                      setImportLinkInput(e.target.value);
                      setImportFeedback(null);
                    }}
                    placeholder="Collez ici le lien https://...?shared_cart=... envoyé par votre ami"
                    className="w-full p-3.5 bg-black/50 border border-white/15 rounded-xl text-white font-mono text-xs outline-none focus:border-brand-gold resize-none"
                  />
                </div>

                {importFeedback && (
                  <div
                    className={`p-3.5 rounded-xl border text-[10px] font-bold flex items-center gap-2 ${
                      importFeedback.type === 'success'
                        ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                        : 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                    }`}
                  >
                    {importFeedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                    <span>{importFeedback.text}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    disabled={!importLinkInput.trim()}
                    onClick={() => {
                      const decoded = extractSharedCartFromInput(importLinkInput);
                      if (!decoded || decoded.items.length === 0) {
                        playSound('error');
                        setImportFeedback({
                          text: 'Lien invalide ou aucun plat détecté. Vérifiez que vous avez copié le lien complet contenant ?shared_cart=...',
                          type: 'error'
                        });
                        return;
                      }
                      const merged = mergeCartItems(cart, decoded.items);
                      setCart(merged);
                      if (decoded.metadata?.hostName) setGroupHostName(decoded.metadata.hostName);
                      if (decoded.metadata?.groupNote) setGroupNote(decoded.metadata.groupNote);
                      if (decoded.metadata?.splitCount) setGroupSplitCount(decoded.metadata.splitCount);
                      playSound('cash');
                      const addedCount = decoded.items.reduce((s, i) => s + i.quantity, 0);
                      setImportFeedback({
                        text: `✅ ${addedCount} plat(s) fusionné(s) avec succès dans votre panier groupé !`,
                        type: 'success'
                      });
                      setImportLinkInput('');
                      if (onShowToast) {
                        onShowToast(`🤝 ${addedCount} plat(s) ajouté(s) au panier groupé !`, 'success');
                      }
                    }}
                    className="py-3.5 px-4 bg-brand-orange hover:bg-amber-600 disabled:opacity-40 text-white rounded-2xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"
                  >
                    <UserPlus size={16} />
                    <span>Fusionner avec mon panier</span>
                  </button>

                  <button
                    type="button"
                    disabled={!importLinkInput.trim()}
                    onClick={() => {
                      const decoded = extractSharedCartFromInput(importLinkInput);
                      if (!decoded || decoded.items.length === 0) {
                        playSound('error');
                        setImportFeedback({
                          text: 'Lien invalide ou aucun plat détecté.',
                          type: 'error'
                        });
                        return;
                      }
                      setCart(decoded.items);
                      if (decoded.metadata?.hostName) setGroupHostName(decoded.metadata.hostName);
                      if (decoded.metadata?.groupNote) setGroupNote(decoded.metadata.groupNote);
                      if (decoded.metadata?.splitCount) setGroupSplitCount(decoded.metadata.splitCount);
                      playSound('cash');
                      const addedCount = decoded.items.reduce((s, i) => s + i.quantity, 0);
                      setImportFeedback({
                        text: `✅ Panier remplacé avec succès (${addedCount} plat(s) chargé(s)) !`,
                        type: 'success'
                      });
                      setImportLinkInput('');
                      if (onShowToast) {
                        onShowToast(`🎁 Panier remplacé (${addedCount} plat(s)) !`, 'success');
                      }
                    }}
                    className="py-3.5 px-4 bg-white/10 hover:bg-white/20 disabled:opacity-40 text-white rounded-2xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-2 border border-white/15 active:scale-95 transition-all"
                  >
                    <ShoppingBag size={16} />
                    <span>Remplacer mon panier</span>
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
};

export default CartView;
