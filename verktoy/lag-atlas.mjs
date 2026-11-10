// Lager assets/dungeon.png og assets/dungeon.json fra 0x72 DungeonTileset II.
// Kjøres fra repo-roten: node verktoy/lag-atlas.mjs <mappa med pakken>
import { readFileSync, writeFileSync, copyFileSync, mkdirSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const kilde = process.argv[2];
const filer = readdirSync(kilde);
const liste = filer.find((f) => f.startsWith('tile_list'));
const bilde = filer.find((f) => /^0x72_DungeonTilesetII.*\.png$/.test(f));
if (!liste || !bilde) throw new Error('Fant ikke tile_list og samlebilde i ' + kilde);

const frames = {};
for (const linje of readFileSync(join(kilde, liste), 'utf8').split(/\r?\n/)) {
  const [navn, ...tall] = linje.trim().split(/\s+/);
  if (!navn) continue;
  const [x, y, w, h] = tall.map(Number);
  if (tall.length !== 4 || [x, y, w, h].some(Number.isNaN)) {
    throw new Error('Uventet linje: ' + linje);
  }
  frames[navn] = { frame: { x, y, w, h } };
}

mkdirSync('assets', { recursive: true });
copyFileSync(join(kilde, bilde), 'assets/dungeon.png');
writeFileSync('assets/dungeon.json', JSON.stringify({ frames, meta: { image: 'dungeon.png' } }));
console.log(Object.keys(frames).length, 'bilder i atlaset');
