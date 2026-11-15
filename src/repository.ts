import { withDemoHackSC } from "../shared/demoTasks";
import { supabase } from "./supabase";
import {
  emptyState,
  appStateSchema,
  profileSchema,
  type AppState,
  type Profile,
  type Project,
  type Task,
  type Checkin,
  type Plan,
  type XPEvent,
} from "../shared/domain";
const KEY = "trojanpath:demo:v1";
export function loadDemo(): AppState {
  const raw = localStorage.getItem(KEY);
  if (!raw) return emptyState();
  try {
    const state = appStateSchema.parse(JSON.parse(raw));
    const latest = [...state.plans].sort((a, b) =>
      b.week.localeCompare(a.week),
    )[0];
    if (latest) {
      const upgraded = withDemoHackSC(latest, state);
      if (upgraded !== latest) {
        state.plans = state.plans.map((p) =>
          p.id === latest.id ? upgraded : p,
        );
        persistDemo(state);
      }
    }
    return state;
  } catch {
    throw new Error(
      "The saved demo could not be read. Use Reset demo to start again.",
    );
  }
}
export function persistDemo(s: AppState) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    throw new Error(
      "Browser storage is full. Remove a large attachment or use a smaller file. Your latest change was not saved.",
    );
  }
}
export const resetDemo = () => {
  localStorage.removeItem(KEY);
  location.reload();
};
function client() {
  if (!supabase)
    throw new Error(
      "Live accounts need Supabase configuration. Try demo to explore.",
    );
  return supabase;
}
export async function loadLive(): Promise<AppState> {
  const c = client();
  const results = await Promise.all(
    [
      "profiles",
      "weekly_plans",
      "tasks",
      "projects",
      "check_ins",
      "xp_events",
    ].map((table) => c.from(table).select("*")),
  );
  for (const r of results) if (r.error) throw new Error(r.error.message);
  const [profiles, plans, tasks, projects, checkins, xp] = results.map(
    (r) => r.data || [],
  );
  return {
    profile: profiles[0]?.data || null,
    plans: plans
      .map((p) => ({
        ...p.data,
        id: p.id,
        week: p.week,
        createdAt: p.created_at,
        source: p.source,
        tasks: tasks
          .filter((t) => t.plan_id === p.id)
          .map((t) => ({
            ...t.data,
            id: t.id,
            status: t.status,
            xp: t.xp,
            reflection: t.reflection,
          })),
      }))
      .sort((a, b) => b.week.localeCompare(a.week)),
    projects: projects.map((p) => ({ ...p.data, id: p.id })),
    checkins: checkins.map((c) => ({ ...c.data, id: c.id, week: c.week })),
    xp: xp.map((x) => ({
      key: x.event_key,
      amount: x.amount,
      createdAt: x.created_at,
    })) as XPEvent[],
  };
}
async function uid() {
  const { data, error } = await client().auth.getUser();
  if (error || !data.user) throw new Error("Please sign in again.");
  return data.user.id;
}
async function checked(p: PromiseLike<{ error: { message: string } | null }>) {
  const { error } = await p;
  if (error) throw new Error(error.message);
}
export async function liveProfile(p: Profile) {
  await checked(
    client()
      .from("profiles")
      .upsert({ user_id: await uid(), data: profileSchema.parse(p) }),
  );
}
export async function liveProject(p: Project) {
  await checked(
    client()
      .from("projects")
      .upsert({ id: p.id, user_id: await uid(), data: p }),
  );
}
export async function liveTask(
  id: string,
  status: Task["status"],
  reflection: string,
) {
  await checked(
    client().from("tasks").update({ status, reflection }).eq("id", id),
  );
}
export async function liveCheckin(c: Checkin) {
  await checked(
    client()
      .from("check_ins")
      .upsert(
        { user_id: await uid(), week: c.week, data: c },
        { onConflict: "user_id,week" },
      ),
  );
}
export async function liveGenerate(
  week: string,
  replaceId?: string,
): Promise<void> {
  const { data, error } = await client().functions.invoke("generate-plan", {
    body: { week, replaceId },
    signal: AbortSignal.timeout(30000),
  });
  if (error)
    throw new Error(
      "Planning request failed. Your saved plan is safe. Please retry.",
    );
  if (data?.error) throw new Error(data.error);
}
export async function liveSaveFallback(plan: Plan) {
  await checked(client().rpc("save_plan", { payload: plan }));
}
export async function uploadFile(
  file: File,
  mode: "demo" | "live",
): Promise<string> {
  if (
    !["application/pdf", "image/png", "image/jpeg", "text/plain"].includes(
      file.type,
    ) ||
    file.size > 2 * 1024 * 1024
  )
    throw new Error("Choose a PDF, PNG, JPG, or text file smaller than 2 MB.");
  if (mode === "demo")
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result));
      r.onerror = () => reject(new Error("Could not read file"));
      r.readAsDataURL(file);
    });
  const form = new FormData();
  form.append("file", file);
  const { data, error } = await client().functions.invoke("upload-file", {
    body: form,
  });
  if (error || data?.error)
    throw new Error(data?.error || "Upload failed. Try again.");
  return data.path;
}
export async function fileURL(path: string) {
  if (path.startsWith("data:")) return path;
  const { data, error } = await client()
    .storage.from("student-files")
    .createSignedUrl(path, 60);
  if (error) throw error;
  return data.signedUrl;
}

export async function askSkillQuestion(skill: string): Promise<string> {
  const { data, error } = await client().functions.invoke("skill-context", {
    body: { skill },
  });
  if (error || typeof data?.question !== "string")
    throw new Error("Question unavailable");
  return data.question;
}
