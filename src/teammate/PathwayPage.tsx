import { NavLink } from "react-router-dom";
import { totalXP, type AppState } from "../../shared/domain";
import { resources } from "../../shared/resources";
import { ClimbCard } from "./ClimbCard";
import { pathwayFor } from "./pathway";
import { Button, Card, Chip, PageHeader, PathDoodle } from "./ui";
export function PathwayPage({
  state,
  onEdit,
}: {
  state: AppState;
  onEdit: () => void;
}) {
  const p = state.profile!;
  const plan = [...state.plans].sort((a, b) => b.week.localeCompare(a.week))[0];
  const path = pathwayFor(state);
  const stage = path.stages.find((s) => s.status === "current");
  const ids = new Set(plan?.tasks.flatMap((t) => t.resourceIds));
  return (
    <div className="flex flex-col gap-7">
      <PageHeader
        eyebrow="Your pathway"
        title={`${p.name.split(" ")[0]}’s next chapter`}
        subtitle="A direction to explore. A path that grows with you."
        actions={
          <>
            <Button variant="secondary" onClick={onEdit}>
              Edit your goals
            </Button>
            <Button href="/plan">See this week →</Button>
          </>
        }
      />
      <div className="tp-path-grid">
        <div>
          <ClimbCard
            pathway={path}
            xp={totalXP(state)}
            initials={p.name
              .split(" ")
              .map((s) => s[0])
              .slice(0, 2)
              .join("")}
          />
          <ol className="tp-mobile-milestones">
            {path.stages.map((s, i) => (
              <li key={i}>
                <strong>
                  {i + 1}. {s.name}
                </strong>
                <span>{s.timing}</span>
              </li>
            ))}
          </ol>
        </div>
        <div className="flex flex-col gap-5">
          <Card>
            <Chip tone="gold">Current milestone</Chip>
            <h2 className="mt-4 font-display text-[24px] font-bold">
              {stage?.name}
            </h2>
            <p className="mt-3 text-[14px] text-muted">
              Your completed quests and projects move you along this trail. Each
              100 XP unlocks another level.
            </p>
            <p className="mt-3 text-[12px] text-muted">
              Milestones indicate exploration progress, not verified career
              readiness.
            </p>
            <NavLink
              to="/plan"
              className="mt-5 inline-block font-semibold text-cardinal"
            >
              View your next quests →
            </NavLink>
          </Card>
          <Card>
            <h2 className="font-display text-[20px] font-bold">
              Why this path?
            </h2>
            <p className="mt-3 text-[14px] text-muted">
              {plan?.direction || p.goal}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {p.interests.map((i) => (
                <Chip key={i} tone="blue">
                  {i}
                </Chip>
              ))}
            </div>
          </Card>
          <Card>
            <h2 className="font-display text-[20px] font-bold">
              Grounded in USC resources
            </h2>
            <div className="mt-3 flex flex-col gap-3">
              {resources
                .filter((r) => ids.has(r.id))
                .slice(0, 4)
                .map((r) => (
                  <a
                    className="text-[14px] font-semibold text-cardinal"
                    href={r.url}
                    target="_blank"
                    rel="noreferrer"
                    key={r.id}
                  >
                    {r.title} ↗
                  </a>
                ))}
            </div>
            <NavLink
              className="mt-4 inline-block text-[13px] text-muted"
              to="/resources"
            >
              Explore all resources →
            </NavLink>
          </Card>
          <div className="rounded-[20px] bg-cardinal p-6 text-white">
            <PathDoodle />
            <h3 className="mt-3 font-display text-[21px] font-bold text-white">
              One good step at a time.
            </h3>
            <p className="mt-2 text-[14px] text-white/80">
              Your path belongs to you. Try something, reflect, and adjust.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
