import { FOLK } from './folkeslag.js';
import {
  utseendeFra, HAAR, SKJEGG, HAARFARGER, KLESFARGER, SNITT, RUSTNINGER, BUKSER, VAAPEN, VAAPENNAVN, SKJOLD,
} from './utseende.js';

// Tegner helter av delene i assets/helter.png (Kenneys «Roguelike Characters», CC0) på et lerret.
// Ører, horn og hoggtenner tegnes her, og de små folkene blir lavere ved at noen rader tas bort.
const R = 17; // 16 px og 1 px mellomrom
const lagret = new Map(); // fargede ruter
let kilde = null; // bildet med delene

const lerret = (b, h) => Object.assign(document.createElement('canvas'), { width: b, height: h });
const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const css = (p) => `rgb(${p[0]},${p[1]},${p[2]})`;

// Én rute fra arket. Med «farge» blir ruta farget: «hud» beholder lysheten i den lyse kroppen,
// ellers ganges ruta (det hvite håret) med fargen.
function rute([k, r], farge = null, hud = false) {
  const nokkel = `${k},${r},${farge},${hud}`;
  if (lagret.has(nokkel)) return lagret.get(nokkel);
  const c = lerret(16, 16);
  const g = c.getContext('2d', { willReadFrequently: true });
  g.drawImage(kilde, k * R, r * R, 16, 16, 0, 0, 16, 16);
  if (farge) {
    const bilde = g.getImageData(0, 0, 16, 16);
    const p = bilde.data;
    const f = rgb(farge);
    const lys = (i) => 0.3 * p[i] + 0.59 * p[i + 1] + 0.11 * p[i + 2];
    const grunn = lys(4 * (6 * 16 + 7)); // huden midt i ansiktet
    for (let i = 0; i < p.length; i += 4) {
      if (!p[i + 3]) continue;
      const del = lys(i) / grunn;
      for (let j = 0; j < 3; j++) p[i + j] = Math.min(255, hud ? f[j] * del : (p[i + j] * f[j]) / 255);
    }
    g.putImageData(bilde, 0, 0);
  }
  lagret.set(nokkel, c);
  return c;
}

const pluss = ([k, r], [dk, dr]) => [k + dk, r + dr];

// Helten på et lerret på 16×16.
export function tegnHelt(u) {
  const folk = FOLK[u.folk];
  const c = lerret(16, 16);
  const g = c.getContext('2d');
  const tegn = (bit) => bit && g.drawImage(bit, 0, 0);
  // Prikker på venstre side, speilet til høyre.
  const prikker = (farge, punkter) => {
    g.fillStyle = farge;
    for (const [x, y] of punkter) g.fillRect(x, y, 1, 1), g.fillRect(15 - x, y, 1, 1);
  };

  const hud = folk.hud[u.hud];
  const kropp = hud.farge ? rute([u.ansikt, 0], hud.farge, true) : rute([u.ansikt, hud.rad]);
  tegn(kropp);
  const lese = kropp.getContext('2d', { willReadFrequently: true });
  const [hudfarge, kant] = [[7, 6], [4, 6]].map(([x, y]) => css(lese.getImageData(x, y, 1, 1).data));
  if (folk.tenner) prikker('#f4eedc', [[6, 6]]);

  const rad = BUKSER[u.bukser];
  tegn(rute([3, rad]));
  if (!folk.barfot) tegn(rute([4, rad]));
  const rustning = RUSTNINGER[u.klaer - SNITT];
  const farge = KLESFARGER[u.farge];
  tegn(rute(rustning ? rustning[1] : pluss(farge, [u.klaer % 4, Math.floor(u.klaer / 4)])));

  const haarfarge = HAARFARGER[u.haarfarge];
  if (SKJEGG[u.skjegg]) tegn(rute(pluss(haarfarge.blokk, SKJEGG[u.skjegg]), haarfarge.farge));
  if (HAAR[u.haar]) tegn(rute(pluss(haarfarge.blokk, HAAR[u.haar]), haarfarge.farge));
  if (folk.oerer === 2) prikker(hudfarge, [[3, 4], [3, 5], [2, 4]]), prikker(kant, [[2, 3], [1, 3]]);
  if (folk.oerer === 1) prikker(hudfarge, [[3, 4], [3, 5]]), prikker(kant, [[2, 4]]);
  if (folk.horn) prikker(folk.horn, [[5, 1], [4, 0]]);
  if (u.hode) tegn(rute([28 + u.hodefarge, u.hode - 1]));
  if (u.skjold) tegn(rute(SKJOLD[u.skjold - 1]));
  const vaapen = VAAPEN[VAAPENNAVN[u.vaapen]];
  if (vaapen) tegn(rute(vaapen[u.nivaa]));

  return folk.kort ? kortere(c, folk.kort) : c;
}

// Tar bort radene i «rader», så figuren blir lavere. Føttene står der de stod.
function kortere(c, rader) {
  const ny = lerret(16, 16);
  const g = ny.getContext('2d');
  let y = 15;
  for (let r = 15; r >= 0; r--) if (!rader.includes(r)) g.drawImage(c, 0, r, 16, 1, 0, y--, 16, 1);
  return ny;
}

const brukArk = (scene) => (kilde ??= scene.textures.get('helter').getSourceImage());

// Teksturen og animasjonene «<kode>_idle» og «<kode>_run» for en helt.
// To bilder: helten står, og helten hopper 1 piksel.
export function lagHelt(scene, kode) {
  if (scene.textures.exists(kode)) return;
  brukArk(scene);
  const bilde = tegnHelt(utseendeFra(kode));
  const c = lerret(32, 17);
  const g = c.getContext('2d');
  g.drawImage(bilde, 0, 1);
  g.drawImage(bilde, 16, 0);
  const t = scene.textures.addCanvas(kode, c);
  t.add('f0', 0, 0, 0, 16, 17);
  t.add('f1', 0, 16, 0, 16, 17);
  for (const [del, fart] of [['idle', 2], ['run', 8]]) {
    const frames = [{ key: kode, frame: 'f0' }, { key: kode, frame: 'f1' }];
    scene.anims.create({ key: `${kode}_${del}`, frames, frameRate: fart, repeat: -1 });
  }
}

// Et bilde i HTML av helten, «skala» ganger større.
export function heltebilde(scene, kode, skala = 3) {
  brukArk(scene);
  const c = tegnHelt(utseendeFra(kode));
  c.className = 'figurbilde';
  Object.assign(c.style, { width: `${16 * skala}px`, height: `${16 * skala}px`, imageRendering: 'pixelated' });
  return c;
}
