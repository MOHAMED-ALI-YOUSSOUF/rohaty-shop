// app/connexion/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { GradientButton } from '@/components/shared/GradientButton'
import { GlassCard } from '@/components/shared/GlassCard'
import { Mail, Lock, ArrowRight, Loader2, AlertCircle } from 'lucide-react'
import Link from 'next/link'

const loginSchema = z.object({
  email: z.string().email('Adresse email invalide'),
  password: z.string().min(1, 'Le mot de passe est requis'),
})

type LoginData = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginData) => {
    setError(null)
    setLoading(true)

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })

      console.log('AUTH RESULT', data)
      console.log('AUTH ERROR', authError)
      if (authError) {
        setError("Adresse e-mail ou mot de passe incorrect.")
        setLoading(false)
        return
      }

      router.replace('/dashboard')
      setLoading(false)
    } catch (err: any) {
      setError('Une erreur inattendue est survenue.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden bg-[#0F172A]">
      {/* Background gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-900/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-900/20 blur-[120px] pointer-events-none" />

      {/* Logo */}
      <div className="mb-8 text-center z-10">
        <Link href="/" className="font-heading text-3xl font-extrabold tracking-tight">
          Rohaty <span className="gradient-text">Shop</span>
        </Link>
        <p className="text-text-secondary text-sm mt-2">
          Accédez à votre tableau de bord de boutique
        </p>
      </div>

      <GlassCard className="w-full max-w-md p-8 z-10">
        <h2 className="text-2xl font-bold mb-6 font-heading text-white">
          Connexion
        </h2>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-danger/10 border border-danger/20 flex items-start gap-3 text-sm text-red-400">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Email */}
          <div>
            <label className="block text-xs font-semibold tracking-widest uppercase text-text-secondary mb-2">
              Adresse e-mail
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
              <input
                type="email"
                placeholder="nom@exemple.com"
                {...register('email')}
                className="w-full pl-10 pr-4 py-3 rounded-lg bg-bg-input border border-white/10 text-white placeholder-text-muted focus:border-primary/50 focus:shadow-[0_0_0_3px_rgba(37,99,235,0.15)] outline-none transition-all"
              />
            </div>
            {errors.email && (
              <p className="text-xs text-red-400 mt-1.5">{errors.email.message}</p>
            )}
          </div>

          {/* Mot de passe */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-xs font-semibold tracking-widest uppercase text-text-secondary">
                Mot de passe
              </label>
              {/* Optionnel MVP: Lien mot de passe oublié */}
              {/* 
              <Link href="#" className="text-xs text-primary hover:underline">
                Mot de passe oublié ?
              </Link>
              */}
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
              <input
                type="password"
                placeholder="••••••••"
                {...register('password')}
                className="w-full pl-10 pr-4 py-3 rounded-lg bg-bg-input border border-white/10 text-white placeholder-text-muted focus:border-primary/50 focus:shadow-[0_0_0_3px_rgba(37,99,235,0.15)] outline-none transition-all"
              />
            </div>
            {errors.password && (
              <p className="text-xs text-red-400 mt-1.5">{errors.password.message}</p>
            )}
          </div>

          <GradientButton type="submit" variant="primary" className="w-full py-3.5 mt-2" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-1 animate-spin" /> Connexion...
              </>
            ) : (
              <>
                Se connecter <ArrowRight className="w-4 h-4 ml-1" />
              </>
            )}
          </GradientButton>
        </form>
      </GlassCard>

      {/* Footer link */}
      <p className="mt-8 text-center text-sm text-text-secondary z-10">
        Nouveau sur Rohaty Shop ?{' '}
        <Link href="/inscription" className="text-primary hover:underline font-medium">
          Créer un compte
        </Link>
      </p>
    </div>
  )
}
