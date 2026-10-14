/* J.B.C Crome — service worker (cache + rappels de convoi) */
const CACHE = 'jbc-v1';
const EVENTS_URL = 'https://raw.githubusercontent.com/nosix-dev/J.B.C-Crome/main/events.json'; // ou ton /api/events
const LEAD_MINUTES = 60; // rappel envoyé 1 h avant le départ
const PRECACHE = ['/', '/index.html', '/LogoV3.png', '/chrome-fx.css', '/chrome-fx.js', '/pwa.js', '/equipe.js'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => Promise.all(PRECACHE.map(u => c.add(u).catch(() => {}))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Pages et données : réseau d'abord ; fichiers statiques : cache d'abord
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return; // events.json distant, Discord, etc. : pas touchés

  const networkFirst = req.mode === 'navigate' || url.pathname.endsWith('.json') || url.pathname.startsWith('/api/');
  if (networkFirst) {
    e.respondWith(
      fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy));
        return res;
      }).catch(() => caches.match(req).then(r => r || caches.match('/index.html')))
    );
    return;
  }
  e.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    }))
  );
});

/* ---------- Rappels de convoi ---------- */
function parseEvents(data) {
  const list = Array.isArray(data) ? data : (data.events || []);
  return list.map((e, i) => {
    const raw = e.start || e.datetime || (e.date && e.time ? `${e.date}T${e.time}` : e.date);
    return { id: e.id ?? i, title: e.title || e.titre || e.name || 'Convoi', start: new Date(raw) };
  }).filter(e => !isNaN(e.start));
}

async function notifyUpcoming() {
  try {
    const res = await fetch(EVENTS_URL, { cache: 'no-store' });
    const events = parseEvents(await res.json());
    const now = Date.now();
    for (const ev of events) {
      const diff = ev.start.getTime() - now;
      if (diff > 0 && diff <= LEAD_MINUTES * 60000) {
        await self.registration.showNotification('🚛 Convoi bientôt : ' + ev.title, {
          body: 'Départ à ' + ev.start.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) + '. Prépare ton camion !',
          icon: '/LogoV3.png', badge: '/LogoV3.png',
          tag: 'convoi-' + ev.id, // même tag = pas de doublon
          data: { url: '/calendrier.html' }
        });
      }
    }
  } catch (e) { /* hors-ligne : on réessaiera */ }
}

// Chrome Android (PWA installée) : vérification périodique en arrière-plan
self.addEventListener('periodicsync', e => {
  if (e.tag === 'jbc-events') e.waitUntil(notifyUpcoming());
});

// Demande de la page ouverte
self.addEventListener('message', e => {
  if (e.data === 'check-events') e.waitUntil(notifyUpcoming());
});

// Web Push (si ton bot envoie des push plus tard)
self.addEventListener('push', e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (_) {}
  e.waitUntil(self.registration.showNotification(d.title || '🚛 J.B.C Crome', {
    body: d.body || 'Nouveau convoi au calendrier.',
    icon: '/LogoV3.png', badge: '/LogoV3.png',
    tag: d.tag || 'jbc-push', data: { url: d.url || '/calendrier.html' }
  }));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const target = (e.notification.data && e.notification.data.url) || '/calendrier.html';
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const c of list) { if ('focus' in c) { c.navigate(target); return c.focus(); } }
      return self.clients.openWindow(target);
    })
  );
});
