
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { MenuItem, Order } from '../types';

export const KHADY_SUPABASE_URL_KEY = 'khadys_custom_supabase_url';
export const KHADY_SUPABASE_ANON_KEY = 'khadys_custom_supabase_anon_key';
export const KHADY_SUPABASE_AUTO_SYNC_KEY = 'khadys_supabase_auto_sync';
export const KHADY_STANDALONE_MODE_KEY = 'khadys_standalone_local_mode';

export interface SupabaseKeyValidation {
  isValidFormat: boolean;
  keyType:
    | 'jwt_anon'
    | 'jwt_service'
    | 'publishable'
    | 'empty'
    | 'url_pasted'
    | 'project_id'
    | 'pat_token'
    | 'secret_key'
    | 'truncated_jwt'
    | 'unknown';
  cleanKey: string;
  projectRef?: string;
  derivedUrl?: string;
  warningMessage?: string;
}

/**
 * Nettoie et extrait intelligemment une clé API Supabase (JWT eyJ... ou sb_publishable_...)
 * même si l'utilisateur a collé un bloc .env complet, des guillemets, "Bearer ", ou des espaces.
 */
export function sanitizeSupabaseKey(rawKey?: string): string {
  if (!rawKey) return '';

  // Supprimer les caractères invisibles (zero-width) fréquents lors du copier-coller mobile
  let cleaned = rawKey.replace(/[\u200B-\u200D\uFEFF]/g, '').trim();

  // 1. Si le texte contient un JWT Supabase complet (Header eyJ... . Payload eyJ... . Signature)
  // Fonctionne même si précédé de VITE_SUPABASE_ANON_KEY=, Bearer, guillemets ou URL
  const jwtMatch = cleaned.match(/(eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{20,})/);
  if (jwtMatch?.[1]) {
    return jwtMatch[1];
  }

  // 2. Si le texte contient une nouvelle clé publique Supabase (sb_publishable_...)
  const pubMatch = cleaned.match(/(sb_publishable_[A-Za-z0-9_-]{15,})/);
  if (pubMatch?.[1]) {
    return pubMatch[1];
  }

  // 3. Nettoyage des préfixes .env ou en-têtes HTTP éventuels
  cleaned = cleaned
    .replace(/^(?:export\s+)?(?:VITE_|NEXT_PUBLIC_|REACT_APP_|EXPO_PUBLIC_)?SUPABASE_(?:ANON_KEY|PUBLISHABLE_KEY|KEY|API_KEY)\s*=\s*/i, '')
    .replace(/^(?:apikey|authorization)\s*:\s*/i, '')
    .replace(/^Bearer\s+/i, '')
    .replace(/^['"`]+|['"`]+$/g, '')
    .replace(/\s+/g, '');

  // 4. Si "Bearer" a été collé sans espace devant eyJ... (ex: BearereyJhbG...)
  if (/^Bearer(eyJ[A-Za-z0-9_-]+)/i.test(cleaned)) {
    cleaned = cleaned.replace(/^Bearer/i, '');
  }

  return cleaned;
}

// Extraction automatique de l'identifiant du projet (ref) depuis la clé JWT Anon Supabase
export function extractProjectRefFromJwt(token?: string): string | null {
  if (!token) return null;
  const clean = sanitizeSupabaseKey(token);
  const parts = clean.split('.');
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
    const parsed = JSON.parse(jsonPayload);

    if (parsed && typeof parsed.ref === 'string' && /^[a-z0-9]{12,32}$/i.test(parsed.ref)) {
      return parsed.ref.toLowerCase();
    }

    if (parsed && typeof parsed.iss === 'string' && parsed.iss.includes('.supabase.co')) {
      const match = parsed.iss.match(/https?:\/\/([a-z0-9-]+)\.supabase\.co/i);
      if (match?.[1]) return match[1].toLowerCase();
    }
  } catch {
    // Ignorer si ce n'est pas un JWT standard
  }
  return null;
}

export function deriveSupabaseUrlFromKey(anonKey?: string): string | null {
  const ref = extractProjectRefFromJwt(anonKey);
  return ref ? `https://${ref}.supabase.co` : null;
}

/**
 * Analyse précise de la clé saisie pour expliquer immédiatement à l'utilisateur
 * pourquoi une clé est valide ou pourquoi elle est refusée ("Invalid API key").
 */
export function validateSupabaseKeyFormat(rawKey?: string, rawUrl?: string): SupabaseKeyValidation {
  const cleanKey = sanitizeSupabaseKey(rawKey);

  if (!cleanKey) {
    return {
      isValidFormat: false,
      keyType: 'empty',
      cleanKey: '',
      warningMessage: 'Aucune clé saisie dans le champ Clé Anonyme.',
    };
  }

  const lower = cleanKey.toLowerCase();

  // Cas 1 : L'utilisateur a collé l'URL dans le champ de la clé
  if (
    lower.startsWith('http://') ||
    lower.startsWith('https://') ||
    lower.endsWith('.supabase.co') ||
    lower.includes('supabase.com/dashboard')
  ) {
    return {
      isValidFormat: false,
      keyType: 'url_pasted',
      cleanKey,
      warningMessage:
        "⚠️ Vous avez collé une URL (https://...) dans le champ de la clé Anon ! Ce 2ème champ doit contenir la clé API qui commence par « eyJ... » ou « sb_publishable_... ».",
    };
  }

  // Cas 2 : L'utilisateur a collé le Reference ID court du projet (ex: 20 caractères alphanumériques)
  if (/^[a-z0-9]{15,24}$/i.test(cleanKey) && !lower.startsWith('eyj') && !lower.startsWith('sb_')) {
    return {
      isValidFormat: false,
      keyType: 'project_id',
      cleanKey,
      projectRef: cleanKey.toLowerCase(),
      derivedUrl: `https://${cleanKey.toLowerCase()}.supabase.co`,
      warningMessage: `⚠️ Vous avez collé l'identifiant court du projet (« ${cleanKey} », ${cleanKey.length} caractères) au lieu de la clé API ! Dans Supabase > Project Settings > API Keys, copiez la longue clé « anon public » (eyJ...) ou « Publishable key » (sb_publishable_...).`,
    };
  }

  // Cas 3 : Personal Access Token (sbp_...)
  if (lower.startsWith('sbp_') || lower.startsWith('sba_')) {
    return {
      isValidFormat: false,
      keyType: 'pat_token',
      cleanKey,
      warningMessage:
        "⚠️ Ceci est un jeton personnel (sbp_...), pas la clé publique du projet. Allez dans Project Settings > API Keys et copiez la clé « anon public » (eyJ...) ou « Publishable key » (sb_publishable_...).",
    };
  }

  // Cas 4 : Clé secrète sb_secret_...
  if (lower.startsWith('sb_secret_')) {
    return {
      isValidFormat: false,
      keyType: 'secret_key',
      cleanKey,
      warningMessage:
        "⚠️ Vous avez collé une clé secrète (sb_secret_...). Utilisez plutôt la clé publique « Publishable key » (sb_publishable_...) ou « anon public » (eyJ...).",
    };
  }

  // Cas 5 : Nouvelle clé publique Supabase (sb_publishable_...)
  if (lower.startsWith('sb_publishable_')) {
    if (cleanKey.length < 25 || cleanKey.includes('...')) {
      return {
        isValidFormat: false,
        keyType: 'truncated_jwt',
        cleanKey,
        warningMessage:
          "⚠️ Votre clé « sb_publishable_... » semble coupée ou incomplète. Cliquez sur le bouton « Copy » dans Supabase.",
      };
    }
    return {
      isValidFormat: true,
      keyType: 'publishable',
      cleanKey,
    };
  }

  // Cas 6 : Clé JWT Supabase (commence par eyJ)
  if (cleanKey.startsWith('eyJ') || lower.startsWith('eyj')) {
    if (cleanKey.includes('...') || cleanKey.includes('…')) {
      return {
        isValidFormat: false,
        keyType: 'truncated_jwt',
        cleanKey,
        warningMessage:
          "⚠️ Votre clé « eyJ... » contient des points de suspension (...) : vous avez copié un aperçu abrégé ! Sur Supabase, cliquez sur le bouton « Copy » à droite de la clé.",
      };
    }

    const parts = cleanKey.split('.');
    if (parts.length !== 3) {
      return {
        isValidFormat: false,
        keyType: 'truncated_jwt',
        cleanKey,
        warningMessage: `⚠️ Votre clé « eyJ... » est incomplète (${parts.length} partie(s) au lieu de 3 séparées par des points). Recopiez la clé entière avec le bouton « Copy » dans Supabase.`,
      };
    }

    const ref = extractProjectRefFromJwt(cleanKey);
    const sig = parts[2] || '';

    // Une signature HMAC-SHA256 en base64url fait exactement 43 caractères
    if (sig.length < 40 || !/^[A-Za-z0-9_-]+$/.test(sig)) {
      return {
        isValidFormat: false,
        keyType: 'truncated_jwt',
        cleanKey,
        projectRef: ref || undefined,
        derivedUrl: ref ? `https://${ref}.supabase.co` : undefined,
        warningMessage: `⚠️ La fin de votre clé « eyJ... » est coupée (signature de ${sig.length} caractères au lieu de 43). Cliquez sur le bouton « Copy » dans Supabase pour copier toute la clé.`,
      };
    }

    return {
      isValidFormat: true,
      keyType: 'jwt_anon',
      cleanKey,
      projectRef: ref || undefined,
      derivedUrl: ref ? `https://${ref}.supabase.co` : undefined,
    };
  }

  // Cas 7 : Autre texte (mot de passe, placeholder, texte court...)
  const preview = cleanKey.length > 12 ? `${cleanKey.slice(0, 8)}...${cleanKey.slice(-3)}` : cleanKey;
  return {
    isValidFormat: false,
    keyType: 'unknown',
    cleanKey,
    warningMessage: `⚠️ Le texte actuellement dans le champ Clé (« ${preview} », ${cleanKey.length} caractères) N'EST PAS une clé API Supabase. Une vraie clé commence obligatoirement par « eyJ... » (~200 caractères) ou « sb_publishable_... ».`,
  };
}

// Extraction et assainissement automatique de l'origine exacte (ex: https://xxxx.supabase.co)
export function sanitizeSupabaseUrl(urlStr: string, anonKey?: string): string {
  let effectiveKey = sanitizeSupabaseKey(anonKey);
  if (!effectiveKey) {
    try {
      effectiveKey = sanitizeSupabaseKey(localStorage.getItem(KHADY_SUPABASE_ANON_KEY) || '');
    } catch {
      effectiveKey = '';
    }
  }

  const jwtRef = extractProjectRefFromJwt(effectiveKey);
  const jwtDerivedUrl = jwtRef ? `https://${jwtRef}.supabase.co` : null;

  if (!urlStr || !urlStr.trim()) {
    return jwtDerivedUrl || '';
  }

  // Si l'utilisateur a collé un bloc .env complet contenant https://xxx.supabase.co
  const envUrlMatch = urlStr.match(/https?:\/\/([a-z0-9-]{12,32})\.supabase\.(?:co|com|in|io)/i);
  if (envUrlMatch?.[1]) {
    const extractedOrigin = `https://${envUrlMatch[1].toLowerCase()}.supabase.co`;
    if (jwtDerivedUrl && extractedOrigin.toLowerCase() !== jwtDerivedUrl.toLowerCase()) {
      return jwtDerivedUrl;
    }
    return extractedOrigin;
  }

  // Supprimer tous les espaces, retours à la ligne ou guillemets accidentels (fréquent sur mobile)
  let raw = urlStr.replace(/[\u200B-\u200D\uFEFF]/g, '').trim().replace(/['"\s]+/g, '');
  raw = raw.replace(/^(?:export\s+)?(?:VITE_|NEXT_PUBLIC_|REACT_APP_)?SUPABASE_URL\s*=\s*/i, '');

  // Si l'utilisateur a collé par erreur un JWT dans le champ URL
  if (raw.startsWith('eyJ') && raw.split('.').length === 3) {
    const refFromUrlJwt = extractProjectRefFromJwt(raw);
    if (refFromUrlJwt) return `https://${refFromUrlJwt}.supabase.co`;
  }

  // Si l'utilisateur a collé le lien du Dashboard Supabase (ex: https://supabase.com/dashboard/project/xyz123...)
  const dashboardMatch = raw.match(/(?:app\.)?supabase\.(?:com|co|io)\/(?:dashboard\/)?project\/([a-z0-9]{12,32})/i);
  if (dashboardMatch?.[1]) {
    return `https://${dashboardMatch[1].toLowerCase()}.supabase.co`;
  }

  // Si l'utilisateur a collé uniquement le Reference ID du projet (ex: xyz1234567890abcdef)
  if (/^[a-z0-9]{15,30}$/i.test(raw) && !raw.toLowerCase().startsWith('sb_')) {
    return `https://${raw.toLowerCase()}.supabase.co`;
  }

  // Corriger les fautes de frappe fréquentes du domaine (.supabase.com, .supabase.in, .supabase.io -> .supabase.co)
  raw = raw.replace(/\.supabase\.(com|in|io|net|org)(?=[/:?#]|$)/i, '.supabase.co');

  let origin = '';
  try {
    const formatted = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    const parsed = new URL(formatted);
    origin = parsed.origin.replace(/^http:\/\//i, 'https://');
  } catch {
    origin = raw.replace(/\/+$/, '').replace(/\/(rest|ret)\/v1\/?$/i, '');
  }

  const originLower = origin.toLowerCase();
  const isInvalidOrGenericHost =
    !originLower ||
    originLower === 'https://supabase.com' ||
    originLower === 'https://app.supabase.com' ||
    originLower === 'https://supabase.co' ||
    originLower.includes('votre_projet') ||
    originLower.includes('votre-projet') ||
    originLower.includes('your-project') ||
    originLower.includes('placeholder') ||
    !originLower.includes('.');

  if (isInvalidOrGenericHost && jwtDerivedUrl) {
    return jwtDerivedUrl;
  }

  // Si la clé JWT Anon contient la référence exacte du projet et que l'URL vise .supabase.co
  // mais avec une faute de frappe dans le sous-domaine, corriger automatiquement avec la réf du JWT
  if (jwtDerivedUrl && originLower.endsWith('.supabase.co') && originLower !== jwtDerivedUrl.toLowerCase()) {
    return jwtDerivedUrl;
  }

  return origin;
}

/**
 * Crée un client Supabase compatible à la fois avec les clés JWT classiques (eyJ...)
 * et les nouvelles clés publiques Supabase 2025/2026 (sb_publishable_...)
 */
function createSupabaseClientInstance(url: string, key: string, persistSession: boolean = true): SupabaseClient {
  const isOpaquePublishableKey = /^sb_publishable_/i.test(key);

  return createClient(url, key, {
    auth: {
      persistSession,
      autoRefreshToken: persistSession,
    },
    global: isOpaquePublishableKey
      ? {
          fetch: async (input, init) => {
            const headers = new Headers(init?.headers);
            const authHeader = headers.get('Authorization') || headers.get('authorization');
            // Dans @supabase/supabase-js < 2.49, l'envoi de "Authorization: Bearer sb_publishable_..."
            // provoque une erreur "Invalid API key" / JWT invalide sur PostgREST.
            if (authHeader && /Bearer\s+sb_publishable_/i.test(authHeader)) {
              headers.delete('Authorization');
              headers.delete('authorization');
            }
            return fetch(input, { ...init, headers });
          },
        }
      : undefined,
  });
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

  let cleanCustomKey = sanitizeSupabaseKey(customKey);

  // Si l'utilisateur avait collé sa clé JWT dans le champ URL par erreur, la récupérer !
  if (!validateSupabaseKeyFormat(cleanCustomKey).isValidFormat && customUrl) {
    const rescuedKeyFromUrl = sanitizeSupabaseKey(customUrl);
    if (validateSupabaseKeyFormat(rescuedKeyFromUrl).isValidFormat) {
      cleanCustomKey = rescuedKeyFromUrl;
    }
  }

  // Si l'utilisateur avait collé l'URL dans le champ Clé par erreur et que l'URL est vide
  if (!customUrl && customKey && customKey.includes('.supabase.')) {
    customUrl = customKey;
  }

  const cleanCustomUrl = sanitizeSupabaseUrl(customUrl, cleanCustomKey);

  if (cleanCustomUrl || cleanCustomKey) {
    if (cleanCustomUrl && cleanCustomUrl !== customUrl.trim()) {
      try {
        localStorage.setItem(KHADY_SUPABASE_URL_KEY, cleanCustomUrl);
      } catch {
        // Ignorer
      }
    }
    if (cleanCustomKey && cleanCustomKey !== customKey.trim()) {
      try {
        localStorage.setItem(KHADY_SUPABASE_ANON_KEY, cleanCustomKey);
      } catch {
        // Ignorer
      }
    }
    return {
      url: cleanCustomUrl,
      anonKey: cleanCustomKey,
      isCustom: true,
    };
  }

  const envKey = sanitizeSupabaseKey((import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '');
  const envUrl = sanitizeSupabaseUrl(((import.meta as any).env?.VITE_SUPABASE_URL || '').trim(), envKey);

  return {
    url: envUrl,
    anonKey: envKey,
    isCustom: false,
  };
}

/**
 * Vérifie si la configuration Supabase actuelle est valide
 */
export function checkSupabaseConfigured(url?: string, key?: string): boolean {
  const creds =
    url !== undefined && key !== undefined
      ? { url: sanitizeSupabaseUrl(url, key), anonKey: sanitizeSupabaseKey(key) }
      : getActiveSupabaseCredentials();

  const urlLower = (creds.url || '').toLowerCase();
  const keyValidation = validateSupabaseKeyFormat(creds.anonKey, creds.url);

  return (
    Boolean(creds.url) &&
    creds.url.startsWith('https://') &&
    creds.url.includes('.') &&
    !urlLower.includes('votre_projet') &&
    !urlLower.includes('votre-projet') &&
    !urlLower.includes('your-project') &&
    !urlLower.includes('xxx') &&
    !urlLower.includes('placeholder') &&
    !urlLower.includes('example.com') &&
    urlLower !== 'https://supabase.com' &&
    urlLower !== 'https://supabase.co' &&
    keyValidation.isValidFormat
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
    cachedClient = createSupabaseClientInstance(creds.url, creds.anonKey, true);
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
  let cleanKey = sanitizeSupabaseKey(anonKey);
  if (!validateSupabaseKeyFormat(cleanKey).isValidFormat && url) {
    const rescuedFromUrl = sanitizeSupabaseKey(url);
    if (validateSupabaseKeyFormat(rescuedFromUrl).isValidFormat) {
      cleanKey = rescuedFromUrl;
    }
  }
  const clean = sanitizeSupabaseUrl(url, cleanKey);
  try {
    localStorage.setItem(KHADY_SUPABASE_URL_KEY, clean);
    localStorage.setItem(KHADY_SUPABASE_ANON_KEY, cleanKey);
    localStorage.setItem(KHADY_SUPABASE_AUTO_SYNC_KEY, autoSync ? 'true' : 'false');
  } catch (err) {
    console.warn('Impossible de sauvegarder la configuration Supabase:', err);
  }

  // Réinitialiser le client en cache
  cachedClient = null;
  lastClientUrl = '';
  lastClientKey = '';
  isSupabaseConfigured = checkSupabaseConfigured(clean, cleanKey);
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

function isTableMissingError(err: any): boolean {
  if (!err) return false;
  const code = String(err.code || '').toUpperCase();
  const msg = String(err.message || '').toLowerCase();
  const details = String(err.details || '').toLowerCase();
  return (
    code === '42P01' ||
    code === 'PGRST205' ||
    (code === 'PGRST204' && !msg.includes('column')) ||
    (msg.includes('does not exist') && !msg.includes('column')) ||
    msg.includes('schema cache') ||
    msg.includes('could not find the table') ||
    details.includes('does not exist') ||
    details.includes('schema cache')
  );
}

function isColumnMissingError(err: any): boolean {
  if (!err) return false;
  const code = String(err.code || '').toUpperCase();
  const msg = String(err.message || '').toLowerCase();
  return (
    code === '42703' ||
    (code === 'PGRST204' && msg.includes('column')) ||
    (msg.includes('column') && (msg.includes('does not exist') || msg.includes('schema cache')))
  );
}

function isNetworkFetchError(err: any): boolean {
  if (!err) return false;
  const msg = String(err.message || '').toLowerCase();
  const details = String(err.details || '').toLowerCase();
  return (
    msg.includes('failed to fetch') ||
    msg.includes('networkerror') ||
    msg.includes('load failed') ||
    msg.includes('fetch failed') ||
    details.includes('failed to fetch')
  );
}

function isAuthKeyError(err: any): boolean {
  if (!err) return false;
  const code = String(err.code || '').toUpperCase();
  const msg = String(err.message || '').toLowerCase();
  return (
    code === 'PGRST301' ||
    code === '401' ||
    msg.includes('invalid api key') ||
    msg.includes('apikey') ||
    msg.includes('jwt')
  );
}

/**
 * TESTEUR DE CONNEXION SUPABASE
 * Effectue un diagnostic complet en direct :
 * 1. Validation et réparation intelligente de l'URL et de la clé (notamment via le JWT Anon)
 * 2. Requête de test vers l'instance
 * 3. Vérification précise de l'existence de la table `menu_items`
 * 4. Vérification précise de l'existence de la table `orders`
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
    hasMenuItemsTable?: boolean;
    hasOrdersTable?: boolean;
    menuTableStatus?: 'ok' | 'missing' | 'unreachable' | 'error';
    ordersTableStatus?: 'ok' | 'missing' | 'unreachable' | 'error';
    networkError?: boolean;
    authError?: boolean;
    missingTables?: boolean;
    correctedUrl?: string;
    correctedKey?: string;
    menuCount?: number;
    error?: string;
  };
}> {
  const activeCreds = getActiveSupabaseCredentials();
  let targetKey = sanitizeSupabaseKey(testKey !== undefined ? testKey : activeCreds.anonKey);

  // Si l'utilisateur a collé sa clé JWT dans le champ URL par erreur, la récupérer !
  if (!validateSupabaseKeyFormat(targetKey).isValidFormat && testUrl) {
    const rescuedKey = sanitizeSupabaseKey(testUrl);
    if (validateSupabaseKeyFormat(rescuedKey).isValidFormat) {
      targetKey = rescuedKey;
    }
  }

  let targetUrl = sanitizeSupabaseUrl(testUrl !== undefined ? testUrl : activeCreds.url, targetKey);
  const jwtDerivedUrl = deriveSupabaseUrlFromKey(targetKey);

  if (!targetUrl && jwtDerivedUrl) {
    targetUrl = jwtDerivedUrl;
  }

  const keyValidation = validateSupabaseKeyFormat(targetKey, targetUrl);
  if (!targetUrl && keyValidation.derivedUrl) {
    targetUrl = keyValidation.derivedUrl;
  }

  if (!targetUrl || !targetUrl.startsWith('https://') || !targetUrl.includes('.')) {
    return {
      success: false,
      message: "L'URL Supabase doit être valide et commencer par https:// (ex: https://xyz.supabase.co)",
    };
  }

  if (!keyValidation.isValidFormat) {
    return {
      success: false,
      message:
        keyValidation.warningMessage ||
        "La clé Anon saisie n'est pas valide. Dans Supabase > Project Settings > API Keys, copiez la clé publique « anon » (eyJ...) ou « Publishable key » (sb_publishable_...).",
      details: {
        menuTableFound: false,
        ordersTableFound: false,
        hasMenuItemsTable: false,
        hasOrdersTable: false,
        menuTableStatus: 'error',
        ordersTableStatus: 'error',
        authError: true,
        correctedUrl: targetUrl,
        correctedKey: targetKey,
        error: 'Format de clé API invalide',
      },
    };
  }

  const runProbe = async (probeUrl: string) => {
    const client = createSupabaseClientInstance(probeUrl, targetKey, false);

    const [menuRes, ordersRes] = await Promise.all([
      client.from('menu_items').select('id', { count: 'exact', head: true }),
      client.from('orders').select('id', { count: 'exact', head: true }),
    ]);

    return {
      menuCount: menuRes.count ?? undefined,
      menuError: menuRes.error,
      ordersError: ordersRes.error,
    };
  };

  const startTime = Date.now();

  try {
    let { menuCount, menuError, ordersError } = await runProbe(targetUrl);

    // Si l'URL échoue au niveau réseau ou clé et que le JWT Anon contient une URL officielle différente,
    // basculer automatiquement sur l'URL dérivée du JWT !
    if (
      (isNetworkFetchError(menuError) ||
        isNetworkFetchError(ordersError) ||
        isAuthKeyError(menuError) ||
        isAuthKeyError(ordersError)) &&
      jwtDerivedUrl &&
      jwtDerivedUrl.toLowerCase() !== targetUrl.toLowerCase()
    ) {
      targetUrl = jwtDerivedUrl;
      const retryRes = await runProbe(targetUrl);
      menuCount = retryRes.menuCount;
      menuError = retryRes.menuError;
      ordersError = retryRes.ordersError;
    }

    const latencyMs = Date.now() - startTime;

    // Cas 1 : Erreur réseau (Failed to fetch / DNS / Projet en pause)
    if (isNetworkFetchError(menuError) || isNetworkFetchError(ordersError)) {
      return {
        success: false,
        latencyMs,
        message: `Impossible de joindre le serveur Supabase (${targetUrl}). Vérifiez que : 1) L'URL correspond bien à votre projet, 2) Votre projet Supabase est actif (non mis en pause sur supabase.com), et 3) Votre connexion Internet fonctionne.`,
        details: {
          menuTableFound: false,
          ordersTableFound: false,
          hasMenuItemsTable: false,
          hasOrdersTable: false,
          menuTableStatus: 'unreachable',
          ordersTableStatus: 'unreachable',
          networkError: true,
          correctedUrl: targetUrl,
          correctedKey: targetKey,
          error: menuError?.message || ordersError?.message || 'Failed to fetch',
        },
      };
    }

    // Cas 2 : Clé API invalide ou refusée
    if (isAuthKeyError(menuError) || isAuthKeyError(ordersError)) {
      return {
        success: false,
        latencyMs,
        message:
          keyValidation.warningMessage ||
          `Le serveur Supabase (${targetUrl}) a refusé cette clé (« Invalid API key »). Assurez-vous d'avoir copié la clé publique « anon » (commençant par eyJ...) ou « Publishable key » (sb_publishable_...) appartenant bien au projet ${targetUrl.replace('https://', '')}.`,
        details: {
          menuTableFound: false,
          ordersTableFound: false,
          hasMenuItemsTable: false,
          hasOrdersTable: false,
          menuTableStatus: 'error',
          ordersTableStatus: 'error',
          authError: true,
          correctedUrl: targetUrl,
          correctedKey: targetKey,
          error: menuError?.message || ordersError?.message,
        },
      };
    }

    // Le serveur a répondu avec une clé valide : sauvegarder automatiquement l'URL réparée et la clé
    saveSupabaseConfig(targetUrl, targetKey, isAutoSyncEnabled());

    const menuMissing = isTableMissingError(menuError);
    const ordersMissing = isTableMissingError(ordersError);
    const menuOk = !menuError;
    const ordersOk = !ordersError;

    // Cas 3 : Connexion serveur OK mais une ou plusieurs tables n'existent pas encore
    if (menuMissing || ordersMissing) {
      const missingList = [
        !menuOk ? "'menu_items'" : null,
        !ordersOk ? "'orders'" : null,
      ]
        .filter(Boolean)
        .join(' et ');

      return {
        success: false,
        latencyMs,
        message: `Connexion établie avec votre projet Supabase (${latencyMs} ms), mais ${missingList.includes('et') ? 'les tables' : 'la table'} ${missingList} n'existe${missingList.includes('et') ? 'nt' : ''} pas encore. Cliquez sur « Copier & Voir le Script SQL » ci-dessous et exécutez-le dans SQL Editor sur Supabase.`,
        details: {
          menuTableFound: menuOk,
          ordersTableFound: ordersOk,
          hasMenuItemsTable: menuOk,
          hasOrdersTable: ordersOk,
          menuTableStatus: menuOk ? 'ok' : menuMissing ? 'missing' : 'error',
          ordersTableStatus: ordersOk ? 'ok' : ordersMissing ? 'missing' : 'error',
          missingTables: true,
          correctedUrl: targetUrl,
          correctedKey: targetKey,
          error: menuError?.message || ordersError?.message,
        },
      };
    }

    // Cas 4 : Autre erreur SQL / RLS
    if (menuError || ordersError) {
      const errObj = menuError || ordersError;
      return {
        success: false,
        latencyMs,
        message: `Erreur d'accès aux tables Supabase : ${errObj?.message}${errObj?.code ? ` (Code: ${errObj.code})` : ''}`,
        details: {
          menuTableFound: menuOk,
          ordersTableFound: ordersOk,
          hasMenuItemsTable: menuOk,
          hasOrdersTable: ordersOk,
          menuTableStatus: menuOk ? 'ok' : 'error',
          ordersTableStatus: ordersOk ? 'ok' : 'error',
          correctedUrl: targetUrl,
          correctedKey: targetKey,
          error: errObj?.message,
        },
      };
    }

    // Cas 5 : Tout est 100% opérationnel
    return {
      success: true,
      latencyMs,
      message: `Connexion Supabase réussie en ${latencyMs} ms ! Les tables 'menu_items' et 'orders' sont opérationnelles.`,
      details: {
        menuTableFound: true,
        ordersTableFound: true,
        hasMenuItemsTable: true,
        hasOrdersTable: true,
        menuTableStatus: 'ok',
        ordersTableStatus: 'ok',
        correctedUrl: targetUrl,
        correctedKey: targetKey,
        menuCount,
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
        hasMenuItemsTable: false,
        hasOrdersTable: false,
        menuTableStatus: 'unreachable',
        ordersTableStatus: 'unreachable',
        networkError: true,
        correctedUrl: targetUrl,
        correctedKey: targetKey,
        error: String(err),
      },
    };
  }
}

/**
 * POUSSER TOUT LE MENU EN BLOC VERS SUPABASE
 */
export async function pushAllMenuItemsToSupabase(
  items: MenuItem[],
  customUrl?: string,
  customKey?: string
): Promise<{
  success: boolean;
  count: number;
  total: number;
  error?: string;
  authError?: boolean;
  missingTables?: boolean;
  correctedUrl?: string;
  correctedKey?: string;
}> {
  const activeCreds = getActiveSupabaseCredentials();
  let targetKey = sanitizeSupabaseKey(customKey !== undefined && customKey.trim() !== '' ? customKey : activeCreds.anonKey);

  // Si la clé a été collée dans le champ URL par erreur
  if (!validateSupabaseKeyFormat(targetKey).isValidFormat && customUrl) {
    const rescuedKey = sanitizeSupabaseKey(customUrl);
    if (validateSupabaseKeyFormat(rescuedKey).isValidFormat) {
      targetKey = rescuedKey;
    }
  }

  let targetUrl = sanitizeSupabaseUrl(
    customUrl !== undefined && customUrl.trim() !== '' ? customUrl : activeCreds.url,
    targetKey
  );
  const jwtDerivedUrl = deriveSupabaseUrlFromKey(targetKey);
  if (!targetUrl && jwtDerivedUrl) {
    targetUrl = jwtDerivedUrl;
  }

  const keyValidation = validateSupabaseKeyFormat(targetKey, targetUrl);
  if (!keyValidation.isValidFormat) {
    return {
      success: false,
      count: 0,
      total: items.length,
      authError: true,
      correctedUrl: targetUrl,
      correctedKey: targetKey,
      error:
        keyValidation.warningMessage ||
        "Clé API Supabase invalide. Veuillez coller votre clé publique « anon » (eyJ...) ou « Publishable key » (sb_publishable_...).",
    };
  }

  if (!targetUrl || !targetUrl.startsWith('https://')) {
    return {
      success: false,
      count: 0,
      total: items.length,
      error: "L'URL du projet Supabase est manquante ou invalide.",
    };
  }

  // Sauvegarder la configuration nettoyée
  saveSupabaseConfig(targetUrl, targetKey, isAutoSyncEnabled());

  if (items.length === 0) {
    return { success: true, count: 0, total: 0, correctedUrl: targetUrl, correctedKey: targetKey };
  }

  try {
    const client = createSupabaseClientInstance(targetUrl, targetKey, false);

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
      let { error } = await client.from('menu_items').upsert(batch, { onConflict: 'id' });

      // Si la table menu_items existe mais n'a pas encore la colonne is_plat_du_jour (ancien schéma SQL),
      // réessayer automatiquement sans la colonne is_plat_du_jour !
      if (error && isColumnMissingError(error)) {
        const legacyBatch = batch.map(({ is_plat_du_jour, ...rest }) => rest);
        const retry = await client.from('menu_items').upsert(legacyBatch, { onConflict: 'id' });
        error = retry.error;
      }

      if (error) {
        if (isAuthKeyError(error)) {
          return {
            success: false,
            count: synced,
            total: items.length,
            authError: true,
            correctedUrl: targetUrl,
            correctedKey: targetKey,
            error: `La clé Anon a été refusée par ${targetUrl} (« Invalid API key »). Vérifiez que vous avez bien copié la clé « anon public » (eyJ...) ou « Publishable key » (sb_publishable_...) dans Supabase > Project Settings > API Keys.`,
          };
        }
        if (isTableMissingError(error)) {
          return {
            success: false,
            count: synced,
            total: items.length,
            missingTables: true,
            correctedUrl: targetUrl,
            correctedKey: targetKey,
            error: `Connexion réussie à Supabase, mais la table 'menu_items' n'a pas encore été créée ! Cliquez sur « Script SQL » et exécutez-le dans SQL Editor sur Supabase.`,
          };
        }
        throw new Error(error.message);
      }
      synced += batch.length;
    }

    return {
      success: true,
      count: synced,
      total: items.length,
      correctedUrl: targetUrl,
      correctedKey: targetKey,
    };
  } catch (err: any) {
    return {
      success: false,
      count: 0,
      total: items.length,
      correctedUrl: targetUrl,
      correctedKey: targetKey,
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

