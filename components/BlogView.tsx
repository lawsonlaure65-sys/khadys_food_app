import React, { useState } from 'react';
import { BlogArticle } from '../types';
import { Sparkles, BookOpen, Clock, Heart, Share2, ArrowRight, X, ChevronRight, User } from 'lucide-react';
import { playSound } from '../utils/audio';

export const INITIAL_BLOG_ARTICLES: BlogArticle[] = [
  {
    id: 'b1',
    title: 'Les 5 Secrets du Chef Khady pour un Tiep Capitaine Inoubliable',
    summary: 'Découvrez comment le choix du poisson capitaine du Fleuve Niger et la cuisson du riz cassé font toute la différence.',
    content: `Le Tiep Bou Dienn (ou Tiep au Capitaine) est bien plus qu'un simple plat à Niamey : c'est une cérémonie de saveurs.

### 1. La marinade du Capitaine (Roff)
La fraîcheur du poisson capitaine pêché le matin même dans le Fleuve Niger est primordiale. Nous le farcissons généreusement avec le *Roff* : persil frais, ail écrasé, piment saharien et piment de Cayenne.

### 2. Le riz cassé deux fois
Pour obtenir cette texture fondante et non collante, le riz cassé est d'abord cuit à la vapeur au-dessus de la marmite d'épices avant d'être réincorporé dans le bouillon rouge de tomates concentrées et de légumes du Sahel.

### 3. Les légumes racines du terroir
Manioc, chou doux, carottes et aubergines africaines absorbent la quintessence de la sauce sans se défaire.

Goûtez la différence aujourd'hui au restaurant !`,
    author: 'Chef Khady',
    date: '30 Juillet 2026',
    readTime: '3 min',
    image: 'https://images.unsplash.com/photo-1627308595229-7830a5c91f9f?w=1200',
    category: 'Secrets du Chef',
    likes: 342
  },
  {
    id: 'b2',
    title: 'Le Moringa (Kopto) : Pourquoi c\'est le Super-Aliment du Sahel',
    summary: 'Riche en fer, vitamines et antioxydants, découvrez les vertus extraordinaires du Dambou traditionnel.',
    content: `Le Moringa Oleifera, surnommé "l'arbre miracle" à Niamey, est au cœur du célèbre *Dambou* de chez Khady's Food.

### Un trésor nutritionnel
- **7x plus de vitamine C** que les oranges.
- **4x plus de calcium** que le lait.
- **Riche en fer**, parfait pour recharger les batteries au milieu de la journée.

Chez Khady's Food, nous récoltons le moringa frais chaque matin auprès des producteurs maraîchers des bords du fleuve à Goudel.

Commandez votre Dambou du jour chaud et savoureux !`,
    author: 'Khady & Dr. Nutrition',
    date: '25 Juillet 2026',
    readTime: '4 min',
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=1200',
    category: 'Nutrition Sahel',
    likes: 218
  },
  {
    id: 'b3',
    title: 'La Véritable Histoire du Kankankan & Brochettes Suya',
    summary: 'Voyage au cœur de l\'épice mystique des boucher-grilleurs du Sahel.',
    content: `Derrière le parfum irrésistible qui s'échappe des barbecues au feu de bois de Khady's Food à la tombée de la nuit, se cache le *Kankankan*.

### Qu'est-ce que le Kankankan ?
C'est un mélange de poudre d'arachide grillée et déshuilée, mélangée à du piment fort, du gingembre, de l'ail et du poivre de Selim.

Chaque bouchée de filet de bœuf braisé au charbon est une explosion de saveurs fumées et pimentées.

À déguster absolument avec un grand verre de Bissap glacé !`,
    author: 'Maître Grilleur Suya',
    date: '18 Juillet 2026',
    readTime: '2 min',
    image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=1200',
    category: 'Recettes',
    likes: 412
  }
];

interface BlogViewProps {
  articles?: BlogArticle[];
  onNavigateToMenu: () => void;
}

export const BlogView: React.FC<BlogViewProps> = ({ articles = INITIAL_BLOG_ARTICLES, onNavigateToMenu }) => {
  const [selectedArticle, setSelectedArticle] = useState<BlogArticle | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('TOUT');
  const [likedArticles, setLikedArticles] = useState<Record<string, number>>({});

  const categories = ['TOUT', 'Secrets du Chef', 'Recettes', 'Nutrition Sahel', 'Événements'];

  const filtered = activeCategory === 'TOUT' 
    ? articles 
    : articles.filter(a => a.category === activeCategory);

  const toggleLike = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    playSound('pop');
    setLikedArticles(prev => ({
      ...prev,
      [id]: (prev[id] || 0) + 1
    }));
  };

  return (
    <div className="animate-fade-in p-4 sm:p-6 pb-36 max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <header className="flex justify-between items-center">
        <div>
          <span className="text-[9px] font-black uppercase text-brand-orange tracking-[0.3em] flex items-center gap-1.5 mb-1">
            <Sparkles size={14} className="animate-pulse" /> Le Blog de la Chef
          </span>
          <h2 className="text-3xl font-black italic uppercase text-brand-brown leading-none">
            CHRONIQUES <span className="text-brand-orange">CULINAIRES</span>
          </h2>
        </div>
        <div className="w-12 h-12 bg-brand-brown text-brand-gold rounded-2xl flex items-center justify-center shadow-lg">
          <BookOpen size={22} />
        </div>
      </header>

      {/* Category filters */}
      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => { playSound('pop'); setActiveCategory(cat); }}
            className={`px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-wider whitespace-nowrap transition-all ${
              activeCategory === cat 
                ? 'bg-brand-orange text-white shadow-lg scale-105' 
                : 'bg-white text-brand-brown/60 hover:bg-gray-50 border border-gray-100'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Articles Grid */}
      <div className="space-y-6">
        {filtered.map((art) => {
          const extraLikes = likedArticles[art.id] || 0;
          return (
            <div 
              key={art.id}
              onClick={() => { playSound('pop'); setSelectedArticle(art); }}
              className="bg-white rounded-[3rem] p-6 shadow-xl border border-gray-100 cursor-pointer group hover:border-brand-orange transition-all duration-300 relative overflow-hidden"
            >
              <div className="relative h-56 rounded-[2.2rem] overflow-hidden mb-5">
                <img src={art.image} alt={art.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-white text-[8px] font-black uppercase tracking-widest">
                  {art.category}
                </div>
                <div className="absolute bottom-4 right-4 bg-brand-brown/90 backdrop-blur-md text-brand-gold px-3 py-1 rounded-full text-[8px] font-black uppercase flex items-center gap-1">
                  <Clock size={12} /> {art.readTime}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-[9px] font-black text-gray-400 uppercase tracking-widest">
                  <User size={12} className="text-brand-orange" /> {art.author} • {art.date}
                </div>
                <h3 className="text-xl font-black italic uppercase text-brand-brown leading-snug group-hover:text-brand-orange transition-colors">
                  {art.title}
                </h3>
                <p className="text-xs text-gray-500 font-medium line-clamp-2 leading-relaxed">
                  {art.summary}
                </p>
              </div>

              <div className="mt-5 pt-4 border-t border-gray-100 flex justify-between items-center">
                <button 
                  onClick={(e) => toggleLike(art.id, e)}
                  className="flex items-center gap-1.5 text-xs font-black text-red-500 bg-red-50 px-3 py-1.5 rounded-full hover:bg-red-100 transition-colors"
                >
                  <Heart size={14} fill="currentColor" /> {art.likes + extraLikes}
                </button>

                <span className="text-[10px] font-black text-brand-orange uppercase italic flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  Lire la suite <ArrowRight size={14} />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Article Detail Modal */}
      {selectedArticle && (
        <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-md flex items-end justify-center p-0 sm:p-4 animate-fade-in">
          <div className="bg-white w-full max-w-xl h-[92vh] rounded-t-[3.5rem] sm:rounded-[3.5rem] overflow-hidden flex flex-col shadow-2xl animate-slide-up border-4 border-white">
            
            {/* Header image */}
            <div className="relative h-64 shrink-0">
              <img src={selectedArticle.image} alt={selectedArticle.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
              
              <button 
                onClick={() => setSelectedArticle(null)}
                className="absolute top-6 right-6 w-11 h-11 bg-black/50 text-white rounded-full flex items-center justify-center backdrop-blur-md hover:bg-black transition-all"
              >
                <X size={22} />
              </button>

              <div className="absolute bottom-6 left-6 right-6 text-white">
                <span className="bg-brand-orange text-white text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-widest inline-block mb-2">
                  {selectedArticle.category}
                </span>
                <h2 className="text-2xl font-black italic uppercase leading-tight text-white">
                  {selectedArticle.title}
                </h2>
              </div>
            </div>

            {/* Content body */}
            <div className="flex-1 overflow-y-auto p-8 space-y-6 no-scrollbar">
              <div className="flex items-center justify-between text-xs text-gray-400 font-bold border-b border-gray-100 pb-4">
                <span>Par {selectedArticle.author}</span>
                <span>{selectedArticle.date} • {selectedArticle.readTime} de lecture</span>
              </div>

              <div className="prose prose-sm font-medium text-gray-700 leading-relaxed whitespace-pre-line space-y-4">
                {selectedArticle.content}
              </div>

              <div className="bg-brand-orange/10 p-6 rounded-3xl border border-brand-orange/20 text-center space-y-3">
                <h4 className="font-black italic uppercase text-xs text-brand-brown">Envie de goûter à cette spécialité ?</h4>
                <button 
                  onClick={() => { setSelectedArticle(null); onNavigateToMenu(); }}
                  className="bg-brand-orange text-white px-6 py-3 rounded-2xl text-xs font-black uppercase italic shadow-lg active:scale-95 transition-all inline-flex items-center gap-2"
                >
                  Commander au Restaurant <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BlogView;
