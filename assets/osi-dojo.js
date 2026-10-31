/* OSI-Modell · Station 3 – OSI-Dojo: Aufgaben-Generatoren (Mechanik in dojo-engine.js) */
'use strict';

(() => {
  const { LAYERS, layer } = OSI;
  const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const shuffle = a => [...a].sort(() => Math.random() - .5);
  const others = (l, key, k = 3) => shuffle(LAYERS.filter(x => x[key] !== l[key]).map(x => x[key])).slice(0, k);
  const isNum = n => x => Number(x.trim()) === n;

  // Weiß: Schichten und Nummern
  function genNames() {
    const l = layer(rnd(1, 7));
    const sol = `Schicht <b>${l.n}</b> = <b>${l.de}</b> = <b>${l.en}</b>.`;
    const v = rnd(0, 3);
    if (v === 0) return { q: `Welche <b>Nummer</b> hat die <b>${l.de}</b>?`, ph: '1 – 7', check: isNum(l.n), sol };
    if (v === 1) return { q: `Welche <b>Nummer</b> hat der <b>${l.en}</b>?`, ph: '1 – 7', check: isNum(l.n), sol };
    if (v === 2) return { q: `Wie heißt Schicht <b>${l.n}</b> auf <b>Englisch</b>?`, choices: shuffle([l.en, ...others(l, 'en')]), check: x => x === l.en, sol };
    return { q: `Wie heißt der <b>${l.en}</b> auf <b>Deutsch</b>?`, choices: shuffle([l.de, ...others(l, 'de')]), check: x => x === l.de, sol };
  }

  // Gelb: Merksatz
  const SENTENCE = LAYERS.map(l => l.word).join(' ');
  function genMnemonic() {
    const l = layer(rnd(1, 7));
    const sol = `<i>${SENTENCE}</i> wird <b>von Schicht 1 nach oben</b> gelesen: „${l.word}“ ist das ${l.n}. Wort → Schicht ${l.n}, <b>${l.de}</b> / ${l.en}.`;
    const v = rnd(0, 3);
    if (v === 0) return { q: `Für welche Schicht steht das Wort <b>„${l.word}“</b> im Merksatz?`, choices: shuffle([l.de, ...others(l, 'de')]), check: x => x === l.de, sol };
    if (v === 1) return { q: `Welches Wort des Merksatzes gehört zum <b>${l.en}</b>?`, choices: shuffle([l.word, ...others(l, 'word')]), check: x => x === l.word, sol };
    if (v === 2) return { q: `Für welche <b>Schichtnummer</b> steht <b>„${l.word}“</b>?`, ph: '1 – 7', check: isNum(l.n), sol };
    // Zwei Schichten mit P: der häufigste Stolperstein
    const [a, b] = shuffle([layer(1), layer(6)]);
    return {
      q: `Im Merksatz beginnen <b>„Please“</b> und <b>„Pizza“</b> mit P. Für welche Schicht steht <b>„${a.word}“</b>?`,
      choices: shuffle([a.de, b.de, layer(5).de, layer(7).de]), check: x => x === a.de,
      sol: `„Please“ ist das <b>erste</b> Wort → Schicht 1, Physikalische Schicht. „Pizza“ ist das <b>sechste</b> → Schicht 6, Präsentationsschicht.`,
    };
  }

  // Orange: Geräte und Protokolle
  const WHERE = [
    ['ein <b>Switch</b>', 2, 'Der Switch liest die <b>MAC-Adressen</b> im Frame – Schicht 2.'],
    ['ein <b>Router</b>', 3, 'Der Router wertet die <b>IP-Adressen</b> aus und sucht den Weg zwischen Netzen – Schicht 3.'],
    ['ein <b>Hub</b> oder Repeater', 1, 'Ein Hub verstärkt nur die Signale und gibt sie an alle Anschlüsse weiter, ohne Adressen zu lesen – Schicht 1.'],
    ['das <b>Netzwerkkabel</b> und der RJ45-Stecker', 1, 'Kabel, Stecker und Signale gehören zur Physikalischen Schicht – Schicht 1.'],
    ['die <b>MAC-Adresse</b>', 2, 'MAC-Adressen stehen im Header von Schicht 2 (Ethernet, WLAN).'],
    ['die <b>IP-Adresse</b> (IPv4 oder IPv6)', 3, 'IP-Adressen sind logische Adressen der Netzwerkschicht – Schicht 3.'],
    ['das Protokoll <b>TCP</b>', 4, 'TCP sorgt für eine zuverlässige Ende-zu-Ende-Verbindung – Transportschicht, Schicht 4.'],
    ['das Protokoll <b>UDP</b>', 4, 'UDP ist wie TCP ein Transportprotokoll – Schicht 4, nur ohne Bestätigungen.'],
    ['die <b>Portnummer</b> (z. B. 443)', 4, 'Ports adressieren das Programm auf dem Rechner – das steht im TCP- oder UDP-Header, Schicht 4.'],
    ['das Protokoll <b>HTTP</b>', 7, 'HTTP ist das Protokoll des Webbrowsers – Anwendungsschicht, Schicht 7.'],
    ['der Dienst <b>DNS</b> (Namensauflösung)', 7, 'DNS ist ein Dienst für Programme – Anwendungsschicht, Schicht 7.'],
    ['der Zeichensatz <b>UTF-8</b>', 6, 'Wie Zeichen dargestellt werden, regelt die Präsentationsschicht – Schicht 6.'],
    ['die <b>Verschlüsselung</b> der Daten', 6, 'Im OSI-Modell gehören Verschlüsselung und Kompression zur Darstellung – Präsentationsschicht, Schicht 6.'],
    ['das <b>Auf- und Abbauen einer Sitzung</b>', 5, 'Sitzungen steuern ist die Aufgabe der Sitzungsschicht – Schicht 5.'],
    ['die <b>Prüfsumme im Trailer</b> (FCS)', 2, 'Den Trailer mit der Prüfsumme hängt die Datensicherungsschicht an – Schicht 2.'],
    ['<b>Routing</b> – den Weg durch mehrere Netze finden', 3, 'Wegewahl ist die Aufgabe der Netzwerkschicht – Schicht 3.'],
  ];
  function genWhere() {
    const [what, n, why] = pick(WHERE);
    const l = layer(n);
    const sol = `${why} (${l.de} / ${l.en})`;
    if (rnd(0, 1)) return { q: `Auf welcher <b>Schicht</b> (Nummer) arbeitet ${what}?`, ph: '1 – 7', check: isNum(n), sol };
    return { q: `Zu welcher Schicht gehört ${what}?`, choices: shuffle([l.de, ...others(l, 'de')]), check: x => x === l.de, sol };
  }

  // Grün: Kapselung
  const PDU = [[7, 'Daten'], [4, 'Segment'], [3, 'Paket'], [2, 'Frame'], [1, 'Bits']];
  const ENC = [
    ['Welche Schicht hängt zusätzlich zum Header einen <b>Trailer</b> an?', layer(2).de, [layer(1).de, layer(3).de, layer(4).de], 'Nur die <b>Datensicherungsschicht</b> (2) hängt hinten einen Trailer mit der Prüfsumme (FCS) an.'],
    ['In welcher Reihenfolge durchläuft eine Nachricht beim <b>Sender</b> die Schichten?', 'von Schicht 7 nach Schicht 1', ['von Schicht 1 nach Schicht 7', 'nur Schicht 7 und Schicht 1', 'in beliebiger Reihenfolge'], 'Beim Sender geht es <b>von oben nach unten</b> (7 → 1), jede Schicht setzt ihren Header davor.'],
    ['In welcher Reihenfolge durchläuft eine Nachricht beim <b>Empfänger</b> die Schichten?', 'von Schicht 1 nach Schicht 7', ['von Schicht 7 nach Schicht 1', 'nur Schicht 7', 'in beliebiger Reihenfolge'], 'Beim Empfänger geht es <b>von unten nach oben</b> (1 → 7), jede Schicht entfernt ihren Header.'],
    ['Welchen Header liest der Empfänger als <b>ersten</b>?', 'den Header von Schicht 2', ['den Header von Schicht 7', 'den Header von Schicht 4', 'den Header von Schicht 3'], 'Der äußerste Umschlag wird zuerst geöffnet: Schicht 2 (MAC-Adressen) steht ganz vorne im Frame.'],
    ['Was macht der Empfänger mit dem Header einer Schicht, nachdem er ihn gelesen hat?', 'Er entfernt ihn und reicht den Rest nach oben', ['Er schickt ihn an den Sender zurück', 'Er setzt einen neuen Header davor', 'Er reicht ihn unverändert nach oben'], 'Das ist die <b>Entkapselung</b>: lesen, auswerten, entfernen, nach oben reichen.'],
    ['Für wen ist der Header bestimmt, den die Transportschicht des Senders schreibt?', 'für die Transportschicht des Empfängers', ['für die Anwendungsschicht des Empfängers', 'für jeden Router unterwegs', 'für die Netzwerkschicht des Senders'], 'Jeder Header ist für die <b>Partnerschicht</b> auf der Gegenseite – hier die Transportschicht des Empfängers.'],
    ['Wie nennt man es, wenn jede Schicht beim Sender ihren Header davorsetzt?', 'Kapselung', ['Entkapselung', 'Routing', 'Segmentierung'], '<b>Kapselung</b> (Encapsulation): Die Daten von oben werden in einen neuen „Umschlag“ gepackt.'],
    ['Setzt die Physikalische Schicht (1) einen eigenen Header davor?', 'Nein, sie wandelt nur Bits in Signale um', ['Ja, den Header H1', 'Ja, einen Trailer', 'Nur bei WLAN'], 'Schicht 1 überträgt nur Bits als Spannung, Licht oder Funk – einen Header im OSI-Sinn setzt sie nicht.'],
  ];
  function genEncaps() {
    if (rnd(0, 2) === 0) {
      const [n, name] = pick(PDU);
      const l = layer(n);
      return {
        q: `Wie heißt die Dateneinheit auf <b>Schicht ${n}</b> (${l.de})?`,
        choices: shuffle(PDU.map(p => p[1])).slice(0, 5),
        check: x => x === name,
        sol: `Von oben nach unten: Daten (7–5) → <b>Segment</b> (4) → <b>Paket</b> (3) → <b>Frame</b> (2) → <b>Bits</b> (1). Auf Schicht ${n}: <b>${name}</b>.`,
      };
    }
    const [q, right, wrong, sol] = pick(ENC);
    return { q, choices: shuffle([right, ...wrong]), check: x => x === right, sol };
  }

  Dojo.create({
    mount: UI.$('#d-osi'),
    pageId: 'osi-dojo',
    storeKey: 'osi-belts',
    belts: [
      { id: 'weiss', name: 'Weißer Gürtel', topic: 'Schichten & Nummern', gen: genNames },
      { id: 'gelb', name: 'Gelber Gürtel', topic: 'Merksatz', gen: genMnemonic },
      { id: 'orange', name: 'Oranger Gürtel', topic: 'Geräte & Protokolle', gen: genWhere },
      { id: 'gruen', name: 'Grüner Gürtel', topic: 'Kapselung', gen: genEncaps },
    ],
    note: 'Gezählt wird von unten: Schicht 1 ist das Kabel. Der Fortschritt wird nur in diesem Browser gespeichert.',
  });
})();
