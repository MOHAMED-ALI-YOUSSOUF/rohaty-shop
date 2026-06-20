// app/dashboard/layout.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardShell } from '@/components/dashboard/DashboardShell'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const supabase = await createClient()

  // 1. Récupérer l'utilisateur connecté
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/connexion')
  }

  // 2. Récupérer son profil (nom complet)
  const { data: userProfile } = await supabase
    .from('users')
    .select('full_name')
    .eq('id', user.id)
    .single()

  const fullName = userProfile?.full_name || user.user_metadata?.full_name || 'Commerçant'

  // 3. Récupérer la boutique associée
  const { data: store } = await supabase
    .from('stores')
    .select('name, slug')
    .eq('owner_id', user.id)
    .single()

  const storeName = store?.name || 'Ma Boutique'
  const storeSlug = store?.slug || ''

  return (
    <DashboardShell
      storeName={storeName}
      storeSlug={storeSlug}
      fullName={fullName}
    >
      {children}
    </DashboardShell>
  )
}
