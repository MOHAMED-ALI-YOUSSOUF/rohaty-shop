# UI.md — Rohaty Shop

## Design system

### Couleurs

```ts
// Palette principale — cohérente avec l'écosystème Rohaty Digital
const colors = {
  bg: {
    base:    "#0F172A",   // fond principal de toutes les pages
    surface: "#1E293B",   // cartes, panels, sidebar
    input:   "#162032",   // fond des champs de formulaire
    muted:   "#0D1526",   // sections alternées landing page
  },
  primary:   "#2563EB",   // bleu Rohaty — actions, CTA
  secondary: "#06B6D4",   // cyan — accents, badges
  accent:    "#8B5CF6",   // violet — highlights
  success:   "#10B981",   // vert — WhatsApp, statuts actifs
  warning:   "#F59E0B",   // orange — alertes, stock faible
  danger:    "#EF4444",   // rouge — erreurs, suppression
  text: {
    primary:   "#FFFFFF",
    secondary: "#94A3B8",
    muted:     "#475569",
  },
  gradients: {
    blue:    "linear-gradient(135deg, #2563EB, #06B6D4)",
    purple:  "linear-gradient(135deg, #8B5CF6, #2563EB)",
    success: "linear-gradient(135deg, #10B981, #06B6D4)",
  }
}
```

> ⚠️ La couleur `primary_color` de chaque boutique remplace `#2563EB`
> uniquement dans les pages de vitrine publique `[slug]/*`.
> Dans le dashboard et la landing page, c'est toujours `#2563EB`.

---

### Typographie

```
Space Grotesk  — titres H1, H2, H3 (ExtraBold / Bold)
Inter          — body, labels, descriptions (Regular / Medium / Semibold)

import { Space_Grotesk, Inter } from 'next/font/google'

Tailles :
  H1 hero      : clamp(40px, 6vw, 72px)
  H2 section   : 48px
  H3 card      : 24px
  Body         : 16px / line-height 1.7
  Label        : 13px / uppercase / tracking-widest
  Prix         : 28-32px / Space Grotesk Bold / gradient text
```

---

### Spacing et border-radius

```
Spacing scale Tailwind standard (4, 8, 12, 16, 24, 32, 48, 64px)
Border-radius :
  Boutons    : rounded-lg (8px)
  Cards      : rounded-xl (12px)
  Inputs     : rounded-lg (8px)
  Modals     : rounded-2xl (16px)
```

---

## Animations — Framer Motion

### Variants réutilisables

```typescript
// lib/animations.ts

export const fadeUp = {
  hidden:  { opacity: 0, y: 32 },
  visible: {
    opacity: 1, y: 0,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] }
  }
}

export const fadeIn = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.4 } }
}

export const zoomIn = {
  hidden:  { opacity: 0, scale: 0.94 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.45, ease: "easeOut" } }
}

export const stagger = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } }
}

export const cardHover = {
  rest:  { y: 0,  boxShadow: "0 0 0px rgba(37,99,235,0)" },
  hover: { y: -6, boxShadow: "0 16px 48px rgba(37,99,235,0.22)",
           transition: { duration: 0.25 } }
}
```

### Règles d'application

```
Landing page    → fadeUp au scroll sur chaque section (useInView, once: true)
Dashboard       → fadeIn simple à l'arrivée sur la page
Cards produits  → cardHover au survol (Framer Motion whileHover)
Bouton WhatsApp → pulse CSS vert toutes les 3s (animation CSS keyframes)
Titres H2       → underline gradient slide-right au scroll
Page transitions → fadeIn entre les routes (layout.tsx)
```

### CSS global (globals.css)

```css
/* Gradient text */
.gradient-text {
  background: linear-gradient(135deg, #2563EB, #06B6D4);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Underline gradient animé sous les titres H2 */
.title-underline::after {
  content: '';
  display: block;
  height: 3px;
  width: 56px;
  margin-top: 12px;
  background: linear-gradient(90deg, #2563EB, #06B6D4);
  border-radius: 2px;
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.55s cubic-bezier(0.22, 1, 0.36, 1);
}
.title-underline.in-view::after {
  transform: scaleX(1);
}

/* Pulse WhatsApp */
@keyframes whatsapp-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.5); }
  50%       { box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); }
}
.whatsapp-pulse {
  animation: whatsapp-pulse 2.5s ease-in-out infinite;
}

/* Glassmorphism */
.glass {
  background: rgba(30, 41, 59, 0.6);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.07);
}

/* Gradient border glow au hover */
.card-glow:hover {
  border-color: rgba(37, 99, 235, 0.45);
  box-shadow: 0 0 0 1px rgba(37, 99, 235, 0.2), 0 16px 48px rgba(37, 99, 235, 0.15);
}
```

---

## Composants partagés

### `<GradientButton>`

```tsx
// Variantes : primary | outline | whatsapp
// primary  → bg gradient bleu-cyan, hover scale(1.03) + glow
// outline  → border gradient, bg transparent
// whatsapp → bg vert #10B981, whatsapp-pulse class

<GradientButton variant="primary" href="/inscription">
  Créer ma boutique →
</GradientButton>

<GradientButton variant="whatsapp" href={whatsappUrl} target="_blank">
  💬 Commander via WhatsApp
</GradientButton>
```

### `<SectionTitle>`

```tsx
// Eyebrow label + H2 + underline gradient animé
// Prop gradient : rend le texte en dégradé bleu-cyan

<SectionTitle eyebrow="FONCTIONNALITÉS" gradient>
  Tout ce dont vous avez besoin
</SectionTitle>
```

### `<GlassCard>`

```tsx
// Carte glassmorphism avec hover glow
// Utilisée : landing page features, dashboard stats

<GlassCard className="p-6">
  <Icon />
  <h3>Titre</h3>
  <p>Description</p>
</GlassCard>
```

### `<ProductCard>`

```tsx
// Carte produit pour la vitrine publique
// Image Cloudinary (aspect ratio 1:1)
// Nom, Prix, bouton Commander
// Hover : y -6px + glow + zoom image

<ProductCard
  product={product}
  whatsappUrl={url}
  primaryColor={store.primary_color}
/>
```

### `<StoreHeader>`

```tsx
// Header de la vitrine publique
// Logo commerçant + Nom boutique + bouton WhatsApp global
// Filtres catégories si catégories définies

<StoreHeader store={store} categories={categories} />
```

### `<DashboardSidebar>`

```tsx
// Sidebar fixe 220px du dashboard
// Logo Rohaty Shop + Nom boutique du commerçant
// Nav links avec active state (border-left gradient)
// Lien "Voir ma boutique" en bas
// Bouton "Se déconnecter" → supabase.auth.signOut()
```

### `<ImageUpload>`

```tsx
// Zone drag & drop + clic pour upload
// Upload vers Cloudinary via API route
// Retourne l'URL Cloudinary
// Affiche preview de l'image uploadée
// Props : folder, currentUrl, onUpload

<ImageUpload
  folder="products"
  currentUrl={product.image_url}
  onUpload={(url) => setValue('image_url', url)}
/>
```

---

## Pages — Layout et contenu

---

### Landing page `/`

```
HEADER (sticky, blur backdrop) :
  [Logo Rohaty Shop]   [Connexion]   [Créer ma boutique →]

HERO :
  Badge : "✨ Lien partageable instantané"
  H1 : "Votre boutique en ligne,
        vos clients commandent via WhatsApp."
  Sous-titre : Créez votre vitrine en 5 minutes...
  [Créer ma boutique →]   [Voir une démo]
  Stats : +200 boutiques · 5 min setup · 0 commission · WhatsApp natif
  Droite : mockup double écran dashboard + vitrine

COMMENT ÇA MARCHE (3 étapes fadeUp stagger) :
  01 Créez votre boutique
  02 Ajoutez vos produits
  03 Vos clients commandent

FONCTIONNALITÉS (6 GlassCards en grid 3×2) :
  🏪 Boutique personnalisée
  📦 Produits illimités
  💬 Commande via WhatsApp
  🔗 Lien partageable
  📱 100% Mobile
  🎨 Thème personnalisé

TARIFS (2 plans) :
  Gratuit — 0 DJF / mois — 10 produits max
  Pro — 5 000 DJF / mois — produits illimités + catégories

CTA FINAL :
  "Prêt à vendre en ligne ?"
  [Créer ma boutique gratuitement →]

FOOTER :
  Logo + liens + copyright © 2026 Rohaty Digital
```

---

### `/inscription` — 2 étapes

```
ÉTAPE 1 : Compte
  Nom complet | Email | Mot de passe
  [Continuer →]

ÉTAPE 2 : Boutique
  Nom de la boutique
  URL : shop.rohaty.com/ [        ] ← vérif dispo live
  Numéro WhatsApp (+253...)
  [Créer ma boutique →]

Progress bar animée entre les étapes
Transitions slide horizontal entre étapes
```

---

### `/dashboard` — Tableau de bord

```
"Bonjour, [Prénom] 👋"

3 cards :
  📦 [N] produits publiés  [Gérer →]
  👁️ Boutique EN LIGNE ✓   [Voir →]
  🔗 shop.rohaty.com/[slug] [Copier]

Encadré WhatsApp :
  💬 Commandes reçues sur : +253 77 XX XX XX
  [Modifier]
```

---

### `/dashboard/produits` — Liste produits

```
Header : "Mes produits"  [+ Ajouter]
Filtres : [Tous] [Publiés] [Brouillons]

Grid 3 colonnes :
  [Image]
  Nom
  Prix DJF
  [Publié ●] ou [Brouillon]
  [✏️] [🗑️]

Empty state : "Ajoutez votre premier produit"
```

---

### `/dashboard/produits/nouveau` — Ajouter produit

```
Formulaire 1 page :
  Photo (ImageUpload → Cloudinary: rohaty-shop/products/)
  Nom du produit *          → génère le slug automatiquement
  Prix * + DJF
  Description (textarea)
  Catégorie (input texte libre)
  Statut : ○ Publié  ○ Brouillon

  [Annuler]   [Publier le produit →]
```

---

### `/dashboard/boutique` — Paramètres boutique

```
Formulaire :
  Nom de la boutique *
  Slogan (optionnel)
  Numéro WhatsApp * ← LE PLUS IMPORTANT
  URL : shop.rohaty.com/ [slug]  ← modifiable avec validation

  [Enregistrer]
```

---

### `/dashboard/apparence` — Thème

```
Layout : Formulaire gauche + Aperçu live droite

  Logo boutique     [ImageUpload → stores/logo/]
  Bannière          [ImageUpload → stores/banner/]
  Couleur principale [Color picker hex]

  Aperçu : mini-preview de la vitrine en temps réel (useState)

  [Enregistrer l'apparence]
```

---

### Vitrine publique `[slug]/page.tsx`

```
HEADER VITRINE :
  [Logo]  Nom boutique  Slogan  [💬 Commander sur WhatsApp]
  Filtres catégories : [Tous] [Cat1] [Cat2] ...

CATALOGUE :
  Grid 3 col (desktop) / 2 col (tablet) / 1 col (mobile)
  ProductCard × N

  Empty state : "Boutique en cours de préparation 🚀"
  404 si slug introuvable
```

---

### Page produit `[slug]/produits/[productSlug]/page.tsx`

```
Layout 2 col desktop / 1 col mobile :

Gauche : Image Cloudinary (ratio 1:1, grande)

Droite :
  Nom du produit (H1)
  Prix en gradient text
  Description
  ──────────────
  [💬 Commander via WhatsApp]  ← grand, vert, whatsapp-pulse
  "Redirigé vers WhatsApp avec commande pré-remplie."

Breadcrumb : Accueil > [Nom produit]
```

---

## Cloudinary — Dossiers et transformations

```
rohaty-shop/
├── stores/
│   ├── logo/     → w_200, h_200, c_fill, q_auto, f_auto
│   └── banner/   → w_1200, h_400, c_fill, q_auto, f_auto
└── products/     → w_800, h_800, c_fill, q_auto, f_auto
```

Utiliser le composant `<CldImage>` de `next-cloudinary`
ou la balise `<Image>` de Next.js avec `remotePatterns` configuré pour `res.cloudinary.com`.

---

## Responsive

```
Mobile  (<640px)  : 1 colonne, menu hamburger, cards full-width
Tablet  (640-1024): 2 colonnes produits, nav condensée
Desktop (>1024px) : layout complet, sidebar fixe, grille 3 colonnes
```
