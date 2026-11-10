import lett from './data/angrep/lett.js';
import tungt from './data/angrep/tungt.js';
import ildkule from './data/angrep/ildkule.js';
import lyn from './data/angrep/lyn.js';
import isspyd from './data/angrep/isspyd.js';
import storm from './data/angrep/storm.js';
import meteor from './data/angrep/meteor.js';
import { STIGE, MAKS_TRINN } from './oppgaver.js';

// Kampregler uten grafikk, så de kan testes med Node.
export const ANGREP = [lett, tungt, ildkule, lyn, isspyd, storm, meteor];
export const MAKS_ANGREP = 4;

const klemt = (x, min, maks) => Math.min(maks, Math.max(min, x));

// Trinnet oppgaven hentes fra når eleven står på «trinn». Angrep med «type»
// bruker det trinnet i typen som ligger nærmest eleven.
export function oppgavetrinn(angrep, trinn) {
  if (!angrep.type) return klemt(trinn + angrep.trinn, 1, MAKS_TRINN);
  return STIGE.filter((s) => s.type === angrep.type)
    .map((s) => s.trinn)
    .reduce((a, b) => (Math.abs(b - trinn) < Math.abs(a - trinn) ? b : a));
}

// Skaden måles mot elevens trinn: samme trinn gir 10 (som tungt), to under gir 5 (som lett).
export const skadeFor = (oppgtrinn, trinn) => klemt(Math.round(10 + 2.5 * (oppgtrinn - trinn)), 4, 16);

// Hvor godt et angrep virker på en fiendetype: 2 mot svakheten, ½ mot det den tåler.
// Eleven får aldri vite det, men ser det på tallet og hører det.
export function virkning(angrep, type) {
  if (type.svak?.includes(angrep.element)) return 2;
  if (type.sterk?.includes(angrep.element)) return 0.5;
  return 1;
}

// Skaden som står på knappen. Skjoldet ser man, svakhetene ikke.
export const vistSkade = (angrep, type) => (type.skjold && angrep.id === 'lett' ? 1 : angrep.skade);

// Skaden angrepet gjør på fienden. Et skjold gjør at lette slag bare gir 1.
export function skadeMot(angrep, type) {
  if (type.skjold && angrep.id === 'lett') return 1;
  return Math.max(1, Math.round(angrep.skade * virkning(angrep, type)));
}

// Angrep med «hvile» kan ikke brukes de neste turene etter et treff.
// «hviler» er { id: turer igjen }. Kalles etter hver tur helten tar.
export function hvilEtter(hviler, angrep, traff) {
  const ny = {};
  for (const [id, n] of Object.entries(hviler)) if (n > 1) ny[id] = n - 1;
  if (traff && angrep.hvile) ny[angrep.id] = angrep.hvile;
  return ny;
}

// Typeangrep vises bare når oppgaven er høyst så mange trinn over eleven.
export const MAKS_OVER = 2;

// Angrepene eleven kan velge mellom: de faste, og de opplåste typeangrepene
// som ligger nærmest elevens trinn. «bonus» er skade fra nivå og våpen, regnet
// for et tungt slag (10). Andre angrep får like stor andel, så lett blir halvparten.
// «kraft» gjør de sterkeste angrepene enda sterkere (de må hvile etterpå).
export function angrepFor(nivaa, trinn, bonus = 0) {
  const klare = ANGREP.filter((a) => (a.nivaa ?? 1) <= nivaa).map((a) => {
    const t = oppgavetrinn(a, trinn);
    const grunn = (a.skade ?? skadeFor(t, trinn)) * (a.kraft ?? 1);
    return { ...a, oppgavetrinn: t, skade: Math.round(grunn * (1 + bonus / 10)) };
  });
  const faste = klare.filter((a) => !a.type);
  const avstand = (a) => Math.abs(a.oppgavetrinn - trinn);
  const typer = klare
    .filter((a) => a.type && a.oppgavetrinn <= trinn + MAKS_OVER)
    .sort((a, b) => avstand(a) - avstand(b) || a.nivaa - b.nivaa)
    .slice(0, MAKS_ANGREP - faste.length)
    .sort((a, b) => a.oppgavetrinn - b.oppgavetrinn);
  return [...faste, ...typer];
}

// Skal svaret telle i tilpasningen? Feil på en oppgave over elevens trinn
// senker ikke eleven, og rett på en altfor lett oppgave løfter ikke.
export const teller = (oppgtrinn, trinn, rett) => (rett ? oppgtrinn >= trinn - 2 : oppgtrinn <= trinn);

export const nyKamp = (heltLiv, fiendeLiv, fiendeSkade) => ({
  heltLiv,
  fiendeLiv,
  fiendeSkade,
  utfall: null,
});

// Én runde: eleven har valgt angrep og svart. Riktig svar treffer, feil svar bommer.
// Fienden slår tilbake hvis den lever. «traff» og «slag» er skaden i denne runden.
export function runde(k, angrep, rett) {
  const traff = rett ? angrep.skade : 0;
  const fiendeLiv = Math.max(0, k.fiendeLiv - traff);
  const slag = fiendeLiv > 0 ? k.fiendeSkade : 0;
  const heltLiv = Math.max(0, k.heltLiv - slag);
  const utfall = fiendeLiv === 0 ? 'seier' : heltLiv === 0 ? 'tap' : null;
  return { ...k, heltLiv, fiendeLiv, traff, slag, utfall };
}
