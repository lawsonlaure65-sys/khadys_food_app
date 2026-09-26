
export type MenuCategory = 
  | 'Entree' 
  | 'Entrée'
  | 'Entrée Chaude'
  | 'Entrée Froide'
  | 'Plat Africain' 
  | 'Plat Européen' 
  | 'Spécialité Maison' 
  | 'Plat du Jour' 
  | 'Menu du Jour'
  | 'Dessert' 
  | 'Boisson' 
  | 'Boisson Froide'
  | 'Boisson Chaude'
  | 'Boisson Naturelle'
  | 'Petit-déjeuner'
  | 'Déjeuner'
  | 'Dîner'
  | 'Box Sauce'
  | 'Box Repas'
  | 'Pack'
  | 'Buffet'
  | 'Pack-Buffet';

export type OrderStatus = 
  | 'RECEIVED' 
  | 'CONFIRMED' 
  | 'PREPARING' 
  | 'READY' 
  | 'DELIVERING' 
  | 'DELIVERED'
  | 'CANCELLED';

export type PaymentMethod = 
  | 'CASH' 
  | 'AIRTEL_MONEY' 
  | 'MOOV_MONEY' 
  | 'ZAMANY' 
  | 'FLOOZ'
  | 'NITA' 
  | 'MYNITA' 
  | 'AMANA'
  | 'AMANATA' 
  | 'ALLIZA' 
  | 'ZEYNA' 
  | 'CARD';

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: MenuCategory;
  rating: number;
  isAvailable: boolean;
  isSpicy?: boolean;
  isVegetarian?: boolean;
  isPlatDuJour?: boolean;
  isSpécialitéMaison?: boolean;
  isPromo?: boolean;
  isLowPrice?: boolean;
  includes?: string[]; 
  minPeople?: number;  
}

export interface Review {
  id: string;
  name: string;
  comment: string;
  rating: number;
  image: string;
  date: string;
  adminReply?: string; 
}

export interface CartItem extends MenuItem {
  quantity: number;
  instructions?: string;
}

export interface Order {
  id: string;
  customerName: string;
  phone: string;
  address: string;
  district: string;
  items: CartItem[];
  total: number;
  deliveryFee: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentProofImage?: string;
  paymentTransactionId?: string;
  timestamp: string;
}

export interface UserProfile {
  name: string;
  email?: string;
  phone: string;
  points: number;
  rank: 'Silver' | 'Gold' | 'Platinum';
  avatar?: string;
  referralCode: string;
}

export interface BlogArticle {
  id: string;
  title: string;
  summary: string;
  content: string;
  author: string;
  date: string;
  readTime: string;
  image: string;
  category: 'Recettes' | 'Secrets du Chef' | 'Nutrition Sahel' | 'Événements';
  likes: number;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: 'Paiement' | 'Livraison' | 'Commandes' | 'Traiteur' | 'Fidélité' | 'Application';
}

export enum Page {
  HOME = 'HOME',
  MENU = 'MENU',
  TRAITEUR = 'TRAITEUR',
  CART = 'CART',
  COMMANDE = 'COMMANDE',
  BOX = 'BOX',
  PACKS = 'PACKS',
  COMMANDES = 'COMMANDES',
  COMPTE = 'COMPTE',
  INFOS = 'INFOS',
  ADMIN = 'ADMIN',
  GALLERY = 'GALLERY',
  VIDEO = 'VIDEO',
  WHATSAPP = 'WHATSAPP',
  BLOG = 'BLOG',
  FAQ = 'FAQ',
  SETTINGS = 'SETTINGS'
}

export enum AdminView {
  DASHBOARD = 'DASHBOARD',
  PLAT_DU_JOUR = 'PLAT_DU_JOUR',
  ORDERS = 'ORDERS',
  MENU_MGMT = 'MENU_MGMT',
  BLOG_MGMT = 'BLOG_MGMT',
  FAQ_MGMT = 'FAQ_MGMT',
  AI_MARKETING = 'AI_MARKETING',
  CLIENTS = 'CLIENTS',
  DELIVERY = 'DELIVERY',
  EVENT = 'EVENT',
  BUFFET = 'BUFFET',
  SETTINGS = 'SETTINGS'
}

export interface District {
  name: string;
  zone: 'center' | 'periphery';
}
