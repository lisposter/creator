# Skills 安装规则

- 所有 skill 统一安装到 `.agents/skills/` 目录下（`.claude/skills/` 是它的符号链接）
- 每个 skill 一个子目录，目录名即 skill 名
- 外部 skill 安装后需在此处记录来源

## 已安装的外部 Skills

| Skill | 来源 | 说明 |
|-------|------|------|
| inm-x-optimizer | 自研（基于 xai-org/x-algorithm 源码分析） | 基于 X 开源推荐算法（Phoenix 系统）优化推文，提升互动和曝光 |
| inm-post-to-x | 自研（基于 baoyu-post-to-x 简化） | Markdown → 富文本剪贴板，手动粘贴发布 X Article，图片用【文件名】占位 |
| inm-post-to-ghost | 自研（基于 innomad-io-sync 重构） | 本地 Markdown → Ghost CMS 发布，从 frontmatter 读取元数据，支持单篇/批量同步 |
| x-bookmarks | [sharbelxyz/x-bookmarks](https://github.com/sharbelxyz/x-bookmarks) | 获取、摘要、管理 X/Twitter 书签，支持 bird CLI 或 X API v2 |
