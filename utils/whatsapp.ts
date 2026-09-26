import { Order } from '../types';
import { RESTAURANT_INFO, BILLO_INFO } from '../constants';

export const cleanPhoneNumber = (phone: string): string => {
  if (!phone) return RESTAURANT_INFO.whatsappClean;
  
  // Remove non-digit characters
  let digits = phone.replace(/\D/g, '');
  
  // Remove leading 00
  if (digits.startsWith('00')) {
    digits = digits.slice(2);
  }
  
  // If Niger 8-digit number without country code (e.g. 70032552 or 90202525)
  if (digits.length === 8) {
    digits = '227' + digits;
  }
  
  return digits || RESTAURANT_INFO.whatsappClean;
};

export const getStoredRestaurantWhatsApp = (): { display: string; clean: string } => {
  const saved = localStorage.getItem('khadys_custom_whatsapp');
  if (saved && saved.trim()) {
    const clean = cleanPhoneNumber(saved);
    return { display: saved, clean };
  }
  return {
    display: RESTAURANT_INFO.whatsapp,
    clean: RESTAURANT_INFO.whatsappClean
  };
};

export const buildCustomerConfirmationMessage = (order: Order): string => {
  let msg = `*Bonjour ${order.customerName} !* 👩‍🍳✨\n\n`;
  msg += `Votre commande *#${order.id}* d'un montant de *${order.total + order.deliveryFee} F CFA* a bien été reçue par *Khady's Food & Event*.\n\n`;
  msg += `🔥 *Les Cheffes s'activent actuellement en cuisine pour sa préparation !*\n\n`;
  msg += `📍 *Destination :* ${order.district}${order.address ? ` (${order.address})` : ''}\n`;
  msg += `🛵 *Livraison :* Prise en charge par *Billo Express* dès la sortie des fourneaux.\n\n`;
  msg += `*Détail :*\n`;
  order.items.forEach(it => {
    msg += `• ${it.quantity}x ${it.name} (${it.price * it.quantity} F)\n`;
  });
  msg += `\nMerci infiniment pour votre confiance et excellent appétit ! 🍲🌟\n`;
  msg += `_Khady's Food & Event — L'excellence en un clic_`;
  return msg;
};

export const buildKitchenOrderMessage = (order: Order): string => {
  let msg = `*Salam Khady's Food ! NOUVELLE COMMANDE EN CUISINE (#${order.id})* 🥘✨\n\n`;
  msg += `👤 *Client :* ${order.customerName}\n`;
  msg += `📞 *Téléphone :* ${order.phone}\n`;
  msg += `📍 *Quartier / Adresse :* ${order.district} - ${order.address || 'Au restaurant'}\n\n`;
  msg += `📋 *DÉTAIL DU FESTIN :*\n`;
  order.items.forEach(it => {
    msg += `• ${it.quantity}x ${it.name} (${it.price * it.quantity} F CFA)\n`;
  });
  msg += `\n💰 *Sous-Total Repas :* ${order.total} F CFA\n`;
  msg += `🛵 *Frais Livraison Billo :* ${order.deliveryFee} F CFA\n`;
  msg += `💵 *TOTAL NET À RECOUVRER :* ${order.total + order.deliveryFee} F CFA\n`;
  msg += `💳 *Mode de Paiement :* ${order.paymentMethod}\n`;
  if (order.paymentTransactionId) {
    msg += `📌 *Réf Transaction / Dépôt :* ${order.paymentTransactionId}\n`;
  }
  msg += `\n👩‍🍳 *Action requise :* Lancer la préparation en cuisine immédiatement !`;
  return msg;
};

export const buildBilloDispatchMessage = (order: Order): string => {
  let msg = `*Bonjour Billo Express ! DEMANDE DE COURSE LIVRAISON (#${order.id})* 🏍️💨\n\n`;
  msg += `👤 *Client :* ${order.customerName}\n`;
  msg += `📞 *Téléphone Client :* ${order.phone}\n`;
  msg += `📍 *Adresse de Livraison :* ${order.district} - ${order.address || 'Plateau'}\n`;
  msg += `🏢 *Point de Ramassage :* Khady's Food (Grande mosquée Muamar Kadafi, Niamey)\n`;
  msg += `💵 *Montant Total :* ${order.total + order.deliveryFee} F CFA (${order.paymentMethod})\n`;
  msg += `\nMerci de dépêcher un coursier pour l'enlèvement !`;
  return msg;
};

export const openWhatsApp = (phone: string, text: string): void => {
  const clean = cleanPhoneNumber(phone);
  const url = `https://api.whatsapp.com/send?phone=${clean}&text=${encodeURIComponent(text)}`;
  window.open(url, '_blank');
};
