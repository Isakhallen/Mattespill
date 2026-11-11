import { VARER, MAKS_TING, vareFor, draktFor, hodeplaggFor } from './varer.js';
import { maksLiv } from './vekst.js';
import { figurFor, utseendeFor } from './spiller.js';
import { kodeFor } from './utseende.js';
import { atlasbilde, figurbilde } from './figur.js';

// Butikken: regler uten HTML først, så de kan testes med Node.

// Hvor mange eleven har av en vare (ting kan man ha flere av, resten 0 eller 1).
export function antall(s, v) {
  if (v.slag === 'ting') return s.ting[v.id] ?? 0;
  if (v.slag === 'drakt') return s.drakter.includes(v.id) ? 1 : 0;
  if (v.slag === 'hode') return s.hoder.includes(v.id) ? 1 : 0;
  return s.utstyr.includes(v.id) ? 1 : 0;
}
const flest = (v) => (v.slag === 'ting' ? MAKS_TING : 1);
export const salgspris = (v) => v.pris / 2;

// Det varen gir, med få ord.
export function gir(v) {
  if (v.slag === 'ting') return v.heler ? 'Fullt liv' : 'Skader uten oppgave';
  return [v.skade && `+${v.skade} skade`, v.liv && `+${v.liv} liv`].filter(Boolean).join(' · ');
}

// Hylla slik eleven ser den.
export const hylle = (s) =>
  VARER.map((v) => {
    const har = antall(s, v);
    return { id: v.id, navn: v.navn, slag: v.slag, linje: gir(v), pris: v.pris, har, fullt: har >= flest(v), paa: v.slag === 'hode' ? hodeplaggFor(s)?.id === v.id : s.drakt === v.id };
  });

// Endrer helten. Liv fra rustning og drakt som kommer eller går, følger med.
function endre(s, gjor) {
  const foer = maksLiv(s);
  gjor();
  s.figur = figurFor(s);
  s.liv = Math.min(maksLiv(s), Math.max(1, s.liv + maksLiv(s) - foer));
}

// Kjøper en vare for «pris» gull. En ny drakt eller et nytt hodeplagg tas på med en gang. Gir true hvis det gikk.
export function kjop(s, id, pris = vareFor(id)?.pris) {
  const v = vareFor(id);
  if (!v || s.gull < pris || antall(s, v) >= flest(v)) return false;
  endre(s, () => {
    s.gull -= pris;
    if (v.slag === 'ting') s.ting[v.id] = antall(s, v) + 1;
    else if (v.slag === 'drakt') {
      s.drakter.push(v.id);
      s.drakt = v.id;
    } else if (v.slag === 'hode') {
      s.hoder.push(v.id);
      settHode(s, v);
    } else s.utstyr.push(v.id);
  });
  return true;
}

// Selger en vare for halv pris. Gir true hvis det gikk.
export function selg(s, id) {
  const v = vareFor(id);
  if (!v || !antall(s, v)) return false;
  endre(s, () => {
    s.gull += salgspris(v);
    if (v.slag === 'ting') s.ting[v.id]--;
    else if (v.slag === 'drakt') {
      s.drakter = s.drakter.filter((d) => d !== v.id);
      if (s.drakt === v.id) s.drakt = null;
    } else if (v.slag === 'hode') {
      if (hodeplaggFor(s)?.id === v.id) s.utseende.hode = 0;
      s.hoder = s.hoder.filter((h) => h !== v.id);
    } else s.utstyr = s.utstyr.filter((u) => u !== v.id);
  });
  return true;
}

// Hodeplagget på (drakten av, så det synes), eller av (v = null).
function settHode(s, v) {
  s.utseende.hode = v ? v.rader[0] + 1 : 0;
  if (v) s.drakt = null;
}

// Tar på eller av et hodeplagg eleven eier.
export function hodePaa(s, id) {
  const v = vareFor(id);
  if (v?.slag !== 'hode' || !s.hoder.includes(id)) return false;
  endre(s, () => settHode(s, hodeplaggFor(s)?.id === id ? null : v));
  return true;
}

// Tar på en drakt eleven eier, eller tar den av (id = null).
export function taPaa(s, id) {
  if (id !== null && !s.drakter.includes(id)) return false;
  endre(s, () => (s.drakt = draktFor(id)?.id ?? null));
  return true;
}

// Rabatten følger eleven: halv pris på de første trinnene, så 10 % og 20 %.
export const rabatt = (trinn) => (trinn <= 2 ? 50 : trinn === 3 ? 10 : 20);
export const rabattPris = (pris, trinn) => pris - (pris * rabatt(trinn)) / 100;

// Oppgaven som gir rabatt. Prisene går opp i 10, så svaret blir et helt tall.
export function rabattOppgave(v, trinn) {
  const p = rabatt(trinn);
  const av = (v.pris * p) / 100;
  const svar = v.pris - av;
  const forklaring = p === 50 ? `Halvparten av ${v.pris} er ${svar}.` : `${p} % av ${v.pris} er ${av}. ${v.pris} − ${av} = ${svar}.`;
  const tilbud = p === 50 ? 'Du får halv pris.' : `Du får ${p} % rabatt.`;
  return { tekst: `${v.navn} koster ${v.pris} gull. ${tilbud} Hva må du betale?`, svar, enhet: 'gull', forklaring };
}

// Butikken oppå kartet. Klikk på en vare for å kjøpe, selge eller ta på.
// Lukkes med knappen eller Esc.
export function lagButikk() {
  const rot = document.createElement('div');
  rot.id = 'butikk';
  rot.hidden = true;
  rot.innerHTML = `<div class="rute"><h2>Butikken</h2><p class="pung"></p>
    <div class="hylle"></div>
    <div class="handel"></div><p class="melding"></p>
    <button type="button" class="lukk">Lukk</button></div>`;
  document.body.append(rot);
  const el = (velg) => rot.querySelector(velg);
  let los = null;
  let s = null;
  let hjelp = null; // { scene, rute, lyd, endret }
  let valgt = null;
  let brukt = new Set(); // varer der eleven har prøvd rabatten i dette besøket

  const knapp = (tekst, klasse, av = false) => {
    const k = document.createElement('button');
    k.type = 'button';
    k.className = klasse;
    k.textContent = tekst;
    k.disabled = av;
    return k;
  };
  const si = (tekst, klasse = '') => {
    el('.melding').textContent = tekst;
    el('.melding').className = 'melding ' + klasse;
  };

  const bilde = (v) => {
    const medHode = () => kodeFor({ ...utseendeFor(s), hode: v.rader[0] + 1 });
    const b =
      v.slag === 'drakt' ? figurbilde(hjelp.scene, v.figur, 2)
      : v.slag === 'hode' ? figurbilde(hjelp.scene, medHode(), 2)
      : v.bilde && atlasbilde(hjelp.scene, v.bilde, 2);
    const ramme = document.createElement('span');
    ramme.className = 'bilde';
    if (b) ramme.append(b);
    return ramme;
  };

  const tegn = (fokus) => {
    el('.pung').textContent = `Du har ${s.gull} gull.`;
    hjelp.endret?.();
    el('.hylle').replaceChildren(
      ...hylle(s).map((h) => {
        const k = knapp('', 'vare');
        k.dataset.id = h.id;
        k.setAttribute('aria-pressed', h.id === valgt);
        const merke = h.paa ? 'På' : h.slag === 'ting' && h.har ? `×${h.har}` : h.har ? 'Har' : '';
        if (merke) k.dataset.har = merke;
        const navn = document.createElement('b');
        navn.textContent = h.navn;
        const linje = document.createElement('small');
        linje.textContent = h.linje;
        const pris = document.createElement('small');
        pris.className = 'pris';
        pris.textContent = `${h.pris} gull`;
        k.append(bilde(vareFor(h.id)), navn, linje, pris);
        return k;
      }),
    );
    const handel = el('.handel');
    handel.replaceChildren();
    const h = valgt && hylle(s).find((x) => x.id === valgt);
    if (h) {
      const v = vareFor(h.id);
      const trinn = s.tilpasning.trinn;
      const billig = rabattPris(v.pris, trinn);
      const tilbud = rabatt(trinn) === 50 ? 'Halv pris' : `${rabatt(trinn)} % rabatt`;
      handel.append(
        knapp(`Kjøp · ${v.pris} gull`, 'kjop', h.fullt || s.gull < v.pris),
        knapp(`${tilbud}: regn ut prisen`, 'rabatt', h.fullt || s.gull < billig || brukt.has(v.id)),
      );
      if (h.har) handel.append(knapp(`Selg · ${salgspris(v)} gull`, 'selg'));
      if (h.har && (h.slag === 'drakt' || h.slag === 'hode')) handel.append(knapp(h.paa ? 'Ta av' : 'Ta på', 'paa'));
    }
    // Fokus på knappen eleven brukte, ellers på varen.
    const mal = fokus && (el(`.handel .${fokus}:not(:disabled)`) ?? el(`.vare[data-id="${valgt}"]`));
    (mal ?? el('.lukk')).focus();
  };

  const handle = async (hva) => {
    const v = vareFor(valgt);
    if (hva === 'kjop' && kjop(s, v.id)) {
      hjelp.lyd('gull');
      si(`Du kjøpte ${v.navn}!`, 'ok');
    } else if (hva === 'selg' && selg(s, v.id)) {
      hjelp.lyd('gull');
      si(`Du solgte ${v.navn} for ${salgspris(v)} gull.`);
    } else if (hva === 'paa' && v.slag === 'hode') {
      hodePaa(s, v.id);
      hjelp.lyd('magi');
      si(hodeplaggFor(s) ? `Du har på ${v.navn}.` : `Du tok av ${v.navn}.`);
    } else if (hva === 'paa') {
      taPaa(s, s.drakt === v.id ? null : v.id);
      hjelp.lyd('magi');
      si(s.drakt ? `Du har på ${v.navn}.` : 'Du tok av drakten.');
    } else if (hva === 'rabatt') {
      const pris = rabattPris(v.pris, s.tilpasning.trinn);
      rot.hidden = true;
      const svar = await hjelp.rute.spor(rabattOppgave(v, s.tilpasning.trinn), {
        topp: 'Rabatt',
        taster: { Escape: 'lukk' },
      });
      hjelp.rute.skjul();
      rot.hidden = false;
      if (svar !== 'lukk') brukt.add(v.id);
      if (svar === 'rett' && kjop(s, v.id, pris)) {
        hjelp.lyd('gull');
        si(`Riktig! Du kjøpte ${v.navn} for ${pris} gull.`, 'ok');
      } else if (svar === 'feil') si(`Ingen rabatt denne gangen. Prisen er ${v.pris} gull.`);
      else si('');
    }
    tegn(hva === 'rabatt' ? 'kjop' : hva);
  };

  const lukk = () => {
    rot.hidden = true;
    los?.();
    los = null;
  };
  el('.lukk').addEventListener('click', lukk);
  el('.hylle').addEventListener('click', (e) => {
    const k = e.target.closest('.vare');
    if (!k) return;
    valgt = k.dataset.id;
    si('');
    tegn(k.dataset.id);
  });
  el('.handel').addEventListener('click', (e) => {
    const k = e.target.closest('button');
    if (k && !k.disabled) handle(k.className);
  });
  rot.addEventListener('keydown', (e) => {
    e.stopPropagation(); // tastene skal ikke nå spillet
    if (e.key === 'Escape') lukk();
  });
  rot.addEventListener('mousedown', (e) => !e.target.closest('button') && e.preventDefault());

  return {
    // Viser butikken og venter til den lukkes. Kjøp og salg skrives rett i spilleren.
    // hjelpere: { scene (for bildene), rute (oppgaveruta), lyd(navn), endret() (etter hver handel) }.
    vis(spiller, hjelpere) {
      s = spiller;
      hjelp = hjelpere;
      valgt = null;
      brukt = new Set();
      si('Velg en vare.');
      tegn();
      rot.hidden = false;
      el('.lukk').focus();
      return new Promise((r) => {
        los = r;
      });
    },
  };
}
