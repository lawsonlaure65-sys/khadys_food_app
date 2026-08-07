import React, { useState } from 'react';
import { 
  Bot, Smartphone, Zap, CheckCircle2, Copy, Send, RefreshCw, 
  Settings, Power, Sparkles, MessageSquare, ShieldCheck, DollarSign,
  Radio, ArrowRight, Layers, HelpCircle, PhoneOff, Code, Check
} from 'lucide-react';
import { RESTAURANT_INFO, MENU_ITEMS, BILLO_INFO, PAYMENT_ACCOUNTS } from '../constants';
import { getSmartResponse } from '../services/geminiService';
import { playSound } from '../utils/audio';

interface SimMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  time: string;
  isOrderSummary?: boolean;
  orderDetails?: {
    items: string;
    total: number;
    deliveryFee: number;
    paymentLink: string;
  };
}

export const WhatsAppAutomationView: React.FC = () => {
  const [isBotActive, setIsBotActive] = useState(true);
  const [activeTab, setActiveTab] = useState<'SIMULATOR' | 'CONFIG' | 'LOGS' | 'SETUP_GUIDE'>('SIMULATOR');
  
  // States pour le simulateur WhatsApp
  const [inputMsg, setInputMsg] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Paramètres de configuration Webhook & Mobile Money
  const [webhookUrl] = useState('https://khadys-food.app/api/whatsapp-webhook');
  const [verifyToken] = useState('KHADY_FOOD_CLOUD_AUTOMATION_2026');
  const [mynitaNumber, setMynitaNumber] = useState(PAYMENT_ACCOUNTS.mynitaAmana.number);
  const [allIzaNumber, setAllIzaNumber] = useState(PAYMENT_ACCOUNTS.allIza.number);
  const [airtelNumber, setAirtelNumber] = useState(PAYMENT_ACCOUNTS.airtelMoney.number);
  const [floozNumber, setFloozNumber] = useState(PAYMENT_ACCOUNTS.moovFlooz.number);

  const [simMessages, setSimMessages] = useState<SimMessage[]>([
    {
      id: '1',
      sender: 'user',
      text: 'Salam ! Je veux commander un Tiep Poulet et 2 Bissap pour livraison à Yantala.',
      time: '14:32'
    },
    {
      id: '2',
      sender: 'bot',
      text: 'Barka ! 🥘 Assistant Khady en ligne (Restaurant 100% Numérique Cloud 24h/24). Votre commande est identifiée :',
      time: '14:32',
      isOrderSummary: true,
      orderDetails: {
        items: '1x Tiep Poulet (3 500 F) + 2x Bissap (1 000 F)',
        total: 4500,
        deliveryFee: 1000,
        paymentLink: `Dépôt Mynita/Amanata: ${mynitaNumber} ou All-Iza: ${allIzaNumber}`
      }
    }
  ]);

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    playSound('pop');
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSendSimMessage = async (textToSend?: string) => {
    const text = textToSend || inputMsg;
    if (!text.trim()) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg: SimMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text,
      time: timeStr
    };

    setSimMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInputMsg('');
    setIsThinking(true);
    playSound('pop');

    try {
      const aiReply = await getSmartResponse(text);
      setIsThinking(false);

      // Analyse si le message ressemble à une commande
      const lower = text.toLowerCase();
      const isOrder = lower.includes('command') || lower.includes('tiep') || lower.includes('plat') || lower.includes('livr') || lower.includes('sauce');

      const botReply: SimMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: aiReply,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isOrderSummary: isOrder,
        orderDetails: isOrder ? {
          items: 'Commande enregistrée automatiquement',
          total: 4500,
          deliveryFee: 1000,
          paymentLink: `Airtel Money: *155# vers ${airtelNumber}`
        } : undefined
      };

      setSimMessages(prev => [...prev, botReply]);
      playSound('notification');
    } catch (e) {
      setIsThinking(false);
      setSimMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'bot',
          text: `Salam ! Khady IA a bien reçu votre message. Notre service de livraison Billo Express est à votre écoute au ${RESTAURANT_INFO.whatsapp}.`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-white pb-10">
      {/* Header Status Bar */}
      <div className="bg-gradient-to-r from-[#1A0F0D] via-[#2A1510] to-[#1A0F0D] p-6 sm:p-8 rounded-[3rem] border border-white/10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Bot size={180} className="text-brand-gold" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-brand-gold/20 text-brand-gold rounded-2xl border border-brand-gold/30">
                <Bot size={28} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-2xl font-black italic uppercase text-brand-gold tracking-tight">
                    WhatsApp Cloud 24/7
                  </h3>
                  <span className="bg-brand-orange/20 text-brand-orange border border-brand-orange/30 text-[8px] font-black uppercase px-3 py-1 rounded-full">
                    SaaS Start-up Gen-AI
                  </span>
                </div>
                <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest mt-0.5">
                  Vente automatique autonome • Téléphone éteint ou hors-ligne
                </p>
              </div>
            </div>
          </div>

          {/* Switch Bot Status */}
          <div className="flex items-center gap-4 bg-black/40 p-3 rounded-2xl border border-white/10 w-full md:w-auto justify-between md:justify-start">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${isBotActive ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
              <div>
                <p className="text-[9px] font-black uppercase tracking-wider text-white">
                  {isBotActive ? 'Robot Cloud Connecté' : 'Robot Cloud Désactivé'}
                </p>
                <p className="text-[8px] text-white/40 uppercase font-bold">
                  {isBotActive ? 'Serveur Gemini IA en veille active' : 'Relais vers WhatsApp manuel'}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setIsBotActive(!isBotActive);
                playSound('pop');
              }}
              className={`p-3 rounded-xl transition-all font-black text-[9px] uppercase italic flex items-center gap-2 ${
                isBotActive 
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                  : 'bg-red-500/20 text-red-400 border border-red-500/30'
              }`}
            >
              <Power size={14} />
              {isBotActive ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>

        {/* Badges d'architecture High-Tech */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8 pt-6 border-t border-white/10">
          <div className="bg-white/5 p-3 rounded-2xl border border-white/5 flex items-center gap-3">
            <PhoneOff size={18} className="text-brand-gold shrink-0" />
            <div>
              <p className="text-[8px] font-black uppercase text-white/40">Batterie / Téléphone</p>
              <p className="text-[10px] font-black text-white">100% Indépendant</p>
            </div>
          </div>
          <div className="bg-white/5 p-3 rounded-2xl border border-white/5 flex items-center gap-3">
            <Zap size={18} className="text-brand-orange shrink-0" />
            <div>
              <p className="text-[8px] font-black uppercase text-white/40">Temps de réponse</p>
              <p className="text-[10px] font-black text-white">&lt; 1.5 seconde</p>
            </div>
          </div>
          <div className="bg-white/5 p-3 rounded-2xl border border-white/5 flex items-center gap-3">
            <DollarSign size={18} className="text-green-400 shrink-0" />
            <div>
              <p className="text-[8px] font-black uppercase text-white/40">Paiement Mobile</p>
              <p className="text-[10px] font-black text-white">Airtel / Flooz Auto</p>
            </div>
          </div>
          <div className="bg-white/5 p-3 rounded-2xl border border-white/5 flex items-center gap-3">
            <Radio size={18} className="text-blue-400 shrink-0" />
            <div>
              <p className="text-[8px] font-black uppercase text-white/40">Livreurs Billo Express</p>
              <p className="text-[10px] font-black text-white">Dispatch Auto</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
        {[
          { id: 'SIMULATOR', label: 'Simulateur Vente Automatique', icon: MessageSquare },
          { id: 'CONFIG', label: 'API & Mobile Money', icon: Settings },
          { id: 'SETUP_GUIDE', label: 'Guide Activation 0$ (Meta)', icon: Code },
          { id: 'LOGS', label: 'Historique Ventes Cloud', icon: Layers },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id as any);
              playSound('pop');
            }}
            className={`px-6 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-wider italic flex items-center gap-2 whitespace-nowrap transition-all border ${
              activeTab === tab.id
                ? 'bg-brand-gold text-brand-brown border-brand-gold shadow-lg scale-105'
                : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10 hover:text-white'
            }`}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB CONTENT: SIMULATOR */}
      {activeTab === 'SIMULATOR' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Colonne de gauche: Simulateur WhatsApp UI */}
          <div className="lg:col-span-2 bg-[#0B141A] rounded-[2.5rem] border border-white/10 overflow-hidden shadow-2xl flex flex-col h-[580px]">
            {/* Header WhatsApp dark mode */}
            <div className="bg-[#202C33] px-6 py-4 flex items-center justify-between border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-brand-brown border border-brand-gold/40 flex items-center justify-center text-brand-gold font-black text-xs">
                    K
                  </div>
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#202C33]"></span>
                </div>
                <div>
                  <h4 className="text-xs font-black text-white tracking-wide">Khady Bot - Assistant Vente Cloud</h4>
                  <p className="text-[9px] text-green-400 font-bold uppercase tracking-wider">
                    En ligne 24h/24 • Réponse automatique
                  </p>
                </div>
              </div>
              <span className="bg-white/5 text-white/40 text-[8px] font-bold px-3 py-1 rounded-full uppercase">
                Simulateur Web
              </span>
            </div>

            {/* Chat Body */}
            <div className="flex-1 p-6 overflow-y-auto space-y-4 no-scrollbar bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:16px_16px]">
              <div className="text-center my-2">
                <span className="bg-[#182229] text-white/40 text-[8px] font-bold px-4 py-1 rounded-full uppercase tracking-wider">
                  Les messages sont traités par les serveurs Gemini Cloud en direct
                </span>
              </div>

              {simMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'} animate-fade-in`}
                >
                  <div
                    className={`max-w-[85%] sm:max-w-[75%] p-4 rounded-2xl text-xs ${
                      msg.sender === 'user'
                        ? 'bg-[#005C4B] text-white rounded-tr-none'
                        : 'bg-[#202C33] text-white/90 rounded-tl-none border border-white/5'
                    }`}
                  >
                    <p className="leading-relaxed font-medium">{msg.text}</p>

                    {/* Order summary block embedded if order detected */}
                    {msg.orderDetails && (
                      <div className="mt-3 p-3 bg-black/40 rounded-xl border border-brand-gold/20 space-y-2 text-[10px]">
                        <div className="flex justify-between items-center text-brand-gold font-black uppercase border-b border-white/10 pb-1">
                          <span>Aperçu Récapitulatif Auto</span>
                          <span className="text-green-400">Reçu Khady's</span>
                        </div>
                        <p className="text-white/80 font-bold">{msg.orderDetails.items}</p>
                        <div className="flex justify-between text-white/60">
                          <span>Livraison Billo Express:</span>
                          <span className="font-bold text-white">{msg.orderDetails.deliveryFee} F</span>
                        </div>
                        <div className="flex justify-between text-brand-gold font-black text-xs pt-1 border-t border-white/10">
                          <span>Total à régler:</span>
                          <span>{msg.orderDetails.total + msg.orderDetails.deliveryFee} F CFA</span>
                        </div>
                        <div className="bg-brand-orange/20 p-2 rounded-lg text-[9px] text-brand-orange font-mono font-bold mt-2 flex items-center justify-between">
                          <span>{msg.orderDetails.paymentLink}</span>
                          <button
                            onClick={() => handleCopy(msg.orderDetails!.paymentLink, 'pay')}
                            className="text-white underline font-sans text-[8px]"
                          >
                            Copier
                          </button>
                        </div>
                      </div>
                    )}

                    <span className="text-[8px] opacity-40 float-right mt-1 font-mono">
                      {msg.time} {msg.sender === 'user' && '✓✓'}
                    </span>
                  </div>
                </div>
              ))}

              {isThinking && (
                <div className="flex items-center gap-2 text-brand-gold bg-[#202C33] p-3 rounded-2xl w-fit animate-pulse text-xs">
                  <RefreshCw size={14} className="animate-spin" />
                  <span className="text-[10px] font-black uppercase">Khady IA prépare la réponse...</span>
                </div>
              )}
            </div>

            {/* Chat Input Bar */}
            <div className="p-4 bg-[#202C33] border-t border-white/5 flex gap-2 items-center">
              <input
                type="text"
                placeholder="Simuler un message client (ex: Je veux 2 Tiep Poulet à Yantala...)"
                value={inputMsg}
                onChange={(e) => setInputMsg(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendSimMessage()}
                className="flex-1 bg-[#2A3942] text-white text-xs px-5 py-3.5 rounded-xl border border-white/5 outline-none focus:border-brand-gold placeholder:text-white/30 font-medium"
              />
              <button
                onClick={() => handleSendSimMessage()}
                disabled={!inputMsg.trim() || isThinking}
                className="bg-[#00A884] text-white p-3.5 rounded-xl hover:bg-[#008f70] transition-all disabled:opacity-30"
              >
                <Send size={16} />
              </button>
            </div>
          </div>

          {/* Colonne de droite: Scénarios de tests rapides */}
          <div className="space-y-4">
            <div className="bg-white/5 p-6 rounded-[2.5rem] border border-white/5 space-y-4">
              <h4 className="text-xs font-black uppercase text-brand-gold italic flex items-center gap-2">
                <Sparkles size={16} /> Tester des Scénarios Clients
              </h4>
              <p className="text-[10px] text-white/50 leading-relaxed font-bold">
                Cliquez sur un exemple pour observer l'intelligence automatique du robot Cloud sans smartphone :
              </p>

              <div className="space-y-2">
                {[
                  "Salam, proposez-moi le plat du jour pour 3 personnes à Plateau.",
                  "Quels sont vos prix pour les Box Sauces ?",
                  "Puis-je avoir un devis traiteur pour un mariage de 100 invités ?",
                  "Comment payer par Airtel Money ?"
                ].map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendSimMessage(prompt)}
                    className="w-full text-left p-3.5 bg-black/30 hover:bg-white/10 rounded-2xl border border-white/5 text-[10px] font-bold text-white/80 transition-all flex justify-between items-center group"
                  >
                    <span className="line-clamp-2">"{prompt}"</span>
                    <ArrowRight size={12} className="text-brand-orange opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2" />
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-brand-brown/40 p-6 rounded-[2.5rem] border border-brand-gold/20 space-y-3">
              <h4 className="text-xs font-black uppercase text-brand-gold italic flex items-center gap-2">
                <ShieldCheck size={16} /> Pourquoi le téléphone peut être éteint ?
              </h4>
              <p className="text-[10px] text-white/70 leading-relaxed font-medium">
                Khady IA ne tourne <strong>pas sur votre téléphone portable</strong>. Elle réside sur un serveur Cloud dédié 24h/24. 
                Quand un client écrit sur WhatsApp, Meta envoie directement le message à notre serveur Cloud via Webhook. L'IA génère la réponse et l'envoie instantanément au client !
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: CONFIG & MOBILE MONEY */}
      {activeTab === 'CONFIG' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Webhook API Meta Config */}
          <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/10 space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-brand-orange/20 text-brand-orange rounded-xl">
                <Code size={20} />
              </div>
              <div>
                <h4 className="text-sm font-black uppercase text-brand-gold italic">Coordonnées Webhook Cloud</h4>
                <p className="text-[9px] text-white/40 font-bold uppercase">À coller dans Meta WhatsApp Business API</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase text-white/50 ml-2">URL du Webhook (Callback URL)</label>
                <div className="flex gap-2">
                  <input
                    readOnly
                    value={webhookUrl}
                    className="flex-1 p-4 bg-black/40 rounded-2xl text-xs font-mono text-green-400 border border-white/10 outline-none"
                  />
                  <button
                    onClick={() => handleCopy(webhookUrl, 'url')}
                    className="bg-white/10 hover:bg-white/20 px-4 rounded-2xl text-[10px] font-black uppercase flex items-center gap-1.5 transition-all"
                  >
                    {copiedField === 'url' ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                    {copiedField === 'url' ? 'Copié' : 'Copier'}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase text-white/50 ml-2">Jeton de Vérification (Verify Token)</label>
                <div className="flex gap-2">
                  <input
                    readOnly
                    value={verifyToken}
                    className="flex-1 p-4 bg-black/40 rounded-2xl text-xs font-mono text-brand-gold border border-white/10 outline-none"
                  />
                  <button
                    onClick={() => handleCopy(verifyToken, 'token')}
                    className="bg-white/10 hover:bg-white/20 px-4 rounded-2xl text-[10px] font-black uppercase flex items-center gap-1.5 transition-all"
                  >
                    {copiedField === 'token' ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                    {copiedField === 'token' ? 'Copié' : 'Copier'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Numéros Mobile Money pour génération auto de liens de paiement */}
          <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/10 space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-500/20 text-green-400 rounded-xl">
                <DollarSign size={20} />
              </div>
              <div>
                <h4 className="text-sm font-black uppercase text-brand-gold italic">Compte de Réception Mobile Money</h4>
                <p className="text-[9px] text-white/40 font-bold uppercase">Khady IA transmet ces numéros dans les factures</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase text-brand-gold ml-2">Mynita / Amanata (Dépôt direct)</label>
                <input
                  value={mynitaNumber}
                  onChange={(e) => setMynitaNumber(e.target.value)}
                  className="w-full p-4 bg-black/40 rounded-2xl text-xs font-bold text-white border border-brand-gold/30 outline-none focus:border-brand-gold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase text-brand-orange ml-2">All-Iza Niger</label>
                <input
                  value={allIzaNumber}
                  onChange={(e) => setAllIzaNumber(e.target.value)}
                  className="w-full p-4 bg-black/40 rounded-2xl text-xs font-bold text-white border border-brand-orange/30 outline-none focus:border-brand-gold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase text-red-400 ml-2">Airtel Money Niger</label>
                <input
                  value={airtelNumber}
                  onChange={(e) => setAirtelNumber(e.target.value)}
                  className="w-full p-4 bg-black/40 rounded-2xl text-xs font-bold text-white border border-white/10 outline-none focus:border-brand-gold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase text-blue-400 ml-2">Moov Money / Flooz Niger</label>
                <input
                  value={floozNumber}
                  onChange={(e) => setFloozNumber(e.target.value)}
                  className="w-full p-4 bg-black/40 rounded-2xl text-xs font-bold text-white border border-white/10 outline-none focus:border-brand-gold"
                />
              </div>

              <button
                onClick={() => playSound('success')}
                className="w-full bg-brand-gold text-brand-brown py-4 rounded-2xl text-[10px] font-black uppercase italic shadow-xl hover:scale-105 transition-all mt-2"
              >
                Sauvegarder les Numéros
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: SETUP GUIDE */}
      {activeTab === 'SETUP_GUIDE' && (
        <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/10 space-y-6">
          <h4 className="text-base font-black uppercase text-brand-gold italic flex items-center gap-2">
            <HelpCircle size={20} /> Guide d'Activation Meta WhatsApp Cloud API (100% Gratuit)
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
            <div className="bg-black/30 p-6 rounded-2xl border border-white/5 space-y-3">
              <div className="w-8 h-8 rounded-full bg-brand-orange text-white font-black flex items-center justify-center text-sm">1</div>
              <h5 className="font-black text-white uppercase text-[11px]">Créer un Compte Meta Developer</h5>
              <p className="text-white/60 text-[10px] leading-relaxed">
                Rendez-vous sur <strong>developers.facebook.com</strong> et créez un compte gratuit. Créez une application type "Business".
              </p>
            </div>

            <div className="bg-black/30 p-6 rounded-2xl border border-white/5 space-y-3">
              <div className="w-8 h-8 rounded-full bg-brand-orange text-white font-black flex items-center justify-center text-sm">2</div>
              <h5 className="font-black text-white uppercase text-[11px]">Ajouter le Produit WhatsApp</h5>
              <p className="text-white/60 text-[10px] leading-relaxed">
                Sélectionnez "WhatsApp" dans la liste des produits. Meta vous attribue un numéro de test ou associe votre numéro professionnel Niamey (+227).
              </p>
            </div>

            <div className="bg-black/30 p-6 rounded-2xl border border-white/5 space-y-3">
              <div className="w-8 h-8 rounded-full bg-brand-orange text-white font-black flex items-center justify-center text-sm">3</div>
              <h5 className="font-black text-white uppercase text-[11px]">Configurer le Webhook Cloud</h5>
              <p className="text-white/60 text-[10px] leading-relaxed">
                Dans la rubrique Webhook de Meta, collez l'URL Webhook et le Verify Token fournis dans l'onglet "API & Mobile Money". Cochez l'événement <strong>messages</strong>.
              </p>
            </div>
          </div>

          <div className="p-6 bg-green-500/10 border border-green-500/20 rounded-2xl flex items-center gap-4">
            <CheckCircle2 size={32} className="text-green-400 shrink-0" />
            <div>
              <h5 className="font-black text-green-400 uppercase text-xs">Félicitations ! C'est tout.</h5>
              <p className="text-[10px] text-white/80 font-medium">
                À partir de ce moment, votre restaurant vend automatiquement sur WhatsApp 24h/24, 7j/7, sans aucune interruption même si votre téléphone s'éteint !
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: LOGS */}
      {activeTab === 'LOGS' && (
        <div className="bg-white/5 rounded-[2.5rem] border border-white/10 overflow-hidden">
          <div className="p-6 border-b border-white/10 flex justify-between items-center">
            <h4 className="text-xs font-black uppercase text-brand-gold italic">Ventes Capturées par le Robot Cloud</h4>
            <span className="text-[9px] bg-green-500/20 text-green-400 border border-green-500/30 font-black px-3 py-1 rounded-full uppercase">
              100% Autonome
            </span>
          </div>

          <table className="w-full text-left">
            <thead className="bg-black/30 text-[8px] font-black uppercase tracking-[0.2em] text-white/40">
              <tr>
                <th className="p-5">Heure</th>
                <th className="p-5">Client WhatsApp</th>
                <th className="p-5">Commande Traitée</th>
                <th className="p-5">Montant</th>
                <th className="p-5">Statut IA</th>
              </tr>
            </thead>
            <tbody className="text-[10px] font-bold divide-y divide-white/5">
              {[
                { time: '14:32', phone: '+227 90 ** ** 12', item: '1x Tiep Poulet + 2x Bissap', total: '5 500 F', status: 'Facture Envoyée' },
                { time: '12:15', phone: '+227 96 ** ** 88', item: '2x Dégué + 1x Box Sauce Tiguadèguè', total: '7 000 F', status: 'Paiement Confirmé' },
                { time: '10:04', phone: '+227 80 ** ** 45', item: 'Devis Mariage (150 pers)', total: 'Sur devis', status: 'Transmis au Traiteur' }
              ].map((row, i) => (
                <tr key={i} className="hover:bg-white/[0.02]">
                  <td className="p-5 opacity-50 font-mono">{row.time}</td>
                  <td className="p-5 text-brand-gold">{row.phone}</td>
                  <td className="p-5 text-white/80">{row.item}</td>
                  <td className="p-5 text-brand-orange">{row.total}</td>
                  <td className="p-5">
                    <span className="bg-white/10 text-white px-3 py-1 rounded-full text-[8px] font-black uppercase">
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
