// Service Worker der Zahlenpyramiden: macht die App installierbar und
// ohne Internet spielbar. Immer zuerst das Netz, damit Änderungen sofort
// ankommen; nur wenn das nicht klappt, kommt die gespeicherte Kopie.
'use strict';

// Liefern alleAufnahmen() und uhrAufnahmen(), um alle Aufnahmen zu kennen (Capy, das Lama, die Uhr)
importScripts('texte.js', 'russisch-texte.js', 'uhr-texte.js');

// Bei neuen Texten genügt es, die «Stand»-Zeile zu ändern: dann holt der neue
// Service Worker die fehlenden Aufnahmen nach, ohne alles neu zu laden.
// Wurden bestehende Aufnahmen neu gesprochen (gleiche Dateinamen, z.B. andere
// Stimme), stattdessen CACHE hochzählen, damit alte Aufnahmen verschwinden.
// Stand: Ton wacht beim Tippen wieder auf, Lama-Blase bleibt nicht stehen
const CACHE = 'capy-v1';
const FILES = [
  './',
  'texte.js',
  'russisch-texte.js',
  'russisch.js',
  'russisch.css',
  'uhr-texte.js',
  'uhr.js',
  'uhr.css',
  'manifest.webmanifest',
  'favicon.svg',
  'apple-touch-icon.png',
  'icon-192.png',
  'icon-512.png',
  'icon-maskable-512.png',
];
const AUDIO = [...new Set(alleAufnahmen().concat(uhrAufnahmen()).map(x => 'audio/' + x.datei + '.mp3'))];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  // Nur eigene, ältere Speicher aufräumen (auch die von früher unter /pyr/);
  // die anderen Apps auf y7.ai nicht anfassen
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => /^(capy|pyr)-/.test(k) && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Die App bittet nach dem Start und dann jede Dreiviertelminute darum: Aufnahmen holen,
// die noch fehlen, jeweils höchstens 25 Sekunden lang. Safari mag keine minutenlangen
// Aufträge an den Service Worker; so ist nach einer Weile trotzdem alles da.
// Ohne Netz bricht es still ab und versucht es beim nächsten Mal wieder.
let laedt = null;
async function audioVorladen() {
  const c = await caches.open(CACHE);
  const da = new Set((await c.keys()).map(r => r.url));
  const schluss = Date.now() + 25000;
  for (const f of AUDIO) {
    const url = new URL(f, self.registration.scope).href;
    if (da.has(url)) continue;
    if (Date.now() > schluss) return;
    try {
      const r = await fetch(url);
      if (r.ok) await c.put(url, r);
    } catch (e) {
      return;
    }
  }
}
// Ohne waitUntil: Ein lange offenes Ereignis kann in Safari die Anfragen der App aufhalten
// (dann schweigen Capy und das Lama). Wird der Service Worker dazwischen beendet, macht
// die nächste Bitte einfach weiter.
self.addEventListener('message', e => {
  if (e.data !== 'vorladen') return;
  if (!laedt) laedt = audioVorladen().catch(() => {}).finally(() => { laedt = null; });
});

// waitUntil wird gleich beim Ereignis aufgerufen, nicht erst später in einem then().
self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;
  // Aufnahmen ändern sich nie (der Name ist ein Prüfwert über den Text): zuerst aus dem Speicher.
  // Fehlt eine und klappt das Netz nicht, gibt es einen Fehler, nie die Startseite statt Ton.
  if (url.pathname.includes('/audio/')) {
    const antwort = caches.match(req, { ignoreSearch: true })
      .then(hit => (hit ? { res: hit } : fetch(req).then(res => ({ res, kopie: res.ok ? res.clone() : null }))));
    e.respondWith(antwort.then(x => x.res));
    e.waitUntil(antwort.then(x => x.kopie && caches.open(CACHE).then(c => c.put(req, x.kopie))).catch(() => {}));
    return;
  }
  // Alles andere: zuerst das Netz, damit Änderungen sofort ankommen; ohne Netz die gespeicherte Kopie
  const netz = fetch(req).then(res => ({ res, kopie: res.ok ? res.clone() : null }));
  e.respondWith(netz.then(x => x.res).catch(() => caches.match(req, { ignoreSearch: true })
    .then(hit => hit || (req.mode === 'navigate' ? caches.match('./') : Response.error()))));
  e.waitUntil(netz.then(x => x.kopie && caches.open(CACHE).then(c => c.put(req, x.kopie))).catch(() => {}));
});
