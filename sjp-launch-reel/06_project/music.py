# Original score + sound design for the SJP reel. Everything is synthesised here:
#  - orchestral parts: GeneralUser GS soundfont rendered with tinysoundfont
#  - drone, heartbeat, impacts, risers, whooshes, bell: pure numpy synthesis
import numpy as np, json, wave, sys, tinysoundfont
from scipy.signal import fftconvolve, butter, sosfilt
SR=48000; DUR=59.5; N=int(SR*DUR)
SF=sys.argv[1]
rng=np.random.default_rng(7)
ph=json.load(open("phrases.json")); L={x["id"]:x for x in ph}
T=lambda i,k=0: L[i]["phrases"][k]["start"]
def env_t(t,pts):  # piecewise linear envelope
    xs,ys=zip(*pts); return np.interp(t,xs,ys)
tt=np.arange(N)/SR
def place(buf,sig,t0,g=1.0):
    s=int(t0*SR); e=min(N,s+len(sig))
    if s<N and s>=0: buf[s:e]+=sig[:e-s]*g
def filt(x,kind,f,order=2):
    return sosfilt(butter(order,f,kind,fs=SR,output='sos'),x,axis=0)
def st(x,pan=0.0):
    l=np.cos((pan+1)*np.pi/4); r=np.sin((pan+1)*np.pi/4); return np.stack([x*l,x*r],1)

# ---------- soundfont orchestra ----------
def render_sf(events,dur):
    """events: (time, chan, key, vel, length). returns stereo float"""
    syn=tinysoundfont.Synth(samplerate=SR); sf=syn.sfload(SF)
    progs={0:48,1:49,2:42,3:52,4:46,5:60,6:47,7:73,8:44,9:43}  # strings, slow str, cello, choir, harp, horn, timpani, flute, trem str, contrabass
    for c,p in progs.items(): syn.program_select(c,sf,0,p)
    ev=[]
    for t,c,k,v,l in events: ev.append((t,1,c,k,v)); ev.append((t+l,0,c,k,0))
    ev.sort(key=lambda e:(e[0],e[1])); out=[]; cur=0
    for t,on,c,k,v in ev:
        n=int(t*SR)-cur
        if n>0: out.append(np.frombuffer(bytes(syn.generate(n)),dtype=np.float32).reshape(-1,2).copy()); cur+=n
        (syn.noteon(c,k,v) if on else syn.noteoff(c,k))
    n=int(dur*SR)-cur
    if n>0: out.append(np.frombuffer(bytes(syn.generate(n)),dtype=np.float32).reshape(-1,2).copy())
    return np.concatenate(out)[:int(dur*SR)]

D2,A2,D3,F3,A3,D4,F4,A4,D5=38,45,50,53,57,62,65,69,74
ev=[]
def chord(t,l,keys,ch=1,v=70):
    for k in keys: ev.append((t,ch,k,v,l))
t_hist=T("04"); t_1835=T("05"); t_far=T("06"); t_today=T("07"); t_ram=T("09"); t_gita=T("10")
t_bas=T("11"); t_hope=T("12"); t_padho=T("13"); t_sjp=T("14"); t_ask=T("15"); t_logo=T("17"); t_jai=T("18")
# Act 1 (curiosity): very soft low strings enter under the question
chord(2.0,7.2,[D2,A2],ch=9,v=38); chord(5.6,3.6,[D3,F3,A3],ch=1,v=34)
# Act 2 (historical pain): tremolo strings + low hits, D minor -> Bb -> Gm -> A
chord(t_hist,t_1835-t_hist+0.2,[D3,F3,A3],ch=8,v=62); chord(t_hist,t_1835-t_hist+0.2,[D2-12+12,A2],ch=9,v=70)
for k,t in enumerate([T("04",0),T("04",1),T("04",2)]): ev.append((t,6,[38,36,34][k],[100,105,112][k],1.6))
seg=(t_far-t_1835)/4
for k,(keys,bass) in enumerate([([D3,F3,A3],D2),([D3,F3,58],34),([50,55,58],43-12),([49,52,57,61],33)]):
    t=t_1835+k*seg; chord(t,seg+0.15,keys,ch=8,v=66+6*k); chord(t,seg+0.15,[k_+12 for k_ in keys],ch=1,v=50+8*k); chord(t,seg+0.1,[bass,bass+12],ch=9,v=78)
    nb=max(1,int(round(seg/0.42)))
    for b in range(nb): ev.append((t+b*seg/nb,2,bass+12,58+6*k+ (8 if b==0 else 0),0.22))   # cello ostinato pulse
ev.append((t_1835,6,38,120,2.0))
for b in range(10): ev.append((t_far-1.0+b*0.1,6,33,50+7*b,0.2))   # timpani roll into the fall
ev.append((t_far,6,38,118,2.5))
# Act 3 (reflection): bare drone + lonely flute, then slow D minor pads
chord(t_far,t_today-t_far+0.3,[D2,A2],ch=9,v=52)
for t,k,l in [(t_far+0.3,A4,0.9),(t_far+1.2,72,0.45),(t_far+1.65,A4,0.45),(t_far+2.1,65,1.3)]: ev.append((t,7,k,74,l))
prog=[([D3,F3,A3],D2),([48,52,55],36),([46,50,53],34),([45,49,52],33)]
seg=(t_bas-t_today)/4
for k,(keys,bass) in enumerate(prog):
    t=t_today+k*seg; chord(t,seg+0.25,keys,ch=1,v=52+5*k); chord(t,seg+0.2,[bass,bass+12],ch=9,v=58+5*k)
    for j,kk in enumerate([keys[0]+12,keys[1]+12,keys[2]+12,keys[1]+12]): ev.append((t+j*seg/4,4,kk,46+4*k,0.9))   # harp
for b in range(8): ev.append((t_bas-0.8+b*0.1,6,33,46+8*b,0.2))
ev.append((t_bas,6,38,127,2.2)); ev.append((t_bas,9,26,120,0.5)); chord(t_bas,0.35,[D3,A3,D4],ch=0,v=115)
# --- silence after "Bas." ---
# Act 4 (awakening -> hope): D major
Dj=[D3,54,A3]; 
chord(t_hope,t_padho-t_hope+0.2,[D3,A3,D4,66],ch=1,v=56); chord(t_hope,t_padho-t_hope+0.2,[D2,A2],ch=9,v=60)
for j,kk in enumerate([D4,66,A4,D5,A4,66]): ev.append((t_hope+j*(t_padho-t_hope)/6,4,kk,60,1.2))
for k,i in enumerate(range(4)):                       # Padho / Sawaal karo / Samjho / Jiyo : one rising hit each
    t=T("13",i); keys=[[D3,54,A3],[52,55,59],[55,59,62],[57,61,64]][k]
    chord(t,(T("13",i+1) if i<3 else t_sjp)-t+0.1,[x+12 for x in keys],ch=0,v=84+5*k); chord(t,0.9,[keys[0]-12,keys[0]],ch=9,v=84); ev.append((t,6,keys[0]-12,92+6*k,1.0))
# Act 5 (brand): D - A/C# - Bm - G, then Em7/A build
seg=(t_ask-t_sjp)/2
for k,(keys,bass) in enumerate([([62,66,69],38),([61,64,69],37)]):
    t=t_sjp+k*seg; chord(t,seg+0.2,keys,ch=0,v=86); chord(t,seg+0.2,[x-12 for x in keys],ch=1,v=70); chord(t,seg+0.2,[bass,bass+12],ch=9,v=86); chord(t,seg+0.2,keys,ch=3,v=60); chord(t,seg,[keys[0]-12,keys[2]-12],ch=5,v=70)
    for j in range(6): ev.append((t+j*seg/6,4,[keys[0],keys[1],keys[2],keys[0]+12,keys[2],keys[1]][j],64,1.0))
ev.append((t_sjp,6,38,112,2.0))
seg=(t_logo-t_ask)/2
for k,(keys,bass) in enumerate([([59,62,66],35),([55,59,62,64],43-12)]):
    t=t_ask+k*seg; chord(t,seg+0.2,keys,ch=0,v=82+8*k); chord(t,seg+0.2,[x-12 for x in keys],ch=1,v=68+8*k); chord(t,seg+0.2,[bass,bass+12],ch=9,v=84+6*k); chord(t,seg+0.2,keys,ch=3,v=58+10*k); chord(t,seg,[keys[0]-12],ch=5,v=72+8*k)
    for j in range(6): ev.append((t+j*seg/6,4,[keys[0],keys[1],keys[2],keys[0]+12,keys[2],keys[1]][j],62+6*k,1.0))
chord(t_logo-1.1,1.1,[57,61,64,69],ch=0,v=96); chord(t_logo-1.1,1.1,[45,33],ch=9,v=96); chord(t_logo-1.1,1.1,[57,64],ch=5,v=88)   # A (dominant)
for b in range(11): ev.append((t_logo-1.1+b*0.1,6,33,48+7*b,0.2))
# Climax + resolution on D major at the logo
fin=[62,66,69,74,78]; l=DUR-t_logo
chord(t_logo,l,fin,ch=0,v=112); chord(t_logo,l,[50,57,62],ch=1,v=92); chord(t_logo,l,[26,38],ch=9,v=112); chord(t_logo,l,[62,66,69,74],ch=3,v=84); chord(t_logo,l,[50,57,62],ch=5,v=92)
ev.append((t_logo,6,38,127,3.0)); ev.append((t_jai,6,38,100,3.0))
for j,kk in enumerate([50,57,62,66,69,74,78,81]): ev.append((t_logo+j*0.11,4,kk,84,2.5))
orch=render_sf(ev,DUR)
# hall reverb (synthetic impulse response)
irn=int(2.8*SR); ir=rng.standard_normal((irn,2))*np.exp(-np.arange(irn)/SR*2.6)[:,None]; ir=filt(ir,'low',5500); ir[:int(0.012*SR)]*=0.2
wet=np.stack([fftconvolve(orch[:,c],ir[:,c])[:N] for c in range(2)],1); wet/=np.abs(wet).max()+1e-9
orch=orch/ (np.abs(orch).max()+1e-9)*0.75+wet*0.42

# ---------- synthesised layers ----------
sfx=np.zeros((N,2),np.float32)
# tanpura-like drone on D (Sa-Pa-Sa), slow harmonic shimmer
def drone(f,amp,ph0):
    x=np.zeros(N)
    for h in range(1,14):
        a=amp/h**1.05*(0.55+0.45*np.sin(2*np.pi*(0.07+0.013*h)*tt+ph0+h))
        x+=a*np.sin(2*np.pi*f*h*tt*(1+0.0004*np.sin(2*np.pi*0.21*tt+h)))
    return x
dr=drone(73.42,0.5,0)+drone(110.0,0.3,1.3)+drone(146.83,0.26,2.1)+0.5*np.sin(2*np.pi*36.71*tt)
dr_env=env_t(tt,[(0,0),(1.2,0.55),(t_hist,0.6),(t_1835,0.35),(t_far,0.7),(t_today,0.5),(t_bas-0.3,0.45),(t_bas+0.15,0.0),(t_hope,0.0),(t_hope+1,0.35),(t_logo,0.3),(DUR-2.5,0.3),(DUR-0.2,0)])
sfx+=st(dr*dr_env*0.16)
# heartbeat (lub-dub) through the opening and the reflective section
def thump(f0,l=0.28,drop=0.5):
    n=int(l*SR); t=np.arange(n)/SR; f=f0*(drop+(1-drop)*np.exp(-t*18)); return np.sin(2*np.pi*np.cumsum(f)/SR)*np.exp(-t*16)
def beats(t0,t1,period,g):
    t=t0
    while t<t1:
        place(sfx,st(thump(58)),t,g); place(sfx,st(thump(48)),t+0.24,g*0.7); t+=period
beats(0.15,t_hist-0.6,1.25,0.55); beats(t_far+0.2,t_bas-1.0,1.1,0.32)
# cinematic impact: sub drop + noise burst
def impact(g=1.0,l=2.2):
    n=int(l*SR); t=np.arange(n)/SR
    sub=np.sin(2*np.pi*np.cumsum(38+70*np.exp(-t*9))/SR)*np.exp(-t*2.3)
    nz=filt(rng.standard_normal(n),'low',900)*np.exp(-t*7)*0.9+filt(rng.standard_normal(n),'band',[1500,6000])*np.exp(-t*30)*0.25
    return st(np.tanh((sub+nz)*1.6)*g)
for t,g in [(T("04",0),0.75),(T("04",1),0.8),(T("04",2),0.9),(t_1835,1.0),(t_far,0.8),(t_bas,1.25),(T("13",0),0.5),(T("13",1),0.55),(T("13",2),0.6),(T("13",3),0.7),(t_sjp,0.8),(t_logo,1.2)]:
    place(sfx,impact(g),t-0.02,0.5)
# risers / whooshes (filtered noise with rising cutoff)
def riser(l,g=1.0,rev=False):
    n=int(l*SR); t=np.arange(n)/SR; x=rng.standard_normal(n); out=np.zeros(n); B=2048
    for i in range(0,n,B):
        fc=250+7000*(i/n)**2.2; seg=x[i:i+B]
        out[i:i+B]=sosfilt(butter(2,[fc*0.6,min(fc*1.6,20000)],'band',fs=SR,output='sos'),seg)
    out*= (t/l)**2.5
    if rev: out=out[::-1]
    return st(out*g)
place(sfx,riser(1.6),t_hist-1.6,0.20); place(sfx,riser(1.3),t_1835-1.3,0.22); place(sfx,riser(2.6),t_bas-2.6,0.34)
place(sfx,riser(2.2),t_sjp-2.2,0.22); place(sfx,riser(2.8),t_logo-2.8,0.36)
for t in [T("04",1),T("04",2),T("05",1),t_today,t_ram,t_gita,T("13",1),T("13",2),T("13",3),t_ask]:
    place(sfx,riser(0.35),t-0.33,0.10)
# temple bell (inharmonic additive synthesis)
def bell(f=293.66,l=5.0):
    n=int(l*SR); t=np.arange(n)/SR; x=np.zeros(n)
    for r,a,d in [(0.5,0.5,0.6),(1,1,0.9),(1.19,0.7,1.2),(1.5,0.5,1.5),(2,0.8,1.4),(2.51,0.45,2.2),(2.66,0.35,2.6),(3.01,0.3,3.2),(4.1,0.2,4.5),(5.4,0.12,6)]:
        x+=a*np.sin(2*np.pi*f*r*t+r)*np.exp(-t*d)*(1+0.15*np.sin(2*np.pi*(1.5+r*0.3)*t))
    x[:int(0.004*SR)]*=np.linspace(0,1,int(0.004*SR)); return st(x/4)
place(sfx,bell(587.33,3),0.25,0.10); place(sfx,bell(293.66),t_logo,0.42); place(sfx,bell(293.66),t_jai+0.55,0.3); place(sfx,bell(587.33,4),t_hope,0.16)
wet2=np.stack([fftconvolve(sfx[:,c],ir[:,c])[:N] for c in range(2)],1); wet2/=np.abs(wet2).max()+1e-9
sfx=sfx+wet2*0.18

# ---------- arrangement automation + master ----------
orch_env=env_t(tt,[(0,0),(2,0.5),(t_hist,0.8),(t_1835,0.95),(t_far,1.0),(t_far+0.4,0.6),(t_today,0.62),(t_bas,0.85),(t_bas+0.5,0.9),(t_bas+0.75,0.0),(t_hope-0.05,0.0),(t_hope,0.7),(t_padho,0.85),(t_sjp,0.95),(t_logo,1.0),(DUR-2.6,1.0),(DUR-0.15,0.0)])
mus=orch*orch_env[:,None]*0.9+sfx
mus=filt(mus,'high',28)
mus=np.tanh(mus*1.15)/1.15
mus/=np.abs(mus).max(); mus*=0.9
w=wave.open("music.wav","wb"); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((mus*32767).astype(np.int16).tobytes()); w.close()
json.dump(dict(t_hist=t_hist,t_1835=t_1835,t_far=t_far,t_today=t_today,t_ram=t_ram,t_gita=t_gita,t_bas=t_bas,t_hope=t_hope,t_padho=t_padho,t_sjp=t_sjp,t_ask=t_ask,t_logo=t_logo,t_jai=t_jai),open("cues.json","w"))
print("music ok", mus.shape)
