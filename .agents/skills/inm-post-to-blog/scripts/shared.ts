#!/usr/bin/env bun
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawnSync } from "node:child_process";

export type YamlValue = string | number | boolean | null | string[];
export type Frontmatter = Record<string, YamlValue>;

export interface ParsedMarkdown {
  file: string;
  raw: string;
  hasFrontmatter: boolean;
  frontmatter: Frontmatter;
  frontmatterOrder: string[];
  body: string;
}

export const SITE_URL = "https://innomad.io";
export const DEFAULT_VIBLOG_ROOT = "/Users/innomad/lab/innomad-io/viblog";

const CATEGORY_VALUES = ["finance", "tech", "nomad"] as const;
const TIER_VALUES = ["free", "premium", "paid"] as const;
const STOP_WORDS = new Set([
  "the",
  "and",
  "or",
  "to",
  "of",
  "for",
  "in",
  "on",
  "a",
  "an",
  "how",
  "what",
  "why",
  "is",
  "with",
  "guide",
  "post",
  "article",
  "notes",
]);

export function resolveFilePath(input: string): string {
  if (!input) {
    throw new Error("Markdown file path is required.");
  }
  return path.resolve(process.cwd(), input);
}

export function readMarkdown(file: string): ParsedMarkdown {
  const raw = fs.readFileSync(file, "utf-8");
  const normalized = raw.replace(/\r\n/g, "\n");
  const match = normalized.match(/^---\n([\s\S]*?)\n---(?:\n|$)([\s\S]*)$/);
  if (!match) {
    return {
      file,
      raw,
      hasFrontmatter: false,
      frontmatter: {},
      frontmatterOrder: [],
      body: normalized,
    };
  }

  const yaml = match[1] ?? "";
  const body = match[2] ?? "";
  const { data, order } = parseYaml(yaml);
  return {
    file,
    raw,
    hasFrontmatter: true,
    frontmatter: data,
    frontmatterOrder: order,
    body,
  };
}

export function parseYaml(yaml: string): { data: Frontmatter; order: string[] } {
  const data: Frontmatter = {};
  const order: string[] = [];
  const lines = yaml.split("\n");

  for (let i = 0; i < lines.length; i += 1) {
    const rawLine = lines[i] ?? "";
    const line = rawLine.trimEnd();
    if (!line.trim() || line.trimStart().startsWith("#")) {
      continue;
    }

    const match = line.match(/^([A-Za-z_][A-Za-z0-9_-]*):(?:\s*(.*))?$/);
    if (!match) {
      continue;
    }

    const key = match[1]!;
    const rawValue = match[2] ?? "";
    order.push(key);

    if (rawValue.trim() === "") {
      const items: string[] = [];
      let cursor = i + 1;
      while (cursor < lines.length) {
        const itemLine = lines[cursor] ?? "";
        const itemMatch = itemLine.match(/^\s+-\s*(.*)$/);
        if (!itemMatch) break;
        items.push(parseStringValue(itemMatch[1] ?? ""));
        cursor += 1;
      }
      if (items.length > 0) {
        data[key] = items;
        i = cursor - 1;
      } else {
        data[key] = null;
      }
      continue;
    }

    data[key] = parseScalar(rawValue);
  }

  return { data, order };
}

function parseScalar(raw: string): YamlValue {
  const value = stripInlineComment(raw).trim();
  if (value === "" || value === "null" || value === "Null" || value === "~") return null;
  if (value === "[]") return [];
  if (value === "true") return true;
  if (value === "false") return false;
  if (/^-?\d+(\.\d+)?$/.test(value)) return Number(value);
  if (value.startsWith("[") && value.endsWith("]")) {
    const inner = value.slice(1, -1).trim();
    if (!inner) return [];
    return splitInlineArray(inner).map(parseStringValue);
  }
  return parseStringValue(value);
}

function parseStringValue(raw: string): string {
  const value = stripInlineComment(raw).trim();
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  return value;
}

function stripInlineComment(raw: string): string {
  let quote: string | null = null;
  for (let i = 0; i < raw.length; i += 1) {
    const char = raw[i];
    if ((char === '"' || char === "'") && raw[i - 1] !== "\\") {
      quote = quote === char ? null : quote ?? char;
    }
    if (char === "#" && !quote && /\s/.test(raw[i - 1] ?? "")) {
      return raw.slice(0, i);
    }
  }
  return raw;
}

function splitInlineArray(raw: string): string[] {
  const items: string[] = [];
  let quote: string | null = null;
  let start = 0;
  for (let i = 0; i < raw.length; i += 1) {
    const char = raw[i];
    if ((char === '"' || char === "'") && raw[i - 1] !== "\\") {
      quote = quote === char ? null : quote ?? char;
    }
    if (char === "," && !quote) {
      items.push(raw.slice(start, i).trim());
      start = i + 1;
    }
  }
  items.push(raw.slice(start).trim());
  return items.filter(Boolean);
}

export function stringifyFrontmatter(data: Frontmatter, existingOrder: string[] = []): string {
  const order = orderKeys(data, existingOrder);
  const lines: string[] = [];
  for (const key of order) {
    if (!(key in data)) continue;
    const value = data[key];
    if (Array.isArray(value)) {
      if (value.length === 0) {
        lines.push(`${key}: []`);
      } else {
        lines.push(`${key}:`);
        for (const item of value) {
          lines.push(`  - ${formatScalar(item)}`);
        }
      }
      continue;
    }
    lines.push(`${key}: ${formatScalar(value)}`);
  }
  return lines.join("\n");
}

function orderKeys(data: Frontmatter, existingOrder: string[]): string[] {
  const seen = new Set<string>();
  const order = existingOrder.filter((key) => {
    if (seen.has(key) || !(key in data)) return false;
    seen.add(key);
    return true;
  });

  const insertAfter = (key: string, anchors: string[]) => {
    if (!(key in data) || seen.has(key)) return;
    let index = -1;
    for (const anchor of anchors) {
      const found = order.indexOf(anchor);
      if (found > index) index = found;
    }
    order.splice(index + 1, 0, key);
    seen.add(key);
  };

  insertAfter("title", []);
  insertAfter("slug", ["title"]);
  insertAfter("date", ["slug", "title"]);
  insertAfter("summary", ["date", "slug", "title"]);
  insertAfter("category", ["summary", "date"]);
  insertAfter("tags", ["category"]);
  insertAfter("tier", ["tags", "category"]);
  insertAfter("price", ["tier"]);
  insertAfter("cover", ["price", "cover_image"]);
  insertAfter("draft", ["cover", "cover_image"]);
  insertAfter("pinned", ["draft"]);
  insertAfter("series", ["pinned"]);
  insertAfter("seriesOrder", ["series"]);

  for (const key of Object.keys(data)) {
    if (!seen.has(key)) {
      order.push(key);
      seen.add(key);
    }
  }
  return order;
}

function formatScalar(value: YamlValue): string {
  if (value === null || value === undefined) return "null";
  if (typeof value === "boolean" || typeof value === "number") return String(value);
  if (Array.isArray(value)) return `[${value.map(formatScalar).join(", ")}]`;
  if (value === "") return '""';
  if (/^[A-Za-z0-9_./:@+-]+$/.test(value) && !["true", "false", "null"].includes(value)) {
    return value;
  }
  return JSON.stringify(value);
}

export function buildMarkdown(data: Frontmatter, body: string, existingOrder: string[] = []): string {
  return `---\n${stringifyFrontmatter(data, existingOrder)}\n---\n${body}`;
}

export function atomicWrite(file: string, content: string): void {
  const dir = path.dirname(file);
  const tmp = path.join(dir, `.${path.basename(file)}.${process.pid}.tmp`);
  fs.writeFileSync(tmp, content, "utf-8");
  fs.renameSync(tmp, file);
}

export function shanghaiDate(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const get = (type: string) => parts.find((part) => part.type === type)?.value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}

export function inferTitle(parsed: ParsedMarkdown): string | null {
  const existing = asNonEmptyString(parsed.frontmatter.title);
  if (existing) return existing;
  const h1 = parsed.body.match(/^#\s+(.+)$/m)?.[1]?.trim();
  if (h1) return h1;
  const filename = path.basename(parsed.file, ".md").replace(/^\d{4}-\d{2}-\d{2}-/, "");
  return filename || null;
}

export function normalizeSlug(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/['’]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export function generateSlug(title: string, body: string, filename: string): string {
  const source = `${title}\n${body}\n${filename}`;
  const ticker = (source.match(/\b[A-Z]{2,6}\b/g) ?? [])
    .find((item) => !["ETF", "AI", "LLM", "USD", "NAV", "IPO"].includes(item))
    ?.toLowerCase();
  if (/ETF|etf|开箱/.test(source) && ticker) return `etf-${ticker}`;

  const concepts: Array<[RegExp, string]> = [
    [/thinkorswim|TOS/i, "thinkorswim"],
    [/嘉信|Schwab/i, "schwab"],
    [/盈透|IBKR|Interactive Brokers/i, "ibkr"],
    [/碎股|fractional/i, "fractional-shares"],
    [/W-?8BEN|W-?8/i, "w8ben"],
    [/ACH/i, "ach"],
    [/wire|电汇/i, "wire-transfer"],
    [/期权|options?/i, "options"],
    [/Sizzle/i, "sizzle-index"],
    [/VWAP/i, "vwap"],
    [/ATR|APTR/i, "atr"],
    [/AI|LLM/i, "ai"],
  ];
  const tokens: string[] = [];
  for (const [pattern, token] of concepts) {
    if (pattern.test(source) && !tokens.includes(token)) tokens.push(token);
  }

  const ascii = (title.match(/[A-Za-z][A-Za-z0-9-]*/g) ?? [])
    .map((item) => item.toLowerCase())
    .filter((item) => item.length > 1 && !STOP_WORDS.has(item));
  for (const token of ascii) {
    if (!tokens.includes(token)) tokens.push(token);
  }

  if (tokens.length > 0) {
    return normalizeSlug(tokens.slice(0, 5).join("-"));
  }
  return normalizeSlug(path.basename(filename, ".md"));
}

export function isGenericSlug(slug: string): boolean {
  return !slug || ["article", "post", "guide", "notes", "untitled"].includes(slug);
}

export function generateSummary(title: string, body: string): string {
  const cleaned = body
    .replace(/```[\s\S]*?```/g, "")
    .replace(/!\[[^\]]*]\([^)]+\)/g, "")
    .replace(/\[[^\]]+]\([^)]+\)/g, (match) => match.match(/\[([^\]]+)]/)?.[1] ?? "")
    .split("\n")
    .map((line) => line.replace(/^#+\s+/, "").replace(/^[-*]\s+/, "").trim())
    .filter((line) => line && line !== title && !line.startsWith("|") && !/^DYOR/i.test(line))
    .join(" ");
  const compact = cleaned.replace(/\s+/g, " ").trim();
  if (!compact) return `${title}：梳理核心信息、发布背景和读者需要注意的判断点。`;
  const sentence = compact.split(/[。！？!?]/).find((item) => item.length >= 20) ?? compact;
  return truncateChinese(`${title}：${sentence}`, 90);
}

function truncateChinese(value: string, max: number): string {
  const chars = Array.from(value);
  if (chars.length <= max) return value;
  return `${chars.slice(0, max - 1).join("")}。`;
}

export function inferCategory(title: string, body: string): string | null {
  const source = `${title}\n${body}`;
  if (/ETF|股票|期权|投资|理财|券商|盈透|嘉信|美股|基金|分红|收益|估值|财报|broker|options?|stock|fund/i.test(source)) {
    return "finance";
  }
  if (/AI|LLM|编程|代码|自动化|软件|infra|API|模型|工具|Claude|OpenAI|Gemini/i.test(source)) {
    return "tech";
  }
  if (/数字游民|远程|签证|移民|旅行|居住|搬家|nomad|visa|travel|remote/i.test(source)) {
    return "nomad";
  }
  return null;
}

export function generateTags(title: string, body: string, category: string | null): string[] {
  const source = `${title}\n${body}`;
  const tags = new Set<string>();
  const add = (tag: string) => {
    if (tag !== category) tags.add(tag);
  };
  if (/ETF/i.test(source)) add("etf");
  if (/thinkorswim|TOS/i.test(source)) add("thinkorswim");
  if (/嘉信|Schwab/i.test(source)) add("schwab");
  if (/盈透|IBKR|Interactive Brokers/i.test(source)) add("ibkr");
  if (/期权|options?/i.test(source)) add("options");
  if (/AI|LLM/i.test(source)) add("ai");
  if (/数字游民|nomad/i.test(source)) add("digital-nomad");
  for (const ticker of source.match(/\b[A-Z]{2,6}\b/g) ?? []) {
    if (!["ETF", "AI", "LLM", "USD"].includes(ticker)) add(ticker.toLowerCase());
  }
  return Array.from(tags).slice(0, 5);
}

export function stripCategoryTags(tags: string[]): string[] {
  return tags.filter((tag) => !CATEGORY_VALUES.includes(tag.toLowerCase() as typeof CATEGORY_VALUES[number]));
}

export function normalizeCategory(value: YamlValue | undefined): string | null | undefined {
  const raw = asNonEmptyString(value);
  if (!raw) return value === null ? null : undefined;
  const normalized = raw.toLowerCase();
  return CATEGORY_VALUES.includes(normalized as typeof CATEGORY_VALUES[number]) ? normalized : raw;
}

export function isValidCategory(value: YamlValue | undefined): boolean {
  if (value === null || value === undefined || value === "") return true;
  return typeof value === "string" && CATEGORY_VALUES.includes(value.toLowerCase() as typeof CATEGORY_VALUES[number]);
}

export function isValidTier(value: YamlValue | undefined): boolean {
  if (value === undefined || value === null || value === "") return true;
  return typeof value === "string" && TIER_VALUES.includes(value as typeof TIER_VALUES[number]);
}

export function asNonEmptyString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

export function loadEnvFiles(projectRoot: string = process.cwd()): void {
  const paths = [
    path.join(os.homedir(), ".env"),
    path.join(projectRoot, ".env"),
    path.join(projectRoot, ".innomad-skills", "inm-post-to-blog", ".env"),
  ];
  for (const envPath of paths) {
    if (fs.existsSync(envPath)) loadEnvFile(envPath);
  }
}

function loadEnvFile(envPath: string): void {
  const content = fs.readFileSync(envPath, "utf-8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index === -1) continue;
    const key = trimmed.slice(0, index).trim();
    let value = trimmed.slice(index + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

export function runCommand(command: string, args: string[], cwd: string): { stdout: string; stderr: string; status: number } {
  const result = spawnSync(command, args, {
    cwd,
    encoding: "utf-8",
    env: process.env,
  });
  return {
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
    status: result.status ?? 1,
  };
}

export function viblogRoot(): string {
  return process.env.VIBLOG_ROOT || DEFAULT_VIBLOG_ROOT;
}
