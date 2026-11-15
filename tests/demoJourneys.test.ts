import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { appStateSchema, streak, totalXP, weekKey } from "../shared/domain";
import { resources } from "../shared/resources";
import { completedActivities, resumeSuggestion } from "../src/portfolio";
import {
  demoStorageKey,
  firstDemoPlan,
  loadJourney,
  persistJourney,
  seedDemo,
  selectJourney,
  selectedDemo,
  saveDemoDraft,
  zahiExample,
} from "../src/demoJourneys";
const now = new Date("2026-11-15T18:00:00Z");
let saved: Map<string, string>;
beforeEach(() => {
  saved = new Map();
  vi.stubGlobal("localStorage", {
    getItem: (k: string) => saved.get(k) ?? null,
    setItem: (k: string, v: string) => saved.set(k, v),
    removeItem: (k: string) => saved.delete(k),
  });
});
afterEach(() => vi.unstubAllGlobals());
it("starts new students without history and provides a bounded deterministic first plan", () => {
  const fresh = seedDemo("new", now);
  expect(fresh.state.profile).toBeNull();
  expect(fresh.state.plans).toHaveLength(0);
  const plan = firstDemoPlan(zahiExample, weekKey(now, zahiExample.timezone));
  expect(plan.source).toBe("demo");
  expect(plan.tasks.reduce((n, t) => n + t.minutes, 0)).toBeLessThanOrEqual(
    240,
  );
  expect(plan.tasks.some((t) => t.title.includes("economics"))).toBe(true);
  expect(plan.tasks.some((t) => t.title.includes("ML"))).toBe(true);
  expect(plan.tasks.some((t) => t.resourceIds.includes("career"))).toBe(true);
});
it("seeds coherent past evidence, budgets, calculated rewards, and a project-derived résumé suggestion", () => {
  const { state, adaptations } = seedDemo("four-weeks", now);
  expect(appStateSchema.safeParse(state).success).toBe(true);
  expect(state.plans).toHaveLength(4);
  expect(state.checkins).toHaveLength(3);
  expect(state.profile?.hours).toBe(2);
  const current = weekKey(now, zahiExample.timezone);
  state.plans.forEach((p, i) => {
    expect(p.source).toBe("demo");
    expect(p.tasks.reduce((n, t) => n + t.minutes, 0)).toBeLessThanOrEqual(
      i < 2 ? 240 : 120,
    );
    p.tasks.forEach((t) =>
      t.resourceIds.forEach((id) =>
        expect(resources.some((r) => r.id === id && r.verified)).toBe(true),
      ),
    );
  });
  expect(state.checkins.every((c) => c.week < current)).toBe(true);
  expect(state.xp.every((e) => new Date(e.createdAt) <= now)).toBe(true);
  expect(streak(state.checkins, now, zahiExample.timezone)).toBe(3);
  const taskXP = state.plans
    .flatMap((p) => p.tasks)
    .filter((t) => t.status === "completed")
    .reduce((n, t) => n + t.xp, 0);
  expect(totalXP(state)).toBe(taskXP + 100);
  expect(state.plans[3].tasks.every((t) => t.status === "suggested")).toBe(
    true,
  );
  const project = completedActivities(state).find((a) => a.kind === "project")!;
  expect(resumeSuggestion(project)).toContain("Illustrative sample project");
  expect(
    adaptations.every((a) => state.checkins.some((c) => c.week === a.week)),
  ).toBe(true);
  expect(adaptations[1].why).toBe(state.checkins[1].disliked);
});
it("persists, switches, and resets isolated journeys without touching live or legacy data", () => {
  saved.set("supabase-auth", "live-session");
  saved.set("trojanpath:demo:v1", "legacy-save");
  const four = selectJourney("four-weeks");
  four.state.profile!.goal = "Changed only this journey";
  persistJourney(four.state);
  selectJourney("new");
  expect(selectedDemo()).toBe("new");
  expect(loadJourney().state.profile).toBeNull();
  selectJourney("four-weeks");
  expect(loadJourney().state.profile!.goal).toBe("Changed only this journey");
  selectJourney("new", true);
  expect(saved.has(demoStorageKey("four-weeks"))).toBe(true);
  expect(saved.get("supabase-auth")).toBe("live-session");
  expect(saved.get("trojanpath:demo:v1")).toBe("legacy-save");
  expect(loadJourney("four-weeks").state.profile!.goal).toBe(
    "Changed only this journey",
  );
});

it("preserves editable onboarding drafts across refresh, including an unfinished time entry", () => {
  selectJourney("new");
  saveDemoDraft({ ...zahiExample, name: "", graduation: "", hours: 0 }, []);
  expect(loadJourney().draft?.profile.name).toBe("");
  expect(loadJourney().draft?.profile.hours).toBe(0);
  expect(loadJourney().state.profile).toBeNull();
});
