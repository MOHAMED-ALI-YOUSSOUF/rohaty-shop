// app/dashboard/layout.tsx
// Layout du dashboard — utilise le cache React partagé
//
// AVANT : layout faisait auth.getUser() + 2 queries, puis chaque page enfant refaisait tout
// APRÈS : layout initialise le cache, les pages enfants réutilisent le même résultat

import { redirect } from 'next/navigation'
import { DashboardShell } from '@/components/dashboard/DashboardShell'
import {
  getCurrentUser,
  getCurrentStore,
  getCurrentUserProfile,
} from '@/lib/supabase/dashboard-cache'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // getCurrentUser() est mis en cache par React — si une page enfant l'appelle aussi,
  // c'est le même résultat réutilisé (0 appel réseau supplémentaire)
  const user = await getCurrentUser()
  if (!user) redirect('/connexion')

  // Charger store et profil en parallèle
  const [store, userProfile] = await Promise.all([
    getCurrentStore(user.id),
    getCurrentUserProfile(user.id),
  ])

  const fullName =
    userProfile?.full_name || user.user_metadata?.full_name || 'Commerçant'
  const storeName = store?.name || 'Ma Boutique'
  const storeSlug = store?.slug || ''

  return (
    <DashboardShell
      storeName={storeName}
      storeSlug={storeSlug}
      fullName={fullName}
    >
      {children}
    </DashboardShell>
  )
}