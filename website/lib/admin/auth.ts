import "server-only";
import { redirect } from "next/navigation";
import { LOGIN_PATH } from "@/lib/admin/routes";
import type { Admin } from "@/lib/admin/draft-action";
import { createServerSupabase } from "@/lib/supabase/server";

export { ADMIN_PATH, LOGIN_PATH, proxyDecision } from "@/lib/admin/routes";

/**
 * The signed-in admin, or a redirect to the login page. Reads cookies, so call it inside <Suspense>
 * or a server action. A signed-in user who isn't in public.admins is signed out.
 */
export async function requireAdmin(): Promise<{ userId: string; email: string }> {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(LOGIN_PATH);

  const { data: isAdmin, error } = await supabase.rpc("is_admin");
  // A failed check is an outage, not a verdict: let the error boundary show it.
  if (error) throw new Error(`Admin check failed: ${error.message}`);
  if (isAdmin !== true) {
    await supabase.auth.signOut();
    redirect(`${LOGIN_PATH}?error=not-admin`);
  }
  return { userId: user.id, email: user.email ?? "" };
}

/**
 * The signed-in admin, or null when signed out or not an admin. Never redirects, so Server Actions
 * can answer with an error instead of navigating away. Throws when the admin check itself fails.
 */
export async function getAdmin(): Promise<Admin | null> {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: isAdmin, error } = await supabase.rpc("is_admin");
  if (error) throw new Error(`Admin check failed: ${error.message}`);
  return isAdmin === true ? { userId: user.id, email: user.email ?? "" } : null;
}
