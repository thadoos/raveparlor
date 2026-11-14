/**
 * Idempotent seed: the admin user, its `admins` row, and the draft and published content rows
 * (from DEFAULT_CONTENT, only when missing). Run with `npm run seed:content`.
 */
import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import { DEFAULT_CONTENT } from "@/lib/content/defaults";
import { parseSiteContent } from "@/lib/content/schema";
import type { SiteContent } from "@/lib/content/schema";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} must be set (see .env.example)`);
  return value;
}

async function findUserIdByEmail(
  supabase: SupabaseClient,
  email: string,
): Promise<string | undefined> {
  const perPage = 1000;
  for (let page = 1; ; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw new Error(`Failed to list users: ${error.message}`);
    const user = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (user) return user.id;
    if (data.users.length < perPage) return undefined;
  }
}

async function ensureAdminUser(
  supabase: SupabaseClient,
  email: string,
  password: string,
): Promise<string> {
  const existing = await findUserIdByEmail(supabase, email);
  if (existing) {
    console.log(`Admin user ${email} already exists`);
    return existing;
  }
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) throw new Error(`Failed to create admin user: ${error.message}`);
  console.log(`Created admin user ${email}`);
  return data.user.id;
}

async function ensureAdminRow(supabase: SupabaseClient, userId: string): Promise<void> {
  const { data, error } = await supabase
    .from("admins")
    .upsert({ user_id: userId }, { onConflict: "user_id", ignoreDuplicates: true })
    .select("user_id");
  if (error) throw new Error(`Failed to upsert admins: ${error.message}`);
  console.log(data.length > 0 ? "Added user to admins" : "User is already an admin");
}

/** DEFAULT_CONTENT, validated: invalid content is never seeded. */
function validDefaultContent(): SiteContent {
  const result = parseSiteContent(DEFAULT_CONTENT);
  if (!result.ok) throw new Error(`DEFAULT_CONTENT is invalid:\n${result.issues.join("\n")}`);
  return result.content;
}

async function ensureContentRows(supabase: SupabaseClient, content: SiteContent): Promise<void> {
  const rows = (["draft", "published"] as const).map((id) => ({ id, content }));
  const { data, error } = await supabase
    .from("site_content")
    .upsert(rows, { onConflict: "id", ignoreDuplicates: true })
    .select("id");
  if (error) throw new Error(`Failed to seed site_content: ${error.message}`);
  const inserted = new Set(data.map((row: { id: string }) => row.id));
  for (const { id } of rows) {
    console.log(
      inserted.has(id) ? `Seeded ${id} content` : `${id} content already exists, left unchanged`,
    );
  }
}

async function main(): Promise<void> {
  const content = validDefaultContent();
  const supabase = createClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("SUPABASE_SECRET_KEY"),
    {
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );
  const userId = await ensureAdminUser(
    supabase,
    requireEnv("ADMIN_EMAIL"),
    requireEnv("ADMIN_PASSWORD"),
  );
  await ensureAdminRow(supabase, userId);
  await ensureContentRows(supabase, content);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
