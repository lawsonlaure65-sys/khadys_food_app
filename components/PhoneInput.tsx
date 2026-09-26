
import React, { useState, useEffect } from 'react';
import { ChevronDown, CheckCircle2, AlertCircle, Phone } from 'lucide-react';

interface Country {
  code: string;
  flag: string;
  dialCode: string;
  expectedDigits: number;
}

const countries: Country[] = [
  { code: 'NE', flag: '🇳🇪', dialCode: '+227', expectedDigits: 8 },
  { code: 'BF', flag: '🇧🇫', dialCode: '+226', expectedDigits: 8 },
  { code: 'BJ', flag: '🇧🇯', dialCode: '+229', expectedDigits: 8 },
  { code: 'CI', flag: '🇨🇮', dialCode: '+225', expectedDigits: 10 },
  { code: 'ML', flag: '🇲🇱', dialCode: '+223', expectedDigits: 8 },
  { code: 'SN', flag: '🇸🇳', dialCode: '+221', expectedDigits: 9 },
  { code: 'FR', flag: '🇫🇷', dialCode: '+33', expectedDigits: 9 },
];

interface PhoneInputProps {
  value: string;
  onChange: (fullNumber: string) => void;
  onValidityChange?: (isValid: boolean, formattedFullNumber: string) => void;
  className?: string;
  required?: boolean;
  showValidationBadge?: boolean;
}

export const PhoneInput: React.FC<PhoneInputProps> = ({ 
  value, 
  onChange, 
  onValidityChange, 
  className = '', 
  required = false,
  showValidationBadge = true 
}) => {
  const [selectedCountry, setSelectedCountry] = useState(countries[0]);
  const [rawDigits, setRawDigits] = useState('');

  // Extract initial digits if value is passed from props
  useEffect(() => {
    if (value) {
      const country = countries.find(c => value.startsWith(c.dialCode)) || countries[0];
      setSelectedCountry(country);
      const digits = value.replace(country.dialCode, '').replace(/\D/g, '');
      if (digits !== rawDigits) {
        setRawDigits(digits.slice(0, country.expectedDigits));
      }
    }
  }, [value]);

  // Format digits automatically into spaced groups (e.g. 96 12 34 56)
  const formatLocalNumber = (digits: string, country: Country) => {
    if (!digits) return '';
    if (country.expectedDigits === 8) {
      // Group by pairs: XX XX XX XX
      return digits.match(/.{1,2}/g)?.join(' ') || digits;
    } else if (country.expectedDigits === 9 || country.expectedDigits === 10) {
      // Group by pairs: XX XX XX XX XX
      return digits.match(/.{1,2}/g)?.join(' ') || digits;
    }
    return digits.match(/.{1,2}/g)?.join(' ') || digits;
  };

  const formattedLocal = formatLocalNumber(rawDigits, selectedCountry);
  const isValid = rawDigits.length === selectedCountry.expectedDigits;
  const fullFormattedNumber = rawDigits ? `${selectedCountry.dialCode} ${formattedLocal}` : '';

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, selectedCountry.expectedDigits);
    setRawDigits(digits);
    const formatted = formatLocalNumber(digits, selectedCountry);
    const full = digits ? `${selectedCountry.dialCode} ${formatted}` : '';
    const valid = digits.length === selectedCountry.expectedDigits;

    onChange(full);
    if (onValidityChange) {
      onValidityChange(valid, full);
    }
  };

  const handleCountrySelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const country = countries.find(c => c.dialCode === e.target.value) || countries[0];
    setSelectedCountry(country);
    const truncatedDigits = rawDigits.slice(0, country.expectedDigits);
    setRawDigits(truncatedDigits);
    const formatted = formatLocalNumber(truncatedDigits, country);
    const full = truncatedDigits ? `${country.dialCode} ${formatted}` : '';
    const valid = truncatedDigits.length === country.expectedDigits;

    onChange(full);
    if (onValidityChange) {
      onValidityChange(valid, full);
    }
  };

  return (
    <div className="space-y-1.5">
      <div className={`flex gap-2 relative ${className}`}>
        {/* Country Selector dropdown */}
        <div className="relative flex-shrink-0">
          <div className="flex items-center gap-2 h-full px-4 bg-white/5 border border-white/10 rounded-2xl cursor-pointer hover:border-brand-gold transition-all">
            <span className="text-xl">{selectedCountry.flag}</span>
            <span className="text-[10px] font-bold text-white/70">{selectedCountry.dialCode}</span>
            <ChevronDown size={12} className="text-white/40" />
          </div>
          <select 
            className="absolute inset-0 opacity-0 cursor-pointer"
            onChange={handleCountrySelect}
            value={selectedCountry.dialCode}
          >
            {countries.map(c => (
              <option key={c.code} value={c.dialCode} className="bg-brand-brown text-white">
                {c.flag} {c.code} ({c.dialCode}) - {c.expectedDigits} chiffres
              </option>
            ))}
          </select>
        </div>

        {/* Formatted Phone Input */}
        <div className="relative flex-1">
          <input 
            type="tel" 
            required={required}
            placeholder={`Ex: ${selectedCountry.expectedDigits === 8 ? '96 12 34 56' : '06 12 34 56 78'}`}
            className={`w-full p-5 pr-12 bg-white/5 rounded-2xl text-white text-xs font-mono font-bold outline-none border transition-all ${
              isValid 
                ? 'border-emerald-500/80 focus:border-emerald-400 bg-emerald-500/5' 
                : rawDigits.length > 0 
                  ? 'border-amber-500/60 focus:border-amber-400' 
                  : 'border-white/10 focus:border-brand-gold'
            }`}
            value={formattedLocal}
            onChange={handleNumberChange}
          />
          {/* Validity Status Icon */}
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center">
            {isValid ? (
              <CheckCircle2 size={18} className="text-emerald-400 animate-pulse" />
            ) : rawDigits.length > 0 ? (
              <AlertCircle size={18} className="text-amber-400" />
            ) : (
              <Phone size={16} className="text-white/20" />
            )}
          </div>
        </div>
      </div>

      {/* Helper & Validation Badge */}
      {showValidationBadge && (
        <div className="flex items-center justify-between text-[9px] px-2 font-bold">
          {isValid ? (
            <span className="text-emerald-400 flex items-center gap-1">
              <CheckCircle2 size={12} /> Format valide ({selectedCountry.expectedDigits} chiffres confirmés)
            </span>
          ) : rawDigits.length > 0 ? (
            <span className="text-amber-300">
              ⚠️ Reste {selectedCountry.expectedDigits - rawDigits.length} chiffre(s) à saisir
            </span>
          ) : (
            <span className="text-white/40">
              Format automatique pour {selectedCountry.code} ({selectedCountry.expectedDigits} chiffres)
            </span>
          )}
          <span className="text-white/30 font-mono">{rawDigits.length}/{selectedCountry.expectedDigits}</span>
        </div>
      )}
    </div>
  );
};

