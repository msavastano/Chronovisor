#!/usr/bin/env bash
# Full build: audio -> final renders (60 fps, 4 sub-frames) for 9:16, 1:1, 16:9 -> mux -> review sheets.
# Usage: bash tools/build.sh            (everything)
#        bash tools/build.sh mux        (skip rendering; re-mix and re-mux existing silent renders)
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p out

# --- audio: synthesize, then two-pass loudnorm to -14 LUFS ---
python3 tools/music.py
node tools/sfx.mjs
ffmpeg -loglevel error -y -i music.wav -i sfx.wav -filter_complex "amix=inputs=2:normalize=0" -ar 48000 out/premix.wav
MEASURED=$(ffmpeg -hide_banner -i out/premix.wav -af loudnorm=I=-14:TP=-1:LRA=11:print_format=json -f null - 2>&1 | sed -n '/{/,/}/p')
read -r MI MTP MLRA MTH OFF < <(python3 -c "import json,sys; d=json.loads(sys.argv[1]); print(d['input_i'], d['input_tp'], d['input_lra'], d['input_thresh'], d['target_offset'])" "$MEASURED")
ffmpeg -loglevel error -y -i out/premix.wav -af "loudnorm=I=-14:TP=-1:LRA=11:measured_I=$MI:measured_TP=$MTP:measured_LRA=$MLRA:measured_thresh=$MTH:offset=$OFF:linear=true" -ar 48000 out/mix.wav
rm out/premix.wav

# --- video ---
FORMATS=("9x16 1080 1920" "1x1 1080 1080" "16x9 1920 1080")
if [[ "${1:-}" != "mux" ]]; then
  for f in "${FORMATS[@]}"; do
    read -r name w h <<< "$f"
    node render.mjs --fps 60 --sub 4 --dur 20 --w "$w" --h "$h" --out "out/silent_$name.mp4" > "out/render_$name.log" 2>&1 &
  done
  wait
fi
for f in "${FORMATS[@]}"; do
  read -r name w h <<< "$f"
  ffmpeg -loglevel error -y -i "out/silent_$name.mp4" -i out/mix.wav -c:v copy -c:a aac -b:a 192k -shortest -movflags +faststart "out/final_$name.mp4"
done

# --- review sheets + poster (the reveal, just after the scanline wipe settles) ---
ffmpeg -loglevel error -y -i out/final_9x16.mp4 -vf "fps=1.5,scale=270:-1,tile=6x5" -frames:v 1 out/contact.png
ffmpeg -loglevel error -y -ss 13.2 -i out/final_9x16.mp4 -frames:v 1 out/poster.png
ffmpeg -hide_banner -i out/final_9x16.mp4 -af ebur128=framelog=quiet -f null - 2>&1 | grep -E "^\s+I:" | head -1
ls -la out/final_*.mp4
