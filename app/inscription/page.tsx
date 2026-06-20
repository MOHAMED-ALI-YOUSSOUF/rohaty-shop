'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import Link from 'next/link'
import { ArrowRight, CheckCircle, Loader2, XCircle } from 'lucide-react'

import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { reservedSlugsSchema } from '@/lib/reserved-slugs'

const step1Schema = z.object({
  full_name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  email: z.string().email('Email invalide'),
  password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
})

const step2Schema = z
  .object({
    store_name: z.string().min(3, 'Le nom de la boutique est requis'),
    slug: z.string()
      .min(3, 'Le slug doit contenir au moins 3 caractères')
      .regex(/^[a-z0-9-]+$/, 'Le slug ne peut contenir que des lettres minuscules, chiffres et tirets'),
    whatsapp: z.string().min(8, 'Numéro WhatsApp invalide'),
  })
  .refine(
    (data) => reservedSlugsSchema.safeParse(data.slug).success,
    {
      path: ['slug'],
      message: 'Ce nom est réservé, veuillez en choisir un autre',
    }
  )

type Step1Data = z.infer<typeof step1Schema>
type Step2Data = z.infer<typeof step2Schema>

export default function InscriptionPage() {
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null)
  const [checkingSlug, setCheckingSlug] = useState(false)

  const supabase = createClient()

  const step1Form = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    defaultValues: { full_name: '', email: '', password: '' },
  })

  const step2Form = useForm<Step2Data>({
    resolver: zodResolver(step2Schema),
    defaultValues: { store_name: '', slug: '', whatsapp: '' },
  })

  const checkSlugAvailability = async (slug: string) => {
    if (!slug || slug.length < 3) {
      setSlugAvailable(null)
      return
    }

    setCheckingSlug(true)
    try {
      const res = await fetch(`/api/stores/check-slug?slug=${encodeURIComponent(slug)}`)
      const data = await res.json()
      setSlugAvailable(Boolean(data.available))
    } catch {
      setSlugAvailable(null)
    } finally {
      setCheckingSlug(false)
    }
  }

  useEffect(() => {
    const subscription = step2Form.watch((value, { name }) => {
      if (name === 'slug' || name === 'store_name') {
        checkSlugAvailability(value.slug || '')
      }
    })
    return () => subscription.unsubscribe()
  }, [step2Form])

  const onStep1Submit = () => setStep(2)

  const onStep2Submit = async (data: Step2Data) => {
    if (slugAvailable === false) {
      setError("Le slug n'est pas disponible")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: step1Form.getValues('email'),
        password: step1Form.getValues('password'),
        options: { data: { full_name: step1Form.getValues('full_name') } },
      })

      if (authError) throw authError

      const { error: storeError } = await supabase.from('stores').insert({
        owner_id: authData.user!.id,
        name: data.store_name,
        slug: data.slug,
        whatsapp: data.whatsapp,
      })

      if (storeError) throw storeError

      window.location.href = '/dashboard'
    } catch (err: any) {
      setError(err?.message || 'Une erreur est survenue lors de la création')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">Créer ma boutique</h1>
          <p className="text-text-secondary mt-2">Étape {step} sur 2</p>
        </div>

        <div className="h-1 bg-bg-surface rounded-full mb-8 overflow-hidden">
          <div className={cn('h-full bg-primary transition-all duration-300', step === 1 ? 'w-1/2' : 'w-full')} />
        </div>

        {step === 1 ? (
          <form onSubmit={step1Form.handleSubmit(onStep1Submit)} className="space-y-6">
            <div>
              <label className="block text-sm mb-2">Nom complet</label>
              <input {...step1Form.register('full_name')} className="w-full bg-bg-input border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-primary" placeholder="Ex : Mohamed Ali Youssouf" />
            </div>

            <div>
              <label className="block text-sm mb-2">Email</label>
              <input type="email" {...step1Form.register('email')} className="w-full bg-bg-input border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-primary" placeholder="Ex : wizzimed@exemple.com" />
            </div>

            <div>
              <label className="block text-sm mb-2">Mot de passe</label>
              <input type="password" {...step1Form.register('password')} className="w-full bg-bg-input border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-primary" />
            </div>

            <button type="submit" className="w-full bg-primary hover:bg-blue-600 py-3.5 rounded-lg font-medium flex items-center justify-center gap-2 transition">
              Continuer <ArrowRight size={18} />
            </button>
          </form>
        ) : (
          <form onSubmit={step2Form.handleSubmit(onStep2Submit)} className="space-y-6">
            <div>
              <label className="block text-sm mb-2">Nom de la boutique</label>
              <input {...step2Form.register('store_name')} className="w-full bg-bg-input border border-white/10 rounded-lg px-4 py-3" placeholder="Ex : Hafsa Fashion" />
            </div>

            <div>
              <label className="block text-sm mb-2">URL de votre boutique</label>
              <div className="flex">
                <div className="bg-bg-surface px-4 py-3 rounded-l-lg border border-r-0 border-white/10 text-text-secondary">shop.rohaty.com/</div>
                <input {...step2Form.register('slug')} className="flex-1 bg-bg-input border border-white/10 rounded-r-lg px-4 py-3" placeholder="hafsa-fashion" />
              </div>

              {checkingSlug && <p className="text-sm text-text-secondary mt-1">Vérification...</p>}
              {slugAvailable === true && (
                <p className="text-success text-sm mt-1 flex items-center gap-1">
                  <CheckCircle size={16} /> Disponible
                </p>
              )}
              {slugAvailable === false && (
                <p className="text-danger text-sm mt-1 flex items-center gap-1">
                  <XCircle size={16} /> Déjà pris
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm mb-2">Numéro WhatsApp</label>
              <input {...step2Form.register('whatsapp')} className="w-full bg-bg-input border border-white/10 rounded-lg px-4 py-3" placeholder="Ex : +25377196132" />
            </div>

            {error && <p className="text-danger text-sm">{error}</p>}

            <div className="flex gap-3">
              <button type="button" onClick={() => setStep(1)} className="flex-1 py-3 border border-white/20 rounded-lg hover:bg-white/5">
                Retour
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 bg-primary hover:bg-blue-600 text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="animate-spin" /> : 'Créer ma boutique'}
              </button>
            </div>
          </form>
        )}

        <p className="text-center text-text-secondary mt-8">
          Déjà un compte ?{' '}
          <Link href="/connexion" className="text-primary hover:underline">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  )
}
