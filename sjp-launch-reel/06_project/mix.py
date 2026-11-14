import wave, numpy as np
from scipy.ndimage import uniform_filter1d
SR = 48000; N = int(59.5 * SR)
def rd(p, ch):
    w = wave.open(p); a = np.frombuffer(w.readframes(10**9), dtype=np.int16).astype(np.float32) / 32768; return a.reshape(-1, ch)
vo = rd('vo_proc.wav', 1)[:N, 0]; vo = np.pad(vo, (0, N - len(vo))); mu = rd('music.wav', 2)[:N]
vo = vo / np.abs(vo).max() * 0.95
act = uniform_filter1d((np.abs(vo) > 0.02).astype(np.float32), int(0.5 * SR)); act = np.clip(act * 3, 0, 1); act = uniform_filter1d(act, int(0.25 * SR))
duck = 1 - 0.62 * act                                   # music drops ~8.5 dB under speech
vrms = np.sqrt((vo[np.abs(vo) > 0.02] ** 2).mean()); mrms = np.sqrt((mu ** 2).mean())
x = np.tanh(np.stack([vo, vo], 1) * 0.9 + mu * (vrms / mrms) * 0.62 * duck[:, None])
w = wave.open('mix_pre.wav', 'wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.clip(x, -1, 1) * 32767).astype(np.int16).tobytes()); w.close()
