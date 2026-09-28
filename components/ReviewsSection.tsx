import React, { useState } from 'react';
import { Review } from '../types';
import { Star, MessageCircle, UserCheck, Plus, CheckCircle2, Sparkles } from 'lucide-react';
import { playSound } from '../utils/audio';

interface ReviewsSectionProps {
  reviews: Review[];
  onAddReview?: (review: Review) => void;
}

const ReviewsSection: React.FC<ReviewsSectionProps> = ({ reviews, onAddReview }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [authorName, setAuthorName] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const avgRating = reviews.length > 0
    ? (reviews.reduce((acc, r) => acc + (r.rating || 5), 0) / reviews.length).toFixed(1)
    : '4.9';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!authorName.trim() || !comment.trim()) return;
    playSound('cash');
    const newReview: Review = {
      id: `rev-${Date.now()}`,
      name: authorName.trim(),
      rating,
      comment: comment.trim(),
      image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200'
    };
    onAddReview?.(newReview);
    setAuthorName('');
    setComment('');
    setRating(5);
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setIsFormOpen(false);
    }, 2200);
  };

  return (
    <section className="mt-12 overflow-hidden pb-10 w-full min-w-0">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 px-1">
        <div className="flex items-center gap-3">
          <div className="bg-brand-brown/10 p-2.5 rounded-2xl text-brand-brown shrink-0">
            <MessageCircle size={20} fill="currentColor" />
          </div>
          <div>
            <h4 className="text-sm font-black uppercase italic text-brand-brown tracking-widest leading-none">
              Avis de nos <span className="text-brand-orange">Gourmets</span>
            </h4>
            <p className="text-[10px] text-gray-500 font-bold mt-1">
              Note moyenne : <strong className="text-brand-brown">{avgRating}/5</strong> ({reviews.length} avis vérifiés)
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            playSound('pop');
            setIsFormOpen(!isFormOpen);
          }}
          className="px-4 py-2.5 rounded-full bg-gradient-to-r from-brand-orange to-amber-500 text-white font-black text-[10px] uppercase tracking-wider shadow-lg flex items-center gap-1.5 active:scale-95 transition-all shrink-0"
        >
          <Plus size={14} />
          <span>{isFormOpen ? 'Fermer' : 'Laisser un avis'}</span>
        </button>
      </div>

      {isFormOpen && (
        <form
          onSubmit={handleSubmit}
          className="mb-8 rounded-3xl bg-[#1A0F0D] text-white border-2 border-brand-gold/40 p-5 sm:p-6 space-y-4 shadow-2xl animate-fade-in"
        >
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h5 className="text-xs sm:text-sm font-black uppercase italic text-brand-gold flex items-center gap-2">
              <Sparkles size={14} className="text-brand-orange" /> Partagez votre expérience culinaire
            </h5>
            <span className="text-[9px] text-white/60 font-bold uppercase">Publication directe</span>
          </div>

          {submitted && (
            <div className="p-3 rounded-2xl bg-emerald-950/90 border border-emerald-500/60 text-emerald-300 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
              <span>Merci pour votre avis gourmand ! Il est maintenant publié.</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="text-[9px] font-black uppercase tracking-wider text-white/70 block mb-1">
                Votre Nom ou Pseudo *
              </label>
              <input
                type="text"
                required
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="Ex: Moussa K., Aïchatou..."
                className="w-full bg-white/10 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-white/30 outline-none focus:border-brand-gold"
              />
            </div>

            <div>
              <label className="text-[9px] font-black uppercase tracking-wider text-white/70 block mb-1">
                Votre Note ({rating}/5)
              </label>
              <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-xl px-3.5 py-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-0.5 transition-transform active:scale-90"
                  >
                    <Star
                      size={18}
                      fill={star <= rating ? '#FFD700' : 'none'}
                      className={star <= rating ? 'text-brand-gold' : 'text-white/30'}
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="text-[9px] font-black uppercase tracking-wider text-white/70 block mb-1">
              Votre Commentaire *
            </label>
            <textarea
              required
              rows={2}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Qu'avez-vous pensé de nos plats, sauces ou de la livraison ?"
              className="w-full bg-white/10 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-white/30 outline-none focus:border-brand-gold"
            />
          </div>

          <button
            type="submit"
            className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-brand-orange hover:bg-amber-500 text-white font-black text-[10px] uppercase tracking-wider shadow-lg active:scale-95 transition-all"
          >
            Publier mon avis gourmand
          </button>
        </form>
      )}

      <div className="space-y-5">
        {reviews.map((review, idx) => (
          <div key={review.id || idx} className="bg-white rounded-[2.2rem] sm:rounded-[2.5rem] p-5 sm:p-8 shadow-xl border border-gray-50 relative animate-fade-in">
            <div className="flex items-center gap-3.5 sm:gap-4 mb-4 sm:mb-6">
              <img src={review.image || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200'} className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl object-cover shadow-md shrink-0" alt={review.name} />
              <div className="min-w-0">
                <h5 className="font-black text-xs uppercase text-brand-brown italic leading-none mb-2 truncate">{review.name}</h5>
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={11} fill={i < review.rating ? "#FFD700" : "none"} className={i < review.rating ? "text-brand-gold" : "text-gray-200"} />
                  ))}
                </div>
              </div>
              <span className="ml-auto text-[8px] font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full uppercase italic shrink-0 border border-emerald-100">Vérifié ✓</span>
            </div>

            <p className="text-xs text-gray-600 italic leading-relaxed mb-4 font-medium">
              "{review.comment}"
            </p>

            {review.adminReply && (
              <div className="bg-[#FAF3E0] p-4 sm:p-5 rounded-[1.8rem] border-2 border-white shadow-md relative mt-4">
                <div className=" -top-3 left-5 bg-brand-orange text-white text-[8px] font-black px-3 py-1 rounded-full uppercase italic shadow-sm border border-white inline-flex items-center gap-1.5 mb-1.5">
                  <UserCheck size={10} /> Réponse de Khady
                </div>
                <p className="text-[10px] text-brand-brown font-bold leading-relaxed italic">
                  "{review.adminReply}"
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
};

export default ReviewsSection;