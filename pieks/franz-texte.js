'use strict';

/* =====================================================================
   FRANZÖSISCH-TEXTE
   Alles, was das Hörnchen sagt (HTEXTE, ihre Stimme), und was Pieks im
   Französisch dazu sagt (PTEXTE, seine Stimme). Vertont wird wie in
   texte.js mit make-audio.mjs; welche Aufnahmen es braucht, zählt
   alleFranzClips() am Ende dieser Datei auf.

   Ein Eintrag ist ein Text oder { t: 'angezeigt', s: 'gesprochen' }.
   Für ihre Zeilen gilt ausserdem:

   - Eine Aufnahme, eine Sprache. Die Stimme entscheidet sich pro Text
     für eine Sprache, darum stehen französische Stellen in {…} und
     werden einzeln aufgenommen: '{Bravo !} Das war genau richtig.'
     In den Klammern stehen nur diese Ausrufe: Salut, Bravo, Super,
     Voilà, Oh là là, Très bien, Allez, Pardon, Merci, Parfait,
     À demain, À bientôt, dazu «Nea», «Pieks», Kommas und das
     Satzzeichen am Schluss, französisch geschrieben mit Leerzeichen
     vor ! und ?. Im deutschen Teil kommt keines dieser Wörter vor,
     sonst gäbe es «Bravo» in zwei Aussprachen.
   - Vokabeln stehen nie in einer Zeile: Sie kommen als eigene
     Aufnahme dazu. Eine Zeile, die auf einen Doppelpunkt endet, ist
     ein Vorspann und wird nur zusammen mit ihrer Vokabel gesprochen.
   - Ihr Name steht nur als {H} da (HOERNCHEN in texte.js) und nur in
     h_vorstellen, h_vorstellen_kurz, h_name_witz und p_besuch.
   - Ehrlich bleiben: Jede Zeile einer Liste muss nach jeder Aufgabe
     stimmen, zu der die Liste gehört. Also keine Zahl, kein «dieses
     Wort» bei Listen, die auch für Sätze gelten, kein «alle Akzente».
     Sie hört Nea nicht und tut auch nicht so.
   - Sie schimpft nie und sagt nie «falsch». «Fast!» sagt sie nur in
     h_tipp_akzent, h_tipp_ligatur, h_tipp_zeichen und
     h_tipp_buchstabe, wo das Urteil beweist, dass es knapp war.
   - Keine Ziffern (ausser in h_unite_*), höchstens zwei kurze Sätze,
     Schweizer Schreibweise: ss statt ß.

   Pieks spricht nur Deutsch: in PTEXTE keine Klammern und kein
   französisches Wort.

   Die ersten beiden Zeilen jeder Liste stammen wörtlich aus dem
   Bauplan (Ausnahmen: h_lichtung und h_tipp_akzent_zeichen, siehe
   dort), und die Anzahl Zeilen je Liste ist festgelegt.
   ===================================================================== */

// In Node kommen die Nachbardateien über require herein, im Browser sind es Globale
const N_F = typeof module !== 'undefined' && typeof require === 'function';
const T_F = N_F ? require('./texte.js') : { sprechtext, anzeigetext, segmente, clipDatei, HOERNCHEN };
const V_F = N_F ? require('./vokabeln.js') : { VOKABELN, vokabelClip, langsamGibt };

const HTEXTE = {
  /* ---------- Erstes Treffen (feste Reihenfolge) ---------- */
  h_vorstellen: [
    '{Oh là là, pardon, Pieks !} Das war mein Schwanz. {Salut, Nea !} Ich bin {H}. Ich komme aus Frankreich.',
    'Ich sammle Wörter. Französische Wörter! Jedes Wort, das du lernst, schreibe ich in mein Heft. Sammelst du mit? Dann tippe auf meine Karte!',
  ],
  // Wenn Nea das erste Treffen weggetippt hat: beim ersten Start, ohne Apfel
  h_vorstellen_kurz: ['{Salut, Nea !} Ich bin {H}, die Freundin von Pieks. Ich komme aus Frankreich und sammle Wörter.'],
  // Die einzige Zeile, die am Namen hängt: bei einem anderen Namen leeren oder neu schreiben
  h_name_witz: ['{H}, wie die Drehung. Schau!'],

  /* ---------- Lichtung ---------- */
  // Nach Pieks' Begrüssung, wenn nichts fällig ist: also nichts versprechen, was dann nicht da ist
  h_gruss: [
    '{Salut, Nea !} Schön, dass du da bist.',
    '{Salut, Nea !} Mein Heft und ich sind bereit.',
    '{Salut, Nea !} Ich bin schon lange wach. Nicht wie ein gewisser Igel!',
    '{Salut, Nea !} Ich bin extra vom Baum heruntergeklettert.',
    'Nea ist da! Da wedelt mein Schwanz ganz von allein.',
    '{Salut !} Pieks hat die Zahlen, ich habe die Wörter. Such dir etwas aus!',
    'Ich habe dich schon kommen sehen. {Salut, Nea !}',
    '{Salut, Nea !} Riechst du das auch? Irgendwo gibt es Erdbeeren.',
  ],
  h_gruss_faellig: [
    '{Salut, Nea !} Ein paar Wörter warten schon auf dich.',
    '{Salut, Nea !} Deine Wörter wollen wachsen. Kommst du?',
    'Gut, dass du kommst! In meinem Heft zappelt es schon.',
    '{Salut, Nea !} Heute haben wir zwei etwas vor.',
    '{Salut, Nea !} Im Erdbeerbeet gibt es heute etwas zu giessen.',
  ],
  // Zurück vom Französisch, auch mitten aus einer Runde, von der leeren Karte oder gleich nach
  // einer zähen Runde. Darum sagt die erste Zeile nicht wie im Bauplan «Das war eine schöne
  // Runde»: Das stimmt nicht immer und käme gleich nach h_ende fast wörtlich noch einmal.
  h_lichtung: [
    '{Merci, Nea !} Das war schön mit dir.',
    'Ich sortiere inzwischen mein Wörterheft. {À bientôt !}',
    'Pause! Ich schaue mal, ob irgendwo ein Apfel herumliegt.',
    'Mein Heft bleibt für dich offen. {À bientôt, Nea !}',
    'Ich stelle mich wieder neben Pieks. Aber nicht zu nah, er piekst.',
  ],
  h_kitzeln: [
    'Hihi! Nicht am Schwanz!',
    '{Oh là là !} Das kitzelt!',
    'Huch! Ich bin kitzliger als Pieks.',
    'Hihi, das kribbelt bis in die Schwanzspitze!',
    'Vorsicht, sonst hüpfe ich auf den nächsten Ast!',
    'Noch ein paar Mal, und ich drehe mich im Kreis!',
    'He, das sind meine Ohrpinsel!',
    'Kitzeln gilt nicht! Na gut, ein bisschen.',
  ],
  // Vorspann zum Wort des Tages
  h_wort_vor: [
    'Mein Wort des Tages:',
    'Hör mal, das mag ich:',
    'Das geht mir heute nicht aus dem Kopf:',
  ],

  /* ---------- Erster Start: die Unité ---------- */
  h_unite_frage: ['Bei welcher Unité seid ihr gerade in der Schule?'],
  h_unite_u1: ['Unité 1: die Schule und die Wochentage. {Très bien !}'],
  h_unite_u2: ['Unité 2: die Familie. {Très bien !} Meine füllt einen ganzen Baum.'],
  h_unite_u3: ['Unité 3: Hobbys und Freizeit. {Super !} Tanzen ist auch dabei!'],
  h_unite_u4: ['Unité 4: Essen und Gesichter. {Oh là là !} Da sind Erdbeeren dabei!'],
  h_keine_auswahl: [
    'Such dir zuerst ein Lernziel aus. Dann legen wir los.',
    'Was wollen wir üben? Wähle ein Lernziel.',
  ],

  /* ---------- Eine Runde beginnt (Zahlen nennt sie nie) ---------- */
  h_start_neu: [
    'Ich habe neue Wörter für dich. {Allez !}',
    'Heute zeige ich dir etwas Neues. Bist du bereit?',
    'Mein Heft hat heute frische Seiten für dich.',
    'Neue Wörter! Ich bin schon ganz zappelig.',
    'Rate mal, was ich dir heute mitgebracht habe!',
  ],
  h_start_wdh: [
    'Heute schauen wir, was noch sitzt. {Allez !}',
    'Ein paar alte Bekannte warten. Los geht’s!',
    'Wiederholen macht die Erdbeeren rot. Fangen wir an!',
    'Diese Wörter kennst du schon. Mal sehen, ob sie dich auch noch kennen!',
    'Ich blättere in meinem Heft ein paar Seiten zurück. {Allez, Nea !}',
  ],
  // Über die Reihenfolge sagt sie nichts: Altes und Neues kommen gemischt
  h_start_gemischt: [
    'Ein paar neue Wörter und ein paar alte Bekannte. {Allez !}',
    'Heute gibt es von allem etwas. Los geht’s!',
    'Altes und Neues bunt gemischt. So mag ich es am liebsten!',
    'Heute giessen wir das Beet und pflanzen etwas Neues dazu.',
    'Heute hüpfen wir zwischen alten und neuen Wörtern hin und her.',
  ],
  h_start_frei: [
    'Frei üben! Hier kann nichts schiefgehen.',
    'Wir üben einfach so. Ganz ohne Druck.',
    'Eine Runde nur zum Üben. Dabei geht keine Erdbeere verloren.',
  ],

  /* ---------- Kennenlernen und Nachsprechen ---------- */
  // Vorspann vor einem Wort; auch wenn es nach einem verpassten Check noch einmal gezeigt wird, also nie «neu»
  h_kennen: [
    'Schau mal, dieses Wort:',
    'Schau dir das genau an:',
    'Das habe ich für dich gesammelt:',
    'Augen auf, Ohren auf:',
    'Ein Schatz aus meinem Heft:',
    'Das möchte ich dir zeigen:',
  ],
  // Nichts über die Länge: «C’est quoi?» ist kürzer als manches Wort
  h_kennen_satz: [
    'Jetzt ein ganzer Satz. Hör zu:',
    'Ein Satz für mein Heft:',
    'Diesen Satz habe ich in Frankreich aufgeschnappt:',
    'Aus Wörtern wird ein Satz. So klingt er:',
  ],
  h_sag: [
    'Sag es mit mir:',
    'Jetzt sprechen wir zusammen:',
    'Sprich mir nach:',
    'Zuerst ich, dann du:',
  ],
  h_jetzt_du: [
    'Jetzt du!',
    'Und jetzt du, schön laut!',
    'Du bist dran. Trau dich!',
  ],
  // Nach «Gesagt!»: Sie hat Nea nicht gehört, also lobt sie das Sagen und nicht den Klang
  h_gesagt: [
    '{Bravo !} Laut sagen hilft beim Merken.',
    '{Merci !} So bleibt es besser im Kopf.',
    'Laut gesagt ist halb gemerkt.',
    'Jetzt kennt es auch dein Mund. {Très bien !}',
  ],
  // Der deutsche und der französische Artikel haben nicht dasselbe Geschlecht
  h_kontrast: [
    'Aufgepasst: Auf Französisch ist der Artikel anders als auf Deutsch.',
    'Achtung, hier tauschen Deutsch und Französisch die Rollen.',
    'Hier überrascht der Artikel. Lern ihn am besten gleich mit dem Wort.',
  ],

  /* ---------- Erklärung, wenn eine Übung zum ersten Mal kommt ---------- */
  h_erklaer_bedeutung: ['Was bedeutet das auf Deutsch? Tippe die passende Antwort an.'],
  h_erklaer_hoeren: ['Hör gut zu und tippe an, was es bedeutet. Der runde Knopf spielt es nochmal.'],
  h_erklaer_finden: ['Hier steht es auf Deutsch. Tippe an, wie es auf Französisch heisst.'],
  h_erklaer_lauschen: ['Hör genau hin und tippe an, wie man das schreibt.'],
  h_erklaer_artikel: ['Männlich oder weiblich? Tippe auf die richtige Seite.'],
  h_erklaer_akzent: ['In den Lücken fehlen Buchstaben. Wähle für jede den richtigen aus, mit oder ohne Akzent.'],
  h_erklaer_legen: ['Tippe die Buchstaben in der richtigen Reihenfolge an.'],
  h_erklaer_schreiben: ['Jetzt schreibst du selbst. Die Buchstaben mit Akzent findest du in der obersten Reihe.'],
  h_erklaer_luecke: ['Im Satz fehlt ein Wort. Tippe an, welches in die Lücke gehört.'],
  h_erklaer_ordnen: ['Bring die Wörter in die richtige Reihenfolge. Tippe sie nacheinander an.'],
  h_erklaer_bauen: ['Bau den Satz aus den Kacheln. Achtung: Ein paar Wörter gehören nicht dazu.'],
  h_erklaer_echo: [
    { t: 'Ich sage es vor, und du sprichst es laut nach. Danach tippst du auf «Gesagt!».',
      s: 'Ich sage es vor, und du sprichst es laut nach. Danach tippst du auf Gesagt.' },
  ],
  h_erklaer_paare: ['Links Französisch, rechts Deutsch. Tippe immer zwei an, die zusammengehören.'],

  /* ---------- Richtig ---------- */
  // Kurzes Lob vor dem Wort, nach jeder Art Aufgabe: nichts über Schreiben, Hören oder «dieses Wort»
  h_richtig: [
    '{Bravo !}',
    'Genau so!',
    '{Super !}',
    'Richtig!',
    '{Très bien !}',
    'Du hast es gewusst!',
    'Zauberhaft!',
    '{Parfait !}',
    'Auf Anhieb richtig!',
    'Geknackt!',
    '{Bravo, Nea !}',
    'Haargenau!',
    'Ja, das stimmt!',
    'Herrlich!',
    '{Voilà !}',
    'Ein Sternchen in mein Heft!',
    'Ganz genau, Nea!',
    'Eichhörnchenstark!',
    '{Super, Nea !}',
    'Dafür mache ich einen Luftsprung!',
    'Ja, ja, ja!',
    '{Bravo !} Das war genau richtig.',
    'Das hast du im Kopf!',
    'Du sammelst wie ein Profi!',
  ],
  // Richtig bei der Wiederholung oder im zweiten Versuch
  h_richtig_nachfehler: [
    '{Voilà !} Jetzt sitzt es!',
    'Siehst du? Beim zweiten Mal klappt es.',
    'Jetzt hast du es!',
    'Neuer Anlauf, sauber gelandet!',
    'Jetzt stimmt alles. {Très bien !}',
    'Das merkst du dir jetzt doppelt gut.',
  ],
  // Nichts über Artikel oder Akzente: Das Wort hat vielleicht keine
  h_richtig_schreiben: [
    'Jeder Buchstabe am richtigen Platz!',
    'Ganz allein geschrieben. {Très bien !}',
    'Fehlerfrei geschrieben! Das kommt in mein Heft.',
    'Vom Kopf direkt in die Tasten. {Bravo !}',
    'Das hätte ich nicht besser schreiben können!',
    'Ohne Hilfe, ohne Fehler. Ich bin stolz auf dich!',
  ],
  h_richtig_satz: [
    'Ein ganzer Satz, und alles stimmt!',
    '{Bravo !} So spricht man in Frankreich.',
    'So ein Satz baut sich nicht von allein. {Bravo, Nea !}',
    'Wort für Wort richtig. {Très bien !}',
    'Ein Satz wie aus meinem Heft!',
  ],
  // Vorspann: Eine andere Form wurde geschrieben, gefragt war die erste
  h_auch: [
    'Auch richtig! Im Buch steht zuerst:',
    'Das stimmt auch. Die erste Form im Buch heisst:',
    'Richtig, so kann man es auch sagen. Im Buch kommt zuerst:',
  ],
  // Die Form unter «anders als» wurde geschrieben: zählt nicht als Versuch
  h_andere_form: [
    'Stimmt, so heisst es auch. Und die andere Form?',
    'Das ist die Form von oben. Ich suche die andere.',
    'Das steht schon oben. Wie kann man es noch sagen?',
  ],

  /* ---------- Die Karte wächst ---------- */
  // Stufe 1, 2 oder 4: also weder «Blüte» noch «rot». Und nicht «Stufe»: So heisst bei Pieks die Schwierigkeit
  h_hoch: [
    'Das wächst!',
    'Wieder ein Stück reifer.',
    'Im Beet tut sich was!',
    'Schau, das Pflänzchen macht sich!',
    'Mir wird ganz schwindlig vor Freude!',
  ],
  h_frucht: [
    'Schau, eine kleine Erdbeere!',
    'Aus der Blüte wird eine Erdbeere. {Très bien !}',
    'Noch grün, aber schon eine richtige Erdbeere!',
    'Oh, da hängt ja eine Erdbeere! Die lasse ich reifen, versprochen.',
  ],
  h_reif: [
    'Reif! Das gehört jetzt dir.',
    'Eine reife Erdbeere für mein Körbchen. {Bravo, Nea !}',
    'Rot und reif! Die pflücken wir.',
    'So eine schöne rote Erdbeere! Am liebsten würde ich hineinbeissen.',
    'Ganz reif! Das vergisst du nicht mehr so schnell.',
  ],

  /* ---------- Noch nicht richtig ---------- */
  // Vorspann nach finden, luecke, artikel, akzent; danach kommt das Wort oder der ganze Satz
  h_es_heisst: [
    'Noch nicht. Es heisst:',
    'Noch nicht ganz. Richtig ist:',
    'Halb so wild. So ist es richtig:',
    'Hör zu, so heisst es:',
    'Das üben wir noch. Richtig heisst es:',
    'Diesmal noch nicht. Ich sage es dir:',
  ],
  // Vorspann nach bedeutung und hoeren
  h_bedeutet: [
    'Schau auf die grüne Antwort. So klingt es:',
    'Das merken wir uns. Hör es dir nochmal an:',
    'Die richtige Antwort ist jetzt grün. Hör zu:',
    'Jetzt weisst du es. Und so hört es sich an:',
  ],
  // Steht für sich: wenn die Aufnahme des Worts fehlt
  h_ohne_clip: [
    'Noch nicht. Schau dir die Lösung auf der Karte an.',
    'Noch nicht ganz. Die Lösung steht jetzt auf der Karte.',
    'Macht nichts. Auf der Karte siehst du jetzt, wie es richtig ist.',
    'Jetzt kennst du die Antwort: Sie steht auf der Karte.',
  ],
  // Vorspann nach lauschen
  h_falsch_hoeren: [
    'Hör noch einmal genau hin:',
    'Hör es dir noch einmal an:',
    'Spitz die Ohren, ich sage es nochmal:',
    'Das war knifflig. Hier kommt es noch einmal:',
  ],

  /* ---------- Tipps nach dem ersten Versuch ----------
     Beim Schreiben nennt sie zuerst den Artikel und hängt, wenn auch das Wort
     nicht stimmt, den Tipp zum Wort an. Jede Zeile muss darum allein und im
     Doppel stimmen: kein «sonst ist alles richtig», kein «nur». */
  // Akzent fehlt, ist zu viel oder der verkehrte; auch ç und œ
  h_tipp_akzent: [
    'Fast! Schau dir die Akzente noch einmal an.',
    'Die Buchstaben stimmen. Schau noch einmal auf die Akzente.',
    'Ganz nah dran! Bei den Akzenten stimmt noch etwas nicht.',
    'Fast! In meinem Heft stehen die Akzente ein wenig anders.',
  ],
  h_tipp_ligatur: [
    'Fast! Hier kleben o und e zusammen. Die Taste findest du oben.',
    'Aus o und e wird hier ein einziger Buchstabe.',
  ],
  h_tipp_artikel_fehlt: [
    'Da fehlt vorne noch etwas Kleines: der Artikel.',
    'Vorne fehlt noch der Artikel.',
    'In mein Heft kommt es nur mit Artikel. Setz ihn noch davor.',
    'Das Wort möchte nicht allein stehen. Vorne fehlt sein Artikel.',
  ],
  // Auch beim Legen, und dort ist die verkehrte Artikel-Kachel schon zurückgeflogen: also kein «tausch ihn aus»
  h_tipp_genus: [
    'Schau auf den Artikel: männlich oder weiblich?',
    'Der Artikel passt noch nicht. Probier den anderen.',
    'Beim Artikel ist es genau andersherum.',
    'Dieses Wort möchte den anderen Artikel.',
  ],
  // Nichts von «vor einem Vokal»: «l’histoire» beginnt mit h
  h_tipp_elision: [
    'Hier schrumpft der Artikel: nur ein l und ein Apostroph.',
    'Der Artikel verliert hier seinen Vokal. Dafür kommt ein Apostroph.',
    'Der Artikel rückt hier ganz nah ans Wort. Schreib ihn als l mit Apostroph.',
  ],
  h_tipp_artikel_ganz: [
    'Vor diesem h bleibt der Artikel ganz.',
    'Hier kommt kein Apostroph. Der Artikel bleibt, wie er ist.',
  ],
  h_tipp_zeichen: [
    'Die Buchstaben stimmen. Schau auf Abstand, Apostroph und Bindestrich.',
    'Fast! Zwischen den Buchstaben stimmt ein kleines Zeichen noch nicht.',
    'Alle Buchstaben sind da. Schau genau, was zwischen ihnen steht oder fehlt.',
  ],
  // Nicht im Bauplan: Akzente und Zeichen zugleich, wenn der Artikel-Hinweis schon davor steht.
  // Eine kurze Zeile statt zwei: Drei Zeilen füllten auf dem Handy die ganze Blase.
  h_tipp_akzent_zeichen: [
    'Schau auch auf die Akzente und die kleinen Zeichen.',
    'Auch bei Akzenten und Zeichen stimmt noch etwas nicht.',
  ],
  // Genau eine Stelle: ein Buchstabe fehlt, ist zu viel, der verkehrte oder vertauscht
  h_tipp_buchstabe: [
    'Nur ein Buchstabe stimmt noch nicht. Ich zeige dir, wo.',
    'Ganz knapp! Schau auf die markierte Stelle.',
    'Fast! Bei den Buchstaben hakt es nur an einer Stelle.',
    'So nah dran! Ein Buchstabe tanzt noch aus der Reihe.',
  ],
  // Buchstaben oder Wörter, eine Kachel oder viele, vielleicht stimmt noch gar nichts
  h_tipp_legen: [
    'Noch nicht ganz. Was stimmt, bleibt liegen. Probier den Rest noch einmal.',
    'Noch nicht. Die leeren Plätze brauchen andere Kacheln.',
    'Was nicht passt, ist zurückgehüpft. Schau, was in die Lücken gehört.',
    'Noch nicht. Geh es Kachel für Kachel durch, ganz in Ruhe.',
  ],
  h_tipp_verwechselt: [
    'Das ist auch ein Wort aus meinem Heft, aber ein anderes.',
    'Dieses Wort gibt es. Es bedeutet aber etwas anderes.',
    'Das wohnt auf einer anderen Seite in meinem Heft. Schau, was es bedeutet.',
  ],
  h_tipp_andere_form: [
    'Das gibt es auch. Aber hör noch einmal hin: Ich habe es anders gesagt.',
    'Auch richtig geschrieben. Schreib aber genau das, was du hörst.',
  ],
  h_tipp_reihenfolge: [
    'Die Wörter stimmen, die Reihenfolge noch nicht.',
    'Alle Wörter sind da. Schieb sie noch einmal zurecht.',
    'Richtige Wörter, aber noch durcheinander. Was hüpft wohin?',
    'Die Wörter haben die Plätze getauscht. Bring sie wieder in die Reihe.',
  ],
  // Weit daneben oder nur der Artikel ganz anders: also nichts darüber, wie weit es war
  h_tipp_anders: [
    'Noch nicht. Ich zeige dir den ersten Buchstaben.',
    'Ich helfe dir: So fängt es an, und so lang ist es.',
    'Ich lege dir eine Spur: den ersten Buchstaben und die Länge.',
    'Hier kommt eine kleine Hilfe. Zähl die Plätze und schau auf den Anfang.',
  ],

  /* ---------- Lösung, Nachbauen, zweite Chance ---------- */
  // Nach zwei Fehlversuchen oder nach «Weiss ich nicht», beim Legen wie beim Schreiben
  h_loesung: [
    'Ich zeige es dir. Mach es einmal nach, dann merkst du es dir.',
    'Kein Problem! Schau es dir an und mach es einmal nach.',
    'Das musste ich auch erst lernen. Schau hin und mach es einmal nach.',
    'Hier ist die Lösung. Einmal nachmachen, und sie bleibt besser hängen.',
    'Dafür bin ich da! Ich mache es vor, du machst es nach.',
  ],
  // Vorspann nach dem Nachbauen
  h_nachgebaut: [
    '{Voilà !} So ist es richtig:',
    'Jetzt steht es richtig da:',
    'Gut nachgemacht! Und so klingt es:',
    'Jetzt hast du es einmal selbst gemacht. Hör zu:',
  ],
  h_wieder: [
    'Das hatten wir vorhin. Jetzt klappt es bestimmt.',
    'Zweite Chance!',
    'Schau, wer wieder da ist!',
    'Das hier wollte nochmal zu dir. Ganz in Ruhe.',
  ],
  // Eine Minute ohne Tipp. Kein Wort über Knöpfe: Nicht jede Aufgabe hat dieselben
  h_warten: [
    'Lass dir Zeit. Ich warte gern.',
    'Wenn du es nicht weisst, rate ruhig. Aus Fehlern lernt man.',
    'Ich putze solange meinen Schwanz. Kein Grund zur Eile.',
    'Denk in Ruhe nach. Mein Heft läuft nicht weg.',
    'Bist du noch da? Ich bleibe hier sitzen, bis du so weit bist.',
  ],

  /* ---------- Finale und Ende der Runde ---------- */
  h_paare: [
    'Zum Schluss: Finde die Paare!',
    'Und jetzt das Finale. Was gehört zusammen?',
    'Ein Spiel zum Abschluss! Jedes Wort sucht seinen Partner.',
  ],
  h_paare_fertig: [
    'Alle Paare gefunden!',
    '{Voilà !} Alles passt zusammen.',
    'Jedes Wort hat seinen Partner gefunden!',
  ],
  // Auch nach dem freien Üben, auch nach der allerersten Runde (kein «wieder») und auch, wenn nichts
  // gewachsen ist. Ins Körbchen kommen nur reife Erdbeeren, keine Runden.
  h_ende: [
    'Geschafft! Morgen wachsen deine Wörter weiter. {À demain !}',
    'Eine schöne Runde. {Merci, Nea !}',
    'Runde geschafft! Jetzt strecke ich alle viere von mir.',
    'Fertig! Jetzt haben wir uns beide einen Apfel verdient.',
    'Du hast fleissig gesammelt. Jetzt dürfen die Wörter in Ruhe wachsen.',
    '{Bravo, Nea !} Das hätten wir!',
  ],
  // Kein «falsch» in der Runde; ein zweiter Versuch oder ein Fehlgriff bei den Paaren darf dabei
  // gewesen sein. Die eigenen Zeilen behaupten darum nicht noch einmal «nichts ging daneben».
  h_ende_perfekt: [
    'Ohne einen einzigen Fehler! {Oh là là, Nea !}',
    'Kein einziger Fehler. {Bravo, Nea !}',
    'So eine Runde ist wie eine Erdbeere ohne Fleck. Herrlich!',
    'Das gelingt nicht jeden Tag. Ich bin ganz aus dem Häuschen!',
  ],
  h_ende_muehsam: [
    'Heute war es zäh. Das gehört dazu. Morgen kennen dich die Wörter schon besser.',
    'Nicht jede Runde ist leicht. Du bist drangeblieben, das zählt.',
    'Das waren harte Brocken heute. Du hast trotzdem bis zum Schluss gesammelt!',
    'Manche Wörter brauchen mehrere Anläufe. Ich lande auch nicht bei jedem Sprung auf dem Ast.',
  ],
  h_nichts_faellig: [
    'Für heute ist alles geübt. Die Wörter ruhen sich aus.',
    'Heute gibt es nichts mehr zu tun. Erdbeeren brauchen Zeit zum Reifen.',
    'Alles erledigt für heute. Morgen schauen wir wieder ins Beet.',
    'Heute ist alles gegossen. Wenn du magst, üben wir einfach frei.',
  ],
  h_naechstes: [
    'Du kennst schon alle Wörter aus deiner Auswahl. Wollen wir ein Lernziel dazunehmen?',
    'Mein Heft hat noch leere Seiten. Nehmen wir das nächste Lernziel dazu?',
    'Ich hätte da noch mehr Wörter für dich. Hast du Lust auf ein neues Lernziel?',
  ],
  h_alles_reif: [
    'Alle Erdbeeren sind reif. Nea, du bist eine echte Wörtersammlerin!',
    'Mein Körbchen ist voll. {Merci, Nea !}',
  ],

  /* ---------- Album und Garderobe ---------- */
  h_album: [
    'Mein Wörterheft! Tippe auf ein Wort, dann lese ich es dir vor.',
    'Hier wachsen alle deine Wörter.',
    'Blättere ruhig in meinem Heft. Jedes Wort hat hier seinen Platz.',
  ],
  // Passt zu jedem Teil: Hut, Brille, Schal oder Zauberstab
  h_anziehen: [
    '{Oh là là !} Steht mir das?',
    'Schick, oder?',
    'Passt das zu meinem Schwanz?',
    'Das behalte ich gleich an!',
    'Hui, bin das wirklich ich?',
  ],
  h_ausziehen: [
    'Ohne geht es auch.',
    'Zurück in den Schrank damit.',
  ],
  h_zu_teuer: [
    'Dafür brauchen wir noch ein paar Äpfel.',
    'Noch zu teuer. Sammeln wir weiter!',
  ],
  h_stimme_an: ['Ich lese dir wieder vor.'],
};

/* =====================================================================
   PIEKS IM FRANZÖSISCH: Er lernt mit und ist immer einen Schritt
   hinter Nea. Nur Deutsch, keine Klammern, kein französisches Wort.
   ===================================================================== */
const PTEXTE = {
  // Erstes Treffen (feste Reihenfolge)
  p_besuch: [
    'Autsch! Wer wirft hier mit Äpfeln?',
    'Nea, das ist meine Freundin {H}. Sie kommt aus Frankreich.',
  ],
  // Ab und zu nach ihrer Eröffnung
  p_fr_start: [
    'Ich lerne mit! Französisch kann ich noch nicht so gut.',
    'Psst, Nea. Wenn du etwas weisst, sag es mir auch.',
    'Ich setze mich dazu. Vielleicht bleibt ja etwas an meinen Stacheln hängen.',
    'Französisch! Ich spitze schon mal die Ohren.',
  ],
  // Pieks rät mit: beide richtig
  p_rat_richtig: [
    'Das hätte ich auch genommen! Wir sind ein gutes Team.',
    'Juhu, ich lag auch richtig!',
    'Wir zwei haben dasselbe getippt. Ich lerne ja doch etwas!',
    'Ha! Genau darauf habe ich auch gezeigt.',
  ],
  // Nea richtig, Pieks daneben: ein Apfel mehr für sie
  p_rat_falsch: [
    'Oh. Ich hätte das andere genommen. Du hast mich geschlagen!',
    'Hui, daneben. Du bist besser als ich. Ein Apfel für dich!',
    'Ups, mein Tipp war daneben. Der Extra-Apfel gehört dir!',
    'Ich habe danebengetippt, du nicht. Von dir kann ich noch viel lernen!',
  ],
  // Beide daneben, auf derselben oder auf verschiedenen Antworten
  p_rat_beide: [
    'Da lagen wir beide daneben. Geteiltes Pech!',
    'Ich lag auch daneben. Zum Glück fragt mich niemand.',
    'Ich hätte es auch nicht gewusst. Das lernen wir jetzt zu zweit.',
    'Keiner von uns hat es getroffen. Macht nichts, jetzt wissen wir es beide.',
  ],
  // Nea daneben, Pieks richtig: Er gibt nicht an
  p_rat_glueck: [
    'Ich habe nur geraten. Pures Igel-Glück!',
    'Da hatte ich einfach Glück. Nächstes Mal weisst du es wieder.',
    'Das war ein Zufallstreffer von mir. Ehrlich!',
  ],
  // Nach «Zehn in Folge!» auf dem Französisch-Bildschirm
  p_staunt: [
    'Nea, du lernst schneller als ich. Ich übe heute Nacht heimlich.',
    'So viele richtig! Ich komme kaum mit.',
    'Sag mal, hast du Französisch gefrühstückt?',
    'Wie machst du das nur? Ich brauche dringend deine Tricks.',
    'Du bist ja nicht zu bremsen! Darf ich bei dir abschauen?',
  ],
  // Vorspann vor dem Fakt am Ende der Runde
  p_fakt_franz: [
    'Zur Belohnung ein Fakt von mir:',
    'Jetzt bin ich dran. Wusstest du das?',
    'Wörter hat sie, Fakten habe ich. Hör mal:',
  ],
  // Zurück vom Rechnen, ab und zu statt «lichtung»
  p_lichtung_zwei: [
    'Rechnen mit mir oder Französisch mit meiner Freundin? Du hast die Wahl.',
    'Zwei Lehrer, eine Lichtung. Was darf es sein?',
    'Na, Lust auf Abwechslung? Meine Freundin hätte da ein paar Wörter.',
    'Hier stehen wir zwei und warten auf dich. Zahlen oder Wörter?',
  ],
};

/* =====================================================================
   MERKHILFEN: stehen beim Kennenlernen auf der Karte, und das Hörnchen
   sagt sie nach dem Wort. Schlüssel ist die Kennung des Eintrags
   (un + '|' + fr). Die Liste ist geschlossen: nur, was ganz genau
   stimmt und ohne Wissen ausserhalb des Eintrags auskommt.
   ===================================================================== */
const MERKHILFEN = {
  'u2|la sœur': 'Das o und das e kleben zusammen, wie zwei Schwestern.',
  'u2|le fils': 'Das l hört man nicht, das s am Schluss schon.',
  'u4|le hérisson': 'Das h hört man nicht. Trotzdem bleibt der Artikel ganz: kein Apostroph.',
  'u3|le hockey sur glace': 'Das h hört man nicht. Trotzdem bleibt der Artikel ganz: kein Apostroph.',
  'u4|les yeux (m pl), un œil': 'Ein Auge und zwei Augen heissen ganz verschieden. Das merkt man sich am besten zusammen.',
  'u2|la langue': 'Dieses Wort heisst Sprache. Und es heisst auch Zunge!',
  'u1|les ciseaux (m pl)': 'Auf Deutsch eine Schere, auf Französisch immer Mehrzahl.',
  'u2|la grand-mère': 'Achte auf den Bindestrich in der Mitte.',
  'u1|le français': 'Das c hat ein Häkchen. Darum klingt es wie s.',
};

/* =====================================================================
   WORTMOMENTE: kleine Reaktionen, einmal, wenn ein Wort zum ersten Mal
   kennengelernt wird (nach der Merkhilfe).
     wer      'h' das Hörnchen · 'p' Pieks
     klasse   was die Figur dazu macht (siehe hoernchen.css)
   ===================================================================== */
const WORTMOMENTE = {
  'u4|pour la queue': { wer: 'h', t: 'Für den Schwanz! Da kenne ich mich aus.', klasse: 'zeigt-schweif' },
  'u1|sauter': { wer: 'h', t: 'Springen! Das mache ich den ganzen Tag.', klasse: 'froh' },
  'u1|grimper': { wer: 'h', t: 'Klettern! Mein liebstes Hobby.' },
  'u2|le chat': { wer: 'h', t: 'Wo? Ach so, nur das Wort. Uff!', klasse: 'versteckt' },
  'u4|la fraise': { wer: 'h', t: 'Mein Lieblingswort. Und mein Lieblingsessen!' },
  'u3|danser': { wer: 'h', t: 'Tanzen? Schau her!', klasse: 'dreht' },
  'u3|le loisir': { wer: 'h', t: 'Auf Deutsch so ein langes Wort, auf Französisch so ein kurzes. {Voilà !}' },
  'u4|le hérisson': { wer: 'p', t: 'Das bin ja ich! Dieses Wort lerne ich zuerst.' },
  'u1|calculer': { wer: 'p', t: 'Endlich ein Wort für mich!' },
  'u4|la pomme': { wer: 'p', t: 'Mein Lieblingswort! Zum Anbeissen.' },
};

// Listen, die jubeln und loben. Gebraucht wird das nur für den Zusammenhang der Aufnahme.
const H_LEBHAFT = ['h_gruss', 'h_gruss_faellig', 'h_start_neu', 'h_start_wdh', 'h_start_gemischt', 'h_start_frei',
  'h_richtig', 'h_richtig_nachfehler', 'h_richtig_schreiben', 'h_richtig_satz', 'h_hoch', 'h_frucht', 'h_reif',
  'h_paare', 'h_paare_fertig', 'h_ende', 'h_ende_perfekt', 'h_gesagt', 'h_kitzeln', 'h_anziehen', 'h_jetzt_du'];

/* =====================================================================
   AUFNAHMEN: alles, was für das Französisch vertont wird, jeder Clip
   nur einmal (gleiche Stimme, gleicher Text). Ein Eintrag:
     { s, v, gruppe, vorher, nachher, tempo, lebhaft }
     hoernchen   ihre Zeilen, Stück für Stück: v 'hd' deutsch, 'hf' französisch
     pieks       PTEXTE und Pieks' Wortmomente: v 'p'
     wort        die Einträge, wie sie beim Kennenlernen klingen: v 'f'
     form        die einzelnen Formen, nach denen die Aufgaben fragen: v 'f'
     langsam     dasselbe langsam, wo es mehr als ein Wort ist: v 'fl'
   vorher und nachher werden nie gesprochen. Sie sagen der Stimme, in
   welcher Sprache und in welchem Ton die Aufnahme gemeint ist.
   ===================================================================== */
function alleFranzClips() {
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

  // Ein kurzer deutscher Ausruf allein wird leicht für eine andere Sprache gehalten,
  // darum der gedachte Satz davor und, wo es passt, einer danach. Der danach gibt auch den
  // Ton vor: Lob nur, wo gelobt wird.
  const NACHHER_KURZ = {
    h_kitzeln: ' Sie kichert.',
    h_jetzt_du: ' Sie lächelt aufmunternd.',
    h_anziehen: ' Sie dreht sich vor dem Spiegel.',
  };
  const hoernchen = (e, lebhaft, name) => {
    for (const x of T_F.segmente(e)) {
      if (x.sprache === 'fr') {
        dazu({ s: x.s, v: 'hf', gruppe: 'hoernchen', vorher: 'Elle dit en français : ', nachher: ' Et elle sourit.', tempo: 1, lebhaft });
        continue;
      }
      const kurz = lebhaft && x.s.split(/\s+/).length <= 3;
      const nachher = x.s.endsWith(':') ? ' Hör gut zu.' : kurz ? NACHHER_KURZ[name] || ' Das hast du wirklich gut gemacht.' : '';
      dazu({ s: x.s, v: 'hd', gruppe: 'hoernchen', vorher: T_F.HOERNCHEN.sprich + ' sagt auf Deutsch: ', nachher, tempo: 1, lebhaft });
    }
  };
  const pieks = (e, nachher) => dazu({ s: T_F.sprechtext(e), v: 'p', gruppe: 'pieks', vorher: '', nachher, tempo: 1, lebhaft: false });

  for (const [name, pool] of Object.entries(HTEXTE)) {
    for (const e of pool) hoernchen(e, H_LEBHAFT.includes(name), name);
  }
  for (const e of Object.values(MERKHILFEN)) hoernchen(e, false);
  for (const m of Object.values(WORTMOMENTE)) if (m.wer === 'h') hoernchen(m.t, false);

  for (const [name, pool] of Object.entries(PTEXTE)) {
    // Der Vorspann zum Fakt ist kurz: ein gedachter Fakt danach hält ihn im Erzählton
    for (const e of pool) pieks(e, name === 'p_fakt_franz' ? 'Igel haben etwa siebentausend Stacheln.' : '');
  }
  for (const m of Object.values(WORTMOMENTE)) if (m.wer === 'p') pieks(m.t, '');

  // Vokabeln gehen nie durch sprechtext(): Der Text ist wörtlich der des Eintrags oder der Form.
  // vokabelClip gibt null, wo es keine langsame Aufnahme gibt.
  const vokabel = (c, e, gruppe) => {
    if (!c) return;
    dazu({ s: c.s, v: c.v, gruppe, vorher: e.art === 'satz' ? 'Écoute bien, voici la phrase : ' : 'Écoute bien, voici le mot : ',
      nachher: ' Tu peux le répéter.', tempo: c.v === 'fl' ? 0.7 : 0.85, lebhaft: false });
  };
  // Erst alle Einträge, dann die Formen: Eine Form, die wie ihr Eintrag heisst, ist dieselbe Aufnahme
  const jedeForm = (e, f) => e.teile.forEach((teil, i) => teil.fr.forEach((form, j) => f(i, j)));
  for (const e of V_F.VOKABELN) vokabel(V_F.vokabelClip(e), e, 'wort');
  for (const e of V_F.VOKABELN) jedeForm(e, (i, j) => vokabel(V_F.vokabelClip(e, i, j), e, 'form'));
  for (const e of V_F.VOKABELN) vokabel(V_F.vokabelClip(e, undefined, undefined, true), e, 'langsam');
  for (const e of V_F.VOKABELN) jedeForm(e, (i, j) => vokabel(V_F.vokabelClip(e, i, j, true), e, 'langsam'));
  return liste;
}

if (typeof module !== 'undefined') module.exports = { HTEXTE, PTEXTE, MERKHILFEN, WORTMOMENTE, H_LEBHAFT, alleFranzClips };
