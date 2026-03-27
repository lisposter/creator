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
