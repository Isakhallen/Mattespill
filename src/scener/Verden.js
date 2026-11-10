import { lesKart } from '../kart.js';
import { finnVei } from '../vei.js';
import { tegnKart, R, DYBDE } from '../tegnKart.js';
import { lagAnimasjoner } from '../figur.js';
import { fiendeFor } from '../fiender.js';
import { spiller, lagre } from '../spiller.js';
import { maksLiv, kampErfaring, giErfaring, nesteUtstyr } from '../vekst.js';
import { KISTE, KISTE_LUKKET, KISTE_AAPEN } from '../utstyr.js';
import { lagOppgaverute } from '../oppgaverute.js';
import { lagKampvisning } from '../kampvisning.js';
import { lagStatus } from '../status.js';
import { lagBeskjed } from '../beskjed.js';
import { kjorOving } from '../oving.js';
import testkart from '../data/kart/test.js';

const STEGTID = 130; // ms per rute

export default class Verden extends Phaser.Scene {
  constructor() {
    super('Verden');
  }

  preload() {
    this.load.atlas('dungeon', 'assets/dungeon.png', 'assets/dungeon.json');
  }

  create() {
    this.kartId = testkart.id;
    this.kart = lesKart(testkart.ruter);
    tegnKart(this, this.kart);

    lagAnimasjoner(this, spiller.figur);
    this.staar = `${spiller.figur}_idle`;
    this.rute = { ...this.kart.start };
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
    this.kister = [];
    this.settUtKister();

    const kamera = this.cameras.main;
    // 4 piksler ekstra øverst så toppkanten på veggen synes.
    kamera.setBounds(0, -4, this.kart.bredde * R, this.kart.hoyde * R + 4);
    kamera.startFollow(this.helt, true);

    this.taster = this.input.keyboard.addKeys('UP,DOWN,LEFT,RIGHT,W,A,S,D');
    this.oppgaverute = lagOppgaverute();
    this.kampvisning = lagKampvisning(this.game);
    this.status = lagStatus();
    this.status.vis(spiller);
    this.beskjed = lagBeskjed();
    this.opptatt = false; // sant mens en oppgave, beskjed eller kamp vises
    this.input.keyboard.on('keydown-O', () => this.oving());
    this.input.on('pointerdown', (peker) => {
      if (this.opptatt) return;
      const til = { x: Math.floor(peker.worldX / R), y: Math.floor(peker.worldY / R) };
      // Gå rundt fiender og kister, bortsett fra den eleven klikker på.
      const stengt = (x, y) =>
        this.kart.vegg(x, y) ||
        ((this.fiendeI(x, y) || this.kisteI(x, y)) && !(x === til.x && y === til.y));
      this.vei = finnVei({ ...this.kart, vegg: stengt }, this.rute, til) ?? [];
    });
  }

  // Der føttene til helten står i en rute.
  piksel(x, y) {
    return { x: x * R + R / 2, y: (y + 1) * R - 4 };
  }

  // Navnet på en rute i lagringen, f.eks. «test:10,5».
  nokkel(m) {
    return `${this.kartId}:${m.x},${m.y}`;
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

  settUtKister() {
    for (const m of this.kart.merker) {
      if (m.tegn !== KISTE) continue;
      const nokkel = this.nokkel(m);
      const aapen = spiller.aapnet.includes(nokkel);
      const bilde = this.add
        .image(m.x * R + R / 2, (m.y + 1) * R - 1, 'dungeon', aapen ? KISTE_AAPEN : KISTE_LUKKET)
        .setOrigin(0.5, 1)
        .setDepth(DYBDE.helt - 1);
      this.kister.push({ x: m.x, y: m.y, nokkel, aapen, bilde });
    }
  }

  fiendeI(x, y) {
    return this.fiender.find((f) => f.x === x && f.y === y);
  }

  kisteI(x, y) {
    return this.kister.find((k) => k.x === x && k.y === y);
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

  async oving() {
    if (this.opptatt) return;
    this.stopp();
    await kjorOving(this.oppgaverute);
    this.opptatt = false;
  }

  // Kisten gir neste utstyr. Det beste tas i bruk av seg selv.
  async aapneKiste(kiste) {
    if (kiste.aapen) return;
    this.stopp();
    kiste.aapen = true;
    kiste.bilde.setFrame(KISTE_AAPEN);
    spiller.aapnet.push(kiste.nokkel);
    const u = nesteUtstyr(spiller.utstyr);
    let tekst = 'Kisten er tom.';
    if (u) {
      const foer = maksLiv(spiller);
      spiller.utstyr.push(u.id);
      spiller.liv += maksLiv(spiller) - foer;
      tekst = `Du fant: ${u.navn}! ` + (u.slag === 'vaapen' ? `+${u.skade} skade.` : `+${u.liv} liv.`);
    }
    lagre();
    this.status.vis(spiller);
    await this.beskjed.vis(tekst);
    this.slipp();
  }

  kamp(fiende) {
    this.stopp();
    this.scene.launch('Kamp', {
      spiller,
      fiende,
      visning: this.kampvisning,
      oppgaverute: this.oppgaverute,
      oppgjor: (k) => this.oppgjor(fiende, k),
      ferdig: () => this.slipp(),
    });
  }

  // Etter kampen: erfaring, nivå, liv og lagring. Gir meldingene kampen skal vise.
  oppgjor(fiende, k) {
    const seier = k.utfall === 'seier';
    const poeng = kampErfaring(fiende.type, k);
    const e = giErfaring(spiller.erfaring, poeng);
    spiller.erfaring = e.erfaring;
    spiller.liv = k.heltLiv;
    fiende.liv = k.fiendeLiv; // fienden beholder skaden til neste forsøk

    const pluss = poeng ? ` +${poeng} erfaring.` : '';
    const tekster = [seier ? `Du vant!${pluss}` : `Du er utslitt og må hvile.${pluss}`];
    if (e.til > e.fra) {
      tekster.push(`Nivå ${e.til}! Du er blitt sterkere.`);
      for (const a of e.nyeAngrep) tekster.push(`Nytt angrep: ${a.navn}!`);
      spiller.liv = maksLiv(spiller);
    }

    if (seier) {
      fiende.bilde.destroy();
      this.fiender = this.fiender.filter((f) => f !== fiende);
      spiller.slaatt.push(this.nokkel(fiende));
      // Foreløpig: når alle er slått, kommer de tilbake.
      if (!this.fiender.length) {
        spiller.slaatt = [];
        this.settUtFiender();
        spiller.liv = maksLiv(spiller);
      }
    } else {
      // Ingen «game over»: helten våkner ved start med fullt liv.
      spiller.liv = maksLiv(spiller);
      this.rute = { ...this.kart.start };
      const p = this.piksel(this.rute.x, this.rute.y);
      this.helt.setPosition(p.x, p.y);
    }
    lagre();
    return tekster;
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
    const kiste = this.kisteI(x, y);
    if (kiste) {
      this.aapneKiste(kiste);
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
