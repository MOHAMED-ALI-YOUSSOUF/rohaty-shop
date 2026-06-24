'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { GlassCard } from '@/components/shared/GlassCard'
import {
  Edit2,
  Trash2,
  Search,
  AlertTriangle,
  Loader2,
  ShoppingBag,
  Plus,
  ChevronUp,
  ChevronDown,
  GripVertical,
} from 'lucide-react'
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
  sort_order?: number
}

interface ProductListClientProps {
  initialProducts: Product[]
}

export function ProductListClient({ initialProducts }: ProductListClientProps) {
  const router = useRouter()
  const supabase = createClient()

  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'published' | 'draft'>('all')
  const [deleteProduct, setDeleteProduct] = useState<Product | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [reorderError, setReorderError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [movingId, setMovingId] = useState<string | null>(null)

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.category && p.category.toLowerCase().includes(search.toLowerCase()))
    if (filter === 'published') return matchesSearch && p.is_published
    if (filter === 'draft') return matchesSearch && !p.is_published
    return matchesSearch
  })

  const countAll = products.length
  const countPublished = products.filter((p) => p.is_published).length
  const countDraft = products.filter((p) => !p.is_published).length

  // ─── Reorder logic ───────────────────────────────────────────────
  const persistOrder = async (newProducts: Product[]) => {
    const ids = newProducts.map((p) => p.id)
    const res = await fetch('/api/products/reorder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    })
    if (!res.ok) {
      const data = await res.json()
      setReorderError(data.error || 'Erreur lors de la sauvegarde de l\'ordre.')
    } else {
      setReorderError(null)
    }
  }

  const moveProduct = (productId: string, direction: 'up' | 'down') => {
    // If a search/filter is active, we reorder within the full list based on visible positions
    const visibleIds = filteredProducts.map((p) => p.id)
    const currentVisibleIdx = visibleIds.indexOf(productId)

    if (direction === 'up' && currentVisibleIdx === 0) return
    if (direction === 'down' && currentVisibleIdx === visibleIds.length - 1) return

    const swapWithId =
      direction === 'up'
        ? visibleIds[currentVisibleIdx - 1]
        : visibleIds[currentVisibleIdx + 1]

    setMovingId(productId)

    // Swap in the full products array
    const newProducts = [...products]
    const idxA = newProducts.findIndex((p) => p.id === productId)
    const idxB = newProducts.findIndex((p) => p.id === swapWithId)

    if (idxA === -1 || idxB === -1) return

    ;[newProducts[idxA], newProducts[idxB]] = [newProducts[idxB], newProducts[idxA]]

    setProducts(newProducts)

    startTransition(async () => {
      await persistOrder(newProducts)
      setMovingId(null)
    })
  }

  // ─── Delete logic ─────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteProduct) return
    setIsDeleting(true)
    setDeleteError(null)

    try {
      await supabase.from('product_images').delete().eq('product_id', deleteProduct.id)

      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', deleteProduct.id)
        .eq('store_id', deleteProduct.store_id)

      if (error) throw error

      setProducts((prev) => prev.filter((p) => p.id !== deleteProduct.id))
      setDeleteProduct(null)
      router.refresh()
    } catch (err: any) {
      console.error(err)
      setDeleteError(err.message || 'Impossible de supprimer le produit.')
    } finally {
      setIsDeleting(false)
    }
  }

  const isSearchActive = search !== '' || filter !== 'all'

  return (
    <div className="space-y-4">
      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch">
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

        <div className="flex bg-bg-input/60 border border-white/5 p-1 rounded-lg self-start shrink-0">
          {([
            { key: 'all', label: 'Tous', count: countAll },
            { key: 'published', label: 'Publiés', count: countPublished },
            { key: 'draft', label: 'Brouillons', count: countDraft },
          ] as const).map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                filter === key
                  ? key === 'published'
                    ? 'bg-green-500/80 text-white'
                    : key === 'draft'
                    ? 'bg-white/10 text-white'
                    : 'bg-primary text-white'
                  : 'text-text-secondary hover:text-white'
              }`}
            >
              {label} ({count})
            </button>
          ))}
        </div>
      </div>

      {/* Reorder hint */}
      {!isSearchActive && products.length > 1 && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/5 border border-primary/10 text-xs text-primary/80">
          <GripVertical className="w-3.5 h-3.5 shrink-0" />
          <span>Utilisez les flèches <strong>↑ ↓</strong> pour changer l'ordre d'affichage sur votre boutique.</span>
        </div>
      )}

      {isSearchActive && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/5 text-xs text-text-secondary">
          <GripVertical className="w-3.5 h-3.5 shrink-0" />
          <span>Effacez la recherche / le filtre pour réorganiser les produits.</span>
        </div>
      )}

      {/* Reorder error */}
      {reorderError && (
        <p className="text-xs text-red-400 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20">
          {reorderError}
        </p>
      )}

      {/* Table */}
      {filteredProducts.length > 0 ? (
        <div className="rounded-xl border border-white/5 bg-bg-surface overflow-hidden">
          <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-320px)]">
            <table className="w-full text-sm text-left min-w-[640px]">
              {/* Header sticky */}
              <thead className="text-xs uppercase bg-bg-surface text-text-secondary sticky top-0 z-10 shadow-[0_1px_0_rgba(255,255,255,0.05)]">
                <tr>
                  <th className="px-3 py-3 font-semibold w-16 text-center">Ordre</th>
                  <th className="px-4 py-3 font-semibold">Produit</th>
                  <th className="px-4 py-3 font-semibold">Catégorie</th>
                  <th className="px-4 py-3 font-semibold">Prix</th>
                  <th className="px-4 py-3 font-semibold">Statut</th>
                  <th className="px-4 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/5">
                {filteredProducts.map((product, visibleIdx) => {
                  const isFirst = visibleIdx === 0
                  const isLast = visibleIdx === filteredProducts.length - 1
                  const isMoving = movingId === product.id

                  return (
                    <tr
                      key={product.id}
                      className={`transition-colors ${
                        isMoving
                          ? 'bg-primary/5'
                          : 'hover:bg-white/[0.03]'
                      }`}
                    >
                      {/* Reorder column */}
                      <td className="px-3 py-3">
                        <div className="flex flex-col items-center gap-0.5">
                          <button
                            onClick={() => moveProduct(product.id, 'up')}
                            disabled={isFirst || isPending || isSearchActive}
                            title="Monter"
                            className={`p-1 rounded transition-all ${
                              isFirst || isSearchActive
                                ? 'text-white/10 cursor-not-allowed'
                                : 'text-text-secondary hover:text-primary hover:bg-primary/10'
                            }`}
                          >
                            <ChevronUp className="w-4 h-4" />
                          </button>
                          <span className="text-[10px] text-white/20 font-mono leading-none">
                            {visibleIdx + 1}
                          </span>
                          <button
                            onClick={() => moveProduct(product.id, 'down')}
                            disabled={isLast || isPending || isSearchActive}
                            title="Descendre"
                            className={`p-1 rounded transition-all ${
                              isLast || isSearchActive
                                ? 'text-white/10 cursor-not-allowed'
                                : 'text-text-secondary hover:text-primary hover:bg-primary/10'
                            }`}
                          >
                            <ChevronDown className="w-4 h-4" />
                          </button>
                        </div>
                      </td>

                      {/* Produit */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-white/5 flex items-center justify-center shrink-0">
                            {product.image_url ? (
                              <Image
                                src={product.image_url}
                                alt={product.name}
                                width={40}
                                height={40}
                                className="object-cover w-full h-full"
                              />
                            ) : (
                              <ShoppingBag className="w-4 h-4 text-text-secondary" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-white font-medium truncate max-w-[180px]">
                              {product.name}
                            </p>
                            {product.description && (
                              <p className="text-[11px] text-text-secondary truncate max-w-[180px]">
                                {product.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Catégorie */}
                      <td className="px-4 py-3 text-text-secondary text-xs whitespace-nowrap">
                        {product.category ? (
                          <span className="px-2 py-0.5 rounded bg-white/5 text-text-secondary">
                            {product.category}
                          </span>
                        ) : (
                          <span className="text-white/20">—</span>
                        )}
                      </td>

                      {/* Prix */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex flex-col">
                          {product.list_price > product.price && (
                            <span className="text-[10px] text-text-muted line-through">
                              {product.list_price.toLocaleString('fr-FR')} DJF
                            </span>
                          )}
                          <span className="text-white font-bold text-sm">
                            {product.price.toLocaleString('fr-FR')} DJF
                          </span>
                        </div>
                      </td>

                      {/* Statut */}
                      <td className="px-4 py-3">
                        <span
                          className={`text-[10px] px-2 py-1 rounded-md font-semibold whitespace-nowrap ${
                            product.is_published
                              ? 'bg-green-500/10 text-green-400'
                              : 'bg-white/5 text-text-secondary'
                          }`}
                        >
                          {product.is_published ? '● Publié' : '○ Brouillon'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <Link
                            href={`/dashboard/produits/${product.id}`}
                            className="p-2 rounded-lg bg-white/5 hover:bg-primary/10 hover:text-primary text-text-secondary transition-colors"
                            title="Modifier"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Link>
                          <button
                            onClick={() => {
                              setDeleteError(null)
                              setDeleteProduct(product)
                            }}
                            className="p-2 rounded-lg bg-white/5 hover:bg-red-500/10 hover:text-red-400 text-text-secondary transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Footer count */}
          <div className="px-4 py-2.5 border-t border-white/5 bg-white/[0.02] flex items-center justify-between">
            <p className="text-[11px] text-text-muted">
              {filteredProducts.length} produit{filteredProducts.length > 1 ? 's' : ''}
              {search && ` pour "${search}"`}
            </p>
            {isPending && (
              <span className="flex items-center gap-1 text-[11px] text-primary/70">
                <Loader2 className="w-3 h-3 animate-spin" />
                Sauvegarde de l'ordre...
              </span>
            )}
          </div>
        </div>
      ) : (
        <GlassCard className="p-12 text-center flex flex-col items-center justify-center space-y-4 max-w-xl mx-auto border border-white/5">
          <div className="p-4 rounded-full bg-primary/10 text-primary">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white font-heading">Aucun produit trouvé</h3>
            <p className="text-sm text-text-secondary max-w-sm">
              {search
                ? 'Aucun résultat pour votre recherche.'
                : 'Ajoutez votre premier produit pour remplir votre vitrine.'}
            </p>
          </div>
          {!search && (
            <Link
              href="/dashboard/produits/nouveau"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-semibold bg-primary hover:bg-primary/95 text-white transition-all mt-2"
            >
              <Plus className="w-3.5 h-3.5" />
              Ajouter mon premier produit
            </Link>
          )}
        </GlassCard>
      )}

      {/* Dialog suppression */}
      <Dialog.Root
        open={!!deleteProduct}
        onOpenChange={(open) => { if (!open) setDeleteProduct(null) }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md p-6 rounded-2xl bg-bg-surface border border-white/10 text-white shadow-2xl z-50 space-y-4 focus:outline-none">
            <div className="flex items-center gap-3 text-red-400">
              <span className="p-2.5 rounded-lg bg-red-500/10 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </span>
              <div>
                <Dialog.Title className="text-base font-bold">
                  Supprimer le produit ?
                </Dialog.Title>
                <Dialog.Description className="text-xs text-text-secondary mt-0.5">
                  Cette action est irréversible.
                </Dialog.Description>
              </div>
            </div>

            <p className="text-sm text-text-secondary leading-relaxed">
              Voulez-vous supprimer définitivement{' '}
              <span className="text-white font-semibold">"{deleteProduct?.name}"</span> ?
            </p>

            {deleteError && (
              <p className="text-xs text-red-400 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                {deleteError}
              </p>
            )}

            <div className="flex justify-end gap-3 pt-1">
              <Dialog.Close asChild>
                <button
                  disabled={isDeleting}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-all"
                >
                  Annuler
                </button>
              </Dialog.Close>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-red-500 hover:bg-red-600 text-white transition-all flex items-center gap-1.5"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Suppression...
                  </>
                ) : (
                  'Supprimer'
                )}
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  )
}