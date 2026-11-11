import { nivaa, maksLiv, skadeBonus, beste } from './vekst.js';
import { opplaast } from './kamp.js';
import { figurbilde } from './figur.js';
import { FIENDER } from './fiender.js';
import { folkFor } from './folkeslag.js';

const BOSSER = FIENDER.filter((f) => f.boss);

// Det som står på heltekortet. Uten HTML, så det kan testes med Node.
export function kortet(s) {
  const n = nivaa(s.erfaring);
  return {
    tittel: `${s.navn} · Nivå ${n}`,
    linjer: [
      ['Folk', folkFor(s.folk)?.navn ?? '–'],
      ['Liv', maksLiv(s)],
      ['Ekstra skade', `+${skadeBonus(s)}`],
      ['Våpen', beste(s.utstyr, 'vaapen')?.navn ?? '–'],
      ['Rustning', beste(s.utstyr, 'rustning')?.navn ?? '–'],
      ['Gull', s.gull],
      ['Angrep', opplaast(n, s).filter((a) => s.angrep.includes(a.id)).map((a) => a.navn).join(', ')],
    ],
    merke: s.bosser.length
      ? `★ ${s.bosser.length} av ${BOSSER.length} bosser slått!`
      : 'Ingen boss er slått ennå.',
  };
}

// Heltekortet oppå kartet, til å vise fram. Lukkes med knappen, Enter, Esc eller H.
export function lagHeltekort() {
  const rot = document.createElement('div');
  rot.id = 'kort';
  rot.hidden = true;
  rot.innerHTML = `<div class="rute">
    <div class="topp"></div><div class="bilde"></div><h2></h2>
    <dl></dl><p class="merke"></p>
    <div class="knapper"><button type="button" class="endre">Endre helt</button><button type="button" class="lukk">Lukk</button></div></div>`;
  document.body.append(rot);
  const el = (velg) => rot.querySelector(velg);
  let los = null;
  // vis() gir 'endre' når eleven vil endre helten i heltelaget.
  const lukk = (svar) => {
    rot.hidden = true;
    los?.(svar);
    los = null;
  };
  el('.lukk').addEventListener('click', () => lukk());
  el('.endre').addEventListener('click', () => lukk('endre'));
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
      el('.merke').classList.toggle('slaatt', s.bosser.length > 0);
      rot.hidden = false;
      el('.lukk').focus();
      return new Promise((r) => {
        los = r;
      });
    },
  };
}
