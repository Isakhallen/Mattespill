import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ANGREP, nyKamp, oppgavetrinn, runde, skadeMot } from '../src/kamp.js';
import { lagSpiller } from '../src/spiller.js';
import { grense, maksLiv, skadeBonus } from '../src/vekst.js';
import { KLASSER } from '../src/klasser.js';
import { FIENDER } from '../src/fiender.js';
import { MAKS_TRINN } from '../src/oppgaver.js';
import helt from '../src/data/helt.js';

const [lett, tungt] = ANGREP;

test('lett angrep gir lettere oppgave og mindre skade enn tungt', () => {
  assert.ok(lett.skade < tungt.skade);
  assert.equal(oppgavetrinn(tungt, 7), 7);
  assert.ok(oppgavetrinn(lett, 7) < 7);
  for (let trinn = 1; trinn <= MAKS_TRINN; trinn++) {
    for (const a of ANGREP) {
      const t = oppgavetrinn(a, trinn);
      assert.ok(t >= 1 && t <= MAKS_TRINN, `${a.id} på trinn ${trinn} gir ${t}`);
    }
  }
});

test('riktig svar treffer, feil svar bommer, og fienden slår tilbake', () => {
  const start = nyKamp(20, 12, 2);
  const treff = runde(start, lett, true);
  assert.deepEqual(
    { ...treff },
    { heltLiv: 18, fiendeLiv: 12 - lett.skade, fiendeSkade: 2, traff: lett.skade, slag: 2, utfall: null },
  );
  const bom = runde(start, tungt, false);
  assert.equal(bom.fiendeLiv, 12);
  assert.equal(bom.traff, 0);
  assert.equal(bom.heltLiv, 18);
});

test('fienden slår ikke når den er slått, og livet går aldri under 0', () => {
  const seier = runde(nyKamp(1, 4, 5), tungt, true);
  assert.deepEqual([seier.fiendeLiv, seier.heltLiv, seier.slag, seier.utfall], [0, 1, 0, 'seier']);
  const tap = runde(nyKamp(1, 4, 5), tungt, false);
  assert.deepEqual([tap.fiendeLiv, tap.heltLiv, tap.utfall], [4, 0, 'tap']);
});

// Fiendene i Dypet møter en helt på nivå 4, og bossen en helt på nivå 5 (tungt angrep).
const nivaaMot = (f) => (f.boss ? 5 : f.liv > 18 || f.skade > 3 ? 4 : 1);

test('alle fiender kan slås, også av en elev som svarer feil annenhver gang', () => {
  for (const f of FIENDER) {
    const n = nivaaMot(f);
    const s = lagSpiller({ erfaring: grense(n) });
    const angrep = n === 1 ? lett : { ...tungt, skade: tungt.skade + skadeBonus(s) };
    const skade = skadeMot(angrep, f);
    let fiendeLiv = f.liv; // fienden beholder skaden når helten må hvile
    let runder = 0;
    let hvil = 0;
    while (fiendeLiv > 0) {
      let k = nyKamp(maksLiv(s), fiendeLiv, f.skade);
      while (!k.utfall) k = runde(k, { skade }, runder++ % 2 === 0);
      fiendeLiv = k.fiendeLiv;
      if (k.utfall === 'tap') hvil++;
      assert.ok(runder < 100);
    }
    assert.ok(hvil <= (f.boss ? 2 : 1), `${f.id}: helten måtte hvile ${hvil} ganger`);
  }
});

test('skjoldet: lette slag gir 1, typeangrep gir 2 ekstra', () => {
  const boss = FIENDER.find((f) => f.boss);
  assert.equal(skadeMot({ ...lett }, boss), 1);
  assert.equal(skadeMot({ ...tungt }, boss), tungt.skade);
  assert.equal(skadeMot({ id: 'x', type: 'del', skade: 6 }, boss), 8);
  assert.equal(skadeMot({ ...lett }, FIENDER[0]), lett.skade);
});


test('fiendene har egne bokstaver og figurer som finnes i atlaset', () => {
  const atlas = readFileSync(new URL('../assets/dungeon.json', import.meta.url), 'utf8');
  assert.equal(new Set(FIENDER.map((f) => f.tegn)).size, FIENDER.length);
  for (const f of [...FIENDER, helt, ...KLASSER]) {
    for (const del of ['idle', 'run']) {
      assert.ok(atlas.includes(`"${f.figur}_${del}_anim_f3"`), `${f.figur} mangler ${del}`);
    }
  }
});

