// Gjør et tekstkart om til noe spillet kan spørre.
// Tegn: # = vegg, . = gulv, @ = der helten starter.
export function lesKart(linjer) {
  const bredde = linjer[0].length;
  let start = null;
  linjer.forEach((linje, y) => {
    if (linje.length !== bredde) {
      throw new Error(`Kartlinje ${y} har ${linje.length} tegn, ventet ${bredde}`);
    }
    const x = linje.indexOf('@');
    if (x >= 0) start = { x, y };
  });
  if (!start) throw new Error('Kartet mangler @ (start)');
  const hoyde = linjer.length;
  const vegg = (x, y) =>
    x < 0 || y < 0 || x >= bredde || y >= hoyde || linjer[y][x] === '#';
  return { bredde, hoyde, start, vegg };
}
