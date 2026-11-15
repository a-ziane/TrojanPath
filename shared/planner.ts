import { withDemoHackSC } from "./demoTasks.ts";
import {
  planSpecSchema,
  taskXP,
  type AppState,
  type Profile,
  type Checkin,
  type Plan,
  type TaskSpec,
} from "./domain.ts";
import { resources } from "./resources.ts";
const q = (
  title: string,
  instructions: string,
  why: string,
  minutes: number,
  category: TaskSpec["category"],
  criteria: string,
  resourceIds: string[] = [],
): TaskSpec => ({
  title,
  instructions,
  why,
  minutes,
  category,
  criteria,
  resourceIds,
});
export function discipline(p: Profile) {
  const s = [p.major, p.goal, ...p.interests].join(" ").toLowerCase();
  if (/pre.?med|pre.?dent|medicine|health|dental/.test(s)) return "healthcare";
  if (p.degree === "PhD" || p.research || /research|academi/.test(s))
    return "research";
  if (/film|music|art|design|theat|creative/.test(s)) return "creative arts";
  if (/data|software|comput|machine|engineer|python/.test(s))
    return "technology";
  return "exploration";
}
export function fallbackSpec(p: Profile, state: AppState, feedback?: Checkin) {
  const track = discipline(p),
    build = !!feedback?.enjoyed.match(/build|project|creat|cod|making/i),
    done = new Set(
      state.plans.flatMap((p) =>
        p.tasks.filter((t) => t.status === "completed").map((t) => t.title),
      ),
    );
  const pools: Record<string, TaskSpec[]> = {
    technology: [
      q(
        "Build your first tiny prediction model",
        "Choose a public dataset related to your interests. In a notebook, create a simple baseline prediction, report one evaluation metric, and write down one limitation.",
        `Connect ${p.major} with ${p.interests[0] || "data"} through a small, tangible experiment.`,
        75,
        "projects",
        "Save a notebook with a baseline, one metric, and a limitation.",
      ),
      q(
        "Practice one useful Python skill",
        "Pick an unfamiliar Python data-cleaning technique. Work through a small example and save a before-and-after snippet.",
        "A focused skill session supports your next data project.",
        45,
        "skills",
        "Save a working snippet and explain what it changes.",
      ),
      q(
        "Map a data career to your interests",
        "Compare two real data-focused role descriptions. Note recurring skills and one question to ask a career advisor.",
        "Explore the work before committing to a job title.",
        30,
        "exploration",
        "Write a comparison and one advisor question.",
        ["career"],
      ),
      q(
        "Improve your model with one experiment",
        "If you have a baseline notebook, change a single feature or method and compare results. Otherwise, sketch one experiment you could run after building a baseline. Explain one limitation.",
        "Build on completed work instead of repeating the first exercise.",
        60,
        "projects",
        "Record the changed variable, metric comparison, and a limitation.",
      ),
      q(
        "Tell the story behind your data",
        "Create one clear chart from a dataset and write three sentences explaining what it suggests and what it cannot establish.",
        "Communicate your quantitative work to a broader audience.",
        40,
        "projects",
        "Save a labeled chart and a short interpretation.",
      ),
      q(
        "Explore an internship skill gap",
        "Read a current internship description on a trusted source. Identify one skill you can practice next; verify eligibility yourself.",
        "Turn career exploration into a practical next step.",
        25,
        "exploration",
        "Save the role link and one skill to practice.",
        ["career"],
      ),
    ],
    healthcare: [
      q(
        "Explore a community volunteering route",
        "Use a verified organization website to identify a health-related volunteering program. Read its training and eligibility requirements; do not submit personal information yet.",
        "Build an informed service pathway before making commitments.",
        45,
        "exploration",
        "Record one verified program and its requirements.",
        ["career"],
      ),
      q(
        "Prepare for a shadowing conversation",
        "Write five respectful questions about a clinician’s day-to-day work, then draft an introductory email for your own review.",
        "Understand clinical work through mentorship; access is not guaranteed.",
        30,
        "networking",
        "Save five questions and an unsent outreach draft.",
      ),
      q(
        "Connect research with patient care",
        "Read the abstract of a recent health research paper. Summarize its question, method, and one limitation.",
        "Practice critical reading for a healthcare pathway.",
        45,
        "research",
        "Write a 150-word summary.",
        ["research"],
      ),
      q(
        "Reflect on a healthcare career",
        "Compare patient-facing and research-focused careers. Write what attracts you to each.",
        "Explore your motivations before choosing a route.",
        25,
        "exploration",
        "Record two career options and a next question.",
      ),
    ],
    research: [
      q(
        "Map a focused research question",
        `Choose a question related to ${p.major}. Read two paper abstracts and write how their approaches differ.`,
        "Build a foundation for research exploration at your degree level.",
        60,
        "research",
        "Save two citations and a specific question.",
        ["research"],
      ),
      q(
        "Explore faculty research fit",
        "Use official faculty pages to identify two researchers whose work overlaps your question. Record evidence of fit; do not assume openings.",
        "Make faculty exploration specific and grounded.",
        40,
        "research",
        "Save two official faculty links with a reason for each.",
        ["research"],
      ),
      q(
        "Draft a research introduction",
        "Write a short introduction describing your confirmed background, question, and interest in learning more. Review it before any outreach.",
        "Prepare a thoughtful mentor conversation.",
        30,
        "networking",
        "Save a concise unsent introduction.",
        ["graduate"],
      ),
      q(
        "Outline a small research proposal",
        "Write a question, possible method, resources needed, and a limitation.",
        "Move from reading to a feasible research direction.",
        45,
        "research",
        "Save a one-page proposal outline.",
      ),
    ],
    "creative arts": [
      q(
        "Create a small portfolio piece",
        "Choose a brief inspired by your interests. Make a short sketch, scene, performance study, or design and document your process.",
        "Build evidence of your creative practice.",
        75,
        "projects",
        "Save a draft and three process notes.",
      ),
      q(
        "Find your creative community",
        "Explore two relevant student communities on EngageSC. Verify current activity and note how you could participate.",
        "Connect your practice with people who share your interests.",
        25,
        "networking",
        "Record two groups and one question.",
        ["engage"],
      ),
      q(
        "Curate a portfolio story",
        "Select one piece and write a short description of the brief, your role, and your choices.",
        "Communicate the intent behind your work.",
        40,
        "projects",
        "Save a portfolio description with your confirmed contribution.",
      ),
      q(
        "Revise a creative study",
        "Revisit an existing piece and make one deliberate change. Record the feedback or observation that informed it.",
        "Turn practice into a visible iteration.",
        45,
        "projects",
        "Save before-and-after versions and a reflection.",
      ),
    ],
    exploration: [
      q(
        "Explore two possible futures",
        "Choose two fields that spark your curiosity. Read about a typical day in each and list what energizes or concerns you.",
        "Exploration is a valid direction when your goal is still taking shape.",
        30,
        "exploration",
        "Compare two fields in a short note.",
        ["career"],
      ),
      q(
        "Try a low-stakes mini project",
        `Make a small artifact related to ${p.interests[0] || p.major}: a short analysis, sketch, or explainer.`,
        "Learn your preferences by doing something small.",
        45,
        "projects",
        "Save an artifact and reflect on what you enjoyed.",
      ),
      q(
        "Prepare a career conversation",
        "Write three questions for a career advisor about how your interests connect to possible paths.",
        "An advisor can help you evaluate your options.",
        20,
        "networking",
        "Save three questions.",
        ["career"],
      ),
      q(
        "Reflect on your strengths",
        "Review a recent class activity. Note two tasks you enjoyed and one you would rather avoid.",
        "Use real experience to narrow your next experiment.",
        20,
        "exploration",
        "Write a short strengths reflection.",
      ),
    ],
  };
  let available = pools[track].filter((t) => !done.has(t.title));
  const disliked = feedback?.disliked.toLowerCase() || "";
  const avoided = available.filter((t) => !disliked.includes(t.category));
  if (avoided.length) available = avoided;
  if (build)
    available.sort(
      (a, b) =>
        Number(b.category === "projects") - Number(a.category === "projects"),
    );
  if (!available.length)
    available = [
      q(
        `Extend your ${track === "exploration" ? "career" : track} experiment · ${state.plans.length + 1}`,
        "Review your latest work. Choose a new question or constraint, make one deliberate improvement, and document what you learned.",
        "Continue from your own history with a new, scoped iteration.",
        30,
        "projects",
        "Save one improvement and a new reflection.",
      ),
    ];
  const budget = Math.floor(
    p.hours * 60 * (feedback?.workload === "too busy" ? 0.5 : 1),
  );
  let remaining = budget;
  const tasks: TaskSpec[] = [];
  for (const t of available) {
    if (tasks.length >= 4 || remaining < 5) break;
    const minutes = Math.min(t.minutes, remaining);
    if (minutes < 15 && tasks.length) break;
    tasks.push(
      minutes < t.minutes
        ? {
            ...t,
            minutes,
            instructions: `Spend ${minutes} minutes on the first step: ${t.instructions} Stop at the time limit and save a short note on where to continue.`,
            criteria:
              "Save a short first-step note; a finished artifact is not required.",
          }
        : t,
    );
    remaining -= minutes;
  }
  return planSpecSchema.parse({
    direction: `${p.name}, let’s explore ${track === "technology" ? "machine learning and data through practical work" : track === "exploration" ? "the paths that fit your interests" : track} alongside your ${p.major} background. ${p.degree === "PhD" ? "Focus on research depth and an independent contribution." : "Small, concrete steps will help you discover what fits."}`,
    change: feedback
      ? (feedback.workload === "too busy"
          ? "You asked for breathing room, so this plan uses at most half your available time. "
          : "Your check-in helped shape this next step. ") +
        (build ? "Hands-on building comes first. " : "") +
        "Completed suggestions are excluded."
      : "Your first plan starts with a small experiment, a useful skill, and room to explore.",
    milestones:
      track === "research"
        ? [
            "Frame your question",
            "Build research experience",
            "Prepare your academic direction",
          ]
        : track === "healthcare"
          ? [
              "Explore care & service",
              "Build meaningful experience",
              "Prepare your next application",
            ]
          : track === "creative arts"
            ? [
                "Find your creative voice",
                "Build a portfolio",
                "Share your work",
              ]
            : [
                "Explore your direction",
                "Build something real",
                "Show your strengths",
                "Take your next step",
              ],
    tasks,
  });
}
export function validatePlan(
  input: unknown,
  p: Profile,
  state: AppState,
  feedback?: Checkin,
) {
  const spec = planSpecSchema.parse(input);
  const budget = Math.floor(
    p.hours * 60 * (feedback?.workload === "too busy" ? 0.5 : 1),
  );
  if (spec.tasks.reduce((n, t) => n + t.minutes, 0) > budget)
    throw new Error("Plan exceeds time budget");
  const completed = new Set(
    state.plans.flatMap((p) =>
      p.tasks
        .filter((t) => t.status === "completed")
        .map((t) => t.title.toLowerCase()),
    ),
  );
  for (const t of spec.tasks) {
    if (completed.has(t.title.toLowerCase()))
      throw new Error("Plan repeats completed task");
    if (t.resourceIds.some((id) => !resources.some((r) => r.id === id)))
      throw new Error("Unknown resource");
  }
  return spec;
}
export function makePlan(
  p: Profile,
  state: AppState,
  week: string,
  source: Plan["source"] = "demo",
  feedback?: Checkin,
  spec = fallbackSpec(p, state, feedback),
): Plan {
  const plan: Plan = {
    ...validatePlan(spec, p, state, feedback),
    id: crypto.randomUUID(),
    week,
    createdAt: new Date().toISOString(),
    source,
    tasks: spec.tasks.map((t) => ({
      ...t,
      id: crypto.randomUUID(),
      status: "suggested",
      xp: taskXP(t.minutes),
      reflection: "",
    })),
  };
  return withDemoHackSC(plan, state);
}
export function replaceTask(state: AppState, id: string): AppState {
  const plan = state.plans.find((p) => p.tasks.some((t) => t.id === id));
  if (!plan || !state.profile) return state;
  const old = plan.tasks.find((t) => t.id === id)!;
  const pool = fallbackSpec(state.profile, state).tasks;
  const spec = pool.find(
    (t) => !plan.tasks.some((x) => x.title === t.title),
  ) || {
    ...old,
    title: "Reflect and choose a different next step",
    instructions:
      "Write down what did not fit this suggestion. Choose a different small activity in the same area and describe your first step.",
    criteria: "Save your alternative activity and a first-step note.",
    category: "exploration" as const,
  };
  const minutes = Math.min(old.minutes, spec.minutes);
  return {
    ...state,
    plans: state.plans.map((p) =>
      p.id === plan.id
        ? {
            ...p,
            tasks: [
              ...p.tasks.filter((t) => t.id !== id),
              {
                ...spec,
                id: crypto.randomUUID(),
                minutes,
                xp: taskXP(minutes),
                status: "suggested",
                reflection: "",
              },
            ],
          }
        : p,
    ),
  };
}
