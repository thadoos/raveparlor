"use server";

import { redirect } from "next/navigation";
import { ADMIN_PATH, LOGIN_PATH, requireAdmin } from "@/lib/admin/auth";
import { createServerSupabase } from "@/lib/supabase/server";

/** Every action re-checks auth itself: server actions are public endpoints. */

export interface AuthState {
  error?: string;
  ok?: boolean;
}

const MIN_PASSWORD_LENGTH = 10;
const SOMETHING_WRONG = "Something went wrong, try again.";

/** Fixed messages for the auth errors a password change can hit; raw Supabase text never reaches the page. */
const UPDATE_ERRORS: Record<string, string> = {
  weak_password: "That password is too weak. Try a longer one.",
  same_password: "The new password must be different from the current one.",
};

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

export async function signIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = field(formData, "email").trim();
  const password = field(formData, "password");
  const wrong = { error: "Wrong email or password." };
  if (!email || !password) return wrong;

  const supabase = await createServerSupabase();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return wrong;

  const { data: isAdmin, error: rpcError } = await supabase.rpc("is_admin");
  if (rpcError) {
    // Unverified: don't leave a session behind.
    await supabase.auth.signOut();
    return { error: SOMETHING_WRONG };
  }
  if (isAdmin !== true) {
    // Same message as bad credentials, so the form doesn't reveal which accounts exist.
    await supabase.auth.signOut();
    return wrong;
  }
  redirect(ADMIN_PATH);
}

export async function signOut(): Promise<void> {
  const supabase = await createServerSupabase();
  await supabase.auth.signOut();
  redirect(LOGIN_PATH);
}

export async function changePassword(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const { email } = await requireAdmin();
  const current = field(formData, "current");
  const next = field(formData, "new");
  const confirm = field(formData, "confirm");

  if (!current) return { error: "Enter your current password." };
  if (next.length < MIN_PASSWORD_LENGTH) {
    return { error: `The new password needs at least ${MIN_PASSWORD_LENGTH} characters.` };
  }
  if (next === current) return { error: "The new password must be different from the current one." };
  if (next !== confirm) return { error: "The new passwords don't match." };

  const supabase = await createServerSupabase();
  const { error: verifyError } = await supabase.auth.signInWithPassword({ email, password: current });
  if (verifyError) return { error: "The current password is wrong." };

  const { error } = await supabase.auth.updateUser({ password: next });
  if (error) return { error: UPDATE_ERRORS[error.code ?? ""] ?? SOMETHING_WRONG };

  // Anyone signed in elsewhere with the old password loses access.
  await supabase.auth.signOut({ scope: "others" });
  return { ok: true };
}
