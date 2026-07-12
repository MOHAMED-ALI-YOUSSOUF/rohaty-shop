/**
 * Determines whether a color is light or dark and returns the appropriate contrasting text color.
 * Supports 3 or 6 digit hex colors, with or without a leading hash '#'.
 */
export function getContrastText(hexColor: string | null | undefined): string {
  if (!hexColor) return '#FFFFFF'

  // Clean the hex color string
  let cleanHex = hexColor.replace('#', '').trim()

  // Handle 3-digit hex format (e.g. "FFF" -> "FFFFFF")
  if (cleanHex.length === 3) {
    cleanHex = cleanHex
      .split('')
      .map((char) => char + char)
      .join('')
  }

  // Fallback to white text if not a valid hex string
  if (cleanHex.length !== 6) {
    return '#FFFFFF'
  }

  const r = parseInt(cleanHex.substring(0, 2), 16)
  const g = parseInt(cleanHex.substring(2, 4), 16)
  const b = parseInt(cleanHex.substring(4, 6), 16)

  if (isNaN(r) || isNaN(g) || isNaN(b)) {
    return '#FFFFFF'
  }

  // Calculate YIQ brightness
  const yiq = (r * 299 + g * 587 + b * 114) / 1000

  // If yiq is 128 or more, the color is light, so return a dark text color.
  // Otherwise, the color is dark, so return white text.
  return yiq >= 128 ? '#111827' : '#FFFFFF'
}
