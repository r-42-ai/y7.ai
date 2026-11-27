'use strict';

/* =====================================================================
   UHR-ECKE
   Capy bringt Yuna die Uhr bei, mit einer Kuckucksuhr: zuerst die
   Zeigeruhr (Stationen 1–8), danach die Digitaluhr (9–12).
   Inhalte und alles, was Capy sagt: uhr-texte.js. Aussehen: uhr.css.

   Läuft nach dem Hauptskript in index.html und nutzt dessen Stimme, Ton,
   stand, speichern() … Fehlt diese Datei, läuft Capy wie immer.

   Aufgaben: Uhr lesen (drei Zeiten zur Auswahl), Uhr stellen (Zeiger mit
   dem Finger drehen), hören und die passende Uhr finden, Paare, und bei der
   Digitaluhr: Zeit eintippen, Digitaluhr lesen, Zeiger nach der Digitaluhr
   stellen, Tag und Nacht (24 Stunden) und jede Minute.
   Dazu «Uhr spielen»: frei drehen, Capy liest vor, der Kuckuck ruft.
   ===================================================================== */
(() => {
  if (typeof UHR_STATIONEN === 'undefined' || typeof Stimme === 'undefined') return;

  /* ---------- Lernstand ----------
     stationen: Nummer → { sterne } · arten: 'halb', 'd-halb', 'tz', 'minute' … →
     { k: Stärke 0–5, n: so oft, z: Tag } · heute: Tag der letzten Runde ·
     runden · begruesst: Capy hat die Uhr schon gezeigt · digital: «Jetzt kommt
     die Digitaluhr» ist gesagt · gestellt: Yuna hat schon einmal Zeiger gedreht */
  const SPEICHER = 'y7.capy.uhr';
  const tagHeute = () => { const d = new Date(); return Math.floor((d - d.getTimezoneOffset() * 6e4) / 864e5); };
  const uz = (() => {
    const s = { stationen: {}, arten: {}, heute: 0, runden: 0, begruesst: false, digital: false, gestellt: false };
    try {
      const raw = JSON.parse(localStorage.getItem(SPEICHER) || 'null');
      if (raw && typeof raw === 'object') {
        if (raw.stationen && typeof raw.stationen === 'object') {
          for (const [k, v] of Object.entries(raw.stationen)) {
            if (UHR_STATIONEN.some(x => x.nr === +k) && v && [1, 2, 3].includes(v.sterne)) s.stationen[+k] = { sterne: v.sterne };
          }
        }
        if (raw.arten && typeof raw.arten === 'object') {
          for (const [k, v] of Object.entries(raw.arten)) {
            if (/^[a-z-]{2,12}$/.test(k) && v && Number.isInteger(v.k)) {
              s.arten[k] = { k: clamp(v.k, 0, 5), n: Number.isInteger(v.n) && v.n > 0 ? v.n : 1, z: Number.isInteger(v.z) ? v.z : 0 };
            }
          }
        }
        if (Number.isInteger(raw.heute)) s.heute = raw.heute;
        if (Number.isInteger(raw.runden) && raw.runden >= 0) s.runden = raw.runden;
        for (const k of ['begruesst', 'digital', 'gestellt']) s[k] = raw[k] === true;
      }
    } catch (e) { /* privater Modus o.ä. */ }
    return s;
  })();
  const sichern = () => { try { localStorage.setItem(SPEICHER, JSON.stringify(uz)); } catch (e) { /* privater Modus o.ä. */ } };

  const geschafft = nr => !!uz.stationen[nr];
  const offen = nr => nr === 1 || geschafft(nr) || geschafft(nr - 1);
  const aktuelle = () => UHR_STATIONEN.find(s => !geschafft(s.nr)) || null;
  const station = nr => UHR_STATIONEN[nr - 1];
  // Stärke je Art von Aufgabe: Zeigeruhr nach Zeit-Art, Digitaluhr mit «d-», Tag und Nacht, Minuten
  const schluessel = a => (a.typ.startsWith('tz') ? 'tz' : a.typ.startsWith('m-') ? 'minute' : a.typ.startsWith('d-') ? 'd-' + a.art : a.art);
  function merken(k, ergebnis) {
    const it = uz.arten[k] || (uz.arten[k] = { k: 0, n: 0, z: 0 });
    it.n++;
    it.z = tagHeute();
    if (ergebnis === true) it.k = Math.min(5, it.k + 1);
    else if (ergebnis === false) it.k = Math.max(0, it.k - 1);
    sichern();
  }

  /* ---------- Kleinkram ---------- */
  const tonAn = () => stand.stimme && !!audio();
  const warte = ms => new Promise(res => setTimeout(res, reduce ? Math.min(ms, 60) : ms));
  const mod = (x, n) => ((x % n) + n) % n;
  const t720 = t => mod(Math.round(t), 720);
  // Zeit auf der 12-Stunden-Digitaluhr: 1:00 bis 12:59
  const zwoelfer = t => { const x = t720(t); return x < 60 ? x + 720 : x; };
  const istFuenf = t => mod(Math.round(t), 5) === 0;

  // Was Capy sagt: aus jeder Liste zufällig, ohne gleich zu wiederholen
  const beutelU = {};
  function ziehU(name) {
    const pool = UHR_TEXTE[name];
    if (!beutelU[name] || !beutelU[name].length) beutelU[name] = shuffle(pool.slice());
    return beutelU[name].pop();
  }

  /* ---------- Töne: Ticken beim Drehen und der Kuckuck ---------- */
  function note(f, t0, dur, type = 'sine', vol = 0.1) {
    const c = stand.ton ? audio() : null;
    if (!c) return;
    const t = c.currentTime + t0;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    g.connect(c.destination);
    o.start(t);
    o.stop(t + dur + 0.05);
  }
  const klick = () => note(2400, 0, 0.025, 'square', 0.025);
  // Ku-ckuck: zwei weiche Töne, eine grosse Terz nach unten
  function kuckuckRuf() {
    note(784, 0, 0.24, 'sine', 0.16); note(1568, 0, 0.18, 'sine', 0.025);
    note(622, 0.27, 0.36, 'sine', 0.16); note(1244, 0.27, 0.26, 'sine', 0.025);
  }

  /* =====================================================================
     DIE UHR
     Mittelpunkt (0, 0), Zifferblatt mit Radius 100. Winkel im Uhrzeigersinn
     ab zwölf Uhr. Die Zeit t läuft weiter (kann > 720 sein); gezeigt wird
     t mod 720, der kurze Zeiger wandert mit dem langen mit, wie echt.
     ===================================================================== */
  const rad = w => w * Math.PI / 180;
  const pol = (w, r) => [Math.sin(rad(w)) * r, -Math.cos(rad(w)) * r];
  const f1 = x => Math.round(x * 10) / 10;
  const STRICHE = (() => {
    let fein = '', grob = '';
    for (let i = 0; i < 60; i++) {
      const [x1, y1] = pol(i * 6, i % 5 ? 91 : 84), [x2, y2] = pol(i * 6, 97);
      const d = `M${f1(x1)} ${f1(y1)}L${f1(x2)} ${f1(y2)}`;
      if (i % 5) fein += d; else grob += d;
    }
    return { fein, grob };
  })();
  const ZAHLEN = Array.from({ length: 12 }, (_, i) => {
    const z = i || 12, [x, y] = pol(i * 30, 69);
    return `<text class="zahl" data-z="${z}" x="${f1(x)}" y="${f1(y)}" dy=".36em">${z}</text>`;
  }).join('');
  const MINUTEN = Array.from({ length: 12 }, (_, i) => {
    const [x, y] = pol(i * 30, 112);
    return `<text class="mzahl" data-mz="${i * 5}" x="${f1(x)}" y="${f1(y)}" dy=".36em">${i * 5}</text>`;
  }).join('');
  const VIERTEL = [0, 1, 2, 3].map(i => {
    const [x1, y1] = pol(i * 90, 100), [x2, y2] = pol(i * 90 + 90, 100);
    return `<path class="viertel-stueck v${i % 2}" d="M0 0L${f1(x1)} ${f1(y1)}A100 100 0 0 1 ${f1(x2)} ${f1(y2)}Z"/>`;
  }).join('');
  // Der kurze Zeiger breit, der lange etwas schmaler, aber kräftig (kein dünner Sekundenzeiger)
  const ZEIGER_H = 'M-8 12 L-7 -40 Q0 -57 7 -40 L8 12 Q0 19 -8 12 Z';
  const ZEIGER_M = 'M-6 15 L-5 -72 Q0 -91 5 -72 L6 15 Q0 21 -6 15 Z';
  function kuchenPfad(m) {
    if (m <= 0.01) return '';
    if (m >= 59.99) return 'M0 -100A100 100 0 1 1 0 100A100 100 0 1 1 0 -100Z';
    const [x, y] = pol(m * 6, 100);
    return `M0 0L0 -100A100 100 0 ${m > 30 ? 1 : 0} 1 ${f1(x)} ${f1(y)}Z`;
  }
  const zeigerDreh = t => { const x = t720(t); return { h: x / 2, m: (x % 60) * 6 }; };

  // Das Häuschen der Kuckucksuhr mit Tür und Vogel
  const HAUS = `
    <g class="haus" aria-hidden="true">
      <path class="haus-wand" d="M-126 -76 L0 -170 L126 -76 V98 Q126 120 104 120 H-104 Q-126 120 -126 98 Z"/>
      <path class="haus-licht" d="M-110 -70 L0 -152 L110 -70" fill="none"/>
      <path class="dach" d="M-162 -72 L0 -196 L162 -72 L146 -58 L0 -170 L-146 -58 Z"/>
      <path class="dach-schnee nur-winter" d="M-150 -76 L0 -190 L150 -76 C140 -70 132 -78 124 -72 C112 -80 104 -66 92 -74 L0 -142 Z" />
      <circle class="dach-knauf" cx="0" cy="-198" r="7"/>
      <path class="tuer-rahmen" d="M-22 -108 V-134 A22 22 0 0 1 22 -134 V-108 Z"/>
      <path class="tuer-loch" d="M-17 -110 V-134 A17 17 0 0 1 17 -134 V-110 Z"/>
      <g class="tuer"><path d="M-17 -110 V-134 A17 17 0 0 1 17 -134 V-110 Z"/><circle cx="11" cy="-122" r="2.2" fill="#FFD43B"/></g>
      <g class="vogel-k"><g class="vk">
        <path d="M-17 -124 L-31 -134 L-28 -118 Z" fill="#5E7697"/>
        <ellipse cx="-3" cy="-124" rx="17" ry="13" fill="#8DA6C8"/>
        <ellipse cx="0" cy="-119" rx="10" ry="7" fill="#E4ECF7"/>
        <path d="M-13 -126 C-7 -133 4 -131 6 -122 C0 -118 -8 -119 -13 -126 Z" fill="#6F89AE"/>
        <circle cx="9" cy="-135" r="10.5" fill="#8DA6C8"/>
        <circle cx="12.5" cy="-137" r="2.3" fill="#2B1A10"/><circle cx="13.2" cy="-137.7" r=".75" fill="#fff"/>
        <ellipse cx="13" cy="-130.5" rx="3" ry="1.8" fill="#FF9E9E" opacity=".75"/>
        <path class="schnabel-zu" d="M18.5 -136 L29 -133 L18.5 -130 Z" fill="#FFB020"/>
        <g class="schnabel-auf" fill="#FFB020"><path d="M18.5 -136 L29 -137.5 L19 -133 Z"/><path d="M19 -132.5 L28 -128.5 L18.5 -130 Z"/></g>
      </g></g>
      <g class="blaetter"><path d="M-150 -60 C-160 -44 -150 -30 -136 -34 C-134 -48 -140 -56 -150 -60 Z"/><path d="M150 -60 C160 -44 150 -30 136 -34 C134 -48 140 -56 150 -60 Z"/></g>
    </g>`;

  // Markup einer Uhr. haus: als Kuckucksuhr · statisch: Zeiger gleich richtig gedreht (Bilder)
  function uhrMarkup({ haus = false, t = 180, klasse = '' } = {}) {
    const vb = haus ? '-166 -210 332 336' : '-126 -126 252 252';
    const z = zeigerDreh(t), m = t720(t) % 60;
    return `<svg class="uhr ${haus ? 'mit-haus' : 'ohne-haus'} ${klasse}" viewBox="${vb}" role="img" aria-label="Uhr: ${esc(uhrZeitwort(t) || uhrDigital(zwoelfer(t)))}">
      ${haus ? HAUS : ''}
      <g class="kranz"><circle r="112" class="kranz-ring"/>${MINUTEN}</g>
      <circle r="104.5" class="rand"/>
      <circle r="100" class="blatt"/>
      <g class="viertel">${VIERTEL}<path class="viertel-linie" d="M0 -100V100M-100 0H100"/></g>
      <g class="seiten"><path class="seite-nach" d="M0 -100A100 100 0 0 1 0 100Z"/><path class="seite-vor" d="M0 100A100 100 0 0 1 0 -100Z"/>
        <text class="seite-wort nach" x="40" y="18">nach</text><text class="seite-wort vor" x="-40" y="18">vor</text></g>
      <path class="kuchen" d="${kuchenPfad(m)}"/>
      <path class="striche fein" d="${STRICHE.fein}"/><path class="striche grob" d="${STRICHE.grob}"/>
      <g class="zahlen">${ZAHLEN}</g>
      <g class="geist"><g class="geist-h"><path d="${ZEIGER_H}"/></g><g class="geist-m"><path d="${ZEIGER_M}"/></g></g>
      <g class="zeiger-h" transform="rotate(${f1(z.h)})"><path d="${ZEIGER_H}"/></g>
      <g class="zeiger-m" transform="rotate(${f1(z.m)})"><path d="${ZEIGER_M}"/></g>
      <circle r="7.5" class="achse"/><circle r="2.6" class="achse-punkt"/>
    </svg>`;
  }
  const miniUhr = (t, klasse = '') => uhrMarkup({ t, klasse: 'mini ' + klasse });

  // Eine lebendige Uhr in platz: Zeiger drehen, Hilfen, Kuckuck
  // opts: haus, t, stellbar, schritt (Minuten), hilfen [kuchen, seiten, minuten, viertel],
  //       onZiehen(t), onStell(t, vorher), onHaus()
  function neueUhr(platz, opts = {}) {
    platz.innerHTML = uhrMarkup({ haus: opts.haus, t: opts.t || 0 });
    const svg = platz.querySelector('svg');
    const hEl = svg.querySelector('.zeiger-h'), mEl = svg.querySelector('.zeiger-m'), kuchenEl = svg.querySelector('.kuchen');
    const u = { t: opts.t || 0, schritt: opts.schritt || 5, stellbar: !!opts.stellbar, svg };
    let anim = 0, greift = null, letzterKlick = null;

    function zeichnen() {
      const z = zeigerDreh(u.t);
      hEl.setAttribute('transform', `rotate(${z.h.toFixed(2)})`);
      mEl.setAttribute('transform', `rotate(${z.m.toFixed(2)})`);
      kuchenEl.setAttribute('d', kuchenPfad(mod(u.t, 60)));
      svg.setAttribute('aria-label', 'Uhr: ' + (uhrZeitwort(u.t) || uhrDigital(zwoelfer(u.t))));
      if (opts.onZiehen) opts.onZiehen(u.t);
    }
    u.setzen = t => { anim++; u.t = t; zeichnen(); };
    // Zeiger fahren zur Zeit ziel (vorwärts oder rückwärts, wie angegeben)
    u.zu = (ziel, ms = 900) => {
      const nr = ++anim, von = u.t;
      if (reduce || ms <= 0 || von === ziel) { u.t = ziel; zeichnen(); return Promise.resolve(); }
      const start = performance.now();
      return new Promise(res => {
        const schritt = jetzt => {
          if (nr !== anim || !svg.isConnected) { res(); return; }
          const p = Math.min(1, (jetzt - start) / ms), e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
          u.t = von + (ziel - von) * e;
          zeichnen();
          if (p < 1) requestAnimationFrame(schritt); else { u.t = ziel; zeichnen(); res(); }
        };
        requestAnimationFrame(schritt);
      });
    };
    // Kürzester Weg zu einer Zeit, die auf der Uhr gleich aussieht
    u.naechste = ziel => { const d = mod(ziel - u.t, 720); return u.t + (d > 360 ? d - 720 : d); };
    u.hilfen = liste => ['kuchen', 'seiten', 'minuten', 'viertel'].forEach(h => svg.classList.toggle('mit-' + h, liste.includes(h)));
    u.hervor = (...was) => {
      svg.querySelectorAll('.hl').forEach(x => x.classList.remove('hl'));
      for (const w of was) {
        if (w === 'h') hEl.classList.add('hl');
        else if (w === 'm') mEl.classList.add('hl');
        else if (w === 'zahlen') svg.querySelectorAll('.zahl').forEach(x => x.classList.add('hl'));
        else if (w === 'mzahlen') svg.querySelectorAll('.mzahl').forEach(x => x.classList.add('hl'));
        else if (w === 'nach' || w === 'vor') svg.querySelector('.seite-' + w).classList.add('hl');
        else if (w === 'striche') svg.querySelector('.striche.fein').classList.add('hl');
        else if (typeof w === 'number') { const e = svg.querySelector(`.zahl[data-z="${w}"]`); if (e) e.classList.add('hl'); }
        else if (typeof w === 'string' && w.startsWith('m')) { const e = svg.querySelector(`.mzahl[data-mz="${w.slice(1)}"]`); if (e) e.classList.add('hl'); }
      }
    };
    // Gestrichelte Zeiger zeigen, wo es hingehört (nur die, die noch falsch sind)
    u.geist = (t, welche = ['h', 'm']) => {
      const z = zeigerDreh(t);
      svg.querySelector('.geist-h').setAttribute('transform', `rotate(${f1(z.h)})`);
      svg.querySelector('.geist-m').setAttribute('transform', `rotate(${f1(z.m)})`);
      svg.classList.toggle('geist-zeigt-h', welche.includes('h'));
      svg.classList.toggle('geist-zeigt-m', welche.includes('m'));
    };
    u.wackeln = () => { svg.classList.remove('wackelt'); void svg.getBoundingClientRect(); svg.classList.add('wackelt'); };
    u.richtig = () => { svg.classList.remove('freut'); void svg.getBoundingClientRect(); svg.classList.add('freut'); };
    // Der Kuckuck ruft n-mal (nur mit Häuschen)
    let kuckuckNr = 0;
    u.kuckuck = async n => {
      if (!opts.haus || !svg.isConnected) return;
      const nr = ++kuckuckNr;
      svg.classList.add('k-auf');
      await warte(380);
      const takt = n > 6 ? 470 : 640;
      for (let i = 0; i < n; i++) {
        if (nr !== kuckuckNr || !svg.isConnected) break;
        svg.classList.remove('k-ruf');
        void svg.getBoundingClientRect();
        svg.classList.add('k-ruf');
        kuckuckRuf();
        await warte(takt);
      }
      await warte(200);
      if (nr === kuckuckNr) svg.classList.remove('k-auf', 'k-ruf');
    };

    // Ziehen: Wer nahe an einem Zeiger anfasst, nimmt diesen; sonst den, dessen Richtung näher ist
    const punkt = e => {
      const p = svg.createSVGPoint();
      p.x = e.clientX; p.y = e.clientY;
      return p.matrixTransform(svg.getScreenCTM().inverse());
    };
    const winkel = p => mod(Math.atan2(p.x, -p.y) * 180 / Math.PI, 360);
    const winkelAbstand = (a, b) => { const d = mod(a - b, 360); return Math.min(d, 360 - d); };
    function abstandZuStrich(p, w, len) {
      const [x, y] = pol(w, len), l2 = x * x + y * y;
      const k = clamp((p.x * x + p.y * y) / l2, 0, 1);
      return Math.hypot(p.x - k * x, p.y - k * y);
    }
    function welcher(p) {
      const z = zeigerDreh(u.t), r = Math.hypot(p.x, p.y);
      const dH = abstandZuStrich(p, z.h, 52), dM = abstandZuStrich(p, z.m, 86);
      if (dH < 24 && dM < 24) return r > 54 ? 'm' : 'h';
      if (Math.min(dH, dM) < 24) return dH < dM ? 'h' : 'm';
      const w = winkel(p), aH = winkelAbstand(w, z.h), aM = winkelAbstand(w, z.m);
      if (Math.abs(aH - aM) < 10) return r > 54 ? 'm' : 'h';
      return aH < aM ? 'h' : 'm';
    }
    function ziehen(p) {
      const w = winkel(p), vorher = u.t;
      if (greift === 'm') {
        let d = w / 6 - mod(u.t, 60);
        if (d > 30) d -= 60; else if (d < -30) d += 60;
        u.t += d;
      } else {
        let d = w * 2 - mod(u.t, 720);
        if (d > 360) d -= 720; else if (d < -360) d += 720;
        u.t += d;
      }
      // leises Ticken: beim langen Zeiger alle fünf Minuten, beim kurzen jede Stunde
      const stufe = greift === 'm' ? Math.floor(u.t / 5) : Math.floor(u.t / 60);
      if (letzterKlick !== null && stufe !== letzterKlick) klick();
      letzterKlick = stufe;
      if (u.t !== vorher) zeichnen();
    }
    svg.addEventListener('pointerdown', e => {
      const p = punkt(e), r = Math.hypot(p.x, p.y);
      if (r > 126) {
        // aufs Häuschen getippt: Der Kuckuck schaut heraus
        if (opts.haus && p.y < -100 && opts.onHaus) opts.onHaus();
        return;
      }
      if (!u.stellbar) return;
      e.preventDefault();
      anim++;
      greift = welcher(p);
      letzterKlick = null;
      svg.classList.add('zieht', 'zieht-' + greift);
      try { svg.setPointerCapture(e.pointerId); } catch (x) { /* ältere Browser */ }
      ziehen(p);
    });
    svg.addEventListener('pointermove', e => { if (greift) ziehen(punkt(e)); });
    const loslassen = () => {
      if (!greift) return;
      svg.classList.remove('zieht', 'zieht-h', 'zieht-m');
      greift = null;
      const vorher = Math.round(u.t), ziel = Math.round(u.t / u.schritt) * u.schritt;
      u.zu(ziel, 140).then(() => { if (opts.onStell) opts.onStell(ziel, vorher); });
      if (!uz.gestellt && R && R.art !== 'spielen') { uz.gestellt = true; sichern(); }
    };
    svg.addEventListener('pointerup', loslassen);
    svg.addEventListener('pointercancel', loslassen);
    svg.addEventListener('lostpointercapture', loslassen);

    u.hilfen(opts.hilfen || []);
    zeichnen();
    return u;
  }

  /* ---------- Digitaluhr ---------- */
  function digitalMarkup(t, klasse = '') {
    const [h, m] = uhrDigital(t).split(':');
    return `<span class="dig ${klasse}" role="img" aria-label="${h}:${m}"><span class="dig-h">${h}</span><span class="dig-p">:</span><span class="dig-m">${m}</span></span>`;
  }
  // Ein Fenster mit Himmel: Sonne oder Mond, je nach Tageszeit
  function himmelMarkup(t) {
    const tz = uhrTageszeit(t), h = uhrNorm(t) / 60;
    const [oben, unten] = { nacht: ['#1E2A5A', '#3A4C86'], morgen: ['#FFB98C', '#FFE6C4'], vormittag: ['#7FC8F0', '#CBEEFC'],
      mittag: ['#62BBEE', '#BFE7FB'], nachmittag: ['#82C9F0', '#D3F0FA'], abend: ['#EE8C64', '#FBD09A'] }[tz.id];
    let himmel;
    if (h >= 5.5 && h <= 21) {
      const p = (h - 5.5) / 15.5, x = 14 + p * 92, y = 60 - Math.sin(p * Math.PI) * 44;
      himmel = `<circle cx="${f1(x)}" cy="${f1(y)}" r="12" fill="#FFE680" opacity=".55"/><circle cx="${f1(x)}" cy="${f1(y)}" r="8.5" fill="#FFD43B"/>`;
    } else {
      himmel = '<g fill="#FFF6C8"><circle cx="22" cy="16" r="1.4"/><circle cx="48" cy="10" r="1.1"/><circle cx="98" cy="22" r="1.3"/><circle cx="74" cy="30" r="1"/><circle cx="34" cy="34" r="1"/></g>' +
        '<path d="M86 12 A13 13 0 1 0 98 32 A10 10 0 1 1 86 12 Z" fill="#FFF3B8"/>';
    }
    return `<span class="himmel-box"><svg class="himmel" viewBox="0 0 120 80" aria-hidden="true">
        <rect width="120" height="80" fill="${unten}"/><rect width="120" height="44" fill="${oben}" opacity=".75"/>${himmel}
        <path d="M0 64 Q30 54 62 62 T120 60 V80 H0 Z" fill="${tz.id === 'nacht' ? '#2E5A3C' : '#8BCB6A'}"/></svg>
      <span>${esc(tz.name)}</span></span>`;
  }

  /* ---------- Zeichnungen der Ecke ---------- */
  const ICON = {
    haus: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 11.5 L12 4.5 L20 11.5 V19.5 A1.5 1.5 0 0 1 18.5 21 H14.5 V15 H9.5 V21 H5.5 A1.5 1.5 0 0 1 4 19.5 Z" fill="currentColor"/></svg>',
    ton: '<svg viewBox="0 0 24 24" aria-hidden="true"><use href="#i-ton"/></svg>',
    weiter: '<svg viewBox="0 0 32 32" aria-hidden="true"><use href="#i-weiter"/></svg>',
    zu: '<svg viewBox="0 0 24 24" aria-hidden="true"><use href="#i-zu"/></svg>',
    ok: '<svg viewBox="0 0 32 32" aria-hidden="true"><use href="#i-ok"/></svg>',
    back: '<svg viewBox="0 0 32 32" aria-hidden="true"><use href="#i-back"/></svg>',
    birne: '<svg viewBox="0 0 32 32" aria-hidden="true"><use href="#i-birne"/></svg>',
    mandarine: '<svg viewBox="0 0 40 40" aria-hidden="true"><use href="#mandarine"/></svg>',
    jetzt: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M12 7 V12 L15.5 14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  };
  // Kleines Uhrbild für Knöpfe: zeigt die Zeit t
  function iconUhr(t) {
    const z = zeigerDreh(t);
    return `<svg viewBox="-12 -12 24 24" aria-hidden="true" class="uhr-icon"><circle r="10.5" fill="#FFFDF6" stroke="#6B4423" stroke-width="2"/>
      <g fill="#C9B79A"><circle cx="0" cy="-7.8" r="1"/><circle cx="7.8" cy="0" r="1"/><circle cx="0" cy="7.8" r="1"/><circle cx="-7.8" cy="0" r="1"/></g>
      <path d="M0 1 V-5" stroke="#2F6FD0" stroke-width="2.6" stroke-linecap="round" transform="rotate(${f1(z.h)})"/>
      <path d="M0 1.5 V-8" stroke="#8B4FD6" stroke-width="2.2" stroke-linecap="round" transform="rotate(${f1(z.m)})"/>
      <circle r="1.4" fill="#4A3121"/></svg>`;
  }
  const CAPY_SVG = `<svg class="capy capy-u" viewBox="0 -10 140 144" aria-hidden="true">
      <g class="bob">
        <ellipse cx="38" cy="34" rx="11" ry="9" fill="#A86E40"/><ellipse cx="102" cy="34" rx="11" ry="9" fill="#A86E40"/>
        <ellipse cx="38" cy="35" rx="5.5" ry="4.2" fill="#7A4A28"/><ellipse cx="102" cy="35" rx="5.5" ry="4.2" fill="#7A4A28"/>
        <path d="M70 29 C104 29 124 47 124 79 L124 104 C124 122 110 132 90 132 L50 132 C30 132 16 122 16 104 L16 79 C16 47 36 29 70 29 Z" fill="#C88D5A"/>
        <path d="M38 47 C47 39 58 36 69 35.5" stroke="#DCA877" stroke-width="5" stroke-linecap="round" fill="none" opacity=".75"/>
        <g class="eyes-open">
          <ellipse cx="48" cy="66" rx="4.6" ry="5.6" fill="#2B1A10"/><ellipse cx="92" cy="66" rx="4.6" ry="5.6" fill="#2B1A10"/>
          <circle cx="49.6" cy="64" r="1.6" fill="#fff"/><circle cx="93.6" cy="64" r="1.6" fill="#fff"/>
        </g>
        <g class="eyes-happy" fill="none" stroke="#2B1A10" stroke-width="3.2" stroke-linecap="round"><path d="M42 68 Q48 60 54 68"/><path d="M86 68 Q92 60 98 68"/></g>
        <rect x="46" y="74" width="48" height="32" rx="16" fill="#A86E40"/>
        <ellipse cx="62" cy="83" rx="3.6" ry="2.8" fill="#3B2415"/><ellipse cx="78" cy="83" rx="3.6" ry="2.8" fill="#3B2415"/>
        <path d="M64 96 Q70 100.5 76 96" stroke="#3B2415" stroke-width="2.6" fill="none" stroke-linecap="round"/>
        <ellipse cx="31" cy="84" rx="8" ry="5" fill="#F59E95" opacity=".55"/><ellipse cx="109" cy="84" rx="8" ry="5" fill="#F59E95" opacity=".55"/>
        <use class="hut" href="#mandarine" x="52" y="-1" width="36" height="36"/>
      </g>
    </svg>`;

  /* =====================================================================
     DIE ECKE: Kopfzeile, Capy mit Sprechblase, Inhalt (Karte, Runde, Spielen)
     ===================================================================== */
  const ecke = document.createElement('section');
  ecke.className = 'uhr-ecke';
  ecke.id = 'uhr';
  ecke.hidden = true;
  ecke.setAttribute('aria-label', 'Uhr');
  ecke.innerHTML = `
    <header class="uhr-bar">
      <button class="round pill" id="uhrZu" type="button" aria-label="Zurück zu Capy">${ICON.haus}</button>
      <div class="uhr-titel pill"><span id="uhrTitelIcon"></span>Uhr mit Capy</div>
      <div class="count pill uhr-m" aria-label="Mandarinen">${ICON.mandarine}<span id="uhrM">0</span></div>
      <button class="round pill" id="uhrTon" type="button" aria-label="Ton"></button>
    </header>
    <div class="uhr-haupt">
      <div class="uhr-capy">
        ${CAPY_SVG}
        <div class="uhr-blase" id="uhrBlase" role="button" tabindex="0" aria-label="Nochmal hören"><span id="uhrSagt" aria-live="polite"></span></div>
      </div>
      <div class="uhr-inhalt" id="uhrInhalt"></div>
    </div>`;
  document.body.appendChild(ecke);
  const inhalt = $('uhrInhalt'), eckeCapy = ecke.querySelector('.capy-u');

  /* ---------- Sprechen ----------
     Ein Teil ist { html, s: [Aufnahmen] }. Alles geht über Capys Stimme
     (index.html) als Zwischenruf; ein Tipp auf die Blase wiederholt. */
  let letzteTeile = [];
  const zeitHtml = t => `<b class="u-zeit">${esc(uhrZeitwort(t))}</b>`;
  const txt = e => ({ html: esc(anzeigetext(e)), s: [sprechtext(e)] });
  const esIst = t => ({ html: `Es ist ${zeitHtml(t)}.`, s: [sprechtext(uhrEsIst(t))] });
  const stell = t => ({ html: `Stell die Uhr auf ${zeitHtml(t)}!`, s: [sprechtext(uhrStell(t))] });
  const digitalSag = t => ({ html: `<b class="u-dig-t">${uhrDigital(t)}</b>.`, s: uhrDigitalTeile(t).map(x => (/Uhr$/.test(x) ? sprechtext(x) : x)) });
  function sprich(html, saetze) {
    if (html !== null) {
      $('uhrSagt').innerHTML = html;
      const blase = $('uhrBlase');
      blase.classList.remove('pop');
      void blase.offsetWidth;
      blase.classList.add('pop');
    }
    letzteTeile = saetze;
    return Stimme.einwurf(saetze);
  }
  function sagU(...teile) {
    const t = teile.filter(Boolean);
    return sprich(t.map(x => x.html).join(' '), t.flatMap(x => x.s));
  }
  // Nur zeigen, nicht sprechen; ein Tipp auf die Blase spricht dann genau das
  const zeigeText = teil => { $('uhrSagt').innerHTML = teil.html; letzteTeile = teil.s; };
  $('uhrBlase').addEventListener('click', () => { if (letzteTeile.length) Stimme.einwurf(letzteTeile); });
  $('uhrBlase').addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); $('uhrBlase').click(); } });

  let capyTimer = 0;
  function capyMag(art, ms = 1000) {
    eckeCapy.classList.remove('happy', 'oops');
    void eckeCapy.getBoundingClientRect();
    clearTimeout(capyTimer);
    eckeCapy.classList.add(art);
    capyTimer = setTimeout(() => eckeCapy.classList.remove(art), ms);
  }

  function tonKnopf() {
    // Dasselbe Zeichen wie oben bei Capy: die Sprechblase ist die Stimme (der Lautsprecher dort sind die Geräusche)
    $('uhrTon').innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><use href="${stand.stimme ? '#i-stimme' : '#i-stimme-aus'}"/></svg>`;
    $('uhrTon').setAttribute('aria-label', stand.stimme ? 'Vorlesen ausschalten' : 'Vorlesen einschalten');
  }
  const mandarinenZeigen = () => { $('uhrM').textContent = stand.mandarinen; };
  const titelUhr = () => { const d = new Date(); $('uhrTitelIcon').innerHTML = iconUhr(d.getHours() * 60 + d.getMinutes()); };

  function auf() {
    Stimme.stopp();
    audio();
    ecke.hidden = false;
    document.body.classList.add('uhr-offen');
    hutZeigen(stand.hut);
    tonKnopf();
    mandarinenZeigen();
    titelUhr();
    zeigeKarte(true);
  }
  function zu() {
    R = null;
    Stimme.stopp();
    inhalt.innerHTML = '';          // hält auch Kuckuck und Zeiger an
    ecke.hidden = true;
    document.body.classList.remove('uhr-offen');
    zaehlen();
    wachHalten();
  }
  $('uhrZu').addEventListener('click', zu);
  $('uhrTon').addEventListener('click', () => {
    stand.stimme = !stand.stimme;
    speichern();
    tonZeigen();
    tonKnopf();
    if (stand.stimme) { audio(); sagU(txt(zieh('stimme_an'))); } else Stimme.stopp();
  });

  /* =====================================================================
     KARTE: die Stationen als Uhren, dazu Üben und Uhr spielen
     ===================================================================== */
  function stationKnopf(s) {
    const zustand = geschafft(s.nr) ? 'fertig' : offen(s.nr) ? 'jetzt' : 'gesperrt';
    const sterne = geschafft(s.nr) ? uz.stationen[s.nr].sterne : 0;
    const bild = s.digital ? `<span class="u-st-dig">${digitalMarkup(s.tag ? s.zeige : zwoelfer(s.zeige), 'klein')}</span>` : miniUhr(s.zeige);
    return `<button class="u-st ${zustand}" type="button" data-st="${s.nr}" aria-label="Station ${s.nr}: ${esc(s.titel)}${zustand === 'gesperrt' ? ', kommt später' : ''}">
        <span class="u-st-nr">${s.nr}</span>
        <span class="u-st-bild">${bild}</span>
        <span class="u-st-name">${esc(s.titel)}</span>
        <span class="u-st-sterne">${zustand === 'gesperrt' ? '🔒' : '★★★'.slice(0, sterne) + '☆☆☆'.slice(0, 3 - sterne)}</span>
      </button>`;
  }
  function zeigeKarte(gruessen) {
    R = null;
    const akt = aktuelle(), etwas = Object.keys(uz.stationen).length > 0;
    inhalt.className = 'uhr-inhalt ansicht-karte';
    inhalt.innerHTML = `
      <h2 class="u-h">Zeigeruhr</h2>
      <div class="u-stationen">${UHR_STATIONEN.filter(s => !s.digital).map(stationKnopf).join('')}</div>
      <h2 class="u-h">Digitaluhr</h2>
      <div class="u-stationen">${UHR_STATIONEN.filter(s => s.digital).map(stationKnopf).join('')}</div>
      <div class="u-menue">
        <button class="go u-los" type="button" data-aktion="weiter">${akt ? 'Station ' + akt.nr : 'Üben'} ${ICON.weiter}</button>
        <button class="u-knopf gelb" type="button" data-aktion="ueben" ${etwas ? '' : 'disabled'}>Üben</button>
        <button class="u-knopf blau" type="button" data-aktion="spielen">${iconUhr(3 * 60 + 30)} Uhr spielen</button>
      </div>`;
    if (!gruessen) return;
    if (!stand.stimme) { sagU(txt(UHR_TEXTE.ton_aus[0])); return; }
    if (!uz.begruesst) {
      uz.begruesst = true;
      sichern();
      sagU(txt(UHR_TEXTE.willkommen[0]), txt(UHR_TEXTE.karte_erste[0]));
    } else if (!akt) sagU(txt(UHR_TEXTE.karte_fertig[0]));
    else if (geschafft(8) && !uz.digital) {
      uz.digital = true;
      sichern();
      sagU(txt(UHR_TEXTE.karte_digital[0]));
    } else sagU(txt(ziehU('karte')));
  }

  /* =====================================================================
     UHR SPIELEN: frei drehen. Capy liest vor, der Kuckuck ruft zur vollen
     Stunde, «Jetzt» zeigt die echte Zeit. Ab der Digitaluhr steht sie
     daneben, ab «Tag und Nacht» läuft sie über 24 Stunden.
     ===================================================================== */
  function zeigeSpielen() {
    const digital = offen(9), tag = offen(11);
    R = { art: 'spielen', tag, digital };
    const d = new Date();
    const start = tag ? d.getHours() * 60 : (d.getHours() % 12 || 12) * 60;
    inhalt.className = 'uhr-inhalt ansicht-runde';
    inhalt.innerHTML = `
      <div class="u-kopf"><button class="u-zurueck" type="button" data-aktion="karte">${ICON.weiter} Karte</button></div>
      <div class="u-aufgabe typ-spielen">
        <div class="u-buehne"><div class="u-uhr-platz" id="uhrPlatz"></div></div>
        <div class="u-seite">
          <div class="u-zeitwort" id="spielWort"></div>
          ${digital ? '<div class="u-neben" id="spielDig"></div>' : ''}
          <div class="u-reihe">
            <button class="u-knopf blau" type="button" data-aktion="vorlesen">${ICON.ton} Vorlesen</button>
            <button class="u-knopf gelb" type="button" data-aktion="jetzt">${ICON.jetzt} Jetzt</button>
          </div>
        </div>
      </div>`;
    const hilfen = [offen(6) || digital ? 'minuten' : '', offen(3) ? 'seiten' : ''].filter(Boolean);
    R.uhr = neueUhr($('uhrPlatz'), {
      haus: true, t: start, stellbar: true, schritt: offen(12) ? 1 : 5, hilfen,
      onZiehen: spielZeigen,
      onStell: (t, vorher) => {
        if (R && R.art === 'spielen' && mod(t, 60) === 0 && Math.abs(t - vorher) < 30 && t !== R.letzteVolle) {
          R.letzteVolle = t;
          R.uhr.kuckuck(t720(t) / 60 || 12);
        }
        if (mod(t, 60) !== 0) R.letzteVolle = null;
      },
      onHaus: () => { const t = Math.round(R.uhr.t); R.uhr.kuckuck(mod(t, 60) === 0 ? t720(t) / 60 || 12 : 1); },
    });
    spielZeigen(R.uhr.t);
    sagU(txt(ziehU('spielen')));
  }
  // Die Zeit, die die Spieluhr gerade zeigt, auf der Digitaluhr (mit 24 Stunden nur ab Station 11)
  const spielZeit = t => (R && R.tag ? uhrNorm(t) : zwoelfer(t));
  function spielZeigen(t) {
    if (!R || R.art !== 'spielen') return;
    const x = Math.round(t), wort = istFuenf(x) ? uhrZeitwort(x) : null;
    // Bei fünf vor/nach halb passt «rechts nach, links vor» nicht
    if (R.uhr && offen(3)) R.uhr.svg.classList.toggle('mit-seiten', mod(x, 60) <= 20 || mod(x, 60) >= 40);
    const w = $('spielWort');
    if (w) w.innerHTML = wort ? esc(wort) : '<span class="u-leise">…</span>';
    const dg = $('spielDig');
    if (dg) dg.innerHTML = digitalMarkup(spielZeit(x), 'mittel') + (R.tag ? himmelMarkup(uhrNorm(x)) : '');
  }
  function spielVorlesen(t, vor = []) {
    const x = Math.round(t), teile = vor.slice();
    if (istFuenf(x)) teile.push(esIst(x));
    else teile.push(txt(UHR_TEXTE.jetzt_ungefaehr[0]), esIst(Math.round(x / 5) * 5));
    if (R.digital) teile.push(txt(UHR_TEXTE.digital_zeigt[0]), digitalSag(spielZeit(x)));
    return sagU(...teile);
  }
  async function spielJetzt() {
    const d = new Date(), echt = d.getHours() * 60 + d.getMinutes();
    const u = R.uhr, meine = R;
    // im Spiel ohne 24 Stunden reicht die Zeit auf dem Zifferblatt
    const ziel = R.tag ? u.t + mod(echt - uhrNorm(u.t), 1440) - (mod(echt - uhrNorm(u.t), 1440) > 720 ? 1440 : 0) : u.naechste(echt);
    await u.zu(ziel, 1200);
    if (R !== meine || Math.round(u.t) !== Math.round(ziel)) return;   // Yuna hat dazwischen gedreht
    spielZeigen(u.t);
    spielVorlesen(u.t, istFuenf(echt) ? [txt(UHR_TEXTE.jetzt_genau[0])] : []);
  }

  /* =====================================================================
     RUNDEN
     Eine Aufgabe ist { typ, art, t }. Die Zeit t wird erst gewürfelt, wenn
     die Aufgabe drankommt; so passen auch Wiederholungen dazwischen.
     ===================================================================== */
  let R = null;

  // Welche Arten in den Antworten vorkommen dürfen (nicht mehr, als Yuna schon kennt)
  function erlaubteArten() {
    if (R.art === 'ueben') return new Set(UHR_STATIONEN.filter(s => geschafft(s.nr)).flatMap(s => s.arten).filter(a => a !== 'minute'));
    const st = R.st;
    if (st.digital) return new Set(st.arten.concat(st.wdh || []).filter(a => a !== 'minute'));
    return new Set(UHR_STATIONEN.filter(s => !s.digital && s.nr <= st.nr).flatMap(s => s.arten));
  }
  const hilfenJetzt = () => (R.art === 'station' ? R.st.hilfen : []);
  const schrittJetzt = a => (a.typ.startsWith('m-') ? 1 : R.art === 'station' ? R.st.schritt : a.art === 'voll' ? 60 : 5);

  // Eine Zeit für eine Aufgabe würfeln, nicht doppelt in der Runde
  function zeitFuer(a) {
    const minuten = a.art === 'minute' ? range(60).filter(m => m % 5) : UHR_ARTEN[a.art];
    const tag = a.typ.startsWith('tz');
    for (let v = 0; v < 80; v++) {
      let t;
      if (tag) {
        // Tag und Nacht: am liebsten mit einer Geschichte aus Capys Tag
        const sz = szeneFuer(minuten);
        if (sz && Math.random() < 0.7) { a.szene = sz.szene; t = sz.t; }
        else { a.szene = null; t = rnd(0, 23) * 60 + pick(minuten); }
      } else {
        t = rnd(1, 12) * 60 + pick(minuten);
      }
      if (!R.benutzt.has(t720(t)) || v > 60) { R.benutzt.add(t720(t)); return t; }
    }
    return 180;
  }
  function szeneFuer(minuten) {
    const moegliche = [];
    for (const szene of UHR_SZENEN) {
      for (const [von, bis] of szene.zeit) {
        for (let t = von; t <= bis; t++) if (minuten.includes(t % 60) && t < 1440) moegliche.push({ szene, t });
      }
    }
    return moegliche.length ? pick(moegliche) : null;
  }

  // Zwei falsche Zeiten zum Auswählen. Zuerst eine typische Verwechslung:
  // eine Stunde daneben (halb vier ↔ halb drei), Seite vertauscht (nach ↔ vor),
  // oder nur der lange Zeiger gelesen.
  // spaeter: Wort → Uhr (Hören); dort wählt man bei halb eher die Uhr eine Stunde zu spät
  function ablenker(t, erlaubt, n = 2, spaeter = false) {
    t = t720(t);
    const h = Math.floor(t / 60), m = t % 60, kand = [], schon = new Set([t]);
    const dazu = (x, grund) => {
      x = mod(x, 720);
      if (schon.has(x) || !erlaubt.has(uhrArt(x))) return;
      schon.add(x);
      kand.push({ t: x, grund: grund || '' });
    };
    const typisch = [];
    typisch.push([m >= 25 && !spaeter ? t - 60 : t + 60, 'stunde']);
    if (m !== 0 && m !== 30) typisch.push([m < 25 ? h * 60 - m : m > 35 ? (h + 1) * 60 + 60 - m : h * 60 + 60 - m, 'seite']);
    typisch.push([(Math.round(m / 5) || 12) * 60, 'zeiger']);
    // Bei halb und vor ist «eine Stunde zu früh» der häufigste Fehler: der kommt immer dran
    (m >= 25 ? typisch : shuffle(typisch)).forEach(([x, g]) => dazu(x, g));
    [t + 60, t - 60, t + 120].forEach(x => dazu(x));
    for (const art of shuffle([...erlaubt])) for (const mm of UHR_ARTEN[art] || []) dazu(h * 60 + mm);
    for (let i = 0; i < 40 && kand.length < n + 2; i++) dazu(rnd(1, 12) * 60 + pick(UHR_ARTEN[pick([...erlaubt])]));
    const erste = kand.filter(k => k.grund).slice(0, 1);
    return erste.concat(shuffle(kand.filter(k => !erste.includes(k))).slice(0, n - erste.length));
  }
  // Was Capy zu einer Verwechslung sagt
  function grundSatz(grund, t) {
    const m = t720(t) % 60;
    if (grund === 'stunde' && m >= 25) return txt(UHR_TEXTE[m >= 40 ? 'f_vor' : 'f_halb'][0]);
    if (grund === 'seite') return txt(UHR_TEXTE[m === 25 || m === 35 ? 'f_umhalb' : 'f_seite'][0]);
    if (grund === 'zeiger') return txt(UHR_TEXTE.f_zeiger[0]);
    return null;
  }

  /* ---------- Pläne ---------- */
  function planStation(nr) {
    const st = station(nr), plan = st.lern.map(l => ({ typ: 'lern', l }));
    st.typen.forEach((typ, i) => {
      const wdh = st.wdh && i % 3 === 2;
      plan.push({ typ, art: pick(wdh ? st.wdh : st.arten) });
    });
    if (st.paare) plan.push({ typ: st.paare });
    return plan;
  }
  // Üben: was am wackligsten ist und am längsten her, aus allen geschafften Stationen
  function planUeben() {
    const heute = tagHeute(), kand = new Map();
    for (const s of UHR_STATIONEN.filter(x => geschafft(x.nr))) {
      for (const typ of new Set(s.typen)) {
        if (typ === 'hoeren' && !tonAn()) continue;
        for (const art of s.arten) {
          const a = { typ, art }, k = schluessel(a), it = uz.arten[k] || { k: 0, z: 0 };
          kand.set(typ + ':' + art, { ...a, wert: (5 - it.k) * 3 + Math.min(10, heute - it.z) + Math.random() * 4 });
        }
      }
    }
    const liste = [...kand.values()].sort((a, b) => b.wert - a.wert), plan = [], jeTyp = {};
    for (const a of liste) {
      if (plan.length >= 10) break;
      if ((jeTyp[a.typ] = (jeTyp[a.typ] || 0) + 1) > 3) continue;
      plan.push({ typ: a.typ, art: a.art });
    }
    shuffle(plan);
    plan.unshift({ typ: 'ueben-start' });
    const digital = UHR_STATIONEN.some(s => s.digital && geschafft(s.nr));
    plan.push({ typ: digital ? 'paare-digital' : 'paare-wort' });
    return plan;
  }
  function starteStation(nr) {
    audio();
    R = { art: 'station', nr, st: station(nr), plan: planStation(nr), i: -1, fehler: 0, tipps: 0, nochmal: new Map(), angesagt: new Set(), benutzt: new Set() };
    naechste();
  }
  function starteUeben() {
    if (!Object.keys(uz.stationen).length) return;
    audio();
    R = { art: 'ueben', plan: planUeben(), i: -1, fehler: 0, tipps: 0, nochmal: new Map(), angesagt: new Set(), benutzt: new Set() };
    naechste();
  }
  // Was daneben ging, kommt in derselben Runde nochmal (mit einer anderen Zeit),
  // je Aufgabe höchstens zweimal und in einer Runde höchstens viermal, damit sie nicht endlos wird
  function nochmalSpaeter(a) {
    if (!a.art) return;
    const k = a.typ + ':' + a.art, n = R.nochmal.get(k) || 0;
    if (n >= 2 || [...R.nochmal.values()].reduce((x, y) => x + y, 0) >= 4) return;
    R.nochmal.set(k, n + 1);
    const ende = R.plan.length && R.plan[R.plan.length - 1].typ.startsWith('paare') ? R.plan.length - 1 : R.plan.length;
    R.plan.splice(Math.min(ende, R.i + 3), 0, { typ: a.typ, art: a.art });
  }
  // Anweisung beim ersten Mal sprechen, danach nur zeigen
  function ersteMal(art) {
    const neu = !R.angesagt.has(art);
    R.angesagt.add(art);
    return neu;
  }

  function naechste() {
    if (!R || !R.plan) return;
    R.i++;
    Object.assign(R, { gesperrt: false, fehlerHier: false, tippHier: false, versuche: 0, optionen: null, uhr: null, ziel: null, eingabe: null, paarWahl: null });
    if (R.i >= R.plan.length) { rundeEnde(); return; }
    const a = R.plan[R.i];
    if (a.typ === 'hoeren' && !tonAn()) a.typ = 'lesen';
    if (a.art && a.t === undefined) a.t = zeitFuer(a);
    R.a = a;
    const zeige = {
      lern: zeigeLern, 'ueben-start': zeigeUebenStart,
      lesen: zeigeLesen, 'd-lesen': zeigeLesen,
      stellen: zeigeStellen, 'd-stellen': zeigeStellen, 'tz-stellen': zeigeStellen, 'm-stellen': zeigeStellen,
      hoeren: zeigeHoeren,
      'd-tippen': zeigeTippen, 'tz-tippen': zeigeTippen, 'm-tippen': zeigeTippen,
      'tz-wahl': zeigeDigitalWahl, 'm-wahl': zeigeDigitalWahl, 'tz-lesen': zeigeTzLesen,
      'paare-wort': zeigePaare, 'paare-digital': zeigePaare,
    }[a.typ];
    zeige(a);
    if (a.t !== undefined) Stimme.vorladen([sprechtext(uhrEsIst(Math.round(a.t / 5) * 5)), sprechtext(uhrStell(Math.round(a.t / 5) * 5))]);
  }

  // Grundgerüst einer Aufgabe: Fortschritt oben, Bühne (Uhr), Seite (Antworten)
  function geruest(klasse, buehne, seite, { tipp = true } = {}) {
    R.seit = performance.now();
    const zahl = R.plan.length, i = Math.max(0, R.i);
    inhalt.className = 'uhr-inhalt ansicht-runde';
    inhalt.innerHTML = `
      <div class="u-kopf">
        <button class="round u-x" type="button" data-aktion="karte" aria-label="Runde beenden">${ICON.zu}</button>
        <div class="u-fortschritt"><i style="width:${Math.round(i / zahl * 100)}%"></i></div>
        <button class="u-tipp" type="button" data-aktion="tipp" aria-label="Tipp"${tipp ? '' : ' hidden'}>${ICON.birne}<span>Tipp</span></button>
      </div>
      <div class="u-aufgabe ${klasse}">
        <div class="u-buehne">${buehne}</div>
        <div class="u-seite">${seite}</div>
      </div>`;
  }
  const weiterKnopf = (text = 'Weiter') => `<button class="go u-weiter" type="button" data-aktion="weiter">${text} ${ICON.weiter}</button>`;
  // Nach einer richtigen Antwort sofort «Weiter» zeigen: Es geht auch von selbst weiter, wenn Capy
  // fertig ist (und der Kuckuck gerufen hat), aber Yuna muss nie warten, und nichts kann hängen bleiben.
  function weiterZeigen() {
    const seite = inhalt.querySelector('.u-seite');
    if (!seite || seite.querySelector('[data-aktion=weiter]')) return;
    const ersetzen = seite.querySelector('.u-ok, .u-pad');
    if (ersetzen) ersetzen.outerHTML = `<div class="u-dann">${weiterKnopf()}</div>`;
    else seite.insertAdjacentHTML('beforeend', `<div class="u-dann">${weiterKnopf()}</div>`);
  }
  const okKnopf = () => `<button class="go u-ok" type="button" data-aktion="pruefen" aria-label="Prüfen">${ICON.ok}</button>`;
  const szeneHtml = sz => (sz ? `<div class="u-szene"><span class="u-szene-bild">${sz.bild}</span><span>${esc(sz.t)}</span></div>` : '');
  // Wenn die Runde inzwischen weiter ist, nichts mehr tun
  const gilt = (meine, a) => R === meine && R.a === a;

  /* ----- Erklären ----- */
  const DEMOS = {
    zeiger: async (u, gilt) => { u.setzen(180); await warte(500); if (!gilt()) return; u.hervor('h'); await warte(1600); if (!gilt()) return; u.hervor('m'); await warte(1600); if (gilt()) u.hervor('h', 'm'); },
    kurz: async u => { u.setzen(180); u.hervor('h', 'zahlen'); },
    lang: async (u, gilt) => { u.setzen(180); u.hervor('m'); await warte(700); if (gilt()) await u.zu(240, 2600); },
    rundum: async (u, gilt) => {
      u.setzen(60); u.hervor('m');
      await warte(700); if (!gilt()) return; await u.zu(120, 2400); if (!gilt()) return; u.hervor('h', 2);
      await warte(700); if (!gilt()) return; u.hervor('m'); await u.zu(180, 2400); if (gilt()) u.hervor('h', 3);
    },
    voll: async (u, gilt) => { u.setzen(180); u.hervor('m', 12); await warte(1700); if (!gilt()) return; u.hervor('h', 3); await warte(2600); if (gilt()) u.kuckuck(3); },
    halb: async (u, gilt) => { u.setzen(180); await warte(800); if (gilt()) { u.hervor('m'); await u.zu(210, 3000); } if (gilt()) u.hervor(6); },
    halbkurz: async (u, gilt) => { u.setzen(210); u.hervor('h'); await warte(1800); if (gilt()) u.hervor('h', 3, 4); },
    halbmerk: async u => { u.setzen(210); u.hervor(4); },
    viertel: async (u, gilt) => { u.hilfen(['viertel']); u.setzen(180); await warte(400); if (gilt()) u.hervor(12, 3, 6, 9); },
    vnach: async (u, gilt) => { u.setzen(180); await warte(700); if (gilt()) { u.hervor('m'); await u.zu(195, 2200); } if (gilt()) u.hervor(3); },
    nachseite: async u => { u.setzen(195); u.hervor('nach'); },
    vvor: async (u, gilt) => { u.setzen(180); await warte(700); if (gilt()) { u.hervor('m'); await u.zu(225, 3200); } if (gilt()) u.hervor(9, 12); },
    vorseite: async u => { u.setzen(225); u.hervor('vor', 4); },
    alleviertel: async (u, gilt) => { u.setzen(180); for (const t of [195, 210, 225, 240]) { await warte(700); if (!gilt()) return; await u.zu(t, 1000); } },
    fuenf: async (u, gilt) => { u.setzen(180); u.hervor('mzahlen'); for (const t of [185, 190, 195, 200]) { await warte(650); if (!gilt()) return; await u.zu(t, 500); u.hervor('m' + (t - 180)); } },
    nach: async (u, gilt) => { u.setzen(180); u.hervor('nach'); for (const t of [185, 190, 195, 200]) { await warte(900); if (!gilt()) return; await u.zu(t, 600); } },
    vor: async (u, gilt) => { u.setzen(215); u.hervor('vor'); for (const t of [220, 225, 230, 235]) { await warte(900); if (!gilt()) return; await u.zu(t, 600); } },
    umhalb: async (u, gilt) => { u.setzen(200); u.hervor(6); for (const t of [205, 210, 215]) { await warte(1100); if (!gilt()) return; await u.zu(t, 700); } },
    fuenfvorhalb: async u => { u.setzen(205); u.hervor(6, 'm'); },
    alle: async (u, gilt) => { u.setzen(180); for (const t of [190, 465, 685, 775]) { await warte(800); if (!gilt()) return; await u.zu(u.t + mod(t - u.t, 720), 1400); } },
    digital: async u => { u.setzen(180); },
    digitalteile: async (u, gilt, d) => { u.setzen(180); d.hervor('h'); await warte(2600); if (gilt()) d.hervor('m'); },
    digitalhalb: async (u, gilt, d) => { u.setzen(180); await warte(900); if (gilt()) await u.zu(210, 2600); if (gilt()) d.hervor('h'); },
    digitalvnach: async (u, gilt) => { u.setzen(180); await warte(700); if (gilt()) await u.zu(195, 1800); },
    digitalvvor: async (u, gilt, d) => { u.setzen(195); await warte(700); if (gilt()) await u.zu(225, 2200); if (gilt()) d.hervor('h'); },
    digitalminuten: async u => { u.setzen(225); u.hervor('m45', 'm'); },
    tag: async (u, gilt) => { u.setzen(0); await warte(700); if (gilt()) await u.zu(1439, 9000); },
    nachmittag: async (u, gilt) => { u.setzen(11 * 60); for (const t of [12, 13, 14, 15]) { await warte(700); if (!gilt()) return; await u.zu(t * 60, 1300); } },
    plus12: async u => { u.setzen(15 * 60); },
    striche: async (u, gilt) => { u.setzen(205); u.hervor('striche'); for (const t of [206, 207, 208, 209, 210]) { await warte(700); if (!gilt()) return; await u.zu(t, 350); } },
    minutegenau: async (u, gilt) => { u.setzen(205); u.hervor('m25'); for (const t of [206, 207]) { await warte(1500); if (!gilt()) return; await u.zu(t, 500); } },
    minutedigital: async u => { u.setzen(207); },
  };
  function zeigeLern(a) {
    const st = R.st, l = a.l, digital = st.digital, tag = st.tag;
    geruest('typ-lern', `<div class="u-uhr-platz" id="uhrPlatz"></div>${digital ? '<div class="u-neben" id="lernDig"></div>' : ''}`,
      weiterKnopf(), { tipp: false });
    // Die Digitaluhr daneben folgt den Zeigern (bei Tag und Nacht über 24 Stunden)
    const dig = { hervor: w => { const e = $('lernDig'); if (e) e.querySelectorAll('.dig').forEach(x => x.dataset.hl = w); } };
    const neben = t => {
      const e = $('lernDig');
      if (!e) return;
      const x = Math.round(t), hl = e.querySelector('.dig') ? e.querySelector('.dig').dataset.hl : '';
      e.innerHTML = digitalMarkup(tag ? uhrNorm(x) : zwoelfer(x), 'mittel') + (tag ? himmelMarkup(uhrNorm(x)) : '');
      if (hl) e.querySelector('.dig').dataset.hl = hl;
    };
    R.uhr = neueUhr($('uhrPlatz'), { haus: true, t: 180, hilfen: st.hilfen, onZiehen: digital ? neben : null });
    const meine = R;
    const zeigen = () => DEMOS[l.demo](R.uhr, () => gilt(meine, a), dig);
    R.hoeren = () => { zeigen(); return sagU(txt(l.t)); };
    R.hoeren();
  }
  function zeigeUebenStart() {
    geruest('typ-lern', `<div class="u-uhr-platz" id="uhrPlatz"></div>`, weiterKnopf('Los!'), { tipp: false });
    R.uhr = neueUhr($('uhrPlatz'), { haus: true, t: 10 * 60 + 10 });
    R.hoeren = () => sagU(txt(ziehU('ueben_start')));
    R.hoeren();
  }

  /* ----- Uhr lesen (und Digitaluhr lesen): drei Zeiten zur Wahl ----- */
  function zeigeLesen(a) {
    const digital = a.typ === 'd-lesen', t = digital ? zwoelfer(a.t) : a.t;
    const opts = shuffle([{ t, ok: true }].concat(ablenker(t, erlaubteArten())));
    const buehne = digital ? `<div class="u-dig-platz">${digitalMarkup(t, 'gross')}</div>` : '<div class="u-uhr-platz" id="uhrPlatz"></div>';
    geruest('typ-lesen' + (digital ? ' typ-digital' : ''), buehne,
      `<div class="u-optionen">${opts.map((o, i) => `<button class="u-wahl" type="button" data-i="${i}">${esc(uhrZeitwort(o.t))}</button>`).join('')}</div>`);
    if (!digital) R.uhr = neueUhr($('uhrPlatz'), { haus: true, t, hilfen: hilfenJetzt() });
    R.optionen = opts;
    R.ziel = t;
    const frage = ziehU(digital ? 'd_lesen' : 'lesen');
    R.hoeren = () => sagU(txt(frage));
    if (ersteMal(a.typ)) R.hoeren(); else zeigeText(txt(frage));
  }

  /* ----- Hören: welche Uhr passt? ----- */
  function zeigeHoeren(a) {
    const t = a.t, opts = shuffle([{ t, ok: true }].concat(ablenker(t, erlaubteArten(), 2, true)));
    geruest('typ-hoeren',
      `<div class="u-uhren3">${opts.map((o, i) => `<button class="u-wahl-uhr" type="button" data-i="${i}" aria-label="Uhr ${i + 1}">${miniUhr(o.t)}</button>`).join('')}</div>`,
      `<button class="u-hoer" type="button" data-aktion="hoeren" aria-label="Nochmal hören">${ICON.ton}<span>Nochmal hören</span></button>`);
    R.optionen = opts;
    R.ziel = t;
    const frage = ziehU('hoeren');
    const satz = { html: '🔊', s: [sprechtext(uhrEsIst(t))] };
    R.hoeren = () => sagU(txt(frage), satz);
    R.nurHoeren = () => sprich(null, satz.s);
    if (ersteMal('hoeren')) R.hoeren(); else sagU({ html: esc(anzeigetext(frage)), s: [] }, satz);
  }

  async function wahl(btn) {
    if (!R || R.gesperrt) return;
    const o = R.optionen[+btn.dataset.i], a = R.a, meine = R, t = R.ziel;
    const digitalAntwort = a.typ === 'tz-wahl' || a.typ === 'm-wahl';
    if (a.typ === 'tz-lesen' && $('tzHimmel')) $('tzHimmel').classList.add('auf');
    if (o.ok) {
      R.gesperrt = true;
      btn.classList.add('richtig');
      Ton.richtig();
      capyMag('happy');
      if (R.uhr) R.uhr.richtig();
      merken(schluessel(a), !R.fehlerHier);
      weiterZeigen();
      const lob = txt(zieh(R.fehlerHier ? 'ok_nachfehler' : 'ok'));
      let teile;
      if (a.typ === 'tz-lesen') teile = [lob, txt(uhrTageszeit(t).satz), esIst(t)];
      else if (digitalAntwort) teile = [lob, digitalSag(t)];
      else if (a.typ === 'd-lesen') teile = [lob, digitalSag(t), esIst(t)];
      else teile = [lob, esIst(t)];
      await sagU(...teile);
      if (!gilt(meine, a)) return;
      if (R.uhr && a.art === 'voll' && !digitalAntwort) await R.uhr.kuckuck(t720(t) / 60 || 12);
      if (gilt(meine, a)) setTimeout(() => { if (gilt(meine, a)) naechste(); }, 300);
      return;
    }
    // Daneben: das Richtige zeigen, und dieselbe Art kommt später nochmal
    if (R.fehlerHier) return;
    Object.assign(R, { fehlerHier: true, gesperrt: true });
    R.fehler++;
    btn.classList.add('falsch');
    Ton.falsch();
    capyMag('oops', 800);
    if (R.uhr) R.uhr.wackeln();
    merken(schluessel(a), false);
    const richtigIndex = R.optionen.findIndex(x => x.ok);
    inhalt.querySelector(`[data-i="${richtigIndex}"]`).classList.add('loesung');
    nochmalSpaeter(a);
    inhalt.querySelector('.u-seite').insertAdjacentHTML('beforeend', `<div class="u-dann">${weiterKnopf()}</div>`);
    const falsch = txt(ziehU('falsch'));
    if (a.typ === 'tz-lesen') sagU(falsch, txt(uhrTageszeit(t).satz), esIst(t), o.grund === 'tag' ? txt(UHR_TEXTE.f_tageszeit[0]) : null);
    else if (a.typ === 'tz-wahl') {
      const grund = o.grund === 'plus12' ? 'f_plus12' : o.grund === 'tag' ? 'f_tageszeit' : t % 60 >= 25 ? 'f_digital_halb' : 't_stunde';
      sagU(falsch, esIst(t), digitalSag(t), txt(UHR_TEXTE[grund][0]));
    }
    else if (a.typ === 'm-wahl') sagU(falsch, digitalSag(t), o.grund === 'stunde' ? txt(UHR_TEXTE.t_stunde[0]) : txt(UHR_TEXTE.f_striche[0]));
    else if (a.typ === 'd-lesen') {
      // nur die Digitaluhr ist zu sehen: nichts über Zeiger sagen
      sagU(falsch, digitalSag(t), esIst(t), o.grund === 'stunde' && t720(t) % 60 >= 25 ? txt(UHR_TEXTE.f_digital_halb[0]) : null);
    } else if (a.typ === 'hoeren' && o.grund === 'stunde') {
      // eine Stunde zu spät gewählt: wo der kurze Zeiger hingehört
      sagU(falsch, esIst(t), txt(uhrKurzSatz(t)));
    } else sagU(falsch, esIst(t), grundSatz(o.grund, t));
  }

  /* ----- Uhr stellen: Zeiger drehen, dann ✓ ----- */
  function zeigeStellen(a) {
    const typ = a.typ, digital = typ !== 'stellen', tag = typ === 'tz-stellen';
    // Bei der Zeigeruhr manchmal mit einer kleinen Geschichte aus Capys Tag
    if (typ === 'stellen' && a.szene === undefined) {
      a.szene = null;
      const sz = Math.random() < 0.35 && szeneFuer(UHR_ARTEN[a.art] || []);
      if (sz && !R.benutzt.has(t720(sz.t))) { a.szene = sz.szene; a.t = sz.t; R.benutzt.add(t720(sz.t)); }
    }
    const t = tag ? a.t : zwoelfer(a.t);
    const start = t720(t) < 60 ? 6 * 60 : 12 * 60;
    let seite;
    if (!digital) seite = `<div class="u-auftrag">${szeneHtml(a.szene)}<span class="u-auftrag-zeit">${esc(uhrZeitwort(t))}</span></div>${okKnopf()}`;
    else seite = `<div class="u-auftrag">${tag ? szeneHtml(a.szene) : ''}<span class="u-auftrag-dig">${digitalMarkup(t, 'mittel')}${tag ? himmelMarkup(t) : ''}</span></div>${okKnopf()}`;
    geruest('typ-stellen', '<div class="u-uhr-platz" id="uhrPlatz"></div>', seite);
    R.uhr = neueUhr($('uhrPlatz'), { haus: true, t: start, stellbar: true, schritt: schrittJetzt(a), hilfen: hilfenJetzt() });
    R.ziel = t;
    const erstes = !uz.gestellt && ersteMal('stellen_erste') ? txt(UHR_TEXTE.stellen_erste[0]) : null;
    if (!digital) R.hoeren = () => sagU(a.szene ? txt(a.szene.t) : null, stell(t), erstes);
    else {
      const frage = ziehU({ 'd-stellen': 'd_stellen', 'tz-stellen': 'tz_stellen', 'm-stellen': 'm_stellen' }[typ]);
      R.hoeren = () => sagU(tag && a.szene ? txt(a.szene.t) : null, txt(frage), digitalSag(t), erstes);
    }
    R.hoeren();
  }
  async function pruefeStellen() {
    if (!R || R.gesperrt || !R.uhr) return;
    const a = R.a, meine = R, u = R.uhr;
    const ist = t720(u.t), soll = t720(R.ziel);
    if (ist === soll) {
      R.gesperrt = true;
      u.stellbar = false;
      Ton.richtig();
      capyMag('happy');
      u.richtig();
      u.geist(soll, []);
      merken(schluessel(a), !R.fehlerHier);
      weiterZeigen();
      await sagU(txt(zieh(R.fehlerHier ? 'ok_nachfehler' : 'ok')), istFuenf(soll) ? esIst(soll) : digitalSag(R.ziel));
      if (!gilt(meine, a)) return;
      if (soll % 60 === 0) await u.kuckuck(soll / 60 || 12);
      if (gilt(meine, a)) setTimeout(() => { if (gilt(meine, a)) naechste(); }, 300);
      return;
    }
    R.versuche++;
    if (!R.fehlerHier) { R.fehlerHier = true; R.fehler++; merken(schluessel(a), false); nochmalSpaeter(a); }
    Ton.falsch();
    capyMag('oops', 800);
    u.wackeln();
    if (R.versuche >= 3) {
      // Capy zeigt es vor
      R.gesperrt = true;
      u.stellbar = false;
      u.geist(soll, []);
      inhalt.querySelector('.u-ok').outerHTML = weiterKnopf();
      sagU(txt(UHR_TEXTE.s_loesung[0]), istFuenf(soll) ? esIst(soll) : digitalSag(R.ziel));
      await u.zu(u.naechste(soll), 1400);
      return;
    }
    sagU(...stellTipps(ist, soll, R.versuche === 1));
    if (R.versuche >= 2) {
      const mOk = ist % 60 === soll % 60;
      u.geist(soll, mOk ? ['h'] : ['h', 'm']);
    }
  }
  // Was Capy sagt, wenn die Zeiger noch nicht stimmen
  function stellTipps(ist, soll, erstes) {
    const teile = [], mSoll = soll % 60, a = R.a;
    if (erstes) teile.push(txt(ziehU('s_nochmal')));
    if (ist % 60 === mSoll) {
      teile.push(txt(UHR_TEXTE.s_lang_ok[0]));
      const hIst = Math.floor(ist / 60), hSoll = Math.floor(soll / 60);
      if (mod(hIst - hSoll, 12) === 1 && mSoll >= 25 && !a.typ.startsWith('d-') && !a.typ.startsWith('tz') && !a.typ.startsWith('m-')) {
        teile.push(txt(UHR_TEXTE[mSoll >= 40 ? 'f_vor' : 'f_halb'][0]));
      }
      if (a.typ === 'tz-stellen' && R.ziel >= 13 * 60) teile.push(txt(UHR_TEXTE.f_minus12[0]));
      teile.push(txt(uhrKurzSatz(soll)));
    } else if (mSoll % 5) {
      teile.push(txt(uhrMinutenSatz(Math.floor(mSoll / 5))), txt(UHR_TEXTE.f_striche[0]));
    } else {
      teile.push(txt(uhrLangSatz(mSoll / 5 || 12)));
    }
    return teile;
  }

  /* ----- Zeit eintippen (Digitaluhr) ----- */
  function zeigeTippen(a) {
    const tag = a.typ === 'tz-tippen', t = tag ? a.t : zwoelfer(a.t);
    const vorne = tag ? `<div class="u-auftrag">${a.szene ? szeneHtml(a.szene) : ''}${himmelMarkup(t)}</div>` : '';
    geruest('typ-tippen', '<div class="u-uhr-platz" id="uhrPlatz"></div>', `${vorne}
      <div class="dig eingabe" id="digEin"><button type="button" class="dig-feld dig-h" data-feld="h" aria-label="Stunden"></button><span class="dig-p">:</span><button type="button" class="dig-feld dig-m" data-feld="m" aria-label="Minuten"></button></div>
      <div class="pad u-pad">${[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map(k => `<button class="key" type="button" data-k="${k}">${k}</button>`).join('')}
        <button class="key back" type="button" data-k="back" aria-label="Löschen">${ICON.back}</button>
        <button class="key ok" type="button" data-k="ok" aria-label="Prüfen">${ICON.ok}</button></div>`);
    R.uhr = neueUhr($('uhrPlatz'), { haus: true, t, hilfen: hilfenJetzt() });
    R.ziel = t;
    R.eingabe = { h: '', m: '', feld: 'h', max: tag ? 23 : 12 };
    eingabeZeichnen();
    let frage;
    if (tag) {
      frage = ziehU('tz_tippen');
      R.hoeren = () => sagU(a.szene ? txt(a.szene.t) : txt(uhrTageszeit(t).satz), esIst(t), txt(frage));
    } else {
      frage = ziehU(a.typ === 'm-tippen' ? 'm_tippen' : 'd_tippen');
      R.hoeren = () => sagU(txt(frage));
    }
    if (tag || ersteMal(a.typ)) R.hoeren(); else zeigeText(txt(frage));
  }
  function eingabeZeichnen() {
    const E = R.eingabe, box = $('digEin');
    if (!E || !box) return;
    for (const f of ['h', 'm']) {
      const el = box.querySelector('.dig-' + f), wert = E[f];
      el.classList.toggle('aktiv', E.feld === f && !R.gesperrt);
      el.classList.toggle('leer', !wert);
      el.innerHTML = esc(wert) + (E.feld === f && !R.gesperrt && wert.length < 2 ? '<span class="caret"></span>' : '');
    }
  }
  function feldWackeln(f) {
    const el = $('digEin') && $('digEin').querySelector('.dig-' + f);
    if (!el) return;
    el.classList.remove('wackelt');
    void el.offsetWidth;
    el.classList.add('wackelt');
  }
  function eingabeZiffer(d) {
    const E = R.eingabe;
    if (!E || R.gesperrt) return;
    if (E.feld === 'h') {
      if (E.h === '') {
        E.h = d;
        if (+d * 10 > E.max) E.feld = 'm';
      } else if (+(E.h + d) <= E.max) {
        E.h += d;
        E.feld = 'm';
      } else {
        // passt nicht mehr zur Stunde: gehört schon zu den Minuten
        E.feld = 'm';
        eingabeZiffer(d);
        return;
      }
    } else {
      // «1 0 7» meint 1:07: eine Minute fängt nie mit 6–9 an, die 0 gehört also zu den Minuten
      if (E.m === '' && +d > 5 && E.h.length === 2 && E.h[1] <= '5') { E.m = E.h[1] + d; E.h = E.h[0]; Ton.tipp(); eingabeZeichnen(); return; }
      if (E.m.length >= 2 || (E.m === '' && +d > 5)) { feldWackeln('m'); Ton.falsch(); return; }
      E.m += d;
    }
    Ton.tipp();
    eingabeZeichnen();
  }
  function eingabeLoeschen() {
    const E = R.eingabe;
    if (!E || R.gesperrt) return;
    if (E.feld === 'm' && E.m) E.m = E.m.slice(0, -1);
    else { E.feld = 'h'; E.h = E.h.slice(0, -1); }
    Ton.tipp();
    eingabeZeichnen();
  }
  async function pruefeTippen() {
    const E = R.eingabe, a = R.a, meine = R;
    if (!E || R.gesperrt) return;
    if (!E.h) { feldWackeln('h'); E.feld = 'h'; eingabeZeichnen(); return; }
    // Drei Ziffern wie auf der Uhr («1:05», «0:30»): Stimmt die Stunde mit einer Ziffer, gehört die zweite zu den Minuten
    if (E.h.length === 2 && E.m.length === 1) {
      const h1 = +E.h[0], hz = Math.floor(R.ziel / 60);
      if (a.typ === 'tz-tippen' ? h1 === hz : h1 % 12 === hz % 12) { E.m = E.h[1] + E.m; E.h = E.h[0]; }
    }
    if (E.m.length < 2) {
      feldWackeln('m');
      E.feld = 'm';
      eingabeZeichnen();
      if (E.m.length === 1) sagU(txt(UHR_TEXTE.f_ziffern[0]));
      return;
    }
    const h = +E.h, m = +E.m, soll = R.ziel, tag = a.typ === 'tz-tippen';
    const ok = m === soll % 60 && (tag ? h === Math.floor(soll / 60) : h % 12 === Math.floor(soll / 60) % 12);
    if (ok) {
      R.gesperrt = true;
      eingabeZeichnen();
      $('digEin').classList.add('richtig');
      Ton.richtig();
      capyMag('happy');
      R.uhr.richtig();
      merken(schluessel(a), !R.fehlerHier);
      weiterZeigen();
      await sagU(txt(zieh(R.fehlerHier ? 'ok_nachfehler' : 'ok')), digitalSag(soll));
      if (gilt(meine, a)) setTimeout(() => { if (gilt(meine, a)) naechste(); }, 300);
      return;
    }
    R.versuche++;
    if (!R.fehlerHier) { R.fehlerHier = true; R.fehler++; merken(schluessel(a), false); nochmalSpaeter(a); }
    Ton.falsch();
    capyMag('oops', 800);
    $('digEin').classList.remove('wackelt');
    void $('digEin').offsetWidth;
    $('digEin').classList.add('wackelt');
    if (R.versuche >= 3) {
      R.gesperrt = true;
      E.h = String(Math.floor(soll / 60));
      E.m = String(soll % 60).padStart(2, '0');
      eingabeZeichnen();
      $('digEin').classList.add('loesung');
      inhalt.querySelector('.u-pad').outerHTML = `<div class="u-dann">${weiterKnopf()}</div>`;
      sagU(txt(UHR_TEXTE.t_loesung[0]), digitalSag(soll));
      return;
    }
    // Was stimmt nicht?
    const teile = [], mSoll = soll % 60, hSoll = Math.floor(soll / 60);
    if (m !== mSoll) {
      teile.push(txt(UHR_TEXTE.t_minuten[0]));
      teile.push(txt(uhrMinutenSatz(Math.floor(mSoll / 5) || 12)));
      if (mSoll % 5) teile.push(txt(UHR_TEXTE.f_striche[0]));
      E.m = '';
      E.feld = 'm';
    }
    if (tag ? h !== hSoll : h % 12 !== hSoll % 12) {
      if (tag && hSoll >= 13 && h === hSoll - 12) teile.unshift(txt(UHR_TEXTE.f_plus12[0]));
      else if (tag && h % 12 === hSoll % 12) teile.unshift(txt(UHR_TEXTE.f_tageszeit[0]));   // Vormittag ↔ Abend, 12 ↔ 0
      else if (mod(h - hSoll, 12) === 1 && mSoll >= 25) teile.unshift(txt(UHR_TEXTE.f_digital_halb[0]));
      else teile.unshift(txt(UHR_TEXTE.t_stunde[0]));
      E.h = '';
      E.feld = 'h';
    }
    eingabeZeichnen();
    sagU(...teile);
  }

  /* ----- Welche Digitaluhr passt? (Tag und Nacht, Minuten) ----- */
  function zeigeDigitalWahl(a) {
    const tag = a.typ === 'tz-wahl', t = tag ? a.t : zwoelfer(a.t), m = t % 60;
    const kand = [];
    const dazu = (x, grund) => { x = tag ? uhrNorm(x) : zwoelfer(x); if (x !== t && !kand.some(k => k.t === x)) kand.push({ t: x, grund }); };
    if (tag) {
      dazu(t >= 720 ? t - 720 : t + 720, t >= 13 * 60 ? 'plus12' : 'tag');
      dazu(m >= 25 ? t + 60 : t - 60, 'stunde');
      dazu(t + 120, 'stunde');
    } else {
      if (m % 5) dazu(t - 2 * (m % 5), 'striche');
      dazu(t + (m >= 30 ? 60 : -60), 'stunde');
      dazu(t + 5, 'striche');
      dazu(t - 5, 'striche');
    }
    const opts = shuffle([{ t, ok: true }].concat(kand.slice(0, 2)));
    const vorne = tag ? `<div class="u-auftrag">${a.szene ? szeneHtml(a.szene) : ''}${himmelMarkup(t)}</div>` : '';
    geruest('typ-digwahl', '<div class="u-uhr-platz" id="uhrPlatz"></div>',
      `${vorne}<div class="u-optionen dig-optionen">${opts.map((o, i) => `<button class="u-wahl dig-wahl" type="button" data-i="${i}">${digitalMarkup(o.t, 'mittel')}</button>`).join('')}</div>`);
    R.uhr = neueUhr($('uhrPlatz'), { haus: true, t, hilfen: hilfenJetzt() });
    R.optionen = opts;
    R.ziel = t;
    const frage = ziehU(tag ? 'tz_wahl' : 'm_wahl');
    R.hoeren = tag
      ? () => sagU(a.szene ? txt(a.szene.t) : txt(uhrTageszeit(t).satz), esIst(t), txt(frage))
      : () => sagU(txt(frage));
    if (tag || ersteMal(a.typ)) R.hoeren(); else zeigeText(txt(frage));
  }

  /* ----- Digitaluhr mit 24 Stunden lesen: wann ist das? ----- */
  function zeigeTzLesen(a) {
    const t = a.t;
    const satz = x => esc(uhrZeitwort(x)) + ' ' + esc(uhrTageszeit(x).name);
    const kand = [];
    const dazu = (x, grund) => {
      x = uhrNorm(x);
      if (x !== t && !kand.some(k => satz(k.t) === satz(x)) && satz(x) !== satz(t)) kand.push({ t: x, grund });
    };
    dazu(t + 720, 'tag');
    dazu(t % 60 >= 25 ? t - 60 : t + 60, 'stunde');
    dazu(t + 720 + 60, 'tag');
    const opts = shuffle([{ t, ok: true }].concat(kand.slice(0, 2)));
    geruest('typ-lesen typ-digital', `<div class="u-dig-platz">${digitalMarkup(t, 'gross')}<span class="u-himmel-zu" id="tzHimmel">${himmelMarkup(t)}</span></div>`,
      `<div class="u-optionen">${opts.map((o, i) => `<button class="u-wahl" type="button" data-i="${i}">${satz(o.t)}</button>`).join('')}</div>`);
    R.optionen = opts;
    R.ziel = t;
    const frage = ziehU('tz_lesen');
    R.hoeren = () => sagU(txt(frage));
    if (ersteMal(a.typ)) R.hoeren(); else zeigeText(txt(frage));
  }

  /* ----- Paare: Uhr ↔ Zeit in Worten (oder Digitaluhr) ----- */
  function zeigePaare(a) {
    const digital = a.typ === 'paare-digital';
    let arten = [...erlaubteArten()];
    if (R.art === 'station' && R.st.arten.includes('minute')) arten = ['minute'];
    const zeiten = [];
    for (let v = 0; v < 200 && zeiten.length < 4; v++) {
      const art = pick(arten), ms = art === 'minute' ? range(60).filter(m => m % 5) : UHR_ARTEN[art];
      const t = rnd(1, 12) * 60 + pick(ms);
      // jede Zeit und jede Stunde nur einmal, damit man genau hinschauen muss, aber nicht raten
      if (!zeiten.some(x => t720(x) === t720(t) || (Math.floor(x / 60) === Math.floor(t / 60) && v < 120))) zeiten.push(t);
    }
    if (zeiten.length < 2) { naechste(); return; }
    const links = shuffle(zeiten.slice()), rechts = shuffle(zeiten.slice());
    geruest('typ-paare', `<div class="u-paare">
        <div class="u-spalte">${links.map(t => `<button class="u-paar uhr-p" type="button" data-p="${t}" aria-label="Uhr">${miniUhr(t)}</button>`).join('')}</div>
        <div class="u-spalte">${rechts.map(t => `<button class="u-paar ${digital ? 'digital-p' : 'wort-p'}" type="button" data-p="${t}">${digital ? digitalMarkup(t, 'mittel') : esc(uhrZeitwort(t))}</button>`).join('')}</div>
      </div>`, '', { tipp: false });
    R.paareOffen = zeiten.length;
    R.paarWahl = null;
    R.hoeren = () => sagU(txt(UHR_TEXTE.paare[0]));
    R.hoeren();
  }
  async function paar(btn) {
    if (!R || btn.disabled) return;
    const seite = b => (b.classList.contains('uhr-p') ? 'uhr' : 'zeit');
    if (!R.paarWahl || seite(R.paarWahl) === seite(btn)) {
      if (R.paarWahl) R.paarWahl.classList.remove('gewaehlt');
      R.paarWahl = btn;
      btn.classList.add('gewaehlt');
      Ton.tipp();
      // Eine Zeit in Worten liest Capy vor (hilft beim Lesen, verrät aber keine Uhr)
      if (btn.classList.contains('wort-p')) Stimme.einwurf([sprechtext(uhrEsIst(+btn.dataset.p))]);
      return;
    }
    const erste = R.paarWahl;
    R.paarWahl = null;
    erste.classList.remove('gewaehlt');
    if (erste.dataset.p === btn.dataset.p) {
      [erste, btn].forEach(x => { x.disabled = true; x.classList.add('richtig'); });
      Ton.richtig();
      capyMag('happy', 700);
      R.paareOffen--;
      const t = +btn.dataset.p, meine = R, a = R.a;
      const sag = R.a.typ === 'paare-digital' ? digitalSag(t) : esIst(t);
      if (R.paareOffen > 0) { sagU(sag); return; }
      await sagU(sag, txt(UHR_TEXTE.paare_ende[0]));
      if (gilt(meine, a)) naechste();
      return;
    }
    [erste, btn].forEach(x => { x.classList.remove('wackelt'); void x.offsetWidth; x.classList.add('wackelt'); });
    Ton.falsch();
    capyMag('oops', 700);
    if (!R.fehlerHier) { R.fehlerHier = true; R.fehler++; }
    sagU(txt(UHR_TEXTE.paar_falsch[0]));
  }

  /* ----- Glühbirne: Hilfen auf der Uhr und ein Tipp von Capy ----- */
  function tipp() {
    if (!R || !R.a || R.gesperrt) return;
    const a = R.a, t = R.ziel;
    if (t === null || t === undefined) return;
    Ton.tipp();
    if (!R.tippHier) { R.tippHier = true; R.tipps++; }
    const art = uhrArt(t);
    // Bei fünf vor/nach halb passt «rechts nach, links vor» nicht: da hilft das Kuchenstück
    if (R.uhr) R.uhr.hilfen(art === 'umhalb' ? ['minuten', 'kuchen'] : ['seiten', 'minuten', 'kuchen']);
    if (a.typ.endsWith('stellen')) {
      // die Uhr zeigt noch eine andere Zeit: sagen, wo die Zeiger hingehören
      const m = t720(t) % 60;
      sagU(m % 5 ? txt(uhrMinutenSatz(Math.floor(m / 5))) : txt(uhrLangSatz(m / 5 || 12)), txt(uhrKurzSatz(t)));
      return;
    }
    if (a.typ === 'tz-lesen') {
      const h = $('tzHimmel');
      if (h) h.classList.add('auf');
      sagU(txt(UHR_TEXTE.f_tageszeit[0]));
      return;
    }
    const teile = [], m = t720(t) % 60;
    const digital = a.typ.startsWith('d-') || a.typ.startsWith('tz') || a.typ.startsWith('m-');
    if (digital) teile.push(txt(UHR_TEXTE.tipp_digital[0]));
    if (!digital || a.typ.startsWith('m-')) teile.push(txt(UHR_TEXTE['tipp_' + art][0]));
    else {
      // Digitaluhr: Die Stunde ist die, an der der kurze Zeiger schon vorbei ist; die Minuten zeigen die lila Zahlen.
      // (Die Tipps zur Zeigeruhr führten hier zur nächsten Stunde.)
      if (a.typ.startsWith('tz') && uhrNorm(t) >= 13 * 60) teile.push(txt(UHR_TEXTE.f_plus12[0]));
      else if (a.typ.startsWith('tz') && uhrNorm(t) < 60) teile.push(txt(UHR_TEXTE.f_tageszeit[0]));
      if (m >= 25) teile.push(txt(UHR_TEXTE.f_digital_halb[0]));
      if (m && a.typ !== 'd-lesen') teile.push(txt(uhrMinutenSatz(m / 5)));
    }
    sagU(...teile);
  }

  /* ----- Ende der Runde ----- */
  async function rundeEnde() {
    const r = R, wert = r.fehler + r.tipps / 2;
    const sterne = wert <= 1 ? 3 : wert <= 4 ? 2 : 1;
    let m;
    if (r.art === 'station') {
      const erstes = !geschafft(r.nr);
      m = erstes ? 3 : 1;
      uz.stationen[r.nr] = { sterne: Math.max(sterne, geschafft(r.nr) ? uz.stationen[r.nr].sterne : 0) };
    } else m = 2;
    if (r.fehler === 0) m++;
    m = Math.min(4, m);
    uz.runden++;
    uz.heute = tagHeute();
    sichern();
    stand.mandarinen += m;
    speichern();
    mandarinenZeigen();
    Ton.fertig();
    konfetti();
    capyMag('happy', 2200);
    inhalt.className = 'uhr-inhalt ansicht-runde';
    inhalt.innerHTML = `
      <div class="u-ende">
        <div class="u-ende-uhr" id="uhrPlatz"></div>
        <div class="ende-sterne">${'<span class="an">★</span>'.repeat(sterne)}${'<span>★</span>'.repeat(3 - sterne)}</div>
        <p class="u-titel">${r.art === 'station' ? 'Station ' + r.nr + ' geschafft!' : 'Gut geübt!'}</p>
        <p class="ende-m">+${m} ${ICON.mandarine}</p>
        <button class="go u-weiter" type="button" data-aktion="karte">Zur Karte ${ICON.weiter}</button>
      </div>`;
    R = { art: 'ende', seit: performance.now() };
    // Der Kuckuck ruft für jeden Stern einmal
    const d = new Date(), u = neueUhr($('uhrPlatz'), { haus: true, t: (d.getHours() % 12 || 12) * 60 });
    u.kuckuck(sterne);
    // Nach einer schwierigen Runde: Dranbleiben hat sich gelohnt (aus Capys Sätzen in texte.js)
    await sagU(txt(sterne === 1 ? zieh('fertig_muehsam') : ziehU(r.art === 'station' ? 'station_ende' : 'ueben_ende')));
    if (R && R.art === 'ende') sagU(txt(UHR_TEXTE.mandarinen[m]));
  }

  /* ---------- Tippen in der Ecke ---------- */
  inhalt.addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b || b.disabled) return;
    const aktion = b.dataset.aktion;
    // Karte
    if (inhalt.classList.contains('ansicht-karte')) {
      if (b.dataset.st) {
        const nr = +b.dataset.st;
        if (!offen(nr)) { Ton.tipp(); capyMag('oops', 800); sagU(txt(UHR_TEXTE.gesperrt[0])); return; }
        Ton.tipp();
        starteStation(nr);
      } else if (aktion === 'weiter') { Ton.tipp(); const akt = aktuelle(); if (akt) starteStation(akt.nr); else starteUeben(); }
      else if (aktion === 'ueben') { Ton.tipp(); starteUeben(); }
      else if (aktion === 'spielen') { Ton.tipp(); zeigeSpielen(); }
      return;
    }
    // Ein Doppeltipp soll nicht auf der Seite landen, die gerade erst aufgegangen ist
    if (R && R.seit && performance.now() - R.seit < 400) return;
    // Zurück zur Karte: kein Begrüssen, und nach der letzten Station keine «leuchtende Uhr»
    if (aktion === 'karte') { Ton.tipp(); zeigeKarte(false); sagU(txt(aktuelle() ? ziehU('karte_zurueck') : UHR_TEXTE.karte_fertig[0])); return; }
    if (!R) return;
    if (R.art === 'spielen') {
      if (aktion === 'vorlesen') { Ton.tipp(); spielVorlesen(R.uhr.t); }
      else if (aktion === 'jetzt') { Ton.tipp(); spielJetzt(); }
      return;
    }
    if (aktion === 'weiter') { Ton.tipp(); naechste(); return; }
    if (aktion === 'tipp') { tipp(); return; }
    if (aktion === 'pruefen') { pruefeStellen(); return; }
    if (aktion === 'hoeren') { if (R.nurHoeren) R.nurHoeren(); else if (R.hoeren) R.hoeren(); return; }
    // Tipp auf ein Feld: neu eintippen
    if (b.dataset.feld && R.eingabe && !R.gesperrt) { R.eingabe.feld = b.dataset.feld; R.eingabe[b.dataset.feld] = ''; Ton.tipp(); eingabeZeichnen(); return; }
    if (b.dataset.k !== undefined) {
      const k = b.dataset.k;
      if (k === 'back') eingabeLoeschen();
      else if (k === 'ok') pruefeTippen();
      else eingabeZiffer(k);
      return;
    }
    if (b.classList.contains('u-wahl') || b.classList.contains('u-wahl-uhr')) { wahl(b); return; }
    if (b.classList.contains('u-paar')) paar(b);
  });

  /* =====================================================================
     BEI CAPY: Knopf oben mit der echten Zeit, Knopf auf der Begrüssung,
     und einmal am Tag erinnert Capy an die Uhr.
     ===================================================================== */
  const kopfKnopf = $('uhrKnopf');
  function kopfKnopfZeichnen() {
    const d = new Date();
    if (kopfKnopf) kopfKnopf.innerHTML = iconUhr(d.getHours() * 60 + d.getMinutes());
    if (!ecke.hidden) titelUhr();
  }
  if (kopfKnopf) {
    kopfKnopf.hidden = false;
    kopfKnopf.addEventListener('click', () => { kopfKnopf.classList.remove('lockt'); auf(); });
  }
  kopfKnopfZeichnen();
  setInterval(kopfKnopfZeichnen, 20000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) kopfKnopfZeichnen(); });
  const losUhr = $('losUhr');
  if (losUhr) {
    losUhr.hidden = false;
    losUhr.innerHTML = `${iconUhr(3 * 60 + 30)} Uhr lernen`;
    losUhr.addEventListener('click', () => {
      karte(null);                  // die Begrüssungskarte (index.html) schliessen
      Besuch.start();
      auf();
    });
  }

  // Nach einer fertigen Pyramide, einmal pro Besuch, wenn heute noch keine Uhr dran war.
  // Erfüllt sich mit false, wenn etwas anderes dazwischenkam (wie meldung()).
  TEXTE.tipp_uhr = UHR_CAPY.tipp;
  let erinnert = false;
  function erinnern() {
    if (erinnert || uz.heute === tagHeute() || stand.solved % 4 !== 2 || !ecke.hidden) return Promise.resolve(true);
    erinnert = true;
    if (kopfKnopf) {
      kopfKnopf.classList.remove('lockt');
      void kopfKnopf.offsetWidth;
      kopfKnopf.classList.add('lockt');
    }
    return sag(zieh('tipp_uhr'));
  }

  /* ---------- Elternbereich: Uhr für sich löschen ---------- */
  const parents = document.querySelector('#regeln .parents');
  if (parents) {
    const knopf = document.createElement('button');
    knopf.type = 'button';
    knopf.id = 'uhrReset';
    parents.appendChild(knopf);
    let scharf = false;
    const beschriften = () => {
      knopf.textContent = scharf ? 'Uhr wirklich löschen? Nochmal tippen.' : 'Uhr-Fortschritt löschen';
      knopf.hidden = !Object.keys(uz.stationen).length && !Object.keys(uz.arten).length;
    };
    beschriften();
    $('help').addEventListener('click', () => { scharf = false; beschriften(); });
    knopf.addEventListener('click', () => {
      if (!scharf) { scharf = true; beschriften(); return; }
      Object.assign(uz, { stationen: {}, arten: {}, runden: 0, digital: false });
      sichern();
      scharf = false;
      knopf.textContent = 'Uhr gelöscht.';   // verschwindet beim nächsten Öffnen des Elternbereichs
    });
  }

  // zustand(): nur zum Nachschauen (Tests, Fehlersuche), ändert nichts
  const zustand = () => (!R ? null : {
    art: R.art, i: R.i, typ: R.a ? R.a.typ : '', zeitart: R.a ? R.a.art : '', ziel: R.ziel, gesperrt: !!R.gesperrt,
    fehler: R.fehler, laenge: R.plan ? R.plan.length : 0, uhr: R.uhr ? Math.round(R.uhr.t) : null,
    richtig: R.optionen ? R.optionen.findIndex(o => o.ok) : -1, eingabe: R.eingabe || null,
  });
  // stellen(t): nur für Tests, dreht die Zeiger der offenen Aufgabe
  const testStellen = t => { if (R && R.uhr) R.uhr.setzen(t); };
  window.Uhr = { auf, erinnern, zustand, testStellen };
})();
