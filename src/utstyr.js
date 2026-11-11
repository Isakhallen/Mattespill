import rustentSverd from './data/utstyr/rustentSverd.js';
import laervest from './data/utstyr/laervest.js';
import sverd from './data/utstyr/sverd.js';
import ringbrynje from './data/utstyr/ringbrynje.js';
import gullsverd from './data/utstyr/gullsverd.js';
import platerustning from './data/utstyr/platerustning.js';
import runesverd from './data/utstyr/runesverd.js';
import dragerustning from './data/utstyr/dragerustning.js';

// Kistene gir utstyret i denne rekkefølgen. Det med «butikk» finnes bare i butikken.
export const UTSTYR = [rustentSverd, laervest, sverd, ringbrynje, gullsverd, platerustning, runesverd, dragerustning];
export const KISTEUTSTYR = UTSTYR.filter((u) => !u.butikk);

// Bokstaven for en kiste i tekstkartet, og bildene i atlaset.
export const KISTE = 'k';
export const KISTE_LUKKET = 'chest_full_open_anim_f0';
export const KISTE_AAPEN = 'chest_empty_open_anim_f2';

// Livsdrikk: gir fullt liv, én gang.
export const DRIKK = 'h';
export const DRIKK_BILDE = 'flask_big_red';

// Gullkrukke: gull å plukke opp (en mynt som snurrer i kartet).
export const KRUKKE = '$';
export const MYNT = 'coin_anim';

// Butikken: en handelsmann i landsbyen.
export const BUTIKK = 'b';
export const SELGER = 'elf_m'; // ikke dvergen, for Smeden Dag er en dverg
