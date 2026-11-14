import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ADMIN_PATH, LOGIN_PATH, proxyDecision } from "@/lib/admin/routes";
import { supabaseEnv } from "@/lib/supabase/env";

/** Refreshes the Supabase session cookies, then keeps signed-out visitors out of /admin and /preview. */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const cacheHeaders: Record<string, string> = {};
  const { url, publishableKey } = supabaseEnv();

  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
        Object.assign(cacheHeaders, headers);
      },
    },
  });

  // getUser() verifies the token with the auth server and refreshes it when expired.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const decision = proxyDecision(request.nextUrl.pathname, user !== null);
  if (decision !== "next") {
    const target = request.nextUrl.clone();
    target.pathname = decision === "login" ? LOGIN_PATH : ADMIN_PATH;
    target.search = "";
    const redirect = NextResponse.redirect(target);
    // Carry any refreshed or cleared session cookies over to the redirect.
    for (const cookie of response.cookies.getAll()) redirect.cookies.set(cookie);
    response = redirect;
  }

  for (const [key, value] of Object.entries(cacheHeaders)) response.headers.set(key, value);
  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/preview"],
};
