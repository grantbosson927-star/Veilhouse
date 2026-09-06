import { parse as parseCookieHeader } from "cookie";
import type { Express, Request as ExpressRequest, Response as ExpressResponse } from "express";
import { upsertUser, getUserByOpenId } from "../db";
import { sdk } from "./sdk";
import { getSessionCookieOptions, serializeCookie } from "./cookies";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { ENV } from "./env";

export const GITHUB_STATE_COOKIE = "veilhouse_github_oauth_state";

type GitHubProfile = { id: number; login: string; name?: string | null; email?: string | null };
type GitHubEmail = { email: string; primary: boolean; verified: boolean };

function config() {
  return {
    clientId: ENV.githubClientId,
    clientSecret: ENV.githubClientSecret,
  };
}

function redirectUri(origin: string) {
  return ENV.githubRedirectUri || `${origin}/api/auth/github/callback`;
}

export function githubLoginUrl(origin: string, state: string) {
  const { clientId } = config();
  if (!clientId) throw new Error("GitHub OAuth is not configured: GITHUB_CLIENT_ID is missing.");
  const url = new URL("https://github.com/login/oauth/authorize");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri(origin));
  url.searchParams.set("scope", "read:user user:email");
  url.searchParams.set("state", state);
  return url.toString();
}

async function exchangeCode(code: string, state: string, origin: string) {
  const { clientId, clientSecret } = config();
  if (!clientId || !clientSecret) throw new Error("GitHub OAuth is not configured: add GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET.");
  const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code, state, redirect_uri: redirectUri(origin) }),
  });
  const token = (await tokenResponse.json()) as { access_token?: string; error?: string; error_description?: string };
  if (!tokenResponse.ok || !token.access_token) throw new Error(token.error_description || token.error || "GitHub did not return an access token.");
  const headers = { Authorization: `Bearer ${token.access_token}`, Accept: "application/vnd.github+json", "User-Agent": "Veilhouse" };
  const profileResponse = await fetch("https://api.github.com/user", { headers });
  if (!profileResponse.ok) throw new Error("GitHub profile could not be read.");
  const profile = (await profileResponse.json()) as GitHubProfile;
  let email = profile.email || null;
  if (!email) {
    const emailsResponse = await fetch("https://api.github.com/user/emails", { headers });
    if (emailsResponse.ok) {
      const emails = (await emailsResponse.json()) as GitHubEmail[];
      email = emails.find((entry) => entry.primary && entry.verified)?.email || emails.find((entry) => entry.verified)?.email || null;
    }
  }
  return { profile, email };
}

async function establishSession(profile: GitHubProfile, email: string | null) {
  const openId = `github:${profile.id}`;
  await upsertUser({ openId, name: profile.name || profile.login, email, loginMethod: "github", lastSignedIn: new Date() });
  const user = await getUserByOpenId(openId);
  if (!user) throw new Error("The House could not record the GitHub resident in D1.");
  return sdk.createSessionToken(openId, { name: user.name || profile.login, expiresInMs: ONE_YEAR_MS });
}

export function registerGitHubOAuthRoutes(app: Express) {
  app.get("/api/auth/github", (req: ExpressRequest, res: ExpressResponse) => {
    try {
      const state = crypto.randomUUID();
      const origin = `${req.protocol}://${req.get("host")}`;
      res.cookie(GITHUB_STATE_COOKIE, state, { httpOnly: true, secure: true, sameSite: "lax", maxAge: 600000, path: "/" });
      res.redirect(302, githubLoginUrl(origin, state));
    } catch (error) {
      res.status(503).send(error instanceof Error ? error.message : "GitHub OAuth is not configured.");
    }
  });

  app.get("/api/auth/github/callback", async (req: ExpressRequest, res: ExpressResponse) => {
    const code = typeof req.query.code === "string" ? req.query.code : "";
    const state = typeof req.query.state === "string" ? req.query.state : "";
    const cookieState = parseCookieHeader(req.headers.cookie || "")[GITHUB_STATE_COOKIE];
    if (!code || !state || !cookieState || state !== cookieState) {
      res.status(403).send("The GitHub doorway rejected the state offered to it.");
      return;
    }
    try {
      const origin = `${req.protocol}://${req.get("host")}`;
      const { profile, email } = await exchangeCode(code, state, origin);
      const sessionToken = await establishSession(profile, email);
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(GITHUB_STATE_COOKIE, "", { httpOnly: true, secure: true, sameSite: "lax", maxAge: 0, path: "/" });
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      res.redirect(302, "/");
    } catch (error) {
      console.error("[GitHub OAuth] Callback failed", error);
      res.status(500).send("The House could not complete the GitHub entry rite.");
    }
  });
}

export async function handleGitHubOAuth(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const origin = url.origin;
  if (url.pathname === "/api/auth/github") {
    try {
      const state = crypto.randomUUID();
      const headers = new Headers({ Location: githubLoginUrl(origin, state) });
      headers.append("Set-Cookie", serializeCookie(GITHUB_STATE_COOKIE, state, { httpOnly: true, secure: true, sameSite: "lax", maxAge: 600, path: "/" }));
      return new Response(null, { status: 302, headers });
    } catch (error) {
      return new Response(error instanceof Error ? error.message : "GitHub OAuth is not configured.", { status: 503 });
    }
  }
  if (url.pathname !== "/api/auth/github/callback") return new Response("Not found", { status: 404 });
  const code = url.searchParams.get("code") || "";
  const state = url.searchParams.get("state") || "";
  const cookies = parseCookieHeader(request.headers.get("cookie") || "");
  if (!code || !state || !cookies[GITHUB_STATE_COOKIE] || cookies[GITHUB_STATE_COOKIE] !== state) return new Response("The GitHub doorway rejected the state offered to it.", { status: 403 });
  try {
    const { profile, email } = await exchangeCode(code, state, origin);
    const sessionToken = await establishSession(profile, email);
    const headers = new Headers({ Location: "/" });
    headers.append("Set-Cookie", serializeCookie(GITHUB_STATE_COOKIE, "", { httpOnly: true, secure: true, sameSite: "lax", maxAge: 0, path: "/" }));
    const sessionOptions = getSessionCookieOptions({ protocol: "https", headers: { cookie: request.headers.get("cookie") || undefined } });
    headers.append("Set-Cookie", serializeCookie(COOKIE_NAME, sessionToken, { ...sessionOptions, maxAge: ONE_YEAR_MS }));
    return new Response(null, { status: 302, headers });
  } catch (error) {
    console.error("[GitHub OAuth] Worker callback failed", error);
    return new Response("The House could not complete the GitHub entry rite.", { status: 500 });
  }
}
