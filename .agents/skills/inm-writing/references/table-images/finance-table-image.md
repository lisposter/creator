# Finance Table Image Rules

Use when converting Markdown tables to images for X / WeChat / blog visual polish.

## Rules

- Prefer HTML + CSS rendering to image, then convert to WebP.
- Use fixed column widths.
- No rounded corners.
- No nested cards.
- Add enough outer margin.
- Add title, date/source note, and watermark.
- Keep typography large enough for mobile reading.
- Use versioned filenames to avoid CDN cache:
  - `{slug}-{table-name}-vYYYYMMDD.webp`
  - If replacing same-day after visible cache issue, add suffix such as `-v2`, `-foto`, or another meaningful version.

## Visual Style

- Clean editorial finance style.
- Neutral off-white / pale background unless the article's design system says otherwise.
- Restrained accent color.
- Header row should be clear.
- Avoid visual clutter, gradients, and decorative blobs.

## Required Visual Check

After generation, open the image and check:

- no clipped top / bottom;
- no footer cut;
- no text overlap;
- no column collision;
- no unreadably small text;
- no unexpected rounded corners;
- watermark visible but not dominant.

If any issue appears, regenerate before upload.

## Upload

Use `innomad-image-upload` with PicList.

After upload:

- Replace the Markdown table with the CDN image.
- Check the URL starts with `https://imgs.innomad.io/blog/`.
- Use a new filename when a browser/CDN cache keeps showing an old image.

## Article Text

Do not rely on the image alone. Before or after the image, keep a short prose explanation of what the table means.
