---
name: inm-distribute
description: 多平台内容分发：将审稿完成的文章转换为 Ghost、X、小红书、公众号等平台格式，含风格优化。当用户提到「分发」「distribute」「生成X版本」「生成公众号版本」「生成小红书版本」时使用。
---

# 多平台分发 (Content Distribution)

将 `30-Outputs/posts/` 中审稿完成的文章转换为各平台适配版本，包含平台特定的风格优化。

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
- [ ] Step 3: 按平台生成内容
- [ ] Step 4: 更新 frontmatter platforms 数组
```

---

## Step 1: 定位源文章

### 搜索位置

在 `${PROJECT_ROOT}/data/obsidian/30-Outputs/posts/` 中搜索：

```bash
find "${PROJECT_ROOT}/data/obsidian/30-Outputs/posts/" -maxdepth 1 -name "*.md" 2>/dev/null | sort -r | head -20
```

### 匹配规则

与 inm-review 相同（精确 → 模糊 → 列出选择）。

### 验证

源文章必须满足：
- 包含完整 frontmatter（title, slug, category, tags, status, platforms）
- `status` 为 `reviewed` 或 `ready`（`draft` 状态提示先运行 `/inm-review`）

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
| `ghost` | Ghost |
| `x` | X |
| `xiaohongshu` / `xhs` | 小红书 |
| `wechat` | 公众号 |
| `all` | 全部 4 个平台 |
| 自然语言 | 解析意图，匹配平台 |

### 交互选择（无参数时）

使用 AskUserQuestion：

```
请选择要生成的平台（可多选，用空格或逗号分隔）：
1. Ghost（上传配图 + 回填 cover_image）
2. X（单条长文，A/B/C 三个方向）
3. 小红书（口语化 + 配图）
4. 公众号（标题优化 + 段落适配）
```

### 跳过已生成的平台

检查 frontmatter `platforms` 数组，如果目标平台已在列表中，提示用户：

```
X 版本已生成（platforms 中包含 "x"）。是否重新生成？
```

---

## Step 3: 按平台生成内容

### 风格优化参考

X 和公众号版本的风格优化依据此文件（仅 distribute 阶段使用，review 阶段不引用）：

```
${SKILL_DIR}/references/writing-style-guide.md
```

读取该文件获取写作风格指南，应用到 X 和公众号版本的开头和结尾优化。

---

### 3A. Ghost

**风格改写：无**（主文章即 Ghost 正文）

**操作：**

1. 检查 `posts/{slug}/imgs/` 是否有本地配图：

```bash
ls "${PROJECT_ROOT}/posts/${SLUG}/imgs/"*.png 2>/dev/null | wc -l
```

2. 如有本地配图，调用 `innomad-image-upload` skill 上传所有图片：
   - 上传 `posts/{slug}/imgs/` 下所有图片
   - 上传 `posts/{slug}/{slug}_cover.png`（如存在）
   - 替换源文章中本地路径为 CDN URL

3. 回填 `cover_image` frontmatter 字段（如封面已上传）：

```yaml
cover_image: "https://imgs.innomad.io/blog/{slug}_cover.png"
```

4. 将 `ghost` 追加到 frontmatter `platforms` 数组。

**输出：直接修改源文章**（`30-Outputs/posts/` 中的文件），无额外输出文件。

---

### 3B. X

**风格改写：**
- 读取 `writing-style-guide.md`
- 优化开头：极快切入，1-2 句 Hook
- 优化结尾：金句收束 + 留白
- 参照 `inm-x-optimizer` 原则：Hook + 核心观点 + 金句
- 单条长文格式（X Article），不是线程
- 末尾附 `[BLOG_URL]` 占位符（发布时替换为 Ghost 文章链接）

**提供 A/B/C 三个方向：**

| 方向 | 风格 |
|------|------|
| A | 观点驱动：直接抛出最强论点 |
| B | 故事驱动：从个人经历/场景切入 |
| C | 数据驱动：用数据或对比开场 |

使用 AskUserQuestion 让用户选择方向。

**注意：**
- X 不支持 Markdown 表格，表格内容转为列表格式
- X 不支持代码块，代码内容转为引用或纯文本
- 图片保留 Markdown 语法（X Article 支持图片）

**输出：** `${PROJECT_ROOT}/posts/${SLUG}/platforms/x.md`

将 `x` 追加到 frontmatter `platforms` 数组。

---

### 3C. 小红书

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

将 `xiaohongshu` 追加到 frontmatter `platforms` 数组。

---

### 3D. 公众号

**风格改写：**
- 读取 `writing-style-guide.md`
- 优化开头：极快切入（同 X 方向但更正式）
- 优化结尾：金句收束 + 留白
- 标题优化：适配公众号标题风格（更吸引点击但不标题党）
- 段落适配：每段控制在合理长度，适配手机阅读
- 移除代码块（公众号排版不友好）
- 保留表格（公众号支持）

**输出：** `${PROJECT_ROOT}/posts/${SLUG}/platforms/wechat.md`

将 `wechat` 追加到 frontmatter `platforms` 数组。

---

## Step 4: 更新 Frontmatter

每个平台生成完成后，立即将平台名追加到源文章（`30-Outputs/posts/` 中的文件）的 `platforms` 数组：

```yaml
platforms:
  - ghost
  - x
```

**实现方式：** 使用 Read 读取文件 → 解析 YAML frontmatter → 追加平台 → Edit 回写。

**去重：** 追加前检查是否已存在，避免重复。

---

## 完成报告

所有选定平台生成完成后，输出报告：

```
分发完成！

源文章：data/obsidian/30-Outputs/posts/YYYY-MM-DD-{slug}.md
已生成平台：
  ✅ Ghost — 配图已上传，cover_image 已回填
  ✅ X — posts/{slug}/platforms/x.md（方向 B）
  ✅ 小红书 — posts/{slug}/platforms/xiaohongshu.md + 配图
  ✅ 公众号 — posts/{slug}/platforms/wechat.md

下一步：
  /inm-post-to-ghost   → 发布到 Ghost
  /inm-post-to-x       → 复制到剪贴板，手动发布到 X
  /baoyu-post-to-wechat → 发布到公众号
  小红书手动发布配图和文案
```
