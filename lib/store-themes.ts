export interface StoreTheme {
  name: string
  pageColor: string
  textColor: string
  secondaryTextColor: string
  cardColor: string
  primaryColor: string
}

export const STORE_THEMES: Record<string, StoreTheme> = {
  midnight: {
    name: "Midnight Premium",
    pageColor: "#0F172A",
    textColor: "#FFFFFF",
    secondaryTextColor: "#94A3B8",
    cardColor: "#1E293B",
    primaryColor: "#2563EB",
  },
  clean: {
    name: "Clean Store",
    pageColor: "#FFFFFF",
    textColor: "#111827",
    secondaryTextColor: "#6B7280",
    cardColor: "#F9FAFB",
    primaryColor: "#2563EB",
  },
  nature: {
    name: "Nature",
    pageColor: "#F0FDF4",
    textColor: "#14532D",
    secondaryTextColor: "#166534",
    cardColor: "#FFFFFF",
    primaryColor: "#16A34A",
  },
  fashion: {
    name: "Elegant Fashion",
    pageColor: "#FFF1F2",
    textColor: "#4C0519",
    secondaryTextColor: "#881337",
    cardColor: "#FFFFFF",
    primaryColor: "#E11D48",
  },
}

export function getTheme(themeName: string | null | undefined): StoreTheme {
  const name = themeName || 'midnight'
  return STORE_THEMES[name] || STORE_THEMES.midnight
}
