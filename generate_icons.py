#!/usr/bin/env python3
"""
Generate PWA icons for Procurement Information System
Senaka Group – Navy + Gold theme
"""
from PIL import Image, ImageDraw, ImageFont
import os

SIZES = [72, 96, 128, 144, 152, 192, 384, 512]
OUT_DIR = 'icons'
os.makedirs(OUT_DIR, exist_ok=True)

NAVY = (10, 35, 66)
GOLD = (201, 168, 76)
WHITE = (255, 255, 255)

def draw_icon(size):
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    # Background circle
    margin = int(size * 0.04)
    d.ellipse([margin, margin, size - margin, size - margin], fill=NAVY)

    # Gold ring
    ring_w = max(2, int(size * 0.03))
    d.ellipse([margin + ring_w, margin + ring_w,
               size - margin - ring_w, size - margin - ring_w],
              outline=GOLD, width=ring_w)

    # "P" letter
    cx, cy = size // 2, size // 2
    font_size = int(size * 0.48)
    try:
        font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf', font_size)
    except:
        font = ImageFont.load_default()

    bbox = d.textbbox((0, 0), 'P', font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    tx = cx - tw // 2
    ty = cy - th // 2 - int(size * 0.02)
    d.text((tx, ty), 'P', fill=GOLD, font=font)

    # Small "IS" text below
    small_size = max(8, int(size * 0.14))
    try:
        small_font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', small_size)
    except:
        small_font = ImageFont.load_default()

    sbbox = d.textbbox((0, 0), 'IS', font=small_font)
    sw = sbbox[2] - sbbox[0]
    sx = cx - sw // 2
    sy = ty + th + int(size * 0.01)
    d.text((sx, sy), 'IS', fill=(255, 255, 255, 200), font=small_font)

    return img

for size in SIZES:
    icon = draw_icon(size)
    path = os.path.join(OUT_DIR, f'icon-{size}.png')
    icon.save(path, 'PNG')
    print(f'Created: {path}')

print('All icons generated!')
