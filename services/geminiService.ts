import { GoogleGenAI } from "@google/genai";
import { MENU_ITEMS, BILLO_INFO, RESTAURANT_INFO } from "../constants";
import { MenuItem, Order } from "../types";

export interface ChatMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

export interface RecommendedDish {
  dish: MenuItem;
  similarityReason: string;
  tag: string;
}

export interface RecommendationResult {
  flavorProfile: string;
  recommendations: RecommendedDish[];
  isAiGenerated: boolean;
}

const getApiKey = (): string => {
  return (
    ((import.meta as any).env?.VITE_GEMINI_API_KEY) || 
    ((import.meta as any).env?.API_KEY) || 
    (typeof process !== 'undefined' && process.env?.API_KEY) || 
    ''
  );
};

export const getSmartResponse = async (userMessage: string, history: ChatMessage[] = []): Promise<string> => {
  try {
    const apiKey = getApiKey();
    const ai = new GoogleGenAI({ apiKey });
    
    const systemInstruction = `
      Tu es "Conseiller Culinaire Khady", l'ambassadrice culinaire de "Khady's Food & Event" à Niamey.
      
      TON : Luxueux, chaleureux et nigérien. Utilise "Salam", "Barka", "Fofo".
      
      MENU ACTUEL : 
      ${MENU_ITEMS.map(i => `- ${i.name} : ${i.price} F`).join('\n')}
      
      LIVRAISON : 
      - Partenaire : ${BILLO_INFO.name}.
      - Tarifs : 1000F (Centre), 1500F (Périphérie).
      - Règle du Vendredi : Pause entre 12h et 15h.
      
      CONSIGNES :
      1. Suggère toujours un accompagnement (Bissap, Dégué).
      2. Pour les mariages, dirige vers la section "Traiteur".
      3. Réponds de façon courte (2 phrases maximum).
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [...history, { role: 'user', parts: [{ text: userMessage }] }],
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    return response.text || "Barka ! Je suis à votre écoute.";
  } catch (error) {
    console.error("Erreur Khady IA:", error);
    return "Salam ! Je rencontre une petite perturbation technique. Appelez-nous au " + RESTAURANT_INFO.whatsapp;
  }
};

/**
 * RECOMMANDATIONS PERSONNALISÉES GEMINI IA
 * Analyse l'historique des commandes locales pour suggérer des plats similaires
 */
export const getPersonalizedRecommendations = async (
  orders: Order[],
  availableDishes: MenuItem[]
): Promise<RecommendationResult> => {
  // 1. Extraire les plats déjà commandés
  const orderedCounts = new Map<string, { name: string; category?: string; count: number }>();
  orders.forEach(order => {
    order.items?.forEach(item => {
      const existing = orderedCounts.get(item.id) || { name: item.name, category: item.category, count: 0 };
      orderedCounts.set(item.id, {
        name: item.name,
        category: item.category || existing.category,
        count: existing.count + item.quantity
      });
    });
  });

  const orderedSummary = Array.from(orderedCounts.entries()).map(([id, info]) => 
    `${info.count}x ${info.name} (${info.category || 'Plat'})`
  );

  // Moteur de secours algorithmique fiable
  const generateFallback = (reasonPrefix: string): RecommendationResult => {
    const sortedByRating = [...availableDishes].sort((a, b) => (b.rating || 5) - (a.rating || 5));
    const specials = sortedByRating.filter(d => d.isSpécialitéMaison || d.isPlatDuJour);
    const chosen = (specials.length >= 3 ? specials : sortedByRating).slice(0, 3);

    return {
      flavorProfile: orderedSummary.length > 0 
        ? "Amateur d'authenticité nigérienne et de grands classiques du Sahel"
        : "Nouveau Gourmet Khady's Food — Prêt à explorer nos délices phares",
      recommendations: chosen.map((dish, idx) => ({
        dish,
        similarityReason: idx === 0 
          ? `${reasonPrefix} Notre Tiep Royal et ses légumes fondants restent l'expérience signature incontournable.`
          : idx === 1
          ? "Un équilibre savoureux très apprécié par notre communauté à Niamey."
          : "Parfait pour accompagner vos moments de détente gourmande.",
        tag: idx === 0 ? "Spécialité Star" : idx === 1 ? "Saveur Similaire" : "Découverte Gourmande"
      })),
      isAiGenerated: false
    };
  };

  const apiKey = getApiKey();
  if (!apiKey) {
    return generateFallback("Sélection du Chef :");
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    const catalogPrompt = availableDishes.map(d => ({
      id: d.id,
      name: d.name,
      category: d.category,
      price: d.price,
      description: d.description,
      isSpicy: d.isSpicy,
      isSpécialitéMaison: d.isSpécialitéMaison
    }));

    const prompt = `Tu es le sommelier culinaire en chef de "Khady's Food & Event" à Niamey.
Analyse l'historique des commandes d'un client pour lui recommander 3 plats similaires ou parfaitement complémentaires disponibles au menu.

HISTORIQUE DES COMMANDES DU CLIENT :
${orderedSummary.length > 0 ? orderedSummary.join(', ') : 'Aucune commande précédente (nouveau client).'}

CATALOGUE DES PLATS DISPONIBLES :
${JSON.stringify(catalogPrompt, null, 2)}

CONSIGNES :
1. Définis en 1 phrase élégante le "profil gustatif" du client (ex: "Amateur de sauces onctueuses et de riz parfumés aux épices du Sahel").
2. Sélectionne exactement 3 plats du catalogue qui partagent des similitudes (ingrédients, sauces, niveau d'épice, esprit généreux) ou complètent idéalement ses goûts.
3. Pour chaque plat, rédige une raison de recommandation personnalisée, chaleureuse, gourmande et persuasive en français (max 25 mots par raison), qui fait expressément référence à ce qu'il a déjà commandé s'il a un historique.
4. Assigne un tag attractif (ex: "Similaire à votre Tiep", "Coup de Cœur Chef", "Accord Parfait", "Nouvelle Découverte").

Réponds STRICTEMENT avec du JSON valide sous ce format exact sans balises markdown superflues :
{
  "flavorProfile": "...",
  "recommendations": [
    {
      "id": "identifiant_exact_du_plat",
      "similarityReason": "...",
      "tag": "..."
    }
  ]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        temperature: 0.4,
        responseMimeType: "application/json"
      }
    });

    const text = response.text?.trim() || '{}';
    const parsed = JSON.parse(text);

    if (Array.isArray(parsed.recommendations) && parsed.recommendations.length > 0) {
      const recs: RecommendedDish[] = [];
      for (const r of parsed.recommendations) {
        const found = availableDishes.find(d => d.id === r.id);
        if (found && !recs.some(existing => existing.dish.id === found.id)) {
          recs.push({
            dish: found,
            similarityReason: r.similarityReason || "Sélectionné par l'IA selon vos préférences.",
            tag: r.tag || "Recommandé"
          });
        }
      }

      if (recs.length > 0) {
        return {
          flavorProfile: parsed.flavorProfile || "Profil gourmand sur-mesure",
          recommendations: recs.slice(0, 3),
          isAiGenerated: true
        };
      }
    }

    return generateFallback("Recommandation du jour :");
  } catch (err) {
    console.warn("Échec de la recommandation Gemini, utilisation du moteur local :", err);
    return generateFallback("Sélection sur-mesure :");
  }
};
