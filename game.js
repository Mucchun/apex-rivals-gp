import * as THREE from 'three';
import { GLTFLoader } from './vendor/loaders/GLTFLoader.js';

window.__alive = true; // tells the page's failsafe that the game module started
/* Playgama build: index.html loads the Bridge SDK and initialises it before importing this module. */
const PG = typeof window.bridge !== 'undefined' && !!window.__pgReady;
let pgRaw = null, saveT = 0;
const LANG = PG ? String(bridge.platform.language || 'en') : 'en'; // the game ships in English, which is also the fallback
document.documentElement.lang = 'en';
if (PG) pgRaw = window.__pgSave; // the page reads the save through Bridge storage before starting the game
let webGet = () => null, webSet = () => {}, webDel = () => {};
webGet = () => localStorage.getItem('apexgp.save'); /*WEB-ONLY*/
webSet = v => localStorage.setItem('apexgp.save', v); /*WEB-ONLY*/
webDel = () => localStorage.removeItem('apexgp.save'); /*WEB-ONLY*/
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
/* ───────── icons (drawn, no emoji) ───────── */
const svg = (b, c) => '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="' + (c || 'currentColor') + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + b + '</svg>';
const IC = {
  ers: svg('<path d="M13 2 5 13h6l-1 9 9-12h-6z" fill="#ffd23f"/>', '#ffd23f'),
  oil: svg('<path d="M12 3c3 4 6 7 6 11a6 6 0 0 1-12 0c0-4 3-7 6-11z" fill="#20222b"/><path d="M9.5 14a2.5 2.5 0 0 0 2.5 2.5"/>', '#c9cde0'),
  tyre: svg('<circle cx="12" cy="12" r="9" fill="#20222b"/><circle cx="12" cy="12" r="3.5"/><path d="M12 3v5.5M12 15.5V21M3 12h5.5M15.5 12H21"/>', '#c9cde0'),
  shield: svg('<path d="M12 2 4 5v6c0 5 3.5 9 8 11 4.5-2 8-6 8-11V5z" fill="rgba(111,211,255,.3)"/><path d="m8.5 12 2.5 2.5 4.5-5"/>', '#6fd3ff'),
  flag: svg('<path d="M5 22V3"/><path d="M5 4h13l-3 4.5 3 4.5H5z" fill="#ffd23f"/>', '#ffd23f'),
  wings: svg('<path d="M3 15c3-9 10-11 18-11-1 3-3 4-5 5 1 1 2 1 3 1-2 3-5 4-7 4 0 2-3 4-9 1z" fill="rgba(255,255,255,.85)"/>', '#ffffff'),
  hex: svg('<circle cx="12" cy="11" r="7" fill="rgba(180,107,255,.4)"/><path d="M7 21h10M9 18h6M10 9l2-3 2 3-2 3z"/>', '#b46bff'),
  ice: svg('<path d="M12 2v20M3.5 7l17 10M20.5 7l-17 10M9 3.5l3 2.5 3-2.5M9 20.5l3-2.5 3 2.5"/>', '#9fe8ff'),
  portal: svg('<ellipse cx="12" cy="12" rx="6" ry="9" fill="rgba(122,75,255,.35)"/><path d="M12 7c2 1 3 3 3 5s-1 4-3 5c-1-1-1.6-3-1.6-5S11 8 12 7z"/>', '#a98bff'),
  jam: svg('<path d="M12 21v-9"/><circle cx="12" cy="10" r="2" fill="#ff3fa4"/><path d="M7.5 14.5a6.5 6.5 0 0 1 0-9M16.5 5.500a6.5 6.5 0 0 1 0 9M4.500 17.500a11 11 0 0 1 0-15M19.500 2.500a11 11 0 0 1 0 15"/>', '#ff3fa4'),
  bolt: svg('<path d="M7 14a4.500 4.500 0 0 1 .5-9 6 6 0 0 1 11.300 2A3.500 3.500 0 0 1 18 14" fill="rgba(255,255,255,.2)"/><path d="m13 11-3 5h4l-2 5" stroke="#fff27a"/>', '#e8ecf5'),
  megawing: svg('<path d="M3 8h18v3H3zM6 11v7M18 11v7M4 18h16"/>'),
  rockets: svg('<path d="M12 2c4 3 5 8 3 14H9C7 10 8 5 12 2z" fill="rgba(255,255,255,.2)"/><circle cx="12" cy="9" r="1.800"/><path d="M9 14l-3 4h3M15 14l3 4h-3M12 17v5" /><path d="M10.500 19.500 12 22l1.500-2.500" stroke="#ff8a1f"/>'),
  fin: svg('<path d="M3 19h18C13 18 8 13 6 4 4 10 3 14 3 19z" fill="rgba(255,255,255,.2)"/>'),
  pennant: svg('<path d="M6 22V2"/><path d="M6 3l13 4.500L6 12z" fill="#e10600"/>', '#ffffff'),
  horns: svg('<path d="M4 4c0 7 2 11 6 12-1-3-3-5-6-12zM20 4c0 7-2 11-6 12 1-3 3-5 6-12z" fill="#d3151b"/><path d="M8 19a5 5 0 0 0 8 0"/>', '#ff5a5a'),
  halo: svg('<ellipse cx="12" cy="7" rx="8" ry="3" stroke="#fff2a0"/><path d="M8 15a4 4 0 0 0 8 0v-1H8z" fill="rgba(255,255,255,.2)"/>'),
  crown: svg('<path d="M3 18 2 7l5.500 4.500L12 4l4.500 7.500L22 7l-1 11z" fill="#ffc531"/><path d="M4 21h16"/>', '#ffc531'),
  glow: c => svg('<ellipse cx="12" cy="15" rx="9" ry="4" fill="' + c + '" stroke="none" opacity=".55"/><ellipse cx="12" cy="15" rx="5.500" ry="2.300" fill="' + c + '" stroke="none"/><path d="M6 11h12l-2-4H8z"/>', '#e8ecf5'),
  coin: '<i class="coinic" aria-hidden="true"></i>',
  pause: svg('<path d="M8 5v14M16 5v14" stroke-width="3"/>'),
  sound: svg('<path d="M4 9v6h4l5 4V5L8 9z" fill="currentColor"/><path class="wave" d="M16.500 8.500a5 5 0 0 1 0 7M19 6a8.500 8.500 0 0 1 0 12"/><path class="mute" d="m17 9 5 6M22 9l-5 6"/>'),
};
const ITEMS = {
  ers: { icon: IC.ers, name: 'ERS BOOST' },
  oil: { icon: IC.oil, name: 'OIL SLICK' },
  tyre: { icon: IC.tyre, name: 'LOOSE TYRE' },
  shield: { icon: IC.shield, name: 'SHIELD' },
  flag: { icon: IC.flag, name: 'YELLOW FLAG' },
  wings: { icon: IC.wings, name: 'WINGS' },
  hex: { icon: IC.hex, name: 'SHRINK HEX' },
  ice: { icon: IC.ice, name: 'ICE SPELL' },
  portal: { icon: IC.portal, name: 'PORTAL SWAP' },
  jam: { icon: IC.jam, name: 'JAMMER' },
  bolt: { icon: IC.bolt, name: 'LIGHTNING' },
};

/* ───────── shop catalogue: paint, add-ons, turbo flames (bought with race coins) ───────── */
const PAINTS = {
  team: { name: 'Team colours', price: 0 },
  glacier: { name: 'Glacier', price: 200, col: '#8fe6ff', em: .34 },
  toxic: { name: 'Toxic', price: 200, col: '#a8ff3a', em: .45 },
  sunset: { name: 'Sunset', price: 200, col: '#ff7a3d', em: .34 },
  stealth: { name: 'Stealth Carbon', price: 250, col: '#2c2e36', em: .08, shin: 25 },
  neon: { name: 'Neon Pink', price: 250, col: '#ff2fa0', em: .65 },
  gold: { name: 'Gold Rush', price: 300, col: '#ffc531', em: .3, shin: 170, spec: '#fff2b0' },
  chrome: { name: 'Chrome', price: 400, col: '#e6ecf5', em: .16, shin: 230, spec: '#ffffff' },
  galaxy: { name: 'Galaxy', price: 600, col: '#7a4bff', em: .5, pulse: true },
  prism: { name: 'Prism (colour-shift)', price: 800, col: '#ffffff', em: .4, rainbow: true },
};
const ADDONS = {
  megawing: { slot: 'rear', name: 'Mega Wing', price: 300, icon: IC.megawing },
  rockets: { slot: 'rear', name: 'Rocket Boosters', price: 450, icon: IC.rockets },
  fin: { slot: 'top', name: 'Shark Fin', price: 200, icon: IC.fin },
  flag: { slot: 'top', name: 'Pennant', price: 150, icon: IC.pennant },
  horns: { slot: 'top', name: 'Devil Horns', price: 250, icon: IC.horns },
  halo: { slot: 'top', name: 'Angel Halo', price: 250, icon: IC.halo },
  crown: { slot: 'top', name: 'Crown', price: 350, icon: IC.crown },
  glowc: { slot: 'under', name: 'Underglow · Cyan', price: 250, icon: IC.glow('#35e0ff'), col: '#35e0ff' },
  glowp: { slot: 'under', name: 'Underglow · Pink', price: 250, icon: IC.glow('#ff3fa4'), col: '#ff3fa4' },
  glowg: { slot: 'under', name: 'Underglow · Gold', price: 250, icon: IC.glow('#ffd23f'), col: '#ffd23f' },
};
const TRAILS = {
  std: { name: 'Standard flame', price: 0, cols: ['#ffd23f', '#ff5a1f'] },
  blue: { name: 'Plasma', price: 150, cols: ['#6fd3ff', '#2f6bff'] },
  pink: { name: 'Bubblegum', price: 150, cols: ['#ff9bd3', '#ff3fa4'] },
  green: { name: 'Acid', price: 150, cols: ['#d7ff3f', '#35e08a'] },
  rainbow: { name: 'Rainbow', price: 400, rainbow: true, cols: ['#ffffff', '#ffffff'] },
};
/* Real-money coin packs. Each pack needs a payment link from the owner's own payment account (e.g. a Stripe Payment Link whose
   "after payment" redirect is this game's URL + ?pack=<id>&session_id={CHECKOUT_SESSION_ID}). With no links the tab stays hidden. */
const PAY = { packs: [
  { id: 'p500', coins: 500, price: '', url: '' },
  { id: 'p1500', coins: 1500, price: '', url: '' },
  { id: 'p5000', coins: 5000, price: '', url: '' },
] };
const SLOTS = { rear: 'Rear', top: 'Top', under: 'Underglow' };
const COINS = [120, 90, 75, 60, 50, 45, 40, 35, 30, 25, 20, 15];
const cleanCos = o => { o = o && typeof o === 'object' ? o : {}; const ad = (k, s) => ADDONS[k] && ADDONS[k].slot === s ? k : null; return { p: PAINTS[o.p] ? o.p : 'team', rear: ad(o.rear, 'rear'), top: ad(o.top, 'top'), under: ad(o.under, 'under'), t: TRAILS[o.t] ? o.t : 'std' }; };
const cleanName = s => String(s || '').replace(/[^\p{L}\p{N} _-]/gu, '').trim().slice(0, 12);
function loadSave() {
  let s = {}; try { const raw = PG ? pgRaw : webGet(); s = (typeof raw === 'string' ? JSON.parse(raw) : raw) || {}; } catch (e) {}
  const st = s.stats && typeof s.stats === 'object' ? s.stats : {};
  const uid = /^[A-Z0-9]{8}$/.test(s.uid) ? s.uid : Array.from({ length: 8 }, () => pick('ABCDEFGHJKLMNPQRSTUVWXYZ23456789')).join('');
  const friends = Array.isArray(s.friends) ? s.friends.filter(f => f && /^[A-Z0-9]{8}$/.test(f.id)).slice(0, 50).map(f => ({ id: f.id, name: cleanName(f.name) })) : [];
  return { uid, friends, day: typeof s.day === 'string' ? s.day : '', coins: Number.isFinite(s.coins) ? s.coins : 250, owned: Array.isArray(s.owned) ? s.owned.filter(x => typeof x === 'string') : [], eq: cleanCos(s.eq), name: cleanName(s.name), driver: typeof s.driver === 'string' ? s.driver : 'val',
    set: { mute: !!(s.set && s.set.mute), hq: !(s.set && s.set.hq === false) },
    tut: !!s.tut, ms: s.ms, tot: s.tot, paid: Array.isArray(s.paid) ? s.paid.filter(x => typeof x === 'string').slice(-200) : [],
    stats: { races: st.races | 0, wins: st.wins | 0, podiums: st.podiums | 0, oraces: st.oraces | 0, owins: st.owins | 0, best: st.best && typeof st.best === 'object' ? st.best : {} } };
}
const SAVE = loadSave();
function saveSave() { if (PG) { clearTimeout(saveT); saveT = setTimeout(() => { try { bridge.storage.set(['apexgp.save'], [JSON.stringify(SAVE)]).catch(() => {}); } catch (e) {} }, 500); } else try { webSet(JSON.stringify(SAVE)); } catch (e) {} }
const carCol = (d, cos) => { const p = cos && PAINTS[cos.p]; return p && p.col && !p.rainbow ? p.col : chip(d); };

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
let VIEWDX = 0;
function resize() { const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false); camera.aspect = w / h; const dx = VIEWDX; if (dx && w > 820) camera.setViewOffset(w, h, w * dx, 0, w, h); else if (dx) camera.setViewOffset(w, h, 0, h * .22, w, h); else camera.clearViewOffset(); camera.updateProjectionMatrix(); }
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
function makeCarMesh(d, cos, tag) {
  const g = new THREE.Group(), body = new THREE.Group(); g.add(body);
  const pt = cos && PAINTS[cos.p] && PAINTS[cos.p].col ? PAINTS[cos.p] : null, mats = [];
  if (carModel) {
    const inst = carModel.clone(true), tint = pt ? new THREE.Color(pt.col) : new THREE.Color(d.c1).lerp(new THREE.Color('#ffffff'), .08);
    inst.traverse(o => { if (o.isMesh) { const old = o.material; o.material = new THREE.MeshPhongMaterial({ map: old.map || null, color: tint, emissive: tint, emissiveMap: old.map || null, emissiveIntensity: pt && pt.em != null ? pt.em : .28, shininess: pt && pt.shin || 60, specular: pt && pt.spec || 0x333333 }); mats.push(o.material); } });
    body.add(inst);
    const helmet = new THREE.Mesh(new THREE.SphereGeometry(.2, 12, 10), new THREE.MeshPhongMaterial({ color: d.c2, shininess: 80 })); helmet.position.set(0, HELMET_Y, HELMET_Z); body.add(helmet);
    const sh = new THREE.Mesh(shadowGeo, shadowMat); sh.position.y = .04; g.add(sh);
    const bubble = new THREE.Mesh(new THREE.SphereGeometry(3, 16, 12), new THREE.MeshBasicMaterial({ color: '#6fd3ff', transparent: true, opacity: .28, depthWrite: false })); bubble.position.y = .8; bubble.visible = false; g.add(bubble);
    const dummy = new THREE.Object3D();
    return dress({ g, body, wheels: [dummy, dummy], flap: dummy, bubble, sh, mats }, d, cos, tag);
  }
  const m1 = new THREE.MeshPhongMaterial({ color: pt ? pt.col : d.c1, shininess: 70 }), m2 = new THREE.MeshPhongMaterial({ color: d.c2, shininess: 70 });
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
  mats.push(m1); return dress({ g, body, wheels, flap, bubble, sh, mats }, d, cos, tag);
}
/* extras every car carries (wings for the WINGS power, ice block, name tag) + shop add-ons */
const wingGeo = (() => { const s = new THREE.Shape(); s.moveTo(0, 0); s.quadraticCurveTo(1.2, .9, 3.0, .5); s.quadraticCurveTo(2.2, .1, 2.5, -.25); s.quadraticCurveTo(1.6, -.2, 1.7, -.6); s.quadraticCurveTo(.9, -.45, .8, -.8); s.quadraticCurveTo(.3, -.5, 0, -.45); return new THREE.ShapeGeometry(s, 5).rotateX(-Math.PI / 2); })();
const wingMat = new THREE.MeshBasicMaterial({ color: '#fdfbf2', side: THREE.DoubleSide, transparent: true, opacity: .94 });
const iceGeo = new THREE.BoxGeometry(2.9, 1.9, 6.2), iceMat = new THREE.MeshPhongMaterial({ color: '#bfeaff', transparent: true, opacity: .5, shininess: 120, depthWrite: false });
const goldMat = new THREE.MeshPhongMaterial({ color: '#ffc531', emissive: '#7a4a00', shininess: 160, specular: '#fff2b0' });
const glowTex = tex(64, 64, (g, w, h) => { const gr = g.createRadialGradient(w / 2, h / 2, 1, w / 2, h / 2, w / 2); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.5, 'rgba(255,255,255,.5)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
function nameTag(text, col) {
  const cv = document.createElement('canvas'); cv.width = 256; cv.height = 64; const g = cv.getContext('2d');
  g.font = 'italic 900 30px Arial Black, Arial'; const w = Math.min(244, g.measureText(text).width + 34); g.fillStyle = 'rgba(10,11,16,.82)'; g.beginPath(); g.roundRect ? g.roundRect(128 - w / 2, 8, w, 46, 10) : g.rect(128 - w / 2, 8, w, 46); g.fill();
  g.fillStyle = col; g.fillRect(128 - w / 2, 48, w, 6); g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, 128, 30, 230);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false })); sp.scale.set(3.2, .8, 1); sp.position.y = 2.5; return sp;
}
function addonMesh(key, d) {
  const g = new THREE.Group(), acc = new THREE.MeshPhongMaterial({ color: d.c2, shininess: 80 }), dark = carbon;
  const add = (geo, mat, x, y, z) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); g.add(m); return m; };
  if (key === 'megawing') { add(new THREE.BoxGeometry(2.7, .07, .75), acc, 0, 1.78, -2.5); add(new THREE.BoxGeometry(2.7, .06, .4), dark, 0, 1.5, -2.62); for (const s of [-1, 1]) { add(new THREE.BoxGeometry(.07, 1.05, .95), acc, s * 1.36, 1.4, -2.5); add(new THREE.BoxGeometry(.08, .75, .12), dark, s * .45, 1.25, -2.45); } }
  else if (key === 'rockets') { const fl = new THREE.MeshBasicMaterial({ color: '#ffb23f' }); for (const s of [-1, 1]) { add(new THREE.CylinderGeometry(.2, .24, 1.5, 12).rotateX(Math.PI / 2), acc, s * .62, .78, -1.75); add(new THREE.ConeGeometry(.2, .45, 12).rotateX(Math.PI / 2), dark, s * .62, .78, -.8); add(new THREE.CylinderGeometry(.27, .2, .28, 12).rotateX(Math.PI / 2), dark, s * .62, .78, -2.6); add(new THREE.ConeGeometry(.14, .5, 10).rotateX(-Math.PI / 2), fl, s * .62, .78, -2.95); } }
  else if (key === 'fin') { const s = new THREE.Shape(); s.moveTo(0, 0); s.lineTo(1.7, 0); s.quadraticCurveTo(.5, .25, .15, .95); s.lineTo(0, 0); const m = add(new THREE.ExtrudeGeometry(s, { depth: .07, bevelEnabled: false }), acc, .035, .82, -2.0); m.rotation.y = -Math.PI / 2; }
  else if (key === 'flag') { add(new THREE.CylinderGeometry(.025, .025, 1.7, 6), dark, 0, 1.6, -1.5); const f = add(new THREE.PlaneGeometry(.75, .45), new THREE.MeshBasicMaterial({ color: d.c2, side: THREE.DoubleSide }), 0, 2.2, -1.9); f.rotation.y = Math.PI / 2; g.userData.flag = f; }
  else if (key === 'horns') { const red = new THREE.MeshPhongMaterial({ color: '#d3151b', emissive: '#400', shininess: 90 }); for (const s of [-1, 1]) { const h = add(new THREE.ConeGeometry(.1, .5, 10), red, s * .22, HELMET_Y + .32, HELMET_Z); h.rotation.z = -s * .5; } }
  else if (key === 'halo') { const h = add(new THREE.TorusGeometry(.3, .045, 8, 24).rotateX(Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#fff2a0' }), 0, HELMET_Y + .6, HELMET_Z); g.userData.bob = h; }
  else if (key === 'crown') { add(new THREE.CylinderGeometry(.24, .22, .16, 14, 1, true), goldMat, 0, HELMET_Y + .3, HELMET_Z).material = Object.assign(goldMat.clone(), { side: THREE.DoubleSide }); for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; add(new THREE.ConeGeometry(.07, .22, 6), goldMat, Math.cos(a) * .23, HELMET_Y + .47, HELMET_Z + Math.sin(a) * .23); } add(new THREE.SphereGeometry(.05, 8, 6), new THREE.MeshBasicMaterial({ color: '#ff3f6a' }), 0, HELMET_Y + .32, HELMET_Z + .24); }
  else if (ADDONS[key] && ADDONS[key].col) { const m = add(new THREE.PlaneGeometry(4.6, 8.4).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: glowTex, color: ADDONS[key].col, transparent: true, opacity: .9, depthWrite: false, blending: THREE.AdditiveBlending }), 0, .07, 0); g.userData.glow = m; }
  return g;
}
function dress(m, d, cos, tag) {
  const p = cos && PAINTS[cos.p]; m.rainbow = !!(p && p.rainbow); m.pulse = !!(p && p.pulse); m.em = p && p.em != null ? p.em : .28; m.extra = [];
  m.wings = new THREE.Group(); m.wingL = new THREE.Mesh(wingGeo, wingMat); m.wingR = new THREE.Mesh(wingGeo, wingMat); m.wingL.position.set(.5, 1.05, -.2); m.wingR.position.set(-.5, 1.05, -.2); m.wingR.scale.x = -1; m.wings.add(m.wingL, m.wingR); m.wings.visible = false; m.body.add(m.wings);
  m.ice = new THREE.Mesh(iceGeo, iceMat); m.ice.position.y = .95; m.ice.visible = false; m.g.add(m.ice);
  if (cos) for (const s in SLOTS) if (cos[s] && ADDONS[cos[s]]) { const a = addonMesh(cos[s], d); m.body.add(a); m.extra.push(a); }
  if (tag) { m.tag = nameTag(tag, carCol(d, cos)); m.g.add(m.tag); }
  return m;
}
const hueCol = new THREE.Color();
function paintAnim(m, t) {
  if (m.rainbow) { hueCol.setHSL((t * .22) % 1, .95, .56); for (const mt of m.mats) { mt.color.copy(hueCol); if (mt.emissive) mt.emissive.copy(hueCol); } }
  else if (m.pulse) for (const mt of m.mats) mt.emissiveIntensity = m.em + Math.sin(t * 3) * .28;
  for (const a of m.extra) { const u = a.userData; if (u.flag) u.flag.rotation.y = Math.PI / 2 + Math.sin(t * 9) * .35; if (u.bob) u.bob.position.y = HELMET_Y + .6 + Math.sin(t * 3) * .04; if (u.glow) u.glow.material.opacity = .7 + Math.sin(t * 4) * .2; }
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

function spawnCars(playerDriver, menu) {
  const others = DRIVERS.filter(d => d !== playerDriver).sort(() => Math.random() - .5);
  const grid = !playerDriver ? others : menu ? [playerDriver, ...others] : [...others.slice(0, 7), playerDriver, ...others.slice(7)];
  const base = [.87, .925, .975][G.diff], spread = .07;
  spawnGrid(grid.map((d, k) => d === playerDriver ? { driver: d.id, own: 'me', cos: SAVE.eq, name: menu ? (SAVE.name || d.name) : null } : { driver: d.id, own: 'bot', skill: base + spread * (1 - k / 11) * rnd(.6, 1), launch: rnd(0, 1), name: menu ? d.name : null }), menu);
}
// entries: [{ driver, own: 'me' | 'bot' | peerId, name, cos, skill, launch }]
function spawnGrid(entries, tags) {
  for (const c of G.cars) scene.remove(c.mesh.g);
  for (const o of G.oils) scene.remove(o.m); for (const o of G.tyres) scene.remove(o.m); G.oils = []; G.tyres = [];
  const net = G.mode === 'net' && NET.on;
  G.cars = entries.map((e, k) => {
    const d = DRIVERS.find(x => x.id === e.driver) || DRIVERS[0], bot = e.own === 'bot', mine = e.own === 'me' || (net && e.own === NET.id), human = !bot;
    const cos = e.cos ? cleanCos(e.cos) : null, label = e.name ? cleanName(e.name) || d.name : null;
    const mesh = makeCarMesh(d, cos, tags || (net && human && !mine) ? (label || d.name) : null); scene.add(mesh.g);
    const ti = (T.n - Math.round((7 + k * 6) / T.ds) + T.n) % T.n, lat = k % 2 ? 3.6 : -3.6, p = at(ti, lat, {});
    const c = { id: k, own: e.own, mine, local: mine || (bot && (!net || NET.host)), name: label || d.name, tla: human && label ? label.slice(0, 3).toUpperCase() : d.tla, col: carCol(d, cos), cos,
      d, mesh, ai: bot, x: p.x, z: p.z, y: 0, h: Math.atan2(T.tx[ti], T.tz[ti]), vd: 0, v: 0, ti, prog: ti - T.n, lat, along: 0, lap: 0, place: k + 1, fin: null, best: null, lapStart: 0,
      drift: 0, charge: 0, boost: 0, spin: 0, spinA: 0, inv: 0, slow: 0, shield: 0, tow: 0, drs: false, item: null, itemT: 0, stuck: 0, off: false, wob: 0, fly: 0, tiny: 0, ice: 0, jam: 0, tin: 0, net: null,
      speedMul: .955 + d.speed * .011, turnMul: .8 + d.turn * .05,
      skill: bot ? e.skill || .93 : 1, lane: lat, laneT: rnd(2, 6), rub: 1, yaw: 0, launch: bot ? e.launch || 0 : 0 };
    c.vd = c.h; return c;
  });
  G.player = G.cars.find(c => c.mine) || null;
  G.order = G.cars.slice();
}

function hit(c, why) {
  if (c.shield > 0) { c.shield = 0; c.inv = 1; if (c === G.player) msg('SHIELD SAVED YOU', '#6fd3ff'); for (let i = 0; i < 14; i++) spark(c.x, 1, c.z, rnd(-8, 8), rnd(2, 8), rnd(-8, 8), '#6fd3ff', .5); return; }
  if (c.inv > 0 || c.spin > 0) return;
  c.spin = 1.15; c.inv = 3; c.drift = 0; c.charge = 0; c.boost = 0; c.fly = Math.min(c.fly, .3);
  if (c === G.player && RX()) G.rx.spins++;
  if (c === G.player) { msg(why, '#ffd23f'); sfx('hit'); }
}
/* hazards carry ids so every player in an online room removes the same one */
let hazN = 0; const hazId = c => c.id + '.' + (hazN++) + '.' + (NET.id ? NET.id.slice(-5) : 'x');
function spawnOil(x, z, owner, id) { const m = new THREE.Mesh(oilGeo, oilMat); m.position.set(x, .05, z); scene.add(m); G.oils.push({ id, m, x, z, life: 40, owner, arm: .6 }); }
function spawnTyre(s, lat, owner, id) { const m = new THREE.Mesh(tyreGeo, tyreMat); scene.add(m); G.tyres.push({ id, m, s, lat, owner, life: 5 }); }
function rmHaz(id) { for (const L of [G.oils, G.tyres]) { const i = L.findIndex(o => o.id === id); if (i >= 0) { scene.remove(L[i].m); L.splice(i, 1); } } }
/* magic / sabotage: the car's owner applies the effect, everyone sees the flash */
const FXCOL = { hex: '#b46bff', ice: '#9fe8ff', jam: '#ff3fa4', bolt: '#fff27a', slow: '#ffd23f', portal: '#7a4bff' };
function zapFx(c, kind) {
  const col = FXCOL[kind] || '#fff';
  if (kind === 'bolt') { for (let i = 0; i < 46; i++) spark(c.x + rnd(-.5, .5), rnd(0, 22), c.z + rnd(-.5, .5), rnd(-2, 2), rnd(-6, 2), rnd(-2, 2), i % 3 ? col : '#ffffff', rnd(.2, .5)); if (G.player && Math.hypot(c.x - G.player.x, c.z - G.player.z) < 200) sfx('bolt'); }
  else for (let i = 0; i < 22; i++) { const a = i / 22 * Math.PI * 2; spark(c.x + Math.cos(a) * 2, rnd(.3, 2), c.z + Math.sin(a) * 2, Math.cos(a) * 3, rnd(2, 7), Math.sin(a) * 3, col, .6); }
}
function applyFx(c, kind, d, from) {
  const me = c === G.player;
  if (kind === 'portal') { if (Array.isArray(d) && d.length >= 4 && d.every(Number.isFinite)) { c.x = d[0]; c.z = d[1]; c.h = c.vd = d[2]; c.prog = Math.round(d[3]); c.ti = ((c.prog % T.n) + T.n) % T.n; locate(c); c.inv = Math.max(c.inv, 1.2); c.drift = 0; if (me) { G.camH = c.h; if (from !== c) msg('PORTAL! YOU WERE SWAPPED BACK', FXCOL.portal); } } return; }
  if (kind === 'bolt') { hit(c, 'STRUCK BY LIGHTNING'); return; }
  if (c.shield > 0) { c.shield = 0; c.inv = 1; if (me) msg('SHIELD SAVED YOU', '#6fd3ff'); return; }
  if (kind === 'slow') { c.slow = 3.6; if (me) msg('YELLOW FLAG — SLOW DOWN', '#ffd23f'); return; }
  if (c.inv > 0) return;
  if (kind === 'hex') { c.tiny = 5; if (me) { msg('HEXED — YOU SHRANK!', FXCOL.hex); sfx('hex', .8); } }
  else if (kind === 'ice') { c.ice = 2.4; c.drift = 0; c.charge = 0; if (me) { msg('FROZEN SOLID!', FXCOL.ice); sfx('ice', .7); } }
  else if (kind === 'jam') { c.jam = 3.6; if (me) { msg('JAMMED — STEERING REVERSED!', FXCOL.jam); sfx('jam'); } }
}
function fxTo(o, kind, from, d) { if (from && from === G.player && o !== from && RX()) G.rx.zaps++; zapFx(o, kind); if (o.local) applyFx(o, kind, d, from); else netEv({ k: 'fx', fx: kind, to: o.id, from: from ? from.id : -1, d }); }
function useItem(c) {
  const it = c.item; if (!it) return; c.item = null; const me = c === G.player; if (me) { TUT.used = true; if (RX()) G.rx.items++; } const pos = o => o.prog + o.along / T.ds;
  const ahead = G.order.filter(o => o !== c && o.fin == null && pos(o) > pos(c)), next = ahead[ahead.length - 1];
  if (it === 'ers') { c.boost = Math.max(c.boost, 2.3); if (me) sfx('boost'); }
  else if (it === 'shield') c.shield = 9;
  else if (it === 'oil') { const x = c.x - Math.sin(c.h) * 4.5, z = c.z - Math.cos(c.h) * 4.5, id = hazId(c); spawnOil(x, z, c, id); netEv({ k: 'oil', x, z, owner: c.id, id }); }
  else if (it === 'tyre') { const s = c.ti + 2 + c.along / T.ds, lat = clamp(c.lat, -HALF + 1, HALF - 1), id = hazId(c); spawnTyre(s, lat, c, id); netEv({ k: 'tyre', s, lat, owner: c.id, id }); }
  else if (it === 'flag') { for (const o of ahead) fxTo(o, 'slow', c); if (me) msg(ahead.length ? 'YELLOW FLAG: ' + ahead.length + ' CARS SLOWED' : 'NOBODY AHEAD…', '#ffd23f'); }
  else if (it === 'wings') { c.fly = 4.6; if (me) { msg('WINGS — FLY OVER THEM!', '#ffd23f'); sfx('wings'); } }
  else if (it === 'hex') { if (next) { fxTo(next, 'hex', c); if (me) msg('HEX! ' + next.tla + ' SHRANK', FXCOL.hex); } else c.boost = Math.max(c.boost, 1.2); }
  else if (it === 'ice') { const tg = ahead.slice(-2); for (const o of tg) fxTo(o, 'ice', c); if (me) msg(tg.length ? 'ICE SPELL! ' + tg.map(o => o.tla).join(' + ') + ' FROZEN' : 'NOBODY AHEAD…', FXCOL.ice); }
  else if (it === 'portal') {
    if (next) { const mine = [c.x, c.z, c.h, c.prog], theirs = [next.x, next.z, next.h, next.prog]; zapFx(c, 'portal'); applyFx(c, 'portal', theirs, c); fxTo(next, 'portal', c, mine); if (me) { msg('PORTAL! SWAPPED WITH ' + next.tla, FXCOL.portal); sfx('portal'); } }
    else c.boost = Math.max(c.boost, 1.2);
  }
  else if (it === 'jam') { let n = 0; for (const o of G.cars) if (o !== c && o.fin == null && Math.hypot(o.x - c.x, o.z - c.z) < 48) { fxTo(o, 'jam', c); n++; } if (me) msg(n ? 'JAMMER! ' + n + ' CARS SCRAMBLED' : 'NOBODY IN RANGE…', FXCOL.jam); }
  else if (it === 'bolt') { const tg = G.order.find(o => o !== c && o.fin == null); if (tg) { fxTo(tg, 'bolt', c); if (me) msg('LIGHTNING ON ' + tg.tla + '!', FXCOL.bolt); } }
}
function rollItem(c) { const f = (c.place - 1) / Math.max(1, G.cars.length - 1); const w = { ers: .8 + f * 1.4, oil: 1.2 - f, tyre: 1, shield: 1 - f * .5, flag: f < .15 ? 0 : f * 1.2, wings: .5 + f * 1.1, hex: f < .05 ? 0 : .9, ice: f < .05 ? 0 : .8, portal: f < .1 ? 0 : .3 + f * .9, jam: .8, bolt: f < .2 ? 0 : f * 1.1 }; let tot = 0; for (const k in w) tot += w[k]; let r = Math.random() * tot; for (const k in w) { r -= w[k]; if (r <= 0) return k; } return 'ers'; }

/* ───────── driving ───────── */
function locate(c) {
  const N = T.n; let best = c.ti, bd = 1e18;
  for (let k = -6; k <= 10; k++) { const i = ((c.ti + k) % N + N) % N, dx = c.x - T.px[i], dz = c.z - T.pz[i], d = dx * dx + dz * dz; if (d < bd) { bd = d; best = i; } }
  let d = best - c.ti; if (d > N / 2) d -= N; if (d < -N / 2) d += N; c.prog += d; c.ti = best;
  const dx = c.x - T.px[best], dz = c.z - T.pz[best]; c.lat = dx * T.nx[best] + dz * T.nz[best]; c.along = dx * T.tx[best] + dz * T.tz[best];
}
function stepCar(c, dt, inp) {
  if (c.spin > 0) { c.spin -= dt; c.spinA += dt * 12; c.v *= Math.exp(-2.2 * dt); inp = { thr: 0, brk: 0, turn: 0, drift: false }; if (c.spin <= 0) c.spinA = 0; }
  c.inv = Math.max(0, c.inv - dt); c.shield = Math.max(0, c.shield - dt); c.fly = Math.max(0, c.fly - dt); c.tiny = Math.max(0, c.tiny - dt); c.ice = Math.max(0, c.ice - dt); c.jam = Math.max(0, c.jam - dt);
  c.y += ((c.fly > 0 ? 4.2 * Math.min(1, c.fly / .7) : 0) - c.y) * Math.min(1, 5 * dt); if (c.y < .02) c.y = 0;
  if (c.ice > 0) inp = { thr: 0, brk: 0, turn: inp.turn * .1, drift: false };
  else if (c.jam > 0) inp = { thr: inp.thr, brk: inp.brk, drift: false, turn: c.ai ? clamp(inp.turn + Math.sin(G.t * 9 + c.id) * 1.2, -1, 1) : -inp.turn };
  c.tin = inp.turn;
  c.off = Math.abs(c.lat) > HALF + 1.8 && c.y < 1;
  let vmax = VMAX * c.speedMul * (c.ai ? c.skill * c.rub : 1);
  const boosting = c.boost > 0;
  if (boosting) { vmax *= 1.3; c.boost -= dt; } else if (c.drs) vmax *= 1.07;
  if (c.fly > 0) vmax *= 1.14; if (c.tiny > 0) vmax *= .72;
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
    if (lv && !c.off) { c.boost = Math.max(c.boost, [0, .8, 1.4, 2.1][lv]); if (c === G.player) { const r = RX(); if (r) { r.turbos++; if (lv === 3) r.ultra++; } sfx('turbo', .8, .85 + lv * .15); msg(['', 'TURBO', 'SUPER TURBO', 'ULTRA TURBO'][lv], ['', '#39a8ff', '#ff8a1f', '#b46bff'][lv]); } }
    c.drift = 0; c.charge = 0;
  }
  let grip = c.ice > 0 ? 1.3 : 9;
  if (c.drift) { const a = inp.turn * c.drift; c.h += c.drift * om * (1.02 + .55 * a) * dt; c.charge += dt * (1 + .7 * a); grip = 2.8; }
  else c.h += inp.turn * om * dt;
  let slip = wrap(c.h - c.vd); slip = clamp(slip, -1, 1); c.vd = c.h - slip * Math.exp(-grip * dt);
  c.x += Math.sin(c.vd) * c.v * dt; c.z += Math.cos(c.vd) * c.v * dt;
  locate(c);
  if (Math.abs(c.lat) > LIMIT) { const s = Math.sign(c.lat), over = Math.abs(c.lat) - LIMIT; c.x -= T.nx[c.ti] * over * s; c.z -= T.nz[c.ti] * over * s; c.lat = s * LIMIT; c.v *= Math.exp(-1.6 * dt); const th = Math.atan2(T.tx[c.ti], T.tz[c.ti]) + (c.v < 0 ? Math.PI : 0); c.vd += wrap(th - c.vd) * Math.min(1, 6 * dt); if (c.ai) c.h += wrap(th - c.h) * Math.min(1, 4 * dt); }
  carVisual(c, dt, inp.turn, boosting);
}
function carVisual(c, dt, turn, boosting) {
  const sp = Math.abs(c.v), m = c.mesh;
  const targetYaw = c.drift ? c.drift * .32 : 0; c.yaw += (targetYaw - c.yaw) * Math.min(1, 8 * dt);
  m.g.position.set(c.x, c.y, c.z); m.g.rotation.y = c.h + c.yaw + c.spinA;
  const sc = lerp(m.g.scale.x, c.tiny > 0 ? .5 : 1, Math.min(1, 8 * dt)); m.g.scale.setScalar(sc); m.sh.position.y = .04 - c.y / sc;
  m.body.rotation.z = lerp(m.body.rotation.z, -turn * (.035 * Math.min(1, sp / 30) + (c.y > .3 ? .22 : 0)), .2);
  m.body.position.y = c.off && sp > 8 ? Math.sin(G.t * 40 + c.ti) * .04 : 0;
  m.wheels[0].rotation.y = m.wheels[1].rotation.y = turn * .35;
  m.flap.rotation.x = lerp(m.flap.rotation.x, c.drs || boosting ? -.9 : 0, .2);
  m.bubble.visible = c.shield > 0; m.ice.visible = c.ice > 0;
  m.wings.visible = c.y > .12; if (m.wings.visible) { const f = Math.sin(G.t * 13 + c.id) * .5; m.wingL.rotation.z = .2 + f; m.wingR.rotation.z = -.2 - f; }
  if (c.inv > 0 && c.spin <= 0) m.body.visible = Math.floor(G.t * 14) % 2 === 0; else m.body.visible = true;
  paintAnim(m, G.t + c.id * .37);
  // fx
  const bx = c.x - Math.sin(c.h) * 2.3, bz = c.z - Math.cos(c.h) * 2.3;
  if (c.drift && c.charge > .9 && Math.random() < .8) { const colr = c.charge > 3 ? '#b46bff' : c.charge > 1.9 ? '#ff8a1f' : '#39a8ff'; const sx = Math.cos(c.h) * .9 * -c.drift; const sz = -Math.sin(c.h) * .9 * -c.drift; spark(bx + sx, .2, bz + sz, rnd(-3, 3), rnd(2, 6), rnd(-3, 3), colr, .35); }
  if (boosting && Math.random() < .9) { const tr = TRAILS[c.cos && c.cos.t] || TRAILS.std; spark(bx, .55 + c.y, bz, -Math.sin(c.h) * 10 + rnd(-2, 2), rnd(0, 2), -Math.cos(c.h) * 10 + rnd(-2, 2), tr.rainbow ? 'hsl(' + Math.floor(Math.random() * 360) + ',100%,62%)' : pick(tr.cols), .3); }
  if (c.off && sp > 12 && Math.random() < .5) spark(bx, .2, bz, rnd(-3, 3), rnd(2, 5), rnd(-3, 3), T.def.th.ground2, .5);
  if (c.y > .3 && Math.random() < .6) spark(c.x + rnd(-1.5, 1.5), c.y + .4, c.z + rnd(-1.5, 1.5), rnd(-1, 1), rnd(-1, 1), rnd(-1, 1), '#fff6c9', .5);
  if (c.jam > 0 && Math.random() < .5) spark(c.x + rnd(-1, 1), 1.4 + c.y, c.z + rnd(-1, 1), rnd(-4, 4), rnd(1, 5), rnd(-4, 4), '#ff3fa4', .3);
  if (c.tiny > 0 && Math.random() < .3) spark(c.x, .8, c.z, rnd(-3, 3), rnd(2, 5), rnd(-3, 3), '#b46bff', .4);
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
function startRace(trackIdx, net) {
  G.rx = { items: 0, zaps: 0, ultra: 0, turbos: 0, over: 0, perfect: 0, spins: 0, drs: 0, start: 0, lp: 0 };
  if (!net && G.mode === 'net') G.mode = G.prevMode || 'cup';
  G.shopFlame = null; if (G.viewDx) setView(0);
  G.track = trackIdx; buildWorld(TRACKS[trackIdx]); if (net) spawnGrid(net.grid); else spawnCars(G.driver);
  G.phase = 'count'; G.t = 0; G.rt = 0; G.lightsOut = net ? net.lightsOut : 6 + rnd(.2, 1.1); G.finT = 0; G.paused = false; G.thrDown = null; G.lit = -1; G.camH = G.player ? G.player.h : 0;
  show('hud'); $('lights').classList.remove('hidden'); $('hTrack').textContent = TRACKS[trackIdx].name.toUpperCase(); $('hBest').textContent = '';
  for (const k in keys) keys[k] = false;
  $('touch').classList.add('on'); initAudio(); music('music_race' + (1 + trackIdx % 3)); if (!SAVE.tut) { TUT.step = 0; TUT.t = 0; TUT.used = false; } updateHud(true); ldShow();
}
function attract() { G.phase = 'menu'; G.paused = false; buildWorld(pick(TRACKS)); spawnCars(G.driver, true); $('touch').classList.remove('on'); refreshHome(); music('music_menu'); }
/* ───────── missions: three daily aims + tiered career goals, each pays coins ───────── */
const MDAILY = [
  { id: 'race3', txt: 'Finish 3 races', n: 3, r: 80, f: s => 1 },
  { id: 'pod', txt: 'Finish on the podium', n: 1, r: 120, f: s => s.pos <= 3 },
  { id: 'win', txt: 'Win a race', n: 1, r: 150, f: s => s.pos === 1 },
  { id: 'top5', txt: 'Finish in the top 5 twice', n: 2, r: 100, f: s => s.pos <= 5 },
  { id: 'items', txt: 'Use 8 power-ups', n: 8, r: 80, f: s => s.items },
  { id: 'zaps', txt: 'Hit rivals with power-ups 4 times', n: 4, r: 100, f: s => s.zaps },
  { id: 'ultra', txt: 'Fire 3 ULTRA TURBOS (long drifts)', n: 3, r: 100, f: s => s.ultra },
  { id: 'turbo', txt: 'Fire 12 drift turbos', n: 12, r: 80, f: s => s.turbos },
  { id: 'over', txt: 'Overtake 15 cars', n: 15, r: 100, f: s => s.over },
  { id: 'launch', txt: 'Get 2 perfect launches', n: 2, r: 90, f: s => s.perfect },
  { id: 'clean', txt: 'Finish a race without spinning out', n: 1, r: 110, f: s => !s.spins },
  { id: 'drs', txt: 'Spend 30 seconds in the slipstream', n: 30, r: 80, f: s => Math.floor(s.drs) },
  { id: 'gain', txt: 'Gain 6 places in a single race', n: 1, r: 120, f: s => s.gain >= 6 },
];
const MALL = 150; // bonus for clearing all three daily missions
const MCAREER = [
  { id: 'races', txt: n => 'Finish ' + n + ' race' + (n > 1 ? 's' : ''), v: () => SAVE.stats.races, t: [[1, 50], [10, 150], [50, 400], [200, 1000]] },
  { id: 'wins', txt: n => 'Win ' + n + ' race' + (n > 1 ? 's' : ''), v: () => SAVE.stats.wins, t: [[1, 100], [10, 300], [50, 800]] },
  { id: 'pods', txt: n => 'Score ' + n + ' podiums', v: () => SAVE.stats.podiums, t: [[5, 150], [25, 400], [100, 1000]] },
  { id: 'ultra', txt: n => 'Fire ' + n + ' ULTRA TURBOS', v: () => SAVE.tot.ultra, t: [[10, 120], [50, 300], [250, 800]] },
  { id: 'zaps', txt: n => 'Hit rivals with power-ups ' + n + ' times', v: () => SAVE.tot.zaps, t: [[10, 120], [75, 350], [300, 900]] },
  { id: 'over', txt: n => 'Overtake ' + n + ' cars', v: () => SAVE.tot.over, t: [[50, 120], [300, 400], [1500, 1000]] },
  { id: 'tracks', txt: n => n >= TRACKS.length ? 'Win on every circuit' : 'Win on ' + n + ' different circuits', v: () => SAVE.tot.won.length, t: [[3, 200], [6, 600]] },
  { id: 'champ', txt: n => n > 1 ? 'Win ' + n + ' championships' : 'Become World Champion', v: () => SAVE.tot.champs, t: [[1, 300], [5, 1000]] },
  { id: 'online', txt: n => 'Finish ' + n + ' online race' + (n > 1 ? 's' : ''), v: () => SAVE.stats.oraces, t: [[1, 100], [10, 300]] },
];
const msDay = () => new Date().toISOString().slice(0, 10);
function msInit() {
  const m = SAVE.ms && typeof SAVE.ms === 'object' ? SAVE.ms : {}, t = SAVE.tot && typeof SAVE.tot === 'object' ? SAVE.tot : {};
  const ct = {}; if (m.ct && typeof m.ct === 'object') for (const k in m.ct) if (MCAREER.some(c => c.id === k)) ct[k] = m.ct[k] | 0;
  const d = Array.isArray(m.d) ? m.d.filter(x => x && MDAILY.some(q => q.id === x.id)).slice(0, 3).map(x => ({ id: x.id, p: Math.max(0, +x.p || 0), c: !!x.c })) : [];
  SAVE.ms = { day: typeof m.day === 'string' ? m.day : '', d, all: !!m.all, ct };
  SAVE.tot = { ultra: t.ultra | 0, zaps: t.zaps | 0, over: t.over | 0, items: t.items | 0, champs: t.champs | 0, won: Array.isArray(t.won) ? t.won.filter(x => typeof x === 'string') : [] };
  msRoll();
}
/* the same three missions for everyone on a given day (seeded by the date) */
function msRoll() {
  const day = msDay(); if (SAVE.ms.day === day && SAVE.ms.d.length === 3) return;
  let h = 2166136261; for (const ch of day) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  const pool = MDAILY.slice(), d = []; while (d.length < 3) { h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0; d.push({ id: pool.splice(h % pool.length, 1)[0].id, p: 0, c: false }); }
  SAVE.ms = { day, d, all: false, ct: SAVE.ms.ct }; saveSave();
}
const mDef = id => MDAILY.find(q => q.id === id);
const cTier = c => c.t[SAVE.ms.ct[c.id] || 0]; // next unclaimed tier, or undefined when maxed
/* every reward that is complete but not yet claimed */
function msReady() {
  const out = [];
  for (const x of SAVE.ms.d) { const q = mDef(x.id); if (!x.c && x.p >= q.n) out.push({ k: 'd', x, r: q.r }); }
  if (!SAVE.ms.all && SAVE.ms.d.every(x => x.c)) out.push({ k: 'all', r: MALL });
  for (const c of MCAREER) { const t = cTier(c); if (t && c.v() >= t[0]) out.push({ k: 'c', c, r: t[1] }); }
  return out;
}
/* per-race counters, only while the player is actually racing */
const RX = () => G.phase === 'race' && G.rx ? G.rx : null;
function msRace(s) {
  msRoll(); const before = new Set(msReady().map(o => o.k === 'c' ? o.c.id : o.k === 'd' ? o.x.id : 'all'));
  const T0 = SAVE.tot; T0.ultra += s.ultra; T0.zaps += s.zaps; T0.over += s.over; T0.items += s.items; if (s.champ) T0.champs++; if (s.pos === 1 && !T0.won.includes(s.track)) T0.won.push(s.track);
  for (const x of SAVE.ms.d) { const q = mDef(x.id); if (!x.c) x.p = Math.min(q.n, x.p + (+q.f(s) || 0)); }
  return msReady().filter(o => !before.has(o.k === 'c' ? o.c.id : o.k === 'd' ? o.x.id : 'all'));
}
function msClaim(o) {
  if (o.k === 'd') o.x.c = true; else if (o.k === 'all') SAVE.ms.all = true; else SAVE.ms.ct[o.c.id] = (SAVE.ms.ct[o.c.id] || 0) + 1;
  SAVE.coins += o.r; saveSave(); paintCoins(); sfx('buy');
}
function msBadge() { const n = msReady().length, b = $('btnMissions'); if (b) b.innerHTML = 'MISSIONS' + (n ? ' <span class="badge">' + n + '</span>' : ''); }
function msRow(ul, txt, p, n, r, state, onClaim) {
  const li = document.createElement('li'); li.className = state;
  li.innerHTML = `<div><b>${esc(txt)}</b><small>${state === 'max' ? 'All tiers complete' : Math.min(p, n) + ' / ' + n}</small></div><span class="mreward"><i class="coinic" aria-hidden="true"></i>${r}</span><div class="bar"><i style="width:${Math.min(100, p / n * 100)}%"></i></div>`;
  const b = document.createElement('button'); b.className = 'sm' + (state === 'ready' ? '' : ' alt'); b.disabled = state !== 'ready';
  b.textContent = state === 'ready' ? 'Claim' : state === 'claimed' || state === 'max' ? 'Done' : 'In progress'; b.onclick = () => { onClaim(); renderMissions(); };
  li.appendChild(b); ul.appendChild(li);
}
function renderMissions() {
  msRoll(); const ud = $('msDaily'), uc = $('msCareer'); ud.textContent = ''; uc.textContent = '';
  const left = Math.max(0, Date.parse(msDay() + 'T00:00:00Z') + 864e5 - Date.now()), hh = Math.floor(left / 36e5), mm = Math.floor(left / 6e4) % 60;
  $('msReset').textContent = 'New missions in ' + hh + 'h ' + String(mm).padStart(2, '0') + 'm';
  for (const x of SAVE.ms.d) { const q = mDef(x.id); msRow(ud, q.txt, x.p, q.n, q.r, x.c ? 'claimed' : x.p >= q.n ? 'ready' : '', () => msClaim({ k: 'd', x, r: q.r })); }
  const nd = SAVE.ms.d.filter(x => x.c).length; msRow(ud, 'Bonus: clear all 3 daily missions', nd, 3, MALL, SAVE.ms.all ? 'claimed' : nd === 3 ? 'ready' : '', () => msClaim({ k: 'all', r: MALL }));
  for (const c of MCAREER) { const i = SAVE.ms.ct[c.id] || 0, t = c.t[i], last = c.t[c.t.length - 1], v = c.v(); if (t) msRow(uc, c.txt(t[0]) + ' · tier ' + (i + 1) + '/' + c.t.length, v, t[0], t[1], v >= t[0] ? 'ready' : '', () => msClaim({ k: 'c', c, r: t[1] })); else msRow(uc, c.txt(last[0]), last[0], last[0], last[1], 'max', () => {}); }
  msBadge();
}
function finishRace() {
  const total = LAPS * T.n, net = G.mode === 'net', est = c => c.fin != null ? c.fin : G.rt + Math.max(0, total - c.prog) * T.ds / 46 + .001 * c.place;
  const res = G.cars.map(c => ({ c, fin: est(c) })).sort((a, b) => a.fin - b.fin);
  if (G.mode === 'cup') res.forEach((r, i) => { G.pts[r.c.d.id] = (G.pts[r.c.d.id] || 0) + POINTS[i]; });
  const pi = res.findIndex(r => r.c === G.player), last = G.mode !== 'cup' || G.round >= G.cal.length - 1;
  $('rKicker').textContent = net ? 'Online room ' + NET.code + ' · ' + TRACKS[G.track].name : G.mode === 'cup' ? 'Round ' + (G.round + 1) + ' of ' + G.cal.length + ' · ' + TRACKS[G.track].name : TRACKS[G.track].name;
  $('rTitle').textContent = pi === 0 ? 'Victory!' : pi < 3 ? 'Podium — P' + (pi + 1) : 'Chequered flag — P' + (pi + 1);
  $('rTable').innerHTML = '<tr><th>Pos</th><th>Driver</th><th>Time</th><th>Pts</th></tr>' + res.map((r, i) => `<tr class="${r.c === G.player ? 'me' : ''}"><td>${i + 1}</td><td><u style="background:${r.c.col}"></u>${esc(r.c.name)}</td><td>${i === 0 ? fmt(r.fin) : '+' + (r.fin - res[0].fin).toFixed(3)}</td><td>${G.mode === 'single' ? '' : POINTS[i]}</td></tr>`).join('');
  $('rStandBox').classList.toggle('hidden', G.mode !== 'cup');
  let earn = COINS[pi] || 10, champ = false;
  if (G.mode === 'cup') {
    const st = DRIVERS.slice().sort((a, b) => (G.pts[b.id] || 0) - (G.pts[a.id] || 0));
    $('rStand').innerHTML = '<tr><th>Pos</th><th>Driver</th><th>Team</th><th>Pts</th></tr>' + st.map((d, i) => `<tr class="${d === G.driver ? 'me' : ''}"><td>${i + 1}</td><td><u style="background:${chip(d)}"></u>${d.name}</td><td>${d.team}</td><td>${G.pts[d.id] || 0}</td></tr>`).join('');
    if (last) { const ci = st.indexOf(G.driver); champ = ci === 0; $('rTitle').textContent = champ ? 'World Champion!' : 'Season over — P' + (ci + 1) + ' in the championship'; }
  }
  if (champ) earn += 200;
  const st = SAVE.stats, bl = G.player && G.player.best, tid = TRACKS[G.track].id;
  st.races++; if (pi === 0) st.wins++; if (pi < 3) st.podiums++; if (net) { st.oraces++; if (pi === 0) st.owins++; } if (bl && (!st.best[tid] || bl < st.best[tid])) st.best[tid] = Math.round(bl * 1000) / 1000;
  const rx = G.rx || {}, fresh = G.rx ? msRace({ items: rx.items, zaps: rx.zaps, ultra: rx.ultra, turbos: rx.turbos, over: rx.over, perfect: rx.perfect, spins: rx.spins, drs: rx.drs, pos: pi + 1, gain: (rx.start || pi + 1) - (pi + 1), track: tid, champ }) : []; G.rx = null;
  const rm = $('rMiss'); rm.classList.toggle('hidden', !fresh.length); rm.textContent = fresh.length ? 'Mission' + (fresh.length > 1 ? 's' : '') + ' complete: ' + fresh.map(o => o.k === 'd' ? mDef(o.x.id).txt : o.k === 'all' ? 'all daily missions' : o.c.txt(cTier(o.c)[0])).join(' · ') + '. Claim ' + fresh.reduce((a, o) => a + o.r, 0) + ' coins in Missions.' : '';
  SAVE.coins += earn; saveSave(); paintCoins(); $('rCoins').textContent = '+' + earn + ' coins' + (champ ? ' (champion bonus included)' : '') + ' · you have ' + SAVE.coins;
  $('btnNext').textContent = net ? 'Back to lobby' : last ? (G.mode === 'cup' ? 'New season' : 'Race again') : 'Next race'; $('btnResQuit').textContent = net ? 'Leave room' : 'Back to paddock';
  G.phase = 'results'; show('results'); stopEngine(); music('music_menu'); pgMsg('level_completed'); offerDouble(earn); adBreak(); if (net && NET.host) netLobby();
}
function msg(text, color) { const e = $('hMsg'); e.textContent = text; e.style.color = color || '#fff'; e.classList.add('on'); clearTimeout(msg.t); msg.t = setTimeout(() => e.classList.remove('on'), 1500); }

function update(dt) {
  G.t += dt;
  const live = G.mode === 'net' && NET.on, racing = G.phase === 'race' || G.phase === 'finish' || (G.phase === 'results' && live);
  if (G.phase === 'count') {
    const lit = G.t >= G.lightsOut ? 0 : clamp(Math.floor(G.t), 0, 5);
    if (lit !== G.lit) { G.lit = lit; document.querySelectorAll('#lights i').forEach((e, i) => e.classList.toggle('on', i < lit)); gantryLights.forEach((m, i) => m.color.set(i < lit ? '#ff2a1a' : '#2a0705')); if (lit) sfx('count'); }
    const thr = playerInput().thr; if (thr && G.thrDown == null) G.thrDown = G.t; if (!thr) G.thrDown = null;
    if (G.t >= G.lightsOut) {
      G.phase = 'race'; G.rt = 0; sfx('go'); pgMsg('level_started'); setTimeout(() => $('lights').classList.add('hidden'), 700);
      const p = G.player, held = G.thrDown == null ? -1 : G.t - G.thrDown;
      if (G.rx) G.rx.start = G.rx.lp = p.place; if (held >= 0 && held < .5) { p.boost = 1.3; msg('PERFECT LAUNCH!', '#35e08a'); if (G.rx) G.rx.perfect++; } else if (held > 2) { p.launch = 1; G.wheelspin = .9; msg('WHEELSPIN!', '#ffd23f'); } else msg('LIGHTS OUT!', '#fff');
      for (const c of G.cars) c.lapStart = 0;
    }
    for (const c of G.cars) { if (c.local) stepCar(c, dt, { thr: 0, brk: 0, turn: 0, drift: false }); else netStep(c, dt); }
  }
  if (G.phase === 'menu') { for (const c of G.cars) carVisual(c, dt, 0, false); if (G.shopFlame && G.player && Math.random() < .9) { const c = G.player, tr = TRAILS[G.shopFlame] || TRAILS.std; spark(c.x - Math.sin(c.h) * 2.6, .55, c.z - Math.cos(c.h) * 2.6, -Math.sin(c.h) * 9 + rnd(-2, 2), rnd(0, 2), -Math.cos(c.h) * 9 + rnd(-2, 2), tr.rainbow ? 'hsl(' + Math.floor(Math.random() * 360) + ',100%,62%)' : pick(tr.cols), .35); } }
  if (racing) {
    G.rt += dt;
    G.wheelspin = Math.max(0, (G.wheelspin || 0) - dt);
    const pl = G.player;
    for (const c of G.cars) {
      if (!c.local) { netStep(c, dt); continue; }
      let inp;
      if (c.ai || c.fin != null) inp = aiInput(c, dt);
      else { inp = playerInput(); if (G.wheelspin > 0) { inp.thr = 0; if (Math.random() < .6) spark(c.x - Math.sin(c.h) * 2, .3, c.z - Math.cos(c.h) * 2, rnd(-2, 2), rnd(1, 4), rnd(-2, 2), '#cccccc', .5); } if (keys.item) { keys.item = false; useItem(c); } }
      // rubber band vs player
      if (c.ai && pl && !live) { const gap = (c.prog - pl.prog) * T.ds; c.rub = gap > 60 ? .965 : gap < -60 ? 1.04 : 1; }
      stepCar(c, dt, inp);
      // slipstream
      let tow = false; const sh = Math.sin(c.h), ch = Math.cos(c.h);
      if (c.v > 34) for (const o of G.cars) { if (o === c) continue; const dx = o.x - c.x, dz = o.z - c.z, f = dx * sh + dz * ch; if (f > 4 && f < 34 && Math.abs(dx * ch - dz * sh) < 3.4) { tow = true; break; } }
      c.tow = tow ? c.tow + dt : Math.max(0, c.tow - dt * 2); c.drs = c.tow > .9; if (c.drs && c === pl && RX()) G.rx.drs += dt;
      // stuck recovery for bots
      if (c.ai && G.phase !== 'count') { c.stuck = Math.abs(c.v) < 3 && c.launch <= 0 ? c.stuck + dt : 0; if (c.stuck > 2.5) { c.stuck = 0; const p = at(c.ti, 0, {}); c.x = p.x; c.z = p.z; c.h = c.vd = Math.atan2(T.tx[c.ti], T.tz[c.ti]); c.v = 15; } }
      // laps
      const lap = Math.floor(c.prog / T.n);
      if (lap > c.lap) { c.lap = lap; if (lap >= 1) { const lt = G.rt - c.lapStart; if (c.best == null || lt < c.best) c.best = lt; c.lapStart = G.rt; if (c === pl && c.fin == null) { $('hBest').textContent = 'BEST ' + fmt(c.best); if (lap < LAPS) msg(lap === LAPS - 1 ? 'FINAL LAP' : 'LAP ' + (lap + 1), '#fff'); } } }
      if (c.fin == null && c.prog >= LAPS * T.n) { c.fin = G.rt; c.ai = true; c.skill = .8; c.item = null; if (c === pl) { G.phase = 'finish'; G.finT = 0; msg(c.place === 1 ? 'YOU WIN!' : 'FINISHED P' + c.place, c.place === 1 ? '#ffd23f' : '#fff'); sfx('finish'); } }
    }
    // car vs car
    const cs = G.cars;
    for (let i = 0; i < cs.length; i++) for (let j = i + 1; j < cs.length; j++) {
      const a = cs[i], b = cs[j], dx = b.x - a.x, dz = b.z - a.z; if (dx * dx + dz * dz > 64 || (!a.local && !b.local) || Math.abs(a.y - b.y) > 1.3) continue;
      // each car is three circles along its length, so noses and tails collide too
      const sa = Math.sin(a.h), ca = Math.cos(a.h), sb = Math.sin(b.h), cb = Math.cos(b.h); let pen = 0, ux = 0, uz = 0;
      for (const oa of CAR_C) for (const ob of CAR_C) { const ex = dx + sb * ob - sa * oa, ez = dz + cb * ob - ca * oa, d2 = ex * ex + ez * ez; if (d2 < CAR_D * CAR_D && d2 > 1e-6) { const d = Math.sqrt(d2); if (CAR_D - d > pen) { pen = CAR_D - d; ux = ex / d; uz = ez / d; } } }
      if (!pen) continue;
      const h = pen / 2 + .01, wa = a.local ? (b.local ? 1 : 2) : 0, wb = b.local ? (a.local ? 1 : 2) : 0; a.x -= ux * h * wa; a.z -= uz * h * wa; b.x += ux * h * wb; b.z += uz * h * wb;
      const fa = dx * sa + dz * ca, la = dx * ca - dz * sa;
      if (Math.abs(fa) > Math.abs(la)) { const rear = fa > 0 ? a : b, front = fa > 0 ? b : a; if (rear.v > front.v) { const dv = (rear.v - front.v) * .5; if (rear.local) rear.v -= dv * .8; if (front.local) front.v += dv * .2; } }
      a.mesh.g.position.set(a.x, a.y, a.z); b.mesh.g.position.set(b.x, b.y, b.z);
    }
    // item boxes
    for (const b of boxes) { if (b.off > 0) { b.off -= dt; if (b.off <= 0) b.m.visible = true; continue; } b.m.rotation.y += dt * 2; b.m.rotation.x += dt * 1.3; for (const c of cs) { const dx = c.x - b.x, dz = c.z - b.z; if (dx * dx + dz * dz < 6.5) { b.off = 4; b.m.visible = false; if (!c.item && c.fin == null && c.local) { c.item = rollItem(c); c.itemT = rnd(1.5, 6); if (c === pl) sfx('pickup'); } for (let i = 0; i < 8; i++) spark(b.x, 1.5, b.z, rnd(-6, 6), rnd(2, 8), rnd(-6, 6), '#ffd23f', .4); break; } } }
    // oil
    for (let i = G.oils.length - 1; i >= 0; i--) { const o = G.oils[i]; o.life -= dt; o.arm -= dt; let dead = o.life <= 0; if (!dead) for (const c of cs) { if (!c.local || c.y > 1 || (o.arm > 0 && c === o.owner)) continue; const dx = c.x - o.x, dz = c.z - o.z; if (dx * dx + dz * dz < 7.5 && c.spin <= 0 && c.inv <= 0) { if (o.owner === G.player && c !== o.owner && RX()) G.rx.zaps++; hit(c, 'OIL! SPUN OUT'); dead = true; netEv({ k: 'rm', id: o.id }); break; } } if (dead) { scene.remove(o.m); G.oils.splice(i, 1); } }
    // loose tyres
    for (let i = G.tyres.length - 1; i >= 0; i--) { const o = G.tyres[i]; o.life -= dt; o.s += 105 * dt / T.ds; const i0 = Math.floor(o.s), f = o.s - i0, a = at(i0, o.lat, {}), b = at(i0 + 1, o.lat, {}); const x = lerp(a.x, b.x, f), z = lerp(a.z, b.z, f); o.m.position.set(x, .9, z); o.m.rotation.y = Math.atan2(b.x - a.x, b.z - a.z); o.m.rotation.x += dt * 25; let dead = o.life <= 0; if (!dead) for (const c of cs) { if (!c.local || c.y > 1 || c === o.owner) continue; const dx = c.x - x, dz = c.z - z; if (dx * dx + dz * dz < 8) { if (o.owner === G.player && RX()) G.rx.zaps++; hit(c, 'HIT BY A LOOSE TYRE'); dead = true; netEv({ k: 'rm', id: o.id }); break; } } if (dead) { scene.remove(o.m); G.tyres.splice(i, 1); } }
    // order
    G.order.sort((a, b) => a.fin != null && b.fin != null ? a.fin - b.fin : a.fin != null ? -1 : b.fin != null ? 1 : (b.prog + b.along / T.ds) - (a.prog + a.along / T.ds));
    G.order.forEach((c, i) => c.place = i + 1);
    { const r = RX(), p = G.player; if (r && p && p.fin == null) { if (r.lp && p.place < r.lp) r.over += r.lp - p.place; r.lp = p.place; } }
    if (G.phase === 'finish') { G.finT += dt; if (G.finT > 4.5) finishRace(); }
  }
  netTick(dt);
  updateParticles(dt);
}

/* ───────── camera ───────── */
const camPos = new THREE.Vector3(0, 50, 0), camLook = new THREE.Vector3();
function updateCamera(dt) {
  const p = G.player;
  if (p && G.phase === 'menu') { const a = G.t * .22 + 1.2, shop = !!G.viewDx, r = shop ? 8.4 : 10.5; camPos.lerp(new THREE.Vector3(p.x + Math.cos(a) * r, shop ? 3 : 3.6, p.z + Math.sin(a) * r), Math.min(1, 3 * dt)); camLook.lerp(new THREE.Vector3(p.x, .9, p.z), Math.min(1, 6 * dt)); camera.fov = lerp(camera.fov, 50, .05); camera.updateProjectionMatrix(); camera.position.copy(camPos); camera.lookAt(camLook); return; }
  if (!p || G.phase === 'menu' || G.phase === 'finish' || G.phase === 'results') {
    const c = p || G.order[0]; if (!c) return; const a = G.t * .25, r = p ? 13 : 26;
    camPos.lerp(new THREE.Vector3(c.x + Math.cos(a) * r, p ? 5 : 11, c.z + Math.sin(a) * r), Math.min(1, 3 * dt)); camLook.lerp(new THREE.Vector3(c.x, 1, c.z), Math.min(1, 6 * dt));
    camera.fov = lerp(camera.fov, 55, .05); camera.updateProjectionMatrix(); camera.position.copy(camPos); camera.lookAt(camLook); return;
  }
  G.camH += wrap(lerp(p.vd, p.h, .5) - G.camH) * Math.min(1, 6.5 * dt);
  const back = keys.look ? -1 : 1, s = Math.sin(G.camH) * back, c = Math.cos(G.camH) * back;
  const dist = 8.6 + p.v * .03;
  camPos.set(p.x - s * dist, 3.5 + p.y * .85, p.z - c * dist); camLook.set(p.x + s * 8, 1.3 + p.y, p.z + c * 8);
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
  const it = $('hItem'); it.classList.toggle('hidden', !p.item); if (p.item) { $('hItemIcon').innerHTML = ITEMS[p.item].icon; $('hItemName').textContent = ITEMS[p.item].name + ' · E'; }
  const lead = G.order[0];
  $('tower').innerHTML = G.order.map((c, i) => `<div class="${c === p ? 'me' : ''}"><b>${i + 1}</b><u style="background:${c.col}"></u>${esc(c.tla)}</div>`).join('');
  drawMinimap();
}
function drawMinimap() {
  const g = $('minimap').getContext('2d'); g.clearRect(0, 0, 340, 340); if (!mmBase) return; g.drawImage(mmBase, 0, 0);
  for (let i = G.order.length - 1; i >= 0; i--) { const c = G.order[i], me = c === G.player; g.beginPath(); g.arc(c.x * mmS + mmX, c.z * mmS + mmZ, me ? 10 : 6.5, 0, 7); g.fillStyle = c.col; g.fill(); g.lineWidth = me ? 4 : 2; g.strokeStyle = me ? '#fff' : '#0a0b10'; g.stroke(); }
}

/* ───────── audio: recorded samples only (CC0 packs, see README) ───────── */
const SND = ['hit', 'ice', 'jam', 'hex', 'count', 'turbo', 'boost', 'go', 'wings', 'pickup', 'buy', 'portal', 'finish', 'bolt', 'click', 'pause', 'engine'];
const AUD = { raw: {}, buf: {}, music: null, track: '', want: '', hostMute: false, hidden: false };
let AC = null, eng = null, master = null;
function loadAudio() { for (const n of SND) track(fetch('./audio/' + n + '.mp3').then(r => r.arrayBuffer()).then(b => { AUD.raw[n] = b; }).catch(() => {})); }
const audioOn = () => !G.muted && !AUD.hostMute && !AUD.hidden && !G.hostPaused;
function audioGate() {
  const on = audioOn(); $('hMute').classList.toggle('off', G.muted);
  if (AUD.music) { if (on) { const p = AUD.music.play(); if (p) p.catch(() => {}); } else AUD.music.pause(); }
  if (!AC) return; master.gain.value = on ? 1 : 0;
  if (on && AC.state === 'suspended') AC.resume(); else if (!on && (AUD.hidden || G.hostPaused || AUD.hostMute) && AC.state === 'running') AC.suspend();
}
function initAudio() {
  if (!AC) {
    try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { AC = null; return; }
    master = AC.createGain(); master.connect(AC.destination);
    for (const n in AUD.raw) AC.decodeAudioData(AUD.raw[n].slice(0), b => { AUD.buf[n] = b; if (n === 'engine') startEngine(); }, () => {});
  }
  startEngine(); music(); audioGate();
}
function sfx(n, vol = 1, rate = 1) { if (!AC || !AUD.buf[n] || !audioOn()) return; const s = AC.createBufferSource(), g = AC.createGain(); s.buffer = AUD.buf[n]; s.playbackRate.value = rate; g.gain.value = vol * .5; s.connect(g); g.connect(master); s.start(); }
// the engine file is the same 2/3-second loop repeated, so looping a whole number of periods inside it is seamless
function startEngine() { if (!AC || eng || !AUD.buf.engine) return; const s = AC.createBufferSource(), g = AC.createGain(); s.buffer = AUD.buf.engine; s.loop = true; s.loopStart = 1; s.loopEnd = 5; g.gain.value = 0; s.connect(g); g.connect(master); s.start(0, 1); eng = { s, g }; }
function stopEngine() { if (eng) eng.g.gain.setTargetAtTime(0, AC.currentTime, .1); }
function updateEngine() { if (!eng || !G.player) return; const p = G.player, v = Math.abs(p.v), gear = Math.min(6, Math.floor(v / 10.5)), rpm = (v - gear * 10.5) / 10.5; const rate = .55 + gear * .1 + rpm * .55 + (G.phase === 'count' && playerInput().thr ? .5 : 0); eng.s.playbackRate.setTargetAtTime(rate, AC.currentTime, .05); const on = !G.paused && (G.phase === 'race' || G.phase === 'count' || G.phase === 'finish'); eng.g.gain.setTargetAtTime(on ? .3 : 0, AC.currentTime, .08); }
function music(name) { name = name || AUD.want; AUD.want = name; if (!AC || !name) return; if (AUD.track !== name) { if (AUD.music) AUD.music.pause(); const a = AUD.music = new Audio('./audio/' + name + '.mp3'); a.loop = true; a.volume = name === 'music_menu' ? .45 : .3; AUD.track = name; } audioGate(); }
addEventListener('pointerdown', () => initAudio(), { once: true }); addEventListener('keydown', () => initAudio(), { once: true });
document.addEventListener('click', e => { if (e.target.closest && e.target.closest('button')) sfx('click', .7); });
document.addEventListener('visibilitychange', () => { AUD.hidden = document.hidden; audioGate(); if (document.hidden && G.mode !== 'net' && ['count', 'race'].includes(G.phase) && !G.paused) togglePause(true); });
document.addEventListener('contextmenu', e => { if (!(e.target && /^(INPUT|TEXTAREA)$/.test(e.target.tagName))) e.preventDefault(); });

/* ───────── platform (Playgama Bridge): pause, mute, ads ───────── */
// lifecycle messages: portals such as CrazyGames use these to know when the player is actually playing
function pgMsg(name) { if (!PG) return; try { bridge.platform.sendMessage(name); } catch (e) {} }
function adBreak() { if (!PG) return; try { if (bridge.advertisement.isInterstitialSupported) bridge.advertisement.showInterstitial('race_end'); } catch (e) {} }
function offerDouble(earn) { const b = $('btnDouble'); let ok = false; try { ok = PG && bridge.advertisement.isRewardedSupported; } catch (e) {} b.classList.toggle('hidden', !ok || !earn); G.dbl = ok ? earn : 0; b.textContent = 'Watch an ad: double your coins (+' + earn + ')'; b.disabled = false; }
if (PG) {
  try {
    AUD.hostMute = bridge.platform.isAudioEnabled === false;
    bridge.platform.on(bridge.EVENT_NAME.AUDIO_STATE_CHANGED, on => { AUD.hostMute = !on; audioGate(); });
    bridge.platform.on(bridge.EVENT_NAME.PAUSE_STATE_CHANGED, p => { G.hostPaused = !!p; audioGate(); });
    bridge.advertisement.on(bridge.EVENT_NAME.REWARDED_STATE_CHANGED, st => {
      if (st === 'rewarded' && G.dblAsk && G.dbl) { SAVE.coins += G.dbl; $('rCoins').textContent = '+' + G.dbl * 2 + ' coins (doubled) · you have ' + SAVE.coins; G.dbl = 0; G.dblAsk = false; saveSave(); paintCoins(); $('btnDouble').classList.add('hidden'); sfx('buy'); }
      else if (st === 'closed' || st === 'failed') { G.dblAsk = false; $('btnDouble').disabled = false; }
    });
  } catch (e) {}
}

/* ───────── first-race tutorial ───────── */
const TUT = { step: 0, t: 0, used: false };
function tutTick(dt) {
  const el = $('tut'); if (SAVE.tut || G.mode === 'net' || !G.player || G.phase === 'results') { el.classList.remove('on'); return; }
  const p = G.player, touch = G.touch; TUT.t += dt;
  const steps = [
    { text: touch ? 'The throttle is automatic. Steer with the arrow buttons and finish 3 laps in front!' : 'Hold UP or W to accelerate. Finish 3 laps in front of your rivals!', done: () => G.phase === 'race' && p.v > 28 },
    { text: touch ? 'Steer with the left and right buttons' : 'Steer with LEFT and RIGHT, or A and D', done: () => TUT.t > 4 && (Math.abs(p.tin) > .5 || TUT.t > 9) },
    { text: touch ? 'Hold SLIDE while turning, then let go for a turbo' : 'Hold SHIFT or SPACE while turning to slide, then release for a turbo', done: () => (p.boost > 0 && TUT.t > 2) || TUT.t > 24 },
    { text: touch ? 'Drive through a ? box, then tap ITEM to use the power-up' : 'Drive through a ? box, then press E to use the power-up', done: () => TUT.used || TUT.t > 40 },
    { text: 'That is everything. Good luck!', done: () => TUT.t > 3 },
  ];
  const s = steps[TUT.step]; if (!s) { SAVE.tut = true; saveSave(); el.classList.remove('on'); return; }
  el.textContent = s.text; el.classList.add('on'); if (s.done()) { TUT.step++; TUT.t = 0; }
}

/* ───────── UI ───────── */
const SCREENS = ['home', 'garage', 'setup', 'hud', 'pause', 'results', 'shop', 'online', 'lobby', 'board', 'friends', 'settings', 'missions'];
function show(id) { for (const s of SCREENS) $(s).classList.toggle('hidden', s !== id && !(id === 'pause' && s === 'hud')); $('chatBtn').classList.toggle('hidden', id === 'hud'); if (id === 'hud') closeChat(); if (id === 'home') refreshHome(); if (id === 'pause') $('btnRestart').classList.toggle('hidden', G.mode === 'net'); }
function selectDriver(d) {
  G.driver = d; if (SAVE.driver !== d.id) { SAVE.driver = d.id; saveSave(); } document.querySelectorAll('.dcard').forEach(e => e.classList.toggle('sel', e.dataset.id === d.id)); helmetArt($('dPortrait'), d);
  $('dNum').textContent = d.num; $('dNum').style.color = d.c1 === '#19191f' ? d.c2 : d.c1; $('dName').textContent = d.name; $('dTeam').textContent = d.team; $('dQuote').textContent = d.quote; $('gSpeed').style.width = d.speed * 20 + '%'; $('gTurn').style.width = d.turn * 20 + '%';
}
function renderCalendar() {
  const cup = G.mode === 'cup'; $('tLabel').textContent = cup ? 'Calendar — tap circuits to pick your four rounds' : 'Circuit'; $('btnShuffle').classList.toggle('hidden', !cup);
  document.querySelectorAll('.tcard').forEach(e => { const i = +e.dataset.i, k = G.cal.indexOf(i); e.classList.toggle('sel', cup ? k >= 0 : i === G.track); e.querySelector('.n').textContent = cup && k >= 0 ? 'ROUND ' + (k + 1) : ''; });
}
function buildUI() {
  const dg = $('dgrid'); DRIVERS.forEach(d => { const b = document.createElement('button'); b.className = 'dcard'; b.dataset.id = d.id; b.setAttribute('role', 'option'); b.innerHTML = `<canvas width="168" height="168"></canvas><b>${d.name}</b><small>${d.team}</small>`; helmetArt(b.firstChild, d); b.onclick = () => selectDriver(d); dg.appendChild(b); });
  selectDriver(DRIVERS.find(d => d.id === SAVE.driver) || DRIVERS[0]);
  const tg = $('tgrid'); TRACKS.forEach((t, i) => { const b = document.createElement('button'); b.className = 'tcard'; b.dataset.i = i; b.innerHTML = `<canvas width="320" height="200"></canvas><span class="n"></span><b>${t.name}</b><small>${t.sub}</small>`; trackThumb(b.firstChild, t); b.onclick = () => { if (G.mode === 'cup') { const k = G.cal.indexOf(i); if (k >= 0) G.cal.splice(k, 1); else { if (G.cal.length >= 4) G.cal.shift(); G.cal.push(i); } } else G.track = i; renderCalendar(); }; tg.appendChild(b); });
  const seg = (id, fn) => $(id).querySelectorAll('button').forEach(b => b.onclick = () => { $(id).querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)); fn(b.dataset.v); });
  seg('segMode', v => { G.mode = v; renderCalendar(); }); seg('segDiff', v => { G.diff = +v; });
  $('btnPlay').onclick = () => { initAudio(); G.pickOnly = false; $('btnToSetup').textContent = 'Sign contract'; show('garage'); }; $('btnBackHome').onclick = () => show('home'); $('btnToSetup').onclick = () => { if (G.pickOnly) return show('home'); show('setup'); renderCalendar(); }; $('btnBackGarage').onclick = () => show('garage');
  $('btnShuffle').onclick = () => { G.cal = TRACKS.map((_, i) => i).sort(() => Math.random() - .5).slice(0, 4); renderCalendar(); };
  $('btnRace').onclick = () => { if (G.mode === 'cup') { while (G.cal.length < 4) { const i = Math.floor(Math.random() * TRACKS.length); if (!G.cal.includes(i)) G.cal.push(i); } G.round = 0; G.pts = {}; startRace(G.cal[0]); } else startRace(G.track); };
  $('btnNext').onclick = () => { if (G.mode === 'net') { if (NET.on) openLobby(); else netLeave(); return; } if (G.mode === 'cup' && G.round < G.cal.length - 1) { G.round++; startRace(G.cal[G.round]); } else if (G.mode === 'cup') { G.round = 0; G.pts = {}; startRace(G.cal[0]); } else startRace(G.track); };
  const quit = () => { if (G.mode === 'net') return netLeave(); stopEngine(); attract(); show('home'); };
  $('btnDouble').onclick = () => { if (!PG || !G.dbl) return; G.dblAsk = true; $('btnDouble').disabled = true; try { bridge.advertisement.showRewarded('double_coins'); } catch (e) { G.dblAsk = false; } };
  $('hPause').onclick = () => togglePause(); $('hMute').onclick = toggleMute; $('hPause').innerHTML = IC.pause; $('hMute').innerHTML = IC.sound;
  $('btnResQuit').onclick = quit; $('btnQuit').onclick = quit; $('btnResume').onclick = () => togglePause(false); $('btnRestart').onclick = () => { if (G.mode !== 'net') startRace(G.track); };
  // touch
  G.touch = matchMedia('(pointer:coarse)').matches; if (PG) try { const dt = bridge.device.type; if (dt === 'mobile' || dt === 'tablet') G.touch = true; else if (dt === 'desktop' && !('ontouchstart' in window)) G.touch = false; } catch (e) {}
  document.querySelectorAll('#touch button').forEach(b => { const k = b.dataset.k; const set = v => e => { e.preventDefault(); keys[k] = v; b.classList.toggle('dn', v); }; b.addEventListener('pointerdown', set(true)); b.addEventListener('pointerup', set(false)); b.addEventListener('pointercancel', set(false)); b.addEventListener('pointerleave', set(false)); });
}
function toggleMute() { G.muted = !G.muted; SAVE.set.mute = G.muted; saveSave(); audioGate(); }
function togglePause(v) { if (!['count', 'race', 'finish'].includes(G.phase)) return; G.paused = v == null ? !G.paused : v; show(G.paused ? 'pause' : 'hud'); sfx('pause'); if (G.phase === 'race') pgMsg(G.paused ? 'level_paused' : 'level_resumed'); }
const KEYMAP = { ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down', ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', ShiftLeft: 'drift', ShiftRight: 'drift', Space: 'drift', KeyC: 'look' };
addEventListener('keydown', e => {
  if (e.target && /^(INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName)) return;
  const k = KEYMAP[e.code]; if (k) { keys[k] = true; if (G.phase !== 'menu' && G.phase !== 'results') e.preventDefault(); }
  if (e.repeat) return;
  if (e.code === 'KeyE' || e.code === 'KeyX' || e.code === 'Enter') { if (G.phase === 'race') keys.item = true; }
  if (e.code === 'KeyM') toggleMute();
  if (e.code === 'KeyP') togglePause();
});
addEventListener('keyup', e => { const k = KEYMAP[e.code]; if (k) keys[k] = false; });
addEventListener('blur', () => { for (const k in keys) keys[k] = false; });

/* ───────── main loop ───────── */
let last = performance.now();
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min((now - last) / 1000, 1 / 20); last = now;
  const live = G.mode === 'net' && NET.on;
  if (G.hostPaused) { renderer.render(scene, camera); return; }
  if (!G.paused && ['count', 'race', 'finish'].includes(G.phase)) tutTick(dt);
  if ((!G.paused || live) && (G.phase !== 'results' || live) && !(LD.on && G.phase === 'count' && !live)) { update(dt); if (G.player && G.phase !== 'menu' && G.phase !== 'results') updateHud(); }
  updateCamera(dt); updateEngine();
  if (skyDome) skyDome.position.copy(camera.position);
  for (const c of crowd) { if (c.flag) c.o.rotation.y = Math.sin(now * .004 + c.ph) * .5; else c.o.position.y = Math.max(0, Math.sin(now * .001 * c.sp + c.ph)) * .16; }
  renderer.render(scene, camera);
}
/* loading screen: video backdrop + progress bar, shown at boot and while a circuit's scenery downloads */
const LD = { el: $('loading'), bar: $('ldBar'), vid: $('ldVid'), total: 0, done: 0, on: true, since: performance.now(), ended: false, max: 9000 };
// stays up until the assets are in AND the clip has played to its end (max is the fallback if the video can't play)
function ldPaint() {
  const el = performance.now() - LD.since, v = LD.vid;
  // Safari (and low-power mode) can refuse to autoplay: then run on a 3.5 s timer instead of waiting for the video
  if (el > 1200) LD.noVid = v.currentTime === 0 || (v.paused && !v.ended);
  const vf = LD.noVid ? el / 3500 : v.duration ? v.currentTime / v.duration : 0;
  LD.bp = Math.max(LD.bp || 0, Math.min(LD.total ? LD.done / LD.total : 0, LD.ended ? 1 : vf)); LD.bar.style.width = Math.round(100 * LD.bp) + '%';
  if (LD.on && LD.done >= LD.total && (LD.ended || (LD.noVid && el > 3500) || el > 15000)) ldHide();
}
LD.vid.addEventListener('ended', () => { if (LD.done >= LD.total) { LD.ended = true; ldPaint(); } else ldPlay(); });
setInterval(() => { if (LD.on) ldPaint(); }, 100);
LD.vid.addEventListener('error', () => { LD.max = 5000; });
function ldPlay() { try { LD.vid.currentTime = 0; } catch (e) {} const pr = LD.vid.play(); if (pr) pr.catch(() => {}); }
function track(p) { LD.total++; return p.then(v => { LD.done++; if (LD.on) ldPaint(); return v; }); }
function ldHide() { LD.on = false; LD.el.classList.add('out'); if (PG && !LD.ready) { LD.ready = true; try { bridge.platform.sendMessage('game_ready'); } catch (e) {} } else pgMsg('in_game_loading_stopped'); }
function ldShow() { if (LD.done >= LD.total) return; LD.total -= LD.done; LD.done = 0; LD.on = true; LD.ended = false; LD.noVid = false; LD.bp = 0; LD.since = performance.now(); LD.el.classList.remove('out'); ldPlay(); ldPaint(); pgMsg('in_game_loading_started'); }
ldPlay();
/* ───────── online: rooms over WebRTC (PeerJS). The room host runs the bots and relays everyone's cars ───────── */
const ROOM = 'apexrivalsgp-room-', WORLD_ID = 'apexrivalsgp-world-v1';
const NET = { on: false, host: false, id: null, peer: null, conns: new Map(), hc: null, players: [], code: '', sendT: 0, bots: true, track: 0, board: {}, chat: [] };
let peerLib = null;
function loadPeer() { return peerLib || (peerLib = new Promise((res, rej) => { if (window.Peer) return res(); const s = document.createElement('script'); s.src = './vendor/peerjs.min.js'; s.onload = () => res(); s.onerror = () => { peerLib = null; rej(new Error('lib')); }; document.head.appendChild(s); })); }
const netStatus = t => { $('netStatus').textContent = t; };
const myName = () => SAVE.name || G.driver.name.split(' ')[0];
const meP = () => ({ id: NET.id, uid: SAVE.uid, name: (PG && pgName(NET.id)) || myName(), driver: G.driver.id, cos: cleanCos(SAVE.eq) });
const MP = () => bridge.multiplayer;
const pgOnline = () => { try { return PG && !!bridge.multiplayer && bridge.multiplayer.isSupported; } catch (e) { return false; } };
const pgName = id => { try { const p = MP().players.find(x => x.id === id); return (p && cleanName(p.name)) || ''; } catch (e) { return ''; } };
function pgEnter(code, host) { NET.on = true; NET.host = host; NET.id = MP().playerId; NET.code = code; NET.conns.clear(); if (host) { for (const p of MP().players) if (p.id !== NET.id) NET.conns.set(p.id, { open: true }); NET.players = [meP()]; netStatus(''); openLobby(); } else { NET.players = []; netSend(Object.assign({ t: 'hello' }, meP())); netStatus('Joined — waiting for the room…'); } }
function pgBind() {
  if (pgBind.done || !pgOnline()) return; pgBind.done = true; const E = bridge.EVENT_NAME;
  MP().on(E.MULTIPLAYER_MESSAGE_RECEIVED, msg => { const d = msg && msg.data; if (!NET.on || !d || typeof d !== 'object') return; if (NET.host) { if (!NET.conns.has(msg.from)) NET.conns.set(msg.from, { open: true }); hostData(msg.from, d); } else if (msg.from === MP().hostId) guestData(d); else if (d.t === 's') netApply(d.c, msg.from); else if (d.t === 'ev') netOnEv(d); });
  MP().on(E.MULTIPLAYER_PLAYER_JOINED, p => { if (NET.on && NET.host && p && p.id !== NET.id) NET.conns.set(p.id, { open: true }); });
  MP().on(E.MULTIPLAYER_PLAYER_LEFT, p => { if (NET.on && NET.host && p) netDrop(p.id); });
  MP().on(E.MULTIPLAYER_HOST_CHANGED, () => { if (NET.on && !!MP().isHost !== NET.host) netLeave('The host left, so the room closed.'); });
  MP().on(E.MULTIPLAYER_ROOM_LEFT, reason => { if (NET.on) netLeave(reason === 'room_closed' ? 'The room was closed.' : 'Lost the connection to the room.'); });
}
function netSend(m, except) { if (PG) { if (except !== undefined || !NET.on) return; try { if (NET.host || m.t === 's' || m.t === 'ev') MP().send('m', m); else MP().send('m', m, { to: 'host' }); } catch (e) {} return; } try { if (NET.host) { for (const [id, cn] of NET.conns) if (id !== except && cn.open) cn.send(m); } else if (NET.hc && NET.hc.open) NET.hc.send(m); } catch (e) {} }
function netEv(o) { if (!NET.on || G.mode !== 'net') return; o.t = 'ev'; netSend(o); }
function netClose() { voiceStop(); const was = NET.on; NET.on = false; if (PG && was) try { MP().leaveRoom(); } catch (e) {} try { if (NET.peer) NET.peer.destroy(); } catch (e) {} NET.peer = null; NET.on = false; NET.host = false; NET.conns.clear(); NET.hc = null; NET.players = []; NET.board = {}; NET.chat = []; NET.code = ''; worldHi(); }
async function netHost() {
  if (PG) { if (!pgOnline()) return netStatus('Online play is not available here.'); pgBind(); netStatus('Opening a room…'); const pub = !!NET.pubNext; NET.pubNext = false; netClose(); try { const code = await MP().createRoom({ maxPlayers: 12, isVisible: pub, filter: { v: 1 } }); NET.pub = pub; pgEnter(code, true); } catch (e) { netStatus('Could not open a room (' + ((e && e.code) || 'connection error') + ').'); } return; }
  netStatus('Opening a room…'); try { await loadPeer(); } catch (e) { return netStatus('Could not load the online module.'); }
  netClose(); const code = Array.from({ length: 5 }, () => pick('ABCDEFGHJKLMNPQRSTUVWXYZ23456789')).join('');
  const peer = NET.peer = new Peer(ROOM + code); voiceHook(peer);
  peer.on('open', id => { if (NET.peer !== peer) return; NET.on = true; NET.host = true; NET.id = id; NET.code = code; NET.pub = !!NET.pubNext; NET.pubNext = false; NET.players = [meP()]; netStatus(''); openLobby(); worldHi(); });
  peer.on('connection', cn => {
    cn.on('open', () => { if (NET.players.length >= 12) { cn.send({ t: 'full' }); return setTimeout(() => cn.close(), 400); } NET.conns.set(cn.peer, cn); });
    cn.on('data', m => hostData(cn.peer, m)); cn.on('close', () => netDrop(cn.peer)); cn.on('error', () => netDrop(cn.peer));
  });
  peer.on('error', e => { if (NET.peer !== peer) return; if (e.type === 'unavailable-id') return netHost(); if (!NET.on) netStatus('Could not reach the matchmaking server (' + e.type + '). Check your connection and try again.'); });
  peer.on('disconnected', () => { try { if (NET.peer === peer) peer.reconnect(); } catch (e) {} });
}
async function netJoin(code) {
  if (PG) { code = String(code || '').toUpperCase().replace(/[^A-Z0-9]/g, ''); if (code.length < 4) return netStatus('Type the room code first.'); if (!pgOnline()) return netStatus('Online play is not available here.'); pgBind(); netStatus('Joining ' + code + '…'); netClose(); try { await MP().joinRoom(code); pgEnter(code, false); } catch (e) { const c = (e && e.code) || ''; netStatus(c === 'MULTIPLAYER_ROOM_NOT_FOUND' ? 'No room with the code ' + code + '.' : c === 'MULTIPLAYER_ROOM_FULL' ? 'That room is full.' : c === 'MULTIPLAYER_ROOM_CLOSED' ? 'That room is closed.' : 'Could not join (' + (c || 'connection error') + ').'); } return; }
  code = String(code || '').toUpperCase().replace(/[^A-Z0-9]/g, ''); if (code.length !== 5) return netStatus('Room codes are 5 characters.');
  netStatus('Joining ' + code + '…'); try { await loadPeer(); } catch (e) { return netStatus('Could not load the online module.'); }
  netClose(); const peer = NET.peer = new Peer(); voiceHook(peer);
  const fail = setTimeout(() => { if (NET.peer === peer && !NET.on) { netStatus('Could not connect to that room.'); netClose(); } }, 15000);
  peer.on('open', id => {
    if (NET.peer !== peer) return; NET.id = id; const cn = NET.hc = peer.connect(ROOM + code, { reliable: true, serialization: 'json' });
    cn.on('open', () => { clearTimeout(fail); NET.on = true; NET.host = false; NET.code = code; cn.send(Object.assign({ t: 'hello' }, meP())); worldHi(); });
    cn.on('data', guestData); cn.on('close', () => { if (NET.peer === peer && NET.on) netLeave('The host closed the room.'); });
  });
  peer.on('error', e => { if (NET.peer !== peer || NET.on) return; clearTimeout(fail); netStatus(e.type === 'peer-unavailable' ? 'No room with the code ' + code + '.' : 'Connection problem (' + e.type + ').'); netClose(); });
}
function netLeave(why) { const was = NET.on; netClose(); if (G.mode === 'net') G.mode = G.prevMode || 'cup'; if (was || why) { stopEngine(); attract(); show(why ? 'online' : 'home'); netStatus(why || ''); } }
function netLobby() { worldHi(); const racing = G.mode === 'net' && ['count', 'race', 'finish'].includes(G.phase); netSend({ t: 'lobby', players: NET.players, track: NET.track, diff: G.diff, bots: NET.bots, board: NET.board, racing }); renderLobby(); }
function netDrop(pid) { if (!NET.conns.has(pid)) return; NET.conns.delete(pid); NET.players = NET.players.filter(p => p.id !== pid); const m = { t: 'ev', k: 'tobot', own: pid }; netOnEv(m); netSend(m); netLobby(); }
function hostData(pid, m) {
  if (!m || typeof m !== 'object' || !NET.conns.has(pid)) return;
  if (m.t === 'hello') { const p = { id: pid, uid: cleanName(m.uid), name: (PG && pgName(pid)) || cleanName(m.name) || 'Driver', driver: DRIVERS.some(d => d.id === m.driver) ? m.driver : 'val', cos: cleanCos(m.cos) }; const i = NET.players.findIndex(x => x.id === pid); if (i < 0) NET.players.push(p); else NET.players[i] = p; netLobby(); }
  else if (m.t === 's') { netApply(m.c, pid); netSend(m, pid); }
  else if (m.t === 'ev') { netOnEv(m); netSend(m, pid); }
  else if (m.t === 'chat') { const p = NET.players.find(x => x.id === pid); if (p) roomChat(p.name, m.text); }
}
function guestData(m) {
  if (!m || typeof m !== 'object') return;
  if (m.t === 'lobby') { NET.players = Array.isArray(m.players) ? m.players : []; NET.track = m.track | 0; NET.bots = !!m.bots; NET.board = m.board || {}; NET.racing = !!m.racing; if (!$('online').classList.contains('hidden')) openLobby(); else renderLobby(); }
  else if (m.t === 'start') netStartRace(m);
  else if (m.t === 's') netApply(m.c);
  else if (m.t === 'ev') netOnEv(m);
  else if (m.t === 'chat') chatAdd('room', m.name, m.text);
  else if (m.t === 'full') netLeave('That room is full.');
}
function roomChat(name, text) { text = String(text || '').slice(0, 140).trim(); if (!text) return; const m = { t: 'chat', name: cleanName(name) || 'Driver', text }; netSend(m); chatAdd('room', m.name, m.text); }
function netResult(pid, place) { const p = NET.players.find(x => x.id === pid); if (!p) return; place = clamp(place | 0, 1, 12); const b = NET.board[pid] || (NET.board[pid] = { name: p.name, pts: 0, wins: 0, races: 0 }); if (b.round === NET.round) return; b.round = NET.round; b.name = p.name; b.pts += POINTS[place - 1]; b.races++; if (place === 1) b.wins++; netLobby(); }
function netStart() {
  if (!NET.host) return;
  const humans = NET.players.map(p => ({ driver: p.driver, own: p.id, name: p.name, cos: p.cos })), used = new Set(humans.map(h => h.driver));
  const free = DRIVERS.filter(d => !used.has(d.id)).sort(() => Math.random() - .5), bots = NET.bots ? free.slice(0, Math.max(0, 12 - humans.length)).map(d => ({ driver: d.id, own: 'bot' })) : [];
  const grid = [...bots, ...humans].sort(() => Math.random() - .5), base = [.87, .925, .975][G.diff];
  grid.forEach((e, k) => { if (e.own === 'bot') { e.skill = base + .07 * (1 - k / 11) * rnd(.6, 1); e.launch = rnd(0, 1); } });
  NET.round = (NET.round | 0) + 1; const m = { t: 'start', track: NET.track, grid, lightsOut: 6 + rnd(.2, 1.1), diff: G.diff };
  netSend(m); netStartRace(m); netLobby();
}
function netStartRace(m) {
  if (!Array.isArray(m.grid) || !TRACKS[m.track | 0]) return;
  if (G.mode !== 'net') G.prevMode = G.mode; G.mode = 'net'; G.diff = clamp(m.diff | 0, 0, 2); NET.sent = false; closeChat();
  startRace(m.track | 0, { grid: m.grid.slice(0, 12), lightsOut: clamp(+m.lightsOut || 6.5, 5, 8) });
}
const r1 = v => Math.round(v * 10) / 10, r3 = v => Math.round(v * 1000) / 1000;
function netPack(c) { const f = (c.drift > 0 ? 1 : 0) | (c.drift < 0 ? 2 : 0) | (c.boost > 0 ? 4 : 0) | (c.shield > 0 ? 8 : 0) | (c.spin > 0 ? 16 : 0) | (c.tiny > 0 ? 32 : 0) | (c.ice > 0 ? 64 : 0) | (c.jam > 0 ? 128 : 0) | (c.inv > 0 ? 256 : 0) | (c.drs ? 512 : 0) | (c.off ? 1024 : 0); return [c.id, r1(c.x), r1(c.z), r3(c.h), r1(c.v), c.prog, r1(c.y), f, c.fin ? r3(c.fin) : 0, c.best ? r3(c.best) : 0, r1(c.tin || 0), c.charge > 3 ? 3 : c.charge > 1.9 ? 2 : c.charge > .9 ? 1 : 0]; }
function netApply(arr, from) {
  if (!Array.isArray(arr) || G.mode !== 'net') return; const now = performance.now();
  for (const a of arr) {
    if (!Array.isArray(a) || !a.slice(0, 8).every(Number.isFinite)) continue; const c = G.cars[a[0]]; if (!c || c.local || (from && c.own !== from)) continue;
    c.net = { x: a[1], z: a[2], h: a[3], v: a[4], prog: Math.round(a[5]), y: clamp(a[6], 0, 6), t: now }; const f = a[7];
    c.drift = f & 1 ? 1 : f & 2 ? -1 : 0; c.boost = f & 4 ? .25 : 0; c.shield = f & 8 ? .25 : 0; if (f & 16) c.spin = .25; c.tiny = f & 32 ? .25 : 0; c.ice = f & 64 ? .25 : 0; c.jam = f & 128 ? .25 : 0; c.inv = f & 256 ? .25 : 0; c.drs = !!(f & 512); c.off = !!(f & 1024);
    if (a[8] > 0) c.fin = a[8]; if (a[9] > 0) c.best = a[9]; c.tin = clamp(+a[10] || 0, -1, 1); c.charge = [0, 1, 2, 3.1][a[11] | 0] || 0;
  }
}
function netStep(c, dt) {
  c.boost = Math.max(0, c.boost - dt); c.shield = Math.max(0, c.shield - dt); c.tiny = Math.max(0, c.tiny - dt); c.ice = Math.max(0, c.ice - dt); c.jam = Math.max(0, c.jam - dt); c.inv = Math.max(0, c.inv - dt);
  if (c.spin > 0) { c.spin -= dt; c.spinA += dt * 12; if (c.spin <= 0) c.spinA = 0; }
  const n = c.net;
  if (n) {
    const age = Math.min(.3, (performance.now() - n.t) / 1000), tx = n.x + Math.sin(n.h) * n.v * age, tz = n.z + Math.cos(n.h) * n.v * age, far = (tx - c.x) ** 2 + (tz - c.z) ** 2 > 900, k = far ? 1 : Math.min(1, 10 * dt);
    c.x += (tx - c.x) * k; c.z += (tz - c.z) * k; c.h += wrap(n.h - c.h) * k; c.v = n.v; c.y += (n.y - c.y) * Math.min(1, 10 * dt);
    const N = T.n; c.prog = n.prog; c.ti = ((n.prog % N) + N) % N; const dx = c.x - T.px[c.ti], dz = c.z - T.pz[c.ti]; c.lat = dx * T.nx[c.ti] + dz * T.nz[c.ti]; c.along = dx * T.tx[c.ti] + dz * T.tz[c.ti]; c.lap = Math.floor(c.prog / N);
  }
  c.vd = c.h; carVisual(c, dt, c.tin || 0, c.boost > 0);
}
function netOnEv(m) {
  if (G.mode !== 'net' || !G.cars.length) return; const k = m.k;
  if (k === 'fx') { const c = G.cars[m.to | 0]; if (!c || !FXCOL[m.fx]) return; zapFx(c, m.fx); if (c.local) applyFx(c, m.fx, m.d, G.cars[m.from | 0]); }
  else if (k === 'oil' && Number.isFinite(m.x) && Number.isFinite(m.z) && G.oils.length < 60) spawnOil(m.x, m.z, G.cars[m.owner | 0], String(m.id));
  else if (k === 'tyre' && Number.isFinite(m.s) && Number.isFinite(m.lat) && G.tyres.length < 40) spawnTyre(m.s, clamp(m.lat, -HALF, HALF), G.cars[m.owner | 0], String(m.id));
  else if (k === 'rm') rmHaz(String(m.id));
  else if (k === 'tobot') for (const c of G.cars) if (c.own === m.own) { c.own = 'bot'; c.ai = true; c.skill = .93; if (NET.host) { c.local = true; c.vd = c.h; } }
}
function netTick(dt) {
  if (!NET.on || G.mode !== 'net' || G.phase === 'menu') return;
  NET.sendT += dt; if (NET.sendT < .066) return; NET.sendT = 0;
  const arr = []; for (const c of G.cars) if (c.local) arr.push(netPack(c)); if (arr.length) netSend({ t: 's', c: arr });
  if (NET.host) for (const c of G.cars) if (c.fin != null && !c.scored && c.own !== 'bot') { c.scored = true; netResult(c.own === 'me' ? NET.id : c.own, 1 + G.cars.filter(o => o.fin != null && o.fin < c.fin).length); }
}

/* ───────── world: one shared hub for global chat + friends' online status.
   There is no game server, so the first player online becomes the hub and the next one takes over if they leave. ───────── */
const WORLD = { peer: null, hub: false, hc: null, cl: new Map(), hist: [], on: false, n: 1, fr: {}, retry: 0, last: 0 };
function worldHiMsg() { return { t: 'hi', uid: SAVE.uid, name: myName(), room: NET.on ? NET.code : '', pub: !!(NET.on && NET.host && NET.pub), n: NET.players.length }; }
function worldRooms() { const all = [...WORLD.cl.values()]; if (WORLD.me) all.push(WORLD.me); return all.filter(c => c.pub && c.room && c.n < 12).sort((a, b) => b.n - a.n).slice(0, 10).map(c => ({ code: c.room, name: c.name, n: c.n })); }
function quickGo(list) { if (!WORLD.qm) return; WORLD.qm = false; const r = Array.isArray(list) && list.find(x => x && /^[A-Z0-9]{5}$/.test(x.code) && x.code !== NET.code); if (r) { netStatus('Found ' + (cleanName(r.name) || 'a') + "'s room — joining…"); netJoin(r.code); } else { netStatus('No open rooms right now — opening one for you.'); NET.pubNext = true; netHost(); } }
async function quickMatch() { if (PG) { if (!pgOnline()) return netStatus('Online play is not available here.'); pgBind(); netStatus('Looking for an open room…'); netClose(); try { const code = await MP().joinOrCreateRoom({ maxPlayers: 12, filter: { v: 1 } }); NET.pub = true; pgEnter(code, !!MP().isHost); } catch (e) { netStatus('Could not find or open a room (' + ((e && e.code) || 'connection error') + ').'); } return; }
  netStatus('Looking for an open room…'); WORLD.qm = true; await worldConnect(); let n = 0; const tick = () => { if (!WORLD.qm) return; if (WORLD.on) { if (WORLD.hub) quickGo(worldRooms()); else try { WORLD.hc.send({ t: 'rooms' }); } catch (e) {} } if (WORLD.qm && ++n < 10) setTimeout(tick, 1000); else if (WORLD.qm) quickGo([]); }; tick(); }
function worldHi() { if (!WORLD.on) return; if (WORLD.hub) WORLD.me = worldHiMsg(); else if (WORLD.hc && WORLD.hc.open) WORLD.hc.send(worldHiMsg()); }
async function worldConnect() {
  if (WORLD.peer) return; try { await loadPeer(); } catch (e) { return; }
  if (WORLD.peer) return; const peer = WORLD.peer = new Peer(WORLD_ID); let fell = false;
  const again = () => { if (WORLD.peer !== peer) return; try { peer.destroy(); } catch (e) {} WORLD.peer = null; WORLD.on = false; WORLD.hub = false; WORLD.hc = null; WORLD.cl.clear(); chatMeta(); setTimeout(worldConnect, 800 + Math.random() * 2500 + Math.min(20000, WORLD.retry++ * 1500)); };
  peer.on('open', () => { if (WORLD.peer !== peer) return; WORLD.hub = true; WORLD.on = true; WORLD.retry = 0; WORLD.me = worldHiMsg(); WORLD.n = 1; chatMeta(); friendsAsk(); });
  peer.on('connection', cn => {
    cn.on('open', () => { if (WORLD.cl.size >= 60) return cn.close(); WORLD.cl.set(cn.peer, { cn, uid: '', name: 'Driver', room: '', last: 0 }); cn.send({ t: 'hist', msgs: WORLD.hist.slice(-30) }); worldCount(); });
    cn.on('data', m => worldHubData(cn.peer, m)); const gone = () => { if (WORLD.cl.delete(cn.peer)) worldCount(); }; cn.on('close', gone); cn.on('error', gone);
  });
  peer.on('error', e => {
    if (WORLD.peer !== peer) return;
    if (e.type === 'unavailable-id' && !fell) { // somebody else is the hub: join it as a client
      fell = true; try { peer.destroy(); } catch (x) {} const p2 = WORLD.peer = new Peer();
      p2.on('open', () => { if (WORLD.peer !== p2) return; const cn = WORLD.hc = p2.connect(WORLD_ID, { reliable: true, serialization: 'json' });
        cn.on('open', () => { WORLD.on = true; WORLD.hub = false; WORLD.retry = 0; cn.send(worldHiMsg()); chatMeta(); friendsAsk(); });
        cn.on('data', worldClientData); cn.on('close', () => { if (WORLD.peer === p2) { try { p2.destroy(); } catch (x) {} WORLD.peer = null; WORLD.on = false; WORLD.hc = null; chatMeta(); setTimeout(worldConnect, 300 + Math.random() * 2500); } }); });
      p2.on('error', () => { if (WORLD.peer === p2) { try { p2.destroy(); } catch (x) {} WORLD.peer = null; WORLD.on = false; chatMeta(); setTimeout(worldConnect, 3000 + Math.random() * 4000 + Math.min(20000, WORLD.retry++ * 2000)); } });
    } else if (!fell) again();
  });
  peer.on('disconnected', () => { try { if (WORLD.peer === peer && WORLD.hub) peer.reconnect(); } catch (e) {} });
}
function worldCount() { WORLD.n = WORLD.cl.size + 1; const m = { t: 'n', n: WORLD.n }; for (const c of WORLD.cl.values()) try { if (c.cn.open) c.cn.send(m); } catch (e) {} chatMeta(); }
function worldRelay(name, text) { const m = { t: 'chat', name, text, ts: Date.now() }; WORLD.hist.push(m); if (WORLD.hist.length > 60) WORLD.hist.shift(); for (const c of WORLD.cl.values()) try { if (c.cn.open) c.cn.send(m); } catch (e) {} chatAdd('world', name, text); }
function worldStatus(ids) { const on = {}; if (!Array.isArray(ids)) return on; const all = [...WORLD.cl.values()]; if (WORLD.me) all.push(WORLD.me); for (const id of ids.slice(0, 50)) { const c = all.find(x => x.uid && x.uid === id); if (c) on[id] = { name: c.name, room: c.room }; } return on; }
function worldHubData(pid, m) {
  const c = WORLD.cl.get(pid); if (!c || !m || typeof m !== 'object') return;
  if (m.t === 'hi') { c.uid = cleanName(m.uid).slice(0, 8); c.name = cleanName(m.name) || 'Driver'; c.room = /^[A-Z0-9]{5}$/.test(m.room) ? m.room : ''; c.pub = !!m.pub; c.n = clamp(m.n | 0, 0, 12); }
  else if (m.t === 'rooms') try { c.cn.send({ t: 'rooms', list: worldRooms() }); } catch (e) {}
  else if (m.t === 'chat') { const now = Date.now(), text = String(m.text || '').slice(0, 140).trim(); if (!text || now - c.last < 900) return; c.last = now; worldRelay(c.name, text); }
  else if (m.t === 'fr') try { c.cn.send({ t: 'fr', on: worldStatus(m.ids) }); } catch (e) {}
}
function worldClientData(m) {
  if (!m || typeof m !== 'object') return;
  if (m.t === 'hist' && Array.isArray(m.msgs)) { CHAT.world = []; for (const x of m.msgs.slice(-30)) chatAdd('world', x.name, x.text, true); chatRender(); }
  else if (m.t === 'chat') chatAdd('world', m.name, m.text);
  else if (m.t === 'n') { WORLD.n = m.n | 0; chatMeta(); }
  else if (m.t === 'rooms') quickGo(m.list);
  else if (m.t === 'fr') { WORLD.fr = m.on && typeof m.on === 'object' ? m.on : {}; renderFriends(); }
}
function worldSay(text) { text = String(text || '').slice(0, 140).trim(); if (!text) return false; const now = Date.now(); if (now - WORLD.last < 900) return false; WORLD.last = now; if (!WORLD.on) { chatAdd('world', 'System', 'Not connected to world chat yet — try again in a moment.'); return false; } if (WORLD.hub) worldRelay(myName(), text); else try { WORLD.hc.send({ t: 'chat', text }); } catch (e) {} return true; }
function friendsAsk() { if (!WORLD.on) return; const ids = SAVE.friends.map(f => f.id); if (WORLD.hub) { WORLD.fr = worldStatus(ids); renderFriends(); } else try { WORLD.hc.send({ t: 'fr', ids }); } catch (e) {} }

/* ───────── voice chat inside a room (WebRTC audio calls between the room's players) ───────── */
const VOICE = { on: false, stream: null, calls: new Map(), els: new Map(), out: new Set() };
function voiceWire(call) {
  const old = VOICE.calls.get(call.peer); VOICE.calls.set(call.peer, call); if (old && old !== call) try { old.close(); } catch (e) {}
  call.on('stream', st => { let a = VOICE.els.get(call.peer); if (!a) { a = new Audio(); a.autoplay = true; VOICE.els.set(call.peer, a); } a.srcObject = st; const p = a.play(); if (p) p.catch(() => {}); voiceUi(); });
  const gone = () => { if (VOICE.calls.get(call.peer) === call) { VOICE.calls.delete(call.peer); const a = VOICE.els.get(call.peer); if (a) { a.srcObject = null; VOICE.els.delete(call.peer); } voiceUi(); } }; call.on('close', gone); call.on('error', gone);
}
function voiceHook(peer) { peer.on('call', call => { if (NET.peer !== peer || !NET.players.some(p => p.id === call.peer)) { try { call.close(); } catch (e) {} return; } call.answer(VOICE.stream || undefined); voiceWire(call); }); }
function voiceCallAll() { if (!VOICE.on || !NET.peer || !VOICE.stream) return; for (const p of NET.players) if (p.id !== NET.id && !VOICE.out.has(p.id)) { try { const call = NET.peer.call(p.id, VOICE.stream); if (call) { VOICE.out.add(p.id); voiceWire(call); } } catch (e) {} } }
function voiceMicOff() { if (VOICE.stream) for (const t of VOICE.stream.getTracks()) t.stop(); VOICE.stream = null; VOICE.on = false; VOICE.out.clear(); }
function voiceStop() { voiceMicOff(); for (const c of VOICE.calls.values()) try { c.close(); } catch (e) {} VOICE.calls.clear(); for (const a of VOICE.els.values()) a.srcObject = null; VOICE.els.clear(); voiceUi(); }
async function voiceToggle() {
  if (VOICE.on) { voiceMicOff(); voiceUi(); return; }
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { $('lobNote').textContent = 'This browser has no microphone access.'; return; }
  try { VOICE.stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } }); } catch (e) { $('lobNote').textContent = 'Microphone blocked — allow it in the browser to talk.'; return; }
  if (!NET.on) { voiceMicOff(); return; } VOICE.on = true; VOICE.out.clear(); voiceCallAll(); voiceUi();
}
function voiceUi() { const b = $('btnMic'); if (!b) return; b.textContent = VOICE.on ? 'Mic on' : 'Mic off'; b.classList.toggle('alt', !VOICE.on); $('micInfo').textContent = VOICE.calls.size ? 'Voice linked with ' + VOICE.calls.size + ' player' + (VOICE.calls.size > 1 ? 's' : '') : 'Turn the mic on to talk to the room'; }

/* ───────── chat drawer (world + room) ───────── */
const CHAT = { world: [], room: [], tab: 'world', open: false, unread: 0 };
function chatAdd(ch, name, text, quiet) { const L = CHAT[ch]; if (!L) return; L.push({ name: cleanName(name) || 'Driver', text: String(text || '').slice(0, 140) }); if (L.length > 80) L.shift(); if (quiet) return; if (CHAT.open && CHAT.tab === ch) chatRender(); else { CHAT.unread++; chatMeta(); } }
function chatRender() { const box = $('chatLog'); box.textContent = ''; const L = CHAT[CHAT.tab]; if (!L.length) { const p = document.createElement('p'); p.className = 'empty'; p.textContent = CHAT.tab === 'world' ? 'Nobody has said anything yet. Say hi to the paddock.' : NET.on ? 'Room chat is empty.' : 'Join or create a room to use room chat.'; box.appendChild(p); } for (const m of L) { const p = document.createElement('p'), b = document.createElement('b'); b.textContent = m.name + ' '; p.appendChild(b); p.appendChild(document.createTextNode(m.text)); box.appendChild(p); } box.scrollTop = box.scrollHeight; }
function chatMeta() { const b = $('chatBtn'); if (!b) return; b.textContent = 'Chat' + (CHAT.unread ? ' (' + CHAT.unread + ')' : ''); $('chatInfo').textContent = CHAT.tab === 'world' ? (WORLD.on ? WORLD.n + ' online' : 'connecting…') : NET.on ? 'Room ' + NET.code : 'not in a room'; document.querySelectorAll('#segChat button').forEach(x => x.classList.toggle('on', x.dataset.v === CHAT.tab)); }
function openChat(tab) { if (PG) return; if (tab) CHAT.tab = tab; CHAT.open = true; CHAT.unread = 0; $('chat').classList.remove('hidden'); chatMeta(); chatRender(); worldConnect(); }
function closeChat() { CHAT.open = false; $('chat').classList.add('hidden'); }
function chatSend() { const i = $('chatIn'), text = i.value.trim(); if (!text) return; if (CHAT.tab === 'world') { if (worldSay(text)) i.value = ''; } else if (NET.on) { if (NET.host) roomChat(myName(), text); else netSend({ t: 'chat', text: text.slice(0, 140) }); i.value = ''; } }

/* ───────── menus: home, shop, lobby, leaderboard, friends, settings ───────── */
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
function paintCoins() { document.querySelectorAll('.coinN').forEach(e => { e.textContent = SAVE.coins; }); }
function setView(dx) { VIEWDX = G.viewDx = dx || 0; resize(); }
function refreshHome() {
  const d = G.driver; helmetArt($('mmHelmet'), d); $('mmName').textContent = SAVE.name ? SAVE.name + ' · ' + d.name : d.name; $('mmTeam').textContent = d.team; paintCoins(); msBadge();
  if (G.phase === 'menu' && T) { const p = G.player; if (!p || p.d !== d || JSON.stringify(p.cos) !== JSON.stringify(cleanCos(SAVE.eq)) || p.name !== (SAVE.name || d.name)) spawnCars(d, true); }
}
function lookPreview(cos) { const c = G.player; if (!c || G.phase !== 'menu') return; scene.remove(c.mesh.g); c.cos = cleanCos(cos); c.mesh = makeCarMesh(c.d, c.cos, c.name); scene.add(c.mesh.g); c.col = carCol(c.d, c.cos); }
/* shop */
const SH = { tab: 'paint', sel: null };
const shopList = tab => tab === 'coins' ? PAY.packs.filter(x => x.url).map(x => ({ id: 'pack:' + x.id, k: x.id, tab, name: x.coins + ' coins', pack: x })) : tab === 'paint' ? Object.keys(PAINTS).map(k => ({ id: 'paint:' + k, k, tab, ...PAINTS[k] })) : tab === 'addon' ? Object.keys(ADDONS).map(k => ({ id: 'addon:' + k, k, tab, ...ADDONS[k] })) : Object.keys(TRAILS).map(k => ({ id: 'trail:' + k, k, tab, ...TRAILS[k] }));
const owned = it => !it.price || SAVE.owned.includes(it.id);
const equipped = it => it.tab === 'paint' ? SAVE.eq.p === it.k : it.tab === 'addon' ? SAVE.eq[it.slot] === it.k : SAVE.eq.t === it.k;
function tryCos(it) { const c = Object.assign({}, SAVE.eq); if (it) { if (it.tab === 'paint') c.p = it.k; else if (it.tab === 'addon') c[it.slot] = it.k; else c.t = it.k; } return c; }
function renderShop() {
  paintCoins(); const list = shopList(SH.tab), g = $('sgrid'); g.textContent = '';
  if (!SH.sel || SH.sel.tab !== SH.tab) SH.sel = list.find(equipped) || list[0];
  if (SH.tab === 'coins') { for (const it of list) { const b = document.createElement('button'); b.className = 'scard'; b.innerHTML = `<i class="sw ico">${IC.coin}</i><b>${it.pack.coins} coins</b><small>${esc(it.pack.price)}</small>`; b.onclick = () => { location.href = it.pack.url; }; g.appendChild(b); } lookPreview(SAVE.eq); G.shopFlame = null; $('shopInfo').textContent = 'Coin packs are paid with real money on a secure checkout page; the coins are added when you come back to the game.'; $('btnShopAct').classList.add('hidden'); return; }
  $('btnShopAct').classList.remove('hidden');
  for (const it of list) {
    const b = document.createElement('button'); b.className = 'scard' + (SH.sel.id === it.id ? ' sel' : '') + (equipped(it) ? ' eq' : '');
    const sw = it.tab === 'addon' ? `<i class="sw ico">${it.icon}</i>` : `<i class="sw" style="background:${it.rainbow ? 'conic-gradient(#ff3f6a,#ffd23f,#35e08a,#39a8ff,#b46bff,#ff3f6a)' : it.tab === 'trail' ? 'linear-gradient(135deg,' + it.cols[0] + ',' + it.cols[1] + ')' : it.col || 'linear-gradient(135deg,' + G.driver.c1 + ' 50%,' + G.driver.c2 + ' 50%)'}"></i>`;
    b.innerHTML = sw + `<b>${esc(it.name)}</b><small>${equipped(it) ? 'Equipped' : owned(it) ? 'Owned' : IC.coin + ' ' + it.price}</small>`;
    b.onclick = () => { SH.sel = it; renderShop(); }; g.appendChild(b);
  }
  const it = SH.sel, act = $('btnShopAct'); lookPreview(tryCos(it)); G.shopFlame = SH.tab === 'trail' ? it.k : null;
  $('shopInfo').textContent = it.tab === 'addon' ? SLOTS[it.slot] + ' slot — one add-on per slot.' : it.tab === 'paint' ? 'Paint replaces your team colours on track.' : 'Colour of your turbo and ERS flames.';
  act.disabled = false; act.classList.remove('alt');
  if (!owned(it)) { const short = it.price - SAVE.coins; act.textContent = short > 0 ? 'Need ' + short + ' more coins' : 'Buy for ' + it.price + ' coins'; act.disabled = short > 0; }
  else if (equipped(it)) { if (it.tab === 'addon') { act.textContent = 'Take off'; act.classList.add('alt'); } else { act.textContent = 'Equipped'; act.disabled = true; } }
  else act.textContent = 'Equip';
}
function shopAct() {
  const it = SH.sel; if (!it) return;
  if (!owned(it)) { if (SAVE.coins < it.price) return; SAVE.coins -= it.price; SAVE.owned.push(it.id); sfx('buy'); }
  if (it.tab === 'paint') SAVE.eq.p = it.k; else if (it.tab === 'trail') SAVE.eq.t = it.k; else SAVE.eq[it.slot] = SAVE.eq[it.slot] === it.k ? null : it.k;
  saveSave(); renderShop();
}
function openShop() { $('tabCoins').classList.toggle('hidden', !PAY.packs.some(x => x.url)); show('shop'); setView(.2); SH.sel = null; renderShop(); }
function closeShop() { G.shopFlame = null; setView(0); lookPreview(SAVE.eq); show('home'); }
/* lobby */
function openLobby() { show('lobby'); renderLobby(); voiceUi(); }
function renderLobby() {
  if (!NET.on) return; $('lobCode').textContent = NET.code; const ul = $('lobList'); ul.textContent = '';
  for (const p of NET.players) { const d = DRIVERS.find(x => x.id === p.driver) || DRIVERS[0], b = NET.board[p.id], li = document.createElement('li'); li.innerHTML = `<u style="background:${carCol(d, cleanCos(p.cos))}"></u><b>${esc(cleanName(p.name) || 'Driver')}</b><small>${esc(d.name)}${p.id === NET.players[0].id ? ' · host' : ''}${p.id === NET.id ? ' · you' : ''}</small><span>${b ? b.pts + ' pts' : ''}</span>`; ul.appendChild(li); }
  $('lobHost').classList.toggle('hidden', !NET.host); $('btnNetStart').classList.toggle('hidden', !NET.host);
  $('lobTrack').value = NET.track; $('lobDiff').value = G.diff; $('lobBots').checked = NET.bots; $('lobPub').checked = !!NET.pub; $('lobDriver').value = G.driver.id;
  $('lobNote').textContent = NET.host ? 'Share the code ' + NET.code + ' with friends, then start. ' + (NET.bots ? 'Bots fill the grid to 12 cars.' : 'No bots — humans only.') : (NET.racing ? 'A race is running — you will join the next one.' : 'Waiting for the host to start · ' + TRACKS[NET.track].name);
  if (!$('board').classList.contains('hidden')) renderBoard(); if (CHAT.open) chatMeta(); voiceCallAll();
}
/* leaderboard */
let boardTab = 'me';
function renderBoard() {
  document.querySelectorAll('#segBoard button').forEach(x => x.classList.toggle('on', x.dataset.v === boardTab)); const box = $('boardBox'), st = SAVE.stats;
  if (boardTab === 'room') {
    const rows = Object.values(NET.board).sort((a, b) => b.pts - a.pts || b.wins - a.wins);
    box.innerHTML = !NET.on ? '<p class="note">Create or join an online room — every race there scores 25-18-15… points and the room table lives here.</p>' : !rows.length ? '<p class="note">No online races finished in room ' + esc(NET.code) + ' yet.</p>' : '<table><tr><th>Pos</th><th>Player</th><th>Pts</th><th>Wins</th><th>Races</th></tr>' + rows.map((r, i) => `<tr><td>${i + 1}</td><td>${esc(cleanName(r.name) || 'Driver')}</td><td>${r.pts | 0}</td><td>${r.wins | 0}</td><td>${r.races | 0}</td></tr>`).join('') + '</table>';
  } else {
    box.innerHTML = `<div class="stats"><div><b>${st.races}</b><small>Races</small></div><div><b>${st.wins}</b><small>Wins</small></div><div><b>${st.podiums}</b><small>Podiums</small></div><div><b>${st.oraces}</b><small>Online races</small></div><div><b>${st.owins}</b><small>Online wins</small></div><div><b>${SAVE.coins}</b><small>Coins</small></div></div><table><tr><th>Circuit</th><th>Your best lap</th></tr>` + TRACKS.map(t => `<tr><td>${t.name}</td><td>${st.best[t.id] ? fmt(st.best[t.id]) : '—'}</td></tr>`).join('') + '</table>';
  }
}
/* friends */
function renderFriends() {
  const ul = $('frList'); if (!ul) return; $('frCode').textContent = SAVE.uid; ul.textContent = ''; let ch = false;
  if (!SAVE.friends.length) { const li = document.createElement('li'); li.className = 'empty'; li.textContent = 'No friends yet. Swap friend codes and add each other.'; ul.appendChild(li); }
  for (const f of SAVE.friends) {
    const s = WORLD.fr[f.id]; if (s && s.name && s.name !== f.name) { f.name = cleanName(s.name); ch = true; }
    const li = document.createElement('li'); li.innerHTML = `<i class="dot${s ? ' on' : ''}"></i><b>${esc(f.name || 'Driver')}</b><small>${esc(f.id)} · ${s ? (s.room ? 'in room ' + esc(s.room) : 'online') : WORLD.on ? 'offline' : '…'}</small>`;
    if (s && s.room) { const j = document.createElement('button'); j.className = 'sm'; j.textContent = 'Join'; j.onclick = () => { show('online'); $('netCode').value = s.room; netJoin(s.room); }; li.appendChild(j); }
    const x = document.createElement('button'); x.className = 'alt sm'; x.textContent = 'Remove'; x.onclick = () => { SAVE.friends = SAVE.friends.filter(y => y.id !== f.id); saveSave(); renderFriends(); }; li.appendChild(x); ul.appendChild(li);
  }
  if (ch) saveSave();
}
function addFriend() { const i = $('frIn'), id = i.value.toUpperCase().replace(/[^A-Z0-9]/g, ''), n = $('frNote'); if (id.length !== 8) { n.textContent = 'Friend codes are 8 characters.'; return; } if (id === SAVE.uid) { n.textContent = 'That is your own code.'; return; } if (SAVE.friends.some(f => f.id === id)) { n.textContent = 'Already on your list.'; return; } if (SAVE.friends.length >= 50) { n.textContent = 'Friends list is full (50).'; return; } SAVE.friends.push({ id, name: '' }); saveSave(); i.value = ''; n.textContent = 'Added. They show as online when they have the game open.'; renderFriends(); friendsAsk(); }
setInterval(() => { if (WORLD.on && !$('friends').classList.contains('hidden')) friendsAsk(); }, 6000);
/* settings */
function applySettings() { G.muted = SAVE.set.mute; audioGate(); renderer.setPixelRatio(SAVE.set.hq ? Math.min(devicePixelRatio || 1, 2) : 1); resize(); document.querySelectorAll('#segSound button').forEach(x => x.classList.toggle('on', (x.dataset.v === 'off') === SAVE.set.mute)); document.querySelectorAll('#segGfx button').forEach(x => x.classList.toggle('on', (x.dataset.v === 'hq') === SAVE.set.hq)); $('setName').value = SAVE.name; }
function copyText(t, btn) { const done = () => { const o = btn.textContent; btn.textContent = 'Copied!'; setTimeout(() => { btn.textContent = o; }, 1200); }; if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(done, () => {}); }
function buildMenus() {
  const seg = (id, fn) => $(id).querySelectorAll('button').forEach(b => b.onclick = () => { $(id).querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)); fn(b.dataset.v); });
  $('btnOnline').onclick = () => { initAudio(); show('online'); $('netName').value = SAVE.name; netStatus(''); };
  $('btnMissions').onclick = () => { initAudio(); show('missions'); renderMissions(); }; $('btnMsBack').onclick = () => show('home');
  $('btnShop').onclick = () => { initAudio(); openShop(); }; $('btnShopBack').onclick = closeShop; $('btnShopAct').onclick = shopAct; seg('segShop', v => { SH.tab = v; SH.sel = null; renderShop(); });
  $('btnBoard').onclick = () => { boardTab = NET.on ? 'room' : 'me'; show('board'); renderBoard(); }; $('btnBoardBack').onclick = () => show(NET.on ? 'lobby' : 'home'); seg('segBoard', v => { boardTab = v; renderBoard(); });
  $('btnFriends').onclick = () => { show('friends'); $('frNote').textContent = ''; renderFriends(); worldConnect(); friendsAsk(); }; $('btnFriendsBack').onclick = () => show('home'); $('btnFrAdd').onclick = addFriend; $('btnFrCopy').onclick = e => copyText(SAVE.uid, e.currentTarget);
  $('btnSettings').onclick = () => { show('settings'); applySettings(); }; $('btnSetBack').onclick = () => { SAVE.name = cleanName($('setName').value); saveSave(); show('home'); };
  seg('segSound', v => { SAVE.set.mute = v === 'off'; saveSave(); applySettings(); }); seg('segGfx', v => { SAVE.set.hq = v === 'hq'; saveSave(); applySettings(); });
  let rs = 0; $('btnReset').onclick = e => { if (Date.now() - rs > 4000) { rs = Date.now(); e.currentTarget.textContent = 'Click again to erase coins, items and records'; return; } clearTimeout(saveT); if (PG) { try { bridge.storage.delete(['apexgp.save']).then(() => location.reload(), () => location.reload()); } catch (x) { location.reload(); } } else { try { webDel(); } catch (x) {} location.reload(); } };
  // online
  const saveName = () => { SAVE.name = cleanName($('netName').value); saveSave(); };
  $('btnHost').onclick = () => { saveName(); netHost(); }; $('btnJoin').onclick = () => { saveName(); netJoin($('netCode').value); }; $('netCode').addEventListener('keydown', e => { if (e.key === 'Enter') $('btnJoin').click(); });
  $('btnOnlineBack').onclick = () => { WORLD.qm = false; netClose(); show('home'); }; $('btnLeave').onclick = () => netLeave(); $('btnNetStart').onclick = netStart; $('btnCopy').onclick = e => copyText(NET.code, e.currentTarget);
  $('btnLobBoard').onclick = () => { boardTab = 'room'; show('board'); renderBoard(); }; $('btnMic').onclick = voiceToggle;
  const ld = $('lobDriver'); DRIVERS.forEach(d => { const o = document.createElement('option'); o.value = d.id; o.textContent = d.name + ' · ' + d.team; ld.appendChild(o); });
  ld.onchange = () => { selectDriver(DRIVERS.find(d => d.id === ld.value) || DRIVERS[0]); if (NET.host) { NET.players[0] = meP(); netLobby(); } else netSend(Object.assign({ t: 'hello' }, meP())); };
  const lt = $('lobTrack'); TRACKS.forEach((t, i) => { const o = document.createElement('option'); o.value = i; o.textContent = t.name + ' — ' + t.sub; lt.appendChild(o); });
  lt.onchange = () => { NET.track = +lt.value; netLobby(); }; $('lobDiff').onchange = () => { G.diff = +$('lobDiff').value; netLobby(); }; $('lobBots').onchange = () => { NET.bots = $('lobBots').checked; netLobby(); }; $('lobPub').onchange = () => { NET.pub = $('lobPub').checked; if (PG) try { MP().setRoomVisible(NET.pub); } catch (e) {} netLobby(); }; $('btnQuick').onclick = () => { saveName(); quickMatch(); };
  // chat
  $('chatBtn').onclick = () => CHAT.open ? closeChat() : openChat(NET.on ? 'room' : 'world'); $('chatClose').onclick = closeChat; seg('segChat', v => { CHAT.tab = v; chatMeta(); chatRender(); });
  $('chatForm').addEventListener('submit', e => { e.preventDefault(); chatSend(); });
  $('btnDriver').onclick = () => { G.pickOnly = true; $('btnToSetup').textContent = 'Confirm driver'; show('garage'); };
  if (PG) { for (const id of ['btnFriends', 'chatBtn', 'btnMic', 'micInfo', 'netNameField']) $(id).classList.add('gone'); if (!pgOnline()) for (const id of ['btnOnline', 'segBoard']) $(id).classList.add('gone'); $('netCode').maxLength = 10; }
  applySettings(); paintCoins(); chatMeta();
}

function payReturn() { if (PG) return; // back from the checkout page: credit the pack once per checkout session
  const q = new URLSearchParams(location.search), pk = PAY.packs.find(x => x.url && x.id === q.get('pack')), sid = (q.get('session_id') || '').slice(0, 80); if (!pk || !sid) return;
  SAVE.paid = Array.isArray(SAVE.paid) ? SAVE.paid : []; if (!SAVE.paid.includes(sid)) { SAVE.paid.push(sid); SAVE.coins += pk.coins; saveSave(); paintCoins(); $('mmToast').textContent = 'Thank you! +' + pk.coins + ' coins added.'; $('mmToast').classList.add('on'); }
  history.replaceState(null, '', location.pathname);
}
function dailyBonus() { const day = new Date().toISOString().slice(0, 10); if (SAVE.day === day) return; const first = !SAVE.day; SAVE.day = day; if (!first) SAVE.coins += 100; saveSave(); paintCoins(); $('mmToast').textContent = first ? 'Welcome! You start with ' + SAVE.coins + ' coins — win more by racing.' : 'Daily bonus: +100 coins'; $('mmToast').classList.add('on'); setTimeout(() => $('mmToast').classList.remove('on'), 6000); }
loadAudio();
msInit();
track(loadCarModel()).then(() => { buildUI(); buildMenus(); attract(); dailyBonus(); payReturn(); requestAnimationFrame(frame); if (!PG) setTimeout(worldConnect, 2500); else if (pgOnline()) { let rid = ''; try { rid = MP().launchRoomId || ''; } catch (e) {} if (rid) { show('online'); netJoin(rid); } } });

/* debug / test hook */
window.__G = { renderMissions, msReady, msRace, pgOnline, netLeave, PG, AUD, TUT, sfx, quickMatch, NET, WORLD, SAVE, CHAT, VOICE, useItem, netHost, netJoin, netStart, saveSave, worldSay, renderShop, G, get T() { return T; }, TRACKS, DRIVERS, keys, update, startRace, sim(sec, dt = 1 / 60) { for (let i = 0, n = Math.round(sec / dt); i < n; i++) update(dt); } };
