/* Kabel & Signale · Stationen 1–3: Kabelarten, Schirmung, Kategorien, RJ45-Werkstatt */
'use strict';

// Gemeinsame Daten, auch für das Kabel-Dojo
const KABEL = (() => {
  const T568A = ['grün-weiß', 'grün', 'orange-weiß', 'blau', 'blau-weiß', 'orange', 'braun-weiß', 'braun'];
  const T568B = ['orange-weiß', 'orange', 'grün-weiß', 'blau', 'blau-weiß', 'grün', 'braun-weiß', 'braun'];
  // Gigabit-Crossover: Pin links → Pin rechts (1↔3, 2↔6, 4↔7, 5↔8)
  const XO = [3, 6, 1, 7, 8, 2, 4, 5];
  const COLOR = { orange: '#E07B17', 'grün': '#2E9B48', blau: '#2B66C9', braun: '#86562B' };
  const base = w => w.split('-')[0];
  const striped = w => w.endsWith('-weiß');

  // [Kategorie, Klasse, MHz, Einsatz]
  const CATS = [
    ['5e', 'D', 100, '1000BASE-T, 2.5GBASE-T'],
    ['6', 'E', 250, '1000BASE-T, 5GBASE-T, 10GBASE-T bis 55 m'],
    ['6A', 'E<sub>A</sub>', 500, '10GBASE-T bis 100 m – heute Standard für neue Installationen'],
    ['7', 'F', 600, 'Verlegekabel (meist S/FTP); mit RJ45-Dosen als Kat.-6A-Strecke genutzt'],
    ['7A', 'F<sub>A</sub>', 1000, 'Verlegekabel; volle Leistung nur mit GG45-, TERA- oder ARJ45-Steckern'],
    ['8.1', 'I', 2000, '25GBASE-T, 40GBASE-T bis 30 m, mit RJ45'],
    ['8.2', 'II', 2000, '25GBASE-T, 40GBASE-T bis 30 m, mit TERA oder ARJ45'],
  ];

  // Ader als Farbfeld (HTML) – weiß gestreifte Adern mit Streifenmuster
  const swatch = w => `<i class="kb-sw${striped(w) ? ' st' : ''}" style="--w:${COLOR[base(w)]}"></i>`;

  return { T568A, T568B, XO, COLOR, CATS, base, striped, swatch };
})();

(() => {
  const { $, $$, esc } = UI;
  const { T568A, T568B, XO, COLOR, CATS, base, striped, swatch } = KABEL;
  const shuffle = a => {
    const r = [...a];
    for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; }
    return r;
  };

  /* ---------- Kabelquerschnitte ---------- */
  const ring = (r, cls) => `<circle r="${r}" class="${cls}"/>`;
  // Twisted-Pair-Querschnitt; outer: U, F, S, SF · pair: U, F
  function tpSvg(outer = 'U', pair = 'U') {
    let h = ring(94, 'kb-jacket') + ring(86, 'kb-fill');
    if (outer.includes('S')) h += ring(82, 'kb-braid');
    if (outer.includes('F')) h += ring(outer === 'SF' ? 76 : 82, 'kb-foil');
    [['orange', -1, -1], ['grün', 1, -1], ['blau', -1, 1], ['braun', 1, 1]].forEach(([c, sx, sy]) => {
      const x = sx * 34, y = sy * 34;
      if (pair === 'F') h += `<circle cx="${x}" cy="${y}" r="27" class="kb-foil"/>`;
      [[-10, false], [10, true]].forEach(([dx, st]) => {
        const cx = x + dx * sx, cy = y - dx * sy;
        h += st
          ? `<circle cx="${cx}" cy="${cy}" r="11" fill="#fff" stroke="${COLOR[c]}" stroke-width="4" stroke-dasharray="5 4"/>`
          : `<circle cx="${cx}" cy="${cy}" r="11" fill="${COLOR[c]}"/>`;
        h += `<circle cx="${cx}" cy="${cy}" r="4.5" class="kb-cu"/>`;
      });
    });
    return `<svg viewBox="-100 -100 200 200" class="kb-xsvg" role="img" aria-label="Querschnitt ${esc(outer)}/${esc(pair)}TP">${h}</svg>`;
  }
  const koaxSvg = () => `<svg viewBox="-100 -100 200 200" class="kb-xsvg" role="img" aria-label="Querschnitt Koaxialkabel">
    ${ring(94, 'kb-jacket')}${ring(80, 'kb-braid wide')}${ring(70, 'kb-diel')}<circle r="16" class="kb-cu"/></svg>`;
  const lwlSvg = () => `<svg viewBox="-100 -100 200 200" class="kb-xsvg" role="img" aria-label="Querschnitt Glasfaser">
    ${ring(94, 'kb-jacket lwl')}${ring(70, 'kb-coat')}${ring(46, 'kb-clad')}<circle r="12" class="kb-core"/></svg>`;
  $$('.kb-x[data-x]').forEach(el => { el.innerHTML = { koax: koaxSvg, tp: () => tpSvg(), lwl: lwlSvg }[el.dataset.x](); });

  /* ---------- Station 1: Differenzsignal ---------- */
  (function diff() {
    const el = $('#kb-diff');
    const inp = $('#kb-noise');
    const BITS = [1, 0, 1, 1, 0, 0, 1, 0, 1, 0];
    const W = 640, N = 400, X0 = 120;
    const noise = t => Math.sin(t * 9.3) * .6 + Math.sin(t * 23.1 + 1) * .3 + Math.sin(t * 3.7 + 2) * .5;
    function line(f, y0, amp, cls) {
      let d = '';
      for (let i = 0; i <= N; i++) {
        const t = i / N;
        d += `${i ? 'L' : 'M'}${(X0 + t * (W - X0 - 10)).toFixed(1)} ${(y0 - f(t) * amp).toFixed(1)}`;
      }
      return `<path d="${d}" class="${cls}"/>`;
    }
    function render() {
      const k = inp.value / 100;
      $('#kb-noise-out').textContent = `${inp.value} %`;
      const s = t => (BITS[Math.min(BITS.length - 1, Math.floor(t * BITS.length))] ? 1 : -1);
      const rows = [
        ['Ader a', 'Signal + Störung', t => s(t) + k * noise(t * 6), 'kb-w-a', 14],
        ['Ader b', '−Signal + Störung', t => -s(t) + k * noise(t * 6), 'kb-w-b', 14],
        ['Empfänger', 'a − b', t => (s(t) + k * noise(t * 6)) - (-s(t) + k * noise(t * 6)), 'kb-w-r', 9],
      ];
      el.innerHTML = `<svg viewBox="0 0 ${W} 300" class="kb-wave">${rows.map(([n, sub, f, cls, amp], i) => {
        const y = 50 + i * 100;
        return `<text x="8" y="${y - 4}" class="kb-lbl">${n}</text><text x="8" y="${y + 14}" class="kb-sub">${sub}</text>
          <line x1="${X0}" x2="${W - 10}" y1="${y}" y2="${y}" class="kb-axis"/>${line(f, y, amp * 1.6, 'kb-sig ' + cls)}`;
      }).join('')}</svg>`;
    }
    inp.addEventListener('input', render);
    render();
  })();

  /* ---------- Station 1: Schirmungs-Decoder ---------- */
  (function shield() {
    const inp = $('#kb-sh-in');
    const OUTER = { U: 'kein Gesamtschirm', F: 'Gesamtschirm aus <b>Folie</b>', S: 'Gesamtschirm aus <b>Drahtgeflecht</b>', SF: 'Gesamtschirm aus <b>Geflecht und Folie</b>' };
    const PAIR = { U: 'Paare <b>nicht einzeln</b> geschirmt', F: 'jedes Paar mit eigener <b>Folie</b>' };
    function render() {
      const v = inp.value.trim().toUpperCase().replace(/\s/g, '');
      const m = v.match(/^(U|F|S|SF)\/(U|F)TP$/);
      inp.classList.toggle('bad', !m);
      if (!m) {
        $('#kb-sh-out').innerHTML = `<p class="field-fb">Form <code>XX/YTP</code>, z. B. <code>U/UTP</code> oder <code>S/FTP</code>. Erlaubt: vorne U, F, S oder SF, hinten U oder F.</p>`;
        return;
      }
      const [, o, p] = m;
      const old = { 'U/U': 'früher einfach „UTP“', 'U/F': 'früher oft „FTP“ oder „STP“', 'S/F': 'früher „S/STP“ oder „PiMF“', 'F/U': 'früher „FTP“ oder „ScTP“', 'S/U': 'früher „S/UTP“' }[`${o}/${p}`];
      $('#kb-sh-out').innerHTML = `<ul class="ticks kb-sh-list"><li><code>${o}</code>/… → ${OUTER[o]}</li><li>…/<code>${p}</code>TP → ${PAIR[p]}</li>${old ? `<li class="muted">${old}</li>` : ''}</ul>`;
      $('#kb-sh-svg').innerHTML = tpSvg(o, p) + `<div class="legend kb-x-legend"><span><i class="sw kb-sw-foil"></i>Folie</span><span><i class="sw kb-sw-braid"></i>Geflecht</span><span><i class="sw kb-sw-cu"></i>Kupferleiter</span></div>`;
    }
    inp.addEventListener('input', render);
    $$('[data-sh]').forEach(b => b.addEventListener('click', () => { inp.value = b.dataset.sh; render(); }));
    render();
  })();

  /* ---------- Station 2: Kategorien ---------- */
  $('#kb-cat-body').innerHTML = CATS.map(([k, c, mhz, use]) => `<tr><td><b>Kat. ${k}</b></td><td>Klasse ${c}</td><td>${mhz.toLocaleString('de-DE')} MHz</td>
    <td class="kb-bar-td"><span class="kb-bar" style="width:${Math.round(mhz / 20)}%"></span></td><td>${use}</td></tr>`).join('');

  (function need() {
    const rate = $('#kb-need-rate');
    const len = $('#kb-need-len');
    function advise(r, m) {
      if (m > 100) return { cat: null, txt: `Twisted Pair schafft höchstens <b>100 m</b>. Für ${m} m brauchst du <b>Glasfaser</b> – oder einen Switch in der Mitte.` };
      if (r === 1 || r === 2.5) return { cat: '5e', txt: 'Schon Kat. 5e reicht für die volle Länge von 100 m. Für 2,5 Gbit/s wurde 2.5GBASE-T genau dafür entwickelt: vorhandene Kabel weiter nutzen, z. B. für schnelle WLAN-Access-Points.' };
      if (r === 5) return { cat: '6', txt: '5GBASE-T ist für Kat. 6 auf 100 m ausgelegt. Mit Kat. 5e klappt es oft auch, garantiert ist es aber nicht.' };
      if (r === 10) {
        return m <= 55
          ? { cat: '6', txt: 'Bis 55 m schafft auch Kat. 6 noch 10 Gbit/s. Sicherer und für die volle Länge geeignet ist Kat. 6A.' }
          : { cat: '6A', txt: 'Für 10GBASE-T auf mehr als 55 m braucht man <b>Kat. 6A</b> (500 MHz) – Kabel, Dosen, Stecker und Patchkabel.' };
      }
      return m <= 30
        ? { cat: '8.1', txt: '25GBASE-T und 40GBASE-T gibt es nur mit Kat. 8 und nur bis <b>30 m</b> – gedacht für kurze Verbindungen im Rechenzentrum.' }
        : { cat: null, txt: `Kat. 8 schafft nur 30 m. Für ${m} m mit 25 oder 40 Gbit/s nimmt man <b>Glasfaser</b>.` };
    }
    function render() {
      const m = Number(len.value);
      $('#kb-need-len-out').textContent = `${m} m`;
      const a = advise(Number(rate.value), m);
      $('#kb-need-out').innerHTML = `<div class="kb-need-cat${a.cat ? '' : ' lwl'}">${a.cat ? `mindestens<b>Kat. ${a.cat}</b>` : 'Kupfer<b>reicht nicht</b>'}</div><p>${a.txt}</p>`;
    }
    rate.addEventListener('change', render);
    len.addEventListener('input', render);
    render();
  })();

  /* ---------- Station 3: T568A und T568B ---------- */
  const pinList = (name, wires, other) => `<div class="kb-std"><h3>${name}</h3><ol class="kb-pins">${wires.map((w, i) =>
    `<li class="${w !== other[i] ? 'diff' : ''}"><span class="kb-pin-no">${i + 1}</span>${swatch(w)}<span>${w}</span></li>`).join('')}</ol></div>`;
  $('#kb-ab').innerHTML = pinList('T568A', T568A, T568B) + pinList('T568B', T568B, T568A);

  // Zwei Stecker nebeneinander, Adern als Kurven zwischen den Pins
  const PY = i => 40 + i * 34;
  function wirePath(x1, y1, x2, y2, w, extra = '') {
    const xm = (x1 + x2) / 2;
    const d = `M${x1} ${y1} C${xm} ${y1} ${xm} ${y2} ${x2} ${y2}`;
    const c = COLOR[base(w)];
    return striped(w)
      ? `<g ${extra}><path d="${d}" class="kb-cable-w" stroke="#fff"/><path d="${d}" class="kb-cable-w" stroke="${c}" stroke-dasharray="9 7"/><path d="${d}" class="kb-cable-o"/></g>`
      : `<g ${extra}><path d="${d}" class="kb-cable-w" stroke="${c}"/></g>`;
  }
  function plugs(left, right, body, { clickable = false, titles = ['Stecker 1', 'Stecker 2'] } = {}) {
    const XL = 230, XR = 470;
    let h = `<text x="${XL - 40}" y="16" class="kb-lbl" text-anchor="middle">${titles[0]}</text><text x="${XR + 40}" y="16" class="kb-lbl" text-anchor="middle">${titles[1]}</text>`;
    h += `<rect x="${XL - 70}" y="24" width="72" height="${8 * 34}" rx="8" class="kb-plug"/><rect x="${XR - 2}" y="24" width="72" height="${8 * 34}" rx="8" class="kb-plug"/>`;
    for (let i = 0; i < 8; i++) {
      const y = PY(i);
      h += `<text x="${XL - 80}" y="${y + 4}" class="kb-plbl" text-anchor="end">${left[i]}</text>
        <g class="kb-pinbox${clickable ? ' click' : ''}" data-side="l" data-i="${i}" tabindex="${clickable ? 0 : -1}"><rect x="${XL - 26}" y="${y - 11}" width="26" height="22" rx="4"/><text x="${XL - 13}" y="${y + 4}" text-anchor="middle">${i + 1}</text></g>
        <g class="kb-pinbox${clickable ? ' click' : ''}" data-side="r" data-i="${i}" tabindex="${clickable ? 0 : -1}"><rect x="${XR}" y="${y - 11}" width="26" height="22" rx="4"/><text x="${XR + 13}" y="${y + 4}" text-anchor="middle">${i + 1}</text></g>
        <text x="${XR + 80}" y="${y + 4}" class="kb-plbl">${right[i]}</text>`;
    }
    return `<svg viewBox="0 0 700 ${8 * 34 + 40}" class="kb-wsvg">${body(XL, XR)}${h}</svg>`;
  }

  /* ---------- Station 3: Crimp-Übung ---------- */
  (function crimp() {
    const el = $('#kb-crimp');
    let std, pins, pool, sel, checked;
    function task() {
      std = Math.random() < .5 ? 'T568A' : 'T568B';
      pins = Array(8).fill(null);
      pool = shuffle(T568B);
      sel = null; checked = false;
      render();
    }
    const target = () => (std === 'T568A' ? T568A : T568B);
    const chip = (w, where) => `<button type="button" class="kb-wire${sel === w ? ' sel' : ''}" draggable="true" data-w="${w}" data-where="${where}">${swatch(w)}<span>${w}</span></button>`;
    function render() {
      const ok = pins.every((w, i) => w === target()[i]);
      el.innerHTML = `
        <p class="kb-task">Belege den Stecker nach <b>${std}</b>.</p>
        <div class="kb-plug8">${pins.map((w, i) => {
          const st = checked && w ? (w === target()[i] ? ' ok' : ' bad') : '';
          return `<div class="kb-slot${st}" data-i="${i}"><span class="kb-pin-no">${i + 1}</span>${w ? `<span class="kb-core-v${striped(w) ? ' st' : ''}" style="--w:${COLOR[base(w)]}"></span>${chip(w, i)}` : '<i>leer</i>'}</div>`;
        }).join('')}</div>
        <div class="osi-pool kb-pool"><small>Adern</small>${pool.filter(w => !pins.includes(w)).map(w => chip(w, 'pool')).join('') || '<em class="muted">alle eingesetzt</em>'}</div>
        <div class="osi-pz-fb" aria-live="polite">${checked ? (ok ? `<p class="osi-pz-done">Richtig gecrimpt! Das ist ${std}.</p>` : `<p>${pins.filter((w, i) => w === target()[i]).length} von 8 Adern sitzen richtig. Die falschen sind rot markiert.</p>`) : ''}</div>
        <div class="row-actions">
          <button type="button" class="btn primary" data-act="check">Prüfen</button>
          <button type="button" class="btn" data-act="new">Neue Aufgabe</button>
          <button type="button" class="btn ghost" data-act="solve">Lösung zeigen</button>
        </div>`;
      return ok;
    }
    function put(w, i) {
      const old = pins.indexOf(w);
      if (old >= 0) pins[old] = null;
      pins[i] = w;
      sel = null; checked = false;
      render();
    }
    el.addEventListener('click', e => {
      const act = e.target.closest('[data-act]')?.dataset.act;
      if (act === 'new') return task();
      if (act === 'solve') { pins = [...target()]; checked = true; return render(); }
      if (act === 'check') { checked = true; if (render()) FX.burstFrom($('.osi-pz-done', el)); return; }
      const c = e.target.closest('.kb-wire');
      if (c && c.dataset.where !== 'pool') { pins[Number(c.dataset.where)] = null; checked = false; return render(); }
      if (c) { sel = sel === c.dataset.w ? null : c.dataset.w; return render(); }
      const s = e.target.closest('.kb-slot');
      if (s && sel) put(sel, Number(s.dataset.i));
    });
    el.addEventListener('dragstart', e => {
      const c = e.target.closest('.kb-wire');
      if (c) e.dataTransfer.setData('text/plain', c.dataset.w);
    });
    el.addEventListener('dragover', e => { if (e.target.closest('.kb-slot')) e.preventDefault(); });
    el.addEventListener('drop', e => {
      const s = e.target.closest('.kb-slot');
      const w = e.dataTransfer.getData('text/plain');
      if (!s || !T568B.includes(w)) return;
      e.preventDefault();
      put(w, Number(s.dataset.i));
    });
    task();
  })();

  /* ---------- Station 3: Patchkabel / Crossover ---------- */
  (function cable() {
    const CABLES = {
      patch: { right: T568B, map: [0, 1, 2, 3, 4, 5, 6, 7], titles: ['T568B', 'T568B'], txt: 'Jede Ader geht von Pin <i>n</i> zu Pin <i>n</i> – nichts ist gekreuzt.' },
      x100: { right: T568A, map: [2, 5, 0, 3, 4, 1, 6, 7], titles: ['T568B', 'T568A'], txt: 'Ein Ende T568B, das andere T568A: Die Paare für Senden (1, 2) und Empfangen (3, 6) sind gekreuzt. Das reicht für 10 und 100 Mbit/s, weil dort nur diese beiden Paare benutzt werden.' },
      x1000: { right: XO.map((_, j) => T568B[XO.indexOf(j + 1)]), map: XO.map(p => p - 1), titles: ['T568B', 'Gigabit-Crossover'], txt: 'Bei Gigabit-Ethernet senden alle vier Paare. Deshalb werden zusätzlich Blau und Braun gekreuzt: 1↔3, 2↔6, 4↔7, 5↔8.' },
    };
    function render(k) {
      const c = CABLES[k];
      $$('#kb-cable-seg button').forEach(b => b.classList.toggle('active', b.dataset.c === k));
      $('#kb-cable').innerHTML = plugs(T568B, c.right, (XL, XR) => T568B.map((w, i) => wirePath(XL, PY(i), XR, PY(c.map[i]), w)).join(''), { titles: c.titles });
      $('#kb-cable-txt').innerHTML = c.txt;
    }
    $('#kb-cable-seg').addEventListener('click', e => { const b = e.target.closest('[data-c]'); if (b) render(b.dataset.c); });
    render('patch');
  })();

  /* ---------- Station 3: Gigabit-Crossover verbinden (wie auf dem Arbeitsblatt) ---------- */
  (function xo() {
    const el = $('#kb-xo');
    const RIGHT = XO.map((_, j) => T568B[XO.indexOf(j + 1)]);
    let links, from, checked;
    function reset() { links = { 0: 2 }; from = null; checked = false; render(); }
    function render() {
      const done = Object.keys(links).length === 8;
      const allOk = done && Object.entries(links).every(([i, j]) => RIGHT[j] === T568B[i]);
      el.innerHTML = `<div class="tp-wrap kb-wiring">${plugs(T568B, RIGHT, (XL, XR) => Object.entries(links).map(([i, j]) => {
        const bad = checked && RIGHT[j] !== T568B[i];
        return wirePath(XL, PY(Number(i)), XR, PY(j), T568B[i], bad ? 'class="kb-bad"' : '');
      }).join(''), { clickable: true, titles: ['T568B', 'Crossover-Ende'] })}</div>
        <div class="osi-pz-fb" aria-live="polite">${allOk
          ? '<p class="osi-pz-done">Alle acht Adern verbunden!</p><p><b>Gekreuzt werden:</b> Orange mit Grün (1↔3, 2↔6) und Blau mit Braun (4↔7, 5↔8) – jeweils die ganzen Paare.</p>'
          : checked ? '<p>Noch nicht ganz: Rote Verbindungen enden an einer anderen Farbe, oder es fehlen noch Adern.</p>'
            : `<p class="muted">${from != null ? `Pin ${from + 1} (${T568B[from]}) gewählt – jetzt rechts den passenden Pin anklicken.` : 'Klicke links einen Pin an.'}</p>`}</div>
        <div class="row-actions">
          <button type="button" class="btn primary" data-act="check">Prüfen</button>
          <button type="button" class="btn ghost" data-act="reset">Von vorn</button>
          <button type="button" class="btn ghost" data-act="solve">Lösung zeigen</button>
        </div>`;
      if (from != null) $(`.kb-pinbox[data-side="l"][data-i="${from}"]`, el)?.classList.add('sel');
      Object.keys(links).forEach(i => $(`.kb-pinbox[data-side="l"][data-i="${i}"]`, el)?.classList.add('used'));
      return allOk;
    }
    function pick(p) {
      const i = Number(p.dataset.i);
      if (p.dataset.side === 'l') { from = from === i ? null : i; delete links[i]; checked = false; return render(); }
      if (from == null) return;
      for (const k of Object.keys(links)) if (links[k] === i) delete links[k];
      links[from] = i;
      from = null; checked = false;
      render();
    }
    el.addEventListener('click', e => {
      const act = e.target.closest('[data-act]')?.dataset.act;
      if (act === 'reset') return reset();
      if (act === 'solve') { links = Object.fromEntries(XO.map((p, i) => [i, p - 1])); from = null; checked = true; return render(); }
      if (act === 'check') { checked = true; if (render()) FX.burstFrom($('.osi-pz-done', el)); return; }
      const p = e.target.closest('.kb-pinbox.click');
      if (p) pick(p);
    });
    el.addEventListener('keydown', e => {
      const p = e.target.closest('.kb-pinbox.click');
      if (p && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); pick(p); }
    });
    reset();
  })();
})();
