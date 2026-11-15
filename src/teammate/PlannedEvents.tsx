import { CalendarDays } from "lucide-react";
import { NavLink } from "react-router-dom";
import type { Profile } from "../../shared/domain";
import { Button } from "./ui";
export function PlannedEvents({
  profile,
  busy,
  onRemove,
}: {
  profile: Profile;
  busy: boolean;
  onRemove: (id: string) => void;
}) {
  const events = Object.entries(profile.campusEvents || {})
    .filter(([, e]) => e.going)
    .sort(([, a], [, b]) => (a.startsOn || "").localeCompare(b.startsOn || ""));
  if (!events.length) return null;
  return (
    <section
      className="tp-paper-card planned-events"
      aria-label="Events in your weekly plan"
    >
      <h2>
        <CalendarDays size={17} />
        Events in your plan
      </h2>
      <p className="text-xs text-muted">
        Your saved events, with their scheduled dates. These are added alongside
        your weekly tasks.
      </p>
      {events.map(([id, event]) => (
        <div key={id} className="planned-event-row">
          <div>
            <a href={event.url} target="_blank" rel="noreferrer">
              {event.title} ↗
            </a>
            <p className="text-xs text-muted">
              {event.startsOn && Number.isFinite(Date.parse(event.startsOn))
                ? new Date(event.startsOn).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                    timeZone: "America/Los_Angeles",
                  }) + " · Pacific time"
                : "Check event page for date"}{" "}
              · {event.attended ? "Attendance logged" : "Going"}
            </p>
          </div>
          <Button
            variant="secondary"
            disabled={busy}
            onClick={() => onRemove(id)}
            aria-label={`Remove ${event.title} from plan`}
          >
            Remove
          </Button>
        </div>
      ))}
      <NavLink to="/happening-now" className="text-xs underline">
        Manage events & attendance →
      </NavLink>
    </section>
  );
}
