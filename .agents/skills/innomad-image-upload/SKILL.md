---
name: innomad-image-upload
description: Uploads local images in markdown files to image hosting services (PicGo/PicList/Custom API) and replaces paths with remote URLs. Use when user mentions "上传图片", "upload images", "图片上传", or wants to replace local image paths with hosted URLs.
---

# Image Upload

Uploads local images referenced in markdown files to image hosting services and replaces local paths with remote URLs.

## Script Directory

Scripts in `scripts/` subdirectory. Replace `${SKILL_DIR}` with this SKILL.md's directory path.

| Script | Purpose |
|--------|---------|
| `scripts/main.ts` | Image upload CLI |

## Preferences (EXTEND.md)

Use Bash to check EXTEND.md existence (priority order):

```bash
# Check project-level first
test -f .innomad-skills/innomad-image-upload/EXTEND.md && echo "project"

# Then user-level (cross-platform: $HOME works on macOS/Linux/WSL)
test -f "$HOME/.innomad-skills/innomad-image-upload/EXTEND.md" && echo "user"
```

| Path | Location |
|------|----------|
| `.innomad-skills/innomad-image-upload/EXTEND.md` | Project directory |
| `$HOME/.innomad-skills/innomad-image-upload/EXTEND.md` | User home |

| Result | Action |
|--------|--------|
| Found | Read, parse, apply settings |
| Not found | Use defaults (PicGo on `http://127.0.0.1:36677/upload`) |

**EXTEND.md Supports**: Uploader backend | API endpoint | Custom headers | Response field mapping

### Supported Backends

| Backend | Description |
|---------|-------------|
| PicGo | Local PicGo App HTTP API (default `http://127.0.0.1:36677/upload`) |
| PicList | PicGo enhanced version, same API, supports URL param for target bed |
| Custom API | Custom HTTP API (POST multipart/form-data) |

## Usage

```bash
npx -y bun ${SKILL_DIR}/scripts/main.ts <input> [options]
```

## Options

| Option | Short | Description | Default |
|--------|-------|-------------|---------|
| `<input>` | | Markdown file or image file | Required |
| `--uploader` | `-u` | Backend: picgo, piclist, custom | picgo |
| `--api` | `-a` | API endpoint URL | `http://127.0.0.1:36677/upload` |
| `--dry-run` | `-d` | Preview mode (list images, no upload) | false |
| `--json` | | JSON output | false |

## Examples

```bash
# Upload all local images in a markdown file
npx -y bun ${SKILL_DIR}/scripts/main.ts article.md

# Specify backend
npx -y bun ${SKILL_DIR}/scripts/main.ts article.md --uploader picgo

# Preview mode (list images without uploading)
npx -y bun ${SKILL_DIR}/scripts/main.ts article.md --dry-run

# Upload a single image file (returns URL)
npx -y bun ${SKILL_DIR}/scripts/main.ts image.png

# JSON output
npx -y bun ${SKILL_DIR}/scripts/main.ts article.md --json
```

## Workflow

1. Parse markdown, extract all local image references (`![](path)` and `![[path]]`)
2. Check image files exist, filter out remote URLs (http/https)
3. Upload each image to configured backend
4. Replace local paths with remote URLs in markdown
5. Output upload result report

## Extension Support

Custom configurations via EXTEND.md. See **Preferences** section for paths and supported options.
