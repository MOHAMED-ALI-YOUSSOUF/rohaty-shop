# DATABASE.md — Rohaty Shop

## Plateforme

Supabase (PostgreSQL hébergé)
Auth intégrée via `auth.users`
RLS (Row Level Security) activé sur toutes les tables

---

## Tables

### `public.users`

Complète le profil Supabase Auth avec le nom complet.
Créée automatiquement après inscription via trigger ou insert manuel.

```sql
create table public.users (
  id         uuid primary key references auth.users(id) on delete cascade,
  full_name  text not null,
  created_at timestamptz default now()
);
```

---

### `public.stores`

Une boutique par commerçant (relation 1-1 avec users).

```sql
create table public.stores (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid references auth.users(id) on delete cascade,
  name          text not null,
  slug          text unique not null,
  slogan        text,
  whatsapp      text not null,
  logo_url      text,
  banner_url    text,
  primary_color text default '#2563EB',
  created_at    timestamptz default now()
);
```

Colonnes importantes :
- `slug` — identifiant unique de la boutique dans l'URL (`shop.rohaty.com/[slug]`)
- `whatsapp` — numéro avec indicatif, ex: `+25377196132`
- `primary_color` — couleur hex choisie par le commerçant, appliquée sur la vitrine
- `logo_url` / `banner_url` — URLs Cloudinary

---

### `public.products`

Produits d'une boutique. Un produit appartient à une seule boutique.

```sql
create table public.products (
  id           uuid primary key default gen_random_uuid(),
  store_id     uuid references public.stores(id) on delete cascade,
  name         text not null,
  slug         text not null,
  description  text,
  price        numeric not null,
  list_price   numeric not null,
  image_url    text,
  category     text,
  is_published boolean default true,
  created_at   timestamptz default now(),

  unique(store_id, slug)
);
```

Colonnes importantes :
- `slug` — généré depuis le nom (`sac-en-cuir-marron`), unique par boutique
- `category` — texte libre (pas de table categories séparée pour le MVP)
- `is_published` — si false, le produit n'est pas visible sur la vitrine publique
- `image_url` — URL Cloudinary

---

## Relations

```
auth.users (Supabase Auth)
    │
    ├── 1:1 → public.users       (profil nom)
    │
    └── 1:1 → public.stores      (owner_id)
                  │
                  └── 1:N → public.products (store_id)
```

---

## RLS — Row Level Security

```sql
-- Activer RLS sur toutes les tables
alter table public.users    enable row level security;
alter table public.stores   enable row level security;
alter table public.products enable row level security;


-- ─── USERS ────────────────────────────────────────────────────────

-- Un utilisateur ne voit et ne modifie que son propre profil
create policy "users: lecture personnelle"
  on public.users for select
  using (auth.uid() = id);

create policy "users: modification personnelle"
  on public.users for update
  using (auth.uid() = id);


-- ─── STORES ───────────────────────────────────────────────────────

-- N'importe qui peut lire les boutiques (pour afficher la vitrine publique)
create policy "stores: lecture publique"
  on public.stores for select
  using (true);

-- Seul le propriétaire peut créer, modifier, supprimer sa boutique
create policy "stores: insert propriétaire"
  on public.stores for insert
  with check (auth.uid() = owner_id);

create policy "stores: update propriétaire"
  on public.stores for update
  using (auth.uid() = owner_id);

create policy "stores: delete propriétaire"
  on public.stores for delete
  using (auth.uid() = owner_id);


-- ─── PRODUCTS ─────────────────────────────────────────────────────

-- N'importe qui peut lire les produits publiés (vitrine publique)
create policy "products: lecture publique si publié"
  on public.products for select
  using (is_published = true);

-- Le commerçant peut lire TOUS ses produits (y compris brouillons)
create policy "products: lecture propriétaire"
  on public.products for select
  using (
    auth.uid() = (
      select owner_id from public.stores where id = store_id
    )
  );

-- Le commerçant peut insérer des produits dans SA boutique uniquement
create policy "products: insert propriétaire"
  on public.products for insert
  with check (
    auth.uid() = (
      select owner_id from public.stores where id = store_id
    )
  );

-- Le commerçant peut modifier ses propres produits
create policy "products: update propriétaire"
  on public.products for update
  using (
    auth.uid() = (
      select owner_id from public.stores where id = store_id
    )
  );

-- Le commerçant peut supprimer ses propres produits
create policy "products: delete propriétaire"
  on public.products for delete
  using (
    auth.uid() = (
      select owner_id from public.stores where id = store_id
    )
  );
```

---

## Index recommandés

```sql
-- Recherche rapide par slug (très fréquent : chaque visite de vitrine)
create index idx_stores_slug    on public.stores(slug);

-- Recherche des produits d'une boutique
create index idx_products_store on public.products(store_id);

-- Recherche par slug produit dans une boutique
create index idx_products_slug  on public.products(store_id, slug);
```

---

## Initialisation Supabase client

```typescript
// lib/supabase/client.ts  (côté browser)
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// lib/supabase/server.ts  (côté server components / route handlers)
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createClient() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll()        { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )
}
```

---

## Exemples de requêtes courantes

```typescript
// Charger la boutique par slug (vitrine publique)
const { data: store } = await supabase
  .from('stores')
  .select('*')
  .eq('slug', slug)
  .single()

// Charger les produits publiés d'une boutique
const { data: products } = await supabase
  .from('products')
  .select('*')
  .eq('store_id', store.id)
  .eq('is_published', true)
  .order('created_at', { ascending: false })

// Charger un produit par slug
const { data: product } = await supabase
  .from('products')
  .select('*, stores(whatsapp, name, primary_color)')
  .eq('store_id', storeId)
  .eq('slug', productSlug)
  .single()

// Charger la boutique du commerçant connecté
const { data: { user } } = await supabase.auth.getUser()
const { data: store } = await supabase
  .from('stores')
  .select('*')
  .eq('owner_id', user.id)
  .single()

// Vérifier si un slug est disponible
const { data } = await supabase
  .from('stores')
  .select('id')
  .eq('slug', slug)
  .maybeSingle()
const isAvailable = data === null
```
