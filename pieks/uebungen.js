'use strict';

/* =====================================================================
   ÜBUNGEN: die Aufgaben der Sprachkurse (Französisch …) auf der Karte
   Reine Ansicht. Sie baut Vorgabe, Antwort und Feld einer Aufgabe aus
   Lernen.aufgabe() und meldet dem Gastgeber (franz.js), was Nea tut.
   Verbuchen, Äpfel, Stimme und die drei festen Knöpfe gehören ihm.

   Der Gastgeber:
     geurteilt(ergebnis)   genau einmal, im Augenblick des Urteils
     fertig()              genau einmal, danach: Die Aufgabe darf verlassen werden
     versuch(tipp), nachbau(), pruefbar(an), weissNicht(an)
     spielen(clip, langsam), ichSags()
   Von selbst spielt hier nie ein Clip: Wann einer dran ist, weiss nur
   der Gastgeber (vorher spricht vielleicht noch das Hörnchen).

   Gebaute Antworten (akzent, legen, schreiben, ordnen, bauen) haben zwei
   Versuche. Schon beim Aufbau kommt pruefbar(false) und, wo es ihn gibt,
   weissNicht(true); pruefbar(true), sobald geprüft werden kann. Nach dem
   ersten Fehlversuch versuch(tipp), beim Urteil zuerst pruefbar(false)
   und weissNicht(false), dann geurteilt(). Nach «falsch» folgt in legen,
   schreiben, ordnen und bauen nachbau() und erst nach dem Nachbauen
   fertig().
     tipp   { art: 'akzent' | 'genus' | 'buchstabe' | 'legen' |
            'reihenfolge' } bei Kacheln und Lücken, beim Schreiben das
            Urteil aus Lernen.urteil. Dort kommt versuch(urteil) auch mit
            ganz 'gleiche_form': Das ist kein Versuch, die Zeile ist
            wieder leer, und es kann mehr als einmal geschehen.

   Tasten und Kacheln im Feld antworten beim Aufsetzen des Fingers
   (pointerdown), alles auf der Karte beim Klick.

   Jeder Kurs gibt bei zeigen(aufgabe, gastgeber, kurs) mit, was hier von
   seiner Sprache abhängt (siehe FRANZ unten: sein Lernen, das urteilt,
   Tastatur, Akzente auf den Ziffern, lang, «auf Französisch»,
   Merkhilfen, Bildchen der Stufen). Ohne kurs gilt Französisch, genau
   wie es hier immer stand.
   ===================================================================== */

const Uebungen = (() => {
  const FELD_ARTEN = ['auswahl', 'zwei', 'kacheln', 'tastatur', 'nur-weiter'];
  const ARTIKEL_VORN = /^(le |la |les |l’|un\/une |un |une )/;
  const GENUS_MARKE = /^\((m|f)( pl)?\)$/;
  const ARTIKEL_GENUS = { le: 'm', un: 'm', la: 'f', une: 'f' };
  const DE_GENUS = { der: 'm', die: 'f', eine: 'f' };

  /* ---------- Der Kurs ---------- */

  // Was ein Kurs der Ansicht mitgibt. Ohne Angabe gilt dieser, Französisch.
  //   lang          die Sprache der Fremdwörter (lang="…")
  //   sprache       für «Wie heisst das auf …?» und «Schreibe auf …»
  //   lernen()      sein Lernen (Lernen oder Lernen.kurs(…)): Es urteilt über Getipptes und Gelegtes, kennt
  //                 den Kontrast der Artikel und wie lang eine Form höchstens getippt wird (K.SCHREIBEN_MAX)
  //   tastatur      { reihen, akzente, tippbar }, wie im Sprachprofil von Lernen (S.tastatur). reihen: die
  //                 Tasten jeder Reihe mit Leerzeichen getrennt; back, leer und ok sind die Sondertasten. Es gibt
  //                 zehn Spalten, leer füllt seine Reihe darauf auf (bei Französisch zwei Spalten breit, bei
  //                 einer Reihe mehr nur eine). akzente: was die Ziffern 1, 2, … der echten Tastatur tippen
  //                 (leer: nichts), diese Tasten sind hervorgehoben. tippbar: was sich tippen lässt (fehlt:
  //                 jede Taste mit einem Zeichen und das Leerzeichen).
  //   stufen        die Symbole der Stufen 0–5 heissen stufen + Stufe (#reife-0 …)
  //   merkhilfen()  die Merkhilfen je Eintrag (MERKHILFEN)
  //   uebungen      welche Übungen es gibt (fehlt: alle); jede andere wird nur gezeigt (unbekanntBauen)
  // Die Tastatur des Französisch, oben die Akzente (an der echten Tastatur auf den Ziffern 1 bis 8). Sie gilt,
  // wenn Lernen kein Sprachprofil mit einer Tastatur hat.
  const FRANZ_TASTATUR = {
    reihen: ['é è ê à â ç û œ ’ -', 'q w e r t z u i o p', 'a s d f g h j k l back', 'y x c v b n m leer ok'],
    akzente: ['é', 'è', 'ê', 'à', 'â', 'ç', 'û', 'œ'],
  };
  const FRANZ = {
    key: 'franz', lang: 'fr', sprache: 'Französisch', stufen: 'reife-',
    lernen: () => Lernen,
    get tastatur() {
      try { return (Lernen.SPRACHE && Lernen.SPRACHE.tastatur) || FRANZ_TASTATUR; } catch (err) { return FRANZ_TASTATUR; }
    },
    merkhilfen: () => MERKHILFEN,
  };
  const SPALTEN = 10;
  // Die Tastatur eines Kurses, einmal ausgerechnet: Reihen, Akzente, und was sich tippen lässt
  const tastaturen = new WeakMap();
  function tastaturVon(kurs) {
    if (!tastaturen.has(kurs)) {
      const t = kurs.tastatur || {}, reihen = (t.reihen || []).map(r => r.split(' ').filter(Boolean));
      const tippbar = t.tippbar || new Set(reihen.flat().filter(k => k.length === 1).concat(' '));
      tastaturen.set(kurs, { reihen, akzente: t.akzente || [], tippbar });
    }
    return tastaturen.get(kurs);
  }
  // Die Sprache und das Lernen der Aufgabe, die gerade gebaut wird
  const sprache = () => (lauf && lauf.kurs ? lauf.kurs : FRANZ).lang;
  const lernen = () => (lauf && lauf.kurs && lauf.kurs.lernen ? lauf.kurs : FRANZ).lernen();

  /* ---------- Die laufende Aufgabe ---------- */

  // { a, host, kurs, tast, ctl, geurteilt, fertig, uhren, hoerer, spiel }; null: Nichts hört mehr zu
  let lauf = null;

  // Der Gastgeber muss nicht jede Meldung kennen
  function melde(name, ...werte) {
    const fn = lauf && lauf.host[name];
    return typeof fn === 'function' ? fn.apply(lauf.host, werte) : undefined;
  }
  function ergebnis(art, mehr) {
    return Object.assign({ art, versuche: 0, fehler: [], eingabe: '', urteil: null, fehlpaare: 0 }, mehr);
  }
  // Beide Meldungen gehen genau einmal hinaus, das Urteil zuerst
  function urteilen(erg) {
    if (!lauf || lauf.geurteilt) return;
    lauf.geurteilt = true;
    // Der Hör-Knopf einer Hör-Aufgabe pulsiert nur, bis geantwortet ist
    const hoeren = $('frHoeren');
    if (hoeren) hoeren.classList.remove('puls');
    melde('geurteilt', erg);
  }
  function fertigMelden() {
    if (!lauf || lauf.fertig || !lauf.geurteilt) return;
    lauf.fertig = true;
    melde('fertig');
  }
  // Urteil und gleich darauf fertig: alles, was kein Nachbauen kennt.
  // Räumt der Gastgeber schon beim Urteil ab, gibt es nichts mehr zu melden.
  function abschliessen(erg) {
    const l = lauf;
    urteilen(erg);
    if (lauf === l) fertigMelden();
  }
  // Uhren und Listener gehören der Aufgabe: aufraeumen() nimmt sie alle wieder weg
  function spaeter(ms, fn) {
    const l = lauf;
    const id = setTimeout(() => { if (lauf === l) fn(); }, ms);
    l.uhren.push(id);
    return id;
  }
  function hoere(ziel, art, fn) {
    ziel.addEventListener(art, fn);
    lauf.hoerer.push([ziel, art, fn]);
  }
  function aufraeumen() {
    if (!lauf) return;
    lauf.uhren.forEach(clearTimeout);
    lauf.hoerer.forEach(([ziel, art, fn]) => ziel.removeEventListener(art, fn));
    lauf = null;
  }
  // Eine Bewegung noch einmal von vorn (wackelt, pop)
  function bewege(el, ...klassen) {
    el.classList.remove(...klassen);
    void el.offsetWidth;
    el.classList.add(...klassen);
  }
  // Richtig und falsch nicht nur als Farbe: ein Häkchen oder ein Kreuz an der Ecke des Knopfs
  function marke(b, recht) {
    b.insertAdjacentHTML('beforeend', '<span class="fr-marke ' + (recht ? 'ja' : 'nein') + '" aria-hidden="true">'
      + (recht ? zeichen('i-ok') : zeichen('i-zu', 24)) + '</span>');
  }
  // Ein Urteil über Gebautes steht bevor: «Prüfen» und «Weiss ich nicht» haben ausgedient
  function knoepfeAus() {
    melde('pruefbar', false);
    melde('weissNicht', false);
  }

  /* ---------- Tippen und Tasten ---------- */

  // Tasten und Kacheln im Feld antworten schon, wenn der Finger aufsetzt: So geht beim schnellen
  // Tippen kein Buchstabe verloren, auch wenn zwei Finger sich ablösen. Der Klick, den der Browser
  // danach noch schickt (e.detail > 0: er kommt von einem Zeiger), ist dann schon erledigt, auch
  // wenn inzwischen ein anderer Knopf unter dem Finger liegt. Klicks ohne Zeiger (Enter auf einem
  // Knopf, Vorlese-Hilfen, Prüfskripte) zählen wie immer. Gezählt wird, nicht nur gemerkt: Setzen zwei
  // Finger kurz nacheinander auf, kommen danach zwei Klicks, und beide sind schon erledigt.
  function tippHoerer(ziel, wahl, fn) {
    let erledigt = 0;
    const knopf = e => {
      const b = e.target.closest(wahl);
      return b && !b.disabled && ziel.contains(b) ? b : null;
    };
    hoere(ziel, 'pointerdown', e => {
      const b = e.button ? null : knopf(e);
      if (!b) return;
      erledigt++;
      fn(b);
    });
    hoere(ziel, 'click', e => {
      if (e.detail > 0 && erledigt > 0) {
        erledigt--;
        return;
      }
      const b = knopf(e);
      if (b) fn(b);
    });
  }

  // Ziffer einer Taste, auch vom Ziffernblock und von Tastaturen, auf denen die Ziffern mit Shift kommen
  function zifferVon(e) {
    if (/^[1-9]$/.test(e.key)) return +e.key;
    const m = /^(?:Digit|Numpad)([1-9])$/.exec(e.code || '');
    return m ? +m[1] : 0;
  }
  // Das Zeichen, das eine Taste beim Legen und Schreiben meint: Buchstaben klein (grosse gibt es
  // auf der Tastatur unten nicht), die Ziffern sind die Akzente des Kurses (Französisch: 1 bis 8 die
  // obere Reihe), jeder Apostroph ist der typografische, wo es ihn gibt.
  // '' für alles andere, auch für tote Tasten: Auf die ist kein Verlass.
  function zeichenVon(e, tast) {
    const k = typeof e.key === 'string' ? e.key : '';
    if (/^[1-9]$/.test(k)) return tast.akzente[k - 1] || '';
    if (/^['’ʼ]$/.test(k)) return tast.tippbar.has('’') ? '’' : '';
    if (k === ' ' || k === '-') return k;
    const klein = k.toLowerCase().normalize('NFC');
    return [...klein].length === 1 && /^\p{L}$/u.test(klein) ? klein : '';
  }
  const erste = soll => (Array.isArray(soll) ? soll[0] : soll);
  const grossVorn = s => s.charAt(0).toUpperCase() + s.slice(1);

  /* ---------- Bausteine, die auch Lösungsstreifen, Ernte und Wörterheft brauchen ---------- */

  const zeichen = (id, box = 32) => '<svg viewBox="0 0 ' + box + ' ' + box + '" aria-hidden="true"><use href="#' + id + '"/></svg>';

  // Das Geschlecht steht nie nur als Farbe da: Das Schild schreibt es aus
  function schildHTML(genus, mehrzahl) {
    if (genus === 'mf') return '<span class="fr-genus-chip mf"><i>m</i><i>f</i></span>';
    if (genus !== 'm' && genus !== 'f') return '';
    return '<span class="fr-genus-chip ' + genus + '">' + genus + (mehrzahl ? ' pl' : '') + '</span>';
  }
  // «la » → farbiges «la» und das Leerzeichen dahinter. «l’» und «les» verraten nichts: Da entscheidet der Eintrag.
  function artikelHTML(artikel, e) {
    const a = artikel.trim(), danach = artikel.slice(a.length);
    if (a === 'un/une') return '<span class="fr-artikel-m">un</span>/<span class="fr-artikel-f">une</span>' + danach;
    const g = ARTIKEL_GENUS[a] || (e.genus === 'm' || e.genus === 'f' ? e.genus : '');
    return (g ? '<span class="fr-artikel-' + g + '">' + esc(a) + '</span>' : esc(a)) + danach;
  }
  // Eine französische Form oder die ganze Zeile aus dem Buch: Artikel in der Farbe des Geschlechts,
  // «(m)» und «(f pl)» als Schild, andere Klammern grau. Nur für Stellen, an denen das Geschlecht
  // kein Geheimnis mehr ist: Kennenlernen, Nachsprechen, Lösung, Ernte, Wörterheft.
  // opt.schild === false: kein Schild anhängen, wo das Buch keines druckt.
  function frHTML(text, e, opt = {}) {
    const s = String(text == null ? '' : text);
    const farbig = !!(e && e.art !== 'satz' && e.artikel);
    // ende: wo die erste Form aufhört (vor dem ersten Komma oder der ersten grauen Klammer)
    let aus = '', schild = false, vorn = true, ende = -1;
    for (const stueck of s.split(/(\([^)]*\))/)) {
      if (!stueck) continue;
      if (stueck[0] === '(') {
        const m = farbig && GENUS_MARKE.exec(stueck);
        if (m) { aus += schildHTML(m[1], !!m[2]); schild = true; }
        else {
          if (ende < 0) ende = aus.length;
          aus += '<span class="fr-klammer">' + esc(stueck) + '</span>';
        }
        vorn = false;
        continue;
      }
      // Nach jedem Komma fängt eine neue Form an, und nur dort steht ein Artikel
      for (const teil of stueck.split(/(, )/)) {
        if (!teil) continue;
        if (teil === ', ') {
          if (ende < 0) ende = aus.length;
          aus += teil;
          vorn = true;
          continue;
        }
        const m = farbig && vorn && ARTIKEL_VORN.exec(teil);
        aus += m ? artikelHTML(m[1], e) + esc(teil.slice(m[1].length)) : esc(teil);
        vorn = false;
      }
    }
    // Druckt das Buch kein «(m)», kommt das Schild hinter die erste Form: «la tomate [f] (cerise)»
    if (farbig && !schild && opt.schild !== false && ARTIKEL_VORN.test(s)) {
      const marke = schildHTML(e.genus, s.startsWith('les '));
      const davor = ende < 0 ? aus : aus.slice(0, ende), danach = ende < 0 ? '' : aus.slice(ende);
      aus = davor.endsWith(' ') ? davor + marke + ' ' + danach : davor + ' ' + marke + danach;
    }
    return aus;
  }
  // Das Bildchen einer Stufe (0 Samen … 5 reif): bei Französisch die Erdbeere, sonst das des Kurses
  function stufeHTML(st, kurs) {
    const n = clamp(Math.round(+st || 0), 0, 5);
    return '<svg class="fr-stufe s' + n + '" viewBox="0 0 24 24" aria-hidden="true"><use href="#' + (kurs || FRANZ).stufen + n + '"/></svg>';
  }

  // Plätze zeichnen. Was dieselbe Zahl «wort» trägt, steht in einem span.fr-wort und bricht nie um
  // (nur ein vorgedruckter Artikel darf sich von seinem Wort lösen, siehe unten).
  // Jeder Platz behält seine Stelle in der Liste als data-p. Mit opt.knopf werden die Plätze
  // Knöpfe (antippbar), sonst sind sie nur Anzeige. Die Art der Reihe entscheidet über das Aussehen:
  // 'buchstaben' (Kästchen in der Grösse --platz), 'woerter' (breite Plätze für Kacheln) oder
  // 'satz' (Fliesstext mit einer Lücke).
  function plaetzeHTML(plaetze, opt = {}) {
    const reihe = opt.reihe
      || (plaetze.some(p => p.art === 'buchstabe' || (p.art === 'luecke' && p.wahl)) ? 'buchstaben'
        : plaetze.some(p => p.art === 'wort') ? 'woerter' : 'satz');
    const marke = opt.knopf ? 'button type="button"' : 'span', ende = opt.knopf ? 'button' : 'span';
    const leer = i => plaetze[i].art === 'fest' && !String(plaetze[i].text).trim();
    const gruppen = [];
    let zuletzt, vorn = null;
    plaetze.forEach((p, i) => {
      if (!gruppen.length || (p.wort !== undefined && p.wort !== zuletzt)) gruppen.push([]);
      if (p.wort !== undefined) zuletzt = p.wort;
      const g = gruppen[gruppen.length - 1];
      g.push(i);
      // Ein vorgedrucktes «les» oder «la» darf sich von seinem Wort lösen: Sonst hätten dreizehn
      // Buchstaben («les mathématiques») auf dem Handy keinen Platz. Ein Artikel-Platz bleibt beim Wort.
      // Die erste solche Gruppe heisst «vorn»: platzMass hält sie beim Wort, solange die Plätze gross genug bleiben.
      if (reihe === 'buchstaben' && leer(i) && g.length > 1 && g.every(j => plaetze[j].art === 'fest')) {
        if (gruppen.length === 1) vorn = g;
        gruppen.push([]);
      }
    });
    let h = '';
    for (const g of gruppen) {
      // Das Leerzeichen am Ende einer Gruppe ist schon der Abstand zur nächsten
      while (g.length && leer(g[g.length - 1])) g.pop();
      if (!g.length) continue;
      h += '<span class="fr-wort' + (g === vorn ? ' vorn' : '') + '">';
      for (const i of g) {
        const p = plaetze[i];
        if (p.art !== 'fest') h += '<' + marke + ' class="fr-platz ' + esc(p.art) + '" data-p="' + i + '"></' + ende + '>';
        else if (leer(i)) h += '<span class="fr-fest leer" data-p="' + i + '"></span>';
        else h += '<span class="fr-fest" data-p="' + i + '">' + esc(p.text) + '</span>';
      }
      h += '</span>';
    }
    return '<div class="fr-plaetze ' + reihe + (opt.klasse ? ' ' + opt.klasse : '') + '" lang="' + sprache() + '">' + h + '</div>';
  }
  // Buchstaben-Plätze so gross wie möglich (höchstens 56 px), aber das längste Wort bleibt auf
  // einer Zeile. Gemessen wird, weil Vorgedrucktes so breit ist wie seine Schrift. Dreizehn
  // Buchstaben bekommen auf dem schmalsten Handy (360 px) 20 px; nur wo dazu noch ein Artikel-Platz
  // oder ein Satzzeichen am Wort hängt («la construction», «grands-parents.»), geht es bis 18 px.
  // Ein vorgedrucktes «les» bleibt mit seinem Wort auf einer Zeile, solange die Plätze dafür nicht
  // kleiner als 22 px werden müssen; sonst steht es allein darüber.
  // data-max an der Reihe: eine kleinere Obergrenze (der Hinweis unter der getippten Zeile).
  function platzMass(box) {
    const breit = box.clientWidth;
    if (!breit) return;
    const gruppen = [...box.querySelectorAll('.fr-wort')];
    const setze = p => box.style.setProperty('--platz', p + 'px');
    const spalt = () => parseFloat(getComputedStyle(box).columnGap) || 0;
    const breite = g => g.offsetWidth + (g.classList.contains('vorn') && g.nextElementSibling ? spalt() + g.nextElementSibling.offsetWidth : 0);
    const einpassen = (mass, unten) => {
      let platz = +box.dataset.max || 56;
      for (let i = 0; i < 8; i++) {
        setze(platz);
        const max = Math.max(0, ...gruppen.map(mass));
        if (max <= breit || platz <= unten) return [platz, max <= breit];
        platz = Math.max(unten, Math.min(platz - 1, Math.floor(platz * breit / max)));
      }
      setze(platz);
      return [platz, Math.max(0, ...gruppen.map(mass)) <= breit];
    };
    let [platz, passt] = einpassen(breite, 22);
    if (!passt) platz = einpassen(g => g.offsetWidth, 18)[0];
    // Drei Zeilen und mehr gibt es nur auf dem Handy, wo die Höhe knapp ist («jouer du piano»,
    // «un peu de persil»): Fallen mit kleineren Plätzen Zeilen weg, sind sie lieber kleiner. Gesucht
    // ist die kleinste Zahl Zeilen und dafür die grössten Plätze. Sonst ragte die letzte Zeile auf
    // dem kleinen Handy unten aus der Karte.
    const zeilen = () => new Set(gruppen.map(g => Math.round(g.offsetTop + g.offsetHeight / 2))).size;
    let best = platz, wenigste = zeilen();
    for (let p = platz - 2; wenigste > 2 && p >= Math.max(26, platz * .5); p -= 2) {
      setze(p);
      const n = zeilen();
      if (n < wenigste) {
        wenigste = n;
        best = p;
      }
    }
    setze(best);
  }
  function plaetzeEinpassen() {
    document.querySelectorAll('#frAntwort .fr-plaetze.buchstaben').forEach(platzMass);
  }
  // Die Ablage mit allen Kacheln. Am Ende der Knopf, der die zuletzt gelegte zurückholt.
  // Fremde Kacheln sehen aus wie alle anderen.
  function ablageHTML(kacheln) {
    return '<div class="fr-ablage" lang="' + sprache() + '">'
      + kacheln.map(k => '<button type="button" class="fr-kachel ' + esc(k.art || '') + '" data-id="' + esc(k.id) + '">' + esc(k.text) + '</button>').join('')
      + '<button type="button" class="fr-zurueck" aria-label="Letzte Kachel zurücknehmen" lang="de" disabled>' + zeichen('i-back') + '</button></div>';
  }
  // Die offenen Plätze einer gezeichneten Reihe in Leserichtung: p der Platz aus der Aufgabe, el sein Element
  function offenePlaetze(plaetze, box) {
    return plaetze.map((p, i) => ({ p, el: p.art === 'fest' ? null : box.querySelector('[data-p="' + i + '"]') })).filter(x => x.el);
  }
  // Was dasteht, als Text für das Ergebnis: Leere Plätze sind «_», zwischen Wort-Plätzen steht ein Leerzeichen
  function lesbar(plaetze, text) {
    let aus = '';
    for (const p of plaetze) {
      if (p.art === 'wort' && aus) aus += ' ';
      aus += p.art === 'fest' ? p.text : text(p) || '_';
    }
    return aus;
  }
  // Die Tastatur für «schreiben»: die Reihen des Kurses zu zehn Spalten (Französisch: vier, oben die Akzente).
  // Die Leertaste füllt ihre Reihe; zwei Spalten breit ist sie ohnehin (uebungen.css), sonst sagt es ihr style.
  function tastaturHTML(tast) {
    const leer = spalten => '<button type="button" class="taste fr-taste leer" data-k="leer" aria-label="Leerzeichen" lang="de"'
      + (spalten === 2 ? '' : ' style="grid-column: span ' + spalten + '"') + '><svg viewBox="0 0 32 32" aria-hidden="true">'
      + '<path d="M5 12 V20 H27 V12" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/></svg></button>';
    const sonder = {
      back: '<button type="button" class="taste fr-taste zurueck" data-k="back" aria-label="Löschen" lang="de" disabled>' + zeichen('i-back') + '</button>',
      ok: '<button type="button" class="taste fr-taste pruefen" data-k="ok" aria-label="Prüfen" lang="de" disabled>' + zeichen('i-ok') + '</button>',
    };
    return tast.reihen.map(reihe => reihe.map(k => {
      if (k === 'leer') return leer(Math.max(1, SPALTEN - (reihe.length - 1)));
      const z = tast.akzente.indexOf(k);
      return sonder[k] || '<button type="button" class="taste fr-taste' + (z >= 0 ? ' akzent" data-z="' + (z + 1) : '') + '" data-k="' + esc(k) + '">' + esc(k) + '</button>';
    }).join('')).join('');
  }

  /* ---------- Karte und Feld ---------- */

  // Die Eingabe unten bekommt genau eine Art, das Feld fängt leer an
  function feldArt(art, zusatz) {
    const eingabe = $('frEingabe');
    eingabe.classList.remove(...FELD_ARTEN);
    if (art) eingabe.classList.add(art);
    const feld = $('frFeld');
    feld.className = 'fr-feld' + (zusatz ? ' ' + zusatz : '');
    // Die Zeilenhöhe, die eine beantwortete Auswahl festhält, gilt nicht für die nächste Aufgabe
    feld.style.removeProperty('grid-auto-rows');
    feld.innerHTML = '';
    return feld;
  }
  // Alles weg: bevor der Gastgeber etwas Eigenes auf die Karte setzt (Unité-Frage, Ernte)
  function leeren() {
    aufraeumen();
    feldArt('');
    $('frVorgabe').innerHTML = '';
    $('frAntwort').innerHTML = '';
  }

  // Vorgabe: kleine Überschrift, grosse Zeile mit den Hör-Knöpfen, kleine Zeile darunter.
  // v = { cap, gross, klein, fr, ton, clip, langsam }: gross und klein sind fertiges HTML;
  // fr: Die grosse Zeile ist in der Fremdsprache; ton: 'gross' (nur hören) | 'normal' | nichts.
  function vorgabeBauen(v) {
    const a = lauf.a;
    const clip = v.clip === undefined ? a.clip : v.clip;
    const langsam = v.langsam === undefined ? a.clipLangsam : v.langsam;
    // ton ist erst false, wenn der Gastgeber weiss, dass der Clip nicht spielen kann
    const ton = v.ton && a.ton !== false && clip ? v.ton : '';
    let h = '<span class="fr-cap">' + esc(v.cap) + '</span>';
    let kern = '';
    if (ton) {
      kern += '<div class="fr-ton"><button type="button" class="fr-hoeren' + (ton === 'gross' ? ' gross puls' : '')
        + '" id="frHoeren" aria-label="Anhören">' + zeichen('i-hoeren') + '</button>'
        + (langsam ? '<button type="button" class="fr-langsam" id="frLangsam" aria-label="Langsam anhören">' + zeichen('i-langsam') + '</button>' : '')
        + '</div>';
    }
    if (v.gross) {
      const n = v.gross.replace(/<[^>]*>/g, '').length;
      kern += '<div class="fr-gross' + (n > 34 ? ' laenger' : n > 18 ? ' lang' : '') + '"' + (v.fr ? ' lang="' + sprache() + '"' : '') + '>' + v.gross + '</div>';
    }
    if (kern) h += '<div class="fr-kern">' + kern + '</div>';
    if (v.klein) h += '<div class="fr-klein">' + v.klein + '</div>';
    $('frVorgabe').innerHTML = h;
    // Auch für die Tastatur: den Clip der Aufgabe noch einmal, normal oder langsam
    lauf.spiel = lang => {
      if (!ton || (lang && !langsam)) return false;
      melde('spielen', lang ? langsam : clip, !!lang);
      return true;
    };
  }

  /* ---------- Auswahl: bedeutung, hoeren, finden, lauschen, luecke ---------- */

  // Was jede Auswahl-Aufgabe vorgibt. optFr: Die Antworten sind in der Fremdsprache.
  // ohneTon: was dasteht, wenn eine Hör-Aufgabe doch ohne Ton gezeigt wird. cap kann vom Kurs abhängen.
  const WAHL = {
    bedeutung: { cap: 'Was heisst das?', gross: a => a.fr, fr: true, ton: 'normal' },
    hoeren: { cap: 'Was hörst du?', ton: 'gross', ohneTon: a => a.fr, fr: true },
    finden: { cap: k => 'Wie heisst das auf ' + k.sprache + '?', gross: a => a.de, optFr: true },
    lauschen: { cap: 'Was hörst du?', ton: 'gross', ohneTon: a => a.de, optFr: true },
    luecke: { cap: 'Welches Wort fehlt?', klein: a => a.de, optFr: true },
  };

  function wahlBauen(a) {
    const w = WAHL[a.uebung];
    const optionen = a.optionen || [];
    const mitTon = w.ton && a.ton !== false && a.clip;
    const gross = w.gross ? w.gross(a) : (w.ohneTon && !mitTon ? w.ohneTon(a) : '');
    vorgabeBauen({
      cap: typeof w.cap === 'function' ? w.cap(lauf.kurs) : w.cap, ton: w.ton, fr: !!w.fr,
      gross: gross ? esc(gross) : '',
      klein: w.klein ? esc(w.klein(a)) : '',
    });
    if (a.uebung === 'luecke') $('frAntwort').innerHTML = plaetzeHTML(a.plaetze || [], { reihe: 'satz' });

    // Drei Antworten sind Sätze: untereinander. Lange Antworten im Hochformat auch.
    const lang = Math.max(0, ...optionen.map(o => String(o.text).length)) > 26;
    const feld = feldArt('auswahl', (optionen.length === 3 ? 'einzeln' : '') + (lang ? ' lang' : ''));
    feld.innerHTML = optionen.map((o, i) => '<button type="button" class="fr-option" data-i="' + i + '"'
      + (w.optFr ? ' lang="' + sprache() + '"' : '') + '><span class="fr-opt-text">' + esc(o.text) + '</span></button>').join('');
    const knoepfe = [...feld.querySelectorAll('.fr-option')];

    // Ein Versuch: Die zweite Wahl wäre nur noch Raten unter dem Rest
    function waehle(i) {
      const o = optionen[i], b = knoepfe[i];
      if (!o || !lauf || lauf.geurteilt) return false;
      const recht = optionen.findIndex(x => x.richtig);
      // Offen sind alle Antworten gleich hoch. Jetzt darf die falsche um ihre Erklärung wachsen,
      // die anderen behalten ihre Höhe: So springt nichts zusammen.
      feld.style.gridAutoRows = 'minmax(' + b.offsetHeight + 'px, auto)';
      knoepfe.forEach((k, j) => {
        k.disabled = true;
        if (j === recht) k.classList.add('richtig');
        else if (j !== i) k.classList.add('aus');
      });
      b.classList.add('gewaehlt');
      if (knoepfe[recht]) marke(knoepfe[recht], true);
      if (o.richtig) bewege(b, 'pop');
      else {
        bewege(b, 'falsch', 'wackelt');
        marke(b, false);
        // Unter der falschen Antwort steht, was sie bedeutet
        if (o.sub) b.insertAdjacentHTML('beforeend', '<small class="fr-opt-sub">' + esc(o.sub) + '</small>');
      }
      // Die Lücke im Satz schliesst sich mit dem richtigen Wort
      const luecke = $('frAntwort').querySelector('.fr-platz.luecke');
      if (luecke && optionen[recht]) {
        luecke.textContent = optionen[recht].text;
        luecke.classList.add('voll', 'richtig');
      }
      abschliessen(ergebnis(o.richtig ? 'richtig' : 'falsch', { versuche: 1, eingabe: o.text, wahl: i }));
      return true;
    }
    hoere(feld, 'click', e => {
      const b = e.target.closest('.fr-option');
      if (b && !b.disabled) waehle(+b.dataset.i);
    });
    // 1 bis 4 wählen eine Antwort, die Leertaste spielt den Clip noch einmal
    function taste(e) {
      if (e.key === ' ') return lauf.spiel(false);
      const n = zifferVon(e);
      return n >= 1 && n <= optionen.length ? waehle(n - 1) : false;
    }
    return { waehle, taste };
  }

  /* ---------- artikel ---------- */

  function artikelBauen(a) {
    const e = a.e || {};
    const m = ARTIKEL_VORN.exec(String(a.fr || ''));
    const artikel = m ? m[1] : '', les = artikel === 'les ';
    // Das Hauptwort (kopf) trägt die Frage, der Rest der Wendung tritt grau zurück.
    // «les» steht von Anfang an da, Farbe bekommt es erst mit dem Urteil.
    const kopf = String(a.kopf || ''), rest = String(a.rest || '');
    const kopfLes = kopf.startsWith('les ');
    vorgabeBauen({
      cap: 'Männlich oder weiblich?', fr: true,
      gross: '<span class="fr-art">' + (kopfLes ? 'les ' : '') + '</span>' + esc(kopfLes ? kopf.slice(4) : kopf)
        + (rest ? '<span class="fr-klammer"> ' + esc(rest) + '</span>' : '') + '<span class="fr-schild-ort"></span>',
      // Das Deutsche kommt schon ohne seinen Artikel: Gefragt ist das französische Geschlecht
      klein: esc(a.de || ''),
    });

    const k = a.knoepfe || [{ gross: 'männlich', klein: '(m)' }, { gross: 'weiblich', klein: '(f)' }];
    const feld = feldArt('zwei');
    feld.innerHTML = ['m', 'f'].map((g, i) => '<button type="button" class="fr-genus ' + g + '" data-g="' + g + '">'
      + '<b>' + esc(k[i].gross) + '</b><small>' + esc(k[i].klein) + '</small></button>').join('');
    const knoepfe = [...feld.querySelectorAll('.fr-genus')];

    function waehle(g) {
      if (g === 0 || g === 1) g = 'mf'[g];
      const b = feld.querySelector('.fr-genus.' + g);
      if (!b || !lauf || lauf.geurteilt) return false;
      const stimmt = g === a.genus;
      knoepfe.forEach(x => {
        x.disabled = true;
        if (x.dataset.g === a.genus) {
          x.classList.add('richtig');
          marke(x, true);
        }
      });
      b.classList.add('gewaehlt');
      if (stimmt) bewege(b, 'pop');
      else {
        bewege(b, 'falsch', 'wackelt');
        marke(b, false);
      }
      // Jetzt steht die ganze Form da, wie im Buch: Artikel in seiner Farbe, das Schild dahinter
      const vorgabe = $('frVorgabe');
      const art = vorgabe.querySelector('.fr-art'), ort = vorgabe.querySelector('.fr-schild-ort');
      if (art && (a.genus === 'm' || a.genus === 'f')) {
        art.textContent = artikel;
        art.classList.add('fr-artikel-' + a.genus, 'da');
        ort.innerHTML = ' ' + schildHTML(a.genus, les);
      }
      const t = e.teile && e.teile[a.teil], klein = vorgabe.querySelector('.fr-klein');
      if (t && klein) klein.textContent = t.zeigeDe;
      abschliessen(ergebnis(stimmt ? 'richtig' : 'falsch', { versuche: 1, eingabe: g, wahl: g === 'm' ? 0 : 1 }));
      return true;
    }
    hoere(feld, 'click', ev => {
      const b = ev.target.closest('.fr-genus');
      if (b && !b.disabled) waehle(b.dataset.g);
    });
    // Pfeil links oder 1: männlich; Pfeil rechts oder 2: weiblich
    function taste(ev) {
      const n = ev.key === 'ArrowLeft' ? 1 : ev.key === 'ArrowRight' ? 2 : zifferVon(ev);
      return n === 1 || n === 2 ? waehle(n - 1) : false;
    }
    return { waehle, taste };
  }

  /* ---------- kennen und echo: die ganze Zeile aus dem Buch ---------- */

  // «Achtung: der Stuhl, aber la chaise.» Beide Artikel in ihrer Farbe: So sieht man den Tausch.
  function kontrastHTML(text, e) {
    const m = /^(.*?: )(\S+) (.*), aber (.*)\.$/.exec(text);
    if (!m || !DE_GENUS[m[2]]) return esc(text);
    return esc(m[1]) + '<span class="fr-artikel-' + DE_GENUS[m[2]] + '">' + esc(m[2]) + '</span> ' + esc(m[3])
      + ', aber <span lang="' + sprache() + '">' + frHTML(m[4], e, { schild: false }) + '</span>.';
  }
  // Lernen und die Merkhilfen (des Kurses) sind Nachbardateien: Fehlt eine, steht die Karte eben ohne Kasten da
  function kontrastVon(a) {
    try { return lernen().kontrast(a.e); } catch (err) { return null; }
  }
  function merkhilfeVon(a) {
    try { return lauf.kurs.merkhilfen()[a.e.id] || null; } catch (err) { return null; }
  }

  function wortKarte(a, cap, mitKaesten) {
    const e = a.e || {};
    const teile = e.teile || [];
    const mehrere = teile.length > 1;
    vorgabeBauen({
      cap, fr: true, ton: 'normal', clip: a.clipEintrag || a.clip,
      gross: frHTML(e.fr || a.fr, e),
      klein: mehrere ? '' : esc(e.de || a.de || ''),
    });
    let h = '';
    if (mehrere) {
      // Was zusammengehört, steht nebeneinander; Sätze und Langes untereinander
      const gestapelt = e.art === 'satz' || teile.some(t => (t.fr.join(', ') + t.zeigeDe).length > 40);
      h += '<div class="fr-teile' + (gestapelt ? ' gestapelt' : '') + '">' + teile.map(t => '<div class="fr-teil">'
        + '<span lang="' + sprache() + '">' + frHTML(t.fr.join(', '), e, { schild: false }) + '</span><i>=</i><span>' + esc(t.zeigeDe) + '</span></div>').join('') + '</div>';
    }
    if (mitKaesten) {
      const kontrast = kontrastVon(a), merk = merkhilfeVon(a);
      if (kontrast) h += '<div class="fr-kontrast"><b aria-hidden="true">!</b><span>' + kontrastHTML(kontrast, e) + '</span></div>';
      if (merk) h += '<div class="fr-merk">' + zeichen('i-birne') + '<span>' + esc(merk) + '</span></div>';
    }
    $('frAntwort').innerHTML = h;
  }

  function kennenBauen(a) {
    wortKarte(a, 'Zum Kennenlernen', true);
    const feld = feldArt('nur-weiter');
    feld.innerHTML = '<button type="button" class="fr-option breit" id="frIchSags">Ich sag’s!</button>';
    const knopf = $('frIchSags');
    const ring = () => {
      bewege(knopf, 'ring');
      clearTimeout(lauf.ringUhr);
      lauf.ringUhr = spaeter(2000, () => knopf.classList.remove('ring'));
    };
    function ichSags() {
      if (!lauf) return false;
      const l = lauf;
      // Der Gastgeber spielt den Clip und sagt «Jetzt du!». Gibt er ein Versprechen zurück,
      // läuft der Ring erst danach: zwei Sekunden, in denen Nea spricht.
      const gesagt = melde('ichSags');
      if (gesagt && typeof gesagt.then === 'function') gesagt.then(() => { if (lauf === l) ring(); }, () => {});
      else ring();
      return true;
    }
    hoere(knopf, 'click', ichSags);
    // Nichts zu beurteilen: Die Karte ist gezeigt, also gesehen. Erst nach dem Aufbau melden,
    // damit der Gastgeber mit seinem eigenen Aufbau fertig ist.
    const l = lauf;
    Promise.resolve().then(() => { if (lauf === l) abschliessen(ergebnis('ohne')); });
    // S wie «sagen». Enter gehört dem Gastgeber: Es ist sein «Weiter». Eine gehaltene Taste sagt nur einmal.
    const taste = e => (e.key === 's' || e.key === 'S' ? e.repeat || ichSags() : false);
    return { ichSags, taste, offen: true };
  }

  function echoBauen(a) {
    wortKarte(a, 'Sprich nach', false);
    const feld = feldArt('nur-weiter');
    feld.innerHTML = '<button type="button" class="fr-option breit" id="frGesagt">Gesagt!</button>';
    const knopf = $('frGesagt');
    function gesagt() {
      if (!lauf || lauf.geurteilt) return false;
      Ton.tipp();
      knopf.disabled = true;
      knopf.classList.add('richtig');
      abschliessen(ergebnis('ohne'));
      return true;
    }
    hoere(knopf, 'click', gesagt);
    const taste = e => (e.key === 'Enter' ? gesagt() : false);
    return { gesagt, taste };
  }

  /* ---------- paare: das Finale ---------- */

  function paareBauen(a) {
    const paare = a.paare || [], n = paare.length;
    vorgabeBauen({ cap: 'Was gehört zusammen?' });
    // Jede Spalte für sich gemischt, und nie liegen die Paare schon nebeneinander
    const links = shuffle(paare.map((p, i) => i));
    const rechts = shuffle(links.slice());
    if (n > 1 && rechts.every((x, i) => x === links[i])) rechts.push(rechts.shift());
    let h = '<div class="fr-paare">';
    for (let r = 0; r < n; r++) {
      h += '<button type="button" class="fr-paar fr" data-seite="fr" data-i="' + links[r] + '" data-reihe="' + r + '" lang="' + sprache() + '">' + esc(paare[links[r]].fr) + '</button>'
        + '<button type="button" class="fr-paar de" data-seite="de" data-i="' + rechts[r] + '" data-reihe="' + r + '">' + esc(paare[rechts[r]].de) + '</button>';
    }
    $('frAntwort').innerHTML = h + '</div>';
    const feld = feldArt('nur-weiter');
    feld.innerHTML = '<div class="fr-paar-zahl" aria-hidden="true">' + paare.map(() => '<i></i>').join('') + '</div>';
    const punkte = [...feld.querySelectorAll('i')];
    const wahl = { fr: null, de: null };
    let gefunden = 0, fehl = 0;

    function tippe(b) {
      if (!b || b.disabled || !lauf || lauf.geurteilt) return false;
      const seite = b.dataset.seite;
      Ton.tipp();
      // Jede französische Kachel spricht, wenn man sie antippt
      if (seite === 'fr') melde('spielen', paare[+b.dataset.i].clip, false);
      if (wahl[seite] === b) {
        b.classList.remove('gewaehlt');
        wahl[seite] = null;
        return true;
      }
      if (wahl[seite]) wahl[seite].classList.remove('gewaehlt');
      wahl[seite] = b;
      b.classList.add('gewaehlt');
      if (!wahl.fr || !wahl.de) return true;
      const f = wahl.fr, d = wahl.de;
      wahl.fr = wahl.de = null;
      f.classList.remove('gewaehlt');
      d.classList.remove('gewaehlt');
      const pf = paare[+f.dataset.i], pd = paare[+d.dataset.i];
      if (pf === pd || pf.de === pd.de || pf.fr === pd.fr) {
        for (const x of [f, d]) {
          x.disabled = true;
          bewege(x, 'richtig', 'pop');
        }
        punkte[gefunden].classList.add('da');
        gefunden++;
        if (gefunden === n) abschliessen(ergebnis('ohne', { fehlpaare: fehl }));
      } else {
        fehl++;
        bewege(f, 'wackelt');
        bewege(d, 'wackelt');
      }
      return true;
    }
    hoere($('frAntwort'), 'click', e => tippe(e.target.closest('.fr-paar')));
    // Ohne Paare gibt es nichts zu finden: gleich weiter
    if (!n) {
      const l = lauf;
      Promise.resolve().then(() => { if (lauf === l) abschliessen(ergebnis('ohne')); });
    }

    // Tastatur: Ein Ring wandert über die Kacheln, die Leertaste tippt die Kachel im Ring an.
    // Gefundene Paare überspringt er.
    const spalten = { fr: [...$('frAntwort').querySelectorAll('.fr-paar.fr')], de: [...$('frAntwort').querySelectorAll('.fr-paar.de')] };
    let ring = null;
    function ringAuf(b) {
      if (ring) ring.classList.remove('ring');
      ring = b || null;
      if (ring) ring.classList.add('ring');
    }
    // Die nächste offene Kachel einer Spalte: von der Reihe aus zuerst nach unten, dann nach oben
    const naechste = (seite, reihe) => spalten[seite].slice(reihe).find(b => !b.disabled)
      || spalten[seite].slice(0, reihe).reverse().find(b => !b.disabled) || null;
    function taste(e) {
      const k = e.key;
      const dy = k === 'ArrowUp' ? -1 : k === 'ArrowDown' ? 1 : 0, dx = k === 'ArrowLeft' || k === 'ArrowRight';
      if (!dy && !dx && k !== ' ') return false;
      // Die erste Taste zeigt den Ring nur
      if (!ring) {
        ringAuf(naechste('fr', 0) || naechste('de', 0));
        return true;
      }
      const seite = ring.dataset.seite, reihe = +ring.dataset.reihe;
      if (k === ' ') {
        tippe(ring);
        // Ist das Paar gefunden, rückt der Ring zur nächsten offenen Kachel
        if (ring.disabled) ringAuf(lauf && !lauf.geurteilt ? naechste(seite, reihe) || naechste(seite === 'fr' ? 'de' : 'fr', reihe) : null);
      } else if (dx) {
        const andere = k === 'ArrowLeft' ? 'fr' : 'de';
        if (andere !== seite || ring.disabled) ringAuf(naechste(andere, reihe) || ring);
      } else {
        for (let r = reihe + dy; r >= 0 && r < n; r += dy) {
          if (!spalten[seite][r].disabled) {
            ringAuf(spalten[seite][r]);
            break;
          }
        }
      }
      return true;
    }
    return { tippe, taste };
  }

  /* ---------- akzent: Lücken mit Kandidaten ---------- */

  function akzentBauen(a) {
    vorgabeBauen({ cap: 'Welche Akzente fehlen?', gross: esc(a.de || '') });
    const plaetze = a.plaetze || [], antwort = $('frAntwort');
    antwort.innerHTML = plaetzeHTML(plaetze, { knopf: true, reihe: 'buchstaben' });
    const feld = feldArt('auswahl', 'zeichen');
    // wert: der gewählte Kandidat; zu: stimmt und bleibt
    const luecken = offenePlaetze(plaetze, antwort).map(x => ({ p: x.p, el: x.el, wert: null, zu: false }));
    let aktiv = luecken[0] || null, versuche = 0, fehler = [], bereit = null;
    const text = () => lesbar(plaetze, p => (luecken.find(l => l.p === p) || {}).wert);

    function zeigen() {
      for (const l of luecken) {
        l.el.textContent = l.wert || '';
        l.el.classList.toggle('voll', !!l.wert);
        l.el.classList.toggle('aktiv', l === aktiv);
        l.el.classList.toggle('richtig', l.zu);
        l.el.disabled = l.zu;
      }
      // Unten stehen die Kandidaten der aktiven Lücke. Ist keine offen, bleiben die letzten blass stehen:
      // So springt nichts, und ein Tipp auf eine Lücke holt sie zurück.
      // data-z: die Ziffer, die den Kandidaten auf der Tastatur wählt (zu sehen erst nach der ersten Taste)
      if (aktiv) {
        feld.innerHTML = (aktiv.p.wahl || []).map((w, i) => '<button type="button" class="fr-option" data-i="' + i + '" data-z="' + (i + 1) + '" lang="' + sprache() + '">' + esc(w) + '</button>').join('');
      } else {
        for (const b of feld.querySelectorAll('.fr-option')) {
          b.disabled = true;
          b.classList.add('aus');
        }
      }
      const voll = luecken.every(l => l.wert);
      if (lauf && !lauf.geurteilt && voll !== bereit) {
        bereit = voll;
        melde('pruefbar', voll);
      }
    }
    // Nach dem Füllen geht es zur nächsten leeren Lücke dahinter, sonst zur ersten leeren
    function waehle(i) {
      const w = aktiv && (aktiv.p.wahl || [])[i];
      if (!lauf || lauf.geurteilt || w === undefined) return false;
      const l = aktiv, leer = x => !x.wert && !x.zu && x !== l;
      l.wert = w;
      l.el.classList.remove('falsch', 'wackelt');
      Ton.tipp();
      aktiv = luecken.slice(luecken.indexOf(l) + 1).find(leer) || luecken.find(leer) || null;
      zeigen();
      return true;
    }
    // Ein Tipp auf eine Lücke öffnet sie wieder
    function oeffne(l) {
      if (!lauf || lauf.geurteilt || !l || l.zu) return false;
      l.wert = null;
      aktiv = l;
      Ton.tipp();
      zeigen();
      return true;
    }
    function pruefen() {
      if (!lauf || lauf.geurteilt || !luecken.every(l => l.wert)) return false;
      versuche++;
      const eingabe = text();
      const u = lernen().reihenUrteil(luecken.map(l => l.wert), luecken.map(l => l.p));
      if (!u.richtig && versuche === 1) {
        // Was stimmt, bleibt; die anderen Lücken sind wieder leer
        fehler = u.fehler.slice();
        luecken.forEach((l, i) => {
          if (u.stellen.includes(i)) {
            l.wert = null;
            bewege(l.el, 'falsch', 'wackelt');
          } else l.zu = true;
        });
        aktiv = luecken.find(l => !l.zu) || null;
        zeigen();
        melde('versuch', { art: u.tipp });
        return true;
      }
      // Gelöst, oder zweimal daneben: Dann stehen die richtigen Buchstaben da. Nachgebaut wird hier nicht.
      knoepfeAus();
      luecken.forEach(l => {
        l.wert = erste(l.p.soll);
        l.zu = true;
        l.el.classList.remove('falsch', 'wackelt');
      });
      aktiv = null;
      zeigen();
      luecken.forEach(l => bewege(l.el, 'pop'));
      abschliessen(ergebnis(u.richtig ? (versuche === 1 ? 'richtig' : 'fast') : 'falsch', { versuche, fehler, eingabe }));
      return true;
    }
    // 1 bis 4 wählen den Kandidaten (ein getippter Buchstabe auch), die Löschtaste öffnet die Lücke davor
    function taste(e, z) {
      // Hier zählen die Ziffern die Kandidaten ab, nicht wie beim Legen und Schreiben die Akzente:
      // Wer eine Tastatur hat, sieht jetzt an jedem Kandidaten seine Ziffer
      feld.classList.add('ziffern');
      if (e.key === 'Backspace') {
        const offen = luecken.filter(l => !l.zu);
        oeffne(offen[(aktiv ? offen.indexOf(aktiv) : offen.length) - 1]);
        return true;
      }
      if (!aktiv) return false;
      const wahl = aktiv.p.wahl || [];
      const n = /^[1-9]$/.test(e.key) ? +e.key : wahl.indexOf(z) + 1 || zifferVon(e);
      return n >= 1 && n <= wahl.length ? waehle(n - 1) : false;
    }
    tippHoerer(feld, '.fr-option', b => waehle(+b.dataset.i));
    hoere(antwort, 'click', e => {
      const b = e.target.closest('.fr-platz');
      const l = b && luecken.find(x => x.el === b);
      // Die aktive leere Lücke ist schon offen
      if (l && (l.wert || l !== aktiv)) oeffne(l);
    });
    zeigen();
    return { pruefen, taste };
  }

  /* ---------- legen, ordnen, bauen: Kacheln aus der Ablage auf die Plätze ---------- */

  function kachelnBauen(a) {
    const woerter = a.uebung !== 'legen';
    // Nach dem Ohr werden nur Sätze geordnet; ohne Aufnahme steht das Deutsche gross da
    const nachOhr = a.uebung === 'ordnen' && a.vorgabe === 'ton' && a.ton !== false && !!a.clip;
    vorgabeBauen({
      cap: a.uebung === 'bauen' ? 'Baue den Satz' : woerter ? (nachOhr ? 'Ordne, was du hörst' : 'Ordne die Wörter')
        : a.lueckenwort ? 'Lege das fehlende Wort' : 'Lege das Wort',
      ton: nachOhr ? 'gross' : '',
      gross: nachOhr ? '' : esc(a.de || ''),
      klein: nachOhr ? esc(a.de || '') : '',
    });
    const plaetze = a.plaetze || [], antwort = $('frAntwort');
    antwort.innerHTML = plaetzeHTML(plaetze, { knopf: true });
    const reihe = antwort.querySelector('.fr-plaetze');
    // Fehlt nur ein Wort, ist der Rest Fliesstext: Die Plätze bleiben dann nahe an der Zeilenhöhe
    if (a.uebung === 'legen' && a.lueckenwort) {
      reihe.classList.add('wortluecke');
      reihe.dataset.max = 48;
    }
    const feld = feldArt('kacheln');
    // k: die Kachel auf dem Platz; zu: liegt richtig und bleibt
    const offen = offenePlaetze(plaetze, antwort).map(x => ({ p: x.p, el: x.el, k: null, zu: false }));
    let kacheln = a.kacheln || [];
    // stapel: die gelegten Kacheln, die letzte zuoberst; ring: die Kachel, auf der die Tastatur steht;
    // puffer: getippte Buchstaben, die noch ein Artikel werden können (legen, siehe taste)
    let stapel = [], ring = null, versuche = 0, fehler = [], bereit = null, nachbau = false, puffer = '';

    const knopf = k => feld.querySelector('.fr-kachel[data-id="' + k.id + '"]');
    const liegt = k => offen.some(s => s.k === k);
    const voll = () => offen.every(s => s.k);
    const passt = (s, k) => [].concat(s.p.soll).includes(k.text);
    // Am Satzanfang steht die Kachel gross da; verglichen wird immer ihr Text
    const schrift = (s, t) => (s.p.satzanfang ? grossVorn(t) : t);
    const text = () => lesbar(plaetze, p => {
      const s = offen.find(x => x.p === p);
      return s && s.k ? schrift(s, s.k.text) : '';
    });

    function platzZeigen(s) {
      // Beim Nachbauen steht die Lösung blass im leeren Platz
      s.el.textContent = s.k ? schrift(s, s.k.text) : nachbau ? schrift(s, erste(s.p.soll)) : '';
      s.el.classList.toggle('voll', !!s.k);
      s.el.classList.toggle('muster', nachbau && !s.k);
      s.el.classList.toggle('richtig', s.zu);
      s.el.disabled = s.zu;
    }
    function ringZeigen() {
      for (const b of feld.querySelectorAll('.fr-kachel.ring')) b.classList.remove('ring');
      if (ring && liegt(ring)) ring = null;
      if (ring) knopf(ring).classList.add('ring');
    }
    function lage() {
      const zurueck = feld.querySelector('.fr-zurueck');
      if (zurueck) zurueck.disabled = nachbau || !stapel.length || !lauf || lauf.geurteilt;
      ringZeigen();
      const b = voll();
      if (lauf && !lauf.geurteilt && b !== bereit) {
        bereit = b;
        melde('pruefbar', b);
      }
    }
    function nimm(s) {
      if (!s || !s.k || s.zu) return false;
      const b = knopf(s.k);
      if (b) b.classList.remove('weg');
      stapel = stapel.filter(k => k !== s.k);
      s.k = null;
      s.el.classList.remove('falsch', 'wackelt');
      platzZeigen(s);
      return true;
    }
    // Eine Kachel geht auf den nächsten freien Platz ihrer Art. Der Artikel-Platz tauscht:
    // Wer «la» antippt, während «le» liegt, meint «la».
    function lege(k) {
      if (!lauf || lauf.fertig || (lauf.geurteilt && !nachbau) || !k || liegt(k)) return false;
      const b = knopf(k);
      const s = k.art === 'artikel' ? offen.find(x => x.p.art === 'artikel' && !x.zu) : offen.find(x => x.p.art !== 'artikel' && !x.k);
      // Kein Platz mehr, oder beim Nachbauen nicht die Kachel, die hierher gehört: Sie wackelt nur
      if (!s || (nachbau && (s.k || !passt(s, k)))) {
        if (b) bewege(b, 'wackelt');
        return true;
      }
      // Stand der Ring auf dieser Kachel, rückt er zur nächsten in der Ablage
      if (ring === k) {
        const frei = kacheln.filter(x => x !== k && !liegt(x)), ab = kacheln.indexOf(k);
        ring = frei.find(x => kacheln.indexOf(x) > ab) || frei[frei.length - 1] || null;
      }
      nimm(s);
      s.k = k;
      s.zu = nachbau;
      if (!nachbau) stapel.push(k);
      if (b) b.classList.add('weg');
      s.el.classList.remove('falsch', 'wackelt');
      Ton.tipp();
      platzZeigen(s);
      lage();
      if (nachbau && voll()) {
        feld.classList.add('aus');
        offen.forEach(x => bewege(x.el, 'pop'));
        fertigMelden();
      }
      return true;
    }
    function zurueck() {
      if (!lauf || lauf.geurteilt || !stapel.length) return false;
      const k = stapel[stapel.length - 1];
      nimm(offen.find(s => s.k === k));
      Ton.tipp();
      lage();
      return true;
    }
    // Die Lösung steht blass in den Plätzen, die fremden Kacheln sind weg. Jetzt geht nichts mehr
    // schief: Eine Kachel, die nicht an den nächsten Platz gehört, wackelt nur.
    function nachbauStarten() {
      nachbau = true;
      stapel = [];
      ring = null;
      puffer = '';
      // Wo zwei Artikel gelten («un/une enfant»), bleibt der, den die Lösung zeigt
      kacheln = (a.kacheln || []).filter(k => !k.fremd && (k.art !== 'artikel' || offen.some(s => s.p.art === 'artikel' && erste(s.p.soll) === k.text)));
      feld.innerHTML = ablageHTML(kacheln);
      for (const s of offen) {
        s.k = null;
        s.zu = false;
        s.el.classList.remove('falsch', 'wackelt', 'pop');
        platzZeigen(s);
      }
      lage();
      melde('nachbau');
      // Ohne offene Plätze (das gibt es im Wortschatz nicht) hält auch nichts auf
      if (lauf && !offen.length) fertigMelden();
    }
    // «falsch» wird sofort gemeldet (und vom Gastgeber verbucht), erst danach beginnt das Nachbauen
    function aufloesen() {
      const l = lauf;
      knoepfeAus();
      urteilen(ergebnis('falsch', { versuche, fehler, eingabe: text() }));
      if (lauf === l) nachbauStarten();
      return true;
    }
    function pruefen() {
      if (!lauf || lauf.geurteilt || !voll()) return false;
      versuche++;
      const u = lernen().reihenUrteil(offen.map(s => s.k.text), offen.map(s => s.p));
      if (u.richtig) {
        const eingabe = text();
        stapel = [];
        for (const s of offen) {
          s.zu = true;
          platzZeigen(s);
          bewege(s.el, 'pop');
        }
        feld.classList.add('aus');
        knoepfeAus();
        const l = lauf;
        abschliessen(ergebnis(versuche === 1 ? 'richtig' : 'fast', { versuche, fehler, eingabe }));
        // Zeigt der Gastgeber schon die nächste Aufgabe, gehört das Feld ihr
        if (lauf === l) lage();
        return true;
      }
      if (versuche > 1) return aufloesen();
      // Erster Versuch daneben: Was stimmt, bleibt liegen; die anderen Kacheln gehen zurück in die Ablage
      fehler = u.fehler.slice();
      offen.forEach((s, i) => {
        if (u.stellen.includes(i)) {
          nimm(s);
          bewege(s.el, 'falsch', 'wackelt');
        } else {
          s.zu = true;
          stapel = stapel.filter(k => k !== s.k);
          platzZeigen(s);
        }
      });
      lage();
      melde('versuch', { art: u.tipp });
      return true;
    }
    function weissNicht() {
      return !lauf || lauf.geurteilt ? false : aufloesen();
    }

    // Genau dieses Zeichen: «e» legt nie ein «é». Nur gross und klein ist gleich («ACM»).
    // Gibt es keine freie Kachel dafür, wackelt der nächste freie Platz.
    function legeZeichen(z) {
      const frei = kacheln.filter(x => !liegt(x));
      const kachel = frei.find(x => x.art === 'buchstabe' && x.text === z) || frei.find(x => x.art === 'buchstabe' && x.text.toLowerCase() === z);
      const s = offen.find(x => x.p.art !== 'artikel' && !x.k);
      if (kachel) lege(kachel);
      else if (s) bewege(s.el, 'wackelt');
    }
    // Wer das Wort tippt, wie es im Buch steht, fängt mit dem Artikel an: «la chaise». Solange der
    // Artikel-Platz leer ist und noch kein Buchstabe gelegt ist, warten Buchstaben, die ein freier
    // Artikel werden können, im Puffer, und die passenden Artikel-Kacheln tragen den Ring. Die
    // Leertaste legt den Artikel. Geht es anders weiter («langue», «lundi»), gehen die Buchstaben
    // doch der Reihe nach auf die Plätze.
    const artikelFrei = () => kacheln.filter(x => x.art === 'artikel' && !liegt(x));
    const pufferKann = t => artikelFrei().some(x => x.text.startsWith(t));
    function pufferZeigen() {
      for (const x of kacheln) {
        const b = x.art === 'artikel' && knopf(x);
        if (b) b.classList.toggle('tippt', !!puffer && !liegt(x) && x.text.startsWith(puffer));
      }
    }
    function pufferWeg() {
      if (!puffer) return;
      puffer = '';
      pufferZeigen();
    }

    // Wörter: Pfeile bewegen den Ring über die Ablage, die Leertaste legt. Buchstaben: Die Taste legt
    // die nächste freie Kachel mit genau diesem Zeichen, die Pfeile den linken oder rechten Artikel.
    function taste(e, z) {
      const k = e.key, links = k === 'ArrowLeft';
      if (k === 'Backspace') {
        // Was im Puffer wartet, liegt noch nicht: Die Löschtaste nimmt zuerst dort weg
        if (puffer) {
          puffer = puffer.slice(0, -1);
          pufferZeigen();
        } else zurueck();
        return true;
      }
      if (woerter) {
        if (k !== ' ' && !links && k !== 'ArrowRight') return false;
        const frei = kacheln.filter(x => !liegt(x));
        // Die erste Taste zeigt den Ring nur
        if (!ring) ring = frei[0] || null;
        else if (k === ' ') return lege(ring);
        else ring = frei[(frei.indexOf(ring) + (links ? -1 : 1) + frei.length) % frei.length] || null;
        ringZeigen();
        return true;
      }
      if (links || k === 'ArrowRight') {
        pufferWeg();
        // Links und rechts meinen die Kacheln, wie sie beim ersten Versuch dalagen
        const art = (a.kacheln || []).filter(x => x.art === 'artikel')[links ? 0 : 1];
        if (!art) return false;
        const s = offen.find(x => x.p.art === 'artikel');
        if (!lege(kacheln.find(x => x.art === 'artikel' && x.text === art.text)) && s && !s.k) bewege(s.el, 'wackelt');
        return true;
      }
      // «?» steht im Buch («qui?», «C’est quoi?») und ist vorgedruckt. Wer schon legt oder tippt, meint
      // es als Satzzeichen: Es fällt weg. «Weiss ich nicht» heisst es nur, solange nichts liegt und nichts getippt ist.
      if (k === '?' && (nachbau || puffer || offen.some(s => s.k) || plaetze.some(p => p.art === 'fest' && String(p.text).includes('?')))) return true;
      // Ein Zeichen oder Enter beendet den Puffer: Er wird der Artikel, wächst weiter oder geht als Buchstaben hinaus
      if (puffer && (z || k === 'Enter')) {
        if (z && z !== ' ' && pufferKann(puffer + z)) {
          puffer += z;
          pufferZeigen();
          Ton.tipp();
          return true;
        }
        const art = z === ' ' && artikelFrei().find(x => x.text === puffer);
        const war = puffer;
        pufferWeg();
        if (art) return lege(art);
        for (const ch of war) legeZeichen(ch);
        if (z === ' ') return true;
      }
      if (!z || z === ' ' || z === '-' || z === '’') return false;
      const buchstabeGelegt = offen.some(x => x.p.art !== 'artikel' && x.k && (nachbau || !x.zu));
      if (!buchstabeGelegt && offen.some(x => x.p.art === 'artikel' && !x.k) && pufferKann(z)) {
        puffer = z;
        pufferZeigen();
        Ton.tipp();
        return true;
      }
      legeZeichen(z);
      return true;
    }

    feld.innerHTML = ablageHTML(kacheln);
    tippHoerer(feld, '.fr-kachel, .fr-zurueck', b => {
      // Wer tippt statt zu schreiben, fängt neu an: Der Puffer verfällt
      pufferWeg();
      return b.classList.contains('fr-zurueck') ? zurueck() : lege(kacheln.find(k => k.id === b.dataset.id));
    });
    // Ein Tipp auf einen belegten Platz holt die Kachel zurück
    hoere(antwort, 'click', e => {
      const b = e.target.closest('.fr-platz');
      const s = b && offen.find(x => x.el === b);
      if (b) pufferWeg();
      if (s && lauf && !lauf.geurteilt && nimm(s)) {
        Ton.tipp();
        lage();
      }
    });
    offen.forEach(platzZeigen);
    lage();
    melde('weissNicht', true);
    return { pruefen, weissNicht, taste };
  }

  /* ---------- schreiben: die getippte Zeile und ihre Tastatur ---------- */

  function schreibenBauen(a) {
    const e = a.e, ziel = [...String(a.ziel || a.fr || '')];
    // Das Diktat: kein Text, nur der Clip. Ohne Aufnahme steht doch das Deutsche da.
    const diktat = a.vorgabe === 'ton' && a.ton !== false && !!a.clip;
    const anders = diktat ? [] : a.vorgabe === 'ton' ? (a.formen || []).slice(0, a.form) : a.andersAls || [];
    vorgabeBauen({
      cap: diktat ? 'Schreibe, was du hörst' : 'Schreibe auf ' + lauf.kurs.sprache,
      ton: diktat ? 'gross' : '',
      gross: diktat ? '' : esc(a.de || ''),
      klein: anders.length ? 'anders als: ' + anders.map(f => '<b lang="' + sprache() + '">' + esc(f) + '</b>').join(', ') : '',
    });
    // Über der Tastatur ist auf einem kleinen Handy wenig Platz: Dort fällt der Hör-Knopf kleiner aus
    if (diktat && $('frHoeren')) $('frHoeren').classList.add('knapp');
    const antwort = $('frAntwort');
    antwort.innerHTML = '<div class="fr-zeile feld aktiv" lang="' + sprache() + '" aria-label="Deine Antwort"></div><div class="fr-hinweis"></div>';
    const zeile = antwort.querySelector('.fr-zeile'), hinweis = antwort.querySelector('.fr-hinweis');
    const feld = feldArt('tastatur');
    // Was sich auf der Tastatur des Kurses tippen lässt, und wie lang es höchstens wird
    const tippbar = lauf.tast.tippbar, MAX = lernen().K.SCHREIBEN_MAX;
    feld.innerHTML = tastaturHTML(lauf.tast);
    const ok = feld.querySelector('[data-k="ok"]'), back = feld.querySelector('[data-k="back"]');
    // text: die getippten Zeichen, je { ch, falsch }; ort: die Schreibmarke steht vor text[ort];
    // weit: beim Nachbauen so viele Zeichen der Lösung stehen schon da
    let text = [], ort = 0, weit = 0, versuche = 0, fehler = [], bereit = null, nachbau = false;
    // Die Zeile, die beim ersten Versuch daneben lag. Solange sie unverändert dasteht, lässt sie sich
    // nicht noch einmal prüfen: Ein Doppeltipp auf «Prüfen» verschenkt sonst den zweiten Versuch.
    let verpasst = null;
    const MARKE = '<i class="caret"></i>';
    const eingabe = () => text.map(z => z.ch).join('');
    const offenIst = () => !!lauf && !lauf.geurteilt && !nachbau;
    const pruefbar = () => text.some(z => z.ch !== ' ') && eingabe() !== verpasst;

    function zeigen() {
      let h = '';
      if (nachbau) {
        // Was schon abgeschrieben ist, steht fest da, der Rest der Lösung blass dahinter
        ziel.forEach((ch, i) => {
          h += (i === weit ? MARKE : '') + '<span' + (i < weit ? '' : ' class="muster"') + '>' + esc(ch) + '</span>';
        });
      } else {
        text.forEach((z, i) => {
          h += (i === ort ? MARKE : '') + '<span data-i="' + i + '"' + (z.falsch ? ' class="falsch"' : '') + '>' + esc(z.ch) + '</span>';
        });
        if (ort >= text.length) h += MARKE;
      }
      zeile.innerHTML = h;
      const etwas = pruefbar();
      ok.disabled = !offenIst() || !etwas;
      back.disabled = !offenIst() || !ort;
      if (offenIst() && etwas !== bereit) {
        bereit = etwas;
        melde('pruefbar', etwas);
      }
      insBild();
    }
    // Auf dem kleinen Handy ist die Karte über der Tastatur niedrig und rollt: Die Zeile und der
    // Hinweis darunter sollen zu sehen sein, wenn sie unten herausragen. Die Zeile bleibt dabei ganz oben im Bild.
    function insBild() {
      const karte = $('frKarte');
      if (!karte || karte.scrollHeight <= karte.clientHeight + 1) return;
      const k = karte.getBoundingClientRect();
      const mehr = Math.min(antwort.getBoundingClientRect().bottom - k.bottom + 8, zeile.getBoundingClientRect().top - k.top - 8);
      if (mehr > 0) karte.scrollTop += mehr;
    }
    function tippe(ch) {
      if (!lauf || lauf.fertig || (lauf.geurteilt && !nachbau)) return false;
      if (nachbau) return abschreiben(ch);
      // Länger als MAX (30) ist keine Form, die getippt wird
      if (text.length >= MAX) {
        bewege(zeile, 'wackelt');
        return true;
      }
      text.splice(ort, 0, { ch, falsch: false });
      ort++;
      Ton.taste();
      zeigen();
      return true;
    }
    function loesche() {
      if (!offenIst() || !ort) return false;
      text.splice(ort - 1, 1);
      ort--;
      Ton.taste();
      zeigen();
      return true;
    }
    function gehe(d) {
      if (!offenIst()) return false;
      ort = clamp(ort + d, 0, text.length);
      zeigen();
      return true;
    }
    // Die Zeile ist fertig: grün, ohne Schreibmarke, die Tastatur blass
    function zeileZu() {
      zeile.classList.remove('aktiv', 'wackelt');
      zeile.classList.add('richtig');
      feld.classList.add('aus');
    }

    // Nachbauen: Die Lösung steht blass in der Zeile und wird Zeichen für Zeichen abgeschrieben.
    // Eine falsche Taste wackelt nur. Komma und Fragezeichen gibt es auf der Tastatur nicht: Sie
    // setzen sich von selbst.
    const vonSelbst = () => {
      while (weit < ziel.length && !tippbar.has(ziel[weit].toLowerCase())) weit++;
    };
    function abschreiben(ch) {
      if (ch !== ziel[weit].toLowerCase()) {
        bewege(zeile, 'wackelt');
        return true;
      }
      weit++;
      vonSelbst();
      Ton.taste();
      if (weit >= ziel.length) zeileZu();
      zeigen();
      if (weit >= ziel.length) {
        bewege(zeile, 'pop');
        fertigMelden();
      }
      return true;
    }
    function aufloesen(u) {
      const l = lauf;
      knoepfeAus();
      urteilen(ergebnis('falsch', { versuche, fehler, eingabe: eingabe(), urteil: u || null }));
      if (lauf !== l) return true;
      nachbau = true;
      hinweis.innerHTML = '';
      zeile.classList.remove('wackelt');
      vonSelbst();
      zeigen();
      melde('nachbau');
      // Nichts abzuschreiben (das gibt es im Wortschatz nicht): Dann hält auch nichts auf
      if (lauf === l && weit >= ziel.length) fertigMelden();
      return true;
    }
    // «So fängt es an, und so lang ist es»: ein grauer Platz je Buchstabe. Der erste steht da,
    // und hinter einem Artikel auch der erste des Worts.
    function laengeZeigen(bezug) {
      // Die Spur gehört zu der Form, an der gemessen wurde: «la gymnastik» zeigt «la gymnastique», nicht «la gym».
      // Sonst stünden die markierten Stellen hinter dem Ende der Spur. Wer ihr folgt, schreibt eine Form, die gilt.
      const form = bezug ? [...bezug] : ziel;
      const kernAb = form.length - [...lernen().zerlegen(form.join(''), e).kern].length;
      let wort = 0, vorn = false, imKern = false;
      const plaetze = form.map((ch, i) => {
        const p = /\p{L}/u.test(ch) ? { art: 'buchstabe', wort, zeigt: !vorn || (i >= kernAb && !imKern) ? ch : '' } : { art: 'fest', text: ch, wort };
        if (p.art === 'buchstabe') {
          vorn = true;
          imKern = imKern || i >= kernAb;
        }
        if (ch === ' ') wort++;
        return p;
      });
      hinweis.innerHTML = plaetzeHTML(plaetze, { reihe: 'buchstaben', klasse: 'muster' });
      const box = hinweis.firstChild;
      box.dataset.max = 34;
      for (const x of offenePlaetze(plaetze, box)) x.el.textContent = x.p.zeigt;
      platzMass(box);
    }
    function pruefen() {
      const ein = eingabe();
      if (!offenIst() || !pruefbar()) return false;
      const u = lernen().urteil(ein, e, a.teil, { form: a.form, vorgabe: diktat ? 'ton' : 'de' });
      if (u.ganz === 'gleiche_form') {
        // Die Form, die oben steht: kein Versuch. Die Zeile wird leer, das Hörnchen fragt nach der anderen.
        text = [];
        ort = 0;
        zeigen();
        melde('versuch', u);
        return true;
      }
      versuche++;
      if (u.richtig) {
        // Grossbuchstaben gibt es auf der Tastatur nicht: Stimmt alles, steht «ACM» da wie im Buch
        text = ein.toLowerCase() === ziel.join('').toLowerCase() ? ziel.map(ch => ({ ch, falsch: false })) : text.map(z => ({ ch: z.ch, falsch: false }));
        zeileZu();
        knoepfeAus();
        hinweis.innerHTML = '';
        const l = lauf;
        abschliessen(ergebnis(versuche === 1 ? 'richtig' : 'fast', { versuche, fehler, eingabe: ein, urteil: u }));
        if (lauf === l) {
          zeigen();
          bewege(zeile, 'pop');
        }
        return true;
      }
      if (versuche > 1) return aufloesen(u);
      // Erster Versuch daneben: Die falschen Stellen sind markiert, die Schreibmarke steht hinter der
      // ersten (ganz vorn, wenn der Artikel fehlt). So ist ein Vertipper mit zwei Tasten behoben.
      fehler = (u.fehler || []).slice();
      verpasst = ein;
      text.forEach((z, i) => {
        z.falsch = u.stellen.includes(i);
      });
      ort = u.artikel === 'fehlt' ? 0 : u.stellen.length ? Math.min(text.length, u.stellen[0] + 1) : text.length;
      if (!u.ganz && (u.artikel === 'anders' || u.kern === 'anders')) laengeZeigen(u.bezug);
      zeigen();
      bewege(zeile, 'wackelt');
      melde('versuch', u);
      return true;
    }
    function weissNicht() {
      return offenIst() ? aufloesen(null) : false;
    }

    function taste(ev, z) {
      // Wer eine Tastatur hat, sieht jetzt die Ziffern an den Akzent-Tasten
      feld.classList.add('ziffern');
      const k = ev.key;
      if (k === 'Backspace') {
        loesche();
        return true;
      }
      if (k === 'ArrowLeft' || k === 'ArrowRight') {
        gehe(k === 'ArrowLeft' ? -1 : 1);
        return true;
      }
      // «?» steht im Buch («qui?»), getippt werden muss es nicht: Lernen.norm übergeht es, und beim
      // Nachbauen setzt es sich von selbst. Wer schon schreibt oder ein Wort mit «?» vor sich hat,
      // tippt es mit, und es fällt weg. «Weiss ich nicht» heisst es nur auf der leeren Zeile.
      if (k === '?' && (nachbau || text.length || ziel.includes('?'))) return true;
      return tippbar.has(z) ? tippe(z) : false;
    }
    tippHoerer(feld, '.fr-taste', b => {
      const k = b.dataset.k;
      if (k === 'back') loesche();
      else if (k === 'ok') pruefen();
      else tippe(k === 'leer' ? ' ' : k);
    });
    // Ein Tipp in die Zeile setzt die Schreibmarke wie in jedem Textfeld an die Grenze, die dem Finger
    // am nächsten liegt: vor das Zeichen, wenn seine linke Hälfte getroffen ist, sonst dahinter;
    // rechts vom Text ans Ende der Zeile.
    hoere(zeile, 'click', ev => {
      if (!offenIst()) return;
      const spans = [...zeile.querySelectorAll('span[data-i]')].map(el => ({ i: +el.dataset.i, r: el.getBoundingClientRect() }));
      const inZeile = spans.filter(s => ev.clientY >= s.r.top && ev.clientY < s.r.bottom);
      const davor = inZeile.find(s => ev.clientX < s.r.left + s.r.width / 2);
      const t = ev.target.closest('span[data-i]');
      ort = davor ? davor.i : inZeile.length ? inZeile[inZeile.length - 1].i + 1 : t ? +t.dataset.i : text.length;
      zeigen();
    });
    zeigen();
    melde('weissNicht', true);
    return { pruefen, weissNicht, taste };
  }

  /* ---------- Schnittstelle ---------- */

  // uebung → Aufbau. Ein Aufbau zeichnet mit vorgabeBauen(), plaetzeHTML(), ablageHTML() und
  // feldArt(), hängt seine Listener mit hoere() an (Uhren mit spaeter()) und meldet über
  // urteilen() und fertigMelden() oder beides zusammen mit abschliessen(). Zurück gibt er, was
  // die Tastatur und die festen Knöpfe mit der Aufgabe tun können: { taste(e), pruefen(), weissNicht(), … }
  const BAU = {
    kennen: kennenBauen, echo: echoBauen, paare: paareBauen, artikel: artikelBauen,
    bedeutung: wahlBauen, hoeren: wahlBauen, finden: wahlBauen, lauschen: wahlBauen, luecke: wahlBauen,
    akzent: akzentBauen, legen: kachelnBauen, ordnen: kachelnBauen, bauen: kachelnBauen, schreiben: schreibenBauen,
  };

  // Eine Übung, die es hier nicht gibt, hält die Runde nicht auf: zeigen, was gemeint war, und weiter
  function unbekanntBauen(a) {
    vorgabeBauen({ cap: 'Zum Anschauen', gross: esc(a.fr || ''), fr: true, klein: esc(a.de || ''), ton: 'normal' });
    feldArt('nur-weiter');
    const l = lauf;
    Promise.resolve().then(() => { if (lauf === l) abschliessen(ergebnis('ohne')); });
    return {};
  }

  // kurs: was der Kurs mitgibt (siehe FRANZ oben); ohne ihn Französisch
  function zeigen(aufgabe, host, kurs) {
    aufraeumen();
    const a = aufgabe || {}, k = kurs || FRANZ;
    lauf = { a, host: host || {}, kurs: k, tast: tastaturVon(k), ctl: {}, geurteilt: false, fertig: false, uhren: [], hoerer: [], spiel: () => false };
    $('frVorgabe').innerHTML = '';
    $('frAntwort').innerHTML = '';
    // Die neue Aufgabe fängt oben an, auch wenn die letzte bis zur Lösung gerollt war
    const karte = $('frKarte');
    if (karte) karte.scrollTop = 0;
    // Eine Übung, die der Kurs nicht hat, zeigt nur, was gemeint war
    const bau = k.uebungen && !k.uebungen.includes(a.uebung) ? unbekanntBauen : BAU[a.uebung] || unbekanntBauen;
    lauf.ctl = bau(a) || {};
    // Kein Knopf der Aufgabe behält den Fokus: Sonst löst die Leertaste nach einem Mausklick ihn noch einmal aus.
    // Das gilt, solange eine Aufgabe dasteht, für die ganze Eingabe, also auch für «Prüfen», «Weiss ich nicht»
    // und «Weiter»: Beim Schreiben ist die Leertaste ein Zeichen und darf nie «Prüfen» auslösen.
    for (const id of ['frVorgabe', 'frAntwort', 'frEingabe']) {
      hoere($(id), 'mousedown', e => { if (e.target.closest('button')) e.preventDefault(); });
    }
    hoere($('frVorgabe'), 'click', e => {
      const b = e.target.closest('button');
      if (b && b.id === 'frHoeren') lauf.spiel(false);
      else if (b && b.id === 'frLangsam') lauf.spiel(true);
    });
    hoere(window, 'resize', plaetzeEinpassen);
    plaetzeEinpassen();
  }

  // Physische Tastatur: true heisst verbraucht. Nach fertig() gehört jede Taste dem Gastgeber,
  // ausser die Aufgabe bleibt offen (kennen meldet fertig gleich nach dem Aufbau).
  // Zuerst ist die Übung dran (bei den Paaren ist der Pfeil nach unten der Ring, beim Schreiben die
  // Leertaste ein Zeichen), dann gilt für alle: Enter prüft, Tab spielt den Clip, Pfeil nach unten
  // den langsamen, das Fragezeichen heisst «Weiss ich nicht» (beim Legen und Schreiben nur, solange
  // noch nichts gelegt oder getippt ist und das Wort selbst kein «?» hat: Dort nehmen sie es vorher weg).
  function taste(e) {
    if (!lauf || !e || (lauf.fertig && !lauf.ctl.offen)) return false;
    // Cmd+R, Ctrl+L … bleiben beim Browser. AltGr kommt als Ctrl+Alt und geht durch: So entstehen œ und ç.
    if (e.metaKey || (e.ctrlKey && !e.altKey)) return false;
    const k = e.key, ctl = lauf.ctl;
    if (k === 'Enter' || k === ' ') {
      // Hat ein Knopf den Fokus, löst ihn der Browser aus
      const f = document.activeElement;
      if (f && f.tagName === 'BUTTON') return false;
      // Eine gehaltene Taste prüft nicht zweimal und legt keine Reihe von Kacheln
      if (e.repeat) return true;
    }
    if (typeof ctl.taste === 'function' && ctl.taste(e, zeichenVon(e, lauf.tast)) === true) return true;
    if (k === 'Enter') return typeof ctl.pruefen === 'function' && ctl.pruefen() === true;
    if (k === 'Tab') {
      // Auch ohne Clip verbraucht: Sonst wandert der Fokus auf einen Knopf, und die Leertaste gehört ihm
      lauf.spiel(false);
      return true;
    }
    if (k === 'ArrowDown') return lauf.spiel(true);
    if (k === '?') return typeof ctl.weissNicht === 'function' && ctl.weissNicht() === true;
    return false;
  }
  // «Prüfen» und «Weiss ich nicht» gehören dem Gastgeber; getippt landen sie hier
  function pruefen() {
    if (lauf && typeof lauf.ctl.pruefen === 'function') lauf.ctl.pruefen();
  }
  function weissNicht() {
    if (lauf && typeof lauf.ctl.weissNicht === 'function') lauf.ctl.weissNicht();
  }
  // Nach der Antwort: Auf diese Option hat Pieks getippt
  function pieksTipp(i) {
    const b = $('frFeld').querySelector('.fr-option[data-i="' + (+i) + '"]');
    if (!b || b.classList.contains('pieks-tipp')) return;
    b.classList.add('pieks-tipp');
    b.insertAdjacentHTML('beforeend', '<span class="fr-pieks-kopf" aria-hidden="true">' + zeichen('i-pieks-kopf', 24) + '</span>');
  }

  return { zeigen, taste, pruefen, weissNicht, pieksTipp, aufraeumen, leeren, frHTML, schildHTML, stufeHTML, FRANZ };
})();
