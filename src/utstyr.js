import rustentSverd from './data/utstyr/rustentSverd.js';
import laervest from './data/utstyr/laervest.js';
import sverd from './data/utstyr/sverd.js';
import ringbrynje from './data/utstyr/ringbrynje.js';
import gullsverd from './data/utstyr/gullsverd.js';
import platerustning from './data/utstyr/platerustning.js';

// Kistene gir utstyret i denne rekkefølgen.
export const UTSTYR = [rustentSverd, laervest, sverd, ringbrynje, gullsverd, platerustning];

// Bokstaven for en kiste i tekstkartet, og bildene i atlaset.
export const KISTE = 'k';
export const KISTE_LUKKET = 'chest_full_open_anim_f0';
export const KISTE_AAPEN = 'chest_empty_open_anim_f2';
