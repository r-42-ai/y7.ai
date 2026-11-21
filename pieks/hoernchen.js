'use strict';

/* =====================================================================
   HÖRNCHEN: Pieks' Freundin, ein rotes Eichhörnchen aus Frankreich.
   Von Hand gezeichnet wie Pieks (flache Flächen, keine Umrisse, seine
   Augen), im selben Koordinatensystem (viewBox 0 -24 200 224) und auf
   seinen Ankerpunkten: Augen (77,104) und (123,104), Scheitel y 58,
   Pfoten (72,168) und (128,168), Füsse auf y 192. So passt ihr die
   ganze Garderobe aus grafik.js. Mimik und Bewegungen stehen in
   hoernchen.css. Ihr Name steht nur in texte.js (HOERNCHEN).
   ===================================================================== */

// Farbverläufe des Schweifs: hinten am Kopf dunkler, damit sich Backe und Ohr abheben (hn-sw);
// vorne, wenn sie sich dahinter versteckt, oben heller (hn-sv). Kennungen gelten im ganzen
// Dokument, darum hn-.
const HOERNCHEN_DEFS = `
  <linearGradient id="hn-sw" x1="112" y1="126" x2="200" y2="96" gradientUnits="userSpaceOnUse">
    <stop offset="0" stop-color="#C4612B"/><stop offset=".42" stop-color="#B25325"/><stop offset="1" stop-color="#DB7A43"/>
  </linearGradient>
  <linearGradient id="hn-sv" x1="60" y1="112" x2="150" y2="200" gradientUnits="userSpaceOnUse">
    <stop offset="0" stop-color="#DB7A43"/><stop offset="1" stop-color="#BE5C28"/>
  </linearGradient>`;

/* Das Hörnchen von vorne. Gesichtsausdrücke über Klassen am <svg>:
   froh · oops · kitzel · spricht · schlaeft, dazu die Bewegungen
   dreht · versteckt · zeigt-schweif. Der Mund folgt beim Sprechen
   wie bei Pieks der CSS-Variable --mund (0 … 1).
   Lagen von hinten nach vorne: Schweif (dunkler Grund, helles Band am
   Aussenrand, vier Fellzipfel), Körper, Kopf, Plätze für Augen und Hals,
   der Schweif zum Verstecken, Pfoten, Plätze für Pfote und Kopf.
   Der Schweif hat keine helle Spitze: auf hellem Grund sähe sie wie ein
   Loch aus, und mit heller Spitze wird aus dem Hörnchen ein Fuchs.
   Jede Bewegung hat ihre eigene Gruppe, damit keine die andere abbricht:
   hn-ganz die Stimmung (atmen, hüpfen, wackeln), hn-dreh nur die Drehung,
   hn-schweif Freude, Verstecken und Zeigen, hn-wiegt das stete Wiegen. */
function hoernchenSVG(extra = '') {
  // Ein Ohr mit Pinsel; das zweite ist dasselbe, gespiegelt
  const ohr = `
        <path d="M53.4 80.9 C44.6 69.6 42 49.6 51.6 33.1 C67.4 43.8 73.8 62.8 70.9 76.8 Z" fill="#D06A33"/>
        <path d="M57.1 77 C50.9 68.1 49 55.2 54 43.8 C63.6 51.9 67.5 64.3 65.8 74.9 Z" fill="#EFA59B"/>
        <path d="M48.4 46.1 C44.9 39.7 43.1 32 44 23.5 C46 25.7 47.6 27.6 49.1 29.5 C49.2 25.4 49.9 21.5 51.7 17.7 C55 23 58.8 31.4 60.1 43.4 C55.8 38.2 50 39.6 48.4 46.1 Z" fill="#8E3F14"/>`;
  return `<svg class="hoernchen ${extra}" viewBox="0 -24 200 224" aria-hidden="true" focusable="false">
  <g class="hn-ganz"><g class="hn-dreh">
    <g class="hn-schweif"><g class="hn-wiegt">
      <path d="M118 188 C138 200 168 198 185 180 C192 173 197 163 198 152 Q196.5 154.5 193 156 C197.5 143 200 128 199.4 114 Q198 116.5 194.5 118 C198.5 105 198.8 92 196.2 80 Q195 82.5 191.6 83.6 C191 72 188 64 189.5 54 C191 43 197.5 33 198.2 19 Q197 21.5 193.6 22.6 C196.5 5 190 -12 174 -19 C160 -25 138 -24 124 -13 C116 -6.5 109.6 2 108.4 12 Q110 11 112 10.8 C109 16 109 23 110 28 C112 38 120 46 132 46 C142 46 148 40 152 46 C154 52 153 70 152 84 C151 110 144 130 132 150 C126 164 121 180 118 188 Z" fill="url(#hn-sw)"/>
      <path d="M138 182 C164 186 188 162 191 134 C193 114 192 96 189 80 C187 70 183 62 184 52 C185 38 192 30 192 16 C191 0 179 -12 162 -15 C147 -17.5 130 -13 121 -2 C116 5 114 14 115 22 C120 21 126 22 130 26 C128 18 130 10 136 5 C142 0 153 -1 162 2 C171 5 175 13 175 23 C175 37 171 47 171 60 C171 80 174 98 174 120 C174 150 162 172 138 182 Z" fill="#E58A52"/>
    </g></g>
    <g class="hn-koerper">
      <path d="M100 118 C116 118 126 130 130 146 C135 164 138 194 100 194 C62 194 65 164 70 146 C74 130 84 118 100 118 Z" fill="#D06A33"/>
      <ellipse cx="100" cy="171" rx="21" ry="21" fill="#F6D9B6"/>
      <ellipse class="hn-fuss" cx="80" cy="192" rx="14" ry="6.5" fill="#A9531F"/>
      <ellipse class="hn-fuss" cx="120" cy="192" rx="14" ry="6.5" fill="#A9531F"/>
    </g>
    <g class="hn-kopf">${ohr}
      <g transform="translate(200 0) scale(-1 1)">${ohr}
      </g>
      <path d="M91 60.4 C91 55 93.6 51.2 97.8 49.4 Q99.2 49 98.8 50.6 C98.2 53 98.8 55.2 100.2 57.2 C101.6 52.8 104.6 49.6 109 48 Q110.6 47.6 110 49.2 C109 52.2 109.4 55.4 110.6 58.2 L112.4 60.8 C105.4 58.4 98 58.4 91 60.4 Z" fill="#D06A33"/>
      <path d="M100 58 C127 58 149 72 156 96 C161 112 162 128 153 141 C144 155 123 164.5 100 164.5 C77 164.5 56 155 47 141 C38 128 39 112 44 96 C51 72 73 58 100 58 Z" fill="#D06A33"/>
      <path d="M100 128 C107 119.5 122 116.5 135 120 C147 123.5 152.5 133 148 142.5 C141.5 154 117 161.5 100 161.5 C83 161.5 58.5 154 52 142.5 C47.5 133 53 123.5 65 120 C78 116.5 93 119.5 100 128 Z" fill="#F6D9B6"/>
      <g class="hn-brauen" fill="none" stroke="#5A3420" stroke-width="3.2" stroke-linecap="round">
        <path d="M64 89 Q74 86 85 79"/><path d="M115 79 Q126 86 136 89"/>
      </g>
      <g class="hn-augen">
        <path d="M69.6 98.6 L64.4 94.8 M68.4 102.4 L62.6 100.6 M130.4 98.6 L135.6 94.8 M131.6 102.4 L137.4 100.6" stroke="#2B1A10" stroke-width="2.4" stroke-linecap="round" fill="none"/>
        <ellipse cx="77" cy="104" rx="9" ry="11.2" fill="#2B1A10"/>
        <ellipse cx="123" cy="104" rx="9" ry="11.2" fill="#2B1A10"/>
        <circle cx="80.4" cy="99.4" r="3.5" fill="#fff"/><circle cx="126.4" cy="99.4" r="3.5" fill="#fff"/>
        <circle cx="74.6" cy="108.8" r="1.5" fill="#fff" opacity=".8"/><circle cx="120.6" cy="108.8" r="1.5" fill="#fff" opacity=".8"/>
      </g>
      <g class="hn-augen-froh" fill="none" stroke="#2B1A10" stroke-width="3.6" stroke-linecap="round">
        <path d="M68 107 Q77 96 86 107"/><path d="M114 107 Q123 96 132 107"/>
        <path d="M68.6 103.4 L64 100.4 M131.4 103.4 L136 100.4" stroke-width="2.4"/>
      </g>
      <g class="hn-augen-zu" fill="none" stroke="#2B1A10" stroke-width="3.2" stroke-linecap="round">
        <path d="M68 104 Q77 111 86 104"/><path d="M114 104 Q123 111 132 104"/>
        <path d="M68.6 106.4 L64 108.6 M131.4 106.4 L136 108.6" stroke-width="2.4"/>
      </g>
      <ellipse cx="100" cy="138" rx="6.4" ry="4.8" fill="#2B1A10"/>
      <ellipse cx="98" cy="136.2" rx="2.2" ry="1.3" fill="#fff" opacity=".5"/>
      <path class="hn-mund-zu" d="M91.4 148 Q100 156.6 108.6 148" stroke="#5A3420" stroke-width="2.6" fill="none" stroke-linecap="round"/>
      <g class="hn-mund-auf">
        <path d="M89 150 Q100 149 111 150 Q110.4 160.6 100 161.6 Q89.6 160.6 89 150 Z" fill="#6E2A22"/>
        <ellipse cx="100" cy="158.2" rx="5.8" ry="2.9" fill="#EE7B7F"/>
      </g>
      <ellipse class="hn-mund-o" cx="100" cy="153.4" rx="4.6" ry="4.2" fill="#6E2A22"/>
      <ellipse cx="66" cy="133" rx="8.5" ry="5.6" fill="#F59E95" opacity=".7"/>
      <ellipse cx="134" cy="133" rx="8.5" ry="5.6" fill="#F59E95" opacity=".7"/>
      <g fill="none" stroke="#F6D9B6" stroke-width="1.5" stroke-linecap="round">
        <path d="M54 141 Q46 139 38 141"/><path d="M56 147 Q48 148 42 152"/>
        <path d="M146 141 Q154 139 162 141"/><path d="M144 147 Q152 148 158 152"/>
      </g>
    </g>
    <g class="slot-augen"></g>
    <g class="slot-hals"></g>
    <g class="hn-schweif-vorn">
      <path d="M150 198 C172 200 192 192 196 174 C199 158 192 142 176 134 C160 126 140 119 118 116 C96 113 74 113 56 116 C38 119 24 130 25 146 C25.6 154 30 161 37 165 Q34.5 168.5 30 169.5 C42 174 58 173 70 168 Q68 172 63.5 174 C78 178 96 176.5 108 171.5 Q106 175.5 101.5 177.5 C113 178.5 123 181.5 130 187.5 C135 192 141 196.5 150 198 Z" fill="url(#hn-sv)"/>
      <path d="M186 162 C188 150 180 141 165 135 C148 128.5 126 123 104 121.5 C84 120.5 66 121.5 54 125 C43 128.5 35 137 36 147 C42 141 52 138 66 137.5 C90 137 118 139 140 145.5 C156 150 172 154 186 162 Z" fill="#E58A52"/>
    </g>
    <g class="hn-haende">
      <ellipse cx="72" cy="168" rx="8.5" ry="9.5" fill="#A9531F"/>
      <ellipse cx="128" cy="168" rx="8.5" ry="9.5" fill="#A9531F"/>
    </g>
    <g class="slot-pfote"></g>
    <g class="slot-kopf"></g>
  </g></g>
</svg>`;
}

/* Garderobe: jedes Teil ist für Pieks gezeichnet und sitzt auch an ihr. Was bei ihr anders
   sitzen muss, rückt anziehen() mit einem <g transform="…"> zurecht (ITEM_SVG bleibt, wie es ist). */
const ITEM_HOERNCHEN = {
  schleife: 'matrix(-1 0 0 1 200 0)',            // ans linke Ohr: rechts ginge sie vor dem Schweif unter
  piratenhut: 'translate(0 8)',                  // tiefer über die Ohren
  krone: 'translate(0 5)',                       // sitzt zwischen den Ohren statt auf ihren Spitzen
  fliege: 'translate(0 12)',                     // unters Kinn, sonst liegt sie auf dem Mund
  schal: 'translate(0 21) scale(1 .9)',          // unters Kinn; das Ende hängt nicht tiefer als bei Pieks
  medaille: 'translate(20 41.6) scale(.8)',      // das Band beginnt unter dem Kinn statt auf den Backen
  bleistift: 'rotate(66 132 170)',               // neben der Backe statt quer über der Nase
  zauberstab: 'rotate(-62 68 170)',              // der Stern funkelt neben dem Kopf statt vor dem Auge
};

/* =====================================================================
   SYMBOLE fürs Sprite (#sprite), viewBox je Symbol. Was jeder Kurs braucht (i-pieks-kopf,
   i-hoeren, i-langsam), steht in grafik.js (KURS_SYMBOLE); hier nur, was zu ihr gehört.
   t-franz        ihr Gesicht: das Fach Französisch, und in der Blase das Abzeichen «sie spricht».
                  Der runde Grund lässt sich tönen: --franz-grund am <svg>, das das Symbol zeigt.
   erdbeere       reife Erdbeere
   reife-0 … 5    die Stufen einer Karte: Samen, Knospe, Blüte, grüne, halbrote, reife Erdbeere.
                  Jede Stufe hat ihre eigene Form und Grösse, man erkennt sie auch ohne Farbe.
   ===================================================================== */
const FRANZ_SYMBOLE = `
    <symbol id="t-franz" viewBox="0 0 80 80">
      <circle cx="40" cy="42" r="34" fill="#FBE8C8" style="fill: var(--franz-grund, #FBE8C8)"/>
      <path d="M50 73 C58 79 71 78 76 68 C79.5 60 78.4 51 77 44 C75.8 37 79 31 78.6 23 C78 13 71 6.5 63 8 C57.6 9.2 54.6 14 56 18.6 C57 22 60.4 23.4 63 22 L62 60 Z" fill="#C96630"/>
      <path d="M60 72 C67 73 72.6 68 74 61 C75.6 54 74.4 48 73.2 42 C72.2 36 75 30 74.4 23 C73.8 16.4 69.4 12 64 12.4 C60.6 12.8 58.6 15.2 59 17.6 C61 16.4 63.6 16.8 65.2 18.6 C67.6 21.4 67.6 26 67.2 31 C66.8 37 67 43 68 49 C69 56 68 62 60 72 Z" fill="#E58A52"/>
      <path d="M18.9 39.2 C15.3 34.5 14.2 26.3 18.2 19.6 C24.6 24 27.3 31.7 26.1 37.5 Z M57.1 39.2 C60.7 34.5 61.8 26.3 57.8 19.6 C51.4 24 48.7 31.7 49.9 37.5 Z" fill="#D06A33"/>
      <path d="M20.4 37.6 C17.9 33.9 17.1 28.6 19.1 24 C23.1 27.3 24.7 32.4 24 36.7 Z M55.6 37.6 C58.1 33.9 58.9 28.6 56.9 24 C52.9 27.3 51.3 32.4 52 36.7 Z" fill="#EFA59B"/>
      <path d="M16.8 24.9 C15.4 22.3 14.7 19.1 15 15.6 C15.9 16.5 16.5 17.3 17.1 18.1 C17.2 16.4 17.5 14.8 18.2 13.3 C19.5 15.4 21.1 18.9 21.6 23.8 C19.9 21.7 17.5 22.2 16.8 24.9 Z M59.2 24.9 C60.6 22.3 61.3 19.1 61 15.6 C60.1 16.5 59.5 17.3 58.9 18.1 C58.8 16.4 58.5 14.8 57.8 13.3 C56.4 15.4 54.9 18.9 54.4 23.8 C56.1 21.7 58.5 22.2 59.2 24.9 Z" fill="#8E3F14"/>
      <path d="M34.3 30.8 C34.3 28.5 35.4 27 37.1 26.3 Q37.7 26.1 37.5 26.7 C37.3 27.7 37.5 28.6 38.1 29.5 C38.7 27.6 39.9 26.3 41.7 25.7 Q42.3 25.5 42.1 26.2 C41.7 27.4 41.9 28.7 42.3 29.9 L43.1 30.9 C40.2 29.9 37.2 29.9 34.3 30.8 Z" fill="#D06A33"/>
      <path d="M38 29.8 C49.1 29.8 58.1 35.5 61 45.4 C63 51.9 63.4 58.5 59.7 63.8 C56 69.5 47.4 73.4 38 73.4 C28.6 73.4 20 69.5 16.3 63.8 C12.6 58.5 13 51.9 15 45.4 C17.9 35.5 26.9 29.8 38 29.8 Z" fill="#D06A33"/>
      <path d="M38 58.5 C40.9 55 47 53.8 52.3 55.2 C57.3 56.6 59.5 60.5 57.7 64.4 C55 69.1 45 72.2 38 72.2 C31 72.2 21 69.1 18.3 64.4 C16.5 60.5 18.7 56.6 23.6 55.2 C29 53.8 35.1 55 38 58.5 Z" fill="#F6D9B6"/>
      <ellipse cx="28.6" cy="48.4" rx="4.3" ry="5.3" fill="#2B1A10"/><ellipse cx="47.4" cy="48.4" rx="4.3" ry="5.3" fill="#2B1A10"/>
      <circle cx="30.2" cy="46.3" r="1.7" fill="#fff"/><circle cx="49" cy="46.3" r="1.7" fill="#fff"/>
      <ellipse cx="38" cy="62.4" rx="3.1" ry="2.3" fill="#2B1A10"/>
      <path d="M34.4 66.8 Q38 70.4 41.6 66.8" stroke="#5A3420" stroke-width="1.6" fill="none" stroke-linecap="round"/>
      <ellipse cx="23.6" cy="60" rx="3.7" ry="2.5" fill="#F59E95" opacity=".7"/><ellipse cx="52.4" cy="60" rx="3.7" ry="2.5" fill="#F59E95" opacity=".7"/>
    </symbol>
    <symbol id="erdbeere" viewBox="0 0 40 40">
      <path d="M20 38 C13 35 5.5 26 5.5 17.5 C5.5 11.5 11 8.5 20 8.5 C29 8.5 34.5 11.5 34.5 17.5 C34.5 26 27 35 20 38 Z" fill="#E2483D"/>
      <path d="M20 38 C27 35 34.5 26 34.5 17.5 C34.5 14.6 33.2 12.4 31 11 C32.4 18 29.4 28.6 20 38 Z" fill="#C2342B" opacity=".55"/>
      <ellipse cx="11.4" cy="18" rx="2.6" ry="4.4" fill="#fff" opacity=".4" transform="rotate(-16 11.4 18)"/>
      <g fill="#FFE7A8">
        <ellipse cx="17.4" cy="17" rx=".95" ry="1.5"/><ellipse cx="24.6" cy="16.6" rx=".95" ry="1.5"/><ellipse cx="13.6" cy="24.4" rx=".95" ry="1.5"/><ellipse cx="20.6" cy="23" rx=".95" ry="1.5"/>
        <ellipse cx="27.2" cy="22.6" rx=".95" ry="1.5"/><ellipse cx="17" cy="29.6" rx=".95" ry="1.5"/><ellipse cx="23.6" cy="29" rx=".95" ry="1.5"/><ellipse cx="20" cy="34" rx=".9" ry="1.3"/>
      </g>
      <path d="M20 12.8 C16.6 13 12.6 12 9 9 C12.4 7.8 15.2 8 17.4 8.8 C16.4 6.8 16.6 4.4 17.8 2.4 C19.6 3.8 20.8 5.6 21.2 7.6 C22.8 5.6 25.4 4.6 28.2 4.8 C27.8 7 26.6 8.6 25 9.6 C27.2 9.2 29.6 9.6 31.6 10.8 C28.2 12.8 24 13 20 12.8 Z" fill="#5DAA45"/>
    </symbol>
    <symbol id="reife-0" viewBox="0 0 24 24">
      <path d="M2.5 21 C3.5 13.5 7.5 10.5 12 10.5 C16.5 10.5 20.5 13.5 21.5 21 Z" fill="#A9784A"/>
      <circle cx="6.6" cy="18.4" r=".9" fill="#8F6238"/><circle cx="17" cy="17.2" r=".9" fill="#8F6238"/><circle cx="15.4" cy="19.8" r=".7" fill="#8F6238"/>
      <path d="M12.6 12.6 C15.2 14.2 16 16.8 14.9 18.6 C13.9 20.2 11.5 20.4 10 19.2 C8.4 17.8 8.7 15 12.6 12.6 Z" fill="#F4CF6A"/>
      <ellipse cx="11.2" cy="16.6" rx=".8" ry="1.3" fill="#fff" opacity=".55" transform="rotate(20 11.2 16.6)"/>
    </symbol>
    <symbol id="reife-1" viewBox="0 0 24 24">
      <path d="M12 21.5 V12" stroke="#5DAA45" stroke-width="2" stroke-linecap="round"/>
      <path d="M12 19 C9 19.6 6.2 18 5.2 15 C8.6 14.2 11.2 15.8 12 19 Z M12 19 C15 19.6 17.8 18 18.8 15 C15.4 14.2 12.8 15.8 12 19 Z" fill="#7CCB6A"/>
      <path d="M12 3 C15 5.6 15.9 8.6 15.2 11 C14.6 13 13.4 14 12 14 C10.6 14 9.4 13 8.8 11 C8.1 8.6 9 5.6 12 3 Z" fill="#9CCB6A"/>
      <path d="M12 3 C13.5 4.4 14.3 6 14.4 7.6 C12.8 8.3 11.2 8.3 9.6 7.6 C9.7 6 10.5 4.4 12 3 Z" fill="#fff" stroke="#E3D2BA" stroke-width=".7" stroke-linejoin="round"/>
      <path d="M12 14 C9.8 14.2 8.2 12.8 8 10.4 C10 10.4 11.4 11.6 12 14 Z M12 14 C14.2 14.2 15.8 12.8 16 10.4 C14 10.4 12.6 11.6 12 14 Z" fill="#5DAA45"/>
    </symbol>
    <symbol id="reife-2" viewBox="0 0 24 24">
      <path d="M12 1.6 L14 8 L20.6 6 L16.6 11.4 L22 15.6 L15.2 15.6 L15 22.4 L12 16.6 L9 22.4 L8.8 15.6 L2 15.6 L7.4 11.4 L3.4 6 L10 8 Z" fill="#5DAA45"/>
      <g fill="#fff" stroke="#E3D2BA" stroke-width=".9">
        <circle cx="12" cy="6.4" r="4.1"/><circle cx="17.5" cy="10.4" r="4.1"/><circle cx="15.4" cy="16.9" r="4.1"/><circle cx="8.6" cy="16.9" r="4.1"/><circle cx="6.5" cy="10.4" r="4.1"/>
      </g>
      <circle cx="12" cy="12.2" r="3.3" fill="#FFD43B"/>
      <circle cx="11" cy="11.4" r=".7" fill="#F2A813"/><circle cx="13.2" cy="11.6" r=".7" fill="#F2A813"/><circle cx="12" cy="13.6" r=".7" fill="#F2A813"/>
    </symbol>
    <symbol id="reife-3" viewBox="0 0 24 24">
      <path d="M12 21 C8.8 19.4 6.2 15.8 6.2 12.8 C6.2 10.2 8.6 9 12 9 C15.4 9 17.8 10.2 17.8 12.8 C17.8 15.8 15.2 19.4 12 21 Z" fill="#9CCB6A"/>
      <g fill="#F4F7C8"><ellipse cx="9.6" cy="13" rx=".6" ry=".95"/><ellipse cx="14.4" cy="13" rx=".6" ry=".95"/><ellipse cx="12" cy="15" rx=".6" ry=".95"/><ellipse cx="10.4" cy="17.2" rx=".6" ry=".9"/><ellipse cx="13.6" cy="17.2" rx=".6" ry=".9"/></g>
      <path d="M12 11 C10 11.2 7.8 10.4 6 8.6 C8 7.8 9.6 8 10.8 8.6 C10.4 7.2 10.6 5.6 11.4 4.2 C12.6 5.2 13.2 6.4 13.4 7.8 C14.6 6.6 16.2 6 18 6.2 C17.6 7.6 16.8 8.6 15.8 9.2 C17 9 18.2 9.2 19.2 9.8 C17 11 14.4 11.2 12 11 Z" fill="#5DAA45"/>
    </symbol>
    <symbol id="reife-4" viewBox="0 0 24 24">
      <path d="M12 22.2 C7.8 20.2 4.6 15.6 4.6 11.8 C4.6 8.6 7.6 7.2 12 7.2 C16.4 7.2 19.4 8.6 19.4 11.8 C19.4 15.6 16.2 20.2 12 22.2 Z" fill="#DDEBA8"/>
      <path d="M5 13.4 C7.2 12.2 9.6 14.2 12 13.2 C14.4 12.2 16.8 14.2 19 13.4 C17.8 16.9 15 20.8 12 22.2 C9 20.8 6.2 16.9 5 13.4 Z" fill="#E2483D"/>
      <g fill="#FFE7A8"><ellipse cx="8.8" cy="16" rx=".65" ry="1"/><ellipse cx="12" cy="15.6" rx=".65" ry="1"/><ellipse cx="15.2" cy="16" rx=".65" ry="1"/><ellipse cx="10.4" cy="18.8" rx=".6" ry=".95"/><ellipse cx="13.6" cy="18.8" rx=".6" ry=".95"/></g>
      <path d="M12 9.4 C9.8 9.6 7.2 8.8 5 6.8 C7.2 5.8 9.2 6 10.6 6.8 C10 5.2 10.2 3.4 11.2 1.8 C12.6 3 13.4 4.4 13.6 6 C15 4.6 16.8 3.8 19 4 C18.6 5.6 17.6 6.8 16.4 7.6 C17.8 7.4 19.2 7.6 20.4 8.2 C17.8 9.6 14.8 9.6 12 9.4 Z" fill="#5DAA45"/>
    </symbol>
    <symbol id="reife-5" viewBox="0 0 24 24">
      <path d="M11.2 23 C6.4 20.8 2.8 15.6 2.8 11.4 C2.8 7.8 6.2 6.2 11.2 6.2 C16.2 6.2 19.6 7.8 19.6 11.4 C19.6 15.6 16 20.8 11.2 23 Z" fill="#E2483D"/>
      <path d="M11.2 23 C16 20.8 19.6 15.6 19.6 11.4 C19.6 9.6 18.8 8.4 17.4 7.6 C18.4 12 16.6 18 11.2 23 Z" fill="#C2342B" opacity=".55"/>
      <ellipse cx="6.4" cy="11.8" rx="1.5" ry="2.6" fill="#fff" opacity=".45" transform="rotate(-16 6.4 11.8)"/>
      <g fill="#FFE7A8"><ellipse cx="9.8" cy="11.4" rx=".7" ry="1.1"/><ellipse cx="14.2" cy="11.2" rx=".7" ry="1.1"/><ellipse cx="7.8" cy="15.6" rx=".7" ry="1.1"/><ellipse cx="12" cy="15.2" rx=".7" ry="1.1"/><ellipse cx="15.6" cy="15" rx=".7" ry="1.1"/><ellipse cx="10" cy="19" rx=".7" ry="1.1"/><ellipse cx="13.2" cy="18.8" rx=".7" ry="1.1"/></g>
      <path d="M11.2 8.6 C8.8 8.8 6 8 3.6 5.8 C6 4.8 8.2 5 9.8 5.8 C9.2 4.2 9.4 2.4 10.4 .8 C11.8 2 12.6 3.4 12.8 5 C14.2 3.6 16 2.8 18.2 3 C17.8 4.6 16.8 5.8 15.6 6.6 C17 6.4 18.4 6.6 19.6 7.2 C17 8.6 14 8.8 11.2 8.6 Z" fill="#5DAA45"/>
      <path d="M21 13.6 l.8 1.9 1.9 .8 -1.9 .8 -.8 1.9 -.8 -1.9 -1.9 -.8 1.9 -.8 Z" fill="#FFC233"/>
    </symbol>`;
