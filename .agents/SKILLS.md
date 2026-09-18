# Skills 安装规则

- 所有 skill 统一安装到 `.agents/skills/` 目录下（`.claude/skills/` 是它的符号链接）
- 每个 skill 一个子目录，目录名即 skill 名
- 外部 skill 安装后需在此处记录来源

## 已安装的外部 Skills

| Skill | 来源 | 说明 |
|-------|------|------|
| inm-writing | 自研 | 一挪迈中文写作：全局文风、ETF 开箱、事实核查、表格转图规则 |
| inm-review | 自研 | AI 审稿：先给修改建议和核查结果，确认后才生成 reviewed（只纠错不改写） |
| inm-distribute | 自研 | 多平台分发：Blog、X、小红书、公众号，含风格优化 |
| inm-cover-image | 自研 | 一挪迈博客 / X Article 5:2 横向封面图生成 |
| inm-x-optimizer | 自研（基于 xai-org/x-algorithm 源码分析） | 基于 X 开源推荐算法（Phoenix 系统）优化推文，提升互动和曝光 |
| inm-post-to-x | 自研（基于 baoyu-post-to-x 简化） | Markdown → 富文本剪贴板 + 本地插图 +【文件名】占位，用户手动发布 X Article，助手不操作 X |
| inm-post-to-blog | 自研（基于 viblog Publish API） | Markdown → frontmatter 补全确认 → Publish API validate/post → D1 和页面验证 |
| x-bookmarks | [sharbelxyz/x-bookmarks](https://github.com/sharbelxyz/x-bookmarks) | 获取、摘要、管理 X/Twitter 书签，支持 bird CLI 或 X API v2 |
| defuddle | [kepano/obsidian-skills](https://github.com/kepano/obsidian-skills) | 网页内容提取为干净的 Markdown |
| json-canvas | [kepano/obsidian-skills](https://github.com/kepano/obsidian-skills) | 创建和编辑 Obsidian .canvas 文件 |
| obsidian-bases | [kepano/obsidian-skills](https://github.com/kepano/obsidian-skills) | 创建和编辑 Obsidian .base 数据库视图 |
| obsidian-cli | [kepano/obsidian-skills](https://github.com/kepano/obsidian-skills) | CLI 与 Obsidian vault 交互 |
| obsidian-markdown | [kepano/obsidian-skills](https://github.com/kepano/obsidian-skills) | Obsidian 风格 Markdown 语法参考 |
