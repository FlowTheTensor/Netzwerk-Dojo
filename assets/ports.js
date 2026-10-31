/* Netzwerkdienste · Stationen 3–4: URL zerlegen und üben, Portbereiche, wichtige Ports, Sockets */
'use strict';

// Daten auch fürs Dienste-Dojo
Object.assign(DIENSTE, (() => {
  const DEFAULT_PORT = { http: 80, https: 443, ftp: 21, ssh: 22, sftp: 22, ws: 80, wss: 443 };
  const RANGES = [
    [0, 1023, 'System-Ports', 'Well-known Ports', 'fest vergeben an bekannte Dienste wie HTTP, SSH oder DNS'],
    [1024, 49151, 'Registrierte Ports', 'Registered Ports', 'bei der IANA für bestimmte Programme eingetragen, z. B. 3389 für Remotedesktop'],
    [49152, 65535, 'Dynamische Ports', 'Dynamic / Ephemeral Ports', 'frei – hier wählen Clients zufällig ihren Quellport'],
  ];
  // [Port, Protokoll, Name, Einsatz, unverschlüsselt ersetzt durch]
  const PORTS = [
    [20, 'TCP', 'FTP-Daten', 'Datenkanal von FTP', 'SFTP (22)'],
    [21, 'TCP', 'FTP', 'Dateiübertragung, Steuerkanal', 'SFTP (22)'],
    [22, 'TCP', 'SSH', 'verschlüsselter Fernzugriff auf die Konsole, auch Dateien (SFTP, SCP)'],
    [23, 'TCP', 'Telnet', 'Fernzugriff auf die Konsole', 'SSH (22)'],
    [25, 'TCP', 'SMTP', 'E-Mail-Versand zwischen Mailservern'],
    [53, 'UDP/TCP', 'DNS', 'Namensauflösung'],
    [67, 'UDP', 'DHCP', 'DHCP-Server'],
    [68, 'UDP', 'DHCP', 'DHCP-Client'],
    [80, 'TCP', 'HTTP', 'Webseiten', 'HTTPS (443)'],
    [110, 'TCP', 'POP3', 'E-Mails abholen und vom Server löschen', 'POP3S (995)'],
    [123, 'UDP', 'NTP', 'Uhrzeit synchronisieren'],
    [143, 'TCP', 'IMAP', 'E-Mails auf dem Server lesen und verwalten', 'IMAPS (993)'],
    [161, 'UDP', 'SNMP', 'Netzwerkgeräte überwachen und verwalten'],
    [443, 'TCP/UDP', 'HTTPS', 'Webseiten verschlüsselt (UDP für HTTP/3)'],
    [445, 'TCP', 'SMB', 'Windows-Dateifreigaben und Netzwerkdrucker'],
    [587, 'TCP', 'SMTP-Submission', 'E-Mail vom Mailprogramm an den eigenen Mailserver senden'],
    [993, 'TCP', 'IMAPS', 'IMAP verschlüsselt'],
    [995, 'TCP', 'POP3S', 'POP3 verschlüsselt'],
    [3389, 'TCP', 'RDP', 'Windows-Remotedesktop'],
  ];
  const rangeOf = n => RANGES.find(([a, b]) => n >= a && n <= b);

  // Zerlegt eine URL in Schema, Benutzer, Host, Port, Ordner, Ressource, Query, Fragment
  function parseUrl(str) {
    const m = str.trim().match(/^([a-z][a-z0-9+.-]*):(.*)$/i);
    if (!m) return null;
    const scheme = m[1].toLowerCase();
    let rest = m[2];
    const u = { scheme, user: '', host: '', port: '', path: '', query: '', fragment: '', auth: false };
    const hash = rest.indexOf('#');
    if (hash >= 0) { u.fragment = rest.slice(hash + 1); rest = rest.slice(0, hash); }
    const q = rest.indexOf('?');
    if (q >= 0) { u.query = rest.slice(q + 1); rest = rest.slice(0, q); }
    if (rest.startsWith('//')) {
      u.auth = true;
      rest = rest.slice(2);
      const slash = rest.indexOf('/');
      let a = slash >= 0 ? rest.slice(0, slash) : rest;
      u.path = slash >= 0 ? rest.slice(slash) : '';
      const at = a.lastIndexOf('@');
      if (at >= 0) { u.user = a.slice(0, at); a = a.slice(at + 1); }
      const hm = a.match(/^(\[[^\]]*\]|[^:]*)(?::(\d*))?$/);
      if (!hm || !hm[1]) return null;
      u.host = hm[1].toLowerCase();
      u.port = hm[2] || '';
    } else {
      u.path = rest;
    }
    const cut = u.path.lastIndexOf('/');
    u.dir = u.auth ? u.path.slice(0, cut + 1) || '/' : '';
    u.file = u.auth ? u.path.slice(cut + 1) : u.path;
    u.defPort = DEFAULT_PORT[scheme] || null;
    return u;
  }
  return { DEFAULT_PORT, RANGES, PORTS, rangeOf, parseUrl };
})());

(() => {
  const { $, $$, esc } = UI;
  const { RANGES, PORTS, rangeOf, parseUrl } = DIENSTE;
  const pick = a => a[Math.floor(Math.random() * a.length)];

  /* ---------- URL zerlegen ---------- */
  function hostKind(h) {
    if (h.startsWith('[')) return 'eine <b>IPv6-Adresse</b> – in URLs steht sie in eckigen Klammern, damit ihre Doppelpunkte nicht mit dem Port verwechselt werden. Kein DNS nötig.';
    if (IPv4.parse(h) !== null) return 'eine <b>IPv4-Adresse</b> statt eines Namens – kein DNS nötig.';
    return 'ein <b>Domainname</b>. Der Browser fragt per DNS nach der IP-Adresse.';
  }
  function renderUrl() {
    const inp = $('#dn-url');
    const u = parseUrl(inp.value);
    inp.classList.toggle('bad', !u);
    const out = $('#dn-url-out');
    if (!u) {
      out.innerHTML = '<p class="field-fb">Eine URL beginnt mit einem Schema und einem Doppelpunkt, z. B. <code>https://www.example.com/</code>.</p>';
      return;
    }
    const parts = [['sch', `${u.scheme}:${u.auth ? '//' : ''}`, 'Protokoll']];
    if (u.user) parts.push(['usr', `${u.user}@`, 'Benutzer']);
    if (u.auth) parts.push(['host', u.host, 'Host']);
    if (u.port) parts.push(['port', `:${u.port}`, 'Port']);
    if (u.auth && u.dir) parts.push(['dir', u.dir, 'Standort (Pfad)']);
    if (u.file) parts.push(['file', u.file, u.auth ? 'Ressource' : 'Adresse']);
    if (u.query) parts.push(['qry', `?${u.query}`, 'Query']);
    if (u.fragment) parts.push(['frag', `#${u.fragment}`, 'Fragment']);
    const rows = [['Protokoll', `<code>${esc(u.scheme)}</code> – ${{ https: 'HTTP verschlüsselt mit TLS', http: 'HTTP unverschlüsselt', ftp: 'File Transfer Protocol', mailto: 'öffnet das E-Mail-Programm', ssh: 'Secure Shell', sftp: 'SSH File Transfer Protocol' }[u.scheme] || 'ein weiteres Schema'}`]];
    if (!u.auth) {
      rows.push(['Ohne Server-Teil', `Nach dem Schema folgt kein <code>//</code>. ${u.scheme === 'mailto' ? `Der Browser öffnet das E-Mail-Programm mit dem Empfänger <code>${esc(u.file)}</code>.` : 'Es wird kein Server angegeben.'}`]);
    } else {
      if (u.user) rows.push(['Benutzer', `<code>${esc(u.user)}</code> – Anmeldename für den Server. Passwörter gehören nicht in eine URL!`]);
      rows.push(['Host', `<code>${esc(u.host)}</code> ist ${hostKind(u.host)}`]);
      rows.push(['Port', u.port ? `<code>${esc(u.port)}</code> – ausdrücklich angegeben${u.defPort && Number(u.port) === u.defPort ? ' (das ist ohnehin der Standardport)' : ''}` : u.defPort ? `steht nicht da – es gilt der Standardport <b>${u.defPort}</b> für ${esc(u.scheme)}` : 'nicht angegeben']);
      rows.push(['Standort', u.dir === '/' ? '<code>/</code> – das oberste Verzeichnis des Servers' : `<code>${esc(u.dir)}</code> – Ordner auf dem Server`]);
      rows.push(['Ressource', u.file ? `<code>${esc(u.file)}</code> – die angeforderte Datei` : 'keine Datei angegeben – der Server liefert seine Startseite, meist <code>index.html</code>']);
    }
    if (u.query) rows.push(['Query', `Parameter für den Server: ${u.query.split('&').map(p => `<code>${esc(p)}</code>`).join(', ')}`]);
    if (u.fragment) rows.push(['Fragment', `<code>#${esc(u.fragment)}</code> – Sprungmarke innerhalb der Seite. Wird <b>nicht</b> an den Server geschickt.`]);
    out.innerHTML = `
      <div class="dn-url-parts">${parts.map(([c, t, l]) => `<span class="dn-up u-${c}"><b>${esc(t)}</b><small>${l}</small></span>`).join('')}</div>
      <div class="tbl-wrap"><table class="tbl compact kb-eth-tbl"><tbody>${rows.map(([k, v]) => `<tr><th>${k}</th><td>${v}</td></tr>`).join('')}</tbody></table></div>`;
  }
  $('#dn-url').addEventListener('input', renderUrl);
  $$('[data-url]').forEach(b => b.addEventListener('click', () => { $('#dn-url').value = b.dataset.url; renderUrl(); }));
  renderUrl();

  /* ---------- Übung: URL-Teile ---------- */
  (function urlTask() {
    const el = $('#dn-url-task');
    const HOSTS = ['www.example.com', 'intranet.schule.example', 'shop.example.org', '172.30.10.12', '192.168.1.20', 'cloud.example.net'];
    const DIRS = ['/', '/schule/', '/downloads/2026/', '/wiki/', '/klassen/10b/', '/beispiel1/', '/admin/'];
    const FILES = ['index.html', 'stundenplan.html', 'aufgabe.pdf', 'logo.png', 'status.php', 'preise.html'];
    const FIELDS = [['sch', 'Protokoll'], ['host', 'Host'], ['port', 'Port'], ['dir', 'Standort (Pfad)'], ['file', 'Ressource']];
    let t;
    function task(first) {
      if (first) {
        t = { sch: 'http', host: 'beispiel.de', port: '', dir: '/beispiel1/', file: 'index.html', query: '' };
      } else {
        const sch = pick(['https', 'https', 'http', 'ftp']);
        const port = Math.random() < .35 ? String(sch === 'ftp' ? pick([21, 2121]) : pick([8080, 8443, 3000])) : '';
        t = { sch, host: pick(HOSTS), port, dir: pick(DIRS), file: pick(FILES), query: sch !== 'ftp' && Math.random() < .3 ? pick(['?id=42', '?suche=netzwerk', '?lang=de']) : '' };
      }
      t.url = `${t.sch}://${t.host}${t.port ? ':' + t.port : ''}${t.dir}${t.file}${t.query}`;
      t.want = { sch: t.sch, host: t.host, port: t.port || String(DIENSTE.DEFAULT_PORT[t.sch]), dir: t.dir, file: t.file };
      el.innerHTML = `
        <p class="dn-task-url"><code>${esc(t.url)}</code></p>
        <div class="fields">${FIELDS.map(([k, l]) => `<label class="field"><span>${l}</span><input data-k="${k}" spellcheck="false" autocomplete="off"${k === 'port' ? ' inputmode="numeric"' : ''}></label>`).join('')}</div>
        <div class="osi-pz-fb" aria-live="polite"></div>
        <div class="row-actions">
          <button type="button" class="btn primary" data-act="check">Prüfen</button>
          <button type="button" class="btn" data-act="new">Neue Aufgabe</button>
          <button type="button" class="btn ghost" data-act="solve">Lösung zeigen</button>
        </div>`;
    }
    const norm = (k, v) => {
      v = v.trim().toLowerCase();
      if (k === 'sch') return v.replace(/:\/*$/, '');
      if (k === 'dir') return v.replace(/^\/+|\/+$/g, '');
      return v;
    };
    function check() {
      let right = 0;
      $$('input[data-k]', el).forEach(f => {
        const ok = norm(f.dataset.k, f.value) === norm(f.dataset.k, t.want[f.dataset.k]);
        f.classList.toggle('bad', !ok);
        f.classList.toggle('good', ok);
        if (ok) right++;
      });
      const fb = $('.osi-pz-fb', el);
      if (right === FIELDS.length) {
        fb.innerHTML = '<p class="osi-pz-done">Alles richtig!</p>';
        FX.burstFrom(fb.firstChild);
      } else {
        fb.innerHTML = `<p>${right} von ${FIELDS.length} Feldern richtig.${!t.port && !$('input[data-k="port"]', el).classList.contains('good') ? ' Tipp: Steht kein Port da, gilt der Standardport des Protokolls.' : ''}</p>`;
      }
    }
    el.addEventListener('click', e => {
      const act = e.target.closest('[data-act]')?.dataset.act;
      if (act === 'new') task();
      if (act === 'check') check();
      if (act === 'solve') {
        $$('input[data-k]', el).forEach(f => { f.value = t.want[f.dataset.k]; });
        check();
      }
    });
    el.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.matches('input[data-k]')) check(); });
    task(true);
  })();

  /* ---------- Portbereiche ---------- */
  const { fmt } = DIENSTE;
  function renderPort() {
    const inp = $('#dn-port');
    const n = Number(inp.value);
    const ok = inp.value.trim() !== '' && Number.isInteger(n) && n >= 0 && n <= 65535;
    inp.classList.toggle('bad', !ok);
    const r = ok ? rangeOf(n) : null;
    $('#dn-ranges').innerHTML = RANGES.map(([a, b, de, en, txt]) => `
      <div class="dn-range${r && r[0] === a ? ' on' : ''}"><b>${fmt(a)} – ${fmt(b)}</b><strong>${de}</strong><small>${en}</small><p>${txt}</p></div>`).join('');
    const out = $('#dn-port-out');
    if (!ok) {
      out.innerHTML = `<p>${n > 65535 ? `Port ${esc(inp.value)} gibt es nicht: 16 Bit reichen nur bis 65 535.` : 'Gib eine Zahl von 0 bis 65 535 ein.'}</p>`;
      return;
    }
    const known = PORTS.filter(p => p[0] === n);
    out.innerHTML = `<p>Port <b>${n}</b> gehört zu den <b>${r[2]}</b>. ${known.length
      ? known.map(p => `Bekannt als <b>${p[2]}</b> (${p[1]}): ${p[3]}.${p[4] ? ` Unverschlüsselt – heute ersetzt durch ${p[4]}.` : ''}`).join(' ')
      : r[0] === 49152 ? 'Hier würde ein Client seinen zufälligen Quellport wählen. (Linux nimmt dafür übrigens meist 32 768 bis 60 999.)' : 'In der Tabelle unten steht er nicht.'}</p>`;
  }
  $('#dn-port').addEventListener('input', renderPort);
  renderPort();

  $('#dn-ports').innerHTML = `<thead><tr><th>Port</th><th>Transport</th><th>Dienst</th><th>Einsatz</th></tr></thead><tbody>${PORTS.map(([n, pr, name, use, alt]) => `
    <tr class="${alt ? 'dn-alt' : ''}"><td><b>${n}</b></td><td>${pr}</td><td><b>${name}</b></td><td>${use}${alt ? ` <span class="kb-old">unverschlüsselt</span> → ${alt}` : ''}</td></tr>`).join('')}</tbody>`;

  /* ---------- Sockets ---------- */
  const ME = '192.168.1.80';
  const APPS = [
    { id: 'tab1', icon: '🌐', name: 'Browser, Tab 1', sp: 51832, ip: '192.0.2.44', dp: 443, pr: 'TCP', say: 'Tab 1 lädt <code>www.example.com</code>. Ziel ist der Webserver auf Port <b>443</b>. Der Browser hat sich den Quellport <b>51832</b> ausgesucht – an diesen Port kommt die Antwort zurück.' },
    { id: 'tab2', icon: '🌐', name: 'Browser, Tab 2', sp: 51833, ip: '192.0.2.44', dp: 443, pr: 'TCP', say: 'Tab 2 spricht <b>denselben</b> Server-Socket <code>192.0.2.44:443</code> an wie Tab 1. Unterscheiden kann der Server die beiden Verbindungen nur am <b>Quellport</b>: 51832 und 51833.' },
    { id: 'mail', icon: '✉', name: 'Mailprogramm', sp: 51840, ip: '192.0.2.25', dp: 993, pr: 'TCP', say: 'Das Mailprogramm holt neue Nachrichten per <b>IMAPS</b> – Zielport <b>993</b> auf dem Mailserver.' },
    { id: 'dns', icon: '📖', name: 'DNS-Anfrage', sp: 61001, ip: '192.168.1.1', dp: 53, pr: 'UDP', say: 'Bevor der Browser eine Seite laden kann, fragt das Betriebssystem den Resolver – per <b>UDP</b> an Port <b>53</b>.' },
  ];
  const SERVERS = [
    ['192.0.2.44', 'Webserver', [[443, 'HTTPS'], [80, 'HTTP'], [22, 'SSH']]],
    ['192.0.2.25', 'Mailserver', [[993, 'IMAPS'], [587, 'SMTP-Submission'], [25, 'SMTP']]],
    ['192.168.1.1', 'Router', [[53, 'DNS'], [67, 'DHCP'], [443, 'Weboberfläche']]],
  ];
  let cur = APPS[0];
  function renderSock() {
    const sock = (ip, p) => `<code>${ip}:<b>${p}</b></code>`;
    $('#dn-sock').innerHTML = `
      <div class="dn-host"><h3>💻 Laptop <small>${ME}</small></h3>
        ${APPS.map(a => `<button type="button" class="dn-app${a === cur ? ' on' : ''}" data-app="${a.id}"><span>${a.icon} ${a.name}</span><small>Quellport ${a.sp}</small></button>`).join('')}
      </div>
      <div class="dn-pkts">
        <div class="dn-seg"><small>Hin · ${cur.pr}-Segment</small><p>Quelle ${sock(ME, cur.sp)}</p><p>Ziel ${sock(cur.ip, cur.dp)}</p></div>
        <div class="dn-seg back"><small>Zurück · Ports vertauscht</small><p>Quelle ${sock(cur.ip, cur.dp)}</p><p>Ziel ${sock(ME, cur.sp)}</p></div>
      </div>
      <div class="dn-servers">${SERVERS.map(([ip, name, ports]) => `
        <div class="dn-host${ip === cur.ip ? ' on' : ''}"><h3>${name} <small>${ip}</small></h3>
          ${ports.map(([p, s]) => `<span class="dn-listen${ip === cur.ip && p === cur.dp ? ' on' : ''}">:${p} ${s}</span>`).join('')}
        </div>`).join('')}
      </div>
      <p class="dn-sock-say">${cur.say}</p>`;
  }
  $('#dn-sock').addEventListener('click', e => {
    const b = e.target.closest('[data-app]');
    if (!b) return;
    cur = APPS.find(a => a.id === b.dataset.app);
    renderSock();
  });
  renderSock();
})();
