#!/usr/bin/env node
/**
 * Selbstkontrolle für das Französisch: prüft die Vokabeln (vokabeln.js), das
 * Lernmodell (lernen.js) und, wo sie da sind, die Texte (franz-texte.js,
 * texte.js) gegen den Bauplan. Ohne Abhängigkeiten, ohne Netz, ändert nichts.
 *
 * Nutzung:
 *   node pieks/pruefe.mjs        Ende 0 = alles stimmt, sonst 1 und eine Liste
 *
 * Jede Prüfung ist ein pruefung(nr, name, melde => { … }): Sie ruft melde(text)
 * für alles, was nicht stimmt, und darf einen Hinweis zurückgeben, der neben
 * ihrem Namen erscheint. Vor jeder Prüfung bekommt Lernen.zufall einen festen
 * Anfang, darum prüft jeder Lauf genau dasselbe.
 */
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const V = require('./vokabeln.js');
const { Lernen } = require('./lernen.js');
const { VOKABELN, KARTEN, KARTE } = V;
const K = Lernen.K;

/* ---------- Werkzeug ---------- */

// Zufall mit festem Anfang (mulberry32)
function zufallAb(saat) {
  let a = saat >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pruefungen = [];
const pruefung = (nr, name, lauf) => pruefungen.push({ nr, name, lauf });

const E = id => {
  const e = VOKABELN.find(x => x.id === id);
  if (!e) throw new Error('Eintrag fehlt: ' + id);
  return e;
};
// Kartenstand und Zustand zum Ausprobieren
const stand = mehr => ({ ...Lernen.zustand(null, ''), ...mehr });
const zMit = (e, mehr) => ({ karten: { [e.kid]: stand(mehr) } });
const schritt = (e, uebung, mehr) => ({ kid: e.kid, nr: e.nr, uebung, vorgabe: undefined, teil: 0, form: 0, rolle: 'leit', ...mehr });
// Jede Form jedes Teils jedes Eintrags
const jedeForm = f => VOKABELN.forEach(e => e.teile.forEach((t, i) => t.fr.forEach((text, j) => f(e, i, j, text))));
const jederTeil = f => VOKABELN.forEach(e => e.teile.forEach((t, i) => f(e, i, t)));
const erste = s => (Array.isArray(s) ? s[0] : s);
const sortiert = liste => liste.slice().sort().join(' ');
const gleich = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const frei = a => a.plaetze.filter(p => p.art !== 'fest');
const fremde = a => a.kacheln.filter(k => k.fremd).map(k => k.text);
// Die Plätze als eine Zeile: «[artikel] g r a n d - m è r e», Leerzeichen als _
const buchstabenBild = plaetze => plaetze
  .map(p => (p.art === 'artikel' ? '[artikel]' : p.art === 'fest' ? (p.text === ' ' ? '_' : p.text) : erste(p.soll))).join(' ');
// «[ ][ ]. [ ].»
const wortBild = plaetze => plaetze.map(p => (p.art === 'wort' ? '[ ]' : p.text + ' ')).join('').trim();
// Was die Plätze zusammen ergeben, wenn alles richtig liegt
function gelesen(plaetze, mitLeerzeichen) {
  let aus = '', gruppe = 0;
  for (const p of plaetze) {
    if (!mitLeerzeichen && p.wort !== gruppe) aus += ' ';
    gruppe = p.wort;
    const text = p.art === 'fest' ? p.text : erste(p.soll);
    aus += p.satzanfang ? text[0].toUpperCase() + text.slice(1) : text;
  }
  return aus;
}

// Felder je Übung, wie sie der Vertrag am Anfang von lernen.js verspricht
const IMMER = ['schritt', 'e', 'uebung', 'vorgabe', 'teil', 'form', 'fr', 'de', 'clip', 'clipLangsam', 'clipEintrag', 'ton', 'aepfel'];
const DAZU = {
  kennen: [], echo: [], bedeutung: ['optionen'], hoeren: ['optionen'], finden: ['optionen'], lauschen: ['optionen'],
  artikel: ['kopf', 'rest', 'genus', 'knoepfe'], akzent: ['plaetze'], legen: ['plaetze', 'kacheln', 'lueckenwort'],
  schreiben: ['ziel', 'formen', 'andersAls'], luecke: ['plaetze', 'optionen'], ordnen: ['plaetze', 'kacheln'],
  bauen: ['plaetze', 'kacheln'], paare: ['paare'],
};
const VORGABEN = { schreiben: ['de', 'ton'], ordnen: ['de', 'ton'] };

// Legt die Kacheln so, wie die Lösung es will, und nimmt jede nur einmal
function legePerfekt(a, melde, wo) {
  const vorrat = a.kacheln.map(k => k.text);
  return frei(a).map(p => {
    const i = vorrat.indexOf(erste(p.soll));
    if (i < 0) melde(wo + ': Kachel fehlt für «' + erste(p.soll) + '»');
    else vorrat.splice(i, 1);
    return erste(p.soll);
  });
}

// Baut eine Aufgabe, prüft ihre Gestalt und beurteilt die fehlerfreie Antwort
function baueUndLoese(e, uebung, mehr, k, melde) {
  const s = schritt(e, uebung, mehr);
  const a = Lernen.aufgabe(s, zMit(e, k));
  const wo = uebung + (mehr.vorgabe ? '/' + mehr.vorgabe : '') + ' «' + e.id + '» Teil ' + mehr.teil + ' Form ' + mehr.form;
  if (!a) {
    melde(wo + ': keine Aufgabe');
    return null;
  }
  const soll = sortiert([...IMMER, ...DAZU[uebung]]);
  if (sortiert(Object.keys(a)) !== soll) melde(wo + ': Felder ' + sortiert(Object.keys(a)) + ' statt ' + soll);
  if (a.e !== e || a.schritt !== s || a.uebung !== uebung || a.ton !== null) melde(wo + ': Kopf der Aufgabe stimmt nicht');
  const t = e.teile[a.teil], text = t && t.fr[a.form];
  if (!text) {
    melde(wo + ': Teil oder Form gibt es nicht');
    return a;
  }
  if (uebung === 'kennen' || uebung === 'echo') {
    if (a.fr !== e.fr || a.de !== e.de || !a.clip || a.clip.s !== e.sprich) melde(wo + ': zeigt oder spricht nicht den ganzen Eintrag');
  } else {
    // Bild und Ton stimmen überein, und Schrägstrich und Klammer aus dem Buch erscheinen nie
    if (a.fr !== text || !a.clip || a.clip.s !== text) melde(wo + ': fr oder clip ist nicht die gefragte Form');
    if (/[/()]/.test(a.fr)) melde(wo + ': Form mit Schrägstrich oder Klammer');
  }
  if (!a.clipEintrag || a.clipEintrag.s !== e.sprich) melde(wo + ': clipEintrag stimmt nicht');
  if (!!a.clipLangsam !== V.langsamGibt(a.clip.s) || (a.clipLangsam && (a.clipLangsam.s !== a.clip.s || a.clipLangsam.v !== 'fl'))) melde(wo + ': clipLangsam stimmt nicht');
  if (a.aepfel !== K.APFEL[uebung]) melde(wo + ': aepfel ' + a.aepfel);

  if (a.optionen) {
    const richtig = a.optionen.filter(o => o.richtig);
    const zahl = (uebung === 'bedeutung' || uebung === 'hoeren') && e.art === 'satz' ? 3 : 4;
    if (a.optionen.length !== zahl) melde(wo + ': ' + a.optionen.length + ' Antworten statt ' + zahl);
    if (richtig.length !== 1) melde(wo + ': ' + richtig.length + ' richtige Antworten');
    if (new Set(a.optionen.map(o => Lernen.falte(o.text))).size !== a.optionen.length) melde(wo + ': Antworten nicht verschieden: ' + a.optionen.map(o => o.text).join(' | '));
    const sollText = uebung === 'luecke' ? erste(a.plaetze.find(p => p.art === 'luecke').soll) : uebung === 'finden' || uebung === 'lauschen' ? a.fr : a.de;
    if (richtig[0] && richtig[0].text !== sollText) melde(wo + ': richtige Antwort «' + richtig[0].text + '» statt «' + sollText + '»');
    if (uebung !== 'luecke' && a.optionen.some(o => !o.sub || !o.sub.includes(' = '))) melde(wo + ': sub fehlt');
    if (uebung === 'finden' || uebung === 'lauschen') for (const o of a.optionen) if (/[/()]/.test(o.text)) melde(wo + ': Antwort mit Schrägstrich oder Klammer');
  }
  if (a.kacheln) {
    if (new Set(a.kacheln.map(k2 => k2.id)).size !== a.kacheln.length || a.kacheln.some((k2, i) => k2.id !== 'k' + i)) melde(wo + ': Kennungen der Kacheln');
    if (a.kacheln.some(k2 => /[/() ]/.test(k2.text) || !k2.text)) melde(wo + ': Kachel mit Leerzeichen, Schrägstrich oder Klammer');
  }

  if (uebung === 'artikel') {
    if (a.genus !== e.genus) melde(wo + ': genus');
    const kern = Lernen.zerlegen(a.fr, e);
    if ((kern.artikel === 'les' ? 'les ' : '') + kern.kern !== a.kopf + (a.rest ? ' ' + a.rest : '')) melde(wo + ': kopf und rest ergeben nicht den Kern');
    if (/^(der|die|das|ein|eine) /.test(a.de)) melde(wo + ': Deutsch mit Artikel: ' + a.de);
  } else if (uebung === 'akzent') {
    const z = Lernen.zerlegen(a.fr, e), luecken = frei(a);
    if (gelesen(a.plaetze, true) !== a.fr) melde(wo + ': Plätze ergeben «' + gelesen(a.plaetze, true) + '»');
    if (z.artikel && (a.plaetze[0].art !== 'fest' || a.plaetze[0].text !== z.artikel)) melde(wo + ': Artikel nicht vorgedruckt');
    if (luecken.length < 1 || luecken.length > 4 || luecken.some(p => p.art !== 'luecke' || !p.wahl.includes(p.soll))) melde(wo + ': Lücken stimmen nicht');
    // Jeder Akzent des Kerns ist eine Lücke (mehr als vier hat keine Form)
    const akzente = [...z.kern].filter(ch => /[àâçèéêûœ]/.test(ch)).length;
    if (luecken.filter(p => /[àâçèéêûœ]/.test(p.soll)).length !== Math.min(4, akzente)) melde(wo + ': nicht jeder Akzent ist eine Lücke');
    if (!Lernen.reihenUrteil(luecken.map(p => p.soll), luecken).richtig) melde(wo + ': fehlerfreie Antwort nicht richtig');
    const falsch = Lernen.reihenUrteil(luecken.map(p => p.wahl.find(w => w !== p.soll)), luecken);
    if (falsch.richtig || falsch.tipp !== 'akzent') melde(wo + ': falsche Akzente geben nicht den Tipp akzent');
  } else if (uebung === 'legen') {
    if (gelesen(a.plaetze, true) !== a.fr) melde(wo + ': Plätze ergeben «' + gelesen(a.plaetze, true) + '»');
    if (!Lernen.reihenUrteil(legePerfekt(a, melde, wo), frei(a)).richtig) melde(wo + ': fehlerfreie Antwort nicht richtig');
    // Höchstens drei Störbuchstaben und der andere Artikel; nichts liegt schon in der Reihenfolge der Lösung
    if (a.kacheln.filter(k2 => k2.fremd && k2.art === 'buchstabe').length > 3 || a.kacheln.filter(k2 => k2.fremd && k2.art === 'artikel').length > 1) melde(wo + ': zu viele Störkacheln');
    if (!frei(a).length) melde(wo + ': nichts zu legen');
    const eigene = a.kacheln.filter(k2 => !k2.fremd && k2.art === 'buchstabe').map(k2 => k2.text);
    if (new Set(eigene).size > 1 && gleich(eigene, frei(a).filter(p => p.art === 'buchstabe').map(p => p.soll))) melde(wo + ': Kacheln liegen schon richtig');
    const artikel = a.kacheln.filter(k2 => k2.art === 'artikel').map(k2 => k2.text).join('/');
    if (artikel !== (a.plaetze.some(p => p.art === 'artikel') ? (/^l/.test(artikel) ? 'le/la' : 'un/une') : '')) melde(wo + ': Artikel-Kacheln ' + artikel);
    if (artikel && a.kacheln.findIndex(k2 => k2.art !== 'artikel') !== 2) melde(wo + ': Artikel-Kacheln stehen nicht vorn');
  } else if (uebung === 'schreiben') {
    if (a.ziel !== a.fr || !gleich(a.formen, t.fr) || a.ziel.length > 30) melde(wo + ': ziel oder formen');
    if (!Lernen.urteil(a.ziel, e, a.teil, { form: a.form, vorgabe: a.vorgabe }).richtig) melde(wo + ': fehlerfreie Antwort nicht richtig');
  } else if (uebung === 'luecke') {
    if (gelesen(a.plaetze, true) !== a.fr) melde(wo + ': Plätze ergeben «' + gelesen(a.plaetze, true) + '»');
    if (frei(a).length !== 1) melde(wo + ': nicht genau eine Lücke');
  } else if (uebung === 'ordnen' || uebung === 'bauen') {
    if (gelesen(a.plaetze, false) !== a.fr) melde(wo + ': Plätze ergeben «' + gelesen(a.plaetze, false) + '»');
    if (!Lernen.reihenUrteil(legePerfekt(a, melde, wo), frei(a)).richtig) melde(wo + ': fehlerfreie Antwort nicht richtig');
    if (fremde(a).length !== (uebung === 'bauen' ? 3 : 0)) melde(wo + ': ' + fremde(a).length + ' fremde Kacheln');
    const eigene = a.kacheln.filter(k2 => !k2.fremd).map(k2 => k2.text);
    if (new Set(eigene).size > 1 && gleich(eigene, frei(a).map(p => p.soll))) melde(wo + ': Kacheln liegen schon richtig');
    const drin = new Set(frei(a).map(p => Lernen.falte(p.soll)));
    if (fremde(a).some(w => drin.has(Lernen.falte(w))) || new Set(fremde(a).map(Lernen.falte)).size !== fremde(a).length) melde(wo + ': fremde Kachel passt in den Satz oder steht doppelt da');
  }
  return a;
}

/* ---------- 0 · Grundlagen ---------- */

pruefung(0, 'Grundlagen: Datei, Datum, Kartenstand, Vergleichen', melde => {
  const soll = (was, ist, erwartet) => {
    if (!gleich(ist, erwartet)) melde(was + ': ' + JSON.stringify(ist) + ' statt ' + JSON.stringify(erwartet));
  };
  // lernen.js fasst weder Seite noch Uhr noch Speicher an und bringt genau einen Namen mit
  const quelle = readFileSync(join(DIR, 'lernen.js'), 'utf8');
  for (const [was, re] of [['Seite', /\b(document|window|navigator)\b/], ['Speicher', /\b(localStorage|sessionStorage|indexedDB)\b/],
    ['Uhr', /Date\.now|new Date\(\s*\)|performance\.|setTimeout|setInterval/]]) {
    if (re.test(quelle)) melde('lernen.js fasst an: ' + was);
  }
  soll('Math.random nur als Standard von Lernen.zufall', (quelle.match(/Math\.random/g) || []).length, 1);
  soll('Namen auf oberster Ebene', (quelle.match(/^(?:const|let|var|function|class)\s+[\w$]+/gm) || []), ['const Lernen']);
  soll('module.exports', Object.keys(require('./lernen.js')), ['Lernen']);
  // Aller Zufall geht durch Lernen.zufall: gleicher Anfang, gleiche Aufgabe
  const zweimal = [1, 2].map(() => {
    Lernen.zufall = zufallAb(99);
    return JSON.stringify(['bedeutung', 'finden', 'lauschen', 'akzent', 'legen', 'bauen'].map(u => {
      const a = Lernen.aufgabe(schritt(E('u1|les sciences (f pl) de la nature'), u), null) || Lernen.aufgabe(schritt(E('u4|Pique un raisin.'), u), null);
      return [a.optionen, a.plaetze, a.kacheln];
    }));
  });
  Lernen.zufall = zufallAb(100);
  const anders = JSON.stringify(Lernen.aufgabe(schritt(E('u1|les sciences (f pl) de la nature'), 'bedeutung'), null).optionen);
  if (zweimal[0] !== zweimal[1] || zweimal[0].includes(anders)) melde('Lernen.zufall bestimmt nicht allen Zufall');

  // Was die anderen Dateien von Lernen erwarten (9.5): genau diese Funktionen, dazu K und zufall
  const API = ['neu', 'pruefen', 'zustand', 'tag', 'tagPlus', 'norm', 'falte', 'kern', 'abstand', 'zerlegen', 'kann', 'leitaufgabe', 'nebenaufgaben',
    'planen', 'wiederholung', 'ohneTon', 'aufgabe', 'ablenker', 'buchstaben', 'wortkacheln', 'akzentLuecken', 'kontrast', 'urteil', 'reihenUrteil', 'aepfel',
    'verbuchen', 'rundeFertig', 'zahlen'];
  for (const name of API) if (typeof Lernen[name] !== 'function') melde('Lernen.' + name + ' fehlt');
  soll('Lernen bringt nichts anderes mit', sortiert(Object.keys(Lernen)), sortiert([...API, 'K', 'zufall']));
  soll('K.INTERVALLE', K.INTERVALLE, [0, 1, 2, 4, 7, 21]);
  soll('K.REIF_INTERVALLE', K.REIF_INTERVALLE, [45, 90]);
  soll('K', [K.RUNDE, K.NEBEN_MAX, K.LAST, K.RUNDE_MIN, K.NEU_PRO_RUNDE, K.NEU_PRO_TAG, K.BREMSE_FAELLIG, K.BREMSE_JUNG, K.SATZ_AB,
    K.SATZ_PRO_RUNDE, K.ABSTAND, K.WDH_VON, K.WDH_BIS, K.FREI, K.WARTEN], [14, 3, 20, 8, 4, 6, 14, 16, 8, 1, 3, 3, 5, 12, 1]);
  soll('K.UEBUNGEN', K.UEBUNGEN.length, 14);
  soll('K.NEU_WAHL, Finale, Pieks', [K.NEU_WAHL, K.PAARE_MIN, K.PAARE_MAX, K.PIEKS_AB], [[4, 6, 9, 12], 3, 4, 5]);

  soll('tag', Lernen.tag(new Date(2026, 10, 13, 23, 59)), '2026-11-13');
  soll('tag im Januar', Lernen.tag(new Date(2027, 0, 5)), '2027-01-05');
  soll('tagPlus über den Monat', Lernen.tagPlus('2026-11-28', 4), '2026-12-02');
  soll('tagPlus über das Jahr', Lernen.tagPlus('2026-12-31', 1), '2027-01-01');
  soll('tagPlus zurück', Lernen.tagPlus('2027-03-01', -1), '2027-02-28');
  soll('tagPlus über die Zeitumstellung', [Lernen.tagPlus('2027-03-27', 1), Lernen.tagPlus('2027-03-28', 1), Lernen.tagPlus('2026-10-24', 2)],
    ['2027-03-28', '2027-03-29', '2026-10-26']);
  soll('tagPlus 0', Lernen.tagPlus('2028-02-29', 0), '2028-02-29');

  const neu = { st: 0, faellig: '', auf: '', ab: '', rueck: false, teil: 0, form: 0, fest: 0, gesehen: 0, richtig: 0, falsch: 0,
    schwach: { genus: 0, akzent: 0, hoeren: 0 }, zuletzt: '' };
  const z = { karten: { 'u1|le livre': { ...neu, st: 3, schwach: { genus: 2, akzent: 0, hoeren: 1 } } } };
  const vorher = JSON.stringify(z);
  soll('zustand ohne Karte', Lernen.zustand(z, 'u1|la règle'), neu);
  soll('zustand ohne Zustand', Lernen.zustand(null, 'u1|la règle'), neu);
  soll('zustand für «constructor»', Lernen.zustand(z, 'constructor'), neu);
  const k = Lernen.zustand(z, 'u1|le livre');
  soll('zustand mit Karte', [k.st, k.schwach.genus], [3, 2]);
  k.st = 5;
  k.schwach.genus = 0;
  Lernen.zustand(z, 'u1|la règle').schwach.genus = 3;
  soll('zustand schreibt nicht', JSON.stringify(z), vorher);
  soll('zustand gibt jedes Mal ein neues Objekt', Lernen.zustand(z, 'x').schwach.genus, 0);

  soll('norm', [Lernen.norm('  La  Règle '), Lernen.norm("L'allemand (m)"), Lernen.norm('ma passion, c’est...'), Lernen.norm('Qui?'),
    Lernen.norm('la grand-mère'), Lernen.norm('ACM'), Lernen.norm('Tu coupes. Coupe.'), Lernen.norm('e\u0301cole')],
  ['la règle', 'l’allemand', 'ma passion c’est', 'qui', 'la grand-mère', 'acm', 'tu coupes coupe', 'école']);
  soll('falte', [Lernen.falte('La Règle'), Lernen.falte('un œil'), Lernen.falte('le garçon'), Lernen.falte('la grand-mère')],
    ['la regle', 'un oeil', 'le garcon', 'la grand-mere']);
  soll('kern', [Lernen.kern('la grand-mère'), Lernen.kern('l’âge (m)')], ['lagrandmere', 'lage']);
  soll('abstand', [Lernen.abstand('', ''), Lernen.abstand('abc', 'abc'), Lernen.abstand('cousin', 'cousine'), Lernen.abstand('chiase', 'chaise'),
    Lernen.abstand('mardi', 'mercredi'), Lernen.abstand('', 'abc'), Lernen.abstand('ca', 'abc')], [0, 0, 1, 1, 4, 3, 3]);
  soll('zerlegen', [Lernen.zerlegen('l’allemand', E('u1|l’allemand (m)')), Lernen.zerlegen('la chaise'), Lernen.zerlegen('les maths'),
    Lernen.zerlegen('un peu de persil', E('u4|un peu de persil')), Lernen.zerlegen('un peu de persil'), Lernen.zerlegen('lire'),
    Lernen.zerlegen('faire du foot', E('u3|le foot, faire du foot'))],
  [{ artikel: 'l’', kern: 'allemand' }, { artikel: 'la', kern: 'chaise' }, { artikel: 'les', kern: 'maths' },
    { artikel: null, kern: 'un peu de persil' }, { artikel: 'un', kern: 'peu de persil' }, { artikel: null, kern: 'lire' },
    { artikel: null, kern: 'faire du foot' }]);

  // Äpfel nach 6.1
  const ap = (uebung, art, rolle, mehr) => Lernen.aepfel({ uebung, rolle: rolle || 'leit', ...mehr }, { art }, mehr && mehr.buchung);
  soll('Äpfel beim ersten Versuch', K.UEBUNGEN.filter(u => u !== 'paare').map(u => ap(u, u === 'kennen' || u === 'echo' ? 'ohne' : 'richtig')),
    [0, 1, 1, 2, 2, 2, 3, 3, 4, 2, 3, 4, 1]);
  soll('Äpfel: fast, Wiederholung, Füllaufgabe, falsch', [ap('schreiben', 'fast'), ap('schreiben', 'richtig', 'wdh'), ap('bauen', 'richtig', 'fuell'),
    ap('schreiben', 'falsch'), ap('finden', 'richtig', 'check'), ap('artikel', 'richtig', 'neben')], [1, 1, 1, 0, 2, 2]);
  const vier = ['u1|le livre', 'u1|la règle', 'u1|le classeur', 'u1|le cahier'];
  soll('Äpfel im Finale', [Lernen.aepfel({ uebung: 'paare', rolle: 'paare', kids: vier }, { art: 'ohne', fehlpaare: 0 }),
    Lernen.aepfel({ uebung: 'paare', rolle: 'paare', kids: vier }, { art: 'ohne', fehlpaare: 1 }),
    Lernen.aepfel({ uebung: 'paare', rolle: 'paare', kids: vier.slice(1) }, { art: 'ohne', fehlpaare: 7 })], [4, 3, 1]);
  soll('Äpfel mit Stufenbonus', [Lernen.aepfel({ uebung: 'legen', rolle: 'leit' }, { art: 'richtig' }, { vorher: 2, stufe: 3 }),
    Lernen.aepfel({ uebung: 'schreiben', rolle: 'leit' }, { art: 'richtig' }, { vorher: 4, stufe: 5 }),
    Lernen.aepfel({ uebung: 'schreiben', rolle: 'leit' }, { art: 'richtig' }, { vorher: 5, stufe: 5 }),
    Lernen.aepfel({ uebung: 'schreiben', rolle: 'leit' }, { art: 'fast' }, { vorher: 3, stufe: 3 }),
    Lernen.aepfel({ uebung: 'hoeren', rolle: 'leit' }, { art: 'richtig' }, { vorher: 1, stufe: 2 })], [5, 9, 4, 1, 1]);
});

/* ---------- 1 · Vokabeln ---------- */

pruefung(1, 'Vokabeln: vokabelnPruefen()', melde => {
  for (const f of V.vokabelnPruefen()) melde(f);
});

/* ---------- 2 · Leiter ---------- */

pruefung(2, 'Leiter: jede Karte hat auf jeder Stufe eine Leitaufgabe, mit und ohne Ton', melde => {
  let zahl = 0;
  const TON = ['hoeren', 'lauschen', 'echo'];
  jedeForm((e, teil, form) => {
    for (let st = 0; st <= 5; st++) {
      for (const mitTon of [true, false]) {
        const wo = '«' + e.id + '» Stufe ' + st + ' Teil ' + teil + ' Form ' + form + (mitTon ? '' : ' ohne Ton');
        const k = stand({ st, teil, form });
        const l = Lernen.leitaufgabe(e, k, mitTon);
        zahl++;
        if (!l || !K.UEBUNGEN.includes(l.uebung) || !['fr', 'de', 'ton'].includes(l.vorgabe)) {
          melde(wo + ': keine Leitaufgabe');
          continue;
        }
        if (!Lernen.kann(l.uebung, e, l.teil, l.form, mitTon)) melde(wo + ': ' + l.uebung + ' geht hier nicht');
        if (!mitTon && (TON.includes(l.uebung) || l.vorgabe === 'ton')) melde(wo + ': braucht Ton');
        if (st >= 2 && l.uebung === 'hoeren') melde(wo + ': fällt auf hoeren zurück');
        if (!e.teile[l.teil] || !e.teile[l.teil].fr[l.form]) melde(wo + ': Teil oder Form gibt es nicht');
        // Die Leiter aus 3.2
        const lang = (Lernen.zerlegen(e.teile[teil].fr[form], e).kern.match(/\p{L}/gu) || []).length > 14;
        const ordnen = Lernen.kann('ordnen', e, teil, form, mitTon);
        const soll = st === 0 ? 'bedeutung/fr' : st === 1 ? (mitTon ? 'hoeren/ton' : 'bedeutung/fr')
          : e.art === 'satz' ? (st <= 3 && ordnen ? 'ordnen/' + (st === 2 && mitTon ? 'ton' : 'de') : 'bauen/de')
            : st === 2 ? (lang && ordnen ? 'ordnen/de' : 'legen/de') : 'schreiben/de';
        if (l.uebung + '/' + l.vorgabe !== soll) melde(wo + ': ' + l.uebung + '/' + l.vorgabe + ' statt ' + soll);
        if (l.uebung === 'schreiben' && e.teile[l.teil].fr[l.form].length > 30) melde(wo + ': schreiben mit mehr als 30 Zeichen');
        // Gefragt wird die Form, bei der die Karte steht; Ausnahmen: Check, gleich Klingendes, zu Langes
        const gleichklang = V.GLEICHKLANG.has(e.kid) && l.uebung === 'hoeren';
        const zuLang = l.uebung === 'schreiben' && e.teile[teil].fr[form].length > 30;
        if (st > 0 && !gleichklang && !zuLang && (l.teil !== teil || l.form !== form)) melde(wo + ': fragt Teil ' + l.teil + ' Form ' + l.form);
        if ((st === 0 || gleichklang) && (l.teil !== 0 || l.form !== 0)) melde(wo + ': fragt nicht die erste Form');
        // Die Aufgabe lässt sich bauen und fragt genau das
        const a = Lernen.aufgabe(schritt(e, l.uebung, { vorgabe: l.vorgabe, teil: l.teil, form: l.form }), zMit(e, k));
        if (!a || a.uebung !== l.uebung || a.vorgabe !== l.vorgabe || a.teil !== l.teil || a.form !== l.form) melde(wo + ': Aufgabe weicht von der Leitaufgabe ab');

        // Nebenaufgaben: bauen lassen sie sich alle, keine ist die Leitaufgabe, keine braucht Ton, den es nicht gibt
        const neben = Lernen.nebenaufgaben(e, k, mitTon);
        if (st === 0 && neben.length) melde(wo + ': Nebenaufgabe auf Stufe 0');
        for (const n of neben) {
          if (!Lernen.kann(n.uebung, e, n.teil, n.form, mitTon)) melde(wo + ': Nebenaufgabe ' + n.uebung + ' geht hier nicht');
          if (n.uebung === l.uebung && n.vorgabe === l.vorgabe) melde(wo + ': Nebenaufgabe ist die Leitaufgabe');
          if (!mitTon && (TON.includes(n.uebung) || n.vorgabe === 'ton')) melde(wo + ': Nebenaufgabe braucht Ton');
          if (!(n.gewicht >= 1)) melde(wo + ': Nebenaufgabe ohne Gewicht');
          if (n.uebung === 'schreiben' && n.vorgabe === 'ton' && V.GLEICHKLANG.has(e.kid)) melde(wo + ': Diktat bei gleich klingender Karte');
        }
        if (new Set(neben.map(n => n.uebung + n.vorgabe)).size !== neben.length) melde(wo + ': Nebenaufgabe doppelt');
      }
    }
  });

  // Stichproben aus der Tabelle in 3.2
  const neben = (id, st, mitTon, mehr) => Lernen.nebenaufgaben(E(id), stand({ st, ...mehr }), mitTon !== false)
    .map(n => n.uebung + (n.vorgabe === 'ton' && n.uebung !== 'hoeren' && n.uebung !== 'lauschen' ? '-ton' : '') + ' ' + n.gewicht).join(', ');
  const soll = (was, ist, erwartet) => {
    if (ist !== erwartet) melde(was + ': «' + ist + '» statt «' + erwartet + '»');
  };
  soll('Nebenaufgaben «la chaise» Stufe 1', neben('u1|la chaise', 1), 'artikel 4');
  soll('Nebenaufgaben «la chaise» Stufe 2', neben('u1|la chaise', 2), 'finden 2, artikel 2, lauschen 2');
  soll('Nebenaufgaben «la règle» Stufe 3', neben('u1|la règle', 3), 'akzent 2, schreiben-ton 2, artikel 1, lauschen 1');
  soll('Nebenaufgaben «la règle» Stufe 4', neben('u1|la règle', 4), 'akzent 1, schreiben-ton 2, lauschen 1');
  soll('Nebenaufgaben «la règle» Stufe 5', neben('u1|la règle', 5), 'akzent 1, schreiben-ton 2, lauschen 1');
  soll('Nebenaufgaben «la chaise» Stufe 3 (kein Akzent)', neben('u1|la chaise', 3), 'schreiben-ton 2, artikel 1, lauschen 1');
  soll('Nebenaufgaben «lundi» Stufe 1 (kein Geschlecht)', neben('u1|lundi', 1), '');
  soll('Nebenaufgaben mit Schwächen', neben('u1|la règle', 3, true, { schwach: { genus: 2, akzent: 1, hoeren: 3 } }),
    'akzent 5, schreiben-ton 11, artikel 7, lauschen 10');
  soll('Nebenaufgaben «la règle» Stufe 3 ohne Ton', neben('u1|la règle', 3, false, { schwach: { genus: 0, akzent: 0, hoeren: 3 } }),
    'akzent 2, artikel 1, finden 1');
  soll('Nebenaufgaben «la chaise» Stufe 2 ohne Ton', neben('u1|la chaise', 2, false), 'finden 2, artikel 2');
  soll('Nebenaufgaben nach dem Ordnen einer langen Form', neben('u4|la rondelle de concombre', 2), 'finden 2, artikel 2, lauschen 2, legen 4');
  soll('Nebenaufgaben Satz Stufe 2', neben('u4|Pour le nez, je prends une carotte.', 2), 'luecke 3, bedeutung 1');
  soll('Nebenaufgaben Satz Stufe 3', neben('u4|Pour le nez, je prends une carotte.', 3), 'luecke 2, legen 2, hoeren 1');
  soll('Nebenaufgaben Satz Stufe 4', neben('u4|Pour le nez, je prends une carotte.', 4), 'legen 2, ordnen-ton 1, luecke 1');
  soll('Nebenaufgaben Satz Stufe 4 ohne Ton', neben('u4|Pour le nez, je prends une carotte.', 4, false), 'legen 2, ordnen 1, luecke 1');
  soll('Nebenaufgaben kurzer Satz Stufe 4', neben('u4|C’est quoi?', 4), 'legen 2, luecke 1');

  // Ohne Ton: Aus jedem Schritt, der Ton braucht, wird einer, der ohne geht, oder keiner
  jedeForm((e, teil, form) => {
    const z = zMit(e, { st: 3, teil, form });
    for (const [uebung, vorgabe] of [['hoeren', 'ton'], ['lauschen', 'ton'], ['schreiben', 'ton'], ['ordnen', 'ton'], ['echo', 'fr']]) {
      if (!Lernen.kann(uebung, e, teil, form, true)) continue;
      const wo = 'ohneTon ' + uebung + ' «' + e.id + '» Teil ' + teil + ' Form ' + form;
      const s = Lernen.ohneTon(schritt(e, uebung, { vorgabe, teil, form, rolle: 'neben' }), z);
      if (s === null) continue;
      if (!s || TON.includes(s.uebung) || s.vorgabe === 'ton') melde(wo + ': braucht immer noch Ton');
      else if (!Lernen.kann(s.uebung, e, s.teil, s.form, false)) melde(wo + ': ' + s.uebung + ' geht hier nicht');
      else if (!Lernen.aufgabe(s, z)) melde(wo + ': keine Aufgabe');
      if (uebung === 'echo') melde(wo + ': echo entfällt nicht');
    }
  });
  return zahl + ' Leitaufgaben';
});

/* ---------- 3 · Aufgaben ---------- */

pruefung(3, 'Aufgaben: jede Übung für jeden Eintrag, Teil und jede Form; fehlerfreie Antwort ist richtig', melde => {
  const zahl = {};
  const zaehle = (was, n) => {
    zahl[was] = (zahl[was] || 0) + (n == null ? 1 : n);
  };
  const soll = (was, ist, erwartet) => {
    if (!gleich(ist, erwartet)) melde(was + ': ' + JSON.stringify(ist) + ' statt ' + JSON.stringify(erwartet));
  };

  // Alles, was geht, wird gebaut und gelöst; drei Durchgänge mit anderem Kartenstand und anderem Zufall
  const lueckenwoerter = new Map();
  for (let lauf = 0; lauf < 3; lauf++) {
    jedeForm((e, teil, form, text) => {
      for (const uebung of K.UEBUNGEN) {
        if (uebung === 'paare' || !Lernen.kann(uebung, e, teil, form, true)) continue;
        for (const vorgabe of VORGABEN[uebung] || [undefined]) {
          if (vorgabe === 'ton' && ((uebung === 'ordnen' && e.art !== 'satz') || (uebung === 'schreiben' && e.art !== 'wort'))) continue;
          const a = baueUndLoese(e, uebung, { vorgabe, teil, form }, { st: 3, teil, form, gesehen: lauf, richtig: lauf }, melde);
          if (!a) continue;
          if (!lauf) zaehle(uebung + (vorgabe ? '/' + vorgabe : ''));
          if (a.vorgabe !== (vorgabe || a.vorgabe)) melde(uebung + ' «' + e.id + '»: vorgabe ' + a.vorgabe + ' statt ' + vorgabe);
          if (uebung === 'legen') {
            const lang = e.art === 'satz' || (Lernen.zerlegen(text, e).kern.match(/\p{L}/gu) || []).length > 14;
            if (!!a.lueckenwort !== lang) melde('legen «' + text + '»: ' + (lang ? 'nicht ' : '') + 'als fehlendes Wort');
            if (lang) {
              const schluessel = e.id + '|' + teil + '|' + form;
              lueckenwoerter.set(schluessel, (lueckenwoerter.get(schluessel) || new Set()).add(a.lueckenwort));
              if (!lauf) zaehle(e.art === 'satz' ? 'legen: Satz-Teile mit fehlendem Wort' : 'legen: lange Wortformen');
              if (new Set(frei(a).map(p => p.wort)).size !== 1 || a.kacheln.some(k2 => k2.art !== 'buchstabe')) melde('legen «' + text + '»: mehr als ein Wort zu legen');
              if (frei(a).map(p => p.soll).join('') !== a.lueckenwort.toLowerCase().replace(/[’-]/g, '')) melde('legen «' + text + '»: lueckenwort passt nicht zu den Plätzen');
            }
          }
          if (uebung === 'ordnen' && e.art === 'wort' && !lauf) zaehle('ordnen: lange Wortformen');
          if (uebung === 'bauen' && !lauf) zaehle('bauen: Satz-Teile');
          if (uebung === 'akzent' && !lauf && teil === 0 && form === 0) zaehle('akzent: Einträge');
          if (uebung === 'artikel' && !lauf && teil === 0 && form === 0) zaehle('Knöpfe ' + a.knoepfe.map(x => x.gross).join('/') + ' bei ' + e.artikel);
        }
      }
    });
  }
  soll('akzent für 46 Einträge', zahl['akzent: Einträge'], 46);
  soll('legen mit fehlendem Wort für jeden Satz-Teil', zahl['legen: Satz-Teile mit fehlendem Wort'], VOKABELN.filter(e => e.art === 'satz').reduce((n, e) => n + e.teile.length, 0));
  soll('legen mit fehlendem Wort für die langen Wortformen', zahl['legen: lange Wortformen'], 30);
  soll('ordnen für die langen Wortformen', zahl['ordnen: lange Wortformen'], 28);
  soll('bauen für jeden Satz-Teil', zahl['bauen: Satz-Teile'], VOKABELN.filter(e => e.art === 'satz').reduce((n, e) => n + e.teile.length, 0));
  // Knöpfe der Artikel-Übung nach 2.6
  soll('Knöpfe le/la', [zahl['Knöpfe le/la bei le'] + zahl['Knöpfe le/la bei la'], zahl['Knöpfe un/une bei un'] + zahl['Knöpfe un/une bei une'],
    zahl['Knöpfe männlich/weiblich bei l’'], zahl['Knöpfe männlich/weiblich bei les']], [102, 12, 8, 12]);
  soll('keine anderen Knöpfe', Object.keys(zahl).filter(x => x.startsWith('Knöpfe')).length, 6);
  for (const id of ['u2|un/une enfant', 'u3|un/une élève', 'u4|les parties du visage', 'u4|un peu de persil']) {
    if (Lernen.kann('artikel', E(id), 0, 0, true)) melde('artikel für ' + id);
  }
  // Welches Wort fehlt, wechselt mit dem Kartenstand
  for (const [schluessel, menge] of lueckenwoerter) {
    const [un, fr, teil, form] = schluessel.split('|');
    const e = E(un + '|' + fr), text = e.teile[teil].fr[form];
    // Erwartet: die längsten Wörter ab vier Buchstaben, im Satz lieber solche, die nur einmal dastehen
    const alle = text.split(' ').map(w => w.replace(/[.,!?]+$/, ''));
    const zahlVon = w => alle.filter(x => x.toLowerCase() === w.toLowerCase()).length;
    let moeglich = alle.filter((w, i) => (w.match(/\p{L}/gu) || []).length >= 4 && !V.EIGENNAMEN.includes(w)
      && alle.findIndex(x => x.toLowerCase() === w.toLowerCase()) === i);
    if (e.art === 'satz' && moeglich.some(w => zahlVon(w) === 1)) moeglich = moeglich.filter(w => zahlVon(w) === 1);
    moeglich.sort((a, b) => (b.match(/\p{L}/gu) || []).length - (a.match(/\p{L}/gu) || []).length);
    if (sortiert([...menge]) !== sortiert(moeglich.slice(0, 3))) melde('legen «' + text + '»: es fehlt ' + [...menge].join(', ') + ' statt ' + moeglich.slice(0, 3).join(', '));
  }

  // Lücke im Satz: vier verschiedene Wörter für jedes Wort, das fehlen kann
  let lueckenZahl = 0;
  jederTeil((e, teil, t) => {
    if (e.art !== 'satz') return;
    const gesehenWoerter = new Set();
    for (let gesehen = 0; gesehen < 8; gesehen++) {
      for (let mal = 0; mal < 4; mal++) {
        const a = baueUndLoese(e, 'luecke', { teil, form: 0 }, { st: 2, gesehen }, melde);
        if (!a) continue;
        const wort = a.plaetze.find(p => p.art === 'luecke').soll;
        gesehenWoerter.add(wort);
        const gross = wort[0] !== wort[0].toLowerCase();
        if (a.optionen.some(o => (o.text[0] !== o.text[0].toLowerCase()) !== gross)) melde('luecke «' + t.fr[0] + '»: Gross- und Kleinschreibung gemischt');
        const satz = new Set(t.fr[0].split(' ').map(w => Lernen.falte(w)));
        if (a.optionen.some(o => !o.richtig && satz.has(Lernen.falte(o.text)))) melde('luecke «' + t.fr[0] + '»: falsche Antwort steht im Satz');
        if (a.optionen.some(o => V.EIGENNAMEN.includes(o.text))) melde('luecke «' + t.fr[0] + '»: Name als Antwort');
      }
    }
    // Erwartet: alle Wörter ab vier Buchstaben, die im Satz einmal stehen und kein Name sind
    const alle = t.fr[0].split(' ').map(w => w.replace(/[.,!?]+$/, ''));
    const moeglich = alle.filter(w => (w.match(/\p{L}/gu) || []).length >= 4 && !V.EIGENNAMEN.includes(w)
      && alle.filter(x => x.toLowerCase() === w.toLowerCase()).length === 1);
    soll('Lückenwörter von «' + t.fr[0] + '»', sortiert([...gesehenWoerter]), sortiert(moeglich));
    lueckenZahl += gesehenWoerter.size;
  });
  soll('Lücke in «Vous coupez. Coupez.»', frei(Lernen.aufgabe(schritt(E('u4|Vous coupez. Coupez.'), 'luecke'), null))[0].soll, 'Vous');

  // Finale
  const kids = ['u1|le livre', 'u3|le foot, faire du foot', 'u1|la chaise', 'u1|lundi', 'gibt es nicht'];
  const p = Lernen.aufgabe({ uebung: 'paare', rolle: 'paare', kids }, { karten: { 'u3|le foot, faire du foot': stand({ st: 2, teil: 1 }) } });
  soll('paare: Felder', sortiert(Object.keys(p)), sortiert([...IMMER, ...DAZU.paare]));
  soll('paare', p.paare.map(x => x.fr + ' = ' + x.de + ' (' + x.nr + ', ' + x.clip.s + ')'),
    ['le livre = das Buch (2, le livre)', 'faire du foot = Fussball spielen (' + E('u3|le foot, faire du foot').nr + ', faire du foot)',
      'la chaise = der Stuhl (12, la chaise)', 'lundi = Montag (19, lundi)']);
  soll('paare: Äpfel', p.aepfel, 4);
  soll('unbekannte Übung oder Karte', [Lernen.aufgabe({ uebung: 'raten', nr: 3, kid: VOKABELN[3].kid }, null), Lernen.aufgabe({ uebung: 'legen', nr: 999, kid: 'x' }, null),
    Lernen.aufgabe(null, null)], [null, null, null]);
  // Der Schritt nennt die Karte, die Aufgabe zeigt den Eintrag: das zweite «la fille» mit seinem eigenen Deutsch
  const fille = E('u3|la fille');
  soll('zweites «la fille»', [Lernen.aufgabe(schritt(fille, 'kennen'), null).de, Lernen.aufgabe({ uebung: 'kennen', kid: fille.kid }, null).de],
    ['das Mädchen, die Tochter', 'die Tochter, das Mädchen']);

  /* Die Beispiele aus Teil 2 und 4 des Bauplans */
  const auf = (id, uebung, mehr, k) => Lernen.aufgabe(schritt(E(id), uebung, mehr), zMit(E(id), k || {}));
  const leit = (id, st, mehr, mitTon) => {
    const l = Lernen.leitaufgabe(E(id), stand({ st, ...mehr }), mitTon !== false);
    return l.uebung + '/' + l.vorgabe + ' ' + E(id).teile[l.teil].fr[l.form];
  };
  const kachelTexte = a => sortiert(a.kacheln.filter(k2 => !k2.fremd).map(k2 => k2.text));

  // 2.6
  const art = id => {
    const a = auf(id, 'artikel');
    return [a.kopf, a.rest, a.de, a.genus, a.knoepfe.map(x => x.gross + ' ' + x.klein).join(' | '), a.fr];
  };
  soll('artikel «la chaise»', art('u1|la chaise'), ['chaise', '', 'Stuhl', 'f', 'le männlich | la weiblich', 'la chaise']);
  soll('artikel «une école»', art('u1|une école'), ['école', '', 'Schule', 'f', 'un männlich | une weiblich', 'une école']);
  soll('artikel «l’allemand»', art('u1|l’allemand (m)'), ['allemand', '', 'Deutsch', 'm', 'männlich (m) | weiblich (f)', 'l’allemand']);
  soll('artikel «les ciseaux»', art('u1|les ciseaux (m pl)'), ['les ciseaux', '', 'Schere', 'm', 'männlich (m) | weiblich (f)', 'les ciseaux']);
  soll('artikel «le membre de la famille»', art('u2|le membre de la famille'),
    ['membre', 'de la famille', 'Familienmitglied', 'm', 'le männlich | la weiblich', 'le membre de la famille']);
  soll('artikel «la feuille d’ananas»', art('u4|la feuille d’ananas').slice(0, 3), ['feuille', 'd’ananas', 'Ananasblatt']);
  soll('artikel «les sciences de la nature»', art('u1|les sciences (f pl) de la nature').slice(0, 3), ['les sciences', 'de la nature', 'Naturwissenschaften']);
  soll('artikel «le bébé»', art('u2|le bébé').slice(0, 3), ['bébé', '', 'Baby, Kleinkind']);
  soll('artikel: Deutsch ohne Artikel bleibt richtiges Deutsch', ['u4|le champignon blanc', 'u1|le dessin', 'u4|le raisin vert/bleu', 'u4|la demi-rondelle de concombre',
    'u4|le raisin sec', 'u1|un agenda'].map(id => art(id)[2]),
  ['weisser Champignon', 'bildnerisches Gestalten, Zeichnung', 'grüne Traube', 'halbe Gurkenscheibe', 'Rosine (getrocknete Traube)', 'Agenda']);

  // 4.5 · les maths, les mathématiques
  soll('artikel «les maths»', art('u1|les maths, les mathématiques (f pl)'), ['les maths', '', 'Mathematik', 'f', 'männlich (m) | weiblich (f)', 'les maths']);
  const maths = auf('u1|les maths, les mathématiques (f pl)', 'schreiben', { form: 1 });
  soll('schreiben «les mathématiques»', [maths.ziel, maths.andersAls, maths.formen], ['les mathématiques', ['les maths'], ['les maths', 'les mathématiques']]);
  soll('schreiben «les maths»', auf('u1|les maths, les mathématiques (f pl)', 'schreiben', { form: 0 }).andersAls, []);
  soll('Diktat «les mathématiques» druckt nichts', auf('u1|les maths, les mathématiques (f pl)', 'schreiben', { form: 1, vorgabe: 'ton' }).andersAls, []);
  soll('legen wechselt die Form', [auf('u1|les maths, les mathématiques (f pl)', 'legen', { form: 0 }).fr, auf('u1|les maths, les mathématiques (f pl)', 'legen', { form: 1 }).fr],
    ['les maths', 'les mathématiques']);
  // un/une enfant
  const enfant = auf('u2|un/une enfant', 'legen');
  soll('legen «un enfant»', [buchstabenBild(enfant.plaetze), enfant.plaetze[0].soll, enfant.kacheln.slice(0, 2).map(k2 => k2.text + ' ' + k2.art + (k2.fremd ? ' fremd' : ''))],
    ['[artikel] _ e n f a n t', ['un', 'une'], ['un artikel', 'une artikel']]);
  for (const artikel of ['un', 'une']) {
    if (!Lernen.reihenUrteil([artikel, ...'enfant'], frei(enfant)).richtig) melde('legen «un enfant»: ' + artikel + ' nicht angenommen');
  }
  // un/une élève: Das Deutsche nennt das Geschlecht, also zählt nur der passende Artikel
  const eleve = auf('u3|un/une élève', 'legen', { teil: 1 });
  soll('legen «une élève»', [eleve.de, eleve.plaetze[0].soll, eleve.kacheln.slice(0, 2).map(k2 => k2.text + (k2.fremd ? ' fremd' : ''))],
    ['eine Schülerin', 'une', ['un fremd', 'une']]);
  // la mère, la maman
  soll('finden «die Mutter»', auf('u2|la mère, la maman', 'finden').optionen.find(o => o.richtig).text, 'la mère');
  // les yeux, un œil
  soll('artikel «les yeux»', art('u4|les yeux (m pl), un œil').slice(0, 5), ['les yeux', '', 'Augen', 'm', 'männlich (m) | weiblich (f)']);
  const oeil = auf('u4|les yeux (m pl), un œil', 'legen', { teil: 1 });
  soll('legen «un œil»', [buchstabenBild(oeil.plaetze), oeil.kacheln.slice(0, 2).map(k2 => k2.text), kachelTexte(oeil), sortiert(fremde(oeil))],
    ['[artikel] _ œ i l', ['un', 'une'], 'i l un œ', 'e o une y']);
  // le raisin vert/bleu
  soll('«le raisin vert/bleu» fragt die Varianten einzeln', [auf('u4|le raisin vert/bleu', 'bedeutung', { teil: 0 }).fr + ' = ' + auf('u4|le raisin vert/bleu', 'bedeutung', { teil: 0 }).de,
    auf('u4|le raisin vert/bleu', 'bedeutung', { teil: 1 }).fr + ' = ' + auf('u4|le raisin vert/bleu', 'bedeutung', { teil: 1 }).de],
  ['le raisin vert = die grüne Traube', 'le raisin bleu = die blaue Traube']);
  // ACM
  soll('ACM wird als «ACM» geschrieben', [leit('u1|ACM (activités créatrices manuelles)', 3), leit('u1|ACM (activités créatrices manuelles)', 4, { form: 1 }),
    auf('u1|ACM (activités créatrices manuelles)', 'schreiben', { form: 1 }).ziel], ['schreiben/de ACM', 'schreiben/de ACM', 'ACM']);
  soll('ACM: die lange Form wird geordnet und Wort für Wort gelegt', [leit('u1|ACM (activités créatrices manuelles)', 2, { form: 1 }),
    auf('u1|ACM (activités créatrices manuelles)', 'legen', { form: 1 }).lueckenwort, leit('u1|ACM (activités créatrices manuelles)', 2, { form: 0 })],
  ['ordnen/de les activités créatrices manuelles', 'créatrices', 'legen/de ACM']);
  const acm = auf('u1|ACM (activités créatrices manuelles)', 'legen');
  soll('legen «ACM»', [buchstabenBild(acm.plaetze), sortiert(fremde(acm))], ['A C M', 'N S']);
  // Tu coupes. Coupe.
  const coupes = auf('u4|Tu coupes. Coupe.', 'ordnen');
  soll('ordnen «Tu coupes. Coupe.»', [wortBild(coupes.plaetze), kachelTexte(coupes), frei(coupes).map(x => x.satzanfang)], ['[ ][ ]. [ ].', 'coupe coupes tu', [true, false, true]]);
  const coupez = auf('u4|Vous coupez. Coupez.', 'ordnen');
  if (!Lernen.reihenUrteil(['vous', 'coupez', 'coupez'], frei(coupez)).richtig) melde('ordnen «Vous coupez. Coupez.»: die beiden «coupez» sind nicht austauschbar');
  // Prends la pâte …, Forme une …
  soll('ordnen «Prends la pâte …»', [0, 1, 2].map(teil => kachelTexte(auf('u4|Prends la pâte bleue/verte/rouge.', 'ordnen', { teil }))),
    ['bleue la prends pâte', 'la prends pâte verte', 'la prends pâte rouge']);
  soll('ordnen «Forme une …»', [0, 1].map(teil => auf('u4|Forme une grande/petite boule pour le corps.', 'ordnen', { teil }).kacheln.length), [7, 7]);
  for (let mal = 0; mal < 20; mal++) {
    const b = auf('u4|Prends la pâte bleue/verte/rouge.', 'bauen', { teil: 0 });
    if (!fremde(b).includes('verte') || !fremde(b).includes('rouge')) melde('bauen «Prends la pâte bleue.»: fremde Kacheln ' + fremde(b).join(', '));
    const l = auf('u4|Prends la pâte bleue/verte/rouge.', 'luecke', { teil: 0 }, { gesehen: 1 });
    if (frei(l)[0].soll !== 'bleue' || !l.optionen.some(o => o.text === 'verte') || !l.optionen.some(o => o.text === 'rouge')) melde('luecke «Prends la pâte bleue.»: ' + l.optionen.map(o => o.text).join(', '));
  }
  // aimer, j’aime
  soll('legen «j’aime»', buchstabenBild(auf('u3|aimer, j’aime', 'legen', { teil: 1 }).plaetze), 'j ’ a i m e');
  // le foot, faire du foot
  soll('artikel «le foot»', art('u3|le foot, faire du foot').slice(0, 3), ['foot', '', 'Fussball']);
  // rencontrer des amis/amies
  const amis = E('u3|rencontrer des amis/amies');
  soll('«rencontrer des amis/amies»: Hör-Aufgaben nehmen Teil 0', [auf(amis.id, 'hoeren', { teil: 1 }).fr, auf(amis.id, 'lauschen', { teil: 1 }).fr, auf(amis.id, 'bedeutung', { teil: 1 }).fr,
    leit(amis.id, 1, { teil: 1 })], ['rencontrer des amis', 'rencontrer des amis', 'rencontrer des amies', 'hoeren/ton rencontrer des amis']);
  // ma passion, c’est...
  const passion = auf('u3|ma passion, c’est...', 'legen');
  soll('legen «ma passion, c’est»', buchstabenBild(passion.plaetze), 'm a _ p a s s i o n , _ c ’ e s t');
  // un peu de persil
  const persil = auf('u4|un peu de persil', 'legen');
  soll('legen «un peu de persil»', [buchstabenBild(persil.plaetze), persil.kacheln.filter(k2 => k2.art === 'artikel').length, persil.lueckenwort],
    ['u n _ p e u _ d e _ p e r s i l', 0, null]);
  // le hockey sur glace
  const hockey = auf('u3|le hockey sur glace', 'legen');
  soll('legen «le hockey sur glace»', [buchstabenBild(hockey.plaetze), hockey.plaetze.filter(x => x.art !== 'fest' || x.text !== ' ').map(x => x.wort).join(''), hockey.lueckenwort],
    ['[artikel] _ h o c k e y _ s u r _ g l a c e', '0000000111' + '22222', null]);
  // la rondelle de concombre
  const rondelle = 'u4|la rondelle de concombre';
  soll('«la rondelle de concombre» auf der Leiter', [leit(rondelle, 2), leit(rondelle, 3), kachelTexte(auf(rondelle, 'ordnen'))],
    ['ordnen/de la rondelle de concombre', 'schreiben/de la rondelle de concombre', 'concombre de la rondelle']);
  soll('legen «la rondelle de concombre»', [0, 1, 2].map(richtig => {
    const a = auf(rondelle, 'legen', {}, { richtig });
    return a.lueckenwort + ': ' + buchstabenBild(a.plaetze);
  }), ['concombre: la _ rondelle _ de _ c o n c o m b r e', 'rondelle: la _ r o n d e l l e _ de _ concombre', 'concombre: la _ rondelle _ de _ c o n c o m b r e']);
  soll('zwei Wörter reichen nicht zum Ordnen', [leit('u1|explorer l’étranger', 2), auf('u1|explorer l’étranger', 'legen').lueckenwort,
    buchstabenBild(auf('u1|explorer l’étranger', 'legen').plaetze)], ['legen/de explorer l’étranger', 'l’étranger', 'explorer _ l ’ é t r a n g e r']);
  // Sätze: Stufe um Stufe
  soll('Satz auf der Leiter', [1, 2, 3, 4, 5].map(st => leit('u4|Pour le nez, je prends une carotte.', st).split(' ')[0]),
    ['hoeren/ton', 'ordnen/ton', 'ordnen/de', 'bauen/de', 'bauen/de']);
  soll('Satz auf der Leiter ohne Ton', [1, 2, 3, 4].map(st => leit('u4|Pour le nez, je prends une carotte.', st, {}, false).split(' ')[0]),
    ['bedeutung/fr', 'ordnen/de', 'ordnen/de', 'bauen/de']);
  soll('kurzer Satz auf der Leiter', [2, 3, 4].map(st => leit('u4|C’est quoi?', st).split(' ')[0]), ['bauen/de', 'bauen/de', 'bauen/de']);
  soll('Wort auf der Leiter', [0, 1, 2, 3, 4, 5].map(st => leit('u1|la chaise', st).split(' ')[0]),
    ['bedeutung/fr', 'hoeren/ton', 'legen/de', 'schreiben/de', 'schreiben/de', 'schreiben/de']);
  soll('Paar auf der Leiter: der Teil, bei dem die Karte steht', leit('u4|les yeux (m pl), un œil', 3, { teil: 1 }), 'schreiben/de un œil');
  const satz = auf('u4|Pose la fraise sur l’assiette.', 'legen', {}, { richtig: 0 });
  soll('legen im Satz', [satz.lueckenwort, buchstabenBild(satz.plaetze)], ['l’assiette', 'Pose _ la _ fraise _ sur _ l ’ a s s i e t t e .']);
  const rentree = auf('u1|Chouette, c’est la rentrée!', 'legen', {}, { richtig: 0 });
  soll('legen am Satzanfang', [rentree.lueckenwort, buchstabenBild(rentree.plaetze), frei(rentree)[0].satzanfang, sortiert(rentree.kacheln.filter(k2 => !k2.fremd).map(k2 => k2.text))],
    ['Chouette', 'c h o u e t t e , _ c’est _ la _ rentrée !', true, 'c e e h o t t u']);

  // 4.6
  const gm = auf('u2|la grand-mère', 'legen');
  soll('legen «la grand-mère»', [buchstabenBild(gm.plaetze), kachelTexte(gm), sortiert(fremde(gm)), gm.kacheln.slice(0, 2).map(k2 => k2.text)],
    ['[artikel] _ g r a n d - m è r e', 'a d e g la m n r r è', 'e j le é', ['le', 'la']]);
  const allemand = auf('u1|l’allemand (m)', 'legen');
  soll('legen «l’allemand»', [buchstabenBild(allemand.plaetze), sortiert(fremde(allemand)), allemand.kacheln.some(k2 => k2.art === 'artikel')],
    ['l’ a l l e m a n d', 'n à é', false]);
  soll('legen «les ciseaux»', buchstabenBild(auf('u1|les ciseaux (m pl)', 'legen').plaetze), 'les _ c i s e a u x');
  // Was beim Legen schiefgehen kann, und welcher Tipp dazu passt
  const gmFrei = frei(gm);
  const tipp = gelegt => {
    const u = Lernen.reihenUrteil(gelegt, gmFrei);
    return [u.richtig, u.stellen, u.tipp, u.fehler];
  };
  soll('reihenUrteil richtig', tipp(['la', ...'grandmère']), [true, [], null, []]);
  soll('reihenUrteil nur der Artikel', tipp(['le', ...'grandmère']), [false, [0], 'genus', ['genus']]);
  soll('reihenUrteil nur ein Akzent', tipp(['la', ...'grandmére']), [false, [7], 'akzent', ['akzent']]);
  soll('reihenUrteil ein Buchstabe', tipp(['la', ...'grandnère']), [false, [6], 'buchstabe', []]);
  soll('reihenUrteil zwei Buchstaben', tipp(['la', ...'grandmrèe']), [false, [7, 8], 'legen', []]);
  soll('reihenUrteil Artikel und Akzent', tipp(['le', ...'grandmere']), [false, [0, 7], 'legen', ['genus', 'akzent']]);
  soll('reihenUrteil mit Texten', Lernen.reihenUrteil(['a', 'b', 'c'], ['a', ['x', 'b'], 'd']).stellen, [2]);
  soll('reihenUrteil mit leerem Platz', Lernen.reihenUrteil(['a', null], ['a', 'b']).stellen, [1]);
  const nez = auf('u4|Pour le nez, je prends une carotte.', 'ordnen');
  soll('reihenUrteil Reihenfolge', [Lernen.reihenUrteil(['le', 'pour', 'nez', 'je', 'prends', 'une', 'carotte'], frei(nez)).tipp,
    Lernen.reihenUrteil(['pour', 'le', 'nez', 'je', 'prends', 'une', 'poire'], frei(nez)).tipp], ['reihenfolge', 'legen']);

  // 4.7
  const luecken = id => {
    const a = auf(id, 'akzent');
    return a.plaetze.map(x => (x.art === 'luecke' ? '[' + x.soll + ']' : x.text)).join('');
  };
  soll('akzent «la règle»', luecken('u1|la règle'), 'la r[è]gl[e]');
  soll('akzent «le garçon»', luecken('u3|le garçon'), 'le g[a]r[ç]on');
  soll('akzent «voici, voilà»', [luecken('u2|voici, voilà'), auf('u2|voici, voilà', 'akzent').de], ['voil[à]', 'da ist']);
  soll('akzent «un œil»', [luecken('u4|les yeux (m pl), un œil'), frei(auf('u4|les yeux (m pl), un œil', 'akzent'))[0].wahl], ['un [œ]il', ['oe', 'œ']]);
  soll('akzent «les mathématiques»', auf('u1|les maths, les mathématiques (f pl)', 'akzent').fr, 'les mathématiques');
  soll('Kandidaten einer Lücke', frei(auf('u1|la règle', 'akzent')).map(x => x.wahl.join('')), ['eéèê', 'eéèê']);

  // 4.8
  soll('ordnen «Pour le nez, je prends une carotte.»', [wortBild(nez.plaetze), nez.kacheln.map(k2 => k2.text).sort().join(' ')],
    ['[ ][ ][ ], [ ][ ][ ][ ].', 'carotte je le nez pour prends une']);
  const lionel = auf('u2|Lionel est le frère de Nathalie.', 'ordnen');
  soll('Eigennamen bleiben gross', kachelTexte(lionel), sortiert(['Lionel', 'est', 'le', 'frère', 'de', 'Nathalie']));
  soll('wortkacheln mit fremden Wörtern', (() => {
    const w = Lernen.wortkacheln('Pique un raisin.', ['poire', 'des']);
    return [wortBild(w.plaetze), w.kacheln.length, sortiert(w.kacheln.filter(k2 => k2.fremd).map(k2 => k2.text))];
  })(), ['[ ][ ][ ].', 5, 'des poire']);
  soll('ordnen nach dem Ohr nur für Sätze', [auf('u4|Pique un raisin.', 'ordnen', { vorgabe: 'ton' }).vorgabe, auf(rondelle, 'ordnen', { vorgabe: 'ton' }).vorgabe], ['ton', 'de']);

  // 5.4
  const kontraste = VOKABELN.filter(e => Lernen.kontrast(e));
  soll('Geschlechter-Kontrast', kontraste.length, 26);
  for (const id of ['u1|la chaise', 'u1|la table', 'u1|la gomme', 'u2|le chat', 'u4|le nez', 'u4|la bouche', 'u4|la tête', 'u4|la pomme', 'u4|un ananas', 'u1|un agenda']) {
    if (!Lernen.kontrast(E(id))) melde('kein Kontrast für ' + id);
  }
  soll('Kontrast «la chaise»', Lernen.kontrast(E('u1|la chaise')), 'Achtung: der Stuhl, aber la chaise.');
  soll('kein Kontrast', ['u1|le livre', 'u2|la fille', 'u3|la fille', 'u2|les parents (m pl)', 'u3|un animal, les animaux (m pl)', 'u1|lundi', 'u4|un peu de persil']
    .map(id => Lernen.kontrast(E(id))), [null, null, null, null, null, null, null]);

  return Object.entries(zahl).filter(([was]) => !was.includes(':') && !was.startsWith('Knöpfe')).map(([was, n]) => n + ' ' + was).join(', ') + ', ' + lueckenZahl + ' Lückenwörter';
});

/* ---------- 4 · Ablenker ---------- */

pruefung(4, 'Ablenker: verschieden, nie zwei richtige Antworten', melde => {
  const inGruppe = (gruppen, a, b) => gruppen.some(g => g.includes(a) && g.includes(b));
  const zeige = (seite, e, teil, form) => (seite === 'de' ? e.teile[teil].zeigeDe : e.teile[teil].fr[form || 0]);
  let zahl = 0;
  for (let lauf = 0; lauf < 6; lauf++) {
    jedeForm((e, teil, form) => {
      for (const seite of ['de', 'fr', 'klang']) {
        if (seite !== 'de' && e.art !== 'wort') continue;
        const n = seite === 'de' && e.art === 'satz' ? 2 : 3;
        const wo = seite + ' «' + e.teile[teil].fr[form] + '»';
        const liste = Lernen.ablenker(e, teil, seite, n, form);
        zahl++;
        if (liste.length !== n) melde(wo + ': ' + liste.length + ' statt ' + n);
        const ziel = zeige(seite, e, teil, form);
        const texte = [ziel, ...liste.map(x => zeige(seite, x.e, x.teil, 0))];
        if (new Set(texte.map(Lernen.norm)).size !== texte.length) melde(wo + ': nicht verschieden: ' + texte.join(' | '));
        const deZiel = new Set(e.deAlle.map(Lernen.norm));
        for (const x of liste) {
          const wer = wo + ' → «' + x.e.id + '»';
          if (!x.e.teile[x.teil]) melde(wer + ': Teil gibt es nicht');
          if (V.KARTE[x.e.kid] !== x.e) melde(wer + ': ist keine Karte');
          if (x.e.kid === e.kid) melde(wer + ': dieselbe Karte');
          if (inGruppe(V.KLANGGRUPPEN, x.e.kid, e.kid)) melde(wer + ': klingt gleich');
          if (inGruppe(V.NIE_ZUSAMMEN, x.e.kid, e.kid)) melde(wer + ': nie zusammen');
          if (x.e.deAlle.some(d => deZiel.has(Lernen.norm(d)))) melde(wer + ': dasselbe Deutsch');
          if (x.e.art !== e.art) melde(wer + ': Satz und Wort gemischt');
          if (seite === 'klang' && x.teil !== 0) melde(wer + ': nicht Teil 0');
        }
        // finden: Zu «le …» und «la …» tragen alle drei denselben Artikel. Gemeint ist, was zu sehen ist:
        // «un peu de persil» hat keinen Artikel, beginnt aber mit «un»
        const sichtbar = f => Lernen.zerlegen(f).artikel;
        const artikel = sichtbar(e.teile[teil].fr[form]);
        if (seite === 'fr' && (artikel === 'le' || artikel === 'la')) {
          for (const x of liste) if (sichtbar(x.e.teile[x.teil].fr[0]) !== artikel) melde(wo + ' → «' + x.e.teile[x.teil].fr[0] + '»: anderer Artikel');
        }
        // zu «un …» und «une …» tragen alle drei «un» oder «une»
        if (seite === 'fr' && (artikel === 'un' || artikel === 'une')) {
          for (const x of liste) if (!['un', 'une'].includes(sichtbar(x.e.teile[x.teil].fr[0]))) melde(wo + ' → «' + x.e.teile[x.teil].fr[0] + '»: ohne un oder une');
        }
        // und zu einer Form ohne Artikel trägt keine einen
        if (seite === 'fr' && artikel === null) {
          for (const x of liste) if (sichtbar(x.e.teile[x.teil].fr[0]) !== null) melde(wo + ' → «' + x.e.teile[x.teil].fr[0] + '»: mit Artikel');
        }
        // bedeutung, hoeren: Auch der deutsche Artikel verrät nichts. Bei Nomen trägt jede Antwort dieselbe
        // Sorte wie das Ziel: «ein, eine», «der, die, das» oder keinen
        const deSorte = d => (/^(ein|eine|einen) /.test(d) ? 'ein' : /^(der|die|das) /.test(d) ? 'der' : 'ohne');
        if (seite === 'de' && e.art === 'wort' && !['verb', 'gram'].includes(e.cat)) {
          const art = deSorte(e.teile[teil].zeigeDe);
          for (const x of liste) if (deSorte(x.e.teile[x.teil].zeigeDe) !== art) melde(wo + ' → «' + x.e.teile[x.teil].zeigeDe + '»: anderer deutscher Artikel als «' + e.teile[teil].zeigeDe + '»');
        }
      }
    });
  }
  // lauschen: die drei Karten, die am ähnlichsten klingen
  const klang = (id, teil) => sortiert(Lernen.ablenker(E(id), teil || 0, 'klang', 3).map(x => x.e.teile[0].fr[0]));
  const soll = (was, ist, erwartet) => {
    if (ist !== erwartet) melde(was + ': «' + ist + '» statt «' + erwartet + '»');
  };
  for (let mal = 0; mal < 10; mal++) {
    soll('lauschen «le cousin»', klang('u2|le cousin').includes('la cousine'), true);
    // «la mère», «le frère», «le bébé» und «le sexe» liegen gleich nah: drei davon, welche, entscheidet der Zufall
    soll('lauschen «le père»', klang('u2|le père, le papa').split(' le ').join(' la ').split(' la ').length === 3
      && Lernen.ablenker(E('u2|le père, le papa'), 0, 'klang', 3).every(x => ['la mère', 'le frère', 'le bébé', 'le sexe'].includes(x.e.teile[0].fr[0])), true);
    soll('lauschen «il s’appelle»', klang('u2|il s’appelle, elle s’appelle').includes('ils s’appellent'), false);
  }
  // Keine Karte, die zur Wahl steht, klingt ähnlicher als die drei gewählten
  jederTeil((e, teil, t) => {
    if (e.art !== 'wort') return;
    const ziel = Lernen.falte(t.fr[0]), weite = k => Lernen.abstand(ziel, Lernen.falte(k.teile[0].fr[0]));
    const nah = Lernen.ablenker(e, teil, 'klang', 3);
    const weit = Math.max(...nah.map(x => weite(x.e)));
    const deZiel = new Set(e.deAlle.map(Lernen.norm));
    const besser = KARTEN.find(k => k.art === 'wort' && k.kid !== e.kid && !nah.some(x => x.e === k) && weite(k) < weit
      && Lernen.norm(k.teile[0].fr[0]) !== Lernen.norm(t.fr[0]) && !k.deAlle.some(d => deZiel.has(Lernen.norm(d)))
      && !inGruppe(V.KLANGGRUPPEN, k.kid, e.kid) && !inGruppe(V.NIE_ZUSAMMEN, k.kid, e.kid));
    if (besser) melde('lauschen «' + t.fr[0] + '»: «' + besser.teile[0].fr[0] + '» klingt ähnlicher als die Auswahl');
  });
  // finden «der Stuhl»: alle vier beginnen mit «la»
  for (let mal = 0; mal < 30; mal++) {
    const a = Lernen.aufgabe(schritt(E('u1|la chaise'), 'finden'), null);
    if (a.optionen.some(o => !o.text.startsWith('la '))) melde('finden «der Stuhl»: ' + a.optionen.map(o => o.text).join(' | '));
    const b = Lernen.aufgabe(schritt(E('u3|le foot, faire du foot'), 'finden', { teil: 1 }), null);
    if (b.optionen.some(o => /^(le |la |les |l’|un |une )/.test(o.text))) melde('finden «Fussball spielen»: ' + b.optionen.map(o => o.text).join(' | '));
    const c = Lernen.aufgabe(schritt(E('u3|la fille'), 'bedeutung'), null);
    if (c.optionen.filter(o => /Mädchen|Tochter/.test(o.text)).length !== 1) melde('bedeutung «la fille»: ' + c.optionen.map(o => o.text).join(' | '));
    // «une oreille»: Alle vier Antworten beginnen mit «ein» oder «eine», sonst wäre die einzige die richtige
    for (const uebung of ['bedeutung', 'hoeren']) {
      const d = Lernen.aufgabe(schritt(E('u4|une oreille'), uebung), null);
      if (d.optionen.some(o => !/^(ein|eine) /.test(o.text))) melde(uebung + ' «une oreille»: ' + d.optionen.map(o => o.text).join(' | '));
    }
    // «réciter un poème»: Unter den Verben gibt es noch eines mit «ein», also steht es dabei
    const g = Lernen.aufgabe(schritt(E('u1|réciter un poème'), 'bedeutung'), null);
    if (g.optionen.filter(o => /^(ein|eine) /.test(o.text)).length < 2) melde('bedeutung «réciter un poème»: ' + g.optionen.map(o => o.text).join(' | '));
    // «un peu de persil»: Die anderen drei beginnen auch mit «un» oder «une»
    const f = Lernen.aufgabe(schritt(E('u4|un peu de persil'), 'finden'), null);
    if (f.optionen.some(o => !/^(un|une) /.test(o.text))) melde('finden «un peu de persil»: ' + f.optionen.map(o => o.text).join(' | '));
  }
  return zahl + ' Auswahlen';
});

/* ---------- 5 · Urteil ---------- */

pruefung(5, 'Urteil über Getipptes: die Tabelle aus dem Bauplan', melde => {
  // [Eintrag, Eingabe, { teil, form, vorgabe }, erwartet: richtig, ganz, artikel, kern]
  const J = true, N = false;
  const TABELLE = [
    ['u1|la chaise', 'la chaise', {}, J, null, 'ok', 'ok'],
    ['u1|la chaise', 'une chaise', {}, J, null, 'buch', 'ok'],
    ['u1|la règle', 'la regle', {}, N, null, 'ok', 'akzent'],
    ['u1|le livre', 'livre', {}, N, null, 'fehlt', 'ok'],
    ['u1|la règle', 'regle', {}, N, null, 'fehlt', 'akzent'],
    ['u1|la règle', 'le regle', {}, N, null, 'genus', 'akzent'],
    ['u1|le livre', 'la livre', {}, N, null, 'genus', 'ok'],
    ['u2|la cousine', 'le cousine', {}, N, null, 'genus', 'ok'],
    ['u2|la cousine', 'la cousin', {}, N, null, 'ok', 'tippfehler'],
    ['u2|la sœur', 'la soeur', {}, N, null, 'ok', 'ligatur'],
    ['u1|l’allemand (m)', 'le allemand', {}, N, null, 'elision', 'ok'],
    ['u2|un oncle', 'le oncle', {}, N, null, 'elision', 'ok'],
    ['u1|une école', 'la école', {}, N, null, 'elision', 'ok'],
    ['u2|un oncle', 'l’oncle', {}, J, null, 'buch', 'ok'],
    ['u4|le hérisson', 'l’hérisson', {}, N, null, 'artikel_ganz', 'ok'],
    ['u3|le hockey sur glace', 'l’hockey sur glace', {}, N, null, 'artikel_ganz', 'ok'],
    ['u1|le français', 'un français', {}, N, null, 'anders', 'ok'],
    ['u1|l’allemand (m)', 'lallemand', {}, N, null, 'ok', 'zeichen'],
    ['u2|la grand-mère', 'la grand mère', {}, N, null, 'ok', 'zeichen'],
    ['u1|ACM (activités créatrices manuelles)', 'acm', {}, J, null, 'ok', 'ok'],
    ['u2|la mère, la maman', 'la maman', {}, J, 'auch', 'ok', 'ok'],
    ['u1|les maths, les mathématiques (f pl)', 'les maths', { form: 1 }, N, 'gleiche_form', 'ok', 'anders'],
    ['u1|la gym, la gymnastique', 'la gymnastique', { vorgabe: 'ton' }, N, 'andere_form', 'ok', 'anders'],
    ['u1|la chaise', 'une chaise', { vorgabe: 'ton' }, N, 'andere_form', 'anders', 'ok'],
    ['u2|la cousine', 'le cousin', {}, N, 'verwechselt', 'genus', 'tippfehler'],
    ['u4|un peu de persil', 'peu de persil', {}, N, null, 'ok', 'anders'],
    ['u4|un peu de persil', 'le peu de persil', {}, N, null, 'ok', 'anders'],
    // Abnahme 16
    ['u2|un oncle', 'un oncle', {}, J, null, 'ok', 'ok'],
    ['u1|une école', 'l’école', {}, J, null, 'buch', 'ok'],
    // Was die Tabelle des Bauplans offen lässt
    ['u1|la chaise', '  La   Chaise ', {}, J, null, 'ok', 'ok'],
    ['u2|un oncle', "l'oncle", {}, J, null, 'buch', 'ok'],
    ['u2|qui?', 'qui', {}, J, null, 'ok', 'ok'],
    ['u3|ma passion, c’est...', 'ma passion c’est', {}, J, null, 'ok', 'ok'],
    ['u3|ma passion, c’est...', 'ma passion, c’est', {}, J, null, 'ok', 'ok'],
    ['u3|la BD (la bande dessinée)', 'la bd', {}, J, null, 'ok', 'ok'],
    ['u3|la BD (la bande dessinée)', 'la bande dessinée', {}, J, 'auch', 'ok', 'ok'],
    ['u3|la BD (la bande dessinée)', 'la bd', { form: 1 }, N, 'gleiche_form', 'ok', 'anders'],
    ['u2|un/une enfant', 'une enfant', {}, J, 'auch', 'ok', 'ok'],
    ['u2|un/une enfant', 'l’enfant', {}, J, null, 'buch', 'ok'],
    ['u2|la mère, la maman', 'la maman', { vorgabe: 'ton' }, N, 'andere_form', 'ok', 'anders'],
    ['u2|la mère, la maman', 'la mère', { form: 1, vorgabe: 'ton' }, N, 'andere_form', 'ok', 'anders'],
    ['u2|la mère, la maman', 'une maman', { form: 1 }, J, null, 'buch', 'ok'],
    ['u1|la chaise', 'la chaize', { vorgabe: 'ton' }, N, null, 'ok', 'tippfehler'],
    ['u1|la chaise', 'une chaize', { vorgabe: 'ton' }, N, null, 'anders', 'tippfehler'],
    ['u1|la chaise', 'un chaise', {}, N, null, 'genus', 'ok'],
    ['u1|le livre', 'une livre', {}, N, null, 'genus', 'ok'],
    ['u1|la chaise', 'les chaise', {}, N, null, 'anders', 'ok'],
    ['u1|la chaise', 'l’chaise', {}, N, null, 'anders', 'ok'],
    ['u1|la chaise', 'chaise', {}, N, null, 'fehlt', 'ok'],
    ['u1|la chaise', '', {}, N, null, 'fehlt', 'anders'],
    ['u1|la chaise', 'la chiase', {}, N, null, 'ok', 'tippfehler'],
    ['u1|la chaise', 'la schaise', {}, N, null, 'ok', 'tippfehler'],
    ['u1|la chaise', 'la table', {}, N, 'verwechselt', 'ok', 'anders'],
    ['u1|les ciseaux (m pl)', 'le ciseaux', {}, N, null, 'anders', 'ok'],
    ['u1|les ciseaux (m pl)', 'ciseaux', {}, N, null, 'fehlt', 'ok'],
    ['u2|l’âge (m)', 'un âge', {}, J, null, 'buch', 'ok'],
    ['u2|l’âge (m)', 'une âge', {}, N, null, 'genus', 'ok'],
    ['u2|l’âge (m)', 'le age', {}, N, null, 'elision', 'akzent'],
    ['u1|l’allemand (m)', 'un allemand', {}, N, null, 'anders', 'ok'],
    ['u2|un oncle', 'la oncle', {}, N, null, 'elision', 'ok'],
    ['u2|un oncle', 'une oncle', {}, N, null, 'genus', 'ok'],
    // Im Diktat führt bei un/une kein Tipp zur Elision: «l’oncle» war nicht zu hören
    ['u2|un oncle', 'le oncle', { vorgabe: 'ton' }, N, null, 'anders', 'ok'],
    ['u1|une école', 'la école', { vorgabe: 'ton' }, N, null, 'anders', 'ok'],
    ['u1|l’allemand (m)', 'le allemand', { vorgabe: 'ton' }, N, null, 'elision', 'ok'],
    ['u1|l’allemand (m)', 'l’allemand', { vorgabe: 'ton' }, J, null, 'ok', 'ok'],
    // «le ordinateur» bekommt den Tipp zur Elision, also muss «l’ordinateur» danach stimmen
    ['u3|un ordinateur', 'le ordinateur', {}, N, null, 'elision', 'ok'],
    ['u3|un ordinateur', 'l’ordinateur', {}, J, null, 'buch', 'ok'],
    ['u3|le ski', 'un ski', {}, N, null, 'anders', 'ok'],
    // Nur eine Stelle heisst wirklich nur eine: Kommt ein Akzent dazu, ist es kein Tippfehler mehr
    ['u1|la règle', 'la regel', {}, N, null, 'ok', 'anders'],
    // Akzent und Bindestrich zugleich: Die Buchstaben stimmen alle, also immer noch «fast», aber der
    // Hinweis nennt beides (zeichen, siehe unten), sonst wäre nach dem Akzent auch der zweite Versuch
    // daneben. Ein «l» ohne Apostroph ist dabei kein fehlender Artikel.
    ['u2|la grand-mère', 'la grandmere', {}, N, null, 'ok', 'akzent'],
    ['u2|la grand-mère', 'la grand mere', {}, N, null, 'ok', 'akzent'],
    ['u2|la grand-mère', 'le grand mere', {}, N, null, 'genus', 'akzent'],
    ['u2|l’âge (m)', 'lage', {}, N, null, 'ok', 'akzent'],
    ['u2|l’âge (m)', 'l age', {}, N, null, 'ok', 'akzent'],
    ['u3|l’équitation (f), faire de l’équitation', 'l equitation', {}, N, null, 'ok', 'akzent'],
    ['u1|explorer l’étranger', 'explorer letranger', {}, N, null, 'ok', 'akzent'],
    ['u2|la sœur', 'lasoeur', {}, N, null, 'ok', 'akzent'],
    // Vor dem Wort steht ein anderes Wort als sein Artikel, oder ein vertippter Artikel: Das ist ein
    // anderer Artikel, kein fehlender («Vorne fehlt der Artikel» führte zu «les des cheveux»)
    ['u4|les cheveux (m pl)', 'des cheveux', {}, N, null, 'anders', 'ok'],
    ['u3|le piano, jouer du piano', 'du piano', {}, N, null, 'anders', 'ok'],
    ['u3|la guitare, jouer de la guitare', 'de la guitare', {}, N, null, 'anders', 'ok'],
    ['u3|les échecs (m pl), jouer aux échecs', 'aux échecs', {}, N, null, 'anders', 'ok'],
    ['u3|le piano, jouer du piano', 'lé piano', {}, N, null, 'anders', 'ok'],
    ['u4|les cheveux (m pl)', 'ls cheveux', {}, N, null, 'anders', 'ok'],
    ['u1|la chaise', 'al chaise', {}, N, null, 'anders', 'ok'],
    ['u1|la chaise', 'de la chaize', {}, N, null, 'anders', 'tippfehler'],
    // … aber nur, wenn der Rest dem Wort näher ist als das Ganze
    ['u1|le dessin', 'de ssin', {}, N, null, 'fehlt', 'zeichen'],
    ['u1|le dessin', 'des sin', {}, N, null, 'fehlt', 'zeichen'],
    ['u4|la demi-rondelle de concombre', 'de mi-rondelle de concombre', {}, N, null, 'fehlt', 'zeichen'],
    ['u4|la rondelle de concombre', 'rondelle de concombre', {}, N, null, 'fehlt', 'ok'],
    // «Probier den anderen» Artikel: Das gilt nur, wenn der andere auch angenommen wird. «un musique»
    // führte zu «une musique», und das stimmt nur bei Dingen, Familie, Essen und Gesicht.
    ['u1|la musique', 'un musique', {}, N, null, 'anders', 'ok'],
    ['u1|la musique', 'le musique', {}, N, null, 'genus', 'ok'],
    ['u3|le vélo', 'une vélo', {}, N, null, 'anders', 'ok'],
    ['u3|le vélo', 'la vélo', {}, N, null, 'genus', 'ok'],
    ['u1|l’allemand (m)', 'une allemand', {}, N, null, 'anders', 'ok'],
    ['u1|la chaise', 'un chaise', { vorgabe: 'ton' }, N, null, 'anders', 'ok'],
    ['u1|la chaise', 'le chaise', { vorgabe: 'ton' }, N, null, 'genus', 'ok'],
    ['u2|l’âge (m)', 'une âge', { vorgabe: 'ton' }, N, null, 'anders', 'ok'],
    // Mehrere Formen eines Teils, die erste ist gefragt: Ein Vertipper wird an der nächsten Form gemessen
    ['u1|les maths, les mathématiques (f pl)', 'les mathematiques', {}, N, null, 'ok', 'akzent'],
    ['u1|la géo, la géographie', 'la geographie', {}, N, null, 'ok', 'akzent'],
    ['u3|la BD (la bande dessinée)', 'la bande dessinee', {}, N, null, 'ok', 'akzent'],
    ['u2|marié/mariée', 'mariee', {}, N, null, 'ok', 'akzent'],
    ['u2|ils sont, elles sont', 'elle sont', {}, N, null, 'ok', 'tippfehler'],
    ['u2|un/une enfant', 'une enfent', {}, N, null, 'ok', 'tippfehler'],
    ['u2|la mère, la maman', 'une maman', {}, J, 'auch', 'buch', 'ok'],
    ['u2|la mère, la maman', 'la mere', {}, N, null, 'ok', 'akzent'],
    ['u1|les maths, les mathématiques (f pl)', 'les mathematiques', { vorgabe: 'ton' }, N, null, 'ok', 'anders'],
    ['u1|les maths, les mathématiques (f pl)', 'les maht', { form: 1 }, N, null, 'ok', 'anders'],
    ['u2|la grand-mère', 'la grandmerre', {}, N, null, 'ok', 'anders'],
    ['u2|la grand-mère', 'la grandmère', {}, N, null, 'ok', 'zeichen'],
    ['u2|la grand-mère', 'lagrand-mère', {}, N, null, 'ok', 'zeichen'],
    ['u4|le nez', 'le nes', {}, N, null, 'ok', 'anders'],
    ['u2|la sœur', 'la seur', {}, N, null, 'ok', 'tippfehler'],
    ['u2|la sœur', 'la soeurr', {}, N, null, 'ok', 'anders'],
    ['u1|une école', 'une ecole', {}, N, null, 'ok', 'akzent'],
    ['u3|lire', 'le lire', {}, N, null, 'ok', 'anders'],
    ['u1|calculer', 'calculler', {}, N, null, 'ok', 'tippfehler'],
    ['u1|calculer', 'dessiner', {}, N, 'verwechselt', 'ok', 'anders'],
    // Die andere Hälfte derselben Karte ist auch eine Verwechslung
    ['u4|les yeux (m pl), un œil', 'les yeux', { teil: 1 }, N, 'verwechselt', 'anders', 'anders'],
    ['u3|un/une élève', 'un élève', { teil: 1 }, N, 'verwechselt', 'genus', 'ok'],
    ['u3|le foot, faire du foot', 'faire du foot', {}, N, 'verwechselt', 'fehlt', 'anders'],
    ['u4|la tomate (cerise)', 'la tomate', { teil: 1 }, N, 'verwechselt', 'ok', 'anders'],
    ['u3|la fille', 'la fille', {}, J, null, 'ok', 'ok'],
  ];
  for (const [id, eingabe, opt, richtig, ganz, artikel, kern] of TABELLE) {
    const u = Lernen.urteil(eingabe, E(id), opt.teil || 0, opt);
    const ist = [u.richtig, u.ganz, u.artikel, u.kern], soll = [richtig, ganz, artikel, kern];
    if (!gleich(ist, soll)) melde('«' + eingabe + '» für ' + id + (opt.vorgabe === 'ton' ? ' (Diktat)' : '') + ': ' + ist.join(', ') + ' statt ' + soll.join(', '));
  }
  const soll = (was, ist, erwartet) => {
    if (!gleich(ist, erwartet)) melde(was + ': ' + JSON.stringify(ist) + ' statt ' + JSON.stringify(erwartet));
  };
  const u = (id, eingabe, opt) => Lernen.urteil(eingabe, E(id), (opt && opt.teil) || 0, opt);

  // Die übrigen Felder
  soll('ziel', [u('u1|la chaise', 'x').ziel, u('u1|les maths, les mathématiques (f pl)', 'x', { form: 1 }).ziel, u('u4|les yeux (m pl), un œil', 'x', { teil: 1 }).ziel],
    ['la chaise', 'les mathématiques', 'un œil']);
  soll('andere bei «le cousin»', u('u2|la cousine', 'le cousin').andere, { nr: E('u2|le cousin').nr, teil: 0 });
  soll('andere bei der anderen Hälfte', u('u4|les yeux (m pl), un œil', 'les yeux', { teil: 1 }).andere, { nr: E('u4|les yeux (m pl), un œil').nr, teil: 0 });
  soll('andere sonst', [u('u1|la chaise', 'la chaise').andere, u('u1|la chaise', 'la chaize').andere], [null, null]);
  soll('fehler', [u('u1|la règle', 'le regle').fehler, u('u1|la règle', 'la regle').fehler, u('u1|le livre', 'la livre').fehler, u('u1|le livre', 'livre').fehler,
    u('u2|la cousine', 'le cousin').fehler, u('u1|la chaise', 'la chaise').fehler], [['genus', 'akzent'], ['akzent'], ['genus'], [], [], []]);
  // Ein Artikel im anderen Geschlecht verrät das Geschlecht im Kopf, auch wo der Hinweis den Anfang zeigt;
  // Akzente und Zeichen zugleich verraten die Akzente
  soll('fehler bei anderem Artikel, Akzent mit Zeichen und anderer Form', [u('u1|la musique', 'un musique').fehler, u('u3|le vélo', 'une vélo').fehler,
    u('u4|les cheveux (m pl)', 'des cheveux').fehler, u('u2|la grand-mère', 'la grand mere').fehler, u('u2|la grand-mère', 'le grand mere').fehler,
    u('u1|les maths, les mathématiques (f pl)', 'les mathematiques').fehler], [['genus'], ['genus'], [], ['akzent'], ['genus', 'akzent'], ['akzent']]);
  // zeichen: Zum Akzent stimmen auch Abstand, Apostroph oder Bindestrich nicht. Dann nennt der Hinweis beides
  // (franz.js liest es nur bei kern 'akzent'; «la grand mère» ist kern 'zeichen' und hat seinen eigenen Hinweis).
  soll('zeichen', ['la grand mere', 'la grandmere', 'le grand mere', 'la grand-mere', 'la grand mère', 'la grand-mère'].map(x => u('u2|la grand-mère', x).zeichen)
    .concat([u('u2|l’âge (m)', 'lage').zeichen, u('u2|l’âge (m)', 'l’age').zeichen, u('u1|explorer l’étranger', 'explorer letranger').zeichen, u('u1|la règle', 'regle').zeichen,
      u('u2|la sœur', 'la soeur').zeichen, u('u2|la sœur', 'lasoeur').zeichen, u('u1|la règle', 'la regle').zeichen, u('u1|explorer l’étranger', 'explorer l etranger').zeichen]),
  [true, true, true, false, false, false, true, false, true, false, false, true, false, true]);
  soll('zeichen mit dem Kern', [u('u2|la grand-mère', 'la grand mere'), u('u2|la grand-mère', 'la grand mère'), u('u1|la règle', 'la regle'), u('u1|explorer l’étranger', 'explorer l etranger')]
    .map(x => x.kern + '/' + x.zeichen), ['akzent/true', 'zeichen/false', 'akzent/false', 'akzent/true']);
  // bezug: die Form, an der gemessen wurde
  soll('bezug', [u('u1|les maths, les mathématiques (f pl)', 'les mathematiques').bezug, u('u1|les maths, les mathématiques (f pl)', 'les math').bezug,
    u('u1|les maths, les mathématiques (f pl)', 'les mathematiques', { vorgabe: 'ton' }).bezug, u('u2|la mère, la maman', 'une maman').bezug,
    u('u2|la mère, la maman', 'la maman').bezug, u('u1|la chaise', 'la chaize').bezug, u('u1|la chaise', 'la chaise').bezug],
  ['les mathématiques', 'les maths', 'les maths', 'la maman', 'la maman', 'la chaise', 'la chaise']);

  // stellen zeigt in die Eingabe, wie sie getippt wurde
  const stellen = (id, eingabe, opt) => u(id, eingabe, opt).stellen;
  soll('stellen: richtig', stellen('u1|la chaise', 'la chaise'), []);
  soll('stellen: ein Buchstabe fehlt am Schluss', stellen('u2|la cousine', 'la cousin'), [8]);
  soll('stellen: Akzent', stellen('u1|la règle', 'la regle'), [4]);
  soll('stellen: Akzent ohne Artikel', stellen('u1|la règle', 'regle'), [1]);
  soll('stellen: Artikel und Akzent', stellen('u1|la règle', 'le regle'), [0, 1, 4]);
  soll('stellen: nur der Artikel', stellen('u1|le livre', 'la livre'), [0, 1]);
  soll('stellen: Elision', stellen('u1|l’allemand (m)', 'le allemand'), [0, 1]);
  soll('stellen: Apostroph zu viel', stellen('u4|le hérisson', 'l’hérisson'), [0, 1]);
  soll('stellen: Apostroph fehlt', stellen('u1|l’allemand (m)', 'lallemand'), [0]);
  soll('stellen: Bindestrich', stellen('u2|la grand-mère', 'la grand mère'), [8]);
  soll('stellen: Ligatur', stellen('u2|la sœur', 'la soeur'), [4, 5]);
  soll('stellen: Akzent und Bindestrich', stellen('u2|la grand-mère', 'la grand mere'), [8, 10]);
  soll('stellen: Dreher', stellen('u1|la chaise', 'la chiase'), [5, 6]);
  soll('stellen: ein Buchstabe zu viel', stellen('u1|la chaise', 'la schaise'), [3]);
  soll('stellen: mitten in einer langen Form', stellen('u4|la demi-rondelle de concombre', 'la demi-rondelle de comcombre'), [22]);
  soll('stellen: mit Leerzeichen und Grossbuchstaben davor', stellen('u2|la cousine', '  La  Cousin'), [11]);
  soll('stellen: Artikel wie im Buch', stellen('u1|la chaise', 'une chaise'), []);
  soll('stellen: Artikel wie im Buch im Diktat', stellen('u1|la chaise', 'une chaise', { vorgabe: 'ton' }), [0, 1, 2]);
  soll('stellen: die gedruckte Form', stellen('u1|les maths, les mathématiques (f pl)', 'les maths', { form: 1 }), []);
  soll('stellen: Verwechslung', stellen('u2|la cousine', 'le cousin'), [0, 1, 8]);
  // Die Schreibmarke steht hinter der ersten markierten Stelle: hinter dem d von «des», hinter dem l von «lage»
  soll('stellen: ein anderes Wort statt des Artikels', [stellen('u4|les cheveux (m pl)', 'des cheveux'), stellen('u3|la guitare, jouer de la guitare', 'de la guitare')],
    [[0, 1, 2], [0, 1, 2, 3, 4]]);
  soll('stellen: Akzent und Apostroph', [stellen('u2|l’âge (m)', 'lage'), stellen('u3|l’équitation (f), faire de l’équitation', 'l equitation')], [[0, 1], [1, 2]]);
  soll('stellen: an der nächsten Form gemessen', [stellen('u1|les maths, les mathématiques (f pl)', 'les mathematiques'), stellen('u2|ils sont, elles sont', 'elle sont')], [[8], [3]]);

  // Über alle Wortformen: Was nicht genau stimmt, ist nie richtig, und der Tipp passt
  let zahl = TABELLE.length;
  jedeForm((e, teil, form, text) => {
    if (e.art !== 'wort') return;
    const opt = { form, vorgabe: 'de' };
    const z = Lernen.zerlegen(text, e);
    const pruefe = (eingabe, erlaubt) => {
      const x = Lernen.urteil(eingabe, e, teil, opt);
      zahl++;
      const teile = (x.artikel === 'ok' || x.artikel === 'buch') && x.kern === 'ok';
      if (x.richtig !== teile) melde('«' + eingabe + '» für «' + text + '»: richtig ' + x.richtig + ' bei ' + x.artikel + '/' + x.kern);
      if (x.richtig && x.ganz !== 'auch' && Lernen.norm(eingabe) !== Lernen.norm(text) && x.artikel !== 'buch') melde('«' + eingabe + '» für «' + text + '»: als richtig durchgewinkt');
      if (x.stellen.some(i => !(i >= 0 && i < eingabe.length))) melde('«' + eingabe + '» für «' + text + '»: Stelle ausserhalb der Eingabe');
      if (!x.richtig && x.ganz !== 'gleiche_form' && eingabe && !x.stellen.length && x.artikel !== 'fehlt') melde('«' + eingabe + '» für «' + text + '»: Fehler ohne Stelle');
      if (typeof x.zeichen !== 'boolean' || (x.zeichen && x.kern !== 'akzent')) melde('«' + eingabe + '» für «' + text + '»: zeichen ' + x.zeichen + ' bei kern ' + x.kern);
      if (erlaubt && !x.ganz && !erlaubt(x)) melde('«' + eingabe + '» für «' + text + '»: ' + x.artikel + '/' + x.kern);
      return x;
    };
    // genau die Form, auch gross geschrieben
    if (!pruefe(text).richtig || !pruefe(text.toUpperCase().replace(/Œ/g, 'œ')).richtig) melde('«' + text + '» wird nicht angenommen');
    // der andere Artikel
    const anders = { le: 'la', la: 'le', un: 'une', une: 'un' }[z.artikel];
    if (anders) pruefe(anders + ' ' + z.kern, x => x.artikel === 'genus' && x.kern === 'ok' && gleich(x.fehler, ['genus']));
    // kein Artikel
    if (z.artikel) pruefe(z.kern, x => x.artikel === 'fehlt' && x.kern === 'ok');
    // ein anderes Wort davor ist ein anderer Artikel, kein fehlender: Wer «Vorne fehlt der Artikel»
    // hört und ihn davorsetzt, hätte sonst zwei
    if (z.artikel) for (const vorn of ['des ', 'du ', 'de la ', 'aux ']) pruefe(vorn + z.kern, x => x.artikel === 'anders' && x.kern === 'ok' && x.stellen[0] === 0);
    // ohne Akzente
    const blank = text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').normalize('NFC');
    if (blank !== text) pruefe(blank, x => x.artikel === 'ok' && x.kern === 'akzent' && gleich(x.fehler, ['akzent']) && !x.zeichen);
    // ohne Akzente und dazu ohne Apostroph oder Bindestrich im Wort, oder ganz zusammengeschrieben:
    // Der Hinweis muss beides nennen (zeichen)
    const vorn = blank.slice(0, text.length - z.kern.length), hinten = blank.slice(text.length - z.kern.length);
    for (const eingabe of [vorn + hinten.replace(/[’-]/g, ' '), vorn + hinten.replace(/[’ -]/g, '')]) {
      if (blank !== text && eingabe !== blank) pruefe(eingabe, x => x.artikel === 'ok' && x.kern === 'akzent' && x.zeichen && gleich(x.fehler, ['akzent']));
    }
    if (text.includes('œ')) pruefe(text.replace(/œ/g, 'oe'), x => x.kern === 'ligatur');
    // ohne Abstand, Apostroph, Bindestrich
    if (/[ ’-]/.test(z.kern)) pruefe(text.replace(/[’-]/g, ' ').replace(/ +/g, ' '), x => text.replace(/[’-]/g, ' ') === text || x.kern === 'zeichen');
    // ein Buchstabe verdoppelt, einer weggelassen
    const mitte = text.length - 2;
    pruefe(text.slice(0, mitte) + text[mitte] + text.slice(mitte), x => x.kern === 'tippfehler' || x.kern === 'anders');
    if (Lernen.norm(text.slice(0, -1)) !== Lernen.norm(text)) pruefe(text.slice(0, -1), x => x.kern !== 'ok' || x.artikel !== 'ok');
    // Elision und ganzer Artikel
    if (z.artikel === 'l’') {
      pruefe('le ' + z.kern, x => x.artikel === 'elision');
      pruefe('la ' + z.kern, x => x.artikel === 'elision');
    }
    if (z.artikel === 'un' || z.artikel === 'une') {
      pruefe('le ' + z.kern, x => x.artikel === 'elision');
      if (!pruefe('l’' + z.kern).richtig) melde('«l’' + z.kern + '» für «' + text + '» wird nicht angenommen, obwohl der Tipp zur Elision dorthin führt');
      // Im Diktat gilt «l’…» nicht: Dann darf auch kein Tipp zur Elision dorthin führen
      for (const a of ['le ', 'la ']) {
        const x = Lernen.urteil(a + z.kern, e, teil, { form, vorgabe: 'ton' });
        zahl++;
        if (x.artikel === 'elision') melde('Diktat «' + text + '», getippt «' + a + z.kern + '»: Tipp zur Elision führt zu «l’' + z.kern + '», das im Diktat nicht gilt');
      }
    }
    if ((z.artikel === 'le' || z.artikel === 'la') && z.kern.startsWith('h')) pruefe('l’' + z.kern, x => x.artikel === 'artikel_ganz');
    // der andere richtige Artikel: nur bei Dingen, Familie, Essen, Gesicht
    const buch = { le: 'un', la: 'une' }[z.artikel];
    if (buch) pruefe(buch + ' ' + z.kern, x => x.artikel === (['ding', 'fam', 'essen', 'gesicht'].includes(e.cat) ? 'buch' : 'anders'));
    // Diktat: nur was zu hören war
    for (const andere of e.teile[teil].fr) {
      if (andere === text) continue;
      const x = Lernen.urteil(andere, e, teil, { form, vorgabe: 'ton' });
      if (x.richtig || x.ganz !== 'andere_form') melde('Diktat «' + text + '», getippt «' + andere + '»: ' + x.ganz);
    }
    if (buch) {
      const x = Lernen.urteil(buch + ' ' + z.kern, e, teil, { form, vorgabe: 'ton' });
      if (x.richtig) melde('Diktat «' + text + '»: «' + buch + ' ' + z.kern + '» angenommen');
    }
  });

  // Über Kreuz, gegen eine eigene Liste dessen, was gelten darf: Jede Form des Wortschatzes und jeder
  // Artikel vor jedem Kern wird für jedes Ziel getippt. Angenommen wird genau die Zielform, eine
  // andere Form des Teils (nur nach dem Deutschen, solange die erste gefragt ist) und der andere
  // richtige Artikel aus 2.9. So rutscht kein falsches Französisch durch und keine Form aus dem Buch fällt weg.
  const eigenNorm = s => s.normalize('NFC').toLowerCase().replace(/['`´ʼ]/g, '’').replace(/[.,!?]/g, ' ').replace(/\s+/g, ' ').trim();
  const VIER = ['ding', 'fam', 'essen', 'gesicht'];
  const darf = (e, teil, form, vorgabe) => {
    const t = e.teile[teil], ziel = eigenNorm(t.fr[form]);
    const aus = new Set([ziel]);
    if (vorgabe !== 'de') return aus;
    if (form === 0) for (const f of t.fr) aus.add(eigenNorm(f));
    const m = e.artikel === null ? null : ziel.match(/^(le |la |l’|un |une )(.*)$/);
    if (!m) return aus;
    const artikel = m[1].trim(), genus = { le: 'm', un: 'm', la: 'f', une: 'f' }[artikel] || e.genus;
    // «l’» für un und une gilt in jeder Wortgruppe: Dorthin führt der Tipp zur Elision, und es ist richtig
    if (artikel === 'un' || artikel === 'une') aus.add('l’' + m[2]);
    else if (VIER.includes(e.cat) && (genus === 'm' || genus === 'f')) aus.add((genus === 'm' ? 'un ' : 'une ') + m[2]);
    return aus;
  };
  const alleFormen = [];
  jedeForm((e, teil, form, text) => alleFormen.push(text));
  let kreuz = 0;
  jedeForm((e, teil, form, text) => {
    if (e.art !== 'wort') return;
    const kern = Lernen.zerlegen(text, e).kern;
    const eingaben = [...alleFormen, ...['le ', 'la ', 'l’', 'un ', 'une ', 'les ', ''].map(a => a + kern)];
    for (const vorgabe of ['de', 'ton']) {
      const erlaubt = darf(e, teil, form, vorgabe);
      for (const eingabe of eingaben) {
        const x = Lernen.urteil(eingabe, e, teil, { form, vorgabe });
        kreuz++;
        // «Probier den anderen» Artikel: Der Tipp zum Geschlecht muss zu einer Antwort führen, die gilt
        if (x.artikel === 'genus' && x.kern === 'ok' && !x.ganz) {
          const y = Lernen.zerlegen(Lernen.norm(eingabe)), getauscht = { le: 'la', la: 'le', un: 'une', une: 'un' }[y.artikel] + ' ' + y.kern;
          if (!Lernen.urteil(getauscht, e, teil, { form, vorgabe }).richtig) melde((vorgabe === 'ton' ? 'Diktat ' : '') + '«' + eingabe + '» für «' + text + '»: der Tipp zum Geschlecht führt zu «' + getauscht + '», und das gilt nicht');
        }
        if (x.richtig !== erlaubt.has(eigenNorm(eingabe))) {
          melde((vorgabe === 'ton' ? 'Diktat ' : '') + '«' + eingabe + '» für «' + text + '»: ' + (x.richtig ? 'angenommen, obwohl es nicht gelten darf' : 'abgelehnt, obwohl es gelten muss')
            + ' (' + x.artikel + '/' + x.kern + (x.ganz ? '/' + x.ganz : '') + ')');
        }
      }
    }
  });
  if (kreuz < 100000) melde('über Kreuz nur ' + kreuz + ' Urteile');
  zahl += kreuz;
  return zahl + ' Urteile';
});

/* ---------- Werkzeug für Planer und Buchung ---------- */

const HEUTE = '2026-11-13';
const beurteilt = s => !['kennen', 'echo', 'paare'].includes(s.uebung);
const lastVon = s => (K.SCHWER.includes(s.uebung) ? 2 : 1);
const kopie = x => JSON.parse(JSON.stringify(x));
// Ein Stand, in dem eine Uhr, die vorging, keine Spur mehr hat: Keine Karte ist weiter weg fällig, als
// verbuchen es auf ihrer Stufe je setzt (Stufe 1 bis 4: 1, 2, 4, 7 Tage; Stufe 5: 21, nach Bestätigungen
// 45 und 90; Stufe 0 und jedes «fast» oder «falsch»: 1), und kein Auf- oder Abstieg liegt nach heute
const LAENGSTE_PAUSE = [1, 1, 2, 4, 7];
function geklemmt(z, heute) {
  const y = kopie(z);
  for (const k of Object.values(y.karten || {})) {
    const pause = k.st === 5 ? [21, 45, 90][Math.min(k.fest || 0, 2)] : LAENGSTE_PAUSE[k.st];
    if (k.faellig && k.faellig > Lernen.tagPlus(heute, pause)) k.faellig = Lernen.tagPlus(heute, pause);
    if (k.auf > heute) k.auf = '';
    if (k.ab > heute) k.ab = '';
  }
  return y;
}
const brauchtTon = s => ['hoeren', 'lauschen', 'echo'].includes(s.uebung) || s.vorgabe === 'ton';
const kurz = s => (s.uebung === 'paare' ? 'paare' : s.uebung + (s.vorgabe === 'ton' && s.uebung !== 'hoeren' && s.uebung !== 'lauschen' ? '-ton' : '')
  + '/' + s.rolle + (s.check || '') + ' «' + s.kid.split('|')[1] + '»');
const ohneSchluss = plan => plan.schritte.filter(s => s.uebung !== 'echo' && s.uebung !== 'paare');
const gleicheAufgabe = (a, b) => a.uebung === b.uebung && a.vorgabe === b.vorgabe && a.teil === b.teil && a.form === b.form;

// Ein frischer Stand mit gewählten Lernzielen
function zMitZielen(ziele, mehr) {
  const z = Lernen.neu();
  z.unite = 'u1';
  for (const g of ziele) z.ziele[g] = true;
  return Object.assign(z, mehr);
}
// Derselbe Stand, in dem die genannten Karten schon einen Stand haben
function mitKarten(z, karten) {
  for (const [kid, mehr] of Object.entries(karten)) z.karten[kid] = stand({ st: 1, gesehen: 3, richtig: 3, faellig: HEUTE, ...mehr });
  return z;
}

// Was der Bauplan (3.4, Schritte 1 bis 4) über einen Stand sagt: hier ein zweites Mal und so schlicht
// wie möglich abgeleitet, damit der Planer daran gemessen werden kann
function lage(z0, heute) {
  // Daten aus einer Uhr, die vorging, zählen so, wie planen sie zurückholt
  const z = geklemmt(z0, heute);
  // Eine Karte steht dort im Buch, wo ihr Eintrag im ersten gewählten Lernziel steht («la fille» gibt es zweimal)
  const ort = e => VOKABELN.find(x => x.kid === e.kid && z.ziele[x.g] === true);
  const aktiv = KARTEN.filter(e => e.lernziele.some(g => z.ziele[g] === true)).map(e => ({ e, k: Lernen.zustand(z, e.kid), nr: ort(e).nr }))
    .sort((a, b) => a.nr - b.nr);
  const faellig = aktiv.filter(x => x.k.st >= 1 && x.k.faellig <= heute);
  const angefangen = aktiv.filter(x => x.k.st === 0 && x.k.gesehen > 0);
  // Neue Karten: Lernziel für Lernziel, darin die Wörter vor den Sätzen
  const platz = x => V.LERNZIEL_REIHE.indexOf(VOKABELN[x.nr].g) * 1e4 + (x.e.art === 'satz' ? 5e3 : 0) + x.nr;
  const unbekannt = aktiv.filter(x => x.k.st === 0 && x.k.gesehen === 0).sort((a, b) => platz(a) - platz(b));
  const gekannt = Object.values(z.karten).filter(k => k.st >= 1).length;
  const wortOffen = unbekannt.some(x => x.e.art === 'wort');
  const satzErlaubt = gekannt >= K.SATZ_AB || !wortOffen;
  let saetze = 0;
  const kandidaten = unbekannt.filter(x => x.e.art === 'wort' || (satzErlaubt && saetze++ < (wortOffen ? K.SATZ_PRO_RUNDE : 2)));
  const jung = aktiv.filter(x => x.k.st === 1 || x.k.st === 2).length;
  const bremse = faellig.length > K.BREMSE_FAELLIG || jung > K.BREMSE_JUNG;
  const tagNeu = z.tag.datum === heute ? z.tag.neu : 0;
  const frei = bremse ? 0 : Math.max(0, Math.min(K.NEU_PRO_RUNDE - Math.min(K.NEU_PRO_RUNDE, angefangen.length), z.neuProTag - tagNeu));
  const morgen = Lernen.tagPlus(heute, 1);
  return { aktiv, faellig, angefangen, unbekannt, kandidaten, gekannt, satzErlaubt, wortOffen, jung, bremse, frei,
    ruhend: aktiv.filter(x => x.k.st >= 1 && x.k.faellig > heute),
    morgen: aktiv.filter(x => x.k.st >= 1 && x.k.faellig === morgen).length,
    leer: !faellig.length && !angefangen.length && (!frei || !kandidaten.length) };
}

// Wie dringend eine fällige Karte ist (3.4, Schritt 2)
const dringend = (k, heute) => ((k.zuletzt.match(/f/g) || []).length * 1.2 + (k.falsch / Math.max(1, k.gesehen)) * 2 + Math.max(0, 3 - k.st) * 0.4) * 3 + 3
  + Math.min(30, k.faellig ? Math.max(0, Math.round((Date.parse(heute) - Date.parse(k.faellig)) / 864e5)) : 0) * K.WARTEN;

// Der erste Gang durch 3.4, Schritt 5: offene Einführungen, dann die fälligen Karten nach Dringlichkeit,
// jede, die in RUNDE − NEBEN_MAX Schritte und LAST − NEBEN_MAX Last passt. Gibt deren kid zurück.
function ersterGang(L0, mitTon, heute) {
  let n = 2 * Math.min(K.NEU_PRO_RUNDE, L0.angefangen.length), w = n;
  const aus = [];
  for (const x of L0.faellig.slice().sort((a, b) => dringend(b.k, heute) - dringend(a.k, heute))) {
    const g = lastVon(Lernen.leitaufgabe(x.e, x.k, mitTon));
    if (n + 1 > K.RUNDE - K.NEBEN_MAX || w + g > K.LAST - K.NEBEN_MAX) continue;
    aus.push(x.e.kid);
    n++;
    w += g;
  }
  return aus;
}

// Wie viele Plätze die Nebenaufgaben einer Runde halten (3.4, Schritt 5): einer für das Aufwärmen und
// einer je Karte, die eine Nebenaufgabe hergibt, höchstens NEBEN_MAX. Gezählt werden die Karten des
// ersten Gangs (basis): Was danach in frei gebliebene Plätze nachrückt, bringt keinen eigenen mit.
// Ruhende Karten mit einer Schwäche, die sich üben lässt, bringen ihre Nebenaufgabe selbst mit; dient
// eine davon dem Aufwärmen, zählt sie nur einmal. Ob aufgewärmt wird, hängt von allen Leitaufgaben ab
// (leitKids): Eine Karte auf Stufe 1 eröffnet selbst. Gezählt wird immer mit Ton, damit Lernen.zahlen
// die neuen Wörter kennt, ohne die Stimme zu kennen. Hier ein zweites Mal abgeleitet, damit der Planer
// daran gemessen werden kann.
const SCHWAECHE = { artikel: 'genus', akzent: 'akzent', lauschen: 'hoeren', hoeren: 'hoeren' };
function nebenPlaetze(L0, basis, leitKids) {
  const mitTon = true;
  const schwach = new Set(L0.ruhend.filter(({ e, k }) => {
    if (!(k.schwach.genus + k.schwach.akzent + k.schwach.hoeren > 0)) return false;
    const was = n => (n.uebung === 'schreiben' && n.vorgabe === 'ton' ? 'hoeren' : SCHWAECHE[n.uebung]);
    if (Lernen.nebenaufgaben(e, k, mitTon).some(n => k.schwach[was(n)] > 0)) return true;
    const leit = Lernen.leitaufgabe(e, k, mitTon).uebung;
    return [['genus', 'artikel'], ['akzent', 'akzent'], ['hoeren', e.art === 'wort' ? 'lauschen' : 'hoeren']]
      .some(([name, u]) => k.schwach[name] > 0 && u !== leit && Lernen.kann(u, e, k.teil, k.form, mitTon));
  }).map(x => x.e.kid));
  const leit = L0.faellig.filter(x => leitKids.includes(x.e.kid));
  // Aufgewärmt wird mit einer ruhenden Karte, sonst mit einer fälligen, die nicht drin ist
  const warm = leit.length > 0 && !leit.some(x => x.k.st === 1) && (L0.ruhend.length > 0 || L0.faellig.length > leit.length);
  // Die Karte zum Aufwärmen kommt zuerst aus denen, die zuletzt gelangen, sonst aus allen ruhenden
  const gut = L0.ruhend.filter(x => x.k.zuletzt.endsWith('r'));
  const kreis = gut.length ? gut : L0.ruhend;
  const warmSchwach = warm && kreis.length > 0 && kreis.every(x => schwach.has(x.e.kid));
  const mitNeben = L0.faellig.filter(x => basis.includes(x.e.kid) && Lernen.nebenaufgaben(x.e, x.k, mitTon).length).length;
  return { plaetze: Math.min(K.NEBEN_MAX, (warm ? 1 : 0) + mitNeben + schwach.size - (warmSchwach ? 1 : 0)), warm };
}

// Ein Stand, wie er nie gespielt wurde, aber gespeichert sein könnte: beliebige Auswahl (oft nur ein
// oder zwei kleine Lernziele), beliebige Stufen, Fälligkeiten, Schwächen
const KLEINE_ZIELE = ['u2-1', 'u4-S', 'u1-1', 'u1P-S', 'u4-4', 'u4P-4', 'u3-3', 'u2P-1', 'u4P-2', 'u4-3', 'u2-3'];
function zufallsStand(rnd, heute) {
  const eins = liste => liste[Math.floor(rnd() * liste.length)];
  const z = Lernen.neu();
  z.unite = eins(V.UNITE_REIHE);
  z.neuProTag = eins(K.NEU_WAHL);
  const wie = rnd();
  const ziele = wie < 0.3 ? [eins(KLEINE_ZIELE)] : wie < 0.45 ? [eins(KLEINE_ZIELE), eins(KLEINE_ZIELE)]
    : wie < 0.9 ? V.LERNZIEL_REIHE.filter(() => rnd() < 0.25) : V.LERNZIEL_REIHE;
  for (const g of ziele) z.ziele[g] = true;
  const bekannt = rnd(), faelligTeil = rnd();
  for (const e of KARTEN) {
    if (rnd() > bekannt) continue;
    const k = stand({ st: rnd() < 0.1 ? 0 : 1 + Math.floor(rnd() * 5) });
    k.gesehen = 1 + Math.floor(rnd() * 12);
    k.richtig = Math.floor(rnd() * k.gesehen);
    k.falsch = Math.floor(rnd() * (k.gesehen - k.richtig));
    if (k.st) k.faellig = Lernen.tagPlus(heute, rnd() < faelligTeil ? -Math.floor(rnd() * 9) : 1 + Math.floor(rnd() * 20));
    k.zuletzt = Array.from({ length: Math.floor(rnd() * 6) }, () => eins(['r', 'r', 'r', 'a', 'f'])).join('');
    if (rnd() < 0.2) k.schwach = { genus: Math.floor(rnd() * 4), akzent: Math.floor(rnd() * 4), hoeren: Math.floor(rnd() * 4) };
    k.teil = Math.floor(rnd() * e.teile.length);
    k.form = Math.floor(rnd() * e.teile[k.teil].fr.length);
    if (rnd() < 0.05) k.auf = heute;
    if (rnd() < 0.05) k.ab = heute;
    k.rueck = rnd() < 0.1;
    if (k.st === 5) k.fest = Math.floor(rnd() * 3);
    z.karten[e.kid] = k;
  }
  z.tag = { datum: rnd() < 0.7 ? heute : Lernen.tagPlus(heute, -1), neu: Math.floor(rnd() * 14), runden: Math.floor(rnd() * 3), frei: [] };
  return z;
}

// Ein erster Versuch, wie er oft danebengeht: der andere Artikel und kein einziger Akzent. Zurück kommt,
// was das Urteil darüber sagt ('genus', 'akzent'), so wie uebungen.js es als Ergebnis.fehler meldet.
// Der Zufall der Prüfung bleibt dabei unberührt.
function ersterVersuch(s, z) {
  if (s.uebung !== 'schreiben' && s.uebung !== 'legen') return [];
  const zufall = Lernen.zufall;
  Lernen.zufall = () => 0.5;
  const a = Lernen.aufgabe(s, z);
  Lernen.zufall = zufall;
  const anders = { le: 'la', la: 'le', un: 'une', une: 'un' };
  const schlicht = t => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').normalize('NFC');
  if (s.uebung === 'schreiben') {
    const zer = Lernen.zerlegen(a.ziel, a.e);
    return Lernen.urteil((anders[zer.artikel] ? anders[zer.artikel] + ' ' : zer.artikel || '') + schlicht(zer.kern), a.e, a.teil, { form: a.form, vorgabe: a.vorgabe }).fehler;
  }
  const offen = frei(a);
  return Lernen.reihenUrteil(offen.map(p => (p.art === 'artikel' ? anders[erste(p.soll)] : schlicht(erste(p.soll)))), offen).fehler;
}

// Spielt einen Plan, wie franz.js es tut: Jede Antwort wird sofort verbucht, nach «falsch» kommt der
// Schritt noch einmal als Wiederholung, nach einem verpassten ersten Check noch einmal das Kennenlernen.
// antwort(schritt) → 'richtig' | 'fast' | 'falsch'; nach(schritt, art, buchung, kartenstandVorher) hört mit.
function spiele(z, plan, heute, antwort, nach) {
  const bilanz = { modus: plan.art === 'frei' ? 'frei' : 'runde', falsch: 0, geurteilt: 0 };
  const buche = (s, art) => {
    const vorher = s.kid ? Lernen.zustand(z, s.kid) : null;
    const fehler = art === 'fast' || art === 'falsch' ? ersterVersuch(s, z) : [];
    const b = Lernen.verbuchen(z, s, { art, versuche: art === 'richtig' ? 1 : 2, fehler, eingabe: '', urteil: null, fehlpaare: 0 }, heute);
    if (nach) nach(s, art, b, vorher);
  };
  for (const s of plan.schritte) {
    if (!beurteilt(s)) {
      buche(s, 'ohne');
      continue;
    }
    let art = antwort(s);
    // Auswahl-Aufgaben kennen kein «fast»
    if (art === 'fast' && K.WAHL.includes(s.uebung)) art = 'falsch';
    bilanz.geurteilt++;
    if (art === 'falsch') bilanz.falsch++;
    buche(s, art);
    if (art !== 'falsch') continue;
    if (s.rolle === 'check' && s.check === 'a') buche(plan.schritte.find(x => x.uebung === 'kennen' && x.kid === s.kid), 'ohne');
    else {
      bilanz.geurteilt++;
      buche(Lernen.wiederholung(s), 'richtig');
    }
  }
  Lernen.rundeFertig(z, bilanz, heute);
  return bilanz;
}

// Gibt es überhaupt eine Reihenfolge, die diese Regeln hält? Erschöpfende Suche; die Schritte einer
// Karte bleiben dabei in der Reihenfolge, in der sie im Plan stehen (harte Regeln).
// was = { abstand, spaet, wahl, ohneSchreiben, zwei }. true, false oder null (zu gross zum Entscheiden).
// ohneSchreiben: Die erste beurteilte Aufgabe ist weder Legen noch Schreiben. zwei: nie zwei Schreiben hintereinander.
function ordnungMoeglich(schritte, was) {
  const n = schritte.length, vor = schritte.map(() => -1), nach = schritte.map(() => false), letzter = new Map();
  schritte.forEach((x, i) => {
    if (letzter.has(x.kid)) {
      vor[i] = letzter.get(x.kid);
      nach[vor[i]] = true;
    }
    letzter.set(x.kid, i);
  });
  const pos = schritte.map(() => -1);
  const zweiter = schritte.map(x => x.rolle === 'check' && x.check === 'b');
  const wahl = schritte.map(x => K.WAHL.includes(x.uebung)), kennen = schritte.map(x => x.uebung === 'kennen');
  const schreibt = schritte.map(x => x.uebung === 'schreiben'), gelegt = [];
  const legtOderSchreibt = schritte.map(x => x.uebung === 'legen' || x.uebung === 'schreiben');
  let knoten = 0;
  const suche = (p, geurteilt) => {
    if (p === n) return true;
    if (++knoten > 2e6) return null;
    const probiert = new Set();
    for (let i = 0; i < n; i++) {
      if (pos[i] >= 0) continue;
      if (vor[i] >= 0 && (pos[vor[i]] < 0 || p - pos[vor[i]] < Math.max(1, was.abstand || 0))) continue;
      if (was.spaet && zweiter[i] && p * 3 < n * 2) continue;
      if (was.wahl && !geurteilt && !kennen[i] && !wahl[i]) continue;
      if (was.ohneSchreiben && !geurteilt && legtOderSchreibt[i]) continue;
      if (was.zwei && p && schreibt[i] && schreibt[gelegt[p - 1]]) continue;
      // Schritte, die allein stehen und sich für die Regeln nicht unterscheiden, nur einmal probieren
      const sorte = vor[i] < 0 && !nach[i] ? 'allein' + wahl[i] + kennen[i] + (!!was.zwei && schreibt[i]) + (!!was.ohneSchreiben && legtOderSchreibt[i]) : i;
      if (probiert.has(sorte)) continue;
      probiert.add(sorte);
      pos[i] = p;
      gelegt[p] = i;
      const r = suche(p + 1, geurteilt || !kennen[i]);
      pos[i] = -1;
      if (r !== false) return r;
    }
    return false;
  };
  return suche(0, false);
}

// Die Regeln für die Reihenfolge (3.4, Schritt 7). Hart, in jedem Plan: kennen vor beiden Checks,
// Check A vor Check B, Nebenaufgabe nach der Leitaufgabe ihrer Karte, legen vor schreiben.
// Weich: Auswahl zum Auftakt, Abstand zwischen zwei Auftritten einer Karte, zweiter Check im letzten
// Drittel. Eine weiche Regel darf nur fehlen, wo nachweislich keine Reihenfolge sie hält, und in
// dieser Rangfolge: In einer Runde geht die Auswahl zum Auftakt dem Abstand vor (Regel (vi) fällt
// zuletzt; eine Runde beginnt nie mit Legen oder Schreiben, wo sie eine Auswahl hat), im freien Üben
// der Abstand der Auswahl (ein Check gleich nach dem Kennenlernen fragt nichts ab). Beide gehen dem
// späten zweiten Check vor. Hat eine Runde keine Auswahl, die eröffnen kann, eröffnet Legen oder
// Schreiben nur, wenn auch nichts anderes es kann (ein Satz: ordnen, bauen), wieder vor dem Abstand.
function reihenfolgePruefen(plan, fehler, frei) {
  const s = ohneSchluss(plan), n = s.length;
  const jeKarte = new Map();
  s.forEach((x, p) => jeKarte.set(x.kid, [...(jeKarte.get(x.kid) || []), p]));
  let abstand = Infinity;
  // Wo der volle Abstand fehlt: zwischen welchen Schritten derselben Karte («kennen → Check A»)
  const eng = new Set();
  for (const plaetze of jeKarte.values()) {
    const wo = f => plaetze.filter(p => f(s[p]));
    const wer = x => (x.uebung === 'kennen' ? 'kennen' : x.check ? 'Check ' + x.check.toUpperCase() : x.rolle);
    for (let i = 1; i < plaetze.length; i++) if (plaetze[i] - plaetze[i - 1] < K.ABSTAND) eng.add(wer(s[plaetze[i - 1]]) + ' → ' + wer(s[plaetze[i]]));
    const vorAllen = (a, b, text) => {
      if (a.length && b.length && Math.max(...a) > Math.min(...b)) fehler('harte Regel verletzt: ' + text + ' bei «' + s[plaetze[0]].kid + '»');
    };
    const kennen = wo(x => x.uebung === 'kennen'), a = wo(x => x.check === 'a'), b = wo(x => x.check === 'b');
    vorAllen(kennen, [...a, ...b], 'kennen vor den Checks');
    vorAllen(a, b, 'Check A vor Check B');
    vorAllen(wo(x => x.rolle === 'leit'), wo(x => x.rolle === 'neben'), 'Nebenaufgabe nach der Leitaufgabe');
    vorAllen(wo(x => !x.begleiter && x.rolle === 'fuell'), wo(x => x.begleiter), 'Begleiter nach der Hauptaufgabe');
    vorAllen(wo(x => x.uebung === 'legen'), wo(x => x.uebung === 'schreiben'), 'legen vor schreiben');
    for (let i = 1; i < plaetze.length; i++) abstand = Math.min(abstand, plaetze[i] - plaetze[i - 1]);
  }
  const erste = s.find(beurteilt);
  const hat = { abstand: Math.min(abstand, K.ABSTAND), spaet: s.every((x, p) => x.check !== 'b' || p * 3 >= n * 2), wahl: !erste || K.WAHL.includes(erste.uebung),
    ohneSchreiben: !erste || !['legen', 'schreiben'].includes(erste.uebung) };
  const wahlPruefen = abstand => {
    if (!hat.wahl && ordnungMoeglich(s, { abstand, wahl: true }) !== false) fehler('beginnt nicht mit einer Auswahl, obwohl es ginge');
  };
  if (!frei) {
    wahlPruefen(0);
    if (!hat.ohneSchreiben && ordnungMoeglich(s, { ohneSchreiben: true }) !== false) fehler('beginnt mit ' + erste.uebung + ', obwohl etwas anderes eröffnen könnte');
  }
  // In einer Runde zählt der Abstand erst nach dem Auftakt; im freien Üben ist der Auftakt kein Muss
  const auftakt = { wahl: !frei && hat.wahl, ohneSchreiben: !frei && hat.ohneSchreiben };
  for (let d = K.ABSTAND; d > hat.abstand; d--) {
    if (ordnungMoeglich(s, { abstand: d, ...auftakt }) !== false) fehler('Abstand ' + hat.abstand + ', obwohl ' + d + ' ginge');
  }
  if (frei) wahlPruefen(hat.abstand);
  if (!hat.spaet && ordnungMoeglich(s, { abstand: hat.abstand, ...auftakt, wahl: hat.wahl, spaet: true }) !== false) fehler('zweiter Check vor dem letzten Drittel, obwohl es anders ginge');
  // Weiche Regel (ii): Zwei Schreiben nebeneinander. Liesse eine Reihenfolge sie trennen, ohne
  // dass Abstand, später zweiter Check oder Auftakt leiden? (Die Mitte für die schwerste Wiederholung,
  // Regel (iv), kennt diese Suche nicht: «vermeidbar» kann auch heissen, dass (iv) weichen müsste.)
  const zwei = s.filter((x, p) => p && x.uebung === 'schreiben' && s[p - 1].uebung === 'schreiben').length;
  const vermeidbar = zwei ? ordnungMoeglich(s, { ...hat, ohneSchreiben: auftakt.ohneSchreiben, zwei: true }) : false;
  return { ...hat, karten: jeKarte.size, n, zwei, vermeidbar, eng };
}

// Prüft einen Plan gegen den Stand, aus dem er geplant wurde: Gestalt, Budget, Auswahl, Reihenfolge.
// tief: auch jede Aufgabe bauen (teuer). Gibt Zahlen für die Übersicht zurück, null beim leeren Plan.
function planPruefen(z0, plan, opt, heute, melde, wo, tief) {
  const mitTon = opt.mitTon !== false, frei = opt.modus === 'frei';
  const fehler = text => melde(wo + ': ' + text + '  [' + (plan.schritte || []).map(kurz).join(' · ') + ']');
  const L0 = lage(z0, heute);
  if (!gleich(Object.keys(plan).sort(), ['art', 'faellig', 'mehr', 'morgen', 'neu', 'schritte'])) fehler('Felder des Plans: ' + Object.keys(plan));
  // Die Zahlen für die Lichtung sagen dasselbe wie der Plan: Nichts fällig und nichts Neues heisst leere Runde
  const zahlen = Lernen.zahlen(z0, heute);
  if (zahlen.faellig !== L0.faellig.length || zahlen.morgen !== L0.morgen || zahlen.jung !== L0.jung) fehler('zahlen: faellig, morgen oder jung');
  if (!frei && (zahlen.faellig === 0 && zahlen.neuFrei === 0) !== (plan.art === 'leer')) fehler('zahlen und Plan sind sich nicht einig, ob etwas ansteht');

  if (plan.art === 'leer') {
    if (plan.schritte.length || plan.neu.length || plan.faellig) fehler('leerer Plan mit Inhalt');
    if (plan.morgen !== L0.morgen) fehler('morgen ' + plan.morgen + ' statt ' + L0.morgen);
    if (!frei && !L0.leer) fehler('leer, obwohl etwas ansteht');
    if (!frei && zahlen.neuFrei !== 0) fehler('zahlen.neuFrei ' + zahlen.neuFrei + ' bei leerem Plan');
    // Ein weiteres Lernziel gibt es nur, wenn die Auswahl ausgeschöpft ist
    if ((plan.mehr === null) !== (L0.unbekannt.length > 0 || V.LERNZIEL_REIHE.every(g => z0.ziele[g]))) fehler('mehr: ' + plan.mehr);
    if (plan.mehr !== null && (!V.LERNZIELE[plan.mehr] || z0.ziele[plan.mehr])) fehler('mehr nennt kein freies Lernziel: ' + plan.mehr);
    return null;
  }
  if (plan.art !== (frei ? 'frei' : 'runde')) fehler('art ' + plan.art);
  if (plan.morgen !== 0 || plan.mehr !== null) fehler('morgen oder mehr in einem Plan mit Schritten');
  const kern = ohneSchluss(plan), schluss = plan.schritte.slice(kern.length);
  if (plan.schritte.slice(0, kern.length).some(x => !kern.includes(x)) || !['', 'echo', 'paare', 'echo paare'].includes(schluss.map(x => x.uebung).join(' '))) {
    fehler('echo und Finale gehören einmal an den Schluss');
  }

  // Jeder Schritt: die Felder aus 9.5, eine Karte, eine Übung, die mit ihr geht
  const jeKarte = new Map();
  for (const x of kern) {
    const e = VOKABELN[x.nr], k = Lernen.zustand(z0, x.kid);
    if (!gleich(Object.keys(x).filter(f => !['begleiter', 'frei', 'pieks'].includes(f)).sort(), ['check', 'form', 'kid', 'neu', 'nr', 'rolle', 'teil', 'uebung', 'vorgabe'])) fehler('Felder von ' + kurz(x));
    if (!e || e.kid !== x.kid) {
      fehler('nr und kid passen nicht zusammen: ' + kurz(x));
      continue;
    }
    jeKarte.set(x.kid, [...(jeKarte.get(x.kid) || []), x]);
    if (!Lernen.kann(x.uebung, e, x.teil, x.form, mitTon) || !e.teile[x.teil] || !e.teile[x.teil].fr[x.form]) fehler(kurz(x) + ' geht mit dieser Karte nicht');
    if (!mitTon && brauchtTon(x)) fehler(kurz(x) + ' braucht Ton');
    if (!!x.frei !== frei) fehler('Marke frei bei ' + kurz(x));
    if ((x.uebung === 'kennen') !== (x.rolle === 'kennen') || (x.rolle === 'check') !== (x.check === 'a' || x.check === 'b') || (x.rolle !== 'check' && x.check !== null)
      || !['kennen', 'check', 'leit', 'neben', 'fuell'].includes(x.rolle) || (x.neu !== false && !(x.neu === true && x.uebung === 'kennen'))) fehler('rolle, check oder neu bei ' + kurz(x));
    if (!frei && !z0.ziele[e.g]) fehler(kurz(x) + ': Eintrag aus einem Lernziel, das nicht gewählt ist');
    const zweiter = e.art === 'wort' ? 'finden' : mitTon ? 'hoeren' : 'bedeutung';
    if (x.rolle === 'check' && (k.st !== 0 || x.teil !== 0 || x.form !== 0 || x.uebung !== (x.check === 'a' ? 'bedeutung' : zweiter))) fehler('Check stimmt nicht: ' + kurz(x));
    if (x.rolle === 'kennen' && k.st !== 0) fehler('kennen für eine Karte mit Stufe: ' + kurz(x));
    if (tief) {
      const a = Lernen.aufgabe(x, z0);
      if (!a || a.uebung !== x.uebung || a.vorgabe !== x.vorgabe || a.e !== e) fehler('Aufgabe zu ' + kurz(x) + ' passt nicht');
      // Ohne Ton: ein Schritt, der ohne Ton geht, oder keiner
      const o = Lernen.ohneTon(x, z0);
      if (o === x) fehler('ohneTon gibt den Schritt selbst zurück statt einer Kopie');
      const diktatDoppelt = x.uebung === 'schreiben' && x.vorgabe === 'ton' && kern.some(y => y.kid === x.kid && y.uebung === 'schreiben' && y.vorgabe === 'de');
      if ((o === null) !== diktatDoppelt) fehler('ohneTon von ' + kurz(x) + ': ' + (o ? kurz(o) : 'null'));
      if (o && (brauchtTon(o) || !Lernen.kann(o.uebung, e, o.teil, o.form, false) || !Lernen.aufgabe(o, z0) || o.rolle !== x.rolle || o.kid !== x.kid
        || (!brauchtTon(x) && !gleicheAufgabe(o, x)))) fehler('ohneTon von ' + kurz(x) + ' geht nicht: ' + kurz(o));
    }
  }
  const geurteilt = kern.filter(beurteilt), kennen = kern.filter(x => x.uebung === 'kennen');
  const mit = rolle => geurteilt.filter(x => x.rolle === rolle);
  const leit = mit('leit'), neben = mit('neben'), fuell = mit('fuell'), checks = mit('check');
  const last = liste => liste.reduce((summe, x) => summe + lastVon(x), 0);
  if (!gleich(plan.neu.slice().sort(), kennen.map(x => x.kid).sort())) fehler('plan.neu nennt nicht die Karten mit kennen');
  if (plan.faellig !== leit.length) fehler('plan.faellig ' + plan.faellig + ' statt ' + leit.length);
  if (kennen.length > K.NEU_PRO_RUNDE) fehler(kennen.length + ' neue Karten');

  // Je Karte: eine eingeführte Karte hat genau kennen und beide Checks, jede andere eine Hauptaufgabe
  for (const [kid, liste] of jeKarte) {
    const e = KARTE[kid], k = Lernen.zustand(z0, kid), rollen = liste.map(x => x.rolle + (x.check || '')).sort().join(' ');
    if (k.st === 0 ? rollen !== 'checka checkb kennen' : /check|kennen/.test(rollen)) fehler('Schritte von «' + kid + '»: ' + rollen);
    if (frei) continue;
    if (k.st >= 1 && !['leit', 'leit neben', 'neben', 'fuell'].includes(rollen)) fehler('Schritte von «' + kid + '»: ' + rollen);
    for (const x of liste) {
      const eigene = Lernen.nebenaufgaben(e, k, mitTon);
      if (x.rolle === 'leit' && (!(k.faellig <= heute) || !gleicheAufgabe(x, Lernen.leitaufgabe(e, k, mitTon)))) fehler('Leitaufgabe stimmt nicht: ' + kurz(x));
      if (x.rolle === 'neben' && rollen === 'leit neben' && (!x.begleiter || !eigene.some(y => gleicheAufgabe(x, y)))) fehler('keine Nebenaufgabe der Leiter: ' + kurz(x));
      if (x.rolle === 'neben' && rollen === 'neben') {
        // Eine Karte, die nicht fällig ist, übt nur, was ihr schwerfällt
        const schwach = { artikel: 'genus', akzent: 'akzent', lauschen: 'hoeren', hoeren: 'hoeren', schreiben: x.vorgabe === 'ton' ? 'hoeren' : '' }[x.uebung];
        if (x.begleiter || !(k.faellig > heute) || !(k.schwach[schwach] > 0)) fehler('Nebenaufgabe ohne Schwäche: ' + kurz(x));
      }
      if (x.rolle === 'fuell' && (x.begleiter || (x.uebung !== 'bedeutung' && !eigene.some(y => gleicheAufgabe(x, y))))) fehler('Füllaufgabe stimmt nicht: ' + kurz(x));
      // Zum Aufwärmen dient nur dann eine fällige Karte, wenn keine einzige ruht
      if (x.rolle === 'fuell' && !(k.faellig > heute) && (L0.ruhend.length || x.uebung !== 'bedeutung' || fuell.length > 1)) fehler('Füllaufgabe für eine fällige Karte: ' + kurz(x));
    }
  }

  let seiten = 0;
  if (!frei) {
    // Budget (3.4, Schritt 5)
    const kernLast = last(leit) + last(checks);
    // Das Aufwärmen ist eine Füllaufgabe und zählt zu den Nebenaufgaben. Es gibt sie genau dann, wenn
    // die Runde Leitaufgaben hat, keine davon auf Stufe 1, und überhaupt eine Füllaufgabe.
    const warm = leit.length && !leit.some(x => Lernen.zustand(z0, x.kid).st === 1) && fuell.length ? 1 : 0;
    seiten = neben.length + warm;
    // Checks und Leitaufgaben lassen den Nebenaufgaben ihre Plätze: so viele, wie die Runde
    // Nebenaufgaben haben kann, höchstens NEBEN_MAX. Was frei bleibt, bekommen fällige und neue Karten.
    const leitKids = leit.map(x => x.kid), basis = ersterGang(L0, mitTon, heute), reserve = nebenPlaetze(L0, basis, leitKids);
    if (basis.some(kid => !leitKids.includes(kid))) fehler('Leitaufgaben fehlen, die schon der erste Gang nimmt: ' + basis.filter(kid => !leitKids.includes(kid)));
    if (reserve.warm !== !!warm) fehler('Aufwärmen ' + (warm ? 'ohne Grund' : 'fehlt'));
    if (geurteilt.length > K.RUNDE) fehler(geurteilt.length + ' beurteilte Schritte');
    if (leit.length + checks.length + reserve.plaetze > K.RUNDE) fehler((leit.length + checks.length) + ' Checks und Leitaufgaben neben ' + reserve.plaetze + ' Plätzen für Nebenaufgaben');
    if (last(geurteilt) > K.LAST) fehler('Last ' + last(geurteilt));
    if (seiten > reserve.plaetze) fehler(seiten + ' Nebenaufgaben auf ' + reserve.plaetze + ' Plätzen');
    const mitNeben = leit.filter(x => Lernen.nebenaufgaben(KARTE[x.kid], Lernen.zustand(z0, x.kid), mitTon).length).length;
    if (seiten < Math.min(reserve.plaetze, mitNeben + warm)) fehler('nur ' + seiten + ' Nebenaufgaben, obwohl ' + mitNeben + ' Karten der Runde eine hergeben');
    if (neben.filter(x => x.uebung === 'artikel').length > 2) {
      // Drei Artikel-Aufgaben nur, wenn keine Karte ohne Nebenaufgabe etwas anderes Leichtes hergibt
      const andere = leit.filter(x => !neben.some(y => y.kid === x.kid))
        .find(x => Lernen.nebenaufgaben(KARTE[x.kid], Lernen.zustand(z0, x.kid), mitTon).some(y => y.uebung !== 'artikel' && lastVon(y) === 1));
      if (andere) fehler('drei Artikel-Aufgaben, obwohl «' + andere.kid + '» etwas anderes hergibt');
    }
    if (!leit.length && !checks.length) fehler('Runde ohne Check und ohne Leitaufgabe');
    if (geurteilt.length < K.RUNDE_MIN && last(geurteilt) < K.LAST) {
      const fehlt = L0.ruhend.find(x => !jeKarte.has(x.e.kid));
      if (fehlt) fehler('nur ' + geurteilt.length + ' beurteilte Schritte, obwohl «' + fehlt.e.kid + '» eine Füllaufgabe bekommen könnte');
    }
    if (fuell.length > warm && geurteilt.length > K.RUNDE_MIN) fehler('Füllaufgaben über RUNDE_MIN hinaus');

    // Auswahl: offene Einführungen, fällige nach Dringlichkeit, neue in der Reihenfolge des Buchs
    const offen = kennen.filter(x => !x.neu).map(x => x.kid), neue = kennen.filter(x => x.neu).map(x => x.kid);
    if (!gleich(offen.slice().sort(), L0.angefangen.slice(0, K.NEU_PRO_RUNDE).map(x => x.e.kid).sort())) fehler('offene Einführungen: ' + offen);
    if (!gleich(neue.slice().sort(), L0.kandidaten.slice(0, neue.length).map(x => x.e.kid).sort())) fehler('neue Karten nicht in der Reihenfolge des Buchs: ' + neue);
    if (neue.length > L0.frei) fehler(neue.length + ' neue Karten bei einem Kontingent von ' + L0.frei);
    if (kernLast + reserve.plaetze > K.LAST) fehler('Last ' + kernLast + ' der Checks und Leitaufgaben neben ' + reserve.plaetze + ' Plätzen für Nebenaufgaben');
    // Passt noch etwas dazu, mitsamt den Plätzen für Nebenaufgaben, die es mitbringt?
    const hatPlatz = (n, w, plaetze) => leit.length + checks.length + n + plaetze <= K.RUNDE && kernLast + w + plaetze <= K.LAST;
    if (neue.length < Math.min(L0.frei, L0.kandidaten.length) && hatPlatz(2, 2, reserve.plaetze)) fehler('nur ' + neue.length + ' neue Karten, obwohl Platz und Kontingent für mehr da sind');
    // Wer warten muss, ist weniger dringend als jede Karte der Runde, die mindestens so viel kostet:
    // mindestens so schwer wiegt und mindestens so viele Plätze für Nebenaufgaben mitbringt
    const mitbringt = kid => reserve.plaetze - nebenPlaetze(L0, basis, leitKids.filter(x => x !== kid)).plaetze;
    for (const x of L0.faellig) {
      if (jeKarte.has(x.e.kid)) continue;
      const gewicht = lastVon(Lernen.leitaufgabe(x.e, x.k, mitTon)), dazu = nebenPlaetze(L0, basis, [...leitKids, x.e.kid]).plaetze;
      if (hatPlatz(1, gewicht, dazu)) fehler('fällige Karte «' + x.e.kid + '» fehlt, obwohl sie Platz hätte');
      const vor = leit.find(y => lastVon(y) >= gewicht && mitbringt(y.kid) >= dazu - reserve.plaetze && dringend(Lernen.zustand(z0, y.kid), heute) < dringend(x.k, heute) - 1e-9);
      if (vor) fehler('«' + x.e.kid + '» wartet, obwohl sie dringender ist als «' + vor.kid + '»');
    }
    for (const kid of neue) {
      if (KARTE[kid].art === 'satz' && L0.gekannt < K.SATZ_AB && L0.wortOffen) fehler('Satz «' + kid + '» zu früh');
    }
    if (zahlen.neuFrei !== kennen.length) fehler('zahlen.neuFrei ' + zahlen.neuFrei + ' statt ' + kennen.length);

    // Pieks rät höchstens einmal mit, bei der ersten passenden Auswahl-Aufgabe ab Platz PIEKS_AB
    const passt = (x, p) => p >= K.PIEKS_AB && ['leit', 'neben', 'fuell'].includes(x.rolle) && Lernen.zustand(z0, x.kid).st >= 1
      && ['bedeutung', 'hoeren', 'finden', 'lauschen', 'luecke'].includes(x.uebung);
    if (!gleich(kern.filter(x => x.pieks), kern.filter(passt).slice(0, 1))) fehler('Pieks rät an der falschen Stelle mit');

    // Schluss: einmal nachsprechen (niedrigste Stufe, bei der es sich lohnt) und das Finale
    const echo = schluss.find(x => x.uebung === 'echo'), paare = schluss.find(x => x.uebung === 'paare');
    const lohnt = [...jeKarte.keys()].filter(kid => Lernen.kann('echo', KARTE[kid], 0, 0, mitTon));
    if (!!echo !== lohnt.length > 0) fehler('echo ' + (echo ? 'ohne Grund' : 'fehlt'));
    if (echo && (!lohnt.includes(echo.kid) || echo.rolle !== 'echo' || lohnt.some(kid => Lernen.zustand(z0, kid).st < Lernen.zustand(z0, echo.kid).st))) fehler('echo mit der falschen Karte: ' + echo.kid);
    const woerter = [...jeKarte.keys()].filter(kid => KARTE[kid].art === 'wort');
    if (paare) {
      const a = Lernen.aufgabe(paare, z0);
      if (paare.kids.length < K.PAARE_MIN || paare.kids.length > K.PAARE_MAX || new Set(paare.kids).size !== paare.kids.length || paare.kids.some(kid => !woerter.includes(kid))
        || paare.rolle !== 'paare' || !a || a.paare.length !== paare.kids.length) fehler('Finale stimmt nicht: ' + paare.kids);
      if (!paare.wahl || paare.kids.some(kid => !paare.wahl.includes(kid)) || paare.wahl.some(kid => !woerter.includes(kid))
        || Lernen.aufgabe({ ...paare, kids: paare.wahl }, z0).paare.length !== paare.wahl.length) fehler('Finale: wahl stimmt nicht');
      if (paare.kids.length < Math.min(K.PAARE_MAX, paare.wahl.length)) fehler('Finale mit weniger Paaren als möglich');
    } else if (woerter.length >= K.PAARE_MIN && Lernen.aufgabe({ uebung: 'paare', rolle: 'paare', kids: woerter }, z0).paare.length >= K.PAARE_MIN) fehler('Finale fehlt');
  } else {
    if (geurteilt.length > K.FREI) fehler(geurteilt.length + ' beurteilte Schritte im freien Üben');
    if (schluss.length || kennen.some(x => x.neu) || geurteilt.some(x => x.rolle !== 'check' && x.rolle !== 'fuell')) fehler('freies Üben: echo, Finale, Kontingent oder eine Rolle, die Stufen bewegt');
    if (geurteilt.some(x => Lernen.aepfel(x, { art: 'richtig' }) !== 1)) fehler('freies Üben zahlt mehr als einen Apfel');
  }
  const reihe = reihenfolgePruefen(plan, fehler, frei);
  return { ...reihe, geurteilt: geurteilt.length, last: last(geurteilt), neu: kennen.length, seiten, fuell: fuell.length,
    schreibenDoppelt: kern.filter((x, p) => p && x.uebung === 'schreiben' && kern[p - 1].uebung === 'schreiben').length };
}

/* ---------- 6 · Planer ---------- */

pruefung(6, 'Planer: 60 Tage gespielt und 10 000 beliebige Stände; Budget, leere Runden, Reihenfolge, Sätze, Leiter, freies Üben', melde => {
  const soll = (was, ist, erwartet) => {
    if (!gleich(ist, erwartet)) melde(was + ': ' + JSON.stringify(ist) + ' statt ' + JSON.stringify(erwartet));
  };
  const U1 = ['u1-1', 'u1-S', 'u1-2', 'u1-3'];
  const rollen = plan => plan.schritte.map(s => s.uebung + (s.check ? '/' + s.check : '')).join(' ');
  const hinweis = [];

  /* Die ersten Karten und der erste Tag (3.9) */
  {
    const z = zMitZielen(U1);
    const plan = Lernen.planen(z, HEUTE, { modus: 'runde', mitTon: true });
    planPruefen(kopie(z), plan, {}, HEUTE, melde, 'erste Runde', true);
    soll('die ersten neuen Karten von Unité 1', plan.neu, ['u1|le livre', 'u1|la règle', 'u1|le classeur', 'u1|le cahier']);
    soll('erste Runde: viermal kennen, acht Checks, nachsprechen, Finale mit vier Paaren',
      [rollen(plan).split(' ').sort().join(' '), plan.schritte[plan.schritte.length - 1].kids.length, plan.art, plan.faellig],
      ['bedeutung/a bedeutung/a bedeutung/a bedeutung/a echo finden/b finden/b finden/b finden/b kennen kennen kennen kennen paare', 4, 'runde', 0]);
    soll('erste Runde beginnt mit kennen, die erste beurteilte Aufgabe ist der erste Check', [plan.schritte[0].uebung, plan.schritte.find(beurteilt).check], ['kennen', 'a']);
    soll('planen legt keine Karte an und stellt nur den Tag um', [Object.keys(z.karten).length, z.tag], [0, { datum: HEUTE, neu: 0, runden: 0, frei: [] }]);
    soll('planen ohne Angaben ist eine Runde mit Ton', Lernen.planen(zMitZielen(U1), HEUTE).art, 'runde');
    soll('planen ohne Zustand kehrt zurück', [Lernen.planen(null, HEUTE, {}).art, Lernen.planen({}, HEUTE, { modus: 'frei' }).art,
      Lernen.planen(Lernen.neu(), HEUTE, { modus: 'frei', gruppe: 'gibt es nicht' }).art], ['leer', 'leer', 'leer']);
    // Ohne Ton: kein Zuhören, kein Nachsprechen
    const still = Lernen.planen(zMitZielen(['u4-3']), HEUTE, { mitTon: false });
    soll('nur Sätze, ohne Ton: beide Checks sind bedeutung, kein echo', rollen(still).split(' ').sort().join(' '), 'bedeutung/a bedeutung/a bedeutung/b bedeutung/b kennen kennen');
  }

  /* Kontingent und Bremsen */
  {
    // Zwölf Karten, deren Einführung offen ist: Die Runde nimmt vier und keine neue dazu
    const z = zMitZielen(U1);
    for (const e of V.LERNZIELE['u1-S'].eintraege) z.karten[e.kid] = stand({ gesehen: 2, falsch: 2, zuletzt: 'ff' });
    z.karten['u1|la matière scolaire'] = stand({ gesehen: 1 });
    soll('zwölf offene Einführungen', Object.values(z.karten).filter(k => k.st === 0 && k.gesehen > 0).length, 12);
    let plan = Lernen.planen(z, HEUTE, {});
    planPruefen(kopie(z), plan, {}, HEUTE, melde, 'zwölf offene Einführungen', true);
    soll('von zwölf offenen Einführungen nimmt die Runde vier, das Kontingent bleibt', [plan.neu, plan.schritte.filter(s => s.neu).length, Lernen.zahlen(z, HEUTE).neuFrei],
      [['u1|le livre', 'u1|la règle', 'u1|le classeur', 'u1|le cahier'], 0, 4]);
    spiele(z, plan, HEUTE, () => 'richtig');
    soll('offene Einführungen zählen nicht zum Kontingent', z.tag.neu, 0);

    // Das Kontingent des Tages: sechs neue, dann keine mehr, auch nach einer zweiten und dritten Runde
    const y = zMitZielen(U1);
    const neu = [];
    for (let runde = 0; runde < 4; runde++) {
      plan = Lernen.planen(y, HEUTE, {});
      neu.push(plan.art === 'leer' ? 'leer' : plan.schritte.filter(s => s.neu).length);
      if (plan.art !== 'leer') spiele(y, plan, HEUTE, () => 'richtig');
    }
    soll('neue Karten in vier Runden an einem Tag', [neu, y.tag.neu, y.tag.runden], [[4, 2, 'leer', 'leer'], 6, 2]);
    for (const [proTag, erwartet] of [[4, [4, 'leer']], [9, [4, 4, 1, 'leer']], [12, [4, 4, 4, 'leer']]]) {
      const x = zMitZielen(U1, { neuProTag: proTag }), ist = [];
      for (let runde = 0; runde < erwartet.length; runde++) {
        plan = Lernen.planen(x, HEUTE, {});
        ist.push(plan.art === 'leer' ? 'leer' : plan.schritte.filter(s => s.neu).length);
        if (plan.art !== 'leer') spiele(x, plan, HEUTE, () => 'richtig');
      }
      soll('neue Karten bei ' + proTag + ' am Tag', ist, erwartet);
    }
    // Am nächsten Tag gibt es wieder neue
    plan = Lernen.planen(y, Lernen.tagPlus(HEUTE, 1), {});
    soll('am nächsten Tag beginnt das Kontingent neu', [y.tag.datum, y.tag.neu, plan.schritte.filter(s => s.neu).length > 0], [Lernen.tagPlus(HEUTE, 1), 0, true]);

    // Bremsen: mehr als 14 fällig, oder mehr als 16 auf Stufe 1 und 2
    const alle = V.LERNZIEL_REIHE.filter(g => g.startsWith('u1') || g.startsWith('u2'));
    const mitStufe = (zahl, mehr) => {
      const x = zMitZielen(alle);
      KARTEN.filter(e => e.un === 'u2' && e.art === 'wort').slice(0, zahl).forEach(e => {
        x.karten[e.kid] = stand({ st: 3, gesehen: 4, richtig: 4, zuletzt: 'rrr', ...mehr });
      });
      return x;
    };
    const neue = x => Lernen.planen(x, HEUTE, {}).schritte.filter(s => s.neu).length;
    soll('mehr als 14 fällige Karten: keine neue', [neue(mitStufe(15, { st: 1, faellig: HEUTE })), neue(mitStufe(15, { faellig: HEUTE })), Lernen.zahlen(mitStufe(15, { faellig: HEUTE }), HEUTE).neuFrei],
      [0, 0, 0]);
    const morgen = Lernen.tagPlus(HEUTE, 1);
    soll('16 junge Karten bremsen nicht, 17 schon', [neue(mitStufe(16, { st: 2, faellig: morgen })), neue(mitStufe(17, { st: 2, faellig: morgen })),
      Lernen.planen(mitStufe(17, { st: 1, faellig: morgen }), HEUTE, {}).art], [4, 0, 'leer']);
    soll('zahlen.jung', [Lernen.zahlen(mitStufe(17, { st: 2, faellig: morgen }), HEUTE).jung, Lernen.zahlen(mitStufe(17, { faellig: morgen }), HEUTE).jung], [17, 0]);

    // Mehr fällig, als in eine Runde passt: Die dringendsten zuerst, die anderen warten auf die nächste
    // Runde. Jede dieser Karten hat ihren Artikel als Nebenaufgabe: Drei Plätze bleiben den Nebenaufgaben.
    const viele = zMitZielen(alle);
    const nomen = KARTEN.filter(e => e.un === 'u1' && e.art === 'wort' && (e.genus === 'm' || e.genus === 'f')).slice(0, 13);
    nomen.forEach((e, i) => {
      // je später in der Liste, desto dringender: länger überfällig, mehr Fehler
      viele.karten[e.kid] = stand({ st: 1, gesehen: 4, richtig: 2, falsch: i > 9 ? 2 : 0, zuletzt: i > 9 ? 'rf' : 'rr', faellig: Lernen.tagPlus(HEUTE, -i) });
    });
    plan = Lernen.planen(viele, HEUTE, {});
    planPruefen(kopie(viele), plan, {}, HEUTE, melde, 'dreizehn fällige Karten', true);
    soll('dreizehn fällige Karten: elf in der Runde, die zwei am wenigsten dringenden warten', [plan.faellig, nomen.filter(e => !plan.schritte.some(x => x.kid === e.kid)).map(e => e.kid), plan.neu,
      plan.schritte.filter(x => x.rolle === 'neben').length], [11, nomen.slice(0, 2).map(e => e.kid), [], 3]);
    spiele(viele, plan, HEUTE, () => 'richtig');
    soll('die nächste Runde am selben Tag bringt die beiden Wartenden', Lernen.planen(viele, HEUTE, {}).faellig, 2);
    // Eine sichere Karte wartet nicht ewig hinter wackligen: Jeder Tag Warten zählt einen Punkt (K.WARTEN).
    // Fünfzehn wacklige Karten auf Stufe 1 füllen jede Runde; die sichere, seit 13 Tagen fällig, ist trotzdem
    // dabei, seit 5 Tagen fällig noch nicht.
    const sicher = (tage) => {
      const x = zMitZielen(V.LERNZIEL_REIHE);
      const wackel = KARTEN.filter(e => e.art === 'wort' && !Lernen.nebenaufgaben(e, stand({ st: 1 }), true).length).slice(0, 15);
      for (const e of wackel) x.karten[e.kid] = stand({ st: 1, gesehen: 4, richtig: 2, falsch: 2, zuletzt: 'ff', faellig: HEUTE });
      x.karten['u1|la chaise'] = stand({ st: 4, gesehen: 6, richtig: 6, zuletzt: 'rrrrr', faellig: Lernen.tagPlus(HEUTE, -tage) });
      const p = Lernen.planen(x, HEUTE, {});
      planPruefen(kopie(x), p, {}, HEUTE, melde, 'sichere Karte, ' + tage + ' Tage fällig', true);
      return [p.schritte.some(s => s.kid === 'u1|la chaise' && s.rolle === 'leit'), p.schritte.filter(beurteilt).length];
    };
    soll('sichere Karte hinter wackligen: nach 13 Tagen dabei, nach 5 noch nicht', [sicher(13), sicher(5)], [[true, 14], [false, 14]]);
    // Plätze, die keine Nebenaufgabe braucht, gehen an fällige Karten zurück, dann an neue (3.4, Schritt 5):
    // Verben auf Stufe 1 haben keine Nebenaufgabe, also kommen alle dreizehn dran …
    const verbenZ = zMitZielen(alle);
    const verben = KARTEN.filter(e => e.un === 'u1' && e.cat === 'verb').slice(0, 13);
    verben.forEach((e, i) => {
      verbenZ.karten[e.kid] = stand({ st: 1, gesehen: 4, richtig: 2, falsch: i > 9 ? 2 : 0, zuletzt: i > 9 ? 'rf' : 'rr', faellig: Lernen.tagPlus(HEUTE, -i) });
    });
    plan = Lernen.planen(verbenZ, HEUTE, {});
    planPruefen(kopie(verbenZ), plan, {}, HEUTE, melde, 'dreizehn fällige Verben', true);
    soll('dreizehn fällige Verben ohne Nebenaufgabe: alle in der Runde', [plan.faellig, plan.schritte.filter(beurteilt).length, plan.neu], [13, 13, []]);
    // … und neben zehn Sätzen auf Stufe 1 (auch sie ohne Nebenaufgabe) kommen zwei neue Wörter
    const saetzeZ = zMitZielen(V.LERNZIEL_REIHE);
    KARTEN.filter(e => e.art === 'satz').slice(0, 10).forEach(e => {
      saetzeZ.karten[e.kid] = stand({ st: 1, gesehen: 4, richtig: 4, zuletzt: 'rr', faellig: HEUTE });
    });
    plan = Lernen.planen(saetzeZ, HEUTE, {});
    planPruefen(kopie(saetzeZ), plan, {}, HEUTE, melde, 'zehn fällige Sätze', true);
    soll('zehn fällige Sätze ohne Nebenaufgabe: dazu zwei neue Karten', [plan.faellig, plan.neu.length, plan.schritte.filter(beurteilt).length], [10, 2, 14]);
    // Schwere Aufgaben füllen die Runde früher: höchstens Last 20
    const schwer = zMitZielen(alle);
    KARTEN.filter(e => e.un === 'u2' && e.art === 'wort').slice(0, 12).forEach(e => {
      schwer.karten[e.kid] = stand({ st: 4, gesehen: 6, richtig: 6, zuletzt: 'rrr', faellig: HEUTE });
    });
    plan = Lernen.planen(schwer, HEUTE, {});
    // Das Aufwärmen zählt zu den drei Nebenaufgaben; zum Aufwärmen dient hier eine der Karten, die warten
    soll('zwölf fällige Schreibaufgaben: acht in der Runde, Aufwärmen und zwei Nebenaufgaben', [plan.faellig, plan.schritte[0].uebung + '/' + plan.schritte[0].rolle,
      plan.schritte.filter(x => x.rolle === 'neben').length, plan.schritte.filter(beurteilt).reduce((summe, x) => summe + lastVon(x), 0) <= K.LAST], [8, 'bedeutung/fuell', 2, true]);
  }

  /* Eine Uhr, die einmal vorging: Die Karten jenes Tages fallen nicht aus der Wiederholung */
  {
    const z = zMitZielen(['u1-S', 'u1-2']);
    let heute = HEUTE;
    const spielen = tag => {
      const plan = Lernen.planen(z, tag, {});
      if (plan.art !== 'leer') spiele(z, plan, tag, () => 'richtig');
    };
    for (let t = 0; t < 12; t++, heute = Lernen.tagPlus(heute, 1)) spielen(heute);
    // Ein Tag mit einer Uhr, die drei Jahre vorgeht, dann stimmt sie wieder
    const zukunft = Lernen.tagPlus(heute, 3 * 365);
    spielen(zukunft);
    spielen(zukunft);
    const weit = Object.entries(z.karten).filter(([, k]) => k.faellig > Lernen.tagPlus(heute, 90)).map(([kid]) => kid);
    if (weit.length < 10) melde('Uhr ging vor: nur ' + weit.length + ' Karten mit einem Datum aus der Zukunft, der Test prüft so wenig');
    const vorher = kopie(z), n = Lernen.zahlen(z, heute);
    soll('zahlen schreibt auch bei Daten aus der Zukunft nichts', z, vorher);
    const plan = Lernen.planen(z, heute, {});
    planPruefen(geklemmt(vorher, heute), plan, {}, heute, melde, 'Uhr ging vor', true);
    soll('zahlen zählt wie planen', [n.faellig, n.morgen, n.neuFrei], [lage(vorher, heute).faellig.length, lage(vorher, heute).morgen, plan.neu.length]);
    const zuweit = weit.filter(kid => {
      const k = z.karten[kid];
      return k.faellig > Lernen.tagPlus(heute, k.st === 5 ? 90 : 7) || k.auf > heute || k.ab > heute;
    });
    soll('Uhr ging vor: jede Karte ist nach der Pause ihrer Stufe wieder fällig', zuweit, []);
    // Danach kommt jede dieser Karten wieder dran, spätestens nach der längsten Pause, die sie haben
    // kann: reif und einmal bestätigt 45 Tage (an jenem Tag wurde sie bestätigt)
    const dran = new Set();
    for (let t = 0; t < 46; t++, heute = Lernen.tagPlus(heute, 1)) {
      const p = Lernen.planen(z, heute, {});
      for (const s of p.schritte) if (s.rolle === 'leit') dran.add(s.kid);
      if (p.art !== 'leer') spiele(z, p, heute, () => 'richtig');
    }
    soll('Uhr ging vor: nach der Pause ihrer Stufe wiederholt', weit.filter(kid => !dran.has(kid)), []);
  }

  /* Leere Runden und das nächste Lernziel (3.4, Schritt 9; 3.9) */
  {
    const z = zMitZielen(U1);
    z.tag = { datum: HEUTE, neu: z.neuProTag, runden: 2, frei: [] };
    let plan = Lernen.planen(z, HEUTE, {});
    soll('nichts fällig, Kontingent aufgebraucht, neue Karten in der Auswahl: leer ohne Angebot', [plan.art, plan.mehr, plan.schritte, plan.morgen], ['leer', null, [], 0]);
    // Alle Karten der Auswahl kennengelernt und keine fällig: Das nächste Lernziel wird angeboten
    const alle = (ziele, unite) => {
      const x = zMitZielen(ziele, { unite });
      for (const e of KARTEN) if (e.lernziele.some(g => x.ziele[g])) x.karten[e.kid] = stand({ st: 2, gesehen: 3, richtig: 3, faellig: Lernen.tagPlus(HEUTE, 1) });
      return x;
    };
    plan = Lernen.planen(alle(U1, 'u1'), HEUTE, {});
    soll('alles kennengelernt, nichts fällig: leer mit dem nächsten Lernziel', [plan.art, plan.mehr, plan.morgen], ['leer', 'u2-1', 32]);
    const basis = V.LERNZIEL_REIHE.filter(g => !V.LERNZIELE[g].plus), plus = V.LERNZIEL_REIHE.filter(g => V.LERNZIELE[g].plus);
    soll('das nächste Lernziel: Grundblätter ab der gewählten Unité, rundherum, dann die Plus-Blätter', [
      Lernen.planen(alle(['u3-1'], 'u3'), HEUTE, {}).mehr, Lernen.planen(alle(['u3-1', 'u3-3'], 'u3'), HEUTE, {}).mehr,
      Lernen.planen(alle(basis.filter(g => !g.startsWith('u1') && !g.startsWith('u2')), 'u3'), HEUTE, {}).mehr,
      Lernen.planen(alle(basis.filter(g => g !== 'u2-3'), 'u3'), HEUTE, {}).mehr, Lernen.planen(alle(basis, 'u3'), HEUTE, {}).mehr,
      Lernen.planen(alle([...basis, ...plus.slice(0, 4)], 'u4'), HEUTE, {}).mehr, Lernen.planen(alle(V.LERNZIEL_REIHE, 'u2'), HEUTE, {}).mehr,
      Lernen.planen(alle([], null), HEUTE, {}).mehr, Lernen.planen(alle([], 'u4'), HEUTE, {}).mehr,
    ], ['u3-3', 'u4-1', 'u1-1', 'u2-3', plus[0], plus[4], null, 'u1-1', 'u4-1']);
    // Fällige Karten gehen vor: Solange etwas zu tun ist, gibt es eine Runde
    const y = alle(U1, 'u1');
    y.karten['u1|le livre'].faellig = HEUTE;
    soll('eine fällige Karte reicht für eine Runde, die bis RUNDE_MIN aufgefüllt wird',
      [Lernen.planen(y, HEUTE, {}).art, Lernen.planen(y, HEUTE, {}).schritte.filter(beurteilt).length], ['runde', K.RUNDE_MIN]);
  }

  /* Die Leiter beim Verbuchen (3.3) */
  {
    const livre = E('u1|le livre');
    const leit = schritt(livre, 'schreiben', { rolle: 'leit' });
    // [Stufe vorher, Ergebnis] → [Stufe, Tage bis fällig, rueck, fest]
    const nach = (st, art, mehr) => {
      const z = mitKarten(zMitZielen(U1), { [livre.kid]: { st, ...mehr } });
      const b = Lernen.verbuchen(z, leit, { art, fehler: [] }, HEUTE), k = z.karten[livre.kid];
      if (b.vorher !== st || b.stufe !== k.st || b.auf !== (k.st > st) || b.ab !== (k.st < st) || b.reif !== (k.st === 5 && st < 5)) melde('verbuchen meldet die Stufe falsch: ' + JSON.stringify(b));
      return [k.st, [1, 2, 4, 7, 21, 45, 90].find(n => Lernen.tagPlus(HEUTE, n) === k.faellig), k.rueck, k.fest, k.auf === HEUTE, k.ab === HEUTE];
    };
    soll('Leitaufgabe richtig: eine Stufe hinauf, fällig nach 2, 4, 7, 21 Tagen', [1, 2, 3, 4].map(st => nach(st, 'richtig')),
      [[2, 2, false, 0, true, false], [3, 4, false, 0, true, false], [4, 7, false, 0, true, false], [5, 21, false, 0, true, false]]);
    soll('reife Karte bestätigt: 45, dann 90 Tage', [nach(5, 'richtig'), nach(5, 'richtig', { fest: 1 }), nach(5, 'richtig', { fest: 2 })],
      [[5, 45, false, 1, true, false], [5, 90, false, 2, true, false], [5, 90, false, 3, true, false]]);
    soll('Leitaufgabe fast: Stufe bleibt, morgen wieder', [1, 3, 5].map(st => nach(st, 'fast')), [[1, 1, false, 0, false, false], [3, 1, false, 0, false, false], [5, 1, false, 0, false, false]]);
    soll('Leitaufgabe falsch: 1 bleibt, 2 bleibt, 3 wird 2, 4 wird 3, 5 wird 3', [1, 2, 3, 4, 5].map(st => nach(st, 'falsch', { fest: st === 5 ? 2 : 0 })),
      [[1, 1, true, 0, false, true], [2, 1, true, 0, false, true], [2, 1, true, 0, false, true], [3, 1, true, 0, false, true], [3, 1, true, 0, false, true]]);
    soll('nach einem Fehler ist der nächste Aufstieg schon nach einem Tag fällig, der übernächste wieder normal',
      [nach(2, 'richtig', { rueck: true }), nach(4, 'richtig', { rueck: true }), nach(3, 'richtig', { rueck: false })],
      [[3, 1, false, 0, true, false], [5, 1, false, 0, true, false], [4, 7, false, 0, true, false]]);
    soll('höchstens ein Aufstieg am Tag', nach(2, 'richtig', { auf: HEUTE }), [2, 1, false, 0, true, false]);
    soll('höchstens ein Abstieg am Tag', nach(3, 'falsch', { ab: HEUTE }), [3, 1, true, 0, false, true]);
    soll('Leitaufgabe einer Karte, die nicht fällig ist, bewegt nichts', nach(3, 'richtig', { faellig: Lernen.tagPlus(HEUTE, 4) }).slice(0, 2), [3, 4]);
    // Nebenaufgabe, Füllaufgabe, Wiederholung: nur Zähler
    for (const rolle of ['neben', 'fuell', 'wdh']) {
      for (const art of ['richtig', 'fast', 'falsch']) {
        const z = mitKarten(zMitZielen(U1), { [livre.kid]: { st: 3, zuletzt: 'rr' } });
        const vorher = kopie(z.karten[livre.kid]);
        const b = Lernen.verbuchen(z, { ...leit, rolle }, { art, fehler: [] }, HEUTE), k = z.karten[livre.kid];
        soll(rolle + ' ' + art + ' bewegt keine Stufe', [b.auf, b.ab, { ...k, gesehen: 0, richtig: 0, falsch: 0 }], [false, false, { ...vorher, gesehen: 0, richtig: 0, falsch: 0 }]);
        soll(rolle + ' ' + art + ' zählt', [k.gesehen - vorher.gesehen, k.richtig - vorher.richtig, k.falsch - vorher.falsch], [1, art === 'richtig' ? 1 : 0, art === 'falsch' ? 1 : 0]);
      }
    }
    // Einführung: kennen legt die Karte an, die Checks heben sie
    const checks = (a, b) => {
      const z = zMitZielen(U1);
      const plan = Lernen.planen(z, HEUTE, {});
      const eigene = plan.schritte.filter(s => s.kid === livre.kid);
      Lernen.verbuchen(z, eigene[0], { art: 'ohne' }, HEUTE);
      const nachKennen = kopie(z.karten[livre.kid]);
      Lernen.verbuchen(z, eigene[1], { art: a }, HEUTE);
      const nachA = z.karten[livre.kid].st;
      // Nach einem verpassten ersten Check zeigt franz.js die Karte noch einmal: zählt nicht wieder
      Lernen.verbuchen(z, eigene[0], { art: 'ohne' }, HEUTE);
      Lernen.verbuchen(z, eigene[2], { art: b }, HEUTE);
      if (b === 'falsch') Lernen.verbuchen(z, Lernen.wiederholung(eigene[2]), { art: 'richtig' }, HEUTE);
      const k = z.karten[livre.kid];
      return [nachKennen.gesehen, nachKennen.st, nachA, k.st, k.faellig === (k.st ? Lernen.tagPlus(HEUTE, 1) : ''), k.zuletzt, z.tag.neu, k.auf === (k.st ? HEUTE : '')];
    };
    soll('beide Checks richtig', checks('richtig', 'richtig'), [1, 0, 1, 1, true, 'rr', 1, true]);
    soll('erster Check richtig, zweiter falsch: Stufe 1 bleibt', checks('richtig', 'falsch'), [1, 0, 1, 1, true, 'rf', 1, true]);
    soll('erster Check falsch, zweiter richtig: Stufe 1', checks('falsch', 'richtig'), [1, 0, 0, 1, true, 'fr', 1, true]);
    soll('beide Checks falsch: Stufe 0, die Einführung bleibt offen', checks('falsch', 'falsch'), [1, 0, 0, 0, true, 'ff', 1, true]);
    // Wer am selben Tag durch einen Check gestiegen ist, steigt nicht gleich noch einmal
    const z = mitKarten(zMitZielen(U1), { [livre.kid]: { st: 1, auf: HEUTE, faellig: HEUTE } });
    Lernen.verbuchen(z, schritt(livre, 'hoeren', { rolle: 'leit' }), { art: 'richtig' }, HEUTE);
    soll('kein zweiter Aufstieg am Tag des Checks', z.karten[livre.kid].st, 1);
    // zuletzt: höchstens fünf Zeichen, nur Checks und Leitaufgaben
    const y = mitKarten(zMitZielen(U1), { [livre.kid]: { st: 2, zuletzt: 'rrafr' } });
    Lernen.verbuchen(y, { ...leit, rolle: 'neben' }, { art: 'falsch' }, HEUTE);
    Lernen.verbuchen(y, leit, { art: 'fast' }, HEUTE);
    soll('zuletzt', y.karten[livre.kid].zuletzt, 'rafra');
    // Nichts ausser kennen legt eine Karte an, die es noch nicht gibt … ausser sie wird wirklich geübt
    const x = zMitZielen(U1);
    Lernen.verbuchen(x, schritt(livre, 'echo', { rolle: 'echo' }), { art: 'ohne' }, HEUTE);
    Lernen.verbuchen(x, { uebung: 'paare', rolle: 'paare', kids: [livre.kid] }, { art: 'ohne', fehlpaare: 1 }, HEUTE);
    Lernen.verbuchen(x, schritt(livre, 'kennen', { rolle: 'kennen', kid: 'gibt es nicht' }), { art: 'ohne' }, HEUTE);
    Lernen.zahlen(x, HEUTE);
    Lernen.aufgabe(schritt(livre, 'legen'), x);
    soll('echo, Finale, zahlen und aufgabe legen keine Karte an', Object.keys(x.karten), []);
    soll('verbuchen ohne Zustand oder Schritt wirft nicht', [Lernen.verbuchen(null, leit, { art: 'richtig' }, HEUTE).stufe, Lernen.verbuchen(x, null, null, HEUTE).stufe,
      Lernen.verbuchen(x, leit, null, HEUTE).stufe, Lernen.verbuchen({}, schritt(livre, 'kennen', { rolle: 'kennen' }), undefined, HEUTE).stufe], [0, 0, 0, 0]);

    // Teil und Form drehen nach jeder gelungenen Leitaufgabe weiter
    const dreh = (id, mal) => {
      const e = E(id), w = mitKarten(zMitZielen(V.LERNZIEL_REIHE), { [e.kid]: { st: 1 } }), aus = [];
      let tag = HEUTE;
      for (let i = 0; i < mal; i++) {
        const k = w.karten[e.kid], l = Lernen.leitaufgabe(e, k, true);
        aus.push(l.uebung + ' ' + e.teile[l.teil].fr[l.form]);
        Lernen.verbuchen(w, schritt(e, l.uebung, { ...l, rolle: 'leit' }), { art: 'richtig' }, tag);
        tag = w.karten[e.kid].faellig;
      }
      return aus;
    };
    soll('Paar: beide Hälften werden geschrieben, bevor die Karte reif ist', dreh('u4|les yeux (m pl), un œil', 4),
      ['hoeren les yeux', 'legen un œil', 'schreiben les yeux', 'schreiben un œil']);
    soll('Synonyme: die Form wechselt', dreh('u1|les maths, les mathématiques (f pl)', 5),
      ['hoeren les maths', 'legen les mathématiques', 'schreiben les maths', 'schreiben les mathématiques', 'schreiben les maths']);
    soll('ACM: die lange Form wird geordnet, nie getippt', dreh('u1|ACM (activités créatrices manuelles)', 5),
      ['hoeren ACM', 'ordnen les activités créatrices manuelles', 'schreiben ACM', 'schreiben ACM', 'schreiben ACM']);
    soll('drei Varianten eines Satzes der Reihe nach', dreh('u4|Prends la pâte bleue/verte/rouge.', 4),
      ['hoeren Prends la pâte bleue.', 'ordnen Prends la pâte verte.', 'ordnen Prends la pâte rouge.', 'bauen Prends la pâte bleue.']);
    soll('einfache Karte dreht nicht', dreh('u1|la chaise', 3), ['hoeren la chaise', 'legen la chaise', 'schreiben la chaise']);

    // Schwächen (Tabelle in 3.3), je von 1 aus
    const schwach = (uebung, art, mehr, id) => {
      const e = E(id || 'u1|la règle'), w = mitKarten(zMitZielen(U1), { [e.kid]: { st: 3, schwach: { genus: 1, akzent: 1, hoeren: 1 } } });
      Lernen.verbuchen(w, schritt(e, uebung, { rolle: 'neben', ...mehr }), { art, fehler: (mehr && mehr.fehler) || [] }, HEUTE);
      const s = w.karten[e.kid].schwach;
      return [s.genus, s.akzent, s.hoeren].join('');
    };
    soll('Schwäche Geschlecht', [schwach('artikel', 'falsch'), schwach('artikel', 'richtig'), schwach('schreiben', 'fast', { fehler: ['genus'] }), schwach('legen', 'falsch', { fehler: ['genus'] }),
      schwach('schreiben', 'richtig'), schwach('bedeutung', 'falsch')], ['311', '011', '211', '211', '111', '111']);
    soll('Schwäche Akzent', [schwach('akzent', 'falsch'), schwach('akzent', 'fast'), schwach('akzent', 'richtig'), schwach('schreiben', 'fast', { fehler: ['akzent'] }),
      schwach('legen', 'fast', { fehler: ['genus', 'akzent'] })], ['131', '121', '101', '121', '221']);
    soll('Schwäche Ohr', [schwach('hoeren', 'falsch'), schwach('lauschen', 'falsch'), schwach('schreiben', 'falsch', { vorgabe: 'ton' }), schwach('hoeren', 'richtig'),
      schwach('lauschen', 'richtig'), schwach('schreiben', 'richtig', { vorgabe: 'ton' }), schwach('schreiben', 'fast', { vorgabe: 'ton' }), schwach('schreiben', 'falsch', { vorgabe: 'de' })],
    ['113', '113', '113', '110', '110', '110', '111', '111']);
    soll('Schwächen bleiben zwischen 0 und 3', [schwach('artikel', 'falsch', { rolle: 'leit' }) + schwach('artikel', 'falsch', { rolle: 'wdh' }),
      (() => {
        const e = E('u1|la règle'), w = mitKarten(zMitZielen(U1), { [e.kid]: { st: 3, schwach: { genus: 3, akzent: 0, hoeren: 0 } } });
        Lernen.verbuchen(w, schritt(e, 'artikel', { rolle: 'neben' }), { art: 'falsch' }, HEUTE);
        Lernen.verbuchen(w, schritt(e, 'akzent', { rolle: 'neben' }), { art: 'richtig' }, HEUTE);
        return w.karten[e.kid].schwach;
      })()], ['311311', { genus: 3, akzent: 0, hoeren: 0 }]);
    soll('ein überzähliger Akzent in einem Wort ohne Akzent ist keine Schwäche', schwach('schreiben', 'fast', { fehler: ['akzent'] }, 'u1|le livre'), '111');
    // Eine Schwäche entsteht nur, wo ihre Übung sie wieder abbauen kann. Sätze haben keine Akzent-Übung,
    // «un/une élève» und Wörter ohne Artikel keine Artikel-Übung: Dort bliebe sie für immer stehen.
    soll('ein Akzent-Fehler beim Legen in einem Satz ist keine Schwäche', [schwach('legen', 'fast', { fehler: ['akzent'] }, 'u1|Chouette, c’est la rentrée!'),
      schwach('legen', 'falsch', { fehler: ['akzent'] }, 'u2|Je parle allemand, français et anglais.')], ['111', '111']);
    soll('der falsche Artikel ist keine Schwäche, wo es keine Artikel-Übung gibt', [schwach('legen', 'fast', { fehler: ['genus'] }, 'u3|un/une élève'),
      schwach('schreiben', 'fast', { fehler: ['genus'] }, 'u1|mardi'), schwach('legen', 'falsch', { fehler: ['genus'] }, 'u4|les parties du visage')], ['111', '111', '111']);
    soll('wo es die Übung gibt, zählt der Fehler', [schwach('legen', 'fast', { fehler: ['genus', 'akzent'] }, 'u4|les yeux (m pl), un œil'),
      schwach('schreiben', 'falsch', { fehler: ['genus'] }, 'u1|l’allemand (m)'), schwach('schreiben', 'fast', { fehler: ['akzent'] }, 'u2|voici, voilà')], ['221', '211', '121']);
    for (const e of KARTEN) {
      const w = mitKarten(zMitZielen(U1), { [e.kid]: { st: 3 } });
      for (const uebung of ['legen', 'schreiben']) Lernen.verbuchen(w, schritt(e, uebung, { rolle: 'neben' }), { art: 'fast', fehler: ['genus', 'akzent'] }, HEUTE);
      const sw = w.karten[e.kid].schwach;
      if ((sw.genus > 0) !== Lernen.kann('artikel', e, 0, 0, true)) melde(e.id + ': Schwäche beim Geschlecht ' + sw.genus + ', Artikel-Übung ' + Lernen.kann('artikel', e, 0, 0, true));
      if ((sw.akzent > 0) !== Lernen.kann('akzent', e, 0, 0, true)) melde(e.id + ': Schwäche bei den Akzenten ' + sw.akzent + ', Akzent-Übung ' + Lernen.kann('akzent', e, 0, 0, true));
    }
    soll('kennen und echo rühren die Schwächen nicht an', [schwach('kennen', 'ohne', { rolle: 'kennen' }), schwach('echo', 'ohne', { rolle: 'echo' })], ['111', '111']);
  }

  /* Was eine Runde mitbringt: Aufwärmen, Nebenaufgaben, Auffüllen */
  {
    const ding = V.LERNZIELE['u1-S'].eintraege.map(e => e.kid);
    const morgen = Lernen.tagPlus(HEUTE, 1);
    const erster = plan => plan.schritte.find(beurteilt);
    // Eine fällige Stufe-1-Karte eröffnet mit ihrem Zuhören
    let z = mitKarten(zMitZielen(U1), { [ding[0]]: { st: 1 }, [ding[1]]: { st: 3 }, [ding[2]]: { st: 3 }, [ding[3]]: { st: 4, faellig: morgen, zuletzt: 'rr' } });
    let plan = Lernen.planen(z, HEUTE, {});
    soll('Auftakt mit dem Zuhören der Stufe-1-Karte', kurz(plan.schritte[0]), 'hoeren/leit «le livre»');
    soll('Auftakt ohne Ton: bedeutung derselben Karte', kurz(Lernen.planen(z, HEUTE, { mitTon: false }).schritte[0]), 'bedeutung/leit «le livre»');
    // Sonst eine Bedeutung zu einer Karte, die ruht und zuletzt gelang
    z = mitKarten(zMitZielen(U1), { [ding[1]]: { st: 3 }, [ding[2]]: { st: 3 }, [ding[3]]: { st: 4, faellig: morgen, zuletzt: 'rr' }, [ding[4]]: { st: 5, faellig: morgen, zuletzt: 'rf' } });
    plan = Lernen.planen(z, HEUTE, {});
    soll('Auftakt mit einer Füllaufgabe zur sichersten ruhenden Karte', [kurz(plan.schritte[0]), plan.schritte[0].pieks === undefined], ['bedeutung/fuell «le cahier»', true]);
    // Unter mehreren sicheren Karten ist es eine der vier mit der höchsten Stufe, und nicht jedes Mal dieselbe
    z = mitKarten(zMitZielen(U1), { [ding[0]]: { st: 3 }, [ding[1]]: { st: 3 } });
    ding.slice(2, 9).forEach((kid, i) => {
      z.karten[kid] = stand({ st: i < 3 ? 1 : i < 5 ? 3 : 4 + (i === 6), gesehen: 5, richtig: 5, zuletzt: 'rr', faellig: morgen });
    });
    const gewaehlt = new Set();
    for (let mal = 0; mal < 60; mal++) gewaehlt.add(Lernen.planen(z, HEUTE, {}).schritte[0].kid);
    soll('Aufwärmen mit einer der vier sichersten Karten', [...gewaehlt].sort(), ding.slice(5, 9).sort());
    // Ohne solche Karte: die leichteste Aufgabe, also die Leitaufgabe der niedrigsten Stufe. Nur hier,
    // wo nichts anderes eröffnen kann (lauter fällige Wörter ab Stufe 2, keine ruhende Karte, kein
    // neues Wort), eröffnet Legen oder Schreiben eine Runde.
    z = mitKarten(zMitZielen(U1, { neuProTag: 4, tag: { datum: HEUTE, neu: 4, runden: 1, frei: [] } }), { [ding[1]]: { st: 4 }, [ding[2]]: { st: 2 }, [ding[3]]: { st: 3 } });
    plan = Lernen.planen(z, HEUTE, {});
    soll('Auftakt ohne Aufwärm-Karte: die leichteste Aufgabe', kurz(erster(plan)), 'legen/leit «le classeur»');
    // Kann aber ein Satz eröffnen, eröffnet er, auch wenn er als höchste Stufe in die Mitte gehörte
    // (u1-1 und u2-1, Kontingent verbraucht: Vorher eröffnete hier meist Legen oder Schreiben)
    const satzVorn = {};
    for (const [satz, wort] of [[5, 3], [4, 3], [2, 3], [5, 2]]) {
      for (let mal = 0; mal < 10; mal++) {
        for (const mitTon of [true, false]) {
          z = mitKarten(zMitZielen(['u1-1', 'u2-1'], { tag: { datum: HEUTE, neu: 6, runden: 0, frei: [] } }),
            { 'u1|Chouette, c’est la rentrée!': { st: satz }, 'u2|la famille': { st: wort }, 'u2|un/une enfant': { st: wort } });
          plan = Lernen.planen(z, HEUTE, { mitTon });
          planPruefen(kopie(z), plan, { mitTon }, HEUTE, melde, 'Satz vorn ' + satz + '/' + wort, !mal);
          const e = erster(plan).uebung;
          satzVorn[e] = (satzVorn[e] || 0) + 1;
        }
      }
    }
    soll('ohne Auswahl eröffnet ein Satz vor Legen und Schreiben (80 Pläne)', Object.keys(satzVorn).sort(), ['bauen', 'ordnen']);
    // Mit drei neuen Wörtern eröffnet der erste Check: Die anderen beiden trennen ihn vom Kennenlernen
    z = mitKarten(zMitZielen(U1), { [ding[1]]: { st: 4 }, [ding[2]]: { st: 2 }, [ding[3]]: { st: 3 } });
    plan = Lernen.planen(z, HEUTE, {});
    soll('Auftakt mit dem ersten Check nach drei neuen Wörtern', plan.schritte.slice(0, 4).map(s => s.uebung + (s.check || '')), ['kennen', 'kennen', 'kennen', 'bedeutunga']);
    // Eine kleine Runde beginnt nicht mit Legen oder Schreiben, wenn sie eine Auswahl hat, auch wenn dafür
    // zwei Auftritte einer Karte näher zusammenrücken: Das Aufwärmen eröffnet vor der einzigen Leitaufgabe
    // (so lief es auf der Seite: u1-S, Kontingent verbraucht, «la règle» auf Stufe 2 fällig) …
    for (let mal = 0; mal < 20; mal++) {
      for (const mitTon of [true, false]) {
        z = mitKarten(zMitZielen(['u1-S'], { tag: { datum: HEUTE, neu: 6, runden: 0, frei: [] } }), { [ding[1]]: { st: 2 },
          [ding[0]]: { st: 3, faellig: Lernen.tagPlus(HEUTE, 3) }, [ding[3]]: { st: 3, faellig: Lernen.tagPlus(HEUTE, 2) } });
        plan = Lernen.planen(z, HEUTE, { mitTon });
        if (kurz(erster(plan)).split(' ')[0] !== 'bedeutung/fuell' || !plan.schritte.some(s => s.uebung === 'legen' && s.rolle === 'leit')) melde('kleine Runde ohne Auswahl zum Auftakt: ' + plan.schritte.map(kurz).join(' · '));
      }
    }
    // … und ein neues Wort neben lauter Schreibaufgaben eröffnet mit seinem ersten Check
    z = mitKarten(zMitZielen(['u1-S'], { neuProTag: 4, tag: { datum: HEUTE, neu: 3, runden: 1, frei: [] } }), { [ding[1]]: { st: 4 }, [ding[2]]: { st: 3 } });
    plan = Lernen.planen(z, HEUTE, {});
    soll('neues Wort neben Schreibaufgaben: der erste Check eröffnet', [plan.schritte[0].uebung, kurz(erster(plan)), plan.neu.length], ['kennen', 'bedeutung/checka «le livre»', 1]);
    // Die Karte mit der höchsten Stufe steht im mittleren Drittel, zwei Schreibaufgaben stehen nicht nebeneinander
    Lernen.zufall = zufallAb(61);
    let mitte = 0, doppelt = 0, runden = 0;
    for (let lauf = 0; lauf < 200; lauf++) {
      z = zMitZielen(U1);
      ding.slice(0, 8).forEach((kid, i) => {
        z.karten[kid] = stand({ st: i === 5 ? 5 : i < 3 ? 1 : 3, gesehen: 4, richtig: 4, faellig: HEUTE, zuletzt: 'rr' });
      });
      plan = Lernen.planen(z, HEUTE, {});
      const kern = ohneSchluss(plan), p = kern.findIndex(s => s.kid === ding[5] && s.rolle === 'leit');
      runden++;
      if (p * 3 >= kern.length && p * 3 < kern.length * 2) mitte++;
      if (kern.some((s, i) => i && s.uebung === 'schreiben' && kern[i - 1].uebung === 'schreiben')) doppelt++;
    }
    soll('die höchste Stufe im mittleren Drittel, nie zweimal schreiben hintereinander (200 Runden)', [mitte, doppelt], [runden, 0]);

    // Nebenaufgaben: der Artikel als Begleiter des Zuhörens, höchstens drei, höchstens zwei Artikel, solange es anderes gibt
    z = mitKarten(zMitZielen(U1), Object.fromEntries(ding.slice(0, 6).map((kid, i) => [kid, { st: i < 4 ? 1 : 2 }])));
    plan = Lernen.planen(z, HEUTE, {});
    const neben = plan.schritte.filter(s => s.rolle === 'neben');
    soll('drei Nebenaufgaben, davon zwei Artikel als Begleiter', [neben.length, neben.filter(s => s.uebung === 'artikel').length, neben.every(s => s.begleiter)], [3, 2, true]);
    // Eine ruhende Karte mit einer Schwäche übt genau diese, auch wo die Leiter ihrer Stufe nichts dafür hat
    z = mitKarten(zMitZielen(U1), { [ding[0]]: { st: 1 }, [ding[1]]: { st: 5, faellig: morgen, schwach: { genus: 2, akzent: 0, hoeren: 0 } },
      [ding[2]]: { st: 2, faellig: morgen, schwach: { genus: 0, akzent: 0, hoeren: 1 } }, [ding[3]]: { st: 4, faellig: morgen } });
    plan = Lernen.planen(z, HEUTE, {});
    soll('ruhende Karten üben ihre Schwäche', plan.schritte.filter(s => s.rolle === 'neben').map(kurz).sort(),
      ['artikel/neben «la règle»', 'artikel/neben «le livre»', 'lauschen/neben «le classeur»']);
    planPruefen(kopie(z), plan, {}, HEUTE, melde, 'ruhende Karten mit Schwächen', true);
    // Ohne Ton entfällt ein Diktat, dessen Karte in der Runde schon geschrieben wird; allein wird es zum Schreiben
    z = mitKarten(zMitZielen(U1), { [ding[1]]: { st: 3, schwach: { genus: 0, akzent: 0, hoeren: 3 } } });
    plan = Lernen.planen(z, HEUTE, {});
    const diktat = plan.schritte.find(s => s.uebung === 'schreiben' && s.vorgabe === 'ton');
    soll('Diktat als Begleiter', [!!diktat && diktat.begleiter, diktat && Lernen.ohneTon(diktat, z), kurz(Lernen.ohneTon({ ...diktat, begleiter: false }, z))], [true, null, 'schreiben/neben «la règle»']);
    soll('ohneTon', [Lernen.ohneTon(schritt(E(ding[0]), 'echo', { rolle: 'echo' }), z), Lernen.ohneTon(null, z),
      ...[['hoeren', 'ton', ding[0]], ['lauschen', 'ton', ding[0]], ['ordnen', 'ton', 'u4|Pique un raisin.'], ['hoeren', 'ton', 'u4|Pique un raisin.'], ['legen', 'de', ding[0]]]
        .map(([uebung, vorgabe, id]) => {
          const o = Lernen.ohneTon(schritt(E(id), uebung, { vorgabe, rolle: 'leit' }), z);
          return o.uebung + '/' + o.vorgabe + '/' + o.rolle;
        })], [null, null, 'bedeutung/fr/leit', 'finden/de/leit', 'ordnen/de/leit', 'bedeutung/fr/leit', 'legen/de/leit']);
    // Ein Wort, das heute seinen ersten Check hatte, würde mit bedeutung dieselbe Frage noch einmal bekommen
    z = mitKarten(zMitZielen(U1, { tag: { datum: HEUTE, neu: 1, runden: 0, frei: [] } }), { [ding[0]]: { st: 1, auf: HEUTE, faellig: morgen } });
    soll('ohneTon nach dem ersten Check am selben Tag', Lernen.ohneTon(schritt(E(ding[0]), 'hoeren', { vorgabe: 'ton', rolle: 'fuell' }), z).uebung, 'finden');
    // Wiederholung: eine Kopie, die nichts mehr bewegt
    const original = { ...schritt(E(ding[0]), 'finden', { rolle: 'check', check: 'b' }), pieks: true, frei: true };
    const vorher = kopie(original), w = Lernen.wiederholung(original);
    soll('wiederholung', [w, original], [{ ...vorher, rolle: 'wdh', check: null, pieks: undefined, neu: false }, vorher]);
    soll('Wiederholung zahlt einen Apfel', Lernen.aepfel(Lernen.wiederholung(schritt(E(ding[0]), 'schreiben')), { art: 'richtig' }), 1);
  }

  /* Der schnellste Weg steht in Prüfung 7. Hier: 60 Tage mit Antworten, wie sie kommen. */
  let groessteRunde = 0, meisteRunden = 0, tageGespielt = 0, rundenGespielt = 0, schwachGewachsen = 0;
  // Wie oft eine weiche Regel fehlt, in Plänen ab vier Karten, getrennt nach Runde und freiem Üben.
  // Dass sie nur fehlt, wo es nicht anders geht, hat planPruefen schon für jeden Plan nachgewiesen.
  const weich = { runde: { plaene: 0, abstand: 0, spaet: 0, wahl: 0, schreiben: 0, zwei: 0, vermeidbar: 0, formen: new Set(), eng: new Set() },
    frei: { plaene: 0, abstand: 0, spaet: 0, wahl: 0, schreiben: 0, zwei: 0, vermeidbar: 0, formen: new Set(), eng: new Set() } };
  const zaehle = (r, frei) => {
    if (!r || r.karten < 4) return;
    const w = weich[frei ? 'frei' : 'runde'];
    w.plaene++;
    if (r.abstand < K.ABSTAND) {
      w.abstand++;
      w.formen.add(r.n + ' Schritte mit ' + r.neu + ' neuen');
      // Rückt der erste Check nicht an sein Kennenlernen heran, fehlt der Abstand aus einem anderen Grund
      if (!r.eng.has('kennen → Check A')) w.eng.add(r.n + ' Schritte, eng bei ' + [...r.eng].join(', '));
    }
    if (!r.spaet) w.spaet++;
    if (!r.wahl) w.wahl++;
    if (!r.ohneSchreiben) w.schreiben++;
    if (r.zwei) w.zwei++;
    if (r.vermeidbar === true) w.vermeidbar++;
  };
  for (const [saat, ziele, koennen, mitTon] of [[1, U1, 0.8, true], [2, V.LERNZIEL_REIHE, 0.65, true], [3, ['u4-1', 'u4-2', 'u4-3', 'u4-S', 'u4-4'], 0.9, false], [4, ['u2-1', 'u2-2', 'u2-3'], 0.5, true]]) {
    const rnd = zufallAb(saat * 97);
    Lernen.zufall = zufallAb(saat * 131);
    const z = zMitZielen(ziele, { unite: ziele[0].slice(0, 2) });
    let heute = HEUTE;
    const hoechste = new Map();
    for (let t = 0; t < 60; t++) {
      // Meist eine Runde am Tag, manchmal zwei oder drei, manchmal keine
      const runden = rnd() < 0.08 ? 0 : rnd() < 0.7 ? 1 : rnd() < 0.7 ? 2 : 3;
      const jeTag = new Map();
      for (let r = 0; r < runden; r++) {
        const vorher = kopie(z);
        const frei = rnd() < 0.12, opt = { modus: frei ? 'frei' : 'runde', mitTon, gruppe: frei && rnd() < 0.5 ? ziele[Math.floor(rnd() * ziele.length)] : undefined };
        const plan = Lernen.planen(z, heute, opt);
        vorher.tag = kopie(z.tag);
        zaehle(planPruefen(vorher, plan, opt, heute, melde, 'Tag ' + t + ' (Saat ' + saat + ')', true), frei);
        if (plan.art === 'leer') break;
        rundenGespielt++;
        groessteRunde = Math.max(groessteRunde, plan.schritte.filter(beurteilt).length);
        spiele(z, plan, heute, () => (rnd() < koennen ? 'richtig' : rnd() < 0.4 ? 'fast' : 'falsch'), (s, art, b, k0) => {
          if (!s.kid) return;
          const k = Lernen.zustand(z, s.kid), wo = 'Tag ' + t + ' (Saat ' + saat + ') ' + kurz(s) + ' ' + art;
          // Höchstens ein Aufstieg und ein Abstieg je Karte und Tag
          const heuteSchon = jeTag.get(s.kid) || { auf: 0, ab: 0 };
          jeTag.set(s.kid, { auf: heuteSchon.auf + (b.auf ? 1 : 0), ab: heuteSchon.ab + (b.ab ? 1 : 0) });
          if (jeTag.get(s.kid).auf > 1 || jeTag.get(s.kid).ab > 1) melde(wo + ': zweiter Auf- oder Abstieg am selben Tag');
          if (Math.abs(k.st - k0.st) > (k0.st === 5 ? 2 : 1)) melde(wo + ': Stufe springt von ' + k0.st + ' auf ' + k.st);
          if (k.st !== k0.st && !(s.rolle === 'check' || s.rolle === 'leit')) melde(wo + ': bewegt die Stufe');
          if (opt.modus === 'frei' && k.st !== k0.st && !(s.rolle === 'check' && k0.st === 0 && k.st === 1)) melde(wo + ': freies Üben bewegt die Stufe');
          // Wer einmal gelegt hat, fällt nie mehr auf das blosse Zuhören zurück
          if (hoechste.get(s.kid) >= 2 && (k.st < 2 || (s.rolle === 'leit' && s.uebung === 'hoeren'))) melde(wo + ': fällt unter Stufe 2 zurück');
          hoechste.set(s.kid, Math.max(hoechste.get(s.kid) || 0, k.st));
          if (k.st >= 1 && !(k.faellig > heute) && k.st !== k0.st) melde(wo + ': nach dem Verbuchen noch heute fällig');
          // Eine Schwäche, die keine Übung abbauen kann, bliebe für immer stehen («wackelig» im Album)
          const e = KARTE[s.kid];
          if (k.schwach.genus > 0 && !Lernen.kann('artikel', e, 0, 0, true)) melde(wo + ': Schwäche beim Geschlecht ohne Artikel-Übung');
          if (k.schwach.akzent > 0 && !Lernen.kann('akzent', e, 0, 0, true)) melde(wo + ': Schwäche bei den Akzenten ohne Akzent-Übung');
          if (k.schwach.genus > k0.schwach.genus || k.schwach.akzent > k0.schwach.akzent) schwachGewachsen++;
        });
        if (opt.modus === 'frei' && z.tag.neu !== vorher.tag.neu) melde('Tag ' + t + ': freies Üben verbraucht das Kontingent');
        if (z.tag.neu > z.neuProTag) melde('Tag ' + t + ': ' + z.tag.neu + ' neue Karten an einem Tag');
        // Was gespeichert würde, liest pruefen unverändert wieder ein
        if (!gleich(Lernen.pruefen(kopie(z)), z)) melde('Tag ' + t + ' (Saat ' + saat + '): pruefen verändert einen gespielten Stand');
      }
      // Runde um Runde am selben Tag, alles richtig: Nach höchstens zehn Runden ist Schluss
      if (t % 6 === 5) {
        const y = kopie(z);
        let n = 0;
        for (; n <= 12; n++) {
          const plan = Lernen.planen(y, heute, { mitTon });
          if (plan.art === 'leer') break;
          spiele(y, plan, heute, () => 'richtig');
        }
        meisteRunden = Math.max(meisteRunden, n);
        if (n > 10) melde('Tag ' + t + ' (Saat ' + saat + '): nach zehn Runden mit lauter richtigen Antworten immer noch nicht leer');
      }
      if (runden) tageGespielt++;
      heute = Lernen.tagPlus(heute, 1);
    }
    if (saat === 1 && Object.values(z.karten).filter(k => k.st >= 3).length < 10) melde('nach 60 Tagen kaum eine Karte mit Erdbeere');
  }
  // Die Läufe müssen Schreib- und Legefehler wirklich hervorbringen, sonst prüft die Zeile oben nichts
  if (schwachGewachsen < 20) melde('60 Tage: nur ' + schwachGewachsen + ' Schwächen aus Schreib- und Legefehlern, die Läufe üben das nicht');
  hinweis.push(tageGespielt + ' Tage und ' + rundenGespielt + ' Runden gespielt, grösste Runde ' + groessteRunde + ' Aufgaben, höchstens ' + meisteRunden + ' Runden bis leer');

  /* Jedes der 25 Lernziele allein: Tägliche Runden lernen jede Karte kennen, auch wo es nur Sätze gibt */
  for (const g of V.LERNZIEL_REIHE) {
    Lernen.zufall = zufallAb(600 + V.LERNZIEL_REIHE.indexOf(g));
    const z = zMitZielen([g], { unite: g.slice(0, 2) });
    const kids = [...new Set(V.LERNZIELE[g].eintraege.map(e => e.kid))];
    let heute = HEUTE, tage = 0;
    for (; tage < 60 && kids.some(kid => !(Lernen.zustand(z, kid).st >= 1)); tage++) {
      const vorher = kopie(z), plan = Lernen.planen(z, heute, {});
      vorher.tag = kopie(z.tag);
      zaehle(planPruefen(vorher, plan, {}, heute, melde, 'Lernziel ' + g + ' allein, Tag ' + tage, tage < 3), false);
      const nurSaetze = V.LERNZIELE[g].eintraege.every(e => e.art === 'satz');
      if (!tage && nurSaetze && plan.schritte.filter(s => s.neu).length !== Math.min(2, kids.length)) melde('Lernziel ' + g + ': nur Sätze, aber nicht zwei in der ersten Runde');
      if (plan.art !== 'leer') spiele(z, plan, heute, () => 'richtig');
      heute = Lernen.tagPlus(heute, 1);
    }
    if (kids.some(kid => !(Lernen.zustand(z, kid).st >= 1))) melde('Lernziel ' + g + ' allein: nach 60 Tagen nicht jede Karte kennengelernt');
    if (tage > Math.ceil(kids.length / 2) + 12) melde('Lernziel ' + g + ' allein: ' + tage + ' Tage für ' + kids.length + ' Karten');
  }
  // Kein Satz vor SATZ_AB bekannten Karten, solange ein neues Wort wartet
  {
    Lernen.zufall = zufallAb(66);
    const z = zMitZielen(U1);
    let heute = HEUTE, ersterSatz = null;
    for (let t = 0; t < 8 && !ersterSatz; t++) {
      const gekannt = Object.values(z.karten).filter(k => k.st >= 1).length;
      const plan = Lernen.planen(z, heute, {});
      const satz = plan.schritte.find(s => s.neu && KARTE[s.kid].art === 'satz');
      if (satz) ersterSatz = [satz.kid, gekannt >= K.SATZ_AB, plan.schritte.filter(s => s.neu && KARTE[s.kid].art === 'satz').length];
      spiele(z, plan, heute, () => 'richtig');
      heute = Lernen.tagPlus(heute, 1);
    }
    soll('der erste Satz kommt, sobald acht Karten bekannt sind, und nur einer je Runde', ersterSatz, ['u1|Chouette, c’est la rentrée!', true, 1]);
  }

  /* 10 000 beliebige Stände: planen kehrt immer zurück, und jeder Plan hält die Regeln */
  {
    const rnd = zufallAb(4711);
    Lernen.zufall = zufallAb(4712);
    const arten = { runde: 0, frei: 0, leer: 0 };
    let klein = 0;
    for (let lauf = 0; lauf < 10000; lauf++) {
      const z = zufallsStand(rnd, HEUTE);
      const frei = lauf % 4 === 3;
      const opt = { modus: frei ? 'frei' : 'runde', mitTon: rnd() < 0.8, gruppe: frei && rnd() < 0.6 ? V.LERNZIEL_REIHE[Math.floor(rnd() * V.LERNZIEL_REIHE.length)] : undefined };
      // planen stellt nur den Tag um und holt Daten aus der Zukunft zurück: Alles andere steht danach da wie zuvor
      const tag = z.tag.datum === HEUTE ? kopie(z.tag) : { datum: HEUTE, neu: 0, runden: 0, frei: [] };
      const vorher = lauf < 1500 ? JSON.stringify({ ...geklemmt(z, HEUTE), tag }) : null;
      let plan;
      try {
        plan = Lernen.planen(z, HEUTE, opt);
      } catch (err) {
        melde('Stand ' + lauf + ': planen wirft: ' + err.message);
        continue;
      }
      if (!plan || !['runde', 'frei', 'leer'].includes(plan.art)) {
        melde('Stand ' + lauf + ': kein Plan');
        continue;
      }
      arten[plan.art]++;
      if (!gleich(z.tag, tag) || (vorher && JSON.stringify(z) !== vorher)) melde('Stand ' + lauf + ': planen verändert den Zustand');
      const r = planPruefen(z, plan, opt, HEUTE, melde, 'Stand ' + lauf + (frei ? ' frei' + (opt.gruppe ? ' ' + opt.gruppe : '') : ''), lauf < 1500);
      zaehle(r, frei);
      if (r && r.karten <= 2) klein++;
    }
    hinweis.push('10 000 Stände: ' + arten.runde + ' Runden, ' + arten.frei + ' freie, ' + arten.leer + ' leere, ' + klein + ' Pläne mit ein oder zwei Karten');
    for (const art of ['runde', 'frei']) {
      const w = weich[art];
      hinweis.push((art === 'runde' ? 'Runden' : 'freies Üben') + ' ab vier Karten: ' + w.plaene + ', davon ohne vollen Abstand ' + w.abstand + ', zweiter Check zu früh ' + w.spaet
        + ', Auftakt ohne Auswahl ' + w.wahl + ' (davon mit Legen oder Schreiben ' + w.schreiben + ')' + ', zweimal schreiben hintereinander ' + w.zwei + ' (' + (100 * w.zwei / Math.max(1, w.plaene)).toFixed(1) + ' %, vermeidbar ' + w.vermeidbar + ')');
    }
    hinweis.push('ohne vollen Abstand nur Runden, deren erster Check näher am Kennenlernen steht, und im freien Üben ' + [...weich.frei.formen].sort().join(', '));
    // Regel (ii), nie zweimal schreiben hintereinander: reihen() hält sie, wo es geht, und bessert danach
    // mit Tauschen und Versetzen nach. Gemessen an denselben 10 000 Ständen mit der Reihenfolge davor
    // (nur ein Wunsch beim Reihen): Runden ab vier Karten 607 von 5728 = 10,6 % (391 nach der Suche
    // vermeidbar), freies Üben 824 von 1763 = 46,7 % (478). Die Suche kennt Regel (iv) und den Auftakt
    // mit einer leichten Aufgabe nicht; «vermeidbar» heisst darum nicht immer, dass es nach 3.4 ginge.
    for (const [art, vorher, grenze] of [['runde', 0.106, 0.07], ['frei', 0.467, 0.42]]) {
      const w = weich[art], anteil = w.zwei / Math.max(1, w.plaene);
      if (anteil > grenze) melde((art === 'runde' ? 'Runden' : 'freies Üben') + ': zweimal schreiben hintereinander in ' + (100 * anteil).toFixed(1)
        + ' % der Pläne ab vier Karten, vorher ' + (100 * vorher).toFixed(1) + ' %, erlaubt höchstens ' + (100 * grenze).toFixed(0) + ' %');
    }
    // In einer Runde rückt nur der erste Check an sein Kennenlernen heran, und nur, weil eine Auswahl
    // eröffnen muss (dass es ohne das nicht ging, hat planPruefen für jeden Plan gezeigt). Im freien
    // Üben, gemessen und nachgerechnet: Es fehlt nur einer neuen Karte der Platz, wenn alles sechs Schritte hat.
    if (weich.runde.eng.size) melde('Runden: voller Abstand fehlt auch in ' + [...weich.runde.eng].join('; '));
    if ([...weich.frei.formen].some(f => f !== '6 Schritte mit 1 neuen')) melde('freies Üben: voller Abstand fehlt auch in ' + [...weich.frei.formen].join(', '));
  }

  /* Freies Üben (3.4) */
  {
    Lernen.zufall = zufallAb(88);
    const rnd = zufallAb(89);
    const lz = V.LERNZIELE['u3-1'], kids = lz.eintraege.map(e => e.kid);
    soll('u3-1 hat 26 Karten', new Set(kids).size, 26);
    // Alle 26 kennengelernt: «Für den Test üben» geht Runde um Runde durch das ganze Lernziel
    const z = zMitZielen(['u3-1'], { unite: 'u3' });
    for (const kid of kids) z.karten[kid] = stand({ st: 1 + Math.floor(rnd() * 5), gesehen: 4, richtig: 3, faellig: Lernen.tagPlus(HEUTE, Math.floor(rnd() * 9) - 2) });
    const vorher = kopie(z), dran = new Set(), jeRunde = [];
    for (let runde = 0; runde < 5; runde++) {
      const stand0 = kopie(z);
      const plan = Lernen.planen(z, HEUTE, { modus: 'frei', gruppe: 'u3-1' });
      stand0.tag = kopie(z.tag);
      planPruefen(stand0, plan, { modus: 'frei', gruppe: 'u3-1' }, HEUTE, melde, '«Für den Test üben», Runde ' + runde, true);
      const karten = [...new Set(plan.schritte.map(s => s.kid))];
      const neu = karten.filter(kid => !dran.has(kid));
      // Keine Karte kommt ein zweites Mal, bevor jede einmal dran war
      if (neu.length < karten.length && neu.length < kids.length - dran.size) melde('«Für den Test üben», Runde ' + runde + ': wiederholt Karten, obwohl noch welche warten');
      for (const s of plan.schritte) {
        const e = KARTE[s.kid], k = Lernen.zustand(z, s.kid);
        // Der Test verlangt freies Schreiben: Jedes Wort wird geschrieben, davor höchstens gelegt
        if (s.rolle !== 'fuell' || s.vorgabe !== 'de' || !(s.uebung === 'schreiben' || (s.uebung === 'legen' && k.st < 3))) melde('«Für den Test üben»: ' + kurz(s));
        const geschrieben = plan.schritte.some(x => x.kid === s.kid && x.uebung === 'schreiben' && x.teil === s.teil && x.form === s.form);
        if (s.uebung === 'legen' && !geschrieben) melde('«Für den Test üben»: legen ohne schreiben bei ' + e.kid);
      }
      for (const kid of karten) if (!plan.schritte.some(s => s.kid === kid && s.uebung === 'schreiben')) melde('«Für den Test üben»: «' + kid + '» wird nicht geschrieben');
      jeRunde.push(karten.length);
      for (const kid of karten) dran.add(kid);
      spiele(z, plan, HEUTE, () => (rnd() < 0.6 ? 'richtig' : rnd() < 0.5 ? 'fast' : 'falsch'));
      if (runde === 2 && dran.size < 18) melde('«Für den Test üben»: nach drei Runden erst ' + dran.size + ' verschiedene Karten');
    }
    soll('«Für den Test üben» erreicht alle 26 Karten', dran.size, 26);
    const fest = karten => kids.map(kid => [karten[kid].st, karten[kid].faellig, karten[kid].auf, karten[kid].ab, karten[kid].zuletzt, karten[kid].teil, karten[kid].form, karten[kid].rueck]);
    soll('freies Üben bewegt keine Stufe, keine Fälligkeit und kein Kontingent', [fest(z.karten), z.tag.neu, z.zaehler.runden, z.zaehler.perfekt, z.tag.runden], [fest(geklemmt(vorher, HEUTE).karten), 0, 0, 0, 0]);
    soll('heute frei geübt', z.tag.frei.length, 26);
    hinweis.push('«Für den Test üben» mit 26 Karten: ' + jeRunde.join(', ') + ' Karten je Runde');
    // Am nächsten Tag beginnt die Runde durch das Lernziel von vorn
    Lernen.planen(z, Lernen.tagPlus(HEUTE, 1), { modus: 'frei', gruppe: 'u3-1' });
    soll('am nächsten Tag ist die Liste leer', z.tag.frei, []);

    // Im freien Üben dreht keine Karte weiter: Über mehrere Runden kommen trotzdem beide Hälften eines
    // Paars, jede Schreibweise und jede Variante eines Satzes an die Reihe
    const gefragt = (ziel, id, frei) => {
      const e = E(id), u = mitKarten(zMitZielen([ziel]), { [e.kid]: { st: 4, falsch: 9 } }), formen = new Set();
      for (let mal = 0; mal < 40; mal++) {
        const s = Lernen.planen(u, HEUTE, { modus: 'frei', gruppe: frei ? undefined : ziel }).schritte.find(x => x.kid === e.kid && !x.begleiter);
        formen.add(e.teile[s.teil].fr[s.form]);
      }
      return [...formen].sort();
    };
    soll('«Für den Test üben» fragt beide Hälften, jede Schreibweise, jede Variante', [gefragt('u3-1', 'u3|le foot, faire du foot'), gefragt('u2-2', 'u2|la mère, la maman'),
      gefragt('u4P-3', 'u4|Prends la pâte bleue/verte/rouge.'), gefragt('u1P-2', 'u1|ACM (activités créatrices manuelles)'), gefragt('u1-S', 'u1|la chaise')],
    [['faire du foot', 'le foot'], ['la maman', 'la mère'], ['Prends la pâte bleue.', 'Prends la pâte rouge.', 'Prends la pâte verte.'], ['ACM'], ['la chaise']]);
    soll('«Frei üben» ebenso', [gefragt('u4-2', 'u4|les yeux (m pl), un œil', true), gefragt('u1-2', 'u1|les maths, les mathématiques (f pl)', true)],
      [['les yeux', 'un œil'], ['les maths', 'les mathématiques']]);

    // Wer wenig Karten hat, legt vor dem Schreiben: Stufe unter 3, und es ist Platz
    const y = zMitZielen(['u2-1'], { unite: 'u2' });
    y.karten['u2|la famille'] = stand({ st: 1, gesehen: 2, faellig: HEUTE });
    y.karten['u2|un/une enfant'] = stand({ st: 4, gesehen: 6, faellig: HEUTE });
    let plan = Lernen.planen(y, HEUTE, { modus: 'frei', gruppe: 'u2-1' });
    soll('legen vor dem Schreiben nur unter Stufe 3', plan.schritte.map(kurz).sort(), ['legen/fuell «la famille»', 'schreiben/fuell «la famille»', 'schreiben/fuell «un/une enfant»']);
    soll('legen steht vor schreiben', plan.schritte.findIndex(s => s.uebung === 'legen') < plan.schritte.findIndex(s => s.uebung === 'schreiben' && s.kid === 'u2|la famille'), true);
    // Sätze werden gebaut
    const x = zMitZielen(['u4-S'], { unite: 'u4' });
    for (const e of V.LERNZIELE['u4-S'].eintraege) x.karten[e.kid] = stand({ st: 2, gesehen: 2, faellig: HEUTE });
    soll('Sätze werden für den Test gebaut', Lernen.planen(x, HEUTE, { modus: 'frei', gruppe: 'u4-S' }).schritte.map(s => s.uebung + '/' + s.rolle), ['bauen/fuell', 'bauen/fuell']);

    // Unbekannte Karten des Lernziels werden richtig eingeführt, höchstens vier, ohne das Kontingent
    const w = zMitZielen(['u1-S'], { tag: { datum: HEUTE, neu: 6, runden: 1, frei: [] } });
    plan = Lernen.planen(w, HEUTE, { modus: 'frei', gruppe: 'u1P-2' });
    planPruefen(kopie(w), plan, { modus: 'frei', gruppe: 'u1P-2' }, HEUTE, melde, 'freies Üben mit unbekannten Karten', true);
    soll('freies Üben führt vier unbekannte Karten des Lernziels ein', [plan.art, plan.neu.length, rollen(plan).split(' ').sort().join(' ')],
      ['frei', 4, 'bedeutung/a bedeutung/a bedeutung/a bedeutung/a finden/b finden/b finden/b finden/b kennen kennen kennen kennen']);
    spiele(w, plan, HEUTE, s => (s.check === 'a' ? 'richtig' : 'falsch'));
    soll('ein gelungener Check hebt die Karte auf Stufe 1, das Kontingent bleibt', [plan.neu.map(kid => w.karten[kid].st), plan.neu.map(kid => w.karten[kid].faellig === Lernen.tagPlus(HEUTE, 1)), w.tag.neu],
      [[1, 1, 1, 1], [true, true, true, true], 6]);
    // «Frei üben»: jede bekannte Karte der Auswahl mit ihrer Leitaufgabe, mindestens der von Stufe 2
    const v = zMitZielen(['u1-S', 'u1-1']);
    for (const e of V.LERNZIELE['u1-S'].eintraege.slice(0, 5)) v.karten[e.kid] = stand({ st: 1 + V.LERNZIELE['u1-S'].eintraege.indexOf(e), gesehen: 3, faellig: Lernen.tagPlus(HEUTE, 3) });
    v.karten['u1|Zut, c’est la rentrée!'] = stand({ st: 1, gesehen: 3, faellig: Lernen.tagPlus(HEUTE, 3) });
    v.karten['u3|danser'] = stand({ st: 3, gesehen: 3, faellig: HEUTE });
    plan = Lernen.planen(v, HEUTE, { modus: 'frei' });
    planPruefen(kopie(v), plan, { modus: 'frei' }, HEUTE, melde, '«Frei üben»', true);
    soll('«Frei üben»: Leitaufgabe ab Stufe 2 und dazu eine Nebenaufgabe', plan.schritte.filter(s => !s.begleiter).map(kurz).sort(),
      ['legen/fuell «la règle»', 'legen/fuell «le livre»', 'ordnen-ton/fuell «Zut, c’est la rentrée!»', 'schreiben/fuell «le cahier»', 'schreiben/fuell «le classeur»',
        'schreiben/fuell «le crayon»']);
    soll('«Frei üben»: Nebenaufgaben', [plan.schritte.filter(s => s.begleiter).length, plan.schritte.filter(beurteilt).length <= K.FREI, plan.neu], [6, true, []]);
    soll('«Frei üben» ohne bekannte Karte ist leer', Lernen.planen(zMitZielen(U1), HEUTE, { modus: 'frei' }).art, 'leer');
  }

  /* Zahlen für Lichtung, Album und Eltern (9.5) */
  {
    const leerZ = Lernen.zahlen(Lernen.neu(), HEUTE);
    soll('zahlen: frischer Stand', [leerZ.gekannt, leerZ.frucht, leerZ.reif, leerZ.stufen, leerZ.aktiv, leerZ.aktivFrucht, leerZ.faellig, leerZ.morgen, leerZ.neuFrei, leerZ.jung, leerZ.schwer],
      [0, 0, 0, [210, 0, 0, 0, 0, 0], 0, 0, 0, 0, 0, 0, []]);
    soll('zahlen: je Unité', Object.entries(leerZ.proUnite).map(([un, u]) => [un, u.alle, u.basis, u.gekannt + u.frucht + u.reif + u.basisFrucht]),
      [['u1', 50, 32, 0], ['u2', 53, 33, 0], ['u3', 50, 30, 0], ['u4', 57, 33, 0]]);
    soll('zahlen ohne Zustand wirft nicht', [Lernen.zahlen(null, HEUTE).gekannt, Lernen.zahlen({}, HEUTE).stufen[0]], [0, 210]);
    const z = zMitZielen(['u2-2', 'u2-3']);
    const morgen = Lernen.tagPlus(HEUTE, 1);
    mitKarten(z, { 'u2|la fille': { st: 3, faellig: HEUTE, falsch: 2, schwach: { genus: 1, akzent: 0, hoeren: 2 } }, 'u2|la mère, la maman': { st: 5, faellig: morgen, falsch: 5 },
      'u2|le père, le papa': { st: 1, faellig: morgen }, 'u2|le frère': { st: 2, faellig: Lernen.tagPlus(HEUTE, 2), falsch: 1, schwach: { genus: 2, akzent: 0, hoeren: 0 } },
      'u1|le livre': { st: 4, faellig: HEUTE }, 'u2|la sœur': { st: 0, gesehen: 1, faellig: '' } });
    const vorher = kopie(z), n = Lernen.zahlen(z, HEUTE);
    soll('zahlen schreibt nichts', z, vorher);
    // «la fille» steht zweimal im Buch und ist eine Karte: Beide Einträge zählen mit derselben Stufe
    soll('zahlen: Einträge je Stufe', [n.gekannt, n.frucht, n.reif, n.stufen], [6, 4, 1, [204, 1, 1, 2, 1, 1]]);
    soll('zahlen: gewählte Lernziele', [n.aktiv, n.aktivFrucht, n.faellig, n.morgen, n.jung, n.neuFrei], [31, 2, 1, 2, 2, 4]);
    soll('zahlen: je Unité', [n.proUnite.u2, n.proUnite.u3, n.proUnite.u1.frucht], [{ alle: 53, gekannt: 4, frucht: 2, reif: 1, basis: 33, basisFrucht: 2 },
      { alle: 50, gekannt: 1, frucht: 1, reif: 0, basis: 30, basisFrucht: 1 }, 1]);
    soll('zahlen: die schwierigsten Karten', n.schwer, [{ kid: 'u2|la mère, la maman', falsch: 5, art: null }, { kid: 'u2|la fille', falsch: 2, art: 'hoeren' }, { kid: 'u2|le frère', falsch: 1, art: 'genus' }]);
    for (const kid of Object.keys(z.karten)) z.karten[kid].falsch = 3;
    for (const e of V.LERNZIELE['u2-2'].eintraege.slice(8, 14)) z.karten[e.kid] = stand({ st: 1, gesehen: 5, falsch: 4, faellig: morgen });
    soll('zahlen: höchstens acht schwierige', [Lernen.zahlen(z, HEUTE).schwer.length, Lernen.zahlen(z, HEUTE).schwer[0].falsch], [8, 4]);
  }

  return hinweis.join('; ');
});

/* ---------- 7 · Der schnellste Weg ---------- */

pruefung(7, 'Schnellster Weg: Tag 0, 1, 3, 7, 14, dann reif; die letzten drei Abrufe geschrieben', melde => {
  const soll = (was, ist, erwartet) => {
    if (!gleich(ist, erwartet)) melde(was + ': ' + JSON.stringify(ist) + ' statt ' + JSON.stringify(erwartet));
  };
  // Tägliche Runden, alles richtig: An welchen Tagen steigt die Karte, und womit?
  const weg = (ziel, kid, tage, mitTon) => {
    const z = zMitZielen([ziel], { unite: ziel.slice(0, 2) }), aus = [];
    let heute = HEUTE;
    for (let t = 0; t <= tage; t++) {
      const plan = Lernen.planen(z, heute, { mitTon });
      if (plan.art !== 'leer') {
        spiele(z, plan, heute, () => 'richtig', (s, art, b) => {
          if (s.kid === kid && (b.auf || (s.rolle === 'leit' && b.vorher === 5))) aus.push(t + ':' + b.stufe + ' ' + s.uebung + (s.vorgabe === 'ton' && s.uebung !== 'hoeren' ? '-ton' : ''));
        });
      }
      heute = Lernen.tagPlus(heute, 1);
    }
    return { aus, k: z.karten[kid], z };
  };
  const wort = weg('u2-1', 'u2|la famille', 14, true);
  soll('Wort: Stufe 5 am Tag 14', wort.aus, ['0:1 bedeutung', '1:2 hoeren', '3:3 legen', '7:4 schreiben', '14:5 schreiben']);
  soll('reif: fällig in 21 Tagen', [wort.k.st, wort.k.faellig, wort.k.fest, wort.k.zuletzt], [5, Lernen.tagPlus(HEUTE, 35), 0, 'rrrrr']);
  soll('reife Karte: bestätigt nach 21, 45, 90, 90 Tagen', weg('u2-1', 'u2|la famille', 290, true).aus.slice(5), ['35:5 schreiben', '80:5 schreiben', '170:5 schreiben', '260:5 schreiben']);
  soll('Wort ohne Ton', weg('u2-1', 'u2|la famille', 14, false).aus, ['0:1 bedeutung', '1:2 bedeutung', '3:3 legen', '7:4 schreiben', '14:5 schreiben']);
  soll('Satz: erst nach dem Ohr ordnen, dann nach dem Deutschen, dann bauen', weg('u4-3', 'u4|Pique un raisin.', 14, true).aus,
    ['0:1 bedeutung', '1:2 hoeren', '3:3 ordnen-ton', '7:4 ordnen', '14:5 bauen']);
  soll('lange Form: ordnen, dann schreiben', weg('u4-1', 'u4|la rondelle de concombre', 20, true).aus.map(x => x.split(' ')[1]), ['bedeutung', 'hoeren', 'ordnen', 'schreiben', 'schreiben']);
  // Kein Tag früher: Wer täglich spielt, kann die Leiter nicht abkürzen
  for (const g of ['u1-S', 'u3-3']) {
    const z = zMitZielen([g], { unite: g.slice(0, 2), neuProTag: 12 });
    let heute = HEUTE;
    const erster = new Map();
    for (let t = 0; t < 14; t++) {
      for (let runde = 0; runde < 3; runde++) {
        const plan = Lernen.planen(z, heute, {});
        if (plan.art === 'leer') break;
        spiele(z, plan, heute, () => 'richtig', s => {
          if (s.uebung === 'kennen' && !erster.has(s.kid)) erster.set(s.kid, t);
        });
      }
      for (const [kid, k] of Object.entries(z.karten)) {
        const tage = t - erster.get(kid);
        if (k.st > [1, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4][tage]) melde('«' + kid + '» steht nach ' + tage + ' Tagen schon auf Stufe ' + k.st);
      }
      heute = Lernen.tagPlus(heute, 1);
    }
  }
  return wort.aus.join(', ');
});

/* ---------- 8 · Gespeicherter Stand ---------- */

pruefung(8, 'Gespeicherter Stand: pruefen() übersteht alles und lässt nur Gültiges durch', melde => {
  const soll = (was, ist, erwartet) => {
    if (!gleich(ist, erwartet)) melde(was + ': ' + JSON.stringify(ist) + ' statt ' + JSON.stringify(erwartet));
  };
  const frisch = { v: 1, vorgestellt: false, gehoert: false, unite: null, ziele: {}, neuProTag: 6, erklaert: {}, tag: { datum: '', neu: 0, runden: 0, frei: [] }, karten: {},
    zaehler: { runden: 0, perfekt: 0, ohr: 0, lelaLauf: 0, lelaBest: 0, akzent: 0, saetze: 0, geschrieben: 0 } };
  soll('neu()', Lernen.neu(), frisch);
  if (Lernen.neu() === Lernen.neu() || Lernen.neu().karten === Lernen.neu().karten) melde('neu() gibt dasselbe Objekt zweimal');
  // Ist das ein Stand, wie ihn 9.9 beschreibt?
  const DATUM = /^\d{4}-\d{2}-\d{2}$/;
  const zahl = x => Number.isInteger(x) && x >= 0;
  const gueltig = z => gleich(Object.keys(z), Object.keys(frisch)) && z.v === 1 && typeof z.vorgestellt === 'boolean' && typeof z.gehoert === 'boolean'
    && (z.unite === null || V.UNITE_REIHE.includes(z.unite)) && Object.entries(z.ziele).every(([g, an]) => V.LERNZIELE[g] && an === true)
    && K.NEU_WAHL.includes(z.neuProTag) && Object.entries(z.erklaert).every(([u, an]) => K.UEBUNGEN.includes(u) && an === true)
    && gleich(Object.keys(z.tag), ['datum', 'neu', 'runden', 'frei']) && (z.tag.datum === '' || DATUM.test(z.tag.datum)) && zahl(z.tag.neu) && zahl(z.tag.runden)
    && Array.isArray(z.tag.frei) && z.tag.frei.every(kid => KARTE[kid]) && new Set(z.tag.frei).size === z.tag.frei.length
    && gleich(Object.keys(z.zaehler), Object.keys(frisch.zaehler)) && Object.values(z.zaehler).every(zahl)
    && Object.entries(z.karten).every(([kid, k]) => KARTE[kid] && gleich(Object.keys(k), Object.keys(stand())) && Number.isInteger(k.st) && k.st >= 0 && k.st <= 5
      && [k.faellig, k.auf, k.ab].every(d => d === '' || DATUM.test(d)) && typeof k.rueck === 'boolean' && KARTE[kid].teile[k.teil] && KARTE[kid].teile[k.teil].fr[k.form]
      && [k.fest, k.gesehen, k.richtig, k.falsch].every(zahl) && k.gesehen > 0 && gleich(Object.keys(k.schwach), ['genus', 'akzent', 'hoeren'])
      && Object.values(k.schwach).every(n => Number.isInteger(n) && n >= 0 && n <= 3) && /^[raf]{0,5}$/.test(k.zuletzt));

  // Unlesbares und fremde Versionen: ein frischer Stand
  const wirft = { get v() { throw new Error('kaputt'); } };
  const kaputteKarte = { v: 1, karten: { 'u1|le livre': { get st() { throw new Error('kaputt'); } } } };
  const gut = { vorgestellt: true, gehoert: true, unite: 'u1', ziele: { 'u1-S': true }, neuProTag: 9, karten: { 'u1|le livre': { st: 3, gesehen: 4 } } };
  for (const roh of [null, undefined, 0, 42, NaN, '', 'x', '{"v":1}', true, [], [1, 2], [{ v: 1 }], {}, { v: 2 }, { v: '1' }, { v: null }, () => 1, Symbol('x'), new Date(0), wirft, kaputteKarte,
    gut, { ...gut, v: 2 }, { ...gut, v: 0 }, { ...gut, v: '1' }, [{ ...gut, v: 1 }], JSON.stringify({ ...gut, v: 1 })]) {
    let z = null;
    try {
      z = Lernen.pruefen(roh);
    } catch (err) {
      melde('pruefen wirft bei ' + String(roh && typeof roh === 'object' ? JSON.stringify(Object.keys(roh)) : String(roh)));
      continue;
    }
    if (!gleich(z, frisch)) melde('pruefen gibt keinen frischen Stand für ' + (typeof roh === 'symbol' ? 'Symbol' : typeof roh === 'object' ? 'Objekt ' + Object.keys(roh || {}) : String(roh)));
  }

  soll('dieselben Felder mit v: 1 werden gelesen', [Lernen.pruefen({ ...gut, v: 1 }).unite, Lernen.pruefen({ ...gut, v: 1 }).karten['u1|le livre'].st], ['u1', 3]);

  // Falsche Typen, unbekannte Schlüssel, Werte ausserhalb: Feld für Feld
  const roh = {
    v: 1, vorgestellt: 'ja', gehoert: true, unite: 'u9', neuProTag: 7, fremd: { a: 1 }, __proto__: { geerbt: true },
    ziele: { 'u1-S': true, 'u1-2': 'true', 'u9-1': true, 'u2-1': 1, constructor: true, 'u3-1': false, 'u4-S': true },
    erklaert: { legen: true, tanzen: true, schreiben: 1, paare: true, toString: true },
    tag: { datum: '13.11.2026', neu: -2, runden: 2.9, frei: ['u1|le livre', 'u1|le livre', 'gibt es nicht', 7, null, 'u1|la règle'], mehr: 1 },
    zaehler: { runden: 3, perfekt: '1', ohr: Infinity, lelaLauf: NaN, lelaBest: -4, akzent: 2.7, saetze: null, geschrieben: 1e21, fremd: 9 },
    karten: {
      'u1|le livre': { st: 3, faellig: '2026-11-20', auf: '2026-11-13', ab: 'gestern', rueck: 1, teil: 5, form: 2, fest: 2, gesehen: 9, richtig: 7, falsch: 2,
        schwach: { genus: 5, akzent: -1, hoeren: 1.5, fremd: 2 }, zuletzt: 'rrfar', fremd: true },
      'u1|la règle': { st: 9, gesehen: 4, zuletzt: 'rrrrrr', schwach: 'viel', faellig: 20261120 },
      'u1|le classeur': { st: -1, gesehen: 2, zuletzt: 'xyz', teil: -3, form: 1.5 },
      'u1|le cahier': { st: 2.6, gesehen: 0, rueck: true, schwach: [3, 3, 3] },
      'u1|le crayon': { st: 0, gesehen: 0 },
      'u1|le stylo': 'reif',
      'u1|la gomme': null,
      'u1|la trousse': [],
      'u1|les maths, les mathématiques (f pl)': { st: 4, gesehen: 5, teil: 0, form: 1 },
      'u4|les yeux (m pl), un œil': { st: 2, gesehen: 3, teil: 1, form: 0 },
      'u4|Prends la pâte bleue/verte/rouge.': { st: 2, gesehen: 3, teil: 7, form: 3 },
      'u3|la fille': { st: 5, gesehen: 9 },
      'u9|gibt es nicht': { st: 5, gesehen: 9 },
      constructor: { st: 5, gesehen: 9 },
    },
  };
  const eingefroren = JSON.stringify(roh);
  const z = Lernen.pruefen(roh);
  soll('pruefen ändert das Gelesene nicht', JSON.stringify(roh), eingefroren);
  if (!gueltig(z)) melde('pruefen lässt Ungültiges durch: ' + JSON.stringify(z));
  soll('Wahrheitswerte nur als solche', [z.vorgestellt, z.gehoert], [false, true]);
  soll('unite, neuProTag', [z.unite, z.neuProTag], [null, 6]);
  soll('ziele: nur bekannte Lernziele, nur true', z.ziele, { 'u1-S': true, 'u4-S': true });
  soll('erklaert: nur Übungen, nur true', z.erklaert, { legen: true, paare: true });
  soll('tag', z.tag, { datum: '', neu: 0, runden: 2, frei: ['u1|le livre', 'u1|la règle'] });
  soll('zaehler', z.zaehler, { runden: 3, perfekt: 0, ohr: 0, lelaLauf: 0, lelaBest: 0, akzent: 2, saetze: 0, geschrieben: 1e21 });
  soll('unbekannte Schlüssel fallen weg', [Object.keys(z).includes('fremd'), z.geerbt, Object.keys(z.karten).sort()],
    [false, undefined, ['u1|la règle', 'u1|le cahier', 'u1|le classeur', 'u1|le livre', 'u1|les maths, les mathématiques (f pl)', 'u4|Prends la pâte bleue/verte/rouge.', 'u4|les yeux (m pl), un œil']]);
  soll('Karte: Feld für Feld', z.karten['u1|le livre'], { st: 3, faellig: '2026-11-20', auf: '2026-11-13', ab: '', rueck: false, teil: 0, form: 0, fest: 2, gesehen: 9, richtig: 7, falsch: 2,
    schwach: { genus: 3, akzent: 0, hoeren: 1 }, zuletzt: 'rrfar' });
  soll('Karte: Stufe 0 bis 5, ganzzahlig', [z.karten['u1|la règle'].st, z.karten['u1|le classeur'].st, z.karten['u1|le cahier'].st], [5, 0, 2]);
  soll('Karte: zuletzt, schwach, faellig mit falschem Typ', [z.karten['u1|la règle'].zuletzt, z.karten['u1|le classeur'].zuletzt, z.karten['u1|la règle'].schwach, z.karten['u1|le cahier'].schwach,
    z.karten['u1|la règle'].faellig], ['', '', { genus: 0, akzent: 0, hoeren: 0 }, { genus: 0, akzent: 0, hoeren: 0 }, '']);
  soll('Karte: wer eine Stufe hat, wurde gesehen', [z.karten['u1|le cahier'].gesehen, z.karten['u1|le cahier'].rueck], [1, true]);
  soll('Karte: teil und form bleiben in der Karte', ['u1|le classeur', 'u1|les maths, les mathématiques (f pl)', 'u4|les yeux (m pl), un œil', 'u4|Prends la pâte bleue/verte/rouge.']
    .map(kid => [z.karten[kid].teil, z.karten[kid].form]), [[0, 0], [0, 1], [1, 0], [2, 0]]);
  soll('zweimal geprüft ist einmal geprüft', Lernen.pruefen(z), z);
  if (Lernen.pruefen(z) === z || Lernen.pruefen(z).karten['u1|le livre'] === z.karten['u1|le livre']) melde('pruefen gibt das Gelesene selbst zurück statt einer Kopie');
  soll('gültige Felder kommen durch', (() => {
    const y = Lernen.pruefen({ v: 1, vorgestellt: true, gehoert: true, unite: 'u3', neuProTag: 12, ziele: { 'u3-1': true }, erklaert: { hoeren: true },
      tag: { datum: '2026-11-13', neu: 5, runden: 2, frei: ['u3|danser'] }, karten: {}, zaehler: { runden: 12, perfekt: 3, ohr: 30, lelaLauf: 4, lelaBest: 21, akzent: 20, saetze: 10, geschrieben: 25 } });
    return [y.vorgestellt, y.gehoert, y.unite, y.neuProTag, y.ziele, y.erklaert, y.tag, y.zaehler];
  })(), [true, true, 'u3', 12, { 'u3-1': true }, { hoeren: true }, { datum: '2026-11-13', neu: 5, runden: 2, frei: ['u3|danser'] },
    { runden: 12, perfekt: 3, ohr: 30, lelaLauf: 4, lelaBest: 21, akzent: 20, saetze: 10, geschrieben: 25 }]);

  // Müll in jeder Tiefe: nie ein Wurf, immer ein gültiger Stand, mit dem sich planen und zählen lässt
  const rnd = zufallAb(808);
  const eins = liste => liste[Math.floor(rnd() * liste.length)];
  const WERTE = [null, undefined, true, false, 0, 1, 2, 3, 5, 6, 9, 12, -1, 2.5, 1e9, NaN, Infinity, '', 'x', 'u1', 'u3', '2026-11-13', '2026-11-20', '2026-13-45', 'rrf', 'rrrrrrrr',
    'u1|le livre', 'u1-S', [], {}, ['u1|le livre', 'x', 3], { genus: 2, akzent: 9, hoeren: 'x' }, { a: { b: { c: 1 } } }];
  const mitFeldern = (felder, voll) => {
    const o = {};
    for (const f of felder) if (rnd() < voll) o[f] = eins(WERTE);
    return o;
  };
  const muell = () => {
    const kids = [...Array.from({ length: Math.floor(rnd() * 6) }, () => eins(KARTEN).kid), ...(rnd() < 0.3 ? ['x', 'constructor', 'u3|la fille'] : [])];
    const x = mitFeldern(Object.keys(frisch), 0.5);
    if (rnd() < 0.7) x.ziele = Object.fromEntries([...V.LERNZIEL_REIHE.filter(() => rnd() < 0.2), 'u9-1'].map(g => [g, rnd() < 0.8 ? true : eins(WERTE)]));
    if (rnd() < 0.7) x.karten = Object.fromEntries(kids.map(kid => [kid, rnd() < 0.85 ? { gesehen: eins([1, 3, 7, 0]), st: eins([0, 1, 2, 3, 4, 5, 6]), ...mitFeldern(Object.keys(stand()), 0.6) } : eins(WERTE)]));
    if (rnd() < 0.5) x.tag = mitFeldern(Object.keys(frisch.tag), 0.8);
    if (rnd() < 0.5) x.zaehler = mitFeldern(Object.keys(frisch.zaehler), 0.8);
    if (rnd() < 0.3) x.erklaert = mitFeldern([...K.UEBUNGEN, 'x'], 0.4);
    x.v = rnd() < 0.95 ? 1 : eins(WERTE);
    return rnd() < 0.03 ? eins(WERTE) : x;
  };
  let lesbar = 0;
  for (let lauf = 0; lauf < 3000; lauf++) {
    const x = muell();
    try {
      const y = Lernen.pruefen(x);
      if (!gueltig(y)) melde('Müll ' + lauf + ': ungültiger Stand ' + JSON.stringify(y).slice(0, 300));
      if (Object.keys(y.karten).length || Object.keys(y.ziele).length) lesbar++;
      const plan = Lernen.planen(y, HEUTE, { modus: lauf % 3 ? 'runde' : 'frei' });
      Lernen.zahlen(y, HEUTE);
      for (const s of plan.schritte) Lernen.verbuchen(y, s, { art: eins(['richtig', 'fast', 'falsch', 'ohne']) }, HEUTE);
      if (!gueltig(y)) melde('Müll ' + lauf + ': nach einer Runde ungültig');
    } catch (err) {
      melde('Müll ' + lauf + ' wirft: ' + err.message + ' bei ' + JSON.stringify(x).slice(0, 200));
    }
  }
  if (lesbar < 1000) melde('der Müll enthält zu selten etwas Lesbares (' + lesbar + ')');
  return '3000-mal Müll, davon ' + lesbar + '-mal mit lesbaren Karten oder Lernzielen';
});

/* ---------- 9 · Texte, Aufnahmen, Zähler ---------- */

pruefung(9, 'Texte und Zähler: Aufnahmen ohne doppelte Datei, Listen wie im Bauplan, Zähler für die Erfolge', melde => {
  const soll = (was, ist, erwartet) => {
    if (!gleich(ist, erwartet)) melde(was + ': ' + JSON.stringify(ist) + ' statt ' + JSON.stringify(erwartet));
  };
  const hinweis = [];

  /* Die Zähler aus 9.5: je eine Aufgabe von jeder Sorte */
  const chaise = E('u1|la chaise'), regle = E('u1|la règle'), satz = E('u4|Pique un raisin.'), lang = E('u4|la rondelle de concombre');
  const nachEiner = (e, uebung, art, mehr) => {
    const z = mitKarten(zMitZielen(V.LERNZIEL_REIHE), { [e.kid]: { st: 3 } });
    Lernen.verbuchen(z, schritt(e, uebung, { rolle: 'neben', ...mehr }), { art, fehler: [] }, HEUTE);
    return Object.entries(z.zaehler).filter(([, n]) => n).map(([name, n]) => name + ' ' + n).join(', ');
  };
  // [Eintrag, Übung, mehr] → was «richtig» zählt; «fast» und «falsch» zählen nie
  const ZAEHLT = [
    [chaise, 'bedeutung', {}, ''], [chaise, 'hoeren', {}, 'ohr 1'], [chaise, 'finden', {}, ''], [chaise, 'lauschen', {}, 'ohr 1'],
    [chaise, 'artikel', {}, 'lelaLauf 1, lelaBest 1'], [regle, 'akzent', {}, 'akzent 1'], [chaise, 'legen', {}, ''],
    [chaise, 'schreiben', { vorgabe: 'de' }, 'geschrieben 1'], [chaise, 'schreiben', { vorgabe: 'ton' }, 'ohr 1, geschrieben 1'],
    [satz, 'luecke', {}, ''], [satz, 'ordnen', { vorgabe: 'ton' }, 'saetze 1'], [satz, 'ordnen', { vorgabe: 'de' }, 'saetze 1'], [satz, 'bauen', {}, 'saetze 1'],
    [lang, 'ordnen', {}, ''], [satz, 'hoeren', {}, 'ohr 1'], [satz, 'legen', {}, ''],
  ];
  for (const [e, uebung, mehr, erwartet] of ZAEHLT) {
    const wo = 'Zähler nach ' + uebung + (mehr.vorgabe ? '/' + mehr.vorgabe : '') + ' «' + e.id + '»';
    soll(wo + ' richtig', nachEiner(e, uebung, 'richtig', mehr), erwartet);
    for (const rolle of ['leit', 'check', 'fuell', 'wdh']) soll(wo + ' richtig als ' + rolle, nachEiner(e, uebung, 'richtig', { ...mehr, rolle }), erwartet);
    soll(wo + ' richtig im freien Üben', nachEiner(e, uebung, 'richtig', { ...mehr, rolle: 'fuell', frei: true }), erwartet);
    if (!K.WAHL.includes(uebung)) soll(wo + ' fast', nachEiner(e, uebung, 'fast', mehr), '');
    soll(wo + ' falsch', nachEiner(e, uebung, 'falsch', mehr), '');
  }
  for (const uebung of ['kennen', 'echo']) soll('Zähler nach ' + uebung, nachEiner(chaise, uebung, 'ohne', { rolle: uebung }), '');
  // Artikel in Folge: ein Fehler beginnt von vorn, der beste Lauf bleibt
  const z = mitKarten(zMitZielen(V.LERNZIEL_REIHE), { [chaise.kid]: { st: 3 }, [regle.kid]: { st: 3 } });
  const lauf = [];
  for (const art of ['richtig', 'richtig', 'richtig', 'falsch', 'richtig', 'richtig']) {
    Lernen.verbuchen(z, schritt(lauf.length % 2 ? regle : chaise, 'artikel', { rolle: 'neben' }), { art }, HEUTE);
    lauf.push(z.zaehler.lelaLauf + '/' + z.zaehler.lelaBest);
  }
  soll('Artikel in Folge', lauf, ['1/1', '2/2', '3/3', '0/3', '1/3', '2/3']);
  Lernen.verbuchen(z, schritt(chaise, 'schreiben', { rolle: 'leit' }), { art: 'falsch' }, HEUTE);
  soll('andere Übungen unterbrechen die Folge nicht', z.zaehler.lelaLauf, 2);
  // Runden: nur modus 'runde', nur bis zur Ernte gespielt mit mindestens vier beurteilten Aufgaben
  const runden = [];
  for (const bilanz of [{ modus: 'runde', falsch: 0, geurteilt: 12 }, { modus: 'runde', falsch: 2, geurteilt: 14 }, { modus: 'runde', falsch: 0, geurteilt: 3 },
    { modus: 'frei', falsch: 0, geurteilt: 12 }, { modus: 'runde', falsch: 0, geurteilt: 4 }, null]) {
    const r = Lernen.rundeFertig(z, bilanz, HEUTE);
    runden.push([z.zaehler.runden, z.zaehler.perfekt, z.tag.runden, r.zaehlt, r.perfekt].join(' '));
  }
  soll('rundeFertig', runden, ['1 1 1 true true', '2 1 2 true false', '2 1 3 false false', '2 1 3 false false', '3 2 4 true true', '3 2 4 false false']);
  Lernen.rundeFertig(z, { modus: 'runde', falsch: 0, geurteilt: 9 }, Lernen.tagPlus(HEUTE, 1));
  soll('rundeFertig am nächsten Tag', [z.zaehler.runden, z.tag], [4, { datum: Lernen.tagPlus(HEUTE, 1), neu: 0, runden: 1, frei: [] }]);
  // Tageskontingent und freies Üben
  const y = zMitZielen(['u1-S']);
  const kennen = schritt(chaise, 'kennen', { rolle: 'kennen', neu: true });
  Lernen.verbuchen(y, kennen, { art: 'ohne' }, HEUTE);
  Lernen.verbuchen(y, kennen, { art: 'ohne' }, HEUTE);
  Lernen.verbuchen(y, schritt(regle, 'kennen', { rolle: 'kennen', neu: false }), { art: 'ohne' }, HEUTE);
  Lernen.verbuchen(y, schritt(regle, 'bedeutung', { rolle: 'check', check: 'a', frei: true }), { art: 'richtig' }, HEUTE);
  Lernen.verbuchen(y, schritt(regle, 'finden', { rolle: 'check', check: 'b', frei: true }), { art: 'falsch' }, HEUTE);
  Lernen.verbuchen(y, schritt(chaise, 'bedeutung', { rolle: 'check', check: 'a' }), { art: 'richtig' }, HEUTE);
  soll('tag.neu zählt das erste kennen mit neu, tag.frei die frei geübten Karten', y.tag, { datum: HEUTE, neu: 1, runden: 0, frei: [regle.kid] });
  soll('Äpfel im freien Üben', [Lernen.aepfel(schritt(regle, 'finden', { rolle: 'check', check: 'b', frei: true }), { art: 'richtig' }),
    Lernen.aepfel(schritt(regle, 'schreiben', { rolle: 'fuell', frei: true }), { art: 'richtig' }), Lernen.aepfel(schritt(regle, 'schreiben', { rolle: 'fuell', frei: true }), { art: 'falsch' })], [1, 1, 0]);

  /* Texte und Aufnahmen: nur wenn die Dateien da sind */
  let T = null, F = null;
  try {
    T = require('./texte.js');
    F = require('./franz-texte.js');
    T.setFakten(require('./fakten.js').FAKTEN);
  } catch (err) {
    if (err.code !== 'MODULE_NOT_FOUND') throw err;
    return 'Zähler geprüft; texte.js oder franz-texte.js fehlt, Texte nicht geprüft';
  }
  // Keine zwei Aufnahmen mit derselben Datei
  const dateien = new Map();
  const clips = [...T.alleSaetze().map(x => ({ s: x.s, v: 'p' })), ...F.alleFranzClips()];
  for (const c of clips) {
    const datei = T.clipDatei(c), wie = c.v + ' ' + c.s.normalize('NFC');
    if (dateien.has(datei) && dateien.get(datei) !== wie) melde('zwei Aufnahmen, eine Datei ' + datei + ': «' + dateien.get(datei) + '» und «' + wie + '»');
    dateien.set(datei, wie);
  }
  soll('Stimmen der Aufnahmen', [...new Set(clips.map(c => c.v))].sort(), ['f', 'fl', 'hd', 'hf', 'p']);
  soll('Vokabel-Aufnahmen', F.alleFranzClips().filter(c => c.v === 'f' || c.v === 'fl').length, 545);
  hinweis.push(dateien.size + ' Aufnahmen ohne doppelte Datei');

  // Jede Liste aus 5.3 mit ihrer Zeilenzahl, dazu h_tipp_akzent_zeichen (kam nach dem Bauplan: kürzerer Hinweis)
  const H = { h_vorstellen: 2, h_vorstellen_kurz: 1, h_gruss: 8, h_gruss_faellig: 5, h_lichtung: 5, h_unite_frage: 1, h_unite_u1: 1, h_unite_u2: 1, h_unite_u3: 1, h_unite_u4: 1,
    h_keine_auswahl: 2, h_start_neu: 5, h_start_wdh: 5, h_start_gemischt: 5, h_start_frei: 3, h_kennen: 6, h_kennen_satz: 4, h_sag: 4, h_jetzt_du: 3, h_gesagt: 4, h_kontrast: 3,
    h_richtig: 24, h_richtig_nachfehler: 6, h_richtig_schreiben: 6, h_richtig_satz: 5, h_auch: 3, h_andere_form: 3, h_es_heisst: 6, h_bedeutet: 4, h_ohne_clip: 4, h_falsch_hoeren: 4,
    h_tipp_akzent: 4, h_tipp_ligatur: 2, h_tipp_artikel_fehlt: 4, h_tipp_genus: 4, h_tipp_elision: 3, h_tipp_artikel_ganz: 2, h_tipp_zeichen: 3, h_tipp_akzent_zeichen: 2, h_tipp_buchstabe: 4, h_tipp_legen: 4,
    h_tipp_verwechselt: 3, h_tipp_andere_form: 2, h_tipp_reihenfolge: 4, h_tipp_anders: 4, h_loesung: 5, h_nachgebaut: 4, h_wieder: 4, h_hoch: 5, h_frucht: 4, h_reif: 5,
    h_paare: 3, h_paare_fertig: 3, h_ende: 6, h_ende_perfekt: 4, h_ende_muehsam: 4, h_nichts_faellig: 4, h_naechstes: 3, h_alles_reif: 2, h_warten: 5, h_kitzeln: 8, h_wort_vor: 3,
    h_album: 3, h_anziehen: 5, h_ausziehen: 2, h_zu_teuer: 2, h_stimme_an: 1 };
  // Jede Übung ausser dem Kennenlernen wird beim ersten Mal erklärt
  for (const u of K.UEBUNGEN) if (u !== 'kennen') H['h_erklaer_' + u] = 1;
  const P = { p_besuch: 2, p_fr_start: 4, p_rat_richtig: 4, p_rat_falsch: 4, p_rat_beide: 4, p_rat_glueck: 3, p_staunt: 5, p_fakt_franz: 3, p_lichtung_zwei: 4 };
  const zeilen = (name, pool, erwartet) => {
    for (const [liste, n] of Object.entries(erwartet)) {
      if (!Array.isArray(pool[liste])) melde(name + '.' + liste + ' fehlt');
      else if (pool[liste].length !== n) melde(name + '.' + liste + ': ' + pool[liste].length + ' Zeilen statt ' + n);
    }
    for (const liste of Object.keys(pool)) {
      if (!(liste in erwartet) && liste !== 'h_name_witz') melde(name + '.' + liste + ' steht nicht im Bauplan');
      if (!Array.isArray(pool[liste]) || pool[liste].some(e => !(typeof e === 'string' ? e : e && e.t && e.s))) melde(name + '.' + liste + ': Zeile ohne Text');
    }
  };
  zeilen('HTEXTE', F.HTEXTE, H);
  zeilen('PTEXTE', F.PTEXTE, P);
  // Die eine Zeile, die mit dem Namen spielt, darf fehlen
  const witz = F.HTEXTE.h_name_witz;
  if (!Array.isArray(witz) || witz.length > 1) melde('HTEXTE.h_name_witz: keine oder eine Zeile');
  const summe = pool => Object.values(pool).reduce((n, liste) => n + liste.length, 0);
  soll('HTEXTE: 81 Listen, 278 Zeilen und der Namenswitz', [Object.keys(F.HTEXTE).length, summe(F.HTEXTE) - (witz || []).length], [81, 278]);
  soll('PTEXTE: 9 Listen, 33 Zeilen', [Object.keys(F.PTEXTE).length, summe(F.PTEXTE)], [9, 33]);
  // Merkhilfen und Wortmomente gehören zu Einträgen, die es gibt
  const ids = new Set(VOKABELN.map(e => e.id));
  for (const [name, liste] of [['MERKHILFEN', F.MERKHILFEN], ['WORTMOMENTE', F.WORTMOMENTE]]) {
    for (const id of Object.keys(liste)) if (!ids.has(id)) melde(name + ' nennt einen unbekannten Eintrag: ' + id);
  }
  soll('Merkhilfen und Wortmomente', [Object.keys(F.MERKHILFEN).length, Object.keys(F.WORTMOMENTE).length], [9, 10]);
  hinweis.push(summe(F.HTEXTE) + ' Zeilen von ihr, ' + summe(F.PTEXTE) + ' von Pieks');
  return hinweis.join('; ');
});

/* ---------- Lauf ---------- */

let fehler = 0;
for (const p of pruefungen.sort((a, b) => a.nr - b.nr)) {
  Lernen.zufall = zufallAb(p.nr * 1000 + 7);
  const liste = [];
  let hinweis = '';
  try {
    hinweis = p.lauf(text => liste.push(text)) || '';
  } catch (err) {
    liste.push('bricht ab: ' + ((err && err.stack) || err));
  }
  console.log((liste.length ? '✗ ' : '✓ ') + p.nr + ' · ' + p.name + (hinweis ? '  (' + hinweis + ')' : ''));
  for (const text of liste.slice(0, 25)) console.log('      ' + text);
  if (liste.length > 25) console.log('      … und ' + (liste.length - 25) + ' weitere');
  fehler += liste.length;
}
console.log(fehler ? '\n' + fehler + ' Fehler' : '\nAlles stimmt.');
process.exit(fehler ? 1 : 0);
