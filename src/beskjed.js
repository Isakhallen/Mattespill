// En kort beskjed oppå kartet, med en Videre-knapp. Ser ut som oppgaveruta.
export function lagBeskjed() {
  const rot = document.createElement('div');
  rot.id = 'beskjed';
  rot.hidden = true;
  rot.innerHTML = `
    <form class="rute">
      <div class="tekst"></div>
      <button type="submit">Videre</button>
    </form>`;
  document.body.append(rot);
  const knapp = rot.querySelector('button');
  let los = null;

  rot.addEventListener('keydown', (e) => e.stopPropagation()); // tastene skal ikke nå spillet
  rot.addEventListener('mousedown', (e) => e.target !== knapp && e.preventDefault());
  rot.querySelector('form').addEventListener('submit', (e) => {
    e.preventDefault();
    rot.hidden = true;
    const svar = los;
    los = null;
    svar?.();
  });

  return {
    // Viser teksten og venter til eleven trykker Videre.
    vis(tekst) {
      rot.querySelector('.tekst').textContent = tekst;
      rot.hidden = false;
      knapp.focus();
      return new Promise((r) => {
        los = r;
      });
    },
  };
}
