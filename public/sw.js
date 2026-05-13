// Fire Arena Max — Service Worker v3
// Handles caching, push notifications, background sync

const CACHE_NAME = 'fam-v3';
const STATIC_CACHE = 'fam-static-v3';
const API_URL = self.location.origin;

// Files to cache immediately on install
const PRECACHE = [
  '/',
  '/manifest.json',
  '/favicon.ico',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

// ── Install ────────────────────────────────────────────────────────────────
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(STATIC_CACHE).then(cache => cache.addAll(PRECACHE)).catch(() => {})
  );
  self.skipWaiting();
});

// ── Activate ───────────────────────────────────────────────────────────────
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME && k !== STATIC_CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ── Fetch (cache strategy) ─────────────────────────────────────────────────
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // Skip API calls — always network
  if (url.pathname.startsWith('/api/') || url.hostname !== location.hostname) return;

  // Cache-first for static assets
  if (e.request.destination === 'image' || url.pathname.match(/\.(png|ico|svg|woff2?|ttf|eot)$/i)) {
    e.respondWith(
      caches.match(e.request).then(cached => cached || fetch(e.request).then(res => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
        }
        return res;
      }))
    );
    return;
  }

  // Network-first for HTML/JS — fall back to cache
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).catch(() => caches.match('/') || caches.match(e.request))
    );
    return;
  }
});

// ── Push Notifications ─────────────────────────────────────────────────────
self.addEventListener('push', (e) => {
  let data = {};
  try { data = e.data ? e.data.json() : {}; } catch {}

  const title = data.title || 'Fire Arena Max';
  const options = {
    body: data.body || data.message || 'You have a new notification',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-96.png',
    vibrate: [200, 100, 200],
    data: { url: data.url || '/', notificationId: data.id },
    actions: data.actions || [],
    tag: data.tag || 'fam-notif',
    requireInteraction: data.requireInteraction || false,
  };

  e.waitUntil(self.registration.showNotification(title, options));
});

// ── Notification Click ─────────────────────────────────────────────────────
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const url = e.notification.data?.url || '/';

  if (e.action) {
    // Handle action buttons
    if (e.action === 'view_tournament') {
      e.waitUntil(clients.openWindow('/tournaments'));
      return;
    }
    if (e.action === 'claim_reward') {
      e.waitUntil(clients.openWindow('/daily-rewards'));
      return;
    }
  }

  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(cls => {
      // Focus existing window if open
      for (const client of cls) {
        if (client.url.includes(self.location.origin)) {
          client.focus();
          client.navigate(url);
          return;
        }
      }
      return clients.openWindow(url);
    })
  );
});

// ── Scheduled Notifications (via message) ─────────────────────────────────
self.addEventListener('message', (e) => {
  if (e.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
    return;
  }

  if (e.data?.type === 'SCHEDULE_NOTIFICATION') {
    const { title, body, delay, url, tag } = e.data;
    setTimeout(() => {
      self.registration.showNotification(title, {
        body,
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-96.png',
        data: { url: url || '/' },
        tag: tag || 'fam-scheduled',
        vibrate: [200, 100, 200],
      });
    }, delay || 0);
  }
});
