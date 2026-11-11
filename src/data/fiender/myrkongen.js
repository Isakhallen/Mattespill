// Bossen i Sumpen. «skjold»: slimet gjør at lette slag bare gir 1 skade.
export default {
  id: 'myrkongen',
  tegn: 'K',
  navn: 'Myrkongen',
  bestemt: 'Myrkongen',
  figur: 'big_zombie',
  farge: 0xb0e090,
  liv: 100,
  skade: 5,
  erfaring: 60,
  gull: 70,
  boss: true,
  skjold: true,
  svak: ['ild', 'lyn'],
  sterk: ['gift', 'is'],
  foer: [
    '«Blubb! Alt som kommer hit, synker ned i myra!»',
    'Myrkongen er dekket av tykt slim. Lette slag sklir av.',
  ],
  igjen: ['Myrkongen bobler. «Blubb!»'],
  etter: [
    'Myrkongen synker ned i myra med et stort «blubb».',
    'Sumpen er trygg igjen!',
  ],
};
