import { VANLIG } from '../hud.js';

// «kort»: radene i figuren som tas bort, så dvergen blir lav. «skjegg»: skjegget dvergen får først.
export default {
  id: 'dverg',
  navn: 'Dverg',
  om: 'Seig som stein: mye liv',
  liv: 6,
  skade: 0,
  hud: VANLIG,
  kort: [9, 12],
  skjegg: 3,
};
