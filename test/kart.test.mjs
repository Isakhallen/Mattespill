import test from 'node:test';
import assert from 'node:assert/strict';
import { lesKart, vedSiden } from '../src/kart.js';
import { finnVei } from '../src/vei.js';
import { KART, FORSTE, kartFor, lesKartData, UTGANG, utgang, inngangFra } from '../src/kartliste.js';
import { STENGT } from '../src/data/ute.js';
import { fiendeFor } from '../src/fiender.js';
import { KISTE, DRIKK, UTSTYR } from '../src/utstyr.js';

const lest = KART.map((k) => ({ data: k, kart: lesKartData(k) }));
const lestFor = (id) => lest.find((l) => l.data.id === id);

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

test('alle tegn i kartene er kjent, og utgangene går til et kart med vei tilbake', () => {
  for (const { data, kart } of lest) {
    for (const m of kart.merker) {
      const ut = UTGANG.test(m.tegn);
      assert.ok(fiendeFor(m.tegn) || m.tegn === KISTE || m.tegn === DRIKK || ut,
        `${data.id}: ukjent tegn «${m.tegn}» i ${m.x},${m.y}`);
      if (!ut) continue;
      const u = utgang(data, m.tegn);
      assert.ok(u, `${data.id}: utgangen ${m.tegn} i ${m.x},${m.y} går ingen steder`);
      if (!u.kart) {
        assert.ok(u.navn, `${data.id}: stengt port ${m.tegn} mangler navn`);
        continue;
      }
      const mal = kartFor(u.kart);
      assert.ok(mal, `${data.id}: ${m.tegn} går til ukjent kart ${u.kart}`);
      assert.ok(inngangFra(mal, lesKartData(mal), data.id), `${mal.id} har ingen vei tilbake til ${data.id}`);
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
  assert.ok(snitt(lestFor('dypet')) > snitt(lestFor('kjelleren')));
});

test('helten kommer ut av trapper og porter på en ledig gulvrute', () => {
  for (const { kart } of lest) {
    for (const m of kart.merker.filter((n) => UTGANG.test(n.tegn))) {
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

test('verdenskartet: kjente tegn, porter med navn og eventyret starter i landsbyen', () => {
  const { data, kart } = lestFor('verden');
  assert.equal(FORSTE, 'verden');
  assert.equal(data.stil, 'ute');
  for (const [y, linje] of data.ruter.entries()) {
    for (const [x, t] of [...linje].entries()) {
      const merke = kart.merker.some((m) => m.x === x && m.y === y);
      assert.ok('.:@'.includes(t) || STENGT.includes(t) || merke, `verden: ukjent tegn «${t}» i ${x},${y}`);
    }
  }
  const porter = new Set(kart.merker.filter((m) => /[0-9]/.test(m.tegn)).map((m) => m.tegn));
  assert.deepEqual([...porter].sort(), Object.keys(data.innganger).sort());
  assert.equal(utgang(data, '1').kart, 'kjelleren');
  // Helten kommer fra kjelleren rett under porten.
  const p = inngangFra(data, kart, 'kjelleren');
  assert.equal(p.tegn, '1');
  assert.deepEqual(vedSiden(kart, p), { x: p.x, y: p.y + 1 });
});
