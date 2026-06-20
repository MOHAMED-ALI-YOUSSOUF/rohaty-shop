// app/dashboard/boutique/page.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BoutiqueForm } from './BoutiqueForm'

export default async function BoutiquePage() {
  const supabase = await createClient()

  // 1. Récupérer l'utilisateur connecté
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/connexion')
  }

  // 2. Récupérer la boutique de l'utilisateur
  const { data: store } = await supabase
    .from('stores')
    .select('id, name, slug, slogan, whatsapp')
    .eq('owner_id', user.id)
    .single()

  if (!store) {
    redirect('/dashboard')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold font-heading text-white">
          Paramètres de la boutique
        </h1>
        <p className="text-text-secondary text-xs mt-1">
          Gérez les informations d'identification, de contact et l'adresse de votre boutique.
        </p>
      </div>

      <BoutiqueForm store={store} />
    </div>
  )
}
