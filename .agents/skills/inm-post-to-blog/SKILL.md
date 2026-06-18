---
name: inm-post-to-blog
description: Publish or update Innomad 一挪迈 Markdown articles to innomad.io through the Viblog Publish API. Use when the user asks to publish/update a local Markdown article, complete publishing frontmatter, validate Publish API readiness, or verify an already-published article on innomad.io.
---

# Innomad Post To Blog

Publish or update a local Markdown article through the current Viblog Publish API pipeline.

## Core Rule

Never publish when frontmatter changes are unconfirmed. If `prepare_frontmatter.ts` proposes any change, or even if the file is already valid, show the proposal and wait for explicit user confirmation before writing or publishing.

## Workflow

1. Resolve the Markdown file path.
2. Run prepare:

```bash
bun .agents/skills/inm-post-to-blog/scripts/prepare_frontmatter.ts /absolute/path/article.md
```

3. If the output has `blockingProblems`, stop and ask the user for the missing decision.
4. If frontmatter is missing, changed, ambiguous, or the user asks about the schema, read `references/frontmatter-contract.md`.
5. Show a concise confirmation block:

````markdown
将补全以下 frontmatter：

```yaml
title: ...
slug: ...
date: ...
summary: ...
tier: free
price: 0
category: finance
tags: [...]
cover: null
draft: false
pinned: false
series: null
seriesOrder: null
```

发布 URL 预计为：
https://innomad.io/<slug>/

确认后我会：
1. 写回源 Markdown frontmatter
2. 调用 Publish API validate/post
3. 验证 D1、详情页和文章列表
````

6. After confirmation, create a JSON payload with `confirmed: true`, `file`, and the exact confirmed `frontmatter`, then run:

```bash
bun .agents/skills/inm-post-to-blog/scripts/publish_article.ts --payload /tmp/inm-post-to-blog-payload.json
```

7. Verify:

```bash
bun .agents/skills/inm-post-to-blog/scripts/verify_publish.ts <slug>
```

8. Report URL, publish status, revisionId, title, category, author, verification summary, and whether source frontmatter changed.

## Environment

- Publish API: `PUBLISH_API_URL` and `PUBLISH_API_TOKEN`.
- Default `PUBLISH_API_URL`: `https://innomad.io`.
- Env loading order: shell env, `~/.env`, project `.env`, `.innomad-skills/inm-post-to-blog/.env`.
- Viblog root default: `/Users/innomad/lab/innomad-io/viblog`.
- Override Viblog root with `VIBLOG_ROOT` if the repo moves.

## File Rules

- Preserve the Markdown body exactly when writing frontmatter.
- Preserve unknown frontmatter fields where possible.
- Prefer `summary` for local authoring; publish-core maps it to `description`.
- Preserve `cover_image` if it is the only cover field.
- Reading external files is fine. Writing external files requires the normal Codex filesystem escalation.

## Failure Handling

- `tier: paid` with missing or non-positive `price`: stop before publishing.
- `series` without `seriesOrder`, or the reverse: stop before publishing.
- `draft: true`: do not publish unless the user explicitly confirms changing it to `false`.
- Publish API validation or conflict errors: stop and show the exact error. Use `force` only after user confirmation.
