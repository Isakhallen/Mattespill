import test from 'node:test';
import assert from 'node:assert/strict';
import { VARER, TING, DRAKTER, MAKS_TING, vareFor } from '../src/varer.js';
import { UTSTYR } from '../src/utstyr.js';
import { hylle, kjop, selg, taPaa, rabatt, rabattPris, rabattOppgave, salgspris } from '../src/butikk.js';
import { lagSpiller, tilLagring, velgKlasse } from '../src/spiller.js';
import { kampGull, krukkeGull, kisteGull, maksLiv, skadeBonus } from '../src/vekst.js';
import { FIENDER, lagFiende } from '../src/fiender.js';
import { tingFor, nyKamp, runde, motFiende } from '../src/kamp.js';
import { STIGE } from '../src/oppgaver.js';

const helt = (d = {}) => {
  const s = lagSpiller({ klasse: 'ridder', ...d });
  velgKlasse(s, 'ridder');
  return s;
};

test('alle fiender gir gull, og gullet vokser med nivået', () => {
  for (const f of FIENDER) {
    assert.ok(f.gull > 0, f.id);
    assert.ok(lagFiende(f, 5).gull > lagFiende(f, 1).gull, f.id);
  }
  const g = lagFiende(FIENDER[0], 1);
  assert.equal(kampGull(g, { utfall: 'seier', rette: 4 }), g.gull + 4);
  assert.equal(kampGull(g, { utfall: 'tap', rette: 2 }), 2);
  assert.ok(krukkeGull(3) > krukkeGull(1) && kisteGull(1) > krukkeGull(1));
});

test('alle varer har en pris som går opp i 10, så rabatt og salg gir hele tall', () => {
  assert.equal(VARER.length, UTSTYR.length + TING.length + DRAKTER.length);
  for (const v of VARER) {
    assert.ok(v.pris > 0 && v.pris % 10 === 0, v.id);
    assert.ok(Number.isInteger(salgspris(v)), v.id);
    for (const trinn of STIGE.map((t) => t.trinn)) {
      const o = rabattOppgave(v, trinn);
      assert.ok(Number.isInteger(o.svar) && o.svar === rabattPris(v.pris, trinn) && o.svar < v.pris, v.id);
      assert.match(o.tekst, /gull/);
    }
  }
});

test('rabatten følger eleven: halv pris først, så 10 % og 20 %', () => {
  assert.equal(rabatt(1), 50);
  assert.equal(rabatt(3), 10);
  assert.equal(rabatt(8), 20);
  assert.match(rabattOppgave(vareFor('sverd'), 1).tekst, /halv pris/);
  assert.doesNotMatch(rabattOppgave(vareFor('sverd'), 1).tekst, /%/);
  assert.equal(rabattOppgave(vareFor('sverd'), 6).svar, 32);
});

test('kjøp trekker gull og gir varen, men bare når eleven har råd', () => {
  const s = helt({ gull: 30 });
  assert.equal(kjop(s, 'sverd'), false);
  assert.equal(s.gull, 30);
  assert.equal(kjop(s, 'sverd', 32), false);
  assert.equal(kjop(s, 'rustentSverd'), true);
  assert.equal(s.gull, 10);
  assert.deepEqual(s.utstyr, ['rustentSverd']);
  assert.equal(kjop(s, 'rustentSverd'), false, 'utstyr kjøpes bare én gang');
  s.gull = 1000;
  for (let i = 0; i < MAKS_TING; i++) assert.ok(kjop(s, 'drikk'));
  assert.equal(kjop(s, 'drikk'), false, 'høyst MAKS_TING');
  assert.equal(hylle(s).find((h) => h.id === 'drikk').fullt, true);
});

test('rustning og drakt endrer livet, og drakten bytter figur', () => {
  const s = helt({ gull: 1000 });
  const liv = maksLiv(s);
  kjop(s, 'laervest');
  assert.equal(maksLiv(s), liv + 6);
  assert.equal(s.liv, liv + 6);
  const skade = skadeBonus(s);
  kjop(s, 'englekappe');
  assert.equal(s.drakt, 'englekappe');
  assert.equal(s.figur, 'angel');
  assert.equal(skadeBonus(s), skade + 2);
  assert.equal(maksLiv(s), liv + 11);
  taPaa(s, null);
  assert.equal(s.figur, 'knight_m');
  assert.equal(s.liv, maksLiv(s));
  assert.equal(taPaa(s, 'dvergdrakt'), false, 'bare drakter eleven eier');
  taPaa(s, 'englekappe');
  const gull = s.gull;
  assert.ok(selg(s, 'englekappe'));
  assert.equal(s.gull, gull + 60);
  assert.equal(s.drakt, null);
  assert.equal(s.figur, 'knight_m');
  assert.equal(selg(s, 'englekappe'), false);
});

test('gull, ting og drakter lagres, og rare verdier tåles', () => {
  const s = helt({ gull: 100 });
  kjop(s, 'gresskardrakt');
  kjop(s, 'bombe');
  const t = lagSpiller(JSON.parse(JSON.stringify(tilLagring(s))));
  assert.equal(t.gull, 0);
  assert.equal(t.ting.bombe, 1);
  assert.equal(t.drakt, 'gresskardrakt');
  assert.equal(t.figur, 'pumpkin_dude');
  const rar = lagSpiller({ gull: -5, ting: { drikk: 99, bombe: 'x' }, drakter: ['tull'], drakt: 'tull' });
  assert.equal(rar.gull, 0);
  assert.deepEqual(rar.ting, { drikk: 0, bombe: 0 });
  assert.equal(rar.drakt, null);
});

test('ting i kampen: drikken gir fullt liv, bomben skader, og fienden slår', () => {
  const s = helt();
  assert.deepEqual(tingFor(s, 0, 40), []);
  s.ting = { drikk: 1, bombe: 2 };
  const [drikk, bombe] = tingFor(s, 10, 40);
  assert.equal(bombe.skade, 24); // 12 og dobbel bonus
  assert.equal(bombe.antall, 2);
  const goblin = FIENDER.find((f) => f.id === 'goblin');
  let k = runde(nyKamp(10, 50, 3, 40), motFiende(drikk, goblin), true);
  assert.equal(k.heltLiv, 40 - 3);
  k = runde(nyKamp(10, 50, 3, 40), motFiende(bombe, goblin), true);
  assert.equal(k.fiendeLiv, 50 - 48, 'goblinen tåler ikke ild');
  assert.equal(k.heltLiv, 7);
});
