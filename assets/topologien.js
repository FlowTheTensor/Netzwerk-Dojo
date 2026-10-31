/* Topologien · Station 1 (verstehen, Ausfälle ausprobieren) und Station 2 (Baukasten) */
'use strict';

(() => {
  const { $, $$, esc } = UI;
  const fmt = n => n.toLocaleString('de-DE');

  /* ---------- Station 1: Abbildungen mit Ausfall-Simulation ---------- */

  const FIGS = {
    p2p: () => Topo.make('p2p', { w: 520, h: 150, types: ['pc', 'sps'] }),
    stern: () => Topo.make('stern', { w: 520, h: 300, n: 6, sps: 1 }),
    baum: () => Topo.make('baum', { w: 520, h: 330, per: [2, 3], sps: 1 }),
    ring: () => Topo.make('ring', { w: 520, h: 300, n: 6, sps: 3 }),
    vollmesh: () => Topo.make('vollmesh', { w: 520, h: 300, n: 5 }),
    teilmesh: () => Topo.make('teilmesh', { w: 520, h: 300, n: 5, chords: 2 }),
  };
  const SIZE = { p2p: [520, 150], baum: [520, 330] };

  // Klartext: was passiert nach dem Ausfall?
  function failText(net, node, edge) {
    if (!node && !edge) return 'Klick auf ein Gerät oder eine Leitung, um einen Ausfall zu simulieren.';
    const L = id => `<b>${esc(net.nodes.find(n => n.id === id).label)}</b>`;
    const what = node ? `${L(node)} ist ausgefallen.` : `Die Leitung ${L(edge[0])} – ${L(edge[1])} ist unterbrochen.`;
    const iso = Topo.isolatedAfter(net, node, edge);
    const comps = Topo.components(net, new Set(node ? [node] : []), new Set(edge ? [Topo.key(...edge)] : []));
    const big = comps.filter(c => c.length > 1);
    let res;
    if (!iso.length && big.length <= 1) res = 'Alle übrigen Geräte können weiterhin miteinander kommunizieren.';
    else {
      res = iso.length ? `${iso.map(L).join(', ')} ${iso.length > 1 ? 'können' : 'kann'} mit niemandem mehr kommunizieren.` : '';
      if (big.length > 1) res += ` Das Netz ist in <b>${big.length} getrennte Teile</b> zerfallen.`;
    }
    return `${what} ${res} <span class="muted">(Nochmal klicken = wieder reparieren)</span>`;
  }

  function figure(el) {
    const kind = el.dataset.fig;
    const net = FIGS[kind]();
    const [w, h] = SIZE[kind] || [520, 300];
    let node = null;
    let edge = null;
    const info = el.parentElement.querySelector('.t-fail');
    function draw() {
      const iso = new Set(Topo.isolatedAfter(net, node, edge));
      if (node || edge) iso.delete(node);
      el.innerHTML = Topo.svg(net, {
        w, h, cls: 'tp-fail', interactive: true, edgeHit: true,
        failed: new Set(node ? [node] : []), failedEdge: edge, off: (node || edge) ? iso : null,
        label: `Beispiel: ${Topo.NAMES[kind]}`,
      });
      info.innerHTML = failText(net, node, edge);
    }
    function toggleNode(id) { node = node === id ? null : id; edge = null; draw(); }
    el.addEventListener('click', e => {
      const nd = e.target.closest('.tp-node');
      if (nd) { toggleNode(nd.dataset.id); return; }
      const ed = e.target.closest('.tp-edge');
      if (ed) {
        const ab = net.edges[Number(ed.dataset.e)];
        edge = edge && Topo.key(...edge) === Topo.key(...ab) ? null : ab;
        node = null;
        draw();
      }
    });
    el.addEventListener('keydown', e => {
      const nd = e.target.closest('.tp-node');
      if (nd && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); toggleNode(nd.dataset.id); el.querySelector(`[data-id="${nd.dataset.id}"]`)?.focus(); }
    });
    draw();
  }
  $$('[data-fig]').forEach(figure);

  // Mesh: zwischen voll und teilweise umschalten
  $$('[data-mesh]').forEach(b => b.addEventListener('click', () => {
    const fig = $('#t-fig-mesh');
    fig.dataset.fig = b.dataset.mesh;
    $$('[data-mesh]').forEach(x => x.classList.toggle('active', x === b));
    const clone = fig.cloneNode(false); // alte Klick-Handler entfernen
    fig.replaceWith(clone);
    figure(clone);
  }));

  // Kabel im Vollmesh: n · (n − 1) / 2
  const meshIn = $('#t-mesh-n');
  function showMesh() {
    const n = Number(meshIn.value);
    const c = n * (n - 1) / 2;
    $('#t-mesh-out').textContent = n;
    $('#t-mesh-res').innerHTML = `${n} Geräte · jedes braucht ${n - 1} Anschlüsse · <b>${n} · ${n - 1} / 2 = ${fmt(c)} Leitungen</b>` +
      (n > 2 ? ` <span class="muted">(Zum Vergleich Stern: ${n} Leitungen + 1 Switch)</span>` : '');
    $('#t-mesh-fig').innerHTML = Topo.svg(Topo.make('vollmesh', { w: 360, h: 260, n }), { w: 360, h: 260, cls: 'tp-mini', label: `Vollmesh mit ${n} Geräten` });
  }
  meshIn.addEventListener('input', showMesh);
  showMesh();

  /* ---------- Station 2: Baukasten ---------- */

  const KINDS = ['p2p', 'stern', 'baum', 'ring', 'vollmesh', 'teilmesh'];
  let built = UI.store.get('topo-built', {}) || {};
  let kind = 'stern';
  let task = null;
  let ed = null;
  const fb = $('#tb-fb');

  function renderKinds() {
    $('#tb-kinds').innerHTML = KINDS.map(k => `<button type="button" data-k="${k}" class="${k === kind ? 'active' : ''}" aria-pressed="${k === kind}">
      <b>${Topo.NAMES[k]}</b><small>${built[k] ? '✔ geschafft' : 'offen'}</small></button>`).join('');
    const n = KINDS.filter(k => built[k]).length;
    $('#tb-count').textContent = `${n} von ${KINDS.length} Topologien gebaut`;
  }

  function newTask() {
    task = Topo.buildTask(kind);
    $('#tb-task').innerHTML = task.text;
    fb.className = 'dojo-fb';
    fb.innerHTML = '';
    ed?.destroy();
    ed = Topo.editor($('#tb-canvas'), task.net, {
      label: `Baufläche: ${Topo.NAMES[kind]}`,
      onChange: () => { if (fb.classList.contains('err')) { fb.className = 'dojo-fb'; fb.innerHTML = ''; } },
    });
    renderKinds();
  }

  $('#tb-kinds').addEventListener('click', e => {
    const b = e.target.closest('[data-k]');
    if (!b) return;
    kind = b.dataset.k;
    newTask();
  });
  $('#tb-check').addEventListener('click', () => {
    const res = Topo.check(ed.net(), task.spec);
    if (res.ok) {
      const first = !built[kind];
      built[kind] = true;
      UI.store.set('topo-built', built);
      const all = KINDS.every(k => built[k]);
      fb.className = 'dojo-fb ok';
      fb.innerHTML = `<p class="fb-head">✔ Richtig – Topologie <b>${Topo.NAMES[kind]}</b> gebaut.</p>` +
        (all && first ? '<p class="earned-msg">🥋 Du hast alle sechs Topologien gebaut!</p>' : '<p>Wähle oben die nächste Topologie oder mische die Geräte neu.</p>') +
        FX.stamp(all && first);
      const st = fb.querySelector('.hanko');
      if (all && first) FX.celebrate(st); else FX.pop(st);
      renderKinds();
    } else {
      fb.className = 'dojo-fb err';
      fb.innerHTML = `<p class="fb-head">✘ Noch nicht.</p><p>${res.why}</p>`;
      FX.shake($('#tb-card'));
    }
  });
  $('#tb-new').addEventListener('click', newTask);
  $('#tb-clear').addEventListener('click', () => { ed.clear(); fb.className = 'dojo-fb'; fb.innerHTML = ''; });

  newTask();
})();
