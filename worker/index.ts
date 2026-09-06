import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "../server/routers";
import { sdk } from "../server/_core/sdk";
import { getSessionCookieOptions, serializeCookie, type CookieOptions } from "../server/_core/cookies";
import { runWithRuntime } from "../server/runtime";
import { publishDueCuratorPosts } from "../server/scheduled";
import { handleGitHubOAuth } from "../server/_core/githubOAuth";

export interface WorkerEnv {
  DB: D1Database;
  MEDIA: R2Bucket;
  ASSETS: Fetcher;
  JWT_SECRET: string;
  CURATOR_EMAIL?: string;
  OWNER_OPEN_ID?: string;
  OWNER_NAME?: string;
  VITE_APP_ID?: string;
  OAUTH_SERVER_URL?: string;
  GITHUB_CLIENT_ID?: string;
  GITHUB_CLIENT_SECRET?: string;
  GITHUB_REDIRECT_URI?: string;
}

function applyEnv(env: WorkerEnv) {
  process.env.JWT_SECRET = env.JWT_SECRET || process.env.JWT_SECRET;
  process.env.CURATOR_EMAIL = env.CURATOR_EMAIL || process.env.CURATOR_EMAIL;
  process.env.OWNER_OPEN_ID = env.OWNER_OPEN_ID || process.env.OWNER_OPEN_ID;
  process.env.OWNER_NAME = env.OWNER_NAME || process.env.OWNER_NAME;
  process.env.VITE_APP_ID = env.VITE_APP_ID || process.env.VITE_APP_ID || "veilhouse";
  process.env.OAUTH_SERVER_URL = env.OAUTH_SERVER_URL || process.env.OAUTH_SERVER_URL;
  process.env.GITHUB_CLIENT_ID = env.GITHUB_CLIENT_ID || process.env.GITHUB_CLIENT_ID;
  process.env.GITHUB_CLIENT_SECRET = env.GITHUB_CLIENT_SECRET || process.env.GITHUB_CLIENT_SECRET;
  process.env.GITHUB_REDIRECT_URI = env.GITHUB_REDIRECT_URI || process.env.GITHUB_REDIRECT_URI;
}

function headerMap(request: Request): Record<string, string | undefined> {
  return {
    cookie: request.headers.get("cookie") ?? undefined,
    authorization: request.headers.get("authorization") ?? undefined,
    "x-forwarded-proto": request.headers.get("x-forwarded-proto") ?? "https",
  };
}

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

async function serveMedia(env: WorkerEnv, key: string) {
  const object = await env.MEDIA.get(key);
  if (!object) return new Response("Not found", { status: 404 });
  const headers = new Headers();
  headers.set("Content-Type", object.httpMetadata?.contentType || guessContentType(key));
  headers.set("Cache-Control", "public, max-age=31536000, immutable");
  headers.set("ETag", object.httpEtag);
  return new Response(object.body, { headers });
}

function cookieSerializer(request: Request, headers: Headers) {
  const req = { protocol: "https", headers: headerMap(request) };
  const defaults = getSessionCookieOptions(req);
  return {
    req,
    res: {
      cookie(name: string, value: string, options: CookieOptions = {}) {
        headers.append("Set-Cookie", serializeCookie(name, value, { ...defaults, ...options }));
      },
      clearCookie(name: string, options: CookieOptions = {}) {
        headers.append("Set-Cookie", serializeCookie(name, "", { ...defaults, ...options, maxAge: 0 }));
      },
    },
  };
}

async function handleTrpc(request: Request, env: WorkerEnv) {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req: request,
    router: appRouter,
    createContext: async ({ req, resHeaders }) => {
      const { req: cookieReq, res } = cookieSerializer(req, resHeaders);
      let user = null;
      try {
        user = await sdk.authenticateRequest(cookieReq);
      } catch {
        user = null;
      }
      return { req: cookieReq, res, user };
    },
  });
}

export default {
  async fetch(request: Request, env: WorkerEnv): Promise<Response> {
    applyEnv(env);
    return runWithRuntime({ d1: env.DB, media: env.MEDIA }, async () => {
      const url = new URL(request.url);

      if (url.pathname === "/api/health") {
        return Response.json({ ok: true, service: "veilhouse" });
      }

      if (url.pathname.startsWith("/media/")) {
        return serveMedia(env, url.pathname.slice("/media/".length));
      }
      if (url.pathname.startsWith("/manus-storage/")) {
        return serveMedia(env, url.pathname.slice("/manus-storage/".length));
      }

      if (url.pathname === "/api/auth/github" || url.pathname === "/api/auth/github/callback") {
        return handleGitHubOAuth(request);
      }

      if (url.pathname.startsWith("/api/trpc")) {
        return handleTrpc(request, env);
      }

      if (url.pathname === "/api/scheduled/publishCuratorPost" && request.method === "POST") {
        const published = await publishDueCuratorPosts();
        return Response.json({ ok: true, published });
      }

      return env.ASSETS.fetch(request);
    });
  },

  async scheduled(_controller: ScheduledController, env: WorkerEnv): Promise<void> {
    applyEnv(env);
    await runWithRuntime({ d1: env.DB, media: env.MEDIA }, () => publishDueCuratorPosts());
  },
};
