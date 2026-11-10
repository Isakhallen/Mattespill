// Små merker (7×7 piksler) for statusene i kampen: over figurene og på knappene.
// Ingen tekst, bare bilde. Hver bokstav er en farge, punktum er tomt.
const FARGER = {
  g: '#6ad04a', d: '#2f7a2a', w: '#ffffff', r: '#ff6a1a', y: '#ffd84a',
  b: '#8fe8ff', p: '#b59cff', o: '#e8c170', s: '#8a9ab0', l: '#7ae08a',
};
const MERKER = {
  gift: ['...g...', '..ggg..', '.gggwg.', 'ggggwgg', 'ggggggg', '.ggggg.', '..ddd..'],
  brann: ['...r...', '..rr...', '..rrr.r', '.rryrrr', 'rryyyrr', 'ryyyyyr', '.ryyyr.'],
  frys: ['b..b..b', '.b.b.b.', '..bwb..', 'bbwwwbb', '..bwb..', '.b.b.b.', 'b..b..b'],
  svekket: ['..ppp..', '..ppp..', '..ppp..', 'ppppppp', '.ppppp.', '..ppp..', '...p...'],
  skjold: ['ooooooo', 'ossssso', 'osswsso', 'oswwwso', '.oswso.', '..oso..', '...o...'],
  liv: ['..lll..', '..lwl..', 'lllwlll', 'lwwwwwl', 'lllwlll', '..lwl..', '..lll..'],
};
export const MERKENAVN = Object.keys(MERKER);

// Merket for et angrep: statusen det gir, eller «liv» hvis det gir liv.
export const merkeFor = (a) => a.virker ?? (a.heler || a.stjel ? 'liv' : null);

// Et lerret på 9×9 med merket og en mørk kant rundt.
export function merkeLerret(navn) {
  const m = MERKER[navn];
  const c = document.createElement('canvas');
  c.width = c.height = 9;
  const g = c.getContext('2d');
  const fylt = (x, y) => m[y]?.[x] && m[y][x] !== '.';
  for (let y = -1; y <= 7; y++) {
    for (let x = -1; x <= 7; x++) {
      const kant = [[0, 1], [1, 0], [0, -1], [-1, 0]].some(([dx, dy]) => fylt(x + dx, y + dy));
      if (!fylt(x, y) && !kant) continue;
      g.fillStyle = fylt(x, y) ? FARGER[m[y][x]] : '#1c1820';
      g.fillRect(x + 1, y + 1, 1, 1);
    }
  }
  c.className = 'merke';
  return c;
}

// Teksturene «merke_<navn>» i Phaser.
export function lagMerker(scene) {
  for (const navn of MERKENAVN) {
    if (!scene.textures.exists(`merke_${navn}`)) scene.textures.addCanvas(`merke_${navn}`, merkeLerret(navn));
  }
}
