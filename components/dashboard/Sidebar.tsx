// components/dashboard/Sidebar.tsx
'use client'

import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  ShoppingBag,
  BarChart3,
  Store,
  Palette,
  ExternalLink,
  LogOut,
} from 'lucide-react'

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
      label: 'Statistiques',
      href: '/dashboard/statistiques',
      icon: BarChart3,
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

  const storeUrl = `/${storeSlug}`

  return (
    <div className={cn('flex flex-col h-full min-h-screen bg-white border-r border-slate-200 w-[240px]', className)}>
      {/* Header (Logo + Store Name) */}
      <div className="p-6 border-b border-slate-200 shrink-0">
        <Link href="/dashboard" className="font-heading text-xl font-extrabold tracking-tight block mb-4 text-slate-900">
          Rohaty <span className="text-[#2563EB]">Shop</span>
        </Link>
        <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
          <p className="text-[10px] text-slate-500 font-bold tracking-wider uppercase">Boutique</p>
          <p className="text-sm font-bold text-slate-900 truncate mt-0.5" title={storeName}>
            {storeName}
          </p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto min-h-0">
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
                'flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all group relative',
                isActive
                  ? 'bg-blue-50 text-[#2563EB] font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              )}
            >
              {/* Active Indicator Line */}
              {isActive && (
                <div className="absolute left-0 top-2 bottom-2 w-1 rounded-r-md bg-[#2563EB]" />
              )}
              <Icon
                className={cn(
                  'w-4.5 h-4.5 shrink-0 transition-colors',
                  isActive ? 'text-[#2563EB]' : 'text-slate-400 group-hover:text-slate-600'
                )}
              />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Footer Link & Déconnexion */}
      <div className="p-4 border-t border-slate-200 space-y-2 shrink-0 bg-slate-50/50">
        <Link
          href={storeUrl}
          target="_blank"
          className="flex items-center justify-between w-full px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:bg-white hover:text-slate-900 transition-colors border border-transparent hover:border-slate-200"
        >
          <span className="flex items-center gap-2">
            <Store className="w-4 h-4 text-[#2563EB]" />
            Voir ma boutique
          </span>
          <ExternalLink className="w-3 h-3 text-slate-400" />
        </Link>

        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors text-left"
        >
          <LogOut className="w-4 h-4 shrink-0 text-red-500" />
          <span>Se déconnecter</span>
        </button>
      </div>
    </div>
  )
}
