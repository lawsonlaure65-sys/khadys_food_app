-- RÉINITIALISATION ELITE
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS menu_items;

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

CREATE TABLE orders (
    id TEXT PRIMARY KEY,
    customer_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    items JSONB NOT NULL,
    total NUMERIC NOT NULL,
    delivery_fee NUMERIC NOT NULL,
    status TEXT DEFAULT 'RECEIVED',
    payment_method TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO menu_items (id, name, description, price, image, category, rating, is_specialite_maison, is_spicy)
VALUES 
('sp1', 'Tiep Royal Khady', 'Le chef-d''œuvre de la maison au poisson capitaine, riz rouge parfumé et légumes fondants.', 5500, 'https://images.unsplash.com/photo-1627308595229-7830a5c91f9f?w=800', 'Spécialité Maison', 5, true, true),
('af1', 'Mafé Boeuf Express', 'Sauce arachide onctueuse, riz blanc long grain.', 3500, 'https://images.unsplash.com/photo-1541518763531-4a949439a3f8?w=800', 'Plat Africain', 5, false, false);