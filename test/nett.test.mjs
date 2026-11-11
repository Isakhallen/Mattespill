import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { lagNavn, gyldigNavn, rensKode, lagNett, navnTall, navnFra, radFor, lesRad, KODE_MIN, KODE_MAKS } from '../src/nett.js';
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
  assert.equal(rensKode(' 1p-b ø '), '1PB');
  assert.equal(rensKode('abcdefghijk'), 'ABCDEFGH');
  assert.equal(rensKode('a.b'), '');
  assert.equal(rensKode('x/$#[]'), '');
  assert.equal(rensKode(undefined), '');
});

test('navnet blir to tall og tilbake', () => {
  for (let i = 0; i < 50; i++) {
    const navn = lagNavn();
    assert.equal(navnFra(navnTall(navn)), navn);
  }
  assert.equal(navnFra({ a: 99, d: 0 }), null);
  assert.equal(navnFra(undefined), null);
});

test('reglene i Firebase har samme antall ord og samme kode som spillet', () => {
  const regler = readFileSync(new URL('../database.rules.json', import.meta.url), 'utf8');
  assert.equal(ADJEKTIV.length, 25);
  assert.equal(DYR.length, 25);
  assert.match(regler, /newData\.val\(\) < 25/);
  assert.match(regler, /\^\[A-Z0-9\]\{3,8\}\$/);
  assert.equal(KODE_MIN, 3);
  assert.equal(KODE_MAKS, 8);
});

test('raden som sendes, har bare tall og figur, og kan leses tilbake', () => {
  const rad = radFor('Kloke Ugle', 'elf_f', 4, 12, 7);
  assert.deepEqual(Object.keys(rad).sort(), ['a', 'd', 'figur', 'nivaa', 'x', 'y']);
  assert.ok(!JSON.stringify(rad).includes('Ugle'));
  assert.deepEqual(lesRad(rad), { navn: 'Kloke Ugle', figur: 'elf_f', nivaa: 4, x: 12, y: 7 });
});

test('rare rader fra Firebase vises ikke', () => {
  const god = radFor('Kloke Ugle', 'elf_f', 4, 12, 7);
  for (const feil of [null, {}, { ...god, a: 30 }, { ...god, nivaa: 0 }, { ...god, x: 1.5 }, { ...god, figur: 7 }]) {
    assert.equal(lesRad(feil), null);
  }
  assert.equal(lesRad(god, () => false), null);
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
