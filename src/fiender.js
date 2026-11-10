import goblin from './data/fiender/goblin.js';
import skjelett from './data/fiender/skjelett.js';
import ork from './data/fiender/ork.js';

export const FIENDER = [goblin, skjelett, ork];

// Bokstaven i tekstkartet → fienden.
export const fiendeFor = (tegn) => FIENDER.find((f) => f.tegn === tegn);
