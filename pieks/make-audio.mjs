#!/usr/bin/env node
/**
 * Vertont alles, was in der App gesprochen wird, mit ElevenLabs und legt es als
 * audio/<datei>.mp3 ab. Es gibt zwei Stimmen:
 *   p  Pieks: seine Sätze, die Besucher und die Fakten (texte.js, fakten.js) und was er
 *      im Französisch sagt (franz-texte.js)
 *   h  das Hörnchen: ihre Zeilen und alle Vokabeln (franz-texte.js, vokabeln.js)
 *
 * Der Dateiname ist ein Prüfwert über den gesprochenen Text (kennung() in texte.js). Bei
 * ihr steht davor, was es ist (clipDatei()): hd- deutsch, hf- französisch, f- Vokabel,
 * fl- Vokabel langsam. Ändert sich ein Text, entsteht eine neue Datei, und die alte wird
 * als verwaist gemeldet. Ihre Zeilen werden Stück für Stück aufgenommen, jedes Stück in
 * einer Sprache (segmente() in texte.js); gleiche Stücke gibt es nur einmal.
 *
 * Nutzung:
 *   ELEVENLABS_API_KEY=... node pieks/make-audio.mjs     fehlende Aufnahmen erzeugen
 *
 * Optionen:
 *   --dry              nur zeigen, was erzeugt würde, mit Zeichen und Kosten; schreibt
 *                      und löscht nichts
 *   --aufraeumen       verwaiste Dateien löschen
 *   --nur <gruppe>     nur pieks, besuch, hoernchen, wort, form, langsam oder fakt
 *   --stimme p|h       nur Pieks oder nur das Hörnchen
 *   --voice <id>       andere Stimme für --stimme (Standard: STIMMEN unten)
 *   --speed <n>        anderes Sprechtempo 0.7–1.2 für --nur (Standard: 1, Vokabeln 0.85,
 *                      langsame 0.7)
 *   --force            auch neu erzeugen, was es schon gibt. Nur zusammen mit --nur oder
 *                      --stimme, damit nie aus Versehen alles neu gesprochen wird. Danach
 *                      CACHE in sw.js hochzählen: Die App spielt Aufnahmen zuerst aus dem
 *                      Speicher des Geräts, sonst bliebe dort die alte Fassung.
 *   --probe <n> --probe-ordner <pfad>
 *                      Hörprobe: n immer gleiche Aufnahmen des Hörnchens (bei 20: zehn
 *                      deutsche Stücke, vier französische, vier Vokabeln, zwei langsame)
 *                      nach <pfad>/<voice-id>/. Fasst audio/ und vorhanden.json nie an.
 *
 * Reihenfolge: Pieks, Besucher, Hörnchen, Vokabeln (Einträge, Formen, langsam), zuletzt
 * die Fakten. Reicht das Kontingent nicht, fehlt also zuerst, was die App am ehesten
 * entbehren kann: Was fehlt, zeigt sie einfach ohne Ton. Nochmal starten macht weiter.
 *
 * Der Schlüssel kommt nur aus der Umgebung und landet nie im Repo. Gebraucht wird nur
 * die Sprachausgabe (text-to-speech), keine andere Schnittstelle.
 */
import { createRequire } from 'node:module';
import { existsSync, mkdirSync, readdirSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = dirname(fileURLToPath(import.meta.url));
const AUDIO = join(DIR, 'audio');
const require = createRequire(import.meta.url);
const T = require('./texte.js');
T.setFakten(require('./fakten.js').FAKTEN);
const F = require('./franz-texte.js');

// p: «Lucy Fennek – Trendy Lifestyle Promoter», peppig und frech, für Pieks
//    ausgewählt (Probe B, 19.10.2026)
// h: «Lucie – Jeune Fille Parisienne», nach Gehör für das Hörnchen ausgewählt. Ohne
//    eigene Einstellungen: So klang sie in den Hörproben am besten.
const STIMMEN = { p: 'egBwWoDtXGCSMgwiS3vn', h: 'KmqhNPEmmOndTBOPk4mJ' };
const MODELL = 'eleven_multilingual_v2';
const GLEICHZEITIG = 3;
const REIHE = ['pieks', 'besuch', 'hoernchen', 'wort', 'form', 'langsam', 'fakt'];
const CREDITS_PRO_ZEICHEN = 0.5;
// Welche Sorten die Hörprobe der Reihe nach nimmt: L und R deutsche Stücke aus lebhaften
// und ruhigen Listen, F französische Stücke, W Vokabeln, S langsame. Die ersten 20 sind
// 5 L, 5 R, 4 F, 4 W und 2 S; danach geht es von vorn los.
const PROBE_MUSTER = 'LRFWLRFWSLRFWLRFWSLR';

function abbrechen(text) {
  console.error(text);
  process.exit(1);
}

// Streng lesen: Ein Tippfehler wie «--dy» soll nicht still eine echte Aufnahme starten
const MIT_WERT = ['--nur', '--stimme', '--voice', '--speed', '--probe', '--probe-ordner'];
const OHNE_WERT = ['--dry', '--force', '--aufraeumen'];
const args = process.argv.slice(2);
const wahl = {};
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (OHNE_WERT.includes(a)) wahl[a] = true;
  else if (!MIT_WERT.includes(a)) abbrechen('Unbekannte Option: ' + a);
  else if (i + 1 >= args.length || args[i + 1].startsWith('--')) abbrechen(a + ' braucht einen Wert.');
  else wahl[a] = args[++i];
}
const has = f => wahl[f] === true;
const opt = f => (typeof wahl[f] === 'string' ? wahl[f] : null);

const nur = opt('--nur');
const stimme = opt('--stimme');
const probe = opt('--probe');
if (nur && !REIHE.includes(nur)) abbrechen('--nur kennt nur: ' + REIHE.join(', ') + '.');
if (stimme && !STIMMEN[stimme]) abbrechen('--stimme kennt nur p (Pieks) und h (Hörnchen).');
if (opt('--voice') && !stimme) abbrechen('--voice geht nur zusammen mit --stimme p oder --stimme h.');
if (opt('--speed') && !nur) abbrechen('--speed geht nur zusammen mit --nur <gruppe>.');
if (has('--force') && !nur && !stimme) abbrechen('--force geht nur zusammen mit --nur oder --stimme: So wird nie aus Versehen alles neu gesprochen.');
if (opt('--speed') && !(parseFloat(opt('--speed')) > 0)) abbrechen('--speed braucht eine Zahl zwischen 0.7 und 1.2.');
if (probe && !/^[1-9]\d*$/.test(probe)) abbrechen('--probe braucht eine Anzahl, z.B. --probe 20.');
if (probe && !opt('--probe-ordner')) abbrechen('--probe braucht --probe-ordner <pfad>: Eine Probe landet nie in audio/.');
if (!probe && opt('--probe-ordner')) abbrechen('--probe-ordner geht nur zusammen mit --probe <n>.');
if (probe) {
  // Die Probe ist immer dieselbe Auswahl aus ihren Aufnahmen
  for (const f of ['--nur', '--force', '--aufraeumen', '--speed']) if (wahl[f]) abbrechen(f + ' passt nicht zu --probe.');
  if (stimme === 'p') abbrechen('Die Probe nimmt nur das Hörnchen auf: --stimme h oder weglassen.');
}
// Mit --voice spricht jemand anderes die gewählte Stimme
const stimmen = { ...STIMMEN };
if (opt('--voice')) stimmen[stimme] = opt('--voice');
const speed = opt('--speed') ? Math.min(1.2, Math.max(0.7, parseFloat(opt('--speed')))) : null;
const stimmeVon = x => (x.v === 'p' ? 'p' : 'h');
const tempoVon = x => (speed === null ? x.tempo : speed);

// Jede Aufnahme nur einmal, auch wenn der Text in mehreren Listen steht. Steht er
// mehrfach da, gilt wie bisher der Zusammenhang des letzten Eintrags.
const proDatei = new Map();
for (const x of T.alleSaetze().map(x => ({ ...x, v: 'p', tempo: 1 })).concat(F.alleFranzClips())) {
  if (!REIHE.includes(x.gruppe)) abbrechen('Unbekannte Gruppe «' + x.gruppe + '» bei «' + x.s + '».');
  const id = T.clipDatei(x);
  const alt = proDatei.get(id);
  // Zwei verschiedene Texte mit demselben Prüfwert: Einer bliebe sonst still ohne Aufnahme
  if (alt && (alt.v !== x.v || alt.s.normalize('NFC') !== x.s.normalize('NFC'))) {
    abbrechen('Zwei Texte, eine Datei (' + id + '): «' + alt.s + '» und «' + x.s + '». Einen der beiden leicht ändern.');
  }
  proDatei.set(id, { id, ...x });
}
const saetze = [...proDatei.values()].sort((a, b) => REIHE.indexOf(a.gruppe) - REIHE.indexOf(b.gruppe));
const bekannt = new Set(saetze.map(x => x.id));

const mp3 = ordner => (existsSync(ordner) ? readdirSync(ordner).filter(f => f.endsWith('.mp3')).map(f => f.slice(0, -4)) : []);
const kurz = s => (s.length > 60 ? s.slice(0, 57) + '…' : s);
const zeile = x => '  ' + x.id + ' [' + x.gruppe + ']  «' + x.s + '»' + (tempoVon(x) !== 1 ? '  (Tempo ' + tempoVon(x) + ')' : '');
// Was es kostet: gezählt wird nur der gesprochene Text, nicht der Zusammenhang
function kosten(liste) {
  const z = wer => liste.filter(x => stimmeVon(x) === wer).reduce((n, x) => n + x.s.length, 0);
  const alle = z('p') + z('h');
  return alle + ' Zeichen (Pieks ' + z('p') + ', Hörnchen ' + z('h') + '), etwa ' + Math.ceil(alle * CREDITS_PRO_ZEICHEN) + ' Credits';
}

let ordner = AUDIO;
let todo;
if (probe) {
  // Hörprobe: je Sorte nach Kennung geordnet. Das ist bei gleichen Texten immer dieselbe
  // Auswahl, und sie stammt quer aus allen Listen statt nur aus der ersten.
  const sorte = {
    L: saetze.filter(x => x.v === 'hd' && x.lebhaft),
    R: saetze.filter(x => x.v === 'hd' && !x.lebhaft),
    F: saetze.filter(x => x.v === 'hf'),
    W: saetze.filter(x => x.gruppe === 'wort'),
    S: saetze.filter(x => x.gruppe === 'langsam'),
  };
  Object.values(sorte).forEach(l => l.sort((a, b) => (a.id < b.id ? -1 : 1)));
  const auswahl = [];
  for (let i = 0; auswahl.length < +probe && Object.values(sorte).some(l => l.length); i++) {
    const x = sorte[PROBE_MUSTER[i % PROBE_MUSTER.length]].shift();
    if (x) auswahl.push(x);
  }
  ordner = resolve(opt('--probe-ordner'), stimmen.h);
  if ((ordner + sep).startsWith(AUDIO + sep)) abbrechen('--probe-ordner darf nicht in audio/ liegen.');
  const da = new Set(mp3(ordner));
  todo = auswahl.filter(x => !da.has(x.id));
  console.log('Hörprobe mit Stimme ' + stimmen.h + ': ' + auswahl.length + ' Aufnahmen, davon ' + todo.length + ' zu vertonen (' + kosten(todo) + ').');
  console.log('Ordner: ' + ordner);
  if (has('--dry')) auswahl.forEach(x => console.log(zeile(x) + (da.has(x.id) ? '  (schon da)' : '')));
} else {
  const vorhanden = new Set(mp3(AUDIO));
  const verwaist = [...vorhanden].filter(id => !bekannt.has(id));
  if (verwaist.length) {
    if (has('--aufraeumen') && !has('--dry')) {
      verwaist.forEach(id => unlinkSync(join(AUDIO, id + '.mp3')));
      console.log(verwaist.length + ' verwaiste Dateien gelöscht.');
    } else {
      console.log(verwaist.length + ' verwaiste Dateien (löschen mit --aufraeumen): ' + verwaist.join(', '));
    }
  }
  todo = saetze.filter(x => (has('--force') || !vorhanden.has(x.id)) && (!nur || x.gruppe === nur) && (!stimme || stimmeVon(x) === stimme));
  const proGruppe = REIHE.map(g => g + ' ' + todo.filter(x => x.gruppe === g).length).join(', ');
  console.log(saetze.length + ' Aufnahmen, davon ' + todo.length + ' zu vertonen (' + proGruppe + '; ' + kosten(todo) + ').');
  if (has('--dry')) todo.forEach(x => console.log(zeile(x)));
}
if (has('--dry')) process.exit(0);

// Welche Aufnahmen es gibt: Die App holt nur, was hier steht, und erzählt bevorzugt
// Fakten mit Ton, solange noch nicht alle vertont sind
function listeSchreiben() {
  const ids = mp3(AUDIO).sort();
  writeFileSync(join(AUDIO, 'vorhanden.json'), JSON.stringify(ids));
  const da = new Set(ids);
  const fehlen = saetze.filter(x => !da.has(x.id)).length;
  console.log('audio/vorhanden.json: ' + ids.length + ' Aufnahmen' + (fehlen ? ', ' + fehlen + ' fehlen noch.' : ', alle da.'));
}
if (!todo.length) {
  if (!probe) {
    mkdirSync(AUDIO, { recursive: true });
    listeSchreiben();
  }
  process.exit(0);
}

const KEY = process.env.ELEVENLABS_API_KEY;
if (!KEY) abbrechen('ELEVENLABS_API_KEY fehlt.');
mkdirSync(ordner, { recursive: true });

class Kontingent extends Error {}
let verbraucht = 0;
const ohneUmfeld = [];
async function vertonen(x) {
  const body = { text: x.s, model_id: MODELL };
  // Sonst die Einstellungen, die bei der Stimme hinterlegt sind
  if (tempoVon(x) !== 1) body.voice_settings = { speed: tempoVon(x) };
  if (x.vorher) body.previous_text = x.vorher;
  if (x.nachher) body.next_text = x.nachher;
  let ohne = false;
  for (let versuch = 1; versuch <= 5; versuch++) {
    const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${stimmen[stimmeVon(x)]}?output_format=mp3_44100_64`, {
      method: 'POST',
      headers: { 'xi-api-key': KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (r.ok) {
      const daten = Buffer.from(await r.arrayBuffer());
      // Eine leere Datei gälte beim nächsten Lauf als fertig
      if (!daten.length) throw new Error('ElevenLabs lieferte nichts bei «' + x.s + '».');
      writeFileSync(join(ordner, x.id + '.mp3'), daten);
      verbraucht += +(r.headers.get('character-cost') || 0);
      if (ohne) ohneUmfeld.push(x);
      return;
    }
    const fehler = await r.text();
    if (/quota_exceeded|insufficient|credits/i.test(fehler)) throw new Kontingent('Kontingent aufgebraucht: ' + fehler.slice(0, 300));
    // Abgelehnt: einmal ohne den gedachten Zusammenhang versuchen. Das Tempo bleibt immer,
    // eine langsame Aufnahme, die nicht langsam ist, wäre falsch.
    if (r.status === 400 && (body.previous_text || body.next_text)) {
      delete body.previous_text;
      delete body.next_text;
      ohne = true;
      versuch--;
      continue;
    }
    if ((r.status === 429 || r.status >= 500) && versuch < 5) {
      await new Promise(res => setTimeout(res, 1500 * versuch));
      continue;
    }
    throw new Error('ElevenLabs ' + r.status + ' bei «' + x.s + '»: ' + fehler.slice(0, 300));
  }
}

// Ein paar gleichzeitig, wie es das Konto erlaubt
let naechster = 0, fertig = 0, abbruch = null;
async function arbeiter() {
  while (naechster < todo.length && !abbruch) {
    const x = todo[naechster++];
    try {
      await vertonen(x);
    } catch (e) {
      abbruch = abbruch || e;
      return;
    }
    fertig++;
    if (fertig % 10 === 0 || fertig === todo.length) console.log(`  [${fertig}/${todo.length}] ${x.gruppe}  «${kurz(x.s)}»`);
  }
}
await Promise.all(Array.from({ length: GLEICHZEITIG }, arbeiter));
console.log(`Verbraucht laut ElevenLabs: ${verbraucht} Credits für ${fertig} Aufnahmen.`);
if (ohneUmfeld.length) {
  // Ohne Zusammenhang rät die Stimme die Sprache: diese Aufnahmen anhören
  console.log(ohneUmfeld.length + ' ohne Zusammenhang aufgenommen (bitte anhören):');
  ohneUmfeld.forEach(x => console.log(zeile(x)));
}
if (!probe) listeSchreiben();
// Gleicher Name, neuer Inhalt: Geräte spielen sonst weiter, was sie gespeichert haben (sw.js)
if (has('--force') && !probe && fertig) console.log('Mit --force neu gesprochen: in sw.js CACHE hochzählen, sonst spielen Geräte weiter die alte Fassung.');
if (abbruch) {
  console.error(abbruch.message);
  console.error('Abgebrochen; ' + fertig + ' Aufnahmen sind gespeichert. Nochmal starten macht beim Rest weiter.');
  process.exit(1);
}
console.log(probe ? 'Fertig. Die Probe liegt in ' + ordner : 'Fertig. Neue Dateien in pieks/audio/ committen.');
