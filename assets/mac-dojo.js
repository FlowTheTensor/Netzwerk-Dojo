/* MAC-Adressen · Station 3 – MAC-Dojo: Aufgaben-Generatoren (Mechanik in dojo-engine.js) */
'use strict';

(() => {
  const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const shuffle = a => [...a].sort(() => Math.random() - .5);
  const H = MAC.hex2;
  const norm = v => v.trim().toUpperCase().replace(/^0X/, '');
  // Normale Geräteadresse: erstes Byte mit I/G = 0 und U/L = 0
  const devMac = () => [rnd(0, 63) * 4, rnd(0, 255), rnd(0, 255), rnd(0, 255), rnd(0, 255), rnd(0, 255)];
  const hexVal = d => { const s = norm(d); return /^[0-9A-F]{1,2}$/.test(s) ? parseInt(s, 16) : NaN; };

  // Weiß: Hexadezimal
  function genHex() {
    const n = pick([rnd(0, 255), rnd(10, 15), rnd(16, 255), 255, rnd(0, 255)]);
    const hi = n >> 4, lo = n & 15;
    const way = `${H(n)} = ${hi} · 16 + ${lo} = <b>${n}</b> · binär <code>${hi.toString(2).padStart(4, '0')} ${lo.toString(2).padStart(4, '0')}</code> (jede Hex-Ziffer = 4 Bit)`;
    const v = rnd(0, 2);
    if (v === 0) return { q: `Welche Dezimalzahl ist das Hex-Byte <b>${H(n)}</b>?`, ph: '0 – 255', check: x => Number(x.trim()) === n, sol: way };
    if (v === 1) return { q: `Schreibe die Dezimalzahl <b>${n}</b> als Hex-Byte (2 Ziffern).`, ph: 'z. B. 1A', check: x => hexVal(x) === n, sol: way };
    return {
      q: `Wie lautet das Hex-Byte <b>${H(n)}</b> als 8-Bit-Binärzahl?`, ph: 'z. B. 00011010',
      check: x => { const s = x.replace(/\s/g, ''); return /^[01]{8}$/.test(s) && parseInt(s, 2) === n; },
      sol: way,
    };
  }

  // Gelb: Aufbau und Schreibweisen
  function genFormat() {
    const b = devMac();
    const v = rnd(0, 4);
    if (v === 0) {
      return {
        q: `Windows zeigt die MAC-Adresse <code>${MAC.windows(b)}</code>. Schreibe sie mit <b>Doppelpunkten</b>.`, ph: 'xx:xx:xx:xx:xx:xx',
        check: x => /^([0-9a-f]{2}:){5}[0-9a-f]{2}$/i.test(x.trim()) && MAC.equal(MAC.parse(x), b),
        sol: `Nur die Trennzeichen ändern sich: <b>${MAC.colon(b)}</b>`,
      };
    }
    if (v === 1) {
      return {
        q: `Ein Cisco-Switch zeigt <code>${MAC.cisco(b)}</code>. Wie schreibt Windows diese Adresse?`, ph: 'xx-xx-xx-xx-xx-xx',
        check: x => /^([0-9a-f]{2}-){5}[0-9a-f]{2}$/i.test(x.trim()) && MAC.equal(MAC.parse(x), b),
        sol: `Cisco fasst je 2 Bytes zusammen. Aufteilen in Bytes und mit Bindestrich trennen: <b>${MAC.windows(b)}</b>`,
      };
    }
    if (v === 2) {
      const [q, a, sol] = pick([
        ['Wie viele <b>Bit</b> hat eine MAC-Adresse?', '48', '<b>48 Bit</b> = 6 Bytes = 12 Hex-Ziffern.'],
        ['Aus wie vielen <b>Bytes</b> besteht eine MAC-Adresse?', '6', '<b>6 Bytes</b> zu je 8 Bit = 48 Bit.'],
        ['Wie viele <b>Hex-Ziffern</b> hat eine MAC-Adresse?', '12', '<b>12</b> – jedes der 6 Bytes wird mit 2 Hex-Ziffern geschrieben.'],
        ['Wie viele <b>Bit</b> hat der Herstellercode (OUI)?', '24', 'Die OUI sind die ersten 3 Bytes = <b>24 Bit</b>.'],
      ]);
      return { q, ph: 'Anzahl', check: x => x.trim() === a, sol };
    }
    if (v === 3) {
      return {
        q: `Welcher Teil von <code>${MAC.colon(b)}</code> ist der <b>Herstellercode (OUI)</b>? Gib die 3 Bytes an.`, ph: 'xx:xx:xx',
        check: x => { const p = x.trim().replace(/[-.\s]/g, ':').split(':').filter(Boolean); return p.length === 3 && p.every((y, i) => hexVal(y) === b[i]); },
        sol: `Die <b>ersten 3 Bytes</b>: <b>${MAC.colon(b.slice(0, 3))}</b> – von der IEEE an den Hersteller vergeben. Der Rest (${MAC.colon(b.slice(3))}) ist die Gerätenummer.`,
      };
    }
    return {
      q: 'Wie viele Geräteadressen kann ein Hersteller mit <b>einer</b> OUI vergeben?', ph: 'Anzahl',
      check: x => Number(x.replace(/[.\s]/g, '')) === 2 ** 24,
      sol: 'Für die Gerätenummer bleiben 24 Bit → 2<sup>24</sup> = <b>16.777.216</b>. Reicht das nicht, beantragt der Hersteller bei der IEEE eine weitere OUI.',
    };
  }

  // Orange: IEEE und Hintergrund
  const IEEE = [
    ['Wer vergibt die Herstellercodes (OUI) für MAC-Adressen?', 'die IEEE', ['die IANA', 'der Internetanbieter', 'der DHCP-Server'], 'Die <b>IEEE Registration Authority</b> vergibt die OUIs an Hersteller. Die IANA ist dagegen für IP-Adressen zuständig.'],
    ['Wofür steht die Abkürzung IEEE?', 'Institute of Electrical and Electronics Engineers', ['Internet Engineering and Ethernet Exchange', 'International Electronic Equipment Exchange', 'Internet Engineering Task Force'], 'IEEE = <b>Institute of Electrical and Electronics Engineers</b> (gesprochen „I triple E“).'],
    ['Welcher IEEE-Standard beschreibt <b>Ethernet</b>?', 'IEEE 802.3', ['IEEE 802.11', 'IEEE 802.1Q', 'RFC 791'], '<b>IEEE 802.3</b> ist Ethernet. 802.11 ist WLAN, 802.1Q beschreibt VLANs. RFC 791 ist IPv4 – kein IEEE-Standard.'],
    ['Welcher IEEE-Standard beschreibt <b>WLAN</b>?', 'IEEE 802.11', ['IEEE 802.3', 'IEEE 802.1Q', 'IEEE 754'], '<b>IEEE 802.11</b> ist WLAN. Auch dort haben die Geräte MAC-Adressen nach demselben Schema.'],
    ['Wie heißt die MAC-Adresse im heutigen IEEE-Sprachgebrauch?', 'EUI-48', ['IPv4', 'OUI-24', 'IEEE-64'], 'Die IEEE nennt sie heute <b>EUI-48</b> (Extended Unique Identifier, 48 Bit). Früher hieß sie MAC-48.'],
    ['Warum benutzt man MAC-Adressen nur im <b>lokalen Netz</b> und nicht im ganzen Internet?', 'Router bräuchten ein „Telefonbuch“ mit Milliarden Geräten', ['MAC-Adressen sind zu kurz', 'Die IEEE verbietet es', 'Switches können keine MAC-Adressen lesen'], 'MAC-Adressen sind nach Hersteller sortiert, nicht nach Ort. Jeder Router müsste sich <b>jedes Gerät der Welt</b> einzeln merken – Milliarden Einträge. IP-Adressen sind nach Netzen geordnet, deshalb reicht dem Router ein Eintrag pro Netz.'],
    ['Wo wurde Ethernet ursprünglich entwickelt?', 'bei Xerox PARC', ['bei der IEEE', 'bei Microsoft', 'am CERN'], 'Ethernet entstand 1973 bei <b>Xerox PARC</b>. Die IEEE hat es 1983 als 802.3 standardisiert.'],
  ];
  function genIeee() {
    const [q, right, wrong, sol] = pick(IEEE);
    return { q, choices: shuffle([right, ...wrong]), check: x => x === right, sol };
  }

  // Grün: Adressarten
  function genKind() {
    const NAMES = { global: 'Unicast · weltweit eindeutig', local: 'Unicast · lokal vergeben', mcast: 'Multicast', bcast: 'Broadcast' };
    const want = pick(['global', 'global', 'local', 'local', 'mcast', 'bcast']);
    let b = devMac();
    if (want === 'local') b[0] |= 2;
    if (want === 'mcast') b = pick([[0x01, 0x00, 0x5e, rnd(0, 127), rnd(0, 255), rnd(0, 255)], [0x33, 0x33, rnd(0, 255), rnd(0, 255), rnd(0, 255), rnd(0, 255)], [b[0] | 1, ...b.slice(1)]]);
    if (want === 'bcast') b = [255, 255, 255, 255, 255, 255];
    const k = MAC.kind(b);
    return {
      q: `Was für eine MAC-Adresse ist <code>${MAC.colon(b)}</code>?`,
      choices: Object.values(NAMES),
      check: x => x === NAMES[k.key],
      sol: `Erstes Byte ${H(b[0])} = <code>${b[0].toString(2).padStart(8, '0')}</code>: I/G-Bit (letztes) = ${b[0] & 1}, U/L-Bit (vorletztes) = ${(b[0] >> 1) & 1} → <b>${k.name}</b>. ${k.text}`,
    };
  }

  // Blau: Was macht der Switch?
  function genSwitch() {
    const ids = ['A', 'B', 'C', 'D'];
    const port = { A: 1, B: 2, C: 3, D: 4 };
    const mac = id => `00:1A:2B:00:00:0${id}`;
    const from = pick(ids);
    const toPick = pick([...ids.filter(i => i !== from), 'all']);
    const known = shuffle(ids).slice(0, rnd(0, 4));
    const rows = known.map(id => `<tr><td><code>${mac(id)}</code></td><td>${port[id]}</td></tr>`).join('') || '<tr><td colspan="2" class="muted">leer</td></tr>';
    const table = `<table class="tbl compact m-qtab"><thead><tr><th>MAC-Adresse</th><th>Port</th></tr></thead><tbody>${rows}</tbody></table>`;
    const pcs = ids.map(id => `PC-${id} (<code>${mac(id)}</code>) an Port ${port[id]}`).join(', ');
    const toMac = toPick === 'all' ? 'FF:FF:FF:FF:FF:FF' : mac(toPick);
    const FLOOD = 'an alle Ports außer Port ' + port[from];
    const right = toPick === 'all' || !known.includes(toPick) ? FLOOD : `nur an Port ${port[toPick]}`;
    const choices = shuffle([FLOOD, ...ids.filter(i => i !== from).map(i => `nur an Port ${port[i]}`)]);
    const why = toPick === 'all'
      ? 'Die Ziel-MAC ist der <b>Broadcast</b> FF:FF:FF:FF:FF:FF – der geht immer an alle Ports außer dem Eingangsport.'
      : known.includes(toPick)
        ? `Die Ziel-MAC ${toMac} steht in der Tabelle an Port ${port[toPick]} – der Switch leitet <b>gezielt</b> nur dorthin.`
        : `Die Ziel-MAC ${toMac} steht <b>nicht</b> in der Tabelle – der Switch <b>flutet</b> den Frame an alle Ports außer dem Eingangsport ${port[from]}.`;
    return {
      q: `Am Switch hängen ${pcs}. Seine MAC-Tabelle:${table}PC-${from} schickt einen Frame an die Ziel-MAC <code>${toMac}</code>. Wohin leitet der Switch ihn weiter?`,
      choices,
      check: x => x === right,
      sol: `${why} Außerdem lernt er (falls noch nicht bekannt): ${mac(from)} → Port ${port[from]}.`,
    };
  }

  Dojo.create({
    mount: UI.$('#d-mac'),
    pageId: 'mac-dojo',
    storeKey: 'mac-belts',
    belts: [
      { id: 'weiss', name: 'Weißer Gürtel', topic: 'Hexadezimal', gen: genHex },
      { id: 'gelb', name: 'Gelber Gürtel', topic: 'Aufbau & Schreibweisen', gen: genFormat },
      { id: 'orange', name: 'Oranger Gürtel', topic: 'IEEE & Hintergrund', gen: genIeee },
      { id: 'gruen', name: 'Grüner Gürtel', topic: 'Adressarten', gen: genKind },
      { id: 'blau', name: 'Blauer Gürtel', topic: 'Switch & MAC-Tabelle', gen: genSwitch },
    ],
    note: 'Hex-Ziffern dürfen groß oder klein geschrieben werden. Der Fortschritt wird nur in diesem Browser gespeichert.',
  });
})();
