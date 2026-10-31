/* OSI-Modell · Stationen 1–2: Merksatz-Puzzle, Kapselung beim Sender und Empfänger */
'use strict';

// Die sieben Schichten, Index 0 = Schicht 1. Wird auch vom OSI-Dojo benutzt.
const OSI = (() => {
  const LAYERS = [
    { n: 1, de: 'Physikalische Schicht', en: 'Physical Layer', word: 'Please', pdu: 'Bits' },
    { n: 2, de: 'Datensicherungsschicht', en: 'Data Link Layer', word: 'Do', pdu: 'Frame' },
    { n: 3, de: 'Netzwerkschicht', en: 'Network Layer', word: 'Not', pdu: 'Paket' },
    { n: 4, de: 'Transportschicht', en: 'Transport Layer', word: 'Throw', pdu: 'Segment' },
    { n: 5, de: 'Sitzungsschicht', en: 'Session Layer', word: 'Salami', pdu: 'Daten' },
    { n: 6, de: 'Präsentationsschicht', en: 'Presentation Layer', word: 'Pizza', pdu: 'Daten' },
    { n: 7, de: 'Anwendungsschicht', en: 'Application Layer', word: 'Away', pdu: 'Daten' },
  ];
  const layer = n => LAYERS[n - 1];
  return { LAYERS, layer };
})();

(() => {
  const { $, esc } = UI;
  const { LAYERS, layer } = OSI;
  const TOP_DOWN = [...LAYERS].reverse();
  const first = s => `<b class="osi-init">${esc(s[0])}</b>${esc(s.slice(1))}`;
  const shuffle = a => {
    const r = [...a];
    for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; }
    return r;
  };

  /* ---------- Station 1: Merksatz-Puzzle ----------
     Die Schichtnamen stehen fest, die sieben Wörter des Merksatzes werden ohne Vorlage zugeordnet:
     Kärtchen anklicken (oder ziehen) und in die Zeile einer Schicht setzen.
     Erst wenn alles stimmt, werden die Anfangsbuchstaben in der Farbe ihrer Schicht eingefärbt. */
  (function puzzle() {
    const el = $('#osi-pz');
    let place = {};   // Schicht → Schicht, deren Wort dort liegt
    let sel = null;   // ausgewähltes Wort (Schichtnummer)
    let checked = false;
    let pool = [];

    const chip = (n, where) => `<button type="button" class="osi-chip${sel === n ? ' sel' : ''}" draggable="true" data-n="${n}" data-where="${where}">${first(layer(n).word)}</button>`;

    function render() {
      const solved = LAYERS.every(l => place[l.n] === l.n);
      el.classList.toggle('solved', solved);
      // Der Satz wächst mit: von Schicht 1 nach oben gelesen
      const sentence = LAYERS.map(l => place[l.n] != null
        ? `<span class="osi-c${l.n}">${first(layer(place[l.n]).word)}</span>`
        : '<span class="osi-gap">___</span>').join(' ');
      el.innerHTML = `
        <div class="osi-pz-board">
          <div class="osi-pz-head"><span>Nr.</span><span>Deutsch</span><span>Englisch</span><span>Wort im Merksatz</span></div>
          ${TOP_DOWN.map(l => {
            const n = place[l.n];
            const st = checked && n != null ? (n === l.n ? ' ok' : ' bad') : '';
            return `
            <div class="osi-pz-row osi-c${l.n}" data-n="${l.n}">
              <span class="osi-num">${l.n}</span>
              <span class="osi-pz-name">${first(l.de)}</span>
              <span class="osi-pz-name en">${first(l.en)}</span>
              <span class="osi-slot${st}">${n != null ? chip(n, l.n) : '<i>…</i>'}</span>
            </div>`;
          }).join('')}
        </div>
        <div class="osi-pool"><small>Wörter</small>
          ${pool.filter(n => !Object.values(place).includes(n)).map(n => chip(n, 'pool')).join('') || '<em class="muted">alle eingesetzt</em>'}
        </div>
        <p class="osi-pz-live"><small>Dein Satz, von Schicht 1 nach oben gelesen</small>${sentence}</p>
        <div class="osi-pz-fb" aria-live="polite">${feedback(solved)}</div>
        <div class="row-actions">
          <button type="button" class="btn primary" data-act="check">Prüfen</button>
          <button type="button" class="btn" data-act="mix">Neu mischen</button>
          <button type="button" class="btn ghost" data-act="solve">Lösung zeigen</button>
        </div>`;
      return solved;
    }

    function feedback(solved) {
      if (solved) return '<p class="osi-pz-done">Richtig! Die Anfangsbuchstaben der Wörter sind genau die Anfangsbuchstaben der Schichtnamen – auf Deutsch <b>und</b> auf Englisch. Ein Satz für beide Sprachen.</p>';
      if (!checked) return '';
      const filled = Object.keys(place).length;
      const right = LAYERS.filter(l => place[l.n] === l.n).length;
      return `<p>${right} von 7 Wörtern sitzen richtig${filled < 7 ? ` – ${7 - filled} fehlen noch` : ''}. Die falschen sind rot markiert.</p>`;
    }

    function mix() {
      pool = shuffle(LAYERS.map(l => l.n));
      place = {}; sel = null; checked = false;
      render();
    }

    function drop(n, row) {
      // Ein Wort kann nur an einer Stelle liegen; ein schon belegter Platz gibt sein Wort frei
      for (const r of Object.keys(place)) if (place[r] === n) delete place[r];
      place[row] = n;
      sel = null; checked = false;
      render();
    }

    el.addEventListener('click', e => {
      const act = e.target.closest('[data-act]')?.dataset.act;
      if (act === 'mix') return mix();
      if (act === 'solve') {
        LAYERS.forEach(l => { place[l.n] = l.n; });
        sel = null; checked = true;
        return render();
      }
      if (act === 'check') {
        checked = true;
        if (render()) FX.celebrate($('.osi-pz-live', el));
        return;
      }
      const c = e.target.closest('.osi-chip');
      if (c && c.dataset.where !== 'pool') {
        delete place[c.dataset.where];
        checked = false;
        return render();
      }
      if (c) {
        const n = Number(c.dataset.n);
        sel = sel === n ? null : n;
        return render();
      }
      const row = e.target.closest('.osi-pz-row');
      if (row && sel != null) drop(sel, Number(row.dataset.n));
    });

    el.addEventListener('dragstart', e => {
      const c = e.target.closest('.osi-chip');
      if (!c) return;
      e.dataTransfer.setData('text/plain', c.dataset.n);
      e.dataTransfer.effectAllowed = 'move';
    });
    el.addEventListener('dragover', e => {
      if (e.target.closest('.osi-pz-row')) e.preventDefault();
    });
    el.addEventListener('drop', e => {
      const row = e.target.closest('.osi-pz-row');
      const n = Number(e.dataTransfer.getData('text/plain'));
      if (!row || !n) return;
      e.preventDefault();
      drop(n, Number(row.dataset.n));
    });

    mix();
  })();

  /* ---------- Station 2: Daten auf Reisen ----------
     Schritt 0: Nachricht steht bereit · 1–7: Sender Schicht 7 → 1 · 8: Bits über das Kabel ·
     9–15: Empfänger Schicht 1 → 7. Jede Schicht zeigt die Dateneinheit, so wie sie auf dieser Schicht aussieht –
     beim Sender und beim Empfänger dieselbe (Partnerschichten). */
  (function flow() {
    const el = $('#osi-flow');
    const say = $('#osi-say');
    const input = $('#osi-msg');
    const LAST = 15;
    let s = 0;
    let timer = 0;

    const sendStep = n => 8 - n;  // Schritt, in dem der Sender Schicht n bearbeitet
    const recvStep = n => 8 + n;
    const msg = () => input.value || ' ';
    const bits = () => [...new TextEncoder().encode(msg())].map(b => b.toString(2).padStart(8, '0'));

    const HEAD = {
      7: 'Anwendungs-Header: z. B. welcher Dienst (HTTP-Anfrage „GET“)',
      6: 'Präsentations-Header: Zeichensatz (UTF-8), Format, verschlüsselt ja/nein',
      5: 'Sitzungs-Header: zu welcher Sitzung die Daten gehören',
      4: 'Transport-Header (TCP/UDP): Quell- und Ziel-Port, Folgenummer',
      3: 'Netzwerk-Header (IP): Quell- und Ziel-IP-Adresse, TTL',
      2: 'Datensicherungs-Header (Ethernet): Ziel- und Quell-MAC-Adresse',
    };

    // Dateneinheit auf Schicht n: Header von außen (H2) nach innen (H7), dann Daten, dann T2
    function pdu(n, mark) {
      if (n === 1) {
        const b = bits();
        const shown = b.slice(0, 3).join(' ') + (b.length > 3 ? ' …' : '');
        return `<span class="osi-bits${mark ? ' new' : ''}" title="Die Bits des ganzen Frames – hier nur der Anfang der Nachricht">${shown}</span>`;
      }
      let h = '';
      for (let k = Math.max(n, 2); k <= 7; k++) h += `<i class="osi-blk osi-c${k}${mark && k === n ? ' ' + mark : ''}" title="${HEAD[k]}">H${k}</i>`;
      h += `<i class="osi-blk osi-data" title="Die Nachricht selbst">${esc(msg())}</i>`;
      if (n === 2) h += `<i class="osi-blk osi-c2${mark ? ' ' + mark : ''}" title="Trailer: Prüfsumme (FCS)">T2</i>`;
      return h;
    }

    const stack = side => `
      <div class="osi-side osi-${side}">
        <div class="osi-dev"><span class="osi-dev-ico">${side === 'tx' ? '💻' : '🖥️'}</span><b>${side === 'tx' ? 'Sender' : 'Empfänger'}<small>${side === 'tx' ? 'packt ein: 7 → 1 ↓' : 'packt aus: 1 → 7 ↑'}</small></b>
          <span class="osi-app" data-app="${side}"></span></div>
        ${TOP_DOWN.map(l => `
          <div class="osi-row osi-c${l.n}" data-l="${l.n}">
            <div class="osi-lay"><span class="osi-num">${l.n}</span><span><b>${l.de}</b><small>${l.en}</small></span></div>
            <div class="osi-pdu"></div>
            <small class="osi-pduname">${l.pdu}</small>
          </div>`).join('')}
      </div>`;

    el.innerHTML = `${stack('tx')}
      <div class="osi-peer" aria-hidden="true">${TOP_DOWN.map(l => `<i class="osi-c${l.n}" data-l="${l.n}"></i>`).join('')}</div>
      ${stack('rx')}
      <div class="osi-cable"><span class="osi-cable-lbl">Übertragungsmedium: Kabel, Glasfaser oder Funk</span><span class="osi-stream"></span></div>`;

    const row = (side, n) => $(`.osi-${side} .osi-row[data-l="${n}"]`, el);

    function text() {
      const m = `„${esc(msg())}“`;
      if (s === 0) return `Der Sender tippt in seinem Programm die Nachricht ${m}. Klicke auf <b>Nächster Schritt</b>, um sie auf die Reise zu schicken.`;
      if (s <= 7) {
        const n = 8 - s;
        const l = layer(n);
        if (n === 7) return `<b>Sender · Schicht 7 – ${l.de}:</b> Das Programm übergibt ${m}. Die Anwendungsschicht setzt den Header <b>H7</b> davor. ${HEAD[7]}.`;
        if (n === 2) return `<b>Sender · Schicht 2 – ${l.de}:</b> Vorne kommt <b>H2</b> mit den MAC-Adressen dazu, hinten der <b>Trailer T2</b> mit der Prüfsumme. Daten mit Header und Trailer heißen jetzt <b>Frame</b> (Rahmen).`;
        if (n === 1) return `<b>Sender · Schicht 1 – ${l.de}:</b> Der ganze Frame wird zu Bits. Schicht 1 setzt keinen Header – sie macht aus jedem Bit ein Signal: Spannung, Lichtpuls oder Funkwelle. Hier die ersten Bits der Nachricht.`;
        return `<b>Sender · Schicht ${n} – ${l.de}:</b> Die Daten von Schicht ${n + 1} werden zur Nutzlast, davor kommt der Header <b>H${n}</b>. ${HEAD[n]}.${n === 4 ? ' Ab hier heißt die Dateneinheit <b>Segment</b>.' : n === 3 ? ' Jetzt ist es ein <b>Paket</b>.' : ''}`;
      }
      if (s === 8) return `<b>Übertragung:</b> Nur Schicht 1 ist wirklich mit der Gegenseite verbunden. Die Bits laufen über das Kabel zum Empfänger – ${bits().length * 8} Bit Nachricht plus alle Header und der Trailer.`;
      const n = s - 8;
      const l = layer(n);
      if (n === 1) return `<b>Empfänger · Schicht 1 – ${l.de}:</b> Die Signale werden wieder zu Bits und als Frame an Schicht 2 übergeben.`;
      if (n === 2) return `<b>Empfänger · Schicht 2 – ${l.de}:</b> Ist die Ziel-MAC meine? Stimmt die Prüfsumme im Trailer? Wenn ja, werden <b>H2</b> und <b>T2</b> entfernt und das Paket geht nach oben.`;
      if (n === 7) return `<b>Empfänger · Schicht 7 – ${l.de}:</b> Der letzte Header <b>H7</b> wird gelesen und entfernt. Übrig bleibt genau das, was der Sender geschrieben hat: ${m}. Angekommen!`;
      return `<b>Empfänger · Schicht ${n} – ${l.de}:</b> Die Schicht liest ihren Header <b>H${n}</b> – genau den, den die Schicht ${n} des Senders geschrieben hat – entfernt ihn und reicht den Rest nach oben.`;
    }

    function render() {
      for (const l of LAYERS) {
        const n = l.n;
        const tx = row('tx', n), rx = row('rx', n);
        const txOn = s >= sendStep(n), rxOn = s >= recvStep(n);
        tx.classList.toggle('on', txOn);
        tx.classList.toggle('cur', s === sendStep(n));
        rx.classList.toggle('on', rxOn);
        rx.classList.toggle('cur', s === recvStep(n));
        $('.osi-pdu', tx).innerHTML = txOn ? pdu(n, s === sendStep(n) ? 'new' : '') : '';
        $('.osi-pdu', rx).innerHTML = rxOn ? pdu(n, s === recvStep(n) ? 'gone' : '') : '';
        $(`.osi-peer i[data-l="${n}"]`, el).classList.toggle('on', rxOn && n > 1);
      }
      $('[data-app="tx"]', el).innerHTML = `✉ ${esc(msg())}`;
      $('[data-app="rx"]', el).innerHTML = s === LAST ? `✉ ${esc(msg())}` : '';
      $('[data-app="rx"]', el).classList.toggle('got', s === LAST);
      const cable = $('.osi-cable', el);
      cable.classList.toggle('run', s === 8);
      cable.classList.toggle('done', s > 8);
      $('.osi-stream', el).textContent = s >= 8 ? bits().join(' ') : '';
      say.innerHTML = `<p><span class="osi-stepno">${s} / ${LAST}</span>${text()}</p>`;
      $('#osi-step').disabled = s === LAST;
      input.disabled = s > 0;
    }

    function stop() {
      clearInterval(timer); timer = 0;
      $('#osi-go').textContent = '▶ Automatisch abspielen';
    }
    function step() {
      if (s < LAST) s++;
      if (s === LAST) stop();
      render();
    }

    $('#osi-step').addEventListener('click', () => { stop(); step(); });
    $('#osi-reset').addEventListener('click', () => { stop(); s = 0; render(); });
    $('#osi-go').addEventListener('click', () => {
      if (timer) return stop();
      if (s === LAST) s = 0;
      $('#osi-go').textContent = '❚❚ Anhalten';
      render();
      timer = setInterval(step, FX.calm.matches ? 2600 : 1900);
    });
    input.addEventListener('input', render);
    document.addEventListener('pagechange', e => { if (e.detail !== 'osi-kapselung') stop(); });

    render();
  })();
})();
