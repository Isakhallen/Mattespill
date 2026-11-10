import goblin from './data/fiender/goblin.js';
import imp from './data/fiender/imp.js';
import skjelett from './data/fiender/skjelett.js';
import ork from './data/fiender/ork.js';
import maskeork from './data/fiender/maskeork.js';
import sjaman from './data/fiender/sjaman.js';
import tallslukeren from './data/fiender/tallslukeren.js';

export const FIENDER = [goblin, imp, skjelett, ork, maskeork, sjaman, tallslukeren];

// Bokstaven i tekstkartet → fienden.
export const fiendeFor = (tegn) => FIENDER.find((f) => f.tegn === tegn);
