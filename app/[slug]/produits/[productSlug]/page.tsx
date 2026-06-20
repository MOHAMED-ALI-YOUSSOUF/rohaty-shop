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

interface ProductPageProps {
  params: Promise<{
    slug: string
    productSlug: string
  }>
}

interface MetadataProps {
  params: Promise<{
    slug: string;
    productSlug: string;
  }>;
}

export async function generateMetadata({
  params,
}: MetadataProps): Promise<Metadata> {
  const { slug, productSlug } = await params;

  const supabase = await createClient();

  const { data: store } = await supabase
    .from("stores")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (!store) {
    return {
      title: "Produit introuvable",
    };
  }

  const { data: product } = await supabase
    .from("products")
    .select("*")
    .eq("store_id", store.id)
    .eq("slug", productSlug)
    .eq("is_published", true)
    .maybeSingle();

  if (!product) {
    return {
      title: "Produit introuvable",
    };
  }

  const image =
    product.image_url ||
    store.cover_image ||
    store.logo_url ||
    "https://shop.rohaty.com/logo.png";

  const title = `${product.name} • ${new Intl.NumberFormat(
    "fr-FR"
  ).format(product.price)} DJF`;

  const description =
    product.description ||
    `Découvrez ${product.name} chez ${store.name}`;

  return {
    title,
    description,

    openGraph: {
      title,
      description,
      url: `https://shop.rohaty.com/${slug}/produits/${productSlug}`,
      siteName: "Rohaty Shop",
      images: [
        {
          url: image,
          width: 1200,
          height: 1200,
          alt: product.name,
        },
      ],
      type: "website",
    },

    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}


export default async function PublicProductPage({ params }: ProductPageProps) {
  const { slug, productSlug } = await params
  const supabase = await createClient()

  // 1. Récupérer la boutique
  const { data: store } = await supabase
    .from('stores')
    .select('*')
    .eq('slug', slug)
    .maybeSingle()

  if (!store) {
    notFound()
  }

  // 2. Récupérer le produit publié
  const { data: product } = await supabase
    .from('products')
    .select('*')
    .eq('store_id', store.id)
    .eq('slug', productSlug)
    .eq('is_published', true)
    .maybeSingle()

  if (!product) {
    notFound()
  }

  // 3. Toutes les catégories (pour l'en-tête)
  const { data: storeProducts } = await supabase
    .from('products')
    .select('category')
    .eq('store_id', store.id)
    .eq('is_published', true)

  const allCategories = Array.from(
    new Set(
      (storeProducts || [])
        .map((p) => p.category?.trim())
        .filter((c): c is string => !!c)
    )
  )

  // 4. Produits similaires : même catégorie en priorité, sinon mélange d'autres produits de la boutique
  const { data: sameCategoryProducts } = product.category
    ? await supabase
      .from('products')
      .select('*')
      .eq('store_id', store.id)
      .eq('is_published', true)
      .eq('category', product.category)
      .neq('id', product.id)
      .limit(10)
    : { data: [] }

  let relatedProducts = sameCategoryProducts || []

  // Compléter avec des produits aléatoires de la boutique si pas assez de la même catégorie
  if (relatedProducts.length < 8) {
    const { data: fillerProducts } = await supabase
      .from('products')
      .select('*')
      .eq('store_id', store.id)
      .eq('is_published', true)
      .neq('id', product.id)
      .limit(16)

    const existingIds = new Set(relatedProducts.map((p) => p.id))
    const fillers = (fillerProducts || []).filter((p) => !existingIds.has(p.id))

    relatedProducts = [...relatedProducts, ...fillers].slice(0, 10)
  }

  const primaryColor = store.primary_color || '#2563EB'
  const hasDiscount = product.list_price > product.price
  const discountPct = hasDiscount
    ? Math.round((1 - product.price / product.list_price) * 100)
    : 0
  const whatsappOrderUrl = buildWhatsAppUrl(product.name, product.price, store.whatsapp)

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR').format(price)
  }

  return (
    <div
      style={{ '--primary': primaryColor } as React.CSSProperties}
      className="min-h-screen bg-bg-base text-white flex flex-col font-sans"
    >

      <main className="flex-1 w-full pb-6">
        {/* Fil d'ariane compact */}
        <div className="px-3 sm:px-6 lg:px-8 py-2.5 flex items-center gap-1 text-[10px] sm:text-xs text-text-secondary overflow-x-auto no-scrollbar">
          <Link href={`/${store.slug}`} className="hover:text-white transition-colors shrink-0">
            Boutique
          </Link>
          {product.category && (
            <>
              <ChevronRight className="w-3 h-3 shrink-0 text-text-muted" />
              <Link
                href={`/${store.slug}?category=${encodeURIComponent(product.category)}`}
                className="hover:text-white transition-colors shrink-0"
              >
                {product.category}
              </Link>
            </>
          )}
          <ChevronRight className="w-3 h-3 shrink-0 text-text-muted" />
          <span className="text-white/80 truncate">{product.name}</span>
        </div>


        {/* MAIN GRID TEMU STYLE */}
        <div className="max-w-7xl mx-2 lg:mx-8  py-4">
          <div className="grid lg:grid-cols-2 gap-8">

            {/* IMAGE SECTION */}
            <div className="w-full">
              <div className="relative aspect-square bg-white/5 rounded-xl overflow-hidden">

                {product.image_url ? (
                  <Image
                    src={product.image_url}
                    alt={product.name}
                    fill
                    className="object-cover"
                    priority
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    <ShoppingBag className="w-12 h-12" />
                  </div>
                )}

                {/* Discount */}
                {hasDiscount && (
                  <div
                    className="absolute top-3 left-3 text-white text-xs font-bold px-2 py-1 rounded"
                    style={{ backgroundColor: primaryColor }}
                  >
                    -{discountPct}%
                  </div>
                )}
              </div>
            </div>

            {/* INFO SECTION (FIXED) */}
            <div className="space-y-5">

              <div className='flex justify-between '>


                {/* TITLE */}
                <h1 className="text-lg font-semibold leading-snug">
                  {product.name}
                </h1>

                {/* CATEGORY */}
                {product.category && (
                  <span className="text-xs px-2 py-1 rounded bg-white/10"
                    style={{ backgroundColor: primaryColor + "/20", color: primaryColor }}>
                    {product.category}
                  </span>
                )}
              </div>

              {/* PRICE */}
              <div className="flex items-center gap-3 flex-wrap">
                <span
                  className="text-3xl font-black"
                  style={{ color: primaryColor }}
                >
                  {formatPrice(product.price)} DJF
                </span>

                {hasDiscount && (
                  <span className="text-sm text-gray-400 line-through">
                    {formatPrice(product.list_price)} DJF
                  </span>
                )}
              </div>



              {product.description && (
                <div className="pt-3 border-t border-white/5 w-[90vw]">
                  <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap break-words">
                    {product.description}
                  </p>
                </div>
              )}

              {/* CTA */}
              <div className="pt-4">
                <GradientButton
                  variant="whatsapp"
                  href={whatsappOrderUrl}
                  target="_blank"
                  className="w-full py-3 font-bold"
                >
                  💬 Commander via WhatsApp
                </GradientButton>

                <div className="flex items-center gap-2 text-[10px] text-gray-500 mt-2">
                  <Info className="w-3 h-3" />
                  Commande envoyée automatiquement sur WhatsApp
                </div>
              </div>
            </div>

          </div>
        </div>



        <div className="clear-both" />

        {/* Produits similaires / autres produits — comme Temu en bas de page */}
        {relatedProducts.length > 0 && (
          <div className="px-3 sm:px-6 lg:px-8 pt-8 mt-4 border-t border-white/5">
            <h2 className="text-sm sm:text-base font-bold text-white mb-3">
              {product.category ? `Aussi dans ${product.category}` : 'Vous aimerez aussi'}
            </h2>
            <ProductGrid
              products={relatedProducts}
              storeSlug={store.slug}
              storeWhatsapp={store.whatsapp}
              primaryColor={primaryColor}
            />
          </div>
        )}
      </main>

      <footer className="border-t border-white/5 bg-bg-muted/30 py-5 text-center text-[10px] sm:text-xs text-text-secondary select-none">
        <p>
          © {new Date().getFullYear()} {store.name} · Propulsé par{' '}
          <Link href="/" className="text-primary font-semibold hover:underline">
            Rohaty Shop
          </Link>
        </p>
      </footer>
    </div>
  )
}