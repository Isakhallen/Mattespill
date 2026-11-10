// Framgangen lagres i nettleseren (localStorage). Ingenting sendes noe sted.
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
