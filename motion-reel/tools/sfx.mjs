// Synthesizes UI sound effects from src/cues.js into sfx.wav (48 kHz, 16-bit stereo). Seeded noise only.
// Usage: node tools/sfx.mjs
import { writeFileSync } from 'node:fs';
import { CUES } from '../src/cues.js';
import { mulberry32 } from '../lib/motion.js';

const SR = 48000, DUR = 20, N = SR * DUR;
const buf = new Float32Array(N);
const rnd = mulberry32(79);
const noise = () => rnd() * 2 - 1;

function add(at, len, fn) {
  const i0 = Math.round(at * SR), n = Math.round(len * SR);
  for (let i = 0; i < n && i0 + i < N; i++) buf[i0 + i] += fn(i / SR, i);
}
// one-pole filters over a generated block
function block(len, gen) { const n = Math.round(len * SR), a = new Float32Array(n); for (let i = 0; i < n; i++) a[i] = gen(i / SR); return a; }

const SYN = {
  click: at => { // crisp UI click: short high blip + noise tick
    let lp = 0;
    add(at, 0.05, s => { const n = noise(); lp += 0.5 * (n - lp);
      return 0.35 * Math.sin(2 * Math.PI * 2200 * s) * Math.exp(-s / 0.006) + 0.25 * (n - lp) * Math.exp(-s / 0.004); });
  },
  key: at => {
    let lp = 0;
    add(at, 0.03, s => { const n = noise(); lp += 0.35 * (n - lp); return 0.16 * (n - lp) * Math.exp(-s / 0.005); });
  },
  tick: at => add(at, 0.03, s => 0.2 * Math.sin(2 * Math.PI * 3400 * s) * Math.exp(-s / 0.004)),
  pop: at => add(at, 0.12, s => { const f = 500 + 700 * (1 - Math.exp(-s / 0.02));
    return 0.35 * Math.sin(2 * Math.PI * f * s) * Math.exp(-s / 0.035); }),
  thump: at => add(at, 0.6, s => { const ph = 2 * Math.PI * (40 * s + 60 * 0.05 * (1 - Math.exp(-s / 0.05)));
    return 0.6 * Math.sin(ph) * Math.exp(-s / 0.22); }),
  roll: at => { for (let k = 0; k < 7; k++) SYN.tick(at + k * 0.045 * (1 + k * 0.06)); },
  whoosh: at => { // band-limited noise swell, 0.5 s, peaks at the cue
    const len = 0.55, pre = 0.3;
    let lp1 = 0, lp2 = 0;
    const b = block(len, s => {
      const x = s / len, fc = 0.02 + 0.25 * Math.sin(Math.PI * x);
      const n = noise(); lp1 += fc * (n - lp1); lp2 += fc * 0.3 * (lp1 - lp2);
      return (lp1 - lp2) * Math.pow(Math.sin(Math.PI * Math.min(1, x * 1.1)), 2);
    });
    const i0 = Math.round((at - pre) * SR);
    for (let i = 0; i < b.length; i++) if (i0 + i >= 0 && i0 + i < N) buf[i0 + i] += 0.5 * b[i];
  },
};

for (const c of CUES) SYN[c.type](c.t);

let peak = 0; for (const v of buf) peak = Math.max(peak, Math.abs(v));
const g = peak > 0.95 ? 0.95 / peak : 1;
const data = Buffer.alloc(44 + N * 4);
data.write('RIFF', 0); data.writeUInt32LE(36 + N * 4, 4); data.write('WAVE', 8);
data.write('fmt ', 12); data.writeUInt32LE(16, 16); data.writeUInt16LE(1, 20); data.writeUInt16LE(2, 22);
data.writeUInt32LE(SR, 24); data.writeUInt32LE(SR * 4, 28); data.writeUInt16LE(4, 32); data.writeUInt16LE(16, 34);
data.write('data', 36); data.writeUInt32LE(N * 4, 40);
for (let i = 0; i < N; i++) {
  const v = Math.max(-1, Math.min(1, buf[i] * g)) * 32767 | 0;
  data.writeInt16LE(v, 44 + i * 4); data.writeInt16LE(v, 46 + i * 4);
}
writeFileSync(new URL('../sfx.wav', import.meta.url), data);
console.log(`wrote sfx.wav (${CUES.length} cues)`);
