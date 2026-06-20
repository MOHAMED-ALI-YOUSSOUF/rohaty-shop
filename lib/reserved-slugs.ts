// lib/reserved-slugs.ts — Rohaty Shop
import { z } from 'zod'

/**
 * Slugs reserved for internal application routes.
 * A merchant cannot use any of these as their store slug.
 */
export const RESERVED_SLUGS = [
  'dashboard',
  'connexion',
  'inscription',
  'admin',
  'api',
  'pricing',
  'tarifs',
  'settings',
  'support',
  'help',
] as const

/**
 * Zod schema that validates a slug:
 *  - 3 to 40 chars
 *  - only lowercase letters, digits, hyphens
 *  - not a reserved slug
 */
export const reservedSlugsSchema = z
  .string()
  .min(3, 'Le slug doit contenir au moins 3 caractères')
  .max(40, 'Le slug ne peut pas dépasser 40 caractères')
  .regex(/^[a-z0-9-]+$/, 'Le slug ne peut contenir que des lettres minuscules, chiffres et tirets')
  .refine(
    (val) => !(RESERVED_SLUGS as readonly string[]).includes(val),
    { message: 'Ce nom est réservé, veuillez en choisir un autre' }
  )
