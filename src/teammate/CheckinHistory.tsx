import { NavLink } from "react-router-dom";
import type { AppState } from "../../shared/domain";
import { weeklyRecap } from "./taskView";
import { Button, PageHeader } from "./ui";
export function CheckinHistory({
  state,
  onCheckin,
}: {
  state: AppState;
  onCheckin: () => void;
}) {
  const entries = [...state.checkins].sort((a, b) =>
    b.week.localeCompare(a.week),
  );
  return (
    <div className="tp-simple-page">
      <PageHeader
        eyebrow="Weekly reflections"
        title="Check-ins"
        actions={<Button onClick={onCheckin}>This week’s check-in</Button>}
      />
      {!entries.length ? (
        <div className="tp-paper-card">
          <p>No check-ins yet.</p>
          <p className="text-muted mt-2">
            Your weekly reflections and recaps will appear here.
          </p>
        </div>
      ) : (
        entries.map((c, i) => {
          const recap = weeklyRecap(state, c);
          return (
            <details className="tp-history-entry" key={c.id} open={i === 0}>
              <summary>
                <strong>Week of {c.week}</strong>
                <span>{recap.completed.length} completed</span>
              </summary>
              <div className="tp-history-content">
                <h2>Weekly recap</h2>
                <p>{recap.text}</p>
                {recap.reported > 0 && (
                  <p className="text-muted">
                    {recap.reported} additional{" "}
                    {recap.reported === 1 ? "task was" : "tasks were"} reported
                    in this check-in.
                  </p>
                )}
                {[
                  ["Enjoyed", c.enjoyed],
                  ["Didn’t fit", c.disliked],
                  ["Workload", c.workload],
                  ["Direction changes", c.goal],
                  ["Reflection", c.reflection],
                ]
                  .filter(([, v]) => v)
                  .map(([label, value]) => (
                    <div key={label}>
                      <h3>{label}</h3>
                      <p className="whitespace-pre-wrap">{value}</p>
                    </div>
                  ))}
              </div>
            </details>
          );
        })
      )}
      <NavLink className="tp-detail-button" to="/progress">
        Back to pathway →
      </NavLink>
    </div>
  );
}
