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
