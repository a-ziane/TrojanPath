import { Star } from "lucide-react";
import { levelFor } from "./pathway";
export function GameProgress({
  xp,
  completed,
  total,
}: {
  xp: number;
  completed: number;
  total: number;
}) {
  const level = levelFor(xp);
  const pct = total ? completed / total : 0;
  return (
    <section className="ref-progress" aria-label="Weekly progress">
      <div className="ref-ring">
        <svg viewBox="0 0 80 80" aria-hidden="true">
          <circle
            cx="40"
            cy="40"
            r="33"
            fill="none"
            stroke="#eee8de"
            strokeWidth="8"
          />
          <circle
            cx="40"
            cy="40"
            r="33"
            fill="none"
            stroke="#2e7d4f"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${pct * 207.35} 207.35`}
            transform="rotate(-90 40 40)"
          />
        </svg>
        <strong>
          {completed}/{total}
        </strong>
      </div>
      <div className="ref-level">
        <div>
          <h2>Level {level.level}</h2>
          <span>{level.name}</span>
        </div>
        <div className="ref-xp-bar">
          <i style={{ width: `${level.pct * 100}%` }} />
        </div>
        <small>{level.nextAt - xp} XP to level up</small>
      </div>
      <div className="ref-total">
        <Star size={16} />
        <strong>{xp}</strong>
        <span>total XP</span>
      </div>
    </section>
  );
}
