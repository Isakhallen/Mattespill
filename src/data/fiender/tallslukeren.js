// Bossen. «skjold»: lette slag gir bare 1 skade (src/kamp.js).
// «foer» vises før første kamp, «igjen» før de neste, og «etter» når den er slått.
export default {
  id: 'tallslukeren',
  tegn: 'B',
  navn: 'Tallslukeren',
  bestemt: 'Tallslukeren',
  figur: 'big_demon',
  liv: 90,
  skade: 5,
  erfaring: 40,
  gull: 50,
  boss: true,
  skjold: true,
  svak: ['is', 'hellig'],
  sterk: ['ild', 'gift'],
  foer: [
    '«Mine tall! Du får dem aldri!»',
    'Lette slag preller av skjoldet hans.',
  ],
  igjen: ['Tallslukeren venter bak skjoldet sitt.'],
  etter: [
    'Tallslukeren hoster opp alle tallene!',
    'Tallene flyr hjem til landsbyen. Du er en ekte helt!',
  ],
};
