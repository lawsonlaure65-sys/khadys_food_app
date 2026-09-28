import { GoogleGenAI } from "@google/genai";
import { MENU_ITEMS, BILLO_INFO, RESTAURANT_INFO } from "../constants";
import { MenuItem, Order } from "../types";

export interface ChatMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

export interface RecommendationResult {
  recommendations: {
    dish: MenuItem;
    similarityReason: string;
    tag: string;
  }[];
  flavorProfile?: string;
  isAiGenerated?: boolean;
}

export const getPersonalizedRecommendations = async (
  orders: Order[],
  items: MenuItem[]
): Promise<RecommendationResult> => {
  const eligibleItems = (items.length > 0 ? items : MENU_ITEMS).filter((it) => {
    const n = (it.name || '').toLowerCase();
    return (
      it.isAvailable !== false &&
      !n.includes('doukounou') &&
      !n.includes('attiéké') &&
      !n.includes('attieke') &&
      it.id !== 'douk-royal' &&
      it.id !== 'attieke-royal' &&
      it.id !== 'af3'
    );
  });

  const picked = eligibleItems.slice(0, 3);
  return {
    isAiGenerated: false,
    flavorProfile: orders.length > 0 ? 'Saveurs sahéliennes & spécialités braisées' : 'Grands classiques de la maison Khady',
    recommendations: picked.map((dish, idx) => ({
      dish,
      similarityReason:
        idx === 0
          ? 'Incontournable plébiscité pour sa générosité et ses épices maison.'
          : idx === 1
          ? 'Accord idéal avec nos boissons naturelles fraîches (Bissap, Bouye).'
          : 'Préparé minute avec des produits frais sélectionnés chaque matin.',
      tag: idx === 0 ? 'Coup de Cœur' : idx === 1 ? 'Sélection Chef' : 'Populaire',
    })),
  };
};

export const getSmartResponse = async (userMessage: string, history: ChatMessage[] = []): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const systemInstruction = `
      Tu es "Khady IA", l'ambassadrice culinaire de "Khady's Food & Event" à Niamey.
      
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
      model: 'gemini-3-flash-preview',
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