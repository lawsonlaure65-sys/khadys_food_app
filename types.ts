
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
  paymentType?: 'MOBILE_MONEY' | 'CASH';
  paymentProofUrl?: string;
  paymentTransactionId?: string;
  paymentValidated?: boolean;
  driverName?: string;
  driverPhone?: string;
  driverStatus?: 'ASSIGNED' | 'EN_ROUTE' | 'LIVRAISON_VALIDEE' | 'PROBLEME_LIVRAISON';
  driverNote?: string;
  driverIssue?: string;
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

export enum Page {
  HOME = 'HOME',
  MENU = 'MENU',
  TRAITEUR = 'TRAITEUR',
  CART = 'CART',
  BOX = 'BOX',
  PACKS = 'PACKS',
  COMMANDES = 'COMMANDES',
  COMPTE = 'COMPTE',
  INFOS = 'INFOS',
  ADMIN = 'ADMIN',
  BLOG = 'BLOG',
  GALLERY = 'GALLERY'
}

export enum AdminView {
  DASHBOARD = 'DASHBOARD',
  ORDERS = 'ORDERS',
  MENU_MGMT = 'MENU_MGMT',
  AI_MARKETING = 'AI_MARKETING',
  WHATSAPP_AUTOMATION = 'WHATSAPP_AUTOMATION',
  CLIENTS = 'CLIENTS',
  DELIVERY = 'DELIVERY',
  EVENT = 'EVENT',
  BUFFET = 'BUFFET',
  BLOG_MGMT = 'BLOG_MGMT',
  GALLERY_MGMT = 'GALLERY_MGMT',
  SETTINGS = 'SETTINGS'
}

export interface BlogPost {
  id: string;
  title: string;
  subtitle: string;
  content: string;
  author: string;
  date: string;
  readTime: string;
  image: string;
  category: 'Recettes Secrètes' | 'Gastronomie Sahélienne' | 'Conseils Nutrition' | 'Coulisses Chef';
  likes: number;
  commentsCount: number;
  isPublished: boolean;
  featuredDishId?: string;
}

export interface GalleryItem {
  id: string;
  title: string;
  category: string;
  image: string;
  likes: number;
  dishId?: string;
  tag: string;
  description?: string;
}

export interface ClientUser {
  id: string;
  name: string;
  phone: string;
  email?: string;
  district: string;
  points: number;
  rank: 'Silver' | 'Gold' | 'Platinum';
  totalOrders: number;
  totalSpent: number;
  lastOrderDate: string;
}

export interface District {
  name: string;
  zone: 'center' | 'periphery';
}
