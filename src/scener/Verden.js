import { lesKart } from '../kart.js';
import { finnVei } from '../vei.js';
import { tegnKart, R, DYBDE } from '../tegnKart.js';
import { lagAnimasjoner } from '../figur.js';
import { fiendeFor } from '../fiender.js';
import { spiller } from '../spiller.js';
import { lagOppgaverute } from '../oppgaverute.js';
import { lagKampvisning } from '../kampvisning.js';
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

    const kamera = this.cameras.main;
    // 4 piksler ekstra øverst så toppkanten på veggen synes.
    kamera.setBounds(0, -4, this.kart.bredde * R, this.kart.hoyde * R + 4);
    kamera.startFollow(this.helt, true);

    this.taster = this.input.keyboard.addKeys('UP,DOWN,LEFT,RIGHT,W,A,S,D');
    this.oppgaverute = lagOppgaverute();
    this.kampvisning = lagKampvisning(this.game);
    this.opptatt = false; // sant mens en oppgave eller kamp vises
    this.input.keyboard.on('keydown-O', () => this.oving());
    this.input.on('pointerdown', (peker) => {
      if (this.opptatt) return;
      const til = { x: Math.floor(peker.worldX / R), y: Math.floor(peker.worldY / R) };
      // Gå rundt fiender, bortsett fra den eleven klikker på.
      const stengt = (x, y) =>
        this.kart.vegg(x, y) || (this.fiendeI(x, y) && !(x === til.x && y === til.y));
      this.vei = finnVei({ ...this.kart, vegg: stengt }, this.rute, til) ?? [];
    });
  }

  // Der føttene til helten står i en rute.
  piksel(x, y) {
    return { x: x * R + R / 2, y: (y + 1) * R - 4 };
  }

  // Én fiende for hver bokstav i kartet.
  settUtFiender() {
    for (const m of this.kart.merker) {
      const type = fiendeFor(m.tegn);
      if (!type) continue;
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

  fiendeI(x, y) {
    return this.fiender.find((f) => f.x === x && f.y === y);
  }

  async oving() {
    if (this.opptatt) return;
    this.opptatt = true;
    this.vei = [];
    this.input.keyboard.resetKeys(); // ellers kan en tast bli hengende nede
    await kjorOving(this.oppgaverute);
    this.opptatt = false;
  }

  kamp(fiende) {
    this.opptatt = true;
    this.vei = [];
    this.input.keyboard.resetKeys();
    this.scene.launch('Kamp', {
      spiller,
      fiende,
      visning: this.kampvisning,
      oppgaverute: this.oppgaverute,
      ferdig: (k) => this.etterKamp(fiende, k),
    });
  }

  etterKamp(fiende, k) {
    spiller.liv = k.heltLiv;
    fiende.liv = k.fiendeLiv; // fienden beholder skaden til neste forsøk
    if (k.utfall === 'seier') {
      fiende.bilde.destroy();
      this.fiender = this.fiender.filter((f) => f !== fiende);
      // Foreløpig: når alle er slått, kommer de tilbake.
      if (!this.fiender.length) {
        this.settUtFiender();
        spiller.liv = spiller.maksLiv;
      }
    } else {
      // Ingen «game over»: helten våkner ved start med fullt liv.
      spiller.liv = spiller.maksLiv;
      this.rute = { ...this.kart.start };
      const p = this.piksel(this.rute.x, this.rute.y);
      this.helt.setPosition(p.x, p.y);
    }
    this.input.keyboard.resetKeys();
    this.opptatt = false;
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
