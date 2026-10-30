/* Station 1 – Grundlagen */
'use strict';

(() => {
  const { $, bitRow, legend, columnHover } = UI;
  const F = IPv4.format;

  // Oktett-Schalter: 8 Bits anklicken, Dezimalwert sehen
  const box = $('#g-octet');
  const W = [128, 64, 32, 16, 8, 4, 2, 1];
  let val = 168;
  let target = null;

  box.innerHTML = `
    <div class="octet-toggle" role="group" aria-label="8 Bits eines Oktetts">
      ${W.map((w, k) => `<button type="button" class="tbit" data-k="${k}"><span class="tbit-v"></span><span class="tbit-w">${w}</span></button>`).join('')}
    </div>
    <p class="octet-sum" id="g-sum" aria-live="polite"></p>
    <div class="row-actions">
      <button type="button" class="btn" id="g-target">🎯 Zielzahl würfeln</button>
      <button type="button" class="btn ghost" id="g-clear">Alle Bits auf 0</button>
      <span id="g-goal" class="goal"></span>
    </div>`;

  function draw() {
    box.querySelectorAll('.tbit').forEach(b => {
      const on = (val & W[b.dataset.k]) !== 0;
      b.classList.toggle('on', on);
      b.setAttribute('aria-pressed', on);
      b.querySelector('.tbit-v').textContent = on ? '1' : '0';
    });
    const parts = W.filter(w => val & w);
    $('#g-sum').innerHTML = `<code>${val.toString(2).padStart(8, '0')}</code> = ${parts.length > 1 ? parts.join(' + ') + ' = ' : ''}<b>${val}</b>`;
    const g = $('#g-goal');
    if (target === null) g.textContent = '';
    else if (val === target) g.innerHTML = `<span class="ok-text">✔ ${target} geschafft!</span>`;
    else g.innerHTML = `Ziel: <b>${target}</b>`;
  }

  box.addEventListener('click', e => {
    const b = e.target.closest('.tbit');
    if (!b) return;
    val ^= W[b.dataset.k];
    draw();
  });
  $('#g-target').addEventListener('click', () => {
    target = 1 + Math.floor(Math.random() * 255);
    val = 0;
    draw();
  });
  $('#g-clear').addEventListener('click', () => { val = 0; draw(); });
  draw();

  // Beispiele mit 192.168.10.77/24
  const ip = IPv4.parse('192.168.10.77');
  $('#g-split').innerHTML =
    bitRow(ip, { label: '192.168.10.77', sub: 'mit Maske /24', prefix: 24 }) +
    legend({ net: 'Netzanteil (24 Bit)', host: 'Hostanteil (8 Bit)' });

  $('#g-and').innerHTML =
    bitRow(ip, { label: 'IP-Adresse', prefix: 24 }) +
    bitRow(IPv4.mask(24), { label: 'Subnetzmaske', sub: '/24', prefix: 24 }) +
    '<div class="and-line"><span>UND ↓</span></div>' +
    bitRow(IPv4.network(ip, 24), { label: 'Netzadresse', sub: '192.168.10.0', prefix: 24 });

  // Gültige Maskenwerte pro Oktett
  $('#g-masks').innerHTML = '<thead><tr><th>Bits</th><th>Dezimal</th><th>Einsen</th></tr></thead><tbody>' +
    [8, 7, 6, 5, 4, 3, 2, 1, 0].map(k => {
      const v = (0xFF00 >> k) & 255;
      return `<tr><td><code>${'1'.repeat(k)}<span class="dim">${'0'.repeat(8 - k)}</span></code></td><td><b>${v}</b></td><td>${k}</td></tr>`;
    }).join('') + '</tbody>';

  // Hostanzahl je Präfix
  $('#g-hosts').innerHTML = '<thead><tr><th>Präfix</th><th>Subnetzmaske</th><th>Host-Bits</th><th>Adressen</th><th>nutzbare Hosts</th></tr></thead><tbody>' +
    [16, 20, 22, 23, 24, 25, 26, 27, 28, 29, 30].map(p => `<tr><td><b>/${p}</b></td><td><code>${F(IPv4.mask(p))}</code></td><td>${32 - p}</td><td>2<sup>${32 - p}</sup> = ${IPv4.fmtNum(IPv4.size(p))}</td><td><b>${IPv4.fmtNum(IPv4.hosts(p))}</b></td></tr>`).join('') +
    '</tbody>';

  columnHover($('#g-and'));
  columnHover($('#g-split'));
})();
