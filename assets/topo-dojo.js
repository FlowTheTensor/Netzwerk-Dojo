/* Topologien · Station 3 – Topologie-Dojo: Aufgaben-Generatoren (Mechanik in dojo-engine.js) */
'use strict';

(() => {
  const { esc } = UI;
  const { rnd, NAMES } = Topo;
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const num = v => {
    const s = v.trim();
    return /^\d+$/.test(s) ? Number(s) : NaN;
  };
  const fig = (net, o = {}) => `<div class="tp-wrap tp-task">${Topo.svg(net, { w: 640, h: o.h || 340, cls: 'tp-q', ...o })}</div>`;

  const WHY = {
    p2p: 'Genau zwei Geräte, eine direkte Leitung → <b>Punkt-zu-Punkt</b>.',
    stern: 'Alle Endgeräte hängen an <b>einem</b> zentralen Switch → <b>Stern</b>.',
    baum: 'Mehrere Switches hängen hierarchisch aneinander (Hauptverteiler → Unterverteiler → Endgeräte), ohne Kreise → <b>Baum</b>.',
    ring: 'Jedes Gerät hat genau zwei Nachbarn, alles bildet einen geschlossenen Kreis → <b>Ring</b>.',
    vollmesh: 'Jedes Gerät ist mit <b>jedem</b> anderen direkt verbunden → <b>vollständig vermascht</b>.',
    teilmesh: 'Mehrere Wege zwischen den Geräten, aber nicht jeder ist mit jedem verbunden → <b>teilweise vermascht</b>.',
  };

  function netOf(kind) {
    if (kind === 'p2p') return Topo.make('p2p', { jitter: true, types: pick([['pc', 'pc'], ['pc', 'sps'], ['router', 'router']]) });
    if (kind === 'stern') return Topo.make('stern', { jitter: true, rotate: true, n: rnd(3, 7), sps: rnd(0, 2) });
    if (kind === 'baum') return Topo.make('baum', { per: pick([[2, 2], [2, 3], [3, 2], [1, 2, 2], [2, 1, 2]]), sps: rnd(0, 1) });
    if (kind === 'ring') return Topo.make('ring', { jitter: true, rotate: true, n: rnd(4, 7), sps: rnd(0, 3) });
    return Topo.make(kind, { jitter: true, rotate: true, n: rnd(4, kind === 'vollmesh' ? 5 : 7) });
  }

  // Weiß: Topologie erkennen
  function genRecognize() {
    const kind = pick(Object.keys(NAMES));
    const net = netOf(kind);
    return {
      q: `Welche Topologie ist hier dargestellt?${fig(net)}`,
      choices: Object.values(NAMES),
      check: v => v === NAMES[kind],
      sol: WHY[kind],
    };
  }

  // Gelb: Leitungen und Anschlüsse zählen
  function genCount() {
    const v = rnd(0, 4);
    if (v === 0) {
      const n = rnd(4, 10);
      return {
        q: `Wie viele Leitungen braucht ein <b>vollständig vermaschtes</b> Netz mit <b>${n} Geräten</b>?`, ph: 'Anzahl',
        check: x => num(x) === n * (n - 1) / 2,
        sol: `Jedes der ${n} Geräte braucht ${n - 1} Leitungen. Jede Leitung verbindet zwei Geräte und wäre so doppelt gezählt: ${n} · ${n - 1} / 2 = <b>${n * (n - 1) / 2}</b>.`,
      };
    }
    if (v === 1) {
      const n = rnd(4, 12);
      return {
        q: `Wie viele Netzwerkanschlüsse (Ports) braucht <b>jedes</b> Gerät in einem vollständig vermaschten Netz mit <b>${n} Geräten</b>?`, ph: 'Anzahl',
        check: x => num(x) === n - 1,
        sol: `Jedes Gerät ist mit allen anderen ${n - 1} Geräten direkt verbunden → <b>${n - 1}</b> Ports.`,
      };
    }
    if (v === 2) {
      const n = rnd(5, 24);
      return {
        q: `<b>${n} PCs</b> werden sternförmig an einen Switch angeschlossen. Wie viele Leitungen werden gebraucht?`, ph: 'Anzahl',
        check: x => num(x) === n,
        sol: `Im Stern hat jeder PC genau eine Leitung zum Switch → <b>${n}</b>.`,
      };
    }
    if (v === 3) {
      const n = rnd(4, 12);
      return {
        q: `<b>${n} Switches</b> werden zu einem Ring verbunden. Wie viele Leitungen werden gebraucht?`, ph: 'Anzahl',
        check: x => num(x) === n,
        sol: `Im Ring hat jedes Gerät 2 Nachbarn. ${n} Geräte · 2 / 2 = <b>${n}</b> Leitungen – eine mehr als bei einer offenen Linie.`,
      };
    }
    const s = rnd(2, 4);
    const p = rnd(4, 12);
    const total = 1 + s + p;
    return {
      q: `Ein Baum besteht aus <b>1 Hauptverteiler</b>, <b>${s} Unterverteilern</b> und <b>${p} PCs</b>. Wie viele Leitungen hat das Netz?`, ph: 'Anzahl',
      check: x => num(x) === total - 1,
      sol: `Ein Baum hat immer eine Leitung weniger als Geräte: ${total} Geräte − 1 = <b>${total - 1}</b>.`,
    };
  }

  // Orange: Ausfälle einschätzen
  function genFailure() {
    const kind = pick(['stern', 'stern', 'baum', 'baum', 'ring', 'vollmesh', 'teilmesh']);
    const net = netOf(kind);
    const ids = net.nodes.map(n => n.id);
    let node = null;
    let edge = null;
    if (Math.random() < 0.3) edge = pick(net.edges);
    else if (kind === 'stern') node = Math.random() < 0.6 ? net.center : pick(ids.slice(1));
    else if (kind === 'baum') node = pick(ids.filter(id => net.nodes.find(n => n.id === id).type === 'switch'));
    else node = pick(ids);
    const L = id => `<b>${esc(net.nodes.find(n => n.id === id).label)}</b>`;
    const what = node ? `Das Gerät ${L(node)} fällt aus` : `Die Leitung ${L(edge[0])} – ${L(edge[1])} wird unterbrochen`;
    const iso = Topo.isolatedAfter(net, node, edge).filter(id => id !== node);
    const comps = Topo.components(net, new Set(node ? [node] : []), new Set(edge ? [Topo.key(...edge)] : []));
    const opts = { failed: new Set(node ? [node] : []), failedEdge: edge };
    const solFig = fig(net, { ...opts, off: new Set(iso), h: 300 });
    const isoTxt = iso.length ? `Betroffen: ${iso.map(L).join(', ')}.` : 'Kein Gerät ist ganz abgeschnitten.';
    if (Math.random() < 0.5) {
      return {
        q: `${what} (rot markiert). Wie viele der <b>übrigen</b> Geräte können danach mit <b>keinem</b> anderen Gerät mehr kommunizieren?${fig(net, opts)}`,
        ph: 'Anzahl',
        check: x => num(x) === iso.length,
        sol: `<b>${iso.length}</b>. ${isoTxt}${solFig}`,
      };
    }
    const all = comps.length === 1;
    return {
      q: `${what} (rot markiert). Können danach <b>alle übrigen</b> Geräte noch miteinander kommunizieren?${fig(net, opts)}`,
      choices: ['ja', 'nein'],
      check: v => (v === 'ja') === all,
      sol: all
        ? `<b>Ja</b> – es gibt noch einen anderen Weg zu allen Geräten.${solFig}`
        : `<b>Nein</b> – das Netz zerfällt in ${comps.length} Teile. ${isoTxt}${solFig}`,
    };
  }

  // Grün: Topologie selbst bauen
  function genBuild() {
    const t = Topo.buildTask(pick(Object.keys(NAMES)));
    let ed = null;
    return {
      q: t.text,
      widget: {
        mount(el) {
          el.innerHTML = '<div class="tp-wrap"></div><p class="note">Klick auf ein Gerät und dann auf ein zweites = Leitung. Klick auf eine Leitung = entfernen. Geräte lassen sich verschieben.</p>';
          ed = Topo.editor(el.querySelector('.tp-wrap'), t.net, { label: `Baufläche: ${NAMES[t.kind]}` });
        },
        read: () => ed.net(),
        lock: () => ed.lock(),
      },
      check: net => Topo.check(net, t.spec),
      sol: `${WHY[t.kind]} So könnte es aussehen:${fig(t.solution)}`,
    };
  }

  Dojo.create({
    mount: UI.$('#d-topo'),
    pageId: 'topo-dojo',
    storeKey: 'topo-belts',
    belts: [
      { id: 'weiss', name: 'Weißer Gürtel', topic: 'Topologien erkennen', color: '#f4f1ea', gen: genRecognize },
      { id: 'gelb', name: 'Gelber Gürtel', topic: 'Leitungen zählen', color: '#facc15', gen: genCount },
      { id: 'orange', name: 'Oranger Gürtel', topic: 'Ausfälle einschätzen', color: '#f97316', gen: genFailure },
      { id: 'gruen', name: 'Grüner Gürtel', topic: 'Topologien bauen', color: '#16a34a', gen: genBuild },
    ],
    note: 'Löse 5 Aufgaben in Folge richtig, um einen Gürtel zu erhalten. Der Fortschritt wird nur in diesem Browser gespeichert.',
  });
})();
