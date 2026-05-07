# 内容创作工作流设计

**日期：** 2026-03-21
**状态：** 已确认，待实现

---

## 背景

建立一套个人内容创作工作流，基于 `creator` 仓库 + Claude Code Skills。内容由作者主写，AI 负责审稿、事实核查、平台分发和发布辅助。

### 内容方向

投资、财经知识、AI/工具、个人思考、数字游民生活。

### 目标平台

| 平台 | 角色 |
|------|------|
| Ghost（innomad.io） | 主平台，完整长文 |
| X | 线程版，即时感 |
| 小红书 | 口语化，配图驱动 |
| 公众号 | 沉淀版，正式感 |

---

## 仓库结构

```
creator/                              # 主工作目录
  .agents/
    skills/                           # 所有 AI skills（git tracked）
      baoyu-*/                        # 上游 skills，不修改
      inm-*/                          # 自有 skills（现有）
      inm-review/                     # 新建
      inm-distribute/                 # 新建
      obsidian-*/                     # Obsidian skills（来自 kepano/obsidian-skills）
      defuddle/                       # 网页提取（来自 kepano/obsidian-skills）
  .claude/
    skills -> ../.agents/skills       # 符号链接，让 Claude Code 自动发现 skills
  .innomad-skills/                    # skill 项目级配置（EXTEND.md）
  .baoyu-skills/                      # baoyu skill 配置（EXTEND.md）
  data/
    obsidian/ -> ~/Library/Mobile Documents/iCloud~md~obsidian/Documents/Main  # Obsidian Vault 软链（git ignored）
  posts/                              # 工作目录（git ignored）
    {slug}/
      platforms/
        x.md
        xiaohongshu.md
        wechat.md
        newsletter.md
      imgs/                           # 文章配图
      {slug}_cover.png                # 封面图
  CLAUDE.md
  AGENTS.md
```

### Obsidian Vault 结构（通过 data/obsidian/ 访问）

```
00-Inbox/             # 想法、素材捕捉
10-Drafts/            # 写作区（临时）
  文章名.md           # 原始草稿
  文章名_reviewed.md  # /inm-review 生成，确认后删除
  文章名_review-report.md  # 审稿报告（文件名含文章名，支持多篇共存），确认后删除
20-Projects/
30-Outputs/
  posts/              # 正式文章库（确认后归档）
    YYYY-MM-DD-slug.md
  xiaohongshu/        # 小红书配图（/inm-distribute 生成后手动整理）
40-Resources/
90-Journal/
99-System/
```

---

## Frontmatter 规范

`30-Outputs/posts/` 下每篇文章的 frontmatter（由 `/inm-review` 生成）：

```yaml
---
title: "文章标题"
date: YYYY-MM-DD
slug: article-slug          # kebab-case，Ghost URL 唯一标识
category: Finance           # Finance | Tech | Nomad
tags:
  - 投资
featured: false
password: ""
tiers: []
summary: "2-3 句话的摘要，符合一挪迈文风"
cover_image: ""             # /inm-distribute Ghost 上传后回填
status: draft               # draft | reviewed | ready | published
platforms: []               # 已发布的平台，数组形式，逐步追加
---
```

### platforms 字段演进示例

```yaml
# /inm-review 生成时（初始）
status: draft
platforms: []

# 作者确认审稿后
status: reviewed
platforms: []

# /inm-distribute ghost 完成后
status: reviewed
platforms:
  - ghost

# /inm-distribute x 完成后
status: reviewed
platforms:
  - ghost
  - x

# /inm-post-to-ghost 发布成功后
status: published
platforms:
  - ghost
  - x

# 全部平台发布完成后
status: published
platforms:
  - ghost
  - x
  - xiaohongshu
  - wechat
```

### Status 说明

| 值 | 含义 | 由谁设置 |
|---|---|---|
| `draft` | /inm-review 生成时的初始值 | /inm-review 自动 |
| `reviewed` | 作者确认审稿无误，文章已进入 30-Outputs | 作者手动 |
| `ready` | 准备发布 | 作者手动 |
| `published` | Ghost 已发布 | /inm-post-to-ghost 回写 |

---

## 工作流

### 第 1 步：写作

在 Obsidian `10-Drafts/` 下新建 `文章名.md`，正常写作，不需要 frontmatter。

### 第 2 步：AI 审稿（`/inm-review`）

在 creator 目录启动 claude，执行：

```
/inm-review 文章名
```

> **核心原则：只纠错，不改写。** review 阶段只做最基础的纠错、事实核查、病句修正，不做任何风格优化（开头/结尾改写等风格优化在 `/inm-distribute` 各平台分发时执行）。

**执行内容：**
1. 在 `data/obsidian/10-Drafts/` 搜索文章（精确匹配 → 模糊匹配 → 列出供选择）
2. 语言校对：错别字、语病、标点、标题层级（只纠错，不改写开头/结尾/段落结构）
3. 事实核查：通过 Web Search 核查数据、人名、日期、引用，标注存疑点（🔴严重 / 🟡中等 / 🟢轻微）
4. 配图建议：分析文章结构，建议插图位置、类型和说明（不生成图片）
5. 生成完整 frontmatter（见上方规范）
6. 输出两个文件：
   - `文章名_reviewed.md`：纠错后的完整版本，含 frontmatter，存疑处加 `⚠️` 标注
   - `文章名_review-report.md`：审稿报告，包含语言修正表、事实核查表、配图建议表

**展示 diff 报告，询问是否生成配图和封面：**

> 是否现在生成配图和封面？（会调用 baoyu-article-illustrator + baoyu-cover-image，耗时较长）
> A. 是，现在生成
> B. 否，跳过（可在 /inm-distribute 前手动生成）

**如选 A，执行配图和封面生成：**
- 调用 `baoyu-article-illustrator` skill，根据配图建议生成插图，保存到 `posts/{slug}/imgs/`，以本地路径插入 `文章名_reviewed.md` 对应位置
- 调用 `baoyu-cover-image` skill，生成封面，保存到 `posts/{slug}/{slug}_cover.png`（暂不上传，`cover_image` 字段留空，待 `/inm-post-to-ghost` 上传后回填）

**展示最终版 reviewed.md（含配图），用户最终确认。**

**确认后执行：**
- `文章名_reviewed.md` → 重命名并移入 `data/obsidian/30-Outputs/posts/YYYY-MM-DD-slug.md`
- `文章名.md` 和 `文章名_review-report.md` → 删除
- 在 `posts/{slug}/` 下创建工作目录

### 第 3 步：平台分发（`/inm-distribute`）

```
/inm-distribute                         # 交互选择平台
/inm-distribute x                       # 指定平台
/inm-distribute x wechat                # 多个平台
/inm-distribute all                     # 全部平台
/inm-distribute 帮我生成 X 和公众号版本  # 自然语言
```

不传参时，使用 AskUserQuestion 让用户勾选平台：
```
请选择要生成的平台（可多选）：
□ Ghost（innomad-image-upload 上传本地配图 + 回填 cover_image，需已在 /inm-review 生成配图）
□ X（单条长文，参照 inm-x-optimizer 原则，提供 A/B/C 三个方向）
□ 小红书（口语化 + baoyu-xhs-images 生成配图）
□ 公众号（标题优化 + 段落适配 + 移除代码块）
```

> **风格优化在此步执行**（review 阶段不做风格改写）：X 和公众号版本会根据 `writing-style-guide.md` 优化开头（极快切入）和结尾（金句收束 + 留白），Ghost 版本不做改写。

**各平台输出：**

| 平台 | 风格改写 | 附加操作 | 输出文件 |
|------|---------|---------|---------|
| Ghost | 无（主文章即正文） | innomad-image-upload 上传 `posts/{slug}/imgs/` + 封面 → 替换本地路径为 CDN URL + 回填 cover_image | — |
| X | 风格优化（开头/结尾）+ 单条长文，参照 `inm-x-optimizer` 原则：Hook + 核心观点 + 金句，附 `[BLOG_URL]`，提供 A/B/C 三个方向供选择 | — | `posts/{slug}/platforms/x.md` |
| 小红书 | 口语化，首段钩子，适当分段；emoji 视内容风格选用，不强制 | baoyu-xhs-images 生成配图 | `posts/{slug}/platforms/xiaohongshu.md` |
| 公众号 | 风格优化（开头/结尾）+ 标题优化，段落适配，移除代码块 | — | `posts/{slug}/platforms/wechat.md` |

每个平台生成完成后，将该平台追加到 frontmatter `platforms` 数组中。

### 第 4 步：发布

```bash
/inm-post-to-ghost   # 发布到 Ghost，成功后确保 platforms 含 ghost，status → published
/inm-post-to-x       # 发布到 X，成功后确保 platforms 含 x
/baoyu-post-to-wechat  # 发布到公众号（不改动此 skill）
```

小红书手动发布，完成后手动将 `xiaohongshu` 追加到 `platforms` 数组。
公众号发布后手动将 `wechat` 追加到 `platforms` 数组。

---

## Skill 清单

| Skill | 状态 | 说明 |
|-------|------|------|
| `inm-review` | 新建 | 语言校对 + 事实核查 + frontmatter + 配图建议（只纠错不改写）；可选：调用配图/封面生成 skill |
| `inm-distribute` | 新建 | 多平台分发 + 风格优化（X/公众号），持有 `writing-style-guide.md`，支持参数/自然语言/交互选择 |
| `inm-post-to-ghost` | 微调 | 新增：发布成功后追加 `ghost` 到 `platforms` 数组，`status` → `published`；`config.yaml` source_dir 更新为 `data/obsidian/30-Outputs/posts` |
| `inm-post-to-x` | 微调 | 新增：发布成功后追加 `x` 到 `platforms` 数组；输入文件改为 `posts/{slug}/platforms/x.md` |
| `baoyu-post-to-wechat` | 不动 | 上游 skill |
| `baoyu-xhs-images` | 不动 | 上游 skill，由 /inm-distribute 调用 |
| `baoyu-article-illustrator` | 不动 | 上游 skill，由 /inm-review（可选配图步骤）调用 |
| `baoyu-cover-image` | 不动 | 上游 skill，由 /inm-review（可选配图步骤）调用 |
| `innomad-image-upload` | 不动 | 现有 skill，由 /inm-distribute Ghost 调用 |
| `innomad-article-optimizer` | 废弃 | 职责由 /inm-review + /inm-distribute 取代 |
| `defuddle` | 安装 | 从 kepano/obsidian-skills 安装，网页提取干净 Markdown |
| `json-canvas` | 安装 | 从 kepano/obsidian-skills 安装，创建/编辑 .canvas 文件 |
| `obsidian-bases` | 安装 | 从 kepano/obsidian-skills 安装，创建/编辑 .base 数据库视图 |
| `obsidian-cli` | 安装 | 从 kepano/obsidian-skills 安装，CLI 与 Obsidian vault 交互 |
| `obsidian-markdown` | 安装 | 从 kepano/obsidian-skills 安装，Obsidian 风格 Markdown 语法 |

---

## 实现规范

### review 只纠错，不改写

`/inm-review` 只做最基础的纠错（错别字、语病、标点、事实错误），不做任何风格优化（开头/结尾改写、段落重构等）。原因：
- 保持作者原文原貌，review 是校对而非改写
- 风格优化是平台相关的（X 需要 Hook，公众号需要适配），应在 distribute 阶段按平台差异化处理
- Ghost 版本直接使用原文（纠错后），无需风格改写

### 风格优化在 distribute 执行

写作风格指南 `writing-style-guide.md` 由 `inm-distribute` 持有（`inm-distribute/references/writing-style-guide.md`），在 X 和公众号分发时读取并应用。`inm-review` 不持有也不引用此文件。

### 各 skill 独立，不依赖废弃 skill

`inm-review` 和 `inm-distribute` 各自持有所需的文件副本，**不引用** `innomad-article-optimizer` 的任何文件：
- `writing-style-guide.md` → 仅 `inm-distribute/references/` 持有一份
- `add_watermark.py` → `inm-review/scripts/`

`innomad-article-optimizer` 标记废弃后，其 `references/` 和 `scripts/` 保留但不再被新 skill 引用。

### Shell 路径使用运行时拼接

skill 中不写死绝对路径，运行时通过 `PROJECT_ROOT=$(git rev-parse --show-toplevel)` 获取项目根目录，所有路径基于 `${PROJECT_ROOT}` 变量拼接。

### 审稿报告文件名包含文章名

审稿报告命名为 `文章名_review-report.md`（而非 `inm-review-report.md`），支持多篇文章审稿报告在 `10-Drafts/` 中共存。

### 安装 kepano/obsidian-skills

从 [kepano/obsidian-skills](https://github.com/kepano/obsidian-skills) clone 并复制全部 5 个 skill（defuddle、json-canvas、obsidian-bases、obsidian-cli、obsidian-markdown）到 `.agents/skills/`，在 `.agents/SKILLS.md` 中登记来源。

### .claude/skills 符号链接

创建 `.claude/skills -> ../.agents/skills` 符号链接，让 Claude Code 能自动发现 `.agents/skills` 中的 skills。同时在 `.gitignore` 中排除 `.claude/*` 但保留 `.claude/skills`。

### data/obsidian 目录规范

`data/obsidian/` 是指向 iCloud Obsidian vault 的符号链接，由用户手动维护。skill 中禁止用 `mkdir` 创建 `10-Drafts/`、`30-Outputs/` 等 Obsidian vault 目录——如果符号链接失效导致目录不存在，应报错提示用户修复，而不是自行创建。

### 废弃 innomad-article-optimizer

在 `innomad-article-optimizer/SKILL.md` 顶部添加废弃说明，指向 `inm-review` + `inm-distribute`。在 `.agents/SKILLS.md` 中标注为已废弃。

### 更新 .agents/SKILLS.md

添加 `inm-review` 和 `inm-distribute` 条目，标注 `innomad-article-optimizer` 为已废弃。

---

## Git 追踪策略

| 路径 | 追踪 | 说明 |
|------|------|------|
| `creator/.agents/skills/` | ✅ | 所有 skill 代码 |
| `creator/posts/` | ❌ gitignored | 工作目录，临时产物 |
| `data/obsidian/30-Outputs/posts/` | iCloud 同步 | 正式文章归档，Obsidian 管理 |
| `data/obsidian/10-Drafts/文章名_reviewed.md` | ❌ 临时 | 确认后删除 |
| `data/obsidian/10-Drafts/文章名_review-report.md` | ❌ 临时 | 确认后删除 |

---

## 待实现（实现阶段提供）

- Notion 现有内容迁移：database 结构、字段映射、存量规模
- Ghost 实例地址及 Admin API Key
- AGENTS.md 更新：搜索路径从 `01-Drafts` → `10-Drafts`
