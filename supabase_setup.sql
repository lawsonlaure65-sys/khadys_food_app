
-- ==========================================
-- CONFIGURATION KHADY'S ELITE - SUPABASE
-- ==========================================

-- 1. NETTOYAGE (Optionnel : à n'utiliser que pour réinitialiser)
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS menu_items;

-- 2. CRÉATION DE LA TABLE DES PRODUITS (MENU)
CREATE TABLE menu_items (
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

-- 3. CRÉATION DE LA TABLE DES COMMANDES
CREATE TABLE orders (
    id TEXT PRIMARY KEY,
    customer_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    items JSONB NOT NULL, -- Stockage des produits commandés en format JSON
    total NUMERIC NOT NULL,
    delivery_fee NUMERIC NOT NULL,
    status TEXT DEFAULT 'RECEIVED',
    payment_method TEXT NOT NULL,
    district TEXT,
    address TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. POLITIQUES DE SÉCURITÉ (RLS)
-- Active la sécurité sur les tables
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Autoriser tout le monde (Public) à lire le menu
CREATE POLICY "Lecture publique du menu" ON menu_items 
FOR SELECT USING (true);

-- Autoriser tout le monde (Public) à envoyer une commande
CREATE POLICY "Envoi public de commandes" ON orders 
FOR INSERT WITH CHECK (true);

-- Autoriser tout le monde (Public) à voir l'historique (Note: En prod, on filtrerait par téléphone ou user_id)
CREATE POLICY "Lecture publique des commandes" ON orders 
FOR SELECT USING (true);

-- 5. INSERTION DU MENU INITIAL (SEEDS)
INSERT INTO menu_items (id, name, description, price, image, category, rating, is_specialite_maison, is_spicy)
VALUES 
('sp1', 'Tiep Royal Khady', 'Le chef-d''œuvre de la maison au poisson capitaine, riz rouge parfumé et légumes fondants.', 5500, 'https://images.unsplash.com/photo-1627308595229-7830a5c91f9f?w=800', 'Spécialité Maison', 5, true, true),
('sp2', 'Plateau Prestige Event', 'Assortiment géant de grillades, pastels et alloco pour 4 personnes.', 15000, 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800', 'Spécialité Maison', 5, true, false),
('dj1', 'Dambou du Jour', 'Couscous de moringa frais aux arachides grillées, servi avec du poulet braisé.', 2500, 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800', 'Plat Africain', 4.9, false, false),
('af3', 'Attiéké Poisson Grillé', 'Semoule de manioc, poisson capitaine grillé, alloco.', 5000, 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=800', 'Plat Africain', 5, false, false),
('bx1', 'Box Sauce Mafé', 'Onctueuse sauce à l''arachide, prête à réchauffer. Format familial 1L.', 4500, 'https://images.unsplash.com/photo-1541518763531-4a949439a3f8?w=800', 'Box Sauce', 4.8, false, false),
('de1', 'Dégué Royal', 'Couscous de mil au yaourt onctueux, miel et coco.', 1500, 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=800', 'Dessert', 4.9, false, false),
('bo1', 'Bissap Rouge Glacé', 'Infusion hibiscus et menthe fraîche.', 500, 'https://images.unsplash.com/photo-1556881286-fc6915169721?w=800', 'Boisson Froide', 5, false, false);

-- Fin du script
