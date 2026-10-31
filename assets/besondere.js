/* IPv4 · Station 4 – Besondere Adressen: Adress-Detektor */
'use strict';

(() => {
  const { $, $$ } = UI;
  const input = $('#b-ip');
  const out = $('#b-out');

  function show() {
    const ip = IPv4.parse(input.value);
    if (ip === null) {
      input.classList.toggle('bad', input.value.trim() !== '');
      out.innerHTML = input.value.trim() ? '<p class="err-text">Keine gültige IPv4-Adresse (Format a.b.c.d, jede Zahl 0 – 255).</p>' : '';
      return;
    }
    input.classList.remove('bad');
    const r = IPv4.special(ip);
    const host = r.host
      ? `<p class="b-host yes">✔ Darf einem Gerät zugewiesen werden${r.key === 'priv' ? ' – außer der Netz- und Broadcastadresse des jeweiligen Subnetzes' : ''}.</p>`
      : '<p class="b-host no">✘ Darf keinem Gerät als IP-Adresse gegeben werden.</p>';
    out.innerHTML = `<div class="b-res b-${r.key}">
      <p class="b-name">${r.name}${r.cidr !== '–' ? ` <span class="tag">${r.cidr}</span>` : ''}</p>
      <p>${r.text}</p>${host}</div>`;
  }

  input.addEventListener('input', show);
  $$('[data-b]').forEach(b => b.addEventListener('click', () => { input.value = b.dataset.b; show(); }));
  show();
})();
