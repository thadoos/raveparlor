import { createClient } from "@supabase/supabase-js";

/** Anonymous client with the publishable key, for reading public data (no session, no cookies). */
export function createPublicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !publishableKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY must be set",
    );
  }
  return createClient(url, publishableKey, { auth: { persistSession: false } });
}
