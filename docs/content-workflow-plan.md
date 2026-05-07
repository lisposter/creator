# 内容创作工作流 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现 `docs/content-workflow-spec.md` 定义的内容创作工作流，新建 `inm-review` 和 `inm-distribute` 两个核心 skill，微调现有发布 skills，安装 Obsidian skills，废弃旧 skill。

**Architecture:** Skill-based pipeline: 写作(Obsidian) → 审稿(inm-review) → 分发(inm-distribute) → 发布(inm-post-to-ghost / inm-post-to-x / baoyu-post-to-wechat)。每个 skill 独立，通过 frontmatter 传递状态。文件从 `data/obsidian/10-Drafts/` 流向 `30-Outputs/posts/`，工作产物放 `posts/{slug}/`。

**Tech Stack:** Claude Code Skills (Markdown), Python (Pillow watermark), TypeScript/Bun (Ghost/X scripts), kepano/obsidian-skills

**Spec:** `docs/content-workflow-spec.md`

---

## File Map

### 新建文件

| 文件 | 职责 |
|------|------|
| `.agents/skills/inm-review/SKILL.md` | 审稿 skill 主文件：语言校对 + 事实核查 + frontmatter + 配图建议 |
| `.agents/skills/inm-review/scripts/add_watermark.py` | 水印脚本（从 innomad-article-optimizer 复制） |
| `.agents/skills/inm-distribute/SKILL.md` | 分发 skill 主文件：多平台内容生成 + 风格优化 |
| `.agents/skills/inm-distribute/references/writing-style-guide.md` | 写作风格指南（从 innomad-article-optimizer 复制） |
| `.agents/skills/defuddle/SKILL.md` | kepano/obsidian-skills: 网页提取 |
| `.agents/skills/json-canvas/SKILL.md` | kepano/obsidian-skills: Canvas 文件 |
| `.agents/skills/obsidian-bases/SKILL.md` | kepano/obsidian-skills: Bases 数据库视图 |
| `.agents/skills/obsidian-cli/SKILL.md` | kepano/obsidian-skills: CLI 交互 |
| `.agents/skills/obsidian-markdown/SKILL.md` | kepano/obsidian-skills: Markdown 语法 |

### 修改文件

| 文件 | 变更 |
|------|------|
| `.agents/skills/inm-post-to-ghost/config.yaml` | `source_dir` → `data/obsidian/30-Outputs/posts`，移除 `target_dir` |
| `.agents/skills/inm-post-to-ghost/SKILL.md` | 新增 platforms 追加 + status 回写逻辑 |
| `.agents/skills/inm-post-to-x/SKILL.md` | 新增 platforms 追加，输入文件改为 `posts/{slug}/platforms/x.md` |
| `.agents/skills/innomad-article-optimizer/SKILL.md` | 顶部添加废弃声明 |
| `.agents/SKILLS.md` | 新增 inm-review、inm-distribute、5 个 obsidian skills；标注 innomad-article-optimizer 废弃 |
| `AGENTS.md` | 更新风格指南路径引用、搜索路径、30-Blog → 30-Outputs |
| `.gitignore` | 添加 `!.claude/skills` 例外 |

---

## Task 1: 基础设施更新（.gitignore + AGENTS.md）

**Files:**
- Modify: `.gitignore:438-439`
- Modify: `AGENTS.md`

- [ ] **Step 1: 更新 .gitignore 添加 .claude/skills 例外**

在 `.gitignore` 中 `.claude/*` 规则后添加 `.claude/skills` 例外：

```gitignore
.claude/*
!.claude/settings.local.json
!.claude/skills
```

- [ ] **Step 2: 更新 AGENTS.md**

修改三处：

1. "MUST NOT DO" 中 `30-Blog` → `30-Outputs`：

```markdown
## MUST NOT DO
- 不要生成任何多余的文档
- 禁止编辑、改动、删除 /data/obsidian/30-Outputs 目录下的任何文件
```

2. 内容风格指南路径更新：

```markdown
## 内容风格指南

完整风格指南见：`.agents/skills/inm-distribute/references/writing-style-guide.md`
```

3. Skills 引用不变（`.agents/SKILLS.md`），无需修改。

- [ ] **Step 3: Commit**

```bash
git add .gitignore AGENTS.md
git commit -m "chore: update gitignore and AGENTS.md for new workflow structure"
```

---

## Task 2: 安装 kepano/obsidian-skills

**Files:**
- Create: `.agents/skills/defuddle/` (整个目录)
- Create: `.agents/skills/json-canvas/` (整个目录)
- Create: `.agents/skills/obsidian-bases/` (整个目录)
- Create: `.agents/skills/obsidian-cli/` (整个目录)
- Create: `.agents/skills/obsidian-markdown/` (整个目录)

- [ ] **Step 1: Clone 仓库到临时目录**

```bash
git clone --depth 1 https://github.com/kepano/obsidian-skills.git /tmp/obsidian-skills
```

- [ ] **Step 2: 复制 5 个 skill 目录**

```bash
PROJECT_ROOT=$(git rev-parse --show-toplevel)
for skill in defuddle json-canvas obsidian-bases obsidian-cli obsidian-markdown; do
  cp -r "/tmp/obsidian-skills/${skill}" "${PROJECT_ROOT}/.agents/skills/${skill}"
done
```

- [ ] **Step 3: 清理临时目录**

```bash
rm -rf /tmp/obsidian-skills
```

- [ ] **Step 4: 验证安装**

```bash
ls -la "${PROJECT_ROOT}/.agents/skills/defuddle/SKILL.md" \
       "${PROJECT_ROOT}/.agents/skills/json-canvas/SKILL.md" \
       "${PROJECT_ROOT}/.agents/skills/obsidian-bases/SKILL.md" \
       "${PROJECT_ROOT}/.agents/skills/obsidian-cli/SKILL.md" \
       "${PROJECT_ROOT}/.agents/skills/obsidian-markdown/SKILL.md"
```

Expected: 5 个文件全部存在。

- [ ] **Step 5: Commit**

```bash
git add .agents/skills/defuddle .agents/skills/json-canvas .agents/skills/obsidian-bases .agents/skills/obsidian-cli .agents/skills/obsidian-markdown
git commit -m "feat: install kepano/obsidian-skills (defuddle, json-canvas, obsidian-bases, obsidian-cli, obsidian-markdown)"
```

---

## Task 3: 创建 inm-review skill

**Files:**
- Create: `.agents/skills/inm-review/SKILL.md`
- Create: `.agents/skills/inm-review/scripts/add_watermark.py`

- [ ] **Step 1: 复制水印脚本**

```bash
PROJECT_ROOT=$(git rev-parse --show-toplevel)
mkdir -p "${PROJECT_ROOT}/.agents/skills/inm-review/scripts"
cp "${PROJECT_ROOT}/.agents/skills/innomad-article-optimizer/scripts/add_watermark.py" \
   "${PROJECT_ROOT}/.agents/skills/inm-review/scripts/add_watermark.py"
```

- [ ] **Step 2: 创建 SKILL.md**

写入 `.agents/skills/inm-review/SKILL.md`，完整内容如下：

````markdown
---
name: inm-review
description: AI 审稿：语言校对 + 事实核查 + frontmatter 生成 + 配图建议。只纠错，不改写风格。在 data/obsidian/10-Drafts/ 查找文章，输出 reviewed.md 和 review-report.md。当用户提到「审稿」「review」「校对」「核查」时使用。
---

# AI 审稿 (Article Review)

对 Obsidian 草稿进行语言校对、事实核查和 frontmatter 生成。**核心原则：只纠错，不改写。**

## 使用方法

```bash
/inm-review 文章名
```

## Shell 命令规范

```bash
# 运行时获取项目根目录，所有路径基于此变量拼接
PROJECT_ROOT=$(git rev-parse --show-toplevel)
```

始终使用绝对路径，禁止 `cd` 后用相对路径。

## 工作流程

```
- [ ] Step 1: 查找文章
- [ ] Step 2: 语言校对（只纠错，不改写）
- [ ] Step 3: 事实核查（Web Search）
- [ ] Step 4: 配图建议（不生成图片）
- [ ] Step 5: 生成 frontmatter
- [ ] Step 6: 输出 reviewed.md + review-report.md
- [ ] Step 7: 展示 diff → 询问是否生成配图和封面
- [ ] Step 8: (可选) 生成配图和封面
- [ ] Step 9: 用户最终确认 → 归档
```

**交互点**：Step 7（确认修改 + 是否生成配图）和 Step 9（最终确认归档）。

---

## Step 1: 查找文章

### 搜索位置

在 `${PROJECT_ROOT}/data/obsidian/` 下搜索，**禁止用 `mkdir` 创建 vault 目录**，目录不存在则报错提示用户修复符号链接：

```bash
# 验证 vault 可访问
ls "${PROJECT_ROOT}/data/obsidian/10-Drafts/" > /dev/null 2>&1 || echo "ERROR: data/obsidian 符号链接失效，请检查 iCloud Obsidian Vault 连接"
```

搜索优先级：

```bash
# 1. 精确匹配（10-Drafts 优先）
find "${PROJECT_ROOT}/data/obsidian/10-Drafts/" -maxdepth 1 -name "${ARTICLE_NAME}.md" 2>/dev/null

# 2. 模糊匹配
find "${PROJECT_ROOT}/data/obsidian/10-Drafts/" -maxdepth 1 -name "*${ARTICLE_NAME}*" -name "*.md" 2>/dev/null

# 3. 扩展到 30-Outputs
find "${PROJECT_ROOT}/data/obsidian/30-Outputs/" -name "*${ARTICLE_NAME}*" -name "*.md" 2>/dev/null

# 4. 全 vault 递归
find "${PROJECT_ROOT}/data/obsidian/" -name "*${ARTICLE_NAME}*" -name "*.md" 2>/dev/null | head -10
```

### 匹配规则

| 结果 | 处理 |
|------|------|
| 精确匹配 1 篇 | 直接使用 |
| 模糊匹配多篇 | AskUserQuestion 列出供选择 |
| 未找到 | 列出 10-Drafts 所有 .md，AskUserQuestion 让用户选择或重新输入 |

### 排除规则

搜索时排除以下文件：
- `*_reviewed.md`（已有审稿版本）
- `*_review-report.md`（审稿报告）

---

## Step 2: 语言校对

**只纠错，不改写。** 以下是校对范围：

| 校对项 | 说明 | 示例 |
|--------|------|------|
| 错别字 | 修正明显的打字错误 | 「应该」→「应该」 |
| 语病 | 修正病句，保持原意 | 主谓搭配、语序错误 |
| 标点符号 | 修正标点错误，统一中英文标点规范 | 多余/缺失标点、全半角混用 |
| 标题层级 | 确保 Markdown 标题层级合理（H2 起步，不跳级） | `###` 直接跟在 `#` 后 → 补 `##` |

**禁止改写的内容：**
- 开头和结尾的表达方式
- 段落结构和信息顺序
- 用词风格和口吻
- 增删段落或论点

---

## Step 3: 事实核查

通过 WebSearch 核查文章中的**具体数据、人名、日期、引用**。

### 核查分类

| 严重度 | 标记 | 说明 | 处理 |
|--------|------|------|------|
| 严重 | 🔴 | 数据明确错误，可能误导读者 | 在 reviewed.md 中直接修正 + `⚠️` 标注 |
| 中等 | 🟡 | 数据可能过时或来源不明确 | 在 reviewed.md 中加 `⚠️` 标注，不修改 |
| 轻微 | 🟢 | 表述略有偏差但不影响理解 | 仅在报告中记录 |

### 核查要点

- 金融数据：股价、收益率、费率、市值等是否准确（标注数据日期）
- 人名/公司名：拼写是否正确
- 历史日期：事件发生时间是否准确
- 引用/出处：引文是否存在、是否被正确归属
- 统计数据：百分比、数量级是否合理

---

## Step 4: 配图建议

分析文章结构，建议适合插图的位置。**此步骤不生成图片**，仅输出建议。

每条建议包含：
- **位置**：建议插入的段落/标题后
- **类型**：数据图表 / 概念图 / 流程图 / 对比图 / 示意图
- **说明**：图片应展示的内容
- **风格**：推荐的 baoyu-article-illustrator 风格（innomad-finance / innomad-tech / innomad-life）

---

## Step 5: 生成 Frontmatter

根据文章内容自动生成完整 frontmatter：

```yaml
---
title: "从文章 H1 或内容提取"
date: YYYY-MM-DD  # 当天日期
slug: article-slug  # 从标题生成 kebab-case
category: Finance  # Finance | Tech | Nomad，根据内容判断
tags:  # 从以下可用标签中选择，优先使用已有标签
  - ETF
  # 可用标签：ETF, 思考, IBKR, 美股, 理财, AI, 数字游民, 投资工具, 期权
featured: false
password: ""
tiers: []
summary: "2-3 句话的摘要，符合一挪迈文风"
cover_image: ""  # 留空，待 /inm-distribute Ghost 上传后回填
status: draft
platforms: []
---
```

### slug 生成规则

- 从标题提取关键词，转为 kebab-case
- 中文标题用拼音或英文翻译
- 示例：「ETF 开箱：JEPI 和 JEPQ」→ `etf-jepi-jepq`

### category 判断规则

| 关键词/主题 | Category |
|------------|----------|
| 投资、理财、ETF、股票、期权、FIRE | Finance |
| AI、编程、工具、技术 | Tech |
| 游牧、旅行、生活、远程工作 | Nomad |

### tags 选择规则

优先从可用标签列表中匹配，不创造新标签。一篇文章 1-3 个标签。

---

## Step 6: 输出文件

在 `${PROJECT_ROOT}/data/obsidian/10-Drafts/` 生成两个文件：

### 6.1 `文章名_reviewed.md`

纠错后的完整版本，包含：
- 完整 frontmatter（Step 5 生成）
- 纠错后的正文（错误处保留 `⚠️` 标注）
- 正文内容顺序和结构与原文完全一致

### 6.2 `文章名_review-report.md`

审稿报告，包含三个表格：

**语言修正表：**

| # | 位置 | 原文 | 修正 | 类型 |
|---|------|------|------|------|
| 1 | 第3段 | 错别字原文 | 修正后文本 | 错别字/语病/标点 |

**事实核查表：**

| # | 内容 | 核查结果 | 严重度 | 来源 |
|---|------|----------|--------|------|
| 1 | "SPY 年化 10%" | 近 10 年 CAGR 约 12.5% | 🟡 | Yahoo Finance |

**配图建议表：**

| # | 位置 | 类型 | 说明 | 风格 |
|---|------|------|------|------|
| 1 | "ETF 对比"段后 | 数据图表 | JEPI vs JEPQ 收益对比 | innomad-finance |

---

## Step 7: 展示 Diff + 询问配图

### 7.1 展示修改对比

用 Markdown diff 格式展示原文与 reviewed 版本的差异，仅展示有变动的段落。

### 7.2 询问配图和封面

```
是否现在生成配图和封面？（会调用 baoyu-article-illustrator + baoyu-cover-image，耗时较长）
A. 是，现在生成
B. 否，跳过（可在 /inm-distribute 前手动生成）
```

使用 AskUserQuestion 获取用户选择。

---

## Step 8: (可选) 生成配图和封面

仅在用户选择 A 时执行。

### 8.1 创建工作目录

从 frontmatter 读取 slug：

```bash
SLUG="article-slug"  # 从 frontmatter 提取
mkdir -p "${PROJECT_ROOT}/posts/${SLUG}/imgs"
mkdir -p "${PROJECT_ROOT}/posts/${SLUG}/platforms"
```

### 8.2 生成文章配图

调用 `baoyu-article-illustrator` skill，根据 Step 4 配图建议表生成插图。

图片保存到 `${PROJECT_ROOT}/posts/${SLUG}/imgs/`。

生成后以本地相对路径插入 `文章名_reviewed.md` 对应位置：

```markdown
![配图说明](../../posts/{slug}/imgs/illustration_1.png)
```

### 8.3 水印处理

对每张配图添加水印：

```bash
python3 "${PROJECT_ROOT}/.agents/skills/inm-review/scripts/add_watermark.py" \
  "${PROJECT_ROOT}/posts/${SLUG}/imgs/illustration_1.png" \
  "${PROJECT_ROOT}/posts/${SLUG}/imgs/illustration_1.png"
```

### 8.4 生成封面

调用 `baoyu-cover-image` skill，生成封面保存到：

```bash
${PROJECT_ROOT}/posts/${SLUG}/${SLUG}_cover.png
```

`cover_image` frontmatter 字段**留空**，待 `/inm-distribute` Ghost 步骤上传后回填。

### 8.5 展示最终版

展示含配图的 reviewed.md 完整内容，等待用户最终确认。

---

## Step 9: 用户确认 → 归档

用户确认后执行：

### 9.1 移动 reviewed 文件到 30-Outputs

```bash
DATE=$(date +%Y-%m-%d)
SLUG="article-slug"  # 从 frontmatter
mv "${PROJECT_ROOT}/data/obsidian/10-Drafts/文章名_reviewed.md" \
   "${PROJECT_ROOT}/data/obsidian/30-Outputs/posts/${DATE}-${SLUG}.md"
```

### 9.2 删除临时文件

```bash
rm "${PROJECT_ROOT}/data/obsidian/10-Drafts/文章名.md"
rm "${PROJECT_ROOT}/data/obsidian/10-Drafts/文章名_review-report.md"
```

删除前确认文件存在，不存在则跳过（不报错）。

### 9.3 确保工作目录存在

```bash
mkdir -p "${PROJECT_ROOT}/posts/${SLUG}/imgs"
mkdir -p "${PROJECT_ROOT}/posts/${SLUG}/platforms"
```

### 9.4 完成报告

输出：
- 归档路径：`data/obsidian/30-Outputs/posts/YYYY-MM-DD-{slug}.md`
- 工作目录：`posts/{slug}/`
- 下一步提示：`/inm-distribute` 生成多平台版本
````

- [ ] **Step 3: 验证文件结构**

```bash
PROJECT_ROOT=$(git rev-parse --show-toplevel)
ls -la "${PROJECT_ROOT}/.agents/skills/inm-review/SKILL.md" \
       "${PROJECT_ROOT}/.agents/skills/inm-review/scripts/add_watermark.py"
```

Expected: 两个文件都存在。

- [ ] **Step 4: Commit**

```bash
git add .agents/skills/inm-review
git commit -m "feat: create inm-review skill (proofread + fact-check + frontmatter)"
```

---

## Task 4: 创建 inm-distribute skill

**Files:**
- Create: `.agents/skills/inm-distribute/SKILL.md`
- Create: `.agents/skills/inm-distribute/references/writing-style-guide.md`

- [ ] **Step 1: 复制写作风格指南**

```bash
PROJECT_ROOT=$(git rev-parse --show-toplevel)
mkdir -p "${PROJECT_ROOT}/.agents/skills/inm-distribute/references"
cp "${PROJECT_ROOT}/.agents/skills/innomad-article-optimizer/references/writing-style-guide.md" \
   "${PROJECT_ROOT}/.agents/skills/inm-distribute/references/writing-style-guide.md"
```

- [ ] **Step 2: 创建 SKILL.md**

写入 `.agents/skills/inm-distribute/SKILL.md`，完整内容如下：

````markdown
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
````

- [ ] **Step 3: 验证文件结构**

```bash
PROJECT_ROOT=$(git rev-parse --show-toplevel)
ls -la "${PROJECT_ROOT}/.agents/skills/inm-distribute/SKILL.md" \
       "${PROJECT_ROOT}/.agents/skills/inm-distribute/references/writing-style-guide.md"
```

Expected: 两个文件都存在。

- [ ] **Step 4: Commit**

```bash
git add .agents/skills/inm-distribute
git commit -m "feat: create inm-distribute skill (multi-platform content distribution)"
```

---

## Task 5: 微调 inm-post-to-ghost

**Files:**
- Modify: `.agents/skills/inm-post-to-ghost/config.yaml`
- Modify: `.agents/skills/inm-post-to-ghost/SKILL.md`

- [ ] **Step 1: 更新 config.yaml**

修改 `source_dir` 和 `target_dir`：

```yaml
# 文章源目录（相对于项目根目录）
source_dir: data/obsidian/30-Outputs/posts

# 发布后归档目录（不再需要，文章保留在 30-Outputs/posts 原位）
# target_dir: data/obsidian/30-Blog/innomad.io  # REMOVED
```

即：将 `source_dir` 从 `data/obsidian/20-Workbench/Drafts` 改为 `data/obsidian/30-Outputs/posts`，删除 `target_dir` 行（新工作流中文章不移动，保留在 30-Outputs/posts 原位）。

- [ ] **Step 2: 在 SKILL.md 中添加 platforms 追踪逻辑**

在 SKILL.md 的工作流程说明末尾（发布成功后的操作部分）追加以下内容：

```markdown
## 发布后操作

发布成功后，自动更新源文章 frontmatter：

1. 确保 `platforms` 数组中包含 `ghost`（不重复追加）
2. 将 `status` 设为 `published`

使用 Read 读取源文件 → 修改 frontmatter → Edit 回写。
```

在 SKILL.md 中找到发布成功后的流程描述位置插入此段。具体插入位置：在 "发布成功" 相关输出之后、流程结束之前。

- [ ] **Step 3: Commit**

```bash
git add .agents/skills/inm-post-to-ghost/config.yaml .agents/skills/inm-post-to-ghost/SKILL.md
git commit -m "feat(inm-post-to-ghost): update source_dir, add platforms tracking"
```

---

## Task 6: 微调 inm-post-to-x

**Files:**
- Modify: `.agents/skills/inm-post-to-x/SKILL.md`

- [ ] **Step 1: 更新 SKILL.md**

在 SKILL.md 中做两处修改：

**修改 1：** 在"使用方式"部分，更新输入文件说明。在现有 `article.md` 示例之后添加说明：

```markdown
### 输入文件

优先使用 `/inm-distribute` 生成的 X 平台版本：

```bash
# 推荐：使用 distribute 生成的 X 版本
npx -y bun ${SKILL_DIR}/scripts/md-to-html.ts ${PROJECT_ROOT}/posts/{slug}/platforms/x.md --save-html /tmp/x-article.html

# 也支持直接使用源文章
npx -y bun ${SKILL_DIR}/scripts/md-to-html.ts /path/to/article.md --save-html /tmp/x-article.html
```
```

**修改 2：** 在文件末尾"注意事项"之前添加：

```markdown
## 发布后操作

发布成功后（用户确认已在 X 上发布），更新源文章 frontmatter：

1. 确保 `platforms` 数组中包含 `x`（不重复追加）
2. 源文章路径：`data/obsidian/30-Outputs/posts/` 中对应的文件（通过 slug 匹配）

使用 Read 读取源文件 → 修改 frontmatter → Edit 回写。
```

- [ ] **Step 2: Commit**

```bash
git add .agents/skills/inm-post-to-x/SKILL.md
git commit -m "feat(inm-post-to-x): add platforms tracking, prefer distribute output"
```

---

## Task 7: 废弃 innomad-article-optimizer

**Files:**
- Modify: `.agents/skills/innomad-article-optimizer/SKILL.md:1-6`

- [ ] **Step 1: 在 SKILL.md frontmatter 后添加废弃声明**

在 frontmatter `---` 结束后、`# 文章优化器` 标题之前，插入：

```markdown
> ⚠️ **已废弃 (Deprecated)**
>
> 此 skill 已被拆分为两个独立 skill：
> - `/inm-review` — 语言校对 + 事实核查 + frontmatter 生成
> - `/inm-distribute` — 多平台分发 + 风格优化
>
> 请使用新 skill 替代。此文件保留仅供参考。
```

- [ ] **Step 2: Commit**

```bash
git add .agents/skills/innomad-article-optimizer/SKILL.md
git commit -m "chore: deprecate innomad-article-optimizer in favor of inm-review + inm-distribute"
```

---

## Task 8: 更新 .agents/SKILLS.md 注册表

**Files:**
- Modify: `.agents/SKILLS.md`

- [ ] **Step 1: 更新 SKILLS.md**

替换整个文件内容为：

```markdown
# Skills 安装规则

- 所有 skill 统一安装到 `.agents/skills/` 目录下（`.claude/skills/` 是它的符号链接）
- 每个 skill 一个子目录，目录名即 skill 名
- 外部 skill 安装后需在此处记录来源

## 已安装的外部 Skills

| Skill | 来源 | 说明 |
|-------|------|------|
| inm-review | 自研 | AI 审稿：语言校对 + 事实核查 + frontmatter 生成（只纠错不改写） |
| inm-distribute | 自研 | 多平台分发：Ghost、X、小红书、公众号，含风格优化 |
| inm-x-optimizer | 自研（基于 xai-org/x-algorithm 源码分析） | 基于 X 开源推荐算法（Phoenix 系统）优化推文，提升互动和曝光 |
| inm-post-to-x | 自研（基于 baoyu-post-to-x 简化） | Markdown → 富文本剪贴板，手动粘贴发布 X Article，图片用【文件名】占位 |
| inm-post-to-ghost | 自研（基于 innomad-io-sync 重构） | 本地 Markdown → Ghost CMS 发布，从 frontmatter 读取元数据，支持单篇/批量同步 |
| x-bookmarks | [sharbelxyz/x-bookmarks](https://github.com/sharbelxyz/x-bookmarks) | 获取、摘要、管理 X/Twitter 书签，支持 bird CLI 或 X API v2 |
| defuddle | [kepano/obsidian-skills](https://github.com/kepano/obsidian-skills) | 网页内容提取为干净的 Markdown |
| json-canvas | [kepano/obsidian-skills](https://github.com/kepano/obsidian-skills) | 创建和编辑 Obsidian .canvas 文件 |
| obsidian-bases | [kepano/obsidian-skills](https://github.com/kepano/obsidian-skills) | 创建和编辑 Obsidian .base 数据库视图 |
| obsidian-cli | [kepano/obsidian-skills](https://github.com/kepano/obsidian-skills) | CLI 与 Obsidian vault 交互 |
| obsidian-markdown | [kepano/obsidian-skills](https://github.com/kepano/obsidian-skills) | Obsidian 风格 Markdown 语法参考 |
| ~~innomad-article-optimizer~~ | ~~自研~~ | ~~已废弃，由 inm-review + inm-distribute 取代~~ |
```

- [ ] **Step 2: Commit**

```bash
git add .agents/SKILLS.md
git commit -m "chore: update SKILLS.md registry with new skills and deprecation"
```

---

## Task 依赖关系

```
Task 1 (基础设施)     ─┐
Task 2 (obsidian-skills) ─┤
Task 3 (inm-review)      ─┤─→ Task 7 (废弃 optimizer) ─→ Task 8 (SKILLS.md)
Task 4 (inm-distribute)  ─┤
Task 5 (inm-post-to-ghost)┤
Task 6 (inm-post-to-x)   ─┘
```

Task 1-6 互相独立，可并行执行。Task 7 依赖 Task 3+4 完成（确认新 skill 就位后再废弃旧 skill）。Task 8 在所有其他 task 完成后执行。
