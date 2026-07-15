'use client'

// components/storefront/StorefrontCatalog.tsx
// Composant client qui gère le filtrage de catégorie CÔTÉ NAVIGATEUR.
//
// AVANT : chaque clic sur une catégorie déclenchait searchParams → nouveau rendu serveur
// APRÈS : filtrage instantané en mémoire, zéro Serverless Function supplémentaire

import { useState, useMemo } from 'react'
import { ProductCard } from './ProductCard'
import { cn } from '@/lib/utils'

interface Product {
  id: string
  name: string
  slug: string
  description: string | null
  price: number
  list_price: number
  image_url: string | null
  category: string | null
  whatsappUrl: string
}

interface StorefrontCatalogProps {
  products: Product[]
  storeSlug: string
  primaryColor: string
  textColor?: string
  cardColor?: string
}

export function StorefrontCatalog({
  products,
  storeSlug,
  primaryColor,
  textColor,
  cardColor,
}: StorefrontCatalogProps) {
  const [activeCategory, setActiveCategory] = useState('')

  // Extraire les catégories uniques — mémorisé, recalculé seulement si products change
  const allCategories = useMemo(
    () =>
      Array.from(
        new Set(
          products
            .map((p) => p.category?.trim())
            .filter((c): c is string => !!c)
        )
      ),
    [products]
  )

  // Filtrer les produits — mémorisé, recalculé seulement si activeCategory ou products change
  const filteredProducts = useMemo(
    () =>
      activeCategory
        ? products.filter(
          (p) => p.category?.toLowerCase() === activeCategory.toLowerCase()
        )
        : products,
    [products, activeCategory]
  )

  return (
    <>
      {/* Barre catégories sticky */}
      {allCategories.length > 0 && (
        <div
          className="sticky top-0 z-50 backdrop-blur-xl"
          style={{
            borderColor: `${primaryColor}20`,
          }}
        >
          <div className="px-3 py-2">
            <div
              className="flex gap-2 overflow-x-auto scroll-smooth snap-x scrollbar-hide touch-pan-x"
            >
              {/* Toutes les catégories */}
              <button
                onClick={() => setActiveCategory('')}
                className="px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap snap-start transition-all duration-200"
                style={
                  !activeCategory
                    ? {
                      backgroundColor: primaryColor,
                      color: '#FFFFFF',
                      boxShadow: `0 4px 12px ${primaryColor}40`,
                    }
                    : {
                      backgroundColor: cardColor,
                      color: textColor,
                      border: `1px solid ${primaryColor}20`,
                    }
                }
              >
                Tous
              </button>

              {allCategories.map((cat) => {
                const isActive =
                  activeCategory.toLowerCase() === cat.toLowerCase()

                return (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(isActive ? '' : cat)}
                    className="px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap snap-start transition-all duration-200"
                    style={
                      isActive
                        ? {
                          backgroundColor: primaryColor,
                          color: '#FFFFFF',
                          boxShadow: `0 4px 12px ${primaryColor}40`,
                        }
                        : {
                          backgroundColor: cardColor,
                          color: textColor,
                          border: `1px solid ${primaryColor}20`,
                        }
                    }
                  >
                    {cat}
                  </button>
                )
              })}

            </div>
          </div>
        </div>
      )}

      {/* Grille de produits */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 flex-1 w-full">
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                whatsappUrl={product.whatsappUrl}
                primaryColor={primaryColor}
                storeSlug={storeSlug}
                textColor={textColor ?? '#FFFFFF'}
                secondaryTextColor={'#94A3B8'}
                cardColor={cardColor ?? '#1E293B'}
              />
            ))}
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
              <button
                onClick={() => setActiveCategory('')}
                className="mt-5 inline-flex text-xs font-semibold px-4 py-2 rounded-lg text-white hover:opacity-90 transition cursor-pointer"
                style={{ backgroundColor: primaryColor }}
              >
                Voir tous les produits
              </button>
            )}
          </div>
        )}
      </main>
    </>
  )
}
