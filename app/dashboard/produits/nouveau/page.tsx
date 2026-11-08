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
    <div className="space-y-6 max-w-7xl mx-auto font-sans">
      <div>
        <Link
          href="/dashboard/produits"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900 mb-4 transition"
        >
          <ArrowLeft size={16} /> Retour aux produits
        </Link>
        <h1 className="text-2xl md:text-3xl font-extrabold font-heading text-slate-900 tracking-tight">
          Ajouter un produit
        </h1>
        <p className="text-slate-600 text-xs mt-1">
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
