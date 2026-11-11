import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { FOLK, folkFor } from '../src/folkeslag.js';
import { KLASSER } from '../src/klasser.js';
import { ANGREP, EGNE, angrepFor, standardValg, medEgne, nyKamp, runde, motFiende, tingFor, ELEMENTER } from '../src/kamp.js';
import { kodeFor, utseendeFra, lesValg, tilfeldig, VALG } from '../src/utseende.js';
import { lagSpiller, tilLagring, velgHelt, utseendeFor } from '../src/spiller.js';
import { maksLiv, skadeBonus, kampErfaring, giErfaring, grense } from '../src/vekst.js';
import { kjop, selg, hodePaa } from '../src/butikk.js';
import { lesRad, radFor } from '../src/nett.js';

const helt = (folk, klasse, d = {}) => {
  const s = lagSpiller(d);
  velgHelt(s, { folk, klasse });
  return s;
};

test('hver klasse og hvert folk har det de trenger, og egne angrep hører til noen', () => {
  for (const k of KLASSER) {
    const a = ANGREP.find((x) => x.id === k.angrep);
    assert.equal(a?.klasse, k.id, k.id);
  }
  for (const f of FOLK) assert.ok(f.hud.length && f.om, f.id);
  for (const a of EGNE) assert.ok(KLASSER.some((k) => k.id === a.klasse) || folkFor(a.folk), a.id);
  assert.equal(new Set(KLASSER.map((k) => k.id)).size, 12);
  assert.equal(FOLK.length, 9);
});

test('koden for utseendet går fram og tilbake, passer i Firebase og avviser rare koder', () => {
  const regel = JSON.parse(readFileSync(new URL('../database.rules.json', import.meta.url), 'utf8'));
  const figur = regel.rules.rom.$kode.$kart.$uid.figur['.validate'];
  assert.match(figur, /\[a-z_\]\{1,24\}/);
  let n = 0;
  const tall = () => ((n = (n * 7 + 3) % 101) / 101);
  for (const f of FOLK) {
    for (const k of KLASSER) {
      const s = helt(f.id, k.id, { utstyr: ['gullsverd'] });
      s.utseende = { ...s.utseende, ...tilfeldig(f, tall) };
      const u = utseendeFor(s);
      const kode = kodeFor(u);
      assert.match(kode, /^[a-z_]{1,24}$/);
      assert.deepEqual(utseendeFra(kode), u);
    }
  }
  for (const rar of ['h_', 'h_zzzzzzzzzzzzzz', 'knight_m', 'h_aaaaaaaaaaaaaaa', null]) assert.equal(utseendeFra(rar), null, rar);
  assert.deepEqual(Object.keys(lesValg({ hud: 99, haar: 2 })), VALG);
  assert.equal(lesValg({ hud: 99, haar: 2 }).hud, 0);
  // Klassen ser helten med det nye utseendet.
  const s = helt('tiefling', 'tyv');
  assert.equal(lesRad(radFor('Modige Ulv', s.figur, 1, 3, 4), (f) => !!utseendeFra(f))?.figur, s.figur);
});

test('egne angrep: bare for klassen og folket, med fra start og byttes når helten endres', () => {
  const s = helt('drakefolk', 'barbar');
  assert.deepEqual(s.angrep, ['lett', 'tungt', 'raseri', 'drakepust']);
  assert.deepEqual(angrepFor(1, 1, 0, s.angrep, s).map((a) => a.id), s.angrep);
  assert.deepEqual(angrepFor(1, 1, 0, ['raseri'], { klasse: 'tyv' }).map((a) => a.id), ['lett', 'tungt', 'snikangrep']);
  assert.deepEqual(standardValg(1), ['lett', 'tungt']);
  velgHelt(s, { folk: 'ork', klasse: 'tyv' });
  assert.deepEqual(s.angrep, ['lett', 'tungt', 'snikangrep']);
  const full = medEgne(['lett', 'tungt', 'ildkule', 'giftpil', 'lyn', 'skjold'], 3, { klasse: 'prest' });
  assert.equal(full.length, 6);
  assert.ok(full.includes('velsignelse') && !full.includes('skjold'));
  assert.ok(giErfaring(0, grense(9), s).nyeAngrep.every((a) => !a.klasse && !a.folk));
});

test('raseri og jegermerke gir 50 % mer, og snikangrep dobbelt når fienden har et merke', () => {
  const slag = { id: 'tungt', skade: 10 };
  let k = runde(nyKamp(30, 200, 2), { id: 'raseri', selv: true, virker: 'raseri', runder: 4, skade: 0 }, true);
  assert.equal(k.traff, 0);
  k = runde(k, slag, true);
  assert.equal(k.traff, 15);
  const merket = runde(nyKamp(30, 200, 2), { id: 'jegermerke', skade: 6, virker: 'merket', runder: 4 }, true);
  assert.equal(merket.traff, 6);
  assert.equal(runde(merket, slag, true).traff, 15);
  const snik = { id: 'snikangrep', skade: 8, snik: true };
  assert.equal(runde(nyKamp(30, 200, 2), snik, true).traff, 8);
  assert.equal(runde(merket, snik, true).traff, 24);
});

test('orken står igjen med 1 liv én gang, og alven får liv hver tur', () => {
  let k = nyKamp(3, 100, 10, 30, folkFor('ork'));
  k = runde(k, { skade: 1 }, true);
  assert.deepEqual([k.heltLiv, k.reddet, k.utfall], [1, true, null]);
  k = runde(k, { skade: 1 }, true);
  assert.equal(k.utfall, 'tap');
  const alv = runde(nyKamp(20, 100, 5, 30, folkFor('alv')), { skade: 1 }, true);
  assert.equal(alv.heltLiv, 16);
  assert.equal(runde(nyKamp(30, 100, 0, 30, folkFor('alv')), { skade: 1 }, true).heltLiv, 30);
});

test('villmagi får et element, tiefling gjør mer med ild, og gnomen lager bedre bomber', () => {
  const vill = ANGREP.find((a) => a.id === 'villmagi');
  assert.equal(motFiende({ ...vill, skade: 10 }, {}, () => 0).element, ELEMENTER[0]);
  assert.ok(ELEMENTER.includes(motFiende({ ...vill, skade: 10 }, {}).element));
  const ild = (folk) => angrepFor(2, 3, 0, ['ildkule'], { folk }).find((a) => a.id === 'ildkule').skade;
  assert.equal(ild('tiefling'), Math.round(ild('menneske') * 1.25));
  const bombe = (folk) => tingFor({ folk, ting: { bombe: 1 } }, 0, 30).find((t) => t.kast).skade;
  assert.equal(bombe('gnom'), 2 * bombe('dverg'));
});

test('folket gir liv, skade og erfaring', () => {
  const [dverg, alv] = [helt('dverg', 'kriger'), helt('alv', 'kriger')];
  assert.equal(maksLiv(dverg) - maksLiv(alv), 6);
  assert.equal(skadeBonus(alv) - skadeBonus(dverg), 1);
  const f = { erfaring: 5 };
  assert.equal(kampErfaring(f, { utfall: 'seier', rette: 1 }, helt('menneske', 'bard')), 8);
  assert.equal(kampErfaring(f, { utfall: 'seier', rette: 1 }, alv), 6);
  assert.equal(kampErfaring(f, { utfall: 'tap', rette: 1 }, helt('menneske', 'bard')), 1);
});

test('helter fra før heltelaget får ny klasse, beholder nivå og får velge igjen', () => {
  const r = lagSpiller({ klasse: 'ridder', erfaring: grense(3), utstyr: ['sverd'] });
  assert.deepEqual([r.folk, r.klasse, r.velgIgjen], ['menneske', 'kriger', true]);
  assert.ok(r.angrep.includes('dobbeltslag'));
  assert.equal(utseendeFor(r).nivaa, 1); // jernsverdet synes
  assert.ok(utseendeFor(r).skjold > 0);
  const a = lagSpiller({ klasse: 'alv' });
  assert.deepEqual([a.folk, a.klasse], ['alv', 'jeger']);
  const igjen = lagSpiller(JSON.parse(JSON.stringify(tilLagring(r))));
  assert.equal(igjen.velgIgjen, true);
  velgHelt(igjen, { folk: 'gnom', klasse: 'bard', utseende: { haar: 3 } });
  const lagret = lagSpiller(JSON.parse(JSON.stringify(tilLagring(igjen))));
  assert.deepEqual([lagret.folk, lagret.klasse, lagret.velgIgjen, lagret.utseende.haar], ['gnom', 'bard', false, 3]);
});

test('hodeplagg kjøpes, tas på og av, gir litt og synes på helten', () => {
  const s = helt('menneske', 'kriger', { gull: 500 });
  const liv = maksLiv(s);
  assert.ok(kjop(s, 'hjelm'));
  assert.equal(s.utseende.hode, 1);
  assert.equal(maksLiv(s), liv + 3);
  assert.equal(utseendeFra(s.figur).hode, 1);
  assert.ok(hodePaa(s, 'hjelm'));
  assert.equal(s.utseende.hode, 0);
  assert.equal(maksLiv(s), liv);
  hodePaa(s, 'hjelm');
  assert.ok(selg(s, 'hjelm'));
  assert.deepEqual([s.hoder, s.utseende.hode], [[], 0]);
  s.utseende.hode = 9; // spisshatt uten å eie den
  assert.equal(utseendeFor(s).hode, 0);
});
