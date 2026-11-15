import { expect, it } from "vitest";
import {
  demoProfile,
  emptyState,
  profileSchema,
  type Project,
} from "../shared/domain";
import { makePlan } from "../shared/planner";
import {
  addResumeEntry,
  completedActivities,
  linkedInDraft,
  resumeSuggestion,
} from "../src/portfolio";
const base = () => {
  const state = { ...emptyState(), profile: demoProfile };
  return {
    ...state,
    plans: [makePlan(demoProfile, state, "2026-11-09", "fallback")],
  };
};
it("suggests only completed work, not planned instructions or unearned activities", () => {
  const state = base();
  state.plans[0].tasks[0].status = "completed";
  state.plans[0].tasks[0].reflection =
    "Compared a baseline using a held-out dataset.";
  const activities = completedActivities(state);
  expect(activities).toHaveLength(1);
  expect(resumeSuggestion(activities[0])).toContain("held-out dataset");
  expect(resumeSuggestion(activities[0])).not.toContain(
    state.plans[0].tasks[0].instructions,
  );
});
it("accepts an edited addition once and refuses an oversized update", () => {
  const text = addResumeEntry("EDUCATION\nUSC", "Built a course project.");
  expect(text).toContain("• Built a course project.");
  expect(addResumeEntry(text, "Built a course project.")).toBe(text);
  expect(() =>
    addResumeEntry("a".repeat(3990), "This is too much additional content."),
  ).toThrow("limit");
  expect(() => addResumeEntry("Résumé", " ")).toThrow("Write");
});
it("persists accepted/dismissed decisions and edited posts through the profile schema", () => {
  const p = profileSchema.parse({
    ...demoProfile,
    resumeDraft: "Updated résumé",
    portfolioReview: {
      "task:1": { status: "accepted", text: "Edited bullet" },
      "task:2": { status: "dismissed", text: "Unwanted bullet" },
    },
    portfolioPosts: { "task:1": "My edited post" },
  });
  expect(p.portfolioReview?.["task:2"].status).toBe("dismissed");
  expect(p.portfolioPosts?.["task:1"]).toBe("My edited post");
});
it("drafts project and event posts without inventing results when evidence is missing", () => {
  const project = {
    id: "project:1",
    kind: "project" as const,
    title: "Campus planner",
    evidence: "Built an accessible prototype.",
    url: "https://example.com",
    skills: ["Figma"],
  };
  expect(linkedInDraft(project)).toContain("accessible prototype");
  expect(linkedInDraft(project)).toContain("https://example.com");
  const event = {
    id: "task:1",
    kind: "event" as const,
    title: "Attend HackSC hackathon",
    evidence: "",
    skills: [],
  };
  expect(linkedInDraft(event)).toContain("Attended HackSC hackathon");
  expect(linkedInDraft(event)).toContain("[Add what you actually did");
  expect(linkedInDraft(event)).not.toContain("won");
});
