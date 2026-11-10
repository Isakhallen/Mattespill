import { gulvnavn } from '../tegnKart.js';
import { angrepFor, tingFor, motFiende, vistSkade, virkning, hvilEtter, nyKamp, runde, teller, PAA_HELT } from '../kamp.js';
import { verdi } from '../angrepsbok.js';
import { lagMerker, merkeFor } from '../merker.js';
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
    lagMerker(this);
    this.merker = [];
    this.kjor(d);
  }

  async kjor({ spiller, fiende, visning, oppgaverute, oppgjor, ferdig }) {
    const type = fiende.type;
    const maks = maksLiv(spiller);
    const n = nivaa(spiller.erfaring);
    const bonus = skadeBonus(spiller);
    let k = nyKamp(spiller.liv, fiende.liv, fiende.skade, maks);
    let rette = 0;
    let hviler = {}; // angrep som hviler: { id: turer igjen }
    const visLiv = (helt = k.heltLiv, mot = k.fiendeLiv) => {
      visning.liv('helt', helt, maks);
      visning.liv('fiende', mot, fiende.maks);
    };
    visning.aapne(`${spiller.navn} · Nivå ${n}`, `${type.navn} · Nivå ${fiende.nivaa}`);
    visLiv();
    visning.si('Velg angrep.');

    let forrige = null;
    while (!k.utfall) {
      const trinn = spiller.tilpasning.trinn;
      const liste = angrepFor(n, trinn, bonus, spiller.angrep);
      const valg = liste.map((a) => {
        const full = a.heler && k.heltLiv >= maks;
        const under = hviler[a.id] ? `Hviler ${hviler[a.id]}` : full ? 'Fullt liv' : verdi({ ...a, skade: vistSkade(a, type) });
        return { navn: a.navn, under, merke: merkeFor(a), av: !!hviler[a.id] || full };
      });
      const ting = tingFor(spiller, bonus, maks);
      const i = await visning.velg(valg, ting.length ? 'Ting' : null);
      let angrep;
      let rett = true; // ting virker alltid
      if (i < 0) {
        // En drikk eller bombe: ingen oppgave, men fienden slår.
        angrep = await this.velgTing(visning, ting, k.heltLiv >= maks);
        if (!angrep) {
          visning.si('Velg angrep.');
          continue;
        }
        spiller.ting[angrep.id]--;
      } else {
        angrep = liste[i];
        const oppgave = lagOppgave(angrep.oppgavetrinn, Math.random, forrige);
        forrige = oppgave.tekst;
        rett = (await oppgaverute.spor(oppgave, { topp: angrep.navn })) === 'rett';
        oppgaverute.skjul();
        if (rett) rette++;
        if (teller(angrep.oppgavetrinn, trinn, rett)) {
          spiller.tilpasning = oppdater(spiller.tilpasning, rett, MAKS_TRINN);
        }
      }
      k = runde(k, motFiende(angrep, type), rett);
      hviler = hvilEtter(hviler, angrep, rett);

      // Svakheten vises bare med et stort tall og en egen lyd. Skjold og det fienden tåler, gir et lite tall.
      const v = type.skjold && angrep.id === 'lett' ? 0.5 : virkning(angrep, type);
      await this.heltSlaar(angrep, rett, k, v > 1 ? 'svak' : v < 1 ? 'preller' : null);
      this.visMerker(k.aktive);
      const liv = k.heling ? ` +${k.heling} liv.` : '';
      const mitt = !rett ? 'Bom!' : angrep.selv ? (angrep.heler ? liv.trim() : 'Skjold!') : `Treff! −${k.traff}.${liv}`;
      visning.si(mitt);
      let fiendeLiv = k.mellom.fiendeLiv;
      visLiv(k.mellom.heltLiv, fiendeLiv);

      // Gift og brann skader fienden hver tur.
      for (const p of k.prikker) {
        await this.pause(320);
        fiendeLiv = Math.max(0, fiendeLiv - p.skade);
        this.prikk(p);
        visLiv(k.mellom.heltLiv, fiendeLiv);
      }
      if (k.utfall === 'seier') break;

      await this.pause(PAUSE);
      if (k.frosset) {
        this.fiende.setTint(0x9fd8ff);
        this.tweens.add({ targets: this.fiende, x: this.fiende.x + 2, duration: 50, yoyo: true, repeat: 3 });
        await this.pause(400);
        this.fiende.clearTint();
        visning.si(`${mitt} ${type.bestemt} er frosset.`);
      } else {
        await this.slag(this.fiende, this.helt, true, () => {
          spill(this, 'au');
          this.tall(this.helt, `−${k.slag}`, '#ff8a7a');
          if (type.boss) this.cameras.main.shake(200, 0.012);
        });
        visning.si(`${mitt} ${type.bestemt} slår: −${k.slag}.`);
      }
      visLiv();
      this.visMerker(Object.keys(k.merker));
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

  // Knappene for tingene og Tilbake. Gir tingen eller null.
  async velgTing(visning, ting, fullt) {
    visning.si('Velg en ting.');
    const valg = ting.map((t) => ({
      navn: t.navn,
      under: `${t.heler ? 'Fullt liv' : `${t.skade} skade`} · ×${t.antall}`,
      av: t.heler && fullt,
    }));
    return ting[await visning.velg([...valg, { navn: 'Tilbake' }])] ?? null;
  }

  pause(ms) {
    return new Promise((los) => this.time.delayedCall(ms, los));
  }

  // Merkene over figurene: skjold over helten, resten over fienden.
  visMerker(navn) {
    for (const m of this.merker) m.destroy();
    const over = (f, liste) =>
      liste.map((m, i) =>
        this.add
          .image(f.x + (i - (liste.length - 1) / 2) * 20, f.y - f.displayHeight - 2, `merke_${m}`)
          .setOrigin(0.5, 1)
          .setScale(S),
      );
    this.merker = [
      ...over(this.helt, navn.filter((m) => PAA_HELT.includes(m))),
      ...over(this.fiende, navn.filter((m) => !PAA_HELT.includes(m))),
    ];
  }

  // Gift eller brann skader fienden.
  prikk(p) {
    const farge = p.navn === 'gift' ? 0x7ad04a : 0xff8a2a;
    spill(this, 'treff');
    this.gnister(this.midt(this.fiende), farge, 10);
    this.tall(this.fiende, `−${p.skade}`, `#${farge.toString(16)}`, 12);
  }

  // Helten lyser og får liv eller skjold.
  async selv(angrep, k) {
    spill(this, angrep.heler ? 'drikk' : 'magi');
    this.helt.setTintFill(angrep.farge);
    this.gnister(this.midt(this.helt), angrep.farge, 18);
    if (k.heling) this.tall(this.helt, `+${k.heling}`, '#8af0a0');
    await this.pause(260);
    this.helt.clearTint();
  }

  // Heltens slag. Typeangrep sender en lysende kule i sin farge. Tunge slag rister bildet.
  // «effekt» er 'svak' (dobbel skade), 'preller' (halv) eller null.
  async heltSlaar(angrep, rett, k, effekt) {
    const fiende = this.fiende;
    const skade = k.traff;
    if (rett && angrep.selv) return this.selv(angrep, k);
    if (!rett) {
      spill(this, 'bom');
      await this.slag(this.helt, fiende, false);
      this.tall(fiende, 'Bom', '#c9bfd0');
      return;
    }
    const tungt = angrep.id !== 'lett';
    const treff = () => {
      if (k.heling) this.tall(this.helt, `+${k.heling}`, '#8af0a0');
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
    if (!angrep.type && !angrep.kast) {
      await this.slag(this.helt, fiende, true, () => {
        if (!effekt) spill(this, tungt ? 'tungt' : 'treff');
        treff();
      });
      return;
    }
    // Typeangrep og bomber flyr som en kule.
    if (!angrep.kast) spill(this, 'magi');
    await this.trolldom(angrep.farge);
    if (angrep.kast) spill(this, 'bombe');
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
