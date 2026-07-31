import React, { useState } from 'react';
import { ClientUser } from '../types';
import { 
  Users, Award, Gift, Search, Plus, Send, Sparkles, MessageCircle, DollarSign, Check
} from 'lucide-react';
import { playSound } from '../utils/audio';
import { RESTAURANT_INFO } from '../constants';

interface ClientsMgmtViewProps {
  clients: ClientUser[];
  setClients: React.Dispatch<React.SetStateAction<ClientUser[]>>;
}

export const ClientsMgmtView: React.FC<ClientsMgmtViewProps> = ({ clients, setClients }) => {
  const [search, setSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState<ClientUser | null>(null);
  const [pointsToAdd, setPointsToAdd] = useState(100);

  const filtered = clients.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.phone.includes(search) || 
    c.district.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddPoints = (clientId: string) => {
    playSound('cash');
    setClients(prev => prev.map(c => {
      if (c.id === clientId) {
        const newPts = c.points + pointsToAdd;
        const newRank = newPts > 3000 ? 'Platinum' : newPts > 1000 ? 'Gold' : 'Silver';
        return { ...c, points: newPts, rank: newRank };
      }
      return c;
    }));
    alert(`+${pointsToAdd} points crédités avec succès !`);
  };

  const handleSendWhatsAppPromo = (client: ClientUser) => {
    playSound('pop');
    const msg = `Salam ${client.name} ! 🌟\nVotre fidélité chez Khady's Food (Cuisine Cloud Niamey) vous donne droit à 1000 F de réduction sur votre prochaine commande !\nPoints actuels : ${client.points} pts (${client.rank}).\n\nCommandez sur : https://khadys-food.app`;
    window.open(`https://wa.me/${client.phone.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="space-y-6 text-white animate-fade-in pb-10">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1A0F0D] via-[#2A1510] to-[#1A0F0D] p-8 rounded-[3rem] border border-white/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-2xl font-black italic uppercase text-brand-gold flex items-center gap-2">
            <Users size={24} /> Base Clients & Fidélité Privilège
          </h3>
          <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest mt-1">
            Gérez les rangs Silver, Gold, Platinum et créditez des points de récompense
          </p>
        </div>

        <div className="relative w-full md:w-64">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            placeholder="Rechercher nom, téléphone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white/10 rounded-2xl text-xs text-white placeholder:text-white/40 font-bold border border-white/10 outline-none focus:border-brand-gold"
          />
        </div>
      </div>

      {/* Grid Client Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {filtered.map((client) => {
          const rankColor = client.rank === 'Platinum' ? 'bg-purple-500/20 text-purple-300 border-purple-500/40' : client.rank === 'Gold' ? 'bg-brand-gold/20 text-brand-gold border-brand-gold/40' : 'bg-gray-500/20 text-gray-300 border-gray-500/40';

          return (
            <div
              key={client.id}
              className="bg-white/5 p-6 rounded-[2.5rem] border border-white/10 space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-black text-sm uppercase italic text-white">{client.name}</h4>
                    <p className="text-[10px] text-brand-gold font-mono font-bold">{client.phone}</p>
                  </div>
                  <span className={`text-[8px] font-black uppercase px-3 py-1 rounded-full border ${rankColor}`}>
                    Rang {client.rank}
                  </span>
                </div>

                <div className="p-3 bg-black/40 rounded-2xl border border-white/5 grid grid-cols-2 gap-2 text-[9px] font-bold">
                  <div>
                    <p className="text-white/40 uppercase">Quartier</p>
                    <p className="text-white">{client.district}</p>
                  </div>
                  <div>
                    <p className="text-white/40 uppercase">Commandes</p>
                    <p className="text-brand-orange">{client.totalOrders} festins</p>
                  </div>
                  <div>
                    <p className="text-white/40 uppercase">Solde Points</p>
                    <p className="text-brand-gold font-black">{client.points} pts</p>
                  </div>
                  <div>
                    <p className="text-white/40 uppercase">Total Dépensé</p>
                    <p className="text-green-400">{client.totalSpent} F</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-white/5 flex gap-2">
                <button
                  onClick={() => handleAddPoints(client.id)}
                  className="flex-1 bg-white/10 hover:bg-white/20 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-wider text-brand-gold border border-white/10 transition-all flex items-center justify-center gap-1"
                >
                  <Plus size={12} /> +100 Pts
                </button>

                <button
                  onClick={() => handleSendWhatsAppPromo(client)}
                  className="flex-1 bg-green-500/20 hover:bg-green-500 hover:text-white py-2.5 rounded-xl text-[9px] font-black uppercase tracking-wider text-green-400 border border-green-500/30 transition-all flex items-center justify-center gap-1"
                >
                  <MessageCircle size={12} /> Offre WhatsApp
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
