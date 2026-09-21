-- ==============================================================================
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
-- Activer RLS pour la sécurité
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Nettoyer les anciennes politiques éventuelles pour éviter l'erreur 42710 (policy already exists)
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

-- Autoriser l'insertion/modification du menu (admin)
CREATE POLICY "Modification du menu" ON menu_items 
FOR ALL USING (true);

-- Autoriser les clients à passer des commandes
CREATE POLICY "Création des commandes" ON orders 
FOR INSERT WITH CHECK (true);

-- Autoriser la lecture et mise à jour des commandes
CREATE POLICY "Accès aux commandes" ON orders 
FOR ALL USING (true);

-- 4. Exemples de Plats de Départ (Menu Khady's Food)
INSERT INTO menu_items (id, name, description, price, image, category, rating, is_specialite_maison, is_spicy)
VALUES 
('sp1', 'Tiep Royal Khady', 'Le chef-d''œuvre de la maison au poisson capitaine, riz rouge parfumé et légumes fondants.', 5500, 'https://images.unsplash.com/photo-1627308595229-7830a5c91f9f?w=800', 'Spécialité Maison', 5, true, true),
('sp2', 'Plateau Prestige Event', 'Assortiment géant de grillades, pastels et alloco pour 4 personnes.', 15000, 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800', 'Spécialité Maison', 5, true, false),
('dj1', 'Dambou du Jour', 'Couscous de moringa frais aux arachides grillées, servi avec du poulet braisé.', 2500, 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800', 'Plat Africain', 4.9, false, false),
('af1', 'Mafé Boeuf Express', 'Sauce arachide onctueuse, riz blanc long grain.', 3500, 'https://images.unsplash.com/photo-1541518763531-4a949439a3f8?w=800', 'Plat Africain', 5, false, false),
('af3', 'Attiéké Poisson Grillé', 'Semoule de manioc, poisson capitaine grillé, alloco.', 5000, 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=800', 'Plat Africain', 5, false, false),
('bx1', 'Box Sauce Mafé', 'Onctueuse sauce à l''arachide, prête à réchauffer. Format familial 1L.', 4500, 'https://images.unsplash.com/photo-1541518763531-4a949439a3f8?w=800', 'Box Sauce', 4.8, false, false),
('de1', 'Dégué Royal', 'Couscous de mil au yaourt onctueux, miel et coco.', 1500, 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=800', 'Dessert', 4.9, false, false),
('bo1', 'Bissap Rouge Glacé', 'Infusion hibiscus et menthe fraîche.', 500, 'https://images.unsplash.com/photo-1556881286-fc6915169721?w=800', 'Boisson Froide', 5, false, false)
ON CONFLICT (id) DO NOTHING;
