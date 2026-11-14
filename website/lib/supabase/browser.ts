import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabaseEnv } from "@/lib/supabase/env";

let client: SupabaseClient | undefined;

/** The browser client, shared across the page. It keeps the session in the auth cookies. */
export function createBrowserSupabase(): SupabaseClient {
  if (!client) {
    const { url, publishableKey } = supabaseEnv();
    client = createBrowserClient(url, publishableKey);
  }
  return client;
}
