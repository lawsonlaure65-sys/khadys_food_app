
import React, { useState } from 'react';
import { Send, CheckCircle, Info, Clock, ShieldCheck, Phone, Calendar, Star, Users, MapPin } from 'lucide-react';
import { playSound } from '../utils/audio';
import { TRAITEUR_CONDITIONS } from '../constants';

const TraiteurView: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '', phone: '', eventType: '', guests: '', date: '', location: '', details: ''
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      playSound('success');
      setSubmitted(true);
      setLoading(false);
    }, 1500);
  };

  const services = [
    { title: 'Mariages', desc: 'Buffet gastronomique africain & européen pour le plus beau jour de votre vie.', icon: Star },
    { title: 'Baptêmes', desc: 'Des menus conviviaux pour célébrer vos nouveaux nés en famille.', icon: Users },
    { title: 'Cocktails Pro', desc: 'Mini-pastels, samosas et jus frais pour vos réunions et séminaires.', icon: ShieldCheck },
  ];

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-10 text-center animate-fade-in">
        <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-8 shadow-xl"><CheckCircle size={48} /></div>
        <h2 className="text-3xl font-black text-brand-brown uppercase italic mb-4 leading-none">Demande Transmise !</h2>
        <p className="text-xs text-gray-500 mb-10 font-medium">Un conseiller Khady's Food & Event vous contactera <br/> sous 24h pour discuter de votre projet.</p>
        <button onClick={() => setSubmitted(false)} className="bg-brand-brown text-brand-gold px-12 py-5 rounded-[2rem] font-black uppercase text-[10px] italic shadow-2xl">Faire une autre demande</button>
      </div>
    );
  }

  return (
    <div className="pb-32 animate-fade-in">
      <div className="p-10 text-center bg-white border-b border-gray-50">
         <h1 className="text-3xl font-black text-brand-brown uppercase italic leading-none mb-2">Service <span className="text-brand-orange">Évènementiel</span></h1>
         <p className="text-[10px] font-black uppercase text-gray-400 tracking-[0.3em]">L'excellence au service de vos moments</p>
      </div>

      <div className="p-6">
        {/* Nos Prestations */}
        <div className="mb-10">
           <h3 className="text-xs font-black uppercase text-brand-brown italic mb-6 tracking-widest">Nos Prestations</h3>
           <div className="space-y-4">
              {services.map((s, idx) => (
                <div key={idx} className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100 flex items-center gap-5">
                   <div className="w-14 h-14 bg-brand-orange/10 text-brand-orange rounded-2xl flex items-center justify-center flex-shrink-0">
                      <s.icon size={24} />
                   </div>
                   <div>
                      <h4 className="font-black uppercase text-xs italic text-brand-brown">{s.title}</h4>
                      <p className="text-[10px] text-gray-500 font-bold leading-relaxed">{s.desc}</p>
                   </div>
                </div>
              ))}
           </div>
        </div>

        {/* Conditions Section */}
        <div className="grid grid-cols-2 gap-4 mb-10">
           {TRAITEUR_CONDITIONS.map((cond, i) => (
             <div key={i} className="bg-brand-brown p-5 rounded-[2.5rem] text-center border-4 border-white shadow-xl">
                <h4 className="text-brand-gold font-black text-[9px] uppercase mb-2 tracking-tighter">{cond.title}</h4>
                <p className="text-white/60 text-[8px] font-bold leading-relaxed">{cond.detail}</p>
             </div>
           ))}
        </div>

        <div className="bg-[#1A0F0D] rounded-[3.5rem] p-10 shadow-2xl relative border-4 border-white text-white overflow-hidden">
           <div className="absolute top-0 right-0 p-8 opacity-5 scale-150 rotate-12"><Calendar size={120} /></div>
           
           <div className="relative z-10">
              <h3 className="text-xl font-black italic uppercase text-brand-gold mb-8 flex items-center gap-3">
                 <Calendar className="text-brand-orange" /> Formulaire de Devis
              </h3>

              <form onSubmit={handleSubmit} className="space-y-6">
                 <div className="space-y-4">
                    <input type="text" required placeholder="Votre Nom" className="w-full p-5 bg-white/5 rounded-2xl text-white text-xs font-bold outline-none border border-white/10 focus:border-brand-gold" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                    <input type="tel" required placeholder="WhatsApp" className="w-full p-5 bg-white/5 rounded-2xl text-white text-xs font-bold outline-none border border-white/10 focus:border-brand-gold" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                    
                    <div className="grid grid-cols-2 gap-4">
                      <select required className="w-full p-5 bg-white/10 rounded-2xl text-white text-xs font-bold outline-none" value={formData.eventType} onChange={e => setFormData({...formData, eventType: e.target.value})}>
                         <option value="" className="bg-brand-brown">Événement</option>
                         <option value="Mariage" className="bg-brand-brown">Mariage</option>
                         <option value="Baptême" className="bg-brand-brown">Baptême</option>
                         <option value="Cocktail" className="bg-brand-brown">Cocktail</option>
                         <option value="Autre" className="bg-brand-brown">Autre</option>
                      </select>
                      <input type="number" required placeholder="Invités" className="w-full p-5 bg-white/5 rounded-2xl text-white text-xs font-bold outline-none border border-white/10" value={formData.guests} onChange={e => setFormData({...formData, guests: e.target.value})} />
                    </div>

                    <input type="date" required className="w-full p-5 bg-white/5 rounded-2xl text-white text-xs font-bold outline-none" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                    
                    <textarea placeholder="Menu souhaité ou message..." className="w-full p-5 bg-white/5 rounded-2xl text-white text-xs font-bold outline-none border border-white/10 h-32 resize-none" value={formData.details} onChange={e => setFormData({...formData, details: e.target.value})}></textarea>
                 </div>

                 <button disabled={loading} className="w-full bg-brand-orange text-white py-6 rounded-3xl font-black uppercase shadow-2xl flex items-center justify-center gap-3 active:scale-95 italic tracking-widest">
                    {loading ? "Calcul du goût..." : "Demander un Devis"} <Send size={20} />
                 </button>
              </form>
           </div>
        </div>

        <div className="mt-10 p-8 bg-brand-gold/10 rounded-[3rem] border border-brand-gold/20 flex items-center gap-6">
           <div className="w-16 h-16 bg-brand-gold rounded-2xl flex items-center justify-center text-brand-brown shadow-lg"><Phone size={24} /></div>
           <div>
              <h4 className="text-xs font-black uppercase text-brand-brown italic">Ligne Directe Évent</h4>
              <p className="text-[10px] font-bold text-brand-brown/60">+227 74 44 16 21</p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default TraiteurView;
