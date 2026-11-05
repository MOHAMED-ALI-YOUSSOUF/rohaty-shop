// components/storefront/MarketplaceProductCard.tsx
// Carte produit UNIQUEMENT pour la marketplace `/`.
// Au clic, ouvre le Bottom Sheet (MarketplaceProductSheet) au lieu de naviguer.
// Le ProductCard du SaaS (components/storefront/ProductCard.tsx) n'est PAS modifié.
"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { ShoppingBag } from "lucide-react";

export interface MarketplaceCardProduct {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  list_price: number;
  image_url: string | null;
  images: string[]; // galerie ordonnée
  category: string | null;
  categoryId?: string | null;
  storeSlug: string;
  storeName: string;
  storeWhatsapp: string;
  storePrimaryColor: string;
  whatsappUrl: string;
}

interface MarketplaceProductCardProps {
  product: MarketplaceCardProduct;
  onOpenSheet: (product: MarketplaceCardProduct) => void;
}

const PRIMARY = "#2563EB";

function formatPrice(price: number) {
  return new Intl.NumberFormat("fr-FR").format(price);
}

export function MarketplaceProductCard({
  product,
  onOpenSheet,
}: MarketplaceProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const hasDiscount = product.list_price > product.price;
  const discountPct = hasDiscount
    ? Math.round((1 - product.price / product.list_price) * 100)
    : 0;

  return (
    <motion.div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="rounded-xl border border-slate-100 overflow-hidden flex flex-col h-full bg-white transition-all duration-200 cursor-pointer"
      animate={{
        borderColor: isHovered ? `${PRIMARY}40` : "rgb(241 245 249)",
        boxShadow: isHovered
          ? `0 4px 20px ${PRIMARY}18`
          : "0 1px 4px rgba(0,0,0,0.06)",
      }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      onClick={() => onOpenSheet(product)}
      role="button"
      tabIndex={0}
      aria-label={`Voir ${product.name} — ${formatPrice(product.price)} DJF`}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpenSheet(product);
        }
      }}
    >
      {/* Image produit */}
      <div className="aspect-square bg-slate-50 relative flex items-center justify-center overflow-hidden shrink-0">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            className="object-cover"
            quality={80}
            unoptimized
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-slate-300">
            <ShoppingBag className="w-8 h-8 stroke-[1.5]" />
          </div>
        )}

        {/* Badge réduction */}
        {discountPct > 0 && (
          <span
            className="absolute top-0 left-0 text-white text-[10px] font-extrabold px-2 py-1 rounded-br-lg select-none leading-none"
            style={{ backgroundColor: PRIMARY }}
          >
            -{discountPct}%
          </span>
        )}
      </div>

      {/* Infos produit */}
      <div className="p-2.5 space-y-1.5 flex flex-col flex-1">
        <p
          className="text-[11px] font-semibold truncate leading-tight text-slate-900"
          title={product.name}
        >
          {product.name}
        </p>

        {/* Prix */}
        <div className="flex items-baseline gap-1.5 flex-wrap">
          <span className="text-xs font-bold font-heading" style={{ color: PRIMARY }}>
            {formatPrice(product.price)} DJF
          </span>
          {hasDiscount && (
            <span className="text-[9px] line-through text-slate-400">
              {formatPrice(product.list_price)} DJF
            </span>
          )}
        </div>

        {/* Boutique source */}
        <p className="text-[9px] text-slate-400 truncate">{product.storeName}</p>

        {/* Bouton Commander */}
        <button
          onClick={(e) => {
            // Empêcher le double-déclenchement du onClick parent
            e.stopPropagation();
            onOpenSheet(product);
          }}
          className="w-full py-1.5 rounded text-[10px] font-bold text-white text-center cursor-pointer mt-auto active:scale-95 transition-transform"
          style={{ backgroundColor: "#10B981" }}
          aria-label={`Commander ${product.name}`}
        >
          💬 Commander
        </button>
      </div>
    </motion.div>
  );
}

