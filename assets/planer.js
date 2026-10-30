/* Station 5 – Firmennetz-Planer */
'use strict';

(() => {
  const { $, $$, esc } = UI;
  const F = IPv4.format;
  const fmt = IPv4.fmtNum;
  const root = $('#planer');

  const CLS = {
    A: { prefix: 8, block: IPv4.RFC1918[0] },
    B: { prefix: 16, block: IPv4.RFC1918[1] },
    C: { prefix: 24, block: IPv4.RFC1918[2] },
  };
  const DEPTS = [
    { key: 'v', name: 'Verwaltung', hosts: 25, devices: ['PC-V1', 'PC-V2', 'Drucker-V'] },
    { key: 'e', name: 'Entwicklung', hosts: 50, devices: ['PC-E1', 'PC-E2', 'Server-E'] },
    { key: 'r', name: 'Reparatur', hosts: 12, devices: ['PC-R1', 'PC-R2', 'Testplatz-R'] },
  ];

  const ok = h => ({ t: 'ok', h });
  const err = h => ({ t: 'err', h });
  const info = h => ({ t: 'info', h });
  const fbList = msgs => (msgs.length ? `<ul class="fb">${msgs.map(m => `<li class="${m.t}">${m.h}</li>`).join('')}</ul>` : '');
  const pct = (a, b) => Math.round((a / b) * 100) + ' %';

  /* ---------- Zustand ---------- */

  function fresh() {
    return {
      v: 1, mode: 'classful', cls: null, base: '', baseMask: '', help: false, zoom: true,
      depts: DEPTS.map(d => ({
        key: d.key, name: d.name, hosts: d.hosts, net: '', mask: '', gw: '',
        devices: d.devices.map(n => ({ name: n, ip: '', mask: '', gw: '' })),
      })),
    };
  }
  const valid = s => s && s.v === 1 && Array.isArray(s.depts) && s.depts.length === 3 &&
    s.depts.every(d => Array.isArray(d.devices) && d.devices.length === 3);

  function load() {
    const qp = new URLSearchParams(location.search).get('plan');
    if (qp) {
      try {
        const s = JSON.parse(decodeURIComponent(escape(atob(qp))));
        if (valid(s)) return s;
      } catch { /* ungültiger Link – Standard laden */ }
    }
    const st = UI.store.get('plan');
    return valid(st) ? st : fresh();
  }

  let S = load();
  let sel = null; // 'router' | 'dev:i:k'

  function getBind(b) {
    const [k, a, c, d] = b.split(':');
    if (k === 'base') return S.base;
    if (k === 'baseMask') return S.baseMask;
    if (k === 'dept') return S.depts[a][c];
    if (k === 'gw') return S.depts[a].gw;
    if (k === 'dev') return S.depts[a].devices[c][d];
    return '';
  }
  function setBind(b, v) {
    const [k, a, c, d] = b.split(':');
    if (k === 'base') S.base = v;
    else if (k === 'baseMask') S.baseMask = v;
    else if (k === 'dept') S.depts[a][c] = c === 'hosts' ? (parseInt(v, 10) || 0) : v;
    else if (k === 'gw') S.depts[a].gw = v;
    else if (k === 'dev') S.depts[a].devices[c][d] = v;
  }
  function syncInputs(scope = root) {
    $$('[data-bind]', scope).forEach(el => {
      if (document.activeElement === el) return;
      const v = getBind(el.dataset.bind);
      el.value = v ?? '';
    });
    $('#p-help').checked = S.help;
    $('#p-zoom').checked = S.zoom;
  }

  /* ---------- Prüfungen ---------- */

  // Klassenbasiert ist das Firmennetz der gesamte private Bereich der Klasse (z. B. 192.168.0.0/16)
  const basePrefix = () => (S.mode === 'classful' ? CLS[S.cls].block.prefix : IPv4.parseMask(S.baseMask));
  const inName = () => (S.mode === 'classful' ? `privaten Klasse-${S.cls}-Bereich` : 'Firmennetz');

  function checkBase() {
    const r = { ok: false, msgs: [] };
    // Noch nichts gewählt bzw. eingetragen: Schritt ist offen, kein Fehler
    if (S.mode === 'classful' ? !S.cls : !S.base.trim() && !S.baseMask.trim()) {
      r.empty = true;
      r.msgs.push(info(S.mode === 'classful'
        ? 'Wähle oben eine <b>Klasse</b>. Daraus ergibt sich der private Bereich, aus dem die Firma ihre Netze nimmt.'
        : 'Trage Netzadresse und Subnetzmaske des Firmennetzes ein.'));
      return r;
    }
    const ip = S.mode === 'classful' ? CLS[S.cls].block.start : IPv4.parse(S.base);
    const p = basePrefix();
    if (ip === null) {
      r.msgs.push(err('Die Netzadresse ist keine gültige IPv4-Adresse (Format a.b.c.d, jede Zahl 0 – 255).'));
      return r;
    }
    if (p === null) {
      r.msgs.push(err('Die Subnetzmaske ist ungültig. Erlaubt sind Punktschreibweise (z. B. 255.255.0.0) oder ein Präfix (z. B. /16). Die Einsen müssen links lückenlos stehen.'));
      return r;
    }
    const blk = IPv4.privateBlock(ip);
    const c = IPv4.classOf(ip);
    if (S.mode === 'classful') {
      // fest vorgegeben, nichts zu prüfen
    } else if (!blk) {
      r.msgs.push(err(`${F(ip)} liegt in keinem privaten Block nach RFC 1918 (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16).`));
    } else if (p < blk.prefix) {
      r.msgs.push(err(`/${p} ist größer als der private Block ${blk.cidr} – das Netz würde öffentliche Adressen enthalten. Wähle mindestens /${blk.prefix}.`));
    }
    const n = IPv4.network(ip, p);
    if (n !== ip) {
      r.msgs.push(err(`Bei /${p} müssen alle Host-Bits 0 sein. ${F(ip)} ist keine Netzadresse – die Netzadresse wäre <b>${F(n)}</b>.`));
    }
    if (p > 28) r.msgs.push(err(`/${p} ist zu klein – darin haben drei Abteilungen mit Router keinen Platz.`));
    if (r.msgs.length) return r;

    Object.assign(r, { ok: true, net: ip, p, bc: IPv4.broadcast(ip, p), blk, cls: c });
    r.msgs.push(ok(S.mode === 'classful'
      ? `Privater Klasse-${S.cls}-Bereich <b>${blk.cidr}</b>: ${fmt(IPv4.size(p))} Adressen von ${F(ip)} bis ${F(r.bc)} – das sind ${blk.classful}.`
      : `Firmennetz <b>${F(ip)}/${p}</b> (Maske ${F(IPv4.mask(p))}): ${fmt(IPv4.size(p))} Adressen von ${F(ip)} bis ${F(r.bc)}.`));
    if (S.mode === 'cidr' && c.prefix && p !== c.prefix) {
      r.msgs.push(info(p < c.prefix
        ? `Historisch betrachtet fasst /${p} ${fmt(2 ** (c.prefix - p))} Klasse-${c.cls}-Netze zusammen.`
        : `Historisch betrachtet ist das ein Teil eines Klasse-${c.cls}-Netzes (1/${fmt(2 ** (p - c.prefix))} davon).`));
    }
    return r;
  }

  function checkDept(d, base) {
    const r = { status: 'empty', errs: [], msgs: [], need: Math.max(0, d.hosts | 0) + 1 };
    if (!d.net.trim() && !d.mask.trim()) return r;
    if (!base.ok) r.errs.push('Das Firmennetz aus Schritt 2 ist noch nicht gültig.');
    const net = IPv4.parse(d.net);
    const p = IPv4.parseMask(d.mask);
    if (net === null) r.errs.push(d.net.trim() ? 'Die Netzadresse ist keine gültige IPv4-Adresse.' : 'Netzadresse fehlt.');
    if (p === null) r.errs.push(d.mask.trim() ? 'Die Subnetzmaske ist ungültig (z. B. 255.255.255.192 oder /26).' : 'Subnetzmaske fehlt.');
    if (net === null || p === null) return r;

    Object.assign(r, { parsed: true, p, net: IPv4.network(net, p), bc: IPv4.broadcast(net, p) });
    if (r.net !== net) {
      const blk = p % 8 ? ` (Blockgröße im ${Math.floor(p / 8) + 1}. Oktett: ${256 - IPv4.octets(IPv4.mask(p))[Math.floor(p / 8)]})` : '';
      r.errs.push(`${F(net)} ist bei /${p} keine Netzadresse – die Host-Bits sind nicht alle 0${blk}. Die Netzadresse wäre <b>${F(r.net)}</b>.`);
    }
    if (base.ok) {
      if (p < base.p || !IPv4.contains(base.net, base.p, r.net)) r.errs.push(`Liegt nicht im ${inName()} ${F(base.net)}/${base.p}.`);
      else r.inside = true;
    }
    const cp = S.cls ? CLS[S.cls].prefix : 0;
    if (S.mode === 'classful' && p < cp) {
      r.errs.push(`Ein Klasse-${S.cls}-Netz ist höchstens /${cp} groß (${F(IPv4.mask(cp))}). /${p} würde mehrere Klasse-${S.cls}-Netze zusammenfassen – das geht nur klassenlos (CIDR).`);
    }
    if (p > 30) r.errs.push(`/${p} hat keine nutzbaren Host-Adressen.`);
    else if (IPv4.hosts(p) < r.need) {
      r.errs.push(`Zu klein: /${p} bietet ${fmt(IPv4.hosts(p))} nutzbare Adressen, gebraucht werden ${fmt(d.hosts)} Hosts + 1 Router = <b>${fmt(r.need)}</b>.`);
    }
    return r;
  }

  function checkDepts(base) {
    const rs = S.depts.map(d => checkDept(d, base));
    for (let i = 0; i < 3; i++) {
      for (let j = i + 1; j < 3; j++) {
        const a = rs[i];
        const b = rs[j];
        if (a.parsed && b.parsed && IPv4.overlaps(a.net, a.p, b.net, b.p)) {
          a.errs.push(`Überschneidet sich mit <b>${esc(S.depts[j].name)}</b> (${F(b.net)}/${b.p}).`);
          b.errs.push(`Überschneidet sich mit <b>${esc(S.depts[i].name)}</b> (${F(a.net)}/${a.p}).`);
        }
      }
    }
    // FLSM: Alle Subnetze müssen dieselbe Maske haben
    const parsed = rs.map((r, i) => ({ r, i })).filter(x => x.r.parsed);
    if (new Set(parsed.map(x => x.r.p)).size > 1) {
      const list = parsed.map(x => `${esc(S.depts[x.i].name)} /${x.r.p}`).join(', ');
      parsed.forEach(x => x.r.errs.push(`Alle Subnetze müssen gleich groß sein (gleiche Maske). Bisher: ${list}.`));
    }
    rs.forEach(r => {
      if (!r.parsed && !r.errs.length) return;
      r.status = r.errs.length ? 'err' : 'ok';
      r.msgs = r.errs.map(err);
      if (r.status === 'ok') {
        const u = IPv4.hosts(r.p);
        r.msgs.push(ok(`${F(r.net)}/${r.p}: Hosts ${F(r.net + 1)} bis ${F(r.bc - 1)}, Broadcast ${F(r.bc)}. Nutzbar ${fmt(u)}, benötigt ${fmt(r.need)} (Auslastung ${pct(r.need, u)}).`));
      }
    });
    return rs;
  }

  function hostAddrErrs(a, dr, count) {
    const e = [];
    if (dr.status !== 'ok') return ['Das Subnetz dieser Abteilung ist noch nicht korrekt (Schritt 3).'];
    if (!IPv4.contains(dr.net, dr.p, a)) e.push(`${F(a)} liegt nicht im Subnetz ${F(dr.net)}/${dr.p} (gültig: ${F(dr.net + 1)} – ${F(dr.bc - 1)}).`);
    else if (a === dr.net) e.push(`${F(a)} ist die <b>Netzadresse</b> – sie bezeichnet das Netz selbst und darf keinem Gerät gegeben werden.`);
    else if (a === dr.bc) e.push(`${F(a)} ist die <b>Broadcast-Adresse</b> – sie darf keinem Gerät gegeben werden.`);
    if (count.get(a) > 1) e.push(`${F(a)} ist <b>doppelt vergeben</b> – jede Adresse darf es nur einmal geben.`);
    return e;
  }

  function checkGw(d, dr, count) {
    const r = { status: 'empty', msgs: [], ip: null };
    if (!d.gw.trim()) return r;
    const a = IPv4.parse(d.gw);
    const e = a === null ? ['Keine gültige IPv4-Adresse.'] : hostAddrErrs(a, dr, count);
    r.status = e.length ? 'err' : 'ok';
    r.ip = a;
    r.msgs = e.length ? e.map(err) : [ok(`Passt – ${F(a)} ist das Standard-Gateway der Abteilung ${esc(d.name)}.`)];
    return r;
  }

  function checkDev(x, d, dr, gw, count) {
    const r = { status: 'empty', msgs: [] };
    if (!x.ip.trim() && !x.mask.trim() && !x.gw.trim()) return r;
    const e = [];
    const a = IPv4.parse(x.ip);
    if (!x.ip.trim()) e.push('IP-Adresse fehlt.');
    else if (a === null) e.push('Die IP-Adresse ist ungültig.');
    else e.push(...hostAddrErrs(a, dr, count));

    const p = IPv4.parseMask(x.mask);
    if (!x.mask.trim()) e.push('Subnetzmaske fehlt.');
    else if (p === null) e.push('Die Subnetzmaske ist ungültig.');
    else if (dr.status === 'ok' && p !== dr.p) {
      e.push(`Falsche Maske: Das Subnetz von ${esc(d.name)} ist /${dr.p} = ${F(IPv4.mask(dr.p))}. ` +
        (p < dr.p
          ? 'Mit dieser Maske hält das Gerät fremde Adressen für „lokal“ und schickt Pakete nicht zum Router.'
          : 'Mit dieser Maske hält das Gerät Teile des eigenen Netzes für „fremd“.'));
    }

    const g = IPv4.parse(x.gw);
    if (!x.gw.trim()) e.push('Standard-Gateway fehlt – ohne Gateway erreicht das Gerät keine anderen Abteilungen.');
    else if (g === null) e.push('Das Standard-Gateway ist keine gültige IPv4-Adresse.');
    else if (gw.status !== 'ok') e.push('Gib zuerst der Router-Schnittstelle dieser Abteilung eine gültige Adresse (Router anklicken).');
    else if (g !== gw.ip) e.push(`Falsches Gateway: Der Router hat im Subnetz von ${esc(d.name)} die Adresse <b>${F(gw.ip)}</b>.`);

    r.status = e.length ? 'err' : 'ok';
    r.msgs = e.length ? e.map(err) : [ok('Alles korrekt – das Gerät erreicht das eigene Netz direkt und andere Abteilungen über den Router.')];
    return r;
  }

  function checkAddrs(drs) {
    const count = new Map();
    const add = v => {
      const a = IPv4.parse(v);
      if (a !== null) count.set(a, (count.get(a) || 0) + 1);
    };
    S.depts.forEach(d => { add(d.gw); d.devices.forEach(x => add(x.ip)); });
    const gws = S.depts.map((d, i) => checkGw(d, drs[i], count));
    const devs = S.depts.map((d, i) => d.devices.map(x => checkDev(x, d, drs[i], gws[i], count)));
    return { gws, devs };
  }

  /* ---------- Aufbau der statischen Teile ---------- */

  function buildStatic() {
    $('#p-classes').innerHTML = Object.entries(CLS).map(([k, c]) => `
      <button type="button" class="class-card" data-cls="${k}">
        <span class="cc-letter">${k}</span>
        <span class="cc-body"><b>Klasse ${k}</b> · /${c.prefix} · ${F(IPv4.mask(c.prefix))}
          <small>privat: ${c.block.range}</small>
          <small>${fmt(IPv4.hosts(c.prefix))} Hosts pro Netz</small></span>
      </button>`).join('');

    $('#p-need').innerHTML = `<thead><tr><th>Abteilung</th><th>Geräte (Hosts)</th><th class="help-only">+ Router</th><th class="help-only">kleinstes passendes Subnetz</th></tr></thead><tbody>` +
      S.depts.map((d, i) => `<tr>
        <td><span class="chip d${i}"></span><input class="inp-name" data-bind="dept:${i}:name" aria-label="Name der Abteilung ${i + 1}"></td>
        <td><input type="number" min="1" max="1000000" class="inp-num" data-bind="dept:${i}:hosts" aria-label="Hosts"></td>
        <td class="help-only" id="p-need-${i}"></td><td class="help-only" id="p-min-${i}"></td></tr>`).join('') + '</tbody>';

    $('#p-subnets').innerHTML = S.depts.map((d, i) => `
      <div class="subnet-row" id="p-sn-${i}">
        <div class="subnet-name"><span class="chip d${i}"></span><b id="p-sn-name-${i}"></b><small id="p-sn-need-${i}"></small></div>
        <div class="fields">
          <label class="field"><span>Netzadresse</span><input data-bind="dept:${i}:net" spellcheck="false" autocomplete="off" inputmode="decimal"></label>
          <label class="field"><span>Subnetzmaske</span><input data-bind="dept:${i}:mask" spellcheck="false" autocomplete="off"></label>
        </div>
        <div id="p-sn-fb-${i}"></div>
        <div class="subnet-bits" id="p-sn-bits-${i}"></div>
      </div>`).join('');
  }

  /* ---------- Darstellung ---------- */

  function setBadge(n, st) {
    const b = $(`#p-st${n}`);
    b.className = 'st-badge ' + st;
    b.textContent = { ok: '✔ erledigt', err: '✘ prüfen', open: 'offen', given: 'Vorgabe' }[st];
  }

  function renderStep1(base) {
    $$('#p-mode button').forEach(b => {
      const on = b.dataset.mode === S.mode;
      b.classList.toggle('active', on);
      b.setAttribute('aria-pressed', on);
    });
    $('#p-classes').hidden = S.mode !== 'classful';
    $$('.class-card').forEach(b => b.classList.toggle('active', b.dataset.cls === S.cls));
    $('#p-basemask').readOnly = S.mode === 'classful';
    $('[data-bind="base"]', root).readOnly = S.mode === 'classful';
    $('#p-mode-note').innerHTML = S.mode === 'classful'
      ? (!S.cls
        ? 'Du wählst eine <b>Klasse</b>. Das Firmennetz ist dann der ganze private Bereich dieser Klasse, und jede Abteilung bekommt daraus ein eigenes Netz.'
        : S.cls === 'A'
        ? 'Du wählst eine <b>Klasse</b>. Das Firmennetz ist der ganze private Bereich dieser Klasse. Bei Klasse A gibt es aber nur <b>ein</b> privates Netz (10.0.0.0/8) – du teilst es in gleich große Subnetze auf, z. B. 10.0.0.0/16, 10.1.0.0/16, 10.2.0.0/16.'
        : `Du wählst eine <b>Klasse</b>. Das Firmennetz ist der ganze private Bereich dieser Klasse – jede Abteilung bekommt daraus ein <b>eigenes Klasse-${S.cls}-Netz</b>, z. B. ${S.cls === 'C' ? '192.168.0.0/24, 192.168.1.0/24, 192.168.2.0/24' : '172.16.0.0/16, 172.17.0.0/16, 172.18.0.0/16'}. Du darfst ein Klassennetz auch in gleich große Subnetze aufteilen.`)
      : 'Du wählst Netzadresse und Maske <b>frei</b>. Das Netz muss nur vollständig in einem privaten Block nach RFC 1918 liegen – z. B. der ganze Block 192.168.0.0/16.';
    $('#p-base-fb').innerHTML = fbList(base.msgs);
    if (base.ok && S.mode === 'classful') {
      $('#p-base-bits').innerHTML = UI.bitRow(base.net, { label: `Privater Bereich Klasse ${S.cls}`, sub: `/${base.p}`, prefix: base.p }) +
        UI.legend({ net: 'fest (privater Bereich)', host: 'frei für Abteilungsnetze und Geräte' });
    } else if (base.ok) {
      const cp = base.cls.prefix;
      const lg = { net: 'Netzanteil' };
      if (base.p > cp) lg.sub = 'Subnetz-Bits ggü. Klasse';
      if (base.p < cp) lg.sup = `laut Klasse ${base.cls.cls} Netzanteil – hier Host`;
      lg.host = 'Hostanteil (für Subnetze und Geräte)';
      $('#p-base-bits').innerHTML = UI.bitRow(base.net, { label: 'Firmennetz', sub: `/${base.p}`, prefix: base.p, base: cp }) + UI.legend(lg);
    } else {
      $('#p-base-bits').innerHTML = '';
    }
  }

  // Grundriss der Firma: drei Räume mit je einem Symbol pro Gerät, Router im Flur
  const FP_ICONS = {
    pc: '<rect x="-8" y="-7" width="16" height="11" rx="1.5"/><path d="M0 4v3M-4 7.5h8"/>',
    printer: '<rect x="-5" y="-8" width="10" height="5"/><rect x="-8" y="-3" width="16" height="7" rx="1.5"/><rect x="-5" y="2" width="10" height="5"/>',
    server: '<rect x="-6" y="-8" width="12" height="16" rx="1.5"/><path d="M-3 -4h6M-3 0h6"/>',
    test: '<rect x="-9" y="-1" width="18" height="7" rx="1"/><path d="M-6 -1l2 -5h8l2 5"/>',
  };

  function renderFloor() {
    const MAXI = 120, COLS = 12, CELL = 22, RW = 300, GAP = 15, TOP = 54;
    const counts = S.depts.map(d => Math.max(0, d.hosts | 0));
    const rows = Math.max(1, ...counts.map(n => Math.ceil(Math.min(n, MAXI) / COLS)));
    const RH = TOP + rows * CELL + 14;
    const CY = RH + 48;
    const H = CY + 52;
    const label = S.depts.map((d, i) => `${d.name}: ${counts[i]} Geräte`).join(', ');
    let s = `<svg class="floor-svg" viewBox="0 0 960 ${H}" role="img" aria-label="${esc(`Grundriss der Firma – ${label}`)}"><defs>` +
      Object.entries(FP_ICONS).map(([k, g]) => `<g id="fp-${k}" class="fp-ic">${g}</g>`).join('') + '</defs>';
    s += `<rect class="fp-hall" x="${GAP}" y="${RH + 12}" width="${960 - 2 * GAP}" height="${H - RH - 18}" rx="10"/>`;
    s += `<text class="fp-small" x="${GAP + 12}" y="${H - 16}">Flur / Technik</text>`;
    S.depts.forEach((d, i) => {
      const x = GAP + i * (RW + GAP);
      const n = counts[i];
      const shown = n > MAXI ? MAXI - 1 : n;
      const left = x + (RW - COLS * CELL) / 2 + CELL / 2;
      s += `<g class="fp-room d${i}">`;
      s += `<line class="fp-link" x1="${x + RW / 2}" y1="${RH}" x2="480" y2="${CY}"/>`;
      s += `<rect class="fp-wall" x="${x}" y="1" width="${RW}" height="${RH - 1}" rx="8"/>`;
      s += `<rect class="fp-door" x="${x + RW / 2 - 18}" y="${RH - 3}" width="36" height="6"/>`;
      s += `<text class="fp-name" x="${x + 14}" y="25">${esc(d.name)}</text>`;
      s += `<text class="fp-small" x="${x + 14}" y="42">${fmt(n)} Gerät${n === 1 ? '' : 'e'}</text>`;
      for (let k = 0; k < shown; k++) {
        const icon = k === 2 ? iconOf(d.devices[2].name) : 'pc';
        s += `<use href="#fp-${icon}" x="${left + (k % COLS) * CELL}" y="${TOP + 11 + Math.floor(k / COLS) * CELL}"/>`;
      }
      if (n > MAXI) {
        s += `<text class="fp-more" x="${left + (shown % COLS) * CELL}" y="${TOP + 15 + Math.floor(shown / COLS) * CELL}" text-anchor="middle">+${fmt(n - shown)}</text>`;
      }
      if (!n) s += `<text class="fp-small" x="${x + RW / 2}" y="${TOP + 14}" text-anchor="middle">keine Geräte</text>`;
      s += '</g>';
    });
    s += `<g class="fp-router" transform="translate(480 ${CY})"><circle r="17"/><path d="M-9 -4h14M2 -8l4 4l-4 4M9 4h-14M-2 0l-4 4l4 4"/></g>`;
    s += `<text class="fp-small" x="480" y="${CY + 34}" text-anchor="middle">Router – verbindet die Abteilungen und braucht in jeder eine eigene Adresse</text>`;
    $('#p-floor').innerHTML = s + '</svg>';
  }

  function renderStep2() {
    renderFloor();
    const bad = S.depts.filter(d => !(d.hosts >= 1));
    $('#p-need-fb').innerHTML = bad.length ? fbList([err('Jede Abteilung braucht mindestens 1 Gerät.')]) : '';
    S.depts.forEach((d, i) => {
      const need = Math.max(0, d.hosts | 0) + 1;
      const p = IPv4.prefixForHosts(need);
      $(`#p-need-${i}`).textContent = `= ${fmt(need)} Adressen`;
      $(`#p-min-${i}`).innerHTML = p === null ? '–' : `<b>/${p}</b> (${fmt(IPv4.hosts(p))} nutzbar)`;
    });
    return !bad.length;
  }

  function hintHtml(base) {
    if (!base.ok) return '<p>Erst Schritt 2 abschließen.</p>';
    const needs = S.depts.map(d => IPv4.prefixForHosts(Math.max(1, d.hosts | 0) + 1));
    const biggest = Math.min(...needs);
    let h = `<p><b>Gleich große Netze (FLSM):</b> Alle Abteilungen bekommen dieselbe Maske. Die größte Abteilung braucht mindestens ein <b>/${biggest}</b> (${fmt(IPv4.hosts(biggest))} nutzbar) – die Maske darf also höchstens /${biggest} sein.</p>`;
    if (S.mode === 'classful') {
      const cp = CLS[S.cls].prefix;
      if (S.cls === 'A') h += '<p>Klasse A hat nur ein privates Netz – teile 10.0.0.0/8 in gleich große Subnetze auf.</p>';
      else if (biggest >= cp) h += `<p>Ein ganzes Klasse-${S.cls}-Netz (/${cp}, ${fmt(IPv4.hosts(cp))} nutzbar) reicht für jede Abteilung. Nimm für jede Abteilung ein anderes.</p>`;
      else h += `<p>✘ Ein Klasse-${S.cls}-Netz (/${cp}) ist für die größte Abteilung zu klein. Wähle eine größere Klasse.</p>`;
    }
    return h;
  }

  function renderStep3(base, drs) {
    $('#p-hint').innerHTML = hintHtml(base);
    const classful = S.mode === 'classful';
    let anyBits = false;
    S.depts.forEach((d, i) => {
      const r = drs[i];
      $(`#p-sn-name-${i}`).textContent = d.name;
      $(`#p-sn-need-${i}`).textContent = `${fmt(d.hosts)} Hosts + 1 Router`;
      $(`#p-sn-fb-${i}`).innerHTML = fbList(r.msgs);
      $(`#p-sn-${i}`).className = 'subnet-row st-' + r.status;
      const showBits = r.parsed && r.inside;
      anyBits = anyBits || showBits;
      $(`#p-sn-bits-${i}`).innerHTML = showBits ? UI.bitRow(r.net, { label: `${F(r.net)}/${r.p}`, prefix: r.p, base: classful ? CLS[S.cls].prefix : base.p }) : '';
    });
    $('#p-sn-legend').innerHTML = anyBits
      ? UI.legend(classful
        ? { net: `Klasse-${S.cls}-Netzanteil`, sub: 'Subnetz-Bits (geliehen)', host: 'Hostanteil' }
        : { net: 'Firmennetz-Anteil (fest)', sub: 'Subnetz-Bits (geliehen)', host: 'Hostanteil im Subnetz' })
      : '';
  }

  function renderMap(base, drs) {
    const el = $('#p-map');
    if (!base.ok) {
      el.innerHTML = '<p class="muted">Lege zuerst in Schritt 2 ein gültiges Firmennetz fest.</p>';
      return;
    }
    const placed = drs.map((r, i) => ({ r, i })).filter(x => x.r.parsed && x.r.inside);
    let zs = base.net;
    let zp = base.p;
    let zoomed = false;
    if (S.zoom && placed.length && base.p < 24) {
      const lo = Math.min(...placed.map(x => x.r.net));
      const hi = Math.max(...placed.map(x => x.r.bc));
      let p = 32;
      while (p > base.p && IPv4.network(lo, p) !== IPv4.network(hi, p)) p--;
      p = Math.max(base.p, Math.min(p, 24));
      if (p > base.p) { zs = IPv4.network(lo, p); zp = p; zoomed = true; }
    }
    const total = IPv4.size(zp);
    const cells = Math.min(256, total);
    const per = total / cells;

    const roles = new Map();
    if (per === 1) {
      S.depts.forEach((d, i) => {
        const g = IPv4.parse(d.gw);
        if (g !== null) roles.set(g, { t: 'gw', name: `Router eth${i}` });
        d.devices.forEach(v => {
          const a = IPv4.parse(v.ip);
          if (a !== null && !roles.has(a)) roles.set(a, { t: 'dev', name: v.name });
        });
      });
    }

    let h = `<p class="map-head">${zoomed ? 'Ausschnitt' : 'Gesamtes Firmennetz'}: <b>${F(zs)}/${zp}</b> · ${fmt(total)} Adressen · ${per === 1 ? 'jedes Kästchen = 1 Adresse (Zahl = letztes Oktett)' : `jedes Kästchen = ${fmt(per)} Adressen`}</p>`;
    h += `<div class="map${per === 1 ? ' single' : ''}" style="--cols:${cells >= 16 ? 16 : cells}">`;
    for (let c = 0; c < cells; c++) {
      const s = zs + c * per;
      const e = s + per - 1;
      const hit = placed.filter(x => x.r.net <= e && x.r.bc >= s);
      let cls = 'cell';
      let title = per === 1 ? F(s) : `${F(s)} – ${F(e)}`;
      let mark = '';
      if (hit.length > 1) {
        cls += ' conflict';
        title += ' · Überschneidung: ' + hit.map(x => S.depts[x.i].name).join(' / ');
      } else if (hit.length === 1) {
        const { r, i } = hit[0];
        cls += ` d${i}`;
        title += ` · ${S.depts[i].name}`;
        if (!(r.net <= s && r.bc >= e)) cls += ' partial';
        if (per === 1 && s === r.net) { cls += ' netaddr'; title += ' · Netzadresse'; }
        else if (per === 1 && s === r.bc) { cls += ' bcast'; title += ' · Broadcast'; }
      }
      if (per === 1 && roles.has(s)) {
        const ro = roles.get(s);
        mark = `<i class="mk ${ro.t}"></i>`;
        title += ` · ${ro.name}`;
      }
      h += `<div class="${cls}" title="${esc(title)}">${per === 1 ? s % 256 : ''}${mark}</div>`;
    }
    h += '</div>';

    let used = 0;
    placed.forEach(x => { if (x.r.status === 'ok') used += IPv4.size(x.r.p); });
    const all = IPv4.size(base.p);
    h += '<div class="legend map-legend">' +
      S.depts.map((d, i) => `<span><i class="sw d${i}"></i>${esc(d.name)}</span>`).join('') +
      '<span><i class="sw free"></i>frei</span><span><i class="sw conflict"></i>Überschneidung</span>' +
      (per === 1 ? '<span><i class="sw edge"></i>Netz-/Broadcast-Adresse</span><span><i class="mk gw static"></i>Router</span><span><i class="mk dev static"></i>Gerät</span>' : '') +
      '</div>';
    h += `<p class="muted small">Korrekt belegt: ${fmt(used)} von ${fmt(all)} Adressen des Firmennetzes (${pct(used, all)}) · frei: ${fmt(all - used)}</p>`;
    el.innerHTML = h;
  }

  const ICONS = {
    pc: '<rect class="shape" x="-22" y="-19" width="44" height="30" rx="4"/><rect class="screen" x="-17" y="-14" width="34" height="20" rx="2"/><path class="shape" d="M0 11v6M-10 18h20"/>',
    printer: '<rect class="shape" x="-14" y="-21" width="28" height="12" rx="2"/><rect class="shape" x="-23" y="-10" width="46" height="20" rx="4"/><rect class="shape" x="-13" y="6" width="26" height="12" rx="1"/>',
    server: '<rect class="shape" x="-16" y="-22" width="32" height="44" rx="4"/><path class="detail" d="M-9 -12h18M-9 -4h18M-9 4h18"/><circle class="led" cx="8" cy="13" r="2.5"/>',
    test: '<rect class="shape" x="-24" y="-8" width="48" height="22" rx="3"/><path class="detail" d="M-16 -8l6 -12h20l6 12M-10 3h20"/>',
    router: '<circle class="shape" r="30"/><path class="detail" d="M-16 -7h26M4 -13l6 6l-6 6M16 7h-26M-4 1l-6 6l6 6"/>',
  };
  const iconOf = name => (/drucker/i.test(name) ? 'printer' : /server/i.test(name) ? 'server' : /test/i.test(name) ? 'test' : 'pc');

  function node(id, x, y, icon, st, name, sub) {
    return `<g class="node st-${st}${sel === id ? ' sel' : ''}" data-sel="${id}" tabindex="0" role="button" aria-label="${esc(name)} bearbeiten" transform="translate(${x} ${y})">
      <circle class="hit" r="42"/>${icon}<circle class="badge" cx="26" cy="-24" r="7"/>
      <text class="t-name halo" y="50" text-anchor="middle">${esc(name)}</text>
      ${sub ? `<text class="t-ip halo" y="66" text-anchor="middle">${esc(sub)}</text>` : ''}</g>`;
  }

  function renderTopo(drs, gws, devs) {
    const RX = 480;
    const RY = 62;
    const SY = 226;
    const DY = 384;
    const XS = [160, 480, 800];
    const stRouter = gws.every(g => g.status === 'ok') ? 'ok' : gws.some(g => g.status === 'err') ? 'err' : 'empty';
    let s = '<svg class="topo-svg" viewBox="0 0 960 470" role="group" aria-label="Netzplan der Firma">';
    S.depts.forEach((d, i) => {
      const x = XS[i];
      s += `<line class="link" x1="${RX}" y1="${RY}" x2="${x}" y2="${SY}"/>`;
      d.devices.forEach((_, k) => { s += `<line class="link l${i}" x1="${x}" y1="${SY}" x2="${x + (k - 1) * 105}" y2="${DY}"/>`; });
    });
    S.depts.forEach((d, i) => {
      const x = XS[i];
      const r = drs[i];
      s += `<g class="switch s${i}" transform="translate(${x} ${SY})"><rect class="sw-body" x="-46" y="-16" width="92" height="32" rx="6"/><path class="detail" d="M-28 -5h52M18 -10l6 5l-6 5M28 5h-52M-18 0l-6 5l6 5"/></g>`;
      s += `<text class="t-dept halo d${i}" x="${x}" y="${SY + 38}" text-anchor="middle">${esc(d.name)}</text>`;
      s += `<text class="t-ip halo" x="${x}" y="${SY + 55}" text-anchor="middle">${r.status === 'ok' ? `${F(r.net)}/${r.p}` : 'Subnetz ?'}</text>`;
      const lx = RX + (x - RX) * 0.6;
      const ly = RY + (SY - RY) * 0.6;
      const g = gws[i];
      // Die mittlere Leitung ist senkrecht – dort steht die Beschriftung rechts daneben
      const tx = i === 1 ? lx + 10 : lx;
      const anchor = i === 1 ? 'start' : 'middle';
      s += `<text class="t-if halo" x="${tx}" y="${ly - 7}" text-anchor="${anchor}">eth${i}</text>`;
      s += `<text class="t-ip halo st-${g.status}" x="${tx}" y="${ly + 9}" text-anchor="${anchor}">${g.status === 'empty' ? 'IP ?' : esc(d.gw)}</text>`;
      d.devices.forEach((x2, k) => {
        s += node(`dev:${i}:${k}`, x + (k - 1) * 105, DY, ICONS[iconOf(x2.name)], devs[i][k].status, x2.name, x2.ip.trim() || 'IP ?');
      });
    });
    s += node('router', RX, RY, ICONS.router, stRouter, 'Router', '');
    s += '</svg>';
    const focused = document.activeElement?.closest?.('#p-topo [data-sel]')?.dataset.sel;
    $('#p-topo').innerHTML = s;
    if (focused) $(`#p-topo [data-sel="${focused}"]`)?.focus();
  }

  function renderEditor() {
    const ed = $('#p-editor');
    if (!sel) {
      ed.innerHTML = '<p class="muted editor-empty">👆 Klicke im Netzplan auf den <b>Router</b> oder ein <b>Gerät</b>, um IP-Adressen zu vergeben.</p>';
      return;
    }
    if (sel === 'router') {
      ed.innerHTML = `<h3>Router – Schnittstellen</h3>
        <p class="muted small">Jede Schnittstelle bekommt eine Adresse im Subnetz ihrer Abteilung. Diese Adresse ist dort das <b>Standard-Gateway</b>.</p>` +
        S.depts.map((d, i) => `
          <label class="field"><span><span class="chip d${i}"></span>eth${i} → <b id="p-ed-dn-${i}">${esc(d.name)}</b></span>
            <input data-bind="gw:${i}" spellcheck="false" autocomplete="off" inputmode="decimal" placeholder="z. B. erste Host-Adresse"></label>
          <div id="p-ed-fb-gw-${i}"></div>`).join('');
    } else {
      const [, i, k] = sel.split(':').map(Number);
      const x = S.depts[i].devices[k];
      ed.innerHTML = `<h3><span class="chip d${i}"></span>${esc(x.name)}</h3>
        <p class="muted small" id="p-ed-ctx"></p>
        <label class="field"><span>IP-Adresse</span><input data-bind="dev:${i}:${k}:ip" spellcheck="false" autocomplete="off" inputmode="decimal"></label>
        <label class="field"><span>Subnetzmaske</span><input data-bind="dev:${i}:${k}:mask" spellcheck="false" autocomplete="off"></label>
        <label class="field"><span>Standard-Gateway</span><input data-bind="dev:${i}:${k}:gw" spellcheck="false" autocomplete="off" inputmode="decimal"></label>
        <div id="p-ed-fb-dev"></div>`;
    }
    syncInputs(ed);
  }

  function updateEditor(drs, gws, devs) {
    if (sel === 'router') {
      S.depts.forEach((d, i) => {
        const fb = $(`#p-ed-fb-gw-${i}`);
        if (fb) fb.innerHTML = fbList(gws[i].msgs);
        const n = $(`#p-ed-dn-${i}`);
        if (n) n.textContent = d.name;
      });
    } else if (sel) {
      const [, i, k] = sel.split(':').map(Number);
      const r = drs[i];
      const ctx = $('#p-ed-ctx');
      if (ctx) ctx.textContent = `Abteilung ${S.depts[i].name} · Subnetz ${r.status === 'ok' ? `${F(r.net)}/${r.p}` : 'noch nicht korrekt festgelegt'}`;
      const fb = $('#p-ed-fb-dev');
      if (fb) fb.innerHTML = fbList(devs[i][k].msgs);
    }
  }

  function renderSummary(base, drs, gws, devs, complete) {
    let h = '';
    if (complete) h += '<div class="banner">🥋 Der Plan ist vollständig und korrekt. Jede Abteilung hat ein eigenes Subnetz, und alle Geräte sind richtig konfiguriert.</div>';
    h += `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Abteilung</th><th>Hosts</th><th>Netz</th><th>Subnetzmaske</th><th>Gateway</th><th>Hostbereich</th><th>Broadcast</th><th>nutzbar</th><th>Auslastung</th></tr></thead><tbody>`;
    S.depts.forEach((d, i) => {
      const r = drs[i];
      h += `<tr><td><span class="chip d${i}"></span>${esc(d.name)}</td><td>${fmt(d.hosts)}</td>`;
      if (r.status === 'ok') {
        const u = IPv4.hosts(r.p);
        const q = Math.min(100, Math.round((r.need / u) * 100));
        h += `<td><code>${F(r.net)}/${r.p}</code></td><td><code>${F(IPv4.mask(r.p))}</code></td>
          <td>${gws[i].status === 'ok' ? `<code>${F(gws[i].ip)}</code>` : '–'}</td>
          <td><code>${F(r.net + 1)} – ${F(r.bc - 1)}</code></td><td><code>${F(r.bc)}</code></td><td>${fmt(u)}</td>
          <td><span class="meter"><i style="width:${q}%"></i></span> ${q} %</td>`;
      } else {
        h += '<td colspan="7" class="muted">noch nicht korrekt geplant</td>';
      }
      h += '</tr>';
    });
    h += '</tbody></table></div>';

    h += '<h3 class="sub-h">Geräte</h3><div class="tbl-wrap"><table class="tbl compact"><thead><tr><th>Gerät</th><th>Abteilung</th><th>IP-Adresse</th><th>Subnetzmaske</th><th>Standard-Gateway</th><th>Status</th></tr></thead><tbody>';
    const mark = st => ({ ok: '<span class="ok-text">✔</span>', err: '<span class="err-text">✘</span>', empty: '<span class="muted">–</span>' }[st]);
    S.depts.forEach((d, i) => {
      h += `<tr><td>Router eth${i}</td><td><span class="chip d${i}"></span>${esc(d.name)}</td><td><code>${esc(d.gw) || '–'}</code></td><td>${drs[i].status === 'ok' ? `<code>${F(IPv4.mask(drs[i].p))}</code>` : '–'}</td><td class="muted">–</td><td>${mark(gws[i].status)}</td></tr>`;
      d.devices.forEach((x, k) => {
        h += `<tr><td>${esc(x.name)}</td><td><span class="chip d${i}"></span>${esc(d.name)}</td><td><code>${esc(x.ip) || '–'}</code></td><td><code>${esc(x.mask) || '–'}</code></td><td><code>${esc(x.gw) || '–'}</code></td><td>${mark(devs[i][k].status)}</td></tr>`;
      });
    });
    h += '</tbody></table></div>';
    $('#p-summary').innerHTML = h;
  }

  function refresh() {
    root.classList.toggle('help-on', S.help);
    const base = checkBase();
    const drs = checkDepts(base);
    const { gws, devs } = checkAddrs(drs);

    renderStep1(base);
    const hostsOk = renderStep2();
    renderStep3(base, drs);
    renderMap(base, drs);
    renderTopo(drs, gws, devs);
    updateEditor(drs, gws, devs);

    const st3 = drs.every(r => r.status === 'ok') ? 'ok' : drs.some(r => r.status === 'err') ? 'err' : 'open';
    const all5 = [...gws, ...devs.flat()];
    const st5 = all5.every(r => r.status === 'ok') ? 'ok' : all5.some(r => r.status === 'err') ? 'err' : 'open';
    const complete = base.ok && hostsOk && st3 === 'ok' && st5 === 'ok';
    setBadge(1, hostsOk ? 'given' : 'err');
    setBadge(2, base.empty ? 'open' : base.ok ? 'ok' : 'err');
    setBadge(3, st3);
    setBadge(5, st5);
    setBadge(6, complete ? 'ok' : 'open');
    renderSummary(base, drs, gws, devs, complete);
    UI.store.set('plan', S);
  }

  /* ---------- Ereignisse ---------- */

  function applyClass() {
    const blk = S.cls && CLS[S.cls].block;
    S.base = blk ? F(blk.start) : '';
    S.baseMask = blk ? F(IPv4.mask(blk.prefix)) : '';
  }

  root.addEventListener('input', e => {
    const b = e.target.dataset.bind;
    if (!b) return;
    setBind(b, e.target.value);
    refresh();
  });
  $('#p-help').addEventListener('change', e => { S.help = e.target.checked; refresh(); });
  $('#p-zoom').addEventListener('change', e => { S.zoom = e.target.checked; refresh(); });
  $('#p-mode').addEventListener('click', e => {
    const b = e.target.closest('[data-mode]');
    if (!b || b.dataset.mode === S.mode) return;
    S.mode = b.dataset.mode;
    if (S.mode === 'classful') applyClass();
    syncInputs();
    refresh();
  });
  $('#p-classes').addEventListener('click', e => {
    const b = e.target.closest('[data-cls]');
    if (!b) return;
    S.cls = b.dataset.cls;
    applyClass();
    syncInputs();
    refresh();
  });

  function selectNode(t) {
    sel = t.dataset.sel;
    renderEditor();
    refresh();
    const first = $('#p-editor input');
    if (first && window.matchMedia('(max-width: 900px)').matches) $('#p-editor').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    if (first) first.focus({ preventScroll: true });
  }
  $('#p-topo').addEventListener('click', e => {
    const t = e.target.closest('[data-sel]');
    if (t) selectNode(t);
  });
  $('#p-topo').addEventListener('keydown', e => {
    const t = e.target.closest('[data-sel]');
    if (t && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); selectNode(t); }
  });

  $('#p-random').addEventListener('click', () => {
    const filled = S.depts.some(d => d.net || d.mask || d.gw || d.devices.some(x => x.ip || x.mask || x.gw));
    if (filled && !confirm('Neue Aufgabe würfeln? Subnetze und IP-Adressen werden dabei geleert.')) return;
    const r = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
    // Bei FLSM bekommt jede Abteilung ein Viertel des Firmennetzes (2 geliehene Bits) – minus 1 Adresse für den Router
    const base = checkBase();
    const max = Math.min(100, IPv4.hosts((base.ok ? base.p : 24) + 2) - 1);
    const hosts = [r(10, Math.min(60, max)), r(Math.min(30, max), max), r(3, Math.min(28, max))];
    S.depts.forEach((d, i) => {
      d.hosts = hosts[i];
      d.net = d.mask = d.gw = '';
      d.devices.forEach(x => { x.ip = x.mask = x.gw = ''; });
    });
    syncInputs();
    renderEditor();
    refresh();
  });

  $('#p-print').addEventListener('click', () => window.print());
  $('#p-share').addEventListener('click', () => {
    const data = btoa(unescape(encodeURIComponent(JSON.stringify(S))));
    const url = `${location.href.split(/[?#]/)[0]}?plan=${encodeURIComponent(data)}#planer`;
    const out = $('#p-share-fb');
    const fallback = () => {
      out.innerHTML = `<p class="muted small">Kopiere diesen Link:</p><input class="share-url" readonly value="${esc(url)}">`;
      $('.share-url', out).select();
    };
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(
        () => { out.innerHTML = fbList([ok('Link kopiert. Wer ihn öffnet, sieht genau diesen Planungsstand – ideal als Aufgabe oder zur Abgabe.')]); },
        fallback);
    } else {
      fallback();
    }
  });
  $('#p-reset').addEventListener('click', () => {
    if (!confirm('Den gesamten Plan zurücksetzen?')) return;
    S = fresh();
    sel = null;
    $('#p-share-fb').innerHTML = '';
    buildStatic();
    syncInputs();
    renderEditor();
    refresh();
  });

  if (S.mode === 'classful') applyClass(); // ältere gespeicherte Pläne hatten hier ein einzelnes Klassennetz
  buildStatic();
  syncInputs();
  renderEditor();
  refresh();
})();
