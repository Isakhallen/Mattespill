import helt from './data/helt.js';
import { nyTilstand } from './tilpasning.js';
import { MAKS_TRINN } from './oppgaver.js';
import { UTSTYR } from './utstyr.js';
import { klasseFor } from './klasser.js';
import { kartFor, FORSTE } from './kartliste.js';
import { maksLiv, nivaa } from './vekst.js';
import { ANGREP, MAKS_ANGREP, standardValg } from './kamp.js';
import { les, skriv } from './lagring.js';
import { TING, MAKS_TING, DRAKTER, draktFor } from './varer.js';

const heltall = (x, min, maks) => Number.isInteger(x) && x >= min && x <= maks;
const tekster = (x) => (Array.isArray(x) ? [...new Set(x.filter((t) => typeof t === 'string'))] : []);

// Lager spilleren fra det som er lagret. Det som mangler eller er rart, får startverdien.
// «klasse» er null til eleven har valgt. «kart» er kartet helten står i.
// «slaatt» og «aapnet» er fiender og ting på kartet, skrevet som «kart:x,y».
// «sett» er historietekster eleven har sett. «seire» er hvor mange ganger bossen er slått.
// «angrep» er angrepene eleven har tatt med fra angrepsboka (høyst MAKS_ANGREP).
// «ting» er { id: antall } for drikker og bomber, «drakter» er draktene eleven eier,
// og «drakt» er den helten har på (null = ingen).
export function lagSpiller(d) {
  if (!d || typeof d !== 'object') d = {};
  const klasse = klasseFor(d.klasse);
  const drakter = tekster(d.drakter).filter((id) => DRAKTER.some((x) => x.id === id));
  const ting = {};
  for (const t of TING) ting[t.id] = heltall(d.ting?.[t.id], 0, MAKS_TING) ? d.ting[t.id] : 0;
  const s = {
    klasse: klasse?.id ?? null,
    navn: klasse?.navn ?? helt.navn,
    kart: kartFor(d.kart)?.id ?? FORSTE,
    erfaring: heltall(d.erfaring, 0, 1e6) ? d.erfaring : 0,
    tilpasning: nyTilstand(heltall(d.trinn, 1, MAKS_TRINN) ? d.trinn : 1),
    utstyr: tekster(d.utstyr).filter((id) => UTSTYR.some((u) => u.id === id)),
    slaatt: tekster(d.slaatt),
    aapnet: tekster(d.aapnet),
    sett: tekster(d.sett),
    seire: heltall(d.seire, 0, 1e6) ? d.seire : 0,
    gull: heltall(d.gull, 0, 1e6) ? d.gull : 0,
    ting,
    drakter,
    drakt: drakter.includes(d.drakt) ? d.drakt : null,
  };
  s.figur = figurFor(s);
  s.liv = heltall(d.liv, 1, maksLiv(s)) ? d.liv : maksLiv(s);
  const angrep = tekster(d.angrep).filter((id) => ANGREP.some((a) => a.id === id));
  s.angrep = angrep.length ? angrep.slice(0, MAKS_ANGREP) : standardValg(nivaa(s.erfaring));
  return s;
}

// Figuren helten har: drakten, ellers klassens figur.
export const figurFor = (s) => draktFor(s.drakt)?.figur ?? klasseFor(s.klasse)?.figur ?? helt.figur;

// Gir helten en klasse (navn og figur følger med).
export function velgKlasse(s, id) {
  const k = klasseFor(id);
  Object.assign(s, { klasse: k.id, navn: k.navn });
  s.figur = figurFor(s);
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
  gull: s.gull,
  ting: s.ting,
  drakter: s.drakter,
  drakt: s.drakt,
});

// Det som følger eleven gjennom spillet.
export const spiller = lagSpiller(les());
export const lagre = () => skriv(tilLagring(spiller));
