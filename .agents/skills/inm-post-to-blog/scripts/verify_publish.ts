#!/usr/bin/env bun
import path from "node:path";
import { SITE_URL, loadEnvFiles, runCommand, viblogRoot } from "./shared.ts";

interface VerificationResult {
  slug: string;
  url: string;
  d1: {
    ok: boolean;
    row?: Record<string, unknown>;
    error?: string;
  };
  detailPage: {
    ok: boolean;
    status?: number;
    title?: string;
    ogTitle?: string;
    canonical?: string;
    jsonLdAuthor?: string | null;
    error?: string;
  };
  articleList: {
    ok: boolean;
    status?: number;
    containsSlug?: boolean;
    error?: string;
  };
  ok: boolean;
}

async function main(): Promise<void> {
  const slug = process.argv[2];
  if (!slug || slug === "--help" || slug === "-h") {
    printUsage();
    process.exit(slug ? 0 : 1);
  }

  loadEnvFiles(findCreatorRoot());
  const url = `${SITE_URL}/${slug}/`;
  const result: VerificationResult = {
    slug,
    url,
    d1: verifyD1(slug),
    detailPage: await verifyDetailPage(url),
    articleList: await verifyArticleList(slug),
    ok: false,
  };
  result.ok = result.d1.ok && result.detailPage.ok && result.articleList.ok;
  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) {
    process.exit(1);
  }
}

function verifyD1(slug: string): VerificationResult["d1"] {
  const root = viblogRoot();
  const sql = [
    "SELECT slug, title, date, category, authors, cover, description",
    "FROM posts",
    `WHERE slug = ${quoteSql(slug)}`,
    "LIMIT 1",
  ].join(" ");
  const result = runCommand(
    "pnpm",
    ["exec", "wrangler", "d1", "execute", "viblog", "--remote", "--config", "packages/web/wrangler.jsonc", "--json", "--command", sql],
    root,
  );
  if (result.status !== 0) {
    return { ok: false, error: result.stderr.trim() || result.stdout.trim() || "wrangler d1 execute failed" };
  }
  try {
    const payload = JSON.parse(result.stdout) as unknown;
    const rows = extractRows(payload);
    const row = rows[0];
    return row ? { ok: true, row } : { ok: false, error: "No D1 row found for slug." };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

async function verifyDetailPage(url: string): Promise<VerificationResult["detailPage"]> {
  try {
    const response = await fetch(url, { headers: { "User-Agent": "inm-post-to-blog-skill/1.0" } });
    const html = await response.text();
    const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim();
    const ogTitle = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i)?.[1]
      ?? html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i)?.[1];
    const canonical = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i)?.[1]
      ?? html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["']canonical["']/i)?.[1];
    const jsonLdAuthor = extractJsonLdAuthor(html);
    return {
      ok: response.status === 200 && Boolean(title) && Boolean(ogTitle) && canonical === url && jsonLdAuthor === "一挪迈",
      status: response.status,
      title,
      ogTitle,
      canonical,
      jsonLdAuthor,
    };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

async function verifyArticleList(slug: string): Promise<VerificationResult["articleList"]> {
  try {
    const response = await fetch(`${SITE_URL}/articles/`, { headers: { "User-Agent": "inm-post-to-blog-skill/1.0" } });
    const html = await response.text();
    const containsSlug = html.includes(`/${slug}/`) || html.includes(slug);
    return {
      ok: response.status === 200 && containsSlug,
      status: response.status,
      containsSlug,
    };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

function extractRows(payload: unknown): Record<string, unknown>[] {
  if (Array.isArray(payload)) {
    for (const item of payload) {
      const rows = extractRows(item);
      if (rows.length > 0) return rows;
    }
  }
  if (payload && typeof payload === "object") {
    const obj = payload as Record<string, unknown>;
    if (Array.isArray(obj.results)) return obj.results as Record<string, unknown>[];
    if (obj.result) return extractRows(obj.result);
  }
  return [];
}

function extractJsonLdAuthor(html: string): string | null {
  const scripts = html.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi) ?? [];
  for (const script of scripts) {
    const raw = script.replace(/^<script[^>]*>/i, "").replace(/<\/script>$/i, "").trim();
    try {
      const data = JSON.parse(raw) as unknown;
      const author = findAuthor(data);
      if (author) return author;
    } catch {
      continue;
    }
  }
  return null;
}

function findAuthor(value: unknown): string | null {
  if (!value || typeof value !== "object") return null;
  if (Array.isArray(value)) {
    for (const item of value) {
      const author = findAuthor(item);
      if (author) return author;
    }
    return null;
  }
  const obj = value as Record<string, unknown>;
  const author = obj.author;
  if (typeof author === "string") return author;
  if (author && typeof author === "object") {
    const authorObj = author as Record<string, unknown>;
    if (typeof authorObj.name === "string") return authorObj.name;
  }
  if (Array.isArray(author)) {
    for (const item of author) {
      const found = findAuthor({ author: item });
      if (found) return found;
    }
  }
  return null;
}

function quoteSql(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

function findCreatorRoot(): string {
  return path.resolve(import.meta.dir, "..", "..", "..", "..");
}

function printUsage(): void {
  console.error("Usage: bun verify_publish.ts <slug>");
}

main();
