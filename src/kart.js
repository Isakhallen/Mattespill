// Gjør et tekstkart om til noe spillet kan spørre.
// Tegn: # = vegg, . = gulv, @ = der helten starter.
// Bokstaver er gulv med noe på, f.eks. en fiende (se src/fiender.js).
export function lesKart(linjer) {
  const bredde = linjer[0].length;
  let start = null;
  const merker = [];
  linjer.forEach((linje, y) => {
    if (linje.length !== bredde) {
      throw new Error(`Kartlinje ${y} har ${linje.length} tegn, ventet ${bredde}`);
    }
    [...linje].forEach((tegn, x) => {
      if (tegn === '@') start = { x, y };
      else if (/[a-zæøå]/i.test(tegn)) merker.push({ tegn, x, y });
    });
  });
  if (!start) throw new Error('Kartet mangler @ (start)');
  const hoyde = linjer.length;
  const vegg = (x, y) =>
    x < 0 || y < 0 || x >= bredde || y >= hoyde || linjer[y][x] === '#';
  return { bredde, hoyde, start, merker, vegg };
}
