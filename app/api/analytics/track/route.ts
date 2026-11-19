// app/api/analytics/track/route.ts
// Point d'entrée pour la réception asynchrone et non-bloquante des événements analytics
import { NextResponse } from 'next/server'
import { getAdminSupabase } from '@/lib/auth/admin'

export const dynamic = 'force-dynamic'

const ALLOWED_EVENTS = new Set([
  'page_view',
  'view_store',
  'view_product',
  'search',
  'view_category',
  'click_whatsapp',
  'outbound_click',
])

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function sanitizeUuid(val: any): string | null {
  if (typeof val === 'string' && UUID_REGEX.test(val.trim())) {
    return val.trim()
  }
  return null
}

export async function POST(request: Request) {
  try {
    let body: any
    const contentType = request.headers.get('content-type') || ''

    if (contentType.includes('application/json') || contentType.includes('text/plain')) {
      const text = await request.text()
      try {
        body = JSON.parse(text)
      } catch {
        return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
      }
    } else {
      return NextResponse.json({ error: 'Unsupported Content-Type' }, { status: 415 })
    }

    const {
      event_name,
      store_id,
      product_id,
      visitor_id,
      session_id,
      page_path,
      referrer,
      device_type,
      metadata,
    } = body

    // 1. Validation de l'événement
    if (!event_name || !ALLOWED_EVENTS.has(event_name)) {
      return NextResponse.json({ error: 'Invalid event name' }, { status: 400 })
    }

    // 2. Validation anonymat & session
    const validVisitorId = typeof visitor_id === 'string' && visitor_id.length > 0 ? visitor_id.slice(0, 100) : 'unknown'
    const validSessionId = typeof session_id === 'string' && session_id.length > 0 ? session_id.slice(0, 100) : 'unknown'
    const validPath = typeof page_path === 'string' && page_path.length > 0 ? page_path.slice(0, 500) : '/'
    const validReferrer = typeof referrer === 'string' && referrer.length > 0 ? referrer.slice(0, 500) : null
    const validDevice = ['mobile', 'tablet', 'desktop'].includes(device_type) ? device_type : 'desktop'

    const cleanStoreId = sanitizeUuid(store_id)
    const cleanProductId = sanitizeUuid(product_id)
    const cleanMetadata = metadata && typeof metadata === 'object' && !Array.isArray(metadata) ? metadata : {}

    // 3. Insertion avec le client admin (service role) pour garantir la fiabilité
    const adminSupabase = getAdminSupabase()

    const { error: insertError } = await adminSupabase.from('analytics_events').insert({
      event_name,
      store_id: cleanStoreId,
      product_id: cleanProductId,
      visitor_id: validVisitorId,
      session_id: validSessionId,
      page_path: validPath,
      referrer: validReferrer,
      device_type: validDevice,
      metadata: cleanMetadata,
    })

    if (insertError) {
      console.error('[Analytics] Insert error:', insertError.message)
      return NextResponse.json({ error: 'Failed to record event' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('[Analytics] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

