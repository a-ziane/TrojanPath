import { taskXP, type AppState, type Plan, type Task } from "./domain.ts";
export const HACKSC_TASK_TITLE = "Attend HackSC hackathon";
export const HACKSC_URL = "https://www.hacksc.com/";
/** Upgrade one untouched demo suggestion without increasing its time budget. */
export function withDemoHackSC(plan: Plan, state: AppState): Plan {
  if (
    plan.source !== "demo" ||
    state.plans.some((p) =>
      p.tasks.some((t) => t.title === HACKSC_TASK_TITLE),
    ) ||
    plan.tasks.some((t) => t.title === HACKSC_TASK_TITLE)
  )
    return plan;
  let index = -1;
  for (let i = plan.tasks.length - 1; i >= 0; i--) {
    const task = plan.tasks[i];
    if (
      task.status === "suggested" &&
      !task.reflection.trim() &&
      task.minutes >= 60 &&
      !state.xp.some((e) => e.key === `task:${task.id}`)
    ) {
      index = i;
      break;
    }
  }
  if (index < 0) return plan;
  const task: Task = {
    ...plan.tasks[index],
    title: HACKSC_TASK_TITLE,
    instructions:
      "Check HackSC’s official schedule, registration, and eligibility. If you are registered and the event is running, attend a one-hour workshop, team-building, or hacking session. This is a one-hour participation block, not the full hackathon.",
    why: "Try collaborative building, meet other students, and explore an idea in a hackathon setting.",
    minutes: 60,
    category: "projects",
    criteria:
      "Attend a session and save a short reflection on what you tried, learned, or built. Only mark complete after participating.",
    resourceIds: ["engage"],
    xp: taskXP(60),
    reflection: "",
    status: "suggested",
  };
  return { ...plan, tasks: plan.tasks.map((t, i) => (i === index ? task : t)) };
}
