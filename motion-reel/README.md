# Chronovisor product reel

A 20 s launch reel for Chronovisor, rendered entirely from code at 60 fps with 4-sub-frame motion blur. It comes in three formats, each laid out for its own frame rather than cropped from another.

| File | Format |
| --- | --- |
| `out/final_9x16.mp4` | 1080×1920, lead format |
| `out/final_1x1.mp4` | 1080×1080 |
| `out/final_16x9.mp4` | 1920×1080 |
| `out/contact.png` | 6×5 contact sheet of the 9:16 cut |
| `out/poster.png` | Poster frame: the 1989 reveal |

## The film
**Message:** Any place. Any time. **CTA:** *Pick a year. Pick a place.* + the CHRONOVISOR wordmark.

1. **Hook (0–2 s):** "YOU CAN'T VISIT 1989." The year rolls down from 2026 like an odometer, then the 'T falls off CAN'T.
2. **Product (2–4 s):** the globe spins up, and the header and control-panel sections assemble underneath it.
3. **Feature 1 (4–6 s):** *Ask for any moment.* The cursor types "Fall of the Berlin Wall" into Neural Event Search → SCANNING DB...
4. **Feature 2 (6–9 s):** *It locks where & when.* The globe turns to Berlin, the marker lands, and the target vector and the AD 2026 → AD 1989 readout lock in.
5. **Feature 3 (9–14 s):** *Then you jump.* INITIATE JUMP → ENGAGING... → the loading view, then a scanline wipe reveals the generated view of Bornholmer Straße, 9 Nov 1989, 23:30.
6. **Souvenir (14–16 s):** *Save the souvenir.* Download Souvenir, then the Berlin card and the AD 79 Vesuvius card.
7. **Proof (16–18 s):** 100,000,000 BC to AD 3000, the app's real year range (`MIN_YEAR` / `MAX_YEAR` in `constants.ts`).
8. **Lockup (18–20 s).**

Shot list: [docs/shotlist.md](docs/shotlist.md) · look: [docs/style_guide.md](docs/style_guide.md) · critique rounds: [docs/review_log.md](docs/review_log.md)

## Assets used (all real)
- **UI:** `assets/ui/*.png`, captured from the running app by `tools/capture.mjs` (Playwright, mock mode, 2x plus 4x for close-ups). Every screen in the film is one of these captures, cropped and animated. The globe is the one exception: it is redrawn live with the same d3 orthographic projection, Natural Earth land data, colors and stroke widths as `components/Globe.tsx`, so it can turn.
- **Generated outputs:** the two souvenir PNGs committed at the repo root (Berlin 1989 and Vesuvius AD 79) are real Chronovisor results. `assets/scenes/` holds JPEG copies, plus crops of their image area.
- **Brand:** Orbitron and Share Tech Mono (bundled from @fontsource, the same families `index.html` loads), cyan-500 `#06b6d4` on black, the holo-grid background, and the header's cyan → blue-600 wordmark.
- **Sound:** a synthesized 120 BPM score (`tools/music.py`) plus synthesized UI SFX on the beat grid (`tools/sfx.mjs`, cues in `src/cues.js`), mixed with a two-pass loudnorm to -14 LUFS.

## Assumptions (made unattended, per the brief)
- **No public URL in the CTA:** none was found in the repo, so the CTA is the tagline plus the wordmark.
- **Mock-mode search:** the app returns a random canned result there. The capture pins that result to the real Berlin output, which is where "Fall of the Berlin Wall" leads in live mode. It also sets the coordinates and time through the panel's own inputs, since mock mode's lookup doesn't know Berlin.
- **Berlin description:** only the part legible on the souvenir card is used, ending in "…".
- **Header subtitle:** the "Nano Banana Pro module online" line appears only as captured.

## Rebuild
```bash
# one-time
npm install                    # playwright + fonts (uses the preinstalled Chromium)
pip install numpy scipy soundfile
# capture real UI (in the repo root: npm run dev)
node tools/capture.mjs && DSF=4 node tools/capture.mjs
# (capture serves Tailwind from .cache/tailwind.js: curl -sSL -o .cache/tailwind.js https://cdn.tailwindcss.com)

npm run draft                  # 540×960 @30 fps preview -> out/draft.mp4
bash tools/build.sh            # audio + all three finals + contact sheet + poster
bash tools/build.sh mux        # re-mix / re-mux without re-rendering
```
Open `index.html?w=1080&h=1920` through any static server for a live preview loop. Every frame is a pure function of time (`window.seek(t)`, see [CLAUDE.md](CLAUDE.md)), and renders are bit-identical run to run.

## What I'd improve next
- **Live-mode capture:** record a real event search and jump with a Gemini key, so the search → result chain is one uninterrupted real session rather than mock mode pinned to a real result.
- **Voice-over:** add a line in the hook if an ElevenLabs key is added to `.env`.
- **16:9 layout:** the landscape cut leaves the right column empty from 6.0 to 7.5 s. A drag-to-rotate gesture on the globe could fill it.
- **Score:** it is functional synthwave. A composed track, with beats measured by `tools/beats.py`, would lift the drop at 12 s.
