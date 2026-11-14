# thumbnail + transparent graphics export. usage: extras.py <images> <fonts> <outdir>
import sys, numpy as np, cv2
import render as R
out = sys.argv[3]
def save_rgba(layer, path):
    a = np.clip(layer[..., 3:4], 1e-4, 1); rgb = np.clip(layer[..., :3] / a, 0, 1)
    cv2.imwrite(path, (np.dstack([rgb[..., ::-1], layer[..., 3:4]]) * 255).astype(np.uint8))
# thumbnail / cover
rv = R.grade(R.load("rigveda_ms"), "manuscript")
fr = R.Still(rv, 1.15, 1.15, (0.45, 0.4), (0.45, 0.4), dim=0.32).frame(0).astype(np.float32)
fr += R.rays(3.0, 0.5, 0.40, 0.35); fr += R.particles(2.0, 0.5)
R.blit(fr, R.dev("अपने ही धर्म को", 120, grad=(R.WHITE, (0.86, 0.8, 0.68)), glow=0.3), 540, 640)
R.blit(fr, R.dev("कितना जानते हैं?", 150, glow=0.6), 540, 830)
g = np.linspace(-1, 1, 700, dtype=np.float32); prof = (1 - np.abs(g) ** 3)[None, :, None]
fr[1009:1012, 190:890] = fr[1009:1012, 190:890] * (1 - prof) + np.array(R.GOLD_HI, np.float32) * prof
R.blit(fr, R.rom("SATYA JANTA PARTY", 60, 700, tracking=10, grad=R.GG, glow=0.3), 540, 1090)
R.blit(fr, R.rom("SATYA KO JAANO.  SATYA KO JIYO.", 32, 600, tracking=6, color=R.WHITE), 540, 1175)
fr *= R.VIG; fr += R.GRAIN[0][..., None] * 0.04
cv2.imwrite(f"{out}/thumbnail_1080x1920.jpg", (np.clip(fr, 0, 1) * 255).astype(np.uint8)[..., ::-1], [cv2.IMWRITE_JPEG_QUALITY, 93])
# transparent PNG graphics
G = {"logo_satya_devanagari": R.dev("सत्य", 380, glow=0.7), "logo_wordmark_roman": R.rom("SATYA JANTA PARTY", 72, 700, tracking=11, grad=R.GG, glow=0.3),
     "logo_wordmark_devanagari": R.dev("सत्य जनता पार्टी", 124, glow=0.5), "tagline": R.rom("SATYA KO JAANO.  SATYA KO JIYO.", 38, 600, tracking=6, color=R.WHITE),
     "title_ek_sawaal_hai": R.dev("एक सवाल है…", 150, glow=0.5), "title_kitna_jaante_hain": R.dev("कितना जानते हैं?", 132, glow=0.3),
     "title_1835": R.rom("1835", 330, 800, tracking=10, grad=R.GG, glow=0.5), "title_bas": R.devb("बस।", 360, color=R.WHITE, glow=0.25),
     "title_karmayog": R.dev("कर्मयोग", 190, glow=0.5), "title_follow": R.rom("FOLLOW", 170, 800, tracking=14, grad=R.GG, glow=0.6)}
for k, v in G.items(): save_rgba(v, f"{out}/{k}.png")
# logo lockup on transparent canvas
c = np.zeros((760, 1080, 4), np.float32)
def put(l, cy):
    h, w = l.shape[:2]; x = 540 - w // 2; y = cy - h // 2; reg = c[y:y + h, x:x + w]; reg *= (1 - l[..., 3:4]); reg += l
put(G["logo_satya_devanagari"], 240); put(G["logo_wordmark_roman"], 560); put(G["tagline"], 660)
c[478:481, 150:930, :3] = R.GOLD_HI; c[478:481, 150:930, 3] = 1
save_rgba(c, f"{out}/logo_lockup_temporary.png")
