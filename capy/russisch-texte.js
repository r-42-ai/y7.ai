'use strict';

/* =====================================================================
   RUSSISCH MIT DEM LAMA
   Capys Freundin ist ein Lama aus Russland. Sie bringt Yuna Russisch bei,
   ohne Vorwissen: zuerst die Buchstaben (14 Stationen, 33 Buchstaben),
   mit jeder Station Wörter, die sich mit den schon bekannten Buchstaben
   lesen lassen, kleine Sätze und «Zauberwörter» zum Nachsprechen.

   Alles, was das Lama sagt, wird mit make-audio.mjs vertont (Stimme «l»),
   Capys Sätze hier mit Capys Stimme («c»). Neue Einträge ergänzen und
   danach
     node capy/pruefe.mjs        prüft, ob jedes Wort zur Station passt
     node capy/make-audio.mjs    vertont, was fehlt

   Zeilen des Lamas: Russisches steht in geschweiften Klammern und ist eine
   eigene Aufnahme, der Rest ist Deutsch (mit Akzent, sie kommt ja aus
   Russland):  '{Молодец!} Das war richtig.'
   %name% wird durch den Namen ersetzt, den Yuna ausgesucht hat; solche
   Zeilen gibt es für jeden Namen einmal als Aufnahme.
   Die Umschrift (um) ist deutsch, der Akzent zeigt die betonte Silbe.
   ===================================================================== */

const LAMA = {
  // ElevenLabs «Mila Svetlova – Russian Fairy»: jung, verspielt, Muttersprache Russisch
  stimme: 'RxivyypsDodFBfmDDOZF',
  // Zur Wahl, wenn das Lama ankommt. Yuna sucht aus; ändern geht in der Russisch-Ecke.
  namen: [
    { id: 'puschinka', de: 'Puschinka', ru: 'Пушинка', heisst: 'Flöckchen',
      satz: 'Ich heisse Puschinka! Das heisst Flöckchen, weil ich so flauschig bin.' },
    { id: 'mascha', de: 'Mascha', ru: 'Маша', heisst: 'ein russischer Mädchenname',
      satz: 'Ich heisse Mascha! So heissen in Russland ganz viele Mädchen.' },
    { id: 'mila', de: 'Mila', ru: 'Мила', heisst: 'lieb',
      satz: 'Ich heisse Mila! Das bedeutet lieb.' },
    { id: 'bublik', de: 'Bublik', ru: 'Бублик', heisst: 'Kringel',
      satz: 'Ich heisse Bublik! So heisst in Russland ein runder Kringel zum Knabbern. Lecker!' },
  ],
};

/* ---------- Buchstaben ----------
   art      freund: sieht aus wie bei uns und klingt auch so
            schwindler: sieht aus wie einer von unseren, sagt aber etwas anderes
            neu: gibt es bei uns nicht
   name     so spricht das Lama den Buchstaben
   laut     so steht er bei «Wie klingt er?» zur Wahl (fehlt: diese Aufgabe nicht)
   falle    unser Buchstabe, mit dem man ihn verwechseln kann
   wort     Merkwort mit Bild (steht in WOERTER)
   text     was das Lama erklärt                                       */
const BUCHSTABEN = [
  { b: 'А', k: 'а', art: 'freund', name: 'а', laut: 'A', wort: 'арбуз',
    text: 'Ein echter Freund! Er sieht aus wie unser A und klingt auch so.' },
  { b: 'О', k: 'о', art: 'freund', name: 'о', laut: 'O', wort: 'облако',
    text: 'Noch ein echter Freund! Er sieht aus wie unser O und klingt auch so.' },
  { b: 'К', k: 'к', art: 'freund', name: 'ка', laut: 'K', wort: 'кот',
    text: 'Ein echter Freund! Er sieht aus wie unser K und klingt auch so.' },
  { b: 'Т', k: 'т', art: 'freund', name: 'тэ', laut: 'T', wort: 'томат',
    text: 'Ein echter Freund! Er sieht aus wie unser T und klingt auch so.' },
  { b: 'М', k: 'м', art: 'freund', name: 'эм', laut: 'M', wort: 'мама',
    text: 'Ein echter Freund! Er sieht aus wie unser M und klingt auch so.' },
  { b: 'Э', k: 'э', art: 'neu', name: 'э', laut: 'E', falle: 'C', wort: 'эскимо',
    text: 'Ein neuer Buchstabe! Er sieht aus wie ein umgedrehtes C mit einem Strich und sagt E, wie in Esel.' },
  { b: 'Л', k: 'л', art: 'neu', name: 'эль', laut: 'L', wort: 'лама',
    text: 'Ein neuer Buchstabe! Er sieht aus wie ein kleines Zelt und sagt L, wie in Lama. Das bin ich!' },
  { b: 'Н', k: 'н', art: 'schwindler', name: 'эн', laut: 'N', falle: 'H', wort: 'нос',
    text: 'Achtung, ein Schwindler! Er sieht aus wie unser H, sagt aber N, wie in Nase.' },
  { b: 'И', k: 'и', art: 'neu', name: 'и', laut: 'I', falle: 'N', wort: 'индюк',
    text: 'Ein neuer Buchstabe! Er sieht aus wie ein verkehrtes N und sagt I, wie in Igel.' },
  { b: 'С', k: 'с', art: 'schwindler', name: 'эс', laut: 'S', falle: 'C', wort: 'слон',
    text: 'Ein Schwindler! Er sieht aus wie unser C, sagt aber S, wie eine zischende Schlange.' },
  { b: 'Р', k: 'р', art: 'schwindler', name: 'эр', laut: 'R', falle: 'P', wort: 'рыба',
    text: 'Ein Schwindler! Er sieht aus wie unser P, sagt aber R. Und das R wird schön gerollt!' },
  { b: 'В', k: 'в', art: 'schwindler', name: 'вэ', laut: 'W', falle: 'B', wort: 'волк',
    text: 'Ein Schwindler! Er sieht aus wie unser B, sagt aber W, wie in Wolke.' },
  { b: 'У', k: 'у', art: 'schwindler', name: 'у', laut: 'U', falle: 'Y', wort: 'утка',
    text: 'Ein Schwindler! Er sieht aus wie unser Y, sagt aber U, wie in Uhu.' },
  { b: 'Е', k: 'е', art: 'schwindler', name: 'е', laut: 'JE', falle: 'E', wort: 'енот',
    text: 'Fast ein Freund! Er sieht aus wie unser E, klingt aber wie der Anfang von jetzt.' },
  { b: 'Б', k: 'б', art: 'neu', name: 'бэ', laut: 'B', wort: 'белка',
    text: 'Ein neuer Buchstabe! Er sieht aus wie eine Sechs mit Dach und sagt B, wie in Ball.' },
  { b: 'Д', k: 'д', art: 'neu', name: 'дэ', laut: 'D', wort: 'дом',
    text: 'Ein neuer Buchstabe! Er sieht aus wie ein kleines Haus und sagt D, wie in Dach.' },
  { b: 'П', k: 'п', art: 'neu', name: 'пэ', laut: 'P', falle: 'N', wort: 'папа',
    text: 'Ein neuer Buchstabe! Er sieht aus wie ein Tor und sagt P, wie in Papa.' },
  { b: 'Г', k: 'г', art: 'neu', name: 'гэ', laut: 'G', falle: 'L', wort: 'гриб',
    text: 'Ein neuer Buchstabe! Er sieht aus wie ein umgedrehtes L und sagt G, wie in Garten.' },
  { b: 'Я', k: 'я', art: 'neu', name: 'я', laut: 'JA', falle: 'R', wort: 'яблоко',
    text: 'Ein neuer Buchstabe! Er sieht aus wie ein verkehrtes R und sagt ja. Ganz allein heisst er auf Russisch: ich!' },
  { b: 'Ю', k: 'ю', art: 'neu', name: 'ю', laut: 'JU', falle: 'IO', wort: 'Юна',
    text: 'Ein neuer Buchstabe! Er sieht aus wie ein I und ein O zusammen und klingt wie der Anfang von Yuna!' },
  { b: 'Ы', k: 'ы', art: 'neu', name: 'ы', wort: 'сыр',
    text: 'Ein lustiger Laut, den es bei uns nicht gibt! Er klingt wie ein dunkles I und steht nie am Anfang.' },
  { b: 'Ж', k: 'ж', art: 'neu', name: 'жэ', wort: 'жук',
    text: 'Ein neuer Buchstabe! Er sieht aus wie ein Käfer und klingt weich, wie das G in Garage.' },
  { b: 'З', k: 'з', art: 'neu', name: 'зэ', wort: 'зебра',
    text: 'Ein neuer Buchstabe! Er sieht aus wie eine Drei und summt wie eine Biene, wie das S in Sonne.' },
  { b: 'Ш', k: 'ш', art: 'neu', name: 'ша', laut: 'SCH', falle: 'W', wort: 'шар',
    text: 'Ein neuer Buchstabe! Er sieht aus wie ein Kamm und klingt wie der Anfang von Schule.' },
  { b: 'Ч', k: 'ч', art: 'neu', name: 'че', laut: 'TSCH', falle: '4', wort: 'часы',
    text: 'Ein neuer Buchstabe! Er sieht aus wie eine Vier und klingt wie der Anfang von Tschüss.' },
  { b: 'Х', k: 'х', art: 'schwindler', name: 'ха', laut: 'CH', falle: 'X', wort: 'хомяк',
    text: 'Ein Schwindler! Er sieht aus wie unser X, klingt aber wie das Ende von Bach.' },
  { b: 'Й', k: 'й', art: 'neu', name: 'и краткое', wort: 'йо-йо',
    text: 'Das ist das I mit einem Hütchen. Es klingt ganz kurz, wie das J in Ja.' },
  { b: 'Ф', k: 'ф', art: 'neu', name: 'эф', laut: 'F', wort: 'фламинго',
    text: 'Ein neuer Buchstabe! Er sieht aus wie ein Kreis mit einem Strich und sagt F, wie in Fisch.' },
  { b: 'Ц', k: 'ц', art: 'neu', name: 'цэ', laut: 'Z', wort: 'цирк',
    text: 'Ein neuer Buchstabe! Er hat unten ein kleines Schwänzchen und sagt Z, wie in Zebra.' },
  { b: 'Ё', k: 'ё', art: 'neu', name: 'ё', laut: 'JO', falle: 'E', wort: 'ёж',
    text: 'Das ist das E mit zwei Pünktchen. Es klingt wie der Anfang von Joghurt.' },
  { b: 'Ь', k: 'ь', art: 'neu', name: 'мягкий знак', wort: 'соль',
    text: 'Das ist ein stilles Zeichen. Es macht keinen Laut, sondern macht den Buchstaben davor ganz weich.' },
  { b: 'Щ', k: 'щ', art: 'neu', name: 'ща', wort: 'щенок',
    text: 'Das ist das Sch mit einem Schwänzchen. Es klingt wie das Ende von Fisch, nur länger und weicher.' },
  { b: 'Ъ', k: 'ъ', art: 'neu', name: 'твёрдый знак',
    text: 'Das ist das harte Zeichen. Es ist ganz still, kommt fast nie vor und macht nur eine kleine Pause.' },
];
// Reihenfolge im russischen Alphabet (für die Alphabet-Tafel)
const ALPHABET = 'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ'.split('');

/* ---------- Stationen: welche Buchstaben wann dazukommen ----------
   start: was das Lama zu Beginn sagt · farbe: die Matrjoschka auf der Karte */
const STATIONEN = [
  { nr: 1,  b: ['А', 'О', 'К', 'Т', 'М'], farbe: '#E0564A',
    start: 'Wir fangen mit fünf echten Freunden an. Die sehen aus wie unsere Buchstaben und klingen auch so. Leicht, oder?' },
  { nr: 2,  b: ['Э', 'Л'], farbe: '#F08A1C',
    start: 'Heute kommen zwei neue Buchstaben. Und dann liest du deinen allerersten russischen Satz!' },
  { nr: 3,  b: ['Н', 'И'], farbe: '#E9B400',
    start: 'Heute triffst du den ersten Schwindler. Pass gut auf!' },
  { nr: 4,  b: ['С', 'Р'], farbe: '#6CC955',
    start: 'Heute kommen gleich zwei Schwindler. Lass dich nicht reinlegen!' },
  { nr: 5,  b: ['В', 'У'], farbe: '#2FAE9A',
    start: 'Noch zwei Schwindler! Du bist schon richtig gut.' },
  { nr: 6,  b: ['Е', 'Б'], farbe: '#3D9BE0',
    start: 'Heute lernst du einen neuen Buchstaben und einen kleinen Schwindler.' },
  { nr: 7,  b: ['Д', 'П'], farbe: '#6C5BD0',
    start: 'Heute lernst du zwei neue Buchstaben. Einer sieht aus wie ein Haus!' },
  { nr: 8,  b: ['Г', 'Я'], farbe: '#B45BC9',
    start: 'Heute kommt ein ganz wichtiger Buchstabe. Er heisst: ich!' },
  { nr: 9,  b: ['Ю', 'Ы'], farbe: '#F0558A',
    start: 'Heute lernst du, wie man deinen Namen auf Russisch schreibt!' },
  { nr: 10, b: ['Ж', 'З'], farbe: '#E0564A',
    start: 'Heute kommt ein Buchstabe, der aussieht wie ein Käfer!' },
  { nr: 11, b: ['Ш', 'Ч'], farbe: '#F08A1C',
    start: 'Heute kommen zwei Buchstaben, die zischen!' },
  { nr: 12, b: ['Х', 'Й'], farbe: '#2FAE9A',
    start: 'Heute lernst du, wie man auf Russisch fragt: Wie geht es dir?' },
  { nr: 13, b: ['Ф', 'Ц', 'Ё'], farbe: '#3D9BE0',
    start: 'Fast geschafft! Heute kommen ein Flamingo, ein Igel und ein Tannenbaum.' },
  { nr: 14, b: ['Ь', 'Щ', 'Ъ'], farbe: '#B45BC9',
    start: 'Die letzte Station! Heute lernst du die stillen Zeichen. Und dann sind wir Freunde auf Russisch!' },
];

/* ---------- Wörter ----------
   st: Station, ab der es sich lesen lässt (alle Buchstaben sind dann bekannt)
   merk: nur Merkwort eines Buchstabens (wird gehört und gezeigt, nicht abgefragt)
   gruppe: Wörter mit gleichem Bild-Sinn kommen nie zusammen zur Wahl
   sagt: was das Lama danach auf Deutsch sagt (sonst «Das heisst …»)        */
const WOERTER = [
  { ru: 'кот', de: 'Katze', bild: '🐱', st: 1 },
  { ru: 'мама', de: 'Mama', bild: '👩', st: 1 },
  { ru: 'томат', de: 'Tomate', bild: '🍅', st: 1 },
  { ru: 'какао', de: 'Kakao', bild: '☕', st: 1 },
  { ru: 'лама', de: 'Lama', bild: '🦙', st: 2, sagt: 'Das heisst Lama. So wie ich!' },
  { ru: 'кола', de: 'Cola', bild: '🥤', st: 2 },
  { ru: 'кино', de: 'Kino', bild: '🎬', st: 3 },
  { ru: 'лимон', de: 'Zitrone', bild: '🍋', st: 3 },
  { ru: 'нота', de: 'Note', bild: '🎵', st: 3 },
  { ru: 'сок', de: 'Saft', bild: '🧃', st: 4 },
  { ru: 'нос', de: 'Nase', bild: '👃', st: 4 },
  { ru: 'рот', de: 'Mund', bild: '👄', st: 4 },
  { ru: 'слон', de: 'Elefant', bild: '🐘', st: 4 },
  { ru: 'торт', de: 'Torte', bild: '🎂', st: 4 },
  { ru: 'лиса', de: 'Fuchs', bild: '🦊', st: 4 },
  { ru: 'утка', de: 'Ente', bild: '🦆', st: 5 },
  { ru: 'волк', de: 'Wolf', bild: '🐺', st: 5 },
  { ru: 'сова', de: 'Eule', bild: '🦉', st: 5 },
  { ru: 'рука', de: 'Hand', bild: '✋', st: 5 },
  { ru: 'клоун', de: 'Clown', bild: '🤡', st: 5 },
  { ru: 'банан', de: 'Banane', bild: '🍌', st: 6 },
  { ru: 'белка', de: 'Eichhörnchen', bild: '🐿️', st: 6 },
  { ru: 'бобр', de: 'Biber', bild: '🦫', st: 6 },
  { ru: 'енот', de: 'Waschbär', bild: '🦝', st: 6 },
  { ru: 'собака', de: 'Hund', bild: '🐕', st: 6, gruppe: 'hund' },
  { ru: 'метро', de: 'U-Bahn', bild: '🚇', st: 6 },
  { ru: 'дом', de: 'Haus', bild: '🏠', st: 7 },
  { ru: 'папа', de: 'Papa', bild: '👨', st: 7 },
  { ru: 'суп', de: 'Suppe', bild: '🍲', st: 7 },
  { ru: 'панда', de: 'Panda', bild: '🐼', st: 7 },
  { ru: 'паук', de: 'Spinne', bild: '🕷️', st: 7 },
  { ru: 'подарок', de: 'Geschenk', bild: '🎁', st: 7 },
  { ru: 'гриб', de: 'Pilz', bild: '🍄', st: 8 },
  { ru: 'тигр', de: 'Tiger', bild: '🐯', st: 8 },
  { ru: 'яблоко', de: 'Apfel', bild: '🍎', st: 8 },
  { ru: 'гора', de: 'Berg', bild: '⛰️', st: 8 },
  { ru: 'пингвин', de: 'Pinguin', bild: '🐧', st: 8 },
  { ru: 'ягода', de: 'Beere', bild: '🫐', st: 8 },
  { ru: 'Юна', de: 'Yuna', bild: '👧', st: 9, sagt: 'Das ist dein Name, Yuna!' },
  { ru: 'сыр', de: 'Käse', bild: '🧀', st: 9 },
  { ru: 'рыба', de: 'Fisch', bild: '🐟', st: 9 },
  { ru: 'дыня', de: 'Melone', bild: '🍈', st: 9 },
  { ru: 'салют', de: 'Feuerwerk', bild: '🎆', st: 9 },
  { ru: 'жук', de: 'Käfer', bild: '🪲', st: 10 },
  { ru: 'зима', de: 'Winter', bild: '❄️', st: 10 },
  { ru: 'зебра', de: 'Zebra', bild: '🦓', st: 10 },
  { ru: 'роза', de: 'Rose', bild: '🌹', st: 10 },
  { ru: 'звезда', de: 'Stern', bild: '⭐', st: 10 },
  { ru: 'зуб', de: 'Zahn', bild: '🦷', st: 10 },
  { ru: 'шар', de: 'Ballon', bild: '🎈', st: 11 },
  { ru: 'машина', de: 'Auto', bild: '🚗', st: 11 },
  { ru: 'мышка', de: 'Maus', bild: '🐭', st: 11 },
  { ru: 'шоколад', de: 'Schokolade', bild: '🍫', st: 11 },
  { ru: 'очки', de: 'Brille', bild: '👓', st: 11 },
  { ru: 'часы', de: 'Uhr', bild: '⌚', st: 11 },
  { ru: 'хлеб', de: 'Brot', bild: '🍞', st: 12 },
  { ru: 'муха', de: 'Fliege', bild: '🪰', st: 12 },
  { ru: 'хомяк', de: 'Hamster', bild: '🐹', st: 12 },
  { ru: 'черепаха', de: 'Schildkröte', bild: '🐢', st: 12 },
  { ru: 'чай', de: 'Tee', bild: '🍵', st: 12 },
  { ru: 'хоккей', de: 'Eishockey', bild: '🏒', st: 12 },
  { ru: 'фламинго', de: 'Flamingo', bild: '🦩', st: 13 },
  { ru: 'жираф', de: 'Giraffe', bild: '🦒', st: 13 },
  { ru: 'цветок', de: 'Blume', bild: '🌸', st: 13 },
  { ru: 'цирк', de: 'Zirkus', bild: '🎪', st: 13 },
  { ru: 'заяц', de: 'Hase', bild: '🐇', st: 13 },
  { ru: 'ёж', de: 'Igel', bild: '🦔', st: 13 },
  { ru: 'ёлка', de: 'Tannenbaum', bild: '🎄', st: 13 },
  { ru: 'лошадь', de: 'Pferd', bild: '🐎', st: 14 },
  { ru: 'медведь', de: 'Bär', bild: '🐻', st: 14 },
  { ru: 'щенок', de: 'Welpe', bild: '🐶', st: 14, gruppe: 'hund' },
  { ru: 'соль', de: 'Salz', bild: '🧂', st: 14 },
  { ru: 'овощи', de: 'Gemüse', bild: '🥦', st: 14 },
  // Merkwörter einzelner Buchstaben
  { ru: 'арбуз', de: 'Wassermelone', bild: '🍉', merk: true },
  { ru: 'облако', de: 'Wolke', bild: '☁️', merk: true },
  { ru: 'эскимо', de: 'Glace', bild: '🍦', merk: true },
  { ru: 'индюк', de: 'Truthahn', bild: '🦃', merk: true },
  { ru: 'йо-йо', de: 'Jo-Jo', bild: '🪀', merk: true },
];

/* ---------- Sätze (lesen, verstehen, bauen) ---------- */
const SAETZE = [
  { ru: 'Это кот.', de: 'Das ist eine Katze.', bild: '🐱', st: 2 },
  { ru: 'Это лама.', de: 'Das ist ein Lama.', bild: '🦙', st: 2 },
  { ru: 'Мама и кот.', de: 'Mama und die Katze.', bild: '👩🐱', st: 3 },
  { ru: 'Это слон.', de: 'Das ist ein Elefant.', bild: '🐘', st: 4 },
  { ru: 'Вот утка.', de: 'Da ist eine Ente.', bild: '🦆', st: 5 },
  { ru: 'Вот собака.', de: 'Da ist ein Hund.', bild: '🐕', st: 6 },
  { ru: 'Папа и мама дома.', de: 'Papa und Mama sind zu Hause.', bild: '👨👩🏠', st: 7 },
  { ru: 'Я тигр!', de: 'Ich bin ein Tiger!', bild: '🐯', st: 8 },
  { ru: 'Я Юна.', de: 'Ich bin Yuna.', bild: '👧', st: 9 },
  { ru: 'Это зебра.', de: 'Das ist ein Zebra.', bild: '🦓', st: 10 },
  { ru: 'Это моя шапка.', de: 'Das ist meine Mütze.', bild: '🧢', st: 11 },
  { ru: 'Это мой дом.', de: 'Das ist mein Haus.', bild: '🏠', st: 12 },
  { ru: 'Вот ёж.', de: 'Da ist ein Igel.', bild: '🦔', st: 13 },
  { ru: 'Мы друзья!', de: 'Wir sind Freunde!', bild: '🦙❤️👧', st: 14 },
];

/* ---------- Zauberwörter: hören und nachsprechen ----------
   Sie kommen früh, auch wenn noch nicht alle Buchstaben bekannt sind;
   darum steht die Umschrift (um) dabei. zahl: Zahlwort, Bild ist die Ziffer */
const ZAUBERWOERTER = [
  { ru: 'Привет!', um: 'Priwjét!', de: 'Hallo!', bild: '🙋', st: 1 },
  { ru: 'Пока!', um: 'Paká!', de: 'Tschüss!', bild: '👋', st: 1 },
  { ru: 'Да!', um: 'Da!', de: 'Ja!', bild: '👍', st: 2 },
  { ru: 'Нет!', um: 'Njet!', de: 'Nein!', bild: '👎', st: 2 },
  { ru: 'Спасибо!', um: 'Spassíba!', de: 'Danke!', bild: '🙏', st: 3 },
  { ru: 'один', um: 'adín', de: 'eins', zahl: 1, st: 3 },
  { ru: 'два', um: 'dwa', de: 'zwei', zahl: 2, st: 3 },
  { ru: 'три', um: 'tri', de: 'drei', zahl: 3, st: 3 },
  { ru: 'Как дела?', um: 'Kak delá?', de: 'Wie geht es dir?', bild: '🙂', st: 4 },
  { ru: 'Хорошо!', um: 'Charaschó!', de: 'Gut!', bild: '😄', st: 4 },
  { ru: 'четыре', um: 'tschetýre', de: 'vier', zahl: 4, st: 5 },
  { ru: 'пять', um: 'pjat', de: 'fünf', zahl: 5, st: 5 },
  { ru: 'Пожалуйста!', um: 'Paschálsta!', de: 'Bitte!', bild: '🤲', st: 6 },
  { ru: 'Меня зовут Юна.', um: 'Minjá sawút Juna.', de: 'Ich heisse Yuna.', bild: '👧', st: 7 },
  { ru: 'шесть', um: 'schest', de: 'sechs', zahl: 6, st: 7 },
  { ru: 'семь', um: 'sjem', de: 'sieben', zahl: 7, st: 7 },
  { ru: 'Доброе утро!', um: 'Dóbraje útra!', de: 'Guten Morgen!', bild: '🌅', st: 8 },
  { ru: 'Спокойной ночи!', um: 'Spakójnaj nótschi!', de: 'Gute Nacht!', bild: '🌙', st: 9 },
  { ru: 'восемь', um: 'wóssem', de: 'acht', zahl: 8, st: 9 },
  { ru: 'девять', um: 'djéwjat', de: 'neun', zahl: 9, st: 9 },
  { ru: 'десять', um: 'djéssjat', de: 'zehn', zahl: 10, st: 9 },
  { ru: 'Я тебя люблю!', um: 'Ja tibjá ljubljú!', de: 'Ich hab dich lieb!', bild: '❤️', st: 10 },
  { ru: 'С днём рождения!', um: 'S dnjom raschdénija!', de: 'Alles Gute zum Geburtstag!', bild: '🥳', st: 11 },
  { ru: 'Как тебя зовут?', um: 'Kak tibjá sawút?', de: 'Wie heisst du?', bild: '❓', st: 12 },
  { ru: 'Ура!', um: 'Urá!', de: 'Hurra!', bild: '🎉', st: 13 },
  { ru: 'До свидания!', um: 'Da swidánja!', de: 'Auf Wiedersehen!', bild: '🚪', st: 14 },
];

/* ---------- Was das Lama sagt ---------- */
const LAMA_TEXTE = {
  // Ankunft bei Capy
  ankunft: ['{Привет!} Das heisst Hallo! Ich bin ein Lama und komme aus Russland, von ganz weit weg.'],
  ohne_name: ['Ich habe noch keinen Namen. Such mir einen aus!'],
  anderer_name: ['Wie soll ich heissen? Such dir einen Namen aus!'],
  lernen: ['Möchtest du mit mir Russisch lernen? Unsere Buchstaben sehen ganz anders aus. Ich zeig sie dir!'],
  spaeter: ['Kein Problem! Tipp einfach auf mich, wenn du Lust hast.'],

  // In der Russisch-Ecke, auf der Karte
  karte: [
    '{Привет, Юна!} Was machen wir heute?',
    '{Привет!} Schön, dass du da bist. Weiter geht es!',
    '{Привет!} Tipp auf die leuchtende Matrjoschka, dann lernen wir weiter.',
  ],
  karte_erste: ['Jede Matrjoschka ist eine Station. Tipp auf die erste, dann geht es los!'],
  karte_fertig: ['Du hast alle Stationen geschafft! Du kannst jetzt alle russischen Buchstaben. Ich bin so stolz auf dich!'],
  gesperrt: ['Diese Station kommt später. Zuerst die davor!'],
  wdh_start: ['Wir wiederholen, was du schon kannst.', 'Eine Runde wiederholen. Mal sehen, was du noch weisst!'],
  abc: ['Das ist das russische Alphabet. Tipp auf einen Buchstaben, dann sage ich ihn dir.'],
  woerter: ['Das sind alle Wörter, die du schon kennst. Tipp drauf, dann sage ich sie dir. Zweimal tippen: ganz langsam.'],
  woerter_leer: ['Hier sammeln wir deine russischen Wörter. Bald kommen die ersten dazu!'],
  ton_aus: ['Mein Ton ist aus. Tipp oben auf den Lautsprecher, damit du mich hörst!'],

  // Neues kennenlernen
  wort_neu: ['Ein neues Wort!', 'Schau mal, ein neues Wort!', 'Und noch ein Wort!'],
  satz_neu: ['Jetzt kommt ein ganzer Satz!', 'Ein neuer Satz!'],
  zauber_neu: ['Ein Zauberwort! Hör zu und sag es laut nach.', 'Noch ein Zauberwort! Sag es mir nach.'],
  zahlen_neu: ['Wir zählen auf Russisch! Tipp auf eine Zahl und sag sie nach.'],
  gesagt: ['{Молодец!} Das klang schon richtig russisch!', '{Здорово!} Super gesagt!', '{Отлично!} Genau so!'],

  // Aufgaben
  b_hoeren: ['Welchen Buchstaben hörst du?', 'Hör gut zu! Welcher Buchstabe ist das?'],
  b_laut: ['Wie klingt dieser Buchstabe?', 'Welcher von unseren Buchstaben passt dazu?'],
  b_bild: ['Welches Bild gehört zu diesem Buchstaben?'],
  w_lesen: ['Lies das Wort! Welches Bild passt?', 'Was steht da? Tipp auf das Bild.'],
  w_bild: ['Welches Wort passt zum Bild?', 'Wie heisst das auf Russisch? Tipp auf das Wort.'],
  w_hoeren: ['Hör zu! Welches Wort sage ich?', 'Welches Wort hörst du?'],
  w_legen: ['Bau das Wort! Tipp die Buchstaben der Reihe nach.', 'Leg das Wort mit den Buchstaben.'],
  s_lesen: ['Lies den Satz! Was heisst das?', 'Was bedeutet dieser Satz?'],
  s_bauen: ['Bau den Satz! Tipp die Wörter der Reihe nach.'],
  z_hoeren: ['Hör zu! Was heisst das?', 'Was bedeutet dieses Zauberwort?'],
  zahl_hoeren: ['Welche Zahl sage ich?'],
  paare: ['Zum Schluss: Finde die Paare! Tipp auf ein Wort und dann auf das passende Bild.'],

  // Rückmeldung
  richtig: ['{Молодец!}', '{Правильно!}', '{Отлично!}', '{Ура!}', '{Здорово!}', '{Умница!}', '{Класс!}', '{Да!} Genau!'],
  falsch: [
    '{Ой!} Fast. Schau, das hier ist richtig.',
    '{Почти!} Das hier wäre richtig gewesen.',
    'Nicht ganz. Das üben wir gleich nochmal.',
    'Hmm, schau mal hier. Das ist es.',
  ],
  legen_falsch: ['Hör nochmal genau hin.', 'Welcher Buchstabe kommt jetzt?', 'Fast! Probier einen anderen.'],
  bauen_falsch: ['Welches Wort kommt jetzt?', 'Fast! Probier ein anderes Wort.'],
  paar_falsch: ['Das passt nicht zusammen. Probier es nochmal!'],
  nachher_richtig: ['{Молодец!} Jetzt sitzt es.', '{Да!} Jetzt hast du es!'],

  // Ende
  paare_ende: ['{Ура!} Alle Paare gefunden!'],
  station_ende: ['{Ура!} Station geschafft!', '{Молодец!} Das war eine tolle Station.'],
  wdh_ende: ['{Отлично!} Super wiederholt!', '{Молодец!} Du weisst schon so viel.'],
  // Belohnung: Schlüssel ist die Anzahl Mandarinen
  mandarinen: {
    1: 'Dafür bekommst du eine Mandarine!',
    2: 'Dafür bekommst du zwei Mandarinen!',
    3: 'Dafür bekommst du drei Mandarinen!',
    4: 'Dafür bekommst du vier Mandarinen!',
  },

  // Bei Capy: wenn eine Pyramide fertig ist, jubelt das Lama manchmal auf Russisch mit
  jubel: ['{Молодец!}', '{Ура!}', '{Отлично!}', '{Супер!}', '{Здорово!}', '{Умница!}'],
  // Angetippt bei Capy, kurz bevor die Russisch-Ecke aufgeht
  hallo: ['{Привет!}'],
};

// Übersetzung der russischen Ausrufe, klein in der Sprechblase
const RU_DE = {
  'Молодец!': 'Toll gemacht!', 'Правильно!': 'Richtig!', 'Отлично!': 'Ausgezeichnet!', 'Ура!': 'Hurra!',
  'Здорово!': 'Prima!', 'Умница!': 'Du Schlaue!', 'Класс!': 'Klasse!', 'Да!': 'Ja!', 'Ой!': 'Oh!',
  'Почти!': 'Fast!', 'Супер!': 'Super!', 'Привет!': 'Hallo!', 'Привет, Юна!': 'Hallo, Yuna!',
};

// Was Capy (mit Capys Stimme) zum Lama sagt
const CAPY_LAMA = {
  kommt: ['Schau mal, Yuna! Wer kommt denn da?'],
  schoener_name: ['Was für ein schöner Name!'],
  tipp: ['Möchtest du Russisch lernen? Dann tipp auf das Lama!'],
};

/* =====================================================================
   HILFSFUNKTIONEN (gelten in der App, in make-audio.mjs und pruefe.mjs)
   ===================================================================== */

// Capys Hilfsfunktionen aus texte.js: im Browser schon geladen, in Node von dort holen
const TX = typeof kennung === 'undefined' ? require('./texte.js') : { sprechtext, kennung, datei, alleSaetze };

// Zerlegt eine Zeile des Lamas in Stücke: { ru: true|false, t: Text }
function stuecke(zeile) {
  const out = [];
  String(zeile).replace(/\{([^}]*)\}|([^{]+)/g, (_, ru, de) => {
    const t = (ru !== undefined ? ru : de).trim();
    if (t) out.push({ ru: ru !== undefined, t });
    return '';
  });
  return out;
}
// %name% einsetzen: im Deutschen die deutsche Schreibweise, im Russischen die russische
function mitName(zeile, n) {
  return stuecke(zeile).map(x => ({ ...x, t: x.t.replace(/%name%/g, x.ru ? n.ru : n.de) }));
}
// Aufnahme eines Stücks: Russisches bleibt, wie es ist; Deutsches wie bei Capy (Juna, scharfes S)
const lamaAufnahme = (x, langsam) => ({ w: 'l', s: x.ru ? x.t : TX.sprechtext(x.t), langsam: !!langsam });
const lamaWort = (ru, langsam) => ({ w: 'l', s: ru, langsam: !!langsam });
// Was das Lama nach einem neuen Wort oder Satz auf Deutsch sagt
const wortSagt = w => w.sagt || 'Das heisst ' + w.de + (/[.!?]$/.test(w.de) ? '' : '.');
const satzSagt = s => 'Das heisst: ' + s.de;
const buchstabe = b => BUCHSTABEN.find(x => x.b === b);
const stationVon = b => (STATIONEN.find(s => s.b.includes(b)) || {}).nr;

// Alle Aufnahmen der Russisch-Ecke, mit gedachtem Satz davor (nicht gesprochen),
// der Sprache und Ton festlegt. tempo: Sprechtempo für ElevenLabs.
function russischAufnahmen() {
  const liste = [];
  const RU_VOR = { buchstabe: 'Это буква', wort: 'Повторяй за мной:', ausruf: 'Лама радостно говорит:' };
  const l = (s, art, langsam) => {
    const ru = art !== 'de';
    liste.push({
      s, stimme: 'l', datei: TX.datei({ w: 'l', s, langsam }), art, langsam: !!langsam,
      vorher: ru ? RU_VOR[art] : 'Das kleine Lama aus Russland sagt fröhlich:',
      nachher: '', tempo: langsam ? 0.7 : art === 'wort' || art === 'buchstabe' ? 0.9 : 1,
    });
  };
  const zeile = z => stuecke(z).forEach(x => l(x.ru ? x.t : TX.sprechtext(x.t), x.ru ? 'ausruf' : 'de'));
  for (const v of Object.values(LAMA_TEXTE)) for (const z of (Array.isArray(v) ? v : Object.values(v))) zeile(z);
  for (const b of BUCHSTABEN) { l(b.name, 'buchstabe'); zeile(b.text); }
  for (const s of STATIONEN) zeile(s.start);
  for (const w of WOERTER) {
    l(w.ru, 'wort');
    if (!w.merk) { l(w.ru, 'wort', true); zeile(wortSagt(w)); }
  }
  for (const s of SAETZE) { l(s.ru, 'wort'); l(s.ru, 'wort', true); zeile(satzSagt(s)); }
  for (const z of ZAUBERWOERTER) {
    l(z.ru, 'wort');
    if (!z.zahl) l(z.ru, 'wort', true);
    zeile(wortSagt(z));
  }
  for (const n of LAMA.namen) { l('Меня зовут ' + n.ru + '!', 'wort'); zeile(n.satz); }
  // Capys Sätze, mit Capys Stimme
  for (const pool of Object.values(CAPY_LAMA)) {
    for (const e of pool) liste.push({ s: TX.sprechtext(e), stimme: 'c', datei: TX.kennung(TX.sprechtext(e)), vorher: '', nachher: '', lebhaft: true, kurz: false, tempo: 1 });
  }
  // Jede Aufnahme nur einmal
  return [...new Map(liste.map(x => [x.datei, x])).values()];
}

// Alles, was die App je abspielen kann: Capys Sätze (texte.js) und die der Russisch-Ecke
function alleAufnahmen() {
  const capy = TX.alleSaetze().map(x => ({ ...x, stimme: 'c', datei: TX.kennung(x.s), tempo: 1 }));
  return [...new Map(capy.concat(russischAufnahmen()).map(x => [x.datei, x])).values()];
}

if (typeof module !== 'undefined') {
  module.exports = { LAMA, BUCHSTABEN, ALPHABET, STATIONEN, WOERTER, SAETZE, ZAUBERWOERTER, LAMA_TEXTE, RU_DE, CAPY_LAMA,
    stuecke, mitName, lamaAufnahme, lamaWort, wortSagt, satzSagt, buchstabe, stationVon, russischAufnahmen, alleAufnahmen };
}
