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
3. **Kampen** (ferdig): fiender på kartet, turbasert kamp, lett og tungt angrep. Klar til å publiseres på GitHub Pages.
4. **Helten vokser** (ferdig): erfaringspoeng, nivåer, nye angrep, utstyr og lagring.
5. **Første eventyr** (neste): område med flere fiender, boss, klassevalg og kort historie.
6. **Finpuss**: lyd, effekter, heltekort og test med klassen.

## Slik står det etter bøtte 4

- Kjøres med `python -m http.server 8010` i repoet og <http://localhost:8010>.
- `src/kart.js` leser tekstkart (`#` vegg, `.` gulv, `@` start, bokstaver = `merker`), `src/vei.js` finner vei, `src/tegnKart.js` tegner flisene og `src/scener/Verden.js` styrer helten og fiendene på kartet. Spillet ligger på `window.spill`.
- Atlaset `assets/dungeon.png` + `.json` har alle 370 navn fra pakkens `tile_list`, for eksempel `knight_m_run_anim_f0`. Det lages på nytt med `node verktoy/lag-atlas.mjs kilder/0x72/0x72_DungeonTilesetII_v1.7`. Pakken ligger utpakket i `kilder/0x72/`, utenfor git. `src/figur.js` lager animasjonene `<figur>_idle` og `<figur>_run`.
- Oppgavetypene ligger i `src/data/oppgaver/`, én fil per type. `src/oppgaver.js` setter dem sammen til stigen `STIGE` (12 trinn) og har `lagOppgave(trinn)`, `tolkSvar` og `erRett`. `NIVAAER.md` lages med `node verktoy/lag-nivaatabell.mjs`.
- `src/tilpasning.js`: opp etter 2 rette på rad, ned etter 2 feil på rad.
- `src/spiller.js` har det som følger eleven: navn, figur, `erfaring`, `liv`, `tilpasning` (trinnet), `utstyr` og `slaatt`/`aapnet` (fiender og kister som «kart:x,y»). `lagSpiller(data)` tåler manglende og rare verdier, og `lagre()` skriver til localStorage via `src/lagring.js` (nøkkel `mattespill`, `versjon: 1`). Nivået lagres ikke, det regnes fra erfaringen. Startverdiene og `perNivaa` står i `src/data/helt.js`.
- `src/vekst.js`: `nivaa(erfaring)` (grense 5·n·(n−1): 10, 30, 60 …, maks 20), `maksLiv`, `skadeBonus` (nivå og beste våpen), `kampErfaring` (fiendens `erfaring` ved seier + 1 per rett svar, også ved tap), `giErfaring` og `nesteUtstyr`.
- Utstyr: `src/data/utstyr/` (våpen `skade`, rustning `liv`) og `src/utstyr.js` med rekkefølgen kistene gir dem i. Kiste er `k` i kartet. Det beste brukes av seg selv.
- `src/status.js` er statuslinja på kartet (nivå, liv, erfaring). `src/beskjed.js` er en melding med Videre-knapp.
- Fiender: `src/data/fiender/` (`tegn` er bokstaven i kartet, `figur`, `liv`, `skade`) og `src/fiender.js` med `fiendeFor(tegn)`. Goblin `g`, skjelett `s`, ork `o`.
- Angrep: `src/data/angrep/`. Lett og tungt har `skade` og `trinn` (målt fra elevens trinn: −2 og 0). Typeangrepene (Ildkule, Lyn, Isspyd, Storm, Meteor) har `type` og `nivaa` (låses opp på nivå 2–6), henter oppgaven fra trinnet i typen nærmest eleven, og skaden regnes mot elevens trinn (`skadeFor`: samme trinn 6, to under 3).
- `src/kamp.js` har reglene uten grafikk: `ANGREP`, `oppgavetrinn`, `angrepFor(nivaa, trinn, bonus)` (lett, tungt og opptil to typeangrep, aldri mer enn 2 trinn over eleven), `teller` (feil over elevens trinn senker ikke, rett langt under løfter ikke), `nyKamp` og `runde`.
- `src/scener/Kamp.js` tegner arena og figurer og kjører rundene. `src/kampvisning.js` er HTML oppå lerretet (navn, liv, melding, knapper) med mål i spillpiksler (`--u`). Tastene 1–4 velger angrep.
- Verden starter kampen når helten går inn i en fiende, og åpner kisten når helten går inn i den. Etter kampen kaller Kamp `oppgjor(k)`, som gir erfaring og lagrer, og viser meldingene (seier, nytt nivå, nytt angrep). Seier fjerner fienden. Tap: helten våkner ved start med fullt liv, og fienden beholder skaden. Når alle er slått, kommer de tilbake (foreløpig løsning til bøtte 5).
- `src/oppgaverute.js` viser en oppgave som HTML oppå spillet: `await rute.spor(oppgave, { topp, bunn, taster })` gir `'rett'` eller `'feil'`. `Verden.opptatt` stopper helten mens oppgave eller kamp vises.
- Tast O starter øving (`src/oving.js`) med + og − for å bytte trinn. Den er en skjult lærertast med eget trinn, uten hint på skjermen.
- Logikk testes med `node --test` i repo-roten, uten mappe som argument (`package.json` har bare `"type": "module"`).
- Test i skjult Edge: bruk ny `--user-data-dir` hver gang, ellers kommer gamle filer fra cache. Spill-løkka går nesten ikke med `--virtual-time-budget`. En midlertidig testside må vente til `spill.isRunning` er sann, kalle `spill.loop.stop()` og så `spill.step(tid, 16)` i en løkke med `await` på 16 ms mellom hvert bilde. Resultatet leses med `--dump-dom`. HTML-knapper trykkes med `.click()`, og svar sendes med `form.requestSubmit()`. Slett testsiden etterpå.

## Plan for bøtte 5

Dette er et forslag. Læreren kan endre det før bøtta starter.

1. Nytt kart for eventyret, større enn testkartet, med rom som blir vanskeligere innover. Støtte for flere kart (dør eller trapp med egen bokstav) og at fiendene ikke kommer tilbake.
2. Flere fiender med egne figurer fra atlaset, og en boss med mye liv som slår hardere. Bossen bør kreve både typeangrep og tungt angrep.
3. Klassevalg ved start (f.eks. ridder, alv, trollmann) med egen figur og litt ulike startverdier. Lagres.
4. Kort historie: tekst ved start, før bossen og etter seier, med `src/beskjed.js`.
5. Måte å starte på nytt (ny helt) uten å miste trygghet: spør først.
6. Test reglene med Node og flyten i skjult Edge.

Lyd, musikk og effekter kan senere hentes fra Ninja Adventure, <https://github.com/pixel-boy/NinjaAdventure> (CC0).

## Arbeidsregler

- Læreren har Claude Pro og er begrenset av tokens. Skriv kort, les bare filene som trengs, og bruk ikke subagenter eller brede søk.
- Åpne aldri vinduer på lærerens PC for å teste. Test logikk med Node. Ta skjermbilder med skjult Edge (`--headless=new --screenshot`), startet fra PowerShell med `Start-Process -Wait` og egen `--user-data-dir`.
- Bruk det andre har lagt ut gratis så mye som mulig: grafikk, lyd, musikk, effekter og kode. Velg helst CC0, sjekk lisensen på kildesiden før bruk, og før opp kilde og lisens i `KILDER.md`.
- `gh` er ikke installert. GitHub-repoet lages i nettleseren.
- Repoet blir offentlig. Skriv ikke noe om klassen eller elevene her.
- Oppdater bøttelista og planen i denne fila når en bøtte er godkjent.
