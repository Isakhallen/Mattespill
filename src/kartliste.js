import kjelleren from './data/kart/kjelleren.js';
import dypet from './data/kart/dypet.js';

// Alle kartene. Eventyret starter i det første.
export const KART = [kjelleren, dypet];
export const FORSTE = kjelleren.id;
export const kartFor = (id) => KART.find((k) => k.id === id) ?? null;

// Trappene: > går ned til kartet i «ned», < går opp til kartet i «opp».
export const TRAPP = { '>': { til: 'ned', motsatt: '<' }, '<': { til: 'opp', motsatt: '>' } };
