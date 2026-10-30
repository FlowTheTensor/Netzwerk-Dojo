/* Station 4 – Übungs-Dojo mit Gürtelsystem */
'use strict';

(() => {
  const { $, esc } = UI;
  const F = IPv4.format;
  const fmt = IPv4.fmtNum;
  const STREAK = 5;

  const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const ip = (a, b, c, d) => ((a * 256 + b) * 256 + c) * 256 + d;
  const bin8 = n => n.toString(2).padStart(8, '0');
  const binMask = p => IPv4.octets(IPv4.mask(p)).map(bin8).join('.');
  const num = v => {
    const s = v.trim().replace(/[.\s]/g, '');
    return /^\d+$/.test(s) ? Number(s) : NaN;
  };
  const isPrefix = v => /^\/?\s*\d{1,2}$/.test(v.trim());
  const placeValues = n => {
    const parts = [128, 64, 32, 16, 8, 4, 2, 1].filter(w => n & w);
    return parts.length ? parts.join(' + ') : '0';
  };

  function randIp() {
    return pick([
      () => ip(10, rnd(0, 255), rnd(0, 255), rnd(1, 254)),
      () => ip(172, rnd(16, 31), rnd(0, 255), rnd(1, 254)),
      () => ip(192, 168, rnd(0, 255), rnd(1, 254)),
      () => ip(192, 168, rnd(0, 255), rnd(1, 254)),
      () => ip(rnd(1, 223), rnd(0, 255), rnd(0, 255), rnd(1, 254)),
    ])();
  }

  // Lösungsweg mit der „Blockgröße“-Methode
  function explain(a, p) {
    const m = IPv4.mask(p);
    const mo = IPv4.octets(m);
    const ao = IPv4.octets(a);
    const net = IPv4.network(a, p);
    const bc = IPv4.broadcast(a, p);
    let h = `Maske /${p} = <code>${F(m)}</code>. `;
    if (p % 8 === 0) {
      h += `Bei /${p} bleiben die ersten ${p / 8} Oktett(e) stehen; dahinter steht für die Netzadresse 0, für den Broadcast 255.`;
    } else {
      const k = Math.floor(p / 8);
      const blk = 256 - mo[k];
      const start = Math.floor(ao[k] / blk) * blk;
      h += `Interessantes Oktett: Nr. ${k + 1} (Maskenwert ${mo[k]}). Blockgröße = 256 − ${mo[k]} = <b>${blk}</b>. Die ${ao[k]} liegt im Block <b>${start} … ${start + blk - 1}</b>.`;
    }
    return h + `<br>→ Netzadresse <b>${F(net)}</b> · Broadcast <b>${F(bc)}</b> · Hosts ${F(net + 1)} – ${F(bc - 1)}`;
  }

  /* ---------- Aufgaben-Generatoren ----------
     Jeder liefert { q, ph?, choices?, check(antwort) → bool, sol } */

  function genBinary() {
    if (Math.random() < 0.5) {
      const n = Math.random() < 0.4 ? pick([128, 192, 224, 240, 248, 252, 254, 255]) : rnd(0, 255);
      return {
        q: `Wandle die Dezimalzahl <b>${n}</b> in eine 8-Bit-Binärzahl um.`,
        ph: 'z. B. 10101000',
        check: v => {
          const s = v.replace(/[\s.]/g, '');
          return /^[01]{1,8}$/.test(s) && parseInt(s, 2) === n;
        },
        sol: `${n} = ${placeValues(n)} → <code>${bin8(n)}</code>`,
      };
    }
    const n = rnd(0, 255);
    return {
      q: `Welche Dezimalzahl ist <code>${bin8(n)}</code>?`,
      ph: '0 – 255',
      check: v => num(v) === n,
      sol: `<code>${bin8(n)}</code> = ${placeValues(n)} = <b>${n}</b>`,
    };
  }

  function genMask() {
    const p = pick([8, 16, 24, rnd(17, 23), rnd(9, 15), rnd(25, 30), rnd(25, 30)]);
    const m = F(IPv4.mask(p));
    if (Math.random() < 0.5) {
      return {
        q: `Wie lautet die Subnetzmaske in Punktschreibweise für <b>/${p}</b>?`,
        ph: 'z. B. 255.255.255.0',
        check: v => IPv4.parse(v) === IPv4.mask(p),
        sol: `/${p} = ${p} Einsen: <code>${binMask(p)}</code> → <b>${m}</b>`,
      };
    }
    return {
      q: `Welches Präfix gehört zur Maske <b>${m}</b>?`,
      ph: 'z. B. /24',
      check: v => isPrefix(v) && IPv4.parseMask(v) === p,
      sol: `<code>${binMask(p)}</code> → ${p} Einsen → <b>/${p}</b>`,
    };
  }

  function genClass() {
    const a = pick([
      () => ip(10, rnd(0, 255), rnd(0, 255), rnd(1, 254)),
      () => ip(pick([9, 11, 100, 127]), rnd(0, 255), rnd(0, 255), rnd(1, 254)),
      () => ip(172, rnd(16, 31), rnd(0, 255), rnd(1, 254)),
      () => ip(172, pick([15, 32, 64]), rnd(0, 255), rnd(1, 254)),
      () => ip(192, 168, rnd(0, 255), rnd(1, 254)),
      () => ip(192, pick([167, 169, 0]), rnd(0, 255), rnd(1, 254)),
      () => ip(rnd(128, 191), rnd(0, 255), rnd(0, 255), rnd(1, 254)),
      () => ip(rnd(193, 223), rnd(0, 255), rnd(0, 255), rnd(1, 254)),
      () => ip(rnd(224, 239), rnd(0, 255), rnd(0, 255), rnd(1, 254)),
    ])();
    const c = IPv4.classOf(a);
    const blk = IPv4.privateBlock(a);
    const o1 = a >>> 24;
    if (Math.random() < 0.5) {
      return {
        q: `Zu welcher historischen Adressklasse gehört <b>${F(a)}</b>?`,
        choices: ['A', 'B', 'C', 'D', 'E'],
        check: v => v === c.cls,
        sol: `Erstes Oktett ${o1} = <code>${bin8(o1)}</code> beginnt mit <code>${c.lead}</code> → Klasse <b>${c.cls}</b> (erstes Oktett ${c.first} – ${c.last}).`,
      };
    }
    return {
      q: `Ist <b>${F(a)}</b> eine private Adresse nach RFC 1918?`,
      choices: ['ja', 'nein'],
      check: v => (v === 'ja') === Boolean(blk),
      sol: blk
        ? `Ja – sie liegt im Block <b>${blk.cidr}</b> (${blk.range}).`
        : 'Nein – privat sind nur 10.0.0.0/8, 172.16.0.0/12 (also 172.16 bis 172.31) und 192.168.0.0/16.',
    };
  }

  function genNetwork() {
    const a = randIp();
    const p = pick([8, 16, 24, rnd(17, 23), rnd(25, 30), rnd(25, 30), rnd(19, 28)]);
    const n = IPv4.network(a, p);
    return {
      q: `Wie lautet die <b>Netzadresse</b> von <b>${F(a)}/${p}</b>?`,
      ph: 'a.b.c.d',
      check: v => IPv4.parse(v) === n,
      sol: explain(a, p),
    };
  }

  function genRange() {
    const a = randIp();
    const p = pick([rnd(17, 23), rnd(24, 30), rnd(24, 30), 24, 16]);
    const net = IPv4.network(a, p);
    const bc = IPv4.broadcast(a, p);
    const v = rnd(0, 2);
    const what = ['die <b>Broadcast-Adresse</b>', 'die <b>erste nutzbare Host-Adresse</b>', 'die <b>letzte nutzbare Host-Adresse</b>'][v];
    const ans = [bc, net + 1, bc - 1][v];
    return {
      q: `Wie lautet ${what} im Netz von <b>${F(a)}/${p}</b>?`,
      ph: 'a.b.c.d',
      check: x => IPv4.parse(x) === ans,
      sol: explain(a, p),
    };
  }

  function genHosts() {
    const v = rnd(0, 2);
    if (v === 0) {
      const p = rnd(16, 30);
      return {
        q: `Wie viele <b>nutzbare Host-Adressen</b> hat ein Netz mit <b>/${p}</b>?`,
        ph: 'Anzahl',
        check: x => num(x) === IPv4.hosts(p),
        sol: `32 − ${p} = ${32 - p} Host-Bits → 2<sup>${32 - p}</sup> − 2 = ${fmt(IPv4.size(p))} − 2 = <b>${fmt(IPv4.hosts(p))}</b>`,
      };
    }
    if (v === 1) {
      const h = pick([rnd(2, 14), rnd(15, 62), rnd(63, 500), rnd(501, 4000)]);
      const p = IPv4.prefixForHosts(h);
      return {
        q: `Ein Netz soll mindestens <b>${fmt(h)} Geräte</b> aufnehmen. Welches ist das <b>kleinste</b> passende Netz (größtes Präfix)?`,
        ph: 'z. B. /26',
        check: x => IPv4.parseMask(x) === p,
        sol: `Gesucht: 2<sup>n</sup> − 2 ≥ ${fmt(h)} → n = ${32 - p} Host-Bits (2<sup>${32 - p}</sup> − 2 = ${fmt(IPv4.hosts(p))}) → <b>/${p}</b> = ${F(IPv4.mask(p))}. Ein /${p + 1} hätte nur ${fmt(IPv4.hosts(p + 1))} Adressen.`,
      };
    }
    const p0 = pick([16, 24, 24]);
    const p = rnd(p0 + 1, Math.min(p0 + 8, 30));
    return {
      q: `Ein /${p0}-Netz wird in <b>/${p}</b>-Subnetze aufgeteilt. Wie viele Subnetze entstehen?`,
      ph: 'Anzahl',
      check: x => num(x) === 2 ** (p - p0),
      sol: `${p} − ${p0} = ${p - p0} geliehene Bits → 2<sup>${p - p0}</sup> = <b>${fmt(2 ** (p - p0))}</b> Subnetze`,
    };
  }

  function genSubnet() {
    const base = pick([
      () => ({ n: ip(192, 168, rnd(0, 255), 0), p: 24 }),
      () => ({ n: ip(192, 168, rnd(0, 255), 0), p: 24 }),
      () => ({ n: ip(172, rnd(16, 31), 0, 0), p: 16 }),
      () => ({ n: ip(10, rnd(0, 255), 0, 0), p: 16 }),
    ])();
    const cnt = pick([2, 3, 4, 5, 6, 7, 8, 10, 12, 16]);
    const b = Math.ceil(Math.log2(cnt));
    const p = base.p + b;
    const sz = IPv4.size(p);
    const k = rnd(1, cnt);
    const sn = base.n + (k - 1) * sz;
    const intro = `Das Netz <b>${F(base.n)}/${base.p}</b> soll in <b>${cnt}</b> gleich große Subnetze aufgeteilt werden (jeweils so groß wie möglich).`;
    const why = `${cnt} Subnetze → ${b} Bit${b > 1 ? 's' : ''} leihen (2<sup>${b}</sup> = ${2 ** b} ≥ ${cnt}) → /${base.p} + ${b} = <b>/${p}</b> (${F(IPv4.mask(p))}), je ${fmt(sz)} Adressen.`;
    const v = rnd(0, 2);
    if (v === 0) {
      return { q: `${intro} Welche <b>Subnetzmaske</b> brauchst du?`, ph: 'Maske oder /Präfix', check: x => IPv4.parseMask(x) === p, sol: why };
    }
    const start = `Das ${k}. Subnetz beginnt bei ${F(base.n)} + ${k - 1} · ${fmt(sz)} = <b>${F(sn)}</b>`;
    if (v === 1) {
      return { q: `${intro} Wie lautet die <b>Netzadresse des ${k}. Subnetzes</b>?`, ph: 'a.b.c.d', check: x => IPv4.parse(x) === sn, sol: `${why}<br>${start}.` };
    }
    return {
      q: `${intro} Wie lautet die <b>Broadcast-Adresse des ${k}. Subnetzes</b>?`,
      ph: 'a.b.c.d',
      check: x => IPv4.parse(x) === sn + sz - 1,
      sol: `${why}<br>${start}, der Broadcast liegt eine Adresse vor dem nächsten Subnetz: <b>${F(sn + sz - 1)}</b>.`,
    };
  }

  const BELTS = [
    { id: 'weiss', name: 'Weißer Gürtel', topic: 'Binär ↔ Dezimal', color: '#f4f1ea', gen: genBinary },
    { id: 'gelb', name: 'Gelber Gürtel', topic: 'Präfix ↔ Subnetzmaske', color: '#facc15', gen: genMask },
    { id: 'orange', name: 'Oranger Gürtel', topic: 'Klassen & private Adressen', color: '#f97316', gen: genClass },
    { id: 'gruen', name: 'Grüner Gürtel', topic: 'Netzadresse bestimmen', color: '#16a34a', gen: genNetwork },
    { id: 'blau', name: 'Blauer Gürtel', topic: 'Broadcast & Hostbereich', color: '#2563eb', gen: genRange },
    { id: 'braun', name: 'Brauner Gürtel', topic: 'Hosts zählen & Präfix wählen', color: '#8b5a2b', gen: genHosts },
    { id: 'schwarz', name: 'Schwarzer Gürtel', topic: 'Subnetting', color: '#1c1917', gen: genSubnet },
  ];

  let progress = UI.store.get('belts', {}) || {};
  let cur = 0;
  let task = null;
  let streak = 0;
  let done = false;

  const input = $('#d-input');

  function renderBelts() {
    const count = BELTS.filter(b => progress[b.id]).length;
    $('#d-belts').innerHTML = BELTS.map((b, i) => `
      <button type="button" class="belt-btn${i === cur ? ' active' : ''}${progress[b.id] ? ' earned' : ''}" data-i="${i}">
        <span class="belt-sw" style="--belt:${b.color}"></span>
        <span class="belt-txt"><b>${b.name}</b><small>${b.topic}</small></span>
        <span class="belt-st" aria-label="${progress[b.id] ? 'erreicht' : 'offen'}">${progress[b.id] ? '✔' : ''}</span>
      </button>`).join('') +
      `<p class="belt-count">${count} von ${BELTS.length} Gürteln erreicht</p>
       <button type="button" class="btn ghost small" id="d-reset">Fortschritt zurücksetzen</button>`;
  }

  function renderStreak() {
    let h = '<span class="streak-lbl">Serie</span>';
    for (let k = 0; k < STREAK; k++) h += `<i class="${k < streak ? 'on' : ''}"></i>`;
    $('#d-streak').innerHTML = h;
  }

  function newTask(focus = true) {
    task = BELTS[cur].gen();
    done = false;
    $('#d-title').textContent = `${BELTS[cur].name} · ${BELTS[cur].topic}`;
    $('#d-q').innerHTML = task.q;
    const form = $('#d-form');
    const choices = $('#d-choices');
    if (task.choices) {
      form.hidden = true;
      choices.hidden = false;
      choices.innerHTML = task.choices.map(c => `<button type="button" class="btn choice" data-v="${esc(c)}">${esc(c)}</button>`).join('');
      if (focus) choices.querySelector('button').focus({ preventScroll: true });
    } else {
      form.hidden = false;
      choices.hidden = true;
      input.value = '';
      input.placeholder = task.ph || '';
      if (focus) input.focus({ preventScroll: true });
    }
    const fb = $('#d-fb');
    fb.innerHTML = '';
    fb.className = 'dojo-fb';
    $('#d-next').hidden = true;
    $('#d-show').hidden = false;
    renderStreak();
  }

  function finish() {
    done = true;
    $('#d-next').hidden = false;
    $('#d-show').hidden = true;
    $('#d-next').focus({ preventScroll: true });
    renderStreak();
  }

  function answer(v) {
    if (done || !v.trim()) return;
    const right = task.check(v);
    const fb = $('#d-fb');
    if (right) {
      streak++;
      fb.className = 'dojo-fb ok';
      let h = `<p class="fb-head">✔ Richtig!</p><p>${task.sol}</p>`;
      const belt = BELTS[cur];
      if (streak === STREAK) {
        if (!progress[belt.id]) {
          progress[belt.id] = true;
          UI.store.set('belts', progress);
          renderBelts();
          h += `<p class="earned-msg">🥋 Glückwunsch! Du hast den <b>${belt.name}</b> erreicht.</p>`;
        } else {
          h += '<p class="earned-msg">🔥 Wieder 5 in Folge – stark!</p>';
        }
      }
      fb.innerHTML = h;
    } else {
      streak = 0;
      fb.className = 'dojo-fb err';
      fb.innerHTML = `<p class="fb-head">✘ Leider nicht richtig.</p><p>Deine Antwort: <code>${esc(v)}</code></p><p>${task.sol}</p>`;
    }
    if (task.choices) {
      document.querySelectorAll('#d-choices .choice').forEach(b => {
        b.disabled = true;
        if (task.check(b.dataset.v)) b.classList.add('correct');
        else if (b.dataset.v === v) b.classList.add('wrong');
      });
    }
    finish();
  }

  $('#d-form').addEventListener('submit', e => {
    e.preventDefault();
    if (done) newTask();
    else answer(input.value);
  });
  $('#d-choices').addEventListener('click', e => {
    const b = e.target.closest('[data-v]');
    if (b) answer(b.dataset.v);
  });
  $('#d-next').addEventListener('click', () => newTask());
  $('#d-show').addEventListener('click', () => {
    if (done) return;
    streak = 0;
    const fb = $('#d-fb');
    fb.className = 'dojo-fb info';
    fb.innerHTML = `<p class="fb-head">Lösung</p><p>${task.sol}</p>`;
    finish();
  });
  $('#d-belts').addEventListener('click', e => {
    if (e.target.closest('#d-reset')) {
      if (confirm('Wirklich alle Gürtel zurücksetzen?')) {
        progress = {};
        UI.store.set('belts', progress);
        renderBelts();
      }
      return;
    }
    const b = e.target.closest('.belt-btn');
    if (!b) return;
    cur = Number(b.dataset.i);
    streak = 0;
    renderBelts();
    newTask();
  });
  document.addEventListener('pagechange', e => {
    if (e.detail === 'dojo' && !done && !task.choices) input.focus({ preventScroll: true });
  });

  renderBelts();
  newTask(false);
})();
