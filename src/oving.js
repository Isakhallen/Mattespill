import { lagOppgave, MAKS_TRINN } from './oppgaver.js';
import { nyTilstand, oppdater } from './tilpasning.js';

let tilstand = nyTilstand();

// Øving: oppgaver på rad til eleven trykker Esc. + og − bytter trinn.
export async function kjorOving(rute) {
  let forrige = null;
  for (;;) {
    const oppgave = lagOppgave(tilstand.trinn, Math.random, forrige);
    forrige = oppgave.tekst;
    const utfall = await rute.spor(oppgave, {
      topp: `Trinn ${tilstand.trinn} av ${MAKS_TRINN} · ${oppgave.navn}`,
      bunn: 'Esc lukker · + og − bytter trinn',
      taster: { Escape: 'lukk', '+': 'opp', '-': 'ned' },
    });
    if (utfall === 'lukk') break;
    if (utfall === 'opp' || utfall === 'ned') {
      const nytt = tilstand.trinn + (utfall === 'opp' ? 1 : -1);
      tilstand = nyTilstand(Math.min(MAKS_TRINN, Math.max(1, nytt)));
    } else {
      tilstand = oppdater(tilstand, utfall === 'rett', MAKS_TRINN);
    }
  }
  rute.skjul();
}
