import { FOLK, folkFor } from './folkeslag.js';
import { KLASSER, klasseFor } from './klasser.js';
import { ANGREP } from './kamp.js';
import { UTSTYR } from './utstyr.js';
import { HODEPLAGG } from './varer.js';
import { figurbilde } from './figur.js';
import { utseendeFor } from './spiller.js';
import { HAAR, SKJEGG, HAARFARGER, KLESFARGER, SNITT, RUSTNINGER, BUKSER, HODEFARGER, kodeFor, lesValg, tilfeldig } from './utseende.js';

// Heltelaget: eleven velger folk, klasse og utseende. Ved start er helten tilfeldig fra før,
// så eleven kan trykke «Spill!» med en gang. vis() gir { folk, klasse, utseende }, eller null (Esc).
const tall = (n) => [...Array(n).keys()];
const nr = (x) => `${x + 1}`;
const tilfeldigAv = (liste) => liste[Math.floor(Math.random() * liste.length)];

// Radene. «valg» er verdiene eleven kan bla gjennom, «tekst» viser en verdi.
const RADER = [
  { navn: 'Folk', felt: 'folk', valg: () => FOLK.map((f) => f.id), tekst: (id) => folkFor(id).navn },
  { navn: 'Klasse', felt: 'klasse', valg: () => KLASSER.map((k) => k.id), tekst: (id) => klasseFor(id).navn },
  { navn: 'Hud', felt: 'hud', valg: (v) => tall(folkFor(v.folk).hud.length), tekst: nr },
  { navn: 'Ansikt', felt: 'ansikt', valg: () => tall(2), tekst: nr },
  { navn: 'Hår', felt: 'haar', valg: () => tall(HAAR.length), tekst: (x) => (x ? nr(x - 1) : 'Ingen') },
  { navn: 'Hårfarge', felt: 'haarfarge', valg: () => tall(HAARFARGER.length), tekst: nr },
  { navn: 'Skjegg', felt: 'skjegg', valg: () => tall(SKJEGG.length), tekst: (x) => (x ? nr(x - 1) : 'Ingen') },
  {
    navn: 'Klær',
    felt: 'klaer',
    valg: (v, s) => [...tall(SNITT), ...RUSTNINGER.flatMap(([id], i) => (s.utstyr.includes(id) ? [SNITT + i] : []))],
    tekst: (x) => (x < SNITT ? nr(x) : UTSTYR.find((u) => u.id === RUSTNINGER[x - SNITT][0]).navn),
  },
  { navn: 'Farge', felt: 'farge', valg: () => tall(KLESFARGER.length), tekst: nr, vises: (v) => v.u.klaer < SNITT },
  { navn: 'Bukser', felt: 'bukser', valg: () => tall(BUKSER.length), tekst: nr },
  {
    navn: 'Hodeplagg',
    felt: 'hode',
    valg: (v, s) => [0, ...HODEPLAGG.filter((h) => s.hoder.includes(h.id)).flatMap((h) => h.rader.map((r) => r + 1))],
    tekst: (x) => {
      if (!x) return 'Ingen';
      const h = HODEPLAGG.find((p) => p.rader.includes(x - 1));
      return h.rader.length > 1 ? `${h.navn} ${h.rader.indexOf(x - 1) + 1}` : h.navn;
    },
    vises: (v, s) => s.hoder.length > 0,
  },
  { navn: 'Hattfarge', felt: 'hodefarge', valg: () => tall(HODEFARGER), tekst: nr, vises: (v) => v.u.hode > 0 },
];

export function lagHeltelag() {
  const rot = document.createElement('div');
  rot.id = 'heltelag';
  rot.hidden = true;
  rot.innerHTML = `<div class="rute">
    <h2></h2>
    <div class="hoved"><div class="vis"><div class="bilde"></div><p class="om"></p></div><div class="rader"></div></div>
    <div class="knapper"><button type="button" class="tilfeldig">Tilfeldig</button><button type="button" class="ferdig"></button></div>
  </div>`;
  document.body.append(rot);
  const el = (velg) => rot.querySelector(velg);
  let v = null; // { folk, klasse, u }
  let s = null;
  let scene = null;
  let los = null;

  const rader = RADER.map((r) => {
    const rad = document.createElement('div');
    rad.className = 'rad';
    rad.innerHTML = `<span class="navn">${r.navn}</span><button type="button" aria-label="Forrige">◀</button><b class="verdi"></b><button type="button" aria-label="Neste">▶</button>`;
    const [forrige, neste] = rad.querySelectorAll('button');
    forrige.addEventListener('click', () => bla(r, -1));
    neste.addEventListener('click', () => bla(r, 1));
    el('.rader').append(rad);
    return { r, rad };
  });

  const hent = (r) => (r.felt === 'folk' || r.felt === 'klasse' ? v[r.felt] : v.u[r.felt]);
  function sett(r, x) {
    if (r.felt === 'folk') {
      const folk = folkFor(x);
      if (folk.skjegg && !v.u.skjegg) v.u.skjegg = folk.skjegg;
      v.u.hud = Math.min(v.u.hud, folk.hud.length - 1);
      v.folk = x;
    } else if (r.felt === 'klasse') {
      const k = klasseFor(x);
      Object.assign(v.u, { klaer: k.klaer, farge: k.farge });
      v.klasse = x;
    } else v.u[r.felt] = x;
  }
  function bla(r, steg) {
    const valg = r.valg(v, s);
    const i = valg.indexOf(hent(r));
    sett(r, valg[(i + steg + valg.length) % valg.length]);
    tegn();
  }

  function tegn() {
    const helt = { ...s, folk: v.folk, klasse: v.klasse, utseende: v.u };
    el('.bilde').replaceChildren(figurbilde(scene, kodeFor(utseendeFor(helt)), 8));
    const folk = folkFor(v.folk);
    const k = klasseFor(v.klasse);
    const egne = ANGREP.filter((a) => a.klasse === k.id || a.folk === folk.id);
    el('.om').innerHTML = '';
    const linje = (tittel, tekst) => {
      const p = document.createElement('span');
      p.innerHTML = '<b></b> ';
      p.firstChild.textContent = tittel;
      p.append(tekst);
      el('.om').append(p, document.createElement('br'));
    };
    linje(folk.navn, folk.om);
    linje(k.navn, k.om);
    for (const a of egne) linje(a.navn, a.om);
    for (const { r, rad } of rader) {
      rad.hidden = r.vises ? !r.vises(v, s) : false;
      rad.querySelector('.verdi').textContent = r.tekst(hent(r));
    }
  }

  function tilfeldigHelt() {
    const folk = tilfeldigAv(FOLK);
    const k = tilfeldigAv(KLASSER);
    v = { folk: folk.id, klasse: k.id, u: tilfeldig(folk, Math.random, v?.u) };
    tegn();
  }

  const ferdig = (svar) => {
    rot.hidden = true;
    los?.(svar);
    los = null;
  };
  el('.tilfeldig').addEventListener('click', tilfeldigHelt);
  el('.ferdig').addEventListener('click', () => ferdig({ folk: v.folk, klasse: v.klasse, utseende: v.u }));
  rot.addEventListener('keydown', (e) => {
    e.stopPropagation(); // tastene skal ikke nå spillet
    if (e.key === 'Escape' && !el('.ferdig').dataset.start) ferdig(null);
  });
  rot.addEventListener('mousedown', (e) => !e.target.closest('button') && e.preventDefault());

  return {
    // «start»: ny helt (tilfeldig fra før, og ingen Esc). Ellers endres helten eleven har.
    vis(sc, spiller, { start = false } = {}) {
      scene = sc;
      s = spiller;
      el('h2').textContent = start ? 'Lag din helt' : 'Endre helten';
      el('.ferdig').textContent = start ? 'Spill!' : 'Ferdig';
      el('.ferdig').dataset.start = start ? '1' : '';
      if (start && !s.klasse) tilfeldigHelt();
      else {
        v = { folk: s.folk ?? FOLK[0].id, klasse: s.klasse ?? KLASSER[0].id, u: lesValg(s.utseende) };
        tegn();
      }
      rot.hidden = false;
      el('.ferdig').focus();
      return new Promise((r) => {
        los = r;
      });
    },
  };
}
