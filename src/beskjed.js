// En kort beskjed oppå kartet, med Videre-knapp eller noen valg. Ser ut som oppgaveruta.
export function lagBeskjed() {
  const rot = document.createElement('div');
  rot.id = 'beskjed';
  rot.hidden = true;
  rot.innerHTML = `<div class="rute"><div class="tekst"></div><div class="valg"></div></div>`;
  document.body.append(rot);
  const valg = rot.querySelector('.valg');
  let los = null;

  const ferdig = (i) => {
    if (!los || i < 0) return;
    rot.hidden = true;
    const svar = los;
    los = null;
    svar(i);
  };
  valg.addEventListener('click', (e) => {
    const knapp = e.target.closest('button');
    if (knapp) ferdig([...valg.children].indexOf(knapp));
  });
  // Tastene skal ikke nå spillet. Pilene flytter mellom knappene, tall velger.
  rot.addEventListener('keydown', (e) => {
    e.stopPropagation();
    const knapper = [...valg.children];
    const d = { ArrowLeft: -1, ArrowUp: -1, ArrowRight: 1, ArrowDown: 1 }[e.key];
    if (d) {
      const i = knapper.indexOf(document.activeElement);
      knapper[(i + d + knapper.length) % knapper.length].focus();
      e.preventDefault();
    } else if (knapper.length > 1 && knapper[e.key - 1]) {
      ferdig(e.key - 1);
    }
  });
  rot.addEventListener('mousedown', (e) => !e.target.closest('button') && e.preventDefault());

  return {
    // Viser teksten og venter. Gir nummeret på valget (0 for Videre).
    // liste: [{ navn, under, bilde }], der «bilde» er et HTML-element.
    vis(tekst, liste = [{ navn: 'Videre' }]) {
      rot.querySelector('.tekst').textContent = tekst;
      valg.replaceChildren(
        ...liste.map((v) => {
          const knapp = document.createElement('button');
          knapp.type = 'button';
          if (v.bilde) knapp.append(v.bilde);
          knapp.append(v.navn);
          if (v.under) {
            const under = document.createElement('small');
            under.textContent = v.under;
            knapp.append(under);
          }
          return knapp;
        }),
      );
      rot.hidden = false;
      valg.firstChild.focus();
      return new Promise((r) => {
        los = r;
      });
    },
  };
}
