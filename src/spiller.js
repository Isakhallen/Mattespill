import helt from './data/helt.js';
import { nyTilstand } from './tilpasning.js';
import { MAKS_TRINN } from './oppgaver.js';
import { UTSTYR } from './utstyr.js';
import { maksLiv } from './vekst.js';
import { les, skriv } from './lagring.js';

const heltall = (x, min, maks) => Number.isInteger(x) && x >= min && x <= maks;
const tekster = (x) => (Array.isArray(x) ? [...new Set(x.filter((t) => typeof t === 'string'))] : []);

// Lager spilleren fra det som er lagret. Det som mangler eller er rart, får startverdien.
// «slaatt» og «aapnet» er fiender og kister på kartet, skrevet som «kart:x,y».
export function lagSpiller(d) {
  if (!d || typeof d !== 'object') d = {};
  const s = {
    navn: helt.navn,
    figur: helt.figur,
    erfaring: heltall(d.erfaring, 0, 1e6) ? d.erfaring : 0,
    tilpasning: nyTilstand(heltall(d.trinn, 1, MAKS_TRINN) ? d.trinn : 1),
    utstyr: tekster(d.utstyr).filter((id) => UTSTYR.some((u) => u.id === id)),
    slaatt: tekster(d.slaatt),
    aapnet: tekster(d.aapnet),
  };
  s.liv = heltall(d.liv, 1, maksLiv(s)) ? d.liv : maksLiv(s);
  return s;
}

export const tilLagring = (s) => ({
  erfaring: s.erfaring,
  liv: s.liv,
  trinn: s.tilpasning.trinn,
  utstyr: s.utstyr,
  slaatt: s.slaatt,
  aapnet: s.aapnet,
});

// Det som følger eleven gjennom spillet.
export const spiller = lagSpiller(les());
export const lagre = () => skriv(tilLagring(spiller));
