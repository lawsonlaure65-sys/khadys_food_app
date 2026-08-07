import React, { useState } from 'react';
import { BlogPost, MenuItem } from '../types';
import { 
  BookOpen, Heart, MessageSquare, Clock, ArrowRight, Search, 
  Sparkles, ChevronLeft, Share2, Eye, ChefHat, Volume2, Check
} from 'lucide-react';
import { playSound } from '../utils/audio';

interface BlogViewProps {
  posts: BlogPost[];
  onSelectDish: (dishId: string) => void;
  onGoToMenu: () => void;
}

export const BlogView: React.FC<BlogViewProps> = ({ posts, onSelectDish, onGoToMenu }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('TOUS');
  const [searchQuery, setSearchQuery] = useState('');
  const [activePost, setActivePost] = useState<BlogPost | null>(null);
  const [likesMap, setLikesMap] = useState<Record<string, number>>({});
  const [likedPosts, setLikedPosts] = useState<Record<string, boolean>>({});
  const [isNarrating, setIsNarrating] = useState(false);

  const categories = ['TOUS', 'Recettes Secrètes', 'Gastronomie Sahélienne', 'Conseils Nutrition', 'Coulisses Chef'];

  const handleLike = (postId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    playSound('pop');
    setLikedPosts(prev => ({ ...prev, [postId]: !prev[postId] }));
    setLikesMap(prev => {
      const current = prev[postId] ?? posts.find(p => p.id === postId)?.likes ?? 0;
      return { ...prev, [postId]: likedPosts[postId] ? current - 1 : current + 1 };
    });
  };

  const handleNarrate = (text: string) => {
    if ('speechSynthesis' in window) {
      if (isNarrating) {
        window.speechSynthesis.cancel();
        setIsNarrating(false);
        return;
      }
      const utterance = new SpeechSynthesisUtterance(text.slice(0, 300) + "...");
      utterance.lang = 'fr-FR';
      utterance.onend = () => setIsNarrating(false);
      utterance.onerror = () => setIsNarrating(false);
      setIsNarrating(true);
      window.speechSynthesis.speak(utterance);
    } else {
      alert("La synthèse vocale n'est pas supportée par votre navigateur.");
    }
  };

  const filteredPosts = posts.filter(post => {
    const matchesCat = selectedCategory === 'TOUS' || post.category === selectedCategory;
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          post.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          post.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch && post.isPublished;
  });

  return (
    <div className="animate-fade-in space-y-8 pb-32">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-brand-brown via-[#2A1510] to-[#1A0F0D] p-8 sm:p-12 rounded-[3.5rem] border border-brand-gold/20 shadow-2xl relative overflow-hidden text-white">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <BookOpen size={200} className="text-brand-gold" />
        </div>

        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 bg-brand-gold/20 text-brand-gold px-4 py-1.5 rounded-full border border-brand-gold/30 text-[9px] font-black uppercase tracking-widest">
            <ChefHat size={14} /> Le Blog Culinaire de Khady's Food
          </div>
          <h2 className="text-3xl sm:text-4xl font-black italic uppercase text-brand-gold tracking-tight">
            Secrets, Saveurs & Heritage du Sahel
          </h2>
          <p className="text-xs text-white/70 font-medium leading-relaxed">
            Plongez dans l'histoire des épices rares de Niamey, les techniques de cuisson à basse température de la Chef Khady et nos astuces pour manger sainement.
          </p>
        </div>

        {/* Barre de recherche */}
        <div className="mt-8 relative max-w-md z-10">
          <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            placeholder="Rechercher une recette, un ingrédient, une astuce..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-6 py-4 bg-white/10 backdrop-blur-md rounded-2xl text-xs text-white placeholder:text-white/40 font-bold border border-white/10 outline-none focus:border-brand-gold transition-all"
          />
        </div>
      </div>

      {/* Categorization Filter Bar */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => { setSelectedCategory(cat); playSound('pop'); }}
            className={`px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-wider italic whitespace-nowrap transition-all border ${
              selectedCategory === cat
                ? 'bg-brand-orange text-white border-brand-orange shadow-lg scale-105'
                : 'bg-white text-brand-brown/60 border-gray-100 hover:bg-gray-50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid des Articles */}
      {filteredPosts.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-[3rem] border border-gray-100">
          <BookOpen size={48} className="mx-auto text-brand-brown/20 mb-4" />
          <p className="font-black text-xs uppercase tracking-widest text-brand-brown/50 italic">
            Aucun article trouvé dans cette catégorie.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPosts.map((post) => {
            const likesCount = likesMap[post.id] ?? post.likes;
            const isLiked = likedPosts[post.id];

            return (
              <div
                key={post.id}
                onClick={() => { setActivePost(post); playSound('pop'); }}
                className="bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-300 cursor-pointer group flex flex-col justify-between"
              >
                <div className="relative h-56 overflow-hidden">
                  <img
                    src={post.image}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  
                  <span className="absolute top-4 left-4 bg-brand-gold text-brand-brown px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-wider shadow-lg">
                    {post.category}
                  </span>

                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <span className="text-[8px] opacity-70 uppercase font-black tracking-widest flex items-center gap-1.5">
                      <Clock size={10} /> {post.readTime} • {post.date}
                    </span>
                    <h3 className="font-black text-sm uppercase italic line-clamp-2 mt-1 leading-snug text-white group-hover:text-brand-gold transition-colors">
                      {post.title}
                    </h3>
                  </div>
                </div>

                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <p className="text-[10px] text-gray-500 line-clamp-3 font-medium leading-relaxed">
                    {post.subtitle}
                  </p>

                  <div className="pt-4 border-t border-gray-100 flex justify-between items-center text-[10px] text-gray-400 font-bold">
                    <span className="text-brand-brown font-black italic">{post.author}</span>

                    <div className="flex items-center gap-4">
                      <button
                        onClick={(e) => handleLike(post.id, e)}
                        className={`flex items-center gap-1.5 transition-colors ${
                          isLiked ? 'text-red-500' : 'hover:text-red-500'
                        }`}
                      >
                        <Heart size={14} className={isLiked ? 'fill-red-500' : ''} />
                        <span>{likesCount}</span>
                      </button>

                      <span className="flex items-center gap-1.5">
                        <MessageSquare size={14} />
                        <span>{post.commentsCount}</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ARTICLE FULL MODAL */}
      {activePost && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-[3rem] max-w-2xl w-full overflow-hidden shadow-2xl border border-white/20 max-h-[90vh] flex flex-col relative my-auto">
            {/* Header Image */}
            <div className="relative h-64 sm:h-80 shrink-0">
              <img src={activePost.image} alt={activePost.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
              
              <button
                onClick={() => setActivePost(null)}
                className="absolute top-6 left-6 w-10 h-10 bg-black/40 text-white backdrop-blur-md rounded-2xl flex items-center justify-center hover:bg-black transition-all"
              >
                <ChevronLeft size={22} />
              </button>

              <div className="absolute top-6 right-6 flex gap-2">
                <button
                  onClick={() => handleNarrate(activePost.content)}
                  className={`p-3 rounded-2xl text-[10px] font-black uppercase flex items-center gap-1.5 backdrop-blur-md transition-all ${
                    isNarrating ? 'bg-brand-orange text-white' : 'bg-black/40 text-white hover:bg-black/60'
                  }`}
                >
                  <Volume2 size={16} />
                  {isNarrating ? 'Pause Audio' : 'Écouter'}
                </button>
              </div>

              <div className="absolute bottom-6 left-6 right-6 text-white space-y-2">
                <span className="bg-brand-gold text-brand-brown text-[8px] font-black uppercase px-3 py-1 rounded-full">
                  {activePost.category}
                </span>
                <h2 className="text-xl sm:text-2xl font-black italic uppercase text-brand-gold leading-tight">
                  {activePost.title}
                </h2>
                <div className="flex items-center gap-3 text-[9px] text-white/70 font-bold uppercase">
                  <span>Par {activePost.author}</span>
                  <span>•</span>
                  <span>{activePost.date}</span>
                  <span>•</span>
                  <span>{activePost.readTime} de lecture</span>
                </div>
              </div>
            </div>

            {/* Content Body */}
            <div className="p-8 overflow-y-auto space-y-6 text-brand-brown">
              <p className="text-xs font-bold text-brand-orange italic border-l-4 border-brand-orange pl-4 py-1">
                "{activePost.subtitle}"
              </p>

              <div className="text-xs leading-relaxed font-medium whitespace-pre-line text-gray-700 space-y-4">
                {activePost.content}
              </div>

              {/* Action Banner pour le plat associé */}
              {activePost.featuredDishId && (
                <div className="p-6 bg-brand-cream/50 rounded-3xl border border-brand-orange/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <span className="text-[8px] font-black uppercase tracking-widest text-brand-orange">Envie de goûter ?</span>
                    <h4 className="text-xs font-black uppercase italic text-brand-brown">Commander ce plat en 1 Clic</h4>
                  </div>
                  <button
                    onClick={() => {
                      const dishId = activePost.featuredDishId!;
                      setActivePost(null);
                      onSelectDish(dishId);
                    }}
                    className="bg-brand-orange text-white px-6 py-3 rounded-2xl text-[9px] font-black uppercase italic shadow-lg hover:bg-brand-brown transition-all flex items-center gap-2"
                  >
                    Voir dans le Menu <ArrowRight size={14} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
