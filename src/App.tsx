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
          <div className="welcome-art">
            <Logo />
            <span className="eyebrow light">YOUR NEXT CHAPTER STARTS HERE</span>
            <h1>
              Big dreams.
              <br />
              Small steps.
              <br />
              <em>Your path.</em>
            </h1>
            <p>Turn your goals into your game plan.</p>
            <div className="welcome-illustration">
              <div className="orbit one" />
              <div className="orbit two" />
              <Avatar />
              <span className="floating-star">✦</span>
              <span className="floating-card">
                <Sparkles size={18} /> A little progress, every week.
              </span>
            </div>
            <small>
              Built for USC students. An independent student project.
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
        <div className="app-shell">
          <aside className="sidebar">
            <NavLink to="/plan" aria-label="TrojanPath home">
              <Logo />
            </NavLink>
            <div className="workspace-label">YOUR PERSONAL GAME PLAN</div>
            <nav>
              {nav.map((n) => (
                <NavLink
                  key={n.path}
                  to={n.path}
                  className={({ isActive }) =>
                    isActive ? "nav-item active" : "nav-item"
                  }
                >
                  <n.icon size={20} />
                  <span>{n.label}</span>
                  {n.path === "/plan" && <span className="nav-dot" />}
                </NavLink>
              ))}
              <div className="nav-item disabled">
                <Users size={20} />
                <span>Connect</span>
                <small>Coming soon</small>
              </div>
            </nav>
            <div className="sidebar-note">
              <span className="mini-star">✦</span>
              <h4>Your pace. Your path.</h4>
              <p>You don’t need to have it all figured out to move forward.</p>
            </div>
            <button className="account" onClick={() => setModal("profile")}>
              <Avatar small color={profile?.avatar} />
              <span>
                <strong>{profile?.name || "Your profile"}</strong>
                <small>{profile?.degree || "Let’s get started"}</small>
              </span>
              <ChevronRight size={15} />
            </button>
            <button
              className="logout"
              onClick={() =>
                void run(async () => {
                  if (mode === "live") await supabase?.auth.signOut();
                  localStorage.removeItem("trojanpath:mode");
                  setMode(null);
                  setState(emptyState());
                })
              }
            >
              <LogOut size={14} /> {mode === "demo" ? "Exit demo" : "Sign out"}
            </button>
          </aside>
          <div className="main-shell">
            <header className="topbar">
              <div>
                <span className="breadcrumb">Your workspace</span>
                <ChevronRight size={13} />
                <strong>
                  {nav.find((n) => location.hash.includes(n.path))?.label ||
                    "Weekly Plan"}
                </strong>
              </div>
              <div className="top-actions">
                <span className={`mode-badge ${mode === "demo" ? "demo" : ""}`}>
                  {mode === "demo" ? "DEMO MODE" : "LIVE ACCOUNT"}
                </span>
                <span className="top-streak">
                  <Flame size={16} />
                  {streak(state.checkins, new Date(), profile?.timezone)} week
                  streak
                </span>
                <Avatar small color={profile?.avatar} />
              </div>
            </header>
            <main className="main-content">
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
                    element={<Progress state={state} mode={mode} />}
                  />
                  <Route
                    path="/opportunities"
                    element={<Opportunities state={state} mode={mode} />}
                  />
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
            </main>
          </div>
        </div>
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
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">SMALL STEPS. REAL MOMENTUM.</span>
          <h1>
            Your next chapter, {profile.name}
            <span className="gold-text">.</span>
          </h1>
          <p>A little direction. A few doable steps. A future that’s yours.</p>
        </div>
        <button className="secondary" onClick={onCheckin}>
          <Leaf size={17} /> Weekly check-in
        </button>
      </div>
      <section className="hero">
        <div className="hero-copy">
          <span className="hero-label">
            <span /> YOUR PATH IS TAKING SHAPE
          </span>
          <h2>
            You don’t need the whole map.
            <br />
            Just your next <em>good step.</em>
          </h2>
          <p>
            {selected?.direction ||
              "Let’s turn your interests into a manageable first week."}
          </p>
          <div className="hero-tags">
            <span>
              <Target size={14} />
              {discipline(profile) === "technology"
                ? "Data & machine learning"
                : discipline(profile)}
            </span>
            <span>
              <Clock3 size={14} />
              {profile.hours} hrs / week
            </span>
          </div>
        </div>
        <div className="hero-art">
          <div className="art-circle" />
          <div className="stair s1" />
          <div className="stair s2" />
          <div className="stair s3" />
          <Avatar color={profile.avatar} />
          <Star className="art-star" size={30} />
          <span className="art-spark">✧</span>
          <span className="art-plant">✦</span>
        </div>
      </section>
      <div className="stat-grid">
        <div className="stat">
          <span className="stat-icon gold">
            <Star size={19} />
          </span>
          <div>
            <span>Total XP</span>
            <strong>
              {xp} <small>XP</small>
            </strong>
          </div>
          <span className="stat-caption">Every step counts</span>
        </div>
        <div className="stat">
          <span className="stat-icon sage">
            <CheckCircle2 size={19} />
          </span>
          <div>
            <span>Weekly quests</span>
            <strong>
              {complete}
              <small> / {selected?.tasks.length || 0} complete</small>
            </strong>
          </div>
          <div className="mini-progress">
            <i
              style={{
                width: `${(100 * complete) / (selected?.tasks.length || 1)}%`,
              }}
            />
          </div>
        </div>
        <div className="stat">
          <span className="stat-icon rose">
            <FolderPlus size={19} />
          </span>
          <div>
            <span>Your portfolio</span>
            <strong>
              {projects}
              <small> projects added</small>
            </strong>
          </div>
          <NavLink
            to="/profile"
            className="stat-link"
            aria-label="View projects"
          >
            <ArrowUpRight size={19} />
          </NavLink>
        </div>
      </div>
      <div className="plan-layout">
        <section>
          <div className="section-title">
            <div>
              <span className="section-kicker">YOUR WEEKLY GAME PLAN</span>
              <h2>A few quests. A step forward.</h2>
            </div>
            <span className="time-pill">
              <Clock3 size={14} />
              {minutes} min planned
            </span>
          </div>
          {selected ? (
            <>
              <div className="plan-toolbar">
                <div className="tabs">
                  {["all", "to do", "completed"].map((f) => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={f === filter ? "active" : ""}
                    >
                      {f === "all"
                        ? "All quests"
                        : f === "to do"
                          ? "To do"
                          : "Completed"}
                    </button>
                  ))}
                </div>
                <select
                  aria-label="View saved weekly plan"
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
              </div>
              <div className="quest-list">
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
                {!selected.tasks.some(
                  (t) =>
                    filter === "all" ||
                    (filter === "completed"
                      ? t.status === "completed"
                      : !["completed", "skipped"].includes(t.status)),
                ) && (
                  <div className="card empty">
                    <CheckCircle2 />
                    <h3>
                      {filter === "completed"
                        ? "Your first win is waiting."
                        : "You’ve made room for what’s next."}
                    </h3>
                    <p>
                      Every suggestion is yours to accept, replace, or skip.
                    </p>
                  </div>
                )}
              </div>
              <div className="generation-note">
                <Sparkles size={14} />
                {selected.source === "demo"
                  ? "Demo · Personalized, deterministic suggestions"
                  : selected.source === "fallback"
                    ? "Fallback plan · AI unavailable; deterministic suggestions"
                    : "Generated with Gemini · Review suggestions before acting"}
              </div>
              <p className="adaptation">{selected.change}</p>
            </>
          ) : (
            <div className="card empty">
              <Map />
              <h3>Your path is ready to begin.</h3>
              <button className="primary" disabled={busy} onClick={onGenerate}>
                {busy ? "Building your plan…" : "Generate first plan"}
              </button>
              <button
                className="text-button"
                onClick={onFallback}
                disabled={busy}
              >
                Use a deterministic starter plan
              </button>
            </div>
          )}
        </section>
        <aside className="right-rail">
          <section className="card pathway">
            <div className="section-kicker">
              <Rocket size={15} /> THE BIGGER PICTURE
            </div>
            <h3>Your career pathway</h3>
            <p className="muted">A direction, not a deadline.</p>
            <ol>
              {(
                selected?.milestones || [
                  "Explore your direction",
                  "Build something real",
                  "Show your strengths",
                ]
              ).map((m, i) => (
                <li
                  key={m}
                  className={
                    i === Math.min(3, Math.floor(xp / 100)) ? "current" : ""
                  }
                >
                  <span>
                    {i < Math.floor(xp / 100) ? <Check size={13} /> : i + 1}
                  </span>
                  <div>
                    <strong>{m}</strong>
                    <small>
                      {i === Math.min(3, Math.floor(xp / 100))
                        ? "You’re here · keep exploring"
                        : i < Math.floor(xp / 100)
                          ? "Progress made"
                          : "Up ahead"}
                    </small>
                  </div>
                </li>
              ))}
            </ol>
            <NavLink to="/progress" className="text-link">
              See your progress <ArrowRight size={15} />
            </NavLink>
          </section>
          <section className="checkin-card">
            <div className="checkin-icon">
              <Leaf size={22} />
            </div>
            <span className="section-kicker">PAUSE. REFLECT. RESET.</span>
            <h3>Your plan grows with you.</h3>
            <p>
              Loved building? Busy week? Tell us what worked. We’ll help you
              find your next step.
            </p>
            <button onClick={onCheckin}>
              Check in this week <ArrowRight size={16} />
            </button>
            <small>Suggested on Sundays · Open all week</small>
          </section>
          <p className="rail-footnote">
            <Sparkles size={14} /> These are suggestions, not assignments.
            <br />
            Make your path your own.
          </p>
        </aside>
      </div>
    </>
  );
}
function Quest({
  task: t,
  index,
  busy,
  onStatus,
  onReflection,
  onReplace,
}: {
  task: Task;
  index: number;
  busy: boolean;
  onStatus: (s: Task["status"]) => void;
  onReflection: (r: string) => void;
  onReplace: () => void;
}) {
  const [expanded, setExpanded] = useState(false),
    [reflection, setReflection] = useState(t.reflection);
  const Icon =
    t.category === "projects"
      ? Rocket
      : t.category === "skills"
        ? BookOpen
        : t.category === "research"
          ? Search
          : t.category === "networking"
            ? Users
            : Compass;
  return (
    <article
      className={`quest card ${t.status === "completed" ? "quest-complete" : ""} ${t.status === "skipped" ? "quest-skipped" : ""}`}
    >
      <div className="quest-top">
        <span className={`category-icon category-${t.category}`}>
          <Icon size={19} />
        </span>
        <div className="quest-meta">
          <span>{t.category}</span>
          <i />
          Quest {String(index + 1).padStart(2, "0")}
        </div>
        <span className="xp-pill">+{t.xp} XP</span>
      </div>
      <h3>{t.title}</h3>
      <p>{t.instructions}</p>
      <div className="quest-bottom">
        <span>
          <Clock3 size={14} />
          {t.minutes} min
        </span>
        <button className="text-button" onClick={() => setExpanded(!expanded)}>
          {expanded ? "Less detail" : "Why this fits you"}{" "}
          <ChevronRight size={13} />
        </button>
      </div>
      {expanded && (
        <div className="quest-details">
          <p>
            <strong>Why it fits:</strong> {t.why}
          </p>
          <p>
            <strong>Done when:</strong> {t.criteria}
          </p>
          {t.resourceIds.map((id) => {
            const r = resources.find((r) => r.id === id);
            return (
              r && (
                <a key={id} href={r.url} target="_blank" rel="noreferrer">
                  {r.title} <ArrowUpRight size={12} />
                </a>
              )
            );
          })}
          <label>
            Reflection or evidence
            <textarea
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              placeholder="What did you learn? Add a note or evidence link."
            />
          </label>
          <button
            className="secondary small-button"
            disabled={busy}
            onClick={() => onReflection(reflection)}
          >
            Save reflection
          </button>
        </div>
      )}
      <div className="quest-actions">
        <span className={`status status-${t.status.replace(" ", "-")}`}>
          {t.status === "completed" ? (
            <CheckCircle2 size={14} />
          ) : (
            <span className="status-dot" />
          )}
          {t.status}
        </span>
        <div>
          {!["completed", "skipped"].includes(t.status) && (
            <>
              <button
                className="text-button"
                disabled={busy}
                onClick={onReplace}
              >
                <RefreshCw size={13} />
                Replace
              </button>
              <button
                className="text-button"
                disabled={busy}
                onClick={() => onStatus("skipped")}
              >
                Skip
              </button>
              {t.status === "suggested" && (
                <button
                  className="secondary small-button"
                  disabled={busy}
                  onClick={() => onStatus("in progress")}
                >
                  Accept
                </button>
              )}
              <button
                className="complete-button"
                disabled={busy}
                onClick={() => onStatus("completed")}
              >
                <Check size={14} />
                Complete
              </button>
            </>
          )}
          {t.status === "skipped" && (
            <button
              className="text-button"
              disabled={busy}
              onClick={() => onStatus("suggested")}
            >
              Restore suggestion
            </button>
          )}
          {t.status === "completed" && (
            <span className="completion-label">A step worth celebrating.</span>
          )}
        </div>
      </div>
    </article>
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
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">LOOK HOW FAR YOU’VE COME</span>
          <h1>Progress has a way of adding up.</h1>
          <p>A little practice. A little courage. A step closer.</p>
        </div>
        <span className="time-pill">
          <Flame size={16} />
          {streak(state.checkins, now, p.timezone)} week streak
        </span>
      </div>
      <div className="progress-layout">
        <section
          className={`card ladder-card theme-${p.theme.replace(" ", "-")}`}
        >
          <div className="section-kicker">
            <Star size={16} />
            YOUR {p.theme.toUpperCase()} JOURNEY
          </div>
          <h2>
            Level {level} · {xp} XP
          </h2>
          <p>{XP.level - (xp % XP.level)} XP to your next level</p>
          <div className="ladder">
            <div className="ladder-line" />
            {[3, 2, 1, 0].map((step) => (
              <div
                className={`ladder-step ${Math.floor(xp / 100) >= step ? "reached" : ""}`}
                key={step}
              >
                <div className="ladder-rung">
                  <span>{step * 100} XP</span>
                </div>
                <div className="ladder-info">
                  <h3>
                    {
                      [
                        "Find your footing",
                        "Build momentum",
                        "Make your mark",
                        "Keep growing",
                      ][step]
                    }
                  </h3>
                  <small>
                    {Math.floor(xp / 100) === step
                      ? "Your current milestone"
                      : xp >= step * 100
                        ? "Milestone reached"
                        : "Up ahead"}
                  </small>
                </div>
                {Math.min(3, Math.floor(xp / 100)) === step && (
                  <Avatar color={p.avatar} />
                )}
              </div>
            ))}
          </div>
          <p className="fine">
            XP celebrates participation, not professional mastery. Themes are
            visual; your progress always belongs to you.
          </p>
        </section>
        <div className="right-rail">
          <section className="card">
            <div className="section-kicker">
              <Trophy size={16} />A LITTLE FRIENDLY MOMENTUM
            </div>
            <h3>Monthly leaderboard</h3>
            <p className="muted">
              {mode === "demo"
                ? "Illustrative rankings · Fictional students"
                : "Opt-in students · Display names only"}
            </p>
            {rows.length ? (
              rows.map((r, i) => (
                <div className="leader" key={r.name}>
                  <b>{i + 1}</b>
                  <span>{r.name}</span>
                  <strong>
                    {r.xp} <small>XP</small>
                  </strong>
                </div>
              ))
            ) : (
              <p>
                No participants yet. Opt in from your profile if you’d like to
                join.
              </p>
            )}
            <small>
              {p.leaderboard
                ? "You’re opted in. Change this in your profile anytime."
                : "You’re not participating. You can opt in from your profile."}
            </small>
          </section>
          <section className="reward-card">
            <Star size={28} />
            <span className="section-kicker">ILLUSTRATIVE REWARD PREVIEW</span>
            <h3>A little extra motivation.</h3>
            <p>Imagine celebrating a month of progress with Trojan gear.</p>
            <small>
              No funded prizes or claims. This is a concept preview only.
            </small>
          </section>
          <section className="card">
            <h3>Your recent wins</h3>
            {state.xp
              .slice(-5)
              .reverse()
              .map((e) => (
                <div className="xp-event" key={e.key}>
                  <CheckCircle2 size={16} />
                  <span>
                    {e.key.startsWith("project:")
                      ? "Completed project"
                      : "Completed quest"}
                  </span>
                  <strong>+{e.amount}</strong>
                </div>
              ))}
            {!state.xp.length && (
              <p className="muted">Your first win is one small step away.</p>
            )}
            <small>
              Quests earn 10 XP per started 15 minutes. Completed projects earn
              100 XP once.
            </small>
          </section>
        </div>
      </div>
    </>
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
