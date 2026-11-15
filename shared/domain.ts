import { z } from "zod";
export const THEMES = [
  "technology",
  "healthcare",
  "research",
  "creative arts",
] as const;
const text = z.string().trim().max(4000);
export const profileSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z
    .string()
    .email()
    .refine(
      (v) => /@(?:[\w-]+\.)?usc\.edu$/i.test(v),
      "Use your USC email address.",
    ),
  major: z.string().trim().min(1).max(150),
  minor: text.default(""),
  degree: z.enum(["Undergraduate", "Master’s", "PhD"]),
  standing: text,
  graduation: z.string().regex(/^\d{4}-\d{2}$/),
  interests: z.array(z.string().max(80)).max(20),
  skills: z.array(z.string().max(80)).max(30),
  goal: text,
  research: z.boolean(),
  hours: z.number().min(0.25).max(30),
  experiences: text,
  timezone: z.string().refine((v) => {
    try {
      new Intl.DateTimeFormat("en", { timeZone: v });
      return true;
    } catch {
      return false;
    }
  }, "Invalid timezone"),
  theme: z.enum(THEMES),
  avatar: z.enum(["cardinal", "gold", "sage"]),
  leaderboard: z.boolean(),
  displayName: z.string().max(40),
  resumePath: text.optional(),
  resumeDraft: text.optional(),
});
export type Profile = z.infer<typeof profileSchema>;
export const taskSpecSchema = z.object({
  title: z.string().min(3).max(160),
  instructions: z.string().min(10).max(1800),
  why: z.string().min(5).max(500),
  minutes: z.number().int().min(5).max(240),
  category: z.enum([
    "exploration",
    "skills",
    "projects",
    "research",
    "networking",
  ]),
  criteria: z.string().min(5).max(500),
  resourceIds: z.array(z.string().max(50)).max(4),
});
export type TaskSpec = z.infer<typeof taskSpecSchema>;
export type Task = TaskSpec & {
  id: string;
  status: "suggested" | "in progress" | "completed" | "skipped";
  xp: number;
  reflection: string;
};
export const planSpecSchema = z.object({
  direction: z.string().min(10).max(1200),
  change: z.string().max(700),
  milestones: z.array(z.string().min(3).max(200)).min(3).max(5),
  tasks: z.array(taskSpecSchema).min(1).max(5),
});
export type PlanSpec = z.infer<typeof planSpecSchema>;
export type Plan = Omit<PlanSpec, "tasks"> & {
  id: string;
  week: string;
  createdAt: string;
  source: "demo" | "fallback" | "gemini";
  tasks: Task[];
};
export const projectSchema = z.object({
  id: z.string().uuid(),
  title: z.string().trim().min(2).max(150),
  description: z.string().trim().min(5).max(3000),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  skills: z.array(z.string().max(80)).max(20),
  url: z
    .string()
    .max(500)
    .refine((v) => !v || /^https:\/\//.test(v), "Use an https:// URL"),
  attachment: z.string().max(1000).optional(),
  attachmentName: z.string().max(200).optional(),
  completed: z.boolean(),
});
export type Project = z.infer<typeof projectSchema>;
export const checkinSchema = z.object({
  id: z.string().uuid(),
  week: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  completed: z.array(z.string()).max(50),
  enjoyed: text,
  disliked: text,
  workload: z.enum(["manageable", "too busy", "ready for more"]),
  goal: text,
  reflection: text,
});
export type Checkin = z.infer<typeof checkinSchema>;
export type XPEvent = { key: string; amount: number; createdAt: string };
export type AppState = {
  profile: Profile | null;
  plans: Plan[];
  projects: Project[];
  checkins: Checkin[];
  xp: XPEvent[];
};
export const emptyState = (): AppState => ({
  profile: null,
  plans: [],
  projects: [],
  checkins: [],
  xp: [],
});
export const XP = { project: 100, per15Minutes: 10, level: 100 };
export const taskXP = (minutes: number) =>
  Math.max(10, Math.ceil(minutes / 15) * XP.per15Minutes);
export function weekKey(date = new Date(), timezone = "America/Los_Angeles") {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const get = (t: string) => parts.find((p) => p.type === t)!.value;
  const d = new Date(`${get("year")}-${get("month")}-${get("day")}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return d.toISOString().slice(0, 10);
}
export function nextWeek(week: string) {
  const d = new Date(week + "T12:00Z");
  d.setUTCDate(d.getUTCDate() + 7);
  return d.toISOString().slice(0, 10);
}
export function streak(
  checkins: Checkin[],
  today = new Date(),
  timezone = "America/Los_Angeles",
) {
  const weeks = new Set(checkins.map((c) => c.week));
  let cursor = weekKey(today, timezone),
    n = 0;
  if (!weeks.has(cursor)) {
    const d = new Date(cursor + "T12:00Z");
    d.setUTCDate(d.getUTCDate() - 7);
    cursor = d.toISOString().slice(0, 10);
  }
  while (weeks.has(cursor)) {
    n++;
    const d = new Date(cursor + "T12:00Z");
    d.setUTCDate(d.getUTCDate() - 7);
    cursor = d.toISOString().slice(0, 10);
  }
  return n;
}
export function award(state: AppState, key: string, amount: number): AppState {
  return state.xp.some((e) => e.key === key)
    ? state
    : {
        ...state,
        xp: [...state.xp, { key, amount, createdAt: new Date().toISOString() }],
      };
}
export const totalXP = (state: AppState) =>
  state.xp.reduce((a, e) => a + e.amount, 0);
export function setTask(
  state: AppState,
  id: string,
  status: Task["status"],
  reflection = "",
) {
  let found: Task | undefined;
  const plans = state.plans.map((p) => ({
    ...p,
    tasks: p.tasks.map((t) => {
      if (t.id !== id) return t;
      found = t;
      return { ...t, status, reflection };
    }),
  }));
  const next = { ...state, plans };
  return status === "completed" && found
    ? award(next, `task:${id}`, found.xp)
    : next;
}
export function saveProject(state: AppState, input: Project) {
  const project = projectSchema.parse(input);
  let next = {
    ...state,
    projects: [project, ...state.projects.filter((p) => p.id !== project.id)],
  };
  if (project.completed)
    next = award(next, `project:${project.id}`, XP.project);
  return next;
}
export function saveCheckin(state: AppState, input: Checkin) {
  const c = checkinSchema.parse(input);
  return {
    ...state,
    checkins: [c, ...state.checkins.filter((x) => x.week !== c.week)],
  };
}
export const demoProfile: Profile = {
  name: "Zahi",
  email: "zahi@usc.edu",
  major: "Economics and Data Science",
  minor: "",
  degree: "Undergraduate",
  standing: "Junior",
  graduation: "2028-05",
  interests: ["Machine learning", "Economic policy"],
  skills: ["Python", "Statistics"],
  goal: "Explore machine learning and build something useful",
  research: false,
  hours: 4,
  experiences: "",
  timezone: "America/Los_Angeles",
  theme: "technology",
  avatar: "cardinal",
  leaderboard: false,
  displayName: "Zahi",
};
export function resumeText(p: Profile, projects: Project[]) {
  return `${p.name}\n${p.email}\n\nEDUCATION\nUniversity of Southern California\n${p.degree} · ${p.major}${p.minor ? " · Minor: " + p.minor : ""}\nExpected graduation: ${p.graduation}\n\nSKILLS (self-reported)\n${p.skills.join(", ")}\n\nEXPERIENCE\n${p.experiences || "Add confirmed experience to your profile."}\n\nPROJECTS\n${projects
    .filter((x) => x.completed)
    .map(
      (x) =>
        `${x.title} · ${x.date}\n${x.description}\n${x.skills.join(", ")}${x.url ? "\n" + x.url : ""}`,
    )
    .join("\n\n")}`;
}

export function localDate(
  date = new Date(),
  timezone = Intl.DateTimeFormat().resolvedOptions().timeZone,
) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  return ["year", "month", "day"]
    .map((t) => parts.find((p) => p.type === t)!.value)
    .join("-");
}

export const appStateSchema = z.object({
  profile: profileSchema.nullable(),
  plans: z.array(
    planSpecSchema
      .omit({ tasks: true })
      .extend({
        id: z.string().uuid(),
        week: z.string(),
        createdAt: z.string(),
        source: z.enum(["demo", "fallback", "gemini"]),
        tasks: z.array(
          taskSpecSchema.extend({
            id: z.string().uuid(),
            status: z.enum([
              "suggested",
              "in progress",
              "completed",
              "skipped",
            ]),
            xp: z.number().int().min(0),
            reflection: z.string(),
          }),
        ),
      }),
  ),
  projects: z.array(projectSchema),
  checkins: z.array(checkinSchema),
  xp: z.array(
    z.object({
      key: z.string(),
      amount: z.number().int().min(0),
      createdAt: z.string(),
    }),
  ),
});
