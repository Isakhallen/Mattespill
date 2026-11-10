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

// Skaden måles mot elevens trinn: samme trinn gir 6 (som tungt), to under gir 3 (som lett).
export const skadeFor = (oppgtrinn, trinn) => klemt(Math.round(6 + 1.5 * (oppgtrinn - trinn)), 2, 9);

// Typeangrep vises bare når oppgaven er høyst så mange trinn over eleven.
export const MAKS_OVER = 2;

// Angrepene eleven kan velge mellom: de faste, og de opplåste typeangrepene
// som ligger nærmest elevens trinn. «bonus» er skade fra nivå og våpen.
export function angrepFor(nivaa, trinn, bonus = 0) {
  const klare = ANGREP.filter((a) => (a.nivaa ?? 1) <= nivaa).map((a) => {
    const t = oppgavetrinn(a, trinn);
    return { ...a, oppgavetrinn: t, skade: (a.skade ?? skadeFor(t, trinn)) + bonus };
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
