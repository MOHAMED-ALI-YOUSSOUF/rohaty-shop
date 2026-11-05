-- supabase/migrations/20261105_categories.sql
-- Migration : Centralisation et normalisation des catégories officielles Rohaty Shop

-- 1. Table des catégories officielles
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  image_url TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index pour performances de recherche et filtrage
CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_is_active ON public.categories(is_active);
CREATE INDEX IF NOT EXISTS idx_categories_position ON public.categories(position);

-- Activer RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Lecture publique pour tous
CREATE POLICY "Categories are viewable by everyone" 
ON public.categories FOR SELECT USING (true);

-- Gestion par les utilisateurs authentifiés / service role
CREATE POLICY "Categories can be managed by authenticated users" 
ON public.categories FOR ALL 
USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- 2. Ajout de category_id dans products
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.categories(id);

CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);

-- 3. Insertion des 8 catégories officielles
INSERT INTO public.categories (name, slug, position, is_active)
VALUES 
  ('Vêtements', 'vetements', 1, true),
  ('Chaussures', 'chaussures', 2, true),
  ('Accessoires', 'accessoires', 3, true),
  ('Parfums', 'parfums', 4, true),
  ('Beauté et soins', 'beaute-et-soins', 5, true),
  ('Électronique', 'electronique', 6, true),
  ('Maison', 'maison', 7, true),
  ('Enfants et bébés', 'enfants-et-bebes', 8, true)
ON CONFLICT (slug) DO UPDATE 
SET name = EXCLUDED.name, position = EXCLUDED.position, is_active = EXCLUDED.is_active;

