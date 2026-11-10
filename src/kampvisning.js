// Teksten i kampbildet som HTML oppå spillet: navn, liv, melding og valg.
// Figurene tegnes av scenen Kamp.
export function lagKampvisning(spill) {
  const rot = document.createElement('div');
  rot.id = 'kamp';
  rot.hidden = true;
  const side = (hvem) => `
    <div class="side ${hvem}">
      <span class="navn"></span><span class="tall"></span>
      <div class="liv"><i></i></div>
    </div>`;
  rot.innerHTML = `
    <div class="flate">
      ${side('helt')}${side('fiende')}
      <div class="melding"></div>
      <div class="valg"></div>
    </div>`;
  document.body.append(rot);

  const el = (velg) => rot.querySelector(velg);
  const flate = el('.flate');
  const valg = el('.valg');
  let los = null;

  // Flata ligger nøyaktig oppå lerretet. --u er én spillpiksel.
  const plasser = () => {
    const r = spill.canvas.getBoundingClientRect();
    for (const k of ['left', 'top', 'width', 'height']) flate.style[k] = r[k] + 'px';
    flate.style.setProperty('--u', r.width / spill.config.width + 'px');
  };
  spill.scale.on('resize', plasser);

  const ferdig = (i) => {
    if (!los || !valg.children[i]) return;
    const svar = los;
    los = null;
    valg.replaceChildren();
    svar(i);
  };

  valg.addEventListener('click', (e) => {
    const knapp = e.target.closest('button');
    if (knapp) ferdig([...valg.children].indexOf(knapp));
  });
  // Tastene skal ikke nå spillet. 1 og 2 velger, pilene flytter mellom knappene.
  rot.addEventListener('keydown', (e) => {
    e.stopPropagation();
    const knapper = [...valg.children];
    if (/^[1-9]$/.test(e.key)) ferdig(Number(e.key) - 1);
    const d = { ArrowLeft: -1, ArrowRight: 1 }[e.key];
    if (d && knapper.length) {
      const i = knapper.indexOf(document.activeElement);
      knapper[(i + d + knapper.length) % knapper.length].focus();
    }
  });
  // Klikk ved siden av knappene skal ikke ta fokus fra dem.
  rot.addEventListener('mousedown', (e) => {
    if (!e.target.closest('button')) e.preventDefault();
  });

  const vis = {
    aapne(heltNavn, fiendeNavn) {
      el('.helt .navn').textContent = heltNavn;
      el('.fiende .navn').textContent = fiendeNavn;
      vis.si('');
      rot.hidden = false;
      plasser();
    },
    liv(hvem, liv, maks) {
      el(`.${hvem} .tall`).textContent = `${liv} / ${maks}`;
      el(`.${hvem} .liv i`).style.width = (100 * liv) / maks + '%';
    },
    si(tekst) {
      el('.melding').textContent = tekst;
    },
    // Viser knapper og gir nummeret på den eleven velger. valg: [{ navn, under }]
    velg(liste) {
      valg.replaceChildren(
        ...liste.map((v) => {
          const knapp = document.createElement('button');
          knapp.type = 'button';
          knapp.append(v.navn);
          if (v.under) {
            const under = document.createElement('small');
            under.textContent = v.under;
            knapp.append(under);
          }
          return knapp;
        }),
      );
      valg.firstChild.focus();
      return new Promise((r) => {
        los = r;
      });
    },
    // Viser en melding og venter til eleven trykker Videre.
    vent(tekst) {
      vis.si(tekst);
      return vis.velg([{ navn: 'Videre' }]);
    },
    skjul() {
      rot.hidden = true;
      los = null;
      valg.replaceChildren();
    },
  };
  return vis;
}
