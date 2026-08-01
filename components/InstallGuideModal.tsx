import React, { useState, useEffect } from 'react';
import { X, Download, Smartphone, Apple, CheckCircle2, ChevronRight, Share2, PlusSquare, MoreVertical, Sparkles } from 'lucide-react';
import { playSound } from '../utils/audio';

interface InstallGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  deferredPrompt?: any;
  onInstallClick?: () => void;
}

export const InstallGuideModal: React.FC<InstallGuideModalProps> = ({ 
  isOpen, 
  onClose, 
  deferredPrompt,
  onInstallClick 
}) => {
  const [activeTab, setActiveTab] = useState<'android' | 'ios'>('android');

  useEffect(() => {
    // Détecter l'appareil par défaut
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
    if (/iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream) {
      setActiveTab('ios');
    } else {
      setActiveTab('android');
    }
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in" onClick={onClose}>
      <div 
        className="bg-white w-full max-w-lg rounded-[3rem] p-8 shadow-2xl border-4 border-white relative overflow-hidden animate-slide-up max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-brand-brown text-brand-gold rounded-2xl shadow-md">
              <Download size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black italic uppercase text-brand-brown leading-tight">
                Installer l'Application
              </h3>
              <p className="text-[9px] font-bold text-brand-orange uppercase tracking-widest">
                Accès direct 1-clic & Mode Hors-ligne
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2.5 bg-gray-100 text-gray-400 hover:text-brand-brown rounded-2xl transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Action Directe si Prompt PWA supporté */}
        {deferredPrompt && onInstallClick && (
          <div className="mb-6 p-5 bg-gradient-to-r from-brand-orange to-amber-500 rounded-3xl text-white shadow-xl flex items-center justify-between gap-4 shrink-0">
            <div>
              <span className="text-xs font-black uppercase italic tracking-wider block">Installation en 1-Clic disponible</span>
              <span className="text-[9px] opacity-90 font-bold block mt-0.5">Votre navigateur permet l'installation directe.</span>
            </div>
            <button 
              onClick={() => { playSound('success'); onInstallClick(); }}
              className="bg-white text-brand-orange px-5 py-3 rounded-2xl font-black text-xs uppercase shadow-lg active:scale-95 transition-all shrink-0 flex items-center gap-1.5"
            >
              <Download size={16} /> Installer
            </button>
          </div>
        )}

        {/* Tabs Android vs iPhone */}
        <div className="flex gap-2 p-1.5 bg-gray-100 rounded-2xl mb-6 shrink-0">
          <button 
            onClick={() => { playSound('pop'); setActiveTab('android'); }}
            className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${activeTab === 'android' ? 'bg-brand-brown text-brand-gold shadow-md' : 'text-gray-400'}`}
          >
            <Smartphone size={16} /> Android (Chrome)
          </button>
          <button 
            onClick={() => { playSound('pop'); setActiveTab('ios'); }}
            className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${activeTab === 'ios' ? 'bg-brand-brown text-brand-gold shadow-md' : 'text-gray-400'}`}
          >
            <Apple size={16} /> iPhone (Safari)
          </button>
        </div>

        {/* Tab Content Instructions */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4 no-scrollbar">
          {activeTab === 'android' ? (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="w-9 h-9 bg-brand-orange text-white rounded-xl flex items-center justify-center font-black text-sm shrink-0 shadow-sm">
                  1
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase text-brand-brown flex items-center gap-2">
                    Ouvrir le menu Chrome <MoreVertical size={16} className="text-brand-orange" />
                  </h4>
                  <p className="text-[11px] font-medium text-gray-500 mt-1">
                    Dans votre navigateur (Chrome, Brave ou Edge), appuyez sur les <strong>3 points verticaux</strong> situés en haut à droite de votre écran.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="w-9 h-9 bg-brand-orange text-white rounded-xl flex items-center justify-center font-black text-sm shrink-0 shadow-sm">
                  2
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase text-brand-brown flex items-center gap-2">
                    Sélectionner "Ajouter à l'écran d'accueil" <PlusSquare size={16} className="text-brand-orange" />
                  </h4>
                  <p className="text-[11px] font-medium text-gray-500 mt-1">
                    Appuyez sur l'option <strong>"Ajouter à l'écran d'accueil"</strong> ou <strong>"Installer l'application"</strong> dans la liste.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="w-9 h-9 bg-brand-orange text-white rounded-xl flex items-center justify-center font-black text-sm shrink-0 shadow-sm">
                  3
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase text-brand-brown flex items-center gap-2">
                    Confirmer l'installation <CheckCircle2 size={16} className="text-green-500" />
                  </h4>
                  <p className="text-[11px] font-medium text-gray-500 mt-1">
                    Cliquez sur <strong>"Ajouter"</strong>. L'icône de Khady's Food apparaîtra instantanément sur le bureau de votre téléphone comme une vraie application !
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="w-9 h-9 bg-brand-brown text-brand-gold rounded-xl flex items-center justify-center font-black text-sm shrink-0 shadow-sm">
                  1
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase text-brand-brown flex items-center gap-2">
                    Ouvrir sur Safari & Appuyer sur Partager <Share2 size={16} className="text-blue-500" />
                  </h4>
                  <p className="text-[11px] font-medium text-gray-500 mt-1">
                    Assurez-vous d'être dans l'application <strong>Safari</strong> sur votre iPhone, puis touchez l'icône <strong>Partager</strong> (le carré avec la flèche vers le haut au bas de l'écran).
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="w-9 h-9 bg-brand-brown text-brand-gold rounded-xl flex items-center justify-center font-black text-sm shrink-0 shadow-sm">
                  2
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase text-brand-brown flex items-center gap-2">
                    Choisir "Sur l'écran d'accueil" <PlusSquare size={16} className="text-brand-orange" />
                  </h4>
                  <p className="text-[11px] font-medium text-gray-500 mt-1">
                    Faites défiler le menu vers le bas et appuyez sur l'option <strong>"Sur l'écran d'accueil"</strong> (icône ➕).
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="w-9 h-9 bg-brand-brown text-brand-gold rounded-xl flex items-center justify-center font-black text-sm shrink-0 shadow-sm">
                  3
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase text-brand-brown flex items-center gap-2">
                    Valider l'ajout <CheckCircle2 size={16} className="text-green-500" />
                  </h4>
                  <p className="text-[11px] font-medium text-gray-500 mt-1">
                    Appuyez sur <strong>"Ajouter"</strong> en haut à droite. Retrouvez l'icône Khady's Food sur l'écran d'accueil de votre iPhone !
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Avantages PWA */}
          <div className="p-4 bg-brand-cream/60 rounded-2xl border border-brand-orange/20 mt-4">
            <h5 className="text-[10px] font-black uppercase text-brand-brown flex items-center gap-1.5 mb-2">
              <Sparkles size={14} className="text-brand-orange" /> Pourquoi installer l'application ?
            </h5>
            <ul className="text-[10px] font-semibold text-gray-600 space-y-1 list-disc list-inside">
              <li>Chargement ultra-rapide sans passer par le navigateur</li>
              <li>Recevez les notifications Push directes lors de la préparation</li>
              <li>Accès au menu et à vos commandes même hors connexion Web</li>
              <li>Aucun téléchargement lourd sur Play Store / App Store !</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end shrink-0">
          <button 
            onClick={onClose}
            className="w-full bg-brand-brown text-brand-gold py-4 rounded-2xl font-black text-xs uppercase shadow-lg active:scale-95 transition-all text-center"
          >
            Fermer le guide
          </button>
        </div>
      </div>
    </div>
  );
};
