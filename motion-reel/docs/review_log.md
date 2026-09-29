# Review log

Scored 1–10 by a harsh motion-director pass over contact sheets (6×5), 12-frame strips around fast actions, and a 360 px phone test.
Criteria: hook (first 2 s) · readability at 360 px · motion quality · variety · composition · sound sync · brand accuracy · feature clarity.

## Round 1: first 9:16 draft (540×960, 30 fps)
| Hook | Read@360 | Motion | Variety | Comp. | Sound | Brand | Features |
|---|---|---|---|---|---|---|---|
| 8 | 5 | 7 | 8 | 6 | – (no audio yet) | 9 | 6 |

Worst problems:
1. **4.0–6.0 s / 9.0–10.0 s:** the search field and INITIATE JUMP are shown at 0.88 of frame width, so "Fall of the Berlin Wall" is about 9 px tall on a phone and feature 1 doesn't read.
2. **10.0–12.0 s:** the loading beat is a small spinner on black for two seconds, so almost nothing happens.
3. **18.0–20.0 s:** the lockup is one thin strip in a tall frame, and the tagline and CTA are unreadable at 360 px.

Fixes: the search close-up goes to 1.5× frame width, with a camera pan (track) from the typed text over to the 🔍 button, and the cursor follows. The action row goes to 1.5× and is centered on INITIATE JUMP. The loading view pushes 0.9 → 1.35× with the spinner held at frame center. In tall frames the lockup stacks the ring above the wordmark, and the tagline and CTA are fitted to the wordmark width.

## Round 2: 9:16 re-draft + first 1:1 and 16:9 drafts
| Hook | Read@360 | Motion | Variety | Comp. | Sound | Brand | Features |
|---|---|---|---|---|---|---|---|
| 8 | 8 | 8 | 8 | 7 | 7 | 9 | 8 |

Worst problems:
1. **16:9, 6.25–9.0 s:** "WHERE & WHEN." runs off the right edge (fitted to 0.6 W but set at x = 0.49 W).
2. **1:1, 7.5–9.0 s:** the globe wrapper and the locked vector and temporal slabs nearly touch.
3. **16:9, 18–20 s:** the lockup is too small (0.5 W).
Sound: the 1.0 s odometer roll ran into the 1.5 s 'T pop, so the roll was shortened to 7 ticks.

Fixes: the caption beside the globe fits 0.44 W. The 1:1 globe moves to r = 0.2 W at 0.25 W and the slabs start at 0.5 W. The 16:9 wordmark goes to 0.6 W.

## Round 3: strips (1.0 s odometer, 1.45 s 'T drop, 11.95 s wipe, 14.4 s souvenir lift) + phone test
| Hook | Read@360 | Motion | Variety | Comp. | Sound | Brand | Features |
|---|---|---|---|---|---|---|---|
| 9 | 8 | 8 | 8 | 8 | 8 | 9 | 8 |

Worst problems:
1. **1.0–1.4 s:** the rolling odometer digits bled above their mask into the VISIT line. The column clip was the full line band (1.22 em) instead of the cap height. Fixed with a clip of 0.8 em above to 0.1 em below the baseline, then re-checked on a strip.
2. **1.5–1.8 s:** the falling 'T crosses the "1989." line for about 6 frames. Kept on purpose, since it reads as the gag.
3. **Contact sheets:** "CH / Wall" fragments at tile edges looked like doubled UI. They turned out to be adjacent tiles of the panning close-up, so this was not a defect.

Hunt list, checked: no text overlaps during swaps (slab masks), no linear slides (everything is a spring, except the app's own spinner, which Tailwind animates linearly), no added corner labels or frame borders, no centered-on-gradient shots, no blurry scaled text (see round 4), something new on every beat, no loop seam (the film ends on a hold, not a loop).

Determinism: the same 1 s slice (12.0–13.0 s, 60 fps × 4 sub-frames) rendered twice gave identical decoded-frame hashes (`e20ad3a0…`) and identical file hashes.

## Round 4: full-resolution frame check before the finals
Problem: **4.0–6.0 s and 9.0–10.0 s.** The 1.5× close-ups magnified the 2x panel captures by up to 1.96×, so UI text went soft at 1080 px.
Fix: `DSF=4 node tools/capture.mjs` recaptures the states drawn in close-up (header, panel states, loading view) at 4x. film.js reads them through a per-image multiplier (`MUL`) and draws with `imageSmoothingQuality = 'high'`. The largest magnification is now 0.98×, and a full-res frame at 5.0 s shows crisp field text.
