
-- ==========================================
-- CONFIGURATION KHADY'S ELITE - SUPABASE COMPLETE
-- ==========================================

-- 1. CRÉATION DE LA TABLE DES PRODUITS (MENU)
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

-- 2. CRÉATION DE LA TABLE DES COMMANDES
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

-- 3. POLITIQUES DE SÉCURITÉ (RLS)
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes politiques pour éviter les doublons
DROP POLICY IF EXISTS "Lecture publique du menu" ON menu_items;
DROP POLICY IF EXISTS "Gestion publique du menu" ON menu_items;
DROP POLICY IF EXISTS "Modification du menu" ON menu_items;
DROP POLICY IF EXISTS "Suppression du menu" ON menu_items;
DROP POLICY IF EXISTS "Insertion du menu" ON menu_items;
DROP POLICY IF EXISTS "Envoi public de commandes" ON orders;
DROP POLICY IF EXISTS "Lecture publique des commandes" ON orders;
DROP POLICY IF EXISTS "Mise a jour des commandes" ON orders;

-- Politiques complètes pour menu_items (Lecture, Ajout, Modification, Suppression)
CREATE POLICY "Lecture publique du menu" ON menu_items 
FOR SELECT USING (true);

CREATE POLICY "Insertion du menu" ON menu_items 
FOR INSERT WITH CHECK (true);

CREATE POLICY "Modification du menu" ON menu_items 
FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Suppression du menu" ON menu_items 
FOR DELETE USING (true);

-- Politiques complètes pour orders
CREATE POLICY "Lecture publique des commandes" ON orders 
FOR SELECT USING (true);

CREATE POLICY "Envoi public de commandes" ON orders 
FOR INSERT WITH CHECK (true);

CREATE POLICY "Mise a jour des commandes" ON orders 
FOR UPDATE USING (true) WITH CHECK (true);

-- 4. ACTIVER LA SYNCHRONISATION EN TEMPS RÉEL (REALTIME)
ALTER PUBLICATION supabase_realtime ADD TABLE menu_items;
ALTER PUBLICATION supabase_realtime ADD TABLE orders;

