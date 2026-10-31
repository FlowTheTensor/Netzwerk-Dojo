/* IPv6 · Stationen 1–4: Aufbau, Adress-Werkstatt, Header-Vergleich, drei Adressen und EUI-64 */
'use strict';

(() => {
  const { $, $$, esc } = UI;

  // Hex-Ziffern als Kästchen, gefärbt nach Präfix (Netz) bzw. Interface-ID; regions: [[bisBit, Klasse], …]
  function nibbles(groups, cls) {
    const hex = groups.map(IPv6.hex4).join('');
    let h = '';
    for (let n = 0; n < 32; n++) {
      if (n && n % 4 === 0) h += '<span class="v6-colon">:</span>';
      h += `<span class="v6-nib ${cls(n)}" data-n="${n}">${hex[n]}</span>`;
    }
    return h;
  }

  /* ---------- Station 1: Anatomie einer Adresse ---------- */
  (function anatomy() {
    const el = $('#v6-anatomy');
    const g = IPv6.parse('2001:0db8:85a3:0042:3c1d:9a2b:71f4:e8c0').groups;
    const bits = IPv6.bits(g);
    const region = n => (n < 12 ? 'r-route' : n < 16 ? 'r-sub' : 'r-iid');
    let blocks = '';
    g.forEach((v, b) => {
      const hx = IPv6.hex4(v);
      blocks += `<div class="v6-blk"><div class="v6-blk-hex">${[...hx].map((c, k) => `<span class="v6-nib ${region(b * 4 + k)}" data-n="${b * 4 + k}">${c}</span>`).join('')}</div>
        <div class="v6-blk-bin">${[0, 1, 2, 3].map(k => `<span data-n="${b * 4 + k}">${bits.slice((b * 4 + k) * 4, (b * 4 + k) * 4 + 4)}</span>`).join('')}</div></div>`;
      if (b < 7) blocks += '<div class="v6-blk-sep">:</div>';
    });
    // Blöcke (Zeile 1) und Klammern (Zeile 2) in einem gemeinsamen Raster, damit sie exakt übereinander stehen
    el.innerHTML = `<div class="v6-anat-scroll"><div class="v6-anat-grid">${blocks}
        <div class="br r-route" style="grid-column: 1 / span 5"><b>Globales Routing-Präfix</b><small>48 Bit · vom Provider</small></div>
        <div class="br r-sub" style="grid-column: 7 / span 1"><b>Subnetz-ID</b><small>16 Bit · selbst gewählt</small></div>
        <div class="br r-iid" style="grid-column: 9 / span 7"><b>Interface-ID</b><small>64 Bit · bildet das Gerät</small></div>
      </div>
      <div class="v6-anat-sum"><span class="r-net">Präfix /64 = Netzanteil</span><span class="r-iid">Interface-ID = Hostanteil</span></div></div>`;
    el.addEventListener('mouseover', e => {
      const n = e.target.closest('[data-n]')?.dataset.n;
      $$('[data-n]', el).forEach(x => x.classList.toggle('hi', x.dataset.n === n));
    });
    el.addEventListener('mouseleave', () => $$('.hi', el).forEach(x => x.classList.remove('hi')));
  })();

  /* ---------- Station 2: Adress-Werkstatt ---------- */
  (function werkstatt() {
    const inp = $('#v6-in');
    const pin = $('#v6-p');
    const out = $('#v6-out');

    function show() {
      const p = Number(pin.value);
      $('#v6-p-out').textContent = `/${p}`;
      const r = IPv6.parse(inp.value);
      inp.classList.toggle('bad', !r.ok && inp.value.trim() !== '');
      if (!r.ok) {
        out.innerHTML = `<div class="v6-err"><b>✘ Keine gültige IPv6-Adresse.</b> ${r.err}</div>`;
        return;
      }
      const g = r.groups;
      const run = IPv6.zeroRun(g);
      const inRun = b => run.at >= 0 && b >= run.at && b < run.at + run.len;
      // Alle Null-Folgen finden – nur die längste (bei Gleichstand die erste) wird zu „::“
      const runs = [];
      for (let i = 0; i < 8;) {
        if (g[i] !== 0) { i++; continue; }
        let j = i;
        while (j < 8 && g[j] === 0) j++;
        runs.push({ at: i, len: j - i });
        i = j;
      }
      const otherRun = b => !inRun(b) && g[b] === 0;
      // volle Form: führende Nullen markieren
      const fullHtml = g.map(v => {
        const s = IPv6.hex4(v);
        const keep = v.toString(16).length;
        return `<span class="lz">${s.slice(0, 4 - keep)}</span>${s.slice(4 - keep)}`;
      }).join(':');
      const step1 = IPv6.noLeading(g).map((s, b) => (inRun(b) ? `<span class="zr">${s}</span>` : otherRun(b) ? `<span class="zr2">${s}</span>` : s)).join(':');
      const comp = IPv6.compress(g);
      const compHtml = esc(comp).replace('::', '<span class="dc">::</span>');
      const desc = r0 => (r0.len === 1 ? `1 Null-Block (Block ${r0.at + 1})` : `${r0.len} Null-Blöcke (Block ${r0.at + 1}–${r0.at + r0.len})`);
      const others = runs.filter(r0 => r0.at !== run.at);
      let runTxt;
      if (run.at < 0) {
        runTxt = runs.length
          ? `Hier gibt es nur einzelne Null-Blöcke – ein einzelner Block wird <b>nicht</b> durch „::“ ersetzt, er bleibt <code>0</code>.`
          : 'Es gibt keinen Null-Block – hier wird nichts durch „::“ ersetzt.';
      } else {
        runTxt = `Nur die <b>längste</b> Null-Folge wird zu „::“: ${desc(run)}.`;
        if (others.length) {
          const tie = others.some(r0 => r0.len === run.len);
          const where = others.map(r0 => (r0.len === 1 ? `Block ${r0.at + 1}` : `Block ${r0.at + 1}–${r0.at + r0.len}`)).join(' und ');
          runTxt += ` Die übrigen Nullen (${where}, grau umrandet) bleiben als <code>0</code> stehen` +
            (tie ? ' – bei gleich langen Folgen gewinnt die <b>erste</b>.' : ', weil „::“ nur <b>einmal</b> vorkommen darf.');
        }
      }
      const typed = inp.value.trim().toLowerCase().replace(/\/\d+$/, '');
      const note = typed !== comp && typed !== IPv6.full(g)
        ? `<p class="v6-note">Deine Schreibweise ist gültig – die empfohlene Kurzform ist aber <code>${esc(comp)}</code>.</p>` : '';
      const t = IPv6.typeOf(g);
      const net = IPv6.network(g, p);
      const iid = p % 16 === 0 && p < 128
        ? IPv6.noLeading(g).slice(p / 16).join(':')
        : IPv6.compress(IPv6.hostPart(g, p));
      out.innerHTML = `
        <div class="v6-steps">
          <div class="v6-step"><span class="v6-lbl">Volle Form</span><code class="v6-addr">${fullHtml}</code></div>
          <div class="v6-step"><span class="v6-lbl">① Führende Nullen weg</span><code class="v6-addr">${step1}</code></div>
          <div class="v6-step"><span class="v6-lbl">② Null-Blöcke → „::“</span><code class="v6-addr">${compHtml}</code><small>${runTxt}</small></div>
        </div>
        <div class="v6-result"><span class="v6-lbl">Gekürzt</span><code>${esc(comp)}</code><span class="tag">${t.name}</span></div>
        ${note}
        <div class="v6-prefix">
          <div class="v6-nibs">${nibbles(g, n => (n * 4 + 4 <= p ? 'r-net' : n * 4 >= p ? 'r-iid' : 'r-split'))}</div>
          <div class="legend"><span><i class="sw net"></i>Netzanteil (Präfix /${p})</span><span><i class="sw host"></i>Interface-ID (${128 - p} Bit)</span></div>
          <p>Netz: <code>${esc(IPv6.compress(net))}/${p}</code>${p < 128 ? ` · Interface-ID: <code>${esc(iid)}</code>` : ''}</p>
          <p class="muted small">${t.text}</p>
        </div>`;
      // Nibble, die das Präfix teilen, anteilig einfärben
      $$('.r-split', out).forEach(x => { x.style.setProperty('--cut', `${((p % 4) / 4) * 100}%`); });
    }
    inp.addEventListener('input', show);
    pin.addEventListener('input', show);
    $$('[data-v6]').forEach(b => b.addEventListener('click', () => { inp.value = b.dataset.v6; show(); }));
    show();
  })();

  /* ---------- Station 3: Header-Vergleich ---------- */
  (function header() {
    // [Schlüssel, Name, Bit, Status, Zeilen]
    const V4 = [
      [['ver4', 'Version', 4, 'same'], ['ihl', 'Header-Länge', 4, 'gone'], ['tos', 'Type of Service', 8, 'ren'], ['len4', 'Gesamtlänge', 16, 'ren']],
      [['id', 'Identifikation', 16, 'gone'], ['flags', 'Flags', 3, 'gone'], ['frag', 'Fragment-Offset', 13, 'gone']],
      [['ttl', 'TTL', 8, 'ren'], ['proto', 'Protokoll', 8, 'ren'], ['csum', 'Header-Prüfsumme', 16, 'gone']],
      [['src4', 'Absenderadresse (32 Bit)', 32, 'same']],
      [['dst4', 'Zieladresse (32 Bit)', 32, 'same']],
      [['opt', 'Optionen (0–40 Byte)', 32, 'gone']],
    ];
    const V6 = [
      [['ver6', 'Version', 4, 'same'], ['tc', 'Traffic Class', 8, 'ren'], ['flow', 'Flow Label', 20, 'new']],
      [['plen', 'Payload Length', 16, 'ren'], ['nh', 'Next Header', 8, 'ren'], ['hop', 'Hop Limit', 8, 'ren']],
      [['src6', 'Absenderadresse (128 Bit)', 32, 'same', 4]],
      [['dst6', 'Zieladresse (128 Bit)', 32, 'same', 4]],
    ];
    const PAIR = { ver4: 'ver6', tos: 'tc', len4: 'plen', ttl: 'hop', proto: 'nh', src4: 'src6', dst4: 'dst6' };
    Object.entries({ ...PAIR }).forEach(([a, b]) => { PAIR[b] = a; });
    const INFO = {
      ver4: 'Version: steht auf 4. Bei IPv6 heißt das Feld gleich und steht auf 6.',
      ver6: 'Version: steht auf 6 – daran erkennt ein Gerät sofort, dass es ein IPv6-Paket ist.',
      ihl: '<b>Header-Länge</b>: Weil der IPv4-Header wegen der Optionen unterschiedlich lang sein kann, steht hier seine Länge. Bei IPv6 ist der Header immer 40 Byte lang – das Feld <b>entfällt</b>.',
      tos: '<b>Type of Service</b> (heute DSCP/ECN): Priorität des Pakets, z. B. für Telefonie. Bei IPv6 heißt es <b>Traffic Class</b>.',
      tc: '<b>Traffic Class</b>: Priorität des Pakets – das frühere Type of Service.',
      len4: '<b>Gesamtlänge</b>: Header plus Daten. Bei IPv6 heißt es <b>Payload Length</b> und zählt nur die Daten nach dem 40-Byte-Header.',
      plen: '<b>Payload Length</b>: Länge der Daten nach dem Grundheader – ersetzt die Gesamtlänge.',
      id: '<b>Identifikation</b>: Damit setzt der Empfänger Bruchstücke (Fragmente) wieder zusammen. IPv6-Router fragmentieren nicht mehr – das Feld <b>entfällt</b> im Grundheader.',
      flags: '<b>Flags</b>: u. a. „Don’t Fragment“. Bei IPv6 <b>weggefallen</b>.',
      frag: '<b>Fragment-Offset</b>: Position eines Bruchstücks. Bei IPv6 <b>weggefallen</b> – wenn nötig, fragmentiert nur der Absender (mit einem Extension Header).',
      ttl: '<b>TTL</b> (Time to Live): Jeder Router zieht 1 ab, bei 0 wird das Paket verworfen. Bei IPv6 heißt das Feld <b>Hop Limit</b> – gleiche Aufgabe, passenderer Name.',
      hop: '<b>Hop Limit</b>: Jeder Router zieht 1 ab, bei 0 wird verworfen – genau wie die TTL bei IPv4. Nur muss danach keine Prüfsumme neu berechnet werden.',
      proto: '<b>Protokoll</b>: Welches Protokoll in den Daten steckt (z. B. 6 = TCP, 17 = UDP). Bei IPv6 heißt es <b>Next Header</b>.',
      nh: '<b>Next Header</b>: Was als Nächstes kommt – TCP, UDP oder ein Erweiterungs-Header (Extension Header). Ersetzt das Protokoll-Feld.',
      csum: '<b>Header-Prüfsumme</b>: Weil sich die TTL bei jedem Router ändert, muss jeder Router sie neu berechnen. Bei IPv6 <b>entfällt</b> sie – Fehler erkennen schon Ethernet (darunter) und TCP/UDP (darüber).',
      src4: 'Absenderadresse: 32 Bit bei IPv4.', src6: 'Absenderadresse: 128 Bit bei IPv6 – deshalb ist der Header trotz weniger Felder größer.',
      dst4: 'Zieladresse: 32 Bit bei IPv4.', dst6: 'Zieladresse: 128 Bit bei IPv6.',
      opt: '<b>Optionen</b>: selten genutzte Zusatzangaben, die den Header verlängern. Bei IPv6 <b>weggefallen</b> – stattdessen gibt es eigene Extension Header hinter dem Grundheader.',
      flow: '<b>Flow Label</b> (neu): Kennzeichnet zusammengehörende Pakete, z. B. eines Videostreams, damit Router sie gleich behandeln können.',
    };
    $('#v6-hdr4').innerHTML = UI.headerGrid(V4);
    $('#v6-hdr6').innerHTML = UI.headerGrid(V6);
    document.querySelector('.v6-hdrs').addEventListener('click', e => {
      const f = e.target.closest('[data-f]');
      if (!f) return;
      const k = f.dataset.f;
      $$('.v6-hdrs .v6-f').forEach(x => x.classList.toggle('sel', x.dataset.f === k || x.dataset.f === PAIR[k]));
      $('#v6-hdr-info').innerHTML = `<p>${INFO[k]}</p>`;
    });
  })();

  /* ---------- Station 3: Paket auf Reisen ----------
     Schritt für Schritt (oder automatisch): Was muss jeder Router am Header ändern?
     Die IPv4-Prüfsumme wird echt berechnet (RFC 1071), damit man sieht, dass sie sich bei jeder TTL ändert. */
  (function anim() {
    const el = $('#v6-anim');
    const ROUTERS = 3;
    const hx = n => n.toString(16).toUpperCase().padStart(4, '0');
    // Beispiel-Header: 192.168.1.10 → 203.0.113.5, TCP, Länge 60
    function checksum(ttl) {
      const w = [0x4500, 60, 0x1c46, 0x4000, (ttl << 8) | 6, 0, 0xc0a8, 0x010a, 0xcb00, 0x7105];
      let s = w.reduce((x, y) => x + y, 0);
      while (s > 0xffff) s = (s & 0xffff) + (s >> 16);
      return (~s) & 0xffff;
    }
    const STOPS = ['PC', 'Router 1', 'Router 2', 'Router 3', 'Ziel'];
    const lane = (key, title, fields) => `<div class="v6-lane" data-l="${key}">
      <div class="v6-lane-h"><b>${title}</b><span class="v6-hdrbox">${fields}</span><span class="v6-ops">Arbeitsschritte der Router: <b>0</b></span></div>
      <div class="v6-track">${STOPS.map((s, i) => `<div class="v6-stop${i && i <= ROUTERS ? ' rt' : ''}" style="left:${i * 25}%"><i></i><small>${s}</small></div>`).join('')}
        <div class="v6-pkt" style="left:0%">✉</div></div>
      <ol class="v6-log"></ol></div>`;
    el.innerHTML =
      lane('v4', 'IPv4', `TTL <b class="f-ttl">64</b> · Prüfsumme <b class="f-cs">${hx(checksum(64))}</b>`) +
      lane('v6', 'IPv6', 'Hop Limit <b class="f-ttl">64</b> · <span class="muted">keine Prüfsumme</span>') +
      '<div class="v6-anim-sum" aria-live="polite"></div>';
    const L = k => $(`[data-l="${k}"]`, el);
    const sum = $('.v6-anim-sum', el);
    let pos = 0;
    let timer = 0;

    function reset() {
      clearInterval(timer); timer = 0;
      pos = 0;
      for (const k of ['v4', 'v6']) {
        const l = L(k);
        $('.v6-pkt', l).style.left = '0%';
        $('.f-ttl', l).textContent = '64';
        $('.v6-ops b', l).textContent = '0';
        $('.v6-log', l).innerHTML = '';
        $$('.v6-stop', l).forEach(s => s.classList.remove('busy', 'seen'));
        l.classList.remove('done');
      }
      $('.f-cs', L('v4')).textContent = hx(checksum(64));
      sum.innerHTML = '';
      $('#v6-step').disabled = false;
      $('#v6-go').textContent = '▶ Automatisch abspielen';
    }

    function step() {
      if (pos > ROUTERS) return;
      pos++;
      for (const k of ['v4', 'v6']) {
        const l = L(k);
        $('.v6-pkt', l).style.left = `${pos * 25}%`;
        $$('.v6-stop', l).forEach((s, i) => { s.classList.toggle('busy', i === pos && pos <= ROUTERS); if (i < pos) s.classList.add('seen'); });
        const log = $('.v6-log', l);
        if (pos <= ROUTERS) {
          const ttl = 64 - pos;
          $('.f-ttl', l).textContent = ttl;
          const ops = Number($('.v6-ops b', l).textContent);
          if (k === 'v4') {
            const cs = checksum(ttl);
            $('.f-cs', l).textContent = hx(cs);
            $('.v6-ops b', l).textContent = ops + 2;
            log.innerHTML += `<li><b>Router ${pos}:</b> TTL ${ttl + 1} → ${ttl} · <span class="v6-extra">Prüfsumme neu berechnen: ${hx(checksum(ttl + 1))} → ${hx(cs)}</span></li>`;
          } else {
            $('.v6-ops b', l).textContent = ops + 1;
            log.innerHTML += `<li><b>Router ${pos}:</b> Hop Limit ${ttl + 1} → ${ttl} · fertig, weiterleiten</li>`;
          }
        } else {
          l.classList.add('done');
          log.innerHTML += `<li class="v6-arr"><b>Ziel erreicht</b> – ${k === 'v4' ? 'der Empfänger prüft die Prüfsumme' : 'Fehler erkennt TCP/UDP'}.</li>`;
        }
      }
      if (pos > ROUTERS) {
        clearInterval(timer); timer = 0;
        $('#v6-step').disabled = true;
        $('#v6-go').textContent = '↺ Nochmal';
        sum.innerHTML = `<p><b>Ergebnis:</b> Beide Pakete haben dasselbe erreicht – aber die IPv4-Router mussten <b>${ROUTERS * 2} Arbeitsschritte</b> erledigen, die IPv6-Router nur <b>${ROUTERS}</b>.
          Weil sich die TTL bei jedem Router ändert, ändert sich auch die Prüfsumme über den Header – also muss <b>jeder</b> IPv4-Router sie neu berechnen.
          IPv6 hat keine Header-Prüfsumme mehr: Der Router zählt nur das Hop Limit herunter. Ein großer Router leitet Millionen Pakete pro Sekunde weiter – da spart das spürbar Rechenzeit.</p>`;
      }
    }

    $('#v6-step').addEventListener('click', () => { clearInterval(timer); timer = 0; step(); });
    $('#v6-go').addEventListener('click', () => {
      if (pos > ROUTERS || timer) reset();
      if (pos === 0 && !timer) { step(); timer = setInterval(step, 1600); $('#v6-go').textContent = '⏸ läuft …'; }
    });
    $('#v6-reset').addEventListener('click', reset);
    reset();
  })();

  /* ---------- Station 4: ipconfig ---------- */
  (function ipconfig() {
    const pre = $('#v6-ipc');
    const LINES = [
      ['cmd', 'C:\\> ipconfig'], ['', ''], ['', 'Ethernet-Adapter Ethernet:'], ['', ''],
      ['', '   Verbindungsspezifisches DNS-Suffix:'],
      ['global', '   IPv6-Adresse. . . . . . . . . . . : 2001:db8:4a00:12:6c3e:91d4:b2a7:5d10'],
      ['temp', '   Temporäre IPv6-Adresse. . . . . . : 2001:db8:4a00:12:d94f:3b0e:8c21:a76e'],
      ['link', '   Verbindungslokale IPv6-Adresse  . : fe80::6c3e:91d4:b2a7:5d10%12'],
      ['v4', '   IPv4-Adresse  . . . . . . . . . . : 192.168.178.34'],
      ['v4', '   Subnetzmaske  . . . . . . . . . . : 255.255.255.0'],
      ['gw', '   Standardgateway . . . . . . . . . : fe80::1%12'],
      ['v4', '                                       192.168.178.1'],
    ];
    const INFO = {
      global: '<h3>IPv6-Adresse (global)</h3><p>Die <b>globale</b> Adresse: weltweit eindeutig und aus dem Internet erreichbar. Die ersten 64 Bit (<code>2001:db8:4a00:12</code>) sind das <b>Präfix</b>, das der Router im Netz bekannt gibt. Die letzten 64 Bit (<code>6c3e:91d4:b2a7:5d10</code>) sind die <b>Interface-ID</b>, die Windows selbst bildet – stabil, aber nicht aus der MAC-Adresse abgeleitet.</p>',
      temp: '<h3>Temporäre IPv6-Adresse</h3><p>Gleiches <b>Präfix</b>, aber eine <b>zufällige</b> Interface-ID, die Windows etwa täglich wechselt. Für Verbindungen ins Internet (z. B. Webseiten) nimmt Windows bevorzugt diese Adresse – so kann man das Gerät nicht dauerhaft an seiner Adresse wiedererkennen (Privacy Extension).</p>',
      link: '<h3>Verbindungslokale IPv6-Adresse</h3><p>Beginnt mit <code>fe80::</code> und ist <b>immer</b> vorhanden – auch ohne Router. Sie gilt nur im eigenen Netzsegment und wird nie geroutet. Hier hat sie dieselbe Interface-ID wie die globale Adresse.</p><p><code>%12</code> ist die <b>Zonen-ID</b>: die Nummer der Netzwerkkarte. Weil jede Karte eine fe80-Adresse hat, muss man bei mehreren Karten sagen, welche gemeint ist.</p>',
      gw: '<h3>Standardgateway</h3><p>Bei IPv6 ist das Gateway meist die <b>fe80-Adresse des Routers</b> – hier <code>fe80::1</code>. Der Router ist ja im selben Segment, eine verbindungslokale Adresse reicht dafür völlig. Darunter steht das IPv4-Gateway.</p>',
      v4: '<h3>IPv4 läuft parallel</h3><p>Fast alle Netze betreiben heute IPv4 und IPv6 gleichzeitig (<b>Dual Stack</b>). Deshalb stehen die bekannten IPv4-Angaben darunter.</p>',
      cmd: '<h3>ipconfig</h3><p>Zeigt die Adressen aller Netzwerkkarten. Mit <code>ipconfig /all</code> siehst du zusätzlich MAC-Adresse, DNS-Server und Gültigkeitsdauer der Adressen.</p>',
    };
    pre.innerHTML = LINES.map(([k, t]) => (k ? `<span class="v6-ln ${k === 'cmd' ? 'c-cmd ' : ''}" data-k="${k}" tabindex="0" role="button">${esc(t)}</span>` : esc(t))).join('\n');
    const info = $('#v6-ipc-info');
    function pick(k) {
      $$('.v6-ln', pre).forEach(x => x.classList.toggle('sel', x.dataset.k === k));
      info.innerHTML = INFO[k];
    }
    pre.addEventListener('click', e => { const l = e.target.closest('[data-k]'); if (l) pick(l.dataset.k); });
    pre.addEventListener('keydown', e => { const l = e.target.closest('[data-k]'); if (l && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); pick(l.dataset.k); } });
    pick('global');
  })();

  /* ---------- Station 4: EUI-64 Schritt für Schritt ---------- */
  (function eui() {
    const box = $('#v6-eui');
    const inp = $('#v6-mac');
    let step = 1;
    const B = (bytes, cls = '') => bytes.map(b => `<span class="v6-byte ${cls}">${IPv6.hex2(b).toUpperCase()}</span>`).join('');
    function render() {
      const mac = IPv6.parseMac(inp.value);
      inp.classList.toggle('bad', !mac);
      if (!mac) { box.innerHTML = '<p class="err-text">Keine gültige MAC-Adresse – nötig sind 12 Hex-Ziffern, z. B. 00:1A:2B:3C:4D:5E.</p>'; return; }
      const e = IPv6.eui64(mac);
      const bin = n => n.toString(2).padStart(8, '0');
      const flipBits = (n, hiCls) => [...bin(n)].map((c, i) => `<span class="${i === 6 ? hiCls : ''}">${c}</span>`).join('');
      const S = [
        `<div class="v6-es"><span class="v6-lbl">MAC-Adresse (48 Bit)</span><div>${B(mac)}</div></div>`,
        `<div class="v6-es"><span class="v6-lbl">① In der Mitte teilen</span><div>${B(mac.slice(0, 3))}<span class="v6-gap"></span>${B(mac.slice(3))}</div></div>`,
        `<div class="v6-es"><span class="v6-lbl">② FF FE einfügen</span><div>${B(mac.slice(0, 3))}${B([0xff, 0xfe], 'ins')}${B(mac.slice(3))}</div><small>Aus 48 werden 64 Bit.</small></div>`,
        `<div class="v6-es"><span class="v6-lbl">③ 7. Bit des ersten Bytes umdrehen</span>
          <div class="v6-flip"><code>${IPv6.hex2(mac[0]).toUpperCase()} = ${flipBits(mac[0], 'flip')}</code> → <code>${flipBits(e.first, 'flip')} = ${IPv6.hex2(e.first).toUpperCase()}</code></div>
          <small>Das 7. Bit von links ist das <b>U/L-Bit</b> (universal/local). Es wird umgedreht: 0 → 1 bzw. 1 → 0.</small></div>`,
        `<div class="v6-es"><span class="v6-lbl">④ In 4er-Blöcke schreiben</span><div><code class="v6-iid">${e.iid.map(IPv6.hex4).join(':')}</code></div><small>Das ist die Interface-ID (64 Bit).</small></div>`,
        `<div class="v6-es"><span class="v6-lbl">⑤ Mit dem Präfix fe80::/64</span><div><code class="v6-iid">${esc(IPv6.compress([0xfe80, 0, 0, 0, ...e.iid]))}</code></div><small>Die verbindungslokale Adresse – gekürzt, führende Nullen weg.</small></div>`,
      ];
      box.innerHTML = S.slice(0, step + 1).join('');
      $('#v6-eui-next').disabled = step >= S.length - 1;
    }
    $('#v6-eui-next').addEventListener('click', () => { step++; render(); });
    $('#v6-eui-reset').addEventListener('click', () => { step = 1; render(); });
    inp.addEventListener('input', () => { step = 5; render(); });
    render();
  })();
})();
