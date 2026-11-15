import { expect, it } from "vitest";
import { demoProfile, emptyState, setTask, totalXP } from "../shared/domain";
import { completedActivities } from "../src/portfolio";
import { syncDemoEventTasks, eventTaskLocked } from "../src/eventTasks";
const event = {
  title: "Sample event",
  url: "https://calendar.usc.edu/event/test",
  startsOn: "2026-11-24T12:00:00-08:00",
  endsOn: "2026-11-24T13:00:00-08:00",
  going: true,
  attended: false,
  note: "",
};
it("adds a deduplicated event task with points and locks it until after the end", () => {
  const profile = { ...demoProfile, campusEvents: { test: event } };
  let state = syncDemoEventTasks({ ...emptyState(), profile }, profile);
  state = syncDemoEventTasks(state, profile);
  const tasks = state.plans.flatMap((p) => p.tasks);
  expect(tasks).toHaveLength(1);
  expect(tasks[0].xp).toBe(40);
  expect(
    eventTaskLocked(tasks[0], Date.parse("2026-11-24T12:30:00-08:00")),
  ).toBe(true);
  expect(
    eventTaskLocked(tasks[0], Date.parse("2026-11-24T13:01:00-08:00")),
  ).toBe(false);
  expect(() => setTask(state, tasks[0].id, "completed")).toThrow(
    "official end time",
  );
  expect(totalXP(state)).toBe(0);
  const removed = syncDemoEventTasks(state, {
    ...profile,
    campusEvents: { test: { ...event, going: false } },
  });
  expect(removed.plans.flatMap((p) => p.tasks)).toHaveLength(0);
});
it("keeps tasks with unknown event end times locked", () => {
  const profile = {
    ...demoProfile,
    campusEvents: { test: { ...event, endsOn: null } },
  };
  const state = syncDemoEventTasks({ ...emptyState(), profile }, profile);
  expect(
    eventTaskLocked(state.plans[0].tasks[0], Date.parse("2027-01-01")),
  ).toBe(true);
});

it("awards a completed past event once, syncs Portfolio evidence, and reverses on uncheck", () => {
  const profile = {
    ...demoProfile,
    campusEvents: {
      test: {
        ...event,
        startsOn: "2020-01-01T12:00:00Z",
        endsOn: "2020-01-01T13:00:00Z",
      },
    },
  };
  let state = syncDemoEventTasks({ ...emptyState(), profile }, profile);
  const task = state.plans[0].tasks[0];
  state = setTask(
    state,
    task.id,
    "completed",
    "Learned about analysis methods.",
  );
  state = setTask(
    state,
    task.id,
    "completed",
    "Learned about analysis methods.",
  );
  expect(totalXP(state)).toBe(40);
  expect(state.profile!.campusEvents!.test.attended).toBe(true);
  expect(completedActivities(state)).toHaveLength(1);
  state = setTask(state, task.id, "suggested");
  expect(totalXP(state)).toBe(0);
  expect(state.profile!.campusEvents!.test.attended).toBe(false);
});
