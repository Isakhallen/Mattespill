import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ANGREP, MAKS_ANGREP, nyKamp, oppgavetrinn, runde, skadeMot, vistSkade, virkning, hvilEtter, motFiende, medTall } from '../src/kamp.js';
import { boka, bytt, verdi } from '../src/angrepsbok.js';
import { lagSpiller, tilLagring } from '../src/spiller.js';
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
    [treff.heltLiv, treff.fiendeLiv, treff.traff, treff.slag, treff.heling, treff.utfall],
    [18, 12 - lett.skade, lett.skade, 2, 0, null],
  );
  assert.deepEqual(treff.merker, {});
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
  (kart.nivaa === 1 ? [1, 2, 3] : kart.nivaa < 4 ? [4, 5, 6] : [0, 1, 2].map((d) => kart.nivaa + d)).flatMap((n) =>
    KLASSER.map((kl) => lagSpiller({ erfaring: grense(n), klasse: kl.id, utstyr: UTSTYR_PAA[Math.min(n, 6)] })),
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
    for (const t of [...(f.foer ?? []), ...(f.igjen ?? [])]) assert.doesNotMatch(t, /(^|\s)(svak|is|ild|lyn|gift|hellig|jord|trolldom)/i);
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


const angrep = (id) => ANGREP.find((a) => a.id === id);

test('12–15 angrep med eget navn, element og oppgave, og de sterkeste hviler', () => {
  assert.ok(ANGREP.length >= 12 && ANGREP.length <= 15);
  assert.equal(new Set(ANGREP.map((a) => a.id)).size, ANGREP.length);
  for (const a of ANGREP) {
    assert.ok(a.element && a.navn, a.id);
    assert.ok(a.type || a.trinn !== undefined, `${a.id} mangler oppgave`);
    if (a.virker) assert.ok(a.runder >= 1 && a.hvile >= 1, a.id);
    if ((a.kraft ?? 1) > 1) assert.ok(a.hvile >= 1, `${a.id} er sterk, men hviler ikke`);
  }
});

test('gift og brann skader hver tur, og merket går over', () => {
  const pil = medTall(angrep('giftpil'), 1);
  assert.ok(pil.prikk >= 1);
  let k = runde(nyKamp(30, 100, 3), pil, true);
  assert.equal(k.fiendeLiv, 100 - pil.skade - pil.prikk);
  assert.equal(k.mellom.fiendeLiv, 100 - pil.skade);
  assert.deepEqual(k.prikker, [{ navn: 'gift', skade: pil.prikk }]);
  for (let i = 1; i < pil.runder; i++) k = runde(k, { skade: 0 }, false);
  assert.equal(k.fiendeLiv, 100 - pil.skade - pil.runder * pil.prikk);
  assert.deepEqual(k.merker, {});
  assert.deepEqual(runde(k, { skade: 0 }, false).prikker, []);
  assert.equal(runde(nyKamp(30, 100, 3), pil, false).merker.gift, undefined);
  // Gift kan vinne kampen, og da slår ikke fienden.
  const slutt = runde(nyKamp(30, pil.skade + 1, 3), pil, true);
  assert.deepEqual([slutt.utfall, slutt.slag], ['seier', 0]);
});

test('frys gjør at fienden står over, svekket og skjold gir halve slag', () => {
  const k = runde(nyKamp(30, 100, 8), medTall(angrep('frost'), 5), true);
  assert.deepEqual([k.frosset, k.slag, k.heltLiv], [true, 0, 30]);
  assert.equal(runde(k, { skade: 1 }, true).slag, 8);
  const skjelv = runde(nyKamp(30, 100, 8), medTall(angrep('jordskjelv'), 12), true);
  assert.equal(skjelv.slag, 4);
  assert.equal(runde(skjelv, { skade: 1 }, false).slag, 4);
  const skjold = runde(nyKamp(30, 100, 8), medTall(angrep('skjold'), 1), true);
  assert.deepEqual([skjold.traff, skjold.slag, skjold.aktive], [0, 4, ['skjold']]);
  const begge = runde({ ...skjelv, merker: { ...skjelv.merker, skjold: { runder: 2 } } }, { skade: 1 }, true);
  assert.equal(begge.slag, 2);
});

test('helbred og vampyrbitt gir liv, men aldri mer enn fullt', () => {
  const helbred = medTall(angrep('helbred'), 4);
  const k = runde(nyKamp(10, 50, 3, 40), helbred, true);
  assert.deepEqual([k.traff, k.heling, k.fiendeLiv, k.heltLiv], [0, helbred.skade, 50, 10 + helbred.skade - 3]);
  assert.equal(runde(nyKamp(39, 50, 3, 40), helbred, true).heling, 1);
  assert.equal(runde(nyKamp(10, 50, 3, 40), helbred, false).heling, 0);
  assert.equal(runde(nyKamp(10, 50, 3, 40), { ...angrep('vampyrbitt'), skade: 10 }, true).heling, 5);
  // Fiendens svakheter og det den tåler, gjelder ikke helbred.
  assert.equal(motFiende(helbred, FIENDER.find((f) => f.boss)).skade, helbred.skade);
});

test('svakheter gjelder også gift og brann', () => {
  const pil = medTall(angrep('giftpil'), 2);
  assert.equal(motFiende(pil, fiendeFor('g')).prikk, pil.prikk * 2);
  assert.ok(motFiende(pil, FIENDER.find((f) => f.boss)).prikk < pil.prikk);
});

test('angrepsboka: alle angrep står der, låste med nivå, og eleven velger høyst seks', () => {
  const s = lagSpiller({ erfaring: grense(5) });
  const b = boka(s);
  assert.equal(b.length, ANGREP.length);
  assert.deepEqual(b.find((a) => a.id === 'jordskjelv').linjer, ['Nivå 9']);
  assert.ok(b.filter((a) => a.valgt).length <= MAKS_ANGREP);
  for (const a of b) for (const l of a.linjer) assert.doesNotMatch(l, /svak|tåler|element/i);
  assert.ok(b.find((a) => a.id === 'tungt').linjer.some((l) => /skade/.test(l)));
  let v = ['lett'];
  assert.deepEqual(bytt(v, 'lett'), ['lett']); // minst ett
  for (const id of ['meteor', 'tungt', 'lyn', 'ildkule', 'storm']) v = bytt(v, id);
  assert.deepEqual(v, ['lett', 'tungt', 'ildkule', 'lyn', 'storm', 'meteor']);
  assert.equal(bytt(v, 'frost'), v); // fullt
  assert.deepEqual(bytt(v, 'lyn'), ['lett', 'tungt', 'ildkule', 'storm', 'meteor']);
  assert.equal(verdi({ heler: true, skade: 7 }), '+7 liv');
  assert.equal(verdi({ ...angrep('skjold'), skade: 7 }), 'Halve slag');
  // Valget lagres og tåler rare verdier.
  s.angrep = ['tungt', 'meteor'];
  assert.deepEqual(lagSpiller(tilLagring(s)).angrep, ['tungt', 'meteor']);
  assert.deepEqual(lagSpiller({ angrep: ['x', 3] }).angrep, ['lett', 'tungt']);
  assert.equal(lagSpiller({ erfaring: 1e6, angrep: ANGREP.map((a) => a.id) }).angrep.length, MAKS_ANGREP);
});
