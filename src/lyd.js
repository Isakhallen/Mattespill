import { lesLyd, skrivLyd } from './lagring.js';

// Lydeffekter og musikk. Filene ligger i assets/lyd/ (kilder i KILDER.md).
// Musikken har samme navn som kartet og lastes først når kartet vises.
export const EFFEKTER = ['treff', 'tungt', 'magi', 'bom', 'au', 'seier', 'nivaa', 'kiste', 'drikk', 'trapp', 'svak', 'preller', 'gull', 'bombe'];
const STYRKE = { effekt: 0.6, musikk: 0.3 };

export function lastEffekter(scene) {
  for (const navn of EFFEKTER) scene.load.audio(navn, `assets/lyd/${navn}.wav`);
}

export function spill(scene, navn) {
  if (scene.cache.audio.exists(navn)) scene.sound.play(navn, { volume: STYRKE.effekt });
}

let spor = null; // musikken som går
let onsket = null; // musikken som skal gå når den er lastet

export function musikk(scene, navn) {
  onsket = navn;
  if (spor?.key === navn) return;
  if (!scene.cache.audio.exists(navn)) {
    scene.load.audio(navn, `assets/lyd/${navn}.ogg`);
    scene.load.once(`filecomplete-audio-${navn}`, () => onsket === navn && musikk(scene, navn));
    scene.load.start();
    return;
  }
  spor?.destroy();
  spor = scene.sound.add(navn, { loop: true, volume: STYRKE.musikk });
  spor.play();
}

// Lyden følger det eleven valgte sist. Valget huskes her, for Phaser leser
// «mute» fra lydkortet, og det er ikke alltid oppdatert med en gang.
let paa = true;
export const lydPaa = () => paa;

export function settLyd(spill, ny = lesLyd()) {
  paa = ny;
  spill.sound.mute = !paa;
  skrivLyd(paa);
  return paa;
}
