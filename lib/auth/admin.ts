// lib/auth/admin.ts
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export function isSuperAdmin(user: { email?: string | null; app_metadata?: Record<string, any> } | null | undefined): boolean {
  if (!user) return false

  // 1. Vérification via app_metadata dans Supabase Auth (défini uniquement par le service_role)
  if (user.app_metadata?.role === 'super_admin' || user.app_metadata?.is_super_admin === true) {
    return true
  }

  // 2. Vérification par email autorisé via variable d'environnement
  const adminEmails = (process.env.SUPER_ADMIN_EMAILS || 'wizzimed@gmail.com')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)

  if (user.email && adminEmails.includes(user.email.toLowerCase())) {
    return true
  }

  return false
}

/**
 * Client Supabase avec droits Service Role (admin bypass RLS)
 * À utiliser EXCLUSIVEMENT côté serveur dans des contextes vérifiés Super Admin.
 */
export function getAdminSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    throw new Error('Supabase admin configuration missing (NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY)')
  }

  return createSupabaseClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

/**
 * Vérifie côté serveur que l'utilisateur connecté est Super Admin.
 * Retourne l'utilisateur si valide, sinon null.
 */
export async function getAuthenticatedSuperAdmin() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || !isSuperAdmin(user)) {
    return null
  }

  return user
}

