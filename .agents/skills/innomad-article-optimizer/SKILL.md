---
name: innomad-article-optimizer
description: 优化 Obsidian 文章并为社交媒体传播做准备。从 data/obsidian 的 00-Inbox 或 30-Blog 查找文章，优化内容使其更适合 X 平台传播，保留原有文风，调整开头和结尾，添加 DYOR 免责声明，然后调用 baoyu-article-illustrator 配图、baoyu-cover-image 生成封面，最后调用 innomad-image-upload 上传所有本地图片并替换为远程 URL。
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
- [ ] Step 1: 查找文章 & 前置确认
- [ ] Step 2: 优化内容
- [ ] Step 3: 用户确认优化结果
- [ ] Step 4: 生成文章配图 & 原图水印（可选）
- [ ] Step 5: 优化标题 → 用户选择 → 生成封面 (baoyu-cover-image)
- [ ] Step 6: 上传图片到图床 (innomad-image-upload)
- [ ] Step 7: 完成报告
```

---

## Step 1: 查找文章

### 1.1 搜索位置

按以下顺序在 `data/obsidian` 目录下搜索：

```bash
# 搜索顺序（优先级从高到低）
data/obsidian/00-Inbox/
data/obsidian/30-Blog/
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
find data/obsidian/00-Inbox data/obsidian/30-Blog -name "*${ARTICLE_NAME}*.md" 2>/dev/null | head -10

# 如果没找到，扩展搜索
find data/obsidian -name "*${ARTICLE_NAME}*.md" 2>/dev/null | head -10
```

### 1.4 未找到处理

如果未找到文章：
1. 列出 `00-Inbox` 和 `30-Blog` 中的所有 `.md` 文件
2. 使用 AskUserQuestion 让用户选择或重新输入

### 1.5 前置确认：水印选项 ⚠️ REQUIRED

找到文章后、开始优化前，使用 AskUserQuestion 询问用户是否需要给**原文自带的图片**添加文字水印平铺：

```
问题：是否给文章原有配图添加文字水印平铺？
选项：
- [ ] 不添加水印（默认）
- [ ] 添加水印
```

**说明**：
- 水印**仅针对文章原有配图**（非 AI skill 生成的插图/封面），即原文中已有的截图、照片等
- AI 生成的配图（baoyu-article-illustrator）和封面（baoyu-cover-image）不添加水印
- 如果用户选择添加，在 Step 4 配图完成后统一处理
- 水印文本从 EXTEND.md 的 `watermarkText` 配置读取，未配置则使用默认值

---

## Step 2: 优化内容

### 2.1 优化原则

| 原则 | 描述 |
|------|------|
| **保留文风** | 不大改原有风格，保持作者的语言特色 |
| **保留图片** | 保留原文中所有图片引用，位置和格式不变 |
| **标题层级** | 段落标题从二级标题（`##`）开始，一级标题（`#`）仅用于文章主标题 |
| **微调开头** | 使开头更吸引人，增加钩子感 |
| **优化结尾** | 埋入互动钩子，引导读者行动 |
| **添加免责声明** | 投资 DYOR 免责声明（简短版） |
| **社交优化** | 针对 X 平台优化，适合传播 |
| **表格转换** | 将表格转换为其他格式（X 不支持表格） |
| **文字校对** | 修正错别字、语病、标点符号错误 |

### 2.2 开头优化指南

| 技巧 | 示例 |
|------|------|
| 提问式开头 | "你有没有想过..." / "为什么..." |
| 数据驱动 | "90% 的投资者都忽略了..." |
| 反直觉 | "大多数人认为 X，但实际上..." |
| 故事引入 | "上周，我发现了一个..." |
| 痛点共鸣 | "如果你也曾..." |

**注意**：选择与原文风格最匹配的方式，不要强行改变。

### 2.3 结尾优化指南

| 技巧 | 示例 |
|------|------|
| 行动号召 | "如果觉得有用，欢迎转发给需要的朋友" |
| 互动引导 | "你怎么看？评论区聊聊" |
| 预告钩子 | "下一篇我会深入聊..." |
| 总结金句 | 提炼一句可传播的总结 |

### 2.4 表格转换指南

X 平台不支持 Markdown 表格，必须将所有表格转换为其他格式：

| 转换方式 | 适用场景 | 示例 |
|----------|----------|------|
| **列表形式** | 简单的两列对比 | `- **项目A**: 描述内容` |
| **分段描述** | 复杂的多列表格 | 每行转为一个小段落 |
| **要点列表** | 特性/功能列表 | `✅ 特性1` `✅ 特性2` |
| **对比形式** | A vs B 类型 | 使用 emoji 分隔：`🔵 A方案` vs `🟢 B方案` |

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

🔵 **方案 A**
- 优点：快速
- 缺点：成本高

🟢 **方案 B**
- 优点：便宜
- 缺点：较慢
```

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

如果原文的段落标题使用了一级标题（`#`），需要整体降级：

| 原层级 | 调整后 |
|--------|--------|
| `#` 段落标题 | `##` |
| `##` 子标题 | `###` |
| `###` 小标题 | `####` |

**规则**：
- 一级标题 `#` 仅保留给文章主标题（即文章名称）
- 正文中的所有段落标题从 `##` 开始
- 如果原文已经从 `##` 开始，则无需调整

### 2.7 DYOR 免责声明

在文章末尾添加（使用分隔线隔开）：

```markdown
---

*本文仅供参考，不构成投资建议。投资有风险，请 DYOR (Do Your Own Research)。*
```

### 2.8 修改记录 ⚠️ REQUIRED

**在优化过程中，必须记录所有修改点**，用于 Step 3 展示和 Step 6 报告：

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

---

## Step 3: 用户确认 ⚠️ REQUIRED

**不要跳过此步骤。**

展示优化后的文章关键变化，使用 AskUserQuestion 确认：

```
展示内容：
1. 原开头 vs 新开头（对比）
2. 原结尾 vs 新结尾（对比）
3. 表格转换情况（如有）
4. 错别字/语病修正列表（如有）
5. 其他主要修改点

确认选项：
- [ ] 满意，继续生成配图
- [ ] 需要调整（提供反馈）
- [ ] 放弃优化，使用原文
```

### 3.1 输出格式

用户确认后，优化后的文章保存到新文件，保留原文件不动：

```
输入: data/obsidian/00-Inbox/原文章.md
输出: posts/{slug}/article.md
```

**Slug 生成规则**：
- 从标题提取 2-4 个关键词
- 转为 kebab-case
- 示例："AI投资指南" → `ai-investment-guide`

---

## Step 4: 生成文章配图

### 4.1 加载 skill

```bash
# 检查 skill 是否存在
test -f .omo/skills/baoyu-article-illustrator/SKILL.md && echo "found"
```

### 4.2 调用 baoyu-article-illustrator

读取 `.omo/skills/baoyu-article-illustrator/SKILL.md` 并按其工作流执行：

**推荐参数**：
- Type: 根据文章内容自动选择（infographic/scene/flowchart）
- Density: balanced (3-5 张图)
- Style: 根据文章主题自动选择

**输入**：优化后的文章路径
**输出**：配图保存在 `posts/{slug}/imgs/`

### 4.3 插入新配图 ⚠️ REQUIRED

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

### 4.4 原图水印处理（可选）

如果用户在 Step 1.5 选择了添加水印，在配图生成完成后，对**文章原有配图**执行水印处理：

**处理范围**：
- 仅处理文章中原有的图片（截图、照片等）
- **不处理** AI skill 生成的配图（baoyu-article-illustrator 生成的 `imgs/01-*.png` 等）
- **不处理** 封面图

**处理方式**：使用 Python Pillow 添加斜向平铺文字水印

```python
# 水印参数
text = watermarkText  # 从 EXTEND.md 读取，或默认值
font_size = max(24, image_width // 30)
fill = (80, 80, 80, 72)  # ~28% 透明度深灰色
pad_x = text_width * 0.4  # 水平间距
pad_y = text_height * 2.5  # 垂直间距
angle = 30  # 正 30 度角

# CJK 字体路径优先级（macOS）
fonts = [
    "/Library/Fonts/Arial Unicode.ttf",
    "/System/Library/Fonts/STHeiti Medium.ttc",
    "/System/Library/Fonts/PingFang.ttc",
]
```

**处理步骤**：
1. 下载/复制原图到 `posts/{slug}/imgs/` 并备份到 `imgs/original-screenshots/`
2. 用 ImageMagick 缩放到 2/3 宽度 + 白色背景居中 + box-shadow 阴影效果
3. 用 Python Pillow 添加斜向平铺水印
4. 更新文章中的图片引用为本地处理后的路径

### 4.5 跳过条件

如果用户指定 `--no-illustrations`，跳过配图生成（但水印处理仍可独立执行）。

---

## Step 5: 优化标题 → 生成封面

### 5.1 优化标题 ⚠️ REQUIRED

在生成封面之前，先提供 6-8 个标题建议供用户选择，使用 AskUserQuestion：

**标题方向**（每个方向 2 个）：

| 方向 | 说明 |
|------|------|
| **直接型** | 清晰说明文章内容 |
| **问题型** | 以问题引发好奇 |
| **数据型** | 用具体数据吸引注意 |
| **轻松型** | 口语化、亲和力强 |

```
问题：选择文章标题（封面图将使用此标题）
选项：
- [ ] {标题 1}（直接型）
- [ ] {标题 2}（问题型）
- [ ] {标题 3}（轻松型）
- [ ] {标题 4}（数据型）
```

用户选择后：
1. 更新文章的一级标题为用户选择的标题
2. 使用该标题生成封面图

### 5.2 加载 skill

```bash
# 检查 skill 是否存在
test -f .omo/skills/baoyu-cover-image/SKILL.md && echo "found"
```

### 5.3 调用 baoyu-cover-image

读取 `.omo/skills/baoyu-cover-image/SKILL.md` 并按其工作流执行：

**推荐参数**：
- Type: conceptual（概念型，适合大多数文章）
- Aspect: 16:9（适合 X 平台展示）
- Text: title-only（使用用户在 5.1 选择的标题）
- Quick: true（使用自动选择，加快流程）

**输入**：优化后的文章路径
**输出**：封面保存在 `posts/{slug}/cover.png`

### 5.4 封面图 Padding 处理 ⚠️ REQUIRED

X 平台会裁切封面图，内容贴边会被截断。生成封面后**必须**添加四周 padding：

**处理步骤**：

```bash
# 1. 采样背景色（从左上角像素取色）
BG_COLOR=$(magick cover.png -format "%[pixel:p{10,10}]" info:)

# 2. 计算 16:9 padding 后的尺寸（四周各加 ~14% padding）
# 原始宽度 × 1.28 = 新宽度，新高度 = 新宽度 × 9 / 16
# 示例：2752x1536 → 3520x1980（左右各+384px，上下各+222px）

# 3. 扩展画布，居中原图
magick cover.png -gravity center -background "$BG_COLOR" -extent ${NEW_W}x${NEW_H} cover.png
```

**要点**：
- 四周至少留 10-15% 的边距，确保 X 裁切后内容完整
- 最终尺寸必须保持 **16:9** 比例
- 背景色从原图角落采样，保证无缝衔接

### 5.5 跳过条件

如果用户指定 `--no-cover`，跳过封面生成（但标题优化 5.1 仍然执行）。

---

## Step 6: 上传图片到图床

所有图片处理（配图生成、封面生成与 padding、原图水印）全部完成后，调用 `innomad-image-upload` 将文章中的所有本地图片上传到图床，并替换 markdown 中的引用路径为远程 URL。

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
| 封面图 | baoyu-cover-image（含 padding） | `cover.png` |
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

### 6.4 封面图单独上传

封面图 `cover.png` 通常不在 `article.md` 的正文中引用，需要**单独上传**获取远程 URL：

```bash
npx -y bun ${SKILL_DIR}/scripts/main.ts posts/{slug}/cover.png --uploader piclist --json
```

将返回的远程 URL 记录下来，用于完成报告中展示。

### 6.5 上传失败处理

如果上传失败（如 PicGo 未启动、网络问题等）：
1. 提示用户检查 PicGo/PicList 是否已启动
2. 使用 AskUserQuestion 询问：
   - 重试上传
   - 跳过上传，保留本地路径
   - 手动处理

### 6.6 跳过条件

如果用户指定 `--no-upload`，跳过图片上传步骤。

---

## Step 7: 完成报告

### 7.1 输出结构

```
posts/{slug}/
├── article.md              # 优化后的文章
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
📄 优化文章: posts/{slug}/article.md
🖼️ 封面: {封面远程 URL}
🎨 配图: {N} 张（已插入文章）
☁️ 图片上传: {已上传数}/{总数} 张已替换为远程 URL

---

📝 **修改详情**

**结构调整**
- 开头：{简述修改，如 "添加提问式引入"}
- 结尾：{简述修改，如 "添加互动引导"}
- 添加：DYOR 免责声明

**图片处理**
- 保留原文图片：{N} 张
- 新生成配图：{N} 张（已插入文章相应位置）

**图片上传**
- 上传工具：{PicGo/PicList/Custom}
- 文章内图片：{N} 张已替换为远程 URL
- 封面图：{远程 URL}

**表格转换** （如有）
- 第 X 段：{表格内容} → 转为列表/分段形式

**文字校对** （如有）
- 错别字：
  - "{原}" → "{改}"（第 X 段）
  - "{原}" → "{改}"（第 X 段）
- 语病：
  - "{原句}" → "{改后}"（第 X 段）
- 标点符号：
  - {描述修正，如 "统一使用中文标点"}

---

下一步：
- 预览文章：cat posts/{slug}/article.md
- 发布到 X：/baoyu-post-to-x posts/{slug}/article.md
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
1. 在 data/obsidian/00-Inbox/ 找到 "AI投资新手指南.md"
2. 优化开头：添加提问式引入
3. 优化结尾：添加互动引导 + DYOR 声明
4. 展示对比，等待用户确认
5. 调用 baoyu-article-illustrator 生成 4 张配图
6. 调用 baoyu-cover-image 生成封面
7. 调用 innomad-image-upload 上传所有本地图片，替换为远程 URL
8. 输出完成报告
```

### 示例 2: 只优化不配图

```
用户: /innomad-article-optimizer AI投资新手指南 --no-illustrations --no-cover

Agent:
1. 查找文章
2. 优化内容
3. 用户确认
4. 输出优化后的文章（无配图和封面）
```

---

## 依赖的 Skills

| Skill | 用途 | 必需 |
|-------|------|------|
| baoyu-article-illustrator | 生成文章配图 | 可选 |
| baoyu-cover-image | 生成封面 | 可选 |
| innomad-image-upload | 上传本地图片到图床 | 可选 |

---

## 触发词

以下短语会触发此 skill：

- "优化文章"
- "innomad-article-optimizer"
- "准备发布"
- "优化 XX 这篇文章"
- "帮我优化 Obsidian 里的文章"
