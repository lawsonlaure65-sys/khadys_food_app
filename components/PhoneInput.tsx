
import React, { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface Country {
  code: string;
  flag: string;
  dialCode: string;
}

const countries: Country[] = [
  { code: 'NE', flag: '🇳🇪', dialCode: '+227' },
  { code: 'BF', flag: '🇧🇫', dialCode: '+226' },
  { code: 'BJ', flag: '🇧🇯', dialCode: '+229' },
  { code: 'CI', flag: '🇨🇮', dialCode: '+225' },
  { code: 'ML', flag: '🇲🇱', dialCode: '+223' },
  { code: 'SN', flag: '🇸🇳', dialCode: '+221' },
  { code: 'FR', flag: '🇫🇷', dialCode: '+33' },
];

interface PhoneInputProps {
  value: string;
  onChange: (fullNumber: string) => void;
  className?: string;
  required?: boolean;
}

export const PhoneInput: React.FC<PhoneInputProps> = ({ value, onChange, className = '', required = false }) => {
  const parseValue = (val: string) => {
    if (!val) return { country: countries[0], number: '' };
    const clean = val.trim();
    const matched = countries.find(c => clean.startsWith(c.dialCode));
    if (matched) {
      const rest = clean.slice(matched.dialCode.length).trim();
      return { country: matched, number: rest.replace(/\D/g, '') };
    }
    return { country: countries[0], number: clean.replace(/\D/g, '') };
  };

  const initial = parseValue(value);
  const [selectedCountry, setSelectedCountry] = useState<Country>(initial.country);
  const [localNumber, setLocalNumber] = useState<string>(initial.number);

  useEffect(() => {
    if (value) {
      const parsed = parseValue(value);
      setSelectedCountry(parsed.country);
      setLocalNumber(parsed.number);
    }
  }, [value]);

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '');
    setLocalNumber(val);
    const full = val ? `${selectedCountry.dialCode} ${val}` : `${selectedCountry.dialCode}`;
    onChange(full);
  };

  const handleCountryChange = (dialCode: string) => {
    const country = countries.find(c => c.dialCode === dialCode);
    if (country) {
      setSelectedCountry(country);
      const full = localNumber ? `${country.dialCode} ${localNumber}` : `${country.dialCode}`;
      onChange(full);
    }
  };

  const isLight = className.includes('bg-gray') || className.includes('text-brand-brown');

  return (
    <div className={`flex gap-2 ${className}`}>
      <div className="relative flex-shrink-0">
        <div className={`flex items-center gap-2 h-full px-4 rounded-2xl cursor-pointer transition-all border ${
          isLight 
            ? 'bg-gray-50 border-gray-100 text-brand-brown hover:border-brand-orange/30' 
            : 'bg-white/5 border-white/10 text-white hover:border-brand-gold'
        }`}>
          <span className="text-xl">{selectedCountry.flag}</span>
          <span className={`text-[10px] font-bold ${isLight ? 'text-brand-brown/70' : 'text-white/50'}`}>{selectedCountry.dialCode}</span>
          <ChevronDown size={12} className={isLight ? 'text-brand-brown/30' : 'text-white/20'} />
        </div>
        <select 
          className="absolute inset-0 opacity-0 cursor-pointer"
          onChange={(e) => handleCountryChange(e.target.value)}
          value={selectedCountry.dialCode}
        >
          {countries.map(c => (
            <option key={c.code} value={c.dialCode} className="bg-brand-brown text-white">
              {c.flag} {c.code} ({c.dialCode})
            </option>
          ))}
        </select>
      </div>
      <input 
        type="tel" 
        required={required}
        placeholder="Téléphone"
        className={`flex-1 p-5 rounded-2xl text-xs font-bold outline-none border transition-all ${
          isLight 
            ? 'bg-gray-50 text-brand-brown border-gray-100 focus:border-brand-orange/30 placeholder:text-gray-300' 
            : 'bg-white/5 text-white border-white/10 focus:border-brand-gold placeholder:text-white/30'
        }`}
        value={localNumber}
        onChange={handleNumberChange}
      />
    </div>
  );
};
