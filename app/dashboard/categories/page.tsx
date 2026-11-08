// app/dashboard/categories/page.tsx
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/supabase/dashboard-cache'
import { isSuperAdmin } from '@/lib/auth/admin'

export default async function CategoriesPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/connexion')

  // Si c'est le Super Admin, redirection vers l'espace centralisé
  if (isSuperAdmin(user)) {
    redirect('/super-admin/categories')
  }

  // Les vendeurs ordinaires ne gèrent plus les catégories
  redirect('/dashboard/produits')
}
