# Netzwerktechnik-Dojo
# [Hier öffnen](https://flowthetensor.github.io/Netzwerk-Dojo/)

Interaktive Lernseite für Netzwerktechnik – serielle Schnittstellen (RS-232, UART, I²C, SPI), MAC-Adressen, IPv4 und Subnetting, Netzwerk-Topologien, IPv6, das ISO/OSI-Modell, Kabel und Leitungscodes, Netzwerkdienste (DHCP, DNS, URL, Ports) sowie Verschlüsselung und Anonymität, gedacht für den Unterricht.
Die Seite ist rein statisch (HTML, CSS, JavaScript), braucht keinen Build-Schritt und lädt
**keine externen Ressourcen** (keine Web-Fonts, kein CDN, kein Tracking).

## Thema Serielle Schnittstellen

Erstes Thema. Es erzählt die Geschichte von der Punkt-zu-Punkt-Verbindung (RS-232, UART) über Busse mit
Adressen (I²C, SPI) bis zum Ethernet, das danach mit den MAC-Adressen weitergeht. Grundlage ist das Arbeitsblatt
„Einfache Schnittstellen zur Kommunikation“, fachlich korrigiert: UART ist der Baustein, RS-232 die elektrische
Schnittstelle (nicht „nur RX/TX = UART“); Bus kommt von *omnibus* (nicht „Binary Unit System“); M.2 ist eine
Bauform und PCIe seriell (nicht „parallele Schnittstelle M.2“); die SPI-Schaltung mit CS1–CS3 ist nicht
kaskadiert, erst die Daisy Chain; Parität zählt die Einsen einschließlich Paritätsbit; Baud = Signalschritte
pro Sekunde, nur bei zwei Pegeln gleich Bit/s.

| # | Station | Inhalt |
|---|---------|--------|
| 1 | Seriell & parallel | Ein Zeichen seriell und parallel Takt für Takt, Laufzeitunterschiede bei hohem Takt, Vor- und Nachteile, früher parallel/heute seriell, uni- und bidirektional, Bus am Beispiel KNX und was ein Bus regeln muss, Zeitleiste |
| 2 | RS-232 | DE-9-Stecker mit klickbaren Pins (Datenleitungen 2, 3, 5), Pegel UART gegen RS-232, Nullmodem und 1:1-Kabel, Formatkürzel wie 8N1, Baud |
| 3 | UART-Telegramm | UART vs. RS-232, Telegramm-Baukasten (Datenbits, Parität, Stoppbits, Baudrate) mit Bitzeit und Telegrammen pro Sekunde, MSB/LSB, Paritätsbit mit Störungs-Simulation, Übungen vom Arbeitsblatt: Telegramme pro Sekunde, Mitschnitte im Stil von PulseView (Baudrate aus 104 µs, „a?“ / „ok“ dekodieren) |
| 4 | I²C | Bus mit Pull-ups und Teilnehmern, Adressierung als SCL/SDA-Signal mit ACK/NACK, Übung zum PulseView-Mitschnitt vom Arbeitsblatt (0x08, NACK, Datenrate aus 10 µs), 112 Adressen, Geschwindigkeiten |
| 5 | SPI & Vergleich | Vier Leitungen, Schieberegister-Tausch Takt für Takt, Übung zum PulseView-Mitschnitt vom Arbeitsblatt (79 = 0x4F, Datenrate aus 1 µs), eigene CS-Leitungen vs. Daisy Chain, Vergleich UART/I²C/SPI/Ethernet, PCIe und M.2 |
| 6 | Seriell-Dojo | 6 Gürtel: seriell/parallel & Bus, RS-232, Übertragungsformat & Parität, Rechnen mit der Baudrate, Mitschnitte dekodieren, I²C & SPI |

## Thema MAC-Adressen

Wird freigeschaltet, sobald alle Stationen der seriellen Schnittstellen einmal geöffnet wurden. Wer schon
vorher in einem Thema war, wird nicht ausgesperrt.

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

## Thema Kabel & Signale

Wird freigeschaltet, sobald alle OSI-Stationen einmal geöffnet wurden. Grundlage sind die Arbeitsblätter
Leitungscodierung, Ethernetstandards und Netzwerkkabel, auf den aktuellen Stand gebracht.

| # | Station | Inhalt |
|---|---------|--------|
| 1 | Netzwerkkabel | Koax, Twisted Pair, Glasfaser im Querschnitt; Differenzsignal mit Störungs-Regler; Schirmung XX/YTP mit Decoder (ungeschirmt in Deutschland unüblich); Multimode und Singlemode |
| 2 | Kategorien & Stecker | Kat. 5e bis 8.2 mit Klassen und Frequenzen, Berater „Welche Kategorie brauche ich?“, RJ45 (auch für 10GBASE-T und Kat. 8.1), GG45/TERA/ARJ45 |
| 3 | RJ45-Werkstatt | T568A/T568B, Crimp-Übung, Patchkabel und Crossover (10/100 und Gigabit), Auto-MDI-X, Crossover-Verbindungsübung wie auf dem Arbeitsblatt |
| 4 | Leitungscodes | Taktproblem mit Regler für die Taktabweichung, Manchester-Code live gezeichnet, ASCII-Übung mit zwei Zeichen, Vergleich Manchester / MLT-3 / PAM-5 (vereinfacht) |
| 5 | Ethernet-Standards | Namen zerlegen (Rate · BASE · Medium), Stammbaum von 10BASE5 bis 40GBASE-T mit Kennzeichnung „Geschichte“, CSMA/CD und 5-4-3-Regel als Rückblick |
| 6 | Kabel-Dojo | 5 Gürtel: Kabel & Schirmung, Kategorien, RJ45-Belegung, Manchester-Code, Ethernet-Standards |

## Thema Netzwerkdienste

Wird freigeschaltet, sobald alle Kabel-Stationen einmal geöffnet wurden. Grundlage sind die Arbeitsblätter
DHCP sowie DNS, URL und Ports, auf den aktuellen Stand gebracht (Ports 0–65 535 mit IANA-Bereichen,
HTTPS/IMAPS/SSH statt der unverschlüsselten Dienste, DHCP immer UDP 67/68).

| # | Station | Inhalt |
|---|---------|--------|
| 1 | DHCP | Was DHCP verteilt; DORA Schritt für Schritt mit Paketinhalt (MAC, IP, Ports) und `ipconfig /all`; Lease mit T1/T2 und Schalter „Server erreichbar“; Pool-Rechner mit Prüfung von Gateway, Netz- und Broadcast-Adresse; APIPA, fremder DHCP-Server, SLAAC |
| 2 | DNS | Namensbaum zu einem eingegebenen Namen; Auflösung über Resolver, Root, TLD und Domain-Nameserver als Animation, zweiter Aufruf aus dem Cache; Eintragstypen; nslookup-Simulator mit Beispieldaten für example.com |
| 3 | URL | URL-Zerleger (Schema, Host, Port, Standort, Ressource, Query, Fragment, IPv6, mailto), Standardports, Übung „Teile benennen“ |
| 4 | Ports | Portbereiche mit Nachschlagen, Tabelle wichtiger Ports, Socket-Demo (Quell-/Zielport, zwei Tabs), TCP oder UDP, Ablauf „Webseite öffnen“ mit Fehlersuche |
| 5 | Dienste-Dojo | 6 Gürtel: DHCP, DNS, URL, Portnummern, Portbereiche & Sockets, Fehlersuche & Zusammenspiel |

## Thema Verschlüsselung & Anonymität

Letztes Thema, wird nach den Netzwerkdiensten freigeschaltet. Grundlage sind die Arbeitsblätter Verschlüsselung
und Anonym im Netz, fachlich korrigiert und aktualisiert (digitale Signatur ohne „Schlüsseltausch“, TLS 1.3 mit
Diffie-Hellman statt Pre-Master-Secret, Zwiebelprinzip „jeder Knoten entfernt eine Schicht“, Proxy-Stufen nach
weitergegebenen Daten, Warnung vor freien Proxys).

| # | Station | Inhalt |
|---|---------|--------|
| 1 | Symmetrisch | Prinzip, Caesar mit Alphabet-Leiste, Caesar knacken mit Häufigkeitsanalyse, XOR/One-Time-Pad (Bits wie auf dem Arbeitsblatt, Wort mit Zufallsschlüssel), DES bis AES, Schlüsselanzahl n·(n−1)/2 |
| 2 | Öffentlich & privat | Schlüsselpaar und Briefkasten, „Welcher Schlüssel wofür?“ (Alice, Bob, Eve), Mini-RSA zum Nachrechnen, digitale Signatur mit Hashwert, symmetrisch vs. asymmetrisch, hybrid |
| 3 | HTTPS & Zertifikate | Schutzziele, Diffie-Hellman mit kleinen Zahlen, TLS-1.3-Handshake als Ablauf, Forward Secrecy, Zertifikatskette, Browser-Warnungen (abgelaufen, falscher Name, selbst signiert, Angreifer im WLAN) |
| 4 | Proxy & VPN | Pizza-Party als Proxy, Proxy-Stufen, Proxy-Kette und eigener Provider, VPN (Site-to-Site, Remote Access, kommerziell) mit Schalter |
| 5 | Tor & Anonymität | Zwiebelprinzip Schritt für Schritt, Tabelle „Wer sieht was?“ für direkt/Proxy/VPN/Tor mit und ohne HTTPS, Grenzen der Anonymität |
| 6 | Sicherheits-Dojo | 6 Gürtel: Caesar & XOR, symmetrisch & asymmetrisch, Schlüsselpaar/Signatur/RSA, HTTPS & Zertifikate, Proxy & VPN, Tor & „Wer sieht was?“ |

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
assets/kabel.js       Kabel-Daten (auch fürs Dojo), Kabel-Stationen 1–3
assets/signale.js     Manchester-Rechenkern, Kabel-Station 4
assets/ethernet.js    Ethernet-Standards (auch fürs Dojo), Kabel-Station 5
assets/kabel-dojo.js  Kabel-Station 6
assets/dhcp.js        Schritt-Steuerung der Dienste-Stationen, Dienste-Station 1
assets/dns.js         Dienste-Station 2
assets/ports.js       URL-Zerleger und Portdaten (auch fürs Dojo), Dienste-Stationen 3–4
assets/dienste-dojo.js  Dienste-Station 5
assets/krypto.js      Krypto-Rechenkern (Caesar, XOR, RSA; auch fürs Dojo), Sicherheits-Stationen 1–2
assets/tls.js         Sicherheits-Station 3
assets/anonym.js      „Wer sieht was?“-Daten (auch fürs Dojo), Sicherheits-Stationen 4–5
assets/krypto-dojo.js Sicherheits-Station 6
assets/seriell.js     Seriell-Rechenkern (Telegramm, Parität, Formatkürzel, Pins; auch fürs Dojo), Seriell-Stationen 1–3
assets/bus.js         I²C-Teilnehmer (auch fürs Dojo), Seriell-Stationen 4–5
assets/seriell-dojo.js  Seriell-Station 6
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
- [RFC 2131](https://www.rfc-editor.org/info/rfc2131/) – Dynamic Host Configuration Protocol
- [RFC 1034](https://www.rfc-editor.org/info/rfc1034/) / [RFC 1035](https://www.rfc-editor.org/info/rfc1035/) – Domain Name System
- [RFC 3986](https://www.rfc-editor.org/info/rfc3986/) – URI: Generic Syntax
- [RFC 6335](https://www.rfc-editor.org/info/rfc6335/) – Portbereiche und Vergabe durch die IANA
- [RFC 8446](https://www.rfc-editor.org/info/rfc8446/) – TLS 1.3
- [NXP UM10204](https://www.nxp.com/docs/en/user-guide/UM10204.pdf) – I²C-Bus Specification and User Manual
- TIA-232-F – Interface Between Data Terminal Equipment and Data Circuit-Terminating Equipment
