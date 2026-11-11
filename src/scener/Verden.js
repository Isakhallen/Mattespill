import { vedSiden } from '../kart.js';
import { finnVei } from '../vei.js';
import { tegnKart, R, DYBDE } from '../tegnKart.js';
import { tegnUte } from '../tegnUte.js';
import { lagAnimasjoner, figurbilde } from '../figur.js';
import { FIENDER, fiendeFor, fiendeNivaa, lagFiende, tilNivaa } from '../fiender.js';
import { spiller, lagre, velgKlasse } from '../spiller.js';
import { nivaa, maksLiv, kampErfaring, kampGull, krukkeGull, kisteGull, giErfaring, nesteUtstyr } from '../vekst.js';
import { KISTE, KISTE_LUKKET, KISTE_AAPEN, DRIKK, DRIKK_BILDE, KRUKKE, MYNT, BUTIKK, SELGER } from '../utstyr.js';
import { lagButikk } from '../butikk.js';
import { KLASSER } from '../klasser.js';
import { kartFor, FORSTE, lesKartData, UTGANG, utgang, inngangFra, portAapen, portEtter } from '../kartliste.js';
import { slett } from '../lagring.js';
import { lagOppgaverute } from '../oppgaverute.js';
import { lagKampvisning } from '../kampvisning.js';
import { lagStatus } from '../status.js';
import { lagKlasserom } from '../klasserom.js';
import { nett, lagreNett, radFor, lesRad } from '../nett.js';
import { lagNettverk } from '../nettverk.js';
import { lagBeskjed } from '../beskjed.js';
import { kjorOving } from '../oving.js';
import { lastEffekter, spill, musikk, settLyd, lydPaa } from '../lyd.js';
import { lagHeltekort } from '../heltekort.js';
import { lagAngrepsbok } from '../angrepsbok.js';
import { MAKS_ANGREP } from '../kamp.js';
import { personFor, synlig, folkemerke, snakkOm, replikk, portNytt, slaattFiende } from '../folk.js';
import { lagMerker } from '../merker.js';
import { lagOppgave, MAKS_TRINN } from '../oppgaver.js';
import { oppdater } from '../tilpasning.js';

const STEGTID = 130; // ms per rute
const TONING = 250; // ms når kartet byttes
const TRAPPBILDE = { '>': 'floor_stairs', '<': 'floor_ladder' };

// Historien ved start, før helten velger klasse.
const START = [
  'Tallslukeren har stjålet alle tallene fra landsbyen!',
  'Nå vet ingen hva noe koster, og ingen kan telle til ti.',
];
const ETTER_VALG = 'Tallslukeren bor under bakken. Gå til porten øst for landsbyen!';
const NYTT_EVENTYR = 'Du drar på et nytt eventyr med samme helt. Monstrene er tilbake!';

export default class Verden extends Phaser.Scene {
  constructor() {
    super('Verden');
  }

  preload() {
    this.load.atlas('dungeon', 'assets/dungeon.png', 'assets/dungeon.json');
    this.load.spritesheet('ute', 'assets/ute.png', { frameWidth: R, frameHeight: R });
    lastEffekter(this);
  }

  // data: { kart, fra } der «fra» er kartet helten kommer fra.
  create(data = {}) {
    this.kartData = kartFor(data.kart ?? spiller.kart) ?? kartFor(FORSTE);
    this.kartId = this.kartData.id;
    this.kart = lesKartData(this.kartData);
    this.ute = this.kartData.stil === 'ute';
    if (this.ute) tegnUte(this, this.kartData, (s) => portAapen(this.kartData.innganger[s], spiller.bosser));
    else tegnKart(this, this.kart, this.kartData.farge);
    spiller.kart = this.kartId;
    this.utganger = this.kart.merker.filter((m) => UTGANG.test(m.tegn));
    for (const m of this.utganger) {
      if (!TRAPPBILDE[m.tegn]) continue; // portene er tegnet med kartet
      this.add.image(m.x * R, m.y * R, 'dungeon', TRAPPBILDE[m.tegn]).setOrigin(0).setDepth(1).setTint(this.kartData.farge ?? 0xffffff);
    }
    const ut = data.fra && inngangFra(this.kartData, this.kart, data.fra);
    this.lagMynt();
    this.settUtButikk();

    lagAnimasjoner(this, spiller.figur);
    this.staar = `${spiller.figur}_idle`;
    this.rute = ut ? vedSiden(this.kart, ut) : { ...this.kart.start };
    const p = this.piksel(this.rute.x, this.rute.y);
    this.helt = this.add
      .sprite(p.x, p.y, 'dungeon')
      .setOrigin(0.5, 1)
      .setDepth(DYBDE.helt)
      .play(this.staar);
    this.vei = [];
    this.gaar = false;
    this.fiender = [];
    this.settUtFiender();
    this.ting = [];
    this.settUtTing();
    this.folk = [];
    this.settUtFolk();

    const kamera = this.cameras.main;
    // I hulene 4 piksler ekstra øverst så toppkanten på veggen synes.
    const ekstra = this.ute ? 0 : 4;
    kamera.setBounds(0, -ekstra, this.kart.bredde * R, this.kart.hoyde * R + ekstra);
    kamera.startFollow(this.helt, true);
    kamera.fadeIn(TONING);

    this.taster = this.input.keyboard.addKeys('UP,DOWN,LEFT,RIGHT,W,A,S,D');
    // HTML-delene lages bare første gang, ikke når kartet byttes.
    this.oppgaverute ??= lagOppgaverute();
    this.kampvisning ??= lagKampvisning(this.game);
    this.status ??= lagStatus(
      {
        kort: () => this.visKort(),
        bok: () => this.visBok(),
        klassen: () => this.visKlasserom(),
        lyd: () => settLyd(this.game, !lydPaa()),
        nyHelt: () => this.nyHelt(),
      },
      settLyd(this.game),
    );
    if (!this.klasserom) {
      this.klasserom = lagKlasserom();
      lagreNett(); // så navnet er det samme neste gang
      this.nettverk = lagNettverk();
      this.lapper = document.createElement('div');
      this.lapper.id = 'lapper';
      document.body.append(this.lapper);
    }
    // De andre i klassen på dette kartet: uid → { bilde, lapp, x, y, figur }.
    this.andre?.forEach((a) => a.lapp.remove());
    this.andre = new Map();
    this.kobleTil();
    this.heltekort ??= lagHeltekort();
    this.bok ??= lagAngrepsbok();
    this.butikken ??= lagButikk();
    musikk(this, this.kartData.musikk ?? this.kartId);
    this.status.vis(spiller);
    this.beskjed ??= lagBeskjed();
    this.bossSlaatt = false;
    this.bakt = false; // bakeren har én regneoppgave hver gang helten kommer til kartet
    this.prat = {}; // hvor mange ganger eleven har snakket med hver person her
    this.opptatt = false; // sant mens en oppgave, beskjed eller kamp vises
    this.input.keyboard.on('keydown-O', () => this.oving());
    this.input.keyboard.on('keydown-H', () => this.visKort());
    this.input.keyboard.on('keydown-B', () => this.visBok());
    this.input.on('pointerdown', (peker) => {
      if (this.opptatt) return;
      const til = { x: Math.floor(peker.worldX / R), y: Math.floor(peker.worldY / R) };
      // Gå rundt fiender, ting og utganger, bortsett fra det eleven klikker på.
      const stengt = (x, y) =>
        this.kart.vegg(x, y) ||
        ((this.fiendeI(x, y) || this.tingI(x, y) || this.utgangI(x, y) || this.personI(x, y) ||
          this.butikkI(x, y)) &&
          !(x === til.x && y === til.y));
      this.vei = finnVei({ ...this.kart, vegg: stengt }, this.rute, til) ?? [];
    });
    lagre();
    this.velkommen();
  }

  // Der føttene til helten står i en rute.
  piksel(x, y) {
    return { x: x * R + R / 2, y: (y + 1) * R - 4 };
  }

  // Navnet på en rute i lagringen, f.eks. «kjelleren:10,5».
  nokkel(m) {
    return `${this.kartId}:${m.x},${m.y}`;
  }

  // Historie ved start og første gang helten kommer til et kart.
  async velkommen() {
    if (!spiller.klasse) await this.velgHelt();
    const tekst = this.kartData.tekst;
    if (!tekst || spiller.sett.includes(this.kartId)) return;
    this.stopp();
    for (const t of tekst) await this.beskjed.vis(t);
    spiller.sett.push(this.kartId);
    lagre();
    this.slipp();
  }

  async velgHelt() {
    this.stopp();
    for (const t of START) await this.beskjed.vis(t);
    const valg = KLASSER.map((k) => ({ navn: k.navn, under: k.om, bilde: figurbilde(this, k.figur) }));
    const i = await this.beskjed.vis('Velg din helt:', valg);
    velgKlasse(spiller, KLASSER[i].id);
    lagAnimasjoner(this, spiller.figur);
    this.byttFigur();
    lagre();
    this.status.vis(spiller);
    await this.beskjed.vis(ETTER_VALG);
    this.slipp();
  }

  // Navnet klassen ser, og klassekoden.
  async visKlasserom() {
    if (this.opptatt) return;
    this.stopp();
    const kode = nett.kode;
    Object.assign(nett, await this.klasserom.vis(nett));
    lagreNett();
    if (nett.kode !== kode) this.kobleTil();
    this.slipp();
  }

  // Blir med i klassen på dette kartet (eller går ut hvis eleven spiller alene).
  async kobleTil() {
    clearTimeout(this.igjen);
    this.visKlassen(true);
    const ok = await this.nettverk.bliMed(nett.kode, this.kartId, this.minRad());
    this.visKlassen();
    // Nettet på skolen kan svikte en stund. Prøv igjen litt senere.
    if (!ok && nett.kode && this.nettverk.finnes) {
      this.igjen = setTimeout(() => !this.nettverk.tilkoblet && nett.kode && this.kobleTil(), 10000);
    }
  }

  visKlassen(kobler = false) {
    const n = this.nettverk;
    let tekst = null; // ingen knapp uten Firebase
    if (n.finnes && !nett.kode) tekst = 'Klassen';
    else if (n.finnes) {
      const her = n.tilkoblet ? ` · ${this.andre.size} andre her` : kobler ? '' : ' · ingen nett';
      tekst = `Klassen: ${nett.kode}${her}`;
    }
    this.status.klassen(tekst);
  }

  // Det klassen får vite om helten, eller null før eleven har valgt helt.
  minRad() {
    if (!spiller.klasse) return null;
    return radFor(nett.navn, spiller.figur, nivaa(spiller.erfaring), this.rute.x, this.rute.y);
  }

  // Tegner de andre slik radene fra Firebase sier. Kjøres i hvert bilde.
  synkAndre() {
    const tekstur = this.textures.get('dungeon');
    const gyldige = new Map();
    for (const [uid, r] of this.nettverk.radene) {
      const rad = lesRad(r, (f) => tekstur.has(`${f}_idle_anim_f0`));
      if (rad) gyldige.set(uid, rad);
    }
    for (const [uid, a] of this.andre) {
      if (gyldige.has(uid)) continue;
      a.bilde.destroy();
      a.lapp.remove();
      this.andre.delete(uid);
    }
    const lerret = this.game.canvas.getBoundingClientRect();
    const k = lerret.width / this.scale.width; // skjermpiksler per spillpiksel
    const syn = this.cameras.main.worldView;
    for (const [uid, rad] of gyldige) {
      let a = this.andre.get(uid);
      if (!a || a.figur !== rad.figur) {
        a?.bilde.destroy();
        lagAnimasjoner(this, rad.figur);
        const p = this.piksel(rad.x, rad.y);
        const bilde = this.add.sprite(p.x, p.y, 'dungeon').setOrigin(0.5, 1).setDepth(DYBDE.helt - 1);
        bilde.play(`${rad.figur}_idle`);
        const lapp = a?.lapp ?? this.lapper.appendChild(document.createElement('div'));
        lapp.className = 'lapp';
        a = { bilde, lapp, x: rad.x, y: rad.y, figur: rad.figur };
        this.andre.set(uid, a);
      }
      if (a.x !== rad.x || a.y !== rad.y) {
        if (rad.x !== a.x) a.bilde.setFlipX(rad.x < a.x);
        Object.assign(a, { x: rad.x, y: rad.y });
        a.bilde.play(`${rad.figur}_run`, true);
        this.tweens.killTweensOf(a.bilde);
        this.tweens.add({
          targets: a.bilde,
          ...this.piksel(rad.x, rad.y),
          duration: 250,
          onComplete: () => a.bilde.play(`${rad.figur}_idle`, true),
        });
      }
      if (a.lapp.textContent !== rad.navn) a.lapp.textContent = rad.navn;
      a.lapp.dataset.nivaa = rad.nivaa;
      a.lapp.hidden = !syn.contains(a.bilde.x, a.bilde.y);
      const x = lerret.left + (a.bilde.x - syn.x) * k;
      const y = lerret.top + (a.bilde.y - a.bilde.height * 0.75 - syn.y) * k; // figurene har luft over hodet
      a.lapp.style.transform = `translate(${x}px, ${y}px) translate(-50%, -100%)`;
    }
    const vist = `${this.andre.size} ${this.nettverk.tilkoblet}`;
    if (vist !== this.vist) {
      this.vist = vist;
      this.visKlassen();
    }
  }

  // Spør først. Ja glemmer helten og starter spillet på nytt.
  async nyHelt() {
    if (this.opptatt) return;
    this.stopp();
    const svar = await this.beskjed.vis('Vil du lage en ny helt?\nDen du har nå, blir borte.', [
      { navn: 'Nei' },
      { navn: 'Ja, ny helt' },
    ]);
    if (svar === 1) {
      slett();
      location.reload();
      return;
    }
    this.slipp();
  }

  // Tonet overgang til et annet kart. Helten kommer ut ved utgangen tilbake hit.
  byttKart(kart) {
    const fra = this.kartId;
    this.stopp();
    spill(this, 'trapp');
    spiller.kart = kart;
    lagre();
    this.cameras.main.fadeOut(TONING);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.restart({ kart, fra }));
  }

  // Trapp eller port. En port er låst til bossen i «krever» er slått, og en port
  // uten kart er stengt til et senere eventyr.
  async gaaUt(m) {
    const u = utgang(this.kartData, m.tegn);
    if (!u) return;
    if (portAapen(u, spiller.bosser)) {
      this.byttKart(u.kart);
      return;
    }
    this.stopp();
    const boss = u.kart && FIENDER.find((f) => f.id === u.krever);
    if (boss) await this.beskjed.vis(`Porten til ${u.navn} er låst. Slå ${boss.navn} først!`);
    else await this.beskjed.vis(`Porten til ${u.navn} er stengt. Her kommer et nytt eventyr senere!`);
    this.slipp();
  }

  // Én fiende for hver bokstav i kartet, bortsett fra dem som er slått.
  settUtFiender() {
    for (const m of this.kart.merker) {
      const type = fiendeFor(m.tegn);
      if (!type || spiller.slaatt.includes(this.nokkel(m))) continue;
      lagAnimasjoner(this, type.figur);
      const p = this.piksel(m.x, m.y);
      const bilde = this.add
        .sprite(p.x, p.y, 'dungeon')
        .setOrigin(0.5, 1)
        .setDepth(DYBDE.helt - 1)
        .play(`${type.figur}_idle`)
        .setTint(type.farge ?? 0xffffff);
      this.fiender.push({ ...lagFiende(type, this.fiendeNivaa()), x: m.x, y: m.y, bilde });
    }
  }

  // Helten får figuren fra klassen eller drakten.
  byttFigur() {
    lagAnimasjoner(this, spiller.figur);
    this.staar = `${spiller.figur}_idle`;
    this.helt.play(this.staar);
  }

  // Mynten som snurrer (gullkrukker og over selgeren).
  lagMynt() {
    if (this.anims.exists(MYNT)) return;
    const frames = this.anims.generateFrameNames('dungeon', { prefix: `${MYNT}_f`, start: 0, end: 3 });
    this.anims.create({ key: MYNT, frames, frameRate: 8, repeat: -1 });
  }

  // Selgeren står i butikkruta, med en mynt som svever over hodet.
  settUtButikk() {
    this.butikk = this.kart.merker.find((m) => m.tegn === BUTIKK) ?? null;
    if (!this.butikk) return;
    lagAnimasjoner(this, SELGER);
    const p = this.piksel(this.butikk.x, this.butikk.y);
    this.add.sprite(p.x, p.y, 'dungeon').setOrigin(0.5, 1).setDepth(DYBDE.helt - 1).play(`${SELGER}_idle`);
    const mynt = this.add.sprite(p.x, p.y - 22, 'dungeon').setDepth(DYBDE.over).play(MYNT);
    this.tweens.add({ targets: mynt, y: mynt.y - 3, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }

  // Kister, livsdrikker og gullkrukker. En drukket drikk og plukket gull er borte,
  // en åpnet kiste står igjen åpen.
  settUtTing() {
    for (const m of this.kart.merker) {
      if (![KISTE, DRIKK, KRUKKE].includes(m.tegn)) continue;
      const nokkel = this.nokkel(m);
      const brukt = spiller.aapnet.includes(nokkel);
      if (m.tegn !== KISTE && brukt) continue;
      const x = m.x * R + R / 2;
      let bilde;
      if (m.tegn === KRUKKE) bilde = this.add.sprite(x, (m.y + 1) * R - 4, 'dungeon').play(MYNT);
      else {
        const navn = m.tegn === DRIKK ? DRIKK_BILDE : brukt ? KISTE_AAPEN : KISTE_LUKKET;
        bilde = this.add.image(x, (m.y + 1) * R - (m.tegn === DRIKK ? 3 : 1), 'dungeon', navn);
      }
      bilde.setOrigin(0.5, 1).setDepth(DYBDE.helt - 1);
      this.ting.push({ tegn: m.tegn, x: m.x, y: m.y, nokkel, brukt, bilde });
    }
  }

  // Folk i kartet, bortsett fra dem som er borte et annet sted.
  settUtFolk() {
    lagMerker(this);
    for (const m of this.kart.merker) {
      const person = personFor(m.tegn);
      if (!person || !synlig(spiller, person, this.kartId)) continue;
      lagAnimasjoner(this, person.figur);
      const p = this.piksel(m.x, m.y);
      const bilde = this.add
        .sprite(p.x, p.y, 'dungeon')
        .setOrigin(0.5, 1)
        .setDepth(DYBDE.helt - 1)
        .play(`${person.figur}_idle`);
      this.folk.push({ person, x: m.x, y: m.y, bilde });
    }
    this.visFolkemerker();
  }

  // ! over den som har et nytt oppdrag, ? over den som har en belønning.
  visFolkemerker() {
    for (const f of this.folk) {
      if (f.merke) {
        this.tweens.killTweensOf(f.merke);
        f.merke.destroy();
        f.merke = null;
      }
      const navn = folkemerke(spiller, f.person);
      if (!navn) continue;
      const y = f.bilde.y - f.bilde.height + 4;
      f.merke = this.add.image(f.bilde.x, y, `merke_${navn}`).setOrigin(0.5, 1).setDepth(DYBDE.over + 1);
      this.tweens.add({ targets: f.merke, y: y - 2, duration: 500, yoyo: true, repeat: -1 });
    }
  }

  personI(x, y) {
    return this.folk.find((f) => f.x === x && f.y === y);
  }

  // Prat med en person: oppdraget først, så bakerens regneoppgave, ellers en replikk.
  async snakk(f) {
    this.stopp();
    const p = f.person;
    const hvem = { navn: p.navn, bilde: figurbilde(this, p.figur) };
    const om = snakkOm(spiller, p);
    if (om) {
      for (const t of om.tekst) await this.beskjed.vis(t, undefined, hvem);
      if (om.hjem) {
        // Den som var borte, går hjem.
        f.bilde.destroy();
        f.merke?.destroy();
        this.folk = this.folk.filter((x) => x !== f);
      }
      lagre();
      if (om.belonning) await this.belonn(om.belonning);
    } else if (portNytt(spiller, p)) {
      await this.beskjed.vis(portNytt(spiller, p), undefined, hvem);
    } else if (p.regn && !this.bakt) {
      await this.regn(p, hvem);
    } else {
      const gang = (this.prat[p.id] = (this.prat[p.id] ?? -1) + 1);
      await this.beskjed.vis(replikk(p, spiller.tilpasning.trinn, gang), undefined, hvem);
    }
    this.visFolkemerker();
    this.slipp();
  }

  // Bakeren ber om hjelp med en oppgave på elevens trinn. Feil er ufarlig: eleven kan prøve igjen.
  async regn(p, hvem) {
    const ja = await this.beskjed.vis('Kan du hjelpe meg å regne?', [{ navn: 'Ja' }, { navn: 'Ikke nå' }], hvem);
    if (ja !== 0) return;
    const t = spiller.tilpasning;
    const utfall = await this.oppgaverute.spor(lagOppgave(t.trinn), { topp: p.navn, taster: { Escape: 'lukk' } });
    if (utfall === 'lukk') return;
    spiller.tilpasning = oppdater(t, utfall === 'rett', MAKS_TRINN);
    lagre();
    if (utfall !== 'rett') {
      await this.beskjed.vis('Takk for at du prøvde! Spør meg igjen når du vil.', undefined, hvem);
      return;
    }
    this.bakt = true;
    spiller.liv = maksLiv(spiller);
    spill(this, 'drikk');
    await this.beskjed.vis('Riktig! Her er en varm bolle. Fullt liv!', undefined, hvem);
    await this.belonn({ erfaring: 2 });
  }

  // Belønning fra folk: erfaring og gull.
  async belonn({ erfaring = 0, gull = 0 }) {
    const e = giErfaring(spiller.erfaring, erfaring);
    spiller.erfaring = e.erfaring;
    let tekst = `+${erfaring} erfaring.`;
    if (gull) {
      spiller.gull += gull;
      tekst += ` +${gull} gull.`;
    }
    const meldinger = [{ tekst, lyd: 'kiste' }, ...this.vokst(e)];
    lagre();
    this.status.vis(spiller);
    for (const m of meldinger) {
      if (m.lyd) spill(this, m.lyd);
      await this.beskjed.vis(m.tekst);
    }
  }

  // Nivået fiendene i dette kartet har nå.
  fiendeNivaa() {
    return fiendeNivaa(this.kartData.nivaa, nivaa(spiller.erfaring));
  }

  fiendeI(x, y) {
    return this.fiender.find((f) => f.x === x && f.y === y);
  }

  tingI(x, y) {
    return this.ting.find((t) => t.x === x && t.y === y);
  }

  utgangI(x, y) {
    return this.utganger.find((m) => m.x === x && m.y === y);
  }

  butikkI(x, y) {
    return this.butikk && this.butikk.x === x && this.butikk.y === y;
  }

  // Stopper helten mens noe vises oppå kartet.
  stopp() {
    this.opptatt = true;
    this.vei = [];
    this.input.keyboard.resetKeys(); // ellers kan en tast bli hengende nede
  }

  slipp() {
    this.input.keyboard.resetKeys();
    this.status.vis(spiller);
    this.opptatt = false;
  }

  async visKort() {
    if (this.opptatt) return;
    this.stopp();
    await this.heltekort.vis(this, spiller);
    this.slipp();
  }

  async visBok() {
    if (this.opptatt) return;
    this.stopp();
    await this.bok.vis(spiller);
    lagre();
    this.slipp();
  }

  // Butikken. Drakten kan ha byttet figur på helten.
  async handle() {
    if (this.opptatt) return;
    this.stopp();
    await this.butikken.vis(spiller, {
      scene: this,
      rute: this.oppgaverute,
      lyd: (navn) => spill(this, navn),
      endret: () => this.status.vis(spiller),
    });
    this.byttFigur();
    lagre();
    this.slipp();
  }

  // Gullkrukka gir gull og er borte.
  async plukk(krukke) {
    this.stopp();
    const gull = krukkeGull(this.kartData.nivaa);
    spiller.gull += gull;
    spiller.aapnet.push(krukke.nokkel);
    krukke.bilde.destroy();
    this.ting = this.ting.filter((t) => t !== krukke);
    spill(this, 'gull');
    lagre();
    this.status.vis(spiller);
    await this.beskjed.vis(`Du fant ${gull} gull!`);
    this.slipp();
  }

  async oving() {
    if (this.opptatt) return;
    this.stopp();
    await kjorOving(this.oppgaverute);
    this.opptatt = false;
  }

  // Kisten gir neste utstyr. Det beste tas i bruk av seg selv.
  // Når alt utstyret er funnet, gir kisten gull.
  async aapneKiste(kiste) {
    if (kiste.brukt) return;
    this.stopp();
    kiste.brukt = true;
    kiste.bilde.setFrame(KISTE_AAPEN);
    spiller.aapnet.push(kiste.nokkel);
    const u = nesteUtstyr(spiller.utstyr);
    const gull = kisteGull(this.kartData.nivaa);
    let tekst = `Kisten har ${gull} gull!`;
    if (!u) {
      spiller.gull += gull;
      spill(this, 'gull');
    } else {
      const foer = maksLiv(spiller);
      spiller.utstyr.push(u.id);
      spiller.liv += maksLiv(spiller) - foer;
      spill(this, 'kiste');
      tekst = `Du fant: ${u.navn}! ` + (u.slag === 'vaapen' ? `+${u.skade} skade.` : `+${u.liv} liv.`);
    }
    lagre();
    this.status.vis(spiller);
    await this.beskjed.vis(tekst);
    this.slipp();
  }

  // Livsdrikken gir fullt liv. Med fullt liv spares den.
  async drikk(d) {
    this.stopp();
    if (spiller.liv >= maksLiv(spiller)) {
      await this.beskjed.vis('Du har fullt liv. Spar drikken til senere.');
      this.slipp();
      return;
    }
    spill(this, 'drikk');
    spiller.liv = maksLiv(spiller);
    spiller.aapnet.push(d.nokkel);
    d.bilde.destroy();
    this.ting = this.ting.filter((t) => t !== d);
    lagre();
    this.status.vis(spiller);
    await this.beskjed.vis('Du drikker. Fullt liv!');
    this.slipp();
  }

  async kamp(fiende) {
    this.stopp();
    Object.assign(fiende, tilNivaa(fiende, this.fiendeNivaa())); // helten kan ha vokst
    const type = fiende.type;
    if (type.boss) {
      const forste = !spiller.sett.includes(type.id);
      for (const t of forste ? type.foer : type.igjen) await this.beskjed.vis(t);
      if (forste) spiller.sett.push(type.id);
      lagre();
    }
    this.scene.launch('Kamp', {
      spiller,
      fiende,
      farge: this.kartData.farge, // arenaen får områdets farge
      visning: this.kampvisning,
      oppgaverute: this.oppgaverute,
      oppgjor: (k) => this.oppgjor(fiende, k),
      ferdig: () => (this.bossSlaatt ? this.seier(type) : this.slipp()),
    });
  }

  // Nytt nivå etter mer erfaring («e» fra giErfaring): fullt liv og meldinger om nivå og nye angrep.
  vokst(e) {
    const tekster = [];
    if (e.til <= e.fra) return tekster;
    tekster.push({ tekst: `Nivå ${e.til}! Du er blitt sterkere.`, lyd: 'nivaa' });
    // Nye angrep tas med av seg selv hvis det er plass. Ellers kan eleven bytte i boka.
    for (const a of e.nyeAngrep) {
      const plass = spiller.angrep.length < MAKS_ANGREP;
      if (plass) spiller.angrep.push(a.id);
      const tekst = plass ? `Nytt angrep: ${a.navn}!` : `Nytt angrep: ${a.navn}! Ta det med i angrepsboka (B).`;
      tekster.push({ tekst, lyd: 'magi' });
    }
    spiller.liv = maksLiv(spiller);
    return tekster;
  }

  // Etter kampen: erfaring, nivå, liv og lagring. Gir meldingene kampen skal vise,
  // som { tekst, lyd }.
  oppgjor(fiende, k) {
    const seier = k.utfall === 'seier';
    const poeng = kampErfaring(fiende, k);
    const gull = kampGull(fiende, k);
    const e = giErfaring(spiller.erfaring, poeng);
    spiller.erfaring = e.erfaring;
    spiller.gull += gull;
    spiller.liv = k.heltLiv;
    fiende.liv = k.fiendeLiv; // fienden beholder skaden til neste forsøk

    const pluss = (poeng ? ` +${poeng} erfaring.` : '') + (gull ? ` +${gull} gull.` : '');
    const tekster = [
      seier ? { tekst: `Du vant!${pluss}`, lyd: 'seier' } : { tekst: `Du er utslitt og må hvile.${pluss}` },
      ...this.vokst(e),
    ];

    if (seier) {
      slaattFiende(spiller, fiende.type.id);
      fiende.bilde.destroy();
      this.fiender = this.fiender.filter((f) => f !== fiende);
      spiller.slaatt.push(this.nokkel(fiende));
      this.bossSlaatt = !!fiende.type.boss;
    } else {
      // Ingen «game over»: helten våkner ved start i kartet med fullt liv.
      spiller.liv = maksLiv(spiller);
      this.rute = { ...this.kart.start };
      const p = this.piksel(this.rute.x, this.rute.y);
      this.helt.setPosition(p.x, p.y);
    }
    lagre();
    return tekster;
  }

  // Bossen er slått: slutten på historien, og så et nytt eventyr med samme helt.
  async seier(boss) {
    this.bossSlaatt = false;
    this.status.vis(spiller);
    for (const t of boss.etter) await this.beskjed.vis(t);
    spiller.seire++;
    const ny = !spiller.bosser.includes(boss.id);
    if (ny) spiller.bosser.push(boss.id);
    lagre();
    spill(this, 'nivaa');
    await this.heltekort.vis(this, spiller, 'Vis fram heltekortet ditt!');
    const port = ny && portEtter(boss.id);
    if (port) await this.beskjed.vis(`Porten til ${port.navn} har åpnet seg!`);
    await this.beskjed.vis(NYTT_EVENTYR);
    spiller.slaatt = [];
    spiller.aapnet = [];
    spiller.liv = maksLiv(spiller);
    this.byttKart(FORSTE);
  }

  update() {
    this.nettverk.send(this.minRad());
    this.synkAndre();
    if (this.gaar) return;
    if (this.opptatt) {
      this.helt.play(this.staar, true);
      return;
    }
    const t = this.taster;
    let d = null;
    if (t.LEFT.isDown || t.A.isDown) d = [-1, 0];
    else if (t.RIGHT.isDown || t.D.isDown) d = [1, 0];
    else if (t.UP.isDown || t.W.isDown) d = [0, -1];
    else if (t.DOWN.isDown || t.S.isDown) d = [0, 1];

    let gikk = false;
    if (d) {
      this.vei = [];
      gikk = this.steg(this.rute.x + d[0], this.rute.y + d[1]);
    } else if (this.vei.length) {
      const neste = this.vei.shift();
      gikk = this.steg(neste.x, neste.y);
    }
    if (!gikk) this.helt.play(this.staar, true);
  }

  steg(x, y) {
    if (x !== this.rute.x) this.helt.setFlipX(x < this.rute.x);
    if (this.kart.vegg(x, y)) return false;
    const fiende = this.fiendeI(x, y);
    if (fiende) {
      this.kamp(fiende);
      return false;
    }
    const person = this.personI(x, y);
    if (person) {
      this.snakk(person);
      return false;
    }
    const ting = this.tingI(x, y);
    if (ting) {
      if (ting.tegn === DRIKK) this.drikk(ting);
      else if (ting.tegn === KRUKKE) this.plukk(ting);
      else this.aapneKiste(ting);
      return false;
    }
    if (this.butikkI(x, y)) {
      this.handle();
      return false;
    }
    const ut = this.utgangI(x, y);
    if (ut) {
      this.gaaUt(ut);
      return false;
    }
    this.rute = { x, y };
    this.gaar = true;
    this.helt.play(`${spiller.figur}_run`, true);
    this.tweens.add({
      targets: this.helt,
      ...this.piksel(x, y),
      duration: STEGTID,
      onComplete: () => {
        this.gaar = false;
      },
    });
    return true;
  }
}
