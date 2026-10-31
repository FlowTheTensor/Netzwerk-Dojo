/* Netzwerkdienste · Station 2: DNS – Namensbaum, Auflösung, nslookup mit Beispieldaten */
'use strict';

(() => {
  const { $, esc } = UI;

  /* ---------- Namensbaum ---------- */
  const REGISTRY = { de: 'DENIC eG in Frankfurt am Main', com: 'Verisign', net: 'Verisign', org: 'Public Interest Registry', uk: 'Nominet', at: 'nic.at', ch: 'SWITCH', eu: 'EURid' };
  function renderTree() {
    const inp = $('#dn-name');
    const raw = inp.value.trim().toLowerCase().replace(/\.$/, '');
    const labels = raw.split('.');
    const valid = labels.length >= 2 && labels.every(l => /^[a-z0-9äöüß]([a-z0-9äöüß-]{0,61}[a-z0-9äöüß])?$/.test(l)) && /^[a-z]{2,}$/.test(labels.at(-1));
    inp.classList.toggle('bad', !valid);
    const out = $('#dn-tree');
    if (!valid) {
      out.innerHTML = '<p class="field-fb">Ein Domainname besteht aus mindestens zwei Teilen (Labels), getrennt durch Punkte – z. B. <code>example.com</code>. Erlaubt sind Buchstaben, Ziffern und Bindestriche.</p>';
      return;
    }
    const tld = labels.at(-1);
    const rev = [...labels].reverse();
    const levels = [{ cls: 'l0', lbl: '.', name: 'Root (Wurzel)', who: '13 Root-Server-Namen von <code>a.root-servers.net</code> bis <code>m.root-servers.net</code>, weltweit an über 1 000 Standorten gespiegelt' }];
    rev.forEach((l, i) => {
      const domain = rev.slice(0, i + 1).reverse().join('.');
      if (i === 0) {
        levels.push({ cls: 'l1', lbl: l, name: `Top-Level-Domain (TLD) · ${l.length === 2 ? 'Länderkennung' : 'generisch'}`, who: `TLD-Nameserver, betrieben von ${REGISTRY[l] || `der Registry für .${l}`}` });
      } else if (i === 1) {
        const sld = ['co', 'ac', 'gov', 'org'].includes(l) && labels.length > 2 && l.length <= 3 && tld.length === 2;
        levels.push({ cls: 'l2', lbl: l, name: sld ? 'Zwischenebene der Länderdomain' : 'Second-Level-Domain', who: sld ? `In manchen Ländern gibt es eine feste Zwischenebene – <code>${domain}</code> steht für Firmen bzw. Organisationen.` : `Wer <code>${esc(domain)}</code> registriert hat. Dessen Nameserver ist für alle Namen darunter <b>autoritativ</b> (zuständig).` });
      } else {
        levels.push({ cls: 'l3', lbl: l, name: i === rev.length - 1 && labels.length > 2 ? 'Subdomain bzw. Hostname' : 'Subdomain', who: `vom Inhaber frei vergeben – <code>${esc(domain)}</code>` });
      }
    });
    out.innerHTML = `
      <p class="dn-fqdn">${labels.map((l, i) => `<span class="dn-lab l${Math.min(3, labels.length - i)}">${esc(l)}</span>`).join('<i>.</i>')}<span class="dn-lab l0">.</span></p>
      <ol class="dn-levels">${levels.map((v, i) => `
        <li class="${v.cls}" style="--i:${i}"><b class="dn-lab ${v.cls}">${esc(v.lbl)}</b><div><strong>${v.name}</strong><small>${v.who}</small></div></li>`).join('')}
      </ol>
      <p class="note">Der Punkt ganz rechts steht für die Wurzel. Vollständig geschrieben heißt der Name <code>${esc(raw)}.</code> – im Browser lässt man ihn weg.</p>`;
  }
  $('#dn-name').addEventListener('input', renderTree);
  document.querySelectorAll('[data-name]').forEach(b => b.addEventListener('click', () => { $('#dn-name').value = b.dataset.name; renderTree(); }));
  renderTree();

  /* ---------- Auflösung ---------- */
  // Aufbau wie auf dem Arbeitsblatt: Resolver als hoher Block in der Mitte, Server rechts untereinander
  const N = {
    pc: { x: 20, y: 120, w: 150, h: 50, t: '💻 Laptop', s: ['Browser'] },
    res: { x: 290, y: 20, w: 120, h: 230, t: 'DNS-Resolver', s: ['z. B. Router', 'oder Provider'] },
    root: { x: 590, y: 20, w: 150, h: 46, t: 'Root-Server', s: ['„.“'] },
    tld: { x: 590, y: 112, w: 150, h: 46, t: 'TLD-Server', s: ['für .com'] },
    auth: { x: 590, y: 204, w: 150, h: 46, t: 'Nameserver', s: ['für example.com'] },
    web: { x: 590, y: 300, w: 150, h: 46, t: 'Webserver', s: ['192.0.2.44'] },
  };
  const mid = k => N[k].y + N[k].h / 2;
  // Schritte: [Text, Pfeile [von, nach, Beschriftung, Art], aktive Knoten]
  const COLD = [
    ['Im Browser wird <code>www.example.com</code> eingegeben. Der Laptop kennt die IP-Adresse noch nicht – sein Cache ist leer.', [], ['pc']],
    ['Der Laptop fragt seinen Resolver: „Welche IP-Adresse hat <code>www.example.com</code>?“ – per UDP an Port 53. Die Frage ist <b>rekursiv</b>: Er will die fertige Antwort.', [['pc', 'res', 'www.example.com?', 'q']], ['pc', 'res']],
    ['Der Resolver fragt einen <b>Root-Server</b>. Der kennt nicht alle Namen, aber die Server für jede Top-Level-Domain: „Frag den Server für <b>.com</b>.“', [['res', 'root', 'www.example.com?', 'q'], ['root', 'res', 'Frag .com-Server', 'a']], ['res', 'root']],
    ['Der Resolver fragt den <b>TLD-Server für .com</b>. Der kennt die Nameserver jeder .com-Domain: „Zuständig ist <code>ns1.example.com</code>.“', [['res', 'tld', 'www.example.com?', 'q'], ['tld', 'res', 'Frag ns1.example.com', 'a']], ['res', 'tld']],
    ['Der Resolver fragt den <b>Nameserver von example.com</b>. Der ist <b>autoritativ</b> – er hat den Eintrag selbst gespeichert.', [['res', 'auth', 'www.example.com?', 'q']], ['res', 'auth']],
    ['Antwort: „<code>www.example.com</code> hat die Adresse <b>192.0.2.44</b>, gültig für 3600 Sekunden (TTL).“', [['auth', 'res', 'A 192.0.2.44', 'a']], ['res', 'auth']],
    ['Der Resolver merkt sich die Antwort in seinem <b>Cache</b> und schickt sie an den Laptop. Auch der Laptop speichert sie.', [['res', 'pc', '192.0.2.44', 'a']], ['pc', 'res']],
    ['Jetzt kann der Browser den <b>Webserver</b> direkt ansprechen: eine HTTPS-Anfrage an <code>192.0.2.44</code>, Port 443.', [['pc', 'web', 'GET / · TCP 443', 'w']], ['pc', 'web']],
    ['Der Webserver schickt die Seite zurück. DNS hat dabei nur den Namen übersetzt – die Seite selbst kommt vom Webserver.', [['web', 'pc', 'Webseite', 'wa']], ['pc', 'web']],
  ];
  const WARM = [
    ['Zehn Minuten später wird <code>www.example.com</code> noch einmal aufgerufen.', [], ['pc']],
    ['Der Laptop schaut zuerst in seinen <b>eigenen DNS-Cache</b>: Treffer! Die Antwort ist noch 2 400 Sekunden gültig. Es geht <b>keine einzige</b> DNS-Anfrage ins Netz.', [], ['pc']],
    ['Der Browser spricht sofort den Webserver an.', [['pc', 'web', 'GET / · TCP 443', 'w']], ['pc', 'web']],
    ['Die Seite kommt zurück – viel schneller als beim ersten Mal. Fragt ein <b>anderes</b> Gerät im Netz, antwortet der Resolver aus seinem Cache, ohne Root und TLD zu fragen.', [['web', 'pc', 'Webseite', 'wa']], ['pc', 'web']],
  ];
  let warm = false;

  function arrow([f, t, lbl, kind], no, now) {
    const cls = `dn-arw ${kind}${now ? ' now' : ''}`;
    const mk = `marker-end="url(#dn-arr2${now ? (kind[0] === 'w' ? '-web' : '-now') : ''})"`;
    const label = (x, y) => `<text x="${x}" y="${y}" text-anchor="middle"><tspan class="dn-no">${no}</tspan> ${lbl}</text>`;
    if (kind === 'w' || kind === 'wa') {
      // Weg zum Webserver: erst nach unten, dann nach rechts
      const x = kind === 'w' ? 85 : 105, y = mid('web') + (kind === 'w' ? -8 : 10);
      const pts = kind === 'w' ? `${x},170 ${x},${y} 584,${y}` : `590,${y} ${x},${y} ${x},176`;
      return `<g class="${cls}"><polyline points="${pts}" ${mk}/>${label(350, kind === 'w' ? y - 7 : y + 16)}</g>`;
    }
    const srv = f === 'res' ? t : f;
    const q = kind === 'q';
    if (srv === 'pc') {
      const y = mid('pc') + (q ? -8 : 10);
      const [x1, x2] = q ? [170, 284] : [290, 176];
      return `<g class="${cls}"><line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" ${mk}/>${label(230, q ? y - 7 : y + 16)}</g>`;
    }
    const y = mid(srv) + (q ? -8 : 10);
    const [x1, x2] = q ? [410, 584] : [590, 416];
    return `<g class="${cls}"><line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" ${mk}/>${label(500, q ? y - 7 : y + 16)}</g>`;
  }

  function resSvg(steps, s) {
    const active = new Set(steps[s - 1]?.[2] || []);
    let g = '';
    steps.slice(0, s).forEach(([, arrows], i) => arrows.forEach(a => { g += arrow(a, i + 1, i === s - 1); }));
    const nodes = Object.entries(N).map(([k, n]) => {
      const cy = n.y + n.h / 2;
      return `
      <g class="dn-n${active.has(k) ? ' now' : ''}${k === 'web' ? ' web' : ''}">
        <rect x="${n.x}" y="${n.y}" width="${n.w}" height="${n.h}" rx="9"/>
        <text class="dn-nt" x="${n.x + n.w / 2}" y="${cy - 3 - (n.s.length - 1) * 7}" text-anchor="middle">${n.t}</text>
        ${n.s.map((t, i) => `<text class="dn-ns" x="${n.x + n.w / 2}" y="${cy + 13 + i * 14 - (n.s.length - 1) * 7}" text-anchor="middle">${t}</text>`).join('')}
      </g>`;
    }).join('');
    const cache = warm || s >= 7 ? '<text class="dn-cache" x="20" y="96">Cache des Laptops:</text><text class="dn-cache" x="20" y="110">www.example.com → 192.0.2.44</text>' : '';
    return `<svg class="dn-svg dn-res-svg" viewBox="0 0 760 360" role="img" aria-label="DNS-Auflösung über Resolver, Root-, TLD- und Domain-Nameserver">
      <defs>${['', 'now', 'web'].map(k => `<marker id="dn-arr2${k ? '-' + k : ''}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 L10 5 L0 10 z" class="dn-ah ${k}"/></marker>`).join('')}</defs>
      ${g}${nodes}${cache}</svg>`;
  }

  const cacheBtn = $('#dn-res-cache');
  const st = DIENSTE.stepper({
    last: () => (warm ? WARM : COLD).length, page: 'dienst-dns',
    step: $('#dn-res-step'), go: $('#dn-res-go'), reset: $('#dn-res-reset'),
    onReset() { warm = false; },
    render(s) {
      const steps = warm ? WARM : COLD;
      const shown = s;
      $('#dn-res').innerHTML = resSvg(steps, shown);
      const text = s === 0
        ? (warm ? 'Zweiter Aufruf derselben Seite – was ist diesmal anders?' : 'Klicke auf „Nächster Schritt“. Die Nummern entsprechen der Reihenfolge der Nachrichten.')
        : steps[shown - 1][0];
      $('#dn-res-say').innerHTML = `<p><span class="osi-stepno">${shown} / ${steps.length}</span>${text}</p>`;
      cacheBtn.disabled = warm || s < COLD.length;
    },
  });
  cacheBtn.addEventListener('click', () => {
    warm = true;
    st.restart();
  });

  /* ---------- nslookup ---------- */
  const SRV = 'Server:  fritz.box\nAddress:  192.168.178.1\n';
  const ZONE = {
    'example.com': { A: ['192.0.2.44'], AAAA: ['2001:db8::44'], MX: [[10, 'mail.example.com'], [20, 'mail2.example.com']], NS: ['ns1.example.com', 'ns2.example.com'], TXT: ['v=spf1 mx -all'] },
    'www.example.com': { A: ['192.0.2.44'], AAAA: ['2001:db8::44'] },
    'shop.example.com': { CNAME: 'www.example.com' },
    'mail.example.com': { A: ['192.0.2.25'] },
    'mail2.example.com': { A: ['198.51.100.25'] },
    'ns1.example.com': { A: ['192.0.2.53'] },
    'ns2.example.com': { A: ['198.51.100.53'] },
    'schule.example.com': { A: ['203.0.113.10'], AAAA: ['2001:db8:5c::10'] },
  };
  const PTR = { '192.0.2.44': 'www.example.com', '192.0.2.25': 'mail.example.com', '198.51.100.25': 'mail2.example.com', '192.0.2.53': 'ns1.example.com', '198.51.100.53': 'ns2.example.com', '203.0.113.10': 'schule.example.com' };
  const SOA = `example.com
        primary name server = ns1.example.com
        responsible mail addr = hostmaster.example.com
        serial  = 2026090701
        refresh = 10800 (3 hours)
        retry   = 3600 (1 hour)
        expire  = 604800 (7 days)
        default TTL = 3600 (1 hour)`;
  const NA = 'Nicht autorisierende Antwort:\n';
  const pad = s => s.padEnd(24);
  const hi = s => `<span class="c-hi">${s}</span>`;

  function lookup(cmd) {
    const tok = cmd.trim().split(/\s+/).filter(Boolean);
    if (tok[0]?.toLowerCase() === 'nslookup') tok.shift();
    let type = 'DEFAULT';
    const rest = [];
    for (const t of tok) {
      const m = t.match(/^-(?:type|q|querytype)=(\w+)$/i);
      if (m) type = m[1].toUpperCase();
      else rest.push(t);
    }
    const name = (rest[0] || '').toLowerCase().replace(/\.$/, '');
    if (!name || rest.length > 1) return 'Aufruf: nslookup [-type=A|AAAA|MX|NS|TXT|CNAME] name\nBeispiel: nslookup -type=mx example.com';
    if (!['DEFAULT', 'A', 'AAAA', 'MX', 'NS', 'TXT', 'CNAME', 'PTR', 'SOA'].includes(type)) return `*** Unbekannter Typ ${esc(type)}. Diese Simulation kennt A, AAAA, MX, NS, TXT, CNAME, PTR und SOA.`;
    // Reverse-Lookup
    if (IPv4.parse(name) !== null) {
      const n = PTR[name];
      return n ? `${SRV}\nName:    ${hi(n)}\nAddress:  ${name}` : `${SRV}\n*** ${esc(name)} wurde von fritz.box nicht gefunden: Non-existent domain.`;
    }
    if (!/(^|\.)example\.com$/.test(name) && !/\.example$/.test(name)) {
      return `${SRV}\n(Simulation: Hier gibt es nur Beispieldaten für example.com.\n Probiere „nslookup ${esc(name)}“ in der Eingabeaufforderung deines Rechners aus!)`;
    }
    let z = ZONE[name];
    if (!z) return `${SRV}\n*** ${esc(name)} wurde von fritz.box nicht gefunden: Non-existent domain.`;
    let out = `${SRV}\n${NA}`;
    if (type === 'DEFAULT' || type === 'A' || type === 'AAAA') {
      let alias = '';
      let real = name;
      if (z.CNAME) { alias = name; real = z.CNAME; z = ZONE[real]; }
      const addrs = [...(type !== 'A' ? z.AAAA || [] : []), ...(type !== 'AAAA' ? z.A || [] : [])];
      if (!addrs.length) return `${SRV}\n${real}\n${SOA.split('\n').slice(1).join('\n')}`;
      out += `Name:    ${real}\n${addrs.length > 1 ? 'Addresses:  ' : 'Address:  '}${addrs.map(hi).join('\n          ')}`;
      if (alias) out += `\nAliases:  ${alias}`;
      return out;
    }
    if (type === 'CNAME') return z.CNAME ? out + `${pad(name)}canonical name = ${hi(z.CNAME)}` : `${SRV}\n${SOA}`;
    if (type === 'SOA') return out + SOA;
    const rr = z[type];
    if (!rr) return `${SRV}\n${SOA}`;
    if (type === 'MX') return out + rr.map(([p, h]) => `${pad(name)}MX preference = ${p}, mail exchanger = ${hi(h)}`).join('\n');
    if (type === 'NS') return out + rr.map(h => `${pad(name)}nameserver = ${hi(h)}`).join('\n');
    if (type === 'TXT') return out + rr.map(t => `${pad(name)}text =\n\n        ${hi(`"${t}"`)}`).join('\n');
    return `${SRV}\n${SOA}`;
  }

  const con = $('#dn-con');
  function run(cmd) {
    con.innerHTML = `C:\\&gt; <span class="c-cmd">${esc(cmd.trim())}</span>\n${lookup(cmd)}`;
  }
  $('#dn-cmd-form').addEventListener('submit', e => { e.preventDefault(); run($('#dn-cmd').value); });
  document.querySelectorAll('[data-cmd]').forEach(b => b.addEventListener('click', () => { $('#dn-cmd').value = b.dataset.cmd; run(b.dataset.cmd); }));
  run($('#dn-cmd').value);
})();
