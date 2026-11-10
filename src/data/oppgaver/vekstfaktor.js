import { tall } from '../../hjelp.js';
import { TING } from './endring.js';

const faktor = (p, opp) => (opp ? 100 + p : 100 - p) / 100;

const tilProsent = (v) => {
  const p = v([5, 10, 15, 20, 25, 30, 40, 50]);
  const opp = v([true, false]);
  const f = tall(faktor(p, opp));
  return {
    tekst: `Vekstfaktoren er ${f}. Hvor mange prosent går det ${opp ? 'opp' : 'ned'}?`,
    svar: p,
    enhet: '%',
    forklaring: `${f} = ${opp ? 100 + p : 100 - p} %. Det er ${p} % ${opp ? 'mer' : 'mindre'} enn 100 %.`,
  };
};

const bruk = (v) => {
  const tabell = {
    10: [100, 200, 300, 500],
    20: [50, 100, 200, 500],
    25: [40, 80, 200, 400],
    50: [20, 40, 100, 200],
  };
  const p = v(Object.keys(tabell).map(Number));
  const n = v(tabell[p]);
  const opp = v([true, false]);
  const f = tall(faktor(p, opp));
  const ny = (n * (opp ? 100 + p : 100 - p)) / 100;
  return {
    tekst: `${v(TING)} koster ${n} gull. Vekstfaktoren er ${f}. Hva blir prisen?`,
    svar: ny,
    enhet: 'gull',
    forklaring: `${n} · ${f} = ${tall(ny)}.`,
  };
};

export default {
  id: 'vekstfaktor',
  navn: 'Vekstfaktor',
  trinn: {
    10: {
      hva: 'Fra prosent til vekstfaktor',
      lag(v) {
        const p = v([5, 10, 15, 20, 25, 30, 40, 50, 75]);
        const opp = v([true, false]);
        const f = faktor(p, opp);
        return {
          tekst: `Prisen går ${opp ? 'opp' : 'ned'} ${p} %. Hva er vekstfaktoren?`,
          svar: f,
          forklaring: `100 % ${opp ? '+' : '−'} ${p} % = ${opp ? 100 + p : 100 - p} % = ${tall(f)}.`,
        };
      },
    },
    11: {
      hva: 'Fra vekstfaktor til prosent, og regne ny pris med vekstfaktor',
      lag: (v) => v([tilProsent, bruk])(v),
    },
  },
};
