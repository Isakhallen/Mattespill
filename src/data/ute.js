// Tegnene på verdenskartet og flisene de tegnes med. Flisene er numrene i
// assets/ute.png (Kenneys Tiny Town, 12 fliser i bredden).
//  .  gress           :  vei             #  skog           *  tre
//  &  busk            %  brønn           ?  skilt          +  gjerde
//  ^  rødt tak        "  grått tak       |  vegg           !  vindu
//  [  dør             ]  steinmur        =  murkant        ( )  port (toppen)
// Sifrene er porter (bunnen), @ er start, og bokstavene er som i hulene.

// Tegn helten ikke kan gå på.
export const STENGT = '#*&%?+^"|![]=()';

export const FLIS = {
  gress: [0, 0, 0, 0, 0, 0, 1, 1, 2],
  vei: [12, 13, 14, 24, 25, 26, 36, 37, 38], // 3×3 med gresskant
  skog: [6, 7, 8, 18, 19, 20, 30, 31, 32], // 3×3
  tre: [[4, 16], [4, 16], [4, 16], [3, 15]], // [topp, bunn], mest grønne
  busk: 5,
  bronn: [92, 104],
  skilt: 83,
  tak: { '^': [52, 53, 54, 64, 65, 66], '"': [48, 49, 50, 60, 61, 62] },
  vegg: {
    tre: { v: 72, m: 73, h: 75, '!': 84, '[': 85 },
    stein: { v: 76, m: 77, h: 79, '!': 88, '[': 89 },
  },
  mur: 126,
  murkant: [99, 100, 101],
  port: { aapen: [113, 114], stengt: [111, 112], bunn: [123, 124], planke: [80, 82] },
};

// Gjerdet velges etter hvilke naboer som også er gjerde.
export function gjerde(n, o, s, v) {
  if (o && v) return 81;
  if (o) return s ? 44 : n ? 68 : 80;
  if (v) return s ? 46 : n ? 70 : 82;
  if (n && s) return 59;
  if (s) return 47;
  if (n) return 71;
  return 80;
}
