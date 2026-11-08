// app/dashboard/page.tsx
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
        <h1 className="text-2xl md:text-3xl font-extrabold font-heading text-slate-900 tracking-tight">
          Bonjour, {firstName} 👋
        </h1>
        <p className="text-slate-600 text-sm mt-1">
          Bienvenue dans votre espace de gestion. Voici un aperçu de votre boutique aujourd&apos;hui.
        </p>
      </div>

      {/* Grille de stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Produits */}
        <GlassCard className="p-6 flex flex-col justify-between h-48 bg-white border border-slate-200 shadow-xs">
          <div>
            <div className="flex justify-between items-start mb-3">
              <span className="p-2.5 rounded-xl bg-blue-50 text-[#2563EB]">
                <ShoppingBag className="w-5 h-5" />
              </span>
              <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                Produits
              </span>
            </div>
            <h3 className="text-3xl font-extrabold text-slate-900 font-heading">
              {publishedProducts}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              produits publiés sur {totalProducts} au total
            </p>
          </div>
          <Link
            href="/dashboard/produits"
            className="flex items-center gap-1.5 text-xs font-bold text-[#2563EB] hover:text-[#1D4ED8] transition-colors group mt-4"
          >
            Gérer mes produits
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </GlassCard>

        {/* Card 2: Statut boutique */}
        <GlassCard className="p-6 flex flex-col justify-between h-48 bg-white border border-slate-200 shadow-xs">
          <div>
            <div className="flex justify-between items-start mb-3">
              <span className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
                <Eye className="w-5 h-5" />
              </span>
              <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                Statut
              </span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <h3 className="text-xl font-extrabold text-slate-900 font-heading">
                Boutique EN LIGNE
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1.5">
              Votre vitrine publique est accessible par vos clients
            </p>
          </div>
          <Link
            href={`/${storeSlug}`}
            target="_blank"
            className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors group mt-4"
          >
            Visiter la boutique
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </GlassCard>

        {/* Card 3: Lien de partage */}
        <GlassCard className="p-6 flex flex-col justify-between h-48 bg-white border border-slate-200 shadow-xs">
          <div>
            <div className="flex justify-between items-start mb-3">
              <span className="p-2.5 rounded-xl bg-blue-50 text-[#2563EB]">
                <LinkIcon className="w-5 h-5" />
              </span>
              <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                Partage
              </span>
            </div>
            <p className="text-sm font-bold text-slate-900 truncate font-mono">
              {displayStoreUrl}
            </p>
            <p className="text-xs text-slate-500 mt-1.5">
              Partagez ce lien sur vos réseaux sociaux (Instagram, WhatsApp, TikTok)
            </p>
          </div>
          <div className="mt-4 flex justify-between items-center pt-2 border-t border-slate-100">
            <span className="text-xs text-slate-400 font-medium">Lien public</span>
            <CopyButton text={absoluteStoreUrl} />
          </div>
        </GlassCard>
      </div>

      {/* WhatsApp Frame */}
      <div className="p-6 rounded-2xl border border-emerald-200 bg-emerald-50/50 relative overflow-hidden shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <span className="p-3 rounded-xl bg-emerald-100 text-emerald-700 shrink-0">
              <Phone className="w-6 h-6" />
            </span>
            <div>
              <h3 className="text-base font-bold text-slate-900 font-heading">
                Numéro de réception WhatsApp
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Toutes les commandes de vos clients sont transmises directement sur :
              </p>
              <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-emerald-200 text-emerald-800 text-xs font-bold shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>{whatsappNumber}</span>
              </div>
            </div>
          </div>
          <Link
            href="/dashboard/boutique"
            className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg text-xs font-bold bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 transition shadow-2xs text-center shrink-0"
          >
            Modifier le numéro
          </Link>
        </div>
      </div>
    </div>
  )
}
