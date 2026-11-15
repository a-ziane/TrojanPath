import { createClient } from "@supabase/supabase-js";
import { authenticated, headers, json, limitedBody } from "../_shared/http.ts";
import { fetchCampusEvents } from "../../../shared/campus-events.ts";
import { fallbackEvents } from "../../../shared/campus-event-snapshot.ts";
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS")
    return new Response("ok", { headers: headers(req) });
  if (req.method !== "POST") return json(req, { error: "POST required" }, 405);
  try {
    const { client } = await authenticated(req);
    const body = JSON.parse(
      new TextDecoder().decode(await limitedBody(req, 4096)),
    );
    if (
      typeof body.eventId !== "string" ||
      body.eventId.length > 100 ||
      typeof body.going !== "boolean"
    )
      return json(
        req,
        { error: "Choose an event and attendance intention" },
        400,
      );
    let events = fallbackEvents;
    try {
      events = await fetchCampusEvents();
    } catch {
      /* Use only the trusted saved calendar snapshot. */
    }
    const event =
      events.find((e) => e.id === body.eventId) ||
      fallbackEvents.find((e) => e.id === body.eventId);
    if (!event)
      return json(
        req,
        { error: "This event is not available in the verified calendar feed" },
        404,
      );
    const service = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );
    const { error: catalogError } = await service
      .from("campus_event_catalog")
      .upsert({
        id: event.id,
        title: event.title,
        url: event.url,
        starts_at: event.startsOn,
        ends_at: event.endsOn,
        updated_at: new Date().toISOString(),
      });
    if (catalogError) throw new Error("Could not verify the event schedule");
    const { data, error } = await client.rpc("plan_campus_event", {
      event_id: event.id,
      going: body.going,
    });
    if (error) throw new Error(error.message);
    return json(req, { taskId: data });
  } catch (e) {
    return json(
      req,
      { error: e instanceof Error ? e.message : "Could not save event task" },
      e instanceof Error && e.message === "Authentication required" ? 401 : 400,
    );
  }
});
