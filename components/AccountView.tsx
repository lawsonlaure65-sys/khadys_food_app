
import React, { useState } from 'react';
import { Order, UserProfile } from '../types';
import { 
  ShoppingBag, Gift, ChevronRight, LogOut, Settings, 
  Award, QrCode, User, Mail, 
  ArrowRight, Fingerprint, Info, CheckCircle2, Truck
} from 'lucide-react';
import { playSound } from '../utils/audio';
import { PasswordInput } from './PasswordInput';
import { PhoneInput } from './PhoneInput';
import OrderTracking from './OrderTracking';
import { ADMIN_PASSWORD, REWARDS } from '../constants';

interface AccountViewProps {
  orders: Order[];
  userProfile: UserProfile;
  onAdminAccess: () => void;
  onLoginSuccess: (isAdmin: boolean, customProfile?: UserProfile) => void;
  onOpenGuide: () => void;
  onUpdateOrder?: (updatedOrder: Order) => void;
}

const AccountView: React.FC<AccountViewProps> = ({ orders, userProfile, onAdminAccess, onLoginSuccess, onOpenGuide, onUpdateOrder }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(userProfile.email !== undefined); // default to logged in if some email has been configured (which isn't default Abdou R.)
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [adminTapCount, setAdminTapCount] = useState(0);
  const [showRewards, setShowRewards] = useState(false);
  
  // Login States
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPass, setLoginPass] = useState('');

  // Register States
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPass, setRegPass] = useState('');

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
    
    // Authentification Admin Invisible via les champs standards
    if (activeTab === 'login' && loginEmail.toLowerCase() === 'admin@khadys.food' && loginPass === ADMIN_PASSWORD) {
      playSound('success');
      onLoginSuccess(true);
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
      // Authentification Client Simulation avec son propre email saisie !
      const generatedProfile: UserProfile = {
        name: loginEmail ? loginEmail.split('@')[0].toUpperCase() : 'Abdou R.',
        phone: userProfile.phone || '+227 90 00 00 00',
        email: loginEmail,
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
                <div className="relative">
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                  <input 
                    type="email" 
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="Email" 
                    required={true}
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
            <p className="text-center text-[8px] font-bold text-gray-300 mt-4 uppercase tracking-widest">Paiements sécurisés par Alliza / Airtel Money</p>
          </form>
        </div>
      </div>
    );
  }

  const nextRank = userProfile.rank === 'Silver' ? 'Gold' : userProfile.rank === 'Gold' ? 'Platinum' : 'Elite Master';
  const progressToNext = userProfile.rank === 'Silver' ? (userProfile.points / 2000) * 100 : userProfile.rank === 'Gold' ? (userProfile.points / 5000) * 100 : 100;

  return (
    <div className="animate-fade-in p-6 pb-40">
      <header className="flex flex-col items-center mb-10 pt-10">
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
         <div className="bg-white p-7 rounded-[3rem] shadow-xl border border-gray-100 flex flex-col items-center text-center">
            <span className="text-[8px] font-black uppercase tracking-widest text-gray-300 mb-3">COMMANDES</span>
            <span className="text-3xl font-black italic text-brand-brown mb-3">{orders.length}</span>
            <div className="flex gap-1.5 mt-2">
               {[...Array(5)].map((_, i) => <div key={i} className={`w-2 h-2 rounded-full ${i < orders.length ? 'bg-brand-orange' : 'bg-gray-100'}`}></div>)}
            </div>
         </div>
      </div>

      {/* Active Order Tracking Section */}
      {orders.length > 0 && (
        <div className="mb-10 space-y-6">
          <div className="flex items-center gap-3 px-4">
            <div className="p-2 bg-brand-orange/10 rounded-xl text-brand-orange"><Truck size={18} /></div>
            <h3 className="text-xs font-black uppercase text-brand-brown tracking-widest italic">Suivi de commande en direct</h3>
          </div>

          {orders.map(order => (
            <OrderTracking 
              key={order.id} 
              order={order} 
              onUpdateOrder={onUpdateOrder}
              onComplete={() => {}}
            />
          ))}
        </div>
      )}

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
            { icon: ShoppingBag, label: 'Historique des Commandes', color: 'text-brand-brown', action: () => {} },
            { icon: Info, label: 'Guide d\'utilisation', color: 'text-brand-orange', action: onOpenGuide },
            { icon: Gift, label: 'Mes Récompenses & Cadeaux', color: 'text-brand-orange', action: () => setShowRewards(true) },
            { icon: QrCode, label: 'Mon Pass Khady Event', color: 'text-brand-brown', action: () => {} },
            { icon: Settings, label: 'Préférences & Profil', color: 'text-gray-300', action: () => {} },
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
    </div>
  );
};

export default AccountView;
