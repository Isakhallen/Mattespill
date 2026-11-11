// Tester «Spill med klassen» mot den ekte Firebase-databasen: to adskilte økter i skjult Edge
// med samme klassekode, styrt via CDP. Krever server: python -m http.server 8031. Kjør: node verktoy/klassetest.mjs
// Testradene slettes av seg selv når øktene lukkes.
import { spawn } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const URL0 = process.env.URL ?? 'http://localhost:8031'; // URL=https://… tester nettsiden
const PORT = 9333;
const vent = (ms) => new Promise((r) => setTimeout(r, ms));
const kode = 'TEST' + Math.floor(Math.random() * 9000 + 1000);

const edge = spawn(EDGE, ['--headless=new', '--mute-audio', `--user-data-dir=${mkdtempSync(join(tmpdir(), 'edge-'))}`,
  `--remote-debugging-port=${PORT}`, '--window-size=1280,720', 'about:blank'], { stdio: 'ignore' });
let info;
for (let i = 0; i < 50 && !info; i++) {
  await vent(200);
  info = await fetch(`http://127.0.0.1:${PORT}/json/version`).then((r) => r.json()).catch(() => null);
}
const ws = new WebSocket(info.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r));
let id = 0;
const venter = new Map();
ws.addEventListener('message', (e) => {
  const m = JSON.parse(e.data);
  if (m.id && venter.has(m.id)) venter.get(m.id)(m), venter.delete(m.id);
  if (m.method === 'Runtime.consoleAPICalled' && ['warning', 'error'].includes(m.params.type))
    console.log('KONSOLL', m.sessionId?.slice(0, 4), m.params.args.map((a) => a.value ?? a.description).join(' ').slice(0, 600));
  if (m.method === 'Runtime.exceptionThrown') console.log('UNNTAK', m.params.exceptionDetails.exception?.description?.slice(0, 600));
});
const cdp = (method, params = {}, sessionId) =>
  new Promise((r) => {
    venter.set(++id, (m) => (m.error ? (console.log('CDP-feil', method, m.error.message), r({})) : r(m.result)));
    ws.send(JSON.stringify({ id, method, params, sessionId }));
  });
const js = async (s, uttrykk) => {
  const r = await cdp('Runtime.evaluate', { expression: uttrykk, awaitPromise: true, returnByValue: true }, s);
  return r.exceptionDetails ? 'UNNTAK ' + r.exceptionDetails.exception?.description : r.result?.value;
};

async function okt(navn) {
  const { browserContextId } = await cdp('Target.createBrowserContext');
  const { targetId } = await cdp('Target.createTarget', { url: `${URL0}/stil.css`, browserContextId });
  const { sessionId } = await cdp('Target.attachToTarget', { targetId, flatten: true });
  await vent(1000);
  await cdp('Runtime.enable', {}, sessionId);
  console.log('økt', navn, sessionId.slice(0, 4));
  await js(sessionId, `localStorage.setItem('mattespill', JSON.stringify({ versjon: 1, klasse: 'kriger', folk: 'menneske', kart: 'verden', sett: ['verden'] }));
    localStorage.setItem('mattespill-nett', JSON.stringify({ navn: '${navn}', kode: '${kode}' }))`);
  await cdp('Page.navigate', { url: `${URL0}/` }, sessionId);
  return { targetId, sessionId };
}

const tilstand = `(() => { const V = spill.scene.getScene('Verden');
  return JSON.stringify({ knapp: document.querySelector('#status .klassen').textContent,
    lapper: [...document.querySelectorAll('.lapp')].map((l) => l.textContent + '/' + l.dataset.nivaa + (l.hidden ? '/skjult' : '')),
    andre: [...V.andre.values()].map((a) => a.x + ',' + a.y), meg: V.rute.x + ',' + V.rute.y }); })()`;

try {
  const A = await okt('Modige Ulv');
  const B = await okt('Kloke Ugle');
  await vent(12000);
  console.log('kode', kode);
  console.log('A', await js(A.sessionId, tilstand));
  console.log('B', await js(B.sessionId, tilstand));
  // A går ett steg.
  console.log('A går', await js(A.sessionId, `(() => { const V = spill.scene.getScene('Verden');
    const d = [[1,0],[-1,0],[0,1],[0,-1]].find(([x, y]) => !V.kart.vegg(V.rute.x + x, V.rute.y + y));
    V.vei = [{ x: V.rute.x + d[0], y: V.rute.y + d[1] }]; return (V.rute.x + d[0]) + ',' + (V.rute.y + d[1]); })()`));
  await vent(3000);
  console.log('B etter', await js(B.sessionId, tilstand));
  await js(B.sessionId, `document.querySelector('#status .klassen').click(); document.querySelector('#klasserom .alene').click()`);
  await vent(3000);
  console.log('A etter at B spiller alene', await js(A.sessionId, tilstand));
  console.log('B alene', await js(B.sessionId, tilstand));
  await js(B.sessionId, `document.querySelector('#status .klassen').click();
    document.querySelector('#klasserom .kode').value = '${kode.toLowerCase()}';
    document.querySelector('#klasserom form').requestSubmit()`);
  await vent(4000);
  console.log('A etter at B ble med igjen', await js(A.sessionId, tilstand));
  await cdp('Target.closeTarget', { targetId: A.targetId });
  await vent(6000);
  console.log('B etter at A lukket', await js(B.sessionId, tilstand));
} finally {
  edge.kill();
  process.exit(0);
}
