import React, { useState, useRef } from "react";
import {
  LayoutDashboard,
  ShoppingBag,
  Utensils,
  X,
  TrendingUp,
  Star,
  Settings,
  Bike,
  Sparkles,
  Zap,
  Plus,
  Trash2,
  Edit3,
  Power,
  RefreshCw,
  Users,
  Package,
  Calendar,
  Smartphone,
  CheckCircle2,
  ChefHat,
  PackageCheck,
  Bell,
  Camera,
  MapPin,
  Clock,
  Heart,
  Sliders,
  DollarSign,
  MessageCircle,
  AlertCircle,
  UserRound,
  Save,
  ToggleLeft as Toggle,
  Image as ImageIcon,
  Bot,
  PhoneOff,
  BookOpen,
  Phone,
  Search,
} from "lucide-react";
import {
  MenuItem,
  AdminView,
  Order,
  Review,
  MenuCategory,
  OrderStatus,
  BlogPost,
  GalleryItem,
  ClientUser,
} from "../types";
import { KhadyLogo } from "./KhadyLogo";
import { playSound } from "../utils/audio";
import { sendOrderNotification } from "../utils/notifications";
import { GoogleGenAI } from "@google/genai";
import {
  DISTRICTS,
  BILLO_INFO,
  INITIAL_BLOG_POSTS,
  INITIAL_GALLERY_ITEMS,
  INITIAL_CLIENTS,
  MENU_ITEMS,
} from "../constants";
import { WhatsAppAutomationView } from "./WhatsAppAutomationView";
import { BlogMgmtView } from "./BlogMgmtView";
import { GalleryMgmtView } from "./GalleryMgmtView";
import { ClientsMgmtView } from "./ClientsMgmtView";
import { AIPromoGenerator } from "./AIPromoGenerator";
import { compressImage } from "../utils/image";
import { persistentStorage } from "../utils/storage";
import {
  db,
  isSupabaseConfigured,
  getIsSupabaseConfigured,
  getSupabaseConfig,
  saveSupabaseConfig,
  saveAutoSyncSetting,
  clearSupabaseConfig,
  testSupabaseConnection,
  pushAllMenuItemsToSupabase,
  deriveSupabaseUrlFromKey,
  sanitizeSupabaseUrl,
  sanitizeSupabaseKey,
  validateSupabaseKeyFormat,
  KHADY_STANDALONE_MODE_KEY,
} from "../lib/supabase";
import { SUPABASE_SQL_SCHEMA } from "../utils/supabaseSchema";
import {
  Download,
  Upload,
  ShieldCheck,
  Database,
  FileCheck,
  Cloud,
  UploadCloud as CloudUpload,
  Key,
  Check,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  CheckCircle,
} from "lucide-react";

interface AdminDashboardProps {
  items: MenuItem[];
  setItems: React.Dispatch<React.SetStateAction<MenuItem[]>>;
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  reviews: Review[];
  setReviews: React.Dispatch<React.SetStateAction<Review[]>>;
  posts?: BlogPost[];
  setPosts?: React.Dispatch<React.SetStateAction<BlogPost[]>>;
  galleryItems?: GalleryItem[];
  setGalleryItems?: React.Dispatch<React.SetStateAction<GalleryItem[]>>;
  clients?: ClientUser[];
  setClients?: React.Dispatch<React.SetStateAction<ClientUser[]>>;
  onExit: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({
  items,
  setItems,
  onExit,
  setOrders,
  orders,
  reviews,
  setReviews,
  posts: propPosts,
  setPosts: propSetPosts,
  galleryItems: propGallery,
  setGalleryItems: propSetGallery,
  clients: propClients,
  setClients: propSetClients,
}) => {
  const [localPosts, setLocalPosts] = useState<BlogPost[]>(INITIAL_BLOG_POSTS);
  const [localGallery, setLocalGallery] = useState<GalleryItem[]>(
    INITIAL_GALLERY_ITEMS,
  );
  const [localClients, setLocalClients] =
    useState<ClientUser[]>(INITIAL_CLIENTS);

  const posts = propPosts || localPosts;
  const setPosts = propSetPosts || setLocalPosts;
  const galleryItems = propGallery || localGallery;
  const setGalleryItems = propSetGallery || setLocalGallery;
  const clients = propClients || localClients;
  const setClients = propSetClients || setLocalClients;

  const [currentView, setCurrentView] = useState<AdminView>(
    AdminView.DASHBOARD,
  );
  const [editingItem, setEditingItem] = useState<Partial<MenuItem> | null>(
    null,
  );
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiStrategy, setAiStrategy] = useState("");
  const [isRestaurantOpen, setIsRestaurantOpen] = useState(true);
  const [menuFilterCategory, setMenuFilterCategory] = useState<string>("TOUT");
  const [menuSearchQuery, setMenuSearchQuery] = useState<string>("");
  const adminPhotoInputRef = useRef<HTMLInputElement>(null);
  const dishPhotoInputRef = useRef<HTMLInputElement>(null);
  const [adminAvatar, setAdminAvatar] = useState(
    () => localStorage.getItem("khadys_admin_avatar") || "",
  );

  const handleAdminPhotoChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImage(file, 400, 400, 0.8);
        setAdminAvatar(compressed);
        localStorage.setItem("khadys_admin_avatar", compressed);
        playSound("success");
      } catch {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result as string;
          setAdminAvatar(base64String);
          localStorage.setItem("khadys_admin_avatar", base64String);
          playSound("success");
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleDishPhotoChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (file && editingItem) {
      try {
        const compressed = await compressImage(file, 600, 600, 0.75);
        setEditingItem((prev) =>
          prev ? { ...prev, image: compressed } : null,
        );
        playSound("pop");
      } catch {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result as string;
          setEditingItem((prev) =>
            prev ? { ...prev, image: base64String } : null,
          );
          playSound("pop");
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const backupFileInputRef = useRef<HTMLInputElement>(null);
  const [backupStatusMessage, setBackupStatusMessage] = useState<string | null>(null);

  const handleExportBackup = async () => {
    try {
      await persistentStorage.downloadBackupFile();
      setBackupStatusMessage("Sauvegarde exportée et téléchargée avec succès !");
      playSound("success");
      setTimeout(() => setBackupStatusMessage(null), 4000);
    } catch (err) {
      alert("Erreur lors de l'export de la sauvegarde.");
    }
  };

  const handleImportBackupFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const json = JSON.parse(event.target?.result as string);
          await persistentStorage.restoreBackupData(json);
          if (Array.isArray(json.menuItems) && json.menuItems.length > 0) {
            setItems(json.menuItems);
          }
          if (Array.isArray(json.orders)) setOrders(json.orders);
          if (Array.isArray(json.blogPosts)) setPosts(json.blogPosts);
          if (Array.isArray(json.galleryItems)) setGalleryItems(json.galleryItems);
          if (Array.isArray(json.clients)) setClients(json.clients);
          
          playSound("success");
          setBackupStatusMessage(`Restauration réussie ! ${json.menuItems?.length || 0} plats restaurés.`);
          setTimeout(() => setBackupStatusMessage(null), 5000);
        } catch (parseErr) {
          alert("Fichier JSON de sauvegarde invalide ou corrompu.");
        }
      };
      reader.readAsText(file);
    } catch (e) {
      alert("Erreur lors de la lecture du fichier.");
    }
  };

  const handleRestoreSnapshot = async () => {
    try {
      const snapshot = await persistentStorage.getLatestMenuSnapshot();
      if (snapshot && Array.isArray(snapshot) && snapshot.length > 0) {
        if (confirm(`Restaurer le dernier snapshot de sécurité (${snapshot.length} plats) ?`)) {
          setItems(snapshot);
          await persistentStorage.setItem('khadys_menu_items', snapshot);
          playSound("success");
          setBackupStatusMessage(`${snapshot.length} plats restaurés depuis le snapshot de sécurité.`);
          setTimeout(() => setBackupStatusMessage(null), 4000);
        }
      } else {
        alert("Aucun snapshot de sécurité automatique antérieur n'a été trouvé.");
      }
    } catch {
      alert("Erreur lors de la restauration du snapshot.");
    }
  };

  const handleResetFactoryMenu = () => {
    if (confirm("Attention : Voulez-vous réinitialiser le menu aux 10 plats d'origine de Khady's Food ? Pensez à télécharger une sauvegarde avant.")) {
      setItems(MENU_ITEMS);
      persistentStorage.setItem('khadys_menu_items', MENU_ITEMS);
      playSound("pop");
      setBackupStatusMessage("Menu réinitialisé aux plats d'origine.");
      setTimeout(() => setBackupStatusMessage(null), 4000);
    }
  };

  const isItemPlatDuJour = (item: MenuItem): boolean => {
    return Boolean(
      item.isPlatDuJour ||
      item.category === "Plat du Jour" ||
      item.category === "Menu du Jour"
    );
  };

  const handleTogglePlatDuJour = async (e: React.MouseEvent, itemId: string) => {
    e.stopPropagation();
    const target = items.find((i) => i.id === itemId);
    if (!target) return;

    const currentlyJour = isItemPlatDuJour(target);
    const nextVal = !currentlyJour;

    const updatedItems = items.map((i) => {
      if (i.id === itemId) {
        return {
          ...i,
          isPlatDuJour: nextVal,
        };
      }
      return i;
    });

    setItems(updatedItems);
    await persistentStorage.setItem("khadys_menu_items", updatedItems);

    if (supabaseAutoSync && (isSupabaseConfigured || getIsSupabaseConfigured())) {
      try {
        const updatedTarget = updatedItems.find((i) => i.id === itemId);
        if (updatedTarget) await db.saveMenuItem(updatedTarget);
      } catch (err) {
        console.warn("Synchro Supabase Plat du Jour:", err);
      }
    }

    playSound(nextVal ? "success" : "pop");
    setBackupStatusMessage(
      nextVal
        ? `⭐ "${target.name}" est désormais configuré comme PLAT DU JOUR !`
        : `"${target.name}" retiré des Plats du Jour.`
    );
    setTimeout(() => setBackupStatusMessage(null), 3500);
  };

  // --- ÉTAT SUPABASE & SYNCHRONISATION CLOUD ---
  const [supabaseConfigState, setSupabaseConfigState] = useState(() => getSupabaseConfig());
  const [supabaseUrlInput, setSupabaseUrlInput] = useState(() => getSupabaseConfig().url);
  const [supabaseKeyInput, setSupabaseKeyInput] = useState(() => getSupabaseConfig().anonKey);
  const [supabaseAutoSync, setSupabaseAutoSync] = useState(() => getSupabaseConfig().autoSync);
  const [showSupabaseKey, setShowSupabaseKey] = useState(true);
  const [isStandaloneMode, setIsStandaloneMode] = useState(() => {
    try {
      return localStorage.getItem(KHADY_STANDALONE_MODE_KEY) === "true";
    } catch {
      return false;
    }
  });
  const [isTestingSupabase, setIsTestingSupabase] = useState(false);
  const [supabaseTestReport, setSupabaseTestReport] = useState<{
    success: boolean;
    latencyMs?: number;
    message: string;
    details?: any;
  } | null>(null);
  const [isPushingMenuToSupabase, setIsPushingMenuToSupabase] = useState(false);
  const [pushMenuSummary, setPushMenuSummary] = useState<{
    success: boolean;
    localSaved?: boolean;
    missingTables?: boolean;
    authError?: boolean;
    count: number;
    total: number;
    message: string;
  } | null>(null);
  const [showSqlSchemaModal, setShowSqlSchemaModal] = useState(false);
  const [showSupabaseSettingsModal, setShowSupabaseSettingsModal] = useState(false);
  const [hasCopiedSql, setHasCopiedSql] = useState(false);
  const [modalPushToSupabase, setModalPushToSupabase] = useState(true);

  const isCloudConnected = Boolean(
    supabaseConfigState.isConfigured || getIsSupabaseConfigured()
  );

  const derivedJwtUrl = deriveSupabaseUrlFromKey(supabaseKeyInput);
  const keyValidation = validateSupabaseKeyFormat(supabaseKeyInput, supabaseUrlInput);

  const handleSupabaseKeyChange = (val: string) => {
    // Si l'utilisateur colle un bloc .env complet contenant aussi l'URL
    const envUrlMatch = val.match(/https?:\/\/([a-z0-9-]{12,32})\.supabase\.(?:co|com|in|io)/i);
    if (envUrlMatch?.[1]) {
      setSupabaseUrlInput(`https://${envUrlMatch[1].toLowerCase()}.supabase.co`);
    }

    const cleanKey = sanitizeSupabaseKey(val);
    setSupabaseKeyInput(cleanKey);

    const validation = validateSupabaseKeyFormat(cleanKey);
    if (validation.derivedUrl) {
      setSupabaseUrlInput(validation.derivedUrl);
    } else {
      const autoUrl = deriveSupabaseUrlFromKey(cleanKey);
      if (autoUrl) {
        setSupabaseUrlInput(autoUrl);
      }
    }
  };

  const handleSupabaseUrlChange = (val: string) => {
    // Si l'utilisateur colle par erreur sa clé eyJ... ou sb_publishable_... dans le champ URL
    const possibleKey = sanitizeSupabaseKey(val);
    const possibleValidation = validateSupabaseKeyFormat(possibleKey);
    if (possibleValidation.isValidFormat) {
      setSupabaseKeyInput(possibleKey);
      if (possibleValidation.derivedUrl) {
        setSupabaseUrlInput(possibleValidation.derivedUrl);
        return;
      }
    }
    setSupabaseUrlInput(val.trim());
  };

  const handleEnableStandaloneMode = async () => {
    try {
      await persistentStorage.setItem("khadys_menu_items", items);
      localStorage.setItem("khadys_menu_items", JSON.stringify(items));
      localStorage.setItem(KHADY_STANDALONE_MODE_KEY, "true");
    } catch {
      // Ignorer
    }
    setIsStandaloneMode(true);
    setShowSupabaseSettingsModal(false);
    playSound("success");
    setBackupStatusMessage(`✅ Mode Autonome activé : Vos ${items.length} plats sont sauvegardés et synchronisés sur votre appareil !`);
    setTimeout(() => setBackupStatusMessage(null), 5000);
  };

  const handleTestSupabaseConnection = async () => {
    setIsTestingSupabase(true);
    setSupabaseTestReport(null);
    setPushMenuSummary(null);
    try {
      const cleanKey = sanitizeSupabaseKey(supabaseKeyInput);
      const effectiveUrl = sanitizeSupabaseUrl(supabaseUrlInput, cleanKey);
      if (effectiveUrl && effectiveUrl !== supabaseUrlInput) {
        setSupabaseUrlInput(effectiveUrl);
      }
      if (cleanKey && cleanKey !== supabaseKeyInput) {
        setSupabaseKeyInput(cleanKey);
      }
      const result = await testSupabaseConnection(effectiveUrl || supabaseUrlInput, cleanKey || supabaseKeyInput);
      if (result.details?.correctedUrl && result.details.correctedUrl !== supabaseUrlInput) {
        setSupabaseUrlInput(result.details.correctedUrl);
      }
      if (result.details?.correctedKey && result.details.correctedKey !== supabaseKeyInput) {
        setSupabaseKeyInput(result.details.correctedKey);
      }
      setSupabaseConfigState(getSupabaseConfig());

      // Si la connexion est réussie et qu'il y a des plats, les synchroniser automatiquement tout de suite !
      if (result.success && items.length > 0) {
        const pushRes = await pushAllMenuItemsToSupabase(
          items,
          result.details?.correctedUrl || effectiveUrl || supabaseUrlInput,
          result.details?.correctedKey || cleanKey || supabaseKeyInput
        );
        if (pushRes.success) {
          setSupabaseTestReport({
            ...result,
            message: `${result.message} 🚀 Vos ${pushRes.count} plats ont été synchronisés automatiquement dans Supabase !`,
          });
          playSound("success");
          return;
        }
      }

      setSupabaseTestReport(result);
      if (result.success) {
        playSound("success");
      } else {
        playSound("pop");
      }
    } catch (err: any) {
      setSupabaseTestReport({
        success: false,
        message: `Erreur inattendue : ${err?.message || "Échec du test de connexion"}`,
      });
      playSound("pop");
    } finally {
      setIsTestingSupabase(false);
    }
  };

  const handleSaveSupabaseConfig = () => {
    const cleanKey = sanitizeSupabaseKey(supabaseKeyInput);
    const cleanUrl = sanitizeSupabaseUrl(supabaseUrlInput, cleanKey);
    if (cleanUrl) {
      setSupabaseUrlInput(cleanUrl);
    }
    if (cleanKey) {
      setSupabaseKeyInput(cleanKey);
    }
    saveSupabaseConfig(cleanUrl || supabaseUrlInput, cleanKey || supabaseKeyInput, supabaseAutoSync);
    const updated = getSupabaseConfig();
    setSupabaseConfigState(updated);
    playSound("success");
    setBackupStatusMessage(
      updated.isConfigured
        ? "✅ Configuration Supabase enregistrée ! Le Cloud est maintenant actif."
        : "⚠️ Clés enregistrées en mémoire locale (vérifiez le format de la clé Anon)."
    );
    setTimeout(() => setBackupStatusMessage(null), 4000);
  };

  const handleResetSupabaseConfig = () => {
    if (confirm("Réinitialiser les clés personnalisées et revenir aux valeurs par défaut de l'application ?")) {
      clearSupabaseConfig();
      const updated = getSupabaseConfig();
      setSupabaseConfigState(updated);
      setSupabaseUrlInput(updated.url);
      setSupabaseKeyInput(updated.anonKey);
      setSupabaseAutoSync(updated.autoSync);
      setSupabaseTestReport(null);
      setPushMenuSummary(null);
      playSound("pop");
      setBackupStatusMessage("Paramètres Supabase réinitialisés.");
      setTimeout(() => setBackupStatusMessage(null), 3000);
    }
  };

  const handleToggleAutoSync = (enabled: boolean) => {
    setSupabaseAutoSync(enabled);
    saveAutoSyncSetting(enabled);
    setSupabaseConfigState((prev) => ({ ...prev, autoSync: enabled }));
    playSound("pop");
    setBackupStatusMessage(
      enabled
        ? "⚡ Synchronisation automatique activée : chaque plat ajouté/modifié sera poussé vers Supabase."
        : "⏸️ Synchronisation automatique désactivée : sauvegardes locales uniquement."
    );
    setTimeout(() => setBackupStatusMessage(null), 4000);
  };

  const handlePushAllMenuToSupabase = async () => {
    setIsPushingMenuToSupabase(true);
    setPushMenuSummary(null);
    setSupabaseTestReport(null);

    // 1. Toujours sauvegarder immédiatement tous les plats dans la mémoire persistante locale (IndexedDB + LocalStorage)
    try {
      await persistentStorage.setItem("khadys_menu_items", items);
      localStorage.setItem("khadys_menu_items", JSON.stringify(items));
    } catch {
      // Ignorer
    }

    const hasAnyInput = Boolean(supabaseUrlInput.trim() || supabaseKeyInput.trim() || isCloudConnected);
    if (!hasAnyInput) {
      setIsPushingMenuToSupabase(false);
      playSound("success");
      setPushMenuSummary({
        success: true,
        localSaved: true,
        count: items.length,
        total: items.length,
        message: `✅ Vos ${items.length} plats sont sauvegardés dans l'application ! (Pour activer en plus le Cloud Supabase, collez votre clé Anon ci-dessus).`,
      });
      setBackupStatusMessage(`✅ Vos ${items.length} plats sont bien sauvegardés dans l'application !`);
      setTimeout(() => setBackupStatusMessage(null), 5000);
      return;
    }

    try {
      const res = await pushAllMenuItemsToSupabase(items, supabaseUrlInput, supabaseKeyInput);
      if (res.correctedUrl && res.correctedUrl !== supabaseUrlInput) {
        setSupabaseUrlInput(res.correctedUrl);
      }
      if (res.correctedKey && res.correctedKey !== supabaseKeyInput) {
        setSupabaseKeyInput(res.correctedKey);
      }
      setSupabaseConfigState(getSupabaseConfig());

      if (res.success) {
        playSound("success");
        setPushMenuSummary({
          success: true,
          count: res.count,
          total: res.total,
          message: `🚀 ${res.count} plat(s) sur ${res.total} synchronisés avec succès vers Supabase Cloud !`,
        });
        setBackupStatusMessage(`🚀 ${res.count} plat(s) poussés vers Supabase Cloud avec succès !`);
      } else {
        playSound("pop");
        setPushMenuSummary({
          success: false,
          localSaved: true,
          missingTables: res.missingTables,
          authError: res.authError,
          count: items.length,
          total: items.length,
          message: `💾 Vos ${items.length} plats sont bien sauvegardés sur votre appareil ! Détail Cloud : ${res.error || "Clé Supabase à vérifier"}`,
        });
        setBackupStatusMessage(`💾 ${items.length} plats sauvegardés en local (Cloud : vérifiez la clé Anon).`);
      }
      setTimeout(() => setBackupStatusMessage(null), 5000);
    } catch (err: any) {
      playSound("pop");
      setPushMenuSummary({
        success: false,
        localSaved: true,
        count: items.length,
        total: items.length,
        message: `💾 Vos ${items.length} plats sont sauvegardés sur l'appareil ! (${err?.message || "Erreur réseau Cloud"})`,
      });
    } finally {
      setIsPushingMenuToSupabase(false);
    }
  };

  const handleCopySqlSchema = async () => {
    try {
      await navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
      setHasCopiedSql(true);
      playSound("success");
      setTimeout(() => setHasCopiedSql(false), 3000);
    } catch {
      alert("Script SQL prêt ! Copiez le contenu affiché à l'écran.");
    }
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem?.name || !editingItem?.price) return;

    const isJour = Boolean(
      editingItem.isPlatDuJour ||
      editingItem.category === "Plat du Jour" ||
      editingItem.category === "Menu du Jour"
    );

    const finalItem = {
      ...editingItem,
      id: editingItem.id || `item-${Date.now()}`,
      rating: editingItem.rating || 5,
      isAvailable: editingItem.isAvailable ?? true,
      category: editingItem.category || (isJour ? "Plat du Jour" : "Plat Africain"),
      isPlatDuJour: isJour,
      isSpécialitéMaison: editingItem.isSpécialitéMaison ?? (editingItem.category === "Spécialité Maison"),
      image:
        editingItem.image ||
        "https://images.unsplash.com/photo-1546069901-ba9599a7e63c",
    } as MenuItem;

    let updatedItems: MenuItem[];
    if (items.find((i) => i.id === finalItem.id)) {
      updatedItems = items.map((i) => (i.id === finalItem.id ? finalItem : i));
    } else {
      updatedItems = [finalItem, ...items];
    }

    setItems(updatedItems);
    await persistentStorage.setItem('khadys_menu_items', updatedItems);

    const shouldPushToSupabase = modalPushToSupabase || supabaseAutoSync;
    let cloudSyncSuccess = false;
    let cloudSyncError = "";

    if (shouldPushToSupabase && isCloudConnected) {
      try {
        const syncRes = await db.saveMenuItem(finalItem);
        if (syncRes.success) {
          cloudSyncSuccess = true;
        } else {
          cloudSyncError = syncRes.error || "Erreur lors de l'enregistrement distant";
        }
      } catch (err: any) {
        cloudSyncError = err?.message || "Erreur réseau";
        console.warn("Synchro Cloud Supabase différée:", err);
      }
    }

    setEditingItem(null);
    playSound("success");

    if (shouldPushToSupabase && isCloudConnected) {
      if (cloudSyncSuccess) {
        setBackupStatusMessage(`✅ Plat « ${finalItem.name} » enregistré et synchronisé avec succès sur Supabase Cloud !`);
      } else {
        setBackupStatusMessage(`💾 Plat « ${finalItem.name} » enregistré en local (Échec Supabase : ${cloudSyncError}).`);
      }
    } else if (shouldPushToSupabase && !isCloudConnected) {
      setBackupStatusMessage(`💾 Plat « ${finalItem.name} » enregistré en local. (Supabase non configuré - configurez vos clés dans Paramètres).`);
    } else {
      setBackupStatusMessage(`💾 Plat « ${finalItem.name} » enregistré en local avec succès !`);
    }
    setTimeout(() => setBackupStatusMessage(null), 4500);
  };

  const updateOrderStatus = (orderId: string, newStatus: OrderStatus) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          const updated = { ...o, status: newStatus };
          sendOrderNotification(updated);
          return updated;
        }
        return o;
      }),
    );
    playSound("notification");
  };

  const runAiStrategy = async () => {
    setIsAiLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Génère une stratégie marketing éclair pour booster les ventes de Tiep et Box Sauces à Niamey. 2 lignes maximum.`;
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });
      setAiStrategy(response.text || "");
      playSound("success");
    } catch (e) {
      setAiStrategy("Veuillez configurer votre clé API pour l'IA.");
    } finally {
      setIsAiLoading(false);
    }
  };

  const renderContent = () => {
    switch (currentView) {
      case AdminView.DASHBOARD:
        return (
          <div className="space-y-6 animate-fade-in">
            {/* Banner Vente Automatique WhatsApp 24/7 */}
            <div
              onClick={() => {
                setCurrentView(AdminView.WHATSAPP_AUTOMATION);
                playSound("pop");
              }}
              className="bg-gradient-to-r from-brand-brown via-[#2A1510] to-[#1A0F0D] p-6 rounded-[2.5rem] border border-brand-gold/30 shadow-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 cursor-pointer hover:border-brand-gold transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="p-4 bg-brand-gold/20 text-brand-gold rounded-2xl border border-brand-gold/30 group-hover:scale-110 transition-transform">
                  <Bot size={28} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    <h4 className="font-black text-sm uppercase italic text-brand-gold">
                      WhatsApp Vente Automatique 24/7
                    </h4>
                    <span className="bg-green-500/20 text-green-400 border border-green-500/30 text-[8px] font-black uppercase px-2 py-0.5 rounded-full">
                      Actif Cloud
                    </span>
                  </div>
                  <p className="text-[10px] text-white/60 font-bold uppercase mt-1">
                    Le serveur répond & vend automatiquement sur WhatsApp même
                    si votre téléphone est éteint
                  </p>
                </div>
              </div>
              <button className="bg-brand-gold text-brand-brown px-5 py-2.5 rounded-2xl text-[9px] font-black uppercase italic shadow-lg group-hover:bg-brand-orange group-hover:text-white transition-colors flex items-center gap-2 shrink-0">
                Ouvrir Console WhatsApp <Bot size={14} />
              </button>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  label: "Ventes Jour",
                  val: "645.000 F",
                  icon: DollarSign,
                  col: "text-brand-gold",
                },
                {
                  label: "En attente",
                  val: orders.filter((o) => o.status === "RECEIVED").length,
                  icon: ShoppingBag,
                  col: "text-brand-orange",
                },
                {
                  label: "Livreurs Live",
                  val: "4 Actifs",
                  icon: Bike,
                  col: "text-green-400",
                },
                {
                  label: "Points Club",
                  val: "124.5k",
                  icon: Sparkles,
                  col: "text-yellow-400",
                },
              ].map((s, i) => (
                <div
                  key={i}
                  className="bg-white/5 p-6 rounded-[2rem] border border-white/5 shadow-2xl"
                >
                  <s.icon size={20} className={`${s.col} mb-3`} />
                  <p className="text-[8px] text-white/30 uppercase font-black tracking-widest">
                    {s.label}
                  </p>
                  <h4 className="text-xl font-black italic">{s.val}</h4>
                </div>
              ))}
            </div>

            {/* Widget ⭐ Plat(s) du Jour Actifs */}
            <div className="bg-gradient-to-r from-amber-500/10 via-[#2A1710] to-[#1A0F0D] p-6 rounded-[2.5rem] border border-brand-gold/30 shadow-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-brand-gold text-brand-brown rounded-2xl shadow-lg shrink-0">
                  <Star size={24} fill="currentColor" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-brand-gold animate-ping"></span>
                    <h4 className="font-black text-sm uppercase italic text-brand-gold">
                      Plat / Menu du Jour ({items.filter(isItemPlatDuJour).length} Actif{items.filter(isItemPlatDuJour).length > 1 ? "s" : ""})
                    </h4>
                    {items.filter(isItemPlatDuJour).length > 0 ? (
                      <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[8px] font-black uppercase px-2 py-0.5 rounded-full">
                        En Ligne
                      </span>
                    ) : (
                      <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[8px] font-black uppercase px-2 py-0.5 rounded-full">
                        Non Défini
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-white/70 font-medium mt-1">
                    {items.filter(isItemPlatDuJour).length > 0
                      ? items
                          .filter(isItemPlatDuJour)
                          .map((p) => p.name)
                          .join(" • ")
                      : "Aucun plat défini en Plat du Jour aujourd'hui. Les clients ne voient rien dans ⭐ Plat du Jour."}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setCurrentView(AdminView.MENU_MGMT);
                  setMenuFilterCategory("Plat du Jour");
                  playSound("pop");
                }}
                className="bg-brand-gold hover:bg-amber-400 text-brand-brown px-5 py-2.5 rounded-2xl text-[9px] font-black uppercase italic shadow-lg flex items-center gap-2 shrink-0 active:scale-95 transition-all"
              >
                Gérer les Plats du Jour <Star size={14} fill="currentColor" />
              </button>
            </div>

            {/* Widget ☁️ Synchronisation Supabase Cloud */}
            <div className="bg-gradient-to-r from-emerald-950/40 via-[#132219] to-[#0D1812] p-6 rounded-[2.5rem] border border-emerald-500/30 shadow-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex items-center gap-4">
                <div className={`p-4 rounded-2xl shadow-lg shrink-0 ${isCloudConnected ? "bg-emerald-500 text-black" : "bg-white/10 text-white/50"}`}>
                  <Cloud size={24} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${isCloudConnected ? "bg-emerald-400 animate-pulse" : "bg-white/40"}`} />
                    <h4 className="font-black text-sm uppercase italic text-emerald-300">
                      Supabase Cloud Sync ({items.length} Plats locaux)
                    </h4>
                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full border ${
                      isCloudConnected
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                        : "bg-white/10 text-white/50 border-white/20"
                    }`}>
                      {isCloudConnected ? "Connecté" : "Hors ligne"}
                    </span>
                    {supabaseAutoSync && (
                      <span className="bg-brand-gold/20 text-brand-gold border border-brand-gold/30 text-[8px] font-black uppercase px-2 py-0.5 rounded-full">
                        Auto-Push ON
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-white/70 font-medium mt-1">
                    {isCloudConnected
                      ? "Vos plats peuvent être poussés en 1 clic vers le Cloud pour être synchronisés sur tous vos écrans et commandes."
                      : "Identifiants Supabase non renseignés. Configurez vos clés dans Paramètres pour activer la base en direct."}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 w-full md:w-auto">
                <button
                  onClick={handlePushAllMenuToSupabase}
                  disabled={isPushingMenuToSupabase}
                  className="flex-1 md:flex-none bg-emerald-500 hover:bg-emerald-400 text-black px-5 py-2.5 rounded-2xl text-[9px] font-black uppercase italic shadow-lg flex items-center justify-center gap-2 shrink-0 active:scale-95 transition-all disabled:opacity-50"
                >
                  <CloudUpload size={14} className={isPushingMenuToSupabase ? "animate-bounce" : ""} />
                  {isPushingMenuToSupabase ? "Envoi..." : "Pousser vers Cloud"}
                </button>
                <button
                  onClick={() => {
                    setCurrentView(AdminView.SETTINGS);
                    playSound("pop");
                  }}
                  className="flex-1 md:flex-none bg-white/10 hover:bg-white/20 text-white px-4 py-2.5 rounded-2xl text-[9px] font-black uppercase italic border border-white/10 flex items-center justify-center gap-2 shrink-0 active:scale-95 transition-all"
                >
                  <Settings size={14} /> Configurer
                </button>
              </div>
            </div>

            <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/5">
              <h3 className="text-lg font-black italic uppercase text-brand-gold mb-6">
                Plats en vogue
              </h3>
              <div className="space-y-4">
                {items.slice(0, 3).map((it, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-4 bg-black/20 p-4 rounded-2xl"
                  >
                    <img
                      src={it.image}
                      className="w-12 h-12 rounded-xl object-cover"
                    />
                    <div className="flex-1">
                      <p className="font-black text-[10px] uppercase tracking-tighter text-white/80">
                        {it.name}
                      </p>
                      <div className="w-full bg-white/5 h-1.5 rounded-full mt-2">
                        <div
                          className="bg-brand-orange h-full rounded-full"
                          style={{ width: `${95 - idx * 10}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case AdminView.WHATSAPP_AUTOMATION:
        return <WhatsAppAutomationView />;

      case AdminView.MENU_MGMT:
        return (
          <div className="space-y-6 animate-fade-in">
            {/* Hidden input for backup JSON import */}
            <input
              type="file"
              ref={backupFileInputRef}
              className="hidden"
              accept=".json,application/json"
              onChange={handleImportBackupFile}
            />

            {/* Notification de Statut Sauvegarde */}
            {backupStatusMessage && (
              <div className="bg-emerald-500/20 border border-emerald-500/40 p-4 rounded-2xl text-emerald-300 text-xs font-black flex items-center justify-between animate-fade-in shadow-xl">
                <span className="flex items-center gap-2">
                  <ShieldCheck size={18} className="text-emerald-400" />
                  {backupStatusMessage}
                </span>
                <button onClick={() => setBackupStatusMessage(null)} className="text-emerald-400 hover:text-white">
                  <X size={16} />
                </button>
              </div>
            )}

            {/* Header Gestion de Carte & Outils de Sauvegarde */}
            <div className="bg-gradient-to-r from-brand-brown via-[#2A1510] to-[#1A0F0D] p-6 rounded-[2.5rem] border-2 border-brand-gold/30 shadow-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400">
                    Sauvegarde Persistante Active (IndexedDB)
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black italic uppercase text-brand-gold">
                  Gestion de la Carte ({items.length} Plats)
                </h3>
                <p className="text-[10px] text-white/60 font-medium">
                  Tous les plats que vous ajoutez sont conservés de manière permanente sur cet appareil.
                </p>

                {!isCloudConnected && !isStandaloneMode && (
                  <div className="mt-3 bg-gradient-to-r from-amber-950/70 via-[#2A160F] to-[#1A0E0B] border-2 border-amber-500/50 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-200 shadow-xl">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-amber-500 text-black rounded-xl shrink-0 font-black">
                        <AlertCircle size={18} />
                      </div>
                      <div>
                        <p className="text-[11px] font-black uppercase text-amber-300">
                          Synchronisation Cloud Supabase (Optionnel)
                        </p>
                        <p className="text-[9px] text-white/70">
                          Vos {items.length} plats sont déjà sauvegardés sur cet appareil. Connectez Supabase si vous souhaitez une base Cloud externe.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={handleEnableStandaloneMode}
                        className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 px-3 py-2 rounded-xl text-[9px] font-black uppercase italic active:scale-95 transition-all"
                      >
                        Mode Local Seul
                      </button>
                      <button
                        onClick={() => {
                          setShowSupabaseSettingsModal(true);
                          playSound("pop");
                        }}
                        className="bg-brand-gold hover:bg-amber-400 text-brand-brown px-4 py-2 rounded-xl text-[9px] font-black uppercase italic shadow-lg flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                      >
                        <Settings size={14} /> Configurer Supabase
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                <button
                  onClick={handlePushAllMenuToSupabase}
                  disabled={isPushingMenuToSupabase}
                  className="flex-1 sm:flex-none bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-4 py-3 rounded-2xl text-[9px] font-black uppercase italic border border-emerald-400/40 flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-xl disabled:opacity-50"
                  title="Pousser l'ensemble des plats du menu vers votre base de données Supabase Cloud"
                >
                  <CloudUpload size={15} className={isPushingMenuToSupabase ? "animate-bounce" : ""} />
                  {isPushingMenuToSupabase ? "Envoi..." : `Pousser vers Supabase (${items.length})`}
                </button>
                <button
                  onClick={() => {
                    setShowSupabaseSettingsModal(true);
                    playSound("pop");
                  }}
                  className={`flex-1 sm:flex-none px-4 py-3 rounded-2xl text-[9px] font-black uppercase italic border flex items-center justify-center gap-1.5 transition-all shadow-lg active:scale-95 ${
                    isCloudConnected
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50 hover:bg-emerald-500/30"
                      : "bg-amber-500/25 text-amber-200 border-amber-500/60 hover:bg-amber-500/35"
                  }`}
                  title="Ouvrir les Paramètres Supabase et configurer vos clés d'environnement"
                >
                  <Settings size={15} />
                  <span>{isCloudConnected ? "⚙️ Paramètres Supabase" : "⚙️ Paramètres Supabase (À Configurer)"}</span>
                </button>
                <button
                  onClick={handleExportBackup}
                  className="flex-1 sm:flex-none bg-white/10 hover:bg-white/20 text-brand-gold px-4 py-3 rounded-2xl text-[9px] font-black uppercase italic border border-white/10 flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-lg"
                  title="Télécharger une copie de sauvegarde sur votre ordinateur ou téléphone"
                >
                  <Download size={15} /> Sauvegarder JSON
                </button>
                <button
                  onClick={() => backupFileInputRef.current?.click()}
                  className="flex-1 sm:flex-none bg-white/10 hover:bg-white/20 text-white px-4 py-3 rounded-2xl text-[9px] font-black uppercase italic border border-white/10 flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-lg"
                  title="Restaurer un fichier de sauvegarde préalablement téléchargé"
                >
                  <Upload size={15} /> Restaurer JSON
                </button>
                <button
                  onClick={handleRestoreSnapshot}
                  className="flex-1 sm:flex-none bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 px-4 py-3 rounded-2xl text-[9px] font-black uppercase italic border border-amber-500/30 flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-lg"
                  title="Récupérer le dernier snapshot automatique sauvegardé"
                >
                  <RefreshCw size={15} /> Snapshot Secours
                </button>
                <button
                  onClick={() => setEditingItem({ isPlatDuJour: menuFilterCategory === "Plat du Jour" })}
                  className="w-full sm:w-auto bg-brand-gold hover:bg-amber-400 text-brand-brown px-6 py-3 rounded-2xl shadow-xl flex items-center justify-center gap-2 font-black text-[10px] uppercase italic active:scale-95 transition-all"
                >
                  <Plus size={18} /> Ajouter un Plat
                </button>
              </div>
            </div>

            {/* Panneau Dédié ⭐ Plat(s) du Jour en Ligne */}
            <div className="bg-gradient-to-r from-amber-500/15 via-[#2A1510] to-[#1A0F0D] p-5 sm:p-6 rounded-[2.5rem] border-2 border-brand-gold/40 shadow-2xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-brand-gold text-brand-brown rounded-2xl shadow-lg shrink-0">
                    <Star size={22} fill="currentColor" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-brand-gold animate-ping" />
                      <h4 className="text-base sm:text-lg font-black italic uppercase text-brand-gold">
                        Plat(s) du Jour & Formules Quotidiennes
                      </h4>
                      <span className="bg-brand-gold text-brand-brown text-[8px] font-black uppercase px-2 py-0.5 rounded-full shadow-sm">
                        {items.filter(isItemPlatDuJour).length} en vedette
                      </span>
                    </div>
                    <p className="text-[10px] text-white/70 font-medium mt-0.5">
                      Ces plats sont immédiatement mis en avant en tête de carte dans l'onglet client <strong>⭐ PLAT DU JOUR</strong>.
                    </p>
                  </div>
                </div>

                {items.filter(isItemPlatDuJour).length === 0 && (
                  <button
                    onClick={async () => {
                      const defaultDish =
                        items.find(
                          (i) =>
                            i.name.toLowerCase().includes("dambou") ||
                            i.name.toLowerCase().includes("tiep") ||
                            i.name.toLowerCase().includes("garba")
                        ) || items[0];
                      if (defaultDish) {
                        await handleTogglePlatDuJour(
                          { stopPropagation: () => {} } as any,
                          defaultDish.id
                        );
                      }
                    }}
                    className="bg-brand-gold hover:bg-amber-400 text-brand-brown px-4 py-2.5 rounded-2xl text-[9px] font-black uppercase italic shadow-lg flex items-center justify-center gap-2 shrink-0 active:scale-95 transition-all"
                  >
                    <Star size={14} fill="currentColor" /> Activer un Plat du Jour
                  </button>
                )}
              </div>

              {/* Plats du jour actuellement sélectionnés */}
              {items.filter(isItemPlatDuJour).length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
                  {items.filter(isItemPlatDuJour).map((p) => (
                    <div
                      key={p.id}
                      className="bg-black/50 border border-brand-gold/40 p-3 rounded-2xl flex items-center justify-between gap-3 hover:border-brand-gold transition-all shadow-md group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={p.image}
                          alt={p.name}
                          className="w-12 h-12 rounded-xl object-cover shrink-0 border border-brand-gold/40 group-hover:scale-105 transition-transform"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-black text-brand-gold uppercase truncate italic">
                            {p.name}
                          </p>
                          <p className="text-[10px] font-black text-brand-orange">
                            {p.price.toLocaleString("fr-FR")} F CFA
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={(e) => handleTogglePlatDuJour(e, p.id)}
                        className="bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 px-3 py-1.5 rounded-xl text-[8px] font-black uppercase shrink-0 transition-all active:scale-95"
                        title="Retirer du Plat du Jour"
                      >
                        Retirer
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-2xl flex items-center gap-3 text-amber-300">
                  <AlertCircle size={20} className="shrink-0 text-amber-400" />
                  <div className="text-[10px] leading-relaxed">
                    <span className="font-bold">Attention :</span> Aucun plat n'est actuellement marqué comme <strong>"Plat du Jour"</strong>.
                    Cliquez sur le bouton <span className="font-black underline text-brand-gold">⭐ Mettre en Plat du Jour</span> sur n'importe quel plat de la carte ci-dessous pour le rendre instantanément visible à vos clients.
                  </div>
                </div>
              )}
            </div>

            {/* Barre de Recherche et Filtres par Catégorie */}
            <div className="space-y-3">
              <div className="relative w-full">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
                <input
                  type="text"
                  value={menuSearchQuery}
                  onChange={(e) => setMenuSearchQuery(e.target.value)}
                  placeholder="Rechercher un plat par son nom ou description..."
                  className="w-full pl-12 pr-10 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-xs text-white placeholder-white/40 font-medium focus:outline-none focus:border-brand-gold/50"
                />
                {menuSearchQuery && (
                  <button
                    onClick={() => setMenuSearchQuery("")}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              {/* Filtres Catégories */}
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                {[
                  { id: "TOUT", label: `Tous (${items.length})` },
                  {
                    id: "Plat du Jour",
                    label: `⭐ Plat du Jour (${items.filter(isItemPlatDuJour).length})`,
                    highlight: true,
                  },
                  {
                    id: "Spécialité Maison",
                    label: `👑 Spécialités (${items.filter((i) => i.isSpécialitéMaison || i.category === "Spécialité Maison").length})`,
                  },
                  {
                    id: "Plat Africain",
                    label: `🥘 Plats Africains (${items.filter((i) => i.category === "Plat Africain" || i.category === "Déjeuner" || i.category === "Dîner").length})`,
                  },
                  {
                    id: "Box Sauce",
                    label: `📦 Box Sauce (${items.filter((i) => i.category === "Box Sauce" || i.category === "Box Repas").length})`,
                  },
                  {
                    id: "Pack-Buffet",
                    label: `🎪 Buffets & Packs (${items.filter((i) => i.category === "Pack-Buffet" || i.category === "Pack" || i.category === "Buffet").length})`,
                  },
                  {
                    id: "Boisson",
                    label: `🍹 Boissons & Desserts (${items.filter((i) => i.category.includes("Boisson") || i.category === "Dessert").length})`,
                  },
                ].map((tab) => {
                  const isActive = menuFilterCategory === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setMenuFilterCategory(tab.id);
                        playSound("pop");
                      }}
                      className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider whitespace-nowrap transition-all flex items-center gap-1.5 active:scale-95 ${
                        isActive
                          ? "bg-brand-gold text-brand-brown shadow-lg font-black border border-brand-gold scale-105"
                          : tab.highlight
                          ? "bg-brand-gold/15 text-brand-gold border border-brand-gold/30 hover:bg-brand-gold/25"
                          : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white border border-white/5"
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Grid des Plats Filtrés */}
            {(() => {
              const displayedItems = items.filter((item) => {
                const matchesSearch =
                  !menuSearchQuery ||
                  item.name.toLowerCase().includes(menuSearchQuery.toLowerCase()) ||
                  (item.description &&
                    item.description.toLowerCase().includes(menuSearchQuery.toLowerCase()));

                if (!matchesSearch) return false;

                if (menuFilterCategory === "TOUT") return true;
                if (menuFilterCategory === "Plat du Jour") return isItemPlatDuJour(item);
                if (menuFilterCategory === "Spécialité Maison")
                  return item.isSpécialitéMaison || item.category === "Spécialité Maison";
                if (menuFilterCategory === "Plat Africain")
                  return (
                    item.category === "Plat Africain" ||
                    item.category === "Déjeuner" ||
                    item.category === "Dîner"
                  );
                if (menuFilterCategory === "Box Sauce")
                  return item.category === "Box Sauce" || item.category === "Box Repas";
                if (menuFilterCategory === "Pack-Buffet")
                  return (
                    item.category === "Pack-Buffet" ||
                    item.category === "Pack" ||
                    item.category === "Buffet"
                  );
                if (menuFilterCategory === "Boisson")
                  return item.category.includes("Boisson") || item.category === "Dessert";

                return item.category === menuFilterCategory;
              });

              if (displayedItems.length === 0) {
                return (
                  <div className="bg-white/5 p-12 rounded-[2.5rem] border border-white/5 text-center space-y-3">
                    <p className="text-sm font-black italic text-brand-gold uppercase">
                      Aucun plat trouvé
                    </p>
                    <p className="text-xs text-white/50">
                      Aucun plat ne correspond à vos filtres actuels.
                    </p>
                    <button
                      onClick={() => {
                        setMenuFilterCategory("TOUT");
                        setMenuSearchQuery("");
                      }}
                      className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-[9px] font-black uppercase"
                    >
                      Réinitialiser les filtres
                    </button>
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {displayedItems.map((item) => {
                    const isJour = isItemPlatDuJour(item);
                    return (
                      <div
                        key={item.id}
                        className={`bg-white/5 p-5 rounded-[2.5rem] border group relative overflow-hidden transition-all hover:bg-white/10 ${
                          isJour
                            ? "border-brand-gold/60 shadow-[0_0_20px_rgba(230,175,46,0.15)]"
                            : "border-white/5 hover:border-brand-gold/30"
                        }`}
                      >
                        <div className="relative w-full h-36 rounded-[2rem] overflow-hidden mb-4 bg-black/40">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-300"
                          />
                          <span className="absolute top-3 left-3 bg-black/70 backdrop-blur-md text-[8px] font-black text-brand-gold px-2.5 py-1 rounded-full uppercase italic border border-white/10">
                            {item.category}
                          </span>

                          {/* Badge Plat du Jour sur la photo */}
                          {isJour && (
                            <span className="absolute top-3 right-3 bg-brand-gold text-brand-brown font-black text-[8px] px-2.5 py-1 rounded-full uppercase italic shadow-lg flex items-center gap-1 border border-amber-300">
                              <Star size={10} fill="currentColor" /> Plat du Jour
                            </span>
                          )}
                        </div>

                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h4 className="font-black text-sm italic text-brand-gold uppercase truncate">
                            {item.name}
                          </h4>
                          <span className="text-xs font-black text-brand-orange shrink-0">
                            {item.price.toLocaleString("fr-FR")} F
                          </span>
                        </div>

                        <p className="text-[10px] text-white/50 line-clamp-2 mb-3 h-7">
                          {item.description ||
                            "Délicieuse spécialité préparée avec soin chez Khady's Food."}
                        </p>

                        {/* Bouton rapide d'activation/désactivation Plat du Jour */}
                        <button
                          onClick={(e) => handleTogglePlatDuJour(e, item.id)}
                          className={`w-full py-2 px-3 rounded-xl text-[9px] font-black uppercase flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 mb-2 ${
                            isJour
                              ? "bg-brand-gold text-brand-brown hover:bg-amber-400 font-black shadow-lg"
                              : "bg-white/5 hover:bg-brand-gold/20 text-white/70 hover:text-brand-gold border border-white/10"
                          }`}
                          title="Cliquer pour activer ou désactiver ce plat comme Plat du Jour"
                        >
                          <Star size={12} fill={isJour ? "currentColor" : "none"} />
                          {isJour ? "⭐ Plat du Jour (Actif)" : "⭐ Mettre en Plat du Jour"}
                        </button>

                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditingItem(item)}
                            className="flex-1 bg-white/5 p-3 rounded-xl text-white/60 hover:text-white hover:bg-brand-gold/20 flex items-center justify-center gap-1 text-[9px] font-black uppercase transition-all"
                          >
                            <Edit3 size={15} /> Modifier
                          </button>
                          <button
                            onClick={async () => {
                              if (
                                confirm(
                                  `Supprimer définitivement "${item.name}" de la carte ?`
                                )
                              ) {
                                const nextItems = items.filter(
                                  (i) => i.id !== item.id
                                );
                                setItems(nextItems);
                                await persistentStorage.setItem(
                                  "khadys_menu_items",
                                  nextItems
                                );
                                if (isSupabaseConfigured) {
                                  try {
                                    await db.deleteMenuItem(item.id);
                                  } catch {}
                                }
                                playSound("pop");
                                setBackupStatusMessage(
                                  `Plat "${item.name}" supprimé.`
                                );
                                setTimeout(
                                  () => setBackupStatusMessage(null),
                                  3000
                                );
                              }
                            }}
                            className="bg-red-500/10 p-3 rounded-xl text-red-500 hover:bg-red-500 hover:text-white flex items-center justify-center transition-all"
                            title="Supprimer le plat"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        );

      case AdminView.ORDERS:
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-black italic uppercase text-brand-gold">
                Commandes en Direct
              </h3>
              <span className="text-[10px] font-black uppercase text-brand-orange bg-brand-orange/10 px-4 py-2 rounded-full border border-brand-orange/20">
                {orders.length} Commandes actives
              </span>
            </div>

            <div className="space-y-4">
              {orders.length === 0 ? (
                <p className="text-center py-20 opacity-20 italic">
                  Aucune commande aujourd'hui
                </p>
              ) : (
                orders.map((o) => (
                  <div
                    key={o.id}
                    className="bg-white/5 p-6 sm:p-8 rounded-[2.5rem] border border-white/5 flex flex-col gap-6 relative group hover:border-white/10 transition-all"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-white/5">
                      <div className="flex items-center gap-3">
                        <h4 className="font-black text-brand-gold italic text-base">
                          {o.customerName}
                        </h4>
                        <span className="text-[9px] px-3 py-1 bg-white/10 rounded-full font-bold font-mono text-white/80">
                          {o.id}
                        </span>
                        <span className="text-[9px] px-3 py-1 bg-brand-orange text-white rounded-full font-black uppercase italic">
                          {o.status}
                        </span>
                      </div>
                      <div className="text-[10px] font-mono text-brand-gold font-bold">
                        Total: {o.total + o.deliveryFee} F (Frais:{" "}
                        {o.deliveryFee} F)
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Left Details & Items */}
                      <div className="space-y-3">
                        <div className="p-4 bg-black/30 rounded-2xl space-y-1.5">
                          <p className="text-[9px] text-white/40 uppercase font-black">
                            Livraison à ({o.district}) :
                          </p>
                          <p className="text-xs text-white/90 font-bold">
                            {o.address || "Adresse standard"}
                          </p>
                          <p className="text-xs text-brand-gold font-mono font-bold">
                            Tél : {o.phone}
                          </p>
                        </div>

                        <div className="space-y-1 bg-black/20 p-4 rounded-2xl">
                          <p className="text-[9px] text-brand-orange font-black uppercase mb-1">
                            Articles commandés :
                          </p>
                          {o.items.map((it, idx) => (
                            <p
                              key={idx}
                              className="text-xs text-white/80 font-medium flex justify-between"
                            >
                              <span>
                                • {it.quantity} x {it.name}
                              </span>
                              <span className="font-mono text-brand-gold/80">
                                {it.price * it.quantity} F
                              </span>
                            </p>
                          ))}
                        </div>
                      </div>

                      {/* Right Payment & Driver Controls */}
                      <div className="space-y-4">
                        {/* Mobile Money Proof Validation Box */}
                        {o.paymentType === "MOBILE_MONEY" ? (
                          <div
                            className={`p-4 rounded-2xl border-2 space-y-3 ${
                              o.paymentValidated
                                ? "bg-green-500/10 border-green-500/30"
                                : "bg-amber-500/10 border-amber-500/50"
                            }`}
                          >
                            <div className="flex justify-between items-center">
                              <span className="text-[9px] font-black uppercase tracking-wider text-amber-300 italic">
                                📱 Mobile Money ({o.paymentMethod})
                              </span>
                              <span
                                className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${
                                  o.paymentValidated
                                    ? "bg-green-500 text-white"
                                    : "bg-amber-500 text-black"
                                }`}
                              >
                                {o.paymentValidated
                                  ? "Dépôt Validé Admin"
                                  : "En attente contrôle Admin"}
                              </span>
                            </div>

                            <p className="text-xs font-mono font-bold text-white">
                              Ref TRX:{" "}
                              <strong className="text-brand-gold">
                                {o.paymentTransactionId || "Non fourni"}
                              </strong>
                            </p>

                            {o.paymentProofUrl && (
                              <div className="flex items-center gap-3">
                                <img
                                  src={o.paymentProofUrl}
                                  className="w-16 h-16 object-cover rounded-xl border border-white/20 shadow-md"
                                  alt="Reçu"
                                />
                                <a
                                  href={o.paymentProofUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-[9px] font-bold text-brand-gold underline uppercase"
                                >
                                  Agrandir Reçu
                                </a>
                              </div>
                            )}

                            <button
                              onClick={() => {
                                playSound("cash");
                                setOrders(
                                  orders.map((ord) =>
                                    ord.id === o.id
                                      ? {
                                          ...ord,
                                          paymentValidated:
                                            !ord.paymentValidated,
                                        }
                                      : ord,
                                  ),
                                );
                              }}
                              className={`w-full py-2.5 rounded-xl text-[9px] font-black uppercase italic transition-all ${
                                o.paymentValidated
                                  ? "bg-white/10 text-white/60 hover:bg-white/20"
                                  : "bg-green-500 hover:bg-green-400 text-white shadow-lg"
                              }`}
                            >
                              {o.paymentValidated
                                ? "Révoquer Validation"
                                : "✅ Valider Réception du Dépôt"}
                            </button>
                          </div>
                        ) : (
                          <div className="p-4 bg-white/5 rounded-2xl border border-white/10 flex justify-between items-center">
                            <span className="text-xs font-black uppercase text-brand-gold italic">
                              💵 Paiement en Espèces
                            </span>
                            <span className="text-[8px] font-bold text-gray-400 uppercase bg-white/5 px-2.5 py-1 rounded-full">
                              Au livreur
                            </span>
                          </div>
                        )}

                        {/* Driver Status / Alert */}
                        {o.driverIssue && (
                          <div className="p-3 bg-red-500/20 border border-red-500/40 rounded-xl text-red-200 text-xs font-bold">
                            ⚠️ Alerte Livreur : {o.driverIssue}
                          </div>
                        )}

                        {/* Dispatch Livreur Billo Express (+227 92 08 08 22) */}
                        <div className="p-4 bg-[#2C1810] border border-brand-gold/30 rounded-2xl space-y-2.5">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <Bike className="text-brand-gold" size={16} />
                              <span className="text-[10px] font-black uppercase text-brand-gold italic">
                                Livreur Billo Express (+227 92 08 08 22)
                              </span>
                            </div>
                            <span className="text-[8px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-black uppercase">
                              Prêt
                            </span>
                          </div>

                          <div className="flex flex-col sm:flex-row gap-2 pt-1">
                            <a
                              href={`https://wa.me/22792080822?text=${encodeURIComponent(
                                `🛵 *ORDRE DE MISSION LIVRAISON BILLO EXPRESS*\n` +
                                  `📋 *Commande*: ${o.id}\n` +
                                  `👤 *Client*: ${o.customerName}\n` +
                                  `📞 *Tél Client*: ${o.phone}\n` +
                                  `📍 *Quartier/Adresse*: ${o.district} - ${o.address || "Standard"}\n` +
                                  `🍲 *Articles*: ${o.items.map((i) => `${i.quantity}x ${i.name}`).join(", ")}\n` +
                                  `💰 *Total à encaisser*: ${o.total + o.deliveryFee} F CFA (${o.paymentType === "MOBILE_MONEY" ? "PAYÉ MOBILE MONEY" : "ESPÈCES AU LIVREUR"})\n\n` +
                                  `📍 *Point de retrait*: Resto Khady's Food (Mosquée Khadafi)\n` +
                                  `Merci de confirmer la prise en charge !`,
                              )}`}
                              target="_blank"
                              rel="noreferrer"
                              onClick={() =>
                                updateOrderStatus(
                                  o.id,
                                  "DELIVERING" as OrderStatus,
                                )
                              }
                              className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white p-2.5 rounded-xl text-[9px] font-black uppercase italic flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all text-center"
                            >
                              <MessageCircle size={14} /> WhatsApp Livreur (+227 92 08 08 22)
                            </a>

                            <a
                              href="tel:+22792080822"
                              className="bg-white/10 hover:bg-white/20 text-brand-gold p-2.5 rounded-xl text-[9px] font-black uppercase italic flex items-center justify-center gap-1 border border-white/10 active:scale-95 transition-all"
                            >
                              <Phone size={14} /> Appeler
                            </a>
                          </div>
                        </div>

                        {/* Status Changers */}
                        <div className="space-y-1.5">
                          <label className="text-[8px] font-black uppercase text-white/40 tracking-widest">
                            Changer Statut Commande :
                          </label>
                          <div className="grid grid-cols-3 gap-1.5">
                            {[
                              "CONFIRMED",
                              "PREPARING",
                              "READY",
                              "DELIVERING",
                              "DELIVERED",
                              "CANCELLED",
                            ].map((s) => (
                              <button
                                key={s}
                                onClick={() =>
                                  updateOrderStatus(o.id, s as OrderStatus)
                                }
                                className={`p-2 rounded-xl text-[8px] font-black uppercase transition-all ${
                                  o.status === s
                                    ? "bg-brand-orange text-white shadow-md"
                                    : "bg-white/5 text-white/40 hover:bg-white/10"
                                }`}
                              >
                                {s}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );

      case AdminView.EVENT:
        return (
          <div className="space-y-6 animate-fade-in">
            <h3 className="text-xl font-black italic uppercase text-brand-gold">
              Gestion Événements
            </h3>
            <div className="bg-white/5 p-8 rounded-[3rem] border border-white/5 space-y-6">
              <div className="p-6 bg-brand-orange/10 border border-brand-orange/20 rounded-3xl flex justify-between items-center transition-all hover:bg-brand-orange/20 cursor-pointer">
                <div>
                  <h4 className="font-black text-white italic text-sm">
                    Mariage Royal - Plateau
                  </h4>
                  <p className="text-[10px] text-white/40 uppercase font-bold">
                    200 Invités • 20 Décembre • En attente de devis
                  </p>
                </div>
                <button className="bg-brand-orange text-white px-5 py-2 rounded-xl text-[9px] font-black uppercase shadow-lg">
                  Éditer
                </button>
              </div>
              <div className="p-6 bg-white/5 border border-white/10 rounded-3xl flex justify-between items-center opacity-40">
                <div>
                  <h4 className="font-black text-white italic text-sm">
                    Cocktail Pro - Yantala
                  </h4>
                  <p className="text-[10px] text-white/40 uppercase font-bold">
                    50 Personnes • Terminé
                  </p>
                </div>
                <CheckCircle2 size={20} className="text-green-500" />
              </div>
            </div>
          </div>
        );

      case AdminView.BUFFET:
        return (
          <div className="space-y-6 animate-fade-in">
            <h3 className="text-xl font-black italic uppercase text-brand-gold">
              Packs Buffet Pro
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {items
                .filter(
                  (i) => i.category === "Pack-Buffet" || i.category === "Pack",
                )
                .map((p, i) => (
                  <div
                    key={i}
                    className="bg-white/5 p-6 rounded-[2.5rem] border border-white/5 flex gap-5 items-center"
                  >
                    <img
                      src={p.image}
                      className="w-20 h-20 rounded-2xl object-cover shadow-lg"
                    />
                    <div className="flex-1">
                      <h4 className="font-black text-[10px] text-brand-gold italic uppercase">
                        {p.name}
                      </h4>
                      <p className="text-brand-orange font-black text-sm">
                        {p.price} F
                      </p>
                    </div>
                    <button
                      onClick={() => setEditingItem(p)}
                      className="p-3 bg-white/5 rounded-xl text-white/40 hover:text-white transition-all"
                    >
                      <Edit3 size={16} />
                    </button>
                  </div>
                ))}
            </div>
          </div>
        );

      case AdminView.CLIENTS:
        return (
          <div className="space-y-6 animate-fade-in">
            <h3 className="text-xl font-black italic uppercase text-brand-gold">
              Gestion Clientèle Elite
            </h3>
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
                    {
                      name: "Abdou R.",
                      rank: "Gold",
                      points: 1250,
                      date: "Aujourd'hui",
                    },
                    {
                      name: "Mariama K.",
                      rank: "Silver",
                      points: 450,
                      date: "Hier",
                    },
                    {
                      name: "Issoufou Z.",
                      rank: "Platinum",
                      points: 5200,
                      date: "Il y a 2 jours",
                    },
                  ].map((c, i) => (
                    <tr
                      key={i}
                      className="border-t border-white/5 hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="p-6 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-white/10" />{" "}
                        {c.name}
                      </td>
                      <td className="p-6">
                        <span
                          className={`px-3 py-1 rounded-full text-[7px] ${c.rank === "Platinum" ? "bg-brand-gold text-brand-brown" : "bg-white/10 text-white/60"}`}
                        >
                          {c.rank}
                        </span>
                      </td>
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
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="text-xl font-black italic uppercase text-brand-gold">
                  Flotte & Dispatch Billo Express
                </h3>
                <p className="text-[10px] font-bold text-white/50 uppercase">
                  Ligne directe Administrateur ↔ Livreur : +227 92 08 08 22
                </p>
              </div>
              <a
                href="https://wa.me/22792080822?text=Bonjour%20Billo%20Express,%20message%20de%20l'administration%20Khady's%20Food."
                target="_blank"
                rel="noreferrer"
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-3 rounded-2xl text-[9px] font-black uppercase italic shadow-lg flex items-center gap-2 active:scale-95 transition-all"
              >
                <MessageCircle size={16} /> WhatsApp Livreur (+227 92 08 08 22)
              </a>
            </div>

            {/* Carte Centrale Livreur Principal Billo Express */}
            <div className="bg-gradient-to-r from-[#2C1810] via-[#3D2116] to-[#1A0F0D] p-6 sm:p-8 rounded-[3rem] border-2 border-brand-gold/40 shadow-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-brand-gold/20 rounded-3xl border border-brand-gold/50 flex items-center justify-center text-3xl shadow-inner shrink-0">
                  🚲
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                    <h4 className="font-black text-base text-white italic uppercase">
                      Centrale Livreur Billo Express
                    </h4>
                  </div>
                  <p className="text-xs font-black text-brand-gold font-mono mt-1">
                    Contact WhatsApp : +227 92 08 08 22
                  </p>
                  <p className="text-[9px] text-white/60 uppercase font-bold mt-1">
                    Responsable acheminement des commandes Khady's Food à Niamey
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                <a
                  href="https://wa.me/22792080822"
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 md:flex-none bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-3 rounded-2xl text-[9px] font-black uppercase italic flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"
                >
                  <MessageCircle size={15} /> Discuter WhatsApp
                </a>
                <a
                  href="tel:+22792080822"
                  className="flex-1 md:flex-none bg-white/10 hover:bg-white/20 text-brand-gold px-5 py-3 rounded-2xl text-[9px] font-black uppercase italic flex items-center justify-center gap-1.5 border border-white/10 active:scale-95 transition-all"
                >
                  <Phone size={15} /> Appeler
                </a>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                {
                  name: "Billo Express (Livreur Principal)",
                  status: "Disponible",
                  zone: "Niamey Centre & Périphérie",
                  phone: "+227 92 08 08 22",
                  isPrimary: true,
                },
                {
                  name: "Sani D.",
                  status: "En livraison",
                  zone: "Plateau / Yantala",
                  phone: "+227 96 00 00 01",
                  isPrimary: false,
                },
                {
                  name: "Moussa B.",
                  status: "Disponible",
                  zone: "Base 11 / Aéroport",
                  phone: "+227 96 00 00 02",
                  isPrimary: false,
                },
                {
                  name: "Idé G.",
                  status: "En pause",
                  zone: "Goudel / Bobiel",
                  phone: "+227 96 00 00 03",
                  isPrimary: false,
                },
              ].map((l, i) => (
                <div
                  key={i}
                  className={`p-6 rounded-[2.5rem] border flex items-center gap-5 transition-all ${
                    l.isPrimary
                      ? "bg-[#2A160E] border-brand-gold/50 shadow-xl"
                      : "bg-white/5 border-white/5"
                  }`}
                >
                  <div className="w-16 h-16 bg-brand-orange/20 rounded-2xl flex items-center justify-center text-brand-orange shrink-0">
                    <Bike size={32} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-black text-xs text-white italic uppercase truncate">
                      {l.name}
                    </h4>
                    <p className="text-[9px] font-bold text-brand-gold font-mono uppercase mb-2">
                      {l.phone}
                    </p>
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${l.status === "En livraison" ? "bg-brand-orange" : l.status === "Disponible" ? "bg-green-500" : "bg-gray-500"}`}
                      />
                      <span className="text-[8px] font-black uppercase text-white/60 tracking-widest truncate">
                        {l.status} • {l.zone}
                      </span>
                    </div>
                  </div>
                  <a
                    href={`https://wa.me/${l.phone.replace(/[^0-9]/g, "")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-white/5 p-3.5 rounded-xl text-emerald-400 hover:text-white hover:bg-emerald-600 transition-all shrink-0"
                    title="WhatsApp"
                  >
                    <MessageCircle size={18} />
                  </a>
                </div>
              ))}
            </div>
          </div>
        );

      case AdminView.AI_MARKETING:
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-white/5 p-8 sm:p-10 rounded-[3rem] border border-white/5 relative overflow-hidden shadow-2xl">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-black italic uppercase text-brand-gold flex items-center gap-3">
                  <Zap className="text-brand-orange" /> Analyseur de Stock IA
                </h3>
                <button
                  onClick={runAiStrategy}
                  disabled={isAiLoading}
                  className="bg-brand-orange text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase flex items-center gap-3 shadow-lg hover:scale-105 transition-all"
                >
                  {isAiLoading ? (
                    <RefreshCw className="animate-spin" size={16} />
                  ) : (
                    <Sparkles size={16} />
                  )}{" "}
                  Analyser le Stock
                </button>
              </div>
              {aiStrategy ? (
                <div className="p-6 bg-black/40 rounded-3xl border border-white/10 text-brand-gold/80 italic text-sm leading-relaxed animate-fade-in mb-6">
                  {aiStrategy}
                </div>
              ) : (
                <div className="text-center py-10 opacity-40 italic text-xs mb-6">
                  Cliquez sur Analyser pour recevoir un conseil stratégique
                  instantané...
                </div>
              )}
            </div>

            {/* Générateur de Promotions IA pour Admin */}
            <AIPromoGenerator />
          </div>
        );

      case AdminView.BLOG_MGMT:
        return (
          <BlogMgmtView posts={posts} setPosts={setPosts} menuItems={items} />
        );

      case AdminView.GALLERY_MGMT:
        return (
          <GalleryMgmtView
            items={galleryItems}
            setItems={setGalleryItems}
            menuItems={items}
          />
        );

      case AdminView.CLIENTS:
        return <ClientsMgmtView clients={clients} setClients={setClients} />;

      case AdminView.SETTINGS:
        return (
          <div className="space-y-8 animate-fade-in">
            {/* Centre de Gestion Supabase Cloud & Clés d'Environnement */}
            <div className="bg-gradient-to-br from-emerald-950/50 via-[#132219] to-[#0D1812] p-8 sm:p-10 rounded-[3rem] border-2 border-emerald-500/40 space-y-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 pointer-events-none opacity-10">
                <Cloud size={140} className="text-emerald-400" />
              </div>

              {/* En-tête Supabase */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-emerald-500/20 pb-6">
                <div className="flex items-center gap-4">
                  <div className={`p-4 rounded-2xl shadow-xl shrink-0 ${isCloudConnected ? "bg-emerald-500 text-black" : "bg-white/10 text-white/50"}`}>
                    <Cloud size={28} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${isCloudConnected ? "bg-emerald-400 animate-pulse" : "bg-white/30"}`} />
                      <h4 className="text-lg sm:text-xl font-black italic uppercase text-emerald-300">
                        Supabase Cloud & Clés d'Environnement
                      </h4>
                    </div>
                    <p className="text-[10px] text-white/60 font-medium mt-1">
                      Configurez et testez votre base de données distante pour synchroniser en temps réel les plats et commandes.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                    isCloudConnected
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                      : "bg-white/10 text-white/50 border-white/20"
                  }`}>
                    {isCloudConnected ? "🟢 Cloud Connecté" : "⚪ Non configuré (Local)"}
                  </span>
                </div>
              </div>

              {/* Formulaire des Clés */}
              <div className="grid grid-cols-1 gap-5">
                {/* Champ VITE_SUPABASE_URL */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black uppercase text-emerald-300 tracking-wider flex items-center gap-1.5">
                      <Key size={12} /> VITE_SUPABASE_URL (URL du Projet)
                    </label>
                    {derivedJwtUrl ? (
                      <span className="text-[8px] font-black text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-full border border-emerald-500/30">
                        ✨ Détectée depuis votre clé Anon
                      </span>
                    ) : (
                      <span className="text-[8px] text-white/40">Ex: https://xyzcompany.supabase.co</span>
                    )}
                  </div>
                  <input
                    type="url"
                    value={supabaseUrlInput}
                    onChange={(e) => handleSupabaseUrlChange(e.target.value)}
                    placeholder="https://votre-projet.supabase.co"
                    className="w-full p-4 bg-black/40 rounded-2xl text-white font-mono text-xs border border-emerald-500/30 outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/50 transition-all placeholder:text-white/20"
                  />
                </div>

                {/* Champ VITE_SUPABASE_ANON_KEY */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black uppercase text-emerald-300 tracking-wider flex items-center gap-1.5">
                      <Key size={12} /> VITE_SUPABASE_ANON_KEY (Clé Publique Anonyme)
                    </label>
                    <div className="flex items-center gap-2">
                      {supabaseKeyInput && (
                        <button
                          type="button"
                          onClick={() => setSupabaseKeyInput("")}
                          className="text-[9px] text-red-400 hover:text-red-300 font-bold"
                        >
                          Vider
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setShowSupabaseKey(!showSupabaseKey)}
                        className="text-[9px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-bold"
                      >
                        {showSupabaseKey ? <EyeOff size={12} /> : <Eye size={12} />}
                        {showSupabaseKey ? "Masquer" : "Afficher"}
                      </button>
                    </div>
                  </div>
                  <div className="relative">
                    <input
                      type={showSupabaseKey ? "text" : "password"}
                      value={supabaseKeyInput}
                      onChange={(e) => handleSupabaseKeyChange(e.target.value)}
                      placeholder="Collez ici votre clé commençant par eyJ... ou sb_publishable_..."
                      className={`w-full p-4 pr-12 bg-black/40 rounded-2xl text-white font-mono text-xs border outline-none transition-all placeholder:text-white/20 ${
                        supabaseKeyInput && !keyValidation.isValidFormat
                          ? "border-amber-500 focus:border-amber-400"
                          : "border-emerald-500/30 focus:border-emerald-400"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowSupabaseKey(!showSupabaseKey)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                    >
                      {showSupabaseKey ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {supabaseKeyInput && !keyValidation.isValidFormat && (
                    <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-200 text-[9.5px] flex items-start justify-between gap-2">
                      <span>{keyValidation.warningMessage}</span>
                      <button
                        type="button"
                        onClick={() => setSupabaseKeyInput("")}
                        className="bg-amber-500 text-black px-2.5 py-1 rounded-lg font-black uppercase text-[8px] shrink-0"
                      >
                        Effacer
                      </button>
                    </div>
                  )}
                  {supabaseKeyInput && keyValidation.isValidFormat && (
                    <p className="text-[9px] text-emerald-400 font-bold">
                      ✅ Format de clé Supabase valide ({keyValidation.keyType === "publishable" ? "Publishable Key sb_publishable_..." : "Clé JWT Anon eyJ..."})
                    </p>
                  )}
                  <p className="text-[8.5px] text-white/40">
                    Astuce : Dans Supabase &gt; <strong>Project Settings (⚙️)</strong> &gt; <strong>API Keys</strong>, cliquez sur <strong>Copy</strong> à côté de la clé <strong>anon public</strong> (<code>eyJ...</code>) ou <strong>Publishable key</strong> (<code>sb_publishable_...</code>).
                  </p>
                </div>

                {/* Paramètre Auto-Sync */}
                <div className="p-5 bg-black/30 rounded-2xl border border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black uppercase text-white italic">
                        ⚡ Synchronisation automatique vers Supabase (Auto-Push)
                      </span>
                      <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${
                        supabaseAutoSync ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-white/10 text-white/40"
                      }`}>
                        {supabaseAutoSync ? "Activée" : "Désactivée"}
                      </span>
                    </div>
                    <p className="text-[9.5px] text-white/60">
                      Pousser immédiatement chaque plat ajouté ou modifié vers la table Cloud <code>menu_items</code> de Supabase.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleAutoSync(!supabaseAutoSync)}
                    className={`px-5 py-2.5 rounded-xl font-black text-[9px] uppercase tracking-wider transition-all shrink-0 active:scale-95 ${
                      supabaseAutoSync
                        ? "bg-emerald-500 text-black shadow-lg"
                        : "bg-white/10 text-white/50 hover:bg-white/20"
                    }`}
                  >
                    {supabaseAutoSync ? "AUTO-SYNC : OUI" : "AUTO-SYNC : NON"}
                  </button>
                </div>
              </div>

              {/* Boutons d'Action & Tests */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleTestSupabaseConnection}
                  disabled={isTestingSupabase}
                  className="flex-1 sm:flex-none bg-emerald-500 hover:bg-emerald-400 text-black px-5 py-3.5 rounded-2xl font-black text-[10px] uppercase italic flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-all disabled:opacity-50"
                >
                  <RefreshCw size={15} className={isTestingSupabase ? "animate-spin" : ""} />
                  {isTestingSupabase ? "Test en cours..." : "Tester la Connexion"}
                </button>

                <button
                  type="button"
                  onClick={handleSaveSupabaseConfig}
                  className="flex-1 sm:flex-none bg-brand-gold hover:bg-amber-400 text-brand-brown px-5 py-3.5 rounded-2xl font-black text-[10px] uppercase italic flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-all"
                >
                  <Save size={15} /> Enregistrer les Clés
                </button>

                <button
                  type="button"
                  onClick={handlePushAllMenuToSupabase}
                  disabled={isPushingMenuToSupabase}
                  className="flex-1 sm:flex-none bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-5 py-3.5 rounded-2xl font-black text-[10px] uppercase italic border border-emerald-400/30 flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-all disabled:opacity-50"
                >
                  <CloudUpload size={15} className={isPushingMenuToSupabase ? "animate-bounce" : ""} />
                  {isPushingMenuToSupabase ? "Synchronisation..." : `Pousser tous les Plats (${items.length})`}
                </button>

                <button
                  type="button"
                  onClick={() => setShowSqlSchemaModal(true)}
                  className="flex-1 sm:flex-none bg-white/10 hover:bg-white/20 text-white px-4 py-3.5 rounded-2xl font-black text-[10px] uppercase italic border border-white/10 flex items-center justify-center gap-2 active:scale-95 transition-all"
                >
                  <Database size={15} /> Script SQL (Schema)
                </button>

                <button
                  type="button"
                  onClick={handleResetSupabaseConfig}
                  className="text-white/40 hover:text-white px-3 py-3.5 text-[9px] font-black uppercase italic transition-colors"
                >
                  Réinitialiser
                </button>
              </div>

              {/* Rapport de Test Live */}
              {supabaseTestReport && (
                <div
                  className={`p-5 rounded-2xl border ${
                    supabaseTestReport.success
                      ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-200"
                      : supabaseTestReport.details?.missingTables
                      ? "bg-amber-500/15 border-amber-500/40 text-amber-200"
                      : "bg-red-500/15 border-red-500/40 text-red-200"
                  } space-y-3 animate-fade-in`}
                >
                  <div className="flex items-center gap-2.5">
                    {supabaseTestReport.success ? (
                      <CheckCircle className="text-emerald-400 shrink-0" size={20} />
                    ) : supabaseTestReport.details?.missingTables ? (
                      <AlertCircle className="text-amber-400 shrink-0" size={20} />
                    ) : (
                      <AlertCircle className="text-red-400 shrink-0" size={20} />
                    )}
                    <div>
                      <h5 className="font-black text-xs uppercase tracking-wide">
                        {supabaseTestReport.success
                          ? "Connexion Réussie avec Supabase Cloud !"
                          : supabaseTestReport.details?.missingTables
                          ? "Serveur Connecté — Tables SQL à Créer"
                          : "Échec du Test de Connexion"}
                      </h5>
                      <p className="text-[10px] opacity-90 mt-0.5">{supabaseTestReport.message}</p>
                    </div>
                  </div>

                  {supabaseTestReport.details && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-white/10 text-[9px]">
                      <div className="bg-black/30 p-2.5 rounded-xl">
                        <span className="opacity-60 block">Table menu_items</span>
                        <strong
                          className={
                            supabaseTestReport.details.menuTableStatus === "ok"
                              ? "text-emerald-400"
                              : supabaseTestReport.details.menuTableStatus === "missing"
                              ? "text-amber-400"
                              : "text-red-400"
                          }
                        >
                          {supabaseTestReport.details.menuTableStatus === "ok"
                            ? "✅ Opérationnelle"
                            : supabaseTestReport.details.menuTableStatus === "missing"
                            ? "⚠️ Table à créer (SQL)"
                            : "❌ Injoignable"}
                        </strong>
                      </div>
                      <div className="bg-black/30 p-2.5 rounded-xl">
                        <span className="opacity-60 block">Table orders</span>
                        <strong
                          className={
                            supabaseTestReport.details.ordersTableStatus === "ok"
                              ? "text-emerald-400"
                              : supabaseTestReport.details.ordersTableStatus === "missing"
                              ? "text-amber-400"
                              : "text-red-400"
                          }
                        >
                          {supabaseTestReport.details.ordersTableStatus === "ok"
                            ? "✅ Opérationnelle"
                            : supabaseTestReport.details.ordersTableStatus === "missing"
                            ? "⚠️ Table à créer (SQL)"
                            : "❌ Injoignable"}
                        </strong>
                      </div>
                      <div className="bg-black/30 p-2.5 rounded-xl">
                        <span className="opacity-60 block">Temps de Réponse</span>
                        <strong className="text-white">{supabaseTestReport.latencyMs || "< 100"} ms</strong>
                      </div>
                    </div>
                  )}

                  {supabaseTestReport.details?.missingTables && (
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setShowSqlSchemaModal(true);
                          handleCopySqlSchema();
                        }}
                        className="w-full bg-brand-gold hover:bg-amber-400 text-brand-brown py-3 px-4 rounded-xl font-black text-[10px] uppercase italic shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all"
                      >
                        <Copy size={15} /> Copier & Voir le Script SQL à coller dans Supabase
                      </button>
                    </div>
                  )}

                  {!supabaseTestReport.success && !supabaseTestReport.details?.missingTables && (
                    <div className="text-[9px] bg-black/40 p-3 rounded-xl border border-white/5 space-y-1">
                      <p className="font-bold text-white">Astuce de dépannage :</p>
                      <p>
                        1. Collez votre clé <strong>anon (public)</strong> commençant par <code>eyJ...</code> : l'URL exacte du projet sera détectée automatiquement.
                      </p>
                      <p>
                        2. Vérifiez sur <strong>supabase.com/dashboard</strong> que votre projet est bien <strong>Active</strong> (et non <em>Paused</em>).
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Rapport de Push Live */}
              {pushMenuSummary && (
                <div
                  className={`p-4 rounded-2xl border ${
                    pushMenuSummary.success
                      ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-200"
                      : "bg-red-500/15 border-red-500/40 text-red-200"
                  } flex items-center justify-between gap-3 text-[10px] animate-fade-in`}
                >
                  <div className="flex items-center gap-2">
                    <CloudUpload size={16} />
                    <span>{pushMenuSummary.message}</span>
                  </div>
                  <button
                    onClick={() => setPushMenuSummary(null)}
                    className="p-1 hover:bg-white/10 rounded-lg text-white/60 hover:text-white"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
            </div>

            <h3 className="text-xl font-black italic uppercase text-brand-gold">
              Configuration de l'Établissement
            </h3>
            <div className="bg-white/5 p-10 rounded-[3rem] border border-white/5 space-y-8">
              <div className="flex items-center justify-between p-6 bg-black/20 rounded-3xl border border-white/5">
                <div>
                  <h4 className="font-black text-white italic text-sm uppercase">
                    Statut Restaurant
                  </h4>
                  <p className="text-[10px] text-white/40 uppercase font-bold tracking-widest">
                    {isRestaurantOpen
                      ? "Ouvert - Accepte les commandes"
                      : "Fermé - Indisponible"}
                  </p>
                </div>
                <button
                  onClick={() => setIsRestaurantOpen(!isRestaurantOpen)}
                  className={`w-16 h-8 rounded-full relative p-1 transition-all ${isRestaurantOpen ? "bg-brand-orange" : "bg-white/10"}`}
                >
                  <div
                    className={`w-6 h-6 bg-white rounded-full transition-all ${isRestaurantOpen ? "translate-x-8" : "translate-x-0"} shadow-xl`}
                  ></div>
                </button>
              </div>
              <div className="space-y-2">
                <h4 className="font-black text-brand-gold uppercase text-[10px] ml-4 tracking-[0.3em]">
                  Contact WhatsApp Live
                </h4>
                <input
                  className="w-full p-5 bg-white/5 rounded-2xl text-white font-bold border border-white/10 outline-none focus:border-brand-gold"
                  defaultValue="+227 74 44 16 21"
                />
              </div>
              <div className="space-y-2">
                <h4 className="font-black text-brand-gold uppercase text-[10px] ml-4 tracking-[0.3em]">
                  Code Promo Actif
                </h4>
                <input
                  className="w-full p-5 bg-white/5 rounded-2xl text-white font-bold border border-white/10 outline-none focus:border-brand-gold"
                  defaultValue="KHADY24"
                />
              </div>
              <button className="w-full bg-brand-gold text-brand-brown py-6 rounded-3xl font-black uppercase italic shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-all">
                <Save size={20} /> Appliquer les Paramètres
              </button>
            </div>

            {/* Centre de Sécurité & Sauvegarde des Données */}
            <div className="bg-white/5 p-8 sm:p-10 rounded-[3rem] border-2 border-brand-gold/20 space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-brand-gold/20 flex items-center justify-center text-brand-gold">
                  <Database size={20} />
                </div>
                <div>
                  <h4 className="text-base font-black italic uppercase text-brand-gold">
                    Centre de Sauvegarde & Sécurité des Données
                  </h4>
                  <p className="text-[10px] text-white/50">
                    Stockage local persistant garanti (IndexedDB) + Sauvegardes manuelles exportables
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
                <button
                  onClick={handleExportBackup}
                  className="bg-white/5 hover:bg-white/10 p-5 rounded-2xl border border-white/10 flex flex-col items-start gap-2 text-left group transition-all"
                >
                  <Download size={20} className="text-brand-gold group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-black uppercase italic text-white">
                    Exporter Sauvegarde (.json)
                  </span>
                  <span className="text-[9px] text-white/40">
                    Téléchargez l'intégralité du menu, blogs et commandes en un fichier.
                  </span>
                </button>

                <button
                  onClick={() => backupFileInputRef.current?.click()}
                  className="bg-white/5 hover:bg-white/10 p-5 rounded-2xl border border-white/10 flex flex-col items-start gap-2 text-left group transition-all"
                >
                  <Upload size={20} className="text-emerald-400 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-black uppercase italic text-white">
                    Restaurer Sauvegarde (.json)
                  </span>
                  <span className="text-[9px] text-white/40">
                    Importez un fichier JSON précédemment sauvegardé.
                  </span>
                </button>

                <button
                  onClick={handleRestoreSnapshot}
                  className="bg-white/5 hover:bg-white/10 p-5 rounded-2xl border border-white/10 flex flex-col items-start gap-2 text-left group transition-all"
                >
                  <RefreshCw size={20} className="text-amber-400 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-black uppercase italic text-white">
                    Snapshot de Secours
                  </span>
                  <span className="text-[9px] text-white/40">
                    Récupère la dernière version automatique stockée dans IndexedDB.
                  </span>
                </button>

                <button
                  onClick={handleResetFactoryMenu}
                  className="bg-red-500/10 hover:bg-red-500/20 p-5 rounded-2xl border border-red-500/20 flex flex-col items-start gap-2 text-left group transition-all"
                >
                  <Trash2 size={20} className="text-red-400 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-black uppercase italic text-red-300">
                    Menu d'Origine (Reset)
                  </span>
                  <span className="text-[9px] text-red-400/60">
                    Réinitialise le menu aux 10 plats d'origine de Khady's Food.
                  </span>
                </button>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center py-20 text-white/20 italic">
            Module en développement...
          </div>
        );
    }
  };

  const navList = [
    { v: AdminView.DASHBOARD, i: LayoutDashboard, l: "Accueil" },
    { v: AdminView.WHATSAPP_AUTOMATION, i: Bot, l: "WhatsApp 24/7" },
    { v: AdminView.ORDERS, i: ShoppingBag, l: "Commandes" },
    { v: AdminView.MENU_MGMT, i: Utensils, l: "Carte & Plats" },
    { v: AdminView.BLOG_MGMT, i: BookOpen, l: "Blog" },
    { v: AdminView.GALLERY_MGMT, i: Camera, l: "Galerie" },
    { v: AdminView.DELIVERY, i: Bike, l: "Livreurs" },
    { v: AdminView.CLIENTS, i: Users, l: "Clients" },
    { v: AdminView.AI_MARKETING, i: Zap, l: "Marketing" },
    { v: AdminView.SETTINGS, i: Settings, l: "Paramètres" },
  ];

  return (
    <div className="min-h-screen w-full bg-[#0F0807] text-white flex flex-col md:flex-row font-sans overflow-x-hidden">
      <input
        type="file"
        ref={adminPhotoInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleAdminPhotoChange}
      />

      {/* Floating Status Toast Notification */}
      {backupStatusMessage && (
        <div className="fixed top-3 left-1/2 -translate-x-1/2 z-[300] w-[92%] max-w-lg animate-bounce-short shadow-2xl">
          <div
            className={`p-4 rounded-2xl border backdrop-blur-xl flex items-center justify-between gap-3 text-xs font-bold ${
              backupStatusMessage.includes("Erreur") ||
              backupStatusMessage.includes("Échec") ||
              backupStatusMessage.includes("invalide")
                ? "bg-red-950/95 border-red-500 text-red-200"
                : backupStatusMessage.includes("⚠️")
                ? "bg-amber-950/95 border-amber-500 text-amber-200"
                : "bg-emerald-950/95 border-emerald-400 text-emerald-100"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span className="text-base shrink-0">
                {backupStatusMessage.includes("Erreur") || backupStatusMessage.includes("Échec")
                  ? "❌"
                  : backupStatusMessage.includes("⚠️")
                  ? "⚠️"
                  : "🚀"}
              </span>
              <p className="leading-snug">{backupStatusMessage}</p>
            </div>
            <button
              onClick={() => setBackupStatusMessage(null)}
              className="p-1 rounded-lg hover:bg-white/10 text-white/70 hover:text-white shrink-0"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Sidebar Desktop (PC / Tablettes) */}
      <div className="hidden md:flex md:w-28 bg-black/40 border-r border-white/5 flex-col items-center py-8 gap-5 overflow-y-auto no-scrollbar shrink-0">
        <KhadyLogo variant="light" className="scale-75 mb-4" />
        {navList.map((n) => (
          <button
            key={n.l}
            onClick={() => {
              setCurrentView(n.v);
              playSound("pop");
            }}
            className={`flex flex-col items-center transition-all duration-300 w-full px-2 ${currentView === n.v ? "scale-105 opacity-100" : "opacity-30 hover:opacity-100"}`}
          >
            <div
              className={`p-3 rounded-2xl transition-colors ${currentView === n.v ? "bg-brand-orange text-white shadow-xl" : "bg-white/5"}`}
            >
              <n.i size={20} />
            </div>
            <span className="text-[7px] mt-1.5 font-black tracking-widest uppercase text-center w-full leading-tight truncate">
              {n.l}
            </span>
          </button>
        ))}
        <button
          onClick={onExit}
          className="mt-auto p-3.5 bg-red-500/10 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all active:scale-90"
          title="Quitter le mode Admin"
        >
          <Power size={20} />
        </button>
      </div>

      {/* Top Header & Navigation Mobile */}
      <div className="md:hidden bg-black/80 border-b border-white/10 flex flex-col shrink-0 sticky top-0 z-40 backdrop-blur-xl">
        <div className="p-3.5 flex justify-between items-center border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <KhadyLogo variant="light" className="scale-75" />
            <div>
              <h2 className="text-xs font-black italic uppercase text-brand-gold tracking-widest leading-none">
                Admin Console
              </h2>
              <p className="text-[7px] text-white/40 font-black uppercase mt-0.5">
                Khady's Food Niamey
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setShowSupabaseSettingsModal(true);
                playSound("pop");
              }}
              className={`px-2.5 py-1.5 rounded-xl text-[8.5px] font-black uppercase italic flex items-center gap-1.5 border transition-all active:scale-95 shadow-md ${
                isCloudConnected
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                  : "bg-amber-500/25 text-amber-300 border-amber-500/50 animate-pulse"
              }`}
              title="Ouvrir les Paramètres Supabase"
            >
              <Cloud size={13} />
              <span>{isCloudConnected ? "Supabase" : "⚙️ Supabase"}</span>
            </button>
            <button
              onClick={() => adminPhotoInputRef.current?.click()}
              className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden cursor-pointer"
              title="Changer la photo admin"
            >
              {adminAvatar ? (
                <img src={adminAvatar} className="w-full h-full object-cover" />
              ) : (
                <Camera className="text-brand-gold opacity-40" size={15} />
              )}
            </button>
            <button
              onClick={onExit}
              className="px-3 py-1.5 bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl text-[9px] font-black uppercase italic flex items-center gap-1 active:scale-95"
            >
              <Power size={13} /> Quitter
            </button>
          </div>
        </div>

        {/* Barre de navigation horizontale défilable pour Mobile */}
        <div className="flex overflow-x-auto p-2 gap-2 no-scrollbar bg-black/40 border-t border-white/5">
          {navList.map((n) => {
            const isActive = currentView === n.v;
            return (
              <button
                key={n.l}
                onClick={() => {
                  setCurrentView(n.v);
                  playSound("pop");
                }}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider whitespace-nowrap transition-all shrink-0 ${
                  isActive
                    ? "bg-brand-orange text-white shadow-lg border border-brand-orange/40 scale-105"
                    : "bg-white/5 text-white/50 hover:bg-white/10 border border-white/5"
                }`}
              >
                <n.i
                  size={14}
                  className={isActive ? "text-white" : "text-brand-gold"}
                />
                <span>{n.l}</span>
                {n.v === AdminView.SETTINGS && !isCloudConnected && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping ml-0.5" />
                )}
              </button>
            );
          })}
          <button
            onClick={() => {
              setShowSupabaseSettingsModal(true);
              playSound("pop");
            }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider whitespace-nowrap transition-all shrink-0 border ${
              isCloudConnected
                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                : "bg-amber-500/25 text-amber-300 border-amber-500/50 animate-pulse"
            }`}
          >
            <Cloud size={14} />
            <span>⚙️ Clés Supabase</span>
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="hidden md:flex p-6 md:p-8 justify-between items-center border-b border-white/5 bg-black/20 backdrop-blur-md relative z-20">
          <div>
            <h2 className="text-sm font-black italic uppercase text-brand-gold tracking-[0.3em] leading-none">
              Console Admin Elite
            </h2>
            <p className="text-[8px] text-white/20 font-black uppercase mt-1">
              Terminal de Contrôle Niamey
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setShowSupabaseSettingsModal(true);
                playSound("pop");
              }}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase italic border transition-all flex items-center gap-2 active:scale-95 shadow-md ${
                isCloudConnected
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30"
                  : "bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30 animate-pulse"
              }`}
            >
              <Cloud size={14} />
              <span>{isCloudConnected ? "Supabase Cloud" : "⚙️ Paramètres Supabase"}</span>
            </button>
            <button
              onClick={onExit}
              className="px-4 py-2 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-xl text-[10px] font-black uppercase italic transition-all flex items-center gap-1.5"
            >
              <Power size={14} /> Quitter Admin
            </button>
            <div
              onClick={() => adminPhotoInputRef.current?.click()}
              className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center relative group cursor-pointer overflow-hidden shadow-2xl hover:border-brand-orange transition-all"
            >
              {adminAvatar ? (
                <img src={adminAvatar} className="w-full h-full object-cover" />
              ) : (
                <Camera className="text-brand-gold opacity-20" size={20} />
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                <Camera size={16} className="text-white" />
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-10 no-scrollbar bg-gradient-to-br from-transparent to-brand-orange/[0.02]">
          {renderContent()}
        </div>
      </div>

      {/* Modal d'édition/ajout de plat */}
      {editingItem && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-6 animate-fade-in">
          <div className="bg-brand-brown w-full max-w-sm rounded-[3.5rem] p-10 border-4 border-white/10 shadow-2xl relative overflow-y-auto max-h-[90vh] no-scrollbar">
            <button
              onClick={() => setEditingItem(null)}
              className="absolute top-8 right-8 text-white/20 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>
            <h3 className="text-xl font-black italic uppercase text-brand-gold mb-8 tracking-tighter leading-none">
              {editingItem.id ? "Éditer le Plat" : "Nouveau Plat"}
            </h3>
            <form onSubmit={handleSaveItem} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[8px] font-black uppercase text-white/30 ml-4">
                  Nom du plat
                </label>
                <input
                  required
                  value={editingItem.name || ""}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, name: e.target.value })
                  }
                  className="w-full p-4 bg-white/5 rounded-2xl text-white text-xs font-bold border border-white/10 outline-none focus:border-brand-gold"
                  placeholder="Ex: Tiep Royal"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[8px] font-black uppercase text-white/30 ml-4">
                    Prix (F CFA)
                  </label>
                  <input
                    type="number"
                    required
                    value={editingItem.price || ""}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        price: Number(e.target.value),
                      })
                    }
                    className="w-full p-4 bg-white/5 rounded-2xl text-white text-xs font-bold border border-white/10"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] font-black uppercase text-white/30 ml-4">
                    Catégorie
                  </label>
                  <select
                    value={editingItem.category || "Plat Africain"}
                    onChange={(e) => {
                      const newCat = e.target.value;
                      const isJour = newCat === "Plat du Jour" || newCat === "Menu du Jour";
                      setEditingItem({
                        ...editingItem,
                        category: newCat as any,
                        isPlatDuJour: isJour ? true : editingItem.isPlatDuJour,
                      });
                    }}
                    className="w-full p-4 bg-white/5 rounded-2xl text-white text-[10px] font-black border border-white/10 outline-none"
                  >
                    <option value="Plat du Jour">⭐ Plat du Jour</option>
                    <option value="Menu du Jour">⭐ Menu du Jour</option>
                    <option value="Spécialité Maison">👑 Spécialité Maison</option>
                    <option value="Plat Africain">🥘 Plat Africain</option>
                    <option value="Déjeuner">☀️ Déjeuner</option>
                    <option value="Dîner">🌙 Dîner</option>
                    <option value="Petit-déjeuner">☕ Petit-déjeuner</option>
                    <option value="Entrée">🥗 Entrée & Pastels</option>
                    <option value="Box Sauce">📦 Box Sauce</option>
                    <option value="Pack-Buffet">🎪 Pack-Buffet</option>
                    <option value="Boisson Froide">🍹 Boisson Froide</option>
                    <option value="Dessert">🍨 Dessert</option>
                  </select>
                </div>
              </div>

              {/* Toggle rapide Plat / Menu du Jour */}
              <div className="bg-brand-gold/10 border border-brand-gold/30 p-3.5 rounded-2xl flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`p-2 rounded-xl transition-colors ${
                      editingItem.isPlatDuJour ||
                      editingItem.category === "Plat du Jour" ||
                      editingItem.category === "Menu du Jour"
                        ? "bg-brand-gold text-brand-brown"
                        : "bg-white/10 text-white/40"
                    }`}
                  >
                    <Star
                      size={18}
                      fill={
                        editingItem.isPlatDuJour ||
                        editingItem.category === "Plat du Jour" ||
                        editingItem.category === "Menu du Jour"
                          ? "currentColor"
                          : "none"
                      }
                    />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-brand-gold italic">
                      Plat / Menu du Jour
                    </p>
                    <p className="text-[7.5px] text-white/60">
                      Mettre en vedette dans l'onglet ⭐ Plat du Jour
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const currentJour = Boolean(
                      editingItem.isPlatDuJour ||
                        editingItem.category === "Plat du Jour" ||
                        editingItem.category === "Menu du Jour"
                    );
                    const nextVal = !currentJour;
                    setEditingItem({
                      ...editingItem,
                      isPlatDuJour: nextVal,
                      category: nextVal
                        ? editingItem.category || "Plat du Jour"
                        : editingItem.category === "Plat du Jour" ||
                          editingItem.category === "Menu du Jour"
                        ? "Plat Africain"
                        : editingItem.category,
                    });
                  }}
                  className={`px-3 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-wider transition-all ${
                    editingItem.isPlatDuJour ||
                    editingItem.category === "Plat du Jour" ||
                    editingItem.category === "Menu du Jour"
                      ? "bg-brand-gold text-brand-brown shadow-lg scale-105"
                      : "bg-white/10 text-white/50 hover:bg-white/20"
                  }`}
                >
                  {editingItem.isPlatDuJour ||
                  editingItem.category === "Plat du Jour" ||
                  editingItem.category === "Menu du Jour"
                    ? "⭐ ACTIF"
                    : "INACTIF"}
                </button>
              </div>
              {/* Hidden input for dish photo upload */}
              <input
                type="file"
                ref={dishPhotoInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleDishPhotoChange}
              />

              <div className="space-y-2">
                <label className="text-[8px] font-black uppercase text-white/40 ml-4">
                  Photo du Plat (Appareil / Galerie)
                </label>

                {editingItem.image ? (
                  <div className="relative w-full h-36 rounded-2xl overflow-hidden border border-white/10 group bg-black/40">
                    <img
                      src={editingItem.image}
                      alt="Aperçu du plat"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 sm:opacity-0 transition-opacity flex items-center justify-center gap-2 p-2">
                      <button
                        type="button"
                        onClick={() => dishPhotoInputRef.current?.click()}
                        className="bg-brand-orange text-white px-3 py-2 rounded-xl text-[9px] font-black uppercase flex items-center gap-1.5 shadow-lg active:scale-95"
                      >
                        <Camera size={14} /> Changer
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setEditingItem({ ...editingItem, image: "" })
                        }
                        className="bg-red-500 text-white p-2 rounded-xl text-[9px] font-black active:scale-95"
                        title="Effacer la photo"
                      >
                        <X size={14} />
                      </button>
                    </div>
                    <div className="absolute bottom-2 right-2 flex gap-1 sm:hidden">
                      <button
                        type="button"
                        onClick={() => dishPhotoInputRef.current?.click()}
                        className="bg-brand-orange text-white p-2 rounded-xl shadow-md active:scale-95 flex items-center gap-1 text-[8px] font-black uppercase"
                      >
                        <Camera size={12} /> Changer
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => dishPhotoInputRef.current?.click()}
                    className="w-full h-32 rounded-2xl border-2 border-dashed border-white/20 hover:border-brand-gold bg-white/5 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all p-4 text-center active:scale-98"
                  >
                    <div className="p-3 bg-brand-orange/20 text-brand-orange rounded-xl">
                      <Camera size={22} />
                    </div>
                    <span className="text-[10px] font-black uppercase text-brand-gold italic">
                      Prendre une photo / Choisir dans Photos
                    </span>
                    <span className="text-[7.5px] text-white/40 font-medium">
                      Touchez ici pour ouvrir directement votre appareil ou
                      galerie
                    </span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => dishPhotoInputRef.current?.click()}
                  className="w-full bg-white/10 hover:bg-white/20 text-brand-gold py-3 rounded-2xl text-[9px] font-black uppercase italic flex items-center justify-center gap-2 border border-white/10 active:scale-95 transition-all"
                >
                  <Camera size={14} /> Ouvrir l'application Photos
                </button>

                <details className="text-[8px] text-white/40 pt-1">
                  <summary className="cursor-pointer hover:text-white/60 select-none">
                    Ou coller un lien Web URL (optionnel)
                  </summary>
                  <input
                    value={editingItem.image || ""}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, image: e.target.value })
                    }
                    className="w-full mt-1.5 p-3 bg-white/5 rounded-xl text-white text-[9px] border border-white/10 outline-none focus:border-brand-gold"
                    placeholder="https://..."
                  />
                </details>
              </div>
              <div className="space-y-1">
                <label className="text-[8px] font-black uppercase text-white/30 ml-4">
                  Description
                </label>
                <textarea
                  value={editingItem.description || ""}
                  onChange={(e) =>
                    setEditingItem({
                      ...editingItem,
                      description: e.target.value,
                    })
                  }
                  className="w-full p-4 bg-white/5 rounded-2xl text-white text-[10px] h-24 border border-white/10 resize-none"
                  placeholder="Détails du plat..."
                />
              </div>

              {/* Paramètre Pousser vers Supabase */}
              <div className="bg-emerald-950/40 border border-emerald-500/30 p-4 rounded-2xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-xl transition-colors ${modalPushToSupabase ? "bg-emerald-500 text-black" : "bg-white/10 text-white/40"}`}>
                    <CloudUpload size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-emerald-300 italic flex items-center gap-1.5">
                      Pousser vers Supabase
                      <span className={`text-[7.5px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        isCloudConnected ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-white/10 text-white/40"
                      }`}>
                        {isCloudConnected ? "🟢 Cloud Prêt" : "⚪ Non configuré"}
                      </span>
                    </p>
                    <p className="text-[7.5px] text-white/60">
                      Synchronise ce plat directement dans votre base de données Supabase Cloud
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setModalPushToSupabase(!modalPushToSupabase)}
                  className={`px-3 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-wider transition-all shrink-0 ${
                    modalPushToSupabase
                      ? "bg-emerald-500 text-black shadow-lg"
                      : "bg-white/10 text-white/50 hover:bg-white/20"
                  }`}
                >
                  {modalPushToSupabase ? "OUI (PUSH)" : "NON (LOCAL)"}
                </button>
              </div>

              <button
                type="submit"
                className="w-full bg-brand-orange text-white py-6 rounded-[2.5rem] font-black uppercase italic shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-all mt-4"
              >
                {editingItem.id ? "Mettre à jour" : "Ajouter à la Carte"}{" "}
                <CheckCircle2 size={20} />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Script SQL Supabase */}
      {showSqlSchemaModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#18110F] border-2 border-emerald-500/40 rounded-[2.5rem] w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-scale-up">
            <div className="p-6 border-b border-white/10 flex items-center justify-between bg-black/40">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-500 text-black rounded-2xl">
                  <Database size={22} />
                </div>
                <div>
                  <h3 className="font-black text-emerald-300 text-base uppercase italic">
                    Script SQL Supabase (db_schema.sql)
                  </h3>
                  <p className="text-[9px] text-white/60">
                    Copiez et collez ce script dans l'onglet 'SQL Editor' de votre projet Supabase
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSqlSchemaModal(false)}
                className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl active:scale-95"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-[10px] text-emerald-300 space-y-1">
                <p className="font-black uppercase">Instructions faciles en 3 étapes :</p>
                <ol className="list-decimal list-inside space-y-1 text-white/80">
                  <li>Ouvrez votre projet sur <strong>supabase.com</strong></li>
                  <li>Allez dans le menu latéral gauche &gt; <strong>SQL Editor</strong></li>
                  <li>Collez ce script et cliquez sur <strong>RUN</strong></li>
                </ol>
              </div>

              <div className="relative">
                <pre className="p-4 bg-black/60 rounded-2xl border border-white/10 text-[9px] text-emerald-400 font-mono overflow-x-auto max-h-96 leading-relaxed select-all">
                  {SUPABASE_SQL_SCHEMA}
                </pre>
                <button
                  onClick={handleCopySqlSchema}
                  className="absolute top-3 right-3 bg-emerald-500 hover:bg-emerald-400 text-black px-3 py-1.5 rounded-xl text-[9px] font-black uppercase italic shadow-lg flex items-center gap-1.5 active:scale-95 transition-all"
                >
                  {hasCopiedSql ? <Check size={14} /> : <Copy size={14} />}
                  {hasCopiedSql ? "Copié !" : "Copier le Script"}
                </button>
              </div>
            </div>

            <div className="p-4 border-t border-white/10 bg-black/40 flex justify-end gap-3">
              <button
                onClick={handleCopySqlSchema}
                className="bg-emerald-500 hover:bg-emerald-400 text-black px-6 py-3 rounded-2xl text-[10px] font-black uppercase italic shadow-lg flex items-center gap-2 active:scale-95 transition-all"
              >
                {hasCopiedSql ? <Check size={16} /> : <Copy size={16} />}
                {hasCopiedSql ? "Copié dans le presse-papier !" : "Copier le Script SQL"}
              </button>
              <button
                onClick={() => setShowSqlSchemaModal(false)}
                className="bg-white/10 hover:bg-white/20 text-white px-5 py-3 rounded-2xl text-[10px] font-black uppercase italic active:scale-95"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Dédié Paramètres & Clés Supabase (Optimisé Mobile Sans Scroll Caché) */}
      {showSupabaseSettingsModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[150] flex items-center justify-center p-2.5 sm:p-4 overflow-y-auto">
          <div className="bg-[#18110F] border-2 border-emerald-500/40 rounded-[2rem] w-full max-w-xl max-h-[95vh] flex flex-col shadow-2xl overflow-hidden animate-scale-up my-auto">
            {/* Header Compact Mobile */}
            <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between bg-black/60 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-500 text-black rounded-xl font-black">
                  <Cloud size={18} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-emerald-300 text-xs sm:text-sm uppercase italic">
                      Connexion Supabase
                    </h3>
                    <span
                      className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full border ${
                        isCloudConnected
                          ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                          : "bg-amber-500/20 text-amber-300 border-amber-500/40"
                      }`}
                    >
                      {isCloudConnected ? "🟢 Clé Valide" : "⚠️ Clé à corriger"}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowSupabaseSettingsModal(false)}
                className="p-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl active:scale-95"
              >
                <X size={18} />
              </button>
            </div>

            {/* Corps Modal : Champs immédiatement visibles en haut sur mobile */}
            <div className="p-3.5 sm:p-5 overflow-y-auto space-y-3 flex-1">
              {/* Bouton Rapide : Sauvegarder sans Supabase (Déblocage en 1 clic) */}
              <button
                type="button"
                onClick={handleEnableStandaloneMode}
                className="w-full bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 py-2.5 px-3 rounded-xl font-black text-[9.5px] uppercase italic flex items-center justify-center gap-2 active:scale-95 transition-all"
              >
                <CheckCircle size={15} className="text-emerald-400 shrink-0" />
                <span>Garder mes {items.length} plats sur le téléphone (Sans Supabase)</span>
              </button>

              {/* CHAMP 1 : CLÉ API SUPABASE (Mis en N°1 car il remplit aussi l'URL automatiquement !) */}
              <div className="bg-white/5 border border-white/15 rounded-2xl p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-[9.5px] font-black uppercase text-brand-gold flex items-center gap-1">
                    <Key size={12} /> 1. Votre Clé API Supabase (Anon / Publishable)
                  </label>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          const text = await navigator.clipboard.readText();
                          if (text) handleSupabaseKeyChange(text);
                        } catch {
                          // Si le navigateur bloque clipboard.readText, l'utilisateur peut coller manuellement
                        }
                      }}
                      className="bg-emerald-500 text-black px-2.5 py-1 rounded-lg text-[8.5px] font-black uppercase flex items-center gap-1 active:scale-95"
                    >
                      <Copy size={11} /> Coller
                    </button>
                    {supabaseKeyInput && (
                      <button
                        type="button"
                        onClick={() => setSupabaseKeyInput("")}
                        className="bg-red-500/20 text-red-300 border border-red-500/30 px-2 py-1 rounded-lg text-[8.5px] font-black uppercase active:scale-95"
                      >
                        Vider
                      </button>
                    )}
                  </div>
                </div>

                <input
                  type="text"
                  value={supabaseKeyInput}
                  onChange={(e) => handleSupabaseKeyChange(e.target.value)}
                  placeholder="Collez ici la clé eyJhbGci... ou sb_publishable_..."
                  className={`w-full p-3 bg-black/50 rounded-xl text-white text-[11px] border outline-none font-mono transition-colors ${
                    supabaseKeyInput && !keyValidation.isValidFormat
                      ? "border-amber-500 focus:border-amber-400"
                      : "border-emerald-500/40 focus:border-emerald-400"
                  }`}
                />

                {/* Diagnostic en direct de ce qui est dans le champ Clé */}
                {supabaseKeyInput && !keyValidation.isValidFormat && (
                  <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-500/50 text-amber-200 text-[9px] space-y-1.5">
                    <p className="font-bold leading-snug">{keyValidation.warningMessage}</p>
                    <button
                      type="button"
                      onClick={() => setSupabaseKeyInput("")}
                      className="bg-amber-500 text-black px-3 py-1 rounded-lg font-black uppercase text-[8px]"
                    >
                      Effacer ce texte incorrect
                    </button>
                  </div>
                )}

                {supabaseKeyInput && keyValidation.isValidFormat && (
                  <div className="p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[9px] font-bold flex items-center gap-1.5">
                    <CheckCircle size={13} className="text-emerald-400 shrink-0" />
                    <span>
                      ✅ Clé reconnue ({keyValidation.keyType === "publishable" ? "Publishable Key" : "Clé Anon JWT"})
                    </span>
                  </div>
                )}
              </div>

              {/* CHAMP 2 : URL DU PROJET SUPABASE */}
              <div className="bg-white/5 border border-white/15 rounded-2xl p-3 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[9.5px] font-black uppercase text-white/70">
                    2. URL du Projet (https://...supabase.co)
                  </label>
                  {derivedJwtUrl ? (
                    <span className="text-[8px] font-black text-emerald-400">✨ Remplie automatiquement</span>
                  ) : (
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          const text = await navigator.clipboard.readText();
                          if (text) handleSupabaseUrlChange(text);
                        } catch {
                          // Ignorer
                        }
                      }}
                      className="text-[8.5px] font-black text-emerald-400 uppercase"
                    >
                      Coller l'URL
                    </button>
                  )}
                </div>
                <input
                  type="url"
                  value={supabaseUrlInput}
                  onChange={(e) => handleSupabaseUrlChange(e.target.value)}
                  placeholder="https://votre-projet.supabase.co"
                  className="w-full p-2.5 bg-black/50 rounded-xl text-white text-[11px] border border-white/15 outline-none focus:border-emerald-400 font-mono"
                />
              </div>

              {/* Guide Ultra-Simple adapté à l'écran mobile Supabase de l'utilisateur */}
              <div className="bg-brand-gold/10 border border-brand-gold/30 rounded-2xl p-3 text-[9.5px] space-y-1.5">
                <p className="font-black uppercase text-brand-gold text-[9.5px]">
                  💡 Comment copier votre clé sur votre écran Supabase :
                </p>
                <p className="text-white/85 leading-snug">
                  1. Sur votre page Supabase, tout en haut à droite du nom <strong>khadys-food</strong>, appuyez sur le bouton rond <strong>🔌 (Prise)</strong>.<br />
                  2. Appuyez sur l'onglet <strong>App Frameworks</strong> (ou allez dans <strong>☰ &gt; Project Settings &gt; API Keys</strong>).<br />
                  3. Copiez l'<strong>URL</strong> et la <strong>Clé (Anon ou Publishable)</strong> puis appuyez sur <strong>Coller</strong> ci-dessus.
                </p>
              </div>

              {/* Rapport de Push Live */}
              {pushMenuSummary && (
                <div
                  className={`p-3 rounded-2xl border ${
                    pushMenuSummary.success
                      ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-200"
                      : pushMenuSummary.localSaved
                      ? "bg-amber-500/15 border-amber-500/40 text-amber-200"
                      : "bg-red-500/15 border-red-500/40 text-red-200"
                  } space-y-2 text-[9.5px] animate-fade-in`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {pushMenuSummary.success ? (
                        <CheckCircle size={15} className="text-emerald-400 shrink-0" />
                      ) : (
                        <CloudUpload size={15} className="text-amber-400 shrink-0" />
                      )}
                      <span className="font-bold leading-snug">{pushMenuSummary.message}</span>
                    </div>
                    <button
                      onClick={() => setPushMenuSummary(null)}
                      className="p-1 hover:bg-white/10 rounded-lg text-white/60 hover:text-white shrink-0"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              )}

              {/* Rapport de Test Live */}
              {supabaseTestReport && (
                <div
                  className={`p-3 rounded-2xl border ${
                    supabaseTestReport.success
                      ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-200"
                      : supabaseTestReport.details?.missingTables
                      ? "bg-amber-500/15 border-amber-500/40 text-amber-200"
                      : "bg-red-500/15 border-red-500/40 text-red-200"
                  } space-y-2 animate-fade-in`}
                >
                  <div className="flex items-center gap-2">
                    {supabaseTestReport.success ? (
                      <CheckCircle className="text-emerald-400 shrink-0" size={18} />
                    ) : (
                      <AlertCircle className="text-amber-400 shrink-0" size={18} />
                    )}
                    <div>
                      <h5 className="font-black text-[10px] uppercase">
                        {supabaseTestReport.success
                          ? "✅ Connexion Réussie avec Supabase !"
                          : "Diagnostic de Connexion"}
                      </h5>
                      <p className="text-[9.5px] opacity-95 mt-0.5 leading-snug">{supabaseTestReport.message}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Compact en Grille 2x2 pour Mobile */}
            <div className="p-3 border-t border-white/10 bg-black/70 shrink-0 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleTestSupabaseConnection}
                  disabled={isTestingSupabase}
                  className="bg-white/10 hover:bg-white/20 text-emerald-300 border border-emerald-500/40 py-2.5 px-3 rounded-xl font-black text-[9.5px] uppercase italic flex items-center justify-center gap-1.5 active:scale-95 transition-all disabled:opacity-50"
                >
                  <Cloud size={13} className={isTestingSupabase ? "animate-spin" : ""} />
                  {isTestingSupabase ? "Test..." : "1. Tester"}
                </button>

                <button
                  type="button"
                  onClick={handlePushAllMenuToSupabase}
                  disabled={isPushingMenuToSupabase}
                  className="bg-emerald-500 hover:bg-emerald-400 text-black py-2.5 px-3 rounded-xl font-black text-[9.5px] uppercase italic flex items-center justify-center gap-1.5 shadow-lg active:scale-95 transition-all disabled:opacity-50"
                >
                  <CloudUpload size={13} className={isPushingMenuToSupabase ? "animate-bounce" : ""} />
                  {isPushingMenuToSupabase ? "Envoi..." : `2. Pousser (${items.length})`}
                </button>
              </div>

              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={handleSaveSupabaseConfig}
                  className="flex-1 bg-brand-gold hover:bg-amber-400 text-brand-brown py-2 px-3 rounded-xl font-black text-[9px] uppercase italic flex items-center justify-center gap-1.5 active:scale-95"
                >
                  <Key size={12} /> Enregistrer
                </button>
                <button
                  type="button"
                  onClick={() => setShowSupabaseSettingsModal(false)}
                  className="bg-white/10 hover:bg-white/20 text-white py-2 px-4 rounded-xl text-[9px] font-black uppercase italic active:scale-95"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
