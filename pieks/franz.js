'use strict';

/* =====================================================================
   SPRACHKURSE: das Hörnchen unterrichtet, Pieks lernt mit
   Hier läuft die Runde: planen (lernen.js), jede Aufgabe bauen und
   zeigen (uebungen.js), urteilen, verbuchen, zahlen, speichern und
   antworten. Dazu die Karte auf der Lichtung, das erste Treffen, der
   kurze Gruss, das Wörterheft im Album, der Block für die Eltern und
   die Erfolge des Kurses.

   Ein Kurs ist Kurs(cfg): dieselbe Maschine für jede Sprache. Was nur
   eine Sprache und ihre Lehrerin ausmacht (Texte, Figur, Szene des
   ersten Treffens, Bilder der Stufen, Erfolge …), steht in cfg; für
   Französisch in KURS_FRANZ unten. Franz = Kurs(KURS_FRANZ) ist, was
   app.js kennt. Die Bühne (section#franz mit Karte und Eingabe) gibt es
   nur einmal: Buehne hört dort zu und gibt jeden Tipp an den Kurs
   weiter, der gerade unterrichtet.

   Beim Laden wird nur deklariert: Den Stand liest Franz.einrichten(),
   das app.js beim Start ruft. Gespeichert wird unter nea.igel.franz,
   und zwar im Augenblick jedes Urteils: Wer mitten in der Runde nach
   Hause geht, verliert nichts.
   ===================================================================== */

const FRANZ_KEY = 'nea.igel.franz';
let frStand = null;   // füllt Franz.einrichten(); danach nie wieder null

/* =====================================================================
   DIE BÜHNE: Karte, Eingabe und Blase des Kurs-Bildschirms gibt es nur
   einmal. Ihre Zuhörer hängen genau einmal (sonst begänne «Noch eine
   Runde» zwei Runden), ebenso die Sperre gegen Doppeltipps und das
   Gleiten der Figuren. Jeder Kurs meldet sich beim Bauen an; was auf
   der Bühne geschieht, geht an den, der gerade dran ist (aktiv). Jede
   Lehrerin hat dort ihren eigenen Platz (cfg.ids.buehne), zu sehen ist
   nur der des aktiven Kurses. Der kleine Pieks daneben gehört allen.
   ===================================================================== */
const Buehne = (() => {
  const kurse = [], griffe = new Map();
  let eingerichtet = false;
  // Sperre gegen Doppeltipps: Nach jedem Aufbau, der neue Knöpfe unter den Finger legt, zählt
  // ein Tipp erst nach 350 ms. Tasten und Kacheln in einer Aufgabe sperren nie.
  let sperreBis = 0, schluck = false, knopfZeit = 0;
  const B = {
    // Der Kurs, der zuletzt die Bühne übernommen hat. Er bleibt es, bis ein anderer sie übernimmt, auch auf
    // der Lichtung: Wer wissen will, wer gerade unterrichtet, fragt zuerst nach bildschirm === 'franz'.
    aktiv: null,
    gast: null,    // der kleine Pieks neben der Lehrerin
    kurse: () => kurse.slice(),
    // Jeder Kurs beim Bauen: er selbst und was die Bühne bei ihm auslösen darf
    anmelden(kurs, griff) {
      kurse.push(kurs);
      griffe.set(kurs, griff);
    },
    sperren() { sperreBis = performance.now() + 350; },
    // Für wach(): Setzte der letzte Finger nicht eben auf einem Knopf auf?
    nebenKnopf: () => performance.now() - knopfZeit > 50,
    schlucken() { schluck = true; },
    einrichten,
    uebernehmen,
  };
  const griff = () => griffe.get(B.aktiv);

  // Quer stehen die Figuren direkt auf der Eingabe (stil.css), und die ist bei jeder Übungsart anders hoch.
  // Rückt sie die Figuren (oder streckt eine lange Blase ihre Zeile), gleiten sie an den neuen Platz, statt zu
  // springen. Verglichen wird, wo das Layout sie hinstellt (ohne Transform): So beginnt jedes Gleiten dort,
  // wo die Figur zu sehen ist, auch mitten in einem anderen, und auch, wenn die Figuren auf niedrigen
  // Bildschirmen über ihre Zeile hinausragen und weniger weit rücken als sie. Nicht beim Öffnen des
  // Bildschirms und nicht, wenn sich das Fenster ändert: Dann ist alles neu.
  // Die Plätze der Lehrerinnen zählen bei jedem Mal neu: auch der eines Kurses, der erst später dazukam.
  function figurenGleiten() {
    const fig = document.querySelector('.fr-figur'), ein = $('frEingabe'), blase = $('blaseFranz');
    if (!fig || typeof ResizeObserver === 'undefined') return;
    const quer = matchMedia('(min-aspect-ratio: 1001/1000) and (min-width: 761px)');
    const teile = () => [...kurse.map(k => $(k.kurs.ids.buehne)), $('franzPieks'), blase, ein].filter(Boolean);
    const lage = el => {
      let x = 0, y = 0;
      for (let e = el; e; e = e.offsetParent) { x += e.offsetLeft; y += e.offsetTop; }
      return { x, y, h: el.offsetHeight };
    };
    let alt = new Map(), fenster = '';
    const ro = new ResizeObserver(() => {
      const f = innerWidth + 'x' + innerHeight, gleich = f === fenster;
      fenster = f;
      const neu = new Map();
      for (const el of teile()) if (el.offsetParent) neu.set(el, lage(el));
      const vorher = alt;
      alt = neu;
      if (!gleich) return;
      for (const [el, b] of neu) {
        const a = vorher.get(el);
        if (!a) continue;
        let dx = a.x - b.x, dy = a.y - b.y;
        // Quer hängt die Blase unten an den Figuren: Es zählt ihr unterer Rand (oben wächst sie mit dem Text).
        // Hochkant steht sie neben ihnen und wächst aus der Mitte, da gleitet sie nicht.
        if (el === blase) {
          if (!quer.matches) continue;
          dx = 0; dy = (a.y + a.h) - (b.y + b.h);
        }
        // Wird die Eingabe quer höher, schiebt sie die Figuren vor sich her, statt sie kurz zu verdecken.
        // Ohne Bewegung wächst sie einfach (die Figuren blenden um, hinGleiten in app.js).
        if (el === ein) {
          if (reduce || !quer.matches || dy <= 0) continue;
          dx = 0;
        }
        if (Math.abs(dx) < 1 && Math.abs(dy) < 1) continue;
        // Gleitet es schon, geht es von dort aus weiter, wo es gerade zu sehen ist
        const t = getComputedStyle(el).translate, [tx = 0, ty = 0] = t && t !== 'none' ? t.split(' ').map(parseFloat) : [];
        el.getAnimations().forEach(an => { if (an.id === 'gleiten') an.cancel(); });
        hinGleiten(el, { translate: `${dx + tx}px ${dy + ty}px`, scale: '1' }, 400);
      }
    });
    for (const el of [fig, ein, blase]) ro.observe(el);
  }

  // Was die Bühne braucht. Fehlt etwas, wirft einrichten(), bevor irgendetwas hängt: Der Kurs bleibt dann weg
  // (app.js), und der nächste versucht es von vorn, statt auf einer halb eingerichteten Bühne zu stehen.
  const TEILE = ['franz', 'franzPieks', 'blaseFranz', 'frEingabe', 'frPruefen', 'frWeissNicht', 'frWeiter', 'frKarte', 'frFeld'];

  // Einmal, beim Einrichten des ersten Kurses: der kleine Pieks, das Gleiten und alle Zuhörer der Bühne
  function einrichten() {
    if (eingerichtet) return;
    const fehlt = TEILE.filter(id => !$(id));
    if (fehlt.length) throw new Error('Der Bühne fehlt ' + fehlt.map(id => '#' + id).join(', '));
    eingerichtet = true;
    B.gast = pieksEinsetzen($('franzPieks'));
    B.gast.addEventListener('pointerdown', () => { audio(); Ton.kitzeln(); stimmung(B.gast, 'kitzel', 600); });
    figurenGleiten();
    $('frPruefen').addEventListener('click', () => { const g = griff(); if (g) g.pruefen(); });
    $('frWeissNicht').addEventListener('click', () => { const g = griff(); if (g) g.weissNicht(); });
    $('frWeiter').addEventListener('click', () => { const g = griff(); if (g) g.weiter(); });
    $('frKarte').addEventListener('click', e => { const g = griff(); if (g) g.karteKlick(e); });
    $('frFeld').addEventListener('click', e => { const g = griff(); if (g) g.feldKlick(e); });
    // Doppeltipp: Der zweite Tipp landet nicht auf dem, was der erste eben unter dem Finger gebaut hat.
    // Geschluckt wird nur ein Tipp, dessen Finger in der Sperre aufsetzte, und genau sein Klick: Der Klick
    // des ersten Tipps kommt durch (uebungen.js zählt ihn), Tastatur, Vorlese-Hilfen und Skripte auch.
    $('franz').addEventListener('pointerdown', e => {
      schluck = e.isTrusted && performance.now() < sperreBis;
      // Für wach(): Setzt dieser Finger auf einem Knopf auf?
      knopfZeit = e.target.closest && e.target.closest('button') ? performance.now() : 0;
      if (schluck) {
        e.preventDefault();
        e.stopPropagation();
      }
    }, true);
    $('franz').addEventListener('click', e => {
      if (!schluck || !e.isTrusted || e.detail === 0) return;
      schluck = false;
      e.preventDefault();
      e.stopPropagation();
    }, true);
    // Eigene Knöpfe behalten den Fokus nicht: sonst löste die Leertaste den zuletzt getippten noch einmal aus
    $('franz').addEventListener('mousedown', e => { if (e.target.closest('.fr-eingabe button, .fr-karte button')) e.preventDefault(); });
    // Am nächsten Tag fortgesetzt: die Karte von heute statt der von gestern (neuerTag)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) return;
      const g = griff();
      if (g) g.neuerTag();
    });
  }

  // Ein Kurs betritt die Bühne (vor zeigeBildschirm): Ein anderer, der noch dran war, hört auf, und nur
  // seine Lehrerin steht da. data-kurs am Bildschirm ist der Haken für Farben eines Kurses (CSS).
  function uebernehmen(kurs) {
    if (B.aktiv && B.aktiv !== kurs) {
      const g = griff();
      if (g) g.aufhoeren();
    }
    B.aktiv = kurs;
    for (const k of kurse) {
      const platz = $(k.kurs.ids.buehne);
      if (platz) platz.hidden = k !== kurs;
    }
    $('franz').dataset.kurs = kurs.kurs.key;
  }

  return B;
})();

/* =====================================================================
   EIN KURS: Kurs(K) baut ein Objekt wie Franz, mit eigenem Stand,
   eigener Karte, eigenem Wörterheft, Eltern-Block und Erfolgen.
   K ist die Beschreibung des Kurses (KURS_FRANZ zeigt jedes Feld). Beim
   Bauen wird K nur gelesen, wo es nichts aus anderen Dateien braucht;
   alles andere erst beim Einrichten und danach.
   Texte: Der Code nennt jede Liste wie bei Pirouette (h_… die Lehrerin,
   p_… Pieks im Kurs). K.texte.vorsilbe sagt, wie sie im Kurs heissen
   (h_richtig → o_richtig), K.texte.namen nennt Ausnahmen beim vollen
   Namen (p_fr_start → pi_start); Französisch behält jeden Namen.
   ===================================================================== */
function Kurs(K) {
  // Die Lehrerin auf der Lichtung, auf der Bühne und der kleine Pieks daneben (gehört der Bühne)
  const svg = { held: null, buehne: null, gast: null };
  const WER = K.lehrer.wer;
  let kursStand = null;   // der Lernstand dieses Kurses (gespeichert unter K.speicher)
  // Wortschatz und Lernen des Kurses, einmal geholt
  let wortschatz = null;
  const V = () => wortschatz || (wortschatz = K.V);
  const L = () => K.lernen;

  // Ohne Urteil: kennen, echo, paare. Gebaute Antworten mit Nachbauen nach «falsch».
  const OHNE_URTEIL = ['kennen', 'echo', 'paare'];
  const GEBAUT = ['legen', 'schreiben', 'ordnen', 'bauen'];
  const KETTE = { richtig: 'ok', fast: 'fast', falsch: 'falsch' };
  const beurteilt = s => !!s && !OHNE_URTEIL.includes(s.uebung);
  // Diese Schritte gehen nur mit Ton: ohne ihn baut Lernen.ohneTon einen Ersatz
  const brauchtTon = s => s.uebung === 'hoeren' || s.uebung === 'lauschen' || s.uebung === 'echo' || s.vorgabe === 'ton';

  const heuteTag = () => L().tag(new Date());
  const T = K.texte, NAMEN = T.namen || {};
  // Wie eine Liste im Kurs heisst: eine Ausnahme aus T.namen, sonst mit der Vorsilbe des Kurses
  const lehrerName = name => NAMEN[name] || (name.startsWith('h_') ? T.vorsilbe.lehrer + name.slice(2) : name);
  const pieksName = name => NAMEN[name] || (name.startsWith('p_') ? T.vorsilbe.pieks + name.slice(2) : name);
  const liste = name => T.lehrer[lehrerName(name)];
  // Zeilen, die nur stimmen, solange sie die einzige Lehrerin neben Pieks ist (T.nurAllein: Liste → Nummern),
  // kommen nicht mehr, sobald ein anderer Kurs mit seiner Figur auf der Lichtung steht (figurDa in app.js:
  // vorgestellt und da; ein Kurs, der beim Einrichten scheiterte, zählt nicht). Gezogen wird wie immer; trifft
  // es eine solche Zeile, noch einmal: Der Beutel verliert sie so bis zum nächsten Mischen.
  const nichtAllein = () => Buehne.kurse().some(k => k !== self && figurDa(k.kurs.lehrer.wer));
  function hz(name) {
    const voll = lehrerName(name), nur = T.nurAllein && T.nurAllein[voll];
    let z = zieh(voll, T.lehrer);
    if (!nur || !nichtAllein()) return z;
    const weg = nur.map(i => (T.lehrer[voll] || [])[i]);
    for (let n = 0; weg.includes(z) && n < 3; n++) z = zieh(voll, T.lehrer);
    return weg.includes(z) ? null : z;
  }
  const pz = name => zieh(pieksName(name), T.pieks);
  // Eine Zeile, die der Kurs mit Namen nennt ({ liste, nr }), statt sie zu ziehen
  const zeileNr = z => (liste(z.liste) || [])[z.nr];
  // Die Fremdsprache in der Blase: fett, ohne graue Klammern, genau wie es klingt
  const frB = text => '<b lang="' + K.lang + '">' + esc(V().ohneKlammern(String(text || ''))) + '</b>';
  // Zum Eintrags-Clip steht in der Blase, was er sagt: «la tomate, la tomate cerise», nicht nur «la tomate»
  const frZuClip = clip => '<b lang="' + K.lang + '">' + esc(clip.s) + '</b>';
  const ortName = e => V().UNITES[e.un].name + ' · ' + V().LERNZIELE[e.g].name + (e.plus && K.buch ? ' · ' + K.buch.plus : '');
  const deVon = a => (a.e && a.e.teile[a.teil] ? a.e.teile[a.teil].zeigeDe : a.de || '');
  // Was uebungen.js von diesem Kurs braucht: Sprache, sein Lernen (es urteilt über Getipptes und Gelegtes),
  // Tastatur, Bildchen der Stufen, Merkhilfen. Die Tastatur steht im Sprachprofil seines Lernens (S.tastatur,
  // dasselbe, das pruefe.mjs prüft); hat das Lernen keines, gilt die französische von uebungen.js.
  // Welche Übungen es gibt, sagt K.uebungen (fehlt es, alle: Französisch).
  const UE = {
    key: K.key, lang: K.lang, sprache: K.name, stufen: K.stufen.symbol,
    lernen: L,
    get tastatur() { const S = L().SPRACHE; return (S && S.tastatur) || Uebungen.FRANZ.tastatur; },
    merkhilfen: () => T.merk,
    ...(K.uebungen ? { uebungen: K.uebungen } : {}),
  };
  // Welche Zeilen zu einem ersten Fehlversuch passen (tippZeilen); jede Tafel darf fehlen
  const kursTipps = K.tipps || {};

  /* ---------- Zustand ---------- */

  let R = null;          // die laufende Runde
  let lauf = null;       // die Aufgabe, die gerade auf der Karte steht
  let zustand = 'aus';   // was der Kurs-Bildschirm zeigt: 'aus' | 'frage' | 'runde' | 'ernte' | 'leer' | 'bereit'
  let kartenTag = null;  // an welchem Tag die leere Karte, die Ernte oder die Karte «Ein neuer Tag» kam (neuerTag)
  // Jeder Wechsel auf dem Bildschirm zählt hoch. Ein Ablauf, der auf etwas wartet, sieht daran,
  // ob er danach noch dran ist.
  let zug = 0;
  let tipps = 0;         // jeder Fingertipp irgendwo (wach): das erste Treffen hört dann auf
  let szeneWeg = null;   // läuft das erste Treffen, holt das sie und ihre Karte sofort hervor
  let warteId = 0;
  // Auf der Bühne, und dieser Kurs unterrichtet dort
  const amZug = () => bildschirm === 'franz' && Buehne.aktiv === self;
  const aktuell = l => !!l && l === lauf && amZug();

  // Solange ein Fenster offen ist (die Garderobe über die Äpfel, das Album), wartet, was die Runde sagen
  // will: Es ginge sonst in die Blase der Garderobe, und steht dort Pieks, bliebe es ungehört. Erfüllt
  // sich mit true, sobald das Fenster zu ist und gilt() noch stimmt.
  function fensterAbwarten(gilt) {
    const f = $('fenster');
    if (f.hidden) return Promise.resolve(!!gilt());
    return new Promise(ok => {
      const w = new MutationObserver(() => {
        if (!f.hidden) return;
        w.disconnect();
        ok(!!gilt());
      });
      w.observe(f, { attributes: true, attributeFilter: ['hidden'] });
    });
  }
  const imFreien = l => fensterAbwarten(() => aktuell(l));

  function sichern() {
    try { localStorage.setItem(K.speicher, JSON.stringify(kursStand)); } catch (e) { /* privater Modus o.ä. */ }
  }

  // Zahlen für Karte, Gruss und Album. Ein kaputter Stand darf die Kopfzeile nie aufhalten.
  const KEINE_ZAHLEN = { gekannt: 0, frucht: 0, reif: 0, stufen: [0, 0, 0, 0, 0, 0], aktiv: 0, aktivFrucht: 0,
    faellig: 0, morgen: 0, neuFrei: 0, jung: 0, proUnite: {}, schwer: [] };
  function zahlen() {
    try { return L().zahlen(kursStand, heuteTag()); } catch (e) { return KEINE_ZAHLEN; }
  }

  /* ---------- Einrichten ---------- */

  function lehrerEinsetzen(platz) {
    platz.innerHTML = K.lehrer.svg();
    const s = platz.querySelector('svg');
    anziehen(s);
    return s;
  }

  // Einmal beim Start: Stand lesen, Figuren einsetzen, zuhören, Karte zeichnen
  function einrichten() {
    let roh = null;
    try { roh = JSON.parse(localStorage.getItem(K.speicher) || 'null'); } catch (e) { roh = null; }
    try { kursStand = L().pruefen(roh); } catch (e) { kursStand = L().neu(); }
    if (K.merke) K.merke(kursStand);

    svg.held = lehrerEinsetzen($(K.ids.held));
    svg.buehne = lehrerEinsetzen($(K.ids.buehne));
    Buehne.einrichten();
    svg.gast = Buehne.gast;
    svg.held.addEventListener('pointerdown', () => kitzelnLehrer(svg.held));
    // Auf dem Kurs-Bildschirm nur ein Laut: ein Satz schnitte das Wort ab, das gerade dran ist
    svg.buehne.addEventListener('pointerdown', () => { audio(); K.lehrer.laut(); stimmung(svg.buehne, 'kitzel', 600); });

    $(K.ids.start).addEventListener('click', () => starten('runde'));
    $(K.ids.woerter).addEventListener('click', () => { Ton.tipp(); fensterAuf('album', K.tab); });
    $(K.ids.auswahl).addEventListener('click', () => { Ton.tipp(); fensterAuf('album', auswahlZiel()); });
    karteZeichnen();
  }

  /* ---------- Wo der Kurs steht ---------- */

  // Die Kapitel, aus denen Nea gerade etwas übt (ein Lernziel ist gewählt), in ihrer Reihe
  const geuebteKapitel = () => V().UNITE_REIHE.filter(un => V().LERNZIEL_REIHE.some(g => V().LERNZIELE[g].un === un && kursStand.ziele[g]));
  // Das Kapitel, bei dem der Kurs steht: Chip «Auswahl», die Karte ohne Aufgabe, wo das Heft aufgeht. Mit der
  // Frage nach der Schule (K.kapitel.frage) ist es Neas Antwort, auch wenn sie anderes dazunimmt: die Unité der
  // Klasse. Ohne Frage gibt es keine Antwort, dann ist es das letzte Kapitel, aus dem sie gerade übt: Es wandert
  // mit, wenn sie im Heft weiterschaltet oder das nächste Lernziel annimmt. null: noch keines (Chip «Auswahl»).
  // kursStand.unite bleibt dort, wo der Kurs begann: Ab da sucht Lernen das nächste Lernziel.
  function kapitel() {
    if (K.kapitel.frage) return kursStand.unite;
    const k = geuebteKapitel();
    return k.length ? k[k.length - 1] : null;
  }
  // Wo «Auswahl» das Heft aufschlägt: beim Kapitel; vor dem ersten Start ohne eines beim ersten (dort beginnt
  // der Kurs), danach ohne eines in der Übersicht aller Kapitel
  const auswahlZiel = () => {
    const un = kapitel() || (kursStand.unite === null ? V().UNITE_REIHE[0] : null);
    return K.tab + (un ? ':' + un : '');
  };

  /* ---------- Lichtung: die Karte ---------- */

  // Vor dem ersten Treffen ist weder sie noch ihre Karte zu sehen. Im Treffen selbst kommen beide
  // erst, wenn sie dran sind (noch): Bis dahin steht Pieks allein, und nichts hält ihnen den Platz frei.
  const noch = { sie: false, karte: false };
  function lichtungZeigen() {
    const da = !!kursStand.vorgestellt;
    $(K.ids.held).hidden = !da || noch.sie;
    $(K.ids.karte).hidden = !da || noch.karte;
    // Wie viele neben Pieks stehen, zählt die Lichtung selbst (app.js): Jeder Kurs zeigt nur seine Figur
    heldZeigen();
  }
  // Was auf der Lichtung Platz macht, wenn sie oder ihre Karte dazukommt: Pieks, die anderen Lehrerinnen,
  // die Blase und alles in der Wahl (es gleitet hin, gleiten() in app.js). Die Karten der Kurse stehen in
  // ihrer eigenen Reihe (#sprachen), die als Ganzes mitgleitet; wie die Karten darin zusammenrücken, wenn
  // ihre dazukommt, macht kartenRuecken() in app.js (kommen, unten).
  const lichtungTeile = () => [$('heldPieks'), ...Buehne.kurse().filter(k => k !== self).map(k => $(k.kurs.ids.held)),
    $('blaseHome'), ...document.querySelectorAll('.wahl > *')];

  // Die Zeile unter dem Namen des Kurses (1.1): was heute wartet, die erste passende gewinnt
  function infoZeile(z) {
    if (kursStand.unite === null) return 'Tippe hier, wir fangen an!';
    if (!z.aktiv) return 'Wähle zuerst, was du üben willst';
    const neu = z.neuFrei, alt = z.faellig;
    const neuText = neu === 1 ? '1 neues Wort' : neu + ' neue Wörter';
    if (neu > 0 && alt > 0) return neuText + ' · ' + alt + ' zum Wiederholen';
    if (alt > 0) return alt === 1 ? '1 Wort wartet auf dich' : alt + ' Wörter warten auf dich';
    if (neu > 0) return neuText + (neu === 1 ? ' wartet' : ' warten');
    return 'Für heute alles geübt' + (z.morgen > 0 ? ' · morgen ' + z.morgen : '');
  }

  // Läuft bei jedem kopfZeigen() auf der Lichtung: billig und ohne Wurf
  function karteZeichnen() {
    if (!kursStand) return;
    lichtungZeigen();
    const z = zahlen();
    $(K.ids.info).textContent = infoZeile(z);
    const anteil = z.aktiv ? z.aktivFrucht / z.aktiv : 0;
    $(K.ids.balken).style.width = Math.round(anteil * 100) + '%';
    $(K.ids.balken).parentElement.title = z.aktivFrucht + ' von ' + z.aktiv + ' Wörtern ' + K.stufen.mit;
    $(K.ids.woerter).textContent = 'Wörter ' + z.gekannt + '/' + V().VOKABELN.length;
    const un = kapitel();
    $(K.ids.auswahl).textContent = un ? V().UNITES[un].name : 'Auswahl';
    // Der rote Punkt bleibt, bis die erste Runde beginnt (die beginnt mit der Wahl der Unité)
    const karte = $(K.ids.karte), punkt = karte.querySelector(':scope > .neu-punkt');
    if (kursStand.unite === null && !punkt) karte.insertAdjacentHTML('beforeend', '<i class="neu-punkt" aria-hidden="true"></i>');
    else if (kursStand.unite !== null && punkt) punkt.remove();
  }

  /* ---------- Bewegungen ---------- */

  // Die Bewegungen der Lehrerin (K.lehrer.bewegungen): nie zwei zugleich, weg nach ihrem Ende
  function bewegung(s, klasse) {
    if (!s || (klasse === K.lehrer.drehung && reduce)) return;
    s.classList.remove(...K.lehrer.bewegungen);
    void s.getBoundingClientRect();
    s.classList.add(klasse);
    let uhr = 0;
    const weg = () => { clearTimeout(uhr); s.classList.remove(klasse); s.removeEventListener('animationend', ende); };
    // Nur das Ende der Bewegung selbst zählt, nicht das eines Blinzelns darin
    const ende = e => { if (K.lehrer.bewegungEnde.test(e.animationName || '')) weg(); };
    s.addEventListener('animationend', ende);
    // Falls das Ende nie gemeldet wird (Seite im Hintergrund): nach spätestens zwei Sekunden
    uhr = setTimeout(weg, 2000);
  }

  /* ---------- Antippen ---------- */

  let kitzelZeit = [], kitzelNr = 0;
  // Ein Wort pro Kalendertag, aus den Wörtern, die schon wachsen (Sätze nicht: «Mein Wort des Tages»)
  function wortDesTages() {
    const wahl = V().KARTEN.filter(e => e.art === 'wort' && L().zustand(kursStand, e.kid).st >= 1);
    if (!wahl.length) return null;
    const [j, m, d] = heuteTag().split('-').map(Number);
    const e = wahl[Math.round(Date.UTC(j, m - 1, d) / 864e5) % wahl.length];
    const clip = V().vokabelClip(e);
    if (Stimme.hat(clip) === false) return null;
    return { html: frZuClip(clip) + ' = ' + esc(e.de), clip };
  }
  // Auf der Lichtung und in der Garderobe: ihr Laut, kichern, fünfmal schnell eine Drehung (oder was der Kurs
  // dafür nennt, K.lehrer.kitzelBewegung: Der Otter schüttelt sich)
  function kitzelnLehrer(s) {
    if (!s) return;
    audio();
    K.lehrer.laut();
    stimmung(s, 'kitzel', 600);
    const jetzt = Date.now();
    kitzelZeit = kitzelZeit.filter(t => jetzt - t < 7000).concat(jetzt);
    if (kitzelZeit.length >= 5) {
      kitzelZeit = [];
      bewegung(s, K.lehrer.kitzelBewegung || K.lehrer.drehung);
    }
    // Jeder Tipp zählt: Was ein früherer Tipp noch sagen wollte, fällt weg
    const meins = ++kitzelNr;
    const wort = Math.random() < 0.5 && stand.stimme !== false ? wortDesTages() : null;
    if (!wort) {
      sagAls(WER, hz('h_kitzeln'));
      return;
    }
    // Der Vorspann kommt nie ohne sein Wort (5.3): erst die Aufnahme bereit machen, höchstens
    // anderthalb Sekunden, sonst kichert sie nur. Ist Nea inzwischen woanders (Runde, Fenster),
    // sagt sie nichts mehr: Der Satz fiele dort dem ins Wort, was gerade dran ist.
    const wo = bildschirm + '|' + fensterArt;
    Stimme.bereit([wort.clip]).then(([ok]) => {
      if (meins !== kitzelNr || bildschirm + '|' + fensterArt !== wo) return;
      if (ok) sagMehrAls(WER, [hz('h_wort_vor'), wort]);
      else sagAls(WER, hz('h_kitzeln'));
    });
  }

  /* ---------- Erstes Treffen und Gruss ---------- */

  // Das erste Treffen (1.2). Wie es abläuft, erzählt der Kurs (K.treffen); hier steht, was für jedes gilt:
  // Gespeichert ist sie schon vor dem ersten Wort. Bis sie dran ist, steht Pieks allein da, und Platz für sie
  // und ihre Karte gibt es erst, wenn sie kommen. Tippt Nea irgendwo hin, hört die Szene auf, und sie steht
  // einfach da. true: Die Szene lief ganz.
  async function erstesTreffen(ganz) {
    kursStand.vorgestellt = true;
    sichern();
    const held = $(K.ids.held), karte = $(K.ids.karte);
    const szene = ganz && bildschirm === 'lichtung' && $('fenster').hidden;
    if (szene) noch.sie = noch.karte = true;
    karteZeichnen();
    if (!szene) return false;
    const ab = tipps;
    const gilt = () => tipps === ab && bildschirm === 'lichtung' && $('fenster').hidden;
    // Pieks und die Wahl gleiten zur Seite, statt zu springen. Kommen beide auf einmal (Nea tippt), ist das
    // ein einziges Gleiten: Ein zweites mässe sonst mitten im ersten. Steht schon eine Karte in der Reihe,
    // rückt sie für ihre zusammen (kartenRuecken misst vorher und bewegt nachher).
    const kommen = (sie, k) => {
      if (!(sie && noch.sie) && !(k && noch.karte)) return;
      const ruecken = k && noch.karte ? kartenRuecken(karte) : null;
      gleiten(lichtungTeile(), () => {
        if (sie) noch.sie = false;
        if (k) noch.karte = false;
        lichtungZeigen();
      });
      if (ruecken) ruecken();
    };
    // Ihre Karte springt herein
    const karteKommt = () => {
      kommen(false, true);
      if (!reduce) {
        karte.classList.add('kommt');
        setTimeout(() => karte.classList.remove('kommt'), 700);
      }
    };
    // Tippt Nea irgendwo hin, steht sie sofort da; die Szene endet nach dem Satz, der gerade läuft
    szeneWeg = () => kommen(true, true);
    try {
      return !!(await K.treffen({
        held, karte, svg, gilt, bewegung, karteKommt,
        kommt: () => kommen(true, false),
        gehoert: () => { kursStand.gehoert = true; sichern(); },
      }));
    } finally {
      szeneWeg();
      szeneWeg = null;
    }
  }

  // Nach Pieks' Gruss (wecken in app.js). Das Versprechen erfüllt sich immer: die Besucher warten darauf.
  // Mit true, wenn Nea noch zuhört (nichts unterbrach), so kann app.js den nächsten Kurs grüssen lassen.
  async function begruessen(ganz) {
    try {
      if (!kursStand.vorgestellt) return await erstesTreffen(!!ganz);
      if (ganz && bildschirm === 'lichtung' && $('fenster').hidden && Math.random() < 0.5) {
        return await sagAls(WER, hz(zahlen().faellig > 0 ? 'h_gruss_faellig' : 'h_gruss'));
      }
      return !!ganz;
    } catch (e) {
      // Ein Fehler soll sichtbar werden, aber die Besucher nicht aufhalten
      setTimeout(() => { throw e; });
      return false;
    }
  }

  /* ---------- Bildschirm und Karte ---------- */

  function knoepfeAus() {
    for (const id of ['frPruefen', 'frWeissNicht', 'frWeiter']) {
      $(id).hidden = true;
      $(id).disabled = false;
    }
  }
  // Eigene Zustände der Karte und der Eingabe (die Feldarten gehören uebungen.js)
  function karteKlasse(k) {
    $('frKarte').classList.remove('ernte', 'frage', 'leer');
    if (k) $('frKarte').classList.add(k);
  }
  function eingabeKlasse(k) {
    $('frEingabe').classList.remove('ende');
    if (k) $('frEingabe').classList.add(k);
    $('frEingabe').hidden = false;
  }
  function loesungWeg() {
    const box = $('frLoesung');
    box.hidden = true;
    box.innerHTML = '';
    box.classList.remove('hinweis');
  }
  // Alles der letzten Runde weg: Wer noch wartet, ist nicht mehr dran
  function aufhoeren() {
    zug++;
    lauf = null;
    R = null;
    zustand = 'aus';
    clearTimeout(warteId);
    Uebungen.aufraeumen();
    knoepfeAus();
  }
  // Leere Karte für etwas, das keine Aufgabe ist (Unité-Frage, Ernte, nichts zu tun)
  function karteLeeren(klasse) {
    Uebungen.leeren();
    knoepfeAus();
    loesungWeg();
    $('frFaktKarte').hidden = true;
    karteKlasse(klasse);
    $('frBelohnung').hidden = true;
  }
  function bildschirmAuf() {
    Buehne.uebernehmen(self);
    if (bildschirm !== 'franz') zeigeBildschirm('franz');
    zielAuf(WER);
    blaseLeeren();
  }

  /* ---------- Start ---------- */

  // Tipp auf die Karte, der Kurs im Menü, «Noch eine Runde», «Frei üben», «Für den Test üben»
  function starten(modus = 'runde', gruppe = null) {
    Buehne.sperren();
    audio();
    Ton.tipp();
    Stimme.stopp();
    if (!$('fenster').hidden) fensterZu();
    $('stufenMenue').hidden = true;
    aufhoeren();
    // Ohne gewähltes Lernziel gibt es keine Runde: das Wörterheft geht auf (3.9)
    if (kursStand.unite !== null && !zahlen().aktiv && !(modus === 'frei' && gruppe)) return keineAuswahl();
    bildschirmAuf();
    const rede = vorstellen();
    modus = modus === 'frei' ? 'frei' : 'runde';
    // Zuerst die Unité, dann das, was gewünscht war (auch «Für den Test üben» aus dem Wörterheft).
    // Ein Kurs ohne Frage (K.kapitel.frage leer) beginnt mit seinem ersten Kapitel. Hat Nea vorher im Heft
    // schon selbst gewählt, gilt ihre Wahl: Der Kurs beginnt beim ersten Kapitel daraus, nichts kommt dazu.
    if (kursStand.unite === null && K.kapitel.frage) uniteFragen(rede, { modus, gruppe });
    else {
      if (kursStand.unite === null) {
        const eigene = geuebteKapitel()[0];
        if (eigene) {
          kursStand.unite = eigene;
          sichern();
        } else kapitelNehmen(V().UNITE_REIHE[0]);
      }
      rundeBeginnen(modus, gruppe, rede);
    }
    kopfZeigen();
  }

  // Wer ihre Vorstellung auf der Lichtung übersprungen hat, hört sie hier, einmal
  function vorstellen() {
    if (kursStand.gehoert) return Promise.resolve(true);
    return sagAls(WER, hz('h_vorstellen_kurz')).then(ganz => {
      if (ganz) {
        kursStand.gehoert = true;
        sichern();
      }
      return ganz;
    });
  }

  function keineAuswahl() {
    // Hinter dem Wörterheft steht die Lichtung, nicht eine alte Karte
    if (bildschirm === 'franz') {
      zeigeBildschirm('lichtung');
      themenZeichnen();
      kopfZeigen();
    }
    // Hier spricht sie selbst: kein Satz zum Aufschlagen des Hefts
    heft.still = true;
    fensterAuf('album', K.tab + (kapitel() ? ':' + kapitel() : ''));
    heft.still = false;
    Stimme.sprechen(clipVon(hz('h_keine_auswahl'), WER), { svg: null });
  }

  // Erste Runde: Bei welcher Unité ist die Klasse? (1.3, Schritt 2). nach: was danach beginnt
  let fragNach = { modus: 'runde', gruppe: null };
  function uniteFragen(rede, nach) {
    zustand = 'frage';
    Buehne.sperren();
    fragNach = nach || { modus: 'runde', gruppe: null };
    const meins = zug;
    karteLeeren('frage');
    $('frEingabe').hidden = true;
    $('frNr').textContent = 'Erste Runde';
    $('frKette').innerHTML = '';
    $('frVorgabe').innerHTML = '<div class="fr-frage">' + esc(K.kapitel.frage) + '</div>';
    $('frAntwort').innerHTML = '<div class="fr-unite-wahl">' + V().UNITE_REIHE.map(un => {
      const u = V().UNITES[un];
      return `<button type="button" class="fr-unite-knopf" data-un="${un}" style="--unite:${u.farbe}" aria-label="${esc(u.name + ' · ' + u.titel)}">`
        + uniteBild(un) + `<span><b>${esc(u.name)}</b><small>${esc(u.titel)}</small></span></button>`;
    }).join('') + '</div>';
    rede.then(() => fensterAbwarten(() => zug === meins)).then(ja => { if (ja) sagAls(WER, hz('h_unite_frage')); });
  }
  // Die Grundwörter dieser Unité sind gewählt; die Plus-Blätter kommen später dazu
  function kapitelNehmen(un) {
    kursStand.unite = un;
    for (const g of V().LERNZIEL_REIHE) if (V().LERNZIELE[g].un === un && !V().LERNZIELE[g].plus) kursStand.ziele[g] = true;
    sichern();
  }
  function uniteWaehlen(un) {
    if (zustand !== 'frage' || !V().UNITES[un]) return;
    Buehne.sperren();
    Ton.tipp();
    kapitelNehmen(un);
    zug++;
    const rede = sagAls(WER, hz('h_unite_' + un));
    rundeBeginnen(fragNach.modus, fragNach.gruppe, rede);
    kopfZeigen();
  }

  // Eine Runde planen und beginnen. rede: was sie gerade sagt; der Eröffnungssatz kommt danach.
  function rundeBeginnen(modus, gruppe, rede, probe) {
    const heute = heuteTag();
    let plan;
    if (probe) plan = { art: 'runde', schritte: [probe.schritt], neu: [], faellig: 1, morgen: 0, mehr: null };
    else {
      plan = L().planen(kursStand, heute, { modus, gruppe, mitTon: stand.stimme !== false });
      // Was «Für den Test üben» neu einführt, wird später wiederholt wie alles andere (3.4): Das Lernziel
      // kommt dazu. Sind schon alle seine Wörter bekannt, bleibt ein abgeschaltetes Lernziel aus.
      if (modus === 'frei' && gruppe && V().LERNZIELE[gruppe] && plan.art === 'frei' && plan.neu.length && kursStand.ziele[gruppe] !== true) kursStand.ziele[gruppe] = true;
      sichern();
    }
    if (plan.art === 'leer') return leerZeigen(plan, modus, rede);
    const r = {
      modus: probe ? 'probe' : modus, gruppe: gruppe || null, heute, plan, probe: !!probe,
      z: probe ? probe.z : kursStand,
      schritte: plan.schritte.map(s => ({ ...s })), i: 0,
      bilanz: { geurteilt: 0, richtig: 0, fast: 0, falsch: 0, fehlpaare: 0 },
      gezaehlt: new Set(),     // Karten, die heute in dieser Runde schon fürs Tagesziel zählten
      wechsel: new Map(),      // kid → { kid, nr, vorher, nachher, falsch } für die Ernte
      offen: { rangNeu: false, neueErfolge: [] },   // Meldungen, die «Weiter» abgeschnitten hat
      gesamtVorher: stand.gesamt, pieks: false, schluss: false, letzteFalsch: false, vorrede: null,
    };
    R = r;
    zustand = 'runde';
    if (!probe) vorladen(r.schritte);
    // Der Eröffnungssatz; danach manchmal Pieks. Ist Nea schon dabei, bleibt er weg.
    if (!probe) {
      const zeile = modus === 'frei' ? 'h_start_frei' : !plan.faellig ? 'h_start_neu' : !plan.neu.length ? 'h_start_wdh' : 'h_start_gemischt';
      const still = () => R !== r || !amZug() || (lauf && lauf.geurteilt && lauf.s.uebung !== 'kennen');
      // Ist ein Fenster offen (die Garderobe über die Äpfel), warten sie, bis es zu ist
      const sagVor = (wer, text) => fensterAbwarten(() => !still()).then(ja => (ja ? sagAls(wer, text) : false));
      r.vorrede = (rede || Promise.resolve(true))
        .then(ganz => (ganz && !still() ? sagVor(WER, hz(zeile)) : false))
        .then(ganz => (ganz && !still() && Math.random() < 0.25 ? sagVor('p', pz('p_fr_start')) : ganz));
    }
    schrittStarten();
  }

  // Alle Wort-Aufnahmen der Runde schon holen (nur holen; vorbereitet wird je Aufgabe)
  function vorladen(schritte) {
    if (stand.stimme === false) return;
    const clips = [], { VOKABELN, KARTE, vokabelClip } = V();
    for (const s of schritte) {
      if (s.uebung === 'paare') {
        for (const kid of s.wahl || s.kids || []) if (KARTE[kid]) clips.push(vokabelClip(KARTE[kid], 0, 0));
        continue;
      }
      const e = VOKABELN[s.nr];
      if (!e) continue;
      clips.push(vokabelClip(e, s.teil, s.form), vokabelClip(e, s.teil, s.form, true));
      if (s.uebung === 'kennen' || s.uebung === 'echo') clips.push(vokabelClip(e), vokabelClip(e, undefined, undefined, true));
    }
    Stimme.vorladen(clips.filter(Boolean));
  }
  // Die nächste Aufgabe schon vorbereiten, damit «Weiter» nicht auf das Netz wartet
  function naechsteVorbereiten(r) {
    if (stand.stimme === false) return;
    const { VOKABELN, vokabelClip } = V();
    const s = r.schritte[r.i + 1], e = s && VOKABELN[s.nr];
    if (!e || s.uebung === 'paare') return;
    const ganz = s.uebung === 'kennen' || s.uebung === 'echo';
    Stimme.bereit(ganz ? [vokabelClip(e), vokabelClip(e, undefined, undefined, true)]
      : [vokabelClip(e, s.teil, s.form), vokabelClip(e, s.teil, s.form, true)]);
  }

  /* ---------- Eine Aufgabe ---------- */

  // Das Finale nimmt die verpassten Karten zuerst
  function paareKids(r, s) {
    const verpasst = kid => !!(r.wechsel.get(kid) || {}).falsch;
    const wahl = s.wahl || s.kids || [];
    return [...wahl.filter(verpasst), ...wahl.filter(kid => !verpasst(kid))].slice(0, L().K.PAARE_MAX);
  }
  // Die stärkste Karte der Runde (für die leichte Aufgabe zum Schluss), nicht die eben verpasste
  function staerksteKarte(r, ohne) {
    const KARTE = V().KARTE;
    const kids = [...new Set(r.schritte.filter(s => s.kid && KARTE[s.kid]).map(s => s.kid))];
    const wahl = kids.filter(k => k !== ohne).map(kid => ({ kid, k: L().zustand(r.z, kid) }));
    wahl.sort((a, b) => b.k.st - a.k.st || b.k.richtig - a.k.richtig);
    return wahl.length ? KARTE[wahl[0].kid] : null;
  }
  // Endet die Runde auf einem Fehler, kommt vor dem Nachsprechen noch eine leichte Aufgabe (3.4)
  function schlussPruefen(r) {
    if (r.probe || r.schluss || !r.letzteFalsch) return;
    const rest = r.schritte.slice(r.i);
    if (rest.some(beurteilt)) return;
    const vorher = r.schritte.slice(0, r.i).filter(beurteilt).pop();
    const e = staerksteKarte(r, vorher && vorher.kid);
    if (!e) return;
    r.schluss = true;
    let ort = rest.findIndex(s => s.uebung === 'echo' || s.uebung === 'paare');
    ort = ort < 0 ? r.schritte.length : r.i + ort;
    r.schritte.splice(ort, 0, { kid: e.kid, nr: e.nr, uebung: 'bedeutung', vorgabe: 'fr', teil: 0, form: 0, rolle: 'fuell',
      check: null, neu: false, ...(r.modus === 'frei' ? { frei: true } : {}) });
  }

  // Den Schritt an der Stelle r.i bauen: Aufgabe, Ton prüfen, sonst Ersatz ohne Ton, dann zeigen
  async function schrittStarten() {
    const r = R;
    if (!r || !amZug()) return;
    schlussPruefen(r);
    let s = r.schritte[r.i];
    if (!s) return ernte();
    const meins = ++zug;
    const weg = () => { r.schritte.splice(r.i, 1); return schrittStarten(); };
    if (s.uebung === 'paare') s = r.schritte[r.i] = { ...s, kids: paareKids(r, s) };
    let a = L().aufgabe(s, r.z);
    if (!a) return weg();
    // Nie länger als anderthalb Sekunden auf eine Aufnahme warten (Stimme.bereit)
    const [ton, tonL] = await Stimme.bereit([a.clip, a.clipLangsam]);
    if (zug !== meins || R !== r) return;
    a.ton = !!ton && stand.stimme !== false;
    if (!a.ton && brauchtTon(s)) {
      const ersatz = L().ohneTon(s, r.z);
      if (!ersatz) return weg();
      s = r.schritte[r.i] = ersatz;
      a = L().aufgabe(s, r.z);
      if (!a) return weg();
      a.ton = !!ton && stand.stimme !== false;
    }
    aufgabeZeigen(r, s, a, !!tonL && a.ton);
  }

  function aufgabeZeigen(r, s, a, tonL) {
    let fertigOk;
    const l = {
      r, s, a, tonL,
      geurteilt: false, fertig: false, erg: null, buchung: null, belohnt: null,
      rede: Promise.resolve(true), nachbau: false, t0: 0, gewartet: false, getippt: false, kennenFrei: false, angetippt: false,
      // Sieht Nea die Karte zum ersten Mal? (Wortmoment) Erst das Urteil von kennen legt sie an.
      erstesMal: L().zustand(r.z, s.kid).gesehen === 0,
      pieks: null, vorher: r.vorrede,
      fertigDa: new Promise(ok => { fertigOk = ok; }),
    };
    l.fertigOk = fertigOk;
    // Die Aufgabe steht erst nach Stimme.bereit da: Die Sperre gilt ab jetzt
    Buehne.sperren();
    r.vorrede = null;
    lauf = l;
    zustand = 'runde';
    // Pieks rät mit: höchstens einmal je Runde, sein Tipp steht fest, bevor Nea antwortet (5.2)
    if (s.pieks && !r.pieks && Array.isArray(a.optionen) && a.optionen.length > 1) {
      r.pieks = true;
      const recht = a.optionen.findIndex(o => o.richtig);
      l.pieks = Math.random() < 0.5 ? recht : pick(a.optionen.map((o, i) => i).filter(i => i !== recht));
    }
    // Die drei festen Knöpfe verschwinden vor dem Aufbau: zeigen() meldet schon pruefbar(false)
    knoepfeAus();
    eingabeKlasse('');
    karteKlasse('');
    loesungWeg();
    $('frFaktKarte').hidden = true;
    kartenKopf(r, s, a);
    try {
      Uebungen.zeigen(a, gastgeber(l), UE);
    } catch (err) {
      // Eine Aufgabe, die sich nicht bauen lässt, hält die Runde nicht auf
      setTimeout(() => { throw err; });
      lauf = null;
      r.schritte.splice(r.i, 1);
      schrittStarten();
      return;
    }
    kopfZeigen();
    // Ohne Ton gibt es nichts abzuwarten: «Weiter» nach anderthalb Sekunden. Mit Ton geht es, sobald das
    // Wort gesagt ist; hängt ihr Satz (eine Aufnahme kommt nie an), spätestens nach zwanzig Sekunden.
    // Früher nicht: Das Wort kommt nach der Eröffnung oft erst nach zehn Sekunden.
    if (s.uebung === 'kennen') setTimeout(() => kennenFrei(l), a.ton ? 20000 : 1500);
    einleiten(l);
    warteUhr(l);
    naechsteVorbereiten(r);
  }

  // Was uebungen.js meldet (9.8)
  function gastgeber(l) {
    return {
      geurteilt: erg => urteilen(l, erg),
      fertig: () => fertigMelden(l),
      versuch: tipp => versuchen(l, tipp),
      nachbau: () => nachbauen(l),
      spielen: clip => spielen(l, clip),
      ichSags: () => ichSags(l),
      pruefbar: an => {
        if (l !== lauf || l.geurteilt) return;
        $('frPruefen').hidden = false;
        $('frPruefen').disabled = !an;
      },
      weissNicht: an => {
        if (l !== lauf) return;
        $('frWeissNicht').hidden = !an || l.geurteilt;
      },
    };
  }

  // Sie sagt etwas zur Aufgabe; ist die schon weg, schweigt sie. Ist ein Fenster offen, erst danach.
  const sagZu = (l, teile, wer = WER) => {
    if (!aktuell(l)) return Promise.resolve(false);
    if ($('fenster').hidden) return sagMehrAls(wer, teile);
    return imFreien(l).then(ja => (ja ? sagMehrAls(wer, teile) : false));
  };

  // Ein Clip der Aufgabe als Einwurf: Hör-Knöpfe, Paar-Kacheln, Tab
  function spielen(l, clip) {
    if (!aktuell(l) || !clip) return;
    l.angetippt = true;
    Stimme.einwurf([clip], svg.buehne);
  }
  // «Ich sag’s!»: das Wort (langsam, wo es das gibt), dann «Jetzt du!». Der Ring läuft danach.
  function ichSags(l) {
    if (!aktuell(l)) return Promise.resolve(false);
    l.angetippt = true;
    const a = l.a, teile = [];
    const c = l.tonL && a.clipLangsam ? a.clipLangsam : a.clip;
    if (a.ton) teile.push({ html: frZuClip(c), clip: c });
    teile.push(hz('h_jetzt_du'));
    const p = sagMehrAls(WER, teile);
    p.then(() => kennenFrei(l));
    return p;
  }
  // «Weiter» nach dem Kennenlernen: sobald das Wort gesagt ist. Eine Uhr einer Aufgabe, die schon
  // vorbei ist, ändert nichts: Der Knopf gehört dann der nächsten.
  function kennenFrei(l) {
    l.kennenFrei = true;
    if (aktuell(l) && l.fertig) $('frWeiter').disabled = false;
  }

  // Was sie zu Beginn einer Aufgabe sagt: Wiederholung, Erklärung, Kennenlernen, das Wort zum Hören
  async function einleiten(l) {
    // Kam etwas anderes dazwischen (ein Tipp, «Ich lese dir wieder vor»), fängt sie nicht von vorn an
    const ruhig = l.vorher ? !(await l.vorher) : false;
    const a = l.a, s = l.s, u = s.uebung, r = l.r;
    // Ist ein Fenster offen (die Garderobe über die Äpfel), fängt sie an, sobald es zu ist
    if (!$('fenster').hidden && !(await imFreien(l))) return;
    if (!aktuell(l) || (l.geurteilt && u !== 'kennen')) return;
    // Hat Nea während des Eröffnungssatzes schon selbst etwas angetippt, fällt sie ihr nicht ins Wort
    if (l.angetippt || ruhig) {
      if (u === 'kennen') kennenFrei(l);
      return;
    }
    zielAuf(WER);
    const teile = [];
    if (s.rolle === 'wdh') teile.push(hz('h_wieder'));
    // Beim ersten Auftritt einer Übung erklärt sie sie mit einem Satz
    if (u !== 'kennen' && !r.z.erklaert[u] && liste('h_erklaer_' + u)) {
      r.z.erklaert[u] = true;
      if (!r.probe) sichern();
      teile.push(hz('h_erklaer_' + u));
    }
    if (u === 'kennen') return kennenEinleiten(l, teile);
    if (u === 'echo') {
      teile.push(hz('h_sag'), { html: frZuClip(a.clip), clip: a.clip });
      if (l.tonL && a.clipLangsam) teile.push({ html: '', clip: a.clipLangsam });
      teile.push(hz('h_jetzt_du'));
      return sagZu(l, teile);
    }
    if (u === 'paare') return sagZu(l, [...teile, hz('h_paare')]);
    // Hör-Aufgaben spielen ihr Wort einmal von selbst; die Blase verrät es nicht
    const hoeren = a.ton && a.clip && (u === 'hoeren' || u === 'lauschen' || a.vorgabe === 'ton');
    if (!teile.length) blaseLeeren();
    if (hoeren) {
      if (teile.length) teile.push({ html: '', clip: a.clip });
      else return Stimme.einwurf([a.clip], svg.buehne);
    }
    if (teile.length) return sagZu(l, teile);
  }

  // Kennenlernen (2.1): [h_kennen, Wort], dann Wortmoment, Artikel-Kontrast, Merkhilfe.
  // «Weiter» geht, sobald das Wort gesagt ist, ohne Ton nach anderthalb Sekunden.
  async function kennenEinleiten(l, teile) {
    const a = l.a, e = a.e;
    if (a.ton) teile.push(hz(e.art === 'satz' ? 'h_kennen_satz' : 'h_kennen'), { html: frZuClip(a.clip), clip: a.clip });
    if (!teile.length) blaseLeeren();
    const erste = teile.length ? sagZu(l, teile) : Promise.resolve(true);
    if (a.ton) erste.then(() => kennenFrei(l));
    let ganz = await erste;
    // Was danach kommt, gehört auf diese Karte: Ist ein Fenster offen, wartet es, bis es zu ist.
    // Der Wortmoment gehört direkt zum Wort, darum vor dem Kontrast (le chat: sie versteckt sich)
    const moment = l.erstesMal && T.momente[e.id];
    if (ganz && moment && (await imFreien(l))) {
      const wer = moment.wer === 'p' ? 'p' : WER, fig = wer === 'p' ? svg.gast : svg.buehne;
      if (moment.klasse === 'froh') stimmung(fig, 'froh', 1400);
      else if (moment.klasse) bewegung(fig, moment.klasse);
      ganz = await sagAls(wer, moment.t);
    }
    if (ganz && L().kontrast(e) && (await imFreien(l))) ganz = await sagAls(WER, hz('h_kontrast'));
    const merk = T.merk[e.id];
    if (ganz && merk && (await imFreien(l))) await sagAls(WER, merk);
  }

  /* ---------- Urteil ---------- */

  // Im Augenblick des Urteils (host.geurteilt): verbuchen, zahlen, speichern, antworten
  function urteilen(l, erg) {
    if (l !== lauf || l.geurteilt) return;
    l.geurteilt = true;
    l.erg = erg = erg || { art: 'ohne' };
    l.t0 = Date.now();
    clearTimeout(warteId);
    $('frPruefen').hidden = true;
    $('frWeissNicht').hidden = true;
    const r = l.r, s = l.s, a = l.a, u = s.uebung, art = erg.art;
    // Zuerst verbuchen: die Erfolge in belohnen() sehen schon den neuen Stand
    l.buchung = L().verbuchen(r.z, s, erg, r.heute);
    if (u === 'kennen') {
      if (!r.probe) sichern();
      return;
    }
    if (u === 'echo' || u === 'paare') {
      if (u === 'paare') r.bilanz.fehlpaare += erg.fehlpaare || 0;
      if (!r.probe) {
        sichern();
        l.belohnt = aepfelGeben(L().aepfel(s, erg), u === 'echo' ? $('frGesagt') : $('frAntwort'));
      }
      stimmung(svg.buehne, 'froh', 1400);
      l.rede = sagZu(l, [hz(u === 'echo' ? 'h_gesagt' : 'h_paare_fertig')]);
      nachUrteil(l);
      return;
    }
    if (!['richtig', 'fast', 'falsch'].includes(art)) return;

    r.bilanz.geurteilt++;
    r.bilanz[art]++;
    r.letzteFalsch = art === 'falsch';
    s.status = art;
    const w = r.wechsel.get(s.kid) || { kid: s.kid, nr: s.nr, vorher: l.buchung.vorher, falsch: false };
    w.nachher = l.buchung.stufe;
    w.falsch = w.falsch || art === 'falsch';
    r.wechsel.set(s.kid, w);

    // Äpfel: was die Aufgabe zahlt, mit Stufenbonus, und einer, wenn Nea Pieks schlägt
    let n = L().aepfel(s, erg, l.buchung);
    if (l.pieks !== null) {
      Uebungen.pieksTipp(l.pieks);
      if (art === 'richtig' && !a.optionen[l.pieks].richtig) n++;
    }
    if (!r.probe) {
      if (art === 'falsch') verfehlt(K.fach);
      else {
        // Jede Karte zählt einmal je Runde fürs Tagesziel (3.8)
        const zaehlt = !r.gezaehlt.has(s.kid);
        r.gezaehlt.add(s.kid);
        l.belohnt = belohnen({ aepfel: n, von: apfelVon(), ersterVersuch: art === 'richtig', fach: K.fach, zaehlt });
      }
      sichern();
      if (art === 'falsch') wiederholungEinreihen(r, s);
    }
    ketteZeichnen(r);
    loesungZeigen(l);
    l.rede = rueckmeldung(l);
    nachUrteil(l);
    kopfZeigen();
  }
  // Von hier fliegen die Äpfel: die getippte Antwort oder die Antwortzeile
  function apfelVon() {
    return $('frFeld').querySelector('.gewaehlt') || ($('frAntwort').firstElementChild ? $('frAntwort') : $('frVorgabe'));
  }

  // Nach «falsch» kommt der Schritt einmal wieder, drei bis fünf Aufgaben später.
  // Nach verpasstem Check A kommt stattdessen gleich noch einmal das Kennenlernen (3.5).
  function wiederholungEinreihen(r, s) {
    if (s.rolle === 'wdh' || s.wiederholt) return;
    s.wiederholt = true;
    if (s.rolle === 'check' && s.check === 'a') {
      const k = r.plan.schritte.find(x => x.kid === s.kid && x.uebung === 'kennen')
        || { kid: s.kid, nr: s.nr, uebung: 'kennen', vorgabe: 'fr', teil: 0, form: 0, rolle: 'kennen', check: null };
      r.schritte.splice(r.i + 1, 0, { ...k, neu: false });
      return;
    }
    let ende = r.schritte.findIndex((x, i) => i > r.i && (x.uebung === 'echo' || x.uebung === 'paare'));
    if (ende < 0) ende = r.schritte.length;
    const KL = L().K, weit = KL.WDH_VON + Math.floor(Math.random() * (KL.WDH_BIS - KL.WDH_VON + 1));
    // Die Wiederholung ist noch offen: Ohne das Ergebnis des ersten Mals wäre ihre Perle schon rot
    const wdh = L().wiederholung(s);
    delete wdh.status;
    delete wdh.wiederholt;
    r.schritte.splice(Math.min(r.i + weit, ende), 0, wdh);
  }

  // Die Rückmeldung nach dem Urteil (Tabelle in 2.0). Erfüllt sich wie jede Ansage.
  function rueckmeldung(l) {
    const { s, a, erg, buchung } = l, u = s.uebung, art = erg.art, urteil = erg.urteil || null;
    const wort = { html: frB(a.fr), clip: a.ton ? a.clip : null };
    if (art === 'richtig' || art === 'fast') {
      Ton.richtig();
      stimmung(svg.buehne, 'froh', 1400);
      if (buchung.auf) bewegung(svg.buehne, K.lehrer.drehung);
      const nachFehler = art === 'fast' || s.rolle === 'wdh';
      // Eine andere Form getippt, während die erste gefragt war: «Im Buch steht zuerst: …». Ohne Aufnahme
      // fällt der Vorspann weg; das Lob danach ist nach einem Fehlversuch keines von «Auf Anhieb richtig!»
      if (urteil && urteil.ganz === 'auch') return sagZu(l, a.ton ? [hz('h_auch'), wort] : [hz(nachFehler ? 'h_richtig_nachfehler' : 'h_richtig'), wort]);
      const buch = !!urteil && urteil.artikel === 'buch';
      let vor = null;
      if (nachFehler) vor = hz('h_richtig_nachfehler');
      else if (buchung.auf && buchung.stufe === 3) vor = hz('h_frucht');
      else if (buchung.auf && buchung.stufe === 5) vor = hz('h_reif');
      else if (buchung.auf && Math.random() < 0.5) vor = hz('h_hoch');
      else if (u === 'schreiben' && !buch && Math.random() < 0.5) vor = hz('h_richtig_schreiben');
      else if ((u === 'ordnen' || u === 'bauen') && a.e.art === 'satz' && Math.random() < 0.5) vor = hz('h_richtig_satz');
      else if (Math.random() < 0.35) vor = hz('h_richtig');
      return sagZu(l, [vor, wort]);
    }
    // falsch
    Ton.falsch();
    stimmung(svg.buehne, 'oops', 1200);
    // Bei gebauten Antworten sagt sie h_loesung, sobald das Nachbauen beginnt
    if (GEBAUT.includes(u)) return Promise.resolve(true);
    const sinn = u === 'bedeutung' || u === 'hoeren';
    const html = sinn ? frB(a.fr) + ' = ' + esc(deVon(a)) : frB(a.fr);
    // Ohne Aufnahme ein Satz, der allein steht; die Blase trägt trotzdem alles
    if (!a.ton) return sagZu(l, [hz('h_ohne_clip'), { html, clip: null }]);
    const langsam = l.tonL && a.clipLangsam && (u === 'hoeren' || u === 'lauschen') ? { html: '', clip: a.clipLangsam } : null;
    if (sinn) return sagZu(l, [hz('h_bedeutet'), { html, clip: a.clip }, langsam]);
    if (u === 'lauschen') return sagZu(l, [hz('h_falsch_hoeren'), wort, langsam]);
    return sagZu(l, [hz('h_es_heisst'), wort]);
  }

  // Nach der Rückmeldung: Pieks' Tipp, die Meldungen, und nach «richtig» weiter von selbst
  async function nachUrteil(l) {
    let ganz = await l.rede;
    // Ein offenes Fenster (die Garderobe über die Äpfel) hält Pieks und die Meldungen an, bis es zu ist:
    // Die Meldungen lägen sonst hinter ihm. Danach wartet «Weiter» (1.3: nach allem anderen wartet es).
    let gewartet = false;
    const frei = () => {
      if ($('fenster').hidden) return true;
      gewartet = true;
      return imFreien(l);
    };
    // Ging es schon weiter, warten Rang und Erfolge auf die Ernte
    if (!aktuell(l) || !(await frei())) return offenMerken(l.r, l.belohnt);
    if (l.pieks !== null && ganz) {
      const nea = l.erg.art === 'richtig', er = !!l.a.optionen[l.pieks].richtig;
      ganz = await sagAls('p', pz(nea ? (er ? 'p_rat_richtig' : 'p_rat_falsch') : (er ? 'p_rat_glueck' : 'p_rat_beide')));
      if (!aktuell(l)) return offenMerken(l.r, l.belohnt);
    }
    const f = l.belohnt;
    if (f && ganz && (SERIE[f.serie] || f.zielJetzt || f.rangNeu || (f.neueErfolge || []).length)) {
      if (!(await frei())) return offenMerken(l.r, f);
      // Zur Serie dreht sie sich, Pieks liest die Meldung vor
      if (SERIE[f.serie]) bewegung(svg.buehne, K.lehrer.drehung);
      const rest = await meldungenFeiern(f, () => aktuell(l) && $('fenster').hidden);
      if (rest) {
        offenMerken(l.r, rest);
        ganz = false;
      } else if (f.serie === 10 && aktuell(l)) ganz = await sagAls('p', pz('p_staunt'));
    } else if (f && !ganz) offenMerken(l.r, f);
    // In der Probe bleibt die Aufgabe stehen, damit man sie ansehen kann
    if (!aktuell(l) || l.erg.art !== 'richtig' || !ganz || gewartet || l.r.probe) return;
    // Weiter von selbst: frühestens 900 ms nach dem Tipp, nur wenn alles gesagt ist und kein Fenster offen
    await l.fertigDa;
    const warten = 900 - (Date.now() - l.t0);
    if (warten > 0) await pause(warten);
    if (aktuell(l) && $('fenster').hidden && !$('frWeiter').hidden && !$('frWeiter').disabled) weiterGehen();
  }
  // Rang- und Erfolgsmeldungen, die nicht gezeigt wurden, kommen auf die Ernte
  function offenMerken(r, f) {
    if (!r || !f) return;
    r.offen.rangNeu = r.offen.rangNeu || !!f.rangNeu;
    for (const id of f.neueErfolge || []) if (!r.offen.neueErfolge.includes(id)) r.offen.neueErfolge.push(id);
  }

  // Erster Versuch daneben (gebaute Antworten): ein Hinweis, kein Wort. Welche Zeilen zu welchem Fehler
  // passen, sagt der Kurs (K.tipps: TIPP, ARTIKEL_TIPP, KERN_TIPP, KERN_IM_DOPPEL, KERN_DREHER, jede darf
  // fehlen, und vor allen eine eigene Regel vor(t)).
  // Eine Zeile der Liste, nur aus den erlaubten, wenn es eine Einschränkung gibt (sonst der Beutel wie immer).
  // Direkt gewählt, nicht so lange gezogen, bis eine passt: Das leerte den Beutel um die Zeilen, die allein gelten.
  function kernZeile(name, nur) {
    const wahl = (nur || []).map(i => liste(name)[i]).filter(Boolean);
    return wahl.length ? pick(wahl) : hz(name);
  }
  const tafel = (name, x) => (kursTipps[name] || {})[x] || null;
  // Die Zeilen des Hinweises, fertig zum Sagen: zuerst der Artikel, dann der Kern, in derselben Blase (2.9)
  function tippZeilen(t) {
    if (!t) return [hz('h_tipp_legen')];
    // Eine Regel, die nur dieser Kurs kennt, geht vor: Sie nennt eine Liste (beim Namen wie bei Pirouette)
    // oder nichts. Gibt es die Liste nicht, gelten die Tafeln.
    const eigen = kursTipps.vor ? kursTipps.vor(t) : null, zeile = eigen ? hz(eigen) : null;
    if (zeile) return [zeile];
    if (tafel('TIPP', t.art)) return [hz(tafel('TIPP', t.art))];
    if (t.ganz === 'verwechselt') return [hz('h_tipp_verwechselt')];
    if (t.ganz === 'andere_form') return [hz('h_tipp_andere_form')];
    const art = tafel('ARTIKEL_TIPP', t.artikel);
    let kern = tafel('KERN_TIPP', t.kern);
    if (kern === art) kern = null;
    if (!art && !kern) return [hz('h_tipp_anders')];
    const doppel = !!art && !!kern;
    // Akzente und Zeichen zugleich («la grand mere»): beides nennen, sonst scheitert der zweite Versuch am
    // Bindestrich. Feste Zeilen (kursTipps.akzentUndZeichen), damit «Fast!» nicht zweimal kommt. Steht der
    // Artikel-Hinweis davor, nennt eine kurze Zeile beides: Drei Zeilen füllten auf dem Handy die ganze Blase.
    if (t.kern === 'akzent' && t.zeichen) {
      if (doppel) return [hz(art), hz('h_tipp_akzent_zeichen')];
      if (kursTipps.akzentUndZeichen) return kursTipps.akzentUndZeichen.map(zeileNr);
    }
    const dreher = !art && t.kern === 'tippfehler' && (t.stellen || []).length > 1;
    return [art && hz(art), kern && kernZeile(kern, doppel ? tafel('KERN_IM_DOPPEL', kern) : dreher ? tafel('KERN_DREHER', kern) : null)].filter(Boolean);
  }
  function versuchen(l, tipp) {
    if (!aktuell(l) || l.geurteilt) return;
    // Ab jetzt steht ein Hinweis in der Blase: «Lass dir Zeit» darf ihn nicht verdrängen (warteUhr)
    l.getippt = true;
    // Die Form von oben getippt: kein Versuch, nur ein Satz
    if (tipp && tipp.ganz === 'gleiche_form') {
      sagZu(l, [hz('h_andere_form')]);
      return;
    }
    Ton.falsch();
    stimmung(svg.buehne, 'oops', 1200);
    // Ein anderes Wort aus dem Heft: Der Streifen sagt, was es heisst
    if (tipp && tipp.ganz === 'verwechselt' && tipp.andere && V().VOKABELN[tipp.andere.nr]) {
      const e = V().VOKABELN[tipp.andere.nr], t = e.teile[tipp.andere.teil] || e.teile[0];
      const box = $('frLoesung');
      box.innerHTML = '<div class="fr-loesung-zeile"><span class="fr-loesung-text"><span class="fr-loesung-was">Dein Wort:</span><span class="fr-loesung-fr" lang="' + K.lang + '">'
        + Uebungen.frHTML(t.fr[0], e) + '</span><span class="fr-loesung-gleich">=</span><span class="fr-loesung-de">' + esc(t.zeigeDe) + '</span></span></div>';
      box.classList.add('hinweis');
      box.hidden = false;
      einblenden(box);
    }
    sagZu(l, tippZeilen(tipp));
  }
  // Die Lösung steht da, jetzt wird einmal nachgebaut. «Weiter» hält seinen Platz, geht aber noch nicht.
  function nachbauen(l) {
    if (!aktuell(l)) return;
    l.nachbau = true;
    $('frWeiter').hidden = false;
    $('frWeiter').disabled = true;
    l.rede = sagZu(l, [hz('h_loesung')]);
  }
  // Die Aufgabe darf verlassen werden (host.fertig)
  function fertigMelden(l) {
    if (l !== lauf || l.fertig) return;
    l.fertig = true;
    l.fertigOk();
    if (l.nachbau) {
      // Nachgebaut: ein Apfel, dann das Wort, wie es richtig heisst
      if (!l.r.probe) offenMerken(l.r, aepfelGeben(1, $('frAntwort')));
      Ton.richtig();
      stimmung(svg.buehne, 'froh', 1400);
      // Ohne Aufnahme fällt der Satz davor weg; das Wort ersetzt in der Blase die Bitte ums Nachbauen
      l.rede = sagZu(l, l.a.ton ? [hz('h_nachgebaut'), { html: frB(l.a.fr), clip: l.a.clip }] : [{ html: frB(l.a.fr), clip: null }]);
    }
    const w = $('frWeiter');
    // «Weiter» erscheint oft genau dort, wo eben «Prüfen» stand: Der zweite Tipp schnitte das Wort ab
    if (w.hidden || w.disabled) Buehne.sperren();
    w.hidden = false;
    w.disabled = l.s.uebung === 'kennen' && !l.kennenFrei;
  }

  // Lösungsstreifen nach jedem Urteil: Stufe, Form mit Artikel in seiner Farbe, Schild, Deutsch, Hören
  function loesungZeigen(l) {
    const { a, s, erg } = l, e = a.e;
    if (!e) return;
    const urteil = erg.urteil || null;
    let notiz = '';
    if (K.buch && urteil && urteil.artikel === 'buch') notiz = K.buch.steht + a.fr;
    else if (K.buch && urteil && urteil.ganz === 'auch') notiz = K.buch.zuerst + a.fr;
    const st = L().zustand(l.r.z, s.kid).st;
    const box = $('frLoesung');
    box.classList.remove('hinweis');
    // Der Hör-Knopf steht rechts für sich: Bricht die Zeile auf dem Handy um, bleibt er an seinem Platz
    box.innerHTML = '<div class="fr-loesung-zeile">' + Uebungen.stufeHTML(st, UE)
      + '<span class="fr-loesung-text"><span class="fr-loesung-fr" lang="' + K.lang + '">' + Uebungen.frHTML(a.fr, e) + '</span>'
      + '<span class="fr-loesung-gleich">=</span><span class="fr-loesung-de">' + esc(deVon(a)) + '</span></span>'
      + (a.ton && a.clip ? '<button type="button" class="play fr-loesung-play" aria-label="Nochmal anhören"><svg viewBox="0 0 24 24" aria-hidden="true"><use href="#i-ton"/></svg></button>' : '')
      + '</div>' + (notiz ? '<small class="fr-loesung-notiz">' + esc(notiz) + '</small>' : '');
    box.hidden = false;
    einblenden(box);
  }
  // Auf dem kleinen Handy rollt die Karte: Was gerade erschienen ist, soll zu sehen sein
  function einblenden(el) {
    requestAnimationFrame(() => { if (!el.hidden) el.scrollIntoView({ block: 'nearest', behavior: reduce ? 'auto' : 'smooth' }); });
  }

  // «Weiter»: die nächste Aufgabe
  function weiterGehen() {
    const l = lauf, w = $('frWeiter');
    if (!l || !l.fertig || !R || w.hidden || w.disabled) return;
    Stimme.stopp();
    w.disabled = true;
    lauf = null;
    clearTimeout(warteId);
    Uebungen.aufraeumen();
    R.i++;
    schrittStarten();
  }

  /* ---------- Kartenkopf ---------- */

  function zaehle(r) {
    let nr = 0, gesamt = 0;
    r.schritte.forEach((x, i) => {
      if (!beurteilt(x)) return;
      gesamt++;
      if (i <= r.i) nr = gesamt;
    });
    return { nr, gesamt };
  }
  // Eine Perle je beurteilte Aufgabe; schmal (Handy) steht dafür «3/12» da
  function ketteZeichnen(r) {
    if (!r) {
      $('frKette').innerHTML = '';
      return;
    }
    let h = '';
    r.schritte.forEach((x, i) => {
      if (beurteilt(x)) h += '<i' + (x.status ? ' class="' + KETTE[x.status] + '"' : i === r.i && zustand === 'runde' ? ' class="jetzt"' : '') + '></i>';
    });
    const z = zaehle(r);
    $('frKette').innerHTML = h + (z.gesamt ? '<b class="fr-kette-zahl">' + z.nr + '/' + z.gesamt + '</b>' : '');
  }
  function kartenKopf(r, s, a) {
    const e = s.uebung === 'paare' ? null : V().VOKABELN[s.nr];
    $('frNr').textContent = e ? ortName(e) : 'Finale';
    ketteZeichnen(r);
    const n = a ? a.aepfel : 0;
    $('frBelohnung').hidden = !(n > 0);
    $('frBelohnungN').textContent = '+' + n;
  }

  // Die Kopfzeile oben (kopfZeigen in app.js): Kurs, sein Zeichen und wo die Runde steht. Billig, wirft nie.
  function chip() {
    const c = klein => ({ name: K.name, klein, icon: K.lehrer.icon });
    try {
      if (zustand === 'frage') return c('Erste Runde');
      if (zustand === 'leer') return c('Alles geübt');
      if (zustand === 'bereit') return c('Neue Runde');
      if (zustand === 'ernte') return c('Ernte');
      if (!R) return c('');
      const z = zaehle(R), s = R.schritte[R.i];
      if (R.modus === 'frei') return c('Frei üben · ' + z.nr + '/' + z.gesamt);
      if (s && s.uebung === 'kennen') return c('Neues Wort');
      if (s && s.uebung === 'echo') return c('Nachsprechen');
      if (s && s.uebung === 'paare') return c('Finale');
      return c('Aufgabe ' + z.nr + ' von ' + z.gesamt);
    } catch (e) {
      return c('');
    }
  }

  /* ---------- Ernte ---------- */

  // Was die Runde gebracht hat (1.4): Bilanz, Äpfel, die Karten, die sich bewegt haben
  async function ernte() {
    const r = R;
    lauf = null;
    zustand = 'ernte';
    Buehne.sperren();
    const meins = ++zug;
    clearTimeout(warteId);
    karteLeeren('ernte');
    let g = null, perfekt = false;
    if (!r.probe) {
      const rf = L().rundeFertig(r.z, { modus: r.modus, falsch: r.bilanz.falsch, geurteilt: r.bilanz.geurteilt }, r.heute);
      sichern();
      perfekt = rf.perfekt;
      // Rundenbonus: drei Äpfel, fünf mehr für eine Runde ohne Fehler (nicht im freien Üben)
      if (r.modus === 'runde') g = aepfelGeben(3 + (perfekt ? 5 : 0), $('frVorgabe'));
    }
    ketteZeichnen(r);
    $('frNr').textContent = r.modus === 'frei' ? 'Frei üben' : 'Ernte';
    const b = r.bilanz, aepfel = Math.max(0, stand.gesamt - r.gesamtVorher);
    $('frVorgabe').innerHTML = '<div class="fr-ernte-kopf"><div><div class="fr-ernte-titel">Geschafft!</div>'
      + '<div class="fr-klein">' + b.richtig + ' von ' + b.geurteilt + ' beim ersten Versuch</div></div>'
      + (aepfel ? '<span class="fr-ernte-aepfel"><svg viewBox="0 0 40 40" aria-hidden="true"><use href="#apfel"/></svg><b>+' + aepfel + '</b><span class="weg">Äpfel</span></span>' : '')
      + '</div>';
    const zeilen = [...r.wechsel.values()].filter(w => w.nachher !== w.vorher || w.falsch);
    $('frAntwort').innerHTML = zeilen.length ? '<div class="fr-ernte-liste">' + zeilen.map(w => {
      const e = V().VOKABELN[w.nr] || V().KARTE[w.kid], anders = w.nachher !== w.vorher;
      return '<button type="button" class="fakt-eintrag fr-ernte-zeile' + (w.falsch ? ' wackelig' : '') + '" data-nr="' + e.nr + '">'
        + '<span class="fr-ernte-stufen">' + Uebungen.stufeHTML(w.vorher, UE)
        + (anders ? '<svg class="fr-pfeil" viewBox="0 0 32 32" aria-hidden="true"><use href="#i-weiter"/></svg>' + Uebungen.stufeHTML(w.nachher, UE) : '') + '</span>'
        + '<span class="fr-ernte-text"><span lang="' + K.lang + '">' + Uebungen.frHTML(e.fr, e) + '</span><small>' + esc(e.de)
        + (w.falsch ? ' · <em>war knifflig</em>' : '') + '</small></span>'
        + '<span class="play" aria-hidden="true"><svg viewBox="0 0 24 24"><use href="#i-ton"/></svg></span></button>';
    }).join('') + '</div>' : '';
    $('frFeld').innerHTML = '<button type="button" class="fr-knopf" id="frNochmal">Noch eine Runde</button>'
      + '<button type="button" class="fr-knopf leise" id="frHeim">Zur Lichtung</button>';
    eingabeKlasse('ende');
    kartenTag = heuteTag();
    kopfZeigen();

    // Sie sagt etwas zur Runde, dann kommen die Meldungen, die noch offen sind, dann vielleicht ein Fakt.
    // Die Äpfel fliegen eben zum Zähler: Tippt Nea ihn an, wartet all das, bis die Garderobe zu ist.
    const gilt = () => zug === meins && amZug();
    const z = zahlen();
    const zeile = z.reif >= V().VOKABELN.length ? 'h_alles_reif'
      : !b.falsch && !b.fast && !b.fehlpaare && b.geurteilt ? 'h_ende_perfekt' : b.falsch >= 3 ? 'h_ende_muehsam' : 'h_ende';
    stimmung(svg.buehne, 'froh', 1400);
    let ganz = (await fensterAbwarten(gilt)) && (await sagAls(WER, hz(zeile)));
    if (!gilt()) return;
    offenMerken(r, g);
    // Hat Nea dazwischen ein Wort angetippt, kommen die Meldungen, sobald es still ist (fr_runden10, fr_perfekt)
    if (!ganz) ganz = await stilleAbwarten(gilt);
    // Hinter einem Fenster sähe sie niemand: Öffnet Nea eines, kommen die übrigen, sobald es zu ist
    let offen = r.offen;
    while (ganz && offen && (offen.rangNeu || offen.neueErfolge.length)) {
      if (!(await fensterAbwarten(gilt))) return;
      offen = await meldungenFeiern(offen, () => gilt() && $('fenster').hidden);
      // Nur ein Fenster hält sie an; alles andere (ein angetipptes Wort) beendet sie wie bisher
      if (offen && $('fenster').hidden) ganz = false;
    }
    if (!ganz || !gilt() || r.probe || stand.nachRichtig < 3 || !(await fensterAbwarten(gilt))) return;
    // Höchstens ein Fakt je Runde, erzählt von Pieks
    stand.nachRichtig = 0;
    speichern();
    await pause(250);
    if (gilt()) faktErzaehlen({ karte: 'frFaktKarte', kat: 'frFaktKat', text: 'frFaktText', neu: 'frFaktNeu', vor: pz('p_fakt_franz') });
  }

  // Bis niemand mehr spricht; false, wenn der Bildschirm inzwischen etwas anderes zeigt
  async function stilleAbwarten(gilt, ms = 20000) {
    for (let t = 0; t < ms; t += 300) {
      await pause(300);
      if (!gilt()) return false;
      if (Stimme.istStill()) return true;
    }
    return false;
  }

  /* ---------- Nichts zu tun ---------- */

  // Wie viele gewählte Karten schon wachsen: Ohne sie gibt es kein freies Üben
  const gekannteAktive = () => V().KARTEN.filter(e => e.lernziele.some(g => kursStand.ziele[g]) && L().zustand(kursStand, e.kid).st >= 1).length;
  function angebotHTML(g) {
    const lz = V().LERNZIELE[g];
    return '<span class="knopf-zeile"><button type="button" class="mini" data-fr-ziel="' + esc(g) + '">Ja, '
      + esc(V().UNITES[lz.un].name + ' · ' + lz.name + (lz.plus && K.buch ? ' (' + K.buch.plus + ')' : '')) + ' dazu!</button>'
      + '<button type="button" class="mini leise" data-fr-nein>Nein, danke</button></span>';
  }
  // Die leere Runde (3.4 Schritt 9, 3.9): kein Füllwerk, dafür freies Üben oder das nächste Lernziel
  function leerZeigen(plan, modus, rede) {
    R = null;
    lauf = null;
    zustand = 'leer';
    Buehne.sperren();
    const meins = ++zug;
    karteLeeren('leer');
    $('frNr').textContent = kapitel() ? V().UNITES[kapitel()].name : K.name;
    $('frKette').innerHTML = '';
    const frei = modus === 'frei';
    const morgen = plan.morgen === 1 ? 'Morgen ist 1 Wort dran.' : plan.morgen > 1 ? 'Morgen sind ' + plan.morgen + ' Wörter dran.' : 'Die Wörter ruhen sich aus.';
    $('frVorgabe').innerHTML = '<svg class="fr-leer-bild" viewBox="0 0 40 40" aria-hidden="true"><use href="#' + K.stufen.bild + '"/></svg>'
      + '<div class="fr-ernte-titel">' + (frei ? 'Noch nichts zum Üben' : 'Für heute ist alles geübt') + '</div>'
      + '<div class="fr-klein">' + (frei ? 'Lerne zuerst ein paar Wörter kennen.' : morgen) + '</div>';
    const freiDa = !frei && gekannteAktive() > 0;
    $('frFeld').innerHTML = (freiDa ? '<button type="button" class="fr-knopf" id="frFrei">Frei üben</button>' : '')
      + '<button type="button" class="fr-knopf leise" id="frHeim">Zur Lichtung</button>';
    eingabeKlasse('ende');
    kartenTag = heuteTag();
    kopfZeigen();
    // Ist ein Fenster offen (die Garderobe über die Äpfel), spricht sie, sobald es zu ist
    (rede || Promise.resolve(true)).then(() => fensterAbwarten(() => zug === meins)).then(ja => {
      if (!ja) return;
      // Erst wenn jede gewählte Karte bekannt ist, bietet sie das nächste Lernziel an
      if (!frei && plan.mehr && V().LERNZIELE[plan.mehr]) return sagMehrAls(WER, [hz('h_naechstes'), { html: angebotHTML(plan.mehr), clip: null }]);
      // «Noch nichts zum Üben»: Jede Zeile von «alles geübt» widerspräche der Karte
      if (frei) return blaseLeeren();
      let zeile = hz('h_nichts_faellig');
      // Ohne «Frei üben» auf der Karte bietet sie es auch nicht an (die Zeile kursTipps.freiUeben).
      // Ein zweiter Zug ist nie dieselbe Zeile.
      if (!freiDa && kursTipps.freiUeben && zeile === zeileNr(kursTipps.freiUeben)) zeile = hz('h_nichts_faellig');
      sagAls(WER, zeile);
    });
  }

  /* ---------- Ein neuer Tag ---------- */

  // Die App auf dem iPad wird oft nur fortgesetzt, auch über Nacht. Steht dann noch die leere Karte oder
  // die Ernte von gestern da, zeigt die Karte beim Zurückkommen (oder beim ersten Tipp neben die Knöpfe),
  // was heute wartet. Die Runde beginnt erst auf Neas Tipp: Ein Kennenlernen wäre sonst verbucht, ohne
  // dass sie es sah. Eine Aufgabe unterbricht das nie. true: Die Karte ist neu.
  function neuerTag() {
    if (!amZug() || !['leer', 'ernte', 'bereit'].includes(zustand) || kartenTag === heuteTag()) return false;
    // Ohne gewähltes Lernziel öffnet «Los geht’s» das Wörterheft (starten)
    const plan = zahlen().aktiv ? L().planen(kursStand, heuteTag(), { modus: 'runde', mitTon: stand.stimme !== false }) : null;
    sichern();
    if (plan && plan.art === 'leer') leerZeigen(plan, 'runde', null);
    else bereitZeigen();
    return true;
  }
  // Was heute wartet, wie auf der Lichtung, und ein Knopf für die Runde
  function bereitZeigen() {
    R = null;
    lauf = null;
    zustand = 'bereit';
    Buehne.sperren();
    zug++;
    clearTimeout(warteId);
    karteLeeren('leer');
    $('frNr').textContent = kapitel() ? V().UNITES[kapitel()].name : K.name;
    $('frKette').innerHTML = '';
    $('frVorgabe').innerHTML = '<svg class="fr-leer-bild" viewBox="0 0 40 40" aria-hidden="true"><use href="#' + K.stufen.bild + '"/></svg>'
      + '<div class="fr-ernte-titel">Ein neuer Tag</div>'
      + '<div class="fr-klein">' + esc(infoZeile(zahlen())) + '</div>';
    $('frFeld').innerHTML = '<button type="button" class="fr-knopf" id="frLos">Los geht’s</button>'
      + '<button type="button" class="fr-knopf leise" id="frHeim">Zur Lichtung</button>';
    eingabeKlasse('ende');
    kartenTag = heuteTag();
    // Ihr Satz von gestern stimmt nicht mehr. Ist ein Fenster offen (die Garderobe über Nacht), stünde er
    // nach dem Schliessen sonst unter «Ein neuer Tag»: dann weg damit, sobald es zu ist.
    const meins = zug;
    if ($('fenster').hidden) { if (zielAuf(WER)) blaseLeeren(); }
    else fensterAbwarten(() => zug === meins && amZug()).then(ja => { if (ja && zielAuf(WER)) blaseLeeren(); });
    kopfZeigen();
  }
  // Die Knöpfe in ihrer Blase (app.js leitet .blase .mini mit data-fr-… an den Kurs auf der Bühne)
  function blasenKnopf(b) {
    if (!b) return;
    if (b.dataset.frZiel && V().LERNZIELE[b.dataset.frZiel]) {
      kursStand.ziele[b.dataset.frZiel] = true;
      sichern();
      starten('runde');
    } else if (b.dataset.frNein !== undefined) {
      Ton.tipp();
      Stimme.stopp();
      blaseLeeren();
    }
  }

  /* ---------- Knöpfe auf der Karte und im Feld ---------- */

  function karteKlick(e) {
    const u = e.target.closest('.fr-unite-knopf');
    if (u) return uniteWaehlen(u.dataset.un);
    const z = e.target.closest('.fr-ernte-zeile');
    if (z && V().VOKABELN[+z.dataset.nr]) return Stimme.einwurf([V().vokabelClip(V().VOKABELN[+z.dataset.nr])], svg.buehne);
    if (e.target.closest('.fr-loesung-play') && lauf) spielen(lauf, lauf.a.clip);
  }
  function feldKlick(e) {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.id === 'frNochmal') starten(R ? (R.modus === 'frei' ? 'frei' : 'runde') : 'runde', R ? R.gruppe : null);
    else if (b.id === 'frFrei') starten('frei');
    else if (b.id === 'frLos') starten('runde');
    else if (b.id === 'frHeim') {
      Ton.tipp();
      verlassen();
    }
  }

  /* ---------- Verlassen, Tasten, Wachsein, Stimme ---------- */

  // Haus-Knopf (still: Wechsel zu einem Rechenthema über das Menü). Alles ist schon verbucht.
  function verlassen(still) {
    aufhoeren();
    sichern();
    if (!still) zurLichtung(WER);
  }

  // Physische Tastatur auf dem Kurs-Bildschirm (2.0). true nur für eine benutzte Taste.
  function taste(e) {
    wach();
    if (!amZug() || !e) return false;
    const k = e.key;
    if (zustand === 'frage') {
      // 1, 2, … wählen die Unité in ihrer Reihe
      const n = /^[1-9]$/.test(k) ? +k : 0;
      if (!n || n > V().UNITE_REIHE.length) return false;
      uniteWaehlen(V().UNITE_REIHE[n - 1]);
      return true;
    }
    const l = lauf;
    // Ernte und leere Karte: die Tasten bleiben beim Browser (Tab, Enter auf dem Knopf mit Fokus)
    if (!l) return false;
    if ((!l.fertig || l.s.uebung === 'kennen') && Uebungen.taste(e)) return true;
    if (!l.fertig) return false;
    if (k === 'Enter' || k === ' ') {
      const f = document.activeElement;
      if (f && f.tagName === 'BUTTON') return false;
      if (!e.repeat) weiterGehen();
      return true;
    }
    // Nach dem Urteil gehört Tab ihr: noch einmal das Wort, statt den Fokus wandern zu lassen
    if (k === 'Tab') {
      if (l.a.ton) spielen(l, l.a.clip);
      return true;
    }
    if (k === 'ArrowDown' && l.a.ton && l.tonL && l.a.clipLangsam) {
      spielen(l, l.a.clipLangsam);
      return true;
    }
    return false;
  }

  // Nach einer Minute ohne Tipp auf einer offenen Aufgabe: «Lass dir Zeit» (3.9), einmal je Aufgabe.
  // Nicht nach einem Fehlversuch: Dann steht ihr Hinweis in der Blase, und den braucht Nea jetzt.
  function warteUhr(l) {
    clearTimeout(warteId);
    if (!l || l.gewartet || l.geurteilt || l.getippt || !beurteilt(l.s)) return;
    warteId = setTimeout(function nachsehen() {
      if (!aktuell(l) || l.geurteilt || l.gewartet || l.getippt) return;
      if (!$('fenster').hidden || !Stimme.istStill()) {
        warteId = setTimeout(nachsehen, 5000);
        return;
      }
      l.gewartet = true;
      sagAls(WER, hz('h_warten'));
    }, 60000);
  }
  // Jeder Fingertipp im Dokument und jede Taste auf dem Kurs-Bildschirm
  function wach() {
    tipps++;
    if (szeneWeg) szeneWeg();
    if (lauf && !lauf.geurteilt) warteUhr(lauf);
    // Ein neuer Tag auf der leeren Karte oder der Ernte. Ein Tipp auf einen Knopf tut, was der Knopf sagt:
    // Jeder rechnet mit dem Tag, an dem er getippt wird. Jeder andere Tipp zeigt die Karte von heute und löst
    // sonst nichts aus; sein Klick landete sonst auf einem Knopf, der eben erst entstanden ist.
    if (Buehne.nebenKnopf() && neuerTag()) Buehne.schlucken();
  }

  // Ohne Stimme keine Hör-Knöpfe (3.9): Ein Knopf, der nichts spielt, wäre eine leere Versprechung
  function hoerKnoepfe(an) {
    for (const el of document.querySelectorAll('#frVorgabe .fr-ton, #frLoesung .fr-loesung-play')) el.hidden = !an;
  }
  // #stimmeBtn auf dem Kurs-Bildschirm, nachdem app.js umgeschaltet hat
  function stimmeUm() {
    const l = lauf;
    if (stand.stimme) {
      sagAls(WER, hz('h_stimme_an'));
      // Die offene Aufgabe bekommt ihren Ton zurück, sobald ihr Wort bereit ist: Rückmeldung, «Ich sag’s!», Tab
      if (l) {
        Stimme.bereit([l.a.clip, l.a.clipLangsam]).then(([ton, tonL]) => {
          if (!aktuell(l) || !stand.stimme) return;
          l.a.ton = !!ton;
          l.tonL = !!tonL && l.a.ton;
          hoerKnoepfe(l.a.ton);
        });
      }
      return;
    }
    if (!l) return;
    // Eine offene Hör-Aufgabe geht ohne Ton nicht: dieselbe Karte ohne Ton (3.9)
    if (!l.geurteilt && brauchtTon(l.s)) {
      const r = l.r, ersatz = L().ohneTon(l.s, r.z);
      lauf = null;
      clearTimeout(warteId);
      Uebungen.aufraeumen();
      if (ersatz) r.schritte[r.i] = ersatz;
      else r.schritte.splice(r.i, 1);
      schrittStarten();
      return;
    }
    l.a.ton = false;
    hoerKnoepfe(false);
  }

  /* ---------- Zum Testen ---------- */

  // Eine einzelne Aufgabe zeigen, ohne etwas zu speichern oder zu zahlen. id: Eintrags-id oder kid,
  // bei paare eine Liste davon. uebung 'diktat' ist schreiben nach dem Ohr, 'ordnen-ton' ordnen nach dem Ohr.
  function probe(uebung, id, teil = 0) {
    const finde = x => V().VOKABELN.find(v => v.id === x || v.kid === x);
    const VORGABE = { kennen: 'fr', bedeutung: 'fr', hoeren: 'ton', lauschen: 'ton', artikel: 'fr', echo: 'fr' };
    let schritt;
    if (uebung === 'paare') {
      const kids = (Array.isArray(id) ? id : [id]).map(finde).filter(Boolean).map(v => v.kid);
      schritt = { uebung: 'paare', rolle: 'paare', kids, wahl: kids };
    } else {
      const e = finde(id);
      if (!e) return null;
      const u = uebung === 'diktat' ? 'schreiben' : uebung === 'ordnen-ton' ? 'ordnen' : uebung;
      const vorgabe = uebung === 'diktat' || uebung === 'ordnen-ton' ? 'ton' : VORGABE[u] || 'de';
      schritt = { kid: e.kid, nr: e.nr, uebung: u, vorgabe, teil, form: 0, rolle: u === 'kennen' || u === 'echo' ? u : 'leit', check: null, neu: false };
    }
    audio();
    Stimme.stopp();
    if (!$('fenster').hidden) fensterZu();
    aufhoeren();
    bildschirmAuf();
    rundeBeginnen('runde', null, null, { schritt, z: JSON.parse(JSON.stringify(kursStand)) });
    kopfZeigen();
    return schritt;
  }
  // Für Prüfskripte: was gerade läuft
  probe.stand = () => ({ R, lauf, zustand });

  /* ---------- Wörterheft: ein Reiter im Album (7.1) ---------- */

  const PLAY = '<span class="play" aria-hidden="true"><svg viewBox="0 0 24 24"><use href="#i-ton"/></svg></span>';
  // Was das Heft gerade zeigt. Jeder Aufruf aus app.js (Reiter, Karte, Eltern) fängt mit «Alle» an.
  // gesagt: ihr Satz zum Heft kam schon; still: jemand anderes spricht gerade (keine Auswahl)
  const heft = { sub: '', filter: 'alle', gesagt: false, still: false, zuletzt: { nr: -1, zeit: 0 } };
  const stufeVon = kid => L().zustand(kursStand, kid).st;
  // Wackelig: wächst schon, aber etwas fällt noch schwer (K.schwach nennt was) oder ging zuletzt daneben
  const wackelig = k => k.st >= 1 && (Object.keys(K.schwach).reduce((n, art) => n + k.schwach[art], 0) > 0 || k.zuletzt.slice(-1) === 'f');
  // Die Farbe einer Unité mit Weiss aufgehellt: der runde Grund ihres Bildes
  function hell(hex, anteil) {
    const n = parseInt(hex.slice(1), 16), k = i => Math.round(((n >> i) & 255) * anteil + 255 * (1 - anteil));
    return 'rgb(' + k(16) + ',' + k(8) + ',' + k(0) + ')';
  }
  // Das Gesicht der Lehrerin auf dem Grund in der Farbe der Unité (K.lehrer.grund tönt ihn)
  const uniteBild = un => '<svg viewBox="0 0 80 80" aria-hidden="true" style="' + K.lehrer.grund + ':' + hell(V().UNITES[un].farbe, 0.28) + '"><use href="#' + K.lehrer.icon + '"/></svg>';

  // app.js ruft das für K.tab (sub '') und K.tab + ':u2' (sub 'u2'); die Tipps kommen über albumKlick
  function albumTab(inhalt, sub) {
    heft.filter = 'alle';
    heft.gesagt = heft.still;
    heftZeigen(inhalt, V().UNITES[sub] ? sub : '');
  }
  function heftZeigen(inhalt, sub, blaettern) {
    heft.sub = sub;
    // data-kurs: der Haken für die Farben eines Kurses (das Beet als Reisfeld, franz.css)
    inhalt.innerHTML = '<div class="fr-heft" data-kurs="' + K.key + '">' + (sub ? heftUnite(sub) : heftUebersicht()) + '</div>';
    if (blaettern) inhalt.scrollTop = 0;
    // «Tippe auf ein Wort» stimmt erst auf einer Seite mit Wörtern: dort, einmal je Aufschlagen, jedes zweite Mal
    if (sub && !heft.gesagt) {
      heft.gesagt = true;
      if (Math.random() < 0.5) Stimme.sprechen(clipVon(hz('h_album'), WER), { svg: null });
    }
  }

  // Übersicht: das ganze Beet, die Legende der Stufen und die Unités
  function heftUebersicht() {
    const z = zahlen(), { VOKABELN, UNITES, UNITE_REIHE, LERNZIELE, LERNZIEL_REIHE } = V();
    const beet = VOKABELN.map(e => '<i class="s' + stufeVon(e.kid) + '"></i>').join('');
    const legende = K.stufen.namen.map((name, st) => '<span>' + Uebungen.stufeHTML(st, UE) + name + ' <b>' + z.stufen[st] + '</b></span>').join('');
    const unites = UNITE_REIHE.map(un => {
      const u = UNITES[un], p = z.proUnite[un] || { alle: 0, gekannt: 0 };
      const geuebt = LERNZIEL_REIHE.some(g => LERNZIELE[g].un === un && kursStand.ziele[g]);
      return '<button type="button" class="kat fr-unite" data-un="' + un + '" style="--unite:' + u.farbe + '">' + uniteBild(un)
        + '<span class="fr-unite-text"><b>' + esc(u.name + ' · ' + u.titel) + '</b>'
        + '<small>' + p.gekannt + ' von ' + p.alle + ' kennengelernt' + (geuebt ? ' <span class="fr-geuebt">wird geübt</span>' : '') + '</small>'
        + '<span class="mini-balken"><i style="width:' + (p.alle ? Math.round(p.gekannt / p.alle * 100) : 0) + '%"></i></span></span></button>';
    }).join('');
    // Wem das Beet gehört: ihr (Erdbeerbeet von Pirouette) oder, wo der Kurs es sagt, Nea (Reisfeld von Nea)
    const beetName = K.stufen.beet + (K.stufen.wem || K.lehrer.name);
    return '<section class="fr-beet" aria-label="' + esc(beetName) + '">'
      + '<div class="fr-beet-kopf"><h3>' + esc(beetName) + '</h3>'
      + '<small>' + z.gekannt + ' von ' + VOKABELN.length + ' Wörtern kennengelernt · ' + z.reif + ' reif</small></div>'
      + '<div class="fr-beet-reihe" aria-hidden="true">' + beet + '</div>'
      + '<div class="fr-legende">' + legende + '</div></section>'
      + '<div class="kat-liste fr-unites">' + unites + '</div>';
  }

  // Eine Unité: Filter, dann je Lernziel der Schalter, «Für den Test üben» und alle Wörter
  function heftUnite(un) {
    const { UNITES, LERNZIELE, LERNZIEL_REIHE } = V();
    const u = UNITES[un], z = zahlen(), p = z.proUnite[un] || { alle: 0, gekannt: 0 };
    const passt = e => {
      const k = L().zustand(kursStand, e.kid);
      return heft.filter === 'reif' ? k.st === 5 : heft.filter === 'wackelig' ? wackelig(k) : true;
    };
    const filter = [['alle', 'Alle'], ['wackelig', 'Wackelig'], ['reif', 'Reif']].map(([f, name]) =>
      '<button type="button" class="fr-filter' + (heft.filter === f ? ' an' : '') + '" data-f="' + f + '" aria-pressed="' + (heft.filter === f) + '">' + name + '</button>').join('');
    const leer = heft.filter === 'reif' ? 'Hier ist noch nichts reif.' : 'Hier wackelt gerade nichts.';
    const bloecke = LERNZIEL_REIHE.filter(g => LERNZIELE[g].un === un).map(g => {
      const lz = LERNZIELE[g], an = !!kursStand.ziele[g];
      const gekannt = lz.eintraege.filter(e => stufeVon(e.kid) >= 1).length;
      const zeilen = lz.eintraege.filter(passt).map(eintragHTML).join('');
      return '<section class="fr-lz' + (an ? ' an' : '') + '" data-g="' + g + '">'
        + '<div class="fr-lz-kopf"><div class="fr-lz-titel"><b>' + esc(lz.name) + '</b>' + (lz.plus && K.buch ? '<span class="fr-plus">' + esc(K.buch.plus) + '</span>' : '')
        + '<small>' + gekannt + ' von ' + lz.eintraege.length + ' kennengelernt</small></div>'
        + '<div class="fr-lz-knoepfe"><button type="button" class="fr-schalter" data-ziel="' + g + '" aria-pressed="' + an + '"><i aria-hidden="true"></i>üben</button>'
        + (K.buch && K.buch.test ? '<button type="button" class="mini" data-frei="' + g + '">' + esc(K.buch.test) + '</button>' : '') + '</div></div>'
        + (zeilen ? '<div class="fr-lz-liste">' + zeilen + '</div>' : '<p class="fr-lz-leer">' + leer + '</p>') + '</section>';
    }).join('');
    return '<button type="button" class="zurueck-link" data-zurueck>' + esc(K.kapitel.alle) + '</button>'
      + '<div class="fr-heft-kopf" style="--unite:' + u.farbe + '">' + uniteBild(un)
      + '<div><h3>' + esc(u.name + ' · ' + u.titel) + '</h3><small>' + p.gekannt + ' von ' + p.alle + ' kennengelernt</small></div></div>'
      + '<div class="fr-filter-zeile" role="group" aria-label="Welche Wörter">' + filter + '</div>' + bloecke;
  }
  // Eine Liste mit Schrägstrich («bleue/verte/rouge») darf nach jedem Strich umbrechen, nie mitten im Wort.
  // Nur im Text, nicht in den Tags (</span>).
  const strichUmbruch = html => html.replace(/\/(?![^<]*>)/g, '/<wbr>');
  // Ein Wort im Heft: Stufe, die Fremdsprache wie im Buch (Artikel in seiner Farbe), Deutsch, Lautsprecher.
  // Beide «la fille» zeigen dieselbe Karte, also dieselbe Stufe.
  function eintragHTML(e) {
    const k = L().zustand(kursStand, e.kid);
    return '<button type="button" class="fakt-eintrag fr-eintrag" data-nr="' + e.nr + '">' + Uebungen.stufeHTML(k.st, UE)
      + '<span class="fr-eintrag-text"><span lang="' + K.lang + '">' + strichUmbruch(Uebungen.frHTML(e.fr, e)) + '</span><small>' + strichUmbruch(esc(e.de)) + '</small></span>'
      + (k.gesehen === 0 ? '<span class="fr-neu">neu</span>' : '') + PLAY + '</button>';
  }

  function albumKlick(ev) {
    const t = ev.target, inhalt = $('fensterInhalt');
    let b;
    if ((b = t.closest('.fr-unite[data-un]'))) {
      Ton.tipp();
      return heftZeigen(inhalt, b.dataset.un, true);
    }
    if (t.closest('[data-zurueck]')) {
      Ton.tipp();
      return heftZeigen(inhalt, '', true);
    }
    if ((b = t.closest('.fr-filter[data-f]'))) {
      Ton.tipp();
      heft.filter = b.dataset.f;
      return heftZeigen(inhalt, heft.sub);
    }
    if ((b = t.closest('.fr-schalter[data-ziel]'))) return schalten(b);
    if ((b = t.closest('[data-frei]'))) {
      if (V().LERNZIELE[b.dataset.frei]) starten('frei', b.dataset.frei);
      return;
    }
    if ((b = t.closest('.fr-eintrag[data-nr]'))) vorlesen(b);
  }
  // Ein Lernziel üben oder nicht. Alle auszuschalten ist erlaubt (3.9: dann öffnet der Start das Heft).
  function schalten(b) {
    const g = b.dataset.ziel;
    if (!V().LERNZIELE[g]) return;
    Ton.tipp();
    if (kursStand.ziele[g]) delete kursStand.ziele[g];
    else kursStand.ziele[g] = true;
    sichern();
    const an = !!kursStand.ziele[g];
    b.setAttribute('aria-pressed', String(an));
    const block = b.closest('.fr-lz');
    if (block) block.classList.toggle('an', an);
  }
  // Ein Tipp liest das Wort vor, ein zweiter innerhalb von drei Sekunden langsam (wo es das gibt)
  function vorlesen(b) {
    const e = V().VOKABELN[+b.dataset.nr];
    if (!e) return;
    const jetzt = Date.now(), nochmal = heft.zuletzt.nr === e.nr && jetzt - heft.zuletzt.zeit < 3000;
    heft.zuletzt = nochmal ? { nr: -1, zeit: 0 } : { nr: e.nr, zeit: jetzt };
    const clip = (nochmal && V().vokabelClip(e, undefined, undefined, true)) || V().vokabelClip(e);
    for (const x of document.querySelectorAll('.fr-eintrag.spielt')) x.classList.remove('spielt');
    b.classList.add('spielt');
    // Nea hat getippt: Lädt die Aufnahme noch, darf das länger dauern als bei einer Ansage (tipp)
    Stimme.sprechen([clip], { svg: null, tipp: true }).then(() => b.classList.remove('spielt'));
  }

  /* ---------- Für Eltern (7.2) ---------- */

  // Steht im Eltern-Fenster direkt vor «Einstellungen». Wirft nie: sonst bliebe das Fenster leer.
  // data-kurs am Block: elternKlick hört nur auf die Knöpfe in seinem eigenen
  function elternHTML() {
    try {
      const z = zahlen(), { VOKABELN, UNITES, UNITE_REIHE, KARTE } = V(), N = VOKABELN.length;
      const zellen = z.stufen.map((n, st) => '<div>' + Uebungen.stufeHTML(st, UE) + '<b>' + n + '</b><small>' + K.stufen.namen[st] + '</small></div>').join('');
      const unites = UNITE_REIHE.map(un => {
        const p = z.proUnite[un] || { alle: 0, gekannt: 0, frucht: 0, reif: 0 }, pz = n => (p.alle ? Math.round(n / p.alle * 100) : 0);
        return '<div class="fr-eltern-unite"><span class="fr-eltern-name">' + esc(UNITES[un].name) + ' <small>' + esc(UNITES[un].titel) + '</small></span>'
          + '<span class="fr-eltern-balken" title="' + p.gekannt + ' kennengelernt, ' + p.frucht + ' ' + K.stufen.mit + ', ' + p.reif + ' reif">'
          + '<i class="gekannt" style="width:' + pz(p.gekannt) + '%"></i><i class="frucht" style="width:' + pz(p.frucht) + '%"></i></span>'
          + '<span class="fr-eltern-zahl">' + p.gekannt + '/' + p.alle + '</span></div>';
      }).join('');
      const schwer = z.schwer.filter(x => KARTE[x.kid]).map(x => {
        const e = KARTE[x.kid];
        return '<li><span class="fr-schwer-wort"><span lang="' + K.lang + '">' + Uebungen.frHTML(e.fr, e) + '</span> <small>' + esc(e.de) + '</small></span>'
          + '<span class="fr-schwer-zahl">' + x.falsch + '× verpasst' + (x.art && K.schwach[x.art] ? ' · ' + K.schwach[x.art] : '') + '</span></li>';
      }).join('');
      const da = !!kursStand.vorgestellt;
      // Vor ihrem ersten Treffen: Es kommt beim nächsten Start, ausser ein Kurs vor ihr (KURSE in app.js) wartet
      // selbst noch auf seines. Dann kommt sie erst beim Start nach jenem Treffen (kurseBegruessen: eines je Start).
      const vor = da || typeof kurseDa !== 'function' ? null : kurseDa().map(k => k.modul()).find(m => !m.vorgestellt());
      const kommt = vor && vor !== self ? ' stellt sich beim Start nach dem Treffen mit ' + esc(vor.kurs.lehrer.name) + ' auf der Lichtung vor.'
        : ' stellt sich beim nächsten Start auf der Lichtung vor.';
      return '<div class="fr-eltern" data-kurs="' + K.key + '">'
        + '<h3>' + esc(K.name) + '</h3>'
        + '<div class="agg sechs fr-stufen">' + zellen + '</div>'
        + '<p class="klein">Wörter je Stufe, von ' + N + ': ' + esc(K.stufen.spanne) + '.</p>'
        + '<div class="fr-eltern-unites">' + unites + '</div>'
        + '<p class="klein"><span class="fr-farbe gekannt">■</span> kennengelernt &nbsp; <span class="fr-farbe frucht">■</span> ' + esc(K.stufen.mit) + '</p>'
        + (schwer ? '<h3>Am schwierigsten</h3><ol class="fr-schwer">' + schwer + '</ol>' : '')
        + '<div class="einstellung"><span>Neue Wörter pro Tag</span><span class="wahl-knoepfe" data-fr-set="neuProTag">'
        + L().K.NEU_WAHL.map(n => '<button type="button" data-wert="' + n + '" class="' + (kursStand.neuProTag === n ? 'an' : '') + '">' + n + '</button>').join('')
        + '</span></div>'
        + '<div class="fr-eltern-knoepfe">'
        + (da ? '<button type="button" class="mini" data-fr-auswahl>Lernziele auswählen</button>'
          : '<p class="klein">' + esc(K.lehrer.name) + kommt + ' Danach lassen sich hier die Lernziele wählen.</p>')
        + '<button type="button" class="gefahr" data-fr-reset>' + (resetScharf === K.key ? 'Wirklich? Nochmal tippen.' : esc(K.name) + '-Fortschritt löschen') + '</button>'
        + '</div></div>';
    } catch (e) {
      setTimeout(() => { throw e; });
      return '';
    }
  }
  // Tipps im Eltern-Fenster, vor app.js' eigenen, nur im eigenen Block. true: erledigt (und neu gezeichnet).
  function elternKlick(ev) {
    const t = ev.target, block = t.closest('.fr-eltern');
    if (!block || block.dataset.kurs !== K.key) return false;
    const w = t.closest('[data-fr-set="neuProTag"] button[data-wert]');
    if (w) {
      const n = +w.dataset.wert;
      if (L().K.NEU_WAHL.includes(n)) {
        kursStand.neuProTag = n;
        sichern();
      }
      Ton.tipp();
      elternZeigen();
      return true;
    }
    if (t.closest('[data-fr-auswahl]')) {
      Ton.tipp();
      fensterAuf('album', K.tab + (kapitel() ? ':' + kapitel() : ''));
      return true;
    }
    if (t.closest('[data-fr-reset]')) {
      // Zwei Tipps wie bei den anderen: der erste macht scharf
      if (resetScharf !== K.key) resetScharf = K.key;
      else {
        resetScharf = '';
        zuruecksetzen();
        kopfZeigen();
      }
      elternZeigen();
      return true;
    }
    return false;
  }
  // Fortschritt des Kurses löschen (7.2): Karten, Tag, Zähler und Erklärungen weg, und was ein frischer Stand
  // sonst noch neu anlegt (beim Otter die Liste seiner Doppelwörter: Aus ihr entsteht der Zähler doppel beim
  // Laden neu, er käme sonst nach dem nächsten Start zurück).
  // Es bleiben: sie ist vorgestellt, die Unité, die Auswahl, die Wörter pro Tag. Die Äpfel gehören stand.
  const BLEIBT = ['v', 'vorgestellt', 'gehoert', 'unite', 'ziele', 'neuProTag'];
  function zuruecksetzen() {
    const neu = L().neu();
    for (const k of Object.keys(neu)) if (!BLEIBT.includes(k)) kursStand[k] = neu[k];
    sichern();
    // Eine laufende Runde kennt die alten Karten: Sie endet, dahinter steht wieder die Lichtung
    aufhoeren();
    if (amZug()) {
      Stimme.stopp();
      zeigeBildschirm('lichtung');
      themenZeichnen();
    }
  }

  /* ---------- Erfolge (6.3) ---------- */

  // Was jeder Erfolg zählt und wie viel er braucht (K.erfolge.zahl): Stufen über alle Einträge oder ein
  // Zähler aus 9.5. Dazu je Kurs drei feste: <prefix>unite (oder wie K.erfolge.unite ihn nennt),
  // <prefix>zwei und <prefix>partner, und was K.erfolge.mehr(heute) noch weiss.
  // Läuft in jedem pruefeErfolge, auch nach jeder Rechenaufgabe: zählen ohne zu planen
  function erfolgZahlen() {
    const n = { gekannt: 0, frucht: 0, reif: 0 }, basis = {};
    const karten = kursStand.karten || {};
    for (const e of V().VOKABELN) {
      const k = karten[e.kid], st = k ? clamp(Math.floor(+k.st) || 0, 0, 5) : 0;
      if (st >= 1) n.gekannt++;
      if (st >= 3) n.frucht++;
      if (st === 5) n.reif++;
      if (!e.plus) {
        const b = basis[e.un] || (basis[e.un] = { alle: 0, frucht: 0 });
        b.alle++;
        if (st >= 3) b.frucht++;
      }
    }
    n.unite = Object.values(basis).some(b => b.alle > 0 && b.frucht === b.alle);
    return Object.assign(n, kursStand.zaehler || {});
  }
  const soll = id => K.erfolge.zahl[id][1] || V().VOKABELN.length;
  function erfolgBedingungen() {
    try {
      if (!kursStand) return {};
      const E = K.erfolge, n = erfolgZahlen(), bed = {};
      for (const id of Object.keys(E.zahl)) bed[id] = (+n[E.zahl[id][0]] || 0) >= soll(id);
      bed[E.unite || E.prefix + 'unite'] = n.unite;
      // Heute gerechnet und im Kurs geübt: K.fach ist sein Anteil von total, gerechnet ist, was keinem
      // Kurs gehört (rechnenVon in app.js, 6.4)
      const t = statsLaden()[heuteKey()] || {}, mein = +t[K.fach] || 0;
      bed[E.prefix + 'zwei'] = mein > 0 && rechnenVon(t) > 0;
      // Pieks und sie tragen auf einem Platz dasselbe Teil (mit E.partnerMit auch alle, die dort stehen)
      const an = stand.an || {}, andere = [E.partner, ...(E.partnerMit || [])].map(k => stand[k] || {});
      bed[E.prefix + 'partner'] = Object.keys(PLAETZE).some(p => !!an[p] && andere.every(x => an[p] === x[p]));
      if (E.mehr) Object.assign(bed, E.mehr(t));
      // Was eine andere Figur braucht (E.mitFigur: Erfolg → ihr Buchstabe in FIGUREN), gilt nur, solange sie auf
      // der Lichtung steht: «Wie Drillinge» ginge ohne das Hörnchen sonst mit ihrem Outfit von früher
      for (const id of Object.keys(E.mitFigur || {})) if (!figurDa(E.mitFigur[id])) bed[id] = false;
      return bed;
    } catch (e) {
      return {};
    }
  }
  function erfolgFortschritt() {
    try {
      if (!kursStand) return {};
      const n = erfolgZahlen(), fort = {};
      for (const id of K.erfolge.balken) fort[id] = [+n[K.erfolge.zahl[id][0]] || 0, soll(id)];
      return fort;
    } catch (e) {
      return {};
    }
  }
  // Ein Erfolg, der nur mit der Stimme der Lehrerin zu erreichen ist (K.erfolge.mitStimme), steht nicht in der
  // Liste, solange es ihre Aufnahmen nicht gibt: Geprüft wird die erste Vokabel. Weiss die App das noch nicht
  // (die Liste der Aufnahmen lädt), bleibt er stehen. Ebenso einer, der eine andere Figur braucht
  // (K.erfolge.mitFigur), solange sie nicht auf der Lichtung steht (ihr Kurs fehlt).
  function erfolgVersteckt(id) {
    try {
      const nur = K.erfolge.mitStimme, wer = K.erfolge.mitFigur && K.erfolge.mitFigur[id];
      if (wer && !figurDa(wer)) return true;
      return !!nur && nur.includes(id) && Stimme.hat(V().vokabelClip(V().VOKABELN[0])) === false;
    } catch (e) {
      return false;
    }
  }

  const self = {
    kurs: K, svg, einrichten, begruessen, karteZeichnen, starten, verlassen, taste, wach, stimmeUm, chip,
    albumTab, albumKlick, elternHTML, elternKlick, zuruecksetzen, erfolgBedingungen, erfolgFortschritt, erfolgVersteckt,
    zahlen, kitzeln: kitzelnLehrer, blasenKnopf, speichern: sichern, probe,
    // Für app.js: ist sie vorgestellt, hat sie die Bühne zuletzt übernommen (Buehne.aktiv: Sie unterrichtet,
    // solange der Kurs-Bildschirm zu sehen ist), eine Zeile aus ihren Listen (beim Namen wie bei Pirouette,
    // h_… oder p_…), wie viele Einträge hat ihr Wortschatz
    vorgestellt: () => !!(kursStand && kursStand.vorgestellt),
    aktiv: () => Buehne.aktiv === self,
    zeile: name => (name.startsWith('p_') ? pz(name) : hz(name)),
    eintraege: () => V().VOKABELN.length,
  };
  Buehne.anmelden(self, {
    pruefen: () => { if (lauf && !lauf.geurteilt) Uebungen.pruefen(); },
    weissNicht: () => { if (lauf && !lauf.geurteilt) Uebungen.weissNicht(); },
    weiter: weiterGehen, karteKlick, feldKlick, neuerTag, aufhoeren,
  });
  return self;
}

/* =====================================================================
   DER KURS FRANZÖSISCH: Pirouette und ihre 210 Wörter aus dem Buch.
   Alles, was nur dieses Fach und diese Lehrerin ausmacht. Namen aus den
   Nachbardateien stehen hinter Gettern und Funktionen: Fehlt eine Datei,
   lädt franz.js trotzdem, und franzDa() in app.js sagt nein.
   ===================================================================== */
const KURS_FRANZ = (() => {
  // Ein Apfel fällt vom linken Baum auf Pieks. Ohne Bewegung (reduce) gibt es ihn nicht.
  async function apfelFaellt() {
    if (reduce || !heldSVG) return;
    const krone = document.querySelector('.b-links .krone');
    if (krone) {
      krone.classList.remove('schuettelt');
      void krone.getBoundingClientRect();
      krone.classList.add('schuettelt');
      setTimeout(() => krone.classList.remove('schuettelt'), 1100);
    }
    await pause(380);
    const von = krone && krone.getBoundingClientRect(), zu = heldSVG.getBoundingClientRect();
    if (!von || !von.width || !zu.width) return;
    const gr = 34;
    const x0 = von.left + von.width * .6 - gr / 2, y0 = von.top + von.height * .2 - gr / 2;
    const dx = zu.left + zu.width * .5 - gr / 2 - x0, dy = zu.top + zu.height * .22 - gr / 2 - y0;
    // Die Krone steht oft tiefer als sein Kopf: Der Schweif schnellt den Apfel hoch, im Bogen fällt er auf Pieks
    const gipfel = Math.max(8 - y0, Math.min(0, dy) - Math.max(90, zu.height * .45));
    const hoehe = t => 2 * (1 - t) * t * (2 * gipfel - dy / 2) + t * t * dy;
    const a = document.createElementNS(SVGNS, 'svg');
    a.setAttribute('class', 'fall-apfel');
    a.setAttribute('viewBox', '0 0 40 40');
    a.setAttribute('aria-hidden', 'true');
    a.innerHTML = '<use href="#apfel"/>';
    Object.assign(a.style, { left: x0 + 'px', top: y0 + 'px', width: gr + 'px', height: gr + 'px' });
    document.body.appendChild(a);
    // Seitwärts gleichmässig, in der Höhe ein Bogen; dann prallt er ab und rollt weg
    const bahn = [];
    for (let i = 0; i <= 10; i++) {
      const t = i / 10;
      bahn.push({ transform: `translate(${dx * t}px, ${hoehe(t)}px) rotate(${t * 220}deg)`, opacity: 1, offset: t * .72 });
    }
    // Erst nach dem Aufprall verblasst er
    bahn.push({ transform: `translate(${dx + 22}px, ${dy - 34}px) rotate(260deg)`, opacity: 1, offset: .86 });
    bahn.push({ transform: `translate(${dx + 46}px, ${dy + 16}px) rotate(330deg)`, opacity: 0, offset: 1 });
    // Pieks erschrickt, wenn der Apfel ihn trifft
    const treffer = setTimeout(() => stimmung(heldSVG, 'oops', 1400), 1050 * .72);
    try { await a.animate(bahn, { duration: 1050, easing: 'linear' }).finished; } catch (e) { clearTimeout(treffer); }
    a.remove();
  }
  // Drei Sprünge von rechts herein
  async function hereinHuepfen(el) {
    if (reduce) return;
    const r = el.getBoundingClientRect();
    const dx = Math.max(140, innerWidth - r.left);
    const bahn = [];
    for (let i = 0; i < 3; i++) {
      const a = dx * (1 - i / 3), b = dx * (1 - (i + 1) / 3);
      bahn.push({ transform: `translate(${a}px, 0)`, offset: i / 3 });
      bahn.push({ transform: `translate(${(a + b) / 2}px, -${38 - i * 8}px)`, offset: (i + .5) / 3 });
    }
    bahn.push({ transform: 'translate(0, 0)', offset: 1 });
    el.style.zIndex = 5;
    try { await el.animate(bahn, { duration: 900, easing: 'ease-out' }).finished; } catch (e) { /* abgebrochen */ }
    el.style.zIndex = '';
  }

  return {
    key: 'franz',                 // Kurs in franz.js und app.js (Menü, data-kurs, Zurücksetzen)
    fach: 'fr',                   // Anteil in der Tages-Statistik (belohnen, verfehlt)
    speicher: FRANZ_KEY,
    merke: s => { frStand = s; },   // der Stand auch als frStand, wie bisher
    lang: 'fr',
    name: 'Französisch',
    tab: 'woerter',               // Reiter im Album ('woerter', 'woerter:u2')
    get V() {
      return { UNITES, UNITE_REIHE, VOKABELN, LERNZIELE, LERNZIEL_REIHE, KARTE, KARTEN, ohneKlammern, vokabelClip };
    },
    get lernen() { return Lernen; },
    lehrer: {
      wer: 'h',                   // Sprecherin in app.js (FIGUREN.h)
      svg: () => hoernchenSVG(),
      get name() { return HOERNCHEN.name; },
      laut: () => Ton.keckern(),
      icon: 't-franz',            // ihr Gesicht: Fach, Abzeichen, Bild der Unités
      grund: '--franz-grund',     // tönt den runden Grund von icon
      // Drehen, Verstecken, Schweif zeigen (hoernchen.css); ihr Ende erkennt die Regel am Namen der Animation
      bewegungen: ['dreht', 'versteckt', 'zeigt-schweif'],
      bewegungEnde: /dreh|versteckt|faecher|ruhe/,
      drehung: 'dreht',
    },
    // Ihre Listen (lehrer), Pieks' Sätze im Kurs (pieks), Merkhilfen und Wortmomente je Eintrag. Der Code
    // nennt jede Liste beim Namen, den sie hier hat; ein anderer Kurs setzt seine Vorsilben davor
    // (h_richtig → o_richtig) oder nennt den ganzen Namen in namen ({ p_fr_start: 'pi_start' }).
    texte: {
      get lehrer() { return HTEXTE; },
      get pieks() { return PTEXTE; },
      get merk() { return MERKHILFEN; },
      get momente() { return WORTMOMENTE; },
      vorsilbe: { lehrer: 'h_', pieks: 'p_' },
      namen: {},
      // Nur wahr, solange sie die einzige Lehrerin ist: «Pieks hat die Zahlen, ich habe die Wörter» (h_gruss[5]).
      // Hat sich ein anderer Kurs vorgestellt, hat auch er Wörter, und die Zeile kommt nicht mehr.
      nurAllein: { h_gruss: [5] },
    },
    // Das erste Treffen: Ein Apfel fällt Pieks auf den Kopf, sie hüpft herein, stellt sich vor, dreht sich
    // zu ihrem Namen, ihre Karte springt herein. t: was Kurs() dazu gibt (held, karte, svg, gilt, kommt,
    // karteKommt, gehoert, bewegung). true: Die Szene lief bis zum Schluss.
    async treffen(t) {
      // 1. Die Krone schüttelt sich, ein Apfel fällt Pieks auf den Kopf
      await apfelFaellt();
      if (!t.gilt()) return false;
      if (reduce) stimmung(heldSVG, 'oops', 1200);
      // 2. «Autsch!»
      if (!(await sagAls('p', PTEXTE.p_besuch[0])) || !t.gilt()) return false;
      // 3. Sie hüpft herein und stellt sich vor
      t.kommt();
      await hereinHuepfen(t.held);
      if (!t.gilt()) return false;
      Ton.keckern();
      if (!(await sagAls('h', HTEXTE.h_vorstellen[0]))) return false;
      t.gehoert();
      if (!t.gilt()) return false;
      // 4. Pieks stellt sie vor, sie dreht sich zu ihrem Namen
      if (!(await sagAls('p', PTEXTE.p_besuch[1])) || !t.gilt()) return false;
      const witz = HTEXTE.h_name_witz && HTEXTE.h_name_witz[0];
      if (witz) {
        t.bewegung(t.svg.held, 'dreht');
        if (!(await sagAls('h', witz)) || !t.gilt()) return false;
      }
      // 5. Das Wörterheft
      if (!(await sagAls('h', HTEXTE.h_vorstellen[1])) || !t.gilt()) return false;
      // 6. Ihre Karte springt herein
      t.karteKommt();
      return true;
    },
    ids: {
      held: 'heldHoernchen', buehne: 'franzHoernchen', karte: 'franzKarte', start: 'franzStart',
      info: 'franzInfo', balken: 'franzBalken', woerter: 'franzWoerterBtn', auswahl: 'franzAuswahlBtn',
    },
    // Die Frage nach der Unité zu Beginn (leer: Der Kurs beginnt mit seinem ersten Kapitel)
    kapitel: { frage: 'Bei welcher Unité seid ihr in der Schule?', alle: '← Alle Unités' },
    // Das Schulbuch (false: keines)
    buch: { steht: 'Im Buch steht: ', zuerst: 'Im Buch steht zuerst: ', test: 'Für den Test üben', plus: 'Plus' },
    // Die Stufen einer Karte als Erdbeere: Namen, Beet, Bilder (bild: leere Karte, symbol: reife-0 … reife-5)
    stufen: {
      namen: ['Samen', 'Knospe', 'Blüte', 'Grüne Erdbeere', 'Halb rot', 'Reif'],
      beet: 'Erdbeerbeet von ', mit: 'mit Erdbeere',
      spanne: 'vom Samen (noch nicht kennengelernt) bis zur reifen Erdbeere',
      bild: 'erdbeere', symbol: 'reife-',
    },
    // Was einer Karte schwerfällt, für die Eltern (die Zähler legt lernen.js an)
    schwach: { genus: 'Artikel', akzent: 'Akzente', hoeren: 'Hören' },
    // Welche Zeilen zu einem ersten Fehlversuch passen. Steht ein Artikel-Hinweis davor, ist mehr als eine
    // Stelle falsch (der Artikel ist rot oder fehlt): Dann nur Kern-Zeilen, die das nicht bestreiten, also kein
    // «Die Buchstaben stimmen», «Alle Buchstaben», «Nur ein Buchstabe» oder «eine Stelle» (KERN_IM_DOPPEL).
    // h_tipp_ligatur und h_tipp_anders stimmen dort ganz. Zwei vertauschte Buchstaben sind ein Tippfehler
    // mit zwei Marken: «Nur ein Buchstabe» stimmt dann nicht (KERN_DREHER).
    // Jede Tafel darf fehlen. Ein Kurs mit eigener Regel gibt dazu vor(t): t ist der Tipp aus uebungen.js
    // (beim Schreiben das Urteil von Lernen.urteil), zurück kommt der Name einer Liste oder null.
    tipps: {
      TIPP: { akzent: 'h_tipp_akzent', genus: 'h_tipp_genus', buchstabe: 'h_tipp_buchstabe', legen: 'h_tipp_legen', reihenfolge: 'h_tipp_reihenfolge' },
      ARTIKEL_TIPP: { fehlt: 'h_tipp_artikel_fehlt', genus: 'h_tipp_genus', elision: 'h_tipp_elision', artikel_ganz: 'h_tipp_artikel_ganz', anders: 'h_tipp_anders' },
      KERN_TIPP: { ligatur: 'h_tipp_ligatur', akzent: 'h_tipp_akzent', zeichen: 'h_tipp_zeichen', tippfehler: 'h_tipp_buchstabe', anders: 'h_tipp_anders' },
      KERN_IM_DOPPEL: { h_tipp_akzent: [0, 2, 3], h_tipp_zeichen: [1], h_tipp_buchstabe: [3] },
      KERN_DREHER: { h_tipp_buchstabe: [1, 2, 3] },
      // Akzente und Zeichen zugleich ohne Artikel-Hinweis: diese zwei Zeilen
      akzentUndZeichen: [{ liste: 'h_tipp_akzent', nr: 0 }, { liste: 'h_tipp_zeichen', nr: 0 }],
      // Die Zeile von «nichts fällig», die freies Üben anbietet
      freiUeben: { liste: 'h_nichts_faellig', nr: 3 },
    },
    erfolge: {
      prefix: 'fr_',
      // Was jeder Erfolg zählt und wie viel er braucht: Stufen über die 210 Einträge (0: alle) oder ein Zähler aus 9.5
      zahl: {
        fr_erstes: ['gekannt', 1], fr_runden10: ['runden', 10], fr_25: ['frucht', 25], fr_100: ['frucht', 100],
        fr_reif1: ['reif', 1], fr_reif50: ['reif', 50], fr_reifAlle: ['reif', 0], fr_saetze10: ['saetze', 10],
        fr_ohr25: ['ohr', 25], fr_lela20: ['lelaBest', 20], fr_akzent20: ['akzent', 20], fr_schreiben25: ['geschrieben', 25],
        fr_perfekt: ['perfekt', 1],
      },
      balken: ['fr_runden10', 'fr_25', 'fr_100', 'fr_reif50', 'fr_reifAlle', 'fr_saetze10', 'fr_ohr25', 'fr_lela20', 'fr_akzent20', 'fr_schreiben25'],
      partner: 'anH',             // Partnerlook: ihr Outfit im Stand neben Pieks' stand.an
    },
    // Die Tastatur beim Schreiben steht nicht hier: Sie kommt aus dem Sprachprofil des Lernens (siehe UE in Kurs)
  };
})();

const Franz = Kurs(KURS_FRANZ);
