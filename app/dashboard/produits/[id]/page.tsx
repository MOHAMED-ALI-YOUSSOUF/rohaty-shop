// app/dashboard/produits/[id]/page.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser, getCurrentStore } from '@/lib/supabase/dashboard-cache'
import { EditProductForm } from './EditProductForm'
import type { Category } from '@/lib/categories'

interface ModifierProduitPageProps {
  params: Promise<{ id: string }>
}

export default async function ModifierProduitPage({
  params,
}: ModifierProduitPageProps) {
  const { id } = await params

  const user = await getCurrentUser()
  if (!user) redirect('/connexion')

  const store = await getCurrentStore(user.id)
  if (!store) redirect('/dashboard')

  const supabase = await createClient()

  // Fetch produit + images + catégories officielles
  const [{ data: product }, { data: categories }] = await Promise.all([
    supabase
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
      .single(),
    supabase
      .from('categories')
      .select('id, name, slug, position, is_active, image_url')
      .eq('is_active', true)
      .order('position', { ascending: true })
  ])

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

      <EditProductForm 
        product={product} 
        categories={(categories as Category[]) || []} 
      />
    </div>
  )
}
