// Framgangen lagres i nettleseren (localStorage). Bare det klassen ser sendes (se nett.js).
// Spillet skal tåle at lagringen mangler, er ødelagt eller ikke er lov.
const NOKKEL = 'mattespill';
export const VERSJON = 1;

// Gir det som er lagret, eller null.
export function les(lager) {
  try {
    lager ??= globalThis.localStorage;
    const d = JSON.parse(lager.getItem(NOKKEL));
    return d && typeof d === 'object' && d.versjon === VERSJON ? d : null;
  } catch {
    return null;
  }
}

// Glemmer helten (ny helt).
export function slett(lager) {
  try {
    (lager ?? globalThis.localStorage).removeItem(NOKKEL);
  } catch {
    // ingenting å gjøre
  }
}

// Gir false hvis det ikke gikk å lagre.
export function skriv(data, lager) {
  try {
    lager ??= globalThis.localStorage;
    lager.setItem(NOKKEL, JSON.stringify({ versjon: VERSJON, ...data }));
    return true;
  } catch {
    return false;
  }
}

// Lyd på eller av lagres for seg, så «Ny helt» ikke skrur lyden på igjen.
const LYD = 'mattespill-lyd';

export function lesLyd(lager) {
  try {
    return (lager ?? globalThis.localStorage).getItem(LYD) !== 'av';
  } catch {
    return true;
  }
}

export function skrivLyd(paa, lager) {
  try {
    (lager ?? globalThis.localStorage).setItem(LYD, paa ? 'paa' : 'av');
  } catch {
    // lyden virker likevel, men valget huskes ikke
  }
}

// Navnet klassen ser og klassekoden lagres også for seg, så «Ny helt» ikke rører dem.
const NETT = 'mattespill-nett';

export function lesNett(lager) {
  try {
    return JSON.parse((lager ?? globalThis.localStorage).getItem(NETT));
  } catch {
    return null;
  }
}

export function skrivNett(nett, lager) {
  try {
    (lager ?? globalThis.localStorage).setItem(NETT, JSON.stringify(nett));
  } catch {
    // virker likevel, men huskes ikke
  }
}
