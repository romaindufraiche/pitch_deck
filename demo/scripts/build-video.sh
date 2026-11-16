#!/usr/bin/env bash
# Assemble les deux plans de dressing (Pixabay) en une vidéo verticale 540×960, ~16 s, sans son.
set -euo pipefail
cd "$(dirname "$0")/.."
IN=.cache/pixabay/video
ffmpeg -loglevel error -y \
  -i "$IN/dressing-vestes.mp4" -i "$IN/dressing-chemises.mp4" \
  -filter_complex "[0:v]crop=ih*9/16:ih,scale=540:960,setsar=1,fps=30[a];[1:v]crop=ih*9/16:ih,scale=540:960,setsar=1,fps=30[b];[a][b]concat=n=2:v=1:a=0,format=yuv420p[v]" \
  -map "[v]" -c:v libx264 -crf 26 -preset slow -movflags +faststart -an public/video/dressing.mp4
ffmpeg -loglevel error -y -ss 1 -i public/video/dressing.mp4 -frames:v 1 -q:v 4 public/video/dressing-poster.jpg
ls -la public/video
