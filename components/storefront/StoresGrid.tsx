// components/storefront/StoresGrid.tsx
// Grille des boutiques publiques avec recherche côté client
// Chaque carte est cliquable → /{store.slug}
"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Search, Store, X } from "lucide-react";

interface StoreItem {
  id: string;
  name: string;
  slug: string;
  slogan: string | null;
  logo_url: string | null;
  banner_url: string | null;
  primary_color: string;
}

interface StoresGridProps {
  stores: StoreItem[];
}

export function StoresGrid({ stores }: StoresGridProps) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return stores;
    return stores.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.slug.toLowerCase().includes(q) ||
        (s.slogan?.toLowerCase().includes(q) ?? false),
    );
  }, [stores, search]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
      {/* Barre de recherche */}
      <div className="relative mb-6 max-w-xl">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        <input
          id="stores-search"
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher une boutique…"
          className="w-full pl-10 pr-10 py-2.5 rounded-full bg-slate-100 border border-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 transition"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition"
            aria-label="Effacer la recherche"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Grille */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((store, i) => (
            <StoreCard key={store.id} store={store} index={i} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl p-12 text-center max-w-md mx-auto border border-slate-200 bg-slate-50 mt-10">
          <div className="text-4xl mb-4 select-none">🏪</div>
          <h2 className="text-lg font-bold text-slate-900 font-heading">
            Aucune boutique trouvée
          </h2>
          <p className="text-slate-500 text-xs mt-2 leading-relaxed">
            {search
              ? `Aucun résultat pour « ${search} ».`
              : "Aucune boutique active pour le moment."}
          </p>
          {search && (
            <button
              onClick={() => setSearch("")}
              className="mt-5 inline-flex text-xs font-semibold px-5 py-2 rounded-full text-white bg-[#2563EB] hover:bg-[#1D4ED8] transition cursor-pointer"
            >
              Voir toutes les boutiques
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Carte boutique ───────────────────────────────────────────────────────────
function StoreCard({ store, index }: { store: StoreItem; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.3,
        delay: Math.min(index * 0.04, 0.4),
        ease: "easeOut",
      }}
    >
      <Link
        href={`/${store.slug}`}
        className="block rounded-xl overflow-hidden border border-slate-200 bg-white shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
        style={{ ["--store-color" as string]: store.primary_color }}
      >
        {/* Bannière */}
        <div
          className="h-24 relative overflow-hidden"
          style={{
            background: store.banner_url
              ? undefined
              : `linear-gradient(135deg, ${store.primary_color}30, ${store.primary_color}10)`,
          }}
        >
          {store.banner_url && (
            <Image
              src={store.banner_url}
              alt=""
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              quality={75}
            />
          )}
        </div>

        {/* Logo + infos, chevauche la bannière */}
        <div className="px-3 -mt-6 pb-3 relative flex items-end gap-2">
          <div className="w-12 h-12 rounded-lg border-2 border-white bg-white overflow-hidden relative shrink-0 flex items-center justify-center shadow-md">
            {store.logo_url ? (
              <Image
                src={store.logo_url}
                alt={store.name}
                fill
                sizes="48px"
                className="object-cover"
                unoptimized
              />
            ) : (
              <Store
                className="w-5 h-5"
                style={{ color: store.primary_color }}
              />
            )}
          </div>

          <div className="min-w-0 pb-0.5">
            <p className="text-sm font-bold truncate text-slate-900 leading-tight">
              {store.name}
            </p>
            {store.slogan && (
              <p className="text-[10px] text-slate-500 truncate leading-snug mt-0.5">
                {store.slogan}
              </p>
            )}
          </div>
        </div>

        {/* CTA */}
        <div className="px-3 pb-3">
          <span className="block w-full text-center py-2 rounded-full text-[11px] font-bold text-white bg-[#2563EB] group-hover:bg-[#1D4ED8] transition-colors">
            Visiter la boutique →
          </span>
        </div>
      </Link>
    </motion.div>
  );
}
