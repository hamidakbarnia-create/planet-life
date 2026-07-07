#!/usr/bin/env node
/**
 * Cross-platform API test runner for local pre-release gates.
 * Uses PYTHON if set, else apps/api/.venv, else py -3.11 (Windows) / python3.
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pytestArgs = ["-m", "pytest", "apps/api/tests", "-q"];

function runPython(python, label) {
  const result = spawnSync(python, pytestArgs, {
    cwd: root,
    stdio: "inherit",
    shell: false,
  });
  if (result.error) {
    return { ok: false, missing: true, label, error: result.error };
  }
  return { ok: result.status === 0, missing: false, label, status: result.status };
}

function candidates() {
  const list = [];

  if (process.env.PYTHON) {
    list.push({ cmd: process.env.PYTHON, label: `PYTHON=${process.env.PYTHON}` });
  }

  const winVenv = path.join(root, "apps", "api", ".venv", "Scripts", "python.exe");
  const unixVenv = path.join(root, "apps", "api", ".venv", "bin", "python");
  if (existsSync(winVenv)) {
    list.push({ cmd: winVenv, label: winVenv });
  }
  if (existsSync(unixVenv)) {
    list.push({ cmd: unixVenv, label: unixVenv });
  }

  if (process.platform === "win32") {
    list.push({ cmd: "py", args: ["-3.11", ...pytestArgs], label: "py -3.11" });
  }

  list.push({ cmd: "python3", label: "python3" });
  list.push({ cmd: "python", label: "python" });

  return list;
}

for (const entry of candidates()) {
  const python = entry.cmd;
  const args = entry.args ?? pytestArgs;
  const result = entry.args
    ? spawnSync(python, args, { cwd: root, stdio: "inherit", shell: false })
    : spawnSync(python, pytestArgs, { cwd: root, stdio: "inherit", shell: false });

  if (result.error) {
    if (result.error.code === "ENOENT") {
      continue;
    }
    console.error(`Failed to run API pytest via ${entry.label}:`, result.error.message);
    process.exit(1);
  }

  if (result.status === 0) {
    process.exit(0);
  }

  process.exit(result.status ?? 1);
}

console.error(
  "API pytest: no Python interpreter found. Set PYTHON, create apps/api/.venv, or install Python 3.11.",
);
process.exit(1);
