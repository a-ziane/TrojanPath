import {
  BookOpen,
  Check,
  Compass,
  Flame,
  Footprints,
  LockKeyhole,
  Mountain,
  Rocket,
  Sparkles,
} from "lucide-react";
import type { AppState } from "../../shared/domain";
import { badgesFor } from "./achievements";
const icons = {
  footprints: Footprints,
  sparkles: Sparkles,
  rocket: Rocket,
  book: BookOpen,
  check: Check,
  flame: Flame,
  mountain: Mountain,
  compass: Compass,
};
export function BadgeGrid({ state }: { state: AppState }) {
  const badges = badgesFor(state);
  return (
    <section className="ref-card">
      <div className="ref-section-heading">
        <h2>Badges</h2>
        <span>
          {badges.filter((b) => b.earned).length}/{badges.length}
        </span>
      </div>
      <div className="ref-badges">
        {badges.map((b) => {
          const Icon = b.earned
            ? icons[b.icon as keyof typeof icons]
            : LockKeyhole;
          return (
            <div
              className={`ref-badge ${b.earned ? "earned" : ""}`}
              key={b.id}
              title={b.hint}
            >
              <Icon size={23} />
              <strong>{b.name}</strong>
              <small>{b.hint}</small>
              <span className="sr-only">{b.earned ? "Earned" : "Locked"}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
