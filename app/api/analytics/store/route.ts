// app/api/analytics/store/route.ts
// API statistiques isolées pour le vendeur (accès restreint à sa propre boutique)
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAdminSupabase } from '@/lib/auth/admin'

export const dynamic = 'force-dynamic'

function getStartDate(period: string): Date {
  const now = new Date()
  switch (period) {
    case 'today': {
      const today = new Date(now)
      today.setHours(0, 0, 0, 0)
      return today
    }
    case '7d': {
      const d = new Date(now)
      d.setDate(d.getDate() - 7)
      return d
    }
    case '30d': {
      const d = new Date(now)
      d.setDate(d.getDate() - 30)
      return d
    }
    case '90d': {
      const d = new Date(now)
      d.setDate(d.getDate() - 90)
      return d
    }
    case 'all': {
      return new Date(0)
    }
    default: {
      const d = new Date(now)
      d.setDate(d.getDate() - 7)
      return d
    }
  }
}

function formatDateKey(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toISOString().split('T')[0]
}

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // 1. Récupération stricte de la boutique appartenant à l'utilisateur
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('id, name, slug')
      .eq('owner_id', user.id)
      .maybeSingle()

    if (storeError || !store) {
      return NextResponse.json({ error: 'Boutique introuvable' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '7d'
    const startDate = getStartDate(period)

    // 2. Récupérer les événements liés à cette boutique
    // On utilise le client admin pour requêter sur store_id ET fallback slug
    const adminSupabase = getAdminSupabase()

    // Produits de la boutique
    const { data: storeProducts } = await adminSupabase
      .from('products')
      .select('id, name, slug, price, image_url')
      .eq('store_id', store.id)

    const productMap = new Map<string, { id: string; name: string; slug: string; price: number; image_url: string | null }>()
    for (const p of storeProducts || []) {
      productMap.set(p.id, p)
    }

    const { data: events, error: eventsError } = await adminSupabase
      .from('analytics_events')
      .select('id, event_name, store_id, product_id, visitor_id, session_id, device_type, metadata, created_at, referrer, page_path')
      .gte('created_at', startDate.toISOString())
      .or(`store_id.eq.${store.id},metadata->>store_slug.eq.${store.slug}`)
      .order('created_at', { ascending: true })

    if (eventsError) {
      console.error('[Store Analytics] Error fetching events:', eventsError.message)
      return NextResponse.json({ error: 'Erreur lors de la récupération des données' }, { status: 500 })
    }

    const allEvents = events || []

    const uniqueVisitors = new Set<string>()
    let storeViewsCount = 0
    let productViewsCount = 0
    let whatsappClicksCount = 0

    const deviceCounts = { mobile: 0, tablet: 0, desktop: 0 }
    const sourceCounts = { marketplace: 0, direct: 0, other: 0 }
    const productStatsMap = new Map<string, { id: string; name: string; price: number; image_url: string | null; views: number; whatsapp: number }>()

    // Initialiser les stats de tous les produits du vendeur (même ceux avec 0 vues)
    for (const p of storeProducts || []) {
      productStatsMap.set(p.id, {
        id: p.id,
        name: p.name,
        price: p.price,
        image_url: p.image_url,
        views: 0,
        whatsapp: 0,
      })
    }

    // Daily map pour timeline
    const dailyMap = new Map<string, { visits: number; whatsapp: number; product_views: number }>()
    const daysCount = period === 'today' ? 1 : period === '7d' ? 7 : period === '30d' ? 30 : 14
    const today = new Date()
    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      const k = d.toISOString().split('T')[0]
      dailyMap.set(k, { visits: 0, whatsapp: 0, product_views: 0 })
    }

    for (const ev of allEvents) {
      if (ev.visitor_id) uniqueVisitors.add(ev.visitor_id)

      const dev = (ev.device_type || 'desktop') as 'mobile' | 'tablet' | 'desktop'
      if (deviceCounts[dev] !== undefined) {
        deviceCounts[dev]++
      } else {
        deviceCounts.desktop++
      }

      // Analyse de la provenance
      const source = ev.metadata?.source || ''
      const ref = (ev.referrer || '').toLowerCase()
      if (source === 'marketplace_sheet' || ref.includes('rohaty') && (ref.endsWith('/') || ref.includes('/?'))) {
        sourceCounts.marketplace++
      } else if (!ref || ref === 'direct') {
        sourceCounts.direct++
      } else {
        sourceCounts.other++
      }

      const dayKey = formatDateKey(ev.created_at)
      if (!dailyMap.has(dayKey)) {
        dailyMap.set(dayKey, { visits: 0, whatsapp: 0, product_views: 0 })
      }
      const dayData = dailyMap.get(dayKey)!

      if (ev.event_name === 'view_store') {
        storeViewsCount++
        dayData.visits++
      } else if (ev.event_name === 'view_product') {
        productViewsCount++
        dayData.product_views++

        const pId = ev.product_id
        if (pId && productStatsMap.has(pId)) {
          productStatsMap.get(pId)!.views++
        } else if (pId) {
          productStatsMap.set(pId, {
            id: pId,
            name: ev.metadata?.product_name || 'Produit',
            price: ev.metadata?.price || 0,
            image_url: null,
            views: 1,
            whatsapp: 0,
          })
        }
      } else if (ev.event_name === 'click_whatsapp') {
        whatsappClicksCount++
        dayData.whatsapp++

        const pId = ev.product_id
        if (pId && productStatsMap.has(pId)) {
          productStatsMap.get(pId)!.whatsapp++
        }
      }
    }

    const timeline = Array.from(dailyMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, counts]) => ({
        date,
        label: formatDateLabel(date),
        visits: counts.visits,
        whatsapp: counts.whatsapp,
        product_views: counts.product_views,
      }))

    const products = Array.from(productStatsMap.values())
      .sort((a, b) => b.views - a.views || b.whatsapp - a.whatsapp)

    const conversionRate = productViewsCount > 0
      ? Number(((whatsappClicksCount / productViewsCount) * 100).toFixed(1))
      : 0

    return NextResponse.json({
      store: {
        id: store.id,
        name: store.name,
        slug: store.slug,
      },
      summary: {
        uniqueVisitors: uniqueVisitors.size,
        storeViews: storeViewsCount,
        productViews: productViewsCount,
        whatsappClicks: whatsappClicksCount,
        conversionRate,
      },
      timeline,
      products,
      devices: deviceCounts,
      sources: sourceCounts,
    })
  } catch (err: any) {
    console.error('[Store Analytics] Unexpected error:', err)
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}

