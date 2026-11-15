import { expect, it } from "vitest";
import { badgesFor } from "../src/teammate/achievements";
import { emptyState, demoProfile, type Checkin } from "../shared/domain";
it("earns badges from recorded events and does not count duplicate check-in weeks as a streak", () => {
  const state = {
    ...emptyState(),
    profile: { ...demoProfile, interests: ["Design", "Research", "Writing"] },
    xp: [
      { key: "task:one", amount: 50, createdAt: "2026-11-14T12:00:00Z" },
      { key: "project:one", amount: 100, createdAt: "2026-11-14T12:00:00Z" },
    ],
  };
  const earned = badgesFor(state)
    .filter((b) => b.earned)
    .map((b) => b.id);
  expect(earned).toEqual(["first", "builder", "curious"]);
  const entry = (week: string): Checkin => ({
    id: crypto.randomUUID(),
    week,
    completed: [],
    confirmed: [],
    enjoyed: "",
    disliked: "",
    workload: "manageable",
    goal: "",
    reflection: "",
  });
  const duplicate = {
    ...state,
    checkins: [entry("2026-11-02"), entry("2026-11-02"), entry("2026-11-09")],
  };
  expect(badgesFor(duplicate).find((b) => b.id === "streak")?.earned).toBe(
    false,
  );
  expect(
    badgesFor({
      ...duplicate,
      checkins: [...duplicate.checkins, entry("2026-11-16")],
    }).find((b) => b.id === "streak")?.earned,
  ).toBe(true);
});
it("does not award the weekly-clear badge for an empty plan or only self-reported completions", () => {
  expect(badgesFor(emptyState()).find((b) => b.id === "week")?.earned).toBe(
    false,
  );
});
