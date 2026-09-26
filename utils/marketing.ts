import { Order, MenuItem } from '../types';
import { RESTAURANT_INFO, BILLO_INFO } from '../constants';
import { openWhatsApp, cleanPhoneNumber } from './whatsapp';
import { db } from '../lib/supabase';

export interface PromoCode {
  id: string;
  code: string;
  type: 'PERCENT' | 'FIXED' | 'GIFT';
  value: number; // e.g. 20 (pour 20%) ou 1000 (pour 1000 F CFA)
  minOrder: number;
  isActive: boolean;
  usageCount: number;
  description: string;
  targetCategory?: string;
  expiryDate?: string;
}

export interface AnnouncementBanner {
  isEnabled: boolean;
  text: string;
  highlight: string;
  badge: string;
  promoCode?: string;
  bgGradient: 'orange' | 'gold' | 'emerald' | 'purple' | 'red';
  linkTarget: 'MENU' | 'CART' | 'TRAITEUR' | 'HOME';
}

export interface MarketingCampaign {
  id: string;
  title: string;
  category: 'FLASH' | 'MENU_DU_JOUR' | 'WEEKEND' | 'BUFFET' | 'FIDELITE' | 'CUSTOM';
  headline: string;
  bodyText: string;
  promoCode?: string;
  suggestedPromo?: string;
  createdAt?: string;
  status?: 'DRAFT' | 'PUBLISHED' | 'SCHEDULED';
}

export type PosterTheme = 'LUXURY_GOLD' | 'SAHEL_TERRACOTTA' | 'WOOD_FIRE' | 'MODERN_EMERALD';
export type PosterFormat = 'SQUARE_POST' | 'STORY_PORTRAIT' | 'BANNER_LANDSCAPE';
export type PosterLayout = 'TRIO_POSTER' | 'SINGLE_DISH';
export type PublicationTiming = 'TONIGHT_FOR_TOMORROW' | 'TODAY_LUNCH';

export interface MenuDuJourDishItem {
  id: string;
  type: 'PLAT_DU_JOUR' | 'DOUKOUNOU' | 'ATTIEKE' | 'CUSTOM';
  dishName: string;
  badgeLabel: string; // e.g. "🍲 Plat Cuisiné du Jour", "🌽 Incontournable Doukounou", "🐟 Incontournable Attiéké"
  badgeColor?: string;
  tagline: string;
  description: string;
  accompaniments: string;
  price: number;
  promoPrice?: number;
  dishImage: string;
  remainingStock: number;
  isDailyPermanent?: boolean; // true for Doukounou & Attiéké
  isAvailable: boolean;
}

export interface MenuDuJourConfig {
  id: string;
  date: string;
  targetDayLabel?: string; // e.g., "Demain Midi", "Ce Midi", "Vendredi 14 Août"
  publicationTiming: PublicationTiming; // Posté la veille au soir vs ce matin
  title: string;
  tagline: string;
  dishes: MenuDuJourDishItem[]; // Array containing at least 3 daily dishes
  
  // Backward compatibility fields matching dishes[0]
  dishName: string;
  description: string;
  accompaniments: string;
  price: number;
  promoPrice?: number;
  dishImage: string;
  remainingStock: number;

  chefQuote: string;
  promoCode?: string;
  deliveryTime: string;
  isActive: boolean;
  posterTheme: PosterTheme;
  posterFormat: PosterFormat;
  posterLayout?: PosterLayout; // 'TRIO_POSTER' (Plat du jour en haut en grand + Doukounou & Attiéké en bas) ou 'SINGLE_DISH'
  marketingTextWhatsApp: string;
  marketingTextStatusShort?: string; // Format court < 7 lignes spécial Statut WhatsApp & Stories
  marketingTextGroups: string;
  marketingTextSocial: string;
  marketingTextEveningTeaser: string;
  marketingTextEveningStatusShort?: string; // Teaser court < 7 lignes spécial Statut Veille
  hashtags: string;
}

// Alias for backward compatibility
export type PlatDuJourConfig = MenuDuJourConfig;

export interface FlashDealConfig {
  isEnabled: boolean;
  dishName: string;
  dishPrice: number;
  promoPrice: number;
  discountPercent: number;
  remainingStock: number;
  totalStock: number;
  dishImage: string;
  durationHours: number;
  expiresAt: string;
}

// Default initial promo codes
export const INITIAL_PROMO_CODES: PromoCode[] = [
  {
    id: 'promo-1',
    code: 'KHADY24',
    type: 'PERCENT',
    value: 15,
    minOrder: 4000,
    isActive: true,
    usageCount: 48,
    description: '15% de remise sur toute la carte Khady\'s Food',
    expiryDate: '2026-12-31'
  },
  {
    id: 'promo-2',
    code: 'FLASH20',
    type: 'PERCENT',
    value: 20,
    minOrder: 5000,
    isActive: true,
    usageCount: 29,
    description: '20% de réduction immédiate sur Spécialités & Tieps',
    expiryDate: '2026-09-30'
  },
  {
    id: 'promo-3',
    code: 'BIENVENUE',
    type: 'FIXED',
    value: 1000,
    minOrder: 6000,
    isActive: true,
    usageCount: 15,
    description: '1 000 F CFA de réduction offerte sur votre première commande',
    expiryDate: '2026-12-31'
  },
  {
    id: 'promo-4',
    code: 'BUFFETPRO',
    type: 'PERCENT',
    value: 15,
    minOrder: 25000,
    isActive: true,
    usageCount: 8,
    description: '15% de remise sur les Packs Buffets d\'Entreprise',
    expiryDate: '2026-12-31'
  },
  {
    id: 'promo-5',
    code: 'BISSAPFREE',
    type: 'GIFT',
    value: 1000,
    minOrder: 4500,
    isActive: true,
    usageCount: 34,
    description: '1 Grande Boisson Bissap Glacée 100% naturelle offerte',
    expiryDate: '2026-10-31'
  }
];

// Default announcement banner
export const INITIAL_BANNER: AnnouncementBanner = {
  isEnabled: true,
  text: 'Offre Spéciale du Moment : -15% sur toutes vos commandes avec le code',
  highlight: 'KHADY24',
  badge: 'VENTE FLASH 🔥',
  promoCode: 'KHADY24',
  bgGradient: 'orange',
  linkTarget: 'MENU'
};

// Default Flash Deal Config
export const INITIAL_FLASH_DEAL: FlashDealConfig = {
  isEnabled: true,
  dishName: 'Pack Duo Grillades Suya + 2 Jus Bissap',
  dishPrice: 8500,
  promoPrice: 5500,
  discountPercent: 35,
  remainingStock: 4,
  totalStock: 20,
  dishImage: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=1000',
  durationHours: 4,
  expiresAt: new Date(Date.now() + 4 * 3600 * 1000).toISOString()
};

// Default 3 Daily Dishes (Plat Cuisiné du Jour + Doukounou Incontournable + Attiéké Incontournable)
export const DEFAULT_MENU_DU_JOUR_DISHES: MenuDuJourDishItem[] = [
  {
    id: 'dish-plat-du-jour',
    type: 'PLAT_DU_JOUR',
    dishName: 'Tiep Rouge Royal au Capitaine',
    badgeLabel: '🍲 Plat Cuisiné du Jour',
    badgeColor: 'bg-brand-orange text-white',
    tagline: 'Mijoté du jour avec légumes frais et poisson braisé',
    description: 'Riz rouge sénégalais parfumé, tranche de capitaine braisé, carottes glacées, manioc fondant, chou braisé et sauce pimentée maison.',
    accompaniments: 'Alloco doré croustillant + Piment vert maison',
    price: 5500,
    promoPrice: 4950,
    dishImage: 'https://images.unsplash.com/photo-1627308595229-7830a5c91f9f?w=1000',
    remainingStock: 25,
    isDailyPermanent: false,
    isAvailable: true
  },
  {
    id: 'dish-doukounou',
    type: 'DOUKOUNOU',
    dishName: 'Le Fameux Doukounou de Khady',
    badgeLabel: '🌽 Incontournable Doukounou',
    badgeColor: 'bg-amber-600 text-white',
    tagline: 'Spécialité maison au programme chaque jour d\'office',
    description: 'Le célèbre gâteau de maïs vapeur traditionnel au Sahel, cuit à point, tendre et moelleux, servi chaud avec sa sauce mijotée de la maison, piment vert doux et poisson frit ou poulet braisé.',
    accompaniments: 'Sauce tomate mijotée + Piment vert de la Cheffe + Poisson frit',
    price: 3000,
    promoPrice: 2700,
    dishImage: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=1000',
    remainingStock: 30,
    isDailyPermanent: true,
    isAvailable: true
  },
  {
    id: 'dish-attieke',
    type: 'ATTIEKE',
    dishName: 'L\'Incontournable Attiéké Royal',
    badgeLabel: '🐟 Incontournable Attiéké',
    badgeColor: 'bg-emerald-600 text-white',
    tagline: 'Spécialité maison au programme chaque jour d\'office',
    description: 'La semoule de manioc attiéké fraîche et aérée de Cheffe Khady, servie avec darne de poisson capitaine braisée ou poulet croustillant, oignons doux marinés, tomates et piment vert maison.',
    accompaniments: 'Poisson capitaine braisé au feu de bois + Alloco doré + Oignons marinés',
    price: 4500,
    promoPrice: 4000,
    dishImage: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=1000',
    remainingStock: 30,
    isDailyPermanent: true,
    isAvailable: true
  }
];

// Default Initial Menu du Jour (Trio Quotidien)
export const INITIAL_MENU_DU_JOUR: MenuDuJourConfig = {
  id: 'mdj-today',
  date: new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date()),
  targetDayLabel: 'Demain Mercredi Midi',
  publicationTiming: 'TONIGHT_FOR_TOMORROW',
  posterTheme: 'LUXURY_GOLD',
  posterFormat: 'SQUARE_POST',
  posterLayout: 'TRIO_POSTER',
  title: 'Menu du Jour — Le Trio Gourmand',
  tagline: 'Nos 3 délices au programme quotidien chez Khady\'s Food',
  dishes: DEFAULT_MENU_DU_JOUR_DISHES,
  
  // Compatibility fields pointing to dish 0 (Plat cuisiné du jour)
  dishName: DEFAULT_MENU_DU_JOUR_DISHES[0].dishName,
  description: DEFAULT_MENU_DU_JOUR_DISHES[0].description,
  accompaniments: DEFAULT_MENU_DU_JOUR_DISHES[0].accompaniments,
  price: DEFAULT_MENU_DU_JOUR_DISHES[0].price,
  promoPrice: DEFAULT_MENU_DU_JOUR_DISHES[0].promoPrice,
  dishImage: DEFAULT_MENU_DU_JOUR_DISHES[0].dishImage,
  remainingStock: DEFAULT_MENU_DU_JOUR_DISHES[0].remainingStock,

  chefQuote: '« Chaque jour, retrouvez d\'office notre Doukounou et notre Attiéké en plus de notre Plat Cuisiné du Jour ! » — Cheffe Khady',
  promoCode: 'KHADY24',
  deliveryTime: '11h30 - 14h30',
  isActive: true,
  marketingTextWhatsApp: `*🍲 MENU DU JOUR CHEZ KHADY'S FOOD ! 🍲*\n` +
    `✨ *Le Trio Gourmand d'Excellence du Jour* ✨\n\n` +
    `Cheffe Khady vous présente le menu complet du déjeuner :\n\n` +
    `1️⃣ 🍲 *PLAT DU JOUR : ${DEFAULT_MENU_DU_JOUR_DISHES[0].dishName.toUpperCase()}*\n` +
    `😋 ${DEFAULT_MENU_DU_JOUR_DISHES[0].description}\n` +
    `💰 Tarif Promo : *${DEFAULT_MENU_DU_JOUR_DISHES[0].promoPrice?.toLocaleString('fr-FR')} F CFA* (au lieu de ${DEFAULT_MENU_DU_JOUR_DISHES[0].price.toLocaleString('fr-FR')} F)\n\n` +
    `2️⃣ 🌽 *LE FAMEUX DOUKOUNOU (Incontournable Quotidien) :*\n` +
    `😋 ${DEFAULT_MENU_DU_JOUR_DISHES[1].description}\n` +
    `💰 Tarif Promo : *${DEFAULT_MENU_DU_JOUR_DISHES[1].promoPrice?.toLocaleString('fr-FR')} F CFA*\n\n` +
    `3️⃣ 🐟 *L'INCONTOURNABLE ATTIÉKÉ ROYAL (Incontournable Quotidien) :*\n` +
    `😋 ${DEFAULT_MENU_DU_JOUR_DISHES[2].description}\n` +
    `💰 Tarif Promo : *${DEFAULT_MENU_DU_JOUR_DISHES[2].promoPrice?.toLocaleString('fr-FR')} F CFA*\n\n` +
    `🛵 *Livraison Express Niamey :* Livré brûlant en moins de 35 min par Billo Express !\n\n` +
    `👉 *Commandez votre plat favori ou le trio complet :*\n` +
    `https://wa.me/${RESTAURANT_INFO.whatsappClean}?text=Bonjour%20je%20souhaite%20commander%20le%20Menu%20du%20Jour\n\n` +
    `_Khady's Food & Event — L'excellence culinaire au Sahel_`,
  marketingTextStatusShort: `🍲 *MENU DU JOUR • KHADY'S FOOD* 🍲\n` +
    `1️⃣ 🍲 ${DEFAULT_MENU_DU_JOUR_DISHES[0].dishName} (${DEFAULT_MENU_DU_JOUR_DISHES[0].promoPrice?.toLocaleString('fr-FR')} F)\n` +
    `2️⃣ 🌽 Doukounou Royal (${DEFAULT_MENU_DU_JOUR_DISHES[1].promoPrice?.toLocaleString('fr-FR')} F)\n` +
    `3️⃣ 🐟 Attiéké Poisson (${DEFAULT_MENU_DU_JOUR_DISHES[2].promoPrice?.toLocaleString('fr-FR')} F)\n` +
    `🛵 Livré dès 12h00 par Billo Express\n` +
    `👉 Commandez au ${RESTAURANT_INFO.whatsapp}`,
  marketingTextGroups: `*🍲 ALERTE MENU DU JOUR — KHADY'S FOOD 🍲*\n\n` +
    `Bonjour à tous ! Voici les 3 délices au menu du jour :\n` +
    `1️⃣ 🍲 *${DEFAULT_MENU_DU_JOUR_DISHES[0].dishName}* — ${DEFAULT_MENU_DU_JOUR_DISHES[0].promoPrice?.toLocaleString('fr-FR')} F\n` +
    `2️⃣ 🌽 *Le Fameux Doukounou* — ${DEFAULT_MENU_DU_JOUR_DISHES[1].promoPrice?.toLocaleString('fr-FR')} F\n` +
    `3️⃣ 🐟 *L'Incontournable Attiéké* — ${DEFAULT_MENU_DU_JOUR_DISHES[2].promoPrice?.toLocaleString('fr-FR')} F\n\n` +
    `⚡ Commandes groupées d'entreprise acceptées avec livraison rapide.\n` +
    `📲 Commande WhatsApp : https://wa.me/${RESTAURANT_INFO.whatsappClean}`,
  marketingTextSocial: `✨ 𝐌𝐄𝐍𝐔 𝐃𝐔 𝐉𝐎𝐔𝐑 | 𝐊𝐇𝐀𝐃𝐘'𝐒 𝐅𝐎𝐎𝐃 & 𝐄𝐕𝐄𝐍𝐓 ✨\n\n` +
    `Aujourd'hui, retrouvez notre Trio Gourmand d'office :\n\n` +
    `🍲 1. *${DEFAULT_MENU_DU_JOUR_DISHES[0].dishName}* (${DEFAULT_MENU_DU_JOUR_DISHES[0].promoPrice?.toLocaleString('fr-FR')} F CFA)\n` +
    `🌽 2. *Le Fameux Doukounou de Khady* (${DEFAULT_MENU_DU_JOUR_DISHES[1].promoPrice?.toLocaleString('fr-FR')} F CFA)\n` +
    `🐟 3. *L'Incontournable Attiéké Royal* (${DEFAULT_MENU_DU_JOUR_DISHES[2].promoPrice?.toLocaleString('fr-FR')} F CFA)\n\n` +
    `📍 Disponible en livraison partout à Niamey ou à emporter.\n` +
    `📲 Commandez par WhatsApp au ${RESTAURANT_INFO.whatsapp}\n\n` +
    `#KhadyFood #MenuDuJour #Doukounou #Attieke #PlatDuJour #Niamey #BilloExpress #CuisineAfricaine`,
  marketingTextEveningTeaser: `🌙 *AU MENU DEMAIN MIDI CHEZ KHADY'S FOOD !* 🍲✨\n\n` +
    `Chers gourmets, anticipez votre déjeuner ! Demain retrouvez notre Trio Quotidien :\n` +
    `1️⃣ 🍲 *${DEFAULT_MENU_DU_JOUR_DISHES[0].dishName.toUpperCase()}*\n` +
    `2️⃣ 🌽 *LE FAMEUX DOUKOUNOU ROYAL*\n` +
    `3️⃣ 🐟 *L'INCONTOURNABLE ATTIÉKÉ POISSON BRAISÉ*\n\n` +
    `🛵 *Livraison garantie dès 12h00 précises à Niamey par Billo Express.*\n` +
    `👉 *Réservez dès ce soir :* https://wa.me/${RESTAURANT_INFO.whatsappClean}?text=Bonsoir%20je%20réserve%20le%20Menu%20du%20Jour\n\n` +
    `_Khady's Food & Event — Toujours un plaisir de vous régaler !_ 🌟`,
  marketingTextEveningStatusShort: `🌙 *AU MENU DEMAIN MIDI !* 🍲✨\n` +
    `1️⃣ 🍲 ${DEFAULT_MENU_DU_JOUR_DISHES[0].dishName}\n` +
    `2️⃣ 🌽 Doukounou de Khady\n` +
    `3️⃣ 🐟 Attiéké Royal\n` +
    `🛵 Livré dès 12h par Billo • Stock limité\n` +
    `👉 Réservez ce soir : ${RESTAURANT_INFO.whatsapp}`,
  hashtags: '#KhadyFood #MenuDuJour #Doukounou #Attieke #PlatDuJour #Niamey #CuisineAfricaine #BilloExpress #FoodNiamey'
};

// Backward compatibility alias
export const INITIAL_PLAT_DU_JOUR: PlatDuJourConfig = INITIAL_MENU_DU_JOUR;

// Preset catalog for fast 1-click Plat du Jour daily configuration
export const PLAT_DU_JOUR_PRESETS = [
  {
    id: 'preset-tiep-merou',
    name: 'Tiep Royal Rouge au Mérou Frais',
    category: 'Spécialité Maison',
    tagline: 'Le grand classique sénégalais aux saveurs iodées',
    description: 'Riz rouge sénégalais parfumé, tranche de mérou braisé, carottes glacées, manioc fondant, chou braisé et sauce pimentée maison.',
    accompaniments: 'Alloco doré croustillant + 1 Bouteille de Jus Bissap Frais 50cl',
    price: 5500,
    promoPrice: 4500,
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=1000',
    chefQuote: '« Cuisiné lentement au feu de bois avec des épices fraîches sélectionnées ce matin. » — Cheffe Khady',
    badge: '👑 BEST-SELLER'
  },
  {
    id: 'preset-dibi-agneau',
    name: 'Dibi d’Agneau Braisé au Feu de Bois',
    category: 'Spécialité Maison',
    tagline: 'Viande d\'agneau tendre marinée aux épices kankan & moutarde',
    description: 'Morceaux choisis d\'agneau grillés à la flamme vive, enrobés d\'épices sahéliennes fumées, accompagnés d\'oignons caramélisés et piments doux.',
    accompaniments: 'Bananes Alloco + Frites d\'igname dorées + Jus Baobab Bouye glacé',
    price: 6000,
    promoPrice: 5000,
    image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=1000',
    chefQuote: '« Une viande persillée et croustillante qui fond littéralement sous le palais. » — Cheffe Khady',
    badge: '🥩 FESTIN CARNIVORE'
  },
  {
    id: 'preset-mafe-boeuf',
    name: 'Mafé Onctueux au Bœuf Tendre & Pâte d\'Arachide',
    category: 'Plat Africain',
    tagline: 'Sauce arachide veloutée mijotée à l\'ancienne',
    description: 'Morceaux de bœuf braisé fondant dans une sauce onctueuse à la pâte d\'arachide grillée artisanale, patates douces et carottes confites.',
    accompaniments: 'Riz blanc parfumé jasmin + Alloco + Jus de Tamarin glacé',
    price: 4500,
    promoPrice: 4000,
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=1000',
    chefQuote: '« La sauce arachide réconfortante de nos grands-mères dans toute sa noblesse. » — Cheffe Khady',
    badge: '🥜 DOUCEUR & TRADITION'
  },
  {
    id: 'preset-yassa-poulet',
    name: 'Poulet Braisé Yassa au Citron Vert & Oignons Doux',
    category: 'Plat Africain',
    tagline: 'Marinade citronnée aux oignons compotés et moutarde de Dijon',
    description: 'Cuisse de poulet fermier rôtie puis confite dans une marmite d\'oignons caramélisés, jus de citron vert pressé et olives vertes.',
    accompaniments: 'Riz blanc parfumé + Tranches d\'avocat frais + Jus Bissap Menthe',
    price: 4500,
    promoPrice: 3800,
    image: 'https://images.unsplash.com/photo-1562967914-608f82629710?w=1000',
    chefQuote: '« L’acidité parfumée du citron et la douceur des oignons fondants. » — Cheffe Khady',
    badge: '🍋 FRAÎCHEUR & SAVEUR'
  },
  {
    id: 'preset-box-gombo',
    name: 'Box Sauce Gombo Frais & Viande Fumée',
    category: 'Box Sauce',
    tagline: 'Sauce gluante traditionnelle aux arômes intenses de poisson fumé',
    description: 'Gombo frais battu au mortier, crevettes séchées, morceaux de viande tendre et poisson fumé du fleuve Niger avec bouillon relevé.',
    accompaniments: 'Pâte de maïs blanc ou Riz brisé + Piment vert écrasé',
    price: 4000,
    promoPrice: 3500,
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=1000',
    chefQuote: '« Un plat authentique et tonique préparé selon les recettes ancestrales. » — Cheffe Khady',
    badge: '🌿 PUR SAHEL'
  },
  {
    id: 'preset-riz-sauce-feuille',
    name: 'Riz Sauce Feuilles & Poisson Fumé du Fleuve',
    category: 'Plat Africain',
    tagline: 'Feuilles d\'oseille et moringa braisées au poisson du Niger',
    description: 'Mélange de feuilles fraîches finement ciselées, mijotées dans un bouillon onctueux au soumbala et poisson fumé de première qualité.',
    accompaniments: 'Riz blanc bio du Niger + Alloco bien doré',
    price: 4000,
    promoPrice: 3500,
    image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=1000',
    chefQuote: '« Richesse en vitamines et explosion gustative garantie. » — Cheffe Khady',
    badge: '🍃 SAIN & GOURMAND'
  }
];

// Helper to generate dynamic, mouthwatering marketing texts for different channels
export type PlatDuJourStyle = 'GOURMAND' | 'FLASH_MIDI' | 'PRESTIGE_ROYAL';

export const generateMenuDuJourMarketingTexts = (
  config: Partial<MenuDuJourConfig>,
  style: PlatDuJourStyle = 'GOURMAND'
): { 
  whatsapp: string; 
  statusShort: string; 
  groups: string; 
  social: string; 
  eveningTeaser: string; 
  eveningStatusShort: string; 
  hashtags: string; 
} => {
  const dishes = config.dishes && config.dishes.length >= 3 ? config.dishes : DEFAULT_MENU_DU_JOUR_DISHES;
  const d1 = dishes[0] || DEFAULT_MENU_DU_JOUR_DISHES[0];
  const d2 = dishes[1] || DEFAULT_MENU_DU_JOUR_DISHES[1];
  const d3 = dishes[2] || DEFAULT_MENU_DU_JOUR_DISHES[2];

  const d1Price = d1.promoPrice ? `${d1.promoPrice.toLocaleString('fr-FR')} F` : `${d1.price.toLocaleString('fr-FR')} F`;
  const d1Original = d1.price ? `${d1.price.toLocaleString('fr-FR')} F` : '';
  const d2Price = d2.promoPrice ? `${d2.promoPrice.toLocaleString('fr-FR')} F` : `${d2.price.toLocaleString('fr-FR')} F`;
  const d3Price = d3.promoPrice ? `${d3.promoPrice.toLocaleString('fr-FR')} F` : `${d3.price.toLocaleString('fr-FR')} F`;

  const dateStr = config.date || 'Aujourd\'hui';
  const targetDay = config.targetDayLabel || 'Demain Midi';
  const totalStock = (d1.remainingStock || 25) + (d2.remainingStock || 30) + (d3.remainingStock || 30);

  let whatsapp = '';
  let statusShort = '';
  let groups = '';
  let social = '';
  let eveningTeaser = '';
  let eveningStatusShort = '';

  if (style === 'FLASH_MIDI') {
    whatsapp = `*⚡ ALERTE DÉJEUNER DU JOUR — LE TRIO KHADY'S FOOD ⚡*\n\n` +
      `Ne cherchez plus quoi manger à midi ! Voici notre *Menu du Jour* prêt à être livré chez vous :\n\n` +
      `1️⃣ 🍲 *${d1.dishName.toUpperCase()}* (${d1Price}${d1Original ? ` au lieu de ${d1Original}` : ''})\n` +
      `   👉 ${d1.description}\n` +
      `   🎁 Bonus : ${d1.accompaniments}\n\n` +
      `2️⃣ 🌽 *${d2.dishName.toUpperCase()}* (${d2Price})\n` +
      `   👉 ${d2.description}\n\n` +
      `3️⃣ 🐟 *${d3.dishName.toUpperCase()}* (${d3Price})\n` +
      `   👉 ${d3.description}\n\n` +
      `🛵 *Livraison ultra-rapide par Billo Express partout à Niamey en 30 min.*\n` +
      `📲 *Cliquez ici pour commander directement :*\n` +
      `https://wa.me/${RESTAURANT_INFO.whatsappClean}?text=Bonjour%20je%20souhaite%20commander%20le%20Menu%20du%20Jour\n\n` +
      `_Khady's Food & Event — Votre régal chaud au bureau ou à domicile !_`;

    statusShort = `⚡ *MENU DU JOUR • LE TRIO KHADY'S* ⚡\n` +
      `1️⃣ 🍲 ${d1.dishName} (${d1Price})\n` +
      `2️⃣ 🌽 ${d2.dishName} (${d2Price})\n` +
      `3️⃣ 🐟 ${d3.dishName} (${d3Price})\n` +
      `🛵 Livré chaud en 30 min par Billo Express\n` +
      `👉 Commandes : ${RESTAURANT_INFO.whatsapp}`;

    groups = `*🥘 MENU DU JOUR MIDI EXPRESS — KHADY'S FOOD 🥘*\n\n` +
      `Bonjour à tous ! Au programme de ce midi chez Cheffe Khady :\n` +
      `1️⃣ 🍲 *${d1.dishName}* — ${d1Price}\n` +
      `2️⃣ 🌽 *${d2.dishName}* — ${d2Price}\n` +
      `3️⃣ 🐟 *${d3.dishName}* — ${d3Price}\n\n` +
      `🛵 Livraison groupée possible pour vos collègues au bureau.\n` +
      `📞 Commandes rapides : https://wa.me/${RESTAURANT_INFO.whatsappClean}`;

    social = `🔥 𝐕𝐄𝐍𝐓𝐄 𝐅𝐋𝐀𝐒𝐇 𝐌𝐄𝐍𝐔 𝐃𝐔 𝐉𝐎𝐔𝐑 | 𝐊𝐇𝐀𝐃𝐘'𝐒 𝐅𝐎𝐎𝐃 🔥\n\n` +
      `Pause déjeuner à Niamey ? Régalez-vous avec notre Trio Quotidien cuisiné frais ce matin :\n\n` +
      `🍲 1. *${d1.dishName}* (${d1Price})\n` +
      `🌽 2. *${d2.dishName}* (${d2Price})\n` +
      `🐟 3. *${d3.dishName}* (${d3Price})\n\n` +
      `🛵 Livraison Express assurée par Billo Express\n` +
      `📞 Réservez par WhatsApp : ${RESTAURANT_INFO.whatsapp}\n\n` +
      `#NiameyFood #KhadyFood #MenuDuJour #Doukounou #Attieke #PlatDuJour #BilloExpress`;

    eveningTeaser = `🌙 *AU MENU DEMAIN MIDI (${targetDay.toUpperCase()}) — LE TRIO KHADY'S* ⚡\n\n` +
      `Anticipez votre déjeuner de demain ! Cheffe Khady prépare son trio gourmand :\n` +
      `1️⃣ 🍲 *${d1.dishName.toUpperCase()}* (${d1Price})\n` +
      `2️⃣ 🌽 *${d2.dishName.toUpperCase()}* (${d2Price})\n` +
      `3️⃣ 🐟 *${d3.dishName.toUpperCase()}* (${d3Price})\n\n` +
      `🛵 Livraison express garantie dès 12h00 précises à Niamey.\n` +
      `📲 Bloquez votre portion dès ce soir : https://wa.me/${RESTAURANT_INFO.whatsappClean}?text=Bonsoir%20je%20réserve%20le%20Menu%20du%20Jour%20de%20demain`;

    eveningStatusShort = `🌙 *AU MENU DEMAIN MIDI (${targetDay.toUpperCase()})* 🍲✨\n` +
      `1️⃣ 🍲 ${d1.dishName} (${d1Price})\n` +
      `2️⃣ 🌽 Doukounou (${d2Price})\n` +
      `3️⃣ 🐟 Attiéké (${d3Price})\n` +
      `🛵 Livré dès 12h par Billo Express\n` +
      `👉 Réservez ce soir : ${RESTAURANT_INFO.whatsapp}`;
  } else if (style === 'PRESTIGE_ROYAL') {
    whatsapp = `*👑 FESTIN GASTRONOMIQUE DU JOUR — MENU DU JOUR KHADY'S FOOD 👑*\n\n` +
      `Offrez-vous un moment d'exception culinaire ce ${dateStr} avec la séléction royale de Cheffe Khady :\n\n` +
      `1️⃣ 🍲 *${d1.dishName.toUpperCase()}* ✨\n` +
      `   ${d1.description}\n` +
      `   💎 Tarif Privilège : *${d1Price}*\n\n` +
      `2️⃣ 🌽 *${d2.dishName.toUpperCase()}* (Incontournable Quotidien)\n` +
      `   ${d2.description}\n` +
      `   💎 Tarif Privilège : *${d2Price}*\n\n` +
      `3️⃣ 🐟 *${d3.dishName.toUpperCase()}* (Incontournable Quotidien)\n` +
      `   ${d3.description}\n` +
      `   💎 Tarif Privilège : *${d3Price}*\n\n` +
      `🛵 *Service Livraison Haute Précision par Billo Express*\n` +
      `👉 *Réserver votre repas VIP :*\n` +
      `https://wa.me/${RESTAURANT_INFO.whatsappClean}?text=Bonjour%20je%20réserve%20le%20Menu%20du%20Jour\n\n` +
      `_Khady's Food & Event — L'art de la haute gastronomie sahélienne_`;

    statusShort = `👑 *MENU ROYAL DU JOUR • KHADY'S FOOD* 👑\n` +
      `1️⃣ 🍲 ${d1.dishName} (${d1Price})\n` +
      `2️⃣ 🌽 Doukounou Royal (${d2Price})\n` +
      `3️⃣ 🐟 Attiéké Royal (${d3Price})\n` +
      `🛵 Livraison Billo Express Niamey\n` +
      `👉 Réservation : ${RESTAURANT_INFO.whatsapp}`;

    groups = `*👑 DÉLICE ROYAL DU JOUR — KHADY'S FOOD 👑*\n\n` +
      `Chers gourmets, le Menu du Jour d'exception est prêt :\n` +
      `1️⃣ 🍲 *${d1.dishName}* (${d1Price})\n` +
      `2️⃣ 🌽 *${d2.dishName}* (${d2Price})\n` +
      `3️⃣ 🐟 *${d3.dishName}* (${d3Price})\n\n` +
      `🛵 Service traiteur et livraison sur tout Niamey.\n` +
      `👉 Commandes : https://wa.me/${RESTAURANT_INFO.whatsappClean}`;

    social = `👑 𝐋'𝐄𝐗𝐂𝐄𝐋𝐋𝐄𝐍𝐂𝐄 𝐃𝐔 𝐉𝐎𝐔𝐑 | 𝐌𝐄𝐍𝐔 𝐃𝐔 𝐉𝐎𝐔𝐑 𝐊𝐇𝐀𝐃𝐘'𝐒 𝐅𝐎𝐎𝐃 👑\n\n` +
      `L'art culinaire au Sahel sublimé par Cheffe Khady.\n` +
      `Découvrez notre Menu du Jour du ${dateStr} :\n\n` +
      `🍲 1. *${d1.dishName}* (${d1Price})\n` +
      `🌽 2. *${d2.dishName}* (${d2Price})\n` +
      `🐟 3. *${d3.dishName}* (${d3Price})\n\n` +
      `🛵 Disponible en livraison partout à Niamey ou à emporter.\n` +
      `📲 Réservations : ${RESTAURANT_INFO.whatsapp}\n\n` +
      `#KhadyFood #HauteGastronomie #MenuDuJour #Doukounou #Attieke #Niamey #ExcellenceCulinaire`;

    eveningTeaser = `👑 *AVANT-PREMIÈRE DE LA VEILLE — AU MENU ${targetDay.toUpperCase()}* 👑\n\n` +
      `Cheffe Khady a l'honneur de vous dévoiler le Menu du Jour d'exception de demain :\n` +
      `1️⃣ 🍲 *${d1.dishName.toUpperCase()}* (${d1Price})\n` +
      `2️⃣ 🌽 *${d2.dishName.toUpperCase()}* (${d2Price})\n` +
      `3️⃣ 🐟 *${d3.dishName.toUpperCase()}* (${d3Price})\n\n` +
      `🛵 Livré à l'heure exacte de votre déjeuner à Niamey par Billo Express.\n` +
      `👉 *Précommandez dès ce soir :*\n` +
      `https://wa.me/${RESTAURANT_INFO.whatsappClean}?text=Bonsoir%20je%20réserve%20le%20Menu%20du%20Jour%20de%20demain`;

    eveningStatusShort = `👑 *AVANT-PREMIÈRE AU MENU ${targetDay.toUpperCase()}* 👑\n` +
      `1️⃣ 🍲 ${d1.dishName} (${d1Price})\n` +
      `2️⃣ 🌽 Doukounou (${d2Price})\n` +
      `3️⃣ 🐟 Attiéké (${d3Price})\n` +
      `🛵 Livré dès 12h par Billo Express\n` +
      `👉 Réservez ce soir : ${RESTAURANT_INFO.whatsapp}`;
  } else {
    // Default GOURMAND
    whatsapp = `*🍲 MENU DU JOUR CHEZ KHADY'S FOOD ! 🍲*\n` +
      `✨ *Le Trio Gourmand d'Excellence du Jour (${dateStr})* ✨\n\n` +
      `Aujourd'hui au programme chez Cheffe Khady :\n\n` +
      `1️⃣ 🍲 *PLAT DU JOUR : ${d1.dishName.toUpperCase()}*\n` +
      `   😋 ${d1.description}\n` +
      `   🎁 ${d1.accompaniments}\n` +
      `   💰 Tarif Promo : *${d1Price}*${d1Original ? ` (au lieu de ${d1Original})` : ''}\n\n` +
      `2️⃣ 🌽 *LE FAMEUX DOUKOUNOU (Incontournable Quotidien) :*\n` +
      `   😋 ${d2.description}\n` +
      `   💰 Tarif : *${d2Price}*\n\n` +
      `3️⃣ 🐟 *L'INCONTOURNABLE ATTIÉKÉ ROYAL (Incontournable Quotidien) :*\n` +
      `   😋 ${d3.description}\n` +
      `   💰 Tarif : *${d3Price}*\n\n` +
      `🛵 *Livraison express* chaude et soignée partout à Niamey par Billo Express.\n` +
      `⚡ *Portions limitées :* ${totalStock} parts cuisinées ce matin !\n\n` +
      `👉 *Cliquez ici pour commander sur WhatsApp :*\n` +
      `https://wa.me/${RESTAURANT_INFO.whatsappClean}?text=Bonjour%20je%20souhaite%20commander%20le%20Menu%20du%20Jour\n\n` +
      `_Khady's Food & Event — Le goût du bonheur au Sahel_`;

    statusShort = `🍲 *MENU DU JOUR • KHADY'S FOOD* 🍲\n` +
      `1️⃣ 🍲 ${d1.dishName} (${d1Price})\n` +
      `2️⃣ 🌽 Doukounou Royal (${d2Price})\n` +
      `3️⃣ 🐟 Attiéké Poisson (${d3Price})\n` +
      `🛵 Livré chaud dès 12h par Billo Express\n` +
      `👉 Commandez au ${RESTAURANT_INFO.whatsapp}`;

    groups = `*🍲 BONJOUR LE GROUPE ! LE MENU DU JOUR EST SERVI 🍲*\n\n` +
      `Les marmites de Cheffe Khady sont prêtes :\n` +
      `1️⃣ 🍲 *${d1.dishName}* — ${d1Price}\n` +
      `2️⃣ 🌽 *Le Fameux Doukounou* — ${d2Price}\n` +
      `3️⃣ 🐟 *L'Incontournable Attiéké* — ${d3Price}\n\n` +
      `🛵 Livraison rapide à votre porte par Billo !\n` +
      `📲 Pour commander : https://wa.me/${RESTAURANT_INFO.whatsappClean}`;

    social = `✨ 𝐌𝐄𝐍𝐔 𝐃𝐔 𝐉𝐎𝐔𝐑 | 𝐊𝐇𝐀𝐃𝐘'𝐒 𝐅𝐎𝐎𝐃 & 𝐄𝐕𝐄𝐍𝐓 ✨\n\n` +
      `Envie d'un déjeuner savoureux et généreux ? Découvrez notre Menu du Jour :\n\n` +
      `🍲 1. *${d1.dishName}* (${d1Price})\n` +
      `🌽 2. *Le Fameux Doukounou de Khady* (${d2Price})\n` +
      `🐟 3. *L'Incontournable Attiéké Royal* (${d3Price})\n\n` +
      `🛵 Livraison express partout à Niamey avec Billo Express\n` +
      `📲 Commandez directement sur WhatsApp : ${RESTAURANT_INFO.whatsapp}\n\n` +
      `#KhadyFood #MenuDuJour #Doukounou #Attieke #PlatDuJour #Niamey #BilloExpress #DejeunerNiamey`;

    eveningTeaser = `🌙 *AU MENU DEMAIN MIDI CHEZ KHADY'S FOOD !* 🍲✨\n\n` +
      `Chers gourmets, pour votre déjeuner de ${targetDay}, Cheffe Khady vous propose son Trio Gourmand :\n` +
      `1️⃣ 🍲 *${d1.dishName.toUpperCase()}* (${d1Price})\n` +
      `2️⃣ 🌽 *LE FAMEUX DOUKOUNOU ROYAL* (${d2Price})\n` +
      `3️⃣ 🐟 *L'INCONTOURNABLE ATTIÉKÉ ROYAL* (${d3Price})\n\n` +
      `🛵 *Livraison garantie dès 12h00 précises à votre bureau ou à domicile par Billo Express.*\n` +
      `👉 *Pour réserver dès ce soir en 1 clic :*\n` +
      `https://wa.me/${RESTAURANT_INFO.whatsappClean}?text=Bonsoir%20je%20réserve%20le%20Menu%20du%20Jour%20de%20demain\n\n` +
      `_Khady's Food & Event — Toujours un plaisir de vous régaler !_ 🌟`;

    eveningStatusShort = `🌙 *AU MENU DEMAIN MIDI !* 🍲✨\n` +
      `1️⃣ 🍲 ${d1.dishName} (${d1Price})\n` +
      `2️⃣ 🌽 Doukounou (${d2Price})\n` +
      `3️⃣ 🐟 Attiéké (${d3Price})\n` +
      `🛵 Livré dès 12h par Billo\n` +
      `👉 Réservez ce soir : ${RESTAURANT_INFO.whatsapp}`;
  }

  const hashtags = `#KhadyFood #MenuDuJour #Doukounou #Attieke #${d1.dishName.replace(/[^a-zA-Z0-9]/g, '')} #Niamey #BilloExpress #CuisineAfricaine`;

  return { whatsapp, statusShort, groups, social, eveningTeaser, eveningStatusShort, hashtags };
};

// Backward compatibility alias
export const generatePlatDuJourMarketingTexts = generateMenuDuJourMarketingTexts;

// Storage for Menu du Jour / Plat du Jour
export const getStoredMenuDuJour = (): MenuDuJourConfig => {
  try {
    const data = localStorage.getItem('khadys_plat_du_jour') || localStorage.getItem('khadys_menu_du_jour');
    if (data) {
      const parsed = JSON.parse(data);
      if (parsed) {
        // Ensure dishes array is populated with the 3 items
        let dishes: MenuDuJourDishItem[] = parsed.dishes || [];
        if (!Array.isArray(dishes) || dishes.length < 3) {
          // Upgrade single dish to Trio!
          const primaryDish: MenuDuJourDishItem = {
            id: 'dish-plat-du-jour',
            type: 'PLAT_DU_JOUR',
            dishName: parsed.dishName || DEFAULT_MENU_DU_JOUR_DISHES[0].dishName,
            badgeLabel: '🍲 Plat Cuisiné du Jour',
            badgeColor: 'bg-brand-orange text-white',
            tagline: parsed.tagline || DEFAULT_MENU_DU_JOUR_DISHES[0].tagline,
            description: parsed.description || DEFAULT_MENU_DU_JOUR_DISHES[0].description,
            accompaniments: parsed.accompaniments || DEFAULT_MENU_DU_JOUR_DISHES[0].accompaniments,
            price: parsed.price || DEFAULT_MENU_DU_JOUR_DISHES[0].price,
            promoPrice: parsed.promoPrice || DEFAULT_MENU_DU_JOUR_DISHES[0].promoPrice,
            dishImage: parsed.dishImage || DEFAULT_MENU_DU_JOUR_DISHES[0].dishImage,
            remainingStock: parsed.remainingStock || DEFAULT_MENU_DU_JOUR_DISHES[0].remainingStock,
            isDailyPermanent: false,
            isAvailable: true
          };
          dishes = [
            primaryDish,
            DEFAULT_MENU_DU_JOUR_DISHES[1], // Doukounou
            DEFAULT_MENU_DU_JOUR_DISHES[2]  // Attiéké
          ];
        }

        const synced: MenuDuJourConfig = {
          ...INITIAL_MENU_DU_JOUR,
          ...parsed,
          posterLayout: parsed.posterLayout || 'TRIO_POSTER',
          title: parsed.title || 'Menu du Jour — Le Trio Gourmand',
          dishes,
          dishName: dishes[0]?.dishName || parsed.dishName || DEFAULT_MENU_DU_JOUR_DISHES[0].dishName,
          description: dishes[0]?.description || parsed.description || DEFAULT_MENU_DU_JOUR_DISHES[0].description,
          accompaniments: dishes[0]?.accompaniments || parsed.accompaniments || DEFAULT_MENU_DU_JOUR_DISHES[0].accompaniments,
          price: dishes[0]?.price || parsed.price || DEFAULT_MENU_DU_JOUR_DISHES[0].price,
          promoPrice: dishes[0]?.promoPrice || parsed.promoPrice || DEFAULT_MENU_DU_JOUR_DISHES[0].promoPrice,
          dishImage: dishes[0]?.dishImage || parsed.dishImage || DEFAULT_MENU_DU_JOUR_DISHES[0].dishImage,
          remainingStock: dishes[0]?.remainingStock || parsed.remainingStock || DEFAULT_MENU_DU_JOUR_DISHES[0].remainingStock,
        };

        // Regenerate texts if needed
        const texts = generateMenuDuJourMarketingTexts(synced, 'GOURMAND');
        synced.marketingTextWhatsApp = synced.marketingTextWhatsApp || texts.whatsapp;
        synced.marketingTextStatusShort = synced.marketingTextStatusShort || texts.statusShort;
        synced.marketingTextGroups = synced.marketingTextGroups || texts.groups;
        synced.marketingTextSocial = synced.marketingTextSocial || texts.social;
        synced.marketingTextEveningTeaser = synced.marketingTextEveningTeaser || texts.eveningTeaser;
        synced.marketingTextEveningStatusShort = synced.marketingTextEveningStatusShort || texts.eveningStatusShort;

        return synced;
      }
    }
  } catch (e) {}
  return INITIAL_MENU_DU_JOUR;
};

export const getStoredPlatDuJour = getStoredMenuDuJour;

export const saveStoredMenuDuJour = (menu: MenuDuJourConfig): void => {
  try {
    // Keep dish 0 in sync with primary fields
    if (menu.dishes && menu.dishes.length > 0) {
      menu.dishName = menu.dishes[0].dishName;
      menu.description = menu.dishes[0].description;
      menu.accompaniments = menu.dishes[0].accompaniments;
      menu.price = menu.dishes[0].price;
      menu.promoPrice = menu.dishes[0].promoPrice;
      menu.dishImage = menu.dishes[0].dishImage;
      menu.remainingStock = menu.dishes[0].remainingStock;
    }

    localStorage.setItem('khadys_plat_du_jour', JSON.stringify(menu));
    localStorage.setItem('khadys_menu_du_jour', JSON.stringify(menu));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('khadys_plat_du_jour_updated', { detail: menu }));
      window.dispatchEvent(new CustomEvent('khadys_menu_du_jour_updated', { detail: menu }));
    }
    // Background cloud sync
    db.savePlatDuJour(menu).catch(() => {});
  } catch (e) {}
};

export const saveStoredPlatDuJour = saveStoredMenuDuJour;

// Open social media sharing
export const shareToSocialPlatform = (text: string, platform: 'facebook' | 'instagram' | 'tiktok' | 'copy' | 'web_share'): boolean => {
  const url = `https://wa.me/${RESTAURANT_INFO.whatsappClean}`;
  
  if (platform === 'facebook') {
    try { navigator.clipboard.writeText(text); } catch (e) {}
    const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`;
    window.open(fbUrl, '_blank');
    return true;
  } else if (platform === 'instagram') {
    try { navigator.clipboard.writeText(text); } catch (e) {}
    window.open(RESTAURANT_INFO.socials.instagram.url, '_blank');
    return true;
  } else if (platform === 'tiktok') {
    try { navigator.clipboard.writeText(text); } catch (e) {}
    window.open(RESTAURANT_INFO.socials.tiktok.url, '_blank');
    return true;
  } else if (platform === 'web_share' && navigator.share) {
    navigator.share({
      title: 'Plat du Jour - Khady\'s Food Niamey',
      text: text,
      url: url
    }).catch(() => {});
    return true;
  }
  
  // Default: copy to clipboard
  try {
    navigator.clipboard.writeText(text);
    return true;
  } catch (e) {
    return false;
  }
};

// Web Share API Level 2 (File Blob Sharing for Android & iOS: Native image + text to WhatsApp / Social)
export const shareImageAndText = async (
  canvas: HTMLCanvasElement | null,
  title: string,
  text: string,
  filename: string = 'affiche-plat-du-jour.png'
): Promise<{ success: boolean; method: 'native' | 'download_and_copy' | 'fallback'; message: string }> => {
  if (!canvas) {
    try {
      await navigator.clipboard.writeText(text);
      return { success: true, method: 'fallback', message: 'Texte copié dans le presse-papier !' };
    } catch {
      return { success: false, method: 'fallback', message: 'Impossible de copier le texte.' };
    }
  }

  // 1. Convert Canvas to Blob File
  const blob: Blob | null = await new Promise((resolve) => {
    canvas.toBlob((b) => resolve(b), 'image/png', 1.0);
  });

  if (!blob) {
    try {
      await navigator.clipboard.writeText(text);
      return { success: true, method: 'fallback', message: 'Texte copié !' };
    } catch {
      return { success: false, method: 'fallback', message: 'Erreur lors de la préparation' };
    }
  }

  const file = new File([blob], filename, { type: 'image/png' });

  // 2. Try native Web Share API with File
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title: title,
        text: text
      });
      return { success: true, method: 'native', message: 'Partage direct ouvert avec l\'affiche image !' };
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return { success: false, method: 'native', message: 'Partage annulé' };
      }
      // If user cancel or share failed, proceed to fallback
    }
  }

  // 3. Fallback for desktop / unsupported browsers:
  // Auto-download the high-res PNG image + Auto-copy short text to clipboard
  try {
    const link = document.createElement('a');
    link.download = filename;
    link.href = URL.createObjectURL(blob);
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 10000);
  } catch (e) {}

  try {
    await navigator.clipboard.writeText(text);
  } catch (e) {}

  return {
    success: true,
    method: 'download_and_copy',
    message: 'Affiche PNG enregistrée dans vos photos + Texte copié ! Ouvrez WhatsApp et publiez l\'affiche avec le texte collé.'
  };
};


// Storage Helpers
export const getStoredPromoCodes = (): PromoCode[] => {
  try {
    const data = localStorage.getItem('khadys_promo_codes');
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}
  return INITIAL_PROMO_CODES;
};

export const saveStoredPromoCodes = (codes: PromoCode[]): void => {
  try {
    localStorage.setItem('khadys_promo_codes', JSON.stringify(codes));
    db.saveSetting('promo_codes', codes).catch(() => {});
  } catch (e) {}
};

export const getStoredBanner = (): AnnouncementBanner => {
  try {
    const data = localStorage.getItem('khadys_announcement_banner');
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {}
  return INITIAL_BANNER;
};

export const saveStoredBanner = (banner: AnnouncementBanner): void => {
  try {
    localStorage.setItem('khadys_announcement_banner', JSON.stringify(banner));
    db.saveSetting('announcement_banner', banner).catch(() => {});
  } catch (e) {}
};

export const getStoredFlashDeal = (): FlashDealConfig => {
  try {
    const data = localStorage.getItem('khadys_flash_deal');
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {}
  return INITIAL_FLASH_DEAL;
};

export const saveStoredFlashDeal = (deal: FlashDealConfig): void => {
  try {
    localStorage.setItem('khadys_flash_deal', JSON.stringify(deal));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('khadys_flash_deal_updated', { detail: deal }));
    }
    db.saveSetting('flash_deal', deal).catch(() => {});
  } catch (e) {}
};

export interface DailyPromo {
  id: string;
  dayName: string;
  dayIndex: number; // 0 = Sunday, 1 = Monday, ... 6 = Saturday
  title: string;
  badge: string;
  discountTag: string;
  description: string;
  itemPrice?: number;
  promoPrice?: number;
  image: string;
  code: string;
  category: string;
  popularDishName?: string;
  isToday?: boolean;
}

export const INITIAL_WEEKLY_PROMOTIONS: DailyPromo[] = [
  {
    id: 'promo-mon',
    dayName: 'Lundi',
    dayIndex: 1,
    title: 'Lundi Sauces & Saveurs',
    badge: 'DEBUT DE SEMAINE',
    discountTag: '-20% sur Box Sauces',
    description: 'Bénéficiez de 20% de réduction sur toutes nos Box Sauces Authentiques (Mafé, Gombo, Feuille) livrées chaudes !',
    itemPrice: 3500,
    promoPrice: 2800,
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600',
    code: 'LUNDISAUCE',
    category: 'Box Sauces',
    popularDishName: 'Box Sauce Mafé Royale'
  },
  {
    id: 'promo-tue',
    dayName: 'Mardi',
    dayIndex: 2,
    title: 'Mardi Tchep & Grillades',
    badge: 'BOOSTER GOURMAND',
    discountTag: 'Boisson Bissap Offerte',
    description: 'Une grande bouteille de Bissap glacé 100% naturel offerte pour tout menu Tchep ou Poulet Braisé commandé.',
    itemPrice: 4000,
    promoPrice: 4000,
    image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600',
    code: 'BISSAPFREE',
    category: 'Plats Chauds',
    popularDishName: 'Tchep au Poulet Yassa'
  },
  {
    id: 'promo-wed',
    dayName: 'Mercredi',
    dayIndex: 3,
    title: 'Mercredi Buffet & Entreprise',
    badge: 'LUNCH EXPRESS',
    discountTag: '-15% Buffet Pro',
    description: 'Livraison gratuite et 15% de remise pour vos réunions et repas d’équipe au bureau à Niamey.',
    itemPrice: 7500,
    promoPrice: 6375,
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600',
    code: 'BUFFETPRO15',
    category: 'Buffet Pro',
    popularDishName: 'Pack Buffet Prestige (10 Pers.)'
  },
  {
    id: 'promo-thu',
    dayName: 'Jeudi',
    dayIndex: 4,
    title: 'Jeudi Dégustation Dibi',
    badge: 'SPÉCIALITÉ CHEF',
    discountTag: '1 Portion Dibi Offerte',
    description: 'Pour toute commande de plus de 15.000 F, recevez une portion supplémentaire de Dibi d’Agneau Braisé au feu de bois.',
    itemPrice: 5000,
    promoPrice: 3800,
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600',
    code: 'DIBIGOLD',
    category: 'Grillades',
    popularDishName: 'Dibi d’Agneau Grillé & Aloko'
  },
  {
    id: 'promo-fri',
    dayName: 'Vendredi',
    dayIndex: 5,
    title: 'Vendredi Couscous & Festin',
    badge: 'VENDREDI BENI',
    discountTag: 'Dessert Glacé Offert',
    description: 'Le traditionnel Couscous Royal accompagné d’un thé à la menthe chaud et d’une verrine douceur offerte.',
    itemPrice: 4500,
    promoPrice: 4500,
    image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600',
    code: 'COUSCOUSVIP',
    category: 'Plats Traditionnels',
    popularDishName: 'Couscous Royal 7 Légumes'
  },
  {
    id: 'promo-sat',
    dayName: 'Samedi',
    dayIndex: 6,
    title: 'Samedi Family & Traiteur',
    badge: 'WEEK-END FESTIF',
    discountTag: 'Livraison Gratuite',
    description: 'Frais de livraison Billo Express entièrement offerts pour toute la famille sur toutes les commandes du Samedi.',
    itemPrice: 10000,
    promoPrice: 8500,
    image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600',
    code: 'LIVRAISONFREE',
    category: 'Pack Famille',
    popularDishName: 'Mega Pack Grillades Mixte'
  },
  {
    id: 'promo-sun',
    dayName: 'Dimanche',
    dayIndex: 0,
    title: 'Dimanche Brunch & Relaxation',
    badge: 'DETENTE & DOUCEUR',
    discountTag: 'Double Points Fidélité',
    description: 'Cumulez 2x plus de points Club Gold sur toutes vos commandes du dimanche midi et soir !',
    itemPrice: 5000,
    promoPrice: 4500,
    image: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=600',
    code: 'DOUBLEPOINTS',
    category: 'Brunch',
    popularDishName: 'Brunch Royal Niamey'
  }
];

export const getStoredWeeklyPromotions = (): DailyPromo[] => {
  try {
    const data = localStorage.getItem('khadys_weekly_promotions');
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}
  return INITIAL_WEEKLY_PROMOTIONS;
};

export const saveStoredWeeklyPromotions = (promos: DailyPromo[]): void => {
  try {
    localStorage.setItem('khadys_weekly_promotions', JSON.stringify(promos));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('khadys_weekly_promotions_updated', { detail: promos }));
    }
    db.saveSetting('weekly_promotions', promos).catch(() => {});
  } catch (e) {}
};

// Check and validate a promo code against current cart
export interface PromoValidationResult {
  isValid: boolean;
  discountAmount: number;
  promoCodeObj?: PromoCode;
  errorMessage?: string;
  successMessage?: string;
}

export const applyPromoCode = (inputCode: string, subtotal: number): PromoValidationResult => {
  if (!inputCode || !inputCode.trim()) {
    return { isValid: false, discountAmount: 0, errorMessage: 'Veuillez saisir un code promo.' };
  }

  const cleanInput = inputCode.trim().toUpperCase();
  const allCodes = getStoredPromoCodes();
  const found = allCodes.find(c => c.code.toUpperCase() === cleanInput);

  if (!found) {
    return { isValid: false, discountAmount: 0, errorMessage: `Le code « ${cleanInput} » n'existe pas ou est expiré.` };
  }

  if (!found.isActive) {
    return { isValid: false, discountAmount: 0, errorMessage: `Le code « ${found.code} » a été désactivé.` };
  }

  if (found.expiryDate && new Date(found.expiryDate) < new Date()) {
    return { isValid: false, discountAmount: 0, errorMessage: `Le code « ${found.code} » est arrivé à expiration.` };
  }

  if (subtotal < found.minOrder) {
    return { 
      isValid: false, 
      discountAmount: 0, 
      errorMessage: `Montant insuffisant. Le code « ${found.code} » requiert un minimum de ${found.minOrder.toLocaleString('fr-FR')} F CFA.` 
    };
  }

  let discount = 0;
  let successMsg = '';

  if (found.type === 'PERCENT') {
    discount = Math.round((subtotal * found.value) / 100);
    successMsg = `🎉 Code « ${found.code} » appliqué : -${found.value}% (-${discount.toLocaleString('fr-FR')} F CFA)`;
  } else if (found.type === 'FIXED') {
    discount = Math.min(found.value, subtotal);
    successMsg = `🎉 Code « ${found.code} » appliqué : -${discount.toLocaleString('fr-FR')} F CFA offerts !`;
  } else if (found.type === 'GIFT') {
    discount = Math.min(found.value, subtotal);
    successMsg = `🎁 Cadeau offert avec « ${found.code} » : ${found.description}`;
  }

  return {
    isValid: true,
    discountAmount: discount,
    promoCodeObj: found,
    successMessage: successMsg
  };
};

// Campaign Templates for Fast Marketing Broadcast (Dynamically conforming to active Plat du Jour)
export const getMarketingTemplates = (plat?: Partial<PlatDuJourConfig>): MarketingCampaign[] => {
  const currentDishName = plat?.dishName || 'Tiep Royal Khady';
  const currentPrice = plat?.promoPrice 
    ? `${plat.promoPrice.toLocaleString('fr-FR')} F CFA` 
    : (plat?.price ? `${plat.price.toLocaleString('fr-FR')} F CFA` : '4 500 F CFA');
  const currentDesc = plat?.description || 'Préparé avec amour par Cheffe Khady avec des ingrédients frais du jour.';
  const currentAcc = plat?.accompaniments || 'Bananes Alloco croustillantes & 1 Jus Bissap frais offert';

  return [
    {
      id: 'tpl-plat-du-jour-midi',
      title: `🍲 Vente Flash ${currentDishName} (Midi)`,
      category: 'FLASH' as const,
      headline: `⚡ Vente Flash Déjeuner — ${currentDishName} Khady's Food !`,
      bodyText: `*BON APPÉTIT NIAMEY ! LE ${currentDishName.toUpperCase()} DU MIDI EST PRÊT !* 🥘🔥\n\n` +
        `Envie d'un déjeuner gourmand et authentique au bureau ou à la maison ?\n` +
        `Nos marmites bouillonnent chez *Khady's Food* avec notre savoureux *${currentDishName}* :\n` +
        `😋 ${currentDesc}\n` +
        `🎁 *Bonus inclus :* ${currentAcc}\n` +
        `💰 *Tarif Spécial Déjeuner :* *${currentPrice}*\n\n` +
        `🎁 *Offre Spéciale Déjeuner :* -15% sur toutes les commandes passées avant 14h avec le code *KHADY24* !\n` +
        `🛵 Livraison express assurée partout à Niamey par *Billo Express*.\n\n` +
        `👉 Cliquez ici pour commander : https://wa.me/${RESTAURANT_INFO.whatsappClean}?text=Bonjour%20je%20veux%20commander%20${encodeURIComponent(currentDishName)}\n` +
        `_Khady's Food & Event — L'art culinaire au Sahel_`,
      suggestedPromo: 'KHADY24'
    },
    {
      id: 'tpl-sauce-box',
      title: '🥫 Promotion Box Sauces Africaines',
      category: 'MENU_DU_JOUR' as const,
      headline: '🔥 Promo Spéciale Box Sauces — Mafé, Gombo & Feuilles',
      bodyText: `*DÉCOUVREZ NOS BOX SAUCES TRADITIONNELLES KHADY'S FOOD !* 🥘✨\n\n` +
        `Faites le plein de saveurs avec nos Box Sauces préparées dans la pure tradition africaine :\n` +
        `• *Box Sauce Mafé Onctueuse* aux cacahuètes grillées\n` +
        `• *Box Sauce Gombo Frais & Viande Tendre*\n` +
        `• *Box Sauce Feuille & Poisson Fumé*\n\n` +
        `🎁 *Pack Découverte :* 3 Box commandées = 1 Grande Bouteille de Jus Bissap offerte !\n` +
        `📞 Commandes rapides : ${RESTAURANT_INFO.whatsapp}\n` +
        `_Livraison chaude et soignée à domicile ou au bureau._`,
      suggestedPromo: 'BISSAPFREE'
    },
    {
      id: 'tpl-weekend-dibi',
      title: '🥩 Festin Week-end Grillades & Dibi',
      category: 'WEEKEND' as const,
      headline: '🍖 Soirée Dibi d’Agneau & Grillades au Feu de Bois',
      bodyText: `*WEEK-END GOURMAND CHEZ KHADY'S FOOD !* 🥩🔥\n\n` +
        `Ce week-end, offrez-vous le meilleur Dibi d'Agneau de Niamey, assaisonné aux épices secrètes du Chef et grillé lentement au feu de bois avec ses bananes plantains (Aloko) et oignons caramélisés.\n\n` +
        `⚡ *Code Promo VIP Week-end :* Utilisez *FLASH20* pour 20% de remise immédiate !\n` +
        `🛵 Commandez pour votre famille ou vos amis, livraison express par Billo !\n\n` +
        `📲 Commandes WhatsApp directes : https://wa.me/${RESTAURANT_INFO.whatsappClean}`,
      suggestedPromo: 'FLASH20'
    },
    {
      id: 'tpl-buffet-event',
      title: '👑 Buffets & Événements Entreprise',
      category: 'BUFFET' as const,
      headline: '✨ Buffets Haut de Gamme pour Séminaires & Cérémonies',
      bodyText: `*VOUS ORGANISEZ UN ÉVÉNEMENT, RÉUNION OU MARIAGE À NIAMEY ?* 👑🎉\n\n` +
        `Confiez votre service traiteur à *Khady's Food & Event* :\n` +
        `✅ Menus gastronomiques africains et européens sur-mesure\n` +
        `✅ Présentation soignée, nappage et vaisselle de standing\n` +
        `✅ Équipe de service dynamique et professionnelle\n\n` +
        `💼 *Offre Entreprise :* Devis personnalisé en moins de 2 heures + 15% de remise avec le code *BUFFETPRO*.\n\n` +
        `📞 Contact Direct Traiteur : ${RESTAURANT_INFO.directLine} / WhatsApp : ${RESTAURANT_INFO.whatsapp}`,
      suggestedPromo: 'BUFFETPRO'
    },
    {
      id: 'tpl-fidelite-vip',
      title: '💎 Relance & Récompense Clients VIP',
      category: 'FIDELITE' as const,
      headline: '🎁 1 000 F CFA offerts pour vous remercier de votre fidélité',
      bodyText: `*MERCI POUR VOTRE FIDÉLITÉ CHEZ KHADY'S FOOD !* 💖🍲\n\n` +
        `Nous avons le plaisir de vous offrir un bon d'achat exclusif de *1 000 F CFA* à valoir dès aujourd'hui sur votre prochain festin avec le code personnel : *BIENVENUE*.\n\n` +
        `🛵 Nos livreurs Billo Express sont prêts à vous livrer en un éclair !\n` +
        `👉 Cliquez ici pour commander : https://wa.me/${RESTAURANT_INFO.whatsappClean}\n` +
        `_Excellente dégustation de la part de toute l'équipe de Cheffe Khady !_`,
      suggestedPromo: 'BIENVENUE'
    }
  ];
};

export const MARKETING_TEMPLATES = getMarketingTemplates();

// Broadcast action to WhatsApp Status or Contacts
export const broadcastToWhatsApp = (message: string, targetPhone?: string): void => {
  if (targetPhone && targetPhone.trim()) {
    const clean = cleanPhoneNumber(targetPhone);
    const url = `https://api.whatsapp.com/send?phone=${clean}&text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  } else {
    // Open generic WhatsApp share to status/chats
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  }
};
