import { HACKSC_TASK_TITLE, HACKSC_URL } from "../../shared/demoTasks";
import { useEffect, useState } from "react";
import {
  Check,
  ChevronDown,
  Clock3,
  Rocket,
  Wrench,
  Compass,
  Microscope,
  Users,
} from "lucide-react";
import type { Task } from "../../shared/domain";
import { resources } from "../../shared/resources";
import { Button, cx } from "./ui";
export function TaskCard({
  task: t,
  busy,
  onStatus,
  onReflection,
  onReplace,
}: {
  task: Task;
  index?: number;
  busy: boolean;
  onStatus: (status: Task["status"]) => void;
  onReflection: (text: string) => void;
  onReplace: () => void;
}) {
  const [expanded, setExpanded] = useState(false),
    [reflection, setReflection] = useState(t.reflection);
  useEffect(() => setReflection(t.reflection), [t.reflection]);
  const done = t.status === "completed";
  return (
    <article
      className={cx(
        "tp-task",
        done && "tp-task-done",
        t.status === "skipped" && "tp-task-skipped",
      )}
    >
      <div className="tp-task-line">
        <button
          className={cx("ref-task-toggle", done && "done")}
          aria-label={`Complete ${t.title}`}
          aria-pressed={done}
          title="Complete"
          disabled={busy || t.status === "skipped"}
          onClick={() => onStatus(done ? "suggested" : "completed")}
        >
          {done && <Check size={22} />}
        </button>
        <div className="min-w-0 flex-1">
          <h3>{t.title}</h3>
          <span className="tp-task-meta">
            {
              {
                projects: "Project",
                skills: "Skill",
                exploration: "Explore",
                research: "Research",
                networking: "Connect",
              }[t.category]
            }{" "}
            · <Clock3 size={12} />
            {t.minutes} min
          </span>
        </div>
        <span className="ref-task-xp">+{t.xp} XP</span>
        <button
          className="ref-task-expand"
          aria-label={`Evidence & reflection: ${t.title}`}
          aria-expanded={expanded}
          title="Evidence & reflection"
          onClick={() => setExpanded(!expanded)}
        >
          <ChevronDown
            size={17}
            style={{ transform: expanded ? "rotate(180deg)" : undefined }}
          />
        </button>
      </div>
      {expanded && (
        <div className="tp-task-details">
          <p>{t.instructions}</p>
          <p>
            <strong>Done when:</strong> {t.criteria}
          </p>
          <details>
            <summary>Why suggested?</summary>
            <p>{t.why}</p>
          </details>
          {t.title === HACKSC_TASK_TITLE && (
            <a href={HACKSC_URL} target="_blank" rel="noreferrer">
              HackSC event information ↗
            </a>
          )}
          {t.resourceIds.map((id) => {
            const r = resources.find((r) => r.id === id);
            return r ? (
              <a key={id} href={r.url} target="_blank" rel="noreferrer">
                {r.title} ↗
              </a>
            ) : null;
          })}
          <label>
            Evidence & reflection
            <textarea
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              placeholder="Add a reflection, project link, or other evidence."
              maxLength={4000}
            />
          </label>
          <div className="flex flex-wrap items-center gap-4">
            <Button
              variant="secondary"
              className="px-3 py-2 text-[12px]"
              disabled={busy}
              onClick={() => onReflection(reflection)}
            >
              Save reflection
            </Button>
            {!done && t.status !== "skipped" && (
              <>
                <button disabled={busy} onClick={onReplace}>
                  Replace
                </button>
                <button disabled={busy} onClick={() => onStatus("skipped")}>
                  Skip
                </button>
              </>
            )}
            {t.status === "skipped" && (
              <button disabled={busy} onClick={() => onStatus("suggested")}>
                Restore
              </button>
            )}
          </div>
        </div>
      )}
    </article>
  );
}
