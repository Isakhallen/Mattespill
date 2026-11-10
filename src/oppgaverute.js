import { erRett, tolkSvar } from './oppgaver.js';
import { tall } from './hjelp.js';

// Ruta som viser en oppgave oppå spillet.
export function lagOppgaverute() {
  const rot = document.createElement('div');
  rot.id = 'oppgave';
  rot.hidden = true;
  rot.innerHTML = `
    <form class="rute" autocomplete="off">
      <div class="topp"></div>
      <div class="tekst"></div>
      <div class="svarlinje">
        <input type="text" inputmode="decimal" aria-label="Svar"><span class="enhet"></span>
      </div>
      <div class="melding"></div>
      <button type="submit"></button>
      <div class="bunn"></div>
    </form>`;
  document.body.append(rot);

  const el = (velg) => rot.querySelector(velg);
  const felt = el('input');
  const knapp = el('button');
  const melding = el('.melding');
  let oppgave = null;
  let taster = {};
  let utfall = null; // 'rett' eller 'feil' når eleven har svart
  let avslutt = null;
  // Hardt mellomrom, så «15 %» ikke deles på to linjer.
  const fast = (tekst) => tekst.replaceAll(' %', ' %');

  // Tastene skal ikke nå spillet mens ruta er åpen.
  rot.addEventListener('keydown', (e) => {
    e.stopPropagation();
    if (taster[e.key]) {
      e.preventDefault();
      avslutt?.(taster[e.key]);
    }
  });
  // Klikk utenfor feltet skal ikke ta bort skrivemerket.
  rot.addEventListener('mousedown', (e) => {
    if (e.target !== felt && e.target !== knapp) e.preventDefault();
  });

  el('form').addEventListener('submit', (e) => {
    e.preventDefault();
    if (utfall) return avslutt?.(utfall);
    if (tolkSvar(felt.value) === null) {
      melding.className = 'melding';
      melding.textContent = 'Skriv et tall.';
      return;
    }
    utfall = erRett(oppgave, felt.value) ? 'rett' : 'feil';
    const enhet = oppgave.enhet ? ' ' + oppgave.enhet : '';
    melding.className = 'melding ' + utfall;
    melding.textContent =
      utfall === 'rett'
        ? 'Riktig!'
        : fast(`Ikke helt. Svaret er ${tall(oppgave.svar)}${enhet}.\n${oppgave.forklaring}`);
    felt.disabled = true;
    knapp.textContent = 'Videre';
    knapp.focus();
  });

  return {
    // Viser en oppgave og venter på eleven. Gir 'rett' eller 'feil',
    // eller verdien fra «taster» (f.eks. { Escape: 'lukk' }).
    spor(ny, { topp = '', bunn = '', taster: t = {} } = {}) {
      oppgave = ny;
      taster = t;
      utfall = null;
      el('.topp').textContent = topp;
      el('.bunn').textContent = bunn;
      el('.tekst').textContent = fast(ny.tekst);
      el('.enhet').textContent = ny.enhet;
      melding.className = 'melding';
      melding.textContent = '';
      knapp.textContent = 'Svar';
      felt.disabled = false;
      felt.value = '';
      rot.hidden = false;
      felt.focus();
      return new Promise((los) => {
        avslutt = los;
      });
    },
    skjul() {
      rot.hidden = true;
      avslutt = null;
    },
  };
}
