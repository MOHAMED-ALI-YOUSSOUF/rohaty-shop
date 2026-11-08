// app/dashboard/produits/nouveau/NewProductForm.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { GlassCard } from '@/components/shared/GlassCard'
import { slugify } from '@/lib/utils'
import { Loader2, ArrowLeft, Info, HelpCircle } from 'lucide-react'
import Link from 'next/link'
import { MultiImageUpload, type UploadedImage } from '@/components/shared/MultiImageUpload'
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

interface NewProductFormProps {
  storeId: string
  categories: Category[]
}

export function NewProductForm({ storeId, categories }: NewProductFormProps) {
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [generatedSlug, setGeneratedSlug] = useState('')
  const [productImages, setProductImages] = useState<UploadedImage[]>([])

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema) as any,
    defaultValues: {
      name: '',
      price: undefined,
      listPrice: undefined,
      description: '',
      categoryId: '',
      isPublished: true,
    },
  })

  const watchName = watch('name')

  useEffect(() => {
    if (watchName) {
      setGeneratedSlug(slugify(watchName))
    } else {
      setGeneratedSlug('')
    }
  }, [watchName])

  const onSubmit = async (data: ProductFormData) => {
    setLoading(true)
    setError(null)

    try {
      let slug = slugify(data.name)
      const { data: existing } = await supabase
        .from('products')
        .select('id')
        .eq('store_id', storeId)
        .eq('slug', slug)
        .maybeSingle()

      if (existing) {
        slug = `${slug}-${Date.now().toString().slice(-4)}`
      }

      const primaryImg = productImages.find((img) => img.isPrimary) || productImages[0]
      const imageUrl = primaryImg ? primaryImg.url : null

      const selectedCat = categories.find((c) => c.id === data.categoryId)
      const categoryName = selectedCat ? selectedCat.name : null

      const { data: lastProduct } = await supabase
        .from('products')
        .select('sort_order')
        .eq('store_id', storeId)
        .order('sort_order', { ascending: false })
        .limit(1)
        .maybeSingle()

      const nextSortOrder = (lastProduct?.sort_order ?? -1) + 1

      const { data: newProduct, error: insertError } = await supabase
        .from('products')
        .insert({
          store_id: storeId,
          name: data.name,
          slug,
          description: data.description || null,
          price: data.price,
          list_price: data.listPrice || null,
          category: categoryName,
          category_id: data.categoryId,
          image_url: imageUrl,
          is_published: data.isPublished,
          sort_order: nextSortOrder,
        })
        .select('id')
        .single()

      if (insertError) throw insertError

      if (productImages.length > 0) {
        const { error: imagesError } = await supabase.from('product_images').insert(
          productImages.map((img, index) => ({
            product_id: newProduct.id,
            url: img.url,
            position: index,
            is_primary: img.isPrimary,
          }))
        )
        if (imagesError) throw imagesError
      }

      router.push('/dashboard/produits')
      router.refresh()
    } catch (err: unknown) {
      console.error(err)
      const msg = err instanceof Error ? err.message : 'Une erreur est survenue lors de la création du produit.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Colonne Image */}
        <div className="md:col-span-1 space-y-4">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            Image du produit
          </label>
          <GlassCard className="p-4 flex flex-col items-center justify-center bg-white border border-slate-200 shadow-xs">
            <MultiImageUpload
              folder="rohaty-shop/products"
              images={productImages}
              onChange={setProductImages}
              maxImages={8}
            />
            <p className="text-[11px] text-slate-500 mt-3 text-center leading-relaxed">
              Glissez-déposez ou cliquez pour uploader une photo carrée de préférence.
            </p>
          </GlassCard>
        </div>

        {/* Colonne Formulaire */}
        <div className="md:col-span-2 space-y-6">
          <GlassCard className="p-6 space-y-5 bg-white border border-slate-200 shadow-xs">
            {/* Nom du produit */}
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
                  <span>Slug généré : {generatedSlug}</span>
                </div>
              )}
            </div>

            {/* Prix Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Prix de vente */}
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

              {/* Prix barré */}
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
                Sélectionnez la catégorie officielle correspondant au produit. Une seule catégorie par produit.
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

            {/* Statut de publication */}
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

          {/* Form Actions */}
          <div className="flex gap-4">
            <Link
              href="/dashboard/produits"
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 transition shadow-2xs text-center"
            >
              <ArrowLeft className="w-4 h-4" />
              Annuler
            </Link>

            <button
              type="submit"
              disabled={loading}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#2563EB] hover:bg-[#1D4ED8] text-white transition shadow-xs disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Création...
                </>
              ) : (
                'Créer le produit'
              )}
            </button>
          </div>
        </div>
      </div>
    </form>
  )
}
