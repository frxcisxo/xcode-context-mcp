import * as fs from "fs";
import * as path from "path";

const IGNORED_DIRS = new Set([
  "node_modules",
  "Pods",
  ".git",
  "DerivedData",
  ".build",
  ".swiftpm",
  "Carthage",
  "build",
  "Products",
  ".idea",
  ".vscode",
  "__MACOSX",
]);

export function validateProjectPath(projectPath: string): { ok: true } | { ok: false; error: string } {
  if (!projectPath || typeof projectPath !== "string") {
    return { ok: false, error: "project_path is required (string)." };
  }
  if (!path.isAbsolute(projectPath)) {
    return { ok: false, error: `project_path must be an absolute path. Received: ${projectPath}` };
  }
  if (!fs.existsSync(projectPath)) {
    return { ok: false, error: `project_path does not exist: ${projectPath}` };
  }
  if (!fs.statSync(projectPath).isDirectory()) {
    return { ok: false, error: `project_path is not a directory: ${projectPath}` };
  }

  return { ok: true };
}

function normalizeProjectWarning(xcodeprojAtRoot: boolean): string | null {
  if (xcodeprojAtRoot) return null;
  // Tools like get_build_settings expect .xcodeproj at/near project root.
  return "No .xcodeproj found at the root of project_path. Some tools may return 'Not found'.";
}

export function readFile(filePath: string): string {
  return fs.readFileSync(filePath, "utf-8");
}

export function readFileLimited(filePath: string, maxChars: number): { text: string; truncated: boolean } {
  const stat = fs.statSync(filePath);
  if (stat.size <= 0) return { text: "", truncated: false };

  // UTF-8 could be up to 4 bytes per code point; read a safe upper-bound of bytes.
  const maxBytes = maxChars * 4;
  const bytesToRead = Math.min(stat.size, maxBytes);

  const fd = fs.openSync(filePath, "r");
  try {
    const buffer = Buffer.allocUnsafe(bytesToRead);
    fs.readSync(fd, buffer, 0, bytesToRead, 0);
    const text = buffer.toString("utf8").slice(0, maxChars);
    return { text, truncated: stat.size > maxBytes };
  } finally {
    fs.closeSync(fd);
  }
}

export function fileExists(filePath: string): boolean {
  return fs.existsSync(filePath);
}

export function walkDirectory(
  dirPath: string,
  maxDepth: number,
  currentDepth = 0,
  opts: { maxNodes?: number; visited?: { count: number } } = {}
): { tree: object; truncated: boolean } {
  if (currentDepth >= maxDepth) return { tree: {}, truncated: false };

  const visited = opts.visited ?? { count: 0 };
  const maxNodes = opts.maxNodes ?? 5000;

  if (visited.count >= maxNodes) {
    return { tree: {}, truncated: true };
  }

  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  const result: Record<string, any> = {};
  let truncated = false;

  for (const entry of entries) {
    if (visited.count >= maxNodes) {
      truncated = true;
      break;
    }
    if (entry.name.startsWith(".") || IGNORED_DIRS.has(entry.name)) continue;
    visited.count += 1;

    const fullPath = path.join(dirPath, entry.name);
    result[entry.isDirectory() ? `${entry.name}/` : entry.name] = entry.isDirectory()
      ? walkDirectory(fullPath, maxDepth, currentDepth + 1, { maxNodes, visited }).tree
      : "file";
  }
  return { tree: result, truncated };
}

export function findFileByName(
  dirPath: string,
  fileName: string,
  opts: { maxDepth?: number; maxNodes?: number } = {}
): string | null {
  const maxDepth = opts.maxDepth ?? 12;
  const maxNodes = opts.maxNodes ?? 30000;

  let found: string | null = null;
  const visited = { count: 0 };

  function walk(currentDir: string, depth: number) {
    if (found) return;
    if (depth > maxDepth) return;
    if (visited.count >= maxNodes) return;

    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      if (found) return;
      if (visited.count >= maxNodes) return;
      if (entry.name.startsWith(".") || IGNORED_DIRS.has(entry.name)) continue;
      visited.count += 1;

      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath, depth + 1);
      } else if (entry.name === fileName) {
        found = fullPath;
        return;
      }
    }
  }

  walk(dirPath, 0);
  return found;
}

export function findFileByExtension(
  dirPath: string,
  extension: string,
  opts: { maxDepth?: number; maxNodes?: number } = {}
): string | null {
  const maxDepth = opts.maxDepth ?? 12;
  const maxNodes = opts.maxNodes ?? 30000;

  let found: string | null = null;
  const visited = { count: 0 };

  function walk(currentDir: string, depth: number) {
    if (found) return;
    if (depth > maxDepth) return;
    if (visited.count >= maxNodes) return;

    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      if (found) return;
      if (visited.count >= maxNodes) return;
      if (entry.name.startsWith(".") || IGNORED_DIRS.has(entry.name)) continue;
      if (IGNORED_DIRS.has(entry.name)) continue;
      visited.count += 1;

      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath, depth + 1);
      } else if (entry.name.endsWith(extension)) {
        found = fullPath;
        return;
      }
    }
  }

  walk(dirPath, 0);
  return found;
}

export function findXcodeProjPath(
  dirPath: string,
  opts: { maxDepth?: number } = {}
): string | null {
  const maxDepth = opts.maxDepth ?? 2;
  let found: string | null = null;

  function walk(currentDir: string, depth: number) {
    if (found) return;
    if (depth > maxDepth) return;

    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      if (found) return;
      if (entry.name.startsWith(".") || IGNORED_DIRS.has(entry.name)) continue;
      if (entry.isDirectory() && entry.name.endsWith(".xcodeproj")) {
        found = path.join(currentDir, entry.name);
        return;
      }
      if (entry.isDirectory()) walk(path.join(currentDir, entry.name), depth + 1);
    }
  }

  walk(dirPath, 0);
  return found;
}

export function listFilesByExtension(
  dirPath: string,
  extension: string,
  opts: { maxDepth?: number; maxFiles?: number } = {}
): { files: string[]; truncated: boolean } {
  const maxDepth = opts.maxDepth ?? 8;
  const maxFiles = opts.maxFiles ?? 500;
  const files: string[] = [];
  const visited = { nodes: 0 };
  let truncated = false;

  function walk(currentDir: string, depth: number) {
    if (truncated) return;
    if (depth > maxDepth) return;
    if (files.length >= maxFiles) {
      truncated = true;
      return;
    }
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      if (truncated) return;
      if (entry.name.startsWith(".") || IGNORED_DIRS.has(entry.name)) continue;
      visited.nodes += 1;
      if (entry.isDirectory()) {
        walk(path.join(currentDir, entry.name), depth + 1);
      } else if (entry.name.endsWith(extension)) {
        files.push(path.join(currentDir, entry.name));
        if (files.length >= maxFiles) {
          truncated = true;
          return;
        }
      }
    }
  }

  walk(dirPath, 0);
  return { files, truncated };
}
