import { gulvnavn } from '../tegnKart.js';
import { angrepFor, nyKamp, runde, teller } from '../kamp.js';
import { nivaa, maksLiv, skadeBonus } from '../vekst.js';
import { lagOppgave, MAKS_TRINN } from '../oppgaver.js';
import { oppdater } from '../tilpasning.js';

const S = 2; // figurer og fliser tegnes dobbelt så store som på kartet
const FLIS = 16 * S;
const BAKKE = 118; // der føttene står
const PAUSE = 550; // ms mellom heltens og fiendens tur

// Kampen: turbasert, oppå kartet. Startes av Verden med
// { spiller, fiende, visning, oppgaverute, oppgjor, ferdig }. «oppgjor(k)» oppdaterer
// helten etter kampen og gir meldingene som skal vises før kampen lukkes.
export default class Kamp extends Phaser.Scene {
  constructor() {
    super('Kamp');
  }

  create(d) {
    const { width, height } = this.scale;
    this.add.rectangle(0, 0, width, height, 0x0e0b10, 0.92).setOrigin(0);
    const flis = (x, rad, navn) =>
      this.add.image(x * FLIS, 4 + rad * FLIS, 'dungeon', navn).setOrigin(0).setScale(S);
    for (let x = 0; x < width / FLIS; x++) {
      flis(x, 0, 'wall_top_mid');
      flis(x, 1, 'wall_mid');
      flis(x, 2, gulvnavn(x, 2));
      flis(x, 3, gulvnavn(x, 3));
    }
    const figur = (x, navn) =>
      this.add.sprite(x, BAKKE, 'dungeon').setOrigin(0.5, 1).setScale(S).play(`${navn}_idle`);
    this.helt = figur(112, d.spiller.figur);
    this.fiende = figur(208, d.fiende.type.figur).setFlipX(true);
    this.kjor(d);
  }

  async kjor({ spiller, fiende, visning, oppgaverute, oppgjor, ferdig }) {
    const type = fiende.type;
    const maks = maksLiv(spiller);
    const n = nivaa(spiller.erfaring);
    const bonus = skadeBonus(spiller);
    let k = nyKamp(spiller.liv, fiende.liv, type.skade);
    let rette = 0;
    const visLiv = () => {
      visning.liv('helt', k.heltLiv, maks);
      visning.liv('fiende', k.fiendeLiv, type.liv);
    };
    visning.aapne(spiller.navn, type.navn);
    visLiv();
    visning.si('Velg angrep.');

    let forrige = null;
    while (!k.utfall) {
      const trinn = spiller.tilpasning.trinn;
      const liste = angrepFor(n, trinn, bonus);
      const valg = liste.map((a) => ({ navn: a.navn, under: `${a.skade} skade` }));
      const angrep = liste[await visning.velg(valg)];
      const oppgave = lagOppgave(angrep.oppgavetrinn, Math.random, forrige);
      forrige = oppgave.tekst;
      const rett = (await oppgaverute.spor(oppgave, { topp: angrep.navn })) === 'rett';
      oppgaverute.skjul();
      if (rett) rette++;
      if (teller(angrep.oppgavetrinn, trinn, rett)) {
        spiller.tilpasning = oppdater(spiller.tilpasning, rett, MAKS_TRINN);
      }
      k = runde(k, angrep, rett);

      await this.slag(this.helt, this.fiende, rett);
      const mitt = rett ? `Treff! −${k.traff}.` : 'Bom!';
      visning.si(mitt);
      visLiv();
      if (k.utfall === 'seier') break;

      await this.pause(PAUSE);
      await this.slag(this.fiende, this.helt, true);
      visning.si(`${mitt} ${type.bestemt} slår: −${k.slag}.`);
      visLiv();
    }

    const tapte = k.utfall === 'seier' ? this.fiende : this.helt;
    this.tweens.add({ targets: tapte, alpha: 0, duration: 300 });
    for (const tekst of oppgjor({ ...k, rette })) await visning.vent(tekst);
    visning.skjul();
    this.scene.stop();
    ferdig();
  }

  pause(ms) {
    return new Promise((los) => this.time.delayedCall(ms, los));
  }

  // Den som slår, hopper fram og tilbake. Treff gir et hvitt blink, bom gir et hopp unna.
  slag(fra, til, traff) {
    const retning = til.x > fra.x ? 1 : -1;
    if (!traff) {
      this.tweens.add({ targets: til, x: til.x + 14 * retning, duration: 110, yoyo: true });
    }
    return new Promise((los) => {
      this.tweens.add({
        targets: fra,
        x: fra.x + 44 * retning,
        duration: 110,
        yoyo: true,
        onYoyo: () => traff && til.setTintFill(0xffffff),
        onComplete: () => {
          til.clearTint();
          los();
        },
      });
    });
  }
}
