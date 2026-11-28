# derive phrase boundaries inside each VO line from silences -> phrases.json
import wave, numpy as np, json, re
SR=22050
tl=json.load(open("timeline.json")); out=[]
for x in tl:
    w=wave.open(f"vo_final/{x['id']}.wav"); a=np.frombuffer(w.readframes(10**8),dtype=np.int16).astype(np.float32)/32768
    parts=[p.strip() for p in re.split(r"(?<=[.,:?!])\s+", x["hinglish"]) if p.strip()]
    hop=220; env=np.array([np.abs(a[i:i+hop*2]).max() for i in range(0,len(a)-hop,hop)])
    sil=env<0.035*env.max(); gaps=[]; i=0
    while i<len(sil):
        if sil[i]:
            j=i
            while j<len(sil) and sil[j]: j+=1
            if i>8 and j<len(sil)-8: gaps.append((j-i,i,j))
            i=j
        else: i+=1
    gaps=sorted(sorted(gaps,reverse=True)[:len(parts)-1],key=lambda g:g[1])
    ok=len(gaps)==len(parts)-1 and all(g[0]*hop/SR>0.05 for g in gaps)
    if ok:
        b=[0]+[ (g[1]+g[2])/2*hop/SR for g in gaps]+[len(a)/SR]
    else:
        L=np.cumsum([0]+[len(p) for p in parts]); b=list(L/L[-1]*len(a)/SR)
    ph=[dict(text=parts[k],start=round(x["start"]+b[k],3),end=round(x["start"]+b[k+1],3)) for k in range(len(parts))]
    out.append(dict(x,phrases=ph,aligned=bool(ok)))
    print(x["id"],ok,[(p["text"][:18],p["start"]) for p in ph])
json.dump(out,open("phrases.json","w"),indent=1,ensure_ascii=False)
