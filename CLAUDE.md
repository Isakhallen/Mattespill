# Mattespill

Rollespill inspirert av DnD og Baldur's Gate, der matteoppgaver er angrepene. Laget for elever som følger 1P. Første tema er prosent.

## Mål

Elevene skal få lyst til å regne, og alle skal føle mestring. Når hensyn kolliderer, vinner spillfølelse og trygghet over pensumdekning. Læreren trenger ingen oversikt over resultater.

## Krav

- Korte runder. Spillet brukes i 10–20 minutter, i hele økter og hjemme.
- Enkle ord og lite tekst.
- Feil er ufarlig: ingen tidspress og ingen «game over».
- Ingen kalkulator. Tallene skal gå an å regne i hodet eller på papir.
- Den letteste oppgaven er «halvparten av 10», uten prosenttegn. Stigen går videre til prosent av et tall, finne prosenten, økning og nedgang, vekstfaktor og prosentpoeng.
- Vanskegraden følger eleven opp og ned. Skaden måles mot elevens eget nivå: et tungt angrep gir en oppgave som er vanskelig for akkurat den eleven.
- Forskjellige angrep gir forskjellige oppgavetyper.
- Drivkraft: helt som blir sterkere, tøffe bosser, historie og noe å vise fram.
- Skole-PC med Windows, tastatur og mus. Hver elev spiller for seg.
- Framgang lagres i nettleseren (localStorage). Ingen innlogging, og ingen elevdata sendes noe sted.

## Teknikk

- Phaser 3.90.0 i `vendor/`, vanlige ES-moduler, ingen byggesteg og ingen CDN. Statisk nettsted for GitHub Pages.
- 2D sett ovenfra med pikselkunst (16×16). Ikke 3D. Utseendet er mørk dungeon fra 0x72 DungeonTileset II (CC0).
- Oppgavene vises som HTML oppå spillet.
- Kart skrives som tekst, ett tegn per rute. Claude lager kartene.
- Bevegelse rute for rute: klikk for å gå, eller piltaster/WASD.
- Kart, fiender, angrep og oppgavetyper ligger som data i små filer.

## Bøtter

Læreren trenger ikke godkjenne hver bøtte. Bygg bøttene etter planen, test selv og commit etter hver bøtte. Stopp når chatten blir lang. Neste bøtte tas da i en ny chat, så skriv status og planen for neste bøtte her før du stopper.

1. **Gå rundt** (ferdig): helt som går rundt på et testkart.
2. **Oppgavene** (ferdig): oppgavetyper, nivåstige og tilpasning. Tabellen med nivåene ligger i `NIVAAER.md`.
3. **Kampen** (neste): fiender på kartet, turbasert kamp, lett og tungt angrep. Publiseres på en lenke.
4. **Helten vokser**: erfaringspoeng, nivåer, nye angrep, utstyr og lagring.
5. **Første eventyr**: område med flere fiender, boss, klassevalg og kort historie.
6. **Finpuss**: lyd, effekter, heltekort og test med klassen.

## Slik står det etter bøtte 2

- Kjøres med `python -m http.server 8010` i repoet og <http://localhost:8010>.
- `src/kart.js` leser tekstkart (`#` vegg, `.` gulv, `@` start), `src/vei.js` finner vei, `src/tegnKart.js` tegner flisene og `src/scener/Verden.js` styrer helten. Spillet ligger på `window.spill`.
- Atlaset `assets/dungeon.png` + `.json` har alle 370 navn fra pakkens `tile_list`, for eksempel `knight_m_run_anim_f0`. Det lages på nytt med `node verktoy/lag-atlas.mjs kilder/0x72/0x72_DungeonTilesetII_v1.7`. Pakken ligger utpakket i `kilder/0x72/`, utenfor git.
- Oppgavetypene ligger i `src/data/oppgaver/`, én fil per type. `src/oppgaver.js` setter dem sammen til stigen `STIGE` (12 trinn) og har `lagOppgave(trinn)`, `tolkSvar` og `erRett`. `NIVAAER.md` lages med `node verktoy/lag-nivaatabell.mjs`.
- `src/tilpasning.js`: opp etter 2 rette på rad, ned etter 2 feil på rad. Trinnet ligger foreløpig bare i minnet.
- `src/oppgaverute.js` viser en oppgave som HTML oppå spillet: `await rute.spor(oppgave, { topp, bunn, taster })` gir `'rett'` eller `'feil'`. `Verden.opptatt` stopper helten mens ruta er åpen.
- Tast O starter øving (`src/oving.js`) med + og − for å bytte trinn. Det er en lærertast som kan fjernes når kampen er på plass.
- Logikk testes med `node --test test/` (`package.json` har bare `"type": "module"`).
- Test i skjult Edge: bruk ny `--user-data-dir` hver gang, ellers kommer gamle filer fra cache. Spill-løkka går nesten ikke med `--virtual-time-budget`. En midlertidig testside må kalle `spill.loop.stop()` og så `spill.step(tid, 16)` i en løkke med `await` på 16 ms mellom hvert bilde, og resultatet leses med `--dump-dom`.

## Plan for bøtte 3

1. Fiender som data i `src/data/fiender/`: navn, figur i atlaset, liv og skade. De settes på kartet med egne bokstaver i tekstkartet.
2. Kampen starter når helten går inn i en fiende. Kampvisning oppå kartet: helt og fiende, livslinjer og to valg, lett og tungt angrep. Turbasert.
3. Angrep som data i `src/data/angrep/`: navn, skade og hvor på stigen oppgaven hentes. Lett angrep gir en oppgave et par trinn under elevens trinn, tungt angrep gir elevens eget trinn og mer skade. Riktig svar treffer, feil svar bommer. Oppgavetypen følger av trinnet. I bøtte 4 kan nye angrep bindes til bestemte oppgavetyper.
4. Fiendens tur gir litt skade uten oppgave. Ingen «game over»: går helten tom for liv, våkner den ved start med fullt liv.
5. Hvert svar oppdaterer elevens trinn med `src/tilpasning.js`. Trinnet vises ikke for eleven i kamp.
6. Publisering på GitHub Pages. Læreren lager repoet i nettleseren (`gh` mangler). Gi kommandoene for `git remote add` og `git push`, og si hvor Pages slås på.
7. Kampreglene testes med Node, og flyten i skjult Edge.

Lyd, musikk og effekter kan senere hentes fra Ninja Adventure, <https://github.com/pixel-boy/NinjaAdventure> (CC0).

## Arbeidsregler

- Læreren har Claude Pro og er begrenset av tokens. Skriv kort, les bare filene som trengs, og bruk ikke subagenter eller brede søk.
- Åpne aldri vinduer på lærerens PC for å teste. Test logikk med Node. Ta skjermbilder med skjult Edge (`--headless=new --screenshot`), startet fra PowerShell med `Start-Process -Wait` og egen `--user-data-dir`.
- Bruk det andre har lagt ut gratis så mye som mulig: grafikk, lyd, musikk, effekter og kode. Velg helst CC0, sjekk lisensen på kildesiden før bruk, og før opp kilde og lisens i `KILDER.md`.
- `gh` er ikke installert. GitHub-repoet lages i nettleseren.
- Repoet blir offentlig. Skriv ikke noe om klassen eller elevene her.
- Oppdater bøttelista og planen i denne fila når en bøtte er godkjent.
