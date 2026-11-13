import * as THREE from 'three';
import { GLTFLoader } from './vendor/loaders/GLTFLoader.js';

/* ───────── helpers ───────── */
const $ = id => document.getElementById(id);
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const wrap = a => { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a; };
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const fmt = t => { if (t == null) return '—'; const m = Math.floor(t / 60), s = t - m * 60; return m + ':' + (s < 10 ? '0' : '') + s.toFixed(3); };
const chip = d => d.c1 === '#19191f' ? d.c2 : d.c1;
const ord = n => n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th';

/* ───────── data: drivers (all original) ───────── */
const DRIVERS = [
  { id: 'val', name: 'Rio Valente', tla: 'VAL', num: 7, team: 'Vulcano Corse', c1: '#d3151b', c2: '#ffd23f', speed: 5, turn: 3, quote: 'Brakes late, apologises later. The crowd favourite with a lava-red right foot.' },
  { id: 'dem', name: 'Elif Demir', tla: 'DEM', num: 34, team: 'Bosphorus Racing', c1: '#11b5b0', c2: '#f4f1e8', speed: 4, turn: 4, quote: 'Ice-calm strategist from Istanbul. Never the fastest on Friday, always there on Sunday.' },
  { id: 'sto', name: 'Mika Storm', tla: 'STO', num: 12, team: 'Polar Works', c1: '#7fd6ff', c2: '#0c2a52', speed: 3, turn: 5, quote: 'Grew up rallying on frozen lakes. Treats every apex like a personal insult.' },
  { id: 'oko', name: 'Zara Okoye', tla: 'OKO', num: 99, team: 'Solaris GP', c1: '#ffb400', c2: '#1b1b1f', speed: 5, turn: 3, quote: 'Fastest in a straight line by a mile. Corners are, in her words, "admin".' },
  { id: 'ara', name: 'Kenji Arata', tla: 'ARA', num: 23, team: 'Kitsune Motors', c1: '#ff6a13', c2: '#ffffff', speed: 4, turn: 4, quote: 'Sim-racing prodigy turned real-world menace. Talks to his tyres. They answer.' },
  { id: 'fis', name: 'Lena Fischer', tla: 'FIS', num: 5, team: 'Nordstern', c1: '#c9ced6', c2: '#00d2be', speed: 4.5, turn: 3.5, quote: 'Engineer first, driver second. Has already calculated how this race ends.' },
  { id: 'had', name: 'Tom Hadley', tla: 'HAD', num: 44, team: 'Bulldog Motorsport', c1: '#0f5c3a', c2: '#e8c96a', speed: 3.5, turn: 4.5, quote: 'Old-school racer in racing green. Defends a position like it owes him money.' },
  { id: 'lun', name: 'Diego Luna', tla: 'LUN', num: 81, team: 'Aztec Speed', c1: '#c2188f', c2: '#35e08a', speed: 4.5, turn: 3.5, quote: 'Showman. Will absolutely attempt the overtake you think is impossible.' },
  { id: 'che', name: 'Aria Chen', tla: 'CHE', num: 18, team: 'Dragonfly Racing', c1: '#18a558', c2: '#d7ff3f', speed: 3, turn: 5, quote: 'Smooth, precise, unnervingly polite. You only notice her when she is already past.' },
  { id: 'cos', name: 'Bruno Costa', tla: 'COS', num: 10, team: 'Samba Autosport', c1: '#ffe14a', c2: '#1d7a3e', speed: 4, turn: 4, quote: 'Sings on the radio. Sideways through every corner, grinning the whole time.' },
  { id: 'bla', name: 'Ivy Blackwood', tla: 'BLA', num: 66, team: 'Midnight Syndicate', c1: '#19191f', c2: '#ff3fa4', speed: 4.5, turn: 3.5, quote: 'Nobody knows who funds the team. Nobody asks. Devastating in the dark.' },
  { id: 'lin', name: 'Oskar Lind', tla: 'LIN', num: 3, team: 'Viking Grand Prix', c1: '#1e3a8a', c2: '#f2c14e', speed: 3.5, turn: 4.5, quote: 'Rookie giant who barely fits in the cockpit. Fearless, mostly because he is new.' },
];

/* ───────── data: circuits (all original, polar radii → closed spline) ───────── */
const TRACKS = [
  { id: 'porto', name: 'Porto Azzurro', sub: 'Harbour street circuit', r: [300, 330, 290, 170, 150, 260, 330, 300, 180, 170, 290, 330, 310, 200, 230, 300], sx: 1.25, sz: .9,
    th: { skyTop: '#2a7fd6', skyBot: '#bfe6ff', fog: '#bfe6ff', fogFar: 1300, ground: '#3f9a4a', ground2: '#368a41', sun: 1.25, hemi: 1.0, tree: 'palm', buildings: true, bCol: ['#f4e3c1', '#f0b98a', '#e9d5d0', '#cfe3f0'] } },
  { id: 'silver', name: 'Silverwood', sub: 'Flat-out forest blast', r: [320, 340, 320, 250, 290, 345, 330, 220, 250, 330, 340, 260], sx: 1.3, sz: .85,
    th: { skyTop: '#4b8fd0', skyBot: '#dbeaf2', fog: '#d3e4ea', fogFar: 1100, ground: '#2f7a3a', ground2: '#28692f', sun: 1.1, hemi: 1.0, tree: 'pine', buildings: false } },
  { id: 'dune', name: 'Dune Ring', sub: 'Desert sunset chicanes', r: [300, 235, 315, 205, 300, 195, 310, 225, 325, 220, 300, 190, 290, 210, 315, 235], sx: 1.15, sz: 1,
    th: { skyTop: '#3b2a6b', skyBot: '#ff9e5e', fog: '#f0a070', fogFar: 1200, ground: '#d9a55c', ground2: '#c8924c', sun: 1.15, sunCol: '#ffcf9a', hemi: .95, tree: 'cactus', buildings: false } },
  { id: 'sakura', name: 'Sakura Park', sub: 'Blossom-lined hairpins', r: [280, 310, 330, 300, 160, 130, 150, 300, 330, 310, 180, 300, 330, 200, 170, 260], sx: 1, sz: 1.15,
    th: { skyTop: '#6a8fd8', skyBot: '#ffd9ec', fog: '#f6d6e6', fogFar: 1100, ground: '#58a35a', ground2: '#4c944f', sun: 1.15, hemi: 1.05, tree: 'sakura', buildings: false } },
  { id: 'polar', name: 'Polar Night', sub: 'Snow, ice and aurora', r: [330, 280, 180, 290, 340, 330, 200, 150, 190, 320, 340, 230], sx: 1.2, sz: .95,
    th: { skyTop: '#050a24', skyBot: '#1f5a6e', fog: '#16384a', fogFar: 900, ground: '#dfe9f2', ground2: '#c9d7e4', sun: .7, sunCol: '#bcd6ff', hemi: 1.05, tree: 'snowpine', buildings: false, night: true } },
  { id: 'neon', name: 'Neon Bay', sub: 'Night race downtown', r: [260, 320, 330, 200, 170, 300, 330, 320, 180, 150, 170, 310, 330, 200, 190, 180, 300, 310], sx: 1.15, sz: 1,
    th: { skyTop: '#06051a', skyBot: '#3a1d5c', fog: '#1e1338', fogFar: 950, ground: '#23252e', ground2: '#1c1e26', sun: .65, sunCol: '#c9b8ff', hemi: 1.15, tree: 'none', buildings: true, bCol: ['#2a2d45', '#1f2238', '#33294f', '#252b3d'], night: true } },
];
const TREES = {
  pine: { trunkH: 3, trunkCol: '#5b3d24', fol: 'cone', fs: [4.2, 11, 4.2], col: ['#1f6a34', '#255f2c', '#2f7a3a'] },
  snowpine: { trunkH: 3, trunkCol: '#4a3526', fol: 'cone', fs: [4.2, 11, 4.2], col: ['#e9f2f8', '#cfe0ea', '#9fc2c9'] },
  sakura: { trunkH: 4.5, trunkCol: '#4b2e2a', fol: 'sphere', fs: [5.5, 4.2, 5.5], col: ['#ffb7d5', '#ff9cc4', '#ffd0e4'] },
  palm: { trunkH: 9, trunkCol: '#8a6a45', fol: 'sphere', fs: [4.6, 1.3, 4.6], col: ['#2f9a4a', '#3aa655'] },
  cactus: { trunkH: 0, trunkCol: '#000', fol: 'cyl', fs: [1.1, 6, 1.1], col: ['#3f8a4a', '#4f9a55', '#8a6a45'] },
};

const W = 18, HALF = W / 2, WALL = HALF + 10, LIMIT = HALF + 8.4;
const VMAX = 62, ACC = 30, BRK = 58, KMH = 5.2, LAPS = 3;
const POINTS = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1, 0, 0];
const ITEMS = {
  ers: { icon: '⚡', name: 'ERS BOOST' },
  oil: { icon: '🛢️', name: 'OIL SLICK' },
  tyre: { icon: '🛞', name: 'LOOSE TYRE' },
  shield: { icon: '🛡️', name: 'SHIELD' },
  flag: { icon: '🟨', name: 'YELLOW FLAG' },
};

/* ───────── renderer ───────── */
const canvas = $('game');
let renderer;
try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' }); }
catch (e) { document.body.insertAdjacentHTML('beforeend', '<div id="err">This game needs WebGL, and this browser could not create a WebGL context. Try Chrome, or enable WebGL in Safari (Settings → Advanced → Feature Flags).</div>'); throw e; }
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(64, 1, .5, 2200);
const hemi = new THREE.HemisphereLight(0xffffff, 0x445544, 1); scene.add(hemi);
const sun = new THREE.DirectionalLight(0xffffff, 1.2); sun.position.set(120, 260, 80); scene.add(sun);
function resize() { const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
addEventListener('resize', resize); resize();

/* ───────── canvas textures ───────── */
function tex(w, h, draw, rep) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; if (rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; } return t; }
function speckle(g, w, h, cols, n, s = 2) { for (let i = 0; i < n; i++) { g.fillStyle = pick(cols); g.fillRect(Math.random() * w, Math.random() * h, s, s); } }
const roadTex = tex(256, 256, (g, w, h) => { g.fillStyle = '#2c2e35'; g.fillRect(0, 0, w, h); speckle(g, w, h, ['#33363e', '#25272d', '#3a3d46'], 2600); g.fillStyle = '#eef0f3'; g.fillRect(6, 0, 7, h); g.fillRect(w - 13, 0, 7, h); g.fillStyle = 'rgba(255,255,255,.5)'; g.fillRect(w / 2 - 2, 0, 4, h * .45); }, true);
const kerbTex = tex(16, 64, (g, w, h) => { g.fillStyle = '#e8e8ea'; g.fillRect(0, 0, w, h); g.fillStyle = '#d5121a'; g.fillRect(0, 0, w, h / 2); }, true);
const wallTex = tex(1024, 64, (g, w, h) => {
  const ads = [['APEX', '#e10600', '#fff'], ['VOLTA', '#101216', '#ffd23f'], ['NIMBUS', '#f3f4f8', '#1e3a8a'], ['KOMET', '#1e3a8a', '#fff'], ['ZEST', '#35e08a', '#06250f'], ['ORBIT', '#101216', '#ff3fa4'], ['HALO', '#ffd23f', '#111'], ['PULSE', '#b46bff', '#fff']];
  const bw = w / ads.length; g.font = 'italic 900 40px Arial Black, Arial'; g.textAlign = 'center'; g.textBaseline = 'middle';
  ads.forEach((a, i) => { g.fillStyle = a[1]; g.fillRect(i * bw, 0, bw, h); g.fillStyle = a[2]; g.fillText(a[0], i * bw + bw / 2, h / 2 + 2); });
  g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(0, h - 5, w, 5);
}, true);
const checkTex = tex(128, 16, (g, w, h) => { for (let x = 0; x < 16; x++) for (let y = 0; y < 2; y++) { g.fillStyle = (x + y) % 2 ? '#111' : '#fff'; g.fillRect(x * 8, y * 8, 8, 8); } });
const crowdTex = tex(256, 64, (g, w, h) => { g.fillStyle = '#2a2d3a'; g.fillRect(0, 0, w, h); speckle(g, w, h, ['#e10600', '#ffd23f', '#f3f4f8', '#39a8ff', '#35e08a', '#ff8a1f', '#ff3fa4', '#222'], 1600, 4); }, true);
const winTex = tex(64, 128, (g, w, h) => { g.fillStyle = '#000'; g.fillRect(0, 0, w, h); for (let y = 4; y < h; y += 12) for (let x = 4; x < w; x += 10) { g.fillStyle = Math.random() < .55 ? pick(['#ffe9a8', '#fff4d0', '#9fd8ff', '#ff9bd3']) : '#11131c'; g.fillRect(x, y, 6, 7); } }, true);
const dayWinTex = tex(64, 128, (g, w, h) => { g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); for (let y = 5; y < h; y += 14) for (let x = 5; x < w; x += 12) { g.fillStyle = pick(['#5d7f9c', '#6f93b0', '#4c6a85']); g.fillRect(x, y, 7, 8); } g.fillStyle = '#c9744a'; g.fillRect(0, 0, w, 4); }, true);
const qTex = tex(64, 64, (g, w, h) => { const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#ffd23f'); gr.addColorStop(1, '#ff6a13'); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.strokeStyle = '#fff'; g.lineWidth = 5; g.strokeRect(3, 3, w - 6, h - 6); g.fillStyle = '#111'; g.font = '900 44px Arial Black, Arial'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('?', w / 2, h / 2 + 3); });

/* ───────── track ───────── */
let T = null, world = null;
function buildTrackData(def) {
  const pts = def.r.map((r, i) => { const a = i / def.r.length * Math.PI * 2; return new THREE.Vector3(Math.cos(a) * r * def.sx, 0, Math.sin(a) * r * def.sz); });
  const curve = new THREE.CatmullRomCurve3(pts, true, 'centripetal');
  const len = curve.getLength(), n = Math.round(len / 3), ds = len / n;
  const sp = curve.getSpacedPoints(n);
  const t = { def, n, ds, len, px: new Float32Array(n), pz: new Float32Array(n), tx: new Float32Array(n), tz: new Float32Array(n), nx: new Float32Array(n), nz: new Float32Array(n), k: new Float32Array(n), vc: new Float32Array(n) };
  for (let i = 0; i < n; i++) { t.px[i] = sp[i].x; t.pz[i] = sp[i].z; }
  for (let i = 0; i < n; i++) { const a = (i + n - 1) % n, b = (i + 1) % n; let dx = t.px[b] - t.px[a], dz = t.pz[b] - t.pz[a]; const l = Math.hypot(dx, dz); dx /= l; dz /= l; t.tx[i] = dx; t.tz[i] = dz; t.nx[i] = dz; t.nz[i] = -dx; }
  const raw = new Float32Array(n);
  for (let i = 0; i < n; i++) { const a = (i + n - 2) % n, b = (i + 2) % n; raw[i] = wrap(Math.atan2(t.tx[b], t.tz[b]) - Math.atan2(t.tx[a], t.tz[a])) / (4 * ds); }
  for (let i = 0; i < n; i++) { let s = 0; for (let j = -3; j <= 3; j++) s += raw[(i + j + n) % n]; t.k[i] = s / 7; const R = 1 / Math.max(Math.abs(t.k[i]), 1e-4); t.vc[i] = Math.min(200, (-.42 + Math.sqrt(.1764 + .0244 * R)) / .0122); }
  let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (let i = 0; i < n; i++) { x0 = Math.min(x0, t.px[i]); x1 = Math.max(x1, t.px[i]); z0 = Math.min(z0, t.pz[i]); z1 = Math.max(z1, t.pz[i]); }
  t.box = { x0, x1, z0, z1 };
  return t;
}
function at(i, lat, out) { i = ((i % T.n) + T.n) % T.n; out.x = T.px[i] + T.nx[i] * lat; out.z = T.pz[i] + T.nz[i] * lat; return out; }
function ribbon(latA, latB, y, vLen, filter) {
  const n = T.n, pos = [], uv = [], nor = [], idx = [];
  for (let i = 0; i <= n; i++) { const j = i % n; pos.push(T.px[j] + T.nx[j] * latA, y, T.pz[j] + T.nz[j] * latA, T.px[j] + T.nx[j] * latB, y, T.pz[j] + T.nz[j] * latB); uv.push(0, i * T.ds / vLen, 1, i * T.ds / vLen); nor.push(0, 1, 0, 0, 1, 0); if (i < n && (!filter || filter(j))) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setIndex(idx); return g;
}
function wallGeo(lat, h, uLen) {
  const n = T.n, pos = [], uv = [], idx = [];
  for (let i = 0; i <= n; i++) { const j = i % n, x = T.px[j] + T.nx[j] * lat, z = T.pz[j] + T.nz[j] * lat; pos.push(x, 0, z, x, h, z); uv.push(i * T.ds / uLen, 0, i * T.ds / uLen, 1); if (i < n) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals(); return g;
}
function distToTrack(x, z) { let b = 1e18; for (let i = 0; i < T.n; i += 3) { const dx = x - T.px[i], dz = z - T.pz[i], d = dx * dx + dz * dz; if (d < b) b = d; } return Math.sqrt(b); }
const flat = (m, order) => { m.depthWrite = false; m._order = order; return m; };
function addFlat(geo, mat) { const m = new THREE.Mesh(geo, mat); m.renderOrder = mat._order; m.frustumCulled = false; world.add(m); return m; }

let gantryLights = [], boxes = [], skyDome = null, crowd = [];
/* sky painted onto a dome so clouds, sun and stars stay put in the world */
function paintSky(g, w, h, def) {
  const th = def.th, hz = h / 2; const gr = g.createLinearGradient(0, 0, 0, hz); gr.addColorStop(0, th.skyTop); gr.addColorStop(1, th.skyBot); g.fillStyle = gr; g.fillRect(0, 0, w, hz); g.fillStyle = th.skyBot; g.fillRect(0, hz, w, hz);
  const blob = (x, y, r, c) => { const rg = g.createRadialGradient(x, y, 0, x, y, r); rg.addColorStop(0, c); rg.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = rg; g.fillRect(x - r, y - r, r * 2, r * 2); };
  if (th.night) {
    for (let i = 0; i < 900; i++) { g.fillStyle = 'rgba(255,255,255,' + rnd(.25, .95) + ')'; const s = Math.random() < .06 ? 2 : 1; g.fillRect(Math.random() * w, Math.random() * hz * .92, s, s); }
    const mx = w * .3, my = hz * .42; blob(mx, my, 130, 'rgba(210,225,255,.35)'); g.fillStyle = '#eef3ff'; g.beginPath(); g.arc(mx, my, 34, 0, 7); g.fill(); g.fillStyle = 'rgba(160,175,210,.5)'; g.beginPath(); g.arc(mx - 10, my - 6, 7, 0, 7); g.arc(mx + 12, my + 9, 5, 0, 7); g.fill();
    if (def.id === 'polar') { for (let k = 0; k < 3; k++) { for (let x = 0; x < w; x += 4) { const y0 = hz * (.3 + k * .14) + Math.sin(x * .006 + k * 2) * 46 + Math.sin(x * .021 + k) * 16, len = 110 + Math.sin(x * .013 + k * 3) * 50; const ag = g.createLinearGradient(0, y0 - len, 0, y0); ag.addColorStop(0, 'rgba(120,90,255,0)'); ag.addColorStop(.6, 'rgba(70,255,170,.16)'); ag.addColorStop(1, 'rgba(70,255,170,0)'); g.fillStyle = ag; g.fillRect(x, y0 - len, 4, len); } } }
    else { const cg = g.createLinearGradient(0, hz * .7, 0, hz); cg.addColorStop(0, 'rgba(255,80,190,0)'); cg.addColorStop(1, 'rgba(255,80,190,.28)'); g.fillStyle = cg; g.fillRect(0, hz * .7, w, hz * .3); }
    return;
  }
  const sunset = def.id === 'dune', sx = w * .28, sy = sunset ? hz * .86 : hz * .34;
  blob(sx, sy, sunset ? 420 : 300, sunset ? 'rgba(255,214,140,.75)' : 'rgba(255,255,240,.6)'); g.fillStyle = sunset ? '#fff0c0' : '#ffffff'; g.beginPath(); g.arc(sx, sy, sunset ? 58 : 36, 0, 7); g.fill();
  const cc = sunset ? ['rgba(255,190,150,.5)', 'rgba(255,150,130,.4)'] : def.id === 'sakura' ? ['rgba(255,255,255,.6)', 'rgba(255,225,238,.5)'] : ['rgba(255,255,255,.7)', 'rgba(255,255,255,.5)'];
  for (let i = 0; i < 46; i++) { const cx = Math.random() * w, cy = hz * rnd(.38, .9), n = 5 + Math.floor(Math.random() * 6), sc = rnd(.6, 1.5) * (1.3 - cy / hz * .6); for (let k = 0; k < n; k++) { const r = rnd(26, 60) * sc; blob(cx + rnd(-90, 90) * sc, cy + rnd(-10, 10) * sc, r, pick(cc)); if (cx < 160) blob(cx + w + rnd(-90, 90) * sc, cy, r, pick(cc)); } }
}
/* stepped grandstand with roof, flags and an instanced crowd that bounces in three waves */
const stepMat = new THREE.MeshLambertMaterial({ color: '#9aa1b0' }), standSide = new THREE.MeshLambertMaterial({ color: '#2a2e3b' }), poleMat = new THREE.MeshLambertMaterial({ color: '#d9dde6' });
const bodyGeo = new THREE.BoxGeometry(.52, .78, .34).translate(0, .39, 0), headGeo = new THREE.SphereGeometry(.2, 7, 5).translate(0, .98, 0), armGeo = new THREE.BoxGeometry(.72, .13, .13).translate(0, .92, 0);
const SHIRTS = ['#e10600', '#ffd23f', '#f3f4f8', '#39a8ff', '#35e08a', '#ff8a1f', '#ff3fa4', '#1e3a8a', '#11b5b0', '#b46bff', '#222632'], SKIN = ['#f2c9a5', '#e0ac7e', '#c68a5c', '#8d5a3c', '#5c3a26', '#f7d9bf'];
function makeStand(width, th) {
  const g = new THREE.Group(), rows = 8, rise = .85, deep = 1.25, night = th.night;
  for (let r = 0; r < rows; r++) { const s = new THREE.Mesh(new THREE.BoxGeometry(width, 1.4 + r * rise, deep), stepMat); s.position.set(0, (1.4 + r * rise) / 2, 4.4 - r * deep); g.add(s); }
  const backZ = 4.4 - rows * deep, topY = 1.4 + rows * rise;
  const back = new THREE.Mesh(new THREE.BoxGeometry(width, topY + 3.2, .5), standSide); back.position.set(0, (topY + 3.2) / 2, backZ + .2); g.add(back);
  for (const sx of [-1, 1]) { const side = new THREE.Mesh(new THREE.BoxGeometry(.4, 1.5, rows * deep + 1), standSide); side.position.set(sx * (width / 2 + .2), .75, 4.4 - rows * deep / 2 + .3); g.add(side); }
  const fm = new THREE.MeshBasicMaterial({ map: wallTex, color: night ? '#9aa0c0' : '#ffffff' }); const fascia = new THREE.Mesh(new THREE.PlaneGeometry(width, 1.4), fm); fascia.position.set(0, .7, 5.04); g.add(fascia);
  const roofCol = pick(['#e10600', '#f3f4f8', '#1e3a8a', '#ffd23f']), roof = new THREE.Mesh(new THREE.BoxGeometry(width + 2, .35, rows * deep + 4.5), new THREE.MeshLambertMaterial({ color: roofCol })); roof.position.set(0, topY + 3.6, 4.4 - rows * deep / 2 + 1.6); roof.rotation.x = .1; g.add(roof);
  for (let x = -width / 2 + 1; x <= width / 2 - .9; x += (width - 2) / 4) { const p = new THREE.Mesh(new THREE.CylinderGeometry(.14, .14, topY + 3.4, 6), poleMat); p.position.set(x, (topY + 3.4) / 2, backZ + .9); g.add(p);
    const fp = new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, 4, 5), poleMat); fp.position.set(x, topY + 5.6, backZ + .6); g.add(fp); const fl = new THREE.Mesh(new THREE.PlaneGeometry(2, 1.1), new THREE.MeshBasicMaterial({ color: pick(SHIRTS), side: THREE.DoubleSide })); fl.position.set(x + 1.05, topY + 6.9, backZ + .6); g.add(fl); crowd.push({ o: fl, flag: true, ph: Math.random() * 6 }); }
  if (night) for (let x = -width / 2 + 3; x < width / 2; x += 7) { const l = new THREE.Mesh(new THREE.BoxGeometry(2.4, .2, .5), new THREE.MeshBasicMaterial({ color: '#fff3cf' })); l.position.set(x, topY + 3.3, 4.6); g.add(l); }
  // people
  const seats = []; for (let r = 0; r < rows; r++) for (let x = -width / 2 + .6; x < width / 2 - .5; x += .82) if (Math.random() < .93) seats.push([x + rnd(-.08, .08), 1.4 + r * rise, 4.4 - r * deep + rnd(-.1, .15)]);
  const dm = new THREE.Object3D(), c = new THREE.Color(), lit = night ? .8 : 1;
  for (let wave = 0; wave < 3; wave++) { const mine = seats.filter((_, i) => i % 3 === wave), grp = new THREE.Group();
    const bodies = new THREE.InstancedMesh(bodyGeo, new THREE.MeshLambertMaterial(), mine.length), heads = new THREE.InstancedMesh(headGeo, new THREE.MeshLambertMaterial(), mine.length), arms = new THREE.InstancedMesh(armGeo, new THREE.MeshLambertMaterial(), mine.length);
    mine.forEach(([x, y, z], i) => { const sc = rnd(.88, 1.12); dm.position.set(x, y, z); dm.scale.set(sc, sc, sc); dm.rotation.set(0, rnd(-.3, .3), 0); dm.updateMatrix(); bodies.setMatrixAt(i, dm.matrix); heads.setMatrixAt(i, dm.matrix); const up = Math.random() < .3; dm.rotation.z = up ? rnd(-.5, .5) : 0; dm.position.y = y + (up ? .22 * sc : -.25 * sc); dm.updateMatrix(); arms.setMatrixAt(i, dm.matrix);
      const shirt = pick(SHIRTS); bodies.setColorAt(i, c.set(shirt).multiplyScalar(lit)); arms.setColorAt(i, c.set(shirt).multiplyScalar(lit)); heads.setColorAt(i, c.set(Math.random() < .25 ? pick(SHIRTS) : pick(SKIN)).multiplyScalar(lit)); });
    grp.add(bodies, heads, arms); g.add(grp); crowd.push({ o: grp, ph: wave * 2.1 + Math.random(), sp: rnd(5, 7) }); }
  return g;
}
/* Meshy scenery models, normalised to height 1 with the base on the ground */
const propCache = {};
function loadProp(name) {
  if (propCache[name]) return propCache[name];
  return propCache[name] = track(new Promise(res => {
    const to = setTimeout(() => res(null), 20000);
    new GLTFLoader().load('./models/' + name + '.glb', gltf => {
      clearTimeout(to); const sc = gltf.scene; sc.updateMatrixWorld(true); const box = new THREE.Box3().setFromObject(sc), size = box.getSize(new THREE.Vector3()), cen = box.getCenter(new THREE.Vector3()), parts = [];
      sc.traverse(o => { if (!o.isMesh) return; const geo = o.geometry.clone().applyMatrix4(o.matrixWorld); geo.translate(-cen.x, -box.min.y, -cen.z); geo.scale(1 / size.y, 1 / size.y, 1 / size.y); if (o.material.map) o.material.map.anisotropy = 4; parts.push({ geo, map: o.material.map || null }); });
      res(parts.length ? { parts, aspect: Math.max(size.x, size.z) / size.y } : null);
    }, undefined, () => { clearTimeout(to); res(null); });
  }));
}
function buildWorld(def) {
  if (world) { scene.remove(world); world.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material && o.material._own) { if (o.material.map && o.material.map._own) o.material.map.dispose(); o.material.dispose(); } }); }
  world = new THREE.Group(); scene.add(world);
  T = buildTrackData(def); const th = def.th;
  // sky + light
  scene.background = new THREE.Color(th.skyBot);
  const skyTex = tex(2048, 1024, (g, w, h) => paintSky(g, w, h, def)); skyTex._own = true;
  const skyMat = new THREE.MeshBasicMaterial({ map: skyTex, side: THREE.BackSide, fog: false, depthWrite: false }); skyMat._own = true;
  skyDome = new THREE.Mesh(new THREE.SphereGeometry(1900, 40, 20), skyMat); skyDome.renderOrder = -20; skyDome.frustumCulled = false; world.add(skyDome);
  scene.fog = new THREE.Fog(th.fog, th.fogFar * .25, th.fogFar);
  hemi.intensity = th.hemi * 1.5; hemi.color.set(th.night ? '#9fb0ff' : '#ffffff'); hemi.groundColor.set(th.ground);
  sun.intensity = th.sun * 1.6; sun.color.set(th.sunCol || '#ffffff');
  const own = m => { m._own = true; if (m.map) m.map._own = true; return m; };
  // ground
  const gt = tex(256, 256, (g, w, h) => { g.fillStyle = th.ground; g.fillRect(0, 0, w, h); speckle(g, w, h, [th.ground2], 1800, 3); }, true); gt.repeat.set(160, 160);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(5000, 5000).rotateX(-Math.PI / 2), flat(own(new THREE.MeshLambertMaterial({ map: gt })), -10)); ground.renderOrder = -10; world.add(ground);
  // road, kerbs, start line, walls
  const tint = th.night ? '#8f96b8' : '#ffffff';
  addFlat(ribbon(-HALF, HALF, 0, 14), flat(new THREE.MeshBasicMaterial({ map: roadTex, color: tint, side: THREE.DoubleSide }), -9));
  const kf = i => Math.abs(T.k[i]) > .006;
  const kerbMat = flat(new THREE.MeshBasicMaterial({ map: kerbTex, color: tint, side: THREE.DoubleSide }), -8);
  addFlat(ribbon(HALF, HALF + 1.5, 0, 5, kf), kerbMat); addFlat(ribbon(-HALF - 1.5, -HALF, 0, 5, kf), kerbMat);
  const wallMat = new THREE.MeshBasicMaterial({ map: wallTex, color: tint, side: THREE.DoubleSide });
  for (const s of [-1, 1]) { const w = new THREE.Mesh(wallGeo(s * WALL, 1.5, 96 * s), wallMat); w.frustumCulled = false; world.add(w); }
  const hd = Math.atan2(T.tx[0], T.tz[0]);
  const line = new THREE.Mesh(new THREE.PlaneGeometry(W, 2.2).rotateX(-Math.PI / 2), flat(new THREE.MeshBasicMaterial({ map: checkTex }), -7)); line.renderOrder = -7; line.position.set(T.px[0], 0, T.pz[0]); line.rotation.y = hd; world.add(line);
  // gantry
  const gan = new THREE.Group(); gan.position.set(T.px[0], 0, T.pz[0]); gan.rotation.y = hd;
  const dark = new THREE.MeshLambertMaterial({ color: '#1a1c24' });
  for (const s of [-1, 1]) { const p = new THREE.Mesh(new THREE.BoxGeometry(.8, 9, .8), dark); p.position.set(s * (HALF + 3), 4.5, 0); gan.add(p); }
  const beam = new THREE.Mesh(new THREE.BoxGeometry(W + 7, 1.6, 1), dark); beam.position.y = 8.6; gan.add(beam);
  gantryLights = [];
  for (let i = 0; i < 5; i++) { const m = new THREE.MeshBasicMaterial({ color: '#2a0705' }); m._own = true; const l = new THREE.Mesh(new THREE.SphereGeometry(.5, 12, 8), m); l.position.set((i - 2) * 1.5, 8.6, -.6); gan.add(l); gantryLights.push(m); }
  world.add(gan);
  const w0 = world, dark2 = new THREE.MeshLambertMaterial({ color: '#1a1c24' }), P = { x: 0, z: 0 };
  // verges between kerb and wall (mown stripes / pavement)
  const vg = new THREE.Color(th.ground), vA = '#' + vg.clone().lerp(new THREE.Color(th.buildings && th.night ? '#555a6b' : '#ffffff'), .09).getHexString(), vB = '#' + vg.clone().lerp(new THREE.Color('#000000'), .05).getHexString();
  const vergeTex = tex(8, 64, (g, w, h) => { g.fillStyle = vA; g.fillRect(0, 0, w, h); g.fillStyle = vB; g.fillRect(0, 0, w, h / 2); }, true);
  const vergeMat = flat(own(new THREE.MeshBasicMaterial({ map: vergeTex, color: th.night ? '#b9bfd6' : '#ffffff', side: THREE.DoubleSide })), -9.5);
  addFlat(ribbon(HALF, WALL, 0, 24), vergeMat); addFlat(ribbon(-WALL, -HALF, 0, 24), vergeMat);
  // grandstands with a live crowd
  crowd = [];
  const standAt = [[12, 1, 46], [12, -1, 46], [34, 1, 38], [T.n - 20, -1, 38], [T.n - 20, 1, 38]];
  for (const f of [.25, .5, .75]) { let bi = 0, bk = 0; for (let i = Math.floor(T.n * (f - .1)); i < T.n * (f + .1); i++) if (Math.abs(T.k[i]) > bk) { bk = Math.abs(T.k[i]); bi = i; } standAt.push([bi, T.k[bi] > 0 ? -1 : 1, 34]); standAt.push([bi + 16, T.k[bi] > 0 ? -1 : 1, 30]); }
  const placed = [];
  for (const [i, s, wd] of standAt) {
    at(i, s * (WALL + 10), P); if (distToTrack(P.x, P.z) < WALL + 6 || placed.some(q => Math.hypot(q.x - P.x, q.z - P.z) < 44)) continue; placed.push({ x: P.x, z: P.z });
    const j = ((i % T.n) + T.n) % T.n, g = makeStand(wd, th); g.position.set(P.x, 0, P.z); g.rotation.y = Math.atan2(-T.nx[j] * s, -T.nz[j] * s); world.add(g);
  }
  // sponsor arches over the track
  for (const f of [.3, .68]) { const i = Math.floor(T.n * f), a = new THREE.Group(); a.position.set(T.px[i], 0, T.pz[i]); a.rotation.y = Math.atan2(T.tx[i], T.tz[i]);
    for (const s of [-1, 1]) { const p = new THREE.Mesh(new THREE.BoxGeometry(.9, 9.5, .9), dark2); p.position.set(s * (HALF + 3.2), 4.75, 0); a.add(p); }
    const bt = wallTex.clone(); bt.needsUpdate = true; bt.repeat.set(.5, 1); bt.offset.x = f; const bm = new THREE.MeshBasicMaterial({ map: bt }); bm._own = true; bt._own = true;
    const bb = new THREE.Mesh(new THREE.BoxGeometry(W + 7.4, 2.2, .7), bm); bb.position.y = 9.4; a.add(bb); world.add(a); }
  // floodlights on night circuits
  if (th.night) {
    const cnt = Math.floor(T.n / 14), poles = new THREE.InstancedMesh(new THREE.CylinderGeometry(.18, .26, 11, 6).translate(0, 5.5, 0), dark2, cnt), lamps = new THREE.InstancedMesh(new THREE.BoxGeometry(2.6, .35, .9), new THREE.MeshBasicMaterial({ color: '#fff6d8' }), cnt), glow = new THREE.InstancedMesh(new THREE.SphereGeometry(1.5, 8, 6), new THREE.MeshBasicMaterial({ color: '#ffe9a8', transparent: true, opacity: .22, depthWrite: false }), cnt);
    const dm = new THREE.Object3D();
    for (let k = 0; k < cnt; k++) { const i = k * 14, s = k % 2 ? 1 : -1; at(i, s * (WALL + 1.6), P); dm.position.set(P.x, 0, P.z); dm.rotation.set(0, 0, 0); dm.scale.set(1, 1, 1); dm.updateMatrix(); poles.setMatrixAt(k, dm.matrix); at(i, s * (WALL + .6), P); dm.position.set(P.x, 11, P.z); dm.rotation.y = Math.atan2(T.nx[i], T.nz[i]); dm.updateMatrix(); lamps.setMatrixAt(k, dm.matrix); dm.position.y = 10.6; dm.updateMatrix(); glow.setMatrixAt(k, dm.matrix); }
    world.add(poles, lamps, glow);
  }
  // scenery spots
  const dummy = new THREE.Object3D(), col = new THREE.Color(), bx = T.box;
  const clear = (x, z, r) => !placed.some(q => Math.hypot(q.x - x, q.z - z) < r);
  const spots = []; let tries = 0;
  while (spots.length < 300 && tries++ < 7000) { const x = rnd(bx.x0 - 170, bx.x1 + 170), z = rnd(bx.z0 - 170, bx.z1 + 170); const d = distToTrack(x, z); if (d > WALL + 7 && d < 200 && clear(x, z, 30)) spots.push([x, z, rnd(.8, 1.35), Math.random() * 6.28]); }
  const bspots = [];
  if (th.buildings) { let t2 = 0; while (bspots.length < (th.night ? 70 : 80) && t2++ < 6000) { const x = rnd(bx.x0 - 280, bx.x1 + 280), z = rnd(bx.z0 - 280, bx.z1 + 280); const d = distToTrack(x, z); if (d < WALL + 36 || d > 320 || !clear(x, z, 40) || bspots.some(q => Math.hypot(q[0] - x, q[1] - z) < (th.night ? 30 : 24))) continue; bspots.push([x, z, th.night ? rnd(55, 125) : rnd(22, 36), Math.floor(Math.random() * 4) * Math.PI / 2 + rnd(-.15, .15)]); } }
  const instProp = (prop, list, hBase, night, tints) => { for (const part of prop.parts) { const mat = new THREE.MeshLambertMaterial({ map: part.map, color: night ? '#9aa0c8' : '#ffffff' }); if (night === 'glow') { mat.color.set('#ffffff'); mat.emissive.set('#ffffff'); mat.emissiveMap = part.map; mat.emissiveIntensity = .75; }
      const im = new THREE.InstancedMesh(part.geo, mat, list.length); list.forEach(([x, z, sc, ry], k) => { const hh = hBase * sc; dummy.position.set(x, 0, z); dummy.scale.set(hh, hh, hh); dummy.rotation.set(0, ry, 0); dummy.updateMatrix(); im.setMatrixAt(k, dummy.matrix); if (tints) im.setColorAt(k, col.set(tints[(k * 7) % tints.length])); }); im.frustumCulled = false; w0.add(im); } };
  // trees: Meshy models, procedural fallback
  const procTrees = () => { if (th.tree === 'none') return; const tr = TREES[th.tree];
    const folGeo = tr.fol === 'cone' ? new THREE.ConeGeometry(.5, 1, 7) : tr.fol === 'cyl' ? new THREE.CylinderGeometry(.5, .5, 1, 7) : new THREE.IcosahedronGeometry(.5, 1);
    const fol = new THREE.InstancedMesh(folGeo, new THREE.MeshLambertMaterial(), spots.length);
    const trunk = tr.trunkH ? new THREE.InstancedMesh(new THREE.CylinderGeometry(.35, .5, 1, 6), new THREE.MeshLambertMaterial({ color: tr.trunkCol }), spots.length) : null;
    spots.forEach(([x, z, s], i) => { if (trunk) { dummy.position.set(x, tr.trunkH * s / 2, z); dummy.scale.set(s, tr.trunkH * s, s); dummy.rotation.set(0, 0, 0); dummy.updateMatrix(); trunk.setMatrixAt(i, dummy.matrix); }
      dummy.position.set(x, tr.trunkH * s + tr.fs[1] * s * (tr.fol === 'sphere' ? .3 : .5), z); dummy.scale.set(tr.fs[0] * s, tr.fs[1] * s, tr.fs[2] * s); dummy.rotation.set(0, Math.random() * 6, 0); dummy.updateMatrix(); fol.setMatrixAt(i, dummy.matrix); fol.setColorAt(i, col.set(pick(tr.col))); });
    w0.add(fol); if (trunk) w0.add(trunk); };
  const procBuildings = () => { const mat = th.night ? new THREE.MeshLambertMaterial({ emissive: '#ffffff', emissiveMap: winTex, emissiveIntensity: .9 }) : new THREE.MeshLambertMaterial({ map: dayWinTex });
    const b = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), mat, bspots.length); bspots.forEach(([x, z, h, ry], k) => { dummy.position.set(x, h / 2, z); dummy.scale.set(rnd(14, 24), h, rnd(14, 24)); dummy.rotation.set(0, ry, 0); dummy.updateMatrix(); b.setMatrixAt(k, dummy.matrix); b.setColorAt(k, col.set(pick(th.bCol))); }); w0.add(b); };
  const TREE_H = { palm: 14, pine: 16, snowpine: 16, sakura: 11, cactus: 7 };
  if (th.tree !== 'none') loadProp(th.tree).then(p => { if (world !== w0) return; if (!p) return procTrees(); instProp(p, spots, TREE_H[th.tree], th.night); });
  if (th.tree === 'cactus') loadProp('rock').then(p => { if (world !== w0 || !p) return; const rs = []; let t3 = 0; while (rs.length < 70 && t3++ < 3000) { const x = rnd(bx.x0 - 200, bx.x1 + 200), z = rnd(bx.z0 - 200, bx.z1 + 200), d = distToTrack(x, z); if (d > WALL + 9 && d < 260 && clear(x, z, 30)) rs.push([x, z, rnd(.5, 2.2), Math.random() * 6.28]); } instProp(p, rs, 6, false); });
  if (th.buildings) loadProp(th.night ? 'tower' : 'villa').then(p => { if (world !== w0) return; if (!p) return procBuildings(); instProp(p, bspots, 1, th.night ? 'glow' : false, th.night ? ['#ffffff', '#ffd9f2', '#d9f0ff', '#e6dcff'] : ['#ffffff', '#ffd9c9', '#ffe9ee', '#d9ecff', '#eaffdf', '#fff4d0']); });
  // distant mountains
  const hillCol = new THREE.Color(th.ground).lerp(new THREE.Color(th.fog), .4).multiplyScalar(.82), hillMat = new THREE.MeshLambertMaterial({ color: hillCol, flatShading: true }), capMat = new THREE.MeshLambertMaterial({ color: th.night ? '#aab6d8' : '#f4f7fb', flatShading: true });
  for (let i = 0; i < 22; i++) { const a = i / 22 * 6.283 + rnd(-.1, .1), r = rnd(820, 1050), h = rnd(110, 300), rad = rnd(190, 340); const m = new THREE.Mesh(new THREE.ConeGeometry(rad, h, 7, 1), hillMat); m.position.set(Math.cos(a) * r, h / 2 - 6, Math.sin(a) * r); m.rotation.y = rnd(0, 6); world.add(m);
    if (h > 210 && th.tree !== 'cactus') { const c = new THREE.Mesh(new THREE.ConeGeometry(rad * .3, h * .3, 7, 1), capMat); c.position.set(m.position.x, h - 6 - h * .15 + .5, m.position.z); c.rotation.y = m.rotation.y; world.add(c); } }
  // item boxes
  boxes = []; const boxGeo = new THREE.BoxGeometry(1.7, 1.7, 1.7), boxMat = new THREE.MeshBasicMaterial({ map: qTex });
  for (const f of [.14, .37, .6, .83]) { const i = Math.floor(T.n * f); for (const lat of [-6, -2, 2, 6]) { at(i, lat, P); const m = new THREE.Mesh(boxGeo, boxMat); m.position.set(P.x, 1.5, P.z); world.add(m); boxes.push({ m, x: P.x, z: P.z, off: 0 }); } }
  buildMinimap();
}

/* ───────── cars ───────── */
const wheelGeo = new THREE.CylinderGeometry(.37, .37, .42, 14).rotateZ(Math.PI / 2);
const tyreMat = new THREE.MeshLambertMaterial({ color: '#15161a' }), carbon = new THREE.MeshLambertMaterial({ color: '#1b1d24' });
const shadowMat = new THREE.MeshBasicMaterial({ color: 0, transparent: true, opacity: .32, depthWrite: false });
const shadowGeo = new THREE.PlaneGeometry(2.6, 5.8).rotateX(-Math.PI / 2);
const HELMET_Y = .86, HELMET_Z = .1;
let carModel = null;   // Meshy-generated car (models/car.glb); procedural car is the fallback
const CAR_FLIP = false; // set true if the model's nose points backwards
function loadCarModel() {
  return new Promise(res => {
    const done = setTimeout(() => res(null), 15000);
    new GLTFLoader().load('./models/car.glb', gltf => {
      const src = gltf.scene, box = new THREE.Box3().setFromObject(src), size = box.getSize(new THREE.Vector3());
      const holder = new THREE.Group(), pivot = new THREE.Group(); pivot.add(src); holder.add(pivot);
      if (size.x > size.z) pivot.rotation.y = Math.PI / 2;
      if (CAR_FLIP) pivot.rotation.y += Math.PI;
      const sc = 5.7 / Math.max(size.x, size.z); pivot.scale.setScalar(sc);
      const b2 = new THREE.Box3().setFromObject(holder), c = b2.getCenter(new THREE.Vector3()); pivot.position.set(-c.x, -b2.min.y + .02, -c.z);
      carModel = holder; clearTimeout(done); res(holder);
    }, undefined, () => { clearTimeout(done); res(null); });
  });
}
function makeCarMesh(d) {
  const g = new THREE.Group(), body = new THREE.Group(); g.add(body);
  if (carModel) {
    const inst = carModel.clone(true), tint = new THREE.Color(d.c1).lerp(new THREE.Color('#ffffff'), .08);
    inst.traverse(o => { if (o.isMesh) { const old = o.material; o.material = new THREE.MeshPhongMaterial({ map: old.map || null, color: tint, emissive: tint, emissiveMap: old.map || null, emissiveIntensity: .28, shininess: 60, specular: 0x333333 }); } });
    body.add(inst);
    const helmet = new THREE.Mesh(new THREE.SphereGeometry(.2, 12, 10), new THREE.MeshPhongMaterial({ color: d.c2, shininess: 80 })); helmet.position.set(0, HELMET_Y, HELMET_Z); body.add(helmet);
    const sh = new THREE.Mesh(shadowGeo, shadowMat); sh.position.y = .04; g.add(sh);
    const bubble = new THREE.Mesh(new THREE.SphereGeometry(3, 16, 12), new THREE.MeshBasicMaterial({ color: '#6fd3ff', transparent: true, opacity: .28, depthWrite: false })); bubble.position.y = .8; bubble.visible = false; g.add(bubble);
    const dummy = new THREE.Object3D();
    return { g, body, wheels: [dummy, dummy], flap: dummy, bubble };
  }
  const m1 = new THREE.MeshPhongMaterial({ color: d.c1, shininess: 70 }), m2 = new THREE.MeshPhongMaterial({ color: d.c2, shininess: 70 });
  const box = (w, h, l, x, y, z, m) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, l), m); o.position.set(x, y, z); body.add(o); return o; };
  box(1.5, .1, 3.7, 0, .2, -.1, carbon);                 // floor
  box(.72, .42, 2.3, 0, .46, .3, m1);                     // monocoque
  const nose = new THREE.Mesh(new THREE.CylinderGeometry(.09, .3, 1.7, 8).rotateX(Math.PI / 2), m1); nose.position.set(0, .4, 2.2); body.add(nose);
  box(.5, .36, 1.6, .6, .42, -.25, m2); box(.5, .36, 1.6, -.6, .42, -.25, m2); // sidepods
  box(.46, .5, 1.5, 0, .68, -1.0, m1);                    // engine cover
  box(.3, .26, .5, 0, .98, -.35, m2);                     // airbox
  box(2.0, .06, .5, 0, .17, 2.85, m2); box(.06, .3, .55, 1.0, .28, 2.85, m1); box(.06, .3, .55, -1.0, .28, 2.85, m1); // front wing
  const flap = box(1.7, .07, .42, 0, 1.1, -2.25, m2);     // rear wing main plane (DRS flap)
  box(1.7, .06, .3, 0, .82, -2.3, carbon); box(.06, .66, .6, .86, .9, -2.25, m1); box(.06, .66, .6, -.86, .9, -2.25, m1); box(.1, .5, .1, 0, .6, -2.2, carbon);
  const helmet = new THREE.Mesh(new THREE.SphereGeometry(.21, 12, 10), m2); helmet.position.set(0, .82, .1); body.add(helmet);
  const visor = new THREE.Mesh(new THREE.BoxGeometry(.3, .08, .12), carbon); visor.position.set(0, .84, .27); body.add(visor);
  const halo = new THREE.Mesh(new THREE.TorusGeometry(.33, .035, 6, 14, Math.PI), carbon); halo.rotation.x = -Math.PI / 2; halo.position.set(0, .92, .22); body.add(halo);
  const wheels = [];
  for (const [x, z, f] of [[.86, 1.75, 1], [-.86, 1.75, 1], [.9, -1.6, 0], [-.9, -1.6, 0]]) { const w = new THREE.Mesh(wheelGeo, tyreMat); w.position.set(x, .37, z); if (!f) w.scale.set(1.2, 1.05, 1.05); body.add(w); if (f) wheels.push(w); }
  const sh = new THREE.Mesh(shadowGeo, shadowMat); sh.position.y = .04; g.add(sh);
  const bubble = new THREE.Mesh(new THREE.SphereGeometry(3, 16, 12), new THREE.MeshBasicMaterial({ color: '#6fd3ff', transparent: true, opacity: .28, depthWrite: false })); bubble.position.y = .8; bubble.visible = false; g.add(bubble);
  return { g, body, wheels, flap, bubble };
}
function helmetArt(cv, d) {
  const g = cv.getContext('2d'), s = cv.width; g.clearRect(0, 0, s, s); g.save(); g.scale(s / 100, s / 100);
  g.fillStyle = 'rgba(255,255,255,.06)'; g.beginPath(); g.arc(50, 50, 48, 0, 7); g.fill();
  g.fillStyle = d.c1; g.beginPath(); g.moveTo(18, 58); g.bezierCurveTo(14, 20, 86, 14, 86, 56); g.lineTo(86, 70); g.quadraticCurveTo(84, 84, 66, 84); g.lineTo(34, 84); g.quadraticCurveTo(18, 82, 18, 58); g.fill();
  g.fillStyle = d.c2; g.beginPath(); g.moveTo(22, 40); g.bezierCurveTo(34, 18, 70, 16, 82, 38); g.lineTo(76, 40); g.bezierCurveTo(64, 26, 40, 26, 28, 42); g.fill(); g.fillRect(40, 76, 40, 5);
  g.fillStyle = '#0c0d12'; g.beginPath(); g.moveTo(42, 46); g.lineTo(86, 46); g.lineTo(86, 62); g.lineTo(46, 64); g.quadraticCurveTo(38, 56, 42, 46); g.fill();
  g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.moveTo(50, 49); g.lineTo(80, 49); g.lineTo(78, 53); g.lineTo(52, 54); g.fill();
  g.fillStyle = d.c2; g.font = 'italic 900 15px Arial Black, Arial'; g.textAlign = 'center'; g.fillText(d.num, 31, 66);
  g.restore();
}

/* ───────── particles ───────── */
const PN = 500, pPos = new Float32Array(PN * 3).fill(-999), pCol = new Float32Array(PN * 3), pVel = new Float32Array(PN * 3), pLife = new Float32Array(PN); let pNext = 0;
const pGeo = new THREE.BufferGeometry(); pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3)); pGeo.setAttribute('color', new THREE.BufferAttribute(pCol, 3));
const points = new THREE.Points(pGeo, new THREE.PointsMaterial({ size: .26, vertexColors: true, transparent: true, opacity: .95, depthWrite: false })); points.frustumCulled = false; scene.add(points);
const tmpCol = new THREE.Color();
function spark(x, y, z, vx, vy, vz, color, life) { const i = pNext; pNext = (pNext + 1) % PN; pPos[i * 3] = x; pPos[i * 3 + 1] = y; pPos[i * 3 + 2] = z; pVel[i * 3] = vx; pVel[i * 3 + 1] = vy; pVel[i * 3 + 2] = vz; tmpCol.set(color); pCol[i * 3] = tmpCol.r; pCol[i * 3 + 1] = tmpCol.g; pCol[i * 3 + 2] = tmpCol.b; pLife[i] = life; }
function updateParticles(dt) { for (let i = 0; i < PN; i++) { if (pLife[i] <= 0) continue; pLife[i] -= dt; if (pLife[i] <= 0) { pPos[i * 3 + 1] = -999; continue; } pPos[i * 3] += pVel[i * 3] * dt; pPos[i * 3 + 1] = Math.max(.05, pPos[i * 3 + 1] + pVel[i * 3 + 1] * dt); pPos[i * 3 + 2] += pVel[i * 3 + 2] * dt; pVel[i * 3 + 1] -= 9 * dt; } pGeo.attributes.position.needsUpdate = true; pGeo.attributes.color.needsUpdate = true; }

/* ───────── game state ───────── */
const G = { phase: 'menu', t: 0, rt: 0, cars: [], player: null, order: [], driver: DRIVERS[0], mode: 'cup', diff: 1, cal: [0, 1, 2, 3], round: 0, pts: {}, track: 0, lightsOut: 0, finT: 0, paused: false, oils: [], tyres: [], muted: false };
const keys = {};
const oilGeo = new THREE.CircleGeometry(2.2, 14).rotateX(-Math.PI / 2), oilMat = new THREE.MeshBasicMaterial({ color: '#07070a', transparent: true, opacity: .8, depthWrite: false });
const tyreGeo = new THREE.TorusGeometry(.6, .32, 8, 14).rotateY(Math.PI / 2);

function spawnCars(playerDriver) {
  for (const c of G.cars) scene.remove(c.mesh.g);
  for (const o of G.oils) scene.remove(o.m); for (const o of G.tyres) scene.remove(o.m); G.oils = []; G.tyres = [];
  const others = DRIVERS.filter(d => d !== playerDriver).sort(() => Math.random() - .5);
  const grid = playerDriver ? [...others.slice(0, 7), playerDriver, ...others.slice(7)] : others.concat(DRIVERS.filter(d => !others.includes(d)));
  const base = [.87, .925, .975][G.diff], spread = .07;
  G.cars = grid.map((d, k) => {
    const mesh = makeCarMesh(d); scene.add(mesh.g);
    const ti = (T.n - Math.round((7 + k * 6) / T.ds) + T.n) % T.n, lat = k % 2 ? 3.6 : -3.6, p = at(ti, lat, {});
    const ai = d !== playerDriver;
    const c = { d, mesh, ai, x: p.x, z: p.z, h: Math.atan2(T.tx[ti], T.tz[ti]), vd: 0, v: 0, ti, prog: ti - T.n, lat, along: 0, lap: 0, place: k + 1, fin: null, best: null, lapStart: 0,
      drift: 0, charge: 0, boost: 0, spin: 0, spinA: 0, inv: 0, slow: 0, shield: 0, tow: 0, drs: false, item: null, itemT: 0, stuck: 0, off: false, wob: 0,
      speedMul: .955 + d.speed * .011, turnMul: .8 + d.turn * .05,
      skill: ai ? base + spread * (1 - k / 11) * rnd(.6, 1) : 1, lane: lat, laneT: rnd(2, 6), rub: 1, yaw: 0, launch: ai ? rnd(0, 1) : 0 };
    c.vd = c.h; return c;
  });
  G.player = playerDriver ? G.cars.find(c => !c.ai) : null;
  G.order = G.cars.slice();
}

function hit(c, why) {
  if (c.shield > 0) { c.shield = 0; c.inv = 1; if (c === G.player) msg('SHIELD SAVED YOU', '#6fd3ff'); for (let i = 0; i < 14; i++) spark(c.x, 1, c.z, rnd(-8, 8), rnd(2, 8), rnd(-8, 8), '#6fd3ff', .5); return; }
  if (c.inv > 0 || c.spin > 0) return;
  c.spin = 1.15; c.inv = 3; c.drift = 0; c.charge = 0; c.boost = 0;
  if (c === G.player) { msg(why, '#ffd23f'); beep(120, .3, 'sawtooth'); }
}
function useItem(c) {
  const it = c.item; if (!it) return; c.item = null;
  if (it === 'ers') { c.boost = Math.max(c.boost, 2.3); if (c === G.player) beep(520, .25, 'square'); }
  else if (it === 'shield') c.shield = 9;
  else if (it === 'oil') { const m = new THREE.Mesh(oilGeo, oilMat); const x = c.x - Math.sin(c.h) * 4.5, z = c.z - Math.cos(c.h) * 4.5; m.position.set(x, .05, z); scene.add(m); G.oils.push({ m, x, z, life: 40, owner: c, arm: .6 }); }
  else if (it === 'tyre') { const m = new THREE.Mesh(tyreGeo, tyreMat); scene.add(m); G.tyres.push({ m, s: c.ti + 2 + c.along / T.ds, lat: clamp(c.lat, -HALF + 1, HALF - 1), owner: c, life: 5 }); }
  else if (it === 'flag') { let n = 0; for (const o of G.cars) if (o !== c && o.prog > c.prog && o.fin == null) { if (o.shield > 0) o.shield = 0; else { o.slow = 3.6; n++; } if (o === G.player) msg('YELLOW FLAG — SLOW DOWN', '#ffd23f'); } if (c === G.player) msg(n ? 'YELLOW FLAG: ' + n + ' CARS SLOWED' : 'NOBODY AHEAD…', '#ffd23f'); }
}
function rollItem(c) { const f = (c.place - 1) / 11; const w = { ers: .8 + f * 1.6, oil: 1.4 - f, tyre: 1.1, shield: 1 - f * .5, flag: f < .15 ? 0 : f * 1.5 }; let tot = 0; for (const k in w) tot += w[k]; let r = Math.random() * tot; for (const k in w) { r -= w[k]; if (r <= 0) return k; } return 'ers'; }

/* ───────── driving ───────── */
function locate(c) {
  const N = T.n; let best = c.ti, bd = 1e18;
  for (let k = -6; k <= 10; k++) { const i = ((c.ti + k) % N + N) % N, dx = c.x - T.px[i], dz = c.z - T.pz[i], d = dx * dx + dz * dz; if (d < bd) { bd = d; best = i; } }
  let d = best - c.ti; if (d > N / 2) d -= N; if (d < -N / 2) d += N; c.prog += d; c.ti = best;
  const dx = c.x - T.px[best], dz = c.z - T.pz[best]; c.lat = dx * T.nx[best] + dz * T.nz[best]; c.along = dx * T.tx[best] + dz * T.tz[best];
}
function stepCar(c, dt, inp) {
  if (c.spin > 0) { c.spin -= dt; c.spinA += dt * 12; c.v *= Math.exp(-2.2 * dt); inp = { thr: 0, brk: 0, turn: 0, drift: false }; if (c.spin <= 0) c.spinA = 0; }
  c.inv = Math.max(0, c.inv - dt); c.shield = Math.max(0, c.shield - dt);
  c.off = Math.abs(c.lat) > HALF + 1.8;
  let vmax = VMAX * c.speedMul * (c.ai ? c.skill * c.rub : 1);
  const boosting = c.boost > 0;
  if (boosting) { vmax *= 1.3; c.boost -= dt; } else if (c.drs) vmax *= 1.07;
  if (c.slow > 0) { vmax *= .6; c.slow -= dt; }
  if (c.off && !boosting) vmax *= .5;
  if (inp.thr && c.v < vmax) c.v += ACC * (boosting ? 1.9 : 1) * (1 - .8 * Math.pow(Math.max(c.v, 0) / vmax, 2)) * dt;
  else if (!inp.thr && !inp.brk) c.v -= Math.sign(c.v) * Math.min(Math.abs(c.v), 9 * dt);
  if (c.v > vmax) c.v -= Math.min(c.v - vmax, (c.off ? 55 : 22) * dt);
  if (inp.brk) c.v = Math.max(c.v - BRK * dt, c.v > 0 ? 0 : -14);
  const sp = Math.abs(c.v);
  const om = lerp(2.5, 1.2, clamp(sp / VMAX, 0, 1)) * c.turnMul * Math.min(1, sp / 6) * (c.v < 0 ? -1 : 1) * (c.ai ? 1.18 : 1);
  if (!c.drift && inp.drift && inp.turn && c.v > 24 && !c.off && c.spin <= 0) { c.drift = Math.sign(inp.turn); c.charge = 0; }
  if (c.drift && (!inp.drift || c.v < 15 || c.off)) {
    const lv = c.charge > 3 ? 3 : c.charge > 1.9 ? 2 : c.charge > .9 ? 1 : 0;
    if (lv && !c.off) { c.boost = Math.max(c.boost, [0, .8, 1.4, 2.1][lv]); if (c === G.player) { beep(380 + lv * 120, .2, 'square'); msg(['', 'TURBO', 'SUPER TURBO', 'ULTRA TURBO'][lv], ['', '#39a8ff', '#ff8a1f', '#b46bff'][lv]); } }
    c.drift = 0; c.charge = 0;
  }
  let grip = 9;
  if (c.drift) { const a = inp.turn * c.drift; c.h += c.drift * om * (1.02 + .55 * a) * dt; c.charge += dt * (1 + .7 * a); grip = 2.8; }
  else c.h += inp.turn * om * dt;
  let slip = wrap(c.h - c.vd); slip = clamp(slip, -1, 1); c.vd = c.h - slip * Math.exp(-grip * dt);
  c.x += Math.sin(c.vd) * c.v * dt; c.z += Math.cos(c.vd) * c.v * dt;
  locate(c);
  if (Math.abs(c.lat) > LIMIT) { const s = Math.sign(c.lat), over = Math.abs(c.lat) - LIMIT; c.x -= T.nx[c.ti] * over * s; c.z -= T.nz[c.ti] * over * s; c.lat = s * LIMIT; c.v *= Math.exp(-1.6 * dt); const th = Math.atan2(T.tx[c.ti], T.tz[c.ti]) + (c.v < 0 ? Math.PI : 0); c.vd += wrap(th - c.vd) * Math.min(1, 6 * dt); if (c.ai) c.h += wrap(th - c.h) * Math.min(1, 4 * dt); }
  // visuals
  const targetYaw = c.drift ? c.drift * .32 : 0; c.yaw += (targetYaw - c.yaw) * Math.min(1, 8 * dt);
  const m = c.mesh; m.g.position.set(c.x, 0, c.z); m.g.rotation.y = c.h + c.yaw + c.spinA;
  m.body.rotation.z = lerp(m.body.rotation.z, -inp.turn * .035 * Math.min(1, sp / 30), .2);
  m.body.position.y = c.off && sp > 8 ? Math.sin(G.t * 40 + c.ti) * .04 : 0;
  m.wheels[0].rotation.y = m.wheels[1].rotation.y = inp.turn * .35;
  m.flap.rotation.x = lerp(m.flap.rotation.x, c.drs || boosting ? -.9 : 0, .2);
  m.bubble.visible = c.shield > 0; if (c.inv > 0 && c.spin <= 0) m.body.visible = Math.floor(G.t * 14) % 2 === 0; else m.body.visible = true;
  // fx
  const bx = c.x - Math.sin(c.h) * 2.3, bz = c.z - Math.cos(c.h) * 2.3;
  if (c.drift && c.charge > .9 && Math.random() < .8) { const colr = c.charge > 3 ? '#b46bff' : c.charge > 1.9 ? '#ff8a1f' : '#39a8ff'; const sx = Math.cos(c.h) * .9 * -c.drift; const sz = -Math.sin(c.h) * .9 * -c.drift; spark(bx + sx, .2, bz + sz, rnd(-3, 3), rnd(2, 6), rnd(-3, 3), colr, .35); }
  if (boosting && Math.random() < .9) spark(bx, .55, bz, -Math.sin(c.h) * 10 + rnd(-2, 2), rnd(0, 2), -Math.cos(c.h) * 10 + rnd(-2, 2), Math.random() < .5 ? '#ffd23f' : '#ff5a1f', .3);
  if (c.off && sp > 12 && Math.random() < .5) spark(bx, .2, bz, rnd(-3, 3), rnd(2, 5), rnd(-3, 3), T.def.th.ground2, .5);
}
function playerInput() {
  const touch = G.touch;
  return { thr: keys.up || (touch && !keys.brake) ? 1 : 0, brk: keys.down || keys.brake ? 1 : 0, turn: (keys.left ? 1 : 0) - (keys.right ? 1 : 0), drift: !!keys.drift };
}
const CAR_C = [-1.85, 0, 1.85], CAR_D = 2.4;
function aiInput(c, dt) {
  const N = T.n;
  c.laneT -= dt; if (c.laneT <= 0) { c.laneT = rnd(2.5, 7); c.lane = rnd(-5.5, 5.5); }
  // racing line: drift towards the inside of upcoming corners
  const kA = T.k[(c.ti + 14) % N]; let lane = clamp(c.lane + clamp(kA * 260, -4, 4), -6.5, 6.5);
  // pull out from behind a slower car instead of driving into it
  { const sh = Math.sin(c.h), ch = Math.cos(c.h); let near = 18; for (const o of G.cars) { if (o === c) continue; const dx = o.x - c.x, dz = o.z - c.z, f = dx * sh + dz * ch; if (f > 0 && f < near && Math.abs(o.lat - c.lat) < 3.4 && o.v < c.v + 3) { near = f; lane = clamp(o.lat + (c.lat === o.lat ? (o.lat > 0 ? -1 : 1) : Math.sign(c.lat - o.lat)) * 4.4, -6.5, 6.5); if (Math.abs(lane - o.lat) < 3.4) lane = clamp(o.lat - Math.sign(lane - o.lat || 1) * 4.4, -6.5, 6.5); } } }
  const la = Math.floor(5 + c.v * .2), j = (c.ti + la) % N;
  const tx = T.px[j] + T.nx[j] * lane, tz = T.pz[j] + T.nz[j] * lane;
  const diff = wrap(Math.atan2(tx - c.x, tz - c.z) - c.h);
  let vt = 1e9; for (let k = 0; k < 46; k++) { const vc = T.vc[(c.ti + k) % N] * 1.12 * c.skill; const al = Math.sqrt(vc * vc + 2 * BRK * .62 * k * T.ds); if (al < vt) vt = al; }
  if (G.phase === 'race' && c.launch > 0) { c.launch -= dt * 2.5; return { thr: 0, brk: 0, turn: 0, drift: false }; }
  // items
  if (c.item) { c.itemT -= dt; if (c.itemT <= 0) useItem(c); }
  return { thr: c.v < vt ? 1 : 0, brk: c.v > vt + 3 ? 1 : 0, turn: clamp(diff * 3.2, -1, 1), drift: false };
}

/* ───────── race flow ───────── */
function startRace(trackIdx) {
  G.track = trackIdx; buildWorld(TRACKS[trackIdx]); spawnCars(G.driver);
  G.phase = 'count'; G.t = 0; G.rt = 0; G.lightsOut = 6 + rnd(.2, 1.1); G.finT = 0; G.paused = false; G.thrDown = null; G.camH = G.player.h;
  show('hud'); $('lights').classList.remove('hidden'); $('hTrack').textContent = TRACKS[trackIdx].name.toUpperCase(); $('hBest').textContent = '';
  for (const k in keys) keys[k] = false;
  $('touch').classList.add('on'); initAudio(); updateHud(true); ldShow();
}
function attract() { G.phase = 'menu'; buildWorld(pick(TRACKS)); spawnCars(null); for (const c of G.cars) c.launch = 0; $('touch').classList.remove('on'); }
function finishRace() {
  // classify unfinished cars by progress
  const total = LAPS * T.n;
  for (const c of G.order) if (c.fin == null) c.fin = G.rt + Math.max(0, total - c.prog) * T.ds / 46 + .001 * c.place;
  const res = G.cars.slice().sort((a, b) => a.fin - b.fin);
  res.forEach((c, i) => { G.pts[c.d.id] = (G.pts[c.d.id] || 0) + (G.mode === 'cup' ? POINTS[i] : 0); });
  const pi = res.indexOf(G.player), last = G.mode !== 'cup' || G.round >= G.cal.length - 1;
  $('rKicker').textContent = G.mode === 'cup' ? 'Round ' + (G.round + 1) + ' of ' + G.cal.length + ' · ' + TRACKS[G.track].name : TRACKS[G.track].name;
  $('rTitle').textContent = pi === 0 ? 'Victory!' : pi < 3 ? 'Podium — P' + (pi + 1) : 'Chequered flag — P' + (pi + 1);
  $('rTable').innerHTML = '<tr><th>Pos</th><th>Driver</th><th>Time</th><th>Pts</th></tr>' + res.map((c, i) => `<tr class="${c === G.player ? 'me' : ''}"><td>${i + 1}</td><td><u style="background:${chip(c.d)}"></u>${c.d.name}</td><td>${i === 0 ? fmt(c.fin) : '+' + (c.fin - res[0].fin).toFixed(3)}</td><td>${G.mode === 'cup' ? POINTS[i] : ''}</td></tr>`).join('');
  $('rStandBox').classList.toggle('hidden', G.mode !== 'cup');
  if (G.mode === 'cup') {
    const st = DRIVERS.slice().sort((a, b) => (G.pts[b.id] || 0) - (G.pts[a.id] || 0));
    $('rStand').innerHTML = '<tr><th>Pos</th><th>Driver</th><th>Team</th><th>Pts</th></tr>' + st.map((d, i) => `<tr class="${d === G.driver ? 'me' : ''}"><td>${i + 1}</td><td><u style="background:${chip(d)}"></u>${d.name}</td><td>${d.team}</td><td>${G.pts[d.id] || 0}</td></tr>`).join('');
    if (last) { const ci = st.indexOf(G.driver); $('rTitle').textContent = ci === 0 ? 'World Champion!' : 'Season over — P' + (ci + 1) + ' in the championship'; }
  }
  $('btnNext').textContent = last ? (G.mode === 'cup' ? 'New season' : 'Race again') : 'Next race';
  G.phase = 'results'; show('results'); stopEngine();
}
function msg(text, color) { const e = $('hMsg'); e.textContent = text; e.style.color = color || '#fff'; e.classList.add('on'); clearTimeout(msg.t); msg.t = setTimeout(() => e.classList.remove('on'), 1500); }

function update(dt) {
  G.t += dt;
  const racing = G.phase === 'race' || G.phase === 'finish' || G.phase === 'menu';
  if (G.phase === 'count') {
    const lit = G.t >= G.lightsOut ? 0 : clamp(Math.floor(G.t), 0, 5);
    if (lit !== G.lit) { G.lit = lit; document.querySelectorAll('#lights i').forEach((e, i) => e.classList.toggle('on', i < lit)); gantryLights.forEach((m, i) => m.color.set(i < lit ? '#ff2a1a' : '#2a0705')); if (lit) beep(330, .12, 'square'); }
    const thr = playerInput().thr; if (thr && G.thrDown == null) G.thrDown = G.t; if (!thr) G.thrDown = null;
    if (G.t >= G.lightsOut) {
      G.phase = 'race'; G.rt = 0; beep(660, .5, 'square'); setTimeout(() => $('lights').classList.add('hidden'), 700);
      const p = G.player, held = G.thrDown == null ? -1 : G.t - G.thrDown;
      if (held >= 0 && held < .5) { p.boost = 1.3; msg('PERFECT LAUNCH!', '#35e08a'); } else if (held > 2) { p.launch = 1; G.wheelspin = .9; msg('WHEELSPIN!', '#ffd23f'); } else msg('LIGHTS OUT!', '#fff');
      for (const c of G.cars) c.lapStart = 0;
    }
    for (const c of G.cars) stepCar(c, dt, { thr: 0, brk: 0, turn: 0, drift: false });
  }
  if (racing) {
    if (G.phase !== 'menu') G.rt += dt;
    G.wheelspin = Math.max(0, (G.wheelspin || 0) - dt);
    const pl = G.player;
    for (const c of G.cars) {
      let inp;
      if (c.ai || c.fin != null) inp = aiInput(c, dt);
      else { inp = playerInput(); if (G.wheelspin > 0) { inp.thr = 0; if (Math.random() < .6) spark(c.x - Math.sin(c.h) * 2, .3, c.z - Math.cos(c.h) * 2, rnd(-2, 2), rnd(1, 4), rnd(-2, 2), '#cccccc', .5); } if (keys.item) { keys.item = false; useItem(c); } }
      // rubber band vs player
      if (c.ai && pl) { const gap = (c.prog - pl.prog) * T.ds; c.rub = gap > 60 ? .965 : gap < -60 ? 1.04 : 1; }
      stepCar(c, dt, inp);
      // slipstream
      let tow = false; const sh = Math.sin(c.h), ch = Math.cos(c.h);
      if (c.v > 34) for (const o of G.cars) { if (o === c) continue; const dx = o.x - c.x, dz = o.z - c.z, f = dx * sh + dz * ch; if (f > 4 && f < 34 && Math.abs(dx * ch - dz * sh) < 3.4) { tow = true; break; } }
      c.tow = tow ? c.tow + dt : Math.max(0, c.tow - dt * 2); c.drs = c.tow > .9;
      // stuck recovery for bots
      if (c.ai && G.phase !== 'count') { c.stuck = Math.abs(c.v) < 3 && c.launch <= 0 ? c.stuck + dt : 0; if (c.stuck > 2.5) { c.stuck = 0; const p = at(c.ti, 0, {}); c.x = p.x; c.z = p.z; c.h = c.vd = Math.atan2(T.tx[c.ti], T.tz[c.ti]); c.v = 15; } }
      // laps
      const lap = Math.floor(c.prog / T.n);
      if (lap > c.lap) { c.lap = lap; if (lap >= 1) { const lt = G.rt - c.lapStart; if (c.best == null || lt < c.best) c.best = lt; c.lapStart = G.rt; if (c === pl && c.fin == null) { $('hBest').textContent = 'BEST ' + fmt(c.best); if (lap < LAPS) msg(lap === LAPS - 1 ? 'FINAL LAP' : 'LAP ' + (lap + 1), '#fff'); } } }
      if (c.fin == null && c.prog >= LAPS * T.n && G.phase !== 'menu') { c.fin = G.rt; c.ai = true; c.skill = .8; c.item = null; if (c === pl) { G.phase = 'finish'; G.finT = 0; msg(c.place === 1 ? 'YOU WIN!' : 'FINISHED P' + c.place, c.place === 1 ? '#ffd23f' : '#fff'); beep(880, .6, 'triangle'); } }
    }
    // car vs car
    const cs = G.cars;
    for (let i = 0; i < cs.length; i++) for (let j = i + 1; j < cs.length; j++) {
      const a = cs[i], b = cs[j], dx = b.x - a.x, dz = b.z - a.z; if (dx * dx + dz * dz > 64) continue;
      // each car is three circles along its length, so noses and tails collide too
      const sa = Math.sin(a.h), ca = Math.cos(a.h), sb = Math.sin(b.h), cb = Math.cos(b.h); let pen = 0, ux = 0, uz = 0;
      for (const oa of CAR_C) for (const ob of CAR_C) { const ex = dx + sb * ob - sa * oa, ez = dz + cb * ob - ca * oa, d2 = ex * ex + ez * ez; if (d2 < CAR_D * CAR_D && d2 > 1e-6) { const d = Math.sqrt(d2); if (CAR_D - d > pen) { pen = CAR_D - d; ux = ex / d; uz = ez / d; } } }
      if (!pen) continue;
      const h = pen / 2 + .01; a.x -= ux * h; a.z -= uz * h; b.x += ux * h; b.z += uz * h;
      const fa = dx * sa + dz * ca, la = dx * ca - dz * sa;
      if (Math.abs(fa) > Math.abs(la)) { const rear = fa > 0 ? a : b, front = fa > 0 ? b : a; if (rear.v > front.v) { const dv = (rear.v - front.v) * .5; rear.v -= dv * .8; front.v += dv * .2; } }
      a.mesh.g.position.set(a.x, 0, a.z); b.mesh.g.position.set(b.x, 0, b.z);
    }
    // item boxes
    for (const b of boxes) { if (b.off > 0) { b.off -= dt; if (b.off <= 0) b.m.visible = true; continue; } b.m.rotation.y += dt * 2; b.m.rotation.x += dt * 1.3; for (const c of cs) { const dx = c.x - b.x, dz = c.z - b.z; if (dx * dx + dz * dz < 6.5) { b.off = 4; b.m.visible = false; if (!c.item && c.fin == null && G.phase !== 'menu') { c.item = rollItem(c); c.itemT = rnd(1.5, 6); if (c === pl) beep(740, .1, 'triangle'); } for (let i = 0; i < 8; i++) spark(b.x, 1.5, b.z, rnd(-6, 6), rnd(2, 8), rnd(-6, 6), '#ffd23f', .4); break; } } }
    // oil
    for (let i = G.oils.length - 1; i >= 0; i--) { const o = G.oils[i]; o.life -= dt; o.arm -= dt; let dead = o.life <= 0; if (!dead) for (const c of cs) { if (o.arm > 0 && c === o.owner) continue; const dx = c.x - o.x, dz = c.z - o.z; if (dx * dx + dz * dz < 7.5 && c.spin <= 0 && c.inv <= 0) { hit(c, 'OIL! SPUN OUT'); dead = true; break; } } if (dead) { scene.remove(o.m); G.oils.splice(i, 1); } }
    // loose tyres
    for (let i = G.tyres.length - 1; i >= 0; i--) { const o = G.tyres[i]; o.life -= dt; o.s += 105 * dt / T.ds; const i0 = Math.floor(o.s), f = o.s - i0, a = at(i0, o.lat, {}), b = at(i0 + 1, o.lat, {}); const x = lerp(a.x, b.x, f), z = lerp(a.z, b.z, f); o.m.position.set(x, .9, z); o.m.rotation.y = Math.atan2(b.x - a.x, b.z - a.z); o.m.rotation.x += dt * 25; let dead = o.life <= 0; if (!dead) for (const c of cs) { if (c === o.owner) continue; const dx = c.x - x, dz = c.z - z; if (dx * dx + dz * dz < 8) { hit(c, 'HIT BY A LOOSE TYRE'); dead = true; break; } } if (dead) { scene.remove(o.m); G.tyres.splice(i, 1); } }
    // order
    G.order.sort((a, b) => a.fin != null && b.fin != null ? a.fin - b.fin : a.fin != null ? -1 : b.fin != null ? 1 : (b.prog + b.along / T.ds) - (a.prog + a.along / T.ds));
    G.order.forEach((c, i) => c.place = i + 1);
    if (G.phase === 'finish') { G.finT += dt; if (G.finT > 4.5) finishRace(); }
  }
  updateParticles(dt);
}

/* ───────── camera ───────── */
const camPos = new THREE.Vector3(0, 50, 0), camLook = new THREE.Vector3();
function updateCamera(dt) {
  const p = G.player;
  if (!p || G.phase === 'menu' || G.phase === 'finish' || G.phase === 'results') {
    const c = p || G.order[0]; if (!c) return; const a = G.t * .25, r = p ? 13 : 26;
    camPos.lerp(new THREE.Vector3(c.x + Math.cos(a) * r, p ? 5 : 11, c.z + Math.sin(a) * r), Math.min(1, 3 * dt)); camLook.lerp(new THREE.Vector3(c.x, 1, c.z), Math.min(1, 6 * dt));
    camera.fov = lerp(camera.fov, 55, .05); camera.updateProjectionMatrix(); camera.position.copy(camPos); camera.lookAt(camLook); return;
  }
  G.camH += wrap(lerp(p.vd, p.h, .5) - G.camH) * Math.min(1, 6.5 * dt);
  const back = keys.look ? -1 : 1, s = Math.sin(G.camH) * back, c = Math.cos(G.camH) * back;
  const dist = 8.6 + p.v * .03;
  camPos.set(p.x - s * dist, 3.5, p.z - c * dist); camLook.set(p.x + s * 8, 1.3, p.z + c * 8);
  const fov = 64 + clamp(p.v / VMAX, 0, 1.4) * 9 + (p.boost > 0 ? 9 : 0); camera.fov = lerp(camera.fov, fov, .08); camera.updateProjectionMatrix();
  camera.position.copy(camPos); if (p.boost > 0) { camera.position.x += rnd(-.04, .04); camera.position.y += rnd(-.04, .04); } camera.lookAt(camLook);
}

/* ───────── HUD ───────── */
let mmBase = null, mmS = 1, mmX = 0, mmZ = 0;
function buildMinimap() {
  const S = 340, b = T.box, pad = 22; mmS = Math.min((S - pad * 2) / (b.x1 - b.x0), (S - pad * 2) / (b.z1 - b.z0)); mmX = S / 2 - (b.x0 + b.x1) / 2 * mmS; mmZ = S / 2 - (b.z0 + b.z1) / 2 * mmS;
  mmBase = document.createElement('canvas'); mmBase.width = mmBase.height = S; const g = mmBase.getContext('2d'); g.lineJoin = 'round';
  const path = () => { g.beginPath(); for (let i = 0; i < T.n; i += 2) { const x = T.px[i] * mmS + mmX, y = T.pz[i] * mmS + mmZ; i ? g.lineTo(x, y) : g.moveTo(x, y); } g.closePath(); };
  path(); g.strokeStyle = 'rgba(10,11,16,.8)'; g.lineWidth = 16; g.stroke(); path(); g.strokeStyle = '#f3f4f8'; g.lineWidth = 6; g.stroke();
  g.fillStyle = '#e10600'; g.fillRect(T.px[0] * mmS + mmX - 4, T.pz[0] * mmS + mmZ - 9, 8, 18);
}
function trackThumb(cv, def) {
  const g = cv.getContext('2d'), w = cv.width, h = cv.height, th = def.th; const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, th.skyTop); gr.addColorStop(1, th.skyBot); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  const pts = def.r.map((r, i) => { const a = i / def.r.length * Math.PI * 2; return new THREE.Vector3(Math.cos(a) * r * def.sx, 0, Math.sin(a) * r * def.sz); }); const sp = new THREE.CatmullRomCurve3(pts, true, 'centripetal').getPoints(160);
  const s = Math.min(w / 900, h / 760); g.beginPath(); sp.forEach((p, i) => { const x = w / 2 + p.x * s, y = h / 2 + p.z * s; i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.closePath(); g.lineJoin = 'round'; g.strokeStyle = 'rgba(0,0,0,.55)'; g.lineWidth = 9; g.stroke(); g.strokeStyle = '#fff'; g.lineWidth = 4; g.stroke();
}
let hudT = 0;
function updateHud(force) {
  const p = G.player; if (!p) return;
  $('hSpeed').firstChild.nodeValue = Math.round(Math.abs(p.v) * KMH);
  const lv = p.drift ? (p.charge > 3 ? 3 : p.charge > 1.9 ? 2 : p.charge > .9 ? 1 : 0) : 0;
  $('cTurbo').className = 'chip' + (p.boost > 0 ? ' on' : lv ? ' t' + lv : ''); $('cDrs').className = 'chip' + (p.drs ? ' on' : '');
  $('hClock').textContent = fmt(G.phase === 'count' ? 0 : p.fin != null ? p.fin : G.rt);
  $('wrong').classList.toggle('hidden', !(G.phase === 'race' && p.v > 8 && Math.sin(p.vd) * T.tx[p.ti] + Math.cos(p.vd) * T.tz[p.ti] < -.35));
  hudT -= 1; if (hudT > 0 && !force) { drawMinimap(); return; } hudT = 8;
  $('hPos').innerHTML = p.place + '<small>' + ord(p.place) + '</small>';
  $('hLapN').textContent = clamp(p.lap + 1, 1, LAPS) + '/' + LAPS;
  const it = $('hItem'); it.classList.toggle('hidden', !p.item); if (p.item) { $('hItemIcon').textContent = ITEMS[p.item].icon; $('hItemName').textContent = ITEMS[p.item].name + ' · E'; }
  const lead = G.order[0];
  $('tower').innerHTML = G.order.map((c, i) => `<div class="${c === p ? 'me' : ''}"><b>${i + 1}</b><u style="background:${chip(c.d)}"></u>${c.d.tla}</div>`).join('');
  drawMinimap();
}
function drawMinimap() {
  const g = $('minimap').getContext('2d'); g.clearRect(0, 0, 340, 340); if (!mmBase) return; g.drawImage(mmBase, 0, 0);
  for (let i = G.order.length - 1; i >= 0; i--) { const c = G.order[i], me = c === G.player; g.beginPath(); g.arc(c.x * mmS + mmX, c.z * mmS + mmZ, me ? 10 : 6.5, 0, 7); g.fillStyle = chip(c.d); g.fill(); g.lineWidth = me ? 4 : 2; g.strokeStyle = me ? '#fff' : '#0a0b10'; g.stroke(); }
}

/* ───────── audio ───────── */
let AC = null, eng = null;
function initAudio() { if (AC) { if (AC.state === 'suspended') AC.resume(); startEngine(); return; } try { AC = new (window.AudioContext || window.webkitAudioContext)(); startEngine(); } catch (e) { AC = null; } }
function startEngine() { if (!AC || eng) return; const o = AC.createOscillator(), o2 = AC.createOscillator(), f = AC.createBiquadFilter(), g = AC.createGain(); o.type = 'sawtooth'; o2.type = 'square'; f.type = 'lowpass'; f.frequency.value = 900; g.gain.value = 0; o.connect(f); o2.connect(f); f.connect(g); g.connect(AC.destination); o.start(); o2.start(); eng = { o, o2, f, g }; }
function stopEngine() { if (eng) eng.g.gain.setTargetAtTime(0, AC.currentTime, .1); }
function updateEngine() { if (!eng || !G.player) return; const p = G.player, v = Math.abs(p.v), gear = Math.min(6, Math.floor(v / 10.5)), rpm = (v - gear * 10.5) / 10.5; const fr = 70 + gear * 14 + rpm * 150 + (G.phase === 'count' && playerInput().thr ? 120 : 0); eng.o.frequency.setTargetAtTime(fr, AC.currentTime, .04); eng.o2.frequency.setTargetAtTime(fr * .5, AC.currentTime, .04); eng.f.frequency.setTargetAtTime(600 + v * 30, AC.currentTime, .05); const on = !G.muted && !G.paused && (G.phase === 'race' || G.phase === 'count' || G.phase === 'finish'); eng.g.gain.setTargetAtTime(on ? .045 : 0, AC.currentTime, .08); }
function beep(f, d, type) { if (!AC || G.muted) return; const o = AC.createOscillator(), g = AC.createGain(); o.type = type || 'sine'; o.frequency.value = f; g.gain.value = .07; g.gain.exponentialRampToValueAtTime(.0001, AC.currentTime + d); o.connect(g); g.connect(AC.destination); o.start(); o.stop(AC.currentTime + d); }

/* ───────── UI ───────── */
const SCREENS = ['home', 'garage', 'setup', 'hud', 'pause', 'results'];
function show(id) { for (const s of SCREENS) $(s).classList.toggle('hidden', s !== id && !(id === 'pause' && s === 'hud')); }
function selectDriver(d) {
  G.driver = d; document.querySelectorAll('.dcard').forEach(e => e.classList.toggle('sel', e.dataset.id === d.id)); helmetArt($('dPortrait'), d);
  $('dNum').textContent = d.num; $('dNum').style.color = d.c1 === '#19191f' ? d.c2 : d.c1; $('dName').textContent = d.name; $('dTeam').textContent = d.team; $('dQuote').textContent = d.quote; $('gSpeed').style.width = d.speed * 20 + '%'; $('gTurn').style.width = d.turn * 20 + '%';
}
function renderCalendar() {
  const cup = G.mode === 'cup'; $('tLabel').textContent = cup ? 'Calendar — tap circuits to pick your four rounds' : 'Circuit'; $('btnShuffle').classList.toggle('hidden', !cup);
  document.querySelectorAll('.tcard').forEach(e => { const i = +e.dataset.i, k = G.cal.indexOf(i); e.classList.toggle('sel', cup ? k >= 0 : i === G.track); e.querySelector('.n').textContent = cup && k >= 0 ? 'ROUND ' + (k + 1) : ''; });
}
function buildUI() {
  const dg = $('dgrid'); DRIVERS.forEach(d => { const b = document.createElement('button'); b.className = 'dcard'; b.dataset.id = d.id; b.setAttribute('role', 'option'); b.innerHTML = `<canvas width="168" height="168"></canvas><b>${d.name}</b><small>${d.team}</small>`; helmetArt(b.firstChild, d); b.onclick = () => selectDriver(d); dg.appendChild(b); });
  selectDriver(DRIVERS[0]);
  const tg = $('tgrid'); TRACKS.forEach((t, i) => { const b = document.createElement('button'); b.className = 'tcard'; b.dataset.i = i; b.innerHTML = `<canvas width="320" height="200"></canvas><span class="n"></span><b>${t.name}</b><small>${t.sub}</small>`; trackThumb(b.firstChild, t); b.onclick = () => { if (G.mode === 'cup') { const k = G.cal.indexOf(i); if (k >= 0) G.cal.splice(k, 1); else { if (G.cal.length >= 4) G.cal.shift(); G.cal.push(i); } } else G.track = i; renderCalendar(); }; tg.appendChild(b); });
  const seg = (id, fn) => $(id).querySelectorAll('button').forEach(b => b.onclick = () => { $(id).querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)); fn(b.dataset.v); });
  seg('segMode', v => { G.mode = v; renderCalendar(); }); seg('segDiff', v => { G.diff = +v; });
  $('btnPlay').onclick = () => { initAudio(); show('garage'); }; $('btnBackHome').onclick = () => show('home'); $('btnToSetup').onclick = () => { show('setup'); renderCalendar(); }; $('btnBackGarage').onclick = () => show('garage');
  $('btnShuffle').onclick = () => { G.cal = TRACKS.map((_, i) => i).sort(() => Math.random() - .5).slice(0, 4); renderCalendar(); };
  $('btnRace').onclick = () => { if (G.mode === 'cup') { while (G.cal.length < 4) { const i = Math.floor(Math.random() * TRACKS.length); if (!G.cal.includes(i)) G.cal.push(i); } G.round = 0; G.pts = {}; startRace(G.cal[0]); } else startRace(G.track); };
  $('btnNext').onclick = () => { if (G.mode === 'cup' && G.round < G.cal.length - 1) { G.round++; startRace(G.cal[G.round]); } else if (G.mode === 'cup') { G.round = 0; G.pts = {}; startRace(G.cal[0]); } else startRace(G.track); };
  const quit = () => { stopEngine(); attract(); show('home'); };
  $('btnResQuit').onclick = quit; $('btnQuit').onclick = quit; $('btnResume').onclick = () => togglePause(false); $('btnRestart').onclick = () => startRace(G.track);
  // touch
  G.touch = matchMedia('(pointer:coarse)').matches;
  document.querySelectorAll('#touch button').forEach(b => { const k = b.dataset.k; const set = v => e => { e.preventDefault(); keys[k] = v; b.classList.toggle('dn', v); }; b.addEventListener('pointerdown', set(true)); b.addEventListener('pointerup', set(false)); b.addEventListener('pointercancel', set(false)); b.addEventListener('pointerleave', set(false)); });
}
function togglePause(v) { if (!['count', 'race', 'finish'].includes(G.phase)) return; G.paused = v == null ? !G.paused : v; show(G.paused ? 'pause' : 'hud'); }
const KEYMAP = { ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down', ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', ShiftLeft: 'drift', ShiftRight: 'drift', Space: 'drift', KeyC: 'look' };
addEventListener('keydown', e => {
  const k = KEYMAP[e.code]; if (k) { keys[k] = true; if (G.phase !== 'menu' && G.phase !== 'results') e.preventDefault(); }
  if (e.repeat) return;
  if (e.code === 'KeyE' || e.code === 'KeyX' || e.code === 'Enter') { if (G.phase === 'race') keys.item = true; }
  if (e.code === 'KeyM') G.muted = !G.muted;
  if (e.code === 'Escape' || e.code === 'KeyP') togglePause();
});
addEventListener('keyup', e => { const k = KEYMAP[e.code]; if (k) keys[k] = false; });
addEventListener('blur', () => { for (const k in keys) keys[k] = false; });

/* ───────── main loop ───────── */
let last = performance.now();
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min((now - last) / 1000, 1 / 20); last = now;
  if (!G.paused && G.phase !== 'results' && !(LD.on && G.phase === 'count')) { update(dt); if (G.player && G.phase !== 'menu') updateHud(); }
  updateCamera(dt); updateEngine();
  if (skyDome) skyDome.position.copy(camera.position);
  for (const c of crowd) { if (c.flag) c.o.rotation.y = Math.sin(now * .004 + c.ph) * .5; else c.o.position.y = Math.max(0, Math.sin(now * .001 * c.sp + c.ph)) * .16; }
  renderer.render(scene, camera);
}
/* loading screen: video backdrop + progress bar, shown at boot and while a circuit's scenery downloads */
const LD = { el: $('loading'), bar: $('ldBar'), vid: $('ldVid'), total: 0, done: 0, on: true, since: performance.now(), ended: false, max: 9000 };
// stays up until the assets are in AND the clip has played to its end (max is the fallback if the video can't play)
function ldPaint() {
  const el = performance.now() - LD.since, v = LD.vid, vf = v.duration ? v.currentTime / v.duration : el / LD.max;
  LD.bp = Math.max(LD.bp || 0, Math.min(LD.total ? LD.done / LD.total : 0, LD.ended ? 1 : vf)); LD.bar.style.width = Math.round(100 * LD.bp) + '%';
  if (LD.on && LD.done >= LD.total && (LD.ended || (el > LD.max && (v.paused || !v.currentTime)) || el > 20000)) ldHide();
}
LD.vid.addEventListener('ended', () => { if (LD.done >= LD.total) { LD.ended = true; ldPaint(); } else ldPlay(); });
setInterval(() => { if (LD.on) ldPaint(); }, 100);
LD.vid.addEventListener('error', () => { LD.max = 5000; });
function ldPlay() { try { LD.vid.currentTime = 0; } catch (e) {} const pr = LD.vid.play(); if (pr) pr.catch(() => {}); }
function track(p) { LD.total++; return p.then(v => { LD.done++; if (LD.on) ldPaint(); return v; }); }
function ldHide() { LD.on = false; LD.el.classList.add('out'); }
function ldShow() { if (LD.done >= LD.total) return; LD.total -= LD.done; LD.done = 0; LD.on = true; LD.ended = false; LD.bp = 0; LD.since = performance.now(); LD.el.classList.remove('out'); ldPlay(); ldPaint(); }
track(loadCarModel()).then(() => { buildUI(); attract(); requestAnimationFrame(frame); });

/* debug / test hook */
window.__G = { G, get T() { return T; }, TRACKS, DRIVERS, keys, update, startRace, sim(sec, dt = 1 / 60) { for (let i = 0, n = Math.round(sec / dt); i < n; i++) update(dt); } };
