import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import {
  BookOpen,
  CheckCheck,
  CheckSquare,
  Compass,
  FileText,
  Flame,
  LogOut,
  Mountain,
  Star,
  Trophy,
  UserRound,
} from "lucide-react";
import { streak, totalXP, weekKey, type AppState } from "../../shared/domain";
import { Avatar, Logo } from "./ui";
import { levelFor } from "./pathway";
const links = [
  { url: "/plan", label: "Weekly Plan", icon: CheckSquare },
  { url: "/progress", label: "Path", icon: Compass },
  { url: "/leaderboard", label: "Ranks", icon: Trophy },
  { url: "/profile", label: "Profile", icon: UserRound },
  { url: "/opportunities", label: "Opportunities", icon: Compass },
  { url: "/resources", label: "Resources", icon: BookOpen },
];
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
  const xp = totalXP(state);
  const level = levelFor(xp);
  const checked = state.checkins.some(
    (c) => c.week === weekKey(new Date(), p?.timezone),
  );
  return (
    <div className="tp-shell ref-shell">
      <aside className="tp-sidebar ref-sidebar">
        <div className="ref-brand">
          <Logo href="/progress" />
        </div>
        {p && (
          <button className="ref-player" onClick={onProfile}>
            <Avatar size={48} outfit={p.avatar} />
            <div>
              <strong>{p.name}</strong>
              <small>
                Lv {level.level} · {level.name}
              </small>
              <div className="ref-xp-bar">
                <i style={{ width: `${level.pct * 100}%` }} />
              </div>
              <span className="ref-player-points">
                <span>
                  <Star size={13} />
                  {xp}
                </span>
                <span>
                  <Flame size={13} />
                  {streak(state.checkins, new Date(), p.timezone)}
                </span>
              </span>
            </div>
          </button>
        )}
        <nav className="ref-desktop-nav" aria-label="Main navigation">
          {links.map(({ url, label, icon: Icon }) => (
            <NavLink
              className={({ isActive }) =>
                `ref-nav ${isActive ? "active" : ""}`
              }
              key={url}
              to={url}
            >
              <Icon size={19} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="ref-quick-links">
          {p && (
            <>
              <button
                className={`ref-checkin ${checked ? "checked" : ""}`}
                onClick={onCheckin}
              >
                <CheckCheck size={23} />
                <span>
                  <strong>Weekly check-in</strong>
                  <small>{checked ? "Done this week" : "Best on Sunday"}</small>
                </span>
              </button>
              <div className="ref-extra-links">
                <NavLink to="/checkins">Past check-ins</NavLink>
                <NavLink to="/resume">
                  <FileText size={16} />
                  Résumé
                </NavLink>
              </div>
            </>
          )}
        </div>
        <div className="ref-session">
          <span>{mode === "demo" ? "Demo · sample data" : "Live account"}</span>
          <button onClick={onLogout}>
            <LogOut size={14} />
            {mode === "demo" ? "Exit demo" : "Sign out"}
          </button>
        </div>
      </aside>
      <div className="tp-workspace ref-workspace">
        <main>{children}</main>
      </div>
      {p && (
        <nav className="ref-mobile-nav" aria-label="Mobile navigation">
          {links.map(({ url, label, icon: Icon }) => (
            <NavLink
              className={({ isActive }) => (isActive ? "active" : "")}
              key={url}
              to={url}
            >
              <Icon size={20} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      )}
    </div>
  );
}
