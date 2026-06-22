// app/[slug]/page.tsx
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { StoreHeader } from '@/components/storefront/StoreHeader'
import { ProductCard } from '@/components/storefront/ProductCard'
import { buildWhatsAppUrl } from '@/lib/whatsapp'

interface StorefrontPageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ category?: string }>
}

import type { Metadata } from "next";
import { cn } from '@/lib/utils'

interface MetadataProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: MetadataProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: store } = await supabase
    .from("stores")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (!store) {
    return {
      title: "Boutique introuvable",
    };
  }

  const image =
    store.cover_image ||
    store.logo_url ||
    "https://shop.rohaty.com/logo.png";

  return {
    title: `${store.name} | Rohaty Shop`,
    description:
      store.description ||
      `Découvrez les produits de ${store.name}`,

    openGraph: {
      title: store.name,
      description:
        store.description ||
        `Découvrez les produits de ${store.name}`,
      url: `https://shop.rohaty.com/${store.slug}`,
      siteName: "Rohaty Shop",
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: store.name,
        },
      ],
      locale: "fr_FR",
      type: "website",
    },

    twitter: {
      card: "summary_large_image",
      title: store.name,
      description:
        store.description ||
        `Découvrez les produits de ${store.name}`,
      images: [image],
    },
  };
}



export default async function StorefrontPage({ params, searchParams }: StorefrontPageProps) {
  const { slug } = await params
  const { category } = await searchParams
  const supabase = await createClient()

  // 1. Récupérer la boutique par son slug
  const { data: store } = await supabase
    .from('stores')
    .select('*')
    .eq('slug', slug)
    .maybeSingle()

  if (!store) {
    notFound()
  }

  // 2. Récupérer tous les produits publiés de la boutique
  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('store_id', store.id)
    .eq('is_published', true)
    .order('created_at', { ascending: false })

  // 3. Extraire la liste unique des catégories
  const allCategories = Array.from(
    new Set(
      (products || [])
        .map((p) => p.category?.trim())
        .filter((c): c is string => !!c)
    )
  )

  const activeCategory = category || ''

  // 4. Filtrer les produits par catégorie si spécifiée
  const filteredProducts = activeCategory
    ? (products || []).filter(
      (p) => p.category?.toLowerCase() === activeCategory.toLowerCase()
    )
    : (products || [])

  const primaryColor = store.primary_color || '#2563EB'

  return (
    <div
      style={{
        '--primary': primaryColor,
      } as React.CSSProperties}
      className="min-h-screen bg-bg-base text-white flex flex-col font-sans"
    >
      {/* Sticky Navigation & Header */}
      <StoreHeader
        store={store}
      />
      {/* Barre catégories — sticky indépendante */}
      {allCategories.length > 0 && (
        <div className="sticky top-0 z-50 bg-bg-base/80 backdrop-blur-xl border-b border-white/5">
          <div className="px-3 py-2">
            <div className="flex gap-2 overflow-x-auto no-scrollbar scroll-smooth snap-x">

              <Link
                href={`/${store.slug}`}
                className={cn(
                  'px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap snap-start',
                  !activeCategory ? 'text-white' : 'bg-white/5 text-gray-300'
                )}
                style={!activeCategory ? { backgroundColor: primaryColor } : undefined}
              >
                Tous
              </Link>

              {allCategories.map((cat) => {
                const isActive = activeCategory?.toLowerCase() === cat.toLowerCase()
                return (
                  <Link
                    key={cat}
                    href={`/${store.slug}?category=${encodeURIComponent(cat)}`}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap snap-start',
                      isActive ? 'text-white' : 'bg-white/5 text-gray-300'
                    )}
                    style={isActive ? { backgroundColor: primaryColor } : undefined}
                  >
                    {cat}
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      )}




      {/* Catalog Grid Section */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 flex-1 w-full">
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3">
            {filteredProducts.map((product) => {
              const whatsappUrl = buildWhatsAppUrl(product.name, product.price, store.whatsapp)
              return (
                <ProductCard
                  key={product.id}
                  product={product}
                  whatsappUrl={whatsappUrl}
                  primaryColor={primaryColor}
                  storeSlug={store.slug}
                />
              )
            })}
          </div>
        ) : (
          <div className="glass rounded-2xl p-12 text-center max-w-md mx-auto border border-white/5 mt-10">
            <div className="text-4xl mb-4 select-none">🚀</div>
            <h3 className="text-lg font-bold text-white font-heading">
              {activeCategory
                ? 'Aucun produit dans cette catégorie'
                : 'Boutique en cours de préparation'}
            </h3>
            <p className="text-text-secondary text-xs mt-2 leading-relaxed">
              {activeCategory
                ? "Le commerçant n'a pas encore publié de produits dans cette catégorie."
                : "Le commerçant n'a pas encore publié de produits pour le moment. Revenez bientôt !"}
            </p>
            {activeCategory && (
              <Link
                href={`/${store.slug}`}
                className="mt-5 inline-flex text-xs font-semibold px-4 py-2 rounded-lg text-white hover:opacity-90 transition cursor-pointer"
                style={{ backgroundColor: primaryColor }}
              >
                Voir tous les produits
              </Link>
            )}
          </div>
        )}
      </main>

      {/* Storefront Footer */}
      <footer className="border-t border-white/5 bg-bg-muted/30 py-6 text-center text-xs text-text-secondary select-none">
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
