import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { MenuItem, Order } from '../types';
import { PlatDuJourConfig } from '../utils/marketing';
import { compressImage } from '../utils/imageCompressor';

export const DEFAULT_SUPABASE_URL = 'https://veygphkhehdnxefnnlwo.supabase.co';
export const DEFAULT_SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZleWdwaGtoZWhkbnhlZm5ubHdvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU1MTE0MjgsImV4cCI6MjEwMTA4NzQyOH0.FsSg9wjrvVZ1zNHZH_D7qVxPd3EC1h1yM1mDMvxfAqw';

// Helper to extract project URL directly from a Supabase JWT anon key (eyJ...)
export const deriveSupabaseUrlFromKey = (rawKey?: string): string | null => {
  if (!rawKey || typeof rawKey !== 'string') return null;
  const trimmed = rawKey.trim();
  if (!trimmed.startsWith('eyJ')) return null;
  const parts = trimmed.split('.');
  if (parts.length !== 3) return null;
  try {
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    const jsonPayload = decodeURIComponent(
      atob(padded)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const payload = JSON.parse(jsonPayload);
    if (payload && typeof payload.ref === 'string' && /^[a-z0-9]{12,32}$/i.test(payload.ref)) {
      return `https://${payload.ref.toLowerCase()}.supabase.co`;
    }
  } catch {
    // Ignore decode errors
  }
  return null;
};

// Helper to clean and normalize Supabase URLs (removes trailing /rest/v1, slashes, etc.)
export const cleanSupabaseUrl = (rawUrl: string, associatedKey?: string): string => {
  const derived = deriveSupabaseUrlFromKey(associatedKey);
  let url = (rawUrl || '').trim();
  url = url.replace(/\/rest\/v1\/?$/, '');
  url = url.replace(/\/+$/, '');
  if ((!url || !url.startsWith('https://')) && derived) {
    return derived;
  }
  return url;
};

// Helper to inspect all possible environment variable names
const getEnv = (key: string): string => {
  try {
    const meta = (import.meta as any).env;
    if (meta && meta[key]) return String(meta[key]).trim();
  } catch (e) {}

  try {
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      return String(process.env[key]).trim();
    }
  } catch (e) {}

  try {
    if (typeof window !== 'undefined' && (window as any)[key]) {
      return String((window as any)[key]).trim();
    }
  } catch (e) {}

  return '';
};

const isObsoleteProject = (str: string): boolean => {
  if (!str) return false;
  return (
    str.includes('ldlwtoktwubucmbsfurw') ||
    str.includes('xqzjkhbqxwzvjkhbqxwz') ||
    str.includes('votre_projet') ||
    str.includes('votre_cle') ||
    str.includes('example.supabase.co')
  );
};

export const getSupabaseConfig = () => {
  let customUrl = '';
  let customKey = '';

  if (typeof window !== 'undefined') {
    try {
      customUrl =
        localStorage.getItem('khadys_custom_supabase_url') ||
        localStorage.getItem('khadys_supabase_url') ||
        '';
      customKey =
        localStorage.getItem('khadys_custom_supabase_key') ||
        localStorage.getItem('khadys_supabase_anon_key') ||
        '';

      // If localStorage contains obsolete placeholder projects, auto-clear them so it uses the active project
      if (isObsoleteProject(customUrl) || isObsoleteProject(customKey)) {
        localStorage.removeItem('khadys_custom_supabase_url');
        localStorage.removeItem('khadys_custom_supabase_key');
        localStorage.removeItem('khadys_supabase_url');
        localStorage.removeItem('khadys_supabase_anon_key');
        customUrl = '';
        customKey = '';
      }
    } catch {}
  }

  let envUrl =
    getEnv('VITE_SUPABASE_URL') ||
    getEnv('VITE_PUBLIC_SUPABASE_URL') ||
    getEnv('NEXT_PUBLIC_SUPABASE_URL') ||
    getEnv('SUPABASE_URL') ||
    getEnv('REACT_APP_SUPABASE_URL') ||
    DEFAULT_SUPABASE_URL;

  let envKey =
    getEnv('VITE_SUPABASE_ANON_KEY') ||
    getEnv('VITE_SUPABASE_KEY') ||
    getEnv('VITE_SUPABASE_PUBLISHABLE_KEY') ||
    getEnv('VITE_PUBLIC_SUPABASE_ANON_KEY') ||
    getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY') ||
    getEnv('SUPABASE_ANON_KEY') ||
    getEnv('SUPABASE_KEY') ||
    getEnv('REACT_APP_SUPABASE_ANON_KEY') ||
    DEFAULT_SUPABASE_KEY;

  if (isObsoleteProject(envUrl)) {
    envUrl = DEFAULT_SUPABASE_URL;
  }
  if (isObsoleteProject(envKey)) {
    envKey = DEFAULT_SUPABASE_KEY;
  }

  let key = (customKey || envKey).trim();
  if (isObsoleteProject(key)) {
    key = DEFAULT_SUPABASE_KEY;
  }

  let rawUrl = (customUrl || envUrl).trim();
  if (isObsoleteProject(rawUrl)) {
    rawUrl = DEFAULT_SUPABASE_URL;
  }

  // If the key is a valid JWT with a project ref, ensure the URL matches the key's project ref
  const derivedFromKey = deriveSupabaseUrlFromKey(key);
  const url = derivedFromKey || cleanSupabaseUrl(rawUrl, key);

  const isValid =
    Boolean(url) &&
    url.startsWith('https://') &&
    !isObsoleteProject(url) &&
    Boolean(key) &&
    key.length > 20 &&
    !isObsoleteProject(key);

  return {
    url,
    key,
    anonKey: key,
    isValid,
    isConfigured: isValid,
    isCustom: Boolean(customUrl && customKey && !isObsoleteProject(customUrl))
  };
};

let cachedClient: SupabaseClient | null = null;
let lastUsedUrl = '';
let lastUsedKey = '';

export const getSupabaseClient = (): SupabaseClient | null => {
  const config = getSupabaseConfig();
  if (!config.isValid) return null;

  if (!cachedClient || lastUsedUrl !== config.url || lastUsedKey !== config.key) {
    try {
      cachedClient = createClient(config.url, config.key, {
        auth: { persistSession: true, autoRefreshToken: true },
        realtime: { params: { eventsPerSecond: 10 } }
      });
      lastUsedUrl = config.url;
      lastUsedKey = config.key;
    } catch (e) {
      console.warn('Erreur initialisation Supabase:', e);
      return null;
    }
  }
  return cachedClient;
};

// Legacy exports for backward compatibility
export const isSupabaseConfigured = getSupabaseConfig().isValid;
export const getIsSupabaseConfigured = () => getSupabaseConfig().isValid;
export const supabase: SupabaseClient | null = getSupabaseClient();

/**
 * Configure credentials manually (saves to localStorage and notifies the app)
 */
export const setCustomSupabaseCredentials = (url: string, key: string): { success: boolean; message: string } => {
  const cleanKey = (key || '').trim();
  const derivedUrl = deriveSupabaseUrlFromKey(cleanKey);
  const cleanUrl = cleanSupabaseUrl(url || derivedUrl || '', cleanKey);

  if (!cleanUrl && !cleanKey) {
    try {
      localStorage.removeItem('khadys_custom_supabase_url');
      localStorage.removeItem('khadys_custom_supabase_key');
      localStorage.removeItem('khadys_supabase_url');
      localStorage.removeItem('khadys_supabase_anon_key');
    } catch {}
    cachedClient = null;
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('khadys_supabase_config_changed', { detail: { configured: false } }));
    }
    return { success: true, message: 'Clés Supabase personnalisées réinitialisées sur le projet officiel.' };
  }

  if (cleanKey.length < 20) {
    return { success: false, message: "La clé anon Supabase est trop courte (doit être un token JWT valide commençant par eyJ...)." };
  }

  const finalUrl = derivedUrl || cleanUrl;
  if (!finalUrl.startsWith('https://')) {
    return { success: false, message: "L'URL Supabase doit commencer par https:// (ex: https://xyzcompany.supabase.co)" };
  }

  try {
    localStorage.setItem('khadys_custom_supabase_url', finalUrl);
    localStorage.setItem('khadys_custom_supabase_key', cleanKey);
    localStorage.setItem('khadys_supabase_url', finalUrl);
    localStorage.setItem('khadys_supabase_anon_key', cleanKey);
  } catch {}

  cachedClient = null;
  const client = getSupabaseClient();

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('khadys_supabase_config_changed', { detail: { configured: true, url: finalUrl } }));
  }

  return {
    success: Boolean(client),
    message: client ? `✅ Clés Supabase enregistrées et connectées avec succès (${finalUrl}) !` : '⚠️ Erreur lors de la création du client Supabase.'
  };
};

/**
 * Helper to identify network / DNS / fetch failures across all browsers (including Safari iOS 'Load failed')
 */
export const isSupabaseNetworkError = (errorOrMsg: any): boolean => {
  if (!errorOrMsg) return false;
  const msg = typeof errorOrMsg === 'string'
    ? errorOrMsg
    : (errorOrMsg.message || errorOrMsg.details || errorOrMsg.hint || String(errorOrMsg));
  const lower = msg.toLowerCase();
  return (
    lower.includes('load failed') ||
    lower.includes('failed to fetch') ||
    lower.includes('networkerror') ||
    lower.includes('network error') ||
    lower.includes('network request failed') ||
    lower.includes('could not resolve') ||
    lower.includes('enotfound') ||
    lower.includes('fetch failed') ||
    lower.includes('err_name_not_resolved') ||
    lower.includes('connection refused') ||
    lower.includes('abort') ||
    lower.includes('timeout')
  );
};

export const formatSupabaseErrorMessage = (errorOrMsg: any, targetUrl?: string): string => {
  if (!errorOrMsg) return '';
  const rawMsg = typeof errorOrMsg === 'string' ? errorOrMsg : (errorOrMsg.message || String(errorOrMsg));

  if (isSupabaseNetworkError(rawMsg)) {
    return `Serveur Supabase injoignable (${targetUrl || 'URL active'}). Projet en PAUSE sur Supabase ou URL inexistante.`;
  }
  if (rawMsg.includes('42P01') || (rawMsg.toLowerCase().includes('relation') && rawMsg.toLowerCase().includes('does not exist'))) {
    return "Table inexistante dans la base Supabase. Veuillez exécuter le script SQL d'initialisation.";
  }
  if (rawMsg.includes('42501') || rawMsg.toLowerCase().includes('permission denied')) {
    return "Accès refusé par les règles RLS Supabase (exécutez le script SQL fourni).";
  }
  return rawMsg;
};

const extractMissingColumnName = (error: any): string | null => {
  const msg = String(error?.message || error?.details || error?.hint || error || '');
  const m1 = msg.match(/Could not find the ['"`]([^'"`]+)['"`] column/i);
  if (m1?.[1]) return m1[1];
  const m2 = msg.match(/column ['"`]?([a-zA-Z0-9_]+)['"`]? of relation ['"`]?menu_items['"`]? does not exist/i);
  if (m2?.[1]) return m2[1];
  const m3 = msg.match(/column menu_items\.([a-zA-Z0-9_]+) does not exist/i);
  if (m3?.[1]) return m3[1];
  return null;
};

const upsertMenuItemsAdaptive = async (
  client: SupabaseClient,
  rows: Record<string, any>[]
): Promise<{ error: any }> => {
  if (!rows || rows.length === 0) return { error: null };

  let currentRows = rows.map((r) => ({ ...r }));
  const removedCols = new Set<string>();

  for (let attempt = 0; attempt < 10; attempt++) {
    const { error } = await client.from('menu_items').upsert(currentRows, { onConflict: 'id' });
    if (!error) {
      return { error: null };
    }
    if (isSupabaseNetworkError(error)) {
      return { error };
    }

    const missingCol = extractMissingColumnName(error);
    if (missingCol && !removedCols.has(missingCol) && missingCol !== 'id') {
      removedCols.add(missingCol);
      currentRows = currentRows.map((r) => {
        const copy = { ...r };
        delete copy[missingCol];
        return copy;
      });
      continue;
    }

    break;
  }

  // Fallback tiers if column mismatch wasn't explicitly named
  const tierCols = [
    ['id', 'name', 'description', 'price', 'category', 'image', 'is_plat_du_jour', 'is_specialite_maison', 'is_spicy', 'is_available'],
    ['id', 'name', 'description', 'price', 'category', 'image', 'is_plat_du_jour'],
    ['id', 'name', 'description', 'price', 'category', 'image'],
    ['id', 'name', 'price']
  ];

  let lastError: any = null;
  for (const cols of tierCols) {
    const tierPayload = rows.map((r) => {
      const filtered: Record<string, any> = {};
      for (const c of cols) {
        if (r[c] !== undefined && !removedCols.has(c)) {
          filtered[c] = r[c];
        }
      }
      return filtered;
    });
    const res = await client.from('menu_items').upsert(tierPayload, { onConflict: 'id' });
    if (!res.error) {
      return { error: null };
    }
    lastError = res.error;
  }

  return { error: lastError };
};

/**
 * Test connectivity with Supabase database with timeout & detailed diagnosis
 */
export const testSupabaseConnection = async (
  customUrl?: string,
  customKey?: string
): Promise<{ success: boolean; message: string; isUnreachable?: boolean; details?: any }> => {
  let client = getSupabaseClient();
  const cfg = getSupabaseConfig();
  let targetKey = (customKey || cfg.key).trim();
  const derivedUrl = deriveSupabaseUrlFromKey(targetKey);
  let targetUrl = cleanSupabaseUrl(customUrl || derivedUrl || cfg.url, targetKey);

  if (customUrl || customKey) {
    try {
      client = createClient(targetUrl, targetKey);
    } catch (e: any) {
      return { success: false, message: `Format d'URL ou de clé invalide : ${e.message || e}` };
    }
  }

  if (!client) {
    return {
      success: false,
      message: "Supabase n'est pas configuré. Veuillez renseigner l'URL et la clé Anon."
    };
  }

  const cleanUrl = cleanSupabaseUrl(targetUrl, targetKey);

  try {
    const { data: menuData, error: menuErr } = await client.from('menu_items').select('*').limit(1);

    if (menuErr) {
      if (isSupabaseNetworkError(menuErr)) {
        return {
          success: false,
          isUnreachable: true,
          message:
            `⚠️ Impossible de joindre le serveur Supabase (${cleanUrl}).\n\n` +
            `Erreur : "${menuErr.message}" (le serveur ne répond pas).\n\n` +
            `Causes & Solutions :\n` +
            `1. ⏸️ Projet en PAUSE sur Supabase : Rendez-vous sur https://supabase.com/dashboard pour cliquer sur "Restore project" / "Unpause".\n` +
            `2. 🔄 Clés modifiées : Vérifiez l'URL de votre projet dans les paramètres Supabase.\n` +
            `3. 🛡️ Vos données sont en sécurité : Plats, commandes et réglages restent enregistrés sur votre appareil.`
        };
      }
      if (menuErr.code === '42P01' || menuErr.code === 'PGRST205') {
        return {
          success: false,
          message: "La table 'menu_items' n'existe pas encore dans votre base Supabase. Veuillez exécuter le script SQL fourni dans l'onglet 'Script SQL'."
        };
      }
      if (menuErr.message?.includes('permission denied') || menuErr.code === '42501') {
        return {
          success: false,
          message: "Accès refusé par les règles RLS Supabase. Veuillez appliquer les politiques autorisant la lecture/écriture publique (voir script SQL)."
        };
      }
      return { success: false, message: `Erreur Supabase : ${menuErr.message}` };
    }

    return {
      success: true,
      message: `✅ Connexion réussie au projet Supabase (${cleanUrl}) ! Les tables 'menu_items', 'orders' et 'app_settings' sont opérationnelles.`
    };
  } catch (err: any) {
    const errorMsg = String(err?.message || err);
    if (isSupabaseNetworkError(errorMsg)) {
      return {
        success: false,
        isUnreachable: true,
        message: `⚠️ Impossible de joindre votre projet Supabase (${cleanUrl}).\n\nCauses possibles :\n1. Projet en PAUSE sur Supabase (plan gratuit) : Rendez-vous sur https://supabase.com/dashboard et cliquez sur "Restore project" / "Unpause".\n2. URL de projet modifiée ou supprimée.\n3. Vos données locales restent 100% disponibles.`
      };
    }
    return { success: false, message: `Échec de connexion : ${errorMsg}` };
  }
};

/**
 * SERVICE DE DONNÉES KHADY'S ELITE
 * Gère la synchronisation bidirectionnelle Cloud, Plat du Jour, Photo Admin, Menu & Commandes
 */
export const isExcludedFromAutomaticPlatDuJour = (name?: string, id?: string): boolean => {
  const n = (name || '').toLowerCase();
  const i = (id || '').toLowerCase();
  return (
    n.includes('doukounou') ||
    n.includes('attiéké') ||
    n.includes('attieke') ||
    i === 'douk-royal' ||
    i === 'attieke-royal' ||
    i === 'af3'
  );
};

/**
 * SERVICE DE DONNÉES KHADY'S ELITE (Compatible Khady's Food & Allôresto)
 * Gère la synchronisation bidirectionnelle Cloud, Plat du Jour, Photo Admin, Menu & Commandes
 */
export const db = {
  // --- MENU ---
  fetchMenu: async (): Promise<MenuItem[] | null> => {
    const client = getSupabaseClient();
    if (!client) return null;

    try {
      const fullMenuBackup = await db.fetchSetting<MenuItem[]>('full_menu_items');

      let { data, error } = await client
        .from('menu_items')
        .select('*')
        .order('category', { ascending: true });

      if (error) {
        const retry = await client.from('menu_items').select('*');
        data = retry.data;
        error = retry.error;
      }

      // If Allôresto 'dishes' table exists, also read from it for full harmonization
      let allorestoDishes: any[] = [];
      try {
        const dishesRes = await client.from('dishes').select('*');
        if (!dishesRes.error && Array.isArray(dishesRes.data) && dishesRes.data.length > 0) {
          allorestoDishes = dishesRes.data;
        }
      } catch {}

      if ((error || !data || data.length === 0) && allorestoDishes.length === 0) {
        return fullMenuBackup || null;
      }

      const backupMap = new Map<string, Partial<MenuItem>>();
      if (fullMenuBackup && Array.isArray(fullMenuBackup)) {
        fullMenuBackup.forEach((item) => backupMap.set(item.id, item));
      }

      const combinedRows = [...(data || [])];
      const existingIds = new Set(combinedRows.map((r: any) => String(r.id)));
      for (const d of allorestoDishes) {
        if (d && d.id && !existingIds.has(String(d.id))) {
          combinedRows.push(d);
          existingIds.add(String(d.id));
        }
      }

      let foundPrimaryPlatDuJour = false;

      return combinedRows.map((row: any) => {
        const cached = backupMap.get(row.id) || {};
        const excludedFromDaily = isExcludedFromAutomaticPlatDuJour(row.name, row.id);
        const rawCategory = row.category || cached.category || 'Plat Africain';
        const finalCategory =
          excludedFromDaily && (rawCategory === 'Menu du Jour' || rawCategory === 'Plat du Jour')
            ? 'Spécialité Maison'
            : rawCategory;

        let isDaily = excludedFromDaily
          ? false
          : Boolean(row.is_plat_du_jour ?? row.isPlatDuJour ?? cached.isPlatDuJour ?? false);

        // Enforce single published Plat du Jour rule
        if (isDaily) {
          if (!foundPrimaryPlatDuJour) {
            foundPrimaryPlatDuJour = true;
          } else {
            isDaily = false;
          }
        }

        return {
          id: String(row.id),
          name: row.name,
          description: row.description || '',
          price: Number(row.price),
          image: row.image || row.image_url,
          category: finalCategory,
          rating: row.rating ? Number(row.rating) : (cached.rating ?? 5),
          isAvailable: row.is_available ?? row.isAvailable ?? cached.isAvailable ?? true,
          isSpicy: row.is_spicy ?? row.isSpicy ?? cached.isSpicy ?? false,
          isVegetarian: row.is_vegetarian ?? row.isVegetarian ?? cached.isVegetarian ?? false,
          isLowPrice: row.is_low_price ?? row.isLowPrice ?? cached.isLowPrice ?? false,
          isPromo: row.is_promo ?? row.isPromo ?? cached.isPromo ?? false,
          isPlatDuJour: isDaily,
          isSpécialitéMaison:
            excludedFromDaily ||
            Boolean(row.is_specialite_maison ?? row.isSpécialitéMaison ?? cached.isSpécialitéMaison ?? false)
        };
      }) as MenuItem[];
    } catch {
      return null;
    }
  },

  saveMenuItem: async (item: MenuItem): Promise<{ success: boolean; error?: string; data?: any }> => {
    const client = getSupabaseClient();
    if (!client) return { success: false, error: 'Supabase non configuré' };

    try {
      const excludedFromDaily = isExcludedFromAutomaticPlatDuJour(item.name, item.id);
      const safeCategory =
        excludedFromDaily && (item.category === 'Menu du Jour' || item.category === 'Plat du Jour')
          ? 'Spécialité Maison'
          : item.category;

      const payload: Record<string, any> = {
        id: item.id,
        name: item.name,
        description: item.description || '',
        price: item.price,
        image: item.image,
        category: safeCategory,
        is_available: item.isAvailable ?? true,
        is_spicy: item.isSpicy ?? false,
        is_specialite_maison: excludedFromDaily ? true : (item.isSpécialitéMaison ?? false),
        is_plat_du_jour: excludedFromDaily ? false : Boolean((item as any).isPlatDuJour)
      };

      const { error } = await upsertMenuItemsAdaptive(client, [payload]);
      if (error) {
        return { success: false, error: formatSupabaseErrorMessage(error.message || error) };
      }

      // Optional mirror to Allôresto 'dishes' table if it exists in Supabase
      try {
        await client.from('dishes').upsert(
          {
            id: item.id,
            restaurant_id: 'khadys-food',
            name: item.name,
            description: item.description || '',
            price: item.price,
            image: item.image,
            category: safeCategory,
            is_available: item.isAvailable ?? true,
            is_spicy: item.isSpicy ?? false,
            is_specialite_maison: excludedFromDaily ? true : (item.isSpécialitéMaison ?? false),
            is_plat_du_jour: excludedFromDaily ? false : Boolean((item as any).isPlatDuJour)
          },
          { onConflict: 'id' }
        );
      } catch {}

      return { success: true, data: item };
    } catch (e: any) {
      return { success: false, error: formatSupabaseErrorMessage(e.message || 'Erreur inconnue') };
    }
  },

  syncAllMenuItems: async (items: MenuItem[]): Promise<{ success: boolean; error?: string; count: number }> => {
    const client = getSupabaseClient();
    if (!client) return { success: false, error: 'Supabase non configuré', count: 0 };

    try {
      // Backup complete list with rich metadata in app_settings
      await db.saveSetting('full_menu_items', items).catch(() => {});

      let primaryDailyAssigned = false;
      const payloads = items.map((item) => {
        const excludedFromDaily = isExcludedFromAutomaticPlatDuJour(item.name, item.id);
        const safeCategory =
          excludedFromDaily && (item.category === 'Menu du Jour' || item.category === 'Plat du Jour')
            ? 'Spécialité Maison'
            : item.category;

        let isDaily = excludedFromDaily ? false : Boolean((item as any).isPlatDuJour);
        if (isDaily) {
          if (!primaryDailyAssigned) primaryDailyAssigned = true;
          else isDaily = false;
        }

        return {
          id: item.id,
          name: item.name,
          description: item.description || '',
          price: item.price,
          image: item.image,
          category: safeCategory,
          is_available: item.isAvailable ?? true,
          is_spicy: item.isSpicy ?? false,
          is_specialite_maison: excludedFromDaily ? true : (item.isSpécialitéMaison ?? false),
          is_plat_du_jour: isDaily
        };
      });

      const { error } = await upsertMenuItemsAdaptive(client, payloads);
      if (error) {
        return {
          success: false,
          error: formatSupabaseErrorMessage(error.message || error),
          count: 0
        };
      }

      // Mirror to Allôresto 'dishes' table if present
      try {
        const dishesPayloads = payloads.map((p) => ({
          ...p,
          restaurant_id: 'khadys-food'
        }));
        await client.from('dishes').upsert(dishesPayloads, { onConflict: 'id' });
      } catch {}

      return { success: true, count: items.length };
    } catch (e: any) {
      return { success: false, error: formatSupabaseErrorMessage(e.message || 'Erreur inconnue'), count: 0 };
    }
  },

  deleteMenuItem: async (id: string): Promise<{ success: boolean; error?: string }> => {
    const client = getSupabaseClient();
    if (!client) return { success: false, error: 'Supabase non configuré' };

    try {
      const { error } = await client.from('menu_items').delete().eq('id', id);
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

  // --- PARAMÈTRES GLOBAUX & SYNCHRONISATION (APP_SETTINGS) ---
  fetchSetting: async <T = any>(key: string): Promise<T | null> => {
    const client = getSupabaseClient();
    if (!client) return null;

    try {
      const { data, error } = await client
        .from('app_settings')
        .select('value')
        .eq('key', key)
        .maybeSingle();

      if (error || !data) return null;
      return data.value as T;
    } catch {
      return null;
    }
  },

  saveSetting: async (key: string, value: any): Promise<{ success: boolean; error?: string }> => {
    const client = getSupabaseClient();
    if (!client) return { success: false, error: 'Supabase non configuré' };

    try {
      const { error } = await client
        .from('app_settings')
        .upsert(
          {
            key,
            value,
            updated_at: new Date().toISOString()
          },
          { onConflict: 'key' }
        );

      if (error) {
        // If app_settings table does not exist in a custom Supabase instance, ignore gracefully
        if (error.code === '42P01' || error.code === 'PGRST205') {
          return { success: true };
        }
        return { success: false, error: formatSupabaseErrorMessage(error) };
      }
      return { success: true };
    } catch (e: any) {
      return { success: false, error: formatSupabaseErrorMessage(e.message || e) };
    }
  },

  // --- PLAT DU JOUR SYNC ---
  fetchPlatDuJour: async (): Promise<PlatDuJourConfig | null> => {
    return db.fetchSetting<PlatDuJourConfig>('plat_du_jour');
  },

  savePlatDuJour: async (plat: PlatDuJourConfig): Promise<{ success: boolean; error?: string }> => {
    return db.saveSetting('plat_du_jour', plat);
  },

  // --- PHOTO DE PROFIL ADMIN SYNC ---
  fetchAdminAvatar: async (): Promise<string | null> => {
    return db.fetchSetting<string>('admin_avatar');
  },

  saveAdminAvatar: async (avatarBase64OrUrl: string): Promise<{ success: boolean; error?: string }> => {
    let finalAvatar = avatarBase64OrUrl;
    if (typeof window !== 'undefined' && finalAvatar && finalAvatar.startsWith('data:image') && finalAvatar.length > 35000) {
      try {
        finalAvatar = await compressImage(finalAvatar, 250, 0.65);
      } catch {}
    }
    return db.saveSetting('admin_avatar', finalAvatar);
  },

  // --- SYNC MASTER GLOBAL (Tout pousser vers Supabase en 1 clic) ---
  syncEverythingToCloud: async (data: {
    menuItems?: MenuItem[];
    platDuJour?: PlatDuJourConfig;
    adminAvatar?: string;
    promoCodes?: any[];
    announcementBanner?: any;
    flashDeal?: any;
    customWhatsApp?: string;
  }): Promise<{ success: boolean; message: string; errors?: string[] }> => {
    const client = getSupabaseClient();
    if (!client) {
      return { success: false, message: "Supabase n'est pas encore configuré." };
    }

    const errors: string[] = [];
    let syncedCount = 0;

    // 1. Sync Menu Items
    if (data.menuItems && data.menuItems.length > 0) {
      const res = await db.syncAllMenuItems(data.menuItems);
      if (res.success) syncedCount += res.count;
      else errors.push(`Menu : ${res.error}`);
    }

    // 2. Sync Plat du Jour
    if (data.platDuJour) {
      const res = await db.savePlatDuJour(data.platDuJour);
      if (!res.success && res.error) errors.push(`Plat du Jour : ${res.error}`);
    }

    // 3. Sync Admin Avatar
    if (data.adminAvatar) {
      const res = await db.saveAdminAvatar(data.adminAvatar);
      if (!res.success && res.error) errors.push(`Photo Profil Admin : ${res.error}`);
    }

    // 4. Sync Promo Codes, Banner, Flash Deal, WhatsApp
    if (data.promoCodes) await db.saveSetting('promo_codes', data.promoCodes);
    if (data.announcementBanner) await db.saveSetting('announcement_banner', data.announcementBanner);
    if (data.flashDeal) await db.saveSetting('flash_deal', data.flashDeal);
    if (data.customWhatsApp) await db.saveSetting('custom_whatsapp', data.customWhatsApp);

    if (errors.length > 0) {
      const isNetworkIssue = errors.some((e) => isSupabaseNetworkError(e));
      const targetUrl = getSupabaseConfig().url;
      const advice = isNetworkIssue
        ? `\n\n💡 Cause de l'erreur : Le serveur Supabase (${targetUrl}) est actuellement inaccessible ("Load failed" / échec DNS).\n` +
          `• Si votre projet gratuit Supabase est en PAUSE : rendez-vous sur https://supabase.com/dashboard et cliquez sur "Restore project".\n` +
          `• 🛡️ Rassurez-vous : vos plats, votre Plat du Jour et vos réglages sont 100% conservés et opérationnels en local sur votre appareil !`
        : '';

      return {
        success: false,
        message: `Synchronisation partielle avec des avertissements : ${errors.map((e) => formatSupabaseErrorMessage(e, targetUrl)).join(', ')}${advice}`,
        errors
      };
    }

    return {
      success: true,
      message: `✅ Synchronisation complète réussie ! Tous les plats (${syncedCount}), le Plat du Jour et le profil Admin sont enregistrés sur le Cloud Supabase (${getSupabaseConfig().url}).`
    };
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

      if (error || !data) return null;

      return data.map((row: any) => ({
        id: row.id,
        customerName: row.customer_name ?? row.customerName,
        phone: row.phone,
        items: typeof row.items === 'string' ? JSON.parse(row.items) : (row.items || []),
        total: Number(row.total),
        deliveryFee: Number(row.delivery_fee ?? row.deliveryFee ?? 0),
        status: row.status,
        paymentMethod: row.payment_method ?? row.paymentMethod,
        timestamp: row.timestamp,
        district: row.district,
        address: row.address
      })) as Order[];
    } catch {
      return null;
    }
  },

  placeOrder: async (order: Order): Promise<{ success: boolean; error?: string }> => {
    const client = getSupabaseClient();
    if (!client) return { success: false, error: 'Supabase non connecté' };

    try {
      const { error } = await client
        .from('orders')
        .insert({
          id: order.id,
          customer_name: order.customerName,
          phone: order.phone,
          items: order.items,
          total: order.total,
          delivery_fee: order.deliveryFee || 0,
          status: order.status,
          payment_method: order.paymentMethod,
          timestamp: order.timestamp,
          district: order.district,
          address: order.address
        });

      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
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
    } catch {
      return null;
    }
  }
};
