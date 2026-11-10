// tabell: { prosent: [hele tall som gir pen del] }
const lagFra = (tabell, forklar) => (v) => {
  const p = v(Object.keys(tabell).map(Number));
  const hel = v(tabell[p]);
  const del = (hel * p) / 100;
  return {
    tekst: `Hvor mange prosent er ${del} av ${hel}?`,
    svar: p,
    enhet: '%',
    forklaring: forklar(p, del, hel),
  };
};

const BROK = { 50: 'halvparten', 25: 'en firedel', 10: 'en tidel' };

export default {
  id: 'finnProsent',
  navn: 'Finne prosenten',
  trinn: {
    6: {
      hva: 'Halvparten, firedel og tidel som prosent',
      lag: lagFra(
        {
          50: [2, 4, 10, 20, 40, 60, 80, 100, 200],
          25: [4, 8, 20, 40, 80, 100, 200],
          10: [10, 20, 30, 50, 100, 200],
        },
        (p, del, hel) => `${del} er ${BROK[p]} av ${hel}. Det er ${p} %.`,
      ),
    },
    7: {
      hva: 'Finne 5 %, 20 %, 30 %, 40 %, 60 % og 75 %',
      lag: lagFra(
        {
          5: [20, 40, 200],
          20: [5, 10, 20, 50, 200],
          30: [10, 20, 50, 200],
          40: [5, 10, 20, 50],
          60: [5, 10, 20, 50],
          75: [4, 8, 20, 40, 200],
        },
        (p, del, hel) => `${del} av ${hel} er like mye som ${p} av 100. Det er ${p} %.`,
      ),
    },
  },
};
