---
name: inm-review
description: AI 审稿：语言校对 + 事实核查 + frontmatter 生成 + 配图/封面建议。只纠错，不改写风格。在 data/obsidian/10-Drafts/ 查找文章，先展示审稿建议，用户确认后才生成 reviewed.md；需要保存报告时输出 review-report.md。当用户提到「审稿」「review」「校对」「核查」时使用。
---

# AI 审稿 (Article Review)

对 Obsidian 草稿进行语言校对、事实核查和 frontmatter 生成。**核心原则：只纠错，不改写。**

## 确认边界

- 审稿请求授权查错、核查和提出修改；**用户确认本轮具体修改前，不创建或更新 `*_reviewed.md`，也不改源稿**。
- 不提前把完整修订稿写到临时目录、其他文件名或其他平台版本中。确认前在对话中展示建议、局部 diff 和 frontmatter 提案。
- 用户已在当前会话确认过的修改可以直接落盘，不重复询问；新的未确认修改继续保留为建议。只接受部分修改时，最终稿只应用已接受项。
- 不移动、改动或删除 `data/obsidian/30-Outputs/` 中的任何文件，也不因完成审稿而删除原稿。

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
- [ ] Step 5: 拟定 frontmatter（不落盘）
- [ ] Step 6: 展示审稿建议、局部 diff 和配图建议
- [ ] Step 7: 用户确认具体修改
- [ ] Step 8: 生成 reviewed.md
```

**交互点**：Step 7。完成可评审的修改建议后等待确认；收到确认再执行 Step 8。

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

技术类比、强凑金句或不能帮助读者理解的聪明话，可以指出并给出删减建议；不要借审稿改写成另一种文风。保留事实、机制和有依据的判断，确认后才应用建议。

---

## Step 3: 事实核查

通过 WebSearch 核查文章中的**具体数据、人名、日期、引用**。

### 核查分类

| 严重度 | 标记 | 说明 | 处理 |
|--------|------|------|------|
| 严重 | 🔴 | 数据明确错误，可能误导读者 | 提出可发布的修正文本及来源，确认后写入 reviewed.md |
| 中等 | 🟡 | 数据可能过时或来源不明确 | 提议补充日期、来源或限定语，确认后写入正文 |
| 轻微 | 🟢 | 表述略有偏差但不影响理解 | 仅在审稿建议中记录 |

### 核查要点

- 金融数据：股价、收益率、费率、市值等是否准确（标注数据日期）
- 人名/公司名：拼写是否正确
- 历史日期：事件发生时间是否准确
- 引用/出处：引文是否存在、是否被正确归属
- 统计数据：百分比、数量级是否合理

### 确认后生成的 Reviewed 正文要求

- `*_reviewed.md` 必须是可直接发布/分发的干净稿件。
- 不要在正文里插入批注、说明标签或审稿痕迹，例如「事实核查补充」「待确认」「需核查」、脚注式审稿说明、`⚠️` 标记。
- 用户接受的事实补充自然地并入原句或相邻段落；审稿修改理由和核查记录放在对话中的审稿建议或用户要求的 `*_review-report.md` 中。正文保留影响理解和判断的来源、日期与必要限定。

---

## Step 4: 配图建议

分析文章结构，建议适合插图的位置。**此步骤不生成图片**，仅输出建议。

每条建议包含：
- **位置**：建议插入的段落/标题后
- **类型**：数据图表 / 概念图 / 流程图 / 对比图 / 示意图
- **说明**：图片应展示的内容
- **后续工具**：表格图片流程 / `inm-cover-image` / 手动配图

---

## Step 5: 拟定 Frontmatter

根据文章内容拟定完整 frontmatter，在 Step 6 中展示；确认前不写入文件。保留原有准确字段，避免无关改动：

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
cover_image: ""  # 无封面时留空；后续在分发工作副本中填入
status: reviewed  # 仅在用户确认、生成 reviewed 文件时生效
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

## Step 6: 展示审稿建议

先在对话中给出以下内容，不需要生成 reviewed 文件才能展示差异：

1. **语言修正**：位置、原文、建议修正、理由。
2. **事实核查**：待核查内容、核查结论、严重度、来源链接和数据日期；无法核实的内容明确列出，不编造结论。
3. **局部 diff**：用 Markdown diff 展示有变动的段落，包含拟议的 frontmatter 改动。
4. **配图/封面建议**：位置、类型、展示内容和建议工具；此阶段不生成图片。

默认在对话中展示；用户要求保存报告时，可在 `10-Drafts/` 生成 `文章名_review-report.md`。报告记录建议和局部 diff，不作为完整修订稿的替代文件。

---

## Step 7: 用户确认具体修改

请用户确认上一步展示的修改范围。未收到确认时停在建议阶段；用户继续提意见时更新建议，不生成 reviewed 文件。收到对已展示修改的确认后，直接执行 Step 8。

---

## Step 8: 确认后生成 Reviewed

在 `${PROJECT_ROOT}/data/obsidian/10-Drafts/文章名_reviewed.md` 写入用户已接受的修改：

- 包含确认后的 frontmatter，`status: reviewed`。
- 正文为干净稿件，不包含审稿批注或核查标记。
- 保留原文的内容顺序、结构和口吻，只应用已确认修改。
- 若源文在审稿期间被用户编辑，保留新编辑，只应用仍匹配且已确认的改动；冲突部分重新展示确认。
- 保留原稿和已有报告，不自动归档、删除文件或创建无关工作目录。

完成后给出 reviewed 文件路径和已接受的修改摘要。后续分发可直接使用这份已确认的 reviewed 稿；不需要先移动到 `30-Outputs/`。
