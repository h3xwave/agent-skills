import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function runNode(argumentsList) {
  const result = spawnSync(process.execPath, argumentsList, {
    cwd: repoRoot,
    stdio: "inherit",
    windowsHide: true,
  });
  if (result.error) {
    console.error(result.error.message);
    return 1;
  }
  return result.status ?? 1;
}

const unitStatus = runNode([
  "--test",
  "tests/validator.test.mjs",
  "tests/install-skill.test.mjs",
]);
if (unitStatus !== 0) {
  process.exit(unitStatus);
}

process.exit(runNode(["tests/validate-repository.mjs", ...process.argv.slice(2)]));
