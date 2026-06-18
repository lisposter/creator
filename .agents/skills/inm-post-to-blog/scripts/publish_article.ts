#!/usr/bin/env bun
import fs from "node:fs";
import path from "node:path";
import {
  atomicWrite,
  buildMarkdown,
  loadEnvFiles,
  readMarkdown,
  resolveFilePath,
  runCommand,
  viblogRoot,
  type Frontmatter,
} from "./shared.ts";

interface PublishPayload {
  confirmed: boolean;
  file: string;
  frontmatter: Frontmatter;
  force?: boolean;
  baseHash?: string;
}

interface PublishResult {
  file: string;
  sourceUpdated: boolean;
  validate?: unknown;
  publish?: unknown;
  writeOnly: boolean;
}

function main(): void {
  const args = process.argv.slice(2);
  if (args.includes("--help") || args.includes("-h") || args.length === 0) {
    printUsage();
    process.exit(args.length === 0 ? 1 : 0);
  }

  const payloadPath = readOption(args, "--payload") ?? args.find((arg) => !arg.startsWith("--"));
  const writeOnly = args.includes("--write-only");
  if (!payloadPath) {
    throw new Error("Payload JSON path is required.");
  }

  const payload = readPayload(resolveFilePath(payloadPath));
  if (payload.confirmed !== true) {
    throw new Error("Refusing to write or publish: payload.confirmed must be true.");
  }
  if (!payload.frontmatter || typeof payload.frontmatter !== "object") {
    throw new Error("Payload must include frontmatter.");
  }

  const file = resolveFilePath(payload.file);
  const parsed = readMarkdown(file);
  const updated = buildMarkdown(payload.frontmatter, parsed.body, parsed.frontmatterOrder);
  atomicWrite(file, updated);

  const result: PublishResult = {
    file,
    sourceUpdated: true,
    writeOnly,
  };

  if (writeOnly) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  loadEnvFiles(findProjectRoot(process.cwd()));
  const api = process.env.PUBLISH_API_URL || "https://innomad.io";
  const token = process.env.PUBLISH_API_TOKEN;
  if (!token) {
    throw new Error("PUBLISH_API_TOKEN is required. Put it in shell env, ~/.env, project .env, or .innomad-skills/inm-post-to-blog/.env.");
  }

  result.validate = runPublishCli("validate", file, { api, token, baseHash: payload.baseHash });
  result.publish = runPublishCli("post", file, {
    api,
    token,
    baseHash: payload.baseHash,
    force: payload.force === true,
  });

  console.log(JSON.stringify(result, null, 2));
}

function readPayload(file: string): PublishPayload {
  return JSON.parse(fs.readFileSync(file, "utf-8")) as PublishPayload;
}

function runPublishCli(
  command: "validate" | "post",
  file: string,
  options: { api: string; token: string; baseHash?: string; force?: boolean },
): unknown {
  const root = viblogRoot();
  const packageDir = path.join(root, "packages", "publish");
  const args = ["-C", packageDir, "cli", command, file, "--api", options.api, "--token", options.token, "--json"];
  if (options.baseHash) {
    args.push("--base-hash", options.baseHash);
  }
  if (command === "post" && options.force) {
    args.push("--force");
  }

  const result = runCommand("pnpm", args, root);
  if (result.status !== 0) {
    const message = result.stderr.trim() || result.stdout.trim() || `${command} failed`;
    throw new Error(`Publish API ${command} failed: ${message}`);
  }
  try {
    return JSON.parse(result.stdout);
  } catch {
    return { raw: result.stdout.trim() };
  }
}

function readOption(args: string[], name: string): string | undefined {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
}

function findProjectRoot(start: string): string {
  let current = start;
  while (current !== path.dirname(current)) {
    if (fs.existsSync(path.join(current, ".git"))) {
      return current;
    }
    current = path.dirname(current);
  }
  return start;
}

function printUsage(): void {
  console.error("Usage: bun publish_article.ts --payload /tmp/confirmed-payload.json [--write-only]");
}

main();
