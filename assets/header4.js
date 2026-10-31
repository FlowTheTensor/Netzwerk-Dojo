/* IPv4 · Station 5 – Der IPv4-Header: Felder erklären, Beispielpaket mit echten Werten */
'use strict';

(() => {
  const { $, $$ } = UI;
  const hx = (n, d = 4) => n.toString(16).toUpperCase().padStart(d, '0');

  // Beispielpaket: 192.168.1.10 → 203.0.113.5, TCP, 60 Byte, „Don't Fragment“
  const P = { ver: 4, ihl: 5, tos: 0, len: 60, id: 0x1c46, df: 1, off: 0, ttl: 64, proto: 6 };
  function checksum(ttl) {
    const w = [0x4500, P.len, P.id, 0x4000, (ttl << 8) | P.proto, 0, 0xc0a8, 0x010a, 0xcb00, 0x7105];
    let s = w.reduce((x, y) => x + y, 0);
    while (s > 0xffff) s = (s & 0xffff) + (s >> 16);
    return (~s) & 0xffff;
  }

  // Klassen: len = Aufbau/Länge, ctl = Weiterleitung, frag = Fragmentierung, chk = Prüfung, addr = Adressen, opt = Optionen
  const ROWS = [
    [['ver', 'Version', 4, 'len', 1, '4'], ['ihl', 'Header-Länge', 4, 'len', 1, '5 (= 20 Byte)'], ['tos', 'Type of Service', 8, 'ctl', 1, '0'], ['len', 'Gesamtlänge', 16, 'len', 1, `${P.len} Byte`]],
    [['id', 'Identifikation', 16, 'frag', 1, `0x${hx(P.id)}`], ['flags', 'Flags', 3, 'frag', 1, 'DF'], ['frag', 'Fragment-Offset', 13, 'frag', 1, '0']],
    [['ttl', 'TTL', 8, 'ctl', 1, String(P.ttl)], ['proto', 'Protokoll', 8, 'ctl', 1, '6 (TCP)'], ['csum', 'Header-Prüfsumme', 16, 'chk', 1, `0x${hx(checksum(P.ttl))}`]],
    [['src', 'Absenderadresse', 32, 'addr', 1, '192.168.1.10']],
    [['dst', 'Zieladresse', 32, 'addr', 1, '203.0.113.5']],
    [['opt', 'Optionen (0–40 Byte, meist leer)', 32, 'opt', 1, '–']],
  ];

  const INFO = {
    ver: '<b>Version</b> (4 Bit): Steht bei IPv4 immer auf <b>4</b>. Daran erkennt ein Gerät, wie es den Rest des Headers lesen muss.',
    ihl: '<b>Header-Länge</b> (IHL, 4 Bit): Länge des Headers in 32-Bit-Zeilen. Ohne Optionen sind es <b>5 Zeilen × 4 Byte = 20 Byte</b>, mit Optionen bis zu 15 × 4 = 60 Byte. Nötig, weil der Empfänger sonst nicht wüsste, wo die Daten anfangen.',
    tos: '<b>Type of Service</b> (8 Bit, heute DSCP und ECN): Priorität des Pakets. Telefonie (Voice over IP) bekommt z. B. eine höhere Priorität als ein Download, damit das Gespräch nicht stockt.',
    len: '<b>Gesamtlänge</b> (16 Bit): Header plus Daten in Byte, höchstens 65.535. Im Ethernet sind Pakete meist höchstens 1500 Byte groß (MTU).',
    id: '<b>Identifikation</b> (16 Bit): Eine Nummer pro Paket. Wird ein Paket unterwegs in Bruchstücke (Fragmente) zerlegt, tragen alle Bruchstücke dieselbe Nummer – so setzt der Empfänger sie wieder zusammen.',
    flags: '<b>Flags</b> (3 Bit): Das wichtigste ist <b>DF</b> („Don’t Fragment“): Das Paket darf nicht zerlegt werden. Ist es zu groß, wird es verworfen. Das Flag <b>MF</b> („More Fragments“) sagt, dass noch weitere Bruchstücke folgen.',
    frag: '<b>Fragment-Offset</b> (13 Bit): An welcher Stelle im ursprünglichen Paket ein Bruchstück steht – in Schritten zu 8 Byte. Beim ersten (oder einzigen) Teil steht hier 0.',
    ttl: '<b>TTL</b> (Time to Live, 8 Bit): Jeder Router zieht 1 ab. Erreicht die TTL 0, wird das Paket verworfen und der Absender bekommt eine Fehlermeldung. So kreisen Pakete bei einem Fehler im Netz nicht ewig. Windows startet mit <b>128</b>, Linux mit <b>64</b> – das siehst du beim <code>ping</code>.',
    proto: '<b>Protokoll</b> (8 Bit): Welches Protokoll in den Daten steckt, damit der Empfänger sie richtig weitergibt: <b>1 = ICMP</b> (z. B. ping), <b>6 = TCP</b> (z. B. Webseiten), <b>17 = UDP</b> (z. B. DNS, Video).',
    csum: '<b>Header-Prüfsumme</b> (16 Bit): Damit erkennt ein Router, ob der Header unterwegs beschädigt wurde. Sie wird über den ganzen Header berechnet. Weil sich die TTL bei jedem Router ändert, muss <b>jeder Router die Prüfsumme neu berechnen</b> – probier es unten aus.',
    src: '<b>Absenderadresse</b> (32 Bit): IP-Adresse des Geräts, das das Paket geschickt hat. An diese Adresse geht die Antwort.',
    dst: '<b>Zieladresse</b> (32 Bit): IP-Adresse des Empfängers. Jeder Router schaut nur hierauf, um zu entscheiden, wohin er das Paket weiterleitet.',
    opt: '<b>Optionen</b> (0–40 Byte): Selten genutzte Zusatzangaben. Fast immer leer – der Header ist dann genau 20 Byte lang.',
  };

  const grid = $('#v4-hdr');
  grid.innerHTML = UI.headerGrid(ROWS);
  const info = $('#v4-hdr-info');
  grid.addEventListener('click', e => {
    const f = e.target.closest('[data-f]');
    if (!f) return;
    $$('.v6-f', grid).forEach(x => x.classList.toggle('sel', x === f));
    info.innerHTML = `<p>${INFO[f.dataset.f]}</p>`;
  });
  $('#v4-vals').addEventListener('change', e => grid.classList.toggle('show-vals', e.target.checked));

  /* ---------- TTL-Regler: Prüfsumme ändert sich mit ---------- */
  const ttlIn = $('#v4-ttl');
  function showTtl() {
    const t = Number(ttlIn.value);
    $('#v4-ttl-out').textContent = t;
    const cs = checksum(t);
    $('#v4-ttl-res').innerHTML = `TTL <b>${t}</b> = <code>${hx(t, 2)}</code> (hex) → Header-Prüfsumme <b class="v4-cs">0x${hx(cs)}</b>` +
      (t === 0 ? ' <span class="err-text">– bei TTL 0 wird das Paket verworfen.</span>' : '');
    const v = grid.querySelector('[data-f="ttl"] .hv');
    if (v) v.textContent = t;
    const c = grid.querySelector('[data-f="csum"] .hv');
    if (c) c.textContent = `0x${hx(cs)}`;
  }
  ttlIn.addEventListener('input', showTtl);
  showTtl();
})();
