import test from 'node:test';
import assert from 'node:assert/strict';
import { lesKart, vedSiden } from '../src/kart.js';
import { finnVei } from '../src/vei.js';
import { KART, FORSTE, kartFor, TRAPP } from '../src/kartliste.js';
import { fiendeFor } from '../src/fiender.js';
import { KISTE, DRIKK, UTSTYR } from '../src/utstyr.js';

const lest = KART.map((k) => ({ data: k, kart: lesKart(k.ruter) }));

test('alle gulvruter i alle kart kan nås fra start uten å gå gjennom vegg', () => {
  for (const { data, kart } of lest) {
    assert.equal(kart.vegg(-1, 5), true);
    for (let y = 0; y < kart.hoyde; y++) {
      for (let x = 0; x < kart.bredde; x++) {
        if (kart.vegg(x, y)) continue;
        const vei = finnVei(kart, kart.start, { x, y });
        assert.ok(vei, `${data.id}: kan ikke nå ${x},${y}`);
        let forrige = kart.start;
        for (const s of vei) {
          assert.equal(Math.abs(s.x - forrige.x) + Math.abs(s.y - forrige.y), 1);
          assert.equal(kart.vegg(s.x, s.y), false);
          forrige = s;
        }
        assert.deepEqual(forrige, { x, y });
      }
    }
  }
});

test('alle tegn i kartene er kjent, og trappene går til et kart med motsatt trapp', () => {
  for (const { data, kart } of lest) {
    for (const m of kart.merker) {
      const trapp = TRAPP[m.tegn];
      assert.ok(fiendeFor(m.tegn) || m.tegn === KISTE || m.tegn === DRIKK || trapp,
        `${data.id}: ukjent tegn «${m.tegn}» i ${m.x},${m.y}`);
      if (!trapp) continue;
      const mal = kartFor(data[trapp.til]);
      assert.ok(mal, `${data.id}: trappen ${m.tegn} går ikke til noe kart`);
      const ut = lesKart(mal.ruter).merker.find((n) => n.tegn === trapp.motsatt);
      assert.ok(ut, `${mal.id} mangler ${trapp.motsatt}`);
    }
  }
  assert.ok(kartFor(FORSTE));
  assert.ok(!fiendeFor(KISTE) && !fiendeFor(DRIKK));
});

test('eventyret har én boss, nok kister til alt utstyret og fiender som blir sterkere', () => {
  const alle = lest.flatMap(({ kart }) => kart.merker);
  const bosser = alle.filter((m) => fiendeFor(m.tegn)?.boss);
  assert.equal(bosser.length, 1);
  assert.ok(alle.filter((m) => m.tegn === KISTE).length >= UTSTYR.length);
  const snitt = ({ kart }) => {
    const f = kart.merker.map((m) => fiendeFor(m.tegn)).filter((t) => t && !t.boss);
    return f.reduce((a, t) => a + t.liv, 0) / f.length;
  };
  assert.ok(snitt(lest[1]) > snitt(lest[0]));
});

test('helten kommer ut av trappen på en ledig gulvrute', () => {
  for (const { kart } of lest) {
    for (const m of kart.merker.filter((n) => TRAPP[n.tegn])) {
      const r = vedSiden(kart, m);
      assert.equal(kart.vegg(r.x, r.y), false);
      assert.ok(!kart.merker.some((n) => n.x === r.x && n.y === r.y));
      assert.equal(Math.abs(r.x - m.x) + Math.abs(r.y - m.y), 1);
    }
  }
});

test('kart med feil gir tydelig beskjed', () => {
  assert.throws(() => lesKart(['###', '#@']), /tegn/);
  assert.throws(() => lesKart(['###', '#.#']), /mangler/);
});
