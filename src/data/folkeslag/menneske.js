import { VANLIG } from '../hud.js';

// Et folk gir litt liv eller skade og en egenskap (se src/kamp.js og src/vekst.js).
// «hud» er hudfargene eleven kan velge. Ideene er fra DnDs frie regelbok (SRD 5.1, CC-BY 4.0).
// «erfaring»: så mye ekstra erfaring for hver seier.
export default {
  id: 'menneske',
  navn: 'Menneske',
  om: 'Lærer fort: +2 erfaring for hver seier',
  liv: 2,
  skade: 0,
  erfaring: 2,
  hud: VANLIG,
};
