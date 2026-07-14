// app/dashboard/boutique/page.tsx
// AVANT : refaisait auth.getUser() + stores.select
// APRÈS : cache React partagé depuis le layout

import { redirect } from 'next/navigation'
import { getCurrentUser, getCurrentStore } from '@/lib/supabase/dashboard-cache'
import { BoutiqueForm } from './BoutiqueForm'

export default async function BoutiquePage() {
  // ✅ Cache React — pas de double appel auth
  const user = await getCurrentUser()
  if (!user) redirect('/connexion')

  const store = await getCurrentStore(user.id)
  if (!store) redirect('/dashboard')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold font-heading text-white">
          Paramètres de la boutique
        </h1>
        <p className="text-text-secondary text-xs mt-1">
          Gérez les informations d&apos;identification, de contact et l&apos;adresse de votre boutique.
        </p>
      </div>

      <BoutiqueForm store={store} />
    </div>
  )
}
