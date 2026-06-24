// components/dashboard/Header.tsx
'use client'

import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Store, ChevronRight, Menu, ExternalLink, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface HeaderProps {
  fullName: string
  storeSlug: string
  onMenuClick: () => void
}

export function Header({ fullName, storeSlug, onMenuClick }: HeaderProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

    const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/connexion')
    router.refresh()
  }

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
   <header className="h-16 border-b border-white/5 bg-bg-surface/50 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-20"
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
      <div className="h-16 flex items-center">
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
      <div className="flex items-center lg:gap-4">
        <Link
          href={storeUrl}
          target="_blank"
          className="inline-flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-lg bg-primary hover:bg-primary/95 text-white hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          <Store className="w-3.5 h-3.5 " />
          <span className="hidden lg:flex">Voir ma boutique</span>
          <ExternalLink className="w-3 h-3 text-white/70 hidden lg:block" />
        </Link>
        
         <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/5 transition-all text-left"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          <span className='hidden lg:block'>Se déconnecter</span>
        </button>

        {/* User initials avatar */}
        {/* <div
          className="w-9 h-9 rounded-full bg-gradient-to-br from-[#2563EB] to-[#8B5CF6] text-white flex items-center justify-center text-sm font-bold shadow-[0_0_12px_rgba(37,99,235,0.2)]"
          title={fullName}
        >
          {getInitials(fullName)}
        </div> */}
      </div>
    </header>
  )
}
