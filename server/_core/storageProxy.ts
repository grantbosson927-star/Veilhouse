import type { Express } from "express";
import { getRuntime } from "../runtime";

function guessContentType(key: string): string {
  const lower = key.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".gif")) return "image/gif";
  if (lower.endsWith(".mp4")) return "video/mp4";
  if (lower.endsWith(".webm")) return "video/webm";
  return "application/octet-stream";
}

export function registerStorageProxy(app: Express) {
  const handler = async (req: { params: Record<string, string> }, res: {
    status: (code: number) => { send: (body: string) => void };
    set: (header: string, value: string) => void;
    send: (body: Buffer | string) => void;
  }) => {
    const key = String(req.params[0] || "").replace(/^\/+/, "");
    if (!key) {
      res.status(400).send("Missing storage key");
      return;
    }

    const media = getRuntime()?.media;
    if (media) {
      const object = await media.get(key);
      if (!object) {
        res.status(404).send("Not found");
        return;
      }
      res.set("Content-Type", object.httpMetadata?.contentType || guessContentType(key));
      res.set("Cache-Control", "public, max-age=31536000, immutable");
      res.send(Buffer.from(await object.arrayBuffer()));
      return;
    }

    try {
      const fs = await import("node:fs/promises");
      const path = await import("node:path");
      const filePath = path.join(process.cwd(), ".data", "media", key);
      const bytes = await fs.readFile(filePath);
      res.set("Content-Type", guessContentType(key));
      res.set("Cache-Control", "public, max-age=31536000, immutable");
      res.send(bytes);
    } catch {
      res.status(404).send("Not found");
    }
  };

  app.get("/media/*", handler);
  app.get("/manus-storage/*", handler);
}
