---
name: inm-writing
description: Use when writing, rewriting, optimizing, or fact-checking Innomad 一挪迈 Chinese articles. Supports global writing style and article-type presets, especially ETF 开箱, broker guides, AI tools, investment analysis, and digital nomad posts.
---

# Innomad Writing

Write and revise Innomad 一挪迈 articles with the local house style. This skill handles article text, structure, style, factual discipline, and table-image guidance. It does not generate covers, upload images, publish to platforms, or edit `/data/obsidian/30-Outputs`.

## Workflow

1. Read the user's request and target article if provided.
2. Load `references/global-style.md`. Preserve facts, mechanisms, and reasoned judgment; use a programmer's analytical discipline without importing programmer-facing concepts or decorative clever lines.
3. Select only the needed reference:
   - ETF 开箱 / ETF facts / ETF data updates: `references/article-types/etf-unboxing.md` and `references/fact-check/etf.md`
   - Finance table images: `references/table-images/finance-table-image.md`
4. Browse or use official/current sources for time-sensitive investment data. Do not rely on memory for current ETF data.
5. Write or revise the article while preserving the user's latest manual edits.
6. If the user asks for table images, generate local images, visually inspect them, then use `innomad-image-upload` for PicList upload and Markdown replacement.
7. For covers, use `inm-cover-image`; do not keep cover prompt rules here.

## Output Rules

- If the user asks to write, update, or rewrite a file, edit the target Markdown directly.
- If the user asks for planning, explanation, or review only, do not modify article files. For review, follow `inm-review`: show proposed changes first and create or update a reviewed file only after those changes are confirmed.
- Do not edit, delete, or rewrite anything under `/data/obsidian/30-Outputs`.
- For investment articles, include DYOR unless the existing article already has it.
- For facts and prices, use concrete dates and source names.
- Do not leave review notes, TODOs, or source-debug details in publishable article text.
