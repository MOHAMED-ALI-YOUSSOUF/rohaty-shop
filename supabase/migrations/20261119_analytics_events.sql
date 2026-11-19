-- Migration: Système d'analytics pour Rohaty Shop
-- Table analytics_events pour stocker les événements de navigation et conversion

CREATE TABLE IF NOT EXISTS public.analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name TEXT NOT NULL,
  store_id UUID REFERENCES public.stores(id) ON DELETE SET NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  visitor_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  page_path TEXT NOT NULL,
  referrer TEXT,
  device_type TEXT DEFAULT 'desktop',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Index pour optimiser les agrégations par période, boutique, produit et type d'événement
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at 
  ON public.analytics_events(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_analytics_events_store_created 
  ON public.analytics_events(store_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_analytics_events_prod_created 
  ON public.analytics_events(product_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_analytics_events_name_created 
  ON public.analytics_events(event_name, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_analytics_events_visitor 
  ON public.analytics_events(visitor_id);

CREATE INDEX IF NOT EXISTS idx_analytics_events_session 
  ON public.analytics_events(session_id);

-- Activation du Row Level Security
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Politiques RLS :
-- 1. Les vendeurs peuvent consulter uniquement les statistiques de leurs propres boutiques
DROP POLICY IF EXISTS "Store owners can read their store events" ON public.analytics_events;
CREATE POLICY "Store owners can read their store events" 
  ON public.analytics_events 
  FOR SELECT 
  TO authenticated 
  USING (
    store_id IN (
      SELECT id FROM public.stores WHERE owner_id = auth.uid()
    )
  );

-- 2. Insertion autorisée via service_role (l'API /api/analytics/track insère via service_role)
-- On donne aussi l'accès total à service_role
GRANT ALL ON public.analytics_events TO service_role;
GRANT SELECT ON public.analytics_events TO authenticated;

