import ridder from './data/klasser/ridder.js';
import alv from './data/klasser/alv.js';
import trollmann from './data/klasser/trollmann.js';

export const KLASSER = [ridder, alv, trollmann];
export const klasseFor = (id) => KLASSER.find((k) => k.id === id) ?? null;
