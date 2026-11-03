// scripts/inject-precache.js fills in these two values in the built copy (dist/sw.js).
const BUILD_VERSION = 'dev';
const PRECACHE_URLS = [];

const PRECACHE = `vitrine-precache-${BUILD_VERSION}`;
const RUNTIME = `vitrine-runtime-${BUILD_VERSION}`;
const OFFLINE_URL = '/offline.html';
const NAVIGATION_TIMEOUT_MS = 3000;

// Hosts with clean URLs can redirect, and browsers refuse redirected responses for page loads.
async function withoutRedirect(response) {
  if (!response.redirected) return response;
  const body = await response.blob();
  return new Response(body, { status: response.status, statusText: response.statusText, headers: response.headers });
}

async function precache() {
  const cache = await caches.open(PRECACHE);

  await Promise.all(
    PRECACHE_URLS.map(async (url) => {
      const response = await fetch(url, { cache: 'reload' });
      if (!response.ok) throw new Error(`Could not precache ${url}: ${response.status}`);
      await cache.put(url, await withoutRedirect(response));
    }),
  );
}

async function removeOldCaches() {
  const names = await caches.keys();
  await Promise.all(
    names
      .filter((name) => name.startsWith('vitrine-') && name !== PRECACHE && name !== RUNTIME)
      .map((name) => caches.delete(name)),
  );
}

function fetchWithTimeout(request, timeout) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Network timeout')), timeout);
    fetch(request)
      .then(resolve, reject)
      .finally(() => clearTimeout(timer));
  });
}

// Pages: network first so updates arrive quickly, then the saved page, then the offline page.
async function handleNavigation(request) {
  try {
    return await fetchWithTimeout(request, NAVIGATION_TIMEOUT_MS);
  } catch {
    const cache = await caches.open(PRECACHE);
    const { pathname } = new URL(request.url);
    const path = pathname.length > 1 ? pathname.replace(/\/$/, '') : pathname;
    return (await cache.match(path)) ?? (await cache.match(OFFLINE_URL)) ?? Response.error();
  }
}

// Bundles, fonts and icons: cache first. Their names change whenever their content changes.
async function handleAsset(request) {
  const cached = await caches.match(request);
  if (cached !== undefined) return cached;

  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(RUNTIME);
    await cache.put(request, response.clone());
  }
  return response;
}

self.addEventListener('install', (event) => {
  event.waitUntil(precache());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(removeOldCaches().then(() => self.clients.claim()));
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;

  event.respondWith(request.mode === 'navigate' ? handleNavigation(request) : handleAsset(request));
});
