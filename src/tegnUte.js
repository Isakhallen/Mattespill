// Tegner verdenskartet over bakken med fliser fra «ute» (se src/data/ute.js).
// Alt tegnes i to bilder: bakken under helten og det som er høyere enn helten
// (tretopper og brønntaket) over.
import { FLIS, gjerde } from './data/ute.js';
import { R, DYBDE } from './tegnKart.js';

const MORKT = 0x1b1424; // inne i portene

const spred = (x, y) => ((x * 73856093) ^ (y * 19349663)) >>> 0;
const velg = (liste, x, y) => liste[spred(x, y) % liste.length];

export function tegnUte(scene, data) {
  const ruter = data.ruter;
  const bredde = ruter[0].length;
  const hoyde = ruter.length;
  const tegn = (x, y) => ruter[y]?.[x];
  // Utenfor kartet regnes som skog, så skogkanten bare vises innover.
  const skog = (x, y) => x < 0 || y < 0 || x >= bredde || y >= hoyde || tegn(x, y) === '#';
  const vei = (x, y) => /[:@%0-9]/.test(tegn(x, y) ?? ''); // brønnen står på torget
  const port = (x, y) => /[0-9]/.test(tegn(x, y) ?? '');
  const aapen = (siffer) => !!data.innganger?.[siffer]?.kart;

  const bunn = scene.add.renderTexture(0, 0, bredde * R, hoyde * R).setOrigin(0).setDepth(0);
  const topp = scene.add.renderTexture(0, 0, bredde * R, hoyde * R).setOrigin(0).setDepth(DYBDE.over);

  // Mørket inne i portene ligger bak bakken, som er gjennomsiktig der.
  for (let y = 0; y < hoyde; y++) {
    for (let x = 0; x < bredde; x++) {
      if (!port(x, y) && !'()'.includes(tegn(x, y))) continue;
      scene.add.rectangle(x * R, y * R, R, R, MORKT).setOrigin(0).setDepth(-1);
    }
  }

  // Velger flis i et 3×3-sett ut fra hvilke naboer som hører til.
  const ni = (sett, lik, x, y) => {
    const rad = !lik(x, y - 1) ? 0 : !lik(x, y + 1) ? 2 : 1;
    const kol = !lik(x - 1, y) ? 0 : !lik(x + 1, y) ? 2 : 1;
    return sett[rad * 3 + kol];
  };

  bunn.beginDraw();
  topp.beginDraw();
  const legg = (lag, x, y, flis) => lag.batchDrawFrame('ute', flis, x * R, y * R);

  for (let y = 0; y < hoyde; y++) {
    for (let x = 0; x < bredde; x++) {
      const t = tegn(x, y);
      const lik = (a, b) => tegn(a, b) === t;
      if (t === ':' || t === '@') {
        legg(bunn, x, y, ni(FLIS.vei, vei, x, y));
        continue;
      }
      if (port(x, y)) {
        legg(bunn, x, y, FLIS.port.bunn[lik(x - 1, y) ? 1 : 0]);
        if (!aapen(t)) legg(bunn, x, y, FLIS.port.planke[lik(x - 1, y) ? 1 : 0]);
        continue;
      }
      if (t === '(' || t === ')') {
        const s = tegn(x, y + 1);
        legg(bunn, x, y, FLIS.port[aapen(s) ? 'aapen' : 'stengt'][t === '(' ? 0 : 1]);
        continue;
      }
      legg(bunn, x, y, t === '%' ? ni(FLIS.vei, vei, x, y) : velg(FLIS.gress, x, y));
      if (t === '#') legg(bunn, x, y, ni(FLIS.skog, skog, x, y));
      else if (t === '*') {
        const [over, under] = velg(FLIS.tre, x, y);
        legg(bunn, x, y, under);
        legg(topp, x, y - 1, over);
      } else if (t === '&') legg(bunn, x, y, FLIS.busk);
      else if (t === '%') {
        legg(bunn, x, y, FLIS.bronn[1]);
        legg(topp, x, y - 1, FLIS.bronn[0]);
      } else if (t === '?') legg(bunn, x, y, FLIS.skilt);
      else if (t === '+') {
        const g = (a, b) => tegn(a, b) === '+';
        legg(bunn, x, y, gjerde(g(x, y - 1), g(x + 1, y), g(x, y + 1), g(x - 1, y)));
      } else if (FLIS.tak[t]) legg(bunn, x, y, takFlis(t, lik, x, y));
      else if ('|!['.includes(t)) {
        const vegg = (a, b) => '|!['.includes(tegn(a, b) ?? '-');
        const sett = FLIS.vegg[tegn(x, y - 1) === '"' ? 'stein' : 'tre'];
        const flis = !vegg(x - 1, y) ? sett.v : !vegg(x + 1, y) ? sett.h : sett[t] ?? sett.m;
        legg(bunn, x, y, flis);
      } else if (t === ']') legg(bunn, x, y, FLIS.mur);
      else if (t === '=') {
        const k = (a, b) => tegn(a, b) === '=';
        legg(bunn, x, y, FLIS.murkant[!k(x - 1, y) ? 0 : !k(x + 1, y) ? 2 : 1]);
      }
    }
  }
  bunn.endDraw();
  topp.endDraw();
}

// Taket er to rader høyt: øverste rad har mønet, nederste kanten mot veggen.
function takFlis(t, lik, x, y) {
  const sett = FLIS.tak[t];
  const rad = lik(x, y - 1) ? 1 : 0;
  const kol = !lik(x - 1, y) ? 0 : !lik(x + 1, y) ? 2 : 1;
  return sett[rad * 3 + kol];
}
