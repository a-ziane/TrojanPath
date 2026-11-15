import {
  taskXP,
  type AppState,
  type Profile,
  type Task,
} from "../shared/domain";
import { firstDemoPlan } from "./demoJourneys";
import { fallbackEvents } from "../shared/campus-event-snapshot";
export function eventTaskLocked(task: Task, now = Date.now()) {
  return (
    !!task.eventId &&
    (!task.eventEndsAt ||
      !Number.isFinite(Date.parse(task.eventEndsAt)) ||
      Date.parse(task.eventEndsAt) > now)
  );
}
export function syncDemoEventTasks(
  state: AppState,
  profile: Profile,
): AppState {
  let next = {
    ...state,
    profile,
    plans: state.plans.map((p) => ({ ...p, tasks: [...p.tasks] })),
    xp: [...state.xp],
  };
  for (const [id, event] of Object.entries(profile.campusEvents || {})) {
    const existing = next.plans
      .flatMap((p) => p.tasks)
      .find((t) => t.eventId === id);
    if (!event.going) {
      if (existing && existing.status !== "completed") {
        next.plans = next.plans.map((p) => ({
          ...p,
          tasks: p.tasks.filter((t) => t.id !== existing.id),
        }));
        next.xp = next.xp.filter((e) => e.key !== `task:${existing.id}`);
      }
      continue;
    }
    if (existing) continue;
    if (!next.plans.length)
      next.plans = [{ ...firstDemoPlan(profile), tasks: [] }];
    const target = [...next.plans].sort((a, b) =>
      b.week.localeCompare(a.week),
    )[0];
    const endsOn =
      event.endsOn ?? fallbackEvents.find((e) => e.id === id)?.endsOn ?? null;
    const duration =
      event.startsOn && endsOn
        ? (Date.parse(endsOn) - Date.parse(event.startsOn)) / 60000
        : 60;
    const minutes = Math.max(
      5,
      Math.min(240, Math.ceil(Number.isFinite(duration) ? duration : 60)),
    );
    const task: Task = {
      id: crypto.randomUUID(),
      title: `Attend ${event.title}`.slice(0, 160),
      instructions:
        "Attend the selected USC event. Check the official page for registration and schedule changes. This student-selected event is additional to the generated plan.",
      why: "You chose to attend this event.",
      criteria:
        "After the official end time, confirm participation and save a reflection.",
      minutes,
      category: "networking",
      resourceIds: [],
      status: "suggested",
      reflection: "",
      xp: taskXP(minutes),
      eventId: id,
      eventStartsAt: event.startsOn,
      eventEndsAt: endsOn,
      eventURL: event.url,
    };
    target.tasks.push(task);
  }
  return next;
}
