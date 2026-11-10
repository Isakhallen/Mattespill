// Deler av et tall, uten prosenttegn.
export default {
  id: 'del',
  navn: 'Del av et tall',
  trinn: {
    1: {
      hva: 'Halvparten av et tall',
      lag(v) {
        const n = v([4, 6, 8, 10, 12, 14, 16, 18, 20, 30, 40, 50, 60, 80, 100, 200]);
        return {
          tekst: `Hva er halvparten av ${n}?`,
          svar: n / 2,
          forklaring: `${n / 2} + ${n / 2} = ${n}. Halvparten er ${n / 2}.`,
        };
      },
    },
    2: {
      hva: 'En firedel og en tidel av et tall',
      lag(v) {
        const [navn, deler, liste] = v([
          ['en firedel', 4, [4, 8, 12, 20, 40, 80, 100, 200]],
          ['en tidel', 10, [10, 20, 30, 50, 70, 100, 200, 500]],
        ]);
        const n = v(liste);
        return {
          tekst: `Hva er ${navn} av ${n}?`,
          svar: n / deler,
          forklaring: `Del på ${deler}. ${n} : ${deler} = ${n / deler}.`,
        };
      },
    },
  },
};
