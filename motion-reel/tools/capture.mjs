// Captures real Chronovisor UI states at 2x from the running app (mock mode).
// Usage: (in repo root) npm run dev  ->  node tools/capture.mjs [http://localhost:3000]
//        DSF=4 node tools/capture.mjs   -> extra 4x captures (name@4x.png) of the states used in close-ups
import { chromium } from 'playwright';
import { readFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'assets/ui');
mkdirSync(out, { recursive: true });
const url = process.argv[2] || 'http://localhost:3000';

// The one real live-mode result shipped in the repo (see ../Chronovisor-Bornholmer_*.png)
const BERLIN = {
  locationName: 'Bornholmer Straße Border Crossing, Berlin',
  description:
    'It is the pivotal hour on the night the Wall falls; the freezing November air is electric with disbelief and euphoria as the checkpoint barriers are finally…',
  time: { year: 1989, month: 11, day: 9, hour: 23, minute: 30, second: 0 },
  imageUrl: '/__reel/berlin.jpg',
};

// Everything external is served locally, so no network is needed during capture.
// .cache/tailwind.js: curl -sSL -o .cache/tailwind.js https://cdn.tailwindcss.com
const browser = await chromium.launch();
const DSF = +(process.env.DSF || 2), HI = DSF !== 2;
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: DSF });

await page.route('**/naturalearth-3.3.0/ne_110m_land.geojson', r =>
  r.fulfill({ contentType: 'application/json', body: readFileSync(path.join(root, 'assets/ne_110m_land.geojson')) }));
await page.route('https://cdn.tailwindcss.com/**', r =>
  r.fulfill({ contentType: 'application/javascript', body: readFileSync(path.join(root, '.cache/tailwind.js')) }));
await page.route('https://fonts.googleapis.com/**', r =>
  r.fulfill({ contentType: 'text/css', body: `
    @font-face { font-family: 'Share Tech Mono'; font-weight: 400; src: url(/__reel/fonts/share-tech-mono-latin-400-normal.woff2); }
    ${[400, 700, 900].map(w => `@font-face { font-family: 'Orbitron'; font-weight: ${w}; src: url(/__reel/fonts/orbitron-latin-${w}-normal.woff2); }`).join('\n')}` }));
await page.route('**/__reel/fonts/*', r =>
  r.fulfill({ contentType: 'font/woff2', body: readFileSync(path.join(root, 'assets/fonts', path.basename(new URL(r.request().url()).pathname))) }));
await page.route('**/__reel/berlin.jpg', r =>
  r.fulfill({ contentType: 'image/jpeg', body: readFileSync(path.join(root, 'assets/scenes/berlin_1989.jpg')) }));
// Mock mode returns a random canned result; pin it to the real Berlin output instead.
await page.route('**/src/mocks/data.ts*', r =>
  r.fulfill({
    contentType: 'application/javascript',
    body: `export const MOCK_TRAVEL_RESULTS = [${JSON.stringify(BERLIN)}];
           export const getRandomMockResult = () => MOCK_TRAVEL_RESULTS[0];`,
  }));

await page.goto(url, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
await page.waitForSelector('svg path');
await page.waitForTimeout(800);

// In the 4x pass only the states drawn in close-up are captured.
const HI_SHOTS = ['02_header', '04_panel_idle', '06_search_typed', '07_search_scanning', '08_panel_locked',
  '12_viewscreen_loading', '13_panel_engaging'];
const shot = async (name, sel) => {
  if (HI && !HI_SHOTS.includes(name)) return;
  name += HI ? `@${DSF}x` : '';
  const target = sel ? page.locator(sel).first() : page;
  await target.screenshot({ path: path.join(out, name + '.png'), animations: 'disabled' });
  console.log('captured', name);
};
const panel = 'div.tech-border.backdrop-blur-sm';
const viewscreen = 'div.tech-border.overflow-hidden';

await shot('01_full_idle');
await shot('02_header', 'header');
await shot('03_globe_idle', 'div.aspect-square');
await shot('04_panel_idle', panel);
await shot('05_viewscreen_empty', viewscreen);

// Feature 1: type the app's own example query into Neural Event Search
const search = page.locator('input[placeholder^="Ex:"]');
await search.click();
await search.pressSequentially('Fall of the Berlin Wall', { delay: 20 });
await shot('06_search_typed', panel);
await page.locator(`${panel} button:has-text("🔍")`).click();
await page.waitForTimeout(250);
await shot('07_search_scanning', panel);
await page.waitForTimeout(1200);

// Lock the vector to the real Berlin record via the panel's own inputs
const nums = page.locator(`${panel} input[type="number"]`);
await nums.nth(0).fill('52.5548');
await nums.nth(1).fill('13.3985');
await page.locator(`${panel} select`).nth(0).selectOption('N');
await page.locator(`${panel} select`).nth(1).selectOption('E');
await nums.nth(2).fill('1989');
await nums.nth(3).fill('11');
await nums.nth(4).fill('9');
await nums.nth(5).fill('23');
await nums.nth(6).fill('30');
await nums.nth(7).fill('0');
await page.waitForTimeout(900);
await shot('08_panel_locked', panel);
await shot('09_globe_locked', 'div.aspect-square');
await shot('10_full_locked');

// Feature 2: initiate jump -> loading -> result
await page.locator('button:has-text("INITIATE JUMP")').hover();
await shot('11_jump_button', `${panel} >> div.grid.grid-cols-2.gap-4`);
await page.locator('button:has-text("INITIATE JUMP")').click();
await page.waitForTimeout(300);
await shot('12_viewscreen_loading', viewscreen);
await shot('13_panel_engaging', panel);
await page.waitForSelector(`${viewscreen} img`);
await page.waitForTimeout(600);
await shot('14_viewscreen_result', viewscreen);
await shot('15_full_result');
await page.locator('button:has-text("Download Souvenir")').hover();
await shot('16_souvenir_button', 'button:has-text("Download Souvenir")');

await browser.close();
