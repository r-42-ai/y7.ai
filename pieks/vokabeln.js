'use strict';

/* =====================================================================
   VOKABELN
   Die 210 Einträge aus Neas Französischbuch (Unité 1 bis 4), wörtlich aus
   dem alten Trainer übernommen, und alles, was sich daraus einmal beim
   Laden ableiten lässt: Karten, Lernziele, Teile, Artikel, Geschlecht und
   der Text, den die Stimme spricht.

   Die Datei läuft im Browser, in Node (require) und im Service Worker
   (importScripts). Sie fasst darum weder die Seite noch einen Speicher an.

   Ein Eintrag, genau wie im Buch:
     un       Unité: 'u1' … 'u4' (muss in UNITES stehen)
     plus     true = aus dem Blatt «Vocabulaire plus» (sonst weglassen)
     lz       Lernziel auf dem Blatt: '1' | '2' | '3' | 'S' | '4'
     cat      Wortgruppe für gute Ablenker: 'ding' | 'fach' | 'tag' | 'verb' |
              'fam' | 'essen' | 'gesicht' | 'hobby' | 'gram' (Wendungen) |
              'satz' (ganze Sätze, werden nie getippt)
     fr / de  wörtlich wie im Buch, so steht es auf der Karte
     frForms  optional: die einzelnen französischen Formen
     deForms  optional: die einzelnen deutschen Formen
     tts      optional: was die Stimme spricht, wenn es von fr abweicht
   Der Apostroph ist immer der typografische (’), nie der gerade.

   Wichtig: un und fr bilden den Schlüssel für Neas Fortschritt. Wer einen
   Eintrag umformuliert, lässt das Wort bei null beginnen.
   Nach jeder Änderung: node pieks/pruefe.mjs (ruft vokabelnPruefen()).
   ===================================================================== */

const UNITES = {
  u1: { name: 'Unité 1', titel: 'Schule & Wochentage', farbe: '#23795B' },
  u2: { name: 'Unité 2', titel: 'Familie',             farbe: '#A93E72' },
  u3: { name: 'Unité 3', titel: 'Hobbys & Freizeit',   farbe: '#4353A8' },
  u4: { name: 'Unité 4', titel: 'Essen & Gesicht',     farbe: '#B84A2B' },
};
const UNITE_REIHE = ['u1', 'u2', 'u3', 'u4'];

const VOKABELN = [
  /* ════════ Unité 1 · Vocabulaire ════════ */
  { un: 'u1', lz: '1', cat: 'satz', fr: 'Chouette, c’est la rentrée!', de: 'Toll, es ist Schulanfang!' },
  { un: 'u1', lz: '1', cat: 'satz', fr: 'Zut, c’est la rentrée!',      de: 'Oje, es ist Schulanfang!' },
  { un: 'u1', lz: 'S', cat: 'ding', fr: 'le livre',        de: 'das Buch' },
  { un: 'u1', lz: 'S', cat: 'ding', fr: 'la règle',        de: 'das Lineal' },
  { un: 'u1', lz: 'S', cat: 'ding', fr: 'le classeur',     de: 'der Ordner' },
  { un: 'u1', lz: 'S', cat: 'ding', fr: 'le cahier',       de: 'das Heft' },
  { un: 'u1', lz: 'S', cat: 'ding', fr: 'le crayon',       de: 'der Bleistift' },
  { un: 'u1', lz: 'S', cat: 'ding', fr: 'le stylo',        de: 'der Kugelschreiber' },
  { un: 'u1', lz: 'S', cat: 'ding', fr: 'la gomme',        de: 'der Gummi' },
  { un: 'u1', lz: 'S', cat: 'ding', fr: 'le tableau noir', de: 'die Wandtafel' },
  { un: 'u1', lz: 'S', cat: 'ding', fr: 'la trousse',      de: 'das Etui' },
  { un: 'u1', lz: 'S', cat: 'ding', fr: 'la table',        de: 'der Tisch' },
  { un: 'u1', lz: 'S', cat: 'ding', fr: 'la chaise',       de: 'der Stuhl' },
  { un: 'u1', lz: '2', cat: 'fach', fr: 'la matière scolaire', de: 'das Schulfach' },
  { un: 'u1', lz: '2', cat: 'fach', fr: 'l’allemand (m)',      de: 'Deutsch' },
  { un: 'u1', lz: '2', cat: 'fach', fr: 'le français',         de: 'Französisch' },
  { un: 'u1', lz: '2', cat: 'fach', fr: 'l’anglais (m)',       de: 'Englisch' },
  { un: 'u1', lz: '2', cat: 'fach', fr: 'les maths, les mathématiques (f pl)', de: 'Mathematik',
    frForms: ['les maths', 'les mathématiques'] },
  { un: 'u1', lz: '2', cat: 'tag',  fr: 'les jours (m) de la semaine', de: 'die Wochentage' },
  { un: 'u1', lz: '2', cat: 'tag',  fr: 'lundi',    de: 'Montag' },
  { un: 'u1', lz: '2', cat: 'tag',  fr: 'mardi',    de: 'Dienstag' },
  { un: 'u1', lz: '2', cat: 'tag',  fr: 'mercredi', de: 'Mittwoch' },
  { un: 'u1', lz: '2', cat: 'tag',  fr: 'jeudi',    de: 'Donnerstag' },
  { un: 'u1', lz: '2', cat: 'tag',  fr: 'vendredi', de: 'Freitag' },
  { un: 'u1', lz: '2', cat: 'tag',  fr: 'samedi',   de: 'Samstag' },
  { un: 'u1', lz: '2', cat: 'tag',  fr: 'dimanche', de: 'Sonntag' },
  { un: 'u1', lz: '3', cat: 'ding', fr: 'une école',       de: 'eine Schule' },
  { un: 'u1', lz: '3', cat: 'verb', fr: 'calculer',        de: 'rechnen' },
  { un: 'u1', lz: '3', cat: 'verb', fr: 'dessiner',        de: 'zeichnen' },
  { un: 'u1', lz: '3', cat: 'verb', fr: 'chanter',         de: 'singen' },
  { un: 'u1', lz: '3', cat: 'verb', fr: 'expérimenter',    de: 'experimentieren' },
  { un: 'u1', lz: '3', cat: 'verb', fr: 'parler français', de: 'Französisch sprechen' },

  /* ════════ Unité 1 · Vocabulaire plus ════════ */
  { un: 'u1', plus: true, lz: 'S', cat: 'ding', fr: 'le cartable',       de: 'die Schultasche' },
  { un: 'u1', plus: true, lz: 'S', cat: 'ding', fr: 'un agenda',         de: 'eine Agenda' },
  { un: 'u1', plus: true, lz: 'S', cat: 'ding', fr: 'les ciseaux (m pl)', de: 'die Schere' },
  { un: 'u1', plus: true, lz: '2', cat: 'fach', fr: 'le dessin', de: 'das bildnerische Gestalten, die Zeichnung',
    deForms: ['das bildnerische Gestalten', 'die Zeichnung'] },
  { un: 'u1', plus: true, lz: '2', cat: 'fach', fr: 'la géo, la géographie', de: 'die Geografie',
    frForms: ['la géo', 'la géographie', 'la géo, la géographie'] },
  { un: 'u1', plus: true, lz: '2', cat: 'fach', fr: 'l’histoire (f)', de: 'die Geschichte' },
  { un: 'u1', plus: true, lz: '2', cat: 'fach', fr: 'la gym, la gymnastique', de: 'das Turnen',
    frForms: ['la gym', 'la gymnastique', 'la gym, la gymnastique'] },
  { un: 'u1', plus: true, lz: '2', cat: 'fach', fr: 'les sciences (f pl) de la nature', de: 'die Naturwissenschaften' },
  { un: 'u1', plus: true, lz: '2', cat: 'fach', fr: 'la musique', de: 'die Musik' },
  { un: 'u1', plus: true, lz: '2', cat: 'fach', fr: 'ACM (activités créatrices manuelles)', de: 'Handarbeit und Werken',
    frForms: ['ACM', 'les activités créatrices manuelles', 'activités créatrices manuelles'],
    tts: 'ACM, les activités créatrices manuelles' },
  { un: 'u1', plus: true, lz: '3', cat: 'verb', fr: 'parler anglais',      de: 'Englisch sprechen' },
  { un: 'u1', plus: true, lz: '3', cat: 'verb', fr: 'explorer l’étranger', de: 'das Ausland erkunden' },
  { un: 'u1', plus: true, lz: '3', cat: 'verb', fr: 'visiter un musée',    de: 'ein Museum besuchen' },
  { un: 'u1', plus: true, lz: '3', cat: 'verb', fr: 'tricoter',            de: 'stricken' },
  { un: 'u1', plus: true, lz: '3', cat: 'verb', fr: 'réciter un poème',    de: 'ein Gedicht aufsagen' },
  { un: 'u1', plus: true, lz: '3', cat: 'verb', fr: 'bricoler',            de: 'basteln' },
  { un: 'u1', plus: true, lz: '3', cat: 'verb', fr: 'sauter', de: 'springen, hüpfen',
    deForms: ['springen', 'hüpfen', 'springen, hüpfen'] },
  { un: 'u1', plus: true, lz: '3', cat: 'verb', fr: 'grimper', de: 'klettern' },

  /* ════════ Unité 2 · Vocabulaire ════════ */
  { un: 'u2', lz: '1', cat: 'fam', fr: 'la famille', de: 'die Familie' },
  { un: 'u2', lz: '1', cat: 'fam', fr: 'un/une enfant', de: 'ein Kind',
    frForms: ['un enfant', 'une enfant', 'un/une enfant'], tts: 'un enfant, une enfant' },
  { un: 'u2', lz: '2', cat: 'fam', fr: 'la mère, la maman', de: 'die Mutter',
    frForms: ['la mère', 'la maman', 'la mère, la maman'] },
  { un: 'u2', lz: '2', cat: 'fam', fr: 'le père, le papa', de: 'der Vater',
    frForms: ['le père', 'le papa', 'le père, le papa'] },
  { un: 'u2', lz: '2', cat: 'fam', fr: 'les parents (m pl)', de: 'die Eltern' },
  { un: 'u2', lz: '2', cat: 'fam', fr: 'la sœur',  de: 'die Schwester' },
  { un: 'u2', lz: '2', cat: 'fam', fr: 'le frère', de: 'der Bruder' },
  { un: 'u2', lz: '2', cat: 'fam', fr: 'la grand-mère', de: 'die Grossmutter' },
  { un: 'u2', lz: '2', cat: 'fam', fr: 'le grand-père', de: 'der Grossvater' },
  { un: 'u2', lz: '2', cat: 'fam', fr: 'les grands-parents (m pl)', de: 'die Grosseltern' },
  { un: 'u2', lz: '2', cat: 'fam', fr: 'la tante',   de: 'die Tante' },
  { un: 'u2', lz: '2', cat: 'fam', fr: 'un oncle',   de: 'ein Onkel' },
  { un: 'u2', lz: '2', cat: 'fam', fr: 'la cousine', de: 'die Cousine' },
  { un: 'u2', lz: '2', cat: 'fam', fr: 'le cousin',  de: 'der Cousin' },
  { un: 'u2', lz: '2', cat: 'fam', fr: 'le bébé', de: 'das Baby, das Kleinkind',
    deForms: ['das Baby', 'das Kleinkind', 'das Baby, das Kleinkind'] },
  { un: 'u2', lz: '2', cat: 'fam', fr: 'la fille', de: 'die Tochter, das Mädchen',
    deForms: ['die Tochter', 'das Mädchen', 'die Tochter, das Mädchen'] },
  { un: 'u2', lz: '2', cat: 'fam', fr: 'le fils', de: 'der Sohn' },
  { un: 'u2', lz: '2', cat: 'gram', fr: 'voici, voilà', de: 'hier ist, da ist',
    frForms: ['voici', 'voilà', 'voici, voilà'], deForms: ['hier ist', 'da ist', 'hier ist, da ist'] },
  { un: 'u2', lz: '2', cat: 'gram', fr: 'il est, elle est', de: 'er ist, sie ist',
    frForms: ['il est', 'elle est', 'il est, elle est'], deForms: ['er ist', 'sie ist', 'er ist, sie ist'] },
  { un: 'u2', lz: '2', cat: 'satz', fr: 'Lionel est le frère de Nathalie.', de: 'Lionel ist der Bruder von Nathalie.' },
  { un: 'u2', lz: '2', cat: 'gram', fr: 'ils sont, elles sont', de: 'sie sind',
    frForms: ['ils sont', 'elles sont', 'ils sont, elles sont'] },
  { un: 'u2', lz: '2', cat: 'gram', fr: 'c’est', de: 'das ist' },
  { un: 'u2', lz: '2', cat: 'satz', fr: 'C’est ma famille.', de: 'Das ist meine Familie.' },
  { un: 'u2', lz: '2', cat: 'gram', fr: 'ce sont', de: 'das sind' },
  { un: 'u2', lz: '2', cat: 'satz', fr: 'Ce sont mes grands-parents.', de: 'Das sind meine Grosseltern.' },
  { un: 'u2', lz: '2', cat: 'gram', fr: 'qui?', de: 'wer?' },
  { un: 'u2', lz: '2', cat: 'gram', fr: 'il s’appelle, elle s’appelle', de: 'er heisst, sie heisst',
    frForms: ['il s’appelle', 'elle s’appelle', 'il s’appelle, elle s’appelle'],
    deForms: ['er heisst', 'sie heisst', 'er heisst, sie heisst'] },
  { un: 'u2', lz: '2', cat: 'gram', fr: 'ils s’appellent, elles s’appellent', de: 'sie heissen',
    frForms: ['ils s’appellent', 'elles s’appellent', 'ils s’appellent, elles s’appellent'] },
  { un: 'u2', lz: '3', cat: 'ding', fr: 'la fiche personnelle', de: 'der Steckbrief' },
  { un: 'u2', lz: '3', cat: 'ding', fr: 'le nom',    de: 'der Name' },
  { un: 'u2', lz: '3', cat: 'ding', fr: 'le prénom', de: 'der Vorname' },
  { un: 'u2', lz: '3', cat: 'ding', fr: 'la langue', de: 'die Sprache' },
  { un: 'u2', lz: '3', cat: 'satz', fr: 'Je parle allemand, français et anglais.', de: 'Ich spreche Deutsch, Französisch und Englisch.' },

  /* ════════ Unité 2 · Vocabulaire plus ════════ */
  { un: 'u2', plus: true, lz: '1', cat: 'fam',  fr: 'un acteur',      de: 'ein Schauspieler' },
  { un: 'u2', plus: true, lz: '1', cat: 'ding', fr: 'le cinéma muet', de: 'der Stummfilm' },
  { un: 'u2', plus: true, lz: '1', cat: 'gram', fr: 'marié/mariée', de: 'verheiratet',
    frForms: ['marié', 'mariée', 'marié/mariée'], tts: 'marié, mariée' },
  { un: 'u2', plus: true, lz: '1', cat: 'gram', fr: 'onze', de: 'elf' },
  { un: 'u2', plus: true, lz: '2', cat: 'fam', fr: 'le petit-fils',   de: 'der Enkel' },
  { un: 'u2', plus: true, lz: '2', cat: 'fam', fr: 'la petite-fille', de: 'die Enkelin' },
  { un: 'u2', plus: true, lz: '2', cat: 'fam', fr: 'le chien', de: 'der Hund' },
  { un: 'u2', plus: true, lz: '2', cat: 'fam', fr: 'le chat',  de: 'die Katze' },
  { un: 'u2', plus: true, lz: '2', cat: 'fam', fr: 'le membre de la famille', de: 'das Familienmitglied' },
  { un: 'u2', plus: true, lz: '2', cat: 'fam', fr: 'un arbre généalogique',   de: 'ein Stammbaum' },
  { un: 'u2', plus: true, lz: '3', cat: 'ding', fr: 'le sexe',      de: 'das Geschlecht' },
  { un: 'u2', plus: true, lz: '3', cat: 'ding', fr: 'l’âge (m)',    de: 'das Alter' },
  { un: 'u2', plus: true, lz: '3', cat: 'ding', fr: 'une adresse',  de: 'eine Adresse' },
  { un: 'u2', plus: true, lz: '3', cat: 'ding', fr: 'le pays',      de: 'das Land' },
  { un: 'u2', plus: true, lz: '3', cat: 'ding', fr: 'la signature', de: 'die Unterschrift' },
  { un: 'u2', plus: true, lz: '3', cat: 'fach', fr: 'le néerlandais', de: 'Niederländisch' },
  { un: 'u2', plus: true, lz: '3', cat: 'fach', fr: 'le suédois',     de: 'Schwedisch' },
  { un: 'u2', plus: true, lz: '3', cat: 'fach', fr: 'l’italien (m)',  de: 'Italienisch' },
  { un: 'u2', plus: true, lz: '3', cat: 'fach', fr: 'l’espagnol (m)', de: 'Spanisch' },
  { un: 'u2', plus: true, lz: '3', cat: 'ding', fr: 'le drapeau', de: 'die Fahne' },

  /* ════════ Unité 3 · Vocabulaire ════════ */
  { un: 'u3', lz: '1', cat: 'hobby', fr: 'le loisir', de: 'die Freizeitbeschäftigung' },
  { un: 'u3', lz: '1', cat: 'hobby', fr: 'un ordinateur', de: 'ein Computer' },
  { un: 'u3', lz: '1', cat: 'hobby', fr: 'la télé',    de: 'der Fernseher' },
  { un: 'u3', lz: '1', cat: 'hobby', fr: 'la console', de: 'die Spielkonsole' },
  { un: 'u3', lz: '1', cat: 'hobby', fr: 'lire', de: 'lesen' },
  { un: 'u3', lz: '1', cat: 'hobby', fr: 'le foot, faire du foot', de: 'Fussball (Spiel), Fussball spielen',
    frForms: ['le foot', 'faire du foot', 'le foot, faire du foot'],
    deForms: ['Fussball', 'Fussball spielen', 'Fussball, Fussball spielen'] },
  { un: 'u3', lz: '1', cat: 'hobby', fr: 'le vélo', de: 'das Velo, das Fahrrad',
    deForms: ['das Velo', 'das Fahrrad', 'das Velo, das Fahrrad'] },
  { un: 'u3', lz: '1', cat: 'hobby', fr: 'le ski', de: 'der Ski' },
  { un: 'u3', lz: '1', cat: 'hobby', fr: 'l’unihockey (m), faire de l’unihockey', de: 'das Unihockey, Unihockey spielen',
    frForms: ['l’unihockey', 'faire de l’unihockey', 'l’unihockey, faire de l’unihockey'],
    deForms: ['das Unihockey', 'Unihockey spielen', 'das Unihockey, Unihockey spielen'] },
  { un: 'u3', lz: '1', cat: 'hobby', fr: 'danser', de: 'tanzen' },
  { un: 'u3', lz: '1', cat: 'hobby', fr: 'nager',  de: 'schwimmen' },
  { un: 'u3', lz: '1', cat: 'hobby', fr: 'la guitare, jouer de la guitare', de: 'die Gitarre, Gitarre spielen',
    frForms: ['la guitare', 'jouer de la guitare', 'la guitare, jouer de la guitare'],
    deForms: ['die Gitarre', 'Gitarre spielen', 'die Gitarre, Gitarre spielen'] },
  { un: 'u3', lz: '1', cat: 'hobby', fr: 'la flûte', de: 'die Flöte' },
  { un: 'u3', lz: '1', cat: 'hobby', fr: 'le piano, jouer du piano', de: 'das Klavier, Klavier spielen',
    frForms: ['le piano', 'jouer du piano', 'le piano, jouer du piano'],
    deForms: ['das Klavier', 'Klavier spielen', 'das Klavier, Klavier spielen'] },
  { un: 'u3', lz: '1', cat: 'hobby', fr: 'jouer dehors', de: 'draussen spielen' },
  { un: 'u3', lz: '1', cat: 'hobby', fr: 'un animal, les animaux (m pl)', de: 'ein Tier, die Tiere',
    frForms: ['un animal', 'les animaux', 'un animal, les animaux'],
    deForms: ['ein Tier', 'die Tiere', 'ein Tier, die Tiere'] },
  { un: 'u3', lz: '1', cat: 'hobby', fr: 'le bricolage', de: 'das Basteln' },
  { un: 'u3', lz: '1', cat: 'hobby', fr: 'écouter de la musique', de: 'Musik hören' },
  { un: 'u3', lz: '1', cat: 'hobby', fr: 'faire la cuisine',  de: 'kochen' },
  { un: 'u3', lz: '1', cat: 'hobby', fr: 'faire du shopping', de: 'shoppen' },
  { un: 'u3', lz: '1', cat: 'hobby', fr: 'rencontrer des amis/amies', de: 'Freunde/Freundinnen treffen',
    frForms: ['rencontrer des amis', 'rencontrer des amies', 'rencontrer des amis/amies'],
    deForms: ['Freunde treffen', 'Freundinnen treffen', 'Freunde/Freundinnen treffen'],
    tts: 'rencontrer des amis' },
  { un: 'u3', lz: '1', cat: 'gram', fr: 'aimer, j’aime', de: 'lieben, ich liebe',
    frForms: ['aimer', 'j’aime', 'aimer, j’aime'], deForms: ['lieben', 'ich liebe', 'lieben, ich liebe'] },
  { un: 'u3', lz: '1', cat: 'gram', fr: 'adorer, j’adore', de: 'sehr gerne haben, ich habe sehr gerne',
    frForms: ['adorer', 'j’adore', 'adorer, j’adore'],
    deForms: ['sehr gerne haben', 'ich habe sehr gerne', 'sehr gerne haben, ich habe sehr gerne'] },
  { un: 'u3', lz: '1', cat: 'gram', fr: 'ma passion, c’est...', de: 'meine Leidenschaft ist ...',
    frForms: ['ma passion, c’est'] },
  { un: 'u3', lz: '1', cat: 'gram', fr: 'mon hobby, c’est...', de: 'mein Hobby ist ...',
    frForms: ['mon hobby, c’est'] },
  { un: 'u3', lz: '1', cat: 'gram', fr: 'je suis fan de...', de: 'ich bin Fan von ...',
    frForms: ['je suis fan de'] },
  { un: 'u3', lz: '3', cat: 'ding', fr: 'le nombre', de: 'die Zahl' },
  { un: 'u3', lz: '3', cat: 'fam', fr: 'un/une élève', de: 'ein Schüler, eine Schülerin',
    frForms: ['un élève', 'une élève', 'un/une élève'],
    deForms: ['ein Schüler', 'eine Schülerin', 'ein Schüler, eine Schülerin'],
    tts: 'un élève, une élève' },
  { un: 'u3', lz: '3', cat: 'fam', fr: 'le garçon', de: 'der Knabe' },
  { un: 'u3', lz: '3', cat: 'fam', fr: 'la fille', de: 'das Mädchen, die Tochter',
    deForms: ['das Mädchen', 'die Tochter', 'das Mädchen, die Tochter'] },

  /* ════════ Unité 3 · Vocabulaire plus ════════ */
  { un: 'u3', plus: true, lz: '1', cat: 'hobby', fr: 'les médias (m pl)', de: 'die Medien' },
  { un: 'u3', plus: true, lz: '1', cat: 'hobby', fr: 'la BD (la bande dessinée)', de: 'der Comic',
    frForms: ['la BD', 'la bande dessinée'], tts: 'la BD, la bande dessinée' },
  { un: 'u3', plus: true, lz: '1', cat: 'hobby', fr: 'l’équitation (f), faire de l’équitation', de: 'das Reiten, reiten',
    frForms: ['l’équitation', 'faire de l’équitation', 'l’équitation, faire de l’équitation'],
    deForms: ['das Reiten', 'reiten', 'das Reiten, reiten'] },
  { un: 'u3', plus: true, lz: '1', cat: 'hobby', fr: 'les acrobaties (f pl), faire des acrobaties', de: 'die Akrobatik, Akrobatik machen',
    frForms: ['les acrobaties', 'faire des acrobaties', 'les acrobaties, faire des acrobaties'],
    deForms: ['die Akrobatik', 'Akrobatik machen', 'die Akrobatik, Akrobatik machen'] },
  { un: 'u3', plus: true, lz: '1', cat: 'hobby', fr: 'la grimpe', de: 'das Klettern' },
  { un: 'u3', plus: true, lz: '1', cat: 'hobby', fr: 'le tennis de table',   de: 'das Tischtennis' },
  { un: 'u3', plus: true, lz: '1', cat: 'hobby', fr: 'le hockey sur glace',  de: 'das Eishockey' },
  { un: 'u3', plus: true, lz: '1', cat: 'hobby', fr: 'la batterie', de: 'das Schlagzeug' },
  { un: 'u3', plus: true, lz: '1', cat: 'hobby', fr: 'le violon', de: 'die Geige, die Violine',
    deForms: ['die Geige', 'die Violine', 'die Geige, die Violine'] },
  { un: 'u3', plus: true, lz: '1', cat: 'hobby', fr: 'le cirque', de: 'der Zirkus' },
  { un: 'u3', plus: true, lz: '1', cat: 'hobby', fr: 'la construction', de: 'der Modellbau' },
  { un: 'u3', plus: true, lz: '1', cat: 'hobby', fr: 'la pêche, pêcher', de: 'das Fischen, fischen',
    frForms: ['la pêche', 'pêcher', 'la pêche, pêcher'], deForms: ['das Fischen', 'fischen', 'das Fischen, fischen'] },
  { un: 'u3', plus: true, lz: '1', cat: 'hobby', fr: 'les échecs (m pl), jouer aux échecs', de: 'das Schachspiel, Schach spielen',
    frForms: ['les échecs', 'jouer aux échecs', 'les échecs, jouer aux échecs'],
    deForms: ['das Schachspiel', 'Schach spielen', 'das Schachspiel, Schach spielen'] },
  { un: 'u3', plus: true, lz: '1', cat: 'hobby', fr: 'le théâtre, jouer du théâtre', de: 'das Theater, Theater spielen',
    frForms: ['le théâtre', 'jouer du théâtre', 'le théâtre, jouer du théâtre'],
    deForms: ['das Theater', 'Theater spielen', 'das Theater, Theater spielen'] },
  { un: 'u3', plus: true, lz: '1', cat: 'hobby', fr: 'être avec mes potes', de: 'mit meinen Freunden sein' },
  { un: 'u3', plus: true, lz: '1', cat: 'hobby', fr: 'garder des enfants',  de: 'Kinder hüten' },
  { un: 'u3', plus: true, lz: '1', cat: 'gram', fr: 'j’aime beaucoup...', de: 'ich liebe sehr ...',
    frForms: ['j’aime beaucoup'] },
  { un: 'u3', plus: true, lz: '1', cat: 'gram', fr: 'mon sport favori, c’est...', de: 'mein Lieblingssport ist ...',
    frForms: ['mon sport favori, c’est'] },
  { un: 'u3', plus: true, lz: '1', cat: 'gram', fr: 'mes hobbies, ce sont...', de: 'meine Hobbys sind ...',
    frForms: ['mes hobbies, ce sont'] },
  { un: 'u3', plus: true, lz: '1', cat: 'gram', fr: 'détester, je déteste', de: 'hassen, ich hasse',
    frForms: ['détester', 'je déteste', 'détester, je déteste'], deForms: ['hassen', 'ich hasse', 'hassen, ich hasse'] },

  /* ════════ Unité 4 · Vocabulaire ════════ */
  { un: 'u4', lz: '1', cat: 'essen', fr: 'un ingrédient', de: 'eine Zutat' },
  { un: 'u4', lz: '1', cat: 'essen', fr: 'un ananas', de: 'eine Ananas' },
  { un: 'u4', lz: '1', cat: 'essen', fr: 'le raisin vert/bleu', de: 'die grüne/blaue Traube',
    frForms: ['le raisin vert', 'le raisin bleu', 'le raisin vert/bleu'],
    deForms: ['die grüne Traube', 'die blaue Traube', 'die grüne/blaue Traube'],
    tts: 'le raisin vert ou bleu' },
  { un: 'u4', lz: '1', cat: 'essen', fr: 'la fraise', de: 'die Erdbeere' },
  { un: 'u4', lz: '1', cat: 'essen', fr: 'le champignon blanc', de: 'der weisse Champignon' },
  { un: 'u4', lz: '1', cat: 'essen', fr: 'la rondelle de concombre', de: 'die Gurkenscheibe' },
  { un: 'u4', lz: '1', cat: 'essen', fr: 'la carotte', de: 'die Karotte' },
  { un: 'u4', lz: '1', cat: 'essen', fr: 'la poire',   de: 'die Birne' },
  { un: 'u4', lz: '1', cat: 'essen', fr: 'la feuille d’ananas', de: 'das Ananasblatt' },
  { un: 'u4', lz: '1', cat: 'essen', fr: 'la tomate (cerise)', de: 'die (Kirsch-)Tomate',
    frForms: ['la tomate', 'la tomate cerise'],
    deForms: ['die Tomate', 'die Kirschtomate', 'die Kirsch-Tomate'] },
  { un: 'u4', lz: '1', cat: 'essen', fr: 'un peu de persil', de: 'ein wenig Petersilie' },
  { un: 'u4', lz: '2', cat: 'gesicht', fr: 'le visage',   de: 'das Gesicht' },
  { un: 'u4', lz: '2', cat: 'gesicht', fr: 'une oreille', de: 'ein Ohr' },
  { un: 'u4', lz: '2', cat: 'gesicht', fr: 'les yeux (m pl), un œil', de: 'die Augen, ein Auge',
    frForms: ['les yeux', 'un œil', 'les yeux, un œil'],
    deForms: ['die Augen', 'ein Auge', 'die Augen, ein Auge'] },
  { un: 'u4', lz: '2', cat: 'gesicht', fr: 'les cheveux (m pl)', de: 'die Haare' },
  { un: 'u4', lz: '2', cat: 'gesicht', fr: 'la tête',   de: 'der Kopf' },
  { un: 'u4', lz: '2', cat: 'gesicht', fr: 'le nez',    de: 'die Nase' },
  { un: 'u4', lz: '2', cat: 'gesicht', fr: 'la bouche', de: 'der Mund' },
  { un: 'u4', lz: '2', cat: 'essen', fr: 'la rondelle de citron', de: 'die Zitronenscheibe' },
  { un: 'u4', lz: '2', cat: 'satz', fr: 'Pour le nez, je prends une carotte.', de: 'Für die Nase nehme ich eine Karotte.' },
  { un: 'u4', lz: '2', cat: 'satz', fr: 'C’est quoi?', de: 'Was ist das?' },
  { un: 'u4', lz: '2', cat: 'essen', fr: 'la banane', de: 'die Banane' },
  { un: 'u4', lz: '2', cat: 'essen', fr: 'les nouilles (f pl)', de: 'die Nudeln' },
  { un: 'u4', lz: '3', cat: 'satz', fr: 'Pique un raisin.', de: 'Spiesse eine Traube auf.' },
  { un: 'u4', lz: '3', cat: 'satz', fr: 'Fixe le raisin sur la poire.', de: 'Befestige die Traube an der Birne.' },
  { un: 'u4', lz: '3', cat: 'satz', fr: 'Coupe l’ananas (en deux).', de: 'Schneide (halbiere) die Ananas.' },
  { un: 'u4', lz: '3', cat: 'satz', fr: 'Pose la fraise sur l’assiette.', de: 'Stelle/Lege die Erdbeere auf den Teller.' },
  { un: 'u4', lz: '3', cat: 'satz', fr: 'Prends une poire pour le corps.', de: 'Nimm eine Birne für den Körper.' },
  { un: 'u4', lz: 'S', cat: 'satz', fr: 'Tu coupes. Coupe.', de: 'Du schneidest. Schneide!' },
  { un: 'u4', lz: 'S', cat: 'satz', fr: 'Vous coupez. Coupez.', de: 'Ihr schneidet. Schneidet!' },
  { un: 'u4', lz: '4', cat: 'ding', fr: 'un alphabet', de: 'ein Alphabet' },
  { un: 'u4', lz: '4', cat: 'essen', fr: 'la soupe', de: 'die Suppe' },
  { un: 'u4', lz: '4', cat: 'ding', fr: 'la lettre', de: 'der Buchstabe' },

  /* ════════ Unité 4 · Vocabulaire plus ════════ */
  { un: 'u4', plus: true, lz: '1', cat: 'ding', fr: 'la souris',   de: 'die Maus' },
  { un: 'u4', plus: true, lz: '1', cat: 'ding', fr: 'la voiture',  de: 'das Auto' },
  { un: 'u4', plus: true, lz: '1', cat: 'ding', fr: 'la chenille', de: 'die Raupe' },
  { un: 'u4', plus: true, lz: '1', cat: 'ding', fr: 'le hérisson', de: 'der Igel' },
  { un: 'u4', plus: true, lz: '1', cat: 'essen', fr: 'la demi-rondelle de concombre', de: 'die halbe Gurkenscheibe' },
  { un: 'u4', plus: true, lz: '1', cat: 'essen', fr: 'la tige de ciboulette', de: 'der Schnittlauchhalm' },
  { un: 'u4', plus: true, lz: '1', cat: 'essen', fr: 'le clou de girofle',    de: 'die Gewürznelke' },
  { un: 'u4', plus: true, lz: '1', cat: 'essen', fr: 'la groseille (rouge)', de: 'die Johannisbeere',
    frForms: ['la groseille', 'la groseille rouge'] },
  { un: 'u4', plus: true, lz: '1', cat: 'essen', fr: 'le raisin sec', de: 'die Rosine (getrocknete Traube)',
    deForms: ['die Rosine', 'die getrocknete Traube'] },
  { un: 'u4', plus: true, lz: '2', cat: 'gesicht', fr: 'les parties du visage', de: 'die Gesichtsteile' },
  { un: 'u4', plus: true, lz: '2', cat: 'essen', fr: 'le bouquet de brocoli',  de: 'das Brokkoliröschen' },
  { un: 'u4', plus: true, lz: '2', cat: 'essen', fr: 'le morceau de fromage',  de: 'das Stück Käse' },
  { un: 'u4', plus: true, lz: '2', cat: 'essen', fr: 'le morceau de pastèque', de: 'das Stück Wassermelone' },
  { un: 'u4', plus: true, lz: '3', cat: 'satz', fr: 'Plante des cure-dents sur le dos.', de: 'Pflanze Zahnstocher in den Rücken ein.' },
  { un: 'u4', plus: true, lz: '3', cat: 'satz', fr: 'Fixe le raisin à l’aide d’un cure-dent.', de: 'Befestige die Traube mithilfe eines Zahnstochers.' },
  { un: 'u4', plus: true, lz: '3', cat: 'gesicht', fr: 'la patte', de: 'die Pfote' },
  { un: 'u4', plus: true, lz: '3', cat: 'satz', fr: 'Insère les feuilles dans la poire.', de: 'Stecke die Blätter in die Birne.' },
  { un: 'u4', plus: true, lz: '3', cat: 'gram', fr: 'pour la queue', de: 'für den Schwanz' },
  { un: 'u4', plus: true, lz: '3', cat: 'satz', fr: 'Enfile des raisins sur un fil de métal.', de: 'Ziehe Trauben auf einen Metallfaden auf.' },
  { un: 'u4', plus: true, lz: '3', cat: 'satz', fr: 'Prends la pâte bleue/verte/rouge.', de: 'Nimm die blaue/grüne/rote Knete.',
    tts: 'Prends la pâte bleue, verte ou rouge.' },
  { un: 'u4', plus: true, lz: '3', cat: 'satz', fr: 'Forme une grande/petite boule pour le corps.', de: 'Forme eine grosse/kleine Kugel für den Körper.',
    tts: 'Forme une grande ou petite boule pour le corps.' },
  { un: 'u4', plus: true, lz: '4', cat: 'essen', fr: 'le pain',  de: 'das Brot' },
  { un: 'u4', plus: true, lz: '4', cat: 'essen', fr: 'la pomme', de: 'der Apfel' },
  { un: 'u4', plus: true, lz: '4', cat: 'essen', fr: 'la pomme de terre', de: 'die Kartoffel' },
];

/* =====================================================================
   Von Hand gepflegt: was sich aus den Einträgen nicht ableiten lässt.
   Alle Schlüssel sind Eintrags-Kennungen (un + '|' + fr).
   ===================================================================== */

// Ein Teil ist eine Hälfte oder Variante eines Eintrags, die für sich gefragt
// wird. Meist ergeben sich die Teile aus frForms und deForms; hier stehen die
// Einträge, bei denen Klammern oder Schrägstriche im Buch mehr meinen.
const TEILE_VON_HAND = {
  'u1|ACM (activités créatrices manuelles)': [
    { fr: ['ACM', 'les activités créatrices manuelles'], de: ['Handarbeit und Werken'] },
  ],
  'u4|la tomate (cerise)': [
    { fr: ['la tomate'], de: ['die Tomate'] },
    { fr: ['la tomate cerise'], de: ['die Kirschtomate', 'die Kirsch-Tomate'] },
  ],
  'u4|Coupe l’ananas (en deux).': [
    { fr: ['Coupe l’ananas.'], de: ['Schneide die Ananas.'] },
    { fr: ['Coupe l’ananas en deux.'], de: ['Halbiere die Ananas.'] },
  ],
  'u4|Pose la fraise sur l’assiette.': [
    { fr: ['Pose la fraise sur l’assiette.'], de: ['Stelle die Erdbeere auf den Teller.', 'Lege die Erdbeere auf den Teller.'] },
  ],
  'u4|Prends la pâte bleue/verte/rouge.': [
    { fr: ['Prends la pâte bleue.'], de: ['Nimm die blaue Knete.'] },
    { fr: ['Prends la pâte verte.'], de: ['Nimm die grüne Knete.'] },
    { fr: ['Prends la pâte rouge.'], de: ['Nimm die rote Knete.'] },
  ],
  'u4|Forme une grande/petite boule pour le corps.': [
    { fr: ['Forme une grande boule pour le corps.'], de: ['Forme eine grosse Kugel für den Körper.'] },
    { fr: ['Forme une petite boule pour le corps.'], de: ['Forme eine kleine Kugel für den Körper.'] },
  ],
};

// Was die Stimme für den ganzen Eintrag spricht, wo das Weglassen der Klammer
// eine Variante verschlucken würde
const SPRICH_VON_HAND = {
  'u4|la tomate (cerise)': 'la tomate, la tomate cerise',
  'u4|la groseille (rouge)': 'la groseille, la groseille rouge',
  'u4|Coupe l’ananas (en deux).': 'Coupe l’ananas. Coupe l’ananas en deux.',
};

// Beginnt mit «un», ist aber kein Artikel vor einem Nomen: kein Artikel-Platz,
// kein Artikel-Tipp, keine Artikel-Übung
const KEIN_ARTIKEL = new Set(['u4|un peu de persil']);

// Karten, die gleich klingen: in Hör-Aufgaben nie Ablenker füreinander
const KLANGGRUPPEN = [['u2|il s’appelle, elle s’appelle', 'u2|ils s’appellent, elles s’appellent']];
// Karten, deren Formen das Ohr nicht unterscheidet: kein Diktat, Hör-Aufgaben nehmen die erste Form
const GLEICHKLANG = new Set(['u3|rencontrer des amis/amies', 'u2|marié/mariée', ...KLANGGRUPPEN.flat()]);

// Karten, deren deutsche Zeilen fast dasselbe sagen: nie zusammen in einer Auswahl
const NIE_ZUSAMMEN = [
  ['u3|aimer, j’aime', 'u3|adorer, j’adore', 'u3|j’aime beaucoup...'],
  ['u2|voici, voilà', 'u2|c’est'],
];

// Namen in den Sätzen: bleiben auf den Kacheln gross und werden nie zur Lücke
const EIGENNAMEN = ['Lionel', 'Nathalie'];

/* =====================================================================
   Abgeleitet: füllt vokabelnAufbereiten() am Ende der Datei.

   Jeder Eintrag bekommt dazu:
     nr           Platz in VOKABELN
     id           un + '|' + fr
     kid          Schlüssel der Karte: gleich id, nur das zweite «la fille»
                  teilt sich die Karte mit dem ersten
     g            Lernziel-Gruppe: 'u1-2', 'u1P-S' (P = Plus-Blatt)
     art          'satz' | 'wort' (Wendungen zählen als Wörter)
     teile        [{ fr: [Formen], de: [Formen], zeigeDe }]
     artikel      'le' | 'la' | 'les' | 'l’' | 'un' | 'une' | 'un/une' | null
     genus        'm' | 'f' | 'mf' | null
     plural       true | false
     artikelTeil  erster Teil, dessen erste Form einen Artikel trägt, sonst -1
     sprich       was die Stimme für den ganzen Eintrag spricht
     lernziele    alle Gruppen seiner Karte
     deAlle       alle deutschen Formen seiner Karte
   ===================================================================== */

const LERNZIELE = {};        // g → { key, un, plus, lz, name, eintraege }
const LERNZIEL_REIHE = [];   // die Gruppen in der Reihenfolge des Buchs
const KARTE = {};            // kid → der erste Eintrag der Karte
const KARTEN = [];           // die Karten in der Reihenfolge des Buchs

// «l’allemand (m)» → «l’allemand», «la tomate (cerise)» → «la tomate»
const ohneKlammern = s => s.replace(/\s*\([^)]*\)/g, '').replace(/\s+/g, ' ').trim();

// Eine langsame Aufnahme lohnt sich nur, wo mehr als ein Wort zu hören ist
const langsamGibt = s => /[ ’]/.test(s);

function vokabelnAufbereiten() {
  const ART_RE = /^(le |la |les |l’|un\/une |un |une )/;
  // «(m)», «(f pl)»: steht im Buch, wo der Artikel das Geschlecht nicht verrät
  const GENUS_RE = /\((m|f)( pl)?\)/;
  const GENUS_VON = { le: 'm', un: 'm', la: 'f', une: 'f', 'un/une': 'mf' };
  // «la fille» steht in Unité 2 und in Unité 3: ein Wort, also eine Karte
  const GLEICHE_KARTE = { 'u3|la fille': 'u2|la fille' };
  // «le foot, faire du foot» und «un/une élève» fassen nur zusammen, was daneben einzeln steht
  const einzeln = liste => liste.filter(f => !(liste.length > 1 && /, |\//.test(f)));

  // Läuft es ein zweites Mal, beginnt es von vorn
  LERNZIEL_REIHE.length = 0;
  KARTEN.length = 0;
  for (const g of Object.keys(LERNZIELE)) delete LERNZIELE[g];
  for (const kid of Object.keys(KARTE)) delete KARTE[kid];

  VOKABELN.forEach((e, nr) => {
    // Im Buch-Eintrag fehlt plus meist; danach ist es immer true oder false
    e.plus = e.plus === true;
    e.nr = nr;
    e.id = e.un + '|' + e.fr;
    e.kid = GLEICHE_KARTE[e.id] || e.id;
    e.g = e.un + (e.plus ? 'P' : '') + '-' + e.lz;
    e.art = e.cat === 'satz' ? 'satz' : 'wort';

    // Teile: von Hand, sonst ein Paar aus gleich vielen Formen beider Sprachen, sonst ein einziger
    const frEinzel = einzeln(e.frForms || [ohneKlammern(e.fr)]);
    const deEinzel = einzeln(e.deForms || [e.de]);
    if (TEILE_VON_HAND[e.id]) e.teile = TEILE_VON_HAND[e.id].map(t => ({ fr: t.fr.slice(), de: t.de.slice() }));
    else if (frEinzel.length === deEinzel.length && frEinzel.length >= 2) e.teile = frEinzel.map((f, i) => ({ fr: [f], de: [deEinzel[i]] }));
    else e.teile = [{ fr: frEinzel, de: deEinzel }];
    // Ein einziger Teil zeigt die Zeile aus dem Buch, eine Hälfte nur ihr eigenes Deutsch
    for (const t of e.teile) t.zeigeDe = e.teile.length > 1 ? t.de[0] : e.de;

    // Artikel und Geschlecht; Sätze haben keins von beiden
    const vorn = e.fr.match(ART_RE);
    const marke = e.fr.match(GENUS_RE);
    e.artikel = e.art === 'satz' || KEIN_ARTIKEL.has(e.id) || !vorn ? null : vorn[1].trim();
    e.genus = e.art === 'satz' ? null : marke ? marke[1] : GENUS_VON[e.artikel] || null;
    e.plural = !!(marke && marke[2]) || e.artikel === 'les';
    e.artikelTeil = e.artikel === null ? -1 : e.teile.findIndex(t => ART_RE.test(t.fr[0]));

    // Französisch geht nie durch sprechtext(): das würde es deutsch zurechtbiegen
    e.sprich = e.tts || SPRICH_VON_HAND[e.id] || ohneKlammern(e.fr);

    if (!LERNZIELE[e.g]) {
      LERNZIELE[e.g] = { key: e.g, un: e.un, plus: e.plus, lz: e.lz, name: 'Lernziel ' + e.lz, eintraege: [] };
      LERNZIEL_REIHE.push(e.g);
    }
    LERNZIELE[e.g].eintraege.push(e);

    // Die Karte ist ihr erster Eintrag. Ein zweiter bringt nur sein Lernziel und sein Deutsch mit.
    const k = KARTE[e.kid] || (KARTE[e.kid] = e);
    if (k === e) {
      KARTEN.push(e);
      e.lernziele = [];
      e.deAlle = [];
    } else {
      e.lernziele = k.lernziele;
      e.deAlle = k.deAlle;
    }
    if (!k.lernziele.includes(e.g)) k.lernziele.push(e.g);
    for (const d of [e.de, ...(e.deForms || []), ...e.teile.flatMap(t => t.de)]) {
      if (!k.deAlle.includes(d)) k.deAlle.push(d);
    }
  });
}

// Aufnahme zu einem Eintrag. Ohne teil der ganze Eintrag (Kennenlernen, Nachsprechen,
// Album), mit teil genau die Form, die eine Aufgabe zeigt: so stimmen Bild und Ton überein.
// Stimme 'f' ist das normale Tempo, 'fl' das langsame. null, wo es nichts gibt:
// langsam bei einem einzelnen Wort, oder Teil und Form existieren nicht.
function vokabelClip(e, teil, form, langsam) {
  if (!e) return null;
  let s = e.sprich;
  if (teil != null) s = e.teile[teil] && e.teile[teil].fr[form || 0];
  if (!s || (langsam && !langsamGibt(s))) return null;
  return { s, v: langsam ? 'fl' : 'f' };
}

// Selbstkontrolle: alle Zahlen, auf die sich Lernmodell, Aufnahmen und Album
// verlassen. Gibt eine Liste von Fehlertexten zurück, leer heisst alles stimmt.
function vokabelnPruefen() {
  const fehler = [];
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

  // Unités
  soll('UNITE_REIHE', UNITE_REIHE.join(' '), Object.keys(UNITES).join(' '));
  for (const un of UNITE_REIHE) {
    const u = UNITES[un];
    if (!u.name || !u.titel || !/^#[0-9A-F]{6}$/.test(u.farbe)) fehler.push('Unité unvollständig: ' + un);
  }

  // Schlüssel, Karten und Gruppen
  soll('Einträge', VOKABELN.length, 210);
  soll('verschiedene id', nachId.size, 210);
  soll('verschiedene kid', new Set(VOKABELN.map(e => e.kid)).size, 209);
  soll('Karten', KARTEN.length, 209);
  soll('Schlüssel in KARTE', Object.keys(KARTE).length, 209);
  VOKABELN.forEach((e, nr) => {
    if (e.nr !== nr || e.id !== e.un + '|' + e.fr) fehler.push('nr oder id stimmt nicht: Eintrag ' + nr);
    if (!UNITES[e.un]) fehler.push('unbekannte Unité: ' + e.id);
    if (typeof e.plus !== 'boolean') fehler.push('plus ist weder true noch false: ' + e.id);
    if (e.g !== e.un + (e.plus ? 'P' : '') + '-' + e.lz) fehler.push('Gruppe stimmt nicht: ' + e.id);
    const k = KARTE[e.kid];
    if (!k || !nachId.has(e.kid)) fehler.push('Karte fehlt: ' + e.kid);
    else {
      if (e.lernziele !== k.lernziele || e.deAlle !== k.deAlle) fehler.push('lernziele oder deAlle nicht von der Karte: ' + e.id);
      if (!k.lernziele.includes(e.g)) fehler.push('Lernziel fehlt auf der Karte: ' + e.id);
      for (const d of [e.de, ...e.teile.flatMap(t => t.de)]) if (!k.deAlle.includes(d)) fehler.push('deAlle unvollständig: ' + e.id + ' → ' + d);
    }
    // Ein gerader Apostroph ergäbe einen anderen Schlüssel und eine andere Aufnahme
    if (/['ʼ`´]/.test([e.fr, e.sprich, ...e.teile.flatMap(t => t.fr)].join(''))) fehler.push('gerader Apostroph: ' + e.id);
  });
  KARTEN.forEach((k, i) => {
    if (KARTE[k.kid] !== k || k.kid !== k.id || VOKABELN[k.nr] !== k) fehler.push('Karte ist nicht ihr erster Eintrag: ' + k.id);
    if (i && KARTEN[i - 1].nr >= k.nr) fehler.push('Karten nicht in der Reihenfolge des Buchs: ' + k.id);
  });
  soll('Karte des zweiten «la fille»', (nachId.get('u3|la fille') || {}).kid, 'u2|la fille');
  soll('Lernziele von «la fille»', (KARTE['u2|la fille'] || { lernziele: [] }).lernziele.join(' '), 'u2-2 u3-3');
  verteilung('Unité', VOKABELN, e => e.un, { u1: 50, u2: 53, u3: 50, u4: 57 });
  soll('Plus-Einträge', VOKABELN.filter(e => e.plus).length, 82);
  soll('Lernziele', LERNZIEL_REIHE.length, 25);
  soll('Schlüssel in LERNZIELE', Object.keys(LERNZIELE).join(' '), LERNZIEL_REIHE.join(' '));
  verteilung('Lernziel', VOKABELN, e => e.g, {
    'u1-1': 2, 'u1-S': 11, 'u1-2': 13, 'u1-3': 6, 'u1P-S': 3, 'u1P-2': 7, 'u1P-3': 8,
    'u2-1': 2, 'u2-2': 26, 'u2-3': 5, 'u2P-1': 4, 'u2P-2': 6, 'u2P-3': 10,
    'u3-1': 26, 'u3-3': 4, 'u3P-1': 20,
    'u4-1': 11, 'u4-2': 12, 'u4-3': 5, 'u4-S': 2, 'u4-4': 3, 'u4P-1': 9, 'u4P-2': 4, 'u4P-3': 8, 'u4P-4': 3,
  });
  let vorher = -1;
  for (const g of LERNZIEL_REIHE) {
    const z = LERNZIELE[g];
    if (z.key !== g || z.name !== 'Lernziel ' + z.lz || g !== z.un + (z.plus ? 'P' : '') + '-' + z.lz) fehler.push('Lernziel stimmt nicht: ' + g);
    if (z.eintraege.some(e => e.g !== g)) fehler.push('fremder Eintrag im Lernziel: ' + g);
    // Jedes Lernziel steht am Stück: nur so ist die Reihenfolge der Datei auch die der Lernziele
    if (z.eintraege[0].nr !== vorher + 1 || z.eintraege.some((e, i) => e.nr !== z.eintraege[0].nr + i)) fehler.push('Lernziel steht nicht am Stück: ' + g);
    vorher = z.eintraege[z.eintraege.length - 1].nr;
  }
  verteilung('Art', VOKABELN, e => e.art, { wort: 189, satz: 21 });
  // Die Wortgruppe lenkt Ablenker, Leiter (gram) und den Artikel «wie im Buch»: ein Tippfehler bliebe sonst still
  verteilung('Wortgruppe', VOKABELN, e => e.cat, { ding: 33, fach: 16, tag: 8, verb: 13, fam: 27, essen: 26, gesicht: 9, hobby: 37, gram: 20, satz: 21 });

  // Teile und Formen
  const bau = e => (TEILE_VON_HAND[e.id] ? 'von Hand' : e.teile.length > 1 ? 'Paar' : e.teile[0].fr.length > 1 ? 'Synonyme'
    : e.teile[0].de.length > 1 ? 'deutsche Varianten' : 'einfach');
  verteilung('Bau', VOKABELN, bau, { einfach: 165, Paar: 20, Synonyme: 11, 'deutsche Varianten': 8, 'von Hand': 6 });
  for (const e of VOKABELN) {
    for (const t of e.teile) {
      if (!t.fr.length || !t.de.length || [...t.fr, ...t.de].some(f => typeof f !== 'string' || !f)) fehler.push('leerer Teil: ' + e.id);
      // Schrägstrich und Klammer aus dem Buch erscheinen in keiner Aufgabe
      if (t.fr.some(f => /[/()]/.test(f))) fehler.push('Form mit Schrägstrich oder Klammer: ' + e.id);
      if (t.zeigeDe !== (e.teile.length > 1 ? t.de[0] : e.de)) fehler.push('zeigeDe stimmt nicht: ' + e.id);
    }
  }

  // Artikel und Geschlecht
  verteilung('Artikel', VOKABELN, e => e.artikel, { null: 73, le: 51, la: 51, 'l’': 8, les: 13, un: 9, une: 3, 'un/une': 2 });
  verteilung('Geschlecht', VOKABELN, e => e.genus, { m: 74, f: 60, mf: 2, null: 74 });
  soll('Geschlecht von «les parties du visage»', (nachId.get('u4|les parties du visage') || {}).genus, null);
  const mitGenus = VOKABELN.filter(e => e.genus === 'm' || e.genus === 'f');
  soll('Einträge für die Artikel-Übung', mitGenus.length, 134);
  soll('Karten für die Artikel-Übung', new Set(mitGenus.map(e => e.kid)).size, 133);
  verteilung('Knöpfe der Artikel-Übung', mitGenus, e => ({ le: 'le/la', la: 'le/la', un: 'un/une', une: 'un/une' }[e.artikel] || e.artikel),
    { 'le/la': 102, 'un/une': 12, 'l’': 8, les: 12 });
  for (const e of VOKABELN) {
    if (e.plural !== (e.artikel === 'les' || / pl\)/.test(e.fr))) fehler.push('plural stimmt nicht: ' + e.id);
    if (e.artikel === null ? e.artikelTeil !== -1 : !e.teile[e.artikelTeil]) fehler.push('artikelTeil stimmt nicht: ' + e.id);
  }
  for (const e of mitGenus) {
    const t = e.teile[e.artikelTeil];
    if (!t || !t.fr[0].startsWith(e.artikel)) fehler.push('Form der Artikel-Übung ohne den Artikel des Eintrags: ' + e.id);
  }

  // Gesprochener Text und Aufnahmen
  const texte = { wort: new Set(), form: new Set(), wortLangsam: new Set(), formLangsam: new Set() };
  for (const e of VOKABELN) {
    if (!e.sprich || /[()]/.test(e.sprich)) fehler.push('sprich leer oder mit Klammer: ' + e.id);
    const c = vokabelClip(e), l = vokabelClip(e, undefined, 0, true);
    if (!c || c.s !== e.sprich || c.v !== 'f') fehler.push('Eintrags-Clip stimmt nicht: ' + e.id);
    else texte.wort.add(c.s);
    if (!!l !== langsamGibt(e.sprich) || (l && (l.s !== e.sprich || l.v !== 'fl'))) fehler.push('langsamer Eintrags-Clip stimmt nicht: ' + e.id);
    else if (l) texte.wortLangsam.add(l.s);
  }
  for (const e of VOKABELN) {
    e.teile.forEach((t, i) => t.fr.forEach((f, j) => {
      const c = vokabelClip(e, i, j), l = vokabelClip(e, i, j, true);
      if (!c || c.s !== f || c.v !== 'f') fehler.push('Form-Clip stimmt nicht: ' + e.id + ' → ' + f);
      if (!!l !== langsamGibt(f) || (l && (l.s !== f || l.v !== 'fl'))) fehler.push('langsamer Form-Clip stimmt nicht: ' + e.id + ' → ' + f);
      if (texte.wort.has(f)) return;
      texte.form.add(f);
      if (l) texte.formLangsam.add(f);
    }));
    if (vokabelClip(e, e.teile.length) !== null || vokabelClip(e, 0, e.teile[0].fr.length) !== null) fehler.push('Clip für eine Form, die es nicht gibt: ' + e.id);
  }
  soll('Eintrags-Clips', texte.wort.size, 209);
  soll('Form-Clips', texte.form.size, 78);
  soll('langsame Eintrags-Clips', texte.wortLangsam.size, 189);
  soll('langsame Form-Clips', texte.formLangsam.size, 69);
  soll('französische Aufnahmen', texte.wort.size + texte.form.size + texte.wortLangsam.size + texte.formLangsam.size, 545);

  // Buchstaben je Wortform: bis 14 wird jeder Buchstabe gelegt, darüber fehlt nur ein Wort
  const buchstaben = (f, e) => ((e.artikel === null ? f : f.replace(/^(le |la |les |l’|un\/une |un |une )/, '')).match(/\p{L}/gu) || []).length;
  const wortformen = VOKABELN.filter(e => e.art === 'wort').flatMap(e => e.teile.flatMap(t => t.fr.map(f => buchstaben(f, e))));
  soll('Wortformen', wortformen.length, 222);
  soll('Wortformen bis 14 Buchstaben', wortformen.filter(n => n <= 14).length, 192);
  soll('Wortformen über 14 Buchstaben', wortformen.filter(n => n > 14).length, 30);

  // Die durchgerechneten Beispiele: Teile (Formen mit +, Teile mit |), Artikel, Geschlecht, Eintrags-Clip
  const BEISPIELE = [
    ['u1|les maths, les mathématiques (f pl)', 'les maths + les mathématiques = Mathematik', 'les', 'f', 'les maths, les mathématiques'],
    ['u2|un/une enfant', 'un enfant + une enfant = ein Kind', 'un/une', 'mf', 'un enfant, une enfant'],
    ['u2|la mère, la maman', 'la mère + la maman = die Mutter', 'la', 'f', 'la mère, la maman'],
    ['u4|les yeux (m pl), un œil', 'les yeux = die Augen | un œil = ein Auge', 'les', 'm', 'les yeux, un œil'],
    ['u4|le raisin vert/bleu', 'le raisin vert = die grüne Traube | le raisin bleu = die blaue Traube', 'le', 'm', 'le raisin vert ou bleu'],
    ['u4|la tomate (cerise)', 'la tomate = die Tomate | la tomate cerise = die Kirschtomate + die Kirsch-Tomate', 'la', 'f', 'la tomate, la tomate cerise'],
    ['u1|ACM (activités créatrices manuelles)', 'ACM + les activités créatrices manuelles = Handarbeit und Werken', null, null,
      'ACM, les activités créatrices manuelles'],
    ['u4|Tu coupes. Coupe.', 'Tu coupes. Coupe. = Du schneidest. Schneide!', null, null, 'Tu coupes. Coupe.'],
    ['u4|Prends la pâte bleue/verte/rouge.',
      'Prends la pâte bleue. = Nimm die blaue Knete. | Prends la pâte verte. = Nimm die grüne Knete. | Prends la pâte rouge. = Nimm die rote Knete.',
      null, null, 'Prends la pâte bleue, verte ou rouge.'],
    ['u4|Forme une grande/petite boule pour le corps.',
      'Forme une grande boule pour le corps. = Forme eine grosse Kugel für den Körper. | Forme une petite boule pour le corps. = Forme eine kleine Kugel für den Körper.',
      null, null, 'Forme une grande ou petite boule pour le corps.'],
    ['u3|aimer, j’aime', 'aimer = lieben | j’aime = ich liebe', null, null, 'aimer, j’aime'],
    ['u3|le foot, faire du foot', 'le foot = Fussball | faire du foot = Fussball spielen', 'le', 'm', 'le foot, faire du foot'],
    ['u3|rencontrer des amis/amies', 'rencontrer des amis = Freunde treffen | rencontrer des amies = Freundinnen treffen', null, null,
      'rencontrer des amis'],
    ['u3|ma passion, c’est...', 'ma passion, c’est = meine Leidenschaft ist ...', null, null, 'ma passion, c’est...'],
    ['u4|un peu de persil', 'un peu de persil = ein wenig Petersilie', null, null, 'un peu de persil', 13],
    ['u3|le hockey sur glace', 'le hockey sur glace = das Eishockey', 'le', 'm', 'le hockey sur glace', 14],
    ['u4|la rondelle de concombre', 'la rondelle de concombre = die Gurkenscheibe', 'la', 'f', 'la rondelle de concombre', 19],
    // Die übrigen Zeilen von Hand: was nicht aus dem Buch abgeschrieben ist, steht hier ein zweites Mal
    ['u4|Coupe l’ananas (en deux).', 'Coupe l’ananas. = Schneide die Ananas. | Coupe l’ananas en deux. = Halbiere die Ananas.', null, null,
      'Coupe l’ananas. Coupe l’ananas en deux.'],
    ['u4|Pose la fraise sur l’assiette.', 'Pose la fraise sur l’assiette. = Stelle die Erdbeere auf den Teller. + Lege die Erdbeere auf den Teller.',
      null, null, 'Pose la fraise sur l’assiette.'],
    ['u4|la groseille (rouge)', 'la groseille + la groseille rouge = die Johannisbeere', 'la', 'f', 'la groseille, la groseille rouge'],
  ];
  for (const id of [...Object.keys(TEILE_VON_HAND), ...Object.keys(SPRICH_VON_HAND)]) {
    if (!BEISPIELE.some(b => b[0] === id)) fehler.push('Zeile von Hand ohne Beispiel: ' + id);
  }
  for (const [id, teile, artikel, genus, sprich, n] of BEISPIELE) {
    const e = nachId.get(id);
    if (!e) { fehler.push('Beispiel fehlt: ' + id); continue; }
    soll('Teile von ' + id, e.teile.map(t => t.fr.join(' + ') + ' = ' + t.de.join(' + ')).join(' | '), teile);
    soll('Artikel von ' + id, e.artikel, artikel);
    soll('Geschlecht von ' + id, e.genus, genus);
    soll('Eintrags-Clip von ' + id, e.sprich, sprich);
    if (n) soll('Buchstaben von ' + id, buchstaben(e.teile[0].fr[0], e), n);
  }
  for (const id of ['u1|les maths, les mathématiques (f pl)', 'u4|les yeux (m pl), un œil']) soll('Mehrzahl von ' + id, (nachId.get(id) || {}).plural, true);

  // Die Listen von Hand nennen nur Einträge, die es gibt
  const LISTEN = {
    TEILE_VON_HAND: Object.keys(TEILE_VON_HAND), SPRICH_VON_HAND: Object.keys(SPRICH_VON_HAND), KEIN_ARTIKEL: [...KEIN_ARTIKEL],
    KLANGGRUPPEN: KLANGGRUPPEN.flat(), GLEICHKLANG: [...GLEICHKLANG], NIE_ZUSAMMEN: NIE_ZUSAMMEN.flat(),
  };
  for (const [name, ids] of Object.entries(LISTEN)) {
    for (const id of ids) if (!nachId.has(id)) fehler.push(name + ' nennt einen unbekannten Eintrag: ' + id);
  }
  for (const id of KEIN_ARTIKEL) if (nachId.has(id) && nachId.get(id).artikel !== null) fehler.push('KEIN_ARTIKEL wirkt nicht: ' + id);
  for (const id of KLANGGRUPPEN.flat()) if (!GLEICHKLANG.has(id)) fehler.push('Klanggruppe fehlt in GLEICHKLANG: ' + id);
  for (const name of EIGENNAMEN) {
    if (!VOKABELN.some(e => e.art === 'satz' && e.fr.split(/[ .,!?]+/).includes(name))) fehler.push('Eigenname in keinem Satz: ' + name);
  }

  return fehler;
}

vokabelnAufbereiten();

if (typeof module !== 'undefined') {
  module.exports = { UNITES, UNITE_REIHE, VOKABELN, LERNZIELE, LERNZIEL_REIHE, KARTEN, KARTE,
    TEILE_VON_HAND, SPRICH_VON_HAND, KEIN_ARTIKEL, KLANGGRUPPEN, GLEICHKLANG, NIE_ZUSAMMEN, EIGENNAMEN,
    ohneKlammern, langsamGibt, vokabelClip, vokabelnAufbereiten, vokabelnPruefen };
}
