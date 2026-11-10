import lett from './data/angrep/lett.js';
import tungt from './data/angrep/tungt.js';

// Kampregler uten grafikk, så de kan testes med Node.
export const ANGREP = [lett, tungt];

// Trinnet oppgaven hentes fra når eleven står på «trinn».
export const oppgavetrinn = (angrep, trinn) => Math.max(1, trinn + angrep.trinn);

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
