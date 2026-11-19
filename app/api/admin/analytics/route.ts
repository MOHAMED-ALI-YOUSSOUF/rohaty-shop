// app/api/admin/analytics/route.ts
// API statistiques globales pour le Super Admin
import { NextResponse } from 'next/server'
import { getAuthenticatedSuperAdmin, getAdminSupabase } from '@/lib/auth/admin'

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
    const admin = await getAuthenticatedSuperAdmin()
    if (!admin) {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '7d'
    const startDate = getStartDate(period)

    const supabase = getAdminSupabase()

    // 1. Récupération des événements dans la période
    const { data: events, error: eventsError } = await supabase
      .from('analytics_events')
      .select('id, event_name, store_id, product_id, visitor_id, session_id, device_type, metadata, created_at, referrer, page_path')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true })

    if (eventsError) {
      console.error('[Admin Analytics] Error fetching events:', eventsError.message)
      return NextResponse.json({ error: 'Erreur lors de la récupération des données' }, { status: 500 })
    }

    const allEvents = events || []

    // 2. Récupérer toutes les boutiques pour faire les jointures de noms/slugs
    const { data: storesData } = await supabase
      .from('stores')
      .select('id, name, slug')
    const storeMap = new Map<string, { id: string; name: string; slug: string }>()
    for (const s of storesData || []) {
      storeMap.set(s.id, s)
    }

    // 3. Récupérer tous les produits pour les noms et prix
    const { data: productsData } = await supabase
      .from('products')
      .select('id, name, slug, price, store_id')
    const productMap = new Map<string, { id: string; name: string; slug: string; price: number; store_id: string }>()
    for (const p of productsData || []) {
      productMap.set(p.id, p)
    }

    // 4. Calcul des KPI généraux
    const uniqueVisitors = new Set<string>()
    const uniqueSessions = new Set<string>()
    let pageViewsCount = 0
    let storeViewsCount = 0
    let productViewsCount = 0
    let whatsappClicksCount = 0
    let searchCount = 0

    const deviceCounts = { mobile: 0, tablet: 0, desktop: 0 }
    const searchesMap = new Map<string, number>()
    const categoriesMap = new Map<string, number>()
    const storeStatsMap = new Map<string, { views: number; whatsapp: number; name: string; slug: string }>()
    const productStatsMap = new Map<string, { views: number; whatsapp: number; name: string; price: number; storeName: string; storeSlug: string }>()

    // Pour la timeline quotidienne
    const dailyMap = new Map<string, { visits: number; whatsapp: number; product_views: number }>()

    // Initialiser les jours de la période pour éviter les trous
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
      if (ev.session_id) uniqueSessions.add(ev.session_id)

      const dev = (ev.device_type || 'desktop') as 'mobile' | 'tablet' | 'desktop'
      if (deviceCounts[dev] !== undefined) {
        deviceCounts[dev]++
      } else {
        deviceCounts.desktop++
      }

      const dayKey = formatDateKey(ev.created_at)
      if (!dailyMap.has(dayKey)) {
        dailyMap.set(dayKey, { visits: 0, whatsapp: 0, product_views: 0 })
      }
      const dayData = dailyMap.get(dayKey)!

      switch (ev.event_name) {
        case 'page_view':
          pageViewsCount++
          dayData.visits++
          break

        case 'view_store': {
          storeViewsCount++
          dayData.visits++
          const sId = ev.store_id
          const sObj = sId ? storeMap.get(sId) : null
          const storeName = sObj?.name || ev.metadata?.store_name || 'Boutique inconnue'
          const storeSlug = sObj?.slug || ev.metadata?.store_slug || ''
          const key = sId || storeSlug || storeName

          const cur = storeStatsMap.get(key) || { views: 0, whatsapp: 0, name: storeName, slug: storeSlug }
          cur.views++
          storeStatsMap.set(key, cur)
          break
        }

        case 'view_product': {
          productViewsCount++
          dayData.product_views++
          const pId = ev.product_id
          const pObj = pId ? productMap.get(pId) : null
          const pName = pObj?.name || ev.metadata?.product_name || 'Produit inconnu'
          const pPrice = pObj?.price || ev.metadata?.price || 0
          const sId = ev.store_id || pObj?.store_id
          const sObj = sId ? storeMap.get(sId) : null
          const sName = sObj?.name || ev.metadata?.store_name || ''
          const sSlug = sObj?.slug || ev.metadata?.store_slug || ''

          const key = pId || pName
          const cur = productStatsMap.get(key) || {
            views: 0,
            whatsapp: 0,
            name: pName,
            price: pPrice,
            storeName: sName,
            storeSlug: sSlug,
          }
          cur.views++
          productStatsMap.set(key, cur)
          break
        }

        case 'click_whatsapp': {
          whatsappClicksCount++
          dayData.whatsapp++

          // Assigner au store
          const sId = ev.store_id
          const sObj = sId ? storeMap.get(sId) : null
          const storeName = sObj?.name || ev.metadata?.store_name || 'Boutique'
          const storeSlug = sObj?.slug || ev.metadata?.store_slug || ''
          const sKey = sId || storeSlug || storeName

          const curS = storeStatsMap.get(sKey) || { views: 0, whatsapp: 0, name: storeName, slug: storeSlug }
          curS.whatsapp++
          storeStatsMap.set(sKey, curS)

          // Assigner au produit si applicable
          const pId = ev.product_id
          if (pId) {
            const pObj = productMap.get(pId)
            const pName = pObj?.name || ev.metadata?.product_name || 'Produit'
            const pPrice = pObj?.price || 0
            const pKey = pId
            const curP = productStatsMap.get(pKey) || {
              views: 0,
              whatsapp: 0,
              name: pName,
              price: pPrice,
              storeName,
              storeSlug,
            }
            curP.whatsapp++
            productStatsMap.set(pKey, curP)
          }
          break
        }

        case 'search': {
          searchCount++
          const term = ev.metadata?.search_term
          if (typeof term === 'string' && term.trim()) {
            const clean = term.trim().toLowerCase()
            searchesMap.set(clean, (searchesMap.get(clean) || 0) + 1)
          }
          break
        }

        case 'view_category': {
          const catName = ev.metadata?.category_name || ev.metadata?.category_slug
          if (typeof catName === 'string' && catName.trim()) {
            const clean = catName.trim()
            categoriesMap.set(clean, (categoriesMap.get(clean) || 0) + 1)
          }
          break
        }
      }
    }

    // Top boutiques (par vues puis par whatsapp)
    const topStores = Array.from(storeStatsMap.entries())
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.views - a.views || b.whatsapp - a.whatsapp)
      .slice(0, 10)

    // Top produits (par vues puis par whatsapp)
    const topProducts = Array.from(productStatsMap.entries())
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.views - a.views || b.whatsapp - a.whatsapp)
      .slice(0, 10)

    // Top recherches
    const topSearches = Array.from(searchesMap.entries())
      .map(([term, count]) => ({ term, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8)

    // Top catégories
    const topCategories = Array.from(categoriesMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8)

    // Timeline triée chronologiquement
    const timeline = Array.from(dailyMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, counts]) => ({
        date,
        label: formatDateLabel(date),
        visits: counts.visits,
        whatsapp: counts.whatsapp,
        product_views: counts.product_views,
      }))

    const conversionRate = productViewsCount > 0
      ? Number(((whatsappClicksCount / productViewsCount) * 100).toFixed(1))
      : 0

    return NextResponse.json({
      summary: {
        uniqueVisitors: uniqueVisitors.size,
        uniqueSessions: uniqueSessions.size,
        totalEvents: allEvents.length,
        pageViews: pageViewsCount,
        storeViews: storeViewsCount,
        productViews: productViewsCount,
        whatsappClicks: whatsappClicksCount,
        searches: searchCount,
        conversionRate,
      },
      timeline,
      topStores,
      topProducts,
      devices: deviceCounts,
      topSearches,
      topCategories,
    })
  } catch (err: any) {
    console.error('[Admin Analytics] Unexpected error:', err)
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}

