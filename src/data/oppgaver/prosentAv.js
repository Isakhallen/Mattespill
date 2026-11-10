import { tall } from '../../hjelp.js';

function forklar(p, n) {
  const s = tall((n * p) / 100);
  const ti = n / 10;
  switch (p) {
    case 50: return `50 % er halvparten. ${n} : 2 = ${s}.`;
    case 10: return `10 % er en tidel. ${n} : 10 = ${s}.`;
    case 25: return `25 % er en firedel. ${n} : 4 = ${s}.`;
    case 20: return `20 % er en femdel. ${n} : 5 = ${s}.`;
    case 1: return `1 % er en hundredel. ${n} : 100 = ${s}.`;
    case 5: return `10 % er ${tall(ti)}. 5 % er halvparten av det: ${s}.`;
    case 15: return `10 % er ${tall(ti)} og 5 % er ${tall(ti / 2)}. Til sammen ${s}.`;
    case 75: return `25 % er ${tall(n / 4)}. 75 % er 3 · ${tall(n / 4)} = ${s}.`;
    default: return `10 % er ${tall(ti)}. ${p} % er ${p / 10} · ${tall(ti)} = ${s}.`;
  }
}

// tabell: { prosent: [tall som gir pent svar] }
const lagFra = (tabell) => (v) => {
  const p = v(Object.keys(tabell).map(Number));
  const n = v(tabell[p]);
  return { tekst: `Hva er ${p} % av ${n}?`, svar: (n * p) / 100, forklaring: forklar(p, n) };
};

export default {
  id: 'prosentAv',
  navn: 'Prosent av et tall',
  trinn: {
    3: {
      hva: '50 % og 10 % av et tall',
      lag: lagFra({
        50: [10, 20, 30, 40, 60, 80, 100, 120, 200, 300, 500],
        10: [10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 200, 300, 500],
      }),
    },
    4: {
      hva: '25 %, 20 % og 1 % av et tall',
      lag: lagFra({
        25: [8, 12, 20, 40, 60, 80, 100, 200, 400],
        20: [10, 20, 30, 40, 50, 100, 200, 500],
        1: [100, 200, 300, 500, 700, 1000],
      }),
    },
    5: {
      hva: '5 %, 15 %, 30 %, 40 %, 60 % og 75 % av et tall',
      lag: lagFra({
        5: [20, 40, 60, 80, 100, 200, 300],
        15: [20, 40, 60, 100, 200],
        30: [10, 20, 30, 50, 100, 200],
        40: [10, 20, 50, 100, 200],
        60: [10, 20, 50, 100],
        75: [4, 8, 20, 40, 80, 100, 200],
      }),
    },
  },
};
