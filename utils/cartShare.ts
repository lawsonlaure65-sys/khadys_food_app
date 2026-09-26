import { CartItem } from '../types';

/**
 * Compact representation of cart item for URL sharing
 */
export interface SharedCartPayloadItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  category?: string;
  description?: string;
  isSpicy?: boolean;
  isSpécialitéMaison?: boolean;
  isPlatDuJour?: boolean;
  instructions?: string;
}

/**
 * Encode cart items into a compact, URL-safe base64 string
 */
export function encodeSharedCart(cart: CartItem[]): string {
  if (!cart || cart.length === 0) return '';

  const compactList: SharedCartPayloadItem[] = cart.map(item => ({
    id: item.id,
    name: item.name,
    price: Number(item.price) || 0,
    quantity: Math.max(1, Number(item.quantity) || 1),
    image: item.image || '',
    category: item.category || 'Plat Africain',
    description: item.description || '',
    isSpicy: !!item.isSpicy,
    isSpécialitéMaison: !!item.isSpécialitéMaison,
    isPlatDuJour: !!item.isPlatDuJour,
    instructions: item.instructions || ''
  }));

  try {
    const jsonStr = JSON.stringify(compactList);
    // Safe UTF-8 Base64 encoding
    const utf8Bytes = encodeURIComponent(jsonStr).replace(/%([0-9A-F]{2})/g, (_, p1) =>
      String.fromCharCode(parseInt(p1, 16))
    );
    const base64 = btoa(utf8Bytes)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    return base64;
  } catch (e) {
    console.warn('Avertissement encodage panier partagé:', e);
    return encodeURIComponent(JSON.stringify(compactList));
  }
}

/**
 * Decode shared cart payload from URL-safe string
 */
export function decodeSharedCart(encodedString: string): CartItem[] | null {
  if (!encodedString || typeof encodedString !== 'string') return null;

  try {
    let base64 = encodedString.trim().replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }

    const decodedUtf8 = atob(base64);
    const jsonStr = decodeURIComponent(
      Array.prototype.map
        .call(decodedUtf8, (c: string) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );

    const parsed = JSON.parse(jsonStr);
    if (!Array.isArray(parsed) || parsed.length === 0) return null;

    return parsed.map((item: any, index: number) => ({
      id: item.id || `item-shared-${index}-${Date.now()}`,
      name: item.name || 'Plat Khady\'s Food',
      description: item.description || '',
      price: Number(item.price) || 0,
      quantity: Math.max(1, Number(item.quantity) || 1),
      image: item.image || 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=500',
      category: item.category || 'Plat Africain',
      rating: 5,
      isAvailable: true,
      isSpicy: !!item.isSpicy,
      isSpécialitéMaison: !!item.isSpécialitéMaison,
      isPlatDuJour: !!item.isPlatDuJour,
      instructions: item.instructions || ''
    }));
  } catch (err) {
    // Fallback: try raw decodeURIComponent + JSON.parse
    try {
      const jsonStr = decodeURIComponent(encodedString);
      const parsed = JSON.parse(jsonStr);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((item: any, index: number) => ({
          id: item.id || `item-shared-${index}-${Date.now()}`,
          name: item.name || 'Plat Khady\'s Food',
          description: item.description || '',
          price: Number(item.price) || 0,
          quantity: Math.max(1, Number(item.quantity) || 1),
          image: item.image || 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=500',
          category: item.category || 'Plat Africain',
          rating: 5,
          isAvailable: true,
          isSpicy: !!item.isSpicy,
          isSpécialitéMaison: !!item.isSpécialitéMaison,
          isPlatDuJour: !!item.isPlatDuJour,
          instructions: item.instructions || ''
        }));
      }
    } catch {
      console.warn('Failed to parse shared cart string');
    }
    return null;
  }
}

/**
 * Generate full shareable URL with shared_cart parameter
 */
export function generateCartShareUrl(cart: CartItem[]): string {
  if (typeof window === 'undefined') return '';
  const encoded = encodeSharedCart(cart);
  if (!encoded) return window.location.href;

  const url = new URL(window.location.origin + window.location.pathname);
  url.searchParams.set('shared_cart', encoded);
  return url.toString();
}

/**
 * Generate formatted WhatsApp sharing text
 */
export function generateCartShareWhatsAppText(cart: CartItem[], shareUrl: string): string {
  const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const itemsList = cart
    .map(item => `• ${item.quantity}x ${item.name} (${(item.price * item.quantity).toLocaleString('fr-FR')} F CFA)`)
    .join('\n');

  return `🥘 *Khady's Food & Event — Panier Partagé* 🥘\n\n` +
    `Salam ! Voici ma sélection gourmande prête à commander :\n\n` +
    `${itemsList}\n\n` +
    `💰 *Total festin : ${total.toLocaleString('fr-FR')} F CFA*\n\n` +
    `👉 *Clique ici pour ouvrir et pré-remplir directement ton panier :*\n` +
    `${shareUrl}`;
}
