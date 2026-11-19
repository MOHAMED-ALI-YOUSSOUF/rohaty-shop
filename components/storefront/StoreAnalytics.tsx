// components/storefront/StoreAnalytics.tsx
'use client'

import { useEffect } from 'react'
import { trackStoreView } from '@/lib/analytics'

interface StoreAnalyticsProps {
  id?: string
  slug: string
  name: string
}

/**
 * Envoie l'événement "view_store" vers Google Analytics 4 et la table Supabase analytics_events.
 */
export function StoreAnalytics({ id, slug, name }: StoreAnalyticsProps) {
  useEffect(() => {
    trackStoreView({
      id: id || '',
      slug,
      name,
    })
  }, [id, slug, name])

  return null
}
