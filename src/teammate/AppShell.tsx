import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { CalendarDays, Flame, LogOut } from "lucide-react";
import { streak, totalXP, type AppState } from "../../shared/domain";
import { Avatar, Chip, Logo, PathDoodle } from "./ui";

export function AppShell({
  state,
  mode,
  onProfile,
  onCheckin,
  onResume,
  onLogout,
  children,
}: {
  state: AppState;
  mode: string;
  onProfile: () => void;
  onCheckin: () => void;
  onResume: () => void;
  onLogout: () => void;
  children: ReactNode;
}) {
  const p = state.profile;
  const links = [
    ["/progress", "Pathway"],
    ["/plan", "This week"],
    ["/leaderboard", "Leaderboard"],
    ["/profile", "Profile & projects"],
    ["/opportunities", "Opportunities"],
    ["/resources", "USC resources"],
  ];
  return (
    <div className="tp-shell bg-bg text-ink">
      <aside className="tp-sidebar bg-surface border-border">
        <Logo href="/progress" />
        <nav aria-label="Main navigation" className="my-8 flex flex-col gap-1">
          {links.slice(0, 2).map(([url, label]) => (
            <NavLink
              key={url}
              to={url}
              className={({ isActive }) =>
                `tp-nav ${isActive ? "tp-active" : ""}`
              }
            >
              <span aria-hidden>●</span>
              {label}
            </NavLink>
          ))}
          <NavLink
            to="/checkins"
            className={({ isActive }) =>
              `tp-nav ${isActive ? "tp-active" : ""}`
            }
          >
            <span aria-hidden>●</span>Check-ins
          </NavLink>
          <NavLink
            to="/resume"
            className={({ isActive }) =>
              `tp-nav ${isActive ? "tp-active" : ""}`
            }
          >
            <span aria-hidden>●</span>Resume
          </NavLink>
          {links.slice(2).map(([url, label]) => (
            <NavLink
              key={url}
              to={url}
              className={({ isActive }) =>
                `tp-nav ${isActive ? "tp-active" : ""}`
              }
            >
              <span aria-hidden>●</span>
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto border-t border-border pt-5">
          <button
            className="flex w-full items-center gap-3 text-left"
            onClick={onProfile}
          >
            <Avatar outfit={p?.avatar} />
            <span className="min-w-0">
              <strong className="block truncate text-[14px]">
                {p?.name || "Your profile"}
              </strong>
              <small className="block truncate text-[12px] text-muted">
                {p?.major || "Let’s get started"}
              </small>
            </span>
          </button>
          <div className="my-3 flex flex-wrap gap-2">
            <Chip tone="goldSolid">{totalXP(state)} XP</Chip>
            <Chip tone="neutral">
              <Flame size={12} />
              {streak(state.checkins, new Date(), p?.timezone)} week streak
            </Chip>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center gap-2 text-[13px] text-muted"
          >
            <LogOut size={14} />
            {mode === "demo" ? "Exit demo" : "Sign out"}
          </button>
        </div>
      </aside>
      <div className="tp-workspace">
        <div className="mb-6 flex justify-end">
          <Chip tone={mode === "demo" ? "gold" : "success"}>
            {mode === "demo" ? "Demo · sample data" : "Live account"}
          </Chip>
        </div>
        <main>{children}</main>
      </div>
    </div>
  );
}
