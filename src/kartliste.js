import verden from './data/kart/verden.js';
import kjelleren from './data/kart/kjelleren.js';
import dypet from './data/kart/dypet.js';
import skogen from './data/kart/skogen.js';
import sumpen from './data/kart/sumpen.js';
import ishula from './data/kart/ishula.js';
import lavagrotta from './data/kart/lavagrotta.js';
import { lesKart } from './kart.js';
import { STENGT } from './data/ute.js';

// Alle kartene. Eventyret starter i det første.
export const KART = [verden, kjelleren, dypet, skogen, sumpen, ishula, lavagrotta];
export const FORSTE = verden.id;
export const kartFor = (id) => KART.find((k) => k.id === id) ?? null;

// Leser kartet med de riktige veggene for stilen.
export const lesKartData = (data) => lesKart(data.ruter, data.stil === 'ute' ? STENGT : '#');

// Trapper og porter. > går ned til kartet i «ned», < går opp til kartet i «opp».
// Sifrene er porter på verdenskartet (se «innganger»). Gir { navn, kart } eller null.
// En port uten kart er stengt.
export const UTGANG = /^[<>0-9]$/;
export function utgang(data, tegn) {
  if (tegn === '>') return data.ned ? { kart: data.ned } : null;
  if (tegn === '<') return data.opp ? { kart: data.opp } : null;
  return data.innganger?.[tegn] ?? null;
}

// Utgangen helten kommer ut av når den kommer fra kartet «fra».
export function inngangFra(data, kart, fra) {
  return kart.merker.find((m) => UTGANG.test(m.tegn) && utgang(data, m.tegn)?.kart === fra) ?? null;
}

// En port er åpen når den har et kart og bossen i «krever» er slått («bosser» er id-ene).
export const portAapen = (u, bosser = []) => !!u?.kart && (!u.krever || bosser.includes(u.krever));

// Porten på verdenskartet som åpner seg når bossen «bossId» er slått.
export const portEtter = (bossId) =>
  Object.values(kartFor(FORSTE).innganger ?? {}).find((u) => u.krever === bossId) ?? null;
