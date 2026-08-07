import React from 'react';
import { Review } from '../types';
import { Star, MessageCircle, UserCheck } from 'lucide-react';

interface ReviewsSectionProps {
  reviews: Review[];
}

const ReviewsSection: React.FC<ReviewsSectionProps> = ({ reviews }) => {
  return (
    <section className="mt-16 overflow-hidden pb-10">
      <div className="flex items-center gap-3 mb-10 px-2">
        <div className="bg-brand-brown/10 p-2.5 rounded-2xl text-brand-brown">
          <MessageCircle size={22} fill="currentColor" />
        </div>
        <h4 className="text-sm font-black uppercase italic text-brand-brown tracking-widest leading-none">
          Avis de nos <span className="italic">Gourmets</span>
        </h4>
      </div>

      <div className="space-y-6">
        {reviews.map((review, idx) => (
          <div key={idx} className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-gray-50 relative animate-fade-in">
            <div className="flex items-center gap-4 mb-6">
              <img src={review.image} className="w-14 h-14 rounded-2xl object-cover shadow-md" alt={review.name} />
              <div>
                <h5 className="font-black text-[12px] uppercase text-brand-brown italic leading-none mb-2">{review.name}</h5>
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={10} fill={i < review.rating ? "#FFD700" : "none"} className={i < review.rating ? "text-brand-gold" : "text-gray-200"} />
                  ))}
                </div>
              </div>
              <span className="ml-auto text-[8px] font-black text-gray-300 uppercase italic">Aujourd'hui</span>
            </div>

            <p className="text-xs text-gray-500 italic leading-relaxed mb-6 font-medium">
              "{review.comment}"
            </p>

            {review.adminReply && (
              <div className="bg-[#FAF3E0] p-5 rounded-[2.2rem] border-2 border-white shadow-md relative mt-4">
                <div className="absolute -top-3 left-6 bg-brand-orange text-white text-[8px] font-black px-4 py-1.5 rounded-full uppercase italic shadow-sm border border-white flex items-center gap-2">
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