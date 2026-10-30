/* Subnet-Dojo – IPv4-Rechenkern.
   Alle Adressen werden als vorzeichenlose 32-Bit-Zahl (0 … 4294967295) behandelt. */
'use strict';

const IPv4 = (() => {
  // Die drei privaten Blöcke aus RFC 1918, Abschnitt 3
  const RFC1918 = [
    { start: 0x0A000000, prefix: 8, cidr: '10.0.0.0/8', rfc: '10/8', cls: 'A',
      range: '10.0.0.0 – 10.255.255.255', classful: 'genau 1 Klasse-A-Netz' },
    { start: 0xAC100000, prefix: 12, cidr: '172.16.0.0/12', rfc: '172.16/12', cls: 'B',
      range: '172.16.0.0 – 172.31.255.255', classful: '16 Klasse-B-Netze, 172.16.x.x bis 172.31.x.x' },
    { start: 0xC0A80000, prefix: 16, cidr: '192.168.0.0/16', rfc: '192.168/16', cls: 'C',
      range: '192.168.0.0 – 192.168.255.255', classful: '256 Klasse-C-Netze, 192.168.0.x bis 192.168.255.x' },
  ];

  // Historische Adressklassen (RFC 791; D und E wurden später ergänzt)
  const CLASSES = {
    A: { cls: 'A', prefix: 8, lead: '0', first: 0, last: 127 },
    B: { cls: 'B', prefix: 16, lead: '10', first: 128, last: 191 },
    C: { cls: 'C', prefix: 24, lead: '110', first: 192, last: 223 },
    D: { cls: 'D', prefix: null, lead: '1110', first: 224, last: 239 },
    E: { cls: 'E', prefix: null, lead: '1111', first: 240, last: 255 },
  };

  function parse(str) {
    if (typeof str !== 'string') return null;
    const m = str.trim().match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
    if (!m) return null;
    let n = 0;
    for (let i = 1; i <= 4; i++) {
      const o = Number(m[i]);
      if (o > 255) return null;
      n = n * 256 + o;
    }
    return n;
  }

  const octets = n => [n >>> 24, (n >>> 16) & 255, (n >>> 8) & 255, n & 255];
  const format = n => octets(n).join('.');
  const mask = p => (p <= 0 ? 0 : (0xFFFFFFFF << (32 - p)) >>> 0);

  // Liefert das Präfix einer Maske oder null, wenn die Einsen nicht lückenlos links stehen
  function prefixOfMask(m) {
    const inv = ~m >>> 0;
    if ((inv & (inv + 1)) !== 0) return null;
    let p = 0;
    while (p < 32 && (m & (0x80000000 >>> p)) !== 0) p++;
    return p;
  }

  // Akzeptiert "/26", "26" oder "255.255.255.192"
  function parseMask(str) {
    if (typeof str !== 'string') return null;
    const s = str.trim();
    const m = s.match(/^\/?\s*(\d{1,2})$/);
    if (m) {
      const p = Number(m[1]);
      return p <= 32 ? p : null;
    }
    const n = parse(s);
    return n === null ? null : prefixOfMask(n);
  }

  const network = (ip, p) => (ip & mask(p)) >>> 0;
  const broadcast = (ip, p) => (network(ip, p) | (~mask(p) >>> 0)) >>> 0;
  const size = p => 2 ** (32 - p);
  const hosts = p => Math.max(0, size(p) - 2);

  // Größtes Präfix (kleinstes Netz), das mindestens h nutzbare Adressen bietet
  function prefixForHosts(h) {
    for (let p = 30; p >= 0; p--) if (hosts(p) >= h) return p;
    return null;
  }

  function classOf(ip) {
    const o = ip >>> 24;
    for (const k of 'ABCDE') if (o <= CLASSES[k].last) return CLASSES[k];
    return CLASSES.E;
  }

  const privateBlock = ip => RFC1918.find(b => network(ip, b.prefix) === b.start) || null;
  const contains = (net, p, ip) => network(ip, p) === net;
  const overlaps = (a, ap, b, bp) => {
    const p = Math.min(ap, bp);
    return network(a, p) === network(b, p);
  };
  const bin = n => n.toString(2).padStart(32, '0');
  const fmtNum = x => x.toLocaleString('de-DE');

  return {
    RFC1918, CLASSES, parse, format, octets, mask, prefixOfMask, parseMask, network, broadcast,
    size, hosts, prefixForHosts, classOf, privateBlock, contains, overlaps, bin, fmtNum,
  };
})();
