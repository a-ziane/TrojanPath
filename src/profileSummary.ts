import { localDate, type AppState, type Profile } from "../shared/domain";

/** Student-controlled advisor handout. Never includes private storage paths or AI assertions of mastery. */
export function profileSummary(
  profile: Profile,
  state: AppState,
  date = new Date(),
) {
  const sections: string[] = [
    profile.name,
    `${profile.email}\nAdvisor profile summary · ${localDate(date, profile.timezone)}`,
    `ACADEMIC BACKGROUND\nUniversity of Southern California\n${profile.degree} · ${profile.major}${profile.minor ? ` · Minor: ${profile.minor}` : ""}\n${profile.standing ? `${profile.standing} · ` : ""}Expected graduation: ${profile.graduation}`,
    `GOALS & AVAILABILITY\n${profile.goal || "Career direction still being explored."}\n${profile.hours} hours available each week\nResearch or graduate school interest: ${profile.research ? "Yes" : "Not indicated"}`,
  ];
  if (profile.interests.length)
    sections.push(`INTERESTS\n${profile.interests.join(", ")}`);
  if (profile.skills.length)
    sections.push(
      `SKILLS & CONTEXT\nSelf-reported: ${profile.skills.join(", ")}${profile.skills
        .filter((s) => profile.skillContext?.[s])
        .map((s) => `\n• ${s}: ${profile.skillContext![s]}`)
        .join("")}`,
    );
  if (profile.experiences.trim())
    sections.push(`PRIOR EXPERIENCE\n${profile.experiences}`);
  if (state.projects.length)
    sections.push(
      `PROJECTS\n${state.projects.map((p) => `• ${p.title} — ${p.completed ? "Completed" : "In progress"}\n${p.description}${p.skills.length ? `\nSkills used: ${p.skills.join(", ")}` : ""}${p.url ? `\n${p.url}` : ""}`).join("\n\n")}`,
    );
  const latest = [...state.plans].sort((a, b) =>
    b.week.localeCompare(a.week),
  )[0];
  if (latest)
    sections.push(
      `LATEST WEEKLY PLAN\nWeek of ${latest.week}\n${latest.direction}\n${latest.tasks.filter((t) => t.status === "completed").length} of ${latest.tasks.length} tasks completed\n${latest.tasks.map((t) => `• ${t.title} — ${t.status === "suggested" || t.status === "in progress" ? "To do" : t.status}\n${t.minutes} minutes${t.reflection ? `\nEvidence / reflection: ${t.reflection}` : ""}`).join("\n\n")}`,
    );
  const checkin = [...state.checkins].sort((a, b) =>
    b.week.localeCompare(a.week),
  )[0];
  if (checkin)
    sections.push(
      `LATEST CHECK-IN\nWeek of ${checkin.week}\nWorkload: ${checkin.workload}${checkin.enjoyed ? `\nEnjoyed: ${checkin.enjoyed}` : ""}${checkin.disliked ? `\nNot a fit: ${checkin.disliked}` : ""}${checkin.goal ? `\nDirection update: ${checkin.goal}` : ""}${checkin.reflection ? `\nReflection: ${checkin.reflection}` : ""}`,
    );
  return sections.join("\n\n");
}
