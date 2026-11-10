import helt from './data/helt.js';
import { nyTilstand } from './tilpasning.js';

// Det som følger eleven gjennom spillet. Ligger foreløpig bare i minnet.
export const spiller = { ...helt, liv: helt.maksLiv, tilpasning: nyTilstand() };
