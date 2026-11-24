'use strict';

/* =====================================================================
   UHR: Inhalte der Uhr-Ecke und alles, was Capy dort sagt.
   Die Ecke selbst steht in uhr.js, das Aussehen in uhr.css.

   Gesprochen wird mit Capys Stimme (wie texte.js). Ein Eintrag ist ein
   Text oder { t: 'angezeigt', s: 'gesprochen' }. Schweizer Schreibweise
   (ss), die Stimme bekommt ß über sprechtext() aus texte.js.

   Zeiten sind Minuten seit Mitternacht: 0 … 1439. Auf der Zeigeruhr
   zählt nur der Rest von 720 (zwölf Stunden).
   ===================================================================== */

// Capys Hilfsfunktionen aus texte.js: im Browser schon geladen, in Node von dort holen
const UHR_TX = typeof kennung === 'undefined' ? require('./texte.js') : { sprechtext, kennung, zahlwort, anzeigetext };

/* ---------- Zeiten in Worten ---------- */
// Stunde im Satz («Viertel nach eins», «halb zwölf»); Index ist die Stunde mod 12
const UHR_STUNDE = ['zwölf', 'eins', 'zwei', 'drei', 'vier', 'fünf', 'sechs', 'sieben', 'acht', 'neun', 'zehn', 'elf'];
// Die Zahlen auf dem Zifferblatt als Hauptwort («auf die Drei»)
const UHR_ZAHL = ['Zwölf', 'Eins', 'Zwei', 'Drei', 'Vier', 'Fünf', 'Sechs', 'Sieben', 'Acht', 'Neun', 'Zehn', 'Elf'];
const uhrNorm = t => ((Math.round(t) % 1440) + 1440) % 1440;

// So sagt man eine Zeit auf der Zeigeruhr, in Fünf-Minuten-Schritten
// (sonst null). «zwanzig nach», «fünf vor halb», wie man es in der Schule lernt.
function uhrZeitwort(t) {
  t = uhrNorm(t) % 720;
  const h = Math.floor(t / 60), m = t % 60;
  const jetzt = UHR_STUNDE[h % 12], dann = UHR_STUNDE[(h + 1) % 12];
  return {
    0: (h % 12 === 1 ? 'ein' : jetzt) + ' Uhr',
    5: 'fünf nach ' + jetzt, 10: 'zehn nach ' + jetzt, 15: 'Viertel nach ' + jetzt, 20: 'zwanzig nach ' + jetzt,
    25: 'fünf vor halb ' + dann, 30: 'halb ' + dann, 35: 'fünf nach halb ' + dann,
    40: 'zwanzig vor ' + dann, 45: 'Viertel vor ' + dann, 50: 'zehn vor ' + dann, 55: 'fünf vor ' + dann,
  }[m] || null;
}

// Welche Art von Zeit: volle, halbe, Viertel, fünf Minuten …
const UHR_ARTEN = { voll: [0], halb: [30], vnach: [15], vvor: [45], nach: [5, 10, 20], vor: [40, 50, 55], umhalb: [25, 35] };
function uhrArt(t) {
  const m = uhrNorm(t) % 60;
  for (const [k, ms] of Object.entries(UHR_ARTEN)) if (ms.includes(m)) return k;
  return 'minute';
}

// Ganze Sätze, je einer pro Fünf-Minuten-Zeit (144 Stück)
const uhrEsIst = t => 'Es ist ' + uhrZeitwort(t) + '.';
const uhrStell = t => 'Stell die Uhr auf ' + uhrZeitwort(t) + '!';

// Digitaluhr: «15:30», gesprochen «fünfzehn Uhr» + «dreissig» (Zahl aus texte.js)
const uhrDigital = t => { t = uhrNorm(t); return Math.floor(t / 60) + ':' + String(t % 60).padStart(2, '0'); };
const uhrDigitalStunde = h => (h === 1 ? 'ein' : UHR_TX.zahlwort(h)) + ' Uhr';
function uhrDigitalTeile(t) {
  t = uhrNorm(t);
  const h = Math.floor(t / 60), m = t % 60;
  return m ? [uhrDigitalStunde(h), UHR_TX.zahlwort(m)] : [uhrDigitalStunde(h)];
}

// Tipps, wo die Zeiger hingehören
const uhrLangSatz = z => 'Der lange Zeiger gehört auf die ' + UHR_ZAHL[z % 12] + '.';
function uhrKurzSatz(t) {
  t = uhrNorm(t) % 720;
  const h = Math.floor(t / 60) % 12;
  return t % 60 === 0
    ? 'Der kurze Zeiger gehört auf die ' + UHR_ZAHL[h] + '.'
    : 'Der kurze Zeiger gehört zwischen die ' + UHR_ZAHL[h] + ' und die ' + UHR_ZAHL[(h + 1) % 12] + '.';
}
// Was eine Zahl für den langen Zeiger heisst: «Die Sechs heisst 30 Minuten.»
const uhrMinutenSatz = z => ({
  t: 'Die ' + UHR_ZAHL[z % 12] + ' heisst ' + (z % 12) * 5 + ' Minuten.',
  s: 'Die ' + UHR_ZAHL[z % 12] + ' heisst ' + UHR_TX.zahlwort((z % 12) * 5) + ' Minuten.',
});

/* ---------- Tageszeiten (für die Digitaluhr mit 24 Stunden) ---------- */
const UHR_TAGESZEITEN = [
  { id: 'nacht', von: 0, bis: 5, name: 'in der Nacht', satz: 'Es ist Nacht.' },
  { id: 'morgen', von: 5, bis: 9, name: 'am Morgen', satz: 'Es ist Morgen.' },
  { id: 'vormittag', von: 9, bis: 12, name: 'am Vormittag', satz: 'Es ist Vormittag.' },
  { id: 'mittag', von: 12, bis: 13, name: 'am Mittag', satz: 'Es ist Mittag.' },
  { id: 'nachmittag', von: 13, bis: 18, name: 'am Nachmittag', satz: 'Es ist Nachmittag.' },
  { id: 'abend', von: 18, bis: 22, name: 'am Abend', satz: 'Es ist Abend.' },
  { id: 'nacht', von: 22, bis: 24, name: 'in der Nacht', satz: 'Es ist Nacht.' },
];
const uhrTageszeit = t => { const h = uhrNorm(t) / 60; return UHR_TAGESZEITEN.find(z => h >= z.von && h < z.bis); };

// Capys Tag: kleine Geschichten zu den Zeiten (zeit: Bereiche in Minuten seit Mitternacht)
const UHR_SZENEN = [
  { bild: '🌅', t: 'Am Morgen wacht Capy auf und streckt sich.', zeit: [[6 * 60, 7 * 60 + 30]] },
  { bild: '🍊', t: 'Am Morgen frühstückt Capy Mandarinen.', zeit: [[6 * 60 + 30, 8 * 60 + 30]] },
  { bild: '🎒', t: 'Am Morgen geht das Capybara-Baby in die Schule.', zeit: [[7 * 60 + 15, 8 * 60 + 15]] },
  { bild: '🏊', t: 'Am Vormittag schwimmt Capy im Fluss.', zeit: [[9 * 60, 11 * 60 + 30]] },
  { bild: '🌿', t: 'Am Mittag isst Capy frisches Gras.', zeit: [[12 * 60, 12 * 60 + 45]] },
  { bild: '⚽', t: 'Am Nachmittag spielt Capy mit dem Capybara-Baby.', zeit: [[13 * 60 + 30, 16 * 60 + 30]] },
  { bild: '🛁', t: 'Am Nachmittag badet Capy mit Yuzus.', zeit: [[15 * 60, 17 * 60 + 45]] },
  { bild: '🥕', t: 'Am Abend isst Capy Karotten.', zeit: [[18 * 60, 19 * 60 + 15]] },
  { bild: '📖', t: 'Am Abend hört Capy eine Geschichte.', zeit: [[19 * 60, 20 * 60 + 30]] },
  { bild: '😴', t: 'Am Abend geht Capy schlafen.', zeit: [[20 * 60, 21 * 60 + 45]] },
  { bild: '🌙', t: 'In der Nacht schläft Capy tief und fest.', zeit: [[22 * 60, 24 * 60], [0, 4 * 60 + 45]] },
  { bild: '🦉', t: 'In der Nacht ruft die Eule. Capy schläft.', zeit: [[22 * 60 + 30, 24 * 60], [0, 4 * 60]] },
];

/* =====================================================================
   STATIONEN
   Zuerst die Zeigeruhr (1–8), dann die Digitaluhr (9–12).
     arten   welche Zeiten neu dran sind · wdh: was dazwischen wiederholt wird
     schritt so fein lassen sich die Zeiger stellen (Minuten)
     hilfen  was das Zifferblatt zeigt: kuchen (vergangene Minuten), seiten
             (rechts nach, links vor), minuten (lila Minutenzahlen)
     typen   die Aufgaben der Runde · paare: Abschluss mit Paaren
     lern    Erklärung am Anfang: was Capy sagt, und was die Uhr dazu zeigt
             (demo, siehe uhr.js)
     zeige   Zeit für das Bild auf der Karte
   ===================================================================== */
const UHR_ANALOG_TYPEN = ['lesen', 'stellen', 'lesen', 'stellen', 'hoeren', 'lesen', 'stellen', 'lesen', 'stellen'];
const UHR_STATIONEN = [
  {
    nr: 1, titel: 'Volle Stunden', zeige: 3 * 60, arten: ['voll'], schritt: 60, hilfen: [],
    typen: UHR_ANALOG_TYPEN, paare: 'paare-wort',
    lern: [
      { demo: 'zeiger', t: 'Das ist meine Kuckucksuhr! Sie hat zwei Zeiger: einen kurzen und einen langen.' },
      { demo: 'kurz', t: 'Der kurze Zeiger ist blau. Er zeigt die Stunden, so wie die blauen Zahlen.' },
      { demo: 'lang', t: 'Der lange Zeiger ist lila. Er zeigt die Minuten und läuft viel schneller.' },
      { demo: 'rundum', t: 'Geht der lange Zeiger einmal ganz herum, ist eine Stunde vorbei. Der kurze Zeiger rückt dann eine Zahl weiter.' },
      { demo: 'voll', t: 'Steht der lange Zeiger ganz oben, ist es eine volle Stunde. Der kurze Zeiger zeigt auf die Drei: Es ist drei Uhr.' },
    ],
  },
  {
    nr: 2, titel: 'Halbe Stunden', zeige: 3 * 60 + 30, arten: ['halb'], wdh: ['voll'], schritt: 30, hilfen: ['kuchen'],
    typen: UHR_ANALOG_TYPEN, paare: 'paare-wort',
    lern: [
      { demo: 'halb', t: 'Jetzt geht der lange Zeiger nur halb herum, bis ganz nach unten. Dann ist eine halbe Stunde vorbei.' },
      { demo: 'halbkurz', t: 'Schau, der kurze Zeiger ist jetzt halb auf dem Weg zur Vier. Darum sagen wir: halb vier.' },
      { demo: 'halbmerk', t: 'Merk dir: Bei halb denken wir schon an die nächste Stunde.' },
    ],
  },
  {
    nr: 3, titel: 'Viertel nach', zeige: 3 * 60 + 15, arten: ['vnach'], wdh: ['voll', 'halb'], schritt: 15, hilfen: ['kuchen', 'seiten'],
    typen: UHR_ANALOG_TYPEN, paare: 'paare-wort',
    lern: [
      { demo: 'viertel', t: 'Die Uhr ist wie ein Kuchen mit vier Stücken. Jedes Stück ist eine Viertelstunde.' },
      { demo: 'vnach', t: 'Geht der lange Zeiger ein Stück weiter, bis zur Drei, sagen wir: Viertel nach. Hier ist es Viertel nach drei.' },
      { demo: 'nachseite', t: 'Steht der lange Zeiger rechts, sagen wir: nach.' },
    ],
  },
  {
    nr: 4, titel: 'Viertel vor', zeige: 3 * 60 + 45, arten: ['vvor'], wdh: ['vnach', 'halb'], schritt: 15, hilfen: ['kuchen', 'seiten'],
    typen: UHR_ANALOG_TYPEN, paare: 'paare-wort',
    lern: [
      { demo: 'vvor', t: 'Steht der lange Zeiger auf der Neun, fehlt nur noch ein Stück bis oben. Dann sagen wir: Viertel vor.' },
      { demo: 'vorseite', t: 'Hier ist es Viertel vor vier. Gleich ist es vier Uhr! Steht der lange Zeiger links, sagen wir: vor.' },
    ],
  },
  {
    nr: 5, titel: 'Alle Viertel', zeige: 10 * 60 + 15, arten: ['voll', 'halb', 'vnach', 'vvor'], schritt: 15, hilfen: ['seiten'],
    typen: ['lesen', 'stellen', 'hoeren', 'lesen', 'stellen', 'lesen', 'hoeren', 'stellen', 'lesen', 'stellen'], paare: 'paare-wort',
    lern: [{ demo: 'alleviertel', t: 'Jetzt mischen wir alles: volle Stunden, halbe Stunden und Viertel.' }],
  },
  {
    nr: 6, titel: 'Fünf Minuten', zeige: 3 * 60 + 10, arten: ['nach', 'vor'], wdh: ['vnach', 'vvor'], schritt: 5, hilfen: ['minuten', 'seiten'],
    typen: UHR_ANALOG_TYPEN, paare: 'paare-wort',
    lern: [
      { demo: 'fuenf', t: 'Von einer Zahl zur nächsten braucht der lange Zeiger fünf Minuten. Die lila Zahlen zeigen die Minuten.' },
      { demo: 'nach', t: 'Rechts zählen wir nach: fünf nach, zehn nach, Viertel nach, zwanzig nach.' },
      { demo: 'vor', t: 'Links zählen wir vor: zwanzig vor, Viertel vor, zehn vor, fünf vor.' },
    ],
  },
  {
    nr: 7, titel: 'Um halb', zeige: 3 * 60 + 25, arten: ['umhalb'], wdh: ['halb', 'nach', 'vor'], schritt: 5, hilfen: ['minuten', 'kuchen'],
    typen: UHR_ANALOG_TYPEN, paare: 'paare-wort',
    lern: [
      { demo: 'umhalb', t: 'Ganz nah bei halb sagen wir: fünf vor halb und fünf nach halb.' },
      { demo: 'fuenfvorhalb', t: 'Hier ist es fünf vor halb vier. In fünf Minuten ist es halb vier!' },
    ],
  },
  {
    nr: 8, titel: 'Alle Zeiten', zeige: 7 * 60 + 50, arten: ['voll', 'halb', 'vnach', 'vvor', 'nach', 'vor', 'umhalb'], schritt: 5, hilfen: [],
    typen: ['lesen', 'stellen', 'hoeren', 'lesen', 'stellen', 'lesen', 'stellen', 'hoeren', 'lesen', 'stellen'], paare: 'paare-wort',
    lern: [{ demo: 'alle', t: 'Jetzt kommen alle Zeiten durcheinander. Die Hilfen auf der Uhr sind weg, aber die Glühbirne hilft dir. Du schaffst das!' }],
  },
  {
    nr: 9, titel: 'Digitaluhr', digital: true, zeige: 3 * 60 + 30, arten: ['voll', 'halb'], schritt: 30, hilfen: ['minuten'],
    typen: ['d-lesen', 'd-tippen', 'd-stellen', 'd-lesen', 'd-tippen', 'd-stellen', 'd-tippen', 'd-lesen'], paare: 'paare-digital',
    lern: [
      { demo: 'digital', t: 'Das ist eine Digitaluhr. Sie hat keine Zeiger, nur Zahlen.' },
      { demo: 'digitalteile', t: 'Vor dem Doppelpunkt stehen die Stunden, in Blau. Danach kommen die Minuten, in Lila.' },
      { demo: 'digitalhalb', t: 'Drei Uhr dreissig ist das Gleiche wie halb vier. Die Digitaluhr zeigt noch die Drei!' },
    ],
  },
  {
    nr: 10, titel: 'Digital genau', digital: true, zeige: 3 * 60 + 45, arten: ['vnach', 'vvor', 'nach', 'vor', 'umhalb'], wdh: ['halb'],
    schritt: 5, hilfen: ['minuten'],
    typen: ['d-lesen', 'd-tippen', 'd-stellen', 'd-lesen', 'd-tippen', 'd-stellen', 'd-tippen', 'd-lesen', 'd-stellen'], paare: 'paare-digital',
    lern: [
      { demo: 'digitalvnach', t: 'Viertel nach drei heisst auf der Digitaluhr drei Uhr fünfzehn.' },
      { demo: 'digitalvvor', t: 'Viertel vor vier heisst drei Uhr fünfundvierzig. Auch hier zeigt die Digitaluhr noch die Drei!' },
      { demo: 'digitalminuten', t: 'Die lila Zahlen auf der Uhr helfen dir: Sie zeigen die Minuten für die Digitaluhr.' },
    ],
  },
  {
    nr: 11, titel: 'Tag und Nacht', digital: true, tag: true, zeige: 15 * 60 + 30, arten: ['voll', 'halb', 'vnach', 'vvor'], schritt: 15, hilfen: ['minuten'],
    typen: ['tz-wahl', 'tz-tippen', 'tz-lesen', 'tz-stellen', 'tz-wahl', 'tz-tippen', 'tz-lesen', 'tz-tippen', 'tz-stellen'],
    lern: [
      { demo: 'tag', t: 'Ein Tag hat vierundzwanzig Stunden. Um Mitternacht fängt die Digitaluhr bei null an. Der kurze Zeiger geht an einem Tag zweimal ganz herum.' },
      { demo: 'nachmittag', t: 'Nach zwölf Uhr mittags zählt die Digitaluhr weiter: dreizehn, vierzehn, fünfzehn.' },
      { demo: 'plus12', t: 'Ein Trick: Vom Nachmittag bis Mitternacht rechnest du plus zwölf. Drei Uhr am Nachmittag ist fünfzehn Uhr.' },
    ],
  },
  {
    nr: 12, titel: 'Jede Minute', digital: true, zeige: 3 * 60 + 27, arten: ['minute'], schritt: 1, hilfen: ['minuten'],
    typen: ['m-tippen', 'm-stellen', 'm-wahl', 'm-tippen', 'm-stellen', 'm-wahl', 'm-tippen', 'm-stellen'], paare: 'paare-digital',
    lern: [
      { demo: 'striche', t: 'Jeder kleine Strich auf der Uhr ist eine Minute.' },
      { demo: 'minutegenau', t: 'Die Fünf heisst fünfundzwanzig Minuten. Zwei Striche weiter sind es siebenundzwanzig.' },
      { demo: 'minutedigital', t: 'Die Digitaluhr zeigt dann drei Uhr siebenundzwanzig.' },
    ],
  },
];

/* =====================================================================
   WAS CAPY IN DER UHR-ECKE SAGT
   ===================================================================== */
const UHR_TEXTE = {
  // Karte mit den Stationen
  willkommen: ['Hallo Yuna! Lernst du mit mir die Uhr lesen? Ich zeige dir meine Kuckucksuhr.'],
  karte_erste: ['Tipp auf die erste Uhr, dann geht es los!'],
  karte: ['Tick, tack! Was lernen wir heute?', 'Welche Uhr nehmen wir jetzt?', 'Weiter geht\'s mit der Uhr!'],
  // Zurück aus einer Runde oder vom Spielen
  karte_zurueck: ['Was machen wir jetzt?', 'Weiter geht\'s mit der Uhr!'],
  karte_digital: ['Die Zeigeruhr kannst du schon! Jetzt kommt die Digitaluhr.'],
  karte_fertig: ['Du kannst jetzt alle Uhren lesen! Ich bin so stolz auf dich.'],
  gesperrt: ['Diese Uhr kommt später. Zuerst die davor!'],
  ton_aus: ['Mein Ton ist aus. Tipp oben auf den Lautsprecher, damit du mich hörst!'],
  ueben_start: ['Wir üben, was du schon kannst.', 'Eine Runde üben! Mal sehen, was du noch weisst.'],

  // Uhr spielen
  spielen: [{ t: 'Dreh die Zeiger, wie du willst! Tipp auf «Vorlesen», dann sage ich dir die Zeit.',
    s: 'Dreh die Zeiger, wie du willst! Tipp auf Vorlesen, dann sage ich dir die Zeit.' }],
  jetzt_genau: ['Schau, so spät ist es jetzt!'],
  jetzt_ungefaehr: ['Jetzt ist es ungefähr so spät:'],
  digital_zeigt: ['Die Digitaluhr zeigt:'],

  // Aufgaben
  lesen: ['Wie spät ist es?', 'Was zeigt die Uhr?', 'Lies die Uhr! Wie spät ist es?'],
  stellen_erste: [{ t: 'Dreh die Zeiger mit dem Finger. Stimmt die Uhr, tipp auf den Haken ✓.',
    s: 'Dreh die Zeiger mit dem Finger. Stimmt die Uhr, tipp auf den grünen Haken.' }],
  hoeren: ['Hör gut zu! Welche Uhr passt?', 'Welche Uhr ist es? Hör zu!'],
  d_lesen: ['Was zeigt die Digitaluhr? Wie sagt man das?', 'Wie spät ist es auf der Digitaluhr?'],
  d_tippen: ['Wie zeigt die Digitaluhr diese Zeit? Tipp sie ein!', 'Tipp die Zeit für die Digitaluhr ein!'],
  d_stellen: ['Stell die Zeiger so wie die Digitaluhr!', 'Dreh die Zeiger auf die Zeit der Digitaluhr!'],
  tz_wahl: ['Welche Digitaluhr passt?'],
  tz_tippen: ['Was zeigt jetzt die Digitaluhr? Tipp es ein!'],
  tz_lesen: ['Wann ist das? Lies die Digitaluhr!'],
  tz_stellen: ['Stell die Zeiger auf die Zeit der Digitaluhr!'],
  m_tippen: ['Lies die Uhr ganz genau! Tipp die Zeit ein.', 'Zähl die kleinen Striche! Wie spät ist es?'],
  m_stellen: ['Stell die Zeiger ganz genau so wie die Digitaluhr!'],
  m_wahl: ['Welche Digitaluhr zeigt genau diese Zeit?'],
  paare: ['Zum Schluss: Finde die Paare! Tipp auf eine Uhr und dann auf die passende Zeit.'],
  paar_falsch: ['Das passt nicht zusammen. Probier es nochmal!'],
  paare_ende: ['Hurra, alle Paare gefunden!'],

  // Rückmeldung
  falsch: ['Nicht ganz. Schau, so ist es richtig.', 'Fast! Das hier ist richtig.', 'Hmm, schau mal hier. Das ist die richtige Zeit.'],
  f_halb: ['Achtung: Bei halb denken wir schon an die nächste Stunde!'],
  f_vor: ['Achtung: Bei vor denken wir schon an die nächste Stunde!'],
  f_zeiger: ['Schau genau: Der kurze Zeiger zeigt die Stunden, der lange die Minuten.'],
  f_seite: ['Schau, auf welcher Seite der lange Zeiger steht. Rechts heisst nach, links heisst vor.'],
  f_umhalb: ['Schau genau: Kurz vor der Sechs heisst fünf vor halb, kurz nach der Sechs heisst fünf nach halb.'],
  f_digital_halb: ['Achtung: Bei halb und vor zeigt die Digitaluhr noch die Stunde davor.'],
  f_plus12: ['Denk an den Trick: Vom Nachmittag bis Mitternacht rechnest du plus zwölf!'],
  f_minus12: ['Auf der Zeigeruhr gibt es nur zwölf Stunden. Rechne minus zwölf!'],
  f_tageszeit: ['Schau auf die Stunde: Nach zwölf Uhr mittags zählt die Digitaluhr weiter. Um Mitternacht fängt sie wieder bei null an.'],
  f_ziffern: [{ t: 'Die Minuten haben immer zwei Ziffern, zum Beispiel 05.', s: 'Die Minuten haben immer zwei Ziffern, zum Beispiel null fünf.' }],
  f_striche: ['Zähl die kleinen Striche nach der Zahl weiter.'],
  s_nochmal: ['Hmm, das stimmt noch nicht. Dreh nochmal!', 'Fast! Schau nochmal genau.'],
  s_lang_ok: ['Der lange Zeiger stimmt schon!'],
  s_loesung: ['So ist es richtig. Schau genau hin!'],
  t_stunde: ['Die Stunde stimmt noch nicht. Schau auf den kurzen Zeiger.'],
  t_minuten: ['Die Minuten stimmen noch nicht. Schau auf den langen Zeiger.'],
  t_loesung: ['So zeigt es die Digitaluhr:'],

  // Glühbirne: Tipps zu jeder Art von Zeit
  tipp_voll: ['Der lange Zeiger zeigt ganz nach oben. Schau, wo der kurze Zeiger steht.'],
  tipp_halb: ['Der lange Zeiger zeigt nach unten: Es ist halb. Zu welcher Zahl geht der kurze Zeiger als Nächstes?'],
  tipp_vnach: ['Der lange Zeiger steht auf der Drei. Das ist Viertel nach.'],
  tipp_vvor: ['Der lange Zeiger steht auf der Neun. Das ist Viertel vor. Welche Stunde kommt als Nächstes?'],
  tipp_nach: ['Der lange Zeiger steht rechts. Zähl in Fünferschritten: fünf, zehn, fünfzehn, zwanzig.'],
  tipp_vor: ['Der lange Zeiger steht links. Wie viele Minuten fehlen noch bis ganz oben?'],
  tipp_umhalb: ['Der lange Zeiger ist ganz nah bei der Sechs. Ist er kurz davor oder kurz danach?'],
  tipp_minute: ['Schau, nach welcher Zahl der lange Zeiger steht, und zähl die kleinen Striche weiter.'],
  tipp_digital: ['Vor dem Doppelpunkt stehen die Stunden, danach die Minuten.'],

  // Ende
  station_ende: ['Hurra, Station geschafft!', 'Super! Diese Uhr kannst du jetzt.', 'Juhu! Du wirst ein richtiger Uhren-Profi.'],
  ueben_ende: ['Super geübt!', 'Toll! Du weisst schon so viel über die Uhr.'],
  mandarinen: {
    1: 'Dafür bekommst du eine Mandarine!',
    2: 'Dafür bekommst du zwei Mandarinen!',
    3: 'Dafür bekommst du drei Mandarinen!',
    4: 'Dafür bekommst du vier Mandarinen!',
  },
};
// Was davon jubelt (für make-audio.mjs, wie LEBHAFT in texte.js)
const UHR_LEBHAFT = ['willkommen', 'karte', 'karte_zurueck', 'karte_digital', 'karte_fertig', 'paare_ende', 'station_ende', 'ueben_ende', 'mandarinen', 'jetzt_genau'];

// Capy im Teich, wenn heute noch keine Uhr dran war
const UHR_CAPY = {
  tipp: ['Hast du Lust, mit mir die Uhr zu lernen? Tipp oben auf die Uhr!'],
};

/* =====================================================================
   AUFNAHMEN: alles, was die Uhr-Ecke abspielen kann, mit Capys Stimme.
   Ohne Folgesatz (next_text), der hängt sonst einen Laut an. Der Satz
   davor (vorher) wird nicht gesprochen und sagt der Stimme nur, wie.
   ===================================================================== */
function uhrAufnahmen() {
  const liste = [];
  const dazu = (e, vorher = '', lebhaft = false) => {
    const s = UHR_TX.sprechtext(e);
    // Ganz kurze Ausrufe hält die Stimme sonst leicht für Italienisch oder Englisch (wie in texte.js),
    // darum ein deutscher Satz davor; einen Satz danach gibt es nie
    const kurz = lebhaft && !vorher && s.split(/\s+/).length <= 3;
    liste.push({ s, stimme: 'c', datei: UHR_TX.kennung(s), vorher: kurz ? 'Juna hat die Aufgabe gelöst, und Capy ruft fröhlich:' : vorher,
      nachher: '', lebhaft, kurz, tempo: 1 });
  };
  for (const [name, pool] of Object.entries(UHR_TEXTE)) {
    if (name === 'ton_aus') continue;   // steht nur bei ausgeschaltetem Ton in der Blase, ist also nie zu hören
    for (const e of Array.isArray(pool) ? pool : Object.values(pool)) dazu(e, '', UHR_LEBHAFT.includes(name));
  }
  for (const pool of Object.values(UHR_CAPY)) for (const e of pool) dazu(e, '', true);
  for (const st of UHR_STATIONEN) for (const l of st.lern) dazu(l.t, 'Capy erklärt Yuna die Uhr.');
  for (const sz of UHR_SZENEN) dazu(sz.t, 'Capy erzählt vom Tag.');
  for (const tz of UHR_TAGESZEITEN) dazu(tz.satz, 'Capy schaut aus dem Fenster.');
  for (let t = 0; t < 720; t += 5) {
    dazu(uhrEsIst(t), 'Capy schaut auf die Uhr und sagt:');
    dazu(uhrStell(t), 'Capy zeigt Yuna die Uhr und sagt:');
  }
  for (let h = 0; h < 24; h++) dazu(uhrDigitalStunde(h), 'Auf der Digitaluhr steht:');
  for (let z = 1; z <= 12; z++) { dazu(uhrLangSatz(z)); dazu(uhrMinutenSatz(z)); }
  for (let t = 0; t < 720; t += 30) dazu(uhrKurzSatz(t));
  return [...new Map(liste.map(x => [x.datei, x])).values()];
}

if (typeof module !== 'undefined') {
  module.exports = { UHR_STUNDE, UHR_ZAHL, UHR_ARTEN, UHR_TAGESZEITEN, UHR_SZENEN, UHR_STATIONEN, UHR_TEXTE, UHR_LEBHAFT, UHR_CAPY,
    uhrNorm, uhrZeitwort, uhrArt, uhrEsIst, uhrStell, uhrDigital, uhrDigitalStunde, uhrDigitalTeile, uhrLangSatz, uhrKurzSatz,
    uhrMinutenSatz, uhrTageszeit, uhrAufnahmen };
}
