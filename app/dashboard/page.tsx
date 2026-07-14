// app/dashboard/page.tsx
// Page principale du dashboard — utilise le cache React partagé depuis le layout
//
// AVANT : refaisait auth.getUser() + users.select + stores.select('*') + 2 counts séparés
// APRÈS : getCurrentUser() et getCurrentStore() réutilisent le cache du layout (0 appel réseau)
//          + les counts produits fusionnés en 1 seule query

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser, getCurrentStore } from '@/lib/supabase/dashboard-cache'
import { GlassCard } from '@/components/shared/GlassCard'
import { CopyButton } from '@/components/dashboard/CopyButton'
import {
  ShoppingBag,
  Eye,
  Link as LinkIcon,
  Phone,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react'
import Link from 'next/link'

export default async function DashboardPage() {
  // ✅ Utilise le cache React — pas de double appel réseau
  const user = await getCurrentUser()
  if (!user) redirect('/connexion')

  const store = await getCurrentStore(user.id)

  const firstName = (
    user.user_metadata?.full_name || 'Commerçant'
  )
    .trim()
    .split(/\s+/)[0]

  const storeId = store?.id || null
  const storeSlug = store?.slug || ''
  const whatsappNumber = store?.whatsapp || 'Non configuré'

  // ✅ 1 seule query pour total + published (au lieu de 2 queries count séparées)
  let totalProducts = 0
  let publishedProducts = 0

  if (storeId) {
    const supabase = await createClient()
    const { data: productFlags } = await supabase
      .from('products')
      .select('is_published')
      .eq('store_id', storeId)

    totalProducts = productFlags?.length || 0
    publishedProducts = productFlags?.filter((p) => p.is_published).length || 0
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const absoluteStoreUrl = `${appUrl}/${storeSlug}`
  const displayStoreUrl = `shop.rohaty.com/${storeSlug}`

  return (
    <div className="space-y-8">
      {/* Message de bienvenue */}
      <div>
        <h1 className="text-3xl md:text-4xl font-bold font-heading text-white">
          Bonjour, {firstName} 👋
        </h1>
        <p className="text-text-secondary text-sm mt-2">
          Bienvenue dans votre espace de gestion. Voici un aperçu de votre activité aujourd&apos;hui.
        </p>
      </div>

      {/* Grille de stats */}
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
                Toutes les commandes de vos clients sont envoyées sur :
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
