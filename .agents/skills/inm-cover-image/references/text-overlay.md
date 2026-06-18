# Cover Text Overlay Rules

Use when the cover has Chinese title text, mixed Chinese/English title text, numbers, ticker symbols, broker names, or any phrase that must be exact.

## Principle

- Do not ask the image model to render final Chinese title text.
- Generate a no-text background first.
- Add exact title text locally with ImageMagick or an equivalent deterministic renderer.
- Final output must still be a single 5:2 raster image.

## Default Output

- Ratio: 5:2.
- Default size for tutorial handdrawn covers: 2500x1000.
- Default size for blog covers: 1600x640.
- Export PNG for local review; convert/upload as WebP when using PicList if needed.

## Chinese Title

- Preferred handwritten font on current macOS machine:
  `/System/Library/AssetsV2/PreinstalledAssetsV2/InstallWithOs/com_apple_MobileAsset_Font7/dad866cc4d34849677c7073ad9899f251bfcc1de.asset/AssetData/Hanzipen.ttc`
- If unavailable, pick a local Chinese handwriting or calligraphy font and note the fallback.
- Title color: white unless the preset says otherwise.
- Add subtle dark shadow only for readability, not as a visible effect.
- Break long Chinese titles manually into 2-3 balanced lines.
- Keep title near center / center-left unless the user asks otherwise.

## Visual Check

- Check exact text against the user-provided title.
- Check Chinese punctuation, slash `/`, plus `+`, ticker symbols, and English product names.
- Check no clipped strokes, no cropped descenders, no overlap with line art, and no text too close to canvas edge.
- If any text is wrong, fix locally; do not regenerate hoping the model writes better.
