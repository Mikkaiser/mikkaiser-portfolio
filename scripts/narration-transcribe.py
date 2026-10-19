# Writes what a narration says, word by word, with start and end times, for
# scripts/narration-sync.mjs.
#
#   python3 scripts/narration-transcribe.py public/audio/<slug>.m4a words.json
#
# Needs ffmpeg and faster-whisper (pip install faster-whisper). It uses the GPU
# when it finds one; if the CUDA libraries are missing it fails on the first
# segment, and WHISPER_DEVICE=cpu runs it on the CPU instead. ffmpeg decodes the
# audio, so any format it reads works.
import json
import os
import subprocess
import sys

import numpy as np
from faster_whisper import WhisperModel

src, out = sys.argv[1], sys.argv[2]

# 16 kHz mono floats, what Whisper listens to.
pcm = subprocess.run(
    ["ffmpeg", "-v", "error", "-i", src, "-ac", "1", "-ar", "16000", "-f", "f32le", "-"],
    check=True, capture_output=True,
).stdout
audio = np.frombuffer(pcm, dtype=np.float32)

device = os.environ.get("WHISPER_DEVICE", "auto")
model = WhisperModel("mobiuslabsgmbh/faster-whisper-large-v3-turbo", device=device, compute_type="int8" if device == "cpu" else "default")

# Without the previous text as a prompt, Whisper is less likely to repeat itself on a long file.
segments, _ = model.transcribe(audio, language="en", word_timestamps=True, beam_size=5, condition_on_previous_text=False)
words = [{"w": w.word, "s": round(w.start, 3), "e": round(w.end, 3)} for s in segments for w in s.words]

with open(out, "w") as f:
    json.dump(words, f)
print(f"{len(words)} words → {out}")
