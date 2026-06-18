# Content Workflow Spec

This spec is superseded by the current split-skill workflow.

Active responsibilities:

- Writing and rewriting: `inm-writing`
- Review and fact-check: `inm-review`
- Cover generation: `inm-cover-image`
- Image upload: `innomad-image-upload`
- Multi-platform distribution: `inm-distribute`
- X publishing: `inm-post-to-x`
- Blog publishing: `inm-post-to-blog`

## Blog Publishing

`inm-post-to-blog` is the current innomad.io publishing entry point.

Frontmatter contract:

- Required: `title`, `slug`, `date`
- Common generated fields: `summary`, `category`, `tags`
- Defaults: `tier: free`, `price: 0`, `draft: false`, `pinned: false`
- Paired fields: `series` and `seriesOrder`

Publishing rules:

- Missing or changed frontmatter must be proposed first.
- The source Markdown file is not mutated until the user confirms the proposal.
- `summary` is the local authoring field; publish-core maps it to `description`.
- `cover_image` / `coverImage` are accepted as cover aliases.
- If `authors` is omitted, the Web Publish API uses the site author, currently `一挪迈`.
- Publish sequence is: prepare frontmatter -> confirm -> write source frontmatter -> Publish API validate -> Publish API post -> verify D1/detail page/articles list.

Implementation details live in each skill's `SKILL.md` and `references/` files.
