// app/dashboard/apparence/page.tsx
import { redirect } from 'next/navigation'
import { getCurrentUser, getCurrentStore } from '@/lib/supabase/dashboard-cache'
import { ApparenceForm } from './ApparenceForm'

export default async function ApparencePage() {
  const user = await getCurrentUser()
  if (!user) redirect('/connexion')

  const store = await getCurrentStore(user.id)
  if (!store) redirect('/dashboard')

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold font-heading text-slate-900 tracking-tight">
          Apparence de la boutique
        </h1>
        <p className="text-slate-600 text-xs mt-1">
          Personnalisez les visuels de votre boutique, son logo et sa couleur thématique.
        </p>
      </div>

      <ApparenceForm store={store} />
    </div>
  )
}
