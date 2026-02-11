# Innomad Creator

Innomad 一挪迈内容创作工作台 — 基于 Claude Code + AI Skills 的博客内容生产、优化与发布流水线。

## 目录结构

```
creator/
├── CLAUDE.md                 # Claude Code 入口指令（→ 强制读取 AGENTS.md）
├── AGENTS.md                 # AI Agent 总指南：品牌身份、内容风格、行为规范
├── .env                      # API Keys（Google Gemini / OpenAI / DashScope）
│
├── .agents/
│   ├── skills/               # 所有 AI Skills（git tracked）
│   │   ├── baoyu-*           # 上游 skills（来自 JimLiu/baoyu-skills）
│   │   └── innomad-*         # 自有 skills
│   └── UPSTREAM-SYNC.md      # 上游同步 & 品牌风格扩展方案
│
├── .baoyu-skills/            # baoyu-* skills 的项目级配置（EXTEND.md）
├── .innomad-skills/          # innomad-* skills 的项目级配置（EXTEND.md）
│
├── .claude/
│   └── settings.local.json   # Claude Code 权限配置
│
├── data/
│   └── obsidian -> iCloud    # Obsidian Vault（符号链接，git ignored）
│
└── posts/                    # 文章产出目录（git ignored）
    └── {slug}/
        ├── article.md        # 优化后的文章
        ├── article-original.md
        ├── imgs/             # 配图（水印处理后）
        └── *_cover.png       # 封面图
```

## Skills 概览

### 上游 Skills（baoyu-*）

从 [JimLiu/baoyu-skills](https://github.com/JimLiu/baoyu-skills) 同步，**不做任何修改**。

| Skill | 用途 |
|-------|------|
| `baoyu-article-illustrator` | 文章配图（Type × Style 二维体系） |
| `baoyu-cover-image` | 封面图生成 |
| `baoyu-image-gen` | AI 图片生成后端（Gemini / OpenAI / DashScope） |
| `baoyu-post-to-x` | 发布到 X (Twitter) |
| `baoyu-post-to-wechat` | 发布到微信公众号 |
| `baoyu-markdown-to-html` | Markdown → 样式化 HTML |
| `baoyu-format-markdown` | Markdown 格式化 |
| `baoyu-compress-image` | 图片压缩（WebP/PNG） |
| `baoyu-infographic` | 信息图生成 |
| `baoyu-xhs-images` | 小红书图片生成 |
| `baoyu-slide-deck` | 幻灯片生成 |
| `baoyu-comic` | 知识漫画生成 |
| `baoyu-url-to-markdown` | 网页 → Markdown |
| `baoyu-danger-x-to-markdown` | X 推文 → Markdown |
| `baoyu-danger-gemini-web` | Gemini Web API 后端 |

### 自有 Skills（innomad-*）

| Skill | 用途 |
|-------|------|
| `innomad-article-optimizer` | 文章优化全流程（查找 → 优化 → 配图 → 封面 → 上传） |
| `innomad-image-upload` | 本地图片上传图床（PicList），替换 Markdown 中的路径 |

## 核心工作流

### 文章优化发布（innomad-article-optimizer）

```
1. 从 Obsidian Vault 查找文章
2. 优化内容（开头 hook、结尾栏目、DYOR、格式修正）
3. 用户确认优化内容
4. 生成配图（baoyu-article-illustrator）+ 水印处理原图
5. 生成封面（baoyu-cover-image）+ X 平台 padding
6. 上传所有图片到图床（innomad-image-upload）
7. 输出完成报告
```

### 单独配图

```
/baoyu-article-illustrator <文章路径>
```

### 单独生成封面

```
/baoyu-cover-image <文章标题>
```

## Innomad 品牌风格体系

在 `baoyu-article-illustrator` 上游的 21 种内置风格基础上，扩展了 3 种品牌风格。所有品牌定制通过 **新增文件** 实现，上游文件零修改。

### 三种品牌风格

| 风格 | 领域 | 基底影响 | 特征色 |
|------|------|---------|-------|
| `innomad-finance` | 投资理财 | blueprint | Navy #1E3A5F + Gold #F59E0B + Green #10B981 |
| `innomad-tech` | AI / 技术 | vector-illustration | Navy #1E3A5F + Indigo #6366F1 + Cyan #06B6D4 |
| `innomad-life` | 数字游民 / 生活 | warm | Navy #1E3A5F + Orange #ED8936 + Sage #81B29A |

三者共享 **Navy Ink `#1E3A5F`** 作为品牌锚定色，确保跨领域视觉一致性。

### 文件布局

```
.agents/skills/baoyu-article-illustrator/
└── references/
    ├── styles.md                  # 上游原版（不修改）
    ├── styles-innomad.md          # 品牌风格索引（兼容性矩阵 + 信号路由）
    └── styles/
        ├── blueprint.md           # 上游内置风格...
        ├── warm.md
        ├── vector-illustration.md
        ├── ...
        ├── innomad-finance.md     # 品牌风格 spec
        ├── innomad-tech.md
        └── innomad-life.md

.baoyu-skills/baoyu-article-illustrator/
└── EXTEND.md                      # preferred_style: innomad-finance
```

### 风格自动路由

EXTEND.md 设置 `preferred_style: innomad-finance` 作为默认推荐。`styles-innomad.md` 中的 Content Signal Routing 表根据文章关键词自动切换：

- 投资/ETF/期权/美债 → `innomad-finance`
- AI/LLM/编程/API → `innomad-tech`
- 游民/旅行/远程/生活 → `innomad-life`

## 上游同步

使用 rsync 同步上游 baoyu-skills，自有文件通过排除规则保护。

```bash
# 同步（保护 innomad-* 文件不被删除）
bash sync-baoyu-skills.sh

# 或手动
git clone https://github.com/JimLiu/baoyu-skills.git /tmp/baoyu-skills
for skill_dir in /tmp/baoyu-skills/skills/baoyu-*/; do
  rsync -av --delete \
    --exclude="innomad-*" \
    --exclude="styles-innomad.md" \
    "$skill_dir/" ".agents/skills/$(basename $skill_dir)/"
done
```

同步后如果上游 `styles.md` 结构有变（新增 Type 或 Style），需相应更新 `styles-innomad.md` 的兼容性矩阵。

详细方案见 `.agents/UPSTREAM-SYNC.md`。

## EXTEND.md 配置

每个 skill 的项目级偏好通过 EXTEND.md 配置，位于 `.baoyu-skills/<skill>/EXTEND.md` 或 `.innomad-skills/<skill>/EXTEND.md`。

以 `baoyu-article-illustrator` 为例：

```yaml
---
version: 1
watermark:
  enabled: true
  content: "Innomad 一挪迈（X: @innomad_io）"
  position: bottom-right
preferred_style:
  name: innomad-finance
language: zh
default_output_dir: imgs-subdir
---
```

## 图片处理流水线

1. **缩放 + 阴影**：ImageMagick（`-resize`, `-shadow 80x12+0+6`, 白底）
2. **水印**：Python Pillow 斜向平铺（`scripts/add_watermark.py`）
3. **封面 padding**：ImageMagick 居中扩展 128%，保持 16:9（适配 X 裁切）
4. **上传**：PicList → GitHub 图床 `imgs.innomad.io`

注意：GitHub 图床不会覆盖同名文件。如需替换已上传的图片，必须重命名后上传。
