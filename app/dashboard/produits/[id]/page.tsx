// app/dashboard/produits/[id]/page.tsx
// AVANT : refaisait auth.getUser() + stores.select
// APRÈS : cache React partagé depuis le layout

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser, getCurrentStore } from '@/lib/supabase/dashboard-cache'
import { EditProductForm } from './EditProductForm'

interface ModifierProduitPageProps {
  params: Promise<{ id: string }>
}

export default async function ModifierProduitPage({
  params,
}: ModifierProduitPageProps) {
  const { id } = await params

  // ✅ Cache React — pas de double appel auth
  const user = await getCurrentUser()
  if (!user) redirect('/connexion')

  const store = await getCurrentStore(user.id)
  if (!store) redirect('/dashboard')

  // Récupérer le produit à modifier (query propre à cette page)
  const supabase = await createClient()
  const { data: product } = await supabase
    .from('products')
    .select(
      `
      *,
      product_images (
        id,
        url,
        position,
        is_primary
      )
    `
    )
    .eq('id', id)
    .eq('store_id', store.id)
    .single()

  if (!product) redirect('/dashboard/produits')

  return (
    <div className="space-y-6 max-w-8xl mx-auto">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold font-heading text-white">
          Modifier le produit
        </h1>
        <p className="text-text-secondary text-xs mt-1">
          Modifiez les détails de votre produit ci-dessous.
        </p>
      </div>

      <EditProductForm product={product} />
    </div>
  )
}
