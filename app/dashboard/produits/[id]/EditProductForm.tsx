// app/dashboard/produits/[id]/EditProductForm.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { GlassCard } from '@/components/shared/GlassCard'
import { slugify } from '@/lib/utils'
import { Loader2, ArrowLeft, Trash2, Info, HelpCircle, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import * as Dialog from '@radix-ui/react-dialog'
import { MultiImageUpload, type UploadedImage } from '@/components/shared/MultiImageUpload'
import type { Category } from '@/lib/categories'

const productSchema = z
  .object({
    name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
    slug: z
      .string()
      .min(2, 'Le slug doit contenir au moins 2 caractères')
      .regex(/^[a-z0-9-]+$/, 'Le slug ne peut contenir que des lettres minuscules, chiffres et tirets'),
    price: z.coerce.number().min(0, 'Le prix doit être positif'),
    listPrice: z.coerce.number().min(0, 'Le prix barré doit être positif').optional(),
    description: z.string().max(1000, 'La description ne doit pas dépasser 1000 caractères').optional(),
    categoryId: z.string().min(1, 'Veuillez sélectionner une catégorie obligatoire'),
    isPublished: z.boolean().default(true),
  })
  .refine(
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
  list_price: number | null
  image_url: string | null
  category: string | null
  category_id?: string | null
  is_published: boolean
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
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [generatedSlug, setGeneratedSlug] = useState(product.slug)

  const initialImages: UploadedImage[] = (() => {
    if (product.product_images && product.product_images.length > 0) {
      return [...product.product_images]
        .sort((a, b) => a.position - b.position)
        .map((img) => ({
          id: img.id,
          url: img.url,
          isPrimary: img.is_primary,
        }))
    }
    if (product.image_url) {
      return [{ id: 'legacy-img', url: product.image_url, isPrimary: true }]
    }
    return []
  })()

  const [productImages, setProductImages] = useState<UploadedImage[]>(initialImages)

  const initialCategoryId = (() => {
    if (product.category_id) return product.category_id
    if (product.category) {
      const match = categories.find(
        (c) => c.name.toLowerCase() === product.category?.toLowerCase()
      )
      if (match) return match.id
    }
    return ''
  })()

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema) as any,
    defaultValues: {
      name: product.name,
      slug: product.slug,
      price: product.price,
      listPrice: product.list_price || undefined,
      description: product.description || '',
      categoryId: initialCategoryId,
      isPublished: product.is_published,
    },
  })

  const watchName = watch('name')

  useEffect(() => {
    if (watchName && watchName !== product.name) {
      setGeneratedSlug(slugify(watchName))
    }
  }, [watchName, product.name])

  const onSubmit = async (data: ProductFormData) => {
    setLoading(true)
    setError(null)

    try {
      let finalSlug = slugify(data.slug)
      if (finalSlug !== product.slug) {
        const { data: existing } = await supabase
          .from('products')
          .select('id')
          .eq('store_id', product.store_id)
          .eq('slug', finalSlug)
          .neq('id', product.id)
          .maybeSingle()

        if (existing) {
          finalSlug = `${finalSlug}-${Date.now().toString().slice(-4)}`
        }
      }

      const primaryImage = productImages.find((img) => img.isPrimary) || productImages[0]
      const selectedCat = categories.find((c) => c.id === data.categoryId)
      const categoryName = selectedCat ? selectedCat.name : null

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
    <div className="space-y-6 font-sans">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Colonne Images */}
          <div className="md:col-span-1 space-y-4">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Images du produit
            </label>
            <GlassCard className="p-4 bg-white border border-slate-200 shadow-xs">
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
            <GlassCard className="p-6 space-y-5 bg-white border border-slate-200 shadow-xs">
              {/* Nom */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Nom du produit *
                </label>
                <input
                  type="text"
                  placeholder="Ex: Sac en cuir marron"
                  {...register('name')}
                  className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] outline-hidden transition text-sm shadow-2xs"
                />
                {errors.name && (
                  <p className="text-xs text-red-600 mt-1.5">{errors.name.message}</p>
                )}
                {generatedSlug && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-2 font-mono truncate">
                    <Info className="w-3.5 h-3.5" />
                    <span>Slug : {generatedSlug}</span>
                  </div>
                )}
              </div>

              {/* Prix */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                    Prix de vente (DJF) *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      placeholder="Ex: 8500"
                      {...register('price')}
                      className="w-full pl-4 pr-12 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] outline-hidden transition text-sm shadow-2xs"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500 font-mono">
                      DJF
                    </div>
                  </div>
                  {errors.price && (
                    <p className="text-xs text-red-600 mt-1.5">{errors.price.message}</p>
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      Prix barré / d&apos;origine
                    </label>
                    <span title="Optionnel. Affiche un prix barré pour mettre en valeur une promotion.">
                      <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      placeholder="Ex: 10000 (optionnel)"
                      {...register('listPrice')}
                      className="w-full pl-4 pr-12 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] outline-hidden transition text-sm shadow-2xs"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500 font-mono">
                      DJF
                    </div>
                  </div>
                  {errors.listPrice && (
                    <p className="text-xs text-red-600 mt-1.5">{errors.listPrice.message}</p>
                  )}
                </div>
              </div>

              {/* Catégorie Officielle */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Catégorie *
                </label>
                <select
                  {...register('categoryId')}
                  className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] outline-hidden transition text-sm cursor-pointer shadow-2xs"
                >
                  <option value="" disabled className="text-slate-400">
                    Sélectionnez la catégorie du produit...
                  </option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id} className="text-slate-900 py-1">
                      {cat.name}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 mt-1.5">
                  Sélectionnez la catégorie officielle correspondant au produit.
                </p>
                {errors.categoryId && (
                  <p className="text-xs text-red-600 mt-1.5">{errors.categoryId.message}</p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Description du produit
                </label>
                <textarea
                  placeholder="Détails du produit (taille, matière, couleurs disponibles...)"
                  rows={4}
                  {...register('description')}
                  className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] outline-hidden transition text-sm resize-none shadow-2xs"
                />
                {errors.description && (
                  <p className="text-xs text-red-600 mt-1.5">{errors.description.message}</p>
                )}
              </div>

              {/* Statut */}
              <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
                <input
                  type="checkbox"
                  id="isPublished"
                  {...register('isPublished')}
                  className="w-4.5 h-4.5 rounded text-[#2563EB] border-slate-300 focus:ring-[#2563EB] accent-[#2563EB] cursor-pointer"
                />
                <div className="cursor-pointer select-none">
                  <label htmlFor="isPublished" className="block text-sm font-bold text-slate-900 cursor-pointer">
                    Publier immédiatement le produit
                  </label>
                  <span className="block text-xs text-slate-500 mt-0.5">
                    Si décoché, le produit sera enregistré comme brouillon et restera invisible sur votre boutique.
                  </span>
                </div>
              </div>
            </GlassCard>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/dashboard/produits"
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 transition shadow-2xs text-center"
              >
                <ArrowLeft className="w-4 h-4" />
                Retour
              </Link>

              <button
                type="button"
                onClick={() => setIsDeleteDialogOpen(true)}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 transition shadow-2xs cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                Supprimer
              </button>

              <button
                type="submit"
                disabled={loading}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#2563EB] hover:bg-[#1D4ED8] text-white transition shadow-xs disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  'Enregistrer les modifications'
                )}
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Modal de suppression */}
      <Dialog.Root open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md p-6 rounded-2xl bg-white border border-slate-200 shadow-2xl z-50 space-y-4 focus:outline-hidden">
            <div className="flex items-center gap-3 text-red-600">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
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
              Êtes-vous sûr de vouloir supprimer définitivement <strong className="text-slate-900">&laquo; {product.name} &raquo;</strong> ?
            </p>

            {deleteError && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-600">
                {deleteError}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                >
                  Annuler
                </button>
              </Dialog.Close>

              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-red-600 hover:bg-red-700 text-white transition"
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
