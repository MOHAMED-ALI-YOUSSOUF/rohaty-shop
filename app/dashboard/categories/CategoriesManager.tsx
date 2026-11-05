// app/dashboard/categories/CategoriesManager.tsx
'use client'

import { useState } from 'react'
import Image from 'next/image'
import { GlassCard } from '@/components/shared/GlassCard'
import { GradientButton } from '@/components/shared/GradientButton'
import { getCategoryVisual } from '@/lib/categories'
import {
  Plus,
  Edit2,
  Trash2,
  ChevronUp,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
  Package,
  Layers,
  X,
} from 'lucide-react'

interface CategoryWithCount {
  id: string
  name: string
  slug: string
  image_url: string | null
  position: number
  is_active: boolean
  product_count: number
}

interface CategoriesManagerProps {
  initialCategories: CategoryWithCount[]
}

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message
  return String(err)
}

export function CategoriesManager({ initialCategories }: CategoriesManagerProps) {
  const [categories, setCategories] = useState<CategoryWithCount[]>(initialCategories)
  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<CategoryWithCount | null>(null)
  const [deleteCategory, setDeleteCategory] = useState<CategoryWithCount | null>(null)

  // Form states
  const [formName, setFormName] = useState('')
  const [formImageUrl, setFormImageUrl] = useState('')
  const [formPosition, setFormPosition] = useState<number>(1)
  const [formIsActive, setFormIsActive] = useState(true)

  const openAddModal = () => {
    setFormName('')
    setFormImageUrl('')
    setFormPosition((categories.length > 0 ? Math.max(...categories.map(c => c.position)) : 0) + 1)
    setFormIsActive(true)
    setIsAddOpen(true)
  }

  const openEditModal = (cat: CategoryWithCount) => {
    setEditingCategory(cat)
    setFormName(cat.name)
    setFormImageUrl(cat.image_url || '')
    setFormPosition(cat.position)
    setFormIsActive(cat.is_active)
  }

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formName.trim()) return

    setLoading(true)
    setFeedback(null)

    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName.trim(),
          image_url: formImageUrl.trim() || null,
          position: Number(formPosition),
          is_active: formIsActive,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur lors de la création')

      setCategories((prev) => [...prev, { ...data, product_count: 0 }].sort((a, b) => a.position - b.position))
      setIsAddOpen(false)
      setFeedback({ type: 'success', message: `Catégorie « ${data.name} » créée avec succès.` })
    } catch (err: unknown) {
      setFeedback({ type: 'error', message: getErrorMessage(err) })
    } finally {
      setLoading(false)
    }
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingCategory || !formName.trim()) return

    setLoading(true)
    setFeedback(null)

    try {
      const res = await fetch('/api/categories', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingCategory.id,
          name: formName.trim(),
          image_url: formImageUrl.trim() || null,
          position: Number(formPosition),
          is_active: formIsActive,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur lors de la modification')

      setCategories((prev) =>
        prev
          .map((c) => (c.id === data.id ? { ...c, ...data } : c))
          .sort((a, b) => a.position - b.position)
      )
      setEditingCategory(null)
      setFeedback({ type: 'success', message: `Catégorie « ${data.name} » mise à jour avec succès.` })
    } catch (err: unknown) {
      setFeedback({ type: 'error', message: getErrorMessage(err) })
    } finally {
      setLoading(false)
    }
  }

  const handleToggleActive = async (cat: CategoryWithCount) => {
    try {
      const newActive = !cat.is_active
      const res = await fetch('/api/categories', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: cat.id, is_active: newActive }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error)
      }
      setCategories((prev) =>
        prev.map((c) => (c.id === cat.id ? { ...c, is_active: newActive } : c))
      )
    } catch (err: unknown) {
      setFeedback({ type: 'error', message: getErrorMessage(err) })
    }
  }

  const handleMovePosition = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= categories.length) return

    const currentCat = categories[index]
    const targetCat = categories[targetIndex]

    const newPosCurrent = targetCat.position
    const newPosTarget = currentCat.position === targetCat.position
      ? (direction === 'up' ? targetCat.position + 1 : targetCat.position - 1)
      : currentCat.position

    const updatedList = [...categories]
    updatedList[index] = { ...currentCat, position: newPosCurrent }
    updatedList[targetIndex] = { ...targetCat, position: newPosTarget }
    updatedList.sort((a, b) => a.position - b.position)

    setCategories(updatedList)

    try {
      await Promise.all([
        fetch('/api/categories', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: currentCat.id, position: newPosCurrent }),
        }),
        fetch('/api/categories', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: targetCat.id, position: newPosTarget }),
        }),
      ])
    } catch (err: unknown) {
      console.error(err)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deleteCategory) return

    setLoading(true)
    setFeedback(null)

    try {
      const res = await fetch(`/api/categories?id=${deleteCategory.id}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur lors de la suppression')

      setCategories((prev) => prev.filter((c) => c.id !== deleteCategory.id))
      setDeleteCategory(null)
      setFeedback({ type: 'success', message: `Catégorie « ${deleteCategory.name} » supprimée.` })
    } catch (err: unknown) {
      setFeedback({ type: 'error', message: getErrorMessage(err) })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {feedback && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between text-sm ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
              : 'bg-red-500/10 border border-red-500/20 text-red-400'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-text-muted hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header / Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-heading text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-primary" />
            Catalogue des catégories officielles
          </h2>
          <p className="text-text-secondary text-xs mt-1">
            Gérez les {categories.length} catégories officielles. Les vendeurs doivent obligatoirement choisir l&apos;une de ces catégories.
          </p>
        </div>

        <GradientButton
          variant="primary"
          onClick={openAddModal}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Ajouter une catégorie
        </GradientButton>
      </div>

      {/* Table des catégories */}
      <GlassCard className="overflow-hidden border border-white/5">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-white/5 text-text-muted uppercase tracking-wider font-semibold border-b border-white/5">
              <tr>
                <th className="py-3 px-4 w-16">Ordre</th>
                <th className="py-3 px-4 w-16">Visuel</th>
                <th className="py-3 px-4">Nom de la catégorie</th>
                <th className="py-3 px-4">Slug unique</th>
                <th className="py-3 px-4 text-center">Produits liés</th>
                <th className="py-3 px-4 text-center">Statut</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {categories.map((cat, index) => {
                const visual = getCategoryVisual(cat.slug)
                return (
                  <tr key={cat.id} className="hover:bg-white/[0.02] transition">
                    {/* Position + Reorder buttons */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1">
                        <span className="font-mono font-bold text-white/80 w-5 text-center">
                          {cat.position}
                        </span>
                        <div className="flex flex-col">
                          <button
                            onClick={() => handleMovePosition(index, 'up')}
                            disabled={index === 0}
                            className="text-text-muted hover:text-white disabled:opacity-20 disabled:cursor-not-allowed p-0.5"
                            title="Monter"
                          >
                            <ChevronUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleMovePosition(index, 'down')}
                            disabled={index === categories.length - 1}
                            className="text-text-muted hover:text-white disabled:opacity-20 disabled:cursor-not-allowed p-0.5"
                            title="Descendre"
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </td>

                    {/* Image / Visuel circulaire */}
                    <td className="py-3.5 px-4">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-lg relative overflow-hidden shrink-0 border border-white/10"
                        style={{ backgroundColor: `${visual.color}20` }}
                      >
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
                    <td className="py-3.5 px-4 font-semibold text-white text-sm">
                      {cat.name}
                    </td>

                    {/* Slug */}
                    <td className="py-3.5 px-4 font-mono text-[11px] text-text-muted">
                      {cat.slug}
                    </td>

                    {/* Nombre de produits */}
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white/5 text-slate-300 border border-white/5">
                        <Package className="w-3 h-3 text-primary" />
                        {cat.product_count} produit{cat.product_count > 1 ? 's' : ''}
                      </span>
                    </td>

                    {/* Statut Toggle */}
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleToggleActive(cat)}
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold transition cursor-pointer ${
                          cat.is_active
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
                            : 'bg-slate-700/30 text-slate-400 border border-white/5 hover:bg-slate-700/50'
                        }`}
                        title="Cliquer pour changer le statut"
                      >
                        {cat.is_active ? 'Actif' : 'Inactif'}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => openEditModal(cat)}
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-text-secondary hover:text-white transition cursor-pointer"
                          title="Modifier"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => setDeleteCategory(cat)}
                          disabled={cat.product_count > 0}
                          className={`p-1.5 rounded-lg transition ${
                            cat.product_count > 0
                              ? 'bg-white/5 text-slate-600 opacity-40 cursor-not-allowed'
                              : 'bg-red-500/10 hover:bg-red-500/20 text-red-400 cursor-pointer'
                          }`}
                          title={
                            cat.product_count > 0
                              ? `Impossible de supprimer : ${cat.product_count} produit(s) sont associés.`
                              : 'Supprimer'
                          }
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
      </GlassCard>

      {/* MODAL : Ajouter une catégorie */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-bg-surface border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <h3 className="text-base font-bold text-white font-heading">
                Ajouter une catégorie officielle
              </h3>
              <button
                onClick={() => setIsAddOpen(false)}
                className="text-text-muted hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
                  Nom officiel *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Électronique"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-bg-input border border-white/10 text-white placeholder-text-muted text-sm outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
                  URL de l&apos;image (optionnel)
                </label>
                <input
                  type="url"
                  placeholder="https://res.cloudinary.com/..."
                  value={formImageUrl}
                  onChange={(e) => setFormImageUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-bg-input border border-white/10 text-white placeholder-text-muted text-sm outline-none focus:border-primary"
                />
                <p className="text-[10px] text-text-muted mt-1">
                  Si vide, l&apos;illustration visuelle par défaut (icône & dégradé) sera utilisée.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
                    Position
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formPosition}
                    onChange={(e) => setFormPosition(parseInt(e.target.value) || 1)}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-bg-input border border-white/10 text-white text-sm outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
                    Statut
                  </label>
                  <select
                    value={formIsActive ? 'true' : 'false'}
                    onChange={(e) => setFormIsActive(e.target.value === 'true')}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-bg-input border border-white/10 text-white text-sm outline-none focus:border-primary cursor-pointer"
                  >
                    <option value="true" className="bg-slate-900">Actif</option>
                    <option value="false" className="bg-slate-900">Inactif</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-white/5 hover:bg-white/10 text-white"
                >
                  Annuler
                </button>
                <GradientButton
                  type="submit"
                  variant="primary"
                  className="px-5 py-2 text-xs font-semibold"
                  disabled={loading}
                >
                  {loading ? 'Création...' : 'Créer la catégorie'}
                </GradientButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL : Modifier une catégorie */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-bg-surface border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <h3 className="text-base font-bold text-white font-heading">
                Modifier « {editingCategory.name} »
              </h3>
              <button
                onClick={() => setEditingCategory(null)}
                className="text-text-muted hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
                  Nom officiel *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-bg-input border border-white/10 text-white text-sm outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
                  URL de l&apos;image
                </label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={formImageUrl}
                  onChange={(e) => setFormImageUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-bg-input border border-white/10 text-white text-sm outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
                    Position
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formPosition}
                    onChange={(e) => setFormPosition(parseInt(e.target.value) || 1)}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-bg-input border border-white/10 text-white text-sm outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
                    Statut
                  </label>
                  <select
                    value={formIsActive ? 'true' : 'false'}
                    onChange={(e) => setFormIsActive(e.target.value === 'true')}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-bg-input border border-white/10 text-white text-sm outline-none focus:border-primary cursor-pointer"
                  >
                    <option value="true" className="bg-slate-900">Actif</option>
                    <option value="false" className="bg-slate-900">Inactif</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-white/5 hover:bg-white/10 text-white"
                >
                  Annuler
                </button>
                <GradientButton
                  type="submit"
                  variant="primary"
                  className="px-5 py-2 text-xs font-semibold"
                  disabled={loading}
                >
                  {loading ? 'Enregistrement...' : 'Enregistrer'}
                </GradientButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL : Confirmation de suppression */}
      {deleteCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-bg-surface border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white font-heading">
              Supprimer la catégorie « {deleteCategory.name} » ?
            </h3>

            {deleteCategory.product_count > 0 ? (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs leading-relaxed flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  <strong>Action bloquée :</strong> {deleteCategory.product_count} produit(s) sont associés à cette catégorie. Vous devez d&apos;abord les réaffecter à une autre catégorie avant de pouvoir la supprimer.
                </span>
              </div>
            ) : (
              <p className="text-xs text-text-secondary leading-relaxed">
                Êtes-vous sûr de vouloir supprimer définitivement cette catégorie ? Aucun produit n&apos;y est associé.
              </p>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteCategory(null)}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-white/5 hover:bg-white/10 text-white"
              >
                Fermer
              </button>

              {deleteCategory.product_count === 0 && (
                <button
                  type="button"
                  onClick={handleDeleteConfirm}
                  disabled={loading}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-danger hover:bg-danger/90 text-white cursor-pointer"
                >
                  {loading ? 'Suppression...' : 'Confirmer la suppression'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
