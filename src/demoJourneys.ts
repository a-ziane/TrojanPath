import { z } from "zod";
import {
  appStateSchema,
  profileSchema,
  projectSchema,
  demoProfile,
  emptyState,
  localDate,
  saveProject,
  setTask,
  taskXP,
  weekKey,
  type AppState,
  type Plan,
  type Profile,
  type Project,
  type TaskSpec,
} from "../shared/domain";
export type DemoJourney = "new" | "four-weeks";
export const DEMO_SELECTION_KEY = "trojanpath:demo:journey";
export const demoStorageKey = (journey: DemoJourney) =>
  `trojanpath:demo:journey:${journey}:v1`;
export function selectedDemo(): DemoJourney {
  return localStorage.getItem(DEMO_SELECTION_KEY) === "four-weeks"
    ? "four-weeks"
    : "new";
}
export const zahiExample: Profile = {
  ...demoProfile,
  interests: ["Machine learning", "Economics", "Data analysis"],
  skills: ["Foundational Python", "Basic statistics", "Beginner pandas"],
  goal: "Explore how to combine economics and data science; still deciding on a specific role.",
};
export function exampleProject(date = localDate()): Project {
  return {
    id: crypto.randomUUID(),
    title: "Household spending analysis — sample project",
    description:
      "Illustrative project: explore a public economics dataset and compare spending patterns. Still working on cleaning the data.",
    date,
    skills: ["Python", "pandas"],
    url: "",
    completed: false,
  };
}
const activity = (
  title: string,
  minutes: number,
  category: TaskSpec["category"],
  instructions: string,
  resourceIds: string[] = [],
): TaskSpec => ({
  title,
  minutes,
  category,
  instructions,
  resourceIds,
  why: "A small example activity connects economics, data analysis, and gradual learning.",
  criteria: "Save your work and a brief reflection on what you learned.",
});
function plan(
  week: string,
  direction: string,
  change: string,
  tasks: TaskSpec[],
): Plan {
  return {
    id: crypto.randomUUID(),
    week,
    createdAt: `${week}T12:00:00Z`,
    source: "demo",
    direction,
    change,
    milestones: [
      "Explore economic data",
      "Finish a small analysis",
      "Discuss possible next directions",
    ],
    tasks: tasks.map((t) => ({
      ...t,
      id: crypto.randomUUID(),
      status: "suggested",
      reflection: "",
      xp: taskXP(t.minutes),
    })),
  };
}
export function firstDemoPlan(
  profile: Profile,
  week = weekKey(new Date(), profile.timezone),
): Plan {
  const budget = Math.floor(profile.hours * 60);
  const tasks = [
    activity(
      "Explore a small economics dataset",
      60,
      "exploration",
      "Choose a public economics dataset. Identify its variables, write one question, and summarize a simple comparison.",
    ),
    activity(
      "Try an introductory ML example",
      60,
      "skills",
      "Walk through a small introductory prediction example. Focus on the train/test split and write down one confusing step.",
    ),
    activity(
      "Explore USC career advising resources",
      30,
      "exploration",
      "Read the USC Career Center advising information and note two questions about combining economics and data science. No appointment is assumed.",
      ["career"],
    ),
  ].filter(
    (t, _, all) =>
      all.slice(0, all.indexOf(t) + 1).reduce((n, t) => n + t.minutes, 0) <=
      budget,
  );
  if (!tasks.length)
    tasks.push(
      activity(
        "Write one economics-data question",
        Math.min(15, budget),
        "exploration",
        "Write one question connecting economics and data. Note what information you would need.",
        ["career"],
      ),
    );
  return plan(
    week,
    `Example plan: explore economics and data science at your pace. ${profile.goal}`,
    "Example plan — deterministic sample data; no live AI request.",
    tasks,
  );
}
const adaptationSchema = z.object({
  label: z.string(),
  before: z.string(),
  after: z.string(),
  why: z.string(),
  week: z.string(),
});
const snapshotSchema = z.object({
  state: appStateSchema,
  adaptations: z.array(adaptationSchema),
  draft: z
    .object({
      profile: profileSchema.extend({
        name: z.string(),
        major: z.string(),
        graduation: z.string(),
        hours: z
          .number()
          .nullable()
          .transform((value) => value ?? 4),
      }),
      projects: z.array(
        projectSchema.extend({
          title: z.string(),
          description: z.string(),
          url: z.string(),
        }),
      ),
    })
    .optional(),
});
export type DemoAdaptation = z.infer<typeof adaptationSchema>;
export type DemoSnapshot = z.infer<typeof snapshotSchema>;
function shiftWeek(week: string, offset: number) {
  const d = new Date(`${week}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + offset * 7);
  return d.toISOString().slice(0, 10);
}
export function seedDemo(journey: DemoJourney, now = new Date()): DemoSnapshot {
  if (journey === "new") return { state: emptyState(), adaptations: [] };
  const current = weekKey(now, zahiExample.timezone),
    weeks = [-3, -2, -1, 0].map((n) => shiftWeek(current, n));
  const plans = [
    firstDemoPlan(zahiExample, weeks[0]),
    plan(
      weeks[1],
      "Explore economics-focused analysis while keeping ML open as an option.",
      "Your first reflection favored interpreting economic data; try smaller Python/pandas steps.",
      [
        activity(
          "Practice selecting and grouping rows in pandas",
          45,
          "skills",
          "Use a short example table to practice selecting rows and grouping a numeric column.",
        ),
        activity(
          "Interpret a household spending comparison",
          60,
          "projects",
          "Create one comparison chart and explain what it shows and one limitation.",
        ),
        activity(
          "Review one model-training concept slowly",
          30,
          "skills",
          "Revisit one confusing train/test concept without training a new model.",
        ),
      ],
    ),
    plan(
      weeks[2],
      "Finish one small economics analysis instead of starting several activities.",
      "You reported being too busy. This example week is reduced to two hours.",
      [
        activity(
          "Finish the spending comparison chart",
          75,
          "projects",
          "Clean the chart labels and check the calculation in your existing analysis.",
        ),
        activity(
          "Document findings and limitations",
          45,
          "projects",
          "Write a short explanation of your chart, data limitations, and one follow-up question.",
        ),
      ],
    ),
    plan(
      weeks[3],
      "Continue exploring economic/data analysis; ML remains an option to revisit.",
      "Keep a two-hour week and one small project at a time.",
      [
        activity(
          "Add one manageable comparison to your analysis",
          75,
          "projects",
          "Compare one additional category in your existing analysis. Save the chart and explain what changed.",
        ),
        activity(
          "Prepare for a Career Center advising conversation",
          45,
          "exploration",
          "Use the USC Career Center resource to review advising options. Prepare questions about economics/data roles and your sample project; no contact or booking is assumed.",
          ["career"],
        ),
      ],
    ),
  ];
  let state: AppState = {
    ...emptyState(),
    profile: {
      ...zahiExample,
      hours: 2,
      goal: "Explore economics-focused data analysis while keeping machine learning open as an option.",
      skillContext: {
        "Foundational Python": "Practiced small data-cleaning examples.",
        "Basic statistics":
          "Used descriptive comparisons; still learning how to interpret limitations.",
        "Beginner pandas":
          "Practiced selecting and grouping rows in sample data.",
      },
    },
    plans,
  };
  const reflections = [
    [
      "I enjoyed interpreting economic data and want to explore it further.",
      "Model training was difficult; I would like to try it again in smaller steps.",
    ],
    [
      "Small pandas exercises helped me follow the analysis.",
      "Interpreting the spending chart was interesting.",
    ],
    [
      "Finished one labeled spending comparison chart.",
      "Documented illustrative findings and limitations; no causal claims.",
    ],
  ];
  for (let w = 0; w < 3; w++)
    for (let t = 0; t < 2; t++) {
      state = setTask(
        state,
        plans[w].tasks[t].id,
        "completed",
        reflections[w][t],
      );
      state.xp = state.xp.map((e) =>
        e.key === `task:${plans[w].tasks[t].id}`
          ? { ...e, createdAt: `${weeks[w]}T18:00:00Z` }
          : e,
      );
    }
  const feedback = [
    {
      enjoyed: reflections[0][0],
      disliked: reflections[0][1],
      workload: "manageable" as const,
      reflection:
        "I am still exploring; difficulty with model training does not rule out ML.",
    },
    {
      enjoyed:
        "I enjoyed interpreting economic data and smaller pandas practice.",
      disliked: "Four hours was difficult to manage alongside classes.",
      workload: "too busy" as const,
      reflection:
        "I would prefer a two-hour week and one smaller project at a time.",
    },
    {
      enjoyed: "Finishing one small analysis felt manageable.",
      disliked: "Starting multiple new projects would be too much.",
      workload: "manageable" as const,
      reflection:
        "Continue with economics-focused analysis and prepare questions for an advisor.",
    },
  ];
  state.checkins = feedback.map((f, i) => ({
    id: crypto.randomUUID(),
    week: weeks[i],
    completed: state.plans[i].tasks
      .filter((t) => t.status === "completed")
      .map((t) => t.id),
    confirmed: state.plans[i].tasks
      .filter((t) => t.status === "completed")
      .map((t) => t.id),
    goal: "Continue exploring economics/data analysis; ML is still an option.",
    ...f,
  }));
  state = saveProject(state, {
    ...exampleProject(weeks[2]),
    completed: true,
    description:
      "Illustrative sample project: used a small economics dataset to create a household-spending comparison chart and explain one limitation. This is sample evidence for the demo, not an actual student result.",
  });
  state.xp = state.xp.map((e) =>
    e.key.startsWith("project:")
      ? { ...e, createdAt: `${weeks[2]}T18:00:00Z` }
      : e,
  );
  return {
    state,
    adaptations: [
      {
        label: "Focus",
        before: "Broad ML exploration",
        after: "More economics-focused data analysis",
        why: feedback[0].enjoyed,
        week: weeks[0],
      },
      {
        label: "Workload",
        before: "4 hours/week",
        after: "2 hours/week",
        why: feedback[1].disliked,
        week: weeks[1],
      },
      {
        label: "Project approach",
        before: "Several exploratory activities",
        after: "One smaller project at a time",
        why: feedback[1].reflection,
        week: weeks[1],
      },
    ],
  };
}
export function loadJourney(journey = selectedDemo()): DemoSnapshot {
  const raw = localStorage.getItem(demoStorageKey(journey));
  if (raw) return snapshotSchema.parse(JSON.parse(raw));
  const snapshot = seedDemo(journey);
  localStorage.setItem(demoStorageKey(journey), JSON.stringify(snapshot));
  return snapshot;
}
export function selectJourney(
  journey: DemoJourney,
  reset = false,
): DemoSnapshot {
  if (reset) localStorage.removeItem(demoStorageKey(journey));
  const snapshot = loadJourney(journey);
  localStorage.setItem(DEMO_SELECTION_KEY, journey);
  return snapshot;
}
export function persistJourney(state: AppState) {
  const snapshot = loadJourney();
  localStorage.setItem(
    demoStorageKey(selectedDemo()),
    JSON.stringify({ ...snapshot, state }),
  );
}

export function saveDemoDraft(profile: Profile, projects: Project[]) {
  const snapshot = loadJourney();
  localStorage.setItem(
    demoStorageKey(selectedDemo()),
    JSON.stringify({ ...snapshot, draft: { profile, projects } }),
  );
}
