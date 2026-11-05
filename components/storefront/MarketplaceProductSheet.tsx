// components/storefront/MarketplaceProductSheet.tsx
// Bottom Sheet / modal pour afficher le détail d'un produit depuis la marketplace.
// Utilisé UNIQUEMENT sur la landing page `/` — le SaaS n'est pas concerné.
"use client";

import { useEffect, useCallback, useRef, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { X, ShoppingBag, Info, ChevronLeft, ChevronRight } from "lucide-react";

export interface SheetProduct {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  list_price: number;
  image_url: string | null;
  images: string[]; // galerie ordonnée (peut être vide ou contenir une seule image)
  category: string | null;
  categoryId?: string | null;
  storeSlug: string;
  storeName: string;
  storeWhatsapp: string;
  storePrimaryColor: string;
  whatsappUrl: string;
}

interface MarketplaceProductSheetProps {
  product: SheetProduct | null;
  onClose: () => void;
}

const PRIMARY = "#2563EB";

function formatPrice(price: number) {
  return new Intl.NumberFormat("fr-FR").format(price);
}

/* ─── Carrousel d'images ────────────────────────────────────────────────── */

function ImageCarousel({
  images,
  productName,
  discountPct,
  category,
}: {
  images: string[];
  productName: string;
  discountPct: number;
  category: string | null;
}) {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const [prefersReduced, setPrefersReduced] = useState(false);

  useEffect(() => {
    setPrefersReduced(
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    );
  }, []);

  // Réinitialiser à la première image à chaque changement de produit
  useEffect(() => {
    setIndex(0);
    setDirection(0);
  }, [images]);

  const goTo = useCallback(
    (n: number, dir: number) => {
      setDirection(dir);
      setIndex(((n % images.length) + images.length) % images.length);
    },
    [images.length],
  );

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 40) goTo(index + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1);
    touchStartX.current = null;
  };

  const hasMultiple = images.length > 1;

  const slideVariants = {
    enter: (d: number) => ({ x: d > 0 ? "100%" : "-100%", opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? "-100%" : "100%", opacity: 0 }),
  };

  if (images.length === 0) {
    return (
      <div className="relative w-full aspect-square bg-slate-50 flex items-center justify-center">
        <ShoppingBag className="w-16 h-16 stroke-[1] text-slate-300" />
      </div>
    );
  }

  return (
    <div
      className="relative w-full aspect-square bg-slate-50 overflow-hidden select-none"
      onTouchStart={(e) => (touchStartX.current = e.touches[0].clientX)}
      onTouchEnd={handleTouchEnd}
    >
      <AnimatePresence initial={false} custom={direction} mode="wait">
        <motion.div
          key={images[index]}
          custom={direction}
          variants={prefersReduced ? {} : slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0"
        >
          <Image
            src={images[index]}
            alt={`${productName} — image ${index + 1}`}
            fill
            sizes="(max-width: 640px) 100vw, 512px"
            className="object-contain"
            quality={90}
            unoptimized
          />
        </motion.div>
      </AnimatePresence>

      {/* Badge réduction */}
      {discountPct > 0 && (
        <span
          className="absolute top-3 left-3 z-10 text-white text-xs font-extrabold px-2.5 py-1 rounded-lg select-none"
          style={{ backgroundColor: PRIMARY }}
        >
          -{discountPct}%
        </span>
      )}

      {/* Badge catégorie */}
      {category && (
        <span className="absolute bottom-3 left-3 z-10 text-xs font-medium px-2.5 py-1 rounded-lg bg-white/90 text-slate-700 shadow-sm">
          {category}
        </span>
      )}

      {/* Flèches de navigation (uniquement si plusieurs images) */}
      {hasMultiple && (
        <>
          <button
            onClick={() => goTo(index - 1, -1)}
            aria-label="Image précédente"
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white/85 hover:bg-white shadow-sm flex items-center justify-center text-slate-700 transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => goTo(index + 1, 1)}
            aria-label="Image suivante"
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white/85 hover:bg-white shadow-sm flex items-center justify-center text-slate-700 transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Indicateurs de position */}
          <div className="absolute bottom-3 right-3 z-10 flex gap-1">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i, i > index ? 1 : -1)}
                aria-label={`Aller à l'image ${i + 1}`}
                className="h-1.5 rounded-full transition-all duration-300"
                style={{
                  width: i === index ? "16px" : "6px",
                  backgroundColor:
                    i === index ? PRIMARY : "rgba(100,116,139,0.5)",
                }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ─── Sheet principale ──────────────────────────────────────────────────── */

export function MarketplaceProductSheet({
  product,
  onClose,
}: MarketplaceProductSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);

  // Fermeture avec Escape + blocage du scroll body
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (product) {
      document.addEventListener("keydown", handler);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [product, onClose]);

  // Focus sur le bouton de fermeture à l'ouverture
  useEffect(() => {
    if (product && sheetRef.current) {
      const closeBtn = sheetRef.current.querySelector<HTMLElement>("[data-close]");
      closeBtn?.focus();
    }
  }, [product]);

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose],
  );

  if (!product) return null;

  const hasDiscount = product.list_price > product.price;
  const discountPct = hasDiscount
    ? Math.round((1 - product.price / product.list_price) * 100)
    : 0;

  // Normaliser la galerie : garantir qu'on a au moins l'image principale
  const images =
    product.images.length > 0
      ? product.images
      : product.image_url
        ? [product.image_url]
        : [];

  return (
    <AnimatePresence>
      {product && (
        <motion.div
          key="overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          onClick={handleOverlayClick}
          aria-modal="true"
          role="dialog"
          aria-label={`Détail du produit : ${product.name}`}
        >
          {/* Sheet / Card */}
          <motion.div
            ref={sheetRef}
            key={`sheet-${product.id}`}
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 30, stiffness: 320 }}
            className="
              relative w-full bg-white
              rounded-t-3xl sm:rounded-2xl
              sm:max-w-lg sm:mx-4
              max-h-[92dvh] sm:max-h-[85vh]
              overflow-y-auto
              shadow-2xl
            "
            style={{ WebkitOverflowScrolling: "touch" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drag handle mobile */}
            <div className="sm:hidden flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-slate-200" />
            </div>

            {/* Bouton fermeture */}
            <button
              data-close
              onClick={onClose}
              aria-label="Fermer"
              className="
                absolute top-4 right-4 z-20
                w-8 h-8 rounded-full
                bg-white/90 hover:bg-slate-100 shadow-sm
                flex items-center justify-center
                transition text-slate-600 hover:text-slate-900
              "
            >
              <X className="w-4 h-4" />
            </button>

            {/* Carrousel d'images */}
            <ImageCarousel
              images={images}
              productName={product.name}
              discountPct={discountPct}
              category={product.category}
            />

            {/* Contenu texte */}
            <div className="p-5 space-y-4">
              {/* Boutique source */}
              <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">
                {product.storeName}
              </p>

              {/* Nom du produit */}
              <h2 className="text-lg font-bold text-slate-900 leading-snug">
                {product.name}
              </h2>

              {/* Prix */}
              <div className="flex items-baseline gap-3 flex-wrap">
                <span className="text-2xl font-black" style={{ color: PRIMARY }}>
                  {formatPrice(product.price)} DJF
                </span>
                {hasDiscount && (
                  <span className="text-sm line-through text-slate-400">
                    {formatPrice(product.list_price)} DJF
                  </span>
                )}
              </div>

              {/* Description */}
              {product.description && (
                <div className="pt-3 border-t border-slate-100">
                  <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap break-words">
                    {product.description}
                  </p>
                </div>
              )}

              {/* Bouton WhatsApp */}
              <div className="pt-2">
                <a
                  href={product.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="
                    flex items-center justify-center gap-2
                    w-full py-3.5 rounded-xl
                    text-white font-bold text-sm
                    transition active:scale-95
                    whatsapp-pulse
                  "
                  style={{ backgroundColor: "#10B981" }}
                >
                  💬 Commander via WhatsApp
                </a>
                <div className="flex items-center gap-1.5 justify-center text-[11px] text-slate-400 mt-2">
                  <Info className="w-3 h-3 shrink-0" />
                  Message pré-rempli · Aucun compte requis
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
