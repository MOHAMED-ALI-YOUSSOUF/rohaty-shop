// app/dashboard/produits/[id]/EditProductForm.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { MultiImageUpload, type UploadedImage } from '@/components/shared/MultiImageUpload'
import { GradientButton } from '@/components/shared/GradientButton'
import { GlassCard } from '@/components/shared/GlassCard'
import { slugify } from '@/lib/utils'
import { Loader2, ArrowLeft, Trash2, AlertTriangle, Info, HelpCircle } from 'lucide-react'
import Link from 'next/link'
import * as Dialog from '@radix-ui/react-dialog'
import type { Category } from '@/lib/categories'

const productSchema = z.object({
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  price: z.coerce.number().min(0, 'Le prix doit être positif'),
  listPrice: z.coerce.number().min(0, 'Le prix barré doit être positif').optional(),
  description: z.string().max(1000, 'La description ne doit pas dépasser 1000 caractères').optional(),
  categoryId: z.string().min(1, 'Veuillez sélectionner une catégorie obligatoire'),
  isPublished: z.boolean().default(true),
}).refine(
  (data) => {
    if (data.listPrice !== undefined && data.listPrice > 0) {
      return data.listPrice >= data.price
    }
    return true
  },
  {
    message: 'Le prix barré doit être supérieur ou égal au prix de vente',
    path: ['listPrice'],
  }
)

type ProductFormData = z.infer<typeof productSchema>

interface ProductImage {
  id: string
  url: string
  position: number
  is_primary: boolean
}

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
  category_id?: string | null
  is_published: boolean
  created_at: string
  product_images?: ProductImage[]
}

interface EditProductFormProps {
  product: Product
  categories: Category[]
}

export function EditProductForm({ product, categories }: EditProductFormProps) {
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [generatedSlug, setGeneratedSlug] = useState(product.slug)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  // Initialiser les images depuis product_images, ou fallback sur image_url legacy
  const [productImages, setProductImages] = useState<UploadedImage[]>(() => {
    if (product.product_images && product.product_images.length > 0) {
      return [...product.product_images]
        .sort((a, b) => a.position - b.position)
        .map((img) => ({ url: img.url, isPrimary: img.is_primary }))
    }
    if (product.image_url) {
      return [{ url: product.image_url, isPrimary: true }]
    }
    return []
  })

  // Résoudre le categoryId initial
  const initialCategoryId = product.category_id || categories.find(c => c.name === product.category)?.id || ''

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema) as any,
    defaultValues: {
      name: product.name,
      price: product.price,
      listPrice: product.list_price || undefined,
      description: product.description || '',
      categoryId: initialCategoryId,
      isPublished: product.is_published,
    },
  })

  const nameValue = watch('name')

  useEffect(() => {
    if (nameValue) setGeneratedSlug(slugify(nameValue))
  }, [nameValue])

  const onSubmit = async (data: ProductFormData) => {
    setLoading(true)
    setError(null)

    try {
      const slug = generatedSlug || slugify(data.name)
      let finalSlug = product.slug

      if (slug !== product.slug) {
        const { data: existingProduct } = await supabase
          .from('products')
          .select('id')
          .eq('store_id', product.store_id)
          .eq('slug', slug)
          .maybeSingle()
        finalSlug = existingProduct
          ? `${slug}-${Math.floor(100 + Math.random() * 900)}`
          : slug
      }

      const primaryImage = productImages.find((img) => img.isPrimary)

      // Récupérer le nom de la catégorie officielle
      const selectedCat = categories.find(c => c.id === data.categoryId)
      const categoryName = selectedCat ? selectedCat.name : null

      // 1. Mettre à jour le produit avec category_id et category
      const { error: updateError } = await supabase
        .from('products')
        .update({
          name: data.name.trim(),
          slug: finalSlug,
          price: data.price,
          list_price: data.listPrice ?? null,
          description: data.description?.trim() || null,
          category_id: data.categoryId,
          category: categoryName,
          image_url: primaryImage?.url || null,
          is_published: data.isPublished,
        })
        .eq('id', product.id)

      if (updateError) throw updateError

      // 2. Remplacer toutes les images : supprimer puis réinsérer
      const { error: deleteImagesError } = await supabase
        .from('product_images')
        .delete()
        .eq('product_id', product.id)

      if (deleteImagesError) throw deleteImagesError

      if (productImages.length > 0) {
        const { error: insertImagesError } = await supabase
          .from('product_images')
          .insert(
            productImages.map((img, index) => ({
              product_id: product.id,
              url: img.url,
              position: index,
              is_primary: img.isPrimary,
            }))
          )
        if (insertImagesError) throw insertImagesError
      }

      router.push('/dashboard/produits')
      router.refresh()
    } catch (err: unknown) {
      console.error(err)
      const msg = err instanceof Error ? err.message : 'Une erreur est survenue lors de la mise à jour du produit.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    setDeleteError(null)
    try {
      const { error: deleteError } = await supabase
        .from('products')
        .delete()
        .eq('id', product.id)

      if (deleteError) throw deleteError

      setIsDeleteDialogOpen(false)
      router.push('/dashboard/produits')
      router.refresh()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Impossible de supprimer le produit.'
      setDeleteError(msg)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {error && (
          <div className="p-4 rounded-lg bg-danger/10 border border-danger/20 text-sm text-red-400">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Colonne Images */}
          <div className="md:col-span-1 space-y-4">
            <label className="block text-xs font-semibold tracking-widest uppercase text-text-secondary">
              Images du produit
            </label>
            <GlassCard className="p-4">
              <MultiImageUpload
                folder="rohaty-shop/products"
                images={productImages}
                onChange={setProductImages}
                maxImages={8}
              />
            </GlassCard>
          </div>

          {/* Colonne Formulaire */}
          <div className="md:col-span-2 space-y-6">
            <GlassCard className="p-6 space-y-5">
              {/* Nom */}
              <div>
                <label className="block text-xs font-semibold tracking-widest uppercase text-text-secondary mb-2">
                  Nom du produit *
                </label>
                <input
                  type="text"
                  placeholder="Ex: Sac en cuir marron"
                  {...register('name')}
                  className="w-full px-4 py-3 rounded-lg bg-bg-input border border-white/10 text-white placeholder-text-muted focus:border-primary/50 focus:shadow-[0_0_0_3px_rgba(37,99,235,0.15)] outline-none transition-all text-sm"
                />
                {errors.name && (
                  <p className="text-xs text-red-400 mt-1.5">{errors.name.message}</p>
                )}
                {generatedSlug && (
                  <div className="flex items-center gap-1.5 text-xs text-text-muted mt-2 font-mono truncate">
                    <Info className="w-3.5 h-3.5" />
                    <span>Slug : {generatedSlug}</span>
                  </div>
                )}
              </div>

              {/* Prix */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold tracking-widest uppercase text-text-secondary mb-2">
                    Prix de vente (DJF) *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      placeholder="Ex: 8500"
                      {...register('price')}
                      className="w-full pl-4 pr-12 py-3 rounded-lg bg-bg-input border border-white/10 text-white placeholder-text-muted focus:border-primary/50 focus:shadow-[0_0_0_3px_rgba(37,99,235,0.15)] outline-none transition-all text-sm"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-text-secondary font-mono">
                      DJF
                    </div>
                  </div>
                  {errors.price && (
                    <p className="text-xs text-red-400 mt-1.5">{errors.price.message}</p>
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <label className="block text-xs font-semibold tracking-widest uppercase text-text-secondary">
                      Prix barré / d&apos;origine
                    </label>
                    <span title="Optionnel. Affiche un prix barré pour mettre en valeur une promotion.">
                      <HelpCircle className="w-3.5 h-3.5 text-text-muted" />
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      placeholder="Ex: 10000 (optionnel)"
                      {...register('listPrice')}
                      className="w-full pl-4 pr-12 py-3 rounded-lg bg-bg-input border border-white/10 text-white placeholder-text-muted focus:border-primary/50 focus:shadow-[0_0_0_3px_rgba(37,99,235,0.15)] outline-none transition-all text-sm"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-text-secondary font-mono">
                      DJF
                    </div>
                  </div>
                  {errors.listPrice && (
                    <p className="text-xs text-red-400 mt-1.5">{errors.listPrice.message}</p>
                  )}
                </div>
              </div>

              {/* Catégorie Officielle */}
              <div>
                <label className="block text-xs font-semibold tracking-widest uppercase text-text-secondary mb-2">
                  Catégorie *
                </label>
                <select
                  {...register('categoryId')}
                  className="w-full px-4 py-3 rounded-lg bg-bg-input border border-white/10 text-white focus:border-primary/50 focus:shadow-[0_0_0_3px_rgba(37,99,235,0.15)] outline-none transition-all text-sm cursor-pointer"
                >
                  <option value="" disabled className="bg-slate-900 text-slate-400">
                    Sélectionnez la catégorie du produit...
                  </option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id} className="bg-slate-900 text-white py-1">
                      {cat.name}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-text-muted mt-1.5">
                  Sélectionnez la catégorie officielle correspondant au produit.
                </p>
                {errors.categoryId && (
                  <p className="text-xs text-red-400 mt-1.5">{errors.categoryId.message}</p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold tracking-widest uppercase text-text-secondary mb-2">
                  Description du produit
                </label>
                <textarea
                  placeholder="Détails du produit (taille, matière, couleurs disponibles...)"
                  rows={4}
                  {...register('description')}
                  className="w-full px-4 py-3 rounded-lg bg-bg-input border border-white/10 text-white placeholder-text-muted focus:border-primary/50 focus:shadow-[0_0_0_3px_rgba(37,99,235,0.15)] outline-none transition-all text-sm resize-none"
                />
                {errors.description && (
                  <p className="text-xs text-red-400 mt-1.5">{errors.description.message}</p>
                )}
              </div>

              {/* Statut */}
              <div className="flex items-center gap-3 p-4 rounded-lg bg-white/5 border border-white/5">
                <input
                  type="checkbox"
                  id="isPublished"
                  {...register('isPublished')}
                  className="w-4.5 h-4.5 rounded bg-bg-input border-white/10 text-primary focus:ring-primary/20 accent-primary cursor-pointer"
                />
                <div className="cursor-pointer select-none">
                  <label htmlFor="isPublished" className="block text-sm font-semibold text-white cursor-pointer">
                    Publier immédiatement le produit
                  </label>
                  <span className="block text-xs text-text-secondary mt-0.5">
                    Si décoché, le produit sera enregistré comme brouillon et restera invisible sur votre boutique.
                  </span>
                </div>
              </div>
            </GlassCard>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/dashboard/produits"
                className="inline-flex items-center justify-center gap-1.5 px-4 py-3.5 rounded-lg text-sm font-semibold bg-white/5 hover:bg-white/10 border border-white/10 text-white hover:scale-[1.02] active:scale-[0.98] transition-all text-center"
              >
                <ArrowLeft className="w-4 h-4" />
                Retour
              </Link>

              <button
                type="button"
                onClick={() => setIsDeleteDialogOpen(true)}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-3.5 rounded-lg text-sm font-semibold bg-danger/10 hover:bg-danger/20 border border-danger/20 text-red-400 transition-all cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                Supprimer
              </button>

              <GradientButton
                type="submit"
                variant="primary"
                className="flex-1 py-3.5"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  'Enregistrer les modifications'
                )}
              </GradientButton>
            </div>
          </div>
        </div>
      </form>

      {/* Modal de suppression */}
      <Dialog.Root open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-fade-in" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md p-6 rounded-2xl bg-bg-surface border border-white/10 shadow-2xl z-50 focus:outline-none">
            <div className="flex items-center gap-3 text-red-400 mb-4">
              <div className="w-10 h-10 rounded-full bg-danger/10 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-danger" />
              </div>
              <Dialog.Title className="text-lg font-bold text-white font-heading">
                Supprimer le produit ?
              </Dialog.Title>
            </div>

            <Dialog.Description className="text-sm text-text-secondary leading-relaxed mb-6">
              Êtes-vous sûr de vouloir supprimer <strong className="text-white">« {product.name} »</strong> ? Cette action est irréversible.
            </Dialog.Description>

            {deleteError && (
              <div className="p-3 mb-4 rounded-lg bg-danger/10 border border-danger/20 text-xs text-red-400">
                {deleteError}
              </div>
            )}

            <div className="flex justify-end gap-3">
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-white/5 hover:bg-white/10 text-white transition-colors"
                >
                  Annuler
                </button>
              </Dialog.Close>

              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-danger hover:bg-danger/90 text-white transition-colors cursor-pointer"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Suppression...
                  </>
                ) : (
                  'Confirmer la suppression'
                )}
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  )
}
