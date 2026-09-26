import React, { useState } from 'react';
import { UserProfile } from '../types';
import { QrCode, Award, Scan, CheckCircle2, X, Sparkles, RefreshCw, Copy, Camera } from 'lucide-react';
import { playSound } from '../utils/audio';

interface QrLoyaltyModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  onAddPoints: (points: number) => void;
}

export const QrLoyaltyModal: React.FC<QrLoyaltyModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  onAddPoints
}) => {
  const [activeTab, setActiveTab] = useState<'card' | 'scanner'>('card');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleStartScan = () => {
    playSound('pop');
    setIsScanning(true);
    setScanResult(null);

    // Simulate scanning after 2.5s
    setTimeout(() => {
      setIsScanning(false);
      playSound('success');
      setScanResult('CODE-PROMO-KHADY-VIP (+200 Points)');
      onAddPoints(200);
    }, 2500);
  };

  const getCardBg = () => {
    if (userProfile.rank === 'Platinum') return 'bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 border-purple-500/30';
    if (userProfile.rank === 'Gold') return 'bg-gradient-to-br from-[#1E110A] via-[#3A2210] to-[#140C0A] border-amber-500/30';
    return 'bg-gradient-to-br from-gray-800 via-gray-900 to-black border-gray-600/30';
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="bg-[#140C0A] text-white w-full max-w-lg rounded-[3.5rem] p-6 sm:p-8 shadow-2xl border-2 border-brand-gold/30 relative overflow-hidden">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 w-9 h-9 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-all"
        >
          <X size={18} />
        </button>

        {/* Tab Switcher */}
        <div className="flex bg-white/5 p-1.5 rounded-2xl mb-6 max-w-xs mx-auto border border-white/10">
          <button
            onClick={() => { playSound('pop'); setActiveTab('card'); }}
            className={`flex-1 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'card' ? 'bg-brand-gold text-brand-brown shadow-lg' : 'text-white/60'
            }`}
          >
            <QrCode size={14} /> Pass QR
          </button>
          <button
            onClick={() => { playSound('pop'); setActiveTab('scanner'); }}
            className={`flex-1 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'scanner' ? 'bg-brand-gold text-brand-brown shadow-lg' : 'text-white/60'
            }`}
          >
            <Scan size={14} /> Scanner QR
          </button>
        </div>

        {activeTab === 'card' ? (
          <div className="space-y-6">
            {/* Virtual VIP Card */}
            <div className={`p-6 rounded-[2.5rem] border shadow-2xl relative overflow-hidden ${getCardBg()}`}>
              <div className="flex justify-between items-start mb-6">
                <div>
                  <span className="text-[8px] font-black uppercase tracking-[0.3em] text-brand-gold block">
                    KHADY'S CLUB VIP PASS
                  </span>
                  <h3 className="text-xl font-black italic uppercase text-white mt-0.5">
                    {userProfile.name}
                  </h3>
                </div>
                <div className="bg-brand-gold/20 text-brand-gold px-3 py-1 rounded-full text-[9px] font-black uppercase border border-brand-gold/30 flex items-center gap-1">
                  <Award size={12} /> {userProfile.rank}
                </div>
              </div>

              {/* QR Code Container */}
              <div className="bg-white p-4 rounded-3xl w-44 h-44 mx-auto flex flex-col items-center justify-center shadow-2xl border-4 border-brand-gold/40 relative">
                {/* SVG Vector QR Code */}
                <svg viewBox="0 0 100 100" className="w-full h-full text-brand-brown">
                  {/* Position detection patterns */}
                  <rect x="5" y="5" width="25" height="25" fill="currentColor" />
                  <rect x="9" y="9" width="17" height="17" fill="white" />
                  <rect x="13" y="13" width="9" height="9" fill="currentColor" />

                  <rect x="70" y="5" width="25" height="25" fill="currentColor" />
                  <rect x="74" y="9" width="17" height="17" fill="white" />
                  <rect x="78" y="13" width="9" height="9" fill="currentColor" />

                  <rect x="5" y="70" width="25" height="25" fill="currentColor" />
                  <rect x="9" y="74" width="17" height="17" fill="white" />
                  <rect x="13" y="78" width="9" height="9" fill="currentColor" />

                  {/* Matrix dots */}
                  <rect x="35" y="10" width="6" height="6" fill="currentColor" />
                  <rect x="45" y="10" width="6" height="6" fill="currentColor" />
                  <rect x="55" y="10" width="6" height="6" fill="currentColor" />

                  <rect x="10" y="35" width="6" height="6" fill="currentColor" />
                  <rect x="25" y="35" width="6" height="6" fill="currentColor" />
                  <rect x="40" y="35" width="8" height="8" fill="currentColor" />
                  <rect x="55" y="35" width="6" height="6" fill="currentColor" />
                  <rect x="70" y="35" width="6" height="6" fill="currentColor" />
                  <rect x="85" y="35" width="6" height="6" fill="currentColor" />

                  <rect x="10" y="50" width="6" height="6" fill="currentColor" />
                  <rect x="30" y="50" width="8" height="8" fill="currentColor" />
                  <rect x="50" y="50" width="8" height="8" fill="currentColor" />
                  <rect x="70" y="50" width="6" height="6" fill="currentColor" />
                  <rect x="85" y="50" width="6" height="6" fill="currentColor" />

                  <rect x="35" y="70" width="8" height="8" fill="currentColor" />
                  <rect x="50" y="70" width="6" height="6" fill="currentColor" />
                  <rect x="65" y="70" width="8" height="8" fill="currentColor" />
                  <rect x="80" y="70" width="6" height="6" fill="currentColor" />

                  <rect x="35" y="85" width="6" height="6" fill="currentColor" />
                  <rect x="50" y="85" width="8" height="8" fill="currentColor" />
                  <rect x="70" y="85" width="6" height="6" fill="currentColor" />
                  <rect x="85" y="85" width="6" height="6" fill="currentColor" />
                </svg>
                <span className="text-[7px] font-black font-mono text-brand-brown tracking-widest mt-1">
                  {userProfile.referralCode}
                </span>
              </div>

              {/* Points Summary */}
              <div className="flex justify-between items-center mt-6 text-[10px] font-bold text-white/70">
                <span>Solde : <strong className="text-brand-gold font-mono text-sm">{userProfile.points} Pts</strong></span>
                <span>Téléphone : <strong className="text-white font-mono">{userProfile.phone}</strong></span>
              </div>
            </div>

            <p className="text-center text-[9px] font-bold text-white/50 italic uppercase tracking-wider">
              💡 Présentez ce pass au guichet ou au coursier Billo Express pour accumuler vos points !
            </p>
          </div>
        ) : (
          /* Scanner Mode */
          <div className="space-y-4 text-center">
            <p className="text-[10px] text-white/70 font-bold uppercase tracking-wider">
              Scannez le QR Code présent sur votre reçu Khady's ou un coupon promo !
            </p>

            <div className="relative w-full h-60 bg-black rounded-3xl overflow-hidden border-2 border-brand-gold/40 flex items-center justify-center">
              {/* Simulated Camera Feed */}
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#FFD700_1px,transparent_1px)] [background-size:16px_16px]"></div>

              {/* Viewfinder Frame */}
              <div className="w-40 h-40 border-2 border-brand-gold rounded-2xl relative flex items-center justify-center">
                <div className="absolute -top-1 -left-1 w-4 h-4 border-t-4 border-l-4 border-brand-gold"></div>
                <div className="absolute -top-1 -right-1 w-4 h-4 border-t-4 border-r-4 border-brand-gold"></div>
                <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-4 border-l-4 border-brand-gold"></div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-4 border-r-4 border-brand-gold"></div>

                {isScanning && (
                  <div className="w-full h-1 bg-red-500 shadow-[0_0_15px_#EF4444] animate-bounce"></div>
                )}
              </div>

              {!isScanning && !scanResult && (
                <button
                  onClick={handleStartScan}
                  className="absolute bg-brand-gold text-brand-brown px-6 py-3 rounded-full font-black uppercase text-[10px] shadow-2xl flex items-center gap-2 active:scale-95 transition-all"
                >
                  <Camera size={16} /> Activer la Caméra
                </button>
              )}

              {isScanning && (
                <span className="absolute bottom-4 text-[9px] font-black uppercase text-brand-gold tracking-widest animate-pulse">
                  Analyse du QR Code en cours...
                </span>
              )}
            </div>

            {scanResult && (
              <div className="bg-green-500/20 border border-green-500 p-4 rounded-2xl text-center animate-slide-up">
                <CheckCircle2 size={24} className="text-green-400 mx-auto mb-1" />
                <h4 className="font-black text-xs text-green-300 uppercase">QR Code Validé !</h4>
                <p className="text-[10px] text-white/80 font-mono mt-0.5">{scanResult}</p>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
