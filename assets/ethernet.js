/* Kabel & Signale · Station 5: Ethernet-Standards – Namen zerlegen, Stammbaum */
'use strict';

// Auch fürs Kabel-Dojo. old = Geschichte, in neuen Netzen nicht mehr zu finden.
const ETHERNET = (() => {
  const GROUPS = [
    ['10', 'Standard-Ethernet', '10 Mbit/s'],
    ['100', 'Fast Ethernet', '100 Mbit/s'],
    ['1000', 'Gigabit-Ethernet', '1 Gbit/s'],
    ['multi', 'Multi-Gigabit und mehr', '2,5 bis 40 Gbit/s'],
  ];
  const STD = [
    { id: '10BASE5', g: '10', medium: 'dickes Koaxialkabel („Yellow Cable“, Thick Ethernet)', len: '500 m pro Segment', plug: 'Transceiver mit „Vampirklemme“, AUI-Kabel zum PC', code: 'Manchester', year: 1983, ieee: '802.3', old: true, note: 'Bus-Topologie mit Abschlusswiderständen an beiden Enden.' },
    { id: '10BASE2', g: '10', medium: 'dünnes Koaxialkabel RG-58 (Thin Ethernet, „Cheapernet“)', len: '185 m pro Segment', plug: 'BNC-T-Stück, 50-Ω-Abschlusswiderstand an den Enden', code: 'Manchester', year: 1985, ieee: '802.3a', old: true, note: 'Bus-Topologie. Die „2“ steht für rund 200 m.' },
    { id: '10BASE-T', g: '10', medium: 'Twisted Pair ab Kat. 3, 2 Adernpaare', len: '100 m', plug: 'RJ45', code: 'Manchester', year: 1990, ieee: '802.3i', old: true, note: 'Der erste Stern: jedes Gerät mit eigenem Kabel am Hub. Heutige Netzwerkkarten beherrschen 10BASE-T immer noch.' },
    { id: '10BASE-FL', g: '10', medium: 'Multimode-Glasfaser', len: '2 km', plug: 'ST', code: 'Manchester', year: 1993, ieee: '802.3j', old: true, note: 'Verband früher Hubs über größere Entfernungen.' },
    { id: '100BASE-TX', g: '100', medium: 'Twisted Pair ab Kat. 5, 2 Adernpaare', len: '100 m', plug: 'RJ45', code: '4B5B + MLT-3', year: 1995, ieee: '802.3u', old: false, note: 'Das „Fast Ethernet“, das sich durchgesetzt hat. Heute noch in Druckern, Steuerungen und vielen Industriegeräten.' },
    { id: '100BASE-T4', g: '100', medium: 'Twisted Pair Kat. 3, alle 4 Adernpaare', len: '100 m', plug: 'RJ45', code: '8B6T', year: 1995, ieee: '802.3u', old: true, note: 'Sollte alte Kat.-3-Verkabelung weiter nutzbar machen – hat sich nie durchgesetzt.' },
    { id: '100BASE-FX', g: '100', medium: 'Multimode-Glasfaser', len: '2 km', plug: 'SC oder ST', code: '4B5B + NRZI', year: 1995, ieee: '802.3u', old: true, note: 'Fast Ethernet über Glasfaser, findet sich noch in älteren Industrieanlagen.' },
    { id: '1000BASE-T', g: '1000', medium: 'Twisted Pair ab Kat. 5e, alle 4 Adernpaare', len: '100 m', plug: 'RJ45', code: 'PAM-5', year: 1999, ieee: '802.3ab', old: false, note: '<b>Der Trick:</b> Alle vier Paare senden gleichzeitig und in beide Richtungen; jedes Gerät rechnet sein eigenes Sendesignal wieder heraus (Echokompensation). So reichen 125 Millionen Schritte pro Sekunde je Paar für 1000 Mbit/s.' },
    { id: '1000BASE-SX', g: '1000', medium: 'Multimode-Glasfaser, 850 nm', len: '220–550 m (je nach Faser)', plug: 'LC', code: '8B10B', year: 1998, ieee: '802.3z', old: false, note: 'S = short wavelength: kurze Wellenlänge, günstige Laser.' },
    { id: '1000BASE-LX', g: '1000', medium: 'Singlemode-Glasfaser, 1310 nm (auch Multimode bis 550 m)', len: '5 km (Singlemode)', plug: 'LC', code: '8B10B', year: 1998, ieee: '802.3z', old: false, note: 'L = long wavelength. In der Praxis sind Module für 10 km üblich.' },
    { id: '2.5GBASE-T', g: 'multi', medium: 'Twisted Pair ab Kat. 5e', len: '100 m', plug: 'RJ45', code: 'PAM-16', year: 2016, ieee: '802.3bz', old: false, note: 'Für Geräte, denen 1 Gbit/s nicht mehr reicht – z. B. WLAN-Access-Points – auf den vorhandenen Kabeln.' },
    { id: '5GBASE-T', g: 'multi', medium: 'Twisted Pair ab Kat. 6 (Kat. 5e oft möglich)', len: '100 m', plug: 'RJ45', code: 'PAM-16', year: 2016, ieee: '802.3bz', old: false, note: 'Zusammen mit 2.5GBASE-T als „NBASE-T“ oder „Multi-Gigabit“ bekannt.' },
    { id: '10GBASE-T', g: 'multi', medium: 'Twisted Pair ab Kat. 6A (Kat. 6 bis 55 m)', len: '100 m', plug: 'RJ45', code: 'PAM-16', year: 2006, ieee: '802.3an', old: false, note: '10 Gbit/s über Kupfer und RJ45 – braucht Kat. 6A, deshalb ist das heute der Standard für neue Verkabelung.' },
    { id: '10GBASE-SR', g: 'multi', medium: 'Multimode-Glasfaser, 850 nm', len: '300 m (OM3), 400 m (OM4)', plug: 'LC', code: '64B66B', year: 2002, ieee: '802.3ae', old: false, note: 'SR = short reach. Typisch im Rechenzentrum und im Gebäude-Backbone.' },
    { id: '10GBASE-LR', g: 'multi', medium: 'Singlemode-Glasfaser, 1310 nm', len: '10 km', plug: 'LC', code: '64B66B', year: 2002, ieee: '802.3ae', old: false, note: 'LR = long reach. Verbindet Gebäude und Standorte.' },
    { id: '40GBASE-T', g: 'multi', medium: 'Twisted Pair Kat. 8', len: '30 m', plug: 'RJ45 (Kat. 8.1), TERA oder ARJ45 (Kat. 8.2)', code: 'PAM-16', year: 2016, ieee: '802.3bq', old: false, note: 'Gibt es auch als 25GBASE-T. Nur für kurze Wege im Rechenzentrum und kaum verbreitet – dort nimmt man meist Glasfaser.' },
  ];
  const find = id => STD.find(s => s.id === id.toUpperCase().replace(/\s/g, ''));
  return { GROUPS, STD, find };
})();

(() => {
  const { $, esc } = UI;
  const { GROUPS, STD, find } = ETHERNET;
  const inp = $('#kb-eth-in');

  // Kürzel hinter BASE
  const MEDIUM = {
    T: 'Twisted Pair (verdrilltes Kupferkabel)',
    TX: 'Twisted Pair, 2 Adernpaare',
    T4: 'Twisted Pair, 4 Adernpaare (Kat. 3)',
    2: 'dünnes Koaxialkabel, rund 200 m',
    5: 'dickes Koaxialkabel, 500 m',
    FL: 'Glasfaser (Fiber Link)',
    FX: 'Glasfaser',
    SX: 'Glasfaser, kurze Wellenlänge (850 nm), Multimode',
    LX: 'Glasfaser, lange Wellenlänge (1310 nm)',
    SR: 'Glasfaser, short reach (850 nm, Multimode)',
    LR: 'Glasfaser, long reach (1310 nm, Singlemode, 10 km)',
    ER: 'Glasfaser, extended reach (1550 nm, Singlemode, 40 km)',
  };

  function render() {
    const raw = inp.value.trim().toUpperCase().replace(/\s/g, '');
    const m = raw.match(/^(\d+(?:[.,]\d+)?)(G?)BASE-?([A-Z0-9]+)$/);
    const out = $('#kb-eth-out');
    inp.classList.toggle('bad', !m);
    if (!m) {
      out.innerHTML = '<p class="field-fb">Form: Datenrate, „BASE“, Medium – z. B. <code>100BASE-TX</code> oder <code>10GBASE-SR</code>.</p>';
      return;
    }
    const [, n, g, med] = m;
    const rate = g ? `${n.replace('.', ',')} Gbit/s` : Number(n) >= 1000 ? `${Number(n) / 1000} Gbit/s` : `${n} Mbit/s`;
    const s = find(raw) || find(`${n}${g}BASE-${med}`) || find(`${n}${g}BASE${med}`);
    out.innerHTML = `
      <div class="kb-eth-parts">
        <span class="kb-part p-rate"><b>${esc(n + g)}</b><small>Datenrate<br>${rate}</small></span>
        <span class="kb-part p-base"><b>BASE</b><small>Basisband</small></span>
        <span class="kb-part p-med"><b>${esc(med)}</b><small>Medium<br>${MEDIUM[med] || 'unbekanntes Kürzel'}</small></span>
      </div>
      ${s ? `<div class="tbl-wrap"><table class="tbl compact kb-eth-tbl"><tbody>
        <tr><th>Medium</th><td>${s.medium}</td></tr>
        <tr><th>Länge</th><td>${s.len}</td></tr>
        <tr><th>Anschluss</th><td>${s.plug}</td></tr>
        <tr><th>Leitungscode</th><td>${s.code}</td></tr>
        <tr><th>Norm</th><td>IEEE ${s.ieee} (${s.year})${s.old ? ' · <span class="kb-old">Geschichte</span>' : ''}</td></tr>
      </tbody></table></div><p>${s.note}</p>` : '<p class="muted">Diesen Standard gibt es in der Übersicht unten nicht – zerlegt wird der Name trotzdem.</p>'}`;
    document.querySelectorAll('#kb-tree [data-std]').forEach(b => b.classList.toggle('active', !!s && b.dataset.std === s.id));
  }

  $('#kb-tree').innerHTML = GROUPS.map(([g, name, rate]) => `
    <div class="kb-tree-col"><h3>${name}<small>${rate}</small></h3>
      ${STD.filter(s => s.g === g).map(s => `<button type="button" class="kb-std-btn${s.old ? ' old' : ''}" data-std="${s.id}"><b>${s.id}</b><small>${s.medium.split(',')[0]} · ${s.len}</small>${s.old ? '<span class="kb-old">Geschichte</span>' : ''}</button>`).join('')}
    </div>`).join('');
  $('#kb-tree').addEventListener('click', e => {
    const b = e.target.closest('[data-std]');
    if (!b) return;
    inp.value = b.dataset.std;
    render();
    inp.scrollIntoView({ behavior: FX.calm.matches ? 'auto' : 'smooth', block: 'center' });
  });
  inp.addEventListener('input', render);
  render();
})();
