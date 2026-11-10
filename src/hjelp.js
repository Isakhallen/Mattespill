// Tall slik vi skriver dem på norsk: 1,25
export const tall = (x) => String(Math.round(x * 100) / 100).replace('.', ',');

// v(liste) trekker ett tilfeldig element.
export const velger = (rnd = Math.random) => (liste) => liste[Math.floor(rnd() * liste.length)];

// Tilfeldige tall som blir like hver gang (til tester og tabeller).
export function medFro(fro) {
  let a = fro >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
