import React, { useState } from 'react';
import { Star, Smile, Frown, Meh, Heart, Award, Send, X, CheckCircle2, MessageSquare } from 'lucide-react';
import { playSound } from '../utils/audio';

interface SatisfactionSurveyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCompleteSurvey: (pointsAwarded: number) => void;
}

export const SatisfactionSurveyModal: React.FC<SatisfactionSurveyModalProps> = ({
  isOpen,
  onClose,
  onCompleteSurvey
}) => {
  const [overallEmoji, setOverallEmoji] = useState<number>(5); // 1 to 5
  const [foodRating, setFoodRating] = useState<number>(5);
  const [deliveryRating, setDeliveryRating] = useState<number>(5);
  const [serviceRating, setServiceRating] = useState<number>(5);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const emojis = [
    { value: 1, label: 'Déçu', icon: '😡', color: 'text-red-500' },
    { value: 2, label: 'Moyen', icon: '😐', color: 'text-orange-500' },
    { value: 3, label: 'Bien', icon: '🙂', color: 'text-yellow-500' },
    { value: 4, label: 'Très Bien', icon: '😊', color: 'text-emerald-500' },
    { value: 5, label: 'Excellent !', icon: '🤩', color: 'text-brand-gold' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    playSound('success');
    setSubmitted(true);
    setTimeout(() => {
      onCompleteSurvey(50);
      setSubmitted(false);
      onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-white text-brand-brown w-full max-w-lg rounded-[3.5rem] p-8 shadow-2xl border-4 border-brand-orange/20 relative overflow-hidden">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 w-9 h-9 bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-full flex items-center justify-center transition-all"
        >
          <X size={18} />
        </button>

        {submitted ? (
          <div className="text-center py-10 animate-scale-in">
            <div className="w-20 h-20 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl border-4 border-white animate-bounce">
              <Award size={40} />
            </div>
            <h3 className="text-2xl font-black italic uppercase text-brand-brown mb-2">Merci pour votre avis !</h3>
            <p className="text-xs font-bold text-gray-500 mb-4">
              Votre retour aide Khady's Food à maintenir l'excellence culinaire à Niamey.
            </p>
            <div className="bg-brand-brown text-brand-gold p-4 rounded-2xl font-black uppercase text-xs inline-flex items-center gap-2 shadow-lg">
              <Award size={18} /> +50 Points Fidélité Ajoutés !
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="text-center">
              <span className="bg-brand-orange/10 text-brand-orange px-3.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest inline-block mb-2">
                Sondage de Satisfaction 👑
              </span>
              <h3 className="text-2xl font-black italic uppercase text-brand-brown leading-tight">
                Votre Avis Compte !
              </h3>
              <p className="text-[10px] text-gray-400 font-bold mt-1">
                Gagnez <span className="text-brand-orange font-black">+50 points fidélité</span> en donnant votre avis en 30s.
              </p>
            </div>

            {/* Overall Emoji Picker */}
            <div className="bg-gray-50 p-4 rounded-3xl text-center">
              <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 block mb-3">
                Satisfaction globale de votre repas :
              </label>
              <div className="flex justify-around items-center">
                {emojis.map((e) => (
                  <button
                    key={e.value}
                    type="button"
                    onClick={() => { playSound('pop'); setOverallEmoji(e.value); }}
                    className={`flex flex-col items-center p-2 rounded-2xl transition-all duration-300 ${
                      overallEmoji === e.value 
                        ? 'bg-white shadow-xl scale-125 border-2 border-brand-orange' 
                        : 'opacity-40 hover:opacity-100'
                    }`}
                  >
                    <span className="text-2xl mb-1">{e.icon}</span>
                    <span className="text-[7px] font-black uppercase tracking-tight">{e.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Multi-criteria Stars */}
            <div className="space-y-3 bg-gray-50 p-4 rounded-3xl">
              {[
                { label: 'Goût & Qualité des Plats 🥘', state: foodRating, setter: setFoodRating },
                { label: 'Rapidité de Livraison Billo 🏍️', state: deliveryRating, setter: setDeliveryRating },
                { label: 'Accueil & Service Client 🤝', state: serviceRating, setter: setServiceRating }
              ].map((criterion, idx) => (
                <div key={idx} className="flex justify-between items-center text-[10px] font-black uppercase">
                  <span className="text-gray-600">{criterion.label}</span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => { playSound('pop'); criterion.setter(star); }}
                        className="text-amber-400 hover:scale-125 transition-transform"
                      >
                        <Star 
                          size={18} 
                          fill={star <= criterion.state ? '#FFD700' : 'transparent'} 
                          stroke="#FFD700" 
                        />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Comment Area */}
            <div>
              <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 block mb-1">
                Remarques ou Suggestions (Optionnel) :
              </label>
              <textarea
                rows={2}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Ex: Le riz au gras était excellent, livraison très rapide !"
                className="w-full p-3 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-bold text-brand-brown outline-none focus:border-brand-orange/30 transition-all resize-none"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-brand-brown text-brand-gold py-4 rounded-2xl font-black uppercase italic shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-all text-xs tracking-widest"
            >
              <Send size={16} /> Envoyer & Obtenir +50 Points
            </button>
          </form>
        )}

      </div>
    </div>
  );
};
