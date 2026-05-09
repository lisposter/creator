---
name: inm-cover-image
description: Use when creating Innomad 一挪迈 blog or X Article cover images from Chinese Markdown articles, especially finance, ETF, broker tools, trading rules, AI tools, and digital nomad posts.
---

# Innomad Cover Image

Generate a native 5:2 raster cover image for Innomad 一挪迈 articles. The cover should feel like a former programmer explaining an investment system: rational, restrained, clean, and technically literate.

## Trigger

Use this skill when the user asks for:
- Innomad / 一挪迈 blog cover images
- 5:2 blog or X Article cover images
- Chinese finance / ETF / broker / AI article cover art
- A cover generated from a Markdown article path or pasted Markdown

## Workflow

1. Read the provided Markdown article, including frontmatter.
2. Internally analyze `title`, `summary`, `category`, `tags`, and the article's core mechanism or argument.
3. Output only a compact content proposal and wait for user confirmation.
4. After confirmation, generate one raster image using the image generation tool. Do not use SVG, HTML canvas, Mermaid, or code-rendered vector markup.

### Proposal Format

Before image generation, output exactly:

```markdown
**封面内容方案**
- brand: Innomad 一挪迈
- topic: ...
- anchor: ...
- subtitle: ...（高亮：...）
- 右侧图例: ...
```

Do not include analysis, candidate variants, or extra options.

## Text System

- `brand`: always `Innomad 一挪迈`.
- Brand position: upper-left content area, aligned with the title block, around 7-9% from left and 13-17% from top.
- Brand color: #FAFAF7, small-medium size, medium weight.
- Brand prefix: one short vertical tick only, #006E99 or #05A882, about brand text height. No logo, slash, chart, or multi-bar mark.
- `topic`: 8-16 Chinese characters, article category or series. Always #006E99. Above anchor, aligned left, smaller than anchor.
- `anchor`: 3-12 characters, the core product / ticker / tool / concept. Largest text, #FAFAF7, bold sans-serif, preferably one line.
- `subtitle`: 14-28 Chinese characters. #FAFAF7 body text with exactly one 4-10 Chinese character key phrase highlighted in #05A882. No background block, underline, border, or all-green sentence.

For OCA / IBKR 一取消全 articles, use:
- topic: `盈透订单教程`
- anchor: `OCA「一取消全」`
- subtitle: `好工具不替你做决定，只执行清醒时的决定`
- highlight: `清醒时的决定`

## Visual Rules

Hard constraints:
- Native 5:2 raster cover only. Target 1600x640 or equivalent.
- Dominant background must clearly read as offshore blue #004D6B, not black, purple, neon, or cyan.
- Main title must be the first visual center.
- Strong left typography, right-side concept diagram as secondary support only.
- Right-side visual region: 64-92% x-axis, total width under 30% of image width.
- Right-side visual must be obviously smaller than the left title area.
- No right-side frame, panel, card, bounding box, rounded rectangle container, dashboard panel, or translucent large rectangle.
- No decorative long horizontal/vertical/top/bottom/corner lines.
- No scattered blue or green lines except necessary professional diagram connectors.
- Important text must be clear and readable; avoid garbled Chinese, fake UI text, and tiny unreadable labels.

Style:
- Type: typography + conceptual.
- Rendering: polished digital raster illustration, precise edges, restrained lines, subtle depth, local soft glow.
- Mood: balanced / subtle.
- No stockbroker ad, course poster, trading-group promo, cyberpunk neon, rockets, coin rain, dollar explosions, bull-bear battle, or huge K-line.

Color semantics:
- Positive / filled / output: #05A882.
- Risk / warning: muted red or orange only when necessary.
- Canceled / weakened / non-main path: low-opacity blue-gray.
- Topic: always #006E99.
- Main text: #FAFAF7.

Brand/product handling:
- Product names, company names, and tickers may appear as small text labels.
- Do not invent official logos or imply sponsorship.
- Do not make any external brand mark the visual protagonist.

## Layout

Left text area:
- Occupies roughly x 7-58%.
- Brand at top, topic above anchor, subtitle below anchor.
- Left-aligned text, vertically centered as a block, with generous breathing room.

Right concept diagram:
- Compact, unframed, floating on the background.
- Use only one core mechanism, at most one main node plus 2-4 auxiliary nodes.
- Allowed: small modular nodes, status dots, fine connectors, check/x symbols, low-contrast dot/grid texture, subtle glow/shadow.
- The main right-side node should have a restrained premium glow, preferably #05A882 or desaturated cyan-blue.
- Reduce labels if text reliability is risky.

## Content Mapping

Do not draw literal objects from the article. Draw the mechanism behind it.

- System: modules, nodes, relationships.
- Process: path, stages, arrows.
- Risk control: boundary, valve, protection layer, weakened branch.
- Comparison: two objects, trade-off scale.
- Portfolio: hierarchy, weight, distribution.
- Tool tutorial: abstract operation panel, not real UI.
- Rule execution: state machine, trigger, condition nodes.

If article is about orders, broker tools, trading rules, or risk management:
- Use an abstract order-rule system diagram.
- One highlighted filled order node, 2-3 low-opacity canceled nodes.
- Fine lines show same rule group.
- Check = filled, x = canceled.
- Filled node gets mint-green glow; canceled nodes are desaturated blue-gray.
- Do not draw real IBKR UI or a huge IBKR logo.

If article is about ETF, stocks, funds, or asset allocation:
- Use a small investment mechanism diagram.
- Show assets, cash flow, risk, return, or weights as small nodes with few connectors.
- Avoid huge K-lines or full dashboards.

## Background

- Base: #004D6B.
- Allowed depth: #00384F, #003247, #005B7A.
- Add subtle financial/system texture at 4-10% opacity: faint K-line outline, volume bars, return curve, volatility curve, dot matrix, grid, or system connection texture.
- Put texture in background, bottom, right-bottom, or edges. It must not compete with the title.

## Image Generation Prompt Requirements

When generating, include these constraints in the image prompt:

```text
Native 5:2 raster blog cover, 1600x640 composition. Dominant offshore blue #004D6B background. Strong left typography. Compact unframed right-side concept diagram under 30% width. No SVG, no vector markup, no code-rendered image. No right-side frame, panel, card, bounding box, rounded rectangle container, dashboard panel, or decorative bars. No fake UI screenshots. Clear readable Chinese text.

Brand text: "Innomad 一挪迈" with one short vertical tick before it.
Topic text: "[topic]" in #006E99.
Anchor text: "[anchor]" in #FAFAF7, largest visual element.
Subtitle text: "[subtitle]" with only "[highlight]" in #05A882 and the rest in #FAFAF7.
Right-side visual: [mechanism diagram description].
Subtle low-opacity financial/system background texture, restrained polished digital raster illustration, rational finance-tech editorial style.
```

## Output Discipline

- Before confirmation: proposal only.
- After confirmation: generate one image directly.
- Do not provide candidates unless the user explicitly asks.
- Do not ask the user to fill variables.
- Do not output internal analysis.
