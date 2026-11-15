import type { AppState, Checkin, Task } from "../../shared/domain";
export type TaskFilter = "active" | "completed" | "skipped";
export function tasksForView(tasks: Task[], filter: TaskFilter) {
  return tasks.filter((t) =>
    filter === "active"
      ? t.status === "suggested" || t.status === "in progress"
      : t.status === filter,
  );
}
export function weeklyRecap(state: AppState, checkin: Checkin) {
  const tasks = state.plans
    .filter((p) => p.week === checkin.week)
    .flatMap((p) => p.tasks);
  const completed = tasks.filter((t) =>
    checkin.confirmed
      ? checkin.confirmed.includes(t.id)
      : t.status === "completed" && checkin.completed.includes(t.id),
  );
  const reported = checkin.completed.filter(
    (id) =>
      tasks.some((t) => t.id === id) && !completed.some((t) => t.id === id),
  ).length;
  return {
    completed,
    reported,
    text: completed.length
      ? `You completed ${completed.length} ${completed.length === 1 ? "quest" : "quests"}${completed.length ? `: ${completed.map((t) => t.title).join("; ")}` : ""}.`
      : "You made time to reflect on your week.",
  };
}
