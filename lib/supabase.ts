
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { MenuItem, Order } from '../types';

export const KHADY_SUPABASE_URL_KEY = 'khadys_custom_supabase_url';
export const KHADY_SUPABASE_ANON_KEY = 'khadys_custom_supabase_anon_key';
export const KHADY_SUPABASE_AUTO_SYNC_KEY = 'khadys_supabase_auto_sync';

// Extraction et assainissement automatique de l'origine exacte (ex: https://xxxx.supabase.co)
export function sanitizeSupabaseUrl(urlStr: string): string {
  if (!urlStr) return '';
  const trimmed = urlStr.trim();
  try {
    const formatted = trimmed.startsWith('http') ? trimmed : `https://${trimmed}`;
    const parsed = new URL(formatted);
    return parsed.origin;
  } catch {
    return trimmed.replace(/\/+$/, '').replace(/\/(rest|ret)\/v1\/?$/i, '');
  }
}

/**
 * Récupère les identifiants Supabase actifs :
 * 1. Priorité aux clés personnalisées saisies par l'Admin (localStorage)
 * 2. Repli sur les variables d'environnement Vite (import.meta.env)
 */
export function getActiveSupabaseCredentials(): { url: string; anonKey: string; isCustom: boolean } {
  let customUrl = '';
  let customKey = '';

  try {
    customUrl = localStorage.getItem(KHADY_SUPABASE_URL_KEY) || '';
    customKey = localStorage.getItem(KHADY_SUPABASE_ANON_KEY) || '';
  } catch {
    // localStorage inaccessible
  }

  if (customUrl.trim() && customKey.trim()) {
    return {
      url: sanitizeSupabaseUrl(customUrl),
      anonKey: customKey.trim(),
      isCustom: true,
    };
  }

  const envUrl = ((import.meta as any).env?.VITE_SUPABASE_URL || '').trim();
  const envKey = ((import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '').trim();

  return {
    url: sanitizeSupabaseUrl(envUrl),
    anonKey: envKey,
    isCustom: false,
  };
}

/**
 * Vérifie si la configuration Supabase actuelle est valide
 */
export function checkSupabaseConfigured(url?: string, key?: string): boolean {
  const creds = (url !== undefined && key !== undefined)
    ? { url: sanitizeSupabaseUrl(url), anonKey: key.trim() }
    : getActiveSupabaseCredentials();

  return (
    Boolean(creds.url) &&
    creds.url.startsWith('https://') &&
    !creds.url.includes('votre_projet') &&
    !creds.url.includes('votre-projet') &&
    !creds.url.includes('your-project') &&
    Boolean(creds.anonKey) &&
    creds.anonKey.length > 20
  );
}

// Instance singleton dynamique
let cachedClient: SupabaseClient | null = null;
let lastClientUrl = '';
let lastClientKey = '';

export function getSupabaseClient(): SupabaseClient | null {
  const creds = getActiveSupabaseCredentials();
  const configured = checkSupabaseConfigured(creds.url, creds.anonKey);

  if (!configured) {
    cachedClient = null;
    return null;
  }

  if (cachedClient && lastClientUrl === creds.url && lastClientKey === creds.anonKey) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(creds.url, creds.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
    lastClientUrl = creds.url;
    lastClientKey = creds.anonKey;
    return cachedClient;
  } catch (err) {
    console.error('Erreur initialisation Supabase Client:', err);
    cachedClient = null;
    return null;
  }
}

// Variable exportée pour rétrocompatibilité directe avec App.tsx et AdminDashboard.tsx
export let isSupabaseConfigured = checkSupabaseConfigured();

export function getIsSupabaseConfigured(): boolean {
  isSupabaseConfigured = checkSupabaseConfigured();
  return isSupabaseConfigured;
}

// Proxy pour compatibilité avec l'export existant `supabase`
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getSupabaseClient();
    if (!client) return undefined;
    const value = (client as any)[prop];
    if (typeof value === 'function') {
      return value.bind(client);
    }
    return value;
  },
});

/**
 * Paramètres Supabase complets pour l'Admin
 */
export function getSupabaseConfig(): {
  url: string;
  anonKey: string;
  isConfigured: boolean;
  isCustom: boolean;
  autoSync: boolean;
} {
  const creds = getActiveSupabaseCredentials();
  const autoSync = isAutoSyncEnabled();
  const isConfigured = checkSupabaseConfigured(creds.url, creds.anonKey);
  return {
    url: creds.url,
    anonKey: creds.anonKey,
    isConfigured,
    isCustom: creds.isCustom,
    autoSync,
  };
}

export function isAutoSyncEnabled(): boolean {
  try {
    const val = localStorage.getItem(KHADY_SUPABASE_AUTO_SYNC_KEY);
    // Par défaut activé (true)
    return val !== 'false';
  } catch {
    return true;
  }
}

export function saveAutoSyncSetting(enabled: boolean): void {
  try {
    localStorage.setItem(KHADY_SUPABASE_AUTO_SYNC_KEY, enabled ? 'true' : 'false');
  } catch (err) {
    console.warn('Impossible de sauvegarder autoSync:', err);
  }
}

export function saveSupabaseConfig(url: string, anonKey: string, autoSync: boolean = true): void {
  const clean = sanitizeSupabaseUrl(url);
  try {
    localStorage.setItem(KHADY_SUPABASE_URL_KEY, clean);
    localStorage.setItem(KHADY_SUPABASE_ANON_KEY, anonKey.trim());
    localStorage.setItem(KHADY_SUPABASE_AUTO_SYNC_KEY, autoSync ? 'true' : 'false');
  } catch (err) {
    console.warn('Impossible de sauvegarder la configuration Supabase:', err);
  }

  // Réinitialiser le client en cache
  cachedClient = null;
  lastClientUrl = '';
  lastClientKey = '';
  isSupabaseConfigured = checkSupabaseConfigured(clean, anonKey);
}

export function clearSupabaseConfig(): void {
  try {
    localStorage.removeItem(KHADY_SUPABASE_URL_KEY);
    localStorage.removeItem(KHADY_SUPABASE_ANON_KEY);
  } catch (err) {
    console.warn('Impossible de réinitialiser la configuration Supabase:', err);
  }

  cachedClient = null;
  lastClientUrl = '';
  lastClientKey = '';
  isSupabaseConfigured = checkSupabaseConfigured();
}

/**
 * TESTEUR DE CONNEXION SUPABASE
 * Effectue un diagnostic complet en direct :
 * 1. Validation de la syntaxe de l'URL et de la clé
 * 2. Requête ping vers l'instance
 * 3. Vérification de l'existence de la table `menu_items`
 * 4. Vérification de l'existence de la table `orders`
 */
export async function testSupabaseConnection(
  testUrl?: string,
  testKey?: string
): Promise<{
  success: boolean;
  latencyMs?: number;
  message: string;
  details?: {
    menuTableFound: boolean;
    ordersTableFound: boolean;
    menuCount?: number;
    error?: string;
  };
}> {
  const targetUrl = testUrl ? sanitizeSupabaseUrl(testUrl) : getActiveSupabaseCredentials().url;
  const targetKey = testKey ? testKey.trim() : getActiveSupabaseCredentials().anonKey;

  if (!targetUrl || !targetUrl.startsWith('https://')) {
    return {
      success: false,
      message: "L'URL Supabase doit être valide et commencer par https:// (ex: https://xyz.supabase.co)",
    };
  }

  if (!targetKey || targetKey.length < 20) {
    return {
      success: false,
      message: "La clé Anon Supabase est invalide ou trop courte (minimum 20 caractères).",
    };
  }

  const startTime = Date.now();

  try {
    const testClient = createClient(targetUrl, targetKey, {
      auth: { persistSession: false },
    });

    // Test 1: Requête sur la table menu_items
    const { data: menuData, error: menuError } = await testClient
      .from('menu_items')
      .select('id', { count: 'exact', head: true });

    // Test 2: Requête sur la table orders
    const { error: ordersError } = await testClient
      .from('orders')
      .select('id', { count: 'exact', head: true });

    const latencyMs = Date.now() - startTime;

    const menuTableFound = !menuError || menuError.code !== '42P01';
    const ordersTableFound = !ordersError || ordersError.code !== '42P01';

    if (menuError && menuError.code === '42P01') {
      return {
        success: false,
        latencyMs,
        message: "Connexion établie avec le projet Supabase, mais la table 'menu_items' est introuvable. Exécutez le script SQL 'db_schema.sql' dans l'éditeur SQL de Supabase.",
        details: {
          menuTableFound: false,
          ordersTableFound,
          error: menuError.message,
        },
      };
    }

    if (menuError) {
      return {
        success: false,
        latencyMs,
        message: `Erreur d'accès à la table 'menu_items' : ${menuError.message} (Code: ${menuError.code})`,
        details: {
          menuTableFound: false,
          ordersTableFound,
          error: menuError.message,
        },
      };
    }

    return {
      success: true,
      latencyMs,
      message: `Connexion Supabase réussie en ${latencyMs} ms ! Les tables du restaurant sont opérationnelles.`,
      details: {
        menuTableFound: true,
        ordersTableFound,
        menuCount: Array.isArray(menuData) ? menuData.length : undefined,
      },
    };
  } catch (err: any) {
    const latencyMs = Date.now() - startTime;
    return {
      success: false,
      latencyMs,
      message: `Échec de la connexion vers ${targetUrl} : ${err?.message || 'Erreur réseau ou URL inaccessible'}`,
      details: {
        menuTableFound: false,
        ordersTableFound: false,
        error: String(err),
      },
    };
  }
}

/**
 * POUSSER TOUT LE MENU EN BLOC VERS SUPABASE
 */
export async function pushAllMenuItemsToSupabase(
  items: MenuItem[]
): Promise<{ success: boolean; count: number; total: number; error?: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return {
      success: false,
      count: 0,
      total: items.length,
      error: "Supabase n'est pas configuré. Veuillez renseigner l'URL et la clé dans Paramètres > Supabase.",
    };
  }

  if (items.length === 0) {
    return { success: true, count: 0, total: 0 };
  }

  try {
    const payload = items.map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description || '',
      price: Number(item.price) || 0,
      image: item.image || '',
      category: item.category || 'Plat Africain',
      rating: Number(item.rating) || 5,
      is_available: item.isAvailable ?? true,
      is_spicy: Boolean(item.isSpicy),
      is_specialite_maison: Boolean(item.isSpécialitéMaison),
      is_plat_du_jour: Boolean(
        item.isPlatDuJour ||
        item.category === 'Plat du Jour' ||
        item.category === 'Menu du Jour'
      ),
    }));

    // Upsert par lots de 25 pour une fiabilité optimale
    const BATCH_SIZE = 25;
    let synced = 0;

    for (let i = 0; i < payload.length; i += BATCH_SIZE) {
      const batch = payload.slice(i, i + BATCH_SIZE);
      const { error } = await client.from('menu_items').upsert(batch, { onConflict: 'id' });

      if (error) {
        throw new Error(error.message);
      }
      synced += batch.length;
    }

    return {
      success: true,
      count: synced,
      total: items.length,
    };
  } catch (err: any) {
    return {
      success: false,
      count: 0,
      total: items.length,
      error: err?.message || 'Erreur lors de la synchronisation des plats',
    };
  }
}

/**
 * SERVICE DE DONNÉES KHADY'S ELITE
 * Gère la synchronisation entre l'App et le Cloud Supabase
 */
export const db = {
  // --- MENU ---
  fetchMenu: async (): Promise<MenuItem[] | null> => {
    const client = getSupabaseClient();
    if (!client) return null;
    try {
      const { data, error } = await client
        .from('menu_items')
        .select('*')
        .order('category', { ascending: true });

      if (error || !data) {
        return null;
      }

      return data.map((item: any) => ({
        id: item.id,
        name: item.name || '',
        description: item.description || '',
        price: Number(item.price) || 0,
        image: item.image || '',
        category: item.category || 'Plat Africain',
        rating: Number(item.rating) || 5,
        isAvailable: item.is_available ?? true,
        isSpicy: item.is_spicy ?? false,
        isSpécialitéMaison: item.is_specialite_maison ?? false,
        isPlatDuJour: item.is_plat_du_jour ?? false,
      })) as MenuItem[];
    } catch {
      return null;
    }
  },

  saveMenuItem: async (
    item: MenuItem
  ): Promise<{ success: boolean; data?: any; error?: string }> => {
    const client = getSupabaseClient();
    if (!client) {
      return {
        success: false,
        error: "Supabase non configuré (identifiants absents ou invalides)",
      };
    }

    try {
      const { data, error } = await client
        .from('menu_items')
        .upsert(
          {
            id: item.id,
            name: item.name,
            description: item.description || '',
            price: Number(item.price) || 0,
            image: item.image || '',
            category: item.category || 'Plat Africain',
            rating: Number(item.rating) || 5,
            is_available: item.isAvailable ?? true,
            is_spicy: Boolean(item.isSpicy),
            is_specialite_maison: Boolean(item.isSpécialitéMaison),
            is_plat_du_jour: Boolean(
              item.isPlatDuJour ||
              item.category === 'Plat du Jour' ||
              item.category === 'Menu du Jour'
            ),
          },
          { onConflict: 'id' }
        )
        .select();

      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true, data };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Erreur réseau Supabase' };
    }
  },

  deleteMenuItem: async (id: string): Promise<{ success: boolean; error?: string }> => {
    const client = getSupabaseClient();
    if (!client) {
      return { success: false, error: "Supabase non configuré" };
    }

    try {
      const { error } = await client.from('menu_items').delete().eq('id', id);
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Erreur réseau Supabase' };
    }
  },

  // --- COMMANDES ---
  fetchOrders: async (): Promise<Order[] | null> => {
    const client = getSupabaseClient();
    if (!client) return null;
    try {
      const { data, error } = await client
        .from('orders')
        .select('*')
        .order('timestamp', { ascending: false });

      if (error || !data) {
        return null;
      }

      return data.map((o: any) => ({
        id: o.id,
        customerName: o.customer_name || 'Client',
        phone: o.phone || '',
        address: o.address || '',
        district: o.district || '',
        items: typeof o.items === 'string' ? JSON.parse(o.items) : (o.items || []),
        total: Number(o.total) || 0,
        deliveryFee: Number(o.delivery_fee) || 0,
        status: o.status || 'RECEIVED',
        paymentMethod: o.payment_method || 'CASH',
        paymentType: o.payment_type,
        paymentTransactionId: o.payment_transaction_id,
        paymentProofUrl: o.payment_proof_url,
        paymentValidated: o.payment_validated,
        timestamp: o.timestamp || new Date().toISOString(),
      })) as Order[];
    } catch {
      return null;
    }
  },

  placeOrder: async (order: Order) => {
    const client = getSupabaseClient();
    if (!client) return null;
    try {
      const { data, error } = await client
        .from('orders')
        .insert({
          id: order.id,
          customer_name: order.customerName,
          phone: order.phone,
          items: order.items,
          total: order.total,
          delivery_fee: order.deliveryFee,
          status: order.status,
          payment_method: order.paymentMethod,
          payment_type: order.paymentType,
          payment_transaction_id: order.paymentTransactionId,
          payment_proof_url: order.paymentProofUrl,
          payment_validated: order.paymentValidated ?? false,
          timestamp: order.timestamp,
          district: order.district,
          address: order.address,
        })
        .select();

      return data;
    } catch {
      return null;
    }
  },

  updateOrderStatus: async (orderId: string, status: string) => {
    const client = getSupabaseClient();
    if (!client) return null;
    try {
      const { error } = await client
        .from('orders')
        .update({ status })
        .eq('id', orderId);

      if (error) return null;
      return true;
    } catch {
      return null;
    }
  },
};

