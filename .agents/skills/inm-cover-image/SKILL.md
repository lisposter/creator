---
name: inm-cover-image
description: Use when creating or updating Innomad 一挪迈 blog or X Article cover images from Chinese Markdown articles, especially ETF 开箱, finance tutorials, broker tools, trading rules, AI tools, and digital nomad posts.
---

# Innomad Cover Image

Generate 5:2 raster cover images for Innomad 一挪迈 articles. This skill handles cover concept, visual preset selection, text accuracy, and final visual verification. It does not write article prose.

## Workflow

1. Read the Markdown article or user-provided title.
2. Load `references/global-cover-style.md`.
3. Select the needed preset:
   - ETF 开箱 / ETF article: `references/presets/etf-unboxing.md`
   - Broker / bank / thinkorswim / TOS / trading indicator tutorial: `references/presets/finance-tutorial-handdrawn.md`
4. If the cover contains Chinese text, mixed Chinese/English text, ticker symbols, or exact numbers, load `references/text-overlay.md`.
5. Produce a compact cover proposal unless the user explicitly asks to generate directly.
6. Generate one 5:2 raster cover.
7. Visually verify text, layout, theme, and cropping.
8. If requested, upload with `innomad-image-upload` and update `cover` / `cover_image` in frontmatter.

## Proposal Format

When a proposal is useful, output exactly:

```markdown
**封面内容方案**
- brand: Innomad 一挪迈
- topic: ...
- anchor: ...
- subtitle: ...（高亮：...）
- 右侧图例: ...
```

Do not include long analysis or extra variants unless the user asks.

## Output Rules

- Default cover ratio: 5:2.
- Default blog cover size: 1600x640.
- For finance tutorial handdrawn covers: 2500x1000 is acceptable.
- Main title / anchor must be the first visual center.
- If Chinese title accuracy matters, do not ask the image model to render final title text; generate a no-text background and add exact text locally.
- Final output must be a raster image, usually PNG or WebP.
- Do not invent official logos or imply sponsorship.
- Do not use fake UI screenshots.
- Do not leave unverified generated text in the image.
