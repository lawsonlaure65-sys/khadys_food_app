import React, { useState } from 'react';
import { BlogPost, MenuItem } from '../types';
import { 
  BookOpen, Plus, Trash2, Edit3, Sparkles, Check, RefreshCw, 
  Eye, ToggleLeft, ToggleRight, Search, FileText
} from 'lucide-react';
import { playSound } from '../utils/audio';
import { GoogleGenAI } from '@google/genai';

interface BlogMgmtViewProps {
  posts: BlogPost[];
  setPosts: React.Dispatch<React.SetStateAction<BlogPost[]>>;
  menuItems: MenuItem[];
}

export const BlogMgmtView: React.FC<BlogMgmtViewProps> = ({ posts, setPosts, menuItems }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [aiTopic, setAiTopic] = useState('');

  const [newPost, setNewPost] = useState<Partial<BlogPost>>({
    title: '',
    subtitle: '',
    content: '',
    author: 'Chef Khady',
    category: 'Recettes Secrètes',
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800',
    readTime: '3 min',
    isPublished: true
  });

  const handleTogglePublish = (id: string) => {
    playSound('pop');
    setPosts(prev => prev.map(p => p.id === id ? { ...p, isPublished: !p.isPublished } : p));
  };

  const handleDelete = (id: string) => {
    if (confirm("Supprimer cet article ?")) {
      playSound('pop');
      setPosts(prev => prev.filter(p => p.id !== id));
    }
  };

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPost.title || !newPost.content) return alert("Titre et contenu requis");

    const created: BlogPost = {
      id: `blog-${Date.now()}`,
      title: newPost.title || 'Sans titre',
      subtitle: newPost.subtitle || '',
      content: newPost.content || '',
      author: newPost.author || 'Chef Khady',
      date: new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }),
      readTime: newPost.readTime || '3 min',
      image: newPost.image || 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800',
      category: (newPost.category as any) || 'Recettes Secrètes',
      likes: 0,
      commentsCount: 0,
      isPublished: newPost.isPublished ?? true,
      featuredDishId: newPost.featuredDishId
    };

    setPosts(prev => [created, ...prev]);
    setShowAddModal(false);
    playSound('success');
  };

  const handleAiGeneratePost = async () => {
    if (!aiTopic.trim()) return alert("Saisissez un thème pour l'IA (ex: Le secret de la sauce gombo)");
    setIsGenerating(true);
    playSound('pop');

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
      const prompt = `Génère un article de blog gastronomique captivant pour le restaurant Khady's Food à Niamey sur le thème "${aiTopic}".
Format de réponse JSON strict :
{
  "title": "Titre accrocheur et gourmand",
  "subtitle": "Sous-titre résumé en 1 phrase",
  "content": "Contenu complet rédigé en 3 paragraphes captivants mettant en valeur les ingrédients locaux de Niamey et du Sahel.",
  "category": "Recettes Secrètes",
  "readTime": "3 min"
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
      });

      const text = response.text || '';
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        setNewPost(prev => ({
          ...prev,
          title: parsed.title,
          subtitle: parsed.subtitle,
          content: parsed.content,
          category: parsed.category || 'Recettes Secrètes',
          readTime: parsed.readTime || '3 min'
        }));
        setIsGenerating(false);
        playSound('notification');
      } else {
        throw new Error("Format JSON non détecté");
      }
    } catch (e) {
      setIsGenerating(false);
      alert("L'IA a généré un article. Vérifiez les champs.");
    }
  };

  return (
    <div className="space-y-6 text-white animate-fade-in pb-10">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1A0F0D] via-[#2A1510] to-[#1A0F0D] p-8 rounded-[3rem] border border-white/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-2xl font-black italic uppercase text-brand-gold flex items-center gap-2">
            <BookOpen size={24} /> Gestion du Blog Culinaire
          </h3>
          <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest mt-1">
            Publiez des récits gastronomiques pour fidéliser la communauté
          </p>
        </div>

        <button
          onClick={() => { setShowAddModal(true); playSound('pop'); }}
          className="bg-brand-gold text-brand-brown px-6 py-3.5 rounded-2xl text-[10px] font-black uppercase italic shadow-xl hover:scale-105 transition-all flex items-center gap-2"
        >
          <Plus size={16} /> Nouvel Article / Rédacteur Auto
        </button>
      </div>

      {/* List of Posts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {posts.map((post) => (
          <div
            key={post.id}
            className="bg-white/5 p-6 rounded-[2.5rem] border border-white/10 flex flex-col justify-between space-y-4 relative"
          >
            <div className="flex gap-4">
              <img
                src={post.image}
                alt={post.title}
                className="w-24 h-24 rounded-2xl object-cover shrink-0 border border-white/10"
              />
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="bg-brand-gold/20 text-brand-gold text-[8px] font-black uppercase px-2 py-0.5 rounded-md border border-brand-gold/30">
                    {post.category}
                  </span>
                  <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-md ${post.isPublished ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    {post.isPublished ? 'Publié' : 'Brouillon'}
                  </span>
                </div>
                <h4 className="font-black text-xs uppercase italic text-white line-clamp-2">
                  {post.title}
                </h4>
                <p className="text-[9px] text-white/50 font-bold line-clamp-2">
                  {post.subtitle}
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-white/5 flex justify-between items-center text-[9px] text-white/40 font-bold">
              <span>{post.date} • {post.likes} Likes</span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleTogglePublish(post.id)}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-all flex items-center gap-1 text-[8px] uppercase font-black"
                >
                  {post.isPublished ? <ToggleRight size={16} className="text-green-400" /> : <ToggleLeft size={16} className="text-white/40" />}
                  {post.isPublished ? 'Masquer' : 'Afficher'}
                </button>

                <button
                  onClick={() => handleDelete(post.id)}
                  className="p-2 bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white rounded-xl transition-all"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL CREATION / AI GENERATION */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-[#1A0F0D] rounded-[3rem] max-w-2xl w-full p-8 border border-white/20 space-y-6 text-white my-auto max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-white/10 pb-4">
              <h3 className="text-lg font-black uppercase italic text-brand-gold flex items-center gap-2">
                <Sparkles size={20} /> Créer un Article de Blog
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-white/40 hover:text-white text-xs font-bold uppercase">Fermer</button>
            </div>

            {/* Assistant Prompt Box */}
            <div className="p-4 bg-brand-brown/60 rounded-2xl border border-brand-gold/30 space-y-3">
              <label className="text-[9px] font-black uppercase text-brand-gold flex items-center gap-1.5">
                <Sparkles size={14} /> Assistant Rédaction Culinaire
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Thème (ex: Le secret de notre marinade Kankankan pour Suya)"
                  value={aiTopic}
                  onChange={(e) => setAiTopic(e.target.value)}
                  className="flex-1 p-3 bg-black/40 rounded-xl text-xs font-bold text-white border border-white/10 outline-none"
                />
                <button
                  type="button"
                  onClick={handleAiGeneratePost}
                  disabled={isGenerating}
                  className="bg-brand-orange text-white px-5 rounded-xl text-[9px] font-black uppercase italic hover:bg-brand-gold hover:text-brand-brown transition-all disabled:opacity-50 shrink-0"
                >
                  {isGenerating ? <RefreshCw size={14} className="animate-spin" /> : 'Rédiger L\'Article'}
                </button>
              </div>
            </div>

            {/* Manual Form */}
            <form onSubmit={handleCreatePost} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-white/50">Titre de l'article</label>
                <input
                  type="text"
                  required
                  value={newPost.title || ''}
                  onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                  className="w-full p-4 bg-black/40 rounded-2xl text-xs font-bold text-white border border-white/10 outline-none focus:border-brand-gold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-white/50">Sous-titre / Résumé</label>
                <input
                  type="text"
                  value={newPost.subtitle || ''}
                  onChange={(e) => setNewPost({ ...newPost, subtitle: e.target.value })}
                  className="w-full p-4 bg-black/40 rounded-2xl text-xs font-bold text-white border border-white/10 outline-none focus:border-brand-gold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-white/50">Catégorie</label>
                  <select
                    value={newPost.category || 'Recettes Secrètes'}
                    onChange={(e) => setNewPost({ ...newPost, category: e.target.value as any })}
                    className="w-full p-4 bg-black/40 rounded-2xl text-xs font-bold text-white border border-white/10 outline-none"
                  >
                    <option value="Recettes Secrètes">Recettes Secrètes</option>
                    <option value="Gastronomie Sahélienne">Gastronomie Sahélienne</option>
                    <option value="Conseils Nutrition">Conseils Nutrition</option>
                    <option value="Coulisses Chef">Coulisses Chef</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-white/50">Plat associé du menu</label>
                  <select
                    value={newPost.featuredDishId || ''}
                    onChange={(e) => setNewPost({ ...newPost, featuredDishId: e.target.value })}
                    className="w-full p-4 bg-black/40 rounded-2xl text-xs font-bold text-white border border-white/10 outline-none"
                  >
                    <option value="">Aucun plat lié</option>
                    {menuItems.map(m => (
                      <option key={m.id} value={m.id}>{m.name} ({m.price} F)</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-white/50">URL Image d'illustration</label>
                <input
                  type="text"
                  value={newPost.image || ''}
                  onChange={(e) => setNewPost({ ...newPost, image: e.target.value })}
                  className="w-full p-4 bg-black/40 rounded-2xl text-xs font-bold text-white border border-white/10 outline-none focus:border-brand-gold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-white/50">Contenu de l'article</label>
                <textarea
                  rows={6}
                  required
                  value={newPost.content || ''}
                  onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                  className="w-full p-4 bg-black/40 rounded-2xl text-xs font-medium text-white border border-white/10 outline-none focus:border-brand-gold"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-brand-gold text-brand-brown py-4 rounded-2xl font-black uppercase italic shadow-xl hover:bg-brand-orange hover:text-white transition-all"
              >
                Publier l'Article sur le Blog
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
