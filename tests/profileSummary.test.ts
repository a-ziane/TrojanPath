import { expect, it } from "vitest";
import { profileSummary } from "../src/profileSummary";
import { demoProfile, emptyState } from "../shared/domain";
import { makePlan } from "../shared/planner";
it("exports advisor-relevant student information without private files or draft posts", () => {
  const profile = {
    ...demoProfile,
    skillContext: { Python: "Used Python in a class project" },
    resumePath: "private/resume-file.pdf",
    resumeDraft: "PRIVATE RESUME DRAFT",
    portfolioPosts: { test: "PRIVATE SOCIAL DRAFT" },
  };
  const state = {
    ...emptyState(),
    profile,
    projects: [
      {
        id: crypto.randomUUID(),
        title: "Student project",
        description: "Built a small website.",
        date: "2026-11-15",
        skills: ["Python"],
        url: "https://example.com/project",
        completed: true,
        attachment: "private/attachment",
      },
    ],
  };
  const text = profileSummary(profile, state, new Date("2026-11-15T12:00:00Z"));
  expect(text).toContain("Self-reported:");
  expect(text).toContain("Used Python in a class project");
  expect(text).toContain("https://example.com/project");
  expect(text).toContain("Student project — Completed");
  expect(text).not.toMatch(/private\/|PRIVATE RESUME|PRIVATE SOCIAL/);
});
it("selects the latest week and includes actual completion and reflection", () => {
  const state = { ...emptyState(), profile: demoProfile };
  const older = makePlan(demoProfile, state, "2026-11-09", "fallback");
  const latest = makePlan(demoProfile, state, "2026-11-16", "fallback");
  latest.tasks[0].status = "completed";
  latest.tasks[0].reflection = "Saved my working notebook.";
  state.plans = [older, latest];
  const text = profileSummary(demoProfile, state);
  expect(text).toContain("Week of 2026-11-16");
  expect(text).toContain(`1 of ${latest.tasks.length} tasks completed`);
  expect(text).toContain("Saved my working notebook.");
  expect(text).not.toContain("Week of 2026-11-09");
});
