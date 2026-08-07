import React, { useState } from 'react';
import { Sparkles, Bot, ArrowRight, Flame, Heart, Utensils, Zap, RefreshCw } from 'lucide-react';
import { MenuItem } from '../types';
import { playSound } from '../utils/audio';

interface AIGourmandeWidgetProps {
  items: MenuItem[];
  onSelectItem: (item: MenuItem) => void;
}

export const AIGourmandeWidget: React.FC<AIGourmandeWidgetProps> = ({ items, onSelectItem }) => {
  const [craving, setCraving] = useState('');
  const [recommendation, setRecommendation] = useState<MenuItem | null>(null);
  const [reason, setReason] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const quickPrompts = [
    { label: '🔥 Épicé & Authentique', term: 'spicy' },
    { label: '👑 Festin Royal', term: 'royal' },
    { label: '⏱️ Prêt en 15mn', term: 'fast' },
    { label: '🥗 Léger & Équilibré', term: 'light' },
    { label: '📦 Box Familiale', term: 'family' },
  ];

  const handleGenerateRecommendation = (promptOverride?: string) => {
    playSound('pop');
    setIsAnalyzing(true);
    setRecommendation(null);

    const activeTerm = promptOverride || craving || 'default';

    setTimeout(() => {
      let filtered = [...items];
      let selectedReason = "Recommandé spécialement selon vos préférences culinaires du jour.";

      if (activeTerm.includes('spicy') || activeTerm.toLowerCase().includes('piment')) {
        filtered = items.filter(i => i.isSpicy || i.name.toLowerCase().includes('mafé') || i.name.toLowerCase().includes('chou'));
        selectedReason = "Parfait pour les amateurs de saveurs relevées et généreuses en piment du Sahel.";
      } else if (activeTerm.includes('royal') || activeTerm.toLowerCase().includes('festin')) {
        filtered = items.filter(i => i.price >= 5000 || i.isSpécialitéMaison);
        selectedReason = "Sélection prestige de Chef Khady pour un repas mémorable.";
      } else if (activeTerm.includes('fast') || activeTerm.toLowerCase().includes('rapide')) {
        filtered = items.filter(i => i.category === 'Plat du Jour' || i.category === 'Entrée');
        selectedReason = "Préparation ultra-rapide en cuisine pour une livraison express.";
      } else if (activeTerm.includes('family') || activeTerm.toLowerCase().includes('famille')) {
        filtered = items.filter(i => i.category === 'Box Sauce' || i.category === 'Box Repas' || i.category === 'Pack');
        selectedReason = "Format généreux conçu pour régaler toute la famille.";
      } else {
        // Random pick from menu
        filtered = items.filter(i => i.isPlatDuJour || i.rating >= 4.8);
      }

      const picked = filtered.length > 0 
        ? filtered[Math.floor(Math.random() * filtered.length)]
        : items[0];

      setRecommendation(picked);
      setReason(selectedReason);
      setIsAnalyzing(false);
      playSound('success');
    }, 800);
  };

  return (
    <div className="bg-[#1A0F0D] p-6 sm:p-8 rounded-[3.5rem] shadow-2xl border-2 border-brand-gold/30 text-white relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-brand-orange/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="flex items-center justify-between mb-6 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-brand-gold to-brand-orange rounded-2xl flex items-center justify-center text-brand-brown font-black shadow-lg">
            <Bot size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black uppercase italic text-brand-gold tracking-tight">Guide Gourmand Khady's</h3>
              <span className="text-[8px] bg-brand-orange/20 text-brand-orange px-2.5 py-0.5 rounded-full font-black uppercase border border-brand-orange/30 animate-pulse">
                Conseiller Chef
              </span>
            </div>
            <p className="text-[9px] text-gray-300 font-medium">Quel est votre désir ou budget du jour à Niamey ?</p>
          </div>
        </div>
      </div>

      {/* Quick Choice Buttons */}
      <div className="flex flex-wrap gap-2 mb-6 relative z-10">
        {quickPrompts.map((p, idx) => (
          <button
            key={idx}
            onClick={() => handleGenerateRecommendation(p.term)}
            className="text-[9px] font-black uppercase italic px-3 py-1.5 rounded-xl bg-white/5 hover:bg-brand-gold/20 hover:text-brand-gold border border-white/10 text-white/80 transition-all active:scale-95"
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Input Prompt Box */}
      <div className="flex gap-2 mb-6 relative z-10">
        <input
          type="text"
          placeholder="Ex: Je veux une sauce onctueuse pour 4 personnes..."
          value={craving}
          onChange={(e) => setCraving(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleGenerateRecommendation()}
          className="flex-1 p-4 bg-white/5 border border-white/10 rounded-2xl text-xs font-bold text-white placeholder-white/30 outline-none focus:border-brand-gold"
        />
        <button
          onClick={() => handleGenerateRecommendation()}
          disabled={isAnalyzing}
          className="px-6 bg-brand-gold text-brand-brown font-black rounded-2xl text-xs uppercase italic shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-1 shrink-0"
        >
          {isAnalyzing ? <RefreshCw size={18} className="animate-spin" /> : <Sparkles size={18} />}
        </button>
      </div>

      {/* AI Recommendation Result */}
      {recommendation && (
        <div className="bg-white/10 border border-brand-gold/40 p-5 rounded-3xl animate-slide-up flex flex-col sm:flex-row items-center gap-5 relative z-10">
          <img
            src={recommendation.image}
            alt={recommendation.name}
            className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover border-2 border-brand-gold shadow-lg shrink-0"
          />
          <div className="flex-1 text-center sm:text-left space-y-2">
            <span className="text-[8px] font-black uppercase px-2.5 py-0.5 rounded-full bg-brand-gold text-brand-brown inline-block">
              Suggestion Privilège du Chef
            </span>
            <h4 className="text-base font-black italic uppercase text-white tracking-tight">{recommendation.name}</h4>
            <p className="text-[10px] text-gray-300 font-medium italic leading-relaxed">{reason}</p>
            <div className="flex items-center justify-center sm:justify-between pt-2">
              <span className="text-sm font-black text-brand-gold">{recommendation.price} F</span>
              <button
                onClick={() => { playSound('pop'); onSelectItem(recommendation); }}
                className="px-4 py-2 bg-brand-orange text-white text-[9px] font-black uppercase italic rounded-xl shadow-md active:scale-95 transition-all flex items-center gap-1.5"
              >
                Commander ce plat <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
