
import React from 'react';
import { LOGO_URL } from '../constants';

interface KhadyLogoProps {
  className?: string;
  variant?: 'light' | 'dark';
}

export const KhadyLogo: React.FC<KhadyLogoProps> = ({ className = '', variant = 'dark' }) => {
  return (
    <div className={`flex items-center select-none ${className}`}>
      <div className="relative w-14 h-14 overflow-hidden rounded-full border-2 border-brand-brown/10 shadow-md">
        <img 
          src={LOGO_URL} 
          alt="Khady's Food Logo" 
          className="w-full h-full object-cover"
        />
      </div>
      <div className="ml-3 flex flex-col justify-center">
        <span className={`font-black text-sm italic uppercase tracking-tighter ${variant === 'light' ? 'text-brand-gold' : 'text-brand-brown'} leading-none`}>
          Khady's
        </span>
        <span className={`font-black text-[9px] uppercase tracking-[0.2em] ${variant === 'light' ? 'text-white/60' : 'text-brand-orange'} leading-none mt-1`}>
          Food & Event
        </span>
      </div>
    </div>
  );
};
