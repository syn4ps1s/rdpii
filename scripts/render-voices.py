"""Pre-render every game line with Kokoro (offline neural TTS) into assets/voice/*.mp3.

    pip install kokoro-onnx lameenc soundfile
    # model files: https://github.com/thewh1teagle/kokoro-onnx/releases/tag/model-files-v1.0
    python scripts/render-voices.py <dir-with-kokoro-v1.0.int8.onnx-and-voices-v1.0.bin>

Reads voice/lines.json (node scripts/extract-lines.mjs) and writes voice/manifest.json:
{ "lang|text": { "m": "file.mp3", "f": "file.mp3" } }. Existing clips are reused.
"""
import hashlib, json, os, sys
import numpy as np, lameenc
from kokoro_onnx import Kokoro

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "assets", "voice")
MODEL = sys.argv[1] if len(sys.argv) > 1 else "."
os.makedirs(OUT, exist_ok=True)

# (voice, speed) per language / speaker / gender
CAST = {
    "es": {
        "gladys": ("ef_dora", 0.92), "hugo": ("em_alex", 0.95), "canuto": ("em_santa", 0.88),
        "bacteria": ("em_alex", 1.05), "rayita": ("ef_dora", 1.08), "flaqui": ("ef_dora", 1.0), "iris": ("ef_dora", 0.97),
        "m": ("em_alex", 1.0), "f": ("ef_dora", 1.0),
    },
    "gta": {
        "gladys": ("af_heart", 0.95), "feeder": ("af_heart", 0.95), "feederPet": ("af_heart", 0.95), "feederEat": ("af_heart", 0.95),
        "hugo": ("am_onyx", 0.95), "canuto": ("am_onyx", 0.88), "bacteria": ("am_fenrir", 1.05),
        "rayita": ("af_nova", 1.05), "flaqui": ("af_sky", 1.0), "iris": ("af_kore", 0.97),
        "kid.m": ("am_puck", 1.1), "kid.f": ("af_sky", 1.1), "chaseLine.m": ("am_puck", 1.1), "chaseLine.f": ("af_sky", 1.1),
        "haterSpot.m": ("am_onyx", 1.0), "haterHit.m": ("am_onyx", 1.0), "haterGrumble.m": ("am_onyx", 0.95),
        "shopkeep.m": ("am_adam", 1.0), "shopCatch.m": ("am_adam", 1.05), "shopSpot.m": ("am_adam", 1.0),
        "rival.m": ("am_fenrir", 1.0), "rival.f": ("af_bella", 1.0),
        "m": ("am_michael", 1.02), "f": ("af_bella", 1.0),
    },
}

def cast(lang, speaker, g):
    c = CAST[lang]
    return c.get(f"{speaker}.{g}") or c.get(speaker) or c[g]

def mp3(samples, sr):
    pcm = (np.clip(samples, -1, 1) * 32767).astype(np.int16).tobytes()
    e = lameenc.Encoder()
    e.set_bit_rate(32); e.set_in_sample_rate(sr); e.set_channels(1); e.set_quality(2)
    return e.encode(pcm) + e.flush()

def main():
    lines = json.load(open(os.path.join(ROOT, "voice", "lines.json")))
    k = Kokoro(os.path.join(MODEL, "kokoro-v1.0.int8.onnx"), os.path.join(MODEL, "voices-v1.0.bin"))
    manifest, done = {}, 0
    total = sum(len(l["genders"]) for l in lines)
    for l in lines:
        for g in l["genders"]:
            voice, speed = cast(l["lang"], l["speaker"], g)
            name = hashlib.sha1(f'{l["key"]}|{g}|{voice}|{speed}'.encode()).hexdigest()[:12] + ".mp3"
            path = os.path.join(OUT, name)
            if not os.path.exists(path):
                s, sr = k.create(l["text"], voice=voice, speed=speed, lang="es" if l["lang"] == "es" else "en-us")
                peak = float(np.abs(s).max()) or 1.0
                open(path, "wb").write(mp3(s * (0.89 / peak), sr))
            manifest.setdefault(l["key"], {})[g] = name
            done += 1
            if done % 25 == 0: print(f"{done}/{total}", flush=True)
    keep = {f for v in manifest.values() for f in v.values()}
    for f in os.listdir(OUT):
        if f.endswith(".mp3") and f not in keep: os.remove(os.path.join(OUT, f))
    json.dump(manifest, open(os.path.join(ROOT, "voice", "manifest.json"), "w"), ensure_ascii=False, indent=0)
    print("done", done, "clips")

main()
