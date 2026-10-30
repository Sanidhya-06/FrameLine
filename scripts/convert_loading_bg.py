"""Convert loading-bg.png to optimized WebP for desktop and mobile."""
from PIL import Image
import os

src = r'docs/reference/loading-bg.png'
out_dir = r'frontend/public/images'
os.makedirs(out_dir, exist_ok=True)

img = Image.open(src).convert('RGB')
w, h = img.size
print(f'Source: {w}x{h}  {os.path.getsize(src)//1024} KB')

# Desktop: 1920px wide
ratio = 1920 / w
desk = img.resize((1920, int(h * ratio)), Image.LANCZOS)
desk_path = os.path.join(out_dir, 'loading-bg.webp')
desk.save(desk_path, 'WEBP', quality=82, method=6)
print(f'Desktop WebP: {os.path.getsize(desk_path)//1024} KB')

# Mobile: scale to 820px wide, then centre-crop to ~820x1100
mob_w = 820
mob_h = int(mob_w * h / w)
mob = img.resize((mob_w, mob_h), Image.LANCZOS)
crop_h = min(mob_h, 1100)
top = (mob_h - crop_h) // 2
mob = mob.crop((0, top, mob_w, top + crop_h))
mob_path = os.path.join(out_dir, 'loading-bg-mobile.webp')
mob.save(mob_path, 'WEBP', quality=78, method=6)
print(f'Mobile  WebP: {os.path.getsize(mob_path)//1024} KB')
print('Done.')
