import menneske from './data/folkeslag/menneske.js';
import alv from './data/folkeslag/alv.js';
import dverg from './data/folkeslag/dverg.js';
import halvling from './data/folkeslag/halvling.js';
import gnom from './data/folkeslag/gnom.js';
import halvalv from './data/folkeslag/halvalv.js';
import ork from './data/folkeslag/ork.js';
import tiefling from './data/folkeslag/tiefling.js';
import drakefolk from './data/folkeslag/drakefolk.js';

// Folkene helten kan høre til («rase» i DnD). Rekkefølgen er den i heltelaget og i koden for utseendet.
export const FOLK = [menneske, alv, dverg, halvling, gnom, halvalv, ork, tiefling, drakefolk];
export const folkFor = (id) => FOLK.find((f) => f.id === id) ?? null;
