// app/dashboard/statistiques/page.tsx
import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getCurrentUser, getCurrentStore } from '@/lib/supabase/dashboard-cache'
import { StoreAnalyticsClient } from '@/components/dashboard/StoreAnalyticsClient'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Statistiques & Performance | Tableau de bord Rohaty Shop',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

export default async function StatistiquesPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/connexion')

  const store = await getCurrentStore(user.id)
  if (!store) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-12 space-y-4">
        <h2 className="text-xl font-bold text-slate-900 font-heading">Aucune boutique trouvée</h2>
        <p className="text-sm text-slate-600">
          Veuillez configurer votre boutique pour accéder à vos statistiques.
        </p>
        <Link
          href="/dashboard/boutique"
          className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg text-xs font-semibold bg-[#2563EB] hover:bg-[#1D4ED8] text-white transition-all shadow-xs"
        >
          Créer ma boutique
        </Link>
      </div>
    )
  }

  return <StoreAnalyticsClient />
}

