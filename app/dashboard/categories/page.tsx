// app/dashboard/categories/page.tsx
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/supabase/dashboard-cache'
import { createClient } from '@/lib/supabase/server'
import { CategoriesManager } from './CategoriesManager'

interface DbCategoryRow {
  id: string
  name: string
  slug: string
  image_url: string | null
  position: number
  is_active: boolean
  products?: { id: string }[]
}

export default async function CategoriesAdminPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/connexion')

  const supabase = await createClient()

  // Récupérer toutes les catégories avec le décompte de leurs produits
  const { data: categories, error } = await supabase
    .from('categories')
    .select('*, products(id)')
    .order('position', { ascending: true })

  if (error) {
    console.error('Error fetching categories for admin:', error)
  }

  const rawList = (categories as unknown as DbCategoryRow[]) || []
  const formattedCategories = rawList.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    image_url: c.image_url,
    position: c.position,
    is_active: c.is_active,
    product_count: c.products ? c.products.length : 0,
  }))

  return (
    <div className="space-y-6 max-w-8xl mx-auto">
      <CategoriesManager initialCategories={formattedCategories} />
    </div>
  )
}
