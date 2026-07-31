
import React from 'react';
import { ChevronLeft, ShoppingBag, Zap, Sparkles, Award, Bike, MessageCircle, Star } from 'lucide-react';
import { playSound } from '../utils/audio';

interface GuideViewProps {
  onClose: () => void;
}

const GuideView: React.FC<GuideViewProps> = ({ onClose }) => {
  const steps = [
    {
      icon: ShoppingBag,
      title: "Commander un Festin",
      desc: "Explorez 'La Carte', personnalisez vos plats et validez votre panier en un clic. Simple et rapide.",
      color: "bg-brand-orange"
    },
    {
      icon: Zap,
      title: "Khady IA à votre service",
      desc: "Besoin d'un conseil ? Cliquez sur la bulle orange. Notre IA vous suggère le meilleur accompagnement.",
      color: "bg-brand-brown"
    },
    {
      icon: Bike,
      title: "Livraison Billo Express",
      desc: "Suivez votre commande en temps réel. Nos livreurs Billo vous livrent partout à Niamey.",
      color: "bg-brand-orange"
    },
    {
      icon: Sparkles,
      title: "Service Traiteur",
      desc: "Un mariage ou un cocktail ? Remplissez le formulaire 'Event' pour un devis personnalisé sous 24h.",
      color: "bg-brand-brown"
    },
    {
      icon: Award,
      title: "Club Gold & Fidélité",
      desc: "Chaque commande vous rapporte des points. Cumulez-les pour débloquer des cadeaux et le rang Platinum.",
      color: "bg-brand-gold"
    }
  ];

  return (
    <div className="animate-fade-in p-6 pb-32">
      <header className="mb-10 flex items-center gap-4">
        <button onClick={() => { playSound('pop'); onClose(); }} className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center text-brand-brown">
           <ChevronLeft size={24} />
        </button>
        <h2 className="text-3xl font-black italic uppercase text-brand-brown leading-none">Guide <span className="text-brand-orange">Elite</span></h2>
      </header>

      <div className="space-y-6">
        <div className="bg-[#1A0F0D] p-10 rounded-[3.5rem] shadow-2xl border-4 border-white text-white relative overflow-hidden mb-10">
           <div className="absolute top-0 right-0 p-8 opacity-5 rotate-12"><Star size={100} /></div>
           <h3 className="text-brand-gold font-black uppercase italic text-lg tracking-tighter mb-4">Bienvenue chez Khady's</h3>
           <p className="text-xs text-white/60 font-medium leading-relaxed italic">
             "L'excellence de la gastronomie africaine n'a jamais été aussi accessible. Voici comment profiter pleinement de votre application."
           </p>
        </div>

        {steps.map((step, idx) => (
          <div key={idx} className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-50 flex gap-6 items-start animate-slide-up" style={{ animationDelay: `${idx * 0.1}s` }}>
            <div className={`w-14 h-14 ${step.color} rounded-2xl flex items-center justify-center text-white shadow-lg flex-shrink-0`}>
              <step.icon size={24} />
            </div>
            <div>
              <h4 className="font-black text-xs uppercase text-brand-brown italic mb-2 tracking-tight">{step.title}</h4>
              <p className="text-[10px] text-gray-400 font-bold leading-relaxed">{step.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 bg-brand-orange/10 p-8 rounded-[3rem] border border-brand-orange/20 text-center">
        <div className="inline-flex p-3 bg-brand-orange text-white rounded-2xl mb-4 shadow-lg">
          <MessageCircle size={20} />
        </div>
        <h4 className="text-xs font-black uppercase text-brand-brown mb-2">Besoin d'aide ?</h4>
        <p className="text-[10px] text-brand-brown/60 font-bold mb-6">Notre service client est disponible sur WhatsApp 24h/7j.</p>
        <a href="https://wa.me/22774441621" target="_blank" className="bg-brand-brown text-brand-gold px-8 py-4 rounded-2xl text-[10px] font-black uppercase italic shadow-xl inline-block">Contacter Khady</a>
      </div>
    </div>
  );
};

export default GuideView;
