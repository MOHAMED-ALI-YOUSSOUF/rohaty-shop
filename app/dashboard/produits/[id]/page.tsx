// app/dashboard/produits/[id]/page.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { EditProductForm } from './EditProductForm'

interface ModifierProduitPageProps {
  params: Promise<{ id: string }>
}

export default async function ModifierProduitPage({ params }: ModifierProduitPageProps) {
  const { id } = await params
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

  // 3. Récupérer le produit à modifier
  const { data: product } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .eq('store_id', store.id)
    .single()

  if (!product) {
    // Si le produit n'existe pas ou n'appartient pas à cette boutique, retour à la liste
    redirect('/dashboard/produits')
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold font-heading text-white">
          Modifier le produit
        </h1>
        <p className="text-text-secondary text-xs mt-1">
          Modifiez les détails de votre produit ci-dessous.
        </p>
      </div>

      {/* Formulaire Client de Modification */}
      <EditProductForm product={product} />
    </div>
  )
}
