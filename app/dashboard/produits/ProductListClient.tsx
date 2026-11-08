'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
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
  ChevronLeft,
  ChevronRight,
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

const PAGE_SIZE = 10

export function ProductListClient({ initialProducts }: ProductListClientProps) {
  const router = useRouter()
  const supabase = createClient()

  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'published' | 'draft'>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [deleteProduct, setDeleteProduct] = useState<Product | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [reorderError, setReorderError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [movingId, setMovingId] = useState<string | null>(null)

  // Liste des catégories distinctes présentes dans les produits
  const categories = useMemo(() => {
    const set = new Set<string>()
    products.forEach((p) => {
      if (p.category) set.add(p.category)
    })
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [products])

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.category && p.category.toLowerCase().includes(search.toLowerCase()))
    const matchesStatus =
      filter === 'published' ? p.is_published : filter === 'draft' ? !p.is_published : true
    const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter
    return matchesSearch && matchesStatus && matchesCategory
  })

  const countAll = products.length
  const countPublished = products.filter((p) => p.is_published).length
  const countDraft = products.filter((p) => !p.is_published).length

  const isSearchActive = search !== '' || filter !== 'all' || categoryFilter !== 'all'

  // ─── Pagination ──────────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE))

  useEffect(() => {
    setCurrentPage(1)
  }, [search, filter, categoryFilter])

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages)
  }, [totalPages, currentPage])

  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  )

  const goToPage = (page: number) => {
    setCurrentPage(Math.min(Math.max(page, 1), totalPages))
  }

  // ─── Reorder logic ───────────────────────────────────────────────
  const canReorder = !isSearchActive && totalPages === 1

  const persistOrder = async (newProducts: Product[]) => {
    const ids = newProducts.map((p) => p.id)
    const res = await fetch('/api/products/reorder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data.error || 'Erreur lors de la sauvegarde de l\'ordre')
    }
  }

  const moveProduct = (id: string, direction: 'up' | 'down') => {
    if (!canReorder) return
    const index = products.findIndex((p) => p.id === id)
    if (index === -1) return
    if (direction === 'up' && index === 0) return
    if (direction === 'down' && index === products.length - 1) return

    const targetIndex = direction === 'up' ? index - 1 : index + 1
    const next = [...products]
    const [moved] = next.splice(index, 1)
    next.splice(targetIndex, 0, moved)

    const previous = products
    setProducts(next)
    setMovingId(id)
    setReorderError(null)

    startTransition(async () => {
      try {
        await persistOrder(next)
      } catch (err: any) {
        console.error('Reorder error:', err)
        setProducts(previous)
        setReorderError(err.message || 'Impossible de réordonner les produits')
      } finally {
        setMovingId(null)
      }
    })
  }

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

  return (
    <div className="space-y-4 font-sans">
      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher un produit..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] outline-hidden transition text-sm shadow-2xs"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-3 shrink-0">
          {/* Filtre catégorie */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-800 text-xs font-semibold outline-hidden focus:border-[#2563EB] cursor-pointer shadow-2xs"
          >
            <option value="all">Toutes catégories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {/* Filtre statut */}
          <div className="flex bg-slate-100 border border-slate-200 p-1 rounded-xl self-start shrink-0">
            {([
              { key: 'all', label: 'Tous', count: countAll },
              { key: 'published', label: 'Publiés', count: countPublished },
              { key: 'draft', label: 'Brouillons', count: countDraft },
            ] as const).map(({ key, label, count }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  filter === key
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {label} ({count})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Reorder hint */}
      {canReorder && products.length > 1 && (
        <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-50 border border-blue-100 text-xs text-[#2563EB]">
          <GripVertical className="w-3.5 h-3.5 shrink-0" />
          <span>Utilisez les flèches <strong>↑ ↓</strong> pour changer l&apos;ordre d&apos;affichage sur votre boutique.</span>
        </div>
      )}

      {!canReorder && (
        <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-600">
          <GripVertical className="w-3.5 h-3.5 shrink-0" />
          <span>Effacez la recherche ou les filtres pour réorganiser l&apos;ordre des produits.</span>
        </div>
      )}

      {/* Reorder error */}
      {reorderError && (
        <p className="text-xs text-red-600 px-3.5 py-2 rounded-xl bg-red-50 border border-red-200">
          {reorderError}
        </p>
      )}

      {/* Table */}
      {paginatedProducts.length > 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
          <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-320px)]">
            <table className="w-full text-sm text-left min-w-[640px]">
              <thead className="text-xs uppercase bg-slate-50 text-slate-500 font-bold border-b border-slate-200 sticky top-0 z-10">
                <tr>
                  <th className="px-3 py-3 w-16 text-center">Ordre</th>
                  <th className="px-4 py-3">Produit</th>
                  <th className="px-4 py-3">Catégorie</th>
                  <th className="px-4 py-3">Prix</th>
                  <th className="px-4 py-3">Statut</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {paginatedProducts.map((product, idxOnPage) => {
                  const isFirst = idxOnPage === 0
                  const isLast = idxOnPage === paginatedProducts.length - 1
                  const isMoving = movingId === product.id
                  const globalIdx = (currentPage - 1) * PAGE_SIZE + idxOnPage

                  return (
                    <tr
                      key={product.id}
                      className={`transition-colors ${
                        isMoving ? 'bg-blue-50/50' : 'hover:bg-slate-50/80'
                      }`}
                    >
                      {/* Reorder column */}
                      <td className="px-3 py-3">
                        <div className="flex flex-col items-center gap-0.5">
                          <button
                            onClick={() => moveProduct(product.id, 'up')}
                            disabled={isFirst || isPending || !canReorder}
                            title="Monter"
                            className={`p-1 rounded transition-all ${
                              isFirst || !canReorder
                                ? 'text-slate-300 cursor-not-allowed'
                                : 'text-slate-500 hover:text-[#2563EB] hover:bg-blue-50'
                            }`}
                          >
                            <ChevronUp className="w-4 h-4" />
                          </button>
                          <span className="text-[10px] text-slate-400 font-mono leading-none font-bold">
                            {globalIdx + 1}
                          </span>
                          <button
                            onClick={() => moveProduct(product.id, 'down')}
                            disabled={isLast || isPending || !canReorder}
                            title="Descendre"
                            className={`p-1 rounded transition-all ${
                              isLast || !canReorder
                                ? 'text-slate-300 cursor-not-allowed'
                                : 'text-slate-500 hover:text-[#2563EB] hover:bg-blue-50'
                            }`}
                          >
                            <ChevronDown className="w-4 h-4" />
                          </button>
                        </div>
                      </td>

                      {/* Produit */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                            {product.image_url ? (
                              <Image
                                src={product.image_url}
                                alt={product.name}
                                width={40}
                                height={40}
                                className="object-cover w-full h-full"
                              />
                            ) : (
                              <ShoppingBag className="w-4 h-4 text-slate-400" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-slate-900 font-bold truncate max-w-[180px]">
                              {product.name}
                            </p>
                            {product.description && (
                              <p className="text-[11px] text-slate-500 truncate max-w-[180px]">
                                {product.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Catégorie */}
                      <td className="px-4 py-3 text-slate-600 text-xs whitespace-nowrap">
                        {product.category ? (
                          <span className="px-2.5 py-1 rounded-md bg-slate-100 font-medium text-slate-700">
                            {product.category}
                          </span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>

                      {/* Prix */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex flex-col">
                          {product.list_price > product.price && (
                            <span className="text-[10px] text-slate-400 line-through">
                              {product.list_price.toLocaleString('fr-FR')} DJF
                            </span>
                          )}
                          <span className="text-slate-900 font-bold text-sm">
                            {product.price.toLocaleString('fr-FR')} DJF
                          </span>
                        </div>
                      </td>

                      {/* Statut */}
                      <td className="px-4 py-3">
                        <span
                          className={`text-[11px] px-2.5 py-1 rounded-full font-bold whitespace-nowrap ${
                            product.is_published
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {product.is_published ? '● Publié' : '○ Brouillon'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1.5">
                          <Link
                            href={`/dashboard/produits/${product.id}`}
                            className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-[#2563EB] transition-colors"
                            title="Modifier"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Link>
                          <button
                            onClick={() => {
                              setDeleteError(null)
                              setDeleteProduct(product)
                            }}
                            className="p-2 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
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

          {/* Footer count + pagination */}
          <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-xs text-slate-500 font-medium">
              {filteredProducts.length} produit{filteredProducts.length > 1 ? 's' : ''}
              {search && ` pour "${search}"`}
              {categoryFilter !== 'all' && ` · ${categoryFilter}`}
            </p>

            <div className="flex items-center gap-3">
              {isPending && (
                <span className="flex items-center gap-1 text-xs text-[#2563EB]">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Sauvegarde de l&apos;ordre...
                </span>
              )}

              {totalPages > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    title="Page précédente"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <span className="text-xs text-slate-600 px-2 font-mono">
                    Page {currentPage} / {totalPages}
                  </span>

                  <button
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    title="Page suivante"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <GlassCard className="p-12 text-center flex flex-col items-center justify-center space-y-4 max-w-xl mx-auto border border-slate-200 bg-white">
          <div className="p-4 rounded-full bg-blue-50 text-[#2563EB]">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900 font-heading">Aucun produit trouvé</h3>
            <p className="text-xs text-slate-500 max-w-sm">
              {search || categoryFilter !== 'all'
                ? 'Aucun résultat pour votre recherche ou filtre.'
                : 'Ajoutez votre premier produit pour remplir votre vitrine.'}
            </p>
          </div>
          {!search && categoryFilter === 'all' && (
            <Link
              href="/dashboard/produits/nouveau"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-bold bg-[#2563EB] hover:bg-[#1D4ED8] text-white transition shadow-xs mt-2"
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
          <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md p-6 rounded-2xl bg-white border border-slate-200 text-slate-900 shadow-2xl z-50 space-y-4 focus:outline-hidden">
            <div className="flex items-center gap-3 text-red-600">
              <span className="p-2.5 rounded-xl bg-red-50 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </span>
              <div>
                <Dialog.Title className="text-base font-bold text-slate-900">
                  Supprimer le produit ?
                </Dialog.Title>
                <Dialog.Description className="text-xs text-slate-500 mt-0.5">
                  Cette action est irréversible.
                </Dialog.Description>
              </div>
            </div>

            <p className="text-sm text-slate-600 leading-relaxed">
              Voulez-vous supprimer définitivement{' '}
              <span className="text-slate-900 font-bold">&quot;{deleteProduct?.name}&quot;</span> ?
            </p>

            {deleteError && (
              <p className="text-xs text-red-600 p-3 rounded-lg bg-red-50 border border-red-200">
                {deleteError}
              </p>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <Dialog.Close asChild>
                <button
                  disabled={isDeleting}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                >
                  Annuler
                </button>
              </Dialog.Close>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 rounded-lg text-xs font-bold bg-red-600 hover:bg-red-700 text-white transition flex items-center gap-1.5"
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
