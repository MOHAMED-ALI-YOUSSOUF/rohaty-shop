// app/dashboard/produits/nouveau/page.tsx
// AVANT : refaisait auth.getUser() + stores.select
// APRÈS : cache React partagé depuis le layout

import { redirect } from 'next/navigation'
import { getCurrentUser, getCurrentStore } from '@/lib/supabase/dashboard-cache'
import { NewProductForm } from './NewProductForm'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default async function NouveauProduitPage() {
  // ✅ Cache React — pas de double appel auth
  const user = await getCurrentUser()
  if (!user) redirect('/connexion')

  const store = await getCurrentStore(user.id)
  if (!store) redirect('/dashboard')

  return (
    <div className="space-y-6 max-w-8xl mx-auto">
      <div>
        <Link
          href="/dashboard/produits"
          className="inline-flex items-center gap-2 text-text-secondary hover:text-white mb-8"
        >
          <ArrowLeft size={18} /> Retour aux produits
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold font-heading text-white">
          Ajouter un produit
        </h1>
        <p className="text-text-secondary text-xs mt-1">
          Remplissez les informations ci-dessous pour publier un nouveau produit.
        </p>
      </div>

      <NewProductForm storeId={store.id} />
    </div>
  )
}
