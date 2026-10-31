/* Verschlüsselung & Anonymität · Stationen 4–5: Proxy, VPN, Tor, „Wer sieht was?“ */
'use strict';

// Auch fürs Sicherheits-Dojo: wer sieht was – [IP, Ziel, Inhalt]; 'h' = nur ohne HTTPS
const ANONYM = (() => {
  const WHO = {
    direct: [
      ['WLAN & Provider', 'y', 'y', 'h'],
      ['Webserver', 'y', 'y', 'y'],
    ],
    proxy: [
      ['WLAN & Provider', 'y', 'y', 'h'],
      ['Proxy-Betreiber', 'y', 'y', 'h'],
      ['Webserver', 'n', 'y', 'y'],
    ],
    vpn: [
      ['WLAN & Provider', 'y', 'n', 'n'],
      ['VPN-Anbieter', 'y', 'y', 'h'],
      ['Webserver', 'n', 'y', 'y'],
    ],
    tor: [
      ['WLAN & Provider', 'y', 'n', 'n'],
      ['Tor-Eintrittsknoten', 'y', 'n', 'n'],
      ['Tor-Mittelknoten', 'n', 'n', 'n'],
      ['Tor-Austrittsknoten', 'n', 'y', 'h'],
      ['Webserver', 'n', 'y', 'y'],
    ],
  };
  const sees = (v, https) => v === 'y' || (v === 'h' && !https);
  return { WHO, sees };
})();

(() => {
  const { $, $$ } = UI;
  const { WHO, sees } = ANONYM;

  /* ---------- Pizza-Proxy ---------- */
  const GUESTS = [['Klaus', 'Salami', '203.0.113.21'], ['Eva', 'Margherita', '203.0.113.25'], ['Maria', 'Funghi', '203.0.113.37']];
  function renderPizza(g) {
    const [name, pizza, ip] = GUESTS[g];
    $$('#kr-guests button').forEach(b => b.classList.toggle('active', Number(b.dataset.g) === g));
    $('#kr-pizza').innerHTML = `
      <div class="kr-pz">
        <div class="kr-pz-n"><b>🙋 ${name}</b><small>Proxy-Client<br>${ip}</small></div>
        <div class="kr-pz-a"><span>„Pizza ${pizza} für mich“ →</span><span>← „Hier ist deine Pizza“</span></div>
        <div class="kr-pz-n proxy"><b>🧑‍🍳 Dieter</b><small>Proxy-Server<br>198.51.100.7:8080</small></div>
        <div class="kr-pz-a"><span>„Pizza ${pizza} für Dieter“ →</span><span>← „Hier die Pizza für Dieter“</span></div>
        <div class="kr-pz-n web"><b>🍕 Lieferdienst</b><small>Webserver<br>192.0.2.44</small></div>
      </div>
      <div class="kr-pz-list"><b>Dieters Zettel</b> (das muss sich der Proxy merken):
        ${GUESTS.map(([n, p], i) => `<span class="${i === g ? 'on' : ''}">${n} → ${p}</span>`).join('')}
      </div>
      <p class="kr-pz-say">Der Lieferdienst sieht als Absender nur <code>198.51.100.7</code> – von ${name} weiß er nichts. Dieter dagegen weiß genau, wer was bestellt hat.</p>`;
  }
  $('#kr-guests').addEventListener('click', e => { const b = e.target.closest('[data-g]'); if (b) renderPizza(Number(b.dataset.g)); });
  renderPizza(1);

  /* ---------- VPN an/aus ---------- */
  function renderVpn(v) {
    $$('#kr-vpn-seg button').forEach(b => b.classList.toggle('active', Number(b.dataset.v) === v));
    const n = (cls, t, s) => `<div class="kr-vn ${cls}"><b>${t}</b><small>${s}</small></div>`;
    $('#kr-vpn').innerHTML = v
      ? `<div class="kr-vrow tunnel">
          ${n('me', '💻 Laptop', '203.0.113.25')}
          <div class="kr-vt"><span>🔒 VPN-Tunnel</span></div>
          ${n('isp', '☁ Provider', 'sieht: Verbindung zu 198.51.100.50 · Inhalt verschlüsselt')}
          <div class="kr-vt"><span>🔒 VPN-Tunnel</span></div>
          ${n('vpn', '🛡 VPN-Server', '198.51.100.50 · packt aus, schickt weiter')}
          <div class="kr-va">→</div>
          ${n('web', 'Webserver', 'sieht als Absender: 198.51.100.50')}
        </div>`
      : `<div class="kr-vrow">
          ${n('me', '💻 Laptop', '203.0.113.25')}
          <div class="kr-va">→</div>
          ${n('isp', '☁ Provider', 'sieht: Verbindung zu www.example.com (192.0.2.44)')}
          <div class="kr-va">→</div>
          ${n('web', 'Webserver', 'sieht als Absender: 203.0.113.25')}
        </div>`;
  }
  $('#kr-vpn-seg').addEventListener('click', e => { const b = e.target.closest('[data-v]'); if (b) renderVpn(Number(b.dataset.v)); });
  renderVpn(0);

  /* ---------- Zwiebel ---------- */
  const NODES = [
    ['💻 Du', '203.0.113.25'], ['Eintritt', 'Knoten 1'], ['Mitte', 'Knoten 2'], ['Austritt', 'Knoten 3'], ['Webserver', 'www.example.com'],
  ];
  const core = '<span class="kr-core">GET / an www.example.com</span>';
  const wrap = (layers, inner = core) => layers.reduceRight((acc, l) => `<span class="kr-l ${l}">${acc}</span>`, inner);
  // [Position des Pakets, Schichten, Text, was die Knoten wissen]
  const STEPS = [
    [0, [], 'Der Tor-Browser lädt von einem <b>Verzeichnisserver</b> die Liste aller Tor-Knoten und wählt zufällig drei aus.'],
    [0, ['e', 'm', 'a'], 'Der Browser verschlüsselt die Anfrage dreimal: innen für den <b>Austrittsknoten</b>, darum für den <b>Mittelknoten</b>, ganz außen für den <b>Eintrittsknoten</b> – mit je einem eigenen Schlüssel.'],
    [1, ['m', 'a'], 'Der <b>Eintrittsknoten</b> entfernt die äußere Schicht. Er weiß: Das Paket kommt von <code>203.0.113.25</code> und geht weiter an Knoten 2. Was drin steht und wohin es am Ende geht, sieht er nicht.'],
    [2, ['a'], 'Der <b>Mittelknoten</b> entfernt seine Schicht. Er kennt nur Knoten 1 und Knoten 3 – weder dich noch das Ziel.'],
    [3, [], 'Der <b>Austrittsknoten</b> entfernt die letzte Schicht und sieht die Anfrage an <code>www.example.com</code>. Von wem sie stammt, weiß er nicht. Ist die Seite nicht per HTTPS geschützt, kann er den Inhalt lesen!'],
    [4, [], 'Der <b>Webserver</b> bekommt eine ganz normale Anfrage – mit der IP-Adresse des Austrittsknotens als Absender.'],
    [0, [], 'Die Antwort läuft denselben Weg zurück: Jeder Knoten legt wieder eine Schicht darum, und dein Browser entfernt alle drei. <b>Kein einzelner Knoten kennt zugleich dich und dein Ziel.</b>'],
  ];
  const KNOW = [
    [],
    [],
    [[1, 'kennt: dich und Knoten 2']],
    [[1, 'kennt: dich und Knoten 2'], [2, 'kennt: Knoten 1 und 3']],
    [[1, 'kennt: dich und Knoten 2'], [2, 'kennt: Knoten 1 und 3'], [3, 'kennt: Knoten 2 und das Ziel']],
    [[1, 'kennt: dich und Knoten 2'], [2, 'kennt: Knoten 1 und 3'], [3, 'kennt: Knoten 2 und das Ziel'], [4, 'sieht: Knoten 3 als Absender']],
    [[1, 'kennt: dich und Knoten 2'], [2, 'kennt: Knoten 1 und 3'], [3, 'kennt: Knoten 2 und das Ziel'], [4, 'sieht: Knoten 3 als Absender']],
  ];
  DIENSTE.stepper({
    last: STEPS.length - 1, page: 'sec-tor',
    step: $('#kr-onion-step'), go: $('#kr-onion-go'), reset: $('#kr-onion-reset'),
    render(s) {
      const [pos, layers, txt] = STEPS[s];
      const know = Object.fromEntries(KNOW[s]);
      const pkt = s === 0 ? '' : s === STEPS.length - 1 ? `<div class="kr-pkt">${wrap([], '<span class="kr-core">Webseite</span>')}</div>` : `<div class="kr-pkt">${wrap(layers)}</div>`;
      $('#kr-onion').innerHTML = `
        <div class="kr-onion">${NODES.map(([n, sub], i) => `
          <div class="kr-on${i === pos && s > 0 ? ' now' : ''}${i > 0 && i < 4 ? ' relay r' + i : ''}">
            <b>${n}</b><small>${sub}</small>
            ${know[i] ? `<em>${know[i]}</em>` : ''}
            ${i === pos ? pkt : ''}
          </div>`).join('<i class="kr-on-arr">→</i>')}
        </div>
        <div class="legend kr-onion-legend"><span><i class="sw kr-sw-e"></i>Schicht für den Eintritt</span><span><i class="sw kr-sw-m"></i>Schicht für die Mitte</span><span><i class="sw kr-sw-a"></i>Schicht für den Austritt</span></div>`;
      $('#kr-onion-say').innerHTML = `<p><span class="osi-stepno">${s} / ${STEPS.length - 1}</span>${txt}</p>`;
    },
  });

  /* ---------- Wer sieht was? ---------- */
  let mode = 'direct';
  const SUM = {
    direct: 'Ohne Hilfsmittel kennen Provider und Webserver beide deine IP-Adresse und dein Ziel.',
    proxy: 'Der Webserver sieht nur noch den Proxy. Aber der Proxy-Betreiber kennt alles – und dein Provider sieht das Ziel weiterhin, weil die Anfrage an den Proxy es nennt.',
    vpn: 'Dein Provider sieht nur noch den verschlüsselten Tunnel. Dafür kennt der VPN-Anbieter jetzt deine IP-Adresse und dein Ziel – du verschiebst das Vertrauen.',
    tor: 'Keine einzelne Station kennt zugleich deine IP-Adresse und dein Ziel. Dein Provider sieht nur, dass du Tor benutzt.',
  };
  const TIP = { IP: 'deine IP-Adresse', Z: 'dass du www.example.com aufrufst', I: 'den Inhalt (Seite, Passwörter)' };
  function renderWho() {
    const https = $('#kr-who-https').checked;
    $$('#kr-who-seg button').forEach(b => b.classList.toggle('active', b.dataset.w === mode));
    const cell = (v, what) => {
      const s = sees(v, https);
      return `<td class="${s ? 'kr-yes' : 'kr-no'}" title="${s ? 'sieht' : 'sieht nicht'} ${what}">${s ? '👁 ja' : '— nein'}</td>`;
    };
    $('#kr-who').innerHTML = `<thead><tr><th>Wer?</th><th>deine IP-Adresse</th><th>Ziel</th><th>Inhalt</th></tr></thead><tbody>${WHO[mode].map(([n, ip, z, i]) => `
      <tr><th>${n}</th>${cell(ip, TIP.IP)}${cell(z, TIP.Z)}${cell(i, TIP.I)}</tr>`).join('')}</tbody>`;
    const leak = !https && mode !== 'direct' ? ` <b>Ohne HTTPS</b> kann der ${{ proxy: 'Proxy-Betreiber', vpn: 'VPN-Anbieter', tor: 'Austrittsknoten' }[mode]} sogar den Inhalt mitlesen und verändern.` : !https ? ' <b>Ohne HTTPS</b> liest jeder auf dem Weg den Inhalt mit – auch im offenen WLAN.' : '';
    $('#kr-who-txt').innerHTML = SUM[mode] + leak + ' Der Webserver sieht den Inhalt immer – er ist ja der Empfänger.';
  }
  $('#kr-who-seg').addEventListener('click', e => { const b = e.target.closest('[data-w]'); if (b) { mode = b.dataset.w; renderWho(); } });
  $('#kr-who-https').addEventListener('change', renderWho);
  renderWho();
})();
