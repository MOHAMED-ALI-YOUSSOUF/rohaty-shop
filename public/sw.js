// sw.js — Rohaty Shop Service Worker
const CACHE_VERSION = 'v1'
const SHELL_CACHE = `rohaty-shell-${CACHE_VERSION}`
const IMAGE_CACHE = `rohaty-images-${CACHE_VERSION}`
const API_CACHE = `rohaty-api-${CACHE_VERSION}`

// App shell assets to pre-cache (static resources)
const SHELL_ASSETS = [
  '/',
  '/manifest.json',
  '/logo.png',
  '/hero-mobile.jpg',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
]

// ─── Install ────────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => {
      return cache.addAll(SHELL_ASSETS).catch((err) => {
        console.warn('[SW] Pre-cache failed for some assets:', err)
      })
    })
  )
  // Activate immediately without waiting for old SW to finish
  self.skipWaiting()
})

// ─── Activate ───────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => {
            // Delete old caches that don't match current version
            return (
              key.startsWith('rohaty-') &&
              key !== SHELL_CACHE &&
              key !== IMAGE_CACHE &&
              key !== API_CACHE
            )
          })
          .map((key) => {
            console.log('[SW] Deleting old cache:', key)
            return caches.delete(key)
          })
      )
    })
  )
  // Take control of all clients immediately
  self.clients.claim()
})

// ─── Fetch ──────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET and chrome-extension requests
  if (request.method !== 'GET') return
  if (!url.protocol.startsWith('http')) return

  // 1. Supabase API calls → network-first (always get fresh data)
  if (url.hostname.includes('supabase.co')) {
    event.respondWith(networkFirst(request, API_CACHE, 60))
    return
  }

  // 2. Cloudinary images → cache-first (images rarely change)
  if (url.hostname === 'res.cloudinary.com') {
    event.respondWith(cacheFirst(request, IMAGE_CACHE, 7 * 24 * 60 * 60))
    return
  }

  // 3. Next.js _next/static assets → cache-first (hashed filenames)
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(cacheFirst(request, SHELL_CACHE, 365 * 24 * 60 * 60))
    return
  }

  // 4. Next.js _next/image → cache-first
  if (url.pathname.startsWith('/_next/image')) {
    event.respondWith(cacheFirst(request, IMAGE_CACHE, 7 * 24 * 60 * 60))
    return
  }

  // 5. API routes → network-first (don't cache mutations)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request, API_CACHE, 10))
    return
  }

  // 6. Navigation requests (HTML pages) → network-first, fallback to cache
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful page responses
          if (response.ok) {
            const clone = response.clone()
            caches.open(SHELL_CACHE).then((cache) => cache.put(request, clone))
          }
          return response
        })
        .catch(() => {
          // Offline fallback: try cache, else offline page
          return caches.match(request).then(
            (cached) =>
              cached ||
              caches.match('/') ||
              new Response(
                `<!DOCTYPE html>
                <html lang="fr">
                  <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1">
                    <title>Hors ligne — Rohaty Shop</title>
                    <style>
                      * { box-sizing: border-box; margin: 0; padding: 0; }
                      body {
                        font-family: system-ui, sans-serif;
                        background: #0F172A;
                        color: white;
                        min-height: 100vh;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        gap: 1rem;
                        padding: 2rem;
                        text-align: center;
                      }
                      .icon { font-size: 4rem; margin-bottom: 0.5rem; }
                      h1 { font-size: 1.5rem; font-weight: 700; }
                      p { color: #94a3b8; font-size: 0.95rem; max-width: 320px; }
                      button {
                        margin-top: 1rem;
                        background: #2563EB;
                        color: white;
                        border: none;
                        padding: 0.75rem 1.5rem;
                        border-radius: 0.5rem;
                        font-size: 0.9rem;
                        font-weight: 600;
                        cursor: pointer;
                      }
                    </style>
                  </head>
                  <body>
                    <div class="icon">📶</div>
                    <h1>Vous êtes hors ligne</h1>
                    <p>Vérifiez votre connexion internet pour accéder à Rohaty Shop.</p>
                    <button onclick="location.reload()">Réessayer</button>
                  </body>
                </html>`,
                { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
              )
          )
        })
    )
    return
  }

  // 7. Everything else → stale-while-revalidate
  event.respondWith(staleWhileRevalidate(request, SHELL_CACHE))
})

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Network first, fallback to cache */
async function networkFirst(request, cacheName, maxAgeSeconds) {
  try {
    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName)
      cache.put(request, networkResponse.clone())
    }
    return networkResponse
  } catch {
    const cached = await caches.match(request)
    if (cached) return cached
    throw new Error('Network and cache both failed')
  }
}

/** Cache first, fallback to network then cache the result */
async function cacheFirst(request, cacheName, maxAgeSeconds) {
  const cached = await caches.match(request)
  if (cached) return cached

  const networkResponse = await fetch(request)
  if (networkResponse.ok) {
    const cache = await caches.open(cacheName)
    cache.put(request, networkResponse.clone())
  }
  return networkResponse
}

/** Serve from cache immediately, update cache in background */
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(request)

  const networkPromise = fetch(request).then((response) => {
    if (response.ok) cache.put(request, response.clone())
    return response
  })

  return cached || networkPromise
}
