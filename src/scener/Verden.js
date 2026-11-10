import { lesKart, vedSiden } from '../kart.js';
import { finnVei } from '../vei.js';
import { tegnKart, R, DYBDE } from '../tegnKart.js';
import { lagAnimasjoner, figurbilde } from '../figur.js';
import { fiendeFor } from '../fiender.js';
import { spiller, lagre, velgKlasse } from '../spiller.js';
import { maksLiv, kampErfaring, giErfaring, nesteUtstyr } from '../vekst.js';
import { KISTE, KISTE_LUKKET, KISTE_AAPEN, DRIKK, DRIKK_BILDE } from '../utstyr.js';
import { KLASSER } from '../klasser.js';
import { kartFor, FORSTE, TRAPP } from '../kartliste.js';
import { slett } from '../lagring.js';
import { lagOppgaverute } from '../oppgaverute.js';
import { lagKampvisning } from '../kampvisning.js';
import { lagStatus } from '../status.js';
import { lagBeskjed } from '../beskjed.js';
import { kjorOving } from '../oving.js';
import { lastEffekter, spill, musikk, settLyd, lydPaa } from '../lyd.js';
import { lagHeltekort } from '../heltekort.js';

const STEGTID = 130; // ms per rute
const TONING = 250; // ms når kartet byttes
const TRAPPBILDE = { '>': 'floor_stairs', '<': 'floor_ladder' };

// Historien ved start, før helten velger klasse.
const START = [
  'Tallslukeren har stjålet alle tallene fra landsbyen!',
  'Nå vet ingen hva noe koster, og ingen kan telle til ti.',
];
const ETTER_VALG = 'Tallslukeren bor dypt nede. Gå ned trappene og slå monstrene med matte!';
const NYTT_EVENTYR = 'Du drar på et nytt eventyr med samme helt. Monstrene er tilbake!';

export default class Verden extends Phaser.Scene {
  constructor() {
    super('Verden');
  }

  preload() {
    this.load.atlas('dungeon', 'assets/dungeon.png', 'assets/dungeon.json');
    lastEffekter(this);
  }

  // data: { kart, fra } der «fra» er trappen helten kommer ut av.
  create(data = {}) {
    this.kartData = kartFor(data.kart ?? spiller.kart) ?? kartFor(FORSTE);
    this.kartId = this.kartData.id;
    this.kart = lesKart(this.kartData.ruter);
    tegnKart(this, this.kart);
    spiller.kart = this.kartId;
    this.trapper = this.kart.merker.filter((m) => TRAPP[m.tegn]);
    for (const m of this.trapper) {
      this.add.image(m.x * R, m.y * R, 'dungeon', TRAPPBILDE[m.tegn]).setOrigin(0).setDepth(1);
    }
    const ut = this.trapper.find((m) => m.tegn === data.fra);

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

    const kamera = this.cameras.main;
    // 4 piksler ekstra øverst så toppkanten på veggen synes.
    kamera.setBounds(0, -4, this.kart.bredde * R, this.kart.hoyde * R + 4);
    kamera.startFollow(this.helt, true);
    kamera.fadeIn(TONING);

    this.taster = this.input.keyboard.addKeys('UP,DOWN,LEFT,RIGHT,W,A,S,D');
    // HTML-delene lages bare første gang, ikke når kartet byttes.
    this.oppgaverute ??= lagOppgaverute();
    this.kampvisning ??= lagKampvisning(this.game);
    this.status ??= lagStatus(
      {
        kort: () => this.visKort(),
        lyd: () => settLyd(this.game, !lydPaa()),
        nyHelt: () => this.nyHelt(),
      },
      settLyd(this.game),
    );
    this.heltekort ??= lagHeltekort();
    musikk(this, this.kartId);
    this.status.vis(spiller);
    this.beskjed ??= lagBeskjed();
    this.bossSlaatt = false;
    this.opptatt = false; // sant mens en oppgave, beskjed eller kamp vises
    this.input.keyboard.on('keydown-O', () => this.oving());
    this.input.keyboard.on('keydown-H', () => this.visKort());
    this.input.on('pointerdown', (peker) => {
      if (this.opptatt) return;
      const til = { x: Math.floor(peker.worldX / R), y: Math.floor(peker.worldY / R) };
      // Gå rundt fiender, ting og trapper, bortsett fra det eleven klikker på.
      const stengt = (x, y) =>
        this.kart.vegg(x, y) ||
        ((this.fiendeI(x, y) || this.tingI(x, y) || this.trappI(x, y)) &&
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
    this.staar = `${spiller.figur}_idle`;
    this.helt.play(this.staar);
    lagre();
    this.status.vis(spiller);
    await this.beskjed.vis(ETTER_VALG);
    this.slipp();
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

  // Tonet overgang til et annet kart. «fra» er trappen helten kommer ut av der.
  byttKart(kart, fra) {
    this.stopp();
    spill(this, 'trapp');
    spiller.kart = kart;
    lagre();
    this.cameras.main.fadeOut(TONING);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.restart({ kart, fra }));
  }

  trapp(m) {
    const t = TRAPP[m.tegn];
    const til = this.kartData[t.til];
    if (til) this.byttKart(til, t.motsatt);
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
        .play(`${type.figur}_idle`);
      this.fiender.push({ type, x: m.x, y: m.y, liv: type.liv, bilde });
    }
  }

  // Kister og livsdrikker. En drukket drikk er borte, en åpnet kiste står igjen åpen.
  settUtTing() {
    for (const m of this.kart.merker) {
      if (m.tegn !== KISTE && m.tegn !== DRIKK) continue;
      const nokkel = this.nokkel(m);
      const brukt = spiller.aapnet.includes(nokkel);
      if (m.tegn === DRIKK && brukt) continue;
      const navn = m.tegn === DRIKK ? DRIKK_BILDE : brukt ? KISTE_AAPEN : KISTE_LUKKET;
      const bilde = this.add
        .image(m.x * R + R / 2, (m.y + 1) * R - (m.tegn === DRIKK ? 3 : 1), 'dungeon', navn)
        .setOrigin(0.5, 1)
        .setDepth(DYBDE.helt - 1);
      this.ting.push({ tegn: m.tegn, x: m.x, y: m.y, nokkel, brukt, bilde });
    }
  }

  fiendeI(x, y) {
    return this.fiender.find((f) => f.x === x && f.y === y);
  }

  tingI(x, y) {
    return this.ting.find((t) => t.x === x && t.y === y);
  }

  trappI(x, y) {
    return this.trapper.find((m) => m.x === x && m.y === y);
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

  async oving() {
    if (this.opptatt) return;
    this.stopp();
    await kjorOving(this.oppgaverute);
    this.opptatt = false;
  }

  // Kisten gir neste utstyr. Det beste tas i bruk av seg selv.
  async aapneKiste(kiste) {
    if (kiste.brukt) return;
    this.stopp();
    kiste.brukt = true;
    kiste.bilde.setFrame(KISTE_AAPEN);
    spiller.aapnet.push(kiste.nokkel);
    const u = nesteUtstyr(spiller.utstyr);
    let tekst = 'Kisten er tom.';
    if (u) {
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
      visning: this.kampvisning,
      oppgaverute: this.oppgaverute,
      oppgjor: (k) => this.oppgjor(fiende, k),
      ferdig: () => (this.bossSlaatt ? this.seier(type) : this.slipp()),
    });
  }

  // Etter kampen: erfaring, nivå, liv og lagring. Gir meldingene kampen skal vise,
  // som { tekst, lyd }.
  oppgjor(fiende, k) {
    const seier = k.utfall === 'seier';
    const poeng = kampErfaring(fiende.type, k);
    const e = giErfaring(spiller.erfaring, poeng);
    spiller.erfaring = e.erfaring;
    spiller.liv = k.heltLiv;
    fiende.liv = k.fiendeLiv; // fienden beholder skaden til neste forsøk

    const pluss = poeng ? ` +${poeng} erfaring.` : '';
    const tekster = [
      seier ? { tekst: `Du vant!${pluss}`, lyd: 'seier' } : { tekst: `Du er utslitt og må hvile.${pluss}` },
    ];
    if (e.til > e.fra) {
      tekster.push({ tekst: `Nivå ${e.til}! Du er blitt sterkere.`, lyd: 'nivaa' });
      for (const a of e.nyeAngrep) tekster.push({ tekst: `Nytt angrep: ${a.navn}!`, lyd: 'magi' });
      spiller.liv = maksLiv(spiller);
    }

    if (seier) {
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
    lagre();
    spill(this, 'nivaa');
    await this.heltekort.vis(this, spiller, 'Vis fram heltekortet ditt!');
    await this.beskjed.vis(NYTT_EVENTYR);
    spiller.slaatt = [];
    spiller.aapnet = [];
    spiller.liv = maksLiv(spiller);
    this.byttKart(FORSTE);
  }

  update() {
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
    const ting = this.tingI(x, y);
    if (ting) {
      if (ting.tegn === DRIKK) this.drikk(ting);
      else this.aapneKiste(ting);
      return false;
    }
    const trapp = this.trappI(x, y);
    if (trapp) {
      this.trapp(trapp);
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
