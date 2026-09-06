import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

const root = resolve(import.meta.dirname, "..");
const manifest = JSON.parse(readFileSync(resolve(root, "media/manifest.json"), "utf8"));
const bucket = process.argv[2] || manifest.bucket;
const runner = process.platform === "win32" ? "pnpm.cmd" : "pnpm";

for (const asset of manifest.objects) {
  const file = resolve(root, "media", asset.key);
  if (!existsSync(file)) throw new Error(`Missing media file: ${file}`);
  console.log(`Uploading ${asset.key} to ${bucket}...`);
  const result = spawnSync(runner, ["exec", "wrangler", "r2", "object", "put", `${bucket}/${asset.key}`, `--file=${file}`, `--content-type=${asset.contentType}`], { cwd: root, stdio: "inherit" });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
console.log(`Uploaded ${manifest.objects.length} assets to ${bucket}.`);
