// app/[slug]/page.tsx
// Page vitrine publique — ISR 60 secondes + client public sans cookies()
//
// AVANT : Dynamic SSR — Serverless Function à chaque visite, cookies() bloque le cache
// APRÈS  : ISR 60s → HTML servi depuis le CDN après la première génération

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { cache } from 'react'
import { createPublicClient } from '@/lib/supabase/public'
import { StoreHeader } from '@/components/storefront/StoreHeader'
import { StorefrontCatalog } from '@/components/storefront/StorefrontCatalog'
import { buildWhatsAppUrl } from '@/lib/whatsapp'
import { StoreAnalytics } from '@/components/storefront/StoreAnalytics'
import { getTheme } from '@/lib/store-themes'
import type { Metadata } from 'next'

// ─── ISR : revalider toutes les 60 secondes ───────────────────────────────
export const revalidate = 60

// ─── Pré-générer les pages au build ─────────────────────────────────────────
export async function generateStaticParams() {
  const supabase = createPublicClient()
  const { data: stores } = await supabase.from('stores').select('slug')
  return (stores as any[] || []).map((store) => ({ slug: store.slug }))
}

interface StorefrontPageProps {
  params: Promise<{ slug: string }>
  // searchParams retiré — filtrage catégorie géré côté client dans StorefrontCatalog
}

// ─── Cache React : déduplique les queries entre generateMetadata et la page ─
const getStoreData = cache(async (slug: string) => {
  const supabase = createPublicClient()

  const { data: store } = await supabase
    .from('stores')
    .select('*')
    .eq('slug', slug)
    .maybeSingle()

  if (!store) return null

  const typedStore = store as any

  const { data: products } = await supabase
    .from('products')
    .select('id, name, slug, description, price, list_price, image_url, category')
    .eq('store_id', typedStore.id)
    .eq('is_published', true)
    .order('sort_order', { ascending: true })

  return { store: typedStore, products: products as any[] || [] }
})

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const data = await getStoreData(slug)

  if (!data) return { title: 'Boutique introuvable' }
  const { store } = data

  const image =
    store.cover_image ||
    store.logo_url ||
    'https://shop.rohaty.com/logo.png'

  return {
    title: `${store.name} | Rohaty Shop`,
    description:
      store.description || `Découvrez les produits de ${store.name}`,
    alternates: {
      canonical: `https://shop.rohaty.com/${store.slug}`,
    },
    openGraph: {
      title: store.name,
      description:
        store.description || `Découvrez les produits de ${store.name}`,
      url: `https://shop.rohaty.com/${store.slug}`,
      siteName: 'Rohaty Shop',
      images: [{ url: image, width: 1200, height: 630, alt: store.name }],
      locale: 'fr_FR',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: store.name,
      description:
        store.description || `Découvrez les produits de ${store.name}`,
      images: [image],
    },
  }
}

export default async function StorefrontPage({ params }: StorefrontPageProps) {
  const { slug } = await params
  const data = await getStoreData(slug)

  if (!data) notFound()

  const { store, products } = data

  // Résoudre le thème de la boutique
  const theme = getTheme(store.theme_name)
  const primaryColor = store.primary_color || theme.primaryColor
  const pageColor = store.page_color || theme.pageColor
  const textColor = store.text_color || theme.textColor
  const secondaryTextColor = store.secondary_text_color || theme.secondaryTextColor
  const cardColor = store.card_color || theme.cardColor

  // Calcul des URLs WhatsApp côté serveur (Server Component)
  const productsWithWhatsApp = products.map((product) => ({
    ...product,
    whatsappUrl: buildWhatsAppUrl(
      product.name,
      product.price,
      store.whatsapp,
      `https://shop.rohaty.com/${store.slug}/produits/${product.slug}`
    ),
  }))

  return (
    <div
      style={{
        '--primary': primaryColor,
        '--page-color': pageColor,
        '--text-color': textColor,
        '--secondary-text': secondaryTextColor,
        '--card-color': cardColor,
        backgroundColor: pageColor,
        color: textColor,
      } as React.CSSProperties}
      className="min-h-screen flex flex-col font-sans"
    >
      {/* Google Analytics — tracking par boutique */}
      <StoreAnalytics slug={store.slug} name={store.name} />

      {/* Header de la boutique */}
      <StoreHeader
        store={store}
        primaryColor={primaryColor}
        textColor={textColor}
        secondaryTextColor={secondaryTextColor}
      />

      {/* Catalogue avec filtrage client-side */}
      <StorefrontCatalog
        products={productsWithWhatsApp}
        storeSlug={store.slug}
        primaryColor={primaryColor}
        textColor={textColor}
        cardColor={cardColor}
      />

      {/* Footer */}
      <footer
        className="border-t border-white/5 py-6 text-center text-xs select-none"
        style={{ backgroundColor: cardColor, color: secondaryTextColor }}
      >
        <p>
          © {new Date().getFullYear()} {store.name} · Propulsé par{' '}
          <Link href="/" className="font-semibold hover:underline" style={{ color: primaryColor }}>
            Rohaty Shop
          </Link>
        </p>
      </footer>
    </div>
  )
}
