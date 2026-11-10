import helt from './data/helt.js';
import { UTSTYR } from './utstyr.js';
import { ANGREP } from './kamp.js';

// Erfaring, nivå og utstyr. Regler uten grafikk, så de kan testes med Node.
export const MAKS_NIVAA = 20;

// Erfaringen som trengs for å nå nivå n: 0, 10, 30, 60, 100 …
export const grense = (n) => 5 * n * (n - 1);

export function nivaa(erfaring) {
  let n = 1;
  while (n < MAKS_NIVAA && erfaring >= grense(n + 1)) n++;
  return n;
}

// Det beste helten eier av et slag. Våpen måles i skade, rustning i liv.
export function beste(eier, slag) {
  const maal = slag === 'vaapen' ? 'skade' : 'liv';
  return UTSTYR.filter((u) => u.slag === slag && eier.includes(u.id)).reduce(
    (a, b) => (!a || b[maal] > a[maal] ? b : a),
    null,
  );
}

export const maksLiv = (s) =>
  helt.maksLiv +
  (nivaa(s.erfaring) - 1) * helt.perNivaa.liv +
  (beste(s.utstyr, 'rustning')?.liv ?? 0);

export const skadeBonus = (s) =>
  Math.floor((nivaa(s.erfaring) - 1) * helt.perNivaa.skade) +
  (beste(s.utstyr, 'vaapen')?.skade ?? 0);

// Seier gir fiendens erfaring. Hvert rette svar gir 1, også når helten taper.
export const kampErfaring = (fiende, k) => (k.utfall === 'seier' ? fiende.erfaring : 0) + k.rette;

// Hva som skjer når helten får «poeng» erfaring.
export function giErfaring(erfaring, poeng) {
  const fra = nivaa(erfaring);
  const til = nivaa(erfaring + poeng);
  const nyeAngrep = ANGREP.filter((a) => a.nivaa > fra && a.nivaa <= til);
  return { erfaring: erfaring + poeng, fra, til, nyeAngrep };
}

// Det kisten gir: det første i lista som helten ikke har.
export const nesteUtstyr = (eier) => UTSTYR.find((u) => !eier.includes(u.id)) ?? null;
