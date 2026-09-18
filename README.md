# Innomad Creator

Innomad 一挪迈内容创作工作台。这里保存一挪迈自用的 Codex / Claude Skills，用来完成中文文章写作、审稿、封面、图片上传和多平台分发。

## 目录结构

```text
creator/
├── AGENTS.md                 # Agent 总指南：品牌身份、内容风格、行为规范
├── CLAUDE.md                 # Claude Code 入口指令
├── README.md
├── .agents/
│   ├── SKILLS.md             # 已安装 skill 清单
│   └── skills/               # 所有项目级 skills
├── .baoyu-skills/            # 保留的 baoyu 辅助 skill 项目配置
├── .innomad-skills/          # Innomad 自研 skill 项目配置
├── data/
│   └── obsidian -> iCloud    # Obsidian Vault 符号链接，git ignored
└── posts/                    # 文章产出目录，git ignored
    └── {slug}/
        ├── article.md
        ├── imgs/
        └── *_cover.png
```

## 核心 Skills

| Skill | 用途 |
|---|---|
| `inm-writing` | 一挪迈中文写作：风格、结构、事实核查、ETF 开箱、表格转图规则 |
| `inm-review` | AI 审稿：语言校对、事实核查、frontmatter、后续图片/封面建议 |
| `inm-cover-image` | 一挪迈封面图生成：5:2 横图、ETF 开箱、金融教程等视觉 preset |
| `innomad-image-upload` | 本地图片上传 PicList / 图床，并替换 Markdown 路径 |
| `inm-distribute` | 多平台分发：Blog、X、小红书、公众号 |
| `inm-post-to-x` | Markdown 转 X Article 富文本并复制到剪贴板 |
| `inm-post-to-blog` | 本地 Markdown 补全 frontmatter、确认后发布 / 更新 innomad.io |
| `inm-x-optimizer` | 基于 X 推荐机制优化推文 |

## 保留的辅助 Skills

| Skill | 用途 |
|---|---|
| `baoyu-compress-image` | 图片压缩、WebP / PNG 转换 |
| `baoyu-infographic` | 信息图生成 |
| `baoyu-markdown-to-html` | Markdown 转公众号 / 网页友好的 HTML |
| `baoyu-post-to-wechat` | 发布到微信公众号 |
| `baoyu-xhs-images` | 小红书图文图片生成 |
| `baoyu-comic` | 知识漫画生成 |
| `defuddle` | 网页正文提取为干净 Markdown |
| `obsidian-*` | Obsidian 笔记、Canvas、Bases、Markdown 支持 |
| `json-canvas` | 创建和编辑 Obsidian Canvas |
| `x-bookmarks` | 读取和整理 X / Twitter bookmarks |

## 推荐工作流

### 写作

```text
1. 使用 inm-writing 读取文章类型、风格指南和事实核查规则
2. 在 posts/{slug}/article.md 写入或重写正文
3. 投资类内容优先核查官网、指数方法论、招股说明书、持仓和费率
4. 表格如需发布到 X 或公众号，按 table image 规则生成 WebP 图片
```

ETF 开箱文章使用 `inm-writing/references/article-types/etf-unboxing.md`，但不要把它写成模板填空。先解释“它到底买了什么、为什么这样设计、适合什么人”，再处理数据和风险。

### 审稿

```text
1. 使用 inm-review 做语言校对和事实核查
2. 在对话中展示修改建议、核查结果、frontmatter 提案和局部 diff
3. 用户确认这些修改后才生成或更新 reviewed 文件；确认前不改源稿、不保存完整修订稿
4. 只纠错和补强，保留事实、机制和判断，不把文章改成通用 AI 文风
```

### 封面和配图

```text
1. 使用 inm-cover-image 读取全局视觉规则
2. 按文章类型加载对应 preset
3. 生成 5:2 横向封面，预留安全区，避免文字贴边、重叠、截断
4. 表格图按 inm-writing 的 table image 规则生成
5. 使用 innomad-image-upload 上传并替换为 CDN 链接
```

### 分发

```text
1. 使用 inm-distribute 生成目标平台版本
2. X Article 使用 inm-post-to-x 准备富文本剪贴板、本地插图和【文件名】占位清单；用户自行操作 X 并发布
3. Blog 使用 inm-post-to-blog 补全 frontmatter、确认、发布、验证
4. Blog 等需远程图片的平台使用 CDN 链接；X 保留本地图片供用户手动插入
5. 平台文件写入 posts/{slug}/platforms/，不回写 30-Outputs 源稿或把素材准备标记为已发布
```

### Blog 发布

```text
1. 使用 inm-post-to-blog 读取本地 Markdown
2. 缺失 title / slug / date / summary 等字段时先生成 frontmatter proposal
3. 用户确认后写回源文件
4. 调用 Viblog Publish API validate/post
5. 验证 D1、详情页和 /articles/ 列表
```

发布前必须确认 frontmatter。`summary` 是本地 authoring 字段，Publish API 会作为 `description` 入库；`cover_image` 会作为封面图 alias；未写 `authors` 时站点默认作者是 `一挪迈`。

## 品牌规则

- 品牌名：Innomad 一挪迈
- X：`@innomad_io`
- 水印：`Innomad 一挪迈（X: @innomad_io）`
- 投资类文章保留 DYOR 免责声明
- 文末常用「一挪迈的思考」或「一挪迈的总结」
- 专业术语保留英文，首次出现时给中文解释

## 内容风格

完整写作风格已经内置到 `inm-writing/references/global-style.md`，不依赖外部临时文件。

一句话原则：保留事实、机制和判断，用朋友聊天式的表达讲清楚；可以有程序员式的拆解思维，不带入程序员视角的技术概念，删掉不能帮助读者理解的聪明话，不强凑金句。

## 图片上传

PicList / 图床默认用于把本地图片替换为 CDN 链接。GitHub 图床通常不会覆盖同名文件；需要替换旧图时，优先使用带版本号的新文件名。
