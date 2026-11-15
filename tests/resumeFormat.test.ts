import { describe, expect, it } from "vitest";
import { formatResume } from "../src/resumeFormat";

describe("résumé formatting", () => {
  it("keeps contact information, legacy headings, and approved bullets intact", () => {
    const result = formatResume(
      "Zahi\nzahi@usc.edu\n\nSKILLS (self-reported)\nPython\n\nPROJECTS\n• Built a model with Python.",
      "Fallback",
    );
    expect(result.name).toBe("Zahi");
    expect(result.blocks).toEqual([
      { kind: "contact", text: "zahi@usc.edu" },
      { kind: "heading", text: "SKILLS (self-reported)" },
      { kind: "body", text: "Python" },
      { kind: "heading", text: "PROJECTS" },
      { kind: "bullet", text: "Built a model with Python." },
    ]);
  });
  it("does not invent missing résumé information", () => {
    expect(formatResume("", "Student")).toEqual({
      name: "Student",
      blocks: [],
    });
  });
});
