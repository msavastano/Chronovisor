# Shot list: Chronovisor, 20 s, 120 BPM (beat = 0.5 s, bar = 2 s)

The message: **Any place. Any time.** CTA: *Pick a year. Pick a place.*, then the Chronovisor wordmark.
Features: (1) Neural Event Search, (2) globe targeting + temporal lock, (3) Initiate Jump → generated view → souvenir.
Proof: the real input range in constants.ts, **100,000,000 BC → AD 3000**.

| # | Time | On screen | Camera | Text | Motion | SFX |
|---|------|-----------|--------|------|--------|-----|
| 1 Hook | 0.0–2.0 | Black holo-grid. Huge kinetic type stacks line by line | locked | YOU CAN'T / VISIT / 1989. | lines mask-slide up on 0.0 / 0.5; "1989" rolls from 2026 like an odometer at 1.0; the **'T** drops off CAN'T at 1.5 → "YOU CAN VISIT 1989." | thump 0.0, tick 0.5, roll 1.0, pop 1.5 |
| 2 Product | 2.0–4.0 | Type exits up. Real globe (Globe.tsx drawing, same data and colors) rises and spins; header wordmark and then the control panel sections assemble below it | slow push 1.0 → 1.04 | – | globe heavy spring up at 2.0; spin λ 120° → 0; panel slices up on 2.5, 2.75, 3.0, 3.25 | whoosh 2.0, ticks on slices |
| 3 Feature 1 | 4.0–6.0 | Neural Event Search module (capture), big | push to 1.12 | ASK FOR ANY MOMENT | cursor enters 4.1, clicks the field at 4.5, types "Fall of the Berlin Wall" (4.5–5.3), clicks 🔍 at 5.5 → SCANNING DB... | click 4.5, keys, click 5.5 |
| 4 Feature 2 | 6.0–9.0 | Globe spins to Berlin; the red marker lands with its ping ring; the locked Target Vector (52.5548 N, 13.3985 E) and AD 2026 → AD 1989 display slide in | globe centered then shifts up | IT LOCKS WHERE & WHEN | rotation track → [-13.4, -26.3]; marker pop 7.0; vector slab 7.5; year slab 8.0 (swap 2026 → 1989 at 8.25) | whoosh 6.0, pop 7.0, ticks 7.5/8.0 |
| 5 Feature 3a | 9.0–12.0 | Action row: cursor clicks **INITIATE JUMP** → ENGAGING... → viewscreen loading spinner (rotating) | push-in on spinner | THEN YOU JUMP | click 9.5; loading 10.0–12.0; riser into 12.0 | click 9.5, riser 10–12 |
| 6 Feature 3b | 12.0–14.0 | **Reveal**: the real Gemini result (Bornholmer Straße, 9 Nov 1989) fills the frame in a scanline wipe; caption bar reads AD 1989 • 11/09 • 23:30:00 | slow push 1.0 → 1.08 | – | scanline wipe on 12.0 | impact 12.0 |
| 7 Souvenir | 14.0–16.0 | Cursor hits DOWNLOAD SOUVENIR; the real souvenir card pops out and tilts; the AD 79 Vesuvius card slides in beside it | locked | KEEP THE POSTCARD | click 14.25; card lift 14.5; second card 15.0 | click, whoosh 14.5, pop 15.0 |
| 8 Proof | 16.0–18.0 | Range readout | locked | 100,000,000 BC → AD 3000 | numerals roll at 16.0; arrow + AD 3000 at 16.75; subline at 17.0 | roll 16.0, tick 16.75 |
| 9 Lockup | 18.0–20.0 | Ring logo + CHRONOVISOR wordmark (header treatment); tagline; CTA | locked | ANY PLACE. ANY TIME. / PICK A YEAR. PICK A PLACE. | ring draws 18.0; wordmark slides up 18.0; tagline 18.5; CTA 19.0; hold | thump 18.0, tick 18.5 |

Formats: 9:16 (1080×1920) leads; 1:1 and 16:9 reframe through `layout()` (stacked vs side-by-side). Nothing is cropped from another format.
