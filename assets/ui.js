/* Netzwerktechnik-Dojo – gemeinsame UI-Bausteine: Bit-Darstellung, Legende, Speicher, Navigation */
'use strict';

const UI = (() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s).replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* Rolle eines Bits:
     net  – Netzanteil (bis zum kleineren der beiden Präfixe)
     sub  – geliehene Subnetz-Bits (Präfix länger als Bezugspräfix)
     sup  – laut Bezug Netzanteil, hier aber Hostanteil (Supernetting)
     host – Hostanteil */
  function role(i, prefix, base) {
    if (base == null) base = prefix;
    if (i < Math.min(prefix, base)) return 'net';
    if (i < prefix) return 'sub';
    if (i < base) return 'sup';
    return 'host';
  }

  function bitRow(n, o = {}) {
    const b = IPv4.bin(n);
    const p = o.prefix ?? 32;
    let h = `<div class="bitrow${o.cls ? ' ' + o.cls : ''}">`;
    if (o.label != null) h += `<div class="bitrow-label">${o.label}${o.sub ? `<small>${o.sub}</small>` : ''}</div>`;
    h += '<div class="octets">';
    IPv4.octets(n).forEach((dec, oi) => {
      h += '<div class="octet"><div class="bits">';
      for (let k = 0; k < 8; k++) {
        const i = oi * 8 + k;
        const attrs = o.clickable ? ` role="button" tabindex="0" aria-label="Maskenbit ${i + 1}: ${b[i]}"` : '';
        h += `<span class="bit ${role(i, p, o.base)}" data-i="${i}"${attrs}>${b[i]}</span>`;
      }
      h += `</div><div class="dec">${dec}</div></div>`;
      if (oi < 3) h += '<div class="dot">.</div>';
    });
    return h + '</div></div>';
  }

  /* Header als Raster: jede Zeile 32 Bit, Feldbreite maßstäblich.
     rows: [[ [Schlüssel, Name, Bit, Klasse, Zeilen = 1, Beispielwert?], … ], …] */
  function headerGrid(rows) {
    let h = '';
    let row = 1;
    rows.forEach(r => {
      let col = 1;
      r.forEach(([k, name, bits, cls, span = 1, val]) => {
        h += `<button type="button" class="v6-f h-${cls}" data-f="${k}" style="grid-column:${col} / span ${bits};grid-row:${row} / span ${span}"><span>${name}</span>${bits < 32 ? `<small>${bits} Bit</small>` : ''}${val != null ? `<em class="hv">${val}</em>` : ''}</button>`;
        col += bits;
      });
      row += Math.max(...r.map(f => f[4] || 1));
    });
    return h;
  }

  const legend = items => '<div class="legend">' +
    Object.entries(items).map(([k, t]) => `<span><i class="sw ${k}"></i>${t}</span>`).join('') + '</div>';

  // Hebt beim Überfahren eine ganze Bit-Spalte hervor
  function columnHover(container) {
    const set = (e, on) => {
      const bit = e.target.closest('.bit');
      if (!bit) return;
      $$(`.bit[data-i="${bit.dataset.i}"]`, container).forEach(x => x.classList.toggle('col-hi', on));
    };
    container.addEventListener('mouseover', e => set(e, true));
    container.addEventListener('mouseout', e => set(e, false));
  }

  // localStorage kann blockiert sein (privates Fenster, Schul-Richtlinien) – dann einfach ohne Speichern
  const store = {
    get(key, fallback = null) {
      try {
        const v = localStorage.getItem('netzwerk-dojo:' + key);
        return v === null ? fallback : JSON.parse(v);
      } catch { return fallback; }
    },
    set(key, val) {
      try { localStorage.setItem('netzwerk-dojo:' + key, JSON.stringify(val)); } catch { /* ignorieren */ }
    },
  };

  /* ---------- Themen und Freischaltung ----------
     Ein Thema wird freigeschaltet, sobald alle Stationen des vorherigen Themas geöffnet wurden. */
  const THEMES = {
    mac: { name: 'MAC-Adressen' },
    ipv4: { name: 'IPv4', after: 'mac' },
    topo: { name: 'Topologien', after: 'ipv4' },
    ipv6: { name: 'IPv6', after: 'topo' },
    osi: { name: 'OSI-Modell', after: 'ipv6' },
    kabel: { name: 'Kabel & Signale', after: 'osi' },
    dienste: { name: 'Netzwerkdienste', after: 'kabel' },
    krypto: { name: 'Verschlüsselung & Anonymität', after: 'dienste' },
  };
  const themeOf = page => page.dataset.theme;
  const stationsOf = theme => $$(`.page[data-theme="${theme}"]:not(.lock-page)`);
  const visited = () => new Set(store.get('visited', []) || []);

  function isUnlocked(theme) {
    const req = THEMES[theme]?.after;
    if (!req) return true;
    const seen = visited();
    return stationsOf(req).every(p => seen.has(p.id));
  }

  function toast(html) {
    const t = document.createElement('div');
    t.className = 'toast';
    t.setAttribute('role', 'status');
    t.innerHTML = html;
    document.body.appendChild(t);
    setTimeout(() => t.classList.add('out'), 5200);
    setTimeout(() => t.remove(), 5800);
  }

  // Sperrseite: zeigt, welche Stationen noch fehlen
  function renderLock(theme) {
    const req = THEMES[theme].after;
    const seen = visited();
    $('#lock-theme').textContent = THEMES[theme].name;
    $('#lock-req').textContent = THEMES[req].name;
    $('#lock-list').innerHTML = stationsOf(req).map(p => {
      const name = $(`.stationbar a[href="#${p.id}"]`)?.textContent.replace(/^\d+/, '').trim() || p.id;
      const ok = seen.has(p.id);
      return `<li class="${ok ? 'done' : ''}"><span class="lock-mark">${ok ? '✔' : '○'}</span><a href="#${p.id}">${esc(name)}</a></li>`;
    }).join('');
  }

  function initRouter() {
    const pages = $$('.page');
    const stationLinks = $$('.stationbar a');
    const themeLinks = $$('.themebar [data-theme]');
    function show() {
      const id = location.hash.slice(1);
      let target = pages.find(p => p.id === id && !p.classList.contains('lock-page')) || pages[0];
      const theme = themeOf(target);
      const locked = !isUnlocked(theme);
      if (locked) {
        renderLock(theme);
        target = $('#gesperrt');
      } else {
        const before = Object.keys(THEMES).filter(isUnlocked);
        const seen = visited();
        if (!seen.has(target.id)) {
          seen.add(target.id);
          store.set('visited', [...seen]);
          Object.keys(THEMES).filter(t => isUnlocked(t) && !before.includes(t))
            .forEach(t => toast(`🔓 Neues Thema freigeschaltet: <b>${THEMES[t].name}</b>`));
        }
      }
      pages.forEach(p => p.classList.toggle('active', p === target));
      stationLinks.forEach(a => {
        a.hidden = a.dataset.theme !== theme || locked;
        const on = !locked && a.getAttribute('href') === '#' + target.id;
        a.classList.toggle('active', on);
        if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
      });
      themeLinks.forEach(a => {
        a.classList.toggle('active', a.dataset.theme === theme);
        a.classList.toggle('locked', !isUnlocked(a.dataset.theme));
      });
      // Der Browser springt nach dem Hashwechsel zum Anker – danach wieder nach oben
      requestAnimationFrame(() => window.scrollTo(0, 0));
      document.dispatchEvent(new CustomEvent('pagechange', { detail: target.id }));
    }
    window.addEventListener('hashchange', show);
    window.addEventListener('load', () => window.scrollTo(0, 0));
    show();
  }

  // Signatur-Leiste: Punkte und Striche wie im Schullogo, zufällig versetzt blinkend
  function initSigRail() {
    const rail = $('#sigRail');
    if (!rail) return;
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const shapes = ['dot', 'dot', 'dash'];
    for (let i = 0; i < 90; i++) {
      const el = document.createElement('span');
      el.className = shapes[i % shapes.length];
      if (!still) el.style.animationDelay = (Math.random() * 2.6).toFixed(2) + 's';
      rail.appendChild(el);
    }
  }

  return { $, $$, esc, role, bitRow, headerGrid, legend, columnHover, store, isUnlocked, toast, initRouter, initSigRail };
})();

document.addEventListener('DOMContentLoaded', () => {
  UI.initSigRail();
  UI.initRouter();
});
