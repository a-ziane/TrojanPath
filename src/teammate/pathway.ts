import { totalXP, type AppState } from "../../shared/domain";
export type Theme = "software" | "health" | "music" | "research";
export interface Pathway {
  theme: Theme;
  stages: {
    name: string;
    timing: string;
    status: "done" | "current" | "next";
  }[];
}
export function levelFor(xp: number) {
  const level = Math.floor(xp / 100) + 1;
  return {
    level,
    name: ["Explorer", "Builder", "Maker", "Trailblazer"][
      Math.min(level - 1, 3)
    ],
    nextAt: level * 100,
    pct: (xp % 100) / 100,
  };
}
export function pathwayFor(state: AppState): Pathway {
  const plan = [...state.plans].sort((a, b) => b.week.localeCompare(a.week))[0];
  const names = plan?.milestones ?? [
    "Explore your direction",
    "Build something real",
    "Show your strengths",
  ];
  const current = Math.min(names.length - 1, Math.floor(totalXP(state) / 100));
  const themes: Record<string, Theme> = {
    technology: "software",
    healthcare: "health",
    research: "research",
    "creative arts": "music",
  };
  return {
    theme: themes[state.profile?.theme ?? "technology"] ?? "software",
    stages: names.map((name, i) => ({
      name,
      timing:
        i === current
          ? "You’re here · keep exploring"
          : `${i * 100} XP milestone`,
      status: i < current ? "done" : i === current ? "current" : "next",
    })),
  };
}
