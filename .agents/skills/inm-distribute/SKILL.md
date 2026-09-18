---
name: inm-distribute
description: 多平台内容分发：将审稿完成的文章转换为 Blog、X、小红书、公众号等平台格式，含风格优化。当用户提到「分发」「distribute」「生成X版本」「生成公众号版本」「生成小红书版本」时使用。
---

# 多平台分发 (Content Distribution)

将用户已确认的审稿文章转换为各平台适配版本，保留事实、机制和判断。源稿只读，生成文件保存在 `posts/{slug}/platforms/`。X 只准备富文本、插图和占位，页面操作由用户完成。

## 使用方法

```bash
/inm-distribute                         # 交互选择平台
/inm-distribute x                       # 指定平台
/inm-distribute x wechat                # 多个平台
/inm-distribute all                     # 全部平台
/inm-distribute 帮我生成 X 和公众号版本  # 自然语言
```

## Shell 命令规范

```bash
PROJECT_ROOT=$(git rev-parse --show-toplevel)
```

始终使用绝对路径，禁止 `cd` 后用相对路径。

## 工作流程

```
- [ ] Step 1: 定位源文章
- [ ] Step 2: 选择目标平台
- [ ] Step 3: 下载远程配图副本
- [ ] Step 4: 按平台生成内容
- [ ] Step 5: 核对并交付平台版本和图片
```

---

## Step 1: 定位源文章

### 搜索位置

优先使用用户指定的已确认稿件，包括 `10-Drafts/文章名_reviewed.md` 或 `posts/{slug}/article.md`。未指定时先查找 `10-Drafts/` 中已确认的 reviewed 稿；也可只读搜索已有归档：

```bash
find "${PROJECT_ROOT}/data/obsidian/30-Outputs/posts/" -maxdepth 1 -name "*.md" 2>/dev/null | sort -r | head -20
```

### 匹配规则

与 inm-review 相同（精确 → 模糊 → 列出选择）。

### 验证

源文章必须满足：
- 包含完整 frontmatter（title, slug, category, tags, status, platforms）
- `status` 为 `reviewed` 或 `ready`，或当前会话中用户已明确确认该版本。尚未确认的审稿修改不能通过分发提前生成完整修订稿；先按 `/inm-review` 展示建议并等待确认。
- `30-Outputs/` 仅作为只读来源，不回填 frontmatter、不替换链接、不移动文件。

从 frontmatter 提取 `slug`，确保工作目录存在：

```bash
SLUG="article-slug"
mkdir -p "${PROJECT_ROOT}/posts/${SLUG}/platforms"
mkdir -p "${PROJECT_ROOT}/posts/${SLUG}/imgs"
```

---

## Step 2: 选择目标平台

### 参数解析

| 输入 | 解析为 |
|------|--------|
| 无参数 | AskUserQuestion 交互选择 |
| `blog` / `ghost` | Blog |
| `x` | X |
| `xiaohongshu` / `xhs` | 小红书 |
| `wechat` | 公众号 |
| `all` | 全部 4 个平台 |
| 自然语言 | 解析意图，匹配平台 |

### 交互选择（无参数时）

使用 AskUserQuestion：

```
请选择要生成的平台（可多选，用空格或逗号分隔）：
1. Blog（上传配图 + 回填 cover_image）
2. X（X Article 文案与插图；发布准备含富文本和图片占位）
3. 小红书（口语化 + 配图）
4. 公众号（标题优化 + 段落适配）
```

### 已有平台版本

通过 `posts/{slug}/platforms/` 中的文件判断是否已有版本，保留用户手工编辑。用户明确要求更新时直接更新对应工作副本，不把源稿 `platforms` 字段当作素材已生成或已经发布的凭据。

---

## Step 3: 下载远程配图副本

在生成或发布任意平台版本前，扫描源文章正文和 frontmatter 中的图片 URL：

- Markdown 图片：`![alt](https://...)`
- 封面字段：`cover_image`、`coverImage`、`cover`、`image`、`featureImage`、`feature_image`

将远程图片下载到：

```bash
${PROJECT_ROOT}/posts/${SLUG}/imgs/originals/
```

要求：
- 无论后续是否处理水印，都执行下载。
- 只保存本地副本，**不要替换源文章中的远程链接**，不要改动 reviewed/30-Outputs 正文里的图片 URL。
- 文件名保留原始文件名；如重名，用短 hash 后缀去重。
- 后续完成报告列出下载清单，方便手动上传到 X、公众号、小红书等平台。

---

## Step 4: 按平台生成内容

### 风格优化参考

X 和公众号版本的风格优化依据此文件（仅 distribute 阶段使用，review 阶段不引用）：

```
${SKILL_DIR}/references/writing-style-guide.md
```

读取该文件及其引用的全局风格指南。需要改写时保留事实、机制和判断，删除不能帮助理解的聪明话；只要求格式转换或发布准备时保留已确认的文案。

---

### 4A. Blog

**风格改写：无**（使用主文章正文，在工作副本中处理链接和字段）

**操作：**

先生成 `posts/{slug}/platforms/blog.md` 工作副本，再执行以下操作。

1. 检查 `posts/{slug}/imgs/` 是否有本地配图：

```bash
ls "${PROJECT_ROOT}/posts/${SLUG}/imgs/"*.png 2>/dev/null | wc -l
```

2. 如有本地配图，调用 `innomad-image-upload` skill 上传所有图片：
   - 上传 `posts/{slug}/imgs/` 下所有图片
   - 上传 `posts/{slug}/{slug}_cover.png`（如存在）
   - 只替换 Blog 工作副本中的本地路径为 CDN URL

3. 在 Blog 工作副本中回填 `cover_image` frontmatter 字段（如封面已上传）：

```yaml
cover_image: "https://imgs.innomad.io/blog/{slug}_cover.png"
```

**输出：** `${PROJECT_ROOT}/posts/${SLUG}/platforms/blog.md`。源文章保持只读。

---

### 4B. X

- 使用 X Article 单篇长文格式，不拆成线程。
- 默认保留已确认正文，只做必要格式适配；用户要求优化时，依据风格指南调整，不强制 A/B/C 选择。
- 保留事实、机制和判断，不追加程序员视角的技术概念、金句、原文链接或 `[BLOG_URL]` 回链占位。
- 表格按信息量转为本地图表或列表；代码块如为理解主题所必需，转为引用或纯文本。
- `x.md` 中保留 Markdown 图片语法，路径应能从该文件位置正确解析；转富文本时替换为 `【文件名】` 占位。

**输出：** `${PROJECT_ROOT}/posts/${SLUG}/platforms/x.md` 及所需本地插图。

用户要求「发布到 X」或准备发布素材时，继续调用 `inm-post-to-x`，完成富文本转换、剪贴板复制和图片占位清单后交付；不打开或操作 X，不代粘贴、插图、保存草稿或发布。仅要求「生成 X 版本」时，交付 `x.md` 和配图即可。

---

### 4C. 小红书

**风格改写：**
- 口语化，首段钩子吸引点击
- 适当分段，每段 2-4 句话
- Emoji 视内容风格选用，不强制添加
- 投资类保持专业但亲和，生活类可更活泼
- 移除所有代码块和复杂表格
- 标题加关键词，适配小红书搜索

**配图生成：**

调用 `baoyu-xhs-images` skill，根据文章内容生成小红书风格配图。

**输出：**
- `${PROJECT_ROOT}/posts/${SLUG}/platforms/xiaohongshu.md`
- 配图保存到 `${PROJECT_ROOT}/posts/${SLUG}/imgs/xhs_*.png`

---

### 4D. 公众号

**风格改写：**
- 读取 `writing-style-guide.md`
- 优化开头：极快切入（同 X 方向但更正式）
- 优化结尾：简短说明有依据的判断、取舍和适用条件，不强凑金句
- 标题优化：适配公众号标题风格（更吸引点击但不标题党）
- 段落适配：每段控制在合理长度，适配手机阅读
- 移除代码块（公众号排版不友好）
- 保留表格（公众号支持）

**输出：** `${PROJECT_ROOT}/posts/${SLUG}/platforms/wechat.md`

---

## Step 5: 核对与交付

核对平台版本保留了源稿的事实、机制、判断和必要限定，插图文件可用且位置正确。X 富文本还需按 `inm-post-to-x` 核对占位清单。

素材生成不代表已发布，不据此修改源稿 `platforms` 或发布状态，也不回写 `30-Outputs/`。完成信息直接在对话中给出，不另建报告文件。

---

## 完成报告

只列出实际完成的交付项；X 若只生成 Markdown，就不声称富文本和剪贴板已就绪。示例：

```
分发完成！

源文章：用户指定的已确认稿件（只读）
已生成平台：
  ✅ 远程配图副本 — posts/{slug}/imgs/originals/
  ✅ Blog — posts/{slug}/platforms/blog.md，工作副本中已回填图片链接
  ✅ X — 富文本 HTML、剪贴板、本地插图和【文件名】对应清单
  ✅ 小红书 — posts/{slug}/platforms/xiaohongshu.md + 配图
  ✅ 公众号 — posts/{slug}/platforms/wechat.md

下一步：
  /inm-post-to-blog    → 补全 frontmatter、确认并发布到 innomad.io
  X                   → 用户自行粘贴富文本、插入对应图片并发布
  /baoyu-post-to-wechat → 发布到公众号
  小红书手动发布配图和文案
```
