# Subnet-Dojo

Interaktive Lernseite für IPv4, Subnetzmasken und Subnetting – gedacht für den Unterricht.
Die Seite ist rein statisch (HTML, CSS, JavaScript), braucht keinen Build-Schritt und lädt
**keine externen Ressourcen** (keine Web-Fonts, kein CDN, kein Tracking).

## Stationen

| # | Station | Inhalt |
|---|---------|--------|
| 1 | Grundlagen | 32 Bit, Oktette, Netz-/Hostanteil, Maske, UND-Verknüpfung, 2ⁿ − 2 |
| 2 | Masken-Werkstatt | IP + Maske eingeben, Bits live eingefärbt, Maskenbits anklickbar, Subnetzliste |
| 3 | Klasse C oder /16? | Klärt das Missverständnis RFC 791 (Klassen) ↔ RFC 1918 (CIDR-Blöcke), Block-Explorer, Zeitstrahl |
| 4 | Übungs-Dojo | 7 Gürtel mit zufällig erzeugten Aufgaben (5 richtige in Folge = Gürtel) |
| 5 | Firmennetz-Planer | Verwaltung, Entwicklung, Reparatur: Klasse/CIDR wählen → Bedarf → Subnetting → Adressraum-Karte → Netzplan mit IP-Vergabe → Zusammenfassung |

## Hinweise für Lehrkräfte

- **Hilfen & Lösungsvorschläge** (Schalter oben im Planer) blendet Tipps, das kleinste passende
  Subnetz sowie Vorschläge für gleich große Subnetze (FLSM), VLSM und die IP-Vergabe ein.
- **Neue Aufgabe würfeln** erzeugt zufällige Hostzahlen für die drei Abteilungen.
- **Link zu diesem Plan kopieren** speichert den kompletten Planungsstand in der URL.
  So lassen sich vorbereitete Aufgaben verteilen oder Lösungen abgeben.
- Fortschritt (Gürtel) und der aktuelle Plan werden nur im `localStorage` des jeweiligen
  Browsers gespeichert.

## Lokal verwenden

`index.html` einfach im Browser öffnen – ein Webserver ist nicht nötig.

## Auf GitHub Pages veröffentlichen

1. Neues Repository auf GitHub anlegen, z. B. `subnet-dojo`.
2. Dateien hochladen bzw. pushen:
   ```bash
   git init
   git add .
   git commit -m "Subnet-Dojo"
   git branch -M main
   git remote add origin https://github.com/<benutzername>/subnet-dojo.git
   git push -u origin main
   ```
3. Im Repository: **Settings → Pages → Build and deployment → Source: Deploy from a branch**,
   Branch `main`, Ordner `/ (root)` wählen und speichern.
4. Nach ca. einer Minute ist die Seite unter `https://<benutzername>.github.io/subnet-dojo/` erreichbar.

## Aufbau

```
index.html            Alle Stationen (Navigation über #grundlagen, #werkstatt, …)
assets/style.css      Gestaltung inkl. Dark Mode und Druckansicht
assets/ipv4.js        Rechenkern (Parsen, Masken, Netz/Broadcast, Klassen, RFC 1918)
assets/ui.js          Bit-Darstellung, Legende, Speicher, Navigation
assets/grundlagen.js  Station 1
assets/werkstatt.js   Station 2
assets/klassen.js     Station 3
assets/dojo.js        Station 4
assets/planer.js      Station 5
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
