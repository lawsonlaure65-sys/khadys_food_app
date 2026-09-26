-- ==============================================================================
-- KHADY'S FOOD & EVENT - SCRIPT SQL OFFICIEL SUPABASE (Complet & Prêt à l'emploi)
-- Exécutez ce script dans Supabase > SQL Editor > "New Query" > "Run"
-- ==============================================================================

-- 1. TABLE DU MENU (PLATS & SPÉCIALITÉS)
CREATE TABLE IF NOT EXISTS menu_items (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC NOT NULL,
    image TEXT,
    category TEXT NOT NULL,
    rating NUMERIC DEFAULT 5,
    is_available BOOLEAN DEFAULT true,
    is_spicy BOOLEAN DEFAULT false,
    is_specialite_maison BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. TABLE DES COMMANDES
CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    customer_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    items JSONB NOT NULL,
    total NUMERIC NOT NULL,
    delivery_fee NUMERIC NOT NULL DEFAULT 0,
    status TEXT DEFAULT 'RECEIVED',
    payment_method TEXT NOT NULL,
    district TEXT,
    address TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. TABLE DES PARAMÈTRES GLOBAUX (Plat du Jour, Photo Admin, Bannières, Codes Promo)
CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. ACTIVER LA SÉCURITÉ ROW LEVEL SECURITY (RLS)
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- 5. POLITIQUES PERMISSIVES POUR CLÉ ANON (Lecture & Écriture Publiques)
DROP POLICY IF EXISTS "Public Full Access menu_items" ON menu_items;
CREATE POLICY "Public Full Access menu_items" ON menu_items 
    FOR ALL 
    USING (true) 
    WITH CHECK (true);

DROP POLICY IF EXISTS "Public Full Access orders" ON orders;
CREATE POLICY "Public Full Access orders" ON orders 
    FOR ALL 
    USING (true) 
    WITH CHECK (true);

DROP POLICY IF EXISTS "Public Full Access app_settings" ON app_settings;
CREATE POLICY "Public Full Access app_settings" ON app_settings 
    FOR ALL 
    USING (true) 
    WITH CHECK (true);

-- 6. PUBLICATION TEMPS RÉEL (SUPABASE REALTIME)
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime FOR TABLE menu_items, orders, app_settings;
COMMIT;
