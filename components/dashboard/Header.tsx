// components/dashboard/Header.tsx
'use client'

import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
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
    <header
      className="h-16 border-b border-slate-200 bg-white/90 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20 shrink-0"
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
    >
      <div className="h-16 flex items-center gap-3">
        {/* Mobile menu button */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
          aria-label="Menu principal"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
          <Link href="/dashboard" className="hover:text-slate-900 transition-colors">
            Dashboard
          </Link>
          <ChevronRight className="w-4 h-4 text-slate-400" />
          <span className="text-slate-900 font-semibold">{getBreadcrumbTitle(pathname)}</span>
        </div>
      </div>

      {/* Right Part (Store link + Logout) */}
      <div className="flex items-center gap-2 sm:gap-3">
        <Link
          href={storeUrl}
          target="_blank"
          className="inline-flex items-center gap-2 text-xs font-semibold px-3.5 py-2 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white shadow-xs transition-all"
        >
          <Store className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Voir ma boutique</span>
          <ExternalLink className="w-3 h-3 text-white/80 hidden sm:block" />
        </Link>

        <button
          onClick={handleSignOut}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-50 hover:text-red-700 transition-all"
          title="Se déconnecter"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span className="hidden md:inline">Déconnexion</span>
        </button>
      </div>
    </header>
  )
}
