import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { proxyDecision } = await import("@/lib/admin/auth");

describe("proxyDecision", () => {
  it.each([
    ["/admin", false, "login"],
    ["/admin/login", false, "next"],
    ["/admin/login", true, "admin"],
    ["/admin/password", false, "login"],
    ["/preview", false, "login"],
    ["/preview", true, "next"],
    ["/", false, "next"],
  ] as const)("%s with user=%s gives %s", (pathname, hasUser, expected) => {
    expect(proxyDecision(pathname, hasUser, false)).toBe(expected);
  });

  it.each(["/admin", "/admin/login", "/admin/password", "/preview"])(
    "lets Server Actions on %s through whatever the session",
    (pathname) => {
      expect(proxyDecision(pathname, false, true)).toBe("next");
      expect(proxyDecision(pathname, true, true)).toBe("next");
    },
  );
});
