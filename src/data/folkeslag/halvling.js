import { VANLIG } from '../hud.js';

// «heldig»: eleven får prøve igjen etter ett feil svar i hver kamp (src/scener/Kamp.js). «barfot»: ingen sko.
export default {
  id: 'halvling',
  navn: 'Halvling',
  om: 'Heldig: prøv igjen én gang i hver kamp',
  liv: 2,
  skade: 0,
  heldig: true,
  hud: VANLIG,
  kort: [8, 10, 12],
  barfot: true,
};
