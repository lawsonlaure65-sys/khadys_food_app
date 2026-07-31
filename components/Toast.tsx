
import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const config = {
    success: { icon: CheckCircle2, color: 'bg-green-500', label: 'Succès' },
    error: { icon: AlertCircle, color: 'bg-red-500', label: 'Erreur' },
    info: { icon: Info, color: 'bg-blue-500', label: 'Info' }
  };

  const { icon: Icon, color, label } = config[type];

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] animate-slide-up px-6 py-4 rounded-[2rem] shadow-2xl flex items-center gap-4 min-w-[300px] border border-white/20 backdrop-blur-xl text-white bg-black/80">
      <div className={`w-10 h-10 ${color} rounded-2xl flex items-center justify-center shadow-lg`}>
        <Icon size={20} />
      </div>
      <div className="flex-1">
        <p className="text-[10px] font-black uppercase opacity-50 tracking-widest">{label}</p>
        <p className="text-xs font-bold">{message}</p>
      </div>
      <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
        <X size={16} />
      </button>
    </div>
  );
};

export default Toast;
