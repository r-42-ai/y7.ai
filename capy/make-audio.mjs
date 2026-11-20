#!/usr/bin/env node
/**
 * Vertont alle Sätze aus texte.js (Capy) und russisch-texte.js (das Lama)
 * mit ElevenLabs und legt sie als audio/<datei>.mp3 ab. Der Dateiname ist
 * ein Prüfwert über den gesprochenen Text (siehe datei() in texte.js), beim
 * Lama mit «l-» davor (langsam: «ll-»). Ändert sich ein Satz, entsteht eine
 * neue Datei, und die alte wird als verwaist gemeldet.
 *
 * Nutzung:
 *   ELEVENLABS_API_KEY=... node capy/make-audio.mjs     fehlende Aufnahmen erzeugen
 * Hinter dem Proxy der Cloud-Umgebung zusätzlich NODE_USE_ENV_PROXY=1 setzen.
 *
 * Optionen:
 *   --dry          nur zeigen, was erzeugt würde (und wie viele Zeichen)
 *   --stimme c|l   nur Capy (c) oder nur das Lama (l)
 *   --force        auch neu aufnehmen, was es schon gibt, z.B. nach einem
 *                  Stimmwechsel; nur zusammen mit --stimme. Danach CACHE in
 *                  sw.js hochzählen, sonst spielen Geräte die alte Fassung.
 *   --aufraeumen   verwaiste Dateien löschen
 *   --voice <id>   andere Stimme, nur zusammen mit --stimme
 *   --speed <n>    Sprechtempo 0.7–1.2 für Capy (Standard: 1)
 *   --nur-lebhaft  nur Capys jubelnde Sätze (Lob, Feier, Grüsse, Tiere)
 *   --nur-kurz     nur Capys ganz kurze Ausrufe (bekommen deutschen Kontext)
 *   --ausdrucksstark  Capys jubelnde Sätze mit eleven_v3 und «[excited]» statt
 *                  eleven_multilingual_v2 (zusammen mit --force --nur-lebhaft)
 *
 * Der Schlüssel kommt nur aus der Umgebung und landet nie im Repo.
 */
import { createRequire } from 'node:module';
import { existsSync, mkdirSync, readdirSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = dirname(fileURLToPath(import.meta.url));
const AUDIO = join(DIR, 'audio');
const R = createRequire(import.meta.url)('./russisch-texte.js');

// Capy: «Sandra Squirrel – Quirky Explorer», verspielt und lebendig, von Yunas
// Familie ausgewählt (vorher «Ela», die beim Loben zu eintönig klang).
// Das Lama: siehe LAMA.stimme in russisch-texte.js.
const STIMMEN = { c: 'iwP1PxYYSTdHA1qXlwFe', l: R.LAMA.stimme };
const MODELL = 'eleven_multilingual_v2';
const GLEICHZEITIG = 3;

const args = process.argv.slice(2);
const has = f => args.includes(f);
const opt = f => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : null; };
const nurStimme = opt('--stimme');
if (nurStimme && !STIMMEN[nurStimme]) { console.error('--stimme c oder l'); process.exit(1); }
if (has('--force') && !nurStimme && !has('--nur-lebhaft') && !has('--nur-kurz')) {
  console.error('--force nur zusammen mit --stimme (oder --nur-lebhaft/--nur-kurz), damit nie aus Versehen alles neu gesprochen wird.');
  process.exit(1);
}
if (opt('--voice') && !nurStimme) { console.error('--voice nur zusammen mit --stimme.'); process.exit(1); }

const saetze = R.alleAufnahmen();

mkdirSync(AUDIO, { recursive: true });
const vorhanden = new Set(readdirSync(AUDIO).filter(f => f.endsWith('.mp3')).map(f => f.slice(0, -4)));
const verwaist = [...vorhanden].filter(id => !saetze.some(x => x.datei === id));
if (verwaist.length) {
  if (has('--aufraeumen') && !has('--dry')) {
    verwaist.forEach(id => unlinkSync(join(AUDIO, id + '.mp3')));
    console.log(verwaist.length + ' verwaiste Dateien gelöscht.');
  } else {
    console.log(verwaist.length + ' verwaiste Dateien (löschen mit --aufraeumen): ' + verwaist.join(', '));
  }
}

const todo = saetze.filter(x =>
  (has('--force') || !vorhanden.has(x.datei)) &&
  (!nurStimme || x.stimme === nurStimme) &&
  (!has('--nur-lebhaft') || (x.stimme === 'c' && x.lebhaft)) &&
  (!has('--nur-kurz') || (x.stimme === 'c' && x.kurz)));
const zeichen = todo.reduce((n, x) => n + x.s.length, 0);
console.log(saetze.length + ' Aufnahmen, davon ' + todo.length + ' zu vertonen (' + zeichen + ' Zeichen).');
if (has('--dry')) {
  todo.forEach(x => console.log('  ' + x.stimme + '  ' + x.datei.padEnd(11) + ' «' + x.s + '»' + (x.langsam ? ' (langsam)' : '')));
  process.exit(0);
}
if (!todo.length) process.exit(0);

const KEY = process.env.ELEVENLABS_API_KEY;
if (!KEY) { console.error('ELEVENLABS_API_KEY fehlt.'); process.exit(1); }
const speed = Math.min(1.2, Math.max(0.7, parseFloat(opt('--speed') || '1')));

async function vertonen(x) {
  const voice = (nurStimme && opt('--voice')) || STIMMEN[x.stimme];
  let body;
  if (x.stimme === 'c' && x.lebhaft && has('--ausdrucksstark')) {
    // Gefühls-Anweisung in eckigen Klammern wird nicht mitgesprochen
    body = { text: '[excited] ' + x.s, model_id: 'eleven_v3', voice_settings: { stability: 0.5 } };
  } else {
    body = { text: x.s, model_id: MODELL };
    const tempo = x.stimme === 'c' ? speed : x.tempo || 1;
    if (tempo !== 1) body.voice_settings = { speed: tempo };
    if (x.vorher) body.previous_text = x.vorher;
    if (x.nachher) body.next_text = x.nachher;
  }
  for (let versuch = 1; versuch <= 5; versuch++) {
    const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}?output_format=mp3_44100_64`, {
      method: 'POST',
      headers: { 'xi-api-key': KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (r.ok) {
      writeFileSync(join(AUDIO, x.datei + '.mp3'), Buffer.from(await r.arrayBuffer()));
      return;
    }
    const fehler = await r.text();
    if ((r.status === 429 || r.status >= 500) && versuch < 5) {
      await new Promise(res => setTimeout(res, 1500 * versuch));
      continue;
    }
    throw new Error('ElevenLabs ' + r.status + ' bei «' + x.s + '»: ' + fehler.slice(0, 300));
  }
}

// Ein paar gleichzeitig, wie es das Konto erlaubt
let naechster = 0, fertig = 0;
async function arbeiter() {
  while (naechster < todo.length) {
    const x = todo[naechster++];
    await vertonen(x);
    fertig++;
    console.log(`  [${fertig}/${todo.length}] ${x.stimme} ${x.datei}  «${x.s.length > 60 ? x.s.slice(0, 57) + '…' : x.s}»`);
  }
}
try {
  await Promise.all(Array.from({ length: GLEICHZEITIG }, arbeiter));
  console.log('Fertig. Neue Dateien in capy/audio/ committen und in sw.js die «Stand»-Zeile ändern.');
} catch (e) {
  console.error(e.message);
  console.error('Abgebrochen; ' + fertig + ' Aufnahmen sind gespeichert. Nochmal starten macht beim Rest weiter.');
  process.exit(1);
}
