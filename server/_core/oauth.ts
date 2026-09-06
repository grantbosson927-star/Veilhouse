import { COOKIE_NAME, ONE_YEAR_MS, OAUTH_STATE_COOKIE, decodeOAuthState } from "@shared/const";
import { parse as parseCookieHeader } from "cookie";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

export function registerOAuthRoutes(app: Express) {
  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }

    // CSRF guard: the nonce in `state` must match the one-time cookie that
    // startLogin set in the browser that began this login. An attacker can
    // forge `state`, but cannot plant this cookie in the victim's browser.
    const { nonce } = decodeOAuthState(state);
    const expectedNonce = parseCookieHeader(req.headers.cookie ?? "")[OAUTH_STATE_COOKIE];
    if (!nonce || nonce !== expectedNonce) {
      res.status(403).json({ error: "invalid oauth state" });
      return;
    }
    res.clearCookie(OAUTH_STATE_COOKIE, { path: "/", secure: true, sameSite: "none" });

    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);

      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }

      await db.upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: new Date(),
      });

      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });

  app.get("/api/auth/github", async (_req, res) => {
    const { startGithubLogin } = await import("../../worker/githubAuth");
    await pipeFetch(res, startGithubLogin({
      GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
      GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET,
    }));
  });

  app.get("/api/auth/github/callback", async (req, res) => {
    const { handleGithubCallback } = await import("../../worker/githubAuth");
    const origin = `${req.protocol}://${req.get("host")}`;
    const incoming = new Request(`${origin}${req.originalUrl}`, { headers: { cookie: req.headers.cookie ?? "" } });
    await pipeFetch(res, await handleGithubCallback(incoming, {
      GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
      GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET,
    }));
  });
}

async function pipeFetch(res: Response, response: globalThis.Response) {
  response.headers.forEach((value, key) => {
    if (key.toLowerCase() === "set-cookie") res.append("Set-Cookie", value);
    else res.setHeader(key, value);
  });
  res.status(response.status);
  const body = Buffer.from(await response.arrayBuffer());
  if (body.length) res.send(body);
  else res.end();
}
