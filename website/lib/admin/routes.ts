/** Admin route rules. Pure and dependency-free so proxy.ts can import them without server-only code. */

export const LOGIN_PATH = "/admin/login";
export const ADMIN_PATH = "/admin";

function isUnder(pathname: string, base: string): boolean {
  return pathname === base || pathname.startsWith(`${base}/`);
}

/**
 * What the proxy does with a request. "login": send to the login page; "admin": a signed-in user
 * on the login page goes to the dashboard; "next": carry on.
 */
export function proxyDecision(pathname: string, hasUser: boolean): "next" | "login" | "admin" {
  if (pathname === LOGIN_PATH) return hasUser ? "admin" : "next";
  if (isUnder(pathname, ADMIN_PATH) || isUnder(pathname, "/preview")) {
    return hasUser ? "next" : "login";
  }
  return "next";
}
