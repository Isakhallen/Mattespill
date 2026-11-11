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
import raseri from './data/angrep/raseri.js';
import tordensang from './data/angrep/tordensang.js';
import velsignelse from './data/angrep/velsignelse.js';
import torneranker from './data/angrep/torneranker.js';
import dobbeltslag from './data/angrep/dobbeltslag.js';
import lammeslag from './data/angrep/lammeslag.js';
import hellighogg from './data/angrep/hellighogg.js';
import jegermerke from './data/angrep/jegermerke.js';
import snikangrep from './data/angrep/snikangrep.js';
import magiskpil from './data/angrep/magiskpil.js';
import villmagi from './data/angrep/villmagi.js';
import heksebrann from './data/angrep/heksebrann.js';
import drakepust from './data/angrep/drakepust.js';
import { STIGE, MAKS_TRINN } from './oppgaver.js';
import { folkFor } from './folkeslag.js';
import { TING } from './varer.js';

// Kampregler uten grafikk, så de kan testes med Node.
// Rekkefølgen er rekkefølgen i angrepsboka og i kampen. Etter lett og tungt kommer
// angrepene som hører til en klasse eller et folk (src/data/klasser/ og src/data/folkeslag/).
export const EGNE = [raseri, tordensang, velsignelse, torneranker, dobbeltslag, lammeslag, hellighogg, jegermerke, snikangrep, magiskpil, villmagi, heksebrann, drakepust];
export const ANGREP = [lett, tungt, ...EGNE, ildkule, giftpil, lyn, skjold, isspyd, helbred, storm, frost, meteor, vampyrbitt, flammestot, helliglys, jordskjelv];
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
// Villmagi («vill») får et tilfeldig element hver gang.
export const ELEMENTER = ['slag', 'ild', 'is', 'lyn', 'gift', 'hellig', 'jord'];
export function motFiende(angrep, type, tall = Math.random) {
  if (angrep.element === 'vill') angrep = { ...angrep, element: ELEMENTER[Math.floor(tall() * ELEMENTER.length)] };
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

// Hører angrepet til helten? «helt» har «klasse» og «folk» (id-er). Angrep med «klasse» eller «folk»
// har bare de som hører til den klassen eller det folket.
export const egnet = (a, helt = {}) => (a.klasse ? a.klasse === helt.klasse : a.folk ? a.folk === helt.folk : true);

export const opplaast = (nivaa, helt) => ANGREP.filter((a) => (a.nivaa ?? 1) <= nivaa && egnet(a, helt));

// Angrepene eleven har med før eleven har valgt selv: lett, tungt, klassens og folkets egne og de nyeste.
export function standardValg(nivaa, helt) {
  const egne = opplaast(nivaa, helt).filter((a) => a.klasse || a.folk);
  const nye = opplaast(nivaa, helt).filter((a) => a.nivaa).sort((a, b) => b.nivaa - a.nivaa);
  const plass = MAKS_ANGREP - 2 - egne.length;
  const med = new Set(['lett', 'tungt', ...egne.map((a) => a.id), ...nye.slice(0, plass).map((a) => a.id)]);
  return ANGREP.filter((a) => med.has(a.id)).map((a) => a.id);
}

// Valget etter at helten har fått ny klasse eller nytt folk: de gamle egne angrepene går ut,
// og de nye kommer inn etter lett og tungt (det siste valget går ut hvis det ikke er plass).
export function medEgne(valgte, nivaa, helt) {
  const egne = opplaast(nivaa, helt).filter((a) => a.klasse || a.folk).map((a) => a.id);
  const andre = valgte.filter((id) => {
    const a = ANGREP.find((x) => x.id === id);
    return a && !a.klasse && !a.folk && (a.nivaa ?? 1) <= nivaa;
  });
  const alle = [...egne, ...andre].slice(0, MAKS_ANGREP);
  return ANGREP.filter((a) => alle.includes(a.id)).map((a) => a.id);
}

// Folket gjør angrep med sitt element sterkere (tiefling og ild).
const ELEMENTBONUS = 1.25;
export const forsterk = (a, helt) =>
  !a.selv && a.element && folkFor(helt?.folk)?.element === a.element ? { ...a, skade: Math.round(a.skade * ELEMENTBONUS) } : a;

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
// «helt» har klassen og folket (se «egnet»).
export function angrepFor(nivaa, trinn, bonus = 0, valgte = null, helt = {}) {
  const med = (ids) => opplaast(nivaa, helt).filter((a) => ids.includes(a.id)).slice(0, MAKS_ANGREP);
  const liste = valgte && med(valgte).length ? med(valgte) : med(standardValg(nivaa, helt));
  return liste.map((a) => forsterk(medTall(a, trinn, bonus), helt));
}

// Tingene eleven har med i kampen. De brukes uten oppgave og koster en tur.
// Drikken gir fullt liv. Bomben skader med samme bonus som angrepene.
// Gnomen lager bedre bomber («bomber» i folket).
export const tingFor = (s, bonus, heltMaks) =>
  TING.filter((t) => s.ting[t.id] > 0).map((t) => {
    const ganger = t.kast ? (folkFor(s.folk)?.bomber ?? 1) : 1;
    const skade = t.heler ? heltMaks : Math.round(t.skade * ganger * (1 + bonus / 10));
    return forsterk({ ...t, skade, antall: s.ting[t.id] }, s);
  });

// Skal svaret telle i tilpasningen? Feil på en oppgave over elevens trinn
// senker ikke eleven, og rett på en altfor lett oppgave løfter ikke.
export const teller = (oppgtrinn, trinn, rett) => (rett ? oppgtrinn >= trinn - 2 : oppgtrinn <= trinn);

// «folk» gir egenskapene fra heltens folk: «seig» (ork) og «regn» (alv).
export const nyKamp = (heltLiv, fiendeLiv, fiendeSkade, heltMaks = heltLiv, folk = null) => ({
  heltLiv,
  heltMaks,
  fiendeLiv,
  fiendeSkade,
  merker: {}, // { navn: { runder, prikk } }. «skjold» og «raseri» er på helten, resten på fienden.
  seig: !!folk?.seig,
  regn: folk?.regn ?? 0,
  utfall: null,
});

export const PAA_HELT = ['skjold', 'raseri'];
// Raseri på helten og jegermerket på fienden gir så mye mer skade.
export const EKSTRA = 1.5;

// Én runde: eleven har valgt angrep og svart.
// Raseri og jegermerket gir mer skade, og snikangrep gir dobbelt når fienden har et merke fra før. Riktig svar treffer, feil svar bommer.
// Så skader gift og brann, og fienden slår tilbake hvis den lever og ikke er frosset.
// Svekket og skjold gir halve slag. Til slutt telles merkene ned.
// «traff», «heling», «prikker» og «slag» er det som skjedde i runden.
// «aktive» er merkene som virket i runden, og «mellom» er livet etter heltens tur.
export function runde(k, angrep, rett) {
  const merker = { ...k.merker };
  const merket = Object.keys(merker).some((m) => !PAA_HELT.includes(m));
  const ganger = (merker.raseri ? EKSTRA : 1) * (merker.merket ? EKSTRA : 1) * (angrep.snik && merket ? 2 : 1);
  const traff = rett && !angrep.selv ? Math.round(angrep.skade * ganger) : 0;
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
  let heltLiv = Math.max(0, k.heltLiv + heling - slag);
  // Orken gir aldri opp: én gang i kampen står den igjen med 1 liv.
  let seig = k.seig;
  const reddet = heltLiv === 0 && seig;
  if (reddet) (heltLiv = 1), (seig = false);
  // Alven får litt liv hver tur.
  const regn = heltLiv > 0 && fiendeLiv > 0 ? Math.min(k.regn ?? 0, k.heltMaks - heltLiv) : 0;
  heltLiv += regn;

  for (const [navn, m] of Object.entries(merker)) {
    if (m.runder > 1) merker[navn] = { ...m, runder: m.runder - 1 };
    else delete merker[navn];
  }
  const utfall = fiendeLiv === 0 ? 'seier' : heltLiv === 0 ? 'tap' : null;
  return { ...k, heltLiv, fiendeLiv, merker, seig, traff, heling, prikker, frosset, slag, reddet, regn, aktive, mellom, utfall };
}
