/* Serielle Schnittstellen · Stationen 4–5: I²C-Bus und Adressierung, SPI mit Schieberegistern, mehrere Subnodes */
'use strict';

const BUS = (() => {
  // Teilnehmer am Beispiel-Bus – auch fürs Dojo
  const I2C_DEV = [
    ['🌡', 'Temperatursensor', 0x48],
    ['💾', 'EEPROM', 0x50],
    ['🖥', 'Display', 0x3C],
    ['⏰', 'Uhr (RTC)', 0x68],
  ];
  // Erstes Byte nach der Startbedingung: 7 Adressbits, dann R/W
  const firstByte = (addr, rw) => (addr << 1) | rw;
  return { I2C_DEV, firstByte };
})();

(() => {
  const { $, $$ } = UI;
  const { bin, hex } = SERIELL;
  const { I2C_DEV, firstByte } = BUS;
  const fmt = n => String(n).replace(/\B(?=(\d{3})+$)/g, ' ');
  const dec = (x, d = 1) => (Math.round(x * 10 ** d) / 10 ** d).toString().replace('.', ',');

  // Signal aus Wechselpunkten [t, v] (t in Bitzeiten), gilt bis zum nächsten Punkt bzw. bis end
  function wave(pts, end, X, y) {
    let d = `M${X(pts[0][0])} ${y(pts[0][1])}`;
    for (let i = 1; i < pts.length; i++) d += `H${X(pts[i][0])}V${y(pts[i][1])}`;
    return d + `H${X(end)}`;
  }
  const dot = (x, y) => `<circle cx="${x}" cy="${y}" r="3.5" class="sr-dot"/>`;

  /* ---------- I²C: Aufbau ---------- */
  const addrSel = $('#sr-i2c-addr');
  const rwSel = $('#sr-i2c-rw');
  const fSel = $('#sr-i2c-f');
  addrSel.innerHTML = I2C_DEV.map(([, n, a]) => `<option value="${a}">${hex(a)} – ${n}</option>`).join('') + '<option value="8">0x08 – niemand (Arbeitsblatt)</option>';

  function busSvg(target) {
    const SDA = 64, SCL = 84;
    let h = `<line x1="20" y1="22" x2="620" y2="22" class="sr-ln"/><text x="626" y="26" class="sr-small">V<tspan font-size="9" dy="3">dd</tspan></text>`;
    h += `<line x1="20" y1="${SDA}" x2="620" y2="${SDA}" class="sr-ln sda"/><text x="626" y="${SDA + 4}" class="sr-small strong">SDA</text>`;
    h += `<line x1="20" y1="${SCL}" x2="620" y2="${SCL}" class="sr-ln scl"/><text x="626" y="${SCL + 4}" class="sr-small strong">SCL</text>`;
    [[300, SDA], [330, SCL]].forEach(([x, y]) => {
      h += `<line x1="${x}" y1="22" x2="${x}" y2="30" class="sr-ln"/><rect x="${x - 5}" y="30" width="10" height="20" class="sr-res"/><line x1="${x}" y1="50" x2="${x}" y2="${y}" class="sr-ln"/>${dot(x, 22)}${dot(x, y)}`;
    });
    h += `<text x="340" y="44" class="sr-small">R<tspan font-size="9" dy="3">p</tspan></text>`;
    const nodes = [['µC', 'Controller', null], ...I2C_DEV];
    nodes.forEach(([ico, name, a], i) => {
      const x = 20 + i * 122;
      const on = a !== null && a === target;
      h += `<line x1="${x + 40}" y1="${SDA}" x2="${x + 40}" y2="112" class="sr-ln sda"/><line x1="${x + 64}" y1="${SCL}" x2="${x + 64}" y2="112" class="sr-ln scl"/>${dot(x + 40, SDA)}${dot(x + 64, SCL)}`;
      h += `<rect x="${x}" y="112" width="104" height="58" rx="8" class="sr-box${a === null ? ' ctrl' : ''}${on ? ' on' : ''}"/>`;
      h += `<text x="${x + 52}" y="134" text-anchor="middle" class="sr-ico">${ico}</text><text x="${x + 52}" y="152" text-anchor="middle" class="sr-small strong sr-nm">${name}</text><text x="${x + 52}" y="165" text-anchor="middle" class="sr-small">${a === null ? 'Taktgeber' : hex(a)}</text>`;
    });
    return `<svg viewBox="0 0 660 178" class="sr-svg" style="min-width:560px;max-width:860px;margin:0 auto">${h}</svg>`;
  }

  /* ---------- I²C: Adressierung als Signal ---------- */
  function renderI2c() {
    const addr = Number(addrSel.value), rw = Number(rwSel.value), f = Number(fSel.value);
    const dev = I2C_DEV.find(d => d[2] === addr);
    const ack = !!dev;
    $('#sr-i2c-bus').innerHTML = busSvg(addr);
    const bits = [...bin(addr, 7)].map(Number).concat(rw);
    // Zeitschlitze: 0 Ruhe · 1 Start · 2–8 Adresse · 9 R/W · 10 ACK · 11 Stopp · 12 Ruhe
    const BW = 46, X0 = 70, END = 13;
    const X = t => X0 + t * BW;
    const scl = [[0, 1]];
    for (let j = 2; j <= 11; j++) scl.push([j, 0], [j + .5, 1]);
    const sda = [[0, 1], [1.5, 0]];
    bits.forEach((b, k) => sda.push([2 + k + .1, b]));
    sda.push([10.1, ack ? 0 : 1], [11.1, 0], [11.75, 1]);
    const ySCL = v => (v ? 34 : 64), ySDA = v => (v ? 104 : 134);
    let h = '';
    const band = (t, cls) => `<rect x="${X(t)}" y="88" width="${BW}" height="56" class="${cls}"/>`;
    for (let t = 2; t <= 8; t++) h += band(t, 'sr-f-data');
    h += band(9, 'sr-f-par') + band(10, ack ? 'sr-f-ack' : 'sr-f-nack');
    for (let t = 1; t <= 12; t++) h += `<line x1="${X(t)}" x2="${X(t)}" y1="22" y2="150" class="kb-grid"/>`;
    h += `<text x="8" y="54" class="kb-lbl">SCL</text><text x="8" y="70" class="kb-sub">Takt</text><text x="8" y="124" class="kb-lbl">SDA</text><text x="8" y="140" class="kb-sub">Daten</text>`;
    h += `<path d="${wave(scl, END, X, ySCL)}" class="kb-sig kb-w-c"/><path d="${wave(sda, END, X, ySDA)}" class="kb-sig kb-w-d"/>`;
    const lab = (t, s, cls = 'kb-bit') => `<text x="${X(t + .5)}" y="16" class="${cls}" text-anchor="middle">${s}</text>`;
    h += lab(1, 'S', 'kb-bit code') + bits.slice(0, 7).map((b, k) => lab(2 + k, b)).join('') + lab(9, rw) + lab(10, ack ? 'ACK' : 'NACK', 'kb-bit code') + lab(11, 'P', 'kb-bit code');
    const sub = (t, s) => `<text x="${X(t + .5)}" y="166" class="kb-sub" text-anchor="middle">${s}</text>`;
    h += sub(1, 'Start') + [6, 5, 4, 3, 2, 1, 0].map((n, k) => sub(2 + k, 'A' + n)).join('') + sub(9, 'R/W') + sub(10, ack ? 'Target' : '–') + sub(11, 'Stopp');
    $('#sr-i2c-svg').innerHTML = `<svg viewBox="0 0 ${X(END) + 10} 174" class="kb-wave" style="min-width:600px;max-width:${Math.round((X(END) + 10) * 1.4)}px;margin:0 auto">${h}</svg>`;
    const fb = firstByte(addr, rw);
    const tb = 1000 / f;
    $('#sr-i2c-out').innerHTML = `<p>Adresse ${hex(addr)} = <code>${bin(addr, 7)}</code>, dazu R/W = ${rw} (${rw ? 'lesen' : 'schreiben'}) → erstes Byte <code>${bin(fb)}</code> = ${hex(fb)}. ${ack
      ? `Der <b>${dev[1]}</b> erkennt seine Adresse und zieht SDA im 9. Takt auf Low: <b>ACK</b>. ${rw ? 'Als Nächstes sendet er seine Daten, der Controller gibt weiter den Takt vor.' : 'Als Nächstes sendet der Controller die Daten.'}`
      : 'Kein Teilnehmer hat diese Adresse. SDA bleibt im 9. Takt durch den Pull-up auf High: <b>NACK</b>. Der Controller beendet mit der Stoppbedingung.'} Ein Takt dauert bei ${fmt(f)} kHz <b>${dec(tb, tb < 10 ? 1 : 0)} µs</b>, die 9 Takte also ${dec(9 * tb, 1)} µs.</p>`;
  }
  [addrSel, rwSel, fSel].forEach(s => s.addEventListener('change', renderI2c));
  addrSel.value = String(0x48);
  renderI2c();

  /* ---------- SPI: vier Leitungen ---------- */
  (function four() {
    const L = [['CS', 1], ['SCLK', 1], ['MOSI', 1], ['MISO', -1]];
    const IN = { CS: 'CS', SCLK: 'SCLK', MOSI: 'SDI', MISO: 'SDO' };
    let h = '<defs><marker id="sr-ah2" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0 L10 5 L0 10 z" class="sr-ahf"/></marker></defs>';
    h += `<rect x="20" y="10" width="150" height="160" rx="8" class="sr-box ctrl"/><text x="36" y="34" class="sr-small strong">SPI Main</text>`;
    h += `<rect x="330" y="10" width="150" height="160" rx="8" class="sr-box"/><text x="464" y="34" class="sr-small strong" text-anchor="end">SPI Subnode</text>`;
    L.forEach(([n, d], i) => {
      const y = 60 + i * 30;
      h += `<text x="160" y="${y + 4}" class="sr-small strong" text-anchor="end">${n === 'CS' ? '<tspan class="sr-ov-t">CS</tspan>' : n}</text>`;
      h += `<text x="340" y="${y + 4}" class="sr-small strong">${IN[n] === 'CS' ? '<tspan class="sr-ov-t">CS</tspan>' : IN[n]}</text>`;
      h += d > 0 ? `<line x1="172" y1="${y}" x2="326" y2="${y}" class="sr-ln" marker-end="url(#sr-ah2)"/>` : `<line x1="328" y1="${y}" x2="174" y2="${y}" class="sr-ln" marker-end="url(#sr-ah2)"/>`;
    });
    $('#sr-spi-4').innerHTML = `<svg viewBox="0 0 500 180" class="sr-svg sr-spi4">${h}</svg>`;
  })();

  /* ---------- SPI: Schieberegister ---------- */
  const mIn = $('#sr-spi-m'), sIn = $('#sr-spi-s');
  const val = inp => Math.max(0, Math.min(255, Math.round(Number(inp.value) || 0)));
  // Register nach k Takten: links die eigenen restlichen Bits, rechts die schon hereingeschobenen
  const reg = (own, other, k) => [...bin(own).slice(k), ...bin(other).slice(0, k)].map((b, p) => [b, p < 8 - k ? 'own' : 'in']);
  function renderSpi(k) {
    const M = val(mIn), S = val(sIn);
    const cells = (r, a, b) => r.map(([bit, w]) => `<span class="sr-cell ${w === 'own' ? a : b}">${bit}</span>`).join('');
    const mr = reg(M, S, k), sr = reg(S, M, k);
    const v = r => parseInt(r.map(c => c[0]).join(''), 2);
    $('#sr-spi-reg').innerHTML = `
      <div class="sr-spi-row"><small>Main</small><div class="sr-cells">${cells(mr, 'm', 's')}</div><span>= ${v(mr)} (${hex(v(mr))})</span></div>
      <div class="sr-spi-mid"><span>MOSI → ${k && k <= 8 ? `<b>${bin(M)[k - 1]}</b>` : ''}</span><span>${k && k <= 8 ? `<b>${bin(S)[k - 1]}</b>` : ''} ← MISO</span></div>
      <div class="sr-spi-row"><small>Subnode</small><div class="sr-cells">${cells(sr, 's', 'm')}</div><span>= ${v(sr)} (${hex(v(sr))})</span></div>`;
    // Signal bis Takt k: Schlitz 0 Ruhe, 1–8 Takte, 9 Ende
    const BW = 46, X0 = 80, END = k >= 8 ? 10 : k + 1;
    const X = t => X0 + t * BW;
    const cs = [[0, 1], [.5, 0]];
    if (k >= 8) cs.push([9.5, 1]);
    const clk = [[0, 0]];
    for (let j = 1; j <= Math.min(k, 8); j++) clk.push([j + .5, 1], [j + 1, 0]);
    const mo = [[0, 1]], mi = [[0, 1]];
    for (let j = 1; j <= Math.min(k, 8); j++) { mo.push([j, Number(bin(M)[j - 1])]); mi.push([j, Number(bin(S)[j - 1])]); }
    if (k >= 8) { mo.push([9, 1]); mi.push([9, 1]); }
    const rows = [['CS', cs, 'kb-w-m'], ['SCLK', clk, 'kb-w-c'], ['MOSI', mo, 'kb-w-d'], ['MISO', mi, 'kb-w-3']];
    let h = '';
    for (let t = 1; t <= 9; t++) h += `<line x1="${X(t)}" x2="${X(t)}" y1="10" y2="${rows.length * 44 + 6}" class="kb-grid"/>`;
    rows.forEach(([n, pts, cls], r) => {
      const top = 14 + r * 44;
      h += `<text x="8" y="${top + 20}" class="kb-lbl">${n}</text><path d="${wave(pts, END, X, x => (x ? top : top + 24))}" class="kb-sig ${cls}"/>`;
      if (n === 'MOSI' || n === 'MISO') for (let j = 1; j <= Math.min(k, 8); j++) h += `<text x="${X(j + .5)}" y="${top + 14}" class="kb-bit" text-anchor="middle">${bin(n === 'MOSI' ? M : S)[j - 1]}</text>`;
    });
    $('#sr-spi-svg').innerHTML = `<svg viewBox="0 0 ${X(10) + 10} ${rows.length * 44 + 10}" class="kb-wave" style="min-width:560px;max-width:${Math.round((X(10) + 10) * 1.3)}px;margin:0 auto">${h}</svg>`;
    let t;
    if (k === 0) t = `<b>CS</b> geht auf 0 – der Subnode ist ausgewählt. Main hat ${M} = <code>${bin(M)}</code> geladen, der Subnode ${S} = <code>${bin(S)}</code>.`;
    else if (k < 8) t = `Takt ${k}: Der Main schiebt sein Bit <code>${bin(M)[k - 1]}</code> über MOSI hinaus, der Subnode gleichzeitig <code>${bin(S)[k - 1]}</code> über MISO. Beide Register rücken eine Stelle nach links.`;
    else t = `Nach 8 Takten sind die Bytes <b>getauscht</b>: Der Subnode hat ${M}, der Main ${S}. CS geht wieder auf 1 – die Übertragung ist beendet. Senden und Empfangen passieren bei SPI immer <b>gleichzeitig</b>.`;
    $('#sr-spi-say').innerHTML = `<p><span class="osi-stepno">${k} / 8</span>${t}</p>`;
  }
  const spi = DIENSTE.stepper({ last: 8, render: renderSpi, step: $('#sr-spi-step'), go: $('#sr-spi-go'), reset: $('#sr-spi-reset'), page: 'ser-spi' });
  [mIn, sIn].forEach(i => i.addEventListener('input', () => spi.restart()));

  /* ---------- SPI: mehrere Subnodes ---------- */
  function renderMulti(mode) {
    $$('#sr-spi-multi-seg button').forEach(b => b.classList.toggle('active', b.dataset.m === mode));
    const SX = [200, 340, 480];
    const Y = { SCLK: 186, MOSI: 204, MISO: 222 };
    let h = `<rect x="16" y="20" width="110" height="214" rx="8" class="sr-box ctrl"/><text x="28" y="42" class="sr-small strong">SPI Main</text>`;
    SX.forEach((x, i) => {
      h += `<rect x="${x}" y="80" width="110" height="64" rx="8" class="sr-box"/><text x="${x + 55}" y="108" class="sr-small strong" text-anchor="middle">Subnode ${i + 1}</text>`;
      h += `<text x="${x + 25}" y="138" class="sr-tiny" text-anchor="middle">SCLK</text><text x="${x + 55}" y="138" class="sr-tiny" text-anchor="middle">SDI</text><text x="${x + 85}" y="138" class="sr-tiny" text-anchor="middle">SDO</text><text x="${x + 55}" y="94" class="sr-tiny" text-anchor="middle">CS</text>`;
    });
    // Takt geht immer an alle
    h += `<text x="118" y="${Y.SCLK + 4}" class="sr-tiny" text-anchor="end">SCLK</text><line x1="126" y1="${Y.SCLK}" x2="${SX[2] + 25}" y2="${Y.SCLK}" class="sr-ln scl"/>`;
    SX.forEach(x => { h += `<line x1="${x + 25}" y1="${Y.SCLK}" x2="${x + 25}" y2="144" class="sr-ln scl"/>${dot(x + 25, Y.SCLK)}`; });
    h += `<text x="118" y="${Y.MOSI + 4}" class="sr-tiny" text-anchor="end">MOSI</text><text x="118" y="${Y.MISO + 4}" class="sr-tiny" text-anchor="end">MISO</text>`;
    if (mode === 'cs') {
      SX.forEach((x, i) => {
        const y = 34 + i * 14;
        h += `<text x="118" y="${y + 4}" class="sr-tiny" text-anchor="end">CS${i + 1}</text><path d="M126 ${y} H${x + 55} V80" class="sr-ln cs${i}"/>`;
      });
      h += `<line x1="126" y1="${Y.MOSI}" x2="${SX[2] + 55}" y2="${Y.MOSI}" class="sr-ln"/><line x1="126" y1="${Y.MISO}" x2="${SX[2] + 85}" y2="${Y.MISO}" class="sr-ln dash2"/>`;
      SX.forEach(x => { h += `<line x1="${x + 55}" y1="${Y.MOSI}" x2="${x + 55}" y2="144" class="sr-ln"/>${dot(x + 55, Y.MOSI)}<line x1="${x + 85}" y1="${Y.MISO}" x2="${x + 85}" y2="144" class="sr-ln dash2"/>${dot(x + 85, Y.MISO)}`; });
    } else {
      h += `<text x="118" y="38" class="sr-tiny" text-anchor="end">CS</text><path d="M126 34 H${SX[2] + 55} V80" class="sr-ln cs0"/>`;
      SX.slice(0, 2).forEach(x => { h += `<line x1="${x + 55}" y1="34" x2="${x + 55}" y2="80" class="sr-ln cs0"/>${dot(x + 55, 34)}`; });
      h += `<path d="M126 ${Y.MOSI} H${SX[0] + 55} V144" class="sr-ln"/>`;
      h += `<path d="M${SX[0] + 85} 144 V160 H${SX[1] + 55} V144" class="sr-ln chain"/><path d="M${SX[1] + 85} 144 V160 H${SX[2] + 55} V144" class="sr-ln chain"/>`;
      h += `<path d="M${SX[2] + 85} 144 V${Y.MISO} H126" class="sr-ln dash2"/>`;
    }
    $('#sr-spi-multi').innerHTML = `<svg viewBox="0 0 610 240" class="sr-svg" style="min-width:520px;max-width:740px;margin:0 auto">${h}</svg>`;
    $('#sr-spi-multi-txt').innerHTML = mode === 'cs'
      ? '<p>Jeder Subnode bekommt eine <b>eigene CS-Leitung</b>, SCLK, MOSI und MISO teilen sich alle. Der Main zieht immer nur eine CS-Leitung auf 0 – nur dieser Subnode hört zu und antwortet, die anderen schalten ihren Ausgang ab. <b>Vorteil:</b> schneller, direkter Zugriff auf jeden Teilnehmer. <b>Nachteil:</b> Für jeden Subnode braucht der Main einen Pin mehr. Die CS-Leitung übernimmt hier die Rolle der Adresse – „adressiert“ wird per Draht.</p>'
      : '<p>Bei der <b>Daisy Chain</b> (Gänseblümchenkette) sind die Subnodes <b>in Reihe</b> geschaltet: Was aus dem Schieberegister des ersten herausfällt (SDO), wandert in das des nächsten (SDI). Alle teilen sich eine CS-Leitung. Welcher Baustein welche Daten bekommt, ergibt sich aus der <b>Zahl der Takte</b> – für drei Subnodes schiebt der Main 3 × 8 = 24 Bit durch. <b>Vorteil:</b> einfache Verdrahtung, wenige Pins. <b>Nachteil:</b> langsamerer Zugriff, weil immer durch alle geschoben wird.</p><p class="sr-note-in">Hinweis zum Arbeitsblatt: Die Schaltung mit CS1, CS2 und CS3 ist <b>nicht</b> kaskadiert – dort hat jeder Subnode seine eigene CS-Leitung. Kaskadiert ist erst die Daisy Chain.</p>';
  }
  $('#sr-spi-multi-seg').addEventListener('click', e => { const b = e.target.closest('[data-m]'); if (b) renderMulti(b.dataset.m); });
  renderMulti('cs');

  /* ---------- Mitschnitte vom Arbeitsblatt im Stil von PulseView ----------
     rows: Dekodierzeilen [Name, [[von, bis, Text, Klasse, rund?], …]] · waves: [Name, [[t, Pegel], …]] · Zeiten in µs */
  function pvSvg({ t0, t1, px, step, rows, waves, cursor }) {
    const LX = 112, W = LX + (t1 - t0) * px + 30;
    const X = t => LX + (t - t0) * px;
    const yRow = i => 46 + i * 22, yWave = i => 46 + rows.length * 22 + 20 + i * 44;
    const bottom = yWave(waves.length - 1) + 16;
    let h = '';
    for (let t = Math.ceil(t0 / step) * step; t <= t1 + 1e-9; t += step) {
      h += `<line x1="${X(t)}" x2="${X(t)}" y1="20" y2="26" class="sr-pv-tick"/><text x="${X(t)}" y="15" class="sr-pv-axis" text-anchor="middle">+${fmt(Math.round(t))} µs</text>`;
    }
    h += `<line x1="${LX}" x2="${X(t1)}" y1="26" y2="26" class="sr-pv-tick"/>`;
    rows.forEach(([name, items], i) => {
      const y = yRow(i);
      h += `<text x="6" y="${y + 4}" class="sr-pv-lbl">${name}</text>`;
      items.forEach(([a, b, txt, cls, round]) => {
        const xa = X(a) + 1, xb = X(b) - 1;
        h += round
          ? `<circle cx="${(xa + xb) / 2}" cy="${y}" r="7" class="${cls}"/><text x="${(xa + xb) / 2}" y="${y + 3.5}" class="sr-pv-st" text-anchor="middle">${txt}</text>`
          : `<rect x="${xa}" y="${y - 8}" width="${xb - xa}" height="16" rx="7" class="${cls}"/><text x="${(xa + xb) / 2}" y="${y + 4}" class="sr-pv-bt" text-anchor="middle">${txt}</text>`;
      });
    });
    waves.forEach(([name, pts], i) => {
      const y0 = yWave(i), y = v => (v ? y0 - 12 : y0 + 12);
      h += `<text x="6" y="${y0 + 4}" class="sr-pv-ch">${name}</text><path d="${wave(pts.map(([t, v]) => [Math.max(t, t0), v]), t1, X, y)}" class="sr-pv-wave"/>`;
    });
    const [a, b] = cursor.map(X);
    h += `<line x1="${a}" x2="${a}" y1="28" y2="${bottom}" class="sr-pv-cur"/><line x1="${b}" x2="${b}" y1="28" y2="${bottom}" class="sr-pv-cur"/><line x1="${a}" x2="${b}" y1="${bottom + 8}" y2="${bottom + 8}" class="sr-pv-cur"/>`;
    h += `<rect x="${b + 4}" y="${bottom}" width="58" height="16" rx="3" class="sr-pv-curbox"/><text x="${b + 33}" y="${bottom + 12}" class="sr-pv-curt" text-anchor="middle">+${String(Math.round((cursor[1] - cursor[0]) * 10) / 10).replace('.', ',')} µs</text>`;
    return `<div class="tp-wrap sr-pv-wrap"><svg viewBox="0 0 ${W} ${bottom + 22}" class="sr-pv" style="min-width:${Math.min(W, 720)}px">${h}</svg></div>`;
  }

  // I²C: Adresse 0x08 lesen, niemand antwortet (NACK) – Takt 10 µs wie auf dem Arbeitsblatt
  (function i2cWs() {
    const T = 10, S = 251366, B0 = S + 5;     // Startbedingung, Beginn des ersten Takts
    const bits = [...bin(0x08, 7)].map(Number).concat(1, 1);   // Adresse, R/W = 1, NACK = 1
    const slot = k => [B0 + k * T, B0 + (k + 1) * T];
    const scl = [[0, 1]], sda = [[0, 1], [S, 0]];
    bits.forEach((b, k) => { const [a] = slot(k); scl.push([a, 0], [a + T / 2, 1]); sda.push([a + 1, b]); });
    const [e] = slot(9);
    scl.push([e, 0], [e + T / 2, 1]);
    sda.push([e + 1, 0], [e + T * .75, 1]);
    const BIT = 'sr-pv-bit';
    $('#sr-i2c-ws').innerHTML = pvSvg({
      t0: 251335, t1: 251505, px: 5.4, step: 20,
      rows: [
        ['I²C: Bits', bits.slice(0, 8).map((b, k) => [...slot(k), b, BIT])],
        ['I²C: Address/data', [[S - 5, S + 5, 'S', 'sr-pv-start', true], [slot(0)[0], slot(6)[1], 'Address read: 08', 'sr-pv-data'], [...slot(7), 'Read', 'sr-pv-data'], [...slot(8), 'NACK', 'sr-pv-nack'], [e + 2, e + 12, 'P', 'sr-pv-stop', true]]],
      ],
      waves: [['D0 · SDA', sda], ['D1 · SCL', scl]],
      cursor: [slot(1)[0] + T / 2, slot(2)[0] + T / 2],
    }) + `
      <ol class="sr-ws-q">
        <li>Die beiden grünen Messcursor liegen auf zwei aufeinanderfolgenden steigenden Flanken des Takts. Berechne die Datenrate (Baudrate).</li>
        <li>Welche Adresse spricht der Controller an, und was will er tun?</li>
        <li>Was bedeutet das <b>NACK</b> am Ende?</li>
      </ol>
      <details class="v6-more"><summary>Lösung</summary>
        <ol class="sr-ws-q">
          <li>Ein Takt dauert <b>10 µs</b>, pro Takt wird ein Bit übertragen: 1 ÷ 0,00001 s = <b>100 000 Bit/s = 100 kbit/s</b> – der Standard Mode. Bei I²C spricht man statt von Baud meist von der <b>Taktfrequenz</b> (100 kHz).</li>
          <li>Die ersten 7 Bit <code>0001000</code> sind die Adresse <b>0x08</b> (MSB zuerst, direkt ablesbar). Das 8. Bit ist <b>1 = lesen</b>.</li>
          <li>Im 9. Takt hat niemand SDA auf Low gezogen: Unter der Adresse 0x08 <b>antwortet kein Teilnehmer</b>. Der Controller beendet die Übertragung mit der Stoppbedingung (P).</li>
        </ol>
      </details>`;
  })();

  // SPI: zwei Bytes, MOSI 0x00 und 0x4F (= 79), MISO jeweils 0xFF – Takt 1 µs wie auf dem Arbeitsblatt
  (function spiWs() {
    const T = 1, STARTS = [30, 39.2], MOSI = [0x00, 0x4F], MISO = [0xFF, 0xFF];
    const slot = (n, k) => [STARTS[n] + k * T, STARTS[n] + (k + 1) * T];
    const clk = [[0, 0]], mosi = [[0, 0]], miso = [[0, 1]];
    STARTS.forEach((_, n) => {
      for (let k = 0; k < 8; k++) {
        const [a] = slot(n, k);
        clk.push([a + T / 2, 1], [a + T, 0]);
        mosi.push([a, Number(bin(MOSI[n])[k])]);
        miso.push([a, Number(bin(MISO[n])[k])]);
      }
      mosi.push([slot(n, 7)[1], 0]);
    });
    const bitRow = (vals, cls) => STARTS.flatMap((_, n) => [...bin(vals[n])].map((b, k) => [...slot(n, k), b, cls]));
    const dataRow = (vals, cls) => STARTS.map((_, n) => [slot(n, 0)[0], slot(n, 7)[1], hex(vals[n]).slice(2), cls]);
    $('#sr-spi-ws').innerHTML = pvSvg({
      t0: 28, t1: 48, px: 44, step: 2,
      rows: [
        ['SPI: MISO bits', bitRow(MISO, 'sr-pv-stop')],
        ['SPI: MISO data', dataRow(MISO, 'sr-pv-data')],
        ['SPI: MOSI bits', bitRow(MOSI, 'sr-pv-mosi')],
        ['SPI: MOSI data', dataRow(MOSI, 'sr-pv-start')],
      ],
      waves: [['MISO', miso], ['MOSI', mosi], ['CLK', clk]],
      cursor: [slot(0, 0)[0] + T / 2, slot(0, 1)[0] + T / 2],
    }) + `
      <ol class="sr-ws-q">
        <li>Im Mitschnitt sieht man die Übertragung der Zahl 79. Die Messcursor liegen auf zwei aufeinanderfolgenden steigenden Flanken von CLK. Berechne die Datenrate (Baudrate).</li>
        <li>Auf welcher Leitung steht die 79, und wie liest man sie aus den Bits ab?</li>
        <li>Was hat der Subnode gleichzeitig zurückgeschickt?</li>
      </ol>
      <details class="v6-more"><summary>Lösung</summary>
        <ol class="sr-ws-q">
          <li>Ein Takt dauert <b>1 µs</b>, pro Takt ein Bit: 1 ÷ 0,000001 s = <b>1 000 000 Bit/s = 1 Mbit/s</b> – in jede Richtung, weil MOSI und MISO gleichzeitig senden.</li>
          <li>Auf <b>MOSI</b> (Main → Subnode) im zweiten Byte: <code>01001111</code>, MSB zuerst und damit direkt ablesbar: 0100 = 4, 1111 = F → <b>0x4F</b> = 4 · 16 + 15 = <b>79</b>. Im ersten Byte sendet der Main <code>00000000</code>.</li>
          <li>Auf <b>MISO</b> kommt beide Male <b>0xFF</b> (alle Bits 1). Bei SPI muss der Subnode in jedem Takt ein Bit liefern – hat er nichts zu sagen, ist es oft einfach 0xFF.</li>
        </ol>
      </details>`;
  })();
})();
