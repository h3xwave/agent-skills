import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const [scriptArgument, ...scriptArguments] = process.argv.slice(2);

if (!scriptArgument) {
  console.error("Usage: node scripts/run-python.mjs <script.py> [...args]");
  process.exit(2);
}

const script = path.resolve(repoRoot, scriptArgument);
if (!fs.existsSync(script) || !fs.statSync(script).isFile()) {
  console.error(`Python script not found: ${script}`);
  process.exit(2);
}

const candidates = process.platform === "win32"
  ? [["py", ["-3"]], ["python", []], ["python3", []]]
  : [["python3", []], ["python", []]];

for (const [command, prefix] of candidates) {
  const result = spawnSync(command, [...prefix, script, ...scriptArguments], {
    cwd: repoRoot,
    stdio: "inherit",
    windowsHide: true,
  });
  if (result.error?.code === "ENOENT") {
    continue;
  }
  if (result.error) {
    console.error(`Failed to start ${command}: ${result.error.message}`);
    process.exit(1);
  }
  process.exit(result.status ?? 1);
}

console.error("Python 3 was not found. Install Python to use the patent DOCX tools.");
process.exit(1);
