import { QuestFlag } from "./TrojanGuide";
import { Sparkles } from "lucide-react";
import { NavLink } from "react-router-dom";
import { streak, weekKey, totalXP, type AppState } from "../../shared/domain";
import { ClimbCard } from "./ClimbCard";
import { pathwayFor } from "./pathway";
import { Button, PageHeader } from "./ui";
import { TaskTracker, type TaskActions } from "./TaskTracker";
import { weeklyRecap } from "./taskView";
export function PathwayPage({
  state,
  onEdit,
  onCheckin,
  ...actions
}: {
  state: AppState;
  onEdit: () => void;
  onCheckin: () => void;
} & TaskActions) {
  const p = state.profile!;
  const plan = [...state.plans].sort((a, b) => b.week.localeCompare(a.week))[0];
  const path = pathwayFor(state);
  const xp = totalXP(state);
  const completed =
    plan?.tasks.filter((t) => t.status === "completed").length ?? 0;
  const recent = [...state.checkins].sort((a, b) =>
    b.week.localeCompare(a.week),
  )[0];
  return (
    <div className="tp-simple-page">
      <PageHeader
        eyebrow="Your pathway"
        title="Your path"
        actions={
          <Button variant="secondary" onClick={onCheckin}>
            Check in
          </Button>
        }
      />
      <div className="tp-compact-stats">
        <span className="tp-level-chip">
          <Sparkles size={12} /> Level {Math.floor(xp / 100) + 1}
        </span>
        <span
          className="tp-xp-meter"
          aria-label={`${xp % 100} of 100 XP toward the next level`}
        >
          <span>{xp} XP</span>
          <span className="tp-xp-track">
            <i style={{ width: `${xp % 100}%` }} />
          </span>
        </span>
        <span>
          {completed}/{plan?.tasks.length ?? 0} quests
        </span>
        <span>
          {streak(state.checkins, new Date(), p.timezone)} week streak
        </span>
        <button onClick={onEdit}>Edit goals</button>
      </div>
      <div className="tp-roadmap-layout">
        <div className="tp-map-panel">
          <ClimbCard pathway={path} outfit={p.avatar} />
          <ol className="tp-mobile-milestones">
            {path.stages.map((s, i) => (
              <li key={i}>
                <strong>{s.name}</strong>
                <span>{s.timing}</span>
              </li>
            ))}
          </ol>
        </div>
        <div className="tp-roadmap-tasks">
          <div className="tp-section-title tp-quest-heading">
            <QuestFlag />
            <h2>
              {plan?.week === weekKey(new Date(), p.timezone)
                ? "This week"
                : `Week of ${plan?.week || "—"}`}
            </h2>
            <NavLink to="/plan">Past weeks →</NavLink>
          </div>
          {plan ? (
            <TaskTracker tasks={plan.tasks} {...actions} />
          ) : (
            <p>
              No plan yet. <NavLink to="/plan">Build your first plan →</NavLink>
            </p>
          )}
        </div>
      </div>
      <div className="tp-bottom-details">
        <details>
          <summary>Bigger picture</summary>
          <div>
            <p>{plan?.direction || p.goal}</p>
            <p className="mt-3">{plan?.change}</p>
            <span className="tp-task-meta">
              {plan?.source === "gemini"
                ? "Generated with Gemini"
                : plan?.source === "demo"
                  ? "Demo suggestions"
                  : "Starter suggestions"}
            </span>
          </div>
        </details>
        {recent && (
          <details>
            <summary>Weekly recap</summary>
            <div>
              <p>{weeklyRecap(state, recent).text}</p>
              <NavLink className="tp-detail-button" to="/checkins">
                View check-in history →
              </NavLink>
            </div>
          </details>
        )}
      </div>
    </div>
  );
}
