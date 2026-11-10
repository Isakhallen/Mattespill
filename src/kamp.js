import lett from './data/angrep/lett.js';
import tungt from './data/angrep/tungt.js';
import ildkule from './data/angrep/ildkule.js';
import giftpil from './data/angrep/giftpil.js';
import lyn from './data/angrep/lyn.js';
import skjold from './data/angrep/skjold.js';
import isspyd from './data/angrep/isspyd.js';
import helbred from './data/angrep/helbred.js';
import storm from './data/angrep/storm.js';
import frost from './data/angrep/frost.js';
import meteor from './data/angrep/meteor.js';
import vampyrbitt from './data/angrep/vampyrbitt.js';
import flammestot from './data/angrep/flammestot.js';
import helliglys from './data/angrep/helliglys.js';
import jordskjelv from './data/angrep/jordskjelv.js';
import { STIGE, MAKS_TRINN } from './oppgaver.js';
import { TING } from './varer.js';

// Kampregler uten grafikk, så de kan testes med Node.
// Rekkefølgen er rekkefølgen i angrepsboka og i kampen.
export const ANGREP = [lett, tungt, ildkule, giftpil, lyn, skjold, isspyd, helbred, storm, frost, meteor, vampyrbitt, flammestot, helliglys, jordskjelv];
export const MAKS_ANGREP = 6; // så mange angrep eleven kan ta med

// Typeangrep henter aldri oppgaven fra mer enn så mange trinn over eleven.
export const MAKS_OVER = 2;

const klemt = (x, min, maks) => Math.min(maks, Math.max(min, x));

// Trinnet oppgaven hentes fra når eleven står på «trinn». Angrep med «type»
// bruker det trinnet i typen som ligger nærmest eleven. Ligger hele typen
// langt over eleven, kommer oppgaven fra trinnet MAKS_OVER over eleven.
export function oppgavetrinn(angrep, trinn) {
  if (!angrep.type) return klemt(trinn + angrep.trinn, 1, MAKS_TRINN);
  const naermest = STIGE.filter((s) => s.type === angrep.type)
    .map((s) => s.trinn)
    .reduce((a, b) => (Math.abs(b - trinn) < Math.abs(a - trinn) ? b : a));
  return Math.min(naermest, trinn + MAKS_OVER, MAKS_TRINN);
}

// Skaden måles mot elevens trinn: samme trinn gir 10 (som tungt), to under gir 5 (som lett).
export const skadeFor = (oppgtrinn, trinn) => klemt(Math.round(10 + 2.5 * (oppgtrinn - trinn)), 4, 16);

// Hvor godt et angrep virker på en fiendetype: 2 mot svakheten, ½ mot det den tåler.
// Eleven får aldri vite det, men ser det på tallet og hører det.
export function virkning(angrep, type) {
  if (angrep.selv) return 1;
  if (type.svak?.includes(angrep.element)) return 2;
  if (type.sterk?.includes(angrep.element)) return 0.5;
  return 1;
}

// Skaden som står på knappen. Skjoldet ser man, svakhetene ikke.
export const vistSkade = (angrep, type) => (type.skjold && angrep.id === 'lett' ? 1 : angrep.skade);

// Skaden angrepet gjør på fienden. Et skjold gjør at lette slag bare gir 1.
export function skadeMot(angrep, type) {
  if (angrep.selv) return angrep.skade;
  if (type.skjold && angrep.id === 'lett') return 1;
  return Math.max(1, Math.round(angrep.skade * virkning(angrep, type)));
}

// Angrepet slik det virker på akkurat denne fienden: skade og gift/brann
// blir dobbelt eller halvt så sterke.
export function motFiende(angrep, type) {
  const prikk = angrep.prikk && Math.max(1, Math.round(angrep.prikk * virkning(angrep, type)));
  return { ...angrep, skade: skadeMot(angrep, type), prikk };
}

// Angrep med «hvile» kan ikke brukes de neste turene etter et treff.
// «hviler» er { id: turer igjen }. Kalles etter hver tur helten tar.
export function hvilEtter(hviler, angrep, traff) {
  const ny = {};
  for (const [id, n] of Object.entries(hviler)) if (n > 1) ny[id] = n - 1;
  if (traff && angrep.hvile) ny[angrep.id] = angrep.hvile;
  return ny;
}

export const opplaast = (nivaa) => ANGREP.filter((a) => (a.nivaa ?? 1) <= nivaa);

// Angrepene eleven har med før eleven har valgt selv: lett, tungt og de nyeste.
export function standardValg(nivaa) {
  const nye = opplaast(nivaa).filter((a) => a.nivaa).sort((a, b) => b.nivaa - a.nivaa);
  const med = new Set(['lett', 'tungt', ...nye.slice(0, MAKS_ANGREP - 2).map((a) => a.id)]);
  return ANGREP.filter((a) => med.has(a.id)).map((a) => a.id);
}

// Angrepet med oppgavetrinn og skade for eleven. «bonus» er skade fra nivå og våpen,
// regnet for et tungt slag (10). Andre angrep får like stor andel, så lett blir halvparten.
// «kraft» gjør de sterkeste angrepene enda sterkere (de må hvile etterpå).
// Helbred gir liv i stedet for skade. «prikk» blir skaden gift og brann gjør hver tur.
export function medTall(a, trinn, bonus = 0) {
  const t = oppgavetrinn(a, trinn);
  const grunn = (a.skade ?? skadeFor(t, trinn)) * (a.kraft ?? 1);
  const skade = Math.round(grunn * (1 + bonus / 10));
  return { ...a, oppgavetrinn: t, skade, prikk: a.prikk && Math.max(1, Math.round(skade * a.prikk)) };
}

// Angrepene i kampen: de eleven har valgt i angrepsboka og har låst opp.
export function angrepFor(nivaa, trinn, bonus = 0, valgte = standardValg(nivaa)) {
  const med = (ids) => opplaast(nivaa).filter((a) => ids.includes(a.id)).slice(0, MAKS_ANGREP);
  const liste = med(valgte).length ? med(valgte) : med(standardValg(nivaa));
  return liste.map((a) => medTall(a, trinn, bonus));
}

// Tingene eleven har med i kampen. De brukes uten oppgave og koster en tur.
// Drikken gir fullt liv. Bomben skader med samme bonus som angrepene.
export const tingFor = (s, bonus, heltMaks) =>
  TING.filter((t) => s.ting[t.id] > 0).map((t) => ({
    ...t,
    skade: t.heler ? heltMaks : Math.round(t.skade * (1 + bonus / 10)),
    antall: s.ting[t.id],
  }));

// Skal svaret telle i tilpasningen? Feil på en oppgave over elevens trinn
// senker ikke eleven, og rett på en altfor lett oppgave løfter ikke.
export const teller = (oppgtrinn, trinn, rett) => (rett ? oppgtrinn >= trinn - 2 : oppgtrinn <= trinn);

export const nyKamp = (heltLiv, fiendeLiv, fiendeSkade, heltMaks = heltLiv) => ({
  heltLiv,
  heltMaks,
  fiendeLiv,
  fiendeSkade,
  merker: {}, // { navn: { runder, prikk } }. «skjold» er på helten, resten på fienden.
  utfall: null,
});

export const PAA_HELT = ['skjold'];

// Én runde: eleven har valgt angrep og svart. Riktig svar treffer, feil svar bommer.
// Så skader gift og brann, og fienden slår tilbake hvis den lever og ikke er frosset.
// Svekket og skjold gir halve slag. Til slutt telles merkene ned.
// «traff», «heling», «prikker» og «slag» er det som skjedde i runden.
// «aktive» er merkene som virket i runden, og «mellom» er livet etter heltens tur.
export function runde(k, angrep, rett) {
  const merker = { ...k.merker };
  const traff = rett && !angrep.selv ? angrep.skade : 0;
  let fiendeLiv = Math.max(0, k.fiendeLiv - traff);
  const fikk = angrep.heler ? angrep.skade : Math.round(traff * (angrep.stjel ?? 0));
  const heling = rett ? Math.min(fikk, k.heltMaks - k.heltLiv) : 0;
  if (rett && angrep.virker) merker[angrep.virker] = { runder: angrep.runder, prikk: angrep.prikk };
  const aktive = Object.keys(merker);
  const mellom = { heltLiv: k.heltLiv + heling, fiendeLiv };

  const prikker = [];
  for (const navn of ['gift', 'brann']) {
    if (!merker[navn] || fiendeLiv === 0) continue;
    prikker.push({ navn, skade: merker[navn].prikk });
    fiendeLiv = Math.max(0, fiendeLiv - merker[navn].prikk);
  }
  const frosset = fiendeLiv > 0 && !!merker.frys;
  const andel = (merker.svekket ? 0.5 : 1) * (merker.skjold ? 0.5 : 1);
  const slag = fiendeLiv > 0 && !frosset ? Math.max(1, Math.round(k.fiendeSkade * andel)) : 0;
  const heltLiv = Math.max(0, k.heltLiv + heling - slag);

  for (const [navn, m] of Object.entries(merker)) {
    if (m.runder > 1) merker[navn] = { ...m, runder: m.runder - 1 };
    else delete merker[navn];
  }
  const utfall = fiendeLiv === 0 ? 'seier' : heltLiv === 0 ? 'tap' : null;
  return { ...k, heltLiv, fiendeLiv, merker, traff, heling, prikker, frosset, slag, aktive, mellom, utfall };
}
