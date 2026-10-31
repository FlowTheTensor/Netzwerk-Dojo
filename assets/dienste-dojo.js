/* Netzwerkdienste · Station 5 – Dienste-Dojo: Aufgaben-Generatoren (Mechanik in dojo-engine.js) */
'use strict';

(() => {
  const { RANGES, DEFAULT_PORT, fmt } = DIENSTE;
  const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const shuffle = a => [...a].sort(() => Math.random() - .5);
  const mc = (q, right, wrong, sol) => ({ q, choices: shuffle([right, ...wrong]), check: x => x === right, sol });
  const num = x => Number(x.replace(/[^\d]/g, '') || NaN);

  // Weiß: DHCP
  const DORA = ['DHCPDISCOVER', 'DHCPOFFER', 'DHCPREQUEST', 'DHCPACK'];
  const DHCP_FACTS = [
    ['Wofür steht <b>DHCP</b>?', 'Dynamic Host Configuration Protocol', ['Dynamic Hypertext Control Protocol', 'Domain Host Configuration Protocol', 'Dynamic Host Connection Port'], '<b>D</b>ynamic <b>H</b>ost <b>C</b>onfiguration <b>P</b>rotocol – automatische Konfiguration von Hosts.'],
    ['An welche IP-Adresse schickt ein Client sein <b>DHCPDISCOVER</b>?', '255.255.255.255', ['192.168.1.1', '0.0.0.0', '224.0.0.1'], 'Der Client kennt noch keinen Server – er sendet per <b>Broadcast</b> an 255.255.255.255.'],
    ['Welche <b>Quell-IP</b> hat ein DHCPDISCOVER?', '0.0.0.0', ['255.255.255.255', '169.254.0.1', '127.0.0.1'], 'Der Client hat noch keine Adresse und sendet deshalb von <b>0.0.0.0</b>.'],
    ['Welche Ports benutzt DHCP?', 'UDP 67 (Server) und 68 (Client)', ['TCP 67 und 68', 'UDP 53', 'TCP 80 und 443'], 'DHCP läuft über <b>UDP</b>: Server auf Port <b>67</b>, Client auf Port <b>68</b>.'],
    ['Ein PC hat die Adresse <b>169.254.23.7</b>. Was ist passiert?', 'Kein DHCP-Server hat geantwortet', ['Der DNS-Server ist ausgefallen', 'Die Adresse wurde von Hand eingetragen', 'Der PC ist mit dem Internet verbunden'], 'Adressen aus <b>169.254.0.0/16</b> (APIPA) gibt sich ein Gerät selbst, wenn DHCP nicht klappt.'],
    ['Woran erkennt ein DHCP-Server ein Gerät wieder, das schon einmal da war?', 'an seiner MAC-Adresse', ['an seiner IP-Adresse', 'am Gerätenamen im DNS', 'an der Portnummer'], 'Der Client schickt seine <b>MAC-Adresse</b> mit. Darüber kann der Server ihm wieder dieselbe IP geben oder eine Reservierung zuordnen.'],
    ['Was verteilt ein DHCP-Server <b>nicht</b>?', 'die MAC-Adresse', ['die Subnetzmaske', 'das Standard-Gateway', 'den DNS-Server'], 'Die <b>MAC-Adresse</b> steckt fest in der Netzwerkkarte. DHCP verteilt IP-Adresse, Maske, Gateway, DNS-Server und Lease-Dauer.'],
    ['Warum schickt der Client den <b>DHCPREQUEST</b> per Broadcast?', 'Damit alle DHCP-Server erfahren, welches Angebot gewählt wurde', ['Weil er die IP des Servers nicht kennt', 'Damit der Switch die Adresse lernt', 'Weil DHCP kein Unicast kann'], 'Der Request nennt den gewählten Server. Andere Server, die auch ein Angebot geschickt haben, geben ihre Adresse <b>wieder frei</b>.'],
    ['Warum darf das Gateway <b>nicht</b> im DHCP-Pool liegen?', 'Der Server könnte die Adresse des Routers an ein anderes Gerät vergeben', ['Weil Router keine IP-Adresse brauchen', 'Weil der Pool nur gerade Adressen enthält', 'Weil sonst DNS nicht funktioniert'], 'Liegt eine fest vergebene Adresse im Pool, kann es zu einem <b>Adresskonflikt</b> kommen.'],
    ['Ab wann darf ein Client eine angebotene Adresse benutzen?', 'nach dem DHCPACK', ['nach dem DHCPOFFER', 'sofort nach dem DHCPDISCOVER', 'nach dem DHCPREQUEST'], 'Erst die Bestätigung (<b>ACK</b>) des Servers macht die Vergabe gültig.'],
  ];
  function genDhcp() {
    const v = rnd(0, 3);
    if (v === 0) return mc(...pick(DHCP_FACTS));
    if (v === 1) {
      const i = rnd(0, 3);
      return mc(`Welche Nachricht ist die <b>${i + 1}.</b> beim Bezug einer Adresse per DHCP?`, DORA[i], DORA.filter((_, k) => k !== i),
        `<b>DORA</b>: ${DORA.map((d, k) => (k === i ? `<b>${d}</b>` : d)).join(' → ')}`);
    }
    if (v === 2) {
      const a = rnd(10, 150), b = a + rnd(4, 80);
      return {
        q: `Ein DHCP-Pool reicht von <b>192.168.${rnd(0, 20)}.${a}</b> bis <b>…${b}</b> (gleiches Netz). Wie viele Adressen kann der Server vergeben?`, ph: 'Anzahl',
        check: x => num(x) === b - a + 1,
        sol: `Ende − Start + 1 = ${b} − ${a} + 1 = <b>${b - a + 1}</b>. Das „+ 1“ nicht vergessen: Start und Ende gehören beide dazu.`,
      };
    }
    const L = pick([8, 24, 48, 72, 240]);
    return {
      q: `Die Lease-Dauer beträgt <b>${L} Stunden</b>. Nach wie vielen Stunden versucht der Client zum ersten Mal, sie beim Server zu verlängern?`, ph: 'Stunden',
      check: x => Number(x.replace(',', '.').replace(/[^\d.]/g, '')) === L / 2,
      sol: `Nach der <b>Hälfte</b> der Lease-Dauer (T1 = 50 %): <b>${L / 2} h</b>. Klappt das nicht, fragt er bei 87,5 % alle Server per Broadcast.`,
    };
  }

  // Gelb: DNS
  const RR = [['A', 'Name → IPv4-Adresse'], ['AAAA', 'Name → IPv6-Adresse'], ['CNAME', 'Alias für einen anderen Namen'], ['MX', 'Mailserver der Domain'], ['NS', 'zuständiger Nameserver der Domain'], ['PTR', 'IP-Adresse → Name'], ['TXT', 'beliebiger Text, z. B. Regeln gegen gefälschte E-Mails']];
  const DOMAINS = ['www.bsnes.de', 'mail.schule.example.com', 'de.wikipedia.org', 'shop.example.net', 'moodle.bsnes.de', 'www.example.org', 'cloud.firma.example.com'];
  const DNS_FACTS = [
    ['Über welchen Port laufen normale DNS-Anfragen?', '53', ['67', '80', '443'], 'DNS nutzt <b>Port 53</b> – meist UDP, für große Antworten TCP.'],
    ['Wen fragt ein Laptop, wenn er eine IP-Adresse zu einem Namen braucht?', 'seinen DNS-Resolver', ['direkt einen Root-Server', 'den DHCP-Server', 'den Webserver'], 'Der Laptop fragt den <b>Resolver</b>, den ihm DHCP genannt hat. Der Resolver fragt dann Root-, TLD- und Domain-Nameserver.'],
    ['In welcher Reihenfolge fragt ein Resolver, wenn nichts im Cache ist?', 'Root → TLD → Nameserver der Domain', ['TLD → Root → Nameserver der Domain', 'Nameserver der Domain → TLD → Root', 'Webserver → Root → TLD'], 'Von oben nach unten durch den Baum: <b>Root → TLD → autoritativer Nameserver</b>.'],
    ['Was gibt die <b>TTL</b> eines DNS-Eintrags an?', 'wie lange die Antwort im Cache bleiben darf', ['wie viele Router das Paket passieren darf', 'wie lange die Domain registriert ist', 'die Größe des Eintrags'], 'Die <b>Time to Live</b> sagt Resolvern und Clients, wie viele Sekunden sie die Antwort zwischenspeichern dürfen.'],
    ['Mit welchem Befehl stellt man unter Windows eine DNS-Anfrage von Hand?', 'nslookup', ['ipconfig /renew', 'tracert', 'arp -a'], '<b>nslookup</b> fragt den DNS-Server direkt, z. B. <code>nslookup -type=mx example.com</code>.'],
    ['Welcher Nameserver ist für eine Domain <b>autoritativ</b>?', 'der Nameserver, bei dem die Einträge der Domain gespeichert sind', ['jeder Resolver mit Cache', 'immer ein Root-Server', 'der DHCP-Server im Netz'], 'Der <b>autoritative</b> Nameserver hat die Einträge selbst – alle anderen geben nur weiter, was sie gelernt haben.'],
    ['Wer betreibt die Nameserver der TLD <b>.de</b>?', 'DENIC', ['ICANN', 'Deutsche Telekom', 'IEEE'], 'Die <b>DENIC eG</b> in Frankfurt verwaltet alle .de-Domains.'],
    ['Wo schaut Windows nach, <b>bevor</b> es den DNS-Server fragt?', 'im eigenen Cache und in der Datei hosts', ['beim DHCP-Server', 'im Root-Server', 'in der ARP-Tabelle'], 'Zuerst <b>Cache</b> und <b>hosts</b>-Datei. Erst wenn dort nichts steht, geht eine Anfrage ins Netz.'],
    ['Was bedeutet „Nicht autorisierende Antwort“ bei nslookup?', 'Die Antwort kommt aus einem Cache', ['Die Antwort ist falsch', 'Man hat keine Rechte für die Anfrage', 'Die Domain existiert nicht'], 'Der Resolver hatte die Antwort schon <b>zwischengespeichert</b> und hat nicht beim zuständigen Server nachgefragt.'],
  ];
  function genDns() {
    const v = rnd(0, 3);
    if (v === 0) {
      const [t, m] = pick(RR);
      const others = shuffle(RR.filter(r => r[0] !== t)).slice(0, 3);
      return Math.random() < .5
        ? mc(`Welcher DNS-Eintragstyp bedeutet: <b>${m}</b>?`, t, others.map(r => r[0]), `<b>${t}</b>: ${m}.`)
        : mc(`Was speichert ein DNS-Eintrag vom Typ <b>${t}</b>?`, m, others.map(r => r[1]), `<b>${t}</b>: ${m}.`);
    }
    if (v === 1) {
      const d = pick(DOMAINS);
      const l = d.split('.');
      const [what, want, how] = pick([
        ['die Top-Level-Domain (ohne Punkt)', l.at(-1), 'ganz rechts'],
        ['die Second-Level-Domain (nur das Label)', l.at(-2), 'das zweite Label von rechts'],
      ]);
      return { q: `Wie lautet in <b>${d}</b> ${what}?`, ph: 'Label', check: x => x.trim().toLowerCase().replace(/^\.|\.$/g, '') === want, sol: `Von rechts lesen: ${how} steht <b>${want}</b>.` };
    }
    return mc(...pick(DNS_FACTS));
  }

  // Orange: URL
  const HOSTS = ['www.example.com', 'intranet.schule.example', 'shop.example.org', '172.30.10.12', 'cloud.example.net', 'beispiel.de'];
  const DIRS = ['/schule/', '/downloads/2026/', '/wiki/', '/klassen/10b/', '/beispiel1/', '/admin/'];
  const FILES = ['index.html', 'stundenplan.html', 'aufgabe.pdf', 'logo.png', 'status.php'];
  function genUrl() {
    const v = rnd(0, 3);
    if (v === 3) {
      return mc(...pick([
        ['Was bewirkt der Teil <b>#kontakt</b> in einer URL?', 'Er springt zu einer Stelle innerhalb der Seite', ['Er wählt den Port', 'Er gibt den Benutzernamen an', 'Er verschlüsselt die Verbindung'], 'Das <b>Fragment</b> ist eine Sprungmarke in der Seite. Es wird nicht an den Server geschickt.'],
        ['Was steht in einer URL hinter dem <b>?</b>', 'Parameter für den Server (Query)', ['der Port', 'der Domainname', 'die Sprungmarke'], 'Hinter dem Fragezeichen folgt die <b>Query</b>, z. B. <code>?suche=netzwerk&amp;seite=2</code>.'],
        ['Warum steht eine IPv6-Adresse in einer URL in <b>eckigen Klammern</b>?', 'Damit ihre Doppelpunkte nicht mit dem Port verwechselt werden', ['Weil IPv6 sonst nicht verschlüsselt wird', 'Weil Browser IPv6 sonst ignorieren', 'Damit DNS sie auflöst'], 'Beispiel: <code>http://[2001:db8::1]:8080/</code> – der Port steht hinter der Klammer.'],
        ['Welches Schema ist heute der Normalfall für Webseiten?', 'https', ['http', 'ftp', 'telnet'], '<b>HTTPS</b> verschlüsselt die Verbindung mit TLS. Browser warnen bei unverschlüsseltem HTTP.'],
      ]));
    }
    const sch = pick(['https', 'https', 'http', 'ftp']);
    const port = Math.random() < .35 ? String(sch === 'ftp' ? 2121 : pick([8080, 8443])) : '';
    const host = pick(HOSTS), dir = pick(DIRS), file = pick(FILES);
    const url = `${sch}://${host}${port ? ':' + port : ''}${dir}${file}`;
    const [what, want, extra] = v === 0
      ? pick([['den Host', host, ''], ['die Ressource (Datei)', file, ''], ['das Protokoll', sch, '']])
      : v === 1
        ? ['den Port, den der Browser benutzt', port || String(DEFAULT_PORT[sch]), port ? '' : ` Es steht kein Port da – also gilt der Standardport von ${sch}.`]
        : ['den Standort (Pfad zum Ordner)', dir, ''];
    const norm = s => s.trim().toLowerCase().replace(/:\/*$/, '').replace(/^\/+|\/+$/g, '');
    return { q: `Nenne ${what} in<br><code>${url}</code>`, ph: 'Antwort', check: x => norm(x) === norm(want), sol: `<b>${want}</b>.${extra}` };
  }

  // Grün: Portnummern
  const PN = [[21, 'FTP'], [22, 'SSH'], [23, 'Telnet'], [25, 'SMTP'], [53, 'DNS'], [67, 'DHCP-Server'], [80, 'HTTP'], [110, 'POP3'], [123, 'NTP'], [143, 'IMAP'], [161, 'SNMP'], [443, 'HTTPS'], [587, 'SMTP-Submission'], [993, 'IMAPS'], [3389, 'RDP']];
  const UDP = { DNS: 'UDP (für große Antworten auch TCP)', 'DHCP-Server': 'UDP', NTP: 'UDP', SNMP: 'UDP' };
  function genPort() {
    const v = rnd(0, 3);
    const [p, s] = pick(PN);
    if (v === 0) return mc(`Welcher Dienst nutzt standardmäßig <b>Port ${p}</b>?`, s, shuffle(PN.filter(x => x[1] !== s)).slice(0, 3).map(x => x[1]), `Port ${p} = <b>${s}</b>.`);
    if (v === 1) return { q: `Welchen Port nutzt <b>${s}</b>?`, ph: 'Portnummer', check: x => num(x) === p, sol: `${s} = Port <b>${p}</b>.` };
    if (v === 2) {
      const [p2, s2] = pick(PN.filter(x => ['DNS', 'DHCP-Server', 'NTP', 'SNMP', 'HTTP', 'SSH', 'SMTP', 'IMAPS', 'RDP'].includes(x[1])));
      const udp = !!UDP[s2];
      return mc(`Über welches Transportprotokoll läuft <b>${s2}</b> (Port ${p2}) normalerweise?`, udp ? 'UDP' : 'TCP', [udp ? 'TCP' : 'UDP', 'IP', 'ICMP'],
        udp ? `${s2}: <b>${UDP[s2]}</b> – kurze Anfragen, bei denen ein Verbindungsaufbau zu lange dauern würde.` : `${s2}: <b>TCP</b> – die Daten müssen vollständig und in der richtigen Reihenfolge ankommen.`);
    }
    return mc(...pick([
      ['Welcher Dienst ersetzt das unverschlüsselte <b>Telnet</b> (Port 23)?', 'SSH (Port 22)', ['FTP (Port 21)', 'HTTP (Port 80)', 'SNMP (Port 161)'], '<b>SSH</b> verschlüsselt den Fernzugriff – Telnet überträgt sogar Passwörter im Klartext.'],
      ['Welcher Port gehört zu <b>IMAP verschlüsselt</b>?', '993', ['143', '995', '587'], 'IMAP 143, <b>IMAPS 993</b>, POP3 110, POP3S 995.'],
      ['Über welchen Port schickt ein <b>Mailprogramm</b> heute E-Mails an seinen Mailserver?', '587', ['25', '110', '143'], 'Das Mailprogramm nutzt <b>Port 587</b> (Submission) mit Anmeldung und Verschlüsselung. Port 25 verwenden die Mailserver untereinander.'],
      ['Welcher Port gehört zu <b>HTTP</b> und welcher zu <b>HTTPS</b>?', '80 und 443', ['443 und 80', '8080 und 8443', '21 und 22'], 'HTTP <b>80</b>, HTTPS <b>443</b>.'],
    ]));
  }

  // Blau: Portbereiche und Sockets
  function genSock() {
    const v = rnd(0, 3);
    if (v === 0) {
      const r = pick(RANGES);
      const n = rnd(r[0], r[1]);
      return mc(`Zu welchem Bereich gehört <b>Port ${fmt(n)}</b>?`, r[2], RANGES.filter(x => x !== r).map(x => x[2]),
        `0 – 1 023 System-Ports · 1 024 – 49 151 registrierte Ports · 49 152 – 65 535 dynamische Ports. ${n} gehört zu den <b>${r[2]}</b>.`);
    }
    if (v === 1) {
      const sp = rnd(49152, 65535);
      const [dp, s] = pick([[443, 'HTTPS'], [22, 'SSH'], [993, 'IMAPS'], [80, 'HTTP']]);
      const back = Math.random() < .5;
      return {
        q: `Ein Laptop öffnet eine ${s}-Verbindung von <code>192.168.1.80:${sp}</code> zu <code>192.0.2.44:${dp}</code>. Welchen <b>${back ? 'Zielport' : 'Quellport'}</b> hat die <b>Antwort</b> des Servers?`, ph: 'Port',
        check: x => num(x) === (back ? sp : dp),
        sol: `In der Antwort sind Quelle und Ziel vertauscht: Quelle <code>192.0.2.44:${dp}</code>, Ziel <code>192.168.1.80:${sp}</code>. Gesucht: <b>${back ? sp : dp}</b>.`,
      };
    }
    if (v === 2) {
      return pick([
        { q: 'Wie heißt die höchste mögliche Portnummer?', ph: 'Zahl', check: x => num(x) === 65535, sol: 'Ports sind 16 Bit lang: 2<sup>16</sup> = 65 536 Werte, also <b>0 bis 65 535</b>.' },
        { q: 'Wie viele Bit hat eine Portnummer?', ph: 'Bit', check: x => num(x) === 16, sol: '<b>16 Bit</b> – deshalb gibt es die Ports 0 bis 65 535.' },
        { q: 'Auf welcher OSI-Schicht werden Ports verarbeitet? (Nummer)', ph: '1 – 7', check: x => num(x) === 4, sol: 'Ports stehen im TCP- bzw. UDP-Header – <b>Schicht 4</b>, Transportschicht.' },
      ]);
    }
    return mc(...pick([
      ['Was ist ein <b>Socket</b>?', 'die Kombination aus IP-Adresse und Port', ['ein Netzwerkstecker', 'ein anderer Name für MAC-Adresse', 'ein DNS-Eintrag'], 'Ein Socket wie <code>192.0.2.44:443</code> adressiert ein Programm auf einem bestimmten Gerät.'],
      ['Zwei Browser-Tabs sind mit demselben Webserver auf Port 443 verbunden. Woran unterscheidet der Server die beiden Verbindungen?', 'an den unterschiedlichen Quellports', ['an den unterschiedlichen MAC-Adressen', 'an den unterschiedlichen Zielports', 'gar nicht – das geht nicht'], 'Jeder Tab hat einen eigenen zufälligen <b>Quellport</b> aus dem dynamischen Bereich.'],
      ['Welche Eigenschaft hat <b>UDP</b>?', 'kein Verbindungsaufbau und keine Empfangsbestätigung', ['Drei-Wege-Handshake vor jeder Übertragung', 'garantiert die richtige Reihenfolge', 'wiederholt verlorene Pakete'], '<b>UDP</b> schickt einfach los – schnell, aber ohne Garantie. Handshake, Bestätigung und Reihenfolge bietet TCP.'],
      ['Welche Eigenschaft hat <b>TCP</b>?', 'Es bestätigt den Empfang und wiederholt verlorene Segmente', ['Es hat keine Portnummern', 'Es ist schneller als UDP, weil es nichts bestätigt', 'Es wird nur für DNS benutzt'], '<b>TCP</b> ist verbindungsorientiert und zuverlässig: Handshake, Nummerierung, Bestätigung, Wiederholung.'],
      ['Woher kommt der <b>Quellport</b> eines Clients?', 'Das Betriebssystem wählt ihn zufällig aus dem dynamischen Bereich', ['Er ist immer 80', 'Ihn vergibt der DHCP-Server', 'Er steht im DNS'], 'Clients nutzen einen freien, zufällig gewählten <b>dynamischen Port</b> (Windows: 49 152 – 65 535).'],
    ]));
  }

  // Lila: Fehlersuche und Zusammenspiel
  const CASES = [
    ['<code>ipconfig</code> zeigt die Adresse <b>169.254.41.7</b>, kein Standard-Gateway.', 'DHCP', 'Eine 169.254-Adresse vergibt sich das Gerät selbst, wenn <b>kein DHCP-Server</b> antwortet.'],
    ['<code>ping 192.0.2.44</code> klappt. <code>ping www.example.com</code> meldet: „Host wurde nicht gefunden“.', 'DNS', 'Die Verbindung per IP-Adresse geht – nur der Name lässt sich nicht auflösen: <b>DNS</b>.'],
    ['Der Name wird aufgelöst und <code>ping</code> klappt, aber die Webseite meldet eine Zeitüberschreitung.', 'Port / Firewall', 'Netz und DNS funktionieren. Der Dienst auf <b>Port 443</b> ist nicht erreichbar – etwa wegen einer Firewall, oder der Webserver läuft nicht.'],
    ['Einige Laptops bekommen plötzlich Adressen aus 192.168.0.0/24 statt 192.168.1.0/24 und kommen nicht ins Internet.', 'zweiter DHCP-Server', 'Ein <b>fremder DHCP-Server</b> (z. B. ein eingesteckter Privat-Router) verteilt eigene Adressen. Abhilfe: Gerät entfernen, DHCP-Snooping am Switch.'],
    ['Ein Drucker hat die feste Adresse 192.168.1.85. Der DHCP-Pool reicht von .80 bis .90. Ab und zu meldet ein Laptop einen Adresskonflikt.', 'statische Adresse im Pool', 'Die feste Adresse liegt <b>im Pool</b>. Abhilfe: Drucker außerhalb des Pools adressieren oder eine Reservierung anlegen.'],
  ];
  const CASE_OPTS = ['DHCP', 'DNS', 'Port / Firewall', 'zweiter DHCP-Server', 'statische Adresse im Pool'];
  const SERVICES = [['vergibt IP-Adressen automatisch', 'DHCP'], ['übersetzt Namen in IP-Adressen', 'DNS'], ['stellt die Uhrzeit aller Geräte', 'NTP'], ['liefert Webseiten verschlüsselt aus', 'HTTPS'], ['ermöglicht verschlüsselten Fernzugriff auf die Konsole', 'SSH'], ['überträgt E-Mails zwischen Mailservern', 'SMTP']];
  function genAll() {
    const v = rnd(0, 3);
    if (v === 0) {
      const [q, right, sol] = pick(CASES);
      return mc(`Fehlersuche: ${q} Wo liegt das Problem?`, right, shuffle(CASE_OPTS.filter(o => o !== right)).slice(0, 3), sol);
    }
    if (v === 1) {
      return mc('Ein Laptop wird eingeschaltet und öffnet <code>https://www.example.com</code>. In welcher Reihenfolge passiert das?', 'DHCP → DNS → TCP-Verbindung → HTTPS-Anfrage',
        ['DNS → DHCP → TCP-Verbindung → HTTPS-Anfrage', 'DHCP → TCP-Verbindung → DNS → HTTPS-Anfrage', 'HTTPS-Anfrage → DNS → DHCP → TCP-Verbindung'],
        'Ohne IP-Adresse geht nichts (<b>DHCP</b>), ohne Ziel-IP keine Verbindung (<b>DNS</b>), dann <b>TCP</b> zu Port 443 und schließlich die <b>HTTPS</b>-Anfrage.');
    }
    if (v === 2) {
      const [d, s] = pick(SERVICES);
      return mc(`Welcher Dienst <b>${d}</b>?`, s, shuffle(SERVICES.filter(x => x[1] !== s)).slice(0, 3).map(x => x[1]), `<b>${s}</b> ${d}.`);
    }
    return pick([
      { q: 'Zu welcher OSI-Schicht gehören DHCP, DNS und HTTP? (Nummer)', ph: '1 – 7', check: x => num(x) === 7, sol: 'Es sind Protokolle der <b>Anwendungsschicht (7)</b>. Sie nutzen TCP oder UDP auf Schicht 4.' },
      mc('Mit welchem Windows-Befehl fordert man eine neue Adresse vom DHCP-Server an?', 'ipconfig /renew', ['ipconfig /flushdns', 'nslookup', 'ipconfig /displaydns'], '<code>ipconfig /release</code> gibt die Adresse zurück, <b><code>ipconfig /renew</code></b> fordert neu an.'),
      mc('Eine Webseite ist umgezogen, dein PC findet aber noch die alte Adresse. Was hilft?', 'ipconfig /flushdns', ['ipconfig /renew', 'ping 127.0.0.1', 'tracert'], 'Der alte Eintrag steckt noch im <b>DNS-Cache</b>. <code>ipconfig /flushdns</code> leert ihn.'),
    ]);
  }

  Dojo.create({
    mount: UI.$('#d-dienste'),
    pageId: 'dienst-dojo',
    storeKey: 'dienste-belts',
    belts: [
      { id: 'weiss', name: 'Weißer Gürtel', topic: 'DHCP', gen: genDhcp },
      { id: 'gelb', name: 'Gelber Gürtel', topic: 'DNS', gen: genDns },
      { id: 'orange', name: 'Oranger Gürtel', topic: 'URL', gen: genUrl },
      { id: 'gruen', name: 'Grüner Gürtel', topic: 'Portnummern', gen: genPort },
      { id: 'blau', name: 'Blauer Gürtel', topic: 'Portbereiche & Sockets', gen: genSock },
      { id: 'lila', name: 'Lila Gürtel', topic: 'Fehlersuche & Zusammenspiel', gen: genAll },
    ],
    note: 'Bei URLs ist Groß- und Kleinschreibung egal, Schrägstriche am Rand auch. Der Fortschritt wird nur in diesem Browser gespeichert.',
  });
})();
