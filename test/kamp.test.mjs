import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ANGREP, nyKamp, oppgavetrinn, runde, skadeMot, vistSkade, virkning, hvilEtter } from '../src/kamp.js';
import { lagSpiller } from '../src/spiller.js';
import { grense, nivaa, maksLiv, skadeBonus } from '../src/vekst.js';
import { KLASSER } from '../src/klasser.js';
import { FIENDER, fiendeFor, fiendeNivaa, lagFiende, tilNivaa } from '../src/fiender.js';
import { KART } from '../src/kartliste.js';
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

// Helten slik den er når den kommer til kartet: nivå og utstyr fra kistene.
const UTSTYR_PAA = { 1: [], 2: ['rustentSverd'], 3: ['rustentSverd', 'laervest'], 4: ['sverd', 'ringbrynje'], 5: ['sverd', 'ringbrynje'], 6: ['gullsverd', 'ringbrynje'] };
const heltePaa = (kart) =>
  (kart.nivaa === 1 ? [1, 2, 3] : [4, 5, 6]).flatMap((n) =>
    KLASSER.map((kl) => lagSpiller({ erfaring: grense(n), klasse: kl.id, utstyr: UTSTYR_PAA[n] })),
  );
const fienderI = (kart) => [...new Set(kart.ruter.join('').split('').map(fiendeFor).filter(Boolean))];
const tungtFor = (s) => Math.round(tungt.skade * (1 + skadeBonus(s) / 10));

test('fiendene tåler flere slag, også når helten vokser', () => {
  for (const kart of KART) {
    for (const s of heltePaa(kart)) {
      for (const type of fienderI(kart)) {
        const f = lagFiende(type, fiendeNivaa(kart.nivaa, nivaa(s.erfaring)));
        const slag = Math.ceil(f.liv / tungtFor(s));
        const [min, maks] = type.boss ? [6, 12] : [2, 6];
        assert.ok(slag >= min && slag <= maks, `${type.id} på nivå ${f.nivaa}: ${slag} slag`);
      }
    }
  }
});

test('alle fiender kan slås, også av en elev som svarer feil annenhver gang', () => {
  for (const kart of KART) {
    for (const s of heltePaa(kart)) {
      for (const type of fienderI(kart)) {
        const f = lagFiende(type, fiendeNivaa(kart.nivaa, nivaa(s.erfaring)));
        let fiendeLiv = f.liv; // fienden beholder skaden når helten må hvile
        let runder = 0;
        let hvil = 0;
        while (fiendeLiv > 0) {
          let k = nyKamp(maksLiv(s), fiendeLiv, f.skade);
          while (!k.utfall) k = runde(k, { skade: tungtFor(s) }, runder++ % 2 === 0);
          fiendeLiv = k.fiendeLiv;
          if (k.utfall === 'tap') hvil++;
          assert.ok(runder < 100);
        }
        assert.ok(hvil <= (type.boss ? 2 : 1), `${type.id}: helten måtte hvile ${hvil} ganger`);
      }
    }
  }
});

test('fiendene følger helten, men aldri mer enn ett nivå under', () => {
  assert.equal(fiendeNivaa(3, 1), 3);
  assert.equal(fiendeNivaa(3, 6), 5);
  assert.equal(fiendeNivaa(undefined, 1), 1);
  const goblin = fiendeFor('g');
  const [l1, l5] = [lagFiende(goblin, 1), lagFiende(goblin, 5)];
  assert.deepEqual([l1.maks, l1.liv, l1.skade, l1.erfaring], [goblin.liv, goblin.liv, goblin.skade, goblin.erfaring]);
  assert.ok(l5.maks > l1.maks && l5.skade > l1.skade && l5.erfaring > l1.erfaring);
  const skadet = tilNivaa({ ...l1, liv: Math.round(l1.maks / 2) }, 5);
  assert.equal(skadet.nivaa, 5);
  assert.ok(Math.abs(skadet.liv - l5.maks / 2) <= 1);
  assert.equal(tilNivaa(l5, 3), l5);
});

test('svakheter gir dobbel skade og det fienden tåler halv, uten at det står noe', () => {
  const elementer = new Set(ANGREP.map((a) => a.element));
  for (const a of ANGREP) assert.ok(a.element, `${a.id} mangler element`);
  for (const f of FIENDER) {
    assert.ok(f.svak?.length, `${f.id} har ingen svakhet`);
    for (const e of [...f.svak, ...(f.sterk ?? [])]) assert.ok(elementer.has(e), `${f.id}: ${e}`);
    for (const t of [...(f.foer ?? []), ...(f.igjen ?? [])]) assert.doesNotMatch(t, /(^|\s)(svak|is|ild|lyn|trolldom)/i);
  }
  const imp = fiendeFor('i');
  const is = { id: 'x', element: 'is', skade: 10 };
  assert.equal(virkning(is, imp), 2);
  assert.equal(skadeMot(is, imp), 20);
  assert.equal(skadeMot({ ...is, element: 'ild' }, imp), 5);
  assert.equal(skadeMot({ ...is, element: 'slag' }, imp), 10);
});

test('skjoldet: lette slag gir 1, og det står på knappen', () => {
  const boss = FIENDER.find((f) => f.boss);
  assert.equal(skadeMot({ ...lett }, boss), 1);
  assert.equal(vistSkade({ ...lett }, boss), 1);
  assert.equal(skadeMot({ ...tungt }, boss), tungt.skade);
  assert.equal(skadeMot({ ...lett }, FIENDER[0]), lett.skade);
});

test('de sterkeste angrepene hviler etter et treff, men ikke etter bom', () => {
  const meteor = ANGREP.find((a) => a.id === 'meteor');
  assert.ok(meteor.hvile >= 1 && meteor.kraft > 1);
  assert.deepEqual(hvilEtter({}, meteor, false), {});
  let h = hvilEtter({}, meteor, true);
  assert.deepEqual(h, { meteor: meteor.hvile });
  for (let i = 0; i < meteor.hvile; i++) h = hvilEtter(h, tungt, true);
  assert.deepEqual(h, {});
  assert.deepEqual(hvilEtter({}, tungt, true), {});
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

