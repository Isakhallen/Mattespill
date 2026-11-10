import { gulvnavn } from '../tegnKart.js';
import { ANGREP, nyKamp, oppgavetrinn, runde } from '../kamp.js';
import { lagOppgave, MAKS_TRINN } from '../oppgaver.js';
import { oppdater } from '../tilpasning.js';

const S = 2; // figurer og fliser tegnes dobbelt så store som på kartet
const FLIS = 16 * S;
const BAKKE = 118; // der føttene står
const PAUSE = 550; // ms mellom heltens og fiendens tur

// Kampen: turbasert, oppå kartet. Startes av Verden med
// { spiller, fiende, visning, oppgaverute, ferdig }.
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

  async kjor({ spiller, fiende, visning, oppgaverute, ferdig }) {
    const type = fiende.type;
    let k = nyKamp(spiller.liv, fiende.liv, type.skade);
    const visLiv = () => {
      visning.liv('helt', k.heltLiv, spiller.maksLiv);
      visning.liv('fiende', k.fiendeLiv, type.liv);
    };
    visning.aapne(spiller.navn, type.navn);
    visLiv();
    visning.si('Velg angrep.');

    let forrige = null;
    while (!k.utfall) {
      const valg = ANGREP.map((a) => ({ navn: a.navn, under: `${a.skade} skade` }));
      const angrep = ANGREP[await visning.velg(valg)];
      const trinn = oppgavetrinn(angrep, spiller.tilpasning.trinn);
      const oppgave = lagOppgave(trinn, Math.random, forrige);
      forrige = oppgave.tekst;
      const rett = (await oppgaverute.spor(oppgave, { topp: angrep.navn })) === 'rett';
      oppgaverute.skjul();
      spiller.tilpasning = oppdater(spiller.tilpasning, rett, MAKS_TRINN);
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
    await visning.vent(k.utfall === 'seier' ? 'Du vant!' : 'Du er utslitt og må hvile.');
    visning.skjul();
    this.scene.stop();
    ferdig(k);
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
