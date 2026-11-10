import { tall } from '../../hjelp.js';

export const TING = ['Et sverd', 'Et skjold', 'En hjelm', 'En bue', 'En ring', 'En stav'];

// Ny pris. tabell: { prosent: [priser som gir pent svar] }
const nyPris = (tabell) => (v) => {
  const p = v(Object.keys(tabell).map(Number));
  const n = v(tabell[p]);
  const opp = v([true, false]);
  const d = (n * p) / 100;
  const ny = opp ? n + d : n - d;
  return {
    tekst: `${v(TING)} koster ${n} gull. Prisen går ${opp ? 'opp' : 'ned'} ${p} %. Hva blir prisen?`,
    svar: ny,
    enhet: 'gull',
    forklaring: `${p} % av ${n} er ${tall(d)}. ${n} ${opp ? '+' : '−'} ${tall(d)} = ${tall(ny)}.`,
  };
};

// Finn hvor mange prosent prisen endret seg.
const finnEndring = (v) => {
  const tabell = {
    10: [100, 200, 300, 500],
    20: [50, 100, 200, 500],
    25: [40, 80, 100, 200, 400],
    50: [20, 40, 100, 200, 400],
  };
  const p = v(Object.keys(tabell).map(Number));
  const n = v(tabell[p]);
  const opp = v([true, false]);
  const d = (n * p) / 100;
  const ny = opp ? n + d : n - d;
  return {
    tekst: `${v(TING)} koster ${n} gull. Prisen går ${opp ? 'opp' : 'ned'} til ${ny} gull. Hvor mange prosent er det?`,
    svar: p,
    enhet: '%',
    forklaring: `Endringen er ${d} gull. ${d} av ${n} er ${p} %.`,
  };
};

const vanskeligPris = nyPris({
  5: [100, 200, 400],
  15: [100, 200, 400],
  20: [50, 100, 150, 200, 300, 500],
  30: [50, 100, 200, 300],
  40: [50, 100, 200],
});

export default {
  id: 'endring',
  navn: 'Økning og nedgang',
  trinn: {
    8: {
      hva: 'Ny pris når den går opp eller ned 10 %, 25 % eller 50 %',
      lag: nyPris({
        10: [50, 100, 200, 300, 400, 500],
        25: [40, 80, 100, 200, 400],
        50: [20, 40, 60, 80, 100, 200, 400],
      }),
    },
    9: {
      hva: 'Ny pris med 5 %, 15 %, 20 %, 30 % og 40 %, og finne endringen i prosent',
      lag: (v) => v([vanskeligPris, vanskeligPris, finnEndring])(v),
    },
  },
};
