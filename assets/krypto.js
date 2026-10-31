/* Verschlüsselung & Anonymität · Stationen 1–2: Caesar, XOR/One-Time-Pad, Schlüsselpaare, Mini-RSA, Signatur */
'use strict';

// Rechenkern, auch fürs Sicherheits-Dojo
const KRYPTO = (() => {
  const caesar = (s, k) => s.replace(/[a-z]/gi, ch => {
    const base = ch <= 'Z' ? 65 : 97;
    return String.fromCharCode((ch.charCodeAt(0) - base + ((k % 26) + 26)) % 26 + base);
  });
  const xor = (a, b) => [...a].map((x, i) => (x === b[i] ? '0' : '1')).join('');
  const bin8 = n => n.toString(2).padStart(8, '0');
  const gcd = (a, b) => (b ? gcd(b, a % b) : a);
  function modInv(e, m) {
    let [r0, r1, t0, t1] = [m, e, 0, 1];
    while (r1) { const q = Math.floor(r0 / r1); [r0, r1] = [r1, r0 - q * r1]; [t0, t1] = [t1, t0 - q * t1]; }
    return r0 === 1 ? ((t0 % m) + m) % m : null;
  }
  const modPow = (b, e, m) => {
    let r = 1n, x = BigInt(b) % BigInt(m), k = BigInt(e);
    const M = BigInt(m);
    while (k > 0n) { if (k & 1n) r = r * x % M; x = x * x % M; k >>= 1n; }
    return Number(r);
  };
  // Kleinstes e ≥ 3, das zu φ teilerfremd ist
  const pickE = phi => { for (let e = 3; e < phi; e += 2) if (gcd(e, phi) === 1) return e; return null; };
  function rsa(p, q) {
    const n = p * q, phi = (p - 1) * (q - 1), e = pickE(phi);
    return { p, q, n, phi, e, d: modInv(e, phi) };
  }
  const PRIMES = [3, 5, 7, 11, 13, 17, 19, 23, 29, 31];
  return { caesar, xor, bin8, gcd, modInv, modPow, rsa, PRIMES };
})();

(() => {
  const { $, $$, esc } = UI;
  const { caesar, xor, bin8, modPow, rsa, PRIMES } = KRYPTO;
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const ABC = 'abcdefghijklmnopqrstuvwxyz';

  /* ---------- Caesar ---------- */
  function renderCaesar() {
    const k = Number($('#kr-c-k').value);
    $('#kr-c-k-out').textContent = k;
    $('#kr-c-alpha').innerHTML = `
      <div class="kr-row"><small>Klartext</small>${[...ABC].map(c => `<span>${c}</span>`).join('')}</div>
      <div class="kr-row ci"><small>Geheimtext</small>${[...ABC].map(c => `<span>${caesar(c, k).toUpperCase()}</span>`).join('')}</div>`;
    $('#kr-c-out').textContent = caesar($('#kr-c-in').value, k).toUpperCase() || '–';
  }
  $('#kr-c-in').addEventListener('input', renderCaesar);
  $('#kr-c-k').addEventListener('input', renderCaesar);
  renderCaesar();

  /* ---------- Caesar knacken ---------- */
  (function crack() {
    const el = $('#kr-crack');
    const TEXTS = [
      'Morgen treffen wir uns um sieben Uhr hinter der Sporthalle neben dem roten Fahrrad.',
      'Die Netzwerkkarte sendet einen Frame an den Switch, der ihn an den richtigen Port weiterleitet.',
      'Jede Nachricht wird verschluesselt, bevor sie ueber das Internet geschickt wird.',
      'Ein guter Schluessel ist lang, zufaellig und wird niemals an andere weitergegeben.',
      'Wer diesen Text lesen kann, hat den Schluessel gefunden. Herzlichen Glueckwunsch!',
      'Der Router verbindet verschiedene Netze und entscheidet anhand der Zieladresse den Weg.',
    ];
    let plain, key, solved;
    function task() {
      const prev = plain;
      do plain = pick(TEXTS); while (plain === prev);
      key = 3 + Math.floor(Math.random() * 21);
      solved = false;
      const cipher = caesar(plain, key).toUpperCase();
      const cnt = Object.fromEntries([...ABC].map(c => [c, 0]));
      for (const ch of cipher.toLowerCase()) if (cnt[ch] != null) cnt[ch]++;
      const max = Math.max(...Object.values(cnt));
      el.innerHTML = `
        <div class="kr-out"><small>Abgefangener Geheimtext</small><code>${esc(cipher)}</code></div>
        <h3 class="kr-h3">Häufigkeit der Buchstaben im Geheimtext</h3>
        <div class="kr-freq">${[...ABC].map(c => `<div class="${cnt[c] === max ? 'top' : ''}"><i style="height:${cnt[c] / max * 100}%"></i><span>${c.toUpperCase()}</span><small>${cnt[c] || ''}</small></div>`).join('')}</div>
        <label class="field field-range kr-try"><span>Schlüssel ausprobieren <output>0</output></span><input type="range" min="0" max="25" value="0"></label>
        <div class="kr-out kr-try-out"><small>Entschlüsselt mit diesem Schlüssel</small><code></code></div>
        <div class="osi-pz-fb" aria-live="polite"></div>
        <div class="row-actions">
          <button type="button" class="btn" data-act="new">Neue Nachricht</button>
          <button type="button" class="btn ghost" data-act="hint">Tipp</button>
          <button type="button" class="btn ghost" data-act="solve">Lösung zeigen</button>
        </div>`;
      tryKey();
    }
    function tryKey() {
      const r = $('.kr-try input', el);
      const k = Number(r.value);
      $('.kr-try output', el).textContent = k;
      $('.kr-try-out code', el).textContent = caesar(caesar(plain, key), -k).toUpperCase();
      const fb = $('.osi-pz-fb', el);
      if (k === key && !solved) {
        solved = true;
        fb.innerHTML = `<p class="osi-pz-done">Geknackt! Der Schlüssel ist ${key}.</p>`;
        FX.burstFrom(fb.firstChild);
      } else if (k !== key) {
        solved = false;
        fb.innerHTML = '';
      }
    }
    el.addEventListener('input', e => { if (e.target.matches('.kr-try input')) tryKey(); });
    el.addEventListener('click', e => {
      const act = e.target.closest('[data-act]')?.dataset.act;
      if (act === 'new') task();
      if (act === 'hint') {
        const top = $('.kr-freq .top span', el).textContent;
        $('.osi-pz-fb', el).innerHTML = `<p>Der häufigste Buchstabe im Geheimtext ist <b>${top}</b>. Wenn er für ein <b>E</b> steht: Wie viele Stellen liegen zwischen E und ${top}?</p>`;
      }
      if (act === 'solve') { $('.kr-try input', el).value = key; tryKey(); }
    });
    task();
  })();

  /* ---------- XOR ---------- */
  let xKey = '11001011100';
  const xPlain = '10101010101';
  function renderXor() {
    const c = xor(xPlain, xKey);
    const row = (lbl, bits, cls = '', click = false) => `<div class="kr-brow ${cls}"><small>${lbl}</small>${[...bits].map((b, i) => `<span class="b${b}"${click ? ` data-i="${i}" role="button" tabindex="0"` : ''}>${b}</span>`).join('')}</div>`;
    $('#kr-xor').innerHTML = `<div class="kr-bits">
      ${row('Klartext', xPlain)}
      ${row('⊕ Schlüssel', xKey, 'key', true)}
      ${row('= Geheimtext', c, 'ci')}
      ${row('⊕ Schlüssel', xKey, 'key', true)}
      ${row('= Klartext', xor(c, xKey), 'ok')}
    </div>`;
  }
  $('#kr-xor').addEventListener('click', e => {
    const s = e.target.closest('[data-i]');
    if (!s) return;
    const i = Number(s.dataset.i);
    xKey = xKey.slice(0, i) + (xKey[i] === '1' ? '0' : '1') + xKey.slice(i + 1);
    renderXor();
  });
  $('#kr-xor').addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[data-i]')) { e.preventDefault(); e.target.click(); } });
  renderXor();

  /* ---------- One-Time-Pad mit einem Wort ---------- */
  let otpKey = [];
  const newKey = () => { otpKey = Array.from({ length: 6 }, () => Math.floor(Math.random() * 256)); };
  function renderOtp() {
    const chars = [...$('#kr-otp-in').value.slice(0, 6)].map(c => (c.charCodeAt(0) < 128 ? c : '?'));
    if (!chars.length) { $('#kr-otp').innerHTML = '<tbody><tr><td class="muted">Gib ein Wort ein.</td></tr></tbody>'; return; }
    const cols = chars.map((ch, i) => {
      const p = bin8(ch.charCodeAt(0)), k = bin8(otpKey[i]), c = xor(p, k);
      return { ch, p, k, c, back: String.fromCharCode(parseInt(xor(c, k), 2)) };
    });
    const tr = (lbl, f, cls = '') => `<tr class="${cls}"><th>${lbl}</th>${cols.map(c => `<td>${f(c)}</td>`).join('')}</tr>`;
    $('#kr-otp').innerHTML = `<tbody>
      ${tr('Zeichen', c => `<b>${esc(c.ch === ' ' ? '␣' : c.ch)}</b>`)}
      ${tr('ASCII-Bits', c => `<code>${c.p}</code>`)}
      ${tr('⊕ Schlüssel', c => `<code>${c.k}</code>`, 'key')}
      ${tr('= Geheimtext', c => `<code>${c.c}</code>`, 'ci')}
      ${tr('⊕ Schlüssel → zurück', c => `<b>${esc(c.back === ' ' ? '␣' : c.back)}</b>`, 'ok')}
    </tbody>`;
  }
  newKey();
  $('#kr-otp-in').addEventListener('input', renderOtp);
  $('#kr-otp-new').addEventListener('click', () => { newKey(); renderOtp(); });
  renderOtp();

  /* ---------- Schlüsselanzahl ---------- */
  function renderN() {
    const n = Number($('#kr-n').value);
    $('#kr-n-out').textContent = n;
    const sym = n * (n - 1) / 2;
    $('#kr-n-res').innerHTML = `<p><b>Symmetrisch:</b> n · (n − 1) / 2 = ${n} · ${n - 1} / 2 = <b>${DIENSTE.fmt(sym)} Schlüssel</b>, jeder davon vorher geheim ausgetauscht.<br><b>Asymmetrisch:</b> jede Person ein Schlüsselpaar = <b>${n} Paare</b>. Die öffentlichen Schlüssel dürfen alle sehen.</p>`;
  }
  $('#kr-n').addEventListener('input', renderN);
  renderN();

  /* ---------- Welcher Schlüssel wofür? ---------- */
  const KEYS = {
    'bob-pub': { ok: true, read: ['Bob'], title: 'Verschlüsseln für Bob – richtig!', txt: 'Nur Bob besitzt den passenden privaten Schlüssel. Eve sieht nur Zeichensalat – und Alice selbst kann es übrigens auch nicht mehr öffnen. Das sorgt für <b>Vertraulichkeit</b>.' },
    'bob-priv': { ok: false, read: [], title: 'Geht nicht', txt: 'Bobs privaten Schlüssel hat Alice gar nicht – den kennt nur Bob. Wäre das anders, wäre Bobs ganze Sicherheit dahin.' },
    'alice-pub': { ok: false, read: ['Alice'], title: 'Sinnlos', txt: 'Öffnen könnte das nur, wer Alices privaten Schlüssel hat – also Alice selbst. Bob kann es nicht lesen. (Zum Verschlüsseln eigener Dateien wäre das in Ordnung.)' },
    'alice-priv': { ok: true, read: ['Alice', 'Eve', 'Bob'], title: 'Das ist eine Signatur', txt: 'Jeder kann es mit Alices öffentlichem Schlüssel öffnen – auch Eve. Geheim ist es also nicht. Aber es beweist: Das kann <b>nur von Alice</b> stammen. Das sorgt für <b>Authentizität</b>. In der Praxis signiert man nur den Hashwert des Dokuments.' },
  };
  function renderKeys(k) {
    const r = KEYS[k];
    $$('#kr-keys button').forEach(b => b.classList.toggle('active', b.dataset.k === k));
    $('#kr-keys-out').innerHTML = `
      <div class="kr-actors">${['Alice', 'Eve', 'Bob'].map(a => `<div class="kr-actor${r.read.includes(a) ? ' yes' : ''}"><b>${a === 'Eve' ? '🕵 Eve' : a === 'Alice' ? '👩 Alice' : '👨 Bob'}</b><span>${r.read.includes(a) ? '✔ kann es lesen' : '✘ kann es nicht lesen'}</span></div>`).join('')}</div>
      <p class="b-res ${r.ok ? 'b-priv' : 'b-apipa'}"><b>${r.title}.</b> ${r.txt}</p>`;
  }
  $('#kr-keys').addEventListener('click', e => { const b = e.target.closest('[data-k]'); if (b) renderKeys(b.dataset.k); });
  renderKeys('bob-pub');

  /* ---------- Mini-RSA ---------- */
  const opts = PRIMES.map(p => `<option>${p}</option>`).join('');
  $('#kr-p').innerHTML = opts;
  $('#kr-q').innerHTML = opts;
  $('#kr-p').value = '5';
  $('#kr-q').value = '11';
  function renderRsa() {
    const p = Number($('#kr-p').value), q = Number($('#kr-q').value);
    const out = $('#kr-rsa');
    if (p === q) { out.innerHTML = '<p class="field-fb">p und q müssen verschiedene Primzahlen sein.</p>'; return; }
    const k = rsa(p, q);
    const mi = $('#kr-m');
    const m = Number(mi.value);
    const okM = mi.value !== '' && Number.isInteger(m) && m >= 0 && m < k.n;
    mi.classList.toggle('bad', !okM);
    const c = okM ? modPow(m, k.e, k.n) : null;
    out.innerHTML = `
      <ol class="kr-steps">
        <li>n = p · q = ${p} · ${q} = <b>${k.n}</b></li>
        <li>φ(n) = (p − 1) · (q − 1) = ${p - 1} · ${q - 1} = <b>${k.phi}</b></li>
        <li>e wählen, teilerfremd zu ${k.phi}: <b>e = ${k.e}</b></li>
        <li>d so wählen, dass e · d bei Division durch ${k.phi} den Rest 1 lässt: <b>d = ${k.d}</b> (${k.e} · ${k.d} = ${k.e * k.d} = ${Math.floor(k.e * k.d / k.phi)} · ${k.phi} + 1)</li>
      </ol>
      <div class="two-col kr-rsa-keys">
        <div class="mini-card kr-pub"><h3>🔓 Öffentlicher Schlüssel</h3><p><code>(e, n) = (${k.e}, ${k.n})</code></p></div>
        <div class="mini-card kr-priv"><h3>🔐 Privater Schlüssel</h3><p><code>(d, n) = (${k.d}, ${k.n})</code> – p, q und φ werden danach vernichtet</p></div>
      </div>
      ${okM ? `<div class="kr-rsa-run">
        <p><b>Verschlüsseln</b> mit dem öffentlichen Schlüssel: c = m<sup>e</sup> mod n = ${m}<sup>${k.e}</sup> mod ${k.n} = <b class="kr-c">${c}</b></p>
        <p><b>Entschlüsseln</b> mit dem privaten Schlüssel: m = c<sup>d</sup> mod n = ${c}<sup>${k.d}</sup> mod ${k.n} = <b class="kr-m">${modPow(c, k.d, k.n)}</b> ✔</p>
      </div>` : `<p class="field-fb">Die Nachricht m muss eine ganze Zahl von 0 bis ${k.n - 1} sein.</p>`}`;
  }
  ['#kr-p', '#kr-q', '#kr-m'].forEach(s => $(s).addEventListener('input', renderRsa));
  renderRsa();

  /* ---------- Signatur ---------- */
  // Vereinfachter 32-Bit-Hash (FNV-1a) – echte Signaturen nutzen SHA-256
  const hash = s => {
    let h = 0x811c9dc5;
    for (const ch of new TextEncoder().encode(s)) { h ^= ch; h = Math.imul(h, 0x01000193) >>> 0; }
    return h.toString(16).padStart(8, '0').toUpperCase();
  };
  let signed = null;
  function renderSig() {
    const doc = $('#kr-doc').value;
    const h = hash(doc);
    const out = $('#kr-sig');
    if (!signed) {
      out.innerHTML = `<div class="kr-sigrow"><span><small>Hashwert des Dokuments</small><code>${h}</code></span><span class="muted">noch keine Signatur</span></div>`;
      return;
    }
    const ok = h === signed;
    out.innerHTML = `
      <div class="kr-sigrow">
        <span><small>Signatur (mit Alices privatem Schlüssel)</small><code>🔐 ${signed}</code></span>
        <span><small>mit Alices öffentlichem Schlüssel geöffnet</small><code>${signed}</code></span>
        <span><small>Hashwert des Dokuments jetzt</small><code>${h}</code></span>
      </div>
      <p class="b-res ${ok ? 'b-priv' : 'b-apipa'}">${ok
        ? '<b>Signatur gültig.</b> Die beiden Hashwerte stimmen überein: Das Dokument stammt von Alice und wurde nicht verändert. Ändere ein Zeichen und schau, was passiert!'
        : '<b>Signatur ungültig!</b> Das Dokument wurde nach dem Signieren verändert – schon ein einziges Zeichen ergibt einen völlig anderen Hashwert. Ohne Alices privaten Schlüssel kann niemand eine neue, passende Signatur erzeugen.'}</p>`;
  }
  $('#kr-doc').addEventListener('input', renderSig);
  $('#kr-sign').addEventListener('click', () => { signed = hash($('#kr-doc').value); renderSig(); });
  $('#kr-unsign').addEventListener('click', () => { signed = null; renderSig(); });
  renderSig();
})();
