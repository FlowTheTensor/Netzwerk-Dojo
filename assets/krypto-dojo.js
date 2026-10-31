/* Verschlüsselung & Anonymität · Station 6 – Sicherheits-Dojo: Aufgaben-Generatoren (Mechanik in dojo-engine.js) */
'use strict';

(() => {
  const { caesar, xor, modPow, rsa, PRIMES } = KRYPTO;
  const { WHO, sees } = ANONYM;
  const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const shuffle = a => [...a].sort(() => Math.random() - .5);
  const mc = (q, right, wrong, sol) => ({ q, choices: shuffle([right, ...wrong]), check: x => x === right, sol });
  const num = x => Number(x.replace(/[^\d]/g, '') || NaN);
  const up = x => x.trim().toUpperCase().replace(/\s/g, '');
  const bits = n => Array.from({ length: n }, () => (Math.random() < .5 ? '0' : '1')).join('');

  // Weiß: Caesar und XOR
  const WORDS = ['NETZ', 'PORT', 'KABEL', 'PAKET', 'ROUTER', 'SWITCH', 'DOJO', 'NINJA', 'GEHEIM', 'SERVER', 'TUNNEL', 'ZWIEBEL'];
  function genCaesar() {
    const v = rnd(0, 3);
    if (v === 0) {
      const w = pick(WORDS), k = rnd(1, 25);
      const c = caesar(w, k);
      return { q: `Verschlüssele <b>${w}</b> mit Caesar, Schlüssel <b>${k}</b>.`, ph: 'Geheimtext', check: x => up(x) === c, sol: `Jeden Buchstaben um ${k} Stellen weiter: <b>${c}</b>` };
    }
    if (v === 1) {
      const w = pick(WORDS), k = rnd(1, 25);
      const c = caesar(w, k);
      return { q: `Der Geheimtext <b>${c}</b> wurde mit Caesar und Schlüssel <b>${k}</b> verschlüsselt. Wie lautet der Klartext?`, ph: 'Klartext', check: x => up(x) === w, sol: `Jeden Buchstaben um ${k} Stellen zurück: <b>${w}</b>` };
    }
    if (v === 2) {
      const n = rnd(4, 8), a = bits(n), b = bits(n);
      return { q: `Berechne <code>${a}</code> ⊕ <code>${b}</code> (XOR).`, ph: 'Bits', check: x => x.replace(/\s/g, '') === xor(a, b), sol: `Gleiche Bits → 0, verschiedene → 1: <b>${xor(a, b)}</b>` };
    }
    return mc(...pick([
      ['Wie viele sinnvolle Schlüssel gibt es bei der Caesar-Verschlüsselung?', '25', ['26', '256', 'unendlich viele'], 'Verschiebungen um 1 bis 25 – Schlüssel 26 bzw. 0 ändert nichts. Man kann also einfach <b>alle 25</b> ausprobieren.'],
      ['Womit knackt man einen Caesar-Text am schnellsten?', 'mit der Häufigkeit der Buchstaben', ['mit einem Quantencomputer', 'gar nicht – Caesar ist sicher', 'mit dem öffentlichen Schlüssel'], 'Im Deutschen ist <b>e</b> der häufigste Buchstabe. Der häufigste Buchstabe im Geheimtext steht vermutlich für e.'],
      ['Wann ist ein One-Time-Pad unknackbar?', 'wenn der Schlüssel zufällig, so lang wie die Nachricht und nur einmal benutzt ist', ['wenn der Schlüssel 128 Bit lang ist', 'wenn man ihn zweimal anwendet', 'wenn man ihn öffentlich macht'], 'Alle drei Bedingungen müssen erfüllt sein: <b>echt zufällig, so lang wie die Nachricht, nur einmal</b>.'],
      ['Was ergibt Klartext ⊕ Schlüssel ⊕ Schlüssel?', 'den Klartext', ['den Schlüssel', 'lauter Nullen', 'den Geheimtext'], 'Zweimal XOR mit demselben Schlüssel hebt sich auf – so wird <b>entschlüsselt</b>.'],
    ]));
  }

  // Gelb: symmetrisch und asymmetrisch
  function genSym() {
    const v = rnd(0, 2);
    if (v === 0) {
      const n = rnd(3, 40);
      return { q: `<b>${n} Personen</b> wollen sich paarweise geheime Nachrichten schicken. Wie viele symmetrische Schlüssel brauchen sie?`, ph: 'Anzahl', check: x => num(x) === n * (n - 1) / 2, sol: `n · (n − 1) / 2 = ${n} · ${n - 1} / 2 = <b>${n * (n - 1) / 2}</b>. Asymmetrisch reichen ${n} Schlüsselpaare.` };
    }
    return mc(...pick([
      ['Welches symmetrische Verfahren ist heute Standard?', 'AES', ['DES', 'Caesar', 'RSA'], '<b>AES</b> mit 128 oder 256 Bit – in HTTPS, WLAN, VPN und Festplattenverschlüsselung.'],
      ['Warum gilt <b>DES</b> als unsicher?', 'Sein Schlüssel ist mit 56 Bit zu kurz', ['Es ist asymmetrisch', 'Es verwendet keine Bits', 'Es ist zu langsam'], 'Bei 56 Bit kann man heute <b>alle Schlüssel durchprobieren</b> – in wenigen Stunden.'],
      ['Was ist das größte Problem symmetrischer Verfahren?', 'Der Schlüssel muss vorher sicher ausgetauscht werden', ['Sie sind zu langsam', 'Man braucht zwei Schlüssel', 'Sie funktionieren nur mit Text'], 'Beide brauchen <b>denselben geheimen Schlüssel</b> – wie kommt er sicher zum Partner?'],
      ['Was ist der Nachteil asymmetrischer Verfahren?', 'Sie sind viel langsamer', ['Man muss den Schlüssel vorher austauschen', 'Sie sind leicht zu knacken', 'Sie brauchen kein Schlüsselpaar'], 'Asymmetrische Verfahren rechnen aufwendig – <b>hundert- bis tausendmal langsamer</b>. Deshalb verschlüsselt man die Daten selbst symmetrisch.'],
      ['Welches Verfahren ist <b>asymmetrisch</b>?', 'RSA', ['AES', 'DES', 'ChaCha20'], '<b>RSA</b> arbeitet mit einem Schlüsselpaar. AES, DES und ChaCha20 sind symmetrisch.'],
      ['Wie funktioniert die Verschlüsselung bei HTTPS?', 'hybrid: asymmetrisch für den Schlüssel, symmetrisch für die Daten', ['nur symmetrisch', 'nur asymmetrisch', 'gar nicht – HTTPS signiert nur'], 'Mit Diffie-Hellman und Zertifikat einigt man sich auf einen Schlüssel, die Daten laufen dann schnell mit <b>AES</b>.'],
      ['Ein RSA-Schlüssel mit 3072 Bit ist etwa so sicher wie …', 'AES mit 128 Bit', ['AES mit 3072 Bit', 'DES', 'Caesar mit Schlüssel 3072'], 'Asymmetrische Schlüssel müssen viel länger sein: <b>RSA-3072 ≈ AES-128</b> ≈ elliptische Kurven mit 256 Bit.'],
    ]));
  }

  // Orange: Schlüsselpaar, Signatur, RSA
  function genRsa() {
    const v = rnd(0, 3);
    if (v === 0) {
      return mc(...pick([
        ['Alice will Bob eine <b>geheime</b> Nachricht schicken. Womit verschlüsselt sie?', 'mit Bobs öffentlichem Schlüssel', ['mit Bobs privatem Schlüssel', 'mit Alices privatem Schlüssel', 'mit Alices öffentlichem Schlüssel'], 'Mit <b>Bobs öffentlichem</b> Schlüssel – öffnen kann es dann nur Bob mit seinem privaten.'],
        ['Womit entschlüsselt Bob eine Nachricht, die an ihn verschlüsselt wurde?', 'mit seinem privaten Schlüssel', ['mit seinem öffentlichen Schlüssel', 'mit Alices öffentlichem Schlüssel', 'mit Alices privatem Schlüssel'], 'Nur der <b>private</b> Schlüssel des Empfängers passt.'],
        ['Womit <b>signiert</b> Alice ein Dokument?', 'mit ihrem privaten Schlüssel', ['mit ihrem öffentlichen Schlüssel', 'mit Bobs öffentlichem Schlüssel', 'mit einem symmetrischen Schlüssel'], 'Signieren kann nur die Besitzerin – mit ihrem <b>privaten</b> Schlüssel.'],
        ['Womit prüft Bob Alices Signatur?', 'mit Alices öffentlichem Schlüssel', ['mit Alices privatem Schlüssel', 'mit seinem privaten Schlüssel', 'gar nicht'], 'Jeder kann die Signatur mit Alices <b>öffentlichem</b> Schlüssel prüfen.'],
        ['Nach dem Signieren wird im Dokument ein Komma geändert. Was passiert?', 'Die Signatur wird ungültig', ['Nichts, die Signatur bleibt gültig', 'Der private Schlüssel wird öffentlich', 'Das Dokument wird verschlüsselt'], 'Schon ein Zeichen ergibt einen völlig anderen <b>Hashwert</b> – er passt nicht mehr zur Signatur.'],
        ['Was signiert man in der Praxis, statt das ganze Dokument?', 'seinen Hashwert', ['den öffentlichen Schlüssel', 'nur die erste Zeile', 'die IP-Adresse'], 'Der <b>Hashwert</b> ist ein kurzer Fingerabdruck – schnell zu signieren und eindeutig fürs Dokument.'],
      ]));
    }
    let p, q;
    do { p = pick(PRIMES.slice(0, 6)); q = pick(PRIMES.slice(0, 6)); } while (p === q);
    const k = rsa(p, q);
    if (v === 1) {
      return Math.random() < .5
        ? { q: `RSA mit p = ${p} und q = ${q}. Wie groß ist <b>n</b>?`, ph: 'n', check: x => num(x) === k.n, sol: `n = p · q = ${p} · ${q} = <b>${k.n}</b>` }
        : { q: `RSA mit p = ${p} und q = ${q}. Wie groß ist <b>φ(n)</b>?`, ph: 'φ(n)', check: x => num(x) === k.phi, sol: `φ(n) = (p − 1) · (q − 1) = ${p - 1} · ${q - 1} = <b>${k.phi}</b>` };
    }
    const m = rnd(2, Math.min(k.n - 1, 12));
    const c = modPow(m, k.e, k.n);
    if (v === 2) {
      return { q: `Öffentlicher Schlüssel (e, n) = (${k.e}, ${k.n}). Verschlüssele m = <b>${m}</b>: c = m<sup>e</sup> mod n.`, ph: 'c', check: x => num(x) === c, sol: `${m}<sup>${k.e}</sup> = ${m ** k.e}, geteilt durch ${k.n} bleibt der Rest <b>${c}</b>.` };
    }
    return mc('Warum ist RSA sicher?', 'Große Zahlen lassen sich kaum in ihre Primfaktoren zerlegen', ['Weil der öffentliche Schlüssel geheim bleibt', 'Weil nur kleine Primzahlen verwendet werden', 'Weil die Nachricht zweimal XOR gerechnet wird'], 'p · q ist leicht zu rechnen, aber aus einem 2048-Bit-n die <b>Faktoren</b> p und q zu finden, schafft kein heutiger Computer.');
  }

  // Grün: HTTPS, TLS und Zertifikate
  function genTls() {
    const v = rnd(0, 3);
    if (v === 0) {
      const a = rnd(2, 9);
      const A = modPow(5, a, 23);
      return { q: `Diffie-Hellman mit p = 23, g = 5. Alice wählt geheim a = <b>${a}</b>. Welchen Wert A = g<sup>a</sup> mod p schickt sie?`, ph: 'A', check: x => num(x) === A, sol: `5<sup>${a}</sup> = ${5 ** a}, geteilt durch 23 bleibt der Rest <b>${A}</b>.` };
    }
    if (v === 1) {
      return mc(...pick([
        ['Das Zertifikat ist für <b>shop.example.net</b> ausgestellt, du rufst <b>www.example.com</b> auf. Was macht der Browser?', 'Er warnt: Der Name passt nicht', ['Er lädt die Seite normal', 'Er nimmt automatisch shop.example.net', 'Er schaltet auf HTTP um'], 'Ein Zertifikat gilt nur für die <b>Namen</b>, die darin stehen.'],
        ['Im Café-WLAN meldet der Browser bei deiner Bank: „Zertifikat von unbekannter Stelle“. Was tust du?', 'abbrechen – vermutlich ein Angreifer dazwischen', ['„Trotzdem fortfahren“ klicken', 'das Passwort schnell eingeben', 'den Browser-Cache leeren'], 'Ein <b>Man-in-the-Middle</b> würde sonst alles mitlesen. Nie bei Warnungen weitermachen, wenn es um Anmeldungen geht.'],
        ['Wer bestätigt, dass ein öffentlicher Schlüssel wirklich zu www.example.com gehört?', 'eine Zertifizierungsstelle (CA)', ['der DNS-Server', 'der Internetanbieter', 'der Browser selbst'], 'Die <b>CA</b> signiert das Zertifikat. Der Browser vertraut den Root-CAs aus seiner eingebauten Liste.'],
        ['Was steht <b>nicht</b> in einem Serverzertifikat?', 'der private Schlüssel des Servers', ['der öffentliche Schlüssel des Servers', 'der Domainname', 'das Ablaufdatum'], 'Der <b>private Schlüssel</b> verlässt den Server nie. Im Zertifikat stehen Name, öffentlicher Schlüssel, Aussteller und Gültigkeit.'],
      ]));
    }
    return mc(...pick([
      ['Welche TLS-Version ist aktuell?', 'TLS 1.3', ['SSL 3.0', 'TLS 1.0', 'TLS 2.0'], '<b>TLS 1.3</b> (RFC 8446, 2018). TLS 1.2 ist noch erlaubt, alles Ältere ist unsicher.'],
      ['Über welchen Port läuft HTTPS?', '443', ['80', '22', '53'], 'HTTPS: <b>Port 443</b>, HTTP: Port 80.'],
      ['Was bleibt bei HTTPS für Mitlesende sichtbar?', 'mit welchem Server du sprichst', ['die eingegebenen Passwörter', 'der Inhalt der Seite', 'die Formulardaten'], 'Die <b>IP-Adresse</b> und meist der <b>Domainname</b> des Servers sind sichtbar – der Inhalt nicht.'],
      ['Mit welcher Nachricht beginnt der TLS-Handshake?', 'ClientHello', ['ServerHello', 'Certificate', 'Finished'], 'Der Browser beginnt mit <b>ClientHello</b> – samt seinem Diffie-Hellman-Schlüsselanteil.'],
      ['Was bedeutet <b>Forward Secrecy</b>?', 'Alte Verbindungen bleiben geschützt, auch wenn später der Serverschlüssel gestohlen wird', ['Der Browser leitet Daten schneller weiter', 'Das Zertifikat gilt für immer', 'Daten werden zweimal verschlüsselt'], 'Jede Sitzung bekommt per Diffie-Hellman einen <b>eigenen Schlüssel</b>, der danach gelöscht wird.'],
      ['Womit werden bei HTTPS die eigentlichen Daten verschlüsselt?', 'symmetrisch, z. B. mit AES', ['mit RSA', 'mit dem privaten Schlüssel des Browsers', 'gar nicht'], 'Nach dem Handshake laufen die Daten schnell und <b>symmetrisch</b> verschlüsselt.'],
    ]));
  }

  // Blau: Proxy und VPN
  function genProxy() {
    return mc(...pick([
      ['Was sieht der Webserver, wenn du über einen Elite-Proxy surfst?', 'nur die IP-Adresse des Proxys', ['deine IP-Adresse', 'deine IP-Adresse und die des Proxys', 'gar keine IP-Adresse'], 'Er sieht nur den <b>Proxy</b>. Ein Elite-Proxy verrät nicht einmal, dass er ein Proxy ist.'],
      ['Was verrät ein <b>transparenter</b> Proxy dem Webserver?', 'deine echte IP-Adresse', ['nichts', 'nur die Uhrzeit', 'deinen privaten Schlüssel'], 'Er gibt deine IP weiter, z. B. im Header <code>X-Forwarded-For</code> – <b>anonym</b> ist das nicht.'],
      ['Warum ist man gegenüber dem Proxy-Betreiber nicht anonym?', 'Er muss sich merken, wer was angefordert hat', ['Weil er deine MAC-Adresse sieht', 'Weil Proxys keine IP-Adressen haben', 'Doch, man ist anonym'], 'Wie Dieter auf der Party: Er muss die Antworten <b>richtig zurückverteilen</b>.'],
      ['Du nutzt einen kostenlosen Proxy für eine <code>http://</code>-Seite. Was kann der Betreiber?', 'den Inhalt mitlesen und verändern', ['gar nichts', 'nur die Uhrzeit sehen', 'nur deine Postleitzahl sehen'], 'Ohne HTTPS sieht und verändert er <b>alles</b>. Kostenlose Proxys nie für Anmeldungen benutzen.'],
      ['Was sieht dein Internetanbieter, wenn du ein VPN benutzt?', 'nur die verschlüsselte Verbindung zum VPN-Server', ['alle aufgerufenen Webseiten', 'nichts, nicht einmal deine IP', 'deine Passwörter'], 'Er sieht den <b>Tunnel</b> zum VPN-Server – nicht, was darin steckt.'],
      ['Wem musst du bei einem kommerziellen VPN vertrauen?', 'dem VPN-Anbieter', ['niemandem', 'nur dem Webserver', 'nur deinem Nachbarn'], 'Der <b>VPN-Anbieter</b> sieht jetzt, was vorher dein Provider gesehen hat.'],
      ['Wofür wurden VPNs ursprünglich gebaut?', 'um Standorte oder Homeoffice sicher mit dem Firmennetz zu verbinden', ['um Filme aus anderen Ländern zu sehen', 'um WLAN zu beschleunigen', 'um IP-Adressen zu verteilen'], 'Site-to-Site und Remote Access: Geräte erreichen sich mit <b>privaten Adressen</b> durch den Tunnel.'],
      ['Welches ist ein VPN-Protokoll?', 'WireGuard', ['DHCP', 'SMTP', 'NTP'], '<b>WireGuard</b>, IPsec und OpenVPN sind VPN-Protokolle.'],
      ['Warum hilft eine Proxy-Kette nicht gegen den eigenen Provider?', 'Die Verbindung zum ersten Proxy läuft über den Provider', ['Weil Proxys im Ausland stehen', 'Weil der Provider die Proxys betreibt', 'Sie hilft vollständig'], 'Ist die Verbindung zum ersten Proxy <b>unverschlüsselt</b>, sieht der Provider weiter, was du anforderst.'],
    ]));
  }

  // Lila: Tor und „Wer sieht was?“
  const NAMES = { direct: 'ohne Hilfsmittel', proxy: 'über einen Proxy', vpn: 'über ein VPN', tor: 'über Tor' };
  const WHAT = [['deine IP-Adresse', 1], ['dein Ziel www.example.com', 2], ['den Inhalt der Seite', 3]];
  function genTor() {
    if (Math.random() < .5) {
      const mode = pick(Object.keys(WHO));
      const row = pick(WHO[mode]);
      const [what, col] = pick(WHAT);
      const https = Math.random() < .6;
      const yes = sees(row[col], https);
      return mc(`Du rufst www.example.com ${NAMES[mode]} auf, die Seite benutzt ${https ? '' : '<b>kein</b> '}HTTPS. Kennt <b>${row[0]}</b> ${what}?`, yes ? 'ja' : 'nein', [yes ? 'nein' : 'ja'],
        `${row[0]}: ${yes ? '<b>ja</b>' : '<b>nein</b>'}. ${col === 3 && row[col] === 'h' ? (https ? 'HTTPS verschlüsselt den Inhalt bis zum Webserver.' : 'Ohne HTTPS geht der Inhalt ab hier im Klartext weiter.') : ''}`);
    }
    return mc(...pick([
      ['Über wie viele Knoten läuft eine Tor-Verbindung normalerweise?', '3', ['1', '2', '10'], 'Eintritts-, Mittel- und Austrittsknoten – <b>drei</b>.'],
      ['Welcher Tor-Knoten kennt deine IP-Adresse?', 'der Eintrittsknoten', ['der Mittelknoten', 'der Austrittsknoten', 'alle drei'], 'Nur der <b>Eintrittsknoten</b> sieht, woher die Verbindung kommt.'],
      ['Welcher Tor-Knoten kann ohne HTTPS den Inhalt mitlesen?', 'der Austrittsknoten', ['der Eintrittsknoten', 'der Mittelknoten', 'keiner'], 'Der <b>Austrittsknoten</b> entfernt die letzte Schicht und schickt die Anfrage im Original weiter.'],
      ['Was macht jeder Tor-Knoten mit einem Paket auf dem Hinweg?', 'Er entfernt eine Verschlüsselungsschicht', ['Er verschlüsselt es mit einer neuen Schicht', 'Er liest den Inhalt', 'Er schickt es direkt zum Ziel'], 'Der Browser hat <b>drei Schichten</b> darum gelegt, jeder Knoten entfernt eine – wie bei einer Zwiebel.'],
      ['Wodurch kann man trotz Tor erkannt werden?', 'durch Anmelden oder Cookies auf der Webseite', ['durch die Farbe des Browsers', 'durch die Zahl der Tor-Knoten', 'gar nicht – Tor ist absolut anonym'], 'Wer sich <b>anmeldet</b> oder Cookies mitschickt, verrät sich selbst – absolute Anonymität gibt es nicht.'],
      ['Was ist eine <b>.onion</b>-Adresse?', 'ein Dienst, der direkt im Tor-Netz liegt', ['eine Länderdomain', 'ein Zertifikat', 'ein VPN-Server'], '.onion-Dienste erreicht man nur über Tor – die Verbindung <b>verlässt das Tor-Netz nicht</b>.'],
      ['Wie oft wechselt Tor die Route für neue Verbindungen ungefähr?', 'alle 10 Minuten', ['jede Sekunde', 'einmal am Tag', 'nie'], 'Etwa <b>alle 10 Minuten</b> wird für neue Verbindungen eine neue Route gewählt.'],
    ]));
  }

  Dojo.create({
    mount: UI.$('#d-krypto'),
    pageId: 'sec-dojo',
    storeKey: 'krypto-belts',
    belts: [
      { id: 'weiss', name: 'Weißer Gürtel', topic: 'Caesar & XOR', gen: genCaesar },
      { id: 'gelb', name: 'Gelber Gürtel', topic: 'Symmetrisch & asymmetrisch', gen: genSym },
      { id: 'orange', name: 'Oranger Gürtel', topic: 'Schlüsselpaar, Signatur, RSA', gen: genRsa },
      { id: 'gruen', name: 'Grüner Gürtel', topic: 'HTTPS & Zertifikate', gen: genTls },
      { id: 'blau', name: 'Blauer Gürtel', topic: 'Proxy & VPN', gen: genProxy },
      { id: 'lila', name: 'Lila Gürtel', topic: 'Tor & „Wer sieht was?“', gen: genTor },
    ],
    note: 'Bei Caesar ist Groß- und Kleinschreibung egal, Bits darfst du mit Leerzeichen eingeben. Der Fortschritt wird nur in diesem Browser gespeichert.',
  });
})();
