import React, { useState, useEffect, useMemo } from "react";
import Navbar from "./components/Navbar";
import AIChat from "./components/AIChat";
import AdminDashboard from "./components/AdminDashboard";
import MenuView from "./components/MenuView";
import CartView from "./components/CartView";
import AccountView from "./components/AccountView";
import TraiteurView from "./components/TraiteurView";
import GuideView from "./components/GuideView";
import ItemDetailsModal from "./components/ItemDetailsModal";
import UpsellModal from "./components/UpsellModal";
import Receipt from "./components/Receipt";
import Toast, { ToastType } from "./components/Toast";
import DeliveryEstimator from "./components/DeliveryEstimator";
import ReviewsSection from "./components/ReviewsSection";
import { BlogView } from "./components/BlogView";
import { GalleryView } from "./components/GalleryView";
import { VideoDemoModal } from "./components/VideoDemoModal";
import { AIGourmandeWidget } from "./components/AIGourmandeWidget";
import { InstallGuideModal } from "./components/InstallGuideModal";
import { ShareModal } from "./components/ShareModal";
import FAQSection from "./components/FAQSection";
import {
  Page,
  MenuItem,
  Order,
  Review,
  CartItem,
  UserProfile,
  BlogPost,
  GalleryItem,
  ClientUser,
} from "./types";
import {
  MENU_ITEMS,
  REVIEWS,
  LOGO_URL,
  POINTS_PER_1000,
  INITIAL_BLOG_POSTS,
  INITIAL_GALLERY_ITEMS,
  INITIAL_CLIENTS,
} from "./constants";
import { playSound } from "./utils/audio";
import { persistentStorage } from "./utils/storage";
import { db, isSupabaseConfigured } from "./lib/supabase";
import {
  ShoppingBag,
  User as UserIcon,
  Heart,
  Utensils,
  Star,
  Sparkles,
  Navigation,
  Info,
  BookOpen,
  Camera,
  Play,
  Volume2,
  VolumeX,
  Bell,
  Flame,
  WifiOff,
  Download,
  Share2,
  MessageCircle,
} from "lucide-react";

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>(Page.HOME);

  // Charger depuis localStorage ou valeurs par défaut
  const [items, setItems] = useState<MenuItem[]>(() => {
    try {
      const saved = localStorage.getItem("khadys_menu_items");
      return saved ? JSON.parse(saved) : MENU_ITEMS;
    } catch {
      return MENU_ITEMS;
    }
  });

  const [posts, setPosts] = useState<BlogPost[]>(() => {
    try {
      const saved = localStorage.getItem("khadys_blog_posts");
      return saved ? JSON.parse(saved) : INITIAL_BLOG_POSTS;
    } catch {
      return INITIAL_BLOG_POSTS;
    }
  });

  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>(() => {
    try {
      const saved = localStorage.getItem("khadys_gallery_items");
      return saved ? JSON.parse(saved) : INITIAL_GALLERY_ITEMS;
    } catch {
      return INITIAL_GALLERY_ITEMS;
    }
  });

  const [clients, setClients] = useState<ClientUser[]>(() => {
    try {
      const saved = localStorage.getItem("khadys_clients");
      return saved ? JSON.parse(saved) : INITIAL_CLIENTS;
    } catch {
      return INITIAL_CLIENTS;
    }
  });

  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem("khadys_cart");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const saved = localStorage.getItem("khadys_orders");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [reviews, setReviews] = useState<Review[]>(() => {
    try {
      const saved = localStorage.getItem("khadys_reviews");
      return saved ? JSON.parse(saved) : REVIEWS;
    } catch {
      return REVIEWS;
    }
  });

  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem("khadys_user_profile");
      return saved
        ? JSON.parse(saved)
        : {
            name: "Abdou R.",
            phone: "+227 90 00 00 00",
            points: 1250,
            rank: "Gold",
            referralCode: "KHADY-GOLD",
          };
    } catch {
      return {
        name: "Abdou R.",
        phone: "+227 90 00 00 00",
        points: 1250,
        rank: "Gold",
        referralCode: "KHADY-GOLD",
      };
    }
  });

  // Sauvegarde automatique persistant (IndexedDB + LocalStorage)
  useEffect(() => {
    persistentStorage.setItem("khadys_menu_items", items);
  }, [items]);

  useEffect(() => {
    persistentStorage.setItem("khadys_blog_posts", posts);
  }, [posts]);

  useEffect(() => {
    persistentStorage.setItem("khadys_gallery_items", galleryItems);
  }, [galleryItems]);

  useEffect(() => {
    persistentStorage.setItem("khadys_clients", clients);
  }, [clients]);

  useEffect(() => {
    persistentStorage.setItem("khadys_cart", cart);
  }, [cart]);

  useEffect(() => {
    persistentStorage.setItem("khadys_orders", orders);
  }, [orders]);

  useEffect(() => {
    persistentStorage.setItem("khadys_reviews", reviews);
  }, [reviews]);

  useEffect(() => {
    persistentStorage.setItem("khadys_user_profile", userProfile);
  }, [userProfile]);

  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [isUpsellOpen, setIsUpsellOpen] = useState(false);
  const [lastOrder, setLastOrder] = useState<Order | null>(null);
  const [currentHeroSlide, setCurrentHeroSlide] = useState(0);
  const [newOrderAlert, setNewOrderAlert] = useState<Order | null>(null);

  const HERO_SLIDES = [
    {
      id: 1,
      title: "TIEP ROYAL KHADY",
      subtitle: "Capitaine frais, riz rouge parfumé & légumes du Sahel",
      tag: "Spécialité du Chef",
      price: "5 500 F CFA",
      image: "https://images.unsplash.com/photo-1627308595229-7830a5c91f9f?w=1000",
    },
    {
      id: 2,
      title: "PLATEAU PRESTIGE EVENT",
      subtitle: "Giga assortiment de grillades, pastels & alloco pour 4",
      tag: "Festin Événementiel",
      price: "15 000 F CFA",
      image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=1000",
    },
    {
      id: 3,
      title: "DAMBOU DU JOUR",
      subtitle: "Couscous de moringa aux arachides & poulet braisé",
      tag: "Recette Traditionnelle",
      price: "2 500 F CFA",
      image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=1000",
    },
    {
      id: 4,
      title: "GARBA IVOIRIEN CLASSIQUE",
      subtitle: "Attiéké vapeur, thon frit doré & piment haché",
      tag: "Déjeuner Express",
      price: "3 500 F CFA",
      image: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=1000",
    },
    {
      id: 5,
      title: "SOUPOU KANDIA ROYAL",
      subtitle: "Gombo mijoté, crevettes, crabe & bœuf tendre",
      tag: "Plat Africain",
      price: "5 000 F CFA",
      image: "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=1000",
    },
  ];

  // Rotation automatique des plats en boucle
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentHeroSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [HERO_SLIDES.length]);
  const [toast, setToast] = useState<{
    message: string;
    type: ToastType;
  } | null>(null);
  const [activeMenuSection, setActiveMenuSection] = useState("CARTE");
  const [isVideoDemoOpen, setIsVideoDemoOpen] = useState(false);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [isLoadingMenu, setIsLoadingMenu] = useState(true);

  const [greetingIndex, setGreetingIndex] = useState(0);
  const greetings = [
    "SALAM 👋🏾",
    "BONJOUR 👋🏾",
    "BARKA 👋🏾",
    "FOFO 👋🏾",
    "VOTRE FESTIN ? 🥘",
  ];

  // Mode Hors-Ligne & Install PWA Prompt
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareModalItem, setShareModalItem] = useState<MenuItem | null>(null);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      showToast("Réseau rétabli ! Mode en ligne actif.", "success");
    };
    const handleOffline = () => {
      setIsOnline(false);
      showToast(
        "Mode Hors-Ligne actif. Vos données restent disponibles.",
        "info",
      );
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        showToast("Installation de Khady's Food réussie !", "success");
      }
      setDeferredPrompt(null);
      setIsInstallModalOpen(false);
    }
  };

  // Chargement initial depuis le stockage persistant (IndexedDB) puis Supabase si configuré
  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoadingMenu(true);
      try {
        const storedItems = await persistentStorage.getItem<MenuItem[]>(
          "khadys_menu_items",
          MENU_ITEMS,
        );
        if (storedItems && storedItems.length > 0) {
          setItems(storedItems);
        }

        const storedPosts = await persistentStorage.getItem<BlogPost[]>(
          "khadys_blog_posts",
          INITIAL_BLOG_POSTS,
        );
        if (storedPosts && storedPosts.length > 0) setPosts(storedPosts);

        const storedGallery = await persistentStorage.getItem<GalleryItem[]>(
          "khadys_gallery_items",
          INITIAL_GALLERY_ITEMS,
        );
        if (storedGallery && storedGallery.length > 0)
          setGalleryItems(storedGallery);

        const storedOrders = await persistentStorage.getItem<Order[]>(
          "khadys_orders",
          [],
        );
        if (storedOrders && storedOrders.length > 0) setOrders(storedOrders);

        if (isSupabaseConfigured) {
          const cloudMenu = await db.fetchMenu();
          if (cloudMenu && cloudMenu.length > 0) setItems(cloudMenu);

          const cloudOrders = await db.fetchOrders();
          if (cloudOrders && cloudOrders.length > 0) setOrders(cloudOrders);
        }
      } catch (err) {
        console.warn("[App] Utilisation des données locales:", err);
      } finally {
        setIsLoadingMenu(false);
      }
    };
    loadInitialData();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setGreetingIndex((prev) => (prev + 1) % greetings.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const showToast = (message: string, type: ToastType = "success") => {
    setToast({ message, type });
  };

  const handleAddToCart = (
    item: MenuItem,
    quantity: number,
    instructions: string,
  ) => {
    const cartItem: CartItem = { ...item, quantity, instructions };
    setCart((prev) => [...prev, cartItem]);
    showToast(`${quantity}x ${item.name} ajouté !`);
    playSound("pop");

    if (
      item.category === "Plat Africain" ||
      item.category === "Spécialité Maison"
    ) {
      setIsUpsellOpen(true);
    }
  };

  const handleOrderPlace = async (order: Order) => {
    setOrders((prev) => [order, ...prev]);
    setLastOrder(order);
    setNewOrderAlert(order);
    playSound("notification");

    // Attribution des points : 100 points par 1000 F (basé sur le total de la commande)
    const pointsEarned = Math.floor(order.total / 1000) * POINTS_PER_1000;

    setUserProfile((prev) => {
      const newPoints = prev.points + pointsEarned;
      let newRank = prev.rank;
      if (newPoints > 5000) newRank = "Platinum";
      else if (newPoints > 2000) newRank = "Gold";
      else newRank = "Silver";

      return { ...prev, points: newPoints, rank: newRank };
    });

    setCurrentPage(Page.HOME);
    showToast(
      `Festin en préparation ! +${pointsEarned} points gagnés ✨`,
      "success",
    );

    // Sauvegarde Cloud
    if (isSupabaseConfigured) {
      try {
        await db.placeOrder(order);
      } catch (e) {
        console.error("Erreur sauvegarde commande:", e);
      }
    }
  };

  const renderPage = () => {
    switch (currentPage) {
      case Page.HOME:
        return (
          <div className="pb-36 sm:pb-40 animate-fade-in w-full max-w-4xl lg:max-w-5xl mx-auto space-y-6">
            {/* Live Ticker Bar */}
            <div className="px-4 sm:px-6">
              <div className="bg-brand-brown text-brand-gold py-2.5 px-4 rounded-full text-[9px] font-black uppercase italic tracking-wider flex items-center justify-between border border-brand-gold/30 shadow-md">
                <div className="flex items-center gap-2 truncate">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping shrink-0"></span>
                  <span className="text-white font-bold truncate">
                    🔴 Live Niamey : Abdoulaye à Plateau vient de recevoir sa
                    Box Sauce Mafé 🔥
                  </span>
                </div>
                <span className="text-[8px] bg-brand-orange text-white px-2 py-0.5 rounded-full shrink-0">
                  Billo 18mn
                </span>
              </div>
            </div>

            {/* Offline Alert Banner */}
            {!isOnline && (
              <div className="mx-4 sm:mx-6 bg-amber-500 text-white p-3.5 rounded-2xl shadow-lg flex items-center justify-between text-xs font-bold animate-pulse">
                <div className="flex items-center gap-2">
                  <WifiOff size={18} />
                  <span>
                    Mode Hors-Ligne activé — Vos commandes et menus sont
                    accessibles localement.
                  </span>
                </div>
              </div>
            )}

            {/* Header Elite - Couleur sombre chocolat & or luxueux (pas de fond blanc) */}
            <header className="sticky top-0 z-50 px-3 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-[#2C1810] via-[#3D2116] to-[#1C0D08] border-b-2 border-brand-gold/40 flex justify-between items-center rounded-b-[2rem] sm:rounded-b-[2.5rem] shadow-2xl backdrop-blur-md">
              <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                <div className="relative">
                  <img
                    src={LOGO_URL}
                    alt="Logo"
                    className="w-10 h-10 sm:w-11 sm:h-11 rounded-full border-2 border-brand-gold shadow-md object-cover"
                  />
                  <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 sm:w-4 sm:h-4 bg-green-500 rounded-full border-2 border-[#2C1810] animate-pulse"></div>
                </div>
                <div className="flex flex-col">
                  <h1 className="text-xs sm:text-[13px] font-black italic text-brand-gold uppercase tracking-tighter leading-none">
                    Khady's
                  </h1>
                  <span className="text-[7px] sm:text-[8px] font-black text-amber-200/90 uppercase tracking-[0.15em] sm:tracking-[0.2em] leading-none mt-0.5 sm:mt-1">
                    Food & Event
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                <button
                  onClick={() => {
                    playSound("pop");
                    setIsInstallModalOpen(true);
                  }}
                  className="w-8 h-8 sm:w-9 sm:h-9 bg-white/10 hover:bg-brand-gold hover:text-brand-brown text-brand-gold border border-brand-gold/30 rounded-xl flex items-center justify-center shadow-md active:scale-90 transition-all shrink-0"
                  title="Installer l'application"
                >
                  <Download size={15} className="sm:w-4 sm:h-4" />
                </button>

                <button
                  onClick={() => {
                    playSound("pop");
                    setShareModalItem(null);
                    setIsShareModalOpen(true);
                  }}
                  className="w-8 h-8 sm:w-9 sm:h-9 bg-brand-orange hover:bg-orange-600 text-white rounded-xl flex items-center justify-center shadow-md active:scale-90 transition-all shrink-0"
                  title="Partager l'application"
                >
                  <Share2 size={15} className="sm:w-4 sm:h-4" />
                </button>

                <div className="flex bg-brand-gold/20 px-2.5 py-1.5 rounded-xl items-center justify-center border border-brand-gold/40 shadow-sm shrink-0">
                  <span
                    className="text-[9px] sm:text-[10px] font-black text-brand-gold uppercase italic tracking-wider flex items-center gap-1"
                    key={greetingIndex}
                  >
                    <span className="inline-block animate-wave origin-bottom-right text-xs sm:text-sm">
                      👋🏾
                    </span>
                    <span className="animate-fade-in truncate">
                      {greetings[greetingIndex].replace(" 👋🏾", "")}
                    </span>
                  </span>
                </div>

                {/* Audio Sound Toggle */}
                <button
                  onClick={() => {
                    setIsSoundEnabled(!isSoundEnabled);
                    playSound("pop");
                  }}
                  className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center transition-all shrink-0 border ${
                    isSoundEnabled
                      ? "bg-brand-orange/20 text-brand-orange border-brand-orange/40"
                      : "bg-white/5 text-white/40 border-white/10"
                  }`}
                  title={
                    isSoundEnabled
                      ? "Sons & Notifications Actifs"
                      : "Sons Désactivés"
                  }
                >
                  {isSoundEnabled ? (
                    <Volume2 size={15} className="sm:w-4 sm:h-4" />
                  ) : (
                    <VolumeX size={15} className="sm:w-4 sm:h-4" />
                  )}
                </button>

                <button
                  onClick={() => {
                    playSound("pop");
                    setCurrentPage(Page.COMPTE);
                  }}
                  className="w-8 h-8 sm:w-9 sm:h-9 bg-brand-gold hover:bg-amber-300 text-brand-brown rounded-xl flex items-center justify-center shadow-lg active:scale-90 transition-transform shrink-0 font-black"
                >
                  <UserIcon size={15} className="sm:w-4 sm:h-4" />
                </button>
              </div>
            </header>

            {/* Banner Hero avec rotation automatique des plats en boucle */}
            <div className="px-4 sm:px-6 overflow-hidden">
              <div className="relative h-64 sm:h-72 rounded-[3rem] shadow-2xl overflow-hidden group border-2 border-brand-gold/50 bg-gradient-to-br from-[#2A1710] via-[#3A2016] to-[#1C0D08]">
                {/* Images des plats qui tournent en boucle */}
                {HERO_SLIDES.map((slide, index) => (
                  <div
                    key={slide.id}
                    className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                      index === currentHeroSlide ? "opacity-100 z-10 scale-100" : "opacity-0 z-0 scale-105 pointer-events-none"
                    }`}
                  >
                    <img
                      src={slide.image}
                      className="w-full h-full object-cover opacity-75 mix-blend-overlay animate-zoom-dezoom"
                      alt={slide.title}
                    />
                  </div>
                ))}

                <div className="absolute inset-0 z-10 bg-gradient-to-r from-[#2A1710]/95 via-[#2A1710]/80 to-transparent"></div>
                <div className="absolute inset-0 z-10 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-brand-gold/30 via-transparent to-transparent pointer-events-none"></div>

                {/* Contenu dynamique du plat courant */}
                <div className="absolute inset-0 z-20 flex flex-col justify-center px-6 sm:px-12 space-y-2.5">
                  <div className="flex items-center gap-2">
                    <Sparkles
                      size={14}
                      className="text-brand-gold animate-pulse"
                    />
                    <span className="bg-brand-gold/20 text-brand-gold border border-brand-gold/40 text-[8.5px] font-black px-3.5 py-1 rounded-full uppercase italic tracking-widest shadow-md backdrop-blur-md">
                      {HERO_SLIDES[currentHeroSlide].tag} • {HERO_SLIDES[currentHeroSlide].price}
                    </span>
                  </div>

                  <h2 className="text-2xl sm:text-3xl font-black text-white italic uppercase tracking-tighter leading-tight drop-shadow-md">
                    {HERO_SLIDES[currentHeroSlide].title}
                  </h2>

                  <p className="text-[10px] sm:text-xs text-amber-100/90 font-medium italic max-w-md line-clamp-2">
                    {HERO_SLIDES[currentHeroSlide].subtitle}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <button
                      onClick={() => {
                        playSound("pop");
                        setCurrentPage(Page.MENU);
                      }}
                      className="bg-brand-orange text-white px-6 py-2.5 rounded-full text-[9px] font-black uppercase italic shadow-xl flex items-center gap-2 hover:bg-brand-gold hover:text-brand-brown transition-colors"
                    >
                      Commander maintenant <Navigation size={12} />
                    </button>

                    <button
                      onClick={() => {
                        playSound("pop");
                        setIsVideoDemoOpen(true);
                      }}
                      className="bg-[#2A1710]/80 hover:bg-[#2A1710] text-brand-gold border border-brand-gold/50 backdrop-blur-md px-5 py-2.5 rounded-full text-[9px] font-black uppercase italic flex items-center gap-2 shadow-lg active:scale-95 transition-all"
                    >
                      <Play size={12} fill="currentColor" /> Démo Vidéo
                      Restaurant
                    </button>
                  </div>
                </div>

                {/* Puces & Sélecteurs de plats en boucle */}
                <div className="absolute bottom-3 right-4 sm:right-8 z-30 flex items-center gap-1.5 bg-black/50 px-3.5 py-1.5 rounded-full backdrop-blur-md border border-brand-gold/30">
                  {HERO_SLIDES.map((slide, idx) => (
                    <button
                      key={slide.id}
                      onClick={() => {
                        setCurrentHeroSlide(idx);
                        playSound("pop");
                      }}
                      className={`h-2 rounded-full transition-all ${
                        idx === currentHeroSlide
                          ? "w-6 bg-brand-gold shadow-md"
                          : "w-2 bg-white/40 hover:bg-white"
                      }`}
                      title={slide.title}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* AI Gourmande Widget */}
            <div className="px-4 sm:px-6">
              <AIGourmandeWidget
                items={items}
                onSelectItem={(item) => {
                  setSelectedItem(item);
                  setIsItemModalOpen(true);
                }}
              />
            </div>

            {/* Menu Grid */}
            <div className="px-4 sm:px-6 grid grid-cols-1 sm:grid-cols-5 gap-3">
              <div
                className="sm:col-span-3 bg-[#1A0F0D] rounded-[2.5rem] p-8 shadow-2xl flex flex-col items-center justify-center relative overflow-hidden group active:scale-95 transition-all cursor-pointer border border-white/5 h-48 sm:h-auto"
                onClick={() => {
                  setActiveMenuSection("CARTE");
                  setCurrentPage(Page.MENU);
                }}
              >
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                <div className="w-16 h-16 bg-brand-gold/10 rounded-2xl flex items-center justify-center text-brand-gold mb-3 relative z-10 border border-white/10">
                  <Utensils size={32} />
                </div>
                <span className="text-[11px] font-black uppercase text-brand-gold tracking-[0.4em] italic relative z-10">
                  LA CARTE
                </span>
              </div>
              <div className="sm:col-span-2 flex flex-row sm:flex-col gap-3">
                <button
                  onClick={() => {
                    setActiveMenuSection("PACK");
                    setCurrentPage(Page.MENU);
                  }}
                  className="flex-1 bg-brand-gold text-brand-brown py-5 rounded-[1.8rem] font-black uppercase text-[9px] italic flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all border border-white/20"
                >
                  BUFFET PRO
                </button>
                <button
                  onClick={() => {
                    setActiveMenuSection("BOX");
                    setCurrentPage(Page.MENU);
                  }}
                  className="flex-1 bg-brand-orange text-white py-5 rounded-[1.8rem] font-black uppercase text-[9px] italic flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all border border-white/20"
                >
                  BOX SAUCES
                </button>
              </div>
              <button
                onClick={() => setCurrentPage(Page.TRAITEUR)}
                className="sm:col-span-5 w-full bg-white text-brand-brown py-5 rounded-[1.8rem] font-black uppercase text-[9px] italic border border-gray-100 flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all"
              >
                EVENT & DEVIS
              </button>
            </div>

            {/* Incontournables */}
            <section className="mb-6">
              <div className="flex items-center justify-between mb-8 px-6 sm:px-8">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-brand-orange/10 rounded-xl text-brand-orange">
                    <Heart size={18} fill="currentColor" />
                  </div>
                  <h3 className="text-sm font-black uppercase text-brand-brown tracking-[0.2em] italic">
                    Incontournables
                  </h3>
                </div>
                <button
                  onClick={() => setCurrentPage(Page.MENU)}
                  className="text-[9px] font-black text-brand-orange uppercase tracking-widest underline"
                >
                  Tout voir
                </button>
              </div>

              <div className="relative overflow-hidden w-full">
                <div className="flex animate-infinite-scroll w-fit gap-6 sm:gap-8 px-6 flex-nowrap py-4">
                  {[...items.slice(0, 10), ...items.slice(0, 10)].map(
                    (item, i) => (
                      <div
                        key={i}
                        className="w-56 sm:w-60 flex-shrink-0 glass-card rounded-[3rem] p-5 shadow-2xl border border-white/20 flex flex-col cursor-pointer active:scale-95 transition-all group"
                        onClick={() => {
                          setSelectedItem(item);
                          setIsItemModalOpen(true);
                          playSound("pop");
                        }}
                      >
                        <div className="w-full h-40 overflow-hidden rounded-[2.2rem] mb-5 shadow-inner bg-gray-100">
                          <img
                            src={item.image}
                            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-115"
                            alt={item.name}
                          />
                        </div>
                        <h4 className="text-[11px] font-black uppercase text-brand-brown italic mb-3 truncate">
                          {item.name}
                        </h4>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-black text-brand-orange px-4 py-1.5 bg-brand-orange/10 rounded-full">
                            {item.price} F
                          </span>
                          <div className="flex gap-0.5">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                size={10}
                                fill={i < 4 ? "#FFD700" : "none"}
                                className="text-brand-gold"
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    ),
                  )}
                </div>
              </div>
            </section>

            <div className="px-4 sm:px-6">
              <DeliveryEstimator />
            </div>

            <div className="px-4 sm:px-6">
              <ReviewsSection reviews={reviews} />
            </div>

            <FAQSection />
          </div>
        );
      case Page.MENU:
        return (
          <div className="max-w-4xl mx-auto">
            <MenuView
              items={items}
              isLoading={isLoadingMenu}
              onSelectItem={(item) => {
                setSelectedItem(item);
                setIsItemModalOpen(true);
              }}
              activeSection={activeMenuSection}
              onSectionChange={setActiveMenuSection}
              onOpenShareApp={() => {
                setShareModalItem(null);
                setIsShareModalOpen(true);
              }}
            />
          </div>
        );
      case Page.BLOG:
        return (
          <div className="max-w-4xl mx-auto px-4">
            <BlogView
              posts={posts}
              onSelectDish={(dishId) => {
                const item = items.find((i) => i.id === dishId);
                if (item) {
                  setSelectedItem(item);
                  setIsItemModalOpen(true);
                } else {
                  setCurrentPage(Page.MENU);
                }
              }}
              onGoToMenu={() => setCurrentPage(Page.MENU)}
            />
          </div>
        );
      case Page.GALLERY:
        return (
          <div className="max-w-5xl mx-auto px-4">
            <GalleryView
              items={galleryItems}
              onSelectDish={(dishId) => {
                const item = items.find((i) => i.id === dishId);
                if (item) {
                  setSelectedItem(item);
                  setIsItemModalOpen(true);
                } else {
                  setCurrentPage(Page.MENU);
                }
              }}
              onGoToMenu={() => setCurrentPage(Page.MENU)}
            />
          </div>
        );
      case Page.TRAITEUR:
        return (
          <div className="max-w-2xl mx-auto">
            <TraiteurView />
          </div>
        );
      case Page.INFOS:
        return (
          <div className="max-w-2xl mx-auto">
            <GuideView onClose={() => setCurrentPage(Page.HOME)} />
          </div>
        );
      case Page.CART:
        return (
          <div className="max-w-2xl mx-auto">
            <CartView
              cart={cart}
              setCart={setCart}
              onOrderPlace={handleOrderPlace}
              onClose={() => setCurrentPage(Page.MENU)}
              userProfile={userProfile}
              onConsumePoints={(pts) =>
                setUserProfile((prev) => ({
                  ...prev,
                  points: Math.max(0, prev.points - pts),
                }))
              }
            />
          </div>
        );
      case Page.COMPTE:
        return (
          <div className="max-w-xl mx-auto">
            <AccountView
              orders={orders}
              userProfile={userProfile}
              onAdminAccess={() => setCurrentPage(Page.ADMIN)}
              onLoginSuccess={(isAdmin, customProfile) => {
                if (isAdmin) {
                  setCurrentPage(Page.ADMIN);
                } else {
                  if (customProfile) {
                    setUserProfile(customProfile);
                  }
                  setCurrentPage(Page.COMPTE);
                }
              }}
              onOpenGuide={() => setCurrentPage(Page.INFOS)}
              onUpdateOrder={(updatedOrder) => {
                setOrders((prev) =>
                  prev.map((o) =>
                    o.id === updatedOrder.id ? updatedOrder : o,
                  ),
                );
              }}
              onOpenInstallModal={() => setIsInstallModalOpen(true)}
              onOpenShareModal={() => {
                setShareModalItem(null);
                setIsShareModalOpen(true);
              }}
            />
          </div>
        );
      case Page.ADMIN:
        return (
          <AdminDashboard
            items={items}
            setItems={setItems}
            orders={orders}
            setOrders={setOrders}
            reviews={reviews}
            setReviews={setReviews}
            posts={posts}
            setPosts={setPosts}
            galleryItems={galleryItems}
            setGalleryItems={setGalleryItems}
            clients={clients}
            setClients={setClients}
            onExit={() => setCurrentPage(Page.COMPTE)}
          />
        );
      default:
        return (
          <div className="max-w-4xl mx-auto">
            <MenuView
              items={items}
              onSelectItem={(item) => {
                setSelectedItem(item);
                setIsItemModalOpen(true);
              }}
              activeSection={activeMenuSection}
              onSectionChange={setActiveMenuSection}
            />
          </div>
        );
    }
  };

  const upsellSuggestions = useMemo(() => {
    return items
      .filter(
        (i) => i.category === "Boisson Froide" || i.category === "Dessert",
      )
      .slice(0, 4);
  }, [items]);

  return (
    <div className="min-h-screen bg-[#FDFCFB] font-sans text-brand-brown selection:bg-brand-orange selection:text-white pb-safe flex flex-col items-center">
      <div className="w-full h-full flex flex-col items-center">
        {renderPage()}
      </div>

      {currentPage !== Page.ADMIN && (
        <>
          <Navbar
            currentPage={currentPage}
            setPage={setCurrentPage}
            cartCount={cart.reduce((a, b) => a + b.quantity, 0)}
          />
          <AIChat />
        </>
      )}

      <ItemDetailsModal
        item={selectedItem}
        isOpen={isItemModalOpen}
        onClose={() => setIsItemModalOpen(false)}
        onAddToCart={handleAddToCart}
        onShareItem={(item) => {
          setShareModalItem(item);
          setIsShareModalOpen(true);
        }}
      />

      <UpsellModal
        isOpen={isUpsellOpen}
        onClose={() => setIsUpsellOpen(false)}
        suggestions={upsellSuggestions}
        onAdd={(item) => {
          handleAddToCart(item, 1, "");
          setIsUpsellOpen(false);
        }}
        onProceed={() => {
          setIsUpsellOpen(false);
          setCurrentPage(Page.CART);
        }}
      />

      <InstallGuideModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
        deferredPrompt={deferredPrompt}
        onInstallClick={handleInstallClick}
      />

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        item={shareModalItem}
        onShowToast={(msg) => showToast(msg, "success")}
      />

      {lastOrder && (
        <Receipt order={lastOrder} onClose={() => setLastOrder(null)} />
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* BANNIÈRE ALERTE SONORE ET VISUELLE DE COMMANDE */}
      {newOrderAlert && (
        <div className="fixed top-4 left-4 right-4 z-50 max-w-xl mx-auto bg-gradient-to-r from-[#2C1810] via-[#3E2723] to-[#1C0D08] border-2 border-brand-gold text-white p-4 sm:p-5 rounded-3xl shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-3 animate-slide-up">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-brand-gold/20 text-brand-gold border border-brand-gold/40 flex items-center justify-center shrink-0 animate-bounce">
              <Bell size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                <span className="text-[10px] font-black uppercase text-brand-gold tracking-widest italic">
                  NOUVELLE COMMANDE EN LIGNE !
                </span>
              </div>
              <p className="text-xs font-black italic text-white uppercase mt-0.5">
                {newOrderAlert.id} • {newOrderAlert.customerName} ({newOrderAlert.total + newOrderAlert.deliveryFee} F CFA)
              </p>
              <p className="text-[9px] text-white/70 font-medium">
                Quartier: {newOrderAlert.district} • Double transmission active
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={() => playSound("notification")}
              className="px-3 py-2 bg-brand-gold text-brand-brown font-black text-[9px] uppercase rounded-xl shadow-md active:scale-95 transition-all flex items-center gap-1"
              title="Réécouter l'Alerte Sonore"
            >
              🔊 Son
            </button>
            <a
              href={`https://wa.me/22796000000?text=${encodeURIComponent(`Bonjour Khady's Food, confirmation pour la commande ${newOrderAlert.id}`)}`}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[9px] uppercase rounded-xl shadow-md active:scale-95 transition-all flex items-center gap-1"
            >
              <MessageCircle size={14} /> WhatsApp
            </a>
            <button
              onClick={() => setNewOrderAlert(null)}
              className="p-2 text-white/50 hover:text-white font-black text-xs"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <VideoDemoModal
        isOpen={isVideoDemoOpen}
        onClose={() => setIsVideoDemoOpen(false)}
        onNavigateMenu={() => setCurrentPage(Page.MENU)}
      />
    </div>
  );
};

export default App;
