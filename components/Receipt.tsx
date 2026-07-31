
import React from 'react';
import { Order } from '../types';
import { LOGO_URL, RESTAURANT_INFO } from '../constants';
import { X, Printer, Share2, QrCode, CheckCircle2 } from 'lucide-react';

interface ReceiptProps {
  order: Order;
  onClose: () => void;
}

const Receipt: React.FC<ReceiptProps> = ({ order, onClose }) => {
  return (
    <div className="fixed inset-0 z-[150] bg-black/90 backdrop-blur-md flex items-center justify-center p-6 animate-fade-in">
      <div className="bg-white w-full max-w-sm rounded-[3.5rem] overflow-hidden flex flex-col shadow-[0_30px_100px_rgba(0,0,0,0.8)] border-4 border-white animate-slide-up relative">
         
         <div className="p-10 text-center bg-gray-50 border-b border-dashed border-gray-200 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 rotate-45"><QrCode size={100} /></div>
            <img src={LOGO_URL} className="w-20 h-20 rounded-full mx-auto mb-4 border-4 border-brand-brown shadow-xl" />
            <h3 className="font-black text-brand-brown uppercase italic text-2xl tracking-tighter leading-none mb-1">{RESTAURANT_INFO.name}</h3>
            <p className="text-[10px] font-black text-brand-orange uppercase tracking-[0.3em]">{RESTAURANT_INFO.slogan}</p>
         </div>

         <div className="p-8 flex-1 overflow-y-auto no-scrollbar font-mono text-[11px] text-brand-brown/80">
            <div className="flex justify-between items-center mb-6">
               <span className="bg-brand-brown text-brand-gold px-3 py-1 rounded-full text-[8px] font-black">TICKET {order.id}</span>
               <span className="text-[9px] font-bold opacity-40">{new Date(order.timestamp).toLocaleDateString()} • {new Date(order.timestamp).toLocaleTimeString()}</span>
            </div>
            
            <div className="space-y-2 mb-8 border-l-2 border-brand-orange/20 pl-4">
               <p className="font-black text-brand-brown uppercase italic text-sm">{order.customerName}</p>
               <p className="text-[10px] font-bold text-gray-400">📍 {order.district}, Niamey</p>
               <p className="text-[10px] font-bold text-gray-400">📞 {order.phone}</p>
            </div>
            
            <div className="border-t border-b border-dashed border-gray-200 py-6 my-6 space-y-3">
               <p className="text-[8px] font-black text-gray-300 uppercase tracking-widest mb-4">Détail du festin</p>
               {order.items.map((item, idx) => (
                 <div key={idx} className="flex justify-between items-start gap-4">
                    <span className="flex-1 font-bold">{item.quantity} X {item.name}</span>
                    <span className="font-black text-brand-brown whitespace-nowrap">{item.price * item.quantity} F</span>
                 </div>
               ))}
            </div>

            <div className="space-y-2 mb-8 bg-gray-50 p-6 rounded-3xl">
               <div className="flex justify-between"><span>SOUS-TOTAL:</span><span className="font-bold">{order.total} F</span></div>
               <div className="flex justify-between items-center">
                  <span className="flex items-center gap-2">LIVRAISON BILLO:</span>
                  <span className="font-bold">{order.deliveryFee} F</span>
               </div>
               <div className="flex justify-between text-base font-black pt-4 border-t border-gray-200 mt-2">
                  <span className="italic">TOTAL :</span>
                  <span className="text-brand-orange">{order.total + order.deliveryFee} F</span>
               </div>
               <p className="text-[8px] text-brand-orange font-black text-right uppercase tracking-widest mt-2">Paiement : {order.paymentMethod}</p>
            </div>

            <div className="bg-brand-brown text-brand-gold p-6 rounded-[2.5rem] flex items-center justify-between shadow-xl mb-6 border border-white/10">
               <div>
                  <p className="text-[9px] font-black uppercase opacity-60 tracking-widest mb-1">Club Khady Points</p>
                  <p className="text-xl font-black italic">+450 PTS ✨</p>
               </div>
               <div className="bg-white p-2 rounded-xl shadow-lg"><QrCode size={36} className="text-brand-brown" /></div>
            </div>

            <p className="text-center text-[10px] font-black text-brand-brown/30 italic uppercase tracking-tighter">
               Barka pour votre confiance ! <br/> "L'excellence de Niamey en un clic."
            </p>
         </div>

         <div className="p-8 bg-gray-50 border-t border-gray-100 flex flex-col gap-3">
            <button onClick={onClose} className="w-full bg-brand-orange text-white py-5 rounded-2xl flex items-center justify-center gap-3 font-black text-xs uppercase shadow-2xl active:scale-95 transition-all">
               <CheckCircle2 size={18}/> Revenir au restaurant
            </button>
            <button className="w-full bg-brand-brown/10 text-brand-brown py-4 rounded-2xl flex items-center justify-center gap-3 font-black text-[10px] uppercase active:scale-95 transition-all">
               <Printer size={16}/> Imprimer le ticket
            </button>
         </div>
      </div>
    </div>
  );
};

export default Receipt;
