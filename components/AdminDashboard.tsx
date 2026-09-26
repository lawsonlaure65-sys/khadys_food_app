import React, { useState, useRef, useMemo } from 'react';
import { 
  ResponsiveContainer, BarChart, Bar, AreaChart, Area, XAxis, YAxis, 
  Tooltip, CartesianGrid, Cell 
} from 'recharts';
import { 
  LayoutDashboard, ShoppingBag, Utensils, X, TrendingUp, Star, 
  Settings, Bike, Sparkles, Zap, Plus, Trash2, 
  Edit3, Power, RefreshCw, Users, Package, 
  Calendar, Smartphone, CheckCircle2, ChefHat, PackageCheck, Bell, Camera, 
  MapPin, Clock, Heart, Sliders, DollarSign, MessageCircle, AlertCircle,
  UserRound, Save, ToggleLeft as Toggle, Image as ImageIcon, BookOpen, HelpCircle,
  ShieldAlert, AlertTriangle, BarChart3, LineChart as LineChartIcon, ArrowUpRight, Database,
  Sun, Moon, Gift, Share2, ToggleLeft, ToggleRight, ArrowRight, Keyboard, Command,
  ExternalLink, Download, Upload
} from 'lucide-react';
import { MenuItem, AdminView, Order, Review, MenuCategory, OrderStatus, BlogArticle, FaqItem } from '../types';
import { KhadyLogo } from './KhadyLogo';
import { playSound } from '../utils/audio';
import { GoogleGenAI } from "@google/genai";
import { DISTRICTS, BILLO_INFO, MENU_ITEMS } from '../constants';
import { saveMenuToIDB } from '../utils/offlineDB';
import { 
  db, 
  isSupabaseConfigured,
  getSupabaseConfig, 
  getSupabaseClient, 
  setCustomSupabaseCredentials, 
  testSupabaseConnection,
  isSupabaseNetworkError,
  deriveSupabaseUrlFromKey,
  DEFAULT_SUPABASE_URL,
  DEFAULT_SUPABASE_KEY
} from '../lib/supabase';
import { compressImage, compressImageFile } from '../utils/imageCompressor';
import { AdminMarketingCenter } from './AdminMarketingCenter';
import { 
  getStoredPlatDuJour, 
  saveStoredPlatDuJour, 
  PlatDuJourConfig,
  getStoredPromoCodes,
  getStoredBanner,
  getStoredFlashDeal
} from '../utils/marketing';

interface AdminDashboardProps {
  items: MenuItem[];
  setItems: React.Dispatch<React.SetStateAction<MenuItem[]>>;
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  reviews: Review[];
  setReviews: React.Dispatch<React.SetStateAction<Review[]>>;
  blogArticles: BlogArticle[];
  setBlogArticles: React.Dispatch<React.SetStateAction<BlogArticle[]>>;
  faqs: FaqItem[];
  setFaqs: React.Dispatch<React.SetStateAction<FaqItem[]>>;
  onExit: () => void;
}

interface DeleteTarget {
  type: 'dish' | 'article' | 'faq' | 'media';
  id: string;
  name: string;
  category?: string;
  image?: string;
  onConfirm: () => void;
}

const CustomChartTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-[#1C0F0D]/95 border border-brand-gold/40 p-4 rounded-2xl shadow-2xl backdrop-blur-md text-white space-y-1.5 text-xs">
        <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-2 mb-1">
          <span className="font-black text-brand-gold uppercase text-[10px] tracking-wider">
            Mois de {label} 2026
          </span>
          <span className="text-[8px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
            Validé
          </span>
        </div>
        <div className="flex justify-between gap-6 font-black text-xs">
          <span className="text-white/60">Revenus Validés :</span>
          <span className="text-brand-orange">{data.revenue.toLocaleString('fr-FR')} F CFA</span>
        </div>
        <div className="flex justify-between gap-6 font-bold text-[10px]">
          <span className="text-white/60">Commandes Livrées :</span>
          <span className="text-emerald-400">{data.ordersCount} commandes</span>
        </div>
        <div className="flex justify-between gap-6 font-bold text-[9px] pt-1.5 text-white/40 border-t border-white/5">
          <span>Panier Moyen :</span>
          <span>{data.ordersCount > 0 ? Math.round(data.revenue / data.ordersCount).toLocaleString('fr-FR') : 0} F CFA</span>
        </div>
      </div>
    );
  }
  return null;
};

const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  items, setItems, onExit, setOrders, orders, reviews, setReviews,
  blogArticles, setBlogArticles, faqs, setFaqs
}) => {
  const [currentView, setCurrentView] = useState<AdminView>(AdminView.DASHBOARD);
  const [editingItem, setEditingItem] = useState<Partial<MenuItem> | null>(() => {
    try {
      const saved = sessionStorage.getItem('khadys_editing_dish_draft');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') return parsed;
      }
    } catch (e) {}
    return null;
  });
  const [editingArticle, setEditingArticle] = useState<Partial<BlogArticle> | null>(null);
  const [editingFaq, setEditingFaq] = useState<Partial<FaqItem> | null>(null);
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<DeleteTarget | null>(null);

  // Auto-sauvegarde du brouillon de plat pour éviter toute perte en cas de rechargement ou fausse manipulation
  React.useEffect(() => {
    try {
      if (editingItem && (editingItem.name || editingItem.price || editingItem.description || editingItem.image)) {
        sessionStorage.setItem('khadys_editing_dish_draft', JSON.stringify(editingItem));
      } else if (!editingItem) {
        sessionStorage.removeItem('khadys_editing_dish_draft');
      }
    } catch (e) {}
  }, [editingItem]);

  // Alerte préventive si tentative de fermeture d'onglet pendant l'édition
  React.useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (editingItem && (editingItem.name || editingItem.price || editingItem.description || editingItem.image)) {
        e.preventDefault();
        e.returnValue = "Vous avez un plat en cours d'édition. Êtes-vous sûr de vouloir quitter ?";
        return e.returnValue;
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [editingItem]);

  // Fermeture sécurisée du modal de plat avec demande de confirmation si des modifications existent
  const handleCloseDishModal = () => {
    const hasData = !!(editingItem?.name?.trim() || editingItem?.price || editingItem?.description?.trim() || editingItem?.image);
    if (hasData) {
      if (!window.confirm("Abandonner les modifications du plat en cours ? Les données saisies seront perdues.")) {
        return;
      }
    }
    setEditingItem(null);
    try { sessionStorage.removeItem('khadys_editing_dish_draft'); } catch(e){}
    playSound('pop');
  };

  // Sortie sécurisée de l'espace Admin avec confirmation
  const handleSafeExit = () => {
    const hasData = !!(editingItem?.name?.trim() || editingItem?.price || editingItem?.description?.trim() || editingItem?.image);
    if (hasData) {
      if (!window.confirm("Attention : vous êtes en train d'ajouter ou modifier un plat. Quitter l'espace Admin annulera ces modifications. Confirmer la sortie ?")) {
        return;
      }
    } else {
      if (!window.confirm("Voulez-vous quitter l'espace Administrateur ?")) {
        return;
      }
    }
    try { sessionStorage.removeItem('khadys_editing_dish_draft'); } catch(e){}
    onExit();
  };

  // Changement d'onglet sécurisé pour ne pas fermer le plat en cours d'édition par erreur
  const handleSafeChangeView = (newView: AdminView) => {
    const hasData = !!(editingItem?.name?.trim() || editingItem?.price || editingItem?.description?.trim() || editingItem?.image);
    if (hasData) {
      if (!window.confirm("Un plat est en cours d'édition. Changer d'onglet fermera l'éditeur. Voulez-vous continuer ?")) {
        return;
      }
      setEditingItem(null);
      try { sessionStorage.removeItem('khadys_editing_dish_draft'); } catch(e){}
    }
    setCurrentView(newView);
    playSound('pop');
  };

  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiStrategy, setAiStrategy] = useState('');
  const [isRestaurantOpen, setIsRestaurantOpen] = useState(true);
  const [chartType, setChartType] = useState<'area' | 'bar'>('area');
  const [chartMetric, setChartMetric] = useState<'revenue' | 'orders'>('revenue');
  const adminPhotoInputRef = useRef<HTMLInputElement>(null);
  const dishPhotoInputRef = useRef<HTMLInputElement>(null);
  const articlePhotoInputRef = useRef<HTMLInputElement>(null);
  const [adminAvatar, setAdminAvatar] = useState(() => localStorage.getItem('khadys_admin_avatar') || '');
  const [platDuJour, setPlatDuJour] = useState<PlatDuJourConfig>(() => getStoredPlatDuJour());

  // Supabase Cloud Modal & Sync State
  const [showCloudModal, setShowCloudModal] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [activeShortcutToast, setActiveShortcutToast] = useState<{ title: string; subtitle: string; icon?: string } | null>(null);
  const toastTimeoutRef = useRef<any>(null);
  const [cloudConfig, setCloudConfig] = useState(() => getSupabaseConfig());
  const [inputUrl, setInputUrl] = useState(() => getSupabaseConfig().url);
  const [inputKey, setInputKey] = useState(() => getSupabaseConfig().key);
  const [isTestingCloud, setIsTestingCloud] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isMasterSyncing, setIsMasterSyncing] = useState(false);
  const [masterSyncResult, setMasterSyncResult] = useState<{ success: boolean; message: string } | null>(null);
  const [sqlCopied, setSqlCopied] = useState(false);
  const [activeCloudTab, setActiveCloudTab] = useState<'sync' | 'credentials' | 'sql' | 'vercel'>('sync');

  // Trigger brief visual & audio feedback on shortcut execution
  const triggerShortcutFeedback = (title: string, subtitle: string) => {
    playSound('pop');
    setActiveShortcutToast({ title, subtitle });
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => {
      setActiveShortcutToast(null);
    }, 2200);
  };

  // Keyboard Shortcuts Listener for rapid tab switching (e.g. Ctrl+Shift+A, Ctrl+Shift+M, etc.)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable);

      // STRICT PROTECTION: If typing in an input field or textarea, NEVER trigger any shortcut
      if (isInput) {
        return;
      }

      // Escape closes open modals in priority order
      if (e.key === 'Escape') {
        if (showShortcutsModal) {
          setShowShortcutsModal(false);
          playSound('pop');
          return;
        }
        if (showCloudModal) {
          setShowCloudModal(false);
          playSound('pop');
          return;
        }
        if (deleteConfirmTarget) {
          setDeleteConfirmTarget(null);
          playSound('pop');
          return;
        }
        if (editingItem) {
          handleCloseDishModal();
          return;
        }
        if (editingArticle) {
          setEditingArticle(null);
          playSound('pop');
          return;
        }
        if (editingFaq) {
          setEditingFaq(null);
          playSound('pop');
          return;
        }
      }

      // If editing a dish or article, BLOCK view switching shortcuts so user does not lose input
      if (editingItem || editingArticle || editingFaq) {
        return;
      }

      // Quick Help shortcut: '?' when not focused on an input
      if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setShowShortcutsModal(prev => !prev);
        playSound('pop');
        return;
      }

      // Key combos requiring modifier: (Ctrl + Shift) or (Cmd + Shift on Mac)
      const hasModifiers = (e.ctrlKey || e.metaKey) && e.shiftKey;
      if (!hasModifiers) return;

      const key = e.key.toUpperCase();

      switch (key) {
        // 1. Dashboard / Accueil: Ctrl+Shift+A ou Ctrl+Shift+D
        case 'A':
        case 'D':
          e.preventDefault();
          handleSafeChangeView(AdminView.DASHBOARD);
          triggerShortcutFeedback('Tableau de Bord Principal', 'Ctrl + Shift + A');
          break;

        // 2. Plat du Jour: Ctrl+Shift+P
        case 'P':
          e.preventDefault();
          handleSafeChangeView(AdminView.PLAT_DU_JOUR);
          triggerShortcutFeedback('Plat du Jour & Studio Affiche', 'Ctrl + Shift + P');
          break;

        // 3. Menu / Carte: Ctrl+Shift+M ou Ctrl+Shift+C
        case 'M':
        case 'C':
          e.preventDefault();
          handleSafeChangeView(AdminView.MENU_MGMT);
          triggerShortcutFeedback('Gestion de la Carte & Plats', 'Ctrl + Shift + M');
          break;

        // 4. Commandes: Ctrl+Shift+O
        case 'O':
          e.preventDefault();
          handleSafeChangeView(AdminView.ORDERS);
          triggerShortcutFeedback('Gestion des Commandes & Statuts', 'Ctrl + Shift + O');
          break;

        // 5. Blog: Ctrl+Shift+B
        case 'B':
          e.preventDefault();
          handleSafeChangeView(AdminView.BLOG_MGMT);
          triggerShortcutFeedback('Articles de Blog & Recettes', 'Ctrl + Shift + B');
          break;

        // 6. FAQ: Ctrl+Shift+F
        case 'F':
          e.preventDefault();
          handleSafeChangeView(AdminView.FAQ_MGMT);
          triggerShortcutFeedback('Foire Aux Questions (FAQ)', 'Ctrl + Shift + F');
          break;

        // 7. Livreurs: Ctrl+Shift+L
        case 'L':
          e.preventDefault();
          handleSafeChangeView(AdminView.DELIVERY);
          triggerShortcutFeedback('Livreurs & Logistique Express', 'Ctrl + Shift + L');
          break;

        // 8. Clients: Ctrl+Shift+U
        case 'U':
          e.preventDefault();
          handleSafeChangeView(AdminView.CLIENTS);
          triggerShortcutFeedback('Clients & Programme Fidélité', 'Ctrl + Shift + U');
          break;

        // 9. Marketing & IA: Ctrl+Shift+K
        case 'K':
          e.preventDefault();
          handleSafeChangeView(AdminView.AI_MARKETING);
          triggerShortcutFeedback('Marketing & IA Studio', 'Ctrl + Shift + K');
          break;

        // 10. Événements / Traiteur: Ctrl+Shift+E
        case 'E':
          e.preventDefault();
          handleSafeChangeView(AdminView.EVENT);
          triggerShortcutFeedback('Événements & Traiteur', 'Ctrl + Shift + E');
          break;

        // 11. Buffet & Packs: Ctrl+Shift+T
        case 'T':
          e.preventDefault();
          handleSafeChangeView(AdminView.BUFFET);
          triggerShortcutFeedback('Buffets & Packs', 'Ctrl + Shift + T');
          break;

        // 12. Paramètres: Ctrl+Shift+S
        case 'S':
          e.preventDefault();
          handleSafeChangeView(AdminView.SETTINGS);
          triggerShortcutFeedback('Paramètres & Configuration', 'Ctrl + Shift + S');
          break;

        // 13. Cloud Supabase Modal: Ctrl+Shift+Z
        case 'Z':
        case 'G':
          e.preventDefault();
          setShowCloudModal(prev => !prev);
          triggerShortcutFeedback('Centre Cloud Supabase', 'Ctrl + Shift + Z');
          break;

        // 14. Aide Raccourcis: Ctrl+Shift+H
        case 'H':
          e.preventDefault();
          setShowShortcutsModal(prev => !prev);
          triggerShortcutFeedback('Guide des Raccourcis Clavier', 'Ctrl + Shift + H');
          break;

        // 15. Quitter Admin: Ctrl+Shift+Q
        case 'Q':
          e.preventDefault();
          handleSafeExit();
          break;

        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, [showShortcutsModal, showCloudModal, deleteConfirmTarget, editingItem, editingArticle, editingFaq, onExit]);

  // Synchronisation avatar et config Supabase en temps réel
  React.useEffect(() => {
    const handleAvatarUpdated = (e: any) => {
      if (e?.detail) setAdminAvatar(e.detail);
    };
    const handleConfigChanged = () => {
      const cfg = getSupabaseConfig();
      setCloudConfig(cfg);
      setInputUrl(cfg.url);
      setInputKey(cfg.key);
    };
    window.addEventListener('khadys_admin_avatar_updated', handleAvatarUpdated);
    window.addEventListener('khadys_supabase_config_changed', handleConfigChanged);
    return () => {
      window.removeEventListener('khadys_admin_avatar_updated', handleAvatarUpdated);
      window.removeEventListener('khadys_supabase_config_changed', handleConfigChanged);
    };
  }, []);

  // Listen to real-time Plat du Jour updates across admin and app
  React.useEffect(() => {
    const handlePlatChange = (e: any) => {
      if (e?.detail) {
        setPlatDuJour(e.detail);
      } else {
        setPlatDuJour(getStoredPlatDuJour());
      }
    };
    window.addEventListener('khadys_plat_du_jour_updated', handlePlatChange);
    window.addEventListener('storage', handlePlatChange);
    return () => {
      window.removeEventListener('khadys_plat_du_jour_updated', handlePlatChange);
      window.removeEventListener('storage', handlePlatChange);
    };
  }, []);

  const handleTogglePlatDuJour = () => {
    playSound('pop');
    const updated = { ...platDuJour, isActive: !platDuJour.isActive };
    setPlatDuJour(updated);
    saveStoredPlatDuJour(updated);
  };

  const handleExecuteMasterSync = async () => {
    setIsMasterSyncing(true);
    setMasterSyncResult(null);
    playSound('pop');
    try {
      const res = await db.syncEverythingToCloud({
        menuItems: items,
        platDuJour: platDuJour,
        adminAvatar: adminAvatar,
        promoCodes: getStoredPromoCodes(),
        announcementBanner: getStoredBanner(),
        flashDeal: getStoredFlashDeal(),
        customWhatsApp: localStorage.getItem('khadys_custom_whatsapp') || ''
      });
      setMasterSyncResult(res);
      if (res.success) {
        playSound('success');
      } else {
        playSound('error');
      }
    } catch (e: any) {
      setMasterSyncResult({
        success: false,
        message: `Erreur inattendue : ${e.message || e}`
      });
      playSound('error');
    } finally {
      setIsMasterSyncing(false);
    }
  };

  // Dynamic monthly sales data calculation based on validated orders
  const monthlySalesData = useMemo(() => {
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc'];
    
    // Baseline simulation data up to August 2026
    const baseRevenue = [1450000, 1820000, 2100000, 1950000, 2400000, 2750000, 3100000, 3450000, 0, 0, 0, 0];
    const baseOrders = [142, 168, 195, 180, 210, 245, 280, 315, 0, 0, 0, 0];

    const data = months.map((m, idx) => ({
      month: m,
      revenue: baseRevenue[idx],
      ordersCount: baseOrders[idx],
      formattedRevenue: `${(baseRevenue[idx] / 1000).toLocaleString('fr-FR')}k F`,
    }));

    // Accumulate non-cancelled orders into appropriate months
    orders.forEach(order => {
      if (order.status !== 'CANCELLED') {
        const orderDate = order.timestamp ? new Date(order.timestamp) : new Date();
        const monthIdx = isNaN(orderDate.getTime()) ? 7 : orderDate.getMonth();
        if (monthIdx >= 0 && monthIdx < 12) {
          data[monthIdx].revenue += order.total || 0;
          data[monthIdx].ordersCount += 1;
          data[monthIdx].formattedRevenue = `${(data[monthIdx].revenue / 1000).toLocaleString('fr-FR')}k F`;
        }
      }
    });

    return data;
  }, [orders]);

  const salesStats = useMemo(() => {
    const totalRevenue = monthlySalesData.reduce((acc, curr) => acc + curr.revenue, 0);
    const totalValidatedOrders = monthlySalesData.reduce((acc, curr) => acc + curr.ordersCount, 0);
    const peakMonthObj = [...monthlySalesData].sort((a, b) => b.revenue - a.revenue)[0];
    const avgBasket = totalValidatedOrders > 0 ? Math.round(totalRevenue / totalValidatedOrders) : 0;

    return {
      totalRevenue,
      totalValidatedOrders,
      peakMonth: peakMonthObj?.month || 'Août',
      peakRevenue: peakMonthObj?.revenue || 0,
      avgBasket
    };
  }, [monthlySalesData]);

  const handleAdminPhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImageFile(file, 240, 0.7);
        if (compressed) {
          setAdminAvatar(compressed);
          try {
            localStorage.setItem('khadys_admin_avatar', compressed);
            window.dispatchEvent(new CustomEvent('khadys_admin_avatar_updated', { detail: compressed }));
            db.saveAdminAvatar(compressed).catch(() => {});
          } catch (e) {}
          playSound('success');
        }
      } catch (err) {
        console.warn('Erreur avatar upload:', err);
      }
    }
    e.target.value = '';
  };

  const handleDishPhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImageFile(file, 800, 0.72);
        if (compressed) {
          setEditingItem(prev => prev ? { ...prev, image: compressed } : null);
          playSound('success');
        }
      } catch (err) {
        console.warn('Erreur photo plat:', err);
      }
    }
    e.target.value = '';
  };

  const handleArticlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImageFile(file, 800, 0.72);
        if (compressed) {
          setEditingArticle(prev => prev ? { ...prev, image: compressed } : null);
          playSound('success');
        }
      } catch (err) {
        console.warn('Erreur photo article:', err);
      }
    }
    e.target.value = '';
  };

  // Exportation complète de la carte en fichier JSON téléchargeable
  const handleExportMenuJSON = () => {
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(items, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `khadys_menu_sauvegarde_${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      playSound('success');
      triggerShortcutFeedback('Sauvegarde Téléchargée !', `${items.length} plats exportés en fichier JSON.`);
    } catch (e) {
      alert("Erreur lors de l'exportation du fichier JSON");
    }
  };

  // Importation et restauration de plats depuis un fichier JSON
  const handleImportMenuJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const itemMap = new Map<string, MenuItem>();
          items.forEach(i => itemMap.set(i.id, i));
          parsed.forEach((i: MenuItem) => {
            if (i && i.name && i.price) {
              const id = i.id || `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
              itemMap.set(id, { ...i, id });
            }
          });
          const merged = Array.from(itemMap.values());
          setItems(merged);
          saveMenuToIDB(merged);
          try {
            localStorage.setItem('khadys_menu_items', JSON.stringify(merged));
          } catch (err) {}
          playSound('success');
          triggerShortcutFeedback('Menu Restauré !', `${merged.length} plats sont prêts.`);
        } else {
          alert("Le fichier JSON sélectionné ne contient pas une liste valide de plats.");
        }
      } catch (err) {
        alert("Erreur lors de la lecture du fichier JSON.");
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem?.name?.trim()) {
      alert("Veuillez saisir un nom pour le plat.");
      return;
    }
    if (!editingItem?.price || Number(editingItem.price) <= 0) {
      alert("Veuillez saisir un prix valide supérieur à 0 F CFA.");
      return;
    }

    let finalImage = editingItem.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c';
    if (finalImage.startsWith('data:image')) {
      finalImage = await compressImage(finalImage, 600, 0.65);
    }

    const finalItem: MenuItem = {
      ...editingItem,
      id: editingItem.id || `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: editingItem.name.trim(),
      description: editingItem.description?.trim() || '',
      price: Number(editingItem.price),
      rating: editingItem.rating || 5,
      isAvailable: editingItem.isAvailable ?? true,
      category: editingItem.category || 'Plat Africain',
      image: finalImage,
      isSpicy: editingItem.isSpicy ?? false,
      isVegetarian: editingItem.isVegetarian ?? false,
      isSpécialitéMaison: editingItem.isSpécialitéMaison ?? false
    };

    let nextItemsList: MenuItem[] = [];
    setItems(prev => {
      const exists = prev.some(i => i.id === finalItem.id);
      nextItemsList = exists ? prev.map(i => i.id === finalItem.id ? finalItem : i) : [finalItem, ...prev];
      return nextItemsList;
    });

    // 1. Sauvegarde directe dans IndexedDB (capacité illimitée)
    saveMenuToIDB(nextItemsList).catch(err => console.warn('IDB save error:', err));

    // 2. Sauvegarde directe dans LocalStorage (avec fallback optimisé)
    try {
      localStorage.setItem('khadys_menu_items', JSON.stringify(nextItemsList));
    } catch (e) {
      try {
        const light = nextItemsList.map(it => ({
          ...it,
          image: (it.image && it.image.startsWith('data:image') && it.image.length > 40000)
            ? 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c'
            : it.image
        }));
        localStorage.setItem('khadys_menu_items', JSON.stringify(light));
        localStorage.setItem('khadys_menu_emergency_backup', JSON.stringify(light));
      } catch (err) {}
    }

    // 2b. Sauvegarde additionnelle dans khadys_custom_user_dishes (bouclier anti-perte)
    try {
      const customRaw = localStorage.getItem('khadys_custom_user_dishes');
      const customList: MenuItem[] = customRaw ? JSON.parse(customRaw) : [];
      const cIdx = customList.findIndex(c => c.id === finalItem.id);
      if (cIdx >= 0) {
        customList[cIdx] = finalItem;
      } else {
        customList.unshift(finalItem);
      }
      localStorage.setItem('khadys_custom_user_dishes', JSON.stringify(customList));
    } catch (e) {}

    // 3. Sauvegarde Cloud en arrière-plan sans bloquer
    if (isSupabaseConfigured) {
      db.saveMenuItem(finalItem).then(res => {
        if (!res.success) {
          console.warn('⚠️ Supabase Cloud Save Issue:', res.error);
        }
      });
    }
    
    setEditingItem(null);
    try {
      sessionStorage.removeItem('khadys_editing_dish_draft');
    } catch (e) {}
    playSound('success');
    triggerShortcutFeedback('Plat Enregistré !', `"${finalItem.name}" est sécurisé (${nextItemsList.length} plats)`);
  };

  const handleSaveArticle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingArticle?.title || !editingArticle?.content) return;

    const finalArt: BlogArticle = {
      id: editingArticle.id || `blog-${Date.now()}`,
      title: editingArticle.title,
      summary: editingArticle.summary || editingArticle.content.substring(0, 100),
      content: editingArticle.content,
      author: editingArticle.author || 'Chef Khady',
      date: editingArticle.date || 'Aujourd\'hui',
      readTime: editingArticle.readTime || '3 min',
      image: editingArticle.image || 'https://images.unsplash.com/photo-1627308595229-7830a5c91f9f',
      category: (editingArticle.category as any) || 'Secrets du Chef',
      likes: editingArticle.likes || 120
    };

    if (blogArticles.find(a => a.id === finalArt.id)) {
      setBlogArticles(prev => prev.map(a => a.id === finalArt.id ? finalArt : a));
    } else {
      setBlogArticles(prev => [finalArt, ...prev]);
    }

    setEditingArticle(null);
    playSound('success');
  };

  const handleSaveFaq = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFaq?.question || !editingFaq?.answer) return;

    const finalFaq: FaqItem = {
      id: editingFaq.id || `faq-${Date.now()}`,
      question: editingFaq.question,
      answer: editingFaq.answer,
      category: (editingFaq.category as any) || 'Paiement'
    };

    if (faqs.find(f => f.id === finalFaq.id)) {
      setFaqs(prev => prev.map(f => f.id === finalFaq.id ? finalFaq : f));
    } else {
      setFaqs(prev => [finalFaq, ...prev]);
    }

    setEditingFaq(null);
    playSound('success');
  };

  const updateOrderStatus = (orderId: string, newStatus: OrderStatus) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    playSound('notification');
  };

  const runAiStrategy = async () => {
    setIsAiLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Génère une stratégie marketing éclair pour booster les ventes de Tiep, Box Sauces et Buffets à Niamey. 2 lignes maximum.`;
      const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
      setAiStrategy(response.text || "");
      playSound('success');
    } catch (e) {
      setAiStrategy("Veuillez configurer votre clé API pour l'IA.");
    } finally {
      setIsAiLoading(false);
    }
  };

  const renderContent = () => {
    switch(currentView) {
      case AdminView.DASHBOARD:
        return (
          <div className="space-y-6 animate-fade-in">
            {/* PLAT DU JOUR LIVE CONTROL HERO CARD */}
            <div className="bg-gradient-to-r from-amber-950/70 via-[#2E140D] to-[#1A0A06] p-5 sm:p-7 rounded-[2.5rem] border-2 border-brand-gold/40 shadow-2xl relative overflow-hidden">
               <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                  {/* Left: Dish Preview */}
                  <div className="flex items-center gap-4 sm:gap-5">
                     <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden shrink-0 border border-brand-gold/40 shadow-xl bg-black/40">
                        <img 
                          src={platDuJour.dishImage || 'https://images.unsplash.com/photo-1544025162-d76694265947?w=1000'} 
                          alt={platDuJour.dishName} 
                          className="w-full h-full object-cover" 
                        />
                        <div className={`absolute top-1 left-1 text-[7px] font-black uppercase px-2 py-0.5 rounded-full shadow ${
                          platDuJour.isActive ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
                        }`}>
                          {platDuJour.isActive ? 'En Ligne' : 'Masqué'}
                        </div>
                     </div>

                     <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                           <span className="bg-brand-gold/20 text-brand-gold text-[8px] font-black uppercase px-2.5 py-0.5 rounded-full border border-brand-gold/30 flex items-center gap-1">
                              <Sun size={10} className="text-brand-orange" /> Plat du Jour Actuel
                           </span>
                           <span className="text-[8px] font-bold text-white/50 bg-white/5 px-2 py-0.5 rounded-full">
                              {platDuJour.targetDayLabel || (platDuJour.publicationTiming === 'TONIGHT_FOR_TOMORROW' ? 'Demain Midi' : "Aujourd'hui")}
                           </span>
                        </div>
                        <h4 className="text-base sm:text-xl font-black italic uppercase text-white leading-tight">
                           {platDuJour.dishName}
                        </h4>
                        <div className="flex items-center gap-2.5 text-xs">
                           <span className="text-brand-orange font-black font-mono">
                              {(platDuJour.promoPrice || platDuJour.price).toLocaleString('fr-FR')} F CFA
                           </span>
                           {platDuJour.promoPrice && platDuJour.promoPrice < platDuJour.price && (
                              <span className="text-white/40 line-through text-[10px] font-mono">
                                 {platDuJour.price.toLocaleString('fr-FR')} F
                              </span>
                           )}
                           <span className="text-white/50 text-[10px]">
                              • {platDuJour.remainingStock || 25} parts
                           </span>
                        </div>
                     </div>
                  </div>

                  {/* Right: Quick Actions */}
                  <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
                     <button
                        type="button"
                        onClick={handleTogglePlatDuJour}
                        className={`flex items-center gap-2 px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-wider border transition-all ${
                           platDuJour.isActive
                              ? 'bg-emerald-600/30 text-emerald-300 border-emerald-500/50 hover:bg-emerald-600/40'
                              : 'bg-white/5 text-white/50 border-white/10 hover:bg-white/10'
                        }`}
                     >
                        {platDuJour.isActive ? <ToggleRight size={20} className="text-emerald-400" /> : <ToggleLeft size={20} />}
                        <span>{platDuJour.isActive ? 'Visible sur l\'App' : 'Activer sur l\'App'}</span>
                     </button>

                     <button
                        type="button"
                        onClick={() => {
                           playSound('pop');
                           setCurrentView(AdminView.PLAT_DU_JOUR);
                        }}
                        className="bg-brand-orange hover:bg-orange-600 text-white px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-wider shadow-lg shadow-brand-orange/30 active:scale-95 transition-all flex items-center gap-1.5"
                     >
                        <Utensils size={14} />
                        <span>Changer / Créer</span>
                     </button>

                     <button
                        type="button"
                        onClick={() => {
                           playSound('pop');
                           setCurrentView(AdminView.PLAT_DU_JOUR);
                        }}
                        className="bg-brand-gold hover:bg-yellow-400 text-brand-brown px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-wider shadow-lg active:scale-95 transition-all flex items-center gap-1.5"
                     >
                        <Sparkles size={14} />
                        <span>Studio Affiche</span>
                     </button>
                  </div>
               </div>
            </div>

            {/* Top Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
               {[
                 { label: 'Ventes du Mois', val: `${(salesStats.peakRevenue / 1000).toLocaleString('fr-FR')}k F`, icon: DollarSign, col: 'text-brand-gold' },
                 { label: 'Commandes Validées', val: salesStats.totalValidatedOrders, icon: ShoppingBag, col: 'text-brand-orange' },
                 { label: 'Livreurs Live', val: '4 Actifs', icon: Bike, col: 'text-green-400' },
                 { label: 'Articles Blog', val: blogArticles.length, icon: BookOpen, col: 'text-yellow-400' }
               ].map((s, i) => (
                 <div key={i} className="bg-white/5 p-6 rounded-[2rem] border border-white/5 shadow-2xl">
                    <s.icon size={20} className={`${s.col} mb-3`} />
                    <p className="text-[8px] text-white/30 uppercase font-black tracking-widest">{s.label}</p>
                    <h4 className="text-xl font-black italic">{s.val}</h4>
                 </div>
               ))}
            </div>

            {/* Interactive Monthly Sales Chart powered by Recharts */}
            <div className="bg-white/5 p-6 md:p-8 rounded-[2.5rem] border border-white/10 space-y-6 shadow-2xl relative overflow-hidden">
               <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
                  <div>
                     <div className="flex items-center gap-2">
                        <span className="p-2.5 bg-brand-gold/20 text-brand-gold rounded-2xl border border-brand-gold/30">
                           <TrendingUp size={20} />
                        </span>
                        <div>
                           <h3 className="text-lg md:text-xl font-black italic uppercase text-brand-gold tracking-wide">
                              Graphique des Ventes Mensuelles
                           </h3>
                           <p className="text-[10px] text-white/50 uppercase font-bold tracking-wider">
                              Visualisation des revenus générés par les commandes validées ({salesStats.totalValidatedOrders} commandes)
                           </p>
                        </div>
                     </div>
                  </div>

                  {/* Chart Metric & Type Controls */}
                  <div className="flex flex-wrap items-center gap-2">
                     <div className="flex bg-black/40 p-1 rounded-2xl border border-white/10 text-[10px] font-bold">
                        <button 
                          onClick={() => { playSound('pop'); setChartMetric('revenue'); }}
                          className={`px-3 py-1.5 rounded-xl uppercase transition-all ${chartMetric === 'revenue' ? 'bg-brand-orange text-white shadow-md' : 'text-white/50 hover:text-white'}`}
                        >
                           Revenu (F CFA)
                        </button>
                        <button 
                          onClick={() => { playSound('pop'); setChartMetric('orders'); }}
                          className={`px-3 py-1.5 rounded-xl uppercase transition-all ${chartMetric === 'orders' ? 'bg-brand-orange text-white shadow-md' : 'text-white/50 hover:text-white'}`}
                        >
                           Commandes
                        </button>
                     </div>

                     <div className="flex bg-black/40 p-1 rounded-2xl border border-white/10 text-[10px] font-bold">
                        <button 
                          onClick={() => { playSound('pop'); setChartType('area'); }}
                          className={`p-2 rounded-xl transition-all ${chartType === 'area' ? 'bg-brand-gold text-brand-brown shadow-md' : 'text-white/50 hover:text-white'}`}
                          title="Graphique en Courbe"
                        >
                           <LineChartIcon size={16} />
                        </button>
                        <button 
                          onClick={() => { playSound('pop'); setChartType('bar'); }}
                          className={`p-2 rounded-xl transition-all ${chartType === 'bar' ? 'bg-brand-gold text-brand-brown shadow-md' : 'text-white/50 hover:text-white'}`}
                          title="Graphique en Barres"
                        >
                           <BarChart3 size={16} />
                        </button>
                     </div>
                  </div>
               </div>

               {/* KPI Summary Cards */}
               <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-black/30 p-4 rounded-2xl border border-white/5 hover:border-brand-gold/30 transition-all">
                     <p className="text-[8px] font-black uppercase text-white/40 tracking-wider">Revenu Total 2026</p>
                     <h4 className="text-base md:text-lg font-black text-brand-gold italic mt-0.5">
                        {salesStats.totalRevenue.toLocaleString('fr-FR')} F
                     </h4>
                  </div>
                  <div className="bg-black/30 p-4 rounded-2xl border border-white/5 hover:border-emerald-500/30 transition-all">
                     <p className="text-[8px] font-black uppercase text-white/40 tracking-wider">Commandes Validées</p>
                     <h4 className="text-base md:text-lg font-black text-emerald-400 italic mt-0.5">
                        {salesStats.totalValidatedOrders}
                     </h4>
                  </div>
                  <div className="bg-black/30 p-4 rounded-2xl border border-white/5 hover:border-brand-orange/30 transition-all">
                     <p className="text-[8px] font-black uppercase text-white/40 tracking-wider">Mois de Peak</p>
                     <h4 className="text-base md:text-lg font-black text-brand-orange italic mt-0.5">
                        {salesStats.peakMonth} ({salesStats.peakRevenue.toLocaleString('fr-FR')} F)
                     </h4>
                  </div>
                  <div className="bg-black/30 p-4 rounded-2xl border border-white/5 hover:border-purple-500/30 transition-all">
                     <p className="text-[8px] font-black uppercase text-white/40 tracking-wider">Panier Moyen Validé</p>
                     <h4 className="text-base md:text-lg font-black text-purple-300 italic mt-0.5">
                        {salesStats.avgBasket.toLocaleString('fr-FR')} F
                     </h4>
                  </div>
               </div>

               {/* Recharts Container */}
               <div className="h-[280px] w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                     {chartType === 'area' ? (
                        <AreaChart data={monthlySalesData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                           <defs>
                              <linearGradient id="colorRevenueGradient" x1="0" y1="0" x2="0" y2="1">
                                 <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.8}/>
                                 <stop offset="95%" stopColor="#FF6B00" stopOpacity={0.05}/>
                              </linearGradient>
                              <linearGradient id="colorOrdersGradient" x1="0" y1="0" x2="0" y2="1">
                                 <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                                 <stop offset="95%" stopColor="#10B981" stopOpacity={0.05}/>
                              </linearGradient>
                           </defs>
                           <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                           <XAxis 
                             dataKey="month" 
                             stroke="#ffffff40" 
                             tick={{ fill: '#ffffff80', fontSize: 10, fontWeight: 'bold' }} 
                             axisLine={{ stroke: '#ffffff20' }}
                           />
                           <YAxis 
                             stroke="#ffffff40" 
                             tick={{ fill: '#ffffff80', fontSize: 9 }} 
                             axisLine={{ stroke: '#ffffff20' }}
                             tickFormatter={(val) => chartMetric === 'revenue' ? `${(val/1000000).toFixed(1)}M` : `${val}`}
                           />
                           <Tooltip content={<CustomChartTooltip />} />
                           <Area 
                             type="monotone" 
                             dataKey={chartMetric === 'revenue' ? 'revenue' : 'ordersCount'} 
                             name={chartMetric === 'revenue' ? 'Revenu (F CFA)' : 'Commandes'}
                             stroke={chartMetric === 'revenue' ? '#D4AF37' : '#10B981'} 
                             strokeWidth={3}
                             fillOpacity={1} 
                             fill={`url(#${chartMetric === 'revenue' ? 'colorRevenueGradient' : 'colorOrdersGradient'})`} 
                           />
                        </AreaChart>
                     ) : (
                        <BarChart data={monthlySalesData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                           <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                           <XAxis 
                             dataKey="month" 
                             stroke="#ffffff40" 
                             tick={{ fill: '#ffffff80', fontSize: 10, fontWeight: 'bold' }} 
                             axisLine={{ stroke: '#ffffff20' }}
                           />
                           <YAxis 
                             stroke="#ffffff40" 
                             tick={{ fill: '#ffffff80', fontSize: 9 }} 
                             axisLine={{ stroke: '#ffffff20' }}
                             tickFormatter={(val) => chartMetric === 'revenue' ? `${(val/1000000).toFixed(1)}M` : `${val}`}
                           />
                           <Tooltip content={<CustomChartTooltip />} />
                           <Bar 
                             dataKey={chartMetric === 'revenue' ? 'revenue' : 'ordersCount'} 
                             radius={[8, 8, 0, 0]}
                           >
                              {monthlySalesData.map((entry, index) => (
                                 <Cell 
                                   key={`cell-${index}`} 
                                   fill={chartMetric === 'revenue' ? (entry.revenue > 3000000 ? '#D4AF37' : '#FF6B00') : '#10B981'} 
                                   fillOpacity={entry.revenue === 0 && entry.ordersCount === 0 ? 0.2 : 0.85}
                                 />
                              ))}
                           </Bar>
                        </BarChart>
                     )}
                  </ResponsiveContainer>
               </div>
            </div>

            {/* Popular Dishes */}
            <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/5">
               <h3 className="text-lg font-black italic uppercase text-brand-gold mb-6">Plats en vogue</h3>
               <div className="space-y-4">
                  {items.slice(0, 3).map((it, idx) => (
                    <div key={idx} className="flex items-center gap-4 bg-black/20 p-4 rounded-2xl">
                       <img src={it.image} className="w-12 h-12 rounded-xl object-cover" alt={it.name} />
                       <div className="flex-1">
                          <p className="font-black text-[10px] uppercase tracking-tighter text-white/80">{it.name}</p>
                          <div className="w-full bg-white/5 h-1.5 rounded-full mt-2">
                             <div className="bg-brand-orange h-full rounded-full" style={{ width: `${95 - idx*10}%` }}></div>
                          </div>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
          </div>
        );

      case AdminView.MENU_MGMT:
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-2xl text-[10px] font-bold uppercase flex items-center justify-between gap-2 shadow-inner">
              <span className="flex items-center gap-2">
                <Save size={16} /> Sauvegarde Sécurisée Pérrenne Active — (LocalStorage + IndexedDB + Cloud)
              </span>
              <span className="text-[9px] text-emerald-300/80 italic font-normal">
                {items.length} plat(s) sauvegardé(s)
              </span>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
               <div>
                 <h3 className="text-xl font-black italic uppercase text-brand-gold">Gestion de la Carte</h3>
                 <p className="text-[10px] text-white/50">Modifiez les photos, prix, descriptions ou ajoutez de nouveaux plats.</p>
               </div>
               <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                 {/* Exporter Sauvegarde JSON */}
                 <button
                   type="button"
                   onClick={handleExportMenuJSON}
                   className="bg-sky-600/90 hover:bg-sky-600 text-white px-3.5 py-2.5 rounded-2xl flex items-center gap-1.5 font-black text-[9px] uppercase tracking-wider transition-all border border-sky-400/30 shadow-md active:scale-95"
                   title="Télécharger une copie de sauvegarde de tous vos plats sur votre appareil"
                 >
                   <Download size={14} /> Exporter JSON ({items.length})
                 </button>

                 {/* Importer Sauvegarde JSON */}
                 <label
                   className="bg-amber-600/90 hover:bg-amber-600 text-white px-3.5 py-2.5 rounded-2xl flex items-center gap-1.5 font-black text-[9px] uppercase tracking-wider transition-all border border-amber-400/30 shadow-md active:scale-95 cursor-pointer"
                   title="Restaurer vos plats depuis un fichier de sauvegarde JSON"
                 >
                   <Upload size={14} /> Importer JSON
                   <input
                     type="file"
                     accept=".json"
                     onChange={handleImportMenuJSON}
                     className="hidden"
                   />
                 </label>

                 <button 
                   type="button"
                   onClick={() => {
                     playSound('pop');
                     setShowCloudModal(true);
                     if (cloudConfig.isValid) {
                       handleExecuteMasterSync();
                     }
                   }}
                   className="bg-emerald-600/90 hover:bg-emerald-600 text-white px-3.5 py-2.5 rounded-2xl flex items-center gap-1.5 font-black text-[9px] uppercase tracking-wider transition-all border border-emerald-400/30 shadow-md active:scale-95"
                   title="Envoyer tous les plats, plat du jour et profil admin vers Supabase"
                 >
                   <Database size={14} /> Cloud ({items.length})
                 </button>
                 <button 
                   type="button"
                   onClick={() => {
                     const existingIds = new Set(items.map(i => i.id));
                     const missing = MENU_ITEMS.filter(m => !existingIds.has(m.id));
                     if (missing.length === 0) {
                       triggerShortcutFeedback('Carte complète', 'Tous les plats officiels sont déjà dans votre carte !');
                       return;
                     }
                     playSound('success');
                     const merged = [...items, ...missing];
                     setItems(merged);
                     saveMenuToIDB(merged);
                     try {
                       localStorage.setItem('khadys_menu_items', JSON.stringify(merged));
                     } catch (e) {}
                     triggerShortcutFeedback('Plats ajoutés', `+${missing.length} plats officiels intégrés (${merged.length} au total)`);
                   }}
                   className="bg-white/10 hover:bg-white/20 text-white px-3.5 py-2.5 rounded-2xl flex items-center gap-1.5 font-black text-[9px] uppercase tracking-wider transition-all border border-white/10"
                   title="Ajouter les plats officiels manquants sans jamais écraser vos créations"
                 >
                   <RefreshCw size={14} /> + Plats Officiels
                 </button>
                 <button onClick={() => setEditingItem({})} className="bg-brand-gold hover:bg-amber-400 text-brand-brown px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 font-black text-[10px] uppercase italic active:scale-95 transition-all">
                   <Plus size={18}/> Ajouter un Plat
                 </button>
               </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {items.map(item => (
                 <div key={item.id} className="bg-white/5 p-5 rounded-[2.5rem] border border-white/5 group relative overflow-hidden transition-all hover:bg-white/10">
                    <img src={item.image} className="w-full h-32 rounded-[2rem] object-cover opacity-80 mb-4" />
                    <h4 className="font-black text-xs italic text-brand-gold uppercase truncate mb-1">{item.name}</h4>
                    <p className="text-xs font-black text-brand-orange mb-4">{item.price} F</p>
                    <div className="flex gap-2">
                       <button onClick={() => setEditingItem(item)} className="flex-1 bg-white/5 p-3 rounded-xl text-white/40 hover:text-white hover:bg-brand-gold/20 flex items-center justify-center transition-all"><Edit3 size={16}/></button>
                       <button onClick={() => { 
                         playSound('pop');
                         setDeleteConfirmTarget({
                           type: 'dish',
                           id: item.id,
                           name: item.name,
                           category: item.category,
                           image: item.image,
                           onConfirm: () => {
                             setItems(prev => prev.filter(i => i.id !== item.id));
                             if (isSupabaseConfigured) db.deleteMenuItem(item.id);
                           }
                         });
                       }} className="flex-1 bg-rose-500/10 p-3 rounded-xl text-rose-400 hover:bg-rose-500 hover:text-white flex items-center justify-center transition-all group-hover:scale-105" title="Supprimer ce plat"><Trash2 size={16}/></button>
                    </div>
                 </div>
               ))}
            </div>
          </div>
        );

      case AdminView.BLOG_MGMT:
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
               <h3 className="text-xl font-black italic uppercase text-brand-gold flex items-center gap-2">
                 <BookOpen size={20} /> Gestion du Blog Culinaire
               </h3>
               <button onClick={() => setEditingArticle({})} className="bg-brand-orange text-white px-6 py-3 rounded-2xl shadow-xl flex items-center gap-2 font-black text-[10px] uppercase italic active:scale-95 transition-all">
                 <Plus size={18}/> Rédiger un Article
               </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {blogArticles.map(art => (
                <div key={art.id} className="bg-white/5 p-6 rounded-[2.5rem] border border-white/5 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <span className="text-[8px] font-black uppercase bg-brand-orange/20 text-brand-orange px-3 py-1 rounded-full">
                      {art.category}
                    </span>
                    <h4 className="font-black text-sm italic text-white uppercase leading-snug">{art.title}</h4>
                    <p className="text-[10px] text-white/50 line-clamp-2">{art.summary}</p>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-white/5">
                    <span className="text-[8px] text-white/30 font-bold uppercase">{art.author} • {art.date}</span>
                    <div className="flex gap-2">
                      <button onClick={() => setEditingArticle(art)} className="p-2.5 bg-white/5 rounded-xl text-brand-gold hover:bg-brand-gold hover:text-brand-brown transition-all">
                        <Edit3 size={14} />
                      </button>
                      <button onClick={() => { 
                        playSound('pop');
                        setDeleteConfirmTarget({
                          type: 'article',
                          id: art.id,
                          name: art.title,
                          category: art.category,
                          image: art.image,
                          onConfirm: () => {
                            setBlogArticles(prev => prev.filter(a => a.id !== art.id));
                          }
                        });
                      }} className="p-2.5 bg-rose-500/10 text-rose-400 rounded-xl hover:bg-rose-500 hover:text-white transition-all" title="Supprimer cet article">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case AdminView.FAQ_MGMT:
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
               <h3 className="text-xl font-black italic uppercase text-brand-gold flex items-center gap-2">
                 <HelpCircle size={20} /> Gestion FAQ & Aide
               </h3>
               <button onClick={() => setEditingFaq({})} className="bg-brand-gold text-brand-brown px-6 py-3 rounded-2xl shadow-xl flex items-center gap-2 font-black text-[10px] uppercase italic active:scale-95 transition-all">
                 <Plus size={18}/> Nouvelle Question
               </button>
            </div>

            <div className="space-y-4">
              {faqs.map(faq => (
                <div key={faq.id} className="bg-white/5 p-6 rounded-[2rem] border border-white/5 flex items-start justify-between gap-4">
                  <div className="space-y-1 flex-1">
                    <span className="text-[8px] font-black uppercase text-brand-orange">{faq.category}</span>
                    <h4 className="font-black text-xs text-white italic uppercase">{faq.question}</h4>
                    <p className="text-[10px] text-white/60 leading-relaxed mt-1">{faq.answer}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => setEditingFaq(faq)} className="p-2.5 bg-white/5 rounded-xl text-brand-gold hover:bg-brand-gold hover:text-brand-brown transition-all">
                      <Edit3 size={14} />
                    </button>
                    <button onClick={() => { 
                      playSound('pop');
                      setDeleteConfirmTarget({
                        type: 'faq',
                        id: faq.id,
                        name: faq.question,
                        category: faq.category,
                        onConfirm: () => {
                          setFaqs(prev => prev.filter(f => f.id !== faq.id));
                        }
                      });
                    }} className="p-2.5 bg-rose-500/10 text-rose-400 rounded-xl hover:bg-rose-500 hover:text-white transition-all" title="Supprimer cette question">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case AdminView.ORDERS:
        return (
          <div className="space-y-6 animate-fade-in">
             <h3 className="text-xl font-black italic uppercase text-brand-gold">Commandes en Direct</h3>
             <div className="space-y-4">
                {orders.length === 0 ? <p className="text-center py-20 opacity-20 italic">Aucune commande aujourd'hui</p> : 
                orders.map(o => (
                  <div key={o.id} className="bg-white/5 p-6 rounded-[2.5rem] border border-white/5 flex flex-col md:flex-row gap-6 relative group">
                     <div className="absolute top-0 right-0 p-4 bg-brand-orange/10 rounded-bl-[2rem] text-brand-orange font-black text-[10px]">{o.status}</div>
                     <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                           <h4 className="font-black text-brand-gold italic text-sm">{o.customerName}</h4>
                           <span className="text-[8px] px-2 py-0.5 bg-white/10 rounded-full font-bold">{o.id}</span>
                        </div>
                        <div className="space-y-1 bg-black/20 p-4 rounded-2xl">
                           {o.items.map((it, idx) => <p key={idx} className="text-[10px] text-white/60 font-bold">• {it.quantity} x {it.name}</p>)}
                        </div>
                     </div>
                     <div className="md:w-64 grid grid-cols-2 gap-2">
                        {['CONFIRMED', 'PREPARING', 'READY', 'DELIVERING', 'DELIVERED'].map(s => (
                          <button key={s} onClick={() => updateOrderStatus(o.id, s as OrderStatus)} className={`p-2 rounded-xl text-[7px] font-black uppercase transition-all ${o.status === s ? 'bg-brand-orange text-white' : 'bg-white/5 text-white/30 hover:bg-white/10'}`}>{s}</button>
                        ))}
                     </div>
                  </div>
                ))}
             </div>
          </div>
        );

      case AdminView.EVENT:
        return (
          <div className="space-y-6 animate-fade-in">
             <h3 className="text-xl font-black italic uppercase text-brand-gold">Gestion Événements</h3>
             <div className="bg-white/5 p-8 rounded-[3rem] border border-white/5 space-y-6">
                <div className="p-6 bg-brand-orange/10 border border-brand-orange/20 rounded-3xl flex justify-between items-center transition-all hover:bg-brand-orange/20 cursor-pointer">
                   <div>
                      <h4 className="font-black text-white italic text-sm">Mariage Royal - Plateau</h4>
                      <p className="text-[10px] text-white/40 uppercase font-bold">200 Invités • 20 Décembre • En attente de devis</p>
                   </div>
                   <button className="bg-brand-orange text-white px-5 py-2 rounded-xl text-[9px] font-black uppercase shadow-lg">Éditer</button>
                </div>
                <div className="p-6 bg-white/5 border border-white/10 rounded-3xl flex justify-between items-center opacity-40">
                   <div>
                      <h4 className="font-black text-white italic text-sm">Cocktail Pro - Yantala</h4>
                      <p className="text-[10px] text-white/40 uppercase font-bold">50 Personnes • Terminé</p>
                   </div>
                   <CheckCircle2 size={20} className="text-green-500" />
                </div>
             </div>
          </div>
        );

      case AdminView.BUFFET:
        return (
          <div className="space-y-6 animate-fade-in">
             <h3 className="text-xl font-black italic uppercase text-brand-gold">Packs Buffet Pro</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {items.filter(i => i.category === 'Pack-Buffet' || i.category === 'Pack').map((p, i) => (
                  <div key={i} className="bg-white/5 p-6 rounded-[2.5rem] border border-white/5 flex gap-5 items-center">
                     <img src={p.image} className="w-20 h-20 rounded-2xl object-cover shadow-lg" />
                     <div className="flex-1">
                        <h4 className="font-black text-[10px] text-brand-gold italic uppercase">{p.name}</h4>
                        <p className="text-brand-orange font-black text-sm">{p.price} F</p>
                     </div>
                     <button onClick={() => setEditingItem(p)} className="p-3 bg-white/5 rounded-xl text-white/40 hover:text-white transition-all"><Edit3 size={16}/></button>
                  </div>
                ))}
             </div>
          </div>
        );

      case AdminView.CLIENTS:
        return (
          <div className="space-y-6 animate-fade-in">
             <h3 className="text-xl font-black italic uppercase text-brand-gold">Gestion Clientèle Elite</h3>
             <div className="bg-white/5 rounded-[3rem] border border-white/5 overflow-hidden">
                <table className="w-full text-left">
                   <thead className="bg-white/5 text-[8px] font-black uppercase tracking-[0.3em] text-white/30">
                      <tr>
                         <th className="p-6">Client</th>
                         <th className="p-6">Rang</th>
                         <th className="p-6">Points</th>
                         <th className="p-6">Dernière commande</th>
                      </tr>
                   </thead>
                   <tbody className="text-[10px] font-bold">
                      {[
                        { name: 'Abdou R.', rank: 'Gold', points: 1250, date: 'Aujourd\'hui' },
                        { name: 'Mariama K.', rank: 'Silver', points: 450, date: 'Hier' },
                        { name: 'Issoufou Z.', rank: 'Platinum', points: 5200, date: 'Il y a 2 jours' }
                      ].map((c, i) => (
                        <tr key={i} className="border-t border-white/5 hover:bg-white/[0.02] transition-colors">
                           <td className="p-6 flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-white/10" /> {c.name}</td>
                           <td className="p-6"><span className={`px-3 py-1 rounded-full text-[7px] ${c.rank === 'Platinum' ? 'bg-brand-gold text-brand-brown' : 'bg-white/10 text-white/60'}`}>{c.rank}</span></td>
                           <td className="p-6 text-brand-orange">{c.points}</td>
                           <td className="p-6 opacity-40">{c.date}</td>
                        </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </div>
        );

      case AdminView.DELIVERY:
        return (
          <div className="space-y-6 animate-fade-in">
             <h3 className="text-xl font-black italic uppercase text-brand-gold">Flotte Billo Express</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { name: 'Sani D.', status: 'En livraison', zone: 'Plateau', phone: '+227 96 00 00 01' },
                  { name: 'Moussa B.', status: 'Disponible', zone: 'Base', phone: '+227 96 00 00 02' },
                  { name: 'Idé G.', status: 'En pause', zone: 'Goudel', phone: '+227 96 00 00 03' }
                ].map((l, i) => (
                  <div key={i} className="bg-white/5 p-6 rounded-[2.5rem] border border-white/5 flex items-center gap-5">
                     <div className="w-16 h-16 bg-brand-orange/20 rounded-2xl flex items-center justify-center text-brand-orange"><Bike size={32} /></div>
                     <div className="flex-1">
                        <h4 className="font-black text-xs text-white italic uppercase">{l.name}</h4>
                        <p className="text-[9px] font-bold text-white/40 uppercase mb-2">{l.phone}</p>
                        <div className="flex items-center gap-2">
                           <span className={`w-2 h-2 rounded-full ${l.status === 'En livraison' ? 'bg-brand-orange' : l.status === 'Disponible' ? 'bg-green-500' : 'bg-gray-500'}`} />
                           <span className="text-[8px] font-black uppercase text-white/60 tracking-widest">{l.status} • {l.zone}</span>
                        </div>
                     </div>
                     <button className="bg-white/5 p-3 rounded-xl text-white/20 hover:text-white transition-all"><MessageCircle size={18}/></button>
                  </div>
                ))}
             </div>
          </div>
        );

      case AdminView.PLAT_DU_JOUR:
        return (
          <AdminMarketingCenter 
            items={items} 
            orders={orders} 
            onItemsChange={setItems}
            initialTab="PLAT_DU_JOUR"
          />
        );

      case AdminView.AI_MARKETING:
        return (
          <AdminMarketingCenter 
            items={items} 
            orders={orders} 
            onItemsChange={setItems} 
          />
        );

      case AdminView.SETTINGS:
        return (
          <div className="space-y-8 animate-fade-in">
             <h3 className="text-xl font-black italic uppercase text-brand-gold">Configuration de l'Établissement</h3>
             <div className="bg-white/5 p-10 rounded-[3rem] border border-white/5 space-y-8">
                <div className="flex items-center justify-between p-6 bg-black/20 rounded-3xl border border-white/5">
                   <div>
                      <h4 className="font-black text-white italic text-sm uppercase">Statut Restaurant</h4>
                      <p className="text-[10px] text-white/40 uppercase font-bold tracking-widest">{isRestaurantOpen ? 'Ouvert - Accepte les commandes' : 'Fermé - Indisponible'}</p>
                   </div>
                   <button onClick={() => setIsRestaurantOpen(!isRestaurantOpen)} className={`w-16 h-8 rounded-full relative p-1 transition-all ${isRestaurantOpen ? 'bg-brand-orange' : 'bg-white/10'}`}>
                      <div className={`w-6 h-6 bg-white rounded-full transition-all ${isRestaurantOpen ? 'translate-x-8' : 'translate-x-0'} shadow-xl`}></div>
                   </button>
                </div>
                <div className="space-y-2">
                   <h4 className="font-black text-brand-gold uppercase text-[10px] ml-4 tracking-[0.3em]">Contact WhatsApp Live</h4>
                   <input className="w-full p-5 bg-white/5 rounded-2xl text-white font-bold border border-white/10 outline-none focus:border-brand-gold" defaultValue="+227 74 44 16 21" />
                </div>
                <div className="space-y-2">
                   <h4 className="font-black text-brand-gold uppercase text-[10px] ml-4 tracking-[0.3em]">Code Promo Actif</h4>
                   <input className="w-full p-5 bg-white/5 rounded-2xl text-white font-bold border border-white/10 outline-none focus:border-brand-gold" defaultValue="KHADY24" />
                </div>
                <button className="w-full bg-brand-gold text-brand-brown py-6 rounded-3xl font-black uppercase italic shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-all">
                   <Save size={20}/> Appliquer les Paramètres
                </button>
             </div>
          </div>
        );

      default:
        return <div className="text-center py-20 text-white/20 italic">Module en développement...</div>;
    }
  };

  const navItems = [
    { v: AdminView.DASHBOARD, i: LayoutDashboard, l: 'Home', shortcut: 'A', keyDisplay: '⌃⇧A' },
    { v: AdminView.PLAT_DU_JOUR, i: Sun, l: 'Plat du Jour', shortcut: 'P', keyDisplay: '⌃⇧P' },
    { v: AdminView.MENU_MGMT, i: Utensils, l: 'Carte', shortcut: 'M', keyDisplay: '⌃⇧M' },
    { v: AdminView.BLOG_MGMT, i: BookOpen, l: 'Blog', shortcut: 'B', keyDisplay: '⌃⇧B' },
    { v: AdminView.FAQ_MGMT, i: HelpCircle, l: 'FAQ', shortcut: 'F', keyDisplay: '⌃⇧F' },
    { v: AdminView.ORDERS, i: ShoppingBag, l: 'Orders', shortcut: 'O', keyDisplay: '⌃⇧O' },
    { v: AdminView.DELIVERY, i: Bike, l: 'Livreurs', shortcut: 'L', keyDisplay: '⌃⇧L' },
    { v: AdminView.CLIENTS, i: Users, l: 'Clients', shortcut: 'U', keyDisplay: '⌃⇧U' },
    { v: AdminView.AI_MARKETING, i: Zap, l: 'Marketing', shortcut: 'K', keyDisplay: '⌃⇧K' },
    { v: AdminView.EVENT, i: Calendar, l: 'Évents', shortcut: 'E', keyDisplay: '⌃⇧E' },
    { v: AdminView.BUFFET, i: ChefHat, l: 'Buffet', shortcut: 'T', keyDisplay: '⌃⇧T' },
    { v: AdminView.SETTINGS, i: Settings, l: 'Settings', shortcut: 'S', keyDisplay: '⌃⇧S' }
  ];

  return (
    <div className="min-h-screen w-full bg-[#0F0807] text-white flex flex-col md:flex-row overflow-hidden font-sans relative">
      <input 
        type="file" 
        ref={adminPhotoInputRef} 
        className="hidden" 
        accept="image/*" 
        onChange={handleAdminPhotoChange}
      />

      {/* Desktop Sidebar Admin (md:flex) */}
      <div className="hidden md:flex w-24 bg-black/40 border-r border-white/5 flex-col items-center py-8 gap-4 overflow-y-auto no-scrollbar flex-shrink-0">
        <KhadyLogo variant="light" className="scale-75 mb-2" />
        {navItems.map(n => (
          <button 
            key={n.l} 
            onClick={() => handleSafeChangeView(n.v)} 
            title={`${n.l} (Raccourci: Ctrl + Shift + ${n.shortcut})`}
            className={`flex flex-col items-center transition-all duration-300 relative group ${currentView === n.v ? 'scale-110 opacity-100' : 'opacity-25 hover:opacity-100'}`}
          >
             <div className={`p-3 rounded-2xl relative ${currentView === n.v ? 'bg-brand-orange text-white shadow-xl ring-2 ring-brand-gold/30' : 'bg-white/5'}`}>
               <n.i size={20} />
               <span className="hidden group-hover:flex absolute -top-1 -right-1 bg-black/90 text-brand-gold text-[7px] font-mono px-1 py-0.2 rounded border border-brand-gold/40 shadow-lg pointer-events-none">
                 {n.keyDisplay}
               </span>
             </div>
             <span className="text-[6px] mt-1 font-black tracking-widest uppercase text-center w-20 leading-tight">{n.l}</span>
          </button>
        ))}

        {/* Bouton Guide Raccourcis Sidebar */}
        <button 
          onClick={() => { playSound('pop'); setShowShortcutsModal(true); }}
          title="Guide des Raccourcis Clavier (Ctrl + Shift + H ou ?)"
          className="p-3 bg-white/5 hover:bg-brand-gold/20 text-white/50 hover:text-brand-gold rounded-2xl transition-all active:scale-90 flex flex-col items-center gap-1 mt-2 border border-white/5 hover:border-brand-gold/30"
        >
          <Keyboard size={18} />
          <span className="text-[6px] font-black uppercase tracking-widest text-center">Clavier</span>
        </button>

        <button onClick={handleSafeExit} title="Quitter le Dashboard Admin (Ctrl + Shift + Q)" className="mt-auto p-4 bg-red-500/10 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all active:scale-90 flex flex-col items-center gap-1">
          <Power size={22}/>
          <span className="text-[6px] font-black uppercase tracking-widest">Quitter</span>
        </button>
      </div>

      {/* Mobile Horizontal Navigation Header (md:hidden) */}
      <div className="flex md:hidden bg-black/80 border-b border-white/10 px-2.5 py-2 overflow-x-auto no-scrollbar flex-shrink-0 items-center gap-1.5 z-30 sticky top-0 backdrop-blur-md">
        <KhadyLogo variant="light" className="scale-[0.6] shrink-0 -mr-2" />
        {navItems.map(n => (
          <button 
            key={n.l} 
            onClick={() => handleSafeChangeView(n.v)} 
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl shrink-0 transition-all text-[10px] font-black uppercase tracking-wider min-h-[38px] ${
              currentView === n.v ? 'bg-brand-orange text-white shadow-lg' : 'bg-white/5 text-white/60 hover:text-white'
            }`}
          >
            <n.i size={14} />
            <span>{n.l}</span>
          </button>
        ))}
        <button 
          onClick={handleSafeExit} 
          className="px-3 py-2 bg-rose-500/20 text-rose-300 rounded-xl shrink-0 text-[10px] font-black uppercase flex items-center gap-1 border border-rose-500/30 min-h-[38px]"
        >
          <Power size={14} /> Quitter
        </button>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="p-3 sm:p-5 md:p-8 flex flex-wrap sm:flex-nowrap justify-between items-center border-b border-white/5 bg-black/20 backdrop-blur-md relative z-20 gap-2.5">
           <div className="min-w-0">
              <h2 className="text-xs sm:text-sm font-black italic uppercase text-brand-gold tracking-[0.15em] leading-none truncate">Console Admin Elite</h2>
              <p className="text-[7px] sm:text-[8px] text-white/40 font-black uppercase mt-1 tracking-wider truncate">Terminal de Gestion — Khady's Food</p>
           </div>
           
           <div className="flex items-center gap-1.5 sm:gap-2.5 flex-wrap sm:flex-nowrap shrink-0">
              {/* Bouton Raccourcis Clavier Header */}
              <button 
                type="button"
                onClick={() => { playSound('pop'); setShowShortcutsModal(true); }}
                className="px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-2xl text-[8px] sm:text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 active:scale-95 shadow-md shrink-0 border bg-white/5 hover:bg-brand-gold/15 text-white/70 hover:text-brand-gold border-white/10 hover:border-brand-gold/30 min-h-[38px]"
                title="Afficher le panneau des raccourcis clavier (Ctrl+Shift+H ou ?)"
              >
                <Keyboard size={14} className="text-brand-gold" />
                <span className="hidden sm:inline">Raccourcis</span>
                <span className="hidden lg:inline-block text-[7px] font-mono bg-black/60 text-brand-gold/80 px-1.5 py-0.5 rounded border border-white/10">
                  ^⇧H
                </span>
              </button>

              {/* Bouton Cloud Supabase */}
              <button 
                type="button"
                onClick={() => { playSound('pop'); setShowCloudModal(true); }}
                className={`px-2.5 sm:px-4 py-2 sm:py-2.5 rounded-2xl text-[8px] sm:text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 active:scale-95 shadow-lg shrink-0 border min-h-[38px] ${
                  cloudConfig.isValid 
                    ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
                    : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/30 animate-pulse'
                }`}
                title="Gérer la synchronisation Supabase Cloud (Ctrl+Shift+Z)"
              >
                <Database size={14} className={cloudConfig.isValid ? 'text-emerald-400' : 'text-amber-400'} />
                <span className="hidden sm:inline">
                  {cloudConfig.isValid ? 'Cloud Connecté' : 'Configurer Cloud'}
                </span>
                <span className="sm:hidden">Cloud</span>
                <span className={`w-2 h-2 rounded-full ${cloudConfig.isValid ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-amber-400 animate-ping'}`} />
              </button>

              <button 
                onClick={handleSafeExit}
                className="px-2.5 sm:px-4 py-2 sm:py-2.5 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white border border-rose-500/30 rounded-2xl text-[8px] sm:text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 active:scale-95 shadow-lg shrink-0 min-h-[38px]"
              >
                 <Power size={14} /> <span className="hidden sm:inline">Quitter Admin</span>
              </button>

              <div 
                onClick={() => adminPhotoInputRef.current?.click()}
                className="w-9 h-9 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center relative group cursor-pointer overflow-hidden shadow-2xl hover:border-brand-orange transition-all flex-shrink-0"
                title="Changer la photo de profil Admin (Synchronisée sur le Cloud)"
              >
                 {adminAvatar ? <img src={adminAvatar} className="w-full h-full object-cover" alt="Admin Avatar" /> : <Camera className="text-brand-gold opacity-20" size={18} />}
                 <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                    <Camera size={14} className="text-white" />
                 </div>
              </div>
           </div>
        </header>
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 md:p-10 no-scrollbar bg-gradient-to-br from-transparent to-brand-orange/[0.02]">{renderContent()}</div>
      </div>

      {/* Modal d'édition/ajout de plat */}
      {editingItem && (
        <div 
          className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-3 sm:p-6 animate-fade-in"
          onClick={handleCloseDishModal}
        >
           <div 
             onClick={e => e.stopPropagation()}
             className="bg-brand-brown w-full max-w-lg rounded-3xl sm:rounded-[3rem] p-5 sm:p-8 md:p-10 border-2 border-white/10 shadow-2xl relative overflow-y-auto max-h-[92vh] sm:max-h-[90vh] no-scrollbar"
           >
              <button 
                type="button"
                onClick={handleCloseDishModal} 
                className="absolute top-4 right-4 sm:top-7 sm:right-7 text-white/30 hover:text-white transition-colors p-2"
                title="Fermer sans enregistrer"
              >
                <X size={22}/>
              </button>
              <h3 className="text-lg sm:text-xl font-black italic uppercase text-brand-gold mb-6 sm:mb-8 tracking-tighter leading-none">{editingItem.id ? 'Éditer le Plat' : 'Nouveau Plat'}</h3>
              <form onSubmit={handleSaveItem} className="space-y-4">
                 <div className="space-y-1">
                    <label className="text-[8px] font-black uppercase text-white/30 ml-3">Nom du plat</label>
                    <input required value={editingItem.name || ''} onChange={e => setEditingItem({...editingItem, name: e.target.value})} className="w-full p-3.5 sm:p-4 bg-white/5 rounded-2xl text-white text-xs font-bold border border-white/10 outline-none focus:border-brand-gold" placeholder="Ex: Tiep Royal" />
                 </div>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-1">
                       <label className="text-[8px] font-black uppercase text-white/30 ml-3">Prix (F CFA)</label>
                       <input type="number" required value={editingItem.price || ''} onChange={e => setEditingItem({...editingItem, price: Number(e.target.value)})} className="w-full p-3.5 sm:p-4 bg-white/5 rounded-2xl text-white text-xs font-bold border border-white/10" />
                    </div>
                    <div className="space-y-1">
                       <label className="text-[8px] font-black uppercase text-white/30 ml-3">Catégorie</label>
                       <select value={editingItem.category || 'Plat Africain'} onChange={e => setEditingItem({...editingItem, category: e.target.value as any})} className="w-full p-3.5 sm:p-4 bg-white/5 rounded-2xl text-white text-[10px] font-black border border-white/10 outline-none">
                          <option value="Plat Africain">Plat Africain</option>
                          <option value="Spécialité Maison">Spécialité</option>
                          <option value="Box Sauce">Box Sauce</option>
                          <option value="Pack-Buffet">Pack-Buffet</option>
                          <option value="Boisson Froide">Boisson</option>
                          <option value="Dessert">Dessert</option>
                       </select>
                    </div>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[8px] font-black uppercase text-white/30 ml-3">Photo du Plat</label>
                    <input 
                       type="file" 
                       ref={dishPhotoInputRef} 
                       accept="image/*" 
                       className="hidden" 
                       onChange={handleDishPhotoChange} 
                    />
                    
                    {editingItem.image && (
                       <div className="relative w-full h-28 sm:h-36 rounded-2xl overflow-hidden border border-white/20 mb-2 group">
                          <img src={editingItem.image} alt="Aperçu plat" className="w-full h-full object-cover" />
                          <button 
                             type="button" 
                             onClick={() => {
                               playSound('pop');
                               setDeleteConfirmTarget({
                                 type: 'media',
                                 id: 'photo_dish',
                                 name: editingItem.name ? `Photo du plat "${editingItem.name}"` : 'Photo du plat',
                                 image: editingItem.image,
                                 onConfirm: () => {
                                   setEditingItem(prev => prev ? { ...prev, image: '' } : null);
                                 }
                               });
                             }} 
                             className="absolute top-2 right-2 bg-rose-600 text-white p-2 rounded-full hover:bg-rose-500 transition-colors shadow-lg"
                             title="Supprimer la photo"
                          >
                             <Trash2 size={14} />
                          </button>
                       </div>
                    )}

                    <button 
                       type="button" 
                       onClick={() => dishPhotoInputRef.current?.click()} 
                       className="w-full p-3.5 sm:p-4 bg-brand-gold/15 border border-brand-gold/40 hover:bg-brand-gold/25 text-brand-gold rounded-2xl flex items-center justify-center gap-2 font-black text-[10px] uppercase tracking-wider transition-all active:scale-95 shadow-lg min-h-[44px]"
                    >
                       <Camera size={18} /> Importer depuis Galerie / Appareil
                    </button>

                    <div className="pt-1">
                       <span className="text-[7px] text-white/40 uppercase font-black tracking-widest block mb-1">Ou saisir un lien URL :</span>
                       <input value={editingItem.image || ''} onChange={e => setEditingItem({...editingItem, image: e.target.value})} className="w-full p-3 bg-white/5 rounded-xl text-white text-[10px] border border-white/10 outline-none focus:border-brand-gold" placeholder="https://..." />
                    </div>
                 </div>
                 <div className="space-y-1">
                    <label className="text-[8px] font-black uppercase text-white/30 ml-3">Description</label>
                    <textarea value={editingItem.description || ''} onChange={e => setEditingItem({...editingItem, description: e.target.value})} className="w-full p-3.5 sm:p-4 bg-white/5 rounded-2xl text-white text-[10px] h-24 border border-white/10 resize-none" placeholder="Détails du plat..." />
                 </div>

                 {/* Tags & Attribute Filters */}
                 <div className="space-y-2 pt-1">
                    <label className="text-[8px] font-black uppercase text-brand-gold ml-3">Tags & Filtres de Sélection</label>
                    <div className="grid grid-cols-2 gap-2 bg-white/5 p-3.5 rounded-2xl border border-white/10">
                       <label className="flex items-center gap-2 cursor-pointer text-[10px] font-bold text-white/80 hover:text-white">
                          <input 
                             type="checkbox" 
                             checked={!!editingItem.isPlatDuJour} 
                             onChange={e => setEditingItem({...editingItem, isPlatDuJour: e.target.checked})}
                             className="rounded accent-brand-gold w-3.5 h-3.5 cursor-pointer"
                          />
                          <span>🌟 Plat du Jour</span>
                       </label>
                       <label className="flex items-center gap-2 cursor-pointer text-[10px] font-bold text-white/80 hover:text-white">
                          <input 
                             type="checkbox" 
                             checked={!!editingItem.isSpécialitéMaison} 
                             onChange={e => setEditingItem({...editingItem, isSpécialitéMaison: e.target.checked})}
                             className="rounded accent-purple-500 w-3.5 h-3.5 cursor-pointer"
                          />
                          <span>👑 Spécialité</span>
                       </label>
                       <label className="flex items-center gap-2 cursor-pointer text-[10px] font-bold text-white/80 hover:text-white">
                          <input 
                             type="checkbox" 
                             checked={!!editingItem.isSpicy} 
                             onChange={e => setEditingItem({...editingItem, isSpicy: e.target.checked})}
                             className="rounded accent-rose-500 w-3.5 h-3.5 cursor-pointer"
                          />
                          <span>🌶️ Épicé</span>
                       </label>
                       <label className="flex items-center gap-2 cursor-pointer text-[10px] font-bold text-white/80 hover:text-white">
                          <input 
                             type="checkbox" 
                             checked={!!editingItem.isVegetarian} 
                             onChange={e => setEditingItem({...editingItem, isVegetarian: e.target.checked})}
                             className="rounded accent-emerald-500 w-3.5 h-3.5 cursor-pointer"
                          />
                          <span>🌿 Végétarien</span>
                       </label>
                       <label className="flex items-center gap-2 cursor-pointer text-[10px] font-bold text-white/80 hover:text-white col-span-2">
                          <input 
                             type="checkbox" 
                             checked={!!editingItem.isPromo} 
                             onChange={e => setEditingItem({...editingItem, isPromo: e.target.checked})}
                             className="rounded accent-amber-500 w-3.5 h-3.5 cursor-pointer"
                          />
                          <span>🏷️ En Promotion / Offre Spéciale</span>
                       </label>
                    </div>
                 </div>

                 <div className="flex items-center gap-3 pt-2">
                    <button 
                      type="button" 
                      onClick={handleCloseDishModal}
                      className="w-1/3 bg-white/10 hover:bg-white/20 text-white/70 hover:text-white py-4 sm:py-5 rounded-2xl font-bold uppercase text-[10px] tracking-wider transition-all active:scale-95 min-h-[48px]"
                    >
                      Annuler
                    </button>
                    <button 
                      type="submit" 
                      className="w-2/3 bg-brand-orange hover:bg-brand-orange/90 text-white py-4 sm:py-5 rounded-2xl font-black uppercase italic shadow-2xl flex items-center justify-center gap-2 active:scale-95 transition-all min-h-[48px]"
                    >
                      <span>{editingItem.id ? 'Mettre à jour' : 'Ajouter à la Carte'}</span>
                      <CheckCircle2 size={18}/>
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {/* Modal d'édition/ajout d'article de blog */}
      {editingArticle && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-3 sm:p-6 animate-fade-in">
           <div className="bg-brand-brown w-full max-w-lg rounded-3xl sm:rounded-[3rem] p-5 sm:p-8 md:p-10 border-2 border-white/10 shadow-2xl relative overflow-y-auto max-h-[92vh] sm:max-h-[90vh] no-scrollbar">
              <button onClick={() => setEditingArticle(null)} className="absolute top-4 right-4 sm:top-7 sm:right-7 text-white/30 hover:text-white transition-colors p-2"><X size={22}/></button>
              <h3 className="text-lg sm:text-xl font-black italic uppercase text-brand-gold mb-6 sm:mb-8 tracking-tighter leading-none">{editingArticle.id ? 'Éditer l\'Article' : 'Nouveau Billet Blog'}</h3>
              <form onSubmit={handleSaveArticle} className="space-y-4">
                 <div className="space-y-1">
                    <label className="text-[8px] font-black uppercase text-white/30 ml-3">Titre de l'article</label>
                    <input required value={editingArticle.title || ''} onChange={e => setEditingArticle({...editingArticle, title: e.target.value})} className="w-full p-3.5 sm:p-4 bg-white/5 rounded-2xl text-white text-xs font-bold border border-white/10 outline-none focus:border-brand-gold" placeholder="Ex: Les secrets du Dambou" />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[8px] font-black uppercase text-white/30 ml-3">Catégorie</label>
                    <select value={editingArticle.category || 'Secrets du Chef'} onChange={e => setEditingArticle({...editingArticle, category: e.target.value as any})} className="w-full p-3.5 sm:p-4 bg-white/5 rounded-2xl text-white text-[10px] font-black border border-white/10 outline-none">
                       <option value="Secrets du Chef">Secrets du Chef</option>
                       <option value="Recettes">Recettes</option>
                       <option value="Nutrition Sahel">Nutrition Sahel</option>
                       <option value="Événements">Événements</option>
                    </select>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[8px] font-black uppercase text-white/30 ml-3">Photo d'Illustration HD</label>
                    <input 
                       type="file" 
                       ref={articlePhotoInputRef} 
                       accept="image/*" 
                       className="hidden" 
                       onChange={handleArticlePhotoChange} 
                    />

                    {editingArticle.image && (
                       <div className="relative w-full h-28 sm:h-36 rounded-2xl overflow-hidden border border-white/20 mb-2 group">
                          <img src={editingArticle.image} alt="Aperçu article" className="w-full h-full object-cover" />
                          <button 
                             type="button" 
                             onClick={() => {
                               playSound('pop');
                               setDeleteConfirmTarget({
                                 type: 'media',
                                 id: 'photo_article',
                                 name: editingArticle.title ? `Image de l'article "${editingArticle.title}"` : 'Illustration article',
                                 image: editingArticle.image,
                                 onConfirm: () => {
                                   setEditingArticle(prev => prev ? { ...prev, image: '' } : null);
                                 }
                               });
                             }} 
                             className="absolute top-2 right-2 bg-rose-600 text-white p-2 rounded-full hover:bg-rose-500 transition-colors shadow-lg"
                             title="Supprimer la photo"
                          >
                             <Trash2 size={14} />
                          </button>
                       </div>
                    )}

                    <button 
                       type="button" 
                       onClick={() => articlePhotoInputRef.current?.click()} 
                       className="w-full p-3.5 sm:p-4 bg-brand-gold/15 border border-brand-gold/40 hover:bg-brand-gold/25 text-brand-gold rounded-2xl flex items-center justify-center gap-2 font-black text-[10px] uppercase tracking-wider transition-all active:scale-95 shadow-lg min-h-[44px]"
                    >
                       <Camera size={18} /> Importer depuis Galerie
                    </button>

                    <div className="pt-1">
                       <span className="text-[7px] text-white/40 uppercase font-black tracking-widest block mb-1">Ou lien URL :</span>
                       <input value={editingArticle.image || ''} onChange={e => setEditingArticle({...editingArticle, image: e.target.value})} className="w-full p-3 bg-white/5 rounded-xl text-white text-[10px] border border-white/10 outline-none focus:border-brand-gold" placeholder="https://..." />
                    </div>
                 </div>
                 <div className="space-y-1">
                    <label className="text-[8px] font-black uppercase text-white/30 ml-3">Contenu Complet</label>
                    <textarea required value={editingArticle.content || ''} onChange={e => setEditingArticle({...editingArticle, content: e.target.value})} className="w-full p-3.5 sm:p-4 bg-white/5 rounded-2xl text-white text-[10px] h-32 border border-white/10 resize-none" placeholder="Rédigez l'article..." />
                 </div>
                 <button type="submit" className="w-full bg-brand-orange text-white py-4 sm:py-5 rounded-2xl font-black uppercase italic shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-all mt-4 min-h-[48px]">
                    {editingArticle.id ? 'Mettre à jour' : 'Publier sur le Blog'} <CheckCircle2 size={20}/>
                 </button>
              </form>
           </div>
        </div>
      )}

      {/* Modal d'édition/ajout de FAQ */}
      {editingFaq && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-3 sm:p-6 animate-fade-in">
           <div className="bg-brand-brown w-full max-w-lg rounded-3xl sm:rounded-[3rem] p-5 sm:p-8 md:p-10 border-2 border-white/10 shadow-2xl relative overflow-y-auto max-h-[92vh] sm:max-h-[90vh] no-scrollbar">
              <button onClick={() => setEditingFaq(null)} className="absolute top-4 right-4 sm:top-7 sm:right-7 text-white/30 hover:text-white transition-colors p-2"><X size={22}/></button>
              <h3 className="text-lg sm:text-xl font-black italic uppercase text-brand-gold mb-6 sm:mb-8 tracking-tighter leading-none">{editingFaq.id ? 'Éditer la Question' : 'Nouvelle Question FAQ'}</h3>
              <form onSubmit={handleSaveFaq} className="space-y-4">
                 <div className="space-y-1">
                    <label className="text-[8px] font-black uppercase text-white/30 ml-3">Catégorie</label>
                    <select value={editingFaq.category || 'Paiement'} onChange={e => setEditingFaq({...editingFaq, category: e.target.value as any})} className="w-full p-3.5 sm:p-4 bg-white/5 rounded-2xl text-white text-[10px] font-black border border-white/10 outline-none">
                       <option value="Paiement">Paiement</option>
                       <option value="Livraison">Livraison</option>
                       <option value="Commandes">Commandes</option>
                       <option value="Traiteur">Traiteur</option>
                       <option value="Fidélité">Fidélité</option>
                    </select>
                 </div>
                 <div className="space-y-1">
                    <label className="text-[8px] font-black uppercase text-white/30 ml-3">Question</label>
                    <input required value={editingFaq.question || ''} onChange={e => setEditingFaq({...editingFaq, question: e.target.value})} className="w-full p-3.5 sm:p-4 bg-white/5 rounded-2xl text-white text-xs font-bold border border-white/10 outline-none focus:border-brand-gold" placeholder="Ex: Livrez-vous à Goudel ?" />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[8px] font-black uppercase text-white/30 ml-3">Réponse détaillée</label>
                    <textarea required value={editingFaq.answer || ''} onChange={e => setEditingFaq({...editingFaq, answer: e.target.value})} className="w-full p-3.5 sm:p-4 bg-white/5 rounded-2xl text-white text-[10px] h-28 border border-white/10 resize-none" placeholder="Expliquez la réponse..." />
                 </div>
                 <button type="submit" className="w-full bg-brand-gold text-brand-brown py-4 sm:py-5 rounded-2xl font-black uppercase italic shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-all mt-4 min-h-[48px]">
                    {editingFaq.id ? 'Mettre à jour' : 'Enregistrer la FAQ'} <CheckCircle2 size={20}/>
                 </button>
              </form>
           </div>
        </div>
      )}

      {/* Dialogue Visuel Sécurisé de Confirmation de Suppression */}
      {deleteConfirmTarget && (
        <div className="fixed inset-0 z-[160] bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fade-in">
          <div className="bg-[#1C0F0D] border-2 border-rose-500/40 w-full max-w-sm rounded-3xl sm:rounded-[3.5rem] p-5 sm:p-8 shadow-2xl space-y-5 text-center relative overflow-hidden">
            {/* Arrière plan lumineux dynamique rouge */}
            <div className="absolute -top-16 -left-16 w-32 h-32 bg-rose-500/20 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-16 -right-16 w-32 h-32 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />

            {/* Bouton Fermer */}
            <button 
              onClick={() => { playSound('pop'); setDeleteConfirmTarget(null); }}
              className="absolute top-4 right-4 text-white/30 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10"
            >
              <X size={20} />
            </button>

            {/* Icône Corbeille / Alerte Animée */}
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-3xl bg-rose-500/20 border border-rose-500/40 text-rose-500 flex items-center justify-center mx-auto shadow-inner">
              <Trash2 size={28} className="animate-bounce" />
            </div>

            {/* Titre & Type d'élément */}
            <div>
              <span className="bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full italic inline-block mb-2">
                {deleteConfirmTarget.type === 'dish' && '🗑️ Plat du Menu'}
                {deleteConfirmTarget.type === 'article' && '🗑️ Billet de Blog'}
                {deleteConfirmTarget.type === 'faq' && '🗑️ Question FAQ'}
                {deleteConfirmTarget.type === 'media' && '🖼️ Fichier Média / Photo'}
              </span>
              <h3 className="text-base sm:text-lg font-black text-white italic uppercase tracking-tight">
                Confirmer la suppression ?
              </h3>
              <p className="text-[10px] sm:text-[11px] font-medium text-white/60 mt-1">
                Cette opération supprimera définitivement cet élément.
              </p>
            </div>

            {/* Carte Aperçu de l'élément à supprimer */}
            <div className="bg-black/50 p-3.5 rounded-2xl border border-white/10 text-left space-y-2.5">
              {deleteConfirmTarget.image && (
                <div className="w-full h-24 sm:h-28 rounded-xl overflow-hidden border border-white/10 relative">
                  <img src={deleteConfirmTarget.image} alt={deleteConfirmTarget.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <span className="absolute bottom-2 left-2 text-[8px] font-black uppercase bg-rose-950/80 text-rose-300 px-2 py-0.5 rounded-full border border-rose-500/30">
                    Aperçu Média
                  </span>
                </div>
              )}
              <div>
                <div className="text-[9px] font-black uppercase text-brand-gold/70">Intitulé :</div>
                <div className="text-xs font-black text-white italic uppercase line-clamp-2">
                  {deleteConfirmTarget.name}
                </div>
                {deleteConfirmTarget.category && (
                  <div className="text-[9px] font-bold text-white/40 mt-1">
                    Catégorie : <span className="text-brand-orange">{deleteConfirmTarget.category}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Message de Sécurité */}
            <div className="flex items-center gap-2 bg-rose-950/50 p-2.5 rounded-xl border border-rose-500/30 text-rose-300 text-[9px] sm:text-[10px] text-left font-semibold">
              <ShieldAlert size={16} className="shrink-0 text-rose-400" />
              <span>Suppression sécurisée instantanée dans le système.</span>
            </div>

            {/* Actions */}
            <div className="flex gap-2.5 pt-1">
              <button
                onClick={() => { playSound('pop'); setDeleteConfirmTarget(null); }}
                className="flex-1 bg-white/10 hover:bg-white/20 text-white text-[10px] font-black uppercase py-3.5 rounded-2xl tracking-wider active:scale-95 transition-all min-h-[44px]"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  deleteConfirmTarget.onConfirm();
                  setDeleteConfirmTarget(null);
                }}
                className="flex-1 bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-black uppercase py-3.5 rounded-2xl tracking-wider shadow-lg shadow-rose-600/30 active:scale-95 transition-all flex items-center justify-center gap-1.5 min-h-[44px]"
              >
                <Trash2 size={15} /> Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL CLOUD SUPABASE : SYNCHRONISATION TOTALE & GESTION DES CLÉS          */}
      {/* ========================================================================= */}
      {showCloudModal && (
        <div className="fixed inset-0 z-[120] bg-black/90 backdrop-blur-xl flex items-center justify-center p-3 sm:p-6 animate-fade-in">
          <div className="bg-[#1C0F0D] border-2 border-brand-gold/40 w-full max-w-2xl rounded-3xl sm:rounded-[2.5rem] shadow-2xl p-4 sm:p-8 relative max-h-[92vh] sm:max-h-[90vh] overflow-y-auto no-scrollbar text-white">
            
            {/* Bouton Fermer */}
            <button 
              onClick={() => { playSound('pop'); setShowCloudModal(false); }}
              className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2 rounded-xl bg-white/5 hover:bg-white/15 text-white/60 hover:text-white transition-all min-h-[38px] min-w-[38px] flex items-center justify-center"
              title="Fermer"
            >
              <X size={20} />
            </button>

            {/* En-tête Modal */}
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-brand-gold/10 text-brand-gold rounded-2xl border border-brand-gold/30">
                <Database size={24} />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-black italic uppercase text-brand-gold tracking-tight">
                  Centre Cloud Supabase
                </h3>
                <p className="text-[10px] text-white/50">
                  Synchronisation temps réel : Plats, Plat du Jour, Photo Admin & Paramètres
                </p>
              </div>
            </div>

            {/* Badge État de Connexion */}
            <div className={`p-4 rounded-2xl border mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
              cloudConfig.isValid 
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300' 
                : 'bg-amber-950/40 border-amber-500/40 text-amber-300'
            }`}>
              <div className="flex items-center gap-2.5">
                <span className={`w-3 h-3 rounded-full shrink-0 ${
                  cloudConfig.isValid ? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]' : 'bg-amber-400 animate-ping'
                }`} />
                <div>
                  <div className="text-xs font-black uppercase tracking-wider">
                    {cloudConfig.isValid ? 'Supabase Connecté & Prêt' : 'Supabase Non Configuré'}
                  </div>
                  <div className="text-[9px] text-white/50 font-mono truncate max-w-xs">
                    {cloudConfig.url || 'Aucune URL Supabase renseignée'}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[8px] font-black uppercase px-2.5 py-1 rounded-full bg-white/10 border border-white/15">
                  {cloudConfig.isCustom ? 'Clés Directes App' : 'Clés Environnement (.env)'}
                </span>
              </div>
            </div>

            {/* Onglets de Navigation */}
            <div className="flex bg-black/40 p-1.5 rounded-2xl border border-white/10 gap-1 mb-6 overflow-x-auto no-scrollbar">
              <button
                onClick={() => { playSound('pop'); setActiveCloudTab('sync'); }}
                className={`flex-1 min-w-[110px] py-2.5 px-3 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                  activeCloudTab === 'sync' ? 'bg-brand-orange text-white shadow-lg' : 'text-white/60 hover:text-white'
                }`}
              >
                <Zap size={12} /> Sync Totale
              </button>
              <button
                onClick={() => { playSound('pop'); setActiveCloudTab('credentials'); }}
                className={`flex-1 min-w-[110px] py-2.5 px-3 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                  activeCloudTab === 'credentials' ? 'bg-brand-orange text-white shadow-lg' : 'text-white/60 hover:text-white'
                }`}
              >
                <Settings size={12} /> Clés & Connexion
              </button>
              <button
                onClick={() => { playSound('pop'); setActiveCloudTab('sql'); }}
                className={`flex-1 min-w-[100px] py-2.5 px-3 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                  activeCloudTab === 'sql' ? 'bg-brand-orange text-white shadow-lg' : 'text-white/60 hover:text-white'
                }`}
              >
                <BookOpen size={12} /> Script SQL
              </button>
              <button
                onClick={() => { playSound('pop'); setActiveCloudTab('vercel'); }}
                className={`flex-1 min-w-[100px] py-2.5 px-3 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                  activeCloudTab === 'vercel' ? 'bg-brand-orange text-white shadow-lg' : 'text-white/60 hover:text-white'
                }`}
              >
                <Smartphone size={12} /> Guide PWA
              </button>
            </div>

            {/* TAB 1: SYNCHRONISATION TOTALE */}
            {activeCloudTab === 'sync' && (
              <div className="space-y-4 animate-fade-in">
                <div className="bg-white/5 p-5 rounded-2xl border border-white/10 space-y-3">
                  <h4 className="text-xs font-black italic uppercase text-brand-gold flex items-center gap-2">
                    <Sparkles size={14} /> Pousser l'ensemble des données vers le Cloud
                  </h4>
                  <p className="text-[11px] text-white/70 leading-relaxed">
                    Cliquez sur le bouton ci-dessous pour envoyer simultanément toutes les données actuelles vers Supabase. Tous vos clients et appareils installés (PWA) recevront ces données instantanément :
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] pt-1">
                    <div className="bg-black/30 p-2.5 rounded-xl border border-white/5 flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                      <span>{items.length} Plats & Spécialités</span>
                    </div>
                    <div className="bg-black/30 p-2.5 rounded-xl border border-white/5 flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                      <span>Plat du Jour : {platDuJour.dishName}</span>
                    </div>
                    <div className="bg-black/30 p-2.5 rounded-xl border border-white/5 flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                      <span>Photo Profil Admin ({adminAvatar ? 'Personnalisée' : 'Défaut'})</span>
                    </div>
                    <div className="bg-black/30 p-2.5 rounded-xl border border-white/5 flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                      <span>Bannières & Codes Promos</span>
                    </div>
                  </div>

                  <div className="pt-3">
                    <button
                      type="button"
                      disabled={isMasterSyncing}
                      onClick={handleExecuteMasterSync}
                      className={`w-full py-4 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl transition-all active:scale-95 ${
                        isMasterSyncing 
                          ? 'bg-brand-orange/50 text-white cursor-wait' 
                          : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/40'
                      }`}
                    >
                      {isMasterSyncing ? (
                        <>
                          <RefreshCw size={16} className="animate-spin" />
                          Synchronisation en cours vers Supabase...
                        </>
                      ) : (
                        <>
                          <Zap size={16} />
                          ⚡ Synchroniser Tout vers Supabase
                        </>
                      )}
                    </button>
                  </div>

                  {masterSyncResult && (
                    <div className="space-y-3 animate-fade-in">
                      <div className={`p-4 rounded-xl text-xs font-medium border ${
                        masterSyncResult.success 
                          ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-200' 
                          : 'bg-rose-950/60 border-rose-500/50 text-rose-200'
                      }`}>
                        <div className="font-bold flex items-center gap-2">
                          {masterSyncResult.success ? <CheckCircle2 size={16} className="text-emerald-400" /> : <AlertTriangle size={16} className="text-rose-400" />}
                          <span>{masterSyncResult.success ? 'Succès de la synchronisation !' : 'Erreur de synchronisation Cloud'}</span>
                        </div>
                        <p className="mt-2 text-[11px] leading-relaxed whitespace-pre-line opacity-95">{masterSyncResult.message}</p>
                      </div>

                      {!masterSyncResult.success && isSupabaseNetworkError(masterSyncResult.message) && (
                        <div className="p-4 rounded-xl bg-amber-950/60 border border-amber-500/50 text-amber-200 text-xs space-y-3">
                          <div className="font-bold flex items-center gap-2 text-amber-300">
                            <HelpCircle size={16} className="shrink-0" />
                            <span>Que signifie l'erreur "Load failed" ?</span>
                          </div>
                          <p className="text-[11px] leading-relaxed text-white/90">
                            Sur iPhone / Safari, le message <b>"TypeError: Load failed"</b> signifie que votre appareil ne parvient pas à joindre le serveur Supabase (adresse inaccessible ou projet éteint).
                          </p>
                          <div className="bg-black/40 p-3 rounded-lg border border-amber-500/30 text-[10px] space-y-2 text-white/85">
                            <p className="font-bold text-amber-400 uppercase tracking-wide">💡 Les étapes pour rétablir la connexion :</p>
                            <p><b>1. Réveiller le projet :</b> Sur l'offre gratuite de Supabase, tout projet inactif pendant 7 jours est automatiquement mis en <b>PAUSE</b>. Cliquez ci-dessous pour ouvrir Supabase et cliquer sur <b>"Restore project"</b> (1 min).</p>
                            <p><b>2. Nouveau projet :</b> Si vous avez recréé un projet avec une nouvelle adresse, collez sa nouvelle URL et sa clé anon dans l'onglet <b>"Clés & Connexion"</b>.</p>
                          </div>
                          <div className="flex flex-wrap gap-2 pt-1">
                            <a
                              href="https://supabase.com/dashboard"
                              target="_blank"
                              rel="noreferrer"
                              className="px-3.5 py-2 bg-brand-gold text-brand-brown rounded-lg font-black text-[10px] uppercase tracking-wider flex items-center gap-1.5 hover:bg-amber-400 transition-all shadow-md"
                            >
                              <ExternalLink size={13} /> Ouvrir Tableau de Bord Supabase
                            </a>
                            <button
                              type="button"
                              onClick={() => { playSound('pop'); setActiveCloudTab('credentials'); }}
                              className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-black text-[10px] uppercase tracking-wider flex items-center gap-1.5 transition-all border border-white/10"
                            >
                              <Settings size={13} /> Gérer les Clés Supabase
                            </button>
                          </div>
                          <p className="text-[10px] text-emerald-400 flex items-center gap-1.5 pt-1 font-medium">
                            <CheckCircle2 size={13} className="shrink-0 text-emerald-400" />
                            <span><b>Rassurez-vous :</b> Vos 35 plats, le Plat du Jour et vos commandes restent 100% enregistrés et fonctionnels sur cet appareil !</span>
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center bg-black/30 p-4 rounded-2xl border border-white/5">
                  <div className="text-[10px] text-white/60">
                    Besoin de récupérer les données déjà enregistrées sur le Cloud ?
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      playSound('pop');
                      const cloudMenu = await db.fetchMenu();
                      if (cloudMenu && cloudMenu.length > 0) {
                        setItems(prev => {
                          const map = new Map<string, MenuItem>();
                          prev.forEach(i => map.set(i.id, i));
                          cloudMenu.forEach(i => map.set(i.id, i));
                          const merged = Array.from(map.values());
                          saveMenuToIDB(merged);
                          try {
                            localStorage.setItem('khadys_menu_items', JSON.stringify(merged));
                          } catch (e) {}
                          return merged;
                        });
                        playSound('success');
                        alert(`✅ Plats Cloud synchronisés et fusionnés avec succès (${cloudMenu.length} plats vérifiés, aucun plat local écrasé) !`);
                      } else {
                        alert("⚠️ Aucun plat trouvé sur le Cloud Supabase ou serveur inaccessible.");
                      }
                    }}
                    className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-[9px] font-black uppercase flex items-center gap-1.5 border border-white/10"
                  >
                    <RefreshCw size={12} /> Recharger Plats Cloud
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: CLÉS & CONNEXION DIRECTE */}
            {activeCloudTab === 'credentials' && (
              <div className="space-y-4 animate-fade-in">
                
                {/* CARTE 1-CLIC : PROJET SUPABASE ACTIF KHADY'S FOOD */}
                <div className="bg-gradient-to-r from-brand-orange/20 via-brand-gold/15 to-transparent p-5 rounded-2xl border-2 border-brand-gold/50 space-y-3 shadow-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles size={18} className="text-brand-gold animate-pulse" />
                      <h4 className="text-xs font-black italic uppercase text-brand-gold">
                        Projet Supabase Officiel Khady's Food
                      </h4>
                    </div>
                    <span className="text-[8px] bg-brand-gold/20 text-brand-gold font-bold px-2 py-0.5 rounded-full border border-brand-gold/30">
                      Configuration Prédéfinie
                    </span>
                  </div>
                  <p className="text-[10px] text-white/70">
                    Plus besoin de copier-coller manuellement ! Cliquez ci-dessous pour injecter votre projet <code className="text-brand-gold font-mono font-bold">veygphkhehdnxefnnlwo</code> et tester sa disponibilité :
                  </p>
                  <button
                    type="button"
                    onClick={async () => {
                      playSound('pop');
                      setInputUrl(DEFAULT_SUPABASE_URL);
                      setInputKey(DEFAULT_SUPABASE_KEY);
                      setCustomSupabaseCredentials(DEFAULT_SUPABASE_URL, DEFAULT_SUPABASE_KEY);
                      setCloudConfig(getSupabaseConfig());
                      setIsTestingCloud(true);
                      setTestResult(null);
                      const res = await testSupabaseConnection(DEFAULT_SUPABASE_URL, DEFAULT_SUPABASE_KEY);
                      setIsTestingCloud(false);
                      setTestResult(res);
                      if (res.success) {
                        playSound('success');
                      } else {
                        playSound('error');
                      }
                    }}
                    className="w-full py-3.5 bg-gradient-to-r from-brand-gold to-amber-400 hover:from-amber-400 hover:to-brand-gold text-brand-brown rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl transition-all active:scale-95"
                  >
                    <Zap size={16} /> ⚡ Connecter & Valider le Projet Actif (veygphkhehdnxefnnlwo)
                  </button>
                </div>

                <div className="bg-white/5 p-5 rounded-2xl border border-white/10 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black italic uppercase text-brand-gold">
                      Configuration Manuelle des Clés
                    </h4>
                    <span className="text-[9px] text-white/40">Personnalisation libre</span>
                  </div>

                  {inputUrl.includes('ldlwtoktwubucmbsfurw') && (
                    <div className="p-3.5 rounded-xl bg-amber-950/60 border border-amber-500/50 text-amber-200 text-[10px] flex items-start gap-2.5">
                      <AlertTriangle size={16} className="text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <b>Ancien projet détecté :</b> L'adresse <code className="font-mono text-white">ldlwtoktwubucmbsfurw</code> est votre ancien projet supprimé.
                        <button
                          type="button"
                          onClick={() => {
                            setInputUrl(DEFAULT_SUPABASE_URL);
                            setInputKey(DEFAULT_SUPABASE_KEY);
                            setCustomSupabaseCredentials(DEFAULT_SUPABASE_URL, DEFAULT_SUPABASE_KEY);
                            setCloudConfig(getSupabaseConfig());
                            playSound('pop');
                          }}
                          className="block mt-1 font-black text-brand-gold underline uppercase text-[9px]"
                        >
                          → Cliquer ici pour basculer sur le nouveau projet veygphkhehdnxefnnlwo
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[9px] font-black uppercase text-white/40 tracking-wider">
                        URL du Projet Supabase (Project URL)
                      </label>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              const text = await navigator.clipboard.readText();
                              if (text) {
                                setInputUrl(text.trim());
                                playSound('pop');
                              }
                            } catch (e) {
                              const manual = window.prompt("Collez l'URL de votre projet Supabase ici :");
                              if (manual) {
                                setInputUrl(manual.trim());
                                playSound('pop');
                              }
                            }
                          }}
                          className="px-2 py-0.5 bg-brand-gold/20 hover:bg-brand-gold/30 text-brand-gold rounded text-[8px] font-black uppercase flex items-center gap-1 border border-brand-gold/30 transition-all"
                        >
                          📋 Coller
                        </button>
                        {inputUrl && (
                          <button
                            type="button"
                            onClick={() => { setInputUrl(''); playSound('pop'); }}
                            className="px-2 py-0.5 bg-white/10 hover:bg-rose-500/20 text-white/60 hover:text-rose-300 rounded text-[8px] font-black uppercase transition-all"
                          >
                            ✕ Effacer
                          </button>
                        )}
                      </div>
                    </div>
                    <input 
                      type="url"
                      value={inputUrl}
                      onChange={e => setInputUrl(e.target.value)}
                      placeholder="https://votre-projet.supabase.co"
                      className="w-full p-3.5 bg-black/40 border border-white/15 rounded-xl text-white text-xs font-mono focus:border-brand-gold outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[9px] font-black uppercase text-white/40 tracking-wider">
                        Clé Publique Anon (API Key / anon public)
                      </label>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              const text = await navigator.clipboard.readText();
                              if (text) {
                                const trimmed = text.trim();
                                setInputKey(trimmed);
                                const autoUrl = deriveSupabaseUrlFromKey(trimmed);
                                if (autoUrl) setInputUrl(autoUrl);
                                playSound('pop');
                              }
                            } catch (e) {
                              const manual = window.prompt("Collez la clé publique Anon Supabase ici :");
                              if (manual) {
                                const trimmed = manual.trim();
                                setInputKey(trimmed);
                                const autoUrl = deriveSupabaseUrlFromKey(trimmed);
                                if (autoUrl) setInputUrl(autoUrl);
                                playSound('pop');
                              }
                            }
                          }}
                          className="px-2 py-0.5 bg-brand-gold/20 hover:bg-brand-gold/30 text-brand-gold rounded text-[8px] font-black uppercase flex items-center gap-1 border border-brand-gold/30 transition-all"
                        >
                          📋 Coller
                        </button>
                        {inputKey && (
                          <button
                            type="button"
                            onClick={() => { setInputKey(''); playSound('pop'); }}
                            className="px-2 py-0.5 bg-white/10 hover:bg-rose-500/20 text-white/60 hover:text-rose-300 rounded text-[8px] font-black uppercase transition-all"
                          >
                            ✕ Effacer
                          </button>
                        )}
                      </div>
                    </div>
                    <textarea 
                      rows={2}
                      value={inputKey}
                      onChange={e => {
                        const val = e.target.value;
                        setInputKey(val);
                        const autoUrl = deriveSupabaseUrlFromKey(val);
                        if (autoUrl) setInputUrl(autoUrl);
                      }}
                      placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                      className="w-full p-3.5 bg-black/40 border border-white/15 rounded-xl text-white text-xs font-mono focus:border-brand-gold outline-none resize-none"
                    />
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2">
                    <button
                      type="button"
                      disabled={isTestingCloud || !inputUrl || !inputKey}
                      onClick={async () => {
                        setIsTestingCloud(true);
                        setTestResult(null);
                        playSound('pop');
                        const res = await testSupabaseConnection(inputUrl, inputKey);
                        setIsTestingCloud(false);
                        setTestResult(res);
                        if (res.success) playSound('success');
                        else playSound('error');
                      }}
                      className="flex-1 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 border border-white/15 transition-all"
                    >
                      {isTestingCloud ? (
                        <>
                          <RefreshCw size={14} className="animate-spin" />
                          Test en cours...
                        </>
                      ) : (
                        <>
                          <Zap size={14} /> Tester la Connexion
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      disabled={!inputUrl || !inputKey}
                      onClick={() => {
                        setCustomSupabaseCredentials(inputUrl.trim(), inputKey.trim());
                        setCloudConfig(getSupabaseConfig());
                        playSound('success');
                        alert("✅ Clés Supabase enregistrées avec succès ! L'application est maintenant connectée à votre base Supabase.");
                      }}
                      className="flex-1 py-3 bg-brand-gold hover:bg-amber-400 text-brand-brown rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg transition-all active:scale-95"
                    >
                      <Save size={14} /> Enregistrer ces Clés
                    </button>
                  </div>

                  {cloudConfig.isCustom && (
                    <div className="pt-1 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          setCustomSupabaseCredentials('', '');
                          setCloudConfig(getSupabaseConfig());
                          setInputUrl(getSupabaseConfig().url);
                          setInputKey(getSupabaseConfig().key);
                          playSound('pop');
                        }}
                        className="text-[9px] text-rose-400/80 hover:text-rose-300 underline font-semibold"
                      >
                        Effacer les clés manuelles et réutiliser les variables .env
                      </button>
                    </div>
                  )}

                  {testResult && (
                    <div className="space-y-3 animate-fade-in">
                      <div className={`p-4 rounded-xl text-xs border ${
                        testResult.success 
                          ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-200' 
                          : 'bg-rose-950/60 border-rose-500/50 text-rose-200'
                      }`}>
                        <div className="font-bold flex items-center gap-2">
                          {testResult.success ? <CheckCircle2 size={16} className="text-emerald-400" /> : <AlertTriangle size={16} className="text-rose-400" />}
                          <span>{testResult.success ? 'Connexion réussie !' : 'Échec de connexion Supabase'}</span>
                        </div>
                        <p className="mt-2 text-[11px] leading-relaxed whitespace-pre-line">{testResult.message}</p>
                      </div>

                      {!testResult.success && isSupabaseNetworkError(testResult.message) && (
                        <div className="p-4 rounded-xl bg-amber-950/60 border border-amber-500/50 text-amber-200 text-xs space-y-3">
                          <div className="font-bold flex items-center gap-2 text-amber-300">
                            <HelpCircle size={16} className="shrink-0" />
                            <span>Que signifie "Load failed" ?</span>
                          </div>
                          <p className="text-[11px] leading-relaxed text-white/90">
                            Sur iPhone (Safari), <b>"Load failed"</b> apparaît quand l'adresse du serveur Supabase ne répond pas ou est introuvable sur Internet.
                          </p>
                          <div className="bg-black/40 p-3 rounded-lg border border-amber-500/30 text-[10px] space-y-1.5 text-white/80">
                            <p className="font-bold text-amber-400 uppercase tracking-wide">💡 Comment débloquer en 1 minute :</p>
                            <p><b>1.</b> Connectez-vous sur votre compte : <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" className="text-brand-gold underline font-bold">supabase.com/dashboard</a></p>
                            <p><b>2.</b> Si le statut indique <b>"Paused" (En veille)</b>, cliquez sur le bouton vert <b>"Restore project"</b>.</p>
                            <p><b>3.</b> Si vous avez créé un nouveau projet, copiez sa nouvelle <b>Project URL</b> et sa clé <b>anon public</b> (depuis Project Settings &gt; API) et collez-les dans les champs ci-dessus.</p>
                          </div>
                          <div className="flex flex-wrap gap-2 pt-1">
                            <a
                              href="https://supabase.com/dashboard"
                              target="_blank"
                              rel="noreferrer"
                              className="px-3.5 py-2 bg-brand-gold text-brand-brown rounded-lg font-black text-[10px] uppercase tracking-wider flex items-center gap-1.5 hover:bg-amber-400 transition-all shadow-md"
                            >
                              <ExternalLink size={13} /> Ouvrir Dashboard Supabase (Réactiver)
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: SCRIPT SQL SUPABASE */}
            {activeCloudTab === 'sql' && (
              <div className="space-y-4 animate-fade-in">
                <div className="bg-white/5 p-5 rounded-2xl border border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black italic uppercase text-brand-gold">
                      Script SQL d'initialisation (Tables & RLS)
                    </h4>
                    <button
                      type="button"
                      onClick={() => {
                        const sql = `-- KHADY'S FOOD - SCRIPT SQL OFFICIEL SUPABASE
CREATE TABLE IF NOT EXISTS menu_items (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC NOT NULL,
    image TEXT,
    category TEXT NOT NULL,
    rating NUMERIC DEFAULT 5,
    is_available BOOLEAN DEFAULT true,
    is_spicy BOOLEAN DEFAULT false,
    is_specialite_maison BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    customer_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    items JSONB NOT NULL,
    total NUMERIC NOT NULL,
    delivery_fee NUMERIC NOT NULL DEFAULT 0,
    status TEXT DEFAULT 'RECEIVED',
    payment_method TEXT NOT NULL,
    district TEXT,
    address TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Full Access menu_items" ON menu_items;
CREATE POLICY "Public Full Access menu_items" ON menu_items FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public Full Access orders" ON orders;
CREATE POLICY "Public Full Access orders" ON orders FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public Full Access app_settings" ON app_settings;
CREATE POLICY "Public Full Access app_settings" ON app_settings FOR ALL USING (true) WITH CHECK (true);

BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime FOR TABLE menu_items, orders, app_settings;
COMMIT;`;
                        navigator.clipboard.writeText(sql);
                        setSqlCopied(true);
                        playSound('success');
                        setTimeout(() => setSqlCopied(false), 3000);
                      }}
                      className="px-3 py-1.5 bg-brand-gold hover:bg-amber-400 text-brand-brown rounded-xl text-[9px] font-black uppercase flex items-center gap-1.5 transition-all shadow-md"
                    >
                      {sqlCopied ? <CheckCircle2 size={12} /> : <Save size={12} />}
                      {sqlCopied ? 'Copié !' : 'Copier le Script SQL'}
                    </button>
                  </div>

                  <p className="text-[10px] text-white/60">
                    Étapes : 1. Ouvrez votre console Supabase → 2. Allez dans <b>SQL Editor</b> → 3. Collez ce script et cliquez sur <b>RUN</b>.
                  </p>

                  <div className="bg-black/60 p-4 rounded-xl border border-white/10 font-mono text-[10px] text-emerald-400/90 max-h-48 overflow-y-auto no-scrollbar">
                    <pre className="whitespace-pre-wrap">{`-- KHADY'S FOOD - TABLES & PERMISSIONS
CREATE TABLE IF NOT EXISTS menu_items (id TEXT PRIMARY KEY, name TEXT NOT NULL, price NUMERIC, ...);
CREATE TABLE IF NOT EXISTS orders (id TEXT PRIMARY KEY, customer_name TEXT, total NUMERIC, ...);
CREATE TABLE IF NOT EXISTS app_settings (key TEXT PRIMARY KEY, value JSONB NOT NULL, updated_at TIMESTAMP);

-- Activer les permissions publiques et Realtime
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
-- Politiques & publication temps réel configurées !`}</pre>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: GUIDE VERCEL & PWA */}
            {activeCloudTab === 'vercel' && (
              <div className="space-y-4 animate-fade-in text-[11px] text-white/80">
                <div className="bg-white/5 p-5 rounded-2xl border border-white/10 space-y-3">
                  <h4 className="text-xs font-black italic uppercase text-brand-gold">
                    Pourquoi une application déjà installée ou Vercel ne voyait pas les clés ?
                  </h4>
                  <ul className="space-y-2.5 text-white/70">
                    <li className="flex items-start gap-2">
                      <span className="text-brand-orange font-black">1.</span>
                      <span><b>Vercel compile les variables au moment du build :</b> Si vous ajoutez des variables dans Vercel, elles ne prennent effet qu'après un <b>Redeploy sans cache</b> dans Vercel.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-brand-orange font-black">2.</span>
                      <span><b>PWA & Téléphone autonome :</b> Grâce à notre nouveau panneau <b>Clés & Connexion</b>, vous pouvez coller directement l'URL et la clé Supabase sur n'importe quel téléphone installé : l'application sera connectée sans avoir à redéployer !</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-brand-orange font-black">3.</span>
                      <span><b>Synchronisation Totale :</b> Une fois connecté, appuyez sur <b>⚡ Synchroniser Tout vers Supabase</b>. Les plats, le plat du jour et la photo admin seront visibles instantanément sur tous les écrans.</span>
                    </li>
                  </ul>
                </div>
              </div>
            )}

            {/* Bouton Fermer Bas */}
            <div className="pt-4 border-t border-white/10 flex justify-end">
              <button
                type="button"
                onClick={() => { playSound('pop'); setShowCloudModal(false); }}
                className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl text-[10px] font-black uppercase tracking-wider"
              >
                Fermer
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* NOTIFICATION TOAST : FEEDBACK VISUEL INSTANTANÉ SUR RACCOURCI             */}
      {/* ========================================================================= */}
      {activeShortcutToast && (
        <div className="fixed top-6 right-6 z-[160] animate-fade-in flex items-center gap-3.5 bg-[#1A0C0A]/95 border-2 border-brand-gold/60 text-white px-5 py-3.5 rounded-2xl shadow-[0_15px_35px_rgba(0,0,0,0.8)] backdrop-blur-xl pointer-events-none">
          <div className="p-2.5 bg-brand-gold/20 text-brand-gold rounded-xl border border-brand-gold/40 shrink-0">
            <Zap size={18} className="animate-pulse text-brand-gold" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-black uppercase tracking-wider text-brand-gold">Raccourci Clavier</span>
              <span className="bg-black/70 text-[8px] font-mono text-white/80 px-2 py-0.5 rounded border border-white/15">
                {activeShortcutToast.subtitle}
              </span>
            </div>
            <div className="text-xs font-black italic uppercase text-white tracking-wide mt-0.5">
              {activeShortcutToast.title}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL GUIDE DES RACCOURCIS CLAVIER ADMIN                                  */}
      {/* ========================================================================= */}
      {showShortcutsModal && (
        <div className="fixed inset-0 z-[150] bg-black/90 backdrop-blur-xl flex items-center justify-center p-3 sm:p-6 animate-fade-in">
          <div className="bg-[#1C0F0D] border-2 border-brand-gold/40 w-full max-w-3xl rounded-3xl sm:rounded-[2.5rem] shadow-2xl p-4 sm:p-8 relative max-h-[92vh] sm:max-h-[90vh] overflow-y-auto no-scrollbar text-white">
            
            {/* Bouton Fermer */}
            <button 
              onClick={() => { playSound('pop'); setShowShortcutsModal(false); }}
              className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2 rounded-xl bg-white/5 hover:bg-white/15 text-white/60 hover:text-white transition-all min-h-[38px] min-w-[38px] flex items-center justify-center"
              title="Fermer (Échap)"
            >
              <X size={20} />
            </button>

            {/* En-tête Guide */}
            <div className="flex items-center gap-3.5 mb-6">
              <div className="p-3 bg-brand-gold/15 text-brand-gold rounded-2xl border border-brand-gold/30 shadow-lg">
                <Keyboard size={24} />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-black italic uppercase text-brand-gold tracking-tight flex items-center gap-2">
                  <span>Raccourcis Clavier Admin</span>
                  <span className="text-[9px] font-mono bg-brand-gold/20 text-brand-gold px-2.5 py-0.5 rounded-full border border-brand-gold/30 font-normal">
                    Ctrl + Shift + Touche
                  </span>
                </h3>
                <p className="text-[10px] text-white/50">
                  Naviguez instantanément entre tous les modules et données sans toucher à la souris.
                </p>
              </div>
            </div>

            {/* Grilles de Raccourcis */}
            <div className="space-y-6">
              {/* Section 1 : Navigation & Gestion des Données */}
              <div>
                <h4 className="text-[10px] font-black uppercase text-brand-gold/80 tracking-widest mb-3 flex items-center gap-1.5">
                  <Utensils size={13} className="text-brand-orange" /> Données, Menu & Commandes
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {[
                    { key: 'Ctrl + Shift + A', alt: 'Ctrl + Shift + D', label: 'Tableau de Bord / Accueil', desc: 'Vue globale, KPIs et métriques live', view: AdminView.DASHBOARD },
                    { key: 'Ctrl + Shift + P', label: 'Plat du Jour', desc: 'Affiche interactive, promotion et timing', view: AdminView.PLAT_DU_JOUR },
                    { key: 'Ctrl + Shift + M', alt: 'Ctrl + Shift + C', label: 'Carte & Plats', desc: 'Gestion du catalogue des plats et prix', view: AdminView.MENU_MGMT },
                    { key: 'Ctrl + Shift + O', label: 'Commandes (Orders)', desc: 'Suivi live, validation et statuts', view: AdminView.ORDERS },
                    { key: 'Ctrl + Shift + B', label: 'Blog & Recettes', desc: 'Édition des articles culinaires', view: AdminView.BLOG_MGMT },
                    { key: 'Ctrl + Shift + F', label: 'FAQ & Assistance', desc: 'Foire aux questions des clients', view: AdminView.FAQ_MGMT },
                  ].map((s, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        playSound('pop');
                        setCurrentView(s.view);
                        setShowShortcutsModal(false);
                        triggerShortcutFeedback(s.label, s.key);
                      }}
                      className="text-left p-3.5 bg-white/5 hover:bg-brand-orange/15 rounded-2xl border border-white/10 hover:border-brand-orange/40 transition-all group flex items-start justify-between gap-3 active:scale-95"
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-black text-white group-hover:text-brand-gold uppercase tracking-wide">
                          {s.label}
                        </div>
                        <div className="text-[9px] text-white/40 truncate">
                          {s.desc}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <kbd className="px-2 py-1 bg-black/80 text-brand-gold border border-brand-gold/30 rounded-lg text-[9px] font-mono font-bold shadow">
                          {s.key}
                        </kbd>
                        {s.alt && (
                          <span className="text-[7px] text-white/40 font-mono">ou {s.alt}</span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Section 2 : Logistique, Clients & Marketing */}
              <div>
                <h4 className="text-[10px] font-black uppercase text-brand-gold/80 tracking-widest mb-3 flex items-center gap-1.5">
                  <Bike size={13} className="text-emerald-400" /> Logistique, Fidélité & Marketing
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {[
                    { key: 'Ctrl + Shift + L', label: 'Livreurs & Logistique', desc: 'Flotte de coursiers et zones Niamey', view: AdminView.DELIVERY },
                    { key: 'Ctrl + Shift + U', label: 'Clients & Fidélité', desc: 'Historique commandes et points', view: AdminView.CLIENTS },
                    { key: 'Ctrl + Shift + K', label: 'Marketing IA & Bannières', desc: 'Génération de campagnes et promos', view: AdminView.AI_MARKETING },
                    { key: 'Ctrl + Shift + E', label: 'Événements & Traiteur', desc: 'Réservations et réceptions', view: AdminView.EVENT },
                    { key: 'Ctrl + Shift + T', label: 'Buffets & Packs', desc: 'Offres grand format et cérémonies', view: AdminView.BUFFET },
                    { key: 'Ctrl + Shift + S', label: 'Paramètres Généraux', desc: 'Horaires, devises et contact', view: AdminView.SETTINGS },
                  ].map((s, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        playSound('pop');
                        setCurrentView(s.view);
                        setShowShortcutsModal(false);
                        triggerShortcutFeedback(s.label, s.key);
                      }}
                      className="text-left p-3.5 bg-white/5 hover:bg-brand-orange/15 rounded-2xl border border-white/10 hover:border-brand-orange/40 transition-all group flex items-start justify-between gap-3 active:scale-95"
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-black text-white group-hover:text-brand-gold uppercase tracking-wide">
                          {s.label}
                        </div>
                        <div className="text-[9px] text-white/40 truncate">
                          {s.desc}
                        </div>
                      </div>
                      <kbd className="px-2 py-1 bg-black/80 text-emerald-300 border border-emerald-500/30 rounded-lg text-[9px] font-mono font-bold shadow shrink-0">
                        {s.key}
                      </kbd>
                    </button>
                  ))}
                </div>
              </div>

              {/* Section 3 : Outils Système & Modals */}
              <div>
                <h4 className="text-[10px] font-black uppercase text-brand-gold/80 tracking-widest mb-3 flex items-center gap-1.5">
                  <Zap size={13} className="text-brand-gold" /> Outils Système & Contrôle Rapide
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      playSound('pop');
                      setShowShortcutsModal(false);
                      setShowCloudModal(true);
                      triggerShortcutFeedback('Centre Cloud Supabase', 'Ctrl + Shift + Z');
                    }}
                    className="text-left p-3.5 bg-white/5 hover:bg-emerald-950/40 rounded-2xl border border-white/10 hover:border-emerald-500/40 transition-all group flex items-start justify-between gap-3 active:scale-95"
                  >
                    <div>
                      <div className="text-xs font-black text-white group-hover:text-emerald-300 uppercase tracking-wide">
                        Centre Cloud Supabase
                      </div>
                      <div className="text-[9px] text-white/40">
                        Synchroniser tout le cloud & vérifier la connexion
                      </div>
                    </div>
                    <kbd className="px-2 py-1 bg-black/80 text-emerald-400 border border-emerald-500/30 rounded-lg text-[9px] font-mono font-bold shadow shrink-0">
                      Ctrl + Shift + Z
                    </kbd>
                  </button>

                  <div className="p-3.5 bg-white/5 rounded-2xl border border-white/10 flex items-start justify-between gap-3">
                    <div>
                      <div className="text-xs font-black text-white uppercase tracking-wide">
                        Aide Raccourcis Clavier
                      </div>
                      <div className="text-[9px] text-white/40">
                        Ouvrir ce guide d'aide n'importe quand
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <kbd className="px-2 py-1 bg-black/80 text-brand-gold border border-brand-gold/30 rounded-lg text-[9px] font-mono font-bold shadow">
                        Ctrl + Shift + H
                      </kbd>
                      <span className="text-[7px] text-white/40 font-mono">ou touche '?'</span>
                    </div>
                  </div>

                  <div className="p-3.5 bg-white/5 rounded-2xl border border-white/10 flex items-start justify-between gap-3">
                    <div>
                      <div className="text-xs font-black text-rose-300 uppercase tracking-wide">
                        Quitter Admin
                      </div>
                      <div className="text-[9px] text-white/40">
                        Retourner à l'interface client de l'application
                      </div>
                    </div>
                    <kbd className="px-2 py-1 bg-black/80 text-rose-400 border border-rose-500/30 rounded-lg text-[9px] font-mono font-bold shadow shrink-0">
                      Ctrl + Shift + Q
                    </kbd>
                  </div>

                  <div className="p-3.5 bg-white/5 rounded-2xl border border-white/10 flex items-start justify-between gap-3">
                    <div>
                      <div className="text-xs font-black text-white/80 uppercase tracking-wide">
                        Fermer Modale / Annuler
                      </div>
                      <div className="text-[9px] text-white/40">
                        Ferme la modale ouverte ou annule la saisie
                      </div>
                    </div>
                    <kbd className="px-2 py-1 bg-black/80 text-white/70 border border-white/20 rounded-lg text-[9px] font-mono font-bold shadow shrink-0">
                      Échap (Esc)
                    </kbd>
                  </div>
                </div>
              </div>

              {/* Note Mac / Windows */}
              <div className="p-4 bg-brand-gold/10 rounded-2xl border border-brand-gold/20 flex items-center gap-3 text-[10px] text-brand-gold/90">
                <Command size={18} className="shrink-0 text-brand-gold" />
                <span>
                  <b>Conseil Mac & Windows :</b> Sur Mac, utilisez <code className="bg-black/40 px-1.5 py-0.5 rounded font-mono">Cmd (⌘) + Shift + [Touche]</code>. Sur Windows/Linux, utilisez <code className="bg-black/40 px-1.5 py-0.5 rounded font-mono">Ctrl + Shift + [Touche]</code>.
                </span>
              </div>
            </div>

            {/* Bouton Fermer Bas */}
            <div className="pt-6 mt-6 border-t border-white/10 flex justify-end">
              <button
                type="button"
                onClick={() => { playSound('pop'); setShowShortcutsModal(false); }}
                className="px-6 py-3 bg-brand-gold hover:bg-amber-400 text-brand-brown rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shadow-lg active:scale-95"
              >
                Compris !
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
