# Plan: Umbau zum Netzwerktechnik-Dojo

Stand: 30.10.2026 · Umsetzung: 31.10.2026

**Fortschritt 31.10.2026:** Grundgerüst (Themenleiste, Freischaltung, Branding), Dojo-Mechanik verallgemeinert (`dojo-engine.js`) und das komplette Thema **Topologien** (T1–T3) sind umgesetzt. Freischaltung: Topologien öffnen sich, sobald alle fünf IPv4-Stationen einmal besucht wurden. **Offen:** Thema IPv6 (Abschnitt 3), Repo-Umbenennung (E1).

Aus dem Subnet-Dojo (nur IPv4) wird ein **Netzwerktechnik-Dojo** mit drei Themen:

1. **IPv4**: die bisherigen fünf Stationen, inhaltlich unverändert
2. **Topologien** (neu): Punkt-zu-Punkt, Stern, Baum, Mesh, Ring, mit Bau- und Erkennungsaufgaben
3. **IPv6** (neu): Adressaufbau, vereinfachter Header, die drei automatischen Adressen; Router Advertisement & Co. nur optional

---

## 0. Entscheidungen (geklärt am 30.10.2026)

| # | Frage | Entscheidung |
|---|---|---|
| E1 | Repo und URL umbenennen? | **Der Nutzer benennt das Repo selbst um.** Folgen siehe unten. |
| E2 | Welche „3 Adressen“ hat jedes Gerät? (siehe Station V4) | **Sicht von Windows `ipconfig`**: verbindungslokal, global, temporär |
| E3 | Übungen: ein gemeinsames Übungs-Dojo für alle Themen oder eins pro Thema? | **Pro Thema eine Übungsstation**, technisch mit derselben Dojo-Mechanik (Gürtel, Serie, Stempel, Feuerwerk) |
| E4 | Bus-Topologie aufnehmen? | **Ja, als Randnotiz** bei „Stern“, ohne eigene Übung |
| E5 | Ring mit Industriebezug (PROFINET MRP, TIA Portal)? | **Ja** |

**Folgen der Umbenennung (E1)**
- Die Page-URL wird `flowthetensor.github.io/<neuer-name>/`. Für die alte Adresse gibt es **keine automatische Weiterleitung**, alte Links und geteilte Planer-Links gehen dann ins Leere.
- Lokales Git: GitHub leitet Pushes an den alten Namen meist weiter, sauberer ist aber `git remote set-url origin https://github.com/FlowTheTensor/<neuer-name>.git`. Nach der Umbenennung den neuen Namen nennen, dann passe ich das an.
- Im Code ist der Repo-Name nicht fest eingetragen (alle Pfade relativ, Planer-Links nutzen die aktuelle Adresse). Anzupassen ist nur der Link in `README.md`, Zeile 2.
- **Speicher-Präfix `subnet-dojo:` in `ui.js` bleibt unverändert.** Der Browser-Speicher gilt für ganz `flowthetensor.github.io`. So behalten die Schüler auch nach der Umbenennung ihre Gürtel und Planungsstände.

## 0.1 Fachliche Punkte, die im Text korrekt dargestellt werden müssen

- **„Header kleiner“** stimmt so nicht: Der IPv6-Header ist mit **40 Byte** größer als der IPv4-Mindestheader (20 Byte), weil die Adressen 4× so lang sind. Richtig ist: Er ist **einfacher und fest lang** (8 statt 12+ Felder, keine Optionen im Grundheader, keine Header-Prüfsumme, keine Fragmentierung durch Router). Deshalb können Router ihn schneller verarbeiten.
- **„Kein TTL mehr“**: Das Feld heißt jetzt **Hop Limit** und hat dieselbe Aufgabe (wird pro Router um 1 verringert, bei 0 wird verworfen). Der Name passt nun zur tatsächlichen Funktion: Gezählt werden Hops, keine Sekunden. Der Effizienzgewinn kommt daher, dass Router bei IPv4 nach dem Verringern der TTL die **Header-Prüfsumme neu berechnen** müssen. Bei IPv6 gibt es keine Prüfsumme mehr.
- **„Automatisch 3 Adressen“** gilt nur, wenn ein Router im Netz ein Präfix ankündigt. Ohne Router hat ein Gerät nur die verbindungslokale Adresse (fe80::). Das kommt als Hinweis in den Text.

---

## 1. Grundgerüst umbauen

**Navigation mit zwei Ebenen**
- Oben eine Themenleiste: **IPv4 · Topologien · IPv6**
- Darunter die Stationen des gewählten Themas (wie jetzt die Tabs 1–5)
- Optional eine Startseite mit drei Kacheln („Womit willst du trainieren?“)

**Adressen (Hash-Routing)**
- Bestehende Anker bleiben gültig: `#grundlagen`, `#werkstatt`, `#klassen`, `#dojo`, `#planer`. Wichtig, weil geteilte Planer-Links `?plan=…#planer` weiter funktionieren müssen.
- Neue Anker mit Präfix: `#topo-…`, `#v6-…`
- `ui.js` → `show()` erweitern: aus dem Anker das Thema ableiten und die passende Stationsleiste einblenden

**Branding**
- `<title>`, Meta-Beschreibung, Logo-Schriftzug „Netzwerktechnik-<i>Dojo</i>“, Untertitel „IPv4 · Topologien · IPv6“
- „Subnet-Dojo“ auch in Einleitungstext (Grundlagen), Fußzeile und den Dateikommentaren ersetzen
- README überarbeiten, Link auf die neue Page-URL

**Dateien**
- `index.html` bleibt eine einzige Seite (wie bisher)
- Neu: `assets/topologien.js`, `assets/topo-dojo.js` (oder Teil von topologien.js), `assets/ipv6.js` (Rechenkern wie ipv4.js), `assets/ipv6-stationen.js`
- `dojo.js` so umbauen, dass die Gürtel-Mechanik (Serie, Stempel, Feuerwerk, Fortschritt) wiederverwendbar ist und jedes Thema eigene Aufgaben-Generatoren und einen eigenen Speicherschlüssel bekommt

---

## 2. Thema Topologien

### Station T1 · Topologien verstehen
Pro Topologie eine Karte mit kleiner SVG-Grafik, Kurzbeschreibung, Vor- und Nachteilen und einem Praxisbeispiel:

| Topologie | Kernidee | Ausfall | Praxisbeispiel |
|---|---|---|---|
| Punkt-zu-Punkt | genau 2 Geräte, 1 Verbindung | Leitung weg = keine Verbindung | PC direkt an PC/SPS, Richtfunkstrecke |
| Stern | alle an einem zentralen Switch | Zentrale weg = alles weg; ein Kabel weg = nur ein Gerät | Büro, Klassenzimmer |
| Baum | Sterne hierarchisch verbunden (Switch an Switch) | Ast-Switch weg = ganzer Ast weg | Schulnetz: Kern-Switch → Etagen-Switches → Räume |
| Mesh (vermascht) | voll: jeder mit jedem; teilweise: mehrere Wege | sehr ausfallsicher | Internet-Backbone, WLAN-Mesh |
| Ring | jedes Gerät hat genau 2 Nachbarn | einfacher Ring: eine Unterbrechung wird mit Redundanzprotokoll (z. B. MRP) abgefangen | PROFINET-Ring in der Industrie |

- Interaktive Mini-Rechnung beim Mesh: Kabel im Vollmesh = **n·(n−1)/2**, mit Regler für n (wie der Präfix-Regler auf Seite 1)
- Kurze Vergleichstabelle: Kabelaufwand, Ausfallsicherheit, Kosten
- Bus nur als Randnotiz (E4)

### Station T2 · Topologie-Baukasten (selbst bauen)
- Zeichenfläche (SVG) mit vorgegebenen Geräten: PCs, Switches, Router
- Bedienung: Gerät anklicken → zweites Gerät anklicken = Kabel. Kabel anklicken = löschen. Funktioniert auch per Touch (Smartboard/Tablet).
- Aufgabe oben, z. B. „Verbinde die 5 PCs mit dem Switch als **Stern**.“
- Button **Prüfen** → die Prüfung erfolgt über die Struktur der Verbindungen, nicht über die Positionen:
  - Punkt-zu-Punkt: 2 Geräte, 1 Kabel
  - Stern: ein Zentrum mit Grad n−1, alle anderen Grad 1, Zentrum ist ein Switch
  - Baum: zusammenhängend, Kabel = Geräte − 1, keine Schleife, PCs nur als Blätter
  - Ring: alle Grad 2, zusammenhängend, genau ein Kreis
  - Vollmesh: jeder mit jedem; Teilmesh: zusammenhängend, mindestens ein Kreis, nicht voll
- Konkrete Rückmeldungen, z. B. „PC-3 ist noch nicht verbunden“, „Im Ring hat jedes Gerät genau 2 Kabel – PC-2 hat 3“
- Bei Erfolg: Stempel + Feuerwerk wie im Übungs-Dojo
- **Keine** Lösungs- oder Autovervollständigen-Buttons (wie beim Planer gewünscht)

### Station T3 · Topologie-Dojo (erkennen und bauen)
Gürtel mit zufälligen Aufgaben:
1. **Erkennen**: eine gezeichnete Topologie benennen (Auswahl aus 5–6 Namen); Grafiken zufällig angeordnet, damit man nicht an der Form auswendig lernt
2. **Bauen**: wie T2, Topologie zufällig, Geräteanzahl variiert
3. **Rechnen und Bewerten**: z. B. „Wie viele Kabel braucht ein Vollmesh mit 6 Geräten?“, „Welche Geräte fallen aus, wenn Switch S2 ausfällt?“ (Gerät in der Grafik markiert)

---

## 3. Thema IPv6

### Station V1 · Warum IPv6 und wie ist die Adresse aufgebaut?
- Warum: IPv4 hat nur ca. 4,3 Mrd. Adressen; IPv6 hat 128 Bit → 2¹²⁸ (Größenvergleich visualisieren)
- Aufbau: **8 Blöcke à 16 Bit**, hexadezimal, durch Doppelpunkt getrennt
- Bitansicht wie bei IPv4 (bitRow wiederverwenden), aber gruppiert nach Blöcken bzw. Hex-Ziffern (1 Hex-Ziffer = 4 Bit)
- Typische Aufteilung: **/64 Präfix** (Netzanteil: globales Routing-Präfix + Subnetz-ID) | **64 Bit Interface-ID**
- Präfix-Schreibweise wie bei CIDR; Hinweis: Eine Subnetzmaske in Punktschreibweise gibt es bei IPv6 nicht, auch Windows und TIA Portal fragen nach der Präfixlänge (kurz gegen den IPv4-Teil abgrenzen)

### Station V2 · IPv6-Werkstatt (kürzen und erweitern)
- Eingabefeld: Adresse beliebig eingeben → zeigt sofort die **volle Form** und die **gekürzte Form**
- Die beiden Regeln Schritt für Schritt hervorgehoben:
  1. Führende Nullen in einem Block weglassen (`0db8` → `db8`)
  2. **Einmal** eine Folge von Null-Blöcken durch `::` ersetzen (die längste, bei Gleichstand die erste)
- Typische Fehler erklären: `::` zweimal, Block mit mehr als 4 Ziffern, ungültige Zeichen
- Präfix-Regler: Netzanteil und Interface-ID farbig

### Station V3 · Der IPv6-Header
- Beide Header nebeneinander als Grafik (Felder maßstäblich in 32-Bit-Zeilen): IPv4 mit allen Feldern, IPv6 mit 8 Feldern
- Farbig markiert: **weggefallen** (Header-Länge, Prüfsumme, Fragmentierungsfelder, Optionen), **umbenannt** (TTL → Hop Limit, Protocol → Next Header, Type of Service → Traffic Class), **neu** (Flow Label)
- Merksatz: Fest 40 Byte, keine Prüfsumme, keine Fragmentierung unterwegs → Router arbeiten schneller. Die Fachpunkte aus 0.1 müssen dabei korrekt sein.
- Kleine Animation: Ein Paket läuft über 3 Router. Bei IPv4 wird an jedem Router TTL −1 gerechnet **und die Prüfsumme neu berechnet**, bei IPv6 nur Hop Limit −1.

### Station V4 · Drei Adressen pro Gerät
Vorschlag nach E2, so wie es Windows bei `ipconfig` zeigt:

| Adresse | Erkennbar an | Bedeutung |
|---|---|---|
| **Verbindungslokal** (Link-Local) | beginnt mit `fe80::` | immer vorhanden, automatisch erzeugt, nur im eigenen Netzsegment gültig, wird nicht geroutet |
| **Global** (Global Unicast) | beginnt mit `2` oder `3` (2000::/3) | weltweit eindeutig und erreichbar, Präfix vom Router, Interface-ID vom Gerät |
| **Temporär** (Privacy Extension) | gleiches Präfix wie die globale | wechselt regelmäßig, wird für ausgehende Verbindungen genutzt, damit das Gerät im Internet nicht dauerhaft verfolgbar ist |

- Dazu: Loopback `::1` (entspricht 127.0.0.1) und die Unique-Local-Adresse `fd…` (entspricht den privaten IPv4-Bereichen) als Ergänzung
- Interaktiv: ein nachgebautes `ipconfig`-Fenster mit Beispieladressen; Klick auf eine Zeile erklärt die Adresse
- Hinweis: Ohne Router gibt es nur die fe80-Adresse (siehe 0.1)

**Pflichtteil EUI-64: Interface-ID aus der MAC-Adresse**
Eine Erklärkarte in V4, damit EUI-64 vor der Übung in V5 behandelt ist:
- Schritt für Schritt animiert an einer Beispiel-MAC, z. B. `00:1A:2B:3C:4D:5E`:
  1. MAC in der Mitte teilen: `001A2B` | `3C4D5E`
  2. `FFFE` einfügen: `001A2BFFFE3C4D5E`
  3. Das **7. Bit** des ersten Bytes umdrehen (U/L-Bit): `00` → `02`
  4. In 4er-Blöcke schreiben: `021A:2BFF:FE3C:4D5E`
  5. Mit dem Präfix ergibt sich z. B. `fe80::21a:2bff:fe3c:4d5e`
- Das erste Byte als Bitansicht zeigen, damit sichtbar wird, welches Bit kippt
- Eingabefeld: eigene MAC eingeben → Interface-ID und Link-Local-Adresse werden berechnet
- Fachlicher Hinweis im Text: **Die meisten Endgeräte nutzen heute keine EUI-64-ID** – weder Windows noch macOS/iOS noch Android (und viele Linux-Distributionen auch nicht). Sie bilden die Interface-ID zufällig bzw. „stabil, aber nicht aus der MAC ableitbar“, damit das Gerät nicht über seine MAC-Adresse verfolgt werden kann. EUI-64 findet man vor allem bei **Routern, Switches, Industriegeräten und eingebetteten Systemen**. Auf dem eigenen PC oder Handy sieht man darum meist kein `ff:fe` in der Mitte.
- Warum es trotzdem Pflicht ist: Es zeigt, wie MAC (Schicht 2) und IPv6-Adresse zusammenhängen, ist in der Netzwerktechnik verbreitet und erklärt, warum man aus Datenschutzgründen davon abgekommen ist.

### Station V5 · IPv6-Dojo
Gürtel:
1. Adressen **kürzen**
2. Adressen **erweitern** (volle Form)
3. **Adresstyp erkennen** (fe80…, 2001…, fd…, ::1, ff02… → Multicast)
4. **Präfix und Interface-ID** bestimmen (bei /64 und /48)
5. **EUI-64**: aus einer zufälligen MAC die Interface-ID bilden (Teilaufgaben wechseln: FFFE einfügen, U/L-Bit kippen, vollständige Link-Local-Adresse angeben). Die Lösung zeigt die Zwischenschritte. Umgekehrt auch: Aus einer EUI-64-Adresse die MAC zurückrechnen.
6. **Header-Wissen**: Welches Feld ist weggefallen, umbenannt oder neu? Welches IPv6-Feld ersetzt TTL?

### Optional · Vertiefung (eingeklappt, „Für Interessierte“)
- Router Advertisement / Router Solicitation, SLAAC (wie das Gerät sich die globale Adresse selbst baut)
- Zufällige und stabile Interface-IDs als Alternative zu EUI-64 (wie es Windows, macOS/iOS und Android machen)
- NDP ersetzt ARP; DHCPv6 (stateful/stateless)
- Darstellung als aufklappbare Karten (`<details>`), nicht in den Dojo-Gürteln abgefragt (höchstens ein eigener Bonus-Gürtel)

---

## 4. Reihenfolge der Umsetzung

1. **Grundgerüst** (Abschnitt 1): Themenleiste, Routing, Branding. Danach testen, dass alle IPv4-Stationen und geteilte Planer-Links noch funktionieren. Dann committen.
2. **Dojo-Mechanik verallgemeinern** (dojo.js), IPv4-Dojo muss danach exakt wie vorher funktionieren. Dann committen.
3. **Topologien**: T1 → T2 (Baukasten, Prüflogik) → T3. Nach jeder Station committen.
4. **IPv6**: Rechenkern `ipv6.js` (parsen, kürzen, erweitern, Typ erkennen, EUI-64 aus MAC) zuerst, dann V1 → V2 → V3 → V4 → V5 → Vertiefung.
5. **Abschluss**: Weiter-Buttons zwischen allen Stationen und Themen, README, Test im Browser (hell/dunkel, Handybreite), dann committen.

**Testen** jeweils mit Puppeteer (aus der installierten mermaid-cli) über Screenshots und Prüfskripte, wie beim Grundriss.

**Git**: direkt auf `main` committen, keine Branches. Pushen nur auf Ansage.

---

## 5. Was gleich bleibt

- Design (Farben, Schriften, Karten, Stempel- und Feuerwerk-Effekte)
- Keine fremden Schriftzeichen, kein Ton, keine Verweise aufs Schulbuch
- Keine Buttons, die Aufgaben automatisch lösen
- Praxisbezug zu Windows und TIA Portal, wo es passt
