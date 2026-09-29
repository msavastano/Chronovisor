"""Beat grid for a supplied music file: librosa beat_track + onset peak_pick -> beats.json.
For the synthesized score, tools/music.py writes beats.json straight from the BPM instead.
Usage: python3 tools/beats.py music.wav
"""
import json
import sys

import librosa

y, sr = librosa.load(sys.argv[1], sr=None, mono=True)
tempo, frames = librosa.beat.beat_track(y=y, sr=sr)
beats = librosa.frames_to_time(frames, sr=sr).round(4).tolist()
env = librosa.onset.onset_strength(y=y, sr=sr)
peaks = librosa.util.peak_pick(env, pre_max=3, post_max=3, pre_avg=3, post_avg=5, delta=0.5, wait=10)
hits = librosa.times_like(env, sr=sr)[peaks].round(4).tolist()
json.dump({'bpm': float(tempo), 'beats': beats, 'downbeats': beats[::4], 'hits': hits}, open('beats.json', 'w'))
print(f'{float(tempo):.1f} BPM, {len(beats)} beats, {len(hits)} hits')
