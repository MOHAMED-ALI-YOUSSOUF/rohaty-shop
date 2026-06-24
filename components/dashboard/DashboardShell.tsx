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
    <div className="min-h-screen flex bg-[#0F172A] text-white overflow-hidden">
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
              className="fixed top-0 bottom-0 left-0 w-[240px] z-40 lg:hidden shadow-2xl h-screen"
              style={{
                // Le drawer mobile démarre sous la notch
                paddingTop: 'env(safe-area-inset-top, 0px)',
              }}
            >
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="absolute p-2 rounded-lg bg-bg-surface border border-white/5 hover:bg-white/5 text-text-secondary hover:text-white transition-colors"
                style={{
                  // Positionne le bouton X sous la notch + un petit gap
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

      {/* Main Content Area — h-screen avec overflow pour que Header sticky fonctionne */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <Header
          fullName={fullName}
          storeSlug={storeSlug}
          onMenuClick={() => setIsMobileMenuOpen(true)}
        />
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-[#0F172A] relative"
          style={{
            // Safe area bottom : barre de geste iOS en bas
            paddingBottom: 'max(2rem, env(safe-area-inset-bottom, 0px))',
          }}
        >
          <div className="absolute top-0 right-0 w-[300px] h-[300px] rounded-full bg-blue-900/10 blur-[100px] pointer-events-none -z-10" />
          <div className="max-w-6xl mx-auto page-enter">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}