// app/[slug]/produits/[productSlug]/page.tsx
// Page produit publique — ISR 120 secondes + client public sans cookies()
//
// AVANT : Dynamic SSR — jusqu'à 7 appels Supabase par visite
// APRÈS  : ISR 120s + 2 appels max + React.cache() pour dédupliquer generateMetadata

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { cache } from 'react'
import { createPublicClient } from '@/lib/supabase/public'
import { StoreHeader } from '@/components/storefront/StoreHeader'
import { ProductGrid } from '@/components/storefront/ProductGrid'
import { ProductImageGallery } from '@/components/storefront/ProductImageGallery'
import { GradientButton } from '@/components/shared/GradientButton'
import { buildWhatsAppUrl } from '@/lib/whatsapp'
import { getTheme } from '@/lib/store-themes'
import { ChevronRight, Info } from 'lucide-react'
import type { Metadata } from 'next'

// ─── ISR : revalider toutes les 120 secondes ──────────────────────────────
export const revalidate = 120

// ─── Pré-générer les pages produit au build ───────────────────────────────
export async function generateStaticParams() {
  const supabase = createPublicClient()
  const { data: products } = await supabase
    .from('products')
    .select('slug, stores!inner(slug)')
    .eq('is_published', true)

  return (products as any[] || [])
    .filter((p) => p.stores && (p.stores as any).slug)
    .map((p) => ({
      slug: (p.stores as any).slug as string,
      productSlug: p.slug,
    }))
}

interface ProductPageParams {
  params: Promise<{ slug: string; productSlug: string }>
}

// ─── Cache React : évite de refaire les queries pour generateMetadata ─────
const getProductPageData = cache(async (slug: string, productSlug: string) => {
  const supabase = createPublicClient()

  // Query 1 : store + produit + images en une seule requête
  const { data: product } = await supabase
    .from('products')
    .select(
      `
      id, name, slug, description, price, list_price, image_url, category, is_published,
      product_images(id, url, position, is_primary),
      stores!inner(*)
    `
    )
    .eq('slug', productSlug)
    .eq('is_published', true)
    .eq('stores.slug', slug)
    .maybeSingle()

  const typedProduct = product as any

  if (!typedProduct || !typedProduct.stores) return null

  const store = typedProduct.stores as any

  // Query 2 : produits liés
  const relatedQuery = supabase
    .from('products')
    .select('id, name, slug, price, list_price, image_url, category')
    .eq('store_id', store.id)
    .eq('is_published', true)
    .neq('id', typedProduct.id)
    .limit(10)

  const { data: relatedProducts } = typedProduct.category
    ? await relatedQuery.eq('category', typedProduct.category)
    : await relatedQuery

  return { product: typedProduct, store, relatedProducts: relatedProducts as any[] || [] }
})

export async function generateMetadata({ params }: ProductPageParams): Promise<Metadata> {
  const { slug, productSlug } = await params
  const data = await getProductPageData(slug, productSlug)

  if (!data) return { title: 'Produit introuvable' }

  const { product, store } = data
  const primaryImage = (product.product_images as any[])?.find((i: any) => i.is_primary)
  const image =
    primaryImage?.url ||
    product.image_url ||
    store.cover_image ||
    store.logo_url ||
    'https://shop.rohaty.com/logo.png'

  const title = `${product.name} • ${new Intl.NumberFormat('fr-FR').format(product.price)} DJF`
  const description =
    product.description || `Découvrez ${product.name} chez ${store.name}`

  return {
    title,
    description,
    alternates: {
      canonical: `https://shop.rohaty.com/${slug}/produits/${productSlug}`,
    },
    openGraph: {
      title,
      description,
      url: `https://shop.rohaty.com/${slug}/produits/${productSlug}`,
      siteName: 'Rohaty Shop',
      images: [{ url: image, width: 1200, height: 1200, alt: product.name }],
      type: 'website',
    },
    twitter: { card: 'summary_large_image', title, description, images: [image] },
  }
}

export default async function PublicProductPage({ params }: ProductPageParams) {
  const { slug, productSlug } = await params
  const data = await getProductPageData(slug, productSlug)

  if (!data) notFound()

  const { product, store, relatedProducts } = data

  // Résoudre le thème
  const theme = getTheme(store.theme_name)
  const primaryColor = store.primary_color || theme.primaryColor
  const pageColor = store.page_color || theme.pageColor
  const textColor = store.text_color || theme.textColor
  const secondaryTextColor = store.secondary_text_color || theme.secondaryTextColor

  // Construire la liste d'images ordonnée
  const images: string[] =
    product.product_images && (product.product_images as any[]).length > 0
      ? [...(product.product_images as any[])]
        .sort((a: any, b: any) => a.position - b.position)
        .map((img: any) => img.url)
      : product.image_url
        ? [product.image_url]
        : []

  const hasDiscount = product.list_price > product.price
  const discountPct = hasDiscount
    ? Math.round((1 - product.price / product.list_price) * 100)
    : 0
  const whatsappOrderUrl = buildWhatsAppUrl(
    product.name,
    product.price,
    store.whatsapp,
    `https://shop.rohaty.com/${store.slug}/produits/${product.slug}`
  )
  const formatPrice = (price: number) => new Intl.NumberFormat('fr-FR').format(price)

  return (
    <div
      style={{
        '--primary': primaryColor,
        backgroundColor: pageColor,
        color: textColor,
      } as React.CSSProperties}
      className="min-h-screen flex flex-col font-sans"
    >
      <StoreHeader
        store={store}
        primaryColor={primaryColor}
        textColor={textColor}
        secondaryTextColor={secondaryTextColor}
      />

      <main className="flex-1 w-full pb-6">
        {/* Fil d'ariane */}
        <div
          className="px-3 sm:px-6 lg:px-8 py-2.5 flex items-center gap-1 text-[10px] sm:text-xs overflow-x-auto no-scrollbar"
          style={{ color: secondaryTextColor }}
        >
          <Link href={`/${store.slug}`} className="hover:opacity-80 transition-opacity shrink-0">
            Boutique
          </Link>
          {product.category && (
            <>
              <ChevronRight className="w-3 h-3 shrink-0 opacity-40" />
              <Link
                href={`/${store.slug}?category=${encodeURIComponent(product.category)}`}
                className="hover:opacity-80 transition-opacity shrink-0"
              >
                {product.category}
              </Link>
            </>
          )}
          <ChevronRight className="w-3 h-3 shrink-0 opacity-40" />
          <span className="opacity-80 truncate">{product.name}</span>
        </div>

        {/* Grille principale */}
        <div className="max-w-7xl mx-2 lg:mx-8 py-4">
          <div className="grid lg:grid-cols-2 gap-8">
            <ProductImageGallery
              images={images}
              productName={product.name}
              primaryColor={primaryColor}
              hasDiscount={hasDiscount}
              discountPct={discountPct}
            />

            <div className="space-y-5">
              <div className="flex justify-between">
                <h1 className="text-lg font-semibold leading-snug">{product.name}</h1>
                {product.category && (
                  <span
                    className="text-xs px-2 py-1 rounded"
                    style={{
                      backgroundColor: primaryColor + '20',
                      color: primaryColor,
                    }}
                  >
                    {product.category}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-3xl font-black" style={{ color: primaryColor }}>
                  {formatPrice(product.price)} DJF
                </span>
                {hasDiscount && (
                  <span className="text-sm line-through" style={{ color: secondaryTextColor }}>
                    {formatPrice(product.list_price)} DJF
                  </span>
                )}
              </div>

              {product.description && (
                <div className="pt-3 border-t border-white/5 w-[90vw]">
                  <p
                    className="text-sm leading-relaxed whitespace-pre-wrap break-words"
                    style={{ color: secondaryTextColor }}
                  >
                    {product.description}
                  </p>
                </div>
              )}

              <div className="pt-4">
                <GradientButton
                  variant="whatsapp"
                  href={whatsappOrderUrl}
                  target="_blank"
                  className="w-full py-3 font-bold"
                >
                  💬 Commander via WhatsApp
                </GradientButton>
                <div
                  className="flex items-center gap-2 text-[10px] mt-2"
                  style={{ color: secondaryTextColor }}
                >
                  <Info className="w-3 h-3" />
                  Commande envoyée automatiquement sur WhatsApp
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Produits liés */}
        {relatedProducts.length > 0 && (
          <div className="px-3 sm:px-6 lg:px-8 pt-8 mt-4 border-t border-white/5">
            <h2 className="text-sm sm:text-base font-bold mb-3" style={{ color: textColor }}>
              {product.category ? `Aussi dans ${product.category}` : 'Vous aimerez aussi'}
            </h2>
            <ProductGrid
              products={relatedProducts}
              storeSlug={store.slug}
              storeWhatsapp={store.whatsapp}
              primaryColor={primaryColor}
              textColor={textColor}
              secondaryTextColor={secondaryTextColor}
              cardColor={theme.cardColor}
            />
          </div>
        )}
      </main>

      <footer
        className="border-t border-white/5 py-5 text-center text-[10px] sm:text-xs select-none"
        style={{ color: secondaryTextColor }}
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