import { lagNavn, rensKode, KODE_MIN, KODE_MAKS } from './nett.js';

// Ruta der eleven ser navnet sitt, kan få et nytt og skriver klassekoden.
// vis(nett) gir { navn, kode } når eleven er ferdig (kode '' = spill alene).
const OM = 'De andre med samme kode ser helten din,<br>navnet og nivået. Ingenting annet sendes.';

export function lagKlasserom() {
  const rot = document.createElement('div');
  rot.id = 'klasserom';
  rot.hidden = true;
  rot.innerHTML = `<form class="rute" autocomplete="off">
    <div class="tekst">Helten din heter<br><b class="navn"></b></div>
    <button type="button" class="nytt">Nytt navn</button>
    <label class="kodelinje">Klassekode
      <input class="kode" maxlength="${KODE_MAKS}" spellcheck="false"></label>
    <p class="om"></p>
    <div class="valg"><button type="submit">Bli med</button><button type="button" class="alene">Spill alene</button></div>
  </form>`;
  document.body.append(rot);
  const el = (velg) => rot.querySelector(velg);
  const felt = el('.kode');
  let navn = '';
  let los = null;

  const ferdig = (kode) => {
    rot.hidden = true;
    los({ navn, kode });
  };
  el('.nytt').addEventListener('click', () => {
    navn = lagNavn(Math.random, navn);
    el('.navn').textContent = navn;
  });
  el('.alene').addEventListener('click', () => ferdig(''));
  el('form').addEventListener('submit', (e) => {
    e.preventDefault();
    const kode = rensKode(felt.value);
    if (kode) return ferdig(kode);
    el('.om').textContent = `Koden må ha minst ${KODE_MIN} bokstaver eller tall.`;
    felt.focus();
  });
  // Tastene skal ikke nå spillet.
  rot.addEventListener('keydown', (e) => e.stopPropagation());

  return {
    vis(nett) {
      navn = nett.navn;
      el('.navn').textContent = navn;
      felt.value = nett.kode;
      el('.om').innerHTML = OM;
      rot.hidden = false;
      felt.focus();
      return new Promise((r) => {
        los = r;
      });
    },
  };
}
