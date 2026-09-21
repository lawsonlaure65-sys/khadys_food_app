export interface LoyaltyTierInfo {
  name: 'Silver' | 'Gold' | 'Platinum';
  minPoints: number;
  nextPoints: number;
  multiplier: number;
  badge: string;
  title: string;
  perks: string[];
  gradient: string;
  color: string;
}

export const LOYALTY_TIERS: Record<'Silver' | 'Gold' | 'Platinum', LoyaltyTierInfo> = {
  Silver: {
    name: 'Silver',
    minPoints: 0,
    nextPoints: 2000,
    multiplier: 1.0,
    badge: '🥈 Silver Gourmet',
    title: 'Membre Gourmet',
    perks: ['100 pts par tranche de 1 000 F', 'Réductions convertibles au panier', 'Accès prioritaire aux plats du jour'],
    gradient: 'from-gray-700 to-gray-900',
    color: 'text-gray-300'
  },
  Gold: {
    name: 'Gold',
    minPoints: 2000,
    nextPoints: 5000,
    multiplier: 1.25,
    badge: '🥇 Gold Prestige (+25%)',
    title: 'Membre Prestige',
    perks: ['+25% de points bonus sur chaque festin', 'Cadeau gourmand aux anniversaires', 'Traitement express en cuisine'],
    gradient: 'from-amber-600 to-yellow-600',
    color: 'text-amber-400'
  },
  Platinum: {
    name: 'Platinum',
    minPoints: 5000,
    nextPoints: Infinity,
    multiplier: 1.5,
    badge: '👑 Platinum Élite (+50%)',
    title: 'Membre Élite Impériale',
    perks: ['+50% de points bonus sur chaque commande', 'Livraison prioritaire garantie', 'Dégustations privées & créations du Chef'],
    gradient: 'from-purple-900 via-indigo-900 to-amber-900',
    color: 'text-amber-300'
  }
};

/**
 * Calcule dynamiquement les points gagnés pour un montant de commande selon le rang
 */
export function calculateDynamicPoints(amount: number, rank: 'Silver' | 'Gold' | 'Platinum' = 'Silver'): number {
  if (amount <= 0) return 0;
  const base = Math.floor(amount / 1000) * 100;
  const multiplier = LOYALTY_TIERS[rank]?.multiplier || 1.0;
  return Math.round(base * multiplier);
}

/**
 * Calcule la valeur monétaire des points (100 points = 100 F CFA)
 */
export function pointsToFCA(points: number): number {
  return Math.floor(points / 100) * 100;
}

/**
 * Calcule le rang en fonction du nombre total de points
 */
export function getRankFromPoints(points: number): 'Silver' | 'Gold' | 'Platinum' {
  if (points >= 5000) return 'Platinum';
  if (points >= 2000) return 'Gold';
  return 'Silver';
}

/**
 * Calcule la progression dynamique vers le prochain palier
 */
export function getTierProgress(points: number, currentRank: 'Silver' | 'Gold' | 'Platinum'): {
  progressPercent: number;
  pointsToNext: number;
  nextRankName: string;
} {
  const currentTier = LOYALTY_TIERS[currentRank];
  if (currentRank === 'Platinum') {
    return {
      progressPercent: 100,
      pointsToNext: 0,
      nextRankName: 'Rang Suprême Atteint'
    };
  }

  const nextTier = currentRank === 'Silver' ? LOYALTY_TIERS.Gold : LOYALTY_TIERS.Platinum;
  const range = nextTier.minPoints - currentTier.minPoints;
  const currentInTier = points - currentTier.minPoints;
  const percent = Math.min(100, Math.max(0, (currentInTier / range) * 100));
  const pointsRemaining = Math.max(0, nextTier.minPoints - points);

  return {
    progressPercent: Math.round(percent),
    pointsToNext: pointsRemaining,
    nextRankName: nextTier.name
  };
}
