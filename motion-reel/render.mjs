// Deterministic frame renderer: headless Chromium -> PNG frames -> ffmpeg (sub-frame motion blur).
// node render.mjs --fps 60 --dur 20 --sub 4 --start 0 --w 1080 --h 1920 --out out/silent.mp4
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const args = Object.fromEntries(process.argv.slice(2).reduce((a, v, i, arr) =>
  v.startsWith('--') ? [...a, [v.slice(2), arr[i + 1]]] : a, []));
const fps = +(args.fps ?? 60), dur = +(args.dur ?? 20), sub = +(args.sub ?? 4), start = +(args.start ?? 0);
const w = +(args.w ?? 1080), h = +(args.h ?? 1920);
const out = path.resolve(root, args.out ?? 'out/silent.mp4');
mkdirSync(path.dirname(out), { recursive: true });

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json',
  '.geojson': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2' };
const server = createServer(async (req, res) => {
  try {
    const p = path.join(root, decodeURIComponent(new URL(req.url, 'http://x').pathname));
    if (!p.startsWith(root)) throw new Error('outside root');
    const body = await readFile(p);
    res.writeHead(200, { 'content-type': TYPES[path.extname(p)] || 'application/octet-stream' });
    res.end(body);
  } catch { res.writeHead(404); res.end(); }
}).listen(0, '127.0.0.1');
await new Promise(r => server.once('listening', r));
const port = server.address().port;

const browser = await chromium.launch({ args: ['--disable-gpu', '--force-color-profile=srgb'] });
const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
page.on('pageerror', e => { console.error('page error:', e.message); process.exitCode = 1; });
await page.goto(`http://127.0.0.1:${port}/index.html?w=${w}&h=${h}`);
await page.evaluate(() => document.body.classList.add('render'));
await page.evaluate(() => window.ready);
await page.evaluate(() => document.fonts.ready);

const rate = fps * sub;
const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(rate), '-i', '-',
  ...(sub > 1 ? ['-vf', `tmix=frames=${sub},select='eq(mod(n\\,${sub})\\,${sub - 1})',setpts=N/${fps}/TB`] : []),
  '-r', String(fps), '-c:v', 'libx264', '-crf', '16', '-preset', 'medium', '-pix_fmt', 'yuv420p', out],
  { stdio: ['pipe', 'inherit', 'inherit'] });
const done = new Promise((res, rej) => ff.on('close', c => c === 0 ? res() : rej(new Error('ffmpeg ' + c))));

const n = Math.round(dur * rate), canvas = page.locator('#c');
const t0 = Date.now();
for (let i = 0; i < n; i++) {
  await page.evaluate(t => window.seek(t), start + i / rate);
  const png = await canvas.screenshot({ type: 'png' });
  if (!ff.stdin.write(png)) await new Promise(r => ff.stdin.once('drain', r));
  if (i % (rate * 2) === 0) process.stdout.write(`\r${(i / rate).toFixed(1)}s / ${dur}s  (${((Date.now() - t0) / 1000).toFixed(0)}s elapsed)`);
}
ff.stdin.end();
await done;
await browser.close();
server.close();
console.log(`\nwrote ${path.relative(root, out)}`);
