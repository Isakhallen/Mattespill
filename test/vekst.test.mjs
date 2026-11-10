import test from 'node:test';
import assert from 'node:assert/strict';
import { ANGREP, MAKS_ANGREP, angrepFor, oppgavetrinn, skadeFor, teller } from '../src/kamp.js';
import { STIGE, MAKS_TRINN } from '../src/oppgaver.js';
import { FIENDER } from '../src/fiender.js';
import { UTSTYR } from '../src/utstyr.js';
import {
  nivaa, grense, maksLiv, skadeBonus, kampErfaring, giErfaring, nesteUtstyr, beste,
} from '../src/vekst.js';
import { les, skriv, slett, VERSJON } from '../src/lagring.js';
import { lagSpiller, tilLagring, velgKlasse } from '../src/spiller.js';
import { KLASSER } from '../src/klasser.js';
import helt from '../src/data/helt.js';

const lager = (start = {}) => {
  const d = { ...start };
  return { getItem: (k) => d[k] ?? null, setItem: (k, v) => (d[k] = String(v)), d };
};

test('nivået følger erfaringen', () => {
  assert.deepEqual([0, 9, 10, 29, 30, 60].map(nivaa), [1, 1, 2, 2, 3, 4]);
  for (let n = 1; n < 20; n++) assert.ok(grense(n + 1) > grense(n));
  assert.equal(nivaa(1e6), 20);
});

test('seier gir fiendens erfaring, og hvert rette svar gir 1 også ved tap', () => {
  const [goblin] = FIENDER;
  assert.equal(kampErfaring(goblin, { utfall: 'seier', rette: 2 }), goblin.erfaring + 2);
  assert.equal(kampErfaring(goblin, { utfall: 'tap', rette: 3 }), 3);
  for (const f of FIENDER) assert.ok(f.erfaring > 0, f.id);
});

test('nytt nivå gir mer liv, litt mer skade og nye angrep', () => {
  const s1 = lagSpiller({});
  const s3 = lagSpiller({ erfaring: grense(3) });
  assert.equal(maksLiv(s3), helt.maksLiv + 2 * helt.perNivaa.liv);
  assert.ok(skadeBonus(s3) > skadeBonus(s1));
  const e = giErfaring(grense(2) - 1, 25);
  assert.deepEqual([e.fra, e.til], [1, 3]);
  assert.deepEqual(e.nyeAngrep.map((a) => a.nivaa), [2, 3]);
  assert.deepEqual(giErfaring(0, 1).nyeAngrep, []);
});

test('typeangrep henter oppgaven fra sin type, nærmest elevens trinn', () => {
  for (const a of ANGREP.filter((a) => a.type)) {
    const trinnITypen = STIGE.filter((s) => s.type === a.type).map((s) => s.trinn);
    assert.ok(trinnITypen.length, `${a.id}: ukjent type ${a.type}`);
    for (let t = 1; t <= MAKS_TRINN; t++) {
      const o = oppgavetrinn(a, t);
      assert.ok(trinnITypen.includes(o));
      for (const x of trinnITypen) assert.ok(Math.abs(o - t) <= Math.abs(x - t));
    }
  }
});

test('skaden måles mot elevens trinn', () => {
  assert.equal(skadeFor(7, 7), ANGREP.find((a) => a.id === 'tungt').skade);
  assert.equal(skadeFor(5, 7), ANGREP.find((a) => a.id === 'lett').skade);
  assert.ok(skadeFor(9, 7) > skadeFor(7, 7));
});

test('kampen viser opptil fire angrep, aldri altfor vanskelige', () => {
  for (let n = 1; n <= 20; n++) {
    for (let t = 1; t <= MAKS_TRINN; t++) {
      const liste = angrepFor(n, t, 2);
      assert.ok(liste.length >= 2 && liste.length <= MAKS_ANGREP);
      assert.deepEqual(liste.slice(0, 2).map((a) => a.id), ['lett', 'tungt']);
      for (const a of liste) {
        assert.ok(a.oppgavetrinn <= t + 2, `nivå ${n}, trinn ${t}: ${a.id} på ${a.oppgavetrinn}`);
        assert.ok((a.nivaa ?? 1) <= n);
      }
    }
  }
  assert.equal(angrepFor(1, 5).length, 2);
  assert.equal(angrepFor(6, 9).length, 4);
  assert.equal(angrepFor(1, 5, 3)[0].skade, Math.round(5 * 1.3));
});

test('feil på for vanskelig oppgave og rett på altfor lett teller ikke', () => {
  assert.equal(teller(9, 7, false), false);
  assert.equal(teller(9, 7, true), true);
  assert.equal(teller(5, 7, true), true);
  assert.equal(teller(4, 7, true), false);
  assert.equal(teller(7, 7, false), true);
});

test('kistene gir utstyr i rekkefølge, og det beste brukes', () => {
  let eier = [];
  for (const u of UTSTYR) {
    assert.equal(nesteUtstyr(eier), u);
    eier = [...eier, u.id];
  }
  assert.equal(nesteUtstyr(eier), null);
  const s = lagSpiller({ utstyr: ['sverd', 'rustentSverd', 'laervest'] });
  assert.equal(beste(s.utstyr, 'vaapen').id, 'sverd');
  assert.equal(skadeBonus(s), 4);
  assert.equal(maksLiv(s), helt.maksLiv + 6);
});

test('lagringen kan skrives og leses igjen', () => {
  const l = lager();
  const s = lagSpiller({ erfaring: 42, liv: 5, trinn: 7, utstyr: ['sverd'], slaatt: ['test:1,2'] });
  assert.ok(skriv(tilLagring(s), l));
  const igjen = lagSpiller(les(l));
  assert.deepEqual(tilLagring(igjen), tilLagring(s));
  assert.equal(JSON.parse(l.d.mattespill).versjon, VERSJON);
});

test('spillet tåler at lagringen mangler, er ødelagt eller ikke er lov', () => {
  const ny = tilLagring(lagSpiller({}));
  assert.equal(les(lager()), null);
  assert.equal(les(lager({ mattespill: '{ikke json' })), null);
  assert.equal(les(lager({ mattespill: '{"versjon":999,"erfaring":5}' })), null);
  assert.equal(les(lager({ mattespill: '"tekst"' })), null);
  const sperret = { getItem() { throw new Error('nei'); }, setItem() { throw new Error('nei'); } };
  assert.equal(les(sperret), null);
  assert.equal(skriv({}, sperret), false);
  assert.deepEqual(tilLagring(lagSpiller(null)), ny);
  const rart = lagSpiller({ erfaring: -3, liv: 999, trinn: 'x', utstyr: ['finnes-ikke', 7], slaatt: 'a', aapnet: [null] });
  assert.deepEqual(tilLagring(rart), ny);
  assert.equal(lagSpiller({ liv: 0 }).liv, helt.maksLiv);
});

test('klassen, kartet og historien lagres, og rare verdier blir startverdier', () => {
  const ny = lagSpiller(null);
  assert.equal(ny.klasse, null);
  assert.equal(ny.kart, 'kjelleren');
  const rar = lagSpiller({ klasse: 'drage', kart: 'månen', sett: [1, 'dypet'] });
  assert.deepEqual([rar.klasse, rar.kart, rar.sett], [null, 'kjelleren', ['dypet']]);
  const s = lagSpiller({});
  velgKlasse(s, 'trollmann');
  assert.deepEqual([s.navn, s.figur], ['Trollmann', 'wizzard_m']);
  assert.equal(s.liv, maksLiv(s));
  s.kart = 'dypet';
  const igjen = lagSpiller(tilLagring(s));
  assert.deepEqual([igjen.klasse, igjen.kart, igjen.figur], ['trollmann', 'dypet', 'wizzard_m']);
});

test('klassene gir litt ulike startverdier', () => {
  const verdi = (id) => {
    const s = lagSpiller({});
    velgKlasse(s, id);
    return [maksLiv(s), skadeBonus(s)];
  };
  const [r, a, t] = KLASSER.map((k) => verdi(k.id));
  assert.ok(r[0] > a[0] && a[0] > t[0]);
  assert.ok(r[1] < a[1] && a[1] < t[1]);
});

test('slett glemmer helten', () => {
  const l = lager();
  l.removeItem = (k) => delete l.d[k];
  skriv({ erfaring: 5 }, l);
  slett(l);
  assert.equal(les(l), null);
});
