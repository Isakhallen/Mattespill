import test from 'node:test';
import assert from 'node:assert/strict';
import { lagNavn, gyldigNavn, rensKode, lagNett } from '../src/nett.js';
import { lesNett, skrivNett } from '../src/lagring.js';
import { ADJEKTIV, DYR } from '../src/data/nettnavn.js';

test('navnet er et ord fra hver liste', () => {
  for (let i = 0; i < 200; i++) assert.ok(gyldigNavn(lagNavn()));
  assert.equal(lagNavn(() => 0), `${ADJEKTIV[0]} ${DYR[0]}`);
});

test('nytt navn er aldri det samme som før', () => {
  let n = 0;
  const tilfeldig = () => [0, 0, 0, 0, 0.5, 0.5][n++];
  assert.notEqual(lagNavn(tilfeldig, `${ADJEKTIV[0]} ${DYR[0]}`), `${ADJEKTIV[0]} ${DYR[0]}`);
});

test('ordene er unike og uten mellomrom', () => {
  for (const liste of [ADJEKTIV, DYR]) {
    assert.equal(new Set(liste).size, liste.length);
    assert.ok(liste.every((o) => /^\S+$/.test(o)));
  }
});

test('fritekst er ikke et gyldig navn', () => {
  for (const n of ['Ola', 'Modige', 'Modige Ulv Ola', '', null, 42]) assert.equal(gyldigNavn(n), false);
});

test('klassekoden får store bokstaver og bare bokstaver og tall', () => {
  assert.equal(rensKode('ulv'), 'ULV');
  assert.equal(rensKode(' 1p-b ø '), '1PBØ');
  assert.equal(rensKode('abcdefghijk'), 'ABCDEFGH');
  assert.equal(rensKode('a.b'), '');
  assert.equal(rensKode('x/$#[]'), '');
  assert.equal(rensKode(undefined), '');
});

test('lagNett tåler rare verdier', () => {
  for (const d of [null, {}, { navn: 'Ola', kode: 5 }, 'tull']) {
    const n = lagNett(d);
    assert.ok(gyldigNavn(n.navn));
    assert.equal(n.kode, '');
  }
  assert.deepEqual(lagNett({ navn: 'Modige Ulv', kode: 'ulv1' }), { navn: 'Modige Ulv', kode: 'ULV1' });
});

test('navn og kode lagres for seg', () => {
  const lager = new Map();
  const l = { getItem: (k) => lager.get(k) ?? null, setItem: (k, v) => lager.set(k, v) };
  skrivNett({ navn: 'Kloke Ugle', kode: 'ULV' }, l);
  assert.deepEqual(lesNett(l), { navn: 'Kloke Ugle', kode: 'ULV' });
  assert.equal(lager.has('mattespill'), false);
});
