import { GoogleGenAI } from "@google/genai";
import { MENU_ITEMS, BILLO_INFO, RESTAURANT_INFO } from "../constants";

export interface ChatMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

export const getSmartResponse = async (userMessage: string, history: ChatMessage[] = []): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
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