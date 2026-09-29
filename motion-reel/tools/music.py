"""Synthesized 20 s score at 120 BPM (dark synthwave), deterministic. Writes music.wav + beats.json.

Structure (bar = 2 s): 0-2 hook hits | 2-10 groove | 10-12 build + riser | 12-16 drop with arp |
16-18 proof | 18-20 final chord + tail.
Usage: python3 tools/music.py
"""
import json
import numpy as np
import soundfile as sf
from scipy.signal import butter, sosfilt

SR, BPM, DUR = 48000, 120, 20.0
B = 60 / BPM
N = int(SR * DUR)
rng = np.random.default_rng(1989)
t = np.arange(N) / SR


def lp(x, fc, order=2):
    return sosfilt(butter(order, fc, 'low', fs=SR, output='sos'), x)


def hp(x, fc, order=2):
    return sosfilt(butter(order, fc, 'high', fs=SR, output='sos'), x)


def env(n, a, d):
    e = np.ones(n)
    na = max(1, int(a * SR))
    e[:na] = np.linspace(0, 1, na)
    e[na:] = np.exp(-np.arange(n - na) / (d * SR))
    return e


def place(buf, sig, at):
    i = int(at * SR)
    if i >= len(buf):
        return
    j = min(len(buf), i + len(sig))
    buf[i:j] += sig[: j - i]


def midi(n):
    return 440 * 2 ** ((n - 69) / 12)


def saw(f, n, detune=0.0):
    ph = np.cumsum(np.full(n, f * (1 + detune)) / SR)
    return 2 * (ph % 1) - 1


def kick(amp=1.0):
    n = int(0.45 * SR)
    tt = np.arange(n) / SR
    f = 45 + 110 * np.exp(-tt / 0.035)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt / 0.16)
    click = rng.standard_normal(n) * np.exp(-tt / 0.003) * 0.3
    return amp * (s + click)


def hat(amp=0.18, dec=0.03):
    n = int(0.12 * SR)
    return amp * hp(rng.standard_normal(n), 7000) * env(n, 0.001, dec)


def snare(amp=0.35):
    n = int(0.25 * SR)
    tt = np.arange(n) / SR
    body = np.sin(2 * np.pi * 190 * tt) * np.exp(-tt / 0.05)
    nz = hp(rng.standard_normal(n), 1500) * np.exp(-tt / 0.08)
    return amp * (0.5 * body + nz)


# chords per bar (i - VI - III - VII in D minor), roots as MIDI
PROG = [(38, [62, 65, 69]), (34, [62, 65, 70]), (41, [60, 65, 69]), (36, [60, 64, 67])]
drums = np.zeros(N)
bass = np.zeros(N)
pad = np.zeros(N)
lead = np.zeros(N)
fx = np.zeros(N)

# --- drums ---
for i in range(int(DUR / B)):
    tb = i * B
    if tb < 2:  # hook: sparse hits on the type beats
        if tb in (0.0, 1.0, 1.5):
            place(drums, kick(1.1), tb)
        continue
    if 10 <= tb < 12:  # build: kicks thin out, snare roll takes over
        if tb < 11:
            place(drums, kick(0.8), tb)
        continue
    if tb >= 18:
        continue
    place(drums, kick(), tb)
    place(drums, hat(), tb + B / 2)
    if i % 2 == 1:
        place(drums, snare(0.3), tb)
    if 12 <= tb < 16:
        place(drums, hat(0.08, 0.015), tb + B / 4)
        place(drums, hat(0.08, 0.015), tb + 3 * B / 4)
# snare roll accelerating into 12.0
for k, tr_ in enumerate(np.concatenate([np.arange(10.0, 11.0, B / 2), np.arange(11.0, 11.5, B / 4), np.arange(11.5, 12.0, B / 8)])):
    place(drums, snare(0.12 + 0.2 * (tr_ - 10) / 2), tr_)
place(drums, kick(1.3), 12.0)
place(drums, kick(1.3), 18.0)

# --- bass: 16th-note pulse with octave hops, 2-18 s (not in the build) ---
sixteenth = B / 4
for i in range(int(DUR / sixteenth)):
    ts = i * sixteenth
    if ts < 2 or 11.5 <= ts < 12 or ts >= 18:
        continue
    bar = int(ts // 2) % 4
    root = PROG[bar][0] + (12 if i % 4 == 2 else 0)
    n = int(sixteenth * SR * 0.9)
    s = 0.5 * saw(midi(root), n) + 0.5 * saw(midi(root), n, 0.006)
    place(bass, s * env(n, 0.003, 0.09) * (0.55 if 10 <= ts < 11.5 else 0.7), ts)
bass = lp(bass, 520)
# sub drone under the hook
n = int(2.2 * SR)
place(bass, 0.45 * np.sin(2 * np.pi * midi(26) * np.arange(n) / SR) * env(n, 0.02, 1.2), 0.0)
# final held root
n = int(2.0 * SR)
place(bass, 0.6 * np.sin(2 * np.pi * midi(38) * np.arange(n) / SR) * env(n, 0.005, 0.9), 18.0)

# --- pad: detuned saws, one chord per bar ---
for bar in range(10):
    t0 = bar * 2.0
    if t0 < 2:
        continue
    notes = PROG[bar % 4][1] if bar < 9 else PROG[0][1]
    n = int(2.0 * SR) if bar < 9 else int(2.0 * SR)
    s = sum(saw(midi(m), n, d) for m in notes for d in (-0.004, 0.004)) / 6
    e = np.minimum(1, np.arange(n) / (0.05 * SR)) * (np.exp(-np.arange(n) / (0.9 * SR)) if bar == 9 else 1)
    place(pad, 0.22 * s * e, t0)
pad = lp(pad, 1400)
# sidechain duck from the kick grid
duck = np.ones(N)
for i in range(int(DUR / B)):
    tb = i * B
    if 2 <= tb < 18 and not (11 <= tb < 12):
        k = int(tb * SR)
        m = min(N, k + int(0.3 * SR))
        duck[k:m] = np.minimum(duck[k:m], 1 - 0.7 * np.exp(-np.arange(m - k) / (0.08 * SR)))
pad *= duck
bass *= 0.4 + 0.6 * duck

# --- lead arp in the drop (12-16): square pluck on 16ths ---
for i in range(int(4.0 / sixteenth)):
    ts = 12 + i * sixteenth
    notes = PROG[int(ts // 2) % 4][1]
    m = notes[i % 3] + (12 if (i // 3) % 2 else 0)
    n = int(sixteenth * SR)
    ph = np.cumsum(np.full(n, midi(m)) / SR)
    sq = np.sign(np.sin(2 * np.pi * ph))
    place(lead, 0.09 * sq * env(n, 0.002, 0.05), ts)
lead = lp(lead, 2600)

# --- riser 10-12 and impact at 12 ---
n = int(2.0 * SR)
tt = np.arange(n) / SR
nz = rng.standard_normal(n)
riser = np.zeros(n)
for a, b_ in ((0, 0.5), (0.5, 1.0), (1.0, 1.5), (1.5, 2.0)):
    seg = slice(int(a * SR), int(b_ * SR))
    riser[seg] = sosfilt(butter(2, [400 + 1800 * a, 900 + 3800 * b_], 'band', fs=SR, output='sos'), nz)[seg]
riser *= (tt / 2.0) ** 2 * 0.35
tone = 0.08 * np.sin(2 * np.pi * np.cumsum(220 * 2 ** (tt * 1.2)) / SR) * (tt / 2.0) ** 2
place(fx, riser + tone, 10.0)
n = int(1.5 * SR)
tt = np.arange(n) / SR
impact = 0.5 * lp(rng.standard_normal(n), 900) * np.exp(-tt / 0.25) + 0.6 * np.sin(2 * np.pi * 40 * tt) * np.exp(-tt / 0.5)
place(fx, impact, 12.0)
place(fx, 0.8 * impact, 18.0)

mix = drums * 0.9 + bass * 0.9 + pad + lead + fx
# gentle master fade in the last half second
mix[int(19.5 * SR):] *= np.linspace(1, 0, N - int(19.5 * SR))
mix = np.tanh(mix * 0.9)
stereo = np.stack([mix, mix], axis=1)
# widen pad/lead slightly with a 12 ms delay on the right channel
d = int(0.012 * SR)
wide = (pad + lead) * 0.35
stereo[d:, 1] += wide[:-d]
stereo[:, 0] += wide
stereo /= np.max(np.abs(stereo)) * 1.05
sf.write('music.wav', stereo.astype(np.float32), SR, subtype='PCM_24')

beats = [round(i * B, 4) for i in range(int(DUR / B) + 1)]
json.dump({'bpm': BPM, 'beats': beats, 'downbeats': beats[::4], 'hits': [0.0, 12.0, 18.0]}, open('beats.json', 'w'))
print('wrote music.wav, beats.json')
