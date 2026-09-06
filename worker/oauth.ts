import { COOKIE_NAME, ONE_YEAR_MS, OAUTH_STATE_COOKIE, decodeOAuthState } from "@shared/const";
import { parse as parseCookieHeader } from "cookie";
import * as db from "../server/db";
import { getSessionCookieOptions, serializeCookie } from "../server/_core/cookies";
import { sdk } from "../server/_core/sdk";

export async function registerOAuthCallback(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (!code || !state) {
    return Response.json({ error: "code and state are required" }, { status: 400 });
  }

  const { nonce } = decodeOAuthState(state);
  const expectedNonce = parseCookieHeader(request.headers.get("cookie") ?? "")[OAUTH_STATE_COOKIE];
  if (!nonce || nonce !== expectedNonce) {
    return Response.json({ error: "invalid oauth state" }, { status: 403 });
  }

  try {
    const tokenResponse = await sdk.exchangeCodeForToken(code, state);
    const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
    if (!userInfo.openId) {
      return Response.json({ error: "openId missing from user info" }, { status: 400 });
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

    const cookieOptions = getSessionCookieOptions({ protocol: "https", headers: { "x-forwarded-proto": "https" } });
    const headers = new Headers();
    headers.set("Location", "/");
    headers.append("Set-Cookie", serializeCookie(COOKIE_NAME, sessionToken, { ...cookieOptions, secure: true, maxAge: ONE_YEAR_MS }));
    headers.append("Set-Cookie", serializeCookie(OAUTH_STATE_COOKIE, "", { path: "/", secure: true, sameSite: "none", maxAge: 0 }));
    return new Response(null, { status: 302, headers });
  } catch (error) {
    console.error("[OAuth] Callback failed", error);
    return Response.json({ error: "OAuth callback failed" }, { status: 500 });
  }
}
