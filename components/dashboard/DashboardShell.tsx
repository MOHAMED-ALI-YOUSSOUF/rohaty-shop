// components/dashboard/DashboardShell.tsx
'use client'

import { useState } from 'react'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

interface DashboardShellProps {
  children: React.ReactNode
  storeName: string
  storeSlug: string
  fullName: string
}

export function DashboardShell({ children, storeName, storeSlug, fullName }: DashboardShellProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900 overflow-hidden font-sans">
      {/* Desktop Sidebar */}
      <Sidebar
        storeName={storeName}
        storeSlug={storeSlug}
        className="hidden lg:flex shrink-0 z-20"
      />

      {/* Mobile Drawer Sidebar */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black z-30 lg:hidden"
            />

            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 bottom-0 left-0 w-[240px] z-40 lg:hidden shadow-2xl h-screen bg-white"
              style={{
                paddingTop: 'env(safe-area-inset-top, 0px)',
              }}
            >
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="absolute p-2 rounded-lg bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors"
                style={{
                  top: 'calc(env(safe-area-inset-top, 0px) + 12px)',
                  right: '16px',
                }}
                aria-label="Fermer le menu"
              >
                <X className="w-4 h-4" />
              </button>

              <Sidebar
                storeName={storeName}
                storeSlug={storeSlug}
                onCloseMobile={() => setIsMobileMenuOpen(false)}
                className="w-full"
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <Header
          fullName={fullName}
          storeSlug={storeSlug}
          onMenuClick={() => setIsMobileMenuOpen(true)}
        />
        <main
          className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 bg-slate-50 relative"
          style={{
            paddingBottom: 'max(2rem, env(safe-area-inset-bottom, 0px))',
          }}
        >
          <div className="max-w-6xl mx-auto page-enter">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
