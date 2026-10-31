/* Netzwerktechnik-Dojo – MAC-Adressen: Rechenkern und Stationen 1–2 (Aufbau, Switch lernt Adressen) */
'use strict';

const MAC = (() => {
  // Akzeptiert 00:1A:2B:3C:4D:5E, 00-1A-2B-3C-4D-5E, 001a.2b3c.4d5e und 001A2B3C4D5E
  function parse(input) {
    const s = String(input).trim();
    if (!/^[0-9a-fA-F:.\-\s]+$/.test(s)) return null;
    const h = s.replace(/[:.\-\s]/g, '');
    if (!/^[0-9a-fA-F]{12}$/.test(h)) return null;
    return Array.from({ length: 6 }, (_, i) => parseInt(h.slice(i * 2, i * 2 + 2), 16));
  }
  const hex2 = n => n.toString(16).toUpperCase().padStart(2, '0');
  const colon = b => b.map(hex2).join(':');
  const windows = b => b.map(hex2).join('-');
  const cisco = b => [0, 2, 4].map(i => (hex2(b[i]) + hex2(b[i + 1])).toLowerCase()).join('.');
  const equal = (a, b) => a.every((x, i) => x === b[i]);

  // Adressart aus dem ersten Byte: Bit 0 = I/G (Einzel/Gruppe), Bit 1 = U/L (global/lokal)
  function kind(b) {
    if (b.every(x => x === 0xff)) return { key: 'bcast', name: 'Broadcast', text: 'FF:FF:FF:FF:FF:FF erreicht alle Geräte im lokalen Netz.' };
    if (b[0] & 1) return { key: 'mcast', name: 'Multicast', text: 'Das I/G-Bit ist 1: Die Adresse steht für eine Gruppe von Empfängern, nicht für ein einzelnes Gerät.' };
    if (b[0] & 2) return { key: 'local', name: 'Unicast · lokal vergeben', text: 'Das U/L-Bit ist 1: Die Adresse stammt nicht vom Hersteller, sondern wurde per Software vergeben – z. B. eine zufällige „private“ WLAN-Adresse eines Handys oder einer virtuellen Maschine.' };
    return { key: 'global', name: 'Unicast · weltweit eindeutig', text: 'Beide Bits sind 0: eine normale Geräteadresse, vom Hersteller aus seinem OUI-Block vergeben.' };
  }

  // Kleine Auswahl bekannter OUIs (vollständige Liste: IEEE Registration Authority)
  const VENDORS = {
    '00000C': 'Cisco Systems', '000393': 'Apple', '005056': 'VMware (virtuelle Maschine)', '000C29': 'VMware (virtuelle Maschine)',
    '00155D': 'Microsoft Hyper-V (virtuelle Maschine)', '080027': 'VirtualBox (virtuelle Maschine)',
    'B827EB': 'Raspberry Pi', 'DCA632': 'Raspberry Pi', '000000': 'Xerox (der allererste Block)',
  };
  const vendor = b => VENDORS[b.slice(0, 3).map(hex2).join('')] || null;

  return { parse, hex2, colon, windows, cisco, equal, kind, vendor };
})();

(() => {
  const { $, $$, esc } = UI;
  const bin8 = n => n.toString(2).padStart(8, '0');

  /* ---------- Station 1: MAC-Analyse ---------- */
  (function analyse() {
    const inp = $('#m-in');
    const out = $('#m-out');
    function show() {
      const b = MAC.parse(inp.value);
      inp.classList.toggle('bad', !b && inp.value.trim() !== '');
      if (!b) {
        out.innerHTML = inp.value.trim() ? '<p class="err-text">Keine gültige MAC-Adresse – nötig sind 12 Hex-Ziffern (0–9, A–F), z. B. 00:1A:2B:3C:4D:5E.</p>' : '';
        return;
      }
      const k = MAC.kind(b);
      const v = MAC.vendor(b);
      const first = [...bin8(b[0])].map((c, i) => `<span class="${i === 7 ? 'm-ig' : i === 6 ? 'm-ul' : ''}">${c}</span>`).join('');
      const oui = k.key === 'local' || k.key === 'bcast' ? '' : `<p>OUI <code>${MAC.colon(b.slice(0, 3))}</code>: ${v ? `<b>${esc(v)}</b>` : 'nicht in unserer kleinen Liste – das vollständige Verzeichnis führt die IEEE.'}</p>`;
      out.innerHTML = `
        <div class="m-grid">${b.map((x, i) => `<span class="m-byte ${i < 3 ? 'm-oui' : 'm-dev'}">${MAC.hex2(x)}</span>${i < 5 ? '<span class="m-sep">:</span>' : ''}`).join('')}
          ${k.key === 'global'
            ? '<span class="m-lbl m-oui">OUI · Herstellercode<small>24 Bit · von der IEEE vergeben</small></span><span class="m-lbl m-dev">Gerätenummer<small>24 Bit · vom Hersteller vergeben</small></span>'
            : `<span class="m-lbl m-oui">Erste 3 Bytes<small>kein Herstellercode</small></span><span class="m-lbl m-dev">Letzte 3 Bytes<small>${k.key === 'local' ? 'per Software vergeben' : 'Gruppenadresse'}</small></span>`}</div>
        <div class="m-res b-res b-${k.key === 'global' ? 'priv' : k.key === 'local' ? 'apipa' : 'null'}">
          <p class="b-name">${k.name}</p>
          <p>Erstes Byte ${MAC.hex2(b[0])} = <code class="m-bits">${first}</code> → I/G-Bit (ganz rechts) = <b>${b[0] & 1}</b>, U/L-Bit (links daneben) = <b>${(b[0] >> 1) & 1}</b></p>
          <p>${k.text}</p>${oui}
        </div>
        <div class="tbl-wrap"><table class="tbl compact"><tbody>
          <tr><td>Windows (ipconfig /all, getmac)</td><td><code>${MAC.windows(b)}</code></td></tr>
          <tr><td>Linux, macOS, viele Geräte</td><td><code>${MAC.colon(b).toLowerCase()}</code></td></tr>
          <tr><td>Cisco-Switches</td><td><code>${MAC.cisco(b)}</code></td></tr>
        </tbody></table></div>`;
    }
    inp.addEventListener('input', show);
    $$('[data-m]').forEach(x => x.addEventListener('click', () => { inp.value = x.dataset.m; show(); }));
    show();
  })();

  /* ---------- Station 2: Der Switch lernt MAC-Adressen ---------- */
  (function sw() {
    const PCS = [
      { id: 'A', mac: '00:1A:2B:00:00:0A', port: 1, x: 110, y: 70 },
      { id: 'B', mac: '00:1A:2B:00:00:0B', port: 2, x: 530, y: 70 },
      { id: 'C', mac: '00:1A:2B:00:00:0C', port: 3, x: 110, y: 290 },
      { id: 'D', mac: '00:1A:2B:00:00:0D', port: 4, x: 530, y: 290 },
    ];
    const SW = { x: 320, y: 180 };
    let table = []; // [{ mac, port, fresh }]
    let last = null; // { from, to, ports: [], hit: [], drop: [] }
    let log = '<p class="muted">Wähle Absender und Empfänger und schicke einen Frame. Die MAC-Tabelle des Switches ist am Anfang leer.</p>';

    const pcBy = id => PCS.find(p => p.id === id);
    function draw() {
      let s = '<svg class="tp-svg m-sw" viewBox="0 0 640 360" role="img" aria-label="Switch mit vier PCs">';
      PCS.forEach(p => {
        const cls = !last ? '' : p.id === last.from ? ' src' : last.ports.includes(p.port) ? (last.hit.includes(p.id) ? ' hit' : ' flood') : '';
        s += `<line class="m-link${cls}" x1="${SW.x}" y1="${SW.y}" x2="${p.x}" y2="${p.y}"/>`;
        s += `<text class="m-port" x="${SW.x + (p.x - SW.x) * .3}" y="${SW.y + (p.y - SW.y) * .3 - 6}" text-anchor="middle">Port ${p.port}</text>`;
      });
      s += `<g transform="translate(${SW.x} ${SW.y})" class="t-switch"><rect class="tp-body" x="-42" y="-17" width="84" height="34" rx="5"/><path class="tp-line" d="M-24 -5h40M10 -10l6 5l-6 5M24 5h-40M-10 0l-6 5l6 5"/><text class="tp-label" y="38" text-anchor="middle">Switch</text></g>`;
      PCS.forEach(p => {
        const st = !last ? '' : p.id === last.from ? ' src' : last.hit.includes(p.id) ? ' hit' : last.drop.includes(p.id) ? ' drop' : '';
        s += `<g class="m-pc t-pc${st}" transform="translate(${p.x} ${p.y})"><rect class="tp-body" x="-19" y="-16" width="38" height="25" rx="3"/><rect class="tp-screen" x="-14" y="-11" width="28" height="15" rx="1.5"/><path class="tp-line" d="M0 9v6M-9 16h18"/>
          <text class="tp-label" y="34" text-anchor="middle">PC-${p.id}</text><text class="m-mac" y="49" text-anchor="middle">${p.mac}</text>
          ${st === ' drop' ? '<text class="m-mark" x="24" y="-12">✕</text>' : st === ' hit' ? '<text class="m-mark ok" x="24" y="-12">✔</text>' : ''}</g>`;
      });
      $('#m-sw').innerHTML = s + '</svg>';
      $('#m-table').innerHTML = `<thead><tr><th>MAC-Adresse</th><th>Port</th></tr></thead><tbody>${table.length
        ? table.map(e => `<tr class="${e.fresh ? 'm-new' : ''}"><td><code>${e.mac}</code></td><td>${e.port}</td></tr>`).join('')
        : '<tr><td colspan="2" class="muted">leer</td></tr>'}</tbody>`;
      $('#m-log').innerHTML = log;
    }

    function send(fromId, toId) {
      const from = pcBy(fromId);
      const bcast = toId === 'all';
      const toMac = bcast ? 'FF:FF:FF:FF:FF:FF' : pcBy(toId).mac;
      table.forEach(e => { e.fresh = false; });
      const steps = [`<p class="m-frame">Frame: <b>Ziel-MAC</b> <code>${toMac}</code> · <b>Quell-MAC</b> <code>${from.mac}</code></p><ol>`];
      // 1. Lernen
      const known = table.find(e => e.mac === from.mac);
      if (known) steps.push(`<li>Der Switch kennt <code>${from.mac}</code> schon an Port ${from.port} – nichts zu lernen.</li>`);
      else {
        table.push({ mac: from.mac, port: from.port, fresh: true });
        steps.push(`<li><b>Lernen:</b> Der Frame kam an Port ${from.port} herein. Der Switch merkt sich: <code>${from.mac}</code> → Port ${from.port}.</li>`);
      }
      // 2. Weiterleiten
      const others = PCS.filter(p => p.id !== fromId);
      let ports, hit, drop;
      if (bcast) {
        ports = others.map(p => p.port); hit = others.map(p => p.id); drop = [];
        steps.push('<li><b>Broadcast:</b> Die Ziel-MAC ist FF:FF:FF:FF:FF:FF. Der Switch schickt den Frame an <b>alle</b> Ports außer dem Eingangsport. Alle Geräte nehmen ihn an.</li>');
      } else {
        const entry = table.find(e => e.mac === toMac);
        if (entry) {
          ports = [entry.port]; hit = [toId]; drop = [];
          steps.push(`<li><b>Gezielt weiterleiten:</b> <code>${toMac}</code> steht in der Tabelle an Port ${entry.port}. Der Frame geht <b>nur</b> dorthin – die anderen PCs bekommen ihn gar nicht zu sehen.</li>`);
        } else {
          ports = others.map(p => p.port); hit = [toId]; drop = others.filter(p => p.id !== toId).map(p => p.id);
          steps.push(`<li><b>Fluten:</b> <code>${toMac}</code> kennt der Switch noch nicht. Er schickt den Frame an <b>alle</b> Ports außer dem Eingangsport.</li>`);
          steps.push(`<li>Jede Netzwerkkarte vergleicht die Ziel-MAC mit ihrer eigenen: PC-${toId} nimmt den Frame an, ${drop.map(d => `PC-${d}`).join(' und ')} ${drop.length > 1 ? 'verwerfen' : 'verwirft'} ihn.</li>`);
        }
      }
      steps.push('</ol>');
      last = { from: fromId, ports, hit, drop };
      log = steps.join('');
      draw();
    }

    $('#m-send').addEventListener('click', () => {
      const f = $('#m-from').value, t = $('#m-to').value;
      if (f === t) { log = '<p class="err-text">Absender und Empfänger müssen verschiedene PCs sein.</p>'; last = null; draw(); return; }
      send(f, t);
    });
    $('#m-clear').addEventListener('click', () => {
      table = []; last = null;
      log = '<p class="muted">MAC-Tabelle geleert – wie nach einem Neustart des Switches.</p>';
      draw();
    });
    draw();
  })();
})();
