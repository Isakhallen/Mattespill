import { lesKart } from '../kart.js';
import { finnVei } from '../vei.js';
import { tegnKart, R, DYBDE } from '../tegnKart.js';
import { lagOppgaverute } from '../oppgaverute.js';
import { kjorOving } from '../oving.js';
import testkart from '../data/kart/test.js';

const STEGTID = 130; // ms per rute
const HELT = 'knight_m';

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

    for (const [key, del, fart] of [['helt-staar', 'idle', 6], ['helt-gaar', 'run', 10]]) {
      this.anims.create({
        key,
        frames: this.anims.generateFrameNames('dungeon', {
          prefix: `${HELT}_${del}_anim_f`,
          start: 0,
          end: 3,
        }),
        frameRate: fart,
        repeat: -1,
      });
    }

    this.rute = { ...this.kart.start };
    const p = this.piksel(this.rute.x, this.rute.y);
    this.helt = this.add
      .sprite(p.x, p.y, 'dungeon')
      .setOrigin(0.5, 1)
      .setDepth(DYBDE.helt)
      .play('helt-staar');
    this.vei = [];
    this.gaar = false;

    const kamera = this.cameras.main;
    // 4 piksler ekstra øverst så toppkanten på veggen synes.
    kamera.setBounds(0, -4, this.kart.bredde * R, this.kart.hoyde * R + 4);
    kamera.startFollow(this.helt, true);

    this.taster = this.input.keyboard.addKeys('UP,DOWN,LEFT,RIGHT,W,A,S,D');
    this.oppgaverute = lagOppgaverute();
    this.opptatt = false; // sant mens en oppgave vises
    this.input.keyboard.on('keydown-O', () => this.oving());
    this.input.on('pointerdown', (peker) => {
      if (this.opptatt) return;
      const til = { x: Math.floor(peker.worldX / R), y: Math.floor(peker.worldY / R) };
      this.vei = finnVei(this.kart, this.rute, til) ?? [];
    });
  }

  // Der føttene til helten står i en rute.
  piksel(x, y) {
    return { x: x * R + R / 2, y: (y + 1) * R - 4 };
  }

  async oving() {
    if (this.opptatt) return;
    this.opptatt = true;
    this.vei = [];
    this.input.keyboard.resetKeys(); // ellers kan en tast bli hengende nede
    await kjorOving(this.oppgaverute);
    this.opptatt = false;
  }

  update() {
    if (this.gaar) return;
    if (this.opptatt) {
      this.helt.play('helt-staar', true);
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
    if (!gikk) this.helt.play('helt-staar', true);
  }

  steg(x, y) {
    if (x !== this.rute.x) this.helt.setFlipX(x < this.rute.x);
    if (this.kart.vegg(x, y)) return false;
    this.rute = { x, y };
    this.gaar = true;
    this.helt.play('helt-gaar', true);
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
