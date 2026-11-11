import { UTSTYR } from './utstyr.js';
import livsdrikk from './data/varer/livsdrikk.js';
import bombe from './data/varer/bombe.js';
import oegledrakt from './data/varer/oegledrakt.js';
import dvergdrakt from './data/varer/dvergdrakt.js';
import gresskardrakt from './data/varer/gresskardrakt.js';
import englekappe from './data/varer/englekappe.js';
import hjelm from './data/varer/hjelm.js';
import krone from './data/varer/krone.js';
import vikinghjelm from './data/varer/vikinghjelm.js';
import fjaerhatt from './data/varer/fjaerhatt.js';
import spisshatt from './data/varer/spisshatt.js';

// Ting brukes i kampen. Eleven kan ha høyst MAKS_TING av hver.
export const TING = [livsdrikk, bombe];
export const MAKS_TING = 5;
export const DRAKTER = [oegledrakt, dvergdrakt, gresskardrakt, englekappe];
// Hodeplagg: eleven eier dem i «spiller.hoder» og velger fargen i heltelaget.
export const HODEPLAGG = [hjelm, krone, fjaerhatt, spisshatt, vikinghjelm];

// Alt butikken selger, i rekkefølgen på hylla: våpen, rustning, ting, hodeplagg og drakter.
export const VARER = [
  ...UTSTYR.filter((u) => u.slag === 'vaapen'),
  ...UTSTYR.filter((u) => u.slag === 'rustning'),
  ...TING,
  ...HODEPLAGG,
  ...DRAKTER,
];

export const vareFor = (id) => VARER.find((v) => v.id === id);
export const draktFor = (id) => DRAKTER.find((d) => d.id === id);

// Hodeplagget med raden «rad» i arket (src/utseende.js).
export const hodeplaggMed = (rad) => HODEPLAGG.find((h) => h.rader.includes(rad));
// Hodeplagget helten har på, hvis eleven eier det.
export function hodeplaggFor(s) {
  const h = s.utseende?.hode ? hodeplaggMed(s.utseende.hode - 1) : null;
  return h && s.hoder?.includes(h.id) ? h : null;
}
