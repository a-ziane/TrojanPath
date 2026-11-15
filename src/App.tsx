import { PlannedEvents } from "./teammate/PlannedEvents";
import { HappeningNow } from "./teammate/HappeningNow";
import {
  exampleProject,
  firstDemoPlan,
  loadJourney,
  selectJourney,
  selectedDemo,
  saveDemoDraft,
  zahiExample,
  type DemoJourney,
  type DemoAdaptation,
} from "./demoJourneys";
import { profileSummary } from "./profileSummary";
import { downloadResumePDF } from "./resumePdf";
import { GraduationField } from "./teammate/GraduationField";
import { PortfolioPage } from "./teammate/PortfolioPage";
import { BrandMark } from "./BrandMark";
import { TrojanGuide } from "./teammate/TrojanGuide";
import { levelFor } from "./teammate/pathway";
import { Celebration } from "./teammate/Celebration";
import { GameProgress } from "./teammate/GameProgress";
import { Podium } from "./teammate/Podium";
import { OnboardingWizard } from "./teammate/OnboardingWizard";
import { TaskTracker } from "./teammate/TaskTracker";
import { CheckinHistory } from "./teammate/CheckinHistory";
import { SkillPrompt } from "./teammate/SkillPrompt";
import { TaskCard as Quest } from "./teammate/TaskCard";
import { AppShell } from "./teammate/AppShell";
import { ThemeToggle } from "./teammate/ThemeToggle";
import { PathwayPage } from "./teammate/PathwayPage";
import {
  Button as PathButton,
  Card as PathCard,
  Chip as PathChip,
  PageHeader,
  Progress as PathProgress,
} from "./teammate/ui";
import {
  useEffect,
  useState,
  type FormEvent,
  type ReactNode,
  useRef,
} from "react";
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
  Pencil,
  FileText,
  Wrench,
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
      <BrandMark />
      <strong>TrojanPath</strong>
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
  projects = [],
  initial,
  onSave,
  busy,
  mode,
}: {
  initial: Profile;
  projects?: Project[];
  onSave: (p: Profile, projects?: Project[]) => void;
  busy: boolean;
  mode: "demo" | "live";
}) {
  const [draftProjects, setDraftProjects] = useState<Project[]>(projects);
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
        for (const project of draftProjects) {
          const result = projectSchema.safeParse(project);
          if (!result.success) {
            setError(result.error.issues[0].message);
            return;
          }
        }
        onSave(r.data, draftProjects);
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
          <GraduationField
            value={p.graduation}
            onChange={(value) => update("graduation", value)}
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
      {p.skills.length > 0 && (
        <div className="tp-skill-context">
          {p.skills.map((skill) => (
            <SkillPrompt
              key={skill}
              skill={skill}
              value={p.skillContext?.[skill] || ""}
              mode={mode}
              isNew={!initial.skills.includes(skill)}
              onChange={(answer) =>
                update("skillContext", { ...p.skillContext, [skill]: answer })
              }
            />
          ))}
        </div>
      )}
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
      <fieldset className="tp-onboarding-projects">
        <legend>Current projects · optional</legend>
        {draftProjects.map((project, i) => (
          <div className="tp-project-fields" key={project.id}>
            <label>
              Project title
              <input
                required
                minLength={2}
                maxLength={150}
                value={project.title}
                onChange={(e) =>
                  setDraftProjects((items) =>
                    items.map((x, j) =>
                      j === i ? { ...x, title: e.target.value } : x,
                    ),
                  )
                }
              />
            </label>
            <label>
              Project link
              <input
                type="url"
                placeholder="https://…"
                value={project.url}
                onChange={(e) =>
                  setDraftProjects((items) =>
                    items.map((x, j) =>
                      j === i ? { ...x, url: e.target.value } : x,
                    ),
                  )
                }
              />
            </label>
            <label>
              What are you working on?
              <textarea
                required
                minLength={5}
                maxLength={3000}
                value={project.description}
                onChange={(e) =>
                  setDraftProjects((items) =>
                    items.map((x, j) =>
                      j === i ? { ...x, description: e.target.value } : x,
                    ),
                  )
                }
              />
            </label>
            {!projects.some((p) => p.id === project.id) && (
              <button
                type="button"
                className="tp-detail-button"
                onClick={() =>
                  setDraftProjects((items) => items.filter((_, j) => j !== i))
                }
              >
                Remove
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          className="secondary small-button"
          onClick={() =>
            setDraftProjects((items) => [
              ...items,
              {
                id: crypto.randomUUID(),
                title: "",
                url: "",
                description: "",
                date: localDate(),
                skills: [],
                completed: false,
              },
            ])
          }
        >
          + Add project
        </button>
      </fieldset>
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
      <details className="tp-form-preferences">
        <summary>Preferences & leaderboard</summary>
        <div className="form-grid">
          <label>
            Pathway theme
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
      </details>
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
    [modal, setModal] = useState<"profile" | "project" | "checkin" | null>(
      null,
    ),
    [editing, setEditing] = useState<Project | null>(null),
    [post, setPost] = useState(""),
    [authMode, setAuthMode] = useState<"login" | "signup">("login"),
    [authEmail, setAuthEmail] = useState(""),
    [authPassword, setAuthPassword] = useState("");
  const [demoJourney, setDemoJourney] = useState<DemoJourney>(selectedDemo);
  const [demoChoice, setDemoChoice] = useState(false);
  const [demoVersion, setDemoVersion] = useState(0);
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
            setAuthEmail(data.session.user.email || "");
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
        setAuthEmail(session.user.email || "");
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
  function startDemo(journey: DemoJourney, reset = false) {
    void run(async () => {
      const snapshot = selectJourney(journey, reset);
      setState(snapshot.state);
      setDemoJourney(journey);
      setDemoVersion((v) => v + 1);
      setMode("demo");
      setDemoChoice(false);
      setModal(null);
      setError("");
      setNotice("");
      localStorage.setItem("trojanpath:mode", "demo");
      navigate(journey === "four-weeks" ? "/profile" : "/progress");
    });
  }
  async function saveProfile(p: Profile, projects: Project[] = []) {
    await run(async () => {
      if (mode === "demo") {
        let next: AppState = { ...state, profile: p };
        for (const project of projects) next = saveProject(next, project);
        if (!next.plans.length)
          next = {
            ...next,
            plans: [firstDemoPlan(p, weekKey(new Date(), p.timezone))],
          };
        commit(next);
      } else {
        await repo.liveProfile(p);
        for (const project of projects) await repo.liveProject(project);
        await refresh();
        if (
          !state.plans.length ||
          state.plans.some(
            (plan) =>
              plan.source === "fallback" &&
              plan.week === weekKey(new Date(), p.timezone),
          )
        ) {
          await repo.liveGenerate(weekKey(new Date(), p.timezone));
          await refresh();
        }
      }
      setModal(null);
      navigate("/progress");
      window.scrollTo(0, 0);
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
        ? `Task complete! ${t.xp} XP added.`
        : t.status === "completed"
          ? `Completion undone. ${t.xp} XP removed.`
          : "Task updated.",
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
      {mode === "live" && <Celebration xp={xp} />}
      {!mode ? (
        <main className="welcome">
          <div className="welcome-art tp-welcome-art">
            <div className="flex items-center gap-3">
              <BrandMark className="brand-mark-large" />

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
            <ThemeToggle className="self-end justify-self-end" />
            <span className="eyebrow">WELCOME TO TROJANPATH</span>
            <h2>A future that feels like you.</h2>
            <p className="muted">
              Find your direction, build your skills, and make your next move.
              One manageable week at a time.
            </p>
            <button
              className="secondary large"
              onClick={() => setDemoChoice(!demoChoice)}
            >
              Try demo <ArrowRight size={18} />
            </button>
            {demoChoice && (
              <div className="demo-entry-options">
                <strong>Demo — sample data</strong>
                <button
                  className="secondary"
                  onClick={() => startDemo("new", true)}
                >
                  Start Zahi’s journey
                </button>
                <button
                  className="secondary"
                  onClick={() => startDemo("four-weeks")}
                >
                  See Zahi after 4 weeks
                </button>
                <small>
                  Illustrative journeys, not actual student results.
                </small>
              </div>
            )}

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
                  navigate("/progress");
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
          onResume={() => navigate("/portfolio")}
          onLogout={() =>
            void run(async () => {
              if (mode === "live") await supabase?.auth.signOut();
              localStorage.removeItem("trojanpath:mode");
              setMode(null);
              setState(emptyState());
            })
          }
        >
          {mode === "demo" && (
            <div className="demo-journey-switcher">
              <strong>Demo — sample data</strong>
              <button
                aria-pressed={demoJourney === "new"}
                onClick={() => startDemo("new")}
              >
                New student
              </button>
              <button
                aria-pressed={demoJourney === "four-weeks"}
                onClick={() => startDemo("four-weeks")}
              >
                After 4 weeks
              </button>
              <button onClick={() => startDemo(demoJourney, true)}>
                Reset this demo
              </button>
            </div>
          )}
          {!profile ? (
            <OnboardingWizard
              key={`${demoJourney}:${demoVersion}`}
              initialProjects={
                mode === "demo" ? loadJourney().draft?.projects : undefined
              }
              onDraftChange={mode === "demo" ? saveDemoDraft : undefined}
              example={
                mode === "demo"
                  ? { profile: zahiExample, projects: [exampleProject()] }
                  : undefined
              }
              initial={
                mode === "demo"
                  ? loadJourney().draft?.profile || {
                      ...zahiExample,
                      name: "",
                      major: "",
                      standing: "",
                      graduation: "",
                      interests: [],
                      skills: [],
                      goal: "",
                    }
                  : {
                      ...demoProfile,
                      name: "",
                      email: authEmail,
                      major: "",
                      standing: "",
                      graduation: "",
                      experiences: "",
                      minor: "",
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
                    onRemoveEvent={(id) =>
                      void run(async () => {
                        const event = profile.campusEvents?.[id];
                        if (!event) return;
                        const next = {
                          ...profile,
                          campusEvents: {
                            ...profile.campusEvents,
                            [id]: { ...event, going: false },
                          },
                        };
                        if (mode === "demo")
                          commit({ ...state, profile: next });
                        else {
                          await repo.liveProfile(next);
                          await refresh();
                        }
                      })
                    }
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
                    adaptations={
                      mode === "demo" && demoJourney === "four-weeks"
                        ? loadJourney().adaptations
                        : []
                    }
                    profile={profile}
                    state={state}
                    onEdit={() => setModal("profile")}
                    onProject={(p) => {
                      setEditing(p || null);
                      setModal("project");
                    }}
                    onResume={() => navigate("/portfolio")}
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
                    busy={busy}
                    onTask={changeTask}
                    onReplace={replace}
                    onCheckin={() => setModal("checkin")}
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
              <Route
                path="/checkins"
                element={
                  <CheckinHistory
                    state={state}
                    onCheckin={() => setModal("checkin")}
                  />
                }
              />
              <Route
                path="/portfolio"
                element={
                  <PortfolioPage
                    state={state}
                    onSave={async (patch) => {
                      const next = profileSchema.parse({
                        ...profile,
                        ...patch,
                      });
                      if (mode === "demo") commit({ ...state, profile: next });
                      else {
                        await repo.liveProfile(next);
                        await refresh();
                      }
                    }}
                  />
                }
              />
              <Route
                path="/resume"
                element={<Navigate to="/portfolio" replace />}
              />
              <Route
                path="/happening-now"
                element={
                  <HappeningNow
                    profile={profile}
                    mode={mode}
                    onSave={async (next) => {
                      const validated = profileSchema.parse(next);
                      if (mode === "demo")
                        commit({ ...state, profile: validated });
                      else {
                        await repo.liveProfile(validated);
                        await refresh();
                      }
                    }}
                  />
                }
              />
              <Route path="/resources" element={<Resources />} />
              <Route
                path="*"
                element={
                  <Navigate
                    to={
                      mode === "demo" && demoJourney === "four-weeks"
                        ? "/profile"
                        : "/progress"
                    }
                    replace
                  />
                }
              />
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
          {error.includes("saved demo") && (
            <button onClick={repo.resetDemo}>Reset demo</button>
          )}
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
            projects={state.projects}
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
                    setNotice(
                      "Your check-in is saved. AI planning could not finish; retry from Weekly Plan.",
                    );
                  }
                  await refresh();
                }
                setModal(null);
                navigate("/progress");
              }, "Check-in saved. Your progress has been recorded.")
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
  onRemoveEvent,
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
  onRemoveEvent: (id: string) => void;
  xp: number;
  projects: number;
}) {
  const [view, setView] = useState("");
  const selected = plans.find((p) => p.id === view) || plan;
  const complete =
    selected?.tasks.filter((t) => t.status === "completed").length || 0;
  return (
    <div className="tp-simple-page">
      <PageHeader
        eyebrow="Your week"
        title="Weekly plan"
        actions={
          <PathButton variant="secondary" onClick={onCheckin}>
            Check in
          </PathButton>
        }
      />
      <GameProgress
        xp={xp}
        completed={complete}
        total={selected?.tasks.length || 0}
      />
      <PlannedEvents profile={profile} busy={busy} onRemove={onRemoveEvent} />
      {selected ? (
        <>
          <label className="tp-week-selector">
            Week
            <select
              aria-label="Saved week"
              value={selected.id}
              onChange={(e) => setView(e.target.value)}
            >
              {[...plans]
                .sort((a, b) => b.week.localeCompare(a.week))
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.week}
                  </option>
                ))}
            </select>
          </label>
          {selected.source === "fallback" && (
            <div className="tp-paper-card">
              <p>
                This is a starter plan. Generate a personalized plan with
                Gemini.
              </p>
              <PathButton
                disabled={
                  busy ||
                  selected.tasks.some(
                    (task) => task.status !== "suggested" || !!task.reflection,
                  )
                }
                onClick={onGenerate}
              >
                Generate with Gemini
              </PathButton>
            </div>
          )}
          {selected.source === "demo" && (
            <p className="text-xs text-muted">
              Example plan — sample data, no live AI request.
            </p>
          )}
          <TaskTracker
            tasks={selected.tasks}
            busy={busy}
            onTask={onTask}
            onReplace={onReplace}
          />
          <details className="tp-inline-details">
            <summary>About this plan</summary>
            <p>{selected.direction}</p>
            <p>{selected.change}</p>
            <span className="tp-task-meta">
              {selected.source === "gemini"
                ? "Generated with Gemini"
                : selected.source === "demo"
                  ? "Demo suggestions"
                  : "Starter suggestions"}
            </span>
          </details>
        </>
      ) : (
        <div className="tp-paper-card">
          <p>No plan yet.</p>
          <div className="flex flex-wrap gap-3 mt-4">
            <PathButton disabled={busy} onClick={onGenerate}>
              Generate plan
            </PathButton>
            <PathButton
              disabled={busy}
              variant="secondary"
              onClick={onFallback}
            >
              Use starter plan
            </PathButton>
          </div>
        </div>
      )}
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
    previous
      ? {
          ...previous,
          completed: [
            ...new Set([
              ...previous.completed,
              ...state.plans
                .filter((p) => p.week === week)
                .flatMap((p) =>
                  p.tasks
                    .filter((t) => t.status === "completed")
                    .map((t) => t.id),
                ),
            ]),
          ],
        }
      : {
          id: crypto.randomUUID(),
          week,
          completed: state.plans
            .filter((p) => p.week === week)
            .flatMap((p) =>
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
    .filter((p) => p.week === week)
    .flatMap((p) => p.tasks);
  return (
    <form
      className="form-stack"
      onSubmit={(e) => {
        e.preventDefault();
        onSave({
          ...c,
          confirmed: tasks
            .filter(
              (t) => t.status === "completed" && c.completed.includes(t.id),
            )
            .map((t) => t.id),
        });
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
          <p>No tasks yet. You can still reflect on your week.</p>
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
      <fieldset>
        <legend>How was your workload?</legend>
        <div className="ref-workload">
          {(
            [
              { value: "too busy", label: "Too busy", symbol: "◷" },
              { value: "manageable", label: "Just right", symbol: "☀" },
              { value: "ready for more", label: "Want more", symbol: "↗" },
            ] as const
          ).map((option) => (
            <button
              type="button"
              aria-pressed={c.workload === option.value}
              key={option.value}
              onClick={() => setC({ ...c, workload: option.value })}
            >
              <span aria-hidden="true">{option.symbol}</span>
              {option.label}
            </button>
          ))}
        </div>
      </fieldset>
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
  adaptations = [],
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
  adaptations?: DemoAdaptation[];
}) {
  const [fileError, setFileError] = useState("");
  const [downloadingSummary, setDownloadingSummary] = useState(false);
  async function downloadSummary() {
    setDownloadingSummary(true);
    setFileError("");
    try {
      await downloadResumePDF(p.name, profileSummary(p, state), {
        title: "Advisor profile summary",
        suffix: "advisor-summary",
      });
    } catch (error) {
      setFileError(
        error instanceof Error
          ? error.message
          : "Could not download your summary. Please retry.",
      );
    } finally {
      setDownloadingSummary(false);
    }
  }
  const openFile = (path: string) =>
    void repo
      .fileURL(path)
      .then((url) => window.open(url, "_blank", "noopener,noreferrer"))
      .catch((e) => setFileError(String(e)));
  const level = levelFor(totalXP(state));
  return (
    <div className="profile-reference-page">
      <section className="profile-identity">
        <div className="profile-guide">
          <TrojanGuide outfit={p.avatar} />
        </div>
        <div className="profile-identity-copy">
          <h1>{p.name}</h1>
          <p>
            {p.major}
            {p.minor ? ` · Minor in ${p.minor}` : ""}
          </p>
          <div className="profile-pills">
            <span className="profile-level-pill">
              Lv {level.level} · {level.name}
            </span>
            <span>
              {p.degree}
              {p.standing ? ` · ${p.standing}` : ""}
            </span>
            <span>Class of {p.graduation.slice(0, 4)}</span>
          </div>
        </div>
        <div className="profile-identity-actions">
          <PathButton
            variant="secondary"
            disabled={downloadingSummary}
            onClick={() => void downloadSummary()}
          >
            <FileText size={16} />
            {downloadingSummary
              ? "Preparing summary…"
              : "Download profile summary"}
          </PathButton>
          <PathButton variant="secondary" onClick={onEdit}>
            <Pencil size={15} />
            Edit profile
          </PathButton>
          <PathButton variant="secondary" onClick={onResume}>
            <FileText size={16} />
            Portfolio
          </PathButton>
        </div>
      </section>
      {adaptations.length > 0 && (
        <section className="demo-adaptation-card">
          <h2>How your plan has adapted</h2>
          <p>Based on your weekly check-ins and completed activities.</p>
          <div className="demo-adaptation-grid">
            {adaptations.map((record) => (
              <div key={record.label}>
                <h3>{record.label}</h3>
                <p>
                  <span>{record.before}</span> → <strong>{record.after}</strong>
                </p>
                <small>Why: {record.why}</small>
              </div>
            ))}
          </div>
          <p>
            These are suggestions you can change. This history is illustrative
            sample data.
          </p>
          <NavLink to="/checkins">View supporting check-ins →</NavLink>
        </section>
      )}
      <div className="profile-info-grid">
        <section className="profile-info-card">
          <h2>
            <Sparkles size={19} />
            Interests
          </h2>
          <div className="profile-pills interests">
            {p.interests.map((interest) => (
              <span key={interest}>{interest}</span>
            ))}
          </div>
          {!p.interests.length && (
            <button className="tp-detail-button" onClick={onEdit}>
              Add interests
            </button>
          )}
        </section>
        <section className="profile-info-card">
          <h2>
            <Wrench size={19} />
            Skills
          </h2>
          <div className="profile-pills">
            {p.skills.map((skill) => (
              <span key={skill}>{skill}</span>
            ))}
          </div>
          {!p.skills.length && (
            <button className="tp-detail-button" onClick={onEdit}>
              Add skills
            </button>
          )}
          {p.skillContext &&
            Object.entries(p.skillContext).some(
              ([skill, answer]) => p.skills.includes(skill) && answer,
            ) && (
              <details className="profile-skill-details">
                <summary>Experience with these skills</summary>
                {Object.entries(p.skillContext)
                  .filter(
                    ([skill, answer]) => p.skills.includes(skill) && answer,
                  )
                  .map(([skill, answer]) => (
                    <p key={skill}>
                      <strong>{skill}:</strong> {answer}
                    </p>
                  ))}
              </details>
            )}
        </section>
        <section className="profile-info-card">
          <h2>
            <Target size={19} />
            Goal
          </h2>
          <p className="profile-goal">{p.goal || "Exploring"}</p>
          <small>{p.hours} hrs/week</small>
        </section>
      </div>
      {(p.experiences || p.resumePath) && (
        <details className="profile-background">
          <summary>Background & uploaded résumé</summary>
          {p.experiences && (
            <p className="whitespace-pre-wrap">{p.experiences}</p>
          )}
          {p.resumePath && (
            <button
              className="tp-detail-button"
              onClick={() => openFile(p.resumePath!)}
            >
              Open uploaded résumé ↗
            </button>
          )}
        </details>
      )}
      <div className="profile-projects-heading">
        <h2>
          <Rocket size={22} />
          Projects
        </h2>
        <PathButton onClick={() => onProject()}>
          <Plus size={17} />
          Add project
        </PathButton>
      </div>
      {fileError && (
        <p className="error" role="alert">
          {fileError}
        </p>
      )}
      <div className="profile-project-grid">
        {state.projects.map((project) => (
          <article className="profile-project-card" key={project.id}>
            <div className="profile-project-meta">
              <span
                className={
                  project.completed
                    ? "profile-project-done"
                    : "profile-project-pending"
                }
              >
                {project.completed ? (
                  <>
                    <CheckCircle2 size={12} />
                    Done
                  </>
                ) : (
                  "In progress"
                )}
              </span>
              <time dateTime={project.date}>{project.date}</time>
            </div>
            <h3>{project.title}</h3>
            <p>{project.description}</p>
            <div className="profile-pills">
              {project.skills.filter(Boolean).map((skill) => (
                <span key={skill}>{skill}</span>
              ))}
            </div>
            <div className="profile-project-actions">
              {project.url && (
                <a href={project.url} target="_blank" rel="noreferrer">
                  View project ↗
                </a>
              )}
              {project.attachment && (
                <button onClick={() => openFile(project.attachment!)}>
                  Attachment ↗
                </button>
              )}
              <button onClick={() => onProject(project)}>Edit project</button>
              {project.completed && (
                <button onClick={() => onPost(project)}>LinkedIn draft</button>
              )}
            </div>
          </article>
        ))}
      </div>
      {!state.projects.length && (
        <div className="profile-no-projects">
          <Rocket size={24} />
          <p>No projects yet.</p>
          <button className="tp-detail-button" onClick={() => onProject()}>
            Add your first project
          </button>
        </div>
      )}
    </div>
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
      <div className="ref-ranks-layout">
        <PathCard>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-[22px] font-bold">
              This month’s explorers
            </h2>
            <PathChip tone="gold">{month}</PathChip>
          </div>
          {rows.length ? (
            <Podium rows={rows} />
          ) : (
            <p className="py-6 text-muted">
              No participants yet. Opt in from your profile to join.
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
                      : "Completed task"}
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
              Tasks earn 10 XP per started 15 minutes. Completed projects earn
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
          <h1>Opportunities</h1>
          <p>Matched to your skills and interests.</p>
        </div>
      </div>
      <details className="ref-opportunity-note">
        <summary>Samples · not real listings</summary>
        <p>
          Illustrative matches based on your profile. Find verified openings
          through the USC Career Center; eligibility varies.
        </p>
      </details>
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
          <h1>Resources</h1>
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
