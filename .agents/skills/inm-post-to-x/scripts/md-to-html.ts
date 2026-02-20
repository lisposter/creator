import fs from 'node:fs';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

interface ImageInfo {
  placeholder: string;
  originalPath: string;
  fileName: string;
  blockIndex: number;
}

interface ParsedMarkdown {
  title: string;
  coverImage: string | null;
  contentImages: ImageInfo[];
  html: string;
  totalBlocks: number;
}

function parseFrontmatter(content: string): { frontmatter: Record<string, string>; body: string } {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) return { frontmatter: {}, body: content };

  const frontmatter: Record<string, string> = {};
  const lines = match[1]!.split('\n');
  for (const line of lines) {
    const colonIdx = line.indexOf(':');
    if (colonIdx > 0) {
      const key = line.slice(0, colonIdx).trim();
      let value = line.slice(colonIdx + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      frontmatter[key] = value;
    }
  }

  return { frontmatter, body: match[2]! };
}

function getFileName(urlOrPath: string): string {
  // Extract filename from URL or path
  let name: string;
  try {
    const url = new URL(urlOrPath);
    name = path.basename(url.pathname);
  } catch {
    name = path.basename(urlOrPath);
  }
  // Remove query params if any
  name = name.split('?')[0]!;
  return name || 'image';
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function convertMarkdownToHtml(markdown: string, imageCallback: (src: string, alt: string) => string): { html: string; totalBlocks: number } {
  const lines = markdown.split('\n');
  const blocks: string[] = [];
  let inCodeBlock = false;
  let codeBlockContent: string[] = [];
  let inList = false;
  let listItems: string[] = [];
  let listType: 'ul' | 'ol' = 'ul';

  const flushList = () => {
    if (listItems.length > 0) {
      const tag = listType === 'ol' ? 'ol' : 'ul';
      blocks.push(`<${tag}>${listItems.map((item) => `<li>${item}</li>`).join('')}</${tag}>`);
      listItems = [];
      inList = false;
    }
  };

  const processInline = (text: string): string => {
    // Bold
    text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    text = text.replace(/__(.+?)__/g, '<strong>$1</strong>');

    // Italic
    text = text.replace(/\*(.+?)\*/g, '<em>$1</em>');
    text = text.replace(/_(.+?)_/g, '<em>$1</em>');

    // Links
    text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

    // Inline code
    text = text.replace(/`([^`]+)`/g, '<code>$1</code>');

    return text;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;

    // Code block
    if (line.startsWith('```')) {
      if (inCodeBlock) {
        const codeContent = codeBlockContent.map((l) => escapeHtml(l)).join('<br>');
        blocks.push(`<blockquote>${codeContent}</blockquote>`);
        codeBlockContent = [];
        inCodeBlock = false;
      } else {
        flushList();
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockContent.push(line);
      continue;
    }

    // Empty line
    if (line.trim() === '') {
      flushList();
      continue;
    }

    // Image
    const imgMatch = line.match(/^!\[([^\]]*)\]\(([^)]+)\)\s*$/);
    if (imgMatch) {
      flushList();
      const placeholder = imageCallback(imgMatch[2]!, imgMatch[1]!);
      blocks.push(`<p>${placeholder}</p>`);
      continue;
    }

    // Heading (H1 is title, skip it; H2-H6 become H2)
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      flushList();
      const level = headingMatch[1]!.length;
      if (level === 1) continue; // Skip H1, it's the title
      blocks.push(`<h2>${processInline(headingMatch[2]!)}</h2>`);
      continue;
    }

    // Blockquote
    if (line.startsWith('> ')) {
      flushList();
      blocks.push(`<blockquote>${processInline(line.slice(2))}</blockquote>`);
      continue;
    }

    // Unordered list
    const ulMatch = line.match(/^[-*]\s+(.+)$/);
    if (ulMatch) {
      if (!inList || listType !== 'ul') {
        flushList();
        inList = true;
        listType = 'ul';
      }
      listItems.push(processInline(ulMatch[1]!));
      continue;
    }

    // Ordered list
    const olMatch = line.match(/^\d+\.\s+(.+)$/);
    if (olMatch) {
      if (!inList || listType !== 'ol') {
        flushList();
        inList = true;
        listType = 'ol';
      }
      listItems.push(processInline(olMatch[1]!));
      continue;
    }

    // Horizontal rule
    if (/^[-*_]{3,}\s*$/.test(line)) {
      flushList();
      blocks.push('<hr>');
      continue;
    }

    // Regular paragraph
    flushList();
    blocks.push(`<p>${processInline(line)}</p>`);
  }

  flushList();

  return {
    html: blocks.join('\n'),
    totalBlocks: blocks.length,
  };
}

function parseMarkdown(markdownPath: string, options?: { coverImage?: string; title?: string }): ParsedMarkdown {
  const content = fs.readFileSync(markdownPath, 'utf-8');
  const { frontmatter, body } = parseFrontmatter(content);

  // Extract title
  let title = options?.title ?? frontmatter.title ?? '';
  if (!title) {
    const h1Match = body.match(/^#\s+(.+)$/m);
    if (h1Match) title = h1Match[1]!;
  }

  // Extract cover image path (no download, just record path)
  const coverImagePath = options?.coverImage ?? frontmatter.cover_image ?? frontmatter.coverImage ?? frontmatter.cover ?? frontmatter.image ?? frontmatter.featureImage ?? frontmatter.feature_image ?? null;

  const images: Array<{ src: string; alt: string }> = [];

  const { html, totalBlocks } = convertMarkdownToHtml(body, (src, alt) => {
    images.push({ src, alt });
    const fileName = getFileName(src);
    return `【${fileName}】`;
  });

  // Build image info list (skip first image if it becomes cover)
  const contentImages: ImageInfo[] = [];
  let isFirstImage = true;
  let coverPlaceholder: string | null = null;
  let resolvedCover = coverImagePath;

  for (let i = 0; i < images.length; i++) {
    const img = images[i]!;
    const fileName = getFileName(img.src);

    if (isFirstImage && !coverImagePath) {
      resolvedCover = img.src;
      coverPlaceholder = `【${fileName}】`;
      isFirstImage = false;
      continue;
    }

    isFirstImage = false;
    contentImages.push({
      placeholder: `【${fileName}】`,
      originalPath: img.src,
      fileName,
      blockIndex: i,
    });
  }

  // Remove cover placeholder from HTML
  let finalHtml = html;
  if (coverPlaceholder) {
    finalHtml = finalHtml.replace(new RegExp(`<p>${escapeForRegex(coverPlaceholder)}</p>\\n?`, 'g'), '');
  }

  return {
    title,
    coverImage: resolvedCover,
    contentImages,
    html: finalHtml,
    totalBlocks,
  };
}

function escapeForRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function printUsage(): never {
  console.log(`Convert Markdown to HTML for X Article (manual publishing)

Images are replaced with 【filename】 placeholders for manual insertion.

Usage:
  npx -y bun md-to-html.ts <markdown_file> [options]

Options:
  --title <title>       Override title from frontmatter
  --cover <image>       Override cover image from frontmatter
  --html-only           Output only the HTML content
  --save-html <path>    Save HTML to file

Example:
  npx -y bun md-to-html.ts article.md
  npx -y bun md-to-html.ts article.md --save-html /tmp/article.html
`);
  process.exit(0);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    printUsage();
  }

  let markdownPath: string | undefined;
  let title: string | undefined;
  let coverImage: string | undefined;
  let htmlOnly = false;
  let saveHtmlPath: string | undefined;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]!;
    if (arg === '--title' && args[i + 1]) {
      title = args[++i];
    } else if (arg === '--cover' && args[i + 1]) {
      coverImage = args[++i];
    } else if (arg === '--html-only') {
      htmlOnly = true;
    } else if (arg === '--save-html' && args[i + 1]) {
      saveHtmlPath = args[++i];
    } else if (!arg.startsWith('-')) {
      markdownPath = arg;
    }
  }

  if (!markdownPath) {
    console.error('Error: Markdown file path required');
    process.exit(1);
  }

  if (!fs.existsSync(markdownPath)) {
    console.error(`Error: File not found: ${markdownPath}`);
    process.exit(1);
  }

  const result = parseMarkdown(markdownPath, { title, coverImage });

  if (saveHtmlPath) {
    await writeFile(saveHtmlPath, result.html, 'utf-8');
    console.error(`[md-to-html] HTML saved to: ${saveHtmlPath}`);
  }

  if (htmlOnly) {
    console.log(result.html);
  } else {
    // Output structured info
    console.log(`📄 标题: ${result.title}`);
    console.log(`🖼️ 封面: ${result.coverImage ?? '（无）'}`);

    if (result.contentImages.length > 0) {
      console.log(`\n📸 图片占位符 (${result.contentImages.length} 张):`);
      for (const img of result.contentImages) {
        console.log(`   ${img.placeholder} → ${img.originalPath}`);
      }
    } else {
      console.log('\n📸 图片: 无');
    }

    console.log(`\n📊 总段落: ${result.totalBlocks}`);

    if (saveHtmlPath) {
      console.log(`\n✅ HTML 已保存到: ${saveHtmlPath}`);
    }
  }
}

await main().catch((err) => {
  console.error(`Error: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
