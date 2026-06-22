// components/storefront/ProductImageGallery.tsx
'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ShoppingBag, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ProductImageGalleryProps {
    images: string[]
    productName: string
    primaryColor: string
    hasDiscount: boolean
    discountPct: number
}

export function ProductImageGallery({
    images,
    productName,
    primaryColor,
    hasDiscount,
    discountPct,
}: ProductImageGalleryProps) {
    const [activeIndex, setActiveIndex] = useState(0)

    const prev = () => setActiveIndex((i) => (i - 1 + images.length) % images.length)
    const next = () => setActiveIndex((i) => (i + 1) % images.length)

    // Pas d'image du tout
    if (images.length === 0) {
        return (
            <div className="w-full aspect-square bg-white/5 rounded-xl flex items-center justify-center text-gray-500">
                <ShoppingBag className="w-12 h-12" />
            </div>
        )
    }

    // Une seule image — comportement original
    if (images.length === 1) {
        return (
            <div className="w-full">
                <div className="relative aspect-square bg-white/5 rounded-xl overflow-hidden">
                    <Image src={images[0]} alt={productName} fill className="object-cover" priority />
                    {hasDiscount && (
                        <div
                            className="absolute top-3 left-3 text-white text-xs font-bold px-2 py-1 rounded"
                            style={{ backgroundColor: primaryColor }}
                        >
                            -{discountPct}%
                        </div>
                    )}
                </div>
            </div>
        )
    }

    // Plusieurs images
    return (
        <div className="w-full space-y-3">
            {/* Image principale */}
            <div className="relative aspect-square bg-white/5 rounded-xl overflow-hidden group">
                <Image
                    src={images[activeIndex]}
                    alt={`${productName} - ${activeIndex + 1}`}
                    fill
                    className="object-cover transition-opacity duration-300"
                    priority={activeIndex === 0}
                    unoptimized
                />

                {hasDiscount && (
                    <div
                        className="absolute top-3 left-3 text-white text-xs font-bold px-2 py-1 rounded z-10"
                        style={{ backgroundColor: primaryColor }}
                    >
                        -{discountPct}%
                    </div>
                )}

                {/* Compteur */}
                <div className="absolute bottom-3 right-3 text-[10px] font-semibold bg-black/50 text-white px-2 py-0.5 rounded-full">
                    {activeIndex + 1} / {images.length}
                </div>

                {/* Flèches de navigation */}
                <button
                    onClick={prev}
                    className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/40 hover:bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Image précédente"
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                    onClick={next}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/40 hover:bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Image suivante"
                >
                    <ChevronRight className="w-5 h-5" />
                </button>
            </div>

            {/* Thumbnails */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                {images.map((url, index) => (
                    <button
                        key={url}
                        onClick={() => setActiveIndex(index)}
                        className={cn(
                            'relative shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all',
                            activeIndex === index
                                ? 'border-primary scale-105'
                                : 'border-white/10 opacity-60 hover:opacity-100'
                        )}
                        style={activeIndex === index ? { borderColor: primaryColor } : undefined}
                    >
                        <Image src={url} alt="" fill className="object-cover" unoptimized />
                    </button>
                ))}
            </div>
        </div>
    )
}