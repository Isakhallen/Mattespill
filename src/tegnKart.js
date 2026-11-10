// Tegner kartet med fliser fra atlaset «dungeon».
export const R = 16; // piksler per rute
export const DYBDE = { helt: 10, over: 20 };

function gulvnavn(x, y) {
  const v = (((x * 73856093) ^ (y * 19349663)) >>> 0) % 28;
  return 'floor_' + (v < 7 ? v + 2 : 1); // mest floor_1, litt variasjon
}

export function tegnKart(scene, kart) {
  const gulv = (x, y) => !kart.vegg(x, y);
  // Vegg med gulv over eller under vises som murvegg forfra.
  const front = (x, y) => kart.vegg(x, y) && (gulv(x, y + 1) || gulv(x, y - 1));
  const aapen = (x, y) => gulv(x, y) || front(x, y);
  const sidekant = (x, y, dx) => kart.vegg(x, y) && !front(x, y) && aapen(x + dx, y);
  const bilde = (x, y, navn, dybde = 0) =>
    scene.add.image(x * R, y * R, 'dungeon', navn).setOrigin(0).setDepth(dybde);

  for (let y = 0; y < kart.hoyde; y++) {
    for (let x = 0; x < kart.bredde; x++) {
      if (gulv(x, y)) {
        bilde(x, y, gulvnavn(x, y));
      } else if (front(x, y)) {
        bilde(x, y, 'wall_mid');
        bilde(x, y - 1, 'wall_top_mid', DYBDE.over);
      } else {
        // Smal kant mot rommet på høyre og/eller venstre side.
        for (const [dx, side] of [[1, 'left'], [-1, 'right']]) {
          if (!sidekant(x, y, dx)) continue;
          bilde(x, y, `wall_outer_mid_${side}`);
          if (!sidekant(x, y - 1, dx) && !front(x, y - 1)) {
            bilde(x, y - 1, `wall_outer_top_${side}`, DYBDE.over);
          }
        }
      }
    }
  }
}
