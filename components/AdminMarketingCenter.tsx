import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Zap, Tag, Megaphone, Send, Sparkles, Plus, Trash2, Edit3, 
  CheckCircle2, Copy, Share2, MessageSquare, Flame, Clock, 
  Users, Gift, ShoppingBag, ArrowRight, RefreshCw, Smartphone, 
  Layers, Sliders, Check, ShieldCheck, AlertCircle, Percent, DollarSign,
  Eye, ToggleLeft, ToggleRight, Info, Utensils, Award, ChefHat, Globe, Save,
  Moon, Sun, Music, Facebook, Instagram, Camera, Search, UploadCloud, Calendar
} from 'lucide-react';
import { MenuItem, Order } from '../types';
import { playSound } from '../utils/audio';
import { GoogleGenAI } from '@google/genai';
import { PlatDuJourPosterStudio } from './PlatDuJourPosterStudio';
import { 
  PromoCode, AnnouncementBanner, FlashDealConfig, PlatDuJourConfig, DailyPromo,
  getStoredPromoCodes, saveStoredPromoCodes,
  getStoredBanner, saveStoredBanner,
  getStoredFlashDeal, saveStoredFlashDeal,
  getStoredPlatDuJour, saveStoredPlatDuJour,
  getStoredWeeklyPromotions, saveStoredWeeklyPromotions,
  PLAT_DU_JOUR_PRESETS, generatePlatDuJourMarketingTexts, PlatDuJourStyle,
  shareToSocialPlatform,
  getMarketingTemplates, MARKETING_TEMPLATES, broadcastToWhatsApp,
  DEFAULT_MENU_DU_JOUR_DISHES, MenuDuJourDishItem,
  syncMenuDuJourWithMenuItems, resolveTrioDishImage
} from '../utils/marketing';
import { RESTAURANT_INFO } from '../constants';
import { compressImage } from '../utils/imageCompressor';
import { db, isSupabaseConfigured } from '../lib/supabase';

interface AdminMarketingCenterProps {
  items: MenuItem[];
  orders: Order[];
  onItemsChange?: (items: MenuItem[]) => void;
  initialTab?: 'PLAT_DU_JOUR' | 'CAMPAIGNS' | 'PROMO_CODES' | 'BANNER' | 'FLASH_DEALS' | 'WEEKLY_CALENDAR' | 'CLIENTS_CRM' | 'AI_STRATEGY';
}

export const AdminMarketingCenter: React.FC<AdminMarketingCenterProps> = ({ 
  items, 
  orders,
  onItemsChange,
  initialTab
}) => {
  // Active sub-tab inside Marketing
  const [activeTab, setActiveTab] = useState<'PLAT_DU_JOUR' | 'CAMPAIGNS' | 'PROMO_CODES' | 'BANNER' | 'FLASH_DEALS' | 'WEEKLY_CALENDAR' | 'CLIENTS_CRM' | 'AI_STRATEGY'>(initialTab || 'PLAT_DU_JOUR');

  // Plat du Jour State
  const [platDuJour, setPlatDuJour] = useState<PlatDuJourConfig>(() => getStoredPlatDuJour());
  const [selectedDishIndex, setSelectedDishIndex] = useState<number>(0);
  const [platSubView, setPlatSubView] = useState<'POSTER' | 'RECIPE_CHANNELS'>('POSTER');
  const [platSourceMode, setPlatSourceMode] = useState<'CARTE' | 'CUSTOM' | 'PRESETS'>('CARTE');
  const [platMenuSearch, setPlatMenuSearch] = useState('');
  const [platCategoryFilter, setPlatCategoryFilter] = useState<string>('TOUT');
  const platImageInputRef = useRef<HTMLInputElement | null>(null);
  const [platSaved, setPlatSaved] = useState(false);
  const [selectedPlatStyle, setSelectedPlatStyle] = useState<PlatDuJourStyle>('GOURMAND');
  const [activePlatChannel, setActivePlatChannel] = useState<'EVENING' | 'STATUS' | 'GROUPS' | 'CLIENT' | 'SOCIAL' | 'FLYER'>('EVENING');
  const [selectedVipClient, setSelectedVipClient] = useState<string>('');
  const [copiedPlatText, setCopiedPlatText] = useState(false);
  const [isAiGeneratingPlat, setIsAiGeneratingPlat] = useState(false);

  // Promo Codes State
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>(() => getStoredPromoCodes());
  const [showAddPromoModal, setShowAddPromoModal] = useState(false);
  const [newPromo, setNewPromo] = useState<Partial<PromoCode>>({
    code: '',
    type: 'PERCENT',
    value: 15,
    minOrder: 4000,
    isActive: true,
    description: '',
    expiryDate: '2026-12-31'
  });

  // Announcement Banner State
  const [banner, setBanner] = useState<AnnouncementBanner>(() => getStoredBanner());
  const [bannerSaved, setBannerSaved] = useState(false);

  // Flash Deal State
  const [flashDeal, setFlashDeal] = useState<FlashDealConfig>(() => getStoredFlashDeal());
  const [flashSaved, setFlashSaved] = useState(false);

  // Weekly Promotions Calendar State
  const [weeklyPromotions, setWeeklyPromotions] = useState<DailyPromo[]>(() => getStoredWeeklyPromotions());
  const [selectedWeeklyDay, setSelectedWeeklyDay] = useState<number>(new Date().getDay());
  const [weeklySaved, setWeeklySaved] = useState(false);

  // Dynamic Marketing Templates derived from currently chosen Plat du Jour
  const dynamicTemplates = useMemo(() => getMarketingTemplates(platDuJour), [platDuJour]);

  // Campaign Composer State
  const [selectedTemplate, setSelectedTemplate] = useState<typeof dynamicTemplates[0]>(() => dynamicTemplates[0]);
  const [campaignTitle, setCampaignTitle] = useState(() => dynamicTemplates[0].title);
  const [campaignText, setCampaignText] = useState(() => dynamicTemplates[0].bodyText);
  const [targetPhone, setTargetPhone] = useState('');
  const [copiedText, setCopiedText] = useState(false);
  const [isAiGenerating, setIsAiGenerating] = useState(false);

  // Synchronize campaign text whenever Plat du Jour changes if Plat du Jour template is active
  useEffect(() => {
    if (selectedTemplate.id === 'tpl-plat-du-jour-midi' || selectedTemplate.id === 'tpl-tiep-midi') {
      const activeTpl = dynamicTemplates[0];
      setSelectedTemplate(activeTpl);
      setCampaignTitle(activeTpl.title);
      setCampaignText(activeTpl.bodyText);
    }
  }, [platDuJour.dishName, platDuJour.price, platDuJour.promoPrice, platDuJour.description, platDuJour.accompaniments, dynamicTemplates]);

  // Listen to global Plat du Jour updates from anywhere in the app
  useEffect(() => {
    const handlePlatUpdated = (e: any) => {
      if (e.detail && e.detail.dishName) {
        setPlatDuJour(syncMenuDuJourWithMenuItems(e.detail, items));
      }
    };
    window.addEventListener('khadys_plat_du_jour_updated', handlePlatUpdated);
    return () => window.removeEventListener('khadys_plat_du_jour_updated', handlePlatUpdated);
  }, [items]);

  // Automatically sync Trio dishes (Doukounou, Attiéké, Plat du Jour) with restaurant's own images when items load
  useEffect(() => {
    if (items && items.length > 0) {
      setPlatDuJour(prev => syncMenuDuJourWithMenuItems(prev, items));
    }
  }, [items]);

  // AI Insights State
  const [aiStrategyResult, setAiStrategyResult] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  // Unique Customer list derived from actual Orders
  const customerAudience = useMemo(() => {
    const map = new Map<string, { name: string; phone: string; district: string; ordersCount: number; totalSpent: number; lastOrderDate: string }>();
    
    orders.forEach(o => {
      if (o.phone) {
        const clean = o.phone.trim();
        const existing = map.get(clean);
        const orderTotal = (o.total || 0) + (o.deliveryFee || 0);
        if (existing) {
          existing.ordersCount += 1;
          existing.totalSpent += orderTotal;
          if (new Date(o.timestamp) > new Date(existing.lastOrderDate)) {
            existing.lastOrderDate = o.timestamp;
          }
        } else {
          map.set(clean, {
            name: o.customerName || 'Client Khady',
            phone: clean,
            district: o.district || 'Niamey',
            ordersCount: 1,
            totalSpent: orderTotal,
            lastOrderDate: o.timestamp || new Date().toISOString()
          });
        }
      }
    });

    // If no orders yet, populate 3 representative regular VIP customers for Niamey
    if (map.size === 0) {
      map.set('+227 70 03 25 52', { name: 'Mme Lawson Laure', phone: '+227 70 03 25 52', district: 'Plateau', ordersCount: 7, totalSpent: 48500, lastOrderDate: '2026-08-12' });
      map.set('+227 96 11 22 33', { name: 'Ibrahim Oumarou', phone: '+227 96 11 22 33', district: 'Koubia / Francophonie', ordersCount: 4, totalSpent: 26000, lastOrderDate: '2026-08-10' });
      map.set('+227 89 44 55 66', { name: 'Aïssata Diallo', phone: '+227 89 44 55 66', district: 'Recasement', ordersCount: 3, totalSpent: 19500, lastOrderDate: '2026-08-08' });
    }

    return Array.from(map.values()).sort((a, b) => b.totalSpent - a.totalSpent);
  }, [orders]);

  // Handle Promo Code CRUD
  const handleTogglePromo = (id: string) => {
    playSound('pop');
    const updated = promoCodes.map(p => p.id === id ? { ...p, isActive: !p.isActive } : p);
    setPromoCodes(updated);
    saveStoredPromoCodes(updated);
  };

  const handleDeletePromo = (id: string) => {
    playSound('pop');
    const updated = promoCodes.filter(p => p.id !== id);
    setPromoCodes(updated);
    saveStoredPromoCodes(updated);
  };

  const handleSaveNewPromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPromo.code || !newPromo.value) return;

    playSound('cash');
    const created: PromoCode = {
      id: `promo-${Date.now()}`,
      code: newPromo.code.toUpperCase().trim(),
      type: newPromo.type || 'PERCENT',
      value: Number(newPromo.value),
      minOrder: Number(newPromo.minOrder || 0),
      isActive: true,
      usageCount: 0,
      description: newPromo.description || `Réduction de ${newPromo.value}${newPromo.type === 'PERCENT' ? '%' : ' F CFA'}`,
      expiryDate: newPromo.expiryDate || '2026-12-31'
    };

    const updated = [created, ...promoCodes];
    setPromoCodes(updated);
    saveStoredPromoCodes(updated);
    setShowAddPromoModal(false);
    setNewPromo({
      code: '',
      type: 'PERCENT',
      value: 15,
      minOrder: 4000,
      isActive: true,
      description: '',
      expiryDate: '2026-12-31'
    });
  };

  // Handle Banner Update
  const handleSaveBanner = (e: React.FormEvent) => {
    e.preventDefault();
    playSound('cash');
    saveStoredBanner(banner);
    setBannerSaved(true);
    setTimeout(() => setBannerSaved(false), 3000);
  };

  // Handle Flash Deal Update
  const handleSaveFlashDeal = (e: React.FormEvent) => {
    e.preventDefault();
    playSound('cash');
    saveStoredFlashDeal(flashDeal);
    setFlashSaved(true);
    setTimeout(() => setFlashSaved(false), 3000);
  };

  // Handle selecting ANY dish from the Restaurant's Menu as Plat du Jour
  const handleSelectMenuItemAsPlat = (item: MenuItem) => {
    playSound('pop');
    const defaultPromoPrice = Math.round(item.price * 0.9 / 50) * 50; // Suggested 10% promo rounded
    const accompanimentsText = item.includes && item.includes.length > 0
      ? item.includes.join(', ')
      : 'Riz jasmin parfumé, bananes plantains alloco, piment vert maison';
    
    const texts = generatePlatDuJourMarketingTexts({
      dishName: item.name,
      description: item.description,
      accompaniments: accompanimentsText,
      price: item.price,
      promoPrice: defaultPromoPrice,
      chefQuote: 'Cuisiné frais avec nos épices du Sahel et notre amour de la gastronomie.',
      date: platDuJour.date,
      targetDayLabel: platDuJour.targetDayLabel || 'Demain Midi',
      remainingStock: platDuJour.remainingStock || 30
    }, selectedPlatStyle);

    const updated: PlatDuJourConfig = {
      ...platDuJour,
      dishName: item.name,
      tagline: item.description || `Spécialité du Chef Khady`,
      description: item.description,
      accompaniments: accompanimentsText,
      price: item.price,
      promoPrice: defaultPromoPrice,
      dishImage: item.image,
      chefQuote: platDuJour.chefQuote || 'Cuisiné ce matin avec passion par Khady.',
      marketingTextWhatsApp: texts.whatsapp,
      marketingTextStatusShort: texts.statusShort,
      marketingTextGroups: texts.groups,
      marketingTextSocial: texts.social,
      marketingTextEveningTeaser: texts.eveningTeaser,
      marketingTextEveningStatusShort: texts.eveningStatusShort,
      hashtags: texts.hashtags,
      isActive: true
    };

    setPlatDuJour(updated);
    saveStoredPlatDuJour(updated);
    
    // Also sync to items if available
    if (onItemsChange && items) {
      const updatedItems = items.map(i => i.id === item.id ? { ...i, isPlatDuJour: true } : { ...i, isPlatDuJour: false });
      onItemsChange(updatedItems);
    }

    setPlatSaved(true);
    setTimeout(() => setPlatSaved(false), 2500);
  };

  // Upload Custom Dish Photo
  const handleUploadPlatImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        const compressed = await compressImage(base64, 800, 0.8);
        const dishes = platDuJour.dishes && platDuJour.dishes.length >= 3 
          ? [...platDuJour.dishes] 
          : [...DEFAULT_MENU_DU_JOUR_DISHES];
        
        if (dishes[selectedDishIndex]) {
          dishes[selectedDishIndex] = { ...dishes[selectedDishIndex], dishImage: compressed };
        }

        const updated: PlatDuJourConfig = { 
          ...platDuJour, 
          dishImage: selectedDishIndex === 0 ? compressed : platDuJour.dishImage,
          dishes 
        };
        setPlatDuJour(updated);
        saveStoredPlatDuJour(updated);
        playSound('success');
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle Plat du Jour Presets Selection
  const handleSelectPresetPlat = (preset: typeof PLAT_DU_JOUR_PRESETS[0]) => {
    playSound('pop');
    const texts = generatePlatDuJourMarketingTexts({
      dishName: preset.name,
      description: preset.description,
      accompaniments: preset.accompaniments,
      price: preset.price,
      promoPrice: preset.promoPrice,
      chefQuote: preset.chefQuote,
      date: platDuJour.date,
      targetDayLabel: platDuJour.targetDayLabel || 'Demain Midi',
      remainingStock: platDuJour.remainingStock
    }, selectedPlatStyle);

    const updated: PlatDuJourConfig = {
      ...platDuJour,
      dishName: preset.name,
      tagline: preset.tagline,
      description: preset.description,
      accompaniments: preset.accompaniments,
      price: preset.price,
      promoPrice: preset.promoPrice,
      dishImage: preset.image,
      chefQuote: preset.chefQuote,
      marketingTextWhatsApp: texts.whatsapp,
      marketingTextStatusShort: texts.statusShort,
      marketingTextGroups: texts.groups,
      marketingTextSocial: texts.social,
      marketingTextEveningTeaser: texts.eveningTeaser,
      marketingTextEveningStatusShort: texts.eveningStatusShort,
      hashtags: texts.hashtags
    };

    setPlatDuJour(updated);
    saveStoredPlatDuJour(updated);
    setPlatSaved(true);
    setTimeout(() => setPlatSaved(false), 2500);
  };

  // Regenerate marketing texts when style changes
  const handleSwitchPlatStyle = (style: PlatDuJourStyle) => {
    playSound('pop');
    setSelectedPlatStyle(style);
    const texts = generatePlatDuJourMarketingTexts(platDuJour, style);
    setPlatDuJour(prev => ({
      ...prev,
      marketingTextWhatsApp: texts.whatsapp,
      marketingTextStatusShort: texts.statusShort,
      marketingTextGroups: texts.groups,
      marketingTextSocial: texts.social,
      marketingTextEveningTeaser: texts.eveningTeaser,
      marketingTextEveningStatusShort: texts.eveningStatusShort,
      hashtags: texts.hashtags
    }));
  };

  // Explicitly regenerate all marketing text variants for current plat configuration
  const handleRegenerateAllPlatTexts = (target?: PlatDuJourConfig) => {
    playSound('pop');
    const base = target || platDuJour;
    const texts = generatePlatDuJourMarketingTexts(base, selectedPlatStyle);
    const updated: PlatDuJourConfig = {
      ...base,
      marketingTextWhatsApp: texts.whatsapp,
      marketingTextStatusShort: texts.statusShort,
      marketingTextGroups: texts.groups,
      marketingTextSocial: texts.social,
      marketingTextEveningTeaser: texts.eveningTeaser,
      marketingTextEveningStatusShort: texts.eveningStatusShort,
      hashtags: texts.hashtags
    };
    setPlatDuJour(updated);
    saveStoredPlatDuJour(updated);
    return updated;
  };

  // Save Plat du Jour with guaranteed text synchronization
  const handleSavePlat = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    playSound('cash');

    // Check if texts need auto-synchronization for this dish name
    const dishLower = (platDuJour.dishName || '').toLowerCase().trim();
    const firstWord = dishLower.split(/\s+/)[0];
    const statusShort = platDuJour.marketingTextStatusShort || '';
    const isMismatched = 
      !statusShort ||
      (dishLower.indexOf('tiep') === -1 && statusShort.toLowerCase().indexOf('tiep') !== -1) ||
      (firstWord.length > 3 && statusShort.toLowerCase().indexOf(firstWord) === -1);

    let toSave = platDuJour;
    if (isMismatched) {
      const texts = generatePlatDuJourMarketingTexts(platDuJour, selectedPlatStyle);
      toSave = {
        ...platDuJour,
        marketingTextWhatsApp: texts.whatsapp,
        marketingTextStatusShort: texts.statusShort,
        marketingTextGroups: texts.groups,
        marketingTextSocial: texts.social,
        marketingTextEveningTeaser: texts.eveningTeaser,
        marketingTextEveningStatusShort: texts.eveningStatusShort,
        hashtags: texts.hashtags
      };
      setPlatDuJour(toSave);
    }

    saveStoredPlatDuJour(toSave);
    setPlatSaved(true);
    setTimeout(() => setPlatSaved(false), 3000);

    // If items callback exists, ensure menu is synced
    if (onItemsChange && items && items.length > 0) {
      const existingMatch = items.find(i => i.name.toLowerCase().includes(platDuJour.dishName.toLowerCase()));
      if (existingMatch) {
        const updatedItems = items.map(i => i.id === existingMatch.id ? { ...i, isPlatDuJour: platDuJour.isActive, price: platDuJour.promoPrice || platDuJour.price } : i);
        onItemsChange(updatedItems);
      }
    }
  };

  // AI Generation of Plat du Jour Copy
  const handleGenerateAiPlatCopy = async () => {
    setIsAiGeneratingPlat(true);
    playSound('pop');
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      const prompt = `Tu es le Chef et Responsable Marketing de « Khady's Food & Event » à Niamey (Niger).
Rédige 1 message WhatsApp de vente irrésistible, gourmand et percutant pour le Plat du Jour actuel : "${platDuJour.dishName}".

DÉTAILS DU PLAT SÉLECTIONNÉ :
- Nom exact du plat : "${platDuJour.dishName}"
- Ingrédients / Description : ${platDuJour.description}
- Accompagnements : ${platDuJour.accompaniments}
- Prix du jour : ${platDuJour.promoPrice || platDuJour.price} F CFA (au lieu de ${platDuJour.price} F CFA)
- Livraison express Niamey par Billo Express.

CONSIGNES STRICTES :
- Rédige UNIQUEMENT et EXCLUSIVEMENT pour le plat "${platDuJour.dishName}".
- Ne mentionne JAMAIS un autre plat (comme le Tiep) si le plat actuel est différent !
- Utilise des emojis attractifs et appétissants adaptés au plat (🍲, 🍝, 🔥, 🛵, ✨, 🎁, 👑).
- Génère un message WhatsApp captivant avec emojis, mise en page aérée et appel à l'action.`;

      const res = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
      });

      if (res.text) {
        setPlatDuJour(prev => ({
          ...prev,
          marketingTextWhatsApp: res.text || prev.marketingTextWhatsApp
        }));
        playSound('success');
      }
    } catch (e) {
      const texts = generatePlatDuJourMarketingTexts(platDuJour, 'GOURMAND');
      setPlatDuJour(prev => ({
        ...prev,
        marketingTextWhatsApp: texts.whatsapp,
        marketingTextGroups: texts.groups,
        marketingTextSocial: texts.social
      }));
      playSound('success');
    } finally {
      setIsAiGeneratingPlat(false);
    }
  };

  // Copy Plat du Jour text
  const handleCopyPlatText = (textToCopy: string) => {
    playSound('pop');
    navigator.clipboard.writeText(textToCopy);
    setCopiedPlatText(true);
    setTimeout(() => setCopiedPlatText(false), 2000);
  };

  // Copy text to clipboard
  const handleCopyCampaign = () => {
    playSound('pop');
    navigator.clipboard.writeText(campaignText);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2500);
  };

  // Broadcast to WhatsApp Status or Phone
  const handleBroadcast = (target?: string) => {
    playSound('pop');
    broadcastToWhatsApp(campaignText, target || targetPhone);
  };

  // AI Copywriting Generator with Gemini (Context-Aware to Active Plat du Jour)
  const handleGenerateAiCopy = async (topic: string) => {
    setIsAiGenerating(true);
    playSound('pop');
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      const prompt = `Tu es le Responsable Marketing digital de « Khady's Food & Event » à Niamey (Niger).
Rédige un message promotionnel WhatsApp ultra-percutant, chaleureux et persuasif pour : "${topic}".

INFORMATIONS IMPORTANTES SUR LE PLAT DU JOUR ACTUEL :
- Nom du plat sélectionné : "${platDuJour.dishName}"
- Description : "${platDuJour.description}"
- Accompagnements / Ingrédients : "${platDuJour.accompaniments}"
- Tarif spécial : ${platDuJour.promoPrice || platDuJour.price} F CFA (au lieu de ${platDuJour.price} F CFA)

CONSIGNES STRICTES :
- Le message doit être 100% centré sur le sujet "${topic}" et le plat sélectionné ("${platDuJour.dishName}").
- Ne mentionne JAMAIS de "Tiep" si le plat sélectionné est "${platDuJour.dishName}" (par exemple Spaghettis, Mafé, Grillades, etc.) !
- Utilise des emojis attractifs et appétissants (🍲, 🍝, 🔥, 🛵, ✨, 🎁, 👑).
- Indique le partenaire de livraison Billo Express à Niamey.
- Inclut un appel à l'action clair avec lien WhatsApp direct : https://wa.me/${RESTAURANT_INFO.whatsappClean}?text=Bonjour%20je%20veux%20commander%20${encodeURIComponent(platDuJour.dishName)}
- Longueur : 12-16 lignes bien aérées avec des puces. En français.`;

      const res = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
      });

      if (res.text) {
        setCampaignText(res.text);
        playSound('success');
      }
    } catch (err) {
      // High-quality fallback template conforming to current plat du jour
      const fallback = `*🔥 OFFRE EXCLUSIVE DU JOUR — KHADY'S FOOD NIAMEY !* 🥘✨\n\n` +
        `Chers gourmets de Niamey, Cheffe Khady vous a concocté un régal aujourd'hui :\n` +
        `• *${platDuJour.dishName.toUpperCase()}*\n` +
        `• ${platDuJour.description}\n` +
        `• *Accompagnements inclus :* ${platDuJour.accompaniments}\n\n` +
        `💰 *Tarif Spécial :* ${(platDuJour.promoPrice || platDuJour.price).toLocaleString('fr-FR')} F CFA\n` +
        `🎁 *Offre Flash :* -15% sur votre commande avec le code *KHADY24* !\n` +
        `🛵 Livraison express et soignée dans tout Niamey assurée par *Billo Express*.\n\n` +
        `📲 Commandez dès maintenant en 1 clic : https://wa.me/${RESTAURANT_INFO.whatsappClean}?text=Bonjour%20je%20commande%20${encodeURIComponent(platDuJour.dishName)}\n` +
        `_Khady's Food & Event — Le goût de l'excellence._`;
      setCampaignText(fallback);
      playSound('success');
    } finally {
      setIsAiGenerating(false);
    }
  };

  // Run AI Sales Strategy
  const handleRunAiAudit = async () => {
    setAiLoading(true);
    playSound('pop');
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      const prompt = `En tant qu'expert en stratégie marketing pour restaurants et traiteurs à Niamey au Niger :
Analyse le catalogue de Khady's Food (Tiep, Box Sauces, Buffets, Dibi, Jus naturels) et propose :
1. 3 Actions Marketing immédiates à fort impact pour la semaine (Vente Flash midi, Offre Entreprise buffet, Package famille weekend).
2. Le canal de diffusion recommandé (Statut WhatsApp, Groupes de quartiers Plateau/Koubia, Facebook).
3. Le meilleur code promo à lancer pour augmenter le panier moyen.
Sois précis, concret, orienté chiffre d'affaires et rédigé avec professionnalisme.`;

      const res = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
      });
      setAiStrategyResult(res.text || '');
      playSound('success');
    } catch (e) {
      setAiStrategyResult(
        `💡 **PLAN D'ACTION MARKETING RECOMMANDÉ POUR CETTE SEMAINE :**\n\n` +
        `1. **Ventes Flash Déjeuner (11h30 - 13h30) :** Diffusez le Tiep Royal sur les statuts WhatsApp avec le code **KHADY24** (-15%). Ciblez les travailleurs de bureau à Plateau et Recasement.\n\n` +
        `2. **Campagne Buffets Entreprises :** Contactez les secrétariats et comités d'entreprises pour les séminaires avec l'offre **Pack Buffet Prestige** (-15% avec le code **BUFFETPRO**).\n\n` +
        `3. **Offre Week-end Grillades Dibi :** Lancez la promotion Dibi d'Agneau au feu de bois le vendredi soir avec 1 bouteille de Bissap glacé offerte pour dynamiser les commandes familiales.`
      );
      playSound('success');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in text-white">
      
      {/* Header with quick stats */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-gradient-to-r from-[#1C0D09] via-[#2A140F] to-[#120705] p-6 sm:p-8 rounded-[3rem] border-2 border-brand-gold/30 shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-3xl bg-gradient-to-tr from-brand-orange to-brand-gold text-brand-brown flex items-center justify-center shadow-xl shadow-brand-orange/30 shrink-0">
            <Megaphone size={28} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-brand-gold/20 text-brand-gold text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full border border-brand-gold/30">
                Centre de Contrôle 360°
              </span>
              <span className="text-[9px] text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 size={12} /> Prêt à diffuser
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black italic uppercase text-white mt-1">
              Service Marketing & Croissance
            </h2>
            <p className="text-xs text-white/60 font-bold">
              Gérez vos codes promos, lancez vos campagnes WhatsApp et boostez vos ventes en temps réel.
            </p>
          </div>
        </div>

        {/* Quick Numbers Bar */}
        <div className="flex items-center gap-3 bg-black/40 p-2.5 rounded-2xl border border-white/10 shrink-0">
          <div className="px-3 py-1 text-center">
            <span className="text-[8px] font-black uppercase text-brand-gold block">Codes Actifs</span>
            <span className="text-sm font-black text-white">{promoCodes.filter(p => p.isActive).length}</span>
          </div>
          <div className="w-px h-8 bg-white/10"></div>
          <div className="px-3 py-1 text-center">
            <span className="text-[8px] font-black uppercase text-brand-orange block">Bannière</span>
            <span className="text-xs font-black text-emerald-400">{banner.isEnabled ? 'Active' : 'Éteinte'}</span>
          </div>
          <div className="w-px h-8 bg-white/10"></div>
          <div className="px-3 py-1 text-center">
            <span className="text-[8px] font-black uppercase text-white/60 block">Audience VIP</span>
            <span className="text-sm font-black text-brand-gold">{customerAudience.length} Clients</span>
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
        {[
          { id: 'PLAT_DU_JOUR', label: '🍲 1. Menu du Jour (Trio) & Studio', icon: Utensils, badge: platDuJour.isActive ? 'En Ligne' : 'Pause' },
          { id: 'WEEKLY_CALENDAR', label: '📅 2. Promos Semaine (7j)', icon: Calendar, badge: '7 Jours' },
          { id: 'FLASH_DEALS', label: '⚡ 3. Offres Flash du Jour', icon: Flame, badge: flashDeal.isEnabled ? 'ON' : 'OFF' },
          { id: 'BANNER', label: '📢 4. Bannière Live App', icon: Megaphone, badge: banner.isEnabled ? 'ON' : 'OFF' },
          { id: 'PROMO_CODES', label: '🎟️ 5. Codes Promo & Remises', icon: Tag, badge: `${promoCodes.length}` },
          { id: 'CAMPAIGNS', label: '💬 6. Messages WhatsApp', icon: Send, badge: 'Direct' },
          { id: 'CLIENTS_CRM', label: '👥 7. Relance Clients VIP', icon: Users, badge: `${customerAudience.length}` },
          { id: 'AI_STRATEGY', label: '✨ 8. Stratège & Audit IA', icon: Sparkles, badge: 'Gemini' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => {
              playSound('pop');
              setActiveTab(tab.id as any);
            }}
            className={`flex items-center gap-2 px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-wider whitespace-nowrap transition-all border shrink-0 ${
              activeTab === tab.id
                ? 'bg-brand-orange text-white border-brand-orange shadow-lg shadow-brand-orange/30 scale-[1.02]'
                : 'bg-white/5 text-white/60 border-white/10 hover:text-white hover:bg-white/10'
            }`}
          >
            <tab.icon size={15} />
            <span>{tab.label}</span>
            <span className={`text-[8px] px-2 py-0.5 rounded-full font-black ${
              activeTab === tab.id ? 'bg-black/30 text-white' : 'bg-white/10 text-brand-gold'
            }`}>
              {tab.badge}
            </span>
          </button>
        ))}
      </div>

      {/* TAB 0 : CRÉATEUR DE MENU DU JOUR (TRIO) & DIFFUSION MULTI-CANAUX */}
      {activeTab === 'PLAT_DU_JOUR' && (
        <div className="space-y-8 animate-fade-in">
          
          {/* Top Status & Controls Header */}
          <div className="bg-gradient-to-r from-[#22100B] via-[#2D1610] to-[#170906] p-6 sm:p-8 rounded-[2.5rem] border-2 border-brand-gold/40 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-2xl">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="bg-brand-orange text-white text-[9px] font-black uppercase px-3 py-0.5 rounded-full tracking-wider shadow-sm flex items-center gap-1">
                  <ChefHat size={12} /> Menu Quotidien Trio
                </span>
                <span className="text-brand-gold text-[10px] font-bold">
                  {platDuJour.date}
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-black italic uppercase text-white tracking-wide flex items-center gap-2">
                <Utensils className="text-brand-gold" size={22} /> Menu du Jour : Trio Gourmand & Marketing
              </h3>
              <p className="text-xs text-white/70 font-medium">
                Gérez chaque matin vos 3 plats au programme (Plat Cuisiné + Doukounou & Attiéké incontournables), ajustez prix et photos, et publiez en 1 clic sur WhatsApp, vos groupes et réseaux sociaux.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              {/* Active Toggle Switch */}
              <button
                type="button"
                onClick={() => {
                  playSound('pop');
                  const updated = { ...platDuJour, isActive: !platDuJour.isActive };
                  setPlatDuJour(updated);
                  saveStoredPlatDuJour(updated);
                }}
                className={`flex items-center gap-2 px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all border ${
                  platDuJour.isActive
                    ? 'bg-emerald-600/30 text-emerald-300 border-emerald-500/50'
                    : 'bg-white/5 text-white/50 border-white/10'
                }`}
              >
                {platDuJour.isActive ? <ToggleRight size={22} className="text-emerald-400" /> : <ToggleLeft size={22} />}
                <span>{platDuJour.isActive ? 'Visible dans l\'App' : 'Masqué dans l\'App'}</span>
              </button>

              {/* Save Button */}
              <button
                type="button"
                onClick={() => handleSavePlat()}
                className="bg-brand-orange hover:bg-orange-600 text-white px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-wider shadow-lg shadow-brand-orange/30 active:scale-95 transition-all flex items-center gap-2"
              >
                {platSaved ? <CheckCircle2 size={16} className="text-emerald-300" /> : <Save size={16} />}
                <span>{platSaved ? 'Enregistré !' : 'Enregistrer'}</span>
              </button>
            </div>
          </div>

          {/* Sub-view Navigation Tabs inside Plat du Jour */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-2 bg-black/60 rounded-2xl border-2 border-brand-gold/30">
            <button
              type="button"
              onClick={() => {
                playSound('pop');
                setPlatSubView('POSTER');
              }}
              className={`flex items-center justify-center gap-2.5 px-5 py-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                platSubView === 'POSTER'
                  ? 'bg-gradient-to-r from-brand-orange to-amber-600 text-white shadow-xl shadow-brand-orange/40 ring-2 ring-brand-gold scale-[1.01]'
                  : 'bg-white/5 text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              <Sparkles size={18} className={platSubView === 'POSTER' ? 'text-white' : 'text-brand-gold'} />
              <div className="text-left">
                <div className="flex items-center gap-2">
                  <span>🎨 1. Studio Créateur d'Affiches</span>
                  <span className="bg-brand-gold text-brand-brown text-[8px] font-black px-2 py-0.5 rounded-full">
                    PNG 1080p
                  </span>
                </div>
                <p className="text-[9px] font-normal normal-case text-white/70">Affiches réseaux sociaux & statuts WhatsApp</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                playSound('pop');
                setPlatSubView('RECIPE_CHANNELS');
              }}
              className={`flex items-center justify-center gap-2.5 px-5 py-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all relative overflow-hidden ${
                platSubView === 'RECIPE_CHANNELS'
                  ? 'bg-gradient-to-r from-brand-orange to-amber-600 text-white shadow-xl shadow-brand-orange/40 ring-2 ring-brand-gold scale-[1.01]'
                  : 'bg-white/5 text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              <Utensils size={18} className={platSubView === 'RECIPE_CHANNELS' ? 'text-white' : 'text-brand-orange'} />
              <div className="text-left">
                <div className="flex items-center gap-2">
                  <span>🍲 2. Fiche Recette & Personnalisation</span>
                  <span className="bg-emerald-500 text-white text-[8px] font-black px-2 py-0.5 rounded-full">
                    ✍️ Sur-Mesure
                  </span>
                </div>
                <p className="text-[9px] font-normal normal-case text-white/70">Choisir dans le menu, changer photo, prix & textes</p>
              </div>
            </button>
          </div>

          {/* SUB-VIEW 1: POSTER STUDIO */}
          {platSubView === 'POSTER' && (
            <PlatDuJourPosterStudio
              plat={platDuJour}
              items={items}
              onSwitchToRecipeTab={() => {
                playSound('pop');
                setPlatSubView('RECIPE_CHANNELS');
              }}
              onChangePlat={(updated) => {
                setPlatDuJour(updated);
                saveStoredPlatDuJour(updated);
              }}
            />
          )}

          {/* SUB-VIEW 2: RECIPE & MULTI-CHANNEL TEXTS CONFIGURATION */}
          {platSubView === 'RECIPE_CHANNELS' && (() => {
            const rawDishes = platDuJour.dishes && platDuJour.dishes.length >= 3 
              ? platDuJour.dishes 
              : DEFAULT_MENU_DU_JOUR_DISHES;
            const safeDishes = rawDishes.map((d, idx) => ({
              ...d,
              dishImage: resolveTrioDishImage(d, idx, items)
            }));
            const currentDish = safeDishes[selectedDishIndex] || safeDishes[0];

            const updateCurrentDish = (updates: Partial<typeof currentDish>) => {
              const newDishes = [...safeDishes];
              const updatedDish = { ...newDishes[selectedDishIndex], ...updates };
              newDishes[selectedDishIndex] = updatedDish;
              
              let newPlatDuJour: PlatDuJourConfig = {
                ...platDuJour,
                dishes: newDishes
              };
              
              if (selectedDishIndex === 0) {
                if (updates.dishName !== undefined) newPlatDuJour.dishName = updates.dishName;
                if (updates.tagline !== undefined) newPlatDuJour.tagline = updates.tagline;
                if (updates.description !== undefined) newPlatDuJour.description = updates.description;
                if (updates.accompaniments !== undefined) newPlatDuJour.accompaniments = updates.accompaniments;
                if (updates.price !== undefined) newPlatDuJour.price = updates.price;
                if (updates.promoPrice !== undefined) newPlatDuJour.promoPrice = updates.promoPrice;
                if (updates.dishImage !== undefined) newPlatDuJour.dishImage = updates.dishImage;
                if (updates.remainingStock !== undefined) newPlatDuJour.remainingStock = updates.remainingStock;
              }
              
              setPlatDuJour(newPlatDuJour);
              saveStoredPlatDuJour(newPlatDuJour);
            };

            return (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 animate-fade-in">
            
            {/* Hidden File Input for Dish Photo Upload */}
            <input 
              type="file" 
              ref={platImageInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleUploadPlatImage} 
            />

            {/* Left Column: Preset Catalog & Dish Configuration (5 cols) */}
            <div className="xl:col-span-5 space-y-6">
              
              {/* Trio Dish Selector Tabs */}
              <div className="bg-gradient-to-br from-[#2D1610] via-[#1F0C07] to-black p-4 rounded-[2rem] border-2 border-brand-gold/30 space-y-3 shadow-xl">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-brand-gold flex items-center gap-1.5">
                    <ChefHat size={14} className="text-brand-orange" /> Sélection du Plat à Configurer
                  </h4>
                  <span className="text-[8px] font-bold text-white/50 bg-white/10 px-2 py-0.5 rounded-full">
                    3 Plats au Menu
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {[
                    { idx: 0, label: '🍲 1. Plat du Jour', sub: 'Cuisiné Quotidien', badge: 'Variable' },
                    { idx: 1, label: '🌽 2. Doukounou', sub: 'Le Fameux Khady', badge: 'D\'office' },
                    { idx: 2, label: '🐟 3. Attiéké Royal', sub: 'Incontournable', badge: 'D\'office' }
                  ].map(tab => (
                    <button
                      key={tab.idx}
                      type="button"
                      onClick={() => {
                        playSound('pop');
                        setSelectedDishIndex(tab.idx);
                      }}
                      className={`p-2.5 rounded-2xl text-left border transition-all flex flex-col justify-between gap-1 relative ${
                        selectedDishIndex === tab.idx
                          ? 'bg-gradient-to-r from-brand-orange to-amber-600 text-white border-brand-gold shadow-lg ring-1 ring-brand-gold scale-[1.02]'
                          : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      <span className="text-[8px] font-black uppercase truncate">{tab.label}</span>
                      <span className="text-[7px] text-white/60 truncate">{tab.sub}</span>
                      <span className={`text-[6px] font-black uppercase px-1.5 py-0.5 rounded-full self-start ${
                        selectedDishIndex === tab.idx ? 'bg-black/40 text-brand-gold' : 'bg-white/10 text-white/50'
                      }`}>
                        {tab.badge}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Source Mode Selector (Plat 1 ou au choix) */}
              <div className="bg-white/5 p-4 rounded-[2rem] border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-brand-gold flex items-center gap-1.5">
                    <Utensils size={14} className="text-brand-orange" /> Source de Sélection (Plat #{selectedDishIndex + 1})
                  </h4>
                  <span className="text-[8px] font-bold text-white/50 bg-white/10 px-2 py-0.5 rounded-full">
                    {platSourceMode === 'CARTE' ? `${items.length} Plats au Menu` : platSourceMode === 'CUSTOM' ? 'Sur-Mesure' : '6 Signatures'}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => { playSound('pop'); setPlatSourceMode('CARTE'); }}
                    className={`py-2.5 px-2 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all text-center border ${
                      platSourceMode === 'CARTE'
                        ? 'bg-brand-orange text-white border-brand-orange shadow-lg shadow-brand-orange/30'
                        : 'bg-black/30 text-white/60 border-white/5 hover:bg-white/5'
                    }`}
                  >
                    📜 La Carte
                  </button>

                  <button
                    type="button"
                    onClick={() => { playSound('pop'); setPlatSourceMode('CUSTOM'); }}
                    className={`py-2.5 px-2 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all text-center border ${
                      platSourceMode === 'CUSTOM'
                        ? 'bg-brand-orange text-white border-brand-orange shadow-lg shadow-brand-orange/30'
                        : 'bg-black/30 text-white/60 border-white/5 hover:bg-white/5'
                    }`}
                  >
                    ✍️ Manuel
                  </button>

                  <button
                    type="button"
                    onClick={() => { playSound('pop'); setPlatSourceMode('PRESETS'); }}
                    className={`py-2.5 px-2 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all text-center border ${
                      platSourceMode === 'PRESETS'
                        ? 'bg-brand-orange text-white border-brand-orange shadow-lg shadow-brand-orange/30'
                        : 'bg-black/30 text-white/60 border-white/5 hover:bg-white/5'
                    }`}
                  >
                    ⭐ Signatures
                  </button>
                </div>
              </div>

              {/* MODE 1: CHOISIR DEPUIS LA CARTE DU RESTAURANT */}
              {platSourceMode === 'CARTE' && (
                <div className="bg-white/5 p-6 rounded-[2.5rem] border border-white/10 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black uppercase tracking-widest text-brand-gold flex items-center gap-2">
                      <ShoppingBag size={16} className="text-brand-orange" /> Sélectionner un Plat de la Carte
                    </h4>
                    <span className="text-[8px] font-bold text-white/50">{items.length} Plats Disponibles</span>
                  </div>

                  {/* Search & Filter */}
                  <div className="space-y-2">
                    <div className="relative">
                      <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
                      <input
                        type="text"
                        value={platMenuSearch}
                        onChange={(e) => setPlatMenuSearch(e.target.value)}
                        placeholder="Rechercher par nom (Tiep, Yassa, Aloko...)..."
                        className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-white/40 focus:outline-none focus:border-brand-gold"
                      />
                    </div>

                    <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
                      {['TOUT', ...Array.from(new Set(items.map(i => i.category)))].map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => { playSound('pop'); setPlatCategoryFilter(cat); }}
                          className={`px-2.5 py-1 rounded-lg text-[8px] font-black uppercase whitespace-nowrap border transition-all ${
                            platCategoryFilter === cat
                              ? 'bg-brand-gold text-brand-brown border-brand-gold'
                              : 'bg-black/30 text-white/50 border-white/5 hover:text-white'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Dishes Grid */}
                  <div className="max-h-[360px] overflow-y-auto pr-1 space-y-2 no-scrollbar">
                    {items
                      .filter((item) => {
                        const matchCat = platCategoryFilter === 'TOUT' || item.category === platCategoryFilter;
                        const matchSearch = !platMenuSearch || item.name.toLowerCase().includes(platMenuSearch.toLowerCase()) || item.description.toLowerCase().includes(platMenuSearch.toLowerCase());
                        return matchCat && matchSearch;
                      })
                      .map((item) => {
                        const isSelected = currentDish.dishName.toLowerCase().trim() === item.name.toLowerCase().trim();
                        return (
                          <div
                            key={item.id}
                            onClick={() => {
                              playSound('pop');
                              const defaultPromo = Math.round(item.price * 0.9 / 50) * 50;
                              const accompanimentsText = item.includes && item.includes.length > 0
                                ? item.includes.join(', ')
                                : 'Alloco doré croustillant, piment vert maison';
                              updateCurrentDish({
                                dishName: item.name,
                                tagline: item.description || `Spécialité du Chef Khady`,
                                description: item.description,
                                accompaniments: accompanimentsText,
                                price: item.price,
                                promoPrice: defaultPromo,
                                dishImage: item.image
                              });
                            }}
                            className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 cursor-pointer group ${
                              isSelected
                                ? 'bg-brand-gold/20 border-brand-gold shadow-lg ring-1 ring-brand-gold'
                                : 'bg-black/30 border-white/5 hover:bg-white/10 hover:border-white/20'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <img
                                src={item.image}
                                alt={item.name}
                                className="w-12 h-12 rounded-xl object-cover shrink-0 border border-white/10"
                              />
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-[7px] font-black uppercase text-brand-orange bg-brand-orange/10 px-1.5 py-0.5 rounded border border-brand-orange/20">
                                    {item.category}
                                  </span>
                                  {item.isSpécialitéMaison && (
                                    <span className="text-[7px] font-black uppercase text-brand-gold">⭐ Star</span>
                                  )}
                                </div>
                                <h5 className="text-xs font-black text-white truncate group-hover:text-brand-gold transition-colors">
                                  {item.name}
                                </h5>
                                <p className="text-[9px] text-white/50 truncate">
                                  {item.description}
                                </p>
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              <span className="text-xs font-mono font-black text-brand-gold block">
                                {item.price.toLocaleString('fr-FR')} F
                              </span>
                              {isSelected ? (
                                <span className="text-[8px] font-black text-emerald-400 flex items-center gap-1 justify-end">
                                  <CheckCircle2 size={10} /> Sélectionné
                                </span>
                              ) : (
                                <span className="text-[8px] font-bold text-white/40 group-hover:text-white">
                                  Choisir ➔
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* MODE 2: RECETTES SIGNATURE PRESET (6 Suggestions) */}
              {platSourceMode === 'PRESETS' && (
                <div className="bg-white/5 p-6 rounded-[2.5rem] border border-white/10 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black uppercase tracking-widest text-brand-gold flex items-center gap-2">
                      <Award size={16} className="text-brand-orange" /> 1-Clic : Recettes Signature
                    </h4>
                    <span className="text-[8px] font-bold text-white/50 uppercase">6 Suggestions</span>
                  </div>
                  <p className="text-[10px] text-white/60 font-bold">
                    Cliquez sur un plat pour charger automatiquement sa recette, ses accompagnements et son argumentaire :
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {PLAT_DU_JOUR_PRESETS.map((preset) => {
                      const isSelected = currentDish.dishName === preset.name;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => {
                            playSound('pop');
                            updateCurrentDish({
                              dishName: preset.name,
                              tagline: preset.tagline,
                              description: preset.description,
                              accompaniments: preset.accompaniments,
                              price: preset.price,
                              promoPrice: preset.promoPrice,
                              dishImage: preset.image
                            });
                          }}
                          className={`p-3 rounded-2xl text-left border transition-all flex flex-col justify-between gap-2 relative overflow-hidden group ${
                            isSelected
                              ? 'bg-brand-gold/20 border-brand-gold text-white shadow-lg'
                              : 'bg-black/30 border-white/5 text-white/70 hover:bg-white/10 hover:border-white/20'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-[8px] font-black uppercase text-brand-orange bg-brand-orange/10 px-2 py-0.5 rounded-full border border-brand-orange/20">
                              {preset.badge}
                            </span>
                            <span className="text-[9px] font-mono font-black text-brand-gold">
                              {preset.promoPrice ? `${preset.promoPrice.toLocaleString('fr-FR')} F` : `${preset.price.toLocaleString('fr-FR')} F`}
                            </span>
                          </div>

                          <p className="text-xs font-black text-white leading-tight group-hover:text-brand-gold transition-colors">
                            {preset.name}
                          </p>

                          <p className="text-[9px] text-white/50 line-clamp-1">
                            {preset.tagline}
                          </p>

                          {isSelected && (
                            <div className="absolute right-2 bottom-2 text-brand-gold">
                              <CheckCircle2 size={14} />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* FORMULAIRE DE PERSONNALISATION MANUELLE COMPLÈTE */}
              <div className="bg-white/5 p-6 sm:p-7 rounded-[2.5rem] border border-white/10 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-widest text-brand-gold flex items-center gap-2">
                      <Edit3 size={16} className="text-brand-orange" /> Paramètres Manuels : Plat #{selectedDishIndex + 1}
                    </h4>
                    <span className="text-[9px] text-white/60 font-bold">
                      {selectedDishIndex === 0 ? '🍲 Plat Cuisiné Quotidien' : selectedDishIndex === 1 ? '🌽 Doukounou Incontournable' : '🐟 Attiéké Incontournable'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => platImageInputRef.current?.click()}
                    className="bg-brand-gold/20 hover:bg-brand-gold/30 text-brand-gold text-[8px] font-black uppercase px-2.5 py-1.5 rounded-xl border border-brand-gold/30 flex items-center gap-1.5"
                  >
                    <Camera size={12} /> Changer Photo
                  </button>
                </div>

                <div className="space-y-3.5">
                  {/* Target Day and Timing Selector */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-white/60">Jour Cible (Ex: Demain Mercredi)</label>
                      <input
                        type="text"
                        value={platDuJour.targetDayLabel || ''}
                        onChange={(e) => setPlatDuJour({ ...platDuJour, targetDayLabel: e.target.value })}
                        placeholder="Ex: Demain Mercredi"
                        className="w-full bg-black/40 border border-white/15 rounded-xl p-3 text-xs text-brand-gold font-black focus:outline-none focus:border-brand-gold"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-white/60">Moment de Diffusion</label>
                      <select
                        value={platDuJour.publicationTiming || 'TONIGHT_FOR_TOMORROW'}
                        onChange={(e) => setPlatDuJour({ ...platDuJour, publicationTiming: e.target.value as any })}
                        className="w-full bg-black/40 border border-white/15 rounded-xl p-3 text-xs text-white font-bold focus:outline-none focus:border-brand-gold"
                      >
                        <option value="TONIGHT_FOR_TOMORROW" className="bg-[#1A0A06] text-white">🌙 Veille au Soir (Précommandes)</option>
                        <option value="SAME_DAY_MORNING" className="bg-[#1A0A06] text-white">☀️ Le Matin Même (Midi)</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-white/60">Nom du Plat *</label>
                    <input
                      type="text"
                      value={currentDish.dishName}
                      onChange={(e) => updateCurrentDish({ dishName: e.target.value })}
                      placeholder="Ex: Tiep Royal Rouge au Mérou Frais"
                      className="w-full bg-black/40 border border-white/15 rounded-xl p-3 text-xs text-white font-bold focus:outline-none focus:border-brand-gold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-white/60">Slogan / Tagline Accrocheuse</label>
                    <input
                      type="text"
                      value={currentDish.tagline || ''}
                      onChange={(e) => updateCurrentDish({ tagline: e.target.value })}
                      placeholder="Ex: Le joyau culinaire sénégalais de Cheffe Khady"
                      className="w-full bg-black/40 border border-white/15 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-brand-gold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-white/60">Description Sensorielle & Ingrédients</label>
                    <textarea
                      rows={3}
                      value={currentDish.description}
                      onChange={(e) => updateCurrentDish({ description: e.target.value })}
                      placeholder="Décrivez les saveurs, les épices, la texture..."
                      className="w-full bg-black/40 border border-white/15 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-brand-gold leading-relaxed resize-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-brand-gold flex items-center gap-1.5">
                      <Gift size={12} /> Accompagnements & Bonus Offerts
                    </label>
                    <input
                      type="text"
                      value={currentDish.accompaniments || ''}
                      onChange={(e) => updateCurrentDish({ accompaniments: e.target.value })}
                      placeholder="Ex: Alloco doré + Piment vert maison"
                      className="w-full bg-black/40 border border-brand-gold/30 rounded-xl p-3 text-xs text-brand-gold font-bold focus:outline-none focus:border-brand-gold"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-white/60">Prix Normal (F CFA)</label>
                      <input
                        type="number"
                        value={currentDish.price || ''}
                        onChange={(e) => updateCurrentDish({ price: Number(e.target.value) })}
                        className="w-full bg-black/40 border border-white/15 rounded-xl p-3 text-xs text-white font-mono focus:outline-none focus:border-brand-gold"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-brand-orange font-bold">Prix Spécial Midi (F CFA)</label>
                      <input
                        type="number"
                        value={currentDish.promoPrice || ''}
                        onChange={(e) => updateCurrentDish({ promoPrice: Number(e.target.value) })}
                        className="w-full bg-black/40 border border-brand-orange/40 rounded-xl p-3 text-xs text-brand-orange font-black font-mono focus:outline-none focus:border-brand-orange"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-white/60">Stock de Portions</label>
                      <input
                        type="number"
                        value={currentDish.remainingStock || ''}
                        onChange={(e) => updateCurrentDish({ remainingStock: Number(e.target.value) })}
                        className="w-full bg-black/40 border border-white/15 rounded-xl p-3 text-xs text-white font-mono focus:outline-none focus:border-brand-gold"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-white/60">Horaires de Service</label>
                      <input
                        type="text"
                        value={platDuJour.deliveryTime}
                        onChange={(e) => setPlatDuJour({ ...platDuJour, deliveryTime: e.target.value })}
                        placeholder="11h30 - 14h30"
                        className="w-full bg-black/40 border border-white/15 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-brand-gold"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-white/60">Mot de la Cheffe Khady</label>
                    <input
                      type="text"
                      value={platDuJour.chefQuote}
                      onChange={(e) => setPlatDuJour({ ...platDuJour, chefQuote: e.target.value })}
                      placeholder="« Cuisiné lentement au feu de bois ce matin. » — Cheffe Khady"
                      className="w-full bg-black/40 border border-white/15 rounded-xl p-3 text-xs text-white italic focus:outline-none focus:border-brand-gold"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[9px] font-black uppercase text-white/60">Photo du Plat (URL ou Fichier)</label>
                      <button
                        type="button"
                        onClick={() => platImageInputRef.current?.click()}
                        className="text-[8px] font-black text-brand-gold uppercase flex items-center gap-1 hover:underline"
                      >
                        <Camera size={10} /> Importer depuis l'appareil
                      </button>
                    </div>
                    <input
                      type="text"
                      value={currentDish.dishImage}
                      onChange={(e) => updateCurrentDish({ dishImage: e.target.value })}
                      placeholder="https://..."
                      className="w-full bg-black/40 border border-white/15 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-brand-gold truncate font-mono text-[10px]"
                    />
                  </div>
                </div>

                {/* Actions & Sync Buttons */}
                <div className="flex flex-col sm:flex-row gap-2 mt-4">
                  <button
                    type="button"
                    onClick={() => handleRegenerateAllPlatTexts()}
                    className="bg-brand-gold/15 hover:bg-brand-gold/25 text-brand-gold border border-brand-gold/40 py-3.5 px-4 rounded-2xl font-black uppercase text-[10px] tracking-wider flex items-center justify-center gap-2 active:scale-95 transition-all"
                    title="Génère automatiquement tous les formats de messages pour ce plat"
                  >
                    <RefreshCw size={14} />
                    <span>🔄 Synchroniser Textes</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSavePlat()}
                    className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white py-3.5 px-4 rounded-2xl font-black uppercase text-xs tracking-wider shadow-xl shadow-emerald-900/40 flex items-center justify-center gap-2 active:scale-95 transition-all"
                  >
                    {platSaved ? <CheckCircle2 size={18} className="text-white" /> : <Save size={18} />}
                    <span>{platSaved ? 'Enregistré & Synchronisé !' : 'Enregistrer & Activer'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column: Copy Generator & Multi-Channel Broadcast Dashboard (7 cols) */}
            <div className="xl:col-span-7 space-y-6">
              
              {/* 1. Style Selector & AI Booster Bar */}
              <div className="bg-gradient-to-r from-purple-950/40 via-brand-brown/40 to-black/50 p-6 rounded-[2.5rem] border border-purple-500/30 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-purple-300 flex items-center gap-2">
                      <Sparkles size={16} /> Générateur de Textes Alléchants
                    </h4>
                    <p className="text-[10px] text-white/60 font-bold mt-0.5">
                      Choisissez une ambiance de rédaction ou lancez la génération IA :
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleGenerateAiPlatCopy}
                    disabled={isAiGeneratingPlat}
                    className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2.5 rounded-2xl text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-purple-600/30 active:scale-95 transition-all shrink-0 self-start sm:self-auto"
                  >
                    {isAiGeneratingPlat ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} />}
                    <span>Rédiger avec Gemini IA</span>
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'GOURMAND', label: '🍲 Gourmand & Saveurs', desc: 'Tradition & générosité' },
                    { id: 'FLASH_MIDI', label: '⚡ Vente Flash Midi', desc: 'Pause déjeuner & urgence' },
                    { id: 'PRESTIGE_ROYAL', label: '👑 Prestige Royal', desc: 'Gastronomie & VIP' }
                  ].map(style => (
                    <button
                      key={style.id}
                      type="button"
                      onClick={() => handleSwitchPlatStyle(style.id as PlatDuJourStyle)}
                      className={`p-3 rounded-2xl text-left border transition-all ${
                        selectedPlatStyle === style.id
                          ? 'bg-brand-orange text-white border-brand-orange shadow-md'
                          : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      <p className="text-[10px] font-black truncate">{style.label}</p>
                      <p className="text-[8px] text-white/60 truncate mt-0.5">{style.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Multi-Channel Preview & 1-Click Publishing Hub */}
              <div className="bg-white/5 p-6 sm:p-8 rounded-[2.5rem] border border-white/10 space-y-6">
                
                {/* Channel Selector Tabs */}
                <div className="flex gap-2 overflow-x-auto no-scrollbar border-b border-white/10 pb-4">
                  {[
                    { id: 'EVENING', label: '🌙 Teaser Veille au Soir', icon: Moon },
                    { id: 'STATUS', label: '🟢 Statut WhatsApp', icon: Smartphone },
                    { id: 'GROUPS', label: '👥 Groupes WhatsApp', icon: Users },
                    { id: 'CLIENT', label: '💬 Envoi Client VIP', icon: MessageSquare },
                    { id: 'SOCIAL', label: '🌐 Réseaux Sociaux', icon: Globe },
                    { id: 'FLYER', label: '🖼️ Flyer Digital', icon: Eye }
                  ].map(channel => (
                    <button
                      key={channel.id}
                      type="button"
                      onClick={() => {
                        playSound('pop');
                        setActivePlatChannel(channel.id as any);
                      }}
                      className={`flex items-center gap-2 px-3.5 py-2.5 rounded-2xl text-[9px] font-black uppercase tracking-wider whitespace-nowrap transition-all border ${
                        activePlatChannel === channel.id
                          ? channel.id === 'EVENING'
                            ? 'bg-purple-600 text-white border-purple-400 shadow-md'
                            : 'bg-brand-gold text-brand-brown border-brand-gold shadow-md'
                          : 'bg-white/5 text-white/60 border-white/10 hover:text-white'
                      }`}
                    >
                      <channel.icon size={14} />
                      <span>{channel.label}</span>
                    </button>
                  ))}
                </div>

                {/* CHANNEL 0: TEASER VEILLE AU SOIR */}
                {activePlatChannel === 'EVENING' && (
                  <div className="space-y-4 animate-fade-in">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-black uppercase text-purple-300 flex items-center gap-1.5">
                        <Moon size={14} /> Teaser de la veille au soir (Publication entre 20h et 22h30)
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyPlatText(platDuJour.marketingTextEveningTeaser || platDuJour.marketingTextWhatsApp)}
                        className="text-[9px] font-black text-white/70 hover:text-white uppercase flex items-center gap-1 bg-white/10 px-2.5 py-1 rounded-xl"
                      >
                        {copiedPlatText ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                        <span>{copiedPlatText ? 'Copié !' : 'Copier'}</span>
                      </button>
                    </div>

                    <textarea
                      rows={11}
                      value={platDuJour.marketingTextEveningTeaser || platDuJour.marketingTextWhatsApp}
                      onChange={(e) => setPlatDuJour({ ...platDuJour, marketingTextEveningTeaser: e.target.value })}
                      className="w-full bg-[#120B09] border border-purple-500/30 rounded-2xl p-4 text-xs font-mono text-white/90 focus:outline-none focus:border-purple-400 leading-relaxed resize-none shadow-inner"
                    />

                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => broadcastToWhatsApp(platDuJour.marketingTextEveningTeaser || platDuJour.marketingTextWhatsApp)}
                        className="flex-1 bg-purple-600 hover:bg-purple-500 text-white py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30 active:scale-95 transition-all"
                      >
                        <Smartphone size={16} /> 🌙 Diffuser Teaser Veille sur WhatsApp
                      </button>

                      <button
                        type="button"
                        onClick={() => handleCopyPlatText(platDuJour.marketingTextEveningTeaser || platDuJour.marketingTextWhatsApp)}
                        className="bg-white/10 hover:bg-white/20 text-white px-5 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all"
                      >
                        <Copy size={14} /> Copier
                      </button>
                    </div>
                  </div>
                )}

                {/* CHANNEL 1: STATUT WHATSAPP */}
                {activePlatChannel === 'STATUS' && (
                  <div className="space-y-4 animate-fade-in">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-black uppercase text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle2 size={14} /> Format Court Optimisé pour Statuts WhatsApp (&lt; 7 lignes &amp; &lt; 700 car.)
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyPlatText(platDuJour.marketingTextStatusShort || platDuJour.marketingTextWhatsApp)}
                        className="text-[9px] font-black text-white/70 hover:text-white uppercase flex items-center gap-1 bg-white/10 px-2.5 py-1 rounded-xl"
                      >
                        {copiedPlatText ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                        <span>{copiedPlatText ? 'Copié !' : 'Copier'}</span>
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-[10px] px-1">
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <ShieldCheck size={13} /> Conforme limite WhatsApp (ne sera pas tronqué)
                      </span>
                      <span className="font-mono text-white/50 text-[9px]">
                        {(platDuJour.marketingTextStatusShort || platDuJour.marketingTextWhatsApp).split('\n').length} lignes • {(platDuJour.marketingTextStatusShort || platDuJour.marketingTextWhatsApp).length} car.
                      </span>
                    </div>

                    <textarea
                      rows={6}
                      value={platDuJour.marketingTextStatusShort || platDuJour.marketingTextWhatsApp}
                      onChange={(e) => setPlatDuJour({ ...platDuJour, marketingTextStatusShort: e.target.value })}
                      className="w-full bg-[#120B09] border border-emerald-500/40 rounded-2xl p-4 text-xs font-mono text-white/90 focus:outline-none focus:border-brand-gold leading-relaxed resize-none shadow-inner"
                    />

                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => broadcastToWhatsApp(platDuJour.marketingTextStatusShort || platDuJour.marketingTextWhatsApp)}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 active:scale-95 transition-all"
                      >
                        <Smartphone size={16} /> 🟢 Publier sur Statut WhatsApp
                      </button>

                      <button
                        type="button"
                        onClick={() => handleCopyPlatText(platDuJour.marketingTextStatusShort || platDuJour.marketingTextWhatsApp)}
                        className="bg-white/10 hover:bg-white/20 text-white px-5 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all"
                      >
                        <Copy size={14} /> Copier
                      </button>
                    </div>
                  </div>
                )}

                {/* CHANNEL 2: GROUPES WHATSAPP */}
                {activePlatChannel === 'GROUPS' && (
                  <div className="space-y-4 animate-fade-in">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-black uppercase text-brand-gold flex items-center gap-1.5">
                        <Users size={14} /> Formaté pour diffusion dans les Groupes WhatsApp
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyPlatText(platDuJour.marketingTextGroups)}
                        className="text-[9px] font-black text-white/70 hover:text-white uppercase flex items-center gap-1 bg-white/10 px-2.5 py-1 rounded-xl"
                      >
                        {copiedPlatText ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                        <span>{copiedPlatText ? 'Copié !' : 'Copier'}</span>
                      </button>
                    </div>

                    <textarea
                      rows={11}
                      value={platDuJour.marketingTextGroups}
                      onChange={(e) => setPlatDuJour({ ...platDuJour, marketingTextGroups: e.target.value })}
                      className="w-full bg-[#120B09] border border-white/15 rounded-2xl p-4 text-xs font-mono text-white/90 focus:outline-none focus:border-brand-gold leading-relaxed resize-none shadow-inner"
                    />

                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => broadcastToWhatsApp(platDuJour.marketingTextGroups)}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 active:scale-95 transition-all"
                      >
                        <Users size={16} /> 👥 Diffuser dans un Groupe WhatsApp
                      </button>

                      <button
                        type="button"
                        onClick={() => handleCopyPlatText(platDuJour.marketingTextGroups)}
                        className="bg-white/10 hover:bg-white/20 text-white px-5 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all"
                      >
                        <Copy size={14} /> Copier
                      </button>
                    </div>
                  </div>
                )}

                {/* CHANNEL 3: ENVOI DIRECT CLIENT VIP */}
                {activePlatChannel === 'CLIENT' && (
                  <div className="space-y-4 animate-fade-in">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase text-white/60">
                        Sélectionner le Client Destinataire
                      </label>
                      <select
                        value={selectedVipClient}
                        onChange={(e) => setSelectedVipClient(e.target.value)}
                        className="w-full bg-black/50 border border-white/20 rounded-xl p-3 text-xs text-white font-bold focus:outline-none focus:border-brand-gold"
                      >
                        <option value="">-- Choisir un client de la base --</option>
                        {customerAudience.map((client, idx) => (
                          <option key={idx} value={client.phone}>
                            {client.name} ({client.phone}) — {client.district} ({client.ordersCount} commandes)
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Preview customized text */}
                    {(() => {
                      const client = customerAudience.find(c => c.phone === selectedVipClient) || { name: 'Cher(e) Client(e)', district: 'Niamey', phone: '' };
                      const personalizedMsg = `*Bonjour ${client.name} !* 🍲✨\n\n` +
                        `Cheffe Khady a pensé à vous aujourd'hui avec notre *Plat du Jour* :\n` +
                        `👑 *${platDuJour.dishName.toUpperCase()}*\n` +
                        `😋 ${platDuJour.description}\n` +
                        `🎁 *Accompagnements inclus :* ${platDuJour.accompaniments}\n\n` +
                        `💰 *Tarif Privilège :* ${platDuJour.promoPrice ? `${platDuJour.promoPrice.toLocaleString('fr-FR')} F CFA` : `${platDuJour.price.toLocaleString('fr-FR')} F CFA`}\n` +
                        `🛵 Livraison expresse à ${client.district || 'votre adresse'} par Billo Express !\n\n` +
                        `👉 Souhaitez-vous que nous vous réservions une portion bien chaude pour ce midi ?\n` +
                        `_Khady's Food & Event — Toujours un plaisir de vous régaler !_`;

                      return (
                        <div className="space-y-4">
                          <div className="bg-[#120B09] p-4 rounded-2xl border border-white/10 text-xs font-mono text-white/90 whitespace-pre-line leading-relaxed">
                            {personalizedMsg}
                          </div>

                          <button
                            type="button"
                            disabled={!selectedVipClient}
                            onClick={() => broadcastToWhatsApp(personalizedMsg, selectedVipClient)}
                            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 active:scale-95 transition-all"
                          >
                            <MessageSquare size={16} /> 💬 Envoyer sur WhatsApp de {client.name}
                          </button>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* CHANNEL 4: RÉSEAUX SOCIAUX (FACEBOOK, INSTAGRAM, TIKTOK) */}
                {activePlatChannel === 'SOCIAL' && (
                  <div className="space-y-4 animate-fade-in">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-black uppercase text-brand-gold flex items-center gap-1.5">
                        <Globe size={14} /> Publication pour Facebook, Instagram & TikTok
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyPlatText(platDuJour.marketingTextSocial)}
                        className="text-[9px] font-black text-white/70 hover:text-white uppercase flex items-center gap-1 bg-white/10 px-2.5 py-1 rounded-xl"
                      >
                        {copiedPlatText ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                        <span>{copiedPlatText ? 'Copié !' : 'Copier'}</span>
                      </button>
                    </div>

                    {/* Social Handles Badges */}
                    <div className="flex flex-wrap items-center gap-2 p-3 bg-black/30 rounded-2xl border border-white/10 text-[10px]">
                      <span className="text-[9px] text-white/60 font-bold uppercase mr-1">Comptes Officiels :</span>
                      <span className="flex items-center gap-1 px-2.5 py-1 bg-blue-600/20 text-blue-300 border border-blue-500/30 rounded-xl font-bold">
                        <Facebook size={12} /> {RESTAURANT_INFO.socials.facebook.handle}
                      </span>
                      <span className="flex items-center gap-1 px-2.5 py-1 bg-pink-600/20 text-pink-300 border border-pink-500/30 rounded-xl font-bold">
                        <Instagram size={12} /> @{RESTAURANT_INFO.socials.instagram.handle}
                      </span>
                      <span className="flex items-center gap-1 px-2.5 py-1 bg-cyan-600/20 text-cyan-300 border border-cyan-500/30 rounded-xl font-bold">
                        <Music size={12} /> @{RESTAURANT_INFO.socials.tiktok.handle}
                      </span>
                    </div>

                    <textarea
                      rows={10}
                      value={platDuJour.marketingTextSocial}
                      onChange={(e) => setPlatDuJour({ ...platDuJour, marketingTextSocial: e.target.value })}
                      className="w-full bg-[#120B09] border border-white/15 rounded-2xl p-4 text-xs font-mono text-white/90 focus:outline-none focus:border-brand-gold leading-relaxed resize-none shadow-inner"
                    />

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => shareToSocialPlatform(platDuJour.marketingTextSocial, 'facebook')}
                        className="bg-[#1877F2] hover:bg-blue-600 text-white py-3 rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-md"
                      >
                        <Facebook size={14} /> Facebook
                      </button>

                      <button
                        type="button"
                        onClick={() => shareToSocialPlatform(platDuJour.marketingTextSocial, 'instagram')}
                        className="bg-gradient-to-r from-purple-600 via-pink-600 to-amber-600 hover:opacity-90 text-white py-3 rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-md"
                      >
                        <Instagram size={14} /> Instagram
                      </button>

                      <button
                        type="button"
                        onClick={() => shareToSocialPlatform(platDuJour.marketingTextSocial, 'tiktok')}
                        className="bg-black hover:bg-zinc-800 border border-white/20 text-white py-3 rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-md"
                      >
                        <Music size={14} className="text-cyan-400" /> TikTok
                      </button>

                      <button
                        type="button"
                        onClick={() => handleCopyPlatText(platDuJour.marketingTextSocial)}
                        className="bg-white/10 hover:bg-white/20 text-white py-3 rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all"
                      >
                        <Copy size={14} /> Copier Post
                      </button>
                    </div>
                  </div>
                )}

                {/* CHANNEL 5: FLYER DIGITAL PREVIEW */}
                {activePlatChannel === 'FLYER' && (
                  <div className="space-y-4 animate-fade-in">
                    <p className="text-[10px] text-white/60 font-bold">
                      Aperçu de la carte numérique du Plat du Jour telle qu'elle apparaît pour vos clients :
                    </p>

                    <div className="bg-gradient-to-b from-[#2A140F] to-[#140805] rounded-[3rem] p-6 sm:p-8 border-2 border-brand-gold/40 shadow-2xl relative overflow-hidden space-y-6">
                      
                      {/* Badge & Date */}
                      <div className="flex justify-between items-center">
                        <span className="bg-brand-orange text-white px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider shadow-md">
                          🍲 Plat du Jour • {platDuJour.date}
                        </span>
                        <span className="text-[9px] font-mono text-brand-gold font-bold">
                          {platDuJour.remainingStock} portions restantes
                        </span>
                      </div>

                      {/* Dish visual & details */}
                      <div className="flex flex-col sm:flex-row gap-6 items-center">
                        <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-[2rem] overflow-hidden border-2 border-brand-gold/30 shadow-xl shrink-0">
                          <img
                            src={platDuJour.dishImage || 'https://images.unsplash.com/photo-1544025162-d76694265947?w=1000'}
                            alt={platDuJour.dishName}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        </div>

                        <div className="space-y-2 text-center sm:text-left flex-1">
                          <h3 className="text-xl font-black italic uppercase text-white leading-tight">
                            {platDuJour.dishName}
                          </h3>
                          <p className="text-[10px] text-brand-gold font-bold uppercase tracking-wider">
                            {platDuJour.tagline}
                          </p>
                          <p className="text-xs text-white/80 leading-relaxed">
                            {platDuJour.description}
                          </p>
                        </div>
                      </div>

                      {/* Included Accompaniments */}
                      <div className="bg-black/40 p-4 rounded-2xl border border-brand-gold/20 flex items-center gap-3">
                        <Gift size={20} className="text-brand-orange shrink-0" />
                        <div>
                          <span className="text-[8px] font-black uppercase text-brand-gold block">Bonus du Midi Inclus :</span>
                          <span className="text-xs font-bold text-white">{platDuJour.accompaniments}</span>
                        </div>
                      </div>

                      {/* Pricing & Call to action */}
                      <div className="flex items-center justify-between pt-2">
                        <div>
                          <span className="text-[9px] text-white/40 line-through block font-mono">
                            {platDuJour.price.toLocaleString('fr-FR')} F CFA
                          </span>
                          <span className="text-2xl font-black text-brand-orange font-mono">
                            {platDuJour.promoPrice ? `${platDuJour.promoPrice.toLocaleString('fr-FR')} F CFA` : `${platDuJour.price.toLocaleString('fr-FR')} F CFA`}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => broadcastToWhatsApp(platDuJour.marketingTextWhatsApp)}
                          className="bg-brand-orange hover:bg-orange-600 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-wider shadow-lg shadow-brand-orange/40 active:scale-95 transition-all flex items-center gap-2"
                        >
                          <ShoppingBag size={14} /> Commander ce Plat
                        </button>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>
            );
          })()}
        </div>
      )}

      {/* TAB 1 : COMPOSITEUR & DIFFUSEUR DE CAMPAGNES MULTI-CANAUX */}
      {activeTab === 'CAMPAIGNS' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
          
          {/* Left Column: Template Selector & AI generator */}
          <div className="space-y-4">
            <div className="bg-white/5 p-6 rounded-[2.5rem] border border-white/10 space-y-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-brand-gold flex items-center gap-2">
                <Layers size={16} /> Modèles de Campagne Prêts
              </h3>
              <p className="text-[10px] text-white/60 font-bold">
                Sélectionnez un modèle adapté à votre objectif de vente du jour :
              </p>

              <div className="space-y-2">
                {dynamicTemplates.map(tpl => (
                  <button
                    key={tpl.id}
                    onClick={() => {
                      playSound('pop');
                      setSelectedTemplate(tpl);
                      setCampaignTitle(tpl.title);
                      setCampaignText(tpl.bodyText);
                    }}
                    className={`w-full p-3.5 rounded-2xl text-left border transition-all flex items-center justify-between ${
                      selectedTemplate.id === tpl.id 
                        ? 'bg-brand-gold/15 border-brand-gold text-white shadow-md' 
                        : 'bg-black/30 border-white/5 text-white/70 hover:bg-white/5'
                    }`}
                  >
                    <div>
                      <p className="text-xs font-black truncate">{tpl.title}</p>
                      <span className="text-[8px] text-brand-gold uppercase font-mono font-bold">
                        Code suggéré : {tpl.suggestedPromo}
                      </span>
                    </div>
                    {selectedTemplate.id === tpl.id && (
                      <CheckCircle2 size={16} className="text-brand-gold shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* AI Generator Box */}
            <div className="bg-gradient-to-br from-purple-950/40 to-brand-brown/50 p-6 rounded-[2.5rem] border border-purple-500/30 space-y-4 shadow-xl">
              <div className="flex items-center gap-2 text-purple-300">
                <Sparkles size={18} className="animate-spin" />
                <h4 className="text-xs font-black uppercase tracking-wider">Assistant Rédacteur IA</h4>
              </div>
              <p className="text-[10px] text-white/70 leading-relaxed font-bold">
                Besoin d'un texte original ? L'IA rédige pour vous un message de vente captivant adapté à votre plat du jour avec emojis et arguments percutants.
              </p>
              
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleGenerateAiCopy(`Vente Flash ${platDuJour.dishName} Déjeuner`)}
                  disabled={isAiGenerating}
                  className="bg-white/10 hover:bg-purple-600 text-white p-2.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all text-center truncate border border-purple-400/20"
                  title={`Générer un message IA pour ${platDuJour.dishName}`}
                >
                  ⚡ Flash {platDuJour.dishName ? (platDuJour.dishName.length > 13 ? platDuJour.dishName.slice(0, 12) + '…' : platDuJour.dishName) : 'Midi'}
                </button>
                <button
                  onClick={() => handleGenerateAiCopy('Box Sauces Traditionnelles')}
                  disabled={isAiGenerating}
                  className="bg-white/10 hover:bg-purple-600 text-white p-2.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all text-center"
                >
                  🥘 Box Sauces
                </button>
                <button
                  onClick={() => handleGenerateAiCopy('Grillades Suya & Dibi Weekend')}
                  disabled={isAiGenerating}
                  className="bg-white/10 hover:bg-purple-600 text-white p-2.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all text-center"
                >
                  🍖 Grillades Soir
                </button>
                <button
                  onClick={() => handleGenerateAiCopy('Pack Buffet Événementiel Entreprise')}
                  disabled={isAiGenerating}
                  className="bg-white/10 hover:bg-purple-600 text-white p-2.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all text-center"
                >
                  👑 Buffets Pro
                </button>
              </div>
            </div>
          </div>

          {/* Center & Right Column: Message Editor, Preview & One-Click Broadcast */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white/5 p-6 sm:p-8 rounded-[2.5rem] border border-white/10 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
                <div>
                  <h3 className="text-sm font-black italic uppercase text-brand-gold tracking-wider">
                    Éditeur de Message Marketing
                  </h3>
                  <p className="text-[9px] text-white/50 font-bold uppercase mt-0.5">
                    Modifiez le texte à votre convenance avant de le diffuser en 1 clic
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyCampaign}
                    className="bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 active:scale-95 transition-all"
                  >
                    {copiedText ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    <span>{copiedText ? 'Copié !' : 'Copier Texte'}</span>
                  </button>

                  <button
                    onClick={() => handleBroadcast()}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-emerald-600/30 active:scale-95 transition-all"
                  >
                    <Send size={14} /> Diffuser Statut WhatsApp
                  </button>
                </div>
              </div>

              {/* Message Textarea */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-[10px]">
                  <label className="font-black uppercase text-white/60">Contenu du Message :</label>
                  <span className="text-white/40 font-mono">{campaignText.length} caractères</span>
                </div>
                <textarea
                  rows={10}
                  value={campaignText}
                  onChange={(e) => setCampaignText(e.target.value)}
                  className="w-full bg-black/60 border border-white/15 rounded-2xl p-4 text-xs font-mono text-white leading-relaxed focus:outline-none focus:border-brand-gold resize-y shadow-inner"
                  placeholder="Tapez votre message publicitaire ici..."
                />
              </div>

              {/* Broadcast Options & Phone Dispatch */}
              <div className="bg-black/40 p-5 rounded-3xl border border-white/10 space-y-4">
                <h4 className="text-xs font-black uppercase text-brand-gold flex items-center gap-2">
                  <Send size={16} /> Options d'Envoi Direct
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase text-white/50">
                      Envoyer à un Numéro ou Groupe spécifique :
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="+227 70 03 25 52 ou Groupe"
                        value={targetPhone}
                        onChange={(e) => setTargetPhone(e.target.value)}
                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-brand-gold font-mono"
                      />
                      <button
                        onClick={() => handleBroadcast(targetPhone)}
                        className="bg-brand-orange hover:bg-orange-600 text-white px-3.5 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center gap-1 active:scale-95 transition-all shrink-0"
                      >
                        <Send size={12} /> Envoyer
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase text-white/50">
                      Réseaux Sociaux & SMS :
                    </label>
                    <div className="flex gap-2">
                      <button
                        onClick={handleCopyCampaign}
                        className="flex-1 bg-blue-600/80 hover:bg-blue-600 text-white py-2 px-3 rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1 transition-all"
                      >
                        <Share2 size={12} /> Facebook / Insta
                      </button>
                      <button
                        onClick={() => {
                          playSound('pop');
                          window.location.href = `sms:?body=${encodeURIComponent(campaignText)}`;
                        }}
                        className="flex-1 bg-amber-600/80 hover:bg-amber-600 text-white py-2 px-3 rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1 transition-all"
                      >
                        <Smartphone size={12} /> SMS Direct
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2 : GESTIONNAIRE DE CODES PROMO & REMISES */}
      {activeTab === 'PROMO_CODES' && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white/5 p-6 sm:p-8 rounded-[2.5rem] border border-white/10 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm sm:text-base font-black italic uppercase text-brand-gold tracking-wider flex items-center gap-2">
                  <Tag size={20} className="text-brand-orange" /> Codes Promo & Réductions Actifs
                </h3>
                <p className="text-[10px] text-white/60 font-bold mt-1">
                  Créez des codes promotionnels utilisables immédiatement par les clients lors de la commande dans leur panier.
                </p>
              </div>

              <button
                onClick={() => {
                  playSound('pop');
                  setShowAddPromoModal(true);
                }}
                className="bg-brand-orange hover:bg-orange-600 text-white px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-brand-orange/30 active:scale-95 transition-all self-start sm:self-auto"
              >
                <Plus size={16} /> Nouveau Code Promo
              </button>
            </div>

            {/* Promo Codes Table / Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {promoCodes.map((promo) => (
                <div
                  key={promo.id}
                  className={`p-5 rounded-3xl border transition-all space-y-4 ${
                    promo.isActive
                      ? 'bg-[#1C0F0D] border-brand-gold/40 shadow-xl'
                      : 'bg-white/5 border-white/5 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-xl bg-brand-gold/20 text-brand-gold font-mono font-black text-sm border border-brand-gold/30">
                        {promo.code}
                      </span>
                      <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${
                        promo.isActive ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-red-500/20 text-red-300'
                      }`}>
                        {promo.isActive ? 'Actif' : 'Désactivé'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleTogglePromo(promo.id)}
                        title={promo.isActive ? 'Désactiver' : 'Activer'}
                        className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-[9px] transition-all"
                      >
                        {promo.isActive ? <ToggleRight size={18} className="text-emerald-400" /> : <ToggleLeft size={18} className="text-white/40" />}
                      </button>
                      <button
                        onClick={() => handleDeletePromo(promo.id)}
                        title="Supprimer"
                        className="p-2 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white rounded-xl transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1 text-[10px]">
                    <p className="text-white/90 font-bold">{promo.description}</p>
                    <div className="flex justify-between text-white/50 text-[9px] pt-2 border-t border-white/5">
                      <span>Valeur : <strong className="text-brand-orange">{promo.value}{promo.type === 'PERCENT' ? '%' : ' F CFA'}</strong></span>
                      <span>Min. Commande : <strong>{promo.minOrder.toLocaleString('fr-FR')} F</strong></span>
                    </div>
                    <div className="flex justify-between text-white/50 text-[9px]">
                      <span>Utilisations : <strong className="text-brand-gold">{promo.usageCount} fois</strong></span>
                      <span>Expire : <strong>{promo.expiryDate || 'Non défini'}</strong></span>
                    </div>
                  </div>

                  {/* Share button */}
                  <button
                    onClick={() => {
                      const shareMsg = `*Offre Exclusive Khady's Food !* 🎁 Profitez de *${promo.description}* avec le code promo *${promo.code}* sur https://wa.me/${RESTAURANT_INFO.whatsappClean}`;
                      broadcastToWhatsApp(shareMsg);
                    }}
                    className="w-full bg-white/5 hover:bg-white/10 text-brand-gold py-2 rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 border border-white/10"
                  >
                    <Share2 size={12} /> Partager ce Code
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL AJOUT NOUVEAU CODE PROMO */}
      {showAddPromoModal && (
        <div className="fixed inset-0 z-[110] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="bg-[#180E0C] border-2 border-brand-gold/40 rounded-[3rem] p-6 sm:p-8 max-w-md w-full text-white space-y-6 shadow-2xl">
            <div className="flex justify-between items-center border-b border-white/10 pb-4">
              <h3 className="text-base font-black italic uppercase text-brand-gold flex items-center gap-2">
                <Tag size={20} className="text-brand-orange" /> Nouveau Code Promo
              </h3>
              <button
                onClick={() => setShowAddPromoModal(false)}
                className="text-white/40 hover:text-white p-2"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveNewPromo} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-white/60">
                  Code Promotionnel (Ex: VENDREDI20, FLASH10) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="EX: VENDREDI20"
                  value={newPromo.code}
                  onChange={(e) => setNewPromo({ ...newPromo, code: e.target.value.toUpperCase() })}
                  className="w-full bg-black/50 border border-white/20 rounded-xl p-3.5 text-sm font-mono font-black text-brand-gold uppercase tracking-widest focus:outline-none focus:border-brand-gold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-white/60">Type de Remise</label>
                  <select
                    value={newPromo.type}
                    onChange={(e) => setNewPromo({ ...newPromo, type: e.target.value as any })}
                    className="w-full bg-black/50 border border-white/20 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-brand-gold"
                  >
                    <option value="PERCENT">Pourcentage (%)</option>
                    <option value="FIXED">Montant Fixe (F CFA)</option>
                    <option value="GIFT">Cadeau / Offre Spéciale</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-white/60">Valeur ({newPromo.type === 'PERCENT' ? '%' : 'F CFA'})</label>
                  <input
                    type="number"
                    required
                    value={newPromo.value || ''}
                    onChange={(e) => setNewPromo({ ...newPromo, value: Number(e.target.value) })}
                    className="w-full bg-black/50 border border-white/20 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-brand-gold font-mono"
                    placeholder="Ex: 20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-white/60">Min. Commande (F CFA)</label>
                  <input
                    type="number"
                    value={newPromo.minOrder || ''}
                    onChange={(e) => setNewPromo({ ...newPromo, minOrder: Number(e.target.value) })}
                    className="w-full bg-black/50 border border-white/20 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-brand-gold font-mono"
                    placeholder="Ex: 5000"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-white/60">Date Expiration</label>
                  <input
                    type="date"
                    value={newPromo.expiryDate || ''}
                    onChange={(e) => setNewPromo({ ...newPromo, expiryDate: e.target.value })}
                    className="w-full bg-black/50 border border-white/20 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-brand-gold font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-white/60">Description de l'Offre</label>
                <input
                  type="text"
                  placeholder="Ex: 20% de remise sur tous les Tieps"
                  value={newPromo.description}
                  onChange={(e) => setNewPromo({ ...newPromo, description: e.target.value })}
                  className="w-full bg-black/50 border border-white/20 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-brand-gold"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddPromoModal(false)}
                  className="flex-1 bg-white/10 hover:bg-white/20 text-white py-3 rounded-2xl text-[10px] font-black uppercase tracking-wider"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-brand-orange hover:bg-orange-600 text-white py-3 rounded-2xl text-[10px] font-black uppercase tracking-wider shadow-lg shadow-brand-orange/30 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircle2 size={16} /> Enregistrer le Code
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 3 : GESTIONNAIRE DE BANNIÈRE D'ANNONCE EN DIRECT DANS L'APP */}
      {activeTab === 'BANNER' && (
        <div className="space-y-6 animate-fade-in">
          <form onSubmit={handleSaveBanner} className="bg-white/5 p-6 sm:p-8 rounded-[2.5rem] border border-white/10 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
              <div>
                <h3 className="text-base font-black italic uppercase text-brand-gold tracking-wider flex items-center gap-2">
                  <Megaphone size={20} className="text-brand-orange" /> Bannière Live dans l'Application Cliente
                </h3>
                <p className="text-[10px] text-white/60 font-bold mt-1">
                  Ce bandeau défilant s'affiche tout en haut de l'application cliente pour capter immédiatement l'attention de tous les visiteurs.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black uppercase text-white/70">
                  Afficher la Bannière :
                </span>
                <button
                  type="button"
                  onClick={() => setBanner({ ...banner, isEnabled: !banner.isEnabled })}
                  className={`w-14 h-8 rounded-full p-1 transition-all flex items-center ${
                    banner.isEnabled ? 'bg-emerald-500 justify-end' : 'bg-white/20 justify-start'
                  }`}
                >
                  <div className="w-6 h-6 bg-white rounded-full shadow-md"></div>
                </button>
              </div>
            </div>

            {/* Live Preview Box */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-brand-gold block">
                Aperçu en Temps Réel dans l'App :
              </label>
              <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left ${
                banner.isEnabled 
                  ? 'bg-gradient-to-r from-brand-orange via-amber-600 to-brand-gold border-white/30 text-white shadow-xl' 
                  : 'bg-white/5 border-white/10 text-white/30'
              }`}>
                <div className="flex items-center gap-3">
                  <span className="bg-white/20 text-white font-black text-[9px] px-3 py-1 rounded-full uppercase tracking-wider shrink-0">
                    {banner.badge || 'PROMO 🔥'}
                  </span>
                  <span className="text-xs font-black">
                    {banner.text} <span className="underline decoration-2 font-mono font-black">{banner.highlight}</span>
                  </span>
                </div>
                <span className="bg-white text-brand-brown font-black text-[9px] uppercase px-3 py-1 rounded-xl shadow-sm shrink-0">
                  En profiter →
                </span>
              </div>
            </div>

            {/* Banner Config Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase text-white/60">Badge Annonce (Ex: VENTE FLASH 🔥)</label>
                <input
                  type="text"
                  value={banner.badge}
                  onChange={(e) => setBanner({ ...banner, badge: e.target.value })}
                  className="w-full bg-black/40 border border-white/15 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-brand-gold"
                  placeholder="Ex: VENTE FLASH 🔥"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase text-white/60">Code Promo / Mot en gras</label>
                <input
                  type="text"
                  value={banner.highlight}
                  onChange={(e) => setBanner({ ...banner, highlight: e.target.value })}
                  className="w-full bg-black/40 border border-white/15 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-brand-gold font-mono"
                  placeholder="Ex: KHADY24"
                />
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-[9px] font-black uppercase text-white/60">Texte principal du bandeau</label>
                <input
                  type="text"
                  value={banner.text}
                  onChange={(e) => setBanner({ ...banner, text: e.target.value })}
                  className="w-full bg-black/40 border border-white/15 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-brand-gold"
                  placeholder="Ex: Offre Spéciale : -15% sur tout le menu avec le code"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              {bannerSaved ? (
                <span className="text-emerald-400 text-xs font-black flex items-center gap-1.5">
                  <CheckCircle2 size={16} /> Bannière mise à jour dans l'application !
                </span>
              ) : <span></span>}

              <button
                type="submit"
                className="bg-brand-gold hover:bg-yellow-400 text-brand-brown px-6 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-wider shadow-lg flex items-center gap-2 active:scale-95 transition-all"
              >
                <CheckCircle2 size={16} /> Enregistrer la Bannière
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 4 : BOOSTER D'OFFRE FLASH DU JOUR */}
      {activeTab === 'FLASH_DEALS' && (
        <div className="space-y-6 animate-fade-in">
          <form onSubmit={handleSaveFlashDeal} className="bg-white/5 p-6 sm:p-8 rounded-[2.5rem] border border-white/10 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
              <div>
                <h3 className="text-base font-black italic uppercase text-brand-gold tracking-wider flex items-center gap-2">
                  <Flame size={20} className="text-brand-orange" /> Booster d'Offre Flash Quotidienne
                </h3>
                <p className="text-[10px] text-white/60 font-bold mt-1">
                  Créez un sentiment d'urgence avec un plat en réduction immédiate, un stock limité et un compte à rebours.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black uppercase text-white/70">
                  Activer l'Offre Flash :
                </span>
                <button
                  type="button"
                  onClick={() => setFlashDeal({ ...flashDeal, isEnabled: !flashDeal.isEnabled })}
                  className={`w-14 h-8 rounded-full p-1 transition-all flex items-center ${
                    flashDeal.isEnabled ? 'bg-brand-orange justify-end' : 'bg-white/20 justify-start'
                  }`}
                >
                  <div className="w-6 h-6 bg-white rounded-full shadow-md"></div>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase text-white/60">Nom du Plat en Vedette</label>
                <input
                  type="text"
                  value={flashDeal.dishName}
                  onChange={(e) => setFlashDeal({ ...flashDeal, dishName: e.target.value })}
                  className="w-full bg-black/40 border border-white/15 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-brand-gold"
                  placeholder="Ex: Tiep Royal Khady"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase text-white/60">Image du Plat (Lien Unsplash ou URL)</label>
                <input
                  type="text"
                  value={flashDeal.dishImage}
                  onChange={(e) => setFlashDeal({ ...flashDeal, dishImage: e.target.value })}
                  className="w-full bg-black/40 border border-white/15 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-brand-gold"
                  placeholder="https://..."
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase text-white/60">Prix Normal (F CFA)</label>
                <input
                  type="number"
                  value={flashDeal.dishPrice}
                  onChange={(e) => {
                    const original = Number(e.target.value);
                    const promo = flashDeal.promoPrice;
                    const pct = original > 0 ? Math.round(((original - promo) / original) * 100) : 0;
                    setFlashDeal({ ...flashDeal, dishPrice: original, discountPercent: pct });
                  }}
                  className="w-full bg-black/40 border border-white/15 rounded-xl p-3 text-xs text-white font-mono focus:outline-none focus:border-brand-gold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase text-white/60">Prix Réduit Flash (F CFA)</label>
                <input
                  type="number"
                  value={flashDeal.promoPrice}
                  onChange={(e) => {
                    const promo = Number(e.target.value);
                    const original = flashDeal.dishPrice;
                    const pct = original > 0 ? Math.round(((original - promo) / original) * 100) : 0;
                    setFlashDeal({ ...flashDeal, promoPrice: promo, discountPercent: pct });
                  }}
                  className="w-full bg-black/40 border border-white/15 rounded-xl p-3 text-xs text-white font-mono focus:outline-none focus:border-brand-gold text-brand-orange font-black"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase text-white/60">Stock Restant Affiché</label>
                <input
                  type="number"
                  value={flashDeal.remainingStock}
                  onChange={(e) => setFlashDeal({ ...flashDeal, remainingStock: Number(e.target.value) })}
                  className="w-full bg-black/40 border border-white/15 rounded-xl p-3 text-xs text-white font-mono focus:outline-none focus:border-brand-gold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase text-white/60">Durée du Compte à Rebours (Heures)</label>
                <input
                  type="number"
                  value={flashDeal.durationHours}
                  onChange={(e) => setFlashDeal({ ...flashDeal, durationHours: Number(e.target.value) })}
                  className="w-full bg-black/40 border border-white/15 rounded-xl p-3 text-xs text-white font-mono focus:outline-none focus:border-brand-gold"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              {flashSaved ? (
                <span className="text-emerald-400 text-xs font-black flex items-center gap-1.5">
                  <CheckCircle2 size={16} /> Offre Flash mise à jour !
                </span>
              ) : <span></span>}

              <button
                type="submit"
                className="bg-brand-orange hover:bg-orange-600 text-white px-6 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-wider shadow-lg flex items-center gap-2 active:scale-95 transition-all"
              >
                <Flame size={16} /> Mettre en Ligne l'Offre Flash
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB : GESTIONNAIRE DU CALENDRIER DES PROMOS DE LA SEMAINE (7 JOURS) */}
      {activeTab === 'WEEKLY_CALENDAR' && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white/5 p-6 sm:p-8 rounded-[2.5rem] border border-white/10 space-y-6">
            
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-brand-gold/20 text-brand-gold flex items-center justify-center border border-brand-gold/40">
                    <Calendar size={18} />
                  </div>
                  <h3 className="text-base font-black italic uppercase text-brand-gold tracking-wider">
                    Calendrier des Promos de la Semaine (7 Jours)
                  </h3>
                </div>
                <p className="text-[10px] text-white/60 font-bold mt-1">
                  Personnalisez l'offre, le plat vedette, la remise et le code promo pour chaque jour de la semaine.
                </p>
              </div>

              {weeklySaved && (
                <div className="bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 px-4 py-2 rounded-2xl text-[10px] font-black uppercase flex items-center gap-2 animate-bounce">
                  <CheckCircle2 size={16} /> Modifications Enregistrées !
                </div>
              )}
            </div>

            {/* Days Tabs Selector */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              {weeklyPromotions.map((promo) => {
                const isSelected = promo.dayIndex === selectedWeeklyDay;
                const isToday = promo.dayIndex === new Date().getDay();

                return (
                  <button
                    key={promo.id}
                    type="button"
                    onClick={() => {
                      playSound('pop');
                      setSelectedWeeklyDay(promo.dayIndex);
                    }}
                    className={`flex-shrink-0 px-4 py-3 rounded-2xl text-center transition-all flex flex-col items-center gap-1 border min-w-[90px] ${
                      isSelected
                        ? 'bg-brand-gold text-brand-brown border-brand-gold shadow-lg font-black scale-105'
                        : 'bg-black/40 text-white/70 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-black uppercase italic">{promo.dayName}</span>
                      {isToday && (
                        <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-brand-brown' : 'bg-brand-orange animate-ping'}`}></span>
                      )}
                    </div>
                    <span className={`text-[8px] font-bold uppercase truncate max-w-[80px] ${isSelected ? 'text-brand-brown/80' : 'text-brand-gold'}`}>
                      {promo.discountTag}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Selected Day Form Editor */}
            {(() => {
              const currentPromo = weeklyPromotions.find(p => p.dayIndex === selectedWeeklyDay) || weeklyPromotions[0];

              const updateCurrentPromo = (fields: Partial<DailyPromo>) => {
                const updated = weeklyPromotions.map(p => 
                  p.dayIndex === currentPromo.dayIndex ? { ...p, ...fields } : p
                );
                setWeeklyPromotions(updated);
              };

              return (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start pt-2">
                  
                  {/* Live Preview of the Card */}
                  <div className="lg:col-span-4 bg-black/50 p-5 rounded-[2rem] border border-brand-gold/30 space-y-4">
                    <span className="text-[9px] font-black uppercase text-brand-gold tracking-widest block">
                      Aperçu Client ({currentPromo.dayName})
                    </span>

                    <div className="relative rounded-2xl overflow-hidden h-44 border border-white/20 shadow-xl">
                      <img
                        src={currentPromo.image}
                        alt={currentPromo.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>
                      
                      <div className="absolute top-2 left-2 bg-brand-orange text-white text-[8px] font-black uppercase px-2.5 py-1 rounded-lg">
                        {currentPromo.badge}
                      </div>

                      <div className="absolute bottom-2 left-2 right-2">
                        <span className="text-[8px] text-brand-gold font-bold uppercase block">{currentPromo.category}</span>
                        <h4 className="text-sm font-black text-white italic uppercase truncate">{currentPromo.popularDishName}</h4>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between items-center bg-white/5 p-2.5 rounded-xl">
                        <span className="text-[9px] text-white/60 uppercase font-bold">Avantage :</span>
                        <span className="text-brand-gold font-black italic">{currentPromo.discountTag}</span>
                      </div>
                      <div className="flex justify-between items-center bg-white/5 p-2.5 rounded-xl">
                        <span className="text-[9px] text-white/60 uppercase font-bold">Code Promo :</span>
                        <span className="font-mono font-black text-brand-orange bg-black/60 px-2 py-0.5 rounded">{currentPromo.code}</span>
                      </div>
                      {currentPromo.itemPrice && (
                        <div className="flex justify-between items-center bg-white/5 p-2.5 rounded-xl">
                          <span className="text-[9px] text-white/60 uppercase font-bold">Prix :</span>
                          <span className="font-black text-white font-mono">
                            {currentPromo.promoPrice?.toLocaleString()} F CFA <span className="line-through text-white/40 text-[10px]">{currentPromo.itemPrice?.toLocaleString()} F</span>
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Form Inputs for Selected Day */}
                  <div className="lg:col-span-8 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black uppercase text-white/60">Titre de la Promo ({currentPromo.dayName})</label>
                        <input
                          type="text"
                          value={currentPromo.title}
                          onChange={(e) => updateCurrentPromo({ title: e.target.value })}
                          className="w-full bg-black/40 border border-white/15 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-brand-gold"
                          placeholder="Ex: Mercredi Buffet & Entreprise"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black uppercase text-white/60">Nom du Plat Vedette</label>
                        <input
                          type="text"
                          value={currentPromo.popularDishName || ''}
                          onChange={(e) => updateCurrentPromo({ popularDishName: e.target.value })}
                          className="w-full bg-black/40 border border-white/15 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-brand-gold"
                          placeholder="Ex: Pack Buffet Prestige (10 Pers.)"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black uppercase text-white/60">Badge / Tag (Ex: LUNCH EXPRESS)</label>
                        <input
                          type="text"
                          value={currentPromo.badge}
                          onChange={(e) => updateCurrentPromo({ badge: e.target.value.toUpperCase() })}
                          className="w-full bg-black/40 border border-white/15 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-brand-gold"
                          placeholder="Ex: LUNCH EXPRESS"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black uppercase text-white/60">Avantage / Remise (Ex: -15% Buffet Pro)</label>
                        <input
                          type="text"
                          value={currentPromo.discountTag}
                          onChange={(e) => updateCurrentPromo({ discountTag: e.target.value })}
                          className="w-full bg-black/40 border border-white/15 rounded-xl p-3 text-xs text-brand-gold font-black focus:outline-none focus:border-brand-gold"
                          placeholder="Ex: -15% Buffet Pro"
                        />
                      </div>

                      <div className="sm:col-span-2 space-y-1.5">
                        <label className="text-[9px] font-black uppercase text-white/60">Description de l'Offre pour les Clients</label>
                        <textarea
                          rows={2}
                          value={currentPromo.description}
                          onChange={(e) => updateCurrentPromo({ description: e.target.value })}
                          className="w-full bg-black/40 border border-white/15 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-brand-gold resize-none"
                          placeholder="Description de l'offre..."
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black uppercase text-white/60">Prix Normal (F CFA)</label>
                        <input
                          type="number"
                          value={currentPromo.itemPrice || ''}
                          onChange={(e) => updateCurrentPromo({ itemPrice: Number(e.target.value) })}
                          className="w-full bg-black/40 border border-white/15 rounded-xl p-3 text-xs text-white font-mono focus:outline-none focus:border-brand-gold"
                          placeholder="Ex: 7500"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black uppercase text-white/60">Prix Promo Spécial (F CFA)</label>
                        <input
                          type="number"
                          value={currentPromo.promoPrice || ''}
                          onChange={(e) => updateCurrentPromo({ promoPrice: Number(e.target.value) })}
                          className="w-full bg-black/40 border border-white/15 rounded-xl p-3 text-xs text-brand-orange font-mono font-black focus:outline-none focus:border-brand-gold"
                          placeholder="Ex: 6375"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black uppercase text-white/60">Code Promo à Appliquer</label>
                        <input
                          type="text"
                          value={currentPromo.code}
                          onChange={(e) => updateCurrentPromo({ code: e.target.value.toUpperCase().trim() })}
                          className="w-full bg-black/40 border border-white/15 rounded-xl p-3 text-xs text-brand-gold font-mono font-black focus:outline-none focus:border-brand-gold"
                          placeholder="Ex: BUFFETPRO15"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black uppercase text-white/60">Image du Plat (Lien URL)</label>
                        <input
                          type="text"
                          value={currentPromo.image}
                          onChange={(e) => updateCurrentPromo({ image: e.target.value })}
                          className="w-full bg-black/40 border border-white/15 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-brand-gold"
                          placeholder="https://..."
                        />
                      </div>

                    </div>

                    {/* Save Button */}
                    <div className="pt-4 flex justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          playSound('cash');
                          saveStoredWeeklyPromotions(weeklyPromotions);
                          setWeeklySaved(true);
                          setTimeout(() => setWeeklySaved(false), 2500);
                        }}
                        className="bg-brand-gold hover:bg-yellow-400 text-brand-brown font-black px-6 py-3.5 rounded-2xl text-[10px] uppercase tracking-wider shadow-xl flex items-center gap-2 active:scale-95 transition-all"
                      >
                        <CheckCircle2 size={16} /> Enregistrer les 7 Jours de Promos
                      </button>
                    </div>

                  </div>

                </div>
              );
            })()}

          </div>
        </div>
      )}

      {/* TAB 5 : CRM AUDIENCE CLIENTS & RELANCES PERSONNALISÉES */}
      {activeTab === 'CLIENTS_CRM' && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white/5 p-6 sm:p-8 rounded-[2.5rem] border border-white/10 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-black italic uppercase text-brand-gold tracking-wider flex items-center gap-2">
                  <Users size={20} className="text-brand-orange" /> Base Clients VIP & Relances
                </h3>
                <p className="text-[10px] text-white/60 font-bold mt-1">
                  Relancez directement vos meilleurs clients sur WhatsApp avec des offres personnalisées.
                </p>
              </div>

              <span className="bg-brand-gold/20 text-brand-gold px-3.5 py-1 rounded-full text-[9px] font-black uppercase border border-brand-gold/30 self-start sm:self-auto">
                {customerAudience.length} Clients Enregistrés
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/10 text-[9px] font-black uppercase text-white/40 tracking-wider">
                    <th className="pb-3">Client</th>
                    <th className="pb-3">Téléphone</th>
                    <th className="pb-3">Quartier</th>
                    <th className="pb-3">Commandes</th>
                    <th className="pb-3">Total Dépensé</th>
                    <th className="pb-3 text-right">Action Marketing</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {customerAudience.map((client, idx) => (
                    <tr key={idx} className="hover:bg-white/5 transition-colors">
                      <td className="py-4 font-black text-white">{client.name}</td>
                      <td className="py-4 font-mono text-brand-gold font-bold">{client.phone}</td>
                      <td className="py-4 text-white/70">{client.district}</td>
                      <td className="py-4 font-black">
                        <span className="bg-white/10 px-2 py-0.5 rounded-md font-mono">{client.ordersCount}</span>
                      </td>
                      <td className="py-4 font-black text-brand-orange font-mono">
                        {client.totalSpent.toLocaleString('fr-FR')} F CFA
                      </td>
                      <td className="py-4 text-right">
                        <button
                          onClick={() => {
                            const vipMsg = `*Bonjour ${client.name} !* 🍲✨\n\n` +
                              `Toute l'équipe de *Khady's Food* vous remercie chaleureusement pour votre fidélité.\n` +
                              `Pour votre prochaine commande, nous avons le plaisir de vous offrir *1 000 F CFA de remise immédiate* avec votre code VIP : *BIENVENUE* !\n\n` +
                              `Découvrez la carte du jour ici : https://wa.me/${RESTAURANT_INFO.whatsappClean}\n` +
                              `_Au plaisir de vous régaler à nouveau !_`;
                            broadcastToWhatsApp(vipMsg, client.phone);
                          }}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider inline-flex items-center gap-1 active:scale-95 transition-all shadow-md"
                        >
                          <MessageSquare size={12} /> Relance VIP
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6 : STRATÈGE & AUDIT MARKETING IA (GEMINI) */}
      {activeTab === 'AI_STRATEGY' && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white/5 p-6 sm:p-8 rounded-[2.5rem] border border-white/10 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
              <div>
                <h3 className="text-base font-black italic uppercase text-brand-gold tracking-wider flex items-center gap-2">
                  <Sparkles size={20} className="text-brand-orange animate-spin" /> Stratège Marketing IA (Gemini)
                </h3>
                <p className="text-[10px] text-white/60 font-bold mt-1">
                  Obtenez des recommandations tactiques adaptées au marché de Niamey pour maximiser votre chiffre d'affaires.
                </p>
              </div>

              <button
                onClick={handleRunAiAudit}
                disabled={aiLoading}
                className="bg-brand-orange hover:bg-orange-600 text-white px-6 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-brand-orange/30 active:scale-95 transition-all self-start sm:self-auto"
              >
                {aiLoading ? <RefreshCw size={16} className="animate-spin" /> : <Sparkles size={16} />}
                <span>Générer le Plan de Croissance</span>
              </button>
            </div>

            {aiStrategyResult ? (
              <div className="bg-black/60 p-6 sm:p-8 rounded-3xl border border-brand-gold/30 text-white/90 text-xs leading-relaxed whitespace-pre-line font-mono animate-fade-in space-y-4">
                {aiStrategyResult}
              </div>
            ) : (
              <div className="py-16 text-center text-white/30 italic text-xs space-y-2">
                <Sparkles size={32} className="mx-auto opacity-30 text-brand-gold" />
                <p>Cliquez sur « Générer le Plan de Croissance » pour auditer les ventes et obtenir des idées marketing.</p>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminMarketingCenter;
