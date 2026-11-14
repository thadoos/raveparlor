/**
 * Idempotent migration: rewrites any draft/published `site_content` row stored at `version: 1`
 * through `parseSiteContent` (which migrates it to the current version). Rows already migrated
 * are left alone, as are `content_versions` (read through the migration). Run with
 * `npm run migrate:content`.
 */
import { createClient } from "@supabase/supabase-js";
import { parseSiteContent } from "@/lib/content/schema";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} must be set (see .env.example)`);
  return value;
}

function storedVersion(content: unknown): unknown {
  return typeof content === "object" && content !== null && "version" in content
    ? content.version
    : undefined;
}

async function main(): Promise<void> {
  const supabase = createClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("SUPABASE_SECRET_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  const { data, error } = await supabase
    .from("site_content")
    .select("id, content")
    .in("id", ["draft", "published"]);
  if (error) throw new Error(`Failed to read site_content: ${error.message}`);

  const stale = data.filter((row: { content: unknown }) => storedVersion(row.content) === 1);
  if (stale.length === 0) {
    console.log("Nothing to migrate");
    return;
  }

  const updates: { id: string; content: unknown }[] = [];
  for (const row of stale as { id: string; content: unknown }[]) {
    const result = parseSiteContent(row.content);
    if (!result.ok) {
      console.error(`Cannot migrate ${row.id} content, nothing written:`);
      console.error(result.issues.join("\n"));
      process.exit(1);
    }
    updates.push({ id: row.id, content: result.content });
  }

  for (const { id, content } of updates) {
    const { error: updateError } = await supabase
      .from("site_content")
      .update({ content, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("content->>version", "1");
    if (updateError) throw new Error(`Failed to update ${id}: ${updateError.message}`);
    console.log(`Migrated ${id} content from version 1`);
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
