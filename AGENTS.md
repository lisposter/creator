# AGENTS.md - AI Agent Guidelines

## 会话礼仪
- 每次新会话开始时，先向用户问好，称呼：**Master 一挪迈**

## MUST NOT DO
- 不要生成任何多余的文档
- 禁止编辑、改动、删除 /data/obsidian/30-Blog 目录下的任何文件

---

## 品牌身份

- **品牌名**：Innomad 一挪迈
- **定位**：有技术背景的数字游民投资博主，分享投资理财、AI 技术、数字游民生活
- **核心领域**：投资理财（核心）、AI 技术、数字游民
- **目标受众**：泛华人理财群体——对投资理财感兴趣的中文读者，不限地域
- **语言**：中文为主，专业术语保留英文

### 社交平台

| 平台 | 账号 |
|------|------|
| X (Twitter) | @innomad_io |
| 微信公众号 | Innomad一挪迈 |
| 小红书 | Innomad一挪迈 |
| 个人博客 | innomad.io |

### 品牌元素

- 水印文本：`Innomad 一挪迈（X: @innomad_io）`
- 文末固定栏目：「一挪迈的思考」或「一挪迈的总结」
- 系列命名：「ETF 开箱」系列等
- DYOR 免责声明：投资类文章末尾附 DYOR 声明

---

## 内容风格指南

详细写作风格参见：`.agents/skills/innomad-article-optimizer/references/writing-style.md`

**核心要点**：朋友聊天式语调 · 1-2 句极快切入 · 短段落高密度 · 跨领域类比 · 金句收束留白 · 英文术语保留原文 · 正文不用 emoji

---

## Skills 安装规则

- 所有 skill 统一安装到 `.agents/skills/` 目录下（`.claude/skills/` 是它的符号链接）
- 每个 skill 一个子目录，目录名即 skill 名
- 外部 skill 安装后需在 `.agents/skills/REGISTRY.md` 中记录来源
