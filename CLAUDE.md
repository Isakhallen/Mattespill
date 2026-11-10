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
8. **Angrepsboka** (ferdig): 12–15 angrep (som i Pokémon og DnD), eleven tar med høyst 6, og statuseffekter.
9. **Gull og butikk** (neste): gull fra seire, rette svar, kister, gullkrukker, oppdrag og salg. Butikk med våpen, rustning, drikker, bomber og drakter (utseende + liten bonus). Ting kan brukes i kampen og koster en tur. Frivillig rabattoppgave («20 % rabatt hvis du regner ut prisen»).
10. **Verden over bakken**: gratis utendørsgrafikk (16×16, helst CC0, f.eks. Kenney eller OpenGameArt), stort verdenskart med by og innganger til områdene. Dungeon-stilen beholdes under bakken. Endre kravet om utseende i denne fila.
11. **Snille folk**: folk å snakke med, hint og små oppdrag.
12. **Nye områder**: 4–5 områder (f.eks. skog, sump, ishule, lavagrotte, gravkammer) med egne fiender og egen boss.
13. **Online**: elevene ser hverandre. Bryter «ingen elevdata sendes noe sted» og trenger en tjeneste (f.eks. Firebase eller Supabase). Læreren må avklare personvern med skolen før bøtta starter.
14. **Test med klassen**: prøv spillet i klassen og juster etterpå.

## Slik står det etter bøtte 8

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
- Fiender: `src/data/fiender/` (`tegn` er bokstaven i kartet, `figur`, og `liv`, `skade`, `erfaring` på nivå 1) og `src/fiender.js` med `fiendeFor(tegn)`. `svak` og `sterk` er elementer som gir dobbel og halv skade. De står aldri i spillet, eleven skal finne dem selv. Kartene har `nivaa` (kjelleren 1, dypet 3). `fiendeNivaa(kartNivaa, heltNivaa)` gir kartets nivå, men aldri mer enn ett under helten. `lagFiende(type, nivaa)` gir `{ type, nivaa, maks, liv, skade, erfaring }` (liv og erfaring × 1 + 0,3·(n−1), skade × 1 + 0,2·(n−1)). Verden lager fiendene slik, og `tilNivaa` løfter en skadet fiende når helten har vokst. Alle har svakheter og ting de tåler også for gift, hellig og jord, og det gjelder også gift og brann. Goblin `g`, imp `i`, skjelett `s`, ork `o`, maskeork `m`, orkesjaman `j` og bossen Tallslukeren `B` (`boss`, `skjold`: lett gir 1, tekstene `foer`, `igjen` og `etter`).
- Angrep: `src/data/angrep/`, 15 i alt. Alle har `element` (slag, ild, is, lyn, gift, hellig, jord). Lett og tungt har `skade` (5 og 10) og `trinn` (målt fra elevens trinn: −2 og 0). Typeangrepene (Ildkule, Lyn, Isspyd, Storm, Meteor) har `type` og `nivaa` (låses opp på nivå 2–6), henter oppgaven fra trinnet i typen nærmest eleven, men aldri mer enn `MAKS_OVER` (2) trinn over eleven (da kommer oppgaven fra trinnet 2 over), og skaden regnes mot elevens trinn (`skadeFor`: samme trinn 10, ±2,5 per trinn, 4–16). De sterkeste har `kraft` (ganger skaden) og `hvile` (turer de ikke kan brukes etter et treff): Isspyd og Storm 1,25 og 1, Meteor 1,5 og 2. Bonusen fra nivå, klasse og våpen er regnet for et tungt slag, og alle angrep får samme andel (`skade = grunn · (1 + bonus/10)`). Nye felt: `virker` (merket angrepet gir) og `runder`, `prikk` (gift/brann per tur som del av skaden), `selv` (treffer ikke fienden), `heler` (gir liv lik skaden), `stjel` (del av skaden som liv), `om` (linja i boka) og `under` (står på knappen i stedet for skade). Opplåsing: nivå 2 Ildkule og Giftpil, 3 Lyn og Skjold, 4 Isspyd og Helbred, 5 Storm og Frost, 6 Meteor og Vampyrbitt, 7 Flammestøt, 8 Hellig lys, 9 Jordskjelv.
- `src/kamp.js` har reglene uten grafikk: `ANGREP` (rekkefølgen i boka), `MAKS_ANGREP` (6), `oppgavetrinn`, `opplaast(nivaa)`, `standardValg(nivaa)` (lett, tungt og de fire nyeste), `medTall` (oppgavetrinn, skade og prikk for eleven), `angrepFor(nivaa, trinn, bonus, valgte)` (de valgte og opplåste), `motFiende` (skade og prikk mot fienden), `teller` (feil over elevens trinn senker ikke, rett langt under løfter ikke), `virkning` (2, 1 eller ½), `vistSkade` (det som står på knappen: med skjold, uten svakheter), `skadeMot`, `hvilEtter` (hvile bare etter treff, telles ned hver tur), `nyKamp(heltLiv, fiendeLiv, fiendeSkade, heltMaks)` og `runde`. Merker (`k.merker`, `{ navn: { runder, prikk } }`): gift og brann skader hver tur, frys gjør at fienden står over, svekket og skjold (på helten, `PAA_HELT`) gir halve slag. `runde` gir også `heling`, `prikker`, `frosset`, `aktive` (merkene i runden) og `mellom` (livet etter heltens tur).
- `src/scener/Kamp.js` tegner arena og figurer og kjører rundene. Navnene viser nivå. Treff på en svakhet gir et stort rosa tall med «!», lyden `svak` og risting. Det fienden tåler (og skjoldet) gir et lite grått tall og lyden `preller`. Et angrep som hviler, er en grå knapp med «Hviler n» (`av` i `visning.velg`), og Helbred er grå ved fullt liv. `src/kampvisning.js` er HTML oppå lerretet (navn, liv, melding, opptil 6 knapper i to rader) med mål i spillpiksler (`--u`). Tastene 1–6 velger angrep. `visMerker` viser merkene over figurene, `prikk` gift/brann og `selv` helbred/skjold.
- Merkene: `src/merker.js` har 7×7-mønstre (gift, brann, frys, svekket, skjold, liv) som tegnes på et lerret (`merkeLerret`) til knapper og bok, og som teksturer `merke_<navn>` i Phaser (`lagMerker`). `merkeFor(angrep)` gir merket til et angrep. Ingen tekst.
- Angrepsboka: `src/angrepsbok.js` med `boka(s)` (innholdet, testes i Node), `bytt(valgte, id)` (høyst 6, minst 1) og `lagAngrepsbok().vis(s)`. Åpnes med tast B eller knappen «Angrep». `spiller.angrep` er valget og lagres. Nye angrep tas med av seg selv når det er plass, ellers sier meldingen at eleven kan bytte i boka.
- Ved start uten klasse viser Verden historien og klassevalget. Verden starter kampen når helten går inn i en fiende (bossen viser tekst først), og åpner kisten, drikker eller går i trappen når helten går inn i den. Etter kampen kaller Kamp `oppgjor(k)`, som gir erfaring og lagrer, og viser meldingene (seier, nytt nivå, nytt angrep). Seier fjerner fienden. Tap: helten våkner ved `@` i kartet med fullt liv, og fienden beholder skaden. Slåtte fiender kommer ikke tilbake. Når bossen er slått, kommer slutten på historien, og helten starter et nytt eventyr i kjelleren med samme nivå og utstyr (fiender, kister og drikker er tilbake).
- `src/oppgaverute.js` viser en oppgave som HTML oppå spillet: `await rute.spor(oppgave, { topp, bunn, taster })` gir `'rett'` eller `'feil'`. `Verden.opptatt` stopper helten mens oppgave eller kamp vises.
- Lyd: `src/lyd.js` med `lastEffekter` (i Verdens preload), `spill(scene, navn)` og `musikk(scene, kart)`. Effektene er `assets/lyd/<navn>.wav` (`EFFEKTER`, originalnavnene i `KILDER.md`), musikken `assets/lyd/<kart-id>.ogg` og lastes først når kartet vises. `settLyd`/`lydPaa` husker lyd på/av selv (Phaser leser `mute` for sent) og lagrer under nøkkelen `mattespill-lyd` (`lesLyd`/`skrivLyd` i `src/lagring.js`), så «Ny helt» rører den ikke. `oppgjor` gir meldinger som `{ tekst, lyd }`.
- Effekter i `src/scener/Kamp.js`: `heltSlaar` (bom, slag eller trolldom), `tall` (tall som spretter), `gnister` (partikler fra teksturen `gnist`), `trolldom` (kule i angrepets `farge`, som står i typeangrepenes datafiler) og risting ved tungt slag og når bossen slår. `slag(fra, til, traff, vedTreff)` kaller `vedTreff` i det slaget treffer.
- Heltekort: `src/heltekort.js`. `kortet(s)` gir innholdet (testes i Node), `lagHeltekort().vis(scene, s, topp)` viser det. Åpnes med tast H eller knappen «Heltekort», og av seg selv når Tallslukeren er slått. `spiller.seire` teller hvor mange ganger bossen er slått.
- Statuslinja (`lagStatus({ kort, bok, lyd, nyHelt }, lydPaa)`) har knappene Heltekort, Angrep, Lyd og Ny helt. Heltekortet viser angrepene eleven har valgt.
- Tast O starter øving (`src/oving.js`) med + og − for å bytte trinn. Den er en skjult lærertast med eget trinn, uten hint på skjermen.
- Logikk testes med `node --test` i repo-roten, uten mappe som argument (`package.json` har bare `"type": "module"`).
- Test i skjult Edge med `--mute-audio`: bruk ny `--user-data-dir` hver gang, ellers kommer gamle filer fra cache. Bruk `--virtual-time-budget=900000`: med mindre budsjett tar den virtuelle tiden slutt før alle modulene er lastet. Bruk en annen port enn 8010 hvis en annen økt kan ha en server oppe. En testside kan erstatte `V.oppgaverute.spor` med en funksjon som gir `'rett'`. Spill-løkka går nesten ikke med `--virtual-time-budget`. En midlertidig testside må vente til `spill.isRunning` er sann, kalle `spill.loop.stop()` og så `spill.step(tid, 16)` i en løkke med `await` på 16 ms mellom hvert bilde. Resultatet leses med `--dump-dom`. HTML-knapper trykkes med `.click()`, og svar sendes med `form.requestSubmit()`. Slett testsiden etterpå.

## Plan for bøtte 9: Gull og butikk

Gull skal gi noe å samle på og kjøpe for, og butikken gir regning med priser.

1. `spiller.gull` (lagres). Gull fra seire (fiendens `gull`, vokser med nivået som erfaringen), +1 per rett svar, kister når alt utstyret er tatt, og gullkrukker i kartet (nytt tegn). Vises i statuslinja.
2. Butikken: en HTML-skjerm som angrepsboka. Inntil bøtte 10 lager byen, åpnes den fra en butikkrute i kjelleren (nytt tegn). Eleven kan selge ting for halv pris.
3. Varer i `src/data/varer/` med pris: våpen og rustning (`src/data/utstyr/` får `pris`), livsdrikk, bombe (skade uten oppgave) og drakter (en annen figur fra atlaset + liten bonus).
4. Ting i kampen: knappen «Ting» bruker en drikk eller bombe og koster en tur (fienden slår).
5. Rabattoppgave: «20 % rabatt hvis du regner ut prisen». Rett svar gir rabatten, feil svar gir vanlig pris uten straff. Prisene skal gå an å regne i hodet.
6. Test reglene med Node og flyten i skjult Edge.

## Arbeidsregler

- Læreren har Claude Pro og er begrenset av tokens. Skriv kort, les bare filene som trengs, og bruk ikke subagenter eller brede søk.
- Åpne aldri vinduer på lærerens PC for å teste. Test logikk med Node. Ta skjermbilder med skjult Edge (`--headless=new --screenshot`), startet fra PowerShell med `Start-Process -Wait` og egen `--user-data-dir`.
- Bruk det andre har lagt ut gratis så mye som mulig: grafikk, lyd, musikk, effekter og kode. Velg helst CC0, sjekk lisensen på kildesiden før bruk, og før opp kilde og lisens i `KILDER.md`.
- Ninja Adventure-pakken på itch.io kan ikke lastes ned med skript. Bare musikken ligger på GitHub. Lydeffektene er fra Juhani Junkalas pakke på OpenGameArt (utpakket i `kilder/lyd512/`, utenfor git).
- `gh` er ikke installert. GitHub-repoet lages i nettleseren.
- Repoet blir offentlig. Skriv ikke noe om klassen eller elevene her.
- Oppdater bøttelista og planen i denne fila når en bøtte er godkjent.
