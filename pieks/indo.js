'use strict';

/* =====================================================================
   DER KURS INDONESISCH: Percik, der Zwergotter, und seine Wörter
   Dieselbe Maschine wie das Französisch (Kurs in franz.js): Hier steht
   nur, was diesen Kurs und seinen Lehrer ausmacht. Wörter und Lernen
   kommen aus indo-vokabeln.js (VOK_INDO, mit dem Sprachprofil SPRACHE
   für Lernen.kurs), seine Zeilen und Pieks' Zeilen im Kurs aus
   indo-texte.js (INDO_TEXTE), seine Zeichnung aus otter.js.

   Beim Laden wird nichts aus den Nachbardateien gelesen: Jeder Name
   steht hinter einem Getter oder in einer Funktion. Fehlt eine Datei
   oder bricht sie ab, lädt indo.js trotzdem, und app.js lässt den Kurs
   weg (KURSE.indo.geladen); Pieks und das Französisch laufen weiter.
   Gespeichert wird unter nea.igel.indo, im Augenblick jedes Urteils.

   Was es hier nicht gibt: Artikel, Akzente, ein Schulbuch («Für den
   Test üben», «Plus») und die Frage nach der Unité. Der Kurs beginnt
   mit Pelajaran 1.
   ===================================================================== */

const KURS_INDO = (() => {
  // Sein Lernen: einmal gebaut, beim ersten Gebrauch (Kurs liest es über den Getter unten). Vorher gibt es
  // VOK_INDO vielleicht noch gar nicht, und ein zweites Lernen.kurs hätte eigene Zwischenspeicher.
  let lernen = null;
  const L = () => lernen || (lernen = Lernen.kurs(VOK_INDO));
  // Zwei gleiche Hälften mit Bindestrich (kupu-kupu, anak-anak, sama-sama), für o_tipp_doppelwort
  const DOPPELWORT = /^(\p{L}+)-\1$/u;

  // Er rutscht auf dem Bauch von links herein: schnell aus dem Wald, nach vorn gelehnt, dann gleitet er
  // aus und richtet sich auf. Die Zeichnung hat keine liegende Haltung, darum gleitet der ganze Platz
  // (WAAPI), um die Füsse geneigt. Ohne Bewegung (reduce) steht er einfach da.
  async function hereinRutschen(el) {
    if (reduce || !el) return;
    const r = el.getBoundingClientRect();
    // Von ganz links ausserhalb des Bildschirms bis an seinen Platz links von Pieks
    const dx = Math.max(160, r.right + 30);
    const bahn = [
      { transform: `translateX(${-dx}px) rotate(16deg)`, transformOrigin: '50% 100%', offset: 0 },
      { transform: 'translateX(12px) rotate(10deg)', transformOrigin: '50% 100%', offset: .7 },
      { transform: 'translateX(-3px) rotate(-4deg)', transformOrigin: '50% 100%', offset: .86 },
      { transform: 'translateX(0) rotate(0)', transformOrigin: '50% 100%', offset: 1 },
    ];
    el.style.zIndex = 5;
    try { await el.animate(bahn, { duration: 1150, easing: 'cubic-bezier(.22, .7, .3, 1)' }).finished; } catch (e) { /* abgebrochen */ }
    el.style.zIndex = '';
  }

  // Beim Schütteln fliegen ein paar Tropfen bis zu Pieks: Die in seiner Zeichnung reichen nur knapp über
  // ihn hinaus. Sobald sie ankommen, erschrickt Pieks. Ohne Bewegung (reduce) fliegt nichts, er erschrickt
  // trotzdem (das Standbild des Schüttelns zeigt die Tropfen um den Otter).
  async function spritzen(von, zu) {
    const pieksErschrickt = () => stimmung(zu, 'oops', 1400);
    const a = von && von.getBoundingClientRect(), b = zu && zu.getBoundingClientRect();
    if (reduce || !a || !a.width || !b || !b.width) {
      await pause(300);
      pieksErschrickt();
      return;
    }
    const flug = [];
    for (let i = 0; i < 9; i++) {
      const gr = 7 + Math.random() * 6;
      // Los geht es oben am Kopf und an den Schultern, an kommt es im Gesicht und auf den Stacheln
      const x0 = a.left + a.width * (.55 + Math.random() * .3) - gr / 2, y0 = a.top + a.height * (.3 + Math.random() * .25) - gr / 2;
      const x1 = b.left + b.width * (.15 + Math.random() * .55) - gr / 2, y1 = b.top + b.height * (.2 + Math.random() * .45) - gr / 2;
      const dx = x1 - x0, dy = y1 - y0, hoch = 30 + Math.random() * 30;
      const t = document.createElementNS(SVGNS, 'svg');
      t.setAttribute('viewBox', '-5 -7 10 14');
      t.setAttribute('aria-hidden', 'true');
      t.innerHTML = '<path d="M0 -6 C2.6 -2.4 4 0 4 2.2 C4 4.6 2.2 6.2 0 6.2 C-2.2 6.2 -4 4.6 -4 2.2 C-4 0 -2.6 -2.4 0 -6 Z" fill="#8FD0E6"/>'
        + '<ellipse cx="-1.4" cy="1.6" rx="1" ry="1.6" fill="#fff" opacity=".7"/>';
      Object.assign(t.style, { position: 'fixed', left: x0 + 'px', top: y0 + 'px', width: gr + 'px', height: gr * 1.4 + 'px', zIndex: 26, pointerEvents: 'none' });
      document.body.appendChild(t);
      // Im Bogen hinüber, die Spitze voran; am Ziel zerplatzt er
      const bahn = [0, .25, .5, .75, 1].map(s => ({
        transform: `translate(${dx * s}px, ${dy * s - 4 * hoch * s * (1 - s)}px) rotate(${90 + 40 * (s - .5)}deg)`,
        opacity: s < 1 ? 1 : 0, offset: s * .85,
      }));
      bahn.push({ transform: `translate(${dx}px, ${dy + 6}px) rotate(110deg) scale(1.6, .4)`, opacity: 0, offset: 1 });
      flug.push(t.animate(bahn, { duration: 620, delay: 80 + i * 35, easing: 'ease-in', fill: 'backwards' }).finished
        .catch(() => {}).then(() => t.remove()));
    }
    const treffer = setTimeout(pieksErschrickt, 80 + 620 * .8);
    await Promise.all(flug);
    clearTimeout(treffer);
    pieksErschrickt();
  }

  // Er schüttelt sich trocken (otter.css: schuettelt, 1,2 s) und spritzt Pieks nass
  async function schuetteln(t) {
    t.bewegung(t.svg.held, 'schuettelt');
    await Promise.all([spritzen(t.svg.held, heldSVG), pause(1200)]);
  }

  return {
    key: 'indo',                  // Kurs in franz.js und app.js (Menü, data-kurs, Zurücksetzen), nie 'id'
    fach: 'indo',                 // Anteil in der Tages-Statistik neben fr
    speicher: 'nea.igel.indo',
    lang: 'id',
    name: 'Indonesisch',
    tab: 'indo',                  // Reiter im Album ('indo', 'indo:i2'); 'woerter' gehört dem Französisch
    get V() { return VOK_INDO; },
    get lernen() { return L(); },
    lehrer: {
      wer: 'o',                   // Sprecher in app.js (FIGUREN.o)
      svg: () => otterSVG(),
      get name() { return OTTER.name; },
      laut: () => Ton.quietschen(),
      icon: 't-indo',             // sein Gesicht: Fach, Abzeichen, Bild der Pelajaran
      grund: '--indo-grund',      // tönt den runden Grund von icon
      // Drehen, sich trocken schütteln, mit dem Kiesel jonglieren (otter.css). Ihr Ende erkennt die Regel am
      // Namen der Animation: ot-dreht, ot-schuettelt, ot-jongliert, ohne Bewegung die Standbilder ot-ruhe-…
      // (die Drehung lässt der Kurs dann aus, die beiden anderen zeigen ihr Standbild).
      bewegungen: ['dreht', 'schuettelt', 'jongliert'],
      bewegungEnde: /dreh|schuettel|jongl|ruhe/,
      drehung: 'dreht',
      // Fünfmal schnell gekitzelt, schüttelt er sich (o_kitzeln[5] kündigt das an)
      kitzelBewegung: 'schuettelt',
    },
    // Seine Listen (o_…) und Pieks' Sätze im Kurs (pi_…). Der Code nennt sie wie bei Pirouette (h_…, p_…);
    // wo Pieks' Liste bei ihr die Sprache im Namen trägt, heisst sie hier anders (namen).
    texte: {
      get lehrer() { return INDO_TEXTE.OTEXTE; },
      get pieks() { return INDO_TEXTE.PTEXTE; },
      get merk() { return INDO_TEXTE.MERKHILFEN; },
      get momente() { return INDO_TEXTE.WORTMOMENTE; },
      vorsilbe: { lehrer: 'o_', pieks: 'pi_' },
      namen: { p_fr_start: 'pi_start', p_fakt_franz: 'pi_fakt' },
    },
    // Das erste Treffen (indo-texte.js, o_vorstellen): Er rutscht von links herein, bleibt links von Pieks
    // stehen und schüttelt sich trocken, die Tropfen treffen Pieks («Brrr!»). Er entschuldigt sich und
    // stellt sich vor, Pieks erzählt, woher er kommt, dann der Witz mit seinem Namen und gleich darauf noch
    // einmal Schütteln (erst nach dem Satz: «Achtung, Pieks!» warnt vor den Tropfen). Zuletzt springt seine
    // Karte herein. Wasser gibt es auf der Lichtung keines: Er kommt aus dem Bach hinter dem Wald.
    // t: was Kurs() dazu gibt (held, karte, svg, gilt, kommt, karteKommt, gehoert, bewegung).
    // true: Die Szene lief bis zum Schluss.
    async treffen(t) {
      const O = INDO_TEXTE.OTEXTE, P = INDO_TEXTE.PTEXTE;
      // 1. Er rutscht herein
      t.kommt();
      await hereinRutschen(t.held);
      if (!t.gilt()) return false;
      // 2. Er schüttelt sich trocken, Pieks wird nass
      await schuetteln(t);
      if (!t.gilt()) return false;
      if (!(await sagAls('p', P.pi_besuch[0])) || !t.gilt()) return false;
      // 3. «Aduh, maaf!»: Er entschuldigt sich und stellt sich vor
      Ton.quietschen();
      if (!(await sagAls('o', O.o_vorstellen[0]))) return false;
      t.gehoert();
      if (!t.gilt()) return false;
      // 4. Pieks erzählt, woher er kommt; der Witz mit dem Namen, und schon spritzt es wieder
      if (!(await sagAls('p', P.pi_besuch[1])) || !t.gilt()) return false;
      const witz = O.o_name_witz && O.o_name_witz[0];
      if (witz) {
        if (!(await sagAls('o', witz)) || !t.gilt()) return false;
        await schuetteln(t);
        if (!t.gilt()) return false;
      }
      // 5. Was er Nea beibringt
      if (!(await sagAls('o', O.o_vorstellen[1])) || !t.gilt()) return false;
      // 6. Seine Karte springt herein
      t.karteKommt();
      return true;
    },
    ids: {
      held: 'heldOtter', buehne: 'indoOtter', karte: 'indoKarte', start: 'indoStart',
      info: 'indoInfo', balken: 'indoBalken', woerter: 'indoWoerterBtn', auswahl: 'indoAuswahlBtn',
    },
    // Keine Frage nach der Schule: Der erste Start nimmt Pelajaran 1
    kapitel: { frage: null, alle: '← Alle Lektionen' },
    buch: false,
    // Die Stufen einer Karte als Reis: Namen, Feld, Bilder (bild: leere Karte, symbol: padi-0 … padi-5).
    // Das Reisfeld gehört Nea (wem), nicht ihm: «dein Reisfeld», sagt er.
    stufen: {
      namen: ['Reiskorn', 'Keimling', 'Pflänzchen', 'Grüne Rispe', 'Gelbe Rispe', 'Goldener Reis'],
      beet: 'Reisfeld von ', wem: 'Nea', mit: 'mit Rispe',
      spanne: 'vom Reiskorn (noch nicht kennengelernt) bis zum goldenen Reis',
      bild: 'reis', symbol: 'padi-',
    },
    // Was einer Karte schwerfällt, für die Eltern: ohne Artikel und Akzente bleibt das Hören
    schwach: { hoeren: 'Hören' },
    // Die Übungen des Kurses (uebungen.js): alle ausser artikel und akzent
    uebungen: ['kennen', 'bedeutung', 'hoeren', 'finden', 'lauschen', 'legen', 'schreiben', 'luecke', 'ordnen', 'bauen', 'echo', 'paare'],
    // Welche Zeilen zu einem ersten Fehlversuch passen. Ohne Artikel steht nie ein Artikel-Hinweis davor,
    // also gibt es weder ARTIKEL_TIPP noch KERN_IM_DOPPEL, und ohne Akzente keine Akzent-Zeilen.
    // Zwei vertauschte Buchstaben: «Nur ein Buchstabe» stimmt dann nicht (KERN_DREHER).
    // Vor allem anderen das Doppelwort: «kupu kupu» oder «kupukupu» für kupu-kupu (kern 'zeichen').
    tipps: {
      TIPP: { buchstabe: 'h_tipp_buchstabe', legen: 'h_tipp_legen', reihenfolge: 'h_tipp_reihenfolge' },
      KERN_TIPP: { zeichen: 'h_tipp_zeichen', tippfehler: 'h_tipp_buchstabe', anders: 'h_tipp_anders' },
      KERN_DREHER: { h_tipp_buchstabe: [1, 2, 3] },
      // Die Zeile von «nichts fällig», die freies Üben anbietet
      freiUeben: { liste: 'h_nichts_faellig', nr: 3 },
      vor: t => (t && t.kern === 'zeichen' && DOPPELWORT.test(L().norm(String(t.bezug || ''))) ? 'h_tipp_doppelwort' : null),
    },
    erfolge: {
      prefix: 'indo_',
      // Alle Wörter einer Pelajaran mit Rispe (bei ihr fr_unite)
      unite: 'indo_pelajaran',
      // Was jeder Erfolg zählt und wie viel er braucht: Stufen über alle Einträge (0: alle) oder ein Zähler
      // des Lernens. doppel und echo zählt nur sein Lernen (SPRACHE.zaehler in indo-vokabeln.js).
      zahl: {
        indo_erstes: ['gekannt', 1], indo_runden10: ['runden', 10], indo_25: ['frucht', 25], indo_100: ['frucht', 100],
        indo_reif1: ['reif', 1], indo_reif50: ['reif', 50], indo_reifAlle: ['reif', 0], indo_saetze10: ['saetze', 10],
        indo_ohr25: ['ohr', 25], indo_schreiben25: ['geschrieben', 25], indo_perfekt: ['perfekt', 1],
        indo_doppel: ['doppel', 5], indo_plauder: ['echo', 20],
      },
      balken: ['indo_runden10', 'indo_25', 'indo_100', 'indo_reif50', 'indo_reifAlle', 'indo_saetze10', 'indo_ohr25',
        'indo_schreiben25', 'indo_doppel', 'indo_plauder'],
      // «Wie Drillinge»: Pieks, er (anO) und seine Freundin (anH) tragen auf einem Platz dasselbe
      partner: 'anO',
      partnerMit: ['anH'],
      // Heute gerechnet, Französisch und Indonesisch geübt (rechnenVon in app.js: ohne die Anteile der Kurse)
      mehr: t => ({ indo_drei: (+t.fr || 0) > 0 && (+t.indo || 0) > 0 && rechnenVon(t) > 0 }),
      // Beide brauchen seine Freundin (FIGUREN.h): Fehlt ihr Kurs, stehen sie nicht in der Liste und gelten nicht
      mitFigur: { indo_drei: 'h', indo_partner: 'h' },
      // Ohne seine Aufnahmen nicht zu erreichen (Hör-Aufgaben werden zu Lese-Aufgaben, Nachsprechen gibt es
      // nicht): Bis es sie gibt, stehen sie nicht in der Liste
      mitStimme: ['indo_ohr25', 'indo_plauder'],
    },
  };
})();

const Indo = Kurs(KURS_INDO);
