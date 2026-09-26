import React, { useState, useEffect } from 'react';
import { RESTAURANT_INFO, BILLO_INFO, LOGO_URL } from '../constants';
import { Settings, Phone, MapPin, MessageSquare, Moon, Sun, ShieldCheck, Lock, ChevronRight, HelpCircle, FileText, Bell, Sparkles, Download, Smartphone, CheckCircle2, Share2, PlusSquare, X, Instagram, Facebook, Globe, Music, RefreshCw, Languages, Save, Send } from 'lucide-react';
import { playSound } from '../utils/audio';
import { useLanguage } from '../context/LanguageContext';
import { getStoredRestaurantWhatsApp, openWhatsApp, buildCustomerConfirmationMessage, buildKitchenOrderMessage } from '../utils/whatsapp';

interface SettingsViewProps {
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenAdmin: () => void;
  onOpenFaq: () => void;
  onOpenGuide: () => void;
  onOpenWhatsApp: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  isDarkMode,
  onToggleDarkMode,
  onOpenAdmin,
  onOpenFaq,
  onOpenGuide,
  onOpenWhatsApp
}) => {
  const { language, setLanguage, t } = useLanguage();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);
  const [customPhone, setCustomPhone] = useState(() => getStoredRestaurantWhatsApp().display);
  const [phoneSaved, setPhoneSaved] = useState(false);

  const handleSavePhone = () => {
    playSound('cash');
    localStorage.setItem('khadys_custom_whatsapp', customPhone.trim());
    setPhoneSaved(true);
    setTimeout(() => setPhoneSaved(false), 3000);
  };

  const handleTestWhatsApp = () => {
    playSound('pop');
    const sampleOrder = {
      id: 'TEST-88',
      customerName: 'Client Test',
      phone: '+227 70 03 25 52',
      address: 'Plateau, Niamey',
      district: 'Plateau',
      items: [{ id: 'sp1', name: 'Tiep Royal Khady', description: 'Riz rouge sénégalais royal', price: 5500, quantity: 1, category: 'Spécialité Maison' as const, image: '', rating: 5, isAvailable: true }],
      total: 5500,
      deliveryFee: 1000,
      status: 'RECEIVED' as const,
      paymentMethod: 'MYNITA' as const,
      timestamp: new Date().toISOString()
    };

    const customerMsg = buildCustomerConfirmationMessage(sampleOrder);
    openWhatsApp('+227 70 03 25 52', customerMsg);
  };

  useEffect(() => {
    // Check if app is already running in standalone mode
    if (window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone) {
      setIsInstalled(true);
    }

    // Check if beforeinstallprompt was already captured
    if ((window as any).deferredInstallPrompt) {
      setDeferredPrompt((window as any).deferredInstallPrompt);
    }

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      (window as any).deferredInstallPrompt = e;
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setInstallSuccess(true);
      setDeferredPrompt(null);
      (window as any).deferredInstallPrompt = null;
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('pwa-installable', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('pwa-installable', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallApp = async () => {
    playSound('pop');
    
    // If prompt event is available
    const promptEvent = deferredPrompt || (window as any).deferredInstallPrompt;
    if (promptEvent) {
      promptEvent.prompt();
      const choiceResult = await promptEvent.userChoice;
      if (choiceResult.outcome === 'accepted') {
        playSound('success');
        setInstallSuccess(true);
        setIsInstalled(true);
        setDeferredPrompt(null);
        (window as any).deferredInstallPrompt = null;
      }
    } else {
      // If browser doesn't trigger prompt directly (iOS, or already installed, or browser settings)
      setShowInstructions(true);
    }
  };

  const handleForceAppUpdate = async () => {
    playSound('pop');
    try {
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: 'CLEAR_CACHE' });
        navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
      }
      if ('caches' in window) {
        const cacheKeys = await caches.keys();
        await Promise.all(cacheKeys.map(k => caches.delete(k)));
      }
    } catch (e) {
      console.warn('Error clearing cache:', e);
    }
    window.location.reload();
  };

  return (
    <div className="animate-fade-in p-4 sm:p-6 pb-36 max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <header className="flex justify-between items-center">
        <div>
          <span className="text-[9px] font-black uppercase text-brand-orange tracking-[0.3em] flex items-center gap-1.5 mb-1">
            <Sparkles size={14} className="animate-pulse" /> Configuration & Contact
          </span>
          <h2 className="text-3xl font-black italic uppercase text-brand-brown leading-none">
            CONTACT <span className="text-brand-orange">& PARAMÈTRES</span>
          </h2>
        </div>
        <div className="w-12 h-12 bg-brand-brown text-brand-gold rounded-2xl flex items-center justify-center shadow-lg">
          <Settings size={22} />
        </div>
      </header>

      {/* Restaurant Card */}
      <div className="bg-gradient-to-r from-brand-brown to-[#2C1814] text-white p-6 rounded-[2.5rem] shadow-2xl border-2 border-brand-gold/30 flex items-center gap-5">
        <img src={LOGO_URL} alt="Khady's Logo" className="w-20 h-20 rounded-2xl border-2 border-brand-gold shadow-md object-cover shrink-0" />
        <div className="space-y-1">
          <span className="bg-brand-orange text-white text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-widest inline-block">
            {RESTAURANT_INFO.slogan}
          </span>
          <h3 className="text-2xl font-black italic uppercase text-brand-gold">
            {RESTAURANT_INFO.name}
          </h3>
          <p className="text-xs text-white/70 font-medium flex items-center gap-1.5">
            <MapPin size={14} className="text-brand-orange" /> {RESTAURANT_INFO.location}
          </p>
        </div>
      </div>

      {/* PWA Install App Section */}
      <div className="bg-gradient-to-br from-brand-brown via-[#2A1612] to-black text-white rounded-[2.5rem] p-6 shadow-2xl border-2 border-brand-gold/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-orange/10 rounded-full blur-2xl pointer-events-none"></div>

        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-brand-orange/20 text-brand-gold border border-brand-gold/30 flex items-center justify-center shadow-lg">
              <Smartphone size={24} className="animate-bounce" />
            </div>
            <div>
              <span className="text-[8px] font-black uppercase tracking-[0.25em] text-brand-gold block">
                APPLICATION MOBILE NATIVE
              </span>
              <h3 className="text-xl font-black italic uppercase text-white leading-tight">
                Installer Khady's Food 📱
              </h3>
            </div>
          </div>

          {isInstalled ? (
            <span className="bg-green-500/20 text-green-300 border border-green-500/40 px-3 py-1 rounded-full text-[8px] font-black uppercase flex items-center gap-1 shrink-0">
              <CheckCircle2 size={12} /> Installée
            </span>
          ) : (
            <span className="bg-brand-gold/20 text-brand-gold border border-brand-gold/40 px-3 py-1 rounded-full text-[8px] font-black uppercase flex items-center gap-1 shrink-0">
              <Sparkles size={12} /> Gratuit
            </span>
          )}
        </div>

        <p className="text-xs text-white/70 font-medium mb-3 leading-relaxed">
          Installez Khady's Food directement sur l'écran d'accueil de votre téléphone pour commander plus vite, même hors-ligne !
        </p>

        <div className="bg-brand-gold/10 border border-brand-gold/30 p-3 rounded-2xl text-[10px] text-brand-gold mb-5 font-bold space-y-1">
          <p>💡 <span className="underline">IMPORTANT pour le Vrai Logo & Nom Khady's :</span></p>
          <p className="text-white/80 font-normal">
            Si vous testez dans l'aperçu AI Studio, le téléphone installe la page d'essai. Pour avoir l'icône officielle du restaurant, ouvrez directement le lien <strong className="text-brand-gold">khadysfood.vercel.app</strong> dans Chrome ou Safari sur votre téléphone !
          </p>
        </div>

        {installSuccess ? (
          <div className="bg-green-500/20 border border-green-500/50 p-4 rounded-2xl flex items-center gap-3 text-green-300">
            <CheckCircle2 size={24} className="shrink-0" />
            <span className="text-xs font-bold uppercase">
              Félicitations ! L'application Khady's Food est maintenant installée sur votre appareil ! 🎉
            </span>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleInstallApp}
              className="flex-1 bg-brand-orange hover:bg-brand-gold text-white hover:text-brand-brown py-4 px-6 rounded-2xl font-black uppercase italic text-xs tracking-wider shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-all border border-white/20"
            >
              <Download size={18} /> Installer l'application
            </button>

            <button
              onClick={() => { playSound('pop'); setShowInstructions(!showInstructions); }}
              className="bg-white/10 hover:bg-white/20 text-white/80 py-4 px-4 rounded-2xl font-black uppercase text-[10px] tracking-wider flex items-center justify-center gap-1.5 transition-all shrink-0"
            >
              <HelpCircle size={16} /> Instructions
            </button>
          </div>
        )}

        {/* Force Update Button for Installed App */}
        <div className="mt-4 pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-[10px] text-white/70 font-medium">
            <span className="text-brand-gold font-bold uppercase block">🔄 Mise à jour GitHub / Server</span>
            <p>Détecter les derniers changements publiés & rafraîchir l'application installée.</p>
          </div>
          <button
            onClick={handleForceAppUpdate}
            className="w-full sm:w-auto px-5 py-2.5 bg-white/10 hover:bg-brand-gold hover:text-brand-brown text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 border border-white/20 shrink-0 active:scale-95"
          >
            <RefreshCw size={14} className="animate-spin-slow" /> Mettre à jour l'application
          </button>
        </div>

        {/* Installation Instructions Dropdown / Card */}
        {showInstructions && (
          <div className="mt-5 pt-5 border-t border-white/10 space-y-4 animate-fade-in">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-black uppercase text-brand-gold tracking-widest flex items-center gap-2">
                <HelpCircle size={14} /> Comment installer manuellement :
              </h4>
              <button 
                onClick={() => setShowInstructions(false)}
                className="text-white/40 hover:text-white p-1 rounded-full"
              >
                <X size={16} />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
              {/* iPhone / Safari */}
              <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-2">
                <span className="font-black text-brand-orange uppercase block text-[10px]">Sur iPhone & iPad (Safari) :</span>
                <ol className="list-decimal list-inside space-y-1.5 text-white/80 font-medium">
                  <li>Appuyez sur le bouton <strong className="text-white">Partager <Share2 size={12} className="inline mx-0.5" /></strong> en bas de Safari.</li>
                  <li>Défilez vers le bas et sélectionnez <strong className="text-white">Sur l'écran d'accueil <PlusSquare size={12} className="inline mx-0.5" /></strong>.</li>
                  <li>Validez en appuyant sur <strong className="text-brand-gold">Ajouter</strong> !</li>
                </ol>
              </div>

              {/* Android / Chrome */}
              <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-2">
                <span className="font-black text-brand-gold uppercase block text-[10px]">Sur Android (Chrome / Samsung) :</span>
                <ol className="list-decimal list-inside space-y-1.5 text-white/80 font-medium">
                  <li>Appuyez sur le menu <strong className="text-white">Trois points (⋮)</strong> en haut à droite.</li>
                  <li>Sélectionnez <strong className="text-white">Installer l'application</strong> ou <strong className="text-white">Ajouter à l'écran d'accueil</strong>.</li>
                  <li>Confirmez l'installation sur votre téléphone.</li>
                </ol>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Preferences Section */}
      <div className="bg-white rounded-[2.5rem] p-6 shadow-xl border border-gray-100 space-y-5">
        <h3 className="text-xs font-black uppercase tracking-widest text-brand-orange flex items-center gap-2">
          <Settings size={16} /> Apparences & Notifications
        </h3>

        <div className="space-y-3">
          {/* Language Selector */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-brand-gold text-brand-brown">
                <Languages size={18} />
              </div>
              <div>
                <h4 className="font-black text-xs uppercase italic text-brand-brown">{t('settings.lang_selector', 'Langue de l\'application')}</h4>
                <p className="text-[9px] text-gray-400 font-bold uppercase">{t('settings.lang_desc', 'Choisissez la langue d\'affichage')}</p>
              </div>
            </div>
            <div className="flex bg-gray-200 p-1 rounded-xl gap-1">
              <button
                onClick={() => { playSound('pop'); setLanguage('fr'); }}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${
                  language === 'fr' ? 'bg-brand-brown text-white shadow-md' : 'text-gray-600 hover:text-black'
                }`}
              >
                FR 🇫🇷
              </button>
              <button
                onClick={() => { playSound('pop'); setLanguage('en'); }}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${
                  language === 'en' ? 'bg-brand-brown text-white shadow-md' : 'text-gray-600 hover:text-black'
                }`}
              >
                EN 🇬🇧
              </button>
            </div>
          </div>

          {/* Dark Mode Toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${isDarkMode ? 'bg-brand-gold text-brand-brown' : 'bg-brand-brown text-white'}`}>
                {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
              </div>
              <div>
                <h4 className="font-black text-xs uppercase italic text-brand-brown">{t('settings.dark_mode_title', 'Thème Nuit Or')}</h4>
                <p className="text-[9px] text-gray-400 font-bold uppercase">{t('settings.dark_mode_desc', 'Ajustement sombre pour la soirée')}</p>
              </div>
            </div>
            <button 
              onClick={onToggleDarkMode}
              className={`w-12 h-6 rounded-full transition-colors relative p-1 ${isDarkMode ? 'bg-brand-orange' : 'bg-gray-300'}`}
            >
              <div className={`w-4 h-4 rounded-full bg-white transition-transform ${isDarkMode ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>

          {/* Notifications Toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-brand-orange text-white">
                <Bell size={18} />
              </div>
              <div>
                <h4 className="font-black text-xs uppercase italic text-brand-brown">{t('settings.notif_title', 'Avis & Offres Flash')}</h4>
                <p className="text-[9px] text-gray-400 font-bold uppercase">{t('settings.notif_desc', 'Statut de commande en direct')}</p>
              </div>
            </div>
            <button 
              onClick={() => { playSound('pop'); setNotificationsEnabled(!notificationsEnabled); }}
              className={`w-12 h-6 rounded-full transition-colors relative p-1 ${notificationsEnabled ? 'bg-brand-orange' : 'bg-gray-300'}`}
            >
              <div className={`w-4 h-4 rounded-full bg-white transition-transform ${notificationsEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>
        </div>
      </div>

      {/* WhatsApp Double Notification & Restaurant Number Configuration */}
      <div className="bg-gradient-to-br from-[#120B09] to-[#25130D] text-white rounded-[2.5rem] p-6 shadow-2xl border-2 border-brand-gold/40 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shrink-0">
              <MessageSquare size={20} />
            </div>
            <div>
              <h3 className="text-xs font-black uppercase tracking-widest text-brand-gold">
                Double Notification WhatsApp 📲
              </h3>
              <p className="text-[9px] text-white/60 font-bold uppercase">
                Alerte Client automatique + Transmission Cuisine
              </p>
            </div>
          </div>
          <span className="bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full text-[8px] font-black uppercase border border-emerald-500/30">
            Actif
          </span>
        </div>

        <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-3">
          <label className="text-[10px] font-black uppercase text-brand-gold block">
            Numéro WhatsApp Officiel Khady's Food (Cuisine) :
          </label>
          <div className="flex gap-2">
            <input 
              type="text"
              value={customPhone}
              onChange={(e) => setCustomPhone(e.target.value)}
              placeholder="+227 74 44 16 21 ou +227 90 20 25 25"
              className="flex-1 bg-black/50 border border-white/20 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-brand-gold font-mono"
            />
            <button
              onClick={handleSavePhone}
              className="bg-brand-gold hover:bg-yellow-400 text-brand-brown px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 active:scale-95 transition-all shrink-0 shadow-md"
            >
              <Save size={14} /> {phoneSaved ? 'Enregistré !' : 'Sauvegarder'}
            </button>
          </div>
          {phoneSaved && (
            <p className="text-[9px] text-emerald-400 font-bold flex items-center gap-1">
              <CheckCircle2 size={12} /> Numéro restaurant mis à jour avec succès.
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <div className="text-[10px] text-white/70">
            <span className="text-white font-bold block">Tester la notification client :</span>
            <span>Simuler l'envoi de confirmation automatique vers le +227 70 03 25 52</span>
          </div>
          <button
            onClick={handleTestWhatsApp}
            className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shrink-0 border border-emerald-400/30"
          >
            <Send size={14} /> Tester Notification WhatsApp
          </button>
        </div>
      </div>

      {/* Direct Contact Options */}
      <div className="bg-white rounded-[2.5rem] p-6 shadow-xl border border-gray-100 space-y-4">
        <h3 className="text-xs font-black uppercase tracking-widest text-brand-brown flex items-center gap-2">
          <Phone size={16} className="text-brand-orange" /> Contacts & Assistance
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button 
            onClick={onOpenWhatsApp}
            className="p-4 bg-green-50 hover:bg-green-100 text-green-800 rounded-2xl border border-green-200 flex items-center gap-3 active:scale-95 transition-all text-left"
          >
            <div className="w-10 h-10 bg-green-500 text-white rounded-xl flex items-center justify-center shrink-0">
              <MessageSquare size={20} />
            </div>
            <div>
              <span className="font-black text-xs uppercase italic block">WhatsApp Cuisine</span>
              <span className="text-[9px] font-mono font-bold uppercase text-green-600">{RESTAURANT_INFO.whatsapp}</span>
            </div>
          </button>

          <a 
            href={`tel:${RESTAURANT_INFO.directLineClean}`}
            className="p-4 bg-orange-50 hover:bg-orange-100 text-brand-brown rounded-2xl border border-orange-200 flex items-center gap-3 active:scale-95 transition-all text-left"
          >
            <div className="w-10 h-10 bg-brand-orange text-white rounded-xl flex items-center justify-center shrink-0">
              <Phone size={20} />
            </div>
            <div>
              <span className="font-black text-xs uppercase italic block">Ligne Directe</span>
              <span className="text-[9px] font-mono font-bold uppercase text-brand-orange">{RESTAURANT_INFO.directLine}</span>
            </div>
          </a>

          <a 
            href={`https://wa.me/${BILLO_INFO.whatsappClean}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-4 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-2xl border border-amber-200 flex items-center gap-3 active:scale-95 transition-all text-left"
          >
            <div className="w-10 h-10 bg-brand-gold text-brand-brown rounded-xl flex items-center justify-center shrink-0">
              <Phone size={20} />
            </div>
            <div>
              <span className="font-black text-xs uppercase italic block">Livreur Billo Express</span>
              <span className="text-[9px] font-mono font-bold uppercase text-brand-brown">{BILLO_INFO.whatsapp}</span>
            </div>
          </a>
        </div>
      </div>

      {/* Social Media Networks */}
      <div className="bg-gradient-to-br from-brand-brown to-[#2C1810] text-white rounded-[2.5rem] p-6 shadow-xl border-2 border-brand-gold/30 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black uppercase tracking-widest text-brand-gold flex items-center gap-2">
            <Sparkles size={16} /> Suivez-nous sur les Réseaux
          </h3>
          <span className="text-[9px] font-bold text-white/60 uppercase">@Khady's Food</span>
        </div>

        <p className="text-[11px] text-white/70 font-medium">
          Retrouvez nos vidéos culinaires, nos coulisses et les plats du jour en direct sur nos pages officielles :
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          {/* Facebook */}
          <a
            href={RESTAURANT_INFO.socials.facebook.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => playSound('pop')}
            className="p-4 bg-white/10 hover:bg-blue-600/30 rounded-2xl border border-white/10 hover:border-blue-400 flex items-center gap-3 transition-all text-left group"
          >
            <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center shrink-0 shadow-lg group-hover:scale-110 transition-transform">
              <Facebook size={20} />
            </div>
            <div>
              <span className="font-black text-xs uppercase italic text-white block">Facebook</span>
              <span className="text-[10px] font-bold text-brand-gold">{RESTAURANT_INFO.socials.facebook.handle}</span>
            </div>
          </a>

          {/* Instagram */}
          <a
            href={RESTAURANT_INFO.socials.instagram.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => playSound('pop')}
            className="p-4 bg-white/10 hover:bg-pink-600/30 rounded-2xl border border-white/10 hover:border-pink-400 flex items-center gap-3 transition-all text-left group"
          >
            <div className="w-10 h-10 bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white rounded-xl flex items-center justify-center shrink-0 shadow-lg group-hover:scale-110 transition-transform">
              <Instagram size={20} />
            </div>
            <div>
              <span className="font-black text-xs uppercase italic text-white block">Instagram</span>
              <span className="text-[10px] font-bold text-brand-gold">{RESTAURANT_INFO.socials.instagram.handle}</span>
            </div>
          </a>

          {/* TikTok */}
          <a
            href={RESTAURANT_INFO.socials.tiktok.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => playSound('pop')}
            className="p-4 bg-white/10 hover:bg-black/50 rounded-2xl border border-white/10 hover:border-white/40 flex items-center gap-3 transition-all text-left group"
          >
            <div className="w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center shrink-0 shadow-lg border border-white/20 group-hover:scale-110 transition-transform">
              <Music size={20} className="text-cyan-400" />
            </div>
            <div>
              <span className="font-black text-xs uppercase italic text-white block">TikTok</span>
              <span className="text-[10px] font-bold text-brand-gold">{RESTAURANT_INFO.socials.tiktok.handle}</span>
            </div>
          </a>
        </div>
      </div>

      {/* Helpful Links & Guide */}
      <div className="bg-white rounded-[2.5rem] p-6 shadow-xl border border-gray-100 space-y-3">
        <button 
          onClick={() => { playSound('pop'); onOpenFaq(); }}
          className="w-full flex items-center justify-between p-4 hover:bg-gray-50 rounded-2xl transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <HelpCircle size={18} className="text-brand-orange" />
            <span className="font-black text-xs uppercase italic text-brand-brown">Foire aux Questions (FAQ)</span>
          </div>
          <ChevronRight size={18} className="text-gray-400" />
        </button>

        <button 
          onClick={() => { playSound('pop'); onOpenGuide(); }}
          className="w-full flex items-center justify-between p-4 hover:bg-gray-50 rounded-2xl transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <FileText size={18} className="text-brand-brown" />
            <span className="font-black text-xs uppercase italic text-brand-brown">Guide d'Utilisation & Tarifs Billo</span>
          </div>
          <ChevronRight size={18} className="text-gray-400" />
        </button>

        <button 
          onClick={() => { playSound('pop'); onOpenAdmin(); }}
          className="w-full flex items-center justify-between p-4 bg-brand-brown/5 hover:bg-brand-brown/10 rounded-2xl transition-colors text-left border border-brand-brown/10"
        >
          <div className="flex items-center gap-3">
            <Lock size={18} className="text-brand-gold" />
            <div>
              <span className="font-black text-xs uppercase italic text-brand-brown block">Portail Administration</span>
              <span className="text-[8px] font-bold uppercase text-gray-400">Accès sécurisé réservé au gérant</span>
            </div>
          </div>
          <ChevronRight size={18} className="text-brand-brown" />
        </button>
      </div>
    </div>
  );
};

export default SettingsView;
