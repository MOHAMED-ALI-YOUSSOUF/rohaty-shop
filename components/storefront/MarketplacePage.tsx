"use client";

// components/storefront/MarketplacePage.tsx
// Landing page marketplace `/`.
// — Pas de section boutiques.
// — Catégories officielles centralisées et standardisées.
// — Tri par prix croissant ; produits au même prix mélangés aléatoirement côté client.
// — Clic sur une carte → Bottom Sheet (MarketplaceProductSheet).
// — Carrousel de bannières promotionnelles.
// — Catégories avec images circulaires officielles.
// — Une seule barre de recherche : dans SiteHeader (synchro via event custom).
// — Le SaaS /[nom-boutique] n'est PAS modifié.

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  MarketplaceProductCard,
  type MarketplaceCardProduct,
} from "./MarketplaceProductCard";
import {
  MarketplaceProductSheet,
  type SheetProduct,
} from "./MarketplaceProductSheet";
import {
  type Category,
  getCategoryVisual,
  DEFAULT_OFFICIAL_CATEGORIES,
} from "@/lib/categories";

/* ─── Types ─────────────────────────────────────────────────────────────── */

export interface MarketplaceProduct {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  list_price: number;
  image_url: string | null;
  images: string[];
  category: string | null;
  categoryId?: string | null;
  storeSlug: string;
  storeName: string;
  storeWhatsapp: string;
  storePrimaryColor: string;
  whatsappUrl: string;
}

export interface MarketplaceBanner {
  id: string;
  image_url: string;
  position: number;
  is_active: boolean;
}

export interface MarketplaceStore {
  id: string;
  name: string;
  slug: string;
  slogan: string | null;
  logo_url: string | null;
  banner_url: string | null;
  primary_color: string;
}

interface MarketplacePageProps {
  products: MarketplaceProduct[];
  categories?: Category[];
  banners?: MarketplaceBanner[];
  stores?: MarketplaceStore[];
}

/* ─── Utilitaires de tri & shuffle ───────────────────────────────────────── */
const PAGE_SIZE = 24;

function sortAndShuffle(products: MarketplaceProduct[]): MarketplaceProduct[] {
  const groups = new Map<number, MarketplaceProduct[]>();
  for (const p of products) {
    const key = typeof p.price === "number" && p.price > 0 ? p.price : Infinity;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(p);
  }
  const sortedKeys = [...groups.keys()].sort((a, b) => a - b);
  const result: MarketplaceProduct[] = [];
  for (const key of sortedKeys) {
    const group = groups.get(key)!;
    for (let i = group.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [group[i], group[j]] = [group[j], group[i]];
    }
    result.push(...group);
  }
  return result;
}

/* ─── Composant principal ───────────────────────────────────────────────── */

export function MarketplacePage({
  products,
  categories: initialCategories = [],
  banners = [],
}: MarketplacePageProps) {
  const [activeCategorySlug, setActiveCategorySlug] = useState("");
  const [search, setSearch] = useState("");
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [selectedProduct, setSelectedProduct] = useState<SheetProduct | null>(null);

  // Catégories officielles (avec fallback par défaut si vide)
  const officialCategories: Category[] = useMemo(() => {
    if (initialCategories && initialCategories.length > 0) {
      return initialCategories.filter((c) => c.is_active);
    }
    return DEFAULT_OFFICIAL_CATEGORIES.map((c, i) => ({
      ...c,
      id: `cat-${i}`,
    })) as Category[];
  }, [initialCategories]);

  // Tri + shuffle exécuté côté client pour éviter tout warning d'hydratation
  const [prevProducts, setPrevProducts] = useState(products);
  const [sortedProducts, setSortedProducts] = useState<MarketplaceProduct[]>(() =>
    sortAndShuffle(products)
  );

  if (products !== prevProducts) {
    setPrevProducts(products);
    setSortedProducts(sortAndShuffle(products));
  }

  // Synchroniser avec la recherche du SiteHeader via event custom
  const handleHeaderSearch = useCallback((e: Event) => {
    const query = (e as CustomEvent<{ query: string }>).detail.query;
    setSearch(query);
  }, []);

  useEffect(() => {
    window.addEventListener("marketplace:search", handleHeaderSearch);
    return () =>
      window.removeEventListener("marketplace:search", handleHeaderSearch);
  }, [handleHeaderSearch]);

  // Catégorie active trouvée
  const activeCategoryObj = useMemo(
    () => officialCategories.find((c) => c.slug === activeCategorySlug) || null,
    [officialCategories, activeCategorySlug]
  );

  // Filtrage des produits (catégorie officielle + recherche)
  const filtered = useMemo(() => {
    let result = sortedProducts;

    if (activeCategoryObj) {
      result = result.filter(
        (p) =>
          p.categoryId === activeCategoryObj.id ||
          p.category?.toLowerCase() === activeCategoryObj.name.toLowerCase()
      );
    }

    const q = search.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.storeName.toLowerCase().includes(q) ||
          (p.category?.toLowerCase() ?? "").includes(q)
      );
    }
    return result;
  }, [sortedProducts, activeCategoryObj, search]);

  const shown = filtered.slice(0, visible);
  const hasFilter = !!activeCategorySlug || !!search.trim();

  const handleSelectCategory = (slug: string) => {
    setActiveCategorySlug((prev) => (prev === slug ? "" : slug));
    setVisible(PAGE_SIZE);
  };

  const handleOpenSheet = (product: MarketplaceCardProduct) => {
    setSelectedProduct(product as SheetProduct);
  };

  return (
    <div className="pb-16 font-sans">
      {/* ── 1. Carrousel bannières (images pures, masqué si filtre actif ou si aucune bannière) ── */}
      {!hasFilter && banners && banners.length > 0 && (
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-3">
          <BannerCarousel banners={banners} />
        </div>
      )}

      {/* ── 2. Catégories officielles avec images circulaires (sticky) ── */}
      <OfficialCategoryPills
        categories={officialCategories}
        activeSlug={activeCategorySlug}
        onSelect={handleSelectCategory}
      />

      {/* ── 3. Grille de produits ── */}
      <div className="px-3 sm:px-6 lg:px-8 mt-6">
        <div className="flex items-center justify-between mb-3.5">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
            {activeCategoryObj ? activeCategoryObj.name : "Tous les produits"}
            <span className="text-slate-400 font-normal text-xs">
              ({filtered.length})
            </span>
          </h2>
          {hasFilter && (
            <button
              onClick={() => {
                setActiveCategorySlug("");
                setSearch("");
                setVisible(PAGE_SIZE);
              }}
              className="text-xs font-semibold text-[#2563EB] hover:underline"
            >
              Réinitialiser
            </button>
          )}
        </div>

        {shown.length > 0 ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3">
              {shown.map((product) => (
                <MarketplaceProductCard
                  key={product.id}
                  product={product}
                  onOpenSheet={handleOpenSheet}
                />
              ))}
            </div>

            {visible < filtered.length && (
              <div className="flex justify-center mt-8">
                <button
                  onClick={() => setVisible((v) => v + PAGE_SIZE)}
                  className="px-8 py-2.5 rounded-full border border-[#2563EB] text-[#2563EB] hover:bg-[#2563EB] hover:text-white text-sm font-semibold transition"
                >
                  Voir plus de produits
                </button>
              </div>
            )}
          </>
        ) : (
          <EmptyState
            search={search}
            category={activeCategoryObj?.name || ""}
            hasFilter={hasFilter}
            onReset={() => {
              setSearch("");
              setActiveCategorySlug("");
              setVisible(PAGE_SIZE);
            }}
          />
        )}
      </div>

      {/* ── Bottom Sheet produit ── */}
      <MarketplaceProductSheet
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />
    </div>
  );
}

/* ─── Carrousel de bannières (images pures, sans texte superposé) ────────── */

function BannerCarousel({ banners }: { banners: MarketplaceBanner[] }) {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [paused, setPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const total = banners.length;

  const goTo = useCallback(
    (n: number, dir = 1) => {
      if (total === 0) return;
      setDirection(dir);
      setIndex(((n % total) + total) % total);
    },
    [total]
  );

  // Autoplay
  useEffect(() => {
    if (paused || total <= 1) return;
    const id = setInterval(() => goTo(index + 1, 1), 4800);
    return () => clearInterval(id);
  }, [index, paused, goTo, total]);

  // Pause quand hors du viewport
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => setPaused(!entry.isIntersecting),
      { threshold: 0.3 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || total <= 1) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 40) goTo(index + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1);
    touchStartX.current = null;
  };

  if (total === 0) return null;
  const currentBanner = banners[index] || banners[0];

  const variants = {
    enter: (d: number) => ({ x: d > 0 ? "100%" : "-100%", opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? "-100%" : "100%", opacity: 0 }),
  };

  return (
    <div
      ref={containerRef}
      className="relative rounded-2xl overflow-hidden h-36 sm:h-52 md:h-64 lg:h-72 select-none shadow-xs bg-slate-100"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={(e) => (touchStartX.current = e.touches[0].clientX)}
      onTouchEnd={handleTouchEnd}
    >
      <AnimatePresence initial={false} custom={direction} mode="wait">
        <motion.div
          key={currentBanner.id}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0"
        >
          <Image
            src={currentBanner.image_url}
            alt="Bannière promotionnelle"
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 1280px"
            className="object-cover"
            priority={index === 0}
          />
        </motion.div>
      </AnimatePresence>

      {/* Flèches navigation (si > 1 bannière) */}
      {total > 1 && (
        <>
          <button
            onClick={() => goTo(index - 1, -1)}
            aria-label="Bannière précédente"
            className="hidden sm:flex absolute left-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/35 hover:bg-black/60 backdrop-blur-xs items-center justify-center text-white transition cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => goTo(index + 1, 1)}
            aria-label="Bannière suivante"
            className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/35 hover:bg-black/60 backdrop-blur-xs items-center justify-center text-white transition cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Indicateurs / Dots */}
          <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 z-20 flex gap-1.5 bg-black/25 backdrop-blur-xs px-2.5 py-1 rounded-full">
            {banners.map((b, i) => (
              <button
                key={b.id}
                onClick={() => goTo(i, i > index ? 1 : -1)}
                aria-label={`Aller à la bannière ${i + 1}`}
                className="h-1.5 rounded-full transition-all duration-300 cursor-pointer"
                style={{
                  width: i === index ? "18px" : "6px",
                  backgroundColor: i === index ? "#fff" : "rgba(255,255,255,0.5)",
                }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ─── Catégories officielles avec images circulaires ─────────────────────── */

function OfficialCategoryPills({
  categories,
  activeSlug,
  onSelect,
}: {
  categories: Category[];
  activeSlug: string;
  onSelect: (slug: string) => void;
}) {
  return (
    <div
      className="sticky z-40 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] py-2.5 px-3 sm:px-6 lg:px-8 mt-4 transition-all"
      style={{ top: "var(--header-total-height)" }}
    >
      <div className="max-w-7xl mx-auto flex gap-4 overflow-x-auto scrollbar-hide touch-pan-x py-0.5">
        {/* Option "Toutes" */}
        <OfficialCategoryPill
          label="Toutes"
          emoji="🏪"
          color="#2563EB"
          imageUrl={null}
          isActive={!activeSlug}
          onClick={() => onSelect("")}
        />
        {/* 8 catégories officielles */}
        {categories.map((cat) => {
          const visual = getCategoryVisual(cat.slug);
          return (
            <OfficialCategoryPill
              key={cat.id || cat.slug}
              label={cat.name}
              emoji={visual.emoji}
              color={visual.color}
              imageUrl={cat.image_url}
              isActive={activeSlug === cat.slug}
              onClick={() => onSelect(cat.slug)}
            />
          );
        })}
      </div>
    </div>
  );
}

function OfficialCategoryPill({
  label,
  emoji,
  color,
  imageUrl,
  isActive,
  onClick,
}: {
  label: string;
  emoji: string;
  color: string;
  imageUrl: string | null;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 shrink-0 group cursor-pointer"
      style={{ width: "64px" }}
      aria-pressed={isActive}
      aria-label={`Catégorie : ${label}`}
    >
      {/* Cercle image ou illustration emoji */}
      <div
        className="w-14 h-14 rounded-full flex items-center justify-center text-2xl transition-all duration-200 relative overflow-hidden"
        style={{
          backgroundColor: isActive ? color : `${color}15`,
          boxShadow: isActive
            ? `0 4px 14px ${color}40, 0 0 0 2px ${color}`
            : "0 0 0 1px rgba(0,0,0,0.06)",
        }}
      >
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={label}
            fill
            sizes="56px"
            className="object-cover"
          />
        ) : (
          <span>{emoji}</span>
        )}
      </div>

      {/* Libellé de la catégorie */}
      <span
        className="text-[10px] font-semibold text-center leading-tight line-clamp-2 w-full transition-colors duration-200"
        style={{ color: isActive ? color : "#475569" }}
      >
        {label}
      </span>
    </button>
  );
}

/* ─── État vide ──────────────────────────────────────────────────────────── */

function EmptyState({
  search,
  category,
  hasFilter,
  onReset,
}: {
  search: string;
  category: string;
  hasFilter: boolean;
  onReset: () => void;
}) {
  return (
    <div className="rounded-2xl p-10 text-center max-w-sm mx-auto border border-slate-200 bg-slate-50 mt-6">
      <div className="text-4xl mb-3 select-none">🔍</div>
      <h3 className="text-base font-bold text-slate-900">Aucun produit trouvé</h3>
      <p className="text-slate-500 text-xs mt-2">
        {search
          ? `Aucun résultat pour « ${search} ».`
          : category
            ? `Aucun produit dans la catégorie « ${category} ».`
            : "Aucun produit disponible pour le moment."}
      </p>
      {hasFilter && (
        <button
          onClick={onReset}
          className="mt-4 text-xs font-semibold px-5 py-2 rounded-full text-white bg-[#2563EB] hover:bg-[#1D4ED8] transition cursor-pointer"
        >
          Effacer les filtres
        </button>
      )}
    </div>
  );
}
