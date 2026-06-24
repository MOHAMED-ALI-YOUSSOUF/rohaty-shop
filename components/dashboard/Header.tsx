// components/dashboard/Header.tsx
'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Store, ChevronRight, Menu, ExternalLink } from 'lucide-react'

interface HeaderProps {
  fullName: string
  storeSlug: string
  onMenuClick: () => void
}

export function Header({ fullName, storeSlug, onMenuClick }: HeaderProps) {
  const pathname = usePathname()

  // Générer les initiales de l'utilisateur
  const getInitials = (name: string) => {
    if (!name) return 'U'
    const parts = name.trim().split(/\s+/)
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }

  // Obtenir le titre du breadcrumb selon le chemin actuel
  const getBreadcrumbTitle = (path: string) => {
    if (path === '/dashboard') return 'Accueil'
    if (path === '/dashboard/produits') return 'Mes produits'
    if (path === '/dashboard/produits/nouveau') return 'Nouveau produit'
    if (path.startsWith('/dashboard/produits/') && path !== '/dashboard/produits/nouveau') return 'Modifier le produit'
    if (path === '/dashboard/boutique') return 'Paramètres boutique'
    if (path === '/dashboard/apparence') return 'Apparence et Thème'
    return 'Tableau de bord'
  }

  const storeUrl = `/${storeSlug}`

  return (
    <header className="border-b ... sticky top-0 z-20 flex flex-col"
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
      <div className="h-16 flex items-center justify-between">
        {/* Mobile menu button */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg hover:bg-white/5 text-text-secondary hover:text-white transition-colors"
          aria-label="Menu principal"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-sm text-text-secondary font-medium">
          <Link href="/dashboard" className="hover:text-white transition-colors">
            Dashboard
          </Link>
          <ChevronRight className="w-4 h-4 text-text-muted" />
          <span className="text-white font-semibold">{getBreadcrumbTitle(pathname)}</span>
        </div>
      </div>

      {/* Right Part (Store link + Avatar) */}
      <div className="flex items-center gap-4">
        <Link
          href={storeUrl}
          target="_blank"
          className="hidden sm:inline-flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-lg bg-primary hover:bg-primary/95 text-white hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          <Store className="w-3.5 h-3.5" />
          Voir ma boutique
          <ExternalLink className="w-3 h-3 text-white/70" />
        </Link>

        {/* User initials avatar */}
        <div
          className="w-9 h-9 rounded-full bg-gradient-to-br from-[#2563EB] to-[#8B5CF6] text-white flex items-center justify-center text-sm font-bold shadow-[0_0_12px_rgba(37,99,235,0.2)]"
          title={fullName}
        >
          {getInitials(fullName)}
        </div>
      </div>
    </header>
  )
}
