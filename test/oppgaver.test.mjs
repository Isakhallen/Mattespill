import test from 'node:test';
import assert from 'node:assert/strict';
import { STIGE, MAKS_TRINN, lagOppgave, tolkSvar, erRett } from '../src/oppgaver.js';
import { nyTilstand, oppdater } from '../src/tilpasning.js';
import { medFro, tall } from '../src/hjelp.js';

test('stigen har 12 trinn uten hull og starter med halvparten av 10', () => {
  assert.equal(MAKS_TRINN, 12);
  for (let i = 0; i < MAKS_TRINN; i++) assert.equal(STIGE[i]?.trinn, i + 1);
  const rnd = medFro(7);
  const tekster = new Set();
  for (let i = 0; i < 300; i++) tekster.add(lagOppgave(1, rnd).tekst);
  assert.ok(tekster.has('Hva er halvparten av 10?'));
});

test('alle trinn gir pene oppgaver med riktig fasit', () => {
  const rnd = medFro(42);
  for (let trinn = 1; trinn <= MAKS_TRINN; trinn++) {
    const tekster = new Set();
    let forrige = null;
    for (let i = 0; i < 400; i++) {
      const o = lagOppgave(trinn, rnd, forrige);
      assert.notEqual(o.tekst, forrige, 'samme oppgave to ganger på rad');
      forrige = o.tekst;
      tekster.add(o.tekst);
      assert.ok(o.tekst.length > 5 && o.tekst.length <= 90, o.tekst);
      assert.ok(Number.isFinite(o.svar) && o.svar >= 0, o.tekst);
      assert.ok(Math.abs(o.svar * 100 - Math.round(o.svar * 100)) < 1e-9, `${o.tekst} -> ${o.svar}`);
      assert.ok(o.forklaring.length > 5, o.tekst);
      assert.ok(!/NaN|undefined/.test(o.tekst + o.forklaring), o.tekst + ' ' + o.forklaring);
      assert.ok(erRett(o, tall(o.svar)), o.tekst);
      assert.ok(erRett(o, `${tall(o.svar)} ${o.enhet}`), o.tekst);
      assert.ok(!erRett(o, tall(o.svar + 1)), o.tekst);
    }
    assert.ok(tekster.size >= 10, `trinn ${trinn} har bare ${tekster.size} ulike oppgaver`);
  }
});

test('svar tolkes med komma, punktum og enhet', () => {
  assert.equal(tolkSvar('1,25'), 1.25);
  assert.equal(tolkSvar('1.25'), 1.25);
  assert.equal(tolkSvar(' 25 % '), 25);
  assert.equal(tolkSvar('220 gull'), 220);
  assert.equal(tolkSvar(''), null);
  assert.equal(tolkSvar('vet ikke'), null);
});

test('tilpasning: 2 rette opp, 2 feil ned, og aldri utenfor stigen', () => {
  let t = nyTilstand(3);
  t = oppdater(t, true, 12);
  assert.equal(t.trinn, 3);
  t = oppdater(t, true, 12);
  assert.equal(t.trinn, 4);
  t = oppdater(t, false, 12);
  t = oppdater(t, true, 12);
  t = oppdater(t, false, 12);
  assert.equal(t.trinn, 4, 'feil, rett, feil skal ikke flytte eleven');
  t = oppdater(t, false, 12);
  assert.equal(t.trinn, 3);
  assert.equal(oppdater(oppdater(nyTilstand(1), false, 12), false, 12).trinn, 1);
  assert.equal(oppdater(oppdater(nyTilstand(12), true, 12), true, 12).trinn, 12);
});
