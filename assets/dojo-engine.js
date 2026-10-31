/* Netzwerktechnik-Dojo – gemeinsame Übungs-Mechanik: Gürtel, Serie, Stempel, Feuerwerk.
   Wird von jedem Thema mit eigenen Aufgaben-Generatoren benutzt. */
'use strict';

// ---------- Effekte (auch außerhalb des Dojos nutzbar, z. B. im Baukasten) ----------
const FX = (() => {
  const calm = matchMedia('(prefers-reduced-motion: reduce)');
  const SYMBOLS = ['🥋', '🌸', '⛩️', '🏮', '🎋', '⭐', '☯️'];
  const rand = (a, b) => a + Math.random() * (b - a);

  // Symbol-Feuerwerk ab Bildschirmpunkt (x, y)
  function burst(x, y, n = 12, spread = 120) {
    if (calm.matches) return;
    for (let k = 0; k < n; k++) {
      const s = document.createElement('span');
      s.className = 'fx-spark';
      s.textContent = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
      s.style.left = `${x}px`;
      s.style.top = `${y}px`;
      document.body.appendChild(s);
      const a = (k / n) * 2 * Math.PI + rand(-.25, .25);
      const r = spread * rand(.6, 1.1);
      const dx = Math.cos(a) * r, dy = Math.sin(a) * r, rot = rand(-90, 90);
      s.animate([
        { transform: 'translate(-50%, -50%) scale(.3)', opacity: 1 },
        { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(1) rotate(${rot}deg)`, opacity: 1, offset: .55 },
        { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy + 50}px)) scale(.8) rotate(${rot * 1.5}deg)`, opacity: 0 },
      ], { duration: rand(1000, 1400), easing: 'cubic-bezier(.2, .7, .3, 1)' }).onfinish = () => s.remove();
    }
  }

  function burstFrom(el, n, spread) {
    const r = el.getBoundingClientRect();
    burst(r.left + r.width / 2, r.top + r.height / 2, n, spread);
  }

  // Großer Moment: mehrere Feuerwerke über die ganze Seite
  function celebrate(stamp) {
    if (calm.matches) return;
    setTimeout(() => burstFrom(stamp, 18, 170), 250);
    for (let k = 0; k < 6; k++) {
      setTimeout(() => burst(innerWidth * rand(.15, .85), innerHeight * rand(.15, .6), 16, rand(120, 200)), 600 + k * 280);
    }
  }

  // Kleiner Moment: Feuerwerk aus dem Stempel
  function pop(stamp) {
    if (!calm.matches) setTimeout(() => burstFrom(stamp), 250);
  }

  function shake(el) {
    el.classList.remove('shake');
    void el.offsetWidth; // Animation neu starten
    el.classList.add('shake');
  }

  // Gürtel-Verleihung: großes Fenster mit dem Dojo-Tor als Rahmen
  function award({ img, title, sub }) {
    const prev = document.activeElement;
    const ov = document.createElement('div');
    ov.className = 'award';
    ov.innerHTML = `
      <div class="award-frame" role="dialog" aria-modal="true" aria-labelledby="award-t">
        <img class="award-bg" src="assets/images/rahmen.webp" alt="">
        <div class="award-in">
          <img class="award-belt" src="${img}" alt="">
          <p class="award-t" id="award-t">${title}</p>
          <p class="award-s">${sub}</p>
          <button type="button" class="btn primary award-ok">Weiter trainieren</button>
        </div>
      </div>`;
    const close = () => {
      ov.classList.add('out');
      document.removeEventListener('keydown', onKey);
      setTimeout(() => ov.remove(), calm.matches ? 0 : 250);
      prev?.focus?.({ preventScroll: true });
    };
    const onKey = e => { if (e.key === 'Escape' || e.key === 'Enter') { e.preventDefault(); close(); } };
    ov.addEventListener('click', e => { if (e.target === ov || e.target.closest('.award-ok')) close(); });
    document.addEventListener('keydown', onKey);
    document.body.appendChild(ov);
    ov.querySelector('.award-ok').focus({ preventScroll: true });
  }

  const stamp = big => (big
    ? '<span class="hanko big" aria-hidden="true"><b>★</b><small>bestanden</small></span>'
    : '<span class="hanko" aria-hidden="true"><b>✔</b><small>richtig</small></span>');

  return { burst, burstFrom, celebrate, pop, shake, stamp, award, calm };
})();

/* ---------- Übungs-Dojo ----------
   Dojo.create({ mount, pageId, storeKey, belts, note })
   belts: [{ id, name, topic, color, gen }]
   gen() liefert eine Aufgabe:
     { q, sol, check(antwort) → bool | { ok, why } }
     plus genau eine Antwortart:
       ph        – Texteingabe (Platzhalter)
       choices   – Auswahl-Buttons
       widget    – { mount(el), read() → Antwort oder null, lock() } für interaktive Aufgaben */
const Dojo = (() => {
  const { esc } = UI;
  const STREAK = 5;
  // Gürtelbild aus Netzwerkkabel, benannt nach der Farbe (id) des Gürtels
  const beltImg = b => b.img || `assets/images/guertel-${b.id}.png`;

  function create(o) {
    const root = o.mount;
    const q = s => root.querySelector(s);
    const BELTS = o.belts;
    root.innerHTML = `
      <aside class="belts" aria-label="Gürtel"></aside>
      <div class="card dojo-main">
        <div class="dojo-top">
          <h2 class="d-title"></h2>
          <div class="streak" aria-label="Serie"></div>
        </div>
        <div class="dojo-q"></div>
        <form class="dojo-form" autocomplete="off">
          <input class="d-input" spellcheck="false" autocomplete="off" aria-label="Deine Antwort">
          <button class="btn primary" type="submit">Prüfen</button>
        </form>
        <div class="choices" hidden></div>
        <div class="dojo-widget" hidden></div>
        <div class="dojo-fb" aria-live="polite"></div>
        <div class="row-actions">
          <button type="button" class="btn primary d-check" hidden>Prüfen</button>
          <button type="button" class="btn primary d-next" hidden>Nächste Aufgabe →</button>
          <button type="button" class="btn ghost d-show">Lösung zeigen</button>
        </div>
        ${o.note ? `<p class="note">${o.note}</p>` : ''}
      </div>`;

    let progress = UI.store.get(o.storeKey, {}) || {};
    let cur = 0;
    let task = null;
    let streak = 0;
    let done = false;

    const input = q('.d-input');
    const main = q('.dojo-main');
    const fb = q('.dojo-fb');

    function renderBelts() {
      const count = BELTS.filter(b => progress[b.id]).length;
      q('.belts').innerHTML = BELTS.map((b, i) => `
        <button type="button" class="belt-btn${i === cur ? ' active' : ''}${progress[b.id] ? ' earned' : ''}" data-i="${i}">
          <img class="belt-img" src="${beltImg(b)}" alt="" width="58" height="40">
          <span class="belt-txt"><b>${b.name}</b><small>${b.topic}</small></span>
          <span class="belt-st" aria-label="${progress[b.id] ? 'erreicht' : 'offen'}">${progress[b.id] ? '✔' : ''}</span>
        </button>`).join('') +
        `<p class="belt-count">${count} von ${BELTS.length} Gürteln erreicht</p>
         <button type="button" class="btn ghost small d-reset">Fortschritt zurücksetzen</button>`;
    }

    // fx.pop: neuer Punkt springt auf; fx.lost: so viele Punkte fallen herunter
    function renderStreak(fx = {}) {
      let h = '<span class="streak-lbl">Serie</span>';
      for (let k = 0; k < STREAK; k++) {
        if (k < streak) h += `<i class="on${fx.pop && k === streak - 1 ? ' pop' : ''}"></i>`;
        else if (k < (fx.lost || 0)) h += `<i class="lost" style="--d:${(Math.min(fx.lost, STREAK) - 1 - k) * 90}ms"></i>`;
        else h += '<i></i>';
      }
      q('.streak').innerHTML = h;
    }

    const kind = t => (t.widget ? 'widget' : t.choices ? 'choices' : 'text');

    function newTask(focus = true) {
      task = BELTS[cur].gen();
      done = false;
      q('.d-title').textContent = `${BELTS[cur].name} · ${BELTS[cur].topic}`;
      q('.dojo-q').innerHTML = task.q;
      const k = kind(task);
      const form = q('.dojo-form');
      const choices = q('.choices');
      const widget = q('.dojo-widget');
      form.hidden = k !== 'text';
      choices.hidden = k !== 'choices';
      widget.hidden = k !== 'widget';
      q('.d-check').hidden = k !== 'widget';
      if (k === 'choices') {
        choices.innerHTML = task.choices.map(c => `<button type="button" class="btn choice" data-v="${esc(c)}">${esc(c)}</button>`).join('');
        if (focus) choices.querySelector('button').focus({ preventScroll: true });
      } else if (k === 'widget') {
        widget.innerHTML = '';
        task.widget.mount(widget);
      } else {
        input.value = '';
        input.classList.remove('bad');
        input.placeholder = task.ph || '';
        if (focus) input.focus({ preventScroll: true });
      }
      fb.innerHTML = '';
      fb.className = 'dojo-fb';
      q('.d-next').hidden = true;
      q('.d-show').hidden = false;
      renderStreak();
    }

    function finish(fx) {
      done = true;
      if (task.widget) task.widget.lock();
      q('.d-check').hidden = true;
      q('.d-next').hidden = false;
      q('.d-show').hidden = true;
      q('.d-next').focus({ preventScroll: true });
      renderStreak(fx);
    }

    function answer(v) {
      if (done || v == null || (typeof v === 'string' && !v.trim())) return;
      const res = task.check(v);
      const right = typeof res === 'object' ? res.ok : res;
      let fx;
      let earned = null;
      if (right) {
        streak++;
        fx = { pop: true };
        fb.className = 'dojo-fb ok';
        let h = `<p class="fb-head">✔ Richtig!</p><p>${task.sol}</p>`;
        const belt = BELTS[cur];
        const big = streak === STREAK;
        if (big) {
          if (!progress[belt.id]) {
            progress[belt.id] = true;
            UI.store.set(o.storeKey, progress);
            renderBelts();
            earned = belt;
            h += `<img class="belt-award" src="${beltImg(belt)}" alt="${esc(belt.name)}"><p class="earned-msg">Glückwunsch! Du hast den <b>${belt.name.replace(/er Gürtel$/, 'en Gürtel')}</b> erreicht.</p>`;
          } else {
            h += '<p class="earned-msg">🔥 Wieder 5 in Folge – stark!</p>';
          }
        }
        fb.innerHTML = h + FX.stamp(big);
        const st = fb.querySelector('.hanko');
        if (big) FX.celebrate(st);
        else FX.pop(st);
      } else {
        fx = { lost: streak };
        streak = 0;
        fb.className = 'dojo-fb err';
        const yours = typeof v === 'string' ? `<p>Deine Antwort: <code>${esc(v)}</code></p>` : '';
        const why = typeof res === 'object' && res.why ? `<p>${res.why}</p>` : '';
        fb.innerHTML = `<p class="fb-head">✘ Leider nicht richtig.</p>${yours}${why}<p>${task.sol}</p>`;
        if (kind(task) === 'text') input.classList.add('bad');
        FX.shake(main);
      }
      if (task.choices) {
        root.querySelectorAll('.choice').forEach(b => {
          b.disabled = true;
          const r = task.check(b.dataset.v);
          if (typeof r === 'object' ? r.ok : r) b.classList.add('correct');
          else if (b.dataset.v === v) b.classList.add('wrong');
        });
      }
      finish(fx);
      if (earned) {
        FX.award({
          img: beltImg(earned),
          title: `${esc(earned.name.replace(/er Gürtel$/, 'en Gürtel'))} erreicht!`,
          sub: `${esc(earned.topic)} – 5 Aufgaben in Folge richtig.`,
        });
      }
    }

    q('.dojo-form').addEventListener('submit', e => {
      e.preventDefault();
      if (done) newTask();
      else answer(input.value);
    });
    q('.choices').addEventListener('click', e => {
      const b = e.target.closest('[data-v]');
      if (b) answer(b.dataset.v);
    });
    q('.d-check').addEventListener('click', () => {
      const v = task.widget.read();
      if (v == null) return;
      answer(v);
    });
    q('.d-next').addEventListener('click', () => newTask());
    q('.d-show').addEventListener('click', () => {
      if (done) return;
      const lost = streak;
      streak = 0;
      fb.className = 'dojo-fb info';
      fb.innerHTML = `<p class="fb-head">Lösung</p><p>${task.sol}</p>`;
      finish({ lost });
    });
    q('.belts').addEventListener('click', e => {
      if (e.target.closest('.d-reset')) {
        if (confirm('Wirklich alle Gürtel dieses Themas zurücksetzen?')) {
          progress = {};
          UI.store.set(o.storeKey, progress);
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
      if (e.detail === o.pageId && !done && kind(task) === 'text') input.focus({ preventScroll: true });
    });

    renderBelts();
    newTask(false);
  }

  return { create };
})();
