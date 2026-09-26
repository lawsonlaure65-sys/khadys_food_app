import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'fr' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, fallback?: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  fr: {
    'nav.home': 'Accueil',
    'nav.menu': 'Menu',
    'nav.gallery': 'Galerie',
    'nav.video': 'Démo 4K',
    'nav.whatsapp': 'WhatsApp',
    'nav.cart': 'Panier',
    'nav.profile': 'Moi',
    'settings.config_contact': 'Configuration & Contact',
    'settings.contact_settings': 'CONTACT & PARAMÈTRES',
    'settings.lang_selector': 'Langue de l\'application',
    'settings.lang_desc': 'Choisissez la langue de l\'interface d\'affichage',
    'settings.french': 'Français (FR)',
    'settings.english': 'English (EN)',
    'settings.appearance_notifications': 'Apparences & Notifications',
    'settings.dark_mode_title': 'Thème Nuit Or',
    'settings.dark_mode_desc': 'Ajustement sombre pour la soirée',
    'settings.notif_title': 'Avis & Offres Flash',
    'settings.notif_desc': 'Statut de commande en direct',
    'settings.contacts_support': 'Contacts & Assistance',
    'common.search': 'Rechercher',
    'common.back': 'Retour',
    'common.close': 'Fermer',
    'common.confirm': 'Confirmer',
    'common.cancel': 'Annuler'
  },
  en: {
    'nav.home': 'Home',
    'nav.menu': 'Menu',
    'nav.gallery': 'Gallery',
    'nav.video': '4K Demo',
    'nav.whatsapp': 'WhatsApp',
    'nav.cart': 'Cart',
    'nav.profile': 'Profile',
    'settings.config_contact': 'Configuration & Contact',
    'settings.contact_settings': 'CONTACT & SETTINGS',
    'settings.lang_selector': 'App Language',
    'settings.lang_desc': 'Choose display interface language',
    'settings.french': 'Français (FR)',
    'settings.english': 'English (EN)',
    'settings.appearance_notifications': 'Appearance & Notifications',
    'settings.dark_mode_title': 'Golden Dark Theme',
    'settings.dark_mode_desc': 'Dark adjustment for evening viewing',
    'settings.notif_title': 'Alerts & Flash Offers',
    'settings.notif_desc': 'Live order status notifications',
    'settings.contacts_support': 'Contacts & Support',
    'common.search': 'Search',
    'common.back': 'Back',
    'common.close': 'Close',
    'common.confirm': 'Confirm',
    'common.cancel': 'Cancel'
  }
};

const LanguageContext = createContext<LanguageContextType>({
  language: 'fr',
  setLanguage: () => {},
  t: (key: string, fallback?: string) => fallback || key,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('khadys_language');
    if (saved === 'fr' || saved === 'en') return saved;
    return 'fr';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('khadys_language', lang);
    document.documentElement.lang = lang;
  };

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const t = (key: string, fallback?: string): string => {
    return translations[language]?.[key] || fallback || translations['fr']?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
