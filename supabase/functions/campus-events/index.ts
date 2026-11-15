import { headers } from "../_shared/http.ts";
import {
  fetchCampusEvents,
  type CampusEvent,
} from "../../../shared/campus-events.ts";
import { fallbackEvents } from "../../../shared/campus-event-snapshot.ts";
let cached: {
  events: CampusEvent[];
  fetchedAt: string;
  source: "live" | "fallback";
} | null = null;
let expires = 0;
Deno.serve(async (req: Request) => {
  const cors = {
    ...headers(req),
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Cache-Control": "public, max-age=300",
  };
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "GET")
    return Response.json(
      { error: "GET required" },
      { status: 405, headers: cors },
    );
  if (!cached || Date.now() > expires) {
    try {
      const events = await fetchCampusEvents();
      if (!events.length) throw Error("Empty calendar");
      cached = { events, source: "live", fetchedAt: new Date().toISOString() };
      expires = Date.now() + 3600000;
    } catch {
      cached = {
        events: fallbackEvents.filter(
          (e) => e.startsOn && Date.parse(e.endsOn ?? e.startsOn) >= Date.now(),
        ),
        source: "fallback",
        fetchedAt: "2026-11-15T00:00:00-08:00",
      };
      expires = Date.now() + 300000;
    }
  }
  return Response.json(cached, { headers: cors });
});
