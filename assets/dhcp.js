/* Netzwerkdienste · Station 1: DHCP – DORA Schritt für Schritt, Lease, Adressbereich */
'use strict';

// Gemeinsame Bausteine der Dienste-Stationen
const DIENSTE = (() => {
  // Schritt-Steuerung wie in der OSI-Kapselung: Weiter, Abspielen, Von vorn
  function stepper({ last, render, step, go, reset, page, onReset }) {
    let s = 0;
    let timer = 0;
    const goLabel = go.textContent;
    const L = () => (typeof last === 'function' ? last() : last);
    const draw = () => { render(s); step.disabled = s >= L(); };
    function stop() { clearInterval(timer); timer = 0; go.textContent = goLabel; }
    function next() {
      if (s < L()) s++;
      if (s >= L()) stop();
      draw();
    }
    step.addEventListener('click', () => { stop(); next(); });
    reset.addEventListener('click', () => { stop(); s = 0; onReset?.(); draw(); });
    go.addEventListener('click', () => {
      if (timer) return stop();
      if (s >= L()) { s = 0; onReset?.(); }
      go.textContent = '❚❚ Anhalten';
      draw();
      timer = setInterval(next, FX.calm.matches ? 2800 : 2100);
    });
    document.addEventListener('pagechange', e => { if (e.detail !== page) stop(); });
    draw();
    // Von vorn, ohne onReset – z. B. für eine zweite Variante des Ablaufs
    const restart = () => { stop(); s = 0; draw(); };
    return { restart };
  }
  // 65535 → „65 535“ (schmales Leerzeichen, kein Punkt – sonst sieht es aus wie eine IP-Adresse)
  const fmt = n => String(n).replace(/\B(?=(\d{3})+$)/g, ' ');
  return { stepper, fmt };
})();

(() => {
  const { $, esc } = UI;

  /* ---------- DORA ---------- */
  const MAC = '3c:52:82:1a:4f:07';
  const MSG = [
    { n: 'DHCPDISCOVER', w: 'Discover', dir: 1, bc: true, from: '0.0.0.0:68', to: '255.255.255.255:67',
      say: '<b>Discover</b> – „Gibt es hier einen DHCP-Server?“ Der Laptop hat noch keine IP-Adresse. Er sendet deshalb von <code>0.0.0.0</code> an <b>alle</b> (Broadcast <code>255.255.255.255</code>). Jedes Gerät im Netz empfängt die Nachricht, aber nur DHCP-Server reagieren.',
      pkt: [['Ziel-MAC', 'ff:ff:ff:ff:ff:ff (Broadcast)'], ['Quell-IP → Ziel-IP', '0.0.0.0 → 255.255.255.255'], ['UDP-Ports', '68 → 67'], ['Inhalt', `Client ${MAC} sucht einen DHCP-Server`]] },
    { n: 'DHCPOFFER', w: 'Offer', dir: -1, bc: false, from: '192.168.1.1:67', to: '192.168.1.80:68',
      say: '<b>Offer</b> – „Du kannst 192.168.1.80 haben.“ Der Server sucht eine freie Adresse aus seinem Pool und bietet sie an – zusammen mit Maske, Gateway, DNS-Server und Lease-Dauer. Er schickt das Angebot direkt an die MAC-Adresse des Laptops.',
      pkt: [['Ziel-MAC', MAC], ['Quell-IP → Ziel-IP', '192.168.1.1 → 192.168.1.80'], ['UDP-Ports', '67 → 68'], ['Inhalt', 'Angebot: IP 192.168.1.80 · Maske 255.255.255.0 · Gateway 192.168.1.1 · DNS 192.168.1.1 · Lease 24 h']] },
    { n: 'DHCPREQUEST', w: 'Request', dir: 1, bc: true, from: '0.0.0.0:68', to: '255.255.255.255:67',
      say: '<b>Request</b> – „Ich nehme 192.168.1.80 vom Server 192.168.1.1.“ Der Laptop antwortet wieder per <b>Broadcast</b>. So erfahren auch andere DHCP-Server, die vielleicht ebenfalls ein Angebot geschickt haben, dass ihres nicht gewählt wurde.',
      pkt: [['Ziel-MAC', 'ff:ff:ff:ff:ff:ff (Broadcast)'], ['Quell-IP → Ziel-IP', '0.0.0.0 → 255.255.255.255'], ['UDP-Ports', '68 → 67'], ['Inhalt', 'Ich möchte 192.168.1.80 von Server 192.168.1.1']] },
    { n: 'DHCPACK', w: 'Acknowledge', dir: -1, bc: false, from: '192.168.1.1:67', to: '192.168.1.80:68',
      say: '<b>Acknowledge</b> – „Bestätigt, die Adresse gehört dir für 24 Stunden.“ Der Server trägt die Vergabe in seine Liste ein. Erst jetzt darf der Laptop die Adresse benutzen.',
      pkt: [['Ziel-MAC', MAC], ['Quell-IP → Ziel-IP', '192.168.1.1 → 192.168.1.80'], ['UDP-Ports', '67 → 68'], ['Inhalt', 'Bestätigt: 192.168.1.80 für 24 h, dazu Maske, Gateway und DNS-Server']] },
  ];
  const IPCONFIG = `C:\\&gt; <span class="c-cmd">ipconfig /all</span>

Ethernet-Adapter Ethernet:

   Physische Adresse . . . . . . . . : 3C-52-82-1A-4F-07
   DHCP aktiviert. . . . . . . . . . : <span class="c-hi">Ja</span>
   IPv4-Adresse  . . . . . . . . . . : <span class="c-hi">192.168.1.80</span>(Bevorzugt)
   Subnetzmaske  . . . . . . . . . . : <span class="c-hi">255.255.255.0</span>
   Lease erhalten. . . . . . . . . . : Montag, 7. September 2026 08:00:00
   Lease läuft ab. . . . . . . . . . : Dienstag, 8. September 2026 08:00:00
   Standardgateway . . . . . . . . . : <span class="c-hi">192.168.1.1</span>
   DHCP-Server . . . . . . . . . . . : 192.168.1.1
   DNS-Server  . . . . . . . . . . . : <span class="c-hi">192.168.1.1</span>`;

  const XC = 120, XS = 640, Y0 = 92, DY = 58;
  function doraSvg(s) {
    let g = `
      <rect class="dn-node" x="${XC - 80}" y="8" width="160" height="50" rx="10"/>
      <text class="dn-nt" x="${XC}" y="29" text-anchor="middle">💻 Laptop</text>
      <text class="dn-ns" x="${XC}" y="47" text-anchor="middle">${s >= 4 ? '192.168.1.80' : 'noch keine IP-Adresse'}</text>
      <rect class="dn-node" x="${XS - 80}" y="8" width="160" height="50" rx="10"/>
      <text class="dn-nt" x="${XS}" y="29" text-anchor="middle">🗄 DHCP-Server</text>
      <text class="dn-ns" x="${XS}" y="47" text-anchor="middle">192.168.1.1 (Router)</text>
      <line class="dn-life" x1="${XC}" y1="60" x2="${XC}" y2="${Y0 + DY * 4 - 20}"/>
      <line class="dn-life" x1="${XS}" y1="60" x2="${XS}" y2="${Y0 + DY * 4 - 20}"/>`;
    MSG.forEach((m, i) => {
      if (i >= s) return;
      const y = Y0 + i * DY;
      const [x1, x2] = m.dir > 0 ? [XC + 4, XS - 10] : [XS - 4, XC + 10];
      const cls = i === s - 1 ? ' now' : '';
      g += `<g class="dn-msg${cls}${m.bc ? ' bc' : ''}">
        <line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" marker-end="url(#dn-arr${cls ? '-now' : ''})"/>
        <text class="dn-mt" x="${(XC + XS) / 2}" y="${y - 9}" text-anchor="middle"><tspan class="dn-no">${i + 1}</tspan> ${m.n}${m.bc ? ' · Broadcast' : ''}</text>
        <text class="dn-ms" x="${(XC + XS) / 2}" y="${y + 17}" text-anchor="middle">${m.from} → ${m.to}</text>
      </g>`;
    });
    const letters = MSG.map((m, i) => `<tspan class="${i < s ? 'on' : ''}">${m.w[0]}</tspan>`).join('');
    g += `<text class="dn-dora-word" x="${(XC + XS) / 2}" y="40" text-anchor="middle">${letters}</text>`;
    return `<svg class="dn-svg" viewBox="0 0 760 ${Y0 + DY * 4 - 14}" role="img" aria-label="DHCP-Ablauf zwischen Laptop und Server">
      <defs>${['', 'now'].map(k => `<marker id="dn-arr${k ? '-' + k : ''}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 L10 5 L0 10 z" class="dn-ah ${k}"/></marker>`).join('')}</defs>${g}</svg>`;
  }

  const doraEl = $('#dn-dora');
  DIENSTE.stepper({
    last: 5, page: 'dienst-dhcp',
    step: $('#dn-dora-step'), go: $('#dn-dora-go'), reset: $('#dn-dora-reset'),
    render(s) {
      doraEl.innerHTML = doraSvg(Math.min(s, 4));
      const m = MSG[s - 1];
      let say;
      if (s === 0) say = 'Der Laptop wird angeschlossen. Er weiß nur seine eigene <b>MAC-Adresse</b> – keine IP-Adresse, kein Gateway, keinen DNS-Server.';
      else if (s === 5) say = '<b>Fertig.</b> Der Laptop richtet die erhaltenen Einstellungen ein und kann loslegen. Die Anfangsbuchstaben der vier Nachrichten ergeben <b>DORA</b>: Discover, Offer, Request, Acknowledge.';
      else say = m.say;
      $('#dn-dora-say').innerHTML = `<p><span class="osi-stepno">${s} / 5</span>${say}</p>`;
      $('#dn-dora-pkt').innerHTML = s === 5
        ? `<pre class="console">${IPCONFIG}</pre>`
        : m ? `<div class="tbl-wrap"><table class="tbl compact dn-pkt"><caption>${m.n}</caption><tbody>${m.pkt.map(([k, v]) => `<tr><th>${k}</th><td>${esc(v)}</td></tr>`).join('')}</tbody></table></div>` : '';
    },
  });

  /* ---------- Lease ---------- */
  const LEASE = 24, T1 = LEASE / 2, T2 = LEASE * 7 / 8;
  const fmtH = h => `${String(h).replace('.', ',')} h`;
  function renderLease() {
    const t = Number($('#dn-lease').value);
    const srv = $('#dn-lease-srv').checked;
    $('#dn-lease-out').textContent = fmtH(t);
    // Mit erreichbarem Server beginnt die Lease bei jeder Verlängerung neu
    const since = srv ? t % T1 : t;
    const renewed = srv ? Math.floor(t / T1) : 0;
    const pos = Math.min(since, LEASE + 2) / (LEASE + 2) * 100;
    const pct = x => x / (LEASE + 2) * 100;
    $('#dn-lease-bar').innerHTML = `
      <div class="dn-lease">
        <div class="dn-ls ok" style="width:${pct(T1)}%"><span>gültig</span></div>
        <div class="dn-ls renew" style="width:${pct(T2 - T1)}%"><span>T1: beim Server verlängern</span></div>
        <div class="dn-ls rebind" style="width:${pct(LEASE - T2)}%"><span>T2</span></div>
        <div class="dn-ls gone" style="width:${pct(2)}%"></div>
        <i class="dn-lmark" style="left:${pos}%"></i>
      </div>
      <div class="dn-lscale"><span style="left:0">0 h</span><span style="left:${pct(T1)}%">12 h</span><span style="left:${pct(T2)}%">21 h</span><span style="left:${pct(LEASE)}%">24 h</span></div>`;
    let txt;
    if (srv && renewed) {
      txt = `Bei ${renewed === 1 ? '12 h' : `12 h und ${fmtH(renewed * T1)}`} hat der Laptop seine Lease verlängert: ein <b>DHCPREQUEST</b> direkt an den Server, der mit <b>DHCPACK</b> antwortet. Die Uhr ist neu gestartet – die Adresse <code>192.168.1.80</code> bleibt, noch ${fmtH(LEASE - since)} gültig.`;
    } else if (since < T1) {
      txt = `Alles in Ordnung: Die Adresse ist noch <b>${fmtH(LEASE - since)}</b> gültig. Der Laptop muss nichts tun.`;
    } else if (since < T2) {
      txt = '<b>T1 (50 %) ist erreicht.</b> Der Laptop bittet seinen DHCP-Server direkt (Unicast) um Verlängerung – und wiederholt es immer wieder. Der Server antwortet nicht. Die Adresse darf aber weiter benutzt werden.';
    } else if (since < LEASE) {
      txt = '<b>T2 (87,5 %) ist erreicht.</b> Jetzt fragt der Laptop per Broadcast <b>jeden</b> DHCP-Server im Netz, ob er die Lease verlängert. Immer noch keine Antwort.';
    } else {
      txt = '<b>Die Lease ist abgelaufen.</b> Der Laptop muss die Adresse aufgeben und beginnt von vorn mit DHCPDISCOVER. Antwortet weiterhin niemand, gibt er sich eine Adresse aus <code>169.254.0.0/16</code> – kein Gateway, kein Internet.';
    }
    $('#dn-lease-txt').innerHTML = `<p>${txt}</p>`;
  }
  $('#dn-lease').addEventListener('input', renderLease);
  $('#dn-lease-srv').addEventListener('change', renderLease);
  renderLease();

  /* ---------- Adressbereich ---------- */
  const { parse, format, network, broadcast, hosts } = IPv4;
  function renderPool() {
    const fields = ['a', 'b', 'gw'].map(k => $(`#dn-pool-${k}`));
    const [a, b, gw] = fields.map(f => parse(f.value));
    const p = Number($('#dn-pool-p').value);
    fields.forEach((f, i) => f.classList.toggle('bad', [a, b, gw][i] === null));
    const out = $('#dn-pool-out');
    if ([a, b, gw].includes(null) || !(p >= 8 && p <= 30)) {
      out.innerHTML = '<p class="field-fb">Bitte gültige IPv4-Adressen und ein Präfix zwischen 8 und 30 eingeben.</p>';
      return;
    }
    const net = network(a, p);
    const bc = broadcast(a, p);
    const msgs = [];
    let ok = true;
    const err = t => { msgs.push(['err', t]); ok = false; };
    if (network(b, p) !== net) err(`Start und Ende liegen in verschiedenen Netzen – bei /${p} gehört ${format(b)} nicht zu ${format(net)}/${p}.`);
    if (a > b) err('Die Start-Adresse ist größer als die End-Adresse.');
    if (a === net || b === net) err(`${format(net)} ist die Netzadresse und darf nicht vergeben werden.`);
    if (a === bc || b === bc) err(`${format(bc)} ist die Broadcast-Adresse und darf nicht vergeben werden.`);
    if (network(gw, p) !== net) err(`Das Gateway ${format(gw)} liegt nicht im Netz ${format(net)}/${p} – die Geräte könnten es nicht erreichen.`);
    else if (gw >= a && gw <= b) err(`Das Gateway ${format(gw)} liegt im Pool. Der Server könnte die Adresse des Routers an einen Laptop vergeben – Adresskonflikt!`);
    const count = ok ? b - a + 1 : 0;
    if (ok) {
      msgs.push(['ok', `Der Pool liegt im Netz ${format(net)}/${p} (Maske ${format(IPv4.mask(p))}).`]);
      msgs.push(['ok', `Gateway ${format(gw)} liegt im Netz, aber außerhalb des Pools.`]);
      msgs.push(['info', `Das Netz hat ${DIENSTE.fmt(hosts(p))} nutzbare Adressen. ${DIENSTE.fmt(hosts(p) - count)} davon liegen außerhalb des Pools – für den Router und Geräte mit fester Adresse.`]);
    }
    out.innerHTML = `
      ${ok ? `<div class="dn-pool-res"><b>${DIENSTE.fmt(count)}</b><span>Adresse${count === 1 ? '' : 'n'} im Pool<br><small>${format(a)} bis ${format(b)}</small></span></div>` : ''}
      <ul class="fb">${msgs.map(([c, t]) => `<li class="${c}">${t}</li>`).join('')}</ul>`;
  }
  ['a', 'b', 'p', 'gw'].forEach(k => $(`#dn-pool-${k}`).addEventListener('input', renderPool));
  renderPool();
})();
