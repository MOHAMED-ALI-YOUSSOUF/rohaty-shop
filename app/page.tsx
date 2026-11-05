// app/page.tsx
import { createPublicClient } from "@/lib/supabase/public";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { SiteHeader } from "@/components/shared/SiteHeader";
import { MarketplacePage } from "@/components/storefront/MarketplacePage";
import Link from "next/link";
import type { Metadata } from "next";
import type { Category } from "@/lib/categories";

export const revalidate = 120;

export const metadata: Metadata = {
  title: "Rohaty Shop | Achetez en ligne à Djibouti",
  description:
    "Tous les produits des boutiques Rohaty Shop au même endroit. Commandez directement via WhatsApp.",
  alternates: { canonical: "https://shop.rohaty.com" },
  openGraph: {
    title: "Rohaty Shop — Achetez en ligne à Djibouti",
    description:
      "Tous les produits disponibles, commandés directement via WhatsApp.",
    url: "https://shop.rohaty.com",
    siteName: "Rohaty Shop",
    images: [
      {
        url: "https://shop.rohaty.com/logo.png",
        width: 1200,
        height: 630,
        alt: "Rohaty Shop",
      },
    ],
    locale: "fr_FR",
    type: "website",
  },
};

interface RawProductImage {
  id: string;
  url: string;
  position: number;
  is_primary: boolean;
}

interface RawStore {
  id: string;
  slug: string;
  name: string;
  whatsapp: string;
  primary_color: string | null;
  logo_url: string | null;
}

interface RawProduct {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  list_price: number;
  image_url: string | null;
  category: string | null;
  category_id: string | null;
  is_published: boolean;
  product_images: RawProductImage[];
  stores: RawStore;
}

export default async function HomePage() {
  const supabase = createPublicClient();

  // Requête parallèle : produits publiés + catégories officielles
  const [{ data: rawProducts, error: pErr }, { data: rawCategories, error: cErr }] =
    await Promise.all([
      supabase
        .from("products")
        .select(
          `id, name, slug, description, price, list_price, image_url, category, category_id, is_published,
           product_images(id, url, position, is_primary),
           stores!inner(id, slug, name, whatsapp, primary_color, logo_url)`,
        )
        .eq("is_published", true)
        .order("price", { ascending: true }),
      supabase
        .from("categories")
        .select("id, name, slug, position, is_active, image_url")
        .eq("is_active", true)
        .order("position", { ascending: true }),
    ]);

  if (pErr) console.error("[/] Products error:", pErr.message, pErr.code);
  if (cErr) console.error("[/] Categories error:", cErr.message, cErr.code);

  const categories = (rawCategories as Category[]) || [];

  const products = ((rawProducts as unknown as RawProduct[]) || [])
    .filter((p) => !!p.stores)
    .map((p) => {
      const store = p.stores;
      const productUrl = `https://shop.rohaty.com/${store.slug}/produits/${p.slug}`;

      const galleryImages: string[] =
        p.product_images && p.product_images.length > 0
          ? [...p.product_images]
              .sort((a, b) => a.position - b.position)
              .map((img) => img.url)
              .filter(Boolean)
          : [];

      const images: string[] =
        p.image_url && !galleryImages.includes(p.image_url)
          ? [p.image_url, ...galleryImages]
          : galleryImages.length > 0
            ? galleryImages
            : p.image_url
              ? [p.image_url]
              : [];

      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        description: p.description,
        price: p.price,
        list_price: p.list_price,
        image_url: p.image_url,
        images,
        category: p.category,
        categoryId: p.category_id,
        storeSlug: store.slug,
        storeName: store.name,
        storeWhatsapp: store.whatsapp,
        storePrimaryColor: store.primary_color || "#2563EB",
        whatsappUrl: buildWhatsAppUrl(p.name, p.price, store.whatsapp, productUrl),
      };
    });

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900 font-sans">
      <SiteHeader />
      <main className="flex-1 pt-header">
        <MarketplacePage products={products} categories={categories} />
      </main>
      <footer className="border-t border-slate-200 py-5 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} Rohaty Digital —{" "}
        <Link href="/vendre" className="font-semibold text-[#2563EB] hover:underline">
          Vendre sur Rohaty Shop
        </Link>
      </footer>
    </div>
  );
}
