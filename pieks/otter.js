'use strict';

/* =====================================================================
   OTTER: Pieks' Freund, ein Zwergotter aus einem Reisfeld auf Java.
   Von Hand gezeichnet wie Pieks und das Hörnchen (flache Flächen, keine
   Umrisse, Pieks' Augen), im selben Koordinatensystem (viewBox 0 -24 200 224)
   und auf denselben Ankerpunkten: Augen (77,104) und (123,104), Scheitel
   y 58, Pfoten (72,168) und (128,168), Füsse auf y 192, Drehpunkt (100,195).
   Oben hat der Kopf genau den Umriss des Hörnchens, darum passt ihm die
   ganze Garderobe aus grafik.js; was bei ihm anders sitzt, steht in
   ITEM_OTTER. Unten hat er breitere Backen wie ein echter Otter, und die
   kleinen runden Ohren sitzen tief seitlich am Kopf.
   Unten links (x < 25, y > 95) bleibt leer: auf der Bühne steht dort der
   kleine Pieks. Mimik und Bewegungen stehen in otter.css. Sein Name steht
   nur in texte.js (OTTER).
   ===================================================================== */

// Farbverlauf des Schwanzes: an der Wurzel dunkler, damit sich Körper und Fuss davor abheben,
// zur Spitze hin heller. Kennungen gelten im ganzen Dokument, darum ot-.
const OTTER_DEFS = `
  <linearGradient id="ot-sw" x1="118" y1="192" x2="196" y2="148" gradientUnits="userSpaceOnUse">
    <stop offset="0" stop-color="#674529"/><stop offset=".45" stop-color="#86603F"/><stop offset="1" stop-color="#97704D"/>
  </linearGradient>`;

/* Der Otter von vorne. Gesichtsausdrücke über Klassen am <svg>:
   froh · oops · kitzel · spricht · schlaeft, dazu die Bewegungen
   dreht · schuettelt · jongliert. Der Mund folgt beim Sprechen
   wie bei Pieks der CSS-Variable --mund (0 … 1).
   Wie ein echter Zwergotter hat er braunes Fell, ein helles Kinn, helle
   Backen und Kehle, zwei Schnurrhaarpolster mit Punkten, eine grosse
   dunkle Nase, kurze Beine mit Schwimmhäuten und winzige Krallen. Ein
   wenig nass ist er immer: der Glanz auf dem Kopf, der Wirbel oben.
   Lagen von hinten nach vorne: Schwanz (liegt rechts am Boden, die Spitze
   biegt sich hoch), Körper mit heller Kehle, Kopf, Plätze für Augen und
   Hals, Tropfen und Kiesel für seine Bewegungen (sonst versteckt), Pfoten,
   Plätze für Pfote und Kopf.
   Jede Bewegung hat ihre eigene Gruppe, damit keine die andere abbricht:
   ot-ganz die Stimmung (atmen, hüpfen, wackeln), ot-dreh die Drehung und
   das Schütteln, ot-schweif Freude, ot-wiegt das stete Wiegen. */
function otterSVG(extra = '') {
  // Ein Ohr, klein und rund, tief seitlich am Kopf wie beim echten Otter; das zweite ist dasselbe, gespiegelt
  const ohr = `
        <ellipse cx="46.6" cy="90" rx="11.6" ry="10.6" transform="rotate(-24 46.6 90)" fill="#86603F"/>
        <ellipse cx="44.8" cy="90.6" rx="6" ry="5.2" transform="rotate(-24 44.8 90.6)" fill="#E8A296"/>`;
  // Schnurrhaare: drei je Seite, hell wie seine Backen
  const haare = `
        <path d="M50 137.5 Q40 134.5 30 136"/><path d="M49 143 Q39 143 29 146.5"/><path d="M51 148.5 Q43 150.5 36 155.5"/>`;
  // Ein Fuss mit Schwimmhäuten (die Zehen als Bögen am Rand); der zweite ist derselbe, verschoben
  const fuss = 'M66.4 192.4 C66 188.2 72 185.4 80 185.4 C88 185.4 94 188.2 93.6 192.4 C93.4 195.4 91.8 197.6 89.4 197.8 C88 198.8 85.8 198.8 84.8 197.9 C83.4 199 81.2 199.1 80 198.1 C78.8 199.1 76.6 199 75.2 197.9 C74.2 198.8 72 198.8 70.6 197.8 C68.2 197.6 66.6 195.4 66.4 192.4 Z';
  // Tropfen, wenn er sich trocken schüttelt: rund um den Kopf, die Spitze zeigt zu ihm zurück
  // (x, y, Drehung, Grösse). Unten links bleibt frei, dort steht auf der Bühne der kleine Pieks.
  const tropfen = [[28, 76, 115, 1], [46, 40, 142, .85], [82, 26, 168, 1.1], [130, 30, -159, .9], [164, 50, -133, 1.1],
    [178, 92, -103, .85], [172, 124, -79, 1], [26, 90, 105, .8], [62, 24, 156, .6], [148, 26, -150, .65], [190, 68, -114, .6],
    [18, 58, 124, .6]].map(([x, y, r, s]) => `
      <path transform="translate(${x} ${y}) rotate(${r}) scale(${s})" d="M0 -6 C2.6 -2.4 4 0 4 2.2 C4 4.6 2.2 6.2 0 6.2 C-2.2 6.2 -4 4.6 -4 2.2 C-4 0 -2.6 -2.4 0 -6 Z"/>`).join('');
  return `<svg class="otter ${extra}" viewBox="0 -24 200 224" aria-hidden="true" focusable="false">
  <g class="ot-ganz"><g class="ot-dreh">
    <g class="ot-schweif"><g class="ot-wiegt">
      <path d="M118 160 C134 170 158 178 174 175 C183 173 187 164 188.5 150 C188.8 147 191.6 145.6 193 148.4 C197.5 160 197 176 188 186 C176 197.5 150 199.6 116 197 Z" fill="url(#ot-sw)"/>
      <path d="M124 166.4 C139 175.4 160 181 174.4 178.2 C182.6 176.6 186.8 168.6 189 157 C189.4 168.4 185.6 178.2 176 182.2 C161 187.6 140 182 124 166.4 Z" fill="#AB8460"/>
    </g></g>
    <g class="ot-koerper">
      <path d="M100 118 C117 118 127 130 131 146 C136 165 139 194 100 194 C61 194 64 165 69 146 C73 130 83 118 100 118 Z" fill="#86603F"/>
      <ellipse cx="100" cy="171" rx="21" ry="21" fill="#F6EDDD"/>
      <path class="ot-fuss" d="${fuss}" fill="#5B3F28"/>
      <path class="ot-fuss" d="${fuss}" fill="#5B3F28" transform="translate(40 0)"/>
    </g>
    <g class="ot-kopf">${ohr}
      <g transform="translate(200 0) scale(-1 1)">${ohr}
      </g>
      <path d="M90.6 61.6 C90.2 57 91.6 53.6 94.6 52 Q95.6 51.6 95.4 52.8 C95 54.6 95.4 56.4 96.6 57.8 C97.4 53.2 100 49.6 104.4 48 Q105.6 47.6 105.2 48.8 C104.4 51.4 104.6 54.2 105.8 56.6 C107 54.6 109 53.2 111.6 52.8 Q112.8 52.6 112.2 53.6 C111.2 55.4 111.2 57.8 112 59.8 L113 61.6 C105.4 59.4 98 59.4 90.6 61.6 Z" fill="#86603F"/>
      <path d="M98.6 57.4 Q99.8 51.8 104 48.6 Q101.8 52.6 100.8 57.4 Z" fill="#AB8460" opacity=".8"/>
      <path d="M100 58 C127 58 149 72 156 96 C160 110 165 128 160 141 C154 156 126 164.5 100 164.5 C74 164.5 46 156 40 141 C35 128 40 110 44 96 C51 72 73 58 100 58 Z" fill="#86603F"/>
      <path d="M57.5 87 C61 75 71.5 66 86 61.6 C76.5 67.6 68.5 75.4 63.6 88.4 Z" fill="#9C7552"/>
      <path d="M100 130 C107 120.5 123 116 137 119.5 C150 123 158 133 155 142.5 C149 156 124 164.5 100 164.5 C76 164.5 51 156 45 142.5 C42 133 50 123 63 119.5 C77 116 93 120.5 100 130 Z" fill="#F6EDDD"/>
      <ellipse cx="88.5" cy="145" rx="13.5" ry="10.5" fill="#FFFCF7"/>
      <ellipse cx="111.5" cy="145" rx="13.5" ry="10.5" fill="#FFFCF7"/>
      <g fill="#D9C6B0">
        <circle cx="82.6" cy="141" r="1.2"/><circle cx="79.8" cy="145.8" r="1.2"/><circle cx="84.2" cy="148.6" r="1.2"/>
        <circle cx="117.4" cy="141" r="1.2"/><circle cx="120.2" cy="145.8" r="1.2"/><circle cx="115.8" cy="148.6" r="1.2"/>
      </g>
      <g class="ot-brauen" fill="none" stroke="#2F1E14" stroke-width="3.2" stroke-linecap="round">
        <path d="M65 90 Q75 87 86 80"/><path d="M114 80 Q125 87 135 90"/>
      </g>
      <g class="ot-augen">
        <ellipse cx="77" cy="104" rx="8.4" ry="10.4" fill="#2B1A10"/>
        <ellipse cx="123" cy="104" rx="8.4" ry="10.4" fill="#2B1A10"/>
        <circle cx="80.2" cy="99.8" r="3.2" fill="#fff"/><circle cx="126.2" cy="99.8" r="3.2" fill="#fff"/>
        <circle cx="74.8" cy="108.5" r="1.4" fill="#fff" opacity=".8"/><circle cx="120.8" cy="108.5" r="1.4" fill="#fff" opacity=".8"/>
      </g>
      <g class="ot-augen-froh" fill="none" stroke="#2B1A10" stroke-width="3.6" stroke-linecap="round">
        <path d="M68 107 Q77 96 86 107"/><path d="M114 107 Q123 96 132 107"/>
      </g>
      <g class="ot-augen-zu" fill="none" stroke="#2B1A10" stroke-width="3.2" stroke-linecap="round">
        <path d="M68 104 Q77 111 86 104"/><path d="M114 104 Q123 111 132 104"/>
      </g>
      <g class="ot-augen-kneif" fill="none" stroke="#2B1A10" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round">
        <path d="M70 97.4 L84 104 L70 110.6"/><path d="M130 97.4 L116 104 L130 110.6"/>
      </g>
      <g class="ot-mund-auf">
        <path d="M87 147.6 Q93.6 152.6 100 148.4 Q106.4 152.6 113 147.6 Q112.4 161.6 100 162.6 Q87.6 161.6 87 147.6 Z" fill="#6E2A22"/>
        <ellipse cx="100" cy="158.4" rx="6.4" ry="3.2" fill="#EE7B7F"/>
      </g>
      <path class="ot-mund-zu" d="M87.4 147.6 Q93.8 154.4 100 148.4 Q106.2 154.4 112.6 147.6" stroke="#5A3420" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      <ellipse class="ot-mund-o" cx="100" cy="154" rx="4.6" ry="4.2" fill="#6E2A22"/>
      <path d="M100 142 V148.4" stroke="#5A3420" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M100 144.2 C95.6 144.2 89.4 139.8 89 135.6 C88.7 132.6 92.6 131.4 100 131.4 C107.4 131.4 111.3 132.6 111 135.6 C110.6 139.8 104.4 144.2 100 144.2 Z" fill="#2B1A10"/>
      <ellipse cx="95.4" cy="134.6" rx="3.4" ry="1.8" fill="#fff" opacity=".5"/>
      <ellipse cx="66" cy="133" rx="8.5" ry="5.6" fill="#F59E95" opacity=".7"/>
      <ellipse cx="134" cy="133" rx="8.5" ry="5.6" fill="#F59E95" opacity=".7"/>
      <g fill="none" stroke="#FDF9F2" stroke-width="1.5" stroke-linecap="round">${haare}
        <g transform="translate(200 0) scale(-1 1)">${haare}</g>
      </g>
    </g>
    <g class="slot-augen"></g>
    <g class="slot-hals"></g>
    <g class="ot-tropfen" fill="#8ECFEF">${tropfen}
    </g>
    <g class="ot-stein">
      <ellipse cx="0" cy="0" rx="9" ry="7.4" fill="#B4ADA3"/><ellipse cx="1.8" cy="2.4" rx="6" ry="3.6" fill="#958E85"/>
      <ellipse cx="-3" cy="-2.8" rx="3.2" ry="1.7" fill="#fff" opacity=".55"/>
    </g>
    <g class="ot-haende">
      <ellipse cx="72" cy="168" rx="8.5" ry="9.5" fill="#5B3F28"/>
      <ellipse cx="128" cy="168" rx="8.5" ry="9.5" fill="#5B3F28"/>
      <g fill="#E9DCC9">
        <ellipse cx="68.2" cy="174.4" rx="1.15" ry="1.5"/><ellipse cx="72" cy="175.6" rx="1.15" ry="1.5"/><ellipse cx="75.8" cy="174.4" rx="1.15" ry="1.5"/>
        <ellipse cx="124.2" cy="174.4" rx="1.15" ry="1.5"/><ellipse cx="128" cy="175.6" rx="1.15" ry="1.5"/><ellipse cx="131.8" cy="174.4" rx="1.15" ry="1.5"/>
      </g>
    </g>
    <g class="slot-pfote"></g>
    <g class="slot-kopf"></g>
  </g></g>
</svg>`;
}

/* Garderobe: jedes Teil ist für Pieks gezeichnet und sitzt auch an ihm. Was bei ihm anders
   sitzen muss, rückt anziehen() mit einem <g transform="…"> zurecht (ITEM_SVG bleibt, wie es ist). */
const ITEM_OTTER = {
  schleife: 'translate(-2 22)',                  // auf dem runden Kopf, nicht in der Luft über ihm
  kranz: 'translate(18 16.4) scale(.82)',        // enger, damit er auf dem glatten Kopf aufliegt (die Ohren sitzen tief)
  piratenhut: 'translate(0 5)',                  // tiefer: er hat keine Stacheln, die ihn tragen
  krone: 'translate(0 6)',                       // die Ecken des Reifs liegen auf dem runden Kopf, statt darüber zu schweben
  fliege: 'translate(0 12)',                     // unters Kinn, sonst liegt sie auf dem Mund
  schal: 'translate(0 21) scale(1 .9)',          // unters Kinn; das Ende hängt nicht tiefer als bei Pieks
  medaille: 'translate(20 41.6) scale(.8)',      // das Band beginnt unter dem Kinn statt auf den Backen
  bleistift: 'rotate(66 132 170)',               // neben der Backe statt quer über der Nase
  zauberstab: 'rotate(-62 68 170)',              // der Stern funkelt neben dem Kopf statt vor dem Auge
};

/* =====================================================================
   SYMBOLE fürs Sprite (#sprite), viewBox je Symbol. Wie FRANZ_SYMBOLE
   ist diese Konstante die letzte der Datei: wer sie lesen kann, weiss,
   dass otter.js ganz geladen ist.
   t-indo       sein Gesicht, er schwimmt: das Fach Indonesisch, und in der Blase das Abzeichen
                «er spricht». Der runde Grund lässt sich tönen: --indo-grund am <svg>, das das
                Symbol zeigt; das Wasser davor ist halb durchsichtig und passt so zu jedem Ton.
                Der Kopf ist derselbe wie gross (verkleinert auf .46), nur Augen und Striche sind
                kräftiger, damit er auch als Abzeichen (22 px) noch lacht.
   padi-0 … 5   die Stufen einer Karte im Reisfeld: Reiskorn, Keimling, Pflänzchen, grüne Rispe,
                gelbe Rispe, goldener Reis. Jede Stufe hat ihre eigene Form und Grösse, man erkennt
                sie auch ohne Farbe: Korn auf Erde, Keim mit Blatt, Büschel im Wasser, Rispe
                aufrecht, Rispe geneigt, zwei schwere Rispen mit Funkeln.
   reis         eine reife goldene Reisrispe, schwer nach unten gebogen (wie die Erdbeere beim
                Hörnchen: leeres oder fertiges Beet)
   ===================================================================== */
const OTTER_SYMBOLE = `
    <symbol id="t-indo" viewBox="0 0 80 80">
      <circle cx="40" cy="42" r="34" fill="#CFEDEA" style="fill: var(--indo-grund, #CFEDEA)"/>
      <g transform="translate(-6 -6.9) scale(.46)">
        <ellipse cx="46.6" cy="90" rx="11.6" ry="10.6" transform="rotate(-24 46.6 90)" fill="#86603F"/>
        <ellipse cx="44.8" cy="90.6" rx="6" ry="5.2" transform="rotate(-24 44.8 90.6)" fill="#E8A296"/>
        <ellipse cx="153.4" cy="90" rx="11.6" ry="10.6" transform="rotate(24 153.4 90)" fill="#86603F"/>
        <ellipse cx="155.2" cy="90.6" rx="6" ry="5.2" transform="rotate(24 155.2 90.6)" fill="#E8A296"/>
        <path d="M90.6 61.6 C90.2 57 91.6 53.6 94.6 52 Q95.6 51.6 95.4 52.8 C95 54.6 95.4 56.4 96.6 57.8 C97.4 53.2 100 49.6 104.4 48 Q105.6 47.6 105.2 48.8 C104.4 51.4 104.6 54.2 105.8 56.6 C107 54.6 109 53.2 111.6 52.8 Q112.8 52.6 112.2 53.6 C111.2 55.4 111.2 57.8 112 59.8 L113 61.6 C105.4 59.4 98 59.4 90.6 61.6 Z" fill="#86603F"/>
        <path d="M100 58 C127 58 149 72 156 96 C160 110 165 128 160 141 C154 156 126 164.5 100 164.5 C74 164.5 46 156 40 141 C35 128 40 110 44 96 C51 72 73 58 100 58 Z" fill="#86603F"/>
        <path d="M57.5 87 C61 75 71.5 66 86 61.6 C76.5 67.6 68.5 75.4 63.6 88.4 Z" fill="#9C7552"/>
        <path d="M100 130 C107 120.5 123 116 137 119.5 C150 123 158 133 155 142.5 C149 156 124 164.5 100 164.5 C76 164.5 51 156 45 142.5 C42 133 50 123 63 119.5 C77 116 93 120.5 100 130 Z" fill="#F6EDDD"/>
        <ellipse cx="88.5" cy="145" rx="13.5" ry="10.5" fill="#FFFCF7"/><ellipse cx="111.5" cy="145" rx="13.5" ry="10.5" fill="#FFFCF7"/>
        <ellipse cx="77" cy="104" rx="9.2" ry="11.3" fill="#2B1A10"/><ellipse cx="123" cy="104" rx="9.2" ry="11.3" fill="#2B1A10"/>
        <circle cx="80.6" cy="99.2" r="3.8" fill="#fff"/><circle cx="126.6" cy="99.2" r="3.8" fill="#fff"/>
        <path d="M87.4 147.6 Q93.8 154.4 100 148.4 Q106.2 154.4 112.6 147.6 M100 142 V148.4" stroke="#5A3420" stroke-width="3.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M100 144.2 C95.6 144.2 89.4 139.8 89 135.6 C88.7 132.6 92.6 131.4 100 131.4 C107.4 131.4 111.3 132.6 111 135.6 C110.6 139.8 104.4 144.2 100 144.2 Z" fill="#2B1A10"/>
        <ellipse cx="95.4" cy="134.6" rx="3.4" ry="1.8" fill="#fff" opacity=".5"/>
        <ellipse cx="66" cy="133" rx="8.5" ry="5.6" fill="#F59E95" opacity=".7"/><ellipse cx="134" cy="133" rx="8.5" ry="5.6" fill="#F59E95" opacity=".7"/>
        <path d="M50 137.5 Q40 134.5 30 136 M49 143 Q39 143 29 146.5 M150 137.5 Q160 134.5 170 136 M151 143 Q161 143 171 146.5" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round"/>
      </g>
      <path d="M19.34 69 Q22.8 67 26.2 69 T33.1 69 T40 69 T46.9 69 T53.8 69 T60.66 69 A34 34 0 0 1 19.34 69 Z" fill="#2E8C9A" opacity=".38"/>
      <path d="M23 72 Q25.4 70.9 27.8 72 M46.4 72.8 Q48.8 71.7 51.2 72.8" stroke="#fff" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".7"/>
    </symbol>
    <symbol id="padi-0" viewBox="0 0 24 24">
      <path d="M2.5 21.5 C3.6 15.4 7.4 12.8 12 12.8 C16.6 12.8 20.4 15.4 21.5 21.5 Z" fill="#A9784A"/>
      <circle cx="6.4" cy="19" r=".9" fill="#8F6238"/><circle cx="17.6" cy="18" r=".9" fill="#8F6238"/><circle cx="15.6" cy="20.4" r=".7" fill="#8F6238"/>
      <g transform="translate(11.6 15.4) rotate(-24)">
        <path d="M-5.6 0 C-2.8 -3 2.8 -3 5.6 0 C2.8 3 -2.8 3 -5.6 0 Z" fill="#EBC25C"/>
        <path d="M-4.2 .5 Q0 -.5 4.2 .5" stroke="#C4932E" stroke-width=".8" fill="none" stroke-linecap="round"/>
        <ellipse cx="-1.4" cy="-1.3" rx="1.9" ry=".6" fill="#fff" opacity=".6"/>
      </g>
    </symbol>
    <symbol id="padi-1" viewBox="0 0 24 24">
      <path d="M4.5 21.5 C5.4 17.6 8.4 15.8 12 15.8 C15.6 15.8 18.6 17.6 19.5 21.5 Z" fill="#A9784A"/>
      <circle cx="7.6" cy="19.8" r=".8" fill="#8F6238"/><circle cx="16.4" cy="19.4" r=".8" fill="#8F6238"/>
      <path d="M12 16.6 C11.6 13 12.2 9.6 13.2 6.2" stroke="#7CCB6A" stroke-width="1.6" fill="none" stroke-linecap="round"/>
      <path d="M11.9 10.8 Q14.7 7.6 18.6 7.4 Q16.1 9.6 12.9 12.4 Z" fill="#5DAA45"/>
      <path d="M11.8 14.3 Q9.2 12.5 7 11.4 Q10 10.7 12.4 12.9 Z" fill="#7CCB6A"/>
      <g transform="translate(10.6 17.2) rotate(-16)">
        <path d="M-4 0 C-2 -2.3 2 -2.3 4 0 C2 2.3 -2 2.3 -4 0 Z" fill="#EBC25C"/>
        <ellipse cx="-1" cy="-.9" rx="1.4" ry=".45" fill="#fff" opacity=".6"/>
      </g>
    </symbol>
    <symbol id="padi-2" viewBox="0 0 24 24">
      <path d="M10 21.4 Q4.5 17.3 3.4 11.4 Q7.5 14.7 12.4 19.4 Z" fill="#7CCB6A"/>
      <path d="M11.6 19.4 Q16.4 14.7 20.6 11 Q19.6 17.3 14 21.4 Z" fill="#7CCB6A"/>
      <path d="M10 20.8 Q6.5 12.6 7.4 5.4 Q10.7 11.4 13.2 20 Z" fill="#5DAA45"/>
      <path d="M10.8 19.9 Q13.5 11.4 16.8 5 Q17.7 12.6 14 20.9 Z" fill="#5DAA45"/>
      <path d="M10.3 20.4 Q10.3 11 12.2 3.2 Q14.9 11 13.7 20.4 Z" fill="#6CBB52"/>
      <path d="M4 20 Q6.7 18.7 9.3 20 Q12 18.7 14.7 20 Q17.3 18.7 20 20 Q20.8 21.6 19.6 22.8 H4.4 Q3.2 21.6 4 20 Z" fill="#8FD0E6"/>
      <path d="M6.4 21.5 H9 M13.6 21.5 H16.4" stroke="#fff" stroke-width=".9" stroke-linecap="round" opacity=".8"/>
    </symbol>
    <symbol id="padi-3" viewBox="0 0 24 24">
      <path d="M10.1 21.4 Q4.1 17.9 2.6 10.6 Q7.1 15.3 12.3 19.4 Z" fill="#5DAA45"/>
      <path d="M11.7 19.4 Q16.9 15.3 21.4 10.6 Q19.9 17.9 13.9 21.4 Z" fill="#5DAA45"/>
      <path d="M10.4 20.9 Q6.8 14.6 6.8 8.4 Q10 13.4 12.8 19.9 Z" fill="#7CCB6A"/>
      <path d="M12 20.4 C12.2 14.4 12.4 9 12.2 3.6" stroke="#5DAA45" stroke-width="1.5" fill="none" stroke-linecap="round"/>
      <g fill="#C3DD74"><path transform="translate(11.7 10.5) rotate(-113)" d="M-3 0 C-1.5 -1.9 1.5 -1.9 3 0 C1.5 1.9 -1.5 1.9 -3 0 Z"/><path transform="translate(11.8 8.5) rotate(-114)" d="M-2.8 0 C-1.4 -1.8 1.4 -1.8 2.8 0 C1.4 1.8 -1.4 1.8 -2.8 0 Z"/><path transform="translate(11.8 6.6) rotate(-114)" d="M-2.6 0 C-1.3 -1.6 1.3 -1.6 2.6 0 C1.3 1.6 -1.3 1.6 -2.6 0 Z"/><path transform="translate(11.8 4.6) rotate(-115)" d="M-2.4 0 C-1.2 -1.5 1.2 -1.5 2.4 0 C1.2 1.5 -1.2 1.5 -2.4 0 Z"/><path transform="translate(12.2 2.6) rotate(-92)" d="M-2.2 0 C-1.1 -1.4 1.1 -1.4 2.2 0 C1.1 1.4 -1.1 1.4 -2.2 0 Z"/></g><g fill="#A2CB5C"><path transform="translate(12.8 9.6) rotate(-65)" d="M-2.9 0 C-1.5 -1.8 1.5 -1.8 2.9 0 C1.5 1.8 -1.5 1.8 -2.9 0 Z"/><path transform="translate(12.8 7.6) rotate(-66)" d="M-2.7 0 C-1.4 -1.7 1.4 -1.7 2.7 0 C1.4 1.7 -1.4 1.7 -2.7 0 Z"/><path transform="translate(12.7 5.6) rotate(-67)" d="M-2.5 0 C-1.3 -1.6 1.3 -1.6 2.5 0 C1.3 1.6 -1.3 1.6 -2.5 0 Z"/><path transform="translate(12.6 3.6) rotate(-68)" d="M-2.3 0 C-1.2 -1.5 1.2 -1.5 2.3 0 C1.2 1.5 -1.2 1.5 -2.3 0 Z"/></g>
      <path d="M2.6 20 Q4.9 18.7 7.3 20 Q9.6 18.7 12 20 Q14.3 18.7 16.7 20 Q19 18.7 21.4 20 Q22.2 21.6 21 22.8 H3 Q1.8 21.6 2.6 20 Z" fill="#8FD0E6"/>
      <path d="M5 21.5 H7.6 M13.6 21.5 H16.4" stroke="#fff" stroke-width=".9" stroke-linecap="round" opacity=".8"/>
    </symbol>
    <symbol id="padi-4" viewBox="0 0 24 24">
      <path d="M9.5 21.4 Q3.4 17.9 2 11 Q6.2 15.3 11.7 19.4 Z" fill="#7DB84E"/>
      <path d="M11.4 19.1 Q16.1 15.9 20.6 16.6 Q17.5 19.3 12.6 21.7 Z" fill="#7DB84E"/>
      <path d="M9.8 20.9 Q6.4 14.6 6.2 8 Q9.6 13.4 12.2 19.9 Z" fill="#9CC75C"/>
      <path d="M11 20.4 C10.6 10 12.6 4.8 16.4 5 C19.2 5.2 20.6 7.8 20.2 11.4" stroke="#A9B84A" stroke-width="1.5" fill="none" stroke-linecap="round"/>
      <g fill="#F6DA72"><path transform="translate(14.1 4.8) rotate(-70)" d="M-3.1 0 C-1.5 -1.9 1.6 -1.9 3.1 0 C1.6 2 -1.5 2 -3.1 0 Z"/><path transform="translate(16.5 4.3) rotate(-37)" d="M-3.1 0 C-1.5 -1.9 1.5 -1.9 3.1 0 C1.5 1.9 -1.5 1.9 -3.1 0 Z"/><path transform="translate(17.8 5.1) rotate(3)" d="M-3 0 C-1.5 -1.9 1.5 -1.9 3 0 C1.5 1.9 -1.5 1.9 -3 0 Z"/><path transform="translate(17.7 4.5) rotate(-20)" d="M-3.1 0 C-1.5 -1.9 1.6 -1.9 3.1 0 C1.6 2 -1.5 2 -3.1 0 Z"/><path transform="translate(20.2 6.8) rotate(26)" d="M-2.8 0 C-1.4 -1.7 1.4 -1.7 2.8 0 C1.4 1.7 -1.4 1.7 -2.8 0 Z"/><path transform="translate(20.8 10.3) rotate(60)" d="M-2.5 0 C-1.2 -1.5 1.2 -1.5 2.5 0 C1.2 1.5 -1.2 1.5 -2.5 0 Z"/><path transform="translate(20.1 12.4) rotate(96)" d="M-2.3 0 C-1.1 -1.4 1.1 -1.4 2.3 0 C1.1 1.4 -1.1 1.4 -2.3 0 Z"/></g><g fill="#E6C24C"><path transform="translate(15.8 5.3) rotate(-6)" d="M-3.1 0 C-1.5 -1.9 1.5 -1.9 3.1 0 C1.5 1.9 -1.5 1.9 -3.1 0 Z"/><path transform="translate(18.8 6.4) rotate(50)" d="M-2.9 0 C-1.5 -1.8 1.5 -1.8 2.9 0 C1.5 1.8 -1.5 1.8 -2.9 0 Z"/><path transform="translate(19.8 8.8) rotate(93)" d="M-2.6 0 C-1.3 -1.6 1.3 -1.6 2.6 0 C1.3 1.6 -1.3 1.6 -2.6 0 Z"/></g>
      <path d="M1.6 20 Q3.7 18.7 5.8 20 Q7.8 18.7 9.9 20 Q12 18.7 14.1 20 Q16.2 18.7 18.2 20 Q20.3 18.7 22.4 20 Q23.2 21.6 22 22.8 H2 Q.8 21.6 1.6 20 Z" fill="#8FD0E6"/>
      <path d="M4 21.5 H6.6 M13.6 21.5 H16.4" stroke="#fff" stroke-width=".9" stroke-linecap="round" opacity=".8"/>
    </symbol>
    <symbol id="padi-5" viewBox="0 0 24 24">
      <path d="M10.8 21.7 Q6.8 19.7 4.4 18.2 Q8 16.3 11.6 19.1 Z" fill="#8DB64A"/>
      <path d="M11.4 19.4 Q14.3 16.1 18 14.6 Q16.9 18.7 13.4 21.4 Z" fill="#8DB64A"/>
      <path d="M12 20.4 C11.8 9 13.2 4.6 16.2 4.6 C19.6 4.6 21.2 8.4 20.4 14.2" stroke="#D3A436" stroke-width="1.5" fill="none" stroke-linecap="round"/>
      <path d="M11 20.4 C10.6 13 9.4 8.8 7 8.8 C4.4 8.8 3 11.6 3.6 16" stroke="#D3A436" stroke-width="1.4" fill="none" stroke-linecap="round"/>
      <g fill="#F7C548"><path transform="translate(15 4) rotate(-66)" d="M-3.2 0 C-1.6 -2 1.6 -2 3.2 0 C1.6 2 -1.6 2 -3.2 0 Z"/><path transform="translate(17.6 4.6) rotate(0)" d="M-3.1 0 C-1.6 -2 1.6 -2 3.1 0 C1.6 2 -1.6 2 -3.1 0 Z"/><path transform="translate(17.5 4) rotate(-26)" d="M-3.2 0 C-1.6 -2 1.6 -2 3.2 0 C1.6 2 -1.6 2 -3.2 0 Z"/><path transform="translate(20.2 6.3) rotate(22)" d="M-2.9 0 C-1.5 -1.8 1.5 -1.8 2.9 0 C1.5 1.8 -1.5 1.8 -2.9 0 Z"/><path transform="translate(21.1 10.1) rotate(54)" d="M-2.6 0 C-1.3 -1.7 1.3 -1.7 2.6 0 C1.3 1.7 -1.3 1.7 -2.6 0 Z"/><path transform="translate(20.3 15.3) rotate(98)" d="M-2.4 0 C-1.2 -1.5 1.2 -1.5 2.4 0 C1.2 1.5 -1.2 1.5 -2.4 0 Z"/><path transform="translate(5.9 9.4) rotate(154)" d="M-2.8 0 C-1.4 -1.8 1.4 -1.8 2.8 0 C1.4 1.8 -1.4 1.8 -2.8 0 Z"/><path transform="translate(4.1 11.9) rotate(90)" d="M-2.5 0 C-1.2 -1.5 1.2 -1.5 2.5 0 C1.2 1.5 -1.2 1.5 -2.5 0 Z"/><path transform="translate(3.7 16.9) rotate(82)" d="M-2.1 0 C-1.1 -1.3 1.1 -1.3 2.1 0 C1.1 1.3 -1.1 1.3 -2.1 0 Z"/></g><g fill="#E2A12A"><path transform="translate(16.7 4.8) rotate(3)" d="M-3.2 0 C-1.6 -2 1.6 -2 3.2 0 C1.6 2 -1.6 2 -3.2 0 Z"/><path transform="translate(18.6 6) rotate(50)" d="M-3.1 0 C-1.5 -1.9 1.5 -1.9 3.1 0 C1.5 1.9 -1.5 1.9 -3.1 0 Z"/><path transform="translate(19.8 8.5) rotate(93)" d="M-2.8 0 C-1.4 -1.8 1.4 -1.8 2.8 0 C1.4 1.8 -1.4 1.8 -2.8 0 Z"/><path transform="translate(20.1 12.5) rotate(116)" d="M-2.5 0 C-1.3 -1.6 1.3 -1.6 2.5 0 C1.3 1.6 -1.3 1.6 -2.5 0 Z"/><path transform="translate(4.1 9.5) rotate(172)" d="M-2.6 0 C-1.3 -1.6 1.3 -1.6 2.6 0 C1.3 1.6 -1.3 1.6 -2.6 0 Z"/><path transform="translate(3 13.9) rotate(122)" d="M-2.3 0 C-1.1 -1.4 1.1 -1.4 2.3 0 C1.1 1.4 -1.1 1.4 -2.3 0 Z"/></g>
      <path d="M1.6 20 Q3.7 18.7 5.8 20 Q7.8 18.7 9.9 20 Q12 18.7 14.1 20 Q16.2 18.7 18.2 20 Q20.3 18.7 22.4 20 Q23.2 21.6 22 22.8 H2 Q.8 21.6 1.6 20 Z" fill="#8FD0E6"/>
      <path d="M4 21.5 H6.6 M13.6 21.5 H16.4" stroke="#fff" stroke-width=".9" stroke-linecap="round" opacity=".8"/>
      <path d="M4.6 1.2 l.8 1.9 1.9 .8 -1.9 .8 -.8 1.9 -.8 -1.9 -1.9 -.8 1.9 -.8 Z" fill="#FFC233"/>
    </symbol>
    <symbol id="reis" viewBox="0 0 40 40">
      <path d="M12.7 38.3 Q3.3 30.4 4.8 15 Q7.9 28.4 16.1 36.9 Z" fill="#8DB64A"/>
      <path d="M15 37.8 C14.2 21 16.6 7.4 24.2 6.6 C31.4 6 35.4 11.6 34.4 23.6" stroke="#C9952C" stroke-width="2" fill="none" stroke-linecap="round"/>
      <path d="M22.4 7.4 C21.8 12 21.8 16.6 23.2 22" stroke="#C9952C" stroke-width="1.3" fill="none" stroke-linecap="round"/>
      <path d="M28 7 C28.8 11.6 28.6 18.4 29 26.6" stroke="#C9952C" stroke-width="1.3" fill="none" stroke-linecap="round"/>
      <g fill="#E2A12A"><path transform="translate(24 7.1) rotate(2)" d="M-3.5 0 C-1.7 -2.1 1.7 -2.1 3.5 0 C1.7 2.1 -1.7 2.1 -3.5 0 Z"/><path transform="translate(27.3 7.3) rotate(28)" d="M-3.4 0 C-1.7 -2.1 1.7 -2.1 3.4 0 C1.7 2.1 -1.7 2.1 -3.4 0 Z"/><path transform="translate(29.9 8.4) rotate(49)" d="M-3.3 0 C-1.6 -2 1.6 -2 3.3 0 C1.6 2 -1.6 2 -3.3 0 Z"/><path transform="translate(31.8 10.4) rotate(71)" d="M-3.1 0 C-1.5 -1.9 1.5 -1.9 3.1 0 C1.5 1.9 -1.5 1.9 -3.1 0 Z"/><path transform="translate(33.2 13.2) rotate(91)" d="M-2.9 0 C-1.5 -1.8 1.5 -1.8 2.9 0 C1.5 1.8 -1.5 1.8 -2.9 0 Z"/><path transform="translate(33.9 17) rotate(105)" d="M-2.8 0 C-1.4 -1.7 1.4 -1.7 2.8 0 C1.4 1.7 -1.4 1.7 -2.8 0 Z"/><path transform="translate(34.1 21.8) rotate(115)" d="M-2.6 0 C-1.3 -1.6 1.3 -1.6 2.6 0 C1.3 1.6 -1.3 1.6 -2.6 0 Z"/><path transform="translate(21.4 12.8) rotate(116)" d="M-3.1 0 C-1.5 -1.9 1.5 -1.9 3.1 0 C1.5 1.9 -1.5 1.9 -3.1 0 Z"/><path transform="translate(21.7 16.7) rotate(110)" d="M-2.8 0 C-1.4 -1.7 1.4 -1.7 2.8 0 C1.4 1.7 -1.4 1.7 -2.8 0 Z"/><path transform="translate(22.4 20.9) rotate(103)" d="M-2.5 0 C-1.3 -1.5 1.3 -1.5 2.5 0 C1.3 1.5 -1.3 1.5 -2.5 0 Z"/><path transform="translate(27.9 11.6) rotate(109)" d="M-3.2 0 C-1.6 -1.9 1.6 -1.9 3.2 0 C1.6 1.9 -1.6 1.9 -3.2 0 Z"/><path transform="translate(28.1 15.5) rotate(112)" d="M-3 0 C-1.5 -1.8 1.5 -1.8 3 0 C1.5 1.8 -1.5 1.8 -3 0 Z"/><path transform="translate(28.3 19.9) rotate(113)" d="M-2.7 0 C-1.4 -1.7 1.4 -1.7 2.7 0 C1.4 1.7 -1.4 1.7 -2.7 0 Z"/><path transform="translate(28.5 24.9) rotate(112)" d="M-2.5 0 C-1.2 -1.5 1.2 -1.5 2.5 0 C1.2 1.5 -1.2 1.5 -2.5 0 Z"/></g><g fill="#F7C548"><path transform="translate(21.7 6.5) rotate(-62)" d="M-3.5 0 C-1.7 -2.1 1.8 -2.1 3.5 0 C1.8 2.1 -1.7 2.1 -3.5 0 Z"/><path transform="translate(25.7 6.4) rotate(-6)" d="M-3.4 0 C-1.7 -2.1 1.7 -2.1 3.4 0 C1.7 2.1 -1.7 2.1 -3.4 0 Z"/><path transform="translate(25.6 5.8) rotate(-29)" d="M-3.5 0 C-1.7 -2.1 1.8 -2.1 3.5 0 C1.8 2.1 -1.7 2.1 -3.5 0 Z"/><path transform="translate(29 6.5) rotate(-10)" d="M-3.3 0 C-1.7 -2 1.7 -2 3.3 0 C1.7 2 -1.7 2 -3.3 0 Z"/><path transform="translate(31.7 8.4) rotate(12)" d="M-3.2 0 C-1.6 -1.9 1.6 -1.9 3.2 0 C1.6 1.9 -1.6 1.9 -3.2 0 Z"/><path transform="translate(33.5 11.1) rotate(34)" d="M-3 0 C-1.5 -1.8 1.5 -1.8 3 0 C1.5 1.8 -1.5 1.8 -3 0 Z"/><path transform="translate(34.6 14.7) rotate(51)" d="M-2.8 0 C-1.4 -1.7 1.4 -1.7 2.8 0 C1.4 1.7 -1.4 1.7 -2.8 0 Z"/><path transform="translate(35.1 19.2) rotate(62)" d="M-2.7 0 C-1.3 -1.6 1.3 -1.6 2.7 0 C1.3 1.6 -1.3 1.6 -2.7 0 Z"/><path transform="translate(34.3 24.7) rotate(95)" d="M-2.5 0 C-1.3 -1.5 1.3 -1.5 2.5 0 C1.3 1.5 -1.3 1.5 -2.5 0 Z"/><path transform="translate(22.6 11) rotate(71)" d="M-3.2 0 C-1.6 -1.9 1.6 -1.9 3.2 0 C1.6 2 -1.6 2 -3.2 0 Z"/><path transform="translate(22.6 14.7) rotate(65)" d="M-2.9 0 C-1.5 -1.8 1.5 -1.8 2.9 0 C1.5 1.8 -1.5 1.8 -2.9 0 Z"/><path transform="translate(23 18.6) rotate(58)" d="M-2.6 0 C-1.3 -1.6 1.3 -1.6 2.6 0 C1.3 1.6 -1.3 1.6 -2.6 0 Z"/><path transform="translate(23.5 23) rotate(75)" d="M-2.4 0 C-1.2 -1.4 1.2 -1.4 2.4 0 C1.2 1.4 -1.2 1.4 -2.4 0 Z"/><path transform="translate(29 9.7) rotate(59)" d="M-3.3 0 C-1.6 -2 1.7 -2 3.3 0 C1.7 2 -1.6 2 -3.3 0 Z"/><path transform="translate(29.1 13.4) rotate(63)" d="M-3.1 0 C-1.5 -1.9 1.5 -1.9 3.1 0 C1.5 1.9 -1.5 1.9 -3.1 0 Z"/><path transform="translate(29.2 17.6) rotate(64)" d="M-2.8 0 C-1.4 -1.7 1.4 -1.7 2.8 0 C1.4 1.7 -1.4 1.7 -2.8 0 Z"/><path transform="translate(29.3 22.3) rotate(64)" d="M-2.6 0 C-1.3 -1.6 1.3 -1.6 2.6 0 C1.3 1.6 -1.3 1.6 -2.6 0 Z"/><path transform="translate(29.1 27.7) rotate(87)" d="M-2.4 0 C-1.2 -1.5 1.2 -1.5 2.4 0 C1.2 1.5 -1.2 1.5 -2.4 0 Z"/></g>
      <g fill="#fff" opacity=".5"><ellipse transform="translate(25.6 5.8) rotate(-29)" cx=".4" cy="-.7" rx="1.6" ry=".5"/><ellipse transform="translate(31.7 8.4) rotate(12)" cx=".3" cy="-.7" rx="1.4" ry=".4"/><ellipse transform="translate(34.6 14.7) rotate(51)" cx=".3" cy="-.6" rx="1.3" ry=".4"/><ellipse transform="translate(29 9.7) rotate(59)" cx=".3" cy="-.7" rx="1.5" ry=".4"/><ellipse transform="translate(29.2 17.6) rotate(64)" cx=".3" cy="-.6" rx="1.3" ry=".4"/></g>
      <path d="M14.8 36 Q21 28.2 30.6 31.4 Q22.6 32.2 16 39.2 Z" fill="#A8C054"/>
    </symbol>`;
