# Project Skills

This directory contains project-level skills for OhMyOpenCode/OpenCode.

## Installed Skills

All skills from [baoyu-skills](https://github.com/JimLiu/baoyu-skills) have been installed as project-level skills.

### Content Skills

Content generation and publishing skills:

- **baoyu-xhs-images** - Xiaohongshu (RedNote) infographic series generator
- **baoyu-cover-image** - Article cover image generator
- **baoyu-infographic** - Professional infographic creator
- **baoyu-slide-deck** - Presentation slide generator
- **baoyu-comic** - Knowledge comic creator
- **baoyu-article-illustrator** - Smart article illustration generator
- **baoyu-post-to-x** - X (Twitter) posting automation
- **baoyu-post-to-wechat** - WeChat Official Account posting

### AI Generation Skills

AI-powered generation backends:

- **baoyu-danger-gemini-web** - Gemini Web API wrapper (text + image generation)
- **baoyu-image-gen** - Multi-provider AI image generation

### Utility Skills

Content processing utilities:

- **baoyu-url-to-markdown** - Convert web pages to Markdown
- **baoyu-danger-x-to-markdown** - Convert X/Twitter content to Markdown
- **baoyu-compress-image** - Image compression tool
- **baoyu-format-markdown** - Markdown formatter
- **baoyu-markdown-to-html** - Markdown to HTML converter with themes

## Usage

These skills are automatically available to OhMyOpenCode agents operating in this project. Agents will load project-level skills with priority over user-level or system-level skills with the same name.

## Dependencies

- **Node.js** - Required for running skills
- **Bun** - TypeScript runtime (installed via `npx -y bun`)
- **Chrome** - Required for some skills (Gemini auth, X posting)

## Directory Structure

```
.omo/
├── README.md           # This file
└── skills/            # Project-level skills
    ├── baoyu-xhs-images/
    │   ├── SKILL.md          # Skill definition + docs
    │   ├── scripts/          # TypeScript implementations
    │   └── prompts/          # AI generation prompts
    ├── baoyu-image-gen/
    ├── ...                   # Other skills
```

## Updates

To update skills to the latest version from GitHub:

```bash
cd /tmp
git clone https://github.com/JimLiu/baoyu-skills baoyu-skills-update
cp -r baoyu-skills-update/skills/* /Users/leigh/Lab/creator/.omo/skills/
rm -rf baoyu-skills-update
```

## More Information

For detailed documentation about each skill, see:
- [baoyu-skills README](https://github.com/JimLiu/baoyu-skills/blob/main/README.md)
- Individual `SKILL.md` files in each skill directory
