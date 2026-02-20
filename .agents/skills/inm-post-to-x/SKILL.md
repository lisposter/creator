---
name: inm-post-to-x
description: 将 Markdown 文章转换为 X Article 富文本并复制到剪贴板，图片用【文件名】占位方便手动插入。当用户提到「发布到 X」「发 X Article」「post to X」时使用。
---

# Post to X (手动发布)

将 Markdown 文章转换为 X Article 格式的富文本，复制到剪贴板后手动粘贴发布。图片用占位符标记，方便手动插入。

## Script Directory

**Agent Execution Instructions**:
1. Determine this SKILL.md file's directory path as `SKILL_DIR`
2. Script path = `${SKILL_DIR}/scripts/<script-name>.ts`

**Script Reference**:
| Script | Purpose |
|--------|---------|
| `scripts/md-to-html.ts` | Markdown → HTML 转换（图片用占位符） |
| `scripts/copy-to-clipboard.ts` | 复制富文本到剪贴板 |

## 使用方式

### X Article（长文）

```bash
# Step 1: 转换 markdown 为 HTML，保存到临时文件
npx -y bun ${SKILL_DIR}/scripts/md-to-html.ts article.md --save-html /tmp/x-article.html

# Step 2: 复制富文本到剪贴板
npx -y bun ${SKILL_DIR}/scripts/copy-to-clipboard.ts html --file /tmp/x-article.html
```

执行后会输出：
- 文章标题
- 封面图路径（如有）
- 图片占位符列表及对应文件路径
- 富文本已复制到剪贴板的确认

### 短推文

短推文不需要脚本，直接构思文案即可。

## 工作流程

```
Markdown 文件
    │
    ▼
md-to-html.ts（转换）
    │  - 提取标题、封面
    │  - Markdown → HTML
    │  - 图片 → 【文件名】占位符
    │  - 不下载远程图片
    │
    ▼
copy-to-clipboard.ts（复制）
    │  - HTML 富文本复制到剪贴板
    │
    ▼
手动操作：
    1. 打开 x.com/compose/articles
    2. 填写标题
    3. Cmd+V 粘贴正文
    4. 找到【文件名】占位符，手动插入对应图片
    5. 上传封面图（如有）
    6. 预览并发布
```

## 图片处理

- 所有图片（本地和远程）统一替换为 `【文件名】` 格式的占位符
- 示例：`![示意图](imgs/chart.png)` → 正文中显示为 `【chart.png】`
- 示例：`![](https://example.com/photo.jpg)` → 正文中显示为 `【photo.jpg】`
- 转换完成后会输出完整的图片清单，列出每个占位符对应的原始路径

## Markdown 支持格式

| Markdown | HTML 输出 |
|----------|-----------|
| `# H1` | 仅作标题提取，不出现在正文 |
| `## H2` - `###### H6` | `<h2>` |
| `**bold**` | `<strong>` |
| `*italic*` | `<em>` |
| `[text](url)` | `<a href>` |
| `> quote` | `<blockquote>` |
| `` `code` `` | `<code>` |
| ```` ``` ```` | `<blockquote>`（X 不支持代码块） |
| `- item` | `<ul><li>` |
| `1. item` | `<ol><li>` |
| `![](img)` | 【文件名】占位符 |

## Frontmatter

| 字段 | 说明 |
|------|------|
| `title` | 文章标题（或取第一个 H1） |
| `cover_image` / `cover` | 封面图路径或 URL |

## 注意事项

- X Article 需要 X Premium 订阅
- 粘贴时 X 编辑器可能会调整部分格式，粘贴后检查一下
- 图片需手动逐个插入，按照占位符列表操作即可
