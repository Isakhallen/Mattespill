import { FIREBASE } from './data/firebase.js';

const MELLOM = 250; // ms mellom hver gang posisjonen sendes, høyst

// Kontakten med klassen i Firebase. Firebase lastes først når eleven blir med i en klasse,
// så uten kode snakker spillet aldri med Google. Eleven får en anonym bruker uten e-post.
// Hver elev er én rad under rom/KODE/kart/uid, og raden slettes når eleven går.
// «radene» har de andre på samme kart (uid → rad fra Firebase, ikke sjekket).
export function lagNettverk() {
  const radene = new Map();
  let fb = null; // { db, base, uid }
  let mitt = null; // min rad
  let slutt = []; // slutter å lytte
  let neste = null; // det som skal sendes
  let sendt = '';
  let klokke = null;
  let gang = 0; // et nytt bliMed gjør et gammelt som venter, ugyldig

  async function last() {
    if (fb) return fb;
    const [app, auth, db] = await Promise.all(
      ['app', 'auth', 'database'].map((f) => import(`../vendor/firebase/firebase-${f}.js`)),
    );
    const a = app.initializeApp(FIREBASE);
    const { user } = await auth.signInAnonymously(auth.getAuth(a));
    fb = { db, base: db.getDatabase(a), uid: user.uid };
    return fb;
  }

  function send() {
    const json = JSON.stringify(neste);
    if (!mitt || !neste || json === sendt) return;
    sendt = json;
    fb.db.set(mitt, neste).catch(() => {});
  }

  const nett = {
    radene,
    finnes: Boolean(FIREBASE),
    tilkoblet: false,

    // Blir med i klassen på dette kartet. Gir false hvis det ikke gikk (eller ikke kode).
    async bliMed(kode, kart, rad) {
      const denne = ++gang;
      await nett.forlat();
      neste = rad;
      if (!FIREBASE || !kode) return false;
      try {
        const { db, base, uid } = await last();
        if (denne !== gang) return false;
        const min = db.ref(base, `rom/${kode}/${kart}/${uid}`);
        await db.onDisconnect(min).remove();
        if (denne !== gang) return false;
        mitt = min;
        send();
        const rom = db.ref(base, `rom/${kode}/${kart}`);
        const sett = (s) => s.key !== uid && radene.set(s.key, s.val());
        slutt = [
          db.onChildAdded(rom, sett),
          db.onChildChanged(rom, sett),
          db.onChildRemoved(rom, (s) => radene.delete(s.key)),
          // Etter et brudd har Firebase slettet raden og glemt onDisconnect. Sett begge på nytt.
          db.onValue(db.ref(base, '.info/connected'), (s) => {
            nett.tilkoblet = s.val() === true;
            if (!nett.tilkoblet || mitt !== min) return;
            db.onDisconnect(min).remove().catch(() => {});
            sendt = '';
            send();
          }),
        ];
        klokke = setInterval(send, MELLOM);
        nett.tilkoblet = true;
        return true;
      } catch (e) {
        console.warn('Fikk ikke kontakt med klassen:', e);
        return false;
      }
    },

    // Det nyeste om helten. Sendes høyst hvert MELLOM ms, og bare hvis noe er endret.
    send(rad) {
      neste = rad;
    },

    async forlat() {
      for (const f of slutt) f();
      slutt = [];
      clearInterval(klokke);
      radene.clear();
      sendt = '';
      nett.tilkoblet = false;
      if (!mitt) return;
      const r = mitt;
      mitt = null;
      await fb.db.onDisconnect(r).cancel().catch(() => {});
      await fb.db.remove(r).catch(() => {});
    },
  };
  return nett;
}
