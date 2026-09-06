import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { extname, join, relative, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const root = resolve(import.meta.dirname, "..");
const bucket = process.argv[2] || "veilhouse-media";
const runner = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
const types = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
};

function walk(dir) {
  const files = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) files.push(...walk(full));
    else files.push(full);
  }
  return files;
}

function put(key, file, contentType) {
  console.log(`Uploading ${key} to ${bucket}...`);
  const result = spawnSync(
    runner,
    ["exec", "wrangler", "r2", "object", "put", `${bucket}/${key}`, `--file=${file}`, `--content-type=${contentType}`, "--remote"],
    { cwd: root, stdio: "inherit", env: process.env, shell: process.platform === "win32" },
  );
  if (result.status !== 0) process.exit(result.status ?? 1);
}

const manifestPath = resolve(root, "media/manifest.json");
if (existsSync(manifestPath)) {
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  for (const asset of manifest.objects) {
    const file = resolve(root, "media", asset.key);
    const fallback = resolve(root, "client/public/archive-assets/generated/veilhouse", asset.key);
    const path = existsSync(file) ? file : fallback;
    if (!existsSync(path)) {
      console.warn(`Skipping missing media file: ${asset.key}`);
      continue;
    }
    put(asset.key, path, asset.contentType);
  }
}

const archiveRoot = resolve(root, "client/public/archive-assets");
if (existsSync(archiveRoot)) {
  for (const file of walk(archiveRoot)) {
    const contentType = types[extname(file).toLowerCase()];
    if (!contentType) continue;
    const key = relative(resolve(root, "client/public"), file).replaceAll("\\", "/");
    put(key, file, contentType);
  }
}

console.log(`Finished uploading objects to ${bucket}.`);
