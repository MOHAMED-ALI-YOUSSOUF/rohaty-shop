// components/storefront/GlobalCatalog.tsx
// Catalogue commun côté client : recherche texte + filtres catégorie en mémoire
// Réutilise ProductCard tel quel — chaque carte a son propre storeSlug
// Aucun appel Supabase supplémentaire : filtrage instantané en mémoire
'use client'

import { useState, useMemo } from 'react'
import { ProductCard } from './ProductCard'
import { Search, X } from 'lucide-react'

interface GlobalProduct {
  id: string
  name: string
  slug: string
  description: string | null
  price: number
  list_price: number
  image_url: string | null
  category: string | null
  storeSlug: string
  storeName: string
  storeWhatsapp: string
  storePrimaryColor: string
  whatsappUrl: string
}

interface GlobalCatalogProps {
  products: GlobalProduct[]
}

const PRIMARY = '#2563EB'
const CARD_COLOR = '#1E293B'
const TEXT_COLOR = '#FFFFFF'
const SECONDARY_TEXT = '#94A3B8'

export function GlobalCatalog({ products }: GlobalCatalogProps) {
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('')

  // ─── Catégories uniques extraites de tous les produits ────────────────────
  const allCategories = useMemo(
    () =>
      Array.from(
        new Set(
          products
            .map((p) => p.category?.trim())
            .filter((c): c is string => !!c)
        )
      ).sort(),
    [products]
  )

  // ─── Filtrage combiné : catégorie + recherche ─────────────────────────────
  const filtered = useMemo(() => {
    let result = products

    if (activeCategory) {
      result = result.filter(
        (p) => p.category?.toLowerCase() === activeCategory.toLowerCase()
      )
    }

    const q = search.trim().toLowerCase()
    if (q) {
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.storeName.toLowerCase().includes(q) ||
          p.category?.toLowerCase().includes(q)
      )
    }

    return result
  }, [products, activeCategory, search])

  return (
    <>
      {/* ── Barre de recherche ─────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-3">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#475569] pointer-events-none"
          />
          <input
            id="catalog-search"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un produit, une boutique…"
            className="w-full pl-9 pr-9 py-2.5 rounded-lg bg-[#1E293B] border border-white/5 text-sm text-white placeholder:text-[#475569] focus:outline-none focus:border-[#2563EB]/50 focus:ring-1 focus:ring-[#2563EB]/30 transition"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#475569] hover:text-white transition"
              aria-label="Effacer la recherche"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* ── Filtres catégorie sticky ───────────────────────────────────────── */}
      {allCategories.length > 0 && (
        <div className="sticky top-0 z-50 backdrop-blur-xl border-b border-white/5 bg-[#0F172A]/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
            <div className="flex gap-2 overflow-x-auto scroll-smooth snap-x scrollbar-hide touch-pan-x">
              {/* Bouton "Tous" */}
              <button
                id="filter-all"
                onClick={() => setActiveCategory('')}
                className="px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap snap-start transition-all duration-200 shrink-0"
                style={
                  !activeCategory
                    ? { backgroundColor: PRIMARY, color: '#fff', boxShadow: `0 4px 12px ${PRIMARY}40` }
                    : { backgroundColor: CARD_COLOR, color: TEXT_COLOR, border: `1px solid ${PRIMARY}20` }
                }
              >
                Tous
              </button>

              {allCategories.map((cat) => {
                const isActive = activeCategory.toLowerCase() === cat.toLowerCase()
                return (
                  <button
                    key={cat}
                    id={`filter-${cat.toLowerCase().replace(/\s+/g, '-')}`}
                    onClick={() => setActiveCategory(isActive ? '' : cat)}
                    className="px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap snap-start transition-all duration-200 shrink-0"
                    style={
                      isActive
                        ? { backgroundColor: PRIMARY, color: '#fff', boxShadow: `0 4px 12px ${PRIMARY}40` }
                        : { backgroundColor: CARD_COLOR, color: TEXT_COLOR, border: `1px solid ${PRIMARY}20` }
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

      {/* ── Grille de produits ────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {filtered.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3">
            {filtered.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                whatsappUrl={product.whatsappUrl}
                primaryColor={product.storePrimaryColor}
                storeSlug={product.storeSlug}
                textColor={TEXT_COLOR}
                secondaryTextColor={SECONDARY_TEXT}
                cardColor={CARD_COLOR}
              />
            ))}
          </div>
        ) : (
          <div className="glass rounded-2xl p-12 text-center max-w-md mx-auto border border-white/5 mt-10">
            <div className="text-4xl mb-4 select-none">🔍</div>
            <h2 className="text-lg font-bold text-white font-heading">
              Aucun produit trouvé
            </h2>
            <p className="text-[#94A3B8] text-xs mt-2 leading-relaxed">
              {search
                ? `Aucun résultat pour « ${search} ». Essayez d'autres termes.`
                : activeCategory
                  ? `Aucun produit dans la catégorie « ${activeCategory} ».`
                  : 'Aucun produit disponible pour le moment.'}
            </p>
            {(search || activeCategory) && (
              <button
                onClick={() => { setSearch(''); setActiveCategory('') }}
                className="mt-5 inline-flex text-xs font-semibold px-4 py-2 rounded-lg text-white hover:opacity-90 transition cursor-pointer"
                style={{ backgroundColor: PRIMARY }}
              >
                Voir tous les produits
              </button>
            )}
          </div>
        )}
      </div>
    </>
  )
}
