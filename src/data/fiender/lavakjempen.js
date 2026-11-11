// Den siste bossen, i Lavagrotta. «skjold»: lette slag smelter og gir bare 1 skade.
export default {
  id: 'lavakjempen',
  tegn: 'L',
  navn: 'Lavakjempen',
  bestemt: 'Lavakjempen',
  figur: 'big_zombie',
  farge: 0xff7050,
  liv: 105,
  skade: 5,
  erfaring: 80,
  gull: 100,
  boss: true,
  skjold: true,
  svak: ['is', 'lyn'],
  sterk: ['ild', 'jord'],
  foer: [
    '«Ingen har kommet så langt før. Og ingen kommer lenger!»',
    'Lavakjempen gløder. Lette slag smelter før de treffer.',
  ],
  igjen: ['Lavakjempen bobler av sinne.'],
  etter: [
    'Lavakjempen stivner til svart stein.',
    'Alle områdene er trygge. Du er landsbyens største helt!',
  ],
};
