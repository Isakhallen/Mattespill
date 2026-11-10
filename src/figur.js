// Lager animasjonene «<figur>_idle» og «<figur>_run» fra atlaset, én gang per figur.
export function lagAnimasjoner(scene, figur) {
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
export const figurbilde = (scene, figur, skala = 3) => atlasbilde(scene, `${figur}_idle_anim_f0`, skala);

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
