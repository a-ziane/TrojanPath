import { TaskCard as Quest } from "./teammate/TaskCard";
import { AppShell } from "./teammate/AppShell";
import { PathwayPage } from "./teammate/PathwayPage";
import {
  Button as PathButton,
  Card as PathCard,
  Chip as PathChip,
  PageHeader,
  Progress as PathProgress,
} from "./teammate/ui";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import {
  NavLink,
  Navigate,
  Route,
  Routes,
  useNavigate,
  useLocation,
} from "react-router-dom";
import {
  ArrowUpRight,
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Compass,
  Flame,
  FolderPlus,
  GraduationCap,
  LayoutGrid,
  Leaf,
  LogOut,
  Map,
  Plus,
  RefreshCw,
  Rocket,
  Search,
  Sparkles,
  Star,
  Target,
  Trophy,
  Upload,
  UserRound,
  Users,
  X,
} from "lucide-react";
import {
  demoProfile,
  emptyState,
  localDate,
  nextWeek,
  profileSchema,
  projectSchema,
  resumeText,
  saveCheckin,
  saveProject,
  setTask,
  streak,
  THEMES,
  totalXP,
  weekKey,
  XP,
  type AppState,
  type Checkin,
  type Plan,
  type Profile,
  type Project,
  type Task,
} from "../shared/domain";
import { discipline, makePlan, replaceTask } from "../shared/planner";
import { resources, sampleOpportunities } from "../shared/resources";
import * as repo from "./repository";
import { supabase } from "./supabase";
function ScrollReset() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}
const nav = [
  { path: "/profile", label: "Profile", icon: UserRound },
  { path: "/progress", label: "Progress", icon: LayoutGrid },
  { path: "/plan", label: "Weekly Plan", icon: Map },
  { path: "/opportunities", label: "Opportunities", icon: Compass },
  { path: "/resources", label: "USC Resources", icon: BookOpen },
];
function Avatar({
  color = "cardinal",
  small = false,
}: {
  color?: string;
  small?: boolean;
}) {
  return (
    <svg
      className={`avatar ${small ? "small" : ""}`}
      viewBox="0 0 160 170"
      role="img"
      aria-label="Your illustrated Trojan explorer"
    >
      <path
        d="M26 161q2-56 54-56t54 56"
        fill={
          color === "sage"
            ? "#759889"
            : color === "gold"
              ? "#d5a742"
              : "#9e3543"
        }
      />
      <path d="M58 111l22 27 22-27" fill="#f3d0a9" />
      <ellipse cx="80" cy="70" rx="37" ry="44" fill="#f3d0a9" />
      <path
        d="M42 69q-8-59 39-54 45-2 39 52l-17-25q-20 12-48 4z"
        fill="#382d2b"
      />
      <path d="M48 47q-8-30 20-37l-6 12q26-19 44 3" fill="#382d2b" />
      <circle cx="66" cy="72" r="3" fill="#382d2b" />
      <circle cx="94" cy="72" r="3" fill="#382d2b" />
      <path
        d="M70 89q10 8 20-1"
        stroke="#9e5346"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M63 123l17 16-11 17-16-29m44-4l-17 16 11 17 16-29"
        fill="#fff3dd"
      />
      <path d="M111 142l7-2 4 8-8 3z" fill="#e9c45f" />
    </svg>
  );
}
function Logo() {
  return (
    <div className="logo">
      <span className="brand-mark">
        <Map size={23} />
      </span>
      Trojan<span>Path</span>
    </div>
  );
}
function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  useEffect(() => {
    const old = document.activeElement as HTMLElement;
    const el = document.querySelector<HTMLDivElement>('[role="dialog"]');
    const focusable = () =>
      Array.from(
        el?.querySelectorAll<HTMLElement>(
          "button,input,select,textarea,a[href]",
        ) || [],
      ).filter((x) => !x.hasAttribute("disabled"));
    focusable()[0]?.focus();
    function key(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab") {
        const a = focusable(),
          first = a[0],
          last = a.at(-1);
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    }
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("keydown", key);
      old?.focus();
    };
  }, [onClose]);
  return (
    <div className="modal-backdrop">
      <div className="modal" role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-head">
          <h2>{title}</h2>
          <button
            className="icon-button"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
function Chips({
  values,
  onChange,
  suggestions,
}: {
  values: string[];
  onChange: (x: string[]) => void;
  suggestions: string[];
}) {
  return (
    <>
      <div className="chips">
        {Array.from(new Set([...suggestions, ...values])).map((v) => (
          <button
            type="button"
            key={v}
            className={`chip ${values.includes(v) ? "selected" : ""}`}
            onClick={() =>
              onChange(
                values.includes(v)
                  ? values.filter((x) => x !== v)
                  : [...values, v],
              )
            }
          >
            {values.includes(v) && <Check size={12} />} {v}
          </button>
        ))}
      </div>
      <input
        aria-label="Add a custom interest or skill"
        placeholder="Add your own, then press Enter"
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            const v = e.currentTarget.value.trim();
            if (v && !values.includes(v)) onChange([...values, v]);
            e.currentTarget.value = "";
          }
        }}
      />
    </>
  );
}
function ProfileForm({
  initial,
  onSave,
  busy,
  mode,
}: {
  initial: Profile;
  onSave: (p: Profile) => void;
  busy: boolean;
  mode: "demo" | "live";
}) {
  const [p, setP] = useState(initial),
    [error, setError] = useState(""),
    [uploading, setUploading] = useState(false);
  const update = <K extends keyof Profile>(k: K, v: Profile[K]) =>
    setP((x) => ({ ...x, [k]: v }));
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const r = profileSchema.safeParse(p);
        if (!r.success) {
          setError(r.error.issues[0].message);
          return;
        }
        onSave(r.data);
      }}
      className="form-stack"
    >
      <p className="muted">
        A little about you. A plan that feels like you. You can change
        everything later.
      </p>
      <div className="form-grid">
        <label>
          Name
          <input
            required
            maxLength={100}
            value={p.name}
            onChange={(e) => update("name", e.target.value)}
          />
        </label>
        <label>
          USC email
          <input
            type="email"
            required
            value={p.email}
            onChange={(e) => update("email", e.target.value)}
          />
        </label>
        <label>
          Major
          <input
            required
            value={p.major}
            onChange={(e) => update("major", e.target.value)}
          />
        </label>
        <label>
          Minor · optional
          <input
            value={p.minor}
            onChange={(e) => update("minor", e.target.value)}
          />
        </label>
        <label>
          Degree level
          <select
            value={p.degree}
            onChange={(e) =>
              update("degree", e.target.value as Profile["degree"])
            }
          >
            <option>Undergraduate</option>
            <option>Master’s</option>
            <option>PhD</option>
          </select>
        </label>
        <label>
          Academic standing
          <input
            placeholder="e.g. Junior, Year 2"
            value={p.standing}
            onChange={(e) => update("standing", e.target.value)}
          />
        </label>
        <label>
          Expected graduation
          <input
            type="month"
            required
            value={p.graduation}
            onChange={(e) => update("graduation", e.target.value)}
          />
        </label>
        <label>
          Hours available each week
          <input
            type="number"
            min="0.25"
            max="30"
            step="0.25"
            required
            value={p.hours}
            onChange={(e) => update("hours", Number(e.target.value))}
          />
        </label>
      </div>
      <fieldset>
        <legend>What sparks your curiosity?</legend>
        <Chips
          values={p.interests}
          onChange={(v) => update("interests", v)}
          suggestions={[
            "Machine learning",
            "Economic policy",
            "Healthcare",
            "Research",
            "Design",
            "Film",
            "Writing",
          ]}
        />
      </fieldset>
      <fieldset>
        <legend>Skills you bring · self-reported</legend>
        <Chips
          values={p.skills}
          onChange={(v) => update("skills", v)}
          suggestions={[
            "Python",
            "Statistics",
            "Communication",
            "Biology",
            "Design",
            "Writing",
          ]}
        />
      </fieldset>
      <label>
        Career direction
        <input
          value={p.goal}
          onChange={(e) => update("goal", e.target.value)}
          placeholder="I’m exploring"
        />
        <button
          type="button"
          className="text-button left"
          onClick={() => update("goal", "I’m exploring")}
        >
          I’m exploring — and that’s okay
        </button>
      </label>
      <label className="checkbox">
        <input
          type="checkbox"
          checked={p.research}
          onChange={(e) => update("research", e.target.checked)}
        />
        I’m interested in graduate school or research
      </label>
      <label>
        Prior experience · optional
        <textarea
          value={p.experiences}
          onChange={(e) => update("experiences", e.target.value)}
          placeholder="Only include things you have actually done."
        />
      </label>
      <label>
        Résumé · optional
        <input
          type="file"
          accept=".pdf,.txt"
          disabled={uploading}
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            setUploading(true);
            try {
              update("resumePath", await repo.uploadFile(f, mode));
              setError("");
            } catch (err) {
              setError(String(err));
            } finally {
              setUploading(false);
            }
          }}
        />
        <small>
          {uploading
            ? "Uploading…"
            : p.resumePath
              ? "File attached. Parsing is not enabled; enter confirmed experience above."
              : "PDF or text, up to 2 MB. Stored privately in live mode. Automatic parsing is not enabled."}
        </small>
      </label>
      <div className="form-grid">
        <label>
          Ladder theme
          <select
            value={p.theme}
            onChange={(e) =>
              update("theme", e.target.value as Profile["theme"])
            }
          >
            {THEMES.map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </label>
        <label>
          Avatar outfit
          <select
            value={p.avatar}
            onChange={(e) =>
              update("avatar", e.target.value as Profile["avatar"])
            }
          >
            <option value="cardinal">Cardinal</option>
            <option value="gold">Gold</option>
            <option value="sage">Sage</option>
          </select>
        </label>
        <label>
          Timezone
          <input
            required
            value={p.timezone}
            onChange={(e) => update("timezone", e.target.value)}
          />
        </label>
        <label>
          Leaderboard display name
          <input
            maxLength={40}
            value={p.displayName}
            onChange={(e) => update("displayName", e.target.value)}
          />
        </label>
      </div>
      <label className="checkbox">
        <input
          type="checkbox"
          checked={p.leaderboard}
          onChange={(e) => update("leaderboard", e.target.checked)}
        />
        Opt in to the monthly leaderboard using my display name
      </label>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      <button className="primary" disabled={busy || uploading}>
        {busy ? "Saving your path…" : "Save & build my path"}{" "}
        <ArrowRight size={17} />
      </button>
    </form>
  );
}
export default function App() {
  const [mode, setMode] = useState<"demo" | "live" | null>(null),
    [state, setState] = useState<AppState>(emptyState),
    [ready, setReady] = useState(false),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState(""),
    [error, setError] = useState(""),
    [modal, setModal] = useState<
      "profile" | "project" | "checkin" | "resume" | null
    >(null),
    [editing, setEditing] = useState<Project | null>(null),
    [post, setPost] = useState(""),
    [authMode, setAuthMode] = useState<"login" | "signup">("login"),
    [authEmail, setAuthEmail] = useState(""),
    [authPassword, setAuthPassword] = useState("");
  const navigate = useNavigate();
  useEffect(() => {
    let active = true;
    const init = async () => {
      try {
        if (localStorage.getItem("trojanpath:mode") === "demo") {
          if (active) {
            setState(repo.loadDemo());
            setMode("demo");
          }
        } else if (supabase) {
          const { data } = await supabase.auth.getSession();
          if (data.session && active) {
            setState(await repo.loadLive());
            setMode("live");
          }
        }
      } catch (e) {
        if (active) setError(message(e));
      } finally {
        if (active) setReady(true);
      }
    };
    void init();
    const sub = supabase?.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" && active) {
        setMode(null);
        setState(emptyState());
      }
      if (
        event === "SIGNED_IN" &&
        session &&
        localStorage.getItem("trojanpath:mode") !== "demo"
      ) {
        setTimeout(() => {
          repo
            .loadLive()
            .then((s) => {
              if (active) {
                setState(s);
                setMode("live");
              }
            })
            .catch((e) => setError(message(e)));
        }, 0);
      }
    });
    return () => {
      active = false;
      sub?.data.subscription.unsubscribe();
    };
  }, []);
  function message(e: unknown) {
    return e instanceof Error ? e.message : String(e);
  }
  async function run(fn: () => Promise<void>, success = "") {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await fn();
      if (success) setNotice(success);
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  }
  function commit(next: AppState) {
    repo.persistDemo(next);
    setState(next);
  }
  async function refresh() {
    setState(await repo.loadLive());
  }
  function startDemo() {
    void run(async () => {
      setState(repo.loadDemo());
      setMode("demo");
      localStorage.setItem("trojanpath:mode", "demo");
      navigate("/plan");
    });
  }
  async function saveProfile(p: Profile) {
    await run(async () => {
      if (mode === "demo") {
        let next = { ...state, profile: p };
        if (!next.plans.length)
          next = {
            ...next,
            plans: [makePlan(p, next, weekKey(new Date(), p.timezone))],
          };
        commit(next);
      } else {
        await repo.liveProfile(p);
        await refresh();
        if (!state.plans.length) {
          try {
            await repo.liveGenerate(weekKey(new Date(), p.timezone));
          } catch {
            await repo.liveSaveFallback(
              makePlan(
                p,
                { ...state, profile: p },
                weekKey(new Date(), p.timezone),
                "fallback",
              ),
            );
            setNotice(
              "AI planning is unavailable. A deterministic starter plan is ready.",
            );
          }
          await refresh();
        }
      }
      setModal(null);
      navigate("/plan");
    }, "Your path is saved. Let’s take the first step.");
  }
  async function changeTask(
    t: Task,
    status: Task["status"],
    reflection = t.reflection,
  ) {
    await run(
      async () => {
        if (mode === "demo") commit(setTask(state, t.id, status, reflection));
        else {
          await repo.liveTask(t.id, status, reflection);
          await refresh();
        }
      },
      status === "completed"
        ? `Quest complete! ${t.xp} XP awarded once.`
        : "Quest updated.",
    );
  }
  async function replace(t: Task) {
    await run(async () => {
      if (mode === "demo") commit(replaceTask(state, t.id));
      else {
        await repo.liveGenerate(currentPlan!.week, t.id);
        await refresh();
      }
    }, "A fresh suggestion is ready.");
  }
  const profile = state.profile,
    xp = totalXP(state),
    currentPlan = [...state.plans].sort((a, b) =>
      b.week.localeCompare(a.week),
    )[0];
  if (!ready)
    return (
      <main className="loading">
        <Logo />
        <p>Finding your next step…</p>
      </main>
    );
  return (
    <>
      <ScrollReset />
      {!mode ? (
        <main className="welcome">
          <div className="welcome-art tp-welcome-art">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-[10px] bg-gold font-display text-[15px] font-bold text-cardinal">
                TP
              </span>
              <strong className="font-display text-[23px] text-white">
                Trojan Path
              </strong>
            </div>
            <div>
              <svg
                width="150"
                height="70"
                viewBox="0 0 150 70"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M3 65 C30 65 35 40 65 40 S100 12 140 8"
                  stroke="#ffcc00"
                  strokeWidth="3"
                  strokeDasharray="1 8"
                  strokeLinecap="round"
                />
                <circle cx="142" cy="8" r="6" fill="#ffcc00" />
              </svg>
              <h1 className="mt-8 font-display text-[52px] leading-[1.12] font-bold text-white">
                You don’t need
                <br />
                the whole map.
                <br />
                <span className="text-gold">Just a next step.</span>
              </h1>
              <p className="mt-6 max-w-[360px] text-[18px] text-white/80">
                Turn your interests into a path worth exploring. Built around
                you, grounded in USC.
              </p>
            </div>
            <small className="text-white/70">
              An independent student project · Your pace. Your path.
            </small>
          </div>
          <section className="welcome-form">
            <span className="eyebrow">WELCOME TO TROJANPATH</span>
            <h2>A future that feels like you.</h2>
            <p className="muted">
              Find your direction, build your skills, and make your next move.
              One manageable week at a time.
            </p>
            <button className="secondary large" onClick={startDemo}>
              Try demo <ArrowRight size={18} />
            </button>
            <small className="center">
              No account needed · Sample student · Saved in this browser
            </small>
            <div className="divider">or continue with your account</div>
            <form
              className="form-stack"
              onSubmit={(e) => {
                e.preventDefault();
                void run(async () => {
                  if (!supabase)
                    throw new Error(
                      "Supabase is not configured. Try demo or follow the README.",
                    );
                  if (authMode === "signup") {
                    const { data, error } = await supabase.auth.signUp({
                      email: authEmail,
                      password: authPassword,
                      options: {
                        emailRedirectTo:
                          location.origin + import.meta.env.BASE_URL,
                      },
                    });
                    if (error) throw error;
                    if (!data.session) {
                      setNotice(
                        "Check your email for a confirmation link. Sign in after confirming.",
                      );
                      return;
                    }
                  } else {
                    const { error } = await supabase.auth.signInWithPassword({
                      email: authEmail,
                      password: authPassword,
                    });
                    if (error) throw error;
                  }
                  localStorage.removeItem("trojanpath:mode");
                  setState(await repo.loadLive());
                  setMode("live");
                  navigate("/plan");
                });
              }}
            >
              <label>
                USC email
                <input
                  required
                  type="email"
                  pattern=".+@([a-zA-Z0-9-]+\.)?usc\.edu"
                  placeholder="you@usc.edu"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                />
              </label>
              <label>
                Password
                <input
                  type="password"
                  minLength={8}
                  required
                  autoComplete={
                    authMode === "signup" ? "new-password" : "current-password"
                  }
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                />
              </label>
              <button className="primary" disabled={busy}>
                {busy
                  ? "Connecting…"
                  : authMode === "login"
                    ? "Sign in"
                    : "Create account"}
              </button>
            </form>
            <button
              className="text-button"
              onClick={() =>
                setAuthMode(authMode === "login" ? "signup" : "login")
              }
            >
              {authMode === "login"
                ? "New here? Create an account"
                : "Already have an account? Sign in"}
            </button>
            <p className="fine">
              Email and password sign-in through Supabase, not USC SSO. New
              accounts may need email confirmation according to the project’s
              settings.
            </p>
          </section>
        </main>
      ) : (
        <AppShell
          state={state}
          mode={mode}
          onProfile={() => setModal("profile")}
          onCheckin={() => setModal("checkin")}
          onResume={() => setModal("resume")}
          onLogout={() =>
            void run(async () => {
              if (mode === "live") await supabase?.auth.signOut();
              localStorage.removeItem("trojanpath:mode");
              setMode(null);
              setState(emptyState());
            })
          }
        >
          {!profile ? (
            <section className="onboarding card">
              <div className="section-kicker">
                <Sparkles size={16} />
                LET’S MAKE THIS YOURS
              </div>
              <h1>Every great path starts with you.</h1>
              <ProfileForm
                initial={
                  mode === "demo"
                    ? demoProfile
                    : {
                        ...demoProfile,
                        name: "",
                        email: authEmail,
                        major: "",
                        interests: [],
                        skills: [],
                        goal: "I’m exploring",
                        hours: 3,
                        displayName: "",
                      }
                }
                onSave={saveProfile}
                busy={busy}
                mode={mode}
              />
            </section>
          ) : (
            <Routes>
              <Route
                path="/plan"
                element={
                  <WeeklyPlan
                    profile={profile}
                    plan={currentPlan}
                    plans={state.plans}
                    busy={busy}
                    onTask={changeTask}
                    onReplace={replace}
                    onCheckin={() => setModal("checkin")}
                    onGenerate={() =>
                      void run(async () => {
                        const week = weekKey(new Date(), profile.timezone);
                        if (mode === "demo")
                          commit({
                            ...state,
                            plans: [
                              makePlan(profile, state, week),
                              ...state.plans,
                            ],
                          });
                        else {
                          await repo.liveGenerate(week);
                          await refresh();
                        }
                      })
                    }
                    onFallback={() =>
                      void run(async () => {
                        const week = weekKey(new Date(), profile.timezone);
                        const plan = makePlan(
                          profile,
                          state,
                          week,
                          mode === "demo" ? "demo" : "fallback",
                        );
                        if (mode === "demo")
                          commit({
                            ...state,
                            plans: [plan, ...state.plans],
                          });
                        else {
                          await repo.liveSaveFallback(plan);
                          await refresh();
                        }
                      })
                    }
                    xp={xp}
                    projects={state.projects.length}
                  />
                }
              />
              <Route
                path="/profile"
                element={
                  <ProfilePage
                    profile={profile}
                    state={state}
                    onEdit={() => setModal("profile")}
                    onProject={(p) => {
                      setEditing(p || null);
                      setModal("project");
                    }}
                    onResume={() => setModal("resume")}
                    onPost={(p) =>
                      setPost(
                        `I recently completed ${p.title}.\n\n${p.description}\n\nThis project gave me an opportunity to work with ${p.skills.join(", ") || "new ideas"}. I’m looking forward to building on what I learned.${p.url ? "\n\n" + p.url : ""}\n\n#StudentProjects #LearningByDoing`,
                      )
                    }
                  />
                }
              />
              <Route
                path="/progress"
                element={
                  <PathwayPage
                    state={state}
                    onEdit={() => setModal("profile")}
                  />
                }
              />
              <Route
                path="/opportunities"
                element={<Opportunities state={state} mode={mode} />}
              />
              <Route
                path="/leaderboard"
                element={<Progress state={state} mode={mode} />}
              />
              <Route
                path="/path"
                element={<Navigate to="/progress" replace />}
              />
              <Route path="/week" element={<Navigate to="/plan" replace />} />
              <Route path="/resources" element={<Resources />} />
              <Route path="*" element={<Navigate to="/plan" replace />} />
            </Routes>
          )}
          <footer>
            Made for your next chapter.{" "}
            <span>TrojanPath · An independent student project</span>
            {mode === "demo" && (
              <button onClick={repo.resetDemo}>Reset demo</button>
            )}
          </footer>
        </AppShell>
      )}
      {(error || notice) && (
        <div
          className={`toast ${error ? "toast-error" : ""}`}
          role={error ? "alert" : "status"}
        >
          <span>{error || notice}</span>
          {error && (
            <button
              onClick={() => {
                setError("");
                if (mode === "live") void run(refresh);
              }}
            >
              Retry
            </button>
          )}
          <button
            aria-label="Dismiss message"
            onClick={() => {
              setError("");
              setNotice("");
            }}
          >
            <X size={16} />
          </button>
        </div>
      )}
      {modal === "profile" && profile && (
        <Modal title="Make your path your own" onClose={() => setModal(null)}>
          <ProfileForm
            initial={profile}
            onSave={saveProfile}
            busy={busy}
            mode={mode!}
          />
        </Modal>
      )}
      {modal === "project" && (
        <Modal
          title={
            editing ? "Edit your project" : "A little work. A real achievement."
          }
          onClose={() => setModal(null)}
        >
          <ProjectForm
            initial={editing}
            busy={busy}
            mode={mode!}
            onSave={(p) =>
              void run(async () => {
                if (mode === "demo") commit(saveProject(state, p));
                else {
                  await repo.liveProject(projectSchema.parse(p));
                  await refresh();
                }
                setModal(null);
              }, "Project saved. Completed projects earn 100 XP once, including after edits.")
            }
          />
        </Modal>
      )}
      {modal === "checkin" && profile && (
        <Modal title="Your week, in your words" onClose={() => setModal(null)}>
          <CheckinForm
            state={state}
            busy={busy}
            onSave={(c) =>
              void run(async () => {
                const adjustedProfile = c.goal.trim()
                  ? { ...profile, goal: c.goal }
                  : profile;
                const next = {
                  ...saveCheckin(state, c),
                  profile: adjustedProfile,
                };
                const week = nextWeek(c.week);
                if (mode === "demo") {
                  const existing = state.plans.find((p) => p.week === week);
                  commit({
                    ...next,
                    plans: existing
                      ? next.plans
                      : [
                          makePlan(adjustedProfile, next, week, "demo", c),
                          ...next.plans,
                        ],
                  });
                } else {
                  await repo.liveCheckin(c);
                  if (c.goal.trim()) await repo.liveProfile(adjustedProfile);
                  await refresh();
                  try {
                    await repo.liveGenerate(week);
                  } catch {
                    const existing = state.plans.find((p) => p.week === week);
                    if (!existing)
                      await repo.liveSaveFallback(
                        makePlan(adjustedProfile, next, week, "fallback", c),
                      );
                    setNotice(
                      "Your check-in is saved. AI is unavailable; a deterministic plan is ready.",
                    );
                  }
                  await refresh();
                }
                setModal(null);
                navigate("/plan");
              }, "Check-in saved. One streak credit per calendar week; your next plan is ready.")
            }
          />
        </Modal>
      )}
      {modal === "resume" && profile && (
        <Modal title="Your career materials" onClose={() => setModal(null)}>
          <p className="muted">
            An editable draft built from confirmed profile information. Review
            every line before sharing.
          </p>
          <ResumeEditor
            profile={profile}
            projects={state.projects}
            onSave={(text) =>
              void saveProfile({ ...profile, resumeDraft: text })
            }
          />
        </Modal>
      )}
      {post && (
        <Modal title="Draft LinkedIn post" onClose={() => setPost("")}>
          <p className="muted">
            Review and edit your draft, then copy it. Nothing is published
            automatically.
          </p>
          <textarea
            className="post-editor"
            value={post}
            onChange={(e) => setPost(e.target.value)}
          />
          <button
            className="primary"
            onClick={() =>
              void run(async () => {
                await navigator.clipboard.writeText(post);
              }, "Copied. You decide when and where to share.")
            }
          >
            Copy post
          </button>
        </Modal>
      )}
    </>
  );
}
function WeeklyPlan({
  profile,
  plan,
  plans,
  busy,
  onTask,
  onReplace,
  onCheckin,
  onGenerate,
  onFallback,
  xp,
  projects,
}: {
  profile: Profile;
  plan?: Plan;
  plans: Plan[];
  busy: boolean;
  onTask: (t: Task, s: Task["status"], r?: string) => void;
  onReplace: (t: Task) => void;
  onCheckin: () => void;
  onGenerate: () => void;
  onFallback: () => void;
  xp: number;
  projects: number;
}) {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [plan?.id]);
  const [view, setView] = useState(""),
    [filter, setFilter] = useState("all");
  const selected = plans.find((p) => p.id === view) || plan;
  const complete =
    selected?.tasks.filter((t) => t.status === "completed").length || 0;
  const minutes =
    selected?.tasks.reduce(
      (n, t) => n + (t.status === "skipped" ? 0 : t.minutes),
      0,
    ) || 0;
  return (
    <div className="flex flex-col gap-7">
      <PageHeader
        eyebrow="Your weekly game plan"
        title="This week’s quests"
        subtitle={`A few manageable steps, chosen for you, ${profile.name.split(" ")[0]}.`}
        actions={
          <PathButton variant="secondary" onClick={onCheckin}>
            Start check-in →
          </PathButton>
        }
      />
      <div className="tp-stats-grid">
        <PathCard>
          <p className="text-[13px] text-muted">Quests completed</p>
          <p className="mt-2 font-display text-[30px] font-bold">
            {complete}
            <span className="text-[18px] text-muted">
              {" "}
              / {selected?.tasks.length || 0}
            </span>
          </p>
        </PathCard>
        <PathCard>
          <p className="text-[13px] text-muted">Your level</p>
          <p className="mt-2 font-display text-[30px] font-bold">
            Level {Math.floor(xp / 100) + 1}
          </p>
          <PathProgress value={(xp % 100) / 100} />
          <p className="mt-2 text-[12px] text-muted">
            {xp} XP · {100 - (xp % 100)} to the next level
          </p>
        </PathCard>
        <PathCard>
          <p className="text-[13px] text-muted">Made to fit your week</p>
          <p className="mt-2 font-display text-[30px] font-bold">
            {minutes} <span className="text-[18px] text-muted">minutes</span>
          </p>
          <p className="mt-2 text-[12px] text-muted">
            Your budget: {profile.hours} hours · {projects} projects saved
          </p>
        </PathCard>
      </div>
      <div className="tp-week-grid">
        <section className="min-w-0">
          {selected ? (
            <>
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div className="flex gap-2">
                  {["all", "active", "completed"].map((f) => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      aria-pressed={filter === f}
                      className={`rounded-full px-4 py-2 text-[13px] font-semibold ${filter === f ? "bg-cardinal text-white" : "bg-surface text-muted border border-border"}`}
                    >
                      {f[0].toUpperCase() + f.slice(1)}
                    </button>
                  ))}
                </div>
                <label className="text-[12px] text-muted">
                  Saved week
                  <select
                    aria-label="Saved week"
                    className="ml-2 rounded-lg border border-border bg-surface p-2"
                    value={selected.id}
                    onChange={(e) => setView(e.target.value)}
                  >
                    {[...plans]
                      .sort((a, b) => b.week.localeCompare(a.week))
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          Week of {p.week}
                        </option>
                      ))}
                  </select>
                </label>
              </div>
              <div className="flex flex-col gap-4">
                {selected.tasks
                  .filter(
                    (t) =>
                      filter === "all" ||
                      (filter === "completed"
                        ? t.status === "completed"
                        : !["completed", "skipped"].includes(t.status)),
                  )
                  .map((t, i) => (
                    <Quest
                      key={t.id}
                      task={t}
                      index={i}
                      busy={busy}
                      onStatus={(s) => onTask(t, s)}
                      onReflection={(r) => onTask(t, t.status, r)}
                      onReplace={() => onReplace(t)}
                    />
                  ))}
              </div>
              {filter === "completed" && complete === 0 && (
                <PathCard>
                  <p className="text-muted">
                    Your first win is waiting. Complete a quest when you’re
                    ready.
                  </p>
                </PathCard>
              )}
              <p className="mt-4 text-[12px] text-muted">
                {selected.source === "gemini"
                  ? "Generated with Gemini · Review suggestions before acting"
                  : selected.source === "demo"
                    ? "Demo · Deterministic sample suggestions"
                    : "Fallback plan · Deterministic suggestions; AI unavailable"}
              </p>
            </>
          ) : (
            <PathCard>
              <h2 className="font-display text-[24px] font-bold">
                Your path is ready to begin.
              </h2>
              <div className="mt-4 flex flex-wrap gap-3">
                <PathButton onClick={onGenerate} disabled={busy}>
                  {busy ? "Building your plan…" : "Generate first plan"}
                </PathButton>
                <PathButton
                  variant="secondary"
                  onClick={onFallback}
                  disabled={busy}
                >
                  Use a starter plan
                </PathButton>
              </div>
            </PathCard>
          )}
        </section>
        <aside className="flex flex-col gap-5">
          <div className="rounded-[20px] bg-gold-soft p-6">
            <PathChip tone="goldSolid">✦ Adjusted for you</PathChip>
            <h2 className="mt-4 font-display text-[22px] font-bold">
              A plan that fits your life.
            </h2>
            <p className="mt-3 text-[14px] text-muted">
              {selected?.change ||
                "Tell us about your interests and availability to find your next step."}
            </p>
            <p className="mt-3 text-[13px] text-muted">
              Suggestions, not assignments. Accept, replace, or skip anything.
            </p>
          </div>
          <PathCard>
            <h2 className="font-display text-[20px] font-bold">
              The bigger picture
            </h2>
            <p className="mt-3 text-[14px] text-muted">
              {selected?.direction || profile.goal}
            </p>
            <PathButton variant="secondary" href="/progress" className="mt-5">
              Explore your pathway →
            </PathButton>
          </PathCard>
          <PathCard>
            <h2 className="font-display text-[20px] font-bold">
              Pause. Reflect. Reset.
            </h2>
            <p className="mt-3 text-[14px] text-muted">
              A busy week or a new interest? Your check-in helps shape next
              week.
            </p>
            <PathButton onClick={onCheckin} className="mt-5">
              Check in this week
            </PathButton>
          </PathCard>
        </aside>
      </div>
    </div>
  );
}

function ProjectForm({
  initial,
  busy,
  mode,
  onSave,
}: {
  initial: Project | null;
  busy: boolean;
  mode: "demo" | "live";
  onSave: (p: Project) => void;
}) {
  const [p, setP] = useState<Project>(
      initial || {
        id: crypto.randomUUID(),
        title: "",
        description: "",
        date: localDate(),
        skills: [],
        url: "",
        completed: true,
      },
    ),
    [file, setFile] = useState<File | null>(null),
    [error, setError] = useState(""),
    [uploading, setUploading] = useState(false);
  return (
    <form
      className="form-stack"
      onSubmit={async (e) => {
        e.preventDefault();
        setError("");
        try {
          let next = p;
          projectSchema.parse(next);
          if (file) {
            setUploading(true);
            next = {
              ...p,
              attachment: await repo.uploadFile(file, mode),
              attachmentName: file.name,
            };
          }
          onSave(next);
        } catch (e) {
          setError(e instanceof Error ? e.message : String(e));
        } finally {
          setUploading(false);
        }
      }}
    >
      <label>
        Project title
        <input
          required
          minLength={2}
          value={p.title}
          onChange={(e) => setP({ ...p, title: e.target.value })}
          placeholder="e.g. Predicting housing prices"
        />
      </label>
      <label>
        What did you build or contribute?
        <textarea
          required
          minLength={5}
          value={p.description}
          onChange={(e) => setP({ ...p, description: e.target.value })}
          placeholder="Describe your own work and what you learned."
        />
      </label>
      <div className="form-grid">
        <label>
          Date
          <input
            required
            type="date"
            value={p.date}
            onChange={(e) => setP({ ...p, date: e.target.value })}
          />
        </label>
        <label>
          Skills used · comma-separated
          <input
            value={p.skills.join(", ")}
            onChange={(e) =>
              setP({
                ...p,
                skills: e.target.value.split(",").map((v) => v.trim()),
              })
            }
          />
        </label>
      </div>
      <label>
        Repository or live URL · optional
        <input
          type="url"
          value={p.url}
          placeholder="https://"
          onChange={(e) => setP({ ...p, url: e.target.value })}
        />
      </label>
      <label className="upload-box">
        <Upload size={24} />
        <strong>Add a screenshot or document</strong>
        <small>PDF, PNG, JPG, or text · Up to 2 MB</small>
        <input
          type="file"
          accept=".pdf,.png,.jpg,.jpeg,.txt"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
        {p.attachmentName && <small>Current: {p.attachmentName}</small>}
      </label>
      <label className="checkbox">
        <input
          type="checkbox"
          checked={p.completed}
          onChange={(e) => setP({ ...p, completed: e.target.checked })}
        />
        This project is completed · +{XP.project} XP once
      </label>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      <button className="primary" disabled={busy || uploading}>
        {busy || uploading ? "Saving your work…" : "Save project"}{" "}
        <ArrowRight size={16} />
      </button>
    </form>
  );
}
function CheckinForm({
  state,
  busy,
  onSave,
}: {
  state: AppState;
  busy: boolean;
  onSave: (c: Checkin) => void;
}) {
  const week = weekKey(new Date(), state.profile!.timezone);
  const previous = state.checkins.find((c) => c.week === week);
  const [c, setC] = useState<Checkin>(
    previous || {
      id: crypto.randomUUID(),
      week,
      completed: state.plans.flatMap((p) =>
        p.tasks.filter((t) => t.status === "completed").map((t) => t.id),
      ),
      enjoyed: "",
      disliked: "",
      workload: "manageable",
      goal: "",
      reflection: "",
    },
  );
  const tasks = state.plans
    .filter((p) => p.week <= week)
    .flatMap((p) => p.tasks);
  return (
    <form
      className="form-stack"
      onSubmit={(e) => {
        e.preventDefault();
        onSave(c);
      }}
    >
      <p className="muted">
        Week of {week} · {state.profile!.timezone}
        <br />
        Sunday is a good moment to reflect, but any day works.{" "}
        {previous
          ? "You’re editing this week’s check-in; your streak will not increase again."
          : ""}
      </p>
      <fieldset>
        <legend>What did you complete?</legend>
        {tasks.length ? (
          tasks.map((t) => (
            <label className="checkbox" key={t.id}>
              <input
                type="checkbox"
                checked={c.completed.includes(t.id)}
                onChange={(e) =>
                  setC({
                    ...c,
                    completed: e.target.checked
                      ? [...c.completed, t.id]
                      : c.completed.filter((x) => x !== t.id),
                  })
                }
              />
              {t.title}
            </label>
          ))
        ) : (
          <p>No quests yet. You can still reflect on your week.</p>
        )}
        <small>
          This records your check-in; use Complete on a quest to confirm it and
          earn XP.
        </small>
      </fieldset>
      <label>
        What did you enjoy?
        <textarea
          value={c.enjoyed}
          onChange={(e) => setC({ ...c, enjoyed: e.target.value })}
          placeholder="e.g. I enjoyed building the model."
        />
      </label>
      <label>
        What didn’t feel like a fit?
        <textarea
          value={c.disliked}
          onChange={(e) => setC({ ...c, disliked: e.target.value })}
        />
      </label>
      <label>
        How manageable was the workload?
        <select
          value={c.workload}
          onChange={(e) =>
            setC({ ...c, workload: e.target.value as Checkin["workload"] })
          }
        >
          <option value="manageable">Just right</option>
          <option value="too busy">Too busy — I had limited time</option>
          <option value="ready for more">I have room for more</option>
        </select>
      </label>
      <label>
        Any change in direction?
        <input
          value={c.goal}
          onChange={(e) => setC({ ...c, goal: e.target.value })}
          placeholder="Leave blank to keep your current goal"
        />
      </label>
      <label>
        Anything else you’d like to reflect on?
        <textarea
          value={c.reflection}
          onChange={(e) => setC({ ...c, reflection: e.target.value })}
        />
      </label>
      <button className="primary" disabled={busy}>
        {busy ? "Shaping your next week…" : "Save check-in & shape next week"}
        <ArrowRight size={16} />
      </button>
      <small>
        Next week’s saved plan is preserved when you edit this check-in.
      </small>
    </form>
  );
}
function ProfilePage({
  profile: p,
  state,
  onEdit,
  onProject,
  onResume,
  onPost,
}: {
  profile: Profile;
  state: AppState;
  onEdit: () => void;
  onProject: (p?: Project) => void;
  onResume: () => void;
  onPost: (p: Project) => void;
}) {
  const [fileError, setFileError] = useState("");
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">THE PERSON BEHIND THE PATH</span>
          <h1>A story only you can build.</h1>
          <p>Your interests, your work, your next chapter.</p>
        </div>
        <button className="secondary" onClick={onEdit}>
          Edit profile <UserRound size={16} />
        </button>
      </div>
      <section className="profile-banner card">
        <Avatar color={p.avatar} />
        <div>
          <span className="section-kicker">MEET YOUR FUTURE SELF</span>
          <h2>{p.name}</h2>
          <p>
            {p.major}
            {p.minor ? ` · Minor in ${p.minor}` : ""}
          </p>
          <div className="chips">
            <span className="chip">
              {p.degree} · {p.standing}
            </span>
            <span className="chip">Class of {p.graduation.slice(0, 4)}</span>
          </div>
        </div>
        <button className="secondary" onClick={onResume}>
          Career materials <ArrowUpRight size={16} />
        </button>
      </section>
      <div className="profile-columns">
        <section className="card">
          <h3>What sparks your curiosity</h3>
          <div className="chips">
            {p.interests.length ? (
              p.interests.map((x) => (
                <span key={x} className="chip selected">
                  {x}
                </span>
              ))
            ) : (
              <p>Add an interest to personalize your path.</p>
            )}
          </div>
          <h3>Skills you bring</h3>
          <small>Self-reported · Activities do not imply mastery.</small>
          <div className="chips">
            {p.skills.map((x) => (
              <span key={x} className="chip">
                {x}
              </span>
            ))}
          </div>
        </section>
        <section className="card">
          <h3>Where you’re headed</h3>
          <p>{p.goal || "I’m exploring"}</p>
          <p className="muted">
            {p.hours} hours a week ·{" "}
            {p.research
              ? "Interested in research or graduate school"
              : "Learning by exploring"}
          </p>
          <h3>Your experience</h3>
          <p className="pre-wrap">
            {p.experiences ||
              "Your experience starts somewhere. Add confirmed work, service, or research when you’re ready."}
          </p>
          {p.resumePath && (
            <button
              className="text-button"
              onClick={() =>
                void repo
                  .fileURL(p.resumePath!)
                  .then((url) =>
                    window.open(url, "_blank", "noopener,noreferrer"),
                  )
                  .catch((e) => setFileError(String(e)))
              }
            >
              Open attached résumé <ArrowUpRight size={14} />
            </button>
          )}
        </section>
      </div>
      <div className="section-title">
        <div>
          <span className="section-kicker">PROOF OF YOUR PROGRESS</span>
          <h2>Things you’ve brought to life.</h2>
        </div>
        <button className="primary" onClick={() => onProject()}>
          <Plus size={17} />
          Add project
        </button>
      </div>
      {fileError && (
        <p className="error" role="alert">
          {fileError}
        </p>
      )}
      <div className="project-grid">
        {state.projects.map((p) => (
          <article key={p.id} className="card project-card">
            <div className="project-visual">
              <Rocket size={38} />
              <span>
                {p.completed ? "COMPLETED PROJECT" : "WORK IN PROGRESS"}
              </span>
            </div>
            <div className="project-body">
              <small>{p.date}</small>
              <h3>{p.title}</h3>
              <p>{p.description}</p>
              <div className="chips">
                {p.skills.filter(Boolean).map((s) => (
                  <span className="chip" key={s}>
                    {s}
                  </span>
                ))}
              </div>
              {p.url && (
                <a href={p.url} target="_blank" rel="noreferrer">
                  View project <ArrowUpRight size={14} />
                </a>
              )}
              {p.attachment && (
                <button
                  className="text-button"
                  onClick={() =>
                    void repo
                      .fileURL(p.attachment!)
                      .then((url) =>
                        window.open(url, "_blank", "noopener,noreferrer"),
                      )
                      .catch((e) => setFileError(String(e)))
                  }
                >
                  Open {p.attachmentName || "attachment"}{" "}
                  <ArrowUpRight size={13} />
                </button>
              )}
              <div className="project-actions">
                <button className="text-button" onClick={() => onProject(p)}>
                  Edit project
                </button>
                {p.completed && (
                  <button className="text-button" onClick={() => onPost(p)}>
                    Draft LinkedIn post <ArrowUpRight size={13} />
                  </button>
                )}
              </div>
            </div>
          </article>
        ))}
        {!state.projects.length && (
          <div className="card empty">
            <FolderPlus size={32} />
            <h3>Your first project belongs here.</h3>
            <p>
              A notebook, a performance, a research outline.
              <br />
              Small things count when they’re yours.
            </p>
            <button className="secondary" onClick={() => onProject()}>
              Add your first project
            </button>
          </div>
        )}
      </div>
    </>
  );
}
function ResumeEditor({
  profile,
  projects,
  onSave,
}: {
  profile: Profile;
  projects: Project[];
  onSave: (s: string) => void;
}) {
  const [text, setText] = useState(
    profile.resumeDraft || resumeText(profile, projects),
  );
  const [summary, setSummary] = useState(false);
  return (
    <>
      <label className="checkbox">
        <input
          type="checkbox"
          checked={summary}
          onChange={(e) => setSummary(e.target.checked)}
        />
        Print profile summary instead of résumé draft
      </label>
      {!summary && (
        <textarea
          aria-label="Editable résumé draft"
          className="resume-editor"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      )}
      <div className="print-material">
        <h2>
          {summary ? `${profile.name} · Profile summary` : "Résumé draft"}
        </h2>
        <pre>
          {summary
            ? `${resumeText(profile, projects)}\n\nINTERESTS\n${profile.interests.join(", ")}\n\nDIRECTION\n${profile.goal}`
            : text}
        </pre>
      </div>
      <div className="button-row">
        <button className="secondary" onClick={() => onSave(text)}>
          Save draft
        </button>
        <button className="primary" onClick={() => window.print()}>
          Print / Save as PDF
        </button>
      </div>
      <small>
        Use your browser’s print dialog to save a PDF. Saving a draft does not
        verify its contents.
      </small>
    </>
  );
}
function Progress({ state, mode }: { state: AppState; mode: string }) {
  const p = state.profile!,
    xp = totalXP(state),
    level = Math.floor(xp / XP.level) + 1;
  const now = new Date(),
    month = new Intl.DateTimeFormat("en-CA", {
      timeZone: p.timezone,
      year: "numeric",
      month: "2-digit",
    }).format(now);
  const monthXP = state.xp
    .filter(
      (e) =>
        new Intl.DateTimeFormat("en-CA", {
          timeZone: p.timezone,
          year: "numeric",
          month: "2-digit",
        }).format(new Date(e.createdAt)) === month,
    )
    .reduce((n, e) => n + e.amount, 0);
  const [leaders, setLeaders] = useState<{ name: string; xp: number }[]>([]);
  useEffect(() => {
    if (mode === "live" && supabase)
      void supabase.rpc("monthly_leaderboard").then(({ data }) =>
        setLeaders(
          (data || []).map((r: { display_name: string; xp: number }) => ({
            name: r.display_name,
            xp: r.xp,
          })),
        ),
      );
  }, [mode]);
  const rows =
    mode === "demo"
      ? [
          { name: "Alex · fictional", xp: 420 },
          { name: "Maya · fictional", xp: 310 },
          { name: "Jordan · fictional", xp: 180 },
          ...(p.leaderboard
            ? [{ name: `${p.displayName || p.name} · you`, xp: monthXP }]
            : []),
        ].sort((a, b) => b.xp - a.xp)
      : leaders;
  return (
    <div className="flex flex-col gap-7">
      <PageHeader
        eyebrow="A little friendly momentum"
        title="Monthly leaderboard"
        subtitle={
          mode === "demo"
            ? "Illustrative rankings · Fictional students"
            : "Opt-in students · Display names only"
        }
      />
      <div className="tp-week-grid">
        <PathCard>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-[22px] font-bold">
              This month’s explorers
            </h2>
            <PathChip tone="gold">{month}</PathChip>
          </div>
          {rows.length ? (
            rows.map((r, i) => (
              <div
                key={r.name}
                className="flex items-center gap-4 border-b border-border py-5"
              >
                <span
                  className={`flex size-9 items-center justify-center rounded-full font-bold ${i === 0 ? "bg-gold text-ink" : "bg-bg text-muted"}`}
                >
                  {i + 1}
                </span>
                <strong className="flex-1 text-[15px]">{r.name}</strong>
                <span className="text-[14px] font-semibold text-cardinal">
                  {r.xp} XP
                </span>
              </div>
            ))
          ) : (
            <p className="py-6 text-muted">
              No participants yet. Opt in from your profile if you’d like to
              join.
            </p>
          )}
          <p className="mt-5 text-[13px] text-muted">
            {p.leaderboard
              ? "You’re opted in. Change this in your profile anytime."
              : "You’re not participating. You can opt in from your profile."}
          </p>
          <PathButton variant="secondary" href="/profile" className="mt-4">
            Manage participation
          </PathButton>
        </PathCard>
        <div className="flex flex-col gap-5">
          <PathCard>
            <p className="text-[13px] text-muted">Your month so far</p>
            <h2 className="mt-2 font-display text-[32px] font-bold">
              {monthXP} XP
            </h2>
            <p className="mt-2 text-[14px] text-muted">
              Level {level} · {xp} lifetime XP
            </p>
            <p className="mt-3 text-[13px] text-muted">
              {streak(state.checkins, now, p.timezone)} week check-in streak
            </p>
          </PathCard>
          <PathCard>
            <h2 className="font-display text-[20px] font-bold">
              Your recent wins
            </h2>
            {state.xp
              .slice(-5)
              .reverse()
              .map((e) => (
                <div
                  className="flex items-center justify-between gap-3 border-b border-border py-4 text-[13px]"
                  key={e.key}
                >
                  <span>
                    {e.key.startsWith("project:")
                      ? "Completed project"
                      : "Completed quest"}
                  </span>
                  <strong className="text-success">+{e.amount}</strong>
                </div>
              ))}
            {!state.xp.length && (
              <p className="mt-3 text-[14px] text-muted">
                Your first win is one small step away.
              </p>
            )}
            <p className="mt-4 text-[12px] text-muted">
              Quests earn 10 XP per started 15 minutes. Completed projects earn
              100 XP once.
            </p>
          </PathCard>
        </div>
      </div>
    </div>
  );
}

function Opportunities({ state, mode }: { state: AppState; mode: string }) {
  const [query, setQuery] = useState("");
  const p = state.profile!;
  const skills = [...p.skills, ...state.projects.flatMap((p) => p.skills)],
    track = discipline(p);
  const matches =
    p.interests.length || p.skills.length || state.projects.length
      ? sampleOpportunities
          .filter((o) => o.degrees.includes(p.degree))
          .map((o) => ({
            ...o,
            overlap: o.tags.filter((t) =>
              [...skills, ...p.interests].some((s) =>
                s.toLowerCase().includes(t.toLowerCase()),
              ),
            ),
          }))
          .filter((o) => o.theme === track || o.overlap.length)
          .filter((o) =>
            (o.title + " " + o.tags.join(" "))
              .toLowerCase()
              .includes(query.toLowerCase()),
          )
      : [];
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">OPEN A FEW NEW DOORS</span>
          <h1>See where your strengths can take you.</h1>
          <p>
            Explore possibilities that connect with your interests and work.
          </p>
        </div>
      </div>
      <div className="info-banner">
        <Compass size={21} />
        <div>
          <strong>
            {mode === "demo"
              ? "Sample opportunities · Demo mode"
              : "Illustrative opportunities · Live feed not connected"}
          </strong>
          <p>
            These examples are not live listings. No employer, opening,
            deadline, or placement is implied. Find verified opportunities
            through USC’s Career Center.
          </p>
        </div>
      </div>
      <label className="search-field">
        <Search size={19} />
        <input
          aria-label="Search opportunities"
          placeholder="Search sample opportunities or skills…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </label>
      <div className="opportunity-grid">
        {matches.map((o) => (
          <article className="card opportunity" key={o.id}>
            <div className="section-kicker">
              SAMPLE · {o.kind.toUpperCase()}
            </div>
            <h2>{o.title}</h2>
            <p>{o.description}</p>
            <div className="match-reason">
              <Sparkles size={15} />
              <p>
                {o.overlap.length
                  ? `Connects with your self-reported or project skills: ${o.overlap.join(", ")}.`
                  : `Relevant to your ${p.degree.toLowerCase()} ${track} direction.`}
              </p>
            </div>
            <div className="chips">
              {o.tags.map((t) => (
                <span className="chip" key={t}>
                  {t}
                </span>
              ))}
            </div>
            <a
              className="text-link"
              href="https://careers.usc.edu/"
              target="_blank"
              rel="noreferrer"
            >
              Find current opportunities <ArrowUpRight size={15} />
            </a>
          </article>
        ))}
        {!matches.length && (
          <div className="card empty">
            <Compass size={32} />
            <h3>Let’s find a starting point.</h3>
            <p>
              Add interests, skills, or a project to your profile, or try a
              different search. We won’t invent a match.
            </p>
            <NavLink className="secondary" to="/profile">
              Explore your profile
            </NavLink>
          </div>
        )}
      </div>
    </>
  );
}
function Resources() {
  const [category, setCategory] = useState("All resources");
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">YOU DON’T HAVE TO DO THIS ALONE</span>
          <h1>A campus full of possibility.</h1>
          <p>
            Start with trusted USC resources, then take the next step that fits
            you.
          </p>
        </div>
      </div>
      <div className="resource-intro">
        <GraduationCap size={38} />
        <div>
          <h2>Your Trojan toolkit.</h2>
          <p>
            Official destinations, curated for your next chapter. Program access
            and availability vary; check each site directly.
          </p>
        </div>
      </div>
      <div className="tabs resource-tabs">
        {["All resources", ...new Set(resources.map((r) => r.category))].map(
          (c) => (
            <button
              className={category === c ? "active" : ""}
              key={c}
              onClick={() => setCategory(c)}
            >
              {c}
            </button>
          ),
        )}
      </div>
      <div className="resource-grid">
        {resources
          .filter(
            (r) => category === "All resources" || r.category === category,
          )
          .map((r, i) => (
            <a
              className="card resource-card"
              href={r.url}
              target="_blank"
              rel="noreferrer"
              key={r.id}
            >
              <span className="resource-number">0{i + 1}</span>
              <span className="section-kicker">{r.category.toUpperCase()}</span>
              <h2>
                {r.title}
                <ArrowUpRight size={20} />
              </h2>
              <p>{r.description}</p>
              <span className="verified">
                <CheckCircle2 size={13} />
                Official USC URL · verified Nov 14, 2026
              </span>
            </a>
          ))}
      </div>
      <p className="fine">
        TrojanPath is an independent student project. Inclusion does not imply a
        university partnership or guaranteed access.
      </p>
    </>
  );
}
