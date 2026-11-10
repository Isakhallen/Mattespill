import { UTSTYR } from './utstyr.js';
import livsdrikk from './data/varer/livsdrikk.js';
import bombe from './data/varer/bombe.js';
import oegledrakt from './data/varer/oegledrakt.js';
import dvergdrakt from './data/varer/dvergdrakt.js';
import gresskardrakt from './data/varer/gresskardrakt.js';
import englekappe from './data/varer/englekappe.js';

// Ting brukes i kampen. Eleven kan ha høyst MAKS_TING av hver.
export const TING = [livsdrikk, bombe];
export const MAKS_TING = 5;
export const DRAKTER = [oegledrakt, dvergdrakt, gresskardrakt, englekappe];

// Alt butikken selger, i rekkefølgen på hylla: våpen, rustning, ting og drakter.
export const VARER = [
  ...UTSTYR.filter((u) => u.slag === 'vaapen'),
  ...UTSTYR.filter((u) => u.slag === 'rustning'),
  ...TING,
  ...DRAKTER,
];

export const vareFor = (id) => VARER.find((v) => v.id === id);
export const draktFor = (id) => DRAKTER.find((d) => d.id === id);
