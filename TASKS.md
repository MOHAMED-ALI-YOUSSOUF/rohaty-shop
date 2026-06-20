# TASKS.md — Rohaty Shop

## Instructions pour l'IDE

```
Lis PROJECT.md, DATABASE.md, UI.md et TASKS.md.
Comprends entièrement le projet.
Exécute uniquement la PHASE en cours (marquée ▶ EN COURS).
Quand une phase est terminée, marque-la ✅ TERMINÉE,
mets à jour ce fichier TASKS.md, et attends mon accord
avant de passer à la phase suivante.
```

---

## Statut global

```
PHASE 1 — Setup & Configuration     ✅ TERMINÉE
PHASE 2 — Authentification          ✅ TERMINÉE
PHASE 3 — Dashboard layout          ✅ TERMINÉE
PHASE 4 — Gestion des produits      ✅ TERMINÉE
PHASE 5 — Boutique & Apparence      ✅ TERMINÉE
PHASE 6 — Vitrine publique          ✅ TERMINÉE
PHASE 7 — Landing page              ✅ TERMINÉE
PHASE 8 — Polish & déploiement      ○ À FAIRE
```

---

## ▶ PHASE 1 — Setup & Configuration

### 1.1 Initialisation Next.js 16

- [ ] `npx create-next-app@latest ./ --typescript --tailwind --eslint --app`
- [ ] Supprimer le contenu par défaut de `app/page.tsx`
- [ ] Configurer `app/layout.tsx` avec les fonts (Space Grotesk + Inter via `next/font/google`)
- [ ] Configurer `tailwind.config.ts` avec les couleurs custom du design system (voir UI.md)
- [ ] Créer `app/globals.css` avec les classes custom (gradient-text, glass, title-underline, whatsapp-pulse — voir UI.md)

### 1.2 Installation des dépendances

```bash
npm install framer-motion lucide-react
npm install @supabase/supabase-js @supabase/ssr
npm install react-hook-form zod @hookform/resolvers
npm install cloudinary next-cloudinary
npm install clsx tailwind-merge class-variance-authority
npm install @radix-ui/react-dialog @radix-ui/react-select @radix-ui/react-tabs @radix-ui/react-label
```

- [ ] Installer toutes les dépendances ci-dessus

### 1.3 Configuration Supabase

- [ ] Créer le projet sur supabase.com
- [ ] Créer `lib/supabase/client.ts` (browser client)
- [ ] Créer `lib/supabase/server.ts` (server client avec cookies)
- [ ] Exécuter le SQL complet de DATABASE.md dans l'éditeur SQL Supabase :
  - [ ] Table `public.users`
  - [ ] Table `public.stores`
  - [ ] Table `public.products`
  - [ ] Activer RLS sur les 3 tables
  - [ ] Créer toutes les policies RLS
  - [ ] Créer les 3 index

### 1.4 Configuration Cloudinary

- [ ] Créer le compte sur cloudinary.com
- [ ] Créer les dossiers dans Cloudinary : `rohaty-shop/stores/logo`, `rohaty-shop/stores/banner`, `rohaty-shop/products`
- [ ] Créer `lib/cloudinary.ts` avec le helper `uploadImage()`
- [ ] Configurer `next.config.ts` avec `remotePatterns` pour `res.cloudinary.com`

### 1.5 Variables d'environnement

- [ ] Créer `.env.local` avec les 5 variables :
  ```
  NEXT_PUBLIC_SUPABASE_URL=
  NEXT_PUBLIC_SUPABASE_ANON_KEY=
  CLOUDINARY_CLOUD_NAME=
  CLOUDINARY_API_KEY=
  CLOUDINARY_API_SECRET=
  NEXT_PUBLIC_APP_URL=http://localhost:3000
  ```
- [ ] Créer `.env.example` (mêmes clés, valeurs vides) pour le repo

### 1.6 Fichiers utilitaires de base

- [ ] Créer `lib/utils.ts` :
  - `cn()` (merge de classes Tailwind)
  - `slugify(text: string): string` (transforme "Sac en Cuir" → "sac-en-cuir")
- [ ] Créer `lib/animations.ts` avec tous les variants Framer Motion (voir UI.md)
- [ ] Créer `lib/whatsapp.ts` avec `buildWhatsAppUrl()`
- [ ] Créer `lib/reserved-slugs.ts` avec la liste et le schema Zod

### 1.7 Middleware de protection

- [ ] Créer `middleware.ts` :
  - Protéger toutes les routes `/dashboard/*`
  - Si pas de session Supabase → redirect vers `/connexion`
  - Laisser passer `/[slug]/*` (vitrine publique, pas de protection)

### 1.8 Vérification Phase 1

- [ ] `npm run dev` démarre sans erreur
- [ ] Les variables d'environnement sont bien lues
- [ ] La connexion Supabase fonctionne (tester avec un appel simple)
- [ ] Les tables existent dans Supabase avec les bonnes columns
- [ ] Les RLS policies sont actives
- [ ] Cloudinary est configuré et accessible

---

## ✅ PHASE 2 — Authentification

### 2.1 Page inscription `/inscription`

- [x] Créer `app/inscription/page.tsx`
- [x] Étape 1 : formulaire nom + email + mot de passe (React Hook Form + Zod)
- [x] Étape 2 : formulaire nom boutique + slug + whatsapp
- [x] Validation slug en temps réel (appel API `check-slug`)
- [x] Validation slugs réservés (lib/reserved-slugs.ts)
- [x] Créer `app/api/stores/check-slug/route.ts`
- [x] `supabase.auth.signUp()` puis insert dans `public.users` et `public.stores`
- [x] Redirect vers `/dashboard` après succès
- [x] Animation progress bar + slide entre étapes

### 2.2 Page connexion `/connexion`

- [x] Créer `app/connexion/page.tsx`
- [x] Formulaire email + mot de passe
- [x] `supabase.auth.signInWithPassword()`
- [x] Redirect vers `/dashboard` après succès
- [x] Lien "Mot de passe oublié ?" (optionnel MVP)

### 2.3 Déconnexion

- [x] Bouton "Se déconnecter" (Logique prête, sera affiché dans la sidebar lors de la Phase 3) → `supabase.auth.signOut()`
- [x] Redirect vers `/connexion`

---

## ✅ PHASE 3 — Dashboard layout

- [x] Créer `app/dashboard/layout.tsx` (protégé par middleware)
- [x] Créer `components/dashboard/Sidebar.tsx`
  - [x] Logo Rohaty Shop
  - [x] Nom de la boutique du commerçant connecté
  - [x] Navigation : Tableau de bord / Mes produits / Ma boutique / Apparence
  - [x] Lien "Voir ma boutique" (shop.rohaty.com/[slug])
  - [x] Bouton Se déconnecter
- [x] Créer `components/dashboard/Header.tsx`
  - [x] Breadcrumb
  - [x] Bouton "Voir ma boutique →"
  - [x] Avatar avec initiales
- [x] Créer `app/dashboard/page.tsx` — Tableau de bord
  - [x] 3 cards (produits / boutique en ligne / lien)
  - [x] Encadré numéro WhatsApp

---

## ✅ PHASE 4 — Gestion des produits

- [x] `app/dashboard/produits/page.tsx` — liste des produits
  - [x] Fetch depuis Supabase (tous les produits du commerçant connecté)
  - [x] Grid 3 colonnes de ProductCard dashboard
  - [x] Filtres Tous / Publiés / Brouillons
  - [x] Empty state
- [x] `app/dashboard/produits/nouveau/page.tsx` — ajouter produit
  - [x] Formulaire complet (voir UI.md)
  - [x] Composant `<ImageUpload>` → Cloudinary `rohaty-shop/products/`
  - [x] Génération automatique du slug depuis le nom
  - [x] Insert dans `public.products`
- [x] `app/dashboard/produits/[id]/page.tsx` — modifier produit
  - [x] Pré-remplir le formulaire avec les données existantes
  - [x] Update dans `public.products`
  - [x] Bouton supprimer avec confirmation (Dialog Radix)

---

## ✅ PHASE 5 — Boutique & Apparence

> Ne pas commencer avant validation de la Phase 4.

- [x] `app/dashboard/boutique/page.tsx` — paramètres boutique
  - Formulaire nom, slogan, whatsapp, slug
  - Validation slug disponible + slugs réservés
  - Update dans `public.stores`
- [x] `app/dashboard/apparence/page.tsx` — thème
  - Upload logo → Cloudinary `rohaty-shop/stores/logo/`
  - Upload bannière → Cloudinary `rohaty-shop/stores/banner/`
  - Color picker couleur principale
  - Aperçu live (useState, pas de fetch)
  - Update dans `public.stores`

---

## ✅ PHASE 6 — Vitrine publique

> Ne pas commencer avant validation de la Phase 5.

- [x] `app/[slug]/page.tsx` — catalogue
  - Fetch boutique par slug + produits publiés (Supabase server component)
  - 404 si boutique introuvable
  - Header vitrine avec logo, nom, filtres catégories, bouton WhatsApp global
  - Grid produits avec `<ProductCard>`
  - Couleur dynamique depuis `store.primary_color` (CSS variable injectée)
- [x] `app/[slug]/produits/[productSlug]/page.tsx` — page produit
  - Fetch produit par slug
  - Layout 2 colonnes desktop / 1 colonne mobile
  - Bouton WhatsApp avec message pré-rempli (`buildWhatsAppUrl()`)
  - Breadcrumb
- [x] Composant `<ProductCard>` (vitrine)
- [x] Composant `<StoreHeader>` (vitrine)

---

## ✅ PHASE 7 — Landing page

> Ne pas commencer avant validation de la Phase 6.

- [x] `app/page.tsx` — landing page complète (voir UI.md)
  - Header sticky blur
  - Section Hero avec stats animées
  - Section "Comment ça marche" (3 étapes)
  - Section Fonctionnalités (6 GlassCards)
  - Section Tarifs (2 plans)
  - Section CTA final
  - Footer
- [x] Toutes les animations Framer Motion (fadeUp scroll, stagger)
- [x] Responsive mobile complet

---

## ○ PHASE 8 — Polish & déploiement

> Ne pas commencer avant validation de la Phase 7.

- [ ] Vérifier le responsive sur mobile (375px), tablet (768px), desktop (1280px)
- [ ] Vérifier la gestion des erreurs Supabase (toast ou message d'erreur)
- [ ] Page 404 personnalisée (`app/not-found.tsx`)
- [ ] Métadonnées SEO de base (`app/layout.tsx` et pages importantes)
- [ ] Configurer `next.config.ts` pour la production
- [ ] Déploiement sur Vercel
  - Ajouter les variables d'environnement dans Vercel
  - Tester le déploiement
- [ ] Tester le flux complet : inscription → ajout produit → vitrine → WhatsApp

---

## Notes de développement

```
- Toujours utiliser les server components Supabase pour les fetches de données
  dans les pages publiques (meilleur SEO + performance)
- Utiliser les client components uniquement pour les interactions (formulaires, upload)
- Le middleware vérifie la session une seule fois par requête
- Ne jamais exposer les clés Cloudinary côté client (passer par une API route)
- Le slug de boutique est immuable une fois créé dans le MVP
  (modification possible en Phase 5 mais avec avertissement)
```
