-- supabase/migrations/20261108_banners_and_security.sql
-- 1. Table des bannières du marketplace
CREATE TABLE IF NOT EXISTS public.banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url TEXT NOT NULL,
  link_url TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index pour tri et filtrage
CREATE INDEX IF NOT EXISTS idx_banners_position ON public.banners(position);
CREATE INDEX IF NOT EXISTS idx_banners_is_active ON public.banners(is_active);

-- Activer RLS sur banners
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

-- Lecture publique pour tous
DROP POLICY IF EXISTS "Banners are viewable by everyone" ON public.banners;
CREATE POLICY "Banners are viewable by everyone"
ON public.banners FOR SELECT USING (true);

-- Modification réservée au service role (Route Handlers avec service role key)
DROP POLICY IF EXISTS "Banners can be managed by service_role" ON public.banners;
CREATE POLICY "Banners can be managed by service_role"
ON public.banners FOR ALL USING (auth.role() = 'service_role');

-- 2. Sécurisation de la table categories
-- Supprimer la politique permissive pour les utilisateurs authentifiés
DROP POLICY IF EXISTS "Categories can be managed by authenticated users" ON public.categories;
DROP POLICY IF EXISTS "Categories can be managed by service_role" ON public.categories;

-- Seul le service_role peut modifier les catégories (les vendeurs n'y ont plus accès)
CREATE POLICY "Categories can be managed by service_role"
ON public.categories FOR ALL USING (auth.role() = 'service_role');

