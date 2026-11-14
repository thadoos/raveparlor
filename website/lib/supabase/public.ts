import { createClient } from "@supabase/supabase-js";
import { supabaseEnv } from "@/lib/supabase/env";

/** Anonymous client with the publishable key, for reading public data (no session, no cookies). */
export function createPublicClient() {
  const { url, publishableKey } = supabaseEnv();
  return createClient(url, publishableKey, { auth: { persistSession: false } });
}
