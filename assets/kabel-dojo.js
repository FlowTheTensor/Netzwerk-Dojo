/* Kabel & Signale · Station 6 – Kabel-Dojo: Aufgaben-Generatoren (Mechanik in dojo-engine.js) */
'use strict';

(() => {
  const { T568A, T568B, XO, CATS } = KABEL;
  const { manchester, decode, bin8 } = SIGNAL;
  const { STD } = ETHERNET;
  const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const shuffle = a => [...a].sort(() => Math.random() - .5);
  const mc = (q, right, wrong, sol) => ({ q, choices: shuffle([right, ...wrong]), check: x => x === right, sol });
  const bits = s => s.replace(/\s/g, '');

  // Weiß: Kabel und Schirmung
  const OUTER = { U: 'kein Gesamtschirm', F: 'Gesamtschirm aus Folie', S: 'Gesamtschirm aus Geflecht', SF: 'Gesamtschirm aus Geflecht und Folie' };
  const PAIR = { U: 'Paare ungeschirmt', F: 'Paare einzeln mit Folie' };
  const SHIELDS = [['U', 'U'], ['F', 'U'], ['U', 'F'], ['S', 'F'], ['SF', 'U'], ['S', 'U'], ['F', 'F']];
  const desc = ([o, p]) => `${OUTER[o]}, ${PAIR[p]}`;
  const CABLE_FACTS = [
    ['Warum sind die Adern eines Twisted-Pair-Kabels verdrillt?', 'Störungen treffen beide Adern gleich und heben sich beim Empfänger auf', ['Damit das Kabel biegsamer ist', 'Damit mehr Adern ins Kabel passen', 'Damit das Kabel billiger wird'], 'Das Signal läuft gegenphasig auf beiden Adern. Eine Störung trifft durch die Verdrillung beide gleich – der Empfänger bildet die <b>Differenz</b>, die Störung fällt weg.'],
    ['Welches Kabel ist <b>unempfindlich</b> gegen elektromagnetische Störungen?', 'Glasfaser', ['U/UTP', 'Koaxialkabel', 'S/FTP'], '<b>Glasfaser</b> überträgt Licht statt Strom – elektromagnetische Felder stören es nicht. Schirme verringern Störungen nur.'],
    ['Welche Glasfaser hat einen Kern von nur <b>9 µm</b> und schafft viele Kilometer?', 'Singlemode', ['Multimode', 'OM3', 'Koaxial'], '<b>Singlemode</b> (OS2): 9 µm Kern, nur ein Lichtweg, Laser mit 1310/1550 nm. Multimode hat 50 µm und reicht einige hundert Meter.'],
    ['Wie viele Adern hat ein Twisted-Pair-Netzwerkkabel?', '8', ['4', '2', '6'], '<b>8 Adern</b> in 4 verdrillten Paaren: orange, grün, blau, braun – jeweils mit einer weiß gestreiften Partnerader.'],
    ['Wie ist es mit ungeschirmten Netzwerkkabeln (U/UTP) in Deutschland?', 'Sie sind unüblich – meist wird geschirmt verlegt', ['Sie sind verboten', 'Sie sind vorgeschrieben', 'Es gibt sie nur für Telefone'], 'Weltweit ist U/UTP das häufigste Kabel. In Deutschland wird dagegen traditionell geschirmt verlegt, meist S/FTP.'],
    ['Wofür benutzte man Koaxialkabel im Ethernet?', 'für den Bus bei 10BASE5 und 10BASE2', ['für 10GBASE-T', 'für die Stern-Verkabelung mit Switch', 'für WLAN'], 'Die ersten Ethernet-Netze waren ein <b>Bus</b> aus Koaxialkabel mit 10 Mbit/s. Heute ist das Geschichte.'],
  ];
  function genCable() {
    const v = rnd(0, 2);
    if (v === 0) {
      const s = pick(SHIELDS);
      const name = `${s[0]}/${s[1]}TP`;
      return mc(`Was bedeutet die Kabelbezeichnung <b>${name}</b>?`, desc(s), shuffle(SHIELDS.filter(x => x !== s)).slice(0, 3).map(desc),
        `Vor dem Schrägstrich steht der Gesamtschirm (<b>${s[0]}</b>), dahinter der Schirm der einzelnen Paare (<b>${s[1]}</b>): ${desc(s)}.`);
    }
    if (v === 1) {
      const s = pick(SHIELDS);
      const name = `${s[0]}/${s[1]}TP`;
      return {
        q: `Ein Kabel hat: <b>${desc(s)}</b>. Wie lautet die Bezeichnung nach ISO/IEC 11801?`, ph: 'z. B. U/UTP',
        check: x => x.trim().toUpperCase().replace(/\s/g, '') === name,
        sol: `<b>${name}</b> – vorne der Gesamtschirm (U, F, S, SF), hinten der Paarschirm (U, F), dann TP.`,
      };
    }
    return mc(...pick(CABLE_FACTS));
  }

  // Gelb: Kategorien
  function genCat() {
    const v = rnd(0, 3);
    if (v === 0) {
      const [k, , mhz] = pick(CATS.filter(c => c[0] !== '8.2'));
      const others = [...new Set(CATS.map(c => c[2]))].filter(m => m !== mhz);
      const fmt = m => `${m.toLocaleString('de-DE')} MHz`;
      return mc(`Bis zu welcher Frequenz ist <b>Kat. ${k}</b> spezifiziert?`, fmt(mhz), shuffle(others).slice(0, 3).map(fmt),
        `Kat. 5e: 100 MHz · Kat. 6: 250 MHz · <b>Kat. 6A: 500 MHz</b> · Kat. 7: 600 MHz · Kat. 7A: 1000 MHz · Kat. 8: 2000 MHz. Gesucht: <b>${fmt(mhz)}</b>.`);
    }
    if (v === 1) {
      const [q, right, sol] = pick([
        ['Welche Kategorie braucht man mindestens für <b>10GBASE-T auf 100 m</b>?', '6A', 'Für 10 Gbit/s auf voller Länge braucht man <b>Kat. 6A</b> (500 MHz). Kat. 6 schafft das nur bis 55 m.'],
        ['Welche Kategorie reicht mindestens für <b>1000BASE-T auf 100 m</b>?', '5e', 'Gigabit-Ethernet läuft schon über <b>Kat. 5e</b>.'],
        ['Welche Kategorie braucht man für <b>40GBASE-T</b>?', '8', '25GBASE-T und 40GBASE-T brauchen <b>Kat. 8</b> – und schaffen nur 30 m.'],
        ['Welche Kategorie nimmt man heute mindestens für eine <b>neue Installation</b>?', '6A', 'Heute verlegt man mindestens <b>Kat. 6A</b> – damit ist 10GBASE-T auf 100 m möglich.'],
      ]);
      return mc(q, `Kat. ${right}`, ['Kat. 5e', 'Kat. 6', 'Kat. 6A', 'Kat. 8'].filter(x => x !== `Kat. ${right}`), sol);
    }
    if (v === 2) {
      return pick([
        { q: 'Wie lang darf eine Twisted-Pair-Strecke (Channel) bei 1000BASE-T höchstens sein? (in m)', ph: 'Meter', check: x => Number(x.replace(/m/i, '').trim()) === 100, sol: '<b>100 m</b>: 90 m fest verlegt plus 10 m Patchkabel.' },
        { q: 'Wie lang darf das <b>fest verlegte</b> Kabel (Link) einer Twisted-Pair-Strecke höchstens sein? (in m)', ph: 'Meter', check: x => Number(x.replace(/m/i, '').trim()) === 90, sol: '<b>90 m</b> Link plus zusammen 10 m Patchkabel = 100 m Channel.' },
        { q: 'Wie lang darf eine Strecke mit <b>Kat. 8</b> höchstens sein? (in m)', ph: 'Meter', check: x => Number(x.replace(/m/i, '').trim()) === 30, sol: 'Kat. 8 schafft nur <b>30 m</b> – gedacht für das Rechenzentrum.' },
      ]);
    }
    const [k, c] = pick(CATS.filter(x => !x[0].startsWith('8')));
    const cls = c.replace(/<\/?sub>/g, '');
    return mc(`Zu welcher <b>Klasse</b> gehört eine Strecke aus Bauteilen der Kat. ${k}?`, `Klasse ${cls}`,
      shuffle(['D', 'E', 'EA', 'F', 'FA'].filter(x => x !== cls)).slice(0, 3).map(x => `Klasse ${x}`),
      `Kat. 5e → D · Kat. 6 → E · Kat. 6A → E<sub>A</sub> · Kat. 7 → F · Kat. 7A → F<sub>A</sub>. Die Kategorie gilt für Bauteile, die Klasse für die ganze Strecke.`);
  }

  // Orange: RJ45-Belegung
  const WIRES = [...T568B];
  function genPins() {
    const v = rnd(0, 3);
    if (v === 0) {
      const std = pick(['T568A', 'T568B']);
      const list = std === 'T568A' ? T568A : T568B;
      const i = rnd(0, 7);
      return mc(`Welche Ader liegt bei <b>${std}</b> auf <b>Pin ${i + 1}</b>?`, list[i], shuffle(WIRES.filter(w => w !== list[i])).slice(0, 3),
        `${std}: ${list.map((w, k) => `${k + 1} ${k === i ? `<b>${w}</b>` : w}`).join(' · ')}`);
    }
    if (v === 1) {
      const i = rnd(0, 7);
      return {
        q: `Gigabit-Crossover-Kabel: Mit welchem Pin am anderen Ende wird <b>Pin ${i + 1}</b> verbunden?`, ph: '1 – 8',
        check: x => Number(x.trim()) === XO[i],
        sol: `Gekreuzt werden 1↔3, 2↔6, 4↔7, 5↔8 – also Pin ${i + 1} ↔ <b>Pin ${XO[i]}</b>.`,
      };
    }
    if (v === 2) {
      return pick([
        mc('Welche Adernpaare tauschen zwischen T568A und T568B die Plätze?', 'Orange und Grün', ['Blau und Braun', 'Orange und Blau', 'alle vier Paare'], 'Nur <b>Orange und Grün</b> tauschen (Pins 1, 2 ↔ 3, 6). Blau (4, 5) und Braun (7, 8) bleiben gleich.'),
        mc('Welche Pins nutzt <b>100BASE-TX</b>?', '1, 2, 3 und 6', ['1 bis 8', '4, 5, 7 und 8', '1, 2, 7 und 8'], '10BASE-T und 100BASE-TX nutzen nur zwei Paare: Pins <b>1, 2</b> zum Senden und <b>3, 6</b> zum Empfangen.'),
        mc('Wie viele Adernpaare nutzt <b>1000BASE-T</b>?', 'alle 4', ['2', '3', '1'], 'Gigabit-Ethernet über Kupfer nutzt <b>alle vier Paare</b>, gleichzeitig in beide Richtungen.'),
        mc('Was ist ein <b>Patchkabel</b> (Straight-Through)?', 'beide Enden gleich belegt', ['ein Ende T568A, das andere T568B', 'alle Paare gekreuzt', 'ein Kabel nur mit 4 Adern'], 'Beim <b>Patchkabel</b> sind beide Enden gleich belegt. Ein Crossover-Kabel kreuzt Senden und Empfangen.'),
      ]);
    }
    return mc('Warum braucht man heute kaum noch Crossover-Kabel?', 'Die Geräte erkennen die Belegung selbst (Auto-MDI-X)', ['Weil es keine RJ45-Stecker mehr gibt', 'Weil WLAN Kabel ersetzt hat', 'Weil Switches nur Crossover-Kabel annehmen'], 'Mit <b>Auto-MDI-X</b> tauschen die Geräte intern Senden und Empfangen, wenn nötig. Ein Patchkabel passt deshalb fast immer.');
  }

  // Grün: Manchester-Code
  const randBits = n => Array.from({ length: n }, () => (Math.random() < .5 ? '0' : '1')).join('');
  function genManchester() {
    const v = rnd(0, 3);
    if (v === 0) {
      const b = randBits(rnd(4, 6));
      return { q: `Wie lautet der Manchester-Code (IEEE 802.3) für die Bits <b>${b}</b>?`, ph: 'z. B. 1001…', check: x => bits(x) === manchester(b), sol: `0 → <code>10</code>, 1 → <code>01</code>: <b>${manchester(b).replace(/(..)/g, '$1 ').trim()}</b>` };
    }
    if (v === 1) {
      const b = randBits(rnd(4, 6));
      const c = manchester(b);
      return { q: `Welche Datenbits ergibt der Manchester-Code <b>${c.replace(/(..)/g, '$1 ').trim()}</b>?`, ph: 'Bits', check: x => bits(x) === b, sol: `In Zweiergruppen lesen: <code>10</code> = 0, <code>01</code> = 1 → <b>${decode(c)}</b>` };
    }
    if (v === 2) {
      const ch = pick([...'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789']);
      const n = ch.charCodeAt(0);
      return {
        q: `Empfangen: <b>${manchester(bin8(n)).replace(/(..)/g, '$1 ').trim()}</b> (Manchester). Welches ASCII-Zeichen ist das?`, ph: 'Zeichen',
        check: x => x.trim() === ch,
        sol: `Bits <code>${bin8(n)}</code> = ${n} = <b>„${ch}“</b>`,
      };
    }
    return mc(...pick([
      ['Was passiert beim Manchester-Code in der <b>Mitte jedes Bits</b>?', 'Die Spannung wechselt immer', ['Die Spannung bleibt gleich', 'Es wird eine Pause gesendet', 'Nur bei einer 1 wechselt die Spannung'], 'In jeder Bitmitte gibt es eine Flanke – daraus gewinnt der Empfänger den <b>Takt</b> zurück.'],
      ['Was bedeutet bei Ethernet eine <b>steigende</b> Flanke in der Bitmitte?', 'eine logische 1', ['eine logische 0', 'ein neuer Frame', 'eine Kollision'], 'IEEE 802.3: steigende Flanke (<code>01</code>) = <b>1</b>, fallende Flanke (<code>10</code>) = 0.'],
      ['Welchen Vorteil hat der Manchester-Code?', 'Man braucht keine eigene Taktleitung', ['Er braucht weniger Signalwechsel', 'Er ist schneller als PAM-5', 'Er funktioniert nur mit Glasfaser'], 'Der Takt steckt im Signal (<b>Taktrückgewinnung</b>). Der Preis: doppelt so viele Signalschritte wie Bits.'],
      ['Welcher Ethernet-Standard benutzt den Manchester-Code?', '10BASE-T', ['1000BASE-T', '100BASE-TX', '10GBASE-T'], 'Nur das 10-Mbit-Ethernet (10BASE-T, 10BASE2, 10BASE5) benutzt <b>Manchester</b>. 100BASE-TX nutzt MLT-3, 1000BASE-T PAM-5.'],
      ['Warum benutzt 1000BASE-T nicht den Manchester-Code?', 'Die Frequenzen wären für das Kupferkabel zu hoch', ['Weil Manchester verboten ist', 'Weil Manchester keine Nullen kann', 'Weil Glasfaser nötig wäre'], 'Manchester braucht zwei Schritte pro Bit. <b>PAM-5</b> überträgt mit fünf Stufen mehr Bit pro Schritt und nutzt alle vier Paare.'],
    ]));
  }

  // Blau: Ethernet-Standards
  function genEth() {
    const v = rnd(0, 3);
    if (v === 0) {
      return mc(...pick([
        ['Wofür steht „BASE“ in <b>1000BASE-T</b>?', 'Basisband', ['Basisstation', 'Backbone', 'Basis-Switch'], '<b>BASE</b> = Basisband: Das Signal wird direkt aufs Kabel gegeben und belegt es allein.'],
        ['Wofür steht das „T“ in <b>10GBASE-T</b>?', 'Twisted Pair', ['Transport', 'Token Ring', 'Terabit'], '<b>T</b> = Twisted Pair, das verdrillte Kupferkabel.'],
        ['Welches Medium nutzt <b>10GBASE-SR</b>?', 'Multimode-Glasfaser', ['Singlemode-Glasfaser', 'Twisted Pair', 'Koaxialkabel'], 'SR = short reach: <b>Multimode</b>-Glasfaser mit 850 nm, 300–400 m.'],
        ['Welches Medium nutzt <b>10GBASE-LR</b>?', 'Singlemode-Glasfaser', ['Multimode-Glasfaser', 'Twisted Pair', 'Koaxialkabel'], 'LR = long reach: <b>Singlemode</b>-Glasfaser mit 1310 nm, 10 km.'],
        ['Was war besonders an <b>10BASE2</b>?', 'Bus aus dünnem Koaxialkabel mit BNC-T-Stücken', ['Stern mit RJ45', 'Glasfaser zwischen Gebäuden', 'Funkübertragung'], '10BASE2 („Thin Ethernet“): <b>Bus</b> aus RG-58-Koax, BNC-T-Stücke, Abschlusswiderstände, 185 m.'],
      ]));
    }
    if (v === 1) {
      const s = pick(STD.filter(x => ['10BASE5', '10BASE2', '10BASE-T', '100BASE-TX', '1000BASE-T', '10GBASE-T', '10GBASE-LR', '40GBASE-T'].includes(x.id)));
      const lens = ['500 m', '185 m', '100 m', '30 m', '10 km', '2 km'];
      const right = s.len.split(' pro')[0];
      return mc(`Wie lang darf eine Strecke bei <b>${s.id}</b> höchstens sein?`, right, shuffle(lens.filter(l => l !== right)).slice(0, 3), `${s.id}: <b>${s.len}</b> · ${s.medium}.`);
    }
    if (v === 2) {
      return mc(...pick([
        ['Welcher Standard bringt <b>10 Gbit/s über Kupfer</b>?', '10GBASE-T', ['10BASE-T', '10GBASE-SR', '1000BASE-T'], '<b>10GBASE-T</b> über Twisted Pair Kat. 6A. 10GBASE-SR ist Glasfaser, 10BASE-T nur 10 Mbit/s.'],
        ['Welcher Standard ist das heute übliche <b>Gigabit-Ethernet über Kupfer</b>?', '1000BASE-T', ['1000BASE-SX', '100BASE-TX', '10BASE5'], '<b>1000BASE-T</b>: Kat. 5e, 100 m, alle vier Paare.'],
        ['Welcher Standard wurde für schnelle WLAN-Access-Points auf <b>vorhandenen Kat.-5e-Kabeln</b> entwickelt?', '2.5GBASE-T', ['10GBASE-T', '100BASE-T4', '1000BASE-LX'], '<b>2.5GBASE-T</b> (IEEE 802.3bz) schafft 2,5 Gbit/s auf Kat. 5e bis 100 m.'],
        ['Welche Norm-Familie beschreibt Ethernet?', 'IEEE 802.3', ['IEEE 802.11', 'RFC 791', 'ISO 7498'], 'Ethernet ist <b>IEEE 802.3</b>. 802.11 ist WLAN, RFC 791 ist IPv4, ISO 7498 das OSI-Modell.'],
      ]));
    }
    return mc(...pick([
      ['Wofür galt die <b>5-4-3-Regel</b>?', 'für alte Netze mit Koax-Bus und Hubs (Kollisionen)', ['für moderne Switch-Netze', 'für Glasfaser', 'für WLAN'], 'Die 5-4-3-Regel sorgte in <b>geteilten Medien</b> (Koax, Hubs) dafür, dass Kollisionen rechtzeitig erkannt werden. Mit Switches und Vollduplex spielt sie keine Rolle mehr.'],
      ['Warum gibt es in heutigen Switch-Netzen <b>keine Kollisionen</b> mehr?', 'Jedes Gerät hat einen eigenen Port und sendet im Vollduplex', ['Weil Kabel geschirmt sind', 'Weil alle Geräte dieselbe MAC-Adresse haben', 'Weil Glasfaser verwendet wird'], 'Eigener Switch-Port plus <b>Vollduplex</b>: Senden und Empfangen laufen gleichzeitig auf getrennten Wegen.'],
      ['Was ist der Trick von <b>1000BASE-T</b>?', 'Alle 4 Paare senden gleichzeitig in beide Richtungen', ['Es nutzt Glasfaser im Kupferkabel', 'Es sendet nur auf einem Paar', 'Es braucht keinen Leitungscode'], 'Alle vier Paare, beide Richtungen gleichzeitig, PAM-5 mit 2 Bit pro Schritt: 4 × 2 Bit × 125 Millionen = <b>1000 Mbit/s</b>.'],
    ]));
  }

  Dojo.create({
    mount: UI.$('#d-kabel'),
    pageId: 'kabel-dojo',
    storeKey: 'kabel-belts',
    belts: [
      { id: 'weiss', name: 'Weißer Gürtel', topic: 'Kabel & Schirmung', gen: genCable },
      { id: 'gelb', name: 'Gelber Gürtel', topic: 'Kategorien', gen: genCat },
      { id: 'orange', name: 'Oranger Gürtel', topic: 'RJ45-Belegung', gen: genPins },
      { id: 'gruen', name: 'Grüner Gürtel', topic: 'Manchester-Code', gen: genManchester },
      { id: 'blau', name: 'Blauer Gürtel', topic: 'Ethernet-Standards', gen: genEth },
    ],
    note: 'Bits und Manchester-Codes darfst du mit oder ohne Leerzeichen eingeben. Der Fortschritt wird nur in diesem Browser gespeichert.',
  });
})();
