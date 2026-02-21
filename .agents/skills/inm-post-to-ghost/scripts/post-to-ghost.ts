#!/usr/bin/env bun
/**
 * post-to-ghost.ts
 * 
 * 读取本地 Markdown 文件，解析 frontmatter，通过 Ghost Admin API 发布/更新文章。
 * 
 * Usage:
 *   bun post-to-ghost.ts <file.md>                    # 发布单篇文章
 *   bun post-to-ghost.ts <file.md> --status published  # 直接发布（默认 draft）
 *   bun post-to-ghost.ts <file.md> --force              # 强制更新
 *   bun post-to-ghost.ts <file.md> --dry-run            # 预览，不实际发布
 *   bun post-to-ghost.ts --list                         # 列出源目录下的文章
 *   bun post-to-ghost.ts --sync                         # 同步源目录下所有文章
 * 
 * Environment variables (loaded from .innomad-skills/inm-post-to-ghost/.env, shell env overrides):
 *   GHOST_ADMIN_API_URL  - Ghost Admin API URL (e.g. https://innomad.io)
 *   GHOST_ADMIN_API_KEY  - Ghost Admin API Key (format: id:secret)
 */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

// ─── Types ───────────────────────────────────────────────────────

interface Frontmatter {
  title?: string;
  slug?: string;
  date?: string;
  type?: string;           // Post | Page
  status?: string;         // Published | Draft
  featured?: boolean;
  tags?: string[];
  category?: string;
  tiers?: string[];
  visibility?: string;     // public | members | paid | tiers
  summary?: string;
  cover_image?: string;
  cover?: string;
  password?: string;
  [key: string]: unknown;
}

interface ParsedArticle {
  frontmatter: Frontmatter;
  content: string;
  filePath: string;
  fileName: string;
}

interface GhostPostData {
  title: string;
  slug: string;
  lexical: string;
  status: string;
  featured: boolean;
  tags: { name: string }[];
  visibility: string;
  published_at?: string;
  feature_image?: string;
  custom_excerpt?: string;
  tiers?: { id: string }[];
}

interface Config {
  source_dir: string;
  target_dir: string;
  defaults: {
    status: string;
    visibility: string;
    type: string;
    featured: boolean;
    category: string;
    tags: string[];
    tiers: string[];
  };
  available_tags: string[];
  available_categories: string[];
  ghost: {
    asset_domain_from: string;
    asset_domain_to: string;
    default_feature_image: string;
    cover_image_template: string;
  };
}

// ─── YAML Parser (minimal, no deps) ─────────────────────────────

function parseYaml(text: string): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  const lines = text.split("\n");
  let currentKey = "";
  let currentList: string[] | null = null;

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();

    // Skip empty lines and comments
    if (!line.trim() || line.trim().startsWith("#")) {
      if (currentList && currentKey) {
        result[currentKey] = currentList;
        currentList = null;
        currentKey = "";
      }
      continue;
    }

    // List item
    if (line.match(/^\s+-\s+/) || line.match(/^\s+-$/)) {
      const value = line.replace(/^\s+-\s*/, "").trim();
      if (currentList) {
        if (value) currentList.push(value);
      }
      continue;
    }

    // Key: value
    const kvMatch = line.match(/^(\s*)([a-zA-Z_][a-zA-Z0-9_]*):\s*(.*)?$/);
    if (kvMatch) {
      // Save previous list if any
      if (currentList && currentKey) {
        result[currentKey] = currentList;
        currentList = null;
      }

      const indent = kvMatch[1]!.length;
      const key = kvMatch[2]!;
      let value = (kvMatch[3] || "").trim();

      // Handle nested objects (indent > 0) - flatten with dot notation
      const fullKey = indent > 0 && currentKey && !currentList ? `${currentKey}.${key}` : key;

      if (value === "" || value === "[]") {
        // Could be start of list or nested object or empty
        if (value === "[]") {
          result[fullKey] = [];
        } else {
          // Could be object or list - peek ahead
          currentKey = fullKey;
          currentList = [];
        }
      } else {
        // Remove quotes
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        // Strip inline YAML comments
        const commentIdx = value.indexOf(" #");
        if (commentIdx > 0) {
          value = value.substring(0, commentIdx).trim();
        }
        // Parse booleans and numbers
        if (value === "true") result[fullKey] = true;
        else if (value === "false") result[fullKey] = false;
        else if (/^\d+$/.test(value)) result[fullKey] = parseInt(value, 10);
        else result[fullKey] = value;

        if (indent === 0) currentKey = key;
      }
    }
  }

  // Save last list
  if (currentList && currentKey) {
    result[currentKey] = currentList;
  }

  return result;
}

// ─── Config Loader ───────────────────────────────────────────────

function loadConfig(skillDir: string): Config {
  const configPath = path.join(skillDir, "config.yaml");
  if (!fs.existsSync(configPath)) {
    console.error(`❌ Config file not found: ${configPath}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(configPath, "utf-8");
  const parsed = parseYaml(raw);

  return {
    source_dir: (parsed["source_dir"] as string) || "data/obsidian/20-Workbench",
    target_dir: (parsed["target_dir"] as string) || "data/obsidian/30-Blog/innomad.io",
    defaults: {
      status: (parsed["defaults.status"] as string) || "draft",
      visibility: (parsed["defaults.visibility"] as string) || "public",
      type: (parsed["defaults.type"] as string) || "Post",
      featured: (parsed["defaults.featured"] as boolean) ?? false,
      category: (parsed["defaults.category"] as string) || "",
      tags: (parsed["defaults.tags"] as string[]) || [],
      tiers: (parsed["defaults.tiers"] as string[]) || [],
    },
    available_tags: (parsed["available_tags"] as string[]) || [],
    available_categories: (parsed["available_categories"] as string[]) || [],
    ghost: {
      asset_domain_from: (parsed["ghost.asset_domain_from"] as string) || "gh.assets.innomad.io",
      asset_domain_to: (parsed["ghost.asset_domain_to"] as string) || "imgs.innomad.io",
      default_feature_image: (parsed["ghost.default_feature_image"] as string) || "",
      cover_image_template: (parsed["ghost.cover_image_template"] as string) || "",
    },
  };
}

// ─── Frontmatter Parser ─────────────────────────────────────────

function parseFrontmatter(content: string): { frontmatter: Frontmatter; body: string } {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) return { frontmatter: {}, body: content };

  const fm: Frontmatter = {};
  const lines = match[1]!.split("\n");
  let currentKey = "";
  let currentList: string[] | null = null;

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();

    // List item (for tags, tiers, etc.)
    const listMatch = line.match(/^\s+-\s+(.+)$/);
    if (listMatch && currentKey) {
      if (!currentList) currentList = [];
      currentList.push(listMatch[1]!.trim());
      continue;
    }

    // Save previous list
    if (currentList && currentKey) {
      (fm as Record<string, unknown>)[currentKey] = currentList;
      currentList = null;
    }

    // Key: value
    const kvMatch = line.match(/^([a-zA-Z_][a-zA-Z0-9_]*):\s*(.*)$/);
    if (kvMatch) {
      currentKey = kvMatch[1]!;
      let value = (kvMatch[2] || "").trim();

      if (value === "" || value === "[]") {
        if (value === "[]") {
          (fm as Record<string, unknown>)[currentKey] = [];
        } else {
          currentList = [];
        }
      } else {
        // Remove quotes
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        // Remove Obsidian template refs like "[[00-Index.base]]"
        if (value.startsWith("[[") && value.endsWith("]]")) {
          continue; // Skip template references
        }
        // Parse types
        if (value === "true") (fm as Record<string, unknown>)[currentKey] = true;
        else if (value === "false") (fm as Record<string, unknown>)[currentKey] = false;
        else (fm as Record<string, unknown>)[currentKey] = value;
      }
    }
  }

  // Save last list
  if (currentList && currentKey) {
    (fm as Record<string, unknown>)[currentKey] = currentList;
  }

  return { frontmatter: fm, body: match[2]! };
}

// ─── Article Parser ──────────────────────────────────────────────

function parseArticle(filePath: string): ParsedArticle {
  const raw = fs.readFileSync(filePath, "utf-8");
  const { frontmatter, body } = parseFrontmatter(raw);

  // Extract title: frontmatter > first H1 > filename
  if (!frontmatter.title) {
    const h1Match = body.match(/^#\s+(.+)$/m);
    if (h1Match) {
      frontmatter.title = h1Match[1]!.trim();
    } else {
      frontmatter.title = path.basename(filePath, ".md");
    }
  }

  return {
    frontmatter,
    content: body.trim(),
    filePath,
    fileName: path.basename(filePath),
  };
}

// ─── Slug Generator ─────────────────────────────────────────────

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s\u4e00-\u9fff-]/g, "") // Keep CJK chars, alphanumeric, spaces, hyphens
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 60);
}

// ─── .env File Loader ────────────────────────────────────────────

/**
 * Load environment variables from .innomad-skills/.env file.
 * Shell environment variables take precedence (will NOT be overwritten).
 */
function loadEnvFile(projectRoot: string): void {
  const envPath = path.join(projectRoot, ".innomad-skills", "inm-post-to-ghost", ".env");
  if (!fs.existsSync(envPath)) return;

  const content = fs.readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith("#")) continue;

    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;

    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();

    // Remove surrounding quotes (single or double)
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    // Shell env takes precedence — don't overwrite existing
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

// ─── Ghost JWT Token ─────────────────────────────────────────────

function generateGhostJWT(apiKey: string): string {
  const [id, secret] = apiKey.split(":");
  if (!id || !secret) {
    throw new Error("Invalid GHOST_ADMIN_API_KEY format. Expected 'id:secret'");
  }

  // JWT Header
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT", kid: id })).toString("base64url");

  // JWT Payload
  const now = Math.floor(Date.now() / 1000);
  const payload = Buffer.from(
    JSON.stringify({
      iat: now,
      exp: now + 5 * 60, // 5 min expiry
      aud: "/admin/",
    })
  ).toString("base64url");

  // JWT Signature
  const signingInput = `${header}.${payload}`;
  const hmac = crypto.createHmac("sha256", Buffer.from(secret, "hex"));
  hmac.update(signingInput);
  const signature = hmac.digest("base64url");

  return `${header}.${payload}.${signature}`;
}

// ─── Ghost API Client ────────────────────────────────────────────

class GhostClient {
  private baseUrl: string;
  private apiKey: string;

  constructor(url: string, key: string) {
    this.baseUrl = url.replace(/\/+$/, "");
    this.apiKey = key;
  }

  private get headers(): Record<string, string> {
    return {
      Authorization: `Ghost ${generateGhostJWT(this.apiKey)}`,
      "Content-Type": "application/json",
      "Accept-Version": "v5.0",
    };
  }

  private get apiBase(): string {
    return `${this.baseUrl}/ghost/api/admin`;
  }

  async testConnection(): Promise<boolean> {
    try {
      const res = await fetch(`${this.apiBase}/site/`, { headers: this.headers });
      return res.ok;
    } catch {
      return false;
    }
  }

  async getPostBySlug(slug: string): Promise<Record<string, unknown> | null> {
    try {
      const res = await fetch(`${this.apiBase}/posts/slug/${slug}/`, { headers: this.headers });
      if (!res.ok) return null;
      const data = (await res.json()) as { posts: Record<string, unknown>[] };
      return data.posts?.[0] ?? null;
    } catch {
      return null;
    }
  }

  async getPageBySlug(slug: string): Promise<Record<string, unknown> | null> {
    try {
      const res = await fetch(`${this.apiBase}/pages/slug/${slug}/`, { headers: this.headers });
      if (!res.ok) return null;
      const data = (await res.json()) as { pages: Record<string, unknown>[] };
      return data.pages?.[0] ?? null;
    } catch {
      return null;
    }
  }

  async createPost(postData: GhostPostData): Promise<Record<string, unknown>> {
    const res = await fetch(`${this.apiBase}/posts/`, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify({ posts: [postData] }),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Failed to create post: ${res.status} ${err}`);
    }
    const data = (await res.json()) as { posts: Record<string, unknown>[] };
    return data.posts[0]!;
  }

  async updatePost(postId: string, postData: GhostPostData & { updated_at: string }): Promise<Record<string, unknown>> {
    const res = await fetch(`${this.apiBase}/posts/${postId}/`, {
      method: "PUT",
      headers: this.headers,
      body: JSON.stringify({ posts: [postData] }),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Failed to update post: ${res.status} ${err}`);
    }
    const data = (await res.json()) as { posts: Record<string, unknown>[] };
    return data.posts[0]!;
  }

  async createPage(pageData: GhostPostData): Promise<Record<string, unknown>> {
    const res = await fetch(`${this.apiBase}/pages/`, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify({ pages: [pageData] }),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Failed to create page: ${res.status} ${err}`);
    }
    const data = (await res.json()) as { pages: Record<string, unknown>[] };
    return data.pages[0]!;
  }

  async updatePage(pageId: string, pageData: GhostPostData & { updated_at: string }): Promise<Record<string, unknown>> {
    const res = await fetch(`${this.apiBase}/pages/${pageId}/`, {
      method: "PUT",
      headers: this.headers,
      body: JSON.stringify({ pages: [pageData] }),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Failed to update page: ${res.status} ${err}`);
    }
    const data = (await res.json()) as { pages: Record<string, unknown>[] };
    return data.pages[0]!;
  }

  async getTiers(): Promise<Record<string, unknown>[]> {
    try {
      const res = await fetch(`${this.apiBase}/tiers/`, { headers: this.headers });
      if (!res.ok) return [];
      const data = (await res.json()) as { tiers: Record<string, unknown>[] };
      return data.tiers || [];
    } catch {
      return [];
    }
  }
}

// ─── Markdown → Lexical ─────────────────────────────────────────

function convertToLexical(markdown: string): string {
  const lexicalDoc = {
    root: {
      children: [
        {
          type: "markdown",
          cardName: "markdown",
          markdown,
        },
      ],
      direction: null,
      format: "",
      indent: 0,
      type: "root",
      version: 1,
    },
  };
  return JSON.stringify(lexicalDoc);
}

// ─── Content Processor ──────────────────────────────────────────

function replaceAssetDomain(content: string, from: string, to: string): string {
  if (!from || !to || !content) return content;
  const regex = new RegExp(`https://${from.replace(/\./g, "\\.")}`, "g");
  return content.replace(regex, `https://${to}`);
}

function combineTags(tags: string[], category: string): string[] {
  const allTags = [...tags];
  if (category && category.trim() && !allTags.includes(category)) {
    allTags.push(category);
  }
  return allTags.filter((t) => t && t.trim());
}

// ─── Build Ghost Post Data ──────────────────────────────────────

function buildGhostPostData(article: ParsedArticle, config: Config): GhostPostData {
  const fm = article.frontmatter;
  const defaults = config.defaults;

  const slug = fm.slug || generateSlug(fm.title || article.fileName);
  const tags = combineTags(fm.tags || defaults.tags, fm.category || defaults.category);
  const status = (fm.status || defaults.status).toLowerCase();
  const ghostStatus = status === "published" ? "published" : "draft";
  const tiers = fm.tiers && fm.tiers.length > 0 ? fm.tiers : defaults.tiers;
  const visibility = tiers.length > 0 ? "tiers" : (fm.visibility || defaults.visibility);
  // 封面优先使用 cover_image
  const featureImage = fm.cover_image || fm.cover || config.ghost.default_feature_image;
  const excerpt = fm.summary && fm.summary.trim() ? fm.summary.trim() : undefined;

  // Process content: replace asset domains
  let content = article.content;
  if (config.ghost.asset_domain_from && config.ghost.asset_domain_to) {
    content = replaceAssetDomain(content, config.ghost.asset_domain_from, config.ghost.asset_domain_to);
  }

  // Remove Obsidian-specific syntax: wikilinks [[...]]
  content = content.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_match, target, alias) => alias || target);

  const postData: GhostPostData = {
    title: fm.title || article.fileName.replace(/\.md$/, ""),
    slug,
    lexical: convertToLexical(content),
    status: ghostStatus,
    featured: fm.featured ?? defaults.featured,
    tags: tags.map((name) => ({ name })),
    visibility,
  };

  if (fm.date) {
    postData.published_at = new Date(fm.date).toISOString();
  }

  if (featureImage) {
    postData.feature_image = featureImage;
  }

  if (excerpt) {
    postData.custom_excerpt = excerpt.length > 300 ? excerpt.substring(0, 297) + "..." : excerpt;
  }

  // Handle tiers: if visibility is "tiers", attach tier names for Ghost API
  // Ghost requires tier IDs; tier name→ID resolution happens at publish time via API
  if (visibility === "tiers" && tiers.length > 0) {
    postData.tiers = tiers.map((name) => ({ id: name }));
  }

  return postData;
}

// ─── List Articles ───────────────────────────────────────────────

function listArticles(sourceDir: string): string[] {
  const articles: string[] = [];

  function walk(dir: string) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.name.endsWith(".md") && !entry.name.startsWith(".")) {
        articles.push(fullPath);
      }
    }
  }

  walk(sourceDir);
  return articles.sort();
}

// ─── Publish Single Article ──────────────────────────────────────

async function publishArticle(
  filePath: string,
  client: GhostClient | null,
  config: Config,
  options: { force?: boolean; dryRun?: boolean; statusOverride?: string }
): Promise<{ slug: string; title: string; action: string; error?: string }> {
  const article = parseArticle(filePath);
  const postData = buildGhostPostData(article, config);

  // Apply status override
  if (options.statusOverride) {
    postData.status = options.statusOverride === "published" ? "published" : "draft";
  }

  const isPage = (article.frontmatter.type || config.defaults.type).toLowerCase() === "page";
  const contentType = isPage ? "page" : "post";

  console.log(`\n📄 Processing: ${article.fileName}`);
  console.log(`   Title: ${postData.title}`);
  console.log(`   Slug: ${postData.slug}`);
  console.log(`   Type: ${contentType}`);
  console.log(`   Status: ${postData.status}`);
  console.log(`   Tags: ${postData.tags.map((t) => t.name).join(", ") || "(none)"}`);
  console.log(`   Visibility: ${postData.visibility}`);
  if (postData.feature_image) console.log(`   Cover: ${postData.feature_image}`);
  if (postData.custom_excerpt) console.log(`   Excerpt: ${postData.custom_excerpt.substring(0, 60)}${postData.custom_excerpt.length > 60 ? "..." : ""}`);
  if (postData.published_at) console.log(`   Date: ${postData.published_at.split("T")[0]}`);

  if (options.dryRun) {
    console.log(`   🔍 DRY RUN — skipping actual publish`);
    return { slug: postData.slug, title: postData.title, action: "dry-run" };
  }

  if (!client) {
    console.log(`   ❌ No Ghost client (missing env vars)`);
    return { slug: postData.slug, title: postData.title, action: "failed", error: "No Ghost client" };
  }

  try {
    // Check if already exists
    const existing = isPage
      ? await client.getPageBySlug(postData.slug)
      : await client.getPostBySlug(postData.slug);

    if (existing) {
      if (!options.force) {
        console.log(`   ⏭️  Already exists, use --force to update`);
        return { slug: postData.slug, title: postData.title, action: "skipped" };
      }

      // Update
      const updateData = { ...postData, updated_at: existing.updated_at as string };
      if (isPage) {
        await client.updatePage(existing.id as string, updateData);
      } else {
        await client.updatePost(existing.id as string, updateData);
      }
      console.log(`   ✅ Updated successfully`);
      return { slug: postData.slug, title: postData.title, action: "updated" };
    } else {
      // Create
      if (isPage) {
        await client.createPage(postData);
      } else {
        await client.createPost(postData);
      }
      console.log(`   ✅ Created successfully`);
      return { slug: postData.slug, title: postData.title, action: "created" };
    }
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.log(`   ❌ Failed: ${errMsg}`);
    return { slug: postData.slug, title: postData.title, action: "failed", error: errMsg };
  }
}

// ─── Main ────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);

  // Resolve skill directory (where this script lives)
  const scriptDir = path.dirname(new URL(import.meta.url).pathname);
  const skillDir = path.resolve(scriptDir, "..");
  // Project root: .agents/skills/inm-post-to-ghost -> go up 3 levels
  const projectRoot = path.resolve(skillDir, "../../..");

  // Load .env from .innomad-skills/.env (shell env takes precedence)
  loadEnvFile(projectRoot);

  // Load config
  const config = loadConfig(skillDir);
  const sourceDir = path.resolve(projectRoot, config.source_dir);

  const targetDir = path.resolve(projectRoot, config.target_dir);

  // Parse flags
  const flags = {
    list: args.includes("--list"),
    sync: args.includes("--sync"),
    force: args.includes("--force"),
    dryRun: args.includes("--dry-run"),
    move: args.includes("--move"),
    statusOverride: args.includes("--status")
      ? args[args.indexOf("--status") + 1]
      : undefined,
  };

  // Filter out flags to get file args
  const fileArgs = args.filter(
    (a) => !a.startsWith("--") && (args.indexOf(a) === 0 || !["--status"].includes(args[args.indexOf(a) - 1]!))
  );

  // ── List mode ──
  if (flags.list) {
    console.log(`\n📁 Source directory: ${sourceDir}\n`);
    const articles = listArticles(sourceDir);
    if (articles.length === 0) {
      console.log("   No markdown files found.");
    } else {
      for (const f of articles) {
        const article = parseArticle(f);
        const fm = article.frontmatter;
        const relPath = path.relative(projectRoot, f);
        console.log(`   ${relPath}`);
        console.log(`      Title: ${fm.title || "(untitled)"} | Slug: ${fm.slug || "(auto)"} | Status: ${fm.status || config.defaults.status}`);
      }
      console.log(`\n   Total: ${articles.length} files`);
    }
    return;
  }

  // ── Validate Ghost env (skip for dry-run) ──
  const ghostUrl = process.env.GHOST_ADMIN_API_URL;
  const ghostKey = process.env.GHOST_ADMIN_API_KEY;

  if (!flags.dryRun && (!ghostUrl || !ghostKey)) {
    console.error("❌ Missing environment variables:");
    if (!ghostUrl) console.error("   GHOST_ADMIN_API_URL");
    if (!ghostKey) console.error("   GHOST_ADMIN_API_KEY");
    console.error("\nSet them in .innomad-skills/inm-post-to-ghost/.env or as shell environment variables.");
    process.exit(1);
  }

  const client = (ghostUrl && ghostKey) ? new GhostClient(ghostUrl, ghostKey) : null;

  // Test connection (skip for dry-run)
  if (!flags.dryRun) {
    console.log("🔌 Testing Ghost API connection...");
    const connected = await client!.testConnection();
    if (!connected) {
      console.error("❌ Cannot connect to Ghost API. Check your URL and API key.");
      process.exit(1);
    }
    console.log("✅ Ghost API connected\n");
  }

  // ── Sync mode ──
  if (flags.sync) {
    console.log(`📁 Syncing all articles from: ${sourceDir}`);
    const articles = listArticles(sourceDir);

    if (articles.length === 0) {
      console.log("No markdown files found.");
      return;
    }

    console.log(`Found ${articles.length} articles to process\n`);

    const results: { slug: string; title: string; action: string; error?: string; filePath: string }[] = [];
    for (const f of articles) {
      const result = await publishArticle(f, client, config, {
        force: flags.force,
        dryRun: flags.dryRun,
        statusOverride: flags.statusOverride,
      });
      results.push({ ...result, filePath: f });
      // Rate limiting
      await new Promise((r) => setTimeout(r, 500));
    }

    // Summary
    const created = results.filter((r) => r.action === "created").length;
    const updated = results.filter((r) => r.action === "updated").length;
    const skipped = results.filter((r) => r.action === "skipped").length;
    const failed = results.filter((r) => r.action === "failed").length;

    console.log("\n📊 Sync Summary:");
    console.log(`   Created: ${created}`);
    console.log(`   Updated: ${updated}`);
    console.log(`   Skipped: ${skipped}`);
    console.log(`   Failed: ${failed}`);
    console.log(`   Total: ${results.length}`);

    // Move successfully published files
    const successResults = results.filter((r) => r.action === "created" || r.action === "updated");
    if (successResults.length > 0) {
      if (flags.move) {
        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        }
        console.log(`\n📦 Moving ${successResults.length} files to ${path.relative(projectRoot, targetDir)}:`);
        for (const r of successResults) {
          const safeTitle = r.title.replace(/[\/:*?"<>|]/g, "-");
          const dest = path.join(targetDir, `${safeTitle}.md`);
          try {
            fs.renameSync(r.filePath, dest);
            console.log(`   ✅ ${safeTitle}.md`);
          } catch (err) {
            const errMsg = err instanceof Error ? err.message : String(err);
            console.error(`   ❌ ${path.basename(r.filePath)}: ${errMsg}`);
          }
        }
      } else {
        console.log(`\n💡 ${successResults.length} files can be archived. Re-run with --move or move manually.`);
      }
    }
    return;
  }

  // ── Single file mode ──
  if (fileArgs.length === 0) {
    console.error("Usage: bun post-to-ghost.ts <file.md> [--force] [--dry-run] [--move] [--status draft|published]");
    console.error("       bun post-to-ghost.ts --list");
    console.error("       bun post-to-ghost.ts --sync [--force] [--dry-run]");
    process.exit(1);
  }

  const filePath = path.resolve(fileArgs[0]!);
  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${filePath}`);
    process.exit(1);
  }

  const result = await publishArticle(filePath, client, config, {
    force: flags.force,
    dryRun: flags.dryRun,
    statusOverride: flags.statusOverride,
  });

  // Move file after successful publish
  if (result.action === "created" || result.action === "updated") {
    const safeTitle = result.title.replace(/[\/:*?"<>|]/g, "-");
    const targetPath = path.join(targetDir, `${safeTitle}.md`);
    const relSource = path.relative(projectRoot, filePath);
    const relTarget = path.relative(projectRoot, targetPath);

    if (flags.move) {
      try {
        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        }
        fs.renameSync(filePath, targetPath);
        console.log(`\n📦 Moved: ${relSource} → ${relTarget}`);
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        console.error(`\n❌ Failed to move file: ${errMsg}`);
      }
    } else {
      console.log(`\n💡 To archive this file, re-run with --move or execute:`);
      console.log(`   mv "${relSource}" "${relTarget}"`);
    }
  }
}

// Run
main().catch((err) => {
  console.error("💥 Fatal error:", err);
  process.exit(1);
});
