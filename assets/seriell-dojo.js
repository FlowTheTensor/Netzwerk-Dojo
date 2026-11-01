/* Serielle Schnittstellen · Station 6 – Seriell-Dojo: Aufgaben-Generatoren (Mechanik in dojo-engine.js) */
'use strict';

(() => {
  const { bin, hex, ones, parityBit, PARITY, frameBits, PINS } = SERIELL;
  const { I2C_DEV, firstByte } = BUS;
  const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const shuffle = a => [...a].sort(() => Math.random() - .5);
  const mc = (q, right, wrong, sol) => ({ q, choices: shuffle([right, ...wrong]), check: x => x === right, sol });
  const fmt = n => String(n).replace(/\B(?=(\d{3})+$)/g, ' ');
  const de = (x, d) => (Math.round(x * 10 ** d) / 10 ** d).toString().replace('.', ',');
  // Zahl aus der Eingabe: „57 600“, „9.600“ (Tausenderpunkt) und „104,2“ sind erlaubt
  function num(x) {
    let s = String(x).replace(/[\s ]/g, '').replace(/[^\d.,]/g, '');
    if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, '');
    return s ? Number(s.replace(',', '.')) : NaN;
  }
  const near = (x, want, rel) => Math.abs(num(x) - want) <= Math.abs(want) * rel;
  const hexIn = x => { const s = x.trim().replace(/^0x/i, '').replace(/h$/i, ''); return /^[0-9a-f]{1,2}$/i.test(s) ? parseInt(s, 16) : NaN; };
  const bitsIn = x => x.replace(/\s/g, '');

  // Weiß: seriell, parallel, Bus
  function genGrund() {
    return mc(...pick([
      ['Wie werden die Bits bei einer <b>seriellen</b> Schnittstelle übertragen?', 'nacheinander über eine Datenleitung', ['gleichzeitig über mehrere Leitungen', 'nur nachts', 'immer drahtlos'], 'Seriell = <b>Bit für Bit nacheinander</b>, je Richtung eine Datenleitung.'],
      ['Wie werden die Bits bei einer <b>parallelen</b> Schnittstelle übertragen?', 'gleichzeitig über mehrere Leitungen', ['nacheinander über eine Leitung', 'abwechselnd vorwärts und rückwärts', 'nur über Funk'], 'Parallel hat jedes Bit seine <b>eigene Leitung</b>, z. B. 8 Bit auf 8 Leitungen.'],
      ['Warum sind schnelle Schnittstellen heute fast alle seriell?', 'Parallele Leitungen kommen bei hohem Takt nicht mehr im Gleichschritt an', ['Serielle Kabel sind dicker', 'Parallel ist verboten', 'Seriell braucht mehr Adern'], 'Bei hohem Takt stören <b>Laufzeitunterschiede</b> und <b>Übersprechen</b> – eine serielle Leitung lässt sich viel höher takten.'],
      ['Welche Schnittstelle ist <b>parallel</b>?', 'die alte Druckerschnittstelle LPT', ['USB', 'SATA', 'Ethernet'], 'LPT (Centronics) hatte <b>8 Datenleitungen</b>. USB, SATA und Ethernet sind seriell.'],
      ['Welche Schnittstelle ist <b>seriell</b>?', 'PCI Express', ['PCI', 'PATA (IDE)', 'LPT'], 'PCI Express besteht aus <b>seriellen Lanes</b> – es hat den parallelen PCI-Bus abgelöst.'],
      ['Wo findet man heute noch parallele Übertragung?', 'zwischen Prozessor und Arbeitsspeicher', ['bei USB-Sticks', 'bei Ethernet', 'bei SATA-Festplatten'], 'Der Speicherbus ist <b>64 Bit breit</b> – über wenige Zentimeter mit genau gleich langen Leiterbahnen.'],
      ['Was bedeutet <b>unidirektional</b>?', 'Nur einer sendet, der andere empfängt', ['Beide senden gleichzeitig', 'Beide senden abwechselnd', 'Niemand sendet'], 'Uni = eine Richtung.'],
      ['Was bedeutet <b>vollduplex</b>?', 'Beide können gleichzeitig senden', ['Beide senden abwechselnd', 'Nur einer sendet', 'Es gibt zwei Kabel für denselben Weg'], 'Vollduplex = <b>gleichzeitig in beide Richtungen</b>, z. B. RS-232 mit TXD und RXD.'],
      ['Was bedeutet <b>halbduplex</b>?', 'Beide können senden, aber abwechselnd', ['Beide senden gleichzeitig', 'Nur einer sendet', 'Es wird nur die halbe Datenrate genutzt'], 'Wie beim Funkgerät: <b>abwechselnd</b>. I²C arbeitet so.'],
      ['Was ist ein <b>Bus</b>?', 'ein gemeinsames Übertragungsmedium für mehrere Teilnehmer', ['eine Verbindung zwischen genau zwei Geräten', 'ein Stecker mit 9 Pins', 'ein Verschlüsselungsverfahren'], 'Am Bus hängen <b>alle Teilnehmer an derselben Leitung</b>.'],
      ['Was braucht ein Bus mit vielen Teilnehmern auf jeden Fall?', 'eindeutige Adressen', ['einen Bildschirm', 'Glasfaser', 'ein Nullmodemkabel'], 'Nur mit <b>Adressen</b> weiß jeder, ob eine Nachricht für ihn ist. Dazu kommen Zugriffsverfahren und Protokoll.'],
      ['Woher kommt das Wort „Bus“?', 'vom lateinischen omnibus – für alle', ['von Binary Unit System', 'von Bit Upload Stream', 'von Basic Universal Serial'], '„Binary Unit System“ ist eine <b>nachträglich erfundene</b> Auflösung.'],
      ['Beim KNX-Bus: Was ist ein <b>Thermostat</b>?', 'ein Sensor', ['ein Aktor', 'ein Router', 'ein Pull-up-Widerstand'], 'Sensoren <b>geben Befehle</b> (Thermostat, Taster, Windmesser), Aktoren führen sie aus (Leuchte, Jalousie).'],
    ]));
  }

  // Gelb: RS-232
  function genRs232() {
    const v = rnd(0, 2);
    if (v === 0) {
      const [n, ab, name] = pick(PINS);
      return Math.random() < .5
        ? { q: `An welchem Pin des 9-poligen RS-232-Steckers liegt <b>${ab}</b> (${name})?`, ph: 'Pin', check: x => num(x) === n, sol: `${ab} liegt an <b>Pin ${n}</b>.` }
        : mc(`Was liegt an <b>Pin ${n}</b> des 9-poligen RS-232-Steckers?`, ab, shuffle(PINS.filter(p => p[0] !== n).map(p => p[1])).slice(0, 3), `Pin ${n} ist <b>${ab}</b> – ${name}.`);
    }
    return mc(...pick([
      ['Welche drei Pins braucht man mindestens für eine RS-232-Verbindung?', '2, 3 und 5', ['1, 2 und 3', '4, 6 und 8', '7, 8 und 9'], '<b>RXD (2), TXD (3) und GND (5)</b> – die übrigen sind Steuerleitungen.'],
      ['Welchen Pegel hat eine logische <b>1</b> bei RS-232?', '−3 V bis −15 V', ['+3 V bis +15 V', '0 V', '5 V'], 'RS-232 ist „anders herum“: <b>1 = negativ</b>, 0 = positiv.'],
      ['Welchen Pegel hat eine logische <b>0</b> bei RS-232?', '+3 V bis +15 V', ['−3 V bis −15 V', '0 V', '3,3 V'], 'Eine 0 (Space) ist <b>positiv</b>, etwa +12 V.'],
      ['Warum darf man einen Mikrocontroller nicht direkt an RS-232 anschließen?', 'Die Spannungen von ±12 V würden ihn zerstören', ['RS-232 ist zu langsam', 'Mikrocontroller haben keine Bits', 'RS-232 braucht Glasfaser'], 'Dazwischen gehört ein <b>Pegelwandler</b> wie der MAX232.'],
      ['Wie heißt der 9-polige RS-232-Stecker richtig?', 'DE-9', ['DB-9', 'RJ45', 'USB-C'], 'Gehäusegröße E mit 9 Pins: <b>DE-9</b>. „DB“ ist die Größe des 25-poligen Steckers.'],
      ['Womit verbindet man zwei PCs über RS-232?', 'mit einem Nullmodemkabel', ['mit einem geraden 1:1-Kabel', 'mit einem Patchkabel', 'gar nicht'], 'Im <b>Nullmodemkabel</b> sind TXD und RXD gekreuzt.'],
      ['Wofür steht <b>TXD</b>?', 'Transmit Data – Daten senden', ['Receive Data – Daten empfangen', 'Transfer Disk', 'Test Data'], 'TXD sendet, RXD empfängt.'],
      ['Wofür sind RTS und CTS da?', 'Hardware-Flusssteuerung', ['Spannungsversorgung', 'Masse', 'Datenübertragung'], '„Darf ich senden?“ – „Ja, sende.“ So bremst ein langsamer Empfänger den Sender.'],
      ['Wo begegnet einem RS-232 im Netzwerk heute noch?', 'als Konsolen-Anschluss an Switches und Routern', ['in jedem WLAN-Access-Point als Antenne', 'im Glasfaserkabel', 'bei DNS'], 'Über den <b>Konsolen-Port</b> richtet man Switches und Router ein, auch wenn das Netz noch nicht läuft.'],
      ['Wie lang darf eine RS-232-Leitung nach Norm etwa sein?', 'etwa 15 m', ['etwa 100 m', 'etwa 2 km', 'etwa 1 cm'], 'Etwa <b>15 m</b> – bei langsamer Übertragung geht auch mehr.'],
    ]));
  }

  // Orange: Übertragungsformat und Parität
  function genFormat() {
    const v = rnd(0, 2);
    if (v === 0) {
      const n = pick([7, 8]), p = pick(['N', 'E', 'O']), s = pick([1, 2]);
      const right = `${n} Datenbits, ${PARITY[p]}, ${s} Stoppbit${s > 1 ? 's' : ''}`;
      const wrong = new Set();
      while (wrong.size < 3) {
        const n2 = pick([7, 8]), p2 = pick(['N', 'E', 'O']), s2 = pick([1, 2]);
        const t = `${n2} Datenbits, ${PARITY[p2]}, ${s2} Stoppbit${s2 > 1 ? 's' : ''}`;
        if (t !== right) wrong.add(t);
      }
      return mc(`Was bedeutet das Übertragungsformat <b>${n}${p}${s}</b>?`, right, [...wrong], `${n} = Datenbits, ${p} = ${PARITY[p]}, ${s} = Stoppbits.`);
    }
    if (v === 1) {
      const f = { n: rnd(5, 9), p: pick(['N', 'E', 'O']), s: pick([1, 2]) };
      const nb = frameBits(f);
      return { q: `Wie viele Bit hat ein Telegramm im Format <b>${f.n}${f.p}${f.s}</b> insgesamt?`, ph: 'Bit', check: x => num(x) === nb, sol: `1 Startbit + ${f.n} Datenbits + ${f.p === 'N' ? '0' : '1'} Paritätsbit + ${f.s} Stoppbit${f.s > 1 ? 's' : ''} = <b>${nb} Bit</b>` };
    }
    const n = pick([7, 8]);
    const data = bin(rnd(0, 2 ** n - 1), n);
    const p = pick(['E', 'O']);
    const pb = parityBit(data, p);
    return {
      q: `Datenbits <code>${data}</code>, Format mit <b>${p === 'E' ? 'gerader' : 'ungerader'} Parität</b> (${p}). Welchen Wert hat das Paritätsbit?`, ph: '0 oder 1',
      check: x => x.trim() === String(pb),
      sol: `${ones(data)} Einsen in den Daten. Damit die Gesamtzahl ${p === 'E' ? 'gerade' : 'ungerade'} ist, wird das Paritätsbit <b>${pb}</b>.`,
    };
  }

  // Grün: rechnen mit der Baudrate
  const BAUDS = [1200, 2400, 4800, 9600, 19200, 38400, 57600, 115200];
  function genBaud() {
    const v = rnd(0, 3);
    if (v === 0) {
      const f = { n: pick([7, 8, 8, 16]), p: pick(['N', 'E', 'O']), s: pick([1, 2]) };
      const b = pick(BAUDS);
      const nb = frameBits(f);
      const t = b / nb;
      return {
        q: `Ein Telegramm hat 1 Startbit, ${f.n} Datenbits, ${f.p === 'N' ? 'kein' : '1'} Paritätsbit und ${f.s} Stoppbit${f.s > 1 ? 's' : ''}. Wie viele Telegramme können bei <b>${fmt(b)} Baud</b> pro Sekunde übertragen werden?`, ph: 'Telegramme pro Sekunde',
        check: x => Math.abs(num(x) - t) < 1,
        sol: `${nb} Bit pro Telegramm: ${fmt(b)} ÷ ${nb} = <b>${Number.isInteger(t) ? fmt(t) : de(t, 1)}</b> Telegramme pro Sekunde`,
      };
    }
    if (v === 1) {
      const b = pick(BAUDS);
      const us = 1e6 / b;
      return { q: `Wie lange dauert ein Bit bei <b>${fmt(b)} Baud</b>? Antwort in µs.`, ph: 'µs', check: x => near(x, us, .015), sol: `1 ÷ ${fmt(b)} s = <b>${de(us, us < 10 ? 2 : 1)} µs</b>` };
    }
    if (v === 2) {
      const b = pick(BAUDS.filter(x => x <= 57600));
      const us = Math.round(1e6 / b);
      return { q: `Im Mitschnitt eines Logikanalysators dauert ein Bit <b>${us} µs</b>. Mit welcher Standard-Baudrate wurde gesendet?`, ph: 'Baud', check: x => near(x, b, .03), sol: `1 ÷ ${us} µs ≈ ${fmt(Math.round(1e6 / us))} → Standardwert <b>${fmt(b)} Baud</b>` };
    }
    const b = pick([9600, 19200, 115200]);
    const n = pick([10, 100, 1000]);
    const ms = n * 10 / b * 1000;
    return { q: `Wie lange dauert es, <b>${fmt(n)} Zeichen</b> im Format 8N1 mit ${fmt(b)} Baud zu senden (ohne Pausen)? Antwort in ms.`, ph: 'ms', check: x => near(x, ms, .02), sol: `8N1 = 10 Bit pro Zeichen: ${fmt(n)} · 10 ÷ ${fmt(b)} s = <b>${de(ms, ms < 10 ? 2 : 1)} ms</b>` };
  }

  // Blau: Bits aus dem Mitschnitt dekodieren
  const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789?!';
  function genDecode() {
    const c = pick([...CHARS]);
    const n = c.charCodeAt(0);
    const wire = [...bin(n)].reverse().join('');
    const v = rnd(0, 2);
    if (v === 0) return { q: `Ein UART hat die Datenbits <code>${wire}</code> empfangen (in der Reihenfolge auf der Leitung). Welches ASCII-Zeichen ist das?`, ph: 'Zeichen', check: x => x.trim() === c, sol: `LSB zuerst – also rückwärts lesen: <code>${bin(n)}</code> = ${hex(n)} = ${n} = <b>„${c}“</b>` };
    if (v === 1) return { q: `Ein UART hat die Datenbits <code>${wire}</code> empfangen (in der Reihenfolge auf der Leitung). Wie lautet der Wert hexadezimal?`, ph: 'z. B. 0x41', check: x => hexIn(x) === n, sol: `Rückwärts gelesen: <code>${bin(n)}</code> = <b>${hex(n)}</b> (${n}, „${c}“)` };
    return { q: `Das Zeichen <b>„${c}“</b> (ASCII ${n}) wird per UART gesendet. Welche 8 Datenbits erscheinen nacheinander auf der Leitung?`, ph: '8 Bit', check: x => bitsIn(x) === wire, sol: `${n} = <code>${bin(n)}</code>, das LSB zuerst: <b>${wire}</b>` };
  }

  // Lila: I²C und SPI
  function genBus() {
    const v = rnd(0, 3);
    if (v === 0) {
      const [, name, addr] = pick([...I2C_DEV, ['', 'Baustein', rnd(0x08, 0x77)]]);
      const rw = rnd(0, 1);
      const fb = firstByte(addr, rw);
      return { q: `Der I²C-Controller will vom ${name} mit der Adresse <b>${hex(addr)}</b> ${rw ? '<b>lesen</b>' : 'Daten <b>schreiben</b>'}. Welches erste Byte sendet er (hexadezimal)?`, ph: 'z. B. 0x91', check: x => hexIn(x) === fb, sol: `${bin(addr, 7)} + R/W ${rw} = <code>${bin(fb)}</code> = <b>${hex(fb)}</b>` };
    }
    if (v === 1) {
      const addr = rnd(0x08, 0x77);
      return { q: `Ein I²C-Mitschnitt zeigt nach der Startbedingung die Adressbits <code>${bin(addr, 7)}</code>. Welche Adresse ist das (hexadezimal)?`, ph: 'z. B. 0x48', check: x => hexIn(x) === addr, sol: `I²C sendet das MSB zuerst – direkt ablesen: <code>${bin(addr, 7)}</code> = <b>${hex(addr)}</b>` };
    }
    if (v === 2) {
      const [us, bus, rate, txt] = pick([[10, 'I²C', 1e5, '100 kbit/s'], [2.5, 'I²C', 4e5, '400 kbit/s'], [1, 'SPI', 1e6, '1 Mbit/s'], [.5, 'SPI', 2e6, '2 Mbit/s'], [.1, 'SPI', 1e7, '10 Mbit/s']]);
      const t = String(us).replace('.', ',');
      return { q: `Im Mitschnitt eines ${bus}-Busses dauert ein Takt <b>${t} µs</b>. Wie viele Bit pro Sekunde sind das?`, ph: 'Bit/s', check: x => near(x, rate, .01), sol: `Ein Bit pro Takt: 1 ÷ ${t} µs = <b>${fmt(rate)} Bit/s</b> = ${txt}` };
    }
    return mc(...pick([
      ['Wie viele Adressen bleiben bei I²C mit 7 Bit für Teilnehmer, wenn 16 reserviert sind?', '112', ['128', '127', '16'], '2<sup>7</sup> = 128, minus 16 = <b>112</b>.'],
      ['Welche Leitungen hat I²C?', 'SDA und SCL', ['TXD und RXD', 'MOSI, MISO, SCLK, CS', 'D0 bis D7'], '<b>SDA</b> für Daten, <b>SCL</b> für den Takt.'],
      ['Warum braucht I²C Pull-up-Widerstände?', 'Die Teilnehmer können die Leitungen nur auf Low ziehen', ['Damit der Bus schneller wird', 'Um die Daten zu verschlüsseln', 'Weil I²C mit ±12 V arbeitet'], 'Open Drain: Die Widerstände ziehen auf High, die Teilnehmer ziehen auf Low – <b>kein Kurzschluss</b>, auch wenn zwei gleichzeitig senden.'],
      ['Was bedeutet das 8. Bit nach der I²C-Adresse?', 'Lesen (1) oder Schreiben (0)', ['ACK oder NACK', 'die Parität', 'das Stoppbit'], 'Das <b>R/W-Bit</b>: 1 = der Controller will lesen, 0 = schreiben.'],
      ['Was zeigt ein <b>NACK</b> direkt nach der Adresse?', 'Kein Teilnehmer hat sich angesprochen gefühlt', ['Die Daten sind angekommen', 'Der Bus ist zu schnell', 'Das Paritätsbit ist falsch'], 'Niemand hat SDA im 9. Takt auf Low gezogen – unter dieser Adresse <b>antwortet niemand</b>.'],
      ['Welches Bit sendet I²C zuerst?', 'das MSB', ['das LSB', 'das Paritätsbit', 'das Stoppbit'], 'I²C und SPI senden das <b>MSB zuerst</b>, der UART das LSB.'],
      ['Wie wird bei SPI ein Teilnehmer ausgewählt?', 'über seine eigene CS-Leitung', ['über eine 7-Bit-Adresse', 'über eine MAC-Adresse', 'über das Startbit'], 'SPI hat keine Adressen – <b>Chip Select</b> auf 0 wählt den Subnode aus.'],
      ['Was bedeutet der Strich über <b>CS</b>?', 'Die Leitung ist low-aktiv', ['Die Leitung ist abgeschaltet', 'Die Leitung führt 12 V', 'Die Leitung ist optional'], 'Ausgewählt ist, wer <b>0 V</b> bekommt.'],
      ['Wofür steht <b>MISO</b>?', 'Main In, Subnode Out', ['Main Out, Subnode In', 'Master Input Serial Output Interface', 'Multiple Input Single Output'], 'Über MISO schickt der <b>Subnode Daten zum Main</b>.'],
      ['Was passiert bei SPI in jedem Takt?', 'Main und Subnode schieben gleichzeitig je ein Bit hinaus und herein', ['Nur der Main sendet ein Bit', 'Der Subnode sendet seine Adresse', 'Es wird ein Paritätsbit geprüft'], 'Zwei Schieberegister im Kreis – SPI ist <b>vollduplex</b>.'],
      ['Was ist der Nachteil der SPI-Daisy-Chain?', 'Der Zugriff auf einzelne Teilnehmer ist langsamer', ['Man braucht für jeden Teilnehmer eine CS-Leitung', 'Sie funktioniert nur mit einem Teilnehmer', 'Sie braucht Adressen'], 'Die Daten werden <b>durch alle</b> Schieberegister geschoben.'],
      ['Welcher Bus kommt mit nur zwei Leitungen (plus Masse) für viele Teilnehmer aus?', 'I²C', ['SPI', 'RS-232', 'Centronics'], 'I²C: SDA und SCL, Teilnehmer über <b>Adressen</b>.'],
      ['Was ist bei I²C, SPI und Ethernet gleich?', 'Alle übertragen seriell', ['Alle haben eine Taktleitung', 'Alle benutzen MAC-Adressen', 'Alle arbeiten mit ±12 V'], 'Alle drei sind <b>seriell</b> – Ethernet bringt den Takt im Leitungscode mit und adressiert mit MAC-Adressen.'],
    ]));
  }

  Dojo.create({
    mount: UI.$('#d-seriell'),
    pageId: 'ser-dojo',
    storeKey: 'seriell-belts',
    belts: [
      { id: 'weiss', name: 'Weißer Gürtel', topic: 'Seriell, parallel, Bus', gen: genGrund },
      { id: 'gelb', name: 'Gelber Gürtel', topic: 'RS-232', gen: genRs232 },
      { id: 'orange', name: 'Oranger Gürtel', topic: 'Übertragungsformat & Parität', gen: genFormat },
      { id: 'gruen', name: 'Grüner Gürtel', topic: 'Rechnen mit der Baudrate', gen: genBaud },
      { id: 'blau', name: 'Blauer Gürtel', topic: 'Mitschnitte dekodieren', gen: genDecode },
      { id: 'lila', name: 'Lila Gürtel', topic: 'I²C & SPI', gen: genBus },
    ],
    note: 'Zahlen darfst du mit Leerzeichen oder Komma eingeben, Hex-Werte mit oder ohne 0x. Der Fortschritt wird nur in diesem Browser gespeichert.',
  });
})();
