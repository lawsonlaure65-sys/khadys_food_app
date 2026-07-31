
import { District, MenuItem, Review, BlogPost, GalleryItem, ClientUser } from './types';

export const DELIVERY_TIME = "45 à 60 mn";
export const ADMIN_PASSWORD = "khadysfood";
// Utilisation du logo fourni par l'utilisateur
export const LOGO_URL = "https://i.ibb.co/h1rgJJMb/1766933626062.jpg"; 
export const LOGO_VIDEO_URL = "https://v.ft-static.com/video/469c3a3809e5b7226252994c5026210b/downloads/default.mp4";
export const BILLO_LOGO_URL = "https://i.ibb.co/YFftbm2X/1765927283591.jpg";

export const BILLO_INFO = {
  name: "Billo Express",
  slogan: "L'éclair de Niamey",
  tarifs: {
    center: { day: 1000, night: 1500 },
    periphery: { day: 1500, night: 2000 }
  },
  fridayRule: "Livraisons suspendues le vendredi de 12h à 15h pour la grande prière."
};

export const RESTAURANT_INFO = {
  name: "Khady's Food & Event",
  slogan: "Restaurant 100% Numérique & Cloud Kitchen",
  type: "100% En ligne • Pas de table physique • Livraison & WhatsApp uniquement",
  phones: ["+227 74 44 16 21"],
  whatsapp: "+227 74 44 16 21",
  address: "Place de la grande prière : Mosquée Mouhamar Khadafi, Niamey",
  location: "Place de la grande prière : Mosquée Mouhamar Khadafi, Niamey"
};

export const PAYMENT_ACCOUNTS = {
  airtelMoney: {
    name: "Airtel Money Niger",
    number: "+227 96 05 23 10",
    instructions: "Transfert / Code marchand Airtel: +227 96 05 23 10"
  },
  moovFlooz: {
    name: "Moov / Flooz",
    number: "+227 74 44 16 21",
    instructions: "Transfert Flooz au +227 74 44 16 21"
  },
  orangeMoney: {
    name: "Orange Money Niger",
    number: "+227 90 40 51 18",
    instructions: "Transfert Orange Money au +227 90 40 51 18"
  },
  mynitaAmana: {
    name: "Mynita / Amanata",
    number: "+227 90 40 51 18",
    instructions: "Dépôt Mynita / Amana au +227 90 40 51 18"
  },
  allIza: {
    name: "All-Iza",
    number: "+227 96 05 23 10",
    instructions: "Envoi All-Iza au +227 96 05 23 10"
  }
};

export const MENU_ITEMS: MenuItem[] = [
  // --- SPÉCIALITÉS & MENU DU JOUR ---
  { id: 'sp1', name: 'Tiep Royal Khady', description: 'Le chef-d\'œuvre de la maison au poisson capitaine, riz rouge parfumé et légumes fondants.', price: 5500, image: 'https://images.unsplash.com/photo-1627308595229-7830a5c91f9f?w=800', category: 'Spécialité Maison', rating: 5, isAvailable: true, isSpicy: true },
  { id: 'sp2', name: 'Plateau Prestige Event', description: 'Assortiment giga de grillades, pastels et alloco pour 4 personnes.', price: 15000, image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800', category: 'Spécialité Maison', rating: 5, isAvailable: true },
  { id: 'dj1', name: 'Dambou du Jour', description: 'Couscous de moringa frais aux arachides grillées, servi avec du poulet braisé.', price: 2500, image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800', category: 'Menu du Jour', rating: 4.9, isAvailable: true, isVegetarian: true, isLowPrice: true },
  { id: 'dj2', name: 'Riz au Gras Niamey', description: 'Riz savoureux cuit dans un bouillon de viande et épices locales.', price: 2000, image: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=800', category: 'Menu du Jour', rating: 4.7, isAvailable: true, isLowPrice: true },

  // --- PETIT-DÉJEUNER ---
  { id: 'pd1', name: 'Café Touba & Beignets Dounguiri', description: 'Café traditionnel sénégalais épicé au poivre de Selim, accompagné de succulents beignets doux de mil frits.', price: 1500, image: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=800', category: 'Petit-déjeuner', rating: 4.9, isAvailable: true, isLowPrice: true },
  { id: 'pd2', name: 'Bouillie de Mil au Lait Caillé', description: 'Onctueuse bouillie traditionnelle de mil (Thiacry / Dégué chaud) agrémentée de miel sauvage, lait caillé crémeux et éclats de coco.', price: 2000, image: 'https://images.unsplash.com/photo-1574316071802-0d684efa7bf5?w=800', category: 'Petit-déjeuner', rating: 4.8, isAvailable: true, isVegetarian: true },
  { id: 'pd3', name: 'Omelette Sahélienne & Tapalapa', description: 'Deux œufs garnis aux oignons caramélisés, piments doux, tomates fraîches, le tout servi avec le pain traditionnel Tapalapa chaud.', price: 2500, image: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=800', category: 'Petit-déjeuner', rating: 4.7, isAvailable: true },

  // --- DÉJEUNER ---
  { id: 'kit1', name: 'Kit-Déjeuner Complet', description: 'Formule royale équilibrée : 1 Plat du Jour généreux, 1 Jus Naturel de votre choix (Bissap, Bouye, Gingembre), 1 Salade de fruits frais de saison, et 1 bidon d\'eau minérale fraîche. (Livraison non incluse).', price: 5000, image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800', category: 'Déjeuner', rating: 5, isAvailable: true },
  { id: 'lc1', name: 'Garba Ivoirien Classique', description: 'La formule ultime d\'attiéké (semoule de manioc cuite à la vapeur) servie avec du thon frit doré, du piment frais haché et des oignons croquants.', price: 3500, image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=800', category: 'Déjeuner', rating: 5, isAvailable: true },
  { id: 'lc2', name: 'Yassa au Poulet Mariné', description: 'Cuisse de poulet fermier braisée, nappée d\'une sauce fondante aux oignons caramélisés, citron vert et moutarde de Dijon, livrée avec du riz cassé parfumé.', price: 4000, image: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=800', category: 'Déjeuner', rating: 4.8, isAvailable: true },

  // --- DÎNER ---
  { id: 'dn1', name: 'Soupou Kandia Royal', description: 'Un ragoût d\'okra traditionnel extrêmement riche en crevettes fraîches, crabe, poisson fumé et morceaux de bœuf tendre, lié à l\'huile de palme rouge fine, servi sur riz blanc royal.', price: 5000, image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800', category: 'Dîner', rating: 5, isAvailable: true, isSpicy: true },
  { id: 'dn2', name: 'Brochettes de Filet de Bœuf (Suya)', description: 'Tendres tranches de filet de bœuf marinées à l\'huile d\'arachide et aux épices Kankankan (piment rouge, gingembre, arachide torréfiée), grillées au feu de bois.', price: 4000, image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800', category: 'Dîner', rating: 4.9, isAvailable: true, isSpicy: true },
  { id: 'dn3', name: 'Saka Saka de Kinshasa', description: 'Mijoté de feuilles de manioc finement pilées avec du poisson capitaine fumé, de la viande de bœuf séchée et de la pâte d\'arachide onctueuse, accompagné de riz parfumé.', price: 4500, image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800', category: 'Dîner', rating: 4.7, isAvailable: true },

  // --- ENTRÉES ---
  { id: 'en1', name: 'Pastels au Thon (6pcs)', description: 'Délicieux petits chaussons frits garnis de thon mi-cuit émietté aux oignons et herbes aromatiques, accompagnés de notre sauce tomate piquante de la Chef.', price: 1500, image: 'https://images.unsplash.com/photo-1601050638917-3f80bc61a4bb?w=800', category: 'Entrée', rating: 4.8, isAvailable: true, isLowPrice: true },
  { id: 'en2', name: 'Pastels à la Viande Hachée (6pcs)', description: 'Chaussons frits farcis d\'une viande hachée tendre, persillée, subtilement relevée aux herbes du Sahel, avec leur sauce piquante.', price: 2000, image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800', category: 'Entrée', rating: 4.9, isAvailable: true },
  { id: 'en3', name: 'Aloco de Grand-Bassam', description: 'Bananes plantains bien mûres découpées en dés et frites dans une huile végétale fine, dorées à souhait, accompagnées d\'une sauce pimentée Khady.', price: 1500, image: 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=800', category: 'Entrée', rating: 5, isAvailable: true, isLowPrice: true },
  { id: 'en4', name: 'Salade Sahel Fraîcheur', description: 'Mélange craquant de laitue romaine, concombres, tomates cerises, maïs grillé au beurre de karité et vinaigrette légère au miel de Niamey.', price: 1800, image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800', category: 'Entrée', rating: 4.6, isAvailable: true, isVegetarian: true },

  // --- BOISSONS NATURELLES ---
  { id: 'bo1', name: 'Bissap Rouge Glacé Royal', description: 'Infusion fraîche et royale de fleurs d\'hibiscus sabdariffa du Niger, parfumée à la menthe douce saharienne et au jus d\'ananas pressé.', price: 500, image: 'https://images.unsplash.com/photo-1556881286-fc6915169721?w=800', category: 'Boisson Naturelle', rating: 5, isAvailable: true, isLowPrice: true },
  { id: 'bo2', name: 'Jus de Bouye Onctueux', description: 'Jus naturel crémeux extrait de la pulpe du pain de singe (fruit du baobab), infusé à l\'extrait naturel de vanille de Madagascar et muscade râpée.', price: 1000, image: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=800', category: 'Boisson Naturelle', rating: 4.9, isAvailable: true },
  { id: 'bo3', name: 'Jus de Gingembre Tonique', description: 'Nectar de gingembre frais pressé à froid, adouci par du citron vert et du pur miel sauvage, extrêmement rafraîchissant.', price: 800, image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=800', category: 'Boisson Naturelle', rating: 4.8, isAvailable: true },
  { id: 'bo4', name: 'Jus de Tamarin Douceur', description: 'Boisson rafraîchissante et acidulée à base de tamarin sauvage purifié, légèrement sucrée et infusée d\'eau de rose.', price: 800, image: 'https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=800', category: 'Boisson Naturelle', rating: 4.7, isAvailable: true },

  // --- PLATS AFRICAINS TRANSVERSAUX ---
  { id: 'af3', name: 'Attiéké Poisson Capitaine', description: 'Semoule de manioc cuite, darne de poisson capitaine braisée au bois d\'acacia, oignons blancs et poivrons marinés.', price: 5000, image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=800', category: 'Plat Africain', rating: 5, isAvailable: true },

  // --- DESSERTS ---
  { id: 'de1', name: 'Dégué Royal', description: 'Couscous de mil au yaourt onctueux d\'Afrique de l\'Ouest, miel, éclats de coco séchée.', price: 1500, image: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=800', category: 'Dessert', rating: 4.9, isAvailable: true, isLowPrice: true },

  // --- BOX SAUCES (Min 10) ---
  { id: 'bx1', name: 'Box Sauce Mafé', description: 'Onctueuse sauce à l\'arachide pré-cuite, prête à réchauffer pour napper vos riz. Format familial 1L.', price: 4500, image: 'https://images.unsplash.com/photo-1541518763531-4a949439a3f8?w=800', category: 'Box Sauce', rating: 4.8, isAvailable: true },
  { id: 'bx2', name: 'Box Sauce Gombo', description: 'Sauce gombo riche de la Chef Khady mijotée avec morceaux de bœuf tendre et poisson fumé.', price: 5000, image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800', category: 'Box Sauce', rating: 4.9, isAvailable: true, isSpicy: true },
  { id: 'bx3', name: 'Box Base Yassa', description: 'Mijoté d\'oignons caramélisés au citron jaune acidulé et poivre de Kampot pour vos yassa express.', price: 3500, image: 'https://images.unsplash.com/photo-1588166524941-3bf61a7c41eb?w=800', category: 'Box Sauce', rating: 4.7, isAvailable: true },
  { id: 'bx4', name: 'Box Sauce Kopto', description: 'Sauce traditionnelle à base de feuilles de moringa infusées à la pâte d\'arachide grillée et oignons.', price: 4000, image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800', category: 'Box Sauce', rating: 5, isAvailable: true, isVegetarian: true },
  { id: 'bx8', name: 'Box Piment Feu d\'Afrique', description: 'Purée homogène de piment de Cayenne extra fort et d\'épices secrètes de la maison Khady.', price: 2000, image: 'https://images.unsplash.com/photo-1516824467704-9d4199c98607?w=800', category: 'Box Sauce', rating: 5, isAvailable: true, isSpicy: true },

  // --- PACK-BUFFET (Événements) ---
  { id: 'pb1', name: 'Pack Buffet Mariage', description: 'Buffet complet pour 50 personnes avec entrées, plats de célébration, desserts et service traiteur inclus.', price: 250000, image: 'https://images.unsplash.com/photo-1555244162-803834f70033?w=800', category: 'Pack-Buffet', rating: 5, isAvailable: true, minPeople: 50 },
  { id: 'pb2', name: 'Pack Buffet Anniversaire', description: 'Buffet festif adapté pour 20 personnes, incluant grillades, riz locaux, gâteau d\'anniversaire et boissons.', price: 120000, image: 'https://images.unsplash.com/photo-1530103043960-ef38714abb15?w=800', category: 'Pack-Buffet', rating: 4.9, isAvailable: true, minPeople: 20 },
  { id: 'pb3', name: 'Pack Buffet Corporate', description: 'Une séléction raffinée pour 30 personnes pour vos séminaires, réunions, buffets debout ou assis avec serveurs.', price: 180000, image: 'https://images.unsplash.com/photo-1551818255-e6e10975bc17?w=800', category: 'Pack-Buffet', rating: 5, isAvailable: true, minPeople: 30 }
];

export const DISTRICTS: District[] = [
  // CENTRE VILLE (1000 F / Après 21h : 1500 F)
  { name: 'Plateau', zone: 'center' },
  { name: 'Mosquée Khadafi (Grande Prière)', zone: 'center' },
  { name: 'Yantala', zone: 'center' },
  { name: 'Kouara Kano', zone: 'center' },
  { name: 'Lacouroussou', zone: 'center' },
  { name: 'Dar-Es-Salam', zone: 'center' },
  { name: 'Bobiel', zone: 'center' },
  { name: 'Terminus', zone: 'center' },
  { name: 'Cité Fayçal', zone: 'center' },
  { name: 'Danyassé', zone: 'center' },
  { name: 'Boukoki', zone: 'center' },
  { name: 'Poudrière', zone: 'center' },
  { name: 'Wadata', zone: 'center' },
  { name: 'Petit Marché', zone: 'center' },
  { name: 'Grand Marché', zone: 'center' },
  { name: 'Rue du Fleuve', zone: 'center' },
  { name: 'Corniche Yantala', zone: 'center' },
  { name: 'Bagdad', zone: 'center' },
  { name: 'Zongo', zone: 'center' },
  { name: 'Gandatché', zone: 'center' },
  { name: 'Lazaret', zone: 'center' },
  { name: 'Sonuci', zone: 'center' },
  
  // PÉRIPHÉRIE (1500 F / Après 21h : 2000 F)
  { name: 'Goudel', zone: 'periphery' },
  { name: 'Niamey 2000', zone: 'periphery' },
  { name: 'Saga', zone: 'periphery' },
  { name: 'Aéroport', zone: 'periphery' },
  { name: 'Kalley Est', zone: 'periphery' },
  { name: 'Kalley Centre', zone: 'periphery' },
  { name: 'Gamkallé', zone: 'periphery' },
  { name: 'Karadjé (Rive Droite)', zone: 'periphery' },
  { name: 'Kirkissoye (Rive Droite)', zone: 'periphery' },
  { name: 'Lamordé (Rive Droite)', zone: 'periphery' },
  { name: 'Nogaré (Rive Droite)', zone: 'periphery' },
  { name: 'Harobanda (Rive Droite)', zone: 'periphery' },
  { name: 'Soudouré', zone: 'periphery' },
  { name: 'Koiratégui', zone: 'periphery' },
  { name: 'Tchangarey', zone: 'periphery' },
  { name: 'Talladjé', zone: 'periphery' },
  { name: 'Saga Gorou', zone: 'periphery' },
  { name: 'Dan Zama', zone: 'periphery' },
  { name: 'Pays Bas', zone: 'periphery' },
  { name: 'Garba Kourou', zone: 'periphery' }
];

export const TRAITEUR_CONDITIONS = [
  { title: 'Réservation', detail: 'Préavis minimum de 72h requis.' },
  { title: 'Acompte', detail: '50% à verser à la commande.' },
  { title: 'Livraison', detail: 'Inclus dans tout Niamey.' },
  { title: 'Prestation', detail: 'Personnel de service sur demande.' }
];

export const POINTS_PER_1000 = 100; // 100 points pour 1000 F dépensés
export const DISCOUNT_PER_100_POINTS = 100; // 100 points = 100 F de réduction

export const REWARDS = [
  { id: 'r1', name: 'Réduction 1000 F', cost: 1000, description: '1000 F de réduction sur votre commande.' },
  { id: 'r2', name: 'Pastels Gratuits', cost: 1500, description: 'Une portion de 6 pastels offerte.' },
  { id: 'r3', name: 'Bissap Royal Offert', cost: 500, description: 'Un Bissap rouge glacé de 50cl offert.' },
  { id: 'r4', name: 'Livraison Gratuite', cost: 2000, description: 'Frais de livraison offerts pour votre commande.' }
];

export const REVIEWS: Review[] = [
  { 
    id: '1', 
    name: 'Aïchatou M. (Plateau)', 
    comment: 'Le Tiep Royal au poisson capitaine est juste incroyable ! Livraison Billo super rapide au Plateau, le plat était encore fumant. Bravo Chef Khady !', 
    rating: 5, 
    image: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=300&auto=format&fit=crop', 
    date: 'Aujourd\'hui',
    adminReply: 'Barka Aïchatou ! C\'est un immense plaisir de vous régaler. À très bientôt pour un autre festin ! ✨'
  },
  { 
    id: '2', 
    name: 'Mariama K. (Kouara Kano)', 
    comment: 'Les Box Sauces ont sauvé mon dîner de famille à Kouara Kano. La sauce Mafé est onctueuse et le piment feu d\'Afrique est super bien dosé !', 
    rating: 5, 
    image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop', 
    date: 'Aujourd\'hui',
    adminReply: 'Fofo Mariama ! C\'est exactement pour ces moments en famille que nous avons créé nos Box. Merci pour votre fidélité ! ❤️'
  },
  { 
    id: '3', 
    name: 'Abdoulaye S. (Yantala)', 
    comment: 'Commande passée via Mobile Money Airtel, livraison en 25 minutes chrono avec Billo Express. Les brochettes Suya Kankankan sont à tomber.', 
    rating: 5, 
    image: 'https://images.unsplash.com/photo-1506277886164-e25aa3f4ef7f?w=300&auto=format&fit=crop', 
    date: 'Hier',
    adminReply: 'Barka Abdoulaye ! L\'efficacité Billo + les épices Kankankan, le duo gagnant à Niamey ! 🚲🔥'
  },
  { 
    id: '4', 
    name: 'Ousmane B. (Niamey 2000)', 
    comment: 'Le Dambou du jour au moringa frais est un pur régal traditionnel. Ça rappelle les vraies recettes de grand-mère !', 
    rating: 5, 
    image: 'https://images.unsplash.com/photo-1522529599102-193c0d76b5b6?w=300&auto=format&fit=crop', 
    date: 'Il y a 2 jours',
    adminReply: 'Fofo Ousmane ! La tradition sahelienne est au cœur de tous nos fourneaux. Merci ! 🥘'
  },
  { 
    id: '5', 
    name: 'Fatouma H. (Goudel)', 
    comment: 'Buffet d\'anniversaire commandé pour 20 personnes. Tout le monde a adoré les pastels au thon et le Bissap glacé !', 
    rating: 5, 
    image: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=300&auto=format&fit=crop', 
    date: 'Il y a 3 jours',
    adminReply: 'Toute l\'équipe Khady\'s Food & Event vous souhaite encore un très joyeux anniversaire ! 🎉'
  }
];

export const INITIAL_BLOG_POSTS: BlogPost[] = [
  {
    id: 'b1',
    title: 'Le Secret du Moringa & Dambou : L\'Or Vert du Sahel',
    subtitle: 'Comment la Chef Khady sublime le moringa du fleuve Niger dans son Dambou royal.',
    content: `Le moringa, surnommé "l'arbre de vie" au Niger, est une source inestimable de vitamines et de minéraux. Chez Khady's Food, notre Dambou ne se contente pas d'être délicieux : les feuilles fraîchement récoltées le matin au bord du fleuve Niger sont lavées à l'eau purifiée puis incorporées à la semoule de mil ou de maïs cuite à la vapeur.

Le secret de notre marinade ? Une pointe de pâte d'arachide torréfiée à l'ancienne, relevée de piment doux et d'un filet d'huile de sésame ambrée. Servi avec du poulet fermier braisé au feu de bois, c'est le plat santé et réconfortant par excellence.`,
    author: 'Chef Khady',
    date: '31 Juillet 2026',
    readTime: '3 min',
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800',
    category: 'Recettes Secrètes',
    likes: 142,
    commentsCount: 18,
    isPublished: true,
    featuredDishId: 'dj1'
  },
  {
    id: 'b2',
    title: 'Pourquoi la Cloud Kitchen est l\'Avenir de la Gastronomie à Niamey',
    subtitle: 'Découvrez les coulisses d\'un restaurant 100% numérique axé sur la fraîcheur et la rapidité.',
    content: `Sans salle de restaurant physique ni tables immobiles, Khady's Food réinvente la restauration à Niamey. Toute notre énergie et nos investissements sont concentrés dans 2 éléments fondamentaux :
1. La qualité premium des ingrédients locaux (viande bio de la boucherie centrale, poissons capitaine du fleuve, épices du marché de Katako).
2. L'emballage isotherme haute technologie et notre flotte exclusive Billo Express.

Résultat : Vos plats arrivent chez vous au Plateau, Yantala, Kouara Kano ou Niamey 2000 avec la même température et le même croustillant qu'en sortie de fourneau !`,
    author: 'Équipe Tech & Food Khady',
    date: '28 Juillet 2026',
    readTime: '4 min',
    image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800',
    category: 'Coulisses Chef',
    likes: 210,
    commentsCount: 34,
    isPublished: true
  },
  {
    id: 'b3',
    title: 'Les Box Sauces : Comment Manger comme au Restaurant à la Maison',
    subtitle: 'Conservez vos sauces Mafé, Kopto et Gombo au frais pendant 7 jours sans altérer le goût.',
    content: `Combien de fois avez-vous eu envie d'une vraie sauce Mafé ou Kopto savoureuse en rentrant du travail sans avoir le temps de piler les ingrédients ? Nos Box Sauces hermétiques réutilisables sont cuisinées à basse température. Il vous suffit de réchauffer 5 minutes au micro-ondes ou à la casserole et de napper votre riz chaud. Un vrai régal familial !`,
    author: 'Chef Khady',
    date: '24 Juillet 2026',
    readTime: '2 min',
    image: 'https://images.unsplash.com/photo-1541518763531-4a949439a3f8?w=800',
    category: 'Conseils Nutrition',
    likes: 98,
    commentsCount: 12,
    isPublished: true,
    featuredDishId: 'bx1'
  }
];

export const INITIAL_GALLERY_ITEMS: GalleryItem[] = [
  {
    id: 'g1',
    title: 'Tiep Royal au Capitaine du Fleuve',
    category: 'Plat Africain',
    image: 'https://images.unsplash.com/photo-1627308595229-7830a5c91f9f?w=800',
    likes: 389,
    dishId: 'sp1',
    tag: 'Best-Seller',
    description: 'Le chef-d\'œuvre Khady\'s servi avec riz rouge parfumé et légumes fondants.'
  },
  {
    id: 'g2',
    title: 'Plateau Prestige Event & Grillades',
    category: 'Traiteur & Event',
    image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800',
    likes: 512,
    dishId: 'sp2',
    tag: 'Prestige',
    description: 'Assortiment géant de grillades au feu de bois pour célébrations.'
  },
  {
    id: 'g3',
    title: 'Pastels Dorés & Sauce Piquante',
    category: 'Entrée',
    image: 'https://images.unsplash.com/photo-1601050638917-3f80bc61a4bb?w=800',
    likes: 275,
    dishId: 'en1',
    tag: 'Gourmand',
    description: 'Croustillants à souhait, pétris et frits minute.'
  },
  {
    id: 'g4',
    title: 'Box Sauce Mafé Crémeuse',
    category: 'Box Sauce',
    image: 'https://images.unsplash.com/photo-1541518763531-4a949439a3f8?w=800',
    likes: 198,
    dishId: 'bx1',
    tag: 'Format Familial',
    description: 'Sauce à l\'arachide mijotée 4h au feu doux.'
  },
  {
    id: 'g5',
    title: 'Bissap Rouge Glacé à la Menthe',
    category: 'Boisson Naturelle',
    image: 'https://images.unsplash.com/photo-1556881286-fc6915169721?w=800',
    likes: 420,
    dishId: 'bo1',
    tag: 'Rafraîchissant',
    description: 'Fleurs d\'hibiscus purifiées et menthe fraîche du Sahel.'
  },
  {
    id: 'g6',
    title: 'Suya Brochettes de Filet de Bœuf',
    category: 'Dîner & Grillades',
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800',
    likes: 310,
    dishId: 'dn2',
    tag: 'Épicé Kankankan',
    description: 'Viande tendre marinée aux épices traditionnelles.'
  }
];

export const INITIAL_CLIENTS: ClientUser[] = [
  {
    id: 'c1',
    name: 'Abdou R.',
    phone: '+227 90 00 00 00',
    email: 'abdou.r@gmail.com',
    district: 'Plateau',
    points: 1250,
    rank: 'Gold',
    totalOrders: 14,
    totalSpent: 87500,
    lastOrderDate: '2026-07-30'
  },
  {
    id: 'c2',
    name: 'Mariama K.',
    phone: '+227 96 11 22 33',
    email: 'mariama.k@yahoo.fr',
    district: 'Kouara Kano',
    points: 3400,
    rank: 'Platinum',
    totalOrders: 28,
    totalSpent: 195000,
    lastOrderDate: '2026-07-29'
  },
  {
    id: 'c3',
    name: 'Ousmane B.',
    phone: '+227 80 44 55 66',
    email: 'ousmane.b@gmail.com',
    district: 'Yantala',
    points: 600,
    rank: 'Silver',
    totalOrders: 5,
    totalSpent: 32000,
    lastOrderDate: '2026-07-25'
  }
];
