'use strict';

/* =====================================================================
   INDONESISCH-TEXTE
   Alles, was der Otter sagt (OTEXTE, seine Stimme), und was Pieks im
   Indonesisch dazu sagt (PTEXTE, seine Stimme), dazu MERKHILFEN,
   WORTMOMENTE und LEBHAFT. Vertont wird wie in texte.js mit
   make-audio.mjs; welche Aufnahmen es braucht, zählt alleIndoClips()
   am Ende dieser Datei auf. Die Erfolge des Kurses (indo_…) stehen bei
   allen anderen in ERFOLGE in texte.js, denn Pieks liest ihre Namen;
   hier gibt es sie nur zum Nachschlagen. pruefen() hält die Regeln
   unten fest: Nach jeder Änderung muss INDO_TEXTE.pruefen() eine leere
   Liste geben.

   Ein einziges Global, INDO_TEXTE = { OTEXTE, PTEXTE, MERKHILFEN,
   WORTMOMENTE, LEBHAFT, ERFOLGE, alleIndoClips, pruefen }. PTEXTE,
   MERKHILFEN und WORTMOMENTE (franz-texte.js) und LEBHAFT (texte.js)
   gibt es im Browser schon als Globale, und alle Skripte teilen sich
   dort einen Bereich: Ein zweites const gleichen Namens bräche die ganze
   Datei ab. Darum steht alles in einer Klammer.

   Die Datei läuft im Browser, in Node (require) und im Service Worker
   (importScripts), jedes Mal nach texte.js, vokabeln.js und
   indo-vokabeln.js. Fehlt VOK_INDO, bricht sie beim Laden ab, statt
   still ohne Vokabeln weiterzumachen.

   Ein Eintrag ist ein Text oder { t: 'angezeigt', s: 'gesprochen' }.
   Für seine Zeilen gilt (wie bei Pirouette):

   - Eine Aufnahme, eine Sprache. Indonesische Stellen stehen in {…} und
     werden einzeln aufgenommen: '{Pintar!} Das war genau richtig.'
     In den Klammern stehen nur diese Ausrufe (geschlossene Liste):
       Halo, Wah, Aduh, Maaf, Bagus, Bagus sekali, Hebat, Pintar,
       Keren, Betul, Sempurna, Hore, Asyik, Ayo, Terima kasih,
       Tidak apa-apa, Sampai besok, Sampai jumpa,
     dazu «Nea», Kommas und das Satzzeichen am Schluss. «Pieks» steht
     nie in den Klammern: Indonesisch liest ie als zwei Vokale
     («Pi-eks»). Im deutschen Teil ist sein Name gut aufgehoben.
     Geschrieben wie im Indonesischen: ohne Leerzeichen vor ! und ?,
     gross nur am Anfang und bei Namen.
     Im deutschen Teil kommt keines dieser Wörter vor, auch kein
     «Hallo» (zu nah an Halo) und kein deutsches Wort, das indonesisch
     aussieht («Hai»). Nicht in der Liste: Selamat pagi, siang, sore und
     malam. Keine Liste weiss, welche Tageszeit gerade ist.
   - Vokabeln stehen nie in einer Zeile: Sie kommen als eigene
     Aufnahme dazu. Eine Zeile, die auf einen Doppelpunkt endet, ist
     ein Vorspann und wird nur zusammen mit ihrer Vokabel gesprochen.
     Dass ein Ausruf zugleich eine Vokabel ist (halo, maaf, ayo, terima
     kasih …), ist gewollt, wie bei ihr «Voilà»: Er ist eine eigene
     Aufnahme seiner indonesischen Stimme. Darum steht keine Klammer in
     einer Liste, die mitten in einer Aufgabe vor der Antwort kommt
     (Tipps, o_warten, o_wieder, o_kennen, o_sag, o_erklaer_*, o_paare).
     Die Eröffnung (o_start_*, {Ayo!}) läuft schon neben der ersten
     Aufgabe; die ist meist ein Aufwärmen, das das indonesische Wort
     selbst zeigt (lernen.js rundePlanen).
   - Sein Name steht nur als {O} da (OTTER in texte.js), nur im
     deutschen Teil und nur in o_vorstellen, o_vorstellen_kurz,
     o_name_witz und pi_besuch. texte.js setzt ihn vor dem Aufteilen ein
     (namenEinsetzen in segmente und anzeigetext), sonst würde «{O}» zu
     einem indonesischen Stück. Pirouettes Name kommt hier nicht vor:
     Pieks sagt «meine Freundin», Percik «meine Freundin».
   - Ehrlich bleiben: Jede Zeile einer Liste muss in jeder Lage stimmen,
     in der die Liste kommt. Also keine Zahl, kein «dieses Wort» bei
     Listen, die auch für Sätze gelten, und keine Stufe, die nicht
     sicher erreicht ist. Er hört Nea nicht und tut auch nicht so. Was
     in der Blase steht, stimmt auch, solange es seine Aufnahmen nicht
     gibt (die Stimme ist gewählt, vertont ist noch nichts).
   - Er schimpft nie, sagt nie «falsch» und auch nie «daneben» (das
     sagt nur Pieks über sich selbst). «Fast!» sagt er nur in
     o_tipp_zeichen, o_tipp_doppelwort und o_tipp_buchstabe, wo das
     Urteil beweist, dass es knapp war.
   - Keine Ziffern, höchstens zwei kurze Sätze (ausser im ersten
     Treffen, wie bei ihr), Schweizer Schreibweise: ss statt ß.
   - Seine Bilder sind seine: Wasser, Bach, Spritzer, Schütteln,
     Tauchen, Bauchrutscher, Kiesel, Fische, Krabben, das Reisfeld.
     Kein Heft, kein Schwanz, keine Äste, keine Erdbeeren: Die gehören
     Pirouette. Kein Netz: Netze sind für Otter gefährlich. Wo Nea beide
     an derselben Stelle hört (Lichtung, Garderobe, Anfang und Ende der
     Runde, leere Karte), auch nicht ihre Satzmuster.

   Pieks spricht nur Deutsch: in PTEXTE keine Klammern und kein
   indonesisches Wort (seine deutsche Stimme läse c als k).

   Die Stufen einer Karte (Reis statt Erdbeeren):
     0 Reiskorn (noch nicht kennengelernt) · 1 Keimling · 2 Pflänzchen ·
     3 grüne Rispe · 4 gelbe Rispe · 5 goldener Reis (reif)
   «Mit Rispe» heisst Stufe 3 und mehr. Das Beet heisst «Reisfeld von
   Nea» (es gehört ihr, darum sagt er «dein Reisfeld»), in seinen Korb
   kommt nur reifer Reis, keine Runden. Sein eigenes Reisfeld liegt auf
   Java an einem Fluss. «Ernte» heisst auch die Karte am Ende der Runde
   (franz.js frNr): Mitten in der Runde sagt er das Wort darum nicht.

   Was es im Indonesisch nicht gibt (diese Listen fallen weg, siehe
   OHNE_GEGENSTUECK bei der Prüfung):
   - h_unite_frage, h_unite_u1 … h_unite_u4: Es gibt keine Frage nach
     der Schule, der Kurs beginnt mit Pelajaran 1.
   - h_kontrast, h_tipp_artikel_fehlt, h_tipp_genus, h_tipp_elision,
     h_tipp_artikel_ganz: Indonesisch hat keine Artikel und kein
     Geschlecht.
   - h_erklaer_artikel, h_erklaer_akzent: Diese Übungen laufen nie.
   - h_tipp_akzent, h_tipp_akzent_zeichen, h_tipp_ligatur: Es gibt
     keine Akzente und kein œ. Die Tastatur hat keine, tippbar lässt é
     von der echten Tastatur nicht durch, und die Kacheln bekommen im
     Indonesisch keine Akzent-Ablenker (lernen.js, eigene Verwechsler).
     Bleibt der Weg dorthin im gemeinsamen Code (franz.js: TIPP.akzent,
     und HTEXTE.h_tipp_akzent[0] direkt in tippZeilen), darf er für den
     Otter nicht in eine Liste führen, die es nicht gibt. Mit
     akzentUrteil: false im Sprachprofil kommt das Urteil dort nie an.
   - «Für den Test üben» und «Plus» hatten keine eigene Liste; es gibt
     sie im Indonesisch nicht.

   Neu, nur beim Otter: o_tipp_doppelwort (siehe dort).

   Die Anzahl Zeilen je Liste ist wie bei ihr festgelegt, bis auf die
   neue Liste (LISTEN bei der Prüfung). Wo eine Zeile über ihre Nummer
   gelesen wird, steht es über der Liste.
   ===================================================================== */

const INDO_TEXTE = (() => {
  // In Node kommen die Nachbardateien über require herein, im Browser und im Service Worker sind es
  // Globale: aus texte.js die Helfer, die Namen und die Erfolge, aus indo-vokabeln.js die Wörter
  const N_I = typeof module !== 'undefined' && typeof require === 'function';
  const T_I = N_I ? require('./texte.js')
    : { sprechtext, segmente, clipDatei, stimmeVon, OTTER, HOERNCHEN, LEHRER, ERFOLGE };
  const V_I = N_I ? require('./indo-vokabeln.js') : VOK_INDO;

  const OTEXTE = {
    /* ---------- Erstes Treffen (feste Reihenfolge) ----------
       Erst wenn Pirouette schon vorgestellt ist und nie beim selben Aufwecken.
       Er rutscht auf dem Bauch von links herein, bleibt links von Pieks stehen und
       schüttelt sich trocken. Die Tropfen treffen Pieks: pi_besuch[0]. Dann
       o_vorstellen[0], pi_besuch[1], o_name_witz, o_vorstellen[1], und seine Karte
       springt herein. Nach o_name_witz schüttelt er sich noch einmal: erst nach der
       Zeile (bei ihr beginnt die Drehung mit dem Satz), sonst käme «Achtung» erst nach
       den Tropfen. Pieks bekommt dazu 'oops' wie beim Apfel. Wasser gibt es auf der
       Lichtung keines: Er kommt gerade aus dem Bach hinter dem Wald. */
    o_vorstellen: [
      '{Aduh, maaf!} Das wollte ich nicht, Pieks. Ich war gerade im Bach hinter dem Wald. {Halo, Nea!} Ich bin {O} und komme aus Indonesien.',
      'Ich bringe dir Indonesisch bei! Jedes Wort ist ein Reiskorn, das in deinem Reisfeld wächst. Machst du mit? Dann tippe auf meine Karte!',
    ],
    // Wenn Nea das erste Treffen weggetippt hat: beim ersten Start seines Kurses, ohne Spritzer.
    // Danach kommt o_start_neu («Ich bringe dir neue Wörter mit»): also hier nicht «Ich bringe dir …».
    o_vorstellen_kurz: ['{Halo, Nea!} Ich bin {O} aus Indonesien, ein Freund von Pieks. Mit mir lernst du Indonesisch.'],
    // Die einzige Zeile, die am Namen hängt (Percik heisst Spritzer): bei einem anderen Namen leeren
    // oder neu schreiben. Danach schüttelt er sich noch einmal, darum die Warnung an Pieks.
    o_name_witz: ['{O}, das heisst Spritzer. Achtung, Pieks!'],

    /* ---------- Lichtung ---------- */
    // Nach Pieks' Begrüssung, wenn nichts fällig ist: also nichts versprechen, was dann nicht da ist,
    // auch kein Geschenk. Keine Tageszeit: Die Zeile kommt morgens wie abends. Pirouette steht
    // daneben (und fehlt, wenn ihr Kurs nicht geladen ist): also nicht «Pieks hat die Zahlen, ich
    // habe die Wörter», und keine Aufzählung der Kurse.
    o_gruss: [
      '{Halo, Nea!} Ich habe extra meine Schnurrhaare gekämmt.',
      '{Halo, Nea!} Ich bin schon beinahe trocken.',
      '{Halo, Nea!} Pieks will nie mit mir baden. Dabei ist das Wasser herrlich!',
      '{Halo, Nea!} Ich komme direkt vom Bach, noch ganz tropfnass.',
      'Da bist du ja! Vor Freude muss ich gleich quietschen.',
      '{Halo!} Ich habe im Bach schon ein paar Purzelbäume geschlagen.',
      'Heute glänzt mein Kiesel besonders schön. {Halo, Nea!}',
      '{Halo, Nea!} Den Rhein heraufschwimmen war anstrengend. Für dich hat es sich gelohnt!',
    ],
    // Wenn Wörter fällig sind (also Karten ab Stufe eins: Halme gibt es dann schon)
    o_gruss_faellig: [
      '{Halo, Nea!} In meinem Bach blubbert es schon: Da wollen Wörter zu dir.',
      '{Halo, Nea!} In deinem Reisfeld recken sich schon die Halme nach dir.',
      'Genau zur rechten Zeit! Da strecken schon Wörter die Köpfe aus dem Wasser.',
      '{Halo, Nea!} Ich habe schon die Ärmel hochgekrempelt. Ach nein, ich habe ja nur Fell!',
      '{Halo, Nea!} Dein Reisfeld braucht heute ein bisschen Pflege.',
    ],
    // Zurück vom Indonesisch, auch mitten aus einer Runde, von der leeren Karte oder gleich nach
    // einer zähen Runde: also kein «Das war eine schöne Runde». app.js zeigt zuerst die Lichtung, dann
    // spricht er dort, sichtbar links von Pieks, und bleibt da: also kein «ich gehe», kein «ich springe
    // jetzt in den Bach» und kein «ich stelle mich zu Pieks».
    o_lichtung: [
      '{Terima kasih, Nea!} Bis gleich, ich bleibe in der Nähe.',
      '{Sampai jumpa!} Wenn du mich suchst: Ich bin der Nasse neben Pieks.',
      'Mein Fell wird schon trocken. Nachher springe ich noch kurz in den Bach!',
      'Komm bald wieder ins Wasser! {Sampai jumpa, Nea!}',
      'Pieks und ich halten hier die Stellung. Keine Sorge, ich tropfe ihn nicht voll!',
    ],
    // Er wird angetippt, auf der Lichtung und in der Garderobe: also nichts, was nur an einem Ort stimmt.
    // Gezogen wird zufällig; nach fünf schnellen Tipps schüttelt er sich («schuettelt», bei ihr «dreht»),
    // das kündigt [5] an. Unter reduce zeigt otter.css dafür ein Standbild mit Tropfen (ot-ruhe-tropfen):
    // Der Kurs darf «schuettelt» darum nicht wie heute «dreht» auslassen (franz.js bewegung), sonst
    // verspricht [5] etwas, das nicht kommt. Kommt dort eine andere Bewegung, Zeile [5] anpassen.
    o_kitzeln: [
      'Nicht am Bauch, da bin ich am kitzligsten!',
      '{Wah!} Das kitzelt wie tausend kleine Fische!',
      'Hoppla, um ein Haar wäre mir mein Kiesel davongerollt!',
      'Ich muss so lachen, dass mir das Fell tropft!',
      'Vorsicht, ich bin noch ganz nass!',
      'Wenn du so weitermachst, muss ich mich schütteln!',
      'Meine Schnurrhaare! Damit spüre ich unter Wasser, wenn sich etwas bewegt.',
      'Kitzeln ist beinahe so schön wie Schwimmen!',
    ],
    // Vorspann zum Wort des Tages (nur Wörter, die schon wachsen, nie Sätze)
    o_wort_vor: [
      'Dieses Wort fische ich heute für dich heraus:',
      'Heute plätschert mir dieses Wort durch den Kopf:',
      'Das sage ich heute den ganzen Tag vor mich hin:',
    ],

    /* ---------- Kein Lernziel gewählt ---------- */
    // Das Album geht auf, er spricht ohne Blase (nur mit seiner Stimme zu hören)
    o_keine_auswahl: [
      'Such dir zuerst ein Lernziel aus. Dann springen wir hinein!',
      'Welche Wörter wollen wir üben? Wähle ein Lernziel.',
    ],

    /* ---------- Eine Runde beginnt (Zahlen nennt er nie) ---------- */
    // Nur neue Wörter. Ein neues Wort ist ein Reiskorn (Stufe null): Das Säen stimmt genau.
    o_start_neu: [
      'Ich habe frische Wörter aus dem Bach gefischt. {Ayo!}',
      'Heute springen wir kopfüber in neue Wörter. Kommst du mit?',
      'Heute säen wir neue Reiskörner in dein Reisfeld.',
      'Ich bin so aufgeregt, dass ich doppelt tropfe. Es gibt neue Wörter!',
      'Frisch aus dem Wasser: neue Wörter für dich!',
    ],
    // Nur Wiederholungen: nichts Neues versprechen
    o_start_wdh: [
      'Mal sehen, was schon Wurzeln hat. {Ayo!}',
      'Ein paar vertraute Flossen schwimmen vorbei. Erkennst du sie wieder?',
      'Wörter brauchen Wiederholung wie der Reis das Wasser. Los geht’s!',
      'Heute tauchen wir nach Wörtern, die du schon kennst.',
      'Wir schauen nach deinem Reisfeld. {Ayo, Nea!}',
    ],
    // Über die Reihenfolge sagt er nichts: Altes und Neues kommen gemischt
    o_start_gemischt: [
      'Ein ganzer Schwarm kommt angeschwommen, mit Bekannten und Neulingen. {Ayo!}',
      'Heute tauchen alte und neue Wörter auf. Los geht’s!',
      'Bekannte und neue Wörter, durcheinander wie Kiesel im Bach.',
      'Pflegen und säen: Heute bekommt dein Reisfeld beides.',
      'Frischer Fang und alte Freunde: Heute ist alles dabei!',
    ],
    // Frei üben: Keine Karte steigt oder fällt (lernen.js freiPlanen), also auch nichts, was wächst
    o_start_frei: [
      'Heute ist Badetag! Wir tauchen nur zum Spass.',
      'Wir plantschen einfach ein bisschen herum. Dein Reisfeld schaut nur zu.',
      'Das ist nur Training. Dein Reisfeld bleibt, wie es ist.',
    ],

    /* ---------- Kennenlernen und Nachsprechen ---------- */
    // Vorspann vor einem Wort (nie vor einem Satz); auch wenn es nach einem verpassten Check noch
    // einmal gezeigt wird, also nie «neu»
    o_kennen: [
      'Schau mal, was ich hier habe:',
      'Schau ganz genau hin:',
      'Das habe ich für dich aus dem Bach gefischt:',
      'Ohren auf, Schnurrhaare auf:',
      'Das glänzt wie ein Kiesel im Bach:',
      'Das bringe ich dir heute bei:',
    ],
    // Vorspann vor einem Satz. Nichts über die Länge («Saya tidak tahu.» ist kurz) und nicht «auf Java
    // gehört»: «Nama saya Nea.» hat er dort bestimmt nie gehört.
    o_kennen_satz: [
      'Jetzt kommt ein ganzer Satz. Hör gut zu:',
      'Jetzt fädeln wir Wörter zu einem Satz auf:',
      'So sagt man das auf Indonesisch:',
      'Ein Satz für dein Reisfeld:',
    ],
    // Nachsprechen: Vorspann, dann das Wort oder der Satz, dann o_jetzt_du. Er sagt es zuerst allein,
    // Nea danach: also nicht «zusammen».
    o_sag: [
      'Pass gut auf, wie ich es sage:',
      'Ich sage es dir vor:',
      'Hör zu und sprich mir nach:',
      'Ich zuerst, dann du:',
    ],
    // Nach o_sag und nach «Ich sag’s!» beim Kennenlernen
    o_jetzt_du: [
      'Jetzt du!',
      'Und jetzt du, so laut wie ein Wasserfall!',
      'Du bist dran. Spring ins kalte Wasser!',
    ],
    // Nach «Gesagt!»: Er hat Nea nicht gehört, also lobt er das Sagen und nicht den Klang
    o_gesagt: [
      '{Bagus!} Was der Mund sagt, merkt sich der Kopf.',
      '{Terima kasih!} Jetzt sitzt es schon ein bisschen fester.',
      'Laut sagen ist wie Schwimmen: Mit jedem Mal geht es leichter.',
      'Jetzt hat es auch deine Zunge gelernt. {Bagus sekali!}',
    ],

    /* ---------- Erklärung, wenn eine Übung zum ersten Mal kommt ----------
       Eine Zeile je Übung ausser kennen (artikel und akzent gibt es nicht).
       Sie beschreiben die Oberfläche: der runde Hör-Knopf, die Kacheln,
       «Gesagt!», der Bindestrich unten neben dem m (Tastatur
       q w e r t z u i o p / a s d f g h j k l back / y x c v b n m - leer ok),
       links Indonesisch und rechts Deutsch bei den Paaren. Ändert sich dort
       etwas, ändern sich diese Zeilen mit. */
    o_erklaer_bedeutung: ['Was bedeutet das auf Deutsch? Tippe die passende Antwort an.'],
    o_erklaer_hoeren: ['Hör gut zu und tippe an, was es bedeutet. Der runde Knopf spielt es nochmal.'],
    o_erklaer_finden: ['Hier steht es auf Deutsch. Tippe an, wie es auf Indonesisch heisst.'],
    o_erklaer_lauschen: ['Hör genau hin und tippe an, wie man das schreibt.'],
    o_erklaer_legen: ['Tippe die Buchstaben in der richtigen Reihenfolge an.'],
    o_erklaer_schreiben: ['Jetzt schreibst du selbst. Den Bindestrich findest du unten, gleich neben dem m.'],
    o_erklaer_luecke: ['Im Satz fehlt ein Wort. Tippe an, welches in die Lücke gehört.'],
    o_erklaer_ordnen: ['Bring die Wörter in die richtige Reihenfolge. Tippe sie nacheinander an.'],
    o_erklaer_bauen: ['Bau den Satz aus den Kacheln. Achtung: Ein paar Wörter gehören nicht dazu.'],
    o_erklaer_echo: [
      { t: 'Ich sage es vor, und du sprichst es laut nach. Danach tippst du auf «Gesagt!».',
        s: 'Ich sage es vor, und du sprichst es laut nach. Danach tippst du auf Gesagt.' },
    ],
    o_erklaer_paare: ['Links Indonesisch, rechts Deutsch. Tippe immer zwei an, die zusammengehören.'],

    /* ---------- Richtig ---------- */
    // Kurzes Lob vor dem Wort, nach jeder Art Aufgabe und nur beim ersten Versuch (nach einem Fehler
    // kommt o_richtig_nachfehler): nichts über Schreiben, Hören, den Bindestrich oder «dieses Wort».
    // Auch nichts, was nach «war ja leicht» klingt («Glasklar!») oder nach Internet («im Netz»).
    o_richtig: [
      '{Bagus!}',
      'Genau so!',
      '{Hebat!}',
      'Richtig!',
      '{Bagus sekali!}',
      'Volltreffer!',
      'Blitzsauber!',
      '{Sempurna!}',
      'Gleich beim ersten Sprung richtig!',
      'Geknackt wie eine Krabbe!',
      '{Hebat, Nea!}',
      'Wie ein Fisch im Wasser!',
      'Ja, so ist es!',
      'Platsch, mitten ins Ziel!',
      '{Betul!}',
      'Dafür mache ich einen Bauchrutscher!',
      'Ganz genau, Nea!',
      'Otterstark!',
      '{Keren, Nea!}',
      'Da schlage ich vor Freude einen Purzelbaum!',
      'Gut gefischt!',
      '{Pintar!} Das sitzt wie angegossen.',
      'Das hältst du so fest wie ich meinen Kiesel!',
      'Da hüpft mein Herz wie ein Fisch!',
    ],
    // Richtig bei der Wiederholung oder im zweiten Versuch: Jede Zeile stimmt für beides
    o_richtig_nachfehler: [
      '{Hore!} Jetzt ist es gefangen!',
      'Siehst du? Diesmal hat es geklappt.',
      'Jetzt hast du es am Haken!',
      'Neuer Anlauf, sauber eingetaucht!',
      'Nicht aufgegeben, und jetzt passt es. {Bagus sekali!}',
      'Dranbleiben lohnt sich. {Hebat!}',
    ],
    // Beim ersten Versuch selbst geschrieben. Nichts über den Bindestrich: Das Wort hat vielleicht keinen
    o_richtig_schreiben: [
      'Kein Buchstabe ist verrutscht!',
      'Ganz allein getippt. {Bagus sekali!}',
      'Fehlerfrei geschrieben! Da zittern mir vor Freude die Schnurrhaare.',
      'Aus dem Kopf direkt auf die Karte. {Hebat!}',
      'Mit meinen kleinen Krallen hätte ich das nicht besser geschrieben!',
      'Ohne Hilfe, ohne Fehler. Da bin ich mächtig stolz auf dich!',
    ],
    // Ein Satz richtig geordnet oder gebaut, beim ersten Versuch
    o_richtig_satz: [
      'Ein ganzer Satz, und jedes Wort am richtigen Ort!',
      '{Bagus!} So spricht man in Indonesien.',
      'Den hast du gebaut wie ein Otter seinen Bau. {Hebat, Nea!}',
      'Wort für Wort wie eine Perlenkette. {Bagus sekali!}',
      'Der Satz fliesst wie ein Bach!',
    ],
    // Vorspann: Eine andere Form wurde geschrieben, gefragt war die erste (sie zählt als richtig).
    // Es gibt kein Buch, also kein «im Buch» (auch die Notiz im Lösungsstreifen braucht dafür eigene Worte)
    o_auch: [
      'Auch richtig! Die erste Form heisst:',
      'Das stimmt auch. Auf der Karte steht zuerst:',
      'Richtig, so kann man es auch sagen. Gefragt war aber diese Form:',
    ],
    // Die Form unter «anders als» wurde geschrieben: zählt nicht als Versuch
    o_andere_form: [
      'Stimmt, so heisst es auch. Und wie noch?',
      'Das ist die Form von oben. Ich fische nach der anderen.',
      'Das steht schon oben. Wie kann man es noch sagen?',
    ],

    /* ---------- Die Karte wächst ---------- */
    // Stufe 1, 2 oder 4: also kein Stufenname (Keimling, Pflänzchen, Rispe), weder «gelb» noch
    // «golden» noch «reif». Und nicht «Stufe»: So heisst bei Pieks die Schwierigkeit. Stufe 1 ist
    // immer das erste Wachsen (eine Karte fällt nie unter Stufe zwei zurück, lernen.js verbuchen),
    // also kein «wieder». Bei Stufe 4 wird die Rispe gelb und neigt sich: also nichts von «grösser»
    // oder «nach oben». Und keine «Ernte»: So heisst die Karte am Ende der Runde.
    o_hoch: [
      'Es wächst und wächst!',
      'Schon ein Stück weiter!',
      'Im Reisfeld tut sich was!',
      'Schau, wie es gedeiht!',
      'Dein Reis macht sich prächtig!',
    ],
    // Stufe 3, die grüne Rispe: noch nicht gelb, golden oder reif, und kein «die erste Rispe»
    // (eine Karte kann fallen und wieder steigen). Sie steht noch aufrecht (padi-3 in otter.js), erst
    // die gelbe neigt sich: also nicht «hängt».
    o_frucht: [
      'Schau, eine grüne Rispe!',
      'Da wächst eine Rispe heraus. {Bagus sekali!}',
      'Noch grün, aber schon eine richtige Rispe!',
      'Oh, da ist ja eine Rispe! Die lasse ich in Ruhe reifen, versprochen.',
    ],
    // Stufe 5, goldener Reis: reif, ab in seinen Korb. Der Reis kommt in seinen Korb, das Wort gehört
    // Nea: also nicht «Dieser Reis gehört dir». «Mein Reisfeld auf Java» ist sein Zuhause, nicht Neas Beet.
    o_reif: [
      'Reif! Das weisst du jetzt richtig gut.',
      'Goldener Reis für meinen Korb. {Hebat, Nea!}',
      'Ganz golden! So glänzt nur reifer Reis.',
      'Golden wie die Sonne über meinem Reisfeld auf Java!',
      'Ganz reif! Das bleibt dir jetzt lange im Kopf.',
    ],

    /* ---------- Noch nicht richtig ---------- */
    // Vorspann nach finden und luecke; danach kommt das Wort oder der ganze Satz
    o_es_heisst: [
      'Noch nicht. Es heisst:',
      'Noch nicht ganz. Richtig ist:',
      'Kein Grund zum Abtauchen. So ist es richtig:',
      'Hör zu, so heisst es:',
      '{Tidak apa-apa!} Richtig heisst es:',
      'Diesmal noch nicht. Ich verrate es dir:',
    ],
    // Vorspann nach bedeutung und hoeren: Die richtige Antwort ist jetzt grün
    o_bedeutet: [
      'Schau auf die grüne Antwort. So klingt es:',
      'Das merken wir uns. Hör es dir nochmal an:',
      'Die richtige Antwort ist jetzt grün wie ein Reisfeld. Hör zu:',
      'Jetzt weisst du es. Und so klingt es auf Indonesisch:',
    ],
    // Steht für sich: wenn die Aufnahme des Worts fehlt. Solange es seine Aufnahmen nicht gibt,
    // kommt diese Liste nach jeder Auswahl, die nicht stimmt.
    o_ohne_clip: [
      'Noch nicht. Schau dir die Lösung auf der Karte an.',
      'Noch nicht ganz. Die Lösung steht jetzt auf der Karte.',
      '{Tidak apa-apa!} Auf der Karte siehst du jetzt, wie es richtig ist.',
      'Jetzt kennst du die Antwort: Sie steht auf der Karte.',
    ],
    // Vorspann nach lauschen
    o_falsch_hoeren: [
      'Hör noch einmal genau hin:',
      'Hör es dir noch einmal an:',
      'Ohren auf, ich sage es nochmal:',
      'Das war nicht leicht. Hier kommt es noch einmal:',
    ],

    /* ---------- Tipps nach dem ersten Versuch ----------
       Ohne Artikel steht nie ein Artikel-Hinweis davor, beim Otter ist ein Tipp
       also immer ein Satz für sich. Die Bedeutung der Nummern bleibt trotzdem wie
       bei ihr, falls der gemeinsame Code sie liest: kein «sonst ist alles richtig»,
       kein «nur», wo eine Zeile auch im Doppel stehen könnte. */
    // Nur Abstand oder Bindestrich stimmen nicht, alle Buchstaben schon («kupu kupu», «kupukupu»,
    // «selamatpagi»). Darum jede Zeile für Abstand wie für Bindestrich, und kein «Apostroph»: Den
    // gibt es im Indonesisch nicht, und tippbar lässt ihn von der echten Tastatur nicht durch.
    // [0] kommt bei ihr auch fest zusammen mit dem Akzent-Tipp (franz.js tippZeilen); [1] sagt nichts
    // über die Buchstaben und taugt so auch hinter einem anderen Hinweis (KERN_IM_DOPPEL).
    o_tipp_zeichen: [
      'Die Buchstaben stimmen. Schau auf Abstand und Bindestrich.',
      'Fast! Bei Abstand oder Bindestrich stimmt noch etwas nicht.',
      'Alle Buchstaben sind da. Schau genau, was zwischen ihnen steht oder fehlt.',
    ],
    // Neu, nur beim Otter: wie o_tipp_zeichen, aber nur, wenn das Ziel aus zwei gleichen Hälften mit
    // Bindestrich besteht (anak-anak, kupu-kupu, sama-sama) und das Urteil kern 'zeichen' ist. Dann
    // stimmen alle Buchstaben, und richtig ist genau ein Bindestrich ohne Abstand. Braucht im Kurs eine
    // Bedingung vor KERN_TIPP, etwa t.kern === 'zeichen' && /^(\p{L}+)-\1$/u.test(norm(bezug)).
    // Ohne sie bleibt die Liste stumm, und o_tipp_zeichen deckt den Fall ab.
    o_tipp_doppelwort: [
      'Fast! Zwischen die beiden Hälften gehört nur ein Bindestrich, kein Abstand.',
      'Die Buchstaben stimmen. Wenn ein Wort doppelt kommt, steht ein Bindestrich dazwischen.',
      'Die zwei Hälften halten sich an einem Bindestrich fest. Schau genau hin!',
    ],
    // Genau eine Stelle: ein Buchstabe fehlt, ist zu viel, der verkehrte oder zwei sind vertauscht.
    // [0] sagt «Nur ein Buchstabe» und stimmt darum nicht, wenn zwei vertauscht sind (zwei Marken):
    // Dann nur [1], [2], [3] (KERN_DREHER), und darum nennt auch [3] keinen einzelnen Buchstaben
    // («etwas»). Im Doppel nur [3] (KERN_IM_DOPPEL).
    o_tipp_buchstabe: [
      'Nur ein Buchstabe stimmt noch nicht. Ich zeige dir, wo.',
      'Ganz knapp! Schau auf die markierte Stelle.',
      'Fast! Es hakt nur an einer Stelle.',
      'So nah dran! Da ist noch etwas aus der Reihe geschwommen.',
    ],
    // Legen, Ordnen, Bauen: Buchstaben oder Wörter, eine Kachel oder viele, vielleicht stimmt noch gar
    // nichts. Was stimmt, bleibt liegen, der Rest fliegt zurück.
    o_tipp_legen: [
      'Was stimmt, bleibt liegen. Probier den Rest noch einmal.',
      'Noch nicht. Die leeren Plätze brauchen andere Kacheln.',
      'Was nicht passt, ist zurückgeschwommen. Schau, was in die Lücken gehört.',
      'Noch nicht. Geh es Kachel für Kachel durch, ganz in Ruhe.',
    ],
    // Ein anderes Wort aus seinem Kurs geschrieben; der Streifen «Dein Wort» zeigt, was es heisst.
    // lernen.js andereKarte findet jedes Wort des Kurses, auch eines, das Nea noch nicht kennt (ein
    // Reiskorn wächst noch nicht), und auch einen anderen Teil desselben Eintrags (der liegt am selben
    // Platz): also nichts über Wachsen und keine «andere Stelle».
    o_tipp_verwechselt: [
      'Das ist auch ein indonesisches Wort, aber ein anderes.',
      'Dieses Wort gibt es. Es bedeutet aber etwas anderes.',
      'Das ist ein anderes Wort aus meinem Bach. Schau, was es bedeutet.',
    ],
    // Diktat: eine andere richtige Form geschrieben, nicht die gehörte. Ausserhalb des Diktats käme die
    // Liste nur bei einem Teil mit drei Formen oder mehr (lernen.js: andere_form, wenn eine spätere
    // Form als die gefragte getippt wird): indo-vokabeln prüft darum höchstens zwei Formen je Teil.
    o_tipp_andere_form: [
      'Das gibt es auch. Aber hör noch einmal hin: Ich habe etwas anderes gesagt.',
      'Auch das ist richtig geschrieben. Gefragt ist aber genau das, was du hörst.',
    ],
    // Die richtigen Wörter, falsch gereiht. Nichts darüber, ob Indonesisch die Wörter anders stellt als
    // Deutsch: Viele Sätze haben dieselbe Reihenfolge («Saya dari Swis.»), und bei «Ordne, was du
    // hörst» gibt es kein Deutsch zum Vergleichen.
    o_tipp_reihenfolge: [
      'Die Wörter stimmen, die Reihenfolge noch nicht.',
      'Alle Wörter sind da. Schieb sie noch einmal zurecht.',
      'Richtige Wörter, aber noch durcheinander. Wer gehört wohin?',
      'Die Wörter sind kreuz und quer geschwommen. Bring sie in die richtige Reihe.',
    ],
    // Weit weg: Die Spur zeigt den ersten Buchstaben und ein Kästchen je Buchstabe. Also nichts
    // darüber, wie weit es war.
    o_tipp_anders: [
      'Noch nicht. Ich zeige dir den ersten Buchstaben.',
      'Ich helfe dir: So fängt es an, und so lang ist es.',
      'Ich lege dir eine Spur aus Kieseln: den ersten Buchstaben und die Länge.',
      'Hier kommt eine kleine Hilfe. Zähl die Plätze und schau auf den Anfang.',
    ],

    /* ---------- Lösung, Nachbauen, zweite Chance ---------- */
    // Nach zwei Fehlversuchen oder nach «Weiss ich nicht», beim Legen wie beim Schreiben. Kein
    // Versprechen, dass es nächstes Mal allein klappt.
    o_loesung: [
      'Ich zeige es dir. Mach es einmal nach, das hilft beim Merken.',
      '{Tidak apa-apa!} Schau es dir an und mach es einmal nach.',
      'Als kleiner Otter musste ich das auch erst lernen. Schau hin und mach es nach.',
      'Hier ist die Lösung. Einmal nachmachen, und sie bleibt besser hängen.',
      'Ich schwimme vor, du schwimmst hinterher! Mach es einfach einmal nach.',
    ],
    // Vorspann nach dem Nachbauen (nur mit Aufnahme des Worts), beim Legen wie beim Schreiben
    // (franz.js GEBAUT): also nichts, was nur für Kacheln stimmt («liegt»)
    o_nachgebaut: [
      '{Bagus!} Und so heisst es richtig:',
      'Jetzt ist alles am richtigen Platz:',
      'Sauber nachgemacht! Und so klingt es:',
      'Einmal selbst gemacht, schon besser gemerkt. Hör zu:',
    ],
    // Die Karte kommt nach einem Fehler in derselben Runde wieder: kein Versprechen, dass es klappt
    o_wieder: [
      'Das hatten wir vorhin. Neuer Versuch, neues Glück!',
      'Zweite Chance!',
      'Schau, wer da wieder angeschwommen kommt!',
      'Das hier kommt noch einmal zu dir. Ganz in Ruhe.',
    ],
    // Eine Minute ohne Tipp. Kein Wort über Knöpfe: Nicht jede Aufgabe hat dieselben.
    // Zu [2] darf der Kurs «jongliert» spielen (otter.css; unter reduce ein Standbild mit Kiesel).
    o_warten: [
      'Lass dir Zeit. Ich habe es nicht eilig.',
      'Wenn du es nicht weisst, rate ruhig. Auch ein Otter fängt nicht jeden Fisch.',
      'Ich jongliere solange mit meinem Kiesel. Kein Grund zur Eile.',
      'Denk in Ruhe nach. Ich tropfe hier ein bisschen vor mich hin.',
      'Bist du noch da? Ich putze mir in der Zwischenzeit die Schnurrhaare.',
    ],

    /* ---------- Finale und Ende der Runde ---------- */
    o_paare: [
      'Zum Schluss noch die Paare!',
      'Jetzt das Finale: Wer schwimmt mit wem?',
      'Zum Abschluss ein Spiel! Was gehört zusammen?',
    ],
    o_paare_fertig: [
      'Alle Paare sind beisammen!',
      '{Hore!} Kein Wort ist allein geblieben.',
      'Jedes Wort schwimmt jetzt mit seinem Partner!',
    ],
    // Auch nach dem freien Üben, auch nach der allerersten Runde (kein «wieder») und auch, wenn nichts
    // gewachsen ist. In den Korb kommt nur reifer Reis, keine Runden. Nea hört diese Liste in beiden
    // Kursen: nicht ihre Satzmuster.
    o_ende: [
      'Platsch, Runde vorbei! Mein Fell ist vom vielen Üben ganz zerzaust. {Sampai besok!}',
      '{Terima kasih, Nea!} Mit dir macht sogar das Trockenwerden Spass.',
      'Puh! Jetzt lasse ich mich erst einmal auf dem Rücken treiben.',
      'Und jetzt eine Krabbe für mich! Du hast dir eine Pause verdient.',
      'So emsig wie du sucht nicht einmal ein Otter nach Krabben!',
      '{Hebat, Nea!} Runde fertig, Fell noch nass.',
    ],
    // Nichts ging daneben, kein zweiter Versuch, kein Fehlgriff bei den Paaren (franz.js: kein falsch,
    // kein fast, keine fehlpaare). Der Spritzer in [2] ist ein Wortspiel mit seinem Namen.
    o_ende_perfekt: [
      '{Wah, Nea!} Kein einziges Wort ist dir entwischt.',
      'Alles richtig, von vorne bis hinten. {Sempurna!}',
      'Diese Runde war ein Kopfsprung ganz ohne Spritzer!',
      'Das erzähle ich allen Fischen im Bach!',
    ],
    // Drei Fehler oder mehr, bis zum Schluss gespielt
    o_ende_muehsam: [
      'Das war zäh wie Schlamm im Reisfeld. Aber gerade im Schlamm wächst der Reis!',
      'Trübes Wasser heute! Aber aufgegeben hast du nicht.',
      'Heute ging es gegen den Strom. Und du bist bis ans Ufer geschwommen!',
      'Auch ich plumpse manchmal vom Stein ins Wasser. Dann klettere ich eben wieder hinauf!',
    ],
    // Nichts fällig. [3] ist die einzige Zeile, die frei üben anbietet: Sie fällt weg, wenn es auf der
    // Karte kein «Frei üben» gibt (franz.js leerZeigen). [0] bis [2] bieten nichts an. Die Karte sagt
    // daneben «Morgen sind … dran» oder «Die Wörter ruhen sich aus»: also keine Runde für morgen versprechen.
    o_nichts_faellig: [
      'Für heute ist alles im Trockenen. Die Wörter dösen in der Sonne.',
      'Heute ist nichts mehr dran. Reis wächst nicht schneller, wenn man daran zieht!',
      'Fertig für heute! Mein Kiesel und ich machen jetzt auch Pause.',
      'Dein Reisfeld hat heute genug Wasser. Magst du trotzdem ein bisschen frei üben?',
    ],
    // Jedes gewählte Wort ist bekannt, das nächste Lernziel wird angeboten (mit Ja/Nein darunter):
    // Jede Zeile endet mit einer Ja-Nein-Frage. Ein Reiskorn ist ein Wort, das Nea noch nicht kennt:
    // [2] stimmt genau.
    o_naechstes: [
      'Deine ausgewählten Wörter kennst du jetzt alle. Kommt ein Lernziel dazu?',
      'Im Bach schwimmen noch mehr Wörter. Fischen wir das nächste Lernziel heraus?',
      'Ich habe noch eine Handvoll Reiskörner für dich. Säen wir sie aus?',
    ],
    // Alle Wörter des Kurses sind reif (goldener Reis)
    o_alles_reif: [
      'Dein ganzes Reisfeld leuchtet golden! Das ist die schönste Ernte, die ein Otter je gesehen hat.',
      '{Terima kasih, Nea!} So viel goldenen Reis hat nicht einmal mein Reisfeld auf Java.',
    ],

    /* ---------- Album und Garderobe ---------- */
    // Auf einer Seite mit Wörtern, jedes zweite Mal. Er spricht ohne Blase: Ohne seine Stimme bleibt
    // die Zeile ungehört, darum darf [0] das Vorsagen versprechen. Ihr Tab liegt daneben: nicht ihre Sätze.
    // Die Seite einer Pelajaran, auf der noch nichts wächst, ist auch dabei: also kein «schon gewachsen».
    o_album: [
      'Willkommen in deinem Reisfeld! Tippe ein Wort an, und ich sage es dir vor.',
      'Der Reis neben jedem Wort zeigt dir, wie weit es gewachsen ist.',
      'Schau dich ruhig um. So ordentlich wie hier ist es in meinem Kopf nie!',
    ],
    // Passt zu jedem Teil, auch zu Bleistift, Augenklappe, Astronautenhelm oder Einhorn-Horn (texte.js
    // ITEMS): also nichts wie «elegant». Mit dem Umschalter hört Nea ihn und sie gleich nacheinander.
    o_anziehen: [
      '{Wah!} Das muss ich unbedingt meinem Spiegelbild im Bach zeigen!',
      'Ziemlich schick für einen nassen Otter!',
      'Ob das auch unter Wasser hält?',
      'Damit sieht mich jeder Fisch schon von Weitem!',
      'So einen Otter hat Java noch nie gesehen!',
    ],
    o_ausziehen: [
      'Ohne bin ich schneller im Wasser.',
      'Das hebe ich mir für später auf.',
    ],
    o_zu_teuer: [
      'Dafür reichen die Äpfel noch nicht.',
      'Das kostet mehr Äpfel, als wir haben. Fleissig üben hilft!',
    ],
    // Das Vorlesen wurde wieder eingeschaltet (#stimmeBtn, in den Einstellungen «Vorlesen»). Die Zeile
    // steht in seiner Blase, auch solange es seine Aufnahmen nicht gibt: also nichts, was seine Stimme
    // verspricht, und nicht «Ton» (das ist der andere Knopf, #tonBtn).
    o_stimme_an: ['Das Vorlesen ist wieder an. {Asyik!}'],
  };

  /* =====================================================================
     PIEKS IM INDONESISCH: Er lernt mit und ist immer einen Schritt
     hinter Nea, macht sich gern selbst klein und neckt den nassen
     Freund. Nur Deutsch, keine Klammern, kein indonesisches Wort.
     Schlüssel 'pi_' + die Endung der Liste bei ihr; wo die Endung die
     Sprache nennt, ohne sie: p_fr_start → pi_start, p_fakt_franz →
     pi_fakt. p_lichtung_zwei bekommt pi_lichtung_drei.
     Die Listen pi_rat_* und pi_staunt könnten auch die französischen
     Zeilen wörtlich übernehmen (gleiche Aufnahmen, nichts zu vertonen);
     hier stehen eigene, damit Nea nicht in beiden Kursen dasselbe hört.
     Nur pi_fakt[1] ist wörtlich p_fakt_franz[1]: dieselbe Aufnahme.
     ===================================================================== */
  const PTEXTE = {
    // Erstes Treffen (feste Reihenfolge): [0] gleich nach dem Schütteln, die Tropfen haben ihn
    // getroffen; [1] nach o_vorstellen[0], vor dem Namenswitz
    pi_besuch: [
      'Brrr! Seit wann regnet es hier von der Seite?',
      'Nea, das ist mein Freund {O}. Er ist mit dem Schiff bis Holland gefahren und dann den Rhein heraufgeschwommen!',
    ],
    // Ab und zu nach der Eröffnung des Otters (statt p_fr_start), solange es den Kurs gibt: also nicht
    // «kann ich noch gar nicht» (er rät mit und wird besser, pi_rat_richtig[2]). Er steht sichtbar auf
    // der Bühne, einen Schirm gibt es nicht.
    pi_start: [
      'Ich lerne mit! In Indonesisch bin ich noch ein ganz kleiner Igel.',
      'Psst, Nea. Wenn du ein Wort weisst, flüster es mir zu.',
      'Ich setze mich dazu. Aber nicht zu nah, sonst werde ich nass.',
      'Indonesisch! Ich hätte meinen Regenschirm mitbringen sollen.',
    ],
    // Pieks rät mit (nur bei Auswahl-Aufgaben): beide richtig
    pi_rat_richtig: [
      'Ich hatte dasselbe! Wir zwei sind ein gutes Team.',
      'Juhu, zwei Treffer auf einmal!',
      'Wir haben beide richtig getippt. Langsam werde ich ein Indonesisch-Profi!',
      'Ha! Genau darauf habe ich auch gesetzt.',
    ],
    // Nea richtig, Pieks daneben: ein Apfel mehr für sie
    pi_rat_falsch: [
      'Daneben! Ich glaube, ich habe Wasser in den Ohren.',
      'Du hast es gewusst, ich habe nur geraten. Ein Extra-Apfel für dich!',
      'Ups, mein Tipp war nichts. Der Apfel gehört dir!',
      'Du hast mich geschlagen! Von dir kann ich noch viel lernen.',
    ],
    // Beide daneben, auf derselben oder auf verschiedenen Antworten
    pi_rat_beide: [
      'Wir lagen beide daneben. Geteiltes Pech ist halbes Pech!',
      'Ich lag auch daneben. Das schreibe ich mir hinter die Stacheln.',
      'Keiner von uns hat es gewusst. Jetzt lernen wir es eben zu zweit.',
      'Auch mein Tipp war nichts. Zum Glück fragt mich niemand!',
    ],
    // Nea daneben, Pieks richtig: Er gibt nicht an
    pi_rat_glueck: [
      'Ich habe nur geraten. Ein echter Glückstreffer!',
      'Das war pures Glück, ehrlich. Meine Stacheln haben gezittert.',
      'Glück gehabt! Genauso gut hätte ich danebentippen können.',
    ],
    // Nach «Zehn in Folge!» auf dem Indonesisch-Bildschirm (die Zahl hat er davor schon gesagt)
    pi_staunt: [
      'So viele richtig! Ich komme kaum hinterher.',
      'Sag mal, kommst du heimlich auch aus Indonesien?',
      'Wie machst du das nur? Ich verwechsle immer noch alles.',
      'Du bist ja schneller als ein Otter im Wasser!',
      'Ich übe heute Nacht heimlich weiter. Sonst hole ich dich nie mehr ein!',
    ],
    // Vorspann vor dem Fakt am Ende der Runde (statt p_fakt_franz). Der Fakt kann von allem handeln,
    // also nichts über sein Thema. Pieks rät höchstens einmal je Runde und nicht in jeder (franz.js):
    // also kein «wieder dran».
    pi_fakt: [
      'Zur Belohnung noch ein Fakt von mir:',
      'Jetzt bin ich dran. Wusstest du das?',
      'Wörter hat mein Freund, Fakten habe ich. Hör mal:',
    ],
    // Zurück vom Rechnen, ab und zu statt «lichtung», wenn alle drei dastehen. Ersetzt dann
    // p_lichtung_zwei («Zwei Lehrer», «wir zwei» stimmen nicht mehr). Freundin = Pirouette,
    // Freund = der Otter.
    pi_lichtung_drei: [
      'Zahlen mit mir oder eine Sprache mit meinen Freunden? Du hast die Wahl.',
      'Drei Freunde, eine Lichtung. Was darf es sein?',
      'Na, Lust auf Abwechslung? Hier warten Zahlen und gleich zwei Sprachen.',
      'Hier stehen wir zu dritt und warten auf dich. Zahlen oder Wörter?',
    ],
  };

  /* =====================================================================
     MERKHILFEN: stehen beim Kennenlernen auf der Karte, und der Otter
     sagt sie nach dem Wort (nach dem Wortmoment). Schlüssel ist die
     Kennung des Eintrags in VOK_INDO (un + '|' + fr, etwa 'i6|matahari').
     Die Liste ist geschlossen: nur, was ganz genau stimmt.
     - Keine Klammern: Die Karte zeigt den Text, wie er ist
       (uebungen.js merkhilfeVon, esc), {…} stünde dort wörtlich.
     - Das indonesische Wort steht nie darin. Sieht ein deutsches Wort
       gleich aus (Haus, laut), steht es als deutsches Wort da und wird
       deutsch gesprochen: Genau das ist der falsche Freund. Darum «sieht
       aus wie», nie «klingt wie»: Indonesisch spricht ha-us und la-ut
       zweisilbig, und gleich davor kommt die Aufnahme.
     - Einzelne Buchstaben (c, j, y, e, a) liest die deutsche Stimme als
       Buchstaben, wie bei ihr («Das l hört man nicht»). Lautgruppen wie
       tsch oder dsch stehen nie allein da (die Stimme buchstabierte sie):
       «der Anfang von Tschüss». Kein «Ein e» am Satzanfang («Eine»).
     - Die Verdopplung mit Bindestrich ist der wichtigste Punkt der
       Schreibweise: sama-sama führt sie ein (das erste Doppelwort),
       anak-anak zeigt die Mehrzahl, kupu-kupu die Falle, orang utan die
       Gegenprobe (deutsch mit Bindestrich, indonesisch ohne).
     ===================================================================== */
  const MERKHILFEN = {
    'i1|sama-sama': 'Zweimal dasselbe Wort, mit einem Bindestrich dazwischen. Das gibt es auf Indonesisch ganz oft!',
    'i1|terima kasih': 'Wörtlich heisst das ungefähr «Liebe empfangen». Was für ein schönes Danke!',
    'i1|ya': 'Klingt wie auf Deutsch. Das y spricht man hier wie unser j.',
    'i4|bahasa Jerman': 'Das J klingt hier wie der Anfang von Dschungel.',
    // kakek und kakak unterscheiden sich nur im zweiten Selbstlaut
    'i3|kakek': 'Grossvater mit e, ältere Geschwister mit a. Sonst sind die beiden Wörter gleich!',
    // Der Eintrag mit beiden Teilen: Auf der Karte steht «anak, anak-anak», das Kind und die Kinder
    'i3|anak, anak-anak': 'Das Wort zweimal, mit Bindestrich dazwischen: So wird aus einem Kind die Mehrzahl.',
    'i3|kucing': 'Das c klingt hier wie der Anfang von Tschüss.',
    // Nicht «Gross geschrieben heisst es Sonntag»: Am Satzanfang steht auch die Woche gross
    'i4|Minggu': 'Dieses Wort heisst Sonntag. Klein geschrieben heisst es Woche!',
    'i5|haus': 'Sieht aus wie das deutsche Wort Haus, heisst aber durstig. Stell dir ein Haus vor, das Durst hat!',
    'i5|air': 'Sieht aus wie das englische Wort für Luft. Hier ist es aber Wasser, mein Lieblingselement!',
    'i6|laut': 'Sieht aus wie das deutsche Wort laut, heisst aber Meer. Das Meer rauscht ja auch ganz schön laut!',
    'i6|matahari': 'Wörtlich heisst das «Auge des Tages». Ein schöner Name für die Sonne!',
    // KBBI schreibt orang utan getrennt; deutsch Orang-Utan: die eine Falle, die man vorhersehen kann
    'i6|orang utan': 'Das heisst wörtlich «Mensch des Waldes», daher das deutsche Wort. Hier aber ohne Bindestrich!',
    'i6|kupu-kupu': 'Doppelt, aber keine Mehrzahl: Schon ein einziger Schmetterling heisst so.',
  };

  /* =====================================================================
     WORTMOMENTE: kleine Reaktionen, einmal, wenn ein Wort zum ersten Mal
     kennengelernt wird, gleich nach dem Wort und vor der Merkhilfe (so
     macht es franz.js kennenEinleiten; der Kommentar in franz-texte.js
     sagt «nach der Merkhilfe»). Schlüssel wie bei den Merkhilfen.
       wer      'o' der Otter · 'p' Pieks (franz.js kennt nur 'p' und 'h':
                Der Kurs muss 'o' auf den Otter legen)
       klasse   was die Figur dazu macht (otter.css): 'froh' ist eine
                Stimmung, 'dreht', 'schuettelt', 'jongliert' sind
                Bewegungen. Pieks hat keine.
     Keine Zeile verspricht die Bewegung («Schau!»): Unter reduce lässt
     der Kurs «dreht» heute ganz aus. Pieks sagt «Das bin ja ich!» nur
     beim Igel, wie im Französisch; der Otter hat dafür eigene Worte.
     Kein «endlich» bei Pieks: Seine Momente kommen in jeder Reihenfolge.
     ===================================================================== */
  const WORTMOMENTE = {
    'i4|berenang': { wer: 'o', t: 'Schwimmen! Das kann ich am allerbesten.', klasse: 'froh' },
    'i5|ikan': { wer: 'o', t: 'Fisch! Jetzt knurrt mir der Magen.' },
    // nasi ist gekochter Reis; auf dem Feld heisst er padi. Das ist im Kurs eine eigene Vokabel
    // (i6|padi) und steht darum nicht hier: Vokabeln stehen nie in einer Zeile. Zwergotter fressen
    // Krabben, Muscheln und Fisch, keinen Reis.
    'i5|nasi': { wer: 'o', t: 'Gekochter Reis! Auf dem Feld heisst er anders, und ich esse sowieso lieber Fisch.' },
    'i6|sungai': { wer: 'o', t: 'Ein Fluss! Den Rhein bin ich bis zu euch heraufgeschwommen.' },
    'i6|hujan': { wer: 'o', t: 'Regen! Da werde ich nass, ohne in den Bach zu springen.', klasse: 'schuettelt' },
    // Ein Prahlen, keine Regel: Warum Wörter doppelt stehen, sagen die Merkhilfen
    'i1|berang-berang': { wer: 'o', t: 'Ein Otter! So wichtig, dass man es gleich zweimal sagt.', klasse: 'froh' },
    'i4|bermain': { wer: 'o', t: 'Spielen! Am liebsten mit meinem Kiesel.', klasse: 'jongliert' },
    'i4|menari': { wer: 'o', t: 'Tanzen? Da ist meine Freundin viel besser als ich!', klasse: 'dreht' },
    'i6|lucu': { wer: 'o', t: 'Herzig? Da fällt mir sofort ein kleiner Otter ein!' },
    // landak ist zuerst das Stachelschwein, der Igel oft landak mini (der Eintrag nennt beides): mit dem
    // Eintrag zusammen ändern
    'i1|landak': { wer: 'p', t: 'Das bin ja ich! Hoffentlich hält mich niemand für ein Stachelschwein.' },
    'i2|menghitung': { wer: 'p', t: 'Rechnen! Das ist mein Fach, in jeder Sprache.' },
    // «ist», nicht «klingt»: Ohne seine Aufnahmen gibt es nur das geschriebene Wort
    'i5|apel': { wer: 'p', t: 'Das ist ja fast wie auf Deutsch! Das merke ich mir sofort.' },
    // In diesem Satz kommt der Otter selbst vor, darum sagt er die Zeile. Im Entwurf hiess der Satz
    // «Pieks teman saya.», und sie war Pieks' Moment.
    'i1|Percik teman saya.': { wer: 'o', t: 'Da komme ich ja vor! Ich bin ganz gerührt.' },
  };

  // Listen, die jubeln und loben. Gebraucht wird das nur für den Zusammenhang der Aufnahme.
  const LEBHAFT = ['o_gruss', 'o_gruss_faellig', 'o_start_neu', 'o_start_wdh', 'o_start_gemischt', 'o_start_frei',
    'o_richtig', 'o_richtig_nachfehler', 'o_richtig_schreiben', 'o_richtig_satz', 'o_hoch', 'o_frucht', 'o_reif',
    'o_paare', 'o_paare_fertig', 'o_ende', 'o_ende_perfekt', 'o_gesagt', 'o_kitzeln', 'o_anziehen', 'o_jetzt_du'];

  // Die Erfolge des Kurses, nur zum Nachschlagen: Sie stehen in ERFOLGE in texte.js, denn dort liest
  // Pieks die Namen vor, und alleSaetze() nimmt sie auf. Die Bedingungen kennt indo.js. Hier drinnen
  // heissen sie nicht ERFOLGE: Der Name verdeckte das ERFOLGE von texte.js, das T_I oben im Browser
  // und im Service Worker liest, und die Datei bräche dort beim Laden ab.
  const ERFOLGE_INDO = Object.fromEntries(Object.entries(T_I.ERFOLGE).filter(([id]) => id.startsWith('indo_')));

  /* =====================================================================
     AUFNAHMEN: alles, was für das Indonesisch vertont wird, jeder Clip
     nur einmal (gleiche Stimme, gleicher Text). Ein Eintrag, wie bei ihr:
       { s, v, gruppe, vorher, nachher, tempo, lebhaft }
       otter       seine Zeilen, Stück für Stück: v 'od' deutsch,
                   'oi' indonesisch (LEHRER.o in texte.js)
       pieks       PTEXTE und Pieks' Wortmomente: v 'p'
       iwort       die Einträge, wie sie beim Kennenlernen klingen: v 'i'
       iform       die einzelnen Formen, nach denen die Aufgaben fragen: v 'i'
       ilangsam    dasselbe langsam, wo es mehr als ein Wort ist: v 'il'
     Die Kürzel der Vokabeln setzt VOK_INDO.vokabelClip. vorher und
     nachher werden nie gesprochen. Sie sagen der Stimme, in welcher
     Sprache und in welchem Ton die Aufnahme gemeint ist: vor den
     indonesischen Stücken und Vokabeln darum ein indonesischer Satz (ohne
     Leerzeichen vor : ! ?), vor den deutschen ein deutscher. Im
     Dateinamen stecken sie nicht: Bis zur ersten echten Aufnahme lassen
     sie sich frei verbessern, danach gilt eine Änderung nur für Neues.
     ===================================================================== */
  function alleIndoClips() {
    const liste = [];
    // Gleich ist ein Clip, wenn Stimme und Text gleich sind (die Stimme trägt Sprache und Tempo).
    // Nicht nach clipDatei zusammenfassen: Träfen zwei verschiedene Texte dieselbe Kennung, bliebe
    // sonst still einer weg. So stehen beide da, und die Prüfung meldet die doppelte Datei.
    const schon = new Map();
    const dazu = c => {
      const wie = c.v + ' ' + c.s.normalize('NFC');
      const alt = schon.get(wie);
      if (!alt) {
        schon.set(wie, c);
        liste.push(c);
      } else if (c.lebhaft && !alt.lebhaft) {
        // Derselbe Ausruf steht in zwei Listen: aufgenommen wird er lebhaft
        alt.lebhaft = true;
        alt.nachher = c.nachher;
      }
    };

    const L = T_I.LEHRER.o;
    // Ein kurzer deutscher Ausruf allein wird leicht für eine andere Sprache gehalten, darum der
    // gedachte Satz davor. Einen gedachten Satz danach bekommt Percik nie: Seine Stimme hängte dessen
    // ersten Laut an die Aufnahme («Lalu …» als «l», «Hör gut zu.» als «h», «Sekarang …» als «s»),
    // hörbar oder als Rest am Dateiende. Ohne Satz danach war in 384 Aufnahmen kein solcher Rest.
    // Percik ist ein Bub, darum «Er» im Zusammenhang, auch wenn ihn eine Frauenstimme spricht.
    const otter = (e, lebhaft) => {
      for (const x of T_I.segmente(e, L.sprache)) {
        if (x.sprache === L.sprache) {
          dazu({ s: x.s, v: L.fremd, gruppe: 'otter', vorher: 'Dia berkata dalam bahasa Indonesia: ', nachher: '', tempo: 1, lebhaft });
          continue;
        }
        dazu({ s: x.s, v: L.de, gruppe: 'otter', vorher: T_I.OTTER.sprich + ' sagt auf Deutsch: ', nachher: '', tempo: 1, lebhaft });
      }
    };
    const pieks = (e, nachher) => dazu({ s: T_I.sprechtext(e), v: 'p', gruppe: 'pieks', vorher: '', nachher, tempo: 1, lebhaft: false });

    for (const [name, pool] of Object.entries(OTEXTE)) {
      for (const e of pool) otter(e, LEBHAFT.includes(name));
    }
    for (const e of Object.values(MERKHILFEN)) otter(e, false);
    for (const m of Object.values(WORTMOMENTE)) if (m.wer === 'o') otter(m.t, false);

    for (const [name, pool] of Object.entries(PTEXTE)) {
      // Der Vorspann zum Fakt ist kurz: ein gedachter Fakt danach hält ihn im Erzählton, wie bei ihr
      for (const e of pool) pieks(e, name === 'pi_fakt' ? 'Igel haben etwa siebentausend Stacheln.' : '');
    }
    for (const m of Object.values(WORTMOMENTE)) if (m.wer === 'p') pieks(m.t, '');

    // Vokabeln gehen nie durch sprechtext(): Der Text ist wörtlich der des Eintrags oder der Form.
    // vokabelClip gibt null, wo es keine langsame Aufnahme gibt (nur bei Leerzeichen, langsamGibt).
    const vokabel = (c, e, gruppe) => {
      if (!c) return;
      dazu({ s: c.s, v: c.v, gruppe,
        vorher: e.art === 'satz' ? 'Dengarkan baik-baik, kalimat berikutnya adalah: ' : 'Dengarkan baik-baik, kata berikutnya adalah: ',
        // Kein Satz danach: Die Stimme hängte sonst den ersten Laut des nächsten Satzes an das Wort. Mit
        // «Sekarang coba ulangi.» zischte jedes dritte Wort («s»), mit «Kamu bisa mengulanginya.» knackte
        // jedes vierte («k»); Nea hat beides gehört, die Messung bestätigt es. Der Satz davor genügt, damit
        // die Stimme Indonesisch spricht.
        nachher: '', tempo: c.v === L.langsam ? 0.7 : 0.85, lebhaft: false });
    };
    // Erst alle Einträge, dann die Formen: Eine Form, die wie ihr Eintrag heisst, ist dieselbe Aufnahme
    const jedeForm = (e, f) => e.teile.forEach((teil, i) => teil.fr.forEach((form, j) => f(i, j)));
    for (const e of V_I.VOKABELN) vokabel(V_I.vokabelClip(e), e, 'iwort');
    for (const e of V_I.VOKABELN) jedeForm(e, (i, j) => vokabel(V_I.vokabelClip(e, i, j), e, 'iform'));
    for (const e of V_I.VOKABELN) vokabel(V_I.vokabelClip(e, undefined, undefined, true), e, 'ilangsam');
    for (const e of V_I.VOKABELN) jedeForm(e, (i, j) => vokabel(V_I.vokabelClip(e, i, j, true), e, 'ilangsam'));
    return liste;
  }

  /* =====================================================================
     PRÜFUNG: die Regeln oben, wie sie schon beim Schreiben der Texte
     geprüft wurden, dazu die Listen, die der Kurs ruft. Gibt eine Liste
     von Fehlertexten zurück, leer heisst alles stimmt. Der Vergleich mit
     ihren Listen läuft nur in Node (pruefe.mjs): Im Browser verdecken
     hier die eigenen PTEXTE ihre.
     ===================================================================== */
  // Jede Liste, die der Kurs von ihm ruft, mit ihrer Zeilenzahl: alle ihre Listen mit o_ statt h_
  // ausser denen ohne Gegenstück, dazu die neue o_tipp_doppelwort. Die Zahlen sind wie bei ihr;
  // o_name_witz darf leer sein, denn die Zeile hängt am Namen.
  const LISTEN = {
    o_vorstellen: 2, o_vorstellen_kurz: 1, o_name_witz: 1,
    o_gruss: 8, o_gruss_faellig: 5, o_lichtung: 5, o_kitzeln: 8, o_wort_vor: 3, o_keine_auswahl: 2,
    o_start_neu: 5, o_start_wdh: 5, o_start_gemischt: 5, o_start_frei: 3,
    o_kennen: 6, o_kennen_satz: 4, o_sag: 4, o_jetzt_du: 3, o_gesagt: 4,
    o_erklaer_bedeutung: 1, o_erklaer_hoeren: 1, o_erklaer_finden: 1, o_erklaer_lauschen: 1, o_erklaer_legen: 1,
    o_erklaer_schreiben: 1, o_erklaer_luecke: 1, o_erklaer_ordnen: 1, o_erklaer_bauen: 1, o_erklaer_echo: 1,
    o_erklaer_paare: 1,
    o_richtig: 24, o_richtig_nachfehler: 6, o_richtig_schreiben: 6, o_richtig_satz: 5, o_auch: 3, o_andere_form: 3,
    o_hoch: 5, o_frucht: 4, o_reif: 5,
    o_es_heisst: 6, o_bedeutet: 4, o_ohne_clip: 4, o_falsch_hoeren: 4,
    o_tipp_zeichen: 3, o_tipp_doppelwort: 3, o_tipp_buchstabe: 4, o_tipp_legen: 4, o_tipp_verwechselt: 3,
    o_tipp_andere_form: 2, o_tipp_reihenfolge: 4, o_tipp_anders: 4,
    o_loesung: 5, o_nachgebaut: 4, o_wieder: 4, o_warten: 5,
    o_paare: 3, o_paare_fertig: 3, o_ende: 6, o_ende_perfekt: 4, o_ende_muehsam: 4, o_nichts_faellig: 4,
    o_naechstes: 3, o_alles_reif: 2,
    o_album: 3, o_anziehen: 5, o_ausziehen: 2, o_zu_teuer: 2, o_stimme_an: 1,
  };
  // Ihre Listen ohne Gegenstück (oben: «Was es im Indonesisch nicht gibt») und seine ohne ihres
  const OHNE_GEGENSTUECK = ['h_unite_frage', 'h_unite_u1', 'h_unite_u2', 'h_unite_u3', 'h_unite_u4', 'h_kontrast',
    'h_erklaer_artikel', 'h_erklaer_akzent', 'h_tipp_akzent', 'h_tipp_akzent_zeichen', 'h_tipp_ligatur',
    'h_tipp_artikel_fehlt', 'h_tipp_genus', 'h_tipp_elision', 'h_tipp_artikel_ganz'];
  const NUR_OTTER = ['o_tipp_doppelwort'];
  // Pieks im Indonesisch: jede Liste mit ihrem Gegenstück im Französisch und der Zeilenzahl von dort
  const PIEKS_LISTEN = {
    pi_besuch: ['p_besuch', 2], pi_start: ['p_fr_start', 4], pi_rat_richtig: ['p_rat_richtig', 4],
    pi_rat_falsch: ['p_rat_falsch', 4], pi_rat_beide: ['p_rat_beide', 4], pi_rat_glueck: ['p_rat_glueck', 3],
    pi_staunt: ['p_staunt', 5], pi_fakt: ['p_fakt_franz', 3], pi_lichtung_drei: ['p_lichtung_zwei', 4],
  };
  // Ein Vorspann endet auf einen Doppelpunkt und kommt nur mit seiner Vokabel; jede andere Zeile nie
  const VORSPANN = ['o_wort_vor', 'o_kennen', 'o_kennen_satz', 'o_sag', 'o_auch', 'o_es_heisst', 'o_bedeutet',
    'o_falsch_hoeren', 'o_nachgebaut'];
  const MIT_NAMEN = ['o_vorstellen', 'o_vorstellen_kurz', 'o_name_witz', 'pi_besuch'];
  const MIT_FAST = ['o_tipp_zeichen', 'o_tipp_doppelwort', 'o_tipp_buchstabe'];
  // Keine Klammer vor der Antwort: Ein Ausruf, der zugleich eine Vokabel ist, verriete sie. o_kennen_satz
  // steht an derselben Stelle wie o_kennen.
  const vorDerAntwort = liste => /^o_(tipp|erklaer)_/.test(liste)
    || ['o_warten', 'o_wieder', 'o_kennen', 'o_kennen_satz', 'o_sag', 'o_paare'].includes(liste);
  const AUSRUFE = ['Halo', 'Wah', 'Aduh', 'Maaf', 'Bagus', 'Bagus sekali', 'Hebat', 'Pintar', 'Keren', 'Betul', 'Sempurna',
    'Hore', 'Asyik', 'Ayo', 'Terima kasih', 'Tidak apa-apa', 'Sampai besok', 'Sampai jumpa'];
  // Deutsche Wörter, die wie eine Vokabel aussehen und mit Absicht deutsch dastehen (der falsche Freund)
  const DEUTSCH_GLEICH = ['haus', 'laut'];
  const KLASSEN = ['froh', 'dreht', 'schuettelt', 'jongliert'];
  // Jeder Erfolg braucht eine Bedingung in indo.js: Kommt einer dazu, gehört er auch hierher
  const ERFOLG_IDS = ['indo_erstes', 'indo_runden10', 'indo_25', 'indo_100', 'indo_reif1', 'indo_reif50', 'indo_reifAlle',
    'indo_pelajaran', 'indo_saetze10', 'indo_ohr25', 'indo_schreiben25', 'indo_perfekt', 'indo_zwei', 'indo_drei',
    'indo_partner', 'indo_doppel', 'indo_plauder'];

  function pruefen() {
    const fehler = [];
    const f = s => fehler.push(s);
    const text = e => (typeof e === 'string' ? e : e.t);
    // Beide Fassungen eines Eintrags: Angezeigt wird t, aufgenommen s (segmente nimmt s)
    const fassungen = e => (typeof e === 'string' ? [e] : [...new Set([e.t, e.s])]);
    // {O} wird vor dem Teilen zum Namen; hier ein Zeichen, das in keinem Text vorkommt
    const NAME = '\u0000';
    const ohneName = s => s.replace(/\{O\}/g, NAME);
    const stuecke = s => [...ohneName(s).matchAll(/\{([^{}]*)\}/g)].map(m => m[1]);
    const deutsch = s => ohneName(s).split(/\{[^{}]*\}/).join(' ');
    const woerter = s => s.toLowerCase().match(/[\p{L}-]+/gu) || [];
    const saetze = s => {
      const de = deutsch(s).trim();
      if (!de) return 0;
      return (de.replace(/:\s*$/, '.').match(/[.!?](\s|$)/g) || []).length || 1;
    };
    // Kommt das Wort w als ganzes Wort in s vor (ein Bindestrich trennt, wie in «Orang-Utan»)?
    const steht = (w, s) => new RegExp('(^|[^\\p{L}])' + w + '([^\\p{L}]|$)', 'iu').test(s);
    const ausrufWoerter = new Set(AUSRUFE.flatMap(a => a.toLowerCase().split(' ')).concat('apa'));
    // Die indonesischen Wörter des Kurses: jede Form eines Wort-Eintrags, die ein einzelnes Wort ist.
    // Wörter aus Wendungen zählen nicht: «es» aus «es krim» steht in jedem deutschen Satz.
    const kursWoerter = new Set(V_I.VOKABELN.filter(e => e.art !== 'satz').flatMap(e => e.teile.flatMap(t => t.fr))
      .map(w => w.toLowerCase().replace(/[.,!?]/g, '')).filter(w => !w.includes(' ')));
    const indonesisch = w => (kursWoerter.has(w) && !DEUTSCH_GLEICH.includes(w)) || ausrufWoerter.has(w);
    // Ausgeschrieben steht keiner der beiden Namen: seiner nur als {O}, ihrer gar nicht
    const NAMEN = [T_I.OTTER.name, T_I.OTTER.sprich, T_I.HOERNCHEN.name, T_I.HOERNCHEN.sprich];
    const kleinVorn = a => a[0].toLowerCase() + a.slice(1);

    // Eine Zeile des Otters (wer 'o') oder von Pieks (wer 'p', nur Deutsch) aus der Liste liste
    const zeile = (wo, e, wer, liste) => {
      if (!(typeof e === 'string' ? e : e && typeof e.t === 'string' && e.t && typeof e.s === 'string' && e.s)) {
        f(wo + ': Zeile ohne Text');
        return;
      }
      for (const s of fassungen(e)) {
        if (/\d/.test(s)) f(wo + ': Ziffer in «' + s + '»');
        if (/ß/.test(s)) f(wo + ': ß in «' + s + '»');
        if (/'/.test(s)) f(wo + ': gerader Apostroph in «' + s + '»');
        if (/\s[!?]/.test(s)) f(wo + ': Leerzeichen vor ! oder ? in «' + s + '»');
        if (/\{O\}/.test(s) && !MIT_NAMEN.includes(liste)) f(wo + ': {O} ausserhalb von ' + MIT_NAMEN.join(', '));
        if (/\{H\}/.test(s)) f(wo + ': {H} im Indonesisch');
        if (/[{}]/.test(ohneName(s).replace(/\{[^{}]*\}/g, ''))) f(wo + ': Klammer ohne Gegenstück in «' + s + '»');
        const de = deutsch(s);
        for (const n of NAMEN) if (steht(n, de)) f(wo + ': «' + n + '» ausgeschrieben in «' + s + '»');
        for (const w of woerter(de)) if (indonesisch(w)) f(wo + ': indonesisches Wort «' + w + '» im Deutschen: «' + s + '»');
        if (/hallo|\bhai\b/i.test(de)) f(wo + ': Hallo oder Hai im Deutschen: «' + s + '»');
        if (wer === 'p') {
          if (stuecke(s).length) f(wo + ': Klammer bei Pieks: «' + s + '»');
          continue;
        }
        if (stuecke(s).length && vorDerAntwort(liste)) f(wo + ': Klammer in einer Liste vor der Antwort: «' + s + '»');
        for (const k of stuecke(s)) {
          if (k.includes(NAME)) f(wo + ': {O} in einer indonesischen Stelle: «' + s + '»');
          // Ausrufe und Nea, durch Kommas getrennt, gross nur vorn und bei Nea, das Zeichen am Schluss
          k.replace(/[!?.]$/, '').split(/,\s*/).forEach((teil, i) => {
            if (teil !== 'Nea' && !AUSRUFE.some(a => (i ? kleinVorn(a) : a) === teil)) {
              f(wo + ': «' + teil + '» steht nicht in der Liste der Ausrufe: {' + k + '}');
            }
          });
        }
      }
      if (wer === 'p') return;
      const t = text(e);
      if (/falsch/i.test(t)) f(wo + ': «falsch» in «' + t + '»');
      if (/daneben/i.test(t)) f(wo + ': «daneben» in «' + t + '»');
      if (/\bfast\b/i.test(t) && !MIT_FAST.includes(liste)) f(wo + ': «Fast» ausserhalb der Tipps: «' + t + '»');
      if (/Apostroph|Akzent|Artikel|Heft|Schwanz|Erdbeer|Ast\b|Äste/.test(t)) f(wo + ': Wort aus ihrem Kurs: «' + t + '»');
      const vorspann = VORSPANN.includes(liste);
      if (vorspann && !/:\s*$/.test(t)) f(wo + ': Vorspann ohne Doppelpunkt am Schluss: «' + t + '»');
      if (!vorspann && /:\s*$/.test(t)) f(wo + ': Doppelpunkt am Schluss, aber kein Vorspann: «' + t + '»');
      if (saetze(t) > 2 && liste !== 'o_vorstellen') f(wo + ': ' + saetze(t) + ' Sätze: «' + t + '»');
    };

    // Seine Listen: genau die, die der Kurs ruft, mit ihrer Zeilenzahl
    for (const [liste, n] of Object.entries(LISTEN)) {
      const pool = OTEXTE[liste];
      if (!Array.isArray(pool)) f('OTEXTE.' + liste + ' fehlt');
      else if (pool.length !== n && !(liste === 'o_name_witz' && !pool.length)) f('OTEXTE.' + liste + ': ' + pool.length + ' Zeilen statt ' + n);
    }
    for (const [liste, pool] of Object.entries(OTEXTE)) {
      if (!(liste in LISTEN)) f('OTEXTE.' + liste + ' ruft der Kurs nicht');
      if (Array.isArray(pool)) pool.forEach((e, i) => zeile('OTEXTE.' + liste + '[' + i + ']', e, 'o', liste));
    }
    for (const [liste, [, n]] of Object.entries(PIEKS_LISTEN)) {
      if (!Array.isArray(PTEXTE[liste])) f('PTEXTE.' + liste + ' fehlt');
      else if (PTEXTE[liste].length !== n) f('PTEXTE.' + liste + ': ' + PTEXTE[liste].length + ' Zeilen statt ' + n);
    }
    for (const [liste, pool] of Object.entries(PTEXTE)) {
      if (!(liste in PIEKS_LISTEN)) f('PTEXTE.' + liste + ' ruft der Kurs nicht');
      if (Array.isArray(pool)) pool.forEach((e, i) => zeile('PTEXTE.' + liste + '[' + i + ']', e, 'p', liste));
    }
    for (const liste of LEBHAFT) if (!OTEXTE[liste]) f('LEBHAFT nennt die unbekannte Liste ' + liste);

    // Merkhilfen und Wortmomente gehören zu Einträgen, die es gibt
    const EINTRAG = new Map(V_I.VOKABELN.map(e => [e.id, e]));
    for (const [id, m] of Object.entries(MERKHILFEN)) {
      const wo = 'MERKHILFEN «' + id + '»';
      const e = EINTRAG.get(id);
      if (!e) f(wo + ': kein Eintrag in VOK_INDO');
      if (typeof m !== 'string' || !m) {
        f(wo + ': ohne Text');
        continue;
      }
      if (/[{}]/.test(m)) f(wo + ': Klammer (die Karte zeigt den Text, wie er ist)');
      if (/\d|ß|'/.test(m)) f(wo + ': Ziffer, ß oder gerader Apostroph');
      if (/\s[!?]/.test(m)) f(wo + ': Leerzeichen vor ! oder ?');
      if (/:\s*$/.test(m)) f(wo + ': endet auf einen Doppelpunkt wie ein Vorspann');
      if (saetze(m) > 2) f(wo + ': ' + saetze(m) + ' Sätze');
      if (/hallo|\bhai\b/i.test(m)) f(wo + ': Hallo oder Hai');
      for (const n of NAMEN) if (steht(n, m)) f(wo + ': «' + n + '» ausgeschrieben');
      // Das eigene Wort nie, auch kein Teil davon: Gleich davor kommt seine Aufnahme
      const eigen = e ? new Set(e.teile.flatMap(t => t.fr).flatMap(w => woerter(w.replace(/[.,!?]/g, '')))) : new Set();
      for (const w of eigen) if (!DEUTSCH_GLEICH.includes(w) && steht(w, m)) f(wo + ': nennt das eigene Wort «' + w + '»');
      for (const w of woerter(m)) if (!eigen.has(w) && indonesisch(w)) f(wo + ': indonesisches Wort «' + w + '»');
    }
    for (const [id, m] of Object.entries(WORTMOMENTE)) {
      const wo = 'WORTMOMENTE «' + id + '»';
      if (!EINTRAG.has(id)) f(wo + ': kein Eintrag in VOK_INDO');
      if (!m || !['o', 'p'].includes(m.wer)) {
        f(wo + ': wer ist weder o noch p');
        continue;
      }
      if (m.wer === 'p' && m.klasse) f(wo + ': Pieks hat keine Bewegung');
      if (m.klasse && !KLASSEN.includes(m.klasse)) f(wo + ': unbekannte Klasse «' + m.klasse + '»');
      zeile(wo, m.t, m.wer, 'WORTMOMENTE');
    }

    // Die Erfolge in texte.js: alle da, Namen neu und deutsch (Pieks liest sie), ohne Ziffer und ß
    const erfolgIds = Object.keys(ERFOLGE_INDO);
    if (erfolgIds.join() !== ERFOLG_IDS.join()) f('Erfolge in texte.js: ' + erfolgIds.join(', ') + ' statt ' + ERFOLG_IDS.join(', '));
    const erfolgsNamen = new Set(Object.entries(T_I.ERFOLGE).filter(([id]) => !id.startsWith('indo_')).map(([, e]) => e.name));
    for (const [id, e] of Object.entries(ERFOLGE_INDO)) {
      const wo = 'ERFOLGE.' + id;
      if (!e || typeof e.name !== 'string' || !e.name || typeof e.text !== 'string' || !e.text || typeof e.bonus !== 'number') {
        f(wo + ': name, text oder bonus fehlt');
        continue;
      }
      if (erfolgsNamen.has(e.name)) f(wo + ': den Namen «' + e.name + '» gibt es schon');
      erfolgsNamen.add(e.name);
      if (/\d|ß/.test(e.name)) f(wo + ': Ziffer oder ß im Namen');
      if (/ß/.test(e.text)) f(wo + ': ß im Text');
      for (const w of woerter(e.name)) if (indonesisch(w) || w === 'pelajaran') f(wo + ': indonesisches Wort im Namen: «' + w + '»');
    }

    // Die Aufnahmen: jede in einer Stimme des Otters oder von Pieks, in ihrer Gruppe, mit ihrem Tempo,
    // ohne übrige Klammer, und nie zwei Texte auf derselben Datei
    const L = T_I.LEHRER.o;
    const GRUPPE = { [L.de]: ['otter'], [L.fremd]: ['otter'], [L.wort]: ['iwort', 'iform'], [L.langsam]: ['ilangsam'], p: ['pieks'] };
    const TEMPO = { [L.wort]: 0.85, [L.langsam]: 0.7 };
    const dateien = new Map();
    for (const c of alleIndoClips()) {
      const wo = 'Aufnahme ' + c.v + ' «' + c.s + '»';
      if (!/\p{L}/u.test(c.s)) f(wo + ': ohne Buchstaben');
      if (/[{}]/.test(c.s)) f(wo + ': Klammer übrig');
      if (!['o', 'p'].includes(T_I.stimmeVon(c))) f(wo + ': keine Stimme des Otters oder von Pieks');
      if (!(GRUPPE[c.v] || []).includes(c.gruppe)) f(wo + ': in der Gruppe ' + c.gruppe);
      if (c.tempo !== (TEMPO[c.v] || 1)) f(wo + ': Tempo ' + c.tempo);
      // Der gedachte Satz davor legt die Sprache fest; nur Pieks braucht keinen
      if (c.v !== 'p' && !c.vorher) f(wo + ': ohne Zusammenhang davor');
      const datei = T_I.clipDatei(c), wie = c.v + ' ' + c.s.normalize('NFC');
      if (dateien.has(datei) && dateien.get(datei) !== wie) {
        f('zwei Aufnahmen, eine Datei ' + datei + ': «' + dateien.get(datei) + '» und «' + wie + '»');
      }
      dateien.set(datei, wie);
    }

    // Gegen ihre Listen (nur in Node, siehe oben): Kommt bei ihr eine Liste dazu, ruft der gemeinsame
    // Kurs sie auch beim Otter, oder sie gehört zu OHNE_GEGENSTUECK
    let F_I = null;
    if (N_I) {
      try {
        F_I = require('./franz-texte.js');
      } catch (err) {
        if (err.code !== 'MODULE_NOT_FOUND') throw err;
      }
    }
    if (F_I) {
      for (const [liste, pool] of Object.entries(F_I.HTEXTE)) {
        if (OHNE_GEGENSTUECK.includes(liste)) continue;
        const o = 'o_' + liste.slice(2);
        if (!(o in LISTEN)) f('Zu ' + liste + ' fehlt ' + o);
        else if (pool.length !== LISTEN[o]) f(o + ': ' + LISTEN[o] + ' Zeilen, bei ihr ' + pool.length);
      }
      for (const o of Object.keys(LISTEN)) if (!NUR_OTTER.includes(o) && !F_I.HTEXTE['h_' + o.slice(2)]) f(o + ' hat bei ihr kein Gegenstück');
      for (const [liste, [p, n]] of Object.entries(PIEKS_LISTEN)) {
        if (!F_I.PTEXTE[p] || F_I.PTEXTE[p].length !== n) f(liste + ': ' + p + ' hat bei ihr nicht ' + n + ' Zeilen');
      }
      if (F_I.H_LEBHAFT.map(n => 'o_' + n.slice(2)).join() !== LEBHAFT.join()) f('LEBHAFT ist nicht wie H_LEBHAFT bei ihr');
    }
    return fehler;
  }

  return { OTEXTE, PTEXTE, MERKHILFEN, WORTMOMENTE, LEBHAFT, ERFOLGE: ERFOLGE_INDO, alleIndoClips, pruefen };
})();

if (typeof module !== 'undefined') module.exports = INDO_TEXTE;
