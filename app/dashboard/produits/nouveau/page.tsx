// app/dashboard/produits/nouveau/page.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser, getCurrentStore } from '@/lib/supabase/dashboard-cache'
import { NewProductForm } from './NewProductForm'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import type { Category } from '@/lib/categories'

export default async function NouveauProduitPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/connexion')

  const store = await getCurrentStore(user.id)
  if (!store) redirect('/dashboard')

  const supabase = await createClient()
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, slug, position, is_active, image_url')
    .eq('is_active', true)
    .order('position', { ascending: true })

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

      <NewProductForm 
        storeId={store.id} 
        categories={(categories as Category[]) || []} 
      />
    </div>
  )
}
