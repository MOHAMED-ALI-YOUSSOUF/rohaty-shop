import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merge Tailwind classes without conflicts.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Convert any string to a URL-safe slug.
 * Example: "Sac en Cuir Marron" → "sac-en-cuir-marron"
 */
export function slugify(text: string): string {
  return text
    .toString()
    .normalize('NFD')                          // decompose accented chars
    .replace(/[\u0300-\u036f]/g, '')           // remove diacritics
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')             // keep only alphanumeric, spaces, hyphens
    .replace(/[\s_]+/g, '-')                  // spaces/underscores → hyphens
    .replace(/-+/g, '-')                       // collapse multiple hyphens
    .replace(/^-+|-+$/g, '')                   // trim leading/trailing hyphens
}
