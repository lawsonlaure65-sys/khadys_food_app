import React, { useState } from 'react';
import { GalleryItem, MenuItem } from '../types';
import { 
  Camera, Plus, Trash2, Edit3, Sparkles, Image as ImageIcon, Check
} from 'lucide-react';
import { playSound } from '../utils/audio';

interface GalleryMgmtViewProps {
  items: GalleryItem[];
  setItems: React.Dispatch<React.SetStateAction<GalleryItem[]>>;
  menuItems: MenuItem[];
}

export const GalleryMgmtView: React.FC<GalleryMgmtViewProps> = ({ items, setItems, menuItems }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItem, setNewItem] = useState<Partial<GalleryItem>>({
    title: '',
    category: 'Plat Africain',
    image: 'https://images.unsplash.com/photo-1627308595229-7830a5c91f9f?w=800',
    tag: 'Spécialité',
    description: ''
  });

  const handleDelete = (id: string) => {
    if (confirm("Supprimer cette photo de la galerie ?")) {
      playSound('pop');
      setItems(prev => prev.filter(i => i.id !== id));
    }
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.title || !newItem.image) return alert("Titre et image requis");

    const created: GalleryItem = {
      id: `gallery-${Date.now()}`,
      title: newItem.title || 'Création culinaire',
      category: newItem.category || 'Plat Africain',
      image: newItem.image || '',
      likes: Math.floor(50 + Math.random() * 200),
      dishId: newItem.dishId,
      tag: newItem.tag || 'Exclusif',
      description: newItem.description
    };

    setItems(prev => [created, ...prev]);
    setShowAddModal(false);
    playSound('success');
  };

  return (
    <div className="space-y-6 text-white animate-fade-in pb-10">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1A0F0D] via-[#2A1510] to-[#1A0F0D] p-8 rounded-[3rem] border border-white/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-2xl font-black italic uppercase text-brand-gold flex items-center gap-2">
            <Camera size={24} /> Gestion de la Galerie HD
          </h3>
          <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest mt-1">
            Gérez les photos haute définition de vos créations gastronomiques
          </p>
        </div>

        <button
          onClick={() => { setShowAddModal(true); playSound('pop'); }}
          className="bg-brand-gold text-brand-brown px-6 py-3.5 rounded-2xl text-[10px] font-black uppercase italic shadow-xl hover:scale-105 transition-all flex items-center gap-2"
        >
          <Plus size={16} /> Ajouter une Photo HD
        </button>
      </div>

      {/* Photo Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item) => (
          <div
            key={item.id}
            className="bg-white/5 rounded-[2.5rem] border border-white/10 overflow-hidden space-y-4 p-4 flex flex-col justify-between"
          >
            <div className="relative h-48 rounded-2xl overflow-hidden border border-white/10">
              <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
              <span className="absolute top-3 left-3 bg-brand-gold text-brand-brown text-[8px] font-black uppercase px-2.5 py-1 rounded-full">
                {item.category}
              </span>
            </div>

            <div>
              <h4 className="font-black text-xs uppercase italic text-white line-clamp-1">{item.title}</h4>
              <p className="text-[9px] text-white/50 line-clamp-2 mt-1 font-medium">{item.description}</p>
            </div>

            <div className="pt-3 border-t border-white/5 flex justify-between items-center text-[9px] font-bold text-white/40">
              <span>{item.likes} Likes</span>
              <button
                onClick={() => handleDelete(item.id)}
                className="p-2 bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white rounded-xl transition-all"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Add Photo */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-[#1A0F0D] rounded-[3rem] max-w-lg w-full p-8 border border-white/20 space-y-6 text-white my-auto">
            <div className="flex justify-between items-center border-b border-white/10 pb-4">
              <h3 className="text-lg font-black uppercase italic text-brand-gold flex items-center gap-2">
                <ImageIcon size={20} /> Ajouter une Création Visuelle
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-white/40 hover:text-white text-xs font-bold uppercase">Fermer</button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-white/50">Titre de la Création</label>
                <input
                  type="text"
                  required
                  value={newItem.title || ''}
                  onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                  className="w-full p-4 bg-black/40 rounded-2xl text-xs font-bold text-white border border-white/10 outline-none focus:border-brand-gold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-white/50">Catégorie</label>
                  <select
                    value={newItem.category || 'Plat Africain'}
                    onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                    className="w-full p-4 bg-black/40 rounded-2xl text-xs font-bold text-white border border-white/10 outline-none"
                  >
                    <option value="Plat Africain">Plat Africain</option>
                    <option value="Traiteur & Event">Traiteur & Event</option>
                    <option value="Entrée">Entrée</option>
                    <option value="Box Sauce">Box Sauce</option>
                    <option value="Boisson Naturelle">Boisson Naturelle</option>
                    <option value="Dîner & Grillades">Dîner & Grillades</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-white/50">Lier un plat du menu</label>
                  <select
                    value={newItem.dishId || ''}
                    onChange={(e) => setNewItem({ ...newItem, dishId: e.target.value })}
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
                <label className="text-[9px] font-black uppercase text-white/50">URL Image HD</label>
                <input
                  type="text"
                  required
                  value={newItem.image || ''}
                  onChange={(e) => setNewItem({ ...newItem, image: e.target.value })}
                  className="w-full p-4 bg-black/40 rounded-2xl text-xs font-bold text-white border border-white/10 outline-none focus:border-brand-gold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-white/50">Légende / Description</label>
                <textarea
                  rows={3}
                  value={newItem.description || ''}
                  onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                  className="w-full p-4 bg-black/40 rounded-2xl text-xs font-medium text-white border border-white/10 outline-none focus:border-brand-gold"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-brand-gold text-brand-brown py-4 rounded-2xl font-black uppercase italic shadow-xl hover:bg-brand-orange hover:text-white transition-all"
              >
                Publier dans la Galerie
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
