import { totalXP, type AppState } from "../../shared/domain";
export function badgesFor(state: AppState) {
  const questWins = state.xp.filter((e) => e.key.startsWith("task:")).length;
  const weeks = [...new Set(state.checkins.map((c) => c.week))].sort();
  let best = 0,
    run = 0,
    last = 0;
  for (const week of weeks) {
    const day = Date.parse(week + "T12:00:00Z");
    run = day - last === 7 * 86400000 ? run + 1 : 1;
    best = Math.max(best, run);
    last = day;
  }
  const cleared =
    state.plans.some(
      (p) =>
        p.tasks.length > 0 && p.tasks.every((t) => t.status === "completed"),
    ) ||
    state.checkins.some((c) => {
      const tasks = state.plans.find((p) => p.week === c.week)?.tasks || [];
      return (
        tasks.length > 0 && tasks.every((t) => c.confirmed?.includes(t.id))
      );
    });
  return [
    {
      id: "first",
      name: "First Step",
      hint: "Complete a task",
      icon: "footprints",
      earned: questWins > 0,
    },
    {
      id: "roll",
      name: "On a Roll",
      hint: "Complete 5 tasks",
      icon: "sparkles",
      earned: questWins >= 5,
    },
    {
      id: "builder",
      name: "Builder",
      hint: "Finish a project",
      icon: "rocket",
      earned: state.xp.some((e) => e.key.startsWith("project:")),
    },
    {
      id: "reflect",
      name: "Reflector",
      hint: "Do a weekly check-in",
      icon: "book",
      earned: state.checkins.length > 0,
    },
    {
      id: "week",
      name: "Week Cleared",
      hint: "Complete every task in a week",
      icon: "check",
      earned: cleared,
    },
    {
      id: "streak",
      name: "Hot Streak",
      hint: "3-week check-in streak",
      icon: "flame",
      earned: best >= 3,
    },
    {
      id: "climber",
      name: "Pathfinder",
      hint: "Reach level 3",
      icon: "mountain",
      earned: totalXP(state) >= 200,
    },
    {
      id: "curious",
      name: "Curious Mind",
      hint: "Add 3 interests",
      icon: "compass",
      earned: (state.profile?.interests.length || 0) >= 3,
    },
  ];
}
