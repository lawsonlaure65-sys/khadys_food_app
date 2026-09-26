
import React, { useState } from 'react';
import { Order, UserProfile } from '../types';
import { 
  ShoppingBag, Gift, ChevronRight, LogOut, Settings, 
  Award, QrCode, User, Mail, 
  ArrowRight, Fingerprint, Info, CheckCircle2, Bike, Star, Bell, Mic, Volume2, VolumeX,
  FileText, Download, FileSpreadsheet, Printer, X, Calendar, Clock, Sparkles,
  LayoutDashboard, ShieldAlert
} from 'lucide-react';
import { playSound } from '../utils/audio';
import { PasswordInput } from './PasswordInput';
import { PhoneInput } from './PhoneInput';
import { ADMIN_PASSWORD, REWARDS } from '../constants';
import { OrderHistory } from './OrderHistory';

interface AccountViewProps {
  orders: Order[];
  userProfile: UserProfile;
  onAdminAccess: () => void;
  onLoginSuccess: (isAdmin: boolean, customProfile?: UserProfile) => void;
  onOpenGuide: () => void;
  onOpenQrLoyalty?: () => void;
  onOpenLiveDriverMap?: () => void;
  onOpenSurvey?: () => void;
  onOpenPushNotification?: () => void;
}

const AccountView: React.FC<AccountViewProps> = ({ 
  orders, 
  userProfile, 
  onAdminAccess, 
  onLoginSuccess, 
  onOpenGuide,
  onOpenQrLoyalty,
  onOpenLiveDriverMap,
  onOpenSurvey,
  onOpenPushNotification
}) => {
  const [isLoggedIn, setIsLoggedIn] = useState(userProfile.email !== undefined); // default to logged in if some email has been configured (which isn't default Abdou R.)
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [adminTapCount, setAdminTapCount] = useState(0);
  const [showRewards, setShowRewards] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [isSpeakingGuide, setIsSpeakingGuide] = useState(false);

  const handlePlayAudioGuide = () => {
    playSound('pop');
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      alert("La synthèse vocale n'est pas supportée par votre navigateur.");
      return;
    }

    if (isSpeakingGuide) {
      window.speechSynthesis.cancel();
      setIsSpeakingGuide(false);
      return;
    }

    window.speechSynthesis.cancel();
    const speechText = `Bienvenue dans l'application Khady's Food et Event Niamey ! Grâce à notre application, vous pouvez commander vos spécialités préférées, grillades au feu de bois et plats africains en toute simplicité. À chaque commande passée, vous gagnez des points de fidélité. Cumulez vos points pour débloquer des cadeaux, des boissons offertes et des repas gratuits ! Vous pouvez également gagner 50 points en remplissant notre sondage de satisfaction, ou 500 points pour chaque ami parrainé grâce à votre code unique !`;

    const utterance = new SpeechSynthesisUtterance(speechText);
    utterance.lang = 'fr-FR';
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    utterance.onstart = () => setIsSpeakingGuide(true);
    utterance.onend = () => setIsSpeakingGuide(false);
    utterance.onerror = () => setIsSpeakingGuide(false);

    window.speechSynthesis.speak(utterance);
  };
  
  // Login States
  const [loginPhone, setLoginPhone] = useState('');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPass, setLoginPass] = useState('');

  // Register States
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPass, setRegPass] = useState('');

  // Fallback demo order if list empty for seamless export preview
  const activeOrdersList: Order[] = orders.length > 0 ? orders : [
    {
      id: "KF-9482",
      customerName: userProfile.name || "Client Khady's",
      phone: userProfile.phone || "+227 90 00 00 00",
      address: "Grande mosquée : Muamar Kadafi, Niamey",
      district: "Grande Mosquée / Zongo",
      items: [
        { id: "1", name: "👑 Thiéboudienne Royale au Capitaine", description: "", price: 6500, image: "", category: "Plat Africain", rating: 5, isAvailable: true, quantity: 1 },
        { id: "2", name: "Alloco Banane Aloko Croustillant", description: "", price: 2000, image: "", category: "Spécialité Maison", rating: 5, isAvailable: true, quantity: 1 },
        { id: "3", name: "Jus de Bissap Bio Artisanale", description: "", price: 1000, image: "", category: "Boisson Naturelle", rating: 5, isAvailable: true, quantity: 2 }
      ],
      total: 10500,
      deliveryFee: 1000,
      status: "DELIVERED",
      paymentMethod: "ALLIZA",
      timestamp: new Date().toISOString()
    }
  ];

  const handleExportCSV = () => {
    playSound('pop');
    if (activeOrdersList.length === 0) {
      alert("Aucune commande dans l'historique.");
      return;
    }

    const headers = ['ID Commande', 'Date & Heure', 'Client', 'Téléphone', 'Quartier', 'Plats Commandés', 'Frais Livraison (FCFA)', 'Total (FCFA)', 'Mode de Paiement', 'Statut'];
    
    const rows = activeOrdersList.map(ord => {
      const itemsSummary = ord.items.map(item => `${item.quantity}x ${item.name}`).join('; ');
      const formattedDate = ord.timestamp ? new Date(ord.timestamp).toLocaleString('fr-FR') : 'Date non spécifiée';
      
      return [
        `"${ord.id}"`,
        `"${formattedDate}"`,
        `"${ord.customerName || userProfile.name}"`,
        `"${ord.phone || userProfile.phone}"`,
        `"${ord.district || 'Niamey'}"`,
        `"${itemsSummary.replace(/"/g, '""')}"`,
        ord.deliveryFee || 0,
        ord.total,
        `"${ord.paymentMethod}"`,
        `"${ord.status}"`
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Historique_Commandes_KhadysFood_${(userProfile.name || 'Client').replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    playSound('success');
  };

  const handleExportPDF = () => {
    playSound('pop');
    if (activeOrdersList.length === 0) {
      alert("Aucune commande dans l'historique.");
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("Veuillez autoriser les fenêtres surgissantes (pop-ups) pour télécharger le rapport PDF.");
      return;
    }

    const totalSpent = activeOrdersList.reduce((acc, o) => acc + o.total, 0);

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <title>Historique des Commandes - Khady's Food</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 30px; color: #2A1612; background: #fff; }
          .header { text-align: center; border-bottom: 3px solid #E65100; padding-bottom: 20px; margin-bottom: 25px; }
          .logo { font-size: 24px; font-weight: 900; color: #3E2723; text-transform: uppercase; letter-spacing: 2px; }
          .subtitle { color: #E65100; font-size: 13px; font-weight: bold; margin-top: 5px; letter-spacing: 1px; }
          .info-card { background: #FFF8E1; padding: 15px 20px; border-radius: 12px; margin-bottom: 25px; border: 1px solid #FFE082; display: flex; justify-content: space-between; }
          .info-card div { font-size: 12px; }
          .info-card strong { color: #3E2723; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 11px; }
          th { background: #3E2723; color: #FFD700; padding: 10px 12px; text-align: left; text-transform: uppercase; font-size: 10px; }
          td { padding: 10px 12px; border-bottom: 1px solid #E0E0E0; vertical-align: top; }
          tr:nth-child(even) { background: #FAFAFA; }
          .badge { padding: 4px 8px; border-radius: 6px; font-size: 10px; font-weight: bold; display: inline-block; }
          .badge-delivered { background: #E8F5E9; color: #2E7D32; }
          .badge-pending { background: #FFF3E0; color: #E65100; }
          .total-box { margin-top: 25px; text-align: right; font-size: 15px; font-weight: bold; color: #3E2723; }
          .footer { margin-top: 40px; text-align: center; font-size: 10px; color: #888; border-top: 1px solid #eee; padding-top: 15px; }
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="no-print" style="margin-bottom: 20px; text-align: right;">
          <button onclick="window.print()" style="background: #E65100; color: #fff; border: none; padding: 12px 24px; border-radius: 8px; font-weight: bold; cursor: pointer; font-size: 13px;">🖨️ Télécharger en PDF / Imprimer</button>
        </div>

        <div class="header">
          <div class="logo">KHADY'S FOOD & EVENT NIAMEY</div>
          <div class="subtitle">RELEVÉ OFFICIEL DES COMMANDES CLIENT</div>
          <p style="font-size: 11px; color: #666; margin-top: 5px;">Généré le ${new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
        </div>

        <div class="info-card">
          <div><strong>Nom Client :</strong> ${userProfile.name} (${userProfile.rank})</div>
          <div><strong>Téléphone :</strong> ${userProfile.phone}</div>
          <div><strong>Email :</strong> ${userProfile.email || 'Non renseigné'}</div>
        </div>

        <table>
          <thead>
            <tr>
              <th>N° Commande</th>
              <th>Date</th>
              <th>Détail des Plats</th>
              <th>Paiement</th>
              <th>Statut</th>
              <th style="text-align: right;">Montant Total</th>
            </tr>
          </thead>
          <tbody>
            ${activeOrdersList.map(ord => `
              <tr>
                <td><strong>#${ord.id}</strong></td>
                <td>${ord.timestamp ? new Date(ord.timestamp).toLocaleDateString('fr-FR') : 'Aujourd\'hui'}</td>
                <td>${ord.items.map(i => `${i.quantity}x ${i.name}`).join('<br/>')}</td>
                <td>${ord.paymentMethod}</td>
                <td><span class="badge ${ord.status === 'DELIVERED' ? 'badge-delivered' : 'badge-pending'}">${ord.status}</span></td>
                <td style="text-align: right; font-weight: bold;">${ord.total.toLocaleString()} F CFA</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="total-box">
          TOTAL RELEVÉ : <span style="color: #E65100;">${totalSpent.toLocaleString()} F CFA</span>
        </div>

        <div class="footer">
          Khady's Food & Event • Grande mosquée : Muamar Kadafi, Niamey, Niger • Téléphone: +227 74 44 16 21 / +227 96 05 23 10<br/>
          Merci de votre confiance !
        </div>

        <script>
          setTimeout(() => { window.print(); }, 400);
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    playSound('success');
  };

  // Geste secret conservé sur l'avatar pour les tests rapides
  const handleSecretAdmin = () => {
    const newCount = adminTapCount + 1;
    if (newCount >= 7) {
      playSound('success');
      onAdminAccess();
      setAdminTapCount(0);
    } else {
      setAdminTapCount(newCount);
      setTimeout(() => setAdminTapCount(0), 3000);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    const lowerEmail = loginEmail.trim().toLowerCase();
    const lowerPhone = loginPhone.trim().toLowerCase();
    const lowerPass = loginPass.trim().toLowerCase();

    // Authentification Admin Flexible via les champs de connexion
    const isTargetingAdmin = 
      lowerEmail.includes('admin') || 
      lowerPhone.includes('admin') || 
      lowerEmail === 'admin@khadys.food' ||
      lowerPass === 'khadysfood' || 
      lowerPass === 'admin' || 
      lowerPass === 'admin123' ||
      lowerPass === ADMIN_PASSWORD.toLowerCase();

    if (activeTab === 'login' && isTargetingAdmin) {
      playSound('success');
      onAdminAccess();
      return;
    }

    if (activeTab === 'register') {
      const generatedProfile: UserProfile = {
        name: regName || 'Fidèle Client',
        phone: regPhone || '+227 90 00 00 00',
        email: regEmail || undefined,
        points: 0,
        rank: 'Silver',
        referralCode: `KHADY-${(regName || 'CLIENT').substring(0, 4).toUpperCase()}`
      };
      setIsLoggedIn(true);
      playSound('success');
      onLoginSuccess(false, generatedProfile);
    } else {
      // Authentification Client Simulation avec son téléphone / email saisi
      const displayName = loginEmail
        ? loginEmail.split('@')[0].toUpperCase()
        : (loginPhone ? `Client (${loginPhone.slice(-4)})` : 'Abdou R.');

      const generatedProfile: UserProfile = {
        name: displayName,
        phone: loginPhone || userProfile.phone || '+227 90 00 00 00',
        email: loginEmail || undefined,
        points: 1250, // default points for a returning client
        rank: 'Gold',
        referralCode: 'KHADY-GOLD'
      };
      setIsLoggedIn(true);
      playSound('success');
      onLoginSuccess(false, generatedProfile);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="animate-fade-in p-6 pb-40 min-h-[85vh] flex flex-col justify-center">
        <div className="bg-white rounded-[3.5rem] p-10 shadow-2xl border border-gray-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-10 opacity-[0.03] rotate-12">
            <Fingerprint size={160} className="text-brand-brown" />
          </div>

          <div className="flex gap-4 mb-10 p-1.5 bg-gray-50 rounded-2xl relative z-10">
            <button 
              onClick={() => { playSound('pop'); setActiveTab('login'); }}
              className={`flex-1 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'login' ? 'bg-brand-brown text-brand-gold shadow-lg' : 'text-gray-300'}`}
            >
              Connexion
            </button>
            <button 
              onClick={() => { playSound('pop'); setActiveTab('register'); }}
              className={`flex-1 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'register' ? 'bg-brand-brown text-brand-gold shadow-lg' : 'text-gray-300'}`}
            >
              Inscription
            </button>
          </div>

          <div className="text-center mb-8 relative z-10">
            <h2 className="text-3xl font-black italic uppercase text-brand-brown tracking-tighter leading-none">
              {activeTab === 'register' ? "Rejoindre l'élite" : "Bon retour !"}
            </h2>
            <p className="text-[9px] font-black uppercase text-brand-orange tracking-[0.4em] mt-3">
              KHADY'S FOOD CLUB NIAMEY
            </p>
          </div>

          <form className="space-y-4 relative z-10" onSubmit={handleLogin}>
            {activeTab === 'register' ? (
              <>
                <div className="relative">
                  <User className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                  <input 
                    type="text" 
                    placeholder="Nom complet" 
                    required 
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    className="w-full p-5 pl-14 bg-gray-50 rounded-2xl text-brand-brown text-xs font-bold outline-none border-2 border-transparent focus:border-brand-orange/20 transition-all" 
                  />
                </div>

                <PhoneInput 
                  value={regPhone} 
                  onChange={setRegPhone} 
                  required={true} 
                  className="!bg-gray-50 text-brand-brown border-2 border-transparent focus-within:border-brand-orange/20" 
                />

                <div className="relative">
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                  <input 
                    type="email" 
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="Email (Optionnel)"
                    className="w-full p-5 pl-14 bg-gray-50 rounded-2xl text-brand-brown text-xs font-bold outline-none border-2 border-transparent focus:border-brand-orange/20 transition-all" 
                  />
                </div>

                <PasswordInput 
                  name="pass_reg" 
                  placeholder="Mot de passe" 
                  required 
                  onChange={(e) => setRegPass(e.target.value)} 
                />
              </>
            ) : (
              <>
                <PhoneInput 
                  value={loginPhone} 
                  onChange={setLoginPhone} 
                  required={!loginEmail}
                  className="!bg-gray-50 text-brand-brown border-2 border-transparent focus-within:border-brand-orange/20" 
                />

                <div className="relative">
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                  <input 
                    type="email" 
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="Email (Optionnel)" 
                    required={false}
                    className="w-full p-5 pl-14 bg-gray-50 rounded-2xl text-brand-brown text-xs font-bold outline-none border-2 border-transparent focus:border-brand-orange/20 transition-all" 
                  />
                </div>

                <PasswordInput 
                  name="pass_login" 
                  placeholder="Mot de passe" 
                  required 
                  onChange={(e) => setLoginPass(e.target.value)} 
                />
              </>
            )}

            <button type="submit" className="w-full bg-brand-brown text-brand-gold py-6 rounded-3xl font-black uppercase italic shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-all mt-6">
              {activeTab === 'register' ? "CRÉER MON ACCÈS" : "OUVRIR MA SESSION"} <ArrowRight size={22} />
            </button>
            
            {activeTab === 'login' && (
              <div className="pt-4 border-t border-gray-100 flex flex-col items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    playSound('pop');
                    setLoginEmail('admin@khadys.food');
                    setLoginPass(ADMIN_PASSWORD);
                    onAdminAccess();
                  }}
                  className="text-[9px] font-black uppercase text-brand-orange/80 hover:text-brand-orange tracking-widest transition-all flex items-center gap-1.5 py-1 px-3 bg-brand-orange/5 hover:bg-brand-orange/10 rounded-xl"
                >
                  <Settings size={12} /> Accès Direct Console Administrateur
                </button>
                <p className="text-center text-[8px] font-bold text-gray-300 uppercase tracking-widest">Paiements sécurisés par Mobile Money & Espèces</p>
              </div>
            )}
          </form>
        </div>
      </div>
    );
  }

  const nextRank = userProfile.rank === 'Silver' ? 'Gold' : userProfile.rank === 'Gold' ? 'Platinum' : 'Elite Master';
  const progressToNext = userProfile.rank === 'Silver' ? (userProfile.points / 2000) * 100 : userProfile.rank === 'Gold' ? (userProfile.points / 5000) * 100 : 100;

  const isUserAdmin = userProfile.name.toUpperCase().includes('ADMIN') || (userProfile.email && userProfile.email.toLowerCase().includes('admin'));

  return (
    <div className="animate-fade-in p-6 pb-40">
      {/* Banner Administrateur Détecté */}
      {isUserAdmin && (
        <div className="bg-gradient-to-r from-[#1C0F0D] via-[#2A1612] to-[#1C0F0D] p-5 rounded-[2.5rem] shadow-2xl border-2 border-brand-gold mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-white animate-bounce-subtle">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-brand-gold/20 text-brand-gold rounded-2xl border border-brand-gold/30 flex-shrink-0">
              <ShieldAlert size={24} />
            </div>
            <div>
              <h3 className="text-xs font-black italic uppercase text-brand-gold tracking-wider">
                👑 Session Administrateur Active
              </h3>
              <p className="text-[9px] text-white/70 font-bold mt-0.5">
                Vous êtes connecté au compte Admin. Accédez au tableau de bord pour piloter le restaurant.
              </p>
            </div>
          </div>
          <button
            onClick={() => { playSound('pop'); onAdminAccess(); }}
            className="w-full sm:w-auto px-6 py-3.5 bg-brand-orange hover:bg-orange-600 text-white font-black text-[10px] uppercase italic tracking-widest rounded-2xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 border border-white/20 whitespace-nowrap"
          >
            <LayoutDashboard size={16} /> Ouvrir Console Admin 🚀
          </button>
        </div>
      )}

      <header className="flex flex-col items-center mb-10 pt-4">
         <div 
           className="w-28 h-28 bg-white rounded-[3rem] shadow-2xl p-1 mb-4 border-4 border-brand-orange/10 relative cursor-pointer active:scale-95 transition-transform"
           onClick={handleSecretAdmin}
         >
            <img src={userProfile.avatar || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200"} className="w-full h-full object-cover rounded-[2.8rem]" alt="Profile" />
            <div className="absolute -bottom-2 -right-2 bg-brand-orange text-white w-10 h-10 rounded-full flex items-center justify-center border-4 border-white shadow-lg">
               <Award size={20} />
            </div>
         </div>
         <h2 className="text-3xl font-black italic uppercase text-brand-brown mb-1 tracking-tighter">{userProfile.name}</h2>
         <p className="text-[10px] font-black text-brand-orange uppercase tracking-[0.3em] italic">Membre Club {userProfile.rank} ✨</p>
      </header>

      <div className="grid grid-cols-2 gap-4 mb-10">
         <div className="bg-[#1A0F0D] p-7 rounded-[3rem] text-brand-gold shadow-2xl border-4 border-white flex flex-col items-center text-center">
            <span className="text-[8px] font-black uppercase tracking-widest text-white/40 mb-3">POINTS FIDÉLITÉ</span>
            <span className="text-3xl font-black italic mb-3">{userProfile.points.toLocaleString()}</span>
            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden mb-2">
               <div className="bg-brand-gold h-full shadow-[0_0_15px_#FFD700] transition-all duration-1000" style={{ width: `${Math.min(100, progressToNext)}%` }}></div>
            </div>
            <span className="text-[7px] font-bold text-white/40 uppercase tracking-widest uppercase">PROCHAIN RANG: {nextRank}</span>
         </div>
         <div 
           onClick={() => { playSound('pop'); setShowExportModal(true); }}
           className="bg-white p-7 rounded-[3rem] shadow-xl border border-gray-100 flex flex-col items-center text-center cursor-pointer hover:border-brand-orange/40 active:scale-95 transition-all group relative overflow-hidden"
         >
            <span className="text-[8px] font-black uppercase tracking-widest text-gray-300 mb-2">COMMANDES</span>
            <span className="text-3xl font-black italic text-brand-brown mb-2">{orders.length}</span>
            <span className="bg-brand-orange/10 text-brand-orange text-[9px] font-black uppercase px-3 py-1 rounded-full flex items-center gap-1 group-hover:bg-brand-orange group-hover:text-white transition-all">
               <FileText size={10} /> Exporter PDF/CSV
            </span>
         </div>
      </div>

      {/* Order History Component */}
      <div className="mb-10">
        <OrderHistory 
          orders={activeOrdersList} 
          onOpenLiveDriverMap={onOpenLiveDriverMap}
          itemsPerPage={3}
        />
      </div>

      {showRewards ? (
        <div className="space-y-4 mb-10 animate-slide-up">
          <div className="flex items-center justify-between px-6 mb-6">
            <h3 className="text-[10px] font-black uppercase text-gray-400 tracking-[0.4em]">RÉCOMPENSES DISPONIBLES</h3>
            <button onClick={() => setShowRewards(false)} className="text-[10px] font-black text-brand-orange uppercase underline underline-offset-4">Retour</button>
          </div>
          {REWARDS.map(reward => (
            <div key={reward.id} className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100 flex items-center justify-between group">
              <div className="flex flex-col gap-1">
                <span className="text-[12px] font-black uppercase italic text-brand-brown">{reward.name}</span>
                <span className="text-[9px] font-medium text-gray-400">{reward.description}</span>
                <span className="text-[10px] font-black text-brand-orange mt-1">{reward.cost} points</span>
              </div>
              <button 
                disabled={userProfile.points < reward.cost}
                className={`px-5 py-2.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${userProfile.points >= reward.cost ? 'bg-brand-brown text-brand-gold shadow-lg active:scale-95' : 'bg-gray-50 text-gray-200 cursor-not-allowed'}`}
              >
                {userProfile.points >= reward.cost ? 'UTILISER' : 'BLOQUÉ'}
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4 mb-10">
          <h3 className="text-[10px] font-black uppercase text-gray-400 tracking-[0.4em] ml-6 mb-6">SERVICES ÉLITE</h3>
          {[
            { icon: LayoutDashboard, label: 'Console Administrateur Elite (Dashboard) 👑', color: 'text-amber-600 font-extrabold', action: onAdminAccess },
            { icon: Volume2, label: isSpeakingGuide ? 'Arrêter le Guide Audio Vocale 🔇' : 'Guide Audio Vocale (Avantages & Points) 🎙️', color: isSpeakingGuide ? 'text-red-500 animate-pulse' : 'text-brand-orange', action: handlePlayAudioGuide },
            { icon: FileText, label: 'Exporter Historique Commandes (PDF / CSV) 📄', color: 'text-emerald-600', action: () => setShowExportModal(true) },
            { icon: QrCode, label: 'Mon Pass QR Fidélité 👑', color: 'text-brand-orange', action: () => onOpenQrLoyalty && onOpenQrLoyalty() },
            { icon: Bike, label: 'Suivi Trajet Livreur GPS 🏍️', color: 'text-brand-brown', action: () => onOpenLiveDriverMap && onOpenLiveDriverMap() },
            { icon: Star, label: 'Sondage de Satisfaction ⭐️ (+50 pts)', color: 'text-amber-500', action: () => onOpenSurvey && onOpenSurvey() },
            { icon: Bell, label: 'Notifications PUSH OWA 🔔', color: 'text-brand-orange', action: () => onOpenPushNotification && onOpenPushNotification() },
            { icon: Gift, label: 'Mes Récompenses & Cadeaux', color: 'text-brand-orange', action: () => setShowRewards(true) },
            { icon: Info, label: 'Guide d\'utilisation', color: 'text-gray-400', action: onOpenGuide },
          ].map((item, i) => (
            <button key={i} onClick={() => { playSound('pop'); item.action(); }} className="w-full bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-50 flex items-center justify-between group active:scale-95 transition-all">
                <div className="flex items-center gap-5">
                  <div className={`w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center ${item.color} shadow-inner`}>
                      <item.icon size={20} />
                  </div>
                  <span className="text-[12px] font-black uppercase italic text-brand-brown tracking-tight">{item.label}</span>
                </div>
                <ChevronRight size={16} className="text-gray-200 group-hover:text-brand-orange transition-colors" />
            </button>
          ))}
        </div>
      )}

      <div className="bg-brand-cream/50 p-8 rounded-[3rem] mb-10 border-2 border-dashed border-brand-orange/20">
         <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-brand-orange shadow-sm"><Award size={24} /></div>
            <div>
               <h4 className="text-[11px] font-black uppercase italic text-brand-brown tracking-tight">Programme Ambassadeur</h4>
               <p className="text-[9px] font-bold text-brand-brown/40 uppercase tracking-[0.2em]">Partagez le goût des rois</p>
            </div>
         </div>
         <div className="bg-white p-5 rounded-2xl flex items-center justify-between shadow-inner border border-gray-100">
            <span className="text-xs font-black text-brand-brown tracking-widest">{userProfile.referralCode}</span>
            <button className="bg-brand-orange text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase active:scale-95 transition-all">COPIER</button>
         </div>
         <p className="text-[8px] font-bold text-gray-400 mt-4 text-center uppercase tracking-widest italic">+500 points pour chaque nouvel ami parrainé</p>
      </div>

      <button 
        onClick={() => { setIsLoggedIn(false); playSound('pop'); }}
        className="w-full py-6 rounded-[2.5rem] border-4 border-dashed border-gray-100 text-gray-300 flex items-center justify-center gap-3 font-black uppercase text-[10px] italic tracking-[0.5em] active:scale-95 transition-all mb-12"
      >
         <LogOut size={16} /> DÉCONNEXION
      </button>

      <p className="text-center text-[7px] font-black text-gray-200 uppercase tracking-[0.6em] mb-12">
        KHADY'S FOOD NIAMEY • V2.8.5 GOLD
      </p>

      {/* Export & Order History Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md p-0 sm:p-4 animate-fade-in" onClick={() => setShowExportModal(false)}>
          <div 
            className="bg-white w-full max-w-2xl rounded-t-[3rem] sm:rounded-[3rem] p-6 sm:p-8 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto space-y-6 animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0">
                  <FileText size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black italic uppercase text-brand-brown tracking-tight">Historique des Commandes</h3>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    {activeOrdersList.length} commande(s) répertoriée(s)
                  </p>
                </div>
              </div>
              <button 
                onClick={() => { playSound('pop'); setShowExportModal(false); }}
                className="w-10 h-10 bg-gray-100 text-gray-500 rounded-2xl flex items-center justify-center hover:bg-gray-200 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Export Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={handleExportPDF}
                className="p-4 bg-brand-brown text-brand-gold rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-3 shadow-lg hover:brightness-110 active:scale-95 transition-all"
              >
                <Printer size={18} /> Exporter en PDF (Imprimer)
              </button>
              <button
                onClick={handleExportCSV}
                className="p-4 bg-emerald-700 text-white rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-3 shadow-lg hover:bg-emerald-800 active:scale-95 transition-all"
              >
                <FileSpreadsheet size={18} /> Exporter en CSV (Excel)
              </button>
            </div>

            {/* Order Items List */}
            <div className="space-y-3 pt-2">
              <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-[0.3em] mb-2">DÉTAILS DES COMMANDES PASSÉES</h4>
              
              {activeOrdersList.map((ord, idx) => (
                <div key={ord.id || idx} className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-brand-brown uppercase">Commande #{ord.id}</span>
                    <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-full ${ord.status === 'DELIVERED' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                      {ord.status === 'DELIVERED' ? 'Livré' : ord.status}
                    </span>
                  </div>

                  <div className="text-[11px] font-medium text-gray-600 space-y-1">
                    {ord.items.map((item, itemIdx) => (
                      <div key={itemIdx} className="flex justify-between items-center text-gray-700">
                        <span>• {item.quantity}x {item.name}</span>
                        <span className="font-bold">{item.price.toLocaleString()} F</span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-gray-200/60 flex items-center justify-between text-[10px] font-bold text-gray-500">
                    <div className="flex items-center gap-1 text-gray-400">
                      <Clock size={12} />
                      {ord.timestamp ? new Date(ord.timestamp).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Aujourd\'hui'}
                    </div>
                    <div>
                      Mode: <span className="text-brand-brown font-black">{ord.paymentMethod}</span>
                    </div>
                    <div className="text-xs font-black text-brand-orange">
                      Total: {ord.total.toLocaleString()} F CFA
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer Notice */}
            <p className="text-[9px] text-gray-400 text-center italic font-medium pt-2">
              💡 Les fichiers exportés contiennent le montant total, les détails des plats et les références de paiement pour votre comptabilité.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountView;
