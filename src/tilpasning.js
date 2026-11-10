// Vanskegraden følger eleven: opp etter 2 rette på rad, ned etter 2 feil på rad.
export const PAA_RAD = 2;

export const nyTilstand = (trinn = 1) => ({ trinn, rette: 0, feil: 0 });

export function oppdater(t, rett, maks) {
  if (rett) {
    if (t.rette + 1 >= PAA_RAD) return nyTilstand(Math.min(maks, t.trinn + 1));
    return { trinn: t.trinn, rette: t.rette + 1, feil: 0 };
  }
  if (t.feil + 1 >= PAA_RAD) return nyTilstand(Math.max(1, t.trinn - 1));
  return { trinn: t.trinn, rette: 0, feil: t.feil + 1 };
}
