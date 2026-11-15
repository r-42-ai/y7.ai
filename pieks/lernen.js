'use strict';

/* =====================================================================
   LERNEN
   Das Lernmodell für das Französisch: plant eine Runde, macht aus
   jedem Schritt eine Aufgabe, beurteilt die Antwort und verbucht sie
   auf der Karte. Die Datei kennt weder die Seite noch die Uhr noch
   einen Speicher: Zustand und Datum kommen von aussen herein, und jeder
   Zufall geht durch Lernen.zufall, damit pruefe.mjs ihn festlegen kann.
   Sie läuft im Browser und in Node.

   Nach jeder Änderung: node pieks/pruefe.mjs
   ===================================================================== */

/* =====================================================================
   VERTRAG FÜR franz.js
   Der Zustand z ist das Objekt unter nea.igel.franz. Lernen.neu() gibt
   einen frischen, Lernen.pruefen(roh) liest einen gespeicherten Feld
   für Feld ab und wirft nie. heute ist immer 'JJJJ-MM-TT' (Lernen.tag).

   Lernen.planen(z, heute, { modus, gruppe, mitTon }) → Plan
     modus 'runde' (Standard) oder 'frei'; gruppe: ein Lernziel wie
     'u3-1' («Für den Test üben»); mitTon: Die Stimme ist an (Standard).
     Stellt z.tag auf heute um und holt Daten aus der Zukunft zurück
     (eine Uhr, die einmal vorging), ändert sonst nichts. Kehrt immer zurück.
     Plan = { art: 'runde' | 'frei' | 'leer', schritte, neu, faellig,
              morgen, mehr } – alle Felder sind immer da.
       schritte  die Runde in ihrer Reihenfolge; am Schluss einer Runde
                 ein echo und das Finale, wo es sie gibt
       neu       kid der Karten, die mit kennen eingeführt werden
       faellig   wie viele fällige Karten ihre Leitaufgabe bekommen
       morgen    nur bei 'leer': so viele Karten werden morgen fällig
       mehr      nur bei 'leer': das nächste Lernziel ('u2-3'), wenn
                 jede gewählte Karte schon kennengelernt ist, sonst null

   Schritt = { kid, nr, uebung, vorgabe, teil, form, rolle, check, neu }
     rolle   'kennen' | 'check' | 'leit' | 'neben' | 'fuell' | 'wdh' |
             'echo' | 'paare'
     check   'a' | 'b' bei rolle 'check', sonst null
     neu     true: Dieses kennen zählt zum Tageskontingent
     Dazu kommen, nur wo sie gelten:
     frei: true       jeder Schritt im freien Üben. Daran erkennt
                      verbuchen die Karte als heute frei geübt, und
                      aepfel zahlt einen Apfel.
     begleiter: true  Nebenaufgabe einer Karte, deren Leitaufgabe in
                      derselben Runde steht (braucht Lernen.ohneTon)
     pieks: true      hier rät Pieks mit: die erste Auswahl-Aufgabe ab
                      Platz K.PIEKS_AB, höchstens eine je Plan
     Das Finale: { uebung: 'paare', rolle: 'paare', kids, wahl }. kids
     sind höchstens vier Karten, wahl alle Wort-Karten der Runde, die
     sich als Paare vertragen. Verpasste zuerst:
       kids = [...wahl.filter(verpasst), ...wahl.filter(x => !verpasst(x))].slice(0, 4)

   Die Drittel einer Runde (zweiter Check im letzten) zählen über die
   Schritte ohne echo und Finale. Die erste beurteilte Aufgabe ist eine
   Auswahl, wo immer die Runde eine hat, auch wenn dafür zwei Auftritte
   einer Karte näher zusammenrücken; davor kann kennen stehen. Hat sie
   keine, eröffnet ein Satz (ordnen, bauen) vor Legen und Schreiben;
   diese eröffnen nur eine Runde, die nichts anderes hat.

   Was franz.js zur Laufzeit selbst einfügt (3.4): nach «falsch» die
   Wiederholung, nach einem verpassten Check A noch einmal dessen
   kennen-Schritt (verbuchen zählt ihn kein zweites Mal), und vor dem
   echo eine Bedeutung, wenn die letzte beurteilte Aufgabe falsch war:
     { kid, nr, uebung: 'bedeutung', vorgabe: 'fr', teil: 0, form: 0,
       rolle: 'fuell', check: null, neu: false }

   Lernen.verbuchen(z, schritt, ergebnis, heute)
       → { vorher, stufe, auf, ab, reif }
     Schreibt die Karte, die Zähler, z.tag.neu und z.tag.frei. vorher
     und stufe sind die Stufe davor und danach, auf und ab sagen, ob sie
     gestiegen oder gefallen ist, reif, ob sie gerade Stufe 5 erreicht
     hat. Dasselbe Objekt nimmt Lernen.aepfel(schritt, ergebnis, buchung)
     für den Stufenbonus. Für kennen, echo und paare gefahrlos aufrufbar.
   Lernen.wiederholung(schritt) → derselbe Schritt mit rolle 'wdh'
   Lernen.ohneTon(schritt, z) → der Schritt ohne Ton oder null (entfällt)
   Lernen.rundeFertig(z, { modus, falsch, geurteilt }, heute)
       → { zaehlt, perfekt }: was die Runde zu runden und perfekt beitrug
   Lernen.zahlen(z, heute) → Zahlen (schreibt nichts, würfelt nicht)
     neuFrei zählt, was die nächste Runde mit kennen einführt: neue
     Karten und solche, deren Einführung noch offen ist. Es ist genau
     plan.neu.length des nächsten Lernen.planen, mit und ohne Ton.
     schwer[i].art ist 'genus' | 'akzent' | 'hoeren' | null.
   ===================================================================== */

/* =====================================================================
   VERTRAG FÜR uebungen.js
   Lernen.aufgabe(schritt, z) gibt für jede der 14 Übungen ein Objekt
   mit genau den Feldern, die hier stehen. Was eine Übung nicht
   braucht, fehlt. Unbekannter Eintrag oder unbekannte Übung: null.

   Immer da (ausser bei paare, siehe dort):
     schritt, e        der Schritt und sein Eintrag aus VOKABELN
     uebung, vorgabe   vorgabe: 'fr' | 'de' | 'ton', was die Karte vorgibt
     teil, form        welcher Teil und welche Form wirklich gefragt wird.
                       Das kann vom Schritt abweichen: artikel und akzent
                       suchen sich ihre Form selbst, Hör-Aufgaben nehmen bei
                       gleich klingenden Karten die erste. Für Lernen.urteil
                       gelten diese beiden, nicht die des Schritts.
     fr, de            die gefragte Form und ihr Deutsch (e.teile[teil]);
                       bei kennen und echo die ganze Zeile aus dem Buch
     clip, clipLangsam, clipEintrag
                       { s, v } | null: Aufnahme der Form, dieselbe langsam,
                       der ganze Eintrag. Bei kennen und echo ist clip der
                       Eintrag.
     ton               null; setzt franz.js
     aepfel            was die Aufgabe beim ersten Versuch zahlt

   Plätze (plaetze) sind eine flache Liste in Leserichtung:
     { art: 'fest', text, wort }             vorgedruckt, nie anzutippen
     { art: 'artikel', soll, wort }          soll: 'la' oder ['un', 'une']
     { art: 'buchstabe', soll, wort }        ein Buchstabe; satzanfang: true,
                                             wo er gross gezeigt wird
     { art: 'wort', soll, satzanfang, wort } ein Wort
     { art: 'luecke', soll, wahl, wort }     akzent: wahl = Kandidaten;
                                             luecke: ohne wahl
   wort zählt die Gruppen, die nie umbrochen werden: gleiche Zahl,
   gleiches span.fr-wort. Der Artikel gehört zur Gruppe des ersten Worts.
   Leerzeichen: Wo Text vorgedruckt wird (legen, akzent, luecke), ist
   jedes Leerzeichen ein eigener Platz { art: 'fest', text: ' ' } und
   trägt die Gruppe des Worts davor. Bei ordnen und bauen gibt es keine
   Leerzeichen-Plätze: Dort ist jeder Platz ein Wort, und ein Satzzeichen
   hängt als fest-Platz mit derselben Gruppe an seinem Wort.

   Kacheln (kacheln): { id, text, art } in der Reihenfolge der Ablage,
   schon gemischt. id ist 'k0', 'k1', …; art: 'artikel' | 'buchstabe' |
   'wort'. Die beiden Artikel-Kacheln stehen immer vorn, männlich links.
   fremd: true trägt jede Kachel, die nicht in die Lösung gehört
   (Störbuchstaben, der andere Artikel, fremde Wörter): Beim Nachbauen
   fallen sie weg. Vor dem Urteil darf man es ihnen nicht ansehen.

   Urteilen:
     Auswahl      optionen[i].richtig
     artikel      genus
     alles Gelegte, auch die Lücken von akzent:
                  Lernen.reihenUrteil(gelegt, plaetze ohne die festen)
                  → { richtig, stellen, tipp, fehler }; stellen zählt die
                  übergebenen Plätze ab 0, tipp ist die art für
                  host.versuch, fehler gehört in Ergebnis.fehler
     schreiben    Lernen.urteil(eingabe, e, teil, { form, vorgabe })
                  → Urteil; urteil.fehler gehört in Ergebnis.fehler.
                  urteil.stellen zählt die Zeichen der Eingabe ab 0 (ein
                  Zeichen je Stelle, also «é» und «œ» als ein Zeichen).
                  ganz 'gleiche_form' ist kein Versuch: Zeile leeren.
                  urteil.bezug ist die Form, an der gemessen wurde: Ist die
                  erste Form gefragt, gilt jede Form des Teils, und ein
                  Vertipper wird an der nächsten gemessen («les mathematiques»
                  an «les mathématiques», nicht an «les maths»). Die Spur aus
                  erstem Buchstaben und Länge zeigt diese Form, nicht ziel.
                  urteil.zeichen (bei kern 'akzent'): Auch Abstand, Apostroph
                  oder Bindestrich stimmen nicht («la grand mere», «lage»);
                  der Hinweis nennt beides (h_tipp_akzent und h_tipp_zeichen).

   Je Übung, was dazukommt, und ein echtes Beispiel. schritt, e, clip,
   clipLangsam, clipEintrag, ton und aepfel sind in den Beispielen
   weggelassen (ausser beim ersten), und die Reihenfolge von Optionen und
   Kacheln ist jedes Mal anders.

   kennen · Kennenlernen (nicht beurteilt)
     Nichts weiter. fr und de sind die Zeilen des Buchs, mit «(m pl)» und
     «(cerise)»; die Teile einzeln stehen in e.teile (fr[] und zeigeDe).
     Den Hinweis auf den anderen Artikel gibt Lernen.kontrast(e).
     { uebung: 'kennen', vorgabe: 'fr', teil: 0, form: 0,
       fr: 'les yeux (m pl), un œil', de: 'die Augen, ein Auge' }

   bedeutung · lesen → Deutsch
     optionen: [{ text, richtig, sub }], vier deutsche Antworten, bei
     Sätzen drei. sub steht nach einem Fehlgriff unter der Antwort.
     Hier einmal die ganze Aufgabe:
     { schritt: {…}, e: VOKABELN[12], uebung: 'bedeutung', vorgabe: 'fr',
       teil: 0, form: 0, fr: 'la chaise', de: 'der Stuhl',
       clip: { s: 'la chaise', v: 'f' },
       clipLangsam: { s: 'la chaise', v: 'fl' },
       clipEintrag: { s: 'la chaise', v: 'f' }, ton: null, aepfel: 1,
       optionen: [
         { text: 'eine Schule', richtig: false, sub: 'une école = eine Schule' },
         { text: 'der Stuhl', richtig: true, sub: 'la chaise = der Stuhl' },
         { text: 'die Wandtafel', richtig: false, sub: 'le tableau noir = die Wandtafel' },
         { text: 'das Lineal', richtig: false, sub: 'la règle = das Lineal' }] }

   hoeren · hören → Deutsch
     Wie bedeutung. fr wird erst nach der Antwort gezeigt.
     { uebung: 'hoeren', vorgabe: 'ton', teil: 0, form: 0,
       fr: 'Pique un raisin.', de: 'Spiesse eine Traube auf.',
       optionen: [
         { text: 'Spiesse eine Traube auf.', richtig: true, sub: 'Pique un raisin. = Spiesse eine Traube auf.' },
         { text: 'Stelle/Lege die Erdbeere auf den Teller.', richtig: false, sub: 'Pose la fraise sur l’assiette. = Stelle/Lege die Erdbeere auf den Teller.' },
         { text: 'Stecke die Blätter in die Birne.', richtig: false, sub: 'Insère les feuilles dans la poire. = Stecke die Blätter in die Birne.' }] }

   finden · Deutsch → Französisch wählen
     optionen: vier französische Formen. de ist die Vorgabe.
     { uebung: 'finden', vorgabe: 'de', teil: 0, form: 0, fr: 'la chaise',
       de: 'der Stuhl',
       optionen: [
         { text: 'la gomme', richtig: false, sub: 'la gomme = der Gummi' },
         { text: 'la règle', richtig: false, sub: 'la règle = das Lineal' },
         { text: 'la table', richtig: false, sub: 'la table = der Tisch' },
         { text: 'la chaise', richtig: true, sub: 'la chaise = der Stuhl' }] }

   lauschen · hören → Schreibweise wählen
     optionen: vier französische Formen, die ähnlich klingen.
     { uebung: 'lauschen', vorgabe: 'ton', teil: 0, form: 0,
       fr: 'le cousin', de: 'der Cousin',
       optionen: [
         { text: 'la cousine', richtig: false, sub: 'la cousine = die Cousine' },
         { text: 'le cousin', richtig: true, sub: 'le cousin = der Cousin' },
         { text: 'le dessin', richtig: false, sub: 'le dessin = das bildnerische Gestalten, die Zeichnung' },
         { text: 'le loisir', richtig: false, sub: 'le loisir = die Freizeitbeschäftigung' }] }

   artikel · männlich oder weiblich?
     kopf, rest   die Vorgabe ohne Artikel: kopf in normaler Schrift, rest
                  grau ('' wo es keinen gibt). «les» bleibt in kopf stehen.
     de           das Deutsche ohne seinen Artikel
     genus        'm' | 'f': die richtige Seite
     knoepfe      [links = männlich, rechts = weiblich], je { gross, klein }
     fr           die ganze Form mit Artikel, für nach dem Urteil
     { uebung: 'artikel', vorgabe: 'fr', teil: 0, form: 0,
       fr: 'le membre de la famille', de: 'Familienmitglied',
       kopf: 'membre', rest: 'de la famille', genus: 'm',
       knoepfe: [
         { gross: 'le', klein: 'männlich' },
         { gross: 'la', klein: 'weiblich' }] }

   akzent · Akzente setzen
     plaetze: die Form mit einer bis vier Lücken. wahl sind die Kandidaten
     einer Lücke in der Reihenfolge der Knöpfe; 'oe' ist ein Kandidat aus
     zwei Buchstaben. Der Artikel ist immer vorgedruckt.
     { uebung: 'akzent', vorgabe: 'de', teil: 0, form: 0, fr: 'la règle',
       de: 'das Lineal',
       plaetze: [
         { art: 'fest', text: 'la', wort: 0 },
         { art: 'fest', text: ' ', wort: 0 },
         { art: 'fest', text: 'r', wort: 0 },
         { art: 'luecke', soll: 'è', wahl: ['e', 'é', 'è', 'ê'], wort: 0 },
         { art: 'fest', text: 'g', wort: 0 },
         { art: 'fest', text: 'l', wort: 0 },
         { art: 'luecke', soll: 'e', wahl: ['e', 'é', 'è', 'ê'], wort: 0 }] }

   legen · Buchstaben legen
     plaetze, kacheln, lueckenwort.
     lueckenwort null («Lege das Wort»): Jeder Buchstabe ist ein Platz,
     davor der Artikel-Platz, wo die Form le, la, un oder une trägt.
     { uebung: 'legen', vorgabe: 'de', teil: 0, form: 0, fr: 'la sœur',
       de: 'die Schwester',
       plaetze: [
         { art: 'artikel', soll: 'la', wort: 0 },
         { art: 'fest', text: ' ', wort: 0 },
         { art: 'buchstabe', soll: 's', wort: 0 },
         { art: 'buchstabe', soll: 'œ', wort: 0 },
         { art: 'buchstabe', soll: 'u', wort: 0 },
         { art: 'buchstabe', soll: 'r', wort: 0 }],
       kacheln: [
         { id: 'k0', text: 'le', art: 'artikel', fremd: true },
         { id: 'k1', text: 'la', art: 'artikel' },
         { id: 'k2', text: 'c', art: 'buchstabe', fremd: true },
         { id: 'k3', text: 'r', art: 'buchstabe' },
         { id: 'k4', text: 'u', art: 'buchstabe' },
         { id: 'k5', text: 's', art: 'buchstabe' },
         { id: 'k6', text: 'œ', art: 'buchstabe' },
         { id: 'k7', text: 'e', art: 'buchstabe', fremd: true },
         { id: 'k8', text: 'o', art: 'buchstabe', fremd: true }],
       lueckenwort: null }
     lueckenwort gesetzt («Lege das fehlende Wort», bei Formen mit mehr als
     14 Buchstaben und bei allen Sätzen): Die Form ist vorgedruckt, nur
     dieses Wort wird gelegt, ohne Artikel-Platz. In Sätzen sind die
     Buchstaben klein; satzanfang: true heisst, die gelegte Kachel wird an
     diesem Platz gross gezeigt.
     { uebung: 'legen', vorgabe: 'de', teil: 0, form: 0, fr: 'C’est quoi?',
       de: 'Was ist das?',
       plaetze: [
         { art: 'buchstabe', soll: 'c', satzanfang: true, wort: 0 },
         { art: 'fest', text: '’', wort: 0 },
         { art: 'buchstabe', soll: 'e', wort: 0 },
         { art: 'buchstabe', soll: 's', wort: 0 },
         { art: 'buchstabe', soll: 't', wort: 0 },
         { art: 'fest', text: ' ', wort: 0 },
         { art: 'fest', text: 'quoi', wort: 1 },
         { art: 'fest', text: '?', wort: 1 }],
       kacheln: [
         { id: 'k0', text: 'c', art: 'buchstabe' },
         { id: 'k1', text: 't', art: 'buchstabe' },
         { id: 'k2', text: 'c', art: 'buchstabe', fremd: true },
         { id: 'k3', text: 'e', art: 'buchstabe' },
         { id: 'k4', text: 's', art: 'buchstabe', fremd: true },
         { id: 'k5', text: 's', art: 'buchstabe' },
         { id: 'k6', text: 'é', art: 'buchstabe', fremd: true }],
       lueckenwort: 'C’est' }

   schreiben · frei schreiben
     ziel         die Zielform (gleich fr)
     formen       alle Formen des Teils
     andersAls    die Formen, die als «anders als: …» unter dem Deutschen
                  stehen; [] wenn keine
     vorgabe 'ton' ist das Diktat: kein Text, nur der Clip.
     { uebung: 'schreiben', vorgabe: 'de', teil: 0, form: 1,
       fr: 'les mathématiques', de: 'Mathematik', ziel: 'les mathématiques',
       formen: ['les maths', 'les mathématiques'], andersAls: ['les maths'] }

   luecke · Lücke im Satz
     plaetze: der Satz mit genau einer Lücke (ohne wahl).
     optionen: vier Wörter, schon so gross oder klein geschrieben, wie sie
     in die Lücke gehören; sub ist null.
     { uebung: 'luecke', vorgabe: 'de', teil: 0, form: 0,
       fr: 'Pique un raisin.', de: 'Spiesse eine Traube auf.',
       plaetze: [
         { art: 'fest', text: 'Pique', wort: 0 },
         { art: 'fest', text: ' ', wort: 0 },
         { art: 'fest', text: 'un', wort: 1 },
         { art: 'fest', text: ' ', wort: 1 },
         { art: 'luecke', soll: 'raisin', wort: 2 },
         { art: 'fest', text: '.', wort: 2 }],
       optionen: [
         { text: 'pour', richtig: false, sub: null },
         { text: 'raisins', richtig: false, sub: null },
         { text: 'l’assiette', richtig: false, sub: null },
         { text: 'raisin', richtig: true, sub: null }] }

   ordnen · Wörter ordnen
     plaetze: ein Platz je Wort, Satzzeichen als fest-Plätze dahinter.
     kacheln: genau die Wörter, klein ausser Eigennamen. In einem Platz mit
     satzanfang: true wird die Kachel gross gezeigt; verglichen wird immer
     der Text der Kachel. vorgabe 'ton' (nur Sätze: der Satz wird
     vorgespielt, de steht klein da) oder 'de'.
     { uebung: 'ordnen', vorgabe: 'ton', teil: 0, form: 0,
       fr: 'Tu coupes. Coupe.', de: 'Du schneidest. Schneide!',
       plaetze: [
         { art: 'wort', soll: 'tu', satzanfang: true, wort: 0 },
         { art: 'wort', soll: 'coupes', satzanfang: false, wort: 1 },
         { art: 'fest', text: '.', wort: 1 },
         { art: 'wort', soll: 'coupe', satzanfang: true, wort: 2 },
         { art: 'fest', text: '.', wort: 2 }],
       kacheln: [
         { id: 'k0', text: 'coupe', art: 'wort' },
         { id: 'k1', text: 'tu', art: 'wort' },
         { id: 'k2', text: 'coupes', art: 'wort' }] }

   bauen · Satz bauen
     Wie ordnen mit vorgabe 'de', dazu drei fremde Kacheln (fremd: true).
     { uebung: 'bauen', vorgabe: 'de', teil: 0, form: 0,
       fr: 'Pique un raisin.', de: 'Spiesse eine Traube auf.',
       plaetze: [
         { art: 'wort', soll: 'pique', satzanfang: true, wort: 0 },
         { art: 'wort', soll: 'un', satzanfang: false, wort: 1 },
         { art: 'wort', soll: 'raisin', satzanfang: false, wort: 2 },
         { art: 'fest', text: '.', wort: 2 }],
       kacheln: [
         { id: 'k0', text: 'raisin', art: 'wort' },
         { id: 'k1', text: 'prends', art: 'wort', fremd: true },
         { id: 'k2', text: 'poire', art: 'wort', fremd: true },
         { id: 'k3', text: 'pique', art: 'wort' },
         { id: 'k4', text: 'petite', art: 'wort', fremd: true },
         { id: 'k5', text: 'un', art: 'wort' }] }

   echo · nachsprechen (nicht beurteilt)
     Wie kennen.
     { uebung: 'echo', vorgabe: 'fr', teil: 0, form: 0, fr: 'la chaise',
       de: 'der Stuhl' }

   paare · Finale (nicht beurteilt)
     Der Schritt ist { uebung: 'paare', rolle: 'paare', kids: [kid] }.
     paare: [{ nr, fr, de, clip }]; nr ist der Platz in VOKABELN.
     e, vorgabe, fr, de und die Clips der Aufgabe sind null, aepfel ist die
     Zahl der Paare.
     { schritt: {…}, e: null, uebung: 'paare', vorgabe: null, teil: 0,
       form: 0, fr: null, de: null, clip: null, clipLangsam: null,
       clipEintrag: null, ton: null, aepfel: 3,
       paare: [
         { nr: 2, fr: 'le livre', de: 'das Buch', clip: { s: 'le livre', v: 'f' } },
         { nr: 3, fr: 'la règle', de: 'das Lineal', clip: { s: 'la règle', v: 'f' } },
         { nr: 12, fr: 'la chaise', de: 'der Stuhl', clip: { s: 'la chaise', v: 'f' } }] }
   ===================================================================== */

const Lernen = (() => {
  // In Node kommen die Nachbardateien über require herein, im Browser sind es Globale
  const V = typeof module !== 'undefined' && typeof require === 'function'
    ? require('./vokabeln.js')
    : { VOKABELN, KARTEN, KARTE, LERNZIELE, LERNZIEL_REIHE, UNITE_REIHE, KLANGGRUPPEN, GLEICHKLANG, NIE_ZUSAMMEN, EIGENNAMEN, vokabelClip };

  const K = {
    // Tage bis zur nächsten Wiederholung nach dem Aufstieg auf Stufe 1 … 5, dann für reife Karten
    INTERVALLE: [0, 1, 2, 4, 7, 21],
    REIF_INTERVALLE: [45, 90],
    // Eine Runde: höchstens so viele beurteilte Schritte und so viel Last
    RUNDE: 14, NEBEN_MAX: 3, LAST: 20, RUNDE_MIN: 8,
    NEU_PRO_RUNDE: 4, NEU_PRO_TAG: 6,
    // Was die Eltern als «Neue Wörter pro Tag» wählen können
    NEU_WAHL: [4, 6, 9, 12],
    // Keine neuen Karten, solange mehr fällig sind oder mehr auf Stufe 1–2 stehen
    BREMSE_FAELLIG: 14, BREMSE_JUNG: 16,
    SATZ_AB: 8, SATZ_PRO_RUNDE: 1,
    ABSTAND: 3, WDH_VON: 3, WDH_BIS: 5,
    // So viel Dringlichkeit bringt jeder Tag, den eine fällige Karte wartet (höchstens 30 Tage).
    // Bei 1 überholt eine sichere Karte nach 10 bis 20 Tagen eine wacklige; bei 0,3 wartete sie
    // für eine Lernende, die sich schwertut, vier Wochen und länger.
    WARTEN: 1,
    FREI: 12,
    // Das Finale braucht mindestens drei Wort-Karten und nimmt höchstens vier
    PAARE_MIN: 3, PAARE_MAX: 4,
    // Pieks rät erst ab diesem Platz mit (gezählt ab 0, kennen eingeschlossen)
    PIEKS_AB: 5,
    // Die Karte zum Aufwärmen kommt aus so vielen der sichersten, damit es nicht jeden Tag dieselbe ist
    WARM_WAHL: 4,
    UEBUNGEN: ['kennen', 'bedeutung', 'hoeren', 'finden', 'lauschen', 'artikel', 'akzent', 'legen', 'schreiben',
      'luecke', 'ordnen', 'bauen', 'echo', 'paare'],
    // Auswahl-Aufgaben: ein Versuch, kein «fast»
    WAHL: ['bedeutung', 'hoeren', 'finden', 'lauschen', 'luecke', 'artikel'],
    // Wiegen in LAST doppelt
    SCHWER: ['legen', 'schreiben', 'ordnen', 'bauen'],
    APFEL: { kennen: 0, bedeutung: 1, hoeren: 1, finden: 2, lauschen: 2, artikel: 2, luecke: 2,
      akzent: 3, legen: 3, ordnen: 3, schreiben: 4, bauen: 4, echo: 1 },
    // Bis so viele Buchstaben wird jeder gelegt, darüber fehlt nur ein Wort; längere Formen werden nie getippt
    LEGEN_MAX: 14, SCHREIBEN_MAX: 30,
  };

  // Was die Karte vorgibt, wenn der Schritt nichts anderes sagt
  const VORGABE = { kennen: 'fr', bedeutung: 'fr', hoeren: 'ton', finden: 'de', lauschen: 'ton', artikel: 'fr', akzent: 'de',
    legen: 'de', schreiben: 'de', luecke: 'de', ordnen: 'de', bauen: 'de', echo: 'fr', paare: null };

  const hat = (o, s) => Object.prototype.hasOwnProperty.call(o, s);
  const grenze = (x, a, b) => Math.min(b, Math.max(a, x));
  const buchstabenZahl = s => (s.match(/\p{L}/gu) || []).length;

  /* ---------- Zufall ---------- */

  // Immer über das Objekt, damit ein Test Lernen.zufall austauschen kann
  const zufall = () => L.zufall();
  function mische(liste) {
    for (let i = liste.length - 1; i > 0; i--) {
      const j = Math.floor(zufall() * (i + 1));
      [liste[i], liste[j]] = [liste[j], liste[i]];
    }
    return liste;
  }
  // Kacheln liegen nie schon in der Reihenfolge der Lösung da
  function mischeKacheln(kacheln, loesung) {
    const gleich = () => kacheln.filter(k => !k.fremd).every((k, i) => k.text === loesung[i]);
    for (let i = 0; i < 12; i++) {
      mische(kacheln);
      if (!gleich()) break;
    }
    return kacheln;
  }

  /* ---------- Kartenstand und Datum ---------- */

  // Der Stand einer Karte, die noch nie dran war. Gespeichert wird erst beim ersten Kennenlernen.
  function zustand(z, kid) {
    const neu = { st: 0, faellig: '', auf: '', ab: '', rueck: false, teil: 0, form: 0, fest: 0,
      gesehen: 0, richtig: 0, falsch: 0, schwach: { genus: 0, akzent: 0, hoeren: 0 }, zuletzt: '' };
    const k = z && z.karten && hat(z.karten, kid) ? z.karten[kid] : null;
    return k ? { ...neu, ...k, schwach: { ...neu.schwach, ...k.schwach } } : neu;
  }

  const zwei = n => String(n).padStart(2, '0');
  const tag = d => d.getFullYear() + '-' + zwei(d.getMonth() + 1) + '-' + zwei(d.getDate());
  // Mit dem Kalender gerechnet, nicht mit Millisekunden: Die Zeitumstellung verschiebt so keinen Tag
  function tagPlus(t, n) {
    const [j, m, d] = t.split('-').map(Number);
    return tag(new Date(j, m - 1, d + n));
  }

  /* ---------- Vergleichen ---------- */

  // Wie norm(), merkt sich aber zu jedem Zeichen, wo es in der Eingabe stand:
  // So lassen sich die falschen Stellen in der getippten Zeile markieren
  function normMitStellen(s) {
    const roh = String(s == null ? '' : s).normalize('NFC');
    const von = [];
    let text = '';
    const dazu = (ch, i) => {
      if (ch === ' ' && (!text || text.endsWith(' '))) return;
      text += ch;
      von.push(i);
    };
    for (let i = 0; i < roh.length; i++) {
      const ch = roh[i];
      const zu = ch === '(' ? roh.indexOf(')', i) : -1;
      if (zu >= 0) {
        // «(m)», «(cerise)»: steht im Buch, gehört aber nicht zum Wort
        dazu(' ', i);
        i = zu;
      } else if (/[’ʼ`´']/.test(ch)) dazu('’', i);
      else if (/[\s.,!?;:…«»]/.test(ch)) dazu(' ', i);
      else for (const klein of ch.toLowerCase()) dazu(klein, i);
    }
    if (text.endsWith(' ')) {
      text = text.slice(0, -1);
      von.pop();
    }
    return { text, von };
  }

  // Gross und klein, Apostroph-Varianten, Satzzeichen und Klammern spielen keine Rolle; der Bindestrich bleibt
  const norm = s => normMitStellen(s).text;
  const ohneAkzente = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/œ/g, 'oe').replace(/æ/g, 'ae');
  // Dazu ohne Akzente und Ligaturen
  const falte = s => ohneAkzente(norm(s));
  // Dazu ohne Leerzeichen, Apostroph und Bindestrich
  const kern = s => falte(s).replace(/[ ’-]/g, '');
  const ohneZeichen = s => s.replace(/[ ’-]/g, '');
  // Texte aus dem Wortschatz werden bei jeder Auswahl wieder verglichen: einmal umgeformt, dann gemerkt
  const gemerkt = new Map();
  function normV(s) {
    if (!gemerkt.has(s)) gemerkt.set(s, norm(s));
    return gemerkt.get(s);
  }

  // Einfügen, Löschen, Ersetzen und das Vertauschen zweier Nachbarn kosten je 1
  function abstandTabelle(a, b) {
    const d = [];
    for (let i = 0; i <= a.length; i++) {
      d.push([i]);
      for (let j = 1; j <= b.length; j++) {
        if (!i) {
          d[0].push(j);
          continue;
        }
        let x = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
        if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) x = Math.min(x, d[i - 2][j - 2] + 1);
        d[i].push(x);
      }
    }
    return d;
  }
  const abstand = (a, b) => abstandTabelle(a, b)[a.length][b.length];

  // Welche Zeichen von a müssen angefasst werden, damit b dasteht? Fehlt eines, zeigt die
  // Stelle auf das Zeichen davor: Dahinter setzt die Ansicht die Schreibmarke.
  function abweichungen(a, b) {
    const d = abstandTabelle(a, b), stellen = new Set();
    let i = a.length, j = b.length;
    while (i > 0 || j > 0) {
      if (i > 0 && j > 0 && a[i - 1] === b[j - 1] && d[i][j] === d[i - 1][j - 1]) {
        i--;
        j--;
      } else if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1] && d[i][j] === d[i - 2][j - 2] + 1) {
        stellen.add(i - 1).add(i - 2);
        i -= 2;
        j -= 2;
      } else if (i > 0 && j > 0 && d[i][j] === d[i - 1][j - 1] + 1) {
        stellen.add(i - 1);
        i--;
        j--;
      } else if (i > 0 && d[i][j] === d[i - 1][j] + 1) {
        stellen.add(i - 1);
        i--;
      } else {
        if (a.length) stellen.add(Math.max(0, i - 1));
        j--;
      }
    }
    return [...stellen].sort((x, y) => x - y);
  }

  /* ---------- Formen zerlegen ---------- */

  const ART_RE = /^(le |la |les |l’|un\/une |un |une )/;

  // «l’allemand» → { artikel: 'l’', kern: 'allemand' }. Mit Eintrag entscheidet der Eintrag, ob vorn
  // überhaupt ein Artikel steht («un peu de persil» hat keinen); ohne Eintrag (Getipptes) nur die Form.
  function zerlegen(form, e) {
    const m = e && e.artikel === null ? null : String(form).match(ART_RE);
    return m ? { artikel: m[1].trim(), kern: form.slice(m[1].length) } : { artikel: null, kern: form };
  }

  // Die Wörter einer Form: Satzzeichen hängen hinten am Wort und gehören nicht auf die Kachel.
  // «c’est», «l’aide» und «cure-dent» bleiben ganz. Klein geschrieben, ausser Eigennamen.
  function woerter(form) {
    const liste = [];
    let anfang = true;
    for (const stueck of form.split(' ')) {
      const m = stueck.match(/^(.*?)((?:\.\.\.|[.,!?])*)$/);
      if (!m[1]) {
        if (liste.length) liste[liste.length - 1].danach += m[2];
        continue;
      }
      liste.push({
        text: m[1],
        kachel: V.EIGENNAMEN.includes(m[1]) ? m[1] : m[1].toLowerCase(),
        danach: m[2],
        // Gross gezeigt wird ein Wort nur dort, wo es auch im Buch gross steht
        satzanfang: anfang && m[1][0] !== m[1][0].toLowerCase(),
      });
      anfang = /[.!?]/.test(m[2]);
    }
    return liste;
  }

  const istLang = (form, e) => buchstabenZahl(zerlegen(form, e).kern) > K.LEGEN_MAX;
  // Lange Formen und alle Sätze werden nicht Buchstabe für Buchstabe gelegt: Es fehlt nur ein Wort
  const mitLueckenwort = (form, e) => e.art === 'satz' || istLang(form, e);

  // Wörter, die sich als Lücke lohnen: ab vier Buchstaben, kein Name, längstes zuerst.
  // In einem Satz lieber keines, das noch einmal dasteht: Es wäre nur abzuschreiben.
  function lueckenwoerter(alle, e) {
    let k = alle.filter((w, i) => buchstabenZahl(w.text) >= 4 && !V.EIGENNAMEN.includes(w.text)
      && alle.findIndex(x => x.kachel === w.kachel) === i);
    if (e.art === 'satz') {
      const einmal = k.filter(w => alle.filter(x => x.kachel === w.kachel).length === 1);
      if (einmal.length) k = einmal;
    }
    return k.sort((a, b) => buchstabenZahl(b.text) - buchstabenZahl(a.text));
  }

  /* ---------- Was geht mit welchem Eintrag ---------- */

  const AKZENT_WAHL = { e: ['e', 'é', 'è', 'ê'], a: ['a', 'à', 'â'], u: ['u', 'û'], c: ['c', 'ç'], œ: ['oe', 'œ'] };
  // é → e, ç → c, œ → œ
  const AKZENT_BASIS = {};
  for (const [basis, wahl] of Object.entries(AKZENT_WAHL)) for (const ch of wahl) if (ch.length === 1) AKZENT_BASIS[ch] = basis;
  const AKZENT_RE = /[àâçèéêûœ]/;

  // Die Akzent-Übung nimmt immer die erste Form mit einem Akzent, wo auch immer die Karte gerade steht
  function akzentOrt(e) {
    for (let i = 0; i < e.teile.length; i++) {
      const j = e.teile[i].fr.findIndex(f => AKZENT_RE.test(f));
      if (j >= 0) return { teil: i, form: j };
    }
    return null;
  }

  // Welche Form eine Übung wirklich fragt
  function ort(uebung, e, teil, form) {
    const i = e.teile[teil] ? teil : 0;
    const j = e.teile[i].fr[form] ? form : 0;
    if (uebung === 'artikel' && e.artikelTeil >= 0) return { teil: e.artikelTeil, form: 0 };
    if (uebung === 'akzent') return akzentOrt(e) || { teil: i, form: j };
    // Was das Ohr nicht unterscheidet, wird nur in der ersten Form vorgespielt
    if ((uebung === 'hoeren' || uebung === 'lauschen') && V.GLEICHKLANG.has(e.kid)) return { teil: 0, form: 0 };
    // Zur Auswahl steht immer die erste Form des Teils, wie bei den Ablenkern
    if (uebung === 'finden') return { teil: i, form: 0 };
    return { teil: i, form: j };
  }

  // Zu lange Formen werden nie getippt: Dann ist die nächste Form desselben Teils dran
  function schreibOrt(e, teil, form) {
    const o = ort('schreiben', e, teil, form), formen = e.teile[o.teil].fr;
    for (let s = 0; s < formen.length; s++) {
      const j = (o.form + s) % formen.length;
      if (formen[j].length <= K.SCHREIBEN_MAX) return { teil: o.teil, form: j };
    }
    return o;
  }

  // Lässt sich diese Übung mit diesem Eintrag, Teil und dieser Form bauen? mitTon: Die Stimme ist an.
  // Ob die einzelne Aufnahme bereit ist, weiss erst franz.js (aufgabe.ton).
  function kann(uebung, e, teil, form, mitTon) {
    if (!e) return false;
    const o = ort(uebung, e, teil, form), text = e.teile[o.teil].fr[o.form];
    const wort = e.art === 'wort';
    switch (uebung) {
      case 'kennen': case 'bedeutung': return true;
      case 'hoeren': return !!mitTon;
      case 'finden': case 'paare': return wort;
      case 'lauschen': return wort && !!mitTon;
      case 'artikel': return e.genus === 'm' || e.genus === 'f';
      case 'akzent': return wort && !!akzentOrt(e);
      case 'legen': return !mitLueckenwort(text, e) || lueckenwoerter(woerter(text), e).length > 0;
      case 'schreiben': return wort && text.length <= K.SCHREIBEN_MAX;
      case 'luecke': case 'bauen': return !wort;
      case 'ordnen': return woerter(text).length >= 3 && (!wort || istLang(text, e));
      case 'echo': return !!mitTon && (!wort || /[ ’]/.test(e.sprich));
      default: return false;
    }
  }

  /* ---------- Die Leiter ---------- */

  // Die Aufgabe, die auf der Stufe der Karte über Auf- und Abstieg entscheidet.
  // Stufe 0 ist der erste Check (bedeutung, Teil 0); der zweite ist bei Wörtern finden,
  // bei Sätzen hoeren und ohne Ton noch einmal bedeutung.
  function leitaufgabe(e, k, mitTon) {
    const st = k ? k.st : 0;
    const o = ort('', e, k && k.teil, k && k.form);
    const mit = (uebung, vorgabe) => ({ uebung, vorgabe: vorgabe || VORGABE[uebung], ...ort(uebung, e, o.teil, o.form) });
    if (!(st >= 1)) return { uebung: 'bedeutung', vorgabe: 'fr', teil: 0, form: 0 };
    if (st === 1) return mit(mitTon ? 'hoeren' : 'bedeutung');
    const ordnen = kann('ordnen', e, o.teil, o.form);
    if (e.art === 'satz') {
      // Erst nach dem Ohr ordnen, dann nach dem Deutschen, zuletzt mit fremden Wörtern dazwischen
      if (st <= 3 && ordnen) return mit('ordnen', st === 2 && mitTon ? 'ton' : 'de');
      return mit('bauen');
    }
    // Eine lange Form wird zuerst aus Wörtern geordnet, sonst wäre der Sprung zum Schreiben zu gross
    if (st === 2) return mit(ordnen ? 'ordnen' : 'legen');
    const s = schreibOrt(e, o.teil, o.form);
    if (kann('schreiben', e, s.teil, s.form)) return { uebung: 'schreiben', vorgabe: 'de', teil: s.teil, form: s.form };
    return mit('legen');
  }

  // Nebenaufgaben je Stufe mit ihrem Grundgewicht; Stufe 5 übt wie Stufe 4. diktat = schreiben nach dem Ohr.
  const NEBEN = {
    wort: [[], [['artikel', 4]], [['finden', 2], ['artikel', 2], ['lauschen', 2]],
      [['akzent', 2], ['diktat', 2], ['artikel', 1], ['lauschen', 1]], [['akzent', 1], ['diktat', 2], ['lauschen', 1]]],
    satz: [[], [], [['luecke', 3], ['bedeutung', 1]], [['luecke', 2], ['legen', 2], ['hoeren', 1]],
      [['legen', 2], ['ordnen', 1], ['luecke', 1]]],
  };
  // Welche Schwäche eine Nebenaufgabe nach vorn holt
  const SCHWACH_VON = { artikel: 'genus', akzent: 'akzent', lauschen: 'hoeren', hoeren: 'hoeren', diktat: 'hoeren' };

  // Was neben der Leitaufgabe geübt werden kann. Bewegt die Stufe nie.
  function nebenaufgaben(e, k, mitTon) {
    const st = grenze(k && k.st >= 0 ? k.st : 0, 0, 4);
    const leit = leitaufgabe(e, k, mitTon);
    const schwach = (k && k.schwach) || {};
    const liste = NEBEN[e.art][st].slice();
    // Nach dem Ordnen einer langen Form werden ihre Wörter einzeln gelegt
    if (e.art === 'wort' && st === 2 && leit.uebung === 'ordnen') liste.push(['legen', 4]);
    const aus = [];
    for (const [name, basis] of liste) {
      let uebung = name === 'diktat' ? 'schreiben' : name;
      let vorgabe = name === 'diktat' || name === 'ordnen' ? 'ton' : VORGABE[uebung];
      let gewicht = basis + 3 * (schwach[SCHWACH_VON[name]] || 0);
      if (!mitTon) {
        // Ohne Stimme: dieselben Ausweichwege wie bei der Leitaufgabe. Ein Diktat fiele mit ihr zusammen.
        if (name === 'diktat') continue;
        if (name === 'lauschen') [uebung, vorgabe, gewicht] = ['finden', 'de', basis];
        if (name === 'hoeren') [uebung, vorgabe, gewicht] = ['bedeutung', 'fr', basis];
        if (name === 'ordnen') vorgabe = 'de';
      }
      if (name === 'diktat' && V.GLEICHKLANG.has(e.kid)) continue;
      const o = name === 'diktat' ? schreibOrt(e, k && k.teil, k && k.form) : ort(uebung, e, k && k.teil, k && k.form);
      if (!kann(uebung, e, o.teil, o.form, mitTon)) continue;
      if (uebung === leit.uebung && vorgabe === leit.vorgabe) continue;
      const schon = aus.find(x => x.uebung === uebung && x.vorgabe === vorgabe);
      if (schon) schon.gewicht = Math.max(schon.gewicht, gewicht);
      else aus.push({ uebung, vorgabe, gewicht, teil: o.teil, form: o.form });
    }
    return aus;
  }

  /* ---------- Ablenker ---------- */

  const inGruppe = (gruppen, a, b) => gruppen.some(g => g.includes(a) && g.includes(b));
  // Welcher Artikel vorn zu sehen ist. Ohne Eintrag gefragt: «un peu de persil» hat keinen Artikel,
  // beginnt aber sichtbar mit «un», und nur das Sichtbare kann die Lösung verraten
  const artikelArt = form => zerlegen(form).artikel || 'ohne';
  // Die Sorte des deutschen Artikels vorn: «ein Ohr», «der Stuhl», «Deutsch»
  const deSorte = s => (/^(ein|eine|einen) /.test(s) ? 'ein' : /^(der|die|das) /.test(s) ? 'der' : 'ohne');
  // Verben und kleine Wendungen («das ist», «das Ausland erkunden»): Was vorn steht, ist kein Artikel eines Nomens
  const OHNE_NOMEN = ['verb', 'gram'];
  // Wo der gleiche Artikel nicht reicht, wenigstens dieselbe Sorte
  const ARTIKEL_SORTE = { le: 'bestimmt', la: 'bestimmt', 'l’': 'bestimmt', un: 'unbestimmt', une: 'unbestimmt', les: 'mehrzahl', ohne: 'ohne' };

  // n falsche Antworten zu einem Teil: [{ e, teil }]. seite 'de' zeigt zeigeDe (bedeutung, hoeren),
  // 'fr' die erste Form des Teils (finden), 'klang' die erste Form von Teil 0 (lauschen).
  // form sagt, welche Form des Ziels gezeigt wird (Standard: die erste).
  function ablenker(e, teil, seite, n, form) {
    const t = e.teile[teil] || e.teile[0];
    const zielForm = t.fr[form] || t.fr[0];
    const deZiel = new Set(e.deAlle.map(normV));
    const texte = new Set([normV(seite === 'de' ? t.zeigeDe : zielForm)]);
    // Nie die eigene Karte, nie eine mit demselben Deutsch, nie eine, deren Deutsch fast dasselbe
    // sagt, nie eine, die gleich klingt: Sonst wären zwei Antworten richtig
    const pool = V.KARTEN.filter(k => k.kid !== e.kid && !k.deAlle.some(d => deZiel.has(normV(d)))
      && !inGruppe(V.NIE_ZUSAMMEN, k.kid, e.kid) && !inGruppe(V.KLANGGRUPPEN, k.kid, e.kid));
    const aus = [];
    const nimm = (k, i) => {
      const text = normV(seite === 'de' ? k.teile[i].zeigeDe : k.teile[i].fr[0]);
      if (aus.length >= n || texte.has(text) || aus.some(x => x.e === k)) return false;
      texte.add(text);
      aus.push({ e: k, teil: i });
      return true;
    };
    // Erst die nächsten Verwandten: gleiche Wortgruppe und Unité, dann immer weiter weg
    const stufen = liste => [liste.filter(k => k.cat === e.cat && k.un === e.un), liste.filter(k => k.cat === e.cat),
      liste.filter(k => k.un === e.un), liste];
    const gleicheArt = pool.filter(k => k.art === e.art);

    if (seite === 'klang') {
      // Die Karten, die am ähnlichsten klingen: kleinster Abstand der gefalteten Formen
      const ziel = ohneAkzente(normV(zielForm));
      const nah = mische(pool.filter(k => k.art === 'wort')).map(k => ({ k, d: abstand(ziel, ohneAkzente(normV(k.teile[0].fr[0]))) }));
      for (const x of nah.sort((a, b) => a.d - b.d)) nimm(x.k, 0);
      return aus;
    }
    if (seite === 'fr') {
      // Alle Antworten tragen denselben Artikel wie das Ziel, soweit der Wortschatz reicht:
      // So verrät weder der französische noch der deutsche Artikel die Lösung
      const art = artikelArt(zielForm);
      const passt = [x => x === art, x => ARTIKEL_SORTE[x] === ARTIKEL_SORTE[art], () => true];
      for (const p of passt) {
        for (const stufe of stufen(gleicheArt)) {
          for (const k of mische(stufe.slice())) {
            const teile = mische(k.teile.map((x, i) => i)).filter(i => p(artikelArt(k.teile[i].fr[0])));
            teile.some(i => nimm(k, i));
          }
        }
      }
      return aus;
    }
    // Auch das Deutsche verrät nichts: Steht vor dem Ziel «ein» oder «eine», dann auch vor den
    // Ablenkern, soweit der Wortschatz reicht; sonst wäre zu «une oreille» die einzige Antwort mit
    // «ein» die richtige. Ebenso «der, die, das» und kein Artikel. Über alle Stufen, aber Nomen nur
    // unter Nomen und Verben und Wendungen nur unter ihresgleichen: Ein «ein Museum besuchen» zwischen
    // lauter Nomen fiele auf andere Weise auf.
    if (e.art === 'wort') {
      const art = deSorte(t.zeigeDe), nomen = k => !OHNE_NOMEN.includes(k.cat);
      for (const stufe of stufen(gleicheArt.filter(k => nomen(k) === nomen(e)))) {
        for (const k of mische(stufe.slice())) mische(k.teile.map((x, i) => i)).filter(i => deSorte(k.teile[i].zeigeDe) === art).some(i => nimm(k, i));
      }
    }
    // Sätze bekommen Sätze zur Auswahl, Wörter bekommen Wörter
    for (const stufe of [...stufen(gleicheArt), pool]) {
      for (const k of mische(stufe.slice())) mische(k.teile.map((x, i) => i)).some(i => nimm(k, i));
    }
    return aus;
  }

  // Die fertige Auswahl: das Ziel und seine Ablenker, gemischt
  function auswahl(e, o, seite, n) {
    const zeile = (x, i, j) => ({
      text: seite === 'de' ? x.teile[i].zeigeDe : x.teile[i].fr[j],
      richtig: x === e,
      // Steht nach einem Fehlgriff unter der falschen Antwort
      sub: x.teile[i].fr[j] + ' = ' + x.teile[i].zeigeDe,
    });
    return mische([zeile(e, o.teil, o.form), ...ablenker(e, o.teil, seite, n, o.form).map(x => zeile(x.e, x.teil, 0))]);
  }

  /* ---------- Buchstaben legen ---------- */

  // Buchstaben, die sich leicht verwechseln
  const VERWECHSLER = { c: 's', s: 'c', k: 'c', q: 'k', g: 'j', j: 'g', i: 'y', y: 'i', f: 'v', v: 'f', m: 'n', n: 'm', e: 'é', a: 'à' };

  // Bis zu drei Störbuchstaben: zuerst, was bei den Akzenten lockt, dann die Verwechsler der Reihe nach
  function stoerer(wort) {
    const aus = [];
    const dazu = ch => {
      if (ch && !aus.includes(ch)) aus.push(ch);
    };
    const zeichen = [...wort].filter(ch => /\p{L}/u.test(ch));
    for (const ch of zeichen) {
      const basis = AKZENT_BASIS[ch];
      if (ch === 'œ') {
        dazu('o');
        dazu('e');
      } else if (basis && basis !== ch) {
        dazu(basis);
        dazu(AKZENT_WAHL[basis].find(x => x !== ch && x !== basis));
      }
    }
    for (const ch of zeichen) {
      const klein = ch.toLowerCase(), v = VERWECHSLER[klein];
      // Zu einem grossen Buchstaben («ACM») passt nur ein grosser ohne Akzent
      if (v && ch !== klein) dazu(AKZENT_BASIS[v] && AKZENT_BASIS[v] !== v ? null : v.toUpperCase());
      else dazu(v);
    }
    return aus.slice(0, 3);
  }

  const mitKennung = kacheln => kacheln.map((k, i) => ({ id: 'k' + i, ...k }));
  const buchstabenKacheln = (plaetze, wort) => mischeKacheln(
    [...plaetze.filter(p => p.art === 'buchstabe').map(p => ({ text: p.soll, art: 'buchstabe' })),
      ...stoerer(wort).map(text => ({ text, art: 'buchstabe', fremd: true }))],
    plaetze.filter(p => p.art === 'buchstabe').map(p => p.soll));

  // Plätze und Kacheln für «legen». k ist der Kartenstand: Er bestimmt, welches Wort einer langen Form fehlt.
  // lueckenwort: das Wort, das fehlt, oder null, wenn die ganze Form gelegt wird.
  function buchstaben(form, k, e) {
    if (mitLueckenwort(form, e)) return buchstabenImWort(form, k, e);
    const z = zerlegen(form, e);
    const plaetze = [];
    let artikel = [];
    if (['le', 'la', 'un', 'une'].includes(z.artikel)) {
      const paar = z.artikel === 'le' || z.artikel === 'la' ? ['le', 'la'] : ['un', 'une'];
      // Führt der Teil dasselbe Wort mit beiden Artikeln («un enfant, une enfant»), stimmen beide
      const teil = e.teile.find(t => t.fr.includes(form));
      const beide = teil && paar.every(a => teil.fr.includes(a + ' ' + z.kern));
      // Der Artikel der gefragten Form steht vorn: Er ist die Lösung, die gezeigt wird
      const soll = beide ? [z.artikel, ...paar.filter(a => a !== z.artikel)] : z.artikel;
      plaetze.push({ art: 'artikel', soll, wort: 0 }, { art: 'fest', text: ' ', wort: 0 });
      artikel = paar.map(text => (beide || text === z.artikel ? { text, art: 'artikel' } : { text, art: 'artikel', fremd: true }));
    } else if (z.artikel) {
      // «l’» und «les» verraten kein Geschlecht und sind vorgedruckt
      plaetze.push({ art: 'fest', text: z.artikel, wort: 0 });
      if (z.artikel !== 'l’') plaetze.push({ art: 'fest', text: ' ', wort: 0 });
    }
    let wort = 0;
    for (const ch of z.kern) {
      if (/\p{L}/u.test(ch)) plaetze.push({ art: 'buchstabe', soll: ch, wort });
      else plaetze.push({ art: 'fest', text: ch, wort });
      if (ch === ' ') wort++;
    }
    return { plaetze, kacheln: mitKennung([...artikel, ...buchstabenKacheln(plaetze, z.kern)]), lueckenwort: null };
  }

  // Die Form ist vorgedruckt, nur ein Wort wird gelegt. Welches, wechselt mit jedem Erfolg der Karte.
  function buchstabenImWort(form, k, e) {
    const alle = woerter(form), wahl = lueckenwoerter(alle, e);
    const ziel = wahl[((k && k.richtig) || 0) % wahl.length];
    // Wie beim Legen der ganzen Form bleibt der Artikel in der Gruppe des ersten Worts
    const artikel = e.art === 'wort' && alle.length > 1 && alle[0].text === zerlegen(form, e).artikel ? 1 : 0;
    const plaetze = [];
    alle.forEach((w, i) => {
      const wort = Math.max(0, i - artikel);
      if (i) plaetze.push({ art: 'fest', text: ' ', wort: Math.max(0, i - 1 - artikel) });
      if (w !== ziel) plaetze.push({ art: 'fest', text: w.text, wort });
      else {
        let erster = w.satzanfang;
        for (const ch of w.kachel) {
          if (!/\p{L}/u.test(ch)) plaetze.push({ art: 'fest', text: ch, wort });
          else if (erster) plaetze.push({ art: 'buchstabe', soll: ch, satzanfang: true, wort });
          else plaetze.push({ art: 'buchstabe', soll: ch, wort });
          erster = false;
        }
      }
      if (w.danach) plaetze.push({ art: 'fest', text: w.danach, wort });
    });
    return { plaetze, kacheln: mitKennung(ziel ? buchstabenKacheln(plaetze, ziel.kachel) : []), lueckenwort: ziel ? ziel.text : null };
  }

  /* ---------- Akzente ---------- */

  // Die Form mit zwei bis vier Lücken: überall, wo ein Akzent steht, und dazu ein paar schlichte
  // e, a, u, c, damit die Lücke allein nichts verrät. Der Artikel bleibt immer ganz stehen.
  function akzentLuecken(form, e) {
    const z = zerlegen(form, e), zeichen = [...z.kern];
    const stellen = was => zeichen.map((ch, i) => (was(ch) ? i : -1)).filter(i => i >= 0);
    let luecken = stellen(ch => AKZENT_RE.test(ch));
    const schlicht = mische(stellen(ch => 'eauc'.includes(ch)));
    const zahl = Math.min(grenze(luecken.length + 1, 2, 4), luecken.length + schlicht.length);
    if (luecken.length > 4) luecken = mische(luecken).slice(0, 4);
    while (luecken.length < zahl) luecken.push(schlicht.pop());
    const plaetze = [];
    if (z.artikel) {
      plaetze.push({ art: 'fest', text: z.artikel, wort: 0 });
      if (z.artikel !== 'l’') plaetze.push({ art: 'fest', text: ' ', wort: 0 });
    }
    let wort = 0;
    zeichen.forEach((ch, i) => {
      if (luecken.includes(i)) plaetze.push({ art: 'luecke', soll: ch, wahl: AKZENT_WAHL[AKZENT_BASIS[ch]].slice(), wort });
      else plaetze.push({ art: 'fest', text: ch, wort });
      if (ch === ' ') wort++;
    });
    return { plaetze };
  }

  /* ---------- Wörter ordnen, Lücke im Satz ---------- */

  // Plätze und Kacheln für «ordnen» und «bauen». fremd: Wörter, die nicht in den Satz gehören.
  function wortkacheln(form, fremd) {
    const alle = woerter(form), plaetze = [];
    alle.forEach((w, i) => {
      plaetze.push({ art: 'wort', soll: w.kachel, satzanfang: w.satzanfang, wort: i });
      if (w.danach) plaetze.push({ art: 'fest', text: w.danach, wort: i });
    });
    const kacheln = mischeKacheln(
      [...alle.map(w => ({ text: w.kachel, art: 'wort' })), ...(fremd || []).map(text => ({ text, art: 'wort', fremd: true }))],
      alle.map(w => w.kachel));
    return { plaetze, kacheln: mitKennung(kacheln) };
  }

  // Wörter aus den Sätzen und Wortformen: einmal gesammelt, wenn die erste Aufgabe sie braucht
  let vorrat = null;
  function wortVorrat() {
    if (vorrat) return vorrat;
    vorrat = { saetze: [], jeUnite: {} };
    for (const e of V.VOKABELN) {
      if (e.art === 'satz') {
        e.teile.forEach((t, teil) => vorrat.saetze.push({ e, teil,
          woerter: woerter(t.fr[0]).map(w => w.kachel).filter(w => !V.EIGENNAMEN.includes(w)) }));
        continue;
      }
      const liste = vorrat.jeUnite[e.un] || (vorrat.jeUnite[e.un] = []);
      for (const t of e.teile) {
        for (const f of t.fr) {
          // Kürzel in Grossbuchstaben («ACM», «BD») taugen nicht als Wort in einem Satz
          for (const w of woerter(zerlegen(f, e).kern)) if (buchstabenZahl(w.text) >= 3 && w.text === w.kachel) liste.push(w.text);
        }
      }
    }
    return vorrat;
  }

  // n Wörter, die nicht in den Satz gehören: falsche Antworten für die Lücke (laenge = Buchstaben des
  // Lückenworts) und fremde Kacheln beim Satzbau. Unité 1 hat nur zwei Sätze, die sich in einem Wort
  // unterscheiden, darum geht es Stufe um Stufe weiter weg, bis genug da sind.
  function fremdeWoerter(e, teil, n, laenge) {
    const v = wortVorrat();
    const ziel = woerter(e.teile[teil].fr[0]).map(w => w.kachel);
    // Nie ein Wort aus dem Satz selbst, nie zwei, die sich nur im Akzent unterscheiden
    const vergeben = new Set(ziel.map(falte));
    const eigene = v.saetze.filter(s => s.e === e && s.teil !== teil).flatMap(s => s.woerter);
    const stufen = [
      v.saetze.filter(s => s.e.un === e.un && !(s.e === e && s.teil === teil)).flatMap(s => s.woerter),
      v.saetze.filter(s => s.e.un !== e.un).flatMap(s => s.woerter),
      v.jeUnite[e.un] || [],
    ];
    // Für die Lücke zuerst ähnlich lange Wörter, für den Satzbau zuerst solche mit bekanntem Anfang.
    // Die Varianten derselben Karte («bleue», «verte», «rouge») sind füreinander die besten Ablenker.
    const anfang = new Set(ziel.map(w => falte(w)[0]));
    const zuerst = laenge ? w => Math.abs(buchstabenZahl(w) - laenge) <= 3 : w => anfang.has(falte(w)[0]);
    const listen = [laenge ? eigene.filter(zuerst) : eigene];
    for (const s of stufen) listen.push(s.filter(zuerst), s);
    const aus = [];
    for (const liste of listen) {
      for (const w of mische(liste.slice())) {
        if (aus.length >= n) return aus;
        if (vergeben.has(falte(w))) continue;
        vergeben.add(falte(w));
        aus.push(w);
      }
    }
    return aus;
  }

  // Der Satz mit einer Lücke und vier Wörter zur Auswahl. Welches Wort fehlt, wechselt mit jedem Auftritt.
  function luecke(e, teil, k) {
    const alle = woerter(e.teile[teil].fr[0]);
    // Nur Wörter, die im Satz einmal stehen: In «Vous coupez. Coupez.» fehlt «vous», nie «coupez»
    let wahl = lueckenwoerter(alle, e).filter(w => alle.filter(x => x.kachel === w.kachel).length === 1);
    if (!wahl.length) wahl = [alle.slice().sort((a, b) => buchstabenZahl(b.text) - buchstabenZahl(a.text))[0]];
    const ziel = wahl[((k && k.gesehen) || 0) % wahl.length];
    const plaetze = [];
    alle.forEach((w, i) => {
      if (i) plaetze.push({ art: 'fest', text: ' ', wort: i - 1 });
      plaetze.push(w === ziel ? { art: 'luecke', soll: w.text, wort: i } : { art: 'fest', text: w.text, wort: i });
      if (w.danach) plaetze.push({ art: 'fest', text: w.danach, wort: i });
    });
    // Am Satzanfang stehen alle vier gross da, sonst alle klein: Die Schreibung verrät nichts
    const zeige = w => (ziel.satzanfang ? w[0].toUpperCase() + w.slice(1) : w);
    const optionen = mische([{ text: zeige(ziel.kachel), richtig: true, sub: null },
      ...fremdeWoerter(e, teil, 3, buchstabenZahl(ziel.text)).map(w => ({ text: zeige(w), richtig: false, sub: null }))]);
    return { plaetze, optionen };
  }

  /* ---------- Aufgabe ---------- */

  // «der Stuhl» → «Stuhl»: Die Artikel-Übung fragt nach dem französischen Geschlecht, nicht nach dem deutschen Artikel
  function ohneDeArtikel(s) {
    return s.split(', ').map(x => {
      const m = x.match(/^(der|die|das|ein|eine) (.*)$/);
      if (!m) return x;
      // «der weisse Champignon» → «weisser Champignon»: Ohne Artikel trägt das Adjektiv die Endung
      const endung = { der: 'r', das: 's' }[m[1]];
      return endung ? m[2].replace(/^(\p{Ll}+e) /u, '$1' + endung + ' ') : m[2];
    }).join(', ');
  }

  function eintragVon(schritt) {
    const e = V.VOKABELN[schritt.nr];
    if (e && (schritt.kid == null || e.kid === schritt.kid)) return e;
    return schritt.kid != null && hat(V.KARTE, schritt.kid) ? V.KARTE[schritt.kid] : null;
  }

  // Das Finale: bis zu vier Karten der Runde als Paare. Jede mit dem Teil, bei dem sie gerade steht.
  function paareAufgabe(schritt, z) {
    const paare = [];
    for (const kid of schritt.kids || []) {
      if (!hat(V.KARTE, kid)) continue;
      const e = V.KARTE[kid], k = zustand(z, kid);
      const teil = e.teile[k.teil] ? k.teil : 0, t = e.teile[teil];
      // Zwei Kacheln mit demselben Text liessen sich nicht eindeutig zuordnen
      if (paare.some(p => norm(p.fr) === norm(t.fr[0]) || norm(p.de) === norm(t.zeigeDe))) continue;
      paare.push({ nr: e.nr, fr: t.fr[0], de: t.zeigeDe, clip: V.vokabelClip(e, teil, 0) });
    }
    return { schritt, e: null, uebung: 'paare', vorgabe: null, teil: 0, form: 0, fr: null, de: null,
      clip: null, clipLangsam: null, clipEintrag: null, ton: null, aepfel: aepfel(schritt, { art: 'ohne' }), paare };
  }

  // Macht aus einem Schritt die Aufgabe, die die Ansicht zeigt. Was jede Übung bekommt, steht im
  // Vertrag am Anfang der Datei. null, wenn es den Eintrag oder die Übung nicht gibt.
  function aufgabe(schritt, z) {
    if (!schritt) return null;
    if (schritt.uebung === 'paare') return paareAufgabe(schritt, z);
    const e = eintragVon(schritt), uebung = schritt.uebung;
    if (!e || !hat(VORGABE, uebung)) return null;
    const k = zustand(z, e.kid);
    // Nach dem Ohr werden nur Wörter geschrieben und nur Sätze geordnet
    const nachOhr = schritt.vorgabe === 'ton' && ((uebung === 'schreiben' && e.art === 'wort') || (uebung === 'ordnen' && e.art === 'satz'));
    const o = uebung === 'schreiben' ? schreibOrt(e, schritt.teil, schritt.form) : ort(uebung, e, schritt.teil, schritt.form);
    const t = e.teile[o.teil], text = t.fr[o.form];
    // Kennenlernen und Nachsprechen zeigen und sprechen den ganzen Eintrag, alles andere genau eine Form
    const ganz = uebung === 'kennen' || uebung === 'echo';
    const a = {
      schritt, e, uebung, vorgabe: nachOhr ? 'ton' : VORGABE[uebung], teil: o.teil, form: o.form,
      fr: ganz ? e.fr : text,
      de: ganz ? e.de : t.zeigeDe,
      clip: ganz ? V.vokabelClip(e) : V.vokabelClip(e, o.teil, o.form),
      clipLangsam: ganz ? V.vokabelClip(e, undefined, undefined, true) : V.vokabelClip(e, o.teil, o.form, true),
      clipEintrag: V.vokabelClip(e),
      ton: null,
      aepfel: aepfel(schritt, { art: uebung === 'kennen' || uebung === 'echo' ? 'ohne' : 'richtig' }),
    };
    if (uebung === 'bedeutung' || uebung === 'hoeren') a.optionen = auswahl(e, o, 'de', e.art === 'satz' ? 2 : 3);
    else if (uebung === 'finden') a.optionen = auswahl(e, o, 'fr', 3);
    else if (uebung === 'lauschen') a.optionen = auswahl(e, o, 'klang', 3);
    else if (uebung === 'artikel') {
      const zer = zerlegen(text, e), stuecke = zer.kern.split(' ');
      // «les» bleibt stehen: Die Mehrzahl ist die Form, die das Buch lehrt
      a.kopf = (zer.artikel === 'les' ? 'les ' : '') + stuecke[0];
      a.rest = stuecke.slice(1).join(' ');
      a.de = ohneDeArtikel(t.zeigeDe);
      a.genus = e.genus;
      // Die Knöpfe nennen nur Artikel, die es zu diesem Wort gibt: nie «la école»
      const paar = { le: ['le', 'la'], la: ['le', 'la'], un: ['un', 'une'], une: ['un', 'une'] }[zer.artikel];
      a.knoepfe = paar ? [{ gross: paar[0], klein: 'männlich' }, { gross: paar[1], klein: 'weiblich' }]
        : [{ gross: 'männlich', klein: '(m)' }, { gross: 'weiblich', klein: '(f)' }];
    } else if (uebung === 'akzent') a.plaetze = akzentLuecken(text, e).plaetze;
    else if (uebung === 'legen') Object.assign(a, buchstaben(text, k, e));
    else if (uebung === 'schreiben') {
      a.ziel = text;
      a.formen = t.fr.slice();
      // Steht unter dem Deutschen als «anders als: …», wenn eine spätere Form gefragt ist
      a.andersAls = nachOhr ? [] : t.fr.slice(0, o.form);
    } else if (uebung === 'luecke') Object.assign(a, luecke(e, o.teil, k));
    else if (uebung === 'ordnen') Object.assign(a, wortkacheln(text));
    else if (uebung === 'bauen') Object.assign(a, wortkacheln(text, fremdeWoerter(e, o.teil, 3)));
    return a;
  }

  // Der Artikel im Deutschen ist anders als im Französischen: Das sagt die Karte beim Kennenlernen
  // an. Berechnet, also sicher wahr. null, wo es nichts zu sagen gibt.
  function kontrast(e) {
    const t = e.teile[e.artikelTeil];
    if (!t || (e.genus !== 'm' && e.genus !== 'f') || e.plural) return null;
    const de = t.de[0];
    const genusDe = { der: 'm', die: 'f', eine: 'f' }[de.split(' ')[0]];
    if (!genusDe || genusDe === e.genus) return null;
    return 'Achtung: ' + de + ', aber ' + t.fr[0] + '.';
  }

  /* ---------- Urteil über Getipptes ---------- */

  // Wem gehört diese Form sonst? Eine andere Karte, oder ein anderer Teil derselben.
  let formen = null;
  function andereKarte(ein, e, teil) {
    if (!formen) {
      formen = new Map();
      for (const x of V.VOKABELN) {
        x.teile.forEach((t, i) => t.fr.forEach(f => {
          if (!formen.has(norm(f))) formen.set(norm(f), []);
          formen.get(norm(f)).push({ nr: x.nr, teil: i });
        }));
      }
    }
    const treffer = formen.get(ein) || [];
    return treffer.find(x => V.VOKABELN[x.nr].kid !== e.kid) || treffer.find(x => x.nr === e.nr && x.teil !== teil) || null;
  }

  const GENUS_VON = { le: 'm', un: 'm', la: 'f', une: 'f' };
  // Derselbe Artikel im anderen Geschlecht: Dorthin führt der Tipp «Probier den anderen»
  const ANDERER = { le: 'la', la: 'le', un: 'une', une: 'un' };
  // Hier ist «un» statt «le» einfach die andere richtige Form; bei Fächern und Hobbys hiesse es etwas anderes
  const BUCH_GRUPPEN = ['ding', 'fam', 'essen', 'gesicht'];
  // Was vor einem Wort stehen kann, ohne sein Artikel zu sein («des cheveux», «du piano», «de la
  // guitare», «aux échecs»); «de la » und «de l’» vor «de ». Die Eingabe ist schon umgeformt (’).
  const VORN_RE = /^(de la |de l’|des |du |de |d’|aux |au )/;

  // Tippt jemand einen Artikel des anderen Geschlechts? «l’» und «les» verraten keines.
  function genusVertauscht(getippt, soll, e) {
    const g = GENUS_VON[getippt];
    const gSoll = GENUS_VON[soll] || (soll === 'l’' && (e.genus === 'm' || e.genus === 'f') ? e.genus : null);
    return !!g && !!gSoll && g !== gSoll;
  }

  // Urteil über den getippten Artikel, in dieser Reihenfolge. 'buch' heisst: ein anderer richtiger Artikel.
  function artikelUrteil(getippt, soll, e, sollKern, diktat) {
    if (getippt === soll) return 'ok';
    const g = GENUS_VON[getippt];
    const gSoll = GENUS_VON[soll] || (soll === 'l’' && (e.genus === 'm' || e.genus === 'f') ? e.genus : null);
    const gleichesGenus = !!g && g === gSoll;
    if (BUCH_GRUPPEN.includes(e.cat) && gleichesGenus && (getippt === 'un' || getippt === 'une') && soll !== 'un' && soll !== 'une') return 'buch';
    // Jedes un/une-Wort beginnt mit einem Vokal: «l’» ist dort immer richtig, darum darf der
    // Tipp zur Elision auch immer dorthin führen
    if (getippt === 'l’' && (soll === 'un' || soll === 'une')) return 'buch';
    if ((getippt === 'le' || getippt === 'la') && (soll === 'l’' || soll === 'un' || soll === 'une')) return 'elision';
    if (getippt === 'l’' && (soll === 'le' || soll === 'la') && sollKern.startsWith('h')) return 'artikel_ganz';
    // Das Geschlecht ist vertauscht. Ein Fehler im Geschlecht ist es aber nur, wenn «der andere»
    // Artikel dann auch gilt: «un musique» führte zu «une musique», und das stimmt nur bei Dingen,
    // Familie, Essen und Gesicht. Sonst zeigt der Hinweis den Anfang («la …»).
    if (g && gSoll && g !== gSoll) {
      const tausch = artikelUrteil(ANDERER[getippt], soll, e, sollKern, diktat);
      return tausch === 'ok' || (tausch === 'buch' && !diktat) ? 'genus' : 'anders';
    }
    if (getippt === null) return 'fehlt';
    return 'anders';
  }

  // Urteil über das Wort ohne Artikel, vom Harmlosen zum Groben
  function kernUrteil(getippt, soll) {
    if (getippt === soll) return 'ok';
    if (getippt.replace(/œ/g, 'oe') === soll.replace(/œ/g, 'oe')) return 'ligatur';
    if (ohneAkzente(getippt) === ohneAkzente(soll)) return 'akzent';
    if (ohneZeichen(getippt) === ohneZeichen(soll)) return 'zeichen';
    // Beides zugleich («grand mere»): Die Buchstaben stimmen immer noch alle. urteil() setzt dazu
    // zeichen, denn der Hinweis muss beides nennen, sonst ist nach dem Akzent der zweite Versuch daneben.
    if (ohneZeichen(ohneAkzente(getippt)) === ohneZeichen(ohneAkzente(soll))) return 'akzent';
    // Wirklich nur eine Stelle: Kommt ein Akzent dazu, wäre «nur ein Buchstabe» gelogen
    if (buchstabenZahl(soll) >= 4 && abstand(getippt, soll) === 1) return 'tippfehler';
    return 'anders';
  }

  // Beurteilt eine getippte Antwort. opt = { form, vorgabe }; vorgabe 'ton' ist das Diktat.
  // Richtig ist nur: Artikel 'ok' oder 'buch' und Kern 'ok'. Steht ganz auf 'gleiche_form', zählt
  // der Versuch nicht. stellen zeigt in die Eingabe, wie sie getippt wurde.
  // fehler: was der Versuch verrät, 'genus' und/oder 'akzent' (für Ergebnis.fehler).
  // zeichen: bei kern 'akzent' stimmen auch Abstand, Apostroph oder Bindestrich nicht («la grand mere»).
  // bezug: die Form, an der gemessen wurde. Solange die erste Form gefragt ist, gilt jede Form des
  // Teils; ein Vertipper wird an der gemessen, der er am nächsten ist. Sonst ist bezug gleich ziel.
  function urteil(eingabe, e, teil, opt) {
    const t = e.teile[teil] || e.teile[0];
    const form = opt && t.fr[opt.form] ? opt.form : 0;
    const diktat = !!opt && opt.vorgabe === 'ton';
    const ziel = t.fr[form];
    const n = normMitStellen(eingabe), ein = n.text;
    const u = { richtig: false, ganz: null, artikel: 'ok', kern: 'ok', zeichen: false, stellen: [], ziel, bezug: ziel, andere: null, fehler: [] };
    const inEingabe = stellen => [...new Set(stellen.map(i => n.von[i]))].sort((a, b) => a - b);

    if (ein === norm(ziel)) {
      u.richtig = true;
      return u;
    }

    // «les mathematiques», während «les maths» gefragt ist, ist ein Akzent in «les mathématiques»,
    // kein ganz anderes Wort: Hinweis und Markierung gehören zu dieser Form. Bei Gleichstand das Ziel.
    // Nur nach dem Deutschen und solange die erste Form gefragt ist; was zu lang ist, tippt niemand.
    let bezugForm = form;
    if (!diktat && form === 0 && t.fr.length > 1) {
      const weg = f => abstand(ohneAkzente(ein), ohneAkzente(norm(f)));
      let best = weg(ziel);
      t.fr.forEach((f, i) => {
        if (i === form || f.length > K.SCHREIBEN_MAX || !(weg(f) < best)) return;
        best = weg(f);
        bezugForm = i;
      });
    }
    const bezug = t.fr[bezugForm], soll = norm(bezug);
    u.bezug = bezug;

    // Artikel und Kern einzeln. Hat das Ziel keinen Artikel, wird auch die Eingabe nicht zerlegt:
    // «peu de persil» ist dann einfach ein anderes Wort, kein fehlender Artikel.
    const z = zerlegen(bezug, e), sollKern = norm(z.kern);
    let kernEin = ein, ab = 0, auchRichtig = false, genusFalsch = false;
    const stellen = [];
    if (z.artikel !== null) {
      let x = zerlegen(ein);
      // Vorn steht etwas, nur nicht der Artikel: «des cheveux», «du piano», «de la guitare», oder ein
      // vertippter («ls cheveux», «lé piano»). Das ist ein anderer Artikel, kein fehlender: Sonst hiesse
      // es «Vorne fehlt der Artikel», und wer ihn davorsetzt, hätte zwei. Nur wenn der Rest dem Wort
      // näher ist als das Ganze: «de ssin» für «le dessin» bleibt ein fehlender Artikel.
      if (x.artikel === null) {
        const m = ein.match(VORN_RE), i = ein.indexOf(' ');
        const vorn = m ? m[1] : i > 0 && i <= 3 ? ein.slice(0, i + 1) : '';
        if (vorn && abstand(ein.slice(vorn.length), sollKern) < abstand(ein, sollKern)) x = { artikel: vorn.trim(), kern: ein.slice(vorn.length) };
      }
      kernEin = x.kern;
      ab = ein.length - kernEin.length;
      u.artikel = artikelUrteil(x.artikel, z.artikel, e, sollKern, diktat);
      // «un musique» ist ein anderer Artikel, verrät aber ein Geschlecht im Kopf, das nicht stimmt
      genusFalsch = u.artikel === 'anders' && genusVertauscht(x.artikel, z.artikel, e);
      // Im Diktat zählt nur, was zu hören war
      if (u.artikel === 'buch' && diktat) {
        u.artikel = 'anders';
        auchRichtig = true;
      }
      // Im Diktat eines un/une-Worts führte der Tipp zur Elision zu «l’oncle», und das war nicht zu
      // hören: ein zweiter Fehlversuch. Der Hinweis auf den Anfang führt dagegen zu «un oncle».
      if (u.artikel === 'elision' && diktat && (z.artikel === 'un' || z.artikel === 'une')) u.artikel = 'anders';
      if (x.artikel && u.artikel !== 'ok' && u.artikel !== 'buch') for (let i = 0; i < x.artikel.length; i++) stellen.push(i);
    }
    u.kern = kernUrteil(kernEin, sollKern);
    u.zeichen = u.kern === 'akzent' && ohneAkzente(kernEin) !== ohneAkzente(sollKern);
    if (u.kern !== 'ok') for (const i of abweichungen(kernEin, sollKern)) stellen.push(i + ab);

    const andereForm = t.fr.findIndex((f, i) => i !== form && norm(f) === ein);
    const fremd = andereForm < 0 ? andereKarte(ein, e, e.teile.indexOf(t)) : null;
    if (andereForm >= 0 && !diktat && form === 0) {
      // Solange die erste Form gefragt ist, stimmt jede Form des Teils
      Object.assign(u, { richtig: true, ganz: 'auch', artikel: 'ok', kern: 'ok', zeichen: false, bezug: t.fr[andereForm] });
      return u;
    }
    if (andereForm >= 0) u.ganz = !diktat && andereForm < form ? 'gleiche_form' : 'andere_form';
    else if (fremd) {
      u.ganz = 'verwechselt';
      u.andere = fremd;
    } else if (ohneZeichen(ein) === ohneZeichen(soll)) {
      // «lallemand», «la grand mère»: Nur Abstand, Apostroph oder Bindestrich stimmen nicht
      Object.assign(u, { artikel: 'ok', kern: 'zeichen', zeichen: false, stellen: inEingabe(abweichungen(ein, soll)) });
      return u;
    } else if (ohneAkzente(ein) !== ohneAkzente(soll) && ohneZeichen(ohneAkzente(ein)) === ohneZeichen(ohneAkzente(soll))) {
      // «la grand mere», «lage», «l equitation»: Alle Buchstaben stimmen, aber Akzente und die
      // Zeichen dazwischen nicht. Ein «l» ohne Apostroph ist kein fehlender Artikel.
      Object.assign(u, { artikel: 'ok', kern: 'akzent', zeichen: true, stellen: inEingabe(abweichungen(ein, soll)), fehler: ['akzent'] });
      return u;
    } else if (auchRichtig && u.kern === 'ok') u.ganz = 'andere_form';

    if (u.ganz !== 'gleiche_form') u.stellen = inEingabe(stellen);
    u.richtig = !u.ganz && (u.artikel === 'ok' || u.artikel === 'buch') && u.kern === 'ok';
    // «une maman», während «la mère» gefragt ist: richtig wie die andere Form selbst
    if (u.richtig && bezugForm !== form) u.ganz = 'auch';
    if (!u.ganz && (u.artikel === 'genus' || genusFalsch)) u.fehler.push('genus');
    if (!u.ganz && u.kern === 'akzent') u.fehler.push('akzent');
    return u;
  }

  /* ---------- Urteil über Gelegtes ---------- */

  // Vergleicht Platz für Platz; gleiche Kacheln sind austauschbar, weil nur ihr Text zählt.
  // soll[i] ist ein Text, eine Liste erlaubter Texte oder der Platz selbst ({ art, soll }).
  // Mit Plätzen sagt tipp, welcher Hinweis passt: 'genus' (nur der Artikel), 'akzent' (nur Akzente),
  // 'buchstabe' (genau ein Buchstabe), 'reihenfolge' (die richtigen Wörter, falsch gereiht), sonst 'legen'.
  function reihenUrteil(gelegt, soll) {
    const plaetze = soll.map(s => (s && typeof s === 'object' && !Array.isArray(s) ? s : { art: null, soll: s }));
    const erlaubt = p => (Array.isArray(p.soll) ? p.soll : [p.soll]);
    const stellen = [];
    plaetze.forEach((p, i) => {
      if (!erlaubt(p).includes(gelegt[i])) stellen.push(i);
    });
    const u = { richtig: !stellen.length, stellen, tipp: null, fehler: [] };
    if (u.richtig) return u;
    const artikelFalsch = stellen.some(i => plaetze[i].art === 'artikel');
    const rest = stellen.filter(i => plaetze[i].art !== 'artikel');
    const nurAkzente = rest.length > 0 && rest.every(i => gelegt[i] != null && erlaubt(plaetze[i]).some(s => falte(s) === falte(gelegt[i])));
    if (artikelFalsch) u.fehler.push('genus');
    if (nurAkzente) u.fehler.push('akzent');
    if (plaetze.some(p => p.art === 'wort')) {
      // Liegen genau die richtigen Wörter da, stimmt nur die Reihenfolge nicht
      const sortiert = liste => liste.map(String).sort().join('\n');
      u.tipp = sortiert(gelegt) === sortiert(plaetze.map(p => erlaubt(p)[0])) ? 'reihenfolge' : 'legen';
    } else if (!rest.length) u.tipp = 'genus';
    else if (artikelFalsch) u.tipp = 'legen';
    else if (nurAkzente) u.tipp = 'akzent';
    else u.tipp = rest.length === 1 ? 'buchstabe' : 'legen';
    return u;
  }

  /* ---------- Äpfel ---------- */

  // Was ein Schritt zahlt. Mit buchung (dem Ergebnis von Lernen.verbuchen) kommt der Bonus für
  // eine Karte dazu, die gerade Stufe 3 oder 5 erreicht hat.
  function aepfel(schritt, ergebnis, buchung) {
    const art = ergebnis && ergebnis.art;
    // Im Finale: ein Apfel je Paar, einer weniger je Fehlgriff, aber nie keiner
    if (schritt.uebung === 'paare') return Math.max(1, (schritt.kids || []).filter(kid => hat(V.KARTE, kid)).length - ((ergebnis && ergebnis.fehlpaare) || 0));
    if (schritt.uebung === 'kennen' || schritt.uebung === 'echo') return K.APFEL[schritt.uebung];
    if (art !== 'richtig' && art !== 'fast') return 0;
    // Zweiter Versuch, Wiederholung nach einem Fehler, Füllaufgaben und alles im freien Üben zahlen einen Apfel
    let n = art === 'fast' || schritt.rolle === 'wdh' || schritt.rolle === 'fuell' || schritt.frei ? 1 : K.APFEL[schritt.uebung] || 0;
    if (buchung && buchung.stufe > buchung.vorher) n += buchung.stufe === 3 ? 2 : buchung.stufe === 5 ? 5 : 0;
    return n;
  }

  /* ---------- Gespeicherter Stand ---------- */

  const ZAEHLER = ['runden', 'perfekt', 'ohr', 'lelaLauf', 'lelaBest', 'akzent', 'saetze', 'geschrieben'];
  const DATUM_RE = /^\d{4}-\d{2}-\d{2}$/;
  const istObjekt = x => !!x && typeof x === 'object' && !Array.isArray(x);
  const neuerTag = heute => ({ datum: heute, neu: 0, runden: 0, frei: [] });

  // Ein frischer Stand, wie er unter nea.igel.franz gespeichert wird
  function neu() {
    const zaehler = {};
    for (const name of ZAEHLER) zaehler[name] = 0;
    return { v: 1, vorgestellt: false, gehoert: false, unite: null, ziele: {}, neuProTag: K.NEU_PRO_TAG, erklaert: {},
      tag: neuerTag(''), karten: {}, zaehler };
  }

  // Liest einen gespeicherten Stand Feld für Feld ab: Nur was bekannt ist und stimmt, kommt mit.
  // Wirft nie. Unlesbares oder eine fremde Version ergibt einen frischen Stand.
  function pruefen(roh) {
    try {
      return abgelesen(roh);
    } catch (err) {
      return neu();
    }
  }

  function abgelesen(roh) {
    const z = neu();
    if (!istObjekt(roh) || roh.v !== 1) return z;
    const zahl = x => (typeof x === 'number' && isFinite(x) && x >= 0 ? Math.floor(x) : 0);
    const datum = x => (typeof x === 'string' && DATUM_RE.test(x) ? x : '');
    const obj = x => (istObjekt(x) ? x : {});
    z.vorgestellt = roh.vorgestellt === true;
    z.gehoert = roh.gehoert === true;
    if (V.UNITE_REIHE.includes(roh.unite)) z.unite = roh.unite;
    const ziele = obj(roh.ziele), erklaert = obj(roh.erklaert);
    for (const g of V.LERNZIEL_REIHE) if (hat(ziele, g) && ziele[g] === true) z.ziele[g] = true;
    if (K.NEU_WAHL.includes(roh.neuProTag)) z.neuProTag = roh.neuProTag;
    for (const u of K.UEBUNGEN) if (hat(erklaert, u) && erklaert[u] === true) z.erklaert[u] = true;
    const t = obj(roh.tag);
    z.tag = { datum: datum(t.datum), neu: zahl(t.neu), runden: zahl(t.runden),
      frei: Array.isArray(t.frei) ? [...new Set(t.frei.filter(kid => typeof kid === 'string' && hat(V.KARTE, kid)))] : [] };
    const karten = obj(roh.karten);
    for (const kid of Object.keys(karten)) {
      // Karten, die der Wortschatz nicht mehr kennt, fallen weg
      if (!hat(V.KARTE, kid) || !istObjekt(karten[kid])) continue;
      const r = karten[kid], e = V.KARTE[kid], s = obj(r.schwach);
      const k = zustand(null, kid);
      k.st = Math.min(zahl(r.st), 5);
      k.faellig = datum(r.faellig);
      k.auf = datum(r.auf);
      k.ab = datum(r.ab);
      k.rueck = r.rueck === true;
      k.teil = Math.min(zahl(r.teil), e.teile.length - 1);
      k.form = Math.min(zahl(r.form), e.teile[k.teil].fr.length - 1);
      for (const name of ['fest', 'gesehen', 'richtig', 'falsch']) k[name] = zahl(r[name]);
      for (const name of Object.keys(k.schwach)) k.schwach[name] = Math.min(zahl(s[name]), 3);
      k.zuletzt = typeof r.zuletzt === 'string' && /^[raf]{0,5}$/.test(r.zuletzt) ? r.zuletzt : '';
      // Wer eine Stufe hat, wurde auch gesehen; wer nie gesehen wurde, braucht keinen Eintrag
      if (k.st >= 1 && !k.gesehen) k.gesehen = 1;
      if (k.gesehen) z.karten[kid] = k;
    }
    const zaehler = obj(roh.zaehler);
    for (const name of ZAEHLER) z.zaehler[name] = zahl(zaehler[name]);
    return z;
  }

  // Ging die Uhr des iPads einmal vor, tragen die Karten dieses Tages Daten aus der Zukunft: Eine
  // Karte wäre erst nach jenem Tag wieder fällig, vielleicht in Jahren, und fiele unbemerkt aus der
  // Wiederholung. Keine Karte ist aber je weiter weg fällig als die längste Pause ihrer Stufe, und
  // kein Auf- oder Abstieg liegt nach heute. Was darüber hinausgeht, wird zurückgeholt. Bei einem
  // Stand, der richtig gespielt wurde, ändert sich nichts.
  function zurueckholen(k, heute) {
    if (!DATUM_RE.test(heute)) return k;
    const st = grenze(Math.floor(k.st) || 0, 0, 5);
    const pause = st === 5 && k.fest >= 1 ? K.REIF_INTERVALLE[Math.min(k.fest, K.REIF_INTERVALLE.length) - 1] : K.INTERVALLE[st];
    const spaetestens = tagPlus(heute, Math.max(1, pause));
    if (DATUM_RE.test(k.faellig) && k.faellig > spaetestens) k.faellig = spaetestens;
    if (k.auf > heute) k.auf = '';
    if (k.ab > heute) k.ab = '';
    return k;
  }

  // Stellt den Tag um, wenn ein neuer begonnen hat, und holt Daten aus der Zukunft zurück. Nach
  // pruefen() ist alles andere schon da; der Rest fängt Zustände auf, die von Hand gebaut sind.
  function heuteIn(z, heute) {
    if (!istObjekt(z.karten)) z.karten = {};
    if (!istObjekt(z.ziele)) z.ziele = {};
    if (!istObjekt(z.zaehler)) z.zaehler = {};
    for (const name of ZAEHLER) if (!(z.zaehler[name] >= 0)) z.zaehler[name] = 0;
    if (!istObjekt(z.tag) || z.tag.datum !== heute) z.tag = neuerTag(heute);
    if (!Array.isArray(z.tag.frei)) z.tag.frei = [];
    for (const k of Object.values(z.karten)) if (istObjekt(k)) zurueckholen(k, heute);
    return z.tag;
  }

  /* ---------- Verbuchen ---------- */

  // Nach einer gelungenen Leitaufgabe ist die nächste Form dran, nach der letzten Form der nächste Teil:
  // So werden beide Hälften eines Paars und jede Schreibweise einmal verlangt, bevor die Karte reif ist
  function weiterDrehen(e, k) {
    const teil = e.teile[k.teil] ? k.teil : 0;
    if (e.teile[teil].fr[k.form + 1]) k.form++;
    else {
      k.form = 0;
      k.teil = (teil + 1) % e.teile.length;
    }
  }

  // Wie ein Ergebnis in zuletzt steht
  const ZEICHEN = { richtig: 'r', fast: 'a', falsch: 'f' };

  // Trägt eine Antwort ein: Stufe und Fälligkeit, Schwächen, Zähler. Schreibt z und gibt zurück,
  // was mit der Stufe geschah. Nur Checks und die Leitaufgabe einer fälligen Karte bewegen die Stufe.
  function verbuchen(z, schritt, ergebnis, heute) {
    const nichts = { vorher: 0, stufe: 0, auf: false, ab: false, reif: false };
    if (!istObjekt(z) || !schritt || !hat(V.KARTE, schritt.kid)) return nichts;
    const t = heuteIn(z, heute);
    const e = V.KARTE[schritt.kid], uebung = schritt.uebung, rolle = schritt.rolle;
    const art = ergebnis && ergebnis.art;
    const k = zustand(z, e.kid), vorher = k.st;
    const fertig = () => ({ vorher, stufe: k.st, auf: k.st > vorher, ab: k.st < vorher, reif: k.st === 5 && vorher < 5 });

    if (uebung === 'kennen') {
      // Erst das Kennenlernen legt die Karte an. Ein zweites Mal (nach verpasstem Check) zählt nicht mehr.
      if (!k.gesehen) {
        k.gesehen = 1;
        if (schritt.neu) t.neu++;
        z.karten[e.kid] = k;
      }
      return fertig();
    }
    if (uebung === 'echo' || uebung === 'paare' || !['richtig', 'fast', 'falsch'].includes(art)) return fertig();

    k.gesehen++;
    if (art === 'richtig') k.richtig++;
    if (art === 'falsch') k.falsch++;
    if (schritt.frei && !t.frei.includes(e.kid)) t.frei.push(e.kid);

    if (rolle === 'check') {
      k.zuletzt = (k.zuletzt + ZEICHEN[art]).slice(-5);
      // Schon der erste gelungene Check hebt die Karte; ein verpasster nimmt nichts zurück
      if (art === 'richtig' && k.st === 0) {
        k.st = 1;
        k.faellig = tagPlus(heute, K.INTERVALLE[1]);
        k.auf = heute;
      }
    } else if (rolle === 'leit' && k.st >= 1 && k.faellig <= heute) {
      k.zuletzt = (k.zuletzt + ZEICHEN[art]).slice(-5);
      if (art === 'richtig' && k.auf !== heute) {
        if (k.st < 5) k.st++;
        else k.fest++;
        // Nach einem Fehler kommt die Karte schon morgen wieder, damit das Verpasste bald noch einmal dran ist
        const tage = k.rueck ? 1 : k.st === 5 && k.fest >= 1 ? K.REIF_INTERVALLE[Math.min(k.fest, K.REIF_INTERVALLE.length) - 1] : K.INTERVALLE[k.st];
        k.faellig = tagPlus(heute, tage);
        k.auf = heute;
        k.rueck = false;
        weiterDrehen(e, k);
      } else if (art === 'falsch') {
        // Höchstens ein Abstieg am Tag, und nie zurück unter Stufe 2: Wer gelegt hat, muss nicht wieder nur zuhören
        if (k.ab !== heute) {
          k.st = k.st === 5 ? 3 : Math.max(Math.min(k.st, 2), k.st - 1);
          k.fest = 0;
          k.ab = heute;
        }
        k.faellig = tagPlus(heute, 1);
        k.rueck = true;
      } else k.faellig = tagPlus(heute, 1);
    }

    // Schwächen: was schiefging, kommt als Nebenaufgabe öfter
    const schwach = (name, n) => {
      k.schwach[name] = grenze(k.schwach[name] + n, 0, 3);
    };
    const fehler = (ergebnis && Array.isArray(ergebnis.fehler) && ergebnis.fehler) || [];
    const diktat = uebung === 'schreiben' && schritt.vorgabe === 'ton';
    if (uebung === 'artikel') schwach('genus', art === 'falsch' ? 2 : art === 'richtig' ? -1 : 0);
    if (uebung === 'akzent') schwach('akzent', art === 'falsch' ? 2 : art === 'fast' ? 1 : -1);
    if (uebung === 'schreiben' || uebung === 'legen') {
      // Nur wo die passende Übung die Schwäche auch wieder abbauen kann, sonst bliebe die Karte für immer
      // «wackelig»: Sätze haben keine Akzent-Übung, «un/une élève» hat keine Artikel-Übung, und ein
      // überzähliger Akzent in «la table» ist ein Vertipper
      if (fehler.includes('genus') && kann('artikel', e)) schwach('genus', 1);
      if (fehler.includes('akzent') && kann('akzent', e)) schwach('akzent', 1);
    }
    if (uebung === 'hoeren' || uebung === 'lauschen' || diktat) schwach('hoeren', art === 'falsch' ? 2 : art === 'richtig' ? -1 : 0);

    // Zähler für die Erfolge: nur was beim ersten Versuch gelang
    const zae = z.zaehler;
    if (art === 'richtig') {
      if (uebung === 'hoeren' || uebung === 'lauschen' || diktat) zae.ohr++;
      if ((uebung === 'ordnen' || uebung === 'bauen') && e.art === 'satz') zae.saetze++;
      if (uebung === 'akzent') zae.akzent++;
      if (uebung === 'schreiben') zae.geschrieben++;
    }
    if (uebung === 'artikel' && art !== 'fast') {
      zae.lelaLauf = art === 'richtig' ? zae.lelaLauf + 1 : 0;
      zae.lelaBest = Math.max(zae.lelaBest, zae.lelaLauf);
    }

    z.karten[e.kid] = k;
    return fertig();
  }

  // Eine Runde ist bis zur Ernte gespielt. Freies Üben zählt nicht, eine Runde mit weniger als vier
  // beurteilten Aufgaben auch nicht: «Fehlerfrei» soll etwas heissen.
  function rundeFertig(z, bilanz, heute) {
    const aus = { zaehlt: false, perfekt: false };
    if (!istObjekt(z) || !bilanz || bilanz.modus !== 'runde') return aus;
    heuteIn(z, heute).runden++;
    aus.zaehlt = bilanz.geurteilt >= 4;
    aus.perfekt = aus.zaehlt && !(bilanz.falsch > 0);
    if (aus.zaehlt) z.zaehler.runden++;
    if (aus.perfekt) z.zaehler.perfekt++;
    return aus;
  }

  /* ---------- Was ansteht ---------- */

  const last = uebung => (K.SCHWER.includes(uebung) ? 2 : 1);
  const schwachSumme = k => k.schwach.genus + k.schwach.akzent + k.schwach.hoeren;
  // Wie nötig eine Karte Übung hat: frische Fehler, Fehlerquote, niedrige Stufe
  const not = k => (k.zuletzt.match(/f/g) || []).length * 1.2 + (k.falsch / Math.max(1, k.gesehen)) * 2 + Math.max(0, 3 - k.st) * 0.4;
  // Tage als Zahl, über UTC gerechnet: Dort gibt es keine Zeitumstellung
  const tagZahl = t => {
    const [j, m, d] = t.split('-').map(Number);
    return Math.round(Date.UTC(j, m - 1, d) / 864e5);
  };
  const tageSeit = (t, heute) => (DATUM_RE.test(t) ? Math.max(0, tagZahl(heute) - tagZahl(t)) : 0);

  // Die Karten der gewählten Lernziele mit ihrem Stand, in der Reihenfolge des Buchs. e ist der Eintrag
  // im ersten gewählten Lernziel der Karte: «la fille» steht in zwei Unités mit je eigenem Deutsch.
  // Der Stand ist eine Kopie, ihre Daten wie heute (zurueckholen): So zählt auch Lernen.zahlen, das
  // nichts schreibt, eine Karte aus einer vorgegangenen Uhr so, wie die nächste Runde sie plant.
  function aktiveKarten(z, heute) {
    const ziele = (z && istObjekt(z.ziele) && z.ziele) || {};
    const aus = [];
    for (const karte of V.KARTEN) {
      const g = karte.lernziele.find(x => ziele[x] === true);
      if (!g) continue;
      const e = karte.g === g ? karte : V.LERNZIELE[g].eintraege.find(x => x.kid === karte.kid) || karte;
      aus.push({ e, k: zurueckholen(zustand(z, karte.kid), heute) });
    }
    return aus.sort((a, b) => a.e.nr - b.e.nr);
  }

  const istNeu = k => k.st === 0 && !k.gesehen;
  const ruht = (k, heute) => k.st >= 1 && k.faellig > heute;
  const istFaellig = (k, heute) => k.st >= 1 && k.faellig <= heute;

  // Was eine Karte mit einer Schwäche übt, solange sie nicht fällig ist: genau das, was ihr schwerfällt.
  // Zuerst die Nebenaufgaben ihrer Stufe; hat die Leiter dort keine passende, die Übung selbst.
  function schwachAufgaben(e, k, mitTon) {
    const was = n => (n.uebung === 'schreiben' && n.vorgabe === 'ton' ? 'hoeren' : SCHWACH_VON[n.uebung]);
    const aus = nebenaufgaben(e, k, mitTon).filter(n => k.schwach[was(n)] > 0);
    const leit = leitaufgabe(e, k, mitTon);
    for (const [name, uebung] of [['genus', 'artikel'], ['akzent', 'akzent'], ['hoeren', e.art === 'wort' ? 'lauschen' : 'hoeren']]) {
      if (!(k.schwach[name] > 0) || aus.some(n => was(n) === name) || uebung === leit.uebung) continue;
      const o = ort(uebung, e, k.teil, k.form);
      if (kann(uebung, e, o.teil, o.form, mitTon)) aus.push({ uebung, vorgabe: VORGABE[uebung], gewicht: 1 + 3 * k.schwach[name], teil: o.teil, form: o.form });
    }
    return aus;
  }

  // Das nächste Lernziel, das noch nicht gewählt ist: zuerst die Grundblätter ab der Unité, bei der
  // die Klasse gerade ist, dann die Plus-Blätter
  function naechstesZiel(z) {
    const ziele = (z && istObjekt(z.ziele) && z.ziele) || {};
    const basis = V.LERNZIEL_REIHE.filter(g => !V.LERNZIELE[g].plus);
    const ab = Math.max(0, basis.findIndex(g => V.LERNZIELE[g].un === (z && z.unite)));
    return [...basis.slice(ab), ...basis.slice(0, ab), ...V.LERNZIEL_REIHE.filter(g => V.LERNZIELE[g].plus)]
      .find(g => ziele[g] !== true) || null;
  }

  const morgenFaellig = (aktiv, heute) => aktiv.filter(x => ruht(x.k, heute) && x.k.faellig <= tagPlus(heute, 1)).length;

  // Welche Karten die nächste Runde bekommt (3.4, Schritte 1 bis 5): Karten, deren Einführung offen
  // ist, fällige nach Dringlichkeit, dann neue. Hier fällt kein Würfel, darum weiss auch
  // Lernen.zahlen, wie viele neue Wörter warten.
  function rundeWaehlen(z, heute, mitTon) {
    const aktiv = aktiveKarten(z, heute);
    const tagNeu = z && istObjekt(z.tag) && z.tag.datum === heute && z.tag.neu > 0 ? z.tag.neu : 0;
    const neuProTag = z && K.NEU_WAHL.includes(z.neuProTag) ? z.neuProTag : K.NEU_PRO_TAG;

    // Fällige Karten mit ihrer Leitaufgabe, die dringendsten zuerst: Wer wackelt oder lange wartet, kommt vor
    const faellig = aktiv.filter(x => istFaellig(x.k, heute)).map(x => {
      const leit = leitaufgabe(x.e, x.k, mitTon), neben = nebenaufgaben(x.e, x.k, mitTon);
      // nebenDa: Die Karte hat mit Ton eine Nebenaufgabe (zählt für die Plätze der Nebenaufgaben, siehe unten)
      return { ...x, leit, last: last(leit.uebung), neben, nebenDa: (mitTon ? neben : nebenaufgaben(x.e, x.k, true)).length > 0,
        prio: not(x.k) * 3 + 3 + Math.min(30, tageSeit(x.k.faellig, heute)) * K.WARTEN };
    }).sort((a, b) => b.prio - a.prio);
    const angefangen = aktiv.filter(x => x.k.st === 0 && x.k.gesehen > 0).slice(0, K.NEU_PRO_RUNDE);

    // Neue Karten in der Reihenfolge des Buchs, in einem Lernziel die Wörter vor den Sätzen
    const reihe = V.LERNZIEL_REIHE;
    const unbekannt = aktiv.filter(x => istNeu(x.k)).sort((a, b) => reihe.indexOf(a.e.g) - reihe.indexOf(b.e.g)
      || (a.e.art === 'satz') - (b.e.art === 'satz') || a.e.nr - b.e.nr);
    // Niemand beginnt mit einem ganzen Satz, ausser die Auswahl enthält nichts anderes
    const karten = (z && istObjekt(z.karten) && z.karten) || {};
    const gekannt = Object.keys(karten).filter(kid => hat(V.KARTE, kid) && karten[kid] && karten[kid].st >= 1).length;
    const wortOffen = unbekannt.some(x => x.e.art === 'wort');
    const satzZahl = gekannt >= K.SATZ_AB || !wortOffen ? (wortOffen ? K.SATZ_PRO_RUNDE : 2) : 0;
    let saetze = 0;
    const kandidaten = unbekannt.filter(x => x.e.art === 'wort' || saetze++ < satzZahl);
    const jung = aktiv.filter(x => x.k.st === 1 || x.k.st === 2).length;
    const bremse = faellig.length > K.BREMSE_FAELLIG || jung > K.BREMSE_JUNG;
    const frei = bremse ? 0 : Math.max(0, Math.min(K.NEU_PRO_RUNDE - angefangen.length, neuProTag - tagNeu));

    // Karten, die nicht fällig sind, aber eine Schwäche haben, die sich üben lässt
    const schwache = aktiv.filter(x => ruht(x.k, heute) && schwachSumme(x.k) > 0)
      .map(x => ({ ...x, neben: schwachAufgaben(x.e, x.k, mitTon) })).filter(x => x.neben.length);
    // Wie viele Plätze die Nebenaufgaben halten, wird immer mit Ton gezählt: So weiss Lernen.zahlen,
    // ohne die Stimme zu kennen, wie viele neue Wörter die nächste Runde bringt. Ohne Ton bleibt darum
    // selten ein Platz leer (eine ruhende Karte, die nur beim Hören wackelt, übt dann nichts).
    const schwachKid = new Set(mitTon ? schwache.map(x => x.e.kid)
      : aktiv.filter(x => ruht(x.k, heute) && schwachSumme(x.k) > 0 && schwachAufgaben(x.e, x.k, true).length).map(x => x.e.kid));

    // Checks und Leitaufgaben füllen zuerst höchstens RUNDE - NEBEN_MAX Plätze und LAST - NEBEN_MAX an
    // Last: Der Rest bleibt den Nebenaufgaben. n zählt die beurteilten Schritte, w ihre Last.
    const r = { intro: [], leit: [], n: 0, w: 0, warm: null, reserve: 0 };
    const voll = (n, w) => r.n + n > K.RUNDE - K.NEBEN_MAX || r.w + w > K.LAST - K.NEBEN_MAX;
    // Eine Einführung: kennen, dann zwei Checks. Zwei beurteilte, leichte Schritte.
    const einfuehren = (x, neuHeute) => {
      r.intro.push({ ...x, neu: neuHeute });
      r.n += 2;
      r.w += 2;
    };
    const neueDrin = () => r.intro.length - angefangen.length;
    // (a) offene Einführungen, (b) fällige Karten, jede, die noch passt, (c) neue Karten
    for (const x of angefangen) einfuehren(x, false);
    for (const x of faellig) {
      if (voll(1, x.last)) continue;
      r.leit.push(x);
      r.n++;
      r.w += x.last;
    }
    while (neueDrin() < frei && neueDrin() < kandidaten.length && !voll(2, 2)) einfuehren(kandidaten[neueDrin()], true);

    // Aufgewärmt wird, wo keine Stufe-1-Karte mit ihrem Zuhören eröffnet. Dazu dient eine Karte, die
    // ruht und zuletzt gelang; gibt es keine, wird der Kreis weiter gezogen, damit fast jede Runde
    // leicht beginnen kann: jede ruhende Karte, zuletzt eine fällige, die keinen Platz fand.
    // Danach die Plätze der Nebenaufgaben: einen für das Aufwärmen und einen für jede Karte dieser
    // Runde, die eine Nebenaufgabe hergibt, höchstens NEBEN_MAX.
    let basisNeben = 0;
    const nebenPlaetze = () => {
      let warmSchwach = false;
      r.warm = null;
      if (r.leit.length && !r.leit.some(x => x.k.st === 1)) {
        const drin = new Set(r.leit.map(x => x.e.kid));
        const rest = aktiv.filter(x => x.k.st >= 1 && !drin.has(x.e.kid));
        const gut = x => ruht(x.k, heute) && x.k.zuletzt.endsWith('r'), schwach = x => schwachKid.has(x.e.kid);
        const kreise = [x => gut(x) && !schwach(x), gut, x => ruht(x.k, heute) && !schwach(x), x => ruht(x.k, heute), () => true];
        for (let i = 0; i < kreise.length && !r.warm; i++) {
          const liste = rest.filter(kreise[i]);
          if (!liste.length) continue;
          r.warm = liste;
          // Im zweiten und vierten Kreis hätte jede Karte auch eine Nebenaufgabe: Das Aufwärmen nimmt ihr den Platz
          warmSchwach = i === 1 || i === 3;
        }
      }
      r.reserve = Math.min(K.NEBEN_MAX, (r.warm ? 1 : 0) + basisNeben + schwachKid.size - (warmSchwach ? 1 : 0));
    };
    basisNeben = r.leit.filter(x => x.nebenDa).length;
    nebenPlaetze();

    // Plätze, die die Nebenaufgaben nicht brauchen, gehen an (b) zurück, dann an (c) (3.4, Schritt 5).
    // Die Nebenaufgaben sind für die Karten bis hier gezählt; wer jetzt noch dazukommt, bringt keinen
    // Platz für eine eigene mit. Nur das Aufwärmen wird neu bedacht: Eine Karte auf Stufe 1 eröffnet
    // selbst und macht seinen Platz frei. Darum so lange, bis nichts mehr passt.
    const passt = (n, w) => r.n + n + r.reserve <= K.RUNDE && r.w + w + r.reserve <= K.LAST;
    for (let weiter = true; weiter;) {
      weiter = false;
      for (const x of faellig) {
        if (r.leit.includes(x)) continue;
        r.leit.push(x);
        r.n++;
        r.w += x.last;
        nebenPlaetze();
        if (passt(0, 0)) {
          weiter = true;
          continue;
        }
        r.leit.pop();
        r.n--;
        r.w -= x.last;
        nebenPlaetze();
      }
    }
    while (neueDrin() < frei && neueDrin() < kandidaten.length && passt(2, 2)) einfuehren(kandidaten[neueDrin()], true);
    return { aktiv, faellig, schwache, runde: r };
  }

  /* ---------- Reihenfolge ---------- */

  // Bringt die Schritte einer Runde in ihre Reihenfolge, in einem Durchgang von vorn nach hinten:
  // An jeden Platz kommt der liebste Schritt, mit dem sich der Rest noch nach den Regeln legen lässt.
  // dinge: [{ s, e, k, art, vor, auftakt, erst, mitte }]
  //   art      K kennen · A, B die beiden Checks · L Leitaufgabe · N Nebenaufgabe · F Füllaufgabe
  //   vor      der Schritt derselben Karte, der davor kommen muss (harte Regel); steht in dinge weiter vorn
  //   auftakt  darf die erste beurteilte Aufgabe sein; gibt es solche, darf es keine andere sein
  //   erst     soll so weit nach vorn wie möglich (Wunsch)
  //   mitte    die schwerste Wiederholung: gehört ins mittlere Drittel
  // Weiche Regeln, die nicht aufgehen, fallen eine nach der anderen: zuerst das mittlere Drittel für
  // die schwerste Wiederholung, dann das letzte für den zweiten Check, dann schrumpft der Abstand
  // von 3 auf 2, 1, 0. Zurück kommt { reihe, abstand }: der Abstand, der sich halten liess.
  function reihen(dinge) {
    const n = dinge.length;
    dinge.forEach((d, i) => {
      d.i = i;
    });
    const vor = dinge.map(d => (d.vor ? d.vor.i : -1));
    // Wie viele Schritte derselben Karte noch folgen: Lange Ketten müssen früh beginnen
    const kette = dinge.map(() => 0);
    for (let i = n - 1; i >= 0; i--) if (vor[i] >= 0) kette[vor[i]] = Math.max(kette[vor[i]], kette[i] + 1);
    const mitteAb = Math.ceil(n / 3), spaetAb = Math.ceil(n * 2 / 3);
    const mitAuftakt = dinge.some(d => d.auftakt);

    // Darf Schritt i an Platz p? pos sagt, wo die gelegten liegen (-1: noch nicht gelegt).
    const darf = (i, p, pos, geurteilt, regel) => {
      const d = dinge[i];
      if (!geurteilt && mitAuftakt && d.art !== 'K' && !d.auftakt) return false;
      // Regel (ii), solange sie sich halten lässt: kein Schreiben gleich nach einem Schreiben
      if (regel.zwei && d.s.uebung === 'schreiben' && p > 0 && pos.some((q, j) => q === p - 1 && dinge[j].s.uebung === 'schreiben')) return false;
      let ab = 0;
      if (vor[i] >= 0) {
        if (pos[vor[i]] < 0) return false;
        ab = pos[vor[i]] + Math.max(1, regel.abstand);
      }
      if (regel.spaet && d.art === 'B') ab = Math.max(ab, spaetAb);
      if (regel.mitte && d.mitte) {
        if (p >= spaetAb) return false;
        ab = Math.max(ab, mitteAb);
      }
      return p >= ab;
    };
    // Bis zu welchem Platz ein Schritt spätestens liegen muss, damit seine Nachfolger noch Abstand
    // halten können. Füllen die zweiten Checks das letzte Drittel ganz, muss alles andere davor liegen.
    const fristen = regel => {
      const zweite = dinge.filter(d => d.art === 'B').length;
      const frist = dinge.map(d => ((regel.spaet && d.art !== 'B' && zweite >= n - spaetAb) || (regel.mitte && d.mitte) ? spaetAb - 1 : n - 1));
      for (let i = n - 1; i >= 0; i--) if (vor[i] >= 0) frist[vor[i]] = Math.min(frist[vor[i]], frist[i] - Math.max(1, regel.abstand));
      return frist;
    };
    // Lässt sich der Rest ab Platz p0 noch legen? Probe nach fester Regel: Wer am frühesten liegen
    // muss, kommt zuerst, bei Gleichstand die längere Kette. Was nichts nach sich zieht, bleibt so
    // als Lückenfüller für später.
    const geht = (pos0, p0, geurteilt0, regel) => {
      const pos = pos0.slice(), frist = regel.frist;
      let geurteilt = geurteilt0;
      for (let p = p0; p < n; p++) {
        let best = -1;
        for (let i = 0; i < n; i++) {
          if (pos[i] >= 0) continue;
          if (frist[i] < p) return false;
          if (!darf(i, p, pos, geurteilt, regel)) continue;
          if (best < 0 || frist[i] < frist[best] || (frist[i] === frist[best] && kette[i] > kette[best])) best = i;
        }
        if (best < 0) return false;
        pos[best] = p;
        if (dinge[best].art !== 'K') geurteilt = true;
      }
      return true;
    };

    const regeln = [];
    for (let abstand = K.ABSTAND; abstand >= 0; abstand--) {
      for (const [spaet, mitte] of [[true, true], [true, false], [false, true], [false, false]]) regeln.push({ abstand, spaet, mitte });
    }
    for (const x of regeln) x.frist = fristen(x);
    const pos = dinge.map(() => -1);
    const gefunden = regeln.find(x => geht(pos, 0, false, x));
    // Kann nicht sein: Die letzte Regel verlangt nur noch, was die Liste schon erfüllt
    if (!gefunden) return { reihe: dinge, abstand: -1 };
    // Regel (ii) wird vor (iii) bis (vi) aufgegeben: Sie kommt zur gefundenen Regel dazu, wenn es mit
    // ihr noch geht, und kostet sonst nichts von den anderen. Was danach noch nebeneinander steht,
    // trennt schreibenTrennen().
    const streng = { ...gefunden, zwei: true };
    const regel = geht(pos, 0, false, streng) ? streng : gefunden;

    // Wie gern ein Schritt an Platz p steht (klein = lieber). Der Ablauf, der daraus wird: aufwärmen,
    // ein paar Wiederholungen, dann die neuen Wörter einzeln dazwischen, ihr erster Check sobald der
    // Abstand reicht, Nebenaufgaben danach, die zweiten Checks ganz am Schluss.
    const wunsch = (d, p, davor, offen, nochL) => {
      let w = { K: 75, A: 10, L: 30, N: 40, F: 45, B: 50 }[d.art];
      // Ein neues Wort erst, wenn das vorige gefragt wurde, und nicht gleich zu Beginn
      if (d.art === 'K' && !offen && (p >= 3 || !nochL)) w = 20;
      // Eine Leitaufgabe mit Begleiter früh, damit der Begleiter seinen Abstand findet
      if (d.art === 'L' && kette[d.i]) w = 28;
      if (d.erst) w = -100;
      if (davor) {
        // Nie zweimal hintereinander schreiben; auch sonst lieber die Übung und das Gebiet wechseln
        if (d.s.uebung === davor.s.uebung) w += d.s.uebung === 'schreiben' ? 40 : 4;
        if (d.e.cat === davor.e.cat) w += 2;
      }
      return w;
    };

    const aus = [];
    let geurteilt = false;
    for (let p = 0; p < n; p++) {
      const davor = aus[p - 1] || null;
      const offen = dinge.some(d => d.art === 'A' && pos[d.i] < 0 && pos[vor[d.i]] >= 0);
      const nochL = dinge.some(d => d.art === 'L' && pos[d.i] < 0);
      const wahl = dinge.filter(d => pos[d.i] < 0 && darf(d.i, p, pos, geurteilt, regel))
        .map(d => ({ d, w: wunsch(d, p, davor, offen, nochL) })).sort((a, b) => a.w - b.w);
      const x = wahl.find(c => {
        pos[c.d.i] = p;
        if (geht(pos, p + 1, geurteilt || c.d.art !== 'K', regel)) return true;
        pos[c.d.i] = -1;
        return false;
      });
      if (!x) return { reihe: dinge, abstand: -1 };
      aus.push(x.d);
      if (x.d.art !== 'K') geurteilt = true;
    }
    return { reihe: schreibenTrennen(aus, vor), abstand: regel.abstand };
  }

  // Weiche Regel (ii): nie zweimal schreiben hintereinander. reihen() hält sie, wo seine Probe einen
  // Weg findet; die Probe ist aber gierig und findet nicht jeden. Darum wird danach nachgebessert:
  // Ein anderer beurteilter Schritt kommt zwischen zwei Schreiben (Tauschen oder Einschieben), oder
  // eines der beiden rückt an einen anderen Platz. Jeder Zug muss die Zahl der Paare senken und gilt
  // nur, wenn danach jede harte Regel gilt und die weichen Regeln (iii) bis (vi) nicht schlechter
  // dastehen als vorher. Nur (i), gemischte Gebiete, darf leiden, weil sie vor (ii) aufgegeben wird;
  // unter den möglichen Zügen gewinnt der, der die Gebiete am wenigsten zusammenrückt, dann der
  // kürzeste. Fest bleiben kennen, das Aufwärmen und die erste beurteilte Aufgabe; ein erster Check
  // darf rücken, aber an keinem Kennenlernen vorbei, damit die Wörter eins nach dem anderen kommen.
  function schreibenTrennen(reihe, vor) {
    const n = reihe.length, mitteAb = Math.ceil(n / 3), spaetAb = Math.ceil(n * 2 / 3);
    const schreibt = d => d.s.uebung === 'schreiben';
    const paare = (r, gleich) => r.reduce((z, d, p) => z + (p && gleich(r[p - 1], d) ? 1 : 0), 0);
    const neuWoerter = r => r.filter(d => d.art === 'K' || d.art === 'A').map(d => d.i).join();
    const erste = reihe.find(d => d.art !== 'K'), folge = neuWoerter(reihe);
    const fest = d => d.art === 'K' || d.erst || d === erste;
    // Was die Reihe an Regeln hält: harte Regeln (mit dem Platz von kennen, Aufwärmen, erster
    // Aufgabe und der Folge der neuen Wörter), Abstände, spätes Check B, Mitte, Gebiete gemischt
    const mass = r => {
      const pos = [];
      r.forEach((d, p) => {
        pos[d.i] = p;
      });
      let hart = r.every((d, p) => !fest(d) || d === reihe[p]) && neuWoerter(r) === folge, kleinster = K.ABSTAND, eng = 0, frueh = 0, mitte = 0;
      r.forEach((d, p) => {
        if (vor[d.i] >= 0) {
          const ab = p - pos[vor[d.i]];
          if (ab < 1) hart = false;
          // Mehr als ABSTAND verlangt Regel (v) nicht
          kleinster = Math.min(kleinster, ab, K.ABSTAND);
          if (ab < K.ABSTAND) eng++;
        }
        if (d.art === 'B' && p < spaetAb) frueh++;
        if (d.mitte && (p < mitteAb || p >= spaetAb)) mitte++;
      });
      return { hart, kleinster, eng, frueh, mitte, gebiet: paare(r, (a, b) => a.e.cat === b.e.cat), schreiben: paare(r, (a, b) => schreibt(a) && schreibt(b)) };
    };
    let jetzt = reihe, m = mass(reihe);
    while (m.schreiben) {
      let best = null;
      const probe = (neu, weg) => {
        const x = mass(neu);
        if (x.schreiben >= m.schreiben || !x.hart || x.kleinster < m.kleinster || x.eng > m.eng || x.frueh > m.frueh || x.mitte > m.mitte) return;
        if (best && (x.gebiet > best.x.gebiet || (x.gebiet === best.x.gebiet && weg >= best.weg))) return;
        best = { neu, weg, x };
      };
      for (let p = 1; p < n; p++) {
        if (!schreibt(jetzt[p - 1]) || !schreibt(jetzt[p])) continue;
        for (let q = 0; q < n; q++) {
          if (fest(jetzt[q]) || schreibt(jetzt[q])) continue;
          // Tauschen: der Schritt von q an die Stelle eines der beiden Schreiben
          for (const a of [p - 1, p]) {
            const neu = jetzt.slice();
            [neu[a], neu[q]] = [neu[q], neu[a]];
            probe(neu, Math.abs(q - a));
          }
          // Einschieben: der Schritt von q zwischen die beiden, der Rest rückt nach
          const neu = jetzt.slice();
          neu.splice(q, 1);
          neu.splice(q < p ? p - 1 : p, 0, jetzt[q]);
          probe(neu, Math.abs(q - p));
        }
        // Versetzen: eines der beiden Schreiben an einen anderen Platz, der Rest rückt nach
        for (const a of [p - 1, p]) {
          if (fest(jetzt[a])) continue;
          for (let r = 0; r < n; r++) {
            if (r === a) continue;
            const neu = jetzt.slice();
            neu.splice(a, 1);
            neu.splice(r, 0, jetzt[a]);
            probe(neu, Math.abs(r - a));
          }
        }
      }
      if (!best) break;
      jetzt = best.neu;
      m = best.x;
    }
    return jetzt;
  }

  /* ---------- Planer ---------- */

  const schrittVon = (e, uebung, rolle, mehr) => ({ kid: e.kid, nr: e.nr, uebung, vorgabe: VORGABE[uebung], teil: 0, form: 0,
    rolle, check: null, neu: false, ...mehr });
  const ortVon = x => ({ uebung: x.uebung, vorgabe: x.vorgabe, teil: x.teil, form: x.form });

  // Sammelt die Schritte einer Runde, noch ohne Reihenfolge. Jede Karte hängt ihre Schritte als Kette
  // aneinander (vor), damit reihen() die harten Regeln kennt.
  function sammler() {
    const dinge = [];
    const dazu = (art, x, s, vor, mehr) => {
      const d = { art, e: x.e, k: x.k, s, vor: vor || null, ...mehr };
      dinge.push(d);
      return d;
    };
    // kennen, erster Check (bedeutung), zweiter Check (Wörter: finden; Sätze: hoeren, ohne Ton bedeutung)
    const einfuehren = (x, neuHeute, mitTon, mehr) => {
      const k = dazu('K', x, schrittVon(x.e, 'kennen', 'kennen', { neu: neuHeute, ...mehr }));
      const a = dazu('A', x, schrittVon(x.e, 'bedeutung', 'check', { check: 'a', ...mehr }), k);
      const zweiter = x.e.art === 'wort' ? 'finden' : mitTon ? 'hoeren' : 'bedeutung';
      dazu('B', x, schrittVon(x.e, zweiter, 'check', { check: 'b', ...mehr }), a);
    };
    return { dinge, dazu, einfuehren };
  }

  // Legt fest, wer eröffnet, und reiht dann. Die erste beurteilte Aufgabe soll eine Auswahl sein:
  // am liebsten das Aufwärmen, das die Runde mitbringt (erst), sonst der erste Check eines neuen
  // Worts oder eine Auswahl zu einer Karte, die sonst nicht dran ist. In einer Runde (wahlZuerst)
  // geht das dem Abstand vor (3.4, Regel (vi) fällt zuletzt): Legen oder Schreiben gleich zu Beginn
  // ist der schwerste Einstieg, ein Check etwas näher am Kennenlernen der leichtere Preis. Im freien
  // Üben bleibt der Abstand vorn: Dort sind die Checks die einzigen Auswahl-Aufgaben, und einer gleich
  // nach dem Kennenlernen höbe die Karte auf Stufe 1, ohne dass etwas abgerufen wurde; geschrieben
  // wird dort ohnehin von Anfang an. Wo keine Auswahl eröffnen kann, steht die leichteste
  // Leitaufgabe vorn (kleinste Last, dann lieber nicht Legen oder Schreiben, dann niedrigste Stufe).
  // In einer Runde ist das kein Wunsch, sondern geht wie die Auswahl den anderen weichen Regeln vor:
  // Kann ein Satz (ordnen, bauen) eröffnen, eröffnet nie Legen oder Schreiben, auch wenn dafür die
  // schwerste Wiederholung nicht in die Mitte kommt. Legen oder Schreiben eröffnet nur, wo es nichts
  // anderes gibt: lauter fällige Wörter ab Stufe 2, keine Karte, die ruht, kein neues Wort.
  // Eine Auswahl zu einer Karte der Runde vorzuziehen, hiesse, ihr Wort zu zeigen, kurz bevor es
  // gelegt oder geschrieben wird.
  function inReihe(dinge, wahlZuerst) {
    const schreibt = d => d.s.uebung === 'legen' || d.s.uebung === 'schreiben';
    // Ohne Vorgänger in der Runde: Das darf als erste beurteilte Aufgabe kommen
    const vorn = d => d.art !== 'K' && !d.vor;
    let auftakt = dinge.filter(d => K.WAHL.includes(d.s.uebung) && (d.art === 'A' || vorn(d)));
    if (wahlZuerst && !auftakt.length) auftakt = dinge.filter(d => vorn(d) && !schreibt(d));
    const leit = dinge.filter(d => d.art === 'L' && !d.vor);
    if (leit.length && !dinge.some(d => d.erst)) {
      leit.slice().sort((a, b) => last(a.s.uebung) - last(b.s.uebung) || schreibt(a) - schreibt(b) || a.k.st - b.k.st)[0].erst = true;
    }
    for (const d of auftakt) d.auftakt = true;
    const mit = reihen(dinge);
    if (!auftakt.length || mit.abstand === K.ABSTAND || (wahlZuerst && mit.abstand >= 0)) return mit.reihe;
    for (const d of auftakt) d.auftakt = false;
    const ohne = reihen(dinge);
    return mit.abstand >= ohne.abstand ? mit.reihe : ohne.reihe;
  }

  // Die schwersten Gewichte zuerst, bei Gleichstand entscheidet der Zufall
  const nachGewicht = liste => mische(liste).sort((a, b) => b.n.gewicht - a.n.gewicht);

  // Die Nebenaufgaben einer Runde: höchstens eine je Karte und höchstens zwei Artikel-Aufgaben,
  // solange es anderes gibt. restLast ist, was die Runde noch tragen kann.
  function nebenWaehlen(r, schwache, zahl, restLast, warmKid) {
    const kandidaten = [];
    for (const x of r.leit) for (const n of x.neben) kandidaten.push({ x, n, begleiter: true });
    for (const x of schwache) if (x.e.kid !== warmKid) for (const n of x.neben) kandidaten.push({ x, n, begleiter: false });
    nachGewicht(kandidaten);
    const aus = [];
    for (const auchArtikel of [false, true]) {
      for (const c of kandidaten) {
        if (aus.length >= zahl) break;
        if (aus.some(a => a.x.e.kid === c.x.e.kid)) continue;
        if (!auchArtikel && c.n.uebung === 'artikel' && aus.filter(a => a.n.uebung === 'artikel').length >= 2) continue;
        // Für jeden Platz, der noch offen bleibt, muss eine leichte Aufgabe tragbar bleiben
        if (last(c.n.uebung) > restLast - (zahl - aus.length - 1)) continue;
        aus.push(c);
        restLast -= last(c.n.uebung);
      }
    }
    return aus;
  }

  // Pieks rät einmal mit: bei der ersten Auswahl-Aufgabe ab Platz PIEKS_AB, deren Karte Nea schon
  // kennt. Nie bei einem Check: Ein brandneues Wort ist nicht der Moment für einen Spass.
  function pieksSetzen(dinge) {
    const d = dinge.find((x, p) => p >= K.PIEKS_AB && ['leit', 'neben', 'fuell'].includes(x.s.rolle) && x.k.st >= 1
      && ['bedeutung', 'hoeren', 'finden', 'lauschen', 'luecke'].includes(x.s.uebung));
    if (d) d.s.pieks = true;
  }

  function leererPlan(z, heute, aktiv) {
    return { art: 'leer', schritte: [], neu: [], faellig: 0, morgen: morgenFaellig(aktiv, heute),
      // Ein weiteres Lernziel wird erst angeboten, wenn die Auswahl ausgeschöpft ist, nicht bloss das Kontingent
      mehr: aktiv.some(x => istNeu(x.k)) ? null : naechstesZiel(z) };
  }

  // Plant eine Runde oder ein freies Üben. opt = { modus: 'runde' | 'frei', gruppe, mitTon }.
  // Stellt z.tag auf heute um, holt Daten aus der Zukunft zurück (heuteIn) und schreibt sonst nichts.
  // Kehrt für jeden Zustand zurück.
  function planen(z, heute, opt) {
    const o = opt || {}, mitTon = o.mitTon !== false;
    const zz = istObjekt(z) ? z : neu();
    heuteIn(zz, heute);
    return o.modus === 'frei' ? freiPlanen(zz, heute, o.gruppe, mitTon) : rundePlanen(zz, heute, mitTon);
  }

  function rundePlanen(z, heute, mitTon) {
    const wahl = rundeWaehlen(z, heute, mitTon), r = wahl.runde;
    // Ohne Check und ohne Leitaufgabe gibt es keine Runde: Wer fertig ist, bekommt kein Füllwerk
    if (!r.intro.length && !r.leit.length) return leererPlan(z, heute, wahl.aktiv);
    const { dinge, dazu, einfuehren } = sammler();
    let geurteilt = r.n, restLast = K.LAST - r.w;

    // Aufwärmen: das Zuhören einer Stufe-1-Karte, sonst eine Bedeutung zu einer Karte, die sitzt
    const leicht = r.leit.filter(x => x.k.st === 1);
    const erste = leicht.length ? leicht[Math.floor(zufall() * leicht.length)] : null;
    let warm = null;
    if (r.warm) {
      const beste = r.warm.slice().sort((a, b) => b.k.st - a.k.st).slice(0, K.WARM_WAHL);
      warm = beste[Math.floor(zufall() * beste.length)];
      dazu('F', warm, schrittVon(warm.e, 'bedeutung', 'fuell', ort('bedeutung', warm.e, warm.k.teil, warm.k.form)), null, { erst: true });
      geurteilt++;
      restLast--;
    }

    // Leitaufgaben in gemischter Reihenfolge; die Karte mit der höchsten Stufe (ab 2) gehört in die Mitte
    const hoechste = r.leit.filter(x => x !== erste && x.k.st >= 2).sort((a, b) => b.k.st - a.k.st)[0];
    const neben = nebenWaehlen(r, wahl.schwache, r.reserve - (warm ? 1 : 0), restLast, warm ? warm.e.kid : null);
    for (const x of mische(r.leit.slice())) {
      const l = dazu('L', x, schrittVon(x.e, x.leit.uebung, 'leit', ortVon(x.leit)), null,
        x === erste ? { erst: true } : x === hoechste ? { mitte: true } : null);
      const c = neben.find(y => y.x === x);
      if (c) dazu('N', x, schrittVon(x.e, c.n.uebung, 'neben', { ...ortVon(c.n), begleiter: true }), l);
    }
    for (const x of r.intro) einfuehren(x, x.neu, mitTon);
    for (const c of neben) if (!c.begleiter) dazu('N', c.x, schrittVon(c.x.e, c.n.uebung, 'neben', ortVon(c.n)));
    geurteilt += neben.length;
    restLast -= neben.reduce((summe, c) => summe + last(c.n.uebung), 0);

    // Eine kurze Runde wird aufgefüllt: mit den Karten, die es am nötigsten haben und heute nicht dran sind
    if (geurteilt < K.RUNDE_MIN) {
      const drin = new Set(dinge.map(d => d.e.kid));
      const uebrig = wahl.aktiv.filter(x => ruht(x.k, heute) && !drin.has(x.e.kid)).sort((a, b) => not(b.k) - not(a.k));
      // Ohne Wiederholung fehlt der Runde das Aufwärmen: Dann ist die erste Füllaufgabe eine Bedeutung
      let leicht = !r.leit.length;
      for (const x of uebrig) {
        if (geurteilt >= K.RUNDE_MIN || restLast < 1) break;
        const n = (!leicht && nachGewicht(nebenaufgaben(x.e, x.k, mitTon).map(y => ({ n: y }))).map(y => y.n).find(y => last(y.uebung) <= restLast))
          || { uebung: 'bedeutung', vorgabe: 'fr', ...ort('bedeutung', x.e, x.k.teil, x.k.form) };
        leicht = false;
        dazu('F', x, schrittVon(x.e, n.uebung, 'fuell', ortVon(n)));
        geurteilt++;
        restLast -= last(n.uebung);
      }
    }

    const reihe = inReihe(dinge, true);
    pieksSetzen(reihe);
    const schritte = reihe.map(d => d.s);

    // Zum Schluss einmal nachsprechen (die Karte mit der niedrigsten Stufe, bei der es sich lohnt) und das Finale
    const karten = [];
    for (const d of [...reihe.filter(x => x.art === 'K'), ...reihe]) if (!karten.some(x => x.e.kid === d.e.kid)) karten.push(d);
    const echo = karten.slice().sort((a, b) => a.k.st - b.k.st).find(d => kann('echo', d.e, 0, 0, mitTon));
    if (echo) schritte.push(schrittVon(echo.e, 'echo', 'echo'));
    const paare = paareWahl(karten.map(d => d.e));
    if (paare.length >= K.PAARE_MIN) schritte.push({ uebung: 'paare', rolle: 'paare', kids: paare.slice(0, K.PAARE_MAX), wahl: paare });
    return { art: 'runde', schritte, neu: r.intro.map(x => x.e.kid), faellig: r.leit.length, morgen: 0, mehr: null };
  }

  // Wort-Karten, die sich im Finale vertragen: Zwei Kacheln mit demselben Text liessen sich nicht zuordnen
  function paareWahl(eintraege) {
    const aus = [], texte = new Set();
    for (const e of eintraege) {
      if (e.art !== 'wort') continue;
      const eigene = e.teile.flatMap(t => [normV(t.fr[0]), normV(t.zeigeDe)]);
      if (eigene.some(t => texte.has(t))) continue;
      for (const t of eigene) texte.add(t);
      aus.push(e.kid);
    }
    return aus;
  }

  // Freies Üben: FREI beurteilte Aufgaben, die keine Stufe bewegen. Mit gruppe («Für den Test üben»)
  // wird jedes Wort des Lernziels geschrieben und jeder Satz gebaut; ohne («Frei üben») bekommt jede
  // bekannte Karte ihre Leitaufgabe, mindestens die von Stufe 2.
  function freiPlanen(z, heute, gruppe, mitTon) {
    const lz = typeof gruppe === 'string' && hat(V.LERNZIELE, gruppe) ? V.LERNZIELE[gruppe] : null;
    const aktiv = aktiveKarten(z, heute), schon = new Set();
    // Mit Lernziel dessen Karten, ob gewählt oder nicht; sonst alle gewählten
    const karten = lz ? lz.eintraege.filter(e => !schon.has(e.kid) && schon.add(e.kid)).map(e => ({ e, k: zustand(z, e.kid) })) : aktiv;
    const frei = { frei: true };
    const { dinge, dazu, einfuehren } = sammler();
    // Unbekannte Karten des Lernziels werden richtig eingeführt, damit nichts halb gelernt zurückbleibt.
    // Das Tageskontingent bleibt unberührt.
    const neue = lz ? karten.filter(x => x.k.st === 0).slice(0, K.NEU_PRO_RUNDE) : [];
    for (const x of neue) einfuehren(x, false, mitTon, frei);
    let platz = K.FREI - neue.length * 2;

    // Wer heute noch nicht dran war, kommt zuerst, dann die Wackligsten: So gehen mehrere Runden
    // durch das ganze Lernziel, statt immer dieselben Karten zu bringen
    const geuebt = new Set(z.tag.frei);
    const dran = karten.filter(x => x.k.st >= 1).sort((a, b) => geuebt.has(a.e.kid) - geuebt.has(b.e.kid) || not(b.k) - not(a.k))
      .slice(0, Math.max(0, platz));
    platz -= dran.length;
    for (const x of dran) {
      const s = { davor: null, haupt: null, danach: null };
      // Im freien Üben dreht keine Karte weiter. Darum entscheidet hier der Zufall, welche Hälfte eines
      // Paars und welche Schreibweise dran ist: Vor dem Test kommen so beide an die Reihe.
      const teil = Math.floor(zufall() * x.e.teile.length), form = Math.floor(zufall() * x.e.teile[teil].fr.length);
      if (lz) {
        // Der Test verlangt freies Schreiben, also wird geschrieben; wer das Wort noch nie schrieb, legt es vorher
        const o = schreibOrt(x.e, teil, form);
        if (x.e.art === 'satz') s.haupt = { uebung: 'bauen', vorgabe: 'de', ...ort('bauen', x.e, teil, form) };
        else if (kann('schreiben', x.e, o.teil, o.form)) {
          s.haupt = { uebung: 'schreiben', vorgabe: 'de', ...o };
          if (x.k.st < 3) s.davor = { uebung: 'legen', vorgabe: 'de', ...o };
        } else s.haupt = { uebung: 'legen', vorgabe: 'de', ...ort('legen', x.e, teil, form) };
      } else {
        // Wer erst zugehört hat, legt hier schon: Frei üben darf fordern, es kann nichts schiefgehen
        const k = { ...x.k, teil, form, st: Math.max(x.k.st, 2) };
        s.haupt = leitaufgabe(x.e, k, mitTon);
        s.danach = nachGewicht(nebenaufgaben(x.e, k, mitTon).map(n => ({ n })))[0] || null;
        if (s.danach) s.danach = s.danach.n;
      }
      x.schritte = s;
    }
    // Was an Platz bleibt, geht an das Legen vor dem Schreiben oder an eine Nebenaufgabe
    for (const x of dran) {
      const s = x.schritte;
      if (platz > 0 && (s.davor || s.danach)) platz--;
      else s.davor = s.danach = null;
    }
    for (const x of mische(dran.slice())) {
      const s = x.schritte;
      const fuell = (n, mehr) => schrittVon(x.e, n.uebung, 'fuell', { ...ortVon(n), ...frei, ...mehr });
      const vorher = s.davor ? dazu('L', x, fuell(s.davor)) : null;
      const haupt = dazu(vorher ? 'N' : 'L', x, fuell(s.haupt), vorher);
      if (s.danach) dazu('N', x, fuell(s.danach, { begleiter: true }), haupt);
    }
    if (!dinge.length) return leererPlan(z, heute, aktiv);

    const reihe = inReihe(dinge, false);
    pieksSetzen(reihe);
    return { art: 'frei', schritte: reihe.map(d => d.s), neu: neue.map(x => x.e.kid), faellig: 0, morgen: 0, mehr: null };
  }

  // Derselbe Schritt noch einmal, nach einem Fehler: bewegt nichts mehr und zahlt einen Apfel
  function wiederholung(schritt) {
    const s = { ...schritt, rolle: 'wdh', check: null, neu: false };
    delete s.pieks;
    return s;
  }

  // Derselbe Schritt für eine Runde ohne Ton: Zuhören wird Lesen, Diktat wird Schreiben nach dem
  // Deutschen. null, wo der Schritt entfällt: beim Nachsprechen und bei einem Diktat, dessen Karte
  // in derselben Runde ohnehin geschrieben wird.
  function ohneTon(schritt, z) {
    if (!schritt || schritt.uebung === 'echo') return null;
    const s = { ...schritt };
    if (s.uebung === 'paare') return s;
    const e = eintragVon(s);
    if (!e) return null;
    if (s.uebung === 'hoeren') {
      // Hatte ein Wort heute schon seinen ersten Check, wäre bedeutung dieselbe Frage noch einmal
      const k = zustand(z, e.kid), heute = z && istObjekt(z.tag) ? z.tag.datum : '';
      s.uebung = e.art === 'wort' && k.st <= 1 && !!heute && k.auf === heute ? 'finden' : 'bedeutung';
    } else if (s.uebung === 'lauschen') s.uebung = 'finden';
    else if (s.vorgabe === 'ton') {
      if (s.uebung === 'schreiben' && s.begleiter) return null;
      s.vorgabe = 'de';
      return s;
    } else return s;
    s.vorgabe = VORGABE[s.uebung];
    return Object.assign(s, ort(s.uebung, e, s.teil, s.form));
  }

  /* ---------- Zahlen für Lichtung, Album und Eltern ---------- */

  // Zählt, ohne etwas zu schreiben. Über die 210 Einträge: gekannt, frucht, reif, stufen, proUnite.
  // Über die gewählten Lernziele: aktiv und aktivFrucht (Einträge), faellig, morgen, neuFrei, jung (Karten).
  function zahlen(z, heute) {
    const stufe = e => grenze(Math.floor(zustand(z, e.kid).st) || 0, 0, 5);
    const ziele = (z && istObjekt(z.ziele) && z.ziele) || {};
    const stufen = [0, 0, 0, 0, 0, 0], proUnite = {};
    for (const un of V.UNITE_REIHE) proUnite[un] = { alle: 0, gekannt: 0, frucht: 0, reif: 0, basis: 0, basisFrucht: 0 };
    let aktivZahl = 0, aktivFrucht = 0;
    for (const e of V.VOKABELN) {
      const st = stufe(e), u = proUnite[e.un];
      stufen[st]++;
      u.alle++;
      if (st >= 1) u.gekannt++;
      if (st >= 3) u.frucht++;
      if (st === 5) u.reif++;
      if (!e.plus) {
        u.basis++;
        if (st >= 3) u.basisFrucht++;
      }
      if (ziele[e.g] === true) {
        aktivZahl++;
        if (st >= 3) aktivFrucht++;
      }
    }
    // Wie viele Karten die nächste Runde einführt, hängt nicht davon ab, ob die Stimme an ist
    const wahl = rundeWaehlen(z, heute, true);
    // Die acht Karten mit den meisten Fehlern, je mit dem, was ihnen am schwersten fällt
    const karten = (z && istObjekt(z.karten) && z.karten) || {};
    const schwer = V.KARTEN.filter(e => hat(karten, e.kid) && zustand(z, e.kid).falsch > 0).map(e => {
      const k = zustand(z, e.kid);
      const art = Object.keys(k.schwach).sort((a, b) => k.schwach[b] - k.schwach[a])[0];
      return { kid: e.kid, falsch: k.falsch, art: k.schwach[art] > 0 ? art : null };
    }).sort((a, b) => b.falsch - a.falsch).slice(0, 8);
    return {
      gekannt: V.VOKABELN.length - stufen[0], frucht: stufen[3] + stufen[4] + stufen[5], reif: stufen[5], stufen,
      aktiv: aktivZahl, aktivFrucht,
      faellig: wahl.faellig.length, morgen: morgenFaellig(wahl.aktiv, heute), neuFrei: wahl.runde.intro.length,
      jung: wahl.aktiv.filter(x => x.k.st === 1 || x.k.st === 2).length,
      proUnite, schwer,
    };
  }

  const L = {
    K, zufall: Math.random,
    neu, pruefen, zustand, tag, tagPlus,
    norm, falte, kern, abstand, zerlegen,
    kann, leitaufgabe, nebenaufgaben,
    planen, wiederholung, ohneTon,
    aufgabe, ablenker, buchstaben, wortkacheln, akzentLuecken, kontrast,
    urteil, reihenUrteil, aepfel,
    verbuchen, rundeFertig, zahlen,
  };
  return L;
})();

if (typeof module !== 'undefined') module.exports = { Lernen };
