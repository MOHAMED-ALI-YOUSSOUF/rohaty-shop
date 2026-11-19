// components/super-admin/SuperAdminShell.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Layers,
  Image as ImageIcon,
  BarChart3,
  Store,
  ShoppingBag,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface SuperAdminShellProps {
  children: React.ReactNode
  adminEmail: string
  adminName: string
}

export function SuperAdminShell({
  children,
  adminEmail,
  adminName,
}: SuperAdminShellProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const navItems = [
    {
      label: 'Vue générale',
      href: '/super-admin',
      icon: LayoutDashboard,
    },
    {
      label: 'Statistiques & Trafic',
      href: '/super-admin/analytics',
      icon: BarChart3,
    },
    {
      label: 'Gestion des catégories',
      href: '/super-admin/categories',
      icon: Layers,
    },
    {
      label: 'Gestion des bannières',
      href: '/super-admin/banners',
      icon: ImageIcon,
    },
  ]

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/connexion')
    router.refresh()
  }

  const getBreadcrumbTitle = (path: string) => {
    if (path === '/super-admin') return 'Vue générale'
    if (path === '/super-admin/analytics') return 'Statistiques & Trafic'
    if (path === '/super-admin/categories') return 'Gestion des catégories'
    if (path === '/super-admin/banners') return 'Gestion des bannières'
    return 'Super Admin'
  }

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900 overflow-hidden font-sans">
      {/* ─── Desktop Sidebar ──────────────────────────────────────────────── */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-slate-200 shrink-0 z-20 h-screen sticky top-0">
        {/* Brand & Badge */}
        <div className="p-6 border-b border-slate-200">
          <Link href="/super-admin" className="flex items-center gap-2 group">
            <span className="font-heading font-extrabold text-lg tracking-wider text-slate-900">
              ROHATY <span className="text-[#2563EB]">SHOP</span>
            </span>
          </Link>
          <div className="mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#2563EB] text-xs font-bold tracking-wide">
            <ShieldCheck className="w-3.5 h-3.5 text-[#2563EB]" />
            SUPER ADMIN
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive =
              item.href === '/super-admin'
                ? pathname === '/super-admin'
                : pathname.startsWith(item.href)
            const Icon = item.icon

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-semibold transition-all relative',
                  isActive
                    ? 'bg-blue-50 text-[#2563EB]'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                )}
              >
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

        {/* Footer links */}
        <div className="p-4 border-t border-slate-200 space-y-2 shrink-0 bg-slate-50/50">
          <Link
            href="/"
            target="_blank"
            className="flex items-center justify-between w-full px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:bg-white hover:text-slate-900 transition-colors border border-transparent hover:border-slate-200"
          >
            <span className="flex items-center gap-2">
              <Store className="w-4 h-4 text-[#2563EB]" />
              Voir le marketplace
            </span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </Link>

          <Link
            href="/dashboard"
            className="flex items-center justify-between w-full px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:bg-white hover:text-slate-900 transition-colors border border-transparent hover:border-slate-200"
          >
            <span className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-emerald-600" />
              Espace vendeur
            </span>
            <ChevronRight className="w-3 h-3 text-slate-400" />
          </Link>

          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors text-left"
          >
            <LogOut className="w-4 h-4 shrink-0 text-red-500" />
            <span>Se déconnecter</span>
          </button>
        </div>
      </aside>

      {/* ─── Mobile Drawer ────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black z-40 lg:hidden"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 bottom-0 left-0 w-64 bg-white z-50 lg:hidden shadow-2xl flex flex-col h-screen"
              style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
            >
              <div className="p-5 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <span className="font-heading font-extrabold text-base tracking-wider text-slate-900">
                    ROHATY <span className="text-[#2563EB]">SHOP</span>
                  </span>
                  <div className="text-[10px] font-bold text-[#2563EB] tracking-wide mt-0.5">
                    SUPER ADMIN
                  </div>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
                  aria-label="Fermer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                {navItems.map((item) => {
                  const isActive =
                    item.href === '/super-admin'
                      ? pathname === '/super-admin'
                      : pathname.startsWith(item.href)
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all',
                        isActive
                          ? 'bg-blue-50 text-[#2563EB]'
                          : 'text-slate-600 hover:bg-slate-100'
                      )}
                    >
                      <Icon className="w-4.5 h-4.5 shrink-0" />
                      <span>{item.label}</span>
                    </Link>
                  )
                })}
              </nav>

              <div className="p-4 border-t border-slate-200 space-y-2 bg-slate-50">
                <Link
                  href="/"
                  target="_blank"
                  className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold text-slate-700"
                >
                  <span className="flex items-center gap-2">
                    <Store className="w-4 h-4 text-[#2563EB]" />
                    Voir le marketplace
                  </span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
                <Link
                  href="/dashboard"
                  className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold text-slate-700"
                >
                  <span className="flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-emerald-600" />
                    Espace vendeur
                  </span>
                  <ChevronRight className="w-3 h-3" />
                </Link>
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-2 w-full px-3 py-2 text-xs font-semibold text-red-600 text-left"
                >
                  <LogOut className="w-4 h-4 text-red-500" />
                  <span>Se déconnecter</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ─── Main Content ─────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Header */}
        <header
          className="h-16 border-b border-slate-200 bg-white/90 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20 shrink-0"
          style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
              aria-label="Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
              <Link href="/super-admin" className="hover:text-slate-900 transition-colors">
                Super Admin
              </Link>
              <ChevronRight className="w-4 h-4 text-slate-400" />
              <span className="text-slate-900 font-semibold">{getBreadcrumbTitle(pathname)}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-bold text-slate-900 leading-tight">
                {adminName || 'Super Administrateur'}
              </span>
              <span className="text-[11px] text-slate-500 leading-tight">{adminEmail}</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shadow-xs">
              SA
            </div>
          </div>
        </header>

        {/* Scrollable Page Body */}
        <main
          className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-50"
          style={{
            paddingBottom: 'max(2rem, env(safe-area-inset-bottom, 0px))',
          }}
        >
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  )
}

