// «virker» gir fienden (eller helten, med «selv») et merke i «runder» turer.
// «prikk» er skaden gift og brann gjør hver tur, som del av angrepets skade.
export default {
  id: 'giftpil',
  navn: 'Giftpil',
  type: 'del',
  nivaa: 2,
  farge: 0x7ad04a,
  element: 'gift',
  kraft: 0.6,
  virker: 'gift',
  runder: 3,
  prikk: 0.6,
  hvile: 2,
  om: 'Gift i 3 turer.',
};
