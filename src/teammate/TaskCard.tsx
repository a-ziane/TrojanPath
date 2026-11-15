import { useState } from "react";
import { Check } from "lucide-react";
import type { Task } from "../../shared/domain";
import { resources } from "../../shared/resources";
import { Button, Chip, cx } from "./ui";

export function TaskCard({
  task: t,
  index,
  busy,
  onStatus,
  onReflection,
  onReplace,
}: {
  task: Task;
  index: number;
  busy: boolean;
  onStatus: (status: Task["status"]) => void;
  onReflection: (text: string) => void;
  onReplace: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [reflection, setReflection] = useState(t.reflection);
  const done = t.status === "completed";
  return (
    <article
      className={cx(
        "rounded-[20px] border bg-surface p-6 transition-colors",
        done ? "border-success/30 bg-success-soft/30" : "border-border",
        t.status === "skipped" && "opacity-70",
      )}
    >
      <div className="flex items-start gap-4">
        <button
          type="button"
          role="checkbox"
          aria-checked={done}
          aria-label={`Complete ${t.title}`}
          disabled={busy || done || t.status === "skipped"}
          onClick={() => onStatus("completed")}
          className={cx(
            "mt-1 flex size-6 shrink-0 items-center justify-center rounded-[7px] border-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cardinal",
            done
              ? "border-success bg-success text-white"
              : "border-border hover:border-cardinal",
          )}
        >
          {done && <Check size={16} />}
        </button>
        <div className="min-w-0 flex-1">
          <div className="mb-3 flex flex-wrap gap-2">
            <Chip tone={done ? "success" : "cardinal"}>
              {done ? "Completed" : t.category}
            </Chip>
            <Chip tone="neutral">{t.minutes} min</Chip>
            <span className="text-[12px] text-muted">Quest {index + 1}</span>
          </div>
          <h2 className="font-display text-[18px] leading-snug font-bold">
            {t.title}
          </h2>
          <p className="mt-2 text-[14px] leading-relaxed text-muted">
            {t.instructions}
          </p>
        </div>
        <Chip tone="gold">+{t.xp} XP</Chip>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
        <button
          onClick={() => setExpanded(!expanded)}
          aria-expanded={expanded}
          className="text-[13px] font-semibold text-cardinal"
        >
          {expanded ? "Hide details ↑" : "Why this fits you ↓"}
        </button>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-[12px] text-muted">{t.status}</span>
          {!["completed", "skipped"].includes(t.status) && (
            <>
              <button
                className="text-[13px] text-muted"
                disabled={busy}
                onClick={onReplace}
              >
                Replace
              </button>
              <button
                className="text-[13px] text-muted"
                disabled={busy}
                onClick={() => onStatus("skipped")}
              >
                Skip
              </button>
              {t.status === "suggested" && (
                <Button
                  variant="secondary"
                  className="px-3 py-2 text-[12px]"
                  disabled={busy}
                  onClick={() => onStatus("in progress")}
                >
                  Accept
                </Button>
              )}
              <Button
                className="px-3 py-2 text-[12px]"
                disabled={busy}
                onClick={() => onStatus("completed")}
              >
                Complete
              </Button>
            </>
          )}
          {t.status === "skipped" && (
            <Button
              variant="secondary"
              disabled={busy}
              onClick={() => onStatus("suggested")}
            >
              Restore suggestion
            </Button>
          )}
        </div>
      </div>
      {expanded && (
        <div className="mt-5 flex flex-col gap-4 rounded-[12px] bg-bg p-4 text-[14px]">
          <p>
            <strong>Why it fits:</strong> {t.why}
          </p>
          <p>
            <strong>Done when:</strong> {t.criteria}
          </p>
          {t.resourceIds.map((id) => {
            const r = resources.find((r) => r.id === id);
            return r ? (
              <a
                className="font-semibold text-cardinal"
                href={r.url}
                target="_blank"
                rel="noreferrer"
                key={id}
              >
                {r.title} ↗
              </a>
            ) : null;
          })}
          <label className="flex flex-col gap-2">
            Reflection or evidence
            <textarea
              className="rounded-lg border border-border bg-surface p-3"
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              placeholder="What did you learn? Add a note or evidence link."
            />
          </label>
          <Button
            variant="secondary"
            disabled={busy}
            onClick={() => onReflection(reflection)}
          >
            Save reflection
          </Button>
        </div>
      )}
    </article>
  );
}
