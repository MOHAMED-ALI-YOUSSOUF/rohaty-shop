// app/dashboard/produits/ProductListClient.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { GlassCard } from '@/components/shared/GlassCard'
import { Edit2, Trash2, Search, SlidersHorizontal, AlertTriangle, Loader2, ShoppingBag } from 'lucide-react'
import * as Dialog from '@radix-ui/react-dialog'

interface Product {
  id: string
  store_id: string
  name: string
  slug: string
  description: string | null
  price: number
  list_price: number
  image_url: string | null
  category: string | null
  is_published: boolean
  created_at: string
}

interface ProductListClientProps {
  initialProducts: Product[]
}

export function ProductListClient({ initialProducts }: ProductListClientProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'published' | 'draft'>('all')

  // State pour la boîte de dialogue de suppression
  const [deleteProduct, setDeleteProduct] = useState<Product | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const supabase = createClient()

  // Actions de filtrage
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.category && p.category.toLowerCase().includes(search.toLowerCase()))

    if (filter === 'published') return matchesSearch && p.is_published
    if (filter === 'draft') return matchesSearch && !p.is_published
    return matchesSearch
  })

  // Comptes pour les onglets
  const countAll = products.length
  const countPublished = products.filter((p) => p.is_published).length
  const countDraft = products.filter((p) => !p.is_published).length

  // Fonction de suppression de produit
  const handleDelete = async () => {
    if (!deleteProduct) return

    setIsDeleting(true)
    setDeleteError(null)

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', deleteProduct.id)

      if (error) throw error

      // Mettre à jour l'état local
      setProducts(products.filter((p) => p.id !== deleteProduct.id))
      setDeleteProduct(null)
    } catch (err: any) {
      console.error(err)
      setDeleteError(err.message || 'Impossible de supprimer le produit.')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Search and Filter Row */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            placeholder="Rechercher par nom, catégorie..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-bg-input border border-white/10 text-white placeholder-text-muted focus:border-primary/50 focus:shadow-[0_0_0_3px_rgba(37,99,235,0.15)] outline-none transition-all text-sm"
          />
        </div>

        {/* Tab Filters */}
        <div className="flex bg-bg-input/60 border border-white/5 p-1 rounded-lg self-start">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 text-xs font-semibold rounded-md transition-all ${filter === 'all'
                ? 'bg-primary text-white shadow-sm'
                : 'text-text-secondary hover:text-white'
              }`}
          >
            Tous ({countAll})
          </button>
          <button
            onClick={() => setFilter('published')}
            className={`px-4 py-2 text-xs font-semibold rounded-md transition-all ${filter === 'published'
                ? 'bg-success text-white shadow-sm'
                : 'text-text-secondary hover:text-white'
              }`}
          >
            Publiés ({countPublished})
          </button>
          <button
            onClick={() => setFilter('draft')}
            className={`px-4 py-2 text-xs font-semibold rounded-md transition-all ${filter === 'draft'
                ? 'bg-white/10 text-white shadow-sm'
                : 'text-text-secondary hover:text-white'
              }`}
          >
            Brouillons ({countDraft})
          </button>
        </div>
      </div>

      {/* Grid of Products */}
      {/* TABLE VIEW */}
      {filteredProducts.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border border-white/5 bg-bg-surface">
          <table className="w-full text-sm text-left">

            {/* HEADER */}
            <thead className="text-xs uppercase bg-white/5 text-text-secondary">
              <tr>
                <th className="px-4 py-3">Produit</th>
                <th className="px-4 py-3">Catégorie</th>
                <th className="px-4 py-3">Prix</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>

            {/* BODY */}
            <tbody>
              {filteredProducts.map((product) => (
                <tr
                  key={product.id}
                  className="border-t border-white/5 hover:bg-white/5 transition"
                >

                  {/* PRODUCT */}
                  <td className="px-4 py-3 flex items-center gap-3 min-w-[220px]">

                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-white/5 flex items-center justify-center">
                      {product.image_url ? (
                        <Image
                          src={product.image_url}
                          alt={product.name}
                          width={40}
                          height={40}
                          className="object-cover"
                        />
                      ) : (
                        <ShoppingBag className="w-4 h-4 text-text-secondary" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <p className="text-white font-medium truncate">
                        {product.name}
                      </p>
                      <p className="text-[11px] text-text-secondary truncate max-w-[200px]">
                        {product.description}
                      </p>
                    </div>
                  </td>

                  {/* CATEGORY */}
                  <td className="px-4 py-3 text-text-secondary text-xs">
                    {product.category || '-'}
                  </td>

                  {/* PRICE */}
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      {product.list_price > product.price && (
                        <span className="text-[10px] text-text-muted line-through">
                          {product.list_price.toLocaleString()} DJF
                        </span>
                      )}
                      <span className="text-white font-bold">
                        {product.price.toLocaleString()} DJF
                      </span>
                    </div>
                  </td>

                  {/* STATUS */}
                  <td className="px-4 py-3">
                    <span
                      className={`text-[10px] px-2 py-1 rounded-md font-semibold ${product.is_published
                          ? 'bg-green-500/10 text-green-400'
                          : 'bg-white/5 text-text-secondary'
                        }`}
                    >
                      {product.is_published ? 'Publié' : 'Brouillon'}
                    </span>
                  </td>

                  {/* ACTIONS */}
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">

                      {/* EDIT */}
                      <Link
                        href={`/dashboard/produits/${product.id}`}
                        className="p-2 rounded-lg bg-white/5 hover:bg-primary/10 text-text-secondary hover:text-white"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Link>

                      {/* DELETE */}
                      <button
                        onClick={() => setDeleteProduct(product)}
                        className="p-2 rounded-lg bg-white/5 hover:bg-red-500/10 text-text-secondary hover:text-red-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                    </div>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* Empty State */
        <GlassCard className="p-12 text-center flex flex-col items-center justify-center space-y-4 max-w-xl mx-auto border border-white/5">
          <div className="p-4 rounded-full bg-primary/10 text-primary">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white font-heading">
              Aucun produit trouvé
            </h3>
            <p className="text-sm text-text-secondary max-w-sm">
              {search
                ? "Aucun résultat ne correspond à votre recherche. Essayez d'autres mots clés."
                : "Commencez à remplir votre vitrine en ajoutant votre tout premier produit dès maintenant !"}
            </p>
          </div>
          {!search && (
            <Link
              href="/dashboard/produits/nouveau"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-semibold bg-primary hover:bg-primary/95 text-white transition-all mt-2"
            >
              Ajouter mon premier produit
            </Link>
          )}
        </GlassCard>
      )}
    </div>
  )
}
