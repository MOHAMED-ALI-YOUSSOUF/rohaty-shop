// components/super-admin/AnalyticsDashboardClient.tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Users,
  Eye,
  Store,
  ShoppingBag,
  MessageCircle,
  TrendingUp,
  Search,
  Layers,
  ArrowUpRight,
  RefreshCw,
  Calendar,
} from 'lucide-react'
import { AnalyticsTimelineChart, type TimelineDataPoint } from '@/components/analytics/AnalyticsTimelineChart'
import { DeviceDonutChart } from '@/components/analytics/DeviceDonutChart'

interface AnalyticsSummary {
  uniqueVisitors: number
  uniqueSessions: number
  totalEvents: number
  pageViews: number
  storeViews: number
  productViews: number
  whatsappClicks: number
  searches: number
  conversionRate: number
}

interface TopStore {
  id: string
  name: string
  slug: string
  views: number
  whatsapp: number
}

interface TopProduct {
  id: string
  name: string
  price: number
  storeName: string
  storeSlug: string
  views: number
  whatsapp: number
}

interface TopItem {
  term?: string
  name?: string
  count: number
}

interface DeviceCounts {
  mobile: number
  desktop: number
  tablet: number
}

interface AnalyticsData {
  summary: AnalyticsSummary
  timeline: TimelineDataPoint[]
  topStores: TopStore[]
  topProducts: TopProduct[]
  devices: DeviceCounts
  topSearches: TopItem[]
  topCategories: TopItem[]
}

const PERIODS = [
  { label: "Aujourd'hui", value: 'today' },
  { label: '7 derniers jours', value: '7d' },
  { label: '30 derniers jours', value: '30d' },
  { label: '90 derniers jours', value: '90d' },
  { label: 'Tout', value: 'all' },
]

export function AnalyticsDashboardClient() {
  const [period, setPeriod] = useState('7d')
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async (selectedPeriod: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/analytics?period=${selectedPeriod}`)
      if (!res.ok) {
        throw new Error('Erreur lors du chargement des statistiques')
      }
      const json = await res.json()
      setData(json)
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData(period)
  }, [period])

  return (
    <div className="space-y-8 font-sans">
      {/* ── Header & Période ──────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Statistiques & Trafic
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Analyse détaillée des visites, conversions WhatsApp et tendances de la marketplace
          </p>
        </div>

        {/* Sélecteur de période */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl overflow-x-auto">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                period === p.value
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {p.label}
            </button>
          ))}
          <button
            onClick={() => fetchData(period)}
            title="Actualiser"
            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-white rounded-lg transition-colors ml-1"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* ── KPI Cards ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Visiteurs uniques */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Visiteurs</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#2563EB] flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {loading ? '...' : (data?.summary.uniqueVisitors ?? 0)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Appareils uniques</p>
        </div>

        {/* Pages vues */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pages vues</span>
            <div className="w-8 h-8 rounded-lg bg-cyan-50 text-[#06B6D4] flex items-center justify-center">
              <Eye className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {loading ? '...' : (data?.summary.pageViews ?? 0)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Affichages totaux</p>
        </div>

        {/* Visites boutiques */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Boutiques</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Store className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {loading ? '...' : (data?.summary.storeViews ?? 0)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Visites d&apos;espaces SaaS</p>
        </div>

        {/* Fiches produits */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Fiches vues</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {loading ? '...' : (data?.summary.productViews ?? 0)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Sheets & pages produit</p>
        </div>

        {/* Clics WhatsApp */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">WhatsApp</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <MessageCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600">
            {loading ? '...' : (data?.summary.whatsappClicks ?? 0)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Boutons commander</p>
        </div>

        {/* Taux de conversion */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Conversion</span>
            <div className="w-8 h-8 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {loading ? '...' : `${data?.summary.conversionRate ?? 0}%`}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">WhatsApp / Fiche vue</p>
        </div>
      </div>

      {/* ── Graphiques ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Évolution temporelle */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Évolution du trafic et des conversions
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Visites journalières et déclenchements de commandes WhatsApp
              </p>
            </div>
          </div>
          {loading ? (
            <div className="h-64 flex items-center justify-center text-slate-400 text-sm">
              <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Chargement du graphique...
            </div>
          ) : (
            <AnalyticsTimelineChart data={data?.timeline || []} />
          )}
        </div>

        {/* Répartition Appareils */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 mb-1">
              Répartition par appareil
            </h2>
            <p className="text-xs text-slate-500 mb-6">
              Types d&apos;écrans utilisés par les visiteurs
            </p>
            {loading ? (
              <div className="h-40 flex items-center justify-center text-slate-400 text-sm">
                <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Chargement...
              </div>
            ) : (
              <DeviceDonutChart devices={data?.devices || { mobile: 0, desktop: 0, tablet: 0 }} />
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 text-xs text-slate-500 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Données collectées de manière 100% anonyme</span>
          </div>
        </div>
      </div>

      {/* ── Classements Top Boutiques & Top Produits ───────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 10 Boutiques */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Top 10 des boutiques les plus consultées
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Classées par nombre de visites et intérêt commercial
              </p>
            </div>
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" /> Chargement...
            </div>
          ) : !data?.topStores || data.topStores.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              Aucune visite de boutique enregistrée pour le moment
            </div>
          ) : (
            <div className="divide-y divide-slate-100 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-slate-400 font-bold uppercase tracking-wider pb-2">
                    <th className="pb-3 font-semibold">Boutique</th>
                    <th className="pb-3 text-center font-semibold">Visites</th>
                    <th className="pb-3 text-center font-semibold">WhatsApp</th>
                    <th className="pb-3 text-right font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.topStores.map((st, idx) => (
                    <tr key={st.id || idx} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 pr-2">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 font-bold text-[10px] flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <span className="font-bold text-slate-900 truncate max-w-[160px]">
                            {st.name}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 text-center font-extrabold text-slate-800">
                        {st.views}
                      </td>
                      <td className="py-3 text-center font-extrabold text-emerald-600">
                        {st.whatsapp}
                      </td>
                      <td className="py-3 text-right">
                        {st.slug ? (
                          <Link
                            href={`/${st.slug}`}
                            target="_blank"
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-[#2563EB] hover:underline"
                          >
                            Voir <ArrowUpRight className="w-3 h-3" />
                          </Link>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Top 10 Produits */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Top 10 des produits les plus vus
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Classés par consultations de fiches et clics WhatsApp
              </p>
            </div>
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" /> Chargement...
            </div>
          ) : !data?.topProducts || data.topProducts.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              Aucune vue de fiche produit enregistrée pour le moment
            </div>
          ) : (
            <div className="divide-y divide-slate-100 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-slate-400 font-bold uppercase tracking-wider pb-2">
                    <th className="pb-3 font-semibold">Produit</th>
                    <th className="pb-3 text-center font-semibold">Vues</th>
                    <th className="pb-3 text-center font-semibold">WhatsApp</th>
                    <th className="pb-3 text-right font-semibold">Prix</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.topProducts.map((p, idx) => (
                    <tr key={p.id || idx} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 pr-2">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 font-bold text-[10px] flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <div>
                            <p className="font-bold text-slate-900 truncate max-w-[160px]">
                              {p.name}
                            </p>
                            {p.storeName && (
                              <p className="text-[10px] text-slate-400 truncate max-w-[160px]">
                                {p.storeName}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 text-center font-extrabold text-slate-800">
                        {p.views}
                      </td>
                      <td className="py-3 text-center font-extrabold text-emerald-600">
                        {p.whatsapp}
                      </td>
                      <td className="py-3 text-right font-black text-slate-900">
                        {new Intl.NumberFormat('fr-FR').format(p.price)} DJF
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── Recherches & Catégories ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top recherches */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#2563EB] flex items-center justify-center">
              <Search className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Recherches populaires</h2>
              <p className="text-xs text-slate-500">Mots-clés les plus recherchés sur le marketplace</p>
            </div>
          </div>

          {!data?.topSearches || data.topSearches.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">
              Aucune recherche enregistrée sur cette période
            </p>
          ) : (
            <div className="flex flex-wrap gap-2 pt-2">
              {data.topSearches.map((s, idx) => (
                <div
                  key={idx}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800"
                >
                  <span className="font-semibold">{s.term}</span>
                  <span className="px-1.5 py-0.5 rounded-full bg-blue-100 text-[#2563EB] font-bold text-[10px]">
                    {s.count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top catégories */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Catégories consultées</h2>
              <p className="text-xs text-slate-500">Rayons et filtres les plus sollicités</p>
            </div>
          </div>

          {!data?.topCategories || data.topCategories.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">
              Aucune catégorie filtrée sur cette période
            </p>
          ) : (
            <div className="flex flex-wrap gap-2 pt-2">
              {data.topCategories.map((c, idx) => (
                <div
                  key={idx}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800"
                >
                  <span className="font-semibold">{c.name}</span>
                  <span className="px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 font-bold text-[10px]">
                    {c.count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

