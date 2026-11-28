# SJP launch reel renderer: stills -> animated 1080x1920 30fps frames piped to FFmpeg.
# usage: render.py <assets_dir> <fonts_dir> <out.mp4|frame_dir> <start_frame> <end_frame> [--stills t1,t2,...]
import sys, json, os, math, subprocess, re
import numpy as np, cv2
from PIL import Image, ImageDraw, ImageFont, ImageFilter
Image.MAX_IMAGE_PIXELS = None
IMG, FONTS, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
W, H, FPS, DUR = 1080, 1920, 30, 59.5
NF = int(DUR * FPS)
PH = json.load(open("phrases.json")); L = {x["id"]: x for x in PH}
T = lambda i, k=0: L[i]["phrases"][k]["start"]
E = lambda i: L[i]["end"]
rng = np.random.default_rng(11)
GOLD = (0.83, 0.66, 0.30); GOLD_HI = (0.97, 0.86, 0.58); SAFFRON = (0.85, 0.47, 0.16); WHITE = (0.96, 0.93, 0.86)

# ------------------------------------------------------------------ helpers
def clamp(x, a=0.0, b=1.0): return max(a, min(b, x))
def smooth(x): x = clamp(x); return x * x * (3 - 2 * x)
def ease_out(x): x = clamp(x); return 1 - (1 - x) ** 3

def load(name):
    return np.asarray(Image.open(f"{IMG}/{name}.jpg").convert("RGB"), dtype=np.float32) / 255.0

def crop(a, x0, y0, x1, y1):
    h, w = a.shape[:2]; return a[int(y0 * h):int(y1 * h), int(x0 * w):int(x1 * w)]

def grade(a, kind):
    lum = (a @ np.array([0.299, 0.587, 0.114], np.float32))[..., None]
    if kind == "archival":      # monochrome print, warm sepia
        x = np.clip((lum - 0.08) * 1.25, 0, 1) ** 1.15
        a = x * np.array([1.0, 0.86, 0.66], np.float32)
    elif kind == "manuscript":
        a = lum * 0.35 + a * 0.65
        a = np.clip((a - 0.05) * 1.1, 0, 1) ** 1.2 * np.array([1.0, 0.9, 0.72], np.float32)
    elif kind == "painting":
        a = lum * 0.25 + a * 0.75
        a = np.clip((a - 0.04) * 1.08, 0, 1) ** 1.25 * np.array([1.0, 0.93, 0.8], np.float32)
    elif kind == "warm":        # modern photos pulled toward the black/gold palette
        a = lum * 0.45 + a * 0.55
        a = np.clip((a - 0.05) * 1.15, 0, 1) ** 1.3 * np.array([1.0, 0.9, 0.74], np.float32)
    elif kind == "sun":
        a = lum * 0.15 + a * 0.85
        a = np.clip((a - 0.03) * 1.12, 0, 1) ** 1.15 * np.array([1.0, 0.92, 0.8], np.float32)
    return np.clip(a, 0, 1).astype(np.float32)

def make_card(a, card_w=900, cy=0.43):
    """small archival print mounted on a blurred, darkened copy of itself (1350x2400 canvas)."""
    CW, CH = 1350, 2400
    h, w = a.shape[:2]; s = max(CW / w, CH / h)
    bg = cv2.resize(a, (int(w * s) + 1, int(h * s) + 1), interpolation=cv2.INTER_CUBIC)
    y0 = (bg.shape[0] - CH) // 2; x0 = (bg.shape[1] - CW) // 2
    bg = cv2.GaussianBlur(bg[y0:y0 + CH, x0:x0 + CW], (0, 0), 38) * 0.32
    fw = int(card_w * 1.25); fh = int(h * fw / w)
    fg = cv2.resize(a, (fw, fh), interpolation=cv2.INTER_LANCZOS4 if fw > w else cv2.INTER_AREA)
    if fw > w * 1.3: fg = cv2.GaussianBlur(fg, (0, 0), 0.8)
    x = (CW - fw) // 2; y = int(CH * cy - fh / 2)
    sh = np.zeros((CH, CW), np.float32); sh[y + 20:y + fh + 40, x - 10:x + fw + 10] = 1
    sh = cv2.GaussianBlur(sh, (0, 0), 30)[..., None]
    bg = bg * (1 - 0.75 * sh)
    b = 5
    bg[y - b:y + fh + b, x - b:x + fw + b] = np.array(GOLD, np.float32) * 0.55
    bg[y:y + fh, x:x + fw] = np.clip(fg, 0, 1)
    return bg.astype(np.float32)

class Still:
    """cover-fit still with Ken Burns move: focal point (fx,fy) and zoom interpolate over the scene."""
    def __init__(s, a, z0, z1, f0, f1, dim=1.0):
        h, w = a.shape[:2]; s0 = max(W / w, H / h); zmax = max(z0, z1)
        k = s0 * zmax
        a = cv2.resize(a, (int(round(w * k)), int(round(h * k))), interpolation=cv2.INTER_AREA if k < 1 else cv2.INTER_CUBIC)
        s.a = np.ascontiguousarray(a * dim); s.h, s.w = a.shape[:2]; s.zmax = zmax
        s.z0, s.z1, s.f0, s.f1 = z0, z1, f0, f1
    def frame(s, u):
        z = (s.z0 + (s.z1 - s.z0) * u) / s.zmax
        fx = s.f0[0] + (s.f1[0] - s.f0[0]) * u; fy = s.f0[1] + (s.f1[1] - s.f0[1]) * u
        vw, vh = W / z, H / z
        cx = min(max(fx * s.w, vw / 2), s.w - vw / 2); cy = min(max(fy * s.h, vh / 2), s.h - vh / 2)
        M = np.float32([[z, 0, W / 2 - z * cx], [0, z, H / 2 - z * cy]])
        return cv2.warpAffine(s.a, M, (W, H), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)

class Solid:
    def __init__(s, glow=0.0, cy=0.42):
        yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
        r = np.sqrt(((xx - W / 2) / (W * 0.75)) ** 2 + ((yy - H * cy) / (H * 0.5)) ** 2)
        g = np.clip(1 - r, 0, 1) ** 2.2 * glow
        s.a = (g[..., None] * np.array([1.0, 0.72, 0.36], np.float32)).astype(np.float32)
    def frame(s, u): return s.a.copy()

# ------------------------------------------------------------------ text
def font(name, size, wght=None):
    f = ImageFont.truetype(f"{FONTS}/{name}", size)
    if wght:
        try: f.set_variation_by_axes([wght] if len(f.get_variation_axes()) == 1 else [100, wght])
        except Exception: pass
    return f

def text_layer(txt, fnt, color=WHITE, tracking=0, stroke=0, shadow=10, grad=None, glow=0.0, angle=0):
    """returns premultiplied RGBA float32 layer."""
    pad = 60 + stroke * 2
    d0 = ImageDraw.Draw(Image.new("L", (8, 8)))
    if tracking:
        ws = [d0.textlength(c, font=fnt) for c in txt]; tw = int(sum(ws) + tracking * (len(txt) - 1))
        bb = d0.textbbox((0, 0), txt, font=fnt); th = bb[3] - bb[1]; oy = bb[1]; ox = 0
    else:
        bb = d0.textbbox((0, 0), txt, font=fnt, stroke_width=stroke); tw = bb[2] - bb[0]; th = bb[3] - bb[1]; ox, oy = bb[0], bb[1]
    Wd, Hd = tw + pad * 2, th + pad * 2
    m = Image.new("L", (Wd, Hd), 0); d = ImageDraw.Draw(m)
    ms = Image.new("L", (Wd, Hd), 0); dsk = ImageDraw.Draw(ms)
    if tracking:
        x = pad
        for c, w_ in zip(txt, ws):
            d.text((x, pad - oy), c, font=fnt, fill=255)
            if stroke: dsk.text((x, pad - oy), c, font=fnt, fill=255, stroke_width=stroke, stroke_fill=255)
            x += w_ + tracking
    else:
        d.text((pad - ox, pad - oy), txt, font=fnt, fill=255)
        if stroke: dsk.text((pad - ox, pad - oy), txt, font=fnt, fill=255, stroke_width=stroke, stroke_fill=255)
    if angle:
        m = m.rotate(angle, expand=True, resample=Image.BICUBIC); ms = ms.rotate(angle, expand=True, resample=Image.BICUBIC)
        Wd, Hd = m.size
    a = np.asarray(m, np.float32) / 255
    col = np.ones((Hd, Wd, 3), np.float32) * np.array(color, np.float32)
    if grad:
        g = np.linspace(0, 1, Hd, dtype=np.float32)[:, None, None]
        col = np.array(grad[0], np.float32) * (1 - g) + np.array(grad[1], np.float32) * g
        col = np.broadcast_to(col, (Hd, Wd, 3)).copy()
    rgb = col * a[..., None]; alpha = a.copy()
    under = np.zeros_like(a)
    if stroke: under = np.maximum(under, np.asarray(ms, np.float32) / 255)
    if shadow:
        base = np.asarray(ms if stroke else m, np.float32) / 255
        under = np.maximum(under, np.clip(cv2.GaussianBlur(base, (0, 0), shadow) * 1.6, 0, 1) * 0.85)
    # composite text over dark underlay (premultiplied)
    out_a = alpha + under * (1 - alpha)
    out = np.dstack([rgb, out_a])
    if glow:
        gl = cv2.GaussianBlur(a, (0, 0), 22) * glow
        out[..., :3] += gl[..., None] * np.array(color if not grad else grad[0], np.float32)
    return out.astype(np.float32)

def blit(fr, layer, cx, cy, alpha=1.0, scale=1.0, add_glow=False):
    if alpha <= 0.003: return
    if abs(scale - 1) > 1e-3:
        layer = cv2.resize(layer, None, fx=scale, fy=scale, interpolation=cv2.INTER_LINEAR)
    lh, lw = layer.shape[:2]; x0 = int(round(cx - lw / 2)); y0 = int(round(cy - lh / 2))
    xa, ya = max(0, x0), max(0, y0); xb, yb = min(W, x0 + lw), min(H, y0 + lh)
    if xa >= xb or ya >= yb: return
    l = layer[ya - y0:yb - y0, xa - x0:xb - x0]
    reg = fr[ya:yb, xa:xb]
    reg *= (1 - l[..., 3:4] * alpha); reg += l[..., :3] * alpha

F_TIRO = "TiroDevanagariHindi-Regular.ttf"; F_MUKTA = "Mukta-ExtraBold.ttf"; F_MUKTAB = "Mukta-Bold.ttf"; F_CINZEL = "Cinzel.ttf"
GG = (GOLD_HI, (0.72, 0.52, 0.18))
def dev(txt, size, **k): return text_layer(txt, font(F_TIRO, size), grad=k.pop("grad", GG), **k)
def devb(txt, size, **k): return text_layer(txt, font(F_MUKTA, size), **k)
def rom(txt, size, wght=700, tracking=6, **k): return text_layer(txt, font(F_CINZEL, size, wght), tracking=tracking, **k)
def label(txt):
    for size in (32, 29, 26, 23):
        l = text_layer(txt, font(F_CINZEL, size, 700), color=(0.95, 0.86, 0.66), tracking=5 if size > 26 else 3, shadow=12, stroke=2)
        if l.shape[1] - 128 <= 960: break
    return l

# text events: (layer, t_in, t_out, cx, cy, anim)
TX = []
def add(layer, t0, t1, cy, anim="fade", cx=W / 2): TX.append((layer, t0, t1, cx, cy, anim))

# ------------------------------------------------------------------ scenes
def build():
    S = []   # (t0, t1, source, opts)
    def sc(t0, t1, src, **o): S.append((t0, t1, src, o))
    # 1 — the question (diya in darkness)
    diya = grade(load("diya"), "sun")
    sc(0, T("02") - 0.1, Still(diya, 1.25, 1.12, (0.62, 0.45), (0.6, 0.45), dim=0.85), xf=0)
    add(dev("एक सवाल है…", 150, glow=0.5), 0.3, T("02") - 0.2, 600)
    # 2 — Ved, Upanishad, Gita, Darshan (Rigveda manuscript)
    rv = grade(load("rigveda_ms"), "manuscript")
    sc(T("02") - 0.1, T("03") - 0.05, Still(rv, 1.0, 1.22, (0.5, 0.3), (0.42, 0.42), dim=0.5), xf=0.5)
    tw = [T("02", 0) + 1.25, T("02", 1), T("02", 2), T("02", 2) + 0.62]
    for k, wd in enumerate(["वेद", "उपनिषद्", "गीता", "दर्शन"]):
        add(dev(wd, 150, glow=0.45), tw[k], T("03") - 0.05, 470 + k * 190, "rise")
    # 3 — how much do we know?
    sc(T("03") - 0.05, T("04") - 0.1, Still(rv, 1.22, 1.5, (0.42, 0.42), (0.4, 0.5), dim=0.2), xf=0.4)
    add(dev("कितना जानते हैं?", 132, grad=(WHITE, (0.86, 0.8, 0.68)), glow=0.3), T("03") + 1.1, T("04") - 0.25, 800)
    # 4 — invasions / temples / Nalanda : fast archival cuts
    hampi = make_card(grade(load("hampi_1868"), "archival"), 960)
    sc(T("04", 0) - 0.1, T("04", 1) - 0.03, Still(hampi, 1.0, 1.1, (0.5, 0.45), (0.5, 0.43), dim=0.95), xf=0, flash=0.5)
    add(label("HAMPI  ·  PHOTOGRAPH, 1868"), T("04", 0), T("04", 1) - 0.05, 245)
    mt = grade(crop(load("martand_1873"), 0.16, 0.19, 0.84, 0.77), "archival")
    sc(T("04", 1) - 0.03, T("04", 2) - 0.03, Still(mt, 1.05, 1.15, (0.35, 0.5), (0.5, 0.5), dim=0.9), xf=0, flash=0.5)
    add(label("MARTAND SUN TEMPLE  ·  PHOTOGRAPH, 1873"), T("04", 1), T("04", 2) - 0.05, 245)
    nal = make_card(grade(load("nalanda_1872"), "archival"), 960)
    sc(T("04", 2) - 0.03, T("05") - 0.05, Still(nal, 1.0, 1.12, (0.5, 0.45), (0.5, 0.43), dim=0.95), xf=0, flash=0.6)
    add(label("NALANDA  ·  PHOTOGRAPH, 1872"), T("04", 2), T("05") - 0.1, 245)
    # 5 — 1835
    sc(T("05") - 0.05, T("05", 1) - 0.05, Solid(0.10), xf=0, flash=0.25)
    add(rom("1835", 330, 800, tracking=10, grad=GG, glow=0.5), T("05"), T("05", 1) - 0.1, 820, "slam")
    mart = grade(crop(load("martiniere"), 0.03, 0.04, 0.97, 0.94), "archival")
    tmid = T("05", 1) + (E("05") - T("05", 1)) * 0.52
    sc(T("05", 1) - 0.05, tmid, Still(mart, 1.0, 1.08, (0.3, 0.55), (0.62, 0.52), dim=0.8), xf=0.15, flash=0.3)
    add(label("LA MARTINIÈRE SCHOOL, LUCKNOW  ·  PHOTOGRAPH, 1858"), T("05", 1) + 0.1, tmid - 0.05, 245)
    stu = grade(load("student_1870"), "archival")
    sc(tmid, T("06") - 0.05, Still(stu, 1.0, 1.1, (0.5, 0.3), (0.5, 0.38), dim=0.8), xf=0.3)
    add(label("STUDENT IN INDIA  ·  PHOTOGRAPH, c. 1870"), tmid + 0.25, T("06") - 0.1, 245)
    add(rom("1835", 120, 800, tracking=8, grad=GG, glow=0.3), T("05", 1) + 0.15, T("06") - 0.15, 420)
    add(rom("ENGLISH EDUCATION ACT", 40, 700, tracking=9, color=WHITE), T("05", 1) + 0.45, T("06") - 0.15, 520)
    # 6 — drifting away from our own knowledge
    rvb = cv2.GaussianBlur(rv, (0, 0), 9)
    sc(T("06") - 0.05, T("07") - 0.1, Still(rv, 1.35, 1.0, (0.45, 0.45), (0.5, 0.5), dim=0.42), xf=0.5, fadeto=(Still(rvb, 1.35, 1.0, (0.45, 0.45), (0.5, 0.5), dim=0.10)))
    # 7 — "myth"
    gita = make_card(grade(load("gita_ms"), "manuscript"), 760, cy=0.45)
    sc(T("07") - 0.1, T("08") - 0.05, Still(gita, 1.0, 1.1, (0.5, 0.45), (0.5, 0.45), dim=0.6), xf=0.4)
    tm = T("07") + (E("07") - T("07")) * 0.62
    add(rom("MYTH?", 230, 900, tracking=6, color=(0.86, 0.33, 0.16), glow=0.35, angle=7), tm, T("08") - 0.1, 820, "slam")
    add(label("BHAGAVAD GITA MANUSCRIPT  ·  19TH CENTURY"), T("07") + 0.2, T("08") - 0.1, 245)
    # 8 — ritual without understanding
    lamps = grade(load("lamps_chennai"), "sun")
    sc(T("08") - 0.05, T("09") - 0.1, Still(lamps, 1.05, 1.2, (0.72, 0.6), (0.78, 0.62), dim=0.75), xf=0.4)
    add(dev("बिना समझे?", 128, glow=0.4), T("08", 0) + 0.45, T("09") - 0.15, 520, "rise")
    add(dev("बिना सवाल?", 128, glow=0.4), T("08", 1), T("09") - 0.15, 700, "rise")
    # 9 — Ram
    rama = grade(crop(load("rama_varma"), 0.02, 0.02, 0.98, 0.98), "painting")
    sc(T("09") - 0.1, T("10") - 0.08, Still(rama, 1.05, 1.22, (0.5, 0.42), (0.5, 0.36), dim=0.62), xf=0.4)
    add(label("RAJA RAVI VARMA  ·  LITHOGRAPH, BEFORE 1906"), T("09") + 0.2, T("10") - 0.15, 245)
    add(dev("नाम याद है।", 128, glow=0.4), T("09", 0) + 0.3, T("10") - 0.15, 1060, "rise")
    add(dev("आदर्श?", 170, grad=(WHITE, (0.86, 0.8, 0.68)), glow=0.4), T("09", 1) + 0.5, T("10") - 0.15, 1240, "slam")
    # 10 — Gita / Karmayog
    ka = grade(crop(load("krishna_arjuna"), 0.02, 0.02, 0.98, 0.98), "painting")
    sc(T("10") - 0.08, T("11") - 0.12, Still(ka, 1.02, 1.2, (0.5, 0.5), (0.52, 0.55), dim=0.6), xf=0.4)
    add(label("KRISHNA AND ARJUNA  ·  PAINTING, c. 1830"), T("10") + 0.2, T("11") - 0.2, 245)
    add(dev("कर्मयोग", 190, glow=0.5), T("10", 1) + 0.25, T("11") - 0.2, 1120, "slam")
    # 11 — BAS (black)
    sc(T("11") - 0.12, T("12") - 0.1, Solid(0.0), xf=0)
    add(devb("बस।", 360, color=WHITE, glow=0.25), T("11"), T("12") - 0.45, 860, "slam")
    # 12 — neither blind faith nor blind rejection (sunrise)
    sun1 = grade(load("sunrise_ganga"), "sun")
    sc(T("12") - 0.1, T("13") - 0.03, Still(sun1, 1.22, 1.08, (0.5, 0.5), (0.5, 0.45), dim=0.8), xf=0.7, rays=(0.5, 0.42, 0.28))
    add(dev("न अंधभक्ति", 136, grad=(WHITE, GOLD_HI), shadow=22), T("12", 0) + 0.1, T("13") - 0.08, 1010, "rise")
    add(dev("न अंधविरोध", 136, grad=(WHITE, GOLD_HI), shadow=22), T("12", 1) + 0.1, T("13") - 0.08, 1195, "rise")
    # 13 — Padho / Sawaal karo / Samjho / Jiyo
    cuts = [T("13", 0) - 0.03, T("13", 1) - 0.03, T("13", 2) - 0.03, T("13", 3) - 0.03, T("14") - 0.1]
    srcs = [Still(grade(load("girl_reading"), "warm"), 1.1, 1.16, (0.36, 0.45), (0.36, 0.45), dim=0.72),
            Still(grade(load("students_reading"), "warm"), 1.0, 1.08, (0.48, 0.5), (0.5, 0.5), dim=0.72),
            Still(grade(load("veda_pathashala"), "warm"), 1.0, 1.08, (0.42, 0.5), (0.46, 0.5), dim=0.72),
            Still(grade(load("sunrise_boat"), "sun"), 1.0, 1.08, (0.42, 0.45), (0.44, 0.45), dim=0.85)]
    for k, wd in enumerate(["पढ़ो", "सवाल करो", "समझो", "जियो"]):
        sc(cuts[k], cuts[k + 1], srcs[k], xf=0, flash=0.45)
        add(devb(wd, 210, grad=(GOLD_HI, GOLD), glow=0.4), cuts[k] + 0.03, cuts[k + 1] - 0.02, 900, "slam")
    # 14 — the resolve: Satya Janta Party
    sun2 = grade(load("sunrise_ganga2"), "sun")
    sc(T("14") - 0.1, T("15") - 0.1, Still(sun2, 1.3, 1.12, (0.5, 0.35), (0.5, 0.3), dim=0.8), xf=0.5, rays=(0.5, 0.36, 0.5))
    tn = T("14") + (E("14") - T("14")) * 0.6
    add(dev("सत्य जनता पार्टी", 124, grad=(WHITE, GOLD_HI), shadow=24), tn, T("15") - 0.15, 1070, "rise")
    add(rom("SATYA JANTA PARTY", 64, 700, tracking=10, color=WHITE, shadow=18), tn + 0.25, T("15") - 0.15, 1205, "fade")
    # 15 — the only ask
    sc(T("15") - 0.1, T("17") - 0.08, Still(diya, 1.12, 1.3, (0.6, 0.45), (0.62, 0.45), dim=0.42), xf=0.5)
    add(dev("न पैसा।", 150, glow=0.4), T("15", 0) + 0.05, T("16") - 0.08, 640, "rise")
    add(dev("न वादा।", 150, glow=0.4), T("15", 1) + 0.05, T("16") - 0.08, 840, "rise")
    add(dev("बस एक रिक्वेस्ट", 96, grad=(WHITE, (0.86, 0.8, 0.68))), T("16", 0), T("17") - 0.15, 620, "rise")
    add(rom("FOLLOW", 170, 800, tracking=14, grad=GG, glow=0.6), T("16", 1), T("17") - 0.15, 830, "slam")
    add("pill", T("16", 1), T("17") - 0.15, 830, "pill")
    # 16 — logo reveal
    sc(T("17") - 0.08, DUR, Solid(0.32, cy=0.40), xf=0, flash=0.9, rays=(0.5, 0.36, 0.55), logo=True)
    t0 = T("17")
    add(dev("सत्य", 380, glow=0.7), t0 + 0.05, DUR, 600, "logo")
    add("rule", t0 + 0.25, DUR, 860, "rule")
    add(rom("SATYA JANTA PARTY", 72, 700, tracking=11, grad=GG, glow=0.3), t0 + 0.45, DUR, 950, "logofade")
    add(rom("SATYA KO JAANO.  SATYA KO JIYO.", 38, 600, tracking=6, color=WHITE), T("17", 0) + 0.9, DUR, 1050, "logofade")
    return S

# ------------------------------------------------------------------ overlays
yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
VIG = (1 - 0.62 * np.clip(np.sqrt(((xx - W / 2) / (W * 0.78)) ** 2 + ((yy - H / 2) / (H * 0.62)) ** 2), 0, 1.3) ** 2.4)[..., None].astype(np.float32)
CAPZ = ((1 - 0.5 * np.exp(-((yy - 1450) / 150) ** 2)) * (1 - 0.45 * np.exp(-((yy - 245) / 90) ** 2)))[..., None].astype(np.float32)
CAPZ0 = (1 - 0.5 * np.exp(-((yy - 1450) / 150) ** 2))[..., None].astype(np.float32)
GRAIN = [cv2.GaussianBlur(rng.standard_normal((H, W)).astype(np.float32), (0, 0), 0.7) for _ in range(6)]
# light rays (quarter res)
RW, RH = W // 4, H // 4
ry, rx = np.mgrid[0:RH, 0:RW].astype(np.float32)
NOISE1 = cv2.GaussianBlur(rng.random((1, 2048)).astype(np.float32), (0, 0), 6).ravel(); NOISE1 = (NOISE1 - NOISE1.min()) / (NOISE1.max() - NOISE1.min())
def rays(t, cx, cy, strength):
    dx = rx - cx * RW; dy = ry - cy * RH
    ang = np.arctan2(dy, dx); r = np.sqrt(dx * dx + dy * dy) / RH
    i1 = ((ang / (2 * np.pi) + 0.5) * 900 + t * 9).astype(np.int32) % 2048
    i2 = ((ang / (2 * np.pi) + 0.5) * 1500 - t * 6 + 300).astype(np.int32) % 2048
    v = (NOISE1[i1] * NOISE1[i2]) ** 1.4 * np.exp(-r * 1.9) * 2.6 + np.exp(-r * 7) * 0.9
    v = cv2.GaussianBlur(v.astype(np.float32), (0, 0), 2.2) * strength
    v = cv2.resize(v, (W, H), interpolation=cv2.INTER_LINEAR)
    return v[..., None] * np.array([1.0, 0.8, 0.5], np.float32)
# dust motes
NP_ = 110
P = dict(x=rng.random(NP_), y=rng.random(NP_), s=rng.uniform(1.2, 4.5, NP_), v=rng.uniform(0.006, 0.03, NP_), ph=rng.random(NP_) * 6.28, a=rng.uniform(0.25, 1.0, NP_))
def particles(t, strength):
    c = np.zeros((H // 2, W // 2), np.float32)
    for i in range(NP_):
        x = (P["x"][i] + 0.02 * math.sin(t * 0.5 + P["ph"][i])) % 1.0; y = (P["y"][i] - P["v"][i] * t) % 1.0
        a = P["a"][i] * (0.55 + 0.45 * math.sin(t * 1.7 + P["ph"][i] * 3))
        cv2.circle(c, (int(x * W / 2), int(y * H / 2)), int(round(P["s"][i])), float(a), -1, cv2.LINE_AA)
    c = cv2.GaussianBlur(c, (0, 0), 1.6)
    return cv2.resize(c, (W, H), interpolation=cv2.INTER_LINEAR)[..., None] * np.array([1.0, 0.82, 0.5], np.float32) * strength

# ------------------------------------------------------------------ captions
CAPS = []
def build_caps():
    f = font(F_MUKTAB, 60)
    for x in PH:
        for p in x["phrases"]:
            words = p["text"].replace("...", "").split(); chunks = []; cur = ""
            for w_ in words:
                if cur and len(cur) + 1 + len(w_) > 24: chunks.append(cur); cur = w_
                else: cur = (cur + " " + w_).strip()
            if cur: chunks.append(cur)
            tot = sum(len(c) for c in chunks); t = p["start"]; span = p["end"] - p["start"]
            for c in chunks:
                d = span * len(c) / tot
                CAPS.append((t, t + d, text_layer(c, f, color=(1, 1, 1), stroke=5, shadow=9))); t += d
    # hold each caption until the next one starts if the gap is short
    for i in range(len(CAPS) - 1):
        a, b, l = CAPS[i]
        if CAPS[i + 1][0] - b < 0.35: CAPS[i] = (a, CAPS[i + 1][0], l)
        else: CAPS[i] = (a, b + 0.15, l)

# ------------------------------------------------------------------ frame
def scene_frame(S, i, t):
    t0, t1, src, o = S[i]
    u = clamp((t - t0) / max(t1 - t0, 1e-3))
    fr = src.frame(u)
    if "fadeto" in o:
        k = smooth(u); fr = fr * (1 - k) + o["fadeto"].frame(u) * k
    return fr

def render_frame(S, n):
    t = n / FPS
    idx = max(i for i in range(len(S)) if S[i][0] <= t + 1e-6)
    t0, t1, src, o = S[idx]
    fr = scene_frame(S, idx, t)
    xf = o.get("xf", 0)
    if xf and idx > 0 and t - t0 < xf:
        k = smooth((t - t0) / xf); prev = scene_frame(S, idx - 1, t); fr = prev * (1 - k) + fr * k
    fr = fr.astype(np.float32)
    if "rays" in o:
        cx, cy, st = o["rays"]; fr += rays(t, cx, cy, st * smooth((t - t0) / 1.2))
    fr *= CAPZ if o.get("lab") else CAPZ0
    fr += particles(t, 0.35 if not o.get("logo") else 0.6)
    if o.get("flash") and t - t0 < 0.5:
        fr += o["flash"] * math.exp(-(t - t0) * 11) * np.array([1.0, 0.9, 0.75], np.float32)
    # kinetic text
    for layer, a, b, cx, cy, anim in TX:
        if not (a <= t < b): continue
        dt = t - a; out = clamp((b - t) / 0.18)
        if anim == "pill":
            al = smooth(dt / 0.25) * out
            ov = np.zeros((300, 900, 4), np.float32); m = np.zeros((300, 900), np.uint8)
            cv2.rectangle(m, (20, 150 + 118), (880, 150 + 122), 255, -1); cv2.rectangle(m, (20, 150 - 122), (880, 150 - 118), 255, -1)
            ov[..., :3] = (m[..., None] / 255.0) * np.array(GOLD, np.float32); ov[..., 3] = m / 255.0
            blit(fr, ov, cx, cy, al, 1.0); continue
        if anim == "rule":
            k = ease_out(dt / 0.7); wd = int(430 * k)
            if wd > 2:
                g = np.linspace(-1, 1, 2 * wd, dtype=np.float32); prof = (1 - np.abs(g) ** 3)[None, :, None]
                fr[int(cy) - 1:int(cy) + 2, W // 2 - wd:W // 2 + wd] = fr[int(cy) - 1:int(cy) + 2, W // 2 - wd:W // 2 + wd] * (1 - prof) + np.array(GOLD_HI, np.float32) * prof
            continue
        if anim == "fade": al = smooth(dt / 0.3) * out; s = 1.0 + 0.02 * dt; dy = 0
        elif anim == "rise": k = ease_out(dt / 0.35); al = k * out; s = 1.0 + 0.012 * dt; dy = (1 - k) * 36
        elif anim == "slam": k = ease_out(dt / 0.14); al = clamp(dt / 0.06) * out; s = 1.55 - 0.55 * k + 0.015 * dt; dy = 0
        elif anim == "logo": k = ease_out(dt / 0.9); al = smooth(dt / 0.5); s = 1.12 - 0.12 * k + 0.006 * dt; dy = 0
        elif anim == "logofade": k = ease_out(dt / 0.8); al = smooth(dt / 0.6); s = 1.0; dy = (1 - k) * 24
        blit(fr, layer, cx, cy + dy, al, s)
    # captions
    for a, b, l in CAPS:
        if a <= t < b:
            k = ease_out((t - a) / 0.1); blit(fr, l, W / 2, 1450 + (1 - k) * 10, clamp((t - a) / 0.06), 0.94 + 0.06 * k); break
    fr *= VIG
    g = GRAIN[n % len(GRAIN)]
    if n % 2: g = g[::-1, ::-1]
    fr += g[..., None] * (0.045 + 0.02 * (1 - np.clip(fr.mean(axis=2, keepdims=True) * 2, 0, 1)))
    fr *= 1 + 0.012 * math.sin(n * 2.1) + 0.008 * math.sin(n * 0.37)       # projector flicker
    fr *= smooth(t / 0.5) * smooth((DUR - t) / 0.45)
    return (np.clip(fr, 0, 1) * 255 + 0.5).astype(np.uint8)

if __name__ == "__main__":
    S = build(); build_caps()
    LT = [(a, b) for l, a, b, cx, cy, an in TX if cy == 245]
    for (a, b, src, o) in S:
        if any(x < b - 0.05 and y > a + 0.05 for x, y in LT): o["lab"] = True
    json.dump([dict(t0=round(a, 3), t1=round(b, 3)) for a, b, _, _ in S], open("scenes.json", "w"))
    if "--stills" in sys.argv:
        os.makedirs(OUT, exist_ok=True)
        for ts in sys.argv[sys.argv.index("--stills") + 1].split(","):
            f = render_frame(S, int(float(ts) * FPS)); cv2.imwrite(f"{OUT}/f_{float(ts):05.2f}.jpg", f[..., ::-1], [cv2.IMWRITE_JPEG_QUALITY, 88])
        sys.exit()
    a, b = int(sys.argv[4]), int(sys.argv[5])
    p = subprocess.Popen(["ffmpeg", "-y", "-v", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
                          "-c:v", "libx264", "-preset", "medium", "-crf", "15", "-pix_fmt", "yuv420p", "-g", "30", "-bf", "2",
                          "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709", OUT], stdin=subprocess.PIPE)
    for n in range(a, min(b, NF)):
        p.stdin.write(render_frame(S, n).tobytes())
    p.stdin.close(); p.wait()
