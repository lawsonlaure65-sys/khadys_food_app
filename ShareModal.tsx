import React, { useState } from 'react';
import { X, Share2, Copy, Check, MessageCircle, ExternalLink, Sparkles, Send, Facebook, Instagram } from 'lucide-react';
import { MenuItem } from '../types';
import { playSound } from '../utils/audio';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  item?: MenuItem | null;
  onShowToast?: (msg: string) => void;
}

export const SOCIAL_LINKS = {
  facebook: "https://www.facebook.com/search/top?q=Khady%27s%20Food%20%26%20Event",
  facebookHandle: "@Khady's Food & Event",
  instagram: "https://www.instagram.com/khadys_food/",
  instagramHandle: "khadys_food",
  tiktok: "https://www.tiktok.com/@khadys.food",
  tiktokHandle: "khadys.food",
  whatsappNumber: "+22790000000"
};

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, item, onShowToast }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const appUrl = window.location.href;
  
  // Custom message according to dish or general app
  const shareTitle = item 
    ? `Plat Gourmand : ${item.name} chez Khady's Food & Event 🥘` 
    : `Khady's Food & Event - Le Festin des Rois à Niamey 👑`;

  const shareText = item
    ? `Découvre ce délicieux plat : "${item.name}" à seulement ${item.price.toLocaleString()} F CFA chez Khady's Food & Event Niamey ! 🥘😋`
    : `Commandez les meilleurs plats africains et spécialités gourmandes à Niamey sur l'application Khady's Food & Event ! 🥘✨`;

  const fullShareUrl = `${appUrl}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${shareText}\n${fullShareUrl}`);
    setCopied(true);
    playSound('success');
    if (onShowToast) onShowToast("Lien de partage copié dans le presse-papier !");
    setTimeout(() => setCopied(false), 2500);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: fullShareUrl
        });
        playSound('success');
      } catch (err) {
        console.log("Share cancelled or failed:", err);
      }
    } else {
      handleCopyLink();
    }
  };

  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareText}\n👉 ${fullShareUrl}`)}`;
  const facebookShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(fullShareUrl)}&quote=${encodeURIComponent(shareText)}`;
  const twitterShareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(fullShareUrl)}`;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in" onClick={onClose}>
      <div 
        className="bg-white w-full max-w-md rounded-[3rem] p-8 shadow-2xl border-4 border-white relative overflow-hidden animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        {/* Decorative badge */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-brand-orange/10 text-brand-orange rounded-2xl">
              <Share2 size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black italic uppercase text-brand-brown leading-tight">
                {item ? "Partager ce plat" : "Partager l'application"}
              </h3>
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Khady's Food Club Niamey</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2.5 bg-gray-100 text-gray-400 hover:text-brand-brown rounded-2xl transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Item preview if item present */}
        {item && (
          <div className="flex items-center gap-4 bg-brand-cream/40 p-4 rounded-2xl mb-6 border border-brand-orange/10">
            <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded-xl shadow-md" />
            <div>
              <h4 className="text-xs font-black text-brand-brown uppercase italic leading-tight">{item.name}</h4>
              <p className="text-xs font-black text-brand-orange mt-1">{item.price.toLocaleString()} F CFA</p>
            </div>
          </div>
        )}

        {/* Share buttons grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <a 
            href={whatsappUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            onClick={() => playSound('pop')}
            className="flex items-center justify-center gap-2.5 bg-[#25D366] text-white p-4 rounded-2xl font-black text-xs uppercase shadow-lg hover:brightness-110 active:scale-95 transition-all"
          >
            <MessageCircle size={18} fill="white" /> WhatsApp
          </a>

          <a 
            href={facebookShareUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            onClick={() => playSound('pop')}
            className="flex items-center justify-center gap-2.5 bg-[#1877F2] text-white p-4 rounded-2xl font-black text-xs uppercase shadow-lg hover:brightness-110 active:scale-95 transition-all"
          >
            <Facebook size={18} fill="white" /> Facebook
          </a>

          <a 
            href={twitterShareUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            onClick={() => playSound('pop')}
            className="flex items-center justify-center gap-2.5 bg-[#1DA1F2] text-white p-4 rounded-2xl font-black text-xs uppercase shadow-lg hover:brightness-110 active:scale-95 transition-all"
          >
            <Send size={18} /> Twitter
          </a>

          <button 
            onClick={handleNativeShare}
            className="flex items-center justify-center gap-2.5 bg-brand-brown text-brand-gold p-4 rounded-2xl font-black text-xs uppercase shadow-lg hover:bg-brand-orange hover:text-white active:scale-95 transition-all"
          >
            <Share2 size={18} /> Plus d'options
          </button>
        </div>

        {/* Copy link box */}
        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex items-center justify-between gap-3 mb-6">
          <span className="text-[10px] font-bold text-gray-400 truncate flex-1">{fullShareUrl}</span>
          <button 
            onClick={handleCopyLink}
            className="px-4 py-2 bg-brand-orange text-white rounded-xl text-[10px] font-black uppercase flex items-center gap-1.5 shrink-0 shadow-md active:scale-90 transition-all"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? 'Copié !' : 'Copier'}
          </button>
        </div>

        {/* Social media links section */}
        <div className="pt-4 border-t border-gray-100">
          <p className="text-[9px] font-black uppercase text-gray-400 tracking-widest text-center mb-3">
            Nos Réseaux Officiels
          </p>
          <div className="flex justify-center gap-3">
            <a 
              href={SOCIAL_LINKS.facebook} 
              target="_blank" 
              rel="noopener noreferrer"
              className="px-3 py-2 bg-blue-50 text-blue-600 rounded-xl text-[9px] font-black flex items-center gap-1.5 hover:bg-blue-100 transition-colors"
            >
              <Facebook size={12} /> {SOCIAL_LINKS.facebookHandle}
            </a>
            <a 
              href={SOCIAL_LINKS.instagram} 
              target="_blank" 
              rel="noopener noreferrer"
              className="px-3 py-2 bg-pink-50 text-pink-600 rounded-xl text-[9px] font-black flex items-center gap-1.5 hover:bg-pink-100 transition-colors"
            >
              <Instagram size={12} /> {SOCIAL_LINKS.instagramHandle}
            </a>
            <a 
              href={SOCIAL_LINKS.tiktok} 
              target="_blank" 
              rel="noopener noreferrer"
              className="px-3 py-2 bg-gray-100 text-gray-800 rounded-xl text-[9px] font-black flex items-center gap-1.5 hover:bg-gray-200 transition-colors"
            >
              <Sparkles size={12} /> {SOCIAL_LINKS.tiktokHandle}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
