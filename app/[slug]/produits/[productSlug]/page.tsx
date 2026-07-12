// app/[slug]/produits/[productSlug]/page.tsx
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { StoreHeader } from '@/components/storefront/StoreHeader'
import { ProductGrid } from '@/components/storefront/ProductGrid'
import { buildWhatsAppUrl } from '@/lib/whatsapp'
import { GradientButton } from '@/components/shared/GradientButton'
import { ChevronRight, ShoppingBag, Info } from 'lucide-react'
import { Metadata } from 'next'
import { ProductImageGallery } from '@/components/storefront/ProductImageGallery'

// --- generateMetadata inchangé sauf la query qui inclut product_images ---
interface MetadataProps {
  params: Promise<{ slug: string; productSlug: string }>
}

export async function generateMetadata({ params }: MetadataProps): Promise<Metadata> {
  const { slug, productSlug } = await params
  const supabase = await createClient()

  const { data: store } = await supabase
    .from('stores').select('*').eq('slug', slug).maybeSingle()
  if (!store) return { title: 'Produit introuvable' }

  const { data: product } = await supabase
    .from('products')
    .select('*, product_images(*)')   // ← ajout
    .eq('store_id', store.id)
    .eq('slug', productSlug)
    .eq('is_published', true)
    .maybeSingle()
  if (!product) return { title: 'Produit introuvable' }

  // Image OG : préférer la principale de product_images
  const primaryImage = product.product_images?.find((i: any) => i.is_primary)
  const image =
    primaryImage?.url ||
    product.image_url ||
    store.cover_image ||
    store.logo_url ||
    'https://shop.rohaty.com/logo.png'

  const title = `${product.name} • ${new Intl.NumberFormat('fr-FR').format(product.price)} DJF`
  const description = product.description || `Découvrez ${product.name} chez ${store.name}`

  return {
    title,
    description,
    openGraph: {
      title, description,
      url: `https://shop.rohaty.com/${slug}/produits/${productSlug}`,
      siteName: 'Rohaty Shop',
      images: [{ url: image, width: 1200, height: 1200, alt: product.name }],
      type: 'website',
    },
    twitter: { card: 'summary_large_image', title, description, images: [image] },
  }
}

interface ProductPageProps {
  params: Promise<{ slug: string; productSlug: string }>
}

export default async function PublicProductPage({ params }: ProductPageProps) {
  const { slug, productSlug } = await params
  const supabase = await createClient()

  const { data: store } = await supabase
    .from('stores').select('*').eq('slug', slug).maybeSingle()
  if (!store) notFound()

  // Charger le produit avec ses images
  const { data: product } = await supabase
    .from('products')
    .select('*, product_images(*)')   // ← ajout
    .eq('store_id', store.id)
    .eq('slug', productSlug)
    .eq('is_published', true)
    .maybeSingle()
  if (!product) notFound()

  // Construire la liste d'images ordonnée
  const images: string[] = product.product_images && product.product_images.length > 0
    ? [...product.product_images]
      .sort((a: any, b: any) => a.position - b.position)
      .map((img: any) => img.url)
    : product.image_url
      ? [product.image_url]   // fallback produits legacy
      : []

  // ... (queries storeProducts + relatedProducts inchangées)
  const { data: storeProducts } = await supabase
    .from('products').select('category').eq('store_id', store.id).eq('is_published', true)

  const allCategories = Array.from(
    new Set((storeProducts || []).map((p) => p.category?.trim()).filter((c): c is string => !!c))
  )

  const { data: sameCategoryProducts } = product.category
    ? await supabase
      .from('products').select('*')
      .eq('store_id', store.id).eq('is_published', true)
      .eq('category', product.category).neq('id', product.id).limit(10)
    : { data: [] }

  let relatedProducts = sameCategoryProducts || []
  if (relatedProducts.length < 8) {
    const { data: fillerProducts } = await supabase
      .from('products').select('*')
      .eq('store_id', store.id).eq('is_published', true)
      .neq('id', product.id).limit(16)
    const existingIds = new Set(relatedProducts.map((p) => p.id))
    relatedProducts = [
      ...relatedProducts,
      ...(fillerProducts || []).filter((p) => !existingIds.has(p.id)),
    ].slice(0, 10)
  }

  const theme = {
    primaryColor: store.primary_color || '#2563EB',
    pageColor: store.page_color || '#0F172A',
    textColor: store.text_color || '#FFFFFF',
    secondaryTextColor: store.secondary_text_color || '#94A3B8',
    cardColor: store.card_color || '#1E293B',
  }

  const hasDiscount = product.list_price > product.price
  const discountPct = hasDiscount
    ? Math.round((1 - product.price / product.list_price) * 100)
    : 0
  const whatsappOrderUrl = buildWhatsAppUrl(product.name, product.price, store.whatsapp, `https://shop.rohaty.com/${store.slug}/produits/${product.slug}`)
  const formatPrice = (price: number) => new Intl.NumberFormat('fr-FR').format(price)

  return (
    <div
      style={{
        '--primary': theme.primaryColor,
        backgroundColor: theme.pageColor,
        color: theme.textColor,
      } as React.CSSProperties}
      className="min-h-screen flex flex-col font-sans"
    >
      <main className="flex-1 w-full pb-6">
        {/* Fil d'ariane */}
        <div className="px-3 sm:px-6 lg:px-8 py-2.5 flex items-center gap-1 text-[10px] sm:text-xs overflow-x-auto no-scrollbar" style={{ color: theme.secondaryTextColor }}>
          <Link href={`/${store.slug}`} className="hover:opacity-80 transition-colors shrink-0" style={{ color: theme.textColor }}>
            Boutique
          </Link>
          {product.category && (
            <>
              <ChevronRight className="w-3 h-3 shrink-0 text-text-muted" />
              <Link
                href={`/${store.slug}?category=${encodeURIComponent(product.category)}`}
                className="hover:opacity-80 transition-colors shrink-0"
                style={{ color: theme.textColor }}
              >
                {product.category}
              </Link>
            </>
          )}
          <ChevronRight className="w-3 h-3 shrink-0 text-text-muted" />
          <span className="truncate" style={{ color: theme.textColor }}>{product.name}</span>
        </div>

        {/* MAIN GRID */}
        <div className="max-w-7xl mx-2 lg:mx-8 py-4">
          <div className="grid lg:grid-cols-2 gap-8">

            {/* IMAGE SECTION — remplacé par la galerie */}
            <ProductImageGallery
              images={images}
              productName={product.name}
              primaryColor={theme.primaryColor}
              hasDiscount={hasDiscount}
              discountPct={discountPct}
            />

            {/* INFO SECTION — inchangé */}
            <div className="space-y-5">
              <div className="flex justify-between">
                <h1 className="text-lg font-semibold leading-snug" style={{ color: theme.textColor }}>{product.name}</h1>
                {product.category && (
                  <span
                    className="text-xs px-2 py-1 rounded"
                    style={{ backgroundColor: theme.primaryColor + '20', color: theme.primaryColor }}
                  >
                    {product.category}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-3xl font-black" style={{ color: theme.primaryColor }}>
                  {formatPrice(product.price)} DJF
                </span>
                {hasDiscount && (
                  <span className="text-sm line-through" style={{ color: theme.secondaryTextColor }}>
                    {formatPrice(product.list_price)} DJF
                  </span>
                )}
              </div>

              {product.description && (
                <div className="pt-3 border-t border-white/5 w-[90vw]">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap break-words" style={{ color: theme.textColor }}>
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
                <div className="flex items-center gap-2 text-[10px] mt-2" style={{ color: theme.secondaryTextColor }}>
                  <Info className="w-3 h-3" />
                  Commande envoyée automatiquement sur WhatsApp
                </div>
              </div>
            </div>
          </div>
        </div>

        {relatedProducts.length > 0 && (
          <div className="px-3 sm:px-6 lg:px-8 pt-8 mt-4 border-t border-white/5">
            <h2 className="text-sm sm:text-base font-bold mb-3" style={{ color: theme.textColor }}>
              {product.category ? `Aussi dans ${product.category}` : 'Vous aimerez aussi'}
            </h2>
            <ProductGrid
              products={relatedProducts}
              storeSlug={store.slug}
              storeWhatsapp={store.whatsapp}
              primaryColor={theme.primaryColor}
              textColor={theme.textColor}
              secondaryTextColor={theme.secondaryTextColor}
              cardColor={theme.cardColor}
            />
          </div>
        )}
      </main>

      <footer className="border-t border-white/5 py-5 text-center text-[10px] sm:text-xs select-none" style={{ backgroundColor: theme.pageColor, color: theme.secondaryTextColor }}>
        <p>
          © {new Date().getFullYear()} {store.name} · Propulsé par{' '}
          <Link href="/" className="font-semibold hover:underline" style={{ color: theme.primaryColor }}>
            Rohaty Shop
          </Link>
        </p>
      </footer>
    </div>
  )
}