// Snille folk og små oppdrag. Bare regler, ingen grafikk (testes i Node).
import dag from './data/folk/dag.js';
import elsa from './data/folk/elsa.js';
import vilja from './data/folk/vilja.js';
import ane from './data/folk/ane.js';
import tuva from './data/folk/tuva.js';
import pelle from './data/folk/pelle.js';
import goblins from './data/oppdrag/goblins.js';
import pelleOppdrag from './data/oppdrag/pelle.js';
import { TIPS } from './data/tips.js';
import { portEtter } from './kartliste.js';

export const FOLK = [dag, elsa, vilja, ane, tuva, pelle];
export const OPPDRAG = [goblins, pelleOppdrag];
const STEG = ['ny', 'aktiv', 'klar', 'ferdig'];

export const personFor = (tegn) => FOLK.find((p) => p.tegn === tegn) ?? null;
const oppdragFra = (person) => OPPDRAG.find((o) => o.gir === person.id) ?? null;
const leterEtter = (person) => OPPDRAG.find((o) => o.slag === 'finn' && o.person === person.id) ?? null;
const steg = (s, o) => s.oppdrag[o.id]?.steg ?? 'ny';
const tilstand = (s, o) => (s.oppdrag[o.id] ??= { steg: 'ny', antall: 0 });
const funnet = (s, o) => ['klar', 'ferdig'].includes(steg(s, o));
const nok = (s, o) => o.slag === 'slaa' && (s.oppdrag[o.id]?.antall ?? 0) >= o.antall;

// Oppdragene slik de er lagret: { id: { steg, antall } }. Det som er rart, glemmes.
export function lesOppdrag(d) {
  const ut = {};
  if (!d || typeof d !== 'object') return ut;
  for (const o of OPPDRAG) {
    const x = d[o.id];
    if (!x || !STEG.includes(x.steg)) continue;
    ut[o.id] = { steg: x.steg, antall: Number.isInteger(x.antall) && x.antall > 0 ? x.antall : 0 };
  }
  return ut;
}

// En fiende er slått. Teller for slå-oppdragene som ikke er klare, også før eleven har fått dem.
export function slaattFiende(s, typeId) {
  for (const o of OPPDRAG) {
    if (o.slag !== 'slaa' || o.fiende !== typeId || funnet(s, o)) continue;
    tilstand(s, o).antall++;
  }
}

// Om personen står i dette kartet. Den som er borte, står der til den er funnet, og hjemme etterpå.
export function synlig(s, person, kart) {
  if (!person.borte) return true;
  return (kart === person.borte) !== funnet(s, leterEtter(person));
}

// Merket over hodet: 'utrop' for nytt oppdrag (og den som er borte), 'spor' når belønningen venter.
export function folkemerke(s, person) {
  if (portNytt(s, person)) return 'utrop';
  const mal = leterEtter(person);
  if (mal) return funnet(s, mal) ? null : 'utrop';
  const o = oppdragFra(person);
  if (!o) return null;
  const st = steg(s, o);
  if (st === 'ny') return 'utrop';
  if (st === 'klar' || (st === 'aktiv' && nok(s, o))) return 'spor';
  return null;
}

// Det personen sier om oppdraget sitt. Endrer oppdraget i «s».
// Gir { tekst: [...], hjem, belonning } eller null hvis det ikke er noe oppdrag å snakke om.
export function snakkOm(s, person) {
  const mal = leterEtter(person);
  if (mal) {
    if (funnet(s, mal)) return null;
    tilstand(s, mal).steg = 'klar';
    return { tekst: [mal.funnet], hjem: true };
  }
  const o = oppdragFra(person);
  if (!o) return null;
  const x = tilstand(s, o);
  if (x.steg === 'ferdig') return null;
  const tekst = [];
  if (x.steg === 'ny') {
    tekst.push(o.start);
    x.steg = 'aktiv';
  }
  if (x.steg === 'aktiv' && nok(s, o)) x.steg = 'klar';
  if (x.steg === 'klar') {
    x.steg = 'ferdig';
    return { tekst: [...tekst, o.takk], belonning: { erfaring: o.erfaring, gull: o.gull } };
  }
  if (!tekst.length) tekst.push(o.underveis.replace('{n}', x.antall).replace('{antall}', o.antall));
  return { tekst };
}

// Det personen sier ellers. «gang» er hvor mange ganger eleven har snakket med personen nå.
// Den som har «porter», forteller om den nyeste porten som er åpen, til helten har vært der.
export function portNytt(s, person) {
  if (!person.porter) return null;
  for (const id of [...(s.bosser ?? [])].reverse()) {
    const u = portEtter(id);
    if (u && !s.sett.includes(u.kart)) return `Porten til ${u.navn} i ${u.retning} har åpnet seg! Pass deg der inne.`;
  }
  return null;
}

export function replikk(person, trinn, gang = 0) {
  if (person.tips) return `Et tips til deg:\n${TIPS[trinn] ?? TIPS[1]}`;
  return person.snakk[gang % person.snakk.length];
}
