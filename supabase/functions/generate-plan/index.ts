import { authenticated, json, headers, limitedBody } from "../_shared/http.ts";
import { GeminiProvider } from "../_shared/provider.ts";
import {
  emptyState,
  nextWeek,
  profileSchema,
  weekKey,
  type AppState,
  type Checkin,
  type Plan,
} from "../../../shared/domain.ts";
import { makePlan, replaceTask } from "../../../shared/planner.ts";
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS")
    return new Response("ok", { headers: headers(req) });
  if (req.method !== "POST") return json(req, { error: "POST required" }, 405);
  try {
    const { client: c, user } = await authenticated(req);
    const request = JSON.parse(
      new TextDecoder().decode(await limitedBody(req, 4096)),
    );
    const week = request.week;
    if (typeof week !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(week))
      return json(req, { error: "Invalid week" }, 400);
    const { data: profileRow, error: pe } = await c
      .from("profiles")
      .select("data")
      .eq("user_id", user.id)
      .single();
    if (pe) throw new Error("Save your profile first");
    const profile = profileSchema.parse(profileRow.data);
    const current = weekKey(new Date(), profile.timezone);
    if (week !== current && week !== nextWeek(current))
      return json(req, { error: "Choose this week or next week" }, 400);
    const results = await Promise.all([
      c.from("weekly_plans").select("*").order("week", { ascending: false }),
      c.from("tasks").select("*"),
      c.from("projects").select("*").limit(30),
      c
        .from("check_ins")
        .select("*")
        .order("week", { ascending: false })
        .limit(12),
    ]);
    for (const r of results)
      if (r.error) throw new Error("Could not load planning context");
    const [plans, tasks, projects, checkins] = results.map((r) => r.data || []);
    const state: AppState = {
      ...emptyState(),
      profile,
      plans: plans.map((p) => ({
        ...p.data,
        id: p.id,
        week: p.week,
        createdAt: p.created_at,
        source: p.source,
        tasks: tasks
          .filter((t) => t.plan_id === p.id)
          .map((t) => ({
            ...t.data,
            id: t.id,
            status: t.status,
            xp: t.xp,
            reflection: t.reflection,
          })),
      })) as Plan[],
      projects: projects.map((p) => ({ ...p.data, id: p.id })),
      checkins: checkins.map((c) => ({
        ...c.data,
        id: c.id,
        week: c.week,
      })) as Checkin[],
    };
    const existing = state.plans.find((p) => p.week === week);
    if (existing && !request.replaceId)
      return json(req, {
        planId: existing.id,
        source: existing.source,
        preserved: true,
      });
    const { data: allowed, error: rateError } = await c.rpc(
      "reserve_planning_request",
    );
    if (rateError || !allowed)
      return json(
        req,
        {
          error:
            "Planning limit reached. Try again in an hour; your saved plan is safe.",
        },
        429,
      );
    if (request.replaceId) {
      const old = state.plans
        .flatMap((p) => p.tasks)
        .find((t) => t.id === request.replaceId);
      if (!old) return json(req, { error: "Quest not found" }, 404);
      const replaced = replaceTask(state, old.id);
      const spec = replaced.plans
        .flatMap((p) => p.tasks)
        .find(
          (t) =>
            !state.plans.flatMap((p) => p.tasks).some((x) => x.id === t.id),
        );
      if (!spec)
        return json(req, { error: "This quest cannot be replaced" }, 400);
      const { error } = await c.rpc("replace_quest", { task_id: old.id, spec });
      if (error) throw new Error(error.message);
      return json(req, { replaced: true });
    }
    const feedback = state.checkins.find((c) => nextWeek(c.week) === week);
    let plan: Plan;
    try {
      const spec = await new GeminiProvider().generate(
        profile,
        state,
        feedback,
      );
      plan = makePlan(profile, state, week, "gemini", feedback, spec);
    } catch (error) {
      console.warn(
        "AI fallback:",
        error instanceof Error ? error.message : "Invalid provider output",
      );
      plan = makePlan(profile, state, week, "fallback", feedback);
    }
    const { error } = await c.rpc("save_plan", { payload: plan });
    if (error) throw new Error(error.message);
    return json(req, { planId: plan.id, source: plan.source });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Planning failed";
    return json(
      req,
      { error: message },
      message === "Authentication required" ? 401 : 400,
    );
  }
});
