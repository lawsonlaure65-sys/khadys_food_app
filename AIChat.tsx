
import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Sparkles, Trash2, Zap } from 'lucide-react';
import { getSmartResponse, ChatMessage } from '../services/geminiService';
import { playSound } from '../utils/audio';

const AIChat: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{role: 'user' | 'assistant', text: string}[]>(() => {
    const saved = localStorage.getItem('khady_chat_history');
    return saved ? JSON.parse(saved) : [
      { role: 'assistant', text: "Salam ! Je suis votre Assistant Khady, votre guide pour un festin inoubliable à Niamey. On commence par quoi ? 🥘" }
    ];
  });
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      setTimeout(scrollToBottom, 100);
    }
    localStorage.setItem('khady_chat_history', JSON.stringify(messages));
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!inputText.trim() || loading) return;

    const userMsg = inputText;
    setInputText('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);
    playSound('pop');

    const history: ChatMessage[] = messages.slice(-10).map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.text }]
    }));

    const response = await getSmartResponse(userMsg, history);
    
    setMessages(prev => [...prev, { role: 'assistant', text: response }]);
    setLoading(false);
    playSound('notification');
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-24 right-6 w-16 h-16 bg-brand-orange text-white rounded-[2rem] shadow-2xl flex items-center justify-center z-[60] transition-all duration-500 hover:scale-110 active:scale-90 border-4 border-white ${isOpen ? 'opacity-0 scale-0' : 'opacity-100 scale-100'}`}
      >
        <MessageSquare size={26} strokeWidth={1.5} />
        <span className="absolute -top-1 -right-1 flex h-5 w-5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-gold opacity-75"></span>
          <span className="relative inline-flex rounded-full h-5 w-5 bg-brand-gold items-center justify-center text-[8px] font-black text-brand-brown">1</span>
        </span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 sm:inset-auto sm:bottom-24 sm:right-6 sm:w-[400px] sm:h-[600px] bg-white sm:rounded-[3rem] z-[100] flex flex-col shadow-2xl animate-slide-up overflow-hidden">
          
          <div className="bg-brand-brown p-6 flex justify-between items-center text-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-orange rounded-xl flex items-center justify-center shadow-lg border border-white/10">
                <Sparkles size={18} strokeWidth={1.5} className="text-white animate-pulse" />
              </div>
              <div>
                <h3 className="font-black text-sm uppercase tracking-tighter italic">Assistant Khady</h3>
                <div className="flex items-center gap-1.5">
                   <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                   <span className="text-[8px] font-black text-brand-gold uppercase tracking-widest">En ligne</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => { if(confirm("Effacer ?")) setMessages([{ role: 'assistant', text: "Me revoilà ! Prête à vous servir. ✨" }]); }} className="p-2.5 bg-white/10 rounded-xl transition-all hover:bg-white/20"><Trash2 size={16} strokeWidth={1.5} /></button>
              <button onClick={() => setIsOpen(false)} className="p-2.5 bg-white/10 rounded-xl transition-all hover:bg-white/20"><X size={18} strokeWidth={1.5} /></button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-brand-light/50 no-scrollbar">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                <div className={`max-w-[85%] p-4 rounded-[1.8rem] text-xs font-bold leading-relaxed shadow-sm ${
                  msg.role === 'user' 
                    ? 'bg-brand-brown text-white rounded-br-none' 
                    : 'bg-white border border-gray-100 text-brand-brown rounded-bl-none'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start animate-pulse">
                <div className="bg-white p-4 rounded-[1.8rem] rounded-bl-none shadow-sm border border-gray-100 flex items-center gap-2">
                  <Zap size={12} strokeWidth={1.5} className="text-brand-orange animate-bounce" />
                  <span className="text-[9px] font-black uppercase text-brand-orange tracking-widest">Réflexion...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-6 bg-white border-t border-gray-50 flex gap-3 pb-10 sm:pb-6">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Écrivez ici..."
              className="flex-1 bg-gray-50 border-0 rounded-2xl px-5 py-4 text-xs font-bold focus:ring-2 focus:ring-brand-orange/20 outline-none"
            />
            <button 
              onClick={handleSend}
              disabled={loading || !inputText.trim()}
              className="w-12 h-12 bg-brand-brown text-brand-gold rounded-2xl flex items-center justify-center shadow-lg active:scale-90 transition-all disabled:opacity-30"
            >
              <Send size={18} strokeWidth={1.5} />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default AIChat;
