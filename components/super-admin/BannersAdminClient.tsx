// components/super-admin/BannersAdminClient.tsx
'use client'

import { useState } from 'react'
import Image from 'next/image'
import {
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Image as ImageIcon,
  ArrowUpDown,
  X,
  ExternalLink,
} from 'lucide-react'
import { ImageUpload } from '@/components/shared/ImageUpload'

export interface BannerAdminItem {
  id: string
  image_url: string
  position: number
  is_active: boolean
  created_at: string
}

interface BannersAdminClientProps {
  initialBanners: BannerAdminItem[]
}

export function BannersAdminClient({ initialBanners }: BannersAdminClientProps) {
  const [banners, setBanners] = useState<BannerAdminItem[]>(initialBanners)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editingBanner, setEditingBanner] = useState<BannerAdminItem | null>(null)
  const [deletingBanner, setDeletingBanner] = useState<BannerAdminItem | null>(null)

  // Form states
  const [formImageUrl, setFormImageUrl] = useState<string | null>(null)
  const [formPosition, setFormPosition] = useState<number>(1)
  const [formIsActive, setFormIsActive] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const reloadBanners = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/admin/banners', { cache: 'no-store' })
      if (!res.ok) throw new Error('Impossible de charger les bannières')
      const data = await res.json()
      setBanners(data)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setIsLoading(false)
    }
  }

  const openAddModal = () => {
    setFormImageUrl(null)
    const maxPos = banners.reduce((max, b) => Math.max(max, b.position), 0)
    setFormPosition(maxPos + 1)
    setFormIsActive(true)
    setError(null)
    setIsAddOpen(true)
  }

  const openEditModal = (banner: BannerAdminItem) => {
    setEditingBanner(banner)
    setFormImageUrl(banner.image_url)
    setFormPosition(banner.position)
    setFormIsActive(banner.is_active)
    setError(null)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formImageUrl) {
      setError("Veuillez d'abord téléverser une image de bannière.")
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/admin/banners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_url: formImageUrl,
          position: Number(formPosition),
          is_active: formIsActive,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur lors de la création')

      setIsAddOpen(false)
      setSuccess('Bannière ajoutée avec succès.')
      setTimeout(() => setSuccess(null), 4000)
      await reloadBanners()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingBanner) return
    if (!formImageUrl) {
      setError("L'image de la bannière ne peut pas être vide.")
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/admin/banners', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingBanner.id,
          image_url: formImageUrl,
          position: Number(formPosition),
          is_active: formIsActive,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur lors de la modification')

      setEditingBanner(null)
      setSuccess('Bannière mise à jour avec succès.')
      setTimeout(() => setSuccess(null), 4000)
      await reloadBanners()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggleActive = async (banner: BannerAdminItem) => {
    try {
      const res = await fetch('/api/admin/banners', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: banner.id,
          is_active: !banner.is_active,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Erreur lors du changement de statut')
      }

      setBanners((prev) =>
        prev.map((b) => (b.id === banner.id ? { ...b, is_active: !b.is_active } : b))
      )
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }

  const handleDelete = async () => {
    if (!deletingBanner) return

    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch(`/api/admin/banners?id=${deletingBanner.id}`, {
        method: 'DELETE',
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur lors de la suppression')

      setDeletingBanner(null)
      setSuccess('Bannière supprimée.')
      setTimeout(() => setSuccess(null), 4000)
      await reloadBanners()
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
            Gestion des bannières du marketplace
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Bannières exclusivement visuelles (images pures, sans texte superposé) pour la vitrine principale.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold transition shadow-xs self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Ajouter une bannière
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

      {/* ── Grille des bannières ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            {banners.length} bannière(s) enregistrée(s)
          </span>
          {isLoading && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
        </div>

        {banners.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <ImageIcon className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">Aucune bannière active</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Ajoutez vos visuels publicitaires pour les afficher dans le carrousel principal du marketplace.
            </p>
            <button
              onClick={openAddModal}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#2563EB] text-white text-xs font-bold hover:bg-[#1D4ED8]"
            >
              <Plus className="w-4 h-4" /> Ajouter une bannière
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {banners.map((banner, index) => (
              <div
                key={banner.id}
                className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/70 transition"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-1">
                  <span className="text-xs font-mono font-bold text-slate-400 w-6 text-center shrink-0 hidden sm:block">
                    #{banner.position}
                  </span>

                  {/* Aperçu image bannière */}
                  <div className="relative w-full sm:w-64 h-28 sm:h-24 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                    <Image
                      src={banner.image_url}
                      alt={`Bannière #${banner.position}`}
                      fill
                      sizes="(max-width: 640px) 100vw, 256px"
                      className="object-cover"
                    />
                  </div>

                  {/* Infos */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">
                        Bannière n°{banner.position}
                      </span>
                      <button
                        onClick={() => handleToggleActive(banner)}
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold transition ${
                          banner.is_active
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            banner.is_active ? 'bg-emerald-500' : 'bg-slate-400'
                          }`}
                        />
                        {banner.is_active ? 'Actif' : 'Inactif'}
                      </button>
                    </div>
                    <p className="text-xs text-slate-500 truncate max-w-md">
                      {banner.image_url}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Ajoutée le{' '}
                      {banner.created_at
                        ? new Date(banner.created_at).toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })
                        : '—'}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                  <button
                    onClick={() => openEditModal(banner)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                    Modifier / Remplacer
                  </button>
                  <button
                    onClick={() => setDeletingBanner(banner)}
                    className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition"
                    title="Supprimer la bannière"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Modal Ajouter ── */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">
                Ajouter une nouvelle bannière
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
                  Image de la bannière (Cloudinary) *
                </label>
                <p className="text-[11px] text-slate-500 mb-2">
                  Téléversez votre visuel au format paysage. Prévisualisation immédiate avant enregistrement.
                </p>
                <ImageUpload
                  folder="rohaty-shop/banners"
                  currentUrl={formImageUrl}
                  onUpload={(url) => setFormImageUrl(url)}
                  onClear={() => setFormImageUrl(null)}
                  aspectRatio="banner"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Ordre d&apos;affichage dans le carrousel (Position)
                </label>
                <input
                  type="number"
                  value={formPosition}
                  onChange={(e) => setFormPosition(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-900 bg-white focus:outline-hidden focus:border-[#2563EB]"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="banner-active"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                  className="w-4 h-4 rounded text-[#2563EB] border-slate-300 focus:ring-[#2563EB]"
                />
                <label htmlFor="banner-active" className="text-xs font-semibold text-slate-700">
                  Activer immédiatement sur le marketplace
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
                  disabled={submitting || !formImageUrl}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-bold bg-[#2563EB] hover:bg-[#1D4ED8] text-white disabled:opacity-50"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Publier la bannière
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal Modifier ── */}
      {editingBanner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">
                Modifier la bannière
              </h2>
              <button
                onClick={() => setEditingBanner(null)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Image (Cloudinary) *
                </label>
                <ImageUpload
                  folder="rohaty-shop/banners"
                  currentUrl={formImageUrl}
                  onUpload={(url) => setFormImageUrl(url)}
                  onClear={() => setFormImageUrl(null)}
                  aspectRatio="banner"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Position
                </label>
                <input
                  type="number"
                  value={formPosition}
                  onChange={(e) => setFormPosition(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-900 bg-white focus:outline-hidden focus:border-[#2563EB]"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="edit-banner-active"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                  className="w-4 h-4 rounded text-[#2563EB] border-slate-300 focus:ring-[#2563EB]"
                />
                <label htmlFor="edit-banner-active" className="text-xs font-semibold text-slate-700">
                  Bannière active
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingBanner(null)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting || !formImageUrl}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-bold bg-[#2563EB] hover:bg-[#1D4ED8] text-white disabled:opacity-50"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal Supprimer ── */}
      {deletingBanner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6">
            <h2 className="text-base font-bold text-slate-900">
              Supprimer la bannière
            </h2>
            <p className="text-sm text-slate-600 mt-2">
              Êtes-vous sûr de vouloir supprimer cette bannière ? Elle ne sera plus affichée sur le marketplace.
            </p>

            <div className="relative w-full h-24 rounded-lg overflow-hidden my-4 border border-slate-200 bg-slate-100">
              <Image
                src={deletingBanner.image_url}
                alt="Bannière à supprimer"
                fill
                className="object-cover"
              />
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setDeletingBanner(null)}
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
          </div>
        </div>
      )}
    </div>
  )
}

