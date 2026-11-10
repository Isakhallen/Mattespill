// [fra, til] i prosent. Alle gir hel prosent når endringen regnes av «fra».
const PAR = [
  [20, 25], [20, 30], [10, 15], [10, 12], [40, 50], [50, 60], [25, 50], [10, 20], [20, 22],
  [50, 55], [40, 60], [50, 25], [20, 10], [40, 30], [50, 40], [10, 9], [20, 15], [40, 20], [80, 60],
];

export default {
  id: 'prosentpoeng',
  navn: 'Prosentpoeng',
  trinn: {
    12: {
      hva: 'Skille mellom prosentpoeng og prosent',
      lag(v) {
        const [fra, til] = v(PAR);
        const opp = til > fra;
        const d = Math.abs(til - fra);
        const p = (d * 100) / fra;
        const poeng = v([true, false]);
        return {
          tekst: `Treffsjansen går fra ${fra} % til ${til} %. Hvor mange ${poeng ? 'prosentpoeng' : 'prosent'} går den ${opp ? 'opp' : 'ned'}?`,
          svar: poeng ? d : p,
          enhet: poeng ? 'prosentpoeng' : '%',
          forklaring: poeng
            ? `${Math.max(fra, til)} − ${Math.min(fra, til)} = ${d} prosentpoeng.`
            : `Endringen er ${d}. ${d} av ${fra} er ${p} %.`,
        };
      },
    },
  },
};
