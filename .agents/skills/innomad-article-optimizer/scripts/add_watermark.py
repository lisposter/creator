#!/usr/bin/env python3
"""Add tiled diagonal watermark to images using Pillow."""

import sys
import math
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

WATERMARK_TEXT = "Innomad 一挪迈（X: @innomad_io）"
ANGLE = 30
OPACITY = 25  # ~10% of 255, very subtle

# CJK font paths (macOS)
FONT_PATHS = [
    "/Library/Fonts/Arial Unicode.ttf",
    "/System/Library/Fonts/STHeiti Medium.ttc",
    "/System/Library/Fonts/PingFang.ttc",
]


def get_font(size):
    for fp in FONT_PATHS:
        try:
            return ImageFont.truetype(fp, size)
        except (OSError, IOError):
            continue
    return ImageFont.load_default()


def add_watermark(input_path, output_path):
    img = Image.open(input_path).convert("RGBA")
    w, h = img.size
    font_size = max(24, w // 30)
    font = get_font(font_size)

    # Measure text
    dummy = Image.new("RGBA", (1, 1))
    dd = ImageDraw.Draw(dummy)
    bbox = dd.textbbox((0, 0), WATERMARK_TEXT, font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]

    pad_x = int(tw * 1.2)   # sparse horizontal spacing
    pad_y = int(th * 5.0)   # sparse vertical spacing

    # Create larger canvas for rotation
    diag = int(math.sqrt(w * w + h * h))
    canvas_size = diag * 2
    txt_layer = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(txt_layer)

    # Tile text across canvas
    y = 0
    while y < canvas_size:
        x = 0
        while x < canvas_size:
            draw.text((x, y), WATERMARK_TEXT, font=font, fill=(120, 120, 120, OPACITY))
            x += tw + pad_x
        y += th + pad_y

    # Rotate
    txt_layer = txt_layer.rotate(ANGLE, expand=False, resample=Image.BICUBIC)

    # Crop to image size from center
    cx, cy = txt_layer.size[0] // 2, txt_layer.size[1] // 2
    left = cx - w // 2
    top = cy - h // 2
    txt_layer = txt_layer.crop((left, top, left + w, top + h))

    # Composite
    result = Image.alpha_composite(img, txt_layer)
    result = result.convert("RGB")
    result.save(output_path, "PNG")
    print(f"Watermarked: {output_path}")


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(f"Usage: {sys.argv[0]} <input.png> <output.png>")
        sys.exit(1)
    input_path = sys.argv[1]
    output_path = sys.argv[2]
    add_watermark(input_path, output_path)
