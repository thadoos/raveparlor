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
  if (rpcError || isAdmin !== true) {
    await supabase.auth.signOut();
    return { error: "This account doesn't have admin access." };
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
  if (error) return { error: `Couldn't change the password: ${error.message}` };
  return { ok: true };
}
