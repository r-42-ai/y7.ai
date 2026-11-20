# Zahlen-Capy — Yunas Zahlenpyramiden, mit Russisch vom Lama

URL: https://y7.ai/capy/ (vorher /pyr/). Gebaut für das Tablet (quer und hochkant),
läuft auch auf dem Handy und am Computer. Installierbar und ohne Internet spielbar.

## Zahlenpyramiden mit Capy
- Zwei Steine nebeneinander ergeben den Stein darüber. 18 Stufen, von drei Stockwerken
  bis 10 bis zu sechs Stockwerken bis 100; die Stufe passt sich an, wie gut es läuft.
- Jede Pyramide bringt eine Mandarine. In der **Schatzkiste** (Tipp auf den Zähler) holt
  Yuna damit Hüte für Capy, schaut das Tier-Album an und hört alle Fakten nochmal.
- Freunde kommen nach 2, 4, 7, 11, 16, 22, 30, 40, 55, 75 und 100 Pyramiden.
- Die Landschaft folgt Jahreszeit und Sonne in Zug. Zum Ausprobieren:
  `?jz=winter` (fruehling, sommer, herbst) und `?zeit=nacht` (tag, abend).

## Russisch mit dem Lama
Capys Freundin ist ein Lama aus Russland und heisst **Пупок** (Pupok, «Bauchnabel»), so
hat es Yuna ausgesucht. Es kommt nach der dritten Pyramide und stellt sich vor (ein Tipp
auf den Namen oben in der Russisch-Ecke, und es sagt ihn nochmal). Danach steht es auf
der Wiese, jubelt manchmal auf Russisch
mit, und ein Tipp darauf (oder der Lama-Knopf oben, oder der blaue Knopf auf der
Begrüssungskarte) öffnet die **Russisch-Ecke**.

- **Karte**: 14 Matrjoschkas, eine pro Station. Jede Station bringt zwei bis fünf
  Buchstaben, in einer Reihenfolge, mit der man früh ganze Wörter lesen kann
  (А О К Т М → МАМА, ТОМАТ, КАКАО; dann Э Л → «Это лама.»). Nach Station 14 kennt Yuna alle 33.
- **Buchstaben** sind «wie bei uns» (А, О, К, Т, М: sehen aus und klingen wie bei
  uns), «Schwindler» (Н, С, Р, В, У, Е, Х: sehen aus wie unsere, sagen aber etwas
  anderes) oder neu. Jeder hat ein Merkwort mit Bild und einen eigenen kurzen Satz.
- **Eine Runde** (5–7 Minuten): neue Buchstaben, dann Wörter, die sich damit lesen
  lassen, Zauberwörter zum Nachsprechen (Привет, Спасибо …), die Zahlen 1 bis 10, ein
  kleiner Satz, zwei Wiederholungen und zum Schluss Paare. Was daneben geht, kommt in
  derselben Runde nochmal. Sterne nach Fehlern, Mandarinen fürs Mitmachen.
- **Aufgaben**: Buchstaben hören und finden, «Wie klingt er?», Bild zum Buchstaben,
  Wort lesen → Bild, Bild → Wort, Wort hören, Wort aus Buchstaben legen, Satz lesen,
  Satz aus Wörtern bauen, Zauberwort hören, Zahl hören, Paare. Alles mit Tippen.
- **Wiederholen** nimmt, was am wackligsten ist und am längsten her. **Alphabet** und
  **Wörter** zeigen alles, was schon dran war, zum Antippen und Anhören (zweimal tippen:
  langsam).
- Ohne Ton fallen die reinen Hör-Aufgaben weg.

Inhalte und alles, was das Lama sagt: `russisch-texte.js`. `node capy/pruefe.mjs` prüft,
dass jedes Wort und jeder Satz mit den bis dahin gelernten Buchstaben lesbar ist, kein
Bild doppelt vorkommt und Deutsch und Russisch sauber getrennt sind.

## Dateien
- `index.html` Pyramiden, Capy, Schatzkiste, Landschaft, Stimme
- `texte.js` alles, was Capy sagt, Freunde, Tiere, Hüte, Fakten
- `russisch-texte.js` Buchstaben, Stationen, Wörter, Sätze, Zauberwörter, Sätze des Lamas
- `russisch.js`, `russisch.css` das Lama, seine Ankunft und die Russisch-Ecke
- `pruefe.mjs` prüft die Russisch-Inhalte · `make-audio.mjs` vertont alles
- `sw.js`, `manifest.webmanifest` installierbar und offline
Fehlen die Russisch-Dateien, läuft Capy wie immer.

## Speicher (nur im Browser, pro Gerät)
- `y7.pyr.stand`: Stufe, Pyramiden, Mandarinen, Hüte, Album, Fakten, Einstellungen
- `y7.capy.russisch`: ob das Lama schon da ist, geschaffte Stationen, Stärke jedes
  Buchstabens, Worts und Satzes. «Russisch-Fortschritt löschen» im Elternbereich
  (Fragezeichen) löscht nur das Gelernte; das Lama bleibt.

## Vertonung (ElevenLabs)
| Stimme | Wer | Dateien |
|---|---|---|
| `c` | Capy, «Sandra Squirrel – Quirky Explorer» | `audio/<prüfwert>.mp3` |
| `l` | das Lama, «Kate – Multilingual Storyteller» (Russisch und Deutsch) | `audio/l-<prüfwert>.mp3`, langsam `audio/ll-…` |

- Der Dateiname ist ein Prüfwert über den gesprochenen Text: Ändert sich ein Satz,
  entsteht eine neue Datei.
- Zeilen des Lamas mischen Sprachen: `'{Молодец!} Das war richtig.'`. Russisches in
  geschweiften Klammern ist eine eigene Aufnahme; die App hängt die Stücke aneinander.
  Wörter und Sätze gibt es normal (Tempo 0.9) und langsam (0.7).
- Die App bringt die Aufnahmen des Lamas auf Capys Lautstärke, bevor sie die Stille am
  Rand abschneidet (sonst gingen leise Anfänge wie с, ф, х verloren).

Ablauf:
1. Texte ändern, `node capy/pruefe.mjs`.
2. `node capy/make-audio.mjs --dry` zeigt, was fehlt.
3. `ELEVENLABS_API_KEY=… node capy/make-audio.mjs` vertont das Fehlende (in der
   Cloud-Umgebung zusätzlich `NODE_USE_ENV_PROXY=1`). Der Schlüssel steht nie im Repo.
4. In `sw.js` die «Stand»-Zeile ändern und `audio/` committen. Wurden bestehende
   Aufnahmen neu gesprochen (`--force --stimme l`, z.B. nach einem Stimmwechsel), dort
   stattdessen `CACHE` hochzählen.

Optionen: `--stimme c|l`, `--force` (nur mit `--stimme`), `--voice <id>` (nur mit
`--stimme`), `--aufraeumen` (verwaiste Dateien löschen), `--dry`.
