import { Order, OrderStatus } from '../types';

/**
 * Demande l'autorisation des notifications Web Push au navigateur
 */
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) {
    console.warn("Ce navigateur ne prend pas en charge les notifications de bureau.");
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch (error) {
    console.error("Erreur lors de la demande de permission de notification:", error);
    return false;
  }
};

/**
 * Obtenir le message en français selon l'état de préparation
 */
export const getOrderStatusMessage = (status: OrderStatus, customerName?: string): { title: string; body: string } => {
  const name = customerName ? ` ${customerName}` : '';
  switch (status) {
    case 'RECEIVED':
      return {
        title: "Commande reçue 🍳 - Khady's Food",
        body: `Bonjour${name}, votre commande a bien été enregistrée et est transmise à la cuisine.`
      };
    case 'CONFIRMED':
      return {
        title: "Commande confirmée 👍 - Khady's Food",
        body: `Excellente nouvelle${name} ! La cuisine a confirmé votre commande.`
      };
    case 'PREPARING':
      return {
        title: "Festin en préparation 🥘 - Khady's Food",
        body: `Le Chef Khady est au fourneau pour vous concocter un repas savoureux !`
      };
    case 'READY':
      return {
        title: "Commande prête ! 📦 - Khady's Food",
        body: `Votre festin est chaud et prêt à être remis au livreur.`
      };
    case 'DELIVERING':
      return {
        title: "Livreur en route 🛵 - Khady's Food",
        body: `Le livreur fait cap vers votre adresse. Préparez-vous à vous régaler !`
      };
    case 'DELIVERED':
      return {
        title: "Festin livré 🎉 - Bon Appétit !",
        body: `Votre commande a été livrée. Merci de faire confiance à Khady's Food & Event.`
      };
    case 'CANCELLED':
      return {
        title: "Commande annulée ❌ - Khady's Food",
        body: `Votre commande a été annulée. N'hésitez pas à contacter notre service client.`
      };
    default:
      return {
        title: "Khady's Food & Event 🍳",
        body: "Statut de votre commande mis à jour."
      };
  }
};

/**
 * Envoie une notification Push Web (Browser / Service Worker)
 */
export const sendOrderNotification = async (order: Order): Promise<void> => {
  if (!('Notification' in window)) return;

  if (Notification.permission === 'granted') {
    const { title, body } = getOrderStatusMessage(order.status, order.customerName);
    
    // Essayer de passer par le Service Worker s'il est actif
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        if (registration && registration.showNotification) {
          registration.showNotification(title, {
            body,
            icon: '/manifest.json',
            badge: '/manifest.json',
            vibrate: [200, 100, 200],
            data: { url: '/' }
          } as NotificationOptions & { vibrate?: number[] });
          return;
        }
      } catch (e) {
        console.warn("Utilisation du fallback Notification standard:", e);
      }
    }

    // Fallback notification navigateur classique
    new Notification(title, {
      body,
      icon: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c'
    });
  }
};
