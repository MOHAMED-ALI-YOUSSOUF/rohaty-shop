import { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'

export const revalidate = 3600 // Cache sitemap pendant 1 heure

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://shop.rohaty.com'

  // Initialisation directe du client Supabase pour éviter les problèmes liés aux cookies/headers pendant le build statique
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Routes statiques de base
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/connexion`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/inscription`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ]

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase env variables are missing for sitemap generation.')
    return staticRoutes
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    // Récupérer toutes les boutiques
    const { data: stores } = await supabase
      .from('stores')
      .select('slug, created_at')

    // Récupérer tous les produits publiés avec le slug de leur boutique associée
    const { data: products } = await supabase
      .from('products')
      .select('slug, created_at, stores(slug)')
      .eq('is_published', true)

    // Formater les routes des boutiques
    const storeRoutes: MetadataRoute.Sitemap = (stores || []).map((store) => ({
      url: `${baseUrl}/${store.slug}`,
      lastModified: store.created_at ? new Date(store.created_at) : new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    }))

    // Formater les routes des produits
    const productRoutes: MetadataRoute.Sitemap = (products || [])
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
