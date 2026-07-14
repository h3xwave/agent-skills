import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import YAML from "yaml";

export const ALLOWED_TOP_LEVEL = new Set([
  "SKILL.md",
  "agents",
  "references",
  "scripts",
  "assets",
  "rules",
  "workflows",
  "templates",
  "docs",
]);

export class Validation {
  constructor() {
    this.checks = 0;
    this.errors = [];
    this.warnings = [];
  }

  require(condition, message) {
    this.checks += 1;
    if (!condition) {
      this.errors.push(message);
    }
  }

  warn(message) {
    this.warnings.push(message);
  }
}

export function readText(file) {
  return fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "");
}

export function readJson(file) {
  return JSON.parse(readText(file));
}

export function parseFrontmatter(text) {
  const normalized = text.replace(/\r\n/g, "\n");
  if (!normalized.startsWith("---\n")) {
    return {
      data: null,
      raw: "",
      body: normalized,
      keys: [],
      errors: ["No YAML frontmatter found"],
    };
  }

  const closing = normalized.indexOf("\n---", 4);
  if (closing < 0) {
    return {
      data: null,
      raw: "",
      body: normalized,
      keys: [],
      errors: ["Invalid frontmatter format"],
    };
  }

  const afterClosing = closing + 4;
  if (afterClosing < normalized.length && normalized[afterClosing] !== "\n") {
    return {
      data: null,
      raw: "",
      body: normalized,
      keys: [],
      errors: ["Invalid frontmatter closing delimiter"],
    };
  }

  const raw = normalized.slice(4, closing);
  const body = normalized.slice(afterClosing).replace(/^\n/, "");
  const document = YAML.parseDocument(raw, { uniqueKeys: true });
  const errors = document.errors.map((error) => error.message);
  let data = null;
  if (errors.length === 0) {
    data = document.toJS();
  }
  const keys = data && typeof data === "object" && !Array.isArray(data)
    ? Object.keys(data)
    : [];
  return { data, raw, body, keys, errors };
}

export function toPosix(value) {
  return value.split(path.sep).join("/");
}

export function resolveUserPath(value) {
  let expanded = value;
  if (value === "~") expanded = os.homedir();
  if (value.startsWith("~/") || value.startsWith("~\\")) {
    expanded = path.join(os.homedir(), value.slice(2));
  }
  return path.resolve(expanded);
}

export function listTree(root, { includeDirectories = false, rejectSymlinks = false } = {}) {
  if (!fs.existsSync(root)) {
    return [];
  }

  const results = [];
  const visit = (directory) => {
    const entries = fs.readdirSync(directory, { withFileTypes: true })
      .sort((left, right) => left.name.localeCompare(right.name));
    for (const entry of entries) {
      const absolute = path.join(directory, entry.name);
      const relative = toPosix(path.relative(root, absolute));
      if (entry.isSymbolicLink()) {
        if (rejectSymlinks) {
          throw new Error(`symbolic links are not supported: ${absolute}`);
        }
        results.push({ absolute, relative, type: "symlink" });
      } else if (entry.isDirectory()) {
        if (includeDirectories) {
          results.push({ absolute, relative, type: "directory" });
        }
        visit(absolute);
      } else if (entry.isFile()) {
        results.push({ absolute, relative, type: "file" });
      }
    }
  };
  visit(root);
  return results;
}

export function listFiles(root, options = {}) {
  return listTree(root, options).filter((entry) => entry.type === "file");
}

export function hashFile(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

export function localMarkdownTargets(markdownPath, text) {
  const targets = [];
  const linkPattern = /\[[^\]]*\]\(([^)]+)\)/g;
  for (const match of text.matchAll(linkPattern)) {
    let target = match[1].trim().replace(/^<|>$/g, "");
    if (!target || /^(?:#|https?:\/\/|mailto:)/i.test(target)) {
      continue;
    }
    target = target.split("#", 1)[0];
    try {
      target = decodeURIComponent(target);
    } catch {
      // Leave malformed percent-encoding intact so the path check fails clearly.
    }
    if (target) {
      targets.push(path.resolve(path.dirname(markdownPath), target));
    }
  }
  return targets;
}

export function validateMarkdownLinks(root, validation) {
  for (const markdown of listFiles(root).filter((entry) => entry.relative.endsWith(".md"))) {
    for (const target of localMarkdownTargets(markdown.absolute, readText(markdown.absolute))) {
      validation.require(
        fs.existsSync(target),
        `broken Markdown path in ${markdown.relative}: ${target}`,
      );
    }
  }
}

export function validateContractCases(skillDir, casesPath, validation) {
  validation.require(fs.existsSync(casesPath), `missing contract cases: ${casesPath}`);
  if (!fs.existsSync(casesPath)) {
    return;
  }

  let data;
  try {
    data = readJson(casesPath);
  } catch (error) {
    validation.require(false, `invalid contract cases: ${error.message}`);
    return;
  }
  const cases = Array.isArray(data?.cases) ? data.cases : [];
  validation.require(cases.length >= 10, `expected at least 10 contract cases; got ${cases.length}`);
  const seen = new Set();
  for (const contractCase of cases) {
    const caseId = contractCase?.id ?? "<missing-id>";
    validation.require(!seen.has(caseId), `duplicate contract case id: ${caseId}`);
    seen.add(caseId);
    validation.require(
      Boolean(contractCase?.request) && Boolean(contractCase?.expected),
      `contract case lacks request/expected: ${caseId}`,
    );
    for (const evidence of contractCase?.evidence ?? []) {
      const relative = evidence?.path ?? "";
      const evidencePath = path.join(skillDir, relative);
      validation.require(
        fs.existsSync(evidencePath) && fs.statSync(evidencePath).isFile(),
        `contract case ${caseId} references missing file: ${relative}`,
      );
      if (fs.existsSync(evidencePath) && fs.statSync(evidencePath).isFile()) {
        const evidenceText = readText(evidencePath);
        for (const term of evidence?.contains_all ?? []) {
          validation.require(
            evidenceText.includes(term),
            `contract case ${caseId} lacks evidence in ${relative}: ${term}`,
          );
        }
      }
    }
  }
}

export function validateOpenAiAgent(skillDir, skillName, validation) {
  const agentPath = path.join(skillDir, "agents", "openai.yaml");
  validation.require(fs.existsSync(agentPath), `missing OpenAI agent metadata: agents/openai.yaml`);
  if (!fs.existsSync(agentPath)) {
    return;
  }

  let document;
  try {
    document = YAML.parseDocument(readText(agentPath), { uniqueKeys: true });
  } catch (error) {
    validation.require(false, `invalid agents/openai.yaml: ${error.message}`);
    return;
  }
  for (const error of document.errors) {
    validation.require(false, `invalid agents/openai.yaml: ${error.message}`);
  }
  if (document.errors.length > 0) {
    return;
  }
  const data = document.toJS();
  const interfaceData = data?.interface;
  validation.require(
    interfaceData && typeof interfaceData === "object" && !Array.isArray(interfaceData),
    "agents/openai.yaml must contain an interface mapping",
  );
  if (!interfaceData || typeof interfaceData !== "object" || Array.isArray(interfaceData)) {
    return;
  }
  for (const field of ["display_name", "short_description", "default_prompt"]) {
    validation.require(
      typeof interfaceData[field] === "string" && interfaceData[field].trim().length > 0,
      `agents/openai.yaml interface.${field} must be a non-empty string`,
    );
  }
  validation.require(
    typeof interfaceData.default_prompt === "string"
      && interfaceData.default_prompt.includes(`$${skillName}`),
    `agents/openai.yaml default_prompt must contain $${skillName}`,
  );
}

export function compareTrees(sourceRoot, destinationRoot) {
  const sourceTree = listTree(sourceRoot, { includeDirectories: true, rejectSymlinks: true });
  const destinationTree = listTree(destinationRoot, { includeDirectories: true, rejectSymlinks: true });
  const sourceFiles = sourceTree.filter((entry) => entry.type === "file");
  const destinationFiles = destinationTree.filter((entry) => entry.type === "file");
  const sourceMap = new Map(sourceFiles.map((entry) => [entry.relative, entry.absolute]));
  const destinationMap = new Map(destinationFiles.map((entry) => [entry.relative, entry.absolute]));
  const sourceDirectories = new Set(sourceTree.filter((entry) => entry.type === "directory").map((entry) => entry.relative));
  const destinationDirectories = new Set(destinationTree.filter((entry) => entry.type === "directory").map((entry) => entry.relative));
  const added = [];
  const updated = [];
  const removed = [];
  const addedDirectories = [];
  const removedDirectories = [];

  for (const [relative, sourceFile] of sourceMap) {
    if (!destinationMap.has(relative)) {
      added.push(relative);
    } else if (hashFile(sourceFile) !== hashFile(destinationMap.get(relative))) {
      updated.push(relative);
    }
  }
  for (const relative of destinationMap.keys()) {
    if (!sourceMap.has(relative)) {
      removed.push(relative);
    }
  }
  for (const relative of sourceDirectories) {
    if (!destinationDirectories.has(relative)) addedDirectories.push(relative);
  }
  for (const relative of destinationDirectories) {
    if (!sourceDirectories.has(relative)) removedDirectories.push(relative);
  }
  return {
    added: added.sort(),
    updated: updated.sort(),
    removed: removed.sort(),
    addedDirectories: addedDirectories.sort(),
    removedDirectories: removedDirectories.sort(),
  };
}

export function validateExactMirror(sourceRoot, destinationRoot, validation, label = "installed skill") {
  validation.require(
    fs.existsSync(destinationRoot) && fs.statSync(destinationRoot).isDirectory(),
    `${label} directory does not exist: ${destinationRoot}`,
  );
  if (!fs.existsSync(destinationRoot) || !fs.statSync(destinationRoot).isDirectory()) {
    return;
  }
  let diff;
  try {
    diff = compareTrees(sourceRoot, destinationRoot);
  } catch (error) {
    validation.require(false, `${label} tree comparison failed: ${error.message}`);
    return;
  }
  for (const relative of diff.added) {
    validation.require(false, `${label} is missing source file: ${relative}`);
  }
  for (const relative of diff.updated) {
    validation.require(false, `${label} file differs from source: ${relative}`);
  }
  for (const relative of diff.removed) {
    validation.require(false, `${label} contains extra file: ${relative}`);
  }
  for (const relative of diff.addedDirectories) {
    validation.require(false, `${label} is missing source directory: ${relative}`);
  }
  for (const relative of diff.removedDirectories) {
    validation.require(false, `${label} contains extra directory: ${relative}`);
  }
  validation.require(
    diff.added.length === 0
      && diff.updated.length === 0
      && diff.removed.length === 0
      && diff.addedDirectories.length === 0
      && diff.removedDirectories.length === 0,
    `${label} must be an exact source mirror`,
  );
}

export function printValidation(validation, successMessage) {
  for (const warning of validation.warnings) {
    console.log(`WARNING: ${warning}`);
  }
  if (validation.errors.length > 0) {
    console.error(`FAILED: ${validation.errors.length} of ${validation.checks} checks failed`);
    for (const error of validation.errors) {
      console.error(`- ${error}`);
    }
    return false;
  }
  console.log(successMessage.replace("{checks}", String(validation.checks)));
  return true;
}
