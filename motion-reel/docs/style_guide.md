# Style guide: "Holo-grid dossier"

No external reference was supplied, so the look comes from Chronovisor's own UI (index.html, App.tsx, components/*).
Everything is a readout on the app's black holo-grid. The only warm color in the film comes from the real generated images.

## Palette (from the app's Tailwind classes)
| Role | Hex | Source |
| --- | --- | --- |
| Ground | `#000000` | `body`, `bg-black` |
| Holo-grid line | `rgba(6,182,212,0.10)`, 20 css px pitch | `.holo-grid` |
| Accent | `#06b6d4` cyan-500 | borders, labels, slider |
| Accent light | `#22d3ee` cyan-400 | wordmark gradient start |
| Wordmark end | `#2563eb` blue-600 | `from-cyan-400 to-blue-600` |
| Deep line | `#164e63` cyan-900 | dividers |
| Globe ocean / land | `#020617` / `#0f172a`, land edge `#06b6d4` | Globe.tsx |
| Target marker | `#ef4444` | Globe.tsx (the only red, used only on the marker) |
| Body text | `#e0f2fe` | `body` color |

## Type
- Display: **Orbitron 900**, tracking -0.02em for words, +0.08em for numerals. Used for kinetic lines, numbers, wordmark.
- UI: **Share Tech Mono 400**, uppercase, tracking +0.3em for small labels (matches the header's `tracking-[0.3em]`).
- Only the captures carry the app's own monospace UI rendering.

## Motion grammar
- Shots last 2–3 s on a 120 BPM grid (bar = 2 s). Hard changes land on downbeats.
- Type enters by **mask-slide up** (heavy spring, no overshoot) and exits by sliding up out of its mask. Nothing fades in.
- UI pieces assemble by sliding up from their own slot with staggered default springs, each on an eighth note.
- Camera: push-ins (scale 1 → 1.15) on UI moments; one hard **scanline wipe** for the jump reveal at 12.0 s.
- Numbers roll like an odometer, with the columns staggered.
- Cursor: plain white arrow with a dark outline. It springs (default) between targets, and each click dips it with a snappy spring and sends out a single ring.
- Texture: 2 px scanlines at 6 % on photographic frames only (the app does the same on its viewscreen).

## Don'ts
No glow added to chrome, no corner brackets or labels added by us, no particle bursts, no centered title on a gradient.
