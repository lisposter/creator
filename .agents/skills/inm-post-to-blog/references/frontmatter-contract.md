# Innomad Publish Frontmatter Contract

Use this when completing, validating, or explaining publish frontmatter for `inm-post-to-blog`.

## Schema

```yaml
# required, no default
title: null
slug: null
date: null

# optional
summary: null
tier: free
price: 0
category: null
tags: []
cover: null
draft: false
pinned: false
series: null
seriesOrder: null
```

## Publish-Core Compatibility

- `summary` is accepted as an input alias for `description`.
- `cover_image` and `coverImage` are accepted as aliases for `cover` and `ogImage`.
- `og_image` is accepted as an alias for `ogImage`.
- If `authors` is omitted, the Web Publish API passes the site author from config. Current author: `一挪迈`.

## Required Fields

### `title`

- Preserve existing `title` exactly.
- If missing, infer from the first Markdown H1.
- If there is no H1, infer from filename and content.
- Always show the proposed title in the confirmation message.

### `slug`

- Preserve existing valid slugs.
- If missing, generate concise English lowercase kebab-case.
- Avoid generic slugs: `article`, `post`, `guide`, `notes`.
- For product/tutorial posts, include product and action, for example:
  - `thinkorswim-fractional-shares`
  - `schwab-w8-form-guide`
  - `etf-foto`

### `date`

- Preserve existing `date`.
- If missing, default to current `Asia/Shanghai` date as `YYYY-MM-DD`.
- If the article body explicitly declares a publication date, prefer that date and show it in confirmation.

## Optional Fields

### `summary`

- Preserve existing `summary`.
- If missing, generate one concrete Chinese sentence.
- Target length: 50-90 Chinese characters.
- Mention the article object and outcome.
- Avoid marketing copy.
- If existing `description` and `summary` conflict, stop and ask which one is canonical.

### `tier` and `price`

- Default `tier: free`.
- Valid tiers: `free`, `premium`, `paid`.
- Default `price: 0`.
- If `tier: paid`, `price` must be greater than 0. Stop before publishing if not.

### `category`

- Valid values: `finance`, `tech`, `nomad`, or `null`.
- Infer conservatively:
  - investing, ETF, broker, options, finance tools -> `finance`
  - AI, coding, automation, software, infra -> `tech`
  - relocation, travel, remote work, visas, global living -> `nomad`
- If not confident, leave `category: null` and ask for confirmation.

### `tags`

- Preserve existing tags.
- If missing, propose 2-5 lowercase tags.
- Remove category tags from normal tags if they duplicate `finance`, `tech`, or `nomad`.

### `cover`

- Preserve existing `cover`.
- If only `cover_image` exists, preserve `cover_image`; do not require adding `cover`.
- Do not invent image URLs.

### `draft`

- Default `false`.
- If `draft: true`, do not publish unless the user explicitly asks to publish anyway and the skill changes it to `false`.
- If source has `status: Draft`, treat it as Obsidian metadata unless the user says it should block publishing.

### `pinned`

- Default `false`.

### `series` and `seriesOrder`

- Preserve both when present.
- If only one is present, stop and ask for the missing counterpart.
- Do not invent series membership.

## Confirmation Gate

When frontmatter is incomplete or changed, show the proposed YAML and expected URL before writing or publishing.

Only after user confirmation:

1. Write the confirmed frontmatter back to the source file.
2. Run Publish API validate.
3. Run Publish API post.
4. Verify D1, detail page, and `/articles/`.

If the frontmatter is already complete and valid, confirmation is still required before publish unless the user explicitly asked to publish directly.

## Verification

After publish, verify:

- D1 row: `slug`, `title`, `date`, `category`, `authors`, `cover`, `description`.
- Detail page: HTTP 200, `<title>`, `og:title`, canonical URL, JSON-LD author.
- `/articles/`: expected slug appears when the article is not draft.
