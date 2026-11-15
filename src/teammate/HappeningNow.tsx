import { useEffect, useState } from "react";
import {
  CalendarDays,
  MapPin,
  Sparkles,
  ArrowUpRight,
  Check,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import type { Profile } from "../../shared/domain";
import { fallbackEvents } from "../../shared/campus-event-snapshot";
import {
  interestTerms,
  matchEvents,
  type CampusEvent,
  type MatchedEvent,
} from "../../shared/campus-events";
import { supabase } from "../supabase";
import { Button, Chip, PageHeader } from "./ui";
type Feed = {
  events: CampusEvent[];
  source: "live" | "fallback";
  fetchedAt: string;
};
export function HappeningNow({
  profile,
  mode,
  plannedIds,
  onSave,
}: {
  profile: Profile;
  plannedIds: string[];
  mode: "demo" | "live";
  onSave: (profile: Profile, eventId: string) => Promise<void>;
}) {
  const [feed, setFeed] = useState<Feed | null>(null),
    [error, setError] = useState(""),
    [saving, setSaving] = useState(false),
    [query, setQuery] = useState(""),
    [refresh, setRefresh] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    setError("");
    setFeed(null);
    if (mode === "demo") {
      setFeed({
        events: fallbackEvents,
        source: "fallback",
        fetchedAt: "2026-11-15T00:00:00-08:00",
      });
      return () => controller.abort();
    }
    if (!supabase) {
      setError("The live calendar connection is not configured.");
      return;
    }
    void supabase.functions
      .invoke("campus-events", { method: "GET", signal: controller.signal })
      .then(({ data, error }) => {
        if (!active) return;
        if (error || !Array.isArray(data?.events))
          setError(
            "Could not load campus events. Please retry or browse the USC calendar.",
          );
        else setFeed(data as Feed);
      })
      .catch(() => {
        if (active) setError("Could not load campus events. Please retry.");
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [mode, refresh]);
  const terms = interestTerms(
    [...profile.interests, ...profile.skills],
    profile.major,
    profile.goal,
  );
  const events = (feed?.events || []).filter((e) =>
    `${e.title} ${e.description} ${e.org}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  const matches = matchEvents(events, terms, 2),
    matchedIds = new Set(matches.map((e) => e.id));
  const more = events.filter((e) => !matchedIds.has(e.id)).slice(0, 9);
  async function save(ev: CampusEvent) {
    const previous = profile.campusEvents?.[ev.id];
    setSaving(true);
    setError("");
    try {
      await onSave(
        {
          ...profile,
          campusEvents: {
            ...profile.campusEvents,
            [ev.id]: {
              title: ev.title,
              url: ev.url,
              startsOn: ev.startsOn,
              endsOn: ev.endsOn,
              going: !previous?.going || !plannedIds.includes(ev.id),
              attended: !!previous?.attended,
              note: previous?.note || "",
            },
          },
        },
        ev.id,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save event task.");
    } finally {
      setSaving(false);
    }
  }
  function card(ev: CampusEvent | MatchedEvent, matched = false) {
    const log = profile.campusEvents?.[ev.id];
    const when =
      ev.startsOn && Number.isFinite(Date.parse(ev.startsOn))
        ? new Date(ev.startsOn).toLocaleString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
            timeZone: "America/Los_Angeles",
          })
        : "Check event page for date";
    return (
      <article
        key={ev.id}
        className={`campus-event-card ${matched ? "matched" : ""}`}
      >
        <div className="flex flex-wrap gap-2">
          {matched && (
            <Chip tone="gold">
              <Sparkles size={12} />
              Matched to your interests
            </Chip>
          )}
          {ev.categories.slice(0, 2).map((c) => (
            <Chip key={c}>{c}</Chip>
          ))}
        </div>
        <a
          href={ev.url}
          target="_blank"
          rel="noreferrer"
          className="campus-event-title"
        >
          {ev.title}
          <ArrowUpRight size={17} />
        </a>
        <p className="campus-event-meta">
          <CalendarDays size={14} />
          {when} · Pacific time
        </p>
        <p className="campus-event-meta">
          <MapPin size={14} />
          {ev.location}
        </p>
        {ev.org && <p className="text-xs text-muted">{ev.org}</p>}
        <p className="text-sm text-muted">
          {matched && "matchedOn" in ev
            ? `Matches: ${ev.matchedOn.join(", ")}.`
            : ev.description}
        </p>
        <div className="campus-event-actions">
          {log?.attended ? (
            <span className="text-sm">
              <Check size={14} />
              Attendance logged
            </span>
          ) : (
            <>
              <Button
                variant="secondary"
                disabled={saving}
                onClick={() => void save(ev)}
              >
                {log?.going && plannedIds.includes(ev.id)
                  ? "Going"
                  : "I’m going"}
              </Button>
              {log?.going && plannedIds.includes(ev.id) && (
                <NavLink to="/plan">View task →</NavLink>
              )}
            </>
          )}
          <a href={ev.url} target="_blank" rel="noreferrer">
            View event ↗
          </a>
        </div>
      </article>
    );
  }
  return (
    <div className="tp-simple-page">
      <PageHeader
        eyebrow="Campus events"
        title="Happening Now"
        subtitle="Upcoming USC events, with relevant matches pinned for you."
      />
      <div className="campus-feed-status">
        <span>
          {mode === "demo"
            ? "Demo — saved calendar snapshot"
            : feed?.source === "live"
              ? "Live from USC’s public calendar"
              : feed
                ? "Saved calendar snapshot · live feed unavailable"
                : "Loading USC events…"}
        </span>
        <a href="https://calendar.usc.edu" target="_blank" rel="noreferrer">
          USC calendar ↗
        </a>
      </div>
      {feed?.source === "fallback" && (
        <p className="text-xs text-muted">
          Snapshot from November 15, 2026. Confirm dates, availability, and
          registration on the official event page.
        </p>
      )}
      {error && (
        <p role="alert" className="error">
          {error}{" "}
          <button type="button" onClick={() => setRefresh((n) => n + 1)}>
            Retry
          </button>
        </p>
      )}
      {Object.values(profile.campusEvents || {}).some((e) => e.going) && (
        <NavLink to="/plan" className="text-sm underline">
          View events in your weekly plan →
        </NavLink>
      )}
      <label className="campus-event-search">
        Search events
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search USC events"
        />
      </label>
      {!!matches.length && (
        <section>
          <h2 className="campus-section-title">For you this week</h2>
          <div className="campus-event-grid">
            {matches.map((e) => card(e, true))}
          </div>
        </section>
      )}
      {!!more.length && (
        <section>
          <h2 className="campus-section-title">More upcoming events</h2>
          <div className="campus-event-grid">{more.map((e) => card(e))}</div>
        </section>
      )}
      {feed && !events.length && (
        <p className="tp-paper-card">
          No upcoming events match this search. Browse the USC calendar for more
          options.
        </p>
      )}
      {Object.values(profile.campusEvents || {}).some((e) => e.attended) && (
        <NavLink to="/portfolio">
          View your event reflections in Portfolio →
        </NavLink>
      )}
      <p className="text-xs text-muted">
        “Going” saves your intention here; it does not register you. Only log
        attendance after participating. Event listings come from USC’s public
        calendar; for club events, browse{" "}
        <a href="https://engage.usc.edu/" target="_blank" rel="noreferrer">
          EngageSC
        </a>
        . TrojanPath is an independent student project.
      </p>
    </div>
  );
}
