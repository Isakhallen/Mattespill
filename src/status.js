import { nivaa, grense, maksLiv, MAKS_NIVAA } from './vekst.js';

// Statuslinja øverst på kartet: nivå, liv, erfaring og knappen «Ny helt».
export function lagStatus(nyHelt) {
  const rot = document.createElement('div');
  rot.id = 'status';
  const maaler = (navn) => `
    <span class="${navn}"><b>${navn === 'liv' ? 'Liv' : 'Erfaring'}</b>
      <span class="maaler"><i></i></span><span class="tall"></span></span>`;
  rot.innerHTML = `<span class="nivaa"></span>${maaler('liv')}${maaler('xp')}
    <button type="button" class="nyhelt">Ny helt</button>`;
  rot.querySelector('.nyhelt').addEventListener('click', (e) => {
    e.currentTarget.blur(); // ellers kan mellomrom trykke den igjen
    nyHelt();
  });
  document.body.append(rot);
  const el = (velg) => rot.querySelector(velg);
  const fyll = (navn, del, hel) => {
    el(`.${navn} i`).style.width = (100 * Math.min(del, hel)) / hel + '%';
    el(`.${navn} .tall`).textContent = `${del} / ${hel}`;
  };

  return {
    vis(s) {
      const n = nivaa(s.erfaring);
      el('.nivaa').textContent = `${s.navn} · Nivå ${n}`;
      fyll('liv', s.liv, maksLiv(s));
      // Erfaringen vises fra starten av nivået til neste nivå.
      if (n < MAKS_NIVAA) fyll('xp', s.erfaring - grense(n), grense(n + 1) - grense(n));
      else fyll('xp', 1, 1);
    },
  };
}
