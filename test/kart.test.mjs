import test from 'node:test';
import assert from 'node:assert/strict';
import { lesKart } from '../src/kart.js';
import { finnVei } from '../src/vei.js';
import testkart from '../src/data/kart/test.js';

test('testkartet leses, og alle gulvruter kan nås uten å gå gjennom vegg', () => {
  const kart = lesKart(testkart.ruter);
  assert.deepEqual(kart.start, { x: 5, y: 3 });
  assert.equal(kart.vegg(-1, 5), true);
  for (let y = 0; y < kart.hoyde; y++) {
    for (let x = 0; x < kart.bredde; x++) {
      if (kart.vegg(x, y)) continue;
      const vei = finnVei(kart, kart.start, { x, y });
      assert.ok(vei, `kan ikke nå ${x},${y}`);
      let forrige = kart.start;
      for (const s of vei) {
        assert.equal(Math.abs(s.x - forrige.x) + Math.abs(s.y - forrige.y), 1);
        assert.equal(kart.vegg(s.x, s.y), false);
        forrige = s;
      }
      assert.deepEqual(forrige, { x, y });
    }
  }
  assert.equal(finnVei(kart, kart.start, { x: 0, y: 0 }), null);
});

test('kart med feil gir tydelig beskjed', () => {
  assert.throws(() => lesKart(['###', '#@']), /tegn/);
  assert.throws(() => lesKart(['###', '#.#']), /mangler/);
});
