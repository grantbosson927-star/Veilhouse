export type CookieRequest = {
  protocol?: string;
  hostname?: string;
  headers?: {
    cookie?: string | string[];
    authorization?: string | string[];
    "x-forwarded-proto"?: string | string[];
    [key: string]: string | string[] | undefined;
  };
};

export type CookieOptions = {
  domain?: string;
  httpOnly?: boolean;
  path?: string;
  sameSite?: "lax" | "none" | "strict" | boolean;
  secure?: boolean;
  maxAge?: number;
};

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

function isSecureRequest(req: CookieRequest) {
  if (req.protocol === "https") return true;
  const forwardedProto = req.headers?.["x-forwarded-proto"];
  if (!forwardedProto) return false;
  const protoList = Array.isArray(forwardedProto) ? forwardedProto : forwardedProto.split(",");
  return protoList.some((proto) => proto.trim().toLowerCase() === "https");
}

export function getSessionCookieOptions(
  req: CookieRequest,
): Pick<CookieOptions, "domain" | "httpOnly" | "path" | "sameSite" | "secure"> {
  void LOCAL_HOSTS;
  return {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: isSecureRequest(req),
  };
}

export function serializeCookie(name: string, value: string, options: CookieOptions = {}): string {
  const parts = [`${name}=${encodeURIComponent(value)}`];
  parts.push(`Path=${options.path ?? "/"}`);
  if (options.maxAge !== undefined) parts.push(`Max-Age=${Math.floor(options.maxAge / 1000)}`);
  if (options.domain) parts.push(`Domain=${options.domain}`);
  if (options.httpOnly) parts.push("HttpOnly");
  if (options.secure) parts.push("Secure");
  if (options.sameSite === true || options.sameSite === "strict") parts.push("SameSite=Strict");
  else if (options.sameSite === "lax") parts.push("SameSite=Lax");
  else if (options.sameSite === "none") parts.push("SameSite=None");
  return parts.join("; ");
}
