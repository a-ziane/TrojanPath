import { formatResume } from "./resumeFormat";

/** Harvard-style, text-based PDF; résumé data stays on the student's device. */
export async function downloadResumePDF(
  name: string,
  text: string,
  options?: { title: string; suffix: string },
) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const margin = 54,
    width = 504,
    lineHeight = 14;
  let y = 58;
  const resume = formatResume(text, name);
  doc.setProperties({
    title: `${name} — ${options?.title || "Résumé"}`,
    author: name,
  });
  function room(height: number) {
    if (y + height > 738) {
      doc.addPage();
      y = 54;
    }
  }
  doc.setFont("times", "bold");
  doc.setFontSize(18);
  const nameLines: string[] = doc.splitTextToSize(resume.name, width);
  for (const line of nameLines) {
    room(22);
    doc.text(line, 306, y, { align: "center" });
    y += 22;
  }
  for (const block of resume.blocks) {
    const heading = block.kind === "heading",
      contact = block.kind === "contact",
      bullet = block.kind === "bullet";
    doc.setFont("times", heading ? "bold" : "normal");
    doc.setFontSize(contact ? 10 : 11);
    const indent = bullet ? 12 : 0;
    const lines: string[] = doc.splitTextToSize(block.text, width - indent);
    room(heading ? 42 : lineHeight);
    if (heading) y += 13;
    for (let i = 0; i < lines.length; i++) {
      room(lineHeight);
      if (bullet && i === 0) doc.text("•", margin, y);
      doc.text(
        lines[i],
        contact ? 306 : margin + indent,
        y,
        contact ? { align: "center" } : {},
      );
      y += lineHeight;
    }
    if (heading) {
      doc.setLineWidth(0.5);
      doc.line(margin, y - 9, margin + width, y - 9);
      y += 3;
    }
  }
  doc.save(
    `${name.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") || "TrojanPath"}-${options?.suffix || "resume"}.pdf`,
  );
}
