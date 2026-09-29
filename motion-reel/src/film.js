// Chronovisor product reel. Pure function of time: window.seek(t) paints frame t.
import { clamp, spring, sp, tr, SNAPPY, DEFAULT, HEAVY, PLAYFUL } from '../lib/motion.js';

const q = new URLSearchParams(location.search);
const W = +q.get('w') || 1080, H = +q.get('h') || 1920;
export const DUR = 20;
const cv = document.getElementById('c');
cv.width = W; cv.height = H;
const ctx = cv.getContext('2d');
const port = H > W * 1.2, land = W > H * 1.2, sq = !port && !land;
const u = Math.min(W, H) / 1080;
const PI2 = Math.PI * 2, DEG = Math.PI / 180;

const C = {
  cyan: '#06b6d4', cyan4: '#22d3ee', cyan2: '#a5f3fc', blue6: '#2563eb',
  grid: 'rgba(6,182,212,0.10)', white: '#ffffff', ink: '#e0f2fe',
};
const DISPLAY = 'Orbitron', MONO = '"Share Tech Mono"';
const SLOW = [6, 5]; // near-critically damped drift for camera pushes

// ---------- assets ----------
const IMG = {};
let LAND, GRAT, BACKDROP;
const loadImg = (k, src) => new Promise((res, rej) => {
  const i = new Image(); i.onload = () => { IMG[k] = i; res(); }; i.onerror = rej; i.src = src;
});
async function load() {
  const fonts = [
    ['Orbitron', 'orbitron-latin-400-normal.woff2', '400'],
    ['Orbitron', 'orbitron-latin-700-normal.woff2', '700'],
    ['Orbitron', 'orbitron-latin-900-normal.woff2', '900'],
    ['Share Tech Mono', 'share-tech-mono-latin-400-normal.woff2', '400'],
  ];
  await Promise.all(fonts.map(async ([fam, file, weight]) => {
    const f = new FontFace(fam, `url(assets/fonts/${file})`, { weight });
    await f.load(); document.fonts.add(f);
  }));
  await Promise.all([
    // close-up states come from the 4x captures (crop coordinates stay in 2x units, see MUL)
    loadImg('header', 'assets/ui/02_header@4x.png'),
    loadImg('p_idle', 'assets/ui/04_panel_idle@4x.png'),
    loadImg('p_typed', 'assets/ui/06_search_typed@4x.png'),
    loadImg('p_scan', 'assets/ui/07_search_scanning@4x.png'),
    loadImg('p_locked', 'assets/ui/08_panel_locked@4x.png'),
    loadImg('p_engaging', 'assets/ui/13_panel_engaging@4x.png'),
    loadImg('vs_loading', 'assets/ui/12_viewscreen_loading@4x.png'),
    loadImg('vs_result', 'assets/ui/14_viewscreen_result.png'),
    loadImg('berlin', 'assets/scenes/berlin_1989.jpg'),
    loadImg('card_berlin', 'assets/scenes/berlin_souvenir.jpg'),
    loadImg('card_vesuvius', 'assets/scenes/vesuvius_souvenir.jpg'),
  ]);
  LAND = await (await fetch('assets/ne_110m_land.geojson')).json();
  GRAT = d3.geoGraticule()();
  // Blurred, darkened backdrop of the real result, prepared once
  BACKDROP = document.createElement('canvas');
  BACKDROP.width = W; BACKDROP.height = H;
  const b = BACKDROP.getContext('2d'), im = IMG.berlin;
  const s = Math.max(W / im.width, H / im.height) * 1.1;
  b.filter = `blur(${40 * u}px) brightness(0.45) saturate(1.1)`;
  b.drawImage(im, (W - im.width * s) / 2, (H - im.height * s) / 2, im.width * s, im.height * s);
  // Field background colour for the typing mask, sampled from the capture
  const probe = document.createElement('canvas'); probe.width = probe.height = 1;
  const pc = probe.getContext('2d');
  pc.drawImage(IMG.p_typed, 600 * MUL.p_typed, 282 * MUL.p_typed, 1, 1, 0, 0, 1, 1);
  const [r, g, bl] = pc.getImageData(0, 0, 1, 1).data;
  FIELD_BG = `rgb(${r},${g},${bl})`;
}
let FIELD_BG = '#020617';
// source-pixel multiplier per image: 2 for the 4x captures, 1 for the 2x ones
const MUL = { header: 2, p_idle: 2, p_typed: 2, p_scan: 2, p_locked: 2, p_engaging: 2, vs_loading: 2 };

// ---------- crops of the real captures (2x px) ----------
const CR = (k, x, y, w, h) => ({ k, x, y, w, h, a: w / h });
const P = (k, y0, y1) => CR(k, 30, y0, 826, y1 - y0);
const K = {
  header: CR('header', 20, 30, 650, 110),
  search_idle: P('p_idle', 175, 340), search_typed: P('p_typed', 175, 340), search_scan: P('p_scan', 175, 340),
  vector_idle: P('p_idle', 385, 580), vector_locked: P('p_engaging', 385, 580),
  temporal_idle: P('p_idle', 598, 808), temporal_locked: P('p_engaging', 598, 808),
  actions_ready: P('p_locked', 1255, 1385), actions_engaging: P('p_engaging', 1255, 1385),
  loading: CR('vs_loading', 380, 950, 1060, 370),
  result: CR('vs_result', 0, 0, 1820, 2324),
};
// points inside crops (crop px)
const PT = {
  field: [300 - 30, 282 - 175], searchBtn: [790 - 30, 282 - 175],
  jump: [647 - 30, 1322 - 1255], souvenir: [1595, 154],
  spinner: [909.5 - 380, 1069.5 - 950],
};

function drawCrop(c, cx, cy, w) {
  const h = w / c.a, m = MUL[c.k] || 1;
  ctx.drawImage(IMG[c.k], c.x * m, c.y * m, c.w * m, c.h * m, cx - w / 2, cy - h / 2, w, h);
}
const rectOf = (cx, cy, w, a) => ({ x: cx - w / 2, y: cy - w / a / 2, w, h: w / a, cx, cy });
const ptIn = (c, r, p) => [r.x + (p[0] / c.w) * r.w, r.y + (p[1] / c.h) * r.h];

// Content slides inside its own rect: up from below at tIn, up and out at tOut.
function slab(t, r, tIn, tOut, fn, pin = HEAVY, pout = DEFAULT) {
  if (t < tIn) return;
  const a = sp(t - tIn, pin), b = tOut == null ? 0 : sp(t - tOut, pout);
  if (b > 0.999) return;
  ctx.save();
  ctx.beginPath(); ctx.rect(r.x, r.y, r.w, r.h); ctx.clip();
  ctx.translate(0, (1 - a) * r.h * 1.08 - b * r.h * 1.08);
  fn();
  ctx.restore();
}

// ---------- type ----------
const font = (px, w = 900, fam = DISPLAY) => `${w} ${px}px ${fam}`;
function textW(s, px, w = 900, fam = DISPLAY, ls = 0) {
  ctx.save(); ctx.font = font(px, w, fam); ctx.letterSpacing = `${ls * px}px`;
  const m = ctx.measureText(s).width; ctx.restore(); return m;
}
const fitPx = (lines, maxW, maxPx, w = 900, fam = DISPLAY, ls = 0) =>
  Math.min(maxPx, maxW / Math.max(...lines.map(l => textW(l, 100, w, fam, ls))) * 100);

function text(s, x, y, px, { w = 900, fam = DISPLAY, ls = -0.02, color = C.white, align = 'left' } = {}) {
  ctx.font = font(px, w, fam); ctx.letterSpacing = `${ls * px}px`;
  ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = 'alphabetic';
  ctx.fillText(s, x, y);
}
// A line of type in its mask band (baseline y)
function kline(t, s, x, y, px, tIn, tOut, opt = {}) {
  const band = { x: 0, y: y - px * 0.95, w: W, h: px * 1.22 };
  slab(t, band, tIn, tOut, () => text(s, x, y, px, opt), opt.pin || HEAVY);
}
// Odometer column: digit rolls from a to b (b may exceed 9: extra turns)
function odoDigit(t, x, y, px, cell, a, b, tIn, color) {
  const v = a + (b - a) * sp(t - tIn, DEFAULT);
  const n = Math.floor(v), f = v - n, lh = px * 1.1;
  ctx.save();
  ctx.beginPath(); ctx.rect(x, y - px * 0.8, cell, px * 0.9); ctx.clip(); // cap height only
  text(String(((n % 10) + 10) % 10), x + cell / 2, y - f * lh, px, { color, align: 'center', ls: 0 });
  text(String((((n + 1) % 10) + 10) % 10), x + cell / 2, y + (1 - f) * lh, px, { color, align: 'center', ls: 0 });
  ctx.restore();
}

// ---------- layout (reframes per format) ----------
const M = port ? 0.06 * W : sq ? 0.07 * W : 0.07 * W;
const LY = (() => {
  if (port) {
    const sw = 0.76 * W, st = 1088 / 1920 * H, gap = 20 * u;
    const hS = sw / K.search_idle.a, hV = sw / K.vector_idle.a, hT = sw / K.temporal_idle.a;
    const hero = { cx: W / 2, cy: 0.54 * H, w: 0.88 * W };
    const g4b = { cx: W / 2, cy: 0.38 * H, r: 0.33 * W };
    const vb = g4b.cy + g4b.r + 40 * u;
    const v4 = rectOf(W / 2, vb + (0.88 * W / K.vector_locked.a) / 2, 0.88 * W, K.vector_locked.a);
    const t4 = rectOf(W / 2, v4.y + v4.h + 24 * u + (0.88 * W / K.temporal_locked.a) / 2, 0.88 * W, K.temporal_locked.a);
    return {
      header: { cx: W / 2, cy: 0.075 * H, w: 0.62 * W },
      g2: { cx: W / 2, cy: 0.335 * H, r: 0.36 * W },
      s2: { cx: W / 2, cy: st + hS / 2, w: sw },
      v2: { cx: W / 2, cy: st + hS + gap + hV / 2, w: sw },
      t2: { cx: W / 2, cy: st + hS + hV + 2 * gap + hT / 2, w: sw },
      hero,
      g4: { cx: W / 2, cy: 0.47 * H, r: 0.44 * W }, g4b, v4, t4,
      load: { cx: W / 2, cy: 0.54 * H, w: 0.88 * W, w2: 1.02 * W },
      res: { cx: W / 2, cy: 0.5 * H, w: 0.94 * W },
      cardB: { cx: W / 2, cy: 0.37 * H, w: 0.88 * W, rot: -3 },
      cardV: { cx: W / 2 + 0.02 * W, cy: 0.67 * H, w: 0.88 * W, rot: 2.5 },
      cap: { x: M, maxW: 0.88 * W, maxPx: 132 * u },
      capTop: 0.075 * H,
    };
  }
  if (land) {
    const sw = 0.46 * W, st = 0.25 * H, gap = 18 * u, cx = 0.70 * W;
    const hS = sw / K.search_idle.a, hV = sw / K.vector_idle.a, hT = sw / K.temporal_idle.a;
    return {
      header: { cx, cy: 0.13 * H, w: 0.36 * W },
      g2: { cx: 0.28 * W, cy: 0.52 * H, r: 0.40 * H },
      s2: { cx, cy: st + hS / 2, w: sw },
      v2: { cx, cy: st + hS + gap + hV / 2, w: sw },
      t2: { cx, cy: st + hS + hV + 2 * gap + hT / 2, w: sw },
      hero: { cx: W / 2, cy: 0.6 * H, w: 0.6 * W },
      g4: { cx: 0.29 * W, cy: 0.52 * H, r: 0.42 * H }, g4b: { cx: 0.29 * W, cy: 0.52 * H, r: 0.42 * H },
      v4: rectOf(0.72 * W, 0.53 * H, 0.46 * W, K.vector_locked.a),
      t4: rectOf(0.72 * W, 0.77 * H, 0.46 * W, K.temporal_locked.a),
      load: { cx: W / 2, cy: 0.6 * H, w: 0.6 * W, w2: 0.7 * W },
      res: { cx: W / 2, cy: 0.5 * H, w: 0.94 * H * K.result.a },
      cardB: { cx: 0.28 * W, cy: 0.6 * H, w: 0.42 * W, rot: -3 },
      cardV: { cx: 0.72 * W, cy: 0.62 * H, w: 0.42 * W, rot: 2.5 },
      cap: { x: 0.2 * W, maxW: 0.6 * W, maxPx: 104 * u },
      capTop: 0.1 * H,
    };
  }
  const sw = 0.62 * W, st = 0.47 * H, gap = 14 * u;
  const hS = sw / K.search_idle.a, hV = sw / K.vector_idle.a, hT = sw / K.temporal_idle.a;
  return {
    header: null,
    g2: { cx: W / 2, cy: 0.25 * H, r: 0.2 * W },
    s2: { cx: W / 2, cy: st + hS / 2, w: sw },
    v2: { cx: W / 2, cy: st + hS + gap + hV / 2, w: sw },
    t2: { cx: W / 2, cy: st + hS + hV + 2 * gap + hT / 2, w: sw },
    hero: { cx: W / 2, cy: 0.6 * H, w: 0.86 * W },
    g4: { cx: W / 2, cy: 0.6 * H, r: 0.3 * W }, g4b: { cx: 0.25 * W, cy: 0.6 * H, r: 0.2 * W },
    v4: rectOf(0.735 * W, 0.51 * H, 0.47 * W, K.vector_locked.a),
    t4: rectOf(0.735 * W, 0.68 * H, 0.47 * W, K.temporal_locked.a),
    load: { cx: W / 2, cy: 0.6 * H, w: 0.86 * W, w2: 0.98 * W },
    res: { cx: W / 2, cy: 0.5 * H, w: 0.94 * H * K.result.a },
    cardB: { cx: 0.42 * W, cy: 0.47 * H, w: 0.64 * W, rot: -4 },
    cardV: { cx: 0.6 * W, cy: 0.72 * H, w: 0.64 * W, rot: 3 },
    cap: { x: 0.07 * W, maxW: 0.86 * W, maxPx: 92 * u },
    capTop: 0.08 * H,
  };
})();
// Feature close-ups: on narrow frames the camera goes closer than the frame and pans
const HW = land ? LY.hero.w : (port ? 1.5 : 1.3) * W;
const SEARCH_A = land ? LY.hero.cx : M + HW / 2, SEARCH_B = land ? LY.hero.cx : W - M - HW / 2;
function searchRect(t) {
  const { s2, hero } = LY;
  const cx = tr(t, [[0, s2.cx], [4.0, SEARCH_A], [5.05, SEARCH_B]]);
  const cy = tr(t, [[0, s2.cy], [4.0, hero.cy]]), w = tr(t, [[0, s2.w], [4.0, HW]]);
  return rectOf(cx, cy, w, K.search_idle.a);
}
const actionsRect = () => {
  const jx = PT.jump[0] / K.actions_ready.w;
  return rectOf(land ? LY.hero.cx : W / 2 - (jx - 0.5) * HW, LY.hero.cy, HW, K.actions_ready.a);
};
const LOAD = land ? [0.6 * W, 0.8 * W] : port ? [0.9 * W, 1.35 * W] : [0.86 * W, 1.2 * W];
function loadRect(t) {
  const w = LOAD[0] + (LOAD[1] - LOAD[0]) * spring(t - 10.0, SLOW[0], SLOW[1]), h = w / K.loading.a;
  const [sx, sy] = PT.spinner;
  return rectOf(LY.load.cx - (sx / K.loading.w - 0.5) * w, LY.load.cy - (sy / K.loading.h - 0.5) * h, w, K.loading.a);
}

// ---------- background ----------
function background(t) {
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  const pitch = 40 * u, off = (t * 14 * u) % pitch, lw = Math.max(1, 2 * u);
  ctx.fillStyle = C.grid;
  for (let x = (W / 2) % pitch; x < W; x += pitch) ctx.fillRect(x, 0, lw, H);
  for (let y = -off; y < H; y += pitch) ctx.fillRect(0, y, W, lw);
}

// ---------- 1. hook ----------
function hook(t) {
  if (t > 3) return;
  const lines = land
    ? [[['YOU CAN', 0.0], ["'T", 0.1, 'drop']], [['VISIT ', 0.5], ['1989', 1.0, 'odo'], ['.', 1.0]]]
    : [[['YOU', 0.0]], [['CAN', 0.12], ["'T", 0.12, 'drop']], [['VISIT', 0.5]], [['1989', 1.0, 'odo'], ['.', 1.0]]];
  const strs = lines.map(l => l.map(k => k[0]).join(''));
  const px = fitPx(strs, (land ? 0.8 : 0.86) * W, (land ? 230 : 250) * u);
  const lh = px * 1.02, top = (H - lh * lines.length) / 2 + px * 0.82;
  const x0 = land ? 0.1 * W : M;
  const cell = textW('0', px, 900, DISPLAY, 0);
  lines.forEach((line, li) => {
    const y = top + li * lh, tOut = 2.0 + li * 0.05;
    let x = x0;
    for (const [s, tIn, kind] of line) {
      if (kind === 'odo') {
        const from = '2026', to = '1989';
        slab(t, { x: 0, y: y - px * 0.95, w: W, h: px * 1.22 }, tIn, tOut, () => {
          for (let i = 0; i < 4; i++)
            odoDigit(t, x + i * cell, y, px, cell, +from[i], +to[i] + 10, tIn + 0.05 + i * 0.07, C.cyan);
        });
        x += cell * 4;
      } else if (kind === 'drop') {
        const td = t - 1.5, w = textW(s, px);
        if (td <= 0) kline(t, s, x, y, px, tIn, null);
        else {
          ctx.save();
          const dy = 0.5 * 5200 * u * td * td - 380 * u * td, rot = td * 2.6;
          ctx.translate(x + w / 2, y - px * 0.35 + dy); ctx.rotate(rot);
          text(s, -w / 2, px * 0.35, px);
          ctx.restore();
        }
        x += w;
      } else {
        kline(t, s, x, y, px, tIn, tOut, { color: s === '.' ? C.cyan : C.white });
        x += textW(s, px);
      }
    }
  });
}

// ---------- globe (port of components/Globe.tsx drawing) ----------
function globe(cx, cy, r, rot, mk) {
  const s = r / 201, Rw = r * 1.1;
  ctx.save();
  // wrapper: shadow-[0_0_50px_rgba(6,182,212,0.15)] + border-4 cyan-900/50
  const halo = ctx.createRadialGradient(cx, cy, Rw, cx, cy, Rw + 50 * s);
  halo.addColorStop(0, 'rgba(6,182,212,0.15)'); halo.addColorStop(1, 'rgba(6,182,212,0)');
  ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(cx, cy, Rw + 50 * s, 0, PI2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx, cy, Rw, 0, PI2); ctx.fillStyle = '#000'; ctx.fill();
  ctx.clip();
  const proj = d3.geoOrthographic().scale(r).translate([cx, cy]).clipAngle(90).rotate(rot);
  const path = d3.geoPath(proj, ctx);
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, PI2);
  ctx.fillStyle = '#020617'; ctx.fill();
  ctx.lineWidth = 2 * s; ctx.strokeStyle = '#0e7490'; ctx.stroke();
  ctx.beginPath(); path(GRAT);
  ctx.globalAlpha = 0.2; ctx.lineWidth = 0.5 * s; ctx.strokeStyle = '#0891b2'; ctx.stroke();
  ctx.globalAlpha = 0.8;
  ctx.beginPath(); path(LAND);
  ctx.fillStyle = '#0f172a'; ctx.fill();
  ctx.shadowColor = 'rgba(6,182,212,0.3)'; ctx.shadowBlur = 2 * s;
  ctx.lineWidth = 0.8 * s; ctx.strokeStyle = C.cyan; ctx.stroke();
  ctx.shadowBlur = 0; ctx.globalAlpha = 1;
  if (mk && mk.p > 0.001) {
    const dot = d3.geoCircle().center(mk.at).radius(Math.max(0.01, 2.5 * mk.p))();
    ctx.beginPath(); path(dot);
    ctx.shadowColor = '#ef4444'; ctx.shadowBlur = 8 * s;
    ctx.fillStyle = '#ef4444'; ctx.fill();
    ctx.shadowBlur = 0; ctx.lineWidth = 1.5 * s; ctx.strokeStyle = '#fff'; ctx.stroke();
    const ping = d3.geoCircle().center(mk.at).radius(Math.max(0.01, 5 * mk.q))();
    ctx.beginPath(); path(ping);
    ctx.setLineDash([2 * s, 2 * s]); ctx.globalAlpha = 0.6;
    ctx.lineWidth = 1 * s; ctx.strokeStyle = '#ef4444'; ctx.stroke();
    ctx.setLineDash([]); ctx.globalAlpha = 1;
  }
  // inset shadow 60px + radial overlay (opacity .2)
  const ins = ctx.createRadialGradient(cx, cy, Math.max(0, Rw - 60 * s), cx, cy, Rw);
  ins.addColorStop(0, 'rgba(0,0,0,0)'); ins.addColorStop(1, 'rgba(0,0,0,0.9)');
  ctx.fillStyle = ins; ctx.fillRect(cx - Rw, cy - Rw, 2 * Rw, 2 * Rw);
  const rad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Rw * 1.414);
  rad.addColorStop(0, 'rgba(0,0,0,0)'); rad.addColorStop(1, 'rgba(0,0,0,0.2)');
  ctx.fillStyle = rad; ctx.fillRect(cx - Rw, cy - Rw, 2 * Rw, 2 * Rw);
  ctx.restore();
  ctx.beginPath(); ctx.arc(cx, cy, Rw, 0, PI2);
  ctx.lineWidth = 4 * s; ctx.strokeStyle = 'rgba(22,78,99,0.5)'; ctx.stroke();
}

const BERLIN = [13.3985, 52.5548];
function globeStage(t) {
  if (t < 1.9 || t > 10.2) return;
  const { g2, g4, g4b } = LY;
  const off = H + g2.r * 1.4;
  const cy = tr(t, [[0, off], [2.0, g2.cy], [4.0, off], [6.0, g4.cy], [7.5, g4b.cy], [9.0, -g4b.r * 1.5]]);
  const cx = tr(t, [[0, g2.cx], [5.0, g4.cx], [7.5, g4b.cx]]);
  const r = tr(t, [[0, g2.r], [5.0, g4.r], [7.5, g4b.r]]);
  const lam = tr(t, [[0, 160], [2.0, 0], [5.0, 110], [6.0, -BERLIN[0]]]);
  const phi = tr(t, [[0, -30], [6.0, -BERLIN[1] * 0.5]]);
  const mk = { at: BERLIN, p: sp(t - 7.0, PLAYFUL), q: sp(t - 7.08, DEFAULT) };
  globe(cx, cy, r, [lam, phi, 0], mk);
}

// ---------- UI stage (captures) ----------
function uiStage(t) {
  const { s2, v2, t2, header } = LY;
  // header wordmark (real capture)
  if (header && t > 2 && t < 4.6) {
    const r = rectOf(header.cx, header.cy, header.w, K.header.a);
    slab(t, r, 2.25, 4.0, () => drawCrop(K.header, r.cx, r.cy, r.w));
  }
  // search module: assembles in its slot, then becomes the hero
  if (t > 2.4 && t < 6.7) {
    const r = searchRect(t), { cx, cy, w } = r;
    slab(t, r, 2.5, 6.0, () => {
      if (t < 4.55) drawCrop(K.search_idle, cx, cy, w);
      else if (t < 5.55) {
        drawCrop(K.search_typed, cx, cy, w);
        const n = Math.floor(clamp((t - 4.55) / 0.7) * 23), k = w / K.search_typed.w;
        const x0 = r.x + (68 - 30 + n * 14.45) * k;
        ctx.fillStyle = FIELD_BG;
        ctx.fillRect(x0, r.y + (256 - 175) * k, r.x + (722 - 30) * k - x0, (308 - 256) * k);
        ctx.fillStyle = C.cyan2;
        ctx.fillRect(x0 + 2 * k, r.y + (264 - 175) * k, 3 * k, 36 * k);
      } else drawCrop(K.search_scan, cx, cy, w);
    });
  }
  // vector + temporal slabs assemble (idle state), leave when search goes hero
  if (t > 2.6 && t < 4.7) {
    const rv = rectOf(v2.cx, v2.cy, v2.w, K.vector_idle.a);
    slab(t, rv, 2.75, 4.0, () => drawCrop(K.vector_idle, rv.cx, rv.cy, rv.w));
    const rt = rectOf(t2.cx, t2.cy, t2.w, K.temporal_idle.a);
    slab(t, rt, 3.0, 4.05, () => drawCrop(K.temporal_idle, rt.cx, rt.cy, rt.w));
  }
  // locked vector + temporal (feature 2)
  if (t > 7.4 && t < 9.8) {
    const { v4, t4 } = LY;
    slab(t, v4, 7.5, 9.0, () => drawCrop(K.vector_locked, v4.cx, v4.cy, v4.w));
    slab(t, t4, 8.0, 9.05, () => {
      const p = sp(t - 8.25, SNAPPY);
      drawCrop(K.temporal_idle, t4.cx, t4.cy - p * t4.h, t4.w);
      drawCrop(K.temporal_locked, t4.cx, t4.cy + (1 - p) * t4.h, t4.w);
    });
  }
  // actions row (feature 3a)
  if (t > 8.9 && t < 10.8) {
    const r = actionsRect();
    slab(t, r, 9.0, 10.0, () => drawCrop(t < 9.56 ? K.actions_ready : K.actions_engaging, r.cx, r.cy, r.w));
  }
  // loading viewscreen with the app's own spinner turning
  if (t > 9.9 && t < 12.4) {
    const r = loadRect(t), w = r.w;
    slab(t, r, 10.0, null, () => {
      drawCrop(K.loading, r.cx, r.cy, r.w);
      const k = w / K.loading.w, [sx, sy] = PT.spinner, rad = 80;
      const px = r.x + sx * k, py = r.y + sy * k;
      ctx.fillStyle = '#000';
      ctx.fillRect(px - rad * k, py - rad * k, 2 * rad * k, 2 * rad * k);
      ctx.save(); ctx.translate(px, py); ctx.rotate((t - 10) * PI2);
      ctx.beginPath(); ctx.arc(0, 0, (rad - 1) * k, 0, PI2); ctx.clip();
      const m = MUL.vs_loading;
      ctx.drawImage(IMG.vs_loading, (380 + sx - rad) * m, (950 + sy - rad) * m, 2 * rad * m, 2 * rad * m,
        -rad * k, -rad * k, 2 * rad * k, 2 * rad * k);
      ctx.restore();
    });
  }
}

// ---------- captions ----------
function caption(t, lines, tIn, tOut, anchor) {
  if (t < tIn || t > tOut + 0.8) return;
  const { cap } = LY;
  const right = anchor === 'top' && land && tIn > 6 && tIn < 7; // beside the globe in 16:9
  const px = fitPx(lines, right ? 0.44 * W : cap.maxW, cap.maxPx);
  const lh = px * 1.08;
  let y0;
  if (anchor === 'top') y0 = LY.capTop + px * 0.85;
  else y0 = anchor - 56 * u - (lines.length - 1) * lh; // bottom-anchored above a hero element
  const x = right ? 0.5 * W : cap.x;
  lines.forEach((l, i) => kline(t, l, x, y0 + i * lh, px, tIn + i * 0.1, tOut + i * 0.04,
    { color: i === lines.length - 1 ? C.cyan : C.white }));
}
function captions(t) {
  const hs = searchRect(4.6), ha = actionsRect();
  caption(t, ['ASK FOR', 'ANY MOMENT.'], 4.0, 6.0, hs.y);
  caption(t, ['IT LOCKS', 'WHERE & WHEN.'], 6.25, 9.0, 'top');
  caption(t, ['THEN YOU', 'JUMP.'], 9.0, 11.75, Math.min(ha.y, loadRect(10).y + 40 * u));
  caption(t, ['SAVE THE', 'SOUVENIR.'], 14.5, 16.0, 'top');
}

// ---------- result reveal + souvenir ----------
function resultRect(t) {
  const { res } = LY;
  const push = 1 + 0.05 * spring(t - 12, SLOW[0], SLOW[1]) - 0.1 * sp(t - 14.5, DEFAULT);
  const cy = tr(t, [[0, res.cy], [16.0, -H * 0.8]]);
  return rectOf(res.cx, cy, res.w * push, K.result.a);
}
function result(t) {
  if (t < 12 || t > 17) return;
  const bd = 1 - sp(t - 16.0, DEFAULT);
  ctx.save(); ctx.translate(0, -(1 - bd) * H);
  ctx.drawImage(BACKDROP, 0, 0);
  ctx.restore();
  const r = resultRect(t);
  // scanline wipe: bands sweep in left to right with a staggered snappy spring
  const N = 28, bh = r.h / N;
  ctx.save();
  ctx.beginPath();
  for (let i = 0; i < N; i++) {
    const p = sp(t - 12 - i * 0.011, SNAPPY);
    ctx.rect(r.x, r.y + i * bh - 0.5, r.w * clamp(p, 0, 1), bh + 1);
  }
  ctx.clip();
  drawCrop(K.result, r.cx, r.cy, r.w);
  // push back when the souvenir lifts off
  const dim = 0.6 * sp(t - 14.5, DEFAULT);
  if (dim > 0) { ctx.fillStyle = `rgba(0,0,0,${dim})`; ctx.fillRect(r.x, r.y, r.w, r.h); }
  ctx.restore();
  // leading edge of the wipe
  for (let i = 0; i < N; i++) {
    const p = sp(t - 12 - i * 0.011, SNAPPY);
    if (p > 0.02 && p < 0.97) { ctx.fillStyle = C.cyan4; ctx.fillRect(r.x + r.w * p - 3 * u, r.y + i * bh, 6 * u, bh); }
  }
}
function card(im, cx, cy, w, rot) {
  const h = w * im.height / im.width;
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot * DEG);
  ctx.shadowColor = 'rgba(0,0,0,0.7)'; ctx.shadowBlur = 50 * u; ctx.shadowOffsetY = 24 * u;
  ctx.fillStyle = '#000'; ctx.fillRect(-w / 2, -h / 2, w, h);
  ctx.shadowColor = 'transparent';
  ctx.drawImage(im, -w / 2, -h / 2, w, h);
  ctx.restore();
}
function souvenir(t) {
  if (t < 14.4 || t > 17) return;
  const { cardB, cardV } = LY;
  const r = resultRect(14.4);
  const [bx, by] = ptIn(K.result, r, PT.souvenir);
  const pB = sp(t - 14.5, PLAYFUL), up = sp(t - 16.0, DEFAULT);
  card(IMG.card_berlin, bx + (cardB.cx - bx) * pB, by + (cardB.cy - by) * pB - up * H * 1.2,
    cardB.w * (0.12 + 0.88 * pB), cardB.rot * pB);
  if (t > 14.95) {
    const pV = sp(t - 15.0, DEFAULT), up2 = sp(t - 16.06, DEFAULT);
    card(IMG.card_vesuvius, cardV.cx + (1 - pV) * W, cardV.cy - up2 * H * 1.2, cardV.w, cardV.rot);
  }
}

// ---------- proof ----------
function proof(t) {
  if (t < 15.95 || t > 18.9) return;
  const lines = land ? ['100,000,000 BC', 'TO AD 3000'] : ['100,000,000', 'BC', 'TO AD 3000'];
  const px = fitPx(lines, (land ? 0.84 : 0.88) * W, 210 * u, 900, DISPLAY, 0.02);
  const lh = px * 1.12, sub = px * 0.3;
  const top = (H - lh * lines.length - sub * 1.6) / 2 + px * 0.85;
  const x0 = land ? 0.08 * W : M;
  const tIns = land ? [16.0, 16.75] : [16.0, 16.1, 16.75];
  lines.forEach((l, li) => {
    const y = top + li * lh, tOut = 18.0 + li * 0.05, color = li === lines.length - 1 ? C.cyan : C.white;
    if (li === 0) {
      slab(t, { x: 0, y: y - px * 0.95, w: W, h: px * 1.22 }, tIns[0], tOut, () => {
        let x = x0; const digits = [...'100,000,000'];
        digits.forEach((ch, i) => {
          const cw = textW(ch === ',' ? ',' : '0', px, 900, DISPLAY, 0);
          if (ch === ',') text(',', x, y, px, { ls: 0 });
          else odoDigit(t, x, y, px, cw, 0, +ch + 10, tIns[0] + (digits.length - 1 - i) * 0.035, C.white);
          x += cw + px * 0.02;
        });
        if (land) text(' BC', x, y, px, { ls: 0.02 });
      });
    } else kline(t, l, x0, y, px, tIns[li], tOut, { color, ls: 0.02 });
  });
  const ys = top + (lines.length - 1) * lh + sub * 1.9;
  kline(t, 'EVERY YEAR IN BETWEEN.', x0 + 4 * u, ys, sub, 17.1, 18.0,
    { w: 400, fam: MONO, ls: 0.3, color: C.ink, pin: DEFAULT });
}

// ---------- lockup ----------
function lockup(t) {
  if (t < 17.95) return;
  // Ring (two concentric circles, as in the app header) + CHRONOVISOR wordmark.
  // Wide frames keep the header's inline ring; tall frames stack it above for a bigger wordmark.
  const inline = land;
  const wmW = (port ? 0.88 : land ? 0.6 : 0.8) * W;
  const wm = textW('CHRONOVISOR', 100, 900, DISPLAY, -0.05);
  const px = inline ? wmW / (wm / 100 + 1.25) : wmW / (wm / 100);
  const ro = inline ? px * 0.5 : px * 0.62, gap = px * 0.25;
  const textWidth = wm / 100 * px;
  const tp = fitPx(['ANY PLACE. ANY TIME.'], textWidth, px * 0.62, 700, DISPLAY, 0.04);
  const cp = fitPx(['PICK A YEAR. PICK A PLACE.'], textWidth * 0.92, px * 0.4, 400, MONO, 0.3);
  const blockH = (inline ? px : 2 * ro + gap * 1.4 + px) + tp * 1.9 + cp * 2.4;
  const x0 = inline ? (W - (textWidth + 2 * ro + gap)) / 2 : (W - textWidth) / 2;
  const top = (H - blockH) / 2 - (port ? 0.02 * H : 0);
  const rcx = x0 + ro, rcy = inline ? top + px * 0.5 : top + ro;
  const sweep = PI2 * sp(t - 18.0, [90, 19]);
  ctx.lineCap = 'butt';
  ctx.lineWidth = ro * 0.15; ctx.strokeStyle = C.cyan;
  ctx.beginPath(); ctx.arc(rcx, rcy, ro - ctx.lineWidth / 2, -Math.PI / 2, -Math.PI / 2 + sweep); ctx.stroke();
  ctx.lineWidth = ro * 0.07; ctx.strokeStyle = '#67e8f9';
  ctx.beginPath(); ctx.arc(rcx, rcy, ro * 0.6, Math.PI / 2, Math.PI / 2 + sweep); ctx.stroke();
  const tx = inline ? x0 + 2 * ro + gap : x0;
  const base = inline ? top + px * 0.86 : top + 2 * ro + gap * 1.4 + px * 0.82;
  slab(t, { x: 0, y: base - px * 0.95, w: W, h: px * 1.22 }, 18.05, null, () => {
    ctx.font = font(px); ctx.letterSpacing = `${-0.05 * px}px`; ctx.textAlign = 'left';
    const wC = ctx.measureText('CHRONO').width;
    const g = ctx.createLinearGradient(tx, 0, tx + textWidth, 0);
    g.addColorStop(0, C.cyan4); g.addColorStop(1, C.blue6);
    ctx.fillStyle = g; ctx.fillText('CHRONO', tx, base);
    ctx.fillStyle = C.white; ctx.fillText('VISOR', tx + wC, base);
  });
  const ty = base + px * 0.2 + tp * 1.35;
  kline(t, 'ANY PLACE. ANY TIME.', tx, ty, tp, 18.5, null, { w: 700, ls: 0.04 });
  const cyy = ty + tp * 0.5 + cp * 1.9;
  kline(t, 'PICK A YEAR. PICK A PLACE.', tx, cyy, cp, 19.0, null,
    { w: 400, fam: MONO, ls: 0.3, color: C.cyan4, pin: DEFAULT });
  // underline draws out from the middle: leading edge stiffer than trailing edge, so it stretches
  const cw = textW('PICK A YEAR. PICK A PLACE.', cp, 400, MONO, 0.3) - 0.3 * cp;
  const lead = sp(t - 19.1, SNAPPY), trail = sp(t - 19.1, [110, 22]);
  if (lead > 0.001) {
    const a = tx + cw * 0.5 * (1 - trail), b = tx + cw * (0.5 + 0.5 * lead);
    ctx.fillStyle = C.cyan;
    ctx.fillRect(a, cyy + cp * 0.55, b - a, Math.max(2, 3 * u));
  }
}

// ---------- cursor ----------
const CLICKS = [4.5, 5.5, 9.5, 14.25];
function cursorPos(t) {
  const off = [W + 120 * u, H + 120 * u];
  const f = ptIn(K.search_idle, searchRect(4.5), [PT.field[0] - 120, PT.field[1]]);
  const sb = ptIn(K.search_idle, searchRect(5.5), PT.searchBtn);
  const jb = ptIn(K.actions_ready, actionsRect(), PT.jump), dl = ptIn(K.result, resultRect(14.2), PT.souvenir);
  const keys = [[0, off], [4.05, f], [5.1, sb], [5.72, off], [8.95, jb], [9.72, off], [13.75, dl], [14.55, off]];
  return [0, 1].map(i => tr(t, keys.map(([k, v]) => [k, v[i]])));
}
function cursor(t) {
  const [x, y] = cursorPos(t);
  if (x > W + 60 * u || y > H + 60 * u) return;
  let press = 0;
  for (const c of CLICKS) {
    press += sp(t - c + 0.06, SNAPPY) - sp(t - c - 0.06, SNAPPY);
    const p = sp(t - c, DEFAULT);
    if (t > c && t < c + 0.6) {
      ctx.beginPath(); ctx.arc(x, y, (8 + 52 * p) * u, 0, PI2);
      ctx.lineWidth = 3 * u; ctx.strokeStyle = `rgba(165,243,252,${1 - clamp(p)})`; ctx.stroke();
    }
  }
  const s = 3.4 * u * (1 - 0.16 * press);
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.beginPath();
  ctx.moveTo(0, 0); ctx.lineTo(0, 17); ctx.lineTo(4.2, 13.2); ctx.lineTo(7.2, 20); ctx.lineTo(9.6, 19);
  ctx.lineTo(6.7, 12.4); ctx.lineTo(12, 12.2); ctx.closePath();
  ctx.fillStyle = '#fff'; ctx.fill();
  ctx.lineWidth = 1.3; ctx.strokeStyle = '#0b1220'; ctx.lineJoin = 'round'; ctx.stroke();
  ctx.restore();
}

// ---------- frame ----------
function draw(t) {
  ctx.save();
  ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
  background(t);
  hook(t);
  globeStage(t);
  uiStage(t);
  result(t);
  souvenir(t);
  captions(t);
  proof(t);
  lockup(t);
  cursor(t);
  ctx.restore();
}

window.DUR = DUR;
window.ready = load().then(() => { draw(0); return true; });
window.seek = t => { draw(t); return true; };

if (!navigator.webdriver) {
  window.ready.then(() => {
    const t0 = performance.now();
    const loop = () => { draw(((performance.now() - t0) / 1000) % DUR); requestAnimationFrame(loop); };
    loop();
  });
}
