import barbar from './data/klasser/barbar.js';
import bard from './data/klasser/bard.js';
import prest from './data/klasser/prest.js';
import druide from './data/klasser/druide.js';
import kriger from './data/klasser/kriger.js';
import munk from './data/klasser/munk.js';
import paladin from './data/klasser/paladin.js';
import jeger from './data/klasser/jeger.js';
import tyv from './data/klasser/tyv.js';
import trollmann from './data/klasser/trollmann.js';
import magiker from './data/klasser/magiker.js';
import heksemester from './data/klasser/heksemester.js';

export const KLASSER = [barbar, bard, prest, druide, kriger, munk, paladin, jeger, tyv, trollmann, magiker, heksemester];
export const klasseFor = (id) => KLASSER.find((k) => k.id === id) ?? null;
