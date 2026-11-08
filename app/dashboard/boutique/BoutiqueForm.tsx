// app/dashboard/boutique/BoutiqueForm.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
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
    }, 400)

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
      setTimeout(() => setSuccess(false), 4000)
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Une erreur est survenue lors de la mise à jour de la boutique.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl font-sans">
      {success && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-800 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 shrink-0 text-emerald-600" />
          <span>Vos modifications ont été enregistrées avec succès.</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 flex items-center gap-2">
          <XCircle className="w-5 h-5 shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {isSlugChanged && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-800 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-amber-600" />
          <div>
            <p className="font-bold">Attention au changement d&apos;URL</p>
            <p className="mt-1 text-xs text-amber-700 leading-relaxed">
              Si vous modifiez l&apos;URL de votre boutique, l&apos;ancien lien <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-amber-200">shop.rohaty.com/{store.slug}</span> ne sera plus accessible.
            </p>
          </div>
        </div>
      )}

      <GlassCard className="p-6 space-y-6 bg-white border border-slate-200 shadow-xs">
        {/* Nom de la boutique */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
            Nom de la boutique *
          </label>
          <input
            type="text"
            placeholder="Ex: Hafsa Fashion"
            {...register('name')}
            className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] outline-hidden transition text-sm shadow-2xs"
          />
          {errors.name && (
            <p className="text-xs text-red-600 mt-1.5">{errors.name.message}</p>
          )}
        </div>

        {/* Slogan */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
            Slogan / Courte description
          </label>
          <input
            type="text"
            placeholder="Ex: Mode & Accessoires chics pour tous"
            {...register('slogan')}
            className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] outline-hidden transition text-sm shadow-2xs"
          />
          {errors.slogan && (
            <p className="text-xs text-red-600 mt-1.5">{errors.slogan.message}</p>
          )}
        </div>

        {/* URL Slug */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
            Lien personnalisé de la boutique *
          </label>
          <div className="flex">
            <div className="bg-slate-100 px-4 py-2.5 rounded-l-xl border border-r-0 border-slate-300 text-slate-600 text-xs font-semibold flex items-center font-mono">
              shop.rohaty.com/
            </div>
            <input
              type="text"
              placeholder="ma-boutique"
              {...register('slug')}
              className="flex-1 w-full bg-white border border-slate-300 rounded-r-xl px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] outline-hidden transition text-sm font-mono shadow-2xs"
            />
          </div>

          {checkingSlug && (
            <p className="text-xs text-slate-500 mt-1.5 flex items-center gap-1">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Vérification de la disponibilité...
            </p>
          )}
          {isSlugChanged && slugAvailable === true && (
            <p className="text-emerald-600 text-xs mt-1.5 flex items-center gap-1 font-semibold">
              <CheckCircle size={14} /> Cette adresse est disponible
            </p>
          )}
          {isSlugChanged && slugAvailable === false && (
            <p className="text-red-600 text-xs mt-1.5 flex items-center gap-1 font-semibold">
              <XCircle size={14} /> Cette adresse est déjà prise ou réservée
            </p>
          )}
          {errors.slug && (
            <p className="text-xs text-red-600 mt-1.5">{errors.slug.message}</p>
          )}
        </div>

        {/* Numéro WhatsApp */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
            Numéro WhatsApp de réception des commandes *
          </label>
          <input
            type="text"
            placeholder="Ex: +25377196132"
            {...register('whatsapp')}
            className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] outline-hidden transition text-sm shadow-2xs"
          />
          <div className="flex items-start gap-1.5 text-xs text-slate-500 mt-2">
            <Info className="w-4 h-4 shrink-0 mt-0.5 text-slate-400" />
            <span>Indiquez l&apos;indicatif pays (ex: +253 pour Djibouti). Ce numéro recevra les commandes des acheteurs.</span>
          </div>
          {errors.whatsapp && (
            <p className="text-xs text-red-600 mt-1.5">{errors.whatsapp.message}</p>
          )}
        </div>
      </GlassCard>

      {/* Bouton Enregistrer */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading || (isSlugChanged && slugAvailable === false)}
          className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-bold bg-[#2563EB] hover:bg-[#1D4ED8] text-white transition shadow-xs flex items-center justify-center disabled:opacity-50"
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
        </button>
      </div>
    </form>
  )
}
