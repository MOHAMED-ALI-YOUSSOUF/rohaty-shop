// app/super-admin/page.tsx
import Link from 'next/link'
import { getAdminSupabase } from '@/lib/auth/admin'
import {
  Store,
  Users,
  ShoppingBag,
  Layers,
  Image as ImageIcon,
  ArrowRight,
  ExternalLink,
  Plus,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

interface StoreItem {
  id: string
  name: string
  slug: string
  whatsapp: string
  created_at: string
}

export default async function SuperAdminDashboardPage() {
  const supabase = getAdminSupabase()

  // Requêtes statistiques en parallèle via service_role
  const [
    storesRes,
    productsRes,
    categoriesRes,
    activeBannersRes,
    totalBannersRes,
    authUsersRes,
  ] = await Promise.all([
    supabase.from('stores').select('id, name, slug, whatsapp, created_at', { count: 'exact' }).order('created_at', { ascending: false }),
    supabase.from('products').select('*', { count: 'exact', head: true }),
    supabase.from('categories').select('*', { count: 'exact', head: true }),
    supabase.from('banners').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('banners').select('*', { count: 'exact', head: true }),
    supabase.auth.admin.listUsers({ perPage: 1000 }),
  ])

  const totalStores = storesRes.count || 0
  const totalProducts = productsRes.count || 0
  const totalCategories = categoriesRes.count || 0
  const activeBanners = activeBannersRes.count || 0
  const totalBanners = totalBannersRes.count || 0
  const totalUsers = authUsersRes.data?.users?.length || totalStores

  const recentStores = (storesRes.data as StoreItem[])?.slice(0, 5) || []

  const stats = [
    {
      label: 'Boutiques créées',
      value: totalStores,
      sublabel: 'Boutiques actives sur Rohaty',
      icon: Store,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-100',
    },
    {
      label: 'Vendeurs inscrits',
      value: totalUsers,
      sublabel: 'Comptes marchands',
      icon: Users,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-100',
    },
    {
      label: 'Produits en ligne',
      value: totalProducts,
      sublabel: 'Catalogue global',
      icon: ShoppingBag,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-100',
    },
    {
      label: 'Catégories officielles',
      value: totalCategories,
      sublabel: 'Standardisées marketplace',
      icon: Layers,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-100',
      href: '/super-admin/categories',
    },
    {
      label: 'Bannières actives',
      value: activeBanners,
      sublabel: `${totalBanners} bannière(s) au total`,
      icon: ImageIcon,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-100',
      href: '/super-admin/banners',
    },
  ]

  return (
    <div className="space-y-8">
      {/* ── Entête ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Tableau de bord Super Admin
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Supervision globale de la plateforme Rohaty Shop et gestion centralisée.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Link
            href="/super-admin/banners"
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition shadow-xs"
          >
            <Plus className="w-3.5 h-3.5 text-blue-600" />
            Nouvelle bannière
          </Link>
          <Link
            href="/super-admin/categories"
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white transition shadow-xs"
          >
            <Plus className="w-3.5 h-3.5 text-white" />
            Nouvelle catégorie
          </Link>
        </div>
      </div>

      {/* ── Cartes Statistiques ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {stats.map((s) => {
          const Icon = s.icon
          const CardContent = (
            <div
              className={`p-5 rounded-xl bg-white border ${s.borderColor} shadow-xs hover:shadow-md transition-shadow relative overflow-hidden`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {s.label}
                </span>
                <div className={`p-2 rounded-lg ${s.bgColor}`}>
                  <Icon className={`w-4 h-4 ${s.color}`} />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-extrabold text-slate-900">{s.value}</div>
                <div className="text-xs text-slate-500 mt-0.5">{s.sublabel}</div>
              </div>
            </div>
          )

          return s.href ? (
            <Link key={s.label} href={s.href} className="block group">
              {CardContent}
            </Link>
          ) : (
            <div key={s.label}>{CardContent}</div>
          )
        })}
      </div>

      {/* ── Actions Rapides & Accès direct ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3">
              <Layers className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-slate-900">
              Gestion centralisée des catégories
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Ajoutez, renommez ou réorganisez les catégories officielles partagées par toutes les boutiques. Les vendeurs ne peuvent plus créer de catégories libres.
            </p>
          </div>
          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              {totalCategories} catégories enregistrées
            </span>
            <Link
              href="/super-admin/categories"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2563EB] hover:text-[#1D4ED8]"
            >
              Gérer les catégories <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
              <ImageIcon className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-slate-900">
              Gestion des bannières marketplace
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Téléversez directement vos images publicitaires et promotionnelles via Cloudinary. Elles s&apos;affichent automatiquement en carrousel sur la page d&apos;accueil.
            </p>
          </div>
          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              {activeBanners} active(s) sur {totalBanners}
            </span>
            <Link
              href="/super-admin/banners"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2563EB] hover:text-[#1D4ED8]"
            >
              Gérer les bannières <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* ── Dernières boutiques inscrites ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Dernières boutiques créées</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Les 5 boutiques les plus récentes sur Rohaty Shop
            </p>
          </div>
          <Link
            href="/"
            target="_blank"
            className="text-xs font-semibold text-[#2563EB] hover:underline inline-flex items-center gap-1"
          >
            Explorer la vitrine <ExternalLink className="w-3 h-3" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-5">Nom de la boutique</th>
                <th className="py-3 px-5">Slug / URL</th>
                <th className="py-3 px-5">WhatsApp</th>
                <th className="py-3 px-5">Date d&apos;inscription</th>
                <th className="py-3 px-5 text-right">Lien direct</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentStores.map((st) => (
                <tr key={st.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-5 font-bold text-slate-900">{st.name}</td>
                  <td className="py-3 px-5 font-mono text-slate-600">/{st.slug}</td>
                  <td className="py-3 px-5 text-slate-600 font-medium">{st.whatsapp || '—'}</td>
                  <td className="py-3 px-5 text-slate-500">
                    {st.created_at
                      ? new Date(st.created_at).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })
                      : '—'}
                  </td>
                  <td className="py-3 px-5 text-right">
                    <Link
                      href={`/${st.slug}`}
                      target="_blank"
                      className="inline-flex items-center gap-1 text-[#2563EB] hover:underline font-semibold"
                    >
                      Ouvrir <ExternalLink className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

