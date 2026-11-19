// lib/analytics.ts
// Module client et universel d'analyse du trafic et suivi des événements
// Intègre à la fois GA4 (via gtag) et Supabase (table analytics_events via /api/analytics/track)

export type AnalyticsEventName =
  | 'page_view'
  | 'view_store'
  | 'view_product'
  | 'search'
  | 'view_category'
  | 'click_whatsapp'
  | 'outbound_click'

export type DeviceType = 'mobile' | 'tablet' | 'desktop'

export interface TrackEventOptions {
  storeId?: string | null
  productId?: string | null
  metadata?: Record<string, any>
  pagePath?: string
  referrer?: string
}

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
    dataLayer?: unknown[]
  }
}

// ─── Helpers d'identification anonyme (RGPD / Privacy compliant) ─────────────
const VISITOR_KEY = 'rohaty_visitor_id'
const SESSION_KEY = 'rohaty_session_id'

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

export function getVisitorId(): string {
  if (typeof window === 'undefined') return ''
  try {
    let id = localStorage.getItem(VISITOR_KEY)
    if (!id) {
      id = generateUUID()
      localStorage.setItem(VISITOR_KEY, id)
    }
    return id
  } catch {
    return 'anon-visitor'
  }
}

export function getSessionId(): string {
  if (typeof window === 'undefined') return ''
  try {
    let id = sessionStorage.getItem(SESSION_KEY)
    if (!id) {
      id = generateUUID()
      sessionStorage.setItem(SESSION_KEY, id)
    }
    return id
  } catch {
    return 'anon-session'
  }
}

export function getDeviceType(): DeviceType {
  if (typeof window === 'undefined') return 'desktop'
  const width = window.innerWidth
  const ua = navigator.userAgent.toLowerCase()

  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua) || (width >= 640 && width < 1024)) {
    return 'tablet'
  }
  if (
    /Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua) ||
    width < 640
  ) {
    return 'mobile'
  }
  return 'desktop'
}

// ─── Déduplication en mémoire ────────────────────────────────────────────────
// Évite d'enregistrer des doublons causés par les re-renders React ou le strict mode
const recentEvents = new Map<string, number>()
const DEDUPE_WINDOW_MS = 8000 // 8 secondes

function shouldDedupe(key: string): boolean {
  const now = Date.now()
  const lastTime = recentEvents.get(key)
  if (lastTime && now - lastTime < DEDUPE_WINDOW_MS) {
    return true
  }
  recentEvents.set(key, now)

  // Nettoyage régulier si la Map grossit
  if (recentEvents.size > 200) {
    for (const [k, timestamp] of recentEvents.entries()) {
      if (now - timestamp > DEDUPE_WINDOW_MS * 2) {
        recentEvents.delete(k)
      }
    }
  }
  return false
}

// ─── Dispatch d'événement principal ──────────────────────────────────────────
export function trackEvent(
  eventName: AnalyticsEventName,
  options: TrackEventOptions = {}
) {
  if (typeof window === 'undefined') return

  const pagePath = options.pagePath || window.location.pathname
  const referrer = options.referrer !== undefined ? options.referrer : (document.referrer || '')
  const visitorId = getVisitorId()
  const sessionId = getSessionId()
  const deviceType = getDeviceType()

  // Clé de déduplication pour éviter les doublons accidentels
  const dedupeKey = `${eventName}_${options.storeId || ''}_${options.productId || ''}_${pagePath}_${options.metadata?.category || ''}`
  if (eventName === 'view_product' || eventName === 'view_store' || eventName === 'page_view') {
    if (shouldDedupe(dedupeKey)) {
      return
    }
  }

  // 1. Envoi vers Google Analytics 4 (si initialisé)
  try {
    if (typeof window.gtag === 'function') {
      const gaParams: Record<string, any> = {
        page_path: pagePath,
        device_type: deviceType,
        ...(options.metadata || {}),
      }
      if (options.storeId) gaParams.store_id = options.storeId
      if (options.productId) gaParams.product_id = options.productId

      window.gtag('event', eventName, gaParams)
    }
  } catch (err) {
    // Échec silencieux pour ne jamais impacter l'UX
  }

  // 2. Envoi vers l'API interne Supabase (/api/analytics/track)
  try {
    const payload = JSON.stringify({
      event_name: eventName,
      store_id: options.storeId || null,
      product_id: options.productId || null,
      visitor_id: visitorId,
      session_id: sessionId,
      page_path: pagePath,
      referrer: referrer || null,
      device_type: deviceType,
      metadata: options.metadata || {},
    })

    // On privilégie sendBeacon pour ne pas bloquer le thread et garantir l'envoi même si l'onglet ferme
    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      const blob = new Blob([payload], { type: 'application/json' })
      const sent = navigator.sendBeacon('/api/analytics/track', blob)
      if (sent) return
    }

    // Fallback fetch avec keepalive
    fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
      keepalive: true,
    }).catch(() => {
      // Échec silencieux
    })
  } catch (err) {
    // Échec silencieux
  }
}

// ─── Fonctions spécialisées faciles à appeler ────────────────────────────────

export function trackPageView(pagePath?: string) {
  trackEvent('page_view', {
    pagePath: pagePath || (typeof window !== 'undefined' ? window.location.pathname : '/'),
    referrer: typeof document !== 'undefined' ? document.referrer : '',
  })
}

export function trackStoreView(store: { id: string; slug: string; name: string }) {
  trackEvent('view_store', {
    storeId: store.id,
    pagePath: `/${store.slug}`,
    metadata: {
      store_slug: store.slug,
      store_name: store.name,
    },
  })
}

export function trackProductView(product: {
  id: string
  name: string
  price?: number
  category?: string | null
  storeId?: string | null
  storeSlug?: string | null
  source?: 'marketplace_sheet' | 'store_page'
}) {
  trackEvent('view_product', {
    storeId: product.storeId || null,
    productId: product.id,
    metadata: {
      product_name: product.name,
      price: product.price,
      category: product.category || null,
      store_slug: product.storeSlug || null,
      source: product.source || 'marketplace_sheet',
    },
  })
}

export function trackSearch(searchTerm: string, resultsCount: number) {
  if (!searchTerm.trim()) return
  trackEvent('search', {
    metadata: {
      search_term: searchTerm.trim(),
      results_count: resultsCount,
    },
  })
}

export function trackCategoryView(category: {
  id?: string | null
  name?: string | null
  slug?: string | null
}) {
  trackEvent('view_category', {
    metadata: {
      category_id: category.id || null,
      category_name: category.name || null,
      category_slug: category.slug || null,
    },
  })
}

export function trackWhatsAppClick(params: {
  storeId?: string | null
  storeSlug?: string | null
  productId?: string | null
  productName?: string | null
  source: 'marketplace_sheet' | 'store_card' | 'store_product_page' | 'store_header'
}) {
  trackEvent('click_whatsapp', {
    storeId: params.storeId || null,
    productId: params.productId || null,
    metadata: {
      store_slug: params.storeSlug || null,
      product_name: params.productName || null,
      source: params.source,
    },
  })
}

