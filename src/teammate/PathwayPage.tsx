import { BadgeGrid } from "./BadgeGrid";
import { levelFor } from "./pathway";
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
      <div className="ref-climb-level">
        Level {levelFor(xp).level} · {levelFor(xp).name}
      </div>
      <div className="tp-roadmap-layout">
        <div className="tp-map-panel">
          <ClimbCard pathway={path} outfit={p.avatar} />
        </div>
        <div className="ref-climb-side">
          <section className="ref-card">
            <span className="ref-kicker">Next milestone</span>
            <h2 className="ref-milestone">
              {
                path.stages[
                  Math.min(path.stages.length - 1, Math.floor(xp / 100) + 1)
                ]?.name
              }
            </h2>
            <div className="ref-xp-bar">
              <i style={{ width: `${xp % 100}%` }} />
            </div>
            <p className="ref-next-xp">
              {100 - (xp % 100)} XP to level {Math.floor(xp / 100) + 2}
            </p>
            <Button href="/plan" className="w-full mt-4">
              Earn XP →
            </Button>
          </section>
          <BadgeGrid state={state} />
          <details className="ref-roadmap-quests">
            <summary>Weekly plan tasks</summary>
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
                  No plan yet.{" "}
                  <NavLink to="/plan">Build your first plan →</NavLink>
                </p>
              )}
            </div>
          </details>
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
