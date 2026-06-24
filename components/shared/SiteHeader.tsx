import { ShoppingBag, User } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { GradientButton } from "@/components/shared/GradientButton"

export function SiteHeader() {
    return (
        <header
            className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5 backdrop-blur-md"
            style={{
                // Pousse tout le header vers le bas de la hauteur de la notch/Dynamic Island
                // Sur iPhone sans notch : 0px → aucun changement
                // Sur iPhone avec notch/Dynamic Island : 47-59px selon le modèle
                paddingTop: 'env(safe-area-inset-top, 0px)',
            }}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2 group">
                    <span>
                        <Image
                            src="/logo.png"
                            alt="Rohaty Shop Logo"
                            width={40}
                            height={40}
                        />
                    </span>
                    <span className="font-heading font-extrabold text-lg tracking-wider text-white">
                        ROHATY <span className="gradient-text">SHOP</span>
                    </span>
                </Link>

                {/* Navigation CTAs */}
                <div className="flex items-center gap-4">
                    <Link
                        href="/connexion"
                        className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-text-secondary hover:text-white transition-colors"
                    >
                        <User className="w-4 h-4" />
                        <span className="hidden lg:block">Connexion</span>
                    </Link>
                    <GradientButton
                        variant="primary"
                        href="/inscription"
                        className="py-2 px-4 text-xs sm:text-sm font-bold shadow-sm hidden lg:block"
                    >
                        Créer ma boutique →
                    </GradientButton>
                </div>
            </div>
        </header>
    )
}