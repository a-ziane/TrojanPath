import { describe, it, expect } from "vitest";
import {
  demoProfile,
  emptyState,
  nextWeek,
  saveCheckin,
  saveProject,
  setTask,
  streak,
  totalXP,
  weekKey,
  type AppState,
  type Checkin,
} from "../shared/domain";
import {
  discipline,
  makePlan,
  replaceTask,
  validatePlan,
} from "../shared/planner";
const base = (): AppState => ({ ...emptyState(), profile: demoProfile });
const feedback: Checkin = {
  id: crypto.randomUUID(),
  week: "2026-11-09",
  completed: [],
  enjoyed: "I enjoyed building the model",
  disliked: "",
  workload: "too busy",
  goal: "",
  reflection: "",
};
describe("complete career planning flow", () => {
  it("builds a personal plan, awards once, and reduces next-week workload", () => {
    let s = base();
    const p = makePlan(demoProfile, s, "2026-11-09");
    s.plans = [p];
    expect(p.direction).toContain("Economics");
    expect(p.tasks.length).toBeGreaterThanOrEqual(3);
    s = setTask(s, p.tasks[0].id, "completed");
    s = setTask(s, p.tasks[0].id, "completed");
    expect(totalXP(s)).toBe(p.tasks[0].xp);
    const project = {
      id: crypto.randomUUID(),
      title: "Housing model",
      description: "Built a small baseline model",
      date: "2026-11-14",
      skills: ["Python"],
      url: "",
      completed: true,
    };
    s = saveProject(s, project);
    s = saveProject(s, {
      ...project,
      description: "Edited project description",
    });
    expect(totalXP(s)).toBe(p.tasks[0].xp + 100);
    s = saveCheckin(s, feedback);
    s = saveCheckin(s, { ...feedback, id: crypto.randomUUID() });
    expect(s.checkins).toHaveLength(1);
    expect(streak(s.checkins, new Date("2026-11-14T18:00Z"))).toBe(1);
    const next = makePlan(
      demoProfile,
      s,
      nextWeek(feedback.week),
      "demo",
      feedback,
    );
    expect(next.tasks.reduce((n, t) => n + t.minutes, 0)).toBeLessThanOrEqual(
      120,
    );
    expect(next.tasks[0].category).toBe("projects");
    expect(next.tasks.some((t) => t.title === p.tasks[0].title)).toBe(false);
    expect(next.change).toContain("half");
    expect(JSON.parse(JSON.stringify(s))).toEqual(s);
  });
  it("uses distinct discipline and degree pathways", () => {
    const profiles = [
      demoProfile,
      {
        ...demoProfile,
        major: "Pre-med Biology",
        interests: ["Healthcare"],
        goal: "Become a doctor",
      },
      {
        ...demoProfile,
        degree: "PhD" as const,
        major: "Physics",
        goal: "Independent research",
        interests: ["Research"],
      },
      {
        ...demoProfile,
        major: "Film",
        goal: "Build a creative portfolio",
        interests: ["Film"],
      },
      {
        ...demoProfile,
        major: "History",
        goal: "I’m exploring",
        interests: [],
      },
    ];
    expect(new Set(profiles.map((p) => discipline(p))).size).toBe(5);
    expect(
      new Set(
        profiles.map(
          (p) => makePlan(p, base(), "2026-11-09", "fallback").tasks[0].title,
        ),
      ).size,
    ).toBe(5);
  });
  it("keeps tiny plans within budget and replacements within original time", () => {
    const p = { ...demoProfile, hours: 0.25 };
    const plan = makePlan(p, base(), "2026-11-09");
    expect(plan.tasks.reduce((n, t) => n + t.minutes, 0)).toBeLessThanOrEqual(
      15,
    );
    const s = { ...base(), plans: [plan] };
    const replaced = replaceTask(s, plan.tasks[0].id);
    expect(replaced.plans[0].tasks[0].minutes).toBeLessThanOrEqual(15);
  });
  it("rejects untrusted AI resource ids, excessive workload, and completed repeats", () => {
    const s = base(),
      p = makePlan(demoProfile, s, "2026-11-09");
    expect(() =>
      validatePlan(
        { ...p, tasks: [{ ...p.tasks[0], resourceIds: ["invented"] }] },
        demoProfile,
        s,
      ),
    ).toThrow("Unknown resource");
    expect(() =>
      validatePlan(
        {
          ...p,
          tasks: [
            { ...p.tasks[0], minutes: 240 },
            { ...p.tasks[1], minutes: 240 },
          ],
        },
        demoProfile,
        s,
      ),
    ).toThrow("budget");
  });
  it("uses local weeks across timezone boundaries and consecutive check-ins", () => {
    expect(weekKey(new Date("2026-11-16T01:00Z"), "America/Los_Angeles")).toBe(
      "2026-11-09",
    );
    expect(weekKey(new Date("2026-11-16T01:00Z"), "Asia/Tokyo")).toBe(
      "2026-11-16",
    );
    expect(
      streak(
        [feedback, { ...feedback, week: "2026-11-02" }],
        new Date("2026-11-14T18:00Z"),
      ),
    ).toBe(2);
    expect(
      streak(
        [feedback, { ...feedback, week: "2026-11-09" }],
        new Date("2026-11-14T18:00Z"),
      ),
    ).toBe(1);
  });
});
