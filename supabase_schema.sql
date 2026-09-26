-- ==============================================================================
-- KHADY'S FOOD & EVENT × ALLÔRESTO - SCRIPT SQL UNIFIÉ SUPABASE
-- Exécutez ce script dans Supabase > SQL Editor > "New Query" > "Run"
-- Compatible à 100% avec Khady's Food (menu_items, app_settings, orders)
-- et Allôresto (restaurants, dishes, daily_menus, orders) sans supprimer aucune donnée.
-- ==============================================================================

-- 1. TABLE DU RESTAURANT (Pour Allôresto & Khady's Food)
CREATE TABLE IF NOT EXISTS restaurants (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slogan TEXT,
    phone TEXT,
    whatsapp TEXT,
    address TEXT,
    logo_url TEXT,
    is_open BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO restaurants (id, name, slogan, phone, whatsapp, address, logo_url, is_open)
VALUES (
    'khadys-food',
    'Khady''s Food & Event',
    'L''excellence en un clic',
    '+227 74 44 16 21',
    '22774441621',
    'Grande mosquée : Muamar Kadafi, Niamey',
    'https://i.ibb.co/h1rgJJMb/1766933626062.jpg',
    true
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    phone = EXCLUDED.phone,
    whatsapp = EXCLUDED.whatsapp,
    address = EXCLUDED.address;

-- 2. TABLE DU MENU KHADY'S FOOD (menu_items)
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

-- 3. TABLE DES PLATS ALLÔRESTO (dishes)
CREATE TABLE IF NOT EXISTS dishes (
    id TEXT PRIMARY KEY,
    restaurant_id TEXT DEFAULT 'khadys-food',
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

-- Règle obligatoire : Attiéké et Doukounou restent dans la carte permanente et ne sont jamais plat du jour automatique
UPDATE menu_items
SET is_plat_du_jour = false,
    is_specialite_maison = true,
    category = CASE WHEN category IN ('Menu du Jour', 'Plat du Jour') THEN 'Spécialité Maison' ELSE category END
WHERE LOWER(name) LIKE '%doukounou%'
   OR LOWER(name) LIKE '%attiéké%'
   OR LOWER(name) LIKE '%attieke%'
   OR id IN ('douk-royal', 'attieke-royal', 'af3');

-- Synchronisation initiale sans doublon de menu_items vers dishes
INSERT INTO dishes (id, restaurant_id, name, description, price, image, category, rating, is_available, is_spicy, is_specialite_maison, is_plat_du_jour)
SELECT
    id,
    'khadys-food',
    name,
    description,
    price,
    image,
    category,
    COALESCE(rating, 5),
    COALESCE(is_available, true),
    COALESCE(is_spicy, false),
    COALESCE(is_specialite_maison, false),
    CASE
        WHEN LOWER(name) LIKE '%doukounou%' OR LOWER(name) LIKE '%attiéké%' OR LOWER(name) LIKE '%attieke%' THEN false
        ELSE COALESCE(is_plat_du_jour, false)
    END
FROM menu_items
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    image = EXCLUDED.image,
    category = EXCLUDED.category,
    is_available = EXCLUDED.is_available,
    is_plat_du_jour = EXCLUDED.is_plat_du_jour;

-- 4. TABLE DU MENU DU JOUR PAR DATE (daily_menus - 1 seul plat du jour publié par date pour Khady's Food)
CREATE TABLE IF NOT EXISTS daily_menus (
    id TEXT PRIMARY KEY,
    restaurant_id TEXT NOT NULL DEFAULT 'khadys-food',
    menu_date DATE NOT NULL DEFAULT CURRENT_DATE,
    dish_id TEXT,
    dish_name TEXT NOT NULL,
    description TEXT,
    price NUMERIC NOT NULL,
    image TEXT,
    is_published BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (restaurant_id, menu_date)
);

INSERT INTO daily_menus (id, restaurant_id, menu_date, dish_id, dish_name, description, price, image, is_published)
SELECT
    'khadys-daily-' || CURRENT_DATE::TEXT,
    'khadys-food',
    CURRENT_DATE,
    id,
    name,
    description,
    price,
    image,
    true
FROM menu_items
WHERE id = 'sp1'
LIMIT 1
ON CONFLICT (restaurant_id, menu_date) DO NOTHING;

-- 5. TABLE DES COMMANDES (orders)
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

-- 6. TABLE DES PARAMÈTRES GLOBAUX (app_settings)
CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. ACTIVER LA SÉCURITÉ ROW LEVEL SECURITY (RLS)
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE dishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- 8. POLITIQUES D'ACCÈS PUBLIC (Lecture & Écriture pour la synchronisation Khady's Food / Allôresto)
DROP POLICY IF EXISTS "Public Full Access restaurants" ON restaurants;
CREATE POLICY "Public Full Access restaurants" ON restaurants FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public Full Access menu_items" ON menu_items;
CREATE POLICY "Public Full Access menu_items" ON menu_items FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public Full Access dishes" ON dishes;
CREATE POLICY "Public Full Access dishes" ON dishes FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public Full Access daily_menus" ON daily_menus;
CREATE POLICY "Public Full Access daily_menus" ON daily_menus FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public Full Access orders" ON orders;
CREATE POLICY "Public Full Access orders" ON orders FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public Full Access app_settings" ON app_settings;
CREATE POLICY "Public Full Access app_settings" ON app_settings FOR ALL USING (true) WITH CHECK (true);

-- 9. PUBLICATION TEMPS RÉEL (SUPABASE REALTIME)
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime FOR TABLE restaurants, menu_items, dishes, daily_menus, orders, app_settings;
COMMIT;

