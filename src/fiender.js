import goblin from './data/fiender/goblin.js';
import imp from './data/fiender/imp.js';
import skjelett from './data/fiender/skjelett.js';
import ork from './data/fiender/ork.js';
import maskeork from './data/fiender/maskeork.js';
import sjaman from './data/fiender/sjaman.js';
import tallslukeren from './data/fiender/tallslukeren.js';
import tusse from './data/fiender/tusse.js';
import skogogle from './data/fiender/skogogle.js';
import halvdan from './data/fiender/halvdan.js';

export const FIENDER = [
  goblin, imp, skjelett, ork, maskeork, sjaman, tallslukeren,
  tusse, skogogle, halvdan, // Skogen
];

// Bokstaven i tekstkartet → fienden.
export const fiendeFor = (tegn) => FIENDER.find((f) => f.tegn === tegn);

// Fiendens nivå: kartets nivå, men aldri mer enn ett under helten.
export const fiendeNivaa = (kartNivaa, heltNivaa) => Math.max(kartNivaa ?? 1, heltNivaa - 1);

// Hvor mye sterkere en fiende er enn på nivå 1.
export const styrke = (nivaa) => 1 + 0.3 * (nivaa - 1);

// En fiende på kartet eller i kampen, med tall for nivået.
export function lagFiende(type, nivaa) {
  const maks = Math.round(type.liv * styrke(nivaa));
  return {
    type,
    nivaa,
    maks,
    liv: maks,
    skade: Math.round(type.skade * (1 + 0.2 * (nivaa - 1))),
    erfaring: Math.round(type.erfaring * styrke(nivaa)),
    gull: Math.round((type.gull ?? 0) * styrke(nivaa)),
  };
}

// Løfter en fiende til et høyere nivå. Skaden den har fått, beholdes som en andel.
export function tilNivaa(f, nivaa) {
  if (nivaa <= f.nivaa) return f;
  const ny = lagFiende(f.type, nivaa);
  return { ...f, ...ny, liv: Math.max(1, Math.round((f.liv * ny.maks) / f.maks)) };
}
