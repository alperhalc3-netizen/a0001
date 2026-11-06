import { cpSync, existsSync, mkdirSync, renameSync, rmSync } from "fs";
import { spawnSync } from "child_process";
import path from "path";

const root = process.cwd();
const api = path.join(root, "app", "api");
const parked = path.join(root, ".api-dev-only");
const publicData = path.join(root, "public", "data");

mkdirSync(publicData, { recursive: true });
cpSync(path.join(root, "data", "content.json"), path.join(publicData, "content.json"));

let moved = false;
if (existsSync(api)) {
  if (existsSync(parked)) rmSync(parked, { recursive: true, force: true });
  renameSync(api, parked);
  moved = true;
}

const result = spawnSync("npx", ["next", "build"], {
  stdio: "inherit",
  env: { ...process.env, STATIC_EXPORT: "1" },
});

if (moved && existsSync(parked)) {
  renameSync(parked, api);
}

process.exit(result.status ?? 1);
