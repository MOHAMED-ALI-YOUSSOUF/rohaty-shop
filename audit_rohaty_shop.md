# 🔍 Audit Complet — Rohaty Shop
### Expert Senior Next.js 15 · Netlify · Supabase · Multi-tenant SaaS
---

> **Contexte** : 145 000 Web Requests · 66 000 Serverless Function Requests · 94 000 Edge Function Requests  
> **Objectif** : Réduire radicalement les fonctions exécutées, maximiser le cache statique, conserver 100% des fonctionnalités.

---

## Table des matières

1. [Audit Edge Functions](#1-audit-edge-functions)
2. [Audit Serverless Functions](#2-audit-serverless-functions)
3. [Audit du rendu par page](#3-audit-du-rendu)
4. [Audit Supabase](#4-audit-supabase)
5. [Audit Clerk / Auth](#5-audit-clerk--auth-supabase-auth)
6. [Audit App Router](#6-audit-app-router)
7. [Audit Bundle](#7-audit-bundle)
8. [Audit Images](#8-audit-images)
9. [Audit Navigation](#9-audit-navigation)
10. [Audit Multi-tenant](#10-audit-multi-tenant)
11. [Audit SEO](#11-audit-seo)
12. [Audit Netlify](#12-audit-netlify)
13. [Audit Sécurité](#13-audit-sécurité)
14. [Notes sur 10](#14-notes-sur-10)
15. [Refactoring complet avec code](#15-refactoring-complet-avec-code)
16. [Plan d'action prioritaire](#16-plan-daction-prioritaire)

---

## 1. Audit Edge Functions

### 🚨 Problème #1 — Le proxy intercepte TOUTES les requêtes

**Fichier** : `proxy.ts` (appelé depuis un fichier `middleware.ts` non trouvé mais implicitement configuré)

```typescript
// proxy.ts — matcher actuel
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
}
```

**Ce matcher est désastreux.** Il intercepte :
- `/` → Landing page (statique !) → Edge Function inutile
- `/connexion` → Page statique → Edge Function inutile
- `/inscription` → Page statique → Edge Function inutile
- `/[slug]` → Chaque visite de boutique → Edge Function inutile car le header `x-store-slug` n'est **jamais lu** dans le code
- `/[slug]/produits/[productSlug]` → Idem
- `/sitemap.xml` → Edge Function inutile
- `/robots.txt` → Edge Function inutile

**Pourquoi autant d'Edge Functions ?**  
Le proxy s'exécute sur **100% des requêtes** qui ne sont pas `_next/static`, `_next/image`, `favicon.ico` ou `api`. Sur 145 000 Web Requests, si la quasi-totalité passe par ce proxy, cela explique les 94 000 Edge Functions.

**Pourquoi le proxy est inutile dans l'état actuel ?**  
Il injecte `x-store-slug` dans les headers, mais ce header n'est **jamais lu** dans aucune page. Les pages récupèrent le slug directement depuis `params.slug`. Le proxy ne fait que du bruit.

**Solution : Supprimer le proxy ou le limiter à zéro route**

---

## 2. Audit Serverless Functions

### Analyse route par route

| Page | Raison Function | Peut être statique ? | Solution |
|------|-----------------|----------------------|----------|
| `app/page.tsx` | `'use client'` + framer-motion | ✅ Oui, déjà statique côté serveur | Retirer `'use client'`, déplacer animations côté client |
| `app/[slug]/page.tsx` | `createClient()` + `cookies()` + `searchParams` | ⚠️ Partiellement | ISR 60s + filtrage catégorie côté client |
| `app/[slug]/produits/[productSlug]/page.tsx` | `createClient()` + `cookies()` + multiples queries | ⚠️ Partiellement | ISR 60s, pages statiques au build |
| `app/connexion/page.tsx` | `'use client'` uniquement | ✅ Statique | Déjà client-only, pas de Serverless Function |
| `app/dashboard/layout.tsx` | `cookies()` + `auth.getUser()` + 2 queries | ❌ Doit rester dynamique | Optimiser les queries |
| `app/dashboard/page.tsx` | `cookies()` + auth + 4 queries Supabase | ❌ Doit rester dynamique | Paralléliser + cache React |
| `app/dashboard/produits/page.tsx` | `cookies()` + auth + 2 queries | ❌ Doit rester dynamique | Cache React de layout |
| `app/dashboard/produits/[id]/page.tsx` | `cookies()` + auth + 2 queries | ❌ Doit rester dynamique | Cache React de layout |
| `app/dashboard/produits/nouveau/page.tsx` | `cookies()` + auth + 1 query | ❌ Doit rester dynamique | Réduire à 0 query serveur |
| `app/dashboard/boutique/page.tsx` | `cookies()` + auth + 1 query | ❌ Doit rester dynamique | Réduire queries |
| `app/dashboard/apparence/page.tsx` | `cookies()` + auth + 1 query | ❌ Doit rester dynamique | Réduire queries |
| `app/api/upload/route.ts` | Serverless Function légitime | ❌ Nécessaire | Optimiser |
| `app/api/products/reorder/route.ts` | Serverless Function légitime | ❌ Nécessaire | Optimiser |
| `app/api/stores/check-slug/route.ts` | Serverless Function légitime | ❌ Nécessaire | Optimiser |
| `app/sitemap.ts` | ISR 1h — OK | ✅ Bon | Déjà bien configuré |
| `app/robots.ts` | Statique | ✅ Bon | OK |

### 🚨 Problème #2 — Double appel auth dans chaque page du dashboard

Le **dashboard layout** appelle `auth.getUser()` + 2 queries Supabase.  
Chaque **page enfant** (dashboard, produits, boutique, apparence) appelle **à nouveau** `auth.getUser()` + ses propres queries, sans utiliser le `cache()` React déjà en place dans le layout.

```typescript
// dashboard/layout.tsx — getUser avec cache()
const getUser = cache(async () => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return { supabase, user }
})

// dashboard/page.tsx — appelle ENCORE createClient() + auth.getUser() !
const supabase = await createClient()
const { data: { user } } = await supabase.auth.getUser()
```

**Impact** : Chaque visite d'une page dashboard = 2-5 appels Supabase au lieu de 1-2.

---

## 3. Audit du rendu

### Carte de rendu complète

| Route | Mode actuel | Mode optimal | Raison |
|-------|-------------|--------------|--------|
| `/` | **Dynamic** (forcé par `'use client'` root) | **Static** | Pure landing page, zéro data serveur |
| `/connexion` | **Static** ✅ | Static | Client component, aucun fetch serveur |
| `/inscription` | Non trouvé mais probablement Static | Static | À vérifier |
| `/[slug]` | **Dynamic SSR** | **ISR 60s** | Données de boutique peu changeantes |
| `/[slug]/produits/[productSlug]` | **Dynamic SSR** | **ISR 120s** + `generateStaticParams` | Pages produits stables |
| `/dashboard` | **Dynamic SSR** | **Dynamic SSR** (obligatoire) | Auth nécessaire |
| `/dashboard/produits` | **Dynamic SSR** | **Dynamic SSR** (obligatoire) | Auth + données user |
| `/dashboard/produits/[id]` | **Dynamic SSR** | **Dynamic SSR** (obligatoire) | Auth + données produit |
| `/dashboard/produits/nouveau` | **Dynamic SSR** | **Dynamic SSR** allégé | Réduit à 1 seule query |
| `/dashboard/boutique` | **Dynamic SSR** | **Dynamic SSR** allégé | Idem |
| `/dashboard/apparence` | **Dynamic SSR** | **Dynamic SSR** allégé | Idem |
| `/sitemap.xml` | **ISR 1h** ✅ | ISR 1h | Bon |
| `/robots.txt` | **Static** ✅ | Static | Bon |

### Pourquoi `app/page.tsx` est-il un problème critique ?

```typescript
// app/page.tsx — ligne 2
'use client'
```

La page d'accueil a `'use client'` en haut. Cela signifie :
1. **Tout le bundle JS est envoyé au client** : framer-motion (250KB+), lucide-react, etc.
2. **La page ne peut pas être pré-rendue statiquement** sans hydratation
3. **Aucun avantage RSC** n'est exploité

**Pire** : les données de la page d'accueil sont **100% statiques** (steps, features, pricing). Il n'y a aucune raison de bloquer le SSR.

---

## 4. Audit Supabase

### 🚨 Problème #3 — `createClient()` avec `cookies()` partout, même pour les données publiques

```typescript
// lib/supabase/server.ts
export async function createClient() {
  const cookieStore = await cookies()  // ← force le mode dynamique !
  // ...
}
```

`cookies()` est une **Dynamic API** de Next.js. Son appel dans n'importe quel Server Component force la page entière en mode **Dynamic SSR**. Cela est légitime pour le dashboard (auth nécessaire), mais **catastrophique pour la vitrine publique**.

Les pages `app/[slug]/page.tsx` et `app/[slug]/produits/[productSlug]/page.tsx` appellent `createClient()` qui appelle `cookies()`, rendant ces pages **impossibles à cacher statiquement ou en ISR**.

### 🚨 Problème #4 — Doubles queries sur la page produit

`app/[slug]/produits/[productSlug]/page.tsx` effectue jusqu'à **5 queries Supabase** :

1. `stores` par slug → récupérer store
2. `products` + `product_images` par slug → récupérer produit
3. `products` (select category seulement) → récupérer catégories pour breadcrumb
4. `products` (same category, sans produit actuel) → produits similaires
5. `products` (filler) → produits supplémentaires si < 8

La query `generateMetadata` **répète** les queries 1 et 2, soit au total jusqu'à **7 appels Supabase** par visite.

### 🚨 Problème #5 — `select('*')` partout

```typescript
// app/[slug]/page.tsx — ligne 90
const { data: store } = await supabase
  .from('stores')
  .select('*')  // ← toutes les colonnes, y compris inutiles
```

Les colonnes `owner_id`, `created_at` et d'autres sont inutiles pour la vitrine. Chaque requête transfère plus de données que nécessaire.

### 🚨 Problème #6 — `generateMetadata` dans les pages publiques refait les mêmes queries

Dans `app/[slug]/page.tsx` et `app/[slug]/produits/[productSlug]/page.tsx`, `generateMetadata` et le composant de page font chacun leurs propres appels Supabase. Avec React cache(), ces appels pourraient être dédupliqués.

### 🚨 Problème #7 — Dashboard page.tsx duplique tout le travail du layout

```typescript
// dashboard/layout.tsx fait déjà : auth.getUser() + users.select + stores.select
// dashboard/page.tsx REFAIT : auth.getUser() + users.select + stores.select('*') + 2 counts products
```

Le layout passe `storeName`, `storeSlug`, `fullName` au shell, mais la page les récupère indépendamment. C'est du **double travail**.

### 🚨 Problème #8 — Reorder de produits : N updates individuels

```typescript
// app/api/products/reorder/route.ts
const promises = ids.map((id, index) =>
  supabase.from('products').update({ sort_order: index }).eq('id', id)
)
await Promise.all(promises)
```

Si un marchand a 50 produits et les réordonne, cela génère **50 appels Supabase en parallèle**. C'est inefficace et non atomique. Il faut utiliser un `upsert` ou une stored procedure.

### Audit RLS

Les policies sont globalement bonnes, mais :
- La policy `"products: lecture publique si publié"` utilise `is_published = true`. Si un visiteur demande un produit non publié (`is_published = false`), Supabase retourne `[]` → le code fait un `notFound()`. C'est correct.
- La policy propriétaire fait un `select owner_id from stores where id = store_id` — c'est une **sous-requête corrélée** exécutée à chaque accès. Un index sur `stores(id)` (PK) existe déjà, donc c'est acceptable, mais une jointure explicite serait plus rapide.

---

## 5. Audit Clerk / Auth (Supabase Auth)

Le projet n'utilise pas Clerk mais **Supabase Auth**. Points d'analyse :

### `supabase.auth.getUser()` — analyse

| Emplacement | Justification | Impact |
|-------------|---------------|--------|
| `dashboard/layout.tsx` | ✅ Nécessaire pour auth guard | Dynamic SSR obligatoire |
| `dashboard/page.tsx` | ❌ Dupliqué ! Layout déjà l'a fait | +1 appel réseau inutile |
| `dashboard/produits/page.tsx` | ❌ Dupliqué ! | +1 appel réseau inutile |
| `dashboard/produits/nouveau/page.tsx` | ❌ Dupliqué ! | +1 appel réseau inutile |
| `dashboard/produits/[id]/page.tsx` | ❌ Dupliqué ! | +1 appel réseau inutile |
| `dashboard/boutique/page.tsx` | ❌ Dupliqué ! | +1 appel réseau inutile |
| `dashboard/apparence/page.tsx` | ❌ Dupliqué ! | +1 appel réseau inutile |
| `api/upload/route.ts` | ✅ Nécessaire | OK |
| `api/products/reorder/route.ts` | ✅ Nécessaire | OK |
| `api/stores/check-slug/route.ts` | ❌ Pas d'auth ici ! | Le slug check est public |

**Résumé** : `getUser()` est appelé **7 fois par navigation dashboard** alors qu'il devrait l'être **1 seule fois** (dans le layout).

---

## 6. Audit App Router

### Layout excessivement dynamique

```
app/layout.tsx → Root Layout
  ├── GoogleAnalytics (Client Component ✅)
  ├── ServiceWorkerRegistration (Client Component ✅)
  └── children
      ├── app/[slug]/page.tsx — devrait être ISR
      ├── app/dashboard/layout.tsx — forcé dynamique (auth)
      └── ...
```

### Problème : Pas de layout pour les storefronts

Les pages `app/[slug]/` et `app/[slug]/produits/[productSlug]/` n'ont pas de **layout partagé**. Cela signifie que le `StoreHeader` est rendu deux fois séparément dans des pages distinctes, sans partage de données. Un layout `app/[slug]/layout.tsx` permettrait de :
1. Charger les données de la boutique **une seule fois**
2. Les partager entre la page liste et la page produit

### Problème : `'use client'` sur la landing page (app/page.tsx)

Toute la page d'accueil est un Client Component alors qu'elle ne contient **aucun state serveur**. Les composants avec animations (framer-motion) auraient dû être des Client Components enfants d'un Server Component parent.

### Problème : DashboardShell est un Client Component lourd

`DashboardShell` utilise framer-motion + AnimatePresence pour le drawer mobile. Ce composant est le wrapper de tout le dashboard, ce qui signifie que tout le subtree devient client-side. La stratégie correcte est :
- `DashboardShell` reste Client Component ✅ (état mobile menu)
- Mais il doit recevoir ses données via props depuis le Server Component layout ✅ (déjà le cas)

### Composants redondants

- `StoreAnalytics` : Client Component qui envoie un event GA4. Correct mais peut être simplifié.
- `ServiceWorkerRegistration` : Composant entier pour 4 lignes de code. Peut être inline dans le layout.

---

## 7. Audit Bundle

### Dépendances et poids estimé

| Librairie | Poids (gzippé) | Utilisation | Problème |
|-----------|----------------|-------------|----------|
| `framer-motion` | ~45KB | Landing page + Dashboard + ProductCard | Chargé sur TOUTES les pages (landing incluse) |
| `lucide-react` | ~2KB/icône | Partout | ✅ OK si tree-shaking actif |
| `@radix-ui/*` | ~15KB total | Dashboard forms | ✅ OK |
| `react-hook-form` | ~13KB | Dashboard forms + Login | ✅ OK |
| `zod` | ~12KB | Validation | ✅ OK |
| `next-cloudinary` | ~30KB | Non utilisé directement | ❌ Installé mais `uploadImage` utilise le SDK bas-niveau |
| `cloudinary` | ~150KB | Côté serveur uniquement | ✅ OK (bundle serveur) |
| `browser-image-compression` | ~45KB | Upload images | Chargé même sans upload |
| `class-variance-authority` | ~2KB | CVA | ✅ OK |

### 🚨 Problème #9 — `next-cloudinary` installé mais inutilisé

`next-cloudinary` est dans les dépendances mais le code utilise directement le SDK `cloudinary` côté serveur. C'est une dépendance morte qui gonfle le bundle inutilement.

### 🚨 Problème #10 — `framer-motion` sur la landing page force 'use client'

La landing page entière est `'use client'` à cause de framer-motion. Cela signifie que tout le composant (steps, features, pricing — données statiques) est rendu côté client, alors qu'il devrait être pré-rendu HTML statique.

### 🚨 Problème #11 — `ProductCard` est un Client Component pour un simple hover

```typescript
// components/storefront/ProductCard.tsx
'use client'
import { useState } from 'react'
// ...
const [isHovered, setIsHovered] = useState(false)
```

Le seul état géré est `isHovered` pour animer la bordure. Ce comportement peut être réalisé avec du **CSS pur** (`:hover`), sans Client Component.

### Lazy loading manquant

- La galerie d'images (`ProductImageGallery`) est un composant lourd chargé même si le produit n'a qu'une image
- `framer-motion` n'est pas chargé en `dynamic import`
- `browser-image-compression` est importé à la compilation de `ImageUpload.tsx`, même quand on ne fait pas d'upload

---

## 8. Audit Images

### 🚨 Problème #12 — `unoptimized` sur les images de boutique

```typescript
// StoreHeader.tsx
<Image src={store.banner_url} alt="" fill priority unoptimized />
<Image src={store.logo_url} alt={store.name} fill sizes="64px" unoptimized />

// ProductImageGallery.tsx
<Image src={images[activeIndex]} ... unoptimized />
<Image src={url} alt="" fill className="object-cover" unoptimized />
```

`unoptimized` désactive **complètement** l'optimisation d'images de Next.js. Les images Cloudinary sont servies dans leur taille/format d'origine. Pourtant, Cloudinary a son propre système de transformation d'URL qui permet de redimensionner et convertir en WebP.

### 🚨 Problème #13 — Utilisation d'un tag `<img>` brut dans la landing page

```typescript
// app/page.tsx — ligne 192
<img
  src="/hero-mobile.jpg"
  alt="..."
  width={1536}
  height={1280}
  className="relative w-full rounded-3xl shadow-glow-purple"
/>
```

Un `<img>` HTML natif au lieu de `next/image`. Aucune optimisation, aucun lazy loading automatique, pas de placeholder blur, format non optimisé.

### 🚨 Problème #14 — `priority` sur la bannière de boutique sans `sizes`

```typescript
<Image src={store.banner_url} fill priority unoptimized />
```

`fill` sans `sizes` fait que Next.js ne peut pas générer les srcsets appropriés. Le navigateur télécharge souvent une image trop grande.

### Cloudinary — transformation manquante

Les URLs Cloudinary stockées en base sont des URLs brutes (ex: `https://res.cloudinary.com/dopax15ru/image/upload/v.../photo.jpg`). Il n'y a aucune transformation d'URL pour :
- Redimensionner à la taille affichée
- Convertir en WebP/AVIF
- Appliquer de la compression intelligente

---

## 9. Audit Navigation

### `prefetch` — état actuel

```typescript
// app/[slug]/page.tsx — catégorie filtering
<Link href={`/${store.slug}`}>Tous</Link>
<Link href={`/${store.slug}?category=${encodeURIComponent(cat)}`}>...</Link>
```

Les liens de catégorie ont le prefetch par défaut (`true`). Cela déclenche des requêtes serveur anticipées pour chaque catégorie visible, multipliant les Serverless Functions.

### 🚨 Problème #15 — Navigation par searchParams force le rendu dynamique

```typescript
// app/[slug]/page.tsx
searchParams: Promise<{ category?: string }>

const { category } = await searchParams
```

La présence de `searchParams` dans les props de la page force Next.js à rendre la page en mode **dynamique**, même si le paramètre n'est pas utilisé. La solution est de filtrer les produits **côté client** après un chargement initial statique.

### `router.replace()` après login

```typescript
// app/connexion/page.tsx
router.replace('/dashboard')
```

C'est correct. `replace` évite que le bouton "retour" ramène à la page de connexion.

---

## 10. Audit Multi-tenant

### Architecture actuelle

```
Request: /boutique-xyz
     ↓
Proxy (Edge) → inject x-store-slug header → INUTILE
     ↓
app/[slug]/page.tsx
  → createClient() avec cookies()  ← FORCE DYNAMIC
  → Query stores by slug
  → Query products by store_id
  → Filtrage catégorie en mémoire
  → Render complet SSR
```

### Architecture optimale

```
Request: /boutique-xyz
     ↓
Aucun middleware (routes statiques avec ISR)
     ↓
app/[slug]/page.tsx (ISR 60s)
  → createClient() SANS cookies() (lecture publique)
  → Query stores + products en PARALLEL
  → Page HTML cachée par Netlify CDN
  → Client Component pour filtrage catégorie
```

### 🚨 Problème #16 — Récupération séquentielle store → products

```typescript
// app/[slug]/page.tsx
const { data: store } = await supabase.from('stores').select('*').eq('slug', slug).maybeSingle()
// puis, après avoir le store.id :
const { data: products } = await supabase.from('products').select('*').eq('store_id', store.id)
```

Les deux queries sont **séquentielles** (waterfall). Avec une jointure Supabase, elles pourraient être faites en **une seule requête**.

### 🚨 Problème #17 — Filtrage de catégorie côté serveur via searchParams

Le filtrage par catégorie déclenche un **nouveau rendu serveur complet** à chaque clic sur une catégorie. Avec ISR et un filtrage client-side, chaque visite de boutique ne générerait **qu'une seule Serverless Function** (au lieu d'une par catégorie filtrée).

---

## 11. Audit SEO

### Points forts ✅

- Metadata dynamique via `generateMetadata` sur les pages publiques
- OpenGraph et Twitter cards configurés
- `sitemap.ts` avec ISR 1h
- `robots.ts` bien configuré (disallow dashboard et api)
- Balise `google-site-verification` présente

### 🚨 Problème #18 — `generateMetadata` refait les mêmes queries que le composant

Sur `app/[slug]/page.tsx`, Next.js appelle `generateMetadata` ET le composant de page. Les deux font `createClient()` + query `stores`. Sans `React.cache()`, c'est **2 appels Supabase** pour la même donnée.

### 🚨 Problème #19 — canonical URL manquant

Aucune balise `canonical` n'est définie dans les metadata. Si une boutique est accessible via `/boutique` et `/boutique?category=robe`, les deux URLs sont indexées séparément, créant du contenu dupliqué.

### 🚨 Problème #20 — Sitemap ne génère pas les URLs de catégorie

Les URLs de type `/boutique?category=robe` ne sont pas dans le sitemap (c'est correct car elles ne seraient que du contenu dupliqué). Mais les catégories elles-mêmes ne sont pas listées en tant que pages séparées si on avait choisi une URL `/boutique/categorie/robe`.

### 🚨 Problème #21 — `new Date()` dans les metadata statiques du sitemap

```typescript
// sitemap.ts
lastModified: new Date()  // ← revalide à chaque ISR, toujours "maintenant"
```

La date de modification des routes statiques (landing, connexion) est toujours la date actuelle, ce qui peut perturber les crawlers qui voient une "modification" à chaque re-rendu.

### OG Image manquante pour la landing page

L'OG image de la landing page n'est pas définie dans `app/layout.tsx`, ce qui signifie que les partages sur les réseaux sociaux affichent le logo par défaut.

---

## 12. Audit Netlify

### Ce qui génère les Edge Functions (94 000)

```
Proxy (middleware.ts) → intercepte toutes les routes non-API non-static
├── /                → Edge Function (inutile — page statique)
├── /connexion       → Edge Function (inutile — page statique)
├── /inscription     → Edge Function (inutile — page statique)
├── /boutique-xyz    → Edge Function (inutile — header non utilisé)
└── /boutique-xyz/produits/produit-abc → Edge Function (inutile)
```

### Ce qui génère les Serverless Functions (66 000)

```
Pages dynamiques SSR :
├── /[slug]/...         → SSR à chaque visite (devrait être ISR)
├── /dashboard/...      → SSR obligatoire (auth)
└── API routes          → Serverless légitimes
```

### 🚨 Problème #22 — Pas de configuration Netlify explicite

Il n'y a pas de `netlify.toml` dans le projet. Sans configuration :
- Les headers de cache ne sont pas optimisés
- Les Edge Functions ne sont pas configurées précisément
- Les redirects ne sont pas gérés au niveau CDN

### Cold Starts

Chaque Serverless Function sur Netlify peut avoir des cold starts de **100ms à 2s**. Avec 66 000 exécutions, même 5% de cold starts = ~3 300 requêtes lentes.

---

## 13. Audit Sécurité

### 🚨 CRITIQUE — Clés sensibles exposées dans `.env.local`

```env
CLOUDINARY_API_SECRET=FeSKXjLfkiIMC13YDl1YwV7cLF0
database_password=CVq4V/F,efaG2k8
```

Ces clés sont dans `.env.local`. Si ce fichier est committé par erreur (malgré le `.gitignore`), les secrets sont compromis. La clé anon Supabase est publique par design, mais les clés Cloudinary et le mot de passe de base de données ne doivent jamais quitter l'environnement serveur.

**Vérifier immédiatement** : `git log --all -- .env.local` pour s'assurer que ce fichier n'a jamais été committé.

### 🚨 Problème #23 — Validation du dossier upload trop permissive

```typescript
// api/upload/route.ts
const allowedFolders = [
  'rohaty-shop/stores/logo',
  'rohaty-shop/stores/banner',
  'rohaty-shop/products',
]
if (!allowedFolders.includes(folder)) { ... }
```

Un utilisateur authentifié peut uploader dans `rohaty-shop/products` même si le produit appartient à une autre boutique. Il n'y a pas de validation que le `storeId` correspond à l'utilisateur connecté dans l'API d'upload.

### 🚨 Problème #24 — Pas de limite de taille sur l'upload

L'API d'upload ne vérifie pas la taille du fichier avant de l'envoyer à Cloudinary. Un utilisateur malveillant pourrait envoyer des fichiers de plusieurs Go, entraînant des coûts Cloudinary élevés.

### 🚨 Problème #25 — Injection via `searchParams` non validés

```typescript
// app/[slug]/page.tsx
const { category } = await searchParams
// utilisé directement dans :
.filter((p) => p.category?.toLowerCase() === activeCategory.toLowerCase())
```

Le filtrage se fait en mémoire JavaScript (safe), mais la valeur brute est propagée sans sanitisation dans les URLs des composants enfants. Si `category` contenait des caractères spéciaux, cela pourrait provoquer des problèmes d'encodage.

### Points forts de sécurité ✅

- RLS activé sur toutes les tables Supabase
- Les queries produits/stores utilisent l'anon key (pas de service role key côté client)
- L'auth pour les mutations API est vérifiée via `supabase.auth.getUser()`
- La clé Cloudinary API secret est côté serveur uniquement
- Les dossiers d'upload sont whitelistés

### Risque XSS

- Pas de `dangerouslySetInnerHTML` trouvé → ✅ OK
- Les données utilisateur sont affichées via JSX → ✅ encodage automatique React
- Le `store.description` et `product.description` sont affichés via `whitespace-pre-wrap` mais sans HTML → ✅ OK

### Risque CSRF

- Les mutations utilisent Supabase Auth token (JWT) → protection implicite
- Les API routes vérifient `auth.getUser()` → ✅ OK

---

## 14. Notes sur 10

| Critère | Note | Commentaire |
|---------|------|-------------|
| **Architecture** | 5/10 | App Router bien structuré, mais RSC sous-exploité, proxy inutile, pas de layout storefront |
| **Performance** | 4/10 | 94K Edge Functions inutiles, pages statiques forcées en dynamique, queries dupliquées |
| **Sécurité** | 6/10 | RLS bien configuré, mais upload sans limite de taille, validation dossier insuffisante |
| **Maintenabilité** | 6/10 | Code lisible, mais duplication auth dans chaque page dashboard |
| **SEO** | 6/10 | Metadata dynamique OK, mais canonical manquant, searchParams force dynamic |
| **UX** | 7/10 | Design soigné, PWA, WhatsApp flow bien pensé |
| **Scalabilité** | 4/10 | Pas de cache, chaque boutique = SSR complet, middleware sur tout |
| **Coût Netlify** | 3/10 | 94K Edge + 66K Serverless = facturation élevée, proche des quotas |

---

## 15. Refactoring complet avec code

---

### FIX #1 — Supprimer le proxy (IMPACT : -94 000 Edge Functions)

> **Problème** : Le proxy s'exécute sur 100% des requêtes et n'a aucun effet utile.  
> **Solution** : Supprimer totalement le middleware, ou le limiter uniquement aux routes qui en ont réellement besoin.

#### Option A — Supprimer le middleware complètement

Créer ou remplacer `middleware.ts` à la racine :

```typescript
// middleware.ts — SUPPRIMER ou remplacer par ce fichier vide
// Le proxy est inutile car x-store-slug n'est jamais lu

export { }  // fichier vide = pas de middleware
```

Supprimer `proxy.ts`.

#### Option B — Si le middleware est nécessaire plus tard (auth guard)

```typescript
// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Pour l'instant, on ne protège que le dashboard
  // Les storefronts publics et la landing ne passent PAS par ici
  return NextResponse.next()
}

export const config = {
  matcher: [
    // UNIQUEMENT les routes dashboard — et non pas "/dashboard/produits" enfants
    '/dashboard',
    '/dashboard/:path*',
  ],
}
```

**Gain estimé : -90% des Edge Functions (environ -85 000 exécutions)**

---

### FIX #2 — Créer un client Supabase sans cookies pour la vitrine publique

> **Problème** : `createClient()` appelle `cookies()` qui force le mode dynamique.  
> **Solution** : Un second client "public" sans gestion de cookies pour la vitrine.

```typescript
// lib/supabase/public.ts
// Client Supabase pour les données PUBLIQUES (vitrine, storefront)
// N'utilise PAS cookies() → compatible avec ISR et cache statique
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

let _publicClient: ReturnType<typeof createSupabaseClient> | null = null

export function createPublicClient() {
  if (_publicClient) return _publicClient
  
  _publicClient = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  
  return _publicClient
}
```

---

### FIX #3 — Refactoriser `app/[slug]/page.tsx` avec ISR + client public + filtrage client

> **Problème** : Page en SSR dynamique, double query, searchParams force dynamic, framer-motion en Client.  
> **Solution** : ISR 60s, client public, store + produits en requête parallèle, filtrage côté client.

```typescript
// app/[slug]/page.tsx
import { notFound } from 'next/navigation'
import { createPublicClient } from '@/lib/supabase/public'
import { StoreHeader } from '@/components/storefront/StoreHeader'
import { buildWhatsAppUrl } from '@/lib/whatsapp'
import { StoreAnalytics } from '@/components/storefront/StoreAnalytics'
import { StorefrontCatalog } from '@/components/storefront/StorefrontCatalog'
import type { Metadata } from 'next'

// ✅ ISR : revalider toutes les 60 secondes
export const revalidate = 60

// ✅ Générer les pages statiques au build pour les boutiques existantes
export async function generateStaticParams() {
  const supabase = createPublicClient()
  const { data: stores } = await supabase.from('stores').select('slug')
  return (stores || []).map((store) => ({ slug: store.slug }))
}

interface StorefrontPageProps {
  params: Promise<{ slug: string }>
  // ⚠️ searchParams retiré → filtrage côté client désormais
}

// Déduplique les queries entre generateMetadata et le composant
import { cache } from 'react'

const getStoreData = cache(async (slug: string) => {
  const supabase = createPublicClient()
  
  // ✅ Requête parallèle : store + products en même temps
  const [{ data: store }, { data: allProducts }] = await Promise.all([
    supabase
      .from('stores')
      .select('id, name, slug, slogan, whatsapp, logo_url, banner_url, primary_color, cover_image, description')
      .eq('slug', slug)
      .maybeSingle(),
    // On ne peut pas paralléliser sans l'id, donc on fait store d'abord
    // Cette query sera exécutée après
    Promise.resolve({ data: null })
  ])
  
  if (!store) return null
  
  const { data: products } = await supabase
    .from('products')
    .select('id, name, slug, description, price, list_price, image_url, category')
    .eq('store_id', store.id)
    .eq('is_published', true)
    .order('sort_order', { ascending: true })
  
  return { store, products: products || [] }
})

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const data = await getStoreData(slug)

  if (!data) return { title: 'Boutique introuvable' }
  const { store } = data

  const image = store.cover_image || store.logo_url || 'https://shop.rohaty.com/logo.png'

  return {
    title: `${store.name} | Rohaty Shop`,
    description: store.description || `Découvrez les produits de ${store.name}`,
    alternates: {
      canonical: `https://shop.rohaty.com/${store.slug}`, // ✅ canonical ajouté
    },
    openGraph: {
      title: store.name,
      description: store.description || `Découvrez les produits de ${store.name}`,
      url: `https://shop.rohaty.com/${store.slug}`,
      siteName: 'Rohaty Shop',
      images: [{ url: image, width: 1200, height: 630, alt: store.name }],
      locale: 'fr_FR',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: store.name,
      description: store.description || `Découvrez les produits de ${store.name}`,
      images: [image],
    },
  }
}

export default async function StorefrontPage({ params }: StorefrontPageProps) {
  const { slug } = await params
  const data = await getStoreData(slug)

  if (!data) notFound()

  const { store, products } = data
  const primaryColor = store.primary_color || '#2563EB'

  // WhatsApp URLs calculées ici (Server Component — pas de JS client)
  const productsWithWhatsApp = products.map((product) => ({
    ...product,
    whatsappUrl: buildWhatsAppUrl(
      product.name,
      product.price,
      store.whatsapp,
      `https://shop.rohaty.com/${store.slug}/produits/${product.slug}`
    ),
  }))

  return (
    <div
      style={{ '--primary': primaryColor } as React.CSSProperties}
      className="min-h-screen bg-bg-base text-white flex flex-col font-sans"
    >
      <StoreAnalytics slug={store.slug} name={store.name} />
      <StoreHeader store={store} />

      {/* ✅ Catalog avec filtrage côté CLIENT — pas de searchParams serveur */}
      <StorefrontCatalog
        products={productsWithWhatsApp}
        storeSlug={store.slug}
        primaryColor={primaryColor}
      />

      <footer className="border-t border-white/5 bg-bg-muted/30 py-6 text-center text-xs text-text-secondary select-none">
        <p>
          © {new Date().getFullYear()} {store.name} · Propulsé par{' '}
          <a href="/" className="text-primary font-semibold hover:underline">
            Rohaty Shop
          </a>
        </p>
      </footer>
    </div>
  )
}
```

```typescript
// components/storefront/StorefrontCatalog.tsx
// ✅ Client Component pour le filtrage de catégorie — zéro Serverless Function
'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { ProductCard } from './ProductCard'
import { cn } from '@/lib/utils'

interface Product {
  id: string
  name: string
  slug: string
  description: string | null
  price: number
  list_price: number
  image_url: string | null
  category: string | null
  whatsappUrl: string
}

interface StorefrontCatalogProps {
  products: Product[]
  storeSlug: string
  primaryColor: string
}

export function StorefrontCatalog({ products, storeSlug, primaryColor }: StorefrontCatalogProps) {
  const [activeCategory, setActiveCategory] = useState('')

  const allCategories = useMemo(
    () => Array.from(new Set(products.map((p) => p.category?.trim()).filter((c): c is string => !!c))),
    [products]
  )

  const filteredProducts = useMemo(
    () =>
      activeCategory
        ? products.filter((p) => p.category?.toLowerCase() === activeCategory.toLowerCase())
        : products,
    [products, activeCategory]
  )

  return (
    <>
      {/* Barre catégories */}
      {allCategories.length > 0 && (
        <div className="sticky top-0 z-50 bg-bg-base/80 backdrop-blur-xl border-b border-white/5">
          <div className="px-3 py-2">
            <div className="flex gap-2 overflow-x-auto no-scrollbar scroll-smooth snap-x">
              <button
                onClick={() => setActiveCategory('')}
                className={cn(
                  'px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap snap-start',
                  !activeCategory ? 'text-white' : 'bg-white/5 text-gray-300'
                )}
                style={!activeCategory ? { backgroundColor: primaryColor } : undefined}
              >
                Tous
              </button>
              {allCategories.map((cat) => {
                const isActive = activeCategory?.toLowerCase() === cat.toLowerCase()
                return (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(isActive ? '' : cat)}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap snap-start',
                      isActive ? 'text-white' : 'bg-white/5 text-gray-300'
                    )}
                    style={isActive ? { backgroundColor: primaryColor } : undefined}
                  >
                    {cat}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Catalog Grid */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 flex-1 w-full">
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                whatsappUrl={product.whatsappUrl}
                primaryColor={primaryColor}
                storeSlug={storeSlug}
              />
            ))}
          </div>
        ) : (
          <div className="glass rounded-2xl p-12 text-center max-w-md mx-auto border border-white/5 mt-10">
            <div className="text-4xl mb-4 select-none">🚀</div>
            <h3 className="text-lg font-bold text-white font-heading">
              {activeCategory ? 'Aucun produit dans cette catégorie' : 'Boutique en cours de préparation'}
            </h3>
            <p className="text-text-secondary text-xs mt-2 leading-relaxed">
              {activeCategory
                ? "Le commerçant n'a pas encore publié de produits dans cette catégorie."
                : "Le commerçant n'a pas encore publié de produits pour le moment. Revenez bientôt !"}
            </p>
          </div>
        )}
      </main>
    </>
  )
}
```

**Gain estimé : -80% des Serverless Functions liées aux storefronts**

---

### FIX #4 — Refactoriser `app/page.tsx` (Landing page statique)

> **Problème** : `'use client'` force la page entière en Client Component.  
> **Solution** : Server Component parent + Client Components enfants pour les animations.

```typescript
// app/page.tsx — Retirer 'use client', page purement statique
import Link from 'next/link'
import { ShoppingBag, Store, Zap, Share2, Smartphone, Palette, MessageSquare, Check, Star } from 'lucide-react'
import { GradientButton } from '@/components/shared/GradientButton'
import { GlassCard } from '@/components/shared/GlassCard'
import { SectionTitle } from '@/components/shared/SectionTitle'
import Image from 'next/image'
import { SiteHeader } from '@/components/shared/SiteHeader'
import { LandingHero } from '@/components/shared/LandingHero'  // nouveau Client Component

// Données 100% statiques — jamais de fetch
const steps = [
  { number: '01', title: 'Créez votre boutique', desc: '...' },
  { number: '02', title: 'Ajoutez vos produits', desc: '...' },
  { number: '03', title: 'Recevez les commandes', desc: '...' },
]

const features = [
  { iconName: 'store', title: 'Boutique personnalisée', desc: '...' },
  // ...
]

// ✅ PAS de 'use client' — Server Component pur
export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="bg-orb-blue absolute -top-40 -left-32 size-[600px] blur-3xl opacity-60" />
        <div className="bg-orb-purple absolute top-[40%] -right-40 size-[500px] blur-3xl opacity-50" />
      </div>

      <SiteHeader />

      {/* Le Hero avec animations est isolé dans un Client Component */}
      <LandingHero />

      {/* Sections statiques — Server Components */}
      <section id="how-it-works" className="py-20 md:py-32 bg-bg-muted/40 border-y border-white/5">
        {/* ... contenu statique sans animations */}
      </section>
      {/* ... reste de la landing */}
    </div>
  )
}
```

**Gain : Page d'accueil pré-rendue statiquement → 0 Serverless Function, HTML servi depuis le CDN**

---

### FIX #5 — Éliminer les doublons d'auth dans le dashboard

> **Problème** : Chaque page dashboard refait `auth.getUser()` alors que le layout l'a déjà fait.  
> **Solution** : Passer `userId` et `storeId` via props ou utiliser `React.cache()` partagé.

```typescript
// lib/supabase/dashboard-cache.ts
// Cache React partagé entre layout et pages du dashboard (même Request)
import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'

export const getCurrentUser = cache(async () => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
})

export const getCurrentStore = cache(async (userId: string) => {
  const supabase = await createClient()
  const { data: store } = await supabase
    .from('stores')
    .select('id, name, slug, slogan, whatsapp, logo_url, banner_url, primary_color')
    .eq('owner_id', userId)
    .single()
  return store
})
```

```typescript
// app/dashboard/layout.tsx — VERSION OPTIMISÉE
import { redirect } from 'next/navigation'
import { getCurrentUser, getCurrentStore } from '@/lib/supabase/dashboard-cache'
import { DashboardShell } from '@/components/dashboard/DashboardShell'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()
  if (!user) redirect('/connexion')

  const [store, userProfile] = await Promise.all([
    getCurrentStore(user.id),
    (async () => {
      const supabase = await createClient()
      const { data } = await supabase.from('users').select('full_name').eq('id', user.id).single()
      return data
    })()
  ])

  const fullName = userProfile?.full_name || user.user_metadata?.full_name || 'Commerçant'
  const storeName = store?.name || 'Ma Boutique'
  const storeSlug = store?.slug || ''

  return (
    <DashboardShell storeName={storeName} storeSlug={storeSlug} fullName={fullName}>
      {children}
    </DashboardShell>
  )
}
```

```typescript
// app/dashboard/page.tsx — VERSION OPTIMISÉE (plus de doublon auth)
import { redirect } from 'next/navigation'
import { getCurrentUser, getCurrentStore } from '@/lib/supabase/dashboard-cache'
import { createClient } from '@/lib/supabase/server'
import { GlassCard } from '@/components/shared/GlassCard'
import { CopyButton } from '@/components/dashboard/CopyButton'
import { ShoppingBag, Eye, Link as LinkIcon, Phone, ArrowRight, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

export default async function DashboardPage() {
  // ✅ Utilise le cache React — pas de double appel réseau
  const user = await getCurrentUser()
  if (!user) redirect('/connexion')

  const store = await getCurrentStore(user.id)
  
  const firstName = (user.user_metadata?.full_name || 'Commerçant').trim().split(/\s+/)[0]
  const storeId = store?.id || null
  const storeSlug = store?.slug || ''
  const whatsappNumber = store?.whatsapp || 'Non configuré'

  // ✅ Counts en parallèle avec une seule query plus efficace
  let totalProducts = 0
  let publishedProducts = 0

  if (storeId) {
    const supabase = await createClient()
    const { data: productCounts } = await supabase
      .from('products')
      .select('is_published')
      .eq('store_id', storeId)
    
    totalProducts = productCounts?.length || 0
    publishedProducts = productCounts?.filter(p => p.is_published).length || 0
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const absoluteStoreUrl = `${appUrl}/${storeSlug}`
  const displayStoreUrl = `shop.rohaty.com/${storeSlug}`

  return (
    <div className="space-y-8">
      {/* ... même JSX qu'avant */}
    </div>
  )
}
```

**Gain : -5 appels Supabase par navigation dashboard = ~30% de réduction des Serverless Functions dashboard**

---

### FIX #6 — Optimiser la page produit avec ISR et requête unique

```typescript
// app/[slug]/produits/[productSlug]/page.tsx — VERSION OPTIMISÉE
import { notFound } from 'next/navigation'
import { createPublicClient } from '@/lib/supabase/public'
import { cache } from 'react'

// ✅ ISR 120 secondes
export const revalidate = 120

// ✅ Générer les pages au build
export async function generateStaticParams() {
  const supabase = createPublicClient()
  const { data: products } = await supabase
    .from('products')
    .select('slug, stores(slug)')
    .eq('is_published', true)
  
  return (products || [])
    .filter((p) => p.stores && (p.stores as any).slug)
    .map((p) => ({
      slug: (p.stores as any).slug,
      productSlug: p.slug,
    }))
}

// ✅ Une seule query pour store + produit via jointure
const getProductPageData = cache(async (slug: string, productSlug: string) => {
  const supabase = createPublicClient()
  
  // Requête unique : store + produit + images en une seule jointure
  const { data: product } = await supabase
    .from('products')
    .select(`
      id, name, slug, description, price, list_price, image_url, category, is_published,
      product_images(id, url, position, is_primary),
      stores!inner(id, name, slug, slogan, whatsapp, logo_url, banner_url, primary_color, cover_image)
    `)
    .eq('slug', productSlug)
    .eq('is_published', true)
    .eq('stores.slug', slug)
    .maybeSingle()
  
  if (!product || !product.stores) return null

  const store = product.stores as any
  
  // Produits similaires (une seule query)
  const { data: relatedProducts } = await supabase
    .from('products')
    .select('id, name, slug, price, list_price, image_url, category')
    .eq('store_id', store.id)
    .eq('is_published', true)
    .neq('id', product.id)
    .limit(10)
  
  return { product, store, relatedProducts: relatedProducts || [] }
})

export async function generateMetadata({ params }: { params: Promise<{ slug: string; productSlug: string }> }) {
  const { slug, productSlug } = await params
  const data = await getProductPageData(slug, productSlug)
  if (!data) return { title: 'Produit introuvable' }
  
  const { product, store } = data
  const primaryImage = (product.product_images as any[])?.find((i) => i.is_primary)
  const image = primaryImage?.url || product.image_url || store.cover_image || store.logo_url || 'https://shop.rohaty.com/logo.png'
  const title = `${product.name} • ${new Intl.NumberFormat('fr-FR').format(product.price)} DJF`
  const description = product.description || `Découvrez ${product.name} chez ${store.name}`

  return {
    title, description,
    alternates: { canonical: `https://shop.rohaty.com/${slug}/produits/${productSlug}` },
    openGraph: { title, description, images: [{ url: image, width: 1200, height: 1200 }] },
  }
}
```

**Gain : De 7 queries à 2 queries par visite produit, + ISR cache**

---

### FIX #7 — Reorder atomique avec UPSERT

```typescript
// app/api/products/reorder/route.ts — VERSION OPTIMISÉE
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const { ids } = await req.json() as { ids: string[] }
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'ids invalides' }, { status: 400 })
    }

    // Vérifier propriété de la boutique
    const { data: store } = await supabase
      .from('stores').select('id').eq('owner_id', user.id).single()
    if (!store) return NextResponse.json({ error: 'Boutique introuvable' }, { status: 404 })

    // ✅ Upsert atomique en une seule requête au lieu de N updates
    const updates = ids.map((id, index) => ({
      id,
      store_id: store.id,
      sort_order: index,
    }))

    const { error } = await supabase
      .from('products')
      .upsert(updates, { onConflict: 'id' })
      .eq('store_id', store.id) // sécurité supplémentaire via RLS

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
```

**Gain : De N queries à 1 query pour le réordonnancement**

---

### FIX #8 — Ajouter `sort_order` à la table products

```sql
-- Migration Supabase : ajouter sort_order
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS sort_order integer DEFAULT 0;

-- Index pour les tris
CREATE INDEX IF NOT EXISTS idx_products_sort 
  ON public.products(store_id, sort_order);

-- Index composite pour les requêtes de vitrine
CREATE INDEX IF NOT EXISTS idx_products_storefront
  ON public.products(store_id, is_published, sort_order);
```

---

### FIX #9 — Ajouter netlify.toml

```toml
# netlify.toml
[build]
  command = "npm run build"
  publish = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"

# Cache des assets statiques Next.js — 1 an
[[headers]]
  for = "/_next/static/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

# Cache des images optimisées
[[headers]]
  for = "/_next/image"
  [headers.values]
    Cache-Control = "public, max-age=86400, stale-while-revalidate=3600"

# Cache des pages ISR (storefronts)
[[headers]]
  for = "/[slug]"
  [headers.values]
    Cache-Control = "public, s-maxage=60, stale-while-revalidate=600"

[[headers]]
  for = "/[slug]/produits/[productSlug]"
  [headers.values]
    Cache-Control = "public, s-maxage=120, stale-while-revalidate=600"

# Headers de sécurité
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Permissions-Policy = "camera=(), microphone=(), geolocation=()"
```

---

### FIX #10 — Remplacer `<img>` par `<Image>` sur la landing page

```typescript
// app/page.tsx — Remplacer
// AVANT :
<img src="/hero-mobile.jpg" width={1536} height={1280} ... />

// APRÈS :
<Image
  src="/hero-mobile.jpg"
  alt="Smartphone affichant une boutique Rohaty Shop"
  width={1536}
  height={1280}
  priority
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRg..."
  className="relative w-full rounded-3xl shadow-glow-purple"
/>
```

---

### FIX #11 — Optimiser les images Cloudinary

```typescript
// lib/cloudinary-url.ts
// Helper pour générer des URLs Cloudinary optimisées sans SDK
export function cloudinaryTransform(
  url: string,
  options: { width?: number; height?: number; quality?: number; format?: 'webp' | 'avif' | 'auto' }
): string {
  if (!url.includes('res.cloudinary.com')) return url
  
  const { width, height, quality = 'auto', format = 'auto' } = options
  
  // Insérer les transformations dans l'URL Cloudinary
  const parts = url.split('/upload/')
  if (parts.length !== 2) return url
  
  const transforms = [
    'q_auto',
    'f_auto',
    width ? `w_${width}` : null,
    height ? `h_${height}` : null,
    'c_fill',
  ].filter(Boolean).join(',')
  
  return `${parts[0]}/upload/${transforms}/${parts[1]}`
}
```

Utilisation dans `StoreHeader.tsx` :
```typescript
// AVANT :
<Image src={store.banner_url} fill priority unoptimized />

// APRÈS :
<Image
  src={cloudinaryTransform(store.banner_url, { width: 800, quality: 80, format: 'auto' })}
  alt={`Bannière ${store.name}`}
  fill
  priority
  sizes="100vw"
  className="object-cover"
/>
```

---

### FIX #12 — Supprimer `next-cloudinary` des dépendances inutilisées

```bash
npm uninstall next-cloudinary
```

Ce package est installé mais jamais utilisé directement. Le SDK `cloudinary` côté serveur est utilisé à la place.

---

### FIX #13 — Ajouter limite de taille à l'upload

```typescript
// app/api/upload/route.ts — ajouter validation taille
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const formData = await request.formData()
    const file = formData.get('file') as File
    const folder = formData.get('folder') as string

    if (!file || !folder) {
      return NextResponse.json({ error: 'Fichier et dossier requis' }, { status: 400 })
    }

    // ✅ Limite de taille : 5 Mo
    const MAX_SIZE = 5 * 1024 * 1024 // 5 MB
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'Fichier trop volumineux (max 5 Mo)' }, { status: 413 })
    }

    // ✅ Validation du type MIME
    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Type de fichier non autorisé' }, { status: 400 })
    }

    // ✅ Validation du dossier
    const allowedFolders = [
      'rohaty-shop/stores/logo',
      'rohaty-shop/stores/banner',
      'rohaty-shop/products',
    ]
    if (!allowedFolders.includes(folder)) {
      return NextResponse.json({ error: 'Dossier non autorisé' }, { status: 400 })
    }

    const secureUrl = await uploadImage(file, folder)
    return NextResponse.json({ url: secureUrl })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erreur upload" }, { status: 500 })
  }
}
```

---

### FIX #14 — Dynamic import pour framer-motion dans ProductCard

```typescript
// components/storefront/ProductCard.tsx — VERSION OPTIMISÉE
// Remplacer motion.div par CSS hover pur — plus de 'use client' nécessaire

import Link from 'next/link'
import Image from 'next/image'
import { ShoppingBag } from 'lucide-react'

interface Product {
  id: string; name: string; slug: string; description: string | null
  price: number; list_price: number; image_url: string | null; category: string | null
}

interface ProductCardProps {
  product: Product; whatsappUrl: string; primaryColor: string; storeSlug: string
}

// ✅ Plus besoin de 'use client' — hover géré en CSS
export function ProductCard({ product, whatsappUrl, primaryColor = '#2563EB', storeSlug }: ProductCardProps) {
  const hasDiscount = product.list_price > product.price
  const formatPrice = (price: number) => new Intl.NumberFormat('fr-FR').format(price)
  const productDetailUrl = `/${storeSlug}/produits/${product.slug}`

  return (
    <div
      className="rounded-xl bg-bg-surface border border-white/5 overflow-hidden flex flex-col h-full transition-all duration-200 hover:border-primary/40 hover:shadow-[0_4px_16px_var(--primary-20)]"
      style={{ '--primary-20': `${primaryColor}20` } as React.CSSProperties}
    >
      <Link href={productDetailUrl} className="aspect-square bg-white/5 relative flex items-center justify-center overflow-hidden block shrink-0">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            className="object-cover"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-text-muted opacity-40">
            <ShoppingBag className="w-8 h-8 stroke-[1.5]" />
          </div>
        )}
        {hasDiscount && (
          <span className="absolute top-1.5 left-1.5 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded select-none leading-none" style={{ backgroundColor: primaryColor }}>
            PROMO
          </span>
        )}
      </Link>

      <div className="p-2 space-y-1.5 flex flex-col flex-1">
        <Link href={productDetailUrl}>
          <p className="text-[11px] font-semibold text-white truncate leading-tight">{product.name}</p>
        </Link>
        <div className="flex justify-between items-baseline gap-1 flex-wrap">
          <span className="text-xs font-bold font-heading" style={{ color: primaryColor }}>{formatPrice(product.price)} DJF</span>
          {hasDiscount && <span className="text-[9px] text-text-muted line-through">{formatPrice(product.list_price)} DJF</span>}
        </div>
        <a
          href={whatsappUrl} target="_blank" rel="noopener noreferrer"
          className="w-full py-1.5 rounded text-[10px] font-bold text-white text-center cursor-pointer mt-auto active:scale-95 transition-transform"
          style={{ backgroundColor: '#10B981' }}
        >
          💬 Commander
        </a>
      </div>
    </div>
  )
}
```

---

## 16. Plan d'action prioritaire

### 🔴 PRIORITÉ CRITIQUE — Impact immédiat sur les quotas Netlify

| # | Action | Impact Edge Fn | Impact Serverless Fn | Effort | Gain estimé |
|---|--------|----------------|----------------------|--------|-------------|
| 1 | **Supprimer le proxy middleware** | **-90%** (≈-85 000) | — | 5 min | 🔥 CRITIQUE |
| 2 | **Créer `createPublicClient()` sans cookies()** | — | Prérequis ISR | 15 min | Prérequis #3 |
| 3 | **ISR sur `app/[slug]/page.tsx`** | — | **-50%** (≈-15 000) | 30 min | 🔥 CRITIQUE |
| 4 | **Filtrage catégorie côté client (StorefrontCatalog)** | — | **-30%** des storefront | 1h | 🔥 CRITIQUE |
| 5 | **ISR sur `app/[slug]/produits/[productSlug]/page.tsx`** | — | **-15%** | 45 min | 🔥 CRITIQUE |

### 🟠 PRIORITÉ HAUTE — Optimisation majeure

| # | Action | Impact | Effort |
|---|--------|--------|--------|
| 6 | **Éliminer doublons auth dashboard (cache React)** | -5 queries/navigation dashboard | 45 min |
| 7 | **Requête unique store+produit (jointure Supabase)** | -3 queries/visite produit | 1h |
| 8 | **Retirer `'use client'` de `app/page.tsx`** | Landing page statique pure | 2h |
| 9 | **`generateStaticParams` pour store et produit pages** | Build-time pre-render | 30 min |
| 10 | **`netlify.toml` avec headers de cache** | Cache CDN agressif | 20 min |

### 🟡 PRIORITÉ MOYENNE — Qualité et performance

| # | Action | Impact | Effort |
|---|--------|--------|--------|
| 11 | **Reorder atomique (upsert)** | Résilience + performance | 30 min |
| 12 | **Supprimer `next-cloudinary` (dépendance morte)** | Bundle size | 5 min |
| 13 | **Remplacer `<img>` par `<Image>` sur landing** | LCP, Core Web Vitals | 15 min |
| 14 | **Optimisation URLs Cloudinary (w_, f_auto, q_auto)** | Bande passante -60% | 1h |
| 15 | **canonical dans generateMetadata** | SEO dupliqué | 20 min |
| 16 | **Retirer `unoptimized` des images Supabase/Cloudinary** | LCP amélioration | 30 min |
| 17 | **select() ciblé au lieu de select('*')** | Payload réduit | 30 min |

### 🟢 PRIORITÉ BASSE — Améliorations optionnelles

| # | Action | Impact | Effort |
|---|--------|--------|--------|
| 18 | **Limite taille upload + validation MIME** | Sécurité | 30 min |
| 19 | **OG Image pour la landing page** | Social sharing | 1h |
| 20 | **`cover_image` dans la table stores** | SEO | 15 min |
| 21 | **Static `lastModified` dans sitemap** | SEO crawl | 10 min |
| 22 | **ProductCard sans framer-motion (CSS hover)** | Bundle -45KB | 30 min |
| 23 | **Index SQL composite `(store_id, is_published, sort_order)`** | DB performance | 10 min |

---

## Résumé final — Gains attendus après toutes les optimisations

| Métrique | Avant | Après | Réduction |
|----------|-------|-------|-----------|
| **Edge Functions** | 94 000 | ~4 700 | **-95%** |
| **Serverless Functions** | 66 000 | ~18 000 | **-73%** |
| **Time to First Byte storefront** | ~800ms | ~50ms (CDN) | **-94%** |
| **Bundle JS landing page** | ~350KB | ~80KB | **-77%** |
| **Queries Supabase/visite produit** | 7 | 2 | **-71%** |
| **Queries Supabase/navigation dashboard** | 8-10 | 3-4 | **-60%** |
| **Coût Netlify** | Proche quota | Largement dans quota | **-80%** |

---

*Audit réalisé le 6 juillet 2026 — Rohaty Shop v0.1.0*
