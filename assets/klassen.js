/* Station 3 – Klasse C oder /16? */
'use strict';

(() => {
  const { $, $$ } = UI;
  const F = IPv4.format;
  const fmt = IPv4.fmtNum;

  /* Block-Explorer
     Einheit in allen Blöcken: ein Kästchen = ein /24 (256 Adressen).
     cols = Kästchen pro Zeile, damit jeder Block ein Quadrat ergibt. */
  const U = 24;
  const BLOCKS = [
    { start: IPv4.parse('192.168.0.0'), p: 16, clsP: 24, cls: 'C', cols: 16,
      layout: '16 × 16 = 256 Kästchen. Die Zahl im Kästchen ist das 3. Oktett.',
      note: 'Jedes Kästchen ist genau ein „Klasse-C-Netz“ aus dem Schulbuch. Der RFC-1918-Block 192.168.0.0/16 enthält 256 davon.' },
    { start: IPv4.parse('172.16.0.0'), p: 12, clsP: 16, cls: 'B', cols: 64,
      layout: '64 × 64 = 4.096 Kästchen. Je 4 Zeilen bilden ein /16 (172.16, 172.17, … 172.31).',
      note: 'Der Block enthält 16 „Klasse-B-Netze“ – jedes davon ist so groß wie der komplette 192.168-Block (256 Kästchen).' },
    { start: IPv4.parse('10.0.0.0'), p: 8, clsP: 8, cls: 'A', cols: 256,
      layout: '256 × 256 = 65.536 Kästchen. Zeile = 2. Oktett, Spalte = 3. Oktett.',
      note: 'Der ganze Block ist EIN „Klasse-A-Netz“. Jede einzelne Zeile (ein /16) ist schon so groß wie der komplette 192.168-Block!' },
  ];

  let bi = 0;
  let sp = 16;
  let hover = null;
  let trueScale = false;

  const tabs = $('#k-tabs');
  const slider = $('#k-prefix');
  const wrap = $('#k-wrap');
  const canvas = $('#k-canvas');
  const ctx = canvas.getContext('2d');

  // Flächentreuer Größenvergleich (Seitenlänge ~ Wurzel der Adressanzahl)
  $('#k-compare').innerHTML = `
    <div class="cmp-box" aria-hidden="true">
      <button type="button" class="cmp sq-a" data-b="2" tabindex="-1"></button>
      <button type="button" class="cmp sq-b" data-b="1" tabindex="-1"></button>
      <button type="button" class="cmp sq-c" data-b="0" tabindex="-1"></button>
    </div>
    <ul class="cmp-legend">
      <li><i class="sq-a"></i><span><b>10.0.0.0/8</b> · ${fmt(IPv4.size(8))} Adressen<small>= 1 Klasse-A-Netz = 65.536 × /24</small></span></li>
      <li><i class="sq-b"></i><span><b>172.16.0.0/12</b> · ${fmt(IPv4.size(12))} Adressen<small>= 16 Klasse-B-Netze = 4.096 × /24 · 1/16 von 10/8</small></span></li>
      <li><i class="sq-c"></i><span><b>192.168.0.0/16</b> · ${fmt(IPv4.size(16))} Adressen<small>= 256 Klasse-C-Netze = 256 × /24 · nur 1/256 von 10/8</small></span></li>
    </ul>`;

  tabs.innerHTML = BLOCKS.map((b, i) => `<button type="button" data-b="${i}"><b>${F(b.start)}/${b.p}</b></button>`).join('');

  // Ränder für die Beschriftung: links Startadressen, oben Versatz im 3. Oktett, unten Blockende
  const LW = 104;
  const TH = 22;
  const BH = 20;
  const MONO = '"JetBrains Mono", ui-monospace, Consolas, monospace';

  function geometry() {
    const b = BLOCKS[bi];
    const cells = 2 ** (U - b.p);
    const avail = Math.max(64, Math.min((wrap.clientWidth || 620) - LW - 6, 512));
    // Maßstabsgetreu: 10/8 füllt die volle Breite, die anderen entsprechend kleiner
    const w = trueScale ? avail * b.cols / 256 : avail;
    const cell = w / b.cols;
    return { b, cells, cols: b.cols, rows: cells / b.cols, cell, w, h: (cells / b.cols) * cell };
  }

  // Beschriftung der Netzgrenzen; zu dicht stehende Grenzen werden ausgedünnt
  function drawLabels(g, per, ink, muted) {
    const { b, cols, rows, cell, w, h } = g;
    const rowsPerNet = per / cols;
    let stepR = Math.max(1, rowsPerNet);
    while (stepR * cell < 15 && stepR < rows) stepR *= 2;

    ctx.font = `600 11px ${MONO}`;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'right';
    ctx.strokeStyle = muted;
    ctx.lineWidth = 1;
    for (let r = 0; r < rows; r += stepR) {
      const y = r * cell;
      ctx.fillStyle = ink;
      ctx.fillText(F(b.start + r * cols * 256), -9, y);
      ctx.beginPath();
      ctx.moveTo(-6, y + 0.5);
      ctx.lineTo(0, y + 0.5);
      ctx.stroke();
    }
    ctx.fillStyle = muted;
    ctx.fillText(F(b.start + g.cells * 256 - 1), -9, h);
    ctx.beginPath();
    ctx.moveTo(-6, h - 0.5);
    ctx.lineTo(0, h - 0.5);
    ctx.stroke();

    // Mehrere Netze pro Zeile: oben den Versatz im 3. Oktett anzeigen
    let note = '';
    if (per < cols) {
      let stepC = per;
      while (stepC * cell < 26 && stepC < cols) stepC *= 2;
      if (stepC < cols) {
        ctx.textAlign = 'center';
        for (let c = 0; c < cols; c += stepC) {
          const x = c * cell;
          ctx.fillStyle = ink;
          ctx.fillText('+' + c, x, -11);
          ctx.beginPath();
          ctx.moveTo(x + 0.5, -5);
          ctx.lineTo(x + 0.5, 0);
          ctx.stroke();
        }
        ctx.textAlign = 'right';
        ctx.fillStyle = muted;
        ctx.fillText('3. Okt. →', -16, -11);
        note = 'Links steht die Startadresse der Zeile, oben der Wert, der im 3. Oktett dazukommt – z. B. Zeilenanfang + 4 = Start des nächsten Netzes.';
        if (stepC > per) note += ` Oben ist nur jede ${stepC / per}. Grenze beschriftet.`;
      } else {
        note = 'Die Netze sind schmaler als die Beschriftung – links steht nur die Startadresse der Zeilen.';
      }
    } else if (stepR > rowsPerNet) {
      note = `Aus Platzgründen ist links nur jedes ${stepR / rowsPerNet}. Netz beschriftet.`;
    }
    $('#k-label-note').textContent = note;
  }

  function draw() {
    const g = geometry();
    const { b, cols, cell } = g;
    const dpr = window.devicePixelRatio || 1;
    $('#k-true-note').textContent = trueScale && b.cols < 256
      ? `↑ Im gleichen Maßstab wäre 10.0.0.0/8 ${256 / b.cols}-mal so breit und ${256 / b.cols}-mal so hoch.`
      : '';
    const cw = LW + g.w + 4;
    const chh = TH + g.h + BH;
    canvas.style.width = cw + 'px';
    canvas.style.height = chh + 'px';
    canvas.width = Math.round(cw * dpr);
    canvas.height = Math.round(chh * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, LW * dpr, TH * dpr);

    const css = getComputedStyle(document.documentElement);
    const light = parseFloat(css.getPropertyValue('--cell-l')) || 80;
    const ink = css.getPropertyValue('--ink').trim();
    const muted = css.getPropertyValue('--muted').trim();
    const accent = css.getPropertyValue('--accent').trim();
    const per = 2 ** (U - sp); // Kästchen pro Netz
    drawLabels(g, per, ink, muted);
    const nets = g.cells / per;
    const hovNet = hover === null ? -1 : Math.floor(hover / per);
    const gap = cell >= 6 ? 1 : 0;
    // Farbton verläuft über den Block, benachbarte Netze wechseln hell/dunkel
    const colorOf = n => {
      if (n === hovNet) return accent;
      const hue = nets === 1 ? 210 : 200 + (n / nets) * 280;
      const parity = per >= cols ? n : n + Math.floor(n * per / cols); // Schachbrett, wenn mehrere Netze pro Zeile
      const dark = nets > 1 && parity % 2 === 1;
      return `hsl(${hue.toFixed(1)}, 60%, ${dark ? light - 14 : light}%)`;
    };
    let last = -1;
    for (let c = 0; c < g.cells; c++) {
      const n = Math.floor(c / per);
      if (n !== last) {
        ctx.fillStyle = colorOf(n);
        last = n;
      }
      ctx.fillRect((c % cols) * cell, Math.floor(c / cols) * cell, cell - gap, cell - gap);
    }

    if (cell >= 22) {
      ctx.fillStyle = ink;
      ctx.font = `600 ${Math.min(12, cell * 0.4)}px ui-monospace, Consolas, monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      for (let c = 0; c < g.cells; c++) {
        const third = ((b.start + c * 256) >>> 8) & 255;
        ctx.fillText(third, (c % cols) * cell + (cell - gap) / 2, Math.floor(c / cols) * cell + (cell - gap) / 2 + 0.5);
      }
    }

    // Netz unter dem Mauszeiger umranden – Netze sind im Raster immer Rechtecke
    if (hover !== null) {
      const start = Math.floor(hover / per) * per;
      const x = per <= cols ? (start % cols) * cell : 0;
      const y = Math.floor(start / cols) * cell;
      const w = per <= cols ? per * cell : cols * cell;
      const h = per <= cols ? cell : (per / cols) * cell;
      ctx.strokeStyle = ink;
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 1, y + 1, Math.max(w - 2, 1), Math.max(h - 2, 1));
    }
  }

  function render() {
    const b = BLOCKS[bi];
    $$('button', tabs).forEach((t, i) => t.classList.toggle('active', i === bi));
    $$('#k-compare .cmp').forEach(t => t.classList.toggle('active', Number(t.dataset.b) === bi));
    $('#k-prefix-out').textContent = '/' + sp;
    $('#k-scale').innerHTML = `<b>${F(b.start)}/${b.p}</b>: ${b.layout}`;

    const total = 2 ** (sp - b.p);
    let info = `<b>${F(b.start)}/${b.p}</b> mit Präfix <b>/${sp}</b> → <b>${fmt(total)} Netz${total > 1 ? 'e' : ''}</b> mit je ${fmt(IPv4.size(sp))} Adressen (${fmt(IPv4.hosts(sp))} nutzbar).`;
    info += ` Ein Netz = ${fmt(2 ** (U - sp))} Kästchen.`;
    if (sp === b.p) info += ' <span class="tag">So steht es in RFC 1918</span>';
    if (sp === b.clsP) info += ` <span class="tag tag-alt">= Klasse-${b.cls}-Netze (Schulbuch)</span>`;
    $('#k-info').innerHTML = info;
    $('#k-note').textContent = b.note;
    draw();
  }

  function selectBlock(i) {
    bi = i;
    hover = null;
    slider.min = BLOCKS[i].p;
    sp = BLOCKS[i].p;
    slider.value = sp;
    $('#k-hover').textContent = 'Fahre über ein Kästchen.';
    render();
  }

  tabs.addEventListener('click', e => {
    const t = e.target.closest('[data-b]');
    if (t) selectBlock(Number(t.dataset.b));
  });
  $('#k-compare').addEventListener('click', e => {
    const t = e.target.closest('[data-b]');
    if (t) selectBlock(Number(t.dataset.b));
  });
  slider.addEventListener('input', () => { sp = Number(slider.value); render(); });
  $('#k-true').addEventListener('change', e => { trueScale = e.target.checked; draw(); });

  canvas.addEventListener('pointermove', e => {
    const g = geometry();
    const r = canvas.getBoundingClientRect();
    const col = Math.floor((e.clientX - r.left - LW) / g.cell);
    const row = Math.floor((e.clientY - r.top - TH) / g.cell);
    if (col < 0 || row < 0 || col >= g.cols || row >= g.rows) {
      if (hover !== null) { hover = null; draw(); }
      return;
    }
    const c = row * g.cols + col;
    if (c === hover) return;
    hover = c;
    const cs = g.b.start + c * 256;
    const n = IPv4.network(cs, sp);
    $('#k-hover').innerHTML = `Kästchen <b>${F(cs)}/24</b> gehört zum Netz <b>${F(n)}/${sp}</b> (${F(n)} – ${F(IPv4.broadcast(n, sp))}).`;
    draw();
  });
  canvas.addEventListener('pointerleave', () => { hover = null; draw(); });

  window.addEventListener('resize', draw);
  document.addEventListener('pagechange', e => { if (e.detail === 'klassen') draw(); });
  matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', draw);
  selectBlock(0);

  // Klassen-Tester
  const tIn = $('#k-test');
  const marker = $('#k-marker');
  function test() {
    const a = IPv4.parse(tIn.value);
    const outEl = $('#k-test-out');
    $$('#k-bar > div[class^="seg-"]').forEach(s => s.classList.remove('hit'));
    if (a === null) {
      tIn.classList.add('bad');
      marker.hidden = true;
      outEl.innerHTML = '<p class="err-text">Bitte eine gültige IPv4-Adresse eingeben.</p>';
      return;
    }
    tIn.classList.remove('bad');
    const c = IPv4.classOf(a);
    const o = a >>> 24;
    const b8 = o.toString(2).padStart(8, '0');
    const blk = IPv4.privateBlock(a);
    marker.hidden = false;
    marker.style.left = ((o + 0.5) / 256 * 100) + '%';
    marker.querySelector('span').textContent = o;
    const seg = $(`#k-bar .seg-${c.cls.toLowerCase()}`);
    if (seg) seg.classList.add('hit');
    const detail = c.prefix
      ? `, Standardmaske /${c.prefix} (${F(IPv4.mask(c.prefix))}) – Klassennetz <b>${F(IPv4.network(a, c.prefix))}/${c.prefix}</b>`
      : (c.cls === 'D' ? ' (Multicast)' : ' (reserviert)');
    outEl.innerHTML =
      `<p class="lead-bits"><code><mark>${b8.slice(0, c.lead.length)}</mark>${b8.slice(c.lead.length)}</code> <span class="muted">= erstes Oktett ${o}</span></p>` +
      `<p>Führende Bits <code>${c.lead}</code> → <b>Klasse ${c.cls}</b>${detail}.</p>` +
      `<p>${blk ? `🔒 Privat nach RFC 1918: Block <b>${blk.cidr}</b> (${blk.classful}).` : '🌍 Nicht privat nach RFC 1918.'}</p>`;
  }
  tIn.addEventListener('input', test);
  test();
})();
