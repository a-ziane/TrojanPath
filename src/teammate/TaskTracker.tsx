import { useState } from "react";
import type { Task } from "../../shared/domain";
import { tasksForView, type TaskFilter } from "./taskView";
import { TaskCard } from "./TaskCard";
export interface TaskActions {
  busy: boolean;
  onTask: (t: Task, status: Task["status"], reflection?: string) => void;
  onReplace: (t: Task) => void;
}
export function TaskTracker({
  tasks,
  ...actions
}: { tasks: Task[] } & TaskActions) {
  const [filter, setFilter] = useState<TaskFilter>("all");
  const visible = tasksForView(tasks, filter);
  return (
    <section className="tp-tracker">
      <div className="tp-task-tabs" role="group" aria-label="Filter tasks">
        {(["all", "active", "completed", "skipped"] as const).map((f) => (
          <button
            key={f}
            aria-pressed={filter === f}
            onClick={() => setFilter(f)}
          >
            {f === "all"
              ? "All"
              : f === "active"
                ? "Active"
                : f === "completed"
                  ? "Completed"
                  : "Skipped"}{" "}
            <span>{tasksForView(tasks, f).length}</span>
          </button>
        ))}
      </div>
      <div className="tp-task-list">
        {visible.map((t) => (
          <TaskCard
            key={t.id}
            task={t}
            busy={actions.busy}
            onStatus={(s) => actions.onTask(t, s)}
            onReflection={(r) => actions.onTask(t, t.status, r)}
            onReplace={() => actions.onReplace(t)}
          />
        ))}
      </div>
      {!visible.length && (
        <p className="tp-empty">
          {filter === "active"
            ? "No active tasks for this week."
            : filter === "completed"
              ? "No completed tasks yet."
              : "No skipped tasks."}
        </p>
      )}
    </section>
  );
}
