import { parse as parseCookieHeader } from "cookie";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions, serializeCookie } from "../server/_core/cookies";
import { sdk } from "../server/_core/sdk";
import { getCuratorEmail, upsertUser } from "../server/db";
import { grantCuratorAccess } from "../server/curatorAccess";

type GithubEnv = {
  GITHUB_CLIENT_ID?: string;
  GITHUB_CLIENT_SECRET?: string;
};

const STATE_COOKIE = "veilhouse_github_oauth_state";
const CALLBACK_PATH = "/api/auth/github/callback";
const PRODUCTION_ORIGIN = "https://veilhouse.monster";
const ALLOWED_LOGINS = new Set(["grantbosson927-star"]);

function callbackUrl() {
  return `${PRODUCTION_ORIGIN}${CALLBACK_PATH}`;
}

function cookieReq() {
  return { protocol: "https", headers: { "x-forwarded-proto": "https" } };
}

export function startGithubLogin(env: GithubEnv): Response {
  const clientId = env.GITHUB_CLIENT_ID;
  if (!clientId) {
    return Response.json({ error: "GitHub OAuth is not configured" }, { status: 500 });
  }

  const state = crypto.randomUUID();
  const authorize = new URL("https://github.com/login/oauth/authorize");
  authorize.searchParams.set("client_id", clientId);
  authorize.searchParams.set("redirect_uri", callbackUrl());
  authorize.searchParams.set("scope", "read:user user:email");
  authorize.searchParams.set("state", state);
  authorize.searchParams.set("allow_signup", "false");

  const headers = new Headers({ Location: authorize.toString() });
  headers.append(
    "Set-Cookie",
    serializeCookie(STATE_COOKIE, state, {
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secure: true,
      maxAge: 10 * 60 * 1000,
    }),
  );
  return new Response(null, { status: 302, headers });
}

export async function handleGithubCallback(request: Request, env: GithubEnv): Promise<Response> {
  const clientId = env.GITHUB_CLIENT_ID;
  const clientSecret = env.GITHUB_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return Response.json({ error: "GitHub OAuth is not configured" }, { status: 500 });
  }

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const expected = parseCookieHeader(request.headers.get("cookie") ?? "")[STATE_COOKIE];
  if (!code || !state || !expected || state !== expected) {
    return Response.json({ error: "invalid oauth state" }, { status: 403 });
  }

  const tokenResp = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: callbackUrl(),
    }),
  });
  const tokenBody = (await tokenResp.json()) as { access_token?: string; error?: string };
  if (!tokenResp.ok || !tokenBody.access_token) {
    return Response.json({ error: tokenBody.error || "GitHub token exchange failed" }, { status: 502 });
  }

  const ghHeaders = {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${tokenBody.access_token}`,
    "User-Agent": "veilhouse",
  };
  const userResp = await fetch("https://api.github.com/user", { headers: ghHeaders });
  const githubUser = (await userResp.json()) as { id?: number; login?: string; name?: string; email?: string };
  if (!userResp.ok || !githubUser.id || !githubUser.login) {
    return Response.json({ error: "GitHub user lookup failed" }, { status: 502 });
  }

  let email = (githubUser.email || "").trim().toLowerCase();
  if (!email) {
    const emailsResp = await fetch("https://api.github.com/user/emails", { headers: ghHeaders });
    if (emailsResp.ok) {
      const emails = (await emailsResp.json()) as Array<{ email?: string; primary?: boolean; verified?: boolean }>;
      const chosen = emails.find((item) => item.primary && item.verified) || emails.find((item) => item.verified) || emails[0];
      email = (chosen?.email || "").trim().toLowerCase();
    }
  }

  const curatorEmail = (await getCuratorEmail()).toLowerCase();
  const isCurator = ALLOWED_LOGINS.has(githubUser.login.toLowerCase()) || (email && email === curatorEmail);
  const openId = `github:${githubUser.id}`;
  await upsertUser({
    openId,
    name: githubUser.name || githubUser.login,
    email: email || null,
    loginMethod: "github",
    role: isCurator ? "admin" : "user",
    lastSignedIn: new Date(),
  });

  const sessionToken = await sdk.createSessionToken(openId, {
    name: githubUser.name || githubUser.login,
    expiresInMs: ONE_YEAR_MS,
  });
  const cookieOptions = getSessionCookieOptions(cookieReq());
  const headers = new Headers({ Location: isCurator ? "/curator-admin" : "/" });
  headers.append("Set-Cookie", serializeCookie(COOKIE_NAME, sessionToken, { ...cookieOptions, secure: true, maxAge: ONE_YEAR_MS }));
  headers.append("Set-Cookie", serializeCookie(STATE_COOKIE, "", { path: "/", secure: true, sameSite: "lax", maxAge: 0 }));

  if (isCurator) {
    const user = {
      id: 1,
      openId,
      name: githubUser.name || githubUser.login,
      email: email || curatorEmail,
      passwordHash: null,
      loginMethod: "github",
      role: "admin" as const,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    };
    const jar = {
      cookie(name: string, value: string, options?: { maxAge?: number }) {
        headers.append("Set-Cookie", serializeCookie(name, value, { ...cookieOptions, secure: true, ...options }));
      },
      clearCookie() {},
    };
    await grantCuratorAccess(cookieReq(), jar, { ...user, email: curatorEmail }, curatorEmail);
  }

  return new Response(null, { status: 302, headers });
}
