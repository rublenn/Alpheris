import sys, wave, numpy as np, os
from piper import PiperVoice
from piper.config import SynthesisConfig
from script_lines import LINES
model, outdir, ls = sys.argv[1], sys.argv[2], float(sys.argv[3])
os.makedirs(outdir, exist_ok=True)
v=PiperVoice.load(model)
tot=0
for i,cap,txt,_p in LINES:
    cfg=SynthesisConfig(length_scale=ls, noise_scale=0.6, noise_w_scale=0.75)
    a=np.concatenate([c.audio_float_array for c in v.synthesize(txt,cfg)])
    sr=v.config.sample_rate
    # trim silence
    idx=np.where(abs(a)>0.01)[0]; a=a[max(0,idx[0]-400):idx[-1]+1200]
    w=wave.open(f"{outdir}/{i}.wav","wb"); w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr); w.writeframes((np.clip(a,-1,1)*32767).astype(np.int16).tobytes()); w.close()
    d=len(a)/sr; tot+=d; print(i, round(d,2), cap[:40])
print("TOTAL", round(tot,2))
