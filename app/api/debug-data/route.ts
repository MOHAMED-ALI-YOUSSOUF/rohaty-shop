// app/api/debug-data/route.ts
// Endpoint de diagnostic TEMPORAIRE — à supprimer après correction
// Ne retourne AUCUN secret, seulement les erreurs Supabase et les comptages

import { NextResponse } from 'next/server'
import { createPublicClient } from '@/lib/supabase/public'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = createPublicClient()

  // ── Test 1 : stores sans is_active ──────────────────────────────────────
  const { data: storesOk, error: errStoresOk } = await supabase
    .from('stores')
    .select('id, name, slug, slogan, logo_url, banner_url, primary_color, created_at')
    .order('created_at', { ascending: false })

  // ── Test 2 : stores AVEC is_active (colonne suspecte) ───────────────────
  const { data: storesBad, error: errStoresBad } = await supabase
    .from('stores')
    .select('id, name, slug, is_active')
    .limit(3)

  // ── Test 3 : products sans join ──────────────────────────────────────────
  const { data: productsSimple, error: errProductsSimple } = await supabase
    .from('products')
    .select('id, name, slug, is_published, store_id')
    .eq('is_published', true)
    .limit(5)

  // ── Test 4 : products JOIN stores!inner sans is_active ───────────────────
  const { data: productsJoin, error: errProductsJoin } = await supabase
    .from('products')
    .select('id, name, slug, stores!inner(id, slug, name, whatsapp, primary_color, logo_url)')
    .eq('is_published', true)
    .limit(5)

  // ── Test 5 : products JOIN stores!inner AVEC is_active (suspect) ─────────
  const { data: productsJoinBad, error: errProductsJoinBad } = await supabase
    .from('products')
    .select('id, name, slug, stores!inner(id, slug, name, whatsapp, primary_color, logo_url, is_active)')
    .eq('is_published', true)
    .limit(5)

  return NextResponse.json({
    test1_stores_sans_is_active: {
      count: storesOk?.length ?? null,
      error: errStoresOk ? { message: errStoresOk.message, code: errStoresOk.code, details: errStoresOk.details } : null,
    },
    test2_stores_avec_is_active: {
      count: storesBad?.length ?? null,
      error: errStoresBad ? { message: errStoresBad.message, code: errStoresBad.code, details: errStoresBad.details } : null,
    },
    test3_products_simple: {
      count: productsSimple?.length ?? null,
      error: errProductsSimple ? { message: errProductsSimple.message, code: errProductsSimple.code, details: errProductsSimple.details } : null,
    },
    test4_products_join_sans_is_active: {
      count: productsJoin?.length ?? null,
      error: errProductsJoin ? { message: errProductsJoin.message, code: errProductsJoin.code, details: errProductsJoin.details } : null,
    },
    test5_products_join_avec_is_active: {
      count: productsJoinBad?.length ?? null,
      error: errProductsJoinBad ? { message: errProductsJoinBad.message, code: errProductsJoinBad.code, details: errProductsJoinBad.details } : null,
    },
  })
}
