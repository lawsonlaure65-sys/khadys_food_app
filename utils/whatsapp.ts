import { CartItem, Order } from '../types';
import { RESTAURANT_INFO, BILLO_INFO } from '../constants';

export const cleanPhoneNumber = (phone: string): string => {
  if (!phone) return RESTAURANT_INFO.whatsappClean;
  
  // Remove non-digit characters
  let digits = phone.replace(/\D/g, '');
  
  // Remove leading 00
  if (digits.startsWith('00')) {
    digits = digits.slice(2);
  }
  
  // If Niger 8-digit number without country code (e.g. 74441621 or 90202525)
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

const formatCartItemLine = (it: CartItem): string => {
  let line = `• ${it.quantity}x *${it.name}* — ${(it.price * it.quantity).toLocaleString('fr-FR')} F CFA (${it.price.toLocaleString('fr-FR')} F/u)`;
  const details: string[] = [];
  if (it.spiceLevel) details.push(`🌶️ Piment : ${it.spiceLevel}`);
  if (it.instructions && it.instructions.trim()) details.push(`📝 Note : ${it.instructions.trim()}`);
  if (details.length > 0) {
    line += `\n   ↳ _${details.join(' | ')}_`;
  }
  return line;
};

export const buildDirectWhatsAppCartMessage = (params: {
  cart: CartItem[];
  customerName?: string;
  customerPhone?: string;
  district?: string;
  address?: string;
  paymentMethod?: string;
  subtotal: number;
  discount?: number;
  deliveryFee?: number;
  total: number;
  orderNote?: string;
}): string => {
  const {
    cart,
    customerName,
    customerPhone,
    district,
    address,
    paymentMethod,
    subtotal,
    discount = 0,
    deliveryFee = 0,
    total,
    orderNote
  } = params;

  let msg = `*Salam Khady's Food & Event !* 🥘✨\n`;
  msg += `Je souhaite passer la commande suivante :\n\n`;

  msg += `📋 *DÉTAIL DE LA COMMANDE :*\n`;
  cart.forEach((it) => {
    msg += `${formatCartItemLine(it)}\n`;
  });

  msg += `\n💰 *Sous-total plats :* ${subtotal.toLocaleString('fr-FR')} F CFA\n`;
  if (discount > 0) {
    msg += `🎁 *Réduction :* -${discount.toLocaleString('fr-FR')} F CFA\n`;
  }
  if (deliveryFee > 0) {
    msg += `🛵 *Livraison (${district || 'Niamey'}) :* ${deliveryFee.toLocaleString('fr-FR')} F CFA\n`;
  }
  msg += `💵 *TOTAL :* *${total.toLocaleString('fr-FR')} F CFA*\n`;

  if (customerName || customerPhone || district || address || paymentMethod || orderNote) {
    msg += `\n📍 *INFORMATIONS CLIENT :*\n`;
    if (customerName && customerName.trim()) msg += `👤 *Nom :* ${customerName.trim()}\n`;
    if (customerPhone && customerPhone.trim()) msg += `📞 *Téléphone :* ${customerPhone.trim()}\n`;
    if (district) msg += `🏙️ *Quartier :* ${district}${address ? ` (${address.trim()})` : ''}\n`;
    if (paymentMethod) msg += `💳 *Paiement souhaité :* ${paymentMethod}\n`;
    if (orderNote && orderNote.trim()) msg += `📝 *Note globale :* ${orderNote.trim()}\n`;
  }

  msg += `\nMerci de me confirmer la disponibilité et la prise en charge ! 🙏🏾`;
  return msg;
};

export const buildCustomerConfirmationMessage = (order: Order): string => {
  let msg = `*Bonjour ${order.customerName} !* 👩‍🍳✨\n\n`;
  msg += `Votre commande *#${order.id}* d'un montant de *${(order.total + order.deliveryFee).toLocaleString('fr-FR')} F CFA* a bien été reçue par *Khady's Food & Event*.\n\n`;
  msg += `🔥 *Les Cheffes s'activent actuellement en cuisine pour sa préparation !*\n\n`;
  msg += `📍 *Destination :* ${order.district}${order.address ? ` (${order.address})` : ''}\n`;
  msg += `🛵 *Livraison :* Prise en charge par *Billo Express* dès la sortie des fourneaux.\n\n`;
  msg += `*Détail :*\n`;
  order.items.forEach(it => {
    msg += `${formatCartItemLine(it)}\n`;
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
    msg += `${formatCartItemLine(it)}\n`;
  });
  msg += `\n💰 *Sous-Total Repas :* ${order.total.toLocaleString('fr-FR')} F CFA\n`;
  msg += `🛵 *Frais Livraison Billo :* ${order.deliveryFee.toLocaleString('fr-FR')} F CFA\n`;
  msg += `💵 *TOTAL NET À RECOUVRER :* ${(order.total + order.deliveryFee).toLocaleString('fr-FR')} F CFA\n`;
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
  msg += `💵 *Montant Total :* ${(order.total + order.deliveryFee).toLocaleString('fr-FR')} F CFA (${order.paymentMethod})\n`;
  msg += `\nMerci de dépêcher un coursier pour l'enlèvement !`;
  return msg;
};

export const openWhatsApp = (phone: string, text: string): void => {
  const clean = cleanPhoneNumber(phone);
  const url = `https://wa.me/${clean}?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank');
};

