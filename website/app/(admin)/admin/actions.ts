"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { ADMIN_PATH, LOGIN_PATH, getAdmin, requireAdmin } from "@/lib/admin/auth";
import { runDraftAction } from "@/lib/admin/draft-action";
import type { ActionResult } from "@/lib/admin/draft-action";
import { findOrphans } from "@/lib/admin/orphans";
import type { StorageObject } from "@/lib/admin/orphans";
import { CONTENT_TAG } from "@/lib/content/published";
import { parseSiteContent } from "@/lib/content/schema";
import type { SiteContent } from "@/lib/content/schema";
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
  if (next === current)
    return { error: "The new password must be different from the current one." };
  if (next !== confirm) return { error: "The new passwords don't match." };

  const supabase = await createServerSupabase();
  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email,
    password: current,
  });
  if (verifyError) return { error: "The current password is wrong." };

  const { error } = await supabase.auth.updateUser({ password: next });
  if (error) return { error: UPDATE_ERRORS[error.code ?? ""] ?? SOMETHING_WRONG };

  // Anyone signed in elsewhere with the old password loses access.
  await supabase.auth.signOut({ scope: "others" });
  return { ok: true };
}

// Draft content ------------------------------------------------------------------------------
// The editor's actions never redirect: a redirect would unmount the editor and lose unsaved
// edits. They answer with an ActionResult instead (see runDraftAction). loadDraft only runs in the
// page loader, so it keeps the redirecting check.

export type { ActionResult };

async function readContent(
  supabase: SupabaseClient,
  id: "draft" | "published",
): Promise<SiteContent> {
  const { data, error } = await supabase
    .from("site_content")
    .select("content")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`Failed to load ${id} content: ${error.message}`);
  if (!data) throw new Error(`No ${id} content`);
  const result = parseSiteContent(data.content);
  if (!result.ok) throw new Error(`Invalid ${id} content:\n${result.issues.join("\n")}`);
  return result.content;
}

/** Validates, then writes the draft row. Invalid content never reaches the database. */
async function writeDraft(supabase: SupabaseClient, content: unknown): Promise<ActionResult> {
  const result = parseSiteContent(content);
  if (!result.ok) return { ok: false, error: result.issues.join("; ") };

  const { data, error } = await supabase
    .from("site_content")
    .update({ content: result.content, updated_at: new Date().toISOString() })
    .eq("id", "draft")
    .select("id");
  if (error) {
    console.error("saveDraft failed:", error.message);
    return { ok: false, error: "Couldn't save the draft. Try again." };
  }
  // RLS filters silently: no row back means nothing was written.
  if (!data || data.length === 0)
    return { ok: false, error: "Couldn't save the draft. Try again." };
  return { ok: true };
}

// Image cleanup ------------------------------------------------------------------------------
// Uploads land in storage before they are saved anywhere, so replaced or abandoned photos pile up.
// After a publish or discard, anything not used by the draft, the live site or the last few
// versions (kept so a rollback still has its photos) is removed. Objects under an hour old are
// skipped, so a photo uploaded but not yet saved to the draft survives (see findOrphans).

const IMAGE_BUCKET = "site-images";
const KEPT_VERSIONS = 10;
const LIST_PAGE = 1000;

/** Every object in the bucket, with its creation time. Folders (entries without an id) are listed
 *  recursively. */
async function listImages(supabase: SupabaseClient, prefix = ""): Promise<StorageObject[]> {
  const objects: StorageObject[] = [];
  for (let offset = 0; ; offset += LIST_PAGE) {
    const { data, error } = await supabase.storage
      .from(IMAGE_BUCKET)
      .list(prefix, { limit: LIST_PAGE, offset });
    if (error) throw new Error(`Listing "${prefix}" failed: ${error.message}`);
    for (const entry of data) {
      const path = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.id === null) objects.push(...(await listImages(supabase, path)));
      // A missing timestamp reads as unknown age, which findOrphans keeps.
      else objects.push({ path, createdAt: entry.created_at ?? "" });
    }
    if (data.length < LIST_PAGE) return objects;
  }
}

async function readRecentVersions(supabase: SupabaseClient): Promise<SiteContent[]> {
  const { data, error } = await supabase
    .from("content_versions")
    .select("content")
    .order("published_at", { ascending: false })
    .limit(KEPT_VERSIONS);
  if (error) throw new Error(`Failed to load content versions: ${error.message}`);
  return data.map((row, index) => {
    const result = parseSiteContent(row.content);
    // Unknown references would make every photo look unused: stop rather than guess.
    if (!result.ok) throw new Error(`Version ${index} is invalid:\n${result.issues.join("\n")}`);
    return result.content;
  });
}

/** Removes unreferenced images. Never throws: a failed cleanup only leaves files behind. */
async function cleanupOrphans(supabase: SupabaseClient): Promise<void> {
  try {
    const [objects, draft, published, versions] = await Promise.all([
      listImages(supabase),
      readContent(supabase, "draft"),
      readContent(supabase, "published"),
      readRecentVersions(supabase),
    ]);
    const orphans = findOrphans(objects, [draft, published, ...versions], {
      now: new Date(),
    });
    if (orphans.length === 0) return;
    const { error } = await supabase.storage.from(IMAGE_BUCKET).remove(orphans);
    if (error) throw new Error(`Removing ${orphans.length} images failed: ${error.message}`);
  } catch (error) {
    console.error("cleanupOrphans failed:", error);
  }
}

export async function loadDraft(): Promise<{ draft: SiteContent; published: SiteContent }> {
  await requireAdmin();
  const supabase = await createServerSupabase();
  const [draft, published] = await Promise.all([
    readContent(supabase, "draft"),
    readContent(supabase, "published"),
  ]);
  return { draft, published };
}

export async function saveDraft(content: SiteContent): Promise<ActionResult> {
  return runDraftAction("saveDraft", getAdmin, async () =>
    writeDraft(await createServerSupabase(), content),
  );
}

/** Saves the given content as the draft, publishes it atomically, then expires the site's cache. */
export async function publishDraft(
  content: SiteContent,
): Promise<ActionResult & { publishedAt?: string }> {
  return runDraftAction("publishDraft", getAdmin, async () => {
    const supabase = await createServerSupabase();
    const saved = await writeDraft(supabase, content);
    if (!saved.ok) return saved;

    const { data, error } = await supabase.rpc("publish_draft");
    if (error) {
      console.error("publishDraft failed:", error.message);
      return { ok: false, error: "The draft was saved, but publishing failed. Try again." };
    }
    updateTag(CONTENT_TAG);
    after(() => cleanupOrphans(supabase));
    return { ok: true, publishedAt: typeof data === "string" ? data : undefined };
  });
}

/** Resets the draft to what's live and returns it. */
export async function discardDraft(): Promise<ActionResult & { content?: SiteContent }> {
  return runDraftAction("discardDraft", getAdmin, async () => {
    const supabase = await createServerSupabase();
    const { error } = await supabase.rpc("discard_draft");
    if (error) {
      console.error("discardDraft failed:", error.message);
      return { ok: false, error: "Couldn't discard the draft. Try again." };
    }
    after(() => cleanupOrphans(supabase));
    try {
      return { ok: true, content: await readContent(supabase, "draft") };
    } catch (e) {
      console.error("discardDraft reload failed:", e);
      return {
        ok: false,
        error: "The draft was discarded, but reloading it failed. Refresh the page.",
      };
    }
  });
}
