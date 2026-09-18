#!/usr/bin/env python3
"""Overlay the fixed Innomad watermark without transforming the source raster."""

import argparse
import hashlib
import json
import struct
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageFont, PngImagePlugin

WATERMARK_TEXT = "Innomad一挪迈 /  innomad.com"
ANGLE = 22
COLOR = (112, 112, 112)
MARKER = "innomad_watermark"
FONT_PATHS = (
    "/System/Library/Fonts/Supplemental/Arial Unicode.ttf",
    "/Library/Fonts/Arial Unicode.ttf",
    "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc",
    "/usr/share/fonts/truetype/noto/NotoSansSC-Regular.ttf",
    "C:/Windows/Fonts/msyh.ttc",
)


def load_font(size, font_path=None, font_index=0):
    """Fail instead of silently substituting missing Chinese glyphs or bold text."""
    candidates = [str(font_path)] if font_path else FONT_PATHS
    for candidate in candidates:
        try:
            font = ImageFont.truetype(candidate, size, index=font_index)
            if font.getname()[1].lower() not in {"regular", "normal", "roman", "book"}:
                continue
            missing = font.getmask("\u0378")
            missing_shape = (missing.size, bytes(missing))
            if any(
                (glyph.size, bytes(glyph)) == missing_shape or not glyph.getbbox()
                for glyph in (font.getmask(char) for char in "一挪迈")
            ):
                continue
            return font
        except (OSError, ValueError):
            continue
    raise ValueError("需要支持简体中文的常规无衬线字体，请用 --font 指定字体文件。")


def render_stamp(font_size, font_path=None, font_index=0):
    # Supersample only the watermark, never the input image.
    scale = 4
    font = load_font(font_size * scale, font_path, font_index)
    bbox = font.getbbox(WATERMARK_TEXT)
    padding = 2 * scale
    stamp = Image.new("L", (bbox[2] - bbox[0] + padding * 2,
                            bbox[3] - bbox[1] + padding * 2))
    ImageDraw.Draw(stamp).text((padding - bbox[0], padding - bbox[1]),
                              WATERMARK_TEXT, font=font, fill=255)
    stamp = stamp.rotate(ANGLE, resample=Image.Resampling.BICUBIC, expand=True)
    stamp = stamp.resize((max(1, round(stamp.width / scale)),
                          max(1, round(stamp.height / scale))), Image.Resampling.LANCZOS)
    return stamp, str(font.path)


def tile_mask(size, stamp):
    width, height = size
    if stamp.width > width or stamp.height > height:
        raise ValueError("图片过小，无法在保持字号比例时完整放置水印。")
    mask = Image.new("L", size)
    positions = []
    for row in range(3):
        offset = (-0.008, 0.008, -0.008)[row] * width
        for col in range(3):
            x = round((col + 0.5) * width / 3 + offset - stamp.width / 2)
            y = round((row + 0.5) * height / 3 - stamp.height / 2)
            x = max(0, min(width - stamp.width, x))
            y = max(0, min(height - stamp.height, y))
            region = mask.crop((x, y, x + stamp.width, y + stamp.height))
            mask.paste(ImageChops.lighter(region, stamp), (x, y))
            positions.append((x, y, stamp.width, stamp.height))
    return mask, positions


def readability_mask(image, font_size, protect_boxes=()):
    """Heuristic edge/density protection; explicit boxes preserve pixels exactly."""
    edges = Image.new("L", image.size)
    for channel in image.convert("RGB").split():
        edges = ImageChops.lighter(edges, channel.filter(ImageFilter.FIND_EDGES))
    # Ignore artificial image-border responses from FIND_EDGES.
    ImageDraw.Draw(edges).rectangle((0, 0, image.width - 1, image.height - 1),
                                    outline=0, width=1)
    ink = edges.point(lambda value: 255 if value >= 28 else 0)
    ink = ink.filter(ImageFilter.MaxFilter(3))
    density = ink.filter(ImageFilter.BoxBlur(max(1, font_size / 2)))
    density = density.point(lambda value: min(210, value * 4))
    nearby = ink.filter(ImageFilter.GaussianBlur(max(1, font_size / 8)))
    protection = ImageChops.lighter(ink, ImageChops.lighter(density, nearby))
    keep = ImageChops.invert(protection)
    draw = ImageDraw.Draw(keep)
    for x, y, width, height in protect_boxes:
        if min(x, y) < 0 or min(width, height) <= 0 or x + width > image.width or y + height > image.height:
            raise ValueError("保护区域必须是图片范围内的 X,Y,WIDTH,HEIGHT。")
        draw.rectangle((x, y, x + width - 1, y + height - 1), fill=0)
    return keep


def png_metadata(source, provenance):
    info = PngImagePlugin.PngInfo()
    for key, value in getattr(source, "text", {}).items():
        if key != MARKER:
            info.add_text(key, value)
    # Keep color interpretation and physical resolution; do not color-convert.
    if "gamma" in source.info:
        info.add(b"gAMA", struct.pack(">I", round(source.info["gamma"] * 100000)))
    if "chromaticity" in source.info:
        info.add(b"cHRM", struct.pack(">8I", *(round(v * 100000) for v in source.info["chromaticity"])))
    if "srgb" in source.info:
        info.add(b"sRGB", bytes([source.info["srgb"]]))
    info.add_text(MARKER, json.dumps(provenance, ensure_ascii=False))
    options = {key: source.info[key] for key in ("icc_profile", "dpi", "exif") if key in source.info}
    options["pnginfo"] = info
    return options


def add_watermark(input_path, output_path, *, original_confirmed=False, opacity=0.11,
                  font_path=None, font_index=0, protect_boxes=()):
    if not original_confirmed:
        raise ValueError("先确认输入为无水印原图，再使用 --original-confirmed。不能在旧水印上叠加。")
    if not 0.10 <= opacity <= 0.12:
        raise ValueError("基础透明度必须在 0.10–0.12 之间。")
    source_path = Path(input_path).expanduser().resolve()
    requested_output = Path(output_path).expanduser()
    output = requested_output.resolve()
    if "30-Outputs" in requested_output.parts or "30-Outputs" in output.parts:
        raise ValueError("禁止写入 30-Outputs；请输出到 posts/{slug}/imgs/。")
    if output == source_path:
        raise ValueError("不得覆盖原图，请使用新的输出文件名。")
    if output.suffix.lower() != ".png":
        raise ValueError("最终输出必须使用 .png 扩展名。")
    if output.exists():
        raise ValueError("输出文件已存在，请使用新的文件名。")
    if source_path.stem.lower().endswith(("-watermarked", "_watermarked")):
        raise ValueError("输入文件名表明已经加过水印，请提供无水印原图。")
    source_bytes = source_path.read_bytes()
    # Pillow may decode a 16-bit RGB PNG as RGB8; reject before that data loss.
    if source_bytes.startswith(b"\x89PNG\r\n\x1a\n") and source_bytes[24] == 16:
        raise ValueError("暂不支持 16 位 PNG；不能为添加水印而降低原图位深。")
    with Image.open(source_path) as source:
        source.load()  # Also load PNG text chunks after IDAT.
        if MARKER in source.info:
            raise ValueError("检测到已有水印标记，请从无水印原图重新处理。")
        if getattr(source, "n_frames", 1) != 1:
            raise ValueError("暂不支持动画或多页图片；不能只保留其中一帧。")
        if source.mode not in {"1", "L", "LA", "P", "RGB", "RGBA"}:
            raise ValueError(f"不支持 {source.mode} 模式，不能改变原图色彩模式来处理。")
        bits = getattr(source, "tag_v2", {}).get(258, (8,))
        if isinstance(bits, int):
            bits = (bits,)
        if max(bits) > 8:
            raise ValueError("暂不支持高位深图片；不能降低原图位深。")
        font_size = max(1, round(min(source.size) * 0.03))
        stamp, font_used = render_stamp(font_size, font_path, font_index)
        raw_mask, positions = tile_mask(source.size, stamp)
        rgba = source.convert("RGBA")
        keep = readability_mask(rgba, font_size, protect_boxes)
        coverage = ImageChops.multiply(raw_mask, keep)
        coverage = ImageChops.multiply(coverage, rgba.getchannel("A").point(lambda a: 255 if a else 0))
        alpha = coverage.point(lambda value: round(value * opacity))
        if not alpha.getbbox():
            raise ValueError("保护区域覆盖了所有水印，无法有效添加；请检查原图和保护区域。")
        result = Image.composite(Image.new("RGB", source.size, COLOR), rgba.convert("RGB"), alpha)
        has_alpha = source.mode in {"LA", "RGBA"} or "transparency" in source.info
        if source.mode in {"1", "L", "LA"}:
            result = result.convert("L")
        if has_alpha:
            result.putalpha(rgba.getchannel("A"))
        provenance = {
            "version": 1, "text": WATERMARK_TEXT, "rows": 3, "columns": 3,
            "angle": ANGLE, "color": "#707070", "opacity": opacity,
            "font_size": font_size, "font": font_used, "positions": positions,
            "source_sha256": hashlib.sha256(source_bytes).hexdigest(),
        }
        options = png_metadata(source, provenance)
        # Exclusive creation prevents overwriting a concurrently created file.
        with output.open("xb") as handle:
            result.save(handle, "PNG", **options)
    return {"output": str(output), "size": result.size, **provenance}


def parse_box(value):
    try:
        box = tuple(int(part) for part in value.split(","))
        if len(box) != 4:
            raise ValueError
        return box
    except ValueError as error:
        raise argparse.ArgumentTypeError("使用 X,Y,WIDTH,HEIGHT（整数像素）。") from error


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input", help="无水印原图；不会覆盖或改动")
    parser.add_argument("output", help="新的 PNG 文件路径")
    parser.add_argument("--original-confirmed", action="store_true", help="已目视检查并确认输入没有旧水印")
    parser.add_argument("--opacity", type=float, default=0.11, help="基础透明度 0.10–0.12，默认 0.11")
    parser.add_argument("--font", help="支持中文的常规无衬线字体路径")
    parser.add_argument("--font-index", type=int, default=0, help="TTC 字体索引")
    parser.add_argument("--protect-box", type=parse_box, action="append", default=[],
                        help="完全保留此区域像素：X,Y,WIDTH,HEIGHT；可重复")
    args = parser.parse_args()
    try:
        report = add_watermark(args.input, args.output, original_confirmed=args.original_confirmed,
                               opacity=args.opacity, font_path=args.font, font_index=args.font_index,
                               protect_boxes=args.protect_box)
    except (ValueError, OSError) as error:
        parser.exit(1, f"Error: {error}\n")
    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
