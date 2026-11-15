import type { AppState, Profile } from "../shared/domain";
export type PortfolioActivity = {
  id: string;
  kind: "project" | "event" | "task";
  title: string;
  evidence: string;
  url?: string;
  skills: string[];
};
export type PortfolioPatch = Pick<
  Profile,
  "resumeDraft" | "portfolioReview" | "portfolioPosts"
>;
export function completedActivities(state: AppState): PortfolioActivity[] {
  const projects = state.projects
    .filter((p) => p.completed)
    .map((p) => ({
      id: `project:${p.id}`,
      kind: "project" as const,
      title: p.title,
      evidence: p.description,
      url: p.url,
      skills: p.skills,
    }));
  const tasks = state.plans
    .flatMap((p) => p.tasks)
    .filter((t) => t.status === "completed")
    .map((t) => ({
      id: `task:${t.id}`,
      kind: /hackathon|event|attend|conference|workshop|meetup|seminar/i.test(
        t.title,
      )
        ? ("event" as const)
        : ("task" as const),
      title: t.title,
      evidence: t.reflection,
      skills: [],
    }));
  return [...new Map([...projects, ...tasks].map((a) => [a.id, a])).values()];
}
function pastTitle(title: string) {
  const verbs: Record<string, string> = {
    attend: "Attended",
    build: "Built",
    create: "Created",
    practice: "Practiced",
    explore: "Explored",
    improve: "Improved",
    research: "Researched",
    design: "Designed",
    prepare: "Prepared",
    compare: "Compared",
    complete: "Completed",
    map: "Mapped",
    write: "Wrote",
    read: "Read",
    develop: "Developed",
    learn: "Learned",
    join: "Joined",
  };
  const first = title.split(" ")[0].toLowerCase();
  return verbs[first]
    ? title
        .replace(/^\S+/, verbs[first])
        .replace(/\byour first tiny\b/gi, "a")
        .replace(/\byour\b/gi, "a")
        .replace(/\byou\b/gi, "I")
    : `Completed: ${title}`;
}
export function resumeSuggestion(activity: PortfolioActivity): string {
  const description = activity.evidence.trim();
  return activity.kind === "project"
    ? `${activity.title} — ${description}${activity.skills.length ? ` Skills: ${activity.skills.join(", ")}.` : ""}${activity.url ? ` ${activity.url}` : ""}`
    : `${pastTitle(activity.title)}.${description ? ` ${description}` : ""}`;
}
export function addResumeEntry(resume: string, entry: string): string {
  const value = entry.trim();
  if (!value) throw new Error("Write a résumé entry before accepting it.");
  if (resume.includes(value)) return resume;
  const next = `${resume.trimEnd()}\n\n${resume.includes("ACTIVITIES & PROJECT UPDATES") ? "" : "ACTIVITIES & PROJECT UPDATES\n"}• ${value}`;
  if (next.length > 4000)
    throw new Error(
      "This would exceed the résumé’s 4,000-character limit. Shorten the entry or document first.",
    );
  return next;
}
export function linkedInDraft(activity: PortfolioActivity): string {
  const intro =
    activity.kind === "project"
      ? `I recently completed ${activity.title}.`
      : activity.kind === "event"
        ? `A recent learning experience: ${pastTitle(activity.title)}.`
        : `A small step in my learning journey: ${pastTitle(activity.title)}.`;
  return `${intro}\n\n${activity.evidence.trim() || "[Add what you actually did and one thing you learned.]"}${activity.skills.length ? `\n\nSkills I worked with: ${activity.skills.join(", ")}.` : ""}${activity.url ? `\n\n${activity.url}` : ""}\n\n${activity.kind === "project" ? "#StudentProjects" : "#LearningByDoing"} #USC`;
}
