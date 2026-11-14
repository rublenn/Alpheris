import wave, numpy as np, json, subprocess
from script_lines import LINES
SR=22050; LEAD=0.35
def rd(p):
    w=wave.open(p); return np.frombuffer(w.readframes(10**8),dtype=np.int16).astype(np.float32)/32768
t=LEAD; segs=[]; tl=[]
for i,cap,txt,pause in LINES:
    a=rd(f"vo_final/{i}.wav"); a=a/max(abs(a).max(),1e-3)*0.8
    n=len(a); f=int(0.01*SR); a[:f]*=np.linspace(0,1,f); a[-f:]*=np.linspace(1,0,f)
    tl.append(dict(id=i,start=round(t,3),end=round(t+n/SR,3),hinglish=cap,hindi=txt)); segs.append((int(t*SR),a)); t+=n/SR+pause
tot=t
out=np.zeros(int(60*SR),np.float32)
for s,a in segs: out[s:s+len(a)]+=a
w=wave.open("vo_dry.wav","wb"); w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((out*32767).astype(np.int16).tobytes()); w.close()
json.dump(tl,open("timeline.json","w"),indent=1,ensure_ascii=False)
for x in tl: print(x["id"],x["start"],x["end"],x["hinglish"][:45])
print("speech ends",round(tot,2))
