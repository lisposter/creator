---
name: innomad-article-optimizer
description: 优化 Obsidian 文章并为社交媒体传播做准备。从 data/obsidian 的 01-Drafts 或 30-Outputs 查找文章，优化内容使其更适合 X 平台传播，保留原有文风，调整开头和结尾，添加 DYOR 免责声明，然后调用 baoyu-article-illustrator 配图、baoyu-cover-image 生成封面，最后调用 innomad-image-upload 上传所有本地图片并替换为远程 URL。
---

# 文章优化器 (Article Optimizer)

从 Obsidian 笔记中查找文章，优化内容使其更适合社交媒体传播，自动生成配图和封面，并上传所有本地图片到图床。

## 使用方法

```bash
# 基本用法：提供文章名字
/innomad-article-optimizer 我的文章标题

# 指定输出目录
/innomad-article-optimizer 我的文章标题 --output ./posts/

# 跳过配图，只优化文章
/innomad-article-optimizer 我的文章标题 --no-illustrations

# 跳过封面
/innomad-article-optimizer 我的文章标题 --no-cover

# 跳过图片上传
/innomad-article-optimizer 我的文章标题 --no-upload
```

## 工作流程

```
Progress:
- [ ] Step 1: 查找文章 & 前置配置（一次性确认：标题 + 平台 + 水印）
- [ ] Step 2: 优化内容 & 事实核查 + Frontmatter 生成
- [ ] Step 3: 展示 diff + 核查报告 → 用户确认
- [ ] Step 4: 生成文章配图 & 原图水印（可选）
- [ ] Step 5: 生成封面 (baoyu-cover-image)
- [ ] Step 6: 上传图片到图床 (innomad-image-upload)
- [ ] Step 7: 完成报告
```

**交互点**：仅 2 次中断——Step 1（前置配置）和 Step 3（确认修改），其余步骤自动执行。

---

## Step 1: 查找文章

### 1.1 搜索位置

按以下顺序在 `data/obsidian` 目录下搜索：

```bash
# 搜索顺序（优先级从高到低）
data/obsidian/01-Drafts/
data/obsidian/30-Outputs/
data/obsidian/           # 递归搜索整个目录
```

### 1.2 匹配规则

| 匹配类型 | 描述 | 示例 |
|----------|------|------|
| 精确匹配 | 文件名完全匹配（不含扩展名） | "AI投资指南" → `AI投资指南.md` |
| 模糊匹配 | 文件名包含关键词 | "AI投资" → `AI投资指南详解.md` |
| 多结果 | 找到多个匹配时列出供用户选择 | 使用 AskUserQuestion |

### 1.3 搜索命令

```bash
# 精确匹配
find data/obsidian/01-Drafts/ data/obsidian/30-Outputs/ -name "*${ARTICLE_NAME}*.md" 2>/dev/null | head -10

# 如果没找到，扩展搜索
find data/obsidian -name "*${ARTICLE_NAME}*.md" 2>/dev/null | head -10
```

### 1.4 未找到处理

如果未找到文章：
1. 列出 `01-Drafts` 和 `30-Outputs` 中的所有 `.md` 文件
2. 使用 AskUserQuestion 让用户选择或重新输入

### 1.5 前置配置（一次性确认） ⚠️ REQUIRED

找到文章并读取内容后，使用 **一次** AskUserQuestion 完成所有前置确认，后续流程不再中断直到 Step 3 展示 diff：

```
问题 1：选择文章标题（封面图将使用此标题）
选项（基于原文内容生成 6-8 个，每个方向 2 个）：
- [ ] {标题 1}（直接型：清晰说明文章内容）
- [ ] {标题 2}（直接型）
- [ ] {标题 3}（问题型：以问题引发好奇）
- [ ] {标题 4}（问题型）
- [ ] {标题 5}（轻松型：口语化、亲和力强）
- [ ] {标题 6}（数据型：用具体数据吸引注意）

问题 2：目标发布平台（多选）
- [ ] X（表格转列表，生成 article-x.md）
- [ ] Ghost 博客（保留表格）
- [ ] 微信公众号（保留表格）

问题 3：是否给文章原有配图添加文字水印平铺？
- [ ] 不添加水印（默认）
- [ ] 添加水印
```

**说明**：
- 标题用于更新文章一级标题和封面生成
- 目标平台决定是否生成 `article-x.md`（X 版：表格转列表）
- 水印仅针对文章原有配图（非 AI 生成的插图/封面）
- 配图和封面默认生成，可通过命令行 `--no-illustrations` `--no-cover` 跳过

### 1.6 依赖检查 ⚠️ REQUIRED

在开始优化前，一次性检查所有依赖 skill 的 EXTEND.md 是否存在，缺失的在此阶段统一完成首次设置，**避免后续步骤中途中断**：

```bash
test -f .baoyu-skills/baoyu-article-illustrator/EXTEND.md && echo "illustrator ok"
test -f .baoyu-skills/baoyu-cover-image/EXTEND.md && echo "cover ok"
```

如有缺失，立即完成对应 skill 的首次设置（读取其 `references/config/first-time-setup.md`），全部就绪后再进入 Step 2。

### 1.7 输出目录冲突检测

```bash
test -d posts/{slug} && echo "exists"
```

如果目录已存在且包含 `article.md`：
1. 备份为 `article-prev-YYYYMMDD-HHMMSS.md`
2. 提醒用户该目录已有旧版本

---

## Step 2: 优化内容

### 2.1 优化原则

> **⚠️ 写作风格参考**：优化前必须读取完整风格指南 `references/writing-style-guide.md`（位于本 skill 目录下），确保优化后的文章符合一挪迈的写作风格。

| 原则 | 描述 |
|------|------|
| **保留文风** | 严格遵循 `references/writing-style-guide.md` 中定义的语调、结构、论证风格 |
| **保留图片** | 保留原文中所有图片引用，位置和格式不变 |
| **不生成一级标题** | 文章正文不生成 `#` 一级标题，标题由 frontmatter 的 `title` 字段提供，段落标题从 `##` 开始 |
| **保留段落结构** | 不合并段落，不压缩空行，保持原文的段落间距和呼吸感 |
| **微调开头** | 按 2.2 指南优化，增加钩子感 |
| **优化结尾** | 按 2.3 指南优化，金句收束 + 留白 |
| **免责声明** | 投资类文章添加 DYOR（见 2.7） |
| **多平台输出** | 通用版保留表格，X 版表格转列表（见 2.4） |
| **文字校对** | 修正错别字、语病、标点符号错误 |

### 2.2 开头优化指南

严格按照 `references/writing-style-guide.md` 第二节「开头手法」执行：**极快切入，1-2 句话进正题**。

三种开场（按原文风格选择最匹配的）：
- **事件/新闻引入**：从一个具体事件或新闻快速切入主题
- **个人生活场景引入**：「今天杭州终于迎来一个好天气，AQI < 30」
- **直接抛出命题/问题**：「要攒够多少钱，才能说『我退休了』呢？」

**禁止**：不用「你有没有想过...」「90% 的人都忽略了...」等营销号套路开场。

### 2.3 结尾优化指南

严格按照 `references/writing-style-guide.md` 第四节「结尾手法」执行：

- 固定以**「一挪迈的思考」**或**「一挪迈的总结」**小节收尾
- 结尾极其精炼，用一句金句或开放式问题收束：
  - 「如果明天不用上班了，你第一件想做的事是什么？」
  - 「代码已死，编程永生。」
- **点到即止，留白给读者，不做冗长总结**
- 教程类文章可附相关阅读链接，形成内容矩阵

**禁止**：不用「欢迎转发」「评论区聊聊」等公众号式 CTA。

### 2.4 表格处理（多平台适配）

**通用版 `article.md`**：保留原始 Markdown 表格（Ghost、微信公众号均支持表格渲染）。

**X 平台版 `article-x.md`**：仅当用户在 Step 1.5 选择了 X 平台时生成。将所有表格转换为列表/分段形式：

| 转换方式 | 适用场景 | 示例 |
|----------|----------|------|
| **列表形式** | 简单的两列对比 | `- **项目A**: 描述内容` |
| **分段描述** | 复杂的多列表格 | 每行转为一个小段落 |
| **要点列表** | 特性/功能列表 | `- 特性1` `- 特性2` |
| **对比形式** | A vs B 类型 | 使用加粗分隔：**方案 A** vs **方案 B** |

**转换示例**：

原表格：
```markdown
| 方案 | 优点 | 缺点 |
|------|------|------|
| A | 快速 | 成本高 |
| B | 便宜 | 较慢 |
```

转换后：
```markdown
**方案对比**

**方案 A**
- 优点：快速
- 缺点：成本高

**方案 B**
- 优点：便宜
- 缺点：较慢
```

> **多平台说明**：表格转换仅用于 X 平台版本（`article-x.md`）。通用版 `article.md` 保留原表格，Ghost 和微信公众号均支持表格渲染。

### 2.5 文字校对

在优化过程中，仔细检查并修正：

| 类型 | 说明 | 示例 |
|------|------|------|
| **错别字** | 常见形近字、音近字错误 | "的地得" 混用、"在再" 混用 |
| **语病** | 语法错误、搭配不当、成分残缺 | "提高认识" 而非 "增加认识" |
| **标点符号** | 中英文标点混用、标点缺失 | 中文使用中文标点 |
| **专有名词** | 技术术语、产品名称拼写 | "GitHub" 而非 "Github" |

**记录所有修正**：每处修正都要记录，用于最后的修改报告。

### 2.6 标题层级调整

文章正文**不生成一级标题 `#`**，标题由 frontmatter 的 `slug` + 发布平台提供。

如果原文段落标题使用了 `#`，整体降级：`#` → `##`，`##` → `###`，以此类推。已从 `##` 开始则无需调整。

### 2.7 DYOR 免责声明（条件性）

仅当文章涉及**投资理财**内容时添加（如 ETF、股票、期权、FIRE、资产配置等）。纯技术教程、旅行攻略、AI 工具类文章不添加。

在文章末尾添加（使用分隔线隔开）：

```markdown
---

*本文仅供参考，不构成投资建议。投资有风险，请 DYOR (Do Your Own Research)。*
```

### 2.8 内容事实核查 ⚠️ REQUIRED

在优化内容的同时，必须对文章进行事实核查，检查以下维度的问题：

| 维度 | 检查内容 | 示例 |
|------|----------|------|
| **事实准确性** | 定义、数据、法规是否正确 | 数据是否过时、术语是否用错 |
| **逻辑连贯性** | 论证是否自洽、前后是否矛盾 | 前文说 A，后文暗示非 A |
| **常识性错误** | 概念混淆、因果错误 | 混淆"交易形式"和"投资策略" |
| **过时信息** | 数据、政策、产品是否已变化 | 引用 2 年前的市场数据 |
| **误导性表述** | 过于绝对或容易引起误解的说法 | "流动性非常高"（并非所有都高） |

**核查流程**：

1. **自检**：基于 Agent 自身知识，逐段检查上述 5 个维度
2. **Web 验证**：对于**事实性声明**（数据、数字、法规、产品特征等），使用 WebSearch 工具交叉验证
   - 搜索关键数据点是否正确（如市场规模、费率、交易规则等）
   - 验证专有名词拼写和定义
   - 确认引用的政策/规则是否仍有效
3. **标注严重程度**：

| 级别 | 标记 | 说明 |
|------|------|------|
| 严重 | 🔴 | 事实错误、数据错误、可能误导投资决策 |
| 中等 | 🟡 | 表述不够准确、过于绝对、可能引起误解 |
| 轻微 | 🟢 | 笔误、语法瑕疵、编号不连续等 |

4. **直接修正**：所有发现的问题在优化时一并修正，无需单独征求确认
5. **记录到修改记录**：每个修正点都记入 2.9 的修改记录，标注严重程度

**示例核查输出**（内部记录，最终合并到修改记录）：
```
🔴 "ADII" → "QDII"（拼写错误，不存在 ADII 这个金融缩写）
🔴 "全球 ETF 规模 10.7 万亿" → WebSearch 验证为 19.85 万亿（数据过时 2 年）
🟡 "有效市场假说→投资指数就能获取上升收益" → 因果关系不成立，EMH 支持的是被动优于主动
🟢 "比较上适合" → "比较适合"（笔误）
```

### 2.9 修改记录 ⚠️ REQUIRED

**在优化过程中，必须记录所有修改点**，用于 Step 3 展示和 Step 7 报告：

```markdown
修改记录示例：
1. 【开头】添加提问式引入："你是否曾经..."
2. 【结尾】添加互动引导 + DYOR 声明
3. 【表格→列表】第 3 段的功能对比表转为要点列表
4. 【错别字】"帐户" → "账户"（第 2 段）
5. 【错别字】"哪里" → "那里"（第 5 段）
6. 【语病】"增加了用户体验" → "提升了用户体验"（第 4 段）
7. 【标点】英文逗号改为中文逗号（第 3、6 段）
```

### 2.10 Frontmatter 与摘要生成 ⚠️ REQUIRED

优化完成后，为 `article.md` 生成 YAML frontmatter（格式与 Ghost CMS 对齐）：

```yaml
---
base: "[[00-Index.base]]"
cover_image: ""  # Step 6 上传后回填
date: {YYYY-MM-DD}
type: Post
password: ""
slug: "{kebab-case-slug}"
featured: false
tags:
  - "{tag1}"
  - "{tag2}"
tiers: []
summary: "{2-3 句话的文章摘要}"
category: "{Finance|Tech|Nomad}"
status: Published
---
```

**注意**：文章正文不生成 `#` 一级标题，标题由 Ghost 从 frontmatter 或发布时读取。

**Tags 生成规则**：
- 从文章内容自动提取 2-5 个标签
- 优先使用已有系列标签：`ETF开箱`、`投资理财`、`IBKR实操`、`AI工具`、`数字游民`
- 英文术语保留原文：`ETF`、`FIRE`、`IBKR` 等

**Summary 生成规则**：
- 2-3 句话，概括文章核心内容
- 符合一挪迈文风（口语化但不粗糙）
- 用于 Ghost 摘要、微信公众号摘要、X 分享文案

---

## Step 3: 用户确认 ⚠️ REQUIRED

**不要跳过此步骤。这是整个流程中第二次也是最后一次交互。**

### 3.0 生成 diff

保存优化后的文章到 `posts/{slug}/article.md` 后，使用 `diff -u` 命令生成原文与优化版的对比：

```bash
diff -u posts/{slug}/article-original.md posts/{slug}/article.md --label "原文" --label "优化后"
```

### 3.1 展示修改

向用户展示以下内容：

1. **事实核查报告**（来自 Step 2.8）：按严重程度分组列出所有发现的问题及修正
   - 🔴 严重问题（N 个）：逐条列出
   - 🟡 中等问题（N 个）：逐条列出
   - 🟢 轻微问题（N 个）：逐条列出
2. **diff 输出**：展示 `diff -u` 的完整结果，让用户看到所有修改的精确位置
3. **修改摘要表**：按类别汇总所有修改

```
| # | 严重程度 | 问题 | 原文 | 修正后 |
|---|----------|------|------|--------|
| 1 | 🔴 | ADII 拼写错误 | （ADII）A | （QDII）A |
| 2 | 🟡 | 流动性表述过于绝对 | 流动性非常高 | 主流 ETF 通常流动性较高 |
| ... | | | | |
```

4. **其他修改**：开头/结尾优化、表格转换、标题层级调整等
5. **Frontmatter 预览**：展示生成的 frontmatter（标题、tags、excerpt）

### 3.2 用户确认

使用 AskUserQuestion 确认：

```
确认选项：
- [ ] 满意，继续生成配图和封面
- [ ] 需要调整（提供反馈）
- [ ] 放弃优化，使用原文
```

### 3.3 输出格式

用户确认后，优化后的文章保存到新文件，保留原文件不动：

```
输入: data/obsidian/01-Drafts/原文章.md
输出: posts/{slug}/article.md          # 通用版（保留表格）
      posts/{slug}/article-x.md        # X 平台版（仅当选择了 X 平台）
      posts/{slug}/article-original.md  # 原文备份
```

**Slug 生成规则**：
- 从标题提取 2-4 个关键词
- 转为 kebab-case
- 示例："AI投资指南" → `ai-investment-guide`

---

## Step 4: 生成文章配图

### 4.1 调用 baoyu-article-illustrator

读取 `.agents/skills/baoyu-article-illustrator/SKILL.md` 并按其工作流执行（仅在 Step 1.6 依赖检查时未读过的情况下才读取完整 SKILL.md）：

**推荐参数**：
- Type: 根据文章内容自动选择（infographic/scene/flowchart）
- Density: balanced (3-5 张图)
- Style: 根据文章主题自动选择

**输入**：优化后的文章路径
**输出**：配图保存在 `posts/{slug}/imgs/`

### 4.2 插入新配图 ⚠️ REQUIRED

生成配图后，**必须将新生成的图片插入到优化后的文章中**：

1. 根据 `baoyu-article-illustrator` 返回的插入位置建议，将图片引用插入文章
2. 图片使用相对路径：`![](imgs/01-xxx.png)`
3. 插入位置应在相关段落附近，保持阅读流畅
4. 新图片与原文保留的图片共存，不替换原有图片

**示例**：
```markdown
本文就来开箱几个热门的高股息 ETF。

![](imgs/01-infographic-dividend-concept.png)   ← 新生成的配图

> 这里是一段引用...

![](https://example.com/original-image.png)    ← 原文保留的图片
```

### 4.3 原图水印处理（可选）

如果用户在 Step 1.5 选择了添加水印，在配图生成完成后，对**文章原有配图**执行水印处理：

**处理范围**：
- 仅处理文章中原有的图片（截图、照片等）
- **不处理** AI skill 生成的配图（baoyu-article-illustrator 生成的 `imgs/01-*.png` 等）
- **不处理** 封面图

**处理方式**：使用 Python Pillow 添加斜向平铺文字水印

**水印脚本**已集成到本 skill 目录：`.agents/skills/innomad-article-optimizer/scripts/add_watermark.py`

调用方式：

```bash
# SKILL_DIR 为本 skill 的目录路径
SKILL_DIR=".agents/skills/innomad-article-optimizer"
python3 ${SKILL_DIR}/scripts/add_watermark.py <input.png> <output.png>
```

脚本内置参数（如需修改请直接编辑脚本）：

| 参数 | 值 | 说明 |
|------|------|------|
| text | `Innomad 一挪迈（X: @innomad_io）` | 水印文本 |
| font_size | `max(24, image_width // 30)` | 自适应字号 |
| fill | `(120, 120, 120, 25)` | ~10% 透明度，极淡 |
| pad_x | `text_width * 1.2` | 水平间距（稀疏） |
| pad_y | `text_height * 5.0` | 垂直间距（稀疏） |
| angle | `30` | 正 30 度旋转角 |

> **注意**：此脚本为本 skill 内置的统一水印脚本，无需在项目根目录或其他位置创建。`posts/` 子目录下的旧副本为过期版本，应忽略。

**处理步骤**：
1. 下载/复制原图到 `posts/{slug}/imgs/` 并备份到 `imgs/original-screenshots/`
2. 用 ImageMagick 缩放到 2/3 宽度 + 白色背景居中 + box-shadow 阴影效果
3. 用 Python Pillow 添加斜向平铺水印
4. 更新文章中的图片引用为本地处理后的路径

**批量替换图片路径**：
- 处理完所有图片后，使用 Edit 工具的 `replace_all=true` 一次性替换所有相同前缀的路径
- 或使用 Bash `sed -i '' 's|old-prefix|new-prefix|g' article.md` 批量替换
- **禁止逐个文件逐个路径调用 Edit**——这会浪费大量 token。如果有 6 张图片需要从 `v1` 改为 `v2`，应用一条 sed 命令或按前缀分组使用 `replace_all`

### 4.4 跳过条件

如果用户指定 `--no-illustrations`，跳过配图生成（但水印处理仍可独立执行）。

---

## Step 5: 生成封面

### 5.1 调用 baoyu-cover-image

使用用户在 Step 1.5 选定的标题生成封面。

读取 `.agents/skills/baoyu-cover-image/SKILL.md` 并按其工作流执行（仅在 Step 1.6 依赖检查时未读过的情况下才读取完整 SKILL.md）：

**推荐参数**：
- Type: conceptual（概念型，适合大多数文章）
- Aspect: 16:9（适合 X 平台展示）
- Text: title-only（使用用户在 5.1 选择的标题）
- Quick: true（使用自动选择，加快流程）

**输入**：优化后的文章路径
**输出**：封面保存在 `posts/{slug}/cover.png`

> **注意**：封面图已通过 EXTEND.md 的 Safe Zone 指令确保核心内容集中在画面中心 70% 区域、边缘自然过渡，无需后处理 padding。

### 5.2 跳过条件

如果用户指定 `--no-cover`，跳过封面生成。

---

## Step 6: 上传图片到图床

所有图片处理（配图生成、封面生成、原图水印）全部完成后，调用 `innomad-image-upload` 将文章中的所有本地图片上传到图床，并替换 markdown 中的引用路径为远程 URL。

### 6.1 加载 skill

```bash
# 检查 skill 是否存在
test -f .agents/skills/innomad-image-upload/SKILL.md && echo "found"
```

### 6.2 上传范围

上传 `posts/{slug}/article.md` 中引用的**所有本地图片**，包括：

| 图片类型 | 来源 | 示例路径 |
|----------|------|----------|
| AI 生成配图 | baoyu-article-illustrator | `imgs/01-xxx.png` |
| 封面图 | baoyu-cover-image（Safe Zone） | `cover.png` |
| 原文配图（已处理） | 水印/缩放后的截图、照片 | `imgs/screenshot-xxx.png` |

**不上传**：已经是远程 URL 的图片（`http://` / `https://` 开头）。

### 6.3 调用 innomad-image-upload

读取 `.agents/skills/innomad-image-upload/SKILL.md` 并按其工作流执行：

```bash
# 上传文章中所有本地图片并替换路径
npx -y bun ${SKILL_DIR}/scripts/main.ts posts/{slug}/article.md --uploader piclist
```

其中 `${SKILL_DIR}` 替换为 `innomad-image-upload` skill 的实际目录路径。

**执行效果**：
- 脚本会解析 markdown，找到所有本地图片引用
- 逐一上传到图床（默认 PicList）
- 自动将 markdown 中的本地路径替换为返回的远程 URL

### 6.4 CDN 文件名去重 ⚠️ REQUIRED

GitHub 图床**不会覆盖同名文件**——PicList 检测到重复文件名时会直接返回已有文件的 URL，而不是上传新文件。因此：

1. **上传前检查**：如果文章是重新优化的旧文章（如已发布过的文章重新配图），图片文件名可能已存在于 CDN
2. **重命名策略**：给处理后的图片添加版本后缀再上传
   - 原名：`cover.png` → 改为 `{slug}_cover.png`（如 `ibkr-market-data_cover.png`）
   - 重新处理的截图：`screenshot-1.png` → `screenshot-v2-1.png`
3. **封面图**始终使用 `{slug}_cover.png` 或 `{slug}-v{N}_cover.png` 命名，避免通用名 `cover.png` 冲突

### 6.5 封面图单独上传

封面图 `cover.png` 通常不在 `article.md` 的正文中引用，需要**单独上传**获取远程 URL：

```bash
# 注意：封面图命名必须包含 slug，避免通用名冲突（见 6.4）
npx -y bun ${SKILL_DIR}/scripts/main.ts posts/{slug}/{slug}_cover.png --uploader piclist --json
```

将返回的远程 URL 记录下来，更新到 `article.md` 的 frontmatter `cover` 和 `cover_image` 字段。

### 6.6 上传失败处理

如果上传失败（如 PicGo 未启动、网络问题等）：
1. 提示用户检查 PicGo/PicList 是否已启动
2. 使用 AskUserQuestion 询问：
   - 重试上传
   - 跳过上传，保留本地路径
   - 手动处理

### 6.7 跳过条件

如果用户指定 `--no-upload`，跳过图片上传步骤。

---

## Step 7: 完成报告

### 7.1 输出结构

```
posts/{slug}/
├── article.md              # 优化后的文章（通用版，保留表格）
├── article-x.md            # X 平台版（表格转列表，仅选择 X 平台时生成）
├── article-original.md     # 原文备份
├── cover.png               # 封面图
└── imgs/                   # 文章配图
    ├── 01-xxx.png
    ├── 02-xxx.png
    └── ...
```

### 7.2 报告格式

```
✅ 文章优化完成

📁 输出目录: posts/{slug}/
📄 通用版: posts/{slug}/article.md
📄 X 版: posts/{slug}/article-x.md（如有）
🖼️ 封面: {封面远程 URL}
🎨 配图: {N} 张（已插入文章）
☁️ 图片上传: {已上传数}/{总数} 张已替换为远程 URL

---

📝 **Frontmatter**
- 标题：{title}
- Tags：{tag1}, {tag2}, {tag3}
- Excerpt：{excerpt}

📝 **修改详情**

**结构调整**
- 开头：{简述修改}
- 结尾：{简述修改}
- DYOR：{已添加 / 不适用（非投资类文章）}

**图片处理**
- 保留原文图片：{N} 张
- 新生成配图：{N} 张（已插入文章相应位置）

**图片上传**
- 上传工具：{PicGo/PicList/Custom}
- 文章内图片：{N} 张已替换为远程 URL
- 封面图：{远程 URL}

**表格处理** （如有）
- 通用版：保留原始表格
- X 版：第 X 段表格 → 转为列表/分段形式

**文字校对** （如有）
- 错别字："{原}" → "{改}"（第 X 段）
- 语病："{原句}" → "{改后}"（第 X 段）
- 标点符号：{描述修正}

---

下一步：
- 发布到 Ghost：/inm-post-to-ghost posts/{slug}/article.md
- 发布到 X：/inm-post-to-x posts/{slug}/article-x.md
- 发布到微信：/baoyu-post-to-wechat posts/{slug}/article.md
```

---

## Preferences (EXTEND.md)

```bash
# 检查配置文件
test -f .innomad-skills/innomad-article-optimizer/EXTEND.md && echo "project"
test -f "$HOME/.innomad-skills/innomad-article-optimizer/EXTEND.md" && echo "user"
```

### 可配置项

```markdown
# 默认输出目录
outputDir: posts/

# 默认配图密度
illustrationDensity: balanced

# 默认封面样式
coverType: conceptual
coverAspect: 16:9

# 免责声明文本（可自定义）
disclaimer: "*本文仅供参考，不构成投资建议。投资有风险，请 DYOR。*"

# 是否自动生成配图
autoIllustrate: true

# 是否自动生成封面
autoCover: true

# 是否自动上传图片到图床
autoUpload: true

# 水印文本（仅用于原文配图，AI 生成的图片不加水印）
# watermarkText: "Innomad一挪迈（X: @innomad_io）"
```

---

## 示例

### 示例 1: 基本用法

```
用户: /innomad-article-optimizer AI投资新手指南

Agent:
1. 在 data/obsidian/01-Drafts/ 找到 "AI投资新手指南.md"
2. 一次性确认：标题选择 + 目标平台(X+Ghost) + 不加水印
3. 优化内容 + 事实核查 + 生成 frontmatter/tags/excerpt
4. 展示 diff + 核查报告 → 用户确认
5. 生成 article.md（通用版）+ article-x.md（X 版）
6. 调用 baoyu-article-illustrator 生成 4 张配图
7. 调用 baoyu-cover-image 生成封面
8. 调用 innomad-image-upload 上传所有本地图片
9. 输出完成报告
```

### 示例 2: 只优化不配图

```
用户: /innomad-article-optimizer AI投资新手指南 --no-illustrations --no-cover

Agent:
1. 查找文章 → 一次性确认（标题 + 平台）
2. 优化内容
3. 展示 diff → 用户确认
4. 输出优化后的文章（无配图和封面）
```

---

## 依赖的 Skills

| Skill | 用途 | 必需 |
|-------|------|------|
| baoyu-article-illustrator | 生成文章配图 | 可选 |
| baoyu-cover-image | 生成封面 | 可选 |
| innomad-image-upload | 上传本地图片到图床 | 可选 |

### 子 Skill 快速调用参考

以下为常用子 skill 的直接调用命令，**无需每次重新读取子 skill 的完整 SKILL.md**。仅在首次设置（EXTEND.md 缺失）或遇到未知错误时才读取子 skill 的 SKILL.md。

**baoyu-image-gen**（配图 / 封面图片生成）：
```bash
SKILL_DIR=".agents/skills/baoyu-image-gen"
npx -y bun ${SKILL_DIR}/scripts/main.ts --promptfiles <prompt.md> --image <out.png> --ar 16:9 --quality 2k
# 可选参数：--provider google|openai|dashscope --ref <reference.png>
```

**baoyu-article-illustrator**（配图工作流）：
- 读取 `.agents/skills/baoyu-article-illustrator/SKILL.md` 获取分析和大纲流程
- EXTEND.md 路径：`.baoyu-skills/baoyu-article-illustrator/EXTEND.md`
- 图片生成最终调用上面的 baoyu-image-gen 命令

**baoyu-cover-image**（封面工作流）：
- 读取 `.agents/skills/baoyu-cover-image/SKILL.md` 获取 5 维度配置流程
- EXTEND.md 路径：`.baoyu-skills/baoyu-cover-image/EXTEND.md`
- 图片生成最终调用上面的 baoyu-image-gen 命令
- 封面已通过 EXTEND.md Safe Zone 指令确保内容不贴边，无需后处理 padding

**innomad-image-upload**（图片上传）：
```bash
SKILL_DIR=".agents/skills/innomad-image-upload"
# 上传 markdown 中所有本地图片并替换路径
npx -y bun ${SKILL_DIR}/scripts/main.ts <article.md> --uploader piclist
# 上传单个图片并获取 URL
npx -y bun ${SKILL_DIR}/scripts/main.ts <image.png> --uploader piclist --json
# 预览模式（不上传）
npx -y bun ${SKILL_DIR}/scripts/main.ts <article.md> --dry-run
```

---

## 触发词

以下短语会触发此 skill：

- "优化文章"
- "innomad-article-optimizer"
- "准备发布"
- "优化 XX 这篇文章"
- "帮我优化 Obsidian 里的文章"
