// Service Worker von Pieks: macht die App installierbar und ohne
// Internet nutzbar. Seite, Skripte und audio/vorhanden.json kommen zuerst
// aus dem Netz, damit Änderungen sofort ankommen; nur wenn das nicht klappt,
// kommt die gespeicherte Kopie. Aufnahmen kommen zuerst aus dem Speicher.
'use strict';

// Liefert alleSaetze(), alleFranzClips(), kennung() und clipDatei(), um alle Aufnahmen zu kennen
importScripts('texte.js', 'fakten.js', 'vokabeln.js', 'franz-texte.js');
// Der Otter darf fehlen oder kaputt sein: Pieks und das Französisch laufen dann wie bisher.
// Erst die Vokabeln, seine Texte bauen beim Laden darauf auf. Liefert INDO_TEXTE.
try {
  importScripts('indo-vokabeln.js', 'indo-texte.js');
} catch (e) {
  // ohne den Otter
}

// Bei neuen Texten genügt es, die «Stand»-Zeile zu ändern: dann holt der neue
// Service Worker die fehlenden Aufnahmen nach, ohne alles neu zu laden.
// Wurden bestehende Aufnahmen neu gesprochen (--force, gleiche Dateinamen, z.B.
// andere Stimme), stattdessen CACHE hochzählen: Aufnahmen kommen zuerst aus dem
// Speicher, ohne neuen CACHE spielten Geräte für immer die alte Fassung. Das wirft
// alle vorgeladenen Aufnahmen weg; der nächste Start holt sie neu.
// Stand: Indonesisch dazu, 2400 Aufnahmen (Lucy Fennek, Lucie und Kak Ceria)
const CACHE = 'pieks-v1';
// Die Seite und alles, was sie lädt, in der Reihenfolge von index.html, ohne den Otter (KURS_FILES). addAll
// ist ganz oder gar nicht: Fehlt eine dieser Dateien auf dem Server, scheitert die Installation, darum steht
// hier nur, was es gibt.
const FILES = [
  './',
  'stil.css',
  'hoernchen.css',
  'uebungen.css',
  'franz.css',
  'aufgaben.js',
  'texte.js',
  'fakten.js',
  'vokabeln.js',
  'franz-texte.js',
  'lernen.js',
  'grafik.js',
  'hoernchen.js',
  'uebungen.js',
  'franz.js',
  'app.js',
  'manifest.webmanifest',
  'icon.svg',
  'favicon.ico',
  'apple-touch-icon.png',
  'icon-192.png',
  'icon-512.png',
  'icon-maskable-512.png',
  'audio/vorhanden.json',
];
// Der Otter und sein Kurs, auch in der Reihenfolge von index.html. Sie dürfen fehlen wie oben beim
// importScripts: Jede kommt einzeln in den Speicher, und fehlt eine (oder ist sie nicht mit hochgeladen),
// installiert sich der Service Worker trotzdem. Die Seite lässt das Indonesisch dann weg
// (KURSE.indo.geladen in app.js); Pieks und das Französisch laufen wie bisher, auch ohne Netz.
const KURS_FILES = ['otter.css', 'indo-vokabeln.js', 'indo-texte.js', 'otter.js', 'indo.js'];
// Vorab nur, was oft gebraucht wird, das Wichtigste zuerst: Pieks, die Besucher, das
// Hörnchen und der Otter, dann die Vokabeln, erst die französischen (Einträge, Formen,
// langsame Fassungen), dann die indonesischen. Fakten kommen beim ersten Hören in den
// Speicher. Die Gruppen wie REIHE in make-audio.mjs, ohne die Fakten.
const AUDIO = (() => {
  const reihe = ['pieks', 'besuch', 'hoernchen', 'otter', 'wort', 'form', 'langsam', 'iwort', 'iform', 'ilangsam'];
  // Die Aufnahmen des Otters nur, wenn indo-texte.js ganz geladen ist: Erst dann gibt es
  // INDO_TEXTE (eine function gäbe es auch nach einem Abbruch), sonst wirft schon das Lesen
  let otter = [];
  try {
    otter = INDO_TEXTE.alleIndoClips().map(c => ({ gruppe: c.gruppe, datei: clipDatei(c) }));
  } catch (e) {
    otter = [];
  }
  const clips = alleSaetze().filter(x => x.gruppe !== 'fakt').map(x => ({ gruppe: x.gruppe, datei: kennung(x.s) }))
    .concat(alleFranzClips().map(c => ({ gruppe: c.gruppe, datei: clipDatei(c) })), otter);
  clips.sort((a, b) => reihe.indexOf(a.gruppe) - reihe.indexOf(b.gruppe));
  return [...new Set(clips.map(x => 'audio/' + x.datei + '.mp3'))];
})();

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE)
    .then(c => c.addAll(FILES).then(() => Promise.all(KURS_FILES.map(f => c.add(f).catch(() => { /* fehlt: ohne den Otter */ })))))
    .then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  // Nur eigene, ältere Speicher aufräumen; die anderen Apps auf y7.ai nicht anfassen
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith('pieks-') && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Die App bittet nach dem Start darum: alle wichtigen Aufnahmen holen, die noch
// fehlen. Scheitert ein Abruf, fehlt nur diese Aufnahme (der nächste Start oder das
// erste Hören holt sie), und nach einer Pause geht es weiter. Erst fünf Fehlschläge
// in Folge heissen «kein Netz»: dann still Schluss bis zum nächsten Start.
let laedt = null;
async function audioVorladen() {
  const c = await caches.open(CACHE);
  const ort = f => new URL(f, self.registration.scope).href;
  // Geholt wird nur, was es laut audio/vorhanden.json gibt. Ein 404 landet nicht im
  // Speicher: Ohne die Liste würde jeder Start wieder nach jeder Aufnahme fragen, die
  // noch nicht gesprochen ist. Zuerst das Netz, sonst die gespeicherte Liste.
  let gibt;
  try {
    const frisch = await fetch(ort('audio/vorhanden.json')).then(r => (r.ok ? r : null), () => null);
    const antwort = frisch || await c.match(ort('audio/vorhanden.json'));
    const liste = antwort ? await antwort.json() : null;
    if (!Array.isArray(liste)) return;
    gibt = new Set(liste);
  } catch (e) {
    return;
  }
  const da = new Set((await c.keys()).map(r => r.url));
  // Die Pausen wachsen (1, 2, 4, 8 s), so übersteht das Vorladen auch einen kurzen
  // Ausfall, etwa beim Wechsel des WLANs. Ein 404 zählt nicht: Da ist das Netz ja da.
  let wackler = 0;
  for (const f of AUDIO) {
    // 'audio/1a2b3c4d.mp3' → '1a2b3c4d', wie es in der Liste steht
    if (!gibt.has(f.slice(6, -4))) continue;
    const url = ort(f);
    if (da.has(url)) continue;
    try {
      const r = await fetch(url);
      if (r.ok) await c.put(url, r);
      wackler = 0;
    } catch (e) {
      if (++wackler >= 5) return;
      await new Promise(weiter => setTimeout(weiter, 1000 * 2 ** (wackler - 1)));
    }
  }
}
self.addEventListener('message', e => {
  if (e.data !== 'vorladen') return;
  if (!laedt) laedt = audioVorladen().finally(() => { laedt = null; });
  e.waitUntil(laedt);
});

self.addEventListener('fetch', e => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;
  // Eine Aufnahme ändert unter ihrem Namen nie den Inhalt (er ist ein Prüfwert über den
  // Text): zuerst der Speicher. Sonst wartete auf langsamem Netz jede vorgeladene
  // Aufnahme auf den Server, und die App gäbe sie nach 1.5 s als stumm auf. Die App holt
  // ohne Range-Kopfzeile, darum passt die ganze gespeicherte Antwort immer.
  if (url.pathname.includes('/audio/') && url.pathname.endsWith('.mp3')) {
    e.respondWith(
      caches.open(CACHE)
        .then(c => c.match(req, { ignoreSearch: true }))
        .catch(() => undefined)
        .then(hit => hit || fetch(req).then(res => {
          if (res.ok) {
            const copy = res.clone();
            e.waitUntil(caches.open(CACHE).then(c => c.put(req, copy)));
          }
          return res;
        }, () => new Response('', { status: 504 })))   // nicht gespeichert, kein Netz: fehlt (siehe unten)
    );
    return;
  }
  e.respondWith(
    fetch(req)
      .then(res => {
        if (res.ok) {
          const copy = res.clone();
          e.waitUntil(caches.open(CACHE).then(c => c.put(req, copy)));
        }
        return res;
      })
      .catch(() => caches.match(req, { ignoreSearch: true }).then(hit => {
        if (hit) return hit;
        // Was unter audio/ nicht gespeichert ist, fehlt einfach (504). Käme hier die
        // gespeicherte Seite zurück, hielte die App sie für Ton oder für die Liste.
        if (url.pathname.includes('/audio/')) return new Response('', { status: 504 });
        return caches.match('./');
      }))
  );
});
