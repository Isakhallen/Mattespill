import helt from './data/helt.js';
import { nyTilstand } from './tilpasning.js';
import { MAKS_TRINN } from './oppgaver.js';
import { UTSTYR } from './utstyr.js';
import { klasseFor } from './klasser.js';
import { folkFor, FOLK } from './folkeslag.js';
import { kodeFor, lesValg, SNITT, RUSTNINGER, VAAPENNAVN, VAAPENNIVAA } from './utseende.js';
import { kartFor, FORSTE } from './kartliste.js';
import { maksLiv, nivaa, beste } from './vekst.js';
import { ANGREP, MAKS_ANGREP, standardValg, medEgne, egnet } from './kamp.js';
import { les, skriv } from './lagring.js';
import { lesOppdrag } from './folk.js';
import { TING, MAKS_TING, DRAKTER, draktFor, HODEPLAGG, hodeplaggMed } from './varer.js';

// Klassene fra før heltelaget kom. En slik helt får velge folk og utseende én gang («velgIgjen»).
const GAMLE = { ridder: ['menneske', 'kriger'], alv: ['alv', 'jeger'], trollmann: ['menneske', 'trollmann'] };

// Utseendet en ny helt får: klassens klær og folkets skjegg.
const startUtseende = (folk, klasse) => ({ ...lesValg(), haar: 1, klaer: klasse.klaer, farge: klasse.farge, skjegg: folk.skjegg ?? 0 });

const heltall = (x, min, maks) => Number.isInteger(x) && x >= min && x <= maks;
const tekster = (x) => (Array.isArray(x) ? [...new Set(x.filter((t) => typeof t === 'string'))] : []);

// Lager spilleren fra det som er lagret. Det som mangler eller er rart, får startverdien.
// «klasse» og «folk» er null til eleven har valgt. «utseende» er valgene fra heltelaget (src/utseende.js),
// og «hoder» er hodeplaggene eleven eier. «kart» er kartet helten står i.
// «slaatt» og «aapnet» er fiender og ting på kartet, skrevet som «kart:x,y».
// «sett» er historietekster eleven har sett. «seire» er hvor mange ganger en boss er slått,
// og «bosser» er id-ene til bossene som er slått minst én gang (de åpner nye porter).
// «oppdrag» er { id: { steg, antall } } (se src/folk.js).
// «angrep» er angrepene eleven har tatt med fra angrepsboka (høyst MAKS_ANGREP).
// «ting» er { id: antall } for drikker og bomber, «drakter» er draktene eleven eier,
// og «drakt» er den helten har på (null = ingen).
export function lagSpiller(d) {
  if (!d || typeof d !== 'object') d = {};
  const gammel = !d.folk && GAMLE[d.klasse];
  const klasse = klasseFor(gammel ? gammel[1] : d.klasse);
  const folk = klasse ? (folkFor(gammel ? gammel[0] : d.folk) ?? FOLK[0]) : null;
  const drakter = tekster(d.drakter).filter((id) => DRAKTER.some((x) => x.id === id));
  const ting = {};
  for (const t of TING) ting[t.id] = heltall(d.ting?.[t.id], 0, MAKS_TING) ? d.ting[t.id] : 0;
  const s = {
    klasse: klasse?.id ?? null,
    folk: folk?.id ?? null,
    velgIgjen: !!gammel || (!!klasse && d.velgIgjen === true),
    navn: klasse?.navn ?? helt.navn,
    utseende: d.utseende || !klasse ? lesValg(d.utseende) : startUtseende(folk, klasse),
    hoder: tekster(d.hoder).filter((id) => HODEPLAGG.some((h) => h.id === id)),
    kart: kartFor(d.kart)?.id ?? FORSTE,
    erfaring: heltall(d.erfaring, 0, 1e6) ? d.erfaring : 0,
    tilpasning: nyTilstand(heltall(d.trinn, 1, MAKS_TRINN) ? d.trinn : 1),
    utstyr: tekster(d.utstyr).filter((id) => UTSTYR.some((u) => u.id === id)),
    slaatt: tekster(d.slaatt),
    aapnet: tekster(d.aapnet),
    sett: tekster(d.sett),
    seire: heltall(d.seire, 0, 1e6) ? d.seire : 0,
    bosser: tekster(d.bosser),
    oppdrag: lesOppdrag(d.oppdrag),
    gull: heltall(d.gull, 0, 1e6) ? d.gull : 0,
    ting,
    drakter,
    drakt: drakter.includes(d.drakt) ? d.drakt : null,
  };
  // Lagret før bøtte 12: en seier betyr at Tallslukeren er slått.
  if (s.seire && !s.bosser.length) s.bosser.push('tallslukeren');
  s.figur = figurFor(s);
  s.liv = heltall(d.liv, 1, maksLiv(s)) ? d.liv : maksLiv(s);
  const n = nivaa(s.erfaring);
  const angrep = tekster(d.angrep).filter((id) => ANGREP.some((a) => a.id === id && egnet(a, s)));
  s.angrep = angrep.length ? angrep.slice(0, MAKS_ANGREP) : standardValg(n, s);
  if (gammel) s.angrep = medEgne(s.angrep, n, s);
  return s;
}

// Utseendet slik det tegnes: valgene, folket, klassens våpen og skjold og nivået på det beste våpenet.
// Rustning og hodeplagg vises bare hvis eleven eier dem.
export function utseendeFor(s) {
  const folk = folkFor(s.folk) ?? FOLK[0];
  const k = klasseFor(s.klasse) ?? klasseFor('kriger');
  const u = { ...s.utseende };
  const rustning = RUSTNINGER[u.klaer - SNITT];
  if (rustning && !s.utstyr.includes(rustning[0])) u.klaer = 0;
  if (u.hode && !s.hoder.includes(hodeplaggMed(u.hode - 1)?.id)) u.hode = 0;
  const v = VAAPENNIVAA[beste(s.utstyr, 'vaapen')?.id] ?? 0;
  return {
    ...u,
    folk: FOLK.indexOf(folk),
    hud: Math.min(u.hud, folk.hud.length - 1),
    vaapen: VAAPENNAVN.indexOf(k.vaapen),
    nivaa: v,
    skjold: k.skjold ? v + 1 : 0,
  };
}

// Figuren helten har: drakten, ellers helten satt sammen av deler (en kode, se src/utseende.js).
export const figurFor = (s) => draktFor(s.drakt)?.figur ?? kodeFor(utseendeFor(s));

// Gir helten folk, klasse og utseende fra heltelaget («valg» er { folk, klasse, utseende }).
// Klassens og folkets egne angrep byttes ut, og livet følger med.
export function velgHelt(s, valg) {
  const ny = !s.klasse;
  const foer = maksLiv(s);
  const klasse = klasseFor(valg.klasse);
  Object.assign(s, { folk: folkFor(valg.folk).id, klasse: klasse.id, navn: klasse.navn, velgIgjen: false });
  s.utseende = lesValg(valg.utseende ?? (ny ? startUtseende(folkFor(valg.folk), klasse) : s.utseende));
  s.angrep = medEgne(s.angrep, nivaa(s.erfaring), s);
  s.figur = figurFor(s);
  s.liv = ny ? maksLiv(s) : Math.min(maksLiv(s), Math.max(1, s.liv + maksLiv(s) - foer));
}

// Bare en ny klasse (brukes i testene). Folket blir menneske hvis helten ikke har et.
export const velgKlasse = (s, id) => velgHelt(s, { folk: s.folk ?? 'menneske', klasse: id });

export const tilLagring = (s) => ({
  klasse: s.klasse,
  folk: s.folk,
  velgIgjen: s.velgIgjen,
  utseende: s.utseende,
  hoder: s.hoder,
  kart: s.kart,
  erfaring: s.erfaring,
  liv: s.liv,
  trinn: s.tilpasning.trinn,
  utstyr: s.utstyr,
  slaatt: s.slaatt,
  aapnet: s.aapnet,
  sett: s.sett,
  seire: s.seire,
  bosser: s.bosser,
  angrep: s.angrep,
  oppdrag: s.oppdrag,
  gull: s.gull,
  ting: s.ting,
  drakter: s.drakter,
  drakt: s.drakt,
});

// Det som følger eleven gjennom spillet.
export const spiller = lagSpiller(les());
export const lagre = () => skriv(tilLagring(spiller));
