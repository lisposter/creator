---
name: inm-post-to-ghost
description: 将本地 Markdown 文章发布到 Ghost CMS。读取 frontmatter 获取元数据，支持创建和更新文章/页面。当用户提到「发布到 Ghost」「同步到 Ghost」「post to Ghost」「publish to Ghost」时使用。
---

# Post to Ghost

将本地 Markdown 文章通过 Ghost Admin API 发布到 Ghost CMS（innomad.io）。从 frontmatter 读取元数据（slug、tags、category 等），支持单篇发布和批量同步。

## Script Directory

**Agent Execution Instructions**:
1. Determine this SKILL.md file's directory path as `SKILL_DIR`
2. Script path = `${SKILL_DIR}/scripts/post-to-ghost.ts`

**Script Reference**:
| Script | Purpose |
|--------|---------|
| `scripts/post-to-ghost.ts` | 主脚本：读取 Markdown → 解析 frontmatter → 发布到 Ghost |

**Config Reference**:
| File | Purpose |
|------|---------|
| `config.yaml` | 源目录、默认字段值、可用 tags/categories 配置 |

## 环境变量

| 变量 | 说明 | 示例 |
|------|------|------|
| `GHOST_ADMIN_API_URL` | Ghost 站点 URL | `https://innomad.io` |
| `GHOST_ADMIN_API_KEY` | Ghost Admin API Key（格式 `id:secret`） | `64f8...a3:b7c9...f1` |

Agent 在执行前需确认这两个环境变量已设置。可通过 `echo $GHOST_ADMIN_API_URL` 检查。

## 使用方式

### 发布单篇文章

```bash
# 发布为草稿（默认）
npx -y bun ${SKILL_DIR}/scripts/post-to-ghost.ts /path/to/article.md

# 直接发布
npx -y bun ${SKILL_DIR}/scripts/post-to-ghost.ts /path/to/article.md --status published

# 强制更新已存在的文章
npx -y bun ${SKILL_DIR}/scripts/post-to-ghost.ts /path/to/article.md --force

# 发布并移动文件到归档目录
npx -y bun ${SKILL_DIR}/scripts/post-to-ghost.ts /path/to/article.md --move

# 预览模式（不实际发布）
npx -y bun ${SKILL_DIR}/scripts/post-to-ghost.ts /path/to/article.md --dry-run
```

### 列出源目录文章

```bash
npx -y bun ${SKILL_DIR}/scripts/post-to-ghost.ts --list
```

### 批量同步

```bash
# 同步源目录下所有文章
npx -y bun ${SKILL_DIR}/scripts/post-to-ghost.ts --sync

# 强制更新所有
npx -y bun ${SKILL_DIR}/scripts/post-to-ghost.ts --sync --force

# 预览同步
npx -y bun ${SKILL_DIR}/scripts/post-to-ghost.ts --sync --dry-run
```

## Frontmatter 字段映射

| Frontmatter 字段 | Ghost 字段 | 默认值 | 说明 |
|------------------|-----------|--------|------|
| `title` | `title` | 文件名 / H1 | 文章标题（frontmatter > H1 > 文件名） |
| `slug` | `slug` | 自动生成 | URL slug |
| `date` | `published_at` | — | 发布日期（ISO 格式） |
| `type` | post/page | `Post` | `Post` 或 `Page` |
| `status` | `status` | `draft` | `Published` → published，其余 → draft |
| `featured` | `featured` | `false` | 是否置顶 |
| `tags` | `tags` | `[]` | 标签列表 |
| `category` | `tags` (追加) | — | 分类，追加到 tags 末尾 |
| `tiers` | `tiers` + `visibility` | `[]` | 付费层级（非空时自动设 visibility 为 tiers） |
| `visibility` | `visibility` | `public` | `public` / `members` / `paid` / `tiers` |
| `summary` | `custom_excerpt` | — | 摘要（最长 300 字符，超出截断） |
| `cover_image` | `feature_image` | 默认封面 | **封面图 URL（优先使用）** |
| `cover` | `feature_image` (备选) | — | 备选封面（仅 cover_image 不存在时使用） |
| `password` | — | — | 不映射（Ghost 不支持） |
| `base` | — | — | Obsidian 模板引用，自动跳过 |

## 配置文件

配置文件位于 `${SKILL_DIR}/config.yaml`，包含：

- **source_dir**：文章源目录（相对项目根路径），默认 `data/obsidian/20-Workbench`
- **target_dir**：发布后归档目录（相对项目根路径），默认 `data/obsidian/30-Blog/innomad.io`
- **defaults**：各字段默认值
- **available_tags**：可用标签列表（用于参考）
- **available_categories**：可用分类列表
- **ghost**：Ghost 相关配置（域名替换、默认封面等）

## 工作流程

```
本地 Markdown 文件
    │
    ▼
解析 Frontmatter（提取 slug、tags 等）
    │
    ▼
处理正文（域名替换、Obsidian 语法清理）
    │
    ▼
转换为 Ghost Lexical 格式（Markdown Card）
    │
    ▼
Ghost Admin API
    ├─ 文章不存在 → 创建（POST /posts/）
    └─ 文章已存在 → 更新（PUT /posts/{id}/）或跳过
    │
    ▼
发布成功后（可选 --move）
    └─ 移动文件到 target_dir（默认 30-Blog/innomad.io）
```

## Agent 行为指南

发布成功后，**必须询问用户是否要将文件移动到归档目录**（`target_dir`）。如果用户确认，再执行带 `--move` 的命令或直接 `mv` 移动文件。

## 注意事项

- 文章默认以 **draft** 状态发布，需手动改为 published 或使用 `--status published`
- 已存在的文章（按 slug 匹配）默认跳过，使用 `--force` 强制更新
- Obsidian 双链语法 `[[...]]` 会自动清理为纯文本
- 内容使用 Ghost 的 Markdown Card（Lexical 格式），Ghost 端负责渲染
- 不依赖任何 npm 包，使用 Bun 原生 + Node.js 标准库
