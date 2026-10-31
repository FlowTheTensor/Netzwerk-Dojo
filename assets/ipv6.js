/* Netzwerktechnik-Dojo – IPv6-Rechenkern.
   Eine Adresse ist ein Array aus 8 Blöcken (Zahlen 0 … 65535, je 16 Bit). */
'use strict';

const IPv6 = (() => {
  const hex4 = n => n.toString(16).padStart(4, '0');

  /* Text → { ok, groups } oder { ok: false, err } mit verständlicher Fehlermeldung.
     Erlaubt Groß- und Kleinbuchstaben, „::“ höchstens einmal, optional „/Präfix“ (wird ignoriert). */
  function parse(input) {
    let s = String(input).trim().toLowerCase();
    if (!s) return { ok: false, err: 'Bitte eine Adresse eingeben.' };
    s = s.replace(/\/\d{1,3}$/, '');
    if (s.includes('%')) return { ok: false, err: 'Die Zonen-ID nach „%“ (z. B. %12) gehört nicht zur Adresse – lass sie weg.' };
    if (/\d+\.\d+\.\d+\.\d+$/.test(s)) return { ok: false, err: 'Eine IPv4-Adresse am Ende (z. B. ::ffff:192.168.1.1) wird hier nicht unterstützt.' };
    const bad = s.match(/[^0-9a-f:]/);
    if (bad) return { ok: false, err: `Ungültiges Zeichen „${bad[0]}“ – erlaubt sind nur 0–9, a–f und Doppelpunkte.` };
    const dc = s.split('::').length - 1;
    if (dc > 1) return { ok: false, err: '„::“ darf nur <b>einmal</b> vorkommen – sonst wäre unklar, wie viele Null-Blöcke an welcher Stelle fehlen.' };
    if (s.includes(':::')) return { ok: false, err: 'Drei Doppelpunkte hintereinander gibt es nicht.' };
    const side = t => (t === '' ? [] : t.split(':'));
    let head, tail;
    if (dc === 1) [head, tail] = s.split('::').map(side);
    else { head = side(s); tail = []; }
    const all = [...head, ...tail];
    if (all.some(g => g === '')) return { ok: false, err: 'Ein Block ist leer – einzelne Doppelpunkte dürfen nicht am Anfang, am Ende oder doppelt stehen (dafür gibt es „::“).' };
    const long = all.find(g => g.length > 4);
    if (long) return { ok: false, err: `Der Block „${long}“ hat mehr als 4 Ziffern – ein Block hat höchstens 4 Hex-Ziffern (16 Bit).` };
    const n = all.length;
    if (dc === 0 && n !== 8) return { ok: false, err: `Die Adresse hat ${n} Blöcke – nötig sind <b>8</b> (oder „::“ für ausgelassene Null-Blöcke).` };
    if (dc === 1 && n > 7) return { ok: false, err: 'Mit „::“ muss mindestens ein Block fehlen – hier sind es schon 8 Blöcke.' };
    const zeros = Array(8 - n).fill('0');
    const groups = [...head, ...(dc ? zeros : []), ...tail].map(g => parseInt(g, 16));
    return { ok: true, groups };
  }

  const full = g => g.map(hex4).join(':');
  const noLeading = g => g.map(x => x.toString(16));

  // Längste Folge von mindestens 2 Null-Blöcken (bei Gleichstand die erste) – nach RFC 5952
  function zeroRun(g) {
    let best = { at: -1, len: 0 };
    for (let i = 0; i < 8;) {
      if (g[i] !== 0) { i++; continue; }
      let j = i;
      while (j < 8 && g[j] === 0) j++;
      if (j - i > best.len) best = { at: i, len: j - i };
      i = j;
    }
    return best.len >= 2 ? best : { at: -1, len: 0 };
  }

  function compress(g) {
    const parts = noLeading(g);
    const r = zeroRun(g);
    if (r.at < 0) return parts.join(':');
    return `${parts.slice(0, r.at).join(':')}::${parts.slice(r.at + r.len).join(':')}`;
  }

  const bits = g => g.map(x => x.toString(2).padStart(16, '0')).join('');
  const fromBits = b => Array.from({ length: 8 }, (_, i) => parseInt(b.slice(i * 16, i * 16 + 16), 2));
  const network = (g, p) => fromBits(bits(g).slice(0, p).padEnd(128, '0'));
  const hostPart = (g, p) => fromBits('0'.repeat(p) + bits(g).slice(p));
  const equal = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);
  const inPrefix = (g, pre, p) => bits(g).slice(0, p) === bits(parse(pre).groups).slice(0, p);

  // Adresstyp
  const TYPES = [
    { key: 'unspec', test: g => g.every(x => x === 0), name: 'Unspezifiziert (::)', text: 'Bedeutet „noch keine Adresse“ – wie 0.0.0.0 bei IPv4.' },
    { key: 'loop', test: g => equal(g, [0, 0, 0, 0, 0, 0, 0, 1]), name: 'Loopback (::1)', text: 'Das Gerät selbst – wie 127.0.0.1 bei IPv4.' },
    { key: 'link', test: g => inPrefix(g, 'fe80::', 10), name: 'Link-Local (verbindungslokal)', text: 'Beginnt mit fe80. Hat jedes IPv6-Gerät automatisch, gilt nur im eigenen Netzsegment und wird nicht geroutet.' },
    { key: 'ula', test: g => inPrefix(g, 'fc00::', 7), name: 'Unique Local (privat)', text: 'Beginnt mit fd (fc00::/7). Für interne Netze, wird im Internet nicht geroutet – vergleichbar mit 192.168.x.x.' },
    { key: 'mcast', test: g => inPrefix(g, 'ff00::', 8), name: 'Multicast', text: 'Beginnt mit ff. Adressiert eine Gruppe, z. B. ff02::1 = alle Geräte im Segment. Broadcast gibt es bei IPv6 nicht mehr.' },
    { key: 'doc', test: g => inPrefix(g, '2001:db8::', 32), name: 'Dokumentation', text: '2001:db8::/32 ist nur für Beispiele in Büchern und Anleitungen reserviert.' },
    { key: 'global', test: g => inPrefix(g, '2000::', 3), name: 'Global Unicast (öffentlich)', text: 'Beginnt mit 2 oder 3 (2000::/3). Weltweit eindeutig und im Internet erreichbar.' },
  ];
  const typeOf = g => TYPES.find(t => t.test(g)) || { key: 'other', name: 'Reserviert / sonstige', text: 'Dieser Bereich ist derzeit nicht für normale Geräte vorgesehen.' };

  /* EUI-64: MAC (beliebige Trenner) → { ok, mac[6 Bytes], steps, iid[4 Blöcke] } */
  function parseMac(input) {
    const h = String(input).trim().toLowerCase().replace(/[\s:.-]/g, '');
    if (!/^[0-9a-f]{12}$/.test(h)) return null;
    return Array.from({ length: 6 }, (_, i) => parseInt(h.slice(i * 2, i * 2 + 2), 16));
  }
  const hex2 = n => n.toString(16).padStart(2, '0');
  function eui64(mac) {
    const first = mac[0] ^ 0x02; // 7. Bit (U/L-Bit) umdrehen
    const bytes = [first, mac[1], mac[2], 0xff, 0xfe, mac[3], mac[4], mac[5]];
    const iid = [0, 1, 2, 3].map(i => bytes[i * 2] * 256 + bytes[i * 2 + 1]);
    return { bytes, iid, first };
  }
  // Interface-ID (4 Blöcke) → MAC, wenn sie nach EUI-64 gebildet wurde (ff:fe in der Mitte)
  function macFromIid(iid) {
    const b = iid.flatMap(x => [x >> 8, x & 255]);
    if (b[3] !== 0xff || b[4] !== 0xfe) return null;
    return [b[0] ^ 0x02, b[1], b[2], b[5], b[6], b[7]];
  }
  const macText = (m, sep = ':') => m.map(hex2).join(sep);

  return { parse, full, noLeading, compress, zeroRun, bits, network, hostPart, equal, typeOf, TYPES, parseMac, eui64, macFromIid, macText, hex2, hex4 };
})();
