// components/shared/SiteHeader.tsx
// Header de la marketplace `/`.
// Contient uniquement : logo Rohaty + barre de recherche.
//
// NB : Le SaaS (/[nom-boutique]) utilise StoreHeader, PAS ce composant.
//      Modifier SiteHeader n'affecte donc pas les boutiques.

"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useTransition } from "react";

export function SiteHeader() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [, startTransition] = useTransition();

  // Synchronise la saisie avec la barre de recherche de MarketplacePage
  // via un event custom dispatch — évite de prop-drill ou de créer un contexte global.
  const handleInput = (value: string) => {
    startTransition(() => {
      window.dispatchEvent(
        new CustomEvent("marketplace:search", { detail: { query: value } }),
      );
    });
  };

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-100 shadow-sm"
      style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0 group">
          <span className="font-heading font-extrabold text-sm tracking-wider text-slate-900 select-none">
            ROHATY{" "}
            <span className="text-[#2563EB]">SHOP</span>
          </span>
        </Link>

        {/* Barre de recherche — occupe tout l'espace restant */}
        <div className="flex-1 relative max-w-2xl">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            ref={inputRef}
            type="search"
            placeholder="Rechercher un produit…"
            aria-label="Rechercher un produit"
            onChange={(e) => handleInput(e.target.value)}
            className="
              w-full pl-10 pr-4 py-2.5
              rounded-full
              bg-slate-100 border border-transparent
              text-sm text-slate-900 placeholder:text-slate-400
              focus:outline-none focus:bg-white
              focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20
              transition
            "
          />
        </div>
      </div>
    </header>
  );
}
