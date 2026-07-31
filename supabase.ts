
import { createClient } from '@supabase/supabase-js';

// Récupération des clés depuis Vercel ou l'environnement
const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
const supabaseKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

// Vérification de la validité pour éviter le crash
const isValid = supabaseUrl.startsWith('https://') && supabaseKey.length > 20;

export const supabase = isValid ? createClient(supabaseUrl, supabaseKey) : null;

if (!isValid) {
  console.log("ℹ️ Supabase n'est pas encore configuré. L'application utilise les données locales.");
}
