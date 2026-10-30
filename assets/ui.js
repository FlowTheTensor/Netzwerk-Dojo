/* Subnet-Dojo – gemeinsame UI-Bausteine: Bit-Darstellung, Legende, Speicher, Navigation */
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
        const v = localStorage.getItem('subnet-dojo:' + key);
        return v === null ? fallback : JSON.parse(v);
      } catch { return fallback; }
    },
    set(key, val) {
      try { localStorage.setItem('subnet-dojo:' + key, JSON.stringify(val)); } catch { /* ignorieren */ }
    },
  };

  function initRouter() {
    const pages = $$('.page');
    const links = $$('.topnav a');
    function show() {
      const id = location.hash.slice(1);
      const target = pages.find(p => p.id === id) || pages[0];
      pages.forEach(p => p.classList.toggle('active', p === target));
      links.forEach(a => {
        const on = a.getAttribute('href') === '#' + target.id;
        a.classList.toggle('active', on);
        if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
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

  return { $, $$, esc, role, bitRow, legend, columnHover, store, initRouter, initSigRail };
})();

document.addEventListener('DOMContentLoaded', () => {
  UI.initSigRail();
  UI.initRouter();
});
