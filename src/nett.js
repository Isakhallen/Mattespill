import { ADJEKTIV, DYR } from './data/nettnavn.js';
import { lesNett, skrivNett } from './lagring.js';

// Det klassen ser av helten: et laget navn, og klassekoden som samler klassen.
// Uten kode spiller eleven alene, og ingenting sendes.
export const KODE_MIN = 3;
export const KODE_MAKS = 8;

const trekk = (liste, tilfeldig) => liste[Math.floor(tilfeldig() * liste.length)];

// Et nytt navn, aldri det samme som «forrige».
export function lagNavn(tilfeldig = Math.random, forrige = '') {
  for (;;) {
    const navn = `${trekk(ADJEKTIV, tilfeldig)} ${trekk(DYR, tilfeldig)}`;
    if (navn !== forrige) return navn;
  }
}

export function gyldigNavn(navn) {
  const ord = String(navn).split(' ');
  return ord.length === 2 && ADJEKTIV.includes(ord[0]) && DYR.includes(ord[1]);
}

// Navnet sendes som to tall (plassen i hver liste), så databasen aldri har fritekst.
export function navnTall(navn) {
  const [a, d] = String(navn).split(' ');
  return { a: ADJEKTIV.indexOf(a), d: DYR.indexOf(d) };
}

export function navnFra({ a, d } = {}) {
  return ADJEKTIV[a] && DYR[d] ? `${ADJEKTIV[a]} ${DYR[d]}` : null;
}

// A–Z og 0–9, høyst 8 tegn (samme som reglene i database.rules.json). For kort kode gir ''.
export function rensKode(tekst) {
  const kode = String(tekst ?? '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, KODE_MAKS);
  return kode.length >= KODE_MIN ? kode : '';
}

// Det som sendes om helten. Ingenting annet går til Firebase.
export function radFor(navn, figur, nivaa, x, y) {
  return { ...navnTall(navn), figur, nivaa, x, y };
}

// En rad fra Firebase som kan vises, eller null. harFigur(figur) sjekker at figuren finnes.
export function lesRad(rad, harFigur = () => true) {
  const navn = navnFra(rad ?? {});
  const tall = (v, min, maks) => Number.isInteger(v) && v >= min && v <= maks;
  if (!navn || typeof rad.figur !== 'string' || !harFigur(rad.figur)) return null;
  if (!tall(rad.nivaa, 1, 20) || !tall(rad.x, 0, 99) || !tall(rad.y, 0, 99)) return null;
  return { navn, figur: rad.figur, nivaa: rad.nivaa, x: rad.x, y: rad.y };
}

// Tåler manglende og rare verdier.
export function lagNett(data, tilfeldig = Math.random) {
  return {
    navn: gyldigNavn(data?.navn) ? data.navn : lagNavn(tilfeldig),
    kode: rensKode(data?.kode),
  };
}

// Det som gjelder i denne nettleseren.
export const nett = lagNett(lesNett());

export function lagreNett() {
  skrivNett(nett);
}
