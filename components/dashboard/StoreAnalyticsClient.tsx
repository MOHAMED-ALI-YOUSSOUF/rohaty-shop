// components/dashboard/StoreAnalyticsClient.tsx
'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Users,
  Store,
  ShoppingBag,
  MessageCircle,
  TrendingUp,
  RefreshCw,
  ArrowUpRight,
  Globe,
  Share2,
} from 'lucide-react'
import { AnalyticsTimelineChart, type TimelineDataPoint } from '@/components/analytics/AnalyticsTimelineChart'
import { DeviceDonutChart } from '@/components/analytics/DeviceDonutChart'

interface StoreSummary {
  uniqueVisitors: number
  storeViews: number
  productViews: number
  whatsappClicks: number
  conversionRate: number
}

interface StoreProductStat {
  id: string
  name: string
  price: number
  image_url: string | null
  views: number
  whatsapp: number
}

interface DeviceCounts {
  mobile: number
  desktop: number
  tablet: number
}

interface SourceCounts {
  marketplace: number
  direct: number
  other: number
}

interface StoreAnalyticsData {
  store: {
    id: string
    name: string
    slug: string
  }
  summary: StoreSummary
  timeline: TimelineDataPoint[]
  products: StoreProductStat[]
  devices: DeviceCounts
  sources: SourceCounts
}

const PERIODS = [
  { label: '7 derniers jours', value: '7d' },
  { label: '30 derniers jours', value: '30d' },
  { label: '90 derniers jours', value: '90d' },
  { label: 'Tout', value: 'all' },
]

export function StoreAnalyticsClient() {
  const [period, setPeriod] = useState('7d')
  const [data, setData] = useState<StoreAnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async (selectedPeriod: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/analytics/store?period=${selectedPeriod}`)
      if (!res.ok) {
        throw new Error('Erreur lors du chargement des statistiques de votre boutique')
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

  const totalSources = (data?.sources.marketplace || 0) + (data?.sources.direct || 0) + (data?.sources.other || 0)
  const marketplacePct = totalSources > 0 ? Math.round(((data?.sources.marketplace || 0) / totalSources) * 100) : 0
  const directPct = totalSources > 0 ? Math.round(((data?.sources.direct || 0) / totalSources) * 100) : 0

  return (
    <div className="space-y-8 font-sans pb-12">
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Statistiques de votre boutique
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Suivez le trafic, la visibilité de vos produits et l&apos;impact commercial de vos commandes WhatsApp
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
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
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
          <p className="text-[11px] text-slate-400 mt-1">Clients potentiels uniques</p>
        </div>

        {/* Vues boutique */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Visites vitrine</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Store className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {loading ? '...' : (data?.summary.storeViews ?? 0)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Affichages de votre vitrine</p>
        </div>

        {/* Produits vus */}
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
          <p className="text-[11px] text-slate-400 mt-1">Détails produits consultés</p>
        </div>

        {/* Clics WhatsApp */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Commandes WhatsApp</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <MessageCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600">
            {loading ? '...' : (data?.summary.whatsappClicks ?? 0)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Boutons commander cliqués</p>
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
          <p className="text-[11px] text-slate-400 mt-1">Taux WhatsApp / Vues</p>
        </div>
      </div>

      {/* ── Graphiques ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Évolution temporelle */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Évolution de votre activité
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Comparatif des visites et des commandes WhatsApp générées
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

        {/* Répartition Appareils & Sources */}
        <div className="space-y-6">
          {/* Appareils */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 mb-1">
              Appareils de vos clients
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              D&apos;où viennent vos visiteurs
            </p>
            {loading ? (
              <div className="h-28 flex items-center justify-center text-slate-400 text-sm">
                <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Chargement...
              </div>
            ) : (
              <DeviceDonutChart devices={data?.devices || { mobile: 0, desktop: 0, tablet: 0 }} />
            )}
          </div>

          {/* Sources de trafic */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 mb-1">
              Provenance du trafic
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Canaux d&apos;arrivée sur vos produits
            </p>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span className="flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-[#2563EB]" /> Marketplace Rohaty
                  </span>
                  <span>{marketplacePct}% ({data?.sources.marketplace || 0})</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    style={{ width: `${marketplacePct}%` }}
                    className="h-full bg-[#2563EB] rounded-full transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span className="flex items-center gap-1.5">
                    <Share2 className="w-3.5 h-3.5 text-[#10B981]" /> Accès direct & Liens partagés
                  </span>
                  <span>{directPct}% ({data?.sources.direct || 0})</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    style={{ width: `${directPct}%` }}
                    className="h-full bg-[#10B981] rounded-full transition-all"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tableau de performance des produits ───────────────────────────── */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Performance détaillée de vos produits
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Identifiez vos articles les plus consultés et ceux qui convertissent le mieux sur WhatsApp
            </p>
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-400 text-sm">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" /> Chargement de vos produits...
          </div>
        ) : !data?.products || data.products.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-sm">
            Aucun produit trouvé dans votre boutique
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100 pb-3">
                  <th className="pb-3 font-semibold">Produit</th>
                  <th className="pb-3 text-right font-semibold">Prix</th>
                  <th className="pb-3 text-center font-semibold">Fiches vues</th>
                  <th className="pb-3 text-center font-semibold">WhatsApp</th>
                  <th className="pb-3 text-center font-semibold">Taux conversion</th>
                  <th className="pb-3 text-right font-semibold">Lien</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.products.map((p, idx) => {
                  const rate = p.views > 0 ? ((p.whatsapp / p.views) * 100).toFixed(1) : '0'

                  return (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 pr-4">
                        <div className="flex items-center gap-3">
                          <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-500 font-bold text-[10px] flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <div className="w-10 h-10 rounded-lg bg-slate-100 relative overflow-hidden shrink-0 border border-slate-200">
                            {p.image_url ? (
                              <Image
                                src={p.image_url}
                                alt={p.name}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-300">
                                <ShoppingBag className="w-4 h-4" />
                              </div>
                            )}
                          </div>
                          <span className="font-bold text-slate-900 truncate max-w-[200px]">
                            {p.name}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 text-right font-bold text-slate-900 whitespace-nowrap">
                        {new Intl.NumberFormat('fr-FR').format(p.price)} DJF
                      </td>
                      <td className="py-3.5 text-center font-extrabold text-slate-800">
                        {p.views}
                      </td>
                      <td className="py-3.5 text-center font-extrabold text-emerald-600">
                        {p.whatsapp}
                      </td>
                      <td className="py-3.5 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          Number(rate) > 0
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-slate-100 text-slate-500'
                        }`}>
                          {rate}%
                        </span>
                      </td>
                      <td className="py-3.5 text-right">
                        {data.store.slug && (
                          <Link
                            href={`/${data.store.slug}`}
                            target="_blank"
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-[#2563EB] hover:underline"
                          >
                            Voir <ArrowUpRight className="w-3 h-3" />
                          </Link>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

