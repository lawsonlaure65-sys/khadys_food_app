export const SUPABASE_SQL_SCHEMA = `-- ==============================================================================
-- SCHEMA OFFICIEL SUPABASE - KHADY'S FOOD (RESTAURANT & TRAITEUR ELITE)
-- Exécutez ce script dans l'onglet 'SQL Editor' de votre tableau de bord Supabase
-- ==============================================================================

-- 1. Table des Plats du Menu
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
    is_plat_du_jour BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Table des Commandes Clients
CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    customer_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    address TEXT,
    district TEXT,
    items JSONB NOT NULL,
    total NUMERIC NOT NULL,
    delivery_fee NUMERIC DEFAULT 0,
    status TEXT DEFAULT 'RECEIVED',
    payment_method TEXT NOT NULL,
    payment_type TEXT,
    payment_transaction_id TEXT,
    payment_proof_url TEXT,
    payment_validated BOOLEAN DEFAULT false,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Sécurité Row Level Security (RLS) & Politiques d'accès
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Nettoyer les anciennes politiques éventuelles
DROP POLICY IF EXISTS "Lecture publique du menu" ON menu_items;
DROP POLICY IF EXISTS "Lecture publique" ON menu_items;
DROP POLICY IF EXISTS "Modification du menu" ON menu_items;
DROP POLICY IF EXISTS "Création des commandes" ON orders;
DROP POLICY IF EXISTS "Envoi public de commandes" ON orders;
DROP POLICY IF EXISTS "Accès aux commandes" ON orders;
DROP POLICY IF EXISTS "Lecture publique des commandes" ON orders;

-- Autoriser la lecture publique de la carte du menu
CREATE POLICY "Lecture publique du menu" ON menu_items 
FOR SELECT USING (true);

-- Autoriser l'insertion/modification du menu (admin & app)
CREATE POLICY "Modification du menu" ON menu_items 
FOR ALL USING (true) WITH CHECK (true);

-- Autoriser les clients à envoyer des commandes
CREATE POLICY "Envoi public de commandes" ON orders 
FOR INSERT WITH CHECK (true);

-- Autoriser la lecture et mise à jour des commandes
CREATE POLICY "Accès aux commandes" ON orders 
FOR ALL USING (true) WITH CHECK (true);
`;
