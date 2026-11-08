// app/dashboard/boutique/page.tsx
import { redirect } from 'next/navigation'
import { getCurrentUser, getCurrentStore } from '@/lib/supabase/dashboard-cache'
import { BoutiqueForm } from './BoutiqueForm'

export default async function BoutiquePage() {
  const user = await getCurrentUser()
  if (!user) redirect('/connexion')

  const store = await getCurrentStore(user.id)
  if (!store) redirect('/dashboard')

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold font-heading text-slate-900 tracking-tight">
          Paramètres de la boutique
        </h1>
        <p className="text-slate-600 text-xs mt-1">
          Gérez les informations d&apos;identification, de contact et l&apos;adresse de votre boutique.
        </p>
      </div>

      <BoutiqueForm store={store} />
    </div>
  )
}
