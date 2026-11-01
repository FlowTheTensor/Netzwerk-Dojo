/* Serielle Schnittstellen · Stationen 1–3: seriell/parallel, Bus, RS-232, UART-Telegramm, Parität, Mitschnitt */
'use strict';

// Rechenkern – auch fürs Seriell-Dojo
const SERIELL = (() => {
  const bin = (n, w = 8) => n.toString(2).padStart(w, '0');
  const hex = n => '0x' + n.toString(16).toUpperCase().padStart(2, '0');
  const ones = bits => [...bits].filter(b => b === '1').length;
  // E: Einsen inkl. Paritätsbit gerade · O: ungerade · M: immer 1 · S: immer 0
  const parityBit = (bits, p) => ({ E: ones(bits) % 2, O: 1 - ones(bits) % 2, M: 1, S: 0 }[p]);
  const PARITY = { N: 'keine Parität', E: 'gerade Parität (Even)', O: 'ungerade Parität (Odd)', M: 'Parität immer 1 (Mark)', S: 'Parität immer 0 (Space)' };
  // „8N1“ → { n: 8, p: 'N', s: 1 }
  function parseFmt(t) {
    const m = String(t).trim().toUpperCase().replace(',', '.').match(/^([5-9])([NEOMS])(1|1\.5|2)$/);
    return m ? { n: Number(m[1]), p: m[2], s: Number(m[3]) } : null;
  }
  const frameBits = ({ n, p, s }) => 1 + n + (p === 'N' ? 0 : 1) + s;
  // Telegramm als Liste von Bits: Start, Daten (LSB zuerst), Parität, Stopp
  function frame(code, { n = 8, p = 'N', s = 1 } = {}) {
    const data = bin(code, n).slice(-n);
    const out = [{ v: 0, t: 'start' }];
    [...data].reverse().forEach((b, i) => out.push({ v: Number(b), t: 'data', i }));
    if (p !== 'N') out.push({ v: parityBit(data, p), t: 'par' });
    for (let k = 0; k < Math.ceil(s); k++) out.push({ v: 1, t: 'stop' });
    return out;
  }
  const PINS = [
    [1, 'DCD', 'Data Carrier Detect', 'in', 'Das Modem meldet: Die Verbindung zur Gegenstelle steht.'],
    [2, 'RXD', 'Receive Data', 'in', 'Hier kommen die <b>Daten</b> an.'],
    [3, 'TXD', 'Transmit Data', 'out', 'Hierüber werden die <b>Daten</b> gesendet.'],
    [4, 'DTR', 'Data Terminal Ready', 'out', 'Der PC meldet: Ich bin eingeschaltet und bereit.'],
    [5, 'GND', 'Ground', '', 'Die gemeinsame <b>Masse</b> – der Bezugspunkt für alle Spannungen. Ohne sie geht nichts.'],
    [6, 'DSR', 'Data Set Ready', 'in', 'Das Modem meldet: Ich bin bereit.'],
    [7, 'RTS', 'Request To Send', 'out', 'Der PC fragt: Darf ich senden? (Hardware-Flusssteuerung)'],
    [8, 'CTS', 'Clear To Send', 'in', 'Die Gegenstelle antwortet: Du darfst senden.'],
    [9, 'RI', 'Ring Indicator', 'in', 'Das Modem meldet: Das Telefon klingelt – ein Anruf kommt herein.'],
  ];
  return { bin, hex, ones, parityBit, PARITY, parseFmt, frameBits, frame, PINS };
})();

(() => {
  const { $, $$, esc } = UI;
  const { bin, hex, ones, parityBit, PARITY, parseFmt, frameBits, frame, PINS } = SERIELL;
  const fmt = n => String(n).replace(/\B(?=(\d{3})+$)/g, ' ');
  const dec = (x, d = 1) => (Math.round(x * 10 ** d) / 10 ** d).toString().replace('.', ',');
  const codeOf = inp => (inp.value || ' ').charCodeAt(0);
  const show = c => (c === 32 ? 'Leerzeichen' : c === 10 ? 'Zeilenvorschub (LF)' : c === 13 ? 'Wagenrücklauf (CR)' : `„${esc(String.fromCharCode(c))}“`);

  // Stufenkurve wie bei den Leitungscodes: vals[i] gilt von x0 + i·step bis x0 + (i+1)·step
  function steps(vals, x0, step, y) {
    let d = `M${x0} ${y(vals[0])}`;
    vals.forEach((v, i) => {
      if (i && v !== vals[i - 1]) d += `V${y(v)}`;
      d += `H${x0 + (i + 1) * step}`;
    });
    return d;
  }

  /* ---------- Station 1: seriell gegen parallel ---------- */
  (function par() {
    const ch = $('#sr-par-ch');
    const skew = $('#sr-par-skew');
    // Laufzeit jeder Leitung in Bitzeiten bei sehr hohem Takt
    const DELAY = [0.3, 0.9, 1.4, 0.5, 1.25, 0.7, 1.6, 0.4];
    let s = 0;
    const cell = (b, cls = '') => `<span class="sr-cell ${cls}">${b}</span>`;
    function render(k) {
      s = k;
      const code = codeOf(ch) & 255;
      const b = bin(code);                       // b[0] = MSB
      const bit = i => b[7 - i];                 // Bit mit Stellenwert 2^i
      const late = i => skew.checked && DELAY[i] > 1;
      // Seriell: LSB zuerst, nach k Takten sind Bit 0 … k−1 da
      const sent = i => i < k;
      const ser = `
        <div class="sr-par-box"><h3>Seriell · 1 Datenleitung</h3>
          <div class="sr-ser">
            <div><small>Sender</small><div class="sr-cells">${[7, 6, 5, 4, 3, 2, 1, 0].map(i => cell(bit(i), sent(i) ? 'gone' : '')).join('')}</div></div>
            <div class="sr-wire">${k > 0 && k <= 8 ? `<span class="sr-chip">${bit(k - 1)}</span>` : ''}</div>
            <div><small>Empfänger</small><div class="sr-cells">${[7, 6, 5, 4, 3, 2, 1, 0].map(i => (sent(i) ? cell(bit(i), 'got') : cell('·', 'empty'))).join('')}</div></div>
          </div>
          <p class="sr-par-n">${k} von 8 Bit angekommen</p>
        </div>`;
      const rows = [7, 6, 5, 4, 3, 2, 1, 0].map(i => {
        const arrived = k >= 1 && !late(i);
        // Zu spät: Der Empfänger hat noch den alten Pegel 0 gelesen – zufällig richtig, wenn das Bit 0 war
        const recv = k === 0 ? cell('·', 'empty') : arrived || bit(i) === '0' ? cell(bit(i), 'got') : cell('0', 'bad');
        return `<div class="sr-prow"><small>D${i}</small>${cell(bit(i), k >= 1 ? 'gone' : '')}<div class="sr-wire">${k === 1 && late(i) ? `<span class="sr-chip late">${bit(i)}</span>` : ''}</div>${recv}</div>`;
      }).join('');
      const got = k >= 1 ? [7, 6, 5, 4, 3, 2, 1, 0].map(i => (late(i) ? '0' : bit(i))).join('') : '';
      const lateN = DELAY.filter((_, i) => late(i)).length;
      const p = `
        <div class="sr-par-box"><h3>Parallel · 8 Datenleitungen</h3>
          <div class="sr-pgrid">${rows}</div>
          <p class="sr-par-n">${k === 0 ? '0 von 8 Bit angekommen' : lateN ? `Byte nach Takt 1 übernommen – ${lateN} Bit kamen zu spät` : '8 von 8 Bit nach einem Takt'}</p>
        </div>`;
      $('#sr-par').innerHTML = ser + p;
      const name = show(code);
      let t;
      if (k === 0) t = `${name} hat den Code ${code} = <code>${b}</code>. Beide Sender sind bereit.`;
      else if (skew.checked) {
        t = `Bei sehr hohem Takt sind die Leitungen nicht alle gleich schnell (Laufzeitunterschiede). Der parallele Empfänger übernimmt das Byte am Ende von Takt 1 und liest <code>${got}</code>${got === b ? ' – Glück gehabt' : ` statt <code>${b}</code> – <b>falsches Zeichen</b>`}. Die serielle Leitung hat dieses Problem nicht: Alle Bits laufen über denselben Draht und sind gleich schnell.`;
      } else if (k < 8) t = `Takt ${k}: Parallel ist das ganze Zeichen schon nach <b>einem</b> Takt da. Seriell sind erst ${k} Bit angekommen – das niederwertigste (LSB) zuerst, so wie beim UART.`;
      else t = `Nach 8 Takten ist das Zeichen auch seriell komplett: <code>${b}</code>. Bei gleichem Takt ist parallel also 8-mal so schnell. Aber eine einzelne Leitung lässt sich <b>viel höher takten</b> – schalte unten den hohen Takt ein.`;
      $('#sr-par-txt').innerHTML = `<p>${t}</p>`;
    }
    const st = DIENSTE.stepper({ last: 8, render, step: $('#sr-par-step'), go: $('#sr-par-go'), reset: $('#sr-par-reset'), page: 'ser-grundlagen' });
    ch.addEventListener('input', () => render(s));
    skew.addEventListener('change', () => (s ? render(s) : st.restart()));
  })();

  /* ---------- Station 1: Richtung und Bus ---------- */
  (function dir() {
    const box = (x, y, h, txt) => `<rect x="${x}" y="${y}" width="44" height="${h}" rx="6" class="sr-box"/><text x="${x + 22}" y="${y + h / 2 + 4}" class="sr-btxt" text-anchor="middle">${txt}</text>`;
    const arr = (x1, y1, x2, y2, cls = '') => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="sr-ln ${cls}" marker-end="url(#sr-ah)"/>`;
    let ser = box(10, 20, 150, 'PC') + box(246, 20, 150, 'PC');
    ser += `<path d="M54 50 H110 L200 80 H246" class="sr-ln"/><polygon points="246,80 238,76 238,84" class="sr-ahf"/>`;
    ser += `<path d="M246 50 H200 L110 80 H54" class="sr-ln"/><polygon points="54,80 62,76 62,84" class="sr-ahf"/>`;
    ser += `<text x="58" y="44" class="sr-small">TXD</text><text x="58" y="96" class="sr-small">RXD</text><text x="242" y="44" class="sr-small" text-anchor="end">TXD</text><text x="242" y="96" class="sr-small" text-anchor="end">RXD</text>`;
    ser += `<path d="M54 145 H246" class="sr-ln gnd"/><text x="150" y="139" class="sr-small" text-anchor="middle">GND</text>`;
    let par = box(10, 20, 150, 'Sender') + box(246, 20, 150, 'Drucker');
    for (let i = 0; i < 8; i++) par += arr(54, 34 + i * 12, 244, 34 + i * 12);
    par += `<text x="150" y="26" class="sr-small" text-anchor="middle">8 Datenleitungen D0 … D7</text>`;
    par += arr(54, 136, 244, 136, 'dash') + arr(246, 150, 56, 150, 'dash');
    par += `<text x="150" y="166" class="sr-small" text-anchor="middle">Steuerleitungen</text>`;
    const defs = '<defs><marker id="sr-ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0 L10 5 L0 10 z" class="sr-ahf"/></marker></defs>';
    const svg = (h, t) => `<figure><svg viewBox="0 0 300 ${h}" class="sr-svg" style="max-width:400px;margin:0 auto">${defs}${t}</svg></figure>`;
    $('#sr-dir').innerHTML = `
      <div><h3>Prinzip seriell – bidirektional</h3>${svg(180, ser)}<p class="note">Jede Seite sendet auf TXD und empfängt auf RXD. Die Leitungen werden gekreuzt, beide Richtungen gleichzeitig: <b>vollduplex</b>.</p></div>
      <div><h3>Prinzip parallel – unidirektional</h3>${svg(180, par)}<p class="note">Die 8 Datenleitungen gehen nur in eine Richtung. Über Steuerleitungen meldet der Drucker zurück, ob er bereit ist.</p></div>`;

    // KNX-Bus aus dem Arbeitsblatt
    const dev = (x, y, icon, name, up) => `<g><line x1="${x}" y1="${up ? y + 34 : y}" x2="${x}" y2="${up ? 122 : 150}" class="sr-ln knx"/>${up ? `<line x1="${x + 10}" y1="${y + 34}" x2="${x + 10}" y2="96" class="sr-ln pwr"/>` : ''}<rect x="${x - 26}" y="${y}" width="52" height="34" rx="6" class="sr-box"/><text x="${x}" y="${y + 23}" text-anchor="middle" class="sr-ico">${icon}</text><text x="${x}" y="${up ? y - 6 : y + 50}" text-anchor="middle" class="sr-small">${name}</text></g>`;
    let k = `<line x1="20" y1="96" x2="560" y2="96" class="sr-ln pwr"/><text x="566" y="100" class="sr-small">230 V</text>`;
    k += `<line x1="20" y1="122" x2="560" y2="122" class="sr-ln knx"/><line x1="20" y1="150" x2="560" y2="150" class="sr-ln knx"/><text x="566" y="140" class="sr-small knx-t">KNX</text>`;
    k += dev(90, 44, '💡', 'Leuchte', true) + dev(290, 44, '🪟', 'Jalousie', true) + dev(490, 44, '♨', 'Heizung', true);
    k += dev(90, 172, '🌡', 'Thermostat', false) + dev(290, 172, '🌬', 'Windmesser', false) + dev(490, 172, '☀', 'Helligkeit', false);
    k += `<text x="20" y="16" class="sr-small strong">Aktoren (führen aus)</text><text x="20" y="244" class="sr-small strong">Sensoren (geben Befehle)</text>`;
    $('#sr-knx').innerHTML = `<div class="tp-wrap"><svg viewBox="0 0 610 250" class="sr-svg" style="min-width:480px;max-width:720px;margin:0 auto">${k}</svg></div>`;
  })();

  /* ---------- Station 2: DE-9-Stecker ---------- */
  (function de9() {
    const out = $('#sr-pin-info');
    const data = $('#sr-pin-data');
    let sel = 3;
    const pos = n => (n <= 5 ? [70 + (n - 1) * 45, 62] : [92 + (n - 6) * 45, 112]);
    function render() {
      let h = `<path d="M30 30 H290 L262 136 H58 Z" class="sr-de9" />`;
      PINS.forEach(([n, ab]) => {
        const [x, y] = pos(n);
        const isData = [2, 3, 5].includes(n);
        const cls = ['sr-pin', n === sel ? 'sel' : '', data.checked ? (isData ? 'data' : 'dim') : ''].join(' ');
        h += `<g class="${cls}" data-pin="${n}" role="button" tabindex="0" aria-label="Pin ${n} ${ab}"><circle cx="${x}" cy="${y}" r="15"/><text x="${x}" y="${y + 5}" text-anchor="middle">${n}</text><text x="${x}" y="${n <= 5 ? y - 22 : y + 38}" text-anchor="middle" class="sr-pin-ab">${ab}</text></g>`;
      });
      $('#sr-de9').innerHTML = `<svg viewBox="0 0 320 160" class="sr-svg sr-de9-svg">${h}</svg>`;
      const [n, ab, name, d, txt] = PINS[sel - 1];
      out.innerHTML = `<p class="sr-pin-big">Pin ${n} · <b>${ab}</b></p><p class="muted">${name}</p><p>${txt}</p><p class="sr-pin-dir">${d === 'out' ? '→ Ausgang am PC' : d === 'in' ? '← Eingang am PC' : 'Bezugspotenzial'}</p>`;
    }
    $('#sr-de9').addEventListener('click', e => { const g = e.target.closest('[data-pin]'); if (g) { sel = Number(g.dataset.pin); render(); } });
    $('#sr-de9').addEventListener('keydown', e => {
      const g = e.target.closest('[data-pin]');
      if (g && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); sel = Number(g.dataset.pin); render(); $(`[data-pin="${sel}"]`, $('#sr-de9')).focus(); }
    });
    data.addEventListener('change', render);
    render();
  })();

  /* ---------- Station 2: Pegel UART gegen RS-232 ---------- */
  (function lvl() {
    const inp = $('#sr-lvl-ch');
    function render() {
      const code = codeOf(inp) & 255;
      const vals = [1, ...frame(code).map(b => b.v), 1];
      const N = vals.length, X0 = 160, BW = 40, W = X0 + N * BW + 16;
      let h = '';
      for (let i = 0; i <= N; i++) h += `<line x1="${X0 + i * BW}" x2="${X0 + i * BW}" y1="14" y2="226" class="kb-grid"/>`;
      vals.forEach((v, i) => { h += `<text x="${X0 + (i + .5) * BW}" y="12" class="kb-bit" text-anchor="middle">${v}</text>`; });
      h += `<text x="8" y="50" class="kb-lbl">UART</text><text x="8" y="66" class="kb-sub">Logikpegel</text>`;
      h += `<text x="${X0 - 6}" y="34" class="kb-sub" text-anchor="end">5 V</text><text x="${X0 - 6}" y="82" class="kb-sub" text-anchor="end">0 V</text>`;
      h += `<path d="${steps(vals, X0, BW, v => (v ? 30 : 78))}" class="kb-sig kb-w-d"/>`;
      h += `<line x1="${X0}" x2="${W - 16}" y1="168" y2="168" class="kb-grid strong"/>`;
      h += `<text x="8" y="160" class="kb-lbl">RS-232</text><text x="8" y="176" class="kb-sub">nach Pegelwandler</text>`;
      h += `<text x="${X0 - 6}" y="124" class="kb-sub" text-anchor="end">+12 V</text><text x="${X0 - 6}" y="172" class="kb-sub" text-anchor="end">0 V</text><text x="${X0 - 6}" y="220" class="kb-sub" text-anchor="end">−12 V</text>`;
      h += `<path d="${steps(vals, X0, BW, v => (v ? 216 : 120))}" class="kb-sig kb-w-m"/>`;
      $('#sr-lvl').innerHTML = `<svg viewBox="0 0 ${W} 232" class="kb-wave" style="min-width:560px;max-width:${Math.round(W * 1.3)}px;margin:0 auto">${h}</svg>`;
    }
    inp.addEventListener('input', render);
    render();
  })();

  /* ---------- Station 2: Nullmodem ---------- */
  (function nullm() {
    const ROWS = [['TXD', 3], ['RXD', 2], ['RTS', 7], ['CTS', 8], ['GND', 5]];
    const PAIR = { TXD: 'RXD', RXD: 'TXD', RTS: 'CTS', CTS: 'RTS', GND: 'GND' };
    function render(cross) {
      $$('#sr-null-seg button').forEach(b => b.classList.toggle('active', Number(b.dataset.n) === cross));
      const y = i => 34 + i * 30;
      let h = `<rect x="20" y="10" width="110" height="168" rx="8" class="sr-box"/><rect x="390" y="10" width="110" height="168" rx="8" class="sr-box"/>`;
      h += `<text x="75" y="196" text-anchor="middle" class="sr-small strong">PC (DTE)</text><text x="445" y="196" text-anchor="middle" class="sr-small strong">${cross ? 'PC (DTE)' : 'Modem (DCE)'}</text>`;
      ROWS.forEach(([n, p], i) => {
        h += `<text x="40" y="${y(i) + 4}" class="sr-small">${p} ${n}</text>`;
        h += `<text x="480" y="${y(i) + 4}" class="sr-small" text-anchor="end">${n} ${p}</text>`;
        const j = cross ? ROWS.findIndex(r => r[0] === PAIR[n]) : i;
        const cls = n === 'GND' ? 'gnd' : n === 'RTS' || n === 'CTS' ? 'dash' : '';
        h += `<path d="M130 ${y(i)} C 260 ${y(i)}, 260 ${y(j)}, 390 ${y(j)}" class="sr-ln ${cls}"/>`;
      });
      $('#sr-null').innerHTML = `<svg viewBox="0 0 520 206" class="sr-svg" style="min-width:420px;max-width:620px;margin:0 auto">${h}</svg>`;
    }
    $('#sr-null-seg').addEventListener('click', e => { const b = e.target.closest('[data-n]'); if (b) render(Number(b.dataset.n)); });
    render(1);
  })();

  /* ---------- Station 2: Formatkürzel ---------- */
  (function fmtDec() {
    const inp = $('#sr-fmt-in');
    function render() {
      const f = parseFmt(inp.value);
      inp.classList.toggle('bad', !f);
      if (!f) { $('#sr-fmt-out').innerHTML = '<p>Schreibweise: Datenbits (5–9), Parität (N, E, O, M, S), Stoppbits (1, 1.5, 2) – z. B. <code>8N1</code>.</p>'; return; }
      const fb = frameBits(f);
      $('#sr-fmt-out').innerHTML = `<p><b>${f.n} Datenbits</b>, <b>${PARITY[f.p]}</b>, <b>${String(f.s).replace('.', ',')} Stoppbit${f.s === 1 ? '' : 's'}</b>. Mit dem Startbit sind das <b>${String(fb).replace('.', ',')} Bit</b> pro Zeichen – bei 9600 Baud also ${dec(9600 / fb, 0)} Zeichen pro Sekunde.</p>`;
    }
    inp.addEventListener('input', render);
    $$('[data-fmt]').forEach(b => b.addEventListener('click', () => { inp.value = b.dataset.fmt; render(); }));
    render();
  })();

  /* ---------- Station 2: Lückentext zu den Formaten ---------- */
  (function cloze() {
    const el = $('#sr-cloze');
    // Je Zeile: Format und welche Lücke schon ausgefüllt ist (0 Datenbits, 1 Parität, 2 Stoppbits) – zuerst wie auf dem Arbeitsblatt
    const SHEET = [[{ n: 8, p: 'N', s: 1 }, 1], [{ n: 7, p: 'E', s: 2 }, 0], [{ n: 8, p: 'O', s: 1 }, 2]];
    const WORD = { N: 'keine Parität', E: 'gerade Parität', O: 'ungerade Parität' };
    let rows = SHEET;
    const text = (f, k) => [`${f.n} Datenbits`, WORD[f.p], `${f.s} Stoppbit${f.s > 1 ? 's' : ''}`][k];
    // Großzügig prüfen: „8“, „8 Bit“, „8 Datenbits“ · „gerade“, „even“, „E“ · „2“, „2 Stopp“
    function ok(v, f, k) {
      const t = v.trim().toLowerCase();
      if (k === 0) return new RegExp(`^${f.n}(daten)?(bits?)?$`).test(t.replace(/\s+/g, ''));
      if (k === 1) {
        const w = t.replace(/\s*(parit(ä|ae)t|parity)$/, '').trim();
        return { N: ['keine', 'ohne', 'none', 'n'], E: ['gerade', 'even', 'e'], O: ['ungerade', 'odd', 'o'] }[f.p].includes(w);
      }
      return new RegExp(`^${f.s}(stopp?(bits?)?)?$`).test(t.replace(/\s+/g, ''));
    }
    function render() {
      el.innerHTML = `
        <div class="sr-cloze">${rows.map(([f, given], i) => `
          <div class="sr-cl-row"><b class="sr-cl-fmt">${f.n}${f.p}${f.s}</b>${[0, 1, 2].map(k => (k === given
            ? `<span class="sr-cl-given">${text(f, k)}</span>`
            : `<input data-i="${i}" data-k="${k}" spellcheck="false" autocomplete="off" aria-label="${f.n}${f.p}${f.s}: ${['Datenbits', 'Parität', 'Stoppbits'][k]}" placeholder="${['Datenbits', 'Parität', 'Stoppbits'][k]}">`)).join('<span class="sr-cl-sep">,</span>')}</div>`).join('')}
        </div>
        <div class="osi-pz-fb" aria-live="polite"></div>
        <div class="row-actions">
          <button type="button" class="btn primary" data-act="check">Prüfen</button>
          <button type="button" class="btn" data-act="new">Neue Formate</button>
          <button type="button" class="btn ghost" data-act="solve">Lösung zeigen</button>
        </div>`;
    }
    function check() {
      const fields = $$('input[data-k]', el);
      let right = 0;
      fields.forEach(inp => {
        const [f] = rows[Number(inp.dataset.i)];
        const good = ok(inp.value, f, Number(inp.dataset.k));
        inp.classList.toggle('good', good);
        inp.classList.toggle('bad', !good);
        if (good) right++;
      });
      const fb = $('.osi-pz-fb', el);
      if (right === fields.length) {
        fb.innerHTML = '<p class="osi-pz-done">Alles richtig!</p>';
        FX.burstFrom(fb.firstChild);
      } else {
        fb.innerHTML = `<p>${right} von ${fields.length} Lücken richtig. Tipp: Die Ziffer vorne sind die Datenbits, der Buchstabe die Parität (N, E, O), die Ziffer hinten die Stoppbits.</p>`;
      }
    }
    function fresh() {
      const seen = new Set();
      rows = [];
      while (rows.length < 3) {
        const f = { n: [7, 8][Math.floor(Math.random() * 2)], p: 'NEO'[Math.floor(Math.random() * 3)], s: 1 + Math.floor(Math.random() * 2) };
        const key = `${f.n}${f.p}${f.s}`;
        if (!seen.has(key)) { seen.add(key); rows.push([f, Math.floor(Math.random() * 3)]); }
      }
      render();
    }
    el.addEventListener('click', e => {
      const act = e.target.closest('[data-act]')?.dataset.act;
      if (act === 'check') check();
      if (act === 'new') fresh();
      if (act === 'solve') {
        $$('input[data-k]', el).forEach(inp => { inp.value = text(rows[Number(inp.dataset.i)][0], Number(inp.dataset.k)); });
        check();
      }
    });
    el.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.matches('input[data-k]')) check(); });
    render();
  })();

  /* ---------- Station 3: Telegramm-Baukasten ---------- */
  const COL = { start: 'sr-f-start', data: 'sr-f-data', par: 'sr-f-par', stop: 'sr-f-stop' };
  // Zeichnet Telegramme hintereinander; ann: Bits beschriften, us: Zeitachse in µs pro Bit, gaps: Ruhebits nach jedem Telegramm
  function uartSvg(frames, { ann = true, grid = true, BW = 40, us = null, gaps = [] } = {}) {
    const seq = [{ v: 1, t: 'idle' }];
    frames.forEach((f, k) => { seq.push(...f); for (let g = 0; g < (gaps[k] ?? 1); g++) seq.push({ v: 1, t: 'idle' }); });
    const N = seq.length, X0 = 16, W = X0 + N * BW + 16;
    const top = 40, lo = 96;
    let h = '';
    seq.forEach((b, i) => {
      if (b.t !== 'idle' && COL[b.t]) h += `<rect x="${X0 + i * BW}" y="${top - 8}" width="${BW}" height="${lo - top + 16}" class="${COL[b.t]}"/>`;
    });
    if (grid) for (let i = 0; i <= N; i++) h += `<line x1="${X0 + i * BW}" x2="${X0 + i * BW}" y1="${top - 8}" y2="${lo + 8}" class="kb-grid"/>`;
    if (ann) {
      seq.forEach((b, i) => {
        const x = X0 + (i + .5) * BW;
        const lab = b.t === 'start' ? 'S' : b.t === 'data' ? `D${b.i}` : b.t === 'par' ? 'P' : b.t === 'stop' && BW >= 30 ? 'Stopp' : '';
        if (lab) h += `<text x="${x}" y="${lo + 26}" class="kb-sub" text-anchor="middle">${lab}</text>`;
        if (b.t !== 'idle') h += `<text x="${x}" y="${top - 14}" class="kb-bit" text-anchor="middle">${b.v}</text>`;
      });
    }
    h += `<path d="${steps(seq.map(b => b.v), X0, BW, v => (v ? top : lo))}" class="kb-sig kb-w-d"/>`;
    if (us) {
      for (let i = 0; i <= N; i += 5) h += `<text x="${X0 + i * BW}" y="${lo + 46}" class="kb-sub" text-anchor="middle">${fmt(Math.round(i * us))} µs</text>`;
    }
    const H = lo + (us ? 54 : ann ? 34 : 14);
    return { svg: `<svg viewBox="0 0 ${W} ${H}" class="kb-wave" style="min-width:${Math.min(W, 640)}px;max-width:${Math.round(W * 1.35)}px;margin:0 auto">${h}</svg>`, seq };
  }

  (function builder() {
    const ids = ['ch', 'n', 'p', 's', 'b'].map(k => $('#sr-u-' + k));
    function render() {
      const [ch, n, p, s, b] = ids;
      const f = { n: Number(n.value), p: p.value, s: Number(s.value) };
      const code = codeOf(ch);
      const fits = code < 2 ** f.n;
      const fr = frame(code & (2 ** f.n - 1), f);
      $('#sr-u-svg').innerHTML = uartSvg([fr], { BW: 46 }).svg;
      const baud = Number(b.value);
      const nb = frameBits(f);
      const tb = 1e6 / baud;
      const data = bin(code & (2 ** f.n - 1), f.n);
      const cps = baud / nb;
      $('#sr-u-out').innerHTML = `
        ${fits ? '' : `<p class="sr-warn">Code ${code} passt nicht in ${f.n} Datenbits – übertragen werden nur die unteren ${f.n} Bit. Für Zeichen über 127 braucht man 8 Datenbits.</p>`}
        <div class="sr-u-facts">
          <div><small>Zeichen</small><b>${show(code)}</b><span>Code ${code} = ${hex(code & 255)}</span></div>
          <div><small>Binär (MSB … LSB)</small><b><code>${data}</code></b><span>auf der Leitung: <code>${[...data].reverse().join('')}</code></span></div>
          <div><small>Bits pro Telegramm</small><b>${nb}</b><span>1 Start + ${f.n} Daten${f.p === 'N' ? '' : ' + 1 Parität'} + ${f.s} Stopp</span></div>
          <div><small>Bitzeit</small><b>${dec(tb, tb < 10 ? 2 : 1)} µs</b><span>1 ÷ ${fmt(baud)} Baud</span></div>
          <div><small>Telegramme pro Sekunde</small><b>${fmt(Math.floor(cps))}</b><span>${fmt(baud)} ÷ ${nb}</span></div>
          <div><small>Nutzdaten</small><b>${fmt(Math.floor(cps * f.n))} Bit/s</b><span>${Math.round(100 * f.n / nb)} % der Baudrate</span></div>
        </div>`;
    }
    ids.forEach(el => el.addEventListener(el.tagName === 'INPUT' ? 'input' : 'change', render));
    render();
  })();

  /* ---------- Station 3: Paritätsbit ---------- */
  (function par() {
    let mode = 'E';
    let data = [0, 1, 1, 0, 0, 0, 0, 1];     // MSB … LSB, „a“
    let flip = new Set();                     // Positionen 0–8 (8 = Paritätsbit), die auf dem Weg kippen
    function render() {
      $$('#sr-pa-seg button').forEach(b => b.classList.toggle('active', b.dataset.p === mode));
      const bits = data.join('');
      const pb = parityBit(bits, mode);
      const sent = [...data, pb];
      const recv = sent.map((v, i) => (flip.has(i) ? 1 - v : v));
      const rOnes = recv.reduce((a, b) => a + b, 0);
      const ok = mode === 'E' ? rOnes % 2 === 0 : rOnes % 2 === 1;
      const btn = (v, i, row) => `<button type="button" class="sr-pbit${i === 8 ? ' p' : ''}${row === 'r' && flip.has(i) ? ' flip' : ''}" data-row="${row}" data-i="${i}"${row === 's' && i === 8 ? ' disabled' : ''}>${v}</button>`;
      $('#sr-pa').innerHTML = `
        <div class="sr-pa-row"><small>Sender</small><div>${sent.map((v, i) => btn(v, i, 's')).join('')}</div><span>${ones(bits)} Einsen + P = ${ones(bits) + pb}</span></div>
        <div class="sr-pa-row"><small>Empfänger</small><div>${recv.map((v, i) => btn(v, i, 'r')).join('')}</div><span>${rOnes} Einsen</span></div>
        <div class="sr-pa-row sr-pa-lbl"><small></small><div>${[7, 6, 5, 4, 3, 2, 1, 0].map(i => `<i>D${i}</i>`).join('')}<i>P</i></div><span></span></div>`;
      const n = flip.size;
      const t = n === 0
        ? `Der Sender zählt ${ones(bits)} Einsen und setzt P = <b>${pb}</b>, damit die Summe ${mode === 'E' ? 'gerade' : 'ungerade'} ist. Klicke beim <b>Empfänger</b> auf Bits, um eine Störung zu simulieren.`
        : ok
          ? `${n} Bit gekippt – die Zahl der Einsen ist trotzdem ${mode === 'E' ? 'gerade' : 'ungerade'}. Der Empfänger hält das Zeichen für richtig: <b>Fehler nicht erkannt!</b>`
          : `${n} Bit gekippt – ${rOnes} Einsen passen nicht zur ${mode === 'E' ? 'geraden' : 'ungeraden'} Parität. <b>Fehler erkannt</b>, das Zeichen wird verworfen.`;
      $('#sr-pa-txt').innerHTML = `<p>${t}</p>`;
    }
    $('#sr-pa').addEventListener('click', e => {
      const b = e.target.closest('[data-i]');
      if (!b) return;
      const i = Number(b.dataset.i);
      if (b.dataset.row === 's' && i < 8) { data[i] = 1 - data[i]; flip.clear(); }
      if (b.dataset.row === 'r') { if (flip.has(i)) flip.delete(i); else flip.add(i); }
      render();
    });
    $('#sr-pa-seg').addEventListener('click', e => { const b = e.target.closest('[data-p]'); if (b) { mode = b.dataset.p; flip.clear(); render(); } });
    render();
  })();

  /* ---------- Station 3: Mitschnitt vom Arbeitsblatt im Stil von PulseView ---------- */
  (function worksheet() {
    const BT = 1000 / 9600;                    // Bitzeit in ms
    // Telegramme wie auf dem Arbeitsblatt: [Leitung, Startzeit in ms, Code]
    const FRAMES = [['RX', 276.05, 0x61], ['RX', 277.15, 0x3F], ['RX', 278.25, 0x0A], ['TX', 280.4, 0x6F], ['TX', 281.5, 0x6B]];
    function capSvg(t0, t1, { pxms, step, unit, cursor, big }) {
      const LX = 104, W = LX + (t1 - t0) * pxms + 12;
      const X = t => LX + (t - t0) * pxms;
      const ROW = { RXb: 46, RXd: 68, TXb: 92, TXd: 114 };
      const WAVE = { TX: 152, RX: 196 };
      let h = '';
      // Zeitachse
      for (let t = Math.ceil(t0 / step) * step; t <= t1 + 1e-9; t += step) {
        const x = X(t);
        const lab = unit === 'µs' ? `${fmt(Math.round(t * 1000))} µs` : `${dec(t, 1)} ms`;
        h += `<line x1="${x}" x2="${x}" y1="20" y2="26" class="sr-pv-tick"/><text x="${x}" y="15" class="sr-pv-axis" text-anchor="middle">${lab}</text>`;
      }
      h += `<line x1="${LX}" x2="${W - 12}" y1="26" y2="26" class="sr-pv-tick"/>`;
      // Zeilenbeschriftung
      [['UART: RX bits', ROW.RXb], ['UART: RX data', ROW.RXd], ['UART: TX bits', ROW.TXb], ['UART: TX data', ROW.TXd]].forEach(([t, y]) => { h += `<text x="6" y="${y + 4}" class="sr-pv-lbl">${t}</text>`; });
      h += `<text x="6" y="${WAVE.TX + 4}" class="sr-pv-ch">D0 · TX</text><text x="6" y="${WAVE.RX + 4}" class="sr-pv-ch">D1 · RX</text>`;
      // Signale: Ruhepegel 1, dann die Telegramme
      ['TX', 'RX'].forEach(ch => {
        const yy = v => (v ? WAVE[ch] - 12 : WAVE[ch] + 12);
        let d = `M${LX} ${yy(1)}`;
        FRAMES.filter(f => f[0] === ch).forEach(([, t, code]) => {
          frame(code).forEach((b, i) => {
            const xa = X(t + i * BT), xb = X(t + (i + 1) * BT);
            if (xb < LX || xa > W) return;
            d += `H${Math.max(LX, xa)}V${yy(b.v)}H${Math.min(W - 12, xb)}`;
          });
          d += `V${yy(1)}`;
        });
        h += `<path d="${d}H${W - 12}" class="sr-pv-wave"/>`;
      });
      // Dekodierung
      FRAMES.forEach(([ch, t, code]) => {
        const yb = ROW[ch + 'b'], yd = ROW[ch + 'd'];
        frame(code).forEach((b, i) => {
          const xa = X(t + i * BT) + 1, xb = X(t + (i + 1) * BT) - 1, xm = (xa + xb) / 2;
          if (xb < LX || xa > W) return;
          if (b.t === 'data') h += `<rect x="${xa}" y="${yb - 8}" width="${xb - xa}" height="16" rx="7" class="sr-pv-bit"/><text x="${xm}" y="${yb + 4}" class="sr-pv-bt" text-anchor="middle">${b.v}</text>`;
          else if (big) h += `<rect x="${xa}" y="${yd - 8}" width="${xb - xa}" height="16" rx="7" class="sr-pv-${b.t}"/><text x="${xm}" y="${yd + 4}" class="sr-pv-bt" text-anchor="middle">${b.t === 'start' ? 'Start bit' : 'Stop bit'}</text>`;
          else h += `<circle cx="${xm}" cy="${yd}" r="6.5" class="sr-pv-${b.t}"/><text x="${xm}" y="${yd + 3.5}" class="sr-pv-st" text-anchor="middle">${b.t === 'start' ? 'S' : 'T'}</text>`;
        });
        const xa = Math.max(LX, X(t + BT) + 1), xb = X(t + 9 * BT) - 1;
        if (xb > LX) h += `<rect x="${xa}" y="${yd - 8}" width="${xb - xa}" height="16" rx="7" class="sr-pv-data"/><text x="${(xa + xb) / 2}" y="${yd + 4}" class="sr-pv-bt" text-anchor="middle">${code.toString(16).toUpperCase().padStart(2, '0')}</text>`;
      });
      if (cursor) {
        const [a, b] = cursor.map(X);
        h += `<line x1="${a}" x2="${a}" y1="28" y2="214" class="sr-pv-cur"/><line x1="${b}" x2="${b}" y1="28" y2="214" class="sr-pv-cur"/><line x1="${a}" x2="${b}" y1="222" y2="222" class="sr-pv-cur"/>`;
        h += `<rect x="${b + 4}" y="214" width="58" height="16" rx="3" class="sr-pv-curbox"/><text x="${b + 33}" y="226" class="sr-pv-curt" text-anchor="middle">+${Math.round((cursor[1] - cursor[0]) * 1000)} µs</text>`;
      }
      return `<svg viewBox="0 0 ${W} ${cursor ? 236 : 222}" class="sr-pv" style="min-width:${Math.min(W, 720)}px">${h}</svg>`;
    }
    const s = FRAMES[0][1];
    let ascii = '<span><b>10</b><i>LF</i></span><span><b>13</b><i>CR</i></span>';
    for (let n = 32; n <= 126; n++) ascii += `<span><b>${n}</b>${n === 32 ? '<i>Leer</i>' : esc(String.fromCharCode(n))}</span>`;
    $('#sr-ws').innerHTML = `
      <p class="sr-ws-task"><b>Aufgabe 2:</b> Der Ausschnitt zeigt das erste Telegramm. Die beiden grünen Messcursor liegen am Anfang und am Ende eines Bits. Berechne die Baudrate.</p>
      <div class="tp-wrap sr-pv-wrap">${capSvg(275.95, 277.25, { pxms: 760, step: 0.2, unit: 'µs', big: true, cursor: [s + BT, s + BT + 0.104] })}</div>
      <details class="v6-more"><summary>Lösung Aufgabe 2</summary>
        <p>Ein Bit dauert 104 µs. Die Baudrate ist der Kehrwert der Bitzeit: 1 ÷ 0,000104 s ≈ <b>9615 Baud</b> – gemeint ist die Standard-Baudrate <b>9600</b> (genau 104,17 µs pro Bit).</p>
      </details>
      <p class="sr-ws-task"><b>Aufgabe 3:</b> Der ganze Mitschnitt: Zuerst kommen auf RX drei Telegramme an, dann sendet der Mikrocontroller auf TX zwei zurück. Man sieht, dass zuerst „61“ empfangen wurde – als Bits steht dort aber <code>10000110</code>.</p>
      <div class="tp-wrap sr-pv-wrap">${capSvg(275.8, 283.2, { pxms: 128, step: 1, unit: 'ms' })}</div>
      <ol class="sr-ws-q">
        <li>In welchem Zahlensystem ist die „61“ angegeben?</li>
        <li>Wie kommt man von der Bitfolge <code>10000110</code> zu dieser Zahl?</li>
        <li>Es wurde Text nach ASCII übertragen. Welche Nachricht kam auf RX an, welche wurde auf TX zurückgeschickt?</li>
      </ol>
      <details class="v6-more"><summary>ASCII-Tabelle (Zeichen 32 bis 126, dazu die Steuerzeichen LF und CR)</summary><div class="kb-ascii-tbl">${ascii}</div></details>
      <details class="v6-more"><summary>Lösung Aufgabe 3</summary>
        <ol class="sr-ws-q">
          <li><b>Hexadezimal</b> (Basis 16) – 0x61 = 6 · 16 + 1 = 97.</li>
          <li>Der UART sendet das <b>LSB zuerst</b>. Also die Bits rückwärts lesen: <code>10000110</code> → <code>01100001</code>. Dann in zwei Hälften zu je 4 Bit teilen: <code>0110</code> = 6 und <code>0001</code> = 1 → <b>0x61</b>.</li>
          <li>RX: 0x61 = 97 = „a“, 0x3F = 63 = „?“, 0x0A = 10 = Zeilenvorschub (LF, die Enter-Taste) → <b>„a?“</b> mit Enter. TX: 0x6F = 111 = „o“, 0x6B = 107 = „k“ → <b>„ok“</b>. Das Gerät wurde also etwas gefragt und hat mit „ok“ geantwortet.</li>
        </ol>
      </details>`;
  })();
})();
