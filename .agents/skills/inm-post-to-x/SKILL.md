---
name: inm-post-to-x
description: 将 Markdown 文章转换为 X Article 富文本并复制到剪贴板，准备本地插图和【文件名】占位，由用户手动发布；不操作 X 页面或账号。当用户提到「发布到 X」「发 X Article」「post to X」时使用。
---

# Post to X (手动发布)

将 Markdown 文章转换为 X Article 格式的富文本，复制到剪贴板后手动粘贴发布。图片用占位符标记，方便手动插入。

## 操作边界

- 「发布到 X」在本 skill 中指完成发布准备：富文本、本地插图和封面、正文占位、图片对应清单。
- 可以转换 HTML、下载文章已引用的远程图片副本、整理本地图片和复制富文本到剪贴板。
- **不打开或操作 X 编辑器，不代填标题、粘贴、插图、上传、保存草稿、提交或发布，也不调用 X 发布接口。** 页面操作全部由用户完成。
- 只做必要格式转换，保留已确认的事实、机制和判断，不为转换追加技术类比、金句或其他聪明话。
- 不修改源稿，不把准备完成标记成已经发布，不更新 `30-Outputs/` 中的任何文件。

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
- 远程图片本地副本路径（如有）
- 富文本已复制到剪贴板的确认

### 输入文件

优先使用 `/inm-distribute` 生成的 X 平台版本：

```bash
# 推荐：使用 distribute 生成的 X 版本
npx -y bun ${SKILL_DIR}/scripts/md-to-html.ts ${PROJECT_ROOT}/posts/{slug}/platforms/x.md --save-html /tmp/x-article.html

# 也支持直接使用源文章
npx -y bun ${SKILL_DIR}/scripts/md-to-html.ts /path/to/article.md --save-html /tmp/x-article.html
```

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
    │  - 下载远程图片副本到本地
    │
    ▼
copy-to-clipboard.ts（复制）
    │  - HTML 富文本复制到剪贴板
    │
    ▼
用户自行操作（助手到此完成交付）：
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
- 远程图片必须下载本地副本，默认保存到 `posts/{slug}/imgs/originals/`；如果无法识别 `slug`，保存到 `posts/manual-images/{article}/`
- 下载只创建本地副本，不修改输入 Markdown，不替换 reviewed/源稿中的远程链接
- 核对每个占位符对应的本地文件存在、能打开；清单按正文顺序列出占位符、插入位置和绝对路径。不同图片重名时在工作副本中去重命名，确保不会插错。
- 封面单列，不能把正文首张插图误当封面后从正文中漏掉；转换后核对正文插图数量与位置。
- 若文章含表格，按 `inm-writing` 的表格图片规则准备本地图表，或在不损失信息时转为列表；需要转换的内容在 `posts/{slug}/platforms/x.md` 工作副本中处理。
- 缺少的插图明确列出；任务包含制作配图时完成本地生成，不只给一个没有图片文件的占位符。无需为手动插入 X 而上传图床。

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

## 完成交付

完成转换和核对后，在回复中给出：

- 文章标题、富文本 HTML 文件链接，以及剪贴板是否已成功写入。
- 封面本地文件链接（如有）。
- 按正文顺序列出的 `【文件名】` → 插入位置 → 本地图片链接。
- 如仍有缺图或格式限制，明确列出，不宣称已经全部准备好。

报告使用「发布素材已准备好」，不写「已发布」。用户随后告知已发布时，确认收到即可，不自动操作 X 或回写源稿状态。

## 注意事项

- X Article 需要 X Premium 订阅
- 粘贴时 X 编辑器可能会调整部分格式，粘贴后检查一下
- 图片需手动逐个插入，按照占位符列表操作即可
