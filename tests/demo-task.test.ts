import { expect, it } from "vitest";
import { demoProfile, emptyState } from "../shared/domain";
import { makePlan } from "../shared/planner";
import { HACKSC_TASK_TITLE, withDemoHackSC } from "../shared/demoTasks";
it("includes HackSC in a default demo without exceeding its original budget or changing the live fallback", () => {
  const state = { ...emptyState(), profile: demoProfile };
  const demo = makePlan(demoProfile, state, "2026-11-09", "demo");
  const live = makePlan(demoProfile, state, "2026-11-09", "fallback");
  expect(demo.tasks.some((t) => t.title === HACKSC_TASK_TITLE)).toBe(true);
  expect(live.tasks.some((t) => t.title === HACKSC_TASK_TITLE)).toBe(false);
  expect(demo.tasks.reduce((sum, t) => sum + t.minutes, 0)).toBeLessThanOrEqual(
    live.tasks.reduce((sum, t) => sum + t.minutes, 0),
  );
  expect(demo.tasks[0].title).toBe(live.tasks[0].title);
});
it("leaves completed, reflected, and awarded demo work untouched and upgrades at most once", () => {
  const state = { ...emptyState(), profile: demoProfile };
  const plan = {
    ...makePlan(demoProfile, state, "2026-11-09", "fallback"),
    source: "demo" as const,
  };
  const protectedPlan = {
    ...plan,
    tasks: plan.tasks.map((t) => ({ ...t, status: "completed" as const })),
  };
  expect(withDemoHackSC(protectedPlan, state)).toBe(protectedPlan);
  const updated = withDemoHackSC(plan, state);
  expect(withDemoHackSC(updated, { ...state, plans: [updated] })).toBe(updated);
  expect(
    updated.tasks.filter((t) => t.title === HACKSC_TASK_TITLE),
  ).toHaveLength(1);
});
