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
5. **Første eventyr** (ferdig): område med flere fiender, boss, klassevalg og kort historie.
6. **Finpuss** (ferdig): lyd, musikk, effekter i kampen og heltekort.
7. **Ny kamp** (ferdig): fiender med nivå, større tall, skjulte svakheter og angrep som må hvile.
8. **Angrepsboka** (neste): 12–15 angrep (som i Pokémon og DnD), eleven tar med høyst 6, og statuseffekter.
9. **Gull og butikk**: gull fra seire, rette svar, kister, gullkrukker, oppdrag og salg. Butikk med våpen, rustning, drikker, bomber og drakter (utseende + liten bonus). Ting kan brukes i kampen og koster en tur. Frivillig rabattoppgave («20 % rabatt hvis du regner ut prisen»).
10. **Verden over bakken**: gratis utendørsgrafikk (16×16, helst CC0, f.eks. Kenney eller OpenGameArt), stort verdenskart med by og innganger til områdene. Dungeon-stilen beholdes under bakken. Endre kravet om utseende i denne fila.
11. **Snille folk**: folk å snakke med, hint og små oppdrag.
12. **Nye områder**: 4–5 områder (f.eks. skog, sump, ishule, lavagrotte, gravkammer) med egne fiender og egen boss.
13. **Online**: elevene ser hverandre. Bryter «ingen elevdata sendes noe sted» og trenger en tjeneste (f.eks. Firebase eller Supabase). Læreren må avklare personvern med skolen før bøtta starter.
14. **Test med klassen**: prøv spillet i klassen og juster etterpå.

## Slik står det etter bøtte 7

- Kjøres med `python -m http.server 8010` i repoet og <http://localhost:8010>.
- `src/kart.js` leser tekstkart (`#` vegg, `.` gulv, `@` start, bokstaver og trappene `<` `>` = `merker`) og har `vedSiden` (der helten kommer ut av en trapp), `src/vei.js` finner vei, `src/tegnKart.js` tegner flisene og `src/scener/Verden.js` styrer helten og fiendene på kartet. Spillet ligger på `window.spill`.
- Kart: `src/data/kart/` (`kjelleren`, `dypet`, 40×17) og `src/kartliste.js` (`KART`, `FORSTE`, `kartFor`, `TRAPP`). `>` går til kartet i `ned` og `<` til kartet i `opp`. Helten kommer ut ved siden av motsatt trapp. `tekst` vises første gang eleven kommer til kartet. Byttet skjer med `scene.restart({ kart, fra })`, så HTML-delene lages bare én gang (`??=`).
- Atlaset `assets/dungeon.png` + `.json` har alle 370 navn fra pakkens `tile_list`, for eksempel `knight_m_run_anim_f0`. Det lages på nytt med `node verktoy/lag-atlas.mjs kilder/0x72/0x72_DungeonTilesetII_v1.7`. Pakken ligger utpakket i `kilder/0x72/`, utenfor git. `src/figur.js` lager animasjonene `<figur>_idle` og `<figur>_run`.
- Oppgavetypene ligger i `src/data/oppgaver/`, én fil per type. `src/oppgaver.js` setter dem sammen til stigen `STIGE` (12 trinn) og har `lagOppgave(trinn)`, `tolkSvar` og `erRett`. `NIVAAER.md` lages med `node verktoy/lag-nivaatabell.mjs`.
- `src/tilpasning.js`: opp etter 2 rette på rad, ned etter 2 feil på rad.
- `src/spiller.js` har det som følger eleven: `klasse` (null til eleven har valgt), navn og figur fra klassen, `kart`, `erfaring`, `liv`, `tilpasning` (trinnet), `utstyr` `slaatt`/`aapnet` (fiender, kister og drikker som «kart:x,y») og `sett` (historietekster som er vist). `velgKlasse(s, id)` gir klassen. `lagSpiller(data)` tåler manglende og rare verdier, og `lagre()` skriver til localStorage via `src/lagring.js` (nøkkel `mattespill`, `versjon: 1`). Nivået lagres ikke, det regnes fra erfaringen. Startverdiene og `perNivaa` står i `src/data/helt.js` (liv 30, +6 liv og +2 skade per nivå). Klassene (`src/data/klasser/`, `src/klasser.js`: ridder, alv, trollmann) legger til `liv` og `skade`. `slett()` i `src/lagring.js` glemmer helten.
- `src/vekst.js`: `nivaa(erfaring)` (grense 5·n·(n−1): 10, 30, 60 …, maks 20), `maksLiv`, `skadeBonus` (nivå og beste våpen), `kampErfaring` (fiendens `erfaring` ved seier + 1 per rett svar, også ved tap), `giErfaring` og `nesteUtstyr`.
- Utstyr: `src/data/utstyr/` (våpen `skade`, rustning `liv`) og `src/utstyr.js` med rekkefølgen kistene gir dem i. Kiste er `k` i kartet. Det beste brukes av seg selv. Livsdrikk er `h` (`DRIKK`): fullt liv, spares hvis livet er fullt.
- `src/status.js` er statuslinja på kartet (klasse, nivå, liv, erfaring og knappen «Ny helt», som spør først). `src/beskjed.js`: `await beskjed.vis(tekst, valg)` gir nummeret på valget (Videre som standard). Et valg kan ha `bilde` fra `figurbilde` i `src/figur.js`.
- Fiender: `src/data/fiender/` (`tegn` er bokstaven i kartet, `figur`, og `liv`, `skade`, `erfaring` på nivå 1) og `src/fiender.js` med `fiendeFor(tegn)`. `svak` og `sterk` er elementer som gir dobbel og halv skade. De står aldri i spillet, eleven skal finne dem selv. Kartene har `nivaa` (kjelleren 1, dypet 3). `fiendeNivaa(kartNivaa, heltNivaa)` gir kartets nivå, men aldri mer enn ett under helten. `lagFiende(type, nivaa)` gir `{ type, nivaa, maks, liv, skade, erfaring }` (liv og erfaring × 1 + 0,3·(n−1), skade × 1 + 0,2·(n−1)). Verden lager fiendene slik, og `tilNivaa` løfter en skadet fiende når helten har vokst. Goblin `g`, imp `i`, skjelett `s`, ork `o`, maskeork `m`, orkesjaman `j` og bossen Tallslukeren `B` (`boss`, `skjold`: lett gir 1, tekstene `foer`, `igjen` og `etter`).
- Angrep: `src/data/angrep/`. Alle har `element` (slag, ild, is, lyn). Lett og tungt har `skade` (5 og 10) og `trinn` (målt fra elevens trinn: −2 og 0). Typeangrepene (Ildkule, Lyn, Isspyd, Storm, Meteor) har `type` og `nivaa` (låses opp på nivå 2–6), henter oppgaven fra trinnet i typen nærmest eleven, og skaden regnes mot elevens trinn (`skadeFor`: samme trinn 10, ±2,5 per trinn, 4–16). De sterkeste har `kraft` (ganger skaden) og `hvile` (turer de ikke kan brukes etter et treff): Isspyd og Storm 1,25 og 1, Meteor 1,5 og 2. Bonusen fra nivå, klasse og våpen er regnet for et tungt slag, og alle angrep får samme andel (`skade = grunn · (1 + bonus/10)`).
- `src/kamp.js` har reglene uten grafikk: `ANGREP`, `oppgavetrinn`, `angrepFor(nivaa, trinn, bonus)` (lett, tungt og opptil to typeangrep, aldri mer enn 2 trinn over eleven), `teller` (feil over elevens trinn senker ikke, rett langt under løfter ikke), `virkning` (2, 1 eller ½), `vistSkade` (det som står på knappen: med skjold, uten svakheter), `skadeMot`, `hvilEtter` (hvile bare etter treff, telles ned hver tur), `nyKamp` og `runde`.
- `src/scener/Kamp.js` tegner arena og figurer og kjører rundene. Navnene viser nivå. Treff på en svakhet gir et stort rosa tall med «!», lyden `svak` og risting. Det fienden tåler (og skjoldet) gir et lite grått tall og lyden `preller`. Et angrep som hviler, er en grå knapp med «Hviler n» (`av` i `visning.velg`). `src/kampvisning.js` er HTML oppå lerretet (navn, liv, melding, knapper) med mål i spillpiksler (`--u`). Tastene 1–4 velger angrep.
- Ved start uten klasse viser Verden historien og klassevalget. Verden starter kampen når helten går inn i en fiende (bossen viser tekst først), og åpner kisten, drikker eller går i trappen når helten går inn i den. Etter kampen kaller Kamp `oppgjor(k)`, som gir erfaring og lagrer, og viser meldingene (seier, nytt nivå, nytt angrep). Seier fjerner fienden. Tap: helten våkner ved `@` i kartet med fullt liv, og fienden beholder skaden. Slåtte fiender kommer ikke tilbake. Når bossen er slått, kommer slutten på historien, og helten starter et nytt eventyr i kjelleren med samme nivå og utstyr (fiender, kister og drikker er tilbake).
- `src/oppgaverute.js` viser en oppgave som HTML oppå spillet: `await rute.spor(oppgave, { topp, bunn, taster })` gir `'rett'` eller `'feil'`. `Verden.opptatt` stopper helten mens oppgave eller kamp vises.
- Lyd: `src/lyd.js` med `lastEffekter` (i Verdens preload), `spill(scene, navn)` og `musikk(scene, kart)`. Effektene er `assets/lyd/<navn>.wav` (`EFFEKTER`, originalnavnene i `KILDER.md`), musikken `assets/lyd/<kart-id>.ogg` og lastes først når kartet vises. `settLyd`/`lydPaa` husker lyd på/av selv (Phaser leser `mute` for sent) og lagrer under nøkkelen `mattespill-lyd` (`lesLyd`/`skrivLyd` i `src/lagring.js`), så «Ny helt» rører den ikke. `oppgjor` gir meldinger som `{ tekst, lyd }`.
- Effekter i `src/scener/Kamp.js`: `heltSlaar` (bom, slag eller trolldom), `tall` (tall som spretter), `gnister` (partikler fra teksturen `gnist`), `trolldom` (kule i angrepets `farge`, som står i typeangrepenes datafiler) og risting ved tungt slag og når bossen slår. `slag(fra, til, traff, vedTreff)` kaller `vedTreff` i det slaget treffer.
- Heltekort: `src/heltekort.js`. `kortet(s)` gir innholdet (testes i Node), `lagHeltekort().vis(scene, s, topp)` viser det. Åpnes med tast H eller knappen «Heltekort», og av seg selv når Tallslukeren er slått. `spiller.seire` teller hvor mange ganger bossen er slått.
- Statuslinja (`lagStatus({ kort, lyd, nyHelt }, lydPaa)`) har knappene Heltekort, Lyd og Ny helt.
- Tast O starter øving (`src/oving.js`) med + og − for å bytte trinn. Den er en skjult lærertast med eget trinn, uten hint på skjermen.
- Logikk testes med `node --test` i repo-roten, uten mappe som argument (`package.json` har bare `"type": "module"`).
- Test i skjult Edge med `--mute-audio`: bruk ny `--user-data-dir` hver gang, ellers kommer gamle filer fra cache. Spill-løkka går nesten ikke med `--virtual-time-budget`. En midlertidig testside må vente til `spill.isRunning` er sann, kalle `spill.loop.stop()` og så `spill.step(tid, 16)` i en løkke med `await` på 16 ms mellom hvert bilde. Resultatet leses med `--dump-dom`. HTML-knapper trykkes med `.click()`, og svar sendes med `form.requestSubmit()`. Slett testsiden etterpå.

## Plan for bøtte 8: Angrepsboka

Læreren vil ha mer taktikk, som i Baldur's Gate og Pokémon: matteoppgaven skal ikke være det eneste valget.

1. Flere angrep i `src/data/angrep/`, 12–15 i alt, med nye elementer (f.eks. gift, hellig, jord). Forslag: Giftpil (gift), Frost (kan fryse), Flammestøt (brann), Helbred (gir liv), Skjold (tar halve neste slag), Vampyrbitt (stjeler liv), Søvn, Hellig lys, Jordskjelv. Hvert angrep har en oppgavetype. De sterkeste hviler.
2. Statuseffekter i `src/kamp.js`: frys (fienden mister en tur), gift og brann (skade hver runde), svekket (mindre skade). Vises med et lite merke over figuren, uten tekst.
3. Angrepsboka: en skjerm på kartet (tast og knapp i statuslinja) som viser alle opplåste angrep. Eleven velger høyst 6, og de lagres. Alle 6 vises i kampen og kan brukes (tastene 1–6). I dag skjuler `angrepFor` typeangrep mer enn 2 trinn over eleven. Finn en løsning der alle kan brukes uten altfor vanskelige oppgaver, for eksempel at angrepet bruker typens trinn nærmest eleven og at skaden regnes mot elevens trinn som nå.
4. Gi fiendene svakheter og det de tåler for de nye elementene. Ingen tekst skal si det.
5. Test reglene med Node og flyten i skjult Edge.

## Arbeidsregler

- Læreren har Claude Pro og er begrenset av tokens. Skriv kort, les bare filene som trengs, og bruk ikke subagenter eller brede søk.
- Åpne aldri vinduer på lærerens PC for å teste. Test logikk med Node. Ta skjermbilder med skjult Edge (`--headless=new --screenshot`), startet fra PowerShell med `Start-Process -Wait` og egen `--user-data-dir`.
- Bruk det andre har lagt ut gratis så mye som mulig: grafikk, lyd, musikk, effekter og kode. Velg helst CC0, sjekk lisensen på kildesiden før bruk, og før opp kilde og lisens i `KILDER.md`.
- Ninja Adventure-pakken på itch.io kan ikke lastes ned med skript. Bare musikken ligger på GitHub. Lydeffektene er fra Juhani Junkalas pakke på OpenGameArt (utpakket i `kilder/lyd512/`, utenfor git).
- `gh` er ikke installert. GitHub-repoet lages i nettleseren.
- Repoet blir offentlig. Skriv ikke noe om klassen eller elevene her.
- Oppdater bøttelista og planen i denne fila når en bøtte er godkjent.
