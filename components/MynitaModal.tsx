import React, { useState, useRef } from 'react';
import { 
  X, Camera, Upload, CheckCircle2, Copy, Check, AlertCircle, 
  Smartphone, ShieldCheck, ArrowRight, RefreshCw, FileText, Image as ImageIcon
} from 'lucide-react';
import { playSound } from '../utils/audio';
import { PAYMENT_ACCOUNTS } from '../constants';

interface MynitaModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalAmount: number;
  onProofCaptured: (dataUrl: string, transactionId?: string) => void;
  existingProofUrl?: string;
  existingTransactionId?: string;
}

export const MynitaModal: React.FC<MynitaModalProps> = ({
  isOpen,
  onClose,
  totalAmount,
  onProofCaptured,
  existingProofUrl = '',
  existingTransactionId = ''
}) => {
  const [copiedNumber, setCopiedNumber] = useState(false);
  const [copiedAmount, setCopiedAmount] = useState(false);
  const [trxId, setTrxId] = useState(existingTransactionId);
  const [previewUrl, setPreviewUrl] = useState<string>(existingProofUrl);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeStep, setActiveStep] = useState<number>(existingProofUrl ? 4 : 1);

  // References for camera capture vs file upload
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const mynitaPhone = PAYMENT_ACCOUNTS.mynitaAmana.number;
  const mynitaCleanPhone = mynitaPhone.replace(/\s+/g, '');

  const handleCopyNumber = () => {
    navigator.clipboard?.writeText(mynitaCleanPhone);
    setCopiedNumber(true);
    playSound('pop');
    setTimeout(() => setCopiedNumber(false), 2500);
  };

  const handleCopyAmount = () => {
    navigator.clipboard?.writeText(totalAmount.toString());
    setCopiedAmount(true);
    playSound('pop');
    setTimeout(() => setCopiedAmount(false), 2500);
  };

  const processImageFile = (file: File) => {
    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setPreviewUrl(result);
      setIsProcessing(false);
      setActiveStep(4);
      playSound('success');
      onProofCaptured(result, trxId);
    };
    reader.onerror = () => {
      setIsProcessing(false);
      alert("Impossible de lire l'image. Veuillez réessayer.");
    };
    reader.readAsDataURL(file);
  };

  const handleCaptureFromCamera = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleSelectFromGallery = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleConfirmAndClose = () => {
    if (previewUrl) {
      onProofCaptured(previewUrl, trxId);
    }
    playSound('pop');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fade-in">
      <div className="bg-gradient-to-b from-[#24130E] via-[#2F1912] to-[#1A0B07] text-white rounded-[2.5rem] sm:rounded-[3.2rem] max-w-xl w-full border-2 border-brand-gold/40 shadow-2xl overflow-hidden my-auto relative">
        
        {/* Hidden inputs: One with capture="environment" to launch the rear camera directly */}
        <input 
          type="file" 
          accept="image/*" 
          capture="environment" 
          ref={cameraInputRef} 
          onChange={handleCaptureFromCamera} 
          className="hidden" 
          id="mynita-camera-direct-input"
        />
        <input 
          type="file" 
          accept="image/*" 
          ref={fileInputRef} 
          onChange={handleSelectFromGallery} 
          className="hidden" 
          id="mynita-gallery-input"
        />

        {/* Ambient Glow */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-brand-orange/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-brand-gold/15 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="p-6 sm:p-7 border-b border-white/10 flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-orange to-amber-500 flex items-center justify-center shadow-lg text-white font-black text-xl">
              📲
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400">
                  Dépôt Direct Sécurisé
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black italic uppercase text-brand-gold tracking-tight">
                Instructions Dépôt MyNita
              </h3>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-2xl bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white flex items-center justify-center transition-all active:scale-95"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-7 space-y-6 max-h-[75vh] overflow-y-auto relative z-10 custom-scrollbar">
          
          {/* Highlight Amount & Recipient Box */}
          <div className="bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15 p-5 rounded-3xl border border-brand-gold/30 shadow-inner space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
              <div>
                <span className="text-[9px] font-black uppercase tracking-widest text-white/50 block">Montant Exact à Déposer</span>
                <span className="text-2xl sm:text-3xl font-black italic text-brand-gold tracking-tight">
                  {totalAmount.toLocaleString()} F CFA
                </span>
              </div>
              <button
                type="button"
                onClick={handleCopyAmount}
                className="self-start sm:self-auto px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-brand-gold text-[10px] font-black uppercase italic tracking-wider flex items-center gap-1.5 transition-all border border-brand-gold/20 active:scale-95"
              >
                {copiedAmount ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                {copiedAmount ? 'Montant Copié !' : 'Copier Montant'}
              </button>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[9px] font-black uppercase tracking-widest text-white/50 block">Numéro Compte MyNita / Amanata</span>
                <span className="text-lg sm:text-xl font-mono font-black text-white tracking-wide">
                  {mynitaPhone}
                </span>
                <span className="text-[9px] text-brand-gold/80 block mt-0.5 italic">Titulaire : Khady's Food & Event</span>
              </div>
              <button
                type="button"
                onClick={handleCopyNumber}
                className="self-start sm:self-auto px-4 py-2 rounded-xl bg-brand-orange text-white text-[10px] font-black uppercase italic tracking-wider flex items-center gap-1.5 transition-all shadow-md active:scale-95"
              >
                {copiedNumber ? <Check size={14} className="text-white" /> : <Copy size={14} />}
                {copiedNumber ? 'Numéro Copié !' : 'Copier Numéro'}
              </button>
            </div>
          </div>

          {/* Step by Step Visual Guide */}
          <div className="space-y-3">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-brand-gold flex items-center gap-2">
              <FileText size={14} /> Étapes Simples de Validation (1-2-3-4)
            </h4>

            {/* Step 1 */}
            <div className={`p-4 rounded-2xl border transition-all flex items-start gap-3.5 ${activeStep >= 1 ? 'bg-white/5 border-white/10' : 'bg-black/20 border-white/5 opacity-60'}`}>
              <div className="w-8 h-8 rounded-xl bg-brand-gold/20 text-brand-gold font-black text-xs flex items-center justify-center shrink-0 border border-brand-gold/30">
                1
              </div>
              <div className="space-y-1">
                <p className="text-xs font-black uppercase italic text-white">Ouvrez l'App MyNita ou USSD</p>
                <p className="text-[11px] text-gray-300 font-medium leading-relaxed">
                  Lancez votre application MyNita, votre menu opérateur, ou rendez-vous dans le point Nita le plus proche.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className={`p-4 rounded-2xl border transition-all flex items-start gap-3.5 ${activeStep >= 2 ? 'bg-white/5 border-white/10' : 'bg-black/20 border-white/5 opacity-60'}`}>
              <div className="w-8 h-8 rounded-xl bg-brand-gold/20 text-brand-gold font-black text-xs flex items-center justify-center shrink-0 border border-brand-gold/30">
                2
              </div>
              <div className="space-y-1">
                <p className="text-xs font-black uppercase italic text-white">Effectuez le transfert / dépôt</p>
                <p className="text-[11px] text-gray-300 font-medium leading-relaxed">
                  Déposez la somme de <strong className="text-brand-gold">{totalAmount.toLocaleString()} F CFA</strong> vers le numéro <strong className="text-white font-mono">{mynitaPhone}</strong>.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className={`p-4 rounded-2xl border transition-all flex items-start gap-3.5 ${activeStep >= 3 ? 'bg-white/5 border-white/10' : 'bg-black/20 border-white/5 opacity-60'}`}>
              <div className="w-8 h-8 rounded-xl bg-brand-gold/20 text-brand-gold font-black text-xs flex items-center justify-center shrink-0 border border-brand-gold/30">
                3
              </div>
              <div className="flex-1 space-y-1.5">
                <p className="text-xs font-black uppercase italic text-white">Relevez le N° / ID de Transaction</p>
                <p className="text-[11px] text-gray-300 font-medium leading-relaxed">
                  Notez l'identifiant reçu par SMS ou affiché à l'écran de votre téléphone :
                </p>
                <input
                  type="text"
                  placeholder="Ex: NITA-78491, TRX-92841"
                  value={trxId}
                  onChange={(e) => {
                    setTrxId(e.target.value);
                    if (previewUrl) onProofCaptured(previewUrl, e.target.value);
                  }}
                  className="w-full p-3 bg-black/40 border border-brand-orange/40 rounded-xl text-xs font-mono font-bold text-white placeholder-gray-500 focus:outline-none focus:border-brand-orange"
                />
              </div>
            </div>

            {/* Step 4: Camera Scanner */}
            <div className="p-4 sm:p-5 rounded-3xl border-2 border-brand-orange/40 bg-gradient-to-b from-brand-orange/10 to-transparent space-y-3.5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-brand-orange text-white font-black text-xs flex items-center justify-center shrink-0 shadow-md">
                  4
                </div>
                <div>
                  <p className="text-xs font-black uppercase italic text-brand-gold">
                    Photographiez / Scannez le Reçu MyNita
                  </p>
                  <p className="text-[10px] text-gray-300 font-medium">
                    Prenez directement en photo le reçu papier ou la capture d'écran du paiement.
                  </p>
                </div>
              </div>

              {/* Preview of captured receipt */}
              {previewUrl ? (
                <div className="p-4 rounded-2xl bg-emerald-500/15 border-2 border-emerald-500/60 space-y-3 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-emerald-300 flex items-center gap-1.5">
                      <CheckCircle2 size={16} className="text-emerald-400" /> Reçu scanné avec succès !
                    </span>
                    <button
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                      className="text-[9px] font-black uppercase tracking-wider text-amber-300 hover:text-white flex items-center gap-1 bg-white/10 px-2.5 py-1 rounded-lg transition-colors"
                    >
                      <RefreshCw size={12} /> Reprendre
                    </button>
                  </div>

                  <div className="relative rounded-xl overflow-hidden border border-emerald-400/40 bg-black/40 max-h-52 flex items-center justify-center">
                    <img 
                      src={previewUrl} 
                      alt="Reçu MyNita scanné" 
                      className="w-full h-auto max-h-52 object-contain"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {/* DIRECT CAMERA BUTTON (Uses capture="environment") */}
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    disabled={isProcessing}
                    className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-brand-orange via-amber-600 to-amber-500 hover:brightness-110 text-white shadow-xl flex flex-col items-center justify-center gap-2 font-black uppercase italic text-[11px] tracking-wider transition-all active:scale-95 group border border-white/20"
                  >
                    <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-white shadow group-hover:scale-110 transition-transform">
                      <Camera size={26} />
                    </div>
                    <span>Ouvrir l'Appareil Photo</span>
                    <span className="text-[8px] font-normal normal-case opacity-90">Prendre le reçu en photo</span>
                  </button>

                  {/* GALLERY / FILE BUTTON */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isProcessing}
                    className="p-4 sm:p-5 rounded-2xl bg-white/10 hover:bg-white/15 text-white border border-white/10 shadow-lg flex flex-col items-center justify-center gap-2 font-black uppercase italic text-[11px] tracking-wider transition-all active:scale-95 group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-brand-gold shadow group-hover:scale-110 transition-transform">
                      <ImageIcon size={24} />
                    </div>
                    <span>Galerie / Capture</span>
                    <span className="text-[8px] font-normal normal-case opacity-70">Importer une capture d'écran</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Security Notice */}
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3 text-gray-300">
            <ShieldCheck size={20} className="text-emerald-400 shrink-0" />
            <p className="text-[10px] leading-relaxed">
              La commande sera immédiatement transmise en cuisine dès confirmation du reçu par notre équipe.
            </p>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-5 sm:p-6 border-t border-white/10 bg-black/30 flex flex-col sm:flex-row items-center justify-between gap-3 relative z-10">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 text-gray-300 text-xs font-black uppercase italic tracking-wider transition-all"
          >
            Fermer
          </button>

          <button
            type="button"
            onClick={handleConfirmAndClose}
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-brand-gold hover:bg-amber-400 text-brand-brown font-black uppercase italic text-xs tracking-wider flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-all"
          >
            {previewUrl ? 'Valider le Reçu et Continuer' : 'J\'ai Compris, Continuer'}
            <ArrowRight size={16} />
          </button>
        </div>

      </div>
    </div>
  );
};
