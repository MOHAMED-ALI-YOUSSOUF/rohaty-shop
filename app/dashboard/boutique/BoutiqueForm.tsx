// app/dashboard/boutique/BoutiqueForm.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { GradientButton } from '@/components/shared/GradientButton'
import { GlassCard } from '@/components/shared/GlassCard'
import { reservedSlugsSchema } from '@/lib/reserved-slugs'
import { Loader2, AlertTriangle, CheckCircle, XCircle, Save, Info } from 'lucide-react'

const boutiqueSchema = z.object({
  name: z.string().min(3, 'Le nom de la boutique est requis'),
  slug: z.string()
    .min(3, 'Le slug doit contenir au moins 3 caractères')
    .regex(/^[a-z0-9-]+$/, 'Le slug ne peut contenir que des lettres minuscules, chiffres et tirets'),
  slogan: z.string().max(100, 'Le slogan ne peut pas dépasser 100 caractères').optional().or(z.literal('')),
  whatsapp: z.string().min(8, 'Numéro WhatsApp invalide'),
}).refine(
  (data) => reservedSlugsSchema.safeParse(data.slug).success,
  {
    path: ['slug'],
    message: 'Ce nom est réservé, veuillez en choisir un autre',
  }
)

type BoutiqueFormData = z.infer<typeof boutiqueSchema>

interface StoreData {
  id: string
  name: string
  slug: string
  slogan: string | null
  whatsapp: string
}

interface BoutiqueFormProps {
  store: StoreData
}

export function BoutiqueForm({ store }: BoutiqueFormProps) {
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(true)
  const [checkingSlug, setCheckingSlug] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<BoutiqueFormData>({
    resolver: zodResolver(boutiqueSchema) as any,
    defaultValues: {
      name: store.name,
      slug: store.slug,
      slogan: store.slogan || '',
      whatsapp: store.whatsapp,
    },
  })

  const slugValue = watch('slug')
  const isSlugChanged = slugValue !== store.slug

  // Vérification de la disponibilité du slug
  useEffect(() => {
    if (!slugValue) {
      setSlugAvailable(null)
      return
    }

    if (slugValue === store.slug) {
      setSlugAvailable(true)
      return
    }

    if (slugValue.length < 3 || !/^[a-z0-9-]+$/.test(slugValue)) {
      setSlugAvailable(null)
      return
    }

    const timer = setTimeout(async () => {
      setCheckingSlug(true)
      try {
        const res = await fetch(`/api/stores/check-slug?slug=${encodeURIComponent(slugValue)}`)
        const data = await res.json()
        setSlugAvailable(Boolean(data.available))
      } catch {
        setSlugAvailable(null)
      } finally {
        setCheckingSlug(false)
      }
    }, 400) // Debounce

    return () => clearTimeout(timer)
  }, [slugValue, store.slug])

  const onSubmit = async (data: BoutiqueFormData) => {
    if (isSlugChanged && slugAvailable === false) {
      setError("Le slug choisi n'est pas disponible.")
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const { error: updateError } = await supabase
        .from('stores')
        .update({
          name: data.name.trim(),
          slug: data.slug.toLowerCase().trim(),
          slogan: data.slogan?.trim() || null,
          whatsapp: data.whatsapp.trim(),
        })
        .eq('id', store.id)

      if (updateError) throw updateError

      setSuccess(true)
      router.refresh()
      
      // Masquer le message de succès après 4 secondes
      setTimeout(() => setSuccess(false), 4000)
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Une erreur est survenue lors de la mise à jour de la boutique.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
      {success && (
        <div className="p-4 rounded-lg bg-success/10 border border-success/20 text-sm text-emerald-400 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 shrink-0" />
          <span>Vos modifications ont été enregistrées avec succès.</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-lg bg-danger/10 border border-danger/20 text-sm text-red-400 flex items-center gap-2">
          <XCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {isSlugChanged && (
        <div className="p-4 rounded-lg bg-warning/10 border border-warning/20 text-sm text-amber-400 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Attention au changement d'URL</p>
            <p className="mt-1 text-xs text-amber-500/90 leading-relaxed">
              Si vous modifiez l'URL de votre boutique, l'ancien lien <span className="font-mono bg-white/5 px-1 py-0.5 rounded">shop.rohaty.com/{store.slug}</span> ne sera plus accessible. Vos clients devront utiliser la nouvelle URL.
            </p>
          </div>
        </div>
      )}

      <GlassCard className="p-6 space-y-6">
        {/* Nom de la boutique */}
        <div>
          <label className="block text-xs font-semibold tracking-widest uppercase text-text-secondary mb-2">
            Nom de la boutique *
          </label>
          <input
            type="text"
            placeholder="Ex: Hafsa Fashion"
            {...register('name')}
            className="w-full px-4 py-3 rounded-lg bg-bg-input border border-white/10 text-white placeholder-text-muted focus:border-primary/50 focus:shadow-[0_0_0_3px_rgba(37,99,235,0.15)] outline-none transition-all text-sm"
          />
          {errors.name && (
            <p className="text-xs text-red-400 mt-1.5">{errors.name.message}</p>
          )}
        </div>

        {/* Slogan */}
        <div>
          <label className="block text-xs font-semibold tracking-widest uppercase text-text-secondary mb-2">
            Slogan / Courte description
          </label>
          <input
            type="text"
            placeholder="Ex: Mode & Accessoires chics pour tous"
            {...register('slogan')}
            className="w-full px-4 py-3 rounded-lg bg-bg-input border border-white/10 text-white placeholder-text-muted focus:border-primary/50 focus:shadow-[0_0_0_3px_rgba(37,99,235,0.15)] outline-none transition-all text-sm"
          />
          {errors.slogan && (
            <p className="text-xs text-red-400 mt-1.5">{errors.slogan.message}</p>
          )}
        </div>

        {/* URL Slug */}
        <div>
          <label className="block text-xs font-semibold tracking-widest uppercase text-text-secondary mb-2">
            Lien personnalisé de la boutique *
          </label>
          <div className="flex">
            <div className="bg-bg-surface px-4 py-3 rounded-l-lg border border-r-0 border-white/10 text-text-secondary text-sm flex items-center font-mono">
              shop.rohaty.com/
            </div>
            <input
              type="text"
              placeholder="ma-boutique"
              {...register('slug')}
              className="flex-1 w-full bg-bg-input border border-white/10 rounded-r-lg px-4 py-3 text-white placeholder-text-muted focus:border-primary/50 focus:shadow-[0_0_0_3px_rgba(37,99,235,0.15)] outline-none transition-all text-sm font-mono"
            />
          </div>

          {checkingSlug && (
            <p className="text-xs text-text-secondary mt-1.5 flex items-center gap-1">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Vérification de la disponibilité...
            </p>
          )}
          {isSlugChanged && slugAvailable === true && (
            <p className="text-success text-xs mt-1.5 flex items-center gap-1 font-semibold">
              <CheckCircle size={14} /> Cette adresse est disponible
            </p>
          )}
          {isSlugChanged && slugAvailable === false && (
            <p className="text-danger text-xs mt-1.5 flex items-center gap-1 font-semibold">
              <XCircle size={14} /> Cette adresse est déjà prise ou réservée
            </p>
          )}
          {errors.slug && (
            <p className="text-xs text-red-400 mt-1.5">{errors.slug.message}</p>
          )}
        </div>

        {/* Numéro WhatsApp */}
        <div>
          <label className="block text-xs font-semibold tracking-widest uppercase text-text-secondary mb-2">
            Numéro WhatsApp de réception des commandes *
          </label>
          <input
            type="text"
            placeholder="Ex: +25377196132"
            {...register('whatsapp')}
            className="w-full px-4 py-3 rounded-lg bg-bg-input border border-white/10 text-white placeholder-text-muted focus:border-primary/50 focus:shadow-[0_0_0_3px_rgba(37,99,235,0.15)] outline-none transition-all text-sm"
          />
          <div className="flex items-start gap-1.5 text-xs text-text-muted mt-2">
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            <span>Indiquez l'indicatif pays (ex: +253 pour Djibouti). Ce numéro recevra les commandes des acheteurs.</span>
          </div>
          {errors.whatsapp && (
            <p className="text-xs text-red-400 mt-1.5">{errors.whatsapp.message}</p>
          )}
        </div>
      </GlassCard>

      {/* Bouton Enregistrer */}
      <div className="flex justify-end">
        <GradientButton
          type="submit"
          variant="primary"
          className="w-full sm:w-auto px-8 py-3.5"
          disabled={loading || (isSlugChanged && slugAvailable === false)}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Enregistrement...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Enregistrer les modifications
            </>
          )}
        </GradientButton>
      </div>
    </form>
  )
}
