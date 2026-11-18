"""
Bande-son originale de la vidéo de pitch, synthétisée (aucun sample externe, libre de droits).
104 s, 120 BPM, la mineur : nappe d'intro, montée, impact sur l'apparition du logo,
groove électro-pop léger (kick, clap, charleston, basse, arpèges), souffles sur chaque transition.
Usage : python3 marketing/music.py marketing/build/music.wav
"""
import sys
import wave
import numpy as np

SR = 44100
DUR = 104.0
BPM = 120
BEAT = 60 / BPM
N = int(SR * DUR)
WIPES = [7.2, 15.2, 22, 32, 42, 50, 64.5, 75, 82.5, 96]
DROP = 15.2          # apparition du logo : entrée du groove
OUTRO = 96.0         # écran de fin
rng = np.random.default_rng(7)
L = np.zeros(N)
R = np.zeros(N)
WL = np.zeros(N)   # bus envoyé dans la réverbération (nappes, arpèges)
WR = np.zeros(N)


def hz(midi):
    return 440.0 * 2 ** ((midi - 69) / 12)


def add(sig, t, gain=1.0, pan=0.0, wet=False):
    i = int(t * SR)
    if i >= N:
        return
    sig = sig[: N - i]
    l = sig * gain * np.sqrt((1 - pan) / 2) * 1.414
    r = sig * gain * np.sqrt((1 + pan) / 2) * 1.414
    L[i:i + len(sig)] += l
    R[i:i + len(sig)] += r
    if wet:
        WL[i:i + len(sig)] += l
        WR[i:i + len(sig)] += r


def lowpass(x, cutoff):
    """Passe-bas d'ordre 1, appliqué dans le domaine fréquentiel (rapide, sans dépendance)."""
    n = len(x)
    nfft = 1 << (n - 1).bit_length()
    f = np.fft.rfftfreq(nfft, 1 / SR)
    h = 1 / np.sqrt(1 + (f / cutoff) ** 2)
    return np.fft.irfft(np.fft.rfft(x, nfft) * h, nfft)[:n]


def saw(f, n, harmonics=None):
    t = np.arange(n) / SR
    h = harmonics or max(1, int(min(40, 9000 / f)))
    out = np.zeros(n)
    for k in range(1, h + 1):
        out += np.sin(2 * np.pi * f * k * t) / k
    return out * 0.55


def env_adsr(n, a=0.01, d=0.1, s=0.7, r=0.2):
    e = np.ones(n) * s
    na, nd, nr = int(a * SR), int(d * SR), int(r * SR)
    na = min(na, n)
    e[:na] = np.linspace(0, 1, na)
    if na + nd < n:
        e[na:na + nd] = np.linspace(1, s, nd)
    if nr < n:
        e[-nr:] *= np.linspace(1, 0, nr)
    return e


# ── grille d'accords : Am – F – C – G (une mesure de 4 temps chacun)
CHORDS = [[57, 60, 64], [53, 57, 60], [48, 55, 60, 64], [55, 59, 62]]
BAR = 4 * BEAT


def chord_at(t):
    return CHORDS[int(t / BAR) % 4]


# ── nappe (pad) : saw désaccordées, attaque lente, filtrée
def pad(t0, t1, gain):
    t = t0
    while t < t1:
        n = int(BAR * SR)
        notes = chord_at(t)
        sig = np.zeros(n)
        for m in notes:
            for det in (-0.07, 0.07):
                sig += saw(hz(m + 12) * (1 + det / 100 * 12), n, harmonics=8)
        sig = sig / len(notes) * env_adsr(n, a=0.6, d=0.2, s=0.9, r=0.6)
        add(sig, t, gain, pan=-0.2, wet=True)
        add(sig * 0.9, t + 0.012, gain, pan=0.25, wet=True)
        t += BAR


# ── percussions
def kick():
    n = int(0.45 * SR)
    t = np.arange(n) / SR
    f = 45 + 95 * np.exp(-t * 28)
    ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) * np.exp(-t * 7.5) + 0.25 * rng.standard_normal(n) * np.exp(-t * 180)


def clap():
    n = int(0.3 * SR)
    t = np.arange(n) / SR
    noise = rng.standard_normal(n)
    noise = noise - lowpass(noise, 900)
    e = np.exp(-t * 22) + 0.6 * np.exp(-np.maximum(t - 0.012, 0) * 30) * (t > 0.012)
    return noise * e * 0.5


def hat(open_=False):
    n = int((0.18 if open_ else 0.05) * SR)
    t = np.arange(n) / SR
    noise = rng.standard_normal(n)
    noise = lowpass(noise - lowpass(noise, 6000), 11000)
    return noise * np.exp(-t * (18 if open_ else 70)) * 0.22


def pluck(m, dur=0.35):
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = hz(m)
    s = sum(np.sin(2 * np.pi * f * k * t) * np.exp(-t * (6 + k * 5)) / k for k in range(1, 7))
    return s * 0.5


def bass(m, dur):
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = hz(m)
    s = np.sin(2 * np.pi * f * t) + 0.35 * np.sin(2 * np.pi * 2 * f * t) + 0.12 * np.sin(2 * np.pi * 3 * f * t)
    return s * env_adsr(n, a=0.005, d=0.12, s=0.75, r=0.05)


def whoosh(center, length=0.9, up=True):
    n = int(length * SR)
    t = np.linspace(0, 1, n)
    noise = rng.standard_normal(n)
    # balayage spectral : on module le filtrage par fondu entre bruit filtré bas et haut
    low = lowpass(noise, 700)
    high = noise - lowpass(noise, 2500)
    mix = (t if up else 1 - t)
    s = low * (1 - mix) + high * mix
    e = np.sin(np.pi * t) ** 2
    add(s * e * 0.22, center - length / 2, 1.0, pan=-0.4)
    add(s[::-1] * e * 0.22, center - length / 2, 1.0, pan=0.4)


def impact(t0):
    n = int(2.5 * SR)
    t = np.arange(n) / SR
    boom = np.sin(2 * np.pi * (38 + 60 * np.exp(-t * 6)) * t) * np.exp(-t * 2.2)
    noise = rng.standard_normal(n)
    tail = lowpass(noise, 1500) * np.exp(-t * 2.8) * 0.5
    add(boom * 0.9 + tail, t0, 1.0)


def riser(t0, t1):
    n = int((t1 - t0) * SR)
    t = np.linspace(0, 1, n)
    noise = rng.standard_normal(n)
    s = noise - lowpass(noise, 1200)
    tone = np.sin(2 * np.pi * np.cumsum(200 + 1600 * t ** 2) / SR) * 0.15
    add((s * 0.25 + tone) * t ** 2.2, t0, 0.8)


# ── arrangement
pad(0, DROP + BAR, 0.16)                         # intro
pad(DROP, OUTRO, 0.10)                           # nappe discrète sous le groove
pad(OUTRO - 0.3, DUR, 0.16)                      # outro
# battement sourd pendant l'accroche et le problème
for b in np.arange(0, DROP - 1, 2 * BEAT):
    add(kick() * 0.55, b + 0.0, 0.6)
# charleston léger pendant le problème
for b in np.arange(7.2, DROP - 0.5, BEAT / 2):
    add(hat(), b, 0.35, pan=0.3)
riser(DROP - 2.6, DROP)
impact(DROP)

# groove principal
t = DROP
step = 0
while t < OUTRO - 0.05:
    beat_in_bar = step % 4
    add(kick(), t, 0.9)
    if beat_in_bar in (1, 3):
        add(clap(), t, 0.55, pan=0.05)
    add(hat(), t + BEAT / 2, 0.5, pan=0.35)
    if step % 8 == 7:
        add(hat(True), t + BEAT / 2, 0.35, pan=0.35)
    # basse : fondamentale, croches décalées
    root = chord_at(t)[0] - 12
    add(bass(root, BEAT * 0.45), t + BEAT / 2, 0.42)
    add(bass(root, BEAT * 0.3), t, 0.25)
    # arpèges (à partir du styliste IA, plus présents)
    notes = chord_at(t)
    arp_gain = 0.10 if t < 50 else 0.15
    for k in range(4):
        m = notes[(step * 4 + k) % len(notes)] + 12
        add(pluck(m), t + k * BEAT / 4, arp_gain, pan=(-0.5 if k % 2 else 0.5), wet=True)
    t += BEAT
    step += 1

# souffles sur chaque transition, impact plus léger à l'écran de fin
for w in WIPES:
    whoosh(w, 0.9, up=True)
impact(OUTRO)
for k, m in enumerate([69, 72, 76, 81]):
    add(pluck(m, 2.0), OUTRO + k * 0.12, 0.18, pan=(k - 1.5) / 3, wet=True)

# ── réverbération (convolution avec une réponse impulsionnelle synthétique)
ir_n = int(1.8 * SR)
ir_t = np.arange(ir_n) / SR
ir = rng.standard_normal(ir_n) * np.exp(-ir_t * 3.2)
ir = lowpass(ir, 5000)
ir /= np.sqrt(np.sum(ir ** 2))


def conv(x, h):
    m = len(x) + len(h) - 1
    nfft = 1 << (m - 1).bit_length()
    return np.fft.irfft(np.fft.rfft(x, nfft) * np.fft.rfft(h, nfft), nfft)[: len(x)]


ir2 = np.roll(ir, int(0.013 * SR))
L = L + 0.35 * conv(WL, ir)
R = R + 0.35 * conv(WR, ir2)
L = lowpass(L, 15000)
R = lowpass(R, 15000)

# fondu final et normalisation douce
fade = np.ones(N)
fn = int(2.5 * SR)
fade[-fn:] = np.linspace(1, 0, fn) ** 1.5
fin = int(0.5 * SR)
fade[:fin] = np.linspace(0, 1, fin)
L *= fade
R *= fade
mix = np.stack([L, R], axis=1)
mix = np.tanh(mix * 1.1) / np.tanh(1.1)          # saturation légère
mix *= 0.89 / np.max(np.abs(mix))                 # crête à -1 dBFS
out = sys.argv[1] if len(sys.argv) > 1 else "music.wav"
with wave.open(out, "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((mix * 32767).astype("<i2").tobytes())
print("bande-son écrite :", out, f"{DUR:.0f} s")
