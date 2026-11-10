// Bossen. «skjold»: lette slag gir bare 1 skade, typeangrep gir 2 ekstra (src/kamp.js).
// «foer» vises før første kamp, «igjen» før de neste, og «etter» når den er slått.
export default {
  id: 'tallslukeren',
  tegn: 'B',
  navn: 'Tallslukeren',
  bestemt: 'Tallslukeren',
  figur: 'big_demon',
  liv: 60,
  skade: 5,
  erfaring: 40,
  boss: true,
  skjold: true,
  foer: [
    '«Mine tall! Du får dem aldri!»',
    'Lette slag preller av Tallslukeren. Bruk tunge slag og trolldom!',
  ],
  igjen: ['Tallslukeren venter. Bruk tunge slag og trolldom!'],
  etter: [
    'Tallslukeren hoster opp alle tallene!',
    'Tallene flyr hjem til landsbyen. Du er en ekte helt!',
  ],
};
