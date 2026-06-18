#!/usr/bin/env bun
import path from "node:path";
import {
  SITE_URL,
  asNonEmptyString,
  asStringArray,
  generateSlug,
  generateSummary,
  generateTags,
  inferCategory,
  inferTitle,
  isGenericSlug,
  isValidCategory,
  isValidTier,
  normalizeCategory,
  normalizeSlug,
  readMarkdown,
  resolveFilePath,
  shanghaiDate,
  stripCategoryTags,
  type Frontmatter,
  type YamlValue,
} from "./shared.ts";

interface PrepareResult {
  file: string;
  currentFrontmatter: Frontmatter;
  proposedFrontmatter: Frontmatter;
  changedFields: Record<string, { from: YamlValue | undefined; to: YamlValue }>;
  warnings: string[];
  blockingProblems: string[];
  requiresUserInput: boolean;
  requiresConfirmation: true;
  expectedUrl: string | null;
}

function main(): void {
  const fileArg = process.argv[2];
  if (!fileArg || fileArg === "--help" || fileArg === "-h") {
    printUsage();
    process.exit(fileArg ? 0 : 1);
  }

  const file = resolveFilePath(fileArg);
  const parsed = readMarkdown(file);
  const current = parsed.frontmatter;
  const proposed: Frontmatter = { ...current };
  const warnings: string[] = [];
  const blockingProblems: string[] = [];

  const title = inferTitle(parsed);
  if (title) {
    proposed.title = title;
  } else {
    blockingProblems.push("Missing title and no H1 or filename-based title could be inferred.");
  }

  const rawSlug = asNonEmptyString(current.slug);
  if (rawSlug) {
    const normalized = normalizeSlug(rawSlug);
    if (normalized && normalized !== rawSlug) {
      proposed.slug = normalized;
      warnings.push(`Slug "${rawSlug}" is not lowercase kebab-case; proposed "${normalized}".`);
    } else {
      proposed.slug = rawSlug;
    }
  } else if (title) {
    const generated = generateSlug(title, parsed.body, path.basename(file));
    proposed.slug = generated;
    if (isGenericSlug(generated)) {
      blockingProblems.push(`Generated slug "${generated}" is too generic; provide a better public URL slug.`);
    }
  }

  if (!asNonEmptyString(current.date)) {
    proposed.date = shanghaiDate();
  }

  const summary = asNonEmptyString(current.summary);
  const description = asNonEmptyString(current.description);
  if (summary && description && summary !== description) {
    blockingProblems.push("Existing summary and description conflict; choose the canonical summary before publishing.");
  } else if (!summary) {
    proposed.summary = description ?? generateSummary(title ?? String(proposed.title ?? "这篇文章"), parsed.body);
    if (description) {
      warnings.push("Existing description was preserved and copied into summary for Obsidian authoring.");
    }
  }

  const rawTier = current.tier;
  if (rawTier === undefined || rawTier === null || rawTier === "") {
    proposed.tier = "free";
  } else if (!isValidTier(rawTier)) {
    blockingProblems.push(`Invalid tier "${String(rawTier)}"; expected free, premium, or paid.`);
  }

  if (current.price === undefined || current.price === null || current.price === "") {
    proposed.price = 0;
  }
  if (proposed.tier === "paid") {
    const price = typeof proposed.price === "number" ? proposed.price : Number(proposed.price);
    if (!Number.isFinite(price) || price <= 0) {
      blockingProblems.push("tier: paid requires price > 0 before publishing.");
    }
  }

  const normalizedCategory = normalizeCategory(current.category);
  if (normalizedCategory !== undefined) {
    proposed.category = normalizedCategory;
  } else if (title) {
    proposed.category = inferCategory(title, parsed.body);
    if (proposed.category === null) {
      warnings.push("Category could not be inferred confidently; confirm whether it should remain null.");
    }
  }
  if (!isValidCategory(proposed.category)) {
    blockingProblems.push(`Invalid category "${String(proposed.category)}"; expected finance, tech, nomad, or null.`);
  }

  const existingTags = stripCategoryTags(asStringArray(current.tags));
  if (existingTags.length > 0) {
    proposed.tags = existingTags;
  } else {
    proposed.tags = generateTags(title ?? "", parsed.body, asNonEmptyString(proposed.category));
  }

  if (!("cover" in proposed) && !("cover_image" in proposed) && !("coverImage" in proposed)) {
    proposed.cover = null;
  }

  if (current.draft === true) {
    blockingProblems.push("draft: true is set; do not publish until user explicitly changes it to false.");
  } else if (current.draft === undefined) {
    proposed.draft = false;
  }

  if (current.pinned === undefined) {
    proposed.pinned = false;
  }

  const status = asNonEmptyString(current.status);
  if (status && status.toLowerCase() === "draft" && current.draft !== true) {
    warnings.push("status: Draft looks like Obsidian metadata. Confirm it should not block publishing.");
  }

  const series = asNonEmptyString(current.series);
  const seriesOrder = current.seriesOrder;
  if ((series && (seriesOrder === undefined || seriesOrder === null || seriesOrder === "")) || (!series && seriesOrder !== undefined && seriesOrder !== null && seriesOrder !== "")) {
    blockingProblems.push("series and seriesOrder must be declared together.");
  } else {
    if (!("series" in proposed)) proposed.series = null;
    if (!("seriesOrder" in proposed)) proposed.seriesOrder = null;
  }

  const changedFields = diffFrontmatter(current, proposed);
  const slug = asNonEmptyString(proposed.slug);
  const result: PrepareResult = {
    file,
    currentFrontmatter: current,
    proposedFrontmatter: proposed,
    changedFields,
    warnings,
    blockingProblems,
    requiresUserInput: blockingProblems.length > 0,
    requiresConfirmation: true,
    expectedUrl: slug ? `${SITE_URL}/${slug}/` : null,
  };

  console.log(JSON.stringify(result, null, 2));
}

function diffFrontmatter(current: Frontmatter, proposed: Frontmatter): PrepareResult["changedFields"] {
  const diff: PrepareResult["changedFields"] = {};
  const keys = new Set([...Object.keys(current), ...Object.keys(proposed)]);
  for (const key of keys) {
    const from = current[key];
    const to = proposed[key];
    if (JSON.stringify(from) !== JSON.stringify(to)) {
      diff[key] = { from, to: to as YamlValue };
    }
  }
  return diff;
}

function printUsage(): void {
  console.error("Usage: bun prepare_frontmatter.ts /absolute/path/article.md");
}

main();
