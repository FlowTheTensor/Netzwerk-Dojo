# Netzwerktechnik-Dojo
# [Hier öffnen](https://flowthetensor.github.io/Netzwerk-Dojo/)

Interaktive Lernseite für Netzwerktechnik – MAC-Adressen, IPv4 und Subnetting, Netzwerk-Topologien, IPv6 und das ISO/OSI-Modell, gedacht für den Unterricht.
Die Seite ist rein statisch (HTML, CSS, JavaScript), braucht keinen Build-Schritt und lädt
**keine externen Ressourcen** (keine Web-Fonts, kein CDN, kein Tracking).

## Thema MAC-Adressen

| # | Station | Inhalt |
|---|---------|--------|
| 1 | MAC verstehen | Aufbau (48 Bit, OUI + Gerätenummer), Schreibweisen, die IEEE und ihre Standards (802.3, 802.11), I/G- und U/L-Bit, Broadcast, MAC-Analyse |
| 2 | Switch & MAC-Tabelle | Frames senden: Der Switch lernt Quell-MACs, leitet gezielt weiter oder flutet |
| 3 | MAC-Dojo | 5 Gürtel: Hexadezimal, Aufbau & Schreibweisen, IEEE, Adressarten, Switch |

## Thema IPv4

Wird freigeschaltet, sobald alle MAC-Stationen einmal geöffnet wurden.


| # | Station | Inhalt |
|---|---------|--------|
| 1 | Grundlagen | 32 Bit, Oktette, Netz-/Hostanteil, Maske, UND-Verknüpfung, 2ⁿ − 2 |
| 2 | Masken-Werkstatt | IP + Maske eingeben, Bits live eingefärbt, Maskenbits anklickbar, Subnetzliste |
| 3 | Netzklassen | Klärt das Missverständnis RFC 791 (Klassen) ↔ RFC 1918 (CIDR-Blöcke), Block-Explorer, Zeitstrahl |
| 4 | Besondere Adressen | 127.0.0.1/localhost, 169.254.x.x (APIPA), 0.0.0.0, 255.255.255.255, Provider-NAT, Dokumentations- und Multicast-Adressen; Adress-Detektor |
| 5 | Der IPv4-Header | Alle Felder maßstäblich und erklärt, Beispielpaket mit echten Werten, TTL-Regler mit echter Prüfsumme, TTL bei ping und tracert |
| 6 | Übungs-Dojo | 8 Gürtel mit zufällig erzeugten Aufgaben (5 richtige in Folge = Gürtel) |
| 7 | Firmennetz-Planer | Verwaltung, Entwicklung, Reparatur: Bedarf → Klasse/CIDR wählen → Subnetting → Adressraum-Karte → Netzplan mit IP-Vergabe → Zusammenfassung |

## Thema Topologien

Wird freigeschaltet, sobald alle sieben IPv4-Stationen einmal geöffnet wurden.

| # | Station | Inhalt |
|---|---------|--------|
| 1 | Topologien verstehen | Punkt-zu-Punkt, Stern (mit Randnotiz Bus), Baum, Ring (PROFINET/MRP), Mesh voll und teilweise; Ausfälle per Klick simulieren; Kabelrechner fürs Vollmesh; Vergleichstabelle |
| 2 | Baukasten | Geräte per Klick verbinden, bis die verlangte Topologie entsteht; die Prüfung erklärt, was noch fehlt |
| 3 | Topologie-Dojo | 4 Gürtel: erkennen, Leitungen zählen, Ausfälle einschätzen, selbst bauen |

## Thema IPv6

Wird freigeschaltet, sobald alle Topologie-Stationen einmal geöffnet wurden.

| # | Station | Inhalt |
|---|---------|--------|
| 1 | IPv6 verstehen | Warum IPv6, 2¹²⁸ im Vergleich, Aufbau (8 Blöcke à 16 Bit, Hex), Präfix statt Subnetzmaske |
| 2 | Adress-Werkstatt | Adresse eingeben → volle und gekürzte Form mit beiden Regeln, Fehlererklärung, Präfix-Regler |
| 3 | Der Header | IPv4- und IPv6-Header maßstäblich, weggefallen/umbenannt/neu, Animation TTL + Prüfsumme vs. Hop Limit |
| 4 | Drei Adressen | ipconfig mit Link-Local, global und temporär; EUI-64 Schritt für Schritt; Vertiefung RA/SLAAC, NDP, DHCPv6 |
| 5 | IPv6-Dojo | 6 Gürtel: kürzen, ausschreiben, Adresstyp, Präfix & Interface-ID, EUI-64, Header-Wissen |

## Thema OSI-Modell

Wird freigeschaltet, sobald alle IPv6-Stationen einmal geöffnet wurden.

| # | Station | Inhalt |
|---|---------|--------|
| 1 | OSI-Schichten | Warum Schichten, die 7 Schichten deutsch/englisch mit Aufgabe, Beispielen und Dateneinheit, Merksatz-Puzzle: Die Wörter von „Please Do Not Throw Salami Pizza Away“ ohne Vorlage den Schichten zuordnen; nach der Lösung leuchten die Anfangsbuchstaben in der Schichtfarbe (passt zu den deutschen und englischen Namen) |
| 2 | Daten auf Reisen | Animation: Der Sender schreibt auf Schicht 7 eine Nachricht, jede Schicht ergänzt ihren Header (Schicht 2 auch den Trailer), Bits übers Kabel, der Empfänger entfernt die Header von Schicht 1 bis 7 |
| 3 | OSI-Dojo | 4 Gürtel: Schichten & Nummern, Merksatz, Geräte & Protokolle, Kapselung |

## Hinweise für Lehrkräfte

- Der Planer übt **nur gleich große Subnetze (FLSM)** – alle Abteilungen bekommen dieselbe Maske.
- **Hilfen einblenden** (Schalter oben im Planer) zeigt das kleinste passende Subnetz je Abteilung
  und einen Rechenhinweis für FLSM. Automatische Lösungsvorschläge gibt es nicht.
- **Neue Aufgabe würfeln** erzeugt zufällige Hostzahlen für die drei Abteilungen.
- **Ping** (Schritt 5): Gerät anklicken → „Ping senden“ → Ziel anklicken. Der Paketweg wird anhand der
  eingetragenen IP-Adressen, Masken und Gateways simuliert – inklusive typischer Fehlermeldungen von Windows.
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
assets/tor.css        Dojo-Tor als Rahmen um die ganze Seite (Dach, Säulen, Boden)
assets/tor.js         Blütenblätter neben den Säulen
assets/osi.js         OSI-Schichten (auch fürs Dojo), Merksatz-Puzzle, Kapselungs-Animation
assets/osi-dojo.js    OSI Station 3
assets/mac.js         MAC-Rechenkern und MAC-Stationen 1–2
assets/mac-dojo.js    MAC-Station 3
assets/ipv4.js        Rechenkern (Parsen, Masken, Netz/Broadcast, Klassen, RFC 1918)
assets/ui.js          Bit-Darstellung, Legende, Speicher, Navigation mit Themen und Freischaltung
assets/dojo-engine.js Übungs-Mechanik für alle Themen: Gürtel, Serie, Stempel, Feuerwerk
assets/grundlagen.js  Station 1
assets/werkstatt.js   Station 2
assets/klassen.js     Station 3
assets/besondere.js   Station 4
assets/header4.js     Station 5
assets/dojo.js        Station 6 (Aufgaben)
assets/planer.js      Station 7
assets/topo.js        Topologie-Kern: Geräte zeichnen, Leitungen ziehen, Struktur prüfen
assets/topologien.js  Topologien Station 1 und 2
assets/topo-dojo.js   Topologien Station 3
assets/ipv6.js        IPv6-Rechenkern (parsen, kürzen, Typ, Präfix, EUI-64)
assets/ipv6-stationen.js  IPv6 Stationen 1–4
assets/ipv6-dojo.js   IPv6 Station 5
assets/images/        Gürtelbilder aus Netzwerkkabel (guertel-<farbe>.png), Dojo-Tor als Rahmen
                      (rahmen.webp) und Illustrationen der Stationen (el-*.webp)
assets/images/tor/    Einzelteile des Seitenrahmens und Blütenblätter
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
