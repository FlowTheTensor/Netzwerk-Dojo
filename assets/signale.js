/* Kabel & Signale · Station 4: Leitungscodes – Taktproblem, Manchester, ASCII-Übung, Vergleich mit MLT-3 und PAM-5 */
'use strict';

// Manchester nach IEEE 802.3: 0 → 10 (fallende Flanke), 1 → 01 (steigende Flanke). Auch fürs Dojo.
const SIGNAL = (() => {
  const manchester = bits => [...bits].map(b => (b === '1' ? '01' : '10')).join('');
  // Rückwärts: Paare 10 → 0, 01 → 1, sonst null (ungültig)
  function decode(code) {
    const s = code.replace(/\s/g, '');
    if (s.length % 2) return null;
    let r = '';
    for (let i = 0; i < s.length; i += 2) {
      const p = s.slice(i, i + 2);
      if (p === '10') r += '0';
      else if (p === '01') r += '1';
      else return null;
    }
    return r;
  }
  const bin8 = n => n.toString(2).padStart(8, '0');
  return { manchester, decode, bin8 };
})();

(() => {
  const { $, $$, esc } = UI;
  const { manchester, bin8 } = SIGNAL;
  const pick = a => a[Math.floor(Math.random() * a.length)];

  // Stufenkurve: vals[i] gilt von x0 + i·step bis x0 + (i+1)·step; y(v) bildet den Wert auf die Höhe ab
  function steps(vals, x0, step, y) {
    let d = `M${x0} ${y(vals[0])}`;
    vals.forEach((v, i) => {
      if (i && v !== vals[i - 1]) d += `V${y(v)}`;
      d += `H${x0 + (i + 1) * step}`;
    });
    return d;
  }
  const row = (lbl, sub, y) => `<text x="8" y="${y - 2}" class="kb-lbl">${lbl}</text>${sub ? `<text x="8" y="${y + 14}" class="kb-sub">${sub}</text>` : ''}`;

  /* ---------- Taktproblem: Empfänger tastet mit leicht falschem Takt ab ---------- */
  (function drift() {
    const BITS = '010000000000111';
    const inp = $('#kb-drift');
    const N = BITS.length, X0 = 110, BW = 42, W = X0 + N * BW + 20;
    function render() {
      const d = Number(inp.value) / 100;
      $('#kb-drift-out').textContent = `${inp.value > 0 ? '+' : ''}${inp.value} %`;
      const y = v => (v === '1' ? 34 : 74);
      const samples = [];
      for (let k = 0; ; k++) {
        const t = (k + .5) * (1 + d);
        if (t >= N) break;
        samples.push([t, BITS[Math.floor(t)]]);
      }
      const got = samples.map(s => s[1]).join('');
      let h = row('Sender', 'sendet', 50);
      for (let i = 0; i <= N; i++) h += `<line x1="${X0 + i * BW}" x2="${X0 + i * BW}" y1="22" y2="86" class="kb-grid"/>`;
      [...BITS].forEach((b, i) => { h += `<text x="${X0 + (i + .5) * BW}" y="16" class="kb-bit" text-anchor="middle">${b}</text>`; });
      h += `<path d="${steps([...BITS], X0, BW, y)}" class="kb-sig kb-w-d"/>`;
      h += row('Empfänger', 'tastet ab', 124);
      samples.forEach(([t, b]) => {
        const x = X0 + t * BW;
        h += `<line x1="${x}" x2="${x}" y1="${y(b)}" y2="108" class="kb-tick"/><circle cx="${x}" cy="${y(b)}" r="4.5" class="kb-dot"/><text x="${x}" y="128" class="kb-bit got" text-anchor="middle">${b}</text>`;
      });
      $('#kb-drift-svg').innerHTML = `<svg viewBox="0 0 ${W} 140" class="kb-wave" style="min-width:560px">${h}</svg>`;
      const zeros = (s => (s.match(/^010*/)?.[0].length ?? 2) - 2)(got);
      $('#kb-drift-res').innerHTML = got === BITS
        ? `<p>Empfangen: <code>${got}</code> – alle ${N} Bit richtig. Bei so kleiner Abweichung geht es gerade noch gut.</p>`
        : `<p>Empfangen: <code>${got}</code> – <b>${got.length} statt ${N} Bit</b>, aus 10 Nullen werden <b>${zeros}</b>. Die Daten sind verfälscht.</p>`;
    }
    inp.addEventListener('input', render);
    render();
  })();

  /* ---------- Manchester-Diagramm ---------- */
  const inp = $('#kb-man-in');
  const bitsOf = () => (inp.value.replace(/[^01]/g, '').slice(0, 16) || '0');

  function manSvg(bits) {
    const N = bits.length, X0 = 110, BW = Math.max(36, Math.min(58, 760 / N)), W = X0 + N * BW + 16;
    const hi = (top, v) => (v ? top : top + 30);
    const code = manchester(bits);
    let h = '<defs><marker id="kb-arr" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 L10 5 L0 10 z" class="kb-arrhead"/></marker></defs>';
    for (let i = 0; i <= N; i++) h += `<line x1="${X0 + i * BW}" x2="${X0 + i * BW}" y1="14" y2="210" class="kb-grid"/>`;
    // Takt: in jeder Bitzeit erst 1, dann 0
    h += row('Takt', '', 40) + `<path d="${steps([...bits].flatMap(() => [1, 0]), X0, BW / 2, v => hi(20, v))}" class="kb-sig kb-w-c"/>`;
    h += row('Daten', '', 104) + `<path d="${steps([...bits].map(Number), X0, BW, v => hi(84, v))}" class="kb-sig kb-w-d"/>`;
    [...bits].forEach((b, i) => { h += `<text x="${X0 + (i + .5) * BW}" y="${hi(84, +b) + (b === '1' ? -6 : 18)}" class="kb-bit" text-anchor="middle">${b}</text>`; });
    h += row('Manchester', 'auf der Leitung', 168) + `<path d="${steps([...code].map(Number), X0, BW / 2, v => hi(150, v))}" class="kb-sig kb-w-m"/>`;
    [...bits].forEach((b, i) => {
      const x = X0 + (i + .5) * BW;
      h += b === '1'
        ? `<line x1="${x}" x2="${x}" y1="176" y2="156" class="kb-edge" marker-end="url(#kb-arr)"/>`
        : `<line x1="${x}" x2="${x}" y1="154" y2="174" class="kb-edge" marker-end="url(#kb-arr)"/>`;
      h += `<text x="${x}" y="204" class="kb-bit code" text-anchor="middle">${code.slice(2 * i, 2 * i + 2)}</text>`;
    });
    return `<svg viewBox="0 0 ${W} 214" class="kb-wave" style="min-width:${Math.min(W, 560)}px">${h}</svg>`;
  }

  function renderMan() {
    const bits = bitsOf();
    inp.classList.toggle('bad', /[^01\s]/.test(inp.value) || inp.value.replace(/\s/g, '').length > 16);
    $('#kb-man-svg').innerHTML = manSvg(bits);
    const code = manchester(bits);
    $('#kb-man-txt').innerHTML = `<p>Datenbits <code>${bits}</code> → Leitungscode <code>${code}</code> · ${bits.length} Bit, ${code.length} Signalschritte, <b>${bits.length} Flanken in der Bitmitte</b>.</p>`;
    renderCmp(bits);
  }
  inp.addEventListener('input', renderMan);
  $$('[data-bits]').forEach(b => b.addEventListener('click', () => { inp.value = b.dataset.bits; renderMan(); }));

  /* ---------- Vergleich: Manchester, MLT-3, PAM-5 (vereinfacht) ---------- */
  function renderCmp(bits) {
    const b = bits.length % 2 ? bits + '0' : bits;
    const N = b.length, X0 = 110, BW = Math.max(36, Math.min(58, 760 / N)), W = X0 + N * BW + 16;
    // MLT-3: bei 1 eine Stufe weiter im Kreis 0, +1, 0, −1
    const CYCLE = [0, 1, 0, -1];
    let pos = 0;
    const mlt = [...b].map(x => { if (x === '1') pos = (pos + 1) % 4; return CYCLE[pos]; });
    // PAM-5 vereinfacht: je 2 Bit eine der Stufen −2, −1, +1, +2 (0 bleibt für den Fehlerschutz)
    const PAM = { '00': -2, '01': -1, '10': 1, '11': 2 };
    const pam = [];
    for (let i = 0; i < N; i += 2) pam.push(PAM[b.slice(i, i + 2)]);
    const rows = [
      ['Manchester', `${2 * N} Schritte`, [...manchester(b)].map(Number), BW / 2, 1, 'kb-w-m'],
      ['MLT-3', `${N} Schritte`, mlt, BW, 1, 'kb-w-3'],
      ['PAM-5', `${N / 2} Schritte`, pam, BW * 2, 2, 'kb-w-5'],
    ];
    let h = '';
    for (let i = 0; i <= N; i++) h += `<line x1="${X0 + i * BW}" x2="${X0 + i * BW}" y1="16" y2="${rows.length * 92 + 10}" class="kb-grid${i % 2 ? '' : ' strong'}"/>`;
    [...b].forEach((x, i) => { h += `<text x="${X0 + (i + .5) * BW}" y="12" class="kb-bit" text-anchor="middle">${x}</text>`; });
    rows.forEach(([lbl, sub, vals, step, max, cls], r) => {
      const mid = 60 + r * 92;
      const y = v => mid - (v / max) * 28;
      h += row(lbl, sub, mid - 4) + `<line x1="${X0}" x2="${X0 + N * BW}" y1="${mid}" y2="${mid}" class="kb-axis"/>`;
      h += `<path d="${steps(vals, X0, step, y)}" class="kb-sig ${cls}"/>`;
      if (lbl === 'PAM-5') pam.forEach((v, i) => { h += `<text x="${X0 + (i + .5) * step}" y="${y(v) + (v > 0 ? -6 : 16)}" class="kb-bit code" text-anchor="middle">${b.slice(2 * i, 2 * i + 2)}</text>`; });
    });
    $('#kb-cmp-svg').innerHTML = `<svg viewBox="0 0 ${W} ${rows.length * 92 + 16}" class="kb-wave" style="min-width:${Math.min(W, 560)}px">${h}</svg>`;
  }
  renderMan();

  /* ---------- ASCII-Übung: zwei Manchester-codierte Zeichen ---------- */
  (function ascii() {
    const el = $('#kb-ascii');
    const POOL = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!?#@';
    let chars;
    function task(first = false) {
      chars = first ? ['O', 'K'] : [pick([...POOL]), pick([...POOL])];
      render();
    }
    function render() {
      const codes = chars.map(c => manchester(bin8(c.charCodeAt(0))));
      el.innerHTML = `
        <div class="kb-asc-code">${codes.map((c, i) => `<div><small>${i + 1}. Zeichen · Manchester-Code</small><code>${c.replace(/(..)/g, '$1 ').trim()}</code></div>`).join('')}</div>
        <div class="kb-asc-grid">${chars.map((c, i) => `
          <div class="kb-asc-col">
            <h3>${i + 1}. Zeichen</h3>
            <label class="field"><span>Empfangene Bits</span><input data-k="bits" data-i="${i}" placeholder="8 Bit" spellcheck="false" autocomplete="off"></label>
            <label class="field"><span>ASCII-Wert (dezimal)</span><input data-k="dec" data-i="${i}" inputmode="numeric" placeholder="z. B. 65" autocomplete="off"></label>
            <label class="field"><span>Zeichen</span><input data-k="chr" data-i="${i}" maxlength="1" spellcheck="false" autocomplete="off"></label>
          </div>`).join('')}</div>
        <div class="osi-pz-fb" aria-live="polite"></div>
        <div class="row-actions">
          <button type="button" class="btn primary" data-act="check">Prüfen</button>
          <button type="button" class="btn" data-act="new">Neue Aufgabe</button>
          <button type="button" class="btn ghost" data-act="solve">Lösung zeigen</button>
        </div>`;
    }
    const want = (k, i) => {
      const n = chars[i].charCodeAt(0);
      return { bits: bin8(n), dec: String(n), chr: chars[i] }[k];
    };
    function check() {
      let right = 0;
      $$('input[data-k]', el).forEach(f => {
        const v = f.value.replace(/\s/g, '');
        const ok = v === want(f.dataset.k, Number(f.dataset.i));
        f.classList.toggle('bad', !ok);
        f.classList.toggle('good', ok);
        if (ok) right++;
      });
      const fb = $('.osi-pz-fb', el);
      if (right === 6) {
        fb.innerHTML = `<p class="osi-pz-done">Richtig! Empfangen wurde „${esc(chars.join(''))}“.</p>`;
        FX.burstFrom(fb.firstChild);
      } else {
        fb.innerHTML = `<p>${right} von 6 Feldern richtig. Tipp: Teile den Code in Zweiergruppen – <code>10</code> ist eine 0, <code>01</code> eine 1.</p>`;
      }
    }
    el.addEventListener('click', e => {
      const act = e.target.closest('[data-act]')?.dataset.act;
      if (act === 'new') task();
      if (act === 'check') check();
      if (act === 'solve') {
        $$('input[data-k]', el).forEach(f => { f.value = want(f.dataset.k, Number(f.dataset.i)); });
        check();
        $('.osi-pz-fb', el).innerHTML = `<p>Lösung: ${chars.map(c => `<code>${bin8(c.charCodeAt(0))}</code> = ${c.charCodeAt(0)} = „${esc(c)}“`).join(' · ')}</p>`;
      }
    });
    el.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.matches('input[data-k]')) check(); });

    let t = '';
    for (let n = 32; n <= 126; n++) t += `<span><b>${n}</b>${n === 32 ? '<i>Leer</i>' : esc(String.fromCharCode(n))}</span>`;
    $('#kb-ascii-tbl').innerHTML = t;
    task(true);
  })();
})();
