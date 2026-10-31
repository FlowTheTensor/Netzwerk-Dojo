/* Verschlüsselung & Anonymität · Station 3: Diffie-Hellman, TLS-1.3-Handshake, Zertifikate */
'use strict';

(() => {
  const { $, $$ } = UI;
  const { modPow } = KRYPTO;

  /* ---------- Diffie-Hellman ---------- */
  const P = 23, G = 5;
  function renderDh() {
    const a = Number($('#kr-a').value), b = Number($('#kr-b').value);
    $('#kr-a-out').textContent = a;
    $('#kr-b-out').textContent = b;
    const A = modPow(G, a, P), B = modPow(G, b, P);
    const sA = modPow(B, a, P), sB = modPow(A, b, P);
    // Erste Spalte: Zeitachse von oben nach unten mit nummerierten Schritten
    const row = (t, l, m, r) => `<div class="kr-dh-t">${t}</div><div class="kr-dh-l">${l}</div><div class="kr-dh-m">${m}</div><div class="kr-dh-r">${r}</div>`;
    const step = (n, w) => `<b>${n}</b><small>${w}</small>`;
    $('#kr-dh').innerHTML = `
      ${row('<small class="kr-dh-time">Zeit</small>', '<b>👩 Alice</b>', '<b>📡 offene Leitung</b><small>Eve liest mit</small>', '<b>👨 Bob</b>')}
      ${row(step(1, 'vereinbaren'), '', `p = ${P} und g = ${G} – öffentlich, jeder darf sie kennen`, '')}
      ${row(step(2, 'geheim wählen'), `wählt geheim <code class="sec">a = ${a}</code>`, '<span class="muted">bleibt geheim – geht nicht über die Leitung</span>', `wählt geheim <code class="sec">b = ${b}</code>`)}
      ${row(step(3, 'rechnen'), `A = ${G}<sup>${a}</sup> mod ${P} = <b>${A}</b>`, '', `B = ${G}<sup>${b}</sup> mod ${P} = <b>${B}</b>`)}
      ${row(step(4, 'austauschen'), '<span class="kr-send">schickt A →</span><span class="kr-send">← empfängt B</span>', `<span class="kr-send">A = ${A} →</span><span class="kr-send">← B = ${B}</span>`, '<span class="kr-send">← empfängt A</span><span class="kr-send">schickt B →</span>')}
      ${row(step(5, 'Schlüssel'), `s = B<sup>a</sup> mod ${P} = ${B}<sup>${a}</sup> mod ${P} = <b class="kr-s">${sA}</b>`, '', `s = A<sup>b</sup> mod ${P} = ${A}<sup>${b}</sup> mod ${P} = <b class="kr-s">${sB}</b>`)}
      ${row('<span class="kr-dh-end">▼</span>', '<b>beide haben denselben Schlüssel</b>', `<span class="kr-eve">🕵 Eve kennt ${P}, ${G}, ${A} und ${B} – aber nicht <b>${sA}</b></span>`, '<b>beide haben denselben Schlüssel</b>')}`;
  }
  $('#kr-a').addEventListener('input', renderDh);
  $('#kr-b').addEventListener('input', renderDh);
  renderDh();

  /* ---------- TLS-1.3-Handshake ---------- */
  const MSG = [
    { n: 'ClientHello', d: 'Zufallszahl C · Verfahren · Schlüsselanteil A · Name', dir: 1, enc: false,
      say: '<b>ClientHello:</b> Der Browser schickt eine Zufallszahl, die Verfahren, die er beherrscht, und gleich seinen <b>Diffie-Hellman-Schlüsselanteil A</b>. Dazu den gewünschten Servernamen <code>www.example.com</code> – noch unverschlüsselt.' },
    { n: 'ServerHello', d: 'Zufallszahl S · gewähltes Verfahren · Schlüsselanteil B', dir: -1, enc: false,
      say: '<b>ServerHello:</b> Der Server wählt ein Verfahren, z. B. <code>TLS_AES_128_GCM_SHA256</code> (AES mit 128 Bit), und schickt seinen <b>Schlüsselanteil B</b>. Jetzt berechnen <b>beide</b> aus A und B denselben geheimen Schlüssel. Ab hier ist alles verschlüsselt.' },
    { n: 'Certificate', d: 'Zertifikat mit öffentlichem Schlüssel des Servers', dir: -1, enc: true,
      say: '<b>Certificate:</b> Der Server schickt sein <b>Zertifikat</b>. Darin steht sein öffentlicher Schlüssel, bestätigt von einer Zertifizierungsstelle. Der Browser prüft: Passt der Name? Ist es noch gültig? Führt die Kette zu einer vertrauenswürdigen Root-CA?' },
    { n: 'CertificateVerify', d: 'Signatur über den Handshake (privater Schlüssel)', dir: -1, enc: true,
      say: '<b>CertificateVerify:</b> Der Server <b>signiert</b> alle bisherigen Nachrichten mit seinem <b>privaten</b> Schlüssel. Der Browser prüft die Signatur mit dem öffentlichen Schlüssel aus dem Zertifikat. Damit ist bewiesen: Am anderen Ende sitzt wirklich der Besitzer des Zertifikats – kein Angreifer dazwischen.' },
    { n: 'Finished', d: 'Prüfsumme über alle Nachrichten', dir: -1, enc: true,
      say: '<b>Finished (Server):</b> Eine Prüfsumme über den gesamten Handshake. Hätte jemand unterwegs etwas verändert, würde sie nicht passen.' },
    { n: 'Finished', d: 'Prüfsumme über alle Nachrichten', dir: 1, enc: true,
      say: '<b>Finished (Browser):</b> Der Browser bestätigt ebenfalls. Der Handshake ist fertig – nach nur einer Runde hin und zurück.' },
    { n: 'GET /index.html', d: 'HTTP-Anfrage, symmetrisch mit AES verschlüsselt', dir: 1, enc: true, app: true,
      say: '<b>Anwendungsdaten:</b> Jetzt fließt ganz normales HTTP – aber <b>symmetrisch</b> mit AES verschlüsselt. Das geht schnell. Wer mitliest, sieht nur Zeichensalat.' },
    { n: '200 OK + Webseite', d: 'HTTP-Antwort, verschlüsselt', dir: -1, enc: true, app: true,
      say: 'Die Webseite kommt verschlüsselt zurück. Im Browser erscheint das Schloss-Symbol. Den Sitzungsschlüssel werfen beide am Ende weg.' },
  ];
  const XC = 120, XS = 640, Y0 = 92, DY = 44;
  function tlsSvg(s) {
    const GAP = 34;
    const H = Y0 + DY * MSG.length + GAP - 10;
    let g = `
      <rect class="dn-node" x="${XC - 80}" y="8" width="160" height="50" rx="10"/>
      <text class="dn-nt" x="${XC}" y="29" text-anchor="middle">💻 Browser</text>
      <text class="dn-ns" x="${XC}" y="47" text-anchor="middle">Client</text>
      <rect class="dn-node" x="${XS - 80}" y="8" width="160" height="50" rx="10"/>
      <text class="dn-nt" x="${XS}" y="29" text-anchor="middle">🗄 Webserver</text>
      <text class="dn-ns" x="${XS}" y="47" text-anchor="middle">www.example.com</text>
      <line class="dn-life" x1="${XC}" y1="60" x2="${XC}" y2="${H - 8}"/>
      <line class="dn-life" x1="${XS}" y1="60" x2="${XS}" y2="${H - 8}"/>`;
    if (s >= 2) {
      const y = Y0 + DY + 40;
      g += `<g class="kr-tls-key">${[XC, XS].map(x => `<rect x="${x - 82}" y="${y - 11}" width="164" height="21" rx="6"/><text x="${x}" y="${y + 4}" text-anchor="middle">🔑 Schlüssel berechnet</text>`).join('')}</g>`;
    }
    MSG.forEach((m, i) => {
      if (i >= s) return;
      const y = Y0 + i * DY + (i >= 2 ? GAP : 0);
      const [x1, x2] = m.dir > 0 ? [XC + 4, XS - 10] : [XS - 4, XC + 10];
      const now = i === s - 1;
      g += `<g class="dn-msg${now ? ' now' : ''}${m.enc ? ' kr-enc' : ''}">
        <line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" marker-end="url(#kr-arr${now ? '-now' : m.enc ? '-enc' : ''})"/>
        <text class="dn-mt" x="${(XC + XS) / 2}" y="${y - 8}" text-anchor="middle"><tspan class="dn-no">${i + 1}</tspan> ${m.enc ? '🔒 ' : ''}${m.n}</text>
        <text class="dn-ms" x="${(XC + XS) / 2}" y="${y + 15}" text-anchor="middle">${m.d}</text>
      </g>`;
    });
    return `<svg class="dn-svg" viewBox="0 0 760 ${H + 14}" role="img" aria-label="TLS-1.3-Handshake zwischen Browser und Webserver">
      <defs>${['', 'now', 'enc'].map(k => `<marker id="kr-arr${k ? '-' + k : ''}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 L10 5 L0 10 z" class="dn-ah ${k === 'enc' ? 'web' : k}"/></marker>`).join('')}</defs>${g}</svg>`;
  }
  DIENSTE.stepper({
    last: MSG.length, page: 'sec-tls',
    step: $('#kr-tls-step'), go: $('#kr-tls-go'), reset: $('#kr-tls-reset'),
    render(s) {
      $('#kr-tls').innerHTML = tlsSvg(s);
      const say = s === 0 ? 'Der Browser hat per DNS die IP-Adresse und per TCP eine Verbindung zu Port 443 aufgebaut. Jetzt beginnt der TLS-Handshake.' : MSG[s - 1].say;
      $('#kr-tls-say').innerHTML = `<p><span class="osi-stepno">${s} / ${MSG.length}</span>${say}</p>`;
    },
  });

  /* ---------- Zertifikatskette ---------- */
  $('#kr-chain').innerHTML = [
    ['Root-CA', 'z. B. ISRG Root X1', 'im Browser bzw. Betriebssystem gespeichert, unterschreibt sich selbst', 'root'],
    ['Zwischenzertifikat', 'z. B. Let\'s Encrypt R11', 'von der Root-CA signiert', 'mid'],
    ['Serverzertifikat', 'www.example.com', 'von der Zwischen-CA signiert · enthält den öffentlichen Schlüssel des Servers · gültig 90 Tage', 'leaf'],
  ].map(([t, n, d, c]) => `<div class="kr-cert ${c}"><small>${t}</small><b>${n}</b><span>${d}</span></div>`).join('<i class="kr-chain-arr">▼ signiert</i>');

  /* ---------- Darf der Browser vertrauen? ---------- */
  const CERT = {
    ok: { warn: false, issuer: 'Let\'s Encrypt R11', subject: 'www.example.com', valid: '01.10.2026 – 30.12.2026', checks: [1, 1, 1, 1],
      txt: 'Alle Prüfungen bestanden. Der Browser zeigt das Schloss und lädt die Seite.' },
    expired: { warn: true, code: 'NET::ERR_CERT_DATE_INVALID', issuer: 'Let\'s Encrypt R11', subject: 'www.example.com', valid: '05.07.2026 – 03.10.2026', checks: [1, 0, 1, 1],
      txt: 'Das Zertifikat ist seit Anfang Oktober abgelaufen. Meist hat der Betreiber nur vergessen, es zu erneuern – trotzdem kann der Browser nicht mehr sicher sein, dass der Schlüssel noch in den richtigen Händen ist.' },
    name: { warn: true, code: 'NET::ERR_CERT_COMMON_NAME_INVALID', issuer: 'Let\'s Encrypt R11', subject: 'shop.example.net', valid: '01.10.2026 – 30.12.2026', checks: [1, 1, 1, 0],
      txt: 'Das Zertifikat ist echt – aber für <code>shop.example.net</code>, nicht für <code>www.example.com</code>. Ein Zertifikat gilt nur für die Namen, die darin stehen.' },
    self: { warn: true, code: 'NET::ERR_CERT_AUTHORITY_INVALID', issuer: 'www.example.com (selbst)', subject: 'www.example.com', valid: '01.01.2026 – 31.12.2030', checks: [1, 1, 0, 1],
      txt: 'Der Server hat sich sein Zertifikat selbst ausgestellt. Das kann jeder – also beweist es nichts. Typisch für die Weboberfläche von Routern oder Druckern im eigenen Netz; bei einer Webseite im Internet ist es ein Alarmzeichen.' },
    mitm: { warn: true, code: 'NET::ERR_CERT_AUTHORITY_INVALID', issuer: 'Free WiFi Secure CA', subject: 'www.example.com', valid: '31.10.2026 – 30.11.2026', checks: [1, 1, 0, 1],
      txt: 'Jemand im WLAN hat sich dazwischengeschaltet und schickt ein eigenes Zertifikat für <code>www.example.com</code>. Seine „CA“ steht aber in keiner Liste des Browsers. Genau dafür gibt es Zertifikate: <b>Auf keinen Fall „Trotzdem fortfahren“ klicken</b> – sonst liest der Angreifer alles mit, auch Passwörter.' },
  };
  const CHECKS = ['Signatur ist echt', 'zeitlich gültig', 'Kette führt zu einer vertrauenswürdigen Root-CA', 'Name passt zur Adresse'];
  function renderCert(c) {
    const r = CERT[c];
    $$('#kr-certs button').forEach(b => b.classList.toggle('active', b.dataset.c === c));
    $('#kr-cert-out').innerHTML = `
      <div class="kr-browser${r.warn ? ' warn' : ''}">
        <div class="kr-bar"><span class="kr-lock">${r.warn ? '⚠ Nicht sicher' : '🔒'}</span><span class="kr-url">${r.warn ? '<s>https</s>' : 'https'}://www.example.com</span></div>
        <div class="kr-page">${r.warn ? `<b>Achtung: Diese Verbindung ist nicht sicher</b><span>Angreifer könnten versuchen, deine Daten zu stehlen.</span><code>${r.code}</code>` : '<b>Willkommen bei www.example.com</b><span>Die Seite wird geladen.</span>'}</div>
      </div>
      <div class="kr-cert-grid">
        <div class="tbl-wrap"><table class="tbl compact kb-eth-tbl"><tbody>
          <tr><th>Ausgestellt für</th><td>${r.subject}</td></tr>
          <tr><th>Aussteller</th><td>${r.issuer}</td></tr>
          <tr><th>Gültig</th><td>${r.valid}</td></tr>
        </tbody></table></div>
        <ul class="fb">${CHECKS.map((t, i) => `<li class="${r.checks[i] ? 'ok' : 'err'}">${t}</li>`).join('')}</ul>
      </div>
      <p class="b-res ${r.warn ? 'b-apipa' : 'b-priv'}">${r.txt}</p>`;
  }
  $('#kr-certs').addEventListener('click', e => { const b = e.target.closest('[data-c]'); if (b) renderCert(b.dataset.c); });
  renderCert('ok');
})();
