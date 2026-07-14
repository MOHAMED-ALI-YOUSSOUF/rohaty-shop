// lib/supabase/public.ts
// Client Supabase pour les données PUBLIQUES (vitrine, storefront, sitemap)
// 
// ⚠️  N'utilise PAS cookies() ni headers() → compatible ISR / SSG / cache statique
// ✅  Utilise le singleton pattern pour éviter de créer un client par requête
// ✅  Utilise uniquement l'anon key → lecture seule des données publiques (RLS active)

import { createClient as createSupabaseClient } from '@supabase/supabase-js'

let _client: ReturnType<typeof createSupabaseClient> | null = null

export function createPublicClient() {
  if (_client) return _client

  _client = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  return _client
}
