# Chronovisor motion studio: house rules

- Every film is a pure function of time: `window.seek(t)` paints frame t. No CSS transitions, setTimeout or requestAnimationFrame in render mode, and no state carried between frames. Seeded noise only (mulberry32), never Math.random.
- Banned defaults: centered title on gradient, everything fading in, corner labels and frame borders, glow on UI chrome, generic particle bursts.
- One display face (Orbitron), one UI face (Share Tech Mono), one accent (cyan #06b6d4), unless the brief says otherwise.
- Something new happens on screen every 2–4 seconds.
- Sound hits sit on the beat grid (beats.json, 120 BPM). Final loudness -14 LUFS.
- Real product UI only: animate the captures in assets/ui (made by tools/capture.mjs) and the real outputs in assets/scenes. Never invent screens, numbers or testimonials.
- Nothing is shown to the user before at least one critique round (docs/review_log.md).
- Values with more than one target use `track()`; never restart a spring.
