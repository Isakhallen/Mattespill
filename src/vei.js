// Korteste vei rute for rute (ikke på skrå). Gir stegene etter «fra»,
// eller null når målet er en vegg eller ikke kan nås.
export function finnVei(kart, fra, til) {
  if (kart.vegg(til.x, til.y)) return null;
  const nokkel = (x, y) => y * kart.bredde + x;
  const komFra = new Map([[nokkel(fra.x, fra.y), null]]);
  const ko = [fra];
  for (let i = 0; i < ko.length; i++) {
    const her = ko[i];
    if (her.x === til.x && her.y === til.y) {
      const vei = [];
      for (let r = her; r !== fra; r = komFra.get(nokkel(r.x, r.y))) vei.unshift(r);
      return vei;
    }
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const neste = { x: her.x + dx, y: her.y + dy };
      const n = nokkel(neste.x, neste.y);
      if (kart.vegg(neste.x, neste.y) || komFra.has(n)) continue;
      komFra.set(n, her);
      ko.push(neste);
    }
  }
  return null;
}
