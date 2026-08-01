
import React, { useState, useEffect, useMemo } from 'react';
import Navbar from './components/Navbar';
import AIChat from './components/AIChat';
import AdminDashboard from './components/AdminDashboard';
import MenuView from './components/MenuView';
import CartView from './components/CartView';
import AccountView from './components/AccountView';
import TraiteurView from './components/TraiteurView';
import GuideView from './components/GuideView';
import ItemDetailsModal from './components/ItemDetailsModal';
import UpsellModal from './components/UpsellModal';
import Receipt from './components/Receipt';
import Toast, { ToastType } from './components/Toast';
import DeliveryEstimator from './components/DeliveryEstimator';
import ReviewsSection from './components/ReviewsSection';
import { BlogView } from './components/BlogView';
import { GalleryView } from './components/GalleryView';
import { VideoDemoModal } from './components/VideoDemoModal';
import { AIGourmandeWidget } from './components/AIGourmandeWidget';
import { InstallGuideModal } from './components/InstallGuideModal';
import { ShareModal } from './components/ShareModal';
import FAQSection from './components/FAQSection';
import { Page, MenuItem, Order, Review, CartItem, UserProfile, BlogPost, GalleryItem, ClientUser } from './types';
import { MENU_ITEMS, REVIEWS, LOGO_URL, POINTS_PER_1000, INITIAL_BLOG_POSTS, INITIAL_GALLERY_ITEMS, INITIAL_CLIENTS } from './constants';
import { playSound } from './utils/audio';
import { db, isSupabaseConfigured } from './lib/supabase';
import { ShoppingBag, User as UserIcon, Heart, Utensils, Star, Sparkles, Navigation, Info, BookOpen, Camera, Play, Volume2, VolumeX, Bell, Flame, WifiOff, Download, Share2 } from 'lucide-react';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>(Page.HOME);
  const [items, setItems] = useState<MenuItem[]>(MENU_ITEMS);
  const [posts, setPosts] = useState<BlogPost[]>(INITIAL_BLOG_POSTS);
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>(INITIAL_GALLERY_ITEMS);
  const [clients, setClients] = useState<ClientUser[]>(INITIAL_CLIENTS);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [reviews, setReviews] = useState<Review[]>(REVIEWS);
  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: 'Abdou R.',
    phone: '+227 90 00 00 00',
    points: 1250,
    rank: 'Gold',
    referralCode: 'KHADY-GOLD'
  });
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [isUpsellOpen, setIsUpsellOpen] = useState(false);
  const [lastOrder, setLastOrder] = useState<Order | null>(null);
  const [toast, setToast] = useState<{ message: string, type: ToastType } | null>(null);
  const [activeMenuSection, setActiveMenuSection] = useState('CARTE');
  const [isVideoDemoOpen, setIsVideoDemoOpen] = useState(false);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [isLoadingMenu, setIsLoadingMenu] = useState(true);

  const [greetingIndex, setGreetingIndex] = useState(0);
  const greetings = ["SALAM 👋🏾", "BONJOUR 👋🏾", "BARKA 👋🏾", "FOFO 👋🏾", "VOTRE FESTIN ? 🥘"];

  // Mode Hors-Ligne & Install PWA Prompt
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareModalItem, setShareModalItem] = useState<MenuItem | null>(null);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      showToast("Réseau rétabli ! Mode en ligne actif.", 'success');
    };
    const handleOffline = () => {
      setIsOnline(false);
      showToast("Mode Hors-Ligne actif. Vos données restent disponibles.", 'info');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        showToast("Installation de Khady's Food réussie !", 'success');
      }
      setDeferredPrompt(null);
      setIsInstallModalOpen(false);
    }
  };

  // Chargement initial depuis Supabase
  useEffect(() => {
    const loadCloudData = async () => {
      setIsLoadingMenu(true);
      if (isSupabaseConfigured) {
        try {
          const cloudMenu = await db.fetchMenu();
          if (cloudMenu && cloudMenu.length > 0) setItems(cloudMenu);
          
          const cloudOrders = await db.fetchOrders();
          if (cloudOrders) setOrders(cloudOrders);
        } catch {
          // Utilisation fluide des données locales si le réseau ou la BDD Supabase ne répond pas
        }
      }
      setIsLoadingMenu(false);
    };
    loadCloudData();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setGreetingIndex((prev) => (prev + 1) % greetings.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const showToast = (message: string, type: ToastType = 'success') => {
    setToast({ message, type });
  };

  const handleAddToCart = (item: MenuItem, quantity: number, instructions: string) => {
    const cartItem: CartItem = { ...item, quantity, instructions };
    setCart(prev => [...prev, cartItem]);
    showToast(`${quantity}x ${item.name} ajouté !`);
    playSound('pop');
    
    if (item.category === 'Plat Africain' || item.category === 'Spécialité Maison') {
      setIsUpsellOpen(true);
    }
  };

  const handleOrderPlace = async (order: Order) => {
    setOrders(prev => [order, ...prev]);
    setLastOrder(order);
    
    // Attribution des points : 100 points par 1000 F (basé sur le total de la commande)
    const pointsEarned = Math.floor(order.total / 1000) * POINTS_PER_1000;
    
    setUserProfile(prev => {
      const newPoints = prev.points + pointsEarned;
      let newRank = prev.rank;
      if (newPoints > 5000) newRank = 'Platinum';
      else if (newPoints > 2000) newRank = 'Gold';
      else newRank = 'Silver';

      return { ...prev, points: newPoints, rank: newRank };
    });

    setCurrentPage(Page.HOME);
    showToast(`Festin en préparation ! +${pointsEarned} points gagnés ✨`, 'success');

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
                  <span className="text-white font-bold truncate">🔴 Live Niamey : Abdoulaye à Plateau vient de recevoir sa Box Sauce Mafé 🔥</span>
                </div>
                <span className="text-[8px] bg-brand-orange text-white px-2 py-0.5 rounded-full shrink-0">Billo 18mn</span>
              </div>
            </div>

            {/* Offline Alert Banner */}
            {!isOnline && (
              <div className="mx-4 sm:mx-6 bg-amber-500 text-white p-3.5 rounded-2xl shadow-lg flex items-center justify-between text-xs font-bold animate-pulse">
                <div className="flex items-center gap-2">
                  <WifiOff size={18} />
                  <span>Mode Hors-Ligne activé — Vos commandes et menus sont accessibles localement.</span>
                </div>
              </div>
            )}

            {/* Header Elite */}
            <header className="sticky top-0 z-50 px-3 sm:px-6 py-3 sm:py-4 glass-card flex justify-between items-center rounded-b-[2rem] sm:rounded-b-[2.5rem] shadow-lg">
              <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                <div className="relative">
                  <img src={LOGO_URL} alt="Logo" className="w-10 h-10 sm:w-11 sm:h-11 rounded-full border-2 border-brand-brown/10 shadow-md object-cover" />
                  <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 sm:w-4 sm:h-4 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
                </div>
                <div className="flex flex-col">
                  <h1 className="text-xs sm:text-[13px] font-black italic text-brand-brown uppercase tracking-tighter leading-none">Khady's</h1>
                  <span className="text-[7px] sm:text-[8px] font-black text-brand-orange uppercase tracking-[0.15em] sm:tracking-[0.2em] leading-none mt-0.5 sm:mt-1">Food & Event</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                <button
                  onClick={() => { playSound('pop'); setIsInstallModalOpen(true); }}
                  className="w-8 h-8 sm:w-9 sm:h-9 bg-brand-brown text-brand-gold hover:bg-brand-orange hover:text-white rounded-xl flex items-center justify-center shadow-md active:scale-90 transition-all shrink-0"
                  title="Installer l'application"
                >
                  <Download size={15} className="sm:w-4 sm:h-4" />
                </button>

                <button
                  onClick={() => { playSound('pop'); setShareModalItem(null); setIsShareModalOpen(true); }}
                  className="w-8 h-8 sm:w-9 sm:h-9 bg-brand-orange text-white rounded-xl flex items-center justify-center shadow-md active:scale-90 transition-all shrink-0"
                  title="Partager l'application"
                >
                  <Share2 size={15} className="sm:w-4 sm:h-4" />
                </button>

                <div className="hidden xs:flex sm:flex bg-brand-brown/5 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-xl items-center justify-center min-w-[70px] sm:min-w-[90px] border border-brand-brown/10">
                  <span className="text-[8px] sm:text-[9px] font-black text-brand-brown uppercase italic tracking-wider animate-fade-in truncate" key={greetingIndex}>
                    {greetings[greetingIndex]}
                  </span>
                </div>

                {/* Audio Sound Toggle */}
                <button 
                  onClick={() => {
                    setIsSoundEnabled(!isSoundEnabled);
                    playSound('pop');
                  }}
                  className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center transition-all shrink-0 ${
                    isSoundEnabled ? 'bg-brand-orange/10 text-brand-orange border border-brand-orange/20' : 'bg-gray-100 text-gray-400'
                  }`}
                  title={isSoundEnabled ? "Sons & Notifications Actifs" : "Sons Désactivés"}
                >
                  {isSoundEnabled ? <Volume2 size={15} className="sm:w-4 sm:h-4" /> : <VolumeX size={15} className="sm:w-4 sm:h-4" />}
                </button>

                <button onClick={() => { playSound('pop'); setCurrentPage(Page.COMPTE); }} className="w-8 h-8 sm:w-9 sm:h-9 bg-brand-brown text-brand-gold rounded-xl flex items-center justify-center shadow-lg active:scale-90 transition-transform shrink-0">
                  <UserIcon size={15} className="sm:w-4 sm:h-4"/>
                </button>
              </div>
            </header>

            {/* Banner Hero */}
            <div className="px-4 sm:px-6 overflow-hidden">
              <div className="relative h-60 sm:h-64 rounded-[3rem] shadow-2xl overflow-hidden group border-2 border-brand-brown/10">
                <div className="absolute inset-0 z-10 bg-gradient-to-r from-black/80 via-black/40 to-transparent"></div>
                <img 
                  src="https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=1000" 
                  className="absolute inset-0 w-full h-full object-cover animate-zoom-dezoom" 
                  alt="Banner" 
                />
                <div className="absolute inset-0 z-20 flex flex-col justify-center px-8 sm:px-10 space-y-3">
                  <div className="flex items-center gap-2">
                    <Sparkles size={14} className="text-brand-gold animate-pulse" />
                    <span className="bg-brand-orange/90 text-white text-[8px] font-black px-3.5 py-1 rounded-full uppercase italic tracking-widest shadow-lg">L'Excellence à Niamey</span>
                  </div>
                  
                  <h2 className="text-3xl sm:text-4xl font-black text-white italic uppercase tracking-tighter leading-[0.9]">
                    LE GÔUT <br/><span className="text-brand-gold">DES ROIS</span>
                  </h2>

                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <button 
                      onClick={() => { playSound('pop'); setCurrentPage(Page.MENU); }} 
                      className="bg-brand-orange text-white px-6 py-2.5 rounded-full text-[9px] font-black uppercase italic shadow-xl flex items-center gap-2 hover:bg-brand-gold hover:text-brand-brown transition-colors"
                    >
                      Commander maintenant <Navigation size={12} />
                    </button>

                    <button 
                      onClick={() => { playSound('pop'); setIsVideoDemoOpen(true); }}
                      className="bg-black/60 hover:bg-black/80 text-brand-gold border border-brand-gold/40 backdrop-blur-md px-5 py-2.5 rounded-full text-[9px] font-black uppercase italic flex items-center gap-2 shadow-lg active:scale-95 transition-all"
                    >
                      <Play size={12} fill="currentColor" /> Démo Vidéo Restaurant
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Gourmande Widget */}
            <div className="px-4 sm:px-6">
              <AIGourmandeWidget items={items} onSelectItem={(item) => { setSelectedItem(item); setIsItemModalOpen(true); }} />
            </div>

            {/* Menu Grid */}
            <div className="px-4 sm:px-6 grid grid-cols-1 sm:grid-cols-5 gap-3">
              <div className="sm:col-span-3 bg-[#1A0F0D] rounded-[2.5rem] p-8 shadow-2xl flex flex-col items-center justify-center relative overflow-hidden group active:scale-95 transition-all cursor-pointer border border-white/5 h-48 sm:h-auto" onClick={() => { setActiveMenuSection('CARTE'); setCurrentPage(Page.MENU); }}>
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                <div className="w-16 h-16 bg-brand-gold/10 rounded-2xl flex items-center justify-center text-brand-gold mb-3 relative z-10 border border-white/10"><Utensils size={32}/></div>
                <span className="text-[11px] font-black uppercase text-brand-gold tracking-[0.4em] italic relative z-10">LA CARTE</span>
              </div>
              <div className="sm:col-span-2 flex flex-row sm:flex-col gap-3">
                <button onClick={() => { setActiveMenuSection('PACK'); setCurrentPage(Page.MENU); }} className="flex-1 bg-brand-gold text-brand-brown py-5 rounded-[1.8rem] font-black uppercase text-[9px] italic flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all border border-white/20">
                   BUFFET PRO
                </button>
                <button onClick={() => { setActiveMenuSection('BOX'); setCurrentPage(Page.MENU); }} className="flex-1 bg-brand-orange text-white py-5 rounded-[1.8rem] font-black uppercase text-[9px] italic flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all border border-white/20">
                   BOX SAUCES
                </button>
              </div>
              <button onClick={() => setCurrentPage(Page.TRAITEUR)} className="sm:col-span-5 w-full bg-white text-brand-brown py-5 rounded-[1.8rem] font-black uppercase text-[9px] italic border border-gray-100 flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all">
                   EVENT & DEVIS
              </button>
            </div>

            {/* Incontournables */}
            <section className="mb-6">
              <div className="flex items-center justify-between mb-8 px-6 sm:px-8">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-brand-orange/10 rounded-xl text-brand-orange"><Heart size={18} fill="currentColor" /></div>
                  <h3 className="text-sm font-black uppercase text-brand-brown tracking-[0.2em] italic">Incontournables</h3>
                </div>
                <button onClick={() => setCurrentPage(Page.MENU)} className="text-[9px] font-black text-brand-orange uppercase tracking-widest underline">Tout voir</button>
              </div>
              
              <div className="relative overflow-hidden w-full">
                <div className="flex animate-infinite-scroll w-fit gap-6 sm:gap-8 px-6 flex-nowrap py-4">
                  {[...items.slice(0, 10), ...items.slice(0, 10)].map((item, i) => (
                    <div key={i} className="w-56 sm:w-60 flex-shrink-0 glass-card rounded-[3rem] p-5 shadow-2xl border border-white/20 flex flex-col cursor-pointer active:scale-95 transition-all group" onClick={() => { setSelectedItem(item); setIsItemModalOpen(true); playSound('pop'); }}>
                      <div className="w-full h-40 overflow-hidden rounded-[2.2rem] mb-5 shadow-inner bg-gray-100">
                        <img src={item.image} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-115" alt={item.name} />
                      </div>
                      <h4 className="text-[11px] font-black uppercase text-brand-brown italic mb-3 truncate">{item.name}</h4>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-black text-brand-orange px-4 py-1.5 bg-brand-orange/10 rounded-full">{item.price} F</span>
                        <div className="flex gap-0.5">
                          {[...Array(5)].map((_, i) => <Star key={i} size={10} fill={i < 4 ? "#FFD700" : "none"} className="text-brand-gold" />)}
                        </div>
                      </div>
                    </div>
                  ))}
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
              onSelectItem={(item) => { setSelectedItem(item); setIsItemModalOpen(true); }} 
              activeSection={activeMenuSection} 
              onSectionChange={setActiveMenuSection} 
              onOpenShareApp={() => { setShareModalItem(null); setIsShareModalOpen(true); }}
            />
          </div>
        );
      case Page.BLOG:
        return <div className="max-w-4xl mx-auto px-4"><BlogView posts={posts} onSelectDish={(dishId) => { const item = items.find(i => i.id === dishId); if (item) { setSelectedItem(item); setIsItemModalOpen(true); } else { setCurrentPage(Page.MENU); } }} onGoToMenu={() => setCurrentPage(Page.MENU)} /></div>;
      case Page.GALLERY:
        return <div className="max-w-5xl mx-auto px-4"><GalleryView items={galleryItems} onSelectDish={(dishId) => { const item = items.find(i => i.id === dishId); if (item) { setSelectedItem(item); setIsItemModalOpen(true); } else { setCurrentPage(Page.MENU); } }} onGoToMenu={() => setCurrentPage(Page.MENU)} /></div>;
      case Page.TRAITEUR:
        return <div className="max-w-2xl mx-auto"><TraiteurView /></div>;
      case Page.INFOS:
        return <div className="max-w-2xl mx-auto"><GuideView onClose={() => setCurrentPage(Page.HOME)} /></div>;
      case Page.CART:
        return <div className="max-w-2xl mx-auto">
          <CartView 
            cart={cart} 
            setCart={setCart} 
            onOrderPlace={handleOrderPlace} 
            onClose={() => setCurrentPage(Page.MENU)} 
            userProfile={userProfile}
            onConsumePoints={(pts) => setUserProfile(prev => ({ ...prev, points: Math.max(0, prev.points - pts) }))}
          />
        </div>;
      case Page.COMPTE:
        return <div className="max-w-xl mx-auto">
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
              setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
            }}
            onOpenInstallModal={() => setIsInstallModalOpen(true)}
            onOpenShareModal={() => { setShareModalItem(null); setIsShareModalOpen(true); }}
          />
        </div>;
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
        return <div className="max-w-4xl mx-auto"><MenuView items={items} onSelectItem={(item) => { setSelectedItem(item); setIsItemModalOpen(true); }} activeSection={activeMenuSection} onSectionChange={setActiveMenuSection} /></div>;
    }
  };

  const upsellSuggestions = useMemo(() => {
    return items.filter(i => i.category === 'Boisson Froide' || i.category === 'Dessert').slice(0, 4);
  }, [items]);

  return (
    <div className="min-h-screen bg-[#FDFCFB] font-sans text-brand-brown selection:bg-brand-orange selection:text-white pb-safe flex flex-col items-center">
      <div className="w-full h-full flex flex-col items-center">
        {renderPage()}
      </div>
      
      {currentPage !== Page.ADMIN && (
        <>
          <Navbar currentPage={currentPage} setPage={setCurrentPage} cartCount={cart.reduce((a, b) => a + b.quantity, 0)} />
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
        onAdd={(item) => { handleAddToCart(item, 1, ''); setIsUpsellOpen(false); }}
        onProceed={() => { setIsUpsellOpen(false); setCurrentPage(Page.CART); }}
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
        onShowToast={(msg) => showToast(msg, 'success')}
      />

      {lastOrder && (
        <Receipt order={lastOrder} onClose={() => setLastOrder(null)} />
      )}

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
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
