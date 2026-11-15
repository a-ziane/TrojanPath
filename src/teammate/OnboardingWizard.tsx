import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import {
  profileSchema,
  projectSchema,
  localDate,
  type Profile,
  type Project,
} from "../../shared/domain";
import { uploadFile } from "../repository";
import { SkillPrompt } from "./SkillPrompt";
import { TrojanGuide } from "./TrojanGuide";

type Step = { id: string; question: string; optional?: boolean };
function Tags({
  values,
  onChange,
  suggestions,
}: {
  values: string[];
  onChange: (v: string[]) => void;
  suggestions: string[];
}) {
  const [custom, setCustom] = useState("");
  const add = () => {
    const text = custom.trim();
    if (text && !values.includes(text)) onChange([...values, text]);
    setCustom("");
  };
  return (
    <div className="tp-wizard-tags">
      <div>
        {Array.from(new Set([...suggestions, ...values])).map((value) => (
          <button
            key={value}
            type="button"
            aria-pressed={values.includes(value)}
            onClick={() =>
              onChange(
                values.includes(value)
                  ? values.filter((v) => v !== value)
                  : [...values, value],
              )
            }
          >
            {values.includes(value) && <Check size={13} />} {value}
          </button>
        ))}
      </div>
      <div className="tp-custom-tag">
        <input
          aria-label="Add your own"
          maxLength={80}
          placeholder="Add your own"
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
        />
        <button type="button" onClick={add}>
          Add
        </button>
      </div>
    </div>
  );
}
export function OnboardingWizard({
  initial,
  mode,
  busy,
  onSave,
}: {
  initial: Profile;
  mode: "demo" | "live";
  busy: boolean;
  onSave: (p: Profile, projects?: Project[]) => void;
}) {
  const [p, setP] = useState(initial),
    [projects, setProjects] = useState<Project[]>([]),
    [stepId, setStepId] = useState("name"),
    [error, setError] = useState(""),
    [uploading, setUploading] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const update = <K extends keyof Profile>(key: K, value: Profile[K]) =>
    setP((p) => ({ ...p, [key]: value }));
  const steps: Step[] = [
    { id: "name", question: "What should we call you?" },
    { id: "major", question: "What are you studying?" },
    { id: "minor", question: "Do you have a minor?", optional: true },
    { id: "degree", question: "What degree are you working toward?" },
    { id: "standing", question: "Where are you in your degree?" },
    { id: "graduation", question: "When do you expect to graduate?" },
    {
      id: "background",
      question: "What have you done so far?",
      optional: true,
    },
    { id: "goal", question: "What would you like to explore?" },
    { id: "interests", question: "What sparks your curiosity?" },
    { id: "skills", question: "What skills or tools do you use?" },
    ...p.skills.map((skill) => ({
      id: `skill:${skill}`,
      question: `Tell us about ${skill}`,
      optional: true,
    })),
    { id: "projects", question: "What are you working on?", optional: true },
    { id: "resume", question: "Want to add your résumé?", optional: true },
    { id: "hours", question: "How much time do you have each week?" },
  ];
  const index = Math.max(
    0,
    steps.findIndex((s) => s.id === stepId),
  );
  const step = steps[index];
  const last = index === steps.length - 1;
  useEffect(() => {
    heading.current?.focus();
  }, [stepId]);
  function next() {
    setError("");
    if (step.id === "projects")
      for (const project of projects) {
        const result = projectSchema.safeParse(project);
        if (!result.success) {
          setError(result.error.issues[0].message);
          return;
        }
      }
    if (last) {
      const result = profileSchema.safeParse(p);
      if (!result.success) {
        setError(result.error.issues[0].message);
        return;
      }
      onSave(result.data, projects);
    } else setStepId(steps[index + 1].id);
  }
  const field = (
    key: "name" | "major" | "minor" | "standing" | "goal",
    placeholder: string,
    required = false,
  ) => (
    <input
      aria-label={step.question}
      required={required}
      maxLength={key === "name" ? 100 : key === "major" ? 150 : 4000}
      value={p[key]}
      placeholder={placeholder}
      onChange={(e) => update(key, e.target.value)}
    />
  );
  const skill = step.id.startsWith("skill:") ? step.id.slice(6) : "";
  return (
    <section className="tp-onboarding-wizard">
      <div className="tp-wizard-top">
        <span className="tp-wizard-guide">
          <TrojanGuide />
        </span>
        <div>
          <span className="tp-wizard-kicker">Build your path</span>
          <p>
            Question {index + 1} of {steps.length}
          </p>
        </div>
      </div>
      <div
        className="tp-wizard-progress"
        role="progressbar"
        aria-label="Onboarding progress"
        aria-valuemin={0}
        aria-valuemax={steps.length}
        aria-valuenow={index + 1}
      >
        <span style={{ width: `${((index + 1) / steps.length) * 100}%` }} />
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          next();
        }}
      >
        <h1 ref={heading} tabIndex={-1}>
          {step.question}
        </h1>
        {step.optional && <span className="tp-optional">Optional</span>}
        <div className="tp-wizard-answer" key={step.id}>
          {step.id === "name" && field("name", "Your name", true)}
          {step.id === "major" && field("major", "Your major", true)}
          {step.id === "minor" && field("minor", "Your minor")}
          {step.id === "degree" && (
            <select
              aria-label={step.question}
              value={p.degree}
              onChange={(e) =>
                update("degree", e.target.value as Profile["degree"])
              }
            >
              <option>Undergraduate</option>
              <option>Master’s</option>
              <option>PhD</option>
            </select>
          )}
          {step.id === "standing" &&
            field("standing", "e.g. Junior or Year 2", true)}
          {step.id === "graduation" && (
            <input
              aria-label={step.question}
              type="month"
              required
              value={p.graduation}
              onChange={(e) => update("graduation", e.target.value)}
            />
          )}
          {step.id === "background" && (
            <textarea
              aria-label={step.question}
              maxLength={4000}
              rows={5}
              value={p.experiences}
              onChange={(e) => update("experiences", e.target.value)}
              placeholder="Work, classes, volunteering, research, or anything you’ve tried"
            />
          )}
          {step.id === "goal" && (
            <>
              {field("goal", "A goal, career direction, or an idea")}
              <button
                type="button"
                className="tp-detail-button"
                onClick={() => update("goal", "I’m exploring")}
              >
                I’m still exploring
              </button>
              <label className="tp-wizard-check">
                <input
                  type="checkbox"
                  checked={p.research}
                  onChange={(e) => update("research", e.target.checked)}
                />
                <span>I’m interested in research or graduate school</span>
              </label>
            </>
          )}
          {step.id === "interests" && (
            <Tags
              values={p.interests}
              onChange={(v) => update("interests", v)}
              suggestions={[
                "Technology",
                "Healthcare",
                "Research",
                "Design",
                "Film",
                "Writing",
                "Machine learning",
              ]}
            />
          )}
          {step.id === "skills" && (
            <Tags
              values={p.skills}
              onChange={(v) => update("skills", v)}
              suggestions={[
                "Figma",
                "Cursor",
                "Codex",
                "Python",
                "Statistics",
                "Communication",
                "Design",
                "Writing",
              ]}
            />
          )}
          {skill && (
            <SkillPrompt
              skill={skill}
              value={p.skillContext?.[skill] || ""}
              onChange={(answer) =>
                update("skillContext", { ...p.skillContext, [skill]: answer })
              }
              mode={mode}
              isNew={!initial.skills.includes(skill)}
            />
          )}
          {step.id === "projects" && (
            <div className="tp-wizard-projects">
              {projects.map((project, i) => (
                <div className="tp-project-fields" key={project.id}>
                  <label>
                    Project title
                    <input
                      required
                      minLength={2}
                      maxLength={150}
                      value={project.title}
                      onChange={(e) =>
                        setProjects((items) =>
                          items.map((x, j) =>
                            j === i ? { ...x, title: e.target.value } : x,
                          ),
                        )
                      }
                    />
                  </label>
                  <label>
                    Project link
                    <input
                      type="url"
                      placeholder="https://…"
                      value={project.url}
                      onChange={(e) =>
                        setProjects((items) =>
                          items.map((x, j) =>
                            j === i ? { ...x, url: e.target.value } : x,
                          ),
                        )
                      }
                    />
                  </label>
                  <label>
                    What are you building?
                    <textarea
                      required
                      minLength={5}
                      maxLength={3000}
                      value={project.description}
                      onChange={(e) =>
                        setProjects((items) =>
                          items.map((x, j) =>
                            j === i ? { ...x, description: e.target.value } : x,
                          ),
                        )
                      }
                    />
                  </label>
                  <button
                    type="button"
                    className="tp-detail-button"
                    onClick={() =>
                      setProjects((items) => items.filter((_, j) => j !== i))
                    }
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="secondary"
                onClick={() =>
                  setProjects((items) => [
                    ...items,
                    {
                      id: crypto.randomUUID(),
                      title: "",
                      description: "",
                      url: "",
                      date: localDate(),
                      skills: [],
                      completed: false,
                    },
                  ])
                }
              >
                + Add project
              </button>
            </div>
          )}
          {step.id === "resume" && (
            <label className="tp-wizard-upload">
              <input
                aria-label="Upload résumé"
                type="file"
                accept=".pdf,.txt"
                disabled={uploading}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setUploading(true);
                  setError("");
                  try {
                    update("resumePath", await uploadFile(file, mode));
                  } catch (err) {
                    setError(err instanceof Error ? err.message : String(err));
                  } finally {
                    setUploading(false);
                  }
                }}
              />
              <span>
                {uploading
                  ? "Uploading…"
                  : p.resumePath
                    ? "Résumé attached"
                    : "PDF or text · Up to 2 MB"}
              </span>
            </label>
          )}
          {step.id === "hours" && (
            <label className="tp-hours-answer">
              <input
                aria-label="Hours available each week"
                type="number"
                required
                min="0.25"
                max="30"
                step="0.25"
                value={p.hours}
                onChange={(e) => update("hours", Number(e.target.value))}
              />
              <span>hours per week</span>
            </label>
          )}
        </div>
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
        <div className="tp-wizard-actions">
          <button
            type="button"
            className="tp-wizard-back"
            disabled={index === 0 || busy || uploading}
            onClick={() => {
              setError("");
              setStepId(steps[index - 1].id);
            }}
          >
            <ArrowLeft size={15} />
            Back
          </button>
          <button
            type="submit"
            className="primary"
            disabled={busy || uploading}
          >
            {busy
              ? "Building your path…"
              : last
                ? "Build my path"
                : step.optional
                  ? "Continue / skip"
                  : "Continue"}
            <ArrowRight size={16} />
          </button>
        </div>
      </form>
    </section>
  );
}
