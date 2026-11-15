import { useEffect, useState } from "react";
import { askSkillQuestion } from "../repository";
export function SkillPrompt({
  skill,
  value,
  onChange,
  mode,
  isNew,
}: {
  skill: string;
  value: string;
  onChange: (value: string) => void;
  mode: "demo" | "live";
  isNew: boolean;
}) {
  const fallback = `How do you use ${skill} in your projects or everyday work?`;
  const [question, setQuestion] = useState(fallback);
  const [status, setStatus] = useState("");
  useEffect(() => {
    if (!isNew || mode === "demo") return;
    let cancelled = false;
    setStatus("Asking Gemini…");
    const timer = setTimeout(() => {
      void askSkillQuestion(skill)
        .then((q) => {
          if (!cancelled) {
            setQuestion(q);
            setStatus("Gemini");
          }
        })
        .catch(() => {
          if (!cancelled)
            setStatus("AI unavailable · You can still answer below");
        });
    }, 500);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [skill, mode, isNew]);
  return (
    <label className="tp-skill-prompt">
      <span>{question}</span>
      {status && <small role="status">{status}</small>}
      <textarea
        rows={2}
        maxLength={1000}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="A real example, project, or how often you use it"
      />
    </label>
  );
}
