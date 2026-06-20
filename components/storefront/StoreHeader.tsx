// components/storefront/StoreHeader.tsx
'use client'

import Link from 'next/link'
import Image from 'next/image'
import { cn } from '@/lib/utils'

interface Store {
  name: string
  slug: string
  slogan: string | null
  logo_url: string | null
  banner_url?: string | null
  whatsapp: string
  primary_color: string
}

interface StoreHeaderProps {
  store: Store
  categories: string[]
  activeCategory?: string
}

export function StoreHeader({
  store,
  categories,
  activeCategory = '',
}: StoreHeaderProps) {
  const message = encodeURIComponent(
    `Bonjour ${store.name} ! Je visite votre boutique en ligne et je souhaite avoir des renseignements.`
  )
  const cleanNumber = store.whatsapp.replace(/\D/g, '')
  const whatsappContactUrl = `https://wa.me/${cleanNumber}?text=${message}`
  const primaryColor = store.primary_color || '#2563EB'

  return (
    <header className="bg-bg-base text-white">
      {/* Bannière */}
      <div className="relative h-48 bg-gradient-to-r from-bg-muted to-bg-surface border-b border-white/5">
        {store.banner_url ? (
          <Image
            src={store.banner_url}
            alt=""
            fill
            priority
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-tr from-slate-900 via-slate-800 to-slate-950 opacity-70" />
        )}
      </div>

      {/* Logo + Infos boutique, chevauche la bannière */}
      <div className="px-4 -mt-8 relative z-10 flex items-end gap-3">
        <div className="w-26 h-26 rounded-xl border border-white/10 bg-bg-surface overflow-hidden relative shadow-lg flex items-center justify-center shrink-0">
          {store.logo_url ? (
            <Image
              src={store.logo_url}
              alt={store.name}
              fill
              sizes="64px"
              className="object-cover"
              unoptimized
            />
          ) : (
            <span className="text-xl font-bold font-heading text-primary">
              {store.name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <div className="mb-1 truncate ">
          <h1 className="text-sm sm:text-base lg:text-2xl font-bold text-white leading-tight truncate">
            {store.name}
          </h1>
          <p className="text-[10px] sm:text-xs text-text-secondary truncate">
            {store.slogan || ''}
          </p>
        </div>

      </div>

      {/* Bouton WhatsApp pleine largeur */}
      <div className="px-4 mt-4">
        <a
          href={whatsappContactUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-2 rounded-lg text-xs font-semibold text-white flex items-center justify-center gap-1.5 whatsapp-pulse"
          style={{ backgroundColor: '#10B981' }}
        >
          💬 Contacter sur WhatsApp
        </a>
      </div>

      {/* ================= CATEGORIES (STICKY + SCROLL HORIZONTAL) ================= */}
      {categories.length > 0 && (
        <div className="sticky top-0 z-50 bg-bg-base/80 backdrop-blur-xl border-b border-white/5 mt-3">

          <div className="px-3 py-2">

            <div className="
              flex
              gap-2
              overflow-x-auto
              no-scrollbar
              scroll-smooth
              snap-x
            ">

              {/* ALL */}
              <Link
                href={`/${store.slug}`}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap snap-start",
                  !activeCategory
                    ? "text-white"
                    : "bg-white/5 text-gray-300"
                )}
                style={
                  !activeCategory
                    ? { backgroundColor: primaryColor }
                    : undefined
                }
              >
                Tous
              </Link>

              {/* CATEGORIES */}
              {categories.map((category) => {
                const isActive =
                  activeCategory?.toLowerCase() === category.toLowerCase()

                return (
                  <Link
                    key={category}
                    href={`/${store.slug}?category=${encodeURIComponent(category)}`}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap snap-start",
                      isActive
                        ? "text-white"
                        : "bg-white/5 text-gray-300"
                    )}
                    style={
                      isActive
                        ? { backgroundColor: primaryColor }
                        : undefined
                    }
                  >
                    {category}
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}