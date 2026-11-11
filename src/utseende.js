import { FOLK } from './folkeslag.js';

// Utseendet til helten, satt sammen av deler fra Kenneys «Roguelike Characters» (assets/helter.png,
// ruter på 16×16 med 1 px mellomrom). [k, r] er kolonne og rad i arket. Tegnes i src/heltebilde.js.
// Uten grafikk, så det kan testes med Node.

// Hår og skjegg: plassen inne i en fargeblokk på 4×4 ruter. null = ingen.
export const HAAR = [null, [0, 0], [0, 1], [1, 0], [1, 1], [2, 1], [3, 1], [1, 2], [2, 2], [0, 2], [2, 0]];
export const SKJEGG = [null, [1, 3], [3, 0], [0, 3], [2, 3], [3, 3], [3, 2]];
// Hårfarger: blokka i arket (brun, rødbrun, blond, svart, hvit). Med «farge» blir den hvite blokka farget.
export const HAARFARGER = [
  { blokk: [19, 0] },
  { blokk: [23, 0] },
  { blokk: [19, 4] },
  { blokk: [23, 4] },
  { blokk: [19, 8] },
  { blokk: [19, 8], farge: '#e05040' },
  { blokk: [19, 8], farge: '#5a7aff' },
  { blokk: [19, 8], farge: '#ff80c0' },
  { blokk: [19, 8], farge: '#5ac060' },
  { blokk: [19, 8], farge: '#a070ff' },
];
// Klær: SNITT snitt (4 × 3 ruter) i hver av de 6 fargene. Tallet er øverste venstre rute i fargens blokk.
export const KLESFARGER = [[6, 0], [10, 0], [14, 0], [6, 5], [10, 5], [14, 5]];
export const SNITT = 12;
// Rustningene fra src/data/utstyr/ kan vises i stedet for klærne (klaer = SNITT + nummeret her).
export const RUSTNINGER = [['laervest', [6, 4]], ['ringbrynje', [10, 4]], ['platerustning', [12, 4]], ['dragerustning', [14, 9]]];
// Bukser (kolonne 3) og sko (kolonne 4) står i samme rad.
export const BUKSER = [0, 1, 2, 3, 5, 6, 7, 8];
// Hodeplagg: «hode» er raden i arket + 1 (0 = uten), kolonnen er 28 + «hodefarge».
export const HODER = 9;
export const HODEFARGER = 4;
// Våpen: én rute for hvert nivå (tre eller rust, jern, gull, runer). Staven har steinen i klassens farge.
export const VAAPEN = {
  ingen: null,
  sverd: [[43, 6], [44, 6], [45, 6], [46, 6]],
  dolk: [[43, 7], [44, 7], [45, 7], [46, 7]],
  oks: [[42, 5], [51, 0], [51, 6], [51, 8]],
  klubbe: [[43, 4], [47, 0], [47, 6], [47, 8]],
  hammer: [[45, 4], [50, 0], [50, 6], [50, 8]],
  bue: [[52, 0], [52, 1], [52, 2], [52, 4]],
  stavRod: [[42, 0], [43, 0], [45, 0], [46, 0]],
  stavBlaa: [[42, 1], [43, 1], [45, 1], [46, 1]],
  stavRosa: [[42, 2], [43, 2], [45, 2], [46, 2]],
  stavGronn: [[42, 3], [43, 3], [45, 3], [46, 3]],
};
export const VAAPENNAVN = Object.keys(VAAPEN);
export const SKJOLD = [[34, 0], [38, 0], [34, 3], [38, 7]];
// Våpenet helten har, gir nivået på våpenet og skjoldet som tegnes.
export const VAAPENNIVAA = { rustentSverd: 0, sverd: 1, gullsverd: 2, runesverd: 3 };

// Feltene i koden, i rekkefølge, med største verdi.
const FELT = [
  ['folk', FOLK.length - 1],
  ['hud', Math.max(...FOLK.map((f) => f.hud.length)) - 1],
  ['ansikt', 1],
  ['haar', HAAR.length - 1],
  ['haarfarge', HAARFARGER.length - 1],
  ['skjegg', SKJEGG.length - 1],
  ['klaer', SNITT + RUSTNINGER.length - 1],
  ['farge', KLESFARGER.length - 1],
  ['bukser', BUKSER.length - 1],
  ['hode', HODER],
  ['hodefarge', HODEFARGER - 1],
  ['vaapen', VAAPENNAVN.length - 1],
  ['nivaa', 3],
  ['skjold', SKJOLD.length],
];
export const MAKS = Object.fromEntries(FELT);
// Det eleven velger selv. Resten følger av folk, klasse og utstyr (src/spiller.js).
export const VALG = ['hud', 'ansikt', 'haar', 'haarfarge', 'skjegg', 'klaer', 'farge', 'bukser', 'hode', 'hodefarge'];

const A = 97; // «a»
// Koden for et utseende: «h_» og én bokstav per felt (a = 0). Koden sendes som «figur» til klassen,
// så den må passe reglene i database.rules.json (bare a–z og _, høyst 24 tegn).
export const kodeFor = (u) => 'h_' + FELT.map(([f]) => String.fromCharCode(A + (u[f] ?? 0))).join('');
export const erHeltekode = (figur) => typeof figur === 'string' && figur.startsWith('h_');

// Utseendet i en kode, eller null hvis koden er rar.
export function utseendeFra(kode) {
  if (!erHeltekode(kode) || kode.length !== 2 + FELT.length) return null;
  const u = {};
  for (const [i, [f, maks]] of FELT.entries()) {
    const x = kode.charCodeAt(2 + i) - A;
    if (!(x >= 0 && x <= maks)) return null;
    u[f] = x;
  }
  return u.hud < FOLK[u.folk].hud.length ? u : null;
}

const heltall = (x, maks) => Number.isInteger(x) && x >= 0 && x <= maks;
// Valgene fra lagringen. Det som mangler eller er rart, blir 0.
export const lesValg = (d) => Object.fromEntries(VALG.map((f) => [f, heltall(d?.[f], MAKS[f]) ? d[f] : 0]));

// Et tilfeldig utseende for et folk. Hodeplagget beholdes.
export function tilfeldig(folk, tall = Math.random, hode = {}) {
  const av = (n) => Math.floor(tall() * n);
  return {
    hud: av(folk.hud.length),
    ansikt: av(2),
    haar: av(HAAR.length),
    haarfarge: tall() < 0.7 ? av(5) : av(HAARFARGER.length),
    skjegg: folk.skjegg ?? (tall() < 0.25 ? av(SKJEGG.length) : 0),
    klaer: av(SNITT),
    farge: av(KLESFARGER.length),
    bukser: av(BUKSER.length),
    hode: hode.hode ?? 0,
    hodefarge: hode.hodefarge ?? 0,
  };
}
