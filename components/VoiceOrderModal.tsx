import React, { useState, useEffect } from 'react';
import { MenuItem } from '../types';
import { Mic, MicOff, Volume2, Sparkles, CheckCircle2, ShoppingBag, X, RefreshCw, ArrowRight } from 'lucide-react';
import { playSound } from '../utils/audio';

interface VoiceOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  menuItems: MenuItem[];
  onAddToCart: (item: MenuItem, quantity: number) => void;
}

interface DetectedItem {
  item: MenuItem;
  quantity: number;
}

export const VoiceOrderModal: React.FC<VoiceOrderModalProps> = ({ isOpen, onClose, menuItems, onAddToCart }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [detectedItems, setDetectedItems] = useState<DetectedItem[]>([]);
  const [recognition, setRecognition] = useState<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'fr-FR';

      rec.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);
        analyzeTranscript(currentTranscript);
      };

      rec.onerror = () => {
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      setRecognition(rec);
    }
  }, [menuItems]);

  const toggleListening = () => {
    playSound('pop');
    if (!recognition) {
      // Simulate listening with sample text if browser SpeechRecognition is unavailable
      setIsListening(true);
      simulateVoiceInput("Je voudrais deux riz au gras poulet et un jus de bissap");
      return;
    }

    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      setTranscript('');
      setDetectedItems([]);
      try {
        recognition.start();
        setIsListening(true);
      } catch {
        simulateVoiceInput("Un poulet braisé et deux sodas froids");
      }
    }
  };

  const simulateVoiceInput = (textSample: string) => {
    setTranscript('');
    setDetectedItems([]);
    let i = 0;
    const interval = setInterval(() => {
      if (i < textSample.length) {
        setTranscript(prev => textSample.substring(0, i + 1));
        i++;
      } else {
        clearInterval(interval);
        setIsListening(false);
        analyzeTranscript(textSample);
      }
    }, 40);
  };

  const analyzeTranscript = (text: string) => {
    const lowerText = text.toLowerCase();
    const found: DetectedItem[] = [];

    // Extract potential quantity numbers before words
    menuItems.forEach(item => {
      const nameLower = item.name.toLowerCase();
      const keywords = nameLower.split(' ').filter(w => w.length > 3);

      let matched = false;
      if (lowerText.includes(nameLower)) {
        matched = true;
      } else if (keywords.some(kw => lowerText.includes(kw))) {
        matched = true;
      }

      if (matched) {
        // Detect quantity in transcript before item name
        let qty = 1;
        if (lowerText.includes('deux') || lowerText.includes('2')) qty = 2;
        if (lowerText.includes('trois') || lowerText.includes('3')) qty = 3;
        if (lowerText.includes('quatre') || lowerText.includes('4')) qty = 4;
        if (lowerText.includes('cinq') || lowerText.includes('5')) qty = 5;

        found.push({ item, quantity: qty });
      }
    });

    setDetectedItems(found);
  };

  const handleAddAllToCart = () => {
    playSound('cash');
    detectedItems.forEach(di => {
      onAddToCart(di.item, di.quantity);
    });
    onClose();
  };

  if (!isOpen) return null;

  const quickSamples = [
    "Deux Riz au Gras Capitaine et 1 Bissap",
    "Un Poulet Braisé Khady's et deux Fantas",
    "Un Dibi d'Agneau et un Jus de Gingembre",
    "Trois Capriccio de Bœuf"
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-[#140C0A] text-white w-full max-w-lg rounded-[3.5rem] p-8 shadow-2xl border-2 border-brand-gold/30 relative overflow-hidden">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 w-10 h-10 bg-white/10 text-white hover:bg-white/20 rounded-full flex items-center justify-center transition-all"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="text-center mb-6 pt-2">
          <span className="text-[9px] font-black uppercase text-brand-gold tracking-[0.3em] inline-flex items-center gap-1.5 bg-brand-gold/10 px-3.5 py-1 rounded-full border border-brand-gold/20 mb-2">
            <Sparkles size={12} className="animate-spin text-brand-gold" /> Intelligence Vocale Khady's
          </span>
          <h3 className="text-2xl font-black italic uppercase text-white leading-none">
            Commande Vocale 🎙️
          </h3>
          <p className="text-[10px] text-white/60 font-bold mt-1">
            Parlez naturellement pour composer votre festin !
          </p>
        </div>

        {/* Big Mic Button */}
        <div className="flex flex-col items-center justify-center my-6">
          <button
            onClick={toggleListening}
            className={`w-28 h-28 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 relative ${
              isListening 
                ? 'bg-red-500 text-white scale-110 shadow-[0_0_50px_rgba(239,68,68,0.7)] animate-pulse' 
                : 'bg-brand-orange text-white hover:bg-brand-gold hover:text-brand-brown shadow-[0_0_30px_rgba(255,111,0,0.5)] active:scale-95'
            }`}
          >
            {isListening ? (
              <MicOff size={44} className="animate-bounce" />
            ) : (
              <Mic size={44} />
            )}
            {isListening && (
              <span className="absolute -bottom-8 text-[9px] font-black uppercase text-red-400 tracking-widest animate-pulse">
                Écoute en cours...
              </span>
            )}
          </button>
        </div>

        {/* Live Transcript Display */}
        <div className="bg-white/5 p-4 rounded-2xl border border-white/10 min-h-[60px] flex items-center justify-center text-center mb-4">
          {transcript ? (
            <p className="text-xs font-bold text-brand-gold italic">"{transcript}"</p>
          ) : (
            <p className="text-[10px] text-white/40 italic font-semibold">
              Appuyez sur le micro et dites par exemple : "2 Riz au Gras et un Bissap"
            </p>
          )}
        </div>

        {/* Quick Samples */}
        <div className="mb-6">
          <p className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-2">Exemples rapides à tester :</p>
          <div className="flex flex-wrap gap-1.5">
            {quickSamples.map((sample, idx) => (
              <button
                key={idx}
                onClick={() => {
                  playSound('pop');
                  simulateVoiceInput(sample);
                }}
                className="bg-white/5 hover:bg-brand-orange/20 text-white/80 hover:text-brand-gold text-[8px] font-bold px-3 py-1.5 rounded-full border border-white/10 transition-all text-left"
              >
                🗣️ "{sample}"
              </button>
            ))}
          </div>
        </div>

        {/* Detected Menu Items */}
        {detectedItems.length > 0 && (
          <div className="bg-black/50 p-4 rounded-3xl border border-green-500/30 space-y-3 mb-6 animate-slide-up">
            <div className="flex justify-between items-center">
              <span className="text-[9px] font-black text-green-400 uppercase tracking-widest flex items-center gap-1">
                <CheckCircle2 size={14} /> {detectedItems.length} Plat(s) Détecté(s) :
              </span>
            </div>
            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
              {detectedItems.map((di, idx) => (
                <div key={idx} className="bg-white/5 p-2.5 rounded-xl flex items-center justify-between text-[10px]">
                  <div className="flex items-center gap-2">
                    <img src={di.item.image} alt={di.item.name} className="w-8 h-8 rounded-lg object-cover" />
                    <div>
                      <span className="font-bold text-white block">{di.quantity}x {di.item.name}</span>
                      <span className="text-[8px] text-brand-gold font-mono">{di.item.price * di.quantity} F CFA</span>
                    </div>
                  </div>
                  <span className="text-[8px] bg-green-500/20 text-green-300 font-bold px-2 py-0.5 rounded-md">Détecté</span>
                </div>
              ))}
            </div>

            <button
              onClick={handleAddAllToCart}
              className="w-full bg-green-500 hover:bg-green-600 text-white py-3.5 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all italic mt-2"
            >
              <ShoppingBag size={16} /> Ajouter tout au Panier <ArrowRight size={16} />
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
