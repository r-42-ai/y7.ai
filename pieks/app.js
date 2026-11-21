'use strict';

/* =====================================================================
   MATHE-IGEL: Ablauf der App
   Aufgaben kommen aus aufgaben.js, alles Gesprochene aus texte.js und
   fakten.js, die Zeichnungen aus grafik.js. Die Sprachkurse (das
   Französisch mit dem Hörnchen, das Indonesisch mit dem Otter) stecken
   in franz.js, indo.js und ihren Nachbarn;
   hier sind nur die Stellen, an denen die Fächer sich treffen:
   Bildschirme, Kopfzeile, Kasse, Fenster. Wer da ist und welche Kurse es
   gibt, sagen FIGUREN und KURSE.
   ===================================================================== */

const $ = id => document.getElementById(id);
const SVGNS = 'http://www.w3.org/2000/svg';
const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const pause = ms => new Promise(res => setTimeout(res, ms));
const esc = s => String(s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
const zahlText = x => String(Math.round(x * 1000) / 1000);
const STUFEN = { easy: 'Einfach', medium: 'Mittel', hard: 'Schwer' };
const STUFEN_REIHE = ['easy', 'medium', 'hard'];
const THEMEN = {
  brueche: { name: 'Brüche', icon: 't-brueche', info: '+, −, ·, : und Textaufgaben' },
  volumen: { name: 'Volumen', icon: 't-volumen', info: 'ml, cl, dl, l und hl' },
  dreisatz: { name: 'Dreisätze', icon: 't-dreisatz', info: 'direkt und umgekehrt' },
  mix: { name: 'Wald-Mix', icon: 't-mix', info: 'alles gemischt' },
};
/* =====================================================================
   FIGUREN UND KURSE
   Wer neben Pieks unterrichtet und welche Sprachkurse es gibt. Was hier
   steht, braucht die App auch ohne die Dateien eines Kurses (Speicher,
   Statistik, Erfolge, Lichtung); alles andere weiss der Kurs selbst
   (KURS_FRANZ in franz.js). Namen aus den Dateien eines Kurses stehen
   nur in Funktionen: Fehlt eine Datei, wird hier nichts gelesen.
   ===================================================================== */
// Die Figuren. klasse: am <svg>; an: was sie trägt (im Stand); blase: die Klasse ihrer Sprechblase;
// abzeichen: ihr Kopf in der Ecke der Blase; held: ihr Platz auf der Lichtung; kurs: was sie unterrichtet;
// item: wie ein Teil der Garderobe bei ihr zurechtgerückt wird (ITEM_HOERNCHEN …).
const FIGUREN = {
  p: { klasse: 'pieks', an: 'an', blase: 'von-pieks', abzeichen: 'i-pieks-kopf', held: 'heldPieks',
    name: () => 'Pieks', svg: () => pieksSVG() },
  h: { kurs: 'fr', klasse: 'hoernchen', an: 'anH', blase: 'von-hoernchen', abzeichen: 't-franz', held: 'heldHoernchen',
    name: () => HOERNCHEN.name, svg: () => hoernchenSVG(), item: id => ITEM_HOERNCHEN[id] },
  // Der Otter steht links von Pieks (index.html), sie rechts
  o: { kurs: 'indo', klasse: 'otter', an: 'anO', blase: 'von-otter', abzeichen: 't-indo', held: 'heldOtter',
    name: () => OTTER.name, svg: () => otterSVG(), item: id => ITEM_OTTER[id] },
};
// Die Kurse, in ihrer Reihenfolge (Lichtung, Album, Eltern, Begrüssung). key: der Kurs in franz.js (Menü,
// data-kurs, Zurücksetzen); lehrer: wer ihn gibt (FIGUREN); stats: sein Anteil in der Tages-Statistik;
// erfolge: die Vorsilbe seiner Erfolge; tab: sein Reiter im Album; farbe, segment: sein Teil im Diagramm
// der Eltern; karte: seine Karte auf der Lichtung.
// Einen Kurs gibt es nur, wenn alle seine Dateien ganz geladen sind (geladen). Bricht eine beim Laden ab,
// bleiben ihre const-Namen unbelegt und werfen schon beim Lesen: darum try. Geprüft wird je Datei ihr
// letzter const (für Französisch langsamGibt in vokabeln.js, H_LEBHAFT in franz-texte.js, FRANZ_SYMBOLE in
// hoernchen.js), nie eine function: die gibt es auch nach einem Abbruch. Jede Datei des Kurses gehört
// hinein, auch die seiner Figur: sprite() und svg() lesen aus ihr.
// aus: sein Bild oder sein Einrichten ist beim Start gescheitert (siehe ganz unten); die anderen Kurse bleiben.
const KURSE = {
  fr: {
    id: 'fr', key: 'franz', lehrer: 'h', stats: 'fr', erfolge: 'fr_', tab: 'woerter', name: 'Französisch', icon: 't-franz',
    farbe: 'var(--f)', segment: 'fr', karte: 'franzKarte', aus: false,
    geladen: () => Franz && Lernen && Uebungen && VOKABELN && langsamGibt && HTEXTE && H_LEBHAFT && HOERNCHEN_DEFS && FRANZ_SYMBOLE,
    modul: () => Franz,
    sprite: () => HOERNCHEN_DEFS + FRANZ_SYMBOLE,
  },
  // Indonesisch mit dem Otter. Jede seiner Dateien hat ein Global, das zugleich ihr letzter const ist: VOK_INDO
  // (indo-vokabeln.js), INDO_TEXTE (indo-texte.js), OTTER_SYMBOLE (otter.js), Indo (indo.js; Kurs aus franz.js
  // baut ihn); dazu das Lernen und die Übungen. Die Wörter und die Figur des Französisch braucht er nicht:
  // Fehlen sie, unterrichtet er trotzdem.
  indo: {
    id: 'indo', key: 'indo', lehrer: 'o', stats: 'indo', erfolge: 'indo_', tab: 'indo', name: 'Indonesisch', icon: 't-indo',
    farbe: 'var(--indo)', segment: 'indo', karte: 'indoKarte', aus: false,
    geladen: () => Indo && Lernen && Lernen.kurs && Uebungen && VOK_INDO && INDO_TEXTE && OTTER_DEFS && OTTER_SYMBOLE,
    modul: () => Indo,
    sprite: () => OTTER_DEFS + OTTER_SYMBOLE,
  },
};
const KURS_REIHE = Object.keys(KURSE);
function kursDa(id) {
  const k = KURSE[id];
  try { return !!k && !k.aus && !!k.geladen(); } catch (e) { return false; }
}
// So hiess es, als es nur Französisch gab
const franzDa = () => kursDa('fr');
// Die Kurse, die es gerade gibt, in ihrer Reihenfolge (die Einträge von KURSE)
const kurseDa = () => KURS_REIHE.filter(kursDa).map(id => KURSE[id]);
// Steht die Figur auf der Lichtung? Pieks immer; wer unterrichtet, erst nach dem ersten Treffen.
function figurDa(wer) {
  const f = FIGUREN[wer];
  if (!f) return false;
  return !f.kurs || (kursDa(f.kurs) && KURSE[f.kurs].modul().vorgestellt());
}
// Der Kurs, den eine Figur gibt (sein Objekt aus franz.js), oder null: Pieks, oder der Kurs fehlt
function kursVon(wer) {
  const f = FIGUREN[wer];
  return f && f.kurs && kursDa(f.kurs) ? KURSE[f.kurs].modul() : null;
}
// Der Kurs, der auf dem Kurs-Bildschirm unterrichtet (franz.js: Buehne.aktiv), oder null
const aktiverKurs = () => kurseDa().find(k => k.modul().aktiv()) || null;
// Wem eine Zeichnung oder eine Blase gehört: der Figur mit dieser Klasse, sonst Pieks
const werVon = svg => Object.keys(FIGUREN).find(w => w !== 'p' && svg.classList.contains(FIGUREN[w].klasse)) || 'p';
const werVonBlase = blase => Object.keys(FIGUREN).find(w => w !== 'p' && blase.classList.contains(FIGUREN[w].blase)) || 'p';
// Wie viele neben Pieks auf der Lichtung stehen, bestimmt ihre Grösse (stil.css: .held.zu-zweit, mit zwei
// Freunden .zu-dritt). Gezählt wird nur hier; jeder Kurs zeigt oder versteckt nur seine eigene Figur.
// Dasselbe für die Karten der Kurse: Sie stehen in einer Reihe (#sprachen), die nur da ist, wenn eine zu sehen ist.
function heldZeigen() {
  const da = Object.values(FIGUREN).filter(f => f.kurs && $(f.held) && !$(f.held).hidden);
  const held = document.querySelector('.held');
  held.classList.toggle('zu-zweit', da.length === 1);
  held.classList.toggle('zu-dritt', da.length > 1);
  // Steht der eine Freund links von Pieks (der Otter, wenn ihr Kurs fehlt), zeigt der Zipfel der Blase andersherum
  held.classList.toggle('freund-links', da.length === 1 && !!($(da[0].held).compareDocumentPosition($('heldPieks')) & Node.DOCUMENT_POSITION_FOLLOWING));
  const reihe = $('sprachen');
  if (!reihe) return;
  const karten = KURS_REIHE.filter(id => { const k = $(KURSE[id].karte); return !!k && !k.hidden; }).length;
  reihe.hidden = !karten;
  // Zwei Karten nebeneinander sind schmal: stil.css stellt dann den Balken über die Chips
  reihe.classList.toggle('zwei', karten > 1);
}
// Was jede Figur trägt, bevor etwas angezogen ist
const leeresOutfit = () => ({ kopf: null, augen: null, hals: null, pfote: null });
// So heisst die App, sobald sie installiert ist (ihr Name steht nur in texte.js)
const APP_NAME = 'Pieks & ' + HOERNCHEN.name;

/* =====================================================================
   SPEICHER
   Der Igel-Stand liegt unter «nea.igel.stand». Die Tages-Statistik bleibt
   im alten Format unter «bruchrechnen_stats_v1», damit nichts verloren geht.
   ===================================================================== */
const STAND_KEY = 'nea.igel.stand';
const STATS_KEY = 'bruchrechnen_stats_v1';
const stand = laden();
function laden() {
  const s = {
    aepfel: 0, gesamt: 0,
    stufe: { brueche: 'easy', volumen: 'easy', dreisatz: 'easy', mix: 'easy' },
    geloest: { brueche: 0, volumen: 0, dreisatz: 0 },
    schwer: 0, besterLauf: 0,
    besucher: {}, fakten: [], items: [],
  };
  // Was jede Figur trägt (an: Pieks, anH: das Hörnchen …); gekauft ist alles für alle
  for (const f of Object.values(FIGUREN)) s[f.an] = leeresOutfit();
  Object.assign(s, {
    erfolge: {}, ton: true, stimme: true, ziel: 10,
    vorgestellt: false, ersteTraining: false, ersterBesuch: false, zuletzt: 0, zielTage: {},
    nachRichtig: 0,
  });
  try {
    const raw = JSON.parse(localStorage.getItem(STAND_KEY) || 'null');
    if (raw && typeof raw === 'object') {
      for (const k of ['aepfel', 'gesamt', 'schwer', 'besterLauf', 'zuletzt', 'nachRichtig']) if (Number.isFinite(raw[k]) && raw[k] >= 0) s[k] = raw[k];
      if ([5, 10, 15, 20, 30].includes(raw.ziel)) s.ziel = raw.ziel;
      for (const k of ['ton', 'stimme', 'vorgestellt', 'ersteTraining', 'ersterBesuch']) if (typeof raw[k] === 'boolean') s[k] = raw[k];
      if (raw.stufe) for (const t in s.stufe) if (STUFEN[raw.stufe[t]]) s.stufe[t] = raw.stufe[t];
      if (raw.geloest) for (const t in s.geloest) if (Number.isInteger(raw.geloest[t])) s.geloest[t] = raw.geloest[t];
      if (raw.besucher && typeof raw.besucher === 'object') for (const k in raw.besucher) if (BESUCHER[k]) s.besucher[k] = raw.besucher[k];
      if (Array.isArray(raw.fakten)) s.fakten = raw.fakten.filter(k => typeof k === 'string').slice(-2000);
      if (Array.isArray(raw.items)) s.items = raw.items.filter(k => ITEMS[k]);
      for (const f of Object.values(FIGUREN)) {
        const an = raw[f.an], neu = s[f.an];
        if (an) for (const p in neu) if (ITEMS[an[p]] && s.items.includes(an[p])) neu[p] = an[p];
      }
      if (raw.erfolge && typeof raw.erfolge === 'object') for (const k in raw.erfolge) if (ERFOLGE[k]) s.erfolge[k] = raw.erfolge[k];
      if (raw.zielTage && typeof raw.zielTage === 'object') s.zielTage = raw.zielTage;
    }
  } catch (e) { /* privater Modus o.ä. */ }
  return s;
}
function speichern() {
  try { localStorage.setItem(STAND_KEY, JSON.stringify(stand)); } catch (e) { /* privater Modus o.ä. */ }
}

// Tages-Statistik (gleiches Format wie früher)
function statsLaden() { try { return JSON.parse(localStorage.getItem(STATS_KEY)) || {}; } catch (e) { return {}; } }
function statsSpeichern(s) { try { localStorage.setItem(STATS_KEY, JSON.stringify(s)); } catch (e) { /* voll o.ä. */ } }
const dateKey = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
const heuteKey = () => dateKey(new Date());
// Ein Prüfversuch. fach: 'mathe' oder der Anteil eines Kurses (KURSE[…].stats, für
// Französisch 'fr'), der zusätzlich gezählt wird (er fehlt in alten Einträgen und gilt dann
// als 0). zaehlt false: richtig, aber nicht fürs Tagesziel (in einem Kurs zählt jede Karte
// nur einmal pro Runde).
function ergebnisMerken(richtig, ersterVersuch, fach, zaehlt) {
  const s = statsLaden(), k = heuteKey();
  if (!s[k]) s[k] = { total: 0, correct: 0, firstTry: 0, attempts: 0 };
  s[k].attempts++;
  if (richtig) {
    s[k].correct++;
    if (ersterVersuch) s[k].firstTry++;
    if (zaehlt !== false) { s[k].total++; if (KURS_REIHE.some(id => KURSE[id].stats === fach)) s[k][fach] = (s[k][fach] || 0) + 1; }
  }
  statsSpeichern(s);
}
// Was an einem Tag gerechnet wurde: alles ohne die Anteile der Kurse
const rechnenVon = t => (+t.total || 0) - KURS_REIHE.reduce((n, id) => n + (+t[KURSE[id].stats] || 0), 0);
const heuteGeloest = () => (statsLaden()[heuteKey()] || {}).total || 0;
const alleGeloest = () => Object.values(statsLaden()).reduce((a, x) => a + (x.total || 0), 0);
// Tage in Folge mit mindestens einer gelösten Aufgabe (heute zählt, sobald gelöst)
function tageSerie() {
  const s = statsLaden(), d = new Date();
  let n = 0;
  if (!((s[dateKey(d)] || {}).total > 0)) d.setDate(d.getDate() - 1);
  while ((s[dateKey(d)] || {}).total > 0) { n++; d.setDate(d.getDate() - 1); }
  return n;
}

/* =====================================================================
   TAGESZEIT UND JAHRESZEIT
   ===================================================================== */
function saison(d = new Date()) {
  const m = d.getMonth() + 1;
  return m <= 2 || m === 12 ? 'winter' : m <= 5 ? 'fruehling' : m <= 8 ? 'sommer' : 'herbst';
}
function tageszeit(d = new Date()) {
  const h = d.getHours() + d.getMinutes() / 60, s = saison(d);
  // Im Winter wird es früher dunkel, im Sommer später
  const [morgen, tag, abend, nacht] = { winter: [7, 10, 16.3, 18], fruehling: [6, 9.5, 18, 20.5], sommer: [5.5, 9, 19.5, 21.5], herbst: [6.5, 10, 17, 19.3] }[s];
  return h < morgen || h >= nacht ? 'nacht' : h < tag ? 'morgen' : h < abend ? 'tag' : 'abend';
}
function zeitAnwenden() {
  const b = document.body.classList;
  ['morgen', 'tag', 'abend', 'nacht', 'fruehling', 'sommer', 'herbst', 'winter'].forEach(k => b.remove(k));
  b.add(tageszeit(), saison());
}

/* =====================================================================
   AUDIO: ein gemeinsamer Kontext für Töne und Stimme. Er darf erst nach
   einem Tipp loslegen; davor bleibt er stumm.
   ===================================================================== */
let audioCtx = null;
function audio() {
  if (!audioCtx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    audioCtx = new AC();
  }
  // Safari meldet nach einem Anruf oder Sperrbildschirm auch «interrupted»
  if (audioCtx.state === 'suspended' || audioCtx.state === 'interrupted') audioCtx.resume().catch(() => {});
  return audioCtx;
}
// Auf iPad und iPhone sonst stumm, sobald der Lautlos-Schalter an ist
try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) { /* älteres Safari */ }

/* TÖNE (selbst erzeugt, keine Dateien) */
const Ton = (() => {
  const ac = () => (stand.ton ? audio() : null);
  function note(f, t0, dur, type = 'sine', vol = 0.12, to = 0) {
    const c = ac();
    if (!c) return;
    const t = c.currentTime + t0;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f, t);
    if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    g.connect(c.destination);
    o.start(t);
    o.stop(t + dur + 0.05);
  }
  const folge = (fs, dt, dur, type, vol) => fs.forEach((f, i) => note(f, i * dt, dur, type, vol));
  return {
    tipp() { note(720, 0, 0.05, 'triangle', 0.05); },
    taste() { note(620, 0, 0.04, 'triangle', 0.04); },
    richtig() { note(784, 0, 0.12, 'triangle', 0.12); note(1175, 0.09, 0.22, 'triangle', 0.1); },
    falsch() { note(330, 0, 0.28, 'sine', 0.13, 210); },
    apfel(i = 0) { note(1320 + i * 90, 0, 0.09, 'sine', 0.07, 1760 + i * 90); },
    serie() { folge([659, 880, 1047, 1319], 0.07, 0.22, 'triangle', 0.09); },
    ziel() { folge([523, 659, 784, 1047, 1319], 0.1, 0.3, 'triangle', 0.1); note(1568, 0.55, 0.6, 'sine', 0.07); },
    rang() { folge([523, 659, 784, 1047], 0.12, 0.35, 'square', 0.035); note(1319, 0.5, 0.7, 'triangle', 0.08); },
    erfolg() { folge([784, 988, 1175, 1568], 0.08, 0.3, 'sine', 0.08); },
    fakt() { folge([1047, 1319], 0.08, 0.25, 'sine', 0.06); },
    kaufen() { note(1568, 0, 0.08, 'square', 0.04); note(2093, 0.08, 0.3, 'triangle', 0.08); },
    aufwachen() { note(260, 0, 0.5, 'sine', 0.08, 520); note(520, 0.5, 0.25, 'triangle', 0.07, 780); },
    kitzeln() { folge([900, 1200, 950, 1300, 1000], 0.06, 0.07, 'sine', 0.06); },
    einrollen() { note(700, 0, 0.35, 'triangle', 0.08, 180); },
    schnueffeln() { [0, 0.12, 0.24].forEach(t => note(2400, t, 0.05, 'sawtooth', 0.012, 1800)); },
    // Tierlaute
    klaeff() { note(700, 0, 0.09, 'sawtooth', 0.05, 1100); note(650, 0.13, 0.1, 'sawtooth', 0.05, 1000); },
    keckern() { for (let i = 0; i < 6; i++) note(1400 + (i % 2) * 300, i * 0.05, 0.04, 'square', 0.025); },
    // Der Otter quietscht: Zwergotter rufen hell und kurz, jeder Ruf steigt an (anders als ihr Keckern)
    quietschen() { note(1500, 0, 0.07, 'sine', 0.06, 2300); note(1800, 0.09, 0.06, 'sine', 0.05, 2700); note(1350, 0.18, 0.11, 'sine', 0.06, 2200); },
    grunz() { note(140, 0, 0.18, 'sawtooth', 0.06, 100); note(130, 0.22, 0.16, 'sawtooth', 0.05, 95); },
    plopp() { note(520, 0, 0.12, 'sine', 0.12, 180); },
    quiek() { note(1250, 0, 0.09, 'sine', 0.1, 1700); note(1350, 0.12, 0.12, 'sine', 0.09, 1900); },
    piepsen() { folge([2600, 2900, 2700], 0.07, 0.05, 'sine', 0.05); },
    quaak() { note(170, 0, 0.12, 'square', 0.05, 140); note(200, 0.16, 0.18, 'square', 0.05, 150); },
    brumm() { note(110, 0, 0.5, 'sawtooth', 0.03, 130); },
    huhu() { note(420, 0, 0.3, 'sine', 0.1, 380); note(400, 0.42, 0.45, 'sine', 0.09, 360); },
    fiep() { note(3200, 0, 0.05, 'sine', 0.04, 4000); note(3400, 0.08, 0.05, 'sine', 0.04, 4200); },
    zwitscher() { for (let i = 0; i < 4; i++) note(2400 + i * 200, i * 0.07, 0.06, 'sine', 0.05, 3000 + i * 200); },
    summ() { note(220, 0, 0.6, 'sawtooth', 0.02, 240); },
    glitzer() { folge([1568, 2093, 2637, 3136], 0.06, 0.25, 'sine', 0.05); },
    hupen() { note(330, 0, 0.18, 'square', 0.04, 300); note(330, 0.25, 0.18, 'square', 0.04, 300); },
    wusch() { note(300, 0, 0.4, 'triangle', 0.05, 900); },
    schatz() { folge([1047, 1319, 1568, 2093, 2637], 0.07, 0.3, 'triangle', 0.08); },
    ufo() { for (let i = 0; i < 3; i++) note(500, i * 0.25, 0.22, 'sine', 0.06, 1500); },
  };
})();

/* =====================================================================
   STIMME: Pieks und das Hörnchen sprechen. Jede Aufnahme liegt als
   audio/<kennung>.mp3 bereit (siehe texte.js und make-audio.mjs). Ein
   Teil ist ein gesprochener Text (Pieks' Stimme) oder { s, v, pause }:
   v nennt die Stimme und steht vorn im Dateinamen, pause die Lücke davor.
   Mehrere Teile werden nahtlos aneinandergehängt. Eine neue Ansage
   unterbricht immer die laufende. Ein Analyser misst die Lautstärke,
   damit der Mund der Figur mitgeht.
   ===================================================================== */
// Welche Aufnahmen es gibt (make-audio.mjs schreibt die Liste)
let aufnahmen = null;
fetch('audio/vorhanden.json').then(r => (r.ok ? r.json() : null)).then(l => { if (Array.isArray(l)) aufnahmen = new Set(l); }).catch(() => {});

const Stimme = (() => {
  const roh = new Map(), fertig = new Map(), werdend = new Map();
  let laeuft = [], nummer = 0, wecker = null, letzte = {}, analyser = null, mundFrame = 0;
  let aktiv = false;     // spricht gerade jemand (oder wartet die Lesezeit ab)?
  let mundZiel = null;   // das <svg> der Figur, die gerade spricht

  // Jede aufbereitete Aufnahme hält etwa 0.3 MB. Eine Sitzung, die auf dem iPad
  // tagelang offen bleibt, hörte sonst nach und nach Hunderte Aufnahmen in den
  // Speicher. Darum bleiben höchstens MAX, und es geht zuerst, was am längsten
  // nicht gebraucht wurde (eine Map behält die Reihenfolge, Gebrauchtes kommt
  // wieder ans Ende). Was weg ist, wird beim nächsten Mal neu aufbereitet.
  const MAX = 200;
  let spielt = new Set();   // was die laufende Ansage spielt oder noch holt
  const vorgemerkt = [];    // zuletzt mit bereit() vorbereitet: die Aufgabe jetzt und die nächste
  function kuerzen(karte, bleibt) {
    for (const id of karte.keys()) {
      if (karte.size <= MAX) break;
      if (!bleibt(id)) karte.delete(id);
    }
  }
  function gebraucht(karte, id) {
    const x = karte.get(id);
    karte.delete(id);
    karte.set(id, x);
    return x;
  }

  // Gibt es die Aufnahme? null, solange die Liste noch nicht da ist. Nur eine
  // Abkürzung: false heisst, gar nicht erst holen.
  const hat = clip => (!clip ? false : aufnahmen ? aufnahmen.has(clipDatei(clip)) : null);
  function holen(clip) {
    if (hat(clip) === false) return Promise.resolve(null);
    const id = clipDatei(clip);
    // Ohne Netz kann statt der Aufnahme die Seite zurückkommen: das gilt als fehlend.
    // Was nicht kam, wird gleich wieder vergessen (auch nach dem Vorladen): so
    // holt schon die nächste Ansage neu, statt einmal stumm zu bleiben.
    if (roh.has(id)) return gebraucht(roh, id);
    // Ein Abruf, der hängt, wird nach 20 s abgebrochen: sonst bliebe die Aufnahme
    // bis zum Neuladen stumm, weil jede Ansage auf denselben Abruf wartete
    const ab = typeof AbortController === 'function' ? new AbortController() : null;
    const uhr = ab ? setTimeout(() => ab.abort(), 20000) : 0;
    const p = fetch('audio/' + id + '.mp3', ab ? { signal: ab.signal } : undefined)
      .then(r => (r.ok && (r.headers.get('Content-Type') || '').startsWith('audio/') ? r.arrayBuffer() : null)).catch(() => null)
      .then(daten => { clearTimeout(uhr); if (!daten && roh.get(id) === p) roh.delete(id); return daten; });
    roh.set(id, p);
    // Auch die geholten Dateien nicht ohne Ende: wer sie gerade braucht, hält sein Versprechen selbst
    kuerzen(roh, x => x === id);
    return p;
  }

  /* ---------- Aufbereiten ----------
     Vor dem ersten Abspielen wird jede Aufnahme auf Pieks' Lautstärke gebracht
     und am Rand von Stille befreit. Die Aufnahmen des Hörnchens sind 12 bis
     22 dB leiser und rauschen: unbehandelt wäre sie neben Pieks kaum zu hören,
     und ihr Mund ginge fast nicht auf. Alles hier ist nach Gehör abgestimmt;
     die Zahlen bleiben, wie sie sind. */
  const ZIEL = -17.5;   // mittlere Lautheit von Pieks' 869 Aufnahmen (LUFS)
  // Gerechnet wird in Scheiben: nach 8 ms am Stück kommt erst die Seite wieder
  // dran, damit auch auf einem Tablet nichts stockt. Wer rechnet, fragt
  // zwischendurch «if ((w = luft())) await w;». Die Pause läuft über einen
  // Nachrichtenkanal: setTimeout würde jede Runde um 4 ms bremsen.
  let seit = 0;
  const kanal = new MessageChannel(), wartet = [];
  kanal.port1.onmessage = () => { const weiter = wartet.shift(); seit = performance.now(); if (weiter) weiter(); };
  const luft = () => (performance.now() - seit < 8 ? null
    : new Promise(res => { wartet.push(res); kanal.port2.postMessage(0); }));

  // Lautheit nach ITU-R BS.1770
  async function kGewichtet(x, sr) {
    const y = new Float32Array(x.length);
    let K = Math.tan(Math.PI * 1681.974450955533 / sr), Q = 0.7071752369554196;
    const Vh = Math.pow(10, 3.999843853973347 / 20), Vb = Math.pow(Vh, 0.4996667741545416);
    let a0 = 1 + K / Q + K * K;
    const b0 = (Vh + Vb * K / Q + K * K) / a0, b1 = 2 * (K * K - Vh) / a0, b2 = (Vh - Vb * K / Q + K * K) / a0;
    const a1 = 2 * (K * K - 1) / a0, a2 = (1 - K / Q + K * K) / a0;
    K = Math.tan(Math.PI * 38.13547087602444 / sr); Q = 0.5003270373238773;
    a0 = 1 + K / Q + K * K;
    const c1 = 2 * (K * K - 1) / a0, c2 = (1 - K / Q + K * K) / a0;
    let x1 = 0, x2 = 0, y1 = 0, y2 = 0, u1 = 0, u2 = 0, v1 = 0, v2 = 0, w;
    for (let i = 0; i < x.length;) {
      if ((w = luft())) await w;
      for (const bis = Math.min(x.length, i + 65536); i < bis; i++) {
        const s = x[i];
        const u = b0 * s + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2;
        x2 = x1; x1 = s; y2 = y1; y1 = u;
        const v = u - 2 * u1 + u2 - c1 * v1 - c2 * v2;
        u2 = u1; u1 = u; v2 = v1; v1 = v;
        y[i] = v;
      }
    }
    return y;
  }
  async function lautheit(x, sr) {
    const y = await kGewichtet(x, sr);
    const block = Math.round(0.4 * sr), schritt = Math.round(0.1 * sr), z = [];
    let w;
    if (y.length <= block) {
      let q = 0; for (let i = 0; i < y.length; i++) q += y[i] * y[i];
      z.push(q / Math.max(1, y.length));
    } else {
      for (let a = 0; a + block <= y.length; a += schritt) {
        if ((w = luft())) await w;
        let q = 0; for (let i = a; i < a + block; i++) q += y[i] * y[i];
        z.push(q / block);
      }
    }
    const L = q => -0.691 + 10 * Math.log10(q + 1e-12);
    const mittel = arr => arr.reduce((s, q) => s + q, 0) / arr.length;
    const laut = z.filter(q => L(q) > -70);
    if (!laut.length) return -70;
    const schwelle = L(mittel(laut)) - 10;
    const rest = laut.filter(q => L(q) > schwelle);
    return L(mittel(rest.length ? rest : laut));
  }

  // Grundrauschen entfernen (Wiener-Filter im Frequenzbereich)
  function fftPlan(n) {
    const bits = Math.log2(n), rev = new Uint32Array(n), cos = new Float32Array(n / 2), sin = new Float32Array(n / 2);
    for (let i = 0; i < n; i++) { let r = 0; for (let b = 0; b < bits; b++) r |= ((i >> b) & 1) << (bits - 1 - b); rev[i] = r; }
    for (let i = 0; i < n / 2; i++) { cos[i] = Math.cos(2 * Math.PI * i / n); sin[i] = Math.sin(2 * Math.PI * i / n); }
    return { n, rev, cos, sin };
  }
  function fft(plan, re, im, invers) {
    const { n, rev, cos, sin } = plan;
    for (let i = 0; i < n; i++) { const j = rev[i]; if (j > i) { let t = re[i]; re[i] = re[j]; re[j] = t; t = im[i]; im[i] = im[j]; im[j] = t; } }
    for (let size = 2; size <= n; size <<= 1) {
      const half = size >> 1, step = n / size;
      for (let a = 0; a < n; a += size) {
        for (let k = 0, w = 0; k < half; k++, w += step) {
          const wr = cos[w], wi = invers ? sin[w] : -sin[w], i = a + k, j = i + half;
          const tr = re[j] * wr - im[j] * wi, ti = re[j] * wi + im[j] * wr;
          re[j] = re[i] - tr; im[j] = im[i] - ti; re[i] += tr; im[i] += ti;
        }
      }
    }
    if (invers) for (let i = 0; i < n; i++) { re[i] /= n; im[i] /= n; }
  }
  const N = 1024, H = 256, K = N / 2 + 1;
  let PLAN = null, FENSTER = null;
  // Liefert null, wenn es nichts zu entrauschen gibt (zu kurz oder keine ruhige Stelle)
  async function entrauschen(x) {
    const alpha = 0.97, beta = 2, gmin = 0.05, abstand = 100;
    if (!PLAN) { PLAN = fftPlan(N); FENSTER = new Float32Array(N); for (let i = 0; i < N; i++) FENSTER[i] = 0.5 - 0.5 * Math.cos(2 * Math.PI * i / N); }
    const n = x.length, T = Math.floor((n + N) / H) + 1;
    if (n < 4 * N) return null;
    const RE = new Float32Array(T * K), IM = new Float32Array(T * K), P = new Float32Array(T * K), E = new Float32Array(T);
    const re = new Float32Array(N), im = new Float32Array(N);
    let w;
    for (let t = 0; t < T; t++) {
      if (!(t & 3) && (w = luft())) await w;
      const a = t * H - N;
      for (let i = 0; i < N; i++) { const j = a + i; re[i] = j >= 0 && j < n ? x[j] * FENSTER[i] : 0; im[i] = 0; }
      fft(PLAN, re, im, false);
      let e = 0;
      for (let k = 0, o = t * K; k < K; k++, o++) { RE[o] = re[k]; IM[o] = im[k]; const p = re[k] * re[k] + im[k] * im[k]; P[o] = p; if (k > 2) e += p; }
      E[t] = e;
    }
    // Rauschmuster: Mittel über die leisesten Blöcke, die ganz in der Aufnahme liegen
    const innen = [];
    for (let t = 0; t < T; t++) { const a = t * H - N; if (a >= 0 && a + N <= n && E[t] > 1e-9) innen.push(t); }
    if (innen.length < 12) return null;
    const sortiert = innen.slice().sort((a, b) => E[a] - E[b]);
    const n0 = Math.max(4, Math.floor(innen.length * 0.08));
    let e0 = 0; for (let i = 0; i < n0; i++) e0 += E[sortiert[i]]; e0 /= n0;
    const ruhe = innen.filter(t => E[t] < e0 * 2.5);
    const n1 = Math.max(4, Math.floor(innen.length * 0.3));
    let eLaut = 0; for (let i = 0; i < n1; i++) eLaut += E[sortiert[sortiert.length - 1 - i]]; eLaut /= n1;
    // Liegt das «Rauschen» zu nah an der Sprache, gab es keine ruhige Stelle: lieber nichts tun
    if (e0 * abstand > eLaut) return null;
    const leise = new Float32Array(K), rauschen = new Float32Array(K);
    for (const t of ruhe) for (let k = 0, o = t * K; k < K; k++, o++) leise[k] += P[o];
    for (let k = 0; k < K; k++) leise[k] /= ruhe.length;
    for (let k = 0; k < K; k++) { let s = 0, m = 0; for (let d = -3; d <= 3; d++) { const j = k + d; if (j >= 0 && j < K) { s += leise[j]; m++; } } rauschen[k] = s / m; }
    // Wiener-Filter, über die Zeit geglättet
    const out = new Float32Array(n + 2 * N), G1 = new Float32Array(K).fill(1), g1 = new Float32Array(K).fill(1), G = new Float32Array(K);
    for (let t = 0; t < T; t++) {
      if (!(t & 3) && (w = luft())) await w;
      for (let k = 0, o = t * K; k < K; k++, o++) {
        const gam = P[o] / (beta * rauschen[k] + 1e-20);
        const xi = alpha * G1[k] * G1[k] * g1[k] + (1 - alpha) * Math.max(gam - 1, 0);
        let g = xi / (1 + xi); if (g < gmin) g = gmin;
        G1[k] = g; g1[k] = gam; G[k] = g;
      }
      for (let k = 0, o = t * K; k < K; k++, o++) {
        const g = k < 2 ? 0 : (G[Math.max(0, k - 1)] + 2 * G[k] + G[Math.min(K - 1, k + 1)]) / 4;
        re[k] = RE[o] * g; im[k] = IM[o] * g;
        if (k > 0 && k < N / 2) { re[N - k] = re[k]; im[N - k] = -im[k]; }
      }
      fft(PLAN, re, im, true);
      const a = t * H;
      for (let i = 0; i < N; i++) out[a + i] += re[i] * FENSTER[i];
    }
    const y = new Float32Array(n);
    for (let i = 0; i < n; i++) y[i] = out[i + N] / 1.5;
    return y;
  }
  // Stille am Anfang und Ende abschneiden, damit Teile ohne Lücke klingen. Die
  // Schwelle gilt für die angeglichene Lautstärke: mit einer festen fehlte bei
  // ihren leisen Aufnahmen bis zu einer halben Sekunde Sprache.
  function trimmen(c, d, sr, faktor) {
    const n = d.length, rand = Math.floor(sr * 0.025), schwelle = 0.012 / faktor;
    let a = 0, b = n - 1;
    while (a < n && Math.abs(d[a]) < schwelle) a++;
    while (b > a && Math.abs(d[b]) < schwelle) b--;
    a = Math.max(0, a - rand); b = Math.min(n - 1, b + rand);
    if (b <= a) { a = 0; b = n - 1; }
    const out = c.createBuffer(1, b - a + 1, sr);
    out.getChannelData(0).set(d.subarray(a, b + 1));
    return out;
  }
  // Spitzen, die mit der Verstärkung über die Vollaussteuerung kämen, drückt ein
  // Begrenzer, statt die ganze Aufnahme leiser zu machen: Mit einer harten Kappe
  // klang ein kurzer Hinweis bis 4 LU leiser als der Satz davor in derselben Blase.
  // Er schaut 5 ms voraus, damit die Absenkung schon anliegt, wenn die Spitze kommt
  // (ohne Knacken), und lässt mit 60 ms los, damit der Pegel nicht flattert.
  const VOLL = 0.98, TIEFE = Math.pow(10, 9 / 20);   // nie tiefer als 9 dB: das klänge gepresst
  async function begrenzen(d, sr, faktor) {
    const n = d.length, L = Math.max(1, Math.round(sr * 0.005)), grenze = VOLL / faktor;
    const los = 1 - Math.exp(-1 / (sr * 0.06));
    // r: nötige Absenkung je Wert. Ihr Minimum über die Vorschau [i, i + L] hält eine
    // monotone Schlange q (so bleibt es O(n)); e kehrt davon nur langsam zu 1 zurück.
    const r = new Float32Array(n), e = new Float32Array(n), q = new Int32Array(n);
    let a = 0, b = 0, h = 1, w;
    for (let j = 0; j < n + L;) {
      if ((w = luft())) await w;
      for (const bis = Math.min(n + L, j + 65536); j < bis; j++) {
        if (j < n) {
          const x = Math.abs(d[j]), v = x > grenze ? grenze / x : 1;
          r[j] = v;
          while (b > a && r[q[b - 1]] >= v) b--;
          q[b++] = j;
        }
        const i = j - L;
        if (i < 0) continue;
        if (q[a] < i) a++;
        const m = r[q[a]], zurueck = h + (1 - h) * los;
        h = m < zurueck ? m : zurueck;
        e[i] = h;
      }
    }
    // Gleitendes Mittel über die L + 1 Werte bis i: Die Absenkung setzt über die
    // Vorschau weich ein und bleibt doch überall unter dem, was dort nötig ist.
    // Vor dem Anfang gilt e[0], damit auch eine Spitze ganz vorn gedrückt wird.
    // In einen neuen Puffer: d können die Kanaldaten der dekodierten Aufnahme sein.
    const y = new Float32Array(n), v0 = 1 - e[0];
    let summe = v0 * L, unter = v0 > 0 ? L : 0;   // Summe der Absenkungen im Fenster, wie viele nicht 0
    let vorher = 0, nachher = 0;                  // Energie: was die Absenkung an Lautheit kostet
    for (let i = 0; i < n;) {
      if ((w = luft())) await w;
      for (const bis = Math.min(n, i + 65536); i < bis; i++) {
        const neu = 1 - e[i];
        if (neu > 0) { summe += neu; unter++; }
        if (i > 0) {
          const alt = i > L ? 1 - e[i - L - 1] : v0;
          if (alt > 0) { summe -= alt; unter--; }
        }
        // Ohne Absenkung im Fenster bleibt der Wert, wie er ist (und die Summe ohne Rundungsrest)
        const x = d[i], z = unter ? x * (1 - summe / (L + 1)) : x;
        if (!unter) summe = 0;
        y[i] = z;
        vorher += x * x; nachher += z * z;
      }
    }
    return { y, anteil: vorher > 0 ? nachher / vorher : 1 };
  }
  // Wie jede Stimme aufbereitet wird (wessen ein Clip ist, sagt stimmeVon in texte.js): Pieks hat den harten
  // Deckel und rauscht nicht. Das Hörnchen rauscht (nur rund 39 dB über dem Grund) und hat scharfe Spitzen:
  // entrauschen und begrenzen. Die Stimme des Otters ist sauber (rund 63 dB über dem Grund), der Filter
  // machte sie nur trocken: nur begrenzen. Eine unbekannte Stimme behandelt es wie das Hörnchen.
  const KLANG = {
    p: { entrauschen: false, begrenzer: false },
    h: { entrauschen: true, begrenzer: true },
    o: { entrauschen: false, begrenzer: true },
  };
  // Aus der dekodierten Aufnahme wird { buf, faktor }: buf ist entrauscht (wo die
  // Stimme rauscht), wo nötig begrenzt und beschnitten, faktor die Verstärkung beim Abspielen
  async function aufbereiten(c, buf, clip) {
    const sr = buf.sampleRate, klang = KLANG[stimmeVon(clip)] || KLANG.h;
    let d = buf.getChannelData(0), w = luft();
    if (w) await w;
    if (klang.entrauschen) d = (await entrauschen(d)) || d;
    if ((w = luft())) await w;
    let spitze = 0; for (let i = 0; i < d.length; i++) { const a = Math.abs(d[i]); if (a > spitze) spitze = a; }
    const lufs = await lautheit(d, sr);
    // Verstärkung bis zur Ziel-Lautheit (höchstens 16-fach)
    const soll = Math.min(Math.pow(10, (ZIEL - lufs) / 20), 16);
    // So hoch ging es ohne Begrenzer: daran misst das Abschneiden der Stille, sonst
    // behielte die höhere Verstärkung leises Rauschen am Ende (bis über eine halbe Sekunde)
    const ohne = Math.min(soll, VOLL / Math.max(spitze, 1e-4));
    let faktor = soll;
    // Pieks bleibt beim harten Deckel: Seine kurzen Rufe («Tipp:», «Faktenfan!») würde der
    // Begrenzer um bis zu 7 dB drücken, und er liegt ohnehin auf der Ziel-Lautheit.
    // Ihre Stimme hat einzelne scharfe Spitzen (Zischlaute), die sonst ganze Sätze leiser machten.
    if (!klang.begrenzer) faktor = ohne;
    else if (spitze * faktor > VOLL) {
      // Über tief bräuchte die Spitze mehr als 9 dB: dann wird die ganze Aufnahme um den Rest leiser
      const tief = VOLL * TIEFE / spitze, roh = d;
      faktor = Math.min(soll, tief);
      // Gedrückte Spitzen kosten etwas Lautheit (wo sie dicht kommen, fast 2 dB). Was
      // fehlt, kommt als Verstärkung dazu und wird wieder begrenzt, bis weniger als
      // 0.2 dB fehlen: meist reicht ein Durchgang, nie mehr als vier
      for (let runde = 0; ; runde++) {
        if ((w = luft())) await w;
        const b = await begrenzen(roh, sr, faktor);
        d = b.y;
        const mehr = Math.min(soll / Math.sqrt(b.anteil), 16, tief);
        if (runde === 3 || mehr < faktor * 1.023) break;
        faktor = mehr;
      }
    }
    if ((w = luft())) await w;
    return { buf: trimmen(c, d, sr, ohne), faktor };
  }
  // Holen, dekodieren, aufbereiten: einmal je Aufnahme, erst wenn sie gebraucht
  // wird. Was nicht klappt, wird nicht gemerkt und beim nächsten Mal neu
  // versucht, statt stumm zu bleiben.
  function dekodieren(c, clip) {
    const id = clipDatei(clip);
    if (fertig.has(id)) return Promise.resolve(gebraucht(fertig, id));
    if (!werdend.has(id)) {
      werdend.set(id, holen(clip)
        .then(daten => daten && new Promise((ok, nein) => {
          // Neuere Browser geben zusätzlich ein Versprechen zurück; sein Scheitern ist mit «nein» schon gemeldet
          const p = c.decodeAudioData(daten.slice(0), ok, nein);
          if (p && p.catch) p.catch(() => {});
        }))
        .then(buf => buf && aufbereiten(c, buf, clip))
        .catch(() => null)
        .then(x => {
          werdend.delete(id);
          if (!x) roh.delete(id);
          else {
            fertig.set(id, x);
            // Was spielt, wartet oder für die nächste Aufgabe bereitliegt, bleibt (und das Neue sowieso)
            kuerzen(fertig, k => k === id || spielt.has(k) || vorgemerkt.includes(k));
          }
          return x;
        }));
    }
    return werdend.get(id);
  }
  function schlafen(ms) {
    return new Promise(res => {
      const t = setTimeout(res, ms);
      wecker = () => { clearTimeout(t); res(); };
    });
  }
  function mundZu() {
    cancelAnimationFrame(mundFrame);
    if (mundZiel) { mundZiel.classList.remove('spricht'); mundZiel.style.removeProperty('--mund'); }
    mundZiel = null;
  }
  function mundLos(svg) {
    mundZu();
    if (!svg || !analyser) return;
    mundZiel = svg;
    svg.classList.add('spricht');
    const daten = new Float32Array(analyser.fftSize);
    let glatt = 0;
    const schritt = () => {
      analyser.getFloatTimeDomainData(daten);
      let q = 0;
      for (let i = 0; i < daten.length; i++) q += daten[i] * daten[i];
      const pegel = Math.sqrt(q / daten.length);
      glatt = glatt * 0.45 + clamp(pegel * 7, 0, 1) * 0.55;
      svg.style.setProperty('--mund', (0.08 + glatt * 0.92).toFixed(2));
      mundFrame = requestAnimationFrame(schritt);
    };
    schritt();
  }
  function stopp() {
    nummer++;
    aktiv = false;
    laeuft.forEach(q => { try { q.stop(); } catch (e) { /* schon zu Ende */ } });
    laeuft = [];
    spielt = new Set();
    mundZu();
    if (wecker) { wecker(); wecker = null; }
  }
  // Ungefähre Lesezeit, wenn nichts zu hören ist (Stimme aus, offline …)
  const lesezeit = teile => clamp(teile.map(clipText).join(' ').length * 55, 1000, 9000);
  // So lange wartet eine Ansage höchstens auf ihre Aufnahmen. Was Nea selbst antippt
  // (opt.tipp), darf länger brauchen: lieber spät als gar nicht.
  const FRIST = 2500, FRIST_TIPP = 8000;

  // Spricht die Teile nacheinander. Erfüllt sich, wenn alles gesagt ist
  // (true) oder eine neuere Ansage dazwischenkam (false).
  async function sprechen(teile, opt = {}) {
    stopp();
    const meine = nummer;
    aktiv = true;
    try {
      spielt = new Set(teile.filter(Boolean).map(clipDatei));
      if (!opt.einwurf) letzte = { teile, svg: opt.svg };
      const c = stand.stimme ? audio() : null;
      // Lädt eine Aufnahme noch (langsames Netz), wartet die Ansage darauf, aber nicht
      // ewig: Nach der Frist spielt, was schon bereit ist, der Rest fällt diesmal weg
      // (er lädt weiter, fürs nächste Mal). Später nachschieben ginge nicht: dann käme
      // etwa ihr Satz erst nach dem Wort. Wer auf die Ansage wartet («Weiter» beim
      // Kennenlernen), wartet so nie länger als die Frist. Kommt inzwischen eine neue
      // oder stopp(), gilt sie sofort als unterbrochen.
      let fristUhr = 0;
      const clips = !c ? [] : await Promise.race([
        Promise.all(teile.map(t => dekodieren(c, t))),
        new Promise(res => { wecker = () => res(null); }),
        new Promise(res => { fristUhr = setTimeout(() => res(teile.map(t => fertig.get(clipDatei(t)) || null)), opt.tipp ? FRIST_TIPP : FRIST); }),
      ]);
      clearTimeout(fristUhr);
      if (meine !== nummer) return false;
      // Nach Sperrbildschirm oder App-Wechsel ist der Kontext ausgesetzt, und audio() bittet
      // nur um resume(). Darauf kurz warten, sonst bliebe die erste Ansage danach stumm.
      if (c && c.state !== 'running' && clips.some(Boolean)) {
        await Promise.race([c.resume().catch(() => {}), pause(300)]);
        if (meine !== nummer) return false;
      }
      if (!c || c.state !== 'running' || !clips.some(Boolean)) {
        await schlafen((opt.warte || 0) * 1000 + lesezeit(teile));
        return meine === nummer;
      }
      if (!analyser) {
        analyser = c.createAnalyser();
        analyser.fftSize = 512;
        analyser.connect(c.destination);
      }
      let t = c.currentTime + 0.04 + (opt.warte || 0), erster = true;
      const start = t;
      clips.forEach((x, i) => {
        if (!x) return;
        // Lücke vor dem Teil: eine kurze zwischen zwei Teilen, vor dem ersten keine
        t += teile[i].pause !== undefined ? teile[i].pause : erster ? 0 : 0.12;
        erster = false;
        // Der Analyser hört die angeglichene Lautstärke, damit der Mund bei beiden gleich weit aufgeht
        const q = c.createBufferSource(), g = c.createGain();
        q.buffer = x.buf;
        g.gain.value = x.faktor;
        q.connect(g);
        g.connect(analyser);
        q.start(t);
        laeuft.push(q);
        t += x.buf.duration;
      });
      setTimeout(() => { if (meine === nummer) mundLos(opt.svg); }, Math.max(0, (start - c.currentTime) * 1000));
      await schlafen((t - c.currentTime) * 1000 + 120);
      // Zu Ende gespielt: die Quellen loslassen, sonst hielten sie ihre Puffer bis zur nächsten Ansage
      if (meine === nummer) { mundZu(); laeuft = []; }
      return meine === nummer;
    } finally {
      if (meine === nummer) { aktiv = false; spielt = new Set(); }
    }
  }
  // Holt und bereitet Aufnahmen vor, bevor sie gebraucht werden (die nächste
  // Aufgabe). Meldet je Teil, ob er spielen kann. Was nach anderthalb Sekunden
  // noch nicht so weit ist, gilt als nicht bereit und lädt im Hintergrund weiter.
  function bereit(teile) {
    const c = stand.stimme ? audio() : null;
    // Gemerkt werden die letzten acht (je Aufgabe zwei): Sie gehen nicht aus dem Speicher, bevor sie spielen
    for (const t of teile) {
      if (!t) continue;
      const id = clipDatei(t), i = vorgemerkt.indexOf(id);
      if (i >= 0) vorgemerkt.splice(i, 1);
      vorgemerkt.push(id);
    }
    if (vorgemerkt.length > 8) vorgemerkt.splice(0, vorgemerkt.length - 8);
    return Promise.all(teile.map(t => (t && c ? Promise.race([dekodieren(c, t).then(Boolean), pause(1500).then(() => false)]) : false)));
  }
  return {
    sprechen,
    stopp,
    // Automatische Ansagen fragen vorher: nie jemandem ins Wort fallen.
    // Nur was Nea selbst antippt, darf unterbrechen.
    istStill: () => !aktiv,
    vorladen: teile => teile.forEach(t => { if (t) holen(t); }),
    nochmal: () => (letzte.teile && letzte.teile.length ? sprechen(letzte.teile, { svg: letzte.svg, tipp: true }) : null),
    // Zwischenruf (z.B. zu einem Tier): ein Tipp auf die Blase wiederholt danach trotzdem den Blasentext
    einwurf: (teile, svg) => sprechen(teile, { einwurf: true, svg, tipp: true }),
    hat,
    bereit,
  };
})();

/* =====================================================================
   WAS DIE FIGUREN SAGEN
   Aus jeder Liste in zufälliger Reihenfolge, ohne Wiederholung, bis alle
   einmal dran waren. Pieks' Listen stehen in TEXTE; die der Lehrerinnen
   und Pieks' Sätze in einem Kurs in dessen Texten (für Französisch
   HTEXTE und PTEXTE in franz-texte.js).
   ===================================================================== */
const beutel = {}, zuletzt = {};
// Jede andere Quelle hat ihre eigenen Beutel: Zwei Kurse dürfen ihre Listen gleich nennen
const beutelVon = new WeakMap();
// Eine Liste, die es nicht gibt oder die leer ist, ergibt null: dann wird nichts gesagt
function zieh(name, quelle = TEXTE) {
  const liste = quelle[name];
  if (!liste || !liste.length) return null;
  if (quelle !== TEXTE && !beutelVon.has(quelle)) beutelVon.set(quelle, { beutel: {}, zuletzt: {} });
  const b = quelle === TEXTE ? beutel : beutelVon.get(quelle).beutel, z = quelle === TEXTE ? zuletzt : beutelVon.get(quelle).zuletzt;
  if (!b[name] || !b[name].length) {
    const neu = shuffle(liste.slice());
    if (neu.length > 1 && neu[neu.length - 1] === z[name]) neu.unshift(neu.pop());
    b[name] = neu;
  }
  return (z[name] = b[name].pop());
}

// Wohin gerade gesprochen wird: Blase und Zeichnung der Figur, die dran ist
// (wer: 'p' Pieks, 'h' das Hörnchen, siehe FIGUREN)
let ziel = { say: null, blase: null, svg: null, wer: 'p' };
function sprechZiel(blase, svg, wer = 'p') {
  ziel = { blase, say: blase.querySelector('.say'), svg, wer };
  // Die Blase zeigt, wem sie gehört: Zipfel und Farbe über die Klasse, im
  // gestapelten Layout zusätzlich ein kleiner Kopf in der Ecke
  const f = wer !== 'p' && FIGUREN[wer] ? FIGUREN[wer] : FIGUREN.p;
  for (const [w, x] of Object.entries(FIGUREN)) if (w !== 'p') blase.classList.toggle(x.blase, x === f);
  blase.classList.toggle(FIGUREN.p.blase, f === FIGUREN.p);
  const kopf = blase.querySelector('.blase-wer');
  if (kopf && kurseDa().length) kopf.innerHTML = `<svg viewBox="0 0 24 24"><use href="#${f.abzeichen}"/></svg>`;
}
// Blase und Figur am Ort, der gerade zu sehen ist. null: diese Figur ist dort
// nicht da (eine Lehrerin im Rechentraining, vor dem ersten Treffen …)
function sprecher(wer) {
  const f = FIGUREN[wer], lehrer = !!(f && f.kurs), m = lehrer ? kursVon(wer) : null;
  let blase, svg;
  if (lehrer && !m) return null;
  if (fensterArt === 'garderobe' && garderobeSVG && garderobeSVG.isConnected) {
    // In der Garderobe gehört die Blase der Figur, die gerade anprobiert
    if (werVon(garderobeSVG) !== (lehrer ? wer : 'p')) return null;
    blase = $('blaseGarderobe'); svg = garderobeSVG;
  } else if (bildschirm === 'franz') {
    // Auf dem Kurs-Bildschirm stehen die Lehrerin des Kurses, der dran ist, und der kleine Pieks
    const a = aktiverKurs();
    if (!a || (lehrer && a.modul() !== m)) return null;
    blase = $('blaseFranz'); svg = lehrer ? m.svg.buehne : (a.modul().svg || {}).gast;
  } else if (bildschirm === 'training') {
    if (lehrer) return null;
    blase = $('blase'); svg = dockSVG;
  } else {
    blase = $('blaseHome'); svg = lehrer ? m.svg.held : heldSVG;
  }
  if (!blase || (lehrer && (!svg || svg.closest('[hidden]')))) return null;
  return { blase, svg: svg || null };
}
// Richtet das Ziel auf die Figur; false, wenn sie gerade nicht zu sehen ist
function zielAuf(wer) {
  const s = sprecher(wer);
  if (s) sprechZiel(s.blase, s.svg, wer);
  return !!s;
}
// Pieks' Mund am sichtbaren Ort: Meldungen und Fakten gehören immer ihm,
// auch wenn die Blase gerade einer Lehrerin gehört
function pieksMund() {
  if (fensterArt === 'garderobe' && garderobeSVG && garderobeSVG.isConnected && garderobeSVG.classList.contains('pieks')) return garderobeSVG;
  if (bildschirm === 'franz') {
    const a = aktiverKurs(), m = a && a.modul();
    return (m && m.svg && m.svg.gast) || null;
  }
  return bildschirm === 'training' ? dockSVG : heldSVG;
}

// Zeigt etwas in der Sprechblase und liest es vor. html ist die Anzeige,
// teile sind die gesprochenen Teile.
function ansage(html, teile, opt = {}) {
  if (ziel.say) {
    // Rückt ein Satz die Figuren (beim Rechnen steht Pieks auf der Blase), gleiten sie an den neuen Platz.
    // Auf dem Handy wächst dabei das Dock: Dann gleiten auch die Werkzeuge darüber und die Tiere auf der
    // Wiese, die am Dock steht. Auf dem Kurs-Bildschirm tut das franz.js (figurenGleiten).
    gleiten([...Object.values(FIGUREN).map(f => $(f.held)), $('dockPieks'), document.querySelector('#dock .werkzeuge'), ...document.querySelectorAll('#bodenTraining .besucher')], () => {
      ziel.say.innerHTML = html;
      // Rollt der Text in der Blase (Lichtung), fängt ein neuer Satz oben an
      ziel.say.scrollTop = 0;
      ziel.blase.classList.remove('leer');
      ziel.blase.classList.toggle('lang', ziel.say.textContent.length > 90);
    }, 300);
    ziel.blase.classList.remove('pop');
    void ziel.blase.offsetWidth;
    ziel.blase.classList.add('pop');
    rolltZeigen(ziel.say);
  }
  return Stimme.sprechen(teile, Object.assign({ svg: ziel.svg }, opt));
}
// Was durch eine Änderung seinen Platz wechselt, gleitet hin, statt zu springen (FLIP). Figuren gleiten
// samt Grösse (auf dem Handy wird Pieks zu zweit kleiner), Blasen nur mit dem Ort: Ihre Schrift bleibt.
// Gemessen wird, wo es gerade zu sehen ist: Gleitet es schon, geht es von dort aus weiter, statt zu
// springen. translate und scale lassen eigene Bewegungen (Hüpfen, Sprechen) darunter weiterlaufen.
function gleiten(els, aendern, ms = 450) {
  els = els.filter(el => el && !el.hidden);
  const vor = els.map(el => el.getBoundingClientRect());
  els.forEach(el => el.getAnimations().forEach(an => { if (an.id === 'gleiten') an.cancel(); }));
  aendern();
  els.forEach((el, i) => {
    const a = vor[i], b = el.getBoundingClientRect();
    if (!a.width || !b.width) return;
    const blase = el.classList.contains('blase'), k = blase ? 1 : a.width / b.width, dx = a.left - b.left, dy = a.top - b.top;
    if (Math.abs(dx) < 1 && Math.abs(dy) < 1 && Math.abs(k - 1) < .01) return;
    // Figuren werden um die linke obere Ecke skaliert; eine Blase nur verschoben, ihr «reden» bleibt, wie es ist
    hinGleiten(el, Object.assign(blase ? {} : { transformOrigin: '0 0' }, { translate: `${dx}px ${dy}px`, scale: `${k}` }), ms);
  });
}
// Ein Element gleitet von «von» (translate, scale: wo es zu sehen war) an seinen Platz. Ohne Bewegung
// (reduce) blendet es stattdessen dort aus, wo es war, und am neuen Platz wieder ein: So springt nichts,
// und nichts bewegt sich.
function hinGleiten(el, von, ms) {
  if (reduce) {
    // Kleine Wege (fast jeder neue Satz im Dock) einfach hinnehmen: ein Aus- und Einblenden
    // bei jedem Satz wäre unruhiger als der kleine Versatz. Nur grosse Wege werden überblendet.
    const [dx = 0, dy = 0] = String(von.translate || '').split(' ').map(parseFloat);
    if (Math.hypot(dx, dy) < 60 && Math.abs(parseFloat(von.scale || 1) - 1) < .1) return;
  }
  const da = Object.assign(von.transformOrigin ? { transformOrigin: von.transformOrigin } : {}, { translate: '0px 0px', scale: '1' });
  const bilder = reduce
    ? [{ ...von, opacity: 1 }, { ...von, opacity: 0, offset: .3 }, { ...von, opacity: 0, offset: .45 }, { ...da, opacity: 0, offset: .45 }, { ...da, opacity: 0, offset: .6 }, { ...da, opacity: 1 }]
    : [von, da];
  el.animate(bilder, { duration: reduce ? 400 : ms, easing: reduce ? 'linear' : 'cubic-bezier(.3, .7, .4, 1)', id: 'gleiten' });
}
// Kommt in der Reihe der Sprachkarten (#sprachen) eine Karte neben eine andere, wird jene schmaler. Sie wird
// es nach und nach, statt zu springen: gleiten() könnte sie nur strecken, und eine gestreckte Karte sähe aus
// wie gezoomt. Die neue steht dafür so lange frei an ihrem Platz (sie springt dort herein, franz.css .kommt),
// die anderen rücken mit Breite und Rand dorthin, wo sie danach stehen, und die Reihe ist schon so hoch wie
// danach: So rückt nichts unter ihr. Untereinander (Handy) wird keine schmaler; dann gleitet die Reihe als
// Ganzes mit der Wahl (gleiten), und hier geschieht nichts. Ohne Bewegung (reduce) blendet die andere Karte
// aus und in ihrer neuen Breite wieder ein, wie in hinGleiten.
// Gemessen wird vorher (dieser Aufruf) und nachher (die Funktion, die er zurückgibt, nach dem Zeigen).
function kartenRuecken(neu) {
  const reihe = neu && neu.parentElement;
  if (!reihe) return () => {};
  const vor = new Map([...reihe.children].filter(el => el !== neu && !el.hidden).map(el => [el, el.getBoundingClientRect()]));
  return () => {
    const r = reihe.getBoundingClientRect(), n = neu.getBoundingClientRect();
    // Die anderen, die jetzt neben ihr in derselben Zeile stehen, in ihrer Reihenfolge
    const neben = [...reihe.children].filter(el => vor.has(el) && !el.hidden).map(el => ({ el, a: vor.get(el), b: el.getBoundingClientRect() }))
      .filter(x => Math.abs(x.b.top - n.top) < 1);
    if (neu.hidden || !n.width || !neben.some(x => Math.abs(x.a.width - x.b.width) > 1)) return;
    const stil = getComputedStyle(reihe), luecke = parseFloat(stil.columnGap) || 0;
    reihe.style.position = 'relative';
    reihe.style.minHeight = r.height + 'px';
    Object.assign(neu.style, { position: 'absolute', left: n.left - r.left - reihe.clientLeft + 'px', top: n.top - r.top - reihe.clientTop + 'px', width: n.width + 'px', zIndex: 1 });
    // Ohne die neue stünden die anderen dicht an dicht ab dem Anfang der Reihe: Ein Rand links bringt jede
    // am Ende an ihren Platz von danach. Breite und Rand wachsen gleich schnell, so ist jede auf dem Weg dort.
    let x = parseFloat(stil.paddingLeft) || 0;
    const laeufe = neben.map(({ el, a, b }) => {
      const rand = b.left - r.left - reihe.clientLeft - x;
      x += rand + b.width + luecke;
      const von = { flexGrow: 0, flexShrink: 0, flexBasis: a.width + 'px', marginLeft: '0px' };
      const nach = { flexGrow: 0, flexShrink: 0, flexBasis: b.width + 'px', marginLeft: rand + 'px' };
      const bilder = reduce
        ? [{ ...von, opacity: 1 }, { ...von, opacity: 0, offset: .3 }, { ...von, opacity: 0, offset: .45 }, { ...nach, opacity: 0, offset: .45 }, { ...nach, opacity: 0, offset: .6 }, { ...nach, opacity: 1 }]
        : [von, nach];
      return el.animate(bilder, { duration: reduce ? 400 : 450, easing: reduce ? 'linear' : 'cubic-bezier(.3, .7, .4, 1)' }).finished.catch(() => {});
    });
    Promise.all(laeufe).then(() => {
      for (const p of ['position', 'left', 'top', 'width', 'zIndex']) neu.style[p] = '';
      reihe.style.position = '';
      reihe.style.minHeight = '';
    });
  };
}
// Steht unten in der Blase noch mehr, als sie zeigt (Lichtung: Handy, und quer am unteren Rand), verblasst die letzte Zeile
function rolltZeigen(say) {
  say.parentElement.classList.toggle('rollt', say.scrollHeight - say.scrollTop - say.clientHeight > 2);
}
// Aus einem Text werden Aufnahmen: bei Pieks eine, bei einem Lehrer (LEHRER in texte.js: das
// Hörnchen, der Otter) eine je Sprachstück, weil jede Aufnahme nur eine Sprache kennt. Die
// deutschen Stücke tragen sein Kürzel für Deutsch (hd, od), die anderen das seiner Sprache (hf, oi).
function clipVon(e, wer) {
  const l = LEHRER[wer];
  if (!l) return [sprechtext(e)];
  return segmente(e, l.sprache).map(x => ({ s: x.s, v: x.sprache === 'de' ? l.de : l.fremd }));
}
// Eine Figur sagt etwas, in ihrer Blase und mit ihrem Mund. Ein Teil ist ein
// Text aus den Listen oder { html, clip }: eine Vokabel-Aufnahme mit ihrer
// Anzeige. Gibt es nichts zu sagen oder ist die Figur nicht zu sehen, gilt
// es als gesagt (true).
function sagMehrAls(wer, teile, opt) {
  teile = teile.filter(Boolean);
  if (!teile.length || !zielAuf(wer)) return Promise.resolve(true);
  const html = [], clips = [];
  for (const e of teile) {
    // Ein Teil ohne Anzeige (etwa das Wort noch einmal langsam) spricht nur: sonst
    // stünde ein doppelter oder hängender Leerschlag in der Blase
    if (typeof e === 'object' && 'html' in e) { if (e.html) html.push(e.html); if (e.clip) clips.push(e.clip); }
    else { html.push(esc(anzeigetext(e))); clips.push(...clipVon(e, wer)); }
  }
  return ansage(html.join(' '), clips, opt);
}
const sagAls = (wer, e, opt) => sagMehrAls(wer, [e], opt);
// Pieks' Sätze laufen immer über ihn: so kommen sie nie aus ihrem Mund
const sag = (e, opt) => sagAls('p', e, opt);
const sagMehr = (teile, opt) => sagMehrAls('p', teile, opt);
// Die Figur schweigt: Blase ausblenden, Platz bleibt
function blaseLeeren() {
  if (!ziel.say) return;
  ziel.say.innerHTML = '';
  ziel.blase.classList.add('leer');
}

/* =====================================================================
   PIEKS ZEICHNEN UND ANZIEHEN
   Wer unterrichtet, ist auf Pieks' Ankerpunkten gezeichnet: jeder passt
   jedes Teil. Gekauft wird für alle, getragen wird getrennt (an, anH …,
   siehe FIGUREN).
   ===================================================================== */
function pieksEinsetzen(platz) {
  platz.innerHTML = pieksSVG();
  const svg = platz.querySelector('svg');
  anziehen(svg);
  return svg;
}
function anziehen(svg) {
  const f = FIGUREN[werVon(svg)], an = stand[f.an];
  for (const p of Object.keys(PLAETZE)) {
    const g = svg.querySelector('.slot-' + p);
    if (!g) continue;
    // Sitzt ein Teil bei ihr nicht ganz, rückt die Datei ihrer Figur es zurecht (ITEM_HOERNCHEN …)
    const id = an[p], zurecht = f.kurs && id && kursDa(f.kurs) && f.item(id);
    g.innerHTML = !id ? '' : zurecht ? `<g transform="${zurecht}">${ITEM_SVG[id]}</g>` : ITEM_SVG[id];
  }
}
function alleAnziehen() { document.querySelectorAll(Object.values(FIGUREN).map(f => 'svg.' + f.klasse).join(', ')).forEach(anziehen); }
// Jede Figur hat ihren eigenen Wecker: sonst bliebe die eine froh, sobald die andere staunt
const stimmungWecker = new WeakMap();
function stimmung(svg, m, ms) {
  if (!svg) return;
  svg.classList.remove('froh', 'oops', 'kitzel');
  void svg.getBoundingClientRect();
  clearTimeout(stimmungWecker.get(svg));
  if (!m) return;
  svg.classList.add(m);
  if (ms) stimmungWecker.set(svg, setTimeout(() => svg.classList.remove(m), ms));
}

/* =====================================================================
   LANDSCHAFT: Sterne, Waldrand, Laub am Boden, fallende Blätter
   ===================================================================== */
function landschaft() {
  // Sterne
  let st = '';
  for (let i = 0; i < 70; i++) {
    st += `<circle cx="${rnd(0, 1000)}" cy="${rnd(0, 380)}" r="${(Math.random() * 1.6 + 0.6).toFixed(1)}" style="animation-delay:-${(Math.random() * 3).toFixed(2)}s"/>`;
  }
  $('sterne').innerHTML = st;
  // Waldrand: Tannen und Laubbäume im Wechsel, gezogen wie immer von 0 bis 1200. Breite Fenster
  // sehen mehr (viewBox ab -2400): Dort steht dieselbe Reihe noch einmal, ohne neuen Zufall,
  // denn jeder Wurf mehr gäbe danach andere Aufgaben und Besucher.
  const baeume = [];
  let x = -10;
  for (; x < 1220; x += rnd(26, 44)) {
    const h = rnd(70, 130), tanne = Math.random() < 0.55;
    baeume.push({ x, h, tanne, farbe: tanne ? '' : pick(['var(--wald2)', 'var(--laub1)', 'var(--laub3)', 'var(--wald2)']) });
  }
  const reihe = x + 10;   // so lang ist die Reihe: dort stünde der nächste Baum
  // Die Reihe von 0 bis 1200 zuletzt: Sie steht vorn und sieht aus wie bisher
  let w = '';
  for (const k of [-2, -1, 1, 2, 0]) {
    for (const b of baeume) {
      const bx = b.x + k * reihe, h = b.h, y = 160;
      if (bx < -2450 || bx > 3650) continue;
      if (b.tanne) {
        w += `<path d="M${bx} ${y - h} L${bx + h * 0.28} ${y} L${bx - h * 0.28} ${y} Z" fill="var(--tanne)" opacity=".85"/>`;
      } else {
        w += `<rect x="${bx - 3}" y="${y - h * 0.45}" width="6" height="${h * 0.45}" fill="#6B4A2E" opacity=".7"/><circle cx="${bx}" cy="${y - h * 0.55}" r="${h * 0.3}" fill="${b.farbe}" opacity=".9"/>`;
      }
    }
  }
  $('waldrand').innerHTML = w;
  // Am Boden: Herbstlaub, im Frühling und Sommer Blumen
  const s = saison(), boden = $('bodenLaub');
  boden.innerHTML = '';
  const anzahl = s === 'winter' ? 0 : 16;
  for (let i = 0; i < anzahl; i++) {
    const el = document.createElementNS(SVGNS, 'svg');
    el.setAttribute('viewBox', '0 0 40 40');
    const gr = rnd(14, 26);
    Object.assign(el.style, { left: rnd(0, 98) + '%', top: rnd(4, 92) + '%', width: gr + 'px', height: gr + 'px', transform: `rotate(${rnd(0, 360)}deg)`, opacity: 0.85 });
    if (s === 'herbst') el.innerHTML = `<use href="#${pick(['blatt-ahorn', 'blatt-eiche'])}" color="${pick(['#E8742B', '#D9432F', '#F2B33D', '#C2562A'])}"/>`;
    else el.innerHTML = `<g fill="${pick(['#fff', '#FF9EC4', '#FFD43B', '#B48CFF'])}"><circle cx="20" cy="13" r="6"/><circle cx="27" cy="18" r="6"/><circle cx="24" cy="26" r="6"/><circle cx="16" cy="26" r="6"/><circle cx="13" cy="18" r="6"/></g><circle cx="20" cy="20" r="4.4" fill="#FFC21F"/>`;
    boden.appendChild(el);
  }
  fallen();
}
// Fallende Blätter im Herbst, Schnee im Winter, Blüten im Frühling, Glühwürmchen in Sommernächten
function fallen() {
  const r = $('regen');
  r.innerHTML = '';
  if (reduce) return;
  const s = saison(), z = tageszeit();
  if (s === 'sommer') {
    if (z !== 'nacht' && z !== 'abend') return;
    for (let i = 0; i < 14; i++) {
      const g = document.createElement('i');
      g.className = 'glueh';
      Object.assign(g.style, { left: rnd(2, 98) + '%', top: rnd(55, 92) + '%', animationDelay: -Math.random() * 3 + 's' });
      r.appendChild(g);
      g.animate([{ transform: 'translate(0,0)' }, { transform: `translate(${rnd(-40, 40)}px, ${rnd(-30, 30)}px)` }, { transform: 'translate(0,0)' }],
        { duration: rnd(5000, 9000), iterations: Infinity, easing: 'ease-in-out' });
    }
    return;
  }
  const n = s === 'winter' ? 34 : 9;
  for (let i = 0; i < n; i++) {
    const el = document.createElementNS(SVGNS, 'svg');
    el.setAttribute('class', 'teil');
    el.setAttribute('viewBox', '0 0 40 40');
    let gr;
    if (s === 'winter') { gr = rnd(5, 11); el.innerHTML = '<circle cx="20" cy="20" r="18" fill="#fff" opacity=".9"/>'; }
    else if (s === 'fruehling') { gr = rnd(10, 16); el.innerHTML = '<path d="M20 4 C30 10 30 26 20 36 C10 26 10 10 20 4 Z" fill="#FFC2D9"/>'; }
    else { gr = rnd(16, 26); el.innerHTML = `<use href="#${pick(['blatt-ahorn', 'blatt-eiche'])}" color="${pick(['#E8742B', '#D9432F', '#F2B33D', '#C2562A'])}"/>`; }
    el.style.width = el.style.height = gr + 'px';
    el.style.left = rnd(0, 100) + 'vw';
    r.appendChild(el);
    const dauer = s === 'winter' ? rnd(9000, 16000) : rnd(11000, 19000);
    const seit = rnd(-80, 80), dreh = s === 'winter' ? 0 : rnd(-540, 540);
    el.animate([
      { transform: 'translate(0, -40px) rotate(0deg)' },
      { transform: `translate(${seit}px, 50vh) rotate(${dreh / 2}deg)`, offset: 0.5 },
      { transform: `translate(${-seit / 2}px, calc(100vh + 40px)) rotate(${dreh}deg)` },
    ], { duration: dauer, delay: -Math.random() * dauer, iterations: Infinity, easing: 'linear' });
  }
}

/* =====================================================================
   OBERFLÄCHE: Lichtung, Rechentraining und die Sprachkurse
   ===================================================================== */
let bildschirm = 'lichtung';   // 'lichtung' | 'training' | 'franz' (der Bildschirm der Sprachkurse, franz.js)
let heldSVG = null, dockSVG = null;
const sitzung = { thema: 'brueche', stufe: 'easy', nr: 0 };

function zeigeBildschirm(name) {
  bildschirm = name;
  $('lichtung').hidden = name !== 'lichtung';
  $('training').hidden = name !== 'training';
  if ($('franz')) $('franz').hidden = name !== 'franz';
  document.body.classList.toggle('auf-lichtung', name === 'lichtung');
  document.body.classList.toggle('im-training', name === 'training');
  document.body.classList.toggle('im-franz', name === 'franz');
  // In einem Kurs gehört die Blase zuerst seiner Lehrerin, sonst Pieks
  const a = name === 'franz' ? aktiverKurs() : null;
  zielAuf(a ? a.lehrer : 'p');
  Besuch.platzWechsel();
}

function themenZeichnen() {
  const box = $('themen');
  box.innerHTML = '';
  for (const [id, th] of Object.entries(THEMEN)) {
    const gel = id === 'mix' ? null : stand.geloest[id];
    const el = document.createElement('div');
    el.className = 'thema';
    el.innerHTML = `
      <button type="button" class="thema-start" data-thema="${id}" aria-label="${th.name} üben">
        <svg viewBox="0 0 80 80" aria-hidden="true"><use href="#${th.icon}"/></svg>
        <span class="t-name">${th.name}</span>
        <span class="t-info">${gel ? gel + ' gelöst · ' : ''}${th.info}</span>
        <span class="los-pfeil" aria-hidden="true"><svg viewBox="0 0 32 32"><use href="#i-weiter"/></svg></span>
      </button>
      <div class="stufen" role="radiogroup" aria-label="Schwierigkeit">
        ${STUFEN_REIHE.map(s => `<button type="button" class="stufe-btn${stand.stufe[id] === s ? ' an' : ''}" data-thema="${id}" data-stufe="${s}" role="radio" aria-checked="${stand.stufe[id] === s}">${STUFEN[s]}</button>`).join('')}
      </div>`;
    box.appendChild(el);
  }
}
$('themen').addEventListener('click', e => {
  const sb = e.target.closest('.stufe-btn');
  if (sb) {
    stand.stufe[sb.dataset.thema] = sb.dataset.stufe;
    speichern();
    Ton.tipp();
    themenZeichnen();
    return;
  }
  const st = e.target.closest('.thema-start');
  if (st) trainingStarten(st.dataset.thema, stand.stufe[st.dataset.thema]);
});

function trainingStarten(thema, stufe, still) {
  audio();
  const gleich = A && A.thema === thema && A.stufe === stufe && !A.geloest;
  sitzung.thema = thema;
  sitzung.stufe = stufe;
  stand.stufe[thema] = stufe;
  speichern();
  zeigeBildschirm('training');
  kopfZeigen();
  if (gleich) {
    // dieselbe offene Aufgabe weiterrechnen
    sag(zieh('neue_aufgabe'));
    return;
  }
  sitzung.nr = 0;
  serie = 0;
  vorschlagGemacht = { hoch: false, runter: false };
  hochZaehler = 0; runterZaehler = 0;
  neueAufgabe(true);
  if (still) return;
  const teile = [zieh('thema_' + thema)];
  if (stufe === 'hard' && Math.random() < 0.6) teile.push(zieh('start_schwer'));
  if (!stand.ersteTraining) { teile.push(TEXTE.erstes_training[0]); stand.ersteTraining = true; speichern(); }
  sagMehr(teile);
}

// wer: wer auf der Lichtung etwas sagt. Genau eine Figur, denn zwei Sätze
// hintereinander fielen einander ins Wort: nach einem Kurs seine Lehrerin ('h' …).
function zurLichtung(wer = 'p') {
  Stimme.stopp();
  notizZu();
  $('stufenMenue').hidden = true;
  zeigeBildschirm('lichtung');
  themenZeichnen();
  kopfZeigen();
  const m = kursVon(wer);
  if (m) return sagAls(wer, m.zeile('h_lichtung'));
  // Steht jemand neben ihm, redet Pieks manchmal über alle, die da sind: neben einem Freund über beide
  // (p_lichtung_zwei aus dessen Kurs), neben zweien über alle drei (p_lichtung_drei aus dem Kurs des
  // Freundes, der zuletzt dazukam). Fehlt dem Kurs die Liste, sagt er, was er sonst sagt.
  const freunde = Object.keys(FIGUREN).filter(w => w !== 'p' && figurDa(w));
  const ueberAlle = () => (freunde.length > 1 ? kursVon(freunde[freunde.length - 1]).zeile('p_lichtung_drei') : kursVon(freunde[0]).zeile('p_lichtung_zwei'));
  return sag((freunde.length && Math.random() < 0.2 && ueberAlle()) || zieh('lichtung'));
}

/* ---------- Kopfzeile ---------- */
function kopfZeigen() {
  $('aepfelN').textContent = stand.aepfel;
  if ($('kasseN')) $('kasseN').textContent = stand.aepfel;
  const h = heuteGeloest(), z = stand.ziel;
  $('zielN').textContent = Math.min(h, z) + '/' + z;
  $('zielRing').style.strokeDashoffset = (88 * (1 - Math.min(1, h / z))).toFixed(1);
  $('ziel').classList.toggle('geschafft', h >= z);
  // Fürs Tagesziel zählt beides: eine Rechenaufgabe oder ein Wort (jede Karte einmal pro Runde)
  $('ziel').title = kurseDa().length ? `Tagesziel: ${z} Aufgaben oder Wörter (heute ${h})` : `Tagesziel: ${z} Aufgaben (heute ${h} gelöst)`;
  const r = rangVon(stand.gesamt), nr = RAENGE.indexOf(r), naechster = RAENGE[nr + 1];
  $('rangNr').textContent = nr + 1;
  $('rangName').textContent = r.name;
  $('rangBalken').style.width = (naechster ? clamp((stand.gesamt - r.ab) / (naechster.ab - r.ab), 0, 1) * 100 : 100) + '%';
  $('rang').setAttribute('aria-label', `Rang ${nr + 1}: ${r.name}`);
  const a = bildschirm === 'franz' ? aktiverKurs() : null;
  if (a) {
    // Ein Kurs kennt weder Thema noch Stufe: der Knopf zeigt sein Zeichen und wo die Runde steht
    const c = a.modul().chip();
    $('themaIcon').querySelector('use').setAttribute('href', '#' + c.icon);
    $('themaName').textContent = c.name;
    $('stufeName').textContent = c.klein;
  } else {
    const th = THEMEN[sitzung.thema];
    $('themaIcon').querySelector('use').setAttribute('href', '#' + th.icon);
    $('themaName').textContent = th.name;
    $('stufeName').textContent = STUFEN[sitzung.stufe];
  }
  serieZeigen();
  $('albumNeu').hidden = !neuImAlbum;
  const leistbar = Object.entries(ITEMS).some(([k, it]) => !stand.items.includes(k) && it.preis <= stand.aepfel);
  $('garderobeNeu').hidden = !leistbar;
  // Die Karte jedes Kurses zeigt, was heute wartet
  if (bildschirm === 'lichtung') for (const k of kurseDa()) k.modul().karteZeichnen();
}
// Die Serie gilt für beide Fächer und zeigt sich in beiden
function serieZeigen() {
  $('serie').hidden = serie < 2 || bildschirm === 'lichtung';
  $('serieN').textContent = serie;
  $('serie').classList.toggle('heiss', serie >= 5);
}
const rangVon = gesamt => RAENGE.filter(r => gesamt >= r.ab).pop();
function zaehlerHuepft(id) {
  const k = $(id);
  k.classList.remove('bump');
  void k.offsetWidth;
  k.classList.add('bump');
}

/* =====================================================================
   TRAINING: eine Aufgabe nach der anderen
   ===================================================================== */
let A = null;           // die aktuelle Aufgabe mit allem, was dazugehört
let serie = 0;          // richtig hintereinander, ohne Fehler
let hochZaehler = 0, runterZaehler = 0, vorschlagGemacht = { hoch: false, runter: false };
let warteTimer = 0;
let neuImAlbum = false;
const BASIS = { easy: 3, medium: 4, hard: 5 };

function neueAufgabe(ersteDerRunde) {
  const t = Aufgaben.neue(sitzung.thema, sitzung.stufe);
  sitzung.nr++;
  A = {
    t, thema: sitzung.thema, stufe: sitzung.stufe,
    felder: t.answerType === 'fraction' ? [{ wert: '' }, { wert: '' }] : [{ wert: '' }],
    aktiv: 0, ueber: false,
    fehler: 0, tipps: 0, schritte: 0, loesungGezeigt: false, geloest: false, gewartet: false,
  };
  $('dock').classList.remove('fertig');
  $('loesungBtn').hidden = true;
  $('faktKarte').hidden = true;
  $('loesungsweg').hidden = true;
  $('loesungsweg').innerHTML = '';
  $('aufgabeNr').textContent = 'Aufgabe ' + sitzung.nr;
  notizLeeren();
  aufgabeZeichnen();
  belohnungZeigen();
  tastenZeigen();
  wachHalten();
  $('karte').scrollTop = 0;
  if (!ersteDerRunde && Math.random() < 0.3) sag(zieh('neue_aufgabe'));
  else if (!ersteDerRunde) blaseLeeren();
  // Was gleich gebraucht wird, schon mal holen
  if (TIPPS[t.hint]) Stimme.vorladen([sprechtext(TIPPS[t.hint])]);
}

function aufgabeZeichnen() {
  const t = A.t;
  $('frage').innerHTML = t.text || '';
  const feld = i => `<span class="feld" data-i="${i}" role="button" tabindex="0" aria-label="${A.t.answerType === 'fraction' ? (i ? 'Nenner' : 'Zähler') : 'Antwort'}"><span class="wert"></span><i class="caret"></i></span>`;
  let w;
  if (t.answerType === 'fraction') w = `<span class="antwort bruch" id="antwort"><span class="bruchfeld">${feld(0)}<span class="strich"></span>${feld(1)}</span></span>`;
  else w = `<span class="antwort" id="antwort">${feld(0)}${t.correctUnit ? `<span class="einheit">${esc(t.correctUnit)}</span>` : ''}</span>`;
  $('rechnung').innerHTML = (t.equation ? t.equation + ' ' : '<span class="antwort-label">Antwort:</span>') + w;
  felderZeigen();
}
function felderZeigen() {
  const box = $('antwort');
  if (!box) return;
  box.querySelectorAll('.feld').forEach((f, i) => {
    f.querySelector('.wert').textContent = A.felder[i].wert;
    f.classList.toggle('aktiv', i === A.aktiv && !A.geloest);
  });
}
function belohnungZeigen() {
  const n = belohnung();
  $('belohnungN').textContent = '+' + n;
  $('belohnung').classList.toggle('weniger', n < BASIS[A.stufe]);
}
// So viele Äpfel gibt die Aufgabe gerade: weniger mit Fehlern und Tipps, mindestens 1
function belohnung() {
  if (A.loesungGezeigt) return 1;
  return Math.max(1, BASIS[A.stufe] - A.fehler - A.tipps);
}
function tastenZeigen() {
  const bruch = A.t.answerType === 'fraction';
  document.querySelector('.taste.punkt').disabled = bruch;
  const b = document.querySelector('.taste.bruch');
  b.disabled = !bruch;
  const unten = bruch && A.aktiv === 1;
  b.querySelector('use').setAttribute('href', unten ? '#i-zaehler' : '#i-nenner');
  b.querySelector('span').textContent = unten ? 'Zähler' : 'Nenner';
  b.setAttribute('aria-label', unten ? 'Zum Zähler' : 'Zum Nenner');
}

/* ---------- Eingabe ---------- */
function ziffer(d) {
  if (!A || A.geloest) return;
  const f = A.felder[A.aktiv], bruch = A.t.answerType === 'fraction';
  if (A.ueber) { A.felder.forEach(x => { x.wert = ''; }); A.ueber = false; $('antwort').classList.remove('falsch'); }
  if (d === '.') {
    if (bruch || f.wert.includes('.')) return;
    f.wert = (f.wert || '0') + '.';
  } else {
    if (f.wert.replace('.', '').length >= (bruch ? 4 : 8)) return;
    if (f.wert === '0') f.wert = '';
    f.wert += d;
  }
  Ton.taste();
  felderZeigen();
  wachHalten();
}
function loeschen() {
  if (!A || A.geloest) return;
  if (A.ueber) { A.felder.forEach(x => { x.wert = ''; }); A.ueber = false; $('antwort').classList.remove('falsch'); felderZeigen(); return; }
  const f = A.felder[A.aktiv];
  if (!f.wert && A.aktiv === 1) { A.aktiv = 0; tastenZeigen(); felderZeigen(); return; }
  f.wert = f.wert.slice(0, -1);
  Ton.taste();
  felderZeigen();
}
function feldWechseln(i) {
  if (!A || A.geloest || A.t.answerType !== 'fraction') return;
  A.aktiv = i === undefined ? 1 - A.aktiv : i;
  if (A.ueber) { A.ueber = false; A.felder.forEach(x => { x.wert = ''; }); $('antwort').classList.remove('falsch'); }
  Ton.tipp();
  tastenZeigen();
  felderZeigen();
}

/* ---------- Prüfen ---------- */
function bewerten() {
  const t = A.t;
  if (t.answerType === 'fraction') {
    const zs = A.felder[0].wert, ns = A.felder[1].wert;
    const [cn, cd] = Aufgaben.simplify(t.correctNum, t.correctDen);
    if (!zs && !ns) return { art: 'leer' };
    if (!zs) return { art: 'zaehler_fehlt' };
    const z = parseInt(zs, 10);
    if (!ns) {
      // Ganze Zahl als Antwort ist erlaubt, wenn das Ergebnis ganz ist
      if (cd === 1) return z === cn ? { art: 'richtig' } : { art: 'falsch', z, n: 1 };
      return { art: 'nenner_fehlt' };
    }
    const n = parseInt(ns, 10);
    if (n === 0) return { art: 'nenner_null' };
    if (z * t.correctDen === t.correctNum * n) return Aufgaben.gcd(z, n) !== 1 ? { art: 'kuerzen', z, n } : { art: 'richtig' };
    return { art: 'falsch', z, n };
  }
  const ws = A.felder[0].wert;
  if (!ws || ws === '0.') return { art: 'leer' };
  const v = parseFloat(ws);
  return Math.abs(v - t.correctValue) < 0.005 ? { art: 'richtig' } : { art: 'falsch', v };
}
// Typische Verwechslungen gezielt ansprechen
function diagnose(r) {
  const t = A.t, d = t.diag || {};
  if (t.answerType === 'fraction' && r.n) {
    if ((t.kind === 'addDiff' || t.kind === 'addSame') && r.z === d.a + d.b && r.n === d.d1 + d.d2) return 'falsch_nenner_addiert';
    if (t.kind === 'divFrac' && r.z * d.d1 * d.d2 === d.a * d.b * r.n) return 'falsch_kehrwert';
    return null;
  }
  if (r.v === undefined) return null;
  const c = t.correctValue, nah = x => Math.abs(x - c) <= 1e-9 + 0.0005 * c;
  if ([10, 100, 1000].some(f => nah(r.v * f) || nah(r.v / f))) return 'falsch_einheit';
  if ((c >= 10 && Math.abs(r.v - c) <= 1) || Math.abs(r.v - c) / c <= 0.03) return 'falsch_knapp';
  return null;
}
function pruefen() {
  if (!A || A.geloest) return;
  const r = bewerten();
  const box = $('antwort');
  const hinweis = (name, feldNr) => {
    box.classList.remove('wackelt');
    void box.offsetWidth;
    box.classList.add('wackelt');
    if (feldNr !== undefined) { A.aktiv = feldNr; tastenZeigen(); felderZeigen(); }
    sag(zieh(name));
  };
  if (r.art === 'leer') return hinweis('falsch_leer', 0);
  if (r.art === 'zaehler_fehlt') return hinweis('falsch_zaehler_fehlt', 0);
  if (r.art === 'nenner_fehlt') return hinweis('falsch_nenner_fehlt', 1);
  if (r.art === 'nenner_null') return hinweis('nenner_null', 1);
  if (r.art === 'richtig') return geloest();

  // falsch (oder noch nicht gekürzt)
  A.fehler++;
  hochZaehler = 0;
  verfehlt('mathe');
  Ton.falsch();
  stimmung(dockSVG, 'oops', 1400);
  box.classList.remove('wackelt', 'pop');
  void box.offsetWidth;
  box.classList.add('wackelt', 'falsch');
  A.ueber = true;           // die nächste Ziffer ersetzt die falsche Antwort
  A.aktiv = 0;
  tastenZeigen();
  felderZeigen();
  belohnungZeigen();
  if (A.loesungGezeigt) { sag(zieh('falsch')); return; }
  if (r.art === 'kuerzen') { sag(zieh('falsch_kuerzen')); return; }
  if (A.fehler >= 3) { loesungZeigen(); return; }
  if (A.fehler === 2) $('loesungBtn').hidden = false;
  const diag = diagnose(r);
  if (diag) sag(zieh(diag));
  else sag(zieh(A.fehler === 1 || A.tipps > 0 ? 'falsch' : 'falsch_zweimal'));
}

/* ---------- Tipps und Lösungsweg ---------- */
function tipp() {
  if (!A || A.geloest) return;
  Ton.tipp();
  const steps = A.t.steps || [];
  if (A.tipps === 0 || (!steps.length && !A.loesungGezeigt)) {
    // Erster Tipp: was Pieks dazu weiss
    const tp = TIPPS[A.t.hint] || TIPPS.HD;
    if (A.tipps === 0) A.tipps = 1;
    belohnungZeigen();
    if (A.thema === 'volumen' || ['vUmrechnen', 'vMisch', 'volumenText'].includes(A.t.kind)) treppeZeigen();
    sagMehr([zieh('tipp_vor'), tp]);
    return;
  }
  // Weitere Tipps: ein Schritt des Lösungswegs mehr, aber nie das Ergebnis
  if (A.schritte < steps.length - 1 && !A.loesungGezeigt) {
    A.schritte++;
    A.tipps++;
    belohnungZeigen();
    wegZeigen(A.schritte, false);
    sag(zieh('tipp_schritt'));
    return;
  }
  sag(zieh('tipp_genug'));
}
function treppeZeigen() {
  const w = $('loesungsweg');
  if (w.querySelector('.liter-treppe')) return;
  const t = document.createElement('div');
  t.innerHTML = `<h3>Die Liter-Treppe</h3><div class="liter-treppe">
    <span class="stufe">hl</span><span class="pfeil">· 100 →</span><span class="stufe">l</span><span class="pfeil">· 10 →</span>
    <span class="stufe">dl</span><span class="pfeil">· 10 →</span><span class="stufe">cl</span><span class="pfeil">· 10 →</span><span class="stufe">ml</span></div>
    <div class="klein">Nach rechts (kleinere Einheit) mal, nach links durch.</div>`;
  w.prepend(t);
  w.hidden = false;
}
// Zeigt die ersten n Schritte; mitLoesung hängt das Ergebnis an
function wegZeigen(n, mitLoesung) {
  const w = $('loesungsweg'), steps = A.t.steps || [];
  w.querySelectorAll('.weg').forEach(x => x.remove());
  const box = document.createElement('div');
  box.className = 'weg';
  let html = `<h3>${mitLoesung ? (steps.length ? 'Lösungsweg' : 'Lösung') : n === 1 ? 'Erster Schritt' : 'Die ersten Schritte'}</h3>`;
  steps.slice(0, n).forEach(s => { html += `<div class="schritt"><span class="txt">${s.txt}</span><span class="math">${s.math}</span></div>`; });
  if (mitLoesung) html += `<div class="loesung-zeile">${steps.length ? 'Lösung: ' : ''}${loesungHTML()}</div>`;
  box.innerHTML = html;
  w.appendChild(box);
  w.hidden = false;
  if (mitLoesung) w.scrollIntoView({ block: 'nearest', behavior: reduce ? 'auto' : 'smooth' });
}
function loesungHTML() {
  const t = A.t;
  if (t.answerType === 'fraction') {
    const [n, d] = Aufgaben.simplify(t.correctNum, t.correctDen);
    return d === 1 ? String(n) : Aufgaben.fracHTML(n, d);
  }
  return zahlText(t.correctValue) + (t.correctUnit ? ' ' + esc(t.correctUnit) : '');
}
function loesungZeigen() {
  if (!A || A.geloest) return;
  A.loesungGezeigt = true;
  $('loesungBtn').hidden = true;
  runterZaehler++;
  belohnungZeigen();
  wegZeigen((A.t.steps || []).length, true);
  A.felder.forEach(x => { x.wert = ''; });
  A.ueber = false;
  A.aktiv = 0;
  $('antwort').classList.remove('falsch');
  tastenZeigen();
  felderZeigen();
  const gesagt = sag(zieh('loesung'));
  // Nach zwei Lösungen hintereinander eine leichtere Stufe anbieten, aber erst
  // wenn Pieks den Lösungsweg fertig angesagt hat
  if (runterZaehler >= 2 && sitzung.stufe !== 'easy' && !vorschlagGemacht.runter) {
    vorschlagGemacht.runter = true;
    const diese = A;
    gesagt.then(ganz => { if (ganz && A === diese && !A.geloest) stufeVorschlagen(-1); });
  }
}

// Nach einer Weile ohne Tippen bietet Pieks Hilfe an
function wachHalten() {
  clearTimeout(warteTimer);
  if (!A || A.geloest || A.gewartet || bildschirm !== 'training') return;
  warteTimer = setTimeout(function nachfragen() {
    if (!A || A.geloest || bildschirm !== 'training' || !$('fenster').hidden) return;
    // Erzählt Pieks gerade etwas, später nochmal schauen
    if (!Stimme.istStill()) { warteTimer = setTimeout(nachfragen, 5000); return; }
    A.gewartet = true;
    sag(zieh('warten'));
  }, 75000);
}

/* ---------- Geschafft ---------- */
function geloest() {
  const diese = A;
  A.geloest = true;
  clearTimeout(warteTimer);
  const ersterVersuch = A.fehler === 0 && !A.loesungGezeigt;
  const box = $('antwort');
  box.classList.remove('wackelt', 'falsch');
  box.classList.add('richtig');
  void box.offsetWidth;
  box.classList.add('pop');
  felderZeigen();
  Ton.richtig();
  stimmung(dockSVG, 'froh', 1600);
  $('loesungBtn').hidden = true;

  // Zuerst, was nur das Rechnen zählt: die Erfolge lesen es gleich in belohnen()
  const aepfel = belohnung();
  stand.geloest[A.t.topic] = (stand.geloest[A.t.topic] || 0) + 1;
  if (A.stufe === 'hard') stand.schwer++;
  if (ersterVersuch) { if (A.tipps === 0) hochZaehler++; runterZaehler = 0; } else hochZaehler = 0;
  if (!A.loesungGezeigt && A.fehler < 3) runterZaehler = 0;
  const f = belohnen({ aepfel, von: box, ersterVersuch, fach: 'mathe', kontext: { durchhalten: A.fehler >= 2 && !A.loesungGezeigt } });

  // «Weiter» erst nach einem Moment, damit ein Doppeltipp die Feier nicht überspringt
  setTimeout(() => { if (A === diese) $('dock').classList.add('fertig'); }, 450);
  feiern(diese, f);
}

// Nacheinander: Lob, Serie, Tagesziel, Rang, Erfolge, Vorschlag, Fakt.
// Geht es vorher weiter, hört die Feier einfach auf.
async function feiern(diese, f) {
  const gilt = () => A === diese && bildschirm === 'training';
  let lob;
  if (diese.loesungGezeigt) lob = zieh('richtig_nachloesung');
  else if (diese.fehler > 0) lob = zieh('richtig_nachfehler');
  else if (diese.stufe === 'hard' && Math.random() < 0.3) lob = zieh('richtig_schwer');
  else lob = zieh('richtig');
  if (!(await sag(lob)) || !gilt()) return;
  if (await meldungenFeiern(f, gilt)) return;
  // Zu leicht? Dann die nächste Stufe anbieten
  if (hochZaehler >= 8 && sitzung.stufe !== 'hard' && !vorschlagGemacht.hoch) {
    vorschlagGemacht.hoch = true;
    await stufeVorschlagen(1);
    return;
  }
  if (stand.nachRichtig >= 3) {
    stand.nachRichtig = 0;
    speichern();
    await pause(250);
    if (!gilt()) return;
    faktErzaehlen();
  }
}

function weiter() {
  if (!A || !A.geloest || !$('dock').classList.contains('fertig')) return;
  Stimme.stopp();
  neueAufgabe();
}

// Bietet eine andere Stufe an: Knöpfe in der Sprechblase
function stufeVorschlagen(richtung) {
  const neu = STUFEN_REIHE[STUFEN_REIHE.indexOf(sitzung.stufe) + richtung];
  if (!neu) return Promise.resolve(true);
  const e = zieh(richtung > 0 ? 'vorschlag_hoch' : 'vorschlag_runter');
  const html = esc(anzeigetext(e)) + `<span class="knopf-zeile"><button type="button" class="mini" data-stufe="${neu}">Ja, ${STUFEN[neu]}!</button><button type="button" class="mini leise" data-stufe="">Nein, weiter so</button></span>`;
  return ansage(html, [sprechtext(e)]);
}
document.addEventListener('click', e => {
  const b = e.target.closest('.blase .mini');
  if (!b) return;
  e.stopPropagation();
  // Knöpfe einer Lehrerin tragen data-fr-…: die kennt der Kurs, der auf der Bühne unterrichtet (es gibt sie nur dort)
  if (Object.keys(b.dataset).some(k => /^fr[A-Z]/.test(k))) { const a = bildschirm === 'franz' ? aktiverKurs() : null; if (a) a.modul().blasenKnopf(b); return; }
  if (b.dataset.stufe) stufeWechseln(b.dataset.stufe);
  else { Stimme.stopp(); blaseLeeren(); }
}, true);
function stufeWechseln(neu, thema) {
  $('stufenMenue').hidden = true;
  Ton.tipp();
  trainingStarten(thema || sitzung.thema, neu, true);
  sag(zieh('stufe_gewechselt'));
}

/* =====================================================================
   BELOHNUNGEN: Äpfel, Ränge, Erfolge, Fakten
   Eine gemeinsame Kasse für Mathe und Französisch: dieselben Äpfel,
   dieselbe Serie, dasselbe Tagesziel, dieselben Ränge und Erfolge.
   ===================================================================== */
// Eine gelöste, beurteilte Aufgabe verbuchen. aepfel: was die Aufgabe selbst
// bringt; von: das Element, von dem die Äpfel losfliegen; ersterVersuch: ohne
// Fehler gelöst (nur dann wächst die Serie); fach: 'mathe' oder 'fr';
// zaehlt false: nicht fürs Tagesziel; kontext: Zusätze für die Erfolge.
// Zurück kommt, was es zu feiern gibt (siehe meldungenFeiern).
function belohnen({ aepfel, von, ersterVersuch, fach, zaehlt = true, kontext = {} }) {
  const vorher = { rang: rangVon(stand.gesamt), heute: heuteGeloest() };
  ergebnisMerken(true, ersterVersuch, fach, zaehlt);
  if (ersterVersuch) serie++; else serie = 0;
  stand.besterLauf = Math.max(stand.besterLauf, serie);
  const serieBonus = { 5: 5, 10: 10, 15: 10, 20: 15, 25: 15, 30: 20, 40: 25, 50: 30 }[serie] || 0;
  const zielJetzt = zaehlt && vorher.heute < stand.ziel && vorher.heute + 1 >= stand.ziel;
  if (zielJetzt) stand.zielTage[heuteKey()] = true;
  stand.nachRichtig++;
  apfelDazu(aepfel + serieBonus + (zielJetzt ? 15 : 0), von);
  const neueErfolge = pruefeErfolge(Object.assign({}, kontext, { stunde: new Date().getHours(), ziel: zielJetzt }));
  const rangNeu = rangVon(stand.gesamt) !== vorher.rang;
  speichern();
  serieZeigen();
  return { serie, serieBonus, zielJetzt, rangNeu, neueErfolge };
}
// Äpfel ohne gelöste Aufgabe (im Französisch: Nachsprechen, Paare, Nachbauen,
// Rundenbonus). Weder Statistik noch Serie, aber Rang und Erfolge können fallen.
function aepfelGeben(n, von, kontext = {}) {
  const rang = rangVon(stand.gesamt);
  apfelDazu(n, von);
  const neueErfolge = pruefeErfolge(kontext);
  const rangNeu = rangVon(stand.gesamt) !== rang;
  speichern();
  return { rangNeu, neueErfolge };
}
// Eine falsche Antwort: die Serie reisst, der Versuch zählt in der Statistik
function verfehlt(fach) {
  serie = 0;
  serieZeigen();
  ergebnisMerken(false, false, fach);
}

function apfelDazu(n, von) {
  if (n <= 0) return;
  stand.aepfel += n;
  stand.gesamt += n;
  const zielEl = $('apfelZiel');
  const a = von && von.getBoundingClientRect(), z = zielEl.getBoundingClientRect();
  const anzeigen = () => { $('aepfelN').textContent = stand.aepfel; zaehlerHuepft('aepfel'); kopfZeigen(); };
  if (!a || !a.width || reduce || !z.width) { anzeigen(); return; }
  plusText('+' + n, a.left + a.width / 2, a.top);
  const fliegen = Math.min(n, 6);
  let angekommen = 0;
  for (let i = 0; i < fliegen; i++) {
    const f = document.createElementNS(SVGNS, 'svg');
    f.setAttribute('viewBox', '0 0 40 40');
    f.innerHTML = '<use href="#apfel"/>';
    const x0 = a.left + a.width / 2 - 14 + rnd(-30, 30), y0 = a.top + a.height / 2 - 14 + rnd(-14, 14);
    Object.assign(f.style, { position: 'fixed', left: x0 + 'px', top: y0 + 'px', width: '28px', height: '28px', zIndex: 26, pointerEvents: 'none' });
    document.body.appendChild(f);
    const dx = z.left + z.width / 2 - (x0 + 14), dy = z.top + z.height / 2 - (y0 + 14);
    f.animate([
      { transform: 'translate(0,0) scale(.4)', opacity: 0 },
      { transform: `translate(${dx * 0.2}px, ${dy * 0.2 - 60}px) scale(1.2)`, opacity: 1, offset: 0.35 },
      { transform: `translate(${dx}px, ${dy}px) scale(.8)`, opacity: 1 },
    ], { duration: 800, delay: i * 90, easing: 'ease-in-out', fill: 'both' }).onfinish = () => {
      f.remove();
      Ton.apfel(angekommen++);
      if (angekommen === fliegen) anzeigen();
    };
  }
  setTimeout(anzeigen, 800 + fliegen * 90 + 400);
}
function plusText(t, x, y) {
  if (reduce) return;
  const el = document.createElement('div');
  el.className = 'plus-text';
  el.textContent = t;
  Object.assign(el.style, { left: x + 'px', top: y + 'px' });
  $('fx').appendChild(el);
  el.animate([{ transform: 'translate(-50%, 0) scale(.6)', opacity: 0 }, { transform: 'translate(-50%, -30px) scale(1.15)', opacity: 1, offset: 0.25 }, { transform: 'translate(-50%, -70px)', opacity: 0 }],
    { duration: 1400, easing: 'ease-out', fill: 'both' }).onfinish = () => el.remove();
}
function konfetti() {
  if (reduce) return;
  const fx = $('fx');
  const arten = ['apfel', 'blatt-ahorn', 'blatt-eiche', 'stern', 'apfel'];
  for (let i = 0; i < 34; i++) {
    const s = document.createElementNS(SVGNS, 'svg');
    const art = pick(arten);
    s.setAttribute('viewBox', '0 0 40 40');
    s.innerHTML = `<use href="#${art}" color="${pick(['#E8742B', '#D9432F', '#F2B33D', '#5DAA45'])}"/>`;
    const size = rnd(18, 34);
    s.style.width = s.style.height = size + 'px';
    s.style.left = (Math.random() * 100) + 'vw';
    fx.appendChild(s);
    s.animate([
      { transform: 'translate(0, -60px) rotate(0deg)' },
      { transform: `translate(${rnd(-80, 80)}px, calc(100vh + 60px)) rotate(${rnd(-400, 400)}deg)` },
    ], { duration: rnd(1800, 3200), delay: rnd(0, 500), easing: 'cubic-bezier(.35,.1,.6,1)', fill: 'both' }).onfinish = () => s.remove();
  }
}
const symbolHTML = (id, vb = '0 0 40 40') => `<svg viewBox="${vb}"><use href="#${id}"/></svg>`;

// Kleine Meldung oben, die Pieks vorliest. Erfüllt sich mit false, wenn
// eine andere Ansage dazwischenkam. Sie ist ein Einwurf: Ein Tipp auf die Blase
// wiederholt danach, was in der Blase steht, nicht die Meldung (sonst käme im
// Französisch nach der Ernte Pieks' Meldung statt ihres Satzes).
let meldungLaeuft = Promise.resolve();
function meldung(icon, titel, text, saetze) {
  const p = meldungLaeuft.then(async () => {
    $('toastIc').innerHTML = icon;
    $('toastT').textContent = titel;
    $('toastS').textContent = text;
    $('toast').classList.add('zeigen');
    const start = Date.now();
    const ganz = await Stimme.sprechen(saetze, { svg: pieksMund(), einwurf: true });
    if (ganz) await pause(Math.max(0, 2200 - (Date.now() - start)));
    $('toast').classList.remove('zeigen');
    if (ganz) await pause(400);
    return ganz;
  });
  meldungLaeuft = p.catch(() => {});
  return p;
}
async function rangMelden() {
  const r = rangVon(stand.gesamt);
  Ton.rang();
  konfetti();
  return meldung(symbolHTML('stern'), 'Rang ' + (RAENGE.indexOf(r) + 1) + ': ' + r.name, 'Neuer Rang!', [sprechtext(zieh('rang_vor')), sprechtext(r.name + '!')]);
}
async function erfolgMelden(id) {
  const e = ERFOLGE[id];
  Ton.erfolg();
  return meldung(symbolHTML('pokal'), e.name, e.text + (e.bonus ? ` +${e.bonus} Äpfel` : ''), [sprechtext(zieh('erfolg_vor')), sprechtext(e.name + '!')]);
}
// Was belohnen() oder aepfelGeben() gemeldet hat, nacheinander zeigen: Serie,
// Tagesziel, Rang, Erfolge. gilt() sagt, ob die Feier noch passt (dieselbe
// Aufgabe, derselbe Bildschirm). Sind alle gezeigt, kommt null zurück. Nach
// einer Unterbrechung kommt, was von Rang und Erfolgen offen blieb: das
// Französisch zeigt es am Ende der Runde. Serie und Tagesziel verfallen.
async function meldungenFeiern(f, gilt = () => true) {
  const offen = { rangNeu: !!f.rangNeu, neueErfolge: (f.neueErfolge || []).slice() };
  if (SERIE[f.serie]) {
    Ton.serie();
    if (!(await meldung(symbolHTML('flamme'), f.serie + ' in Folge!', f.serieBonus ? `+${f.serieBonus} Bonus-Äpfel` : 'Weiter so!', [sprechtext(SERIE[f.serie])])) || !gilt()) return offen;
  }
  if (f.zielJetzt) {
    Ton.ziel();
    konfetti();
    if (!(await meldung(symbolHTML('pokal'), 'Tagesziel geschafft!', '+15 Äpfel', [sprechtext(zieh('tagesziel'))])) || !gilt()) return offen;
  }
  if (offen.rangNeu) {
    if (!(await rangMelden())) return offen;
    offen.rangNeu = false;
    if (!gilt()) return offen;
  }
  while (offen.neueErfolge.length) {
    if (!(await erfolgMelden(offen.neueErfolge[0]))) return offen;
    offen.neueErfolge.shift();
    if (!gilt()) return offen;
  }
  return null;
}

// Prüft alle Erfolge; neue werden gespeichert und bringen Bonus-Äpfel
function pruefeErfolge(k = {}) {
  const neu = [];
  const total = alleGeloest(), tage = tageSerie(), tiere = Object.keys(stand.besucher).length;
  const bed = {
    erste: total >= 1, serie5: serie >= 5, serie10: serie >= 10, serie20: serie >= 20,
    auf50: total >= 50, auf200: total >= 200, auf500: total >= 500, auf1000: total >= 1000,
    alle3: stand.geloest.brueche > 0 && stand.geloest.volumen > 0 && stand.geloest.dreisatz > 0,
    bruch50: stand.geloest.brueche >= 50, liter50: stand.geloest.volumen >= 50, drei50: stand.geloest.dreisatz >= 50,
    schwer25: stand.schwer >= 25, durchhalten: !!k.durchhalten, ziel: !!k.ziel || Object.keys(stand.zielTage).length > 0,
    tage3: tage >= 3, tage7: tage >= 7,
    nachteule: k.stunde !== undefined && k.stunde >= 19, frueh: k.stunde !== undefined && k.stunde < 8,
    tiere5: tiere >= 5, selten: !!(stand.besucher.ufo || stand.besucher.goldkaefer),
    tiereAlle: tiere >= Object.keys(BESUCHER).length,
    fakten50: stand.fakten.length >= 50, fakten200: stand.fakten.length >= 200,
    mode: stand.items.length >= 1, modeAlle: stand.items.length >= Object.keys(ITEMS).length,
    kitzel: !!k.kitzel,
  };
  // Die Erfolge eines Kurses kennt der Kurs (franz.js)
  for (const k of kurseDa()) Object.assign(bed, k.modul().erfolgBedingungen());
  for (const id of Object.keys(ERFOLGE)) {
    if (stand.erfolge[id] || !bed[id]) continue;
    stand.erfolge[id] = Date.now();
    neu.push(id);
    if (ERFOLGE[id].bonus) { stand.aepfel += ERFOLGE[id].bonus; stand.gesamt += ERFOLGE[id].bonus; }
  }
  if (neu.length) { speichern(); kopfZeigen(); }
  return neu;
}
// Erfolge, die ausserhalb einer Aufgabe passieren (Tiere, Kaufen, Kitzeln).
// Gezählt wird sofort, gemeldet erst, wenn Pieks fertig gesprochen hat.
// Erfüllt sich mit false, wenn Nea dazwischengetippt hat.
async function erfolgeNebenbei(k, nach) {
  const neu = pruefeErfolge(k);
  const ganz = nach ? await nach : true;
  if (ganz === false) return false;   // unterbrochen: die Meldung kommt nicht mehr, der Erfolg zählt trotzdem
  for (const id of neu) if (!(await erfolgMelden(id))) return false;
  return true;
}

/* ---------- Fakten ---------- */
const FAKT_ID = new Map();   // Fakt → Kennung (über den gesprochenen Text)
const faktId = f => { if (!FAKT_ID.has(f)) FAKT_ID.set(f, kennung(sprechtext(f))); return FAKT_ID.get(f); };
let letzteKat = '';
// Keiner doppelt, bis alle erzählt sind; möglichst nicht zweimal dieselbe Kategorie.
// Solange noch nicht alle Fakten vertont sind, kommen zuerst die mit Ton.
// ohneFranz (auf dem Französisch-Bildschirm): Pieks spricht dort nie Französisch (5.2),
// also bleiben die Fakten mit französischen Wörtern fürs Rechnen liegen. Sind nur noch
// sie übrig, gibt es dort diesmal keinen (null), statt die Runde früher neu zu beginnen.
function naechsterFakt(ohneFranz = false) {
  const gesehen = new Set(stand.fakten);
  let frei = FAKTEN.filter(f => !gesehen.has(faktId(f)));
  if (!frei.length) { stand.fakten = []; frei = FAKTEN.slice(); }
  if (ohneFranz) {
    frei = frei.filter(f => !/\b(fondre|racler|Litron|Champollion|Cocorico)\b/.test(sprechtext(f)));
    if (!frei.length) return null;
  }
  if (aufnahmen && stand.stimme) {
    const mitTon = frei.filter(f => aufnahmen.has(faktId(f)));
    if (mitTon.length) frei = mitTon;
  }
  const anders = frei.filter(f => f.k !== letzteKat);
  const f = pick(anders.length ? anders : frei);
  letzteKat = f.k;
  stand.fakten.push(faktId(f));
  speichern();
  return f;
}
// Pieks erzählt den nächsten Fakt. wo: die Kennungen der Faktkarte (das
// Französisch hat seine eigene) und, wenn gewünscht, der Satz davor (vor).
// Erfüllt sich wie jede Ansage: true, wenn er zu Ende erzählt hat.
function faktErzaehlen(wo = { karte: 'faktKarte', kat: 'faktKat', text: 'faktText', neu: 'faktNeu', vor: null }) {
  const f = naechsterFakt(bildschirm === 'franz');
  if (!f) return Promise.resolve(true);
  const vor = wo.vor || zieh('fakt_vor'), kat = FAKT_KAT[f.k] || { name: 'Fakt', icon: '✨' };
  const karte = $(wo.karte), teile = [sprechtext(vor), sprechtext(f)];
  $(wo.kat).innerHTML = `<span aria-hidden="true">${kat.icon}</span> ${esc(kat.name)} · ${stand.fakten.length} von ${FAKTEN.length}`;
  $(wo.text).innerHTML = esc(anzeigetext(f));
  $(wo.neu).hidden = false;
  karte.hidden = false;
  karte.onclick = () => Stimme.sprechen([sprechtext(f)], { svg: pieksMund(), tipp: true });
  Ton.fakt();
  neuImAlbum = true;
  kopfZeigen();
  karte.scrollIntoView({ block: 'nearest', behavior: reduce ? 'auto' : 'smooth' });
  // Der Fakt gehört Pieks. Ist er gerade nicht zu sehen (in der Garderobe steht das
  // Hörnchen), liest er nur vor, statt ihr die Blase zu nehmen.
  return zielAuf('p') ? ansage(esc(anzeigetext(vor)), teile) : Stimme.sprechen(teile, { svg: pieksMund() });
}

/* =====================================================================
   NOTIZBLOCK mit Häuschenpapier
   ===================================================================== */
const Notiz = (() => {
  const cv = $('notizCanvas'), ctx = cv.getContext('2d');
  let farbe = '#3A3A48', malt = false, letzter = null, dpr = 1;
  function groesse() {
    const r = cv.getBoundingClientRect();
    if (!r.width) return;
    const alt = cv.width ? ctx.getImageData(0, 0, cv.width, cv.height) : null;
    dpr = window.devicePixelRatio || 1;
    cv.width = Math.round(r.width * dpr);
    cv.height = Math.round(r.height * dpr);
    if (alt) ctx.putImageData(alt, 0, 0);
  }
  const punkt = e => { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) * dpr, y: (e.clientY - r.top) * dpr }; };
  cv.addEventListener('pointerdown', e => {
    e.preventDefault();
    cv.setPointerCapture(e.pointerId);
    malt = true;
    letzter = punkt(e);
    strich(letzter, letzter, e);
  });
  cv.addEventListener('pointermove', e => {
    if (!malt) return;
    const p = punkt(e);
    strich(letzter, p, e);
    letzter = p;
  });
  const ende = () => { malt = false; letzter = null; };
  cv.addEventListener('pointerup', ende);
  cv.addEventListener('pointercancel', ende);
  function strich(a, b, e) {
    const radierer = farbe === 'radierer';
    ctx.globalCompositeOperation = radierer ? 'destination-out' : 'source-over';
    ctx.strokeStyle = radierer ? '#000' : farbe;
    const druck = e.pressure && e.pointerType === 'pen' ? 0.6 + e.pressure : 1;
    ctx.lineWidth = (radierer ? 26 : 3.4) * dpr * druck;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x + 0.01, b.y + 0.01);
    ctx.stroke();
  }
  document.querySelectorAll('.stift').forEach(b => b.addEventListener('click', () => {
    document.querySelectorAll('.stift').forEach(x => x.classList.toggle('aktiv', x === b));
    farbe = b.dataset.farbe;
  }));
  return { groesse, leeren: () => ctx.clearRect(0, 0, cv.width, cv.height) };
})();
function notizAuf() {
  $('notiz').hidden = false;
  $('buehne').classList.add('mit-notiz');
  $('notizBtn').classList.add('an');
  requestAnimationFrame(Notiz.groesse);
}
function notizZu() {
  $('notiz').hidden = true;
  $('buehne').classList.remove('mit-notiz');
  $('notizBtn').classList.remove('an');
}
function notizLeeren() { Notiz.leeren(); }

/* =====================================================================
   BESUCH: Ab und zu läuft ein Tier über die Wiese oder fliegt vorbei.
   Tippt Nea es an, reagiert es, und Pieks sagt etwas dazu. Neue Tiere
   kommen ins Album.
   ===================================================================== */
const BESUCHER_TECH = {
  fuchs: { klasse: 'geher', tempo: 1.4, groesse: 1 },
  eichhoernchen: { klasse: 'hopser', tempo: 1.6, groesse: 0.95 },
  dachs: { klasse: 'geher', tempo: 0.8, groesse: 0.85 },
  schnecke: { klasse: 'kriecher', tempo: 0.12, groesse: 0.55 },
  igelkind: { klasse: 'geher', tempo: 0.9, groesse: 0.6 },
  maus: { klasse: 'geher', tempo: 2.4, groesse: 0.42 },
  frosch: { klasse: 'hopser', tempo: 1.1, groesse: 0.55 },
  kaefer: { klasse: 'geher', tempo: 0.5, groesse: 0.4 },
  goldkaefer: { klasse: 'geher', tempo: 0.7, groesse: 0.42 },
  maulwurf: { klasse: 'huegel', groesse: 0.72 },
  eule: { klasse: 'flieger', tempo: 1.2, groesse: 0.9 },
  fledermaus: { klasse: 'flieger', tempo: 1.9, groesse: 0.7 },
  rotkehlchen: { klasse: 'flieger', tempo: 1.6, groesse: 0.5 },
  marienkaefer: { klasse: 'flieger', tempo: 0.7, groesse: 0.36 },
  schmetterling: { klasse: 'flieger flatter-tier', tempo: 0.8, groesse: 0.45 },
  gaense: { klasse: 'flieger', tempo: 1.3, groesse: 1.3 },
  gluehwuermchen: { klasse: 'flieger', tempo: 0.4, groesse: 0.9 },
  drache: { klasse: 'flieger drache', tempo: 0.6, groesse: 1.3 },
  ufo: { klasse: 'flieger ufo', tempo: 2.2, groesse: 0.9 },
};
function besucherMoeglich(id, d = new Date()) {
  const b = BESUCHER[id];
  if (b.zeit && !b.zeit.includes(tageszeit(d))) return false;
  if (b.monate && !b.monate.includes(d.getMonth() + 1)) return false;
  return true;
}
function besucherHinweis(id) {
  const b = BESUCHER[id];
  if (b.selten) return 'Sehr selten! Augen offen halten.';
  const teile = [];
  if (b.zeit) {
    const z = b.zeit;
    if (z.length === 2 && z.includes('abend') && z.includes('nacht')) teile.push('Kommt nur abends und nachts.');
    else if (!z.includes('nacht') && !z.includes('abend')) teile.push('Kommt nur tagsüber.');
    else if (z.length === 1 && z[0] === 'tag') teile.push('Kommt nur tagsüber.');
    else if (!z.includes('nacht')) teile.push('Kommt nicht in der Nacht.');
  }
  if (b.monate) {
    const m = b.monate;
    if (m.join() === '6,7,8') teile.push('Nur im Sommer.');
    else if (m.join() === '9,10,11') teile.push('Nur im Herbst.');
    else if (m.join() === '2,3,4,9,10,11') teile.push('Im Frühling und im Herbst.');
    else teile.push('Nicht im Winter.');
  }
  return teile.join(' ') || 'Kommt ab und zu vorbei.';
}

const Besuch = (() => {
  const himmel = $('besuchHimmel');
  let timer = 0, letzter = '';
  const unterwegs = { boden: null, himmel: null };
  const spurVon = id => (BESUCHER[id].spur === 'himmel' ? 'himmel' : 'boden');
  const boden = () => (bildschirm === 'training' ? $('bodenTraining') : $('bodenHome'));
  // Wie echte Tiere: meist eine Weile nichts, manchmal zwei kurz nacheinander
  const wartezeit = mittel => clamp(-Math.log(1 - Math.random()) * mittel, 4000, 120000);
  function planen(ms) {
    clearTimeout(timer);
    if (reduce) return;
    timer = setTimeout(() => kommen(), ms !== undefined ? ms : wartezeit(38000));
  }
  function kommen(wunsch) {
    // Im Französisch kommt niemand: ein Tipp auf ein Tier schnitte der Vokabel das Wort ab
    if (document.hidden || !$('fenster').hidden || !$('start').hidden || bildschirm === 'franz') { planen(wartezeit(12000)); return; }
    const b = boden();
    const bodenOk = b && b.offsetParent && b.clientHeight >= 46;
    const frei = Object.keys(BESUCHER).filter(k => k !== letzter && besucherMoeglich(k) && !unterwegs[spurVon(k)] && (spurVon(k) === 'himmel' || bodenOk));
    // Seltene Besucher nur ab und zu
    const kandidaten = frei.filter(k => !BESUCHER[k].selten || Math.random() < 0.07);
    const id = BESUCHER[wunsch] ? wunsch : kandidaten.length ? pick(kandidaten) : null;
    if (!id) { planen(wartezeit(15000)); return; }
    letzter = id;
    if (BESUCHER[id].spur === 'huegel') huegel(id, b);
    // Im Training verdeckt die Karte den Himmel: dort fliegen sie über der Wiese
    else if (BESUCHER[id].spur === 'himmel') ziehen(id, bildschirm === 'training' && bodenOk ? b : himmel, true);
    else ziehen(id, b, false);
    planen();
    // Beim ersten Tier erklärt Pieks, dass man es antippen kann. Spricht er gerade,
    // wartet der Hinweis aufs nächste Tier, statt ihm ins Wort zu fallen.
    if (!stand.ersterBesuch && !A?.geloest) {
      setTimeout(() => {
        if (stand.ersterBesuch || !Stimme.istStill() || !$('fenster').hidden || bildschirm === 'franz') return;
        stand.ersterBesuch = true;
        speichern();
        sag(TEXTE.erster_besuch[0]);
      }, 1200);
    }
  }
  function element(id, w, h) {
    const art = BESUCHER_ART[id], tech = BESUCHER_TECH[id];
    const el = document.createElement('div');
    el.className = `besucher ${id} ${tech.klasse}`;
    el.style.width = w + 'px';
    el.style.height = h + 'px';
    el.innerHTML = `<div class="huepf"><div class="dreh"><svg viewBox="${art.vb}">${art.svg}</svg></div></div>`;
    el.setAttribute('role', 'button');
    el.setAttribute('aria-label', BESUCHER[id].name);
    return el;
  }
  function ziehen(id, ebene, fliegt) {
    const art = BESUCHER_ART[id], tech = BESUCHER_TECH[id];
    const tempo = (BESUCHER[id].tempo || tech.tempo) * (0.85 + Math.random() * 0.3);
    const [, , vbW, vbH] = art.vb.split(' ').map(Number);
    const W = ebene.clientWidth, H = ebene.clientHeight;
    const imHimmel = ebene === himmel;
    const basis = fliegt ? clamp((imHimmel ? innerHeight : H) * 0.13, 34, 80) : clamp(H * 0.82, 40, 104);
    const h = basis * tech.groesse * (0.9 + Math.random() * 0.12), w = h * vbW / vbH;
    const vonLinks = Math.random() < 0.5;
    const el = element(id, w, h);
    if (!vonLinks) el.classList.add('links');
    // Lichtung: im Himmelsstreifen über den Karten. Training: oben über der Wiese, vom Boden aus
    // gemessen: Wächst die Karte darüber, bleibt das Tier, wo es ist, und fliegt hinter ihr durch.
    if (imHimmel) el.style.top = Math.round(rnd(9, 20) / 100 * innerHeight) + 'px';
    else if (fliegt) el.style.bottom = Math.round(H - h - Math.max(4, Math.random() * (H * 0.55 - h))) + 'px';
    else el.style.bottom = '4px';
    ebene.appendChild(el);
    const von = vonLinks ? -w - 20 : W + 20, bis = vonLinks ? W + 20 : -w - 20;
    const lauf = el.animate([{ transform: `translateX(${von}px)` }, { transform: `translateX(${bis}px)` }],
      { duration: (W + w + 40) / (tempo * basis) * 1000, easing: 'linear', fill: 'forwards' });
    const spur = fliegt ? 'himmel' : 'boden';
    const b = (unterwegs[spur] = { id, el, lauf, ebene, fliegt, zuletzt: 0, belohnt: false });
    lauf.onfinish = () => { el.remove(); if (unterwegs[spur] === b) unterwegs[spur] = null; };
    el.addEventListener('pointerdown', e => { e.preventDefault(); reagieren(b); });
  }
  // Der Maulwurf läuft nicht, er schaut aus seinem Hügel
  function huegel(id, ebene) {
    const art = BESUCHER_ART[id], tech = BESUCHER_TECH[id];
    const [, , vbW, vbH] = art.vb.split(' ').map(Number);
    const h = clamp(ebene.clientHeight * 0.9, 44, 100) * tech.groesse, w = h * vbW / vbH;
    const el = element(id, w, h);
    el.style.bottom = '0';
    el.style.left = rnd(8, 80) + '%';
    ebene.appendChild(el);
    const b = (unterwegs.boden = { id, el, lauf: null, ebene, fliegt: false, zuletzt: 0, belohnt: false });
    const weg = () => { el.classList.remove('raus'); setTimeout(() => { el.remove(); if (unterwegs.boden === b) unterwegs.boden = null; }, 600); };
    el.animate([{ opacity: 0, transform: 'scaleY(.2)' }, { opacity: 1, transform: 'scaleY(1)' }], { duration: 500, fill: 'both', easing: 'ease-out' });
    setTimeout(() => el.classList.add('raus'), 700);
    b.weg = weg;
    b.timer = setTimeout(weg, 9000);
    el.addEventListener('pointerdown', e => { e.preventDefault(); reagieren(b); });
  }
  const hops = (ziel, wie, mal = 1, ms = 420) => ziel.animate(
    [{ transform: 'translateY(0)' }, { transform: `translateY(-${wie})`, offset: 0.4 }, { transform: 'translateY(0)' }],
    { duration: ms, iterations: mal, easing: 'ease-out' });
  function reagieren(b) {
    const jetzt = Date.now();
    if (jetzt - b.zuletzt < 1000) return;
    b.zuletzt = jetzt;
    const info = BESUCHER[b.id], neu = !stand.besucher[b.id];
    // Sätze und Fakten im Wechsel
    const pool = info.saetze.concat(info.fakten);
    b.zeile = b.zeile === undefined ? (neu ? 0 : rnd(0, pool.length - 1)) : (b.zeile + 1) % pool.length;
    const satz = pool[b.zeile];
    let plus = 0;
    if (neu) {
      stand.besucher[b.id] = Date.now();
      plus = info.aepfel || 5;
      neuImAlbum = true;
    } else if (!b.belohnt) plus = 1;
    b.belohnt = true;
    const teile = [satz];
    if (neu) teile.push(TEXTE.album_neu[0]);
    const gesagt = sagMehr(teile);
    etikett(b, esc(info.name) + (plus ? ` <span class="plus">+${plus}</span>` : '') + (neu ? ' · Neu!' : ''));
    herzen(b);
    if (plus) apfelDazu(plus, b.el);
    speichern();
    if (neu) { kopfZeigen(); erfolgeNebenbei({}, gesagt); }
    reaktion(b);
  }
  function reaktion(b) {
    const huepf = b.el.querySelector('.huepf'), svg = b.el.querySelector('svg');
    const anhalten = ms => {
      if (!b.lauf) return;
      b.lauf.pause();
      b.el.classList.add('steht');
      setTimeout(() => { b.el.classList.remove('steht'); if (b.lauf.playState === 'paused') b.lauf.play(); }, ms);
    };
    const rate = r => { if (b.lauf) b.lauf.playbackRate = r; };
    switch (b.id) {
      case 'fuchs': Ton.klaeff(); hops(huepf, '70%', 1, 700); break;
      case 'eichhoernchen': Ton.keckern(); anhalten(900); setTimeout(() => rate(3), 900); break;
      case 'dachs': Ton.grunz(); anhalten(1600); break;
      case 'schnecke': Ton.plopp(); b.el.classList.add('versteckt'); anhalten(2600); setTimeout(() => b.el.classList.remove('versteckt'), 2400); break;
      case 'igelkind': Ton.quiek(); hops(huepf, '35%', 2); rate(2); break;
      case 'maus': Ton.piepsen(); hops(huepf, '60%'); rate(2.6); break;
      case 'frosch': Ton.quaak(); hops(huepf, '90%', 1, 650); rate(1.8); break;
      case 'kaefer':
        Ton.brumm(); anhalten(1500);
        svg.animate([{ transform: 'rotate(0)' }, { transform: 'rotate(180deg)', offset: 0.3 }, { transform: 'rotate(180deg)', offset: 0.7 }, { transform: 'rotate(360deg)' }], { duration: 1500, easing: 'ease-in-out' });
        break;
      case 'goldkaefer': Ton.schatz(); konfetti(); rate(2.5); break;
      case 'maulwurf': Ton.plopp(); clearTimeout(b.timer); b.weg(); break;
      case 'eule': Ton.huhu(); b.el.classList.add('dreht-kopf'); setTimeout(() => b.el.classList.remove('dreht-kopf'), 1500); break;
      case 'fledermaus': case 'rotkehlchen':
        (b.id === 'fledermaus' ? Ton.fiep : Ton.zwitscher)();
        svg.animate([{ transform: 'rotate(0)' }, { transform: 'rotate(-360deg)' }], { duration: 800, easing: 'ease-in-out' });
        rate(1.6);
        break;
      case 'marienkaefer': Ton.summ(); svg.animate([{ transform: 'rotate(0) scale(1)' }, { transform: 'rotate(720deg) scale(1.3)' }, { transform: 'rotate(720deg) scale(1)' }], { duration: 1000 }); break;
      case 'schmetterling': case 'gluehwuermchen':
        Ton.glitzer();
        huepf.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-120%)' }], { duration: 1400, easing: 'ease-out', fill: 'forwards' });
        rate(1.6);
        break;
      case 'gaense': Ton.hupen(); hops(huepf, '15%', 2, 500); break;
      case 'drache': Ton.wusch(); svg.animate([{ transform: 'rotate(0)' }, { transform: 'rotate(360deg)' }], { duration: 1200, easing: 'ease-in-out' }); break;
      case 'ufo': {
        Ton.ufo();
        const s = b.el.querySelector('.strahl');
        if (s) s.animate([{ opacity: 0 }, { opacity: 0.8 }, { opacity: 0 }], { duration: 1400 });
        setTimeout(() => rate(6), 1300);
        break;
      }
    }
  }
  function etikett(b, html) {
    b.el.querySelectorAll('.etikett').forEach(x => x.remove());
    const e = document.createElement('div');
    e.className = 'etikett' + (b.fliegt ? ' unten' : '');
    e.innerHTML = html;
    b.el.appendChild(e);
    setTimeout(() => e.remove(), 2300);
  }
  function herzen(b) {
    if (reduce) return;
    const ebene = b.ebene, r = b.el.getBoundingClientRect(), o = ebene.getBoundingClientRect();
    for (let i = 0; i < 3; i++) {
      const s = document.createElementNS(SVGNS, 'svg');
      s.setAttribute('viewBox', '0 0 40 40');
      s.innerHTML = '<use href="#apfel"/>';
      Object.assign(s.style, { position: 'absolute', width: '20px', height: '20px', pointerEvents: 'none', left: (r.left - o.left + r.width * (0.3 + 0.2 * i) - 10) + 'px', top: (r.top - o.top) + 'px' });
      ebene.appendChild(s);
      s.animate([
        { transform: 'translateY(0) scale(.5)', opacity: 0 },
        { transform: 'translateY(-10px) scale(1)', opacity: 1, offset: 0.2 },
        { transform: `translate(${rnd(-14, 14)}px, -56px) scale(.9)`, opacity: 0 },
      ], { duration: 1200, delay: i * 120, easing: 'ease-out', fill: 'both' }).onfinish = () => s.remove();
    }
  }
  // Beim Wechsel zwischen Lichtung und Training verschwinden die Läufer, im
  // Französisch auch, wer gerade am Himmel vorbeizieht
  function platzWechsel() {
    for (const spur of ['boden', 'himmel']) {
      const b = unterwegs[spur];
      if (b && (b.ebene !== himmel || bildschirm === 'franz')) { b.el.remove(); unterwegs[spur] = null; }
    }
  }
  return { start: () => planen(wartezeit(14000)), planen, kommen, platzWechsel };
})();

/* =====================================================================
   PIEKS ANTIPPEN: kitzeln, und nach fünfmal rollt er sich ein
   ===================================================================== */
let kitzelZeit = [], eingerollt = false;
function kitzeln(svg) {
  if (eingerollt || !svg) return;
  audio();
  const jetzt = Date.now();
  kitzelZeit = kitzelZeit.filter(t => jetzt - t < 7000).concat(jetzt);
  if (kitzelZeit.length >= 5) { kitzelZeit = []; einrollen(svg); return; }
  Ton.kitzeln();
  stimmung(svg, 'kitzel', 600);
  Stimme.einwurf([sprechtext(zieh('kitzeln'))], svg);
}
async function einrollen(svg) {
  eingerollt = true;
  Ton.einrollen();
  const platz = svg.parentElement, r = platz.getBoundingClientRect();
  const k = document.createElement('div');
  k.className = 'kugel-rollt';
  k.innerHTML = kugelSVG();
  const gr = Math.min(r.width, r.height) * 0.7;
  Object.assign(k.style, { left: r.left + (r.width - gr) / 2 + 'px', top: r.top + r.height - gr + 'px', width: gr + 'px', height: gr + 'px' });
  document.body.appendChild(k);
  svg.style.visibility = 'hidden';
  Stimme.einwurf([sprechtext(TEXTE.einrollen[0])], null);
  if (!reduce) {
    await k.animate([{ transform: 'translateX(0) rotate(0)' }, { transform: `translateX(${gr * 0.8}px) rotate(300deg)`, offset: 0.4 },
      { transform: `translateX(${-gr * 0.5}px) rotate(-120deg)`, offset: 0.75 }, { transform: 'translateX(0) rotate(0)' }], { duration: 2600, easing: 'ease-in-out' }).finished.catch(() => {});
  } else await pause(1500);
  k.remove();
  svg.style.visibility = '';
  stimmung(svg, 'froh', 1200);
  eingerollt = false;
  erfolgeNebenbei({ kitzel: true }, Stimme.einwurf([sprechtext(TEXTE.ausrollen[0])], svg));
}

/* =====================================================================
   FENSTER: Album, Garderobe, Erfolge, Eltern
   ===================================================================== */
let fensterArt = null;
// art: 'album' | 'garderobe' | 'erfolge' | 'eltern'; tab nur fürs Album
// ('tiere', 'fakten', der Reiter eines Kurses wie 'woerter', oder 'woerter:u2' für eine Unité)
function fensterAuf(art, tab) {
  fensterArt = art;
  $('fenster').hidden = false;
  $('fensterTabs').innerHTML = '';
  // In der Garderobe steht zuerst, wer auf dem Bildschirm dahinter unterrichtet
  if (art === 'garderobe') {
    const a = bildschirm === 'franz' ? aktiverKurs() : null;
    garderobeWer = a ? a.lehrer : 'p';
  }
  ({ album: albumZeigen, garderobe: garderobeZeigen, erfolge: erfolgeZeigen, eltern: elternZeigen })[art](tab);
}
function fensterZu() {
  $('fenster').hidden = true;
  fensterArt = null;
  // Die Blase darunter gehört weiter dem, der dort zuletzt gesprochen hat
  const ort = sprecher('p'), wer = ort ? werVonBlase(ort.blase) : 'p';
  zeigeBildschirm(bildschirm);
  zielAuf(wer);
  kopfZeigen();
  if (bildschirm === 'lichtung') themenZeichnen();
}
$('fensterZu').addEventListener('click', () => { Stimme.stopp(); fensterZu(); });
$('fenster').addEventListener('click', e => { if (e.target === $('fenster')) { Stimme.stopp(); fensterZu(); } });
function tabs(liste, an, fn) {
  const box = $('fensterTabs');
  box.innerHTML = liste.map(([id, name]) => `<button type="button" class="tab${id === an ? ' an' : ''}" data-tab="${id}">${name}</button>`).join('');
  box.onclick = e => { const b = e.target.closest('.tab'); if (b) { Ton.tipp(); fn(b.dataset.tab); } };
}

/* ---------- Album ---------- */
const BESUCHER_REIHE = ['fuchs', 'eichhoernchen', 'dachs', 'igelkind', 'maus', 'maulwurf', 'schnecke', 'frosch', 'kaefer',
  'rotkehlchen', 'marienkaefer', 'schmetterling', 'gaense', 'drache', 'eule', 'fledermaus', 'gluehwuermchen', 'goldkaefer', 'ufo'];
function albumZeigen(tab = 'tiere') {
  $('fensterTitel').textContent = 'Sammelalbum';
  if (neuImAlbum) { neuImAlbum = false; kopfZeigen(); }
  const tiere = Object.keys(stand.besucher).length;
  const liste = [['tiere', `Besucher ${tiere}/${BESUCHER_REIHE.length}`], ['fakten', `Fakten ${stand.fakten.length}/${FAKTEN.length}`]];
  // Das Wörterheft jedes Kurses: ein Reiter, sobald seine Lehrerin da ist ('woerter' oder 'woerter:u2' für
  // eine Unité). Gibt es nur einen Kurs, heisst sein Reiter «Wörter»; mit mehreren trägt jeder seine Sprache.
  const kurse = kurseDa().filter(k => figurDa(k.lehrer));
  for (const k of kurse) liste.push([k.tab, `${kurse.length > 1 ? k.name : 'Wörter'} ${k.modul().zahlen().gekannt}/${k.modul().eintraege()}`]);
  const vonKurs = KURS_REIHE.map(id => KURSE[id]).find(k => tab === k.tab || tab.startsWith(k.tab + ':'));
  if (vonKurs && !kurse.includes(vonKurs)) tab = 'tiere';
  const heft = vonKurs && kurse.includes(vonKurs) ? vonKurs : null;
  tabs(liste, heft ? heft.tab : tab, albumZeigen);
  const inhalt = $('fensterInhalt');
  if (heft) {
    // Den Inhalt und seine Tipps besitzt der Kurs (franz.js). onclick wird hier gesetzt wie bei den
    // anderen Reitern: so bleibt nie ein Tipp-Empfänger des vorigen Reiters stehen.
    const m = heft.modul();
    inhalt.onclick = e => m.albumKlick(e);
    m.albumTab(inhalt, tab.slice(heft.tab.length + 1));
    return;
  }
  if (tab === 'tiere') {
    inhalt.innerHTML = '<div class="raster">' + BESUCHER_REIHE.map(id => {
      const b = BESUCHER[id], art = BESUCHER_ART[id], da = !!stand.besucher[id];
      const nacht = b.zeit && !b.zeit.includes('tag') && !b.zeit.includes('morgen');
      return `<button type="button" class="sammel${da ? ' knopf' : ' zu'}${nacht ? ' nacht' : ''}" data-tier="${id}" ${da ? '' : 'disabled'}>
        ${b.selten ? '<span class="stempel">selten</span>' : ''}
        <span class="bild"><svg viewBox="${art.vb}">${art.svg}</svg></span>
        <span class="name">${da ? esc(b.name) : '???'}</span>
        <span class="info">${da ? 'Antippen zum Hören' : esc(besucherHinweis(id))}</span></button>`;
    }).join('') + '</div>';
    inhalt.onclick = e => {
      const k = e.target.closest('.sammel.knopf');
      if (!k) return;
      const b = BESUCHER[k.dataset.tier];
      Stimme.sprechen([sprechtext(pick(b.fakten))], { svg: null, tipp: true });
      k.querySelector('.info').textContent = anzeigetext(b.fakten[0]) + (b.fakten[1] ? ' ' + anzeigetext(b.fakten[1]) : '');
    };
    if (Math.random() < 0.5) Stimme.sprechen([sprechtext(zieh('album_auf'))], { svg: null });
    return;
  }
  // Fakten nach Kategorien
  const gesehen = new Set(stand.fakten);
  if (tab === 'fakten') {
    inhalt.innerHTML = '<div class="kat-liste">' + Object.entries(FAKT_KAT).map(([k, kat]) => {
      const alle = FAKTEN.filter(f => f.k === k), da = alle.filter(f => gesehen.has(faktId(f))).length;
      return `<button type="button" class="kat" data-kat="${k}"><span class="kat-ic" style="background:${kat.farbe}">${kat.icon}</span>
        <span style="flex:1"><b>${esc(kat.name)}</b><small>${da} von ${alle.length}</small><span class="mini-balken"><i style="width:${alle.length ? da / alle.length * 100 : 0}%"></i></span></span></button>`;
    }).join('') + '</div>';
    inhalt.onclick = e => { const k = e.target.closest('.kat'); if (k) { Ton.tipp(); albumZeigen('kat:' + k.dataset.kat); } };
    return;
  }
  const k = tab.slice(4), kat = FAKT_KAT[k];
  const alle = FAKTEN.filter(f => f.k === k);
  const da = alle.filter(f => gesehen.has(faktId(f)));
  inhalt.innerHTML = `<button type="button" class="zurueck-link" data-zurueck>← Alle Kategorien</button>
    <h3 style="margin:0 0 10px">${kat.icon} ${esc(kat.name)}: ${da.length} von ${alle.length}</h3>
    <div class="fakten-liste">${da.map(f => `<button type="button" class="fakt-eintrag" data-fakt="${FAKTEN.indexOf(f)}"><span class="play"><svg viewBox="0 0 24 24"><use href="#i-ton"/></svg></span><span>${esc(anzeigetext(f))}</span></button>`).join('')}
    ${alle.length - da.length ? `<div class="fakt-eintrag zu"><span>Noch ${alle.length - da.length} Fakten warten auf dich. Pieks erzählt sie nach und nach.</span></div>` : ''}</div>`;
  inhalt.onclick = e => {
    if (e.target.closest('[data-zurueck]')) { albumZeigen('fakten'); return; }
    const b = e.target.closest('.fakt-eintrag[data-fakt]');
    if (b) Stimme.sprechen([sprechtext(FAKTEN[+b.dataset.fakt])], { svg: null, tipp: true });
  };
}

/* ---------- Garderobe ----------
   Ein Schrank für alle: was gekauft ist, können Pieks und jede Lehrerin
   tragen, die schon da ist. Ein Schalter über der Vorschau wählt, wer
   gerade anprobiert (FIGUREN). */
let garderobeSVG = null, garderobeWer = 'p';
function garderobeZeigen() {
  const wer = Object.keys(FIGUREN).filter(figurDa), mehr = wer.length > 1;
  if (!wer.includes(garderobeWer)) garderobeWer = 'p';
  const f = FIGUREN[garderobeWer], an = stand[f.an], name = f.name();
  $('fensterTitel').textContent = mehr ? 'Garderobe' : 'Pieks\' Garderobe';
  const inhalt = $('fensterInhalt');
  const gruppen = Object.keys(PLAETZE).map(p => {
    const waren = Object.entries(ITEMS).filter(([, it]) => it.platz === p);
    return `<div class="slot-titel">${PLAETZE[p]}</div><div class="raster">` + waren.map(([id, it]) => {
      const hat = stand.items.includes(id), traegt = an[p] === id, leistbar = stand.aepfel >= it.preis;
      return `<button type="button" class="sammel knopf ware${traegt ? ' traegt' : ''}" data-item="${id}">
        <span class="bild"><svg viewBox="-10 -34 220 240" class="ware-bild">${ITEM_SVG[id]}</svg></span>
        <span class="name">${esc(it.name)}</span>
        ${hat ? `<span class="status">${traegt ? `✓ ${esc(name)} trägt das` : 'Anziehen'}</span>` : `<span class="preis${leistbar ? '' : ' zu-teuer'}"><svg viewBox="0 0 40 40"><use href="#apfel"/></svg>${it.preis}</span>`}
      </button>`;
    }).join('') + '</div>';
  }).join('');
  // Zu dritt sind die Knöpfe schmaler (stil.css), sonst bräche der Schalter auf eine zweite Zeile um
  const schalter = !mehr ? '' : '<div class="wahl-knoepfe garderobe-wahl' + (wer.length > 2 ? ' drei' : '') + '">'
    + wer.map(w => `<button type="button" data-wer="${w}" class="${w === garderobeWer ? 'an' : ''}">${esc(FIGUREN[w].name())}</button>`).join('') + '</div>';
  inhalt.innerHTML = `<div class="garderobe"><div class="vorschau">${schalter}<div id="garderobePieks" style="width:100%;max-width:240px"></div>
    <div class="blase leer" id="blaseGarderobe" style="width:100%"><span class="say"></span></div>
    <div class="kasse"><svg viewBox="0 0 40 40"><use href="#apfel"/></svg><span id="kasseN">${stand.aepfel}</span> Äpfel</div></div><div>${gruppen}</div></div>`;
  // Jedes Teil ist in Pieks' Koordinaten gezeichnet: Vorschau auf den Inhalt zoomen
  inhalt.querySelectorAll('.ware-bild').forEach(svg => {
    try {
      const bb = svg.getBBox(), rand = Math.max(bb.width, bb.height) * 0.12;
      svg.setAttribute('viewBox', `${bb.x - rand} ${bb.y - rand} ${bb.width + 2 * rand} ${bb.height + 2 * rand}`);
    } catch (e) { /* noch nicht sichtbar */ }
  });
  const platz = $('garderobePieks');
  platz.innerHTML = f.svg();
  const svg = (garderobeSVG = platz.querySelector('svg'));
  anziehen(svg);
  // Antippen: jede Figur kitzelt auf ihre Art. Eine Lehrerin rollt sich nie zur
  // Igelkugel ein, und aus ihrem Mund kommt kein Satz von Pieks.
  const m = kursVon(garderobeWer);
  svg.addEventListener('pointerdown', () => (m ? m.kitzeln(svg) : kitzeln(svg)));
  sprechZiel($('blaseGarderobe'), svg, garderobeWer);
  inhalt.onclick = e => {
    const w = e.target.closest('.garderobe-wahl button');
    if (w) {
      if (w.dataset.wer === garderobeWer) return;
      Ton.tipp();
      Stimme.stopp();
      garderobeWer = w.dataset.wer;
      garderobeZeigen();
      return;
    }
    const b = e.target.closest('.ware');
    if (b) waehleItem(b.dataset.item);
  };
}
// Kaufen, anziehen oder ausziehen für die Figur, die gerade in der Garderobe steht.
// Pieks' Sätze spricht nur er; steht eine Lehrerin da, sagt sie ihre eigenen (aus ihrem Kurs).
function waehleItem(id) {
  const it = ITEMS[id], an = stand[FIGUREN[garderobeWer].an], m = kursVon(garderobeWer);
  const sagt = (pieks, lehrerin) => (m ? sagAls(garderobeWer, m.zeile(lehrerin)) : sagAls('p', pieks()));
  if (!stand.items.includes(id)) {
    if (stand.aepfel < it.preis) { Ton.falsch(); sagt(() => zieh('zu_teuer'), 'h_zu_teuer'); return; }
    stand.aepfel -= it.preis;
    stand.items.push(id);
    an[it.platz] = id;
    speichern();
    Ton.kaufen();
    garderobeZeigen();
    stimmung(garderobeSVG, 'froh', 1800);
    konfetti();
    erfolgeNebenbei({}, sagt(() => it.spruch, 'h_anziehen'));
    alleAnziehen();
    return;
  }
  Ton.tipp();
  let gesagt;
  if (an[it.platz] === id) { an[it.platz] = null; speichern(); garderobeZeigen(); gesagt = sagt(() => zieh('ausziehen'), 'h_ausziehen'); }
  else { an[it.platz] = id; speichern(); garderobeZeigen(); stimmung(garderobeSVG, 'froh', 1200); gesagt = sagt(() => zieh('kaufen'), 'h_anziehen'); }
  alleAnziehen();
  // Nach jedem Umziehen, nicht erst beim nächsten Kauf: sonst käme «Partnerlook» mitten in einer Aufgabe
  erfolgeNebenbei({}, gesagt);
}

/* ---------- Erfolge ---------- */
function erfolgeZeigen() {
  $('fensterTitel').textContent = 'Erfolge';
  const zahl = Object.keys(stand.erfolge).length;
  const total = alleGeloest(), tage = tageSerie(), tiere = Object.keys(stand.besucher).length;
  // Fortschritt für zählbare Erfolge
  const fort = {
    serie5: [stand.besterLauf, 5], serie10: [stand.besterLauf, 10], serie20: [stand.besterLauf, 20],
    auf50: [total, 50], auf200: [total, 200], auf500: [total, 500], auf1000: [total, 1000],
    bruch50: [stand.geloest.brueche, 50], liter50: [stand.geloest.volumen, 50], drei50: [stand.geloest.dreisatz, 50],
    schwer25: [stand.schwer, 25], tage3: [tage, 3], tage7: [tage, 7], tiere5: [tiere, 5], tiereAlle: [tiere, BESUCHER_REIHE.length],
    fakten50: [stand.fakten.length, 50], fakten200: [stand.fakten.length, 200], modeAlle: [stand.items.length, Object.keys(ITEMS).length],
  };
  for (const k of kurseDa()) Object.assign(fort, k.modul().erfolgFortschritt());
  // Die Erfolge eines Kurses (an ihrer Vorsilbe) erst, wenn es sie zu verdienen gibt: Ohne den Kurs oder
  // vor dem ersten Treffen zeigten sie auf jemanden, den es (noch) nicht gibt. Verdiente bleiben immer sichtbar.
  // Ebenso einer, den es nur mit der Stimme des Lehrers gibt, solange die fehlt (erfolgVersteckt in franz.js).
  const kursVorn = id => KURS_REIHE.map(i => KURSE[i]).find(k => id.startsWith(k.erfolge));
  const ids = Object.keys(ERFOLGE).filter(id => {
    const k = kursVorn(id);
    return !k || stand.erfolge[id] || (figurDa(k.lehrer) && !k.modul().erfolgVersteckt(id));
  });
  $('fensterInhalt').innerHTML = `<p class="klein" style="margin-top:0">${zahl} von ${ids.length} Erfolgen geschafft. Jeder bringt Bonus-Äpfel.</p><div class="raster">` +
    ids.map(id => {
      const e = ERFOLGE[id], da = !!stand.erfolge[id], f = fort[id];
      return `<div class="sammel erfolg${da ? '' : ' zu'}"><span class="bild"><svg viewBox="0 0 40 40"><use href="#${da ? 'pokal' : 'stern'}"/></svg></span>
        <span class="name">${esc(e.name)}</span><span class="info">${esc(e.text)}</span>
        ${e.bonus ? `<span class="preis"><svg viewBox="0 0 40 40"><use href="#apfel"/></svg>+${e.bonus}</span>` : ''}
        ${!da && f ? `<span class="fortschritt"><i style="width:${clamp(f[0] / f[1], 0, 1) * 100}%"></i></span>` : ''}
        ${da ? `<span class="info">${new Date(stand.erfolge[id]).toLocaleDateString('de-CH')}</span>` : ''}</div>`;
    }).join('') + '</div>';
  if (Math.random() < 0.5) Stimme.sprechen([sprechtext(zieh('erfolge_auf'))], { svg: null });
}

/* ---------- Als App installieren ----------
   Chrome, Edge und Android melden mit «beforeinstallprompt», dass die App
   installiert werden kann; dann bietet der Elternbereich einen Knopf an.
   Safari auf iPad und iPhone kennt das nicht: dort hilft eine Anleitung. */
let installHinweis = null;
window.addEventListener('beforeinstallprompt', e => { installHinweis = e; if (fensterArt === 'eltern') elternZeigen(); });
window.addEventListener('appinstalled', () => { installHinweis = null; if (fensterArt === 'eltern') elternZeigen(); });
const laeuftAlsApp = () => ['standalone', 'fullscreen', 'minimal-ui'].some(m => matchMedia(`(display-mode: ${m})`).matches) || navigator.standalone === true;
const istIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
function installHTML() {
  const name = esc(APP_NAME);
  if (laeuftAlsApp()) return `<p class="klein">✓ ${name} läuft hier schon als App.</p>`;
  if (installHinweis) return `<button type="button" class="install-knopf" data-install>Als App installieren</button><p class="klein">Danach startet ${name} wie eine eigene App, im Vollbild und auch ohne Internet.</p>`;
  if (istIOS()) return `<p class="klein">Auf dem iPad oder iPhone: in Safari unten oder oben auf <b>Teilen</b> tippen (Viereck mit Pfeil), dann <b>Zum Home-Bildschirm</b>. Danach startet ${name} im Vollbild wie eine eigene App.</p>`;
  return '<p class="klein">Im Browser-Menü <b>App installieren</b> oder <b>Zum Startbildschirm hinzufügen</b> wählen (Chrome, Edge, Samsung Internet). In Chrome und Edge am Computer gibt es dafür auch ein Symbol rechts in der Adresszeile.</p>';
}

/* ---------- Eltern: Statistik und Einstellungen ---------- */
let resetScharf = '';
function elternZeigen() {
  $('fensterTitel').textContent = 'Für Eltern';
  const s = statsLaden(), heute = s[heuteKey()] || {};
  const summe = tage => { const c = new Date(); c.setDate(c.getDate() - tage + 1); c.setHours(0, 0, 0, 0); let t = 0; for (const k in s) if (new Date(k + 'T00:00:00') >= c) t += s[k].total || 0; return t; };
  const tage14 = [];
  for (let i = 13; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); tage14.push({ key: dateKey(d), d }); }
  const max = Math.max(1, ...tage14.map(t => (s[t.key] || {}).total || 0));
  const kurz = d => String(d.getDate()).padStart(2, '0') + '.' + String(d.getMonth() + 1).padStart(2, '0') + '.';
  const lang = k => { if (k === heuteKey()) return 'Heute'; const y = new Date(); y.setDate(y.getDate() - 1); if (k === dateKey(y)) return 'Gestern'; const [yy, mm, dd] = k.split('-'); return `${dd}.${mm}.${yy.slice(2)}`; };
  const verlauf = Object.keys(s).filter(k => s[k].total > 0).sort().reverse().slice(0, 14);
  // Mit Kursen: die Zahlen zählen Aufgaben und Wörter, und jeder Balken ist gestapelt (je Kurs ein Teil, von
  // oben). Die Teile stehen in der Statistik, auch wenn ein Kurs gerade fehlt: Sie zeigen sich immer.
  const kurse = kurseDa(), fr = kurse.length > 0, zahlen = kurse.map(k => k.modul().zahlen());
  const teile = x => KURS_REIHE.map(id => KURSE[id]).map(k => [k, Math.min((x || {}).total || 0, (x || {})[k.stats] || 0)]).filter(([, f]) => f);
  const balken = (n, x) => { let oben = 0; return teile(x).map(([k, f]) => { const h = Math.round(f / n * 100), i = `<i class="${k.segment}" style="height:${h}%${oben ? ';top:' + oben + '%' : ''}"></i>`; oben += h; return i; }).join(''); };
  $('fensterInhalt').innerHTML = `<div class="eltern">
    <h3>${fr ? 'Gelöste Aufgaben und Wörter' : 'Gelöste Aufgaben'}</h3>
    <div class="agg"><div><b>${heute.total || 0}</b><small>Heute</small></div><div><b>${summe(7)}</b><small>7 Tage</small></div><div><b>${summe(30)}</b><small>30 Tage</small></div><div><b>${alleGeloest()}</b><small>Total</small></div></div>
    <h3>Letzte 14 Tage</h3>
    <div class="chart">${tage14.map(t => { const x = s[t.key], n = (x || {}).total || 0, davon = teile(x), q = x && x.attempts ? Math.round(x.correct / x.attempts * 100) : 0;
      return `<div class="chart-bar${n ? '' : ' leer'}" style="height:${n ? Math.max(4, n / max * 100) : 3}%" title="${kurz(t.d)}: ${n ? n + ' gelöst' + (davon.length ? ' (davon ' + davon.map(([k, f]) => f + ' ' + k.name).join(', ') + ')' : '') + ', ' + q + '% Quote' : 'keine Aufgaben'}">${balken(n, x)}</div>`; }).join('')}</div>
    <div class="chart-labels">${tage14.map((t, i) => `<div>${i === 0 || i === 13 || i % 2 === 1 ? kurz(t.d) : ''}</div>`).join('')}</div>
    ${fr ? '<p class="klein"><span style="color:var(--green-d)">■</span> Rechnen' + kurse.map(k => ` &nbsp; <span style="color:${k.farbe}">■</span> ${k.name}`).join('') + '</p>' : ''}
    ${verlauf.length ? '<h3>Trefferquote pro Tag</h3>' + verlauf.map(k => { const x = s[k], q = x.attempts ? Math.round(x.correct / x.attempts * 100) : 0;
      return `<div class="verlauf-zeile"><div>${lang(k)} <span class="klein">(${x.total})</span></div><div class="verlauf-balken"><i style="width:${q}%"></i></div><div>${q}%</div></div>`; }).join('') : ''}
    <p class="klein">Quote = richtige Antworten ÷ alle Prüfversuche. Brüche ${stand.geloest.brueche} · Volumen ${stand.geloest.volumen} · Dreisätze ${stand.geloest.dreisatz} · davon schwer ${stand.schwer} · beste Serie ${stand.besterLauf}${kurse.map((k, i) => ` · ${k.name}: ${zahlen[i].gekannt} kennengelernt, ${zahlen[i].reif} reif`).join('')}</p>
    ${kurse.map(k => k.modul().elternHTML()).join('')}
    <h3>Einstellungen</h3>
    <div class="einstellung"><span>Tagesziel (Aufgaben${fr ? ' oder Wörter' : ''})</span><span class="wahl-knoepfe" data-set="ziel">${[5, 10, 15, 20, 30].map(z => `<button type="button" data-wert="${z}" class="${stand.ziel === z ? 'an' : ''}">${z}</button>`).join('')}</span></div>
    <div class="einstellung"><span>Vorlesen</span><span class="wahl-knoepfe" data-set="stimme"><button type="button" data-wert="1" class="${stand.stimme ? 'an' : ''}">An</button><button type="button" data-wert="0" class="${stand.stimme ? '' : 'an'}">Aus</button></span></div>
    <div class="einstellung"><span>Geräusche</span><span class="wahl-knoepfe" data-set="ton"><button type="button" data-wert="1" class="${stand.ton ? 'an' : ''}">An</button><button type="button" data-wert="0" class="${stand.ton ? '' : 'an'}">Aus</button></span></div>
    <h3>Als App installieren</h3>
    ${installHTML()}
    <h3>Zurücksetzen</h3>
    <button type="button" class="gefahr" data-reset="stats">${resetScharf === 'stats' ? 'Wirklich? Nochmal tippen.' : 'Statistik löschen'}</button>
    <button type="button" class="gefahr" data-reset="igel">${resetScharf === 'igel' ? 'Wirklich alles? Nochmal tippen.' : 'Äpfel, Album und Garderobe löschen'}</button>
    <p class="klein">Alles wird nur auf diesem Gerät in diesem Browser gespeichert. Äpfel insgesamt: ${stand.gesamt}, Rang ${RAENGE.indexOf(rangVon(stand.gesamt)) + 1} von ${RAENGE.length}.</p>
  </div>`;
  $('fensterInhalt').onclick = async e => {
    // Der Block eines Kurses gehört dem Kurs (franz.js): seine Knöpfe zuerst
    for (const k of kurse) if (k.modul().elternKlick(e)) return;
    if (e.target.closest('[data-install]') && installHinweis) {
      const h = installHinweis;
      installHinweis = null;
      try { await h.prompt(); await h.userChoice; } catch (err) { /* schon gefragt */ }
      elternZeigen();
      return;
    }
    const w = e.target.closest('.wahl-knoepfe[data-set] button');
    if (w) {
      const art = w.parentElement.dataset.set, v = +w.dataset.wert;
      if (art === 'ziel') stand.ziel = v;
      else stand[art] = !!v;
      speichern();
      tonZeigen();
      kopfZeigen();
      Ton.tipp();
      elternZeigen();
      return;
    }
    const r = e.target.closest('[data-reset]');
    if (!r) return;
    if (resetScharf !== r.dataset.reset) { resetScharf = r.dataset.reset; elternZeigen(); return; }
    resetScharf = '';
    if (r.dataset.reset === 'stats') { try { localStorage.removeItem(STATS_KEY); } catch (err) { /* egal */ } }
    else {
      // Die Erfolge der Kurse bleiben (an ihrer Vorsilbe): Ihr Grund (der Stand des Kurses, die
      // Statistik) wird hier nicht gelöscht, sonst kämen sie alle mit der nächsten Aufgabe auf einmal
      // zurück, samt Bonus-Äpfeln. Nur der Partnerlook geht mit der Garderobe.
      const bleibt = k => KURS_REIHE.some(id => { const p = KURSE[id].erfolge; return k.startsWith(p) && k !== p + 'partner'; });
      const kursErfolge = Object.fromEntries(Object.entries(stand.erfolge).filter(([k]) => bleibt(k)));
      const neu = { aepfel: 0, gesamt: 0, geloest: { brueche: 0, volumen: 0, dreisatz: 0 }, schwer: 0, besterLauf: 0, besucher: {}, fakten: [], items: [] };
      for (const f of Object.values(FIGUREN)) neu[f.an] = leeresOutfit();
      Object.assign(stand, neu, { erfolge: kursErfolge, zielTage: {}, nachRichtig: 0 });
      speichern();
      alleAnziehen();
    }
    kopfZeigen();
    elternZeigen();
  };
}

function tonZeigen() {
  $('tonBtn').querySelector('use').setAttribute('href', stand.ton ? '#i-ton' : '#i-stumm');
  $('tonBtn').setAttribute('aria-label', stand.ton ? 'Geräusche ausschalten' : 'Geräusche einschalten');
  $('stimmeBtn').querySelector('use').setAttribute('href', stand.stimme ? '#i-stimme' : '#i-stimme-aus');
  $('stimmeBtn').setAttribute('aria-label', stand.stimme ? 'Vorlesen ausschalten' : 'Vorlesen einschalten');
}

/* =====================================================================
   STUFEN-MENÜ im Training und in den Kursen: Stufe und Thema wechseln.
   Jeder Kurs ist ein Eintrag mehr unter den Themen; dort selbst fehlen
   die Stufen (stil.css blendet sie aus), denn jede Karte hat ihre eigene.
   ===================================================================== */
function stufenMenueAuf() {
  const m = $('stufenMenue');
  if (!m.hidden) { m.hidden = true; return; }
  const fr = bildschirm === 'franz', a = fr ? aktiverKurs() : null;
  $('popStufen').innerHTML = STUFEN_REIHE.map(s => `<button type="button" class="stufe-btn${s === sitzung.stufe ? ' an' : ''}" data-stufe="${s}">${STUFEN[s]}</button>`).join('');
  $('popThemen').innerHTML = Object.entries(THEMEN).map(([id, th]) => `<button type="button" class="pop-thema${!fr && id === sitzung.thema ? ' an' : ''}" data-thema="${id}"><svg viewBox="0 0 80 80"><use href="#${th.icon}"/></svg>${th.name}</button>`).join('')
    + kurseDa().filter(k => figurDa(k.lehrer)).map(k => `<button type="button" class="pop-thema${a === k ? ' an' : ''}" data-fach="${k.key}"><svg viewBox="0 0 80 80"><use href="#${k.icon}"/></svg>${k.name}</button>`).join('');
  const r = $('themaChip').getBoundingClientRect();
  m.style.left = Math.max(8, Math.min(r.left, innerWidth - 290)) + 'px';
  m.style.top = r.bottom + 8 + 'px';
  m.hidden = false;
  // Mit jedem Kurs wird es eine Zeile höher: Auf einem Handy quer reichte es sonst unter den Rand. Nur dann rollt
  // es (stil.css .popover.rollt); passt es, bleibt es, wie es immer war.
  const platz = innerHeight - r.bottom - 16;
  m.style.removeProperty('max-height');
  m.classList.remove('rollt');
  if (m.offsetHeight > platz) {
    m.style.maxHeight = Math.max(160, platz) + 'px';
    m.classList.add('rollt');
  }
  Ton.tipp();
}
$('stufenMenue').addEventListener('click', e => {
  const s = e.target.closest('[data-stufe]'), t = e.target.closest('[data-thema]'), f = e.target.closest('[data-fach]');
  const nach = f ? kurseDa().find(k => k.key === f.dataset.fach) : null;
  $('stufenMenue').hidden = true;
  if (bildschirm === 'franz') {
    // Aus einem Kurs zu einem Rechenthema: still verlassen, Pieks übernimmt. Zu einem anderen Kurs: dort beginnen.
    const a = aktiverKurs();
    if (t && a) { a.modul().verlassen(true); trainingStarten(t.dataset.thema, stand.stufe[t.dataset.thema]); }
    else if (nach && a && nach !== a) { a.modul().verlassen(true); nach.modul().starten('runde'); }
    return;
  }
  if (f) { if (nach) nach.modul().starten('runde'); return; }
  if (s && s.dataset.stufe !== sitzung.stufe) stufeWechseln(s.dataset.stufe);
  else if (t && t.dataset.thema !== sitzung.thema) trainingStarten(t.dataset.thema, stand.stufe[t.dataset.thema]);
});
document.addEventListener('pointerdown', e => {
  if (!$('stufenMenue').hidden && !e.target.closest('#stufenMenue') && !e.target.closest('#themaChip')) $('stufenMenue').hidden = true;
}, true);

/* =====================================================================
   START: Pieks wecken
   ===================================================================== */
function startZeigen() {
  $('startKugel').innerHTML = kugelSVG();
  // Der Name der App kommt aus einer Stelle, auch auf der Startkarte
  $('start').querySelector('h1').textContent = APP_NAME;
  $('startText').textContent = tageszeit() === 'nacht' ? 'Pieks ist nachtaktiv, aber gerade döst er.' : 'Pieks hält gerade ein Nickerchen.';
  $('start').hidden = false;
}
async function wecken() {
  if ($('start').classList.contains('aufwachen')) return;
  audio();
  Ton.aufwachen();
  $('start').classList.add('aufwachen');
  await pause(550);
  $('start').hidden = true;
  $('start').classList.remove('aufwachen');
  stimmung(heldSVG, 'froh', 1500);
  const teile = [];
  if (!stand.vorgestellt) {
    teile.push(TEXTE.vorstellen[0]);
    stand.vorgestellt = true;
  } else {
    teile.push(zieh('aufwachen'), gruss());
  }
  stand.zuletzt = Date.now();
  speichern();
  const gesagt = sagMehr(teile);
  // Erfolge von früher (z.B. eine Tages-Serie) nach der Begrüssung nachtragen
  const begruesst = erfolgeNebenbei({}, gesagt);
  // Danach sind die Lehrerinnen dran (kurseBegruessen). ganz: Begrüssung und Meldungen
  // liefen ohne Unterbrechung, Nea hört also noch zu. Tiere erst ganz am Schluss (oder
  // wenn Nea schon weitergetippt hat): sonst kommt beim ersten Start mitten in die Vorstellung Besuch
  begruesst.then(ganz => kurseBegruessen(ganz)).finally(() => Besuch.start());
}
// Die Kurse der Reihe nach: Beim ersten Mal stellt sich die Lehrerin vor, später grüsst sie kurz.
// Höchstens ein erstes Treffen je Aufwachen, und zwar das des ersten Kurses, der sich noch nicht
// vorgestellt hat: So trifft Nea eine neue Lehrerin erst, wenn alle vor ihr sich vorgestellt haben, und
// nie zwei beim selben Aufwachen. Dieses Aufwachen gehört dann ihr allein: Die anderen grüssen diesmal
// nicht, denn ein Tipp während ihres Grusses nähme der Neuen den Auftritt (sie stünde dann einfach da).
async function kurseBegruessen(ganz) {
  const kurse = kurseDa(), neu = kurse.find(k => !k.modul().vorgestellt());
  if (neu) return neu.modul().begruessen(ganz);
  for (const k of kurse) ganz = await k.modul().begruessen(ganz);
}
function gruss() {
  const tz = tageszeit(), weg = stand.zuletzt ? (Date.now() - stand.zuletzt) / 86400000 : 0;
  if (weg >= 3) return zieh('gruss_wieder');
  if (tageSerie() >= 2 && !heuteGeloest() && Math.random() < 0.4) return zieh('gruss_serie');
  if (saison() === 'winter' && Math.random() < 0.25) return zieh('gruss_winter');
  const h = new Date().getHours();
  if (tz === 'nacht' && (h >= 21 || h < 6)) return zieh('gruss_nacht');
  return zieh(tz === 'nacht' || tz === 'abend' ? 'gruss_abend' : tz === 'morgen' ? 'gruss_morgen' : 'gruss_tag');
}

/* =====================================================================
   EREIGNISSE
   ===================================================================== */
$('pad').addEventListener('click', e => {
  const k = e.target.closest('.taste');
  if (!k || k.disabled) return;
  const v = k.dataset.k;
  if (v === 'back') loeschen();
  else if (v === 'ok') pruefen();
  else if (v === 'bruch') feldWechseln();
  else ziffer(v);
});
$('rechnung').addEventListener('click', e => {
  const f = e.target.closest('.feld');
  if (f && A && A.t.answerType === 'fraction') feldWechseln(+f.dataset.i);
});
$('weiterBtn').addEventListener('click', weiter);
$('tippBtn').addEventListener('click', tipp);
$('loesungBtn').addEventListener('click', loesungZeigen);
$('notizBtn').addEventListener('click', () => {
  if ($('notiz').hidden) { notizAuf(); if (Math.random() < 0.4) sag(zieh('notiz_auf')); } else notizZu();
  Ton.tipp();
});
$('notizZu').addEventListener('click', notizZu);
$('notizLeeren').addEventListener('click', () => { Ton.tipp(); notizLeeren(); });
$('homeBtn').addEventListener('click', () => {
  Ton.tipp();
  // Aus einem Kurs räumt der Kurs (franz.js) auf und kommt dann selbst zur Lichtung
  const a = bildschirm === 'franz' ? aktiverKurs() : null;
  if (a) a.modul().verlassen();
  else zurLichtung();
});
$('themaChip').addEventListener('click', stufenMenueAuf);
$('rang').addEventListener('click', () => { Ton.tipp(); fensterAuf('erfolge'); });
$('albumBtn').addEventListener('click', () => { Ton.tipp(); fensterAuf('album'); });
$('garderobeBtn').addEventListener('click', () => { Ton.tipp(); fensterAuf('garderobe'); if (Math.random() < 0.6) sag(zieh('garderobe_auf')); });
$('erfolgeBtn').addEventListener('click', () => { Ton.tipp(); fensterAuf('erfolge'); });
$('elternBtn').addEventListener('click', () => { Ton.tipp(); resetScharf = ''; fensterAuf('eltern'); });
$('aepfel').addEventListener('click', () => { Ton.tipp(); fensterAuf('garderobe'); });
$('blase').addEventListener('click', () => Stimme.nochmal());
$('blaseHome').addEventListener('click', () => Stimme.nochmal());
$('blaseHome').querySelector('.say').addEventListener('scroll', e => rolltZeigen(e.target), { passive: true });
if ($('blaseFranz')) $('blaseFranz').addEventListener('click', () => Stimme.nochmal());
$('tonBtn').addEventListener('click', () => { stand.ton = !stand.ton; speichern(); tonZeigen(); if (stand.ton) Ton.richtig(); });
$('stimmeBtn').addEventListener('click', () => {
  stand.stimme = !stand.stimme;
  speichern();
  tonZeigen();
  if (!stand.stimme) Stimme.stopp();
  // In einem Kurs hängt mehr daran: Hör-Aufgaben gibt es nur mit Stimme
  const a = bildschirm === 'franz' ? aktiverKurs() : null;
  if (a) a.modul().stimmeUm();
  else if (stand.stimme) sag(zieh('stimme_an'));
});
$('weckenBtn').addEventListener('click', wecken);
$('startKugel').addEventListener('click', wecken);

// Tastatur am Computer: Ziffern, Komma, Löschen, Enter, Pfeile für den Bruch
document.addEventListener('keydown', e => {
  if (e.target.closest && e.target.closest('input')) return;
  if (!$('start').hidden) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); wecken(); } return; }
  if (e.key === 'Escape') {
    if (!$('fenster').hidden) { Stimme.stopp(); fensterZu(); }
    else if (!$('stufenMenue').hidden) $('stufenMenue').hidden = true;
    return;
  }
  // In einem Kurs: die Tasten der offenen Aufgabe kennt der Kurs (franz.js). Hier endet
  // der Weg, damit eine liegengebliebene Rechenaufgabe nie Tasten bekommt.
  if (bildschirm === 'franz') {
    if (e.metaKey || (e.ctrlKey && !e.altKey)) return;      // Cmd+R, Ctrl+L … bleiben beim Browser; AltGr (Ctrl+Alt) geht durch
    const a = aktiverKurs();
    if ($('fenster').hidden && a && a.modul().taste(e)) e.preventDefault();
    return;
  }
  if (!$('fenster').hidden || bildschirm !== 'training' || !A) return;
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  if (A.geloest) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); weiter(); } return; }
  if (/^[0-9]$/.test(e.key)) { e.preventDefault(); ziffer(e.key); return; }
  if (e.key === '.' || e.key === ',') { e.preventDefault(); ziffer('.'); return; }
  if (e.key === 'Backspace') { e.preventDefault(); loeschen(); return; }
  if (e.key === 'Enter') { e.preventDefault(); pruefen(); return; }
  if (A.t.answerType === 'fraction') {
    if (e.key === '/' || e.key === 'ArrowDown' || (e.key === 'Tab' && !e.shiftKey && A.aktiv === 0)) { e.preventDefault(); feldWechseln(1); return; }
    if (e.key === 'ArrowUp' || (e.key === 'Tab' && e.shiftKey && A.aktiv === 1)) { e.preventDefault(); feldWechseln(0); }
  }
});
// Jeder Tipp irgendwo zählt als «Nea ist noch da», auch für jeden Kurs (ein erstes Treffen hört auf)
document.addEventListener('pointerdown', () => { wachHalten(); for (const k of kurseDa()) k.modul().wach(); }, { passive: true });
window.addEventListener('resize', () => { if (!$('notiz').hidden) Notiz.groesse(); });
document.addEventListener('visibilitychange', () => { if (!document.hidden) { zeitAnwenden(); kopfZeigen(); } });

/* =====================================================================
   LOS
   ===================================================================== */
// Scheitert ein Kurs beim Start (sein Bild, sein Einrichten), bleibt er für diesen Start ganz weg: rechnen
// kann Nea immer, und die anderen Kurse bleiben. Der Fehler geht trotzdem nicht unter, er wird nach dem
// Start neu geworfen.
function kursWeg(k, e) {
  k.aus = true;
  for (const el of [$(FIGUREN[k.lehrer].held), $(k.karte)]) if (el) el.hidden = true;
  heldZeigen();
  setTimeout(() => { throw e; });
}
// Farbverläufe der Figuren, die Zeichen aller Kurse (grafik.js) und die jedes Kurses, der da ist
const kursBilder = kurseDa().map(k => { try { return k.sprite(); } catch (e) { kursWeg(k, e); return ''; } });
document.getElementById('sprite').insertAdjacentHTML('beforeend', PIEKS_DEFS + KURS_SYMBOLE + kursBilder.join(''));
zeitAnwenden();
landschaft();
// Neu fallen lassen nur, wenn Tages- oder Jahreszeit wirklich wechselt: Die Reihenfolge der
// Klassen am body ändert sich auch bei jedem Bildschirmwechsel
setInterval(() => {
  const b = document.body.classList, anders = !b.contains(tageszeit()) || !b.contains(saison());
  zeitAnwenden();
  if (anders) fallen();
}, 60000);
heldSVG = pieksEinsetzen($('heldPieks'));
dockSVG = pieksEinsetzen($('dockPieks'));
heldSVG.addEventListener('pointerdown', () => kitzeln(heldSVG));
dockSVG.addEventListener('pointerdown', () => kitzeln(dockSVG));
tonZeigen();
// KURSE und FIGUREN wiederholen, was der Kurs selbst weiss (die App braucht es auch ohne seine Dateien).
// Passt etwas nicht zusammen, zählte zum Beispiel die Statistik seine Wörter als Rechnen: Das meldet der Start.
function kursAbgleichen(k) {
  const K = k.modul().kurs, f = FIGUREN[k.lehrer] || {};
  const paare = {
    key: [k.key, K.key], stats: [k.stats, K.fach], erfolge: [k.erfolge, K.erfolge.prefix], tab: [k.tab, K.tab], name: [k.name, K.name],
    icon: [k.icon, K.lehrer.icon], karte: [k.karte, K.ids.karte], lehrer: [k.lehrer, K.lehrer.wer],
    'FIGUREN.kurs': [f.kurs, k.id], 'FIGUREN.held': [f.held, K.ids.held], 'FIGUREN.abzeichen': [f.abzeichen, K.lehrer.icon],
  };
  const falsch = Object.keys(paare).filter(x => paare[x][0] !== paare[x][1]);
  if (falsch.length) throw new Error('KURSE.' + k.id + ' passt nicht zu seinem Kurs: ' + falsch.join(', '));
}
// Jeder Kurs richtet sich selbst ein: Stand lesen, Figuren einsetzen, Karte zeichnen (scheitert er, kursWeg)
for (const k of kurseDa()) {
  try { k.modul().einrichten(); } catch (e) { kursWeg(k, e); continue; }
  try { kursAbgleichen(k); } catch (e) { setTimeout(() => { throw e; }); }
}
themenZeichnen();
zeigeBildschirm('lichtung');
kopfZeigen();
$('blaseHome').querySelector('.say').textContent = 'Hoi Nea!';
startZeigen();

// Als App installierbar und ohne Internet nutzbar (siehe sw.js). Danach
// holt der Service Worker im Hintergrund die wichtigsten Aufnahmen.
// Lokal (localhost) auch, damit sich die Installation testen lässt.
if ('serviceWorker' in navigator && (location.protocol === 'https:' || ['localhost', '127.0.0.1'].includes(location.hostname))) {
  // Nach einem Update übernimmt der neue Service Worker (skipWaiting, claim), aber die
  // Bitte vom Start ging noch an den alten: ohne diese kämen die neuen Aufnahmen erst
  // beim nächsten Kaltstart in den Speicher, und die App auf dem iPad wird oft tagelang
  // nur fortgesetzt. Ebenso, wenn das Netz zurück ist oder die App wieder vorn ist: ein
  // Ausfall hat das Vorladen vielleicht beendet. Doppelte Bitten fängt sw.js ab (laedt),
  // und was schon im Speicher liegt, holt es nicht noch einmal.
  const nachladen = () => { const c = navigator.serviceWorker.controller; if (c) c.postMessage('vorladen'); };
  navigator.serviceWorker.addEventListener('controllerchange', nachladen);
  window.addEventListener('online', nachladen);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) nachladen(); });
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js')
      .then(() => navigator.serviceWorker.ready)
      .then(r => r.active && r.active.postMessage('vorladen'))
      .catch(() => {});
  });
}
