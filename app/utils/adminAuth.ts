export const ADMIN_COOKIE_NAME = "teenliwa_admin_session";
const SESSION_TTL_SECONDS = 60 * 60 * 12;

function getEnv(context?: unknown): Record<string, string | undefined> {
  const workerEnv = (context as { cloudflare?: { env?: Record<string, string | undefined> } } | undefined)?.cloudflare?.env;
  if (workerEnv) return workerEnv;
  return typeof process !== "undefined" ? process.env : {};
}

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlDecode(value: string): Uint8Array {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(base64 + "=".repeat((4 - (base64.length % 4)) % 4));
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function signature(payload: string, secret: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload)));
}

export async function createAdminSession(context?: unknown): Promise<string | null> {
  const secret = getEnv(context).ADMIN_SESSION_SECRET;
  if (!secret) return null;
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const payload = String(expiresAt);
  return `${payload}.${base64UrlEncode(await signature(payload, secret))}`;
}

export async function verifyAdminAuth(request: Request, context?: unknown): Promise<{ authorized: boolean; reason?: string }> {
  const secret = getEnv(context).ADMIN_SESSION_SECRET;
  if (!secret) return { authorized: false, reason: "Admin session is not configured on the server." };

  const cookieHeader = request.headers.get("cookie") || "";
  const cookie = cookieHeader.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${ADMIN_COOKIE_NAME}=`));
  const value = cookie?.slice(ADMIN_COOKIE_NAME.length + 1);
  if (!value) return { authorized: false, reason: "Admin session required." };

  const [expiresAt, encodedSignature, ...extra] = value.split(".");
  if (!expiresAt || !encodedSignature || extra.length || !/^\d+$/.test(expiresAt)) {
    return { authorized: false, reason: "Invalid admin session." };
  }
  if (Number(expiresAt) <= Math.floor(Date.now() / 1000)) {
    return { authorized: false, reason: "Admin session expired." };
  }

  try {
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"],
    );
    const valid = await crypto.subtle.verify("HMAC", key, base64UrlDecode(encodedSignature), new TextEncoder().encode(expiresAt));
    return valid ? { authorized: true } : { authorized: false, reason: "Invalid admin session." };
  } catch {
    return { authorized: false, reason: "Invalid admin session." };
  }
}

export function adminSessionCookie(request: Request, value: string, maxAge = SESSION_TTL_SECONDS): string {
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return `${ADMIN_COOKIE_NAME}=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${secure}`;
}

export function isValidAdminPassword(username: unknown, password: unknown, context?: unknown): boolean {
  const env = getEnv(context);
  return Boolean(env.ADMIN_PASSWORD && typeof username === "string" && typeof password === "string" && username === (env.ADMIN_USERNAME || "admin") && password === env.ADMIN_PASSWORD);
}
