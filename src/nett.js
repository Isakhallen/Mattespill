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

// Store bokstaver og sifre, høyst 8 tegn. For kort kode gir ''.
export function rensKode(tekst) {
  const kode = String(tekst ?? '')
    .toUpperCase()
    .replace(/[^A-Z0-9ÆØÅ]/g, '')
    .slice(0, KODE_MAKS);
  return kode.length >= KODE_MIN ? kode : '';
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
