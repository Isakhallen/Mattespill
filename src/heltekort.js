import { nivaa, maksLiv, skadeBonus, beste } from './vekst.js';
import { opplaast } from './kamp.js';
import { figurbilde } from './figur.js';

// Det som står på heltekortet. Uten HTML, så det kan testes med Node.
export function kortet(s) {
  const n = nivaa(s.erfaring);
  const ganger = s.seire === 1 ? 'én gang' : `${s.seire} ganger`;
  return {
    tittel: `${s.navn} · Nivå ${n}`,
    linjer: [
      ['Liv', maksLiv(s)],
      ['Ekstra skade', `+${skadeBonus(s)}`],
      ['Våpen', beste(s.utstyr, 'vaapen')?.navn ?? '–'],
      ['Rustning', beste(s.utstyr, 'rustning')?.navn ?? '–'],
      ['Angrep', opplaast(n).filter((a) => s.angrep.includes(a.id)).map((a) => a.navn).join(', ')],
    ],
    merke: s.seire ? `★ Slo Tallslukeren ${ganger}!` : 'Tallslukeren er ikke slått ennå.',
  };
}

// Heltekortet oppå kartet, til å vise fram. Lukkes med knappen, Enter, Esc eller H.
export function lagHeltekort() {
  const rot = document.createElement('div');
  rot.id = 'kort';
  rot.hidden = true;
  rot.innerHTML = `<div class="rute">
    <div class="topp"></div><div class="bilde"></div><h2></h2>
    <dl></dl><p class="merke"></p><button type="button">Lukk</button></div>`;
  document.body.append(rot);
  const el = (velg) => rot.querySelector(velg);
  let los = null;
  const lukk = () => {
    rot.hidden = true;
    los?.();
    los = null;
  };
  el('button').addEventListener('click', lukk);
  rot.addEventListener('keydown', (e) => {
    e.stopPropagation(); // tastene skal ikke nå spillet
    if (['Escape', 'h', 'H'].includes(e.key)) lukk();
  });
  rot.addEventListener('mousedown', (e) => !e.target.closest('button') && e.preventDefault());

  return {
    // Viser kortet og venter til det lukkes. «topp» er en linje over bildet.
    vis(scene, s, topp = '') {
      const k = kortet(s);
      el('.topp').textContent = topp;
      el('.bilde').replaceChildren(figurbilde(scene, s.figur, 6));
      el('h2').textContent = k.tittel;
      el('dl').replaceChildren(
        ...k.linjer.flatMap(([navn, verdi]) => {
          const dt = document.createElement('dt');
          const dd = document.createElement('dd');
          dt.textContent = navn;
          dd.textContent = verdi;
          return [dt, dd];
        }),
      );
      el('.merke').textContent = k.merke;
      el('.merke').classList.toggle('slaatt', s.seire > 0);
      rot.hidden = false;
      el('button').focus();
      return new Promise((r) => {
        los = r;
      });
    },
  };
}
