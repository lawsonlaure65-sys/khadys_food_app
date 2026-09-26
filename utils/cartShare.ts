import { CartItem, MenuCategory } from '../types';
import { MENU_ITEMS } from '../constants';

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

export interface SharedCartMetadata {
  hostName?: string;
  groupNote?: string;
  splitCount?: number;
  createdAt?: number;
}

export interface DecodedSharedCart {
  items: CartItem[];
  metadata: SharedCartMetadata;
}

interface CompactV2Item {
  i: string; // id
  q: number; // quantity
  n?: string; // instructions / notes
  // Only included if item is custom / not in MENU_ITEMS:
  m?: string; // name
  p?: number; // price
  g?: string; // image (URL only, never huge base64)
  c?: string; // category
}

interface CompactV2Envelope {
  v: 2;
  h?: string; // hostName
  t?: string; // groupNote
  s?: number; // splitCount
  d: CompactV2Item[];
}

function toUrlSafeBase64(jsonStr: string): string {
  const utf8Bytes = encodeURIComponent(jsonStr).replace(/%([0-9A-F]{2})/g, (_, p1) =>
    String.fromCharCode(parseInt(p1, 16))
  );
  return btoa(utf8Bytes)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function fromUrlSafeBase64(encodedString: string): string {
  let base64 = encodedString.trim().replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  const decodedUtf8 = atob(base64);
  return decodeURIComponent(
    Array.prototype.map
      .call(decodedUtf8, (c: string) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
      .join('')
  );
}

/**
 * Encode cart items and optional group-order metadata into a compact, URL-safe base64 string
 */
export function encodeSharedCart(cart: CartItem[], metadata?: SharedCartMetadata): string {
  if (!cart || cart.length === 0) return '';

  const catalogMap = new Map(MENU_ITEMS.map((item) => [item.id, item]));

  const compactItems: CompactV2Item[] = cart.map((item) => {
    const catalogMatch = catalogMap.get(item.id);
    const base: CompactV2Item = {
      i: item.id,
      q: Math.max(1, Number(item.quantity) || 1)
    };
    if (item.instructions && item.instructions.trim()) {
      base.n = item.instructions.trim();
    }
    // If not in official catalog or price/name was customized, include compact fields
    if (!catalogMatch || catalogMatch.price !== item.price || catalogMatch.name !== item.name) {
      base.m = item.name;
      base.p = Number(item.price) || 0;
      if (item.image && !item.image.startsWith('data:')) {
        base.g = item.image;
      }
      if (item.category) {
        base.c = item.category;
      }
    }
    return base;
  });

  const envelope: CompactV2Envelope = {
    v: 2,
    d: compactItems
  };

  if (metadata?.hostName?.trim()) {
    envelope.h = metadata.hostName.trim();
  }
  if (metadata?.groupNote?.trim()) {
    envelope.t = metadata.groupNote.trim();
  }
  if (metadata?.splitCount && metadata.splitCount > 1) {
    envelope.s = Math.max(1, Math.round(metadata.splitCount));
  }

  try {
    return toUrlSafeBase64(JSON.stringify(envelope));
  } catch (e) {
    console.warn('Avertissement encodage panier partagé:', e);
    return encodeURIComponent(JSON.stringify(envelope));
  }
}

function hydrateLegacyItems(parsed: any[]): CartItem[] {
  const catalogMap = new Map(MENU_ITEMS.map((m) => [m.id, m]));
  return parsed.map((item: any, index: number) => {
    const match = item.id ? catalogMap.get(item.id) : undefined;
    return {
      id: item.id || `item-shared-${index}-${Date.now()}`,
      name: item.name || match?.name || "Plat Khady's Food",
      description: item.description || match?.description || '',
      price: Number(item.price ?? match?.price) || 0,
      quantity: Math.max(1, Number(item.quantity) || 1),
      image:
        item.image ||
        match?.image ||
        'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=500',
      category: (item.category || match?.category || 'Plat Africain') as MenuCategory,
      rating: match?.rating || 5,
      isAvailable: true,
      isSpicy: Boolean(item.isSpicy ?? match?.isSpicy),
      isSpécialitéMaison: Boolean(item.isSpécialitéMaison ?? match?.isSpécialitéMaison),
      isPlatDuJour: Boolean(item.isPlatDuJour ?? match?.isPlatDuJour),
      instructions: item.instructions || ''
    };
  });
}

function hydrateV2Items(compactList: CompactV2Item[]): CartItem[] {
  const catalogMap = new Map(MENU_ITEMS.map((m) => [m.id, m]));
  return compactList.map((entry, index) => {
    const match = entry.i ? catalogMap.get(entry.i) : undefined;
    return {
      id: entry.i || `item-shared-${index}-${Date.now()}`,
      name: entry.m || match?.name || "Plat Khady's Food",
      description: match?.description || '',
      price: Number(entry.p ?? match?.price) || 0,
      quantity: Math.max(1, Number(entry.q) || 1),
      image:
        entry.g ||
        match?.image ||
        'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=500',
      category: (entry.c || match?.category || 'Plat Africain') as MenuCategory,
      rating: match?.rating || 5,
      isAvailable: true,
      isSpicy: Boolean(match?.isSpicy),
      isSpécialitéMaison: Boolean(match?.isSpécialitéMaison),
      isPlatDuJour: Boolean(match?.isPlatDuJour),
      instructions: entry.n || ''
    };
  });
}

/**
 * Decode shared cart payload with metadata from URL-safe string
 */
export function decodeSharedCartWithMeta(encodedString: string): DecodedSharedCart | null {
  if (!encodedString || typeof encodedString !== 'string') return null;

  const parseRawJson = (jsonStr: string): DecodedSharedCart | null => {
    const parsed = JSON.parse(jsonStr);
    if (parsed && typeof parsed === 'object' && parsed.v === 2 && Array.isArray(parsed.d)) {
      const items = hydrateV2Items(parsed.d);
      if (items.length === 0) return null;
      return {
        items,
        metadata: {
          hostName: parsed.h || undefined,
          groupNote: parsed.t || undefined,
          splitCount: parsed.s ? Number(parsed.s) : undefined
        }
      };
    }
    if (Array.isArray(parsed) && parsed.length > 0) {
      return {
        items: hydrateLegacyItems(parsed),
        metadata: {}
      };
    }
    return null;
  };

  try {
    const jsonStr = fromUrlSafeBase64(encodedString);
    const res = parseRawJson(jsonStr);
    if (res) return res;
  } catch {
    // Fallback to URI component decode
  }

  try {
    const jsonStr = decodeURIComponent(encodedString);
    return parseRawJson(jsonStr);
  } catch {
    console.warn('Failed to parse shared cart string');
    return null;
  }
}

/**
 * Decode shared cart items (backward compatible signature)
 */
export function decodeSharedCart(encodedString: string): CartItem[] | null {
  const res = decodeSharedCartWithMeta(encodedString);
  return res ? res.items : null;
}

/**
 * Extract encoded cart parameter from either a full URL or a raw encoded string
 */
export function extractSharedCartFromInput(input: string): DecodedSharedCart | null {
  if (!input || !input.trim()) return null;
  const trimmed = input.trim();

  try {
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.includes('shared_cart=') || trimmed.includes('cart=')) {
      const urlObj = new URL(trimmed.startsWith('http') ? trimmed : `https://example.com/${trimmed.replace(/^\/+/, '')}`);
      const param = urlObj.searchParams.get('shared_cart') || urlObj.searchParams.get('cart');
      if (param) {
        return decodeSharedCartWithMeta(param);
      }
    }
  } catch {
    // Fallback regex extraction
    const match = trimmed.match(/(?:shared_cart|cart)=([^&\s]+)/);
    if (match?.[1]) {
      return decodeSharedCartWithMeta(match[1]);
    }
  }

  return decodeSharedCartWithMeta(trimmed);
}

/**
 * Merge incoming shared cart items with an existing cart (accumulating quantities for identical items)
 */
export function mergeCartItems(existingCart: CartItem[], incomingItems: CartItem[]): CartItem[] {
  const result = existingCart.map((item) => ({ ...item }));

  for (const incoming of incomingItems) {
    const existingIndex = result.findIndex(
      (item) =>
        item.id === incoming.id &&
        (item.instructions || '').trim() === (incoming.instructions || '').trim()
    );
    if (existingIndex >= 0) {
      result[existingIndex] = {
        ...result[existingIndex],
        quantity: result[existingIndex].quantity + incoming.quantity
      };
    } else {
      result.push({ ...incoming });
    }
  }

  return result;
}

/**
 * Generate full shareable URL with shared_cart parameter
 */
export function generateCartShareUrl(cart: CartItem[], metadata?: SharedCartMetadata): string {
  if (typeof window === 'undefined') return '';
  const encoded = encodeSharedCart(cart, metadata);
  if (!encoded) return window.location.href;

  const url = new URL(window.location.origin + window.location.pathname);
  url.searchParams.set('shared_cart', encoded);
  return url.toString();
}

/**
 * Generate formatted WhatsApp sharing text for individual or group orders
 */
export function generateCartShareWhatsAppText(
  cart: CartItem[],
  shareUrl: string,
  metadata?: SharedCartMetadata
): string {
  const total = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const totalQty = cart.reduce((acc, item) => acc + item.quantity, 0);
  const splitCount = metadata?.splitCount && metadata.splitCount > 1 ? metadata.splitCount : 1;
  const perPerson = splitCount > 1 ? Math.ceil(total / splitCount) : total;

  const itemsList = cart
    .map(
      (item) =>
        `• ${item.quantity}x ${item.name}${item.instructions ? ` _(${item.instructions})_` : ''} — *${(
          item.price * item.quantity
        ).toLocaleString('fr-FR')} F CFA*`
    )
    .join('\n');

  const headerTitle = metadata?.hostName
    ? `🥘 *Khady's Food — Commande Groupée de ${metadata.hostName}* 🤝`
    : `🥘 *Khady's Food & Event — Panier Partagé & Commande Groupée* 🤝`;

  const noteLine = metadata?.groupNote ? `📌 *Note du groupe :* ${metadata.groupNote}\n\n` : '';

  const splitLine =
    splitCount > 1
      ? `👥 *Partage entre ${splitCount} personnes :* ~*${perPerson.toLocaleString('fr-FR')} F CFA / pers.*\n`
      : '';

  return (
    `${headerTitle}\n\n` +
    `${noteLine}` +
    `Salam ! Voici notre sélection gourmande (${totalQty} plat${totalQty > 1 ? 's' : ''}) :\n\n` +
    `${itemsList}\n\n` +
    `💰 *Total du panier : ${total.toLocaleString('fr-FR')} F CFA*\n` +
    `${splitLine}\n` +
    `👉 *Clique sur ce lien pour ouvrir ce panier, ajouter tes plats ou valider la commande :*\n` +
    `${shareUrl}`
  );
}
