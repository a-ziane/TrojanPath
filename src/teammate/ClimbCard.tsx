import { BriefcaseBusiness, Check, Star } from "lucide-react";
import type { Pathway } from "./pathway";
import { TrojanGuide } from "./TrojanGuide";

/** Every milestone is a physical floor; the guide stays on the ladder. */
export function ClimbCard({
  pathway,
  outfit = "cardinal",
}: {
  pathway: Pathway;
  outfit?: "cardinal" | "gold" | "sage";
}) {
  const stages = pathway.stages.slice(0, 5);
  const current = Math.max(
    0,
    stages.findIndex((stage) => stage.status === "current"),
  );
  return (
    <section
      className={`career-building career-${pathway.theme}`}
      aria-label="Career ladder"
    >
      <header className="career-building-header">
        <span>
          <BriefcaseBusiness size={17} />
          Your career ladder
        </span>
        <span>
          {current + 1}/{stages.length}
        </span>
      </header>
      <div className="career-floors" style={{ height: stages.length * 112 }}>
        <div className="career-ladder-rails" aria-hidden="true" />
        <div className="career-guide" style={{ bottom: current * 112 + 6 }}>
          <TrojanGuide outfit={outfit} />
        </div>
        {stages.map((stage, i) => (
          <div
            className={`career-floor ${i === current ? "current" : ""} ${stage.status === "done" ? "reached" : ""}`}
            key={i}
            style={{ bottom: i * 112 }}
          >
            <div className="career-rung" aria-hidden="true" />
            <div className="career-floor-content">
              <div className="career-floor-meta">
                <span>
                  {stage.status === "done" ? (
                    <>
                      <Star size={11} />
                      Reached
                    </>
                  ) : i === current ? (
                    "You are here"
                  ) : (
                    `Level ${i + 1}`
                  )}
                </span>
                {i === current && <span className="career-current-dot" />}
              </div>
              <h3>{stage.name}</h3>
              <p>
                {i === current
                  ? "Keep building your experience"
                  : stage.status === "done"
                    ? "Milestone reached"
                    : `${i * 100} XP milestone`}
              </p>
            </div>
            <span className="career-floor-number" aria-hidden="true">
              {stage.status === "done" ? (
                <Check size={15} />
              ) : (
                String(i + 1).padStart(2, "0")
              )}
            </span>
          </div>
        ))}
      </div>
      <div className="career-building-base">
        <span />
        <span />
        <span />
      </div>
    </section>
  );
}
