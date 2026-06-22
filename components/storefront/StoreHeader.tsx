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
  
}

export function StoreHeader({
  store,
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


    </header>
  )
}