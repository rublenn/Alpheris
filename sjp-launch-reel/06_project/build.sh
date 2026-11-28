#!/usr/bin/env bash
# Rebuilds the whole reel. Run inside 06_project after downloading the voice model and soundfont (see README).
set -euo pipefail
IMG=../05_assets/images; FONTS=../05_assets/fonts
python3 tts.py hi_IN-rohan-medium.onnx vo_final 0.78          # skip this line if you recorded your own vo_final/*.wav
python3 build_vo.py                                           # timeline.json + vo_dry.wav
python3 phrases.py                                            # phrase timings from silences
ffmpeg -y -v error -i vo_dry.wav -af "rubberband=pitch=0.93:formant=preserved,highpass=f=65,bass=g=5:f=130:w=0.7,equalizer=f=320:t=q:w=1.2:g=-2,equalizer=f=3200:t=q:w=1:g=2.5,acompressor=threshold=-20dB:ratio=3.5:attack=8:release=120:makeup=4,aecho=0.85:0.25:38|71:0.10|0.07,alimiter=limit=0.9,aresample=48000" -ac 1 vo_proc.wav
python3 music.py GeneralUser-GS.sf2                           # music.wav
python3 mix.py                                                # mix_pre.wav (voice + ducked music)
ffmpeg -y -v error -i mix_pre.wav -af "loudnorm=I=-14:TP=-1.5:LRA=11" -ar 48000 mix_final.wav
for i in 0 1 2 3; do a=$((i*447)); b=$(((i+1)*447)); [ $i = 3 ] && b=1785
  python3 render.py $IMG $FONTS chunk_$i.mp4 $a $b & done; wait
for i in 0 1 2 3; do echo "file chunk_$i.mp4"; done > chunks.txt
ffmpeg -y -v error -f concat -i chunks.txt -c copy video_master.mp4
V="-c:v libx264 -preset slow -b:v 6000k -maxrate 9000k -bufsize 12000k -profile:v high -level 4.2 -pix_fmt yuv420p -g 60 -colorspace bt709 -color_primaries bt709 -color_trc bt709"
ffmpeg -y -v error -i video_master.mp4 $V -pass 1 -an -f null /dev/null
ffmpeg -y -v error -i video_master.mp4 -i mix_final.wav $V -pass 2 -c:a aac -b:a 256k -ar 48000 -movflags +faststart -shortest SJP_launch_reel.mp4
python3 extras.py $IMG $FONTS .                               # thumbnail + transparent PNG graphics
