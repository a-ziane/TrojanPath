import { useEffect, useRef, useState } from "react";
import {
  Check,
  Download,
  FileText,
  MessageSquare,
  Pencil,
  Plus,
  X,
} from "lucide-react";
import { resumeText, type AppState, type Profile } from "../../shared/domain";
import {
  addResumeEntry,
  completedActivities,
  linkedInDraft,
  resumeSuggestion,
  type PortfolioPatch,
} from "../portfolio";
import { formatResume } from "../resumeFormat";
import { downloadResumePDF } from "../resumePdf";
import { Button } from "./ui";

export function PortfolioPage({
  state,
  onSave,
}: {
  state: AppState;
  onSave: (patch: Partial<PortfolioPatch>) => Promise<void>;
}) {
  const profile = state.profile!;
  const activities = completedActivities(state);
  const [text, setText] = useState(
    profile.resumeDraft || resumeText(profile, []),
  );
  const [review, setReview] = useState<NonNullable<Profile["portfolioReview"]>>(
    profile.portfolioReview || {},
  );
  const [entries, setEntries] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState<string | null>(null);
  const [posts, setPosts] = useState(profile.portfolioPosts || {});
  const [selected, setSelected] = useState(activities[0]?.id || "");
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [error, setError] = useState(""),
    [showReviewed, setShowReviewed] = useState(false);
  const [editingDocument, setEditingDocument] = useState(false);
  const formatted = formatResume(text, profile.name);
  const paper = useRef<HTMLTextAreaElement>(null);
  const activity = activities.find((a) => a.id === selected) || activities[0];
  const draft = activity ? (posts[activity.id] ?? linkedInDraft(activity)) : "";
  const pending = activities.filter((a) => !review[a.id]);
  useEffect(() => {
    if (paper.current) {
      paper.current.style.height = "auto";
      paper.current.style.height = `${Math.max(880, paper.current.scrollHeight)}px`;
    }
  }, [text, editingDocument]);
  async function save(patch: Partial<PortfolioPatch>, success: string) {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await onSave(patch);
      if (patch.resumeDraft !== undefined) setText(patch.resumeDraft);
      if (patch.portfolioReview) setReview(patch.portfolioReview);
      if (patch.portfolioPosts) setPosts(patch.portfolioPosts);
      setMessage(success);
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      return false;
    } finally {
      setBusy(false);
    }
  }
  async function accept(id: string, proposed: string) {
    try {
      const next = addResumeEntry(text, proposed);
      if (
        await save(
          {
            resumeDraft: next,
            portfolioReview: {
              ...review,
              [id]: { status: "accepted", text: proposed.trim() },
            },
          },
          "Added to your résumé and saved.",
        )
      )
        setEditing(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }
  async function download() {
    setBusy(true);
    setError("");
    try {
      await downloadResumePDF(profile.name, text);
    } catch {
      setError(
        "Could not create the PDF. Try again or use your browser’s Print / Save as PDF.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="portfolio-page">
      <div className="portfolio-page-heading">
        <div>
          <h1>Portfolio</h1>
          <p>Turn completed work into your next opportunity.</p>
        </div>
        <Button onClick={download} disabled={busy}>
          <Download size={15} />
          Download résumé
        </Button>
      </div>
      <div className="portfolio-layout">
        <div className="portfolio-main">
          <section className="portfolio-suggestions">
            <div className="portfolio-panel-heading">
              <h2>
                <Plus size={17} />
                Résumé suggestions
              </h2>
              <span>{pending.length} to review</span>
            </div>
            <p className="portfolio-subtitle">
              Based on completed activities. Review the wording before adding
              it.
            </p>
            {pending.length === 0 && (
              <p className="portfolio-empty">
                {activities.length
                  ? "You’re all caught up. Complete another activity for new suggestions."
                  : "Complete a task or project to see suggestions here."}
              </p>
            )}
            {pending.map((a) => {
              const proposed = entries[a.id] ?? resumeSuggestion(a);
              return (
                <article className="portfolio-suggestion" key={a.id}>
                  <div className="portfolio-source">
                    <span>{a.kind}</span>
                    <strong>{a.title}</strong>
                  </div>
                  {editing === a.id ? (
                    <label className="portfolio-edit-label">
                      Edit résumé addition
                      <textarea
                        value={proposed}
                        maxLength={1500}
                        onChange={(e) =>
                          setEntries({ ...entries, [a.id]: e.target.value })
                        }
                      />
                    </label>
                  ) : (
                    <p>{proposed}</p>
                  )}
                  {proposed.length > 1500 && (
                    <p className="portfolio-subtitle">
                      Shorten this addition to 1,500 characters before
                      accepting.
                    </p>
                  )}
                  <div className="portfolio-suggestion-actions">
                    <button
                      className="portfolio-accept"
                      disabled={
                        busy || !proposed.trim() || proposed.length > 1500
                      }
                      onClick={() => void accept(a.id, proposed)}
                    >
                      <Check size={13} />
                      {editing === a.id ? "Save & accept" : "Accept"}
                    </button>
                    <button
                      disabled={busy}
                      aria-expanded={editing === a.id}
                      onClick={() => {
                        if (editing === a.id) {
                          setEntries((current) => {
                            const next = { ...current };
                            delete next[a.id];
                            return next;
                          });
                          setEditing(null);
                        } else setEditing(a.id);
                      }}
                    >
                      <Pencil size={12} />
                      {editing === a.id ? "Cancel edit" : "Edit"}
                    </button>
                    <button
                      disabled={busy}
                      onClick={() =>
                        void save(
                          {
                            portfolioReview: {
                              ...review,
                              [a.id]: {
                                status: "dismissed",
                                text: proposed.slice(0, 1500),
                              },
                            },
                          },
                          "Suggestion dismissed.",
                        )
                      }
                    >
                      <X size={13} />
                      Dismiss
                    </button>
                  </div>
                </article>
              );
            })}
            {Object.keys(review).length > 0 && (
              <>
                <button
                  className="portfolio-history-toggle"
                  aria-expanded={showReviewed}
                  onClick={() => setShowReviewed(!showReviewed)}
                >
                  Reviewed suggestions {showReviewed ? "−" : "+"}
                </button>
                {showReviewed &&
                  activities
                    .filter((a) => review[a.id])
                    .map((a) => (
                      <div className="portfolio-reviewed" key={a.id}>
                        <span>
                          {a.title}
                          <small>
                            {review[a.id].status === "accepted"
                              ? "Added to résumé"
                              : "Dismissed"}
                          </small>
                        </span>
                        {review[a.id].status === "dismissed" && (
                          <button
                            disabled={busy}
                            onClick={() => {
                              const next = { ...review };
                              delete next[a.id];
                              void save(
                                { portfolioReview: next },
                                "Suggestion restored.",
                              );
                            }}
                          >
                            Restore
                          </button>
                        )}
                      </div>
                    ))}
              </>
            )}
          </section>
          <section className="tp-document-editor">
            <div className="tp-doc-toolbar">
              <div>
                <h2>
                  <FileText size={15} />
                  {profile.name} — Résumé
                </h2>
                <span>
                  {text === (profile.resumeDraft || "")
                    ? "Saved"
                    : "Unsaved changes"}{" "}
                  · {text.length}/4000
                </span>
              </div>
              <Button
                variant="secondary"
                className="px-3 py-2 text-[12px]"
                disabled={busy}
                onClick={() =>
                  void save({ resumeDraft: text }, "Résumé saved.")
                }
              >
                Save
              </Button>
            </div>
            <div className="resume-format-bar">
              <span>Harvard-style · US Letter</span>
              <button
                type="button"
                onClick={() => setEditingDocument(!editingDocument)}
              >
                {editingDocument ? "Preview résumé" : "Edit résumé"}
              </button>
            </div>
            <div className="tp-doc-ruler" aria-hidden="true">
              1 · · · · 2 · · · · 3 · · · · 4 · · · · 5 · · · · 6
            </div>
            <div className="tp-doc-canvas">
              {editingDocument ? (
                <textarea
                  ref={paper}
                  aria-label="Editable résumé document"
                  className="tp-doc-paper"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  maxLength={4000}
                  spellCheck
                />
              ) : (
                <article
                  className="harvard-resume"
                  aria-label="Formatted résumé preview"
                >
                  <h1>{formatted.name}</h1>
                  {formatted.blocks.map((block, index) =>
                    block.kind === "heading" ? (
                      <h2 key={index}>{block.text}</h2>
                    ) : (
                      <p key={index} className={`resume-${block.kind}`}>
                        {block.kind === "bullet" && (
                          <span aria-hidden="true">• </span>
                        )}
                        {block.text}
                      </p>
                    ),
                  )}
                </article>
              )}
            </div>
            <div className="print-material">
              <pre>{text}</pre>
            </div>
          </section>
        </div>
        <aside className="portfolio-social">
          <div className="portfolio-panel-heading">
            <h2>
              <MessageSquare size={17} />
              LinkedIn drafts
            </h2>
          </div>
          <p className="portfolio-subtitle">
            Projects, events, and small wins. Edit before sharing.
          </p>
          {activity ? (
            <>
              <label>
                Choose an activity
                <select
                  aria-label="LinkedIn activity"
                  value={activity.id}
                  onChange={(e) => {
                    setSelected(e.target.value);
                    setMessage("");
                  }}
                >
                  {activities.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.title}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Edit your post
                <textarea
                  aria-label="LinkedIn post draft"
                  rows={13}
                  maxLength={5000}
                  value={draft}
                  onChange={(e) =>
                    setPosts({ ...posts, [activity.id]: e.target.value })
                  }
                />
              </label>
              <div className="portfolio-social-actions">
                <Button
                  variant="secondary"
                  disabled={busy}
                  onClick={() =>
                    void save(
                      { portfolioPosts: { ...posts, [activity.id]: draft } },
                      "LinkedIn draft saved.",
                    )
                  }
                >
                  Save draft
                </Button>
                <Button
                  disabled={busy}
                  onClick={() => {
                    void navigator.clipboard
                      .writeText(draft)
                      .then(() => setMessage("Post copied."))
                      .catch(() =>
                        setError(
                          "Copy unavailable. Select and copy the draft manually.",
                        ),
                      );
                  }}
                >
                  Copy post
                </Button>
              </div>
              <button
                className="portfolio-history-toggle"
                onClick={() =>
                  setPosts({ ...posts, [activity.id]: linkedInDraft(activity) })
                }
              >
                Reset draft
              </button>
            </>
          ) : (
            <p className="portfolio-empty">
              Your completed projects and activities will appear here.
            </p>
          )}
        </aside>
      </div>
      {error && (
        <div className="portfolio-feedback error" role="alert">
          {error}
        </div>
      )}
      {message && (
        <div className="portfolio-feedback" role="status">
          {message}
        </div>
      )}
    </div>
  );
}
