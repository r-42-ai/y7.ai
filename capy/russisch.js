'use strict';

/* =====================================================================
   RUSSISCH-ECKE
   Capys Freundin, ein Lama aus Russland, bringt Yuna Russisch bei.
   Inhalte und alles, was das Lama sagt: russisch-texte.js.
   Hier: das Lama auf Capys Wiese, seine Ankunft mit der Namenswahl, die
   Ecke mit Karte, Runden, Alphabet und Wörtern, und der Lernstand.

   Läuft nach dem Hauptskript in index.html und nutzt dessen Stimme, Ton,
   stand, speichern() … Fehlt diese Datei, läuft Capy wie immer.

   Eine Runde (5 bis 7 Minuten) gehört zu einer Station: neue Buchstaben,
   dann Wörter, die sich damit lesen lassen, Zauberwörter, ein Satz, zwei
   Wiederholungen und zum Schluss Paare. Was daneben geht, kommt in
   derselben Runde nochmal. Jede Antwort wird sofort gespeichert.
   ===================================================================== */
(() => {
  if (typeof LAMA === 'undefined' || typeof Stimme === 'undefined') return;

  /* ---------- Lernstand ----------
     da: das Lama ist bei Capy angekommen
     stationen: Nummer → { sterne } der geschafften Stationen
     items: 'b:М', 'w:мама', 's:Это мама.', 'z:Привет!' → { k: Stärke 0–5, n: so oft gesehen, z: Tag }
     heute: Tag der letzten Runde · runden: alle Runden zusammen          */
  const SPEICHER = 'y7.capy.russisch';
  const tagHeute = () => { const d = new Date(); return Math.floor((d - d.getTimezoneOffset() * 6e4) / 864e5); };
  const ru = (() => {
    const s = { da: false, stationen: {}, items: {}, heute: 0, runden: 0 };
    try {
      const raw = JSON.parse(localStorage.getItem(SPEICHER) || 'null');
      if (raw && typeof raw === 'object') {
        s.da = raw.da === true;
        if (raw.stationen && typeof raw.stationen === 'object') {
          for (const [k, v] of Object.entries(raw.stationen)) {
            if (STATIONEN.some(x => x.nr === +k) && v && [1, 2, 3].includes(v.sterne)) s.stationen[+k] = { sterne: v.sterne };
          }
        }
        if (raw.items && typeof raw.items === 'object') {
          for (const [k, v] of Object.entries(raw.items)) {
            if (/^[bwsz]:/.test(k) && v && Number.isInteger(v.k)) {
              s.items[k] = { k: clamp(v.k, 0, 5), n: Number.isInteger(v.n) && v.n > 0 ? v.n : 1, z: Number.isInteger(v.z) ? v.z : 0 };
            }
          }
        }
        if (Number.isInteger(raw.heute)) s.heute = raw.heute;
        if (Number.isInteger(raw.runden) && raw.runden >= 0) s.runden = raw.runden;
      }
    } catch (e) { /* privater Modus o.ä. */ }
    return s;
  })();
  const sichern = () => { try { localStorage.setItem(SPEICHER, JSON.stringify(ru)); } catch (e) { /* privater Modus o.ä. */ } };

  const gesehen = k => !!(ru.items[k] && ru.items[k].n > 0);
  const staerke = k => (ru.items[k] ? ru.items[k].k : 0);
  // ergebnis: true = gleich richtig, false = daneben, null = nur angeschaut
  function merken(k, ergebnis) {
    const it = ru.items[k] || (ru.items[k] = { k: 0, n: 0, z: 0 });
    it.n++;
    it.z = tagHeute();
    if (ergebnis === true) it.k = Math.min(5, it.k + 1);
    else if (ergebnis === false) it.k = Math.max(0, it.k - 1);
    sichern();
  }
  const geschafft = nr => !!ru.stationen[nr];
  const offen = nr => nr === 1 || geschafft(nr) || geschafft(nr - 1);
  const aktuelle = () => STATIONEN.find(s => !geschafft(s.nr)) || null;

  /* ---------- Bausteine ---------- */
  const KEY = { b: x => 'b:' + x.b, w: x => 'w:' + x.ru, s: x => 's:' + x.ru, z: x => 'z:' + x.ru };
  const LERNWOERTER = WOERTER.filter(w => !w.merk);
  const WORT = new Map(WOERTER.map(w => [w.ru, w]));
  const GROSS = s => s.toLocaleUpperCase('ru');
  const tonAn = () => stand.stimme && !!audio();
  const legbar = w => [...w.ru].length <= 7 && /^[а-яё]+$/i.test(w.ru);
  const satzWoerter = s => s.ru.replace(/[.!?,]/g, '').split(/\s+/).filter(Boolean);

  // Was das Lama sagt: aus jeder Liste zufällig, ohne gleich zu wiederholen
  const beutel = {};
  function ziehL(name) {
    const pool = LAMA_TEXTE[name];
    if (!beutel[name] || !beutel[name].length) beutel[name] = shuffle(pool.slice());
    return beutel[name].pop();
  }

  /* ---------- Zeichnungen ---------- */
  function lamaSvg(klasse, ausschnitt = '0 0 120 150') {
    return `<svg class="lama ${klasse || ''}" viewBox="${ausschnitt}" aria-hidden="true">
      <g class="lama-beine">
        <rect x="35" y="120" width="10" height="26" rx="5" fill="#EBDCC4"/><rect x="49" y="122" width="10" height="24" rx="5" fill="#E2D0B4"/>
        <rect x="61" y="122" width="10" height="24" rx="5" fill="#E2D0B4"/><rect x="75" y="120" width="10" height="26" rx="5" fill="#EBDCC4"/>
        <g fill="#6B4E3A"><rect x="35" y="141" width="10" height="6" rx="3"/><rect x="49" y="141" width="10" height="6" rx="3"/><rect x="61" y="141" width="10" height="6" rx="3"/><rect x="75" y="141" width="10" height="6" rx="3"/></g>
      </g>
      <g fill="#FBF1E2"><circle cx="40" cy="116" r="16"/><circle cx="60" cy="110" r="20"/><circle cx="80" cy="116" r="16"/><circle cx="48" cy="126" r="13"/><circle cx="72" cy="126" r="13"/><circle cx="60" cy="124" r="15"/></g>
      <rect x="47" y="76" width="26" height="44" rx="13" fill="#FBF1E2"/>
      <g class="schal">
        <path d="M45 93 Q60 101 75 93 L76 104 Q60 112 44 104 Z" fill="#E0564A"/>
        <path d="M63 104 L69 125 Q64 127 59 124 L57 105 Z" fill="#D6463A"/>
        <path d="M49 97 Q60 102.5 71 97" stroke="#fff" stroke-width="2.2" fill="none" stroke-linecap="round" opacity=".85"/>
        <path d="M59.5 117 L68 115" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".85"/>
        <path d="M59.5 124.5 l-1 4 M62.5 125.5 l0 4 M65.5 125.5 l1 4 M68.5 124.5 l1.5 3.5" stroke="#D6463A" stroke-width="1.6" stroke-linecap="round"/>
      </g>
      <g class="lama-kopf">
        <g class="ohr l"><path d="M44 42 C36 30 32 14 37 4 C45 10 50 25 51 39 Z" fill="#F4E6D0"/><path d="M45 37 C40 28 38 17 39 10 C44 16 47 26 48 35 Z" fill="#F6BFC4"/></g>
        <g class="ohr r"><path d="M76 42 C84 30 88 14 83 4 C75 10 70 25 69 39 Z" fill="#F4E6D0"/><path d="M75 37 C80 28 82 17 81 10 C76 16 73 26 72 35 Z" fill="#F6BFC4"/></g>
        <path d="M60 30 C79 30 88 42 88 58 C88 76 76 90 60 90 C44 90 32 76 32 58 C32 42 41 30 60 30 Z" fill="#FBF1E2"/>
        <g fill="#FFFBF4"><circle cx="49" cy="33" r="8.5"/><circle cx="60" cy="28" r="10"/><circle cx="71" cy="33" r="8.5"/><circle cx="54.5" cy="37" r="7"/><circle cx="65.5" cy="37" r="7"/></g>
        <g class="augen">
          <ellipse cx="48" cy="58" rx="4.4" ry="5.4" fill="#2B1A10"/><ellipse cx="72" cy="58" rx="4.4" ry="5.4" fill="#2B1A10"/>
          <circle cx="49.6" cy="56" r="1.6" fill="#fff"/><circle cx="73.6" cy="56" r="1.6" fill="#fff"/>
          <path d="M44 54.5 L41 52.5 M44.8 53 L42.6 50.4 M76 54.5 L79 52.5 M75.2 53 L77.4 50.4" stroke="#2B1A10" stroke-width="1.4" stroke-linecap="round"/>
        </g>
        <g class="augen-froh" fill="none" stroke="#2B1A10" stroke-width="3" stroke-linecap="round"><path d="M43 59 Q48 53 53 59"/><path d="M67 59 Q72 53 77 59"/></g>
        <ellipse cx="60" cy="75" rx="13.5" ry="10" fill="#F2E3CC"/>
        <g fill="#8A6A52"><ellipse cx="55.5" cy="71" rx="1.7" ry="1.2"/><ellipse cx="64.5" cy="71" rx="1.7" ry="1.2"/></g>
        <path class="mund-zu" d="M54.5 78 Q60 83 65.5 78" stroke="#6B4E3A" stroke-width="1.9" fill="none" stroke-linecap="round"/>
        <ellipse class="mund-auf" cx="60" cy="80" rx="3.8" ry="3.2" fill="#9C4A44"/>
        <g fill="#F59E95" opacity=".55"><ellipse cx="39.5" cy="71" rx="5.5" ry="3.4"/><ellipse cx="80.5" cy="71" rx="5.5" ry="3.4"/></g>
      </g>
    </svg>`;
  }
  // Matrjoschka einer Station; die Farbe kommt aus --m
  const MATRJOSCHKA = `<svg class="matr-bild" viewBox="0 0 64 84" aria-hidden="true">
      <path d="M32 5 C43 5 49 13 48.5 23 C55 29 58 41 58 55 C58 72 47 81 32 81 C17 81 6 72 6 55 C6 41 9 29 15.5 23 C15 13 21 5 32 5 Z" fill="var(--m)"/>
      <path d="M12 44 C18 50 24 52 32 52 C40 52 46 50 52 44" stroke="#fff" stroke-width="2" fill="none" opacity=".35"/>
      <circle cx="32" cy="23" r="12.5" fill="#FFE9D6"/>
      <path d="M20 21 C21.5 14 26.5 11 32 11 C37.5 11 42.5 14 44 21 C40 17.5 36 16.5 32 18.5 C28 16.5 24 17.5 20 21 Z" fill="#8A5A2B"/>
      <circle cx="27.8" cy="24.5" r="1.5" fill="#2B1A10"/><circle cx="36.2" cy="24.5" r="1.5" fill="#2B1A10"/>
      <circle cx="25" cy="28" r="2.3" fill="#F59E95" opacity=".7"/><circle cx="39" cy="28" r="2.3" fill="#F59E95" opacity=".7"/>
      <path d="M29.5 29.6 Q32 31.4 34.5 29.6" stroke="#9C4A44" stroke-width="1.3" fill="none" stroke-linecap="round"/>
      <ellipse cx="32" cy="60" rx="17.5" ry="17" fill="#FFFBF0"/>
      <g fill="#FFD43B"><circle cx="18.5" cy="12" r="2.2"/><circle cx="45.5" cy="12" r="2.2"/></g>
    </svg>`;
  const ICON = {
    haus: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 11.5 L12 4.5 L20 11.5 V19.5 A1.5 1.5 0 0 1 18.5 21 H14.5 V15 H9.5 V21 H5.5 A1.5 1.5 0 0 1 4 19.5 Z" fill="currentColor"/></svg>',
    ton: '<svg viewBox="0 0 24 24" aria-hidden="true"><use href="#i-ton"/></svg>',
    weiter: '<svg viewBox="0 0 32 32" aria-hidden="true"><use href="#i-weiter"/></svg>',
    zu: '<svg viewBox="0 0 24 24" aria-hidden="true"><use href="#i-zu"/></svg>',
    mandarine: '<svg viewBox="0 0 40 40" aria-hidden="true"><use href="#mandarine"/></svg>',
    mikro: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8.5" y="3" width="7" height="12" rx="3.5" fill="currentColor"/><path d="M5.5 11 A6.5 6.5 0 0 0 18.5 11 M12 17.5 V21" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/></svg>',
  };
  const ART = { freund: 'Wie bei uns', schwindler: 'Schwindler', neu: 'Neu' };
  // Die Buchstaben einer Station auf dem weissen Bauch der Matrjoschka:
  // zwei in einer Reihe, drei als 2 + 1, fünf als 3 + 2, damit alle im Kreis bleiben
  function matrjoschka(st) {
    const b = st.b, reihen = b.length <= 2 ? [b] : b.length === 3 ? [b.slice(0, 2), b.slice(2)] : [b.slice(0, 3), b.slice(3)];
    return `<span class="matr-koerper">${MATRJOSCHKA}<span class="matr-b n${b.length}" lang="ru">` +
      reihen.map(r => `<span>${r.join(' ')}</span>`).join('') + '</span></span>';
  }

  /* ---------- Sprechen ----------
     Zeigt etwas in der Blase des gerade sichtbaren Lamas und spricht es.
     Alle Aufnahmen gehen über Capys Stimme (index.html), als Zwischenruf. */
  let sprichNr = 0, letzteTeile = [];
  let buehne = { lama: null, sagt: null };    // wer gerade spricht und wo der Text steht
  const ruHtml = st => st.map(x => (x.ru
    ? `<span class="ru-t" lang="ru">${esc(x.t)}</span>` + (RU_DE[x.t] ? ` <small class="ru-ue">${esc(RU_DE[x.t])}</small>` : '')
    : esc(x.t))).join(' ');
  const teile = zeile => mitName(zeile, LAMA.name);
  function sprich(html, aufnahmen) {
    const nr = ++sprichNr, lama = buehne.lama;
    if (html !== null && buehne.sagt) {
      buehne.sagt.innerHTML = html;
      const blase = buehne.sagt.parentElement;
      blase.classList.remove('pop');
      void blase.offsetWidth;
      blase.classList.add('pop');
    }
    letzteTeile = aufnahmen;
    if (lama) lama.classList.add('spricht');
    return Stimme.einwurf(aufnahmen).then(ok => {
      if (nr === sprichNr && lama) lama.classList.remove('spricht');
      return ok;
    });
  }
  // Eine Zeile des Lamas, davor und danach können russische Wörter kommen
  function sagL(zeile, { vor = [], nach = [], html } = {}) {
    const st = zeile ? teile(zeile) : [];
    const anzeige = html !== undefined ? html : ruHtml(st);
    return sprich(anzeige, vor.concat(st.map(x => lamaAufnahme(x)), nach));
  }
  const nurRu = (ru, langsam) => Stimme.einwurf([lamaWort(ru, langsam)]);
  // Text in die Blase, ohne zu sprechen
  function zeigeText(html) {
    if (!buehne.sagt) return;
    buehne.sagt.innerHTML = html;
  }
  // Wurde diese Anweisung in der Runde schon gesprochen? Beim ersten Mal ja, danach
  // steht sie nur noch in der Blase, und das Lama sagt bloss das Wort.
  function ersteMal(art) {
    if (!R || !R.angesagt) return true;
    const neu = !R.angesagt.has(art);
    R.angesagt.add(art);
    return neu;
  }
  function freuen(lama, ms = 1100) {
    if (!lama) return;
    lama.classList.remove('oops');
    lama.classList.add('froh');
    setTimeout(() => lama.classList.remove('froh'), ms);
  }
  function oops(lama) {
    if (!lama) return;
    lama.classList.remove('oops', 'froh');
    void lama.getBoundingClientRect();
    lama.classList.add('oops');
    setTimeout(() => lama.classList.remove('oops'), 800);
  }

  /* =====================================================================
     DAS LAMA BEI CAPY: steht auf der Wiese, jubelt manchmal mit, und ein
     Tipp auf es öffnet die Russisch-Ecke.
     ===================================================================== */
  const platz = $('lamaPlatz');
  platz.innerHTML = lamaSvg('lama-wiese') + '<div class="lama-sprech" hidden><span></span></div>';
  const wieseLama = platz.querySelector('.lama');
  const wieseSprech = platz.querySelector('.lama-sprech');
  const kopfKnopf = $('ruKnopf');
  kopfKnopf.innerHTML = lamaSvg('lama-knopf', '28 0 64 94');   // nur der Kopf

  function zeigeLamaBeiCapy(neu) {
    platz.hidden = !ru.da;
    kopfKnopf.hidden = !ru.da;
    const n = LAMA.name;
    {
      platz.setAttribute('aria-label', n.de + ': Russisch lernen');
      kopfKnopf.setAttribute('aria-label', 'Russisch mit ' + n.de);
      $('losRu').innerHTML = `Russisch mit ${esc(n.de)} ` + '<span lang="ru">' + esc(n.ru) + '</span>';
    }
    $('losRu').hidden = !ru.da;
    if (neu && !reduce) {
      platz.classList.remove('kommt');
      void platz.offsetWidth;
      platz.classList.add('kommt');
    }
  }
  platz.addEventListener('click', () => {
    if (!ru.da) return;
    Ton.piep();
    freuen(wieseLama, 700);
    audio();
    eckeAuf();
  });
  // Auch mit der Tastatur (Enter, Leertaste) wie ein Knopf
  const wieKnopf = el => el.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); el.click(); }
  });
  wieKnopf(platz);
  kopfKnopf.addEventListener('click', () => { audio(); eckeAuf(); });
  $('losRu').addEventListener('click', () => {
    karte(null);                  // die Begrüssungskarte (index.html) schliessen
    audio();
    Besuch.start();
    eckeAuf();
  });

  // Nach einer fertigen Pyramide: Manchmal jubelt das Lama auf Russisch mit.
  // Erfüllt sich mit false, wenn etwas anderes dazwischenkam (wie meldung()).
  let capyTippGesagt = false;
  function jubeln() {
    if (!ru.da || !$('ru').hidden) return Promise.resolve(true);
    // Einmal pro Besuch erinnert Capy daran, wenn heute noch kein Russisch dran war
    if (!capyTippGesagt && ru.heute !== tagHeute() && stand.solved % 4 === 0) {
      capyTippGesagt = true;
      return sag(zieh('tipp_lama'));
    }
    if (Math.random() > 0.35) return Promise.resolve(true);
    const st = teile(ziehL('jubel'));
    wieseSprech.querySelector('span').innerHTML = ruHtml(st);
    wieseSprech.hidden = false;
    freuen(wieseLama, 1400);
    // Nur zurückstellen, wenn inzwischen niemand die Bühne gewechselt hat: Ging die Russisch-Ecke
    // dazwischen auf, gehört die Bühne dem Lama dort (sonst bliebe seine Blase stehen)
    const alt = buehne, meine = { lama: wieseLama, sagt: null };
    buehne = meine;
    return sprich(null, st.map(x => lamaAufnahme(x))).then(ok => {
      if (buehne === meine) buehne = alt;
      setTimeout(() => { wieseSprech.hidden = true; }, 600);
      return ok;
    });
  }
  // Capys Satz dazu kommt aus russisch-texte.js; zieh() braucht ihn in TEXTE
  TEXTE.tipp_lama = CAPY_LAMA.tipp;

  /* =====================================================================
     ANKUNFT: Beim ersten Mal kommt das Lama zu Capy und stellt sich vor.
     ===================================================================== */
  const ankunftEl = document.createElement('div');
  ankunftEl.className = 'overlay';
  ankunftEl.id = 'lamaKarte';
  ankunftEl.hidden = true;
  ankunftEl.innerHTML = `
    <div class="card lama-ankunft" role="dialog" aria-modal="true" aria-labelledby="lamaTitel">
      <div class="lama-gross">${lamaSvg('lama-karte')}</div>
      <h1 id="lamaTitel" lang="ru">Привет!</h1>
      <p class="lama-text"><span id="lamaText" aria-live="polite"></span></p>
      <div class="lama-knoepfe" id="lamaKnoepfe" hidden>
        <button class="go" id="lamaLos" type="button">Russisch lernen!</button>
        <button class="lama-spaeter" id="lamaSpaeter" type="button">Später</button>
      </div>
    </div>`;
  document.body.appendChild(ankunftEl);
  const karteLama = ankunftEl.querySelector('.lama');

  const faellig = () => !ru.da && stand.intro && stand.solved >= 3 && $('intro').hidden;
  function ankunftPruefen(ms) {
    if (faellig()) setTimeout(() => { if (faellig() && ankunftEl.hidden) ankunft(); }, ms);
  }
  $('los').addEventListener('click', () => ankunftPruefen(350));
  $('go').addEventListener('click', () => ankunftPruefen(350));
  $('next').addEventListener('click', () => ankunftPruefen(700));

  // Sagt den eigenen Namen auf Russisch und auf Deutsch
  function namenSagen() {
    const st = stuecke(LAMA.name.satz);
    return sprich(`<span class="ru-t" lang="ru">${esc(ichHeisse())}</span> ${ruHtml(st)}`,
      [lamaWort(ichHeisse())].concat(st.map(x => lamaAufnahme(x))));
  }
  async function ankunft() {
    ankunftEl.hidden = false;
    $('lamaTitel').textContent = 'Привет!';
    $('lamaKnoepfe').hidden = true;
    buehne = { lama: karteLama, sagt: $('lamaText') };
    // Capy spricht mit Capys Stimme
    const capySatz = CAPY_LAMA.kommt[0];
    $('lamaText').textContent = anzeigetext(capySatz);
    if (!(await Stimme.einwurf([sprechtext(capySatz)])) || ankunftEl.hidden) return;
    if (!(await sagL(LAMA_TEXTE.ankunft[0])) || ankunftEl.hidden) return;
    // Ab jetzt ist das Lama da, auch wenn die Karte zugeht
    ru.da = true;
    sichern();
    $('lamaTitel').textContent = LAMA.name.ru;
    Ton.freund();
    freuen(karteLama, 1600);
    zeigeLamaBeiCapy(true);
    if (!(await namenSagen()) || ankunftEl.hidden) return;
    const schoen = CAPY_LAMA.schoener_name[0];
    $('lamaText').textContent = anzeigetext(schoen);
    if (!(await Stimme.einwurf([sprechtext(schoen)])) || ankunftEl.hidden) return;
    $('lamaKnoepfe').hidden = false;
    await sagL(LAMA_TEXTE.lernen[0]);
  }
  $('lamaLos').addEventListener('click', () => { ankunftEl.hidden = true; eckeAuf(); });
  $('lamaSpaeter').addEventListener('click', () => {
    ankunftEl.hidden = true;
    buehne = { lama: wieseLama, sagt: null };
    sagL(LAMA_TEXTE.spaeter[0]);
  });

  /* =====================================================================
     DIE RUSSISCH-ECKE
     Ansichten: Karte (Stationen als Matrjoschkas), Runde, Alphabet, Wörter
     ===================================================================== */
  const ecke = document.createElement('section');
  ecke.className = 'ru';
  ecke.id = 'ru';
  ecke.hidden = true;
  ecke.setAttribute('aria-label', 'Russisch');
  ecke.innerHTML = `
    <div class="ru-szene" aria-hidden="true">
      <svg class="ru-birke b1" viewBox="0 0 60 200" preserveAspectRatio="xMidYMax meet">
        <rect x="24" y="40" width="12" height="160" rx="5" fill="#FBFBF5"/>
        <g fill="#3B3B3B"><rect x="24" y="70" width="6" height="2.5" rx="1"/><rect x="30" y="98" width="6" height="2.5" rx="1"/><rect x="24" y="130" width="7" height="2.5" rx="1"/><rect x="29" y="160" width="7" height="2.5" rx="1"/><rect x="24" y="186" width="5" height="2.5" rx="1"/></g>
        <g fill="var(--birke, #8CCB6A)"><ellipse cx="30" cy="38" rx="26" ry="36"/><ellipse cx="14" cy="64" rx="13" ry="20"/><ellipse cx="46" cy="64" rx="13" ry="20"/></g>
      </svg>
      <svg class="ru-birke b2" viewBox="0 0 60 200" preserveAspectRatio="xMidYMax meet">
        <rect x="24" y="40" width="12" height="160" rx="5" fill="#FBFBF5"/>
        <g fill="#3B3B3B"><rect x="30" y="76" width="6" height="2.5" rx="1"/><rect x="24" y="110" width="6" height="2.5" rx="1"/><rect x="30" y="146" width="6" height="2.5" rx="1"/><rect x="24" y="176" width="7" height="2.5" rx="1"/></g>
        <g fill="var(--birke, #8CCB6A)"><ellipse cx="30" cy="38" rx="26" ry="36"/><ellipse cx="14" cy="64" rx="13" ry="20"/><ellipse cx="46" cy="64" rx="13" ry="20"/></g>
      </svg>
    </div>
    <header class="ru-bar">
      <button class="round pill" id="ruZu" type="button" aria-label="Zurück zu Capy">${ICON.haus}</button>
      <button class="ru-name pill" id="ruName" type="button"></button>
      <div class="count pill ru-m" aria-label="Mandarinen">${ICON.mandarine}<span id="ruM">0</span></div>
      <button class="round pill" id="ruTon" type="button" aria-label="Ton"></button>
    </header>
    <div class="ru-haupt">
      <div class="ru-lama">
        ${lamaSvg('lama-ecke')}
        <div class="ru-blase" id="ruBlase" role="button" tabindex="0" aria-label="Nochmal hören"><span id="ruSagt" aria-live="polite"></span></div>
      </div>
      <div class="ru-inhalt" id="ruInhalt"></div>
    </div>`;
  document.body.appendChild(ecke);
  const eckeLama = ecke.querySelector('.lama-ecke');
  const inhalt = $('ruInhalt');

  function eckeTitel() {
    const n = LAMA.name;
    $('ruName').innerHTML = `Russisch mit <b>${esc(n.de)}</b> <span lang="ru">${esc(n.ru)}</span>`;
  }
  function tonKnopf() {
    $('ruTon').innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><use href="${stand.stimme ? '#i-ton' : '#i-stumm'}"/></svg>`;
    $('ruTon').setAttribute('aria-label', stand.stimme ? 'Ton ausschalten' : 'Ton einschalten');
  }
  const mandarinenZeigen = () => { $('ruM').textContent = stand.mandarinen; };

  function eckeAuf() {
    if (!ru.da) return;
    Stimme.stopp();
    ecke.hidden = false;
    document.body.classList.add('ru-offen');
    buehne = { lama: eckeLama, sagt: $('ruSagt') };
    eckeTitel();
    tonKnopf();
    mandarinenZeigen();
    R = null;
    zeigeKarte(true);
  }
  function eckeZu() {
    R = null;
    Stimme.stopp();
    ecke.hidden = true;
    document.body.classList.remove('ru-offen');
    buehne = { lama: wieseLama, sagt: null };
    zaehlen();
    wachHalten();
  }
  $('ruZu').addEventListener('click', eckeZu);
  // Tipp auf den Namen: das Lama sagt, wie es heisst
  $('ruName').addEventListener('click', () => { freuen(eckeLama); namenSagen(); });
  $('ruTon').addEventListener('click', () => {
    stand.stimme = !stand.stimme;
    speichern();
    tonZeigen();
    tonKnopf();
    if (stand.stimme) { audio(); sagL(LAMA_TEXTE.hallo[0]); } else Stimme.stopp();
  });
  $('ruBlase').addEventListener('click', () => { if (letzteTeile.length) Stimme.einwurf(letzteTeile); });
  wieKnopf($('ruBlase'));

  /* ---------- Karte ---------- */
  function zeigeKarte(gruessen) {
    R = null;
    const akt = aktuelle();
    inhalt.className = 'ru-inhalt ansicht-karte';
    inhalt.innerHTML = `
      <div class="matrjoschkas">${STATIONEN.map(s => {
        const zustand = geschafft(s.nr) ? 'fertig' : offen(s.nr) ? 'jetzt' : 'gesperrt';
        const sterne = geschafft(s.nr) ? ru.stationen[s.nr].sterne : 0;
        return `<button class="matr ${zustand}" type="button" data-st="${s.nr}" style="--m:${s.farbe}"
            aria-label="Station ${s.nr}: ${s.b.join(' ')}${zustand === 'gesperrt' ? ', kommt später' : ''}">
          ${matrjoschka(s)}
          <span class="matr-st">${zustand === 'gesperrt' ? '🔒' : '★★★'.slice(0, sterne) + '☆☆☆'.slice(0, 3 - sterne)}</span>
        </button>`;
      }).join('')}</div>
      <div class="ru-menue">
        <button class="go ru-los" type="button" id="ruWeiter">${akt ? 'Station ' + akt.nr : 'Wiederholen'} ${ICON.weiter}</button>
        <button class="ru-knopf gelb" type="button" id="ruWdh" ${Object.keys(ru.stationen).length ? '' : 'disabled'}>Wiederholen</button>
        <button class="ru-knopf blau" type="button" id="ruAbc"><span lang="ru">АБВ</span> Alphabet</button>
        <button class="ru-knopf lila" type="button" id="ruWoerter">Wörter</button>
      </div>`;
    if (!gruessen) return;
    if (!stand.stimme) { sagL(LAMA_TEXTE.ton_aus[0]); return; }
    if (!akt) sagL(LAMA_TEXTE.karte_fertig[0]);
    else if (akt.nr === 1 && !gesehen('b:А')) sagL(LAMA_TEXTE.karte_erste[0]);
    else sagL(ziehL('karte'));
  }
  inhalt.addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b || !inhalt.classList.contains('ansicht-karte')) return;
    if (b.dataset.st) {
      const nr = +b.dataset.st;
      if (!offen(nr)) { Ton.tipp(); oops(eckeLama); sagL(LAMA_TEXTE.gesperrt[0]); return; }
      starteStation(nr);
    } else if (b.id === 'ruWeiter') {
      const akt = aktuelle();
      if (akt) starteStation(akt.nr); else starteWdh();
    } else if (b.id === 'ruWdh') starteWdh();
    else if (b.id === 'ruAbc') zeigeAbc();
    else if (b.id === 'ruWoerter') zeigeWoerter();
  });

  /* ---------- Alphabet ---------- */
  function zeigeAbc() {
    R = null;
    inhalt.className = 'ru-inhalt ansicht-liste';
    inhalt.innerHTML = `
      <div class="ru-liste-kopf"><button class="ru-zurueck" type="button">${ICON.weiter} Karte</button>
        <span class="legende"><i class="art-freund">Wie bei uns</i><i class="art-schwindler">Schwindler</i><i class="art-neu">Neu</i></span></div>
      <div class="abc">${ALPHABET.map(x => {
        const b = buchstabe(x), da = gesehen('b:' + x) || geschafft(stationVon(x));
        return `<button class="abc-b ${da ? 'art-' + b.art : 'noch'}" type="button" data-b="${x}" lang="ru">${x}<small>${b.k}</small></button>`;
      }).join('')}</div>`;
    sagL(LAMA_TEXTE.abc[0]);
  }
  /* ---------- Wörter ---------- */
  let letzterTipp = { ru: '', zeit: 0 };
  function zeigeWoerter() {
    R = null;
    const woerter = LERNWOERTER.filter(w => gesehen('w:' + w.ru));
    const zauber = ZAUBERWOERTER.filter(z => gesehen('z:' + z.ru));
    inhalt.className = 'ru-inhalt ansicht-liste';
    inhalt.innerHTML = `
      <div class="ru-liste-kopf"><button class="ru-zurueck" type="button">${ICON.weiter} Karte</button>
        <span class="zahl-gelernt">${woerter.length} von ${LERNWOERTER.length} Wörtern</span></div>
      <div class="wortliste">${woerter.map(w => `<button class="wort-k" type="button" data-wort="${esc(w.ru)}">
        <span class="bild">${w.bild}</span><b lang="ru">${esc(GROSS(w.ru))}</b><small>${esc(w.de)}</small></button>`).join('')}</div>
      ${zauber.length ? `<h2>Zauberwörter</h2><div class="wortliste zauber">${zauber.map(z => `<button class="wort-k" type="button" data-wort="${esc(z.ru)}">
        <span class="bild">${z.zahl ? `<span class="ziffer">${z.zahl}</span>` : z.bild}</span><b lang="ru">${esc(z.ru)}</b><small>${esc(z.um)} · ${esc(z.de)}</small></button>`).join('')}</div>` : ''}`;
    sagL(woerter.length ? LAMA_TEXTE.woerter[0] : LAMA_TEXTE.woerter_leer[0]);
  }
  inhalt.addEventListener('click', e => {
    if (!inhalt.classList.contains('ansicht-liste')) return;
    const b = e.target.closest('button');
    if (!b) return;
    if (b.classList.contains('ru-zurueck')) { zeigeKarte(false); sagL(ziehL('karte')); return; }
    if (b.dataset.b) {
      const x = buchstabe(b.dataset.b);
      hops(b);
      const nach = x.wort ? [lamaWort(x.wort)] : [];
      // Buchstabenname, dann das Merkwort
      sprich(`<span class="ru-t ru-gross" lang="ru">${x.b}${x.k}</span>` + (x.wort ? ` ${WORT.get(x.wort).bild} <span class="ru-t" lang="ru">${esc(x.wort)}</span>` : ''),
        [buchstabenAufnahme(x)].concat(nach));
      return;
    }
    if (b.dataset.wort) {
      const jetzt = Date.now(), langsam = letzterTipp.ru === b.dataset.wort && jetzt - letzterTipp.zeit < 2500;
      letzterTipp = { ru: langsam ? '' : b.dataset.wort, zeit: jetzt };
      hops(b);
      const z = ZAUBERWOERTER.find(x => x.ru === b.dataset.wort);
      // Zahlwörter gibt es nur in einem Tempo
      nurRu(b.dataset.wort, langsam && !(z && z.zahl));
    }
  });
  function hops(el) {
    el.classList.remove('huepft');
    void el.offsetWidth;
    el.classList.add('huepft');
  }

  /* =====================================================================
     RUNDEN
     Eine Aufgabe ist { typ, art, x } mit art b(uchstabe) w(ort) s(atz)
     z(auberwort), x dem Eintrag aus russisch-texte.js.
     ===================================================================== */
  let R = null;

  // Eine Abfrage zu einem Eintrag; ohne Ton nur Aufgaben, die ohne Hören gehen
  function abfrage(art, x, nicht) {
    let typen;
    if (art === 'b') {
      typen = ['b-hoeren'];
      if (x.laut) typen.push('b-laut');
      if (x.wort) typen.push('b-bild');
    } else if (art === 'w') {
      typen = ['w-lesen', 'w-bild', 'w-hoeren'];
      if (legbar(x)) typen.push('w-legen');
    } else if (art === 's') {
      typen = ['s-lesen'];
      if (satzWoerter(x).length >= 2) typen.push('s-bauen');
    } else {
      typen = [x.zahl ? 'zahl-hoeren' : 'z-hoeren'];
    }
    if (!tonAn()) typen = typen.filter(t => t !== 'b-hoeren' && t !== 'w-hoeren');
    if (!typen.length) return null;
    const ohne = typen.filter(t => t !== nicht);
    return { typ: pick(ohne.length ? ohne : typen), art, x };
  }

  function planStation(nr) {
    const st = STATIONEN[nr - 1], plan = [{ typ: 'start', st }];
    // Neues kennenlernen, und gleich danach das vorherige abfragen
    const reihe = (art, liste, neuTyp, abfrageVon) => {
      liste.forEach((x, i) => {
        plan.push({ typ: neuTyp, art, x });
        if (i > 0) { const a = abfrageVon(liste[i - 1], i - 1); if (a) plan.push(a); }
      });
      if (liste.length) { const a = abfrageVon(liste[liste.length - 1], liste.length - 1); if (a) plan.push(a); }
    };
    reihe('b', st.b.map(buchstabe), 'b-neu', x => abfrage('b', x));
    // Wörter: die Abfragen wechseln reihum, damit es abwechslungsreich bleibt
    const typen = shuffle(['w-lesen', 'w-bild', 'w-legen', tonAn() ? 'w-hoeren' : 'w-lesen']);
    reihe('w', LERNWOERTER.filter(w => w.st === nr), 'w-neu', (w, i) => {
      let typ = typen[i % typen.length];
      if (typ === 'w-legen' && !legbar(w)) typ = 'w-bild';
      return { typ, art: 'w', x: w };
    });
    const zauber = ZAUBERWOERTER.filter(z => z.st === nr && !z.zahl);
    zauber.forEach(z => plan.push({ typ: 'z-neu', art: 'z', x: z }));
    if (zauber.length) plan.push(abfrage('z', pick(zauber)));
    const zahlen = ZAUBERWOERTER.filter(z => z.st === nr && z.zahl);
    if (zahlen.length) plan.push({ typ: 'zahlen-neu', art: 'z', liste: zahlen }, abfrage('z', pick(zahlen)));
    SAETZE.filter(s => s.st === nr).forEach(s => plan.push({ typ: 's-neu', art: 's', x: s }, abfrage('s', s)));
    // Zwei Wiederholungen aus früheren Stationen: das Schwächste zuerst
    wackliges(nr).slice(0, 2).forEach(k => { const a = abfrage(k.art, k.x); if (a) plan.push(a); });
    plan.push({ typ: 'paare' });
    return plan.filter(Boolean);
  }
  // Gelerntes aus früheren Stationen, das Schwächste und am längsten nicht Gesehene zuerst
  function wackliges(vorStation) {
    const heute = tagHeute(), liste = [];
    const dazu = (art, x, st) => {
      const k = KEY[art](x);
      if (!gesehen(k) || (vorStation && st >= vorStation)) return;
      const it = ru.items[k];
      liste.push({ art, x, wert: (5 - it.k) * 3 + Math.min(10, heute - it.z) + Math.random() * 3 });
    };
    BUCHSTABEN.forEach(b => dazu('b', b, stationVon(b.b)));
    LERNWOERTER.forEach(w => dazu('w', w, w.st));
    SAETZE.forEach(s => dazu('s', s, s.st));
    ZAUBERWOERTER.forEach(z => dazu('z', z, z.st));
    return liste.sort((a, b) => b.wert - a.wert);
  }
  function planWdh() {
    const liste = wackliges(0), plan = [];
    let buchstaben = 0;
    for (const k of liste) {
      if (plan.length >= 10) break;
      if (k.art === 'b' && ++buchstaben > 4) continue;
      const a = abfrage(k.art, k.x);
      if (a) plan.push(a);
    }
    plan.unshift({ typ: 'wdh-start' });
    plan.push({ typ: 'paare' });
    return plan;
  }

  function starteStation(nr) {
    audio();
    R = { art: 'station', nr, plan: planStation(nr), i: -1, fehler: 0, nochmal: new Map(), angesagt: new Set() };
    naechste();
  }
  function starteWdh() {
    if (!Object.keys(ru.stationen).length) return;
    audio();
    R = { art: 'wdh', plan: planWdh(), i: -1, fehler: 0, nochmal: new Map(), angesagt: new Set() };
    naechste();
  }

  // Grundgerüst einer Aufgabe: Fortschritt, Frage, Antworten
  function geruest(frage, antworten, klasse = '') {
    const zahl = R.plan.length, i = Math.max(0, R.i);
    inhalt.className = 'ru-inhalt ansicht-runde';
    inhalt.innerHTML = `
      <div class="ru-kopf">
        <button class="ru-x" type="button" aria-label="Runde beenden">${ICON.zu}</button>
        <div class="ru-fortschritt"><i style="width:${Math.round(i / zahl * 100)}%"></i></div>
      </div>
      <div class="ru-frage ${klasse}">${frage}</div>
      <div class="ru-antworten ${klasse}">${antworten}</div>`;
  }
  const weiterKnopf = (text = 'Weiter') => `<button class="go ru-weiter" type="button" data-weiter="1">${text} ${ICON.weiter}</button>`;
  const hoerKnopf = (klein) => `<button class="ru-hoer${klein ? ' klein' : ''}" type="button" data-hoer="1" aria-label="Nochmal hören">${ICON.ton}</button>`;

  function naechste() {
    if (!R) return;
    R.i++;
    R.gesperrt = false;
    R.fehlerHier = false;
    R.optionen = R.ziel = R.kacheln = null;   // nicht von der vorigen Aufgabe übernehmen
    if (R.i >= R.plan.length) { rundeEnde(); return; }
    const a = R.plan[R.i];
    R.a = a;
    ({
      start: zeigeStart, 'wdh-start': zeigeWdhStart,
      'b-neu': zeigeBNeu, 'w-neu': zeigeWNeu, 's-neu': zeigeSNeu, 'z-neu': zeigeZNeu, 'zahlen-neu': zeigeZahlenNeu,
      'b-hoeren': zeigeWahl, 'b-laut': zeigeWahl, 'b-bild': zeigeWahl, 'w-lesen': zeigeWahl, 'w-bild': zeigeWahl,
      'w-hoeren': zeigeWahl, 's-lesen': zeigeWahl, 'z-hoeren': zeigeWahl, 'zahl-hoeren': zeigeWahl,
      'w-legen': zeigeLegen, 's-bauen': zeigeLegen, paare: zeigePaare,
    })[a.typ](a);
  }

  /* ----- Start einer Runde ----- */
  function zeigeStart(a) {
    const st = a.st;
    geruest(`<div class="matr gross jetzt" style="--m:${st.farbe}">${matrjoschka(st)}</div>
      <p class="ru-titel">Station ${st.nr}</p>`, weiterKnopf('Los!'), 'start');
    R.hoeren = () => sagL(st.start);
    R.hoeren();
  }
  function zeigeWdhStart() {
    geruest(`<div class="ru-wdh-bild">🔁</div><p class="ru-titel">Wiederholen</p>`, weiterKnopf('Los!'), 'start');
    R.hoeren = () => sagL(ziehL('wdh_start'));
    R.hoeren();
  }

  /* ----- Kennenlernen ----- */
  function zeigeBNeu(a) {
    const b = a.x, w = b.wort && WORT.get(b.wort);
    const kennt = gesehen('b:' + b.b);   // bei einer Wiederholung der Station
    merken('b:' + b.b, null);
    geruest(`
      <span class="art-zeichen art-${b.art}">${ART[b.art]}</span>
      <button class="ru-b-gross art-${b.art}" type="button" data-sag="name" lang="ru">${b.b}<small>${b.k}</small></button>
      ${w ? `<button class="ru-merk" type="button" data-sag="wort"><span class="bild">${w.bild}</span><b lang="ru">${esc(GROSS(w.ru))}</b></button>` : ''}`,
    weiterKnopf(), 'neu');
    const erklaeren = () => sagL(b.text, { vor: [buchstabenAufnahme(b)], nach: w ? [lamaWort(w.ru)] : [] });
    R.hoeren = erklaeren;
    R.sag = { name: () => Stimme.einwurf([buchstabenAufnahme(b)]), wort: () => w && nurRu(w.ru) };
    // Schon bekannt: der Satz steht in der Blase, gesprochen werden nur Name und Merkwort
    if (kennt) sprich(ruHtml(teile(b.text)), [buchstabenAufnahme(b)].concat(w ? [lamaWort(w.ru)] : []));
    else erklaeren();
  }
  function zeigeWNeu(a) {
    const w = a.x;
    merken('w:' + w.ru, null);
    geruest(`
      <div class="ru-bild-gross">${w.bild}</div>
      <button class="ru-wort-gross" type="button" data-sag="wort" lang="ru">${esc(GROSS(w.ru))}</button>
      <p class="ru-de">${esc(w.de)}</p>`, weiterKnopf(), 'neu');
    const neu = ersteMal('wort_neu') ? teile(ziehL('wort_neu')) : [];
    R.hoeren = () => sagL(null, { html: ruHtml(neu) + ` <span class="ru-t" lang="ru">${esc(w.ru)}</span> – ${esc(wortSagt(w))}`,
      vor: neu.map(x => lamaAufnahme(x)).concat(lamaWort(w.ru)), nach: teile(wortSagt(w)).map(x => lamaAufnahme(x)) });
    R.sag = { wort: langsamWechsel(w.ru) };
    R.hoeren();
  }
  function zeigeSNeu(a) {
    const s = a.x;
    merken('s:' + s.ru, null);
    geruest(`
      <div class="ru-bild-gross">${s.bild}</div>
      <button class="ru-satz-gross" type="button" data-sag="satz" lang="ru">${esc(s.ru)}</button>
      <p class="ru-de">${esc(s.de)}</p>`, weiterKnopf(), 'neu');
    const neu = ersteMal('satz_neu') ? teile(ziehL('satz_neu')) : [];
    R.hoeren = () => sagL(null, { html: ruHtml(neu) + ` <span class="ru-t" lang="ru">${esc(s.ru)}</span> – ${esc(satzSagt(s))}`,
      vor: neu.map(x => lamaAufnahme(x)).concat(lamaWort(s.ru)), nach: teile(satzSagt(s)).map(x => lamaAufnahme(x)) });
    R.sag = { satz: langsamWechsel(s.ru) };
    R.hoeren();
  }
  // Zauberwort: hören, laut nachsagen, «Gesagt!» tippen
  function zeigeZNeu(a) {
    const z = a.x;
    merken('z:' + z.ru, null);
    geruest(`
      <div class="ru-bild-gross">${z.bild}</div>
      <button class="ru-satz-gross" type="button" data-sag="satz" lang="ru">${esc(z.ru)}</button>
      <p class="ru-um">${esc(z.um)}</p>
      <p class="ru-de">${esc(z.de)}</p>`,
    `<button class="go ru-weiter ru-gesagt" type="button" data-gesagt="1">${ICON.mikro} Gesagt!</button>`, 'neu');
    const neu = ersteMal('zauber_neu') ? teile(ziehL('zauber_neu')) : [];
    R.hoeren = () => sagL(null, { html: ruHtml(neu) + ` <span class="ru-t" lang="ru">${esc(z.ru)}</span> – ${esc(wortSagt(z))}`,
      vor: neu.map(x => lamaAufnahme(x)).concat(lamaWort(z.ru)), nach: teile(wortSagt(z)).map(x => lamaAufnahme(x)) });
    R.sag = { satz: langsamWechsel(z.ru) };
    R.hoeren();
  }
  function zeigeZahlenNeu(a) {
    a.liste.forEach(z => merken('z:' + z.ru, null));
    geruest(`<div class="zahlen">${a.liste.map(z => `<button class="zahl-k" type="button" data-zahl="${esc(z.ru)}">
        <span class="ziffer">${z.zahl}</span><b lang="ru">${esc(z.ru)}</b><small>${esc(z.um)}</small></button>`).join('')}</div>`,
    weiterKnopf(), 'neu');
    R.hoeren = () => sagL(LAMA_TEXTE.zahlen_neu[0], { nach: a.liste.map(z => lamaWort(z.ru)) });
    R.hoeren();
  }
  // Erster Tipp normal, zweiter Tipp kurz danach langsam
  function langsamWechsel(text) {
    let zuletzt = 0;
    return () => { const jetzt = Date.now(), langsam = jetzt - zuletzt < 2500; zuletzt = langsam ? 0 : jetzt; nurRu(text, langsam); };
  }

  /* ----- Auswahl-Aufgaben ----- */
  // Bis zu n weitere Einträge für falsche Antworten, Bekanntes zuerst
  function andere(liste, x, n, passt = () => true) {
    const pool = liste.filter(y => y !== x && passt(y));
    const k = y => gesehen(keyVon(y));
    const bekannt = shuffle(pool.filter(k)), rest = shuffle(pool.filter(y => !k(y)));
    return bekannt.concat(rest).slice(0, n);
  }
  const keyVon = y => (y.b ? 'b:' + y.b : SAETZE.includes(y) ? 's:' + y.ru : ZAUBERWOERTER.includes(y) ? 'z:' + y.ru : 'w:' + y.ru);
  const bisJetzt = () => (R.art === 'station' ? R.nr : STATIONEN.length);
  const lesbareWoerter = w => LERNWOERTER.filter(y => y.st <= Math.max(w.st, bisJetzt()) && (!w.gruppe || y.gruppe !== w.gruppe));

  function zeigeWahl(a) {
    const x = a.x, t = a.typ;
    let frage = '', optionen = [], anweisung = '', danach = [], hoerbar = [], klasse = t;
    const opt = (html, ok, extra = '') => ({ html, ok, extra });
    if (t === 'b-hoeren' || t === 'b-laut' || t === 'b-bild') {
      const bekannt = BUCHSTABEN.filter(y => y !== x && (gesehen('b:' + y.b) || stationVon(y.b) === stationVon(x.b)));
      if (t === 'b-hoeren') {
        anweisung = ziehL('b_hoeren');
        frage = hoerKnopf();
        hoerbar = [buchstabenAufnahme(x)];
        const nahe = BUCHSTABEN.filter(y => y !== x && stationVon(y.b) <= Math.max(stationVon(x.b), bisJetzt()));
        const wahl = shuffle(bekannt.length >= 2 ? bekannt : nahe).slice(0, 2);
        optionen = [opt(x.b, true)].concat(wahl.map(y => opt(y.b, false)));
      } else if (t === 'b-laut') {
        anweisung = ziehL('b_laut');
        frage = `<div class="ru-b-gross art-${x.art}" lang="ru">${x.b}<small>${x.k}</small></div>`;
        const laute = new Set([x.laut]);
        const falsche = [];
        if (x.falle && !laute.has(x.falle)) { falsche.push(x.falle); laute.add(x.falle); }
        for (const y of shuffle(BUCHSTABEN.filter(y => y.laut && y !== x))) {
          if (falsche.length >= 2) break;
          if (!laute.has(y.laut) && (gesehen('b:' + y.b) || falsche.length < 2)) { falsche.push(y.laut); laute.add(y.laut); }
        }
        optionen = [opt(x.laut, true)].concat(falsche.slice(0, 2).map(l => opt(l, false)));
        danach = [buchstabenAufnahme(x)];
      } else {
        anweisung = LAMA_TEXTE.b_bild[0];
        frage = `<div class="ru-b-gross art-${x.art}" lang="ru">${x.b}<small>${x.k}</small></div>`;
        const w = WORT.get(x.wort);
        const mitWort = BUCHSTABEN.filter(y => y !== x && y.wort && WORT.get(y.wort).bild !== w.bild);
        const wahl = shuffle(bekannt.filter(y => y.wort).length >= 2 ? bekannt.filter(y => y.wort) : mitWort).slice(0, 2);
        optionen = [opt(w.bild, true)].concat(wahl.map(y => opt(WORT.get(y.wort).bild, false)));
        danach = [buchstabenAufnahme(x), lamaWort(w.ru)];
        klasse += ' bilder';
      }
    } else if (t === 'w-lesen' || t === 'w-bild' || t === 'w-hoeren') {
      const pool = t === 'w-lesen' ? LERNWOERTER.filter(y => !x.gruppe || y.gruppe !== x.gruppe) : lesbareWoerter(x);
      const wahl = andere(pool, x, 2, y => y.bild !== x.bild);
      danach = [lamaWort(x.ru)];
      if (t === 'w-lesen') {
        anweisung = ziehL('w_lesen');
        frage = `<div class="ru-wort-gross" lang="ru">${esc(GROSS(x.ru))}</div>`;
        optionen = [opt(x.bild, true)].concat(wahl.map(y => opt(y.bild, false)));
        klasse += ' bilder';
      } else if (t === 'w-bild') {
        anweisung = ziehL('w_bild');
        frage = `<div class="ru-bild-gross">${x.bild}</div>`;
        optionen = [opt(esc(GROSS(x.ru)), true)].concat(wahl.map(y => opt(esc(GROSS(y.ru)), false)));
        klasse += ' woerter';
      } else {
        anweisung = ziehL('w_hoeren');
        frage = hoerKnopf();
        hoerbar = [lamaWort(x.ru)];
        danach = [];
        optionen = [opt(esc(GROSS(x.ru)), true)].concat(wahl.map(y => opt(esc(GROSS(y.ru)), false)));
        klasse += ' woerter';
      }
    } else if (t === 's-lesen') {
      anweisung = ziehL('s_lesen');
      frage = `<div class="ru-satz-gross" lang="ru">${esc(x.ru)}</div>`;
      const wahl = shuffle(SAETZE.filter(y => y !== x && y.de !== x.de)).sort((p, q) => (gesehen('s:' + q.ru) - gesehen('s:' + p.ru))).slice(0, 2);
      optionen = [opt(esc(x.de), true)].concat(wahl.map(y => opt(esc(y.de), false)));
      danach = [lamaWort(x.ru)];
      klasse += ' saetze';
    } else if (t === 'z-hoeren') {
      anweisung = ziehL('z_hoeren');
      frage = hoerKnopf(true) + `<div class="ru-satz-gross" lang="ru">${esc(x.ru)}</div><p class="ru-um">${esc(x.um)}</p>`;
      hoerbar = [lamaWort(x.ru)];
      const wahl = shuffle(ZAUBERWOERTER.filter(y => y !== x && !y.zahl)).sort((p, q) => (gesehen('z:' + q.ru) - gesehen('z:' + p.ru))).slice(0, 2);
      optionen = [opt(esc(x.de), true)].concat(wahl.map(y => opt(esc(y.de), false)));
      klasse += ' saetze';
    } else if (t === 'zahl-hoeren') {
      anweisung = LAMA_TEXTE.zahl_hoeren[0];
      // Ohne Ton steht das Zahlwort da, sonst erst nach der Antwort
      frage = hoerKnopf() + (tonAn() ? '' : `<div class="ru-satz-gross" lang="ru">${esc(x.ru)}</div><p class="ru-um">${esc(x.um)}</p>`);
      hoerbar = [lamaWort(x.ru)];
      const andereZahlen = shuffle(ZAUBERWOERTER.filter(y => y.zahl && y !== x)).sort((p, q) => gesehen('z:' + q.ru) - gesehen('z:' + p.ru)).slice(0, 2);
      optionen = [opt(`<span class="ziffer">${x.zahl}</span>`, true)].concat(andereZahlen.map(y => opt(`<span class="ziffer">${y.zahl}</span>`, false)));
      klasse += ' zahlen-wahl';
    }
    optionen = shuffle(optionen);
    const kyrillisch = t === 'b-hoeren' || t === 'w-bild' || t === 'w-hoeren';
    geruest(frage, optionen.map((o, i) => `<button class="ru-wahl" type="button" data-i="${i}"${kyrillisch ? ' lang="ru"' : ''}>${o.html}</button>`).join(''), klasse);
    R.optionen = optionen;
    R.danach = danach;
    R.hoerbar = hoerbar;
    R.hoeren = () => (hoerbar.length ? sagL(anweisung, { nach: hoerbar }) : sagL(anweisung));
    R.nurHoeren = hoerbar.length ? () => Stimme.einwurf(hoerbar) : null;
    if (ersteMal(t)) R.hoeren();
    else if (hoerbar.length) sprich(ruHtml(teile(anweisung)), hoerbar);
    else zeigeText(ruHtml(teile(anweisung)));
  }

  async function wahl(btn) {
    if (!R || R.gesperrt) return;
    const o = R.optionen[+btn.dataset.i];
    const a = R.a, key = KEY[a.art](a.x);
    if (o.ok) {
      R.gesperrt = true;
      btn.classList.add('richtig');
      Ton.richtig();
      freuen(eckeLama);
      merken(key, !R.fehlerHier);
      const lob = ziehL(R.fehlerHier ? 'nachher_richtig' : 'richtig');
      // Nach dem Lesen das Wort hören, dann das Lob
      const meine = R;
      await sagL(lob, { vor: R.danach });
      if (R === meine && R.a === a) setTimeout(() => { if (R === meine && R.a === a) naechste(); }, 350);
      return;
    }
    // Daneben: die richtige Antwort zeigen, und dieselbe Sache kommt später nochmal
    if (R.fehlerHier) return;
    R.fehlerHier = true;
    R.gesperrt = true;
    R.fehler++;
    btn.classList.add('falsch');
    Ton.falsch();
    oops(eckeLama);
    merken(key, false);
    const richtigIndex = R.optionen.findIndex(x => x.ok);
    inhalt.querySelector(`.ru-wahl[data-i="${richtigIndex}"]`).classList.add('loesung');
    nochmalSpaeter(a);
    inhalt.querySelector('.ru-antworten').insertAdjacentHTML('afterend', `<div class="ru-dann">${weiterKnopf()}</div>`);
    // danach das Richtige nochmal hören (beim Hören: das gesuchte Wort)
    await sagL(ziehL('falsch'), { nach: R.danach.length ? R.danach : R.hoerbar });
  }
  function nochmalSpaeter(a) {
    if (!a.x) return;
    const key = KEY[a.art](a.x), n = R.nochmal.get(key) || 0;
    if (n >= 2) return;
    R.nochmal.set(key, n + 1);
    const neu = abfrage(a.art, a.x, a.typ);
    if (!neu) return;
    // vor den Paaren am Schluss einfügen
    const ende = R.plan[R.plan.length - 1] && R.plan[R.plan.length - 1].typ === 'paare' ? R.plan.length - 1 : R.plan.length;
    R.plan.splice(Math.min(ende, R.i + 3), 0, neu);
  }

  /* ----- Wort oder Satz legen ----- */
  function zeigeLegen(a) {
    const x = a.x, satz = a.typ === 's-bauen';
    const teileZiel = satz ? satzWoerter(x) : [...GROSS(x.ru)];
    // Ein, zwei Buchstaben oder ein Wort zu viel, damit man hinschauen muss
    let extra = [];
    if (satz) {
      const w = pick(LERNWOERTER.filter(y => y.st <= bisJetzt() && !teileZiel.includes(y.ru)));
      if (w) extra = [w.ru];
    } else {
      const bekannt = BUCHSTABEN.filter(y => gesehen('b:' + y.b) && !teileZiel.includes(y.b) && /[А-ЯЁ]/.test(y.b) && !'ЪЬЫ'.includes(y.b));
      extra = shuffle(bekannt).slice(0, teileZiel.length <= 4 ? 2 : 1).map(y => y.b);
    }
    const kacheln = shuffle(teileZiel.concat(extra));
    const satzende = satz ? (x.ru.match(/[.!?]$/) || [''])[0] : '';
    geruest(`
      ${satz ? `<p class="ru-de gross">${esc(x.de)}</p>` : ''}
      <div class="ru-bild-mittel">${x.bild}</div>
      <div class="ru-slots ${satz ? 'satz' : ''}" lang="ru">${teileZiel.map(() => '<span class="slot"></span>').join(satz ? ' ' : '')}${satzende ? `<span class="satzende">${satzende}</span>` : ''}</div>
      ${hoerKnopf(true)}`,
    kacheln.map((k, i) => `<button class="ru-kachel${satz ? ' wort' : ''}" type="button" data-k="${i}" lang="ru">${esc(k)}</button>`).join(''), 'legen');
    R.ziel = teileZiel;
    R.kacheln = kacheln;
    R.pos = 0;
    R.danach = [lamaWort(x.ru)];
    const anw = ziehL(satz ? 's_bauen' : 'w_legen');
    R.hoeren = () => sagL(anw, { nach: [lamaWort(x.ru)] });
    R.nurHoeren = () => nurRu(x.ru, true);
    if (ersteMal(a.typ)) R.hoeren();
    else sprich(ruHtml(teile(anw)), [lamaWort(x.ru)]);
  }
  async function legen(btn) {
    if (!R || R.gesperrt || btn.disabled) return;
    const k = R.kacheln[+btn.dataset.k];
    const a = R.a, key = KEY[a.art](a.x);
    if (k === R.ziel[R.pos]) {
      btn.disabled = true;
      btn.classList.add('weg');
      const slot = inhalt.querySelectorAll('.ru-slots .slot')[R.pos];
      slot.textContent = k;
      slot.classList.add('voll');
      R.pos++;
      Ton.tipp();
      if (R.pos < R.ziel.length) return;
      R.gesperrt = true;
      Ton.richtig();
      freuen(eckeLama);
      inhalt.querySelector('.ru-slots').classList.add('richtig');
      merken(key, !R.fehlerHier);
      const meine = R;
      await sagL(ziehL(R.fehlerHier ? 'nachher_richtig' : 'richtig'), { vor: R.danach });
      if (R === meine && R.a === a) setTimeout(() => { if (R === meine && R.a === a) naechste(); }, 350);
      return;
    }
    // falsche Kachel: wackeln, ein kleiner Hinweis, das Ziel nochmal (langsam)
    btn.classList.remove('wackelt');
    void btn.offsetWidth;
    btn.classList.add('wackelt');
    Ton.falsch();
    oops(eckeLama);
    if (!R.fehlerHier) { R.fehlerHier = true; R.fehler++; merken(key, false); nochmalSpaeter(a); }
    const naechsterSlot = inhalt.querySelectorAll('.ru-slots .slot')[R.pos];
    naechsterSlot.classList.remove('naechster');
    void naechsterSlot.offsetWidth;
    naechsterSlot.classList.add('naechster');
    sagL(ziehL(a.typ === 's-bauen' ? 'bauen_falsch' : 'legen_falsch'), { nach: [lamaWort(a.x.ru, a.typ !== 's-bauen')] });
  }

  /* ----- Paare zum Schluss ----- */
  function zeigePaare() {
    // Vier Wörter, am liebsten aus dieser Station; jedes Bild nur einmal
    const nr = bisJetzt();
    const eigene = shuffle(LERNWOERTER.filter(w => (R.art === 'station' ? w.st === nr : gesehen('w:' + w.ru))));
    const mehr = shuffle(LERNWOERTER.filter(w => w.st <= nr && gesehen('w:' + w.ru) && !eigene.includes(w)));
    const paare = [];
    for (const w of eigene.concat(mehr)) {
      if (paare.length >= 4) break;
      if (!paare.some(p => p.bild === w.bild || (w.gruppe && p.gruppe === w.gruppe))) paare.push(w);
    }
    if (paare.length < 2) { naechste(); return; }
    const links = shuffle(paare.slice()), rechts = shuffle(paare.slice());
    geruest('', `<div class="paare">
      <div class="spalte">${links.map(w => `<button class="paar wort" type="button" data-p="${esc(w.ru)}" lang="ru">${esc(GROSS(w.ru))}</button>`).join('')}</div>
      <div class="spalte">${rechts.map(w => `<button class="paar bild" type="button" data-p="${esc(w.ru)}">${w.bild}</button>`).join('')}</div>
    </div>`, 'paare-runde');
    R.paarWahl = null;
    R.paareOffen = paare.length;
    R.hoeren = () => sagL(LAMA_TEXTE.paare[0]);
    R.hoeren();
  }
  async function paar(btn) {
    if (!R || btn.disabled) return;
    if (!R.paarWahl || R.paarWahl.classList.contains(btn.classList.contains('wort') ? 'wort' : 'bild')) {
      // erste Hälfte (oder Wechsel innerhalb derselben Spalte)
      if (R.paarWahl) R.paarWahl.classList.remove('gewaehlt');
      R.paarWahl = btn;
      btn.classList.add('gewaehlt');
      Ton.tipp();
      if (btn.classList.contains('wort')) nurRu(btn.dataset.p);
      return;
    }
    const erste = R.paarWahl;
    R.paarWahl = null;
    erste.classList.remove('gewaehlt');
    if (erste.dataset.p === btn.dataset.p) {
      [erste, btn].forEach(x => { x.disabled = true; x.classList.add('richtig'); });
      Ton.richtig();
      freuen(eckeLama, 700);
      merken('w:' + btn.dataset.p, true);
      R.paareOffen--;
      if (R.paareOffen > 0) { nurRu(btn.dataset.p); return; }
      const meine = R;
      await sagL(LAMA_TEXTE.paare_ende[0], { vor: [lamaWort(btn.dataset.p)] });
      if (R === meine) naechste();
      return;
    }
    [erste, btn].forEach(x => { x.classList.remove('wackelt'); void x.offsetWidth; x.classList.add('wackelt'); });
    Ton.falsch();
    oops(eckeLama);
    sagL(LAMA_TEXTE.paar_falsch[0]);
  }

  /* ----- Ende der Runde ----- */
  async function rundeEnde() {
    const r = R;
    const sterne = r.fehler <= 1 ? 3 : r.fehler <= 4 ? 2 : 1;
    let m;
    if (r.art === 'station') {
      const erstes = !geschafft(r.nr);
      m = erstes ? 3 : 1;
      ru.stationen[r.nr] = { sterne: Math.max(sterne, geschafft(r.nr) ? ru.stationen[r.nr].sterne : 0) };
    } else m = 2;
    if (r.fehler === 0) m++;
    m = Math.min(4, m);
    ru.runden++;
    ru.heute = tagHeute();
    sichern();
    stand.mandarinen += m;
    speichern();
    mandarinenZeigen();
    Ton.fertig();
    konfetti();
    freuen(eckeLama, 2200);
    inhalt.className = 'ru-inhalt ansicht-runde';
    inhalt.innerHTML = `
      <div class="ru-ende">
        <div class="ende-sterne">${'<span class="an">★</span>'.repeat(sterne)}${'<span>★</span>'.repeat(3 - sterne)}</div>
        <p class="ru-titel">${r.art === 'station' ? 'Station ' + r.nr + ' geschafft!' : 'Gut wiederholt!'}</p>
        <p class="ende-m">+${m} ${ICON.mandarine}</p>
        <button class="go ru-weiter" type="button" data-karte="1">Zur Karte ${ICON.weiter}</button>
      </div>`;
    R = { art: 'ende', plan: [], i: 0 };
    await sagL(ziehL(r.art === 'station' ? 'station_ende' : 'wdh_ende'));
    if (R && R.art === 'ende') sagL(LAMA_TEXTE.mandarinen[m]);
  }

  /* ----- Tipps in der Runde ----- */
  inhalt.addEventListener('click', e => {
    if (!inhalt.classList.contains('ansicht-runde')) return;
    const b = e.target.closest('button');
    if (!b || !R) return;
    if (b.classList.contains('ru-x') || b.dataset.karte) { zeigeKarte(false); sagL(ziehL('karte')); return; }
    if (b.dataset.weiter) { Ton.tipp(); naechste(); return; }
    if (b.dataset.gesagt) {
      if (R.gesperrt) return;
      R.gesperrt = true;
      Ton.richtig();
      freuen(eckeLama);
      merken(KEY.z(R.a.x), true);
      const meine = R, a = R.a;
      sagL(ziehL('gesagt')).then(() => { if (R === meine && R.a === a) naechste(); });
      return;
    }
    if (b.dataset.hoer) { if (R.nurHoeren) R.nurHoeren(); else R.hoeren(); return; }
    if (b.dataset.sag && R.sag && R.sag[b.dataset.sag]) { hops(b); R.sag[b.dataset.sag](); return; }
    if (b.dataset.zahl) { hops(b); nurRu(b.dataset.zahl); return; }
    if (b.classList.contains('ru-wahl')) { wahl(b); return; }
    if (b.classList.contains('ru-kachel')) { legen(b); return; }
    if (b.classList.contains('paar')) paar(b);
  });

  /* ---------- Elternbereich: Russisch für sich löschen ---------- */
  const parents = document.querySelector('#regeln .parents');
  if (parents) {
    const knopf = document.createElement('button');
    knopf.type = 'button';
    knopf.id = 'ruReset';
    parents.appendChild(knopf);
    let scharf = false;
    const beschriften = () => {
      knopf.textContent = scharf ? 'Russisch wirklich löschen? Nochmal tippen.' : 'Russisch-Fortschritt löschen';
      knopf.hidden = !ru.da && !Object.keys(ru.items).length;
    };
    beschriften();
    $('help').addEventListener('click', () => { scharf = false; beschriften(); });
    knopf.addEventListener('click', () => {
      if (!scharf) { scharf = true; beschriften(); return; }
      // Name und Lama bleiben, nur das Gelernte ist weg
      ru.stationen = {};
      ru.items = {};
      ru.runden = 0;
      sichern();
      scharf = false;
      beschriften();
      knopf.textContent = 'Russisch gelöscht.';
    });
  }

  zeigeLamaBeiCapy(false);
  // zustand(): nur zum Nachschauen (Tests, Fehlersuche), ändert nichts
  const zustand = () => (!R ? null : {
    art: R.art, i: R.i, typ: R.a ? R.a.typ : '', gesperrt: !!R.gesperrt, fehler: R.fehler, laenge: R.plan.length,
    richtig: R.optionen ? R.optionen.findIndex(o => o.ok) : -1,
    ziel: R.ziel || null, kacheln: R.kacheln || null,
  });
  window.Russisch = { jubeln, auf: eckeAuf, ankunft, zustand };
})();
