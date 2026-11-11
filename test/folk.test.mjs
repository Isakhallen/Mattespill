import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FOLK, OPPDRAG, personFor, lesOppdrag, slaattFiende, synlig, folkemerke, snakkOm, replikk, portNytt } from '../src/folk.js';
import { TIPS } from '../src/data/tips.js';
import { MAKS_TRINN } from '../src/oppgaver.js';
import { FIENDER } from '../src/fiender.js';
import { KISTE, DRIKK } from '../src/utstyr.js';
import { kartFor } from '../src/kartliste.js';
import { lagSpiller, tilLagring } from '../src/spiller.js';

const ny = () => ({ oppdrag: {} });
const p = (id) => FOLK.find((f) => f.id === id);
const antallI = (kart, tegn) => kartFor(kart).ruter.join('').split(tegn).length - 1;

test('folk har egne tegn og står i kartene', () => {
  const tegn = FOLK.map((f) => f.tegn);
  assert.equal(new Set(tegn).size, tegn.length);
  for (const t of tegn) {
    assert.ok(!FIENDER.some((f) => f.tegn === t) && t !== KISTE && t !== DRIKK, t);
    assert.equal(antallI('verden', t), 1, t);
    assert.equal(personFor(t).tegn, t);
  }
  assert.equal(antallI('kjelleren', 'P'), 1);
  for (const o of OPPDRAG) assert.ok(p(o.gir), o.id);
});

test('det finnes et tips for hvert trinn', () => {
  for (let t = 1; t <= MAKS_TRINN; t++) assert.ok(TIPS[t], `trinn ${t}`);
  assert.match(replikk(p('vilja'), 3), /50 %/);
  const ane = p('ane');
  assert.equal(replikk(ane, 1, 0), ane.snakk[0]);
  assert.equal(replikk(ane, 1, ane.snakk.length), ane.snakk[0]);
});

test('goblin-oppdraget: ! først, teller, ? og belønning', () => {
  const s = ny();
  const dag = p('dag');
  assert.equal(folkemerke(s, dag), 'utrop');
  assert.deepEqual(snakkOm(s, dag).tekst.length, 1);
  assert.equal(folkemerke(s, dag), null);
  slaattFiende(s, 'goblin');
  slaattFiende(s, 'skjelett');
  assert.match(snakkOm(s, dag).tekst[0], /1 av 3/);
  slaattFiende(s, 'goblin');
  slaattFiende(s, 'goblin');
  assert.equal(folkemerke(s, dag), 'spor');
  const svar = snakkOm(s, dag);
  assert.deepEqual(svar.belonning, { erfaring: 10, gull: 20 });
  assert.equal(s.oppdrag.goblins.steg, 'ferdig');
  assert.equal(snakkOm(s, dag), null);
  assert.equal(folkemerke(s, dag), null);
  slaattFiende(s, 'goblin'); // teller ikke mer
  assert.equal(s.oppdrag.goblins.antall, 3);
});

test('goblins slått før oppdraget teller også', () => {
  const s = ny();
  for (let i = 0; i < 3; i++) slaattFiende(s, 'goblin');
  assert.equal(folkemerke(s, p('dag')), 'utrop');
  const svar = snakkOm(s, p('dag'));
  assert.equal(svar.tekst.length, 2); // spørsmålet og takken
  assert.ok(svar.belonning);
});

test('Pelle er borte i kjelleren til han er funnet', () => {
  const s = ny();
  const [pelle, tuva] = [p('pelle'), p('tuva')];
  assert.ok(synlig(s, pelle, 'kjelleren'));
  assert.ok(!synlig(s, pelle, 'verden'));
  assert.ok(synlig(s, tuva, 'verden'));
  assert.equal(snakkOm(s, tuva).tekst[0], OPPDRAG[1].start);
  assert.match(snakkOm(s, tuva).tekst[0], /kjelleren/);
  assert.equal(folkemerke(s, pelle), 'utrop');
  assert.ok(snakkOm(s, pelle).hjem);
  assert.ok(!synlig(s, pelle, 'kjelleren'));
  assert.ok(synlig(s, pelle, 'verden'));
  assert.equal(folkemerke(s, pelle), null);
  assert.equal(snakkOm(s, pelle), null); // hjemme sier han det vanlige
  assert.equal(folkemerke(s, tuva), 'spor');
  assert.ok(snakkOm(s, tuva).belonning);
  assert.equal(folkemerke(s, tuva), null);
});

test('Pelle kan bli funnet før Tuva har spurt', () => {
  const s = ny();
  snakkOm(s, p('pelle'));
  assert.equal(folkemerke(s, p('tuva')), 'spor');
  const svar = snakkOm(s, p('tuva'));
  assert.deepEqual(svar.tekst, [OPPDRAG[1].takk]);
  assert.ok(svar.belonning);
});

test('oppdragene lagres og rare verdier glemmes', () => {
  assert.deepEqual(lesOppdrag(null), {});
  assert.deepEqual(
    lesOppdrag({ goblins: { steg: 'aktiv', antall: 2 }, pelle: { steg: 'tull' }, x: { steg: 'ny' } }),
    { goblins: { steg: 'aktiv', antall: 2 } },
  );
  assert.deepEqual(lesOppdrag({ goblins: { steg: 'ny', antall: -4 } }), { goblins: { steg: 'ny', antall: 0 } });
  const s = lagSpiller({ oppdrag: { pelle: { steg: 'klar', antall: 0 } } });
  assert.deepEqual(lagSpiller(tilLagring(s)).oppdrag, { pelle: { steg: 'klar', antall: 0 } });
});

test('vakta forteller om den nyeste porten til helten har vært der', () => {
  const ane = p('ane');
  const s = lagSpiller({});
  assert.equal(portNytt(s, ane), null);
  s.bosser = ['tallslukeren'];
  assert.match(portNytt(s, ane), /Skogen i vest/);
  assert.equal(folkemerke(s, ane), 'utrop');
  assert.equal(portNytt(s, p('dag')), null);
  s.bosser.push('halvdan');
  assert.match(portNytt(s, ane), /Sumpen/);
  s.sett.push('sumpen');
  assert.match(portNytt(s, ane), /Skogen/); // har ikke vært i Skogen ennå
  s.sett.push('skogen');
  assert.equal(portNytt(s, ane), null);
});
