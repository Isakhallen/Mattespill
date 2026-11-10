import del from './data/oppgaver/del.js';
import prosentAv from './data/oppgaver/prosentAv.js';
import finnProsent from './data/oppgaver/finnProsent.js';
import endring from './data/oppgaver/endring.js';
import vekstfaktor from './data/oppgaver/vekstfaktor.js';
import prosentpoeng from './data/oppgaver/prosentpoeng.js';
import { velger } from './hjelp.js';

export const TYPER = [del, prosentAv, finnProsent, endring, vekstfaktor, prosentpoeng];

// Nivåstigen. STIGE[0] er trinn 1.
export const STIGE = [];
for (const type of TYPER) {
  for (const [nr, t] of Object.entries(type.trinn)) {
    STIGE[nr - 1] = { trinn: Number(nr), type: type.id, navn: type.navn, hva: t.hva, lag: t.lag };
  }
}
export const MAKS_TRINN = STIGE.length;

// Lager en oppgave på et trinn. «unngaa» er teksten til forrige oppgave.
export function lagOppgave(trinn, rnd = Math.random, unngaa = null) {
  const s = STIGE[trinn - 1];
  const v = velger(rnd);
  let o;
  for (let i = 0; i < 10; i++) {
    o = s.lag(v);
    if (o.tekst !== unngaa) break;
  }
  return { enhet: '', ...o, trinn: s.trinn, type: s.type, navn: s.navn };
}

// «1,25», «25 %» og «220 gull» blir til tall. Gir null når det ikke er et tall.
export function tolkSvar(tekst) {
  const t = String(tekst).replace(',', '.').replace(/[^0-9.\-]/g, '');
  if (t === '' || Number.isNaN(Number(t))) return null;
  return Number(t);
}

export function erRett(oppgave, tekst) {
  const x = tolkSvar(tekst);
  return x !== null && Math.abs(x - oppgave.svar) < 1e-9;
}
