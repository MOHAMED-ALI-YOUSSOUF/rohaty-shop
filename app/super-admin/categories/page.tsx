// app/super-admin/categories/page.tsx
import { getAdminSupabase } from '@/lib/auth/admin'
import {
  CategoriesAdminClient,
  CategoryAdminItem,
} from '@/components/super-admin/CategoriesAdminClient'

export const dynamic = 'force-dynamic'

interface RawCategoryWithProducts {
  id: string
  name: string
  slug: string
  image_url: string | null
  position: number
  is_active: boolean
  products?: { id: string }[]
}

export default async function SuperAdminCategoriesPage() {
  const supabase = getAdminSupabase()

  const { data: categories } = await supabase
    .from('categories')
    .select('*, products(id)')
    .order('position', { ascending: true })

  const rawList = (categories as unknown as RawCategoryWithProducts[]) || []
  const initialCategories: CategoryAdminItem[] = rawList.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    image_url: c.image_url,
    position: c.position,
    is_active: c.is_active,
    product_count: c.products ? c.products.length : 0,
  }))

  return <CategoriesAdminClient initialCategories={initialCategories} />
}

