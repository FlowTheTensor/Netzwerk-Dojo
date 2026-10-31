/* Netzwerktechnik-Dojo – Topologie-Kern: Geräte zeichnen, Kabel ziehen, Struktur prüfen.
   Ein Netz ist { nodes: [{ id, type, label, x, y }], edges: [[idA, idB], …] }. */
'use strict';

const Topo = (() => {
  const { esc } = UI;

  const NAMES = {
    p2p: 'Punkt-zu-Punkt',
    stern: 'Stern',
    baum: 'Baum',
    ring: 'Ring',
    vollmesh: 'Vollständig vermascht',
    teilmesh: 'Teilweise vermascht',
  };

  // Gerätesymbole, um (0, 0) zentriert
  const ICONS = {
    pc: '<rect class="tp-body" x="-19" y="-16" width="38" height="25" rx="3"/><rect class="tp-screen" x="-14" y="-11" width="28" height="15" rx="1.5"/><path class="tp-line" d="M0 9v6M-9 16h18"/>',
    switch: '<rect class="tp-body" x="-26" y="-11" width="52" height="22" rx="4"/><path class="tp-line" d="M-16 -3h26M6 -7l4 4l-4 4M16 4h-26M-6 0l-4 4l4 4"/>',
    router: '<circle class="tp-body" r="19"/><path class="tp-line" d="M-10 -5h16M2 -9l4 4l-4 4M10 5h-16M-2 1l-4 4l4 4"/>',
    server: '<rect class="tp-body" x="-13" y="-19" width="26" height="38" rx="3"/><path class="tp-line" d="M-7 -10h14M-7 -3h14M-7 4h14"/><circle class="tp-led" cx="6" cy="12" r="2.2"/>',
    sps: '<rect class="tp-body" x="-20" y="-15" width="40" height="30" rx="2"/><path class="tp-line" d="M-10 -15v30M0 -15v30M10 -15v30"/><circle class="tp-led" cx="-15" cy="-9" r="2"/>',
  };
  const TYPE_NAMES = { pc: 'PC', switch: 'Switch', router: 'Router', server: 'Server', sps: 'SPS' };

  // Netzwerkanschlüsse je Gerät: PC und Server haben eine Netzwerkkarte, eine SPS zwei Ports
  const PORTS = { pc: 1, server: 1, sps: 2 };
  const ports = type => PORTS[type] ?? Infinity;

  // Beschriftung: Switch1, Router1, PC-1, SPS-1
  const name = (type, i) => (type === 'switch' || type === 'router' ? `${TYPE_NAMES[type]}${i}` : `${TYPE_NAMES[type]}-${i}`);

  /* ---------- Graph-Hilfen ---------- */

  const key = (a, b) => (a < b ? `${a}|${b}` : `${b}|${a}`);
  const label = (net, id) => net.nodes.find(n => n.id === id).label;

  function adjacency(net, skip = new Set(), skipEdges = new Set()) {
    const adj = new Map(net.nodes.filter(n => !skip.has(n.id)).map(n => [n.id, []]));
    net.edges.forEach(([a, b]) => {
      if (skip.has(a) || skip.has(b) || skipEdges.has(key(a, b))) return;
      adj.get(a).push(b);
      adj.get(b).push(a);
    });
    return adj;
  }

  function components(net, skip, skipEdges) {
    const adj = adjacency(net, skip, skipEdges);
    const seen = new Set();
    const comps = [];
    for (const id of adj.keys()) {
      if (seen.has(id)) continue;
      const comp = [];
      const stack = [id];
      seen.add(id);
      while (stack.length) {
        const v = stack.pop();
        comp.push(v);
        adj.get(v).forEach(w => { if (!seen.has(w)) { seen.add(w); stack.push(w); } });
      }
      comps.push(comp);
    }
    return comps;
  }

  // Geräte, die nach einem Ausfall mit keinem anderen Gerät mehr kommunizieren können
  function isolatedAfter(net, failNode, failEdge) {
    const comps = components(net, new Set(failNode ? [failNode] : []), new Set(failEdge ? [key(...failEdge)] : []));
    return comps.filter(c => c.length === 1).map(c => c[0]);
  }

  /* ---------- Prüfung: Ist das die verlangte Topologie? ----------
     spec: { kind, center?, root? } → { ok, why } */

  function check(net, spec) {
    const fail = why => ({ ok: false, why });
    const ids = net.nodes.map(n => n.id);
    const adj = adjacency(net);
    const deg = id => adj.get(id).length;
    const L = id => `<b>${esc(label(net, id))}</b>`;
    const loose = ids.filter(id => deg(id) === 0);
    const n = ids.length;
    const m = net.edges.length;
    const connected = components(net).length === 1;

    if (!m) return fail('Es ist noch keine Leitung verlegt.');

    if (spec.kind === 'p2p') {
      if (m !== 1) return fail('Bei Punkt-zu-Punkt gibt es <b>genau eine</b> Leitung.');
      if (spec.a && key(...net.edges[0]) !== key(spec.a, spec.b)) {
        return fail(`Die Leitung muss direkt zwischen ${L(spec.a)} und ${L(spec.b)} liegen – ohne Gerät dazwischen.`);
      }
      return { ok: true };
    }

    if (loose.length) return fail(`${loose.map(L).join(', ')} ${loose.length > 1 ? 'sind' : 'ist'} noch nicht angeschlossen.`);

    if (spec.kind === 'stern') {
      const c = spec.center;
      const missing = ids.filter(id => id !== c && !adj.get(c).includes(id));
      const extra = net.edges.find(([a, b]) => a !== c && b !== c);
      if (extra) return fail(`Zwischen ${L(extra[0])} und ${L(extra[1])} darf keine direkte Leitung liegen – im Stern läuft alles über ${L(c)}.`);
      if (missing.length) return fail(`${missing.map(L).join(', ')} ${missing.length > 1 ? 'sind' : 'ist'} nicht mit ${L(c)} verbunden.`);
      return { ok: true };
    }

    if (spec.kind === 'baum') {
      const r = spec.root;
      const type = id => net.nodes.find(x => x.id === id).type;
      const pcBad = ids.find(id => type(id) !== 'switch' && deg(id) > 1);
      if (pcBad) return fail(`${L(pcBad)} hat ${deg(pcBad)} Leitungen. Ein Endgerät hängt im Baum nur an <b>einem</b> Switch.`);
      const pcPc = net.edges.find(([a, b]) => type(a) !== 'switch' && type(b) !== 'switch');
      if (pcPc) return fail(`${L(pcPc[0])} und ${L(pcPc[1])} sind direkt verbunden. Endgeräte werden im Baum an Switches angeschlossen.`);
      if (!connected) return fail('Das Netz zerfällt in getrennte Teile. Im Baum ist alles über den Hauptverteiler verbunden.');
      if (m !== n - 1) return fail('Es gibt eine <b>Schleife</b> (einen Kreis). Ein Baum hat keine Kreise – entferne eine Leitung zwischen den Switches.');
      const subs = ids.filter(id => id !== r && type(id) === 'switch');
      const notAtRoot = subs.find(s => !adj.get(r).includes(s));
      if (notAtRoot) return fail(`${L(notAtRoot)} muss direkt am Hauptverteiler ${L(r)} hängen.`);
      const atRoot = adj.get(r).find(id => type(id) !== 'switch');
      if (atRoot) return fail(`${L(atRoot)} hängt direkt am Hauptverteiler. Die Endgeräte gehören an die Verteiler der nächsten Ebene (${subs.map(L).join(', ')}).`);
      const empty = subs.find(s => deg(s) < 2);
      if (empty) return fail(`An ${L(empty)} hängt noch kein Endgerät.`);
      return { ok: true };
    }

    if (spec.kind === 'ring') {
      const odd = ids.find(id => deg(id) !== 2);
      if (odd) return fail(`${L(odd)} hat ${deg(odd)} Leitung${deg(odd) === 1 ? '' : 'en'} – im Ring hat jedes Gerät <b>genau 2</b> Nachbarn.`);
      if (!connected) return fail('Es sind mehrere getrennte Ringe entstanden. Alle Geräte sollen in <b>einem</b> Ring liegen.');
      return { ok: true };
    }

    if (spec.kind === 'vollmesh') {
      const need = n * (n - 1) / 2;
      if (m < need) {
        const has = new Set(net.edges.map(([a, b]) => key(a, b)));
        let ex = null;
        for (let i = 0; i < n && !ex; i++) for (let j = i + 1; j < n && !ex; j++) if (!has.has(key(ids[i], ids[j]))) ex = [ids[i], ids[j]];
        return fail(`Es fehlen noch ${need - m} Leitung${need - m === 1 ? '' : 'en'}, z. B. zwischen ${L(ex[0])} und ${L(ex[1])}. Im Vollmesh ist <b>jedes</b> Gerät mit <b>jedem</b> verbunden.`);
      }
      return { ok: true };
    }

    if (spec.kind === 'teilmesh') {
      if (!connected) return fail('Das Netz zerfällt in getrennte Teile.');
      const weak = ids.find(id => deg(id) < 2);
      if (weak) return fail(`${L(weak)} hat nur 1 Leitung. Im teilvermaschten Netz soll jedes Gerät <b>mindestens 2</b> Wege haben.`);
      if (m === n * (n - 1) / 2) return fail('Das ist schon ein <b>Vollmesh</b> – jeder ist mit jedem verbunden. Lass mindestens eine Verbindung weg.');
      if (ids.every(id => deg(id) === 2)) return fail('Das ist ein <b>Ring</b> – jedes Gerät hat genau 2 Nachbarn. Im Teilmesh gibt es zusätzliche Querverbindungen.');
      return { ok: true };
    }
    return fail('Unbekannte Topologie.');
  }

  /* ---------- Beispielnetze erzeugen ---------- */

  const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const shuffle = a => {
    const r = [...a];
    for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; }
    return r;
  };
  const jit = v => v + (Math.random() - .5) * 16;

  function circle(count, cx, cy, rx, ry, rot = -Math.PI / 2) {
    return Array.from({ length: count }, (_, i) => {
      const a = rot + (i / count) * 2 * Math.PI;
      return [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry];
    });
  }

  const dev = (id, type, lbl, x, y) => ({ id, type, label: lbl, x: Math.round(x), y: Math.round(y) });

  // k Geräte, davon sps SPSen an zufälligen Stellen, durchnummeriert je Gerätetyp
  function mixTypes(k, base, sps) {
    const types = shuffle([...Array(k - sps).fill(base), ...Array(sps).fill('sps')]);
    const count = {};
    return types.map(t => ({ type: t, label: name(t, (count[t] = (count[t] || 0) + 1)) }));
  }
  const endDevices = (k, sps) => mixTypes(k, 'pc', sps);

  // Netz einer Topologie mit „schöner“ Anordnung (für Erklärungen und Erkennen-Aufgaben)
  function make(kind, o = {}) {
    const W = o.w || 640, H = o.h || 360;
    const cx = W / 2, cy = H / 2;
    const jitter = o.jitter ? jit : v => v;
    const rot = o.rotate ? Math.random() * 2 * Math.PI : -Math.PI / 2;
    if (kind === 'p2p') {
      const types = o.types || ['pc', 'pc'];
      const lbls = types.map((t, i) => (types[0] === types[1] ? name(t, i + 1) : TYPE_NAMES[t]));
      return { nodes: [dev('a', types[0], lbls[0], cx - 150, jitter(cy)), dev('b', types[1], lbls[1], cx + 150, jitter(cy))], edges: [['a', 'b']] };
    }
    if (kind === 'stern') {
      const k = o.n || 5;
      const pos = circle(k, cx, cy, Math.min(W, H * 1.6) * .32, H * .34, rot);
      const ends = endDevices(k, o.sps || 0);
      const nodes = [dev('s', 'switch', 'Switch', cx, cy), ...pos.map(([x, y], i) => dev(`p${i + 1}`, ends[i].type, ends[i].label, jitter(x), jitter(y)))];
      return { nodes, edges: nodes.slice(1).map(nd => ['s', nd.id]), center: 's' };
    }
    if (kind === 'baum') {
      const per = o.per || [2, 3];
      const nodes = [dev('s1', 'switch', name('switch', 1), cx, 50)];
      const edges = [];
      const ends = endDevices(per.reduce((a, b) => a + b, 0), o.sps || 0);
      let pc = 1;
      const span = W / per.length;
      per.forEach((cnt, i) => {
        const sx = span * (i + .5);
        const sid = `s${i + 2}`;
        nodes.push(dev(sid, 'switch', name('switch', i + 2), sx, 160));
        edges.push(['s1', sid]);
        for (let k = 0; k < cnt; k++) {
          const px = sx + (k - (cnt - 1) / 2) * Math.min(95, span / cnt);
          const id = `p${pc}`;
          const e = ends[pc++ - 1];
          nodes.push(dev(id, e.type, e.label, px, 290));
          edges.push([sid, id]);
        }
      });
      return { nodes, edges, root: 's1' };
    }
    const k = o.n || 5;
    const type = o.type || (kind === 'ring' ? 'switch' : 'router');
    const types = mixTypes(k, type, kind === 'ring' ? o.sps || 0 : 0);
    const pos = circle(k, cx, cy, Math.min(W * .36, 230), H * .36, rot);
    const nodes = pos.map(([x, y], i) => dev(`n${i + 1}`, types[i].type, types[i].label, jitter(x), jitter(y)));
    const ids = nodes.map(nd => nd.id);
    const ring = ids.map((id, i) => [id, ids[(i + 1) % k]]);
    if (kind === 'ring') return { nodes, edges: ring };
    if (kind === 'vollmesh') {
      const edges = [];
      for (let i = 0; i < k; i++) for (let j = i + 1; j < k; j++) edges.push([ids[i], ids[j]]);
      return { nodes, edges };
    }
    // Teilmesh: Ring plus einige Querverbindungen, aber nicht alle
    const chords = [];
    for (let i = 0; i < k; i++) for (let j = i + 2; j < k; j++) if (!(i === 0 && j === k - 1)) chords.push([ids[i], ids[j]]);
    const extra = shuffle(chords).slice(0, Math.max(1, Math.min(chords.length - 1, o.chords || rnd(1, 3))));
    return { nodes, edges: [...ring, ...extra] };
  }

  // Abstand eines Punktes zur Strecke a–b
  function segDist(p, a, b) {
    const dx = b.x - a.x, dy = b.y - a.y;
    const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy)));
    return Math.hypot(p.x - a.x - t * dx, p.y - a.y - t * dy);
  }

  /* Nur die Geräte einer Bauaufgabe, zufällig verteilt (damit die Anordnung die Lösung nicht verrät).
     Kein Gerät darf auf der Linie zwischen zwei anderen liegen – sonst sähe eine Leitung so aus,
     als ginge sie durch das Gerät. Leitungen zwischen zwei PCs gibt es nie (eine Netzwerkkarte). */
  function scatter(nodes, W = 640, H = 360) {
    const endOnly = t => t === 'pc' || t === 'server';
    const pair = (i, j) => !(endOnly(nodes[i].type) && endOnly(nodes[j].type));
    // Erst mit großzügigen Abständen versuchen, bei vielen Geräten schrittweise enger
    for (const [MIN, CLEAR] of [[92, 42], [86, 38], [80, 34]]) for (let attempt = 0; attempt < 60; attempt++) {
      const pts = [];
      for (let i = 0; i < nodes.length; i++) {
        let ok = false;
        for (let t = 0; t < 400 && !ok; t++) {
          const p = { x: 50 + Math.random() * (W - 100), y: 40 + Math.random() * (H - 95) };
          if (pts.some(q => Math.hypot(p.x - q.x, p.y - q.y) < MIN)) continue;
          let bad = false;
          for (let a = 0; a < pts.length && !bad; a++) for (let b = a + 1; b < pts.length && !bad; b++) if (pair(a, b) && segDist(p, pts[a], pts[b]) < CLEAR) bad = true;
          for (let a = 0; a < pts.length && !bad; a++) if (pair(i, a)) for (let c = 0; c < pts.length && !bad; c++) if (c !== a && segDist(pts[c], p, pts[a]) < CLEAR) bad = true;
          if (!bad) { pts.push(p); ok = true; }
        }
        if (!ok) break;
      }
      if (pts.length === nodes.length) return nodes.map((nd, i) => ({ ...nd, x: Math.round(pts[i].x), y: Math.round(pts[i].y) }));
    }
    return gridScatter(nodes, W, H);
  }

  // Notlösung, falls keine freie Anordnung gefunden wird: lockeres Raster
  function gridScatter(nodes, W, H) {
    const cols = nodes.length > 8 ? 5 : 4;
    const rows = Math.ceil(nodes.length / cols) + (nodes.length > 4 ? 1 : 0);
    const cells = shuffle(Array.from({ length: cols * rows }, (_, i) => i)).slice(0, nodes.length);
    const cw = (W - 80) / cols, ch = (H - 70) / rows;
    return nodes.map((nd, i) => ({
      ...nd,
      x: Math.round(40 + cw * (cells[i] % cols + .5) + (Math.random() - .5) * cw * .35),
      y: Math.round(25 + ch * (Math.floor(cells[i] / cols) + .5) + (Math.random() - .5) * ch * .3),
    }));
  }

  // Ringfolge ohne Überkreuzungen: Geräte nach Winkel um den Mittelpunkt sortieren
  function ringOrder(nodes) {
    const cx = nodes.reduce((s, n) => s + n.x, 0) / nodes.length;
    const cy = nodes.reduce((s, n) => s + n.y, 0) / nodes.length;
    return [...nodes].sort((a, b) => Math.atan2(a.y - cy, a.x - cx) - Math.atan2(b.y - cy, b.x - cx)).map(n => n.id);
  }

  /* Bauaufgabe: { kind, text, spec, net (nur Geräte), solution (Netz mit Lösungsleitungen) } */
  function buildTask(kind) {
    let nodes;
    let spec = { kind };
    let text;
    let sol;
    if (kind === 'p2p') {
      nodes = [dev('pc', 'pc', 'PC', 0, 0), dev('sps', 'sps', 'SPS', 0, 0), dev('sw', 'switch', 'Switch', 0, 0)];
      spec = { kind, a: 'pc', b: 'sps' };
      text = 'Der Techniker will die <b>SPS</b> direkt von seinem <b>PC</b> aus programmieren. Verbinde beide <b>Punkt-zu-Punkt</b> – der Switch wird dafür nicht gebraucht.';
      sol = () => [['pc', 'sps']];
    } else if (kind === 'stern') {
      const k = rnd(4, 6);
      const sps = rnd(0, 2);
      nodes = [dev('s', 'switch', 'Switch', 0, 0), ...endDevices(k, sps).map((e, i) => dev(`p${i + 1}`, e.type, e.label, 0, 0))];
      spec = { kind, center: 's' };
      text = `Schließe alle ${k} ${sps ? 'Endgeräte (PCs und SPSen)' : 'PCs'} <b>sternförmig</b> an den <b>Switch</b> an.`;
      sol = () => nodes.slice(1).map(n => ['s', n.id]);
    } else if (kind === 'baum') {
      const k = rnd(4, 5);
      const sps = rnd(0, 1);
      nodes = [dev('s1', 'switch', 'Switch1', 0, 0), dev('s2', 'switch', 'Switch2', 0, 0), dev('s3', 'switch', 'Switch3', 0, 0),
        ...endDevices(k, sps).map((e, i) => dev(`p${i + 1}`, e.type, e.label, 0, 0))];
      spec = { kind, root: 's1' };
      text = `Baue einen <b>Baum</b>: <b>Switch1</b> ist der Hauptverteiler. <b>Switch2</b> und <b>Switch3</b> hängen direkt an Switch1, die ${sps ? 'Endgeräte' : 'PCs'} werden an Switch2 und Switch3 angeschlossen.`;
      sol = () => [['s1', 's2'], ['s1', 's3'], ...nodes.slice(3).map((n, i) => [i % 2 ? 's3' : 's2', n.id])];
    } else {
      const k = kind === 'vollmesh' ? rnd(4, 5) : kind === 'teilmesh' ? 5 : rnd(4, 6);
      const type = kind === 'ring' ? 'switch' : 'router';
      const sps = kind === 'ring' ? rnd(0, k - 2) : 0;
      nodes = mixTypes(k, type, sps).map((e, i) => dev(`n${i + 1}`, e.type, e.label, 0, 0));
      text = {
        ring: `Verbinde ${sps ? `alle ${k} Geräte` : `die ${k} Switches`} zu einem <b>Ring</b> – so wie ein PROFINET-Ring in der Fertigung.`,
        vollmesh: `Verbinde die ${k} Router <b>vollständig vermascht</b>: jeder mit jedem.`,
        teilmesh: 'Verbinde die 5 Router <b>teilweise vermascht</b>: Jeder Router hat mindestens 2 Verbindungen, aber nicht jeder ist mit jedem verbunden.',
      }[kind];
      sol = placed => {
        const order = ringOrder(placed);
        const ring = order.map((id, i) => [id, order[(i + 1) % k]]);
        if (kind === 'ring') return ring;
        if (kind === 'teilmesh') return [...ring, [order[0], order[2]], [order[1], order[3]]];
        const all = [];
        for (let i = 0; i < k; i++) for (let j = i + 1; j < k; j++) all.push([order[i], order[j]]);
        return all;
      };
    }
    const placed = scatter(nodes);
    return { kind, text, spec, net: { nodes: placed, edges: [] }, solution: { nodes: placed, edges: sol(placed) } };
  }

  /* ---------- Zeichnen ---------- */

  // o: { w, h, sel, failed: Set, off: Set, failedEdge, cls, label }
  function svg(net, o = {}) {
    const W = o.w || 640, H = o.h || 360;
    const pos = new Map(net.nodes.map(nd => [nd.id, nd]));
    let s = `<svg class="tp-svg${o.cls ? ' ' + o.cls : ''}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(o.label || 'Netzwerk-Topologie')}">`;
    net.edges.forEach(([a, b], i) => {
      const A = pos.get(a), B = pos.get(b);
      const off = o.off && (o.off.has(a) || o.off.has(b) || (o.failed && (o.failed.has(a) || o.failed.has(b))));
      const cut = o.failedEdge && key(a, b) === key(...o.failedEdge);
      s += `<g class="tp-edge${off ? ' off' : ''}${cut ? ' cut' : ''}" data-e="${i}" data-a="${a}" data-b="${b}"><line class="tp-wire" x1="${A.x}" y1="${A.y}" x2="${B.x}" y2="${B.y}"/>` +
        (o.edgeHit ? `<line class="tp-ehit" x1="${A.x}" y1="${A.y}" x2="${B.x}" y2="${B.y}"/>` : '') + '</g>';
    });
    s += '<line class="tp-rubber" x1="0" y1="0" x2="0" y2="0" hidden/>';
    net.nodes.forEach(nd => {
      const st = [o.sel === nd.id ? 'sel' : '', o.failed?.has(nd.id) ? 'failed' : '', o.off?.has(nd.id) ? 'off' : '', o.full === nd.id ? 'full' : ''].filter(Boolean).join(' ');
      const act = o.interactive ? ` tabindex="0" role="button" aria-label="${esc(nd.label)}${o.sel === nd.id ? ' (ausgewählt)' : ''}"` : '';
      s += `<g class="tp-node t-${nd.type} ${st}" data-id="${nd.id}" transform="translate(${nd.x} ${nd.y})"${act}>` +
        `<circle class="tp-hit" r="32"/>${ICONS[nd.type]}` +
        (o.failed?.has(nd.id) ? '<path class="tp-x" d="M-14 -14L14 14M14 -14L-14 14"/>' : '') +
        `<text class="tp-label" y="${nd.type === 'server' ? 36 : 32}" text-anchor="middle">${esc(nd.label)}</text></g>`;
    });
    return s + '</svg>';
  }

  /* ---------- Editor: Geräte per Klick verbinden, per Drag-and-drop verschieben ----------
     Klick auf Gerät A, dann auf Gerät B → Leitung (nochmal → Leitung weg). Klick auf eine Leitung → weg.
     Gerät ziehen → verschieben; Pfeiltasten verschieben das Gerät mit dem Fokus. */
  function editor(el, net, o = {}) {
    let edges = net.edges.map(e => [...e]);
    const nodes = net.nodes.map(n => ({ ...n }));
    let sel = null;
    let locked = false;
    const W = o.w || 640, H = o.h || 360;
    const cur = () => ({ nodes, edges });
    const ac = new AbortController(); // damit ein neuer Editor auf demselben Element die alten Handler loswird
    const on = { signal: ac.signal };
    const nodeOf = id => nodes.find(n => n.id === id);
    const deg = id => edges.filter(e => e.includes(id)).length;
    let msg = '';
    let full = null;

    // Hinweis unter der Baufläche: wie viele Anschlüsse die vorhandenen Gerätetypen haben
    const present = [...new Set(nodes.map(n => n.type))];
    const legend = [
      present.includes('pc') && 'PC: 1 Netzwerkkarte',
      present.includes('sps') && 'SPS: 2 Anschlüsse',
      present.some(t => t === 'switch' || t === 'router') && 'Switch und Router: beliebig viele',
    ].filter(Boolean).join(' · ');

    function draw() {
      el.innerHTML = svg(cur(), { w: W, h: H, sel, full, interactive: !locked, edgeHit: !locked, cls: `tp-edit${locked ? ' locked' : ''}`, label: o.label }) +
        (locked ? '' : `<p class="tp-msg${msg ? ' warn' : ''}" aria-live="polite">${msg || legend}</p>`);
      if (sel && !locked) el.querySelector(`[data-id="${sel}"]`)?.focus({ preventScroll: true });
    }

    function toggle(a, b) {
      const k = key(a, b);
      const i = edges.findIndex(([x, y]) => key(x, y) === k);
      msg = '';
      full = null;
      if (i >= 0) edges.splice(i, 1);
      else {
        const busy = [a, b].find(id => deg(id) >= ports(nodeOf(id).type));
        if (busy) {
          const nd = nodeOf(busy);
          full = busy;
          msg = nd.type === 'sps'
            ? `<b>${esc(nd.label)}</b> hat nur <b>2</b> Netzwerkanschlüsse – beide sind schon belegt. Entferne zuerst eine Leitung.`
            : `<b>${esc(nd.label)}</b> hat nur <b>eine</b> Netzwerkkarte und ist schon verbunden. Entferne zuerst die vorhandene Leitung.`;
          return;
        }
        edges.push([a, b]);
      }
      o.onChange?.(cur());
    }

    function pickNode(id) {
      if (locked) return;
      if (!sel) sel = id;
      else if (sel === id) sel = null;
      else { toggle(sel, id); sel = null; }
      draw();
    }

    // Gerät an neue Stelle setzen – nur die betroffenen Elemente anfassen, damit das Ziehen flüssig bleibt
    function moveTo(id, x, y) {
      const nd = nodeOf(id);
      nd.x = Math.round(Math.max(32, Math.min(W - 32, x)));
      nd.y = Math.round(Math.max(26, Math.min(H - 42, y)));
      el.querySelector(`.tp-node[data-id="${id}"]`)?.setAttribute('transform', `translate(${nd.x} ${nd.y})`);
      el.querySelectorAll(`.tp-edge[data-a="${id}"] line`).forEach(l => { l.setAttribute('x1', nd.x); l.setAttribute('y1', nd.y); });
      el.querySelectorAll(`.tp-edge[data-b="${id}"] line`).forEach(l => { l.setAttribute('x2', nd.x); l.setAttribute('y2', nd.y); });
    }

    const toSvg = e => {
      const svgEl = el.querySelector('svg');
      const pt = svgEl.createSVGPoint();
      pt.x = e.clientX; pt.y = e.clientY;
      return pt.matrixTransform(svgEl.getScreenCTM().inverse());
    };

    let drag = null;
    let swallowClick = false;
    el.addEventListener('pointerdown', e => {
      const nd = e.target.closest('.tp-node');
      if (locked || !nd || e.button !== 0) return;
      const p = toSvg(e);
      const n = nodeOf(nd.dataset.id);
      drag = { id: n.id, cx: e.clientX, cy: e.clientY, dx: n.x - p.x, dy: n.y - p.y, moved: false, pid: e.pointerId };
      el.setPointerCapture(e.pointerId);
    }, on);
    el.addEventListener('pointerup', e => {
      if (!drag || e.pointerId !== drag.pid) return;
      const d = drag;
      drag = null;
      el.classList.remove('dragging');
      // Der folgende click gehört zu dieser Geste und wird hier schon ausgewertet
      swallowClick = true;
      setTimeout(() => { swallowClick = false; }, 0);
      if (!d.moved) pickNode(d.id);
      else o.onChange?.(cur());
    }, on);
    el.addEventListener('pointercancel', () => { drag = null; el.classList.remove('dragging'); }, on);

    el.addEventListener('click', e => {
      if (locked || swallowClick) return;
      const nd = e.target.closest('.tp-node');
      if (nd) { pickNode(nd.dataset.id); return; }
      const ed = e.target.closest('.tp-edge');
      if (ed) {
        const [a, b] = edges[Number(ed.dataset.e)];
        toggle(a, b);
        draw();
        return;
      }
      if (sel) { sel = null; draw(); }
    }, on);
    const STEP = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
    el.addEventListener('keydown', e => {
      const nd = e.target.closest('.tp-node');
      if (nd && !locked && STEP[e.key]) {
        e.preventDefault();
        const n = nodeOf(nd.dataset.id);
        const f = e.shiftKey ? 40 : 12;
        moveTo(n.id, n.x + STEP[e.key][0] * f, n.y + STEP[e.key][1] * f);
        return;
      }
      if (nd && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); pickNode(nd.dataset.id); }
      if (e.key === 'Escape' && sel) { sel = null; draw(); }
    }, on);
    // Ziehen verschiebt das Gerät; sonst folgt eine Gummiband-Leitung dem Zeiger, solange ein Gerät gewählt ist
    el.addEventListener('pointermove', e => {
      const rub = el.querySelector('.tp-rubber');
      if (!rub) return;
      if (drag && e.pointerId === drag.pid) {
        if (!drag.moved && Math.hypot(e.clientX - drag.cx, e.clientY - drag.cy) < 6) return;
        drag.moved = true;
        el.classList.add('dragging');
        rub.setAttribute('hidden', '');
        const p = toSvg(e);
        moveTo(drag.id, p.x + drag.dx, p.y + drag.dy);
        return;
      }
      if (!sel || locked) { rub.setAttribute('hidden', ''); return; }
      const p = toSvg(e);
      const A = nodeOf(sel);
      rub.setAttribute('x1', A.x); rub.setAttribute('y1', A.y);
      rub.setAttribute('x2', p.x); rub.setAttribute('y2', p.y);
      rub.removeAttribute('hidden');
    }, on);

    draw();
    return {
      net: cur,
      clear() { edges = []; sel = null; msg = ''; full = null; o.onChange?.(cur()); draw(); },
      lock() { locked = true; sel = null; draw(); },
      destroy() { ac.abort(); },
    };
  }

  return { NAMES, TYPE_NAMES, PORTS, key, check, components, isolatedAfter, make, scatter, buildTask, svg, editor, shuffle, rnd };
})();
