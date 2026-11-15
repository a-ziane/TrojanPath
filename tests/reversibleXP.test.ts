import { expect, it } from "vitest";
import {
  demoProfile,
  emptyState,
  setTask,
  saveProject,
  totalXP,
} from "../shared/domain";
import { firstDemoPlan } from "../src/demoJourneys";
it("removes and restores demo task XP without duplication or a negative total", () => {
  const plan = firstDemoPlan(demoProfile);
  let state = { ...emptyState(), profile: demoProfile, plans: [plan] };
  const task = plan.tasks[0];
  state = setTask(state, task.id, "completed");
  expect(totalXP(state)).toBe(task.xp);
  state = setTask(state, task.id, "suggested");
  expect(totalXP(state)).toBe(0);
  state = setTask(state, task.id, "suggested");
  expect(totalXP(state)).toBe(0);
  state = setTask(state, task.id, "completed");
  state = setTask(state, task.id, "completed");
  expect(totalXP(state)).toBe(task.xp);
});
it("removes only the unchecked project reward", () => {
  let state = { ...emptyState(), profile: demoProfile };
  const project = {
    id: crypto.randomUUID(),
    title: "Sample analysis",
    description: "A small sample analysis.",
    date: "2026-11-15",
    skills: [],
    url: "",
    completed: true,
  };
  state = saveProject(state, project);
  expect(totalXP(state)).toBe(100);
  state = saveProject(state, { ...project, completed: false });
  expect(totalXP(state)).toBe(0);
  state = saveProject(state, project);
  expect(totalXP(state)).toBe(100);
});
