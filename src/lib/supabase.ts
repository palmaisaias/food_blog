import "server-only";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { supabaseKey, supabaseUrl } from "./config";

export function publicClient() {
  if (!supabaseUrl || !supabaseKey) return null;
  return createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: (url, options) => fetch(url, { ...options, cache: "no-store" }) },
  });
}

export async function sessionClient() {
  if (!supabaseUrl || !supabaseKey) return null;
  const jar = await cookies();
  return createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll: () => jar.getAll(),
      setAll(cookies) {
        try {
          for (const { name, value, options } of cookies) jar.set(name, value, options);
        } catch {
          // The request proxy handles refreshes during Server Component rendering.
        }
      },
    },
  });
}

export async function adminSession() {
  const client = await sessionClient();
  if (!client) return null;
  const { data } = await client.auth.getClaims();
  if (!data?.claims.sub) return null;
  const { data: authorized } = await client.rpc("is_table_admin");
  return authorized === true ? client : null;
}
