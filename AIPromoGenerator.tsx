import React, { useState } from 'react';
import { Sparkles, Bot, Copy, Check, MessageCircle, Share2, RefreshCw, Send, Zap, Award } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { playSound } from '../utils/audio';
import { SOCIAL_LINKS } from './ShareModal';

interface AIPromoGeneratorProps {
  onShowToast?: (msg: string) => void;
}

export const AIPromoGenerator: React.FC<AIPromoGeneratorProps> = ({ onShowToast }) => {
  const [selectedTheme, setSelectedTheme] = useState('OFFRE_FLASH');
  const [discountPercent, setDiscountPercent] = useState('15%');
  const [targetDish, setTargetDish] = useState('Box Sauce Mafé & Tieb');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const [generatedPromos, setGeneratedPromos] = useState<Array<{ title: string; text: string; code?: string }>>([
    {
      title: "🔥 OFFRE FLASH DU VENDREDI",
      text: "🥘 *KHADY'S FOOD & EVENT NIAMEY* 🥘\n\nCommandez la fameuse Box Sauce Mafé Poulet avec -15% de réduction aujourd'hui !\n\n🎁 Code Promo: *KHADY15*\n🛵 Livraison express à Niamey en moins de 30mn.\n\n👉 Commandez en 1 clic sur l'application: https://khadys-food.app",
      code: "KHADY15"
    },
    {
      title: "👑 OFFRE VIP CLIENTS FIDÈLES",
      text: "✨ *LE FESTIN DES ROIS EN PROMO* ✨\n\nChers gourmets, profitez d'une boisson naturelle artisanale offerte pour tout plat africain commandé ce weekend !\n\n👉 Profitez de l'offre sur Khady's Food: https://khadys-food.app",
      code: "KHADYGIFT"
    }
  ]);

  const handleGenerate = async () => {
    setIsLoading(true);
    playSound('pop');

    try {
      const apiKey = process.env.API_KEY || (import.meta as any).env?.VITE_GEMINI_API_KEY;
      if (apiKey) {
        const ai = new GoogleGenAI({ apiKey });
        const prompt = `Tu es l'Assistante IA Marketing de Khady's Food & Event à Niamey (Niger).
Génère 2 propositions de messages promotionnels percutants et irrésistibles pour WhatsApp et réseaux sociaux (Facebook, Instagram, TikTok).
Thème choisi : ${selectedTheme}
Réduction / Avantage : ${discountPercent}
Plat concerné : ${targetDish}

Consignes :
- Utilise des émojis gourmands (🥘, 🔥, 👑, 🛵, ✨).
- Inclus un code promo original.
- Inclus le lien de l'app : https://khadys-food.app
- Reste chaleureux, professionnel et vendeur (ton sahélo-africain premium).

Format d'output souhaité : Uniquement du JSON valide avec le format :
[
  { "title": "...", "text": "...", "code": "..." },
  { "title": "...", "text": "...", "code": "..." }
]`;

        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: prompt
        });

        const rawText = response.text || '';
        // Extrait le JSON
        const jsonMatch = rawText.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setGeneratedPromos(parsed);
            playSound('success');
            if (onShowToast) onShowToast("Nouvelles promotions IA générées avec succès ! ✨");
            setIsLoading(false);
            return;
          }
        }
      }
    } catch (e) {
      console.warn("Utilisation du fallback IA local:", e);
    }

    // Fallback si pas de clé API ou erreur
    setTimeout(() => {
      const fallbackPromos = [
        {
          title: `🔥 PROMO IA : ${targetDish.toUpperCase()}`,
          text: `🥘 *SPECIALE GOURMANDE KHADY'S FOOD* 🥘\n\nProfitez de -${discountPercent} sur votre commande de ${targetDish} !\n\n🎁 Code Promo Exclusif: *KHADY${discountPercent.replace('%', '')}*\n🛵 Livré chaud à votre porte à Niamey.\n\n👉 Commandez direct: https://khadys-food.app`,
          code: `KHADY${discountPercent.replace('%', '')}`
        },
        {
          title: "💍 PROMO PACK BUFFET EVENT",
          text: "✨ *KHADY'S EVENT & CATERING* ✨\n\nVous préparez un baptême, mariage ou réunion d'entreprise ?\nBénéficiez de la livraison gratuite et du pack boisson offert pour toute réservation ce mois-ci !\n\n👉 Réservez sur Khady's Food: https://khadys-food.app",
          code: "EVENTBUFFET"
        }
      ];
      setGeneratedPromos(fallbackPromos);
      playSound('success');
      if (onShowToast) onShowToast("Nouvelles promotions créées par l'Assistante Khady !");
      setIsLoading(false);
    }, 800);
  };

  const handleCopyText = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    playSound('success');
    if (onShowToast) onShowToast("Texte promotionnel copié !");
    setTimeout(() => setCopiedIndex(null), 2500);
  };

  const handleShareWhatsApp = (text: string) => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleShareFacebook = (text: string) => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent('https://khadys-food.app')}&quote=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="bg-gradient-to-br from-[#1A0F0D] via-[#2D1610] to-[#1A0F0D] p-6 sm:p-8 rounded-[3rem] border-2 border-brand-gold/30 text-white shadow-2xl relative overflow-hidden">
      {/* Glow Effect */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-brand-orange/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Title */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-brand-gold/20 text-brand-gold rounded-2xl border border-brand-gold/40 shadow-xl">
            <Bot size={28} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse"></span>
              <h3 className="text-xl font-black italic uppercase text-brand-gold tracking-tight">
                Assistante IA Ventes & Promotions
              </h3>
            </div>
            <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest mt-1">
              Générez des offres percutantes pour booster le chiffre d'affaires
            </p>
          </div>
        </div>
      </div>

      {/* Control Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 bg-white/5 p-5 rounded-3xl border border-white/10">
        <div>
          <label className="text-[9px] font-black uppercase text-brand-gold tracking-widest block mb-2">
            Thème de la Campagne
          </label>
          <select 
            value={selectedTheme}
            onChange={(e) => setSelectedTheme(e.target.value)}
            className="w-full bg-[#1A0F0D] border border-white/20 rounded-xl p-3 text-xs font-bold text-white outline-none focus:border-brand-gold"
          >
            <option value="OFFRE_FLASH">⚡ Offre Flash Express</option>
            <option value="FIDELITE">👑 Promo Fidélité VIP</option>
            <option value="WEEKEND">🎉 Festin du Weekend</option>
            <option value="EVENT">💍 Pack Buffet & Mariage</option>
          </select>
        </div>

        <div>
          <label className="text-[9px] font-black uppercase text-brand-gold tracking-widest block mb-2">
            Réduction / Avantage
          </label>
          <select 
            value={discountPercent}
            onChange={(e) => setDiscountPercent(e.target.value)}
            className="w-full bg-[#1A0F0D] border border-white/20 rounded-xl p-3 text-xs font-bold text-white outline-none focus:border-brand-gold"
          >
            <option value="10%">-10% de réduction</option>
            <option value="15%">-15% de réduction</option>
            <option value="20%">-20% de réduction</option>
            <option value="Livraison Offerte">Livraison Offerte</option>
            <option value="Boisson Offerte">Boisson Artisanale Offerte</option>
          </select>
        </div>

        <div>
          <label className="text-[9px] font-black uppercase text-brand-gold tracking-widest block mb-2">
            Plat ou Service Cible
          </label>
          <input 
            type="text" 
            value={targetDish}
            onChange={(e) => setTargetDish(e.target.value)}
            placeholder="Ex: Box Sauce Mafé, Tieb..."
            className="w-full bg-[#1A0F0D] border border-white/20 rounded-xl p-3 text-xs font-bold text-white outline-none focus:border-brand-gold"
          />
        </div>
      </div>

      {/* Action Button */}
      <button 
        onClick={handleGenerate}
        disabled={isLoading}
        className="w-full bg-gradient-to-r from-brand-orange to-amber-500 text-white py-4 rounded-2xl font-black text-xs uppercase italic tracking-wider shadow-xl hover:brightness-110 active:scale-98 transition-all flex items-center justify-center gap-3 mb-8"
      >
        {isLoading ? (
          <>
            <RefreshCw size={18} className="animate-spin" /> L'Assistante IA rédige vos offres...
          </>
        ) : (
          <>
            <Zap size={18} /> Générer de nouvelles Promos Vendeuses <Sparkles size={16} />
          </>
        )}
      </button>

      {/* Generated Results List */}
      <div className="space-y-4">
        <h4 className="text-xs font-black uppercase text-white/50 tracking-widest flex items-center gap-2">
          <Award size={14} className="text-brand-gold" /> Propositions prêtes à diffuser :
        </h4>

        {generatedPromos.map((promo, idx) => (
          <div key={idx} className="bg-white/10 p-5 rounded-3xl border border-white/10 hover:border-brand-gold/40 transition-all">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-black text-brand-gold uppercase italic">{promo.title}</span>
              {promo.code && (
                <span className="bg-brand-orange text-white text-[9px] font-black px-2.5 py-1 rounded-full uppercase">
                  Code : {promo.code}
                </span>
              )}
            </div>

            <p className="text-xs font-mono text-white/90 whitespace-pre-wrap leading-relaxed bg-black/40 p-4 rounded-2xl border border-white/5 mb-4">
              {promo.text}
            </p>

            <div className="flex flex-wrap items-center justify-end gap-2">
              <button 
                onClick={() => handleCopyText(promo.text, idx)}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-[10px] font-black uppercase flex items-center gap-1.5 transition-all active:scale-95"
              >
                {copiedIndex === idx ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                {copiedIndex === idx ? 'Copié !' : 'Copier'}
              </button>

              <button 
                onClick={() => handleShareWhatsApp(promo.text)}
                className="px-4 py-2 bg-[#25D366] text-white rounded-xl text-[10px] font-black uppercase flex items-center gap-1.5 transition-all shadow-md active:scale-95"
              >
                <MessageCircle size={14} fill="white" /> WhatsApp
              </button>

              <button 
                onClick={() => handleShareFacebook(promo.text)}
                className="px-4 py-2 bg-[#1877F2] text-white rounded-xl text-[10px] font-black uppercase flex items-center gap-1.5 transition-all shadow-md active:scale-95"
              >
                <Share2 size={14} /> Facebook
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
