// app/dashboard/layout.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardShell } from '@/components/dashboard/DashboardShell'
import { cache } from 'react'  // ← ajout


// Mettre les queries en cache React pour éviter les re-fetch à chaque navigation
const getUser = cache(async () => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return { supabase, user }
})

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { supabase, user } = await getUser()

  if (!user) redirect('/connexion')

  const [{ data: userProfile }, { data: store }] = await Promise.all([
    supabase.from('users').select('full_name').eq('id', user.id).single(),
    supabase.from('stores').select('name, slug').eq('owner_id', user.id).single(),
  ])

  const fullName = userProfile?.full_name || user.user_metadata?.full_name || 'Commerçant'
  const storeName = store?.name || 'Ma Boutique'
  const storeSlug = store?.slug || ''

  return (
    <DashboardShell storeName={storeName} storeSlug={storeSlug} fullName={fullName}>
      {children}
    </DashboardShell>
  )
}