// components/storefront/ProductCard.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { ShoppingBag } from 'lucide-react'

interface Product {
  id: string
  name: string
  slug: string
  description: string | null
  price: number
  list_price: number
  image_url: string | null
  category: string | null
}

interface ProductCardProps {
  product: Product
  whatsappUrl: string
  primaryColor: string
  storeSlug: string
}

export function ProductCard({
  product,
  whatsappUrl,
  primaryColor = '#2563EB',
  storeSlug,
}: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const hasDiscount = product.list_price > product.price

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR').format(price)
  }

  const productDetailUrl = `/${storeSlug}/produits/${product.slug}`

  return (
    <motion.div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="rounded-xl bg-bg-surface border border-white/5 overflow-hidden flex flex-col h-full transition-all duration-200"
      animate={{
        borderColor: isHovered ? `${primaryColor}40` : 'rgba(255, 255, 255, 0.05)',
        boxShadow: isHovered ? `0 4px 16px ${primaryColor}20` : `0 4px 12px ${primaryColor}10`,
      }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      {/* Image produit */}
      <Link
        href={productDetailUrl}
        className="aspect-square bg-white/5 relative flex items-center justify-center overflow-hidden block shrink-0"
      >
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            className="object-cover"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-text-muted opacity-40">
            <ShoppingBag className="w-8 h-8 stroke-[1.5]" />
          </div>
        )}

        {hasDiscount && (
          <span
            className="absolute top-1.5 left-1.5 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded select-none leading-none"
            style={{ backgroundColor: primaryColor }}
          >
            PROMO
          </span>
        )}
      </Link>

      {/* Infos produit — compact, comme le mockup */}
      <div className="p-2 space-y-1.5 flex flex-col flex-1">
        <Link href={productDetailUrl}>
          <p className="text-[11px] font-semibold text-white truncate leading-tight">
            {product.name}
          </p>
        </Link>

        <div className="flex justify-between items-baseline gap-1 flex-wrap">
          <span
            className="text-xs font-bold font-heading"
            style={{ color: primaryColor }}
          >
            {formatPrice(product.price)} DJF
          </span>
          {hasDiscount && (
            <span className="text-[9px] text-text-muted line-through">
              {formatPrice(product.list_price)} DJF
            </span>
          )}
        </div>

        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-1.5 rounded text-[10px] font-bold text-white text-center cursor-pointer mt-auto active:scale-95 transition-transform"
          style={{ backgroundColor: '#10B981' }}
        >
          💬 Commander
        </a>
      </div>
    </motion.div>
  )
}