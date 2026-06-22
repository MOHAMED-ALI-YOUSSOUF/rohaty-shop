// app/dashboard/produits/nouveau/page.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { NewProductForm } from './NewProductForm'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default async function NouveauProduitPage() {
  const supabase = await createClient()

  // 1. Récupérer l'utilisateur
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/connexion')
  }

  // 2. Récupérer la boutique
  const { data: store } = await supabase
    .from('stores')
    .select('id')
    .eq('owner_id', user.id)
    .single()

  if (!store) {
    redirect('/dashboard')
  }

  return (
    <div className="space-y-6 max-w-8xl mx-auto">
      <div>
        <Link href="/dashboard/produits" className="inline-flex items-center gap-2 text-text-secondary hover:text-white mb-8">
          <ArrowLeft size={18} /> Retour aux produits
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold font-heading text-white">
          Ajouter un produit
        </h1>
        <p className="text-text-secondary text-xs mt-1">
          Remplissez les informations ci-dessous pour publier un nouveau produit.
        </p>
      </div>

      {/* Formulaire Client */}
      <NewProductForm storeId={store.id} />
    </div>
  )
}
