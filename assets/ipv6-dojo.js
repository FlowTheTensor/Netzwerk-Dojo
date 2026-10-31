/* IPv6 · Station 5 – IPv6-Dojo: Aufgaben-Generatoren (Mechanik in dojo-engine.js) */
'use strict';

(() => {
  const { esc } = UI;
  const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const shuffle = a => [...a].sort(() => Math.random() - .5);
  const C = g => `<code>${esc(IPv6.compress(g))}</code>`;
  const norm = v => v.trim().toLowerCase().replace(/\s+/g, '');

  // Zufälliger Block: oft mit führenden Nullen, damit das Kürzen etwas zu tun hat
  const blk = () => pick([rnd(1, 0xf), rnd(0x10, 0xff), rnd(0x100, 0xfff), rnd(0x1000, 0xffff), rnd(0x1000, 0xffff)]);

  // Adresse mit typischem Präfix und manchmal einer Null-Folge
  function addr(kind = pick(['doc', 'doc', 'global', 'link', 'ula'])) {
    const g = Array.from({ length: 8 }, blk);
    if (kind === 'doc') { g[0] = 0x2001; g[1] = 0xdb8; }
    if (kind === 'global') { g[0] = pick([0x2003, 0x2a02, 0x2a00, 0x2604, 0x2001]); if (g[0] === 0x2001 && g[1] === 0xdb8) g[1] = 0x470; }
    if (kind === 'link') { g[0] = 0xfe80; g[1] = g[2] = g[3] = 0; }
    if (kind === 'ula') { g[0] = 0xfd00 + rnd(0, 0xff); }
    if (kind !== 'link' && Math.random() < .75) {
      const len = rnd(2, 4), at = rnd(kind === 'doc' ? 2 : 1, 8 - len);
      for (let i = at; i < at + len; i++) g[i] = 0;
    }
    if (Math.random() < .3) g[rnd(2, 7)] = 0; // einzelner Null-Block (bleibt „0“)
    return g;
  }

  const steps = g => `Volle Form <code>${IPv6.full(g)}</code> → führende Nullen weg <code>${IPv6.noLeading(g).join(':')}</code> → ${IPv6.zeroRun(g).len ? 'längste Null-Folge durch „::“ ersetzen' : 'keine Folge aus mindestens zwei Null-Blöcken'} → <b>${esc(IPv6.compress(g))}</b>`;

  // Weiß: kürzen
  function genShort() {
    let g;
    do g = addr(); while (IPv6.compress(g) === IPv6.full(g));
    return {
      q: `Kürze die Adresse so weit wie möglich:<br><code class="v6-q">${IPv6.full(g)}</code>`,
      ph: 'gekürzte Adresse',
      check: v => {
        const r = IPv6.parse(v);
        if (!r.ok) return { ok: false, why: r.err };
        if (!IPv6.equal(r.groups, g)) return { ok: false, why: 'Das ist eine andere Adresse – beim Kürzen darf sich der Wert nicht ändern.' };
        if (norm(v) !== IPv6.compress(g)) return { ok: false, why: 'Die Adresse stimmt, ist aber <b>nicht vollständig</b> bzw. nicht nach den Regeln gekürzt.' };
        return { ok: true };
      },
      sol: steps(g),
    };
  }

  // Gelb: erweitern
  function genFull() {
    let g;
    do g = addr(); while (IPv6.compress(g) === IPv6.full(g));
    return {
      q: `Schreibe die Adresse <b>vollständig</b> aus (8 Blöcke mit je 4 Ziffern):<br><code class="v6-q">${esc(IPv6.compress(g))}</code>`,
      ph: 'xxxx:xxxx:xxxx:xxxx:xxxx:xxxx:xxxx:xxxx',
      check: v => {
        const r = IPv6.parse(v);
        if (!r.ok) return { ok: false, why: r.err };
        if (!IPv6.equal(r.groups, g)) return { ok: false, why: 'Das ist eine andere Adresse. Zähle, wie viele Blöcke „::“ ersetzt.' };
        if (norm(v) !== IPv6.full(g)) return { ok: false, why: 'Die Adresse stimmt, ist aber nicht <b>vollständig</b> ausgeschrieben – jeder der 8 Blöcke braucht 4 Ziffern.' };
        return { ok: true };
      },
      sol: `„::“ steht hier für ${8 - IPv6.compress(g).split(':').filter(Boolean).length} Null-Blöcke. Ausgeschrieben: <b>${IPv6.full(g)}</b>`,
    };
  }

  // Orange: Adresstyp erkennen
  function genType() {
    const NAMES = { global: 'Global Unicast', link: 'Link-Local', ula: 'Unique Local', mcast: 'Multicast', loop: 'Loopback' };
    const kind = pick(['global', 'global', 'link', 'link', 'ula', 'mcast', 'loop']);
    let g;
    if (kind === 'mcast') g = pick([[0xff02, 0, 0, 0, 0, 0, 0, 1], [0xff02, 0, 0, 0, 0, 0, 0, 2], [0xff02, 0, 0, 0, 0, 1, 0xff00 + rnd(0, 255), blk()], [0xff05, 0, 0, 0, 0, 0, 1, 3]]);
    else if (kind === 'loop') g = [0, 0, 0, 0, 0, 0, 0, 1];
    else g = addr(kind);
    const t = IPv6.typeOf(g);
    return {
      q: `Welche Art von Adresse ist ${C(g)}?`,
      choices: Object.values(NAMES),
      check: v => v === NAMES[kind],
      sol: `<b>${NAMES[kind]}</b> – ${t.text}`,
    };
  }

  // Grün: Präfix und Interface-ID
  function genPrefix() {
    const g = addr(pick(['doc', 'global']));
    g[4] = g[4] || blk(); // Interface-ID nicht leer
    const v = rnd(0, 3);
    if (v === 0 || v === 2) {
      const p = v === 0 ? 64 : 48;
      const net = IPv6.network(g, p);
      return {
        q: `Wie lautet das <b>Netz (Präfix)</b> von ${C(g)}<code>/${p}</code>? Schreibe es gekürzt.`,
        ph: `z. B. 2001:db8:1::/${p}`,
        check: x => {
          const r = IPv6.parse(x.replace(/\/\d+$/, ''));
          if (!r.ok) return { ok: false, why: r.err };
          return IPv6.equal(r.groups, net) ? { ok: true } : { ok: false, why: `Beim Präfix bleiben die ersten ${p} Bit (${p / 16} Blöcke) stehen, der Rest wird 0.` };
        },
        sol: `Die ersten ${p / 16} Blöcke bleiben, der Rest wird 0: <b>${esc(IPv6.compress(net))}/${p}</b>`,
      };
    }
    if (v === 1) {
      const iid = g.slice(4);
      return {
        q: `Wie lautet die <b>Interface-ID</b> von ${C(g)}<code>/64</code>? Gib die letzten 4 Blöcke an.`,
        ph: 'z. B. 3c1d:9a2b:71f4:e8c0',
        check: x => {
          const parts = norm(x).replace(/^::/, '').split(':');
          if (parts.length !== 4 || parts.some(p => !/^[0-9a-f]{1,4}$/.test(p))) return { ok: false, why: 'Gib genau 4 Blöcke an, getrennt durch Doppelpunkte.' };
          return parts.every((p, i) => parseInt(p, 16) === iid[i]) ? { ok: true } : { ok: false, why: 'Bei /64 sind die letzten 64 Bit – also die letzten 4 Blöcke – die Interface-ID.' };
        },
        sol: `/64 → die letzten 4 Blöcke: <b>${IPv6.noLeading(g).slice(4).join(':')}</b>`,
      };
    }
    const from = pick([48, 48, 56]);
    const n = 2 ** (64 - from);
    return {
      q: `Eine Firma bekommt vom Provider ein <b>/${from}</b>. Wie viele <b>/64</b>-Netze kann sie daraus bilden?`,
      ph: 'Anzahl',
      check: x => Number(x.replace(/[.\s]/g, '')) === n,
      sol: `64 − ${from} = ${64 - from} Bit für Subnetze → 2<sup>${64 - from}</sup> = <b>${n.toLocaleString('de-DE')}</b> Netze`,
    };
  }

  // Blau: EUI-64
  function genEui() {
    const mac = [rnd(0, 255) & 0xfe, rnd(0, 255), rnd(0, 255), rnd(0, 255), rnd(0, 255), rnd(0, 255)];
    const e = IPv6.eui64(mac);
    const macTxt = IPv6.macText(mac).toUpperCase();
    const ll = [0xfe80, 0, 0, 0, ...e.iid];
    const way = `${macTxt} → FF FE in die Mitte → 7. Bit des ersten Bytes umdrehen (${IPv6.hex2(mac[0]).toUpperCase()} → ${IPv6.hex2(e.first).toUpperCase()}) → Interface-ID <b>${IPv6.noLeading(e.iid).join(':')}</b>`;
    const v = rnd(0, 4);
    if (v === 0) {
      return {
        q: `Bilde nach EUI-64 die <b>Interface-ID</b> aus der MAC-Adresse <code>${macTxt}</code>.`,
        ph: 'z. B. 021a:2bff:fe3c:4d5e',
        check: x => {
          const parts = norm(x).split(':');
          if (parts.length !== 4 || parts.some(p => !/^[0-9a-f]{1,4}$/.test(p))) return { ok: false, why: 'Gib genau 4 Blöcke an, getrennt durch Doppelpunkte.' };
          return parts.every((p, i) => parseInt(p, 16) === e.iid[i]) ? { ok: true } : { ok: false, why: 'Denk an FF FE in der Mitte und das umgedrehte 7. Bit im ersten Byte.' };
        },
        sol: way,
      };
    }
    if (v === 1) {
      return {
        q: `Ein Router mit der MAC-Adresse <code>${macTxt}</code> bildet seine <b>Link-Local-Adresse</b> nach EUI-64. Wie lautet sie?`,
        ph: 'fe80::…',
        check: x => {
          const r = IPv6.parse(x);
          if (!r.ok) return { ok: false, why: r.err };
          return IPv6.equal(r.groups, ll) ? { ok: true } : { ok: false, why: 'Präfix fe80::/64 plus die Interface-ID nach EUI-64.' };
        },
        sol: `${way} → mit fe80::/64: <b>${esc(IPv6.compress(ll))}</b>`,
      };
    }
    if (v === 2) {
      return {
        q: 'Bei EUI-64 wird die 48-Bit-MAC auf 64 Bit verlängert. Welche <b>zwei Bytes</b> werden dazu in die Mitte eingefügt?',
        ph: 'zwei Bytes in Hex',
        check: x => norm(x).replace(/[:\-]/g, '') === 'fffe',
        sol: 'In die Mitte kommt <b>FF FE</b>: aus <code>00:1A:2B:3C:4D:5E</code> wird <code>00 1A 2B <b>FF FE</b> 3C 4D 5E</code>.',
      };
    }
    if (v === 3) {
      return {
        q: `Eine MAC-Adresse beginnt mit dem Byte <code>${IPv6.hex2(mac[0]).toUpperCase()}</code>. Wie lautet dieses Byte nach EUI-64, wenn das <b>7. Bit</b> (U/L-Bit) umgedreht wurde?`,
        ph: 'Byte in Hex',
        check: x => /^[0-9a-f]{1,2}$/.test(norm(x)) && parseInt(norm(x), 16) === e.first,
        sol: `${IPv6.hex2(mac[0]).toUpperCase()} = <code>${mac[0].toString(2).padStart(8, '0')}</code> → 7. Bit umdrehen → <code>${e.first.toString(2).padStart(8, '0')}</code> = <b>${IPv6.hex2(e.first).toUpperCase()}</b>`,
      };
    }
    return {
      q: `Ein Switch hat die Link-Local-Adresse ${C(ll)}, gebildet nach EUI-64. Wie lautet seine <b>MAC-Adresse</b>?`,
      ph: 'z. B. 00:1A:2B:3C:4D:5E',
      check: x => {
        const m = IPv6.parseMac(x);
        if (!m) return { ok: false, why: 'Gib 6 Bytes in Hex an, z. B. 00:1A:2B:3C:4D:5E.' };
        return m.every((b, i) => b === mac[i]) ? { ok: true } : { ok: false, why: 'Rückwärts: FF FE aus der Mitte entfernen und das 7. Bit des ersten Bytes wieder umdrehen.' };
      },
      sol: `Interface-ID <code>${IPv6.noLeading(e.iid).join(':')}</code> → FF FE entfernen → erstes Byte ${IPv6.hex2(e.first).toUpperCase()} → 7. Bit zurückdrehen → <b>${macTxt}</b>`,
    };
  }

  // Lila: Header-Wissen
  const HQ = [
    ['Welches IPv6-Feld übernimmt die Aufgabe der <b>TTL</b>?', 'Hop Limit', ['Flow Label', 'Traffic Class', 'Next Header'], 'Das <b>Hop Limit</b> wird wie die TTL von jedem Router um 1 verringert.'],
    ['Wie groß ist der IPv6-Grundheader?', 'immer 40 Byte', ['immer 20 Byte', '20 bis 60 Byte', '128 Byte'], 'Der IPv6-Grundheader ist <b>immer 40 Byte</b> lang – fest, ohne Optionen.'],
    ['Welches IPv4-Feld gibt es im IPv6-Header <b>nicht mehr</b>?', 'Header-Prüfsumme', ['Version', 'Zieladresse', 'Absenderadresse'], 'Die <b>Header-Prüfsumme</b> entfällt – Router müssen sie nicht mehr neu berechnen.'],
    ['Welches Feld ist im IPv6-Header <b>neu</b>?', 'Flow Label', ['Hop Limit', 'Version', 'Payload Length'], 'Das <b>Flow Label</b> ist neu: Es kennzeichnet zusammengehörende Pakete.'],
    ['Wer darf bei IPv6 ein zu großes Paket <b>fragmentieren</b>?', 'nur der Absender', ['jeder Router unterwegs', 'nur der letzte Router', 'der Switch'], 'Bei IPv6 fragmentieren Router nicht mehr – <b>nur der Absender</b>.'],
    ['Warum müssen IPv6-Router nach dem Herunterzählen keine Prüfsumme neu berechnen?', 'Es gibt keine Header-Prüfsumme mehr', ['Das Hop Limit ändert sich nicht', 'Router prüfen gar nichts', 'Das übernimmt der DHCP-Server'], 'Der IPv6-Header hat <b>keine Prüfsumme</b> – Fehler erkennen Ethernet und TCP/UDP.'],
    ['Wie heißt bei IPv6 das frühere IPv4-Feld <b>„Protokoll“</b>?', 'Next Header', ['Traffic Class', 'Flow Label', 'Payload Length'], 'Es heißt <b>Next Header</b> und kann auch auf einen Erweiterungs-Header zeigen.'],
    ['Ist der IPv6-Header größer oder kleiner als der kleinste IPv4-Header?', 'größer – 40 statt 20 Byte', ['kleiner', 'gleich groß', 'das hängt von der TTL ab'], '<b>Größer</b> (40 statt 20 Byte) wegen der langen Adressen – aber einfacher aufgebaut.'],
    ['Wie heißt bei IPv6 das frühere Feld <b>„Type of Service“</b>?', 'Traffic Class', ['Flow Label', 'Hop Limit', 'Next Header'], 'Es heißt <b>Traffic Class</b> und gibt die Priorität an.'],
  ];
  function genHeader() {
    if (Math.random() < .15) {
      return { q: 'Wie viele <b>Bit</b> hat eine IPv6-Adresse?', ph: 'Anzahl', check: x => norm(x) === '128', sol: '<b>128 Bit</b> = 8 Blöcke à 16 Bit (IPv4: 32 Bit).' };
    }
    const [q, right, wrong, sol] = pick(HQ);
    return { q, choices: shuffle([right, ...wrong]), check: x => x === right, sol };
  }

  Dojo.create({
    mount: UI.$('#d-v6'),
    pageId: 'v6-dojo',
    storeKey: 'v6-belts',
    belts: [
      { id: 'weiss', name: 'Weißer Gürtel', topic: 'Adressen kürzen', gen: genShort },
      { id: 'gelb', name: 'Gelber Gürtel', topic: 'Adressen ausschreiben', gen: genFull },
      { id: 'orange', name: 'Oranger Gürtel', topic: 'Adresstyp erkennen', gen: genType },
      { id: 'gruen', name: 'Grüner Gürtel', topic: 'Präfix & Interface-ID', gen: genPrefix },
      { id: 'blau', name: 'Blauer Gürtel', topic: 'EUI-64', gen: genEui },
      { id: 'lila', name: 'Lila Gürtel', topic: 'Header-Wissen', gen: genHeader },
    ],
    note: 'Groß- und Kleinbuchstaben sind egal. Gekürzte Adressen nach den beiden Regeln aus Station 2. Der Fortschritt wird nur in diesem Browser gespeichert.',
  });
})();
