// app/super-admin/layout.tsx
import { redirect } from 'next/navigation'
import { getAuthenticatedSuperAdmin } from '@/lib/auth/admin'
import { createClient } from '@/lib/supabase/server'
import { SuperAdminShell } from '@/components/super-admin/SuperAdminShell'

export const dynamic = 'force-dynamic'

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const adminUser = await getAuthenticatedSuperAdmin()

  if (!adminUser) {
    // Vérifier si l'utilisateur est simplement non connecté ou connecté sans droits
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      redirect('/connexion?next=/super-admin')
    }

    // Utilisateur connecté mais pas Super Admin : renvoyer vers son dashboard vendeur
    redirect('/dashboard')
  }

  const adminEmail = adminUser.email || ''
  const adminName =
    adminUser.user_metadata?.full_name || 'Mohamed Ali (Super Admin)'

  return (
    <SuperAdminShell adminEmail={adminEmail} adminName={adminName}>
      {children}
    </SuperAdminShell>
  )
}

