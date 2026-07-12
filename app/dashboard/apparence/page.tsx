// app/dashboard/apparence/page.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ApparenceForm } from './ApparenceForm'
export const dynamic = 'force-dynamic'

export default async function ApparencePage() {
  const supabase = await createClient()

  // 1. Récupérer l'utilisateur connecté
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/connexion')
  }

  // 2. Récupérer la boutique associée
  const { data: store } = await supabase
    .from('stores')
    .select(`
  id,
  name,
  slug,
  slogan,
  logo_url,
  banner_url,
  primary_color,
  page_color,
  theme_name,
  text_color,
  secondary_text_color,
  card_color
`)
    .eq('owner_id', user.id)
    .single()

  if (!store) {
    redirect('/dashboard')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold font-heading text-white">
          Apparence de la boutique
        </h1>
        <p className="text-text-secondary text-xs mt-1">
          Personnalisez les visuels de votre boutique, son logo et sa couleur thématique.
        </p>
      </div>

      <ApparenceForm store={store} />
    </div>
  )
}
