import React, { useState } from 'react';
import { HelpCircle, ChevronDown, Sparkles, MessageCircle, PhoneCall, ShieldCheck, Truck, CreditCard, Smartphone } from 'lucide-react';
import { playSound } from '../utils/audio';

interface FAQItem {
  question: string;
  answer: string;
  category: 'commande' | 'livraison' | 'paiement' | 'pwa';
  icon: any;
}

export const FAQSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [selectedCategory, setSelectedCategory] = useState<string>('tout');

  const faqs: FAQItem[] = [
    {
      question: "Comment installer l'application sur mon téléphone ?",
      answer: "Sur Android (Chrome) : cliquez sur le bouton 'Télécharger' en haut de l'écran ou ouvrez le menu 3 points de Chrome puis choisissez 'Installer l'application' ou 'Ajouter à l'écran d'accueil'. Sur iPhone (Safari) : touchez l'icône Partager (carré avec flèche) puis 'Sur l'écran d'accueil'.",
      category: 'pwa',
      icon: Smartphone
    },
    {
      question: "Comment passer une commande sur Khady's Food ?",
      answer: "Parcourez 'La Carte' ou les catégories (Plats Africains, Grillades, Spécialités), cliquez sur le plat de votre choix, personnalisez les options puis ajoutez au Panier. Cliquez enfin sur 'Valider la commande' et choisissez votre mode de paiement.",
      category: 'commande',
      icon: HelpCircle
    },
    {
      question: "Quels sont les quartiers desservis et les délais de livraison à Niamey ?",
      answer: "Nos livreurs partenaires vous livrent dans tous les quartiers de Niamey (Plateau, Harobanda, Niamey 2000, Koubia, Talladjé, Cité Caisse, Garba, etc.). Le délai moyen de livraison est de 25 à 45 minutes selon l'affluence.",
      category: 'livraison',
      icon: Truck
    },
    {
      question: "Quels sont les modes de paiement acceptés ?",
      answer: "Nous acceptons le paiement en Espèces à la livraison, ainsi que tous les services Mobile Money du Niger : Airtel Money, Flooz (Moov Africa), Zamani Cash. Vous pouvez aussi payer en ligne en toute sécurité.",
      category: 'paiement',
      icon: CreditCard
    },
    {
      question: "Comment fonctionne le service Traiteur pour événements ?",
      answer: "Rendez-vous dans la rubrique 'Event & Devis' ou 'Buffet Pro', indiquez le nombre de convives et la date de votre événement (mariage, baptême, anniversaire, séminaire d'entreprise). Notre équipe vous enverra un devis sous 24h.",
      category: 'commande',
      icon: ShieldCheck
    },
    {
      question: "Puis-je utiliser l'application sans connexion Internet (Hors-Ligne) ?",
      answer: "Absolument ! Grâce à la technologie PWA, une fois l'application ouverte une première fois, vous pouvez consulter le menu, les prix et préparer vos sélections même sans connexion Internet active.",
      category: 'pwa',
      icon: Smartphone
    }
  ];

  const categories = [
    { id: 'tout', label: 'Toutes les questions' },
    { id: 'commande', label: 'Commandes' },
    { id: 'livraison', label: 'Livraison' },
    { id: 'paiement', label: 'Paiement' },
    { id: 'pwa', label: 'Application PWA' }
  ];

  const filteredFaqs = selectedCategory === 'tout' 
    ? faqs 
    : faqs.filter(f => f.category === selectedCategory);

  const toggleFAQ = (index: number) => {
    playSound('pop');
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="my-8 px-4 sm:px-6 w-full max-w-4xl mx-auto animate-fade-in">
      <div className="bg-white rounded-[2.5rem] p-6 sm:p-8 shadow-xl border border-brand-brown/5 relative overflow-hidden">
        {/* En-tête */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-brand-orange/10 text-brand-orange rounded-2xl shadow-sm">
              <HelpCircle size={24} />
            </div>
            <div>
              <span className="text-[9px] font-black uppercase tracking-widest text-brand-orange italic">
                Aide & Assistance
              </span>
              <h3 className="text-xl sm:text-2xl font-black italic uppercase text-brand-brown leading-tight">
                Foire Aux Questions <span className="text-brand-gold">(FAQ)</span>
              </h3>
            </div>
          </div>

          <a 
            href="https://wa.me/22774441621" 
            target="_blank" 
            rel="noopener noreferrer"
            onClick={() => playSound('pop')}
            className="self-start sm:self-auto bg-green-500 hover:bg-green-600 text-white px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase italic shadow-md flex items-center gap-2 active:scale-95 transition-all shrink-0"
          >
            <MessageCircle size={15} /> WhatsApp Direct
          </a>
        </div>

        {/* Filtres de catégories */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-6 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => { playSound('pop'); setSelectedCategory(cat.id); setOpenIndex(0); }}
              className={`px-3.5 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider whitespace-nowrap transition-all ${
                selectedCategory === cat.id
                  ? 'bg-brand-brown text-brand-gold shadow-md scale-105'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Liste Accordéon */}
        <div className="space-y-3">
          {filteredFaqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            const Icon = faq.icon;

            return (
              <div 
                key={idx}
                className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
                  isOpen 
                    ? 'bg-brand-brown/5 border-brand-orange/30 shadow-md' 
                    : 'bg-gray-50/70 border-gray-100 hover:border-brand-brown/10'
                }`}
              >
                <button
                  onClick={() => toggleFAQ(idx)}
                  className="w-full text-left p-4 sm:p-5 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl text-white shrink-0 ${isOpen ? 'bg-brand-orange shadow-sm' : 'bg-brand-brown/20 text-brand-brown'}`}>
                      <Icon size={16} />
                    </div>
                    <span className="text-xs sm:text-sm font-black uppercase text-brand-brown italic tracking-tight leading-snug">
                      {faq.question}
                    </span>
                  </div>
                  <ChevronDown 
                    size={18} 
                    className={`text-brand-orange shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {isOpen && (
                  <div className="px-4 pb-5 sm:px-5 sm:pb-5 pt-0 text-[11px] sm:text-xs font-medium text-gray-600 leading-relaxed animate-fade-in border-t border-brand-brown/5 mt-1 pt-3">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer d'aide */}
        <div className="mt-8 p-4 bg-gradient-to-r from-brand-brown to-[#2C1810] text-white rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
          <div className="flex items-center gap-3 text-center sm:text-left">
            <Sparkles size={22} className="text-brand-gold shrink-0 hidden sm:block" />
            <div>
              <span className="text-[10px] font-black uppercase text-brand-gold block italic">Vous avez une autre question ?</span>
              <span className="text-[9px] text-gray-300 font-bold block">Notre assistant IA et notre équipe sont à votre écoute.</span>
            </div>
          </div>
          <a
            href="tel:+22774441621"
            className="bg-brand-orange hover:bg-brand-gold hover:text-brand-brown text-white px-5 py-2.5 rounded-xl font-black text-[9px] uppercase italic shadow-md flex items-center gap-1.5 active:scale-95 transition-all shrink-0"
          >
            <PhoneCall size={14} /> Appeler le restaurant
          </a>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
