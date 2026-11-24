"""Makes the ShuddhVox launcher icons. Run from the repo root:  python3 resources/make_icons.py
Needs Pillow. Output goes to resources/android/mipmap-*/ and is copied into the Android project
by scripts/prepare-android.mjs during the APK build."""
import os, random
from PIL import Image, ImageDraw, ImageFilter

S = 1024
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)))
STOPS = [(0.0, (91, 43, 255)), (0.55, (255, 46, 147)), (1.0, (255, 159, 28))]  # violet -> pink -> orange


def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))


def gradient_bg():
    img = Image.new('RGB', (S, S))
    px = img.load()
    for y in range(S):
        for x in range(S):
            t = (x * 0.45 + y * 0.55) / S
            for k in range(len(STOPS) - 1):
                t0, c0 = STOPS[k]
                t1, c1 = STOPS[k + 1]
                if t <= t1 or k == len(STOPS) - 2:
                    px[x, y] = lerp(c0, c1, max(0.0, min(1.0, (t - t0) / (t1 - t0))))
                    break
    return img.convert('RGBA')


def art(frac):
    """Noise dots on the left, clean golden voice bars on the right, one sparkle. Fits a box of frac*S."""
    B = S * frac
    cx0, cy = S / 2, S / 2 + B * 0.03
    pitch = B / 7.3
    bw = pitch * 0.62
    rnd = random.Random(7)

    bars = Image.new('L', (S, S), 0)
    bd = ImageDraw.Draw(bars)
    heights = {2: 0.40, 3: 0.68, 4: 0.92, 5: 0.64, 6: 0.34}
    for i, h in heights.items():
        x = cx0 + (i - 3) * pitch
        hh = B * h * 0.86
        bd.rounded_rectangle([x - bw / 2, cy - hh / 2, x + bw / 2, cy + hh / 2], radius=bw / 2, fill=255)

    dots = Image.new('L', (S, S), 0)
    dd = ImageDraw.Draw(dots)
    for i, (count, spread) in {0: (7, 0.46), 1: (8, 0.66)}.items():
        x = cx0 + (i - 3) * pitch
        for _ in range(count):
            r = bw * rnd.uniform(0.16, 0.30)
            ox = rnd.uniform(-bw * 0.55, bw * 0.55)
            oy = rnd.uniform(-B * spread / 2, B * spread / 2)
            dd.ellipse([x + ox - r, cy + oy - r, x + ox + r, cy + oy + r], fill=215)

    grad = Image.new('RGBA', (S, S))
    gp = grad.load()
    top, bot = (255, 250, 225), (255, 204, 64)
    y0, y1 = int(cy - B * 0.5), int(cy + B * 0.5)
    for y in range(S):
        t = max(0.0, min(1.0, (y - y0) / max(1, y1 - y0)))
        c = lerp(top, bot, t) + (255,)
        for x in range(S):
            gp[x, y] = c

    out = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    shadow = Image.new('RGBA', (S, S), (40, 0, 90, 0))
    shadow.putalpha(bars.filter(ImageFilter.GaussianBlur(S * 0.012)).point(lambda v: int(v * 0.40)))
    out.alpha_composite(shadow, (0, int(S * 0.012)))
    out.paste(grad, (0, 0), bars)
    white = Image.new('RGBA', (S, S), (255, 255, 255, 255))
    out.paste(white, (0, 0), dots)

    # sparkle
    sx, sy, r = cx0 + B * 0.40, cy - B * 0.47, B * 0.115
    pts = []
    import math
    for k in range(8):
        ang = math.pi / 2 * (k / 2) - math.pi / 2
        rad = r if k % 2 == 0 else r * 0.30
        a = (math.pi / 4) * k - math.pi / 2
        pts.append((sx + rad * math.cos(a), sy + rad * math.sin(a)))
    ImageDraw.Draw(out).polygon(pts, fill=(255, 255, 255, 255))
    return out


def rounded_mask(radius_frac):
    m = Image.new('L', (S, S), 0)
    ImageDraw.Draw(m).rounded_rectangle([0, 0, S - 1, S - 1], radius=int(S * radius_frac), fill=255)
    return m


def circle_mask():
    m = Image.new('L', (S, S), 0)
    ImageDraw.Draw(m).ellipse([0, 0, S - 1, S - 1], fill=255)
    return m


def save(img, size, path):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    img.resize((size, size), Image.LANCZOS).save(path, optimize=True)


bg = gradient_bg()
fg_adaptive = art(0.56)                 # adaptive icon: stays inside the 66dp safe zone
legacy_art = art(0.66)

square = bg.copy()
square.alpha_composite(legacy_art)
square.putalpha(rounded_mask(0.22))
round_ = bg.copy()
round_.alpha_composite(art(0.60))
round_.putalpha(circle_mask())

DENS = {'mdpi': (48, 108), 'hdpi': (72, 162), 'xhdpi': (96, 216), 'xxhdpi': (144, 324), 'xxxhdpi': (192, 432)}
for d, (legacy, adaptive) in DENS.items():
    base = os.path.join(OUT, 'android', 'mipmap-' + d)
    save(square, legacy, os.path.join(base, 'ic_launcher.png'))
    save(round_, legacy, os.path.join(base, 'ic_launcher_round.png'))
    save(fg_adaptive, adaptive, os.path.join(base, 'ic_launcher_fg.png'))
    save(bg, adaptive, os.path.join(base, 'ic_launcher_bg.png'))

store = bg.copy()
store.alpha_composite(art(0.66))
save(store, 512, os.path.join(OUT, 'play-store-icon-512.png'))
print('icons written')
