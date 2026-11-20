#!/usr/bin/env node
/**
 * Prüft die Russisch-Ecke (russisch-texte.js), ohne Bildschirm:
 *   node capy/pruefe.mjs
 * - jeder der 33 Buchstaben kommt in genau einer Station vor
 * - jedes Wort und jeder Satz lässt sich mit den bis zu seiner Station
 *   gelernten Buchstaben lesen
 * - jedes Merkwort gibt es, kein Bild kommt doppelt vor
 * - in deutschen Stücken steht nichts Kyrillisches und umgekehrt
 * Bei einem Fehler endet es mit Code 1.
 */
import { createRequire } from 'node:module';

const R = createRequire(import.meta.url)('./russisch-texte.js');
const fehler = [];
const KYR = /[А-Яа-яЁё]/;
const nurBuchstaben = s => s.toUpperCase().replace(/[^А-ЯЁ]/g, '').split('');

// Buchstaben und Stationen
const inStation = R.STATIONEN.flatMap(s => s.b);
if (R.BUCHSTABEN.length !== 33) fehler.push('Es sind ' + R.BUCHSTABEN.length + ' Buchstaben statt 33.');
if (R.ALPHABET.length !== 33) fehler.push('Das Alphabet hat ' + R.ALPHABET.length + ' Zeichen.');
for (const b of R.ALPHABET) {
  if (!R.buchstabe(b)) fehler.push(b + ' fehlt in BUCHSTABEN.');
  const n = inStation.filter(x => x === b).length;
  if (n !== 1) fehler.push(b + ' steht in ' + n + ' Stationen.');
}
R.STATIONEN.forEach((s, i) => { if (s.nr !== i + 1) fehler.push('Station ' + s.nr + ' steht an Platz ' + (i + 1) + '.'); });

// Lesbar ab der eigenen Station?
const bekanntBis = st => new Set(R.STATIONEN.filter(s => s.nr <= st).flatMap(s => s.b));
const lesbar = (text, st, was) => {
  if (!(st >= 1 && st <= R.STATIONEN.length)) { fehler.push(was + ' «' + text + '» hat keine gültige Station.'); return; }
  const k = bekanntBis(st);
  const fehlt = [...new Set(nurBuchstaben(text).filter(b => !k.has(b)))];
  if (fehlt.length) fehler.push(was + ' «' + text + '» (Station ' + st + ') braucht noch ' + fehlt.join(' '));
};
for (const w of R.WOERTER) if (!w.merk) lesbar(w.ru, w.st, 'Wort');
for (const s of R.SAETZE) lesbar(s.ru, s.st, 'Satz');
for (const b of R.BUCHSTABEN) {
  if (b.wort && !R.WOERTER.some(w => w.ru === b.wort)) fehler.push('Merkwort «' + b.wort + '» von ' + b.b + ' fehlt in WOERTER.');
  if (b.wort && !nurBuchstaben(b.wort).includes(b.b)) fehler.push('Merkwort «' + b.wort + '» enthält ' + b.b + ' nicht.');
}

// Bilder: jedes nur einmal (sonst wären zwei Antworten richtig)
const bilder = new Map();
for (const w of R.WOERTER) {
  if (bilder.has(w.bild)) fehler.push('Bild ' + w.bild + ' gehört zu «' + bilder.get(w.bild) + '» und «' + w.ru + '».');
  bilder.set(w.bild, w.ru);
}
for (const st of R.STATIONEN) {
  const n = R.WOERTER.filter(w => !w.merk && w.st === st.nr).length;
  if (n < 2) fehler.push('Station ' + st.nr + ' hat nur ' + n + ' Wort.');
}
const zahlen = R.ZAUBERWOERTER.filter(z => z.zahl).map(z => z.zahl).sort((a, b) => a - b);
if (zahlen.join() !== '1,2,3,4,5,6,7,8,9,10') fehler.push('Zahlwörter: ' + zahlen.join());

// Sprachen sauber getrennt
const alleZeilen = [];
for (const v of Object.values(R.LAMA_TEXTE)) alleZeilen.push(...(Array.isArray(v) ? v : Object.values(v)));
alleZeilen.push(...R.BUCHSTABEN.map(b => b.text), ...R.STATIONEN.map(s => s.start), ...R.LAMA.namen.map(n => n.satz));
for (const z of alleZeilen) {
  for (const x of R.stuecke(z)) {
    if (x.ru && /[A-Za-zÄÖÜäöü]/.test(x.t)) fehler.push('Russisches Stück mit lateinischen Buchstaben: «' + x.t + '»');
    if (!x.ru && KYR.test(x.t)) fehler.push('Deutsches Stück mit kyrillischen Buchstaben: «' + x.t + '»');
  }
}
for (const x of [...R.WOERTER, ...R.SAETZE, ...R.ZAUBERWOERTER]) {
  if (/[A-Za-z]/.test(x.ru)) fehler.push('«' + x.ru + '» enthält lateinische Buchstaben.');
}

const a = R.russischAufnahmen();
console.log(`${R.BUCHSTABEN.length} Buchstaben, ${R.WOERTER.filter(w => !w.merk).length} Wörter (+${R.WOERTER.filter(w => w.merk).length} Merkwörter), ` +
  `${R.SAETZE.length} Sätze, ${R.ZAUBERWOERTER.length} Zauberwörter, ${a.length} Aufnahmen.`);
if (fehler.length) {
  console.error(fehler.length + ' Fehler:\n  ' + fehler.join('\n  '));
  process.exit(1);
}
console.log('Alles in Ordnung.');
