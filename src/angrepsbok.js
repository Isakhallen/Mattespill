import { ANGREP, MAKS_ANGREP, medTall } from './kamp.js';
import { STIGE } from './oppgaver.js';
import { nivaa, skadeBonus } from './vekst.js';
import { merkeFor, merkeLerret } from './merker.js';

// Det angrepet gir, slik det står på knappen og i boka.
export const verdi = (a) => (a.heler ? `+${a.skade} liv` : a.under ?? `${a.skade} skade`);

// Det som står i angrepsboka. Uten HTML, så det kan testes med Node.
// Svakhetene står ikke her heller.
export function boka(s) {
  const n = nivaa(s.erfaring);
  return ANGREP.map((a) => {
    const laast = (a.nivaa ?? 1) > n;
    const m = medTall(a, s.tilpasning.trinn, skadeBonus(s));
    return {
      id: a.id,
      navn: a.navn,
      laast,
      valgt: !laast && s.angrep.includes(a.id),
      merke: merkeFor(a),
      linjer: laast ? [`Nivå ${a.nivaa}`] : [a.om, !a.under && verdi(m), STIGE[m.oppgavetrinn - 1].navn].filter(Boolean),
    };
  });
}

// Tar med eller legger bort et angrep. Høyst MAKS_ANGREP, og alltid minst ett.
export function bytt(valgte, id) {
  if (valgte.includes(id)) return valgte.length > 1 ? valgte.filter((v) => v !== id) : valgte;
  if (valgte.length >= MAKS_ANGREP) return valgte;
  return ANGREP.filter((a) => a.id === id || valgte.includes(a.id)).map((a) => a.id);
}

// Angrepsboka oppå kartet. Klikk på et angrep for å ta det med eller legge det bort.
// Lukkes med knappen, Esc eller B.
export function lagAngrepsbok() {
  const rot = document.createElement('div');
  rot.id = 'bok';
  rot.hidden = true;
  rot.innerHTML = `<div class="rute"><h2>Angrepsboka</h2><p class="telling"></p>
    <div class="sider"></div><button type="button" class="lukk">Lukk</button></div>`;
  document.body.append(rot);
  const el = (velg) => rot.querySelector(velg);
  let los = null;
  let s = null;

  const tegn = (fokus) => {
    el('.telling').textContent = `Ta med opptil ${MAKS_ANGREP} angrep. Valgt: ${s.angrep.length} av ${MAKS_ANGREP}.`;
    el('.sider').replaceChildren(
      ...boka(s).map((a) => {
        const k = document.createElement('button');
        k.type = 'button';
        k.className = 'angrep';
        k.dataset.id = a.id;
        k.disabled = a.laast;
        k.setAttribute('aria-pressed', a.valgt);
        const navn = document.createElement('b');
        navn.textContent = a.navn;
        if (a.merke && !a.laast) navn.append(merkeLerret(a.merke));
        k.append(navn);
        for (const l of a.linjer) {
          const linje = document.createElement('small');
          linje.textContent = l;
          k.append(linje);
        }
        return k;
      }),
    );
    if (fokus) el(`[data-id="${fokus}"]`)?.focus();
  };
  const lukk = () => {
    rot.hidden = true;
    los?.();
    los = null;
  };
  el('.lukk').addEventListener('click', lukk);
  el('.sider').addEventListener('click', (e) => {
    const k = e.target.closest('.angrep');
    if (!k || k.disabled) return;
    const foer = s.angrep;
    s.angrep = bytt(s.angrep, k.dataset.id);
    tegn(k.dataset.id);
    el('.telling').classList.toggle('fullt', foer === s.angrep && !foer.includes(k.dataset.id));
  });
  rot.addEventListener('keydown', (e) => {
    e.stopPropagation(); // tastene skal ikke nå spillet
    if (['Escape', 'b', 'B'].includes(e.key)) lukk();
  });
  rot.addEventListener('mousedown', (e) => !e.target.closest('button') && e.preventDefault());

  return {
    // Viser boka og venter til den lukkes. Valget skrives rett i s.angrep.
    vis(spiller) {
      s = spiller;
      el('.telling').classList.remove('fullt');
      tegn();
      rot.hidden = false;
      el('.lukk').focus();
      return new Promise((r) => {
        los = r;
      });
    },
  };
}
