/* Tor-Rahmen: einzelne Blütenblätter links und rechts neben den Säulen,
   zufällig im verlängerten Bereich zwischen Säulenkopf und Boden verteilt. */
'use strict';

(() => {
  const tor = document.querySelector('.tor');
  if (!tor) return;
  const layer = document.createElement('div');
  layer.className = 'tor-petals';
  layer.setAttribute('aria-hidden', 'true');
  tor.prepend(layer);

  const SRC = [1, 2, 3].map(n => `assets/images/tor/tor-blatt-${n}.png`);
  const PETAL = 30; // Originalgröße der Blätter in Pixeln
  const CORNER = 667, FLOOR = 291, PILLAR_OUT = 72; // Maße im Originalbild

  // Kleiner Zufallsgenerator mit Startwert – gleiche Station = gleiche Blätter
  function rng(seed) {
    let a = seed >>> 0;
    return () => {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const hash = s => [...s].reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 16777619), 2166136261);

  function layout() {
    layer.innerHTML = '';
    if (matchMedia('(max-width: 900px)').matches) return; // ohne Säulen keine Blätter
    const s = parseFloat(getComputedStyle(tor).getPropertyValue('--s')) || .5;
    const W = tor.clientWidth, H = tor.scrollHeight;
    const top = CORNER * s + 12, bottom = H - FLOOR * s - 16;
    const strip = PILLAR_OUT * s; // Breite des Streifens außerhalb der Säule
    if (bottom - top < 120 || strip < 14) return;
    const page = document.querySelector('.page.active')?.id || 'x';
    let h = '';
    for (const side of ['l', 'r']) {
      const rand = rng(hash(page + side));
      const count = Math.max(1, Math.round((bottom - top) / 190));
      const band = (bottom - top) / count;
      for (let k = 0; k < count; k++) {
        if (rand() < .18) continue; // ab und zu eine Lücke, damit es nicht wie ein Muster wirkt
        const size = PETAL * s * (0.8 + rand() * 0.55);
        const y = top + (k + .1 + rand() * .8) * band;
        const xIn = 2 + rand() * Math.max(0, strip - size - 4);
        const x = side === 'l' ? xIn : W - xIn - size;
        const rot = Math.round(rand() * 360);
        const flip = rand() < .5 ? -1 : 1;
        const op = (.7 + rand() * .3).toFixed(2);
        h += `<img src="${SRC[Math.floor(rand() * SRC.length)]}" alt="" style="left:${x.toFixed(1)}px;top:${y.toFixed(1)}px;width:${size.toFixed(1)}px;opacity:${op};transform:rotate(${rot}deg) scaleX(${flip})">`;
      }
    }
    layer.innerHTML = h;
  }

  let timer = 0;
  const later = () => { clearTimeout(timer); timer = setTimeout(layout, 120); };
  new ResizeObserver(later).observe(tor);
  document.addEventListener('pagechange', later);
  window.addEventListener('load', layout);
})();
