// app/dashboard/produits/nouveau/NewProductForm.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { ImageUpload } from '@/components/shared/ImageUpload'
import { GradientButton } from '@/components/shared/GradientButton'
import { GlassCard } from '@/components/shared/GlassCard'
import { slugify } from '@/lib/utils'
import { Loader2, ArrowLeft, Info, HelpCircle } from 'lucide-react'
import Link from 'next/link'

const productSchema = z.object({
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  price: z.coerce.number().min(0, 'Le prix doit être positif'),
  listPrice: z.coerce.number().min(0, 'Le prix barré doit être positif').optional(),
  description: z.string().max(1000, 'La description ne doit pas dépasser 1000 caractères').optional(),
  category: z.string().max(50, 'La catégorie ne doit pas dépasser 50 caractères').optional(),
  imageUrl: z.string().optional(),
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
}

export function NewProductForm({ storeId }: NewProductFormProps) {
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [generatedSlug, setGeneratedSlug] = useState('')

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema) as any,
    defaultValues: {
      isPublished: true,
      imageUrl: '',
    },
  })

  const nameValue = watch('name')
  const imageUrlValue = watch('imageUrl')

  // Auto-génération du slug en direct à partir du nom
  useEffect(() => {
    if (nameValue) {
      setGeneratedSlug(slugify(nameValue))
    } else {
      setGeneratedSlug('')
    }
  }, [nameValue])

  const onSubmit = async (data: ProductFormData) => {
    setLoading(true)
    setError(null)

    try {
      const slug = generatedSlug || slugify(data.name)

      // 1. Vérifier si le slug existe déjà pour cette boutique
      const { data: existingProduct } = await supabase
        .from('products')
        .select('id')
        .eq('store_id', storeId)
        .eq('slug', slug)
        .maybeSingle()

      // Si le slug existe, on lui ajoute un suffixe aléatoire pour éviter l'erreur de contrainte unique
      const finalSlug = existingProduct ? `${slug}-${Math.floor(100 + Math.random() * 900)}` : slug

      // 2. Insérer le produit en base
      const { error: insertError } = await supabase
        .from('products')
        .insert({
          store_id: storeId,
          name: data.name.trim(),
          slug: finalSlug,
          price: data.price,
          list_price: data.listPrice || data.price, // Si pas de prix barré, on met le même prix
          description: data.description?.trim() || null,
          category: data.category?.trim() || null,
          image_url: data.imageUrl || null,
          is_published: data.isPublished,
        })

      if (insertError) throw insertError

      router.push('/dashboard/produits')
      router.refresh()
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Une erreur est survenue lors de la création du produit.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <div className="p-4 rounded-lg bg-danger/10 border border-danger/20 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Colonne Image */}
        <div className="md:col-span-1 space-y-4">
          <label className="block text-xs font-semibold tracking-widest uppercase text-text-secondary">
            Image du produit
          </label>
          <GlassCard className="p-4 flex flex-col items-center justify-center">
            <ImageUpload
              folder="rohaty-shop/products"
              currentUrl={imageUrlValue}
              onUpload={(url) => setValue('imageUrl', url)}
              aspectRatio="square"
            />
            <p className="text-[10px] text-text-muted mt-3 text-center leading-relaxed">
              Glissez-déposez ou cliquez pour uploader une photo carrée de préférence.
            </p>
          </GlassCard>
        </div>

        {/* Colonne Formulaire */}
        <div className="md:col-span-2 space-y-6">
          <GlassCard className="p-6 space-y-5">
            {/* Nom du produit */}
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
                  <span>Slug généré : {generatedSlug}</span>
                </div>
              )}
            </div>

            {/* Prix Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Prix de vente */}
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

              {/* Prix barré (original) */}
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <label className="block text-xs font-semibold tracking-widest uppercase text-text-secondary">
                    Prix barré / d'origine
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

            {/* Catégorie */}
            <div>
              <label className="block text-xs font-semibold tracking-widest uppercase text-text-secondary mb-2">
                Catégorie
              </label>
              <input
                type="text"
                placeholder="Ex: Accessoires, Vêtements, Électronique"
                {...register('category')}
                className="w-full px-4 py-3 rounded-lg bg-bg-input border border-white/10 text-white placeholder-text-muted focus:border-primary/50 focus:shadow-[0_0_0_3px_rgba(37,99,235,0.15)] outline-none transition-all text-sm"
              />
              <p className="text-[10px] text-text-muted mt-1.5">
                Texte libre. Vos clients pourront filtrer vos produits par cette catégorie sur votre vitrine.
              </p>
              {errors.category && (
                <p className="text-xs text-red-400 mt-1.5">{errors.category.message}</p>
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

            {/* Statut de publication */}
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

          {/* Form Actions */}
          <div className="flex gap-4">
            <Link
              href="/dashboard/produits"
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-3.5 rounded-lg text-sm font-semibold bg-white/5 hover:bg-white/10 border border-white/10 text-white hover:scale-[1.02] active:scale-[0.98] transition-all text-center"
            >
              <ArrowLeft className="w-4 h-4" />
              Annuler
            </Link>

            <GradientButton
              type="submit"
              variant="primary"
              className="flex-1 py-3.5"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  Création...
                </>
              ) : (
                'Créer le produit'
              )}
            </GradientButton>
          </div>
        </div>
      </div>
    </form>
  )
}
