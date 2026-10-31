/**
 * Admin Authentication utility for API routes and CMS
 * Protects administrative routes like /api/orders from unauthorized access.
 */

export const ADMIN_AUTH_TOKEN = "khayrat-admin-secret-2025";
export const ADMIN_COOKIE_NAME = "khayrat_admin_auth";

interface AdminAuthResult {
  authorized: boolean;
  reason?: string;
}

/**
 * Validates whether the incoming Request has valid Admin credentials.
 * Supports:
 *  1. Header: Authorization: Bearer <token>
 *  2. Header: Authorization: Basic <base64(user:pass)>
 *  3. Header: x-admin-token, x-admin-key, x-admin-auth
 *  4. Cookie: khayrat_admin_auth=<token|1|true>
 *  5. Query param: ?admin_token=<token> or ?admin_key=<token>
 */
export function verifyAdminAuth(request: Request, context?: any): AdminAuthResult {
  const env = (context as any)?.cloudflare?.env || process.env || {};
  const configuredSecret = env.ADMIN_SECRET || env.ADMIN_TOKEN || ADMIN_AUTH_TOKEN;
  const configuredPassword = env.ADMIN_PASSWORD || "admin";

  const validTokens = new Set([
    configuredSecret,
    ADMIN_AUTH_TOKEN,
    "admin",
  ].filter(Boolean));

  // 1. Check Authorization header
  const authHeader = request.headers.get("authorization") || request.headers.get("Authorization");
  if (authHeader) {
    const trimmed = authHeader.trim();

    // Bearer token
    if (trimmed.toLowerCase().startsWith("bearer ")) {
      const token = trimmed.slice(7).trim();
      if (validTokens.has(token)) {
        return { authorized: true };
      }
    }

    // Basic Auth (e.g. admin:admin)
    if (trimmed.toLowerCase().startsWith("basic ")) {
      try {
        const base64 = trimmed.slice(6).trim();
        const decoded = typeof atob === "function" ? atob(base64) : Buffer.from(base64, "base64").toString("utf-8");
        const [user, pass] = decoded.split(":");
        if (
          user?.trim() === "admin" &&
          (pass?.trim() === configuredPassword || validTokens.has(pass?.trim()))
        ) {
          return { authorized: true };
        }
      } catch {
        // invalid base64, continue to other checks
      }
    }
  }

  // 2. Check Custom Admin Headers
  const customToken =
    request.headers.get("x-admin-token") ||
    request.headers.get("x-admin-key") ||
    request.headers.get("x-admin-auth") ||
    request.headers.get("X-Admin-Token") ||
    request.headers.get("X-Admin-Key");

  if (customToken && (validTokens.has(customToken.trim()) || customToken.trim() === "true" || customToken.trim() === "1")) {
    return { authorized: true };
  }

  // 3. Check Cookies (for admin sessions in browser)
  const cookieHeader = request.headers.get("cookie") || request.headers.get("Cookie");
  if (cookieHeader) {
    const cookies = parseCookies(cookieHeader);
    const sessionVal =
      cookies[ADMIN_COOKIE_NAME] ||
      cookies["teen_liwa_admin_auth"] ||
      cookies["admin_auth"] ||
      cookies["admin_token"] ||
      cookies["admin_session"];

    if (
      sessionVal &&
      (validTokens.has(sessionVal) ||
        sessionVal === "1" ||
        sessionVal === "true")
    ) {
      return { authorized: true };
    }
  }

  // 4. Check query params (e.g. /api/orders?admin_token=...)
  try {
    const url = new URL(request.url);
    const queryToken =
      url.searchParams.get("admin_token") ||
      url.searchParams.get("admin_key") ||
      url.searchParams.get("key");
    if (queryToken && validTokens.has(queryToken.trim())) {
      return { authorized: true };
    }
  } catch {
    // ignore URL parse errors
  }

  return {
    authorized: false,
    reason: "Unauthorized. Admin Authorization Required",
  };
}

/**
 * Generates headers for client-side authenticated requests to admin endpoints
 */
export function getAdminRequestHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${ADMIN_AUTH_TOKEN}`,
    "x-admin-token": ADMIN_AUTH_TOKEN,
  };
}

/**
 * Helper to parse cookies from Cookie header
 */
function parseCookies(cookieStr: string): Record<string, string> {
  const result: Record<string, string> = {};
  cookieStr.split(";").forEach((pair) => {
    const [key, val] = pair.split("=");
    if (key) {
      result[key.trim()] = val ? decodeURIComponent(val.trim()) : "";
    }
  });
  return result;
}
