'use strict';

/* =====================================================================
   TEXTE
   Alles, was Capy sagt. Jeder Satz wird mit make-audio.mjs einmal bei
   ElevenLabs vertont und liegt dann als audio/<kennung>.mp3 im Ordner.

   Ein Eintrag ist entweder ein Text, der genau so angezeigt und
   gesprochen wird, oder { t: 'angezeigt', s: 'gesprochen' }, wenn die
   Stimme etwas anderes lesen soll (Zahlen ausgeschrieben, ✓ als Wort …).

   Neue Sätze oder Fakten einfach ergänzen und danach
     node pyr/make-audio.mjs
   laufen lassen: es vertont nur, was noch fehlt.
   Schweizer Schreibweise: ss statt ß.
   ===================================================================== */

// So spricht die Stimme Yunas Namen aus
const SPRECHNAME = 'Juna';

const TEXTE = {
  // Beim Öffnen, nach dem «Los geht's»
  gruss_morgen: [
    'Guten Morgen, Yuna! Schön, dass du da bist.',
    'Guten Morgen, Yuna! Bereit für ein paar Pyramiden?',
    'Guten Morgen! Ich habe schon Pyramiden für dich gebaut.',
    'Hoi Yuna! Ein guter Morgen zum Rechnen.',
  ],
  gruss_tag: [
    'Hallo Yuna! Schön, dass du wieder da bist.',
    'Hallo Yuna! Ich habe schon auf dich gewartet.',
    'Da bist du ja, Yuna! Los geht\'s.',
    'Hoi Yuna! Lust auf ein paar Pyramiden?',
    'Hallo Yuna! Die Steine liegen schon bereit.',
  ],
  gruss_abend: [
    'Guten Abend, Yuna! Noch ein paar Pyramiden?',
    'Hallo Yuna! Schön, dass du noch vorbeischaust.',
    'Guten Abend! Zum Rechnen ist es nie zu spät.',
  ],

  // Allererste Pyramiden: erklären, wie es geht
  erste: [
    { t: 'Welche Zahl gehört in den leuchtenden Stein? Tippe sie ein und drücke ✓.',
      s: 'Welche Zahl gehört in den leuchtenden Stein? Tippe sie ein und drücke auf den grünen Haken.' },
  ],

  // Neue Pyramide
  start: [
    'Los geht\'s! Welche Zahlen fehlen?',
    'Neue Pyramide! Du schaffst das.',
    'Hier kommt die nächste Pyramide!',
    'Bereit? Dann los!',
    'Auf geht\'s, Yuna!',
    'Eine frische Pyramide, nur für dich!',
    'Schau mal, eine neue Pyramide!',
    'Welche Steine fehlen hier wohl?',
    'Neue Steine, neues Glück!',
    'Packen wir\'s an!',
    'Hopp, Yuna! Die nächste wartet schon.',
    'Die Steine warten schon auf dich.',
    'Nächste Runde! Ich drück dir die Pfoten.',
    'Diese Pyramide habe ich extra für dich gebaut.',
    'Mal sehen, wie schnell du diese löst!',
    'Und weiter geht\'s!',
    'Noch eine? Na klar!',
    'Wo fängst du diesmal an?',
    'Such dir einen Stein, bei dem du schon rechnen kannst.',
  ],
  // Die Pyramide hat mehr Stockwerke als die letzte
  start_hoeher: [
    'Oh, diesmal ein Stockwerk mehr!',
    'Die Pyramide ist gewachsen! Du schaffst das.',
    'Jetzt wird\'s höher! Immer ein Stein nach dem anderen.',
    'Eine grössere Pyramide! Fang dort an, wo du schon rechnen kannst.',
  ],
  // Sechs Stockwerke
  start_gross: [
    'Wow, so viele Stockwerke!',
    'Eine richtig hohe Pyramide! Immer ein Stein nach dem anderen.',
    'Das ist eine Riesenpyramide. Ich bin gespannt!',
    'So hoch! Von da oben sieht man bestimmt bis zum Fluss.',
  ],
  // Hier braucht es Minus
  start_minus: [
    'Bei dieser Pyramide brauchst du auch Minus.',
    'Achtung, hier fehlen auch Steine weiter unten!',
    'Hier musst du manchmal rückwärts rechnen.',
  ],

  // Richtig
  ok: [
    'Super!', 'Richtig!', 'Genau!', 'Toll!', 'Prima!', 'Juhu!', 'Klasse!', 'Stimmt!',
    'Sehr gut!', 'Spitze!', { t: 'Bravo!', s: 'Brawo!' }, 'Perfekt!', 'Wunderbar!', 'Stark!', 'Ganz genau!',
    'Das passt!', 'Volltreffer!', 'Hervorragend!', 'Grossartig!', 'Sauber gerechnet!',
    'Bingo!', 'Jawohl!', 'Ausgezeichnet!', 'Richtig gerechnet!', 'Genau so!',
    'Läuft bei dir!', 'Treffer!', 'Super, weiter so!',
  ],
  ok_minus: [
    'Super, das war Minus!',
    'Richtig! Rückwärts gerechnet.',
    'Toll, Minus kannst du auch!',
    'Genau! Minus ist kein Problem für dich.',
  ],
  ok_nachfehler: [
    'Jetzt stimmt\'s!',
    'Na also! Geschafft.',
    'Siehst du, du kannst es!',
    'Gut, dass du drangeblieben bist!',
    'Jetzt passt es!',
    'Genau! Beim zweiten Mal hat\'s geklappt.',
    'Richtig! Nicht aufgeben lohnt sich.',
  ],
  // Viele richtig hintereinander
  ok_serie: [
    'Du bist nicht zu bremsen!',
    'Schon wieder richtig! Du bist in Topform.',
    'Wow, alles richtig hintereinander!',
    'Du rechnest ja wie der Blitz!',
    'Du bist ein echtes Rechen-Capybara!',
    'Eins nach dem anderen, und alles richtig!',
    'Ich staune! So viele richtig am Stück.',
  ],

  // Falsch
  falsch: [
    'Hmm, das stimmt noch nicht. Probier\'s nochmal!',
    'Nicht ganz. Du schaffst das!',
    'Hmm, schau nochmal genau hin.',
    'Das war\'s noch nicht. Noch ein Versuch?',
    'Nicht schlimm! Rechne nochmal in Ruhe.',
    'Ups! Probier es noch einmal.',
    'Fehler sind zum Lernen da. Nochmal!',
    'Hmm, prüf die Steine nochmal.',
    'Noch nicht ganz. Gleich hast du\'s!',
    'Das ist nicht die richtige Zahl. Probier\'s weiter!',
  ],
  // Nur ein, zwei daneben
  falsch_knapp: [
    'Ganz knapp daneben!',
    'Fast! Nur ein kleines bisschen daneben.',
    'Huch, ganz nah dran! Nochmal.',
    'Knapp! Zähl nochmal genau.',
  ],
  // Plus gerechnet, wo Minus nötig war
  falsch_minus: [
    'Hmm, hier fehlt ein Stein unten. Da rechnest du minus!',
    'Achtung, hier brauchst du Minus!',
    'Du hast plus gerechnet. Hier musst du minus rechnen.',
  ],
  // Minus gerechnet, wo Plus nötig war
  falsch_plus: [
    'Hmm, die zwei Steine darunter kommen zusammen. Hier rechnest du plus!',
    'Achtung, hier oben brauchst du Plus!',
    'Du hast minus gerechnet. Hier musst du plus rechnen.',
  ],

  // Tipps: davor kommt die Rechnung, z.B. «Rechne: 12 + 7»
  tipp_vor: ['Rechne:', 'Probier mal:', 'Tipp:', 'Schau mal:'],
  // Nach dem dritten Fehlversuch steht die Lösung da: «12 + 7 = 19. Tippe es ein!»
  loesung_nach: ['Tippe es ein!', 'Tipp das ein!', 'Probier es aus!'],
  // Der gewählte Stein geht noch gar nicht
  knifflig: [
    'Dieser Stein ist noch knifflig. Fang hier an!',
    'Probier zuerst diesen Stein!',
    'Hier geht\'s leichter los!',
    'Dieser Stein kommt später dran. Starte hier!',
  ],
  // Lange nichts getippt
  warten: [
    'Brauchst du Hilfe? Tipp auf die Glühbirne!',
    'Hmm, knifflig? Die Glühbirne hilft dir.',
    'Schau, wo zwei Steine nebeneinander schon eine Zahl haben.',
    'Ich warte gemütlich. Lass dir Zeit!',
  ],

  // Pyramide fertig
  fertig: [
    'Geschafft, Yuna!', 'Pyramide fertig!', 'Wunderbar!', 'Super gemacht!',
    { t: 'Bravo, Yuna!', s: 'Brawo, Yuna!' }, 'Die Pyramide steht!', 'Fertig gebaut! Toll!', 'Hurra, geschafft!',
    'Die Mandarine gehört dir!', 'Juhu, die Pyramide ist fertig!',
  ],
  fertig_perfekt: [
    'Geschafft, ohne einen einzigen Fehler!',
    'Perfekt! Alles richtig!',
    'Wow, fehlerfrei! Du bist ein Rechen-Profi.',
    'Alles richtig, Yuna! Ich bin beeindruckt.',
    'Null Fehler! Spitze!',
    'Fehlerfrei gebaut! Hurra!',
  ],
  fertig_muehsam: [
    'Geschafft! Dranbleiben hat sich gelohnt.',
    'Fertig! Das war knifflig, aber du hast es geschafft.',
    'Uff, geschafft! Gut gemacht, Yuna.',
  ],

  // Neue Stufe: darüber steht «Stufe 4!»
  stufe_auf: [
    'Du wirst immer besser!',
    'Jetzt wird\'s spannender.',
    'Eine Stufe höher. Toll!',
    'Weiter so, Yuna!',
    'Du kletterst immer höher!',
  ],

  // Vor jedem Fakt
  fakt_vor: ['Wusstest du?', 'Schon gewusst?', 'Stell dir vor:', 'Weisst du was?', 'Hör mal:', 'Spannend:'],

  // Stimme wieder eingeschaltet
  stimme_an: ['Ich lese dir wieder vor!'],
};

// Freunde, die nach so vielen gelösten Pyramiden dazukommen
const FREUNDE = [
  { id: 'schmetterling', at: 2,  name: 'Schmetterling', text: 'Ein Schmetterling ist zu Besuch!' },
  { id: 'vogel',         at: 4,  name: 'Vogel',         text: 'Ein Vogel setzt sich zu Capy.' },
  { id: 'schildkroete',  at: 7,  name: 'Schildkröte',   text: 'Eine Schildkröte kommt vorbei.' },
  { id: 'frosch',        at: 11, name: 'Frosch',        text: 'Ein Frosch hüpft herbei!' },
  { id: 'ente',          at: 16, name: 'Ente',          text: 'Eine Ente watschelt herbei.' },
  { id: 'baby',          at: 22, name: 'Capybara-Baby', text: 'Ein Capybara-Baby will mitspielen!' },
];
const NEUER_FREUND = 'Neuer Freund!';

// Tiere, die ab und zu vorbeikommen. Tippt Yuna eines an, sagt Capy etwas dazu.
const TIERE = {
  capybara:      { name: 'Capybara', saetze: ['Schau mal, ein Capybara!', 'Hallo, liebes Capybara!', 'Noch ein Capybara! Wir sind gern zusammen.'] },
  familie:       { name: 'Capybara-Familie', saetze: ['Eine ganze Capybara-Familie!', 'Schau, die kleinen Capybara-Babys!'] },
  ente:          { name: 'Ente', saetze: ['Quak! Die Ente hat es eilig.', 'Eine Ente watschelt vorbei.'] },
  schildkroete:  { name: 'Schildkröte', saetze: ['Die Schildkröte versteckt sich im Panzer!', 'Nur keine Eile, Schildkröte.'] },
  guerteltier:   { name: 'Gürteltier', saetze: ['Ein Gürteltier! Es rollt sich zur Kugel.', 'Kugel-Alarm! Das Gürteltier rollt davon.'] },
  frosch:        { name: 'Frosch', saetze: ['Hops! Der Frosch springt hoch.', 'Ein Frosch! Quak, quak!'] },
  tukan:         { name: 'Tukan', saetze: ['Ein Tukan! Was für ein Schnabel!', 'Der Tukan fliegt einen Looping!'] },
  schmetterling: { name: 'Schmetterling', saetze: ['Ein Schmetterling! Wie hübsch.', 'Der Schmetterling flattert davon.'] },
};

// Erklärung auf der ersten Karte, zum Vorlesen
const ANLEITUNG = 'Hallo Yuna! Ich bin Capy. Hilfst du mir, Zahlenpyramiden zu bauen? ' +
  'Zwei Steine nebeneinander ergeben zusammen den Stein darüber: drei plus vier gibt sieben. ' +
  'Fehlt unten ein Stein? Dann rechnest du minus: sieben minus drei gibt vier.';

// So viele Stufen hat das Spiel (wie LEVELS in index.html)
const STUFEN = 12;

/* =====================================================================
   FAKTEN
   Nach jeder Pyramide einer, keiner doppelt, bis alle dran waren.
   Kurz halten (gut 100 Zeichen), damit sie in die Sprechblase passen.
   ===================================================================== */
const FAKTEN = [
  // Capybaras
  'Capybaras sind die grössten Nagetiere der Welt.',
  'Ein grosses Capybara wiegt fast so viel wie ein erwachsener Mensch.',
  'Capybaras leben in Südamerika, immer in der Nähe von Wasser.',
  'Capybaras haben kleine Schwimmhäute zwischen den Zehen. Damit paddeln sie prima.',
  'Capybaras können bis zu fünf Minuten lang tauchen.',
  'Augen, Ohren und Nase sitzen oben am Kopf. So schaut ein Capybara aus dem Wasser, fast ohne aufzutauchen.',
  'Capybaras fressen Gras und Wasserpflanzen. Fleisch fressen sie nie.',
  'Ein Capybara frisst jeden Tag etwa drei Kilo Gras.',
  'Capybaras leben in Gruppen, oft mit zehn bis zwanzig Tieren.',
  'Ein anderer Name für Capybara ist Wasserschwein. Ein Schwein ist es aber nicht.',
  'Die nächsten Verwandten der Capybaras sind die Meerschweinchen.',
  'Capybaras unterhalten sich mit Pfeifen, Schnurren, Klicken und Bellen.',
  'Wenn ein Capybara Gefahr bemerkt, bellt es laut. Dann springen alle ins Wasser.',
  'Capybara-Babys können schon kurz nach der Geburt laufen.',
  'Meistens bekommt eine Capybara-Mama vier Babys auf einmal.',
  'In einer Capybara-Gruppe kümmern sich alle Mütter gemeinsam um die Babys.',
  'Die Zähne eines Capybaras hören nie auf zu wachsen. Beim Kauen nutzen sie sich ab.',
  'Capybaras dösen manchmal im Wasser. Nur die Nase schaut heraus.',
  'In Japan baden Capybaras im Winter in warmen Quellen, mit Zitrusfrüchten im Wasser.',
  'Capybaras wälzen sich gern im Schlamm. Das kühlt und schützt die Haut vor der Sonne.',
  'Das Fell eines Capybaras ist rau und borstig, gar nicht weich wie bei einer Katze.',
  'Vögel sitzen gern auf Capybaras und picken ihnen kleine Krabbeltiere aus dem Fell.',
  'Capybaras sind sehr friedlich. Viele andere Tiere ruhen sich gern neben ihnen aus.',
  'Capybaras fressen manchmal ihren eigenen Kot. Igitt! So holen sie mehr aus dem Gras heraus.',
  'In der Mittagshitze ruhen Capybaras. Unterwegs sind sie lieber am Morgen und am Abend.',
  { t: 'Capybaras können an Land bis zu 35 km/h schnell rennen.',
    s: 'Capybaras können an Land bis zu fünfunddreissig Kilometer pro Stunde schnell rennen.' },
  'Der Name Capybara kommt aus einer Sprache der Ureinwohner Südamerikas und heisst ungefähr «Grasfresser».',
  'Capybaras haben vorne vier Zehen und hinten nur drei.',
  'Ein Capybara hat nur ein winziges Stummelschwänzchen.',
  'Ein Capybara ist über einen Meter lang, fast so lang, wie du gross bist.',
  'Capybara-Männchen haben oben auf der Nase eine Duftdrüse. Damit hinterlassen sie Duftnachrichten.',
  'Capybaras können über zehn Jahre alt werden.',
  'Capybaras schwimmen so gut, dass sie sogar unter Wasser vor Gefahren fliehen.',

  // Nagetiere und Verwandte
  'Mäuse, Eichhörnchen, Biber und Capybaras sind alle Nagetiere.',
  'Biber bauen Dämme aus Ästen und Schlamm. So stauen sie einen Bach zu einem Teich.',
  'Meerschweinchen kommen aus Südamerika, genau wie Capybaras.',
  'Die kleinsten Mäuse der Welt sind kaum grösser als dein Daumen.',
  'Etwa vier von zehn Säugetierarten sind Nagetiere.',

  // Südamerika
  'Der Amazonas in Südamerika ist der wasserreichste Fluss der Welt.',
  'Im Pantanal, einem riesigen Sumpfgebiet in Brasilien, leben besonders viele Capybaras.',
  'Im Amazonas schwimmen rosa Flussdelfine.',
  { t: 'Riesenotter leben in Südamerika und werden bis zu 1,7 Meter lang.',
    s: 'Riesenotter leben in Südamerika und werden bis zu eins Komma sieben Meter lang.' },
  'Faultiere bewegen sich so langsam, dass auf ihrem Fell kleine Algen wachsen.',
  'Faultiere klettern nur etwa einmal pro Woche von ihrem Baum herunter, um aufs Klo zu gehen.',
  'Tukane haben einen riesigen, bunten Schnabel, der trotzdem ganz leicht ist.',
  'Kolibris können in der Luft stehen bleiben und sogar rückwärts fliegen.',
  'Ein Kolibri schlägt bis zu achtzigmal pro Sekunde mit den Flügeln.',
  'Ameisenbären haben eine Zunge, die etwa sechzig Zentimeter lang ist.',
  'Lamas und Alpakas kommen aus den Anden, den hohen Bergen Südamerikas.',
  'Die Anden sind die längste Gebirgskette an Land.',
  'Der höchste Wasserfall der Welt ist in Venezuela. Er ist fast einen Kilometer hoch.',
  'Jaguare sind die grössten Katzen Amerikas, und sie schwimmen sehr gern.',
  'Kaimane sind Verwandte der Krokodile und leben in Flüssen und Sümpfen Südamerikas.',
  'Pfeilgiftfrösche sind winzig und knallbunt. Die Farben bedeuten: Achtung, nicht fressen!',
  'Der Blaue Morphofalter hat Flügel, die blau schimmern wie Metall.',
  'Die Blätter der Riesenseerose sind so gross, dass ein kleines Kind darauf sitzen könnte.',
  'Brüllaffen sind so laut, dass man sie kilometerweit hören kann.',
  'Die Küken des Hoatzins haben kleine Krallen an den Flügeln. Damit klettern sie durch die Äste.',
  'Viele Piranhas fressen nicht nur Fleisch, sondern auch Früchte und Samen.',
  'Das Kugelgürteltier kann sich zu einer festen Kugel einrollen.',
  'Aras sind grosse, bunte Papageien. Sie können über fünfzig Jahre alt werden.',
  'Kapuzineraffen knacken Nüsse mit Steinen, wie mit einem Hammer.',
  'Der Tapir hat eine kurze Rüsselnase und badet gern, genau wie die Capybaras.',
  'Der Nandu ist ein grosser Vogel aus Südamerika. Fliegen kann er nicht, aber schnell rennen.',
  'Der Andenkondor gehört zu den grössten Vögeln, die fliegen können.',
  'Flamingos sind rosa, weil sie kleine rosa Krebse und Algen fressen.',
  'Flamingos schlafen oft auf nur einem Bein.',
  'Im Regenwald regnet es sehr oft. Darum ist es dort so grün.',
  'In den Regenwäldern lebt mehr als die Hälfte aller Tier- und Pflanzenarten der Erde.',

  // Capys Freunde
  'Schildkröten gab es schon zur Zeit der Dinosaurier.',
  'Eine Schildkröte kann nicht aus ihrem Panzer heraus. Er ist mit ihrem Skelett verwachsen.',
  'Manche Schildkröten werden über hundert Jahre alt.',
  'Frösche trinken nicht mit dem Mund. Sie nehmen Wasser durch die Haut auf.',
  'Aus Kaulquappen werden Frösche. Dabei wachsen Beine, und der Schwanz verschwindet.',
  'Kaulquappen atmen mit Kiemen wie Fische. Erst später bekommen sie Lungen.',
  'Manche Frösche springen zwanzigmal so weit, wie sie lang sind.',
  'Enten fetten ihre Federn mit dem Schnabel ein. So werden sie im Wasser nicht nass.',
  'Entenküken laufen dem ersten Lebewesen hinterher, das sie nach dem Schlüpfen sehen.',
  'Enten können mit einem offenen Auge schlafen und so trotzdem aufpassen.',
  'Schmetterlinge schmecken mit ihren Füssen.',
  'Jeder Schmetterling war zuerst eine Raupe und hat sich in einer Puppe verwandelt.',
  'Schmetterlinge können nur fliegen, wenn ihnen warm genug ist. Darum sonnen sie sich gern.',
  'Vögel sind die einzigen Tiere mit Federn.',
  'Libellen gab es schon vor den Dinosauriern.',
  'Libellen können in alle Richtungen fliegen, sogar rückwärts.',
  'Wasserläufer sind Insekten, die über das Wasser flitzen, ohne einzusinken.',
  'Viele Seerosen schliessen ihre Blüten am Abend und öffnen sie am Morgen wieder.',

  // Mandarinen und Pflanzen
  'Mandarinen kommen ursprünglich aus Asien.',
  'Eine Mandarine hat meistens ungefähr zehn Schnitze. Zähl beim nächsten Mal nach!',
  'Yuzu ist eine Zitrusfrucht aus Japan. Sie duftet so gut, dass man sie ins Badewasser legt.',
  'Mandarinen und Orangen haben viel Vitamin C. Das hilft dir, gesund zu bleiben.',
  'Gras wächst von unten nach. Darum kann es immer wieder abgefressen werden.',
  'Bäume und andere Pflanzen machen den Sauerstoff, den wir zum Atmen brauchen.',

  // Erde und Wasser
  'Wasser kann fest, flüssig oder gasförmig sein: Eis, Wasser und Wasserdampf.',
  'Fast drei Viertel der Erde sind mit Wasser bedeckt.',
  'Ein Regenbogen entsteht, wenn die Sonne durch Regentropfen scheint.',
  'Die Sonne ist ein Stern. Über eine Million Erden würden in sie hineinpassen.',
  'Die Erde dreht sich einmal am Tag um sich selbst. Darum gibt es Tag und Nacht.',
  { t: 'Ein Jahr hat 365 Tage, ein Schaltjahr sogar 366.',
    s: 'Ein Jahr hat dreihundertfünfundsechzig Tage, ein Schaltjahr sogar dreihundertsechsundsechzig.' },

  // Pyramiden und Zahlen
  { t: 'Die grosse Pyramide in Ägypten ist über 4500 Jahre alt.',
    s: 'Die grosse Pyramide in Ägypten ist über viertausendfünfhundert Jahre alt.' },
  'Viele Steine der grossen Pyramide in Ägypten wiegen mehr als ein Auto.',
  { t: 'Zählst du alle Zahlen von 1 bis 10 zusammen, kommt 55 heraus.',
    s: 'Zählst du alle Zahlen von eins bis zehn zusammen, kommt fünfundfünfzig heraus.' },
  'Die Null als richtige Zahl haben Gelehrte in Indien vor über tausend Jahren eingeführt.',
  { t: 'Gerade plus gerade gibt immer gerade: 4 + 6 = 10.',
    s: 'Gerade plus gerade gibt immer gerade. Zum Beispiel vier plus sechs gibt zehn.' },
  { t: 'Ungerade plus ungerade gibt gerade: 3 + 5 = 8.',
    s: 'Ungerade plus ungerade gibt gerade. Zum Beispiel drei plus fünf gibt acht.' },
  { t: 'Plus null ändert nichts: 7 + 0 = 7.',
    s: 'Plus null ändert nichts. Sieben plus null bleibt sieben.' },
  { t: 'Beim Plusrechnen darfst du tauschen: 3 + 5 ist das Gleiche wie 5 + 3.',
    s: 'Beim Plusrechnen darfst du tauschen. Drei plus fünf ist das Gleiche wie fünf plus drei.' },
  { t: 'Minus ist Plus rückwärts: Wenn 7 + 5 = 12 ist, dann ist 12 − 5 = 7.',
    s: 'Minus ist Plus rückwärts. Wenn sieben plus fünf zwölf gibt, dann gibt zwölf minus fünf sieben.' },
  'Wahrscheinlich rechnen wir in Zehnern, weil wir zehn Finger haben.',
  { t: 'Auf einem Würfel ergeben die gegenüberliegenden Seiten zusammen immer 7.',
    s: 'Auf einem Würfel ergeben die gegenüberliegenden Seiten zusammen immer sieben.' },
  'Eine Woche hat sieben Tage, und ein Tag hat vierundzwanzig Stunden.',
  { t: 'Das Doppelte von 25 ist 50, die grösste Zahl in deinen Pyramiden.',
    s: 'Das Doppelte von fünfundzwanzig ist fünfzig, die grösste Zahl in deinen Pyramiden.' },
  'In einer Zahlenpyramide steht die grösste Zahl immer ganz oben.',
  'Ein Stein in der Zahlenpyramide ist nie kleiner als die zwei Steine darunter.',
];

/* =====================================================================
   HILFSFUNKTIONEN (gelten in der App und in make-audio.mjs)
   ===================================================================== */

const anzeigetext = e => (typeof e === 'string' ? e : e.t);
// Die Schweizer Schreibweise hat ss, wo im Hochdeutschen ß steht. Nach langem
// Vokal liest die Stimme ss aber kurz («Grossartig» wie «Ross»). Für die Stimme
// darum ß, angezeigt wird weiter ss. Wörter mit kurzem Vokal (Wasser, dass,
// Fluss) bleiben, wie sie sind. Neue Wörter dieser Art hier ergänzen.
const SCHARFES_S = [
  [/([Gg])ross/g, '$1roß'],     // gross, grosse, Grossartig
  [/([Gg])röss/g, '$1röß'],     // grösser, grösste
  [/([Ff])üss/g, '$1üß'],       // Füssen
  [/([Ss])pass/g, '$1paß'],     // Spass
  [/([Ss])trass/g, '$1traß'],   // Strasse
  [/([Gg])rüss/g, '$1rüß'],     // Grüsse
  [/iess/g, 'ieß'],             // schliessen
  [/eiss/g, 'eiß'],             // heisst, weisst, dreissig
];
const aussprache = s => SCHARFES_S.reduce((t, [muster, ersatz]) => t.replace(muster, ersatz), s);
const sprechtext = e => aussprache((typeof e === 'string' ? e : e.s || e.t).replace(/Yuna/g, SPRECHNAME));

// Kennung einer Aufnahme: FNV-1a über den gesprochenen Text
function kennung(s) {
  let h = 0x811c9dc5;
  for (const ch of s.normalize('NFC')) {
    h ^= ch.codePointAt(0);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

// 0 … 100 als Wort für die Stimme (wird nie angezeigt, darum mit ß, siehe oben)
function zahlwort(n) {
  const e = ['null', 'eins', 'zwei', 'drei', 'vier', 'fünf', 'sechs', 'sieben', 'acht', 'neun',
    'zehn', 'elf', 'zwölf', 'dreizehn', 'vierzehn', 'fünfzehn', 'sechzehn', 'siebzehn', 'achtzehn', 'neunzehn'];
  const z = ['', '', 'zwanzig', 'dreißig', 'vierzig', 'fünfzig', 'sechzig', 'siebzig', 'achtzig', 'neunzig'];
  if (n < 20) return e[n];
  if (n === 100) return 'hundert';
  const zehner = Math.floor(n / 10), einer = n % 10;
  return einer ? (einer === 1 ? 'ein' : e[einer]) + 'und' + z[zehner] : z[zehner];
}
const RECHENWORT = { '+': 'plus', '−': 'minus', '=': 'gibt' };
const stufentext = n => 'Stufe ' + n + '!';

// Jeder Satz, den die App je abspielen kann, mit gedachtem Satz drumherum
// (vorher/nachher), damit einzelne Wörter natürlich klingen.
// Listen, die jubeln und loben (lebhaft); der Rest erklärt und darf ruhiger sein
const LEBHAFT = ['gruss_morgen', 'gruss_tag', 'gruss_abend', 'start', 'start_hoeher', 'start_gross',
  'ok', 'ok_minus', 'ok_nachfehler', 'ok_serie', 'fertig', 'fertig_perfekt', 'fertig_muehsam',
  'stufe_auf', 'stimme_an'];

function alleSaetze() {
  const liste = [];
  // Ganz kurze Ausrufe («Prima!», «Super!») hält die Stimme sonst leicht für
  // Italienisch oder Englisch. Ein gedachter deutscher Satz drumherum (nicht
  // mitgesprochen) sagt ihr, welche Sprache gemeint ist.
  const DEUTSCH = ['Juna hat die Aufgabe gelöst, und Capy ruft fröhlich:', 'Das hast du wirklich toll gemacht.'];
  const dazu = (s, vorher, nachher, lebhaft) => {
    const kurz = !!lebhaft && !vorher && !nachher && s.split(/\s+/).length <= 3;
    liste.push({ s, vorher: kurz ? DEUTSCH[0] : vorher || '', nachher: kurz ? DEUTSCH[1] : nachher || '', lebhaft: !!lebhaft, kurz });
  };
  const umfeld = { tipp_vor: ['', 'zwölf plus sieben.'], loesung_nach: ['Zwölf plus sieben gibt neunzehn.', ''] };
  for (const [name, pool] of Object.entries(TEXTE)) {
    const [vorher, nachher] = umfeld[name] || [];
    for (const e of pool) dazu(sprechtext(e), vorher, nachher, LEBHAFT.includes(name));
  }
  for (const e of FAKTEN) dazu(sprechtext(e), 'Wusstest du?');
  for (const f of FREUNDE) dazu(sprechtext(f.text), NEUER_FREUND, '', true);
  for (const t of Object.values(TIERE)) for (const s of t.saetze) dazu(sprechtext(s), '', '', true);
  dazu(NEUER_FREUND, '', '', true);
  dazu(sprechtext(ANLEITUNG));
  for (let n = 1; n <= STUFEN; n++) dazu(stufentext(n), '', '', true);
  for (let n = 0; n <= 50; n++) dazu(zahlwort(n), 'Rechne mal:', 'plus drei.');
  dazu('plus', 'Rechne mal: zwölf', 'sieben.');
  dazu('minus', 'Rechne mal: zwölf', 'sieben.');
  dazu('gibt', 'Zwölf plus sieben', 'neunzehn.');
  return liste;
}

if (typeof module !== 'undefined') {
  module.exports = { TEXTE, FREUNDE, NEUER_FREUND, TIERE, ANLEITUNG, STUFEN, FAKTEN, SPRECHNAME,
    anzeigetext, sprechtext, kennung, zahlwort, RECHENWORT, stufentext, alleSaetze };
}
