# SATYA JANTA PARTY — launch reel

| | |
|---|---|
| Final video | `01_final/SJP_launch_reel.mp4` — 1080×1920, 30 fps, 59.5 s, H.264 + AAC, ~6 Mbps |
| Cover | `01_final/thumbnail_1080x1920.jpg` |
| Voiceover | `02_audio/voiceover_processed.wav` (as used), `voiceover_raw_tts.wav` (untreated) |
| Music + SFX | `02_audio/music_and_sfx_full.flac` (no voice), `final_mix.flac` |
| Subtitles | `03_subtitles/*.srt` (Hinglish by phrase, Hindi by line). Captions are already burned into the MP4. |
| Script, voice guide, caption | `04_script/` |
| Images, fonts, graphics | `05_assets/` — licences in `SOURCES_AND_LICENCES.md` |
| Editable project | `06_project/` (Python + FFmpeg; everything regenerates from code) |

## Honest notes
- The voice is a synthetic open-source Hindi voice (Piper `hi_IN-rohan-medium`), pitched down and EQ'd. It was checked with speech recognition, not by a human ear. Listen before publishing; a human recording will sound better (see `04_script/voiceover_recording_guide.md`).
- The music is an original composition rendered from a free soundfont plus synthesised drone, impacts and bell. It is not a live orchestra.
- All visuals are still images with camera moves. Archival photographs carry an on-screen label with place and year. Paintings are labelled as paintings.
- The logo is a temporary typographic treatment. No party symbol was invented.

## Regenerate / edit
Requirements: Python 3.10+, FFmpeg, `pip install piper-tts opencv-python-headless scipy pillow numpy tinysoundfont --no-deps`
(install tinysoundfont with `--no-deps`; the others normally).

Downloads not stored here (size): the voice model and the soundfont.

```bash
cd 06_project
curl -LO https://huggingface.co/rhasspy/piper-voices/resolve/main/hi/hi_IN/rohan/medium/hi_IN-rohan-medium.onnx
curl -LO https://huggingface.co/rhasspy/piper-voices/resolve/main/hi/hi_IN/rohan/medium/hi_IN-rohan-medium.onnx.json
curl -LO https://raw.githubusercontent.com/mrbumpy409/GeneralUser-GS/main/GeneralUser-GS.sf2
bash build.sh
```

What to edit:
- **Words / pauses:** `script_lines.py` (Hinglish caption, Devanagari text for the voice, pause after each line).
- **Your own voice:** record each line, save as `vo_final/01.wav` … `18.wav` (22050 Hz mono), then run `build.sh` from the `build_vo.py` step. Picture, captions and music re-time themselves to your recording.
- **Scenes, on-screen text, labels, camera moves:** `build()` in `render.py`.
- **Music:** `music.py`.

DaVinci Resolve (free) route: import `01_final/SJP_launch_reel.mp4`, or rebuild from `05_assets/images` + `05_assets/graphics/*.png` (transparent titles and logo) + `02_audio/*` using the timings in `06_project/scenes.json` and `phrases.json`, and import the SRT for captions.
