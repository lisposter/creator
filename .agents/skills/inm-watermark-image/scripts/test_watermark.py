"""Behavioral checks for content preservation and safe watermark application."""

import hashlib
import importlib.util
import json
import tempfile
import unittest
from pathlib import Path

from PIL import Image, ImageChops, ImageCms, ImageDraw, PngImagePlugin

SCRIPT = Path(__file__).with_name('add_watermark.py')
spec = importlib.util.spec_from_file_location('watermark', SCRIPT)
wm = importlib.util.module_from_spec(spec)
spec.loader.exec_module(wm)


class WatermarkTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.folder = Path(self.temp.name)
        self.source = self.folder / 'original.png'
        self.output = self.folder / 'result.png'
        Image.new('RGB', (900, 600), '#f5f2e8').save(self.source)

    def apply(self, **kwargs):
        return wm.add_watermark(self.source, self.output, original_confirmed=True, **kwargs)

    def test_source_unchanged_geometry_and_pixels_outside_watermark(self):
        before = self.source.read_bytes()
        report = self.apply()
        self.assertEqual(self.source.read_bytes(), before)
        with Image.open(self.source) as original, Image.open(self.output) as result:
            self.assertEqual(result.size, original.size)
            self.assertEqual(result.format, 'PNG')
            self.assertEqual(result.mode, original.mode)
            stamp, _ = wm.render_stamp(report['font_size'])
            mask, positions = wm.tile_mask(original.size, stamp)
            self.assertEqual(len(positions), 9)
            difference = ImageChops.difference(original, result)
            self.assertIsNotNone(difference.getbbox())
            # All differences must be within the actual letter coverage.
            outside = mask.point(lambda value: 255 if value == 0 else 0)
            self.assertIsNone(Image.composite(difference, Image.new('RGB', result.size), outside).getbbox())
            self.assertLessEqual(max(hi for lo, hi in difference.getextrema()), 17)
            marker = json.loads(result.info[wm.MARKER])
            self.assertEqual(marker['text'], 'Innomad一挪迈 /  innomad.com')
            self.assertEqual(marker['source_sha256'], hashlib.sha256(before).hexdigest())
            self.assertEqual(marker['font_size'], round(min(original.size) * .03))

    def test_three_by_three_complete_and_tilted_upward(self):
        for size in [(1000, 1000), (600, 1600), (1600, 600)]:
            stamp, _ = wm.render_stamp(round(min(size) * .03))
            _, positions = wm.tile_mask(size, stamp)
            for row in range(3):
                group = positions[row * 3:(row + 1) * 3]
                self.assertEqual(len({y for x, y, w, h in group}), 1)
                self.assertLess(group[0][0], group[1][0])
                self.assertLess(group[1][0], group[2][0])
            for x, y, width, height in positions:
                self.assertGreaterEqual(min(x, y), 0)
                self.assertLessEqual(x + width, size[0])
                self.assertLessEqual(y + height, size[1])
            coords = [(x, y) for y in range(stamp.height) for x in range(stamp.width)
                      if stamp.getpixel((x, y)) > 100]
            mean_x = sum(x for x, y in coords) / len(coords)
            mean_y = sum(y for x, y in coords) / len(coords)
            slope = sum((x - mean_x) * (y - mean_y) for x, y in coords) / sum((x - mean_x) ** 2 for x, y in coords)
            self.assertGreater(slope, -0.44)
            self.assertLess(slope, -0.36)

    def test_metadata_and_protected_region(self):
        profile = ImageCms.ImageCmsProfile(ImageCms.createProfile('sRGB')).tobytes()
        pnginfo = PngImagePlugin.PngInfo()
        pnginfo.add_text('Author', 'Innomad')
        pnginfo.add(b'gAMA', b'\x00\x00\xb1\x8f')
        image = Image.new('RGB', (900, 600), 'white')
        ImageDraw.Draw(image).text((20, 25), '12345 67.89%', font=wm.load_font(36), fill='black')
        image.save(self.source, dpi=(300, 300), icc_profile=profile, pnginfo=pnginfo)
        self.apply(protect_boxes=[(0, 0, 400, 250)])
        with Image.open(self.source) as original, Image.open(self.output) as result:
            self.assertEqual(result.info['icc_profile'], profile)
            self.assertEqual(result.info['Author'], 'Innomad')
            self.assertEqual(result.info['gamma'], original.info['gamma'])
            self.assertEqual(result.info['dpi'], original.info['dpi'])
            self.assertIsNone(ImageChops.difference(original.crop((0, 0, 400, 250)), result.crop((0, 0, 400, 250))).getbbox())

    def test_transparency_preserved(self):
        image = Image.new('RGBA', (900, 600), (180, 200, 230, 100))
        ImageDraw.Draw(image).rectangle((0, 0, 250, 599), fill=(23, 45, 67, 0))
        image.save(self.source)
        self.apply()
        with Image.open(self.output) as result:
            self.assertEqual(result.mode, 'RGBA')
            self.assertEqual(result.getchannel('A').tobytes(), image.getchannel('A').tobytes())
            self.assertEqual(result.crop((0, 0, 251, 600)).tobytes(), image.crop((0, 0, 251, 600)).tobytes())

    def test_dense_content_fades_and_protection_is_exact(self):
        image = Image.new('RGB', (900, 600), 'white')
        draw = ImageDraw.Draw(image)
        for y in range(160, 350, 7):
            draw.line((220, y, 650, y), fill='black', width=2)
        keep = wm.readability_mask(image, 18)
        self.assertEqual(keep.getpixel((60, 60)), 255)
        self.assertLess(keep.getpixel((420, 190)), 100)
        protected = wm.readability_mask(image, 18, [(40, 40, 150, 100)])
        self.assertEqual(protected.crop((40, 40, 190, 140)).getextrema(), (0, 0))

    def test_reapplication_rejected_after_rename(self):
        self.apply()
        renamed = self.folder / 'renamed.png'
        self.output.rename(renamed)
        with self.assertRaisesRegex(ValueError, '已有水印'):
            wm.add_watermark(renamed, self.output, original_confirmed=True)
        self.assertFalse(self.output.exists())

    def test_guards_leave_files_untouched(self):
        with self.assertRaisesRegex(ValueError, '先确认'):
            wm.add_watermark(self.source, self.output)
        with self.assertRaisesRegex(ValueError, '覆盖原图'):
            wm.add_watermark(self.source, self.source, original_confirmed=True)
        for opacity in [0.09, 0.13]:
            with self.assertRaisesRegex(ValueError, '透明度'):
                self.apply(opacity=opacity)
        with self.assertRaisesRegex(ValueError, '保护区域'):
            self.apply(protect_boxes=[(890, 0, 40, 40)])
        with self.assertRaisesRegex(ValueError, '所有水印'):
            self.apply(protect_boxes=[(0, 0, 900, 600)])
        for output in [self.folder / 'x.jpg', self.folder / '30-Outputs/x.png']:
            with self.assertRaises(ValueError):
                wm.add_watermark(self.source, output, original_confirmed=True)
        self.output.write_bytes(b'existing output')
        with self.assertRaisesRegex(ValueError, '已存在'):
            self.apply()
        self.assertEqual(self.output.read_bytes(), b'existing output')

    def test_grayscale_and_palette_colors(self):
        for mode in ['L', 'P']:
            image = Image.new(mode, (900, 600), 200)
            if mode == 'P':
                image.putpalette([v for i in range(256) for v in (i, 255 - i, i)])
            image.save(self.source)
            self.apply(protect_boxes=[(0, 0, 300, 200)])
            with Image.open(self.output) as result:
                self.assertEqual(result.convert('RGB').crop((0, 0, 300, 200)).tobytes(),
                                 image.convert('RGB').crop((0, 0, 300, 200)).tobytes())
            self.output.unlink()

    def test_unsupported_formats_not_silently_changed(self):
        Image.new('I;16', (100, 100), 50000).save(self.source)
        with self.assertRaisesRegex(ValueError, '16 位'):
            self.apply()
        cmyk = self.folder / 'cmyk.jpg'
        Image.new('CMYK', (100, 100)).save(cmyk)
        with self.assertRaisesRegex(ValueError, 'CMYK'):
            wm.add_watermark(cmyk, self.output, original_confirmed=True)
        animated = self.folder / 'animated.png'
        Image.new('RGB', (100, 100), 'white').save(animated, save_all=True,
            append_images=[Image.new('RGB', (100, 100), 'black')], duration=100)
        with self.assertRaisesRegex(ValueError, '动画'):
            wm.add_watermark(animated, self.output, original_confirmed=True)
        self.assertFalse(self.output.exists())


if __name__ == '__main__':
    unittest.main()
