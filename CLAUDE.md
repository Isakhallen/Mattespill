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
- 2D sett ovenfra med pikselkunst (16×16). Ikke 3D. Over bakken: Kenneys Tiny Town (CC0). Under bakken: mørk dungeon fra 0x72 DungeonTileset II (CC0).
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
9. **Gull og butikk** (lages på grenen `botte-9-gull`): gull fra seire, rette svar, kister, gullkrukker, oppdrag og salg. Butikk med våpen, rustning, drikker, bomber og drakter (utseende + liten bonus). Ting kan brukes i kampen og koster en tur. Frivillig rabattoppgave («20 % rabatt hvis du regner ut prisen»).
10. **Verden over bakken** (ferdig, på grenen `botte-10-verden`): verdenskart med landsby og porter ned til områdene.
11. **Snille folk** (ferdig, på grenen `botte-11-folk`, som også har bøtte 8 og 10): folk å snakke med, hint og små oppdrag.
12. **Nye områder** (neste): 4–5 områder (f.eks. skog, sump, ishule, lavagrotte, gravkammer) med egne fiender og egen boss.
13. **Online**: elevene ser hverandre. Bryter «ingen elevdata sendes noe sted» og trenger en tjeneste (f.eks. Firebase eller Supabase). Læreren må avklare personvern med skolen før bøtta starter.
14. **Test med klassen**: prøv spillet i klassen og juster etterpå.

## Slik står det etter bøtte 8, 10 og 11

- Kjøres med `python -m http.server 8010` i repoet og <http://localhost:8010>.
- `src/kart.js` leser tekstkart (`lesKart(linjer, stengt)`: `#` vegg, `.` gulv, `@` start, bokstaver, sifre og trappene `<` `>` = `merker`) og har `vedSiden` (der helten kommer ut av en trapp eller port), `src/vei.js` finner vei, `src/tegnKart.js` tegner flisene og `src/scener/Verden.js` styrer helten og fiendene på kartet. Spillet ligger på `window.spill`.
- Kart: `src/data/kart/` (`verden` 56×36, `kjelleren` og `dypet` 40×17) og `src/kartliste.js` (`KART`, `FORSTE` = `verden`, `kartFor`, `lesKartData`, `UTGANG`, `utgang`, `inngangFra`). `>` går til kartet i `ned`, `<` til kartet i `opp`, og sifrene er porter på verdenskartet (`innganger`: `{ navn, kart }`, uten `kart` er porten stengt og gir en beskjed). Kjelleren har `<` opp til verden. Helten kommer ut ved utgangen som fører tilbake dit den kom fra (`fra` er kart-id).
- Verdenskartet har `stil: 'ute'` og tegnes av `src/tegnUte.js` i to RenderTextures (bakken, og tretopper/brønntak over helten). Tegnene og flisnumrene står i `src/data/ute.js` (`STENGT`, `FLIS`). Vei, skog og tak velger flis ut fra naboene. En port er `====` / `]()]` / `]11]`, mørket inni er rektangler bak bakken. Flisene er `assets/ute.png` (= `Tilemap/tilemap_packed.png` fra Tiny Town, utpakket i `kilder/tinytown/`). Kartet ble laget med et lite skript, men kan også skrives for hånd. `tekst` vises første gang eleven kommer til kartet. Byttet skjer med `scene.restart({ kart, fra })`, så HTML-delene lages bare én gang (`??=`).
- Atlaset `assets/dungeon.png` + `.json` har alle 370 navn fra pakkens `tile_list`, for eksempel `knight_m_run_anim_f0`. Det lages på nytt med `node verktoy/lag-atlas.mjs kilder/0x72/0x72_DungeonTilesetII_v1.7`. Pakken ligger utpakket i `kilder/0x72/`, utenfor git. `src/figur.js` lager animasjonene `<figur>_idle` og `<figur>_run`.
- Oppgavetypene ligger i `src/data/oppgaver/`, én fil per type. `src/oppgaver.js` setter dem sammen til stigen `STIGE` (12 trinn) og har `lagOppgave(trinn)`, `tolkSvar` og `erRett`. `NIVAAER.md` lages med `node verktoy/lag-nivaatabell.mjs`.
- `src/tilpasning.js`: opp etter 2 rette på rad, ned etter 2 feil på rad.
- `src/spiller.js` har det som følger eleven: `klasse` (null til eleven har valgt), navn og figur fra klassen, `kart`, `erfaring`, `liv`, `tilpasning` (trinnet), `utstyr` `slaatt`/`aapnet` (fiender, kister og drikker som «kart:x,y») og `sett` (historietekster som er vist). `velgKlasse(s, id)` gir klassen. `lagSpiller(data)` tåler manglende og rare verdier, og `lagre()` skriver til localStorage via `src/lagring.js` (nøkkel `mattespill`, `versjon: 1`). Nivået lagres ikke, det regnes fra erfaringen. Startverdiene og `perNivaa` står i `src/data/helt.js` (liv 30, +6 liv og +2 skade per nivå). Klassene (`src/data/klasser/`, `src/klasser.js`: ridder, alv, trollmann) legger til `liv` og `skade`. `slett()` i `src/lagring.js` glemmer helten.
- `src/vekst.js`: `nivaa(erfaring)` (grense 5·n·(n−1): 10, 30, 60 …, maks 20), `maksLiv`, `skadeBonus` (nivå og beste våpen), `kampErfaring` (fiendens `erfaring` ved seier + 1 per rett svar, også ved tap), `giErfaring` og `nesteUtstyr`.
- Utstyr: `src/data/utstyr/` (våpen `skade`, rustning `liv`) og `src/utstyr.js` med rekkefølgen kistene gir dem i. Kiste er `k` i kartet. Det beste brukes av seg selv. Livsdrikk er `h` (`DRIKK`): fullt liv, spares hvis livet er fullt.
- `src/status.js` er statuslinja på kartet (klasse, nivå, liv, erfaring og knappen «Ny helt», som spør først). `src/beskjed.js`: `await beskjed.vis(tekst, valg, hvem)` gir nummeret på valget (Videre som standard). Et valg kan ha `bilde` fra `figurbilde` i `src/figur.js`. `hvem` er `{ navn, bilde }` for den som snakker.
- Fiender: `src/data/fiender/` (`tegn` er bokstaven i kartet, `figur`, og `liv`, `skade`, `erfaring` på nivå 1) og `src/fiender.js` med `fiendeFor(tegn)`. `svak` og `sterk` er elementer som gir dobbel og halv skade. De står aldri i spillet, eleven skal finne dem selv. Kartene har `nivaa` (kjelleren 1, dypet 3). `fiendeNivaa(kartNivaa, heltNivaa)` gir kartets nivå, men aldri mer enn ett under helten. `lagFiende(type, nivaa)` gir `{ type, nivaa, maks, liv, skade, erfaring }` (liv og erfaring × 1 + 0,3·(n−1), skade × 1 + 0,2·(n−1)). Verden lager fiendene slik, og `tilNivaa` løfter en skadet fiende når helten har vokst. Alle har svakheter og ting de tåler også for gift, hellig og jord, og det gjelder også gift og brann. Goblin `g`, imp `i`, skjelett `s`, ork `o`, maskeork `m`, orkesjaman `j` og bossen Tallslukeren `B` (`boss`, `skjold`: lett gir 1, tekstene `foer`, `igjen` og `etter`).
- Angrep: `src/data/angrep/`, 15 i alt. Alle har `element` (slag, ild, is, lyn, gift, hellig, jord). Lett og tungt har `skade` (5 og 10) og `trinn` (målt fra elevens trinn: −2 og 0). Typeangrepene (Ildkule, Lyn, Isspyd, Storm, Meteor) har `type` og `nivaa` (låses opp på nivå 2–6), henter oppgaven fra trinnet i typen nærmest eleven, men aldri mer enn `MAKS_OVER` (2) trinn over eleven (da kommer oppgaven fra trinnet 2 over), og skaden regnes mot elevens trinn (`skadeFor`: samme trinn 10, ±2,5 per trinn, 4–16). De sterkeste har `kraft` (ganger skaden) og `hvile` (turer de ikke kan brukes etter et treff): Isspyd og Storm 1,25 og 1, Meteor 1,5 og 2. Bonusen fra nivå, klasse og våpen er regnet for et tungt slag, og alle angrep får samme andel (`skade = grunn · (1 + bonus/10)`). Nye felt: `virker` (merket angrepet gir) og `runder`, `prikk` (gift/brann per tur som del av skaden), `selv` (treffer ikke fienden), `heler` (gir liv lik skaden), `stjel` (del av skaden som liv), `om` (linja i boka) og `under` (står på knappen i stedet for skade). Opplåsing: nivå 2 Ildkule og Giftpil, 3 Lyn og Skjold, 4 Isspyd og Helbred, 5 Storm og Frost, 6 Meteor og Vampyrbitt, 7 Flammestøt, 8 Hellig lys, 9 Jordskjelv.
- `src/kamp.js` har reglene uten grafikk: `ANGREP` (rekkefølgen i boka), `MAKS_ANGREP` (6), `oppgavetrinn`, `opplaast(nivaa)`, `standardValg(nivaa)` (lett, tungt og de fire nyeste), `medTall` (oppgavetrinn, skade og prikk for eleven), `angrepFor(nivaa, trinn, bonus, valgte)` (de valgte og opplåste), `motFiende` (skade og prikk mot fienden), `teller` (feil over elevens trinn senker ikke, rett langt under løfter ikke), `virkning` (2, 1 eller ½), `vistSkade` (det som står på knappen: med skjold, uten svakheter), `skadeMot`, `hvilEtter` (hvile bare etter treff, telles ned hver tur), `nyKamp(heltLiv, fiendeLiv, fiendeSkade, heltMaks)` og `runde`. Merker (`k.merker`, `{ navn: { runder, prikk } }`): gift og brann skader hver tur, frys gjør at fienden står over, svekket og skjold (på helten, `PAA_HELT`) gir halve slag. `runde` gir også `heling`, `prikker`, `frosset`, `aktive` (merkene i runden) og `mellom` (livet etter heltens tur).
- `src/scener/Kamp.js` tegner arena og figurer og kjører rundene. Navnene viser nivå. Treff på en svakhet gir et stort rosa tall med «!», lyden `svak` og risting. Det fienden tåler (og skjoldet) gir et lite grått tall og lyden `preller`. Et angrep som hviler, er en grå knapp med «Hviler n» (`av` i `visning.velg`), og Helbred er grå ved fullt liv. `src/kampvisning.js` er HTML oppå lerretet (navn, liv, melding, opptil 6 knapper i to rader) med mål i spillpiksler (`--u`). Tastene 1–6 velger angrep. `visMerker` viser merkene over figurene, `prikk` gift/brann og `selv` helbred/skjold.
- Merkene: `src/merker.js` har 7×7-mønstre (gift, brann, frys, svekket, skjold, liv) som tegnes på et lerret (`merkeLerret`) til knapper og bok, og som teksturer `merke_<navn>` i Phaser (`lagMerker`). `merkeFor(angrep)` gir merket til et angrep. Ingen tekst.
- Angrepsboka: `src/angrepsbok.js` med `boka(s)` (innholdet, testes i Node), `bytt(valgte, id)` (høyst 6, minst 1) og `lagAngrepsbok().vis(s)`. Åpnes med tast B eller knappen «Angrep». `spiller.angrep` er valget og lagres. Nye angrep tas med av seg selv når det er plass, ellers sier meldingen at eleven kan bytte i boka.
- Ved start uten klasse viser Verden historien og klassevalget. Verden starter kampen når helten går inn i en fiende (bossen viser tekst først), og åpner kisten, drikker eller går i trappen når helten går inn i den. Etter kampen kaller Kamp `oppgjor(k)`, som gir erfaring og lagrer, og viser meldingene (seier, nytt nivå, nytt angrep). Seier fjerner fienden. Tap: helten våkner ved `@` i kartet med fullt liv, og fienden beholder skaden. Slåtte fiender kommer ikke tilbake. Når bossen er slått, kommer slutten på historien, og helten starter et nytt eventyr i landsbyen med samme nivå og utstyr (fiender, kister og drikker er tilbake).
- `src/oppgaverute.js` viser en oppgave som HTML oppå spillet: `await rute.spor(oppgave, { topp, bunn, taster })` gir `'rett'` eller `'feil'`. `Verden.opptatt` stopper helten mens oppgave eller kamp vises.
- Lyd: `src/lyd.js` med `lastEffekter` (i Verdens preload), `spill(scene, navn)` og `musikk(scene, kart)`. Effektene er `assets/lyd/<navn>.wav` (`EFFEKTER`, originalnavnene i `KILDER.md`), musikken `assets/lyd/<kart-id>.ogg` og lastes først når kartet vises. `settLyd`/`lydPaa` husker lyd på/av selv (Phaser leser `mute` for sent) og lagrer under nøkkelen `mattespill-lyd` (`lesLyd`/`skrivLyd` i `src/lagring.js`), så «Ny helt» rører den ikke. `oppgjor` gir meldinger som `{ tekst, lyd }`.
- Effekter i `src/scener/Kamp.js`: `heltSlaar` (bom, slag eller trolldom), `tall` (tall som spretter), `gnister` (partikler fra teksturen `gnist`), `trolldom` (kule i angrepets `farge`, som står i typeangrepenes datafiler) og risting ved tungt slag og når bossen slår. `slag(fra, til, traff, vedTreff)` kaller `vedTreff` i det slaget treffer.
- Heltekort: `src/heltekort.js`. `kortet(s)` gir innholdet (testes i Node), `lagHeltekort().vis(scene, s, topp)` viser det. Åpnes med tast H eller knappen «Heltekort», og av seg selv når Tallslukeren er slått. `spiller.seire` teller hvor mange ganger bossen er slått.
- Statuslinja (`lagStatus({ kort, bok, lyd, nyHelt }, lydPaa)`) har knappene Heltekort, Angrep, Lyd og Ny helt. Heltekortet viser angrepene eleven har valgt.
- Folk: `src/data/folk/` (én fil per person: `tegn` i kartet, `navn`, `figur`, `snakk`, og `regn`, `tips` eller `borte`) og `src/folk.js` med reglene (testes i Node). Landsbyen har Smeden Dag `D`, Bakeren Elsa `E`, Vise Vilja `V`, Vakta Ane `A`, Tuva `T` og Pelle `P` (også i kjelleren). Helten prater ved å gå inn i en person. `snakkOm` gir det personen sier om oppdraget sitt, ellers gir `replikk` neste linje i `snakk` (Vilja gir tipset for elevens trinn fra `src/data/tips.js`). Elsa (`regn`) gir en oppgave på elevens trinn én gang hver gang helten kommer til kartet: rett gir fullt liv og +2 erfaring, feil er ufarlig. Merkene `utrop` (nytt oppdrag) og `spor` (belønning venter) fra `src/merker.js` står over hodet.
- Oppdrag: `src/data/oppdrag/` (`gir` er personen, `slag` er `slaa` med `fiende` og `antall` eller `finn` med `person`, og `start`, `underveis`, `takk`, `erfaring`, `gull`). `spiller.oppdrag` er `{ id: { steg, antall } }` med stegene ny, aktiv, klar og ferdig, og lagres. Slåtte fiender teller også før eleven har fått oppdraget (`slaattFiende` i `oppgjor`). Den som er `borte`, står der til den er funnet, og hjemme etterpå. `belonn` i Verden gir erfaringen, og gull hvis `spiller.gull` er et tall (bøtte 9). `vokst(e)` gir meldingene om nytt nivå og nye angrep, også i `oppgjor`.
- Tast O starter øving (`src/oving.js`) med + og − for å bytte trinn. Den er en skjult lærertast med eget trinn, uten hint på skjermen.
- Logikk testes med `node --test` i repo-roten, uten mappe som argument (`package.json` har bare `"type": "module"`).
- Test i skjult Edge med `--mute-audio`: bruk ny `--user-data-dir` hver gang, ellers kommer gamle filer fra cache. Bruk `--virtual-time-budget=900000`: med mindre budsjett tar den virtuelle tiden slutt før alle modulene er lastet. Bruk en annen port enn 8010 hvis en annen økt kan ha en server oppe. En testside kan erstatte `V.oppgaverute.spor` med en funksjon som gir `'rett'`. Spill-løkka går nesten ikke med `--virtual-time-budget`. En midlertidig testside må vente til `spill.isRunning` er sann, kalle `spill.loop.stop()` og så `spill.step(tid, 16)` i en løkke med `await` på 16 ms mellom hvert bilde. Resultatet leses med `--dump-dom`. HTML-knapper trykkes med `.click()`, og svar sendes med `form.requestSubmit()`. Slett testsiden etterpå.

## Fletting

Bøtte 9 lages på grenen `botte-9-gull` (fra bøtte 8). Når den er ferdig, flettes den inn i `botte-11-folk`, og så kan alt flettes inn i `main`. Oppdragene gir gull av seg selv hvis bøtte 9 bruker `spiller.gull` som et tall.

## Plan for bøtte 12: Nye områder

Bygg i en egen mappe fra `botte-11-folk`: `git worktree add C:/mattespill-b12 -b botte-12-omrader botte-11-folk`. Er bøtte 9 ferdig, flett `botte-9-gull` inn først. Portene 2–5 på verdenskartet (Skogen, Sumpen, Ishula, Lavagrotta) er stengt og venter på hvert sitt område. Ta ett område om gangen og commit etter hvert.

1. Kart: hvert område er 1–2 hulekart (40×17) med `opp` tilbake til verden og `nivaa` som stiger (Skogen 2, Sumpen 4, Ishula 6, Lavagrotta 8). Gi porten i `innganger` i `verden.js` et `kart`. Hvert område får sin farge ved å tone hulen (f.eks. `setTint`), ikke med nye flispakker.
2. Fiender: 2–3 nye per område, med figurer fra atlaset som ikke er brukt ennå (`wogol`, `tiny_zombie`, `big_zombie`, `chort`, `ogre`, `lizard_m`, `elf_m`, `angel`, `doc`) eller kjente figurer med en annen farge. Svakhetene skal passe stedet (is-fiender tåler is og er svake for ild, lava omvendt). Én boss per område med `foer`, `igjen` og `etter`.
3. Portene åpnes én om gangen: neste port åpnes når forrige boss er slått (Tallslukeren åpner Skogen). Slåtte bosser lagres i `spiller.bosser`. En stengt port sier hva som skal til. Avgjør om «nytt eventyr» (alt kommer tilbake) skal skje etter hver boss eller bare etter den siste.
4. Musikk per område (Ninja Adventure på GitHub, se `KILDER.md`).
5. Folk: Vakta Ane forteller om porten som nettopp åpnet seg. Hvert område kan få ett oppdrag (ny fil i `src/data/oppdrag/` med `gir` en person i landsbyen).
6. Test kart, fiender og bosser i Node, og flyten gjennom én port i skjult Edge.

## Arbeidsregler

- Læreren har Claude Pro og er begrenset av tokens. Skriv kort, les bare filene som trengs, og bruk ikke subagenter eller brede søk.
- Åpne aldri vinduer på lærerens PC for å teste. Test logikk med Node. Ta skjermbilder med skjult Edge (`--headless=new --screenshot`), startet fra PowerShell med `Start-Process -Wait` og egen `--user-data-dir`.
- Bruk det andre har lagt ut gratis så mye som mulig: grafikk, lyd, musikk, effekter og kode. Velg helst CC0, sjekk lisensen på kildesiden før bruk, og før opp kilde og lisens i `KILDER.md`.
- Ninja Adventure-pakken på itch.io kan ikke lastes ned med skript. Bare musikken ligger på GitHub. Lydeffektene er fra Juhani Junkalas pakke på OpenGameArt (utpakket i `kilder/lyd512/`, utenfor git).
- `gh` er ikke installert. GitHub-repoet lages i nettleseren.
- Repoet blir offentlig. Skriv ikke noe om klassen eller elevene her.
- Oppdater bøttelista og planen i denne fila når en bøtte er godkjent.
