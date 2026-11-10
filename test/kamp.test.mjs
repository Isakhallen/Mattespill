import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ANGREP, nyKamp, oppgavetrinn, runde } from '../src/kamp.js';
import { FIENDER, fiendeFor } from '../src/fiender.js';
import { lesKart } from '../src/kart.js';
import { MAKS_TRINN } from '../src/oppgaver.js';
import { nyTilstand, oppdater } from '../src/tilpasning.js';
import helt from '../src/data/helt.js';
import testkart from '../src/data/kart/test.js';

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

test('alle fiender kan slås, også av en elev som svarer feil annenhver gang', () => {
  for (const f of FIENDER) {
    let fiendeLiv = f.liv; // fienden beholder skaden når helten må hvile
    let tilstand = nyTilstand(6);
    let runder = 0;
    let hvil = 0;
    while (fiendeLiv > 0) {
      let k = nyKamp(helt.maksLiv, fiendeLiv, f.skade);
      while (!k.utfall) {
        const rett = runder++ % 2 === 0;
        tilstand = oppdater(tilstand, rett, MAKS_TRINN);
        k = runde(k, lett, rett);
      }
      fiendeLiv = k.fiendeLiv;
      if (k.utfall === 'tap') hvil++;
      assert.ok(runder < 100);
    }
    assert.ok(hvil <= 1, `${f.id}: helten måtte hvile ${hvil} ganger`);
  }
});

test('fiendene har egne bokstaver og figurer som finnes i atlaset', () => {
  const atlas = readFileSync(new URL('../assets/dungeon.json', import.meta.url), 'utf8');
  assert.equal(new Set(FIENDER.map((f) => f.tegn)).size, FIENDER.length);
  for (const f of [...FIENDER, helt]) {
    for (const del of ['idle', 'run']) {
      assert.ok(atlas.includes(`"${f.figur}_${del}_anim_f3"`), `${f.figur} mangler ${del}`);
    }
  }
});

test('alle bokstaver i testkartet er fiender', () => {
  const kart = lesKart(testkart.ruter);
  assert.ok(kart.merker.length >= 3);
  for (const m of kart.merker) {
    assert.ok(fiendeFor(m.tegn), `ukjent tegn «${m.tegn}» i ${m.x},${m.y}`);
    assert.notDeepEqual({ x: m.x, y: m.y }, kart.start);
  }
});
