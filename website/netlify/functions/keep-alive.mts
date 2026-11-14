import type { Config } from "@netlify/functions";

// Pings Supabase once a day so the free-tier project is not paused for inactivity.
export const config: Config = { schedule: "@daily" };

export default async function keepAlive(): Promise<Response> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase environment variables");

  const response = await fetch(`${url}/rest/v1/site_content?select=id&id=eq.published`, {
    headers: { apikey: key },
  });
  console.log(`Supabase keep-alive: ${response.status}`);
  if (!response.ok) throw new Error(`Supabase keep-alive failed with status ${response.status}`);
  return new Response(null, { status: 204 });
}
