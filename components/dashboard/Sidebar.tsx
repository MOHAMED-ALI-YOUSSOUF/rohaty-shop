// components/dashboard/Sidebar.tsx
'use client'

import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { LayoutDashboard, ShoppingBag, Store, Palette, ExternalLink, LogOut, Menu, X } from 'lucide-react'
import { useState } from 'react'

interface SidebarProps {
  storeName: string
  storeSlug: string
  className?: string
  onCloseMobile?: () => void
}

export function Sidebar({ storeName, storeSlug, className, onCloseMobile }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const navItems = [
    {
      label: 'Tableau de bord',
      href: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      label: 'Mes produits',
      href: '/dashboard/produits',
      icon: ShoppingBag,
    },
    {
      label: 'Ma boutique',
      href: '/dashboard/boutique',
      icon: Store,
    },
    {
      label: 'Apparence',
      href: '/dashboard/apparence',
      icon: Palette,
    },
  ]

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/connexion')
    router.refresh()
  }

  // Permet de construire le lien de la boutique. 
  // On utilise l'URL absolue si définie, sinon une URL relative /slug
  const storeUrl = `/${storeSlug}`

  return (
    <div className={cn('flex flex-col h-full min-h-screen bg-bg-surface border-r border-white/5 w-[240px]', className)}>
      {/* Header (Logo + Store Name) */}
      <div className="p-6 border-b border-white/5 shrink-0">
        <Link href="/dashboard" className="font-heading text-xl font-extrabold tracking-tight block mb-4">
          Rohaty <span className="gradient-text">Shop</span>
        </Link>
        <div className="bg-bg-base/40 rounded-lg p-3 border border-white/5">
          <p className="text-xs text-text-muted font-semibold tracking-wider uppercase">Boutique</p>
          <p className="text-sm font-bold text-white truncate" title={storeName}>
            {storeName}
          </p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto min-h-0">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={true}
              onClick={onCloseMobile}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all group relative',
                isActive
                  ? 'bg-primary/10 text-white font-semibold'
                  : 'text-text-secondary hover:text-white hover:bg-white/5'
              )}
            >
              {/* Active Indicator Line */}
              {isActive && (
                <div className="absolute left-0 top-1/4 bottom-1/4 w-1 rounded-r-md bg-gradient-to-b from-[#2563EB] to-[#06B6D4]" />
              )}
              <Icon className={cn('w-5 h-5 shrink-0 transition-colors', isActive ? 'text-primary' : 'text-text-muted group-hover:text-text-secondary')} />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Footer (Store Link + Logout) */}
      <div className="p-4 mb-20 border-t border-white/5 space-y-2 shrink-0">
        <Link
          href={storeUrl}
          target="_blank"
          className="flex items-center justify-between w-full px-4 py-3 rounded-lg text-xs font-semibold bg-gradient-to-r from-[#2563EB]/10 to-[#06B6D4]/10 hover:from-[#2563EB]/20 hover:to-[#06B6D4]/20 border border-primary/20 text-white transition-all group"
        >
          <span className="flex items-center gap-2">
            <Store className="w-4 h-4 text-secondary" />
            Voir ma boutique
          </span>
          <ExternalLink className="w-3.5 h-3.5 text-text-muted group-hover:text-white transition-colors" />
        </Link>

        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/5 transition-all text-left"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          <span>Se déconnecter</span>
        </button>
      </div>
    </div>
  )
}
