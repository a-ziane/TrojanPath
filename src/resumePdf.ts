/** Text-only PDF export; it never evaluates user HTML or sends résumé data away. */
export async function downloadResumePDF(name: string, text: string) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const margin = 48,
    width = 516,
    lineHeight = 16;
  let y = margin;
  doc.setProperties({ title: `${name} — Résumé`, author: name });
  doc.setFont("times", "normal");
  doc.setFontSize(11);
  for (const paragraph of text.replace(/\t/g, "    ").split("\n")) {
    const lines: string[] = doc.splitTextToSize(paragraph || " ", width);
    for (const line of lines) {
      if (y > 744) {
        doc.addPage();
        y = margin;
      }
      doc.text(line, margin, y);
      y += lineHeight;
    }
  }
  doc.save(
    `${name.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") || "TrojanPath"}-resume.pdf`,
  );
}
