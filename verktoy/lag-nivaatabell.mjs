// Lager NIVAAER.md fra oppgavedataene. Kjøres fra repo-roten:
// node verktoy/lag-nivaatabell.mjs
import { writeFileSync } from 'node:fs';
import { STIGE, lagOppgave } from '../src/oppgaver.js';
import { PAA_RAD } from '../src/tilpasning.js';
import { medFro, tall } from '../src/hjelp.js';

const rnd = medFro(1);
const linjer = [
  '# Nivåstigen',
  '',
  `Eleven går opp ett trinn etter ${PAA_RAD} rette på rad, og ned ett trinn etter ${PAA_RAD} feil på rad.`,
  '',
  'Tabellen er laget med `node verktoy/lag-nivaatabell.mjs`. Eksemplene er tilfeldig trukket, med svaret i parentes.',
  '',
  '| Trinn | Oppgavetype | Innhold | Eksempler |',
  '| --- | --- | --- | --- |',
];
for (const s of STIGE) {
  const eksempler = new Map();
  for (let i = 0; i < 50 && eksempler.size < 3; i++) {
    const o = lagOppgave(s.trinn, rnd);
    eksempler.set(o.tekst, `${o.tekst} (${tall(o.svar)}${o.enhet ? ' ' + o.enhet : ''})`);
  }
  linjer.push(`| ${s.trinn} | ${s.navn} | ${s.hva} | ${[...eksempler.values()].join('<br>')} |`);
}
writeFileSync('NIVAAER.md', linjer.join('\n') + '\n');
console.log(STIGE.length, 'trinn skrevet til NIVAAER.md');
