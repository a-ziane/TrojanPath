import { createClient } from "@supabase/supabase-js";
import { authenticated, json, headers, limitedBody } from "../_shared/http.ts";
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS")
    return new Response("ok", { headers: headers(req) });
  if (req.method !== "POST") return json(req, { error: "POST required" }, 405);
  try {
    const { client, user } = await authenticated(req);
    if (Number(req.headers.get("Content-Length") || 0) > 2200000)
      return json(req, { error: "File too large" }, 413);
    const bounded = new Request(req.url, {
      method: "POST",
      headers: req.headers,
      body: await limitedBody(req, 2200000),
    });
    const form = await bounded.formData(),
      file = form.get("file");
    if (!(file instanceof File) || file.size > 2097152 || !file.size)
      return json(req, { error: "Choose a non-empty file under 2 MB" }, 400);
    const bytes = new Uint8Array(await file.arrayBuffer());
    const mime = file.type;
    const valid =
      mime === "application/pdf"
        ? new TextDecoder().decode(bytes.slice(0, 5)) === "%PDF-"
        : mime === "image/png"
          ? bytes.slice(0, 8).join(",") === "137,80,78,71,13,10,26,10"
          : mime === "image/jpeg"
            ? bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
            : mime === "text/plain"
              ? !bytes.includes(0)
              : false;
    if (!valid)
      return json(
        req,
        { error: "Invalid file signature. Use PDF, PNG, JPG, or plain text." },
        400,
      );
    const { data: quota, error: qe } = await client.rpc(
      "reserve_planning_request",
    );
    if (qe || !quota)
      return json(
        req,
        { error: "Upload limit reached; try again in an hour." },
        429,
      );
    const ext = (
      {
        "application/pdf": "pdf",
        "image/png": "png",
        "image/jpeg": "jpg",
        "text/plain": "txt",
      } as Record<string, string>
    )[mime];
    const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );
    const { error } = await admin.storage
      .from("student-files")
      .upload(path, bytes, { contentType: mime, upsert: false });
    if (error) throw new Error("Private upload failed");
    return json(req, { path });
  } catch (e) {
    return json(
      req,
      { error: e instanceof Error ? e.message : "Upload failed" },
      401,
    );
  }
});
