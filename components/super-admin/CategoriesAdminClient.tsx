// components/super-admin/CategoriesAdminClient.tsx
'use client'

import { useState } from 'react'
import Image from 'next/image'
import {
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  Image as ImageIcon,
  ArrowUpDown,
  X,
} from 'lucide-react'
import { ImageUpload } from '@/components/shared/ImageUpload'
import { getCategoryVisual } from '@/lib/categories'

export interface CategoryAdminItem {
  id: string
  name: string
  slug: string
  image_url: string | null
  position: number
  is_active: boolean
  product_count: number
}

interface CategoriesAdminClientProps {
  initialCategories: CategoryAdminItem[]
}

export function CategoriesAdminClient({
  initialCategories,
}: CategoriesAdminClientProps) {
  const [categories, setCategories] = useState<CategoryAdminItem[]>(initialCategories)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<CategoryAdminItem | null>(null)
  const [deletingCategory, setDeletingCategory] = useState<CategoryAdminItem | null>(null)

  // Form states
  const [formName, setFormName] = useState('')
  const [formPosition, setFormPosition] = useState<number>(0)
  const [formImageUrl, setFormImageUrl] = useState<string | null>(null)
  const [formIsActive, setFormIsActive] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const reloadCategories = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/categories', { cache: 'no-store' })
      if (!res.ok) throw new Error('Impossible de charger les catégories')
      const data = await res.json()
      setCategories(data)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setIsLoading(false)
    }
  }

  const openAddModal = () => {
    setFormName('')
    const maxPos = categories.reduce((max, c) => Math.max(max, c.position), 0)
    setFormPosition(maxPos + 1)
    setFormImageUrl(null)
    setFormIsActive(true)
    setError(null)
    setIsAddOpen(true)
  }

  const openEditModal = (cat: CategoryAdminItem) => {
    setEditingCategory(cat)
    setFormName(cat.name)
    setFormPosition(cat.position)
    setFormImageUrl(cat.image_url)
    setFormIsActive(cat.is_active)
    setError(null)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formName.trim()) {
      setError('Le nom de la catégorie est requis.')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName.trim(),
          image_url: formImageUrl,
          position: Number(formPosition),
          is_active: formIsActive,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur lors de la création')

      setIsAddOpen(false)
      setSuccess(`Catégorie "${formName}" créée avec succès.`)
      setTimeout(() => setSuccess(null), 4000)
      await reloadCategories()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingCategory) return
    if (!formName.trim()) {
      setError('Le nom de la catégorie est requis.')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/categories', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingCategory.id,
          name: formName.trim(),
          image_url: formImageUrl,
          position: Number(formPosition),
          is_active: formIsActive,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur lors de la mise à jour')

      setEditingCategory(null)
      setSuccess(`Catégorie mise à jour avec succès.`)
      setTimeout(() => setSuccess(null), 4000)
      await reloadCategories()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggleActive = async (cat: CategoryAdminItem) => {
    try {
      const res = await fetch('/api/categories', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: cat.id,
          is_active: !cat.is_active,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Erreur lors du changement de statut')
      }

      setCategories((prev) =>
        prev.map((c) => (c.id === cat.id ? { ...c, is_active: !c.is_active } : c))
      )
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }

  const handleDelete = async () => {
    if (!deletingCategory) return

    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch(`/api/categories?id=${deletingCategory.id}`, {
        method: 'DELETE',
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur lors de la suppression')

      setDeletingCategory(null)
      setSuccess(`Catégorie supprimée.`)
      setTimeout(() => setSuccess(null), 4000)
      await reloadCategories()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* ── Top Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Gestion centralisée des catégories
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Catalogue officiel partagé par l&apos;ensemble des boutiques de la marketplace Rohaty Shop.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold transition shadow-xs self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Ajouter une catégorie
        </button>
      </div>

      {/* ── Alerts ── */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-600 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold">Erreur :</span> {error}
          </div>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
          <span>{success}</span>
        </div>
      )}

      {/* ── Table Card ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            {categories.length} catégorie(s) officielle(s)
          </span>
          {isLoading && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4 w-12 text-center">#</th>
                <th className="py-3 px-4">Illustration</th>
                <th className="py-3 px-4">Nom de la catégorie</th>
                <th className="py-3 px-4">Slug unique</th>
                <th className="py-3 px-4 text-center">Position</th>
                <th className="py-3 px-4 text-center">Statut</th>
                <th className="py-3 px-4 text-center">Produits liés</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {categories.map((cat, index) => {
                const visual = getCategoryVisual(cat.slug)
                return (
                  <tr key={cat.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 text-center text-slate-400 font-mono font-medium">
                      {index + 1}
                    </td>

                    {/* Image / Illustration */}
                    <td className="py-3 px-4">
                      <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center bg-slate-100 border border-slate-200 relative text-lg shrink-0">
                        {cat.image_url ? (
                          <Image
                            src={cat.image_url}
                            alt={cat.name}
                            fill
                            sizes="40px"
                            className="object-cover"
                          />
                        ) : (
                          <span>{visual.emoji}</span>
                        )}
                      </div>
                    </td>

                    {/* Nom */}
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900 text-sm">{cat.name}</span>
                    </td>

                    {/* Slug */}
                    <td className="py-3 px-4">
                      <span className="font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                        {cat.slug}
                      </span>
                    </td>

                    {/* Position */}
                    <td className="py-3 px-4 text-center font-bold text-slate-700">
                      {cat.position}
                    </td>

                    {/* Statut Toggle */}
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleToggleActive(cat)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition ${
                          cat.is_active
                            ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {cat.is_active ? (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Actif
                          </>
                        ) : (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                            Inactif
                          </>
                        )}
                      </button>
                    </td>

                    {/* Nombre de produits */}
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          cat.product_count > 0
                            ? 'bg-blue-50 text-blue-700'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {cat.product_count} produit(s)
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => openEditModal(cat)}
                          className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
                          title="Modifier"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeletingCategory(cat)}
                          className={`p-1.5 rounded-lg transition ${
                            cat.product_count > 0
                              ? 'text-slate-300 cursor-not-allowed'
                              : 'text-red-500 hover:bg-red-50 hover:text-red-700'
                          }`}
                          title={
                            cat.product_count > 0
                              ? 'Impossible de supprimer car des produits utilisent cette catégorie'
                              : 'Supprimer'
                          }
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Modal Ajouter ── */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">
                Ajouter une nouvelle catégorie
              </h2>
              <button
                onClick={() => setIsAddOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nom officiel de la catégorie *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Électronique, Parfums..."
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-900 bg-white focus:outline-hidden focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Ordre d&apos;affichage (Position)
                </label>
                <input
                  type="number"
                  value={formPosition}
                  onChange={(e) => setFormPosition(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-900 bg-white focus:outline-hidden focus:border-[#2563EB]"
                />
              </div>

              {/* Cloudinary Image Upload */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Image officielle (téléchargement Cloudinary)
                </label>
                <p className="text-[11px] text-slate-500 mb-2">
                  Sélectionnez un fichier sur votre appareil, l&apos;image est automatiquement téléversée vers Cloudinary.
                </p>
                <ImageUpload
                  folder="rohaty-shop/categories"
                  currentUrl={formImageUrl}
                  onUpload={(url) => setFormImageUrl(url)}
                  onClear={() => setFormImageUrl(null)}
                  aspectRatio="square"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="cat-active"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                  className="w-4 h-4 rounded text-[#2563EB] border-slate-300 focus:ring-[#2563EB]"
                />
                <label htmlFor="cat-active" className="text-xs font-semibold text-slate-700">
                  Activer immédiatement cette catégorie sur la marketplace
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-bold bg-[#2563EB] hover:bg-[#1D4ED8] text-white disabled:opacity-50"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Créer la catégorie
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal Modifier ── */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">
                Modifier la catégorie : {editingCategory.name}
              </h2>
              <button
                onClick={() => setEditingCategory(null)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nom officiel *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-900 bg-white focus:outline-hidden focus:border-[#2563EB]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Ordre d&apos;affichage (Position)
                </label>
                <input
                  type="number"
                  value={formPosition}
                  onChange={(e) => setFormPosition(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-900 bg-white focus:outline-hidden focus:border-[#2563EB]"
                />
              </div>

              {/* Cloudinary Image Upload */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Image Cloudinary
                </label>
                <ImageUpload
                  folder="rohaty-shop/categories"
                  currentUrl={formImageUrl}
                  onUpload={(url) => setFormImageUrl(url)}
                  onClear={() => setFormImageUrl(null)}
                  aspectRatio="square"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="edit-cat-active"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                  className="w-4 h-4 rounded text-[#2563EB] border-slate-300"
                />
                <label htmlFor="edit-cat-active" className="text-xs font-semibold text-slate-700">
                  Catégorie active
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-bold bg-[#2563EB] hover:bg-[#1D4ED8] text-white disabled:opacity-50"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Enregistrer les modifications
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal Supprimer ── */}
      {deletingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6">
            <h2 className="text-base font-bold text-slate-900">
              Supprimer la catégorie
            </h2>

            {deletingCategory.product_count > 0 ? (
              <div className="mt-3 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs leading-relaxed">
                <p className="font-bold">Suppression impossible :</p>
                <p className="mt-1">
                  Cette catégorie est actuellement utilisée par <strong>{deletingCategory.product_count}</strong> produit(s).
                  Vous devez d&apos;abord réaffecter ces produits à une autre catégorie avant de pouvoir la supprimer.
                </p>
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => setDeletingCategory(null)}
                    className="px-4 py-2 rounded-lg text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200"
                  >
                    Fermer
                  </button>
                </div>
              </div>
            ) : (
              <>
                <p className="text-sm text-slate-600 mt-2">
                  Êtes-vous sûr de vouloir supprimer définitivement la catégorie{' '}
                  <strong className="text-slate-900">&quot;{deletingCategory.name}&quot;</strong> ?
                  Cette action est irréversible.
                </p>
                <div className="mt-6 flex items-center justify-end gap-3">
                  <button
                    onClick={() => setDeletingCategory(null)}
                    className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={submitting}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
                  >
                    {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Confirmer la suppression
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

