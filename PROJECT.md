# PROJECT.md — Rohaty Shop

## Vision

Rohaty Shop est un SaaS e-commerce vitrine ultra-simple.
Chaque commerçant crée sa boutique en ligne en 5 minutes,
partage son lien, et reçoit les commandes directement sur WhatsApp.

Aucun compte acheteur. Aucun panier. Aucun paiement en ligne.
Aucune livraison. Juste une vitrine → un clic → WhatsApp.

---

## Fonctionnalités MVP

### Commerçant
- Créer un compte (email + mot de passe via Supabase Auth)
- Créer sa boutique (nom, slug, whatsapp, logo, bannière, couleur)
- Ajouter / modifier / supprimer des produits (nom, prix, photo, catégorie, statut)
- Voir le lien de sa boutique et le copier
- Personnaliser l'apparence (couleur principale, logo, bannière)

### Visiteur (acheteur)
- Accéder à la boutique via `shop.rohaty.com/[slug]`
- Parcourir le catalogue produits
- Filtrer par catégorie
- Voir la page d'un produit
- Cliquer sur "Commander via WhatsApp" → ouvre WhatsApp avec message pré-rempli

---

## Ce qui n'existe PAS dans ce projet

```
✗ Compte acheteur
✗ Panier
✗ Commandes enregistrées en BDD
✗ Paiement en ligne
✗ Livraison
✗ Analytics / CA
✗ Sync StockPro
✗ Sous-domaines dynamiques
✗ Prisma
✗ NextAuth
✗ bcrypt
```

---

## Stack technique

```
Next.js 16          App Router, TypeScript, Server Components
Tailwind CSS        Styling
Framer Motion       Animations scroll, hover, transitions
ShadCN UI           Composants UI (Dialog, Select, Tabs...)
Supabase Auth       Authentification email + mot de passe
Supabase Database   PostgreSQL hébergé, RLS natif
Cloudinary          Upload et hébergement des images
React Hook Form     Gestion des formulaires
Zod                 Validation des données
Lucide Icons        Icônes
```

---

## Architecture des URLs

```
Application SaaS :
  shop.rohaty.com                         ← Landing page
  shop.rohaty.com/connexion               ← Login
  shop.rohaty.com/inscription             ← Signup
  shop.rohaty.com/dashboard               ← Tableau de bord
  shop.rohaty.com/dashboard/produits      ← Liste produits
  shop.rohaty.com/dashboard/produits/nouveau
  shop.rohaty.com/dashboard/produits/[id]
  shop.rohaty.com/dashboard/boutique      ← Paramètres boutique
  shop.rohaty.com/dashboard/apparence     ← Thème et visuels

Vitrine publique commerçant :
  shop.rohaty.com/[slug]                          ← Catalogue
  shop.rohaty.com/[slug]/produits/[productSlug]   ← Page produit

Exemples réels :
  shop.rohaty.com/hafsafashion
  shop.rohaty.com/inmaa-auto
  shop.rohaty.com/electro-city
  shop.rohaty.com/hafsafashion/produits/sac-cuir
```

---

## Structure des fichiers

```
rohaty-shop/
├── app/
│   ├── page.tsx                              ← Landing page
│   ├── layout.tsx                            ← Layout racine
│   ├── connexion/
│   │   └── page.tsx
│   ├── inscription/
│   │   └── page.tsx
│   ├── dashboard/
│   │   ├── layout.tsx                        ← Sidebar + Header (protégé)
│   │   ├── page.tsx                          ← Tableau de bord
│   │   ├── produits/
│   │   │   ├── page.tsx
│   │   │   ├── nouveau/page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── boutique/
│   │   │   └── page.tsx
│   │   └── apparence/
│   │       └── page.tsx
│   ├── [slug]/
│   │   ├── page.tsx                          ← Vitrine publique
│   │   └── produits/
│   │       └── [productSlug]/
│   │           └── page.tsx
│   └── api/
│       └── stores/
│           └── check-slug/
│               └── route.ts                  ← Vérifie dispo du slug
│
├── components/
│   ├── ui/                                   ← Composants ShadCN
│   ├── dashboard/                            ← Sidebar, Header dashboard
│   ├── storefront/                           ← ProductCard, StoreHeader
│   └── shared/                              ← GradientButton, SectionTitle...
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts                         ← Supabase browser client
│   │   └── server.ts                         ← Supabase server client
│   ├── cloudinary.ts                         ← Upload helper
│   ├── whatsapp.ts                           ← buildWhatsAppUrl()
│   ├── reserved-slugs.ts                     ← Liste slugs réservés + validation Zod
│   └── utils.ts                              ← cn(), slugify()...
│
├── middleware.ts                             ← Protection routes dashboard
├── .env.local
└── PROJECT.md / TASKS.md / DATABASE.md / UI.md
```

---

## Slugs réservés

Les slugs suivants ne peuvent pas être choisis par un commerçant
car ils correspondent à des routes internes de l'application :

```typescript
export const RESERVED_SLUGS = [
  "dashboard",
  "connexion",
  "inscription",
  "admin",
  "api",
  "pricing",
  "tarifs",
  "settings",
  "support",
  "help",
]
```

---

## Variables d'environnement

```env
# .env.local

NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

CLOUDINARY_CLOUD_NAME=rohaty
CLOUDINARY_API_KEY=123456789
CLOUDINARY_API_SECRET=abc...

NEXT_PUBLIC_APP_URL=https://shop.rohaty.com
```

---

## Logique WhatsApp

Quand un visiteur clique sur "Commander" sur un produit :

```typescript
// lib/whatsapp.ts

export function buildWhatsAppUrl(
  productName: string,
  productPrice: number,
  whatsappNumber: string
): string {
  const message = encodeURIComponent(
    `Bonjour ! Je souhaite commander :\n\n` +
    `🛍️ *${productName}*\n` +
    `💰 Prix : ${productPrice} DJF\n\n` +
    `Merci de confirmer la disponibilité.`
  )
  const number = whatsappNumber.replace(/\D/g, '') // supprime le +
  return `https://wa.me/${number}?text=${message}`
}
```

Message reçu par le commerçant :
```
Bonjour ! Je souhaite commander :

🛍️ Sac en cuir marron
💰 Prix : 8 500 DJF

Merci de confirmer la disponibilité.
```
