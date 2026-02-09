#!/usr/bin/env bun
import { existsSync, readFileSync, writeFileSync, statSync } from "fs";
import { resolve, dirname, extname, isAbsolute } from "path";

type Uploader = "picgo" | "piclist" | "custom";

interface Options {
  input: string;
  uploader: Uploader;
  api: string;
  dryRun: boolean;
  json: boolean;
}

interface ImageRef {
  original: string; // full match string in markdown
  path: string; // resolved file path
  alt: string; // alt text (for standard format)
  format: "standard" | "wiki"; // ![alt](path) or ![[path]]
}

interface UploadResult {
  local: string;
  remote: string;
  success: boolean;
  error?: string;
}

const IMAGE_EXTS = [".png", ".jpg", ".jpeg", ".gif", ".webp", ".bmp", ".svg", ".tiff", ".ico"];

function parseMarkdownImages(content: string, basePath: string): ImageRef[] {
  const refs: ImageRef[] = [];
  const seen = new Set<string>();

  // Standard format: ![alt](path)
  const stdRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
  let match: RegExpExecArray | null;
  while ((match = stdRegex.exec(content)) !== null) {
    const [original, alt, rawPath] = match;
    const trimmed = rawPath.trim();
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) continue;
    const resolved = isAbsolute(trimmed) ? trimmed : resolve(basePath, trimmed);
    if (!seen.has(resolved)) {
      seen.add(resolved);
      refs.push({ original, path: resolved, alt, format: "standard" });
    }
  }

  // Wiki format: ![[path]]
  const wikiRegex = /!\[\[([^\]]+)\]\]/g;
  while ((match = wikiRegex.exec(content)) !== null) {
    const [original, rawPath] = match;
    const trimmed = rawPath.split("|")[0].trim(); // handle ![[path|alt]]
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) continue;
    const resolved = isAbsolute(trimmed) ? trimmed : resolve(basePath, trimmed);
    if (!seen.has(resolved)) {
      seen.add(resolved);
      refs.push({ original, path: resolved, alt: "", format: "wiki" });
    }
  }

  return refs;
}

async function uploadToPicGo(filePath: string, api: string): Promise<string> {
  const resp = await fetch(api, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ list: [filePath] }),
  });
  if (!resp.ok) throw new Error(`PicGo API returned ${resp.status}: ${resp.statusText}`);
  const data = (await resp.json()) as { success: boolean; result?: string[]; message?: string };
  if (!data.success) throw new Error(`PicGo upload failed: ${data.message || "unknown error"}`);
  if (!data.result || data.result.length === 0) throw new Error("PicGo returned empty result");
  return data.result[0];
}

async function uploadToCustomApi(filePath: string, api: string): Promise<string> {
  const file = Bun.file(filePath);
  const formData = new FormData();
  formData.append("file", file);

  const resp = await fetch(api, { method: "POST", body: formData });
  if (!resp.ok) throw new Error(`Custom API returned ${resp.status}: ${resp.statusText}`);
  const data = (await resp.json()) as Record<string, unknown>;

  // Try common response formats
  const url =
    (data.url as string) ||
    (data.data as string) ||
    ((data.data as Record<string, unknown>)?.url as string) ||
    ((data.result as string[])?.[0]) ||
    (data.link as string);
  if (!url) throw new Error(`Cannot extract URL from response: ${JSON.stringify(data)}`);
  return url;
}

async function uploadImage(filePath: string, opts: Options): Promise<string> {
  switch (opts.uploader) {
    case "picgo":
    case "piclist":
      return uploadToPicGo(filePath, opts.api);
    case "custom":
      return uploadToCustomApi(filePath, opts.api);
  }
}

function replaceImageReferences(content: string, replacements: Map<string, string>, basePath: string): string {
  let result = content;

  // Replace standard format: ![alt](local) → ![alt](remote)
  result = result.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_match, alt, rawPath) => {
    const trimmed = rawPath.trim();
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return _match;
    const resolved = isAbsolute(trimmed) ? trimmed : resolve(basePath, trimmed);
    const remote = replacements.get(resolved);
    return remote ? `![${alt}](${remote})` : _match;
  });

  // Replace wiki format: ![[local]] → ![](remote)
  result = result.replace(/!\[\[([^\]]+)\]\]/g, (_match, rawPath) => {
    const trimmed = rawPath.split("|")[0].trim();
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return _match;
    const resolved = isAbsolute(trimmed) ? trimmed : resolve(basePath, trimmed);
    const remote = replacements.get(resolved);
    return remote ? `![](${remote})` : _match;
  });

  return result;
}

function isImageFile(path: string): boolean {
  return IMAGE_EXTS.includes(extname(path).toLowerCase());
}

function isMarkdownFile(path: string): boolean {
  return extname(path).toLowerCase() === ".md";
}

function printHelp() {
  console.log(`Usage: bun main.ts <input> [options]

Uploads local images in markdown files to image hosting and replaces paths.
If <input> is an image file, uploads it and prints the URL.

Options:
  -u, --uploader <type>  Backend: piclist, picgo, custom (default: piclist)
  -a, --api <url>        API endpoint (default: http://127.0.0.1:36677/upload)
  -d, --dry-run          Preview mode (list images, no upload)
      --json             JSON output
  -h, --help             Show help`);
}

function parseArgs(args: string[]): Options | null {
  const opts: Options = {
    input: "",
    uploader: "piclist",
    api: "http://127.0.0.1:36677/upload",
    dryRun: false,
    json: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "-h" || arg === "--help") {
      printHelp();
      process.exit(0);
    } else if (arg === "-u" || arg === "--uploader") {
      const val = args[++i]?.toLowerCase();
      if (val === "picgo" || val === "piclist" || val === "custom") {
        opts.uploader = val;
      } else {
        console.error(`Invalid uploader: ${val}`);
        return null;
      }
    } else if (arg === "-a" || arg === "--api") {
      opts.api = args[++i];
    } else if (arg === "-d" || arg === "--dry-run") {
      opts.dryRun = true;
    } else if (arg === "--json") {
      opts.json = true;
    } else if (!arg.startsWith("-") && !opts.input) {
      opts.input = arg;
    }
  }

  if (!opts.input) {
    console.error("Error: Input file required");
    printHelp();
    return null;
  }

  return opts;
}

async function processSingleImage(filePath: string, opts: Options): Promise<void> {
  if (opts.dryRun) {
    const output = { file: filePath, action: "would upload" };
    console.log(opts.json ? JSON.stringify(output, null, 2) : `Would upload: ${filePath}`);
    return;
  }

  try {
    const url = await uploadImage(filePath, opts);
    if (opts.json) {
      console.log(JSON.stringify({ local: filePath, remote: url, success: true }, null, 2));
    } else {
      console.log(url);
    }
  } catch (e) {
    const msg = (e as Error).message;
    if (opts.json) {
      console.log(JSON.stringify({ local: filePath, success: false, error: msg }, null, 2));
    } else {
      console.error(`Error: ${msg}`);
    }
    process.exit(1);
  }
}

async function processMarkdown(filePath: string, opts: Options): Promise<void> {
  const content = readFileSync(filePath, "utf-8");
  const basePath = dirname(filePath);
  const refs = parseMarkdownImages(content, basePath);

  if (refs.length === 0) {
    if (opts.json) {
      console.log(JSON.stringify({ file: filePath, images: [], message: "No local images found" }, null, 2));
    } else {
      console.log("No local images found in the file.");
    }
    return;
  }

  // Check existence
  const existing = refs.filter((r) => {
    if (!existsSync(r.path)) {
      if (!opts.json) console.log(`Warning: ${r.path} not found, skipping`);
      return false;
    }
    return true;
  });

  if (opts.dryRun) {
    if (opts.json) {
      console.log(
        JSON.stringify(
          {
            file: filePath,
            images: existing.map((r) => ({ path: r.path, format: r.format, action: "would upload" })),
            total: existing.length,
          },
          null,
          2
        )
      );
    } else {
      console.log(`Found ${existing.length} local image(s) in ${filePath}:\n`);
      for (const r of existing) {
        const size = statSync(r.path).size;
        const sizeStr = size < 1024 * 1024 ? `${Math.round(size / 1024)}KB` : `${(size / (1024 * 1024)).toFixed(1)}MB`;
        console.log(`  ${r.path} (${sizeStr})`);
      }
    }
    return;
  }

  // Upload
  const results: UploadResult[] = [];
  const replacements = new Map<string, string>();

  for (const ref of existing) {
    try {
      if (!opts.json) process.stdout.write(`Uploading ${ref.path}...`);
      const url = await uploadImage(ref.path, opts);
      replacements.set(ref.path, url);
      results.push({ local: ref.path, remote: url, success: true });
      if (!opts.json) console.log(` done → ${url}`);
    } catch (e) {
      const msg = (e as Error).message;
      results.push({ local: ref.path, remote: "", success: false, error: msg });
      if (!opts.json) console.log(` failed: ${msg}`);
    }
  }

  // Replace in markdown
  const succeeded = results.filter((r) => r.success).length;
  if (succeeded > 0) {
    const newContent = replaceImageReferences(content, replacements, basePath);
    writeFileSync(filePath, newContent, "utf-8");
  }

  // Report
  const failed = results.filter((r) => !r.success).length;
  if (opts.json) {
    console.log(
      JSON.stringify(
        {
          file: filePath,
          results,
          summary: { total: results.length, succeeded, failed },
        },
        null,
        2
      )
    );
  } else {
    console.log(`\nDone: ${succeeded} uploaded, ${failed} failed out of ${results.length} image(s).`);
    if (succeeded > 0) console.log(`Markdown file updated: ${filePath}`);
  }

  if (failed > 0) process.exit(1);
}

async function main() {
  const args = process.argv.slice(2);
  const opts = parseArgs(args);
  if (!opts) process.exit(1);

  const input = resolve(opts.input);
  if (!existsSync(input)) {
    console.error(`Error: ${input} not found`);
    process.exit(1);
  }

  if (isImageFile(input)) {
    await processSingleImage(input, opts);
  } else if (isMarkdownFile(input)) {
    await processMarkdown(input, opts);
  } else {
    console.error(`Error: Unsupported file type. Provide a markdown (.md) or image file.`);
    process.exit(1);
  }
}

main();
