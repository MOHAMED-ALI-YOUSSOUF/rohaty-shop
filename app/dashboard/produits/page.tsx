// app/dashboard/produits/page.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProductListClient } from './ProductListClient'
import { Plus } from 'lucide-react'
import Link from 'next/link'

export default async function ProduitsPage() {
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
    // Si pas de boutique, on ne peut pas charger de produits
    return (
      <div className="flex flex-col items-center justify-center text-center py-12 space-y-4">
        <h2 className="text-xl font-bold text-white font-heading">Aucune boutique trouvée</h2>
        <p className="text-sm text-text-secondary">
          Veuillez créer une boutique dans vos paramètres avant de pouvoir gérer des produits.
        </p>
        <Link
          href="/dashboard/boutique"
          className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg text-xs font-semibold bg-primary hover:bg-primary/95 text-white transition-all"
        >
          Créer ma boutique
        </Link>
      </div>
    )
  }

  // 3. Récupérer tous les produits de la boutique (tous, y compris brouillons)
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-heading text-white">
            Mes produits
          </h1>
          <p className="text-text-secondary text-xs mt-1">
            Gérez le catalogue de produits de votre boutique.
          </p>
        </div>
        <Link
          href="/dashboard/produits/nouveau"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-[#2563EB] to-[#06B6D4] text-white hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_4px_20px_rgba(37,99,235,0.25)]"
        >
          <Plus className="w-4 h-4" />
          Ajouter un produit
        </Link>
      </div>


      {/* Liste des produits (Composant Client) */}
      <ProductListClient initialProducts={products || []} />
    </div>
  )
}
