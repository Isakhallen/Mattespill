import { gulvnavn } from '../tegnKart.js';
import { angrepFor, skadeMot, vistSkade, virkning, hvilEtter, nyKamp, runde, teller } from '../kamp.js';
import { nivaa, maksLiv, skadeBonus } from '../vekst.js';
import { lagOppgave, MAKS_TRINN } from '../oppgaver.js';
import { oppdater } from '../tilpasning.js';
import { spill } from '../lyd.js';

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
    if (!this.textures.exists('gnist')) {
      const g = this.make.graphics({}, false);
      g.fillStyle(0xffffff).fillRect(0, 0, 2, 2).generateTexture('gnist', 2, 2).destroy();
    }
    this.kjor(d);
  }

  async kjor({ spiller, fiende, visning, oppgaverute, oppgjor, ferdig }) {
    const type = fiende.type;
    const maks = maksLiv(spiller);
    const n = nivaa(spiller.erfaring);
    const bonus = skadeBonus(spiller);
    let k = nyKamp(spiller.liv, fiende.liv, fiende.skade);
    let rette = 0;
    let hviler = {}; // angrep som hviler: { id: turer igjen }
    const visLiv = () => {
      visning.liv('helt', k.heltLiv, maks);
      visning.liv('fiende', k.fiendeLiv, fiende.maks);
    };
    visning.aapne(`${spiller.navn} · Nivå ${n}`, `${type.navn} · Nivå ${fiende.nivaa}`);
    visLiv();
    visning.si('Velg angrep.');

    let forrige = null;
    while (!k.utfall) {
      const trinn = spiller.tilpasning.trinn;
      const liste = angrepFor(n, trinn, bonus);
      const valg = liste.map((a) => ({
        navn: a.navn,
        under: hviler[a.id] ? `Hviler ${hviler[a.id]}` : `${vistSkade(a, type)} skade`,
        av: !!hviler[a.id],
      }));
      const angrep = liste[await visning.velg(valg)];
      const oppgave = lagOppgave(angrep.oppgavetrinn, Math.random, forrige);
      forrige = oppgave.tekst;
      const rett = (await oppgaverute.spor(oppgave, { topp: angrep.navn })) === 'rett';
      oppgaverute.skjul();
      if (rett) rette++;
      if (teller(angrep.oppgavetrinn, trinn, rett)) {
        spiller.tilpasning = oppdater(spiller.tilpasning, rett, MAKS_TRINN);
      }
      k = runde(k, { ...angrep, skade: skadeMot(angrep, type) }, rett);
      hviler = hvilEtter(hviler, angrep, rett);

      // Svakheten vises bare med et stort tall og en egen lyd. Skjold og det fienden tåler, gir et lite tall.
      const v = type.skjold && angrep.id === 'lett' ? 0.5 : virkning(angrep, type);
      await this.heltSlaar(angrep, rett, k.traff, v > 1 ? 'svak' : v < 1 ? 'preller' : null);
      const mitt = rett ? `Treff! −${k.traff}.` : 'Bom!';
      visning.si(mitt);
      visLiv();
      if (k.utfall === 'seier') break;

      await this.pause(PAUSE);
      await this.slag(this.fiende, this.helt, true, () => {
        spill(this, 'au');
        this.tall(this.helt, `−${k.slag}`, '#ff8a7a');
        if (type.boss) this.cameras.main.shake(200, 0.012);
      });
      visning.si(`${mitt} ${type.bestemt} slår: −${k.slag}.`);
      visLiv();
    }

    const tapte = k.utfall === 'seier' ? this.fiende : this.helt;
    this.tweens.add({ targets: tapte, alpha: 0, duration: 300 });
    for (const m of oppgjor({ ...k, rette })) {
      if (m.lyd) spill(this, m.lyd);
      await visning.vent(m.tekst);
    }
    visning.skjul();
    this.scene.stop();
    ferdig();
  }

  pause(ms) {
    return new Promise((los) => this.time.delayedCall(ms, los));
  }

  // Heltens slag. Typeangrep sender en lysende kule i sin farge. Tunge slag rister bildet.
  // «effekt» er 'svak' (dobbel skade), 'preller' (halv) eller null.
  async heltSlaar(angrep, rett, skade, effekt) {
    const fiende = this.fiende;
    if (!rett) {
      spill(this, 'bom');
      await this.slag(this.helt, fiende, false);
      this.tall(fiende, 'Bom', '#c9bfd0');
      return;
    }
    const tungt = angrep.id !== 'lett';
    const treff = () => {
      if (effekt === 'svak') {
        spill(this, 'svak');
        this.gnister(this.midt(fiende), angrep.farge ?? 0xfff0c0, 32);
        this.tall(fiende, `−${skade}!`, '#ff8af0', 22);
        this.cameras.main.shake(260, 0.016);
        return;
      }
      if (effekt === 'preller') {
        spill(this, 'preller');
        this.tall(fiende, `−${skade}`, '#9fb0c0', 10);
        return;
      }
      this.gnister(this.midt(fiende), angrep.farge ?? 0xfff0c0, tungt ? 16 : 8);
      this.tall(fiende, `−${skade}`, '#ffe08a');
      if (tungt) this.cameras.main.shake(180, angrep.type ? 0.006 : 0.012);
    };
    if (!angrep.type) {
      await this.slag(this.helt, fiende, true, () => {
        if (!effekt) spill(this, tungt ? 'tungt' : 'treff');
        treff();
      });
      return;
    }
    spill(this, 'magi');
    await this.trolldom(angrep.farge);
    fiende.setTintFill(angrep.farge);
    treff();
    await this.pause(140);
    fiende.clearTint();
  }

  // Midt på en figur.
  midt(f) {
    return { x: f.x, y: f.y - f.displayHeight / 2 };
  }

  // Et tall som spretter opp over figuren og blir borte.
  tall(hvem, tekst, farge, storrelse = 14) {
    const t = this.add
      .text(hvem.x, hvem.y - hvem.displayHeight, tekst, {
        fontFamily: '"Trebuchet MS", sans-serif',
        fontSize: `${storrelse}px`,
        fontStyle: 'bold',
        color: farge,
        stroke: '#1c1820',
        strokeThickness: 4,
        resolution: 4,
      })
      .setOrigin(0.5, 1);
    this.tweens.add({ targets: t, y: t.y - 16, duration: 260, ease: 'Back.easeOut' });
    this.tweens.add({ targets: t, alpha: 0, delay: 700, duration: 300, onComplete: () => t.destroy() });
  }

  gnister(p, farge, antall) {
    const e = this.add.particles(p.x, p.y, 'gnist', {
      speed: { min: 40, max: 110 },
      lifespan: 380,
      scale: { start: 2, end: 0 },
      tint: farge,
      blendMode: 'ADD',
      emitting: false,
    });
    e.explode(antall);
    this.time.delayedCall(450, () => e.destroy());
  }

  // Helten lyser, og en kule i angrepets farge flyr til fienden.
  trolldom(farge) {
    const fra = this.midt(this.helt);
    const til = this.midt(this.fiende);
    const ADD = Phaser.BlendModes.ADD;
    this.helt.setTint(farge);
    const ring = this.add.circle(fra.x, fra.y, 6, farge, 0.6).setBlendMode(ADD);
    this.tweens.add({ targets: ring, scale: 3, alpha: 0, duration: 320, onComplete: () => ring.destroy() });
    const glod = this.add.circle(fra.x + 10, fra.y, 8, farge, 0.45).setBlendMode(ADD);
    const kule = this.add.circle(fra.x + 10, fra.y, 3, 0xffffff).setBlendMode(ADD);
    const spor = this.add.particles(0, 0, 'gnist', {
      speed: 14,
      lifespan: 260,
      scale: { start: 1.5, end: 0 },
      tint: farge,
      blendMode: 'ADD',
      frequency: 15,
    });
    spor.startFollow(kule);
    return new Promise((los) => {
      this.tweens.add({
        targets: [glod, kule],
        x: til.x,
        y: til.y,
        delay: 160,
        duration: 280,
        ease: 'Quad.easeIn',
        onComplete: () => {
          this.helt.clearTint();
          for (const o of [glod, kule, spor]) o.destroy();
          los();
        },
      });
    });
  }

  // Den som slår, hopper fram og tilbake. Treff gir et hvitt blink, bom gir et hopp unna.
  // «vedTreff» kalles i det slaget treffer.
  slag(fra, til, traff, vedTreff) {
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
        onYoyo: () => {
          if (!traff) return;
          til.setTintFill(0xffffff);
          vedTreff?.();
        },
        onComplete: () => {
          til.clearTint();
          los();
        },
      });
    });
  }
}
