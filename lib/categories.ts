// lib/categories.ts
// Module centralisé de gestion des catégories officielles Rohaty Shop

export interface Category {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
  position: number;
  is_active: boolean;
  created_at?: string;
  product_count?: number;
}

export interface CategoryVisual {
  emoji: string;
  color: string;
}

export const CATEGORY_VISUALS: Record<string, CategoryVisual> = {
  "vetements": { emoji: "👗", color: "#E879F9" },
  "chaussures": { emoji: "👟", color: "#F97316" },
  "accessoires": { emoji: "👜", color: "#6366F1" },
  "parfums": { emoji: "🌸", color: "#EC4899" },
  "beaute-et-soins": { emoji: "💄", color: "#F43F5E" },
  "electronique": { emoji: "📱", color: "#0EA5E9" },
  "maison": { emoji: "🏠", color: "#10B981" },
  "enfants-et-bebes": { emoji: "🧸", color: "#FB923C" },
};

export const DEFAULT_OFFICIAL_CATEGORIES: Omit<Category, "id">[] = [
  { name: "Vêtements", slug: "vetements", position: 1, is_active: true, image_url: null },
  { name: "Chaussures", slug: "chaussures", position: 2, is_active: true, image_url: null },
  { name: "Accessoires", slug: "accessoires", position: 3, is_active: true, image_url: null },
  { name: "Parfums", slug: "parfums", position: 4, is_active: true, image_url: null },
  { name: "Beauté et soins", slug: "beaute-et-soins", position: 5, is_active: true, image_url: null },
  { name: "Électronique", slug: "electronique", position: 6, is_active: true, image_url: null },
  { name: "Maison", slug: "maison", position: 7, is_active: true, image_url: null },
  { name: "Enfants et bébés", slug: "enfants-et-bebes", position: 8, is_active: true, image_url: null },
];

export function getCategoryVisual(slugOrName: string): CategoryVisual {
  const normalized = slugOrName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return CATEGORY_VISUALS[normalized] || { emoji: "🏷️", color: "#2563EB" };
}

