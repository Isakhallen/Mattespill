import { erHeltekode, utseendeFra } from './utseende.js';
import { lagHelt, heltebilde } from './heltebilde.js';

// Lager animasjonene «<figur>_idle» og «<figur>_run» fra atlaset, én gang per figur.
// En helt (kode som begynner med «h_») tegnes av deler i src/heltebilde.js.
export function lagAnimasjoner(scene, figur) {
  if (erHeltekode(figur)) return lagHelt(scene, figur);
  for (const [del, fart] of [['idle', 6], ['run', 10]]) {
    const key = `${figur}_${del}`;
    if (scene.anims.exists(key)) continue;
    scene.anims.create({
      key,
      frames: scene.anims.generateFrameNames('dungeon', {
        prefix: `${figur}_${del}_anim_f`,
        start: 0,
        end: 3,
      }),
      frameRate: fart,
      repeat: -1,
    });
  }
}

// Et bilde i HTML av første rute i en figurs idle-animasjon, «skala» ganger større.
export const figurbilde = (scene, figur, skala = 3) =>
  erHeltekode(figur) ? heltebilde(scene, figur, skala) : atlasbilde(scene, `${figur}_idle_anim_f0`, skala);

// Finnes figuren? Brukes på figurer fra klassen (Firebase).
export const harFigur = (scene, figur) =>
  erHeltekode(figur) ? !!utseendeFra(figur) : scene.textures.get('dungeon').has(`${figur}_idle_anim_f0`);

// Et bilde i HTML av et navn i atlaset, «skala» ganger større.
export function atlasbilde(scene, navn, skala = 3) {
  const tekstur = scene.textures.get('dungeon');
  const f = tekstur.get(navn);
  const kilde = tekstur.getSourceImage();
  const el = document.createElement('span');
  el.className = 'figurbilde';
  Object.assign(el.style, {
    width: `${f.cutWidth * skala}px`,
    height: `${f.cutHeight * skala}px`,
    backgroundImage: "url(assets/dungeon.png)",
    backgroundPosition: `${-f.cutX * skala}px ${-f.cutY * skala}px`,
    backgroundSize: `${kilde.width * skala}px ${kilde.height * skala}px`,
  });
  return el;
}
