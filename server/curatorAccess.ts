import { parse } from "cookie";
import { jwtVerify, SignJWT } from "jose";
import type { Request, Response } from "express";
import type { User } from "../drizzle/schema";
import { ENV } from "./_core/env";
import { getSessionCookieOptions } from "./_core/cookies";

export const CURATOR_ACCESS_COOKIE = "veilhouse-curator-access";
const CURATOR_ACCESS_TTL_SECONDS = 60 * 60 * 8;

function signingKey() {
  return new TextEncoder().encode(ENV.cookieSecret || "veilhouse-curator-session-key");
}

export function isConfiguredCuratorEmail(email: string) {
  return email.trim().toLowerCase() === ENV.curatorEmail.toLowerCase();
}

export async function grantCuratorAccess(req: Request, res: Response, user: User, email: string) {
  if (!isConfiguredCuratorEmail(email)) return false;

  const token = await new SignJWT({ email: ENV.curatorEmail.toLowerCase() })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.openId)
    .setIssuedAt()
    .setExpirationTime(`${CURATOR_ACCESS_TTL_SECONDS}s`)
    .sign(signingKey());

  res.cookie(CURATOR_ACCESS_COOKIE, token, {
    ...getSessionCookieOptions(req),
    maxAge: CURATOR_ACCESS_TTL_SECONDS * 1000,
  });
  return true;
}

export async function hasCuratorAccess(req: Request, user: User | null) {
  if (!user) return false;
  if (ENV.ownerOpenId && user.openId === ENV.ownerOpenId) return true;
  if (ENV.ownerName && user.id === 1 && user.name === ENV.ownerName) return true;

  const token = parse(req.headers?.cookie ?? "")[CURATOR_ACCESS_COOKIE];
  if (!token) return false;

  try {
    const { payload } = await jwtVerify(token, signingKey(), { algorithms: ["HS256"] });
    return payload.sub === user.openId && payload.email === ENV.curatorEmail.toLowerCase();
  } catch {
    return false;
  }
}

export function revokeCuratorAccess(req: Request, res: Response) {
  res.clearCookie(CURATOR_ACCESS_COOKIE, {
    ...getSessionCookieOptions(req),
    maxAge: -1,
  });
}
