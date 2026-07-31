
import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface PasswordInputProps {
  name: string;
  placeholder: string;
  required?: boolean;
  className?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const PasswordInput: React.FC<PasswordInputProps> = ({ name, placeholder, required = false, className = '', onChange }) => {
  const [show, setShow] = useState(false);

  return (
    <div className={`relative ${className}`}>
      <input 
        type={show ? 'text' : 'password'} 
        name={name}
        required={required}
        placeholder={placeholder}
        onChange={onChange}
        className="w-full p-5 bg-gray-50 rounded-2xl text-brand-brown text-xs font-bold outline-none border-2 border-transparent focus:border-brand-orange/20 transition-all pr-14"
      />
      <button 
        type="button"
        onClick={() => setShow(!show)}
        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-gray-300 hover:text-brand-orange transition-colors"
      >
        {show ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
};

export const PasswordInputDark: React.FC<PasswordInputProps> = ({ name, placeholder, required = false, className = '', onChange }) => {
  const [show, setShow] = useState(false);

  return (
    <div className={`relative ${className}`}>
      <input 
        type={show ? 'text' : 'password'} 
        name={name}
        required={required}
        placeholder={placeholder}
        onChange={onChange}
        className="w-full p-5 bg-white/5 rounded-2xl text-white text-xs font-bold outline-none border border-white/10 focus:border-brand-gold transition-all pr-14"
      />
      <button 
        type="button"
        onClick={() => setShow(!show)}
        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-white/20 hover:text-brand-gold transition-colors"
      >
        {show ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
};
