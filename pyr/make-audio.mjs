#!/usr/bin/env node
/**
 * Vertont alle Sätze aus texte.js mit ElevenLabs und legt sie als
 * audio/<kennung>.mp3 ab. Die Kennung ist ein Prüfwert über den
 * gesprochenen Text (siehe kennung() in texte.js): ändert sich ein Satz,
 * entsteht eine neue Datei, und die alte wird als verwaist gemeldet.
 *
 * Nutzung:
 *   ELEVENLABS_API_KEY=... node pyr/make-audio.mjs     fehlende Aufnahmen erzeugen
 *
 * Optionen:
 *   --dry          nur zeigen, was erzeugt würde (und wie viele Zeichen)
 *   --force        alles neu erzeugen, z.B. nach einem Stimmwechsel
 *   --aufraeumen   verwaiste Dateien löschen
 *   --voice <id>   andere Stimme (Standard: STIMME unten)
 *   --speed <n>    Sprechtempo 0.7–1.2 (Standard: 0.95)
 *
 * Der Schlüssel kommt nur aus der Umgebung und landet nie im Repo.
 */
import { createRequire } from 'node:module';
import { existsSync, mkdirSync, readdirSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = dirname(fileURLToPath(import.meta.url));
const AUDIO = join(DIR, 'audio');
const T = createRequire(import.meta.url)('./texte.js');

// «Ela – Cheerful and Happy»: fröhlich, aber nicht überdreht
const STIMME = 'NE7AIW5DoJ7lUosXV2KR';
const MODELL = 'eleven_multilingual_v2';
const GLEICHZEITIG = 3;

const args = process.argv.slice(2);
const has = f => args.includes(f);
const opt = f => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : null; };

// Jeder Satz nur einmal, auch wenn er in mehreren Listen steht
const saetze = [...new Map(T.alleSaetze().map(x => [T.kennung(x.s), x])).entries()]
  .map(([id, x]) => ({ id, ...x }));

mkdirSync(AUDIO, { recursive: true });
const vorhanden = new Set(readdirSync(AUDIO).filter(f => f.endsWith('.mp3')).map(f => f.slice(0, -4)));
const verwaist = [...vorhanden].filter(id => !saetze.some(x => x.id === id));
if (verwaist.length) {
  if (has('--aufraeumen')) {
    verwaist.forEach(id => unlinkSync(join(AUDIO, id + '.mp3')));
    console.log(verwaist.length + ' verwaiste Dateien gelöscht.');
  } else {
    console.log(verwaist.length + ' verwaiste Dateien (löschen mit --aufraeumen): ' + verwaist.join(', '));
  }
}

const todo = saetze.filter(x => has('--force') || !vorhanden.has(x.id));
const zeichen = todo.reduce((n, x) => n + x.s.length, 0);
console.log(saetze.length + ' Sätze, davon ' + todo.length + ' zu vertonen (' + zeichen + ' Zeichen).');
if (has('--dry')) {
  todo.forEach(x => console.log('  ' + x.id + '  «' + x.s + '»'));
  process.exit(0);
}
if (!todo.length) process.exit(0);

const KEY = process.env.ELEVENLABS_API_KEY;
if (!KEY) { console.error('ELEVENLABS_API_KEY fehlt.'); process.exit(1); }
const voice = opt('--voice') || STIMME;
const speed = Math.min(1.2, Math.max(0.7, parseFloat(opt('--speed') || '0.95')));

async function vertonen(x) {
  const body = { text: x.s, model_id: MODELL, voice_settings: { speed } };
  if (x.vorher) body.previous_text = x.vorher;
  if (x.nachher) body.next_text = x.nachher;
  for (let versuch = 1; versuch <= 5; versuch++) {
    const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}?output_format=mp3_44100_64`, {
      method: 'POST',
      headers: { 'xi-api-key': KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (r.ok) {
      writeFileSync(join(AUDIO, x.id + '.mp3'), Buffer.from(await r.arrayBuffer()));
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
    console.log(`  [${fertig}/${todo.length}] ${x.id}  «${x.s.length > 60 ? x.s.slice(0, 57) + '…' : x.s}»`);
  }
}
try {
  await Promise.all(Array.from({ length: GLEICHZEITIG }, arbeiter));
  console.log('Fertig. Neue Dateien in pyr/audio/ committen.');
} catch (e) {
  console.error(e.message);
  console.error('Abgebrochen; ' + fertig + ' Aufnahmen sind gespeichert. Nochmal starten macht beim Rest weiter.');
  process.exit(1);
}
