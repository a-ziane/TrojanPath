import { createClient } from "@supabase/supabase-js";
export function headers(req: Request) {
  const origin = req.headers.get("Origin") || "";
  const allowed = (
    Deno.env.get("ALLOWED_ORIGINS") ||
    "http://localhost:5173,http://127.0.0.1:5173,https://a-ziane.github.io"
  )
    .split(",")
    .map((s) => s.trim());
  return {
    "Access-Control-Allow-Origin": allowed.includes(origin) ? origin : "null",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
    "Content-Type": "application/json",
  };
}
export const json = (req: Request, data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: headers(req) });
export async function authenticated(req: Request) {
  const token = req.headers.get("Authorization");
  if (!token?.startsWith("Bearer ")) throw new Error("Authentication required");
  const c = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    {
      global: { headers: { Authorization: token } },
      auth: { persistSession: false },
    },
  );
  const { data, error } = await c.auth.getUser(token.slice(7));
  if (error || !data.user) throw new Error("Authentication required");
  return { client: c, user: data.user };
}
export async function limitedBody(req: Request, limit: number) {
  const reader = req.body?.getReader();
  if (!reader) throw new Error("Missing request body");
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > limit) {
      await reader.cancel();
      throw new Error("Request too large");
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  return bytes;
}
