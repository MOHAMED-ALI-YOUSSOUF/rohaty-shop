// components/storefront/ProductAnalytics.tsx
'use client'

import { useEffect } from 'react'
import { trackProductView, trackWhatsAppClick } from '@/lib/analytics'
import { GradientButton } from '@/components/shared/GradientButton'

interface ProductViewProps {
  id: string
  name: string
  price: number
  category?: string | null
  storeId: string
  storeSlug: string
}

export function ProductViewTracker({
  id,
  name,
  price,
  category,
  storeId,
  storeSlug,
}: ProductViewProps) {
  useEffect(() => {
    trackProductView({
      id,
      name,
      price,
      category,
      storeId,
      storeSlug,
      source: 'store_page',
    })
  }, [id, name, price, category, storeId, storeSlug])

  return null
}

interface ProductWhatsAppOrderButtonProps {
  href: string
  productId: string
  productName: string
  storeId: string
  storeSlug: string
  className?: string
  children?: React.ReactNode
}

export function ProductWhatsAppOrderButton({
  href,
  productId,
  productName,
  storeId,
  storeSlug,
  className,
  children,
}: ProductWhatsAppOrderButtonProps) {
  const handleClick = () => {
    trackWhatsAppClick({
      storeId,
      storeSlug,
      productId,
      productName,
      source: 'store_product_page',
    })
  }

  return (
    <GradientButton
      variant="whatsapp"
      href={href}
      target="_blank"
      onClick={handleClick}
      className={className}
    >
      {children || '💬 Commander via WhatsApp'}
    </GradientButton>
  )
}

