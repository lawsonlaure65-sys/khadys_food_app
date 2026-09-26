
import React, { useState } from 'react';
import { Send, CheckCircle, Info, Clock, ShieldCheck, Phone, Calendar, Star, Users, MapPin, ChefHat, Sparkles, Utensils, HeartHandshake, MessageSquare } from 'lucide-react';
import { playSound } from '../utils/audio';
import { TRAITEUR_CONDITIONS } from '../constants';

const MENU_OPTIONS_CHEF = [
  { id: 'royal', name: '👑 Menu Royal Khady', desc: 'Capitaine frais, Thiéboudienne Royale, Alloco & Jus de Bissap Artisanal', priceApprox: 'À partir de 15 000 FCFA / pers.' },
  { id: 'grillades', name: '🥩 Menu Dibi & Grillades Prestige', desc: 'Dibi d\'agneau braisé, Poulet Suya, Brochettes bœuf & Frites de patate douce', priceApprox: 'À partir de 12 500 FCFA / pers.' },
  { id: 'sahel', name: '🍲 Menu Saveurs du Sahel', desc: 'Sauce Mafé d\'arachide bio, Riz au gras aromatisé & Ragout de bœuf tendre', priceApprox: 'À partir de 10 000 FCFA / pers.' },
  { id: 'veggie', name: '🥗 Menu Végétarien & Fraîcheur', desc: 'Pastels aux légumes, Salade tiède de kinkeliba, Beignets de niébé & Jus Bouye', priceApprox: 'À partir de 9 000 FCFA / pers.' },
  { id: 'custom', name: '👨‍🍳 Menu Sur-Mesure Personnalisé', desc: 'Créez votre propre menu selon vos envies culinaires uniques', priceApprox: 'Sur devis personnalisé' },
];

const DIET_PREFERENCES = [
  '🌶️ Sans Piment (Piment à part)',
  '🥩 Viandes Halal Certifiées',
  '🥗 Option Végétarienne / Végétalienne',
  '🥜 Sans Arachides / Allergie Noix',
  '🌾 Sans Gluten',
  '🍹 Boissons Naturelles Incluses (Bissap/Bouye)',
  '🧁 Dessert Spécial inclus'
];

const TraiteurView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'CHEF' | 'EVENT'>('CHEF');

  // Chef à domicile form state
  const [chefForm, setChefForm] = useState({
    name: '',
    phone: '',
    district: '',
    selectedMenu: 'royal',
    customMenuText: '',
    serviceMode: 'LIVRAISON' as 'LIVRAISON' | 'RETRAIT',
    date: '',
    timeSlot: '12:30',
    guests: '4',
    diets: [] as string[],
    additionalNotes: ''
  });

  // Traiteur classique form state
  const [eventForm, setEventForm] = useState({
    name: '',
    phone: '',
    eventType: 'Mariage',
    guests: '50',
    serviceMode: 'LIVRAISON' as 'LIVRAISON' | 'RETRAIT',
    date: '',
    timeSlot: '13:00',
    location: '',
    details: ''
  });

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState<null | 'CHEF' | 'EVENT'>(null);

  const toggleDiet = (pref: string) => {
    playSound('pop');
    setChefForm(prev => ({
      ...prev,
      diets: prev.diets.includes(pref) 
        ? prev.diets.filter(d => d !== pref) 
        : [...prev.diets, pref]
    }));
  };

  const handleChefSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      playSound('success');
      setSubmitted('CHEF');
      setLoading(false);
    }, 1200);
  };

  const handleEventSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      playSound('success');
      setSubmitted('EVENT');
      setLoading(false);
    }, 1200);
  };

  const services = [
    { title: 'Chef à Domicile', desc: 'Un chef privé dans votre cuisine pour vos dîners romantiques ou repas de famille.', icon: ChefHat },
    { title: 'Mariages', desc: 'Buffet gastronomique africain & européen pour le plus beau jour de votre vie.', icon: Star },
    { title: 'Baptêmes & Fêtes', desc: 'Des menus conviviaux pour célébrer vos moments précieux en famille.', icon: Users },
    { title: 'Cocktails Pro', desc: 'Mini-pastels, samosas et jus frais pour vos réunions et séminaires.', icon: ShieldCheck },
  ];

  const getWhatsAppMessage = () => {
    if (submitted === 'CHEF') {
      const menuObj = MENU_OPTIONS_CHEF.find(m => m.id === chefForm.selectedMenu);
      return `Bonjour Khady's Food ! 👨‍🍳 Je souhaite valider mon Devis CHEF À DOMICILE :
👤 Nom : ${chefForm.name}
📞 Tel : ${chefForm.phone}
📍 Quartier : ${chefForm.district || 'Niamey'}
🚚 Mode : ${chefForm.serviceMode === 'RETRAIT' ? 'Retrait sur Place à la Cuisine Niamey' : 'Livraison / Service à Domicile'}
🍽️ Menu : ${menuObj?.name || 'Sur mesure'}
📅 Date & Heure : ${chefForm.date} à ${chefForm.timeSlot}
👥 Convives : ${chefForm.guests} personnes
🥗 Préférences : ${chefForm.diets.join(', ') || 'Aucune spécifique'}
📝 Remarques : ${chefForm.additionalNotes || 'Rien à ajouter'}`;
    } else {
      return `Bonjour Khady's Food ! 🎪 Je souhaite valider ma demande de DEVIS TRAITEUR ÉVÉNEMENTIEL :
👤 Nom : ${eventForm.name}
📞 Tel : ${eventForm.phone}
🎉 Type : ${eventForm.eventType}
🚚 Mode : ${eventForm.serviceMode === 'RETRAIT' ? 'Retrait Traiteur sur Place' : 'Livraison sur le lieu de l\'événement'}
📅 Date & Créneau : ${eventForm.date} à ${eventForm.timeSlot}
👥 Invités : ${eventForm.guests}
📍 Lieu : ${eventForm.location || 'Niamey'}
📝 Détails : ${eventForm.details || 'Voir menu standard'}`;
    }
  };

  const openWhatsAppQuote = () => {
    playSound('pop');
    const msg = encodeURIComponent(getWhatsAppMessage());
    window.open(`https://wa.me/22774441621?text=${msg}`, '_blank');
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[75vh] p-6 text-center animate-fade-in max-w-lg mx-auto">
        <div className="w-20 h-20 bg-emerald-500/10 text-emerald-600 rounded-full flex items-center justify-center mb-6 shadow-xl border-2 border-emerald-500/30">
          <CheckCircle size={44} className="animate-bounce" />
        </div>
        
        <span className="bg-brand-gold/20 text-brand-brown px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest mb-3 border border-brand-gold/40">
          {submitted === 'CHEF' ? 'DEMANDE CHEF À DOMICILE ENREGISTRÉE' : 'DEMANDE DEVIS TRAITEUR TRANSMISE'}
        </span>

        <h2 className="text-2xl font-black text-brand-brown uppercase italic mb-3 leading-tight">
          {submitted === 'CHEF' ? 'Votre Chef Privé arrive ! 👨‍🍳' : 'Projet Événementiel Reçu ! 🎪'}
        </h2>

        <p className="text-xs text-gray-600 mb-6 font-medium leading-relaxed">
          Merci <strong className="text-brand-brown">{submitted === 'CHEF' ? chefForm.name : eventForm.name}</strong> ! Notre équipe étudie votre demande pour le <strong className="text-brand-orange">{submitted === 'CHEF' ? chefForm.date : eventForm.date} à {submitted === 'CHEF' ? chefForm.timeSlot : eventForm.timeSlot}</strong> ({submitted === 'CHEF' ? `${chefForm.guests} convives` : `${eventForm.guests} invités`}).
        </p>

        {/* Quote Summary Box */}
        <div className="w-full bg-brand-brown text-white p-5 rounded-3xl shadow-xl border-2 border-brand-gold/40 text-left mb-6 space-y-2 text-[11px]">
          <div className="flex justify-between items-center border-b border-white/10 pb-2">
            <span className="text-brand-gold font-bold uppercase text-[9px]">Type & Mode</span>
            <span className="font-black uppercase">{submitted === 'CHEF' ? 'Chef à Domicile' : eventForm.eventType} • {(submitted === 'CHEF' ? chefForm.serviceMode : eventForm.serviceMode) === 'RETRAIT' ? '🛍️ Retrait sur Place' : '🚚 Livraison'}</span>
          </div>
          <div className="flex justify-between items-center border-b border-white/10 pb-2">
            <span className="text-brand-gold font-bold uppercase text-[9px]">Date & Créneau Réception</span>
            <span className="font-black text-right text-brand-gold">{submitted === 'CHEF' ? `${chefForm.date} @ ${chefForm.timeSlot}` : `${eventForm.date} @ ${eventForm.timeSlot}`}</span>
          </div>
          {submitted === 'CHEF' && (
            <>
              <div className="flex justify-between items-center border-b border-white/10 pb-2">
                <span className="text-brand-gold font-bold uppercase text-[9px]">Menu Sélectionné</span>
                <span className="font-black text-right">{MENU_OPTIONS_CHEF.find(m => m.id === chefForm.selectedMenu)?.name}</span>
              </div>
              {chefForm.diets.length > 0 && (
                <div className="pt-1">
                  <span className="text-brand-gold font-bold uppercase text-[9px] block mb-1">Préférences retenues :</span>
                  <p className="text-white/80 font-medium text-[10px]">{chefForm.diets.join(' • ')}</p>
                </div>
              )}
            </>
          )}
        </div>

        <div className="space-y-3 w-full">
          <button
            onClick={openWhatsAppQuote}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-2xl font-black uppercase text-xs italic tracking-wider shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            <MessageSquare size={18} /> Finaliser directement sur WhatsApp 💬
          </button>

          <button
            onClick={() => setSubmitted(null)}
            className="w-full bg-gray-100 hover:bg-gray-200 text-brand-brown py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all"
          >
            Nouvelle demande de devis
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-36 animate-fade-in space-y-6">
      {/* Header Banner */}
      <div className="p-8 text-center bg-gradient-to-br from-brand-brown via-[#2C1810] to-black text-white rounded-[2.5rem] shadow-2xl border-2 border-brand-gold/30 mx-4 sm:mx-6 mt-4 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-brand-orange/20 rounded-full blur-3xl pointer-events-none"></div>
        <span className="bg-brand-gold/20 text-brand-gold px-3.5 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.25em] mb-3 inline-block border border-brand-gold/30">
          EXPÉRIENCE GASTRONOMIQUE PRIVÉE
        </span>
        <h1 className="text-2xl sm:text-3xl font-black uppercase italic leading-tight mb-2 text-white">
          Traiteur & <span className="text-brand-gold">Chef à Domicile</span> 👨‍🍳
        </h1>
        <p className="text-xs text-white/70 font-medium max-w-md mx-auto leading-relaxed">
          Invitez l'excellence de Khady's Food dans votre cuisine ou lors de vos grands événements à Niamey.
        </p>
      </div>

      {/* Main Tab Switcher */}
      <div className="px-4 sm:px-6">
        <div className="bg-gray-100 p-1.5 rounded-2xl flex gap-1.5 shadow-inner border border-gray-200">
          <button
            onClick={() => { playSound('pop'); setActiveTab('CHEF'); }}
            className={`flex-1 py-3 px-4 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
              activeTab === 'CHEF'
                ? 'bg-brand-brown text-brand-gold shadow-lg scale-[1.02]'
                : 'text-gray-500 hover:text-brand-brown'
            }`}
          >
            <ChefHat size={18} className={activeTab === 'CHEF' ? 'animate-bounce' : ''} /> Chef à Domicile
          </button>

          <button
            onClick={() => { playSound('pop'); setActiveTab('EVENT'); }}
            className={`flex-1 py-3 px-4 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
              activeTab === 'EVENT'
                ? 'bg-brand-brown text-brand-gold shadow-lg scale-[1.02]'
                : 'text-gray-500 hover:text-brand-brown'
            }`}
          >
            <Utensils size={18} /> Traiteur Événementiel
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="px-4 sm:px-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {services.map((s, idx) => (
            <div 
              key={idx} 
              className={`p-4 rounded-2xl border transition-all ${
                s.title === 'Chef à Domicile' && activeTab === 'CHEF'
                  ? 'bg-brand-brown text-white border-brand-gold shadow-xl'
                  : 'bg-white text-gray-800 border-gray-100 shadow-sm'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-brand-orange/10 text-brand-orange flex items-center justify-center mb-3">
                <s.icon size={20} />
              </div>
              <h4 className="font-black uppercase text-[11px] italic leading-tight mb-1">{s.title}</h4>
              <p className="text-[9px] opacity-75 font-medium line-clamp-2">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Conditions Cards */}
      <div className="px-4 sm:px-6">
        <div className="grid grid-cols-2 gap-3">
          {TRAITEUR_CONDITIONS.map((cond, i) => (
            <div key={i} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-brand-gold/20 text-brand-brown flex items-center justify-center shrink-0 font-bold text-xs">
                ✓
              </div>
              <div>
                <h4 className="text-brand-brown font-black text-[10px] uppercase leading-tight">{cond.title}</h4>
                <p className="text-gray-500 text-[9px] font-medium leading-tight">{cond.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Form Container */}
      <div className="px-4 sm:px-6">
        {activeTab === 'CHEF' ? (
          /* FORM: CHEF À DOMICILE */
          <div className="bg-[#1A0F0D] rounded-[2.5rem] p-6 sm:p-8 shadow-2xl relative border-4 border-brand-gold/40 text-white overflow-hidden space-y-6">
            <div className="absolute -top-10 -right-10 p-8 opacity-5 scale-150 rotate-12 pointer-events-none">
              <ChefHat size={160} />
            </div>

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-2xl bg-brand-gold/20 border border-brand-gold/40 text-brand-gold flex items-center justify-center">
                  <ChefHat size={22} />
                </div>
                <div>
                  <span className="text-[9px] font-black uppercase text-brand-gold tracking-widest block">FORMULAIRE DE DEVIS PRIVÉ</span>
                  <h3 className="text-xl font-black italic uppercase text-white">Réservation Chef à Domicile 🍳</h3>
                </div>
              </div>
              <p className="text-xs text-white/70 font-medium mb-6">
                Sélectionnez votre menu, le nombre de convives et vos exigences culinaires pour un devis personnalisé sous 2h.
              </p>

              <form onSubmit={handleChefSubmit} className="space-y-5">
                {/* Contact Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-brand-gold block mb-1">Votre Nom Complet *</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="Ex: Amina Diallo" 
                      className="w-full p-4 bg-white/5 rounded-2xl text-white text-xs font-bold outline-none border border-white/10 focus:border-brand-gold"
                      value={chefForm.name} 
                      onChange={e => setChefForm({...chefForm, name: e.target.value})} 
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase text-brand-gold block mb-1">Numéro WhatsApp *</label>
                    <input 
                      type="tel" 
                      required 
                      placeholder="+227 90 00 00 00" 
                      className="w-full p-4 bg-white/5 rounded-2xl text-white text-xs font-bold outline-none border border-white/10 focus:border-brand-gold"
                      value={chefForm.phone} 
                      onChange={e => setChefForm({...chefForm, phone: e.target.value})} 
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-brand-gold block mb-1">Quartier / Adresse à Niamey *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Ex: Plateau, Kouara Kano, Harobanda..." 
                    className="w-full p-4 bg-white/5 rounded-2xl text-white text-xs font-bold outline-none border border-white/10 focus:border-brand-gold"
                    value={chefForm.district} 
                    onChange={e => setChefForm({...chefForm, district: e.target.value})} 
                  />
                </div>

                {/* Mode de Reception (Retrait vs Livraison) */}
                <div>
                  <label className="text-[10px] font-bold uppercase text-brand-gold block mb-2">Mode de Réception Traiteur *</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => { playSound('pop'); setChefForm({...chefForm, serviceMode: 'LIVRAISON'}); }}
                      className={`p-3.5 rounded-2xl border text-xs font-black uppercase flex items-center justify-center gap-2 transition-all ${
                        chefForm.serviceMode === 'LIVRAISON'
                          ? 'bg-brand-gold text-brand-brown border-brand-gold shadow-lg scale-[1.01]'
                          : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      🚚 Service à Domicile
                    </button>
                    <button
                      type="button"
                      onClick={() => { playSound('pop'); setChefForm({...chefForm, serviceMode: 'RETRAIT'}); }}
                      className={`p-3.5 rounded-2xl border text-xs font-black uppercase flex items-center justify-center gap-2 transition-all ${
                        chefForm.serviceMode === 'RETRAIT'
                          ? 'bg-brand-gold text-brand-brown border-brand-gold shadow-lg scale-[1.01]'
                          : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      🛍️ Retrait sur Place (Niamey)
                    </button>
                  </div>
                </div>

                {/* Date, Time & Guest Count */}
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[10px] font-bold uppercase text-brand-gold block mb-1">
                        <Calendar size={12} className="inline mr-1" />
                        Date de la Prestation *
                      </label>
                      <input 
                        type="date" 
                        required 
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full p-4 bg-white/10 rounded-2xl text-white text-xs font-bold outline-none border border-white/10 focus:border-brand-gold"
                        value={chefForm.date} 
                        onChange={e => setChefForm({...chefForm, date: e.target.value})} 
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase text-brand-gold block mb-1">
                        <Clock size={12} className="inline mr-1" />
                        Saisir / Choisir Heure *
                      </label>
                      <input 
                        type="time" 
                        required 
                        className="w-full p-4 bg-white/10 rounded-2xl text-white text-xs font-bold outline-none border border-white/10 focus:border-brand-gold"
                        value={chefForm.timeSlot} 
                        onChange={e => setChefForm({...chefForm, timeSlot: e.target.value})} 
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase text-brand-gold block mb-1">Nombre Convives *</label>
                      <input 
                        type="number" 
                        required 
                        min="1"
                        max="100"
                        placeholder="Ex: 4" 
                        className="w-full p-4 bg-white/5 rounded-2xl text-white text-xs font-bold outline-none border border-white/10 focus:border-brand-gold"
                        value={chefForm.guests} 
                        onChange={e => setChefForm({...chefForm, guests: e.target.value})} 
                      />
                    </div>
                  </div>

                  {/* Quick Time Slots Shortcuts */}
                  <div>
                    <label className="text-[9px] font-bold uppercase text-white/60 block mb-1.5">
                      Créneaux Horaires Préférés (Cliquer pour sélectionner) :
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {['11:30', '12:00', '12:30', '13:00', '14:00', '18:30', '19:00', '19:30', '20:00', '20:30'].map((slot) => (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => { playSound('pop'); setChefForm({...chefForm, timeSlot: slot}); }}
                          className={`px-3 py-1.5 rounded-xl text-[10px] font-black tracking-wider transition-all border ${
                            chefForm.timeSlot === slot
                              ? 'bg-brand-orange text-white border-brand-gold shadow-md scale-105'
                              : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10'
                          }`}
                        >
                          🕒 {slot}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Menu Selection */}
                <div>
                  <label className="text-[10px] font-bold uppercase text-brand-gold block mb-2">Choix du Menu Proposé *</label>
                  <div className="space-y-2">
                    {MENU_OPTIONS_CHEF.map(m => (
                      <div 
                        key={m.id}
                        onClick={() => { playSound('pop'); setChefForm({...chefForm, selectedMenu: m.id}); }}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                          chefForm.selectedMenu === m.id
                            ? 'bg-brand-orange/20 border-brand-gold text-white shadow-lg'
                            : 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                          chefForm.selectedMenu === m.id ? 'border-brand-gold bg-brand-gold text-brand-brown' : 'border-white/30'
                        }`}>
                          {chefForm.selectedMenu === m.id && <span className="text-[10px] font-black">✓</span>}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-center mb-0.5">
                            <span className="font-black text-xs text-white">{m.name}</span>
                            <span className="text-[9px] font-bold text-brand-gold">{m.priceApprox}</span>
                          </div>
                          <p className="text-[10px] text-white/60 font-medium">{m.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Dietary Preferences Checkboxes */}
                <div>
                  <label className="text-[10px] font-bold uppercase text-brand-gold block mb-2">
                    Préférences Alimentaires & Allergies (Optionnel)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {DIET_PREFERENCES.map((pref, idx) => {
                      const isSelected = chefForm.diets.includes(pref);
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => toggleDiet(pref)}
                          className={`px-3 py-2 rounded-xl text-[10px] font-bold transition-all border ${
                            isSelected
                              ? 'bg-brand-gold text-brand-brown border-brand-gold font-black shadow-md'
                              : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10'
                          }`}
                        >
                          {pref}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Additional Details */}
                <div>
                  <label className="text-[10px] font-bold uppercase text-brand-gold block mb-1">
                    Précisions / Exigences Culinaires Spécifiques
                  </label>
                  <textarea 
                    placeholder="Heure souhaitée, vaisselle disponible ou demandes particulières..." 
                    className="w-full p-4 bg-white/5 rounded-2xl text-white text-xs font-bold outline-none border border-white/10 h-24 resize-none focus:border-brand-gold"
                    value={chefForm.additionalNotes} 
                    onChange={e => setChefForm({...chefForm, additionalNotes: e.target.value})}
                  ></textarea>
                </div>

                <button 
                  type="submit"
                  disabled={loading} 
                  className="w-full bg-brand-orange hover:bg-brand-gold text-white hover:text-brand-brown py-5 rounded-2xl font-black uppercase shadow-2xl flex items-center justify-center gap-3 active:scale-95 italic tracking-wider transition-all"
                >
                  {loading ? "Préparation de votre devis..." : "Demander mon Devis Chef à Domicile 👨‍🍳"} <Send size={18} />
                </button>
              </form>
            </div>
          </div>
        ) : (
          /* FORM: TRAITEUR ÉVÉNEMENTIEL */
          <div className="bg-[#1A0F0D] rounded-[2.5rem] p-6 sm:p-8 shadow-2xl relative border-4 border-white/20 text-white overflow-hidden space-y-6">
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-2xl bg-brand-orange/20 border border-brand-orange/40 text-brand-orange flex items-center justify-center">
                  <Utensils size={22} />
                </div>
                <div>
                  <span className="text-[9px] font-black uppercase text-brand-gold tracking-widest block">GRANDES RÉCEPTIONS & BUFFETS</span>
                  <h3 className="text-xl font-black italic uppercase text-white">Devis Traiteur Événementiel 🎪</h3>
                </div>
              </div>
              <p className="text-xs text-white/70 font-medium mb-6">
                Mariages, Baptêmes, Séminaires ou Réceptions privées à Niamey et environs.
              </p>

              <form onSubmit={handleEventSubmit} className="space-y-4">
                <input 
                  type="text" 
                  required 
                  placeholder="Votre Nom Complet *" 
                  className="w-full p-4 bg-white/5 rounded-2xl text-white text-xs font-bold outline-none border border-white/10 focus:border-brand-gold" 
                  value={eventForm.name} 
                  onChange={e => setEventForm({...eventForm, name: e.target.value})} 
                />

                <input 
                  type="tel" 
                  required 
                  placeholder="Numéro WhatsApp *" 
                  className="w-full p-4 bg-white/5 rounded-2xl text-white text-xs font-bold outline-none border border-white/10 focus:border-brand-gold" 
                  value={eventForm.phone} 
                  onChange={e => setEventForm({...eventForm, phone: e.target.value})} 
                />
                
                <div className="grid grid-cols-2 gap-3">
                  <select 
                    required 
                    className="w-full p-4 bg-white/10 rounded-2xl text-white text-xs font-bold outline-none border border-white/10" 
                    value={eventForm.eventType} 
                    onChange={e => setEventForm({...eventForm, eventType: e.target.value})}
                  >
                    <option value="Mariage" className="bg-brand-brown">Mariage</option>
                    <option value="Baptême" className="bg-brand-brown">Baptême</option>
                    <option value="Cocktail Pro" className="bg-brand-brown">Cocktail Pro</option>
                    <option value="Anniversaire" className="bg-brand-brown">Anniversaire</option>
                    <option value="Autre" className="bg-brand-brown">Autre Événement</option>
                  </select>

                  <input 
                    type="number" 
                    required 
                    placeholder="Invités (ex: 50)" 
                    className="w-full p-4 bg-white/5 rounded-2xl text-white text-xs font-bold outline-none border border-white/10 focus:border-brand-gold" 
                    value={eventForm.guests} 
                    onChange={e => setEventForm({...eventForm, guests: e.target.value})} 
                  />
                </div>

                {/* Mode de Reception (Retrait vs Livraison) */}
                <div>
                  <label className="text-[10px] font-bold uppercase text-brand-gold block mb-2">Mode de Réception Événement Traiteur *</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => { playSound('pop'); setEventForm({...eventForm, serviceMode: 'LIVRAISON'}); }}
                      className={`p-3.5 rounded-2xl border text-xs font-black uppercase flex items-center justify-center gap-2 transition-all ${
                        eventForm.serviceMode === 'LIVRAISON'
                          ? 'bg-brand-gold text-brand-brown border-brand-gold shadow-lg scale-[1.01]'
                          : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      🚚 Livraison sur le Lieu
                    </button>
                    <button
                      type="button"
                      onClick={() => { playSound('pop'); setEventForm({...eventForm, serviceMode: 'RETRAIT'}); }}
                      className={`p-3.5 rounded-2xl border text-xs font-black uppercase flex items-center justify-center gap-2 transition-all ${
                        eventForm.serviceMode === 'RETRAIT'
                          ? 'bg-brand-gold text-brand-brown border-brand-gold shadow-lg scale-[1.01]'
                          : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      🛍️ Retrait Traiteur sur Place
                    </button>
                  </div>
                </div>

                {/* Date, Time Slot & Location */}
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold uppercase text-brand-gold block mb-1">
                        <Calendar size={12} className="inline mr-1" />
                        Date de l'Événement *
                      </label>
                      <input 
                        type="date" 
                        required 
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full p-4 bg-white/10 rounded-2xl text-white text-xs font-bold outline-none border border-white/10 focus:border-brand-gold" 
                        value={eventForm.date} 
                        onChange={e => setEventForm({...eventForm, date: e.target.value})} 
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase text-brand-gold block mb-1">
                        <Clock size={12} className="inline mr-1" />
                        Heure de Début / Retrait *
                      </label>
                      <input 
                        type="time" 
                        required 
                        className="w-full p-4 bg-white/10 rounded-2xl text-white text-xs font-bold outline-none border border-white/10 focus:border-brand-gold" 
                        value={eventForm.timeSlot} 
                        onChange={e => setEventForm({...eventForm, timeSlot: e.target.value})} 
                      />
                    </div>
                  </div>

                  {/* Quick Time Slots Shortcuts */}
                  <div>
                    <label className="text-[9px] font-bold uppercase text-white/60 block mb-1.5">
                      Créneaux Horaires Événementiels :
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {['10:00', '11:30', '12:30', '14:00', '16:00', '18:00', '19:30', '20:30'].map((slot) => (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => { playSound('pop'); setEventForm({...eventForm, timeSlot: slot}); }}
                          className={`px-3 py-1.5 rounded-xl text-[10px] font-black tracking-wider transition-all border ${
                            eventForm.timeSlot === slot
                              ? 'bg-brand-orange text-white border-brand-gold shadow-md scale-105'
                              : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10'
                          }`}
                        >
                          ⏰ {slot}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase text-brand-gold block mb-1">
                      Lieu / Quartier de Réception
                    </label>
                    <input 
                      type="text" 
                      placeholder="Ex: Kouara Kano, Niamey 2000, Plateau..." 
                      className="w-full p-4 bg-white/5 rounded-2xl text-white text-xs font-bold outline-none border border-white/10 focus:border-brand-gold" 
                      value={eventForm.location} 
                      onChange={e => setEventForm({...eventForm, location: e.target.value})} 
                    />
                  </div>
                </div>
                
                <textarea 
                  placeholder="Détails de l'événement ou plats souhaités (Buffet, Service à table, Cocktail...)" 
                  className="w-full p-4 bg-white/5 rounded-2xl text-white text-xs font-bold outline-none border border-white/10 h-28 resize-none focus:border-brand-gold" 
                  value={eventForm.details} 
                  onChange={e => setEventForm({...eventForm, details: e.target.value})}
                ></textarea>

                <button 
                  type="submit"
                  disabled={loading} 
                  className="w-full bg-brand-orange hover:bg-brand-gold text-white hover:text-brand-brown py-5 rounded-2xl font-black uppercase shadow-2xl flex items-center justify-center gap-3 active:scale-95 italic tracking-wider transition-all"
                >
                  {loading ? "Calcul en cours..." : "Demander mon Devis Événementiel 🎪"} <Send size={18} />
                </button>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Direct Line */}
      <div className="px-4 sm:px-6">
        <div className="p-6 bg-brand-gold/10 rounded-[2.5rem] border border-brand-gold/30 flex items-center gap-5">
          <div className="w-14 h-14 bg-brand-gold rounded-2xl flex items-center justify-center text-brand-brown shadow-lg shrink-0">
            <Phone size={24} />
          </div>
          <div>
            <h4 className="text-xs font-black uppercase text-brand-brown italic">Ligne Directe Événementiel & Chef</h4>
            <p className="text-[11px] font-bold text-brand-brown/80">WhatsApp : +227 74 44 16 21 | Appel : +227 96 05 23 10</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TraiteurView;

