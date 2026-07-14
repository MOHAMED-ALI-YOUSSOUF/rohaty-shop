// app/sitemap.ts
// Sitemap dynamique avec ISR 1h — utilise le client public (sans cookies)
import { MetadataRoute } from 'next'
import { createPublicClient } from '@/lib/supabase/public'

export const revalidate = 3600 // Cache sitemap pendant 1 heure

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://shop.rohaty.com'

  // Routes statiques de base
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date('2026-01-01'), // date fixe — pas de faux "changement"
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/connexion`,
      lastModified: new Date('2026-01-01'),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/inscription`,
      lastModified: new Date('2026-01-01'),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ]

  try {
    // ✅ Client public — pas de cookies(), compatible ISR
    const supabase = createPublicClient()

    // Requête parallèle : boutiques + produits en même temps
    const [{ data: stores }, { data: products }] = await Promise.all([
      supabase.from('stores').select('slug, created_at'),
      supabase
        .from('products')
        .select('slug, created_at, stores!inner(slug)')
        .eq('is_published', true),
    ])

    const storeRoutes: MetadataRoute.Sitemap = (stores as any[] || []).map((store) => ({
      url: `${baseUrl}/${store.slug}`,
      lastModified: store.created_at ? new Date(store.created_at) : new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    }))

    const productRoutes: MetadataRoute.Sitemap = (products as any[] || [])
      .filter((product) => product.stores && (product.stores as any).slug)
      .map((product) => ({
        url: `${baseUrl}/${(product.stores as any).slug}/produits/${product.slug}`,
        lastModified: product.created_at ? new Date(product.created_at) : new Date(),
        changeFrequency: 'weekly',
        priority: 0.6,
      }))

    return [...staticRoutes, ...storeRoutes, ...productRoutes]
  } catch (error) {
    console.error('Error generating sitemap:', error)
    return staticRoutes
  }
}
