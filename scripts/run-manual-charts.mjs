#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const script = path.join(root, "scripts", "pre_release_manual_charts.py");

function pythonCmd() {
  if (process.env.PYTHON) return [process.env.PYTHON];
  const winVenv = path.join(root, "apps", "api", ".venv", "Scripts", "python.exe");
  const unixVenv = path.join(root, "apps", "api", ".venv", "bin", "python");
  if (existsSync(winVenv)) return [winVenv];
  if (existsSync(unixVenv)) return [unixVenv];
  if (process.platform === "win32") return ["py", "-3.11"];
  return ["python3"];
}

const parts = pythonCmd();
const python = parts[0];
const prefixArgs = parts.slice(1);
const result = spawnSync(python, [...prefixArgs, script], {
  cwd: root,
  stdio: "inherit",
  shell: false,
});

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 1);
