import helt from './data/helt.js';
import { nyTilstand } from './tilpasning.js';
import { MAKS_TRINN } from './oppgaver.js';
import { UTSTYR } from './utstyr.js';
import { klasseFor } from './klasser.js';
import { kartFor, FORSTE } from './kartliste.js';
import { maksLiv, nivaa } from './vekst.js';
import { ANGREP, MAKS_ANGREP, standardValg } from './kamp.js';
import { les, skriv } from './lagring.js';

const heltall = (x, min, maks) => Number.isInteger(x) && x >= min && x <= maks;
const tekster = (x) => (Array.isArray(x) ? [...new Set(x.filter((t) => typeof t === 'string'))] : []);

// Lager spilleren fra det som er lagret. Det som mangler eller er rart, får startverdien.
// «klasse» er null til eleven har valgt. «kart» er kartet helten står i.
// «slaatt» og «aapnet» er fiender og ting på kartet, skrevet som «kart:x,y».
// «sett» er historietekster eleven har sett. «seire» er hvor mange ganger bossen er slått.
// «angrep» er angrepene eleven har tatt med fra angrepsboka (høyst MAKS_ANGREP).
export function lagSpiller(d) {
  if (!d || typeof d !== 'object') d = {};
  const klasse = klasseFor(d.klasse);
  const s = {
    klasse: klasse?.id ?? null,
    navn: klasse?.navn ?? helt.navn,
    figur: klasse?.figur ?? helt.figur,
    kart: kartFor(d.kart)?.id ?? FORSTE,
    erfaring: heltall(d.erfaring, 0, 1e6) ? d.erfaring : 0,
    tilpasning: nyTilstand(heltall(d.trinn, 1, MAKS_TRINN) ? d.trinn : 1),
    utstyr: tekster(d.utstyr).filter((id) => UTSTYR.some((u) => u.id === id)),
    slaatt: tekster(d.slaatt),
    aapnet: tekster(d.aapnet),
    sett: tekster(d.sett),
    seire: heltall(d.seire, 0, 1e6) ? d.seire : 0,
  };
  s.liv = heltall(d.liv, 1, maksLiv(s)) ? d.liv : maksLiv(s);
  const angrep = tekster(d.angrep).filter((id) => ANGREP.some((a) => a.id === id));
  s.angrep = angrep.length ? angrep.slice(0, MAKS_ANGREP) : standardValg(nivaa(s.erfaring));
  return s;
}

// Gir helten en klasse (navn og figur følger med).
export function velgKlasse(s, id) {
  const k = klasseFor(id);
  Object.assign(s, { klasse: k.id, navn: k.navn, figur: k.figur });
  s.liv = maksLiv(s);
}

export const tilLagring = (s) => ({
  klasse: s.klasse,
  kart: s.kart,
  erfaring: s.erfaring,
  liv: s.liv,
  trinn: s.tilpasning.trinn,
  utstyr: s.utstyr,
  slaatt: s.slaatt,
  aapnet: s.aapnet,
  sett: s.sett,
  seire: s.seire,
  angrep: s.angrep,
});

// Det som følger eleven gjennom spillet.
export const spiller = lagSpiller(les());
export const lagre = () => skriv(tilLagring(spiller));
