// «tegn» er bokstaven i tekstkartet. «figur» er navnet i atlaset.
// «liv», «skade» og «erfaring» gjelder på nivå 1 og vokser med nivået (src/fiender.js).
// «svak»: elementer som gir dobbel skade, «sterk»: halv skade. Det står aldri i spillet.
export default {
  id: 'goblin',
  tegn: 'g',
  navn: 'Goblin',
  bestemt: 'Goblinen',
  figur: 'goblin',
  liv: 30,
  skade: 3,
  erfaring: 3,
  svak: ['ild'],
};
