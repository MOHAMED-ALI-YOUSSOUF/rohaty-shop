
import { ShoppingBag } from "lucide-react";

import Link from "next/link";

export function SiteHeader() {

    return (
        <header className="fixed top-0 left-0 right-0 z-50">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-4">
                <div className="glass-strong rounded-2xl px-4 sm:px-6 py-3 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 group">
                        <div className="size-9 rounded-xl bg-gradient-hero grid place-items-center shadow-glow">
                            <ShoppingBag className="size-5 text-white" strokeWidth={2.5} />
                        </div>
                        <span className="font-display text-lg font-bold tracking-tight">
                            Rohaty <span className="text-gradient-blue">Shop</span>
                        </span>
                    </Link>
                    <div className="hidden md:flex items-center gap-3">
                        <Link
                            href="/connexion"
                            className="text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-2"
                        >
                            Connexion
                        </Link>
                        <Link
                            href="/inscription"
                            className="text-sm font-medium px-4 py-2 rounded-xl bg-gradient-blue text-white shadow-glow hover:scale-[1.02] active:scale-[0.98] transition-transform"
                        >
                            Créer ma boutique
                        </Link>
                    </div>


                </div>
            </div>
        </header>
    );
}
