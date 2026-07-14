// lib/supabase/dashboard-cache.ts
// Cache React partagé entre le layout dashboard et toutes ses pages enfants.
// React.cache() garantit que chaque fonction est appelée UNE SEULE FOIS
// par requête HTTP, même si plusieurs composants l'appellent.
//
// AVANT : auth.getUser() appelé 6× par navigation dashboard
// APRÈS  : auth.getUser() appelé 1× — les autres utilisent le cache

import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'

/**
 * Retourne l'utilisateur connecté.
 * Résultat mis en cache pour toute la durée de la requête courante.
 */
export const getCurrentUser = cache(async () => {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
})

/**
 * Retourne la boutique de l'utilisateur donné.
 * Résultat mis en cache pour toute la durée de la requête courante.
 */
export const getCurrentStore = cache(async (userId: string) => {
  const supabase = await createClient()
  const { data: store } = await supabase
    .from('stores')
    .select('*')
    .eq('owner_id', userId)
    .single()
  return store
})

/**
 * Retourne le profil complet de l'utilisateur.
 * Résultat mis en cache pour toute la durée de la requête courante.
 */
export const getCurrentUserProfile = cache(async (userId: string) => {
  const supabase = await createClient()
  const { data: profile } = await supabase
    .from('users')
    .select('full_name')
    .eq('id', userId)
    .single()
  return profile
})
