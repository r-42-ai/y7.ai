'use strict';

/* =====================================================================
   INDO-VOKABELN
   Perciks Indonesisch: 223 Einträge in sechs Pelajaran (Lektionen) und
   25 Lernzielen. Ein Schulbuch gibt es dazu nicht: Die Liste ist für Nea
   zusammengestellt und geprüft (Standard-Indonesisch nach EYD und KBBI,
   die Alltagssprache eines Kindes, kamu statt Anda).

   Gebaut wird mit demselben Baukasten wie das Französisch (kursAufbereiten,
   kursClip und kursStrukturPruefen aus vokabeln.js): So hat jeder Eintrag
   genau die Form, auf die sich Lernmodell, Übungen und Album verlassen.
   Dazu kommt das Sprachprofil SPRACHE, mit dem Lernen.kurs(VOK_INDO) das
   Lernmodell für diese Sprache einrichtet.

   Ein einziges Global, VOK_INDO, mit denselben Namen wie vokabeln.js
   (VOKABELN, KARTEN, LERNZIELE …), dazu SPRACHE und pruefen(). Alles
   andere bleibt in der Klammer: Im Browser teilen sich alle Skripte einen
   Bereich, und ein zweites VOKABELN neben dem französischen gäbe dort
   einen Fehler, der die ganze Datei abbricht.

   Die Datei läuft im Browser, in Node (require) und im Service Worker
   (importScripts), jedes Mal nach vokabeln.js. Sie fasst weder die Seite
   noch einen Speicher an.

   Ein Eintrag, wie im Französisch:
     un       Pelajaran: 'i1' … 'i6' (muss in UNITES stehen)
     lz       Lernziel in der Pelajaran: '1' … '5'
     cat      Wortgruppe für gute Ablenker: 'gruss' | 'wie' (Eigenschaften
              und Lob) | 'gram' (kleine Wörter wie ya, di, dan) | 'wer' |
              'frage' | 'zahl' | 'rechnen' | 'sammel' (Oberbegriffe wie
              keluarga, warna) | 'ding' | 'fam' | 'tier' | 'verb' |
              'schule' | 'fach' | 'tag' | 'essen' | 'frucht' | 'natur' |
              'farbe' | 'satz' (ganze Sätze, werden nie getippt). 'verb'
              und 'gram' gelten bei den deutschen Ablenkern nicht als Nomen
              (lernen.js), darum heissen sie wie im Französisch.
     fr / de  so steht es auf der Karte. fr ist hier das Indonesische: Das
              Lernmodell nennt die Fremdsprache überall so.
     frForms  optional: die einzelnen indonesischen Formen
     deForms  optional: die einzelnen deutschen Formen
   Indonesisch kennt weder Artikel noch Akzente noch Apostrophe (Jumat,
   nicht Jum’at). Gross steht nur am Satzanfang, bei Namen (EIGENNAMEN)
   und bei Tagen und Sprachen (GROSS_WOERTER). Die Mehrzahl ist das doppelte
   Wort mit Bindestrich (anak-anak); kupu-kupu ist trotzdem nur ein
   Schmetterling. Zahlen stehen immer als Wörter.

   Die Kommentare über den Einträgen sind die Notizen der Wortliste für
   den, der Perciks Texte schreibt (Merkhilfen und Wortmomente in
   indo-texte.js). Sie stehen nie auf einer Karte und werden nie gesprochen.

   Wichtig: un und fr bilden den Schlüssel für Neas Fortschritt
   (nea.igel.indo), für Merkhilfen und Wortmomente. Wer einen Eintrag
   umformuliert, lässt das Wort bei null beginnen.
   Nach jeder Änderung muss VOK_INDO.pruefen() eine leere Liste geben.
   ===================================================================== */

const VOK_INDO = (() => {
  // Der Baukasten: in Node über require, im Browser und im Service Worker die Globalen von
  // vokabeln.js, das dort immer vorher geladen wird (index.html, sw.js)
  const B = typeof module !== 'undefined' && typeof require === 'function'
    ? require('./vokabeln.js')
    : { kursAufbereiten, kursClip, kursStrukturPruefen, ohneKlammern };

  // So heissen Perciks Kapitel. Die Farbe färbt auch Schrift (--unite in franz.css), darum hat jede zu
  // Weiss mindestens 6,1:1 Kontrast und zum hellen Grund #F4EADA mindestens 5,1:1.
  const UNITES = {
    i1: { name: 'Pelajaran 1', titel: 'Grüssen & Kennenlernen', farbe: '#0B6A85' },
    i2: { name: 'Pelajaran 2', titel: 'Zahlen & Rechnen',       farbe: '#6D28D9' },
    i3: { name: 'Pelajaran 3', titel: 'Familie & Zuhause',      farbe: '#92400E' },
    i4: { name: 'Pelajaran 4', titel: 'Schule, Tage & Hobbys',  farbe: '#1D4ED8' },
    i5: { name: 'Pelajaran 5', titel: 'Essen & Trinken',        farbe: '#B91C1C' },
    i6: { name: 'Pelajaran 6', titel: 'Tiere, Natur & Farben',  farbe: '#456B0F' },
  };
  const UNITE_REIHE = ['i1', 'i2', 'i3', 'i4', 'i5', 'i6'];

  // Ohne Buch gibt es kein Blatt, das «Lernziel 2» heisst: Jedes Lernziel trägt seinen eigenen Namen
  const LERNZIEL_NAMEN = {
    'i1-1': 'Grüssen', 'i1-2': 'Bitte, danke, Entschuldigung', 'i1-3': 'Ja, nein, super!', 'i1-4': 'Ich, du und die Freunde',
    'i1-5': 'Fragen',
    'i2-1': 'Null bis zehn', 'i2-2': 'Grosse Zahlen', 'i2-3': 'Rechnen', 'i2-4': 'Zählen und Brüche',
    'i3-1': 'Familie', 'i3-2': 'Verwandte', 'i3-3': 'Im Haus', 'i3-4': 'Dies und das',
    'i4-1': 'In der Schule', 'i4-2': 'Lernen und Sprachen', 'i4-3': 'Tage', 'i4-4': 'Tun und Spielen',
    'i5-1': 'Essen', 'i5-2': 'Früchte', 'i5-3': 'Trinken und Süsses', 'i5-4': 'Hunger und Geschmack',
    'i6-1': 'Tiere', 'i6-2': 'Natur', 'i6-3': 'Farben', 'i6-4': 'Wie ist es?',
  };

  // In der Reihenfolge, in der das Lernmodell sie einführt: Lernziel um Lernziel, die Sätze am Schluss
  // ihres Lernziels. Jedes Wort eines Satzes steht schon vor dem Satz in der Liste (pruefen() hält das fest).
  const VOKABELN = [
    /* ════════ Pelajaran 1 · Grüssen & Kennenlernen ════════ */
    /* ── i1-1 · Grüssen ── */
    // Fast wie im Deutschen, nur mit einem l.
    { un: 'i1', lz: '1', cat: 'gruss', fr: 'halo', de: 'hallo' },
    // Das Wort pagi heisst Morgen. Selamat heisst eigentlich heil und sicher; allein ruft man «Selamat!», wenn man
    // gratuliert.
    { un: 'i1', lz: '1', cat: 'gruss', fr: 'selamat pagi', de: 'guten Morgen' },
    // Das Wort siang meint die heisse Mittagszeit, etwa von elf bis drei Uhr.
    { un: 'i1', lz: '1', cat: 'gruss', fr: 'selamat siang', de: 'guten Tag (am Mittag)' },
    // Das Wort sore meint den späten Nachmittag, bis es dunkel wird.
    { un: 'i1', lz: '1', cat: 'gruss', fr: 'selamat sore', de: 'guten Nachmittag' },
    // Das Wort malam heisst Nacht. Man sagt es am Abend zur Begrüssung und spät auch zum Abschied.
    { un: 'i1', lz: '1', cat: 'gruss', fr: 'selamat malam', de: 'guten Abend' },
    // Das Wort tidur heisst schlafen. Das hört Pieks besonders gern.
    { un: 'i1', lz: '1', cat: 'gruss', fr: 'selamat tidur', de: 'schlaf gut' },
    // Das Wort datang heisst kommen.
    { un: 'i1', lz: '1', cat: 'gruss', fr: 'selamat datang', de: 'willkommen' },
    // Wörtlich: was gibt es Neues? Das Wort kabar heisst Nachricht.
    { un: 'i1', lz: '1', cat: 'gruss', fr: 'apa kabar?', de: 'wie geht es dir?' },
    // Die Antwort auf apa kabar ist: Baik! Es heisst auch lieb: anak baik ist ein liebes Kind.
    { un: 'i1', lz: '1', cat: 'wie', fr: 'baik', de: 'gut' },
    // Wörtlich: bis zum Treffen.
    { un: 'i1', lz: '1', cat: 'gruss', fr: 'sampai jumpa', de: 'auf Wiedersehen' },
    // Das Wort besok heisst morgen.
    { un: 'i1', lz: '1', cat: 'gruss', fr: 'sampai besok', de: 'bis morgen' },
    /* ── i1-2 · Bitte, danke, Entschuldigung ── */
    // Wörtlich etwa: Liebe annehmen. Das Wort terima heisst annehmen, kasih heisst Liebe.
    { un: 'i1', lz: '2', cat: 'gruss', fr: 'terima kasih', de: 'danke' },
    // Wörtlich: gleich-gleich. Es heisst auch beide oder zusammen. Doppelt, und trotzdem nur ein Wort.
    { un: 'i1', lz: '2', cat: 'gruss', fr: 'sama-sama', de: 'gern geschehen' },
    // So entschuldigt man sich, zum Beispiel wenn man jemanden nass spritzt.
    { un: 'i1', lz: '2', cat: 'gruss', fr: 'maaf', de: 'Entschuldigung' },
    // Wörtlich: nicht was-was, also: Es ist nichts. Die Antwort auf maaf.
    { un: 'i1', lz: '2', cat: 'gruss', fr: 'tidak apa-apa', de: 'macht nichts' },
    // Ruft man nur «Tolong!», heisst es «Hilfe!».
    { un: 'i1', lz: '2', cat: 'gruss', fr: 'tolong', de: 'bitte (wenn man um etwas bittet)' },
    // Wie «bitte schön» oder «nur zu».
    { un: 'i1', lz: '2', cat: 'gruss', fr: 'silakan', de: 'bitte (wenn man etwas anbietet)' },
    /* ── i1-3 · Ja, nein, super! ── */
    // Klingt genau wie ja. Hinten am Satz heisst es so viel wie gell: Sampai besok, ya!
    { un: 'i1', lz: '3', cat: 'gram', fr: 'ya', de: 'ja' },
    // Mit tidak verneint man Verben und Adjektive: tidak baik heisst nicht gut. Vor einem Nomen steht bukan: bukan
    // kucing heisst keine Katze. Im Alltag hört man oft nggak, hier lernst du tidak.
    { un: 'i1', lz: '3', cat: 'gram', fr: 'tidak', de: 'nein, nicht', deForms: ['nein', 'nicht', 'nein, nicht'] },
    // «Betul!» ruft Percik, wenn etwas stimmt.
    { un: 'i1', lz: '3', cat: 'wie', fr: 'betul', de: 'richtig' },
    // «Bagus!» ruft Percik, wenn dir etwas gelingt.
    { un: 'i1', lz: '3', cat: 'wie', fr: 'bagus', de: 'schön, toll', deForms: ['schön', 'toll', 'schön, toll'] },
    // Klingt fast wie «hebt ab»: So super ist es. «Hebat!» ruft Percik besonders gern.
    { un: 'i1', lz: '3', cat: 'wie', fr: 'hebat', de: 'super, grossartig',
      deForms: ['super', 'grossartig', 'super, grossartig'] },
    // «Pintar!» ruft Percik, wenn etwas schlau war. Ein anak pintar ist ein kluges Kind.
    { un: 'i1', lz: '3', cat: 'wie', fr: 'pintar', de: 'klug, schlau', deForms: ['klug', 'schlau', 'klug, schlau'] },
    // So sagen Kinder in Indonesien zu allem, was cool ist.
    { un: 'i1', lz: '3', cat: 'wie', fr: 'keren', de: 'cool' },
    /* ── i1-4 · Ich, du und die Freunde ── */
    // Das y spricht man wie j. Unter Freunden sagt man oft auch aku, hier lernst du saya.
    { un: 'i1', lz: '4', cat: 'wer', fr: 'saya', de: 'ich' },
    // Mit kamu duzt man Kinder und Freunde. Erwachsene spricht man mit Bapak oder Ibu an.
    { un: 'i1', lz: '4', cat: 'wer', fr: 'kamu', de: 'du' },
    // Ein Wort für er und sie: Indonesisch fragt nicht, ob Bub oder Mädchen.
    { un: 'i1', lz: '4', cat: 'wer', fr: 'dia', de: 'er, sie (eine Person)' },
    // Gemeint sind wir alle, du auch. Ohne dich heisst wir kami.
    { un: 'i1', lz: '4', cat: 'wer', fr: 'kita', de: 'wir' },
    { un: 'i1', lz: '4', cat: 'wer', fr: 'mereka', de: 'sie (mehrere)' },
    // Fast wie Name.
    { un: 'i1', lz: '4', cat: 'ding', fr: 'nama', de: 'der Name' },
    // «Halo teman-teman!» heisst «Hallo zusammen!».
    { un: 'i1', lz: '4', cat: 'fam', fr: 'teman', de: 'der Freund, die Freundin',
      deForms: ['der Freund', 'die Freundin', 'der Freund, die Freundin'] },
    // In den Wäldern Indonesiens ist landak das Stachelschwein. Igel gibt es dort nur als Haustiere, sie heissen
    // landak mini. Pieks ist also ein landak.
    { un: 'i1', lz: '4', cat: 'tier', fr: 'landak', de: 'der Igel, das Stachelschwein',
      deForms: ['der Igel', 'das Stachelschwein', 'der Igel, das Stachelschwein'] },
    // Ein Sprichwort sagt: Auch das geschickteste Eichhörnchen fällt einmal vom Baum. So tröstet man nach einem
    // Fehler.
    { un: 'i1', lz: '4', cat: 'tier', fr: 'tupai', de: 'das Eichhörnchen' },
    // Doppelt, und doch nur ein Tier, wie später kupu-kupu. So einer ist Percik. Nicht verwechseln: bérang mit hellem e
    // heisst wütend; das ist ein anderes Wort, nur gleich geschrieben.
    { un: 'i1', lz: '4', cat: 'tier', fr: 'berang-berang', de: 'der Otter' },
    // Wörtlich: Name ich Nea. «Mein» steht hinten: nama saya heisst mein Name. Ein «ist» braucht es nicht.
    { un: 'i1', lz: '4', cat: 'satz', fr: 'Nama saya Nea.', de: 'Mein Name ist Nea.' },
    // Wörtlich: Percik Freund ich. Wieder steht «mein» hinten, und ein «ist» braucht es nicht.
    { un: 'i1', lz: '4', cat: 'satz', fr: 'Percik teman saya.', de: 'Percik ist mein Freund.' },
    /* ── i1-5 · Fragen ── */
    // Steckt auch im Gruss apa kabar.
    { un: 'i1', lz: '5', cat: 'frage', fr: 'apa?', de: 'was?' },
    { un: 'i1', lz: '5', cat: 'frage', fr: 'siapa?', de: 'wer?' },
    // Wörtlich: in wo? Das Wort di heisst in, an oder auf, mana heisst wo.
    { un: 'i1', lz: '5', cat: 'frage', fr: 'di mana?', de: 'wo?' },
    { un: 'i1', lz: '5', cat: 'gram', fr: 'dari', de: 'aus, von', deForms: ['aus', 'von', 'aus, von'] },
    // Wörtlich: aus wo?
    { un: 'i1', lz: '5', cat: 'frage', fr: 'dari mana?', de: 'woher?' },
    // Wörtlich: wer Name du? Gesprochen hört man auch «Nama kamu siapa?»; beim Ordnen gilt bisher nur die Reihe der
    // Karte.
    { un: 'i1', lz: '5', cat: 'satz', fr: 'Siapa nama kamu?', de: 'Wie heisst du?' },
    // Wörtlich: du aus wo? Ein Wort für kommen braucht es nicht. Gesprochen hört man auch «Dari mana kamu?»; beim
    // Ordnen gilt bisher nur die Reihe der Karte.
    { un: 'i1', lz: '5', cat: 'satz', fr: 'Kamu dari mana?', de: 'Woher kommst du?' },
    // Die Schweiz heisst auf Indonesisch Swis: So steht es in der amtlichen Länderliste von 2025 (Badan Informasi
    // Geospasial mit Badan Bahasa). Vorher stand dort Swiss, wie im Englischen, und im Alltag liest man es noch oft.
    // Gesprochen klingen beide gleich.
    { un: 'i1', lz: '5', cat: 'satz', fr: 'Saya dari Swis.', de: 'Ich komme aus der Schweiz.' },
    // Java heisst auf Indonesisch Jawa, gesprochen mit dsch. Dort liegt Perciks Reisfeld.
    { un: 'i1', lz: '5', cat: 'satz', fr: 'Percik dari Jawa.', de: 'Percik kommt aus Java.' },

    /* ════════ Pelajaran 2 · Zahlen & Rechnen ════════ */
    /* ── i2-1 · Null bis zehn ── */
    { un: 'i2', lz: '1', cat: 'zahl', fr: 'nol', de: 'null' },
    // Vorne an einem Wort wird satu zu se: sepuluh, seratus.
    { un: 'i2', lz: '1', cat: 'zahl', fr: 'satu', de: 'eins' },
    { un: 'i2', lz: '1', cat: 'zahl', fr: 'dua', de: 'zwei' },
    { un: 'i2', lz: '1', cat: 'zahl', fr: 'tiga', de: 'drei' },
    { un: 'i2', lz: '1', cat: 'zahl', fr: 'empat', de: 'vier' },
    // Eine Hand, fünf Finger: In sehr alten Sprachen der Inseln hiess lima auch Hand.
    { un: 'i2', lz: '1', cat: 'zahl', fr: 'lima', de: 'fünf' },
    { un: 'i2', lz: '1', cat: 'zahl', fr: 'enam', de: 'sechs' },
    { un: 'i2', lz: '1', cat: 'zahl', fr: 'tujuh', de: 'sieben' },
    { un: 'i2', lz: '1', cat: 'zahl', fr: 'delapan', de: 'acht' },
    { un: 'i2', lz: '1', cat: 'zahl', fr: 'sembilan', de: 'neun' },
    // Die Silbe se heisst ein, puluh heisst Zehner: ein Zehner.
    { un: 'i2', lz: '1', cat: 'zahl', fr: 'sepuluh', de: 'zehn' },
    /* ── i2-2 · Grosse Zahlen ── */
    // Das Wort belas steht für -zehn: sebelas ist ein-zehn.
    { un: 'i2', lz: '2', cat: 'zahl', fr: 'sebelas', de: 'elf' },
    // Wörtlich: zwei-zehn. So geht es weiter: tiga belas ist dreizehn.
    { un: 'i2', lz: '2', cat: 'zahl', fr: 'dua belas', de: 'zwölf' },
    // Wörtlich: zwei Zehner.
    { un: 'i2', lz: '2', cat: 'zahl', fr: 'dua puluh', de: 'zwanzig' },
    // Schön der Reihe nach: zwei Zehner und eins. Nicht verdreht wie im Deutschen.
    { un: 'i2', lz: '2', cat: 'zahl', fr: 'dua puluh satu', de: 'einundzwanzig' },
    // Das Wort ratus heisst hundert, seratus ist also einhundert.
    { un: 'i2', lz: '2', cat: 'zahl', fr: 'seratus', de: 'hundert' },
    // Das Wort ribu heisst tausend, seribu ist also eintausend.
    { un: 'i2', lz: '2', cat: 'zahl', fr: 'seribu', de: 'tausend' },
    /* ── i2-3 · Rechnen ── */
    // Das Wort heisst auch dazutun.
    { un: 'i2', lz: '3', cat: 'rechnen', fr: 'tambah', de: 'plus' },
    // Das Wort heisst auch: zu wenig.
    { un: 'i2', lz: '3', cat: 'rechnen', fr: 'kurang', de: 'minus, weniger', deForms: ['minus', 'weniger', 'minus, weniger'] },
    // Wie in zweimal: dua kali. Auf Java heisst kali ausserdem Fluss.
    { un: 'i2', lz: '3', cat: 'rechnen', fr: 'kali', de: 'mal' },
    // Das Wort heisst auch teilen, zum Beispiel einen Kuchen.
    { un: 'i2', lz: '3', cat: 'rechnen', fr: 'bagi', de: 'geteilt durch' },
    // Wörtlich: gleich mit. Das Wort sama steckt auch in sama-sama, dengan heisst mit.
    { un: 'i2', lz: '3', cat: 'rechnen', fr: 'sama dengan', de: 'ist gleich' },
    // Die Lieblingsfrage von Pieks. So fragt man auch nach dem Preis.
    { un: 'i2', lz: '3', cat: 'frage', fr: 'berapa?', de: 'wie viel?' },
    { un: 'i2', lz: '3', cat: 'satz', fr: 'Dua tambah tiga sama dengan lima.', de: 'Zwei plus drei ist gleich fünf.' },
    // Das Fragewort darf vorn oder hinten stehen: Im Schulzimmer hört man auch «Dua kali tiga berapa?». Beim Ordnen
    // gilt bisher nur die Reihe der Karte.
    { un: 'i2', lz: '3', cat: 'satz', fr: 'Berapa dua kali tiga?', de: 'Wie viel ist zwei mal drei?' },
    /* ── i2-4 · Zählen und Brüche ── */
    // Meist ist die geschriebene Zahl gemeint, die Ziffer.
    { un: 'i2', lz: '4', cat: 'sammel', fr: 'angka', de: 'die Zahl' },
    // Vielen Dank heisst terima kasih banyak.
    { un: 'i2', lz: '4', cat: 'wie', fr: 'banyak', de: 'viel, viele', deForms: ['viel', 'viele', 'viel, viele'] },
    // Im Wort steckt hitung, zählen. Das ist das Fach von Pieks.
    { un: 'i2', lz: '4', cat: 'verb', fr: 'menghitung', de: 'zählen, rechnen',
      deForms: ['zählen', 'rechnen', 'zählen, rechnen'] },
    // Im Wort steckt pecah, zerbrechen: Ein Bruch ist etwas Zerbrochenes, genau wie im Deutschen.
    { un: 'i2', lz: '4', cat: 'sammel', fr: 'pecahan', de: 'der Bruch' },
    // Im Wort steckt tengah, die Mitte. Bei der Uhr wie im Deutschen: setengah tiga heisst halb drei.
    { un: 'i2', lz: '4', cat: 'rechnen', fr: 'setengah', de: 'halb, die Hälfte',
      deForms: ['halb', 'die Hälfte', 'halb, die Hälfte'] },
    // Wörtlich etwa: ein durch vier. Darin stecken se, ein, und empat, vier.
    { un: 'i2', lz: '4', cat: 'rechnen', fr: 'seperempat', de: 'ein Viertel' },
    // Das Wort dari heisst hier von.
    { un: 'i2', lz: '4', cat: 'satz', fr: 'Setengah dari sepuluh sama dengan lima.', de: 'Die Hälfte von zehn ist gleich fünf.' },

    /* ════════ Pelajaran 3 · Familie & Zuhause ════════ */
    /* ── i3-1 · Familie ── */
    { un: 'i3', lz: '1', cat: 'sammel', fr: 'keluarga', de: 'die Familie' },
    // Das Wort steckt in orang tua und in orang utan. Viele Leute heisst banyak orang, drei Personen tiga orang.
    { un: 'i3', lz: '1', cat: 'sammel', fr: 'orang', de: 'der Mensch, die Person',
      deForms: ['der Mensch', 'die Person', 'der Mensch, die Person'] },
    // Wörtlich: alte Menschen. Das Wort tua heisst alt.
    { un: 'i3', lz: '1', cat: 'fam', fr: 'orang tua', de: 'die Eltern' },
    // Mit Ibu spricht man auch jede erwachsene Frau an, zum Beispiel die Lehrerin.
    { un: 'i3', lz: '1', cat: 'fam', fr: 'ibu', de: 'die Mutter' },
    // Hier lernst du ayah. Viele Kinder sagen auch bapak oder papa.
    { un: 'i3', lz: '1', cat: 'fam', fr: 'ayah', de: 'der Vater' },
    // Die Mehrzahl ist ganz einfach: das Wort zweimal, mit Bindestrich.
    { un: 'i3', lz: '1', cat: 'fam', fr: 'anak, anak-anak', de: 'das Kind, die Kinder',
      frForms: ['anak', 'anak-anak', 'anak, anak-anak'], deForms: ['das Kind', 'die Kinder', 'das Kind, die Kinder'] },
    // Nicht verwechseln: babi heisst Schwein!
    { un: 'i3', lz: '1', cat: 'fam', fr: 'bayi', de: 'das Baby' },
    /* ── i3-2 · Verwandte ── */
    // Wichtig ist nicht Bruder oder Schwester, sondern älter oder jünger.
    { un: 'i3', lz: '2', cat: 'fam', fr: 'kakak', de: 'der ältere Bruder, die ältere Schwester',
      deForms: ['der ältere Bruder', 'die ältere Schwester', 'der ältere Bruder, die ältere Schwester'] },
    { un: 'i3', lz: '2', cat: 'fam', fr: 'adik', de: 'der jüngere Bruder, die jüngere Schwester',
      deForms: ['der jüngere Bruder', 'die jüngere Schwester', 'der jüngere Bruder, die jüngere Schwester'] },
    // Gut hinhören: Der Grossvater ist kakek, das ältere Geschwister kakak.
    { un: 'i3', lz: '2', cat: 'fam', fr: 'kakek', de: 'der Grossvater' },
    // Hier lernst du nenek. Viele Kinder sagen auch oma, und zum Grossvater opa, wie im Deutschen.
    { un: 'i3', lz: '2', cat: 'fam', fr: 'nenek', de: 'die Grossmutter' },
    // Hier lernst du paman. Viele sagen auch om, nach dem holländischen oom.
    { un: 'i3', lz: '2', cat: 'fam', fr: 'paman', de: 'der Onkel' },
    // Hier lernst du bibi. Viele sagen auch tante, das Wort kommt aus dem Holländischen.
    { un: 'i3', lz: '2', cat: 'fam', fr: 'bibi', de: 'die Tante' },
    /* ── i3-3 · Im Haus ── */
    // Achtung: Das Haus heisst rumah. Das Wort haus heisst durstig!
    { un: 'i3', lz: '3', cat: 'ding', fr: 'rumah', de: 'das Haus' },
    // Klingt wie Kammer.
    { un: 'i3', lz: '3', cat: 'ding', fr: 'kamar', de: 'das Zimmer' },
    // Wörtlich: Zimmer zum Baden. Das Wort mandi heisst baden oder duschen.
    { un: 'i3', lz: '3', cat: 'ding', fr: 'kamar mandi', de: 'das Badezimmer' },
    { un: 'i3', lz: '3', cat: 'ding', fr: 'dapur', de: 'die Küche' },
    { un: 'i3', lz: '3', cat: 'ding', fr: 'pintu', de: 'die Tür' },
    // Das Wort kommt vom portugiesischen mesa.
    { un: 'i3', lz: '3', cat: 'ding', fr: 'meja', de: 'der Tisch' },
    { un: 'i3', lz: '3', cat: 'ding', fr: 'kursi', de: 'der Stuhl' },
    // Pieks schläft oft und gern, am liebsten als Stachelkugel.
    { un: 'i3', lz: '3', cat: 'verb', fr: 'tidur', de: 'schlafen' },
    // Wörtlich: Ort zum Schlafen. Das Wort tempat heisst Ort.
    { un: 'i3', lz: '3', cat: 'ding', fr: 'tempat tidur', de: 'das Bett' },
    /* ── i3-4 · Dies und das ── */
    // Für Nahes sagt man ini, für Entferntes itu. Vorne im Satz heisst ini «das hier ist»: Ini kursi, das hier ist ein
    // Stuhl. Hinter einem Nomen heisst es «dieser»: kursi ini, dieser Stuhl.
    { un: 'i3', lz: '4', cat: 'gram', fr: 'ini', de: 'das hier, dies' },
    // Vorne im Satz heisst itu «das da ist»: Itu meja, das da ist ein Tisch. Hinter einem Nomen heisst es «jener» oder
    // einfach «der, die, das»: kucing itu, die Katze da.
    { un: 'i3', lz: '4', cat: 'gram', fr: 'itu', de: 'das da, jenes' },
    // Ein Wort für in, an, auf und bei: di dapur heisst in der Küche, di kursi auf dem Stuhl.
    { un: 'i3', lz: '4', cat: 'gram', fr: 'di', de: 'in, an, auf, bei', deForms: ['in', 'an', 'auf', 'bei', 'in, an, auf, bei'] },
    { un: 'i3', lz: '4', cat: 'gram', fr: 'dan', de: 'und' },
    // Haben im Sinn von besitzen.
    { un: 'i3', lz: '4', cat: 'verb', fr: 'punya', de: 'haben' },
    // Das c spricht man wie tsch: kutsching.
    { un: 'i3', lz: '4', cat: 'tier', fr: 'kucing', de: 'die Katze' },
    // Das j spricht man wie dsch: andsching.
    { un: 'i3', lz: '4', cat: 'tier', fr: 'anjing', de: 'der Hund' },
    // Indonesisch hat keine Artikel: kursi heisst der Stuhl, ein Stuhl oder einfach Stuhl. Vorne im Satz heissen ini
    // und itu «das hier ist» und «das da ist»; in «Kucing itu tidur di kursi.» steht itu hinter dem Nomen.
    { un: 'i3', lz: '4', cat: 'satz', fr: 'Ini kursi dan itu meja.', de: 'Das hier ist ein Stuhl und das da ein Tisch.' },
    // Ein «sind» braucht es nicht: di dapur heisst in der Küche.
    { un: 'i3', lz: '4', cat: 'satz', fr: 'Ibu dan anak-anak di dapur.', de: 'Die Mutter und die Kinder sind in der Küche.' },
    // Hier steht itu hinter dem Nomen: kucing itu heisst die Katze da. Das Wort di heisst hier auf.
    { un: 'i3', lz: '4', cat: 'satz', fr: 'Kucing itu tidur di kursi.', de: 'Die Katze schläft auf dem Stuhl.' },

    /* ════════ Pelajaran 4 · Schule, Tage & Hobbys ════════ */
    /* ── i4-1 · In der Schule ── */
    // Klingt fast wie Schule.
    { un: 'i4', lz: '1', cat: 'schule', fr: 'sekolah', de: 'die Schule' },
    // Bei uns ist ein Guru ein weiser Lehrer. Auf Indonesisch heisst jede Lehrerin und jeder Lehrer guru.
    { un: 'i4', lz: '1', cat: 'fam', fr: 'guru', de: 'der Lehrer, die Lehrerin',
      deForms: ['der Lehrer', 'die Lehrerin', 'der Lehrer, die Lehrerin'] },
    { un: 'i4', lz: '1', cat: 'fam', fr: 'murid', de: 'der Schüler, die Schülerin',
      deForms: ['der Schüler', 'die Schülerin', 'der Schüler, die Schülerin'] },
    // Fast wie Buch.
    { un: 'i4', lz: '1', cat: 'schule', fr: 'buku', de: 'das Buch' },
    // Wie das englische pencil.
    { un: 'i4', lz: '1', cat: 'schule', fr: 'pensil', de: 'der Bleistift' },
    // Im Wort steckt hapus, wegwischen.
    { un: 'i4', lz: '1', cat: 'schule', fr: 'penghapus', de: 'der Radiergummi' },
    /* ── i4-2 · Lernen und Sprachen ── */
    // Perciks Kapitel heissen so: Pelajaran eins bis sechs. Das Wort kommt von belajar, lernen. Ein Schulfach heisst
    // mata pelajaran.
    { un: 'i4', lz: '2', cat: 'schule', fr: 'pelajaran', de: 'die Lektion' },
    { un: 'i4', lz: '2', cat: 'verb', fr: 'belajar', de: 'lernen' },
    // Zwei Bedeutungen: wissen und der Tofu.
    { un: 'i4', lz: '2', cat: 'verb', fr: 'tahu', de: 'wissen, der Tofu', deForms: ['wissen', 'der Tofu', 'wissen, der Tofu'] },
    { un: 'i4', lz: '2', cat: 'sammel', fr: 'bahasa', de: 'die Sprache' },
    { un: 'i4', lz: '2', cat: 'fach', fr: 'bahasa Indonesia', de: 'Indonesisch' },
    // Deutschland heisst Jerman. Das J spricht man wie dsch.
    { un: 'i4', lz: '2', cat: 'fach', fr: 'bahasa Jerman', de: 'Deutsch' },
    // Frankreich heisst Prancis, mit P statt F.
    { un: 'i4', lz: '2', cat: 'fach', fr: 'bahasa Prancis', de: 'Französisch' },
    // England heisst Inggris.
    { un: 'i4', lz: '2', cat: 'fach', fr: 'bahasa Inggris', de: 'Englisch' },
    // Das Fach von Pieks.
    { un: 'i4', lz: '2', cat: 'fach', fr: 'matematika', de: 'Mathematik' },
    { un: 'i4', lz: '2', cat: 'satz', fr: 'Saya belajar bahasa Indonesia.', de: 'Ich lerne Indonesisch.' },
    // Wie der Knopf «Weiss ich nicht».
    { un: 'i4', lz: '2', cat: 'satz', fr: 'Saya tidak tahu.', de: 'Ich weiss es nicht.' },
    /* ── i4-3 · Tage ── */
    // Das Wort steckt in matahari, der Sonne: Auge des Tages.
    { un: 'i4', lz: '3', cat: 'sammel', fr: 'hari', de: 'der Tag' },
    // Kommt vom arabischen Wort für zwei: Gezählt wird ab Sonntag, darum ist der Montag der zweite Tag.
    { un: 'i4', lz: '3', cat: 'tag', fr: 'Senin', de: 'Montag' },
    // Kommt vom arabischen Wort für drei.
    { un: 'i4', lz: '3', cat: 'tag', fr: 'Selasa', de: 'Dienstag' },
    // Kommt vom arabischen Wort für vier.
    { un: 'i4', lz: '3', cat: 'tag', fr: 'Rabu', de: 'Mittwoch' },
    // Kommt vom arabischen Wort für fünf.
    { un: 'i4', lz: '3', cat: 'tag', fr: 'Kamis', de: 'Donnerstag' },
    // Das J spricht man wie dsch.
    { un: 'i4', lz: '3', cat: 'tag', fr: 'Jumat', de: 'Freitag' },
    // Sabtu und Samstag kommen beide vom Sabbat.
    { un: 'i4', lz: '3', cat: 'tag', fr: 'Sabtu', de: 'Samstag' },
    // Klein geschrieben heisst minggu die Woche. Das Wort kommt vom portugiesischen domingo.
    { un: 'i4', lz: '3', cat: 'tag', fr: 'Minggu', de: 'Sonntag' },
    // Wörtlich: dieser Tag.
    { un: 'i4', lz: '3', cat: 'tag', fr: 'hari ini', de: 'heute' },
    // Wie in sampai besok, bis morgen.
    { un: 'i4', lz: '3', cat: 'tag', fr: 'besok', de: 'morgen (am nächsten Tag)' },
    { un: 'i4', lz: '3', cat: 'tag', fr: 'kemarin', de: 'gestern' },
    // Vor dem Wochentag steht meistens hari.
    { un: 'i4', lz: '3', cat: 'satz', fr: 'Besok hari Sabtu.', de: 'Morgen ist Samstag.' },
    /* ── i4-4 · Tun und Spielen ── */
    // Hier lernst du membaca. Im Gespräch hört man oft nur baca.
    { un: 'i4', lz: '4', cat: 'verb', fr: 'membaca', de: 'lesen' },
    // Hier lernst du menulis. Im Gespräch hört man oft nur tulis.
    { un: 'i4', lz: '4', cat: 'verb', fr: 'menulis', de: 'schreiben' },
    // Im Wort steckt gambar, das Bild.
    { un: 'i4', lz: '4', cat: 'verb', fr: 'menggambar', de: 'zeichnen' },
    // Die Buchstaben ny spricht man wie nj.
    { un: 'i4', lz: '4', cat: 'verb', fr: 'bernyanyi', de: 'singen' },
    // Im Wort steckt tari, der Tanz.
    { un: 'i4', lz: '4', cat: 'verb', fr: 'menari', de: 'tanzen' },
    // Im Wort steckt sepeda, das Velo. Es kommt vom französischen vélocipède.
    { un: 'i4', lz: '4', cat: 'verb', fr: 'bersepeda', de: 'Velo fahren' },
    // Das tut Percik am liebsten.
    { un: 'i4', lz: '4', cat: 'verb', fr: 'berenang', de: 'schwimmen' },
    // Hier lernst du bermain. Kinder sagen meistens nur main.
    { un: 'i4', lz: '4', cat: 'verb', fr: 'bermain', de: 'spielen' },
    // Vor einem Verb heisst suka gern: suka berenang heisst gern schwimmen.
    { un: 'i4', lz: '4', cat: 'verb', fr: 'suka', de: 'gern haben, mögen',
      deForms: ['gern haben', 'mögen', 'gern haben, mögen'] },
    // «Ayo!» ruft Percik, wenn es losgeht.
    { un: 'i4', lz: '4', cat: 'gruss', fr: 'ayo', de: 'los, komm', deForms: ['los', 'komm', 'los, komm'] },
    { un: 'i4', lz: '4', cat: 'satz', fr: 'Percik suka berenang.', de: 'Percik schwimmt gern.' },
    { un: 'i4', lz: '4', cat: 'satz', fr: 'Ayo kita bermain!', de: 'Komm, wir spielen!' },

    /* ════════ Pelajaran 5 · Essen & Trinken ════════ */
    /* ── i5-1 · Essen ── */
    { un: 'i5', lz: '1', cat: 'verb', fr: 'makan', de: 'essen' },
    { un: 'i5', lz: '1', cat: 'verb', fr: 'minum', de: 'trinken' },
    // Gekochter Reis heisst nasi, roher Reis beras, und die Pflanze auf dem Feld heisst padi.
    { un: 'i5', lz: '1', cat: 'essen', fr: 'nasi', de: 'der Reis (gekocht)' },
    // Das Wort goreng heisst gebraten. Das bekannteste Essen Indonesiens.
    { un: 'i5', lz: '1', cat: 'essen', fr: 'nasi goreng', de: 'der gebratene Reis' },
    { un: 'i5', lz: '1', cat: 'essen', fr: 'roti', de: 'das Brot' },
    { un: 'i5', lz: '1', cat: 'essen', fr: 'telur', de: 'das Ei' },
    // Das Wort meint das Tier und das Essen.
    { un: 'i5', lz: '1', cat: 'essen', fr: 'ayam', de: 'das Huhn, das Poulet',
      deForms: ['das Huhn', 'das Poulet', 'das Huhn, das Poulet'] },
    // Percik isst am liebsten Fisch.
    { un: 'i5', lz: '1', cat: 'essen', fr: 'ikan', de: 'der Fisch' },
    /* ── i5-2 · Früchte ── */
    { un: 'i5', lz: '2', cat: 'sammel', fr: 'buah', de: 'die Frucht' },
    // Die Äpfel, die Nea bei Pieks sammelt, heissen auf Indonesisch apel.
    { un: 'i5', lz: '2', cat: 'frucht', fr: 'apel', de: 'der Apfel' },
    { un: 'i5', lz: '2', cat: 'frucht', fr: 'pisang', de: 'die Banane' },
    { un: 'i5', lz: '2', cat: 'frucht', fr: 'mangga', de: 'die Mango' },
    // Mit jeruk meint man alle Zitrusfrüchte, auch Mandarinen und Zitronen. Das j spricht man wie dsch.
    { un: 'i5', lz: '2', cat: 'frucht', fr: 'jeruk', de: 'die Orange' },
    // Das Wort kommt vom englischen strawberry.
    { un: 'i5', lz: '2', cat: 'frucht', fr: 'stroberi', de: 'die Erdbeere' },
    { un: 'i5', lz: '2', cat: 'frucht', fr: 'semangka', de: 'die Wassermelone' },
    // Ananas ohne das erste A.
    { un: 'i5', lz: '2', cat: 'frucht', fr: 'nanas', de: 'die Ananas' },
    // Nach banyak bleibt das Nomen einfach: banyak apel, nicht apel-apel. Gemeint ist natürlich Pieks.
    { un: 'i5', lz: '2', cat: 'satz', fr: 'Landak itu punya banyak apel.', de: 'Der Igel hat viele Äpfel.' },
    /* ── i5-3 · Trinken und Süsses ── */
    // Kein Englisch: air ist nicht die Luft, sondern das Wasser. Man spricht a-ir, mit zwei Silben. Trinkwasser heisst
    // oft air putih, weisses Wasser.
    { un: 'i5', lz: '3', cat: 'essen', fr: 'air', de: 'das Wasser' },
    { un: 'i5', lz: '3', cat: 'essen', fr: 'susu', de: 'die Milch' },
    // Klingt wie Tee.
    { un: 'i5', lz: '3', cat: 'essen', fr: 'teh', de: 'der Tee' },
    // Das Wort es heisst Eis, krim heisst Rahm.
    { un: 'i5', lz: '3', cat: 'essen', fr: 'es krim', de: 'die Glace' },
    { un: 'i5', lz: '3', cat: 'essen', fr: 'kue', de: 'der Kuchen, das Guetzli',
      deForms: ['der Kuchen', 'das Guetzli', 'der Kuchen, das Guetzli'] },
    /* ── i5-4 · Hunger und Geschmack ── */
    { un: 'i5', lz: '4', cat: 'wie', fr: 'enak', de: 'fein, lecker', deForms: ['fein', 'lecker', 'fein, lecker'] },
    // Wie das deutsche süss heisst es auch herzig: anak manis ist ein herziges Kind.
    { un: 'i5', lz: '4', cat: 'wie', fr: 'manis', de: 'süss' },
    // Indonesisches Essen ist oft pedas, mit viel Chili.
    { un: 'i5', lz: '4', cat: 'wie', fr: 'pedas', de: 'scharf' },
    { un: 'i5', lz: '4', cat: 'wie', fr: 'lapar', de: 'hungrig' },
    // Falscher Freund: haus hat nichts mit dem Haus zu tun. Das Haus heisst rumah.
    { un: 'i5', lz: '4', cat: 'wie', fr: 'haus', de: 'durstig' },
    { un: 'i5', lz: '4', cat: 'wie', fr: 'kenyang', de: 'satt' },
    { un: 'i5', lz: '4', cat: 'verb', fr: 'mau', de: 'möchten, wollen', deForms: ['möchten', 'wollen', 'möchten, wollen'] },
    // Nach einem Adjektiv heisst es sehr: enak sekali. Sonst heisst es einmal: se ist ein, kali ist Mal.
    { un: 'i5', lz: '4', cat: 'gram', fr: 'sekali', de: 'sehr, einmal', deForms: ['sehr', 'einmal', 'sehr, einmal'] },
    // Wie «en Guete».
    { un: 'i5', lz: '4', cat: 'gruss', fr: 'selamat makan', de: 'guten Appetit' },
    { un: 'i5', lz: '4', cat: 'satz', fr: 'Nasi goreng enak sekali!', de: 'Der gebratene Reis ist sehr fein!' },
    { un: 'i5', lz: '4', cat: 'satz', fr: 'Saya mau minum air.', de: 'Ich möchte Wasser trinken.' },
    // Eine Frage ohne Fragewort: Am Ende geht die Stimme hoch. Wörtlich: du möchtest Glace Erdbeere? Was genauer sagt,
    // welche Glace, steht hinten.
    { un: 'i5', lz: '4', cat: 'satz', fr: 'Kamu mau es krim stroberi?', de: 'Möchtest du eine Erdbeerglace?' },

    /* ════════ Pelajaran 6 · Tiere, Natur & Farben ════════ */
    /* ── i6-1 · Tiere ── */
    { un: 'i6', lz: '1', cat: 'sammel', fr: 'hewan', de: 'das Tier' },
    { un: 'i6', lz: '1', cat: 'tier', fr: 'burung', de: 'der Vogel' },
    { un: 'i6', lz: '1', cat: 'tier', fr: 'gajah', de: 'der Elefant' },
    // Wörtlich: Waldmensch. Das Wort orang heisst Mensch, utan ist eine alte Form von hutan, dem Wald.
    { un: 'i6', lz: '1', cat: 'tier', fr: 'orang utan', de: 'der Orang-Utan' },
    // Doppelt, aber keine Mehrzahl: ein einziger Schmetterling.
    { un: 'i6', lz: '1', cat: 'tier', fr: 'kupu-kupu', de: 'der Schmetterling' },
    // Auch doppelt und trotzdem nur eine.
    { un: 'i6', lz: '1', cat: 'tier', fr: 'kura-kura', de: 'die Schildkröte' },
    // Krabben mag Percik fast so gern wie Fische.
    { un: 'i6', lz: '1', cat: 'tier', fr: 'kepiting', de: 'die Krabbe' },
    { un: 'i6', lz: '1', cat: 'tier', fr: 'rubah', de: 'der Fuchs' },
    // Ein Wort für die Maus und die Ratte.
    { un: 'i6', lz: '1', cat: 'tier', fr: 'tikus', de: 'die Maus, die Ratte',
      deForms: ['die Maus', 'die Ratte', 'die Maus, die Ratte'] },
    // Wörtlich: Gespenstervogel.
    { un: 'i6', lz: '1', cat: 'tier', fr: 'burung hantu', de: 'die Eule' },
    { un: 'i6', lz: '1', cat: 'tier', fr: 'kelelawar', de: 'die Fledermaus' },
    // Wieder doppelt, und doch nur ein Glühwürmchen.
    { un: 'i6', lz: '1', cat: 'tier', fr: 'kunang-kunang', de: 'das Glühwürmchen' },
    /* ── i6-2 · Natur ── */
    { un: 'i6', lz: '2', cat: 'natur', fr: 'hutan', de: 'der Wald' },
    { un: 'i6', lz: '2', cat: 'natur', fr: 'pohon', de: 'der Baum' },
    // Die Buchstaben ng spricht man wie in singen.
    { un: 'i6', lz: '2', cat: 'natur', fr: 'bunga', de: 'die Blume' },
    // Einen Fluss, den Rhein, ist Percik bis in den Wald von Pieks heraufgeschwommen.
    { un: 'i6', lz: '2', cat: 'natur', fr: 'sungai', de: 'der Fluss' },
    // Falscher Freund: laut heisst das Meer. Über das Meer ist Percik nach Holland gekommen.
    { un: 'i6', lz: '2', cat: 'natur', fr: 'laut', de: 'das Meer' },
    // Hier ist Percik zu Hause.
    { un: 'i6', lz: '2', cat: 'natur', fr: 'sawah', de: 'das Reisfeld' },
    // Darum wachsen deine Wörter bei Percik als Reis.
    { un: 'i6', lz: '2', cat: 'natur', fr: 'padi', de: 'die Reispflanze' },
    // Mit einem kleinen Stein jongliert Percik, wenn er nachdenkt.
    { un: 'i6', lz: '2', cat: 'natur', fr: 'batu', de: 'der Stein' },
    // Wörtlich: Auge des Tages. Das Wort mata heisst Auge, hari Tag.
    { un: 'i6', lz: '2', cat: 'natur', fr: 'matahari', de: 'die Sonne' },
    // Ein Monat dauert etwa so lang wie von einem Vollmond zum nächsten.
    { un: 'i6', lz: '2', cat: 'natur', fr: 'bulan', de: 'der Mond, der Monat',
      deForms: ['der Mond', 'der Monat', 'der Mond, der Monat'] },
    { un: 'i6', lz: '2', cat: 'natur', fr: 'hujan', de: 'der Regen' },
    /* ── i6-3 · Farben ── */
    { un: 'i6', lz: '3', cat: 'sammel', fr: 'warna', de: 'die Farbe' },
    { un: 'i6', lz: '3', cat: 'farbe', fr: 'merah', de: 'rot' },
    { un: 'i6', lz: '3', cat: 'farbe', fr: 'kuning', de: 'gelb' },
    { un: 'i6', lz: '3', cat: 'farbe', fr: 'hijau', de: 'grün' },
    { un: 'i6', lz: '3', cat: 'farbe', fr: 'biru', de: 'blau' },
    { un: 'i6', lz: '3', cat: 'farbe', fr: 'putih', de: 'weiss' },
    { un: 'i6', lz: '3', cat: 'farbe', fr: 'hitam', de: 'schwarz' },
    // Die Farbe heisst wie die Schokolade. Das c spricht man wie tsch.
    { un: 'i6', lz: '3', cat: 'farbe', fr: 'cokelat', de: 'braun, die Schokolade',
      deForms: ['braun', 'die Schokolade', 'braun, die Schokolade'] },
    /* ── i6-4 · Wie ist es? ── */
    { un: 'i6', lz: '4', cat: 'wie', fr: 'besar', de: 'gross' },
    { un: 'i6', lz: '4', cat: 'wie', fr: 'kecil', de: 'klein' },
    // Das c spricht man wie tsch: tschepat.
    { un: 'i6', lz: '4', cat: 'wie', fr: 'cepat', de: 'schnell' },
    // Das c spricht man wie tsch: lutschu.
    { un: 'i6', lz: '4', cat: 'wie', fr: 'lucu', de: 'lustig, herzig', deForms: ['lustig', 'herzig', 'lustig, herzig'] },
    // So ist Percik eigentlich immer.
    { un: 'i6', lz: '4', cat: 'wie', fr: 'basah', de: 'nass' },
    { un: 'i6', lz: '4', cat: 'satz', fr: 'Landak itu kecil, gajah itu besar.', de: 'Der Igel ist klein, der Elefant ist gross.' },
    // Die Reihe: erst das Tier, dann die Farbe, zuletzt itu.
    { un: 'i6', lz: '4', cat: 'satz', fr: 'Kucing hitam itu lucu.', de: 'Die schwarze Katze ist herzig.' },
    { un: 'i6', lz: '4', cat: 'satz', fr: 'Percik basah sekali.', de: 'Percik ist sehr nass.' },
  ];

  /* =====================================================================
     Von Hand gepflegt: was sich aus den Einträgen nicht ableiten lässt.
     Alle Schlüssel sind Eintrags-Kennungen (un + '|' + fr).
     ===================================================================== */

  // Was das Französisch für sein Buch braucht, bleibt hier leer: Kein Eintrag hat Klammern oder
  // Schrägstriche, die mehr meinen (TEILE_VON_HAND, SPRICH_VON_HAND), keiner beginnt mit einem Artikel
  // (KEIN_ARTIKEL), und kein Wort steht zweimal in der Liste (GLEICHE_KARTE). Da sein müssen sie
  // trotzdem: kursAufbereiten und kursStrukturPruefen lesen sie.
  const TEILE_VON_HAND = {};
  const SPRICH_VON_HAND = {};
  const KEIN_ARTIKEL = new Set();
  const GLEICHE_KARTE = {};

  // Karten, die gleich klingen: keine. Indonesisch schreibt, wie es klingt, und keine zwei Karten der
  // Liste klingen gleich; zwei Bedeutungen eines Worts (tahu, bulan) stehen auf einer Karte.
  const KLANGGRUPPEN = [];
  const GLEICHKLANG = new Set(KLANGGRUPPEN.flat());

  // Karten, deren deutsche Zeilen fast dasselbe sagen: nie zusammen in einer Auswahl
  const NIE_ZUSAMMEN = [
    // Beides heisst «bitte»
    ['i1|tolong', 'i1|silakan'],
    // Auf «danke» antwortet man mit «bitte»
    ['i1|sama-sama', 'i1|silakan'],
    // Zwei Abschiede
    ['i1|sampai jumpa', 'i1|sampai besok'],
    // Am späten Abend sagt man beides
    ['i1|selamat malam', 'i1|selamat tidur'],
    // Um zwei Uhr ist schon Nachmittag, und man sagt noch siang
    ['i1|selamat siang', 'i1|selamat sore'],
    // Perciks Lob: gut, richtig, schön, super und cool passen auf dieselbe Antwort
    ['i1|baik', 'i1|betul', 'i1|bagus', 'i1|hebat', 'i1|keren'],
    // «fein» heisst auch «gut»
    ['i1|baik', 'i5|enak'],
    // «süss» heisst auch «herzig»
    ['i1|bagus', 'i5|manis', 'i6|lucu'],
    // «mögen» heisst in der Schweiz auch «wollen»
    ['i4|suka', 'i5|mau'],
    // Ein Bruch ist auch eine Zahl, die Hälfte und ein Viertel sind Brüche
    ['i2|angka', 'i2|pecahan'],
    ['i2|pecahan', 'i2|setengah'],
    ['i2|pecahan', 'i2|seperempat'],
    // Ein Baby ist auch ein Kind
    ['i3|anak, anak-anak', 'i3|bayi'],
    // Ein Badezimmer ist auch ein Zimmer
    ['i3|kamar', 'i3|kamar mandi'],
    // Dreimal Reis
    ['i5|nasi', 'i5|nasi goreng', 'i6|padi'],
    // Eine Eule ist auch ein Vogel
    ['i6|burung', 'i6|burung hantu'],
  ];

  // Namen in den Sätzen: bleiben auf den Kacheln gross und werden nie zur Lücke. Dazu gehören hier
  // auch der Tag und das Land, wo sie in einem Satz stehen («Besok hari Sabtu.», «… bahasa Indonesia.»).
  const EIGENNAMEN = ['Nea', 'Percik', 'Swis', 'Jawa', 'Indonesia', 'Sabtu'];

  // Die Wort-Einträge, die Grossbuchstaben tragen: die Sprachen (bahasa bleibt klein, das Land nicht)
  // und die Tage. Jeder andere Wort-Eintrag ist ganz klein geschrieben; pruefen() hält beides fest.
  const GROSS_WOERTER = ['bahasa Indonesia', 'bahasa Jerman', 'bahasa Prancis', 'bahasa Inggris',
    'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

  /* =====================================================================
     Aufnahmen
     ===================================================================== */

  // Mehr als ein Wort: nur dort lohnen sich die langsame Aufnahme und das Nachsprechen. SPRACHE.mehrWort
  // ist dasselbe Muster, so passen beide immer zusammen. Ein doppeltes Wort (kupu-kupu) zählt als eines:
  // Es klingt am Stück, und wie im Französisch (/[ ’]/) trennt der Bindestrich keine Wörter. Einen
  // Apostroph kennt das Indonesische nicht, also bleibt das Leerzeichen.
  const MEHR_WORT = / /;
  const langsamGibt = s => MEHR_WORT.test(s);

  // Aufnahme zu einem Eintrag, wie im Französisch (kursClip in vokabeln.js), nur mit Perciks Stimme:
  // 'i' ist das normale Tempo, 'il' das langsame. Die Dateien heissen darum i-… und il-….
  function vokabelClip(e, teil, form, langsam) {
    return B.kursClip(e, teil, form, langsam, { normal: 'i', langsam: 'il' }, langsamGibt);
  }

  /* =====================================================================
     Sprachprofil für Lernen.kurs (VERTRAG FÜR WEITERE KURSE in lernen.js)
     ===================================================================== */

  // Perciks Tastatur, wie die französische ohne die Akzentreihe. Der Bindestrich der doppelten Wörter
  // (anak-anak, kupu-kupu) steht unten neben dem m, das Leerzeichen gleich daneben.
  const reihen = ['q w e r t z u i o p', 'a s d f g h j k l back', 'y x c v b n m - leer ok'];

  const SPRACHE = {
    // Kein Artikel: Nichts wird zerlegt, auch Getipptes nicht («les» ist hier ein Wort), und keine
    // Kachel, kein Urteil und kein Ablenker fragt nach einem Artikel
    artikel: null,
    // Keine Akzente: keine Akzent-Übung, und beim Legen lockt kein Akzent
    akzente: {},
    schlicht: '',
    // Was beim Legen als Störbuchstabe lockt, der Reihe nach, nur a bis z. Die Paare, die ein Kind mit
    // deutschem Ohr und deutscher Schrift durcheinanderbringt:
    //   c ↔ k          c klingt wie tsch (kucing), sieht aber aus wie das c in «Computer», das ein k ist
    //   j ↔ y          das deutsche j schreibt Indonesisch y (saya), das indonesische j klingt wie dsch (jeruk)
    //   u ↔ o, e ↔ i   in der letzten Silbe liegen sie nah beieinander (burung, tikus; kecil, putih)
    //   a → e          kakak oder kakek: älteres Geschwister oder Grossvater
    //   b ↔ p, d ↔ t, g → k
    //                  p, t und k haben keinen Hauch und klingen für deutsche Ohren wie b, d und g (pagi,
    //                  tiga), und am Wortende hört man nicht, ob murid auf d oder t endet
    //   m ↔ n          wie in jeder Sprache
    // Die Kacheln sind hier alle klein (grosseKacheln unten), darum auch der Verwechsler eines grossen
    // Buchstabens: Das J von Jumat lockt mit einem y, nicht mit einem Y wie beim französischen «ACM».
    verwechsler: { c: 'k', k: 'c', j: 'y', y: 'j', u: 'o', o: 'u', e: 'i', i: 'e', a: 'e',
      b: 'p', p: 'b', d: 't', t: 'd', g: 'k', m: 'n', n: 'm' },
    // Gross geschrieben ist hier nur der Anfang eines Namens (Senin, bahasa Jerman). Eine grosse
    // Kachel verriete, wohin sie gehört: Alle Kacheln sind klein, und der Platz zeigt das S von
    // Senin gross. Die Störbuchstaben sind dann auch klein (das J von Jumat lockt mit einem y).
    grosseKacheln: false,
    // Ebenso bei finden und lauschen: «Senin» stünde sonst als einzige Antwort gross da, «apa?» als
    // einzige mit Fragezeichen
    schriftbild: true,
    // Die Nebenaufgaben je Stufe mit ihrem Grundgewicht, gebaut wie die französische Tabelle. Wo dort
    // Artikel und Akzente geübt werden, übt Indonesisch das Ohr: Seine Schrift folgt dem Klang, die
    // Hürde ist also, zu hören, welche Buchstaben ein Wort hat (c, j, y, ng, ny, das k am Ende).
    // Lauschen (hören und die Schreibweise unter ähnlichen wählen) und das Diktat üben genau das.
    // Stufe 0 bleibt leer wie im Französisch: Dort lernt Nea die Karte mit ihren zwei Checks kennen,
    // und der Planer fragt eine Karte auf Stufe 0 nie nach einer Nebenaufgabe.
    // Wörter:
    //   Stufe 1  lauschen 3          Das Französisch übt hier den Artikel. Indonesisch hört gleich nach
    //                                dem ersten Hören die Schreibweise heraus. 3 geht den Nebenaufgaben
    //                                der Wörter auf den höheren Stufen vor (höchstens 2), damit ein
    //                                frisches Wort zuerst übt, aber keiner Schwäche, die Nea schon
    //                                zeigte (ab 1 + 3 = 4).
    //   Stufe 2  finden 2, lauschen 2   wie im Französisch, ohne den Artikel
    //   Stufe 3  diktat 2, lauschen 1   wie im Französisch, ohne Akzent und Artikel
    //   Stufe 4  diktat 2, lauschen 1   wie im Französisch, ohne den Akzent (Stufe 5 übt wie Stufe 4)
    //   Ohne Ton wird lauschen zu finden, und das Diktat fällt weg (lernen.js): Jede Stufe behält finden.
    // Sätze wie im Französisch, dazu auf Stufe 1 die Lücke im Satz (2): das fehlende Wort unter vier
    // wählen, das Deutsche daneben; jedes Wort eines Satzes steht schon vorher als Karte in der Liste.
    // 2, nicht 3: Ein frisches Wort geht vor, denn aus den Wörtern sind die Sätze gebaut.
    neben: {
      wort: [[], [['lauschen', 3]], [['finden', 2], ['lauschen', 2]], [['diktat', 2], ['lauschen', 1]],
        [['diktat', 2], ['lauschen', 1]]],
      satz: [[], [['luecke', 2]], [['luecke', 3], ['bedeutung', 1]], [['luecke', 2], ['legen', 2], ['hoeren', 1]],
        [['legen', 2], ['ordnen', 1], ['luecke', 1]]],
    },
    // Ein Akzent von einer echten Tastatur («kúcing») ist ein falscher Buchstabe wie jeder andere,
    // nie «Akzent setzen»
    akzentUrteil: false,
    mehrWort: MEHR_WORT,
    // Die acht, die das Lernmodell immer schreibt; lelaLauf, lelaBest und akzent bleiben ohne Artikel
    // und Akzente bei 0. Dazu zwei für Perciks Erfolge: doppel, wie viele verschiedene Wörter mit
    // Bindestrich (kupu-kupu, sama-sama) Nea richtig geschrieben hat (indo_doppel), und echo, wie
    // oft sie nachgesprochen hat (indo_plauder). Fehlte ein Name hier, liesse pruefen() ihn aus dem
    // gespeicherten Stand fallen.
    zaehler: ['runden', 'perfekt', 'ohr', 'lelaLauf', 'lelaBest', 'akzent', 'saetze', 'geschrieben', 'doppel', 'echo'],
    // K bleibt, wie es ist: Runde, Abstände und Bremsen hängen an keiner Sprache, und das Kontingent
    // neuer Wörter führt jeder Kurs ohnehin in seinem eigenen Stand (neuProTag, tag.neu)
    K: {},
    // Die Tastatur fürs Schreiben als blosse Daten: für die Tasten in uebungen.js und für pruefen() und
    // pruefe.mjs, die damit prüfen, ob sich jede Form tippen lässt. tippbar wie im Französisch: jedes
    // Zeichen einer Taste, dazu das Leerzeichen. Eine Umschalttaste gibt es nicht; das Lernmodell
    // vergleicht ohne Gross und klein, «senin» ist also «Senin».
    tastatur: { reihen, akzente: [], tippbar: new Set(reihen.join(' ').split(' ').filter(k => k.length === 1).concat(' ')) },
  };

  /* =====================================================================
     Der Kurs: abgeleitet von kursAufbereiten (vokabeln.js) wie das
     Französisch, ohne Artikel und ohne Geschlecht. Jeder Eintrag bekommt
     nr, id, kid, g, art, teile, artikel (null), genus (null), plural,
     artikelTeil (-1), sprich, lernziele und deAlle.
     ===================================================================== */

  const kurs = {
    UNITES, UNITE_REIHE, VOKABELN, LERNZIELE: {}, LERNZIEL_REIHE: [], KARTEN: [], KARTE: {},
    TEILE_VON_HAND, SPRICH_VON_HAND, KEIN_ARTIKEL, GLEICHE_KARTE, KLANGGRUPPEN, GLEICHKLANG, NIE_ZUSAMMEN,
    EIGENNAMEN, GROSS_WOERTER, LERNZIEL_NAMEN,
    ohneKlammern: B.ohneKlammern, langsamGibt, vokabelClip,
    SPRACHE, pruefen,
  };
  B.kursAufbereiten(kurs, { artikel: null, genus: null, genusVon: {} });
  const { LERNZIEL_REIHE, KARTEN } = kurs;

  // Selbstkontrolle: kursStrukturPruefen (Schlüssel, Karten, Lernziele, Teile, Clips und die Listen
  // von Hand passen zusammen) und dazu alles, worauf sich Lernmodell, Aufnahmen, Album und Perciks
  // Texte verlassen, mit festen Zahlen: Ein Tippfehler in der Liste bliebe sonst still. Gibt eine
  // Liste von Fehlertexten zurück, leer heisst alles stimmt.
  function pruefen() {
    const fehler = B.kursStrukturPruefen(kurs);
    const soll = (was, ist, erwartet) => {
      if (ist !== erwartet) fehler.push(was + ': ' + ist + ' statt ' + erwartet);
    };
    // Zählt die Einträge je Wert und vergleicht mit der erwarteten Verteilung
    const verteilung = (was, liste, wert, erwartet) => {
      const ist = {};
      for (const x of liste) ist[wert(x)] = (ist[wert(x)] || 0) + 1;
      for (const w of new Set([...Object.keys(ist), ...Object.keys(erwartet)])) soll(was + ' «' + w + '»', ist[w] || 0, erwartet[w] || 0);
    };
    const nachId = new Map(VOKABELN.map(e => [e.id, e]));
    const formen = e => e.teile.flatMap(t => t.fr);
    const texte = e => [e.fr, e.sprich, ...formen(e)];
    // Die Wörter einer Zeile ohne die Satzzeichen dahinter
    const woerter = s => s.split(' ').map(w => w.replace(/[.,!?]+$/, '')).filter(Boolean);
    const woerterSatz = e => e.fr.split(/[ .,!?]+/).filter(Boolean);

    // Schlüssel, Karten und Gruppen
    soll('Einträge', VOKABELN.length, 223);
    soll('verschiedene id', new Set(VOKABELN.map(e => e.id)).size, 223);
    // Kein Wort steht zweimal in der Liste: Jeder Eintrag ist seine eigene Karte
    soll('Karten', KARTEN.length, 223);
    soll('verschiedene kid', new Set(VOKABELN.map(e => e.kid)).size, 223);
    soll('Plus-Einträge', VOKABELN.filter(e => e.plus).length, 0);
    verteilung('Pelajaran', VOKABELN, e => e.un, { i1: 45, i2: 32, i3: 32, i4: 41, i5: 34, i6: 39 });
    for (const un of UNITE_REIHE) soll('Name von ' + un, UNITES[un].name, 'Pelajaran ' + un.slice(1));
    soll('Lernziele', LERNZIEL_REIHE.length, 25);
    verteilung('Lernziel', VOKABELN, e => e.g, {
      'i1-1': 11, 'i1-2': 6, 'i1-3': 7, 'i1-4': 12, 'i1-5': 9,
      'i2-1': 11, 'i2-2': 6, 'i2-3': 8, 'i2-4': 7,
      'i3-1': 7, 'i3-2': 6, 'i3-3': 9, 'i3-4': 10,
      'i4-1': 6, 'i4-2': 11, 'i4-3': 12, 'i4-4': 12,
      'i5-1': 8, 'i5-2': 9, 'i5-3': 5, 'i5-4': 12,
      'i6-1': 12, 'i6-2': 11, 'i6-3': 8, 'i6-4': 8,
    });
    // Die Lernziele in der Reihenfolge ihrer Namen, also Pelajaran um Pelajaran von 1 an
    soll('Reihe der Lernziele', LERNZIEL_REIHE.join(' '), Object.keys(LERNZIEL_NAMEN).join(' '));
    for (const g of LERNZIEL_REIHE) if (!LERNZIEL_NAMEN[g]) fehler.push('Lernziel ohne eigenen Namen: ' + g);
    verteilung('Art', VOKABELN, e => e.art, { wort: 199, satz: 24 });
    // Die Wortgruppe lenkt die Ablenker: Ein Tippfehler bliebe sonst still
    verteilung('Wortgruppe', VOKABELN, e => e.cat, { gruss: 18, wie: 18, gram: 8, wer: 5, frage: 5, zahl: 17, rechnen: 7, sammel: 9,
      ding: 9, fam: 14, tier: 16, verb: 17, schule: 5, fach: 5, tag: 10, essen: 11, frucht: 7, natur: 11, farbe: 7, satz: 24 });

    // Teile und Formen: ein Paar (anak, anak-anak), sonst ein Teil mit einer Form
    const bau = e => (TEILE_VON_HAND[e.id] ? 'von Hand' : e.teile.length > 1 ? 'Paar' : e.teile[0].fr.length > 1 ? 'Synonyme'
      : e.teile[0].de.length > 1 ? 'deutsche Varianten' : 'einfach');
    verteilung('Bau', VOKABELN, bau, { einfach: 193, 'deutsche Varianten': 29, Paar: 1 });
    soll('Teile von «anak, anak-anak»', (nachId.get('i3|anak, anak-anak') || { teile: [] }).teile.map(t => t.fr.join(' + ') + ' = ' + t.de.join(' + ')).join(' | '),
      'anak = das Kind | anak-anak = die Kinder');
    // Höchstens zwei Formen je Teil: Perciks Tipp zur anderen Form (o_tipp_andere_form) ist fürs Diktat
    // geschrieben. Erst ab drei Formen hiesse es auch beim Schreiben nach dem Deutschen «andere_form».
    for (const e of VOKABELN) if (e.teile.some(t => t.fr.length > 2)) fehler.push('mehr als zwei Formen in einem Teil: ' + e.id);

    // Artikel und Geschlecht gibt es nicht: keine Artikel-Übung, kein Artikel-Platz, kein Kontrast
    for (const e of VOKABELN) {
      if (e.artikel !== null || e.genus !== null || e.plural !== false || e.artikelTeil !== -1) fehler.push('Artikel oder Geschlecht abgeleitet: ' + e.id);
    }

    // Schreibung: nur a bis z, Leerzeichen, Bindestrich und die Satzzeichen . , ! ?, ohne Leerzeichen
    // davor (wie im Deutschen) und ohne Apostroph. Die Stimme spricht genau, was auf der Karte steht.
    for (const e of VOKABELN) {
      for (const s of texte(e)) {
        if (/['’ʼ`´]/.test(s)) fehler.push('Apostroph: ' + e.id + ' → ' + s);
        if (/[^A-Za-z ,.!?-]/.test(s)) fehler.push('Zeichen ausserhalb von a bis z: ' + e.id + ' → ' + s);
        if (/ [,.!?]|  |^ | $/.test(s)) fehler.push('Leerzeichen am falschen Ort: ' + e.id + ' → ' + s);
        if (/(^|[^A-Za-z])-|-($|[^A-Za-z])/.test(s)) fehler.push('Bindestrich nicht zwischen zwei Buchstaben: ' + e.id + ' → ' + s);
      }
      if (e.sprich !== e.fr) fehler.push('Die Stimme spricht nicht, was auf der Karte steht: ' + e.id);
    }

    // Gross steht nur am Satzanfang, in den Namen und in GROSS_WOERTER: Sonst zeigte eine Kachel gross,
    // was klein gehört. Ein Wort ist nur vorn gross.
    for (const e of VOKABELN) {
      for (const w of texte(e).flatMap(woerter)) if (/[A-Z]/.test(w.slice(1))) fehler.push('Grossbuchstabe mitten im Wort: ' + e.id + ' → ' + w);
      if (e.art === 'satz') {
        if (!/^[A-Z]/.test(e.fr)) fehler.push('Satz beginnt klein: ' + e.id);
        if (!/[.!?]$/.test(e.fr)) fehler.push('Satz ohne Schlusszeichen: ' + e.id);
        const stuecke = e.fr.split(' ');
        stuecke.forEach((w, i) => {
          const anfang = i === 0 || /[.!?]$/.test(stuecke[i - 1]);
          if (!anfang && /^[A-Z]/.test(w) && !EIGENNAMEN.includes(w.replace(/[.,!?]+$/, ''))) fehler.push('gross mitten im Satz, kein Name: ' + e.id + ' → ' + w);
        });
      } else if (texte(e).some(s => /[A-Z]/.test(s)) !== GROSS_WOERTER.includes(e.fr)) {
        fehler.push('Grossschreibung passt nicht zu GROSS_WOERTER: ' + e.id);
      }
    }
    // Jedes Wort aus GROSS_WOERTER ist ein Wort-Eintrag, und gross ist sein Name am Schluss (der Tag,
    // das Land der Sprache); was davor steht (bahasa), bleibt klein
    soll('gross geschriebene Wort-Einträge', GROSS_WOERTER.length, 11);
    for (const g of GROSS_WOERTER) {
      const e = VOKABELN.find(x => x.fr === g), w = g.split(' ');
      if (!e || e.art !== 'wort') fehler.push('GROSS_WOERTER nennt keinen Wort-Eintrag: ' + g);
      if (!/^[A-Z][a-z]+$/.test(w[w.length - 1]) || w.slice(0, -1).some(x => /[A-Z]/.test(x))) fehler.push('GROSS_WOERTER nicht vorn am Namen gross: ' + g);
    }
    // Jeder Name ist gross und steht in einem Satz
    soll('Eigennamen', EIGENNAMEN.length, 6);
    for (const name of EIGENNAMEN) {
      if (!/^[A-Z][a-z]+$/.test(name)) fehler.push('Eigenname nicht vorn gross: ' + name);
      if (!VOKABELN.some(e => e.art === 'satz' && woerterSatz(e).includes(name))) fehler.push('Eigenname in keinem Satz: ' + name);
    }

    // Sätze: drei bis sechs Wörter (ordnen braucht mindestens drei), und jedes Wort ausser den Namen
    // steht schon vorher als Wort in der Liste. So kommt in einem Satz nur vor, was das Lernmodell in
    // der Reihenfolge der Liste schon eingeführt hat.
    const gelernt = new Set();
    for (const e of VOKABELN) {
      if (e.art === 'wort') {
        for (const w of formen(e).flatMap(woerter)) gelernt.add(w.toLowerCase());
        continue;
      }
      const w = woerterSatz(e);
      if (w.length < 3 || w.length > 6) fehler.push('Satz mit ' + w.length + ' Wörtern: ' + e.id);
      for (const x of w) if (!EIGENNAMEN.includes(x) && !gelernt.has(x.toLowerCase())) fehler.push('Wort im Satz noch nicht gelernt: ' + e.id + ' → ' + x);
    }

    // Tippen: Jede Form jedes Worts lässt sich auf Perciks Tastatur tippen, so wie das Lernmodell
    // vergleicht (klein, ein Satzzeichen zählt wie ein Leerzeichen: «apa kabar?» ist «apa kabar»)
    const { tippbar, reihen: tasten, akzente: akzentTasten } = SPRACHE.tastatur;
    soll('tippbare Zeichen', [...tippbar].sort().join(''), ' -abcdefghijklmnopqrstuvwxyz');
    soll('Tasten', tasten.join(' | '), 'q w e r t z u i o p | a s d f g h j k l back | y x c v b n m - leer ok');
    soll('Akzent-Tasten', akzentTasten.length, 0);
    for (const e of VOKABELN) {
      if (e.art !== 'wort') continue;
      for (const f of formen(e)) {
        const getippt = f.toLowerCase().replace(/[,.!?]/g, ' ').replace(/ +/g, ' ').trim();
        const fehlt = [...new Set(getippt)].filter(ch => !tippbar.has(ch));
        if (fehlt.length) fehler.push('nicht zu tippen: ' + e.id + ' → ' + f + ' (' + fehlt.join(' ') + ')');
      }
    }

    // Das Sprachprofil: Störbuchstaben nur aus a bis z, jeder ein anderer als sein Buchstabe; keine
    // Artikel- und keine Akzent-Aufgabe, und ab Stufe 1 hat jede Stufe eine Nebenaufgabe
    for (const [ch, v] of Object.entries(SPRACHE.verwechsler)) if (!/^[a-z]$/.test(ch) || !/^[a-z]$/.test(v) || ch === v) fehler.push('Verwechsler: ' + ch + ' → ' + v);
    for (const art of ['wort', 'satz']) {
      SPRACHE.neben[art].forEach((stufe, st) => {
        if (stufe.some(([u]) => u === 'artikel' || u === 'akzent')) fehler.push('Artikel oder Akzent als Nebenaufgabe: ' + art + ' Stufe ' + st);
        if (st > 0 && !stufe.length) fehler.push('keine Nebenaufgabe: ' + art + ' Stufe ' + st);
      });
    }

    // Aufnahmen: Stimme 'i' im normalen Tempo, 'il' langsam, langsam und nachgesprochen genau dort, wo
    // mehr als ein Wort ist, und wie viele es gibt. Eine Form, die schon als ganzer Eintrag klingt, ist
    // keine eigene Aufnahme.
    const stimmen = {};
    const clip = c => {
      if (c) (stimmen[c.v] || (stimmen[c.v] = new Set())).add(c.s);
    };
    for (const e of VOKABELN) {
      clip(vokabelClip(e));
      clip(vokabelClip(e, undefined, 0, true));
      e.teile.forEach((t, i) => t.fr.forEach((f, j) => {
        clip(vokabelClip(e, i, j));
        clip(vokabelClip(e, i, j, true));
      }));
      for (const s of texte(e)) if (SPRACHE.mehrWort.test(s) !== langsamGibt(s)) fehler.push('mehrWort und langsamGibt uneins: ' + e.id);
    }
    soll('Stimmen der Clips', Object.keys(stimmen).sort().join(' '), 'i il');
    const ton = { wort: new Set(VOKABELN.map(e => e.sprich)) };
    ton.form = new Set(VOKABELN.flatMap(formen).filter(f => !ton.wort.has(f)));
    ton.wortLangsam = new Set([...ton.wort].filter(langsamGibt));
    ton.formLangsam = new Set([...ton.form].filter(langsamGibt));
    soll('Eintrags-Clips', ton.wort.size, 223);
    soll('Form-Clips', ton.form.size, 2);
    soll('langsame Eintrags-Clips', ton.wortLangsam.size, 55);
    soll('langsame Form-Clips', ton.formLangsam.size, 0);
    soll('indonesische Aufnahmen', ton.wort.size + ton.form.size + ton.wortLangsam.size + ton.formLangsam.size, 280);
    soll('Aufnahmen mit Stimme i', (stimmen.i || new Set()).size, 225);
    soll('Aufnahmen mit Stimme il', (stimmen.il || new Set()).size, 55);

    // Buchstaben je Wortform: bis 14 wird jeder Buchstabe gelegt, darüber fehlt nur ein Wort
    const wortformen = VOKABELN.filter(e => e.art === 'wort').flatMap(formen);
    soll('Wortformen', wortformen.length, 200);
    soll('Wortformen über 14 Buchstaben', wortformen.filter(f => (f.match(/\p{L}/gu) || []).length > 14).join(' | '), 'bahasa Indonesia');

    // Das Deutsche in Schweizer Schreibung
    const deutsch = [...UNITE_REIHE.map(un => UNITES[un].titel), ...Object.values(LERNZIEL_NAMEN),
      ...VOKABELN.flatMap(e => [e.de, ...(e.deForms || []), ...e.teile.flatMap(t => t.de)])];
    for (const d of deutsch) if (/ß/.test(d)) fehler.push('ß im Deutschen: ' + d);

    return fehler;
  }

  return kurs;
})();

if (typeof module !== 'undefined') module.exports = VOK_INDO;
