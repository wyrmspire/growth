/**
 * sw.js — GrowthOps OS Service Worker
 * INFRA-2: Offline app-shell caching
 *
 * Strategy: Cache-first for app shell assets (HTML, CSS, JS, fonts).
 * The goal is to let the UI load instantly from cache, then update in the
 * background. API/mock-engine calls are never cached (network-only).
 *
 * Phase: P10 partial (production hardening foundation).
 * Wire-up: registered in src/main.ts — if this file is absent, the
 *          register() call silently fails; the app continues normally.
 */

const CACHE_NAME = 'growthops-shell-v1';

/**
 * App-shell assets to pre-cache on install.
 * Vite hashes JS/CSS filenames, so we only pre-cache the entry HTML.
 * The JS/CSS bundles are cached dynamically on first request.
 */
const PRECACHE_URLS = ['/'];

// ── Install ──────────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  // Skip waiting so this SW activates immediately on first install
  self.skipWaiting();
});

// ── Activate ─────────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  // Claim clients so previously open tabs use this SW immediately
  self.clients.claim();
});

// ── Fetch ─────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only intercept same-origin GET requests
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  // Skip non-navigational API/data calls (future Supabase, etc.)
  if (url.pathname.startsWith('/api/')) return;

  // Stale-while-revalidate for JS/CSS/font assets (Vite hashed names)
  if (
    url.pathname.match(/\.(js|css|woff2?|ttf|eot|svg|png|webp|ico)$/)
  ) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) =>
        cache.match(request).then((cached) => {
          const networkFetch = fetch(request).then((response) => {
            if (response.ok) cache.put(request, response.clone());
            return response;
          });
          // Return cached immediately, refresh in background
          return cached || networkFetch;
        })
      )
    );
    return;
  }

  // Navigation requests: network-first with cache fallback (for offline)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            caches.open(CACHE_NAME).then((cache) => cache.put(request, response.clone()));
          }
          return response;
        })
        .catch(() => caches.match('/'))
    );
  }
});
