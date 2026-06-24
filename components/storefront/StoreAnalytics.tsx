// components/storefront/StoreAnalytics.tsx
'use client'

import { useEffect } from 'react'

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
  }
}

interface StoreAnalyticsProps {
  slug: string
  name: string
}

/**
 * Envoie un custom event GA4 "view_store" dès que la boutique est visitée.
 * Cela permet de voir les visites par boutique dans Google Analytics :
 * Explorer → Events → view_store → filtrer par store_slug.
 */
export function StoreAnalytics({ slug, name }: StoreAnalyticsProps) {
  useEffect(() => {
    if (typeof window.gtag === 'function') {
      window.gtag('event', 'view_store', {
        store_slug: slug,
        store_name: name,
      })
    }
  }, [slug, name])

  return null
}
