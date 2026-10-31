# Netzwerktechnik-Dojo
# [[Hier öffnen](https://flowthetensor.github.io/Subnet-Dojo/)

Interaktive Lernseite für Netzwerktechnik – IPv4 und Subnetting, Netzwerk-Topologien und (in Vorbereitung) IPv6, gedacht für den Unterricht.
Die Seite ist rein statisch (HTML, CSS, JavaScript), braucht keinen Build-Schritt und lädt
**keine externen Ressourcen** (keine Web-Fonts, kein CDN, kein Tracking).

## Thema IPv4

| # | Station | Inhalt |
|---|---------|--------|
| 1 | Grundlagen | 32 Bit, Oktette, Netz-/Hostanteil, Maske, UND-Verknüpfung, 2ⁿ − 2 |
| 2 | Masken-Werkstatt | IP + Maske eingeben, Bits live eingefärbt, Maskenbits anklickbar, Subnetzliste |
| 3 | Netzklassen | Klärt das Missverständnis RFC 791 (Klassen) ↔ RFC 1918 (CIDR-Blöcke), Block-Explorer, Zeitstrahl |
| 4 | Übungs-Dojo | 7 Gürtel mit zufällig erzeugten Aufgaben (5 richtige in Folge = Gürtel) |
| 5 | Firmennetz-Planer | Verwaltung, Entwicklung, Reparatur: Bedarf → Klasse/CIDR wählen → Subnetting → Adressraum-Karte → Netzplan mit IP-Vergabe → Zusammenfassung |

## Thema Topologien

Wird freigeschaltet, sobald alle fünf IPv4-Stationen einmal geöffnet wurden.

| # | Station | Inhalt |
|---|---------|--------|
| 1 | Topologien verstehen | Punkt-zu-Punkt, Stern (mit Randnotiz Bus), Baum, Ring (PROFINET/MRP), Mesh voll und teilweise; Ausfälle per Klick simulieren; Kabelrechner fürs Vollmesh; Vergleichstabelle |
| 2 | Baukasten | Geräte per Klick verbinden, bis die verlangte Topologie entsteht; die Prüfung erklärt, was noch fehlt |
| 3 | Topologie-Dojo | 4 Gürtel: erkennen, Leitungen zählen, Ausfälle einschätzen, selbst bauen |

## Hinweise für Lehrkräfte

- Der Planer übt **nur gleich große Subnetze (FLSM)** – alle Abteilungen bekommen dieselbe Maske.
- **Hilfen einblenden** (Schalter oben im Planer) zeigt das kleinste passende Subnetz je Abteilung
  und einen Rechenhinweis für FLSM. Automatische Lösungsvorschläge gibt es nicht.
- **Neue Aufgabe würfeln** erzeugt zufällige Hostzahlen für die drei Abteilungen.
- **Link zu diesem Plan kopieren** speichert den kompletten Planungsstand in der URL.
  So lassen sich vorbereitete Aufgaben verteilen oder Lösungen abgeben.
- Fortschritt (Gürtel, besuchte Stationen, Freischaltung) und der aktuelle Plan werden nur im
  `localStorage` des jeweiligen Browsers gespeichert.

## Lokal verwenden

`index.html` einfach im Browser öffnen – ein Webserver ist nicht nötig.

## Aufbau

```
index.html            Alle Stationen (Navigation über #grundlagen, #werkstatt, …, #topo-grundlagen, …)
assets/style.css      Gestaltung inkl. Dark Mode und Druckansicht
assets/ipv4.js        Rechenkern (Parsen, Masken, Netz/Broadcast, Klassen, RFC 1918)
assets/ui.js          Bit-Darstellung, Legende, Speicher, Navigation mit Themen und Freischaltung
assets/dojo-engine.js Übungs-Mechanik für alle Themen: Gürtel, Serie, Stempel, Feuerwerk
assets/grundlagen.js  Station 1
assets/werkstatt.js   Station 2
assets/klassen.js     Station 3
assets/dojo.js        Station 4 (Aufgaben)
assets/planer.js      Station 5
assets/topo.js        Topologie-Kern: Geräte zeichnen, Leitungen ziehen, Struktur prüfen
assets/topologien.js  Topologien Station 1 und 2
assets/topo-dojo.js   Topologien Station 3
assets/images/        Gürtelbilder aus Netzwerkkabel (guertel-<farbe>.png)
```

## Gestaltung

Das Design folgt dem Stil der [Datenkrake](https://flowthetensor.github.io/Datenkrake/)
(Corporate Design der Jakob-Preh-Schule, [www.bsnes.de](https://www.bsnes.de)).
Die Schriften Quicksand, Inter und JetBrains Mono (SIL Open Font License) liegen lokal in
`assets/fonts/`, damit keine Verbindung zu Google Fonts entsteht (DSGVO).
Das Schullogo (`assets/jps-logo.png`) gehört der Jakob-Preh-Schule.

## Quellen

- [RFC 791](https://www.rfc-editor.org/info/rfc791/) – Internet Protocol (1981), Adressklassen
- [RFC 950](https://www.rfc-editor.org/info/rfc950/) – Internet Standard Subnetting Procedure (1985)
- [RFC 1519](https://www.rfc-editor.org/info/rfc1519/) / [RFC 4632](https://www.rfc-editor.org/info/rfc4632/) – CIDR
- [RFC 1918](https://www.rfc-editor.org/info/rfc1918/) – Address Allocation for Private Internets (1996)
