import { test } from 'node:test';
import assert from 'node:assert/strict';
import { kortet } from '../src/heltekort.js';
import { lagSpiller, tilLagring } from '../src/spiller.js';
import { lesLyd, skrivLyd } from '../src/lagring.js';

const lager = () => {
  const d = new Map();
  return { getItem: (k) => d.get(k) ?? null, setItem: (k, v) => d.set(k, String(v)) };
};

test('heltekortet viser nivå, utstyr, angrep og bossen', () => {
  const s = lagSpiller({ klasse: 'ridder', erfaring: 30, utstyr: ['rustentSverd', 'laervest', 'sverd'] });
  const k = kortet(s);
  assert.equal(k.tittel, 'Ridder · Nivå 3');
  const linje = Object.fromEntries(k.linjer);
  assert.equal(linje['Våpen'], 'Sverd');
  assert.equal(linje['Rustning'], 'Lærvest');
  assert.match(linje['Angrep'], /Ildkule.*Lyn/);
  assert.doesNotMatch(linje['Angrep'], /Isspyd/);
  s.angrep = ['tungt', 'lyn'];
  assert.equal(Object.fromEntries(kortet(s).linjer)['Angrep'], 'Tungt angrep, Lyn');
  assert.match(k.merke, /Ingen boss/);
  s.bosser = ['tallslukeren'];
  assert.match(kortet(s).merke, /1 av [0-9]+ bosser/);
});

test('seire lagres og tåler rare verdier', () => {
  assert.equal(lagSpiller({}).seire, 0);
  assert.equal(lagSpiller({ seire: -2 }).seire, 0);
  assert.equal(lagSpiller({ seire: 'mange' }).seire, 0);
  assert.equal(lagSpiller(tilLagring(lagSpiller({ seire: 2 }))).seire, 2);
});

test('lyden er på til eleven slår den av', () => {
  const l = lager();
  assert.equal(lesLyd(l), true);
  skrivLyd(false, l);
  assert.equal(lesLyd(l), false);
  skrivLyd(true, l);
  assert.equal(lesLyd(l), true);
  assert.equal(lesLyd({ getItem: () => { throw new Error(); } }), true);
});

test('slåtte bosser lagres, og en gammel seier betyr at Tallslukeren er slått', () => {
  assert.deepEqual(lagSpiller({}).bosser, []);
  assert.deepEqual(lagSpiller({ seire: 1 }).bosser, ['tallslukeren']);
  assert.deepEqual(lagSpiller(tilLagring(lagSpiller({ bosser: ['tallslukeren', 'halvdan'] }))).bosser, ['tallslukeren', 'halvdan']);
});
