
import { District, MenuItem, Review } from './types';

export const DELIVERY_TIME = "25 à 45 mn";
export const ADMIN_PASSWORD = "khadysfood";
// Utilisation du logo fourni par l'utilisateur
export const LOGO_URL = "https://i.ibb.co/h1rgJJMb/1766933626062.jpg"; 
export const LOGO_VIDEO_URL = "https://v.ft-static.com/video/469c3a3809e5b7226252994c5026210b/downloads/default.mp4";
export const BILLO_LOGO_URL = "https://i.ibb.co/YFftbm2X/1765927283591.jpg";

export const BILLO_INFO = {
  name: "Billo Express",
  slogan: "L'éclair de Niamey",
  phone: "+227 92 08 08 22",
  whatsapp: "+227 92 08 08 22",
  whatsappClean: "22792080822",
  tarifs: {
    center: { day: 1000, night: 1500 },
    periphery: { day: 1500, night: 2000 }
  },
  fridayRule: "Livraisons suspendues le vendredi de 12h à 15h pour la grande prière."
};

export const RESTAURANT_INFO = {
  name: "Khady's Food & Event",
  slogan: "L'excellence en un clic",
  phones: ["+227 74 44 16 21", "+227 96 05 23 10", "+227 90 40 51 18"],
  whatsapp: "+227 74 44 16 21",
  whatsappClean: "22774441621",
  whatsappDirectUrl: "https://wa.me/22774441621",
  whatsappCatalogUrl: "https://wa.me/c/74441621",
  directLine: "+227 96 05 23 10",
  directLineClean: "22796052310",
  depositNumbers: {
    group1: "+227 90 40 51 18", // MyNita, Nita transfert, Amanata, Amana transfert, All-Iza Business, Zamany Money
    airtel: "+227 96 05 23 10", // Airtel Money
    moov: "+227 74 44 16 21"   // Moov Money / Flooz
  },
  location: "Grande mosquée : Muamar Kadafi, Niamey",
  socials: {
    facebook: {
      name: "Facebook",
      handle: "Khady's Food & Event",
      url: "https://www.facebook.com/search/top?q=Khady%27s%20Food%20%26%20Event"
    },
    instagram: {
      name: "Instagram",
      handle: "khadys_food",
      url: "https://www.instagram.com/khadys_food"
    },
    tiktok: {
      name: "TikTok",
      handle: "khadys.food.event",
      url: "https://www.tiktok.com/@khadys.food.event"
    }
  }
};

export const MENU_ITEMS: MenuItem[] = [
  // --- INCONTOURNABLES QUOTIDIENS & MENU DU JOUR (LE TRIO DE KHADY & CLASSIQUES) ---
  { 
    id: 'douk-royal', 
    name: 'Le Fameux Doukounou de Khady', 
    description: 'L\'incontournable gâteau de maïs vapeur traditionnel au Sahel, cuit à point, tendre et moelleux, servi avec sa sauce mijotée de la maison, piment vert doux et poisson frit ou poulet braisé.', 
    price: 3000, 
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800', 
    category: 'Menu du Jour', 
    rating: 5, 
    isAvailable: true, 
    isSpécialitéMaison: true, 
    isPlatDuJour: true, 
    isPromo: true 
  },
  { 
    id: 'attieke-royal', 
    name: 'L\'Incontournable Attiéké Royal (Poisson ou Poulet)', 
    description: 'La semoule de manioc attiéké fraîche et aérée de la maison Khady, servie avec darne de poisson capitaine braisée ou poulet croustillant, oignons doux marinés, tomates et piment vert maison.', 
    price: 4500, 
    image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=800', 
    category: 'Menu du Jour', 
    rating: 5, 
    isAvailable: true, 
    isSpécialitéMaison: true, 
    isPlatDuJour: true 
  },
  { 
    id: 'sp1', 
    name: 'Tiep Rouge Royal au Capitaine (Plat Cuisiné du Jour)', 
    description: 'Le grand classique sénégalais au poisson capitaine braisé, riz rouge subtilement parfumé à la tomate et épices douces, chou blanc, carottes et manioc fondants.', 
    price: 5500, 
    image: 'https://images.unsplash.com/photo-1627308595229-7830a5c91f9f?w=800', 
    category: 'Menu du Jour', 
    rating: 5, 
    isAvailable: true, 
    isSpicy: true, 
    isSpécialitéMaison: true, 
    isPlatDuJour: true, 
    isPromo: true 
  },
  {
    id: 'tiep-blanc',
    name: 'Tiep Blanc Royal Penda Mbaye',
    description: 'Riz blanc délicatement mijoté aux herbes et bouillon de poisson frais, servi avec darne de thiof dorée, légumes glacés au jus et sauce beugueudj / bissap blanc acidulée.',
    price: 5000,
    image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=800',
    category: 'Menu du Jour',
    rating: 5,
    isAvailable: true,
    isSpécialitéMaison: true,
    isPlatDuJour: true
  },
  { 
    id: 'dj1', 
    name: 'Dambou du Jour au Moringa & Arachide', 
    description: 'Couscous traditionnel de moringa frais aux arachides grillées pilées et oignons caramélisés, servi avec son poulet braisé croustillant et sauce pimentée douce.', 
    price: 2500, 
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800', 
    category: 'Menu du Jour', 
    rating: 4.9, 
    isAvailable: true, 
    isVegetarian: false, 
    isLowPrice: true, 
    isPlatDuJour: true 
  },
  { 
    id: 'dj2', 
    name: 'Riz au Gras Sahélien de Niamey', 
    description: 'Riz rouge savoureux mijoté à cœur dans un bouillon riche de bœuf et épices locales du désert, servi avec morceaux de viande braisée et piment vert.', 
    price: 2000, 
    image: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=800', 
    category: 'Menu du Jour', 
    rating: 4.8, 
    isAvailable: true, 
    isLowPrice: true, 
    isPlatDuJour: true 
  },
  {
    id: 'dj3',
    name: 'Foutou Banane Sauce Graine Cuisinée',
    description: 'Foutou traditionnel de bananes plantains douces pilées, servi avec une sauce graine de palme onctueuse mijotée avec viande de bœuf tendre et poisson fumé.',
    price: 4500,
    image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800',
    category: 'Menu du Jour',
    rating: 4.9,
    isAvailable: true,
    isSpécialitéMaison: true,
    isPlatDuJour: true
  },
  {
    id: 'dj4',
    name: 'Alloco & Poisson Frit à l\'Ivoirienne',
    description: 'Bananes plantains mûres découpées en dés et frites dorées, accompagnées d\'une darne de carpe croustillante, sauce aux oignons et piment vert écrasé maison.',
    price: 3500,
    image: 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=800',
    category: 'Menu du Jour',
    rating: 5,
    isAvailable: true,
    isPromo: true
  },
  {
    id: 'dj5',
    name: 'Riz Sénégalais au Poulet Croustillant',
    description: 'Riz parfumé doré au curcuma et laurier, cuisse de poulet fermier rôtie au feu de braise, quartier de citron vert et sauce d\'accompagnement mijotée.',
    price: 3000,
    image: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=800',
    category: 'Menu du Jour',
    rating: 4.8,
    isAvailable: true,
    isLowPrice: true
  },
  { 
    id: 'kit1', 
    name: 'Kit-Déjeuner Complet du Chef', 
    description: 'Formule royale équilibrée : 1 Plat du Jour généreux, 1 Jus Naturel au choix (Bissap, Bouye, Gingembre), 1 Salade fraîche de saison et 1 eau minérale fraîche.', 
    price: 5000, 
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800', 
    category: 'Déjeuner', 
    rating: 5, 
    isAvailable: true, 
    isPlatDuJour: true, 
    isPromo: true 
  },

  // --- SPÉCIALITÉS MAISON & GRILLADES ROYALES ---
  { 
    id: 'sp3', 
    name: 'Couscous Royal Sahélien', 
    description: 'Généreux couscous fin cuit à la vapeur, garni de gigot d\'agneau fondant, morceaux de poulet fermier braisé, merguez épicées, légumes du jardin et bouillon riche parfumé au safran du désert.', 
    price: 6500, 
    image: 'https://images.unsplash.com/photo-1541518763531-4a949439a3f8?w=800', 
    category: 'Spécialité Maison', 
    rating: 5, 
    isAvailable: true, 
    isSpécialitéMaison: true 
  },
  { 
    id: 'sp4', 
    name: 'Suya de Didi (Brochettes Royales)', 
    description: 'Fines lamelles de filet de bœuf extra-tendre marinées selon la recette secrète de Didi, panées aux épices Kankankan pimentées à l\'arachide torréfiée et grillées minute au feu de bois.', 
    price: 4500, 
    image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800', 
    category: 'Spécialité Maison', 
    rating: 5, 
    isAvailable: true, 
    isSpicy: true, 
    isSpécialitéMaison: true 
  },
  { 
    id: 'sp2', 
    name: 'Plateau Prestige Event', 
    description: 'Assortiment giga festif de grillades royales, pastels au thon dorés et alloco croustillant pour 4 personnes, sauce pimentée et sauce verte de la maison.', 
    price: 15000, 
    image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800', 
    category: 'Spécialité Maison', 
    rating: 5, 
    isAvailable: true, 
    isSpécialitéMaison: true, 
    isPromo: true 
  },
  {
    id: 'sp5',
    name: 'Poulet Braisé Entier Façon Khady',
    description: 'Poulet fermier entier mariné 24h aux épices secrètes du Sahel, lentement braisé au charbon de bois avec oignons émincés marinés et piment rouge doux.',
    price: 8500,
    image: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=800',
    category: 'Spécialité Maison',
    rating: 5,
    isAvailable: true,
    isSpécialitéMaison: true
  },
  {
    id: 'sp6',
    name: 'Demi-Poulet Braisé Croustillant',
    description: 'Demi-poulet fermier juteux à souhait, peau croustillante parfumée aux aromates de Niamey, servi avec sauce verte pimentée maison.',
    price: 4500,
    image: 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=800',
    category: 'Spécialité Maison',
    rating: 4.9,
    isAvailable: true,
    isSpécialitéMaison: true
  },
  {
    id: 'sp7',
    name: 'Capitaine Entier Braisé du Fleuve Niger',
    description: 'Gros poisson capitaine frais pêché dans le fleuve Niger, mariné aux herbes fraîches et grillé sur braises ardentes avec rondelles d\'oignons et alloco.',
    price: 8000,
    image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=800',
    category: 'Spécialité Maison',
    rating: 5,
    isAvailable: true,
    isSpécialitéMaison: true
  },
  {
    id: 'sp8',
    name: 'Brochettes d\'Agneau au Feu de Bois',
    description: 'Tendres cubes de gigot d\'agneau persillé intercalés d\'oignons doux et poivrons frais, marinés au Kankankan et grillés à point.',
    price: 5000,
    image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800',
    category: 'Spécialité Maison',
    rating: 4.9,
    isAvailable: true,
    isSpicy: true
  },
  {
    id: 'sp9',
    name: 'Dibiterie Spéciale Mouton Rôti',
    description: 'Viande de mouton braisée coupée minute à la méthode traditionnelle des dibiteries, servie dans du papier sulfurisé avec oignons crus et moutarde fine.',
    price: 6000,
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800',
    category: 'Spécialité Maison',
    rating: 5,
    isAvailable: true,
    isSpécialitéMaison: true
  },
  {
    id: 'sp10',
    name: 'Pintade Fermière Rôtie aux Épices Sahariennes',
    description: 'Demi-pintade savoureuse mijotée puis dorée au four, parfumée à l\'ail confit, clous de girofle et romarin sauvage du Sahel.',
    price: 7500,
    image: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=800',
    category: 'Spécialité Maison',
    rating: 4.8,
    isAvailable: true,
    isSpécialitéMaison: true
  },
  {
    id: 'sp11',
    name: 'Chawarma Royal Khady à la Viande de Bœuf',
    description: 'Galette de blé fine garnie de généreuses lamelles de filet de bœuf grillé, tomates fraîches, frites croustillantes et sauce tahini crémeuse à l\'ail.',
    price: 3000,
    image: 'https://images.unsplash.com/photo-1561651823-34feb02250e4?w=800',
    category: 'Spécialité Maison',
    rating: 4.9,
    isAvailable: true,
    isLowPrice: true
  },
  {
    id: 'sp12',
    name: 'Gésiers Sautés Épicés aux Piments Doux',
    description: 'Gésiers de volaille mijotés puis sautés au wok avec oignons rouges, poivrons multicolores et touche de gingembre frais.',
    price: 3500,
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800',
    category: 'Spécialité Maison',
    rating: 4.7,
    isAvailable: true,
    isSpicy: true
  },
  {
    id: 'sp13',
    name: 'Brochettes Mixtes Poulet & Bœuf au Kankankan',
    description: 'Duo savoureux de brochettes de suprêmes de poulet fermier et filet de bœuf braisées au charbon, panées aux arachides torréfiées.',
    price: 4500,
    image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800',
    category: 'Spécialité Maison',
    rating: 5,
    isAvailable: true,
    isSpécialitéMaison: true
  },

  // --- PLATS AFRICAINS TRADITIONNELS & SAUCES ROYALES ---
  {
    id: 'af1',
    name: 'Maffé Traditionnel au Bœuf & Patates Douces',
    description: 'Ragoût ancestral d\'Afrique de l\'Ouest à la pâte d\'arachide grillée onctueuse, morceaux de bœuf tendres, patates douces et riz blanc parfumé.',
    price: 4000,
    image: 'https://images.unsplash.com/photo-1541518763531-4a949439a3f8?w=800',
    category: 'Plat Africain',
    rating: 5,
    isAvailable: true,
    isSpécialitéMaison: true
  },
  { 
    id: 'af2', 
    name: 'Yassa au Poulet Mariné du Sénégal', 
    description: 'Cuisses de poulet fermier braisées nappées d\'une sauce fondante aux oignons caramélisés, moutarde de Dijon et citron vert pressé, servies avec riz cassé parfumé.', 
    price: 4000, 
    image: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=800', 
    category: 'Plat Africain', 
    rating: 4.8, 
    isAvailable: true, 
    isSpécialitéMaison: true 
  },
  { 
    id: 'af3', 
    name: 'Attiéké Poisson Capitaine Braisé', 
    description: 'Semoule de manioc cuite à la vapeur, darne de poisson capitaine braisée au bois d\'acacia, oignons blancs croquants et poivrons marinés.', 
    price: 5000, 
    image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=800', 
    category: 'Plat Africain', 
    rating: 5, 
    isAvailable: true, 
    isSpécialitéMaison: true 
  },
  { 
    id: 'af4', 
    name: 'Soupou Kandia Royal aux Fruits de Mer', 
    description: 'Un ragoût d\'okra traditionnel extrêmement riche en crevettes fraîches, crabe, poisson fumé et morceaux de bœuf tendre, lié à l\'huile de palme rouge fine, servi sur riz blanc.', 
    price: 5000, 
    image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800', 
    category: 'Plat Africain', 
    rating: 5, 
    isAvailable: true, 
    isSpicy: true, 
    isSpécialitéMaison: true 
  },
  { 
    id: 'af5', 
    name: 'Saka Saka / Pondu de Kinshasa', 
    description: 'Mijoté de feuilles de manioc finement pilées avec du poisson capitaine fumé, de la viande de bœuf séchée et de la pâte d\'arachide onctueuse, accompagné de riz parfumé.', 
    price: 4500, 
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800', 
    category: 'Plat Africain', 
    rating: 4.7, 
    isAvailable: true, 
    isVegetarian: false 
  },
  {
    id: 'af6',
    name: 'Kedjenou de Poulet Fermier en Canari',
    description: 'Poulet fermier cuit à l\'étouffée dans un canari de terre cuite avec tomates fraîches, oignons doux, ail et piments entiers, sans ajout d\'eau.',
    price: 5000,
    image: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=800',
    category: 'Plat Africain',
    rating: 4.9,
    isAvailable: true,
    isSpicy: true
  },
  {
    id: 'af7',
    name: 'Ndolé Camerounais Royal aux Gambas',
    description: 'Plat emblématique camerounais à base de feuilles de ndolé cuisinées aux arachides fraîches, crevettes royales, bœuf et bananes plantains frites.',
    price: 5500,
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800',
    category: 'Plat Africain',
    rating: 5,
    isAvailable: true,
    isSpécialitéMaison: true
  },
  {
    id: 'af8',
    name: 'Sauce Gombo Frais & Bœuf Fondant de Niamey',
    description: 'Sauce gombo verte et veloutée préparée avec des gombos frais coupés menu, bœuf fondant et poisson séché, servie avec pâte de maïs ou riz.',
    price: 3500,
    image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800',
    category: 'Plat Africain',
    rating: 4.8,
    isAvailable: true
  },
  {
    id: 'af9',
    name: 'Eru aux Épinards Sauvages & Peau de Bœuf',
    description: 'Feuilles d\'okazi et épinards sauvages mijotés à l\'huile de palme rouge pure avec poisson fumé, écrevisses moulues et peau de bœuf kanda.',
    price: 5000,
    image: 'https://images.unsplash.com/photo-1541518763531-4a949439a3f8?w=800',
    category: 'Plat Africain',
    rating: 4.8,
    isAvailable: true
  },
  {
    id: 'af10',
    name: 'Placali Sauce Graine & Poisson Silure',
    description: 'Pâte de manioc étirée chaude servie avec une sauce graine de palme riche en pulpe, morceaux de silure frais et piments écrasés.',
    price: 4000,
    image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800',
    category: 'Plat Africain',
    rating: 4.7,
    isAvailable: true
  },
  {
    id: 'af11',
    name: 'Egusi Soup / Sauce Pistache Nigériane',
    description: 'Mijoté savoureux de graines de melon moulues avec épinards tendres, tripes de bœuf nettoyées, poisson sec et huile de palme rouge sur fufu ou riz.',
    price: 4500,
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800',
    category: 'Plat Africain',
    rating: 4.9,
    isAvailable: true,
    isSpicy: true
  },
  {
    id: 'af12',
    name: 'Gouro / Sauce Feuilles de Baobab & Viande Fumée',
    description: 'Miyankuuka traditionnelle du Niger préparée avec de la poudre fine de feuilles de baobab séchées, bœuf fumé et pâte d\'arachide.',
    price: 3500,
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800',
    category: 'Plat Africain',
    rating: 4.8,
    isAvailable: true
  },
  {
    id: 'af13',
    name: 'Sauce Foléré / Oseille au Bœuf Fumé',
    description: 'Sauce piquante et légèrement acidulée aux feuilles d\'oseille de Guinée fraîchement récoltées, bœuf séché fumé au feu de bois et arachides.',
    price: 3800,
    image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800',
    category: 'Plat Africain',
    rating: 4.8,
    isAvailable: true
  },
  {
    id: 'af14',
    name: 'Riz Jollof Fumé au Feu de Bois (Party Jollof)',
    description: 'Le légendaire riz rouge sauté au feu de bois parfumé aux tomates rôties, poivrons rouges, piment habanero et cuisse de poulet dorée.',
    price: 3500,
    image: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=800',
    category: 'Plat Africain',
    rating: 5,
    isAvailable: true,
    isSpécialitéMaison: true
  },
  {
    id: 'af15',
    name: 'Fufu de Manioc & Soupe Légère au Poisson Frais',
    description: 'Boule de fufu traditionnel moelleux et lisse, servie avec une soupe claire parfumée aux herbes médicinales et darne de poisson.',
    price: 4000,
    image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=800',
    category: 'Plat Africain',
    rating: 4.7,
    isAvailable: true
  },

  // --- PETITS-DÉJEUNERS TRADITIONNELS ---
  { 
    id: 'pd1', 
    name: 'Café Touba & Beignets Dounguiri', 
    description: 'Café traditionnel sénégalais épicé au poivre de Selim et clou de girofle, accompagné de 5 succulents beignets doux de mil frits dorés.', 
    price: 1500, 
    image: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=800', 
    category: 'Petit-déjeuner', 
    rating: 4.9, 
    isAvailable: true, 
    isLowPrice: true, 
    isPromo: true 
  },
  { 
    id: 'pd2', 
    name: 'Bouillie de Mil au Lait Caillé (Dégué Chaud)', 
    description: 'Onctueuse bouillie traditionnelle de mil agrémentée de miel sauvage, lait caillé crémeux de brousse et éclats de noix de coco râpée.', 
    price: 2000, 
    image: 'https://images.unsplash.com/photo-1574316071802-0d684efa7bf5?w=800', 
    category: 'Petit-déjeuner', 
    rating: 4.8, 
    isAvailable: true, 
    isVegetarian: true 
  },
  { 
    id: 'pd3', 
    name: 'Omelette Sahélienne & Pain Tapalapa', 
    description: 'Deux œufs frais battus aux oignons caramélisés, piments doux et tomates fraîches, servis avec le pain traditionnel Tapalapa chaud.', 
    price: 2500, 
    image: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=800', 
    category: 'Petit-déjeuner', 
    rating: 4.7, 
    isAvailable: true 
  },
  {
    id: 'pd4',
    name: 'Pain Chargé Omelette-Sardine Niamey',
    description: 'Le sandwich matin emblématique des rues de Niamey : demi-baguette croustillante garnie d\'omelette persillée, sardines à l\'huile pimentée et oignons.',
    price: 2000,
    image: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=800',
    category: 'Petit-déjeuner',
    rating: 4.9,
    isAvailable: true,
    isLowPrice: true
  },
  {
    id: 'pd5',
    name: 'Beignets Koba Soufflés du Matin (Portion de 8)',
    description: 'Beignets de farine de froment et sucre de canne, frits minute, dorés et croustillants à l\'extérieur, légers et aériens à l\'intérieur.',
    price: 1000,
    image: 'https://images.unsplash.com/photo-1586985289688-ca3cf47d3e6e?w=800',
    category: 'Petit-déjeuner',
    rating: 4.8,
    isAvailable: true,
    isLowPrice: true
  },
  {
    id: 'pd6',
    name: 'Bouillie de Sorgho Rouge au Gingembre',
    description: 'Bouillie fortifiante préparée avec de la farine de sorgho complet, un zeste de gingembre râpé, jus de citron et sucre roux.',
    price: 1500,
    image: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=800',
    category: 'Petit-déjeuner',
    rating: 4.7,
    isAvailable: true,
    isVegetarian: true
  },
  {
    id: 'pd7',
    name: 'Beignets de Haricot Akara / Koose (6pcs)',
    description: 'Bouchées salées de niébé écrasé aux oignons et piment doux, frites croustillantes, servies avec sauce tomate tiède.',
    price: 1200,
    image: 'https://images.unsplash.com/photo-1601050638917-3f80bc61a4bb?w=800',
    category: 'Petit-déjeuner',
    rating: 4.8,
    isAvailable: true,
    isVegetarian: true,
    isLowPrice: true
  },
  {
    id: 'pd8',
    name: 'Petit-Déjeuner Continental Sahélien',
    description: 'Thé vert à la menthe ou café noir, 2 croissants frais dorés au beurre, pain baguette, confiture de mangue maison et beurre.',
    price: 3000,
    image: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=800',
    category: 'Petit-déjeuner',
    rating: 4.8,
    isAvailable: true
  },

  // --- DÉJEUNERS & REPAS COMPLETS RAPIDES ---
  { 
    id: 'lc1', 
    name: 'Garba Ivoirien Classique au Thon Frit', 
    description: 'La formule authentique d\'attiéké vapeur servie avec une darne de thon frit croustillante, piment frais haché et oignons doux émincés.', 
    price: 3500, 
    image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=800', 
    category: 'Déjeuner', 
    rating: 5, 
    isAvailable: true, 
    isSpicy: true 
  },
  { 
    id: 'lc2', 
    name: 'Yassa au Poulet Mariné Express', 
    description: 'Cuisse de poulet braisée dorée nappée d\'une généreuse sauce aux oignons fondants et citron vert, servie avec du riz blanc.', 
    price: 4000, 
    image: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=800', 
    category: 'Déjeuner', 
    rating: 4.8, 
    isAvailable: true, 
    isSpécialitéMaison: true 
  },
  {
    id: 'lc3',
    name: 'Spaghetti Sahélien Khady aux Épices Douces',
    description: 'Plat populaire revisité : spaghetti sautés à feu vif avec tomates fraîches, petits morceaux de bœuf mariné, oignons rouges et fines herbes.',
    price: 2500,
    image: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=800',
    category: 'Déjeuner',
    rating: 4.8,
    isAvailable: true,
    isLowPrice: true
  },
  {
    id: 'lc4',
    name: 'Riz Blanc & Sauce Tomate Mijotée aux Boulettes',
    description: 'Riz cassé parfumé accompagné d\'une sauce tomate mijotée aux 4 épices avec boulettes artisanales de pur bœuf assaisonné.',
    price: 3000,
    image: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=800',
    category: 'Déjeuner',
    rating: 4.7,
    isAvailable: true
  },
  {
    id: 'lc5',
    name: 'Sandwich Suya Baguette Chaud',
    description: 'Baguette croustillante garnie de fines tranches de suya de bœuf grillé, rondelles de tomates, oignons doux et pincée de kankankan.',
    price: 2500,
    image: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=800',
    category: 'Déjeuner',
    rating: 4.9,
    isAvailable: true,
    isSpicy: true,
    isLowPrice: true
  },
  {
    id: 'lc6',
    name: 'Brochettes Foie & Rognons de Bœuf',
    description: 'Brochettes traditionnelles tendres et savoureuses marinées au citron et épices du Sahel, grillées au charbon de bois.',
    price: 3000,
    image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800',
    category: 'Déjeuner',
    rating: 4.7,
    isAvailable: true
  },
  {
    id: 'lc7',
    name: 'Plat Diassana au Poisson Sec & Tomate',
    description: 'Riz blanc local cuit dans une réduction de bouillon parfumé au poisson fumé, avec aubergines et oignons frits.',
    price: 3000,
    image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=800',
    category: 'Déjeuner',
    rating: 4.6,
    isAvailable: true
  },
  {
    id: 'lc8',
    name: 'Riz Sauté Africain aux Crevettes & Légumes',
    description: 'Riz parfumé sauté au wok avec crevettes locales, carottes croquantes, petits pois, œufs battus et sauce soja douce.',
    price: 4000,
    image: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=800',
    category: 'Déjeuner',
    rating: 4.8,
    isAvailable: true
  },

  // --- DÎNER & SOUPES RÉCONFORTANTES ---
  { 
    id: 'dn1', 
    name: 'Soupou Kandia Royal du Soir', 
    description: 'Un ragoût d\'okra traditionnel riche en crevettes fraîches, crabe, poisson fumé et morceaux de bœuf tendre lié à l\'huile de palme rouge.', 
    price: 5000, 
    image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800', 
    category: 'Dîner', 
    rating: 5, 
    isAvailable: true, 
    isSpicy: true, 
    isSpécialitéMaison: true 
  },
  { 
    id: 'dn2', 
    name: 'Brochettes de Filet de Bœuf (Suya Box)', 
    description: 'Tendres tranches de filet de bœuf marinées à l\'huile d\'arachide et aux épices Kankankan, grillées au feu de bois avec alloco.', 
    price: 4000, 
    image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800', 
    category: 'Dîner', 
    rating: 4.9, 
    isAvailable: true, 
    isSpicy: true 
  },
  { 
    id: 'dn3', 
    name: 'Saka Saka Douceur de Kinshasa', 
    description: 'Mijoté de feuilles de manioc finement pilées avec poisson capitaine fumé, viande de bœuf séchée et pâte d\'arachide, servi avec riz.', 
    price: 4500, 
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800', 
    category: 'Dîner', 
    rating: 4.7, 
    isAvailable: true 
  },
  {
    id: 'dn4',
    name: 'Peppersoup / Soupe de Chèvre Épicée',
    description: 'Bouillon traditionnel revigorant à base de morceaux tendres de viande de chèvre mijotée aux herbes médicinales, graines d\'efirin et piment oiseau.',
    price: 4000,
    image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800',
    category: 'Dîner',
    rating: 4.9,
    isAvailable: true,
    isSpicy: true
  },
  {
    id: 'dn5',
    name: 'Bouillon de Capitaine Citronné du Fleuve',
    description: 'Soupe légère et parfumée de poisson capitaine frais mijoté avec carottes, tomates fraîches, céleri et jus de citron vert pressé.',
    price: 4500,
    image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=800',
    category: 'Dîner',
    rating: 4.8,
    isAvailable: true
  },
  {
    id: 'dn6',
    name: 'Ailerons de Poulet Braisés & Alloco Doré',
    description: '6 ailerons de poulet généreusement enrobés de marinade aux épices douces, braisés au charbon et servis avec alloco croustillant.',
    price: 3500,
    image: 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=800',
    category: 'Dîner',
    rating: 4.9,
    isAvailable: true
  },

  // --- ENTRÉES & TAPAS GOURMANDS ---
  { 
    id: 'en1', 
    name: 'Pastels au Thon Maison (6pcs)', 
    description: 'Délicieux petits chaussons frits garnis de thon mi-cuit émietté aux oignons et herbes aromatiques, accompagnés de notre sauce tomate piquante.', 
    price: 1500, 
    image: 'https://images.unsplash.com/photo-1601050638917-3f80bc61a4bb?w=800', 
    category: 'Entrée', 
    rating: 4.8, 
    isAvailable: true, 
    isLowPrice: true, 
    isPromo: true 
  },
  { 
    id: 'en2', 
    name: 'Pastels à la Viande Hachée (6pcs)', 
    description: 'Chaussons frits farcis d\'une viande hachée tendre, persillée, subtilement relevée aux herbes du Sahel, avec leur sauce piquante.', 
    price: 2000, 
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800', 
    category: 'Entrée', 
    rating: 4.9, 
    isAvailable: true, 
    isSpicy: true 
  },
  { 
    id: 'en3', 
    name: 'Aloco de Grand-Bassam', 
    description: 'Bananes plantains bien mûres découpées en dés et frites dans une huile végétale fine, dorées à souhait, accompagnées d\'une sauce pimentée Khady.', 
    price: 1500, 
    image: 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=800', 
    category: 'Entrée', 
    rating: 5, 
    isAvailable: true, 
    isVegetarian: true, 
    isLowPrice: true 
  },
  { 
    id: 'en4', 
    name: 'Salade Sahel Fraîcheur', 
    description: 'Mélange craquant de laitue romaine, concombres, tomates cerises, maïs grillé au beurre de karité et vinaigrette légère au miel de Niamey.', 
    price: 1800, 
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800', 
    category: 'Entrée', 
    rating: 4.6, 
    isAvailable: true, 
    isVegetarian: true 
  },
  {
    id: 'en5',
    name: 'Nems Africains Croustillants (4pcs)',
    description: 'Rouleaux frits ultra-croustillants garnis de poulet fermier effiloché, vermicelles de haricots, champignons noirs et carottes râpées.',
    price: 2000,
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800',
    category: 'Entrée',
    rating: 4.8,
    isAvailable: true
  },
  {
    id: 'en6',
    name: 'Samoussas au Bœuf Épicé (5pcs)',
    description: 'Triangles de pâte feuilletée croustillante farcis d\'un haché de bœuf sauté au cumin, coriandre fraîche et poivre noir.',
    price: 2000,
    image: 'https://images.unsplash.com/photo-1601050638917-3f80bc61a4bb?w=800',
    category: 'Entrée',
    rating: 4.9,
    isAvailable: true,
    isSpicy: true
  },
  {
    id: 'en7',
    name: 'Frites d\'Igname Blanche Dorées',
    description: 'Bâtonnets d\'igname blanche de saison frits à la perfection, moelleux à cœur et dorés dehors, servis avec sauce tomate de la maison.',
    price: 1500,
    image: 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=800',
    category: 'Entrée',
    rating: 4.7,
    isAvailable: true,
    isVegetarian: true,
    isLowPrice: true
  },
  {
    id: 'en8',
    name: 'Accras de Niébé aux Herbes (8pcs)',
    description: 'Beignets savoureux de pâte de haricots blancs fouettée aux herbes aromatiques et piment doux, frites légères.',
    price: 1200,
    image: 'https://images.unsplash.com/photo-1601050638917-3f80bc61a4bb?w=800',
    category: 'Entrée',
    rating: 4.8,
    isAvailable: true,
    isVegetarian: true,
    isLowPrice: true
  },

  // --- BOISSONS NATURELLES ARTISANALES ---
  { 
    id: 'bo1', 
    name: 'Bissap Rouge Glacé Royal (50cl)', 
    description: 'Infusion fraîche et royale de fleurs d\'hibiscus sabdariffa du Niger, parfumée à la menthe douce saharienne et au pur jus d\'ananas pressé.', 
    price: 500, 
    image: 'https://images.unsplash.com/photo-1556881286-fc6915169721?w=800', 
    category: 'Boisson Naturelle', 
    rating: 5, 
    isAvailable: true, 
    isVegetarian: true, 
    isLowPrice: true, 
    isPromo: true 
  },
  { 
    id: 'bo2', 
    name: 'Jus de Bouye Onctueux au Baobab (50cl)', 
    description: 'Jus naturel crémeux extrait de la pulpe du fruit du baobab, infusé à l\'extrait naturel de vanille de Madagascar et une pointe de muscade.', 
    price: 1000, 
    image: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=800', 
    category: 'Boisson Naturelle', 
    rating: 4.9, 
    isAvailable: true, 
    isVegetarian: true 
  },
  { 
    id: 'bo3', 
    name: 'Jus de Gingembre Tonique au Miel (50cl)', 
    description: 'Nectar de gingembre frais pressé à froid, adouci par du citron vert et du pur miel sauvage, extrêmement rafraîchissant et énergisant.', 
    price: 800, 
    image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=800', 
    category: 'Boisson Naturelle', 
    rating: 4.8, 
    isAvailable: true, 
    isVegetarian: true, 
    isSpicy: true 
  },
  { 
    id: 'bo4', 
    name: 'Jus de Tamarin Douceur Sauvage (50cl)', 
    description: 'Boisson rafraîchissante et acidulée à base de tamarin sauvage purifié, légèrement sucrée et infusée d\'eau de rose.', 
    price: 800, 
    image: 'https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=800', 
    category: 'Boisson Naturelle', 
    rating: 4.7, 
    isAvailable: true, 
    isVegetarian: true 
  },
  {
    id: 'bo5',
    name: 'Cocktail Sahel Détox Bissap-Gingembre (50cl)',
    description: 'Mélange signature équilibré associant la rondeur fruitée du bissap rouge et le piquant tonifiant du gingembre frais avec menthe pilée.',
    price: 1000,
    image: 'https://images.unsplash.com/photo-1556881286-fc6915169721?w=800',
    category: 'Boisson Naturelle',
    rating: 5,
    isAvailable: true,
    isVegetarian: true
  },
  {
    id: 'bo6',
    name: 'Pur Jus d\'Ananas Frais Pressé à la Menthe (50cl)',
    description: 'Ananas doux de saison mûri au soleil, pressé minute sans eau ajoutée ni sucre de synthèse, avec feuilles de menthe fraîche.',
    price: 1000,
    image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=800',
    category: 'Boisson Naturelle',
    rating: 4.9,
    isAvailable: true,
    isVegetarian: true
  },
  {
    id: 'bo7',
    name: 'Jus de Corossol Exotique Velouté (50cl)',
    description: 'Boisson exotique riche et onctueuse préparée à partir de pulpe fraîche de corossol et quelques gouttes de citron vert.',
    price: 1200,
    image: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=800',
    category: 'Boisson Naturelle',
    rating: 4.8,
    isAvailable: true,
    isVegetarian: true
  },
  {
    id: 'bo8',
    name: 'Kinkeliba Glacé Infusé au Citron (50cl)',
    description: 'Infusion bienfaisante et digestive de feuilles sauvages de kinkeliba, servie très fraîche avec un filet de citron et miel d\'acacia.',
    price: 700,
    image: 'https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=800',
    category: 'Boisson Naturelle',
    rating: 4.7,
    isAvailable: true,
    isVegetarian: true,
    isLowPrice: true
  },
  {
    id: 'bo9',
    name: 'Nectar Pur de Goyave Rose Sauvage (50cl)',
    description: 'Nectar parfumé et velouté préparé à partir de goyaves roses gorgées de soleil, adouci par une touche d\'eau de fleur d\'oranger.',
    price: 1000,
    image: 'https://images.unsplash.com/photo-1556881286-fc6915169721?w=800',
    category: 'Boisson Naturelle',
    rating: 4.9,
    isAvailable: true,
    isVegetarian: true
  },

  // --- DESSERTS & DOUCEURS SUCRÉES ---
  { 
    id: 'de1', 
    name: 'Dégué Royal au Yaourt & Noix de Coco', 
    description: 'Semoule fine de mil cuite à la vapeur mélangée à un yaourt crémeux traditionnel d\'Afrique de l\'Ouest, miel sauvage et éclats de coco séchée.', 
    price: 1500, 
    image: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=800', 
    category: 'Dessert', 
    rating: 4.9, 
    isAvailable: true, 
    isVegetarian: true, 
    isLowPrice: true 
  },
  {
    id: 'de2',
    name: 'Thiacry Traditionnel aux Raisins Secs',
    description: 'Couscous de mil parfumé à la muscade et lié à la crème de lait fermenté onctueuse, parsemé de raisins secs blonds et vanille.',
    price: 1500,
    image: 'https://images.unsplash.com/photo-1574316071802-0d684efa7bf5?w=800',
    category: 'Dessert',
    rating: 4.8,
    isAvailable: true,
    isVegetarian: true,
    isLowPrice: true
  },
  {
    id: 'de3',
    name: 'Salade de Fruits Exotiques Frais Coupés',
    description: 'Mélange rafraîchissant de mangue du Niger bien mûre, ananas doux, papaye et bananes arrosés d\'un jus de citron vert.',
    price: 1500,
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800',
    category: 'Dessert',
    rating: 4.9,
    isAvailable: true,
    isVegetarian: true,
    isLowPrice: true
  },
  {
    id: 'de4',
    name: 'Gâteau Moelleux à la Banane Plantain',
    description: 'Part généreuse de gâteau fondant préparé à la purée de bananes plantains mûres, cannelle douce et pointe de vanille.',
    price: 1200,
    image: 'https://images.unsplash.com/photo-1586985289688-ca3cf47d3e6e?w=800',
    category: 'Dessert',
    rating: 4.7,
    isAvailable: true,
    isVegetarian: true,
    isLowPrice: true
  },
  {
    id: 'de5',
    name: 'Beignets Yoyo Sucrés au Miel Sauvage (6pcs)',
    description: 'Petits beignets dorés croustillants nappés d\'un sirop léger au miel sauvage et eau de fleur d\'oranger.',
    price: 1000,
    image: 'https://images.unsplash.com/photo-1586985289688-ca3cf47d3e6e?w=800',
    category: 'Dessert',
    rating: 4.8,
    isAvailable: true,
    isVegetarian: true,
    isLowPrice: true
  },
  {
    id: 'de6',
    name: 'Mousse Veloutée au Baobab & Mangue',
    description: 'Entremets léger et aérien combinant la pulpe acidulée du baobab à la douceur veloutée d\'un coulis de mangue fraîche.',
    price: 1800,
    image: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=800',
    category: 'Dessert',
    rating: 5,
    isAvailable: true,
    isVegetarian: true
  },
  {
    id: 'de7',
    name: 'Crêpes Sahéliennes à la Farine de Mil & Banane',
    description: 'Deux crêpes légères à base de farine de mil et blé, fourrées de rondelles de bananes revenues au beurre et nappées de miel d\'acacia.',
    price: 1500,
    image: 'https://images.unsplash.com/photo-1586985289688-ca3cf47d3e6e?w=800',
    category: 'Dessert',
    rating: 4.8,
    isAvailable: true,
    isVegetarian: true,
    isLowPrice: true
  },

  // --- BOX SAUCES (FORMAT FAMILIAL 1L - MIN 10) ---
  { 
    id: 'bx1', 
    name: 'Box Sauce Mafé Familiale (1L)', 
    description: 'Onctueuse sauce à l\'arachide pré-cuite selon la tradition, prête à réchauffer pour napper vos viandes et riz. Format familial 1L.', 
    price: 4500, 
    image: 'https://images.unsplash.com/photo-1541518763531-4a949439a3f8?w=800', 
    category: 'Box Sauce', 
    rating: 4.8, 
    isAvailable: true, 
    isSpécialitéMaison: true 
  },
  { 
    id: 'bx2', 
    name: 'Box Sauce Gombo Riche de la Chef (1L)', 
    description: 'Sauce gombo riche de la Chef Khady mijotée avec morceaux de bœuf tendre et poisson fumé, prête à servir sur vos pâtes ou riz.', 
    price: 5000, 
    image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800', 
    category: 'Box Sauce', 
    rating: 4.9, 
    isAvailable: true, 
    isSpicy: true 
  },
  { 
    id: 'bx3', 
    name: 'Box Base Yassa aux Oignons Caramélisés (1L)', 
    description: 'Mijoté d\'oignons caramélisés au citron jaune acidulé, moutarde de Dijon et poivre de Kampot pour préparer vos yassa express.', 
    price: 3500, 
    image: 'https://images.unsplash.com/photo-1588166524941-3bf61a7c41eb?w=800', 
    category: 'Box Sauce', 
    rating: 4.7, 
    isAvailable: true 
  },
  { 
    id: 'bx4', 
    name: 'Box Sauce Kopto Moringa Sahélien (1L)', 
    description: 'Sauce traditionnelle à base de jeunes feuilles de moringa infusées à la pâte d\'arachide grillée, ail et oignons doux.', 
    price: 4000, 
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800', 
    category: 'Box Sauce', 
    rating: 5, 
    isAvailable: true, 
    isVegetarian: true 
  },
  {
    id: 'bx5',
    name: 'Box Sauce Tomate Mijotée Maison (1L)',
    description: 'Coulis riche de tomates fraîches réduites à feu doux avec laurier, thym et mélange d\'épices douces de la maison Khady.',
    price: 3000,
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800',
    category: 'Box Sauce',
    rating: 4.8,
    isAvailable: true,
    isVegetarian: true
  },
  { 
    id: 'bx8', 
    name: 'Box Purée Piment Feu d\'Afrique (500g)', 
    description: 'Purée homogène et puissante de piment de Cayenne frais, gingembre et ail confit selon la recette secrète de la maison Khady.', 
    price: 2000, 
    image: 'https://images.unsplash.com/photo-1516824467704-9d4199c98607?w=800', 
    category: 'Box Sauce', 
    rating: 5, 
    isAvailable: true, 
    isSpicy: true, 
    isVegetarian: true 
  },

  // --- PACK-BUFFET (ÉVÉNEMENTS & RÉCEPTIONS) ---
  { 
    id: 'pb1', 
    name: 'Pack Buffet Mariage & Célébrations', 
    description: 'Buffet complet haut de gamme pour 50 personnes avec entrées variées, tiep royal, couscous, grillades mixtes, desserts et service traiteur inclus.', 
    price: 250000, 
    image: 'https://images.unsplash.com/photo-1555244162-803834f70033?w=800', 
    category: 'Pack-Buffet', 
    rating: 5, 
    isAvailable: true, 
    minPeople: 50, 
    isSpécialitéMaison: true 
  },
  { 
    id: 'pb2', 
    name: 'Pack Buffet Anniversaire Festif', 
    description: 'Buffet festif pour 20 personnes incluant grillades mixtes (poulet & brochettes), alloco doré, pastels croustillants, gâteau et boissons naturelles.', 
    price: 120000, 
    image: 'https://images.unsplash.com/photo-1530103043960-ef38714abb15?w=800', 
    category: 'Pack-Buffet', 
    rating: 4.9, 
    isAvailable: true, 
    minPeople: 20 
  },
  { 
    id: 'pb3', 
    name: 'Pack Buffet Corporate & Séminaires', 
    description: 'Sélection raffinée pour 30 personnes pour vos séminaires, réunions de direction, cocktails debout avec maîtres d\'hôtel et boissons incluses.', 
    price: 180000, 
    image: 'https://images.unsplash.com/photo-1551818255-e6e10975bc17?w=800', 
    category: 'Pack-Buffet', 
    rating: 5, 
    isAvailable: true, 
    minPeople: 30 
  }
];

export const DISTRICTS: District[] = [
  // QUARTIERS PROCHES (Autour de la Grande Mosquée Muamar Kadafi - 1000 F Jour / 1500 F Nuit)
  { name: 'Grande Mosquée / Zongo', zone: 'center' },
  { name: 'Boukoki', zone: 'center' },
  { name: 'Poudrière', zone: 'center' },
  { name: 'Wadata', zone: 'center' },
  { name: 'Lacouroussou', zone: 'center' },
  { name: 'Terminus', zone: 'center' },
  { name: 'Katako / Grand Marché', zone: 'center' },
  { name: 'Cité Fayçal', zone: 'center' },
  { name: 'Dar-Es-Salam', zone: 'center' },
  { name: 'Plateau', zone: 'center' },
  { name: 'Yantala', zone: 'center' },
  { name: 'Danyassé', zone: 'center' },
  
  // QUARTIERS LOINTAINS (Périphérie - 1500 F Jour / 2000 F Nuit)
  { name: 'Kouara Kano', zone: 'periphery' },
  { name: 'Bobiel', zone: 'periphery' },
  { name: 'Goudel', zone: 'periphery' },
  { name: 'Niamey 2000', zone: 'periphery' },
  { name: 'Saga', zone: 'periphery' },
  { name: 'Aéroport', zone: 'periphery' },
  { name: 'Kalley Est', zone: 'periphery' },
  { name: 'Gamkallé', zone: 'periphery' },
  { name: 'Karadjé', zone: 'periphery' },
  { name: 'Kirkissoye', zone: 'periphery' },
  { name: 'Lamordé', zone: 'periphery' },
  { name: 'Nogaré', zone: 'periphery' },
  { name: 'Soudouré', zone: 'periphery' },
  { name: 'Koiratégui', zone: 'periphery' }
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
    name: 'Abdou R.', 
    comment: 'Le Tiep est juste magnifique ! Livraison Billo rapide au Plateau, encore chaud à l\'arrivée.', 
    rating: 5, 
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200', 
    date: 'Aujourd\'hui',
    adminReply: 'Barka Abdou ! C\'est un plaisir de vous savoir satisfait. À très bientôt pour un autre festin ! ✨'
  },
  { 
    id: '2', 
    name: 'Mariama K.', 
    comment: 'Les Box Sauces ont sauvé mon dîner de famille. La sauce Mafé est onctueuse, comme au village.', 
    rating: 5, 
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200', 
    date: 'Hier',
    adminReply: 'Fofo Mariama ! C\'est exactement pour ces moments que nous avons créé les Box. Merci pour votre confiance. ❤️'
  },
  { 
    id: '3', 
    name: 'Issoufou Z.', 
    comment: 'Excellent service traiteur pour notre cocktail pro. Présentation soignée et goût au rendez-vous.', 
    rating: 5, 
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200', 
    date: 'Il y a 2 jours',
    adminReply: 'Barka Issoufou ! Toute l\'équipe vous remercie. Nous sommes ravis d\'avoir contribué au succès de votre événement. 🤝'
  }
];
