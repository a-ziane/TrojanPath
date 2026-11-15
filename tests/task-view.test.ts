import { expect, it } from "vitest";
import { tasksForView, weeklyRecap } from "../src/teammate/taskView";
import {
  demoProfile,
  emptyState,
  profileSchema,
  setTask,
  totalXP,
  type Checkin,
  type Task,
} from "../shared/domain";
import { makePlan } from "../shared/planner";
const base = () => {
  const state = { ...emptyState(), profile: demoProfile };
  return {
    ...state,
    plans: [makePlan(demoProfile, state, "2026-11-09", "demo")],
  };
};
it("active combines legacy suggested/in-progress tasks and excludes completed/skipped tasks", () => {
  const tasks = base()
    .plans[0].tasks.slice(0, 4)
    .map((t, i) => ({
      ...t,
      status: (
        ["suggested", "in progress", "completed", "skipped"] as Task["status"][]
      )[i],
    }));
  expect(tasksForView(tasks, "active").map((t) => t.status)).toEqual([
    "suggested",
    "in progress",
  ]);
  expect(tasksForView(tasks, "completed").map((t) => t.status)).toEqual([
    "completed",
  ]);
  expect(tasksForView(tasks, "skipped").map((t) => t.status)).toEqual([
    "skipped",
  ]);
});
it("completion can be toggled without farming duplicate XP", () => {
  const state = base(),
    task = state.plans[0].tasks[0];
  const completed = setTask(state, task.id, "completed");
  const reopened = setTask(completed, task.id, "suggested");
  const again = setTask(reopened, task.id, "completed");
  expect(
    tasksForView(reopened.plans[0].tasks, "active").some(
      (t) => t.id === task.id,
    ),
  ).toBe(true);
  expect(totalXP(again)).toBe(task.xp);
});
it("recaps use confirmed completions for the selected week and preserve snapshots", () => {
  const state = base(),
    task = state.plans[0].tasks[0];
  const checkin: Checkin = {
    id: crypto.randomUUID(),
    week: "2026-11-09",
    completed: [task.id, state.plans[0].tasks[1].id],
    confirmed: [task.id],
    enjoyed: "Building",
    disliked: "",
    workload: "manageable",
    goal: "",
    reflection: "",
  };
  const recap = weeklyRecap(state, checkin);
  expect(recap.completed.map((t) => t.id)).toEqual([task.id]);
  expect(recap.reported).toBe(1);
  expect(recap.text).toContain(task.title);
  expect(
    weeklyRecap(state, { ...checkin, week: "2026-11-16" }).completed,
  ).toHaveLength(0);
});
it("skill context survives profile validation for saving and AI planning", () => {
  expect(
    profileSchema.parse({
      ...demoProfile,
      skillContext: { Figma: "Designed a course project prototype" },
    }).skillContext?.Figma,
  ).toContain("course project");
});
