// components/storefront/ProductGrid.tsx
import { ProductCard } from './ProductCard'
import { buildWhatsAppUrl } from '@/lib/whatsapp'

interface Product {
    id: string
    name: string
    slug: string
    description: string | null
    price: number
    list_price: number
    image_url: string | null
    category: string | null
}

interface ProductGridProps {
    products: Product[]
    storeSlug: string
    storeWhatsapp: string
    primaryColor: string
    textColor: string
    secondaryTextColor: string
    cardColor: string
}

export function ProductGrid({
    products,
    storeSlug,
    storeWhatsapp,
    primaryColor,
    textColor,
    secondaryTextColor,
    cardColor,
}: ProductGridProps) {
    if (products.length === 0) {
        return (
            <div className="py-16 text-center text-text-secondary text-sm">
                Aucun produit disponible dans cette catégorie.
            </div>
        )
    }

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3">
            {products.map((product) => (
                <ProductCard
                    key={product.id}
                    product={product}
                    whatsappUrl={buildWhatsAppUrl(product.name, product.price, storeWhatsapp,   `https://shop.rohaty.com/${storeSlug}/produits/${product.slug}`)}
                    primaryColor={primaryColor}
                    storeSlug={storeSlug}
                    textColor={textColor}
                    secondaryTextColor={secondaryTextColor}
                    cardColor={cardColor}
                />
            ))}
        </div>
    )
}