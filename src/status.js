import { nivaa, grense, maksLiv, MAKS_NIVAA } from './vekst.js';

// Statuslinja øverst på kartet: nivå, liv, erfaring, gull og knappene.
// knapper: { kort, bok, klassen, lyd, nyHelt }. «lyd» bytter lyden og gir true hvis den er på.
export function lagStatus(knapper, lydPaa) {
  const rot = document.createElement('div');
  rot.id = 'status';
  const maaler = (navn) => `
    <span class="${navn}"><b>${navn === 'liv' ? 'Liv' : 'Erfaring'}</b>
      <span class="maaler"><i></i></span><span class="tall"></span></span>`;
  rot.innerHTML = `<span class="nivaa"></span>${maaler('liv')}${maaler('xp')}
    <span class="gull"><b>Gull</b><span class="sum"></span></span>
    <button type="button" class="kort">Heltekort</button>
    <button type="button" class="bok">Angrep</button>
    <button type="button" class="klassen">Klassen</button>
    <button type="button" class="lyd"></button>
    <button type="button" class="nyHelt">Ny helt</button>`;
  const el = (velg) => rot.querySelector(velg);
  const lydtekst = (paa) => (el('.lyd').textContent = paa ? 'Lyd: på' : 'Lyd: av');
  lydtekst(lydPaa);
  for (const [navn, gjor] of Object.entries(knapper)) {
    el(`.${navn}`).addEventListener('click', (e) => {
      e.currentTarget.blur(); // ellers kan mellomrom trykke den igjen
      const svar = gjor();
      if (navn === 'lyd') lydtekst(svar);
    });
  }
  document.body.append(rot);
  const fyll = (navn, del, hel) => {
    el(`.${navn} i`).style.width = (100 * Math.min(del, hel)) / hel + '%';
    el(`.${navn} .tall`).textContent = `${del} / ${hel}`;
  };

  return {
    // Klassekoden på knappen, eller bare «Klassen» når eleven spiller alene.
    klassen(kode) {
      el('.klassen').textContent = kode ? `Klassen: ${kode}` : 'Klassen';
    },
    vis(s) {
      const n = nivaa(s.erfaring);
      el('.nivaa').textContent = `${s.navn} · Nivå ${n}`;
      fyll('liv', s.liv, maksLiv(s));
      el('.gull .sum').textContent = s.gull;
      // Erfaringen vises fra starten av nivået til neste nivå.
      if (n < MAKS_NIVAA) fyll('xp', s.erfaring - grense(n), grense(n + 1) - grense(n));
      else fyll('xp', 1, 1);
    },
  };
}
