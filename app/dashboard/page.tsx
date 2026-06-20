// app/dashboard/page.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { GlassCard } from '@/components/shared/GlassCard'
import { CopyButton } from '@/components/dashboard/CopyButton'
import { ShoppingBag, Eye, Link as LinkIcon, Phone, ArrowRight, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()

  // 1. Récupérer l'utilisateur
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/connexion')
  }

  // 2. Récupérer le profil utilisateur
  const { data: userProfile } = await supabase
    .from('users')
    .select('full_name')
    .eq('id', user.id)
    .single()

  const firstName = (userProfile?.full_name || user.user_metadata?.full_name || 'Commerçant')
    .trim()
    .split(/\s+/)[0]

  // 3. Récupérer la boutique
  const { data: store } = await supabase
    .from('stores')
    .select('*')
    .eq('owner_id', user.id)
    .single()

  // Si l'utilisateur n'a pas de boutique, on peut lui afficher un avertissement ou des valeurs par défaut
  const storeName = store?.name || 'Ma Boutique'
  const storeSlug = store?.slug || ''
  const storeId = store?.id || null
  const whatsappNumber = store?.whatsapp || 'Non configuré'

  // 4. Compter les produits de la boutique
  let totalProducts = 0
  let publishedProducts = 0

  if (storeId) {
    const { count: total } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('store_id', storeId)

    const { count: published } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('store_id', storeId)
      .eq('is_published', true)

    totalProducts = total || 0
    publishedProducts = published || 0
  }

  // Urls de la boutique
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const absoluteStoreUrl = `${appUrl}/${storeSlug}`
  const displayStoreUrl = `shop.rohaty.com/${storeSlug}`

  return (
    <div className="space-y-8">
      {/* Welcome Message */}
      <div>
        <h1 className="text-3xl md:text-4xl font-bold font-heading text-white">
          Bonjour, {firstName} 👋
        </h1>
        <p className="text-text-secondary text-sm mt-2">
          Bienvenue dans votre espace de gestion. Voici un aperçu de votre activité aujourd'hui.
        </p>
      </div>

      {/* Stats / Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Produits */}
        <GlassCard className="p-6 flex flex-col justify-between h-48">
          <div>
            <div className="flex justify-between items-start mb-4">
              <span className="p-3 rounded-lg bg-primary/10 text-primary">
                <ShoppingBag className="w-6 h-6" />
              </span>
              <span className="text-xs font-semibold tracking-wider text-text-muted uppercase">
                Produits
              </span>
            </div>
            <h3 className="text-3xl font-bold text-white font-heading">
              {publishedProducts}
            </h3>
            <p className="text-xs text-text-secondary mt-1">
              produits publiés sur {totalProducts} au total
            </p>
          </div>
          <Link
            href="/dashboard/produits"
            className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-white transition-colors group mt-4"
          >
            Gérer mes produits
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </GlassCard>

        {/* Card 2: Statut boutique */}
        <GlassCard className="p-6 flex flex-col justify-between h-48">
          <div>
            <div className="flex justify-between items-start mb-4">
              <span className="p-3 rounded-lg bg-success/10 text-success animate-pulse">
                <Eye className="w-6 h-6" />
              </span>
              <span className="text-xs font-semibold tracking-wider text-text-muted uppercase">
                Statut
              </span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-success" />
              <h3 className="text-xl font-bold text-white font-heading">
                Boutique EN LIGNE
              </h3>
            </div>
            <p className="text-xs text-text-secondary mt-2">
              Votre vitrine publique est accessible par tout le monde
            </p>
          </div>
          <Link
            href={`/${storeSlug}`}
            target="_blank"
            className="flex items-center gap-1.5 text-xs font-semibold text-success hover:text-white transition-colors group mt-4"
          >
            Visiter la boutique
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </GlassCard>

        {/* Card 3: Lien de partage */}
        <GlassCard className="p-6 flex flex-col justify-between h-48">
          <div>
            <div className="flex justify-between items-start mb-4">
              <span className="p-3 rounded-lg bg-accent/10 text-accent">
                <LinkIcon className="w-6 h-6" />
              </span>
              <span className="text-xs font-semibold tracking-wider text-text-muted uppercase">
                Partage
              </span>
            </div>
            <p className="text-sm font-bold text-white truncate font-mono">
              {displayStoreUrl}
            </p>
            <p className="text-xs text-text-secondary mt-2">
              Partagez ce lien sur vos réseaux sociaux (Instagram, WhatsApp, TikTok)
            </p>
          </div>
          <div className="mt-4 flex justify-between items-center">
            <span className="text-xs text-text-muted">Lien public</span>
            <CopyButton text={absoluteStoreUrl} />
          </div>
        </GlassCard>
      </div>

      {/* WhatsApp Frame */}
      <GlassCard className="p-6 border border-success/20 bg-success/5 relative overflow-hidden">
        {/* Decorative WhatsApp bubble background elements */}
        <div className="absolute right-[-20px] bottom-[-20px] w-32 h-32 rounded-full bg-success/5 blur-2xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <span className="p-3 rounded-lg bg-success/15 text-success shrink-0">
              <Phone className="w-6 h-6" />
            </span>
            <div>
              <h3 className="text-lg font-bold text-white font-heading">
                Numéro de réception WhatsApp
              </h3>
              <p className="text-sm text-text-secondary mt-1">
                Toutes les commandes de vos clients sont envoyées sous forme de messages pré-remplis sur :
              </p>
              <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-success/10 text-success text-sm font-bold">
                <span className="w-2 h-2 rounded-full bg-success animate-ping" />
                <span>{whatsappNumber}</span>
              </div>
            </div>
          </div>
          <Link
            href="/dashboard/boutique"
            className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg text-xs font-semibold bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-all text-center shrink-0 hover:scale-[1.02] active:scale-[0.98]"
          >
            Modifier le numéro
          </Link>
        </div>
      </GlassCard>
    </div>
  )
}
