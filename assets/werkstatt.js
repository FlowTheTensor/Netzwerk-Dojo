/* Station 2 – Masken-Werkstatt */
'use strict';

(() => {
  const { $, $$, bitRow, legend, columnHover } = UI;
  const F = IPv4.format;
  const fmt = IPv4.fmtNum;

  const ipIn = $('#w-ip');
  const maskIn = $('#w-mask');
  const range = $('#w-prefix');
  const out = $('#w-prefix-out');
  const fb = $('#w-fb');
  const bitsEl = $('#w-bits');

  let ip = IPv4.parse(ipIn.value);
  let p = 24;

  function setPrefix(np, fromMask) {
    p = Math.max(0, Math.min(32, np));
    range.value = p;
    out.textContent = '/' + p;
    if (!fromMask) {
      maskIn.value = F(IPv4.mask(p));
      maskIn.classList.remove('bad');
    }
    render();
  }

  ipIn.addEventListener('input', () => {
    const v = IPv4.parse(ipIn.value);
    ipIn.classList.toggle('bad', v === null);
    if (v === null) {
      fb.textContent = 'Ungültige IP-Adresse – Format a.b.c.d, jede Zahl von 0 bis 255.';
      return;
    }
    fb.textContent = '';
    ip = v;
    render();
  });

  maskIn.addEventListener('input', () => {
    const q = IPv4.parseMask(maskIn.value);
    maskIn.classList.toggle('bad', q === null);
    if (q === null) {
      fb.textContent = 'Ungültige Maske – die Einsen müssen links lückenlos zusammenhängen (z. B. 255.255.255.192 oder /26).';
      return;
    }
    fb.textContent = '';
    setPrefix(q, true);
  });

  range.addEventListener('input', () => setPrefix(Number(range.value)));

  // Klick auf ein Maskenbit: eine 1 schaltet sie (und alle rechts davon) aus, eine 0 schaltet bis dorthin ein
  function bitClick(bit) {
    const i = Number(bit.dataset.i);
    setPrefix(i < p ? i : i + 1);
    const again = $(`.mask-row .bit[data-i="${i}"]`, bitsEl);
    if (again) again.focus();
  }
  bitsEl.addEventListener('click', e => {
    const b = e.target.closest('.mask-row .bit');
    if (b) bitClick(b);
  });
  bitsEl.addEventListener('keydown', e => {
    const b = e.target.closest('.mask-row .bit');
    if (b && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); bitClick(b); }
  });
  columnHover(bitsEl);

  $$('[data-preset]').forEach(btn => btn.addEventListener('click', () => {
    const [a, q] = btn.dataset.preset.split('/');
    ipIn.value = a;
    ip = IPv4.parse(a);
    ipIn.classList.remove('bad');
    fb.textContent = '';
    setPrefix(Number(q));
  }));

  $('#w-subnets').addEventListener('click', e => {
    const b = e.target.closest('[data-ip]');
    if (!b) return;
    ipIn.value = b.dataset.ip;
    ip = IPv4.parse(b.dataset.ip);
    ipIn.classList.remove('bad');
    render();
  });

  const card = (k, v, s = '') =>
    `<div class="res"><span class="res-k">${k}</span><span class="res-v">${v}</span>${s ? `<span class="res-s">${s}</span>` : ''}</div>`;

  function render() {
    const c = IPv4.classOf(ip);
    const base = c.prefix ?? p;
    const m = IPv4.mask(p);
    const net = IPv4.network(ip, p);
    const bc = IPv4.broadcast(ip, p);

    bitsEl.innerHTML =
      bitRow(ip, { label: 'IP-Adresse', prefix: p, base }) +
      bitRow(m, { label: 'Subnetzmaske', sub: `/${p} – klick die Bits!`, prefix: p, base, clickable: true, cls: 'mask-row' }) +
      '<div class="and-line"><span>UND-Verknüpfung (1 nur dort, wo beide Bits 1 sind)</span></div>' +
      bitRow(net, { label: 'Netzadresse', sub: 'alle Host-Bits = 0', prefix: p, base }) +
      bitRow(bc, { label: 'Broadcast', sub: 'alle Host-Bits = 1', prefix: p, base });

    const lg = { net: 'Netzanteil' };
    if (p > base) lg.sub = `geliehene Bits (Subnetting ggü. Klasse ${c.cls})`;
    if (p < base) lg.sup = `laut Klasse ${c.cls} Netzanteil – hier Hostanteil`;
    lg.host = 'Hostanteil';
    $('#w-legend').innerHTML = legend(lg);

    // Erklärung
    const blk = IPv4.privateBlock(ip);
    let ex = '';
    if (!c.prefix) {
      ex += `<p>${F(ip)} gehört zur Klasse <b>${c.cls}</b> (${c.cls === 'D' ? 'Multicast' : 'reserviert'}). Solche Adressen werden nicht an normale Geräte vergeben – die Rechnung hier ist reine Übung.</p>`;
    } else {
      ex += `<p>Das erste Oktett <b>${ip >>> 24}</b> beginnt binär mit <code>${c.lead}</code> → historisch <b>Klasse ${c.cls}</b> mit der Standardmaske /${c.prefix} (${F(IPv4.mask(c.prefix))}).</p>`;
      if (p === c.prefix) {
        ex += `<p>Deine Maske /${p} entspricht genau der Klassenmaske: Das Klassennetz wird <b>nicht</b> unterteilt.</p>`;
      } else if (p > c.prefix) {
        const b = p - c.prefix;
        ex += `<p><b>Subnetting:</b> Du leihst dir <b>${b} Bit${b > 1 ? 's' : ''}</b> aus dem Hostanteil (rot markiert). Das Klasse-${c.cls}-Netz zerfällt in 2<sup>${b}</sup> = <b>${fmt(2 ** b)} Subnetze</b> mit je ${fmt(IPv4.size(p))} Adressen (${fmt(IPv4.hosts(p))} nutzbar).</p>`;
      } else {
        const b = c.prefix - p;
        ex += `<p><b>Supernetting:</b> Deine Maske ist <b>kürzer</b> als die Klassenmaske. /${p} fasst 2<sup>${b}</sup> = <b>${fmt(2 ** b)} Klasse-${c.cls}-Netze</b> zu einem Netz zusammen (schraffierte Bits).</p>`;
      }
    }
    if (blk) {
      ex += `<p>🔒 Die Adresse ist <b>privat</b> (RFC 1918, Block <b>${blk.cidr}</b> = ${blk.classful}).`;
      if (net === blk.start && p === blk.prefix) ex += ' <b>Genau dieser Block steht so in RFC 1918!</b>';
      else if (p < blk.prefix) ex += ` ⚠️ Aber: /${p} ist größer als der private Block – dieses Netz würde öffentliche Adressen enthalten.`;
      ex += '</p>';
    } else {
      ex += '<p>🌍 Die Adresse ist <b>nicht privat</b> nach RFC 1918.</p>';
    }
    $('#w-expl').innerHTML = ex;

    const usable = IPv4.hosts(p);
    $('#w-results').innerHTML = [
      card('Netzadresse', `${F(net)}/${p}`),
      card('Subnetzmaske', F(m), `Wildcard ${F(~m >>> 0)}`),
      card('Erster Host', usable ? F(net + 1) : '–'),
      card('Letzter Host', usable ? F(bc - 1) : '–'),
      card('Broadcast', F(bc)),
      card('Adressen / nutzbar', `${fmt(IPv4.size(p))} / ${fmt(usable)}`, `2<sup>${32 - p}</sup> − 2`),
    ].join('');

    // Alle Subnetze des Klassennetzes auflisten
    const sc = $('#w-subnets-card');
    if (c.prefix && p > c.prefix && p - c.prefix <= 8) {
      const cnet = IPv4.network(ip, c.prefix);
      const n = 2 ** (p - c.prefix);
      const sz = IPv4.size(p);
      sc.hidden = false;
      $('#w-subnets-title').textContent = `Alle ${fmt(n)} Subnetze von ${F(cnet)}/${c.prefix} bei /${p}`;
      let h = '';
      for (let k = 0; k < n; k++) {
        const s = cnet + k * sz;
        const rangeTxt = sz >= 4 ? `<small>${F(s + 1)} – ${F(s + sz - 2)}</small>` : '';
        h += `<button type="button" class="chip-btn${s === net ? ' current' : ''}" data-ip="${F(sz >= 4 ? s + 1 : s)}"><b>${k + 1}.</b> ${F(s)}/${p}${rangeTxt}</button>`;
      }
      $('#w-subnets').innerHTML = h;
    } else {
      sc.hidden = true;
    }
  }

  setPrefix(24);
})();
