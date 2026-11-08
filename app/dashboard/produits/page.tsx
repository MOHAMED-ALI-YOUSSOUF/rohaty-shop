// app/dashboard/produits/page.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser, getCurrentStore } from '@/lib/supabase/dashboard-cache'
import { ProductListClient } from './ProductListClient'
import { Plus } from 'lucide-react'
import Link from 'next/link'

export default async function ProduitsPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/connexion')

  const store = await getCurrentStore(user.id)

  if (!store) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-12 space-y-4">
        <h2 className="text-xl font-bold text-slate-900 font-heading">Aucune boutique trouvée</h2>
        <p className="text-sm text-slate-600">
          Veuillez configurer votre boutique avant de pouvoir gérer des produits.
        </p>
        <Link
          href="/dashboard/boutique"
          className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg text-xs font-semibold bg-[#2563EB] hover:bg-[#1D4ED8] text-white transition-all shadow-xs"
        >
          Créer ma boutique
        </Link>
      </div>
    )
  }

  // Récupérer tous les produits de la boutique
  const supabase = await createClient()
  const { data: products, error } = await supabase
    .from('products')
    .select('*')
    .eq('store_id', store.id)
    .order('sort_order', { ascending: true })

  if (error) {
    console.error('Erreur fetching products:', error)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold font-heading text-slate-900 tracking-tight">
            Mes produits
          </h1>
          <p className="text-slate-600 text-xs mt-1">
            Gérez le catalogue de produits de votre boutique.
          </p>
        </div>
        <Link
          href="/dashboard/produits/nouveau"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-bold bg-[#2563EB] hover:bg-[#1D4ED8] text-white transition-all shadow-xs self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Ajouter un produit
        </Link>
      </div>

      {/* Liste des produits */}
      <ProductListClient initialProducts={products || []} />
    </div>
  )
}
